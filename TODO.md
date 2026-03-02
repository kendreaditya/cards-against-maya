# TODO — Cards Against Maya

## Bugs

- [x] **Card hover scale clipped by overflow** — Fixed: added `overflow-y-visible` + `py-2` padding on card wrappers in `card-hand.tsx`.
- [x] **Cards don't use full screen width** — Fixed: expanded `max-w-2xl` to `max-w-4xl` in `game-view.tsx`.
- [x] **Mobile scoreboard too bulky** — Fixed: compact horizontal top bar on mobile, vertical sidebar on desktop. Added `compact` prop to `Scoreboard` component.

## Features

### localStorage Auto-Rejoin
- [x] Persist player name in `localStorage` on join
- [x] Auto-rejoin on page refresh / socket reconnect
- [x] Clear stored name when auto-rejoin fails (no active game)

### Supabase Migration
- [x] Create `web/src/lib/supabase.ts` — Supabase client + query functions
- [x] Create `web/src/lib/data.ts` — unified data layer (Supabase-first, SQLite fallback)
- [x] Update `db.ts` schema — add `is_top_scored` column, `card_ratings` table
- [x] Make `game-manager.ts` `startGame()` async
- [x] Update `socket-handlers.ts` for async start
- [x] Update `api/cards/route.ts` to use `data.ts`
- [ ] Set up Supabase project (create tables: `cards`, `card_ratings`) — **waiting for user to create project**
- [ ] Create `web/scripts/seed-supabase.ts` seed script

### Full 1068-Card Deck
- [x] Copy `cards/cards_against_maya.csv` → `web/data/`
- [x] Update `csv-parser.ts` to point to full CSV
- [x] Add `is_top_scored` to `Card` type
- [x] Cross-reference with curated deck during seeding to flag top-scored cards
- [ ] Show quality badge in admin page

### Post-Round Card Rating (1-5)
- [x] Add rating UI to `round-result.tsx` (1-5 dots per card, monochrome)
- [x] Add `rate-cards` socket event to types
- [x] Add `rate-cards` handler to `socket-handlers.ts`
- [x] Persist ratings in Supabase (SQLite fallback)
- [x] Ratings are optional — "Next Round" works without them

### In-Game Card Submission
- [x] Create `add-card-modal.tsx` — type toggle, text input, guidance text
- [x] Add floating "+" button to `game-view.tsx` (all phases)
- [x] Reuse existing `POST /api/cards` endpoint
- [x] Include tips for writing good prompts vs responses

## Polish

- [ ] **Retake gameplay screenshot** and add to README
- [x] Update `CLAUDE.md` and `DEVELOPMENT.md` after all features
- [x] Deploy to Railway
