# Open-Source Modular AI Tutor

This project is an open-source, web-first, local-first AI tutoring app prototype. `spec.md` is the source of truth.

The current implementation focuses on the bounded algebra MVP foundation:

- shared algebra module data and concept graph
- local-first learner-state persistence with migration helpers
- bounded diagnostic and tutoring decisions
- dedicated math-input scenes and deterministic validation helpers
- relay/runtime contracts aligned to the algebra tutor flow
- local settings, backup controls, and safe fallback handling

## Current Progress vs New PM Spec

Primer now targets one bounded algebra foundations module. The shared core, relay contract, and browser runtime are aligned around a local-first learner state, a short diagnostic, a concept graph, and deterministic math-input scenes. The browser also presents a first-run module selection step before starting tutoring.

Primer follows the spec posture: cloud AI with local learner storage and no required login.

- progression and persistence stay on-device
- learner state is stored locally
- the shell can be installed as a PWA
- cloud director/chat/image/vision routes are available through the relay

## How To Run It

Install nothing for the current test-only setup. The repo uses Node's built-in test runner.

Run the test suite:

```bash
npm test
```

Serve the repo root so the browser can resolve shared package imports. For example:

```bash
npm run serve:web
```

Then open:

```text
http://localhost:4173/apps/web/
```

Notes:

- Serve the repository root, not `apps/web`, because the browser runtime imports shared modules from `packages/`.
- Use a browser for full runtime behavior. PWA installability, service worker caching, and speech APIs do not work from a raw file URL.
