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
import { rateCards } from './data';
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
        joinGame(socket.id, playerName.trim());
        broadcastGameState(io);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('start-game', async (pointsToWin: number) => {
      try {
        if (typeof pointsToWin !== 'number' || !Number.isInteger(pointsToWin) || pointsToWin < 1 || pointsToWin > 50) {
          throw new Error('Points to win must be between 1 and 50');
        }
        await startGame(socket.id, pointsToWin);
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

    socket.on('rate-cards', async (ratings: { cardId: number; rating: number }[]) => {
      try {
        if (!Array.isArray(ratings) || ratings.length === 0) return;

        // Validate each rating
        for (const r of ratings) {
          if (typeof r.cardId !== 'number' || !Number.isInteger(r.cardId)) {
            throw new Error('Invalid card ID');
          }
          if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
          }
        }

        // Get player name
        const game = getGame();
        const player = game?.players.find((p) => p.id === socket.id);
        if (!player) throw new Error('Player not found');

        const roundNumber = game?.currentRound?.number ?? 0;
        await rateCards(player.name, ratings, roundNumber);
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
