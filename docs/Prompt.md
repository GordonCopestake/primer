# Prompt.md

## Goal

Build the Primer MVP as defined in `docs/Architecture.md` and `docs/UX.md`.

## Hard constraints

- TypeScript monorepo using pnpm + Turbo
- React Native (Expo) learner app
- Next.js parent web and backend
- PostgreSQL + Prisma
- Structured AI outputs only
- Safety gating required for all child-facing AI responses
- Parent visibility required for progress and safety reviews

## Must-have deliverables

- Parent onboarding and household setup
- Child profiles
- Baseline assessment
- Learner home screen
- Tutoring session flow
- Story mode
- Homework help upload and guided solve
- Parent dashboard
- Safety event workflow

## Non-goals

- Open-ended social companion features
- Teacher multi-tenant classroom management in MVP
- Arbitrary internet search inside learner flow
- Microservice decomposition before MVP completion

## Done when

- The MVP definition of done in `docs/Architecture.md` is satisfied
- Core lint/typecheck/test/build commands pass
- Documentation is updated
