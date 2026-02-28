'use client';

import { useState, useEffect } from 'react';
import { ClientGameState } from '@/lib/types';
import PromptCard from './prompt-card';
import Card from './card';

interface JudgingPhaseProps {
  gameState: ClientGameState;
  onPickWinner: (cardId: number) => void;
}

export default function JudgingPhase({ gameState, onPickWinner }: JudgingPhaseProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const round = gameState.currentRound;

  // Reset selection when round changes
  useEffect(() => { setSelectedId(null); }, [round?.number]);

  if (!round) return null;

  const isCzar = round.czarId === gameState.myId;

  return (
    <div className="flex flex-col items-center gap-6 p-4 animate-fade-in-up">
      <p className="text-sm text-muted animate-fade-in-down">
        Round {round.number} — Judging
      </p>

      <div className="w-full max-w-sm">
        <PromptCard card={round.promptCard} />
      </div>

      {isCzar ? (
        <>
          <p className="text-white font-bold animate-fade-in">Pick the funniest card!</p>
          <div className="flex flex-wrap gap-4 justify-center stagger-deal">
            {round.submissions.map((sub) => (
              <Card
                key={sub.card.id}
                text={sub.card.text}
                type="response"
                selected={selectedId === sub.card.id}
                onClick={() => setSelectedId(sub.card.id)}
              />
            ))}
          </div>
          {selectedId !== null && (
            <button
              onClick={() => {
                onPickWinner(selectedId);
                setSelectedId(null);
              }}
              className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-xl text-lg
                transition-all duration-200 active:scale-[0.97] animate-scale-in"
            >
              This one wins!
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-muted font-medium animate-subtle-pulse">
            The Card Czar is choosing...
          </p>
          <div className="flex flex-wrap gap-4 justify-center stagger-deal">
            {round.submissions.map((sub) => (
              <Card
                key={sub.card.id}
                text={sub.card.text}
                type="response"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
