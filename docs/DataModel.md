# DataModel.md

## Core local entities

- ParentGateConfig
- ChildProfile
- LearnerState
- CurriculumNode
- Session
- SessionTurn
- AssessmentResult
- SafetyEvent
- StoryInstance
- HomeworkArtifact
- LocalAuditEvent
- ExportBundleManifest

## Persistence strategy

### Native (primary)

- Structured app data: local database
- Binary artifacts (homework photos, avatars, exports): local filesystem
- Secrets (parent gate hash/material, relay tokens if needed): secure local secret storage

### Web (secondary)

- Browser-local storage only (IndexedDB/localStorage as implemented)
- No durability guarantees beyond browser constraints

## Data handling rules

- Store learner and parent-area records on-device only by default.
- Keep transcripts, safety reviews, and permissions in local structured storage.
- Keep media blobs and export/import bundles in local file storage.
- Use Zod validation at all module boundaries.
- Optional relay calls are ephemeral and do not become server-side source of truth.
