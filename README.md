# Open-Source Modular AI Tutor

This project is an open-source, web-first, local-first AI tutoring app prototype.

The current implementation focuses on runtime foundations:

- static web shell with installable PWA assets and offline shell caching
- local learner-state persistence with safe scene restore
- shared algebra module data and bounded diagnostic/tutoring progression helpers
- capability detection plus browser-native TTS/STT hooks where supported
- local settings/admin entry point with export/import backup
- safe fallback scene and strict scene validation/interpreter guards

## Current Progress vs New PM Spec

Primer presents bounded learning scenes inside a fixed local shell. The current refactor is moving the shared model from a literacy prototype to an algebra foundations MVP with a diagnostic, concept graph, and mastery records. The app stores learner state locally, restores the last safe scene after reload, and exposes local settings and backup controls.

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
