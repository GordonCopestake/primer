# Documentation.md

## Current status

- Milestone 1 bootstrap scaffold created.
- Shared contracts, curriculum fixtures, API route skeletons, and Prisma models have been added.

## Decisions

- Use a modular monorepo from day one.
- Keep the backend as a modular monolith for MVP.
- Prefer REST + OpenAPI for external API interoperability.

## Runbook

- Install dependencies with pnpm once the workspace package manager is available.
- Run root validation commands from the repository root.

## Known issues

- The workspace contains a read-only `.codex` file that blocks creating the exact `.codex/config.toml` path required by the spec.
- Dependencies are not yet installed in this environment, so full package-level lint/typecheck/build validation is still pending.
