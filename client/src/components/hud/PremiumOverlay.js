import React from 'react';
import { Link } from 'react-router-dom';

const PremiumOverlay = ({ isPremium }) => {
  if (isPremium) return null;

  return (
    <div className="absolute top-4 right-4 z-50 w-64 rounded-xl border border-yellow-500/40 bg-slate-900/90 p-4 text-sm text-slate-100 shadow-lg">
      <div className="mb-2 flex items-center gap-2 text-yellow-400">
        <span className="text-lg">🔒</span>
        <span className="font-semibold">Unlock Premium HUD</span>
      </div>
      <p className="mb-3 text-xs text-slate-300">
        See win odds, advanced stats, and real-time hand insights.
      </p>
      <Link
        to="/premium"
        className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-yellow-400"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
};

export default PremiumOverlay;
