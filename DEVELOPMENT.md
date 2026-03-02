# Cards Against Maya — Development Log

This document captures the key decisions, learnings, and implementation details from building the Cards Against Maya online multiplayer web app.

## What We Built

An online multiplayer version of "Cards Against Maya" — a Krishna-conscious, family-friendly card game in the style of Cards Against Humanity. The full 1,068-card deck (169 prompts + 899 responses) is playable online in real-time, with the top 612 flagged as top-scored.

**Live at**: https://shimmering-commitment-production.up.railway.app

## Architecture Decisions

### Single Global Game (no room codes)

Originally built with a multi-room system (4-letter room codes, create/join flows). Simplified to a **single global game** — everyone enters their name and joins the one active game. This removed significant complexity:

- Eliminated `roomCode` from all types, game state, and socket events
- Removed `create-game` socket event entirely
- Replaced `Map<string, GameState>` with a single `game` variable
- Deleted the `game/[roomCode]/page.tsx` dynamic route
- Simplified the home page to just a name input + "Join Game" button

**Why**: For a small group of friends/family playing together, room codes add friction with no benefit.

### Custom Express Server (not Next.js standalone)

Socket.IO requires attaching to an HTTP server, which Next.js's built-in server doesn't expose. Solution: custom `server.ts` that creates Express, attaches Socket.IO, then passes remaining requests to Next.js.

**Key learning**: Railway's Nixpacks build works better than a custom Dockerfile for this setup. The standalone Next.js output doesn't bundle Express/Socket.IO/better-sqlite3, causing module resolution issues. Nixpacks just runs `npm install` + `npm run build` + `npm start`.

### Supabase + SQLite Dual Data Layer

The app uses a **unified data access layer** (`data.ts`) that tries Supabase first and falls back to SQLite:

- `supabase.ts` — Supabase client with async query functions
- `data.ts` — try/catch wrapper that routes to Supabase or SQLite
- `db.ts` — SQLite (always available, auto-seeds from CSV)

**Why dual**: Supabase provides cloud persistence and the `card_ratings` table for long-term data. SQLite ensures the app works even without Supabase configured (local dev, or if Supabase is down). Game state (`game-manager.ts`) calls `startGame()` which is async to support the Supabase path.

### Full 1068-Card Deck with Quality Flags

Switched from the curated 612-card deck to the full 1,068. Added `is_top_scored` boolean to the `Card` type and database schema. During SQLite seeding, the curated deck CSV is cross-referenced to flag top-scored cards. This allows future filtering (e.g., "play with only top-scored cards").

### localStorage Auto-Rejoin

Player name is stored in `localStorage` on successful join. On socket reconnect (page refresh, network blip), the hook auto-emits `join-game` with the stored name. The server's existing name-matching reconnection logic preserves the player's hand, score, and position. If the auto-rejoin fails (no active game), localStorage is cleared and the join form is shown.

### In-Memory Game State

Game state (players, hands, rounds, scores) lives entirely in memory — no database. Games are ephemeral. This is intentional: the game is meant for live play sessions, not persistent state.

## Bugs Found and Fixed

A thorough audit found 9 bugs in the original implementation:

### Critical

1. **Czar disconnect fallthrough** — When the czar disconnects during `playing`/`judging`, `startNewRound()` was called but execution fell through into the "check if submissions complete" block. A new round with 0 submissions would erroneously advance to judging (since `0 >= 0` is `true`). **Fix**: Added early `return` after `startNewRound()`.

2. **Reconnecting player stale submission IDs** — When a player reconnects, their socket `id` updates, but existing submissions still reference the old ID. Duplicate submission checks fail and points get lost. **Fix**: Updated reconnection logic to also update `playerId` in existing submissions.

### Medium

3. **No auth on `nextRound`** — Any player could advance the round. **Fix**: Added host/czar verification.
4. **No auth on `playAgain`** — Any player could reset the game. **Fix**: Added host authorization check.
5. **Socket handlers missing input validation** — Duplicate joins were possible. **Fix**: Added proper validation.
6. **Stale `selectedId` in React components** — Selected card ID could persist across round changes. **Fix**: Added `useEffect` to reset selection when `round.number` changes.

### Low

7. **Czar rotation could select disconnected player** — If all players disconnected, rotation would loop infinitely. **Fix**: Added connected-player count check.
8. **Infinite loop in `drawCards`** — If no response cards remain after reshuffling, `drawCards` loops forever. **Fix**: Added guard after reshuffling.
9. **`isHost` flag not cleared on old host** — When host transfers on disconnect, old player's `isHost` remained `true`. **Fix**: Set `player.isHost = false` before removal.

### UI Bugs (found via screenshot)

10. **Card hover scale clipped** — `overflow-x-auto` on the card hand container clipped the hover scale animation. **Fix**: Added `overflow-y-visible` and `py-2` padding on card wrappers.
11. **Layout too narrow** — Game content constrained to `max-w-2xl` (672px). **Fix**: Expanded to `max-w-4xl`.
12. **Mobile scoreboard too bulky** — Vertical sidebar took too much space on mobile. **Fix**: Replaced with compact horizontal top bar on mobile (`compact` prop on Scoreboard component), kept vertical sidebar on desktop (lg+).

## UI/UX: Monochrome Theme

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0a` | Page background |
| `--foreground` | `#e5e5e5` | Primary text |
| `--muted` | `#737373` | Secondary text, labels |
| `--surface` | `#141414` | Card backgrounds, inputs |
| `--surface-hover` | `#1c1c1c` | Hover states |
| `--border` | `#262626` | Borders, dividers |
| `--accent` | `#ffffff` | Buttons, highlights |

### Animations

14 CSS keyframe animations, all defined in `globals.css`:

| Animation | Usage | Easing |
|-----------|-------|--------|
| `fadeIn` | General page transitions | ease-out |
| `fadeInUp` | Sections entering from below | ease-out |
| `fadeInDown` | Error messages, status text | ease-out |
| `slideInRight` | Scoreboard sidebar | ease-out |
| `scaleIn` | Prompt cards, buttons appearing | ease-out |
| `subtlePulse` | Waiting states ("Connecting...", "Czar is choosing...") | ease-in-out, infinite |
| `cardDeal` | Cards animating into hand with slight rotation + bounce | cubic-bezier spring |
| `trophy` | Winner star on game over | cubic-bezier spring |
| `stagger-children` | List items animate in sequentially (60ms delay) | ease-out |
| `stagger-deal` | Cards deal in sequentially (50ms delay) | cubic-bezier spring |

**Key technique**: `cubic-bezier(0.34, 1.56, 0.64, 1)` creates a spring/bounce effect — the value overshoots 1.0 (1.56) before settling, giving cards a natural "landing" feel.

## Deployment

### Railway Setup

- **Project**: `shimmering-commitment`
- **Build**: Nixpacks (auto-detected `npm run build`)
- **Start**: `npm start` → `npx tsx server.ts`
- **Volume**: Persistent volume at `/app/data` for SQLite
- **Deploy**: `cd web && npx @railway/cli up`

### Deployment Learnings

1. **Nixpacks > Docker** for this stack. The custom Dockerfile had issues with Next.js standalone mode not bundling native dependencies (`better-sqlite3`). Nixpacks "just works".
2. **`better-sqlite3` needs native compilation** — Nixpacks handles this automatically. Docker would need `node-gyp` + build tools.
3. **Railway's `PORT` env var** must be respected. The server reads `process.env.PORT` and defaults to 3000 locally.
4. **Railway CLI must be run from `web/`** — the Railway project is linked to the `web/` directory, not the repo root.

## File Structure

```
cards-against-maya/
├── CLAUDE.md                        # Claude Code instructions
├── DEVELOPMENT.md                   # This file
├── README.md                        # Project overview + AI collaboration history
├── TODO.md                          # Task tracker
├── web/                             # Online multiplayer web app
│   ├── server.ts                    # Custom Express + Socket.IO + Next.js
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── data/                        # CSV seed files + SQLite DB (runtime)
│   │   ├── cards_against_maya.csv   # Full 1068-card deck (seed source)
│   │   └── cards_against_maya_top612.csv  # Curated deck (for is_top_scored flags)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Home (join game, auto-reconnect)
│   │   │   ├── layout.tsx           # Root layout + Inter font
│   │   │   ├── globals.css          # Monochrome theme + 14 animations
│   │   │   ├── admin/page.tsx       # Card manager
│   │   │   └── api/cards/route.ts   # REST API (uses data.ts)
│   │   ├── components/
│   │   │   ├── card.tsx             # Single card (black/white)
│   │   │   ├── card-hand.tsx        # Scrollable hand (overflow-y-visible)
│   │   │   ├── prompt-card.tsx      # Large prompt display
│   │   │   ├── add-card-modal.tsx   # Card submission modal + writing tips
│   │   │   ├── lobby.tsx
│   │   │   ├── playing-phase.tsx
│   │   │   ├── judging-phase.tsx
│   │   │   ├── round-result.tsx     # + card rating UI (1-5 dots)
│   │   │   ├── game-over.tsx
│   │   │   ├── game-view.tsx        # Phase router + floating "+" button
│   │   │   ├── scoreboard.tsx       # Desktop sidebar + mobile compact bar
│   │   │   └── player-list.tsx
│   │   ├── context/
│   │   │   └── game-context.tsx     # Exposes rateCards + autoRejoining
│   │   ├── hooks/
│   │   │   └── use-socket.ts        # + localStorage auto-rejoin
│   │   └── lib/
│   │       ├── types.ts             # + is_top_scored, rate-cards event
│   │       ├── data.ts              # Unified async data layer
│   │       ├── supabase.ts          # Supabase client + queries
│   │       ├── db.ts                # SQLite + card_ratings table
│   │       ├── csv-parser.ts        # Points to full 1068-card CSV
│   │       ├── game-manager.ts      # async startGame()
│   │       ├── socket-handlers.ts   # + rate-cards handler
│   │       └── utils.ts
├── cards/                           # Card generation pipeline
│   ├── generate_cards.py
│   ├── make_deck.py
│   ├── score_cards.py
│   ├── extract_cards.py
│   ├── cards_against_maya.csv       # Full 1068-card deck
│   ├── cards_against_maya_top612.csv
│   ├── batches/                     # Raw prompt/response batch text files
│   ├── extracted/                   # One-time extraction output
│   ├── scores/                      # LLM scoring JSON batches
│   ├── source/                      # Original CAH source material
│   ├── cah-generator/               # Upstream template repo (fonts, images)
│   └── cah_generator/               # Generated files for cah-generator tool
└── venv/                            # Python virtualenv
```
