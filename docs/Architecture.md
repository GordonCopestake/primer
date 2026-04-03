# Architecture.md

## Purpose

Primer is an AI-powered adaptive tutor for children with a **local-only default architecture**. Core learner progress, parent controls, safety history, transcripts, and media stay on the same device. Cloud services are optional and limited to stateless inference relay behavior when local models cannot complete a task.

## Principles

- Tutor product, not a general chatbot.
- Local-first and private-by-default.
- Native-first (iOS/Android) for strongest storage and privacy guarantees.
- Web support is secondary with reduced persistence/privacy guarantees.
- Controlled AI with structured outputs and mandatory safety validation.
- Parent visibility and control are on-device behind a local parent gate.
- Keep infrastructure minimal and explicit.

## Stack

- Monorepo: Turborepo
- Package manager: pnpm
- Language: TypeScript
- Runtime: Node.js LTS (tooling + optional relay)
- Learner app: React Native + Expo (iOS, Android, Web)
- Parent area: on-device mode within the app, unlocked by local parent gate (PIN, optional biometrics)
- Local persistence (native): local database + local filesystem + secure local secret storage
- Local persistence (web): browser-local storage only
- Optional cloud path: stateless inference relay that forwards approved requests and returns responses

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

- parent-gate (local adult unlock)
- learner-profile
- learner-state
- curriculum
- session
- tutoring
- story
- homework
- safety
- local-audit
- optional-inference-relay

## Optional stateless inference relay boundary

The relay is optional and **must not** store accounts, learner state, transcripts, files, analytics, or long-term logs. It only:

1. receives a pre-validated inference request,
2. injects provider credentials server-side,
3. forwards to a model provider,
4. returns a response,
5. emits minimal operational telemetry without learner content retention.

## Definition of done

The MVP is done when a parent can unlock the on-device parent area, create/manage a child profile locally, the child can complete tutoring sessions, local progress and safety history are reviewable on the same device, story mode and homework help work with local persistence, and all quality gates pass.
