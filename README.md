# Open-Source Modular AI Tutor

This project is an open-source, web-first, local-first AI tutoring app prototype.

The current implementation focuses on runtime foundations:

- static web shell with installable PWA assets and offline shell caching
- local learner-state persistence with safe scene restore
- deterministic baseline assessment and bounded progression helpers
- capability detection plus browser-native TTS/STT hooks where supported
- local settings/admin entry point with export/import backup
- safe fallback scene and strict scene validation/interpreter guards

## Current Progress vs New PM Spec

The PM handover spec (`spec.md`) pivots the product toward a bounded BYO-key maths tutor with a concept graph. The current codebase has partial alignment and known gaps.

### Implemented alignment

- no-login local usage with local persistence
- local export/import support
- bounded scene/runtime validation and moderation
- relay stubs for director/chat/image/vision
- basic adaptive flow scaffolding

### Not yet implemented (major gaps)

- dedicated provider onboarding flow with robust BYO-key UX
- bounded algebra concept graph (20-30 concepts) and tech-tree dashboard
- dedicated maths expression input + symbolic equivalence validation
- structured misconception taxonomy + review scheduler model
- opt-in telemetry preferences surface and pipeline

The next milestones should prioritize the dedicated maths input + symbolic validator, richer concept-detail interactions, and explicit telemetry consent flows.

## How To Run It

Install nothing for the current test-only setup. The repo uses Node's built-in test runner.

Run the test suite:

```bash
npm test
```

Serve the static web app from the `apps/web` directory with any local static file server. For example:

```bash
cd apps/web
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

Notes:

- Serve `apps/web` as the web root so the manifest, service worker, and module paths resolve correctly.
- Use a browser for full runtime behavior. PWA installability, service worker caching, and speech APIs do not work from a raw file URL.
