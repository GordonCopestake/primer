# Documentation.md

## Current status

- Milestone 8 (homework help with local artifact capture and guided solve) is now underway with local homework artifact persistence, guided step extraction, and homework safety fallback checks.
- Milestone 9 (local safety history, transcript review, and parent controls) is now underway with schema-validated local transcript and safety-history stores, parent review helpers, and reviewed-status updates in the on-device parent area.
- Milestone 7 (story mode with local persistence and safety checks) is in place with local story instance storage, per-child checkpoint persistence, and story safety fallback checks wired into story creation flow.
- Milestone 6 (tutoring orchestration with a local-first inference pipeline) is in place via routing-mode decisions (`local_only`, `local_preferred_cloud_fallback`, `cloud_preferred_local_fallback`, `cloud_required`), structured orchestration metadata, and safety-first fallback responses in `@primer/tutor-orchestrator` and API session turns.
- Milestone 5 (local learner profiles, curriculum persistence, and learner state) is in place with local profile and learner-state stores wired into `@primer/local-storage` and consumed by `apps/learner-app/src/store`.
- Milestone 4 (local storage foundation) is now in place through a shared `@primer/local-storage` package that provides schema-validated structured storage, local file-record persistence helpers, and local secret-store adapters for web fallback.
- Milestone 2 (local parent gate foundation) has started with a web-first implementation in `apps/parent-web`, including local PIN setup/unlock state management.
- Milestone 3 (learner app shell + on-device parent area shell) has progressed on web with a gated parent-area shell across dashboard sections.
- Architecture has been pivoted to a strict local-only default model.
- Docs now define parent functionality as an on-device parent area protected by local parent gate (PIN, optional biometrics).
- Cloud persistence assumptions were removed from architecture, API, data model, and milestone planning.
- API is now documented as optional stateless inference relay only, not an always-on system of record.

## Decisions

- Native is the primary platform because it offers the strongest privacy, storage durability, and local control model.
- Web support remains available but is secondary and constrained to browser-local storage limitations.
- Core learner/parent data (profiles, learner state, transcripts, safety events, homework artifacts) persists locally by default.
- Structured storage reads/writes are now normalized behind shared helpers to reduce drift across learner and parent surfaces.
- Tutoring turn orchestration now returns explicit routing metadata and fallback reasons so parent-review surfaces can explain why a response was local, cloud-required, or safely downgraded.
- Story creation now runs local safety review and persists story checkpoint state locally so story progress remains on-device and reviewable.
- Homework parse now applies local safety review, emits safety fallback events when needed, and stores guided solve structures suitable for on-device parent review.
- Local learner profile records and per-subject learner state now persist in schema-validated structured storage rather than placeholder learner-app constants.
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
