'use client';

import { useState } from 'react';
import { GameProvider, useGame } from '@/context/game-context';
import GameView from '@/components/game-view';

function HomeContent() {
  const { gameState, error, connected, joinGame } = useGame();
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);

  if (gameState) {
    return <GameView />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-3">
          Cards Against
          <br />
          <span className="text-white">Maya</span>
        </h1>
        <p className="text-muted text-sm tracking-wide uppercase">
          A Krishna-conscious card game
        </p>
      </div>

      {!connected && (
        <p className="text-muted animate-subtle-pulse mb-4 text-sm">
          Connecting to server...
        </p>
      )}

      {error && (
        <div className="bg-surface border border-border text-neutral-300 px-4 py-2.5 rounded-lg mb-4 max-w-sm text-center text-sm animate-fade-in-down">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) joinGame(name.trim());
        }}
        className="flex flex-col gap-3 w-full max-w-xs animate-fade-in-up"
        style={{ animationDelay: '150ms' }}
      >
        <div className={`relative transition-all duration-200 ${focused ? 'scale-[1.02]' : ''}`}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={20}
            autoFocus
            className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-white text-center text-lg
              focus:outline-none focus:border-neutral-500 transition-all duration-200
              placeholder:text-neutral-600"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || !connected}
          className="bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600
            text-black font-bold py-4 px-6 rounded-xl text-lg
            transition-all duration-200
            active:scale-[0.97]"
        >
          Join Game
        </button>
        <a
          href="/admin"
          className="text-center text-neutral-600 hover:text-neutral-400 text-sm mt-4 transition-colors"
        >
          Manage Cards
        </a>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <HomeContent />
    </GameProvider>
  );
}
