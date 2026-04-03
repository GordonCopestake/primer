# Documentation.md

## Current status

- Milestone 1 bootstrap scaffold created.
- Shared contracts, curriculum fixtures, API route skeletons, and Prisma models have been added.
- Validation commands now run end-to-end in this environment (`pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`).

## Decisions

- Use a modular monorepo from day one.
- Keep the backend as a modular monolith for MVP.
- Prefer REST + OpenAPI for external API interoperability.
- Validate curriculum fixture JSON with Zod (`CurriculumNodeSchema`) before it is used by the curriculum engine.
- Use a workspace-aware Metro config for the Expo app and perform learner app build validation with web export in offline mode.

## Runbook

- Install dependencies with pnpm once the workspace package manager is available.
- Run root validation commands from the repository root.
- Learner app build command is `EXPO_OFFLINE=1 CI=1 expo export --platform web` to support CI/offline environments.

## Known issues

- The workspace contains a read-only `.codex` file that blocks creating the exact `.codex/config.toml` path required by the spec.
