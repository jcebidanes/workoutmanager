# Personal Trainer App

Full-stack SaaS reference for personal trainers to manage templates, clients, and progress. The frontend is built with React + Vite, while the backend is an Express API backed by Knex.

## Requirements

- Node.js 18+
- npm 9+
- SQLite (dev/test) or Postgres (prod-ready)

## Environment configuration

Environment variables are validated via `zod` and loaded with `dotenv-flow`, so files follow the familiar pattern: `.env`, `.env.local`, `.env.development`, `.env.production`, etc. The order of precedence is `.env.{NODE_ENV}.local` → `.env.{NODE_ENV}` → `.env.local` → `.env`.

1. Copy `.env.example` to `.env.local`.
2. Fill the required secrets:

```
NODE_ENV=development
PORT=3001
JWT_SECRET=change-me
# Optional Postgres connection:
# DATABASE_URL=postgres://user:pass@localhost:5432/personal_trainer
# SQLite fallbacks:
SQLITE_DB_FILE=./db/dev.sqlite3
SQLITE_DB_FILE_TEST=./db/test.sqlite3
```

3. For production, define `DATABASE_URL` and any other secrets in the deployment environment (or `.env.production` for staging).

## Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Vite dev server (frontend)                      |
| `npm run dev:server`   | Nodemon API server (Express + Knex)             |
| `npm run dev:migrate`  | Run dev migrations                              |
| `npm run build`        | Type-check + production build                   |
| `npm run test`         | Backend + frontend tests                        |
| `npm run test:backend` | Jest + Supertest integration suites             |
| `npm run test:frontend`| Vitest + Testing Library                        |

## Database

Knex uses SQLite for local development/testing and Postgres when `DATABASE_URL` is provided. Migrations live in `db/migrations`. The CLI respects the current `NODE_ENV`, so for example:

```
npx knex migrate:latest --env development
npx knex migrate:latest --env test
```

## Testing

- Backend: `jest` with Supertest. Tests run against an isolated SQLite file (defined via `SQLITE_DB_FILE_TEST`).
- Frontend: `vitest` with Testing Library + jsdom.

## Folder structure

- `config/` – typed environment config reused across server + tooling.
- `server/` – Express routes, middleware, services.
- `db/` – Knex instance and migrations.
- `src/` – React app (hooks, contexts, pages, sections).
- `tests/` – Jest helpers plus backend suites.

## Deployment checklist

1. Set secrets (`JWT_SECRET`, `DATABASE_URL`, etc.) via your platform’s secret manager.
2. Run `npm run build` and ship the `/dist` bundle + API server.
3. Make sure the API runs with `NODE_ENV=production` so the correct config is selected.
4. Configure HTTPS + reverse proxy to pass requests to `PORT`.
