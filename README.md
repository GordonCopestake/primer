# Open-Source Modular AI Tutor

This project is an open-source, web-first, local-first AI tutoring app prototype. `spec.md` is the source of truth.

The current implementation focuses on the bounded algebra MVP foundation:

- shared algebra module data and concept graph
- local-first learner-state persistence with migration helpers
- bounded diagnostic and tutoring decisions
- dedicated math-input scenes and deterministic validation helpers
- relay/runtime contracts aligned to the algebra tutor flow
- local settings, manifested backup controls, and safe fallback handling

## Current Progress vs New PM Spec

Primer now targets one bounded algebra foundations module. The shared core, relay contract, and browser runtime are aligned around a local-first learner state, a short diagnostic, a concept graph, and deterministic math-input scenes. The browser also presents a first-run module selection step before starting tutoring.

Primer follows the Chunk 1 spec posture: web-first delivery, no required login, BYO API key only, online AI routed through the relay for the full MVP tutoring path, and local learner storage by default.

- progression and persistence stay on-device
- learner state is stored locally
- the shell can be installed as a PWA
- hosted credentials are not part of the MVP; provider/API key details are user-supplied
- cloud director/chat/image/vision routes are available through the relay
- relay-backed cloud tutoring is the primary MVP path; local deterministic mode remains a bounded fallback for recovery and testing
- encrypted exports use AES-GCM with passphrase-derived keys; older XOR exports remain importable for compatibility only

## Architecture Contracts

The pluggable MVP contracts are now formalized in code and documented here:

- [`packages/core/src/contracts.js`](/home/gordon/source/primer/packages/core/src/contracts.js)
- [`docs/contracts.md`](/home/gordon/source/primer/docs/contracts.md)

These cover the subject-pack, provider/model/storage adapter, validation plugin, telemetry sink, export manifest, and fixed UI registry boundaries called for by the spec.

## Learner State Rules

Learner state is now versioned at schema v4 and keeps:

- selected module plus persisted module metadata
- diagnostic records, assessment attempts, and tutoring attempts
- concept-linked evidence and bounded recent interaction memory
- review schedule, goals, milestones, provider settings, telemetry consent, and export metadata

Persistence/security notes:

- browser persistence now prefers IndexedDB with localStorage as a fallback
- provider API keys are stored locally but kept separate from the general learner-state blob
- export bundles keep provider metadata, but do not include the saved API key

Migration rule:

- older saved states are migrated forward when possible
- legacy prototype state is normalized into the algebra MVP learner model

Reset rule:

- a learner reset clears progress and active tutoring state
- local admin settings, device capability info, and provider configuration are preserved

## How To Run It

Primer currently runs as a static web app plus an optional local relay.

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

### Web App Only

Start the static web server:

```bash
npm run serve:web
```

Then open:

```text
http://127.0.0.1:4173/apps/web/
```

This is enough to use the local deterministic flow and the mock relay mode.

### Web App Plus Local Relay

In one terminal, start the relay:

```bash
npm run relay
```

In another terminal, start the static web server:

```bash
npm run serve:web
```

Then open:

```text
http://127.0.0.1:4173/apps/web/
```

By default, the web app now targets a local relay at `http://<current-host>:8787`, so if you are serving the web app from `127.0.0.1` or `localhost` and run `npm run relay`, the browser should discover it automatically.

If you want a different relay URL, set `window.PRIMER_CONFIG.relayBaseUrl` before the app module loads.

### About Vite

There is not a committed Vite dev setup in this repository yet. The supported local workflow right now is the static server above via `npm run serve:web`.

Notes:

- Serving `apps/web` directly now works because the web root exposes the shared `packages/` and `relay/` paths the browser runtime imports.
- Use a browser for full runtime behavior. PWA installability, service worker caching, and speech APIs do not work from a raw file URL.
