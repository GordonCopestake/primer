# Implement.md

Treat `docs/Plan.md` as the execution plan.

## Execution rules

- Work milestone by milestone.
- Keep diffs scoped and reviewable.
- Prefer vertical slices that produce usable screens and APIs.
- Use placeholder or mock implementations only when explicitly marked and tracked.
- Update `docs/Documentation.md` after each milestone.
- Do not leave broken tests, type errors, or lint failures behind.

## Validation commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
