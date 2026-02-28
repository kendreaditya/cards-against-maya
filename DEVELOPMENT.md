# Cards Against Maya — Development Log

This document captures the key decisions, learnings, and implementation details from building the Cards Against Maya online multiplayer web app.

## What We Built

An online multiplayer version of "Cards Against Maya" — a Krishna-conscious, family-friendly card game in the style of Cards Against Humanity. The 612-card curated deck (102 prompts + 510 responses) that was already generated as print-ready PNGs is now playable online in real-time.

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

### SQLite for Card Storage

Used `better-sqlite3` (synchronous API) for card persistence. The database auto-seeds from `cards_against_maya_top612.csv` on first boot if the `cards` table is empty. This allows:

- Adding custom cards via the `/admin` page without modifying the CSV
- Persisting custom cards across deployments (Railway persistent volume at `/app/data`)
- Fast synchronous reads during game setup

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

## UI/UX: Monochrome Theme

### What is a monochrome theme?

A color palette using only shades of a single hue — in this case, black, white, and grays. No yellow, green, red, or any color accents.

### Why monochrome?

- Matches the iconic Cards Against Humanity aesthetic (stark black and white cards)
- Creates visual focus — the card text is what matters, not UI chrome
- Feels premium and clean
- Reduces visual noise on mobile

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
- **Deploy**: `npx @railway/cli up` from project root (no git — direct upload)

### Deployment Learnings

1. **Nixpacks > Docker** for this stack. The custom Dockerfile had issues with Next.js standalone mode not bundling native dependencies (`better-sqlite3`). Nixpacks "just works" — it runs `npm install`, `npm run build`, and `npm start` with proper native module support.

2. **`better-sqlite3` needs native compilation** — it's a C++ addon. Nixpacks handles this automatically. Docker would need `node-gyp` + build tools in the image.

3. **Railway's `PORT` env var** must be respected. The server reads `process.env.PORT` and defaults to 3000 locally.

4. **No git repo needed** — `railway up` uploads the directory directly. Useful for quick iteration without git ceremony.

## File Structure

```
cards-against-humanity/
├── CLAUDE.md                    # Claude Code instructions
├── DEVELOPMENT.md               # This file
├── web/                         # Online multiplayer web app
│   ├── server.ts                # Custom Express + Socket.IO + Next.js
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Home (join game)
│   │   │   ├── layout.tsx       # Root layout + Inter font
│   │   │   ├── globals.css      # Monochrome theme + animations
│   │   │   ├── admin/page.tsx   # Card manager
│   │   │   └── api/cards/route.ts
│   │   ├── components/
│   │   │   ├── card.tsx         # Single card (black/white)
│   │   │   ├── card-hand.tsx    # Scrollable hand of cards
│   │   │   ├── prompt-card.tsx  # Large prompt display
│   │   │   ├── lobby.tsx
│   │   │   ├── playing-phase.tsx
│   │   │   ├── judging-phase.tsx
│   │   │   ├── round-result.tsx
│   │   │   ├── game-over.tsx
│   │   │   ├── game-view.tsx    # Phase router
│   │   │   ├── scoreboard.tsx
│   │   │   └── player-list.tsx
│   │   ├── context/
│   │   │   └── game-context.tsx
│   │   ├── hooks/
│   │   │   └── use-socket.ts
│   │   └── lib/
│   │       ├── types.ts
│   │       ├── db.ts
│   │       ├── csv-parser.ts
│   │       ├── game-manager.ts
│   │       ├── socket-handlers.ts
│   │       └── utils.ts
│   └── data/                    # SQLite DB (created at runtime)
├── generate_cards.py            # Print-ready PNG generator
├── make_deck.py                 # CSV builder from batch files
├── score_cards.py               # LLM scoring + selection
├── extract_cards.py             # Source spreadsheet extractor
├── cards_against_maya.csv       # Full 1068-card deck
├── cards_against_maya_top612.csv # Curated 612-card deck
├── scores/                      # LLM scoring JSON batches
├── printable_cards/             # Generated PNGs
└── venv/                        # Python virtualenv
```
