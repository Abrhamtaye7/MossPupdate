import React, { useEffect, useState } from 'react';
import { simulateWinOdds } from '../../helpers/pokerHands';

const WinProbability = ({ hand, board, opponents = 1 }) => {
  const [odds, setOdds] = useState({ win: 0, tie: 0, lose: 0 });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const result = simulateWinOdds({
        hand,
        board,
        opponents,
        iterations: 250,
      });
      if (isMounted) {
        setOdds(result);
        setIsCalculating(false);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [hand, board, opponents]);

  return (
    <div className="absolute top-16 left-1/2 z-50 w-72 -translate-x-1/2 rounded-xl bg-slate-900/80 p-3 text-xs text-slate-100 shadow-lg">
      {isCalculating ? (
        <div className="text-center text-slate-300">Calculating...</div>
      ) : (
        <>
          <div className="mb-2 flex justify-between text-[11px]">
            <span className="text-emerald-400">{odds.win}% Win</span>
            <span className="text-yellow-300">{odds.tie}% Tie</span>
            <span className="text-red-400">{odds.lose}% Lose</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${odds.win}%` }}
            />
            <div
              className="h-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${odds.tie}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${odds.lose}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WinProbability;
