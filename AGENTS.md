# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src`.
  - `src/app` (Next.js routes, API, middleware)
  - `src/components` (UI; reusable components in PascalCase)
  - `src/lib` (helpers: auth, db, ai, validations, etc.)
  - `src/hooks` (React hooks: `useX`)
- Assets in `public/`. End‑to‑end tests in `tests/`. Scripts in `scripts/`. Docker files in `docker/`.

## Build, Test, and Development Commands
- `bun run dev` — Run the app locally (Next.js dev server).
- `bun run build` / `bun start` — Production build and run.
- `bun run lint` / `bun run lint:fix` — ESLint + Biome checks and autofix.
- `bun run format` — Format with Biome.
- `bun run test` / `bun run test:watch` — Unit tests (Vitest).
- `bun run test:e2e` — Playwright tests; uses `playwright.config.ts` webServer.
- DB: `bun run db:push`, `bun run db:studio`, `bun run db:migrate` (Drizzle Kit).
- Docker: `bun run docker-compose:up` / `:down` to run local stack.

## Coding Style & Naming Conventions
- TypeScript everywhere. Prefer `zod` for validation.
- Formatting via Biome: 2 spaces, LF, width 80, double quotes.
- Components: `PascalCase.tsx`; hooks/utilities: `camelCase.ts`.
- Co-locate small module tests next to code; larger suites under `tests/`.
- Keep modules focused; avoid circular deps; use `src/lib` for shared logic.

## Testing Guidelines
- Unit tests: Vitest, filename `*.test.ts(x)`.
- E2E: Playwright under `tests/`, filename `*.spec.ts`.
- Run locally: `bun run test` and `bun run test:e2e` (ensure app is running or let Playwright start via config).
- Add tests for new features and bug fixes; cover happy path + one failure mode.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, etc. Example: `feat: add image generation tool`.
- Branch names: `feat/…`, `fix/…`, `chore/…`.
- PRs: clear description, linked issues, screenshots or terminal output when UI/CLI changes; list test coverage and manual steps.
- Before opening PR: `bun run check` (lint+types+tests) should pass.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets. For local HTTP use `NO_HTTPS=1` or `bun run build:local`.
- If using DB/Redis locally, start services via Docker scripts or your own stack.
