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

## Built With AI — Full Collaboration History

This project was built between **February 22–28, 2026** using **Claude Opus 4.6** (model ID: `claude-opus-4-6[1m]`) via **Claude Code v2.1.32** (Anthropic's CLI tool for agentic coding).

**Zero lines of code were written manually by the user.** Every file — Python scripts, TypeScript web app, CSS animations, game engine, deployment config — was generated and iterated by Claude based on the user's high-level direction.

### By the Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 5 (across 6 days) |
| Human messages | **42** |
| AI response turns | **506** |
| Human:AI turn ratio | **1:12** (for every 1 human message, the AI produced ~12 tool-call/response turns) |
| Files created or modified | 60+ |
| Total cards generated | 1,068 (169 prompts + 899 responses) |
| Cards scored and curated | 612 (102 prompts + 510 responses) |
| Print-ready card images | 1,070 PNGs (169 black + 899 white + 2 backs) at 1200 DPI |

### Timeline — 5 Phases of Development

**Phase 1: Card Content Creation** (Feb 22)
- User's opening message: *"Go through the CSV and explore it, then make a Krishna-conscious version of it specifically from Bhagavatam and Gita and Gaudiya."*
- User interrupted the AI's first attempt, asking it to *"make an external plan as to how to effectively convert it to KC"* before executing.
- User provided an 8,884-character plan covering 7 humor principles to preserve, character/setting mappings (CHUNGO→DURYO, school→gurukula, Christmas→Janmashtami), 9 response categories with target counts, and a 10-batch parallelization strategy.
- AI launched 10 parallel sub-agents to convert all 1,068 cards simultaneously. Some batches failed and needed re-runs (user said "can you try again", "continue" twice).
- Result: 169 prompts + 899 responses saved to 10 batch text files, then assembled into `cards_against_maya.csv`.

**Phase 2: Print-Ready Card Generation** (Feb 23)
- User asked to research custom CAH card printing and clone the `cah-generator` GitHub repo.
- AI discovered Docker was required but not installed, so it autonomously wrote a standalone Python script (`generate_cards.py`) using Pillow instead.
- User provided 5 screenshots across multiple iterations for visual feedback:
  - *"Make the name 'Cards Against Maya' and make the text larger"*
  - *"Why is the back's text centered? Make it left aligned"*
  - *"Make the card backs 500pt, but the prompt/response cards make the text larger"*
  - *"Can you increase the line space a bit too"*
- Result: 1,070 print-ready 3288x4488px PNGs + ZIP bundle for MakePlayingCards.com upload.

**Phase 3: Card Scoring & Curation** (Feb 23–24)
- User: *"Make a plan to make a rubric and rank based on funniest, offensive, etc., and get the top 612 cards. Find a good split between prompts and responses ideal for 4–9 players."*
- AI researched official CAH ratios (90 black / 460 white = 1:5), proposed 102 prompts + 510 responses.
- User provided a scoring plan: 6 dimensions with specific weights (humor 30%, appropriateness 20%, versatility 20%, cultural relevance 15%, specificity 10%, originality 5%).
- AI launched 8 parallel scoring agents, then built `score_cards.py` to compute weighted scores and select the top 612.
- User asked follow-up questions: *"How did you come up with this ratio?"* and *"Which were the top prompts and responses?"*

**Phase 4: Online Web App Build** (Feb 28)
- User: *"Can you make an online version of this game with Railway deployed using Next.js and the CSV? Don't use the images but just use the CSV and recreate the UI online with the full game."*
- User provided a 7,779-character architecture plan specifying Next.js 14, Socket.IO, SQLite, Tailwind, Express, and full game flow.
- AI built the entire web app (~180 tool calls) with only 2 "continue" prompts from the user.
- After deploying, user found it wasn't working. User asked to: simplify to single global game (no room codes), launch 10 sub-agents to find bugs, then redeploy.
- This phase had the highest AI autonomy: **1:30 human-to-AI turn ratio** — the user gave a plan and the AI executed it across hundreds of file writes with minimal intervention.

**Phase 5: Polish, Deploy & Future Plans** (Feb 28)
- User: *"Make the theme and UI/UX better with monochrome theme and animations."*
- User: *"Put your learnings into a CLAUDE.md file"*, *"make a README"*, *"organize the repo"*.
- User planned Supabase migration, card rating system, card submission feature, and localStorage auto-rejoin.
- AI implemented all features and deployed to Railway.

### Decisions Made by the User (Human Guidance)

The user provided strategic direction and made all product decisions:

1. **Game concept**: Krishna-conscious Cards Against Humanity ("Cards Against Maya")
2. **Conversion approach**: Plan first, then execute — user interrupted the AI's eager first attempt
3. **Humor principles**: User authored the 7-principle framework for what makes CAH work and how to preserve it
4. **Character mappings**: User defined the cultural translation table (CHUNGO→DURYO, school→gurukula, etc.)
5. **Visual design**: User provided screenshots and iterated on text size, alignment, spacing, and font sizes across 5 rounds
6. **Scoring rubric**: User defined the 6 dimensions and their weights for card quality evaluation
7. **Card count target**: User specified 612 total cards and asked AI to find the optimal prompt/response split
8. **Web app architecture**: User specified the full tech stack (Next.js 14, Socket.IO, Railway, etc.)
9. **Single global game**: User requested simplification from multi-room to no room codes
10. **Monochrome theme**: User requested black/white/gray aesthetic
11. **Feature scope**: User specified each enhancement (Supabase, card rating, card submission, localStorage rejoin)
12. **Card rating design**: User chose "rate all cards, store permanently" over alternatives
13. **Card submission timing**: User chose "anytime via floating button" over lobby-only
14. **Full deck over curated**: User chose all 1,068 cards with quality flags rather than just 612
15. **Bug reports**: User identified UI issues via screenshots (hover clipping, screen utilization)

### Decisions Made Autonomously by Claude (AI Initiative)

The AI made all technical and implementation decisions without being asked:

1. **Batch strategy**: Chose 4 prompt batches + 6 response batches for parallel card conversion
2. **Pipeline scripts**: Created `make_deck.py` as a reusable build tool (user just asked for "a CSV")
3. **Pillow over Docker**: When `cah-generator` required Docker (not installed), autonomously wrote a standalone Python image generator
4. **Template rebranding**: Wrote `rebrand_template()` to paint over the original CAH logo and draw "Cards Against Maya"
5. **Auto-sizing text**: Implemented `pick_font_size()` that shrinks from 200pt to 110pt to fit card text
6. **Prompt/response ratio**: Researched official CAH ratios and proposed 102:510 (1:5)
7. **SQLite via better-sqlite3**: Chose embedded database for card persistence
8. **Game state machine**: Designed the phase system (LOBBY→PLAYING→JUDGING→ROUND_RESULT→GAME_OVER)
9. **Socket.IO over raw WebSockets**: Chose the abstraction layer for real-time multiplayer
10. **Express custom server**: Mounted Socket.IO alongside Next.js on a single port
11. **UI component architecture**: 13 React components, game context provider, socket hook
12. **Animation system**: 14 CSS keyframe animations with cubic-bezier spring easing for card dealing
13. **Reconnection by name**: Implemented player reconnect by matching names
14. **Security layer**: Input validation on all socket events, auth checks on host-only actions
15. **Bug sweep**: Found and fixed 9 bugs via systematic audit (czar disconnect, stale submissions, auth gaps, infinite loop risks)
16. **Supabase-first pattern**: Designed fallback architecture with SQLite backup
17. **Repo organization**: Moved card pipeline into `cards/` subdirectory structure
18. **Nixpacks over Docker**: Chose after discovering native module issues with `better-sqlite3`

### AI Success Rate

| Goal | Outcome |
|------|---------|
| Convert 1,068 CAH cards to Krishna-conscious versions | Completed (some batches needed re-runs) |
| Generate print-ready card images | Completed after 5 visual iteration rounds |
| Score and curate top 612 cards | Completed with 6-dimension weighted scoring |
| Build playable online multiplayer | Completed — fully functional game |
| Deploy to Railway | Completed (required debugging broken initial deploy) |
| Monochrome theme + animations | Completed |
| Supabase + rating + submission features | Completed |

The AI's main failure mode was **first attempts that needed user correction**: the initial card conversion batch had issues requiring "try again", the first Railway deploy was broken, and the card image layout needed 5 rounds of visual feedback. However, the AI successfully self-corrected on technical problems (Docker→Pillow, Dockerfile→Nixpacks, bug detection via sub-agents) without user intervention.

## License

This project is for personal/family use. Card content is original and Krishna-conscious.
