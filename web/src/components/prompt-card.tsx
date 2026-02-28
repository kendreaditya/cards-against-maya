'use client';

import { Card as CardType } from '@/lib/types';

interface PromptCardProps {
  card: CardType;
}

export default function PromptCard({ card }: PromptCardProps) {
  return (
    <div className="bg-black text-white rounded-xl p-5 w-full max-w-sm flex flex-col justify-between mx-auto min-h-[200px] border border-neutral-800 animate-scale-in">
      <p className="font-bold text-base md:text-lg leading-tight">{card.text}</p>
      <p className="text-neutral-600 text-xs font-bold mt-4 tracking-wide">
        Cards Against Maya
      </p>
    </div>
  );
}
