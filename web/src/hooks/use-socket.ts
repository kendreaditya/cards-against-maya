'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, ClientToServerEvents, ServerToClientEvents } from '@/lib/types';

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('game-state', (state: ClientGameState) => {
      setGameState(state);
      setError(null);
    });

    socket.on('error', (message: string) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((playerName: string) => {
    socketRef.current?.emit('join-game', playerName);
  }, []);

  const startGame = useCallback((pointsToWin: number) => {
    socketRef.current?.emit('start-game', pointsToWin);
  }, []);

  const submitCard = useCallback((cardId: number) => {
    socketRef.current?.emit('submit-card', cardId);
  }, []);

  const pickWinner = useCallback((cardId: number) => {
    socketRef.current?.emit('pick-winner', cardId);
  }, []);

  const nextRound = useCallback(() => {
    socketRef.current?.emit('next-round');
  }, []);

  const playAgain = useCallback(() => {
    socketRef.current?.emit('play-again');
  }, []);

  return {
    gameState,
    error,
    connected,
    joinGame,
    startGame,
    submitCard,
    pickWinner,
    nextRound,
    playAgain,
  };
}
