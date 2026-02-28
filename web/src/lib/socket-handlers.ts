import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  joinGame,
  startGame,
  submitCard,
  pickWinner,
  nextRound,
  playAgain,
  handleDisconnect,
  getGame,
  getClientState,
} from './game-manager';
import { ClientToServerEvents, ServerToClientEvents } from './types';

export function setupSocketHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-game', (playerName: string) => {
      try {
        if (typeof playerName !== 'string' || playerName.trim().length === 0) {
          throw new Error('Player name is required');
        }
        if (playerName.trim().length > 20) {
          throw new Error('Name too long (max 20 characters)');
        }
        // Prevent double-join from same socket
        const existingGame = getGame();
        if (existingGame?.players.some((p) => p.id === socket.id && p.isConnected)) {
          throw new Error('You have already joined');
        }
        const game = joinGame(socket.id, playerName.trim());
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('start-game', (pointsToWin: number) => {
      try {
        if (typeof pointsToWin !== 'number' || !Number.isInteger(pointsToWin) || pointsToWin < 1 || pointsToWin > 50) {
          throw new Error('Points to win must be between 1 and 50');
        }
        startGame(socket.id, pointsToWin);
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('submit-card', (cardId: number) => {
      try {
        if (typeof cardId !== 'number' || !Number.isInteger(cardId)) {
          throw new Error('Invalid card');
        }
        submitCard(socket.id, cardId);
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('pick-winner', (cardId: number) => {
      try {
        if (typeof cardId !== 'number' || !Number.isInteger(cardId)) {
          throw new Error('Invalid card');
        }
        pickWinner(socket.id, cardId);
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('next-round', () => {
      try {
        nextRound(socket.id);
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('play-again', () => {
      try {
        playAgain(socket.id);
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      const result = handleDisconnect(socket.id);
      if (result) {
        broadcastGameState(io);
      }
    });
  });
}

function broadcastGameState(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  const game = getGame();
  if (!game) return;

  for (const player of game.players) {
    if (player.isConnected) {
      io.to(player.id).emit('game-state', getClientState(game, player.id));
    }
  }
}
