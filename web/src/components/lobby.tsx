'use client';

interface LobbyProps {
  players: { id: string; name: string; isHost: boolean }[];
  isHost: boolean;
  onStart: (pointsToWin: number) => void;
}

export default function Lobby({ players, isHost, onStart }: LobbyProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Game Lobby</h2>
        <p className="text-sm text-muted animate-subtle-pulse">
          Waiting for players to join...
        </p>
      </div>

      <div className="w-full max-w-sm">
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted">
          Players ({players.length})
        </h3>
        <div className="space-y-2 stagger-children">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between
                transition-all duration-200 hover:bg-surface-hover"
            >
              <span className="font-medium">{player.name}</span>
              {player.isHost && (
                <span className="text-[11px] bg-white text-black px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <p className="text-sm text-muted">
            {players.length < 3
              ? `Need ${3 - players.length} more player${3 - players.length > 1 ? 's' : ''}`
              : 'Ready to start!'}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {[3, 5, 7, 10].map((pts) => (
              <button
                key={pts}
                onClick={() => onStart(pts)}
                disabled={players.length < 3}
                className="bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600
                  disabled:cursor-not-allowed text-black font-bold py-2.5 px-5 rounded-lg
                  transition-all duration-200 active:scale-[0.97]"
              >
                Play to {pts}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isHost && (
        <p className="text-muted text-sm">Waiting for host to start the game...</p>
      )}
    </div>
  );
}
