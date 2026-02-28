'use client';

interface CardProps {
  text: string;
  type: 'prompt' | 'response';
  selected?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
  small?: boolean;
}

export default function Card({
  text,
  type,
  selected = false,
  onClick,
  highlighted = false,
  small = false,
}: CardProps) {
  const isBlack = type === 'prompt';

  return (
    <div
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        relative rounded-xl p-4 flex flex-col justify-between overflow-hidden
        transition-all duration-200
        ${small ? 'w-36 h-48 text-xs' : 'w-44 h-60 text-sm md:w-48 md:h-64'}
        ${
          isBlack
            ? 'bg-black text-white border border-neutral-800'
            : 'bg-white text-black'
        }
        ${onClick ? 'cursor-pointer hover:scale-[1.04] hover:-translate-y-1 active:scale-[0.98]' : ''}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.04] -translate-y-1' : ''}
        ${highlighted ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.04] -translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''}
        select-none flex-shrink-0
      `}
    >
      <p className="font-bold leading-tight break-words">{text}</p>
      <p
        className={`text-[10px] mt-2 font-bold tracking-wide ${
          isBlack ? 'text-neutral-600' : 'text-neutral-400'
        }`}
      >
        Cards Against Maya
      </p>
    </div>
  );
}
