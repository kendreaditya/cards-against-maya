# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Cards Against Maya" — a Krishna-conscious (ISKCON/Hare Krishna) family-friendly card game in the style of Cards Against Humanity. The project has two parts:

1. **Card generation pipeline** — Python scripts that generate print-ready PNG card images from CSV card lists, suitable for upload to MakePlayingCards.com.
2. **Online multiplayer web app** — A Next.js + Socket.IO web app that lets players play the game online in real-time. Deployed on Railway.

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
- **Database**: SQLite via `better-sqlite3` (auto-seeds 612 cards from CSV on first boot)
- **Styling**: Tailwind CSS with monochrome (black/white/gray only) theme
- **Server**: Custom Express server (`server.ts`) that mounts Socket.IO alongside Next.js
- **Deploy**: Railway (Nixpacks build, `npx tsx server.ts` start command)

### Architecture — Single Global Game

There is **one global game** at a time (no room codes). All players join the same game by entering their name on the home page. The game state lives in-memory on the server via `game-manager.ts`.

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Express + Socket.IO + Next.js custom server |
| `src/lib/types.ts` | All TypeScript types (Card, Player, GameState, Phase, Socket events) |
| `src/lib/db.ts` | SQLite database — auto-seeds from `cards_against_maya_top612.csv` |
| `src/lib/csv-parser.ts` | Parses the 612-card CSV |
| `src/lib/game-manager.ts` | Game state machine (join/start/submit/judge/disconnect/reconnect) |
| `src/lib/socket-handlers.ts` | Socket.IO event wiring with auth/validation |
| `src/lib/utils.ts` | Shuffle helpers |
| `src/context/game-context.tsx` | React context for game state |
| `src/hooks/use-socket.ts` | Socket.IO client hook |
| `src/app/page.tsx` | Home page (join game) |
| `src/app/admin/page.tsx` | Card management UI (add/delete custom cards) |
| `src/app/api/cards/route.ts` | REST API for cards (GET/POST/DELETE) |
| `src/components/*.tsx` | UI components (card, lobby, playing, judging, results, scoreboard) |

### Game Flow

```
HOME (enter name) → LOBBY (wait for 3+ players) → PLAYING → JUDGING → ROUND_RESULT → repeat → GAME_OVER
```

### UI/UX Design

- **Monochrome theme**: Pure black/white/gray palette, no color accents. Matches the Cards Against Humanity aesthetic.
- **Animations**: CSS keyframe animations for page transitions (fadeIn, fadeInUp, scaleIn), card dealing (cardDeal with spring easing), staggered list entries, and subtle pulse for waiting states.
- **Font**: Inter (loaded from Google Fonts).
- Custom animation classes are defined in `globals.css` (e.g., `animate-fade-in-up`, `animate-card-deal`, `stagger-children`, `stagger-deal`).

### Deployment

- **Platform**: Railway
- **Project**: `shimmering-commitment`
- **URL**: `https://shimmering-commitment-production.up.railway.app`
- **Deploy command**: `npx @railway/cli up` (from the project root, which is linked to Railway)
- **Build**: `npm run build` (Nixpacks auto-detected)
- **Start**: `npm start` → `npx tsx server.ts`
- **Environment**: `NODE_ENV=production`, `PORT` (set by Railway), `DB_PATH=/app/data/cards.db`
- **Persistent volume**: Mounted at `/app/data` for SQLite database
- No git repo — deploy via `railway up` (direct upload)

## Card Generation Pipeline (Python)

### Key Commands

```bash
# Activate the virtual environment (required before running any script)
source venv/bin/activate

# Generate print-ready card images (612 cards from curated deck)
python3 generate_cards.py

# Generate from a different CSV
python3 generate_cards.py cards_against_maya.csv

# Build the master CSV from batch text files (prompts_batch*.txt, responses_batch*.txt)
python3 make_deck.py
python3 make_deck.py --images  # also generate low-res PNG images

# Re-run scoring/selection to rebuild the curated 612-card CSV
python3 score_cards.py

# Extract cards from the original CAH Family Edition spreadsheet
python3 extract_cards.py
```

### Pipeline

1. **`extract_cards.py`** — One-time extraction from the source spreadsheet (`A Different CAH spreadsheet - CAH Family Edition.csv`). Reads cards from two independent column sections (cols 0-1 and cols 11-12), deduplicates, and writes `extracted_prompts.txt` / `extracted_responses.txt`.

2. **`make_deck.py`** — Reads numbered batch text files (`prompts_batch*.txt`, `responses_batch*.txt`), strips numbering prefixes, and produces:
   - `cards_against_maya.csv` (master CSV, 1068 cards: 169 prompts + 899 responses)
   - `cah_generator/black.txt` + `white.txt` (for the upstream cah-generator tool)

3. **`score_cards.py`** — Loads LLM-scored JSON batches from `scores/batch_*.json`, computes weighted scores across 6 dimensions (humor 30%, appropriateness 20%, versatility 20%, cultural_relevance 15%, specificity 10%, originality 5%), selects top 102 prompts + 510 responses, and writes `cards_against_maya_top612.csv`.

4. **`generate_cards.py`** — The main image generator. Reads a CSV (defaults to `cards_against_maya_top612.csv`), uses templates from `cah-generator/generators/single-card-output/` to produce 1200 DPI (3288x4488px) print-ready PNGs. Outputs to `printable_cards/` with a ZIP bundle.

### Data Files

- **CSV format**: `Type,CardText` where Type is "Prompt" or "Response"
- **`cards_against_maya.csv`**: Full 1068-card deck (uncurated)
- **`cards_against_maya_top612.csv`**: Curated 612-card deck (102 prompts + 510 responses)
- **`scores/batch_*.json`**: LLM scoring results — JSON arrays of objects with `card_text`, `type`, and 6 dimension scores

### Card Image Generation Details

`generate_cards.py` uses Pillow and depends on:
- **Templates**: `cah-generator/generators/single-card-output/img/black.png` and `white.png`
- **Font**: `cah-generator/generators/single-card-output/fonts/NimbusSanL-Bol.otf`
- Rebrands templates by covering the original "Cards Against Humanity" logo and drawing "Cards Against Maya"
- Auto-sizes text (200px down to 110px) to fit within the card text area
- Output structure: `printable_cards/prompts_black/`, `printable_cards/responses_white/`, `printable_cards/backs/`

## Dependencies

- **Python**: 3.12 virtualenv with Pillow. Activate with `source venv/bin/activate`.
- **Web app**: Node.js with dependencies in `web/package.json` (Next.js 14, Socket.IO, better-sqlite3, Express, Tailwind CSS).
