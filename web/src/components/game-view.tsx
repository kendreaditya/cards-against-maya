'use client';

import { useGame } from '@/context/game-context';
import Lobby from './lobby';
import PlayingPhase from './playing-phase';
import JudgingPhase from './judging-phase';
import RoundResult from './round-result';
import GameOver from './game-over';
import Scoreboard from './scoreboard';

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

  if (!gameState) return null;

  const showScoreboard =
    gameState.phase !== 'lobby' && gameState.phase !== 'game_over';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start py-4">
        <div className="w-full max-w-2xl">
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

      {/* Scoreboard sidebar */}
      {showScoreboard && (
        <div className="lg:w-64 p-4 border-t lg:border-t-0 lg:border-l border-border animate-slide-in-right">
          <Scoreboard
            players={gameState.players}
            pointsToWin={gameState.pointsToWin}
          />
        </div>
      )}
    </div>
  );
}
