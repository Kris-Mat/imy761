# imy761

Krista Matsila & Louise Bruwer

Gamified soil science application, developed as two parallel apps for A/B comparison:

- **plain** — the baseline (non-gamified) version
- **gamified** — the gamified version

Both share the same client/server architecture and a common `shared` package.

## Project structure

```
apps/
  plain/
    client/     # React + Vite frontend (port 4001)
    server/     # Express backend (port 3001)
  gamified/
    client/     # React + Vite frontend (port 4002)
    server/     # Express backend (port 3002)
  shared/       # Code shared by both apps (API models/services, utils), imported via @shared/*
```

Each `client` and `server` is its own npm workspace (`apps/*/*`), so `plain` and `gamified` can be run, built, and deployed independently.

### Client (`apps/{plain,gamified}/client`)

Standard Vite + React + TypeScript setup. API calls go through a service-class layer:

- `src/api/services/base.api.ts` — `BaseApi`, wraps axios, reads `VITE_API_BASE_URL`.
- `src/api/services/*.api.ts` — per-resource classes extending `BaseApi` (e.g. `userApi`).
- `src/api/models/*.model.ts` — request/response types (e.g. `User`).

### Server (`apps/{plain,gamified}/server`)

Express app, entry point `server.ts` at the app root. Routes live under `src/`, mounted under `/api`. Runs directly via `tsx` (no compile step needed for dev/start). Swagger/OpenAPI docs are served at `/api-docs`.

### Shared (`apps/shared`)

Code used by both `plain` and `gamified` (currently API models/services, plus `models`/`utils`). Imported via the `@shared/*` path alias — configured in both the root `tsconfig.json` (for type-checking) and each client's `vite.config.ts` (`resolve.alias`, for bundling). If you add a new alias or shared path, update it in **both** places or the client build will fail with an unresolved-import error even though `tsc` passes.

### Path aliases

Defined in the root `tsconfig.json`:

| Alias | Resolves to |
|---|---|
| `@shared/*` | `apps/shared/*` |
| `@plain-client/*` | `apps/plain/client/src/*` |
| `@plain-server/*` | `apps/plain/server/src/*` |
| `@gamified-client/*` | `apps/gamified/client/src/*` |
| `@gamified-server/*` | `apps/gamified/server/src/*` |

## Getting started

Install dependencies once from the repo root (npm workspaces will link everything):

```
npm install
```

Each client/server reads config from its own `.env` file (`apps/{plain,gamified}/{client,server}/.env`). Ports are wired together via `VITE_PORT_CLIENT`/`VITE_PORT_SERVER` (client) and `PORT_SERVER`/`PORT_CLIENT` (server), and server-side CORS is restricted to the matching client port.

## Running the apps

From the repo root:

| Command | What it runs |
|---|---|
| `npm run dev` | Both apps (plain + gamified), client and server |
| `npm run dev:plain` | Plain client + server together |
| `npm run dev:gamified` | Gamified client + server together |
| `npm run dev:plain:client` | Plain client only (http://localhost:4001) |
| `npm run dev:plain:server` | Plain server only (http://localhost:3001, docs at `/api-docs`) |
| `npm run dev:gamified:client` | Gamified client only (http://localhost:4002) |
| `npm run dev:gamified:server` | Gamified server only (http://localhost:3002, docs at `/api-docs`) |

## Building

```
npm run build
```

Type-checks and bundles both clients (`tsc -b && vite build`, output in each `client/dist`), and type-checks both servers (`tsc --noEmit`) since they run via `tsx` at runtime and won't otherwise catch type errors. Run this before committing — it's the closest thing we have to a CI gate right now.

## Linting

```
npm run lint       # check
npm run lint:fix    # auto-fix
```

One flat ESLint config (`eslint.config.js`) covers both apps. Notable conventions:

- Semicolons required, no trailing commas, 2-space indent, 1TBS braces.
- `camelCase`/`PascalCase`/`UPPER_CASE` naming; classes/interfaces/types must be `PascalCase`.
- `prefer-const` enforced.

## Database (Postgres + Prisma)

The database schema, migrations, and generated client live under `apps/shared/server/prisma/`, shared by both apps since they read/write the same database.

**Key facts:**

| | |
|---|---|
| Local database | Postgres 17 via `docker-compose.yml` (`localhost:5432`, db `imy761`) |
| Schema source | `apps/shared/server/prisma/schema.prisma` |
| Migrations | `apps/shared/server/prisma/migrations/` (committed to git) |
| Seed script | `apps/shared/server/prisma/seed.ts` |
| Generated client | `@prisma/client`, generated into `node_modules` — **gitignored, never edit by hand**, regenerate with `npm run db:generate` |

One-time setup:

```
npm install
docker compose up -d          # starts local Postgres
npm run db:migrate            # creates tables from schema.prisma
npm run db:seed               # inserts the seed users
```

```
docker compose down           # to stop the docker container
```

**After changing the schema** (`apps/shared/server/prisma/schema.prisma`) — creates a new migration file and applies it locally:

```
npm run db:migrate
```

**For a "major" schema change** — adding a required (`NOT NULL`) column to a table that already has rows, changing a column's type, renaming/dropping a model, changing a primary key type — `db:migrate` will fail with a Postgres error (e.g. `column "x" contains null values`) because it can't apply the change against existing data. When that happens (or ahead of time, if you know the change is this kind), reset the local database instead of trying to patch around it:

```
npm run db:reset
```

This drops your local database, reapplies every migration from scratch against an empty database (so there's no existing data to violate), and re-runs the seed script automatically. Only ever run this against your **local** dev database — never against a shared/production one, since it deletes all data. This is exactly what to reach for the moment you see a `P3018` error from `db:migrate`.

**Regenerating the typed client** (usually automatic after `db:migrate`, but needed after pulling schema changes without a new migration):

```
npm run db:generate
```

**Inspecting the database** (opens a browser-based data browser against whichever `DATABASE_URL` is active):

```
npm run db:studio
```

**Deploying** — applies committed migrations to a target database (e.g. a hosted Postgres instance) without generating new ones, which is what you'd run in CI/production:

```
npm run db:deploy
```

Rule of thumb: `db:migrate` is for local development (it also generates the migration file); `db:reset` is for local development when `db:migrate` fails on existing data; `db:deploy` is for applying already-committed migrations to another environment. Never run `db:migrate` or `db:reset` against a shared/production database.


## Branching

Branch names should include the developer's name so changes are easy to attribute, in the form:

```
<type>/<issue-number><name>/<short-description>
```

- `type` — `feature`, `fix`, `bug`, `refactor`, etc.
- `issue_number` - the issue number (eg 12)
- `name` — the developer's first name (or initials)
- `short-description` — kebab-case summary of the change

Examples:

```
feature/11/krista/gamified-leaderboard
bug/20/louise/user-api-cors
```

Open a PR into `dev` when a branch is ready for review; avoid pushing directly to `main` or `dev`.

## Notes

- There is no test suite configured yet — `apps/*/server`'s `test` script is a placeholder that exits with an error.
- `apps/shared` is intentionally free of framework-specific code — keep it limited to types, API clients, and pure utilities that both `plain` and `gamified` can consume.





# Quick setup guide

Here's a short setup runbook for a teammate cloning this fresh:

1. Install prerequisites: Node.js (matching @types/node ~v25) and Docker Desktop (for local Postgres).
2. Clone and install: `git clone ...` then `npm install` from the repo root (installs all 5 workspaces: 2 clients, 2 servers, shared-server).
3. Create the `.env` files (all gitignored, so a fresh clone has none — copy each `.env.example` to `.env`):
   - `apps/gamified/server/.env` and `apps/plain/server/.env`, each with:
     ```
     PORT_SERVER="3002"   # 3001 for plain
     PORT_CLIENT="4002"   # 4001 for plain
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/imy761?schema=public"
     ```
   - `apps/shared/server/.env` — same `DATABASE_URL`, used by the Prisma CLI.
   - `apps/gamified/client/.env` and `apps/plain/client/.env`, each with:
     ```
     VITE_PORT_CLIENT=4002   # 4001 for plain
     VITE_PORT_SERVER=3002   # 3001 for plain
     VITE_API_BASE_URL="http://localhost:3002"   # 3001 for plain
     ```
4. Start Postgres: `docker compose up -d` (leave it running in the background).
5. Apply migrations and seed data (one-time, or whenever the DB is reset): `npm run db:migrate` then `npm run db:seed`.
6. Run an app (from repo root): `npm run dev:gamified` (or `dev:plain`, or `npm run dev` for both) — starts client + server together.
7. Open the browser: `http://localhost:4002` (gamified) or `http://localhost:4001` (plain) — should show the seeded users rendered on the page.
