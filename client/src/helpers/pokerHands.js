import { Hand } from 'pokersolver';

const toSolverCard = (card) => {
  if (!card) return null;
  const suit = card.suit.slice(0, 1);
  let rank;
  if (card.rank === '10') {
    rank = 'T';
  } else {
    rank =
      card.rank.length > 1 ? card.rank.slice(0, 1).toUpperCase() : card.rank;
  }
  return `${rank}${suit}`;
};

export const getHandDescription = (hand = [], board = []) => {
  const cards = [...hand, ...board].map(toSolverCard).filter(Boolean);
  if (cards.length < 2) return 'Awaiting cards';
  const solved = Hand.solve(cards);
  return solved?.descr || 'Awaiting cards';
};

const buildDeck = () => {
  const suits = ['s', 'h', 'd', 'c'];
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const deck = [];
  suits.forEach((suit) =>
    ranks.forEach((rank) => deck.push({ suit, rank })),
  );
  return deck;
};

const removeKnownCards = (deck, known) => {
  const knownSet = new Set(known.map((card) => `${card.rank}${card.suit}`));
  return deck.filter((card) => !knownSet.has(`${card.rank}${card.suit}`));
};

const drawRandom = (deck) => {
  const index = Math.floor(Math.random() * deck.length);
  return deck.splice(index, 1)[0];
};

export const simulateWinOdds = ({
  hand,
  board,
  opponents = 1,
  iterations = 300,
}) => {
  if (!hand || hand.length < 2) {
    return { win: 0, tie: 0, lose: 0 };
  }

  let win = 0;
  let tie = 0;
  let lose = 0;

  for (let i = 0; i < iterations; i++) {
    const deck = removeKnownCards(buildDeck(), [...hand, ...board]);
    const simulatedBoard = [...board];
    while (simulatedBoard.length < 5 && deck.length > 0) {
      simulatedBoard.push(drawRandom(deck));
    }

    const heroHand = Hand.solve(
      [...hand, ...simulatedBoard].map(toSolverCard),
    );

    const opponentHands = [];
    for (let j = 0; j < opponents; j++) {
      const opponentCards = [drawRandom(deck), drawRandom(deck)];
      opponentHands.push(
        Hand.solve(
          [...opponentCards, ...simulatedBoard].map(toSolverCard),
        ),
      );
    }

    const winners = Hand.winners([heroHand, ...opponentHands]);
    if (winners.length > 1 && winners.includes(heroHand)) {
      tie++;
    } else if (winners[0] === heroHand) {
      win++;
    } else {
      lose++;
    }
  }

  const total = win + tie + lose || 1;
  return {
    win: Math.round((win / total) * 100),
    tie: Math.round((tie / total) * 100),
    lose: Math.round((lose / total) * 100),
  };
};
