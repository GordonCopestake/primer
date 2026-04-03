# Primer

Primer is a local-first tutoring product monorepo for child learning experiences.

## Repo layout

- `apps/learner-app`: Expo learner app
- `apps/parent-web`: Next.js parent area
- `apps/api`: optional local-first API and relay boundary
- `packages/*`: shared libraries
- `docs/`: architecture, plan, and product spec

## Source of truth

- `docs/Prompt.md`
- `docs/Plan.md`
- `docs/Implement.md`
- `docs/Architecture.md`
- `AGENTS.md`

## Requirements

- Node.js 20+
- `corepack` enabled
- `pnpm` via the repo package manager setting

## Install

From the repo root:

```bash
corepack enable
corepack pnpm install
```

## Run the apps

Open separate terminals for each app you want to run.

### Learner app

Runs with Expo. For web development:

```bash
corepack pnpm --dir apps/learner-app dev
```

Then open:

- `http://localhost:8081`

Notes:

- The learner app is currently validated on web via Expo export.
- If Metro gets into a stale state, stop it and restart the command above.

### Parent web app

```bash
corepack pnpm --dir apps/parent-web dev
```

Then open:

- `http://localhost:3000`

### API app

```bash
corepack pnpm --dir apps/api dev
```

Then open:

- `http://localhost:3001` if port `3000` is already in use
- otherwise Next will usually use `http://localhost:3000`

## Validate the repo

Per app/package:

```bash
corepack pnpm --dir apps/learner-app lint
corepack pnpm --dir apps/learner-app typecheck
corepack pnpm --dir apps/learner-app test

corepack pnpm --dir apps/parent-web lint
corepack pnpm --dir apps/parent-web typecheck
corepack pnpm --dir apps/parent-web test

corepack pnpm --dir apps/api lint
corepack pnpm --dir apps/api typecheck
corepack pnpm --dir apps/api test
```

From the repo root:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

In some environments, Turbo cannot discover `pnpm` when invoked through `corepack pnpm` directly. If that happens, use a small `pnpm` wrapper on `PATH` or run the package-level commands above.

## Build commands

Learner app web export:

```bash
corepack pnpm --dir apps/learner-app build
```

Parent web production build:

```bash
corepack pnpm --dir apps/parent-web build
```

API production build:

```bash
corepack pnpm --dir apps/api build
```

## Product posture

- local-first by default
- no cloud accounts required for normal operation
- parent visibility and safety take priority over novelty
- child-facing UX should stay simple and age-appropriate
