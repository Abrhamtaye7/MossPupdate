const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Hand } = require('pokersolver');
const {
  FETCH_LOBBY_INFO,
  RECEIVE_LOBBY_INFO,
  PLAYERS_UPDATED,
  JOIN_TABLE,
  TABLE_JOINED,
  TABLES_UPDATED,
  LEAVE_TABLE,
  TABLE_LEFT,
  FOLD,
  CHECK,
  CALL,
  RAISE,
  TABLE_MESSAGE,
  SIT_DOWN,
  REBUY,
  STAND_UP,
  SITTING_OUT,
  SITTING_IN,
  DISCONNECT,
  TABLE_UPDATED,
  WINNER,
  ADMIN_METRICS_SUBSCRIBE,
  ADMIN_METRICS_UPDATE,
  CHAT_MESSAGE,
  CREATE_ROOM,
  RABBIT_HUNT,
  RABBIT_HUNT_RESULT,
} = require('../pokergame/actions');
const config = require('../config');
const {
  initializeTables,
  getCurrentPlayers,
  getCurrentTables,
  getTableById,
  updateTableActivity,
  registerPlayer,
  unregisterPlayer,
  getPlayer,
  players,
  tables,
  createRoom,
} = require('./roomStore');

initializeTables();
const adminSubscribers = new Set();
let metricsInterval = null;

const init = (socket, io) => {
  socket.on(FETCH_LOBBY_INFO, async (token) => {
    let user;

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) console.log(err);
      else {
        user = decoded.user;
      }
    });

    if (user) {
      const found = Object.values(players).find((player) => player.id == user.id);

      if (found) {
        delete players[found.socketId];
        Object.values(tables).forEach((table) => {
          table.removePlayer(found.socketId);
          updateTableActivity(table);
          broadcastToTable(table);
        });
      }

      user = await User.findById(user.id).select('-password');

      registerPlayer({
        socketId: socket.id,
        userId: user._id,
        name: user.name,
        chipsAmount: user.chipsAmount,
        isPremium: user.isPremium,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
        phone: user.phone,
        ip: socket.handshake.address,
      });

      socket.emit(RECEIVE_LOBBY_INFO, {
        tables: getCurrentTables(),
        players: getCurrentPlayers(),
        socketId: socket.id,
      });
      socket.broadcast.emit(PLAYERS_UPDATED, getCurrentPlayers());
    }
  });

  socket.on(JOIN_TABLE, (tableId) => {
    const table = getTableById(tableId);
    const player = getPlayer(socket.id);
    if (!table || !player) return;

    table.addPlayer(player);
    updateTableActivity(table);

    socket.emit(TABLE_JOINED, { tables: getCurrentTables(), tableId });
    socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());

    if (table.players && table.players.length > 0 && player) {
      let message = `${player.name} joined the table.`;
      broadcastToTable(table, message, null, 'system');
    }
  });

  socket.on(LEAVE_TABLE, (tableId) => {
    const table = getTableById(tableId);
    const player = getPlayer(socket.id);
    if (!table) return;
    const seat = Object.values(table.seats).find(
      (seat) => seat && seat.player.socketId === socket.id,
    );

    if (seat && player) {
      updatePlayerBankroll(player, seat.stack);
    }

    table.removePlayer(socket.id);
    updateTableActivity(table);

    socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());
    socket.emit(TABLE_LEFT, { tables: getCurrentTables(), tableId });

    if (table.players && table.players.length > 0 && player) {
      let message = `${player.name} left the table.`;
      broadcastToTable(table, message, null, 'system');
    }

    if (table.activePlayers().length === 1) {
      clearForOnePlayer(table);
    }
  });

  socket.on(FOLD, (tableId) => {
    let table = getTableById(tableId);
    if (!table) return;
    let res = table.handleFold(socket.id);
    if (res) {
      logAction(table, res.message, res.seatId, FOLD);
      broadcastToTable(table, res.message, null, 'system');
    }
    res && changeTurnAndBroadcast(table, res.seatId);
  });

  socket.on(CHECK, (tableId) => {
    let table = getTableById(tableId);
    if (!table) return;
    let res = table.handleCheck(socket.id);
    if (res) {
      logAction(table, res.message, res.seatId, CHECK);
      broadcastToTable(table, res.message, null, 'system');
    }
    res && changeTurnAndBroadcast(table, res.seatId);
  });

  socket.on(CALL, (tableId) => {
    let table = getTableById(tableId);
    if (!table) return;
    let res = table.handleCall(socket.id);
    if (res) {
      logAction(table, res.message, res.seatId, CALL);
      broadcastToTable(table, res.message, null, 'system');
    }
    res && changeTurnAndBroadcast(table, res.seatId);
  });

  socket.on(RAISE, ({ tableId, amount }) => {
    let table = getTableById(tableId);
    if (!table) return;
    let res = table.handleRaise(socket.id, amount);
    if (res) {
      logAction(table, res.message, res.seatId, RAISE);
      broadcastToTable(table, res.message, null, 'system');
    }
    res && changeTurnAndBroadcast(table, res.seatId);
  });

  socket.on(TABLE_MESSAGE, ({ message, from, tableId }) => {
    let table = getTableById(tableId);
    if (!table) return;
    broadcastToTable(table, message, from, 'dealer');
  });

  socket.on(CHAT_MESSAGE, ({ message, from, tableId }) => {
    const table = getTableById(tableId);
    if (!table) return;
    const chatMessage = createMessage({
      text: message,
      from,
      type: 'user',
    });
    broadcastToTable(table, chatMessage, from, 'user');
  });

  socket.on(CREATE_ROOM, ({ tierLabel, limit }) => {
    const player = getPlayer(socket.id);
    if (!player) return;
    const newTable = createRoom(tierLabel || 'Custom', limit || 10000);
    newTable.addPlayer(player);
    updateTableActivity(newTable);
    socket.emit(TABLE_JOINED, { tables: getCurrentTables(), tableId: newTable.id });
    socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());
    broadcastToTable(newTable, `${player.name} created a new table.`, null, 'dealer');
  });

  socket.on(ADMIN_METRICS_SUBSCRIBE, async () => {
    adminSubscribers.add(socket.id);
    ensureMetricsInterval(io);
    await sendAdminMetrics(io);
  });

  socket.on(RABBIT_HUNT, ({ tableId }) => {
    const table = getTableById(tableId);
    if (!table || !table.deck) return;
    const seat = Object.values(table.seats).find(
      (seat) => seat && seat.player.socketId === socket.id,
    );
    if (!seat || !seat.folded || table.handOver) return;
    const nextCard = pickRandomCard(table.deck.cards);
    if (!nextCard) return;
    const handDesc = describeHand(seat.hand, table.board, nextCard);
    socket.emit(RABBIT_HUNT_RESULT, {
      card: nextCard,
      hand: handDesc,
    });
  });

  socket.on(SIT_DOWN, ({ tableId, seatId, amount }) => {
    const table = getTableById(tableId);
    const player = getPlayer(socket.id);
    if (!table || !player) return;

    table.sitPlayer(player, seatId, amount);
    let message = `${player.name} sat down in Seat ${seatId}`;

    updatePlayerBankroll(player, -amount);
    updateTableActivity(table);

    logAction(table, message, seatId, SIT_DOWN);
    broadcastToTable(table, message, null, 'system');
    if (table.activePlayers().length === 2) {
      initNewHand(table);
    }
  });

  socket.on(REBUY, ({ tableId, seatId, amount }) => {
    const table = getTableById(tableId);
    const player = getPlayer(socket.id);
    if (!table || !player) return;

    table.rebuyPlayer(seatId, amount);
    updatePlayerBankroll(player, -amount);
    updateTableActivity(table);

    broadcastToTable(table);
  });

  socket.on(STAND_UP, (tableId) => {
    const table = getTableById(tableId);
    const player = getPlayer(socket.id);
    if (!table) return;
    const seat = Object.values(table.seats).find(
      (seat) => seat && seat.player.socketId === socket.id,
    );

    let message = '';
    if (seat) {
      updatePlayerBankroll(player, seat.stack);
      message = `${player.name} left the table`;
    }

    table.standPlayer(socket.id);
    updateTableActivity(table);

    if (message) {
      logAction(table, message, seat?.id, STAND_UP);
      broadcastToTable(table, message, null, 'system');
    } else {
      broadcastToTable(table);
    }
    if (table.activePlayers().length === 1) {
      clearForOnePlayer(table);
    }
  });

  socket.on(SITTING_OUT, ({ tableId, seatId }) => {
    const table = getTableById(tableId);
    if (!table) return;
    const seat = table.seats[seatId];
    seat.sittingOut = true;
    updateTableActivity(table);

    broadcastToTable(table);
  });

  socket.on(SITTING_IN, ({ tableId, seatId }) => {
    const table = getTableById(tableId);
    if (!table) return;
    const seat = table.seats[seatId];
    seat.sittingOut = false;
    updateTableActivity(table);

    broadcastToTable(table);
    if (table.handOver && table.activePlayers().length === 2) {
      initNewHand(table);
    }
  });

  socket.on(DISCONNECT, () => {
    const seat = findSeatBySocketId(socket.id);
    if (seat) {
      updatePlayerBankroll(seat.player, seat.stack);
    }

    unregisterPlayer(socket.id);
    removeFromTables(socket.id);

    socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());
    socket.broadcast.emit(PLAYERS_UPDATED, getCurrentPlayers());
    adminSubscribers.delete(socket.id);
  });

  async function updatePlayerBankroll(player, amount) {
    const user = await User.findById(player.id);
    if (user) {
      user.chipsAmount += amount;
      await user.save();
    }

    const currentPlayer = getPlayer(socket.id);
    if (currentPlayer) {
      currentPlayer.bankroll += amount;
      io.to(socket.id).emit(PLAYERS_UPDATED, getCurrentPlayers());
    }
  }

  function findSeatBySocketId(socketId) {
    let foundSeat = null;
    Object.values(tables).forEach((table) => {
      Object.values(table.seats).forEach((seat) => {
        if (seat && seat.player.socketId === socketId) {
          foundSeat = seat;
        }
      });
    });
    return foundSeat;
  }

  function removeFromTables(socketId) {
    for (let i = 0; i < Object.keys(tables).length; i++) {
      const table = tables[Object.keys(tables)[i]];
      table.removePlayer(socketId);
      updateTableActivity(table);
    }
  }

  function broadcastToTable(table, message = null, from = null, type = 'system') {
    const outgoingMessage =
      message && typeof message === 'object'
        ? message
        : message
          ? createMessage({ text: message, from, type })
          : null;

    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId;
      let tableCopy = hideOpponentCards(table, socketId);
      io.to(socketId).emit(TABLE_UPDATED, {
        table: tableCopy,
        message: outgoingMessage,
      });
    }
  }

  function createMessage({ text, from, type }) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      from: from || null,
      type,
      timestamp: new Date().toISOString(),
    };
  }

  function logAction(table, message, seatId, actionType) {
    if (!table) return;
    table.actionLog = table.actionLog || [];
    table.actionLog.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      seatId,
      actionType,
      timestamp: new Date().toISOString(),
    });
    if (table.actionLog.length > 200) {
      table.actionLog.shift();
    }
  }

  function pickRandomCard(cards) {
    if (!cards || cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)];
  }

  function mapCardForSolver(card) {
    const suit = card.suit.slice(0, 1);
    let rank;
    if (card.rank === '10') {
      rank = 'T';
    } else {
      rank = card.rank.length > 1 ? card.rank.slice(0, 1).toUpperCase() : card.rank;
    }
    return rank + suit;
  }

  function describeHand(hand, board, nextCard) {
    const cards = []
      .concat(hand || [])
      .concat(board || [])
      .concat(nextCard ? [nextCard] : []);
    if (cards.length < 2) return 'Unknown';
    const solverCards = cards.map(mapCardForSolver);
    const solved = Hand.solve(solverCards);
    return solved?.descr || 'Unknown';
  }

  function ensureMetricsInterval(io) {
    if (metricsInterval) return;
    metricsInterval = setInterval(() => {
      sendAdminMetrics(io);
    }, 15000);
  }

  async function buildMetricsSnapshot() {
    const totalLiquidityAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$chipsAmount' } } },
    ]);
    const totalLiquidity = totalLiquidityAgg.length
      ? totalLiquidityAgg[0].total
      : 0;
    const activeGames = getCurrentTables().filter((table) => table.status === 'active')
      .length;
    return {
      totalLiquidity,
      activeGames,
      pendingApprovals: 0,
      timestamp: new Date().toISOString(),
    };
  }

  async function sendAdminMetrics(io) {
    if (adminSubscribers.size === 0) return;
    const metrics = await buildMetricsSnapshot();
    adminSubscribers.forEach((socketId) => {
      io.to(socketId).emit(ADMIN_METRICS_UPDATE, metrics);
    });
  }

  function changeTurnAndBroadcast(table, seatId) {
    setTimeout(() => {
      table.changeTurn(seatId);
      updateTableActivity(table);
      broadcastToTable(table);

      if (table.handOver) {
        initNewHand(table);
      }
    }, 1000);
  }

  function initNewHand(table) {
    if (table.activePlayers().length > 1) {
      broadcastToTable(table, '---New hand starting in 5 seconds---', null, 'dealer');
    }
    setTimeout(() => {
      table.clearWinMessages();
      table.startHand();
      updateTableActivity(table);
      broadcastToTable(table, '--- New hand started ---', null, 'dealer');
    }, 5000);
  }

  function clearForOnePlayer(table) {
    table.clearWinMessages();
    setTimeout(() => {
      table.clearSeatHands();
      table.resetBoardAndPot();
      updateTableActivity(table);
      broadcastToTable(table, 'Waiting for more players', null, 'dealer');
    }, 5000);
  }

  function hideOpponentCards(table, socketId) {
    let tableCopy = JSON.parse(JSON.stringify(table));
    let hiddenCard = { suit: 'hidden', rank: 'hidden' };
    let hiddenHand = [hiddenCard, hiddenCard];

    for (let i = 1; i <= tableCopy.maxPlayers; i++) {
      let seat = tableCopy.seats[i];
      if (
        seat &&
        seat.hand.length > 0 &&
        seat.player.socketId !== socketId &&
        !(seat.lastAction === WINNER && tableCopy.wentToShowdown)
      ) {
        seat.hand = hiddenHand;
      }
    }
    return tableCopy;
  }
};

module.exports = { init };
