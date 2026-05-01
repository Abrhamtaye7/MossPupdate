const Hand = require('pokersolver').Hand;
const hand = Hand.solve(['Th', 'Ad']);
console.log('Input: Th, Ad');
hand.cardPool.forEach((c, i) => {
    console.log(`cardPool[${i}]: value=${c.value}, suit=${c.suit}`);
});

const hand2 = Hand.solve(['10h', 'Ad']);
console.log('Input: 10h, Ad');
hand2.cardPool.forEach((c, i) => {
    console.log(`cardPool[${i}]: value=${c.value}, suit=${c.suit}`);
});

