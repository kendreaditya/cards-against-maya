'use client';

import { useState } from 'react';
import { useGame } from '@/context/game-context';
import Lobby from './lobby';
import PlayingPhase from './playing-phase';
import JudgingPhase from './judging-phase';
import RoundResult from './round-result';
import GameOver from './game-over';
import Scoreboard from './scoreboard';
import AddCardModal from './add-card-modal';

export default function GameView() {
  const {
    gameState,
    error,
    startGame,
    submitCard,
    pickWinner,
    nextRound,
    playAgain,
  } = useGame();
  const [showAddCard, setShowAddCard] = useState(false);

  if (!gameState) return null;

  const showScoreboard =
    gameState.phase !== 'lobby' && gameState.phase !== 'game_over';

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Compact mobile scoreboard — top bar */}
      {showScoreboard && (
        <div className="lg:hidden border-b border-border">
          <Scoreboard
            players={gameState.players}
            pointsToWin={gameState.pointsToWin}
            compact
          />
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-start py-4">
          <div className="w-full max-w-4xl">
            {error && (
              <div className="bg-surface border border-border text-neutral-300 px-4 py-2.5 rounded-lg mb-4 mx-4 text-center text-sm animate-fade-in-down">
                {error}
              </div>
            )}

            {gameState.phase === 'lobby' && (
              <Lobby
                players={gameState.players}
                isHost={gameState.hostId === gameState.myId}
                onStart={startGame}
              />
            )}

            {gameState.phase === 'playing' && (
              <PlayingPhase gameState={gameState} onSubmit={submitCard} />
            )}

            {gameState.phase === 'judging' && (
              <JudgingPhase gameState={gameState} onPickWinner={pickWinner} />
            )}

            {gameState.phase === 'round_result' && (
              <RoundResult gameState={gameState} onNextRound={nextRound} />
            )}

            {gameState.phase === 'game_over' && (
              <GameOver gameState={gameState} onPlayAgain={playAgain} />
            )}
          </div>
        </div>

        {/* Desktop scoreboard sidebar */}
        {showScoreboard && (
          <div className="hidden lg:block lg:w-64 p-4 border-l border-border animate-slide-in-right">
            <Scoreboard
              players={gameState.players}
              pointsToWin={gameState.pointsToWin}
            />
          </div>
        )}
      </div>

      {/* Floating add card button */}
      <button
        onClick={() => setShowAddCard(true)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-surface border border-border
          text-neutral-400 hover:text-white hover:border-neutral-500
          flex items-center justify-center text-2xl font-light
          transition-all duration-200 active:scale-90 z-40
          shadow-lg shadow-black/30"
        title="Add a card"
      >
        +
      </button>

      {/* Add card modal */}
      <AddCardModal open={showAddCard} onClose={() => setShowAddCard(false)} />
    </div>
  );
}
