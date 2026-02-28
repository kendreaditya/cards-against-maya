'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { ClientGameState } from '@/lib/types';

interface GameContextType {
  gameState: ClientGameState | null;
  error: string | null;
  connected: boolean;
  joinGame: (playerName: string) => void;
  startGame: (pointsToWin: number) => void;
  submitCard: (cardId: number) => void;
  pickWinner: (cardId: number) => void;
  nextRound: () => void;
  playAgain: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();

  return (
    <GameContext.Provider value={socket}>{children}</GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
