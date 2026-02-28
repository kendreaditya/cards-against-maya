'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, ClientToServerEvents, ServerToClientEvents } from '@/lib/types';

const STORAGE_KEY = 'cards-against-maya-player';

function getStoredPlayer(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { playerName } = JSON.parse(stored);
    return playerName || null;
  } catch {
    return null;
  }
}

function storePlayer(playerName: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerName, joinedAt: Date.now() }));
  } catch {}
}

function clearStoredPlayer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [autoRejoining, setAutoRejoining] = useState(false);
  const hasAutoRejoined = useRef(false);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);

      // Auto-rejoin on reconnect if we have a stored player name
      const storedName = getStoredPlayer();
      if (storedName && !hasAutoRejoined.current) {
        hasAutoRejoined.current = true;
        setAutoRejoining(true);
        socket.emit('join-game', storedName);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('game-state', (state: ClientGameState) => {
      setGameState(state);
      setError(null);
      setAutoRejoining(false);
    });

    socket.on('error', (message: string) => {
      setError(message);
      setAutoRejoining(false);
      // If auto-rejoin failed (no game exists), clear stored name
      if (hasAutoRejoined.current) {
        clearStoredPlayer();
      }
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((playerName: string) => {
    storePlayer(playerName);
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

  const rateCards = useCallback((ratings: { cardId: number; rating: number }[]) => {
    socketRef.current?.emit('rate-cards', ratings);
  }, []);

  return {
    gameState,
    error,
    connected,
    autoRejoining,
    joinGame,
    startGame,
    submitCard,
    pickWinner,
    nextRound,
    playAgain,
    rateCards,
  };
}
