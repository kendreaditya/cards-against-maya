'use client';

import { ClientPlayer } from '@/lib/types';

interface ScoreboardProps {
  players: ClientPlayer[];
  pointsToWin: number;
}

export default function Scoreboard({ players, pointsToWin }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 w-full max-w-xs">
      <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
        Scoreboard — first to {pointsToWin}
      </h3>
      <div className="space-y-1">
        {sorted.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm
              transition-all duration-200
              ${player.isCzar ? 'bg-white/5 border border-white/10' : ''}
              ${!player.isConnected ? 'opacity-40' : ''}`}
          >
            <span className="font-medium truncate mr-2">
              {player.name}
              {player.isCzar && (
                <span className="text-neutral-400 text-[10px] ml-1.5 uppercase tracking-wider font-bold">
                  Czar
                </span>
              )}
            </span>
            <span className="font-bold text-lg tabular-nums">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
