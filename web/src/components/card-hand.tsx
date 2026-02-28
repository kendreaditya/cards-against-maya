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
    <div className="w-full overflow-x-auto overflow-y-visible pb-4 pt-2 touch-pan-x">
      <div className="flex gap-3 px-4 min-w-min stagger-deal">
        {cards.map((card) => (
          <div key={card.id} className="py-2">
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
