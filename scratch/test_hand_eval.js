const Hand = require('pokersolver').Hand;
const lodash = require('lodash');

const testScenario = (name, board, hands) => {
    console.log(`--- Testing Scenario: ${name} ---`);
    const participants = hands.map((hand, index) => {
        const solverCards = hand.concat(board);
        return {
            seatId: index + 1,
            solverCards: solverCards
        };
    });

    const solvedHands = participants.map(p => Hand.solve(p.solverCards));
    const winners = Hand.winners(solvedHands);

    console.log('Winners count:', winners.length);

    const findHandOwner = (cards) => {
        const participant = participants.find((participant) => {
            const sortedParticipant = [...participant.solverCards].sort();
            const sortedCards = [...cards].sort();
            const equal = lodash.isEqual(sortedParticipant, sortedCards);
            return equal;
        });
        return participant ? participant.seatId : 'NOT FOUND';
    };

    winners.forEach((winner, index) => {
        const winningCards = winner.cardPool.map(card => (card.value === '10' ? 'T' : card.value) + card.suit);
        console.log(`Winner ${index} (${winner.descr}) cardPool:`, winningCards);
        const seatId = findHandOwner(winningCards);
        console.log(`Winner ${index} seatId:`, seatId);
        if (seatId === 'NOT FOUND') {
            console.error('CRITICAL: Winner seatId NOT FOUND!');
            // Log what we have
            console.log('Available participants solverCards:');
            participants.forEach(p => console.log(`Seat ${p.seatId}:`, p.solverCards.sort()));
            console.log('Winning cards sorted:', winningCards.sort());
        }
    });
    console.log('\n');
};

// Scenario 1: Straight on board
testScenario('Straight on Board', ['Ad', 'Ks', 'Qh', 'Jc', 'Th'], [['2d', '3s'], ['4h', '5c']]);

// Scenario 2: Flush
testScenario('Flush', ['Ad', 'Kd', 'Qd', '2c', '3s'], [['Jd', 'Td'], ['2d', '5d']]);

// Scenario 3: Full House
testScenario('Full House', ['As', 'Ah', 'Kd', 'Ks', 'Qc'], [['Ad', 'Qs'], ['Kh', '2c']]);

// Scenario 4: High Card / Kicker
testScenario('Kicker Battle', ['As', 'Qd', '8h', '5c', '2s'], [['Kd', 'Js'], ['Ks', 'Ts']]);

