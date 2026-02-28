'use client';

import { ClientGameState } from '@/lib/types';

interface GameOverProps {
  gameState: ClientGameState;
  onPlayAgain: () => void;
}

export default function GameOver({ gameState, onPlayAgain }: GameOverProps) {
  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isHost = gameState.hostId === gameState.myId;

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-fade-in-up">
      <h2 className="text-3xl font-black text-white animate-fade-in-down">
        Game Over
      </h2>

      <div className="text-center animate-scale-in">
        <div className="text-5xl mb-3 animate-trophy">
          <span className="inline-block">&#9733;</span>
        </div>
        <p className="text-2xl font-bold">{winner.name}</p>
        <p className="text-muted">wins with {winner.score} points</p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
          Final Scores
        </h3>
        <div className="space-y-1 stagger-children">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg
                ${i === 0 ? 'bg-white/5' : ''}`}
            >
              <span className="font-medium">
                <span className="text-neutral-600 mr-2 text-sm">#{i + 1}</span>
                {player.name}
              </span>
              <span className="font-bold text-lg tabular-nums">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <button
          onClick={onPlayAgain}
          className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-xl text-lg
            transition-all duration-200 active:scale-[0.97] animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          Play Again
        </button>
      )}
    </div>
  );
}
