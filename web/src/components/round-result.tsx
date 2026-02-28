'use client';

import { ClientGameState } from '@/lib/types';
import PromptCard from './prompt-card';
import Card from './card';

interface RoundResultProps {
  gameState: ClientGameState;
  onNextRound: () => void;
}

export default function RoundResult({ gameState, onNextRound }: RoundResultProps) {
  const round = gameState.currentRound;
  if (!round) return null;

  const winnerName = round.submissions.find(
    (s) => s.playerId === round.winnerId
  )?.playerName ?? 'Someone';
  const isHost = gameState.hostId === gameState.myId;

  return (
    <div className="flex flex-col items-center gap-6 p-4 animate-fade-in-up">
      <p className="text-sm text-muted">Round {round.number} — Result</p>

      <div className="w-full max-w-sm">
        <PromptCard card={round.promptCard} />
      </div>

      <div className="text-center animate-scale-in">
        <p className="text-white font-bold text-xl mb-2">
          {winnerName} wins this round!
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center stagger-deal">
        {round.submissions.map((sub) => (
          <div key={sub.card.id} className="text-center">
            <Card
              text={sub.card.text}
              type="response"
              highlighted={sub.card.id === round.winningCard?.id}
            />
            <p className="text-xs text-muted mt-2">{sub.playerName}</p>
          </div>
        ))}
      </div>

      {isHost && (
        <button
          onClick={onNextRound}
          className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-xl text-lg
            transition-all duration-200 active:scale-[0.97] animate-fade-in-up"
        >
          Next Round
        </button>
      )}

      {!isHost && (
        <p className="text-muted text-sm animate-subtle-pulse">
          Waiting for host to continue...
        </p>
      )}
    </div>
  );
}
