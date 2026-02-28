# TODO — Cards Against Maya

## Bugs

- [ ] **Card hover scale clipped by overflow** — White response cards in the hand get cut off when hovering (scale animation clips at container edge due to `overflow` on parent). Fix: add overflow-visible or padding to the scroll container.
- [ ] **Cards don't use full screen width** — The card hand and game layout don't expand to fill available space on wider screens. Cards are constrained to a narrow column in the center.
- [ ] **Mobile scoreboard too bulky** — The vertical scoreboard takes up too much space on mobile. Redesign: horizontal/compact layout showing top N players that fit, plus the current player's rank and points.

## Features

### localStorage Auto-Rejoin
- [ ] Persist player name in `localStorage` on join
- [ ] Auto-rejoin on page refresh / socket reconnect
- [ ] Clear stored name when game is fully reset

### Supabase Migration
- [ ] Set up Supabase project (create tables: `cards`, `card_ratings`)
- [ ] Create `web/src/lib/supabase.ts` — Supabase client + query functions
- [ ] Create `web/src/lib/data.ts` — unified data layer (Supabase-first, SQLite fallback)
- [ ] Update `db.ts` schema — add `is_top_scored` column, `card_ratings` table
- [ ] Make `game-manager.ts` `startGame()` async
- [ ] Update `socket-handlers.ts` for async start
- [ ] Update `api/cards/route.ts` to use `data.ts`
- [ ] Create `web/scripts/seed-supabase.ts` seed script

### Full 1068-Card Deck
- [ ] Copy `cards/cards_against_maya.csv` → `web/data/`
- [ ] Update `csv-parser.ts` to point to full CSV
- [ ] Add `is_top_scored` to `Card` type
- [ ] Cross-reference with curated deck during seeding to flag top-scored cards
- [ ] Show quality badge in admin page

### Post-Round Card Rating (1-5)
- [ ] Add rating UI to `round-result.tsx` (1-5 dots per card, monochrome)
- [ ] Add `rate-cards` socket event to types
- [ ] Add `rate-cards` handler to `socket-handlers.ts`
- [ ] Persist ratings in Supabase (SQLite fallback)
- [ ] Ratings are optional — "Next Round" works without them

### In-Game Card Submission
- [ ] Create `add-card-modal.tsx` — type toggle, text input, guidance text
- [ ] Add floating "+" button to `game-view.tsx` (all phases)
- [ ] Reuse existing `POST /api/cards` endpoint
- [ ] Include tips for writing good prompts vs responses

## Polish

- [ ] **Retake gameplay screenshot** and add to README
- [ ] Update `CLAUDE.md` and `DEVELOPMENT.md` after all features
- [ ] Deploy final version to Railway
