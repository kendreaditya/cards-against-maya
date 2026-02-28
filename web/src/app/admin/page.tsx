'use client';

import { useState, useEffect } from 'react';

interface CardData {
  id: number;
  type: 'prompt' | 'response';
  text: string;
  source: 'original' | 'custom';
}

export default function AdminPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [filter, setFilter] = useState<'all' | 'prompt' | 'response'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'original' | 'custom'>('all');
  const [newType, setNewType] = useState<'prompt' | 'response'>('response');
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchCards = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    const res = await fetch(`/api/cards?${params}`);
    const data = await res.json();
    setCards(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [filter, sourceFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newType, text: newText.trim() }),
    });

    if (res.ok) {
      setNewText('');
      setMessage('Card added!');
      setTimeout(() => setMessage(''), 3000);
      fetchCards();
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/cards?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage('Card deleted');
      setTimeout(() => setMessage(''), 3000);
      fetchCards();
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Card Manager</h1>
        <a
          href="/"
          className="text-muted hover:text-white transition-colors"
        >
          Back to Game
        </a>
      </div>

      {message && (
        <div className="bg-surface border border-border text-neutral-300 px-4 py-2.5 rounded-lg mb-4 animate-fade-in-down">
          {message}
        </div>
      )}

      {/* Add card form */}
      <form
        onSubmit={handleAdd}
        className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3"
      >
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as 'prompt' | 'response')}
          className="bg-neutral-900 border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="response">Response (White)</option>
          <option value="prompt">Prompt (Black)</option>
        </select>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Card text... (use ______ for blanks in prompts)"
          className="flex-1 bg-neutral-900 border border-border rounded-lg px-4 py-2 text-sm
            focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!newText.trim()}
          className="bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600
            text-black font-bold px-6 py-2 rounded-lg transition-all duration-200 active:scale-[0.97]"
        >
          Add Card
        </button>
      </form>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(['all', 'prompt', 'response'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-black font-bold'
                  : 'bg-surface border border-border text-neutral-400 hover:text-white hover:border-neutral-500'
              }`}
            >
              {f === 'all' ? 'All Types' : f === 'prompt' ? 'Prompts' : 'Responses'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'original', 'custom'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                sourceFilter === f
                  ? 'bg-white text-black font-bold'
                  : 'bg-surface border border-border text-neutral-400 hover:text-white hover:border-neutral-500'
              }`}
            >
              {f === 'all' ? 'All Sources' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-neutral-600 text-sm self-center ml-2 tabular-nums">
          {cards.length} cards
        </span>
      </div>

      {/* Card list */}
      {loading ? (
        <p className="text-muted animate-subtle-pulse">Loading...</p>
      ) : (
        <div className="space-y-1">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors duration-200
                ${card.type === 'prompt'
                  ? 'bg-black border border-neutral-800 hover:border-neutral-700'
                  : 'bg-surface hover:bg-surface-hover'
                }`}
            >
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                  card.type === 'prompt'
                    ? 'bg-white text-black'
                    : 'bg-black text-white border border-neutral-700'
                }`}
              >
                {card.type === 'prompt' ? 'B' : 'W'}
              </span>
              <span className="flex-1 text-sm">{card.text}</span>
              {card.source === 'custom' && (
                <>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    custom
                  </span>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-neutral-500 hover:text-white text-sm font-bold transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
