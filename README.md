# NightQuest

A sleek, dark-themed gaming night planner. Players mark their weekly availability and the app finds the best day for everyone. When multiple days tie, a built-in voting system breaks the deadlock.

On first launch, a setup form lets you add your group's players — no config files or hardcoded names.

## Features

- **Player setup** — add, remove, and persist players on first run
- **Weekly calendar** — each player toggles their availability per weekday
- **Best day detection** — automatically finds the day with the most players available
- **Tiebreaker voting** — when multiple days tie, players vote to decide
- **Auto-reset** — availability and votes clear every Monday

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Framework | [Next.js](https://nextjs.org) 13 (App Router) |
| Language  | TypeScript                          |
| Database  | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Dates     | [date-fns](https://date-fns.org)   |
| Styling   | Custom CSS (no Tailwind)            |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

No external database server is needed — SQLite runs embedded and creates `nightquest.db` in the project root automatically.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first visit you'll see the player setup form.

## Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start development server           |
| `npm run build` | Create optimised production build  |
| `npm run start` | Serve the production build         |
| `npm run lint`  | Run ESLint                         |

## Project Structure

```
app/
├── api/
│   ├── availability/route.ts   # Toggle & fetch player availability
│   ├── players/route.ts        # CRUD for players
│   └── votes/route.ts          # Cast & remove tiebreaker votes
├── components/
│   ├── PlayerSetup.tsx          # First-launch player form
│   ├── WeekCalendar.tsx         # Weekly availability grid
│   ├── AvailabilitySummary.tsx  # Best day result display
│   └── VotingSystem.tsx         # Tiebreaker voting UI
├── lib/
│   └── db.ts                    # SQLite connection & schema
├── globals.css                  # Full design system (dark theme)
├── layout.tsx                   # Root layout with fonts
└── page.tsx                     # App orchestrator
```

## Database

The app uses an embedded SQLite database (`nightquest.db`) with four tables:

- **players** — registered player names
- **availability** — which players are free on which dates
- **votes** — tiebreaker votes (one per player)
- **app_config** — tracks the last weekly reset

The database file is created automatically on first run and is listed in `.gitignore`.

## Design

The UI follows a dark, minimal aesthetic inspired by modern portfolio sites:

- Dark background (`#0a0a0b`) with elevated card surfaces
- Purple → teal gradient accents (`#6c63ff` → `#00d4aa`)
- Inter for body text, JetBrains Mono for labels
- Subtle animations: reveal on load, shimmer gradients, hover lifts
