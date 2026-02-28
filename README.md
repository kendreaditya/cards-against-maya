# Cards Against Maya

A Krishna-conscious (ISKCON/Hare Krishna) family-friendly card game in the style of Cards Against Humanity — playable online or as printed cards.

**Play now:** [shimmering-commitment-production.up.railway.app](https://shimmering-commitment-production.up.railway.app)

## How It Works

One player creates a game, others join by entering their name. Each round:

1. A **black prompt card** is revealed (e.g., "Krishna defeated ______ with His flute.")
2. Everyone (except the Card Czar) picks their funniest **white response card**
3. The Card Czar picks the winner
4. First to the target score wins

1068 cards — 169 prompts + 899 responses — all Krishna-conscious and family-friendly. The top 612 are flagged as "top-scored" based on LLM evaluation.

## Play Online

The web app is live at **[shimmering-commitment-production.up.railway.app](https://shimmering-commitment-production.up.railway.app)**. Just enter your name and join. No accounts, no downloads, no room codes — everyone joins one shared game.

### Run Locally

```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

## Print Physical Cards

Generate print-ready 1200 DPI PNGs suitable for [MakePlayingCards.com](https://www.makeplayingcards.com):

```bash
source venv/bin/activate
cd cards
python3 generate_cards.py
# Output: printable_cards/ directory + ZIP bundle
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Real-time | Socket.IO (WebSockets) |
| Database | Supabase (PostgreSQL) primary, SQLite fallback |
| Server | Custom Express + Socket.IO + Next.js |
| Card generation | Python 3.12, Pillow |
| Hosting | Railway |

## Project Structure

```
cards-against-maya/
├── README.md
├── CLAUDE.md
├── DEVELOPMENT.md
├── web/                              # Online multiplayer web app
│   ├── server.ts                     # Express + Socket.IO + Next.js server
│   ├── src/
│   │   ├── app/                      # Next.js pages (home, admin, API)
│   │   ├── components/               # Game UI (cards, lobby, phases, scoreboard)
│   │   ├── lib/                      # Game engine, DB, types, socket handlers
│   │   ├── context/                  # React game state context
│   │   └── hooks/                    # Socket.IO client hook
│   └── package.json
├── cards/                            # Card generation pipeline
│   ├── generate_cards.py             # Print-ready PNG generator (1200 DPI)
│   ├── make_deck.py                  # Build master CSV from batch text files
│   ├── score_cards.py                # LLM scoring + top-612 selection
│   ├── extract_cards.py              # Extract from source CAH spreadsheet
│   ├── cards_against_maya.csv        # Full 1068-card deck
│   ├── cards_against_maya_top612.csv # Curated 612-card deck
│   ├── batches/                      # Raw prompt/response batch text files
│   ├── extracted/                    # One-time extraction output
│   ├── scores/                       # LLM scoring JSON batches
│   ├── source/                       # Original CAH source material
│   ├── cah-generator/                # Upstream template repo (fonts, images)
│   └── cah_generator/                # Generated files for cah-generator tool
└── venv/                             # Python virtualenv (not committed)
```

## Card Pipeline

The deck was built in four stages:

1. **Extract** (`cards/extract_cards.py`) — Pull prompts/responses from the CAH Family Edition spreadsheet
2. **Generate** — Create Krishna-conscious card text in numbered batch files (`cards/batches/`)
3. **Score** (`cards/score_cards.py`) — LLM-score every card across 6 dimensions (humor, appropriateness, versatility, cultural relevance, specificity, originality) and select the top 612
4. **Render** (`cards/generate_cards.py`) — Generate print-ready 3288x4488px PNGs with the Cards Against Maya branding

## Deployment

Deployed on [Railway](https://railway.com) with Nixpacks:

```bash
# Deploy (from project root, linked to Railway project)
npx @railway/cli up
```

- Auto-seeds the full 1068-card deck into SQLite on first boot
- Persistent volume at `/app/data` for the database
- Custom cards can be added via the `/admin` page or the in-game "+" button
- Optional Supabase integration: set `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars

## Built With AI

This entire project was built on **February 27, 2026** in a single session using **Claude Opus 4.6** (model ID: `claude-opus-4-6[1m]`) via **Claude Code** (Anthropic's CLI tool).

### Collaboration Stats

- **~15 user-AI conversation turns** across 2 sessions (initial build session + this enhancement session)
- **~60+ files created or modified** (22 web app files originally, then 20+ more for features/fixes)
- **1,706 files** in the initial commit, **2,500+ lines of new code** in the feature commit
- **Zero manual code written by the user** — all code was generated and iterated by Claude

### What the User Decided

- **Game concept**: Krishna-conscious Cards Against Humanity ("Cards Against Maya")
- **Single global game** (no room codes) — user requested simplification from multi-room to single-game
- **Monochrome theme** — user requested black/white/gray aesthetic with animations
- **Feature scope**: user specified each feature (Supabase, card rating, card submission, localStorage rejoin)
- **Card rating design**: user chose "rate all cards, store permanently" over session-only or winner-only options
- **Card submission timing**: user chose "anytime via floating button" over lobby-only
- **Full deck**: user chose to include all 1068 cards with quality flags rather than just the curated 612
- **Deployment platform**: Railway (user had existing account)
- **Bug reports**: user identified specific UI issues (hover clipping, screen utilization, mobile scoreboard) with a screenshot

### What Claude Decided Autonomously

- **Tech stack selection**: Next.js 14 + Socket.IO + SQLite + Express + Tailwind CSS
- **Architecture**: Custom Express server to mount Socket.IO alongside Next.js, in-memory game state, SQLite for card persistence
- **Game engine design**: Phase state machine, czar rotation, card dealing, hand management, reconnection by name matching
- **Data layer pattern**: Supabase-first with SQLite fallback, unified `data.ts` abstraction
- **UI component structure**: 13 React components, game context provider, socket hook
- **Animation system**: 14 CSS keyframe animations with cubic-bezier spring easing for card dealing
- **Security**: Input validation on all socket events, auth checks on host-only actions, custom card deletion protection
- **Bug detection**: Found and fixed 9 bugs via systematic audit (czar disconnect fallthrough, stale submission IDs, missing auth checks, infinite loop risks, etc.)
- **Repo organization**: Moved card pipeline into `cards/` subdirectory with `batches/`, `extracted/`, `source/` subfolders
- **Deployment strategy**: Nixpacks over Docker after discovering native module issues with `better-sqlite3`

### AI Success Rate

The AI achieved the user's goals with high fidelity:
- The game is fully playable online with real-time multiplayer
- All requested features were implemented and deployed in a single session
- The monochrome theme matches the Cards Against Humanity aesthetic
- Build passes cleanly on every commit
- Bugs identified by the user from the screenshot were fixed

## License

This project is for personal/family use. Card content is original and Krishna-conscious.
