# Architecture.md

## Purpose

Primer is an AI-powered adaptive tutoring application for children. The MVP covers parent onboarding, child profiles, baseline assessment, tutoring sessions, story mode, homework help, parent dashboarding, safety gating, persistent learner state, curriculum data, and audit logs.

## Principles

- Controlled AI, not freeform AI.
- Mobile-first learner app, web-first parent dashboard.
- Monorepo from day one.
- Type-safe boundaries with shared types and runtime validation.
- Eventful and auditable behavior.
- Prefer simple infrastructure first.

## Stack

- Monorepo: Turborepo
- Package manager: pnpm
- Language: TypeScript
- Runtime: Node.js LTS
- Learner app: React Native + Expo
- Parent app: Next.js
- Backend: Next.js route handlers for MVP
- Database: PostgreSQL + Prisma
- Cache: Redis
- AI gateway: backend only

## Repo shape

```text
primer/
  apps/
  packages/
  prisma/
  infra/
  scripts/
  docs/
  AGENTS.md
```

## Domain modules

- auth
- household
- learner-profile
- curriculum
- session
- tutoring
- story
- homework
- safety
- analytics
- reporting

## Definition of done

The MVP is done when a parent can sign up, create a household and child, the child can complete a tutoring session, progress is visible to the parent, story mode and homework help work, safety events are reviewable, and the repo passes its core quality gates.
