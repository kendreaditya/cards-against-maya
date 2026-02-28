// Card types
export interface Card {
  id: number;
  type: 'prompt' | 'response';
  text: string;
  source: 'original' | 'custom';
  is_top_scored?: boolean;
}

// Game phases
export type Phase = 'lobby' | 'playing' | 'judging' | 'round_result' | 'game_over';

// Player
export interface Player {
  id: string; // socket ID
  name: string;
  score: number;
  hand: Card[];
  isHost: boolean;
  isConnected: boolean;
}

// A submitted card during a round
export interface Submission {
  playerId: string;
  playerName: string;
  card: Card;
}

// Round state
export interface Round {
  number: number;
  czarId: string;
  promptCard: Card;
  submissions: Submission[];
  winnerId: string | null;
  winningCard: Card | null;
}

// Full game state
export interface GameState {
  phase: Phase;
  players: Player[];
  currentRound: Round | null;
  pointsToWin: number;
  hostId: string;
  promptDeck: Card[];
  responseDeck: Card[];
  czarOrder: string[]; // player IDs in rotation order
  czarIndex: number;
}

// What the client receives (no deck info, no other players' hands)
export interface ClientGameState {
  phase: Phase;
  players: ClientPlayer[];
  currentRound: ClientRound | null;
  pointsToWin: number;
  hostId: string;
  myHand: Card[];
  myId: string;
}

export interface ClientPlayer {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  isCzar: boolean;
}

export interface ClientRound {
  number: number;
  czarId: string;
  promptCard: Card;
  submissions: ClientSubmission[]; // only populated during judging/result
  submissionCount: number;
  totalExpected: number;
  winnerId: string | null;
  winningCard: Card | null;
}

export interface ClientSubmission {
  card: Card;
  playerId?: string; // only revealed after judging
  playerName?: string;
}

// Socket event types
export interface ServerToClientEvents {
  'game-state': (state: ClientGameState) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'join-game': (playerName: string) => void;
  'start-game': (pointsToWin: number) => void;
  'submit-card': (cardId: number) => void;
  'pick-winner': (cardId: number) => void;
  'next-round': () => void;
  'play-again': () => void;
  'rate-cards': (ratings: { cardId: number; rating: number }[]) => void;
}

export const HAND_SIZE = 7;
export const MIN_PLAYERS = 3;
