'use client';

import { ClientPlayer } from '@/lib/types';

interface PlayerListProps {
  players: ClientPlayer[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {players.map((player) => (
        <div
          key={player.id}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border ${
            !player.isConnected
              ? 'bg-neutral-900 text-neutral-600 border-neutral-800'
              : player.hasSubmitted
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-surface text-neutral-400 border-border'
          }`}
        >
          {player.name}
          {player.hasSubmitted && (
            <span className="ml-1 text-neutral-400">&#10003;</span>
          )}
        </div>
      ))}
    </div>
  );
}
