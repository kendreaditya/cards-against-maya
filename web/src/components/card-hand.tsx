'use client';

import Card from './card';
import { Card as CardType } from '@/lib/types';

interface CardHandProps {
  cards: CardType[];
  selectedId: number | null;
  onSelect: (cardId: number) => void;
  disabled?: boolean;
}

export default function CardHand({
  cards,
  selectedId,
  onSelect,
  disabled = false,
}: CardHandProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 touch-pan-x">
      <div className="flex gap-3 px-4 min-w-min stagger-deal">
        {cards.map((card) => (
          <div key={card.id}>
            <Card
              text={card.text}
              type="response"
              selected={selectedId === card.id}
              onClick={disabled ? undefined : () => onSelect(card.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
