# Primer

Primer is an adaptive learning web app

The current implementation focuses on the v1 runtime foundation:

- static web shell with installable PWA assets and offline shell caching
- local learner-state persistence with safe scene restore
- deterministic baseline assessment, reading, writing, and numeracy progression helpers
- capability detection plus browser-native TTS/STT hooks where supported
- local settings/admin entry point with export/import backup
- safe fallback scene and strict scene validation/interpreter guards

## What The App Does

Primer presents bounded learning scenes inside a fixed local shell. A learner starts in a deterministic baseline assessment, then progresses through simple reading, writing, and numeracy scenes. The app stores learner state locally, restores the last safe scene after reload, exposes local settings and backup controls, and keeps working without any required backend.

The web app is intentionally local-first:

- progression logic runs in the client
- learner state is stored locally
- the shell can be installed as a PWA
- cloud features are optional and currently scaffolded behind local controls

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
