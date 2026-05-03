import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { BetSlider } from './BetSlider';
import modalContext from '../../context/modal/modalContext';
import Button from '../buttons/Button';

const ActionPanel = ({
  currentTable,
  seatId,
  bet,
  setBet,
  raise,
  standUp,
  fold,
  check,
  call,
}) => {
  const { openModal, closeModal } = useContext(modalContext);
  const [autoFold, setAutoFold] = useState(false);
  const [autoCheckFold, setAutoCheckFold] = useState(false);
  const handledTurnRef = useRef(false);

  const seat = currentTable?.seats?.[seatId];
  const isTurn = Boolean(seat?.turn);
  const callAmount = currentTable?.callAmount || 0;
  const callDiff = Math.max(callAmount - (seat?.bet || 0), 0);
  const canCheck = callDiff <= 0;
  const maxRaise =
    seat && currentTable
      ? Math.min(seat.stack + seat.bet, currentTable.limit)
      : 0;

  const raiseLabel = useMemo(() => {
    const value = bet || 0;
    return `Raise to ${value}`;
  }, [bet]);

  useEffect(() => {
    if (isTurn) {
      if (!handledTurnRef.current) {
        if (autoFold) {
          fold();
          handledTurnRef.current = true;
          return;
        }
        if (autoCheckFold) {
          if (canCheck) {
            check();
          } else {
            fold();
          }
          handledTurnRef.current = true;
        }
      }
    } else {
      handledTurnRef.current = false;
    }
  }, [autoFold, autoCheckFold, canCheck, check, fold, isTurn]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isTurn) return;
      if (event.key.toLowerCase() === 'f') {
        fold();
      }
      if (event.key.toLowerCase() === 'c') {
        canCheck ? check() : call();
      }
      if (event.key.toLowerCase() === 'r') {
        raise(bet);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTurn, fold, check, call, raise, bet, canCheck]);

  const handleAllIn = () => {
    if (!seat) return;
    openModal(
      () => (
        <div className="text-center text-sm text-slate-200">
          Go all-in for {seat.stack} chips?
        </div>
      ),
      'Confirm All-In',
      'Cancel',
      () => {
        raise(seat.stack + seat.bet);
        closeModal();
      },
      () => closeModal(),
    );
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-2xl -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button small secondary disabled={!isTurn} onClick={standUp}>
          Stand Up
        </Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-300">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={autoFold}
              onChange={(e) => setAutoFold(e.target.checked)}
            />
            Auto-fold
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={autoCheckFold}
              onChange={(e) => setAutoCheckFold(e.target.checked)}
            />
            Auto-check/fold
          </label>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        <BetSlider
          currentTable={currentTable}
          seatId={seatId}
          bet={bet}
          setBet={setBet}
        />
        <div className="flex flex-wrap gap-2">
          <Button small disabled={!isTurn} onClick={fold}>
            Fold
          </Button>
          <Button small disabled={!isTurn} onClick={canCheck ? check : call}>
            {canCheck ? 'Check' : `Call ${callDiff}`}
          </Button>
          <Button small disabled={!isTurn || bet > maxRaise} onClick={() => raise(bet)}>
            {raiseLabel}
          </Button>
          <Button small disabled={!isTurn} onClick={handleAllIn}>
            All-in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
