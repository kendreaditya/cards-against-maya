# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Cards Against Maya" — a Krishna-conscious (ISKCON/Hare Krishna) family-friendly card game in the style of Cards Against Humanity. The project has two parts:

1. **Card generation pipeline** (`cards/`) — Python scripts that generate print-ready PNG card images from CSV card lists, suitable for upload to MakePlayingCards.com.
2. **Online multiplayer web app** (`web/`) — A Next.js + Socket.IO web app that lets players play the game online in real-time. Deployed on Railway.

## Web App (web/)

### Quick Start

```bash
cd web
npm install
npm run dev    # starts Express + Socket.IO + Next.js on http://localhost:3000
npm run build  # production build
npm start      # production server
```

### Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Real-time**: Socket.IO (WebSocket-based multiplayer)
- **Database**: Supabase (PostgreSQL) primary, SQLite via `better-sqlite3` as fallback
- **Styling**: Tailwind CSS with monochrome (black/white/gray only) theme
- **Server**: Custom Express server (`server.ts`) that mounts Socket.IO alongside Next.js
- **Deploy**: Railway (Nixpacks build, `npx tsx server.ts` start command)

### Architecture — Single Global Game

There is **one global game** at a time (no room codes). All players join the same game by entering their name on the home page. The game state lives in-memory on the server via `game-manager.ts`.

### Data Layer (Supabase + SQLite fallback)

The app uses a **unified data access layer** (`src/lib/data.ts`) that tries Supabase first and falls back to SQLite:

- `src/lib/supabase.ts` — Supabase client and query functions
- `src/lib/data.ts` — unified async API (tries Supabase, catches errors, falls back to SQLite)
- `src/lib/db.ts` — SQLite database (always available as fallback, auto-seeds from CSV)

If `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars are not set, the app runs in pure SQLite mode.

The SQLite DB auto-seeds from the **full 1068-card deck** (`data/cards_against_maya.csv`) on first boot, cross-referencing with `data/cards_against_maya_top612.csv` to flag top-scored cards with `is_top_scored`.

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Express + Socket.IO + Next.js custom server |
| `src/lib/types.ts` | All TypeScript types (Card, Player, GameState, Phase, Socket events) |
| `src/lib/data.ts` | Unified async data layer (Supabase-first, SQLite fallback) |
| `src/lib/supabase.ts` | Supabase client + query functions |
| `src/lib/db.ts` | SQLite database — auto-seeds from CSV, card ratings table |
| `src/lib/csv-parser.ts` | Parses the 1068-card CSV |
| `src/lib/game-manager.ts` | Game state machine (join/start/submit/judge/disconnect/reconnect) |
| `src/lib/socket-handlers.ts` | Socket.IO event wiring with auth/validation + card rating handler |
| `src/lib/utils.ts` | Shuffle helpers |
| `src/context/game-context.tsx` | React context for game state |
| `src/hooks/use-socket.ts` | Socket.IO client hook with localStorage auto-rejoin |
| `src/app/page.tsx` | Home page (join game, auto-reconnect) |
| `src/app/admin/page.tsx` | Card management UI (add/delete custom cards) |
| `src/app/api/cards/route.ts` | REST API for cards (GET/POST/DELETE) — uses `data.ts` |
| `src/components/add-card-modal.tsx` | Modal for submitting new cards with writing tips |
| `src/components/*.tsx` | UI components (card, lobby, playing, judging, results, scoreboard) |

### Socket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `join-game` | `playerName: string` |
| Client → Server | `start-game` | `pointsToWin: number` |
| Client → Server | `submit-card` | `cardId: number` |
| Client → Server | `pick-winner` | `cardId: number` |
| Client → Server | `next-round` | (none) |
| Client → Server | `play-again` | (none) |
| Client → Server | `rate-cards` | `{ cardId: number, rating: number }[]` |
| Server → Client | `game-state` | `ClientGameState` (per-player personalized) |
| Server → Client | `error` | `string` |

### Game Flow

```
HOME (enter name) → LOBBY (wait for 3+ players) → PLAYING → JUDGING → ROUND_RESULT (rate cards) → repeat → GAME_OVER
```

### Key Features

- **localStorage auto-rejoin**: Player name persisted in `localStorage`. On page refresh, auto-emits `join-game` to reconnect. Server's name-matching logic preserves hand and score.
- **Post-round card rating**: After each round, players can rate prompt + response cards 1-5 (monochrome dots). Ratings stored in `card_ratings` table (Supabase or SQLite).
- **In-game card submission**: Floating "+" button opens a modal with type toggle, text input, and writing tips for good prompts vs responses. Uses `POST /api/cards`.
- **Compact mobile scoreboard**: Horizontal top bar on mobile (< lg breakpoint), vertical sidebar on desktop.

### UI/UX Design

- **Monochrome theme**: Pure black/white/gray palette, no color accents. Matches the Cards Against Humanity aesthetic.
- **Animations**: 14 CSS keyframe animations in `globals.css` — fadeIn, fadeInUp, scaleIn, cardDeal (spring easing), stagger-children, stagger-deal, subtlePulse, trophy.
- **Font**: Inter (loaded from Google Fonts).
- **Responsive**: Cards use `overflow-y-visible` with padding for hover scale. Layout expands to `max-w-4xl`. Mobile scoreboard is a compact horizontal bar at the top.

### Deployment

- **Platform**: Railway
- **Project**: `secure-courage`
- **URL**: `https://secure-courage-production-4e21.up.railway.app`
- **Deploy command**: `cd web && npx @railway/cli up`
- **Build**: `npm run build` (Nixpacks auto-detected)
- **Start**: `npm start` → `npx tsx server.ts`
- **Environment**: `NODE_ENV=production`, `PORT` (set by Railway), `DB_PATH=/app/data/cards.db`
- **Optional**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` for Supabase integration
- **Persistent volume**: Mounted at `/app/data` for SQLite database

## Card Generation Pipeline (cards/)

### Key Commands

```bash
source venv/bin/activate
cd cards

python3 generate_cards.py                   # Print-ready PNGs (1200 DPI)
python3 generate_cards.py cards_against_maya.csv  # From a different CSV
python3 make_deck.py                        # Build CSV from batch text files
python3 make_deck.py --images               # Also generate low-res PNGs
python3 score_cards.py                      # Score and select top 612
python3 extract_cards.py                    # Extract from source spreadsheet
```

### Pipeline

1. **`extract_cards.py`** — Extracts from `source/A Different CAH spreadsheet - CAH Family Edition.csv`, writes to `extracted/`.
2. **`make_deck.py`** — Reads `batches/prompts_batch*.txt` + `batches/responses_batch*.txt`, produces `cards_against_maya.csv` (1068 cards) and `cah_generator/black.txt` + `white.txt`.
3. **`score_cards.py`** — Scores via `scores/batch_*.json` (6 weighted dimensions), selects top 612 → `cards_against_maya_top612.csv`.
4. **`generate_cards.py`** — Renders 3288x4488px PNGs using `cah-generator/` templates. Output: `printable_cards/`.

### Data Files

- `cards_against_maya.csv` — Full 1068-card deck (169 prompts + 899 responses)
- `cards_against_maya_top612.csv` — Curated 612-card deck (102 prompts + 510 responses)
- `scores/batch_*.json` — LLM scoring results (6 dimensions per card)

## Dependencies

- **Python**: 3.12 virtualenv with Pillow. Activate with `source venv/bin/activate`.
- **Web app**: Node.js with `web/package.json` — Next.js 14, Socket.IO, better-sqlite3, Express, Tailwind CSS, @supabase/supabase-js.
