# AGENTS.md

You are working on Primer, an AI-powered tutoring product for children.

## Product posture

- Primer is a tutor, not a general chatbot or social companion.
- Safety, adult visibility, and pedagogy take priority over novelty.
- Primer is local-only by default: no cloud accounts, no server-side user state, no cloud persistence by default.
- Do not introduce unscoped features.

## Engineering rules

- Respect the architecture docs in `/docs`.
- Keep changes scoped to the current milestone.
- Prefer simple, explicit code over clever abstractions.
- Shared types and schemas must stay consistent across apps and optional relay boundaries.
- Never bypass safety validation for child-facing AI output.
- Add or update tests for meaningful behavior changes.

## Repository rules

- Apps live in `/apps`.
- Shared libraries live in `/packages`.
- API contracts must be validated with Zod.
- Update docs when architectural or workflow changes are made.

## UX rules

- Child-facing UX must remain simple and age-appropriate.
- Parent-facing UX should prioritize transparency and control.
- Parent controls live in an on-device parent area protected by local parent gate.
- Avoid manipulative reward loops or emotionally dependent language.

## Delivery rules

- Always check `docs/Plan.md` before implementing.
- If a validation command fails, fix it before proceeding.
- If requirements conflict, `docs/Prompt.md` is the source of truth.
