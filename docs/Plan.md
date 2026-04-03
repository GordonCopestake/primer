# Plan.md

## Milestones

1. Repo bootstrap and local-only architecture baseline
2. Local parent gate foundation (PIN, optional biometrics)
3. Learner app shell + on-device parent area shell
4. Local storage foundation (structured data + local files + secure secrets)
5. Local learner profiles, curriculum persistence, and learner state
6. Tutoring orchestration with local-first inference pipeline
7. Story mode with local persistence and safety checks
8. Homework help with local artifact capture and guided solve
9. Local safety history, transcript review, and parent controls
10. Optional stateless inference relay + optional export/import backup + hardening

## Validation rule

After each milestone:

- run lint
- run typecheck
- run tests relevant to changed modules
- fix failures before continuing

## Decision rule

Do not expand scope outside the current milestone unless a blocking dependency requires it.
