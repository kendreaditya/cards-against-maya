import {
  GameState,
  Player,
  Card,
  ClientGameState,
  ClientPlayer,
  ClientRound,
  ClientSubmission,
  HAND_SIZE,
  MIN_PLAYERS,
} from './types';
import { getCardsByType } from './db';
import { shuffle } from './utils';

// Single global game
let game: GameState | null = null;

export function getGame(): GameState | null {
  return game;
}

function ensureGame(): GameState {
  if (!game) {
    game = {
      phase: 'lobby',
      players: [],
      currentRound: null,
      pointsToWin: 5,
      hostId: '',
      promptDeck: [],
      responseDeck: [],
      czarOrder: [],
      czarIndex: 0,
    };
  }
  return game;
}

export function joinGame(socketId: string, playerName: string): GameState {
  const g = ensureGame();

  // If game is in progress, check for reconnection by name
  const disconnected = g.players.find((p) => p.name === playerName && !p.isConnected);
  if (disconnected) {
    const oldId = disconnected.id;
    disconnected.id = socketId;
    disconnected.isConnected = true;

    // Update czar order
    const czarIdx = g.czarOrder.indexOf(oldId);
    if (czarIdx !== -1) g.czarOrder[czarIdx] = socketId;
    if (g.currentRound?.czarId === oldId) g.currentRound.czarId = socketId;
    if (g.hostId === oldId) g.hostId = socketId;

    // Fix Bug 2: Update playerId in existing submissions
    if (g.currentRound) {
      for (const sub of g.currentRound.submissions) {
        if (sub.playerId === oldId) {
          sub.playerId = socketId;
        }
      }
    }

    return g;
  }

  if (g.phase !== 'lobby') throw new Error('Game already in progress. Wait for it to finish.');
  if (g.players.some((p) => p.name === playerName))
    throw new Error('Name already taken');
  if (g.players.length >= 20) throw new Error('Game is full');

  const isFirst = g.players.length === 0;
  const player: Player = {
    id: socketId,
    name: playerName,
    score: 0,
    hand: [],
    isHost: isFirst,
    isConnected: true,
  };

  g.players.push(player);
  g.czarOrder.push(socketId);
  if (isFirst) g.hostId = socketId;

  return g;
}

export function startGame(socketId: string, pointsToWin: number): GameState {
  if (!game) throw new Error('No game exists');
  if (game.hostId !== socketId) throw new Error('Only the host can start');
  if (game.players.length < MIN_PLAYERS)
    throw new Error(`Need at least ${MIN_PLAYERS} players`);

  game.pointsToWin = pointsToWin;

  // Load and shuffle decks
  const { prompts, responses } = getCardsByType();
  game.promptDeck = shuffle(prompts);
  game.responseDeck = shuffle(responses);

  if (game.promptDeck.length === 0 || game.responseDeck.length === 0) {
    throw new Error('No cards available in the database');
  }

  // Deal hands
  for (const player of game.players) {
    player.hand = drawCards(game, HAND_SIZE);
  }

  // Start first round
  game.czarIndex = 0;
  startNewRound(game);

  return game;
}

function drawCards(g: GameState, count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (g.responseDeck.length === 0) {
      const { responses } = getCardsByType();
      g.responseDeck = shuffle(responses);
      if (g.responseDeck.length === 0) break;
    }
    const card = g.responseDeck.pop();
    if (card) cards.push(card);
  }
  return cards;
}

function startNewRound(g: GameState): void {
  if (g.promptDeck.length === 0) {
    const { prompts } = getCardsByType();
    g.promptDeck = shuffle(prompts);
    if (g.promptDeck.length === 0) return;
  }

  const promptCard = g.promptDeck.pop()!;
  const czarId = g.czarOrder[g.czarIndex % g.czarOrder.length];

  g.currentRound = {
    number: (g.currentRound?.number ?? 0) + 1,
    czarId,
    promptCard,
    submissions: [],
    winnerId: null,
    winningCard: null,
  };

  g.phase = 'playing';
}

export function submitCard(socketId: string, cardId: number): GameState {
  if (!game) throw new Error('No game exists');
  if (game.phase !== 'playing') throw new Error('Not in playing phase');
  if (!game.currentRound) throw new Error('No active round');
  if (game.currentRound.czarId === socketId)
    throw new Error('The Card Czar cannot submit');

  const player = game.players.find((p) => p.id === socketId);
  if (!player) throw new Error('Player not found');

  if (game.currentRound.submissions.some((s) => s.playerId === socketId))
    throw new Error('Already submitted');

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error('Card not in hand');

  const card = player.hand.splice(cardIndex, 1)[0];
  game.currentRound.submissions.push({
    playerId: socketId,
    playerName: player.name,
    card,
  });

  // Check if all non-czar connected players have submitted
  const activePlayers = game.players.filter(
    (p) => p.id !== game!.currentRound!.czarId && p.isConnected
  );
  if (game.currentRound.submissions.length >= activePlayers.length) {
    game.currentRound.submissions = shuffle(game.currentRound.submissions);
    game.phase = 'judging';
  }

  return game;
}

export function pickWinner(socketId: string, cardId: number): GameState {
  if (!game) throw new Error('No game exists');
  if (game.phase !== 'judging') throw new Error('Not in judging phase');
  if (!game.currentRound) throw new Error('No active round');
  if (game.currentRound.czarId !== socketId)
    throw new Error('Only the Card Czar can pick');

  const submission = game.currentRound.submissions.find(
    (s) => s.card.id === cardId
  );
  if (!submission) throw new Error('Card not found in submissions');

  const winner = game.players.find((p) => p.id === submission.playerId);
  if (winner) winner.score++;

  game.currentRound.winnerId = submission.playerId;
  game.currentRound.winningCard = submission.card;

  if (winner && winner.score >= game.pointsToWin) {
    game.phase = 'game_over';
  } else {
    game.phase = 'round_result';
  }

  return game;
}

export function nextRound(socketId: string): GameState {
  if (!game) throw new Error('No game exists');
  if (game.phase !== 'round_result') throw new Error('Not in round result phase');
  if (game.hostId !== socketId) throw new Error('Only the host can advance');

  const connected = game.players.filter((p) => p.isConnected);
  if (connected.length < MIN_PLAYERS) {
    throw new Error('Not enough connected players');
  }

  for (const player of game.players) {
    while (player.hand.length < HAND_SIZE && player.isConnected) {
      const cards = drawCards(game, 1);
      player.hand.push(...cards);
    }
  }

  // Rotate czar, skip disconnected
  game.czarIndex = (game.czarIndex + 1) % game.czarOrder.length;
  let attempts = 0;
  while (
    attempts < game.czarOrder.length &&
    !game.players.find(
      (p) =>
        p.id === game!.czarOrder[game!.czarIndex % game!.czarOrder.length] &&
        p.isConnected
    )
  ) {
    game.czarIndex = (game.czarIndex + 1) % game.czarOrder.length;
    attempts++;
  }

  startNewRound(game);
  return game;
}

export function playAgain(socketId: string): GameState {
  if (!game) throw new Error('No game exists');
  if (game.hostId !== socketId) throw new Error('Only the host can restart');

  for (const player of game.players) {
    player.score = 0;
    player.hand = [];
  }

  // Remove disconnected players
  game.players = game.players.filter((p) => p.isConnected);
  game.czarOrder = game.players.map((p) => p.id);

  game.phase = 'lobby';
  game.currentRound = null;
  game.promptDeck = [];
  game.responseDeck = [];
  game.czarIndex = 0;

  return game;
}

export function handleDisconnect(socketId: string): GameState | null {
  if (!game) return null;

  const player = game.players.find((p) => p.id === socketId);
  if (!player) return null;

  player.isConnected = false;

  // If in lobby, remove entirely
  if (game.phase === 'lobby') {
    game.players = game.players.filter((p) => p.id !== socketId);
    game.czarOrder = game.czarOrder.filter((id) => id !== socketId);

    if (game.hostId === socketId && game.players.length > 0) {
      game.hostId = game.players[0].id;
      game.players[0].isHost = true;
    }

    if (game.players.length === 0) {
      game = null;
      return null;
    }

    return game;
  }

  // Transfer host if needed
  if (game.hostId === socketId) {
    const newHost = game.players.find((p) => p.isConnected);
    if (newHost) {
      game.hostId = newHost.id;
      newHost.isHost = true;
      player.isHost = false;
    }
  }

  // Check if enough players remain first
  const connected = game.players.filter((p) => p.isConnected);
  if (connected.length === 0) {
    game = null;
    return null;
  }

  if (connected.length < MIN_PLAYERS && (game.phase as string) !== 'lobby') {
    game.phase = 'lobby';
    game.currentRound = null;
    for (const p of game.players) {
      p.hand = [];
      p.score = 0;
    }
    game.players = game.players.filter((p) => p.isConnected);
    game.czarOrder = game.players.map((p) => p.id);
    return game;
  }

  // If czar disconnected during playing/judging, auto-advance
  if (
    game.currentRound &&
    game.currentRound.czarId === socketId &&
    (game.phase === 'playing' || game.phase === 'judging')
  ) {
    game.czarIndex = (game.czarIndex + 1) % game.czarOrder.length;
    let attempts = 0;
    while (
      attempts < game.czarOrder.length &&
      !game.players.find(
        (p) =>
          p.id === game!.czarOrder[game!.czarIndex % game!.czarOrder.length] &&
          p.isConnected
      )
    ) {
      game.czarIndex = (game.czarIndex + 1) % game.czarOrder.length;
      attempts++;
    }
    startNewRound(game);
    return game; // Fix Bug 1: return early, don't fall through
  }

  // Check if disconnection completes the submission phase
  if (game.phase === 'playing' && game.currentRound) {
    const activePlayers = game.players.filter(
      (p) => p.id !== game!.currentRound!.czarId && p.isConnected
    );
    if (
      activePlayers.length > 0 &&
      game.currentRound.submissions.length >= activePlayers.length
    ) {
      game.currentRound.submissions = shuffle(game.currentRound.submissions);
      game.phase = 'judging';
    }
  }

  return game;
}

// Build client-safe state for a specific player
export function getClientState(g: GameState, socketId: string): ClientGameState {
  const player = g.players.find((p) => p.id === socketId);

  const clientPlayers: ClientPlayer[] = g.players
    .filter((p) => p.isConnected || g.phase !== 'lobby')
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
      isConnected: p.isConnected,
      hasSubmitted: g.currentRound
        ? g.currentRound.submissions.some((s) => s.playerId === p.id)
        : false,
      isCzar: g.currentRound ? g.currentRound.czarId === p.id : false,
    }));

  let clientRound: ClientRound | null = null;
  if (g.currentRound) {
    const activePlayers = g.players.filter(
      (p) => p.id !== g.currentRound!.czarId && p.isConnected
    );

    let submissions: ClientSubmission[] = [];

    if (g.phase === 'judging') {
      submissions = g.currentRound.submissions.map((s) => ({
        card: s.card,
      }));
    } else if (g.phase === 'round_result' || g.phase === 'game_over') {
      submissions = g.currentRound.submissions.map((s) => ({
        card: s.card,
        playerId: s.playerId,
        playerName: s.playerName,
      }));
    }

    clientRound = {
      number: g.currentRound.number,
      czarId: g.currentRound.czarId,
      promptCard: g.currentRound.promptCard,
      submissions,
      submissionCount: g.currentRound.submissions.length,
      totalExpected: activePlayers.length,
      winnerId: g.currentRound.winnerId,
      winningCard: g.currentRound.winningCard,
    };
  }

  return {
    phase: g.phase,
    players: clientPlayers,
    currentRound: clientRound,
    pointsToWin: g.pointsToWin,
    hostId: g.hostId,
    myHand: player?.hand ?? [],
    myId: socketId,
  };
}
