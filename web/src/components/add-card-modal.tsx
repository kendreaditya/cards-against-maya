'use client';

import { useState } from 'react';

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddCardModal({ open, onClose }: AddCardModalProps) {
  const [type, setType] = useState<'prompt' | 'response'>('response');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: text.trim() }),
      });
      if (res.ok) {
        setText('');
        setMessage('Card added! It will appear in the next game.');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Failed to add card. Try again.');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage('Network error. Try again.');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-[#111] border border-border rounded-t-2xl sm:rounded-2xl p-5 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add a Card</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors text-xl leading-none px-1"
          >
            &#x2715;
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setType('response')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${type === 'response'
                ? 'bg-white text-black'
                : 'bg-surface border border-border text-neutral-400 hover:text-white'}`}
          >
            Response (White)
          </button>
          <button
            onClick={() => setType('prompt')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${type === 'prompt'
                ? 'bg-black text-white border border-neutral-600'
                : 'bg-surface border border-border text-neutral-400 hover:text-white'}`}
          >
            Prompt (Black)
          </button>
        </div>

        {/* Text input */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === 'prompt'
                ? 'Write a prompt... use ______ for blanks'
                : 'Write a response...'
            }
            maxLength={500}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white
              focus:outline-none focus:border-neutral-500 transition-colors
              placeholder:text-neutral-600 resize-none"
          />

          <div className="flex items-center justify-between mt-1 mb-3">
            <span className="text-[11px] text-neutral-600 tabular-nums">
              {text.length}/500
            </span>
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {showTips ? 'Hide tips' : 'Writing tips'}
            </button>
          </div>

          {/* Tips */}
          {showTips && (
            <div className="bg-surface border border-border rounded-xl p-3 mb-3 text-xs text-neutral-400 animate-fade-in-down">
              {type === 'prompt' ? (
                <>
                  <p className="font-bold text-neutral-300 mb-1.5">Good prompts:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Use ______ where responses fill in</li>
                    <li>Open-ended setups that work with many answers</li>
                    <li>Krishna-conscious themes &amp; settings</li>
                    <li>Funny situations devotees can relate to</li>
                  </ul>
                  <p className="mt-2 text-neutral-500 italic">
                    &quot;Mataji, there&apos;s an asura under my bed and he wants ______.&quot;
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-neutral-300 mb-1.5">Good responses:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Short and punchy (2-8 words ideal)</li>
                    <li>Specific enough to be funny</li>
                    <li>Works with many different prompts</li>
                    <li>Family-friendly and devotee-themed</li>
                  </ul>
                  <p className="mt-2 text-neutral-500 italic">
                    &quot;Using water balloons as karatalas.&quot;
                  </p>
                </>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <p className="text-xs text-neutral-400 text-center mb-3 animate-fade-in">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="w-full bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600
              text-black font-bold py-3 rounded-xl text-sm
              transition-all duration-200 active:scale-[0.97]"
          >
            {submitting ? 'Adding...' : 'Add Card'}
          </button>
        </form>
      </div>
    </div>
  );
}
