import React, { useMemo } from 'react';
import { getHandDescription } from '../../helpers/pokerHands';

const iconForHand = (description) => {
  if (description.includes('Straight Flush')) return '🟢';
  if (description.includes('Four of a Kind')) return '🟥';
  if (description.includes('Full House')) return '🟣';
  if (description.includes('Flush')) return '🟦';
  if (description.includes('Straight')) return '🟨';
  if (description.includes('Three of a Kind')) return '🟠';
  if (description.includes('Two Pair')) return '🟡';
  if (description.includes('Pair')) return '🟤';
  return '🟢';
};

const HandIdentifier = ({ hand, board }) => {
  const description = useMemo(() => getHandDescription(hand, board), [hand, board]);
  const icon = iconForHand(description);

  return (
    <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 shadow-lg">
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">Best Hand</span>
      <span>{description}</span>
    </div>
  );
};

export default HandIdentifier;
