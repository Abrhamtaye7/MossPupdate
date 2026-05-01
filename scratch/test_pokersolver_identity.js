const Hand = require('pokersolver').Hand;

const p1 = Hand.solve(['Ad', 'Ks', 'Qh', 'Jc', 'Th', '2s', '3s']);
p1.myId = 'player1';

const p2 = Hand.solve(['Ad', 'Ks', 'Qh', 'Jc', 'Th', '4h', '5h']);
p2.myId = 'player2';

const winners = Hand.winners([p1, p2]);
console.log('Winners count:', winners.length);
winners.forEach(w => {
    console.log('Winner myId:', w.myId);
});
