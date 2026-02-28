# Cards Against Maya

A Krishna-conscious (ISKCON/Hare Krishna) family-friendly card game in the style of Cards Against Humanity — playable online or as printed cards.

**Play now:** [shimmering-commitment-production.up.railway.app](https://shimmering-commitment-production.up.railway.app)

## How It Works

One player creates a game, others join by entering their name. Each round:

1. A **black prompt card** is revealed (e.g., "Krishna defeated ______ with His flute.")
2. Everyone (except the Card Czar) picks their funniest **white response card**
3. The Card Czar picks the winner
4. First to the target score wins

612 curated cards — 102 prompts + 510 responses — all Krishna-conscious and family-friendly.

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
| Database | SQLite (better-sqlite3) |
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

- Auto-seeds the 612-card deck into SQLite on first boot
- Persistent volume at `/app/data` for the database
- Custom cards can be added via the `/admin` page

## License

This project is for personal/family use. Card content is original and Krishna-conscious.
