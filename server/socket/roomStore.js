const Table = require('../pokergame/Table');
const Player = require('../pokergame/Player');

const tiers = [
  { label: '10/20', limit: 2000 },
  { label: '20/40', limit: 4000 },
  { label: '50/100', limit: 10000 },
  { label: '500/1000', limit: 100000 },
];

let nextTableId = 1;
const tables = {};
const players = {};

function createTable({ label, limit, maxPlayers = 5 }) {
  const id = nextTableId++;
  const table = new Table(id, `${label} Room`, limit, maxPlayers);
  table.tier = label;
  table.createdAt = new Date();
  table.lastActiveAt = new Date();
  table.status = 'waiting';
  table.actionLog = [];
  tables[id] = table;
  return table;
}

function initializeTables() {
  tiers.forEach((tier) => createTable({ label: tier.label, limit: tier.limit }));
}

function getCurrentPlayers() {
  return Object.values(players).map((player) => ({
    socketId: player.socketId,
    id: player.id,
    name: player.name,
    avatarUrl: player.avatarUrl || null,
    isPremium: Boolean(player.isPremium),
  }));
}

function getCurrentTables() {
  return Object.values(tables).map((table) => ({
    id: table.id,
    name: table.name,
    limit: table.limit,
    maxPlayers: table.maxPlayers,
    currentNumberPlayers: table.players.length,
    smallBlind: table.minBet,
    bigBlind: table.minBet * 2,
    tier: table.tier,
    minBuyIn: table.minBet * 2 * 10,
    status: table.players.length > 0 ? 'active' : 'waiting',
  }));
}

function getTableById(tableId) {
  return tables[tableId];
}

function getActiveRooms() {
  return Object.values(tables).filter((table) => table.players.length > 0);
}

function createRoom(label, limit) {
  return createTable({ label, limit });
}

function removeEmptyStaleRooms(cutoffMs) {
  const now = Date.now();
  Object.values(tables).forEach((table) => {
    if (
      table.players.length === 0 &&
      now - new Date(table.lastActiveAt).getTime() > cutoffMs &&
      table.id > tiers.length
    ) {
      delete tables[table.id];
    }
  });
}

function updateTableActivity(table) {
  if (!table) return;
  table.lastActiveAt = new Date();
  table.status = table.players.length > 0 ? 'active' : 'waiting';
}

function registerPlayer({
  socketId,
  userId,
  name,
  chipsAmount,
  isPremium,
  avatarUrl,
  isAdmin,
  phone,
  ip,
}) {
  players[socketId] = new Player(
    socketId,
    userId,
    name,
    chipsAmount,
    isPremium,
    avatarUrl,
    isAdmin,
    phone,
    ip,
  );
  return players[socketId];
}

function unregisterPlayer(socketId) {
  delete players[socketId];
}

function getPlayer(socketId) {
  return players[socketId];
}

module.exports = {
  tiers,
  tables,
  players,
  initializeTables,
  getCurrentPlayers,
  getCurrentTables,
  getTableById,
  getActiveRooms,
  createRoom,
  removeEmptyStaleRooms,
  updateTableActivity,
  registerPlayer,
  unregisterPlayer,
  getPlayer,
};
