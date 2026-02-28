'use client';

import { ClientPlayer } from '@/lib/types';

interface ScoreboardProps {
  players: ClientPlayer[];
  pointsToWin: number;
  compact?: boolean;
}

export default function Scoreboard({ players, pointsToWin, compact = false }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (compact) {
    // Horizontal compact bar for mobile
    return (
      <div className="px-3 py-2 flex items-center gap-1 overflow-x-auto">
        <span className="text-[10px] text-muted uppercase tracking-wider font-bold mr-1 flex-shrink-0">
          First to {pointsToWin}
        </span>
        <div className="flex gap-1 flex-shrink-0">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                ${!player.isConnected ? 'opacity-40' : ''}
                ${player.isCzar ? 'bg-white/10 border border-white/10' : 'bg-surface'}
                ${i === 0 && player.score > 0 ? 'border border-white/20' : ''}`}
            >
              <span className="font-medium truncate max-w-[60px]">
                {player.name}
              </span>
              <span className="font-bold tabular-nums">{player.score}</span>
              {player.isCzar && (
                <span className="text-[9px] text-neutral-500 uppercase">C</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop vertical sidebar
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
