# Documentation.md

## Current status

- Architecture has been pivoted to a strict local-only default model.
- Docs now define parent functionality as an on-device parent area protected by local parent gate (PIN, optional biometrics).
- Cloud persistence assumptions were removed from architecture, API, data model, and milestone planning.
- API is now documented as optional stateless inference relay only, not an always-on system of record.

## Decisions

- Native is the primary platform because it offers the strongest privacy, storage durability, and local control model.
- Web support remains available but is secondary and constrained to browser-local storage limitations.
- Core learner/parent data (profiles, learner state, transcripts, safety events, homework artifacts) persists locally by default.
- Cloud model usage is fallback-only and must go through a stateless relay that holds provider keys server-side.
- Relay is explicitly forbidden from storing accounts, learner records, files, transcripts, or long-lived learner-content logs.
- Export/import is optional and manual for local backup portability.

## Architecture drift correction

The repository previously drifted toward cloud-first assumptions (auth, households as server entities, always-on API, PostgreSQL/Redis/S3). This drift is now reversed in the spec docs to maintain one consistent local-first direction.

## Implementation impact and obsolete work

The following previously-planned areas are now obsolete and should not be treated as MVP requirements:

- Parent login and household cloud auth flows.
- Server-side household/account entities as canonical ownership model.
- Always-on API as core dependency for routine product operations.
- PostgreSQL/Redis/S3-backed persistence as default architecture.
- Parent web dashboard assumptions tied to cloud-backed server state.

## Runbook

- Install dependencies with pnpm once workspace package manager is available.
- Run root validation commands from the repository root.
- Learner app build command is `EXPO_OFFLINE=1 CI=1 expo export --platform web` to support CI/offline environments.
