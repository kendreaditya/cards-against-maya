'use client';

import { useState, useEffect } from 'react';
import { ClientGameState } from '@/lib/types';
import PromptCard from './prompt-card';
import CardHand from './card-hand';
import PlayerList from './player-list';

interface PlayingPhaseProps {
  gameState: ClientGameState;
  onSubmit: (cardId: number) => void;
}

export default function PlayingPhase({ gameState, onSubmit }: PlayingPhaseProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const round = gameState.currentRound;

  // Reset selection when round changes
  useEffect(() => { setSelectedId(null); }, [round?.number]);

  if (!round) return null;
  const isCzar = round.czarId === gameState.myId;
  const hasSubmitted = gameState.players.find(
    (p) => p.id === gameState.myId
  )?.hasSubmitted;

  return (
    <div className="flex flex-col items-center gap-6 p-4 pb-8 animate-fade-in-up">
      <div className="text-center animate-fade-in-down">
        <p className="text-sm text-muted mb-1">Round {round.number}</p>
        <p className="text-xs text-neutral-600">
          {round.submissionCount} / {round.totalExpected} cards played
        </p>
      </div>

      <div className="w-full max-w-sm">
        <PromptCard card={round.promptCard} />
      </div>

      <PlayerList players={gameState.players} />

      {isCzar ? (
        <div className="text-center animate-fade-in-up">
          <p className="text-white font-bold text-lg">
            You are the Card Czar
          </p>
          <p className="text-sm text-muted font-normal mt-1 animate-subtle-pulse">
            Waiting for other players to submit...
          </p>
        </div>
      ) : hasSubmitted ? (
        <div className="text-center text-neutral-400 font-medium animate-fade-in">
          Card submitted. Waiting for others...
        </div>
      ) : (
        <>
          <p className="text-muted text-sm">Pick your best card:</p>
          <CardHand
            cards={gameState.myHand}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {selectedId !== null && (
            <button
              onClick={() => {
                onSubmit(selectedId);
                setSelectedId(null);
              }}
              className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-xl text-lg
                transition-all duration-200 active:scale-[0.97] animate-scale-in"
            >
              Submit Card
            </button>
          )}
        </>
      )}
    </div>
  );
}
