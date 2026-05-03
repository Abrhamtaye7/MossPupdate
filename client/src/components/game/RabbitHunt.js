import React, { useEffect } from 'react';
import PokerCard from './PokerCard';

const RabbitHunt = ({ canHunt, result, onHunt, onClear }) => {
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      onClear();
    }, 3000);
    return () => clearTimeout(timer);
  }, [result, onClear]);

  return (
    <div className="absolute left-4 top-24 z-40 w-56 rounded-xl border border-emerald-500/30 bg-slate-900/90 p-3 text-xs text-slate-100 shadow-lg">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
        Rabbit Hunt
      </div>
      {canHunt ? (
        <button
          className="w-full rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900"
          onClick={onHunt}
        >
          Hunt Rabbit
        </button>
      ) : (
        <p className="text-slate-400">Fold to unlock rabbit hunt.</p>
      )}
      {result && (
        <div className="mt-3 text-center">
          <p className="mb-2">Next Card Would Have Been:</p>
          <div className="mx-auto w-12">
            <PokerCard card={result.card} />
          </div>
          <p className="mt-2 text-yellow-300">
            Would Have Made: {result.hand}
          </p>
        </div>
      )}
    </div>
  );
};

export default RabbitHunt;
