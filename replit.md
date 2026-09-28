# Number Guessing Game

Higher or Lower is a responsive number guessing game with a polished browser interface and a standalone Python game engine.

## Run & Operate

- `pnpm --filter @workspace/number-guessing-game run dev` — run the game preview
- `pnpm --filter @workspace/number-guessing-game run typecheck` — typecheck the frontend
- `python3 artifacts/number-guessing-game/python_game.py` — run the Python version in the terminal
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/number-guessing-game/src/App.tsx` — interactive browser game surface
- `artifacts/number-guessing-game/src/index.css` — theme, responsive styling, motion, and texture
- `artifacts/number-guessing-game/python_game.py` — standalone Python rules engine

## Architecture decisions

- The web game keeps round state in the client for instant feedback and zero setup.
- The Python implementation is dependency-free and exposes typed result objects for reuse in a CLI or API adapter.
- Difficulty is represented as a small configuration map so range, attempt budget, and scoring stay consistent.

## Product

- Players can choose Warm-up, Focus, or Deep cut difficulty.
- Players submit guesses, receive higher/lower feedback, reveal an even/odd hint, and start fresh rounds.
- The interface tracks attempts, score, best score, and cleared rounds with keyboard-friendly controls.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
