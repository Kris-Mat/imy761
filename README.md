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

## Firebase Data Connect

The database schema and generated client SDK are managed through Firebase Data Connect, config lives under `dataconnect/`.

**Key facts:**

| | |
|---|---|
| Firebase project | `imy761-b36eb` (aliased as `imy761-dev`, see `.firebaserc`) |
| Cloud SQL instance | `imy761-fdc` (`us-east4`) |
| Postgres database | `fdcdb` |
| Connector | `users` (`dataconnect/users/`) |
| Schema source | `dataconnect/schema/schema.gql` |
| Generated client SDK | `src/dataconnect-generated` — **gitignored, never edit by hand**, regenerate it instead (see below) |

One-time setup:

```
npm install -g firebase-tools
firebase login
firebase use imy761-dev
```

**After changing the schema and data** (`dataconnect/schema/schema.gql`) — updates the Postgres tables:

```
rm -rf dataconnect/.dataconnect/pgliteData
firebase dataconnect:sql:diff       # preview the SQL migration Data Connect would run
firebase dataconnect:sql:migrate    # apply it to Cloud SQL
```

**After changing operations** (queries/mutations in `dataconnect/users/*.gql`) — regenerates the typed client SDK in `src/dataconnect-generated`:

```
firebase dataconnect:sdk:generate
```

**Local development** (runs Data Connect against a local Postgres emulator instead of Cloud SQL, data persisted to `dataconnect/.dataconnect/`, gitignored):

```
firebase emulators:start --only dataconnect
```

**Deploying** schema + connector to the `imy761-dev` project:

```
firebase deploy --only dataconnect
```

- firebase dataconnect:sql:migrate — syncs the underlying Postgres schema with schema.gql. Ran first to check whether adding firstName/lastName needed a DB-level change (it reported already up to date — this step alone does not update the GraphQL service).
- firebase deploy --only dataconnect — deploys the actual Data Connect GraphQL service schema and connector. This is the step that made firstName/lastName (and later, the @auth level change) take effect — sql:migrate doesn't touch this. Needed to run this again after editing @auth(level: PUBLIC) → @auth(level: NO_ACCESS) on the SeedUsers mutation.
- firebase dataconnect:execute dataconnect/users/seed_users.gql — runs the seed mutation against the deployed Data Connect service to actually insert the seed users. Ran this after each schema/connector change and each time a new user was added to the mutation.

Rule of thumb to document alongside this: any time dataconnect/schema/schema.gql or the @auth level in a connector .gql file changes, firebase deploy --only dataconnect must run before firebase dataconnect:execute — otherwise the deployed service still validates against the old shape/rules.


## Branching

Branch names should include the developer's name so changes are easy to attribute, in the form:

```
<type>/<name>/<short-description>
```

- `type` — `feature`, `fix`, `bug`, `refactor`, etc.
- `name` — the developer's first name (or initials)
- `short-description` — kebab-case summary of the change

Examples:

```
feature/krista/gamified-leaderboard
bug/louise/user-api-cors
```

Open a PR into `dev` when a branch is ready for review; avoid pushing directly to `main` or `dev`.

## Notes

- There is no test suite configured yet — `apps/*/server`'s `test` script is a placeholder that exits with an error.
- `apps/shared` is intentionally free of framework-specific code — keep it limited to types, API clients, and pure utilities that both `plain` and `gamified` can consume.
