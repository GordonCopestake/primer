# Prompt.md

## Goal

Build the Primer MVP with a strict local-only default architecture as defined in `docs/Architecture.md` and `docs/UX.md`.

## Hard constraints

- TypeScript monorepo using pnpm + Turbo
- React Native (Expo) universal learner app (iOS/Android/Web)
- Native-first product posture; web is secondary
- No cloud accounts and no server-side user state
- Parent area is on-device only and protected by local parent gate
- Local persistence for learner state, transcripts, safety history, and artifacts
- Structured AI outputs only
- Safety gating required for all child-facing AI responses
- Cloud inference only as optional fallback via stateless relay
- Provider keys stay server-side in the optional relay, never in client apps

## Must-have deliverables

- On-device parent gate and parent area
- Local child profiles
- Baseline assessment
- Learner home screen
- Tutoring session flow
- Story mode
- Homework help capture + guided solve with local artifact storage
- Local parent review for progress, transcripts, and safety events
- Optional export/import backup flow

## Non-goals

- Parent/household cloud login flows
- Multi-device sync in MVP
- Cloud persistence of learner/parent data
- Open-ended social companion features
- Teacher multi-tenant classroom management in MVP
- Arbitrary internet search inside learner flow
- Microservice decomposition before MVP completion

## Done when

- The MVP definition of done in `docs/Architecture.md` is satisfied
- Core lint/typecheck/test/build commands pass
- Documentation is updated and internally consistent with local-only direction
