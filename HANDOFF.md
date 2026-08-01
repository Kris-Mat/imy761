# Project Handoff

Living context doc for AI agents picking up this repo mid-session. Update this whenever
something structurally important changes. Keep it dense — this is for an agent with zero
conversation history, not a status report for humans.

Note: this file is **not git-tracked** (repo is mid-project, nothing here is committed yet) and
has already been wiped once by an untracked-file cleanup during a `git merge`/pull. If you're
reading this, it currently exists — but don't assume it always will; don't treat its absence as
"first time working on this repo."

## What this project actually is

Implementation for an Honours (IMY 761, University of Pretoria) research project by Louise
Bruwer and Krista Matsila, supervised by Annique Smith. Research instrument, not a product: the
study compares a **gamified** vs **plain** (non-gamified/control) version of the same
soil-science learning web app to measure the effect of challenge-based gamification on student
engagement.

`apps/plain` = the control version (this is what's been built out). `apps/gamified` = still the
completely untouched Vite/tsoa starter scaffolding — nothing has been built there yet, and
nothing in it consumes any of the DB models described below.

## Current state (as of 2026-08-01)

**Plain client is real-content, DB-backed, and working.** Built to a specific client brief:
3 chapters (Hutton, Avalon, Rensburg soil forms), content transcribed exactly from
`Plain App questions + answers.pdf` (Louise's Downloads folder — not in the repo). No
gamification anywhere (no points/XP/locking/animated feedback) — this is explicitly the control
condition, must "resemble an educational revision tool rather than a game."

**Stack**: Mantine (full suite — `@mantine/core` etc. — Krista installed it, already in
`apps/plain/client/package.json`), `react-router-dom`, a custom `soil` theme color (green,
generated from `#1f5c35`, see `apps/plain/client/src/theme.ts`), phosphor icons via
`apps/shared/ui/Icon.tsx` (Krista's shared icon wrapper).

### Pages (`apps/plain/client/src/pages/`)
- `Home.tsx` — greeting, per-chapter completion status, "pick up where you left off"
- `Tests.tsx` — accordion nav, one row per chapter (Hutton/Avalon/Rensburg), Start/Continue +
  checkmark if done. **No locking** — all chapters always clickable.
- `ChapterRunner.tsx` (route `/tests/:monolithId`) — the actual learning flow, 6 sequential
  steps per chapter: monolith exploration → 4 MCQ questions (interleaved) → soil family code
  entry. See "Chapter step order" below — it's NOT a simple sequence, don't re-sort by naive
  question order.
- `Completed.tsx` (route `/completed`) — shown after finishing Rensburg (the last chapter).
- `Profile.tsx` — mentor/goals are still **static placeholders**, not DB-backed (not confirmed
  in scope by the client — see `apps/plain/client/src/pages/Profile.tsx` top-of-file consts).

### Chapter step order (fixed, not derived from a generic sort)
`[monolith, question[DIAGNOSTIC_HORIZONS], question[SOIL_FORM], soilFamilyCode, question[LANDSCAPE_POSITION], question[SUITABILITY]]`
— see `buildSteps()` in `ChapterRunner.tsx`. The soil family code step sits in the *middle*, not
at the end. This matches the PDF's own Q1-Q6 ordering per chapter.

### Behavior specifics (client brief was explicit about these — don't regress them)
- MCQ: selecting an option gives no immediate feedback. Only pressing **Next** checks it. Wrong
  → exact message `"Incorrect. Please review your answer."`, blocks advancing, no points
  gained/lost.
- Soil family code: a `Table` of `TextInput`s (no drag-and-drop). Next validates every field +
  the final code string; any mismatch → exact message `"Some answers are incorrect. Please
  review your responses."`, blocks advancing.
- Monolith step: image is the focus, invisible equal-height clickable bands (one per horizon,
  top-to-bottom = horizon order — images aren't lab-measured so equal division was the honest
  choice, not pixel-matched to the actual colour transitions in the photo). Clicking shows an
  info panel with characteristics + a `MunsellChip`. Panel closes on: selecting a different
  horizon, or clicking anywhere outside the panel (implemented via a manual `mousedown` listener
  in `MonolithStepView`, not Mantine's `Popover` — see code comment for why).
- Last step of a chapter: button becomes "Continue to {next chapter}" (Hutton→Avalon→Rensburg)
  or "Finish" on Rensburg → navigates to `/completed`.
- Completion state (`completedMonolithIds`) lives in `ContentContext` **in memory only** — resets
  on page reload. No attempt/completion persistence to the DB in this pass (client brief didn't
  ask for it; correctness-checking is what's DB-backed, not user progress history).

### Munsell colour handling
Only **one** Munsell chart page was supplied (hue 7.5YR). Every horizon colour in the DB
(`Horizon.colourHue/colourValue/colourChroma`) is an approximation onto that single page —
documented in `apps/shared/server/prisma/seed.ts`'s top comment. The two Rensburg horizons
("Dark grey"/"Grey") are the least faithful match, since 7.5YR has no true grey/gley chip.
Display is `MunsellChip.tsx` — an HSL approximation (hue≈30°, value→lightness, chroma→saturation),
**not** a crop of the actual supplied chart image (deliberately avoided — no reliable way to
know the chart's exact pixel grid coordinates, cropping the wrong cell would be worse than a
clearly-approximate swatch).

## Database — now genuinely in scope, actively used

**This reversed an earlier "hands off, it's Krista's job" instruction mid-project** — confirmed
explicitly by Louise. If you're picking this up much later, sanity-check this is still true
before making more schema changes; don't assume based on this doc alone if it seems stale.

Schema changes were done by **extending/renaming existing models, not adding parallel ones**
(Louise was explicit: "only modify... where absolutely necessary", "reuse existing models").
Concretely, in `apps/shared/server/prisma/schema.prisma`:
- `Monolith` — repurposed as the chapter/soil-form entity (`modelUrl`→`imageUrl`, added
  `orderIndex`).
- `Horizon` — repurposed for real content (label/orderIndex/colourText/colourHue/colourValue/
  colourChroma), dropped unused depth/diagRef fields.
- `DiagnosticHorizonRef` → renamed/repurposed as **`HorizonCharacteristic`** (the bullet list
  per horizon).
- `EcosystemRef` → renamed/repurposed as **`AnswerOption`** (generic MCQ option, `isCorrect`
  flag).
- `Question` — repurposed as a generic MCQ (kept name), `category` enum values changed in place
  (was `MUNSELL`/`DELINEATION`, now `DIAGNOSTIC_HORIZONS`/`SOIL_FORM`/`LANDSCAPE_POSITION`/
  `SUITABILITY`).
- `SoilFamilyCode` + `SoilFamilyField` — genuinely new, no existing model fit this shape.
- **Untouched**: `User`, `UserAttempt`, `UserGameStat`, `Level`, `AchievementMaster`,
  `UserAchievement` — gamification stays isolated for the future gamified-app build. No
  attempt-logging happens in the plain app currently (see above).
- Migration: `apps/shared/server/prisma/migrations/20260801143340_real_soil_content/`.
- Backend: `apps/shared/server/src/{controllers,services,repositories}/monolith.*` (mirrors the
  existing `user.*` pattern exactly), single `GET /monoliths` endpoint returns everything fully
  nested including `isCorrect`/`correctValue` — **answer-checking is client-side**, this is a
  non-adversarial revision tool, not a secured exam.
- Shared API layer: `apps/shared/api/models/monolith.model.ts` +
  `apps/shared/api/services/monoliths.api.ts` (mirrors `user.model.ts`/`users.api.ts`).
- Frontend consumes it via `apps/plain/client/src/context/ContentContext.tsx` — fetches
  `GET /monoliths` once on mount, exposes `monoliths`/`loading`/`completedMonolithIds`/
  `markMonolithCompleted`.

## Cross-platform environment gotchas (Windows agent vs WSL user — read before running anything)

Louise develops from a **WSL Ubuntu terminal**; an AI agent's `Bash` tool here runs under
**native Windows** (Git Bash), even though it looks identical. Both share the same `node_modules`
on the Windows filesystem (`/mnt/c/...` from WSL's view). This causes real, repeated breakage:

1. **`npm run <script>` fails with `'<name>' is not recognized`** for anything that shells out to
   a binary (`prisma`, `eslint`, `vite`, `tsx`...) — Windows npm spawns via `cmd.exe`, which can't
   execute the extension-less POSIX shim scripts that WSL's npm installed. **Workaround**: call
   the real entry file directly, e.g. `node node_modules/eslint/bin/eslint.js <path>` instead of
   `npm run lint`. Watch your `cd` — `cd path 2>/dev/null; cmd` silently runs `cmd` in the wrong
   directory if the `cd` fails.
2. **Running `npm install` from the Windows-side agent corrupts platform-specific native
   binaries** (esbuild, rolldown) for the WSL side, and vice versa — this actually happened
   twice this session and broke Louise's dev server both times. **Do not run `npm install` or
   `npm ci` from the agent side at all.** If a new dependency is needed, add it to `package.json`
   yourself and ask Louise to run `npm install` in her WSL terminal.
3. **`prisma generate`** has the same problem for its query-engine binary — fixed for now by
   setting explicit `binaryTargets = ["native", "windows", "debian-openssl-3.0.x"]` in the
   `generator client` block of `schema.prisma`, so a generate from either side produces both
   engines. Don't remove this.
4. **`tsx` (used by `prisma db seed`) needs a platform-matched `esbuild` binary** and this
   node_modules only has the Linux one — the agent (Windows) **cannot run `npm run db:seed`**,
   only Louise can, from WSL.
5. **`prisma migrate dev` refuses to run non-interactively** (agent's Bash tool has no TTY),
   even with `--create-only`. Workaround used this session: `prisma migrate diff
   --from-schema-datasource ... --to-schema-datamodel ... --script` to get the raw SQL, hand-write
   it into a new `prisma/migrations/<timestamp>_<name>/migration.sql` folder, then
   `prisma migrate deploy` (non-interactive, applies pending migration folders without prompting).
6. **Prisma has a built-in guard blocking AI agents from destructive commands** (`migrate reset`,
   and apparently bare `DELETE` statements via `psql` get caught by a separate host-level
   classifier too) without a fresh, explicit user consent given *in the current session*. Expect
   to ask before any data-deleting action, even a small one on 1-2 throwaway rows.
7. **WSL's DrvFs mount doesn't surface inotify events for file edits made from the Windows
   side** — if Louise has a dev server running in WSL and the agent edits files, it won't
   hot-reload. She needs to restart it herself. `tsc -b` / `eslint` / `vite build` run fine from
   either side and are reliable for verification without needing a live reload.

## Next steps

- [ ] Real per-chapter content is done (all 3 chapters from the PDF); no known gaps.
- [ ] Munsell chips are an approximation — if Louise/Krista get more chart pages (other hues),
      revisit `MunsellChip.tsx` and the seed data's hue values.
- [ ] `gamified` app — still fully untouched, whenever that becomes the active task.
- [ ] No attempt/completion persistence yet — if the client wants progress tracking across
      sessions, that's a schema + `ContentContext` change, not yet built.
