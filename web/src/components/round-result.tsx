'use client';

import { useState } from 'react';
import { ClientGameState } from '@/lib/types';
import { useGame } from '@/context/game-context';
import PromptCard from './prompt-card';
import Card from './card';

interface RoundResultProps {
  gameState: ClientGameState;
  onNextRound: () => void;
}

function RatingDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`w-5 h-5 rounded-full border transition-all duration-200
            ${
              n <= value
                ? 'bg-white border-white'
                : 'bg-transparent border-neutral-600 hover:border-neutral-400'
            }`}
        />
      ))}
    </div>
  );
}

export default function RoundResult({ gameState, onNextRound }: RoundResultProps) {
  const { rateCards } = useGame();
  const round = gameState.currentRound;
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [ratingsSubmitted, setRatingsSubmitted] = useState(false);

  if (!round) return null;

  const winnerName = round.submissions.find(
    (s) => s.playerId === round.winnerId
  )?.playerName ?? 'Someone';
  const isHost = gameState.hostId === gameState.myId;

  const setRating = (cardId: number, rating: number) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (rating === 0) {
        delete next[cardId];
      } else {
        next[cardId] = rating;
      }
      return next;
    });
  };

  const submitRatings = () => {
    const ratingsList = Object.entries(ratings).map(([cardId, rating]) => ({
      cardId: parseInt(cardId, 10),
      rating,
    }));
    if (ratingsList.length > 0) {
      rateCards(ratingsList);
    }
    setRatingsSubmitted(true);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 animate-fade-in-up">
      <p className="text-sm text-muted">Round {round.number} — Result</p>

      <div className="w-full max-w-sm">
        <PromptCard card={round.promptCard} />
        {/* Rate the prompt */}
        {!ratingsSubmitted && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] text-neutral-500">Rate prompt:</span>
            <RatingDots
              value={ratings[round.promptCard.id] ?? 0}
              onChange={(v) => setRating(round.promptCard.id, v)}
            />
          </div>
        )}
      </div>

      <div className="text-center animate-scale-in">
        <p className="text-white font-bold text-xl mb-2">
          {winnerName} wins this round!
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center stagger-deal">
        {round.submissions.map((sub) => (
          <div key={sub.card.id} className="text-center">
            <Card
              text={sub.card.text}
              type="response"
              highlighted={sub.card.id === round.winningCard?.id}
            />
            <p className="text-xs text-muted mt-2">{sub.playerName}</p>
            {/* Rate each response */}
            {!ratingsSubmitted && sub.playerId !== gameState.myId && (
              <div className="flex justify-center">
                <RatingDots
                  value={ratings[sub.card.id] ?? 0}
                  onChange={(v) => setRating(sub.card.id, v)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit ratings button */}
      {!ratingsSubmitted && Object.keys(ratings).length > 0 && (
        <button
          onClick={submitRatings}
          className="text-sm text-neutral-400 hover:text-white border border-border hover:border-neutral-500
            px-4 py-2 rounded-lg transition-all duration-200 animate-fade-in"
        >
          Submit Ratings
        </button>
      )}

      {ratingsSubmitted && (
        <p className="text-xs text-neutral-500 animate-fade-in">Ratings saved</p>
      )}

      {isHost && (
        <button
          onClick={onNextRound}
          className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-xl text-lg
            transition-all duration-200 active:scale-[0.97] animate-fade-in-up"
        >
          Next Round
        </button>
      )}

      {!isHost && (
        <p className="text-muted text-sm animate-subtle-pulse">
          Waiting for host to continue...
        </p>
      )}
    </div>
  );
}
