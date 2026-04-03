# Implement.md

Treat `docs/Plan.md` as the execution plan.

## Execution rules

- Work milestone by milestone.
- Keep diffs scoped and reviewable.
- Prefer vertical slices that produce usable local learner and parent-on-device flows.
- Use placeholder or mock implementations only when explicitly marked and tracked.
- Keep local-only assumptions consistent (no accidental cloud auth/persistence drift).
- Update `docs/Documentation.md` after each milestone.
- Do not leave broken tests, type errors, or lint failures behind.

## Validation commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
