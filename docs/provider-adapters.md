# Provider And Adapter Interfaces

Primer's pluggable runtime boundaries are defined in [`packages/core/src/contracts.js`](/home/gordon/source/primer/packages/core/src/contracts.js).

## Adapter Contracts

Current named contracts:
- `aiProviderAdapter`
- `modelAdapter`
- `storageAdapter`
- `subjectPack`
- `validationPlugin`
- `telemetrySink`
- `uiComponentRegistry`

## aiProviderAdapter

Purpose: execute bounded tutoring and chat turns against a configured provider.

Required methods:
- `sendTutorTurn`
- `sendChatTurn`

This adapter sits behind the relay/runtime boundary so the product can swap providers without rewriting tutoring orchestration.

## modelAdapter

Purpose: describe selectable models and expose capability metadata.

Required methods:
- `getModelId`
- `getDisplayName`
- `supportsCapability`

## storageAdapter

Purpose: persist local-first learner state, recovery scenes, and backup bundles.

Required methods:
- `loadState`
- `saveState`
- `loadScene`
- `saveScene`
- `exportBackup`
- `importBackup`

The browser runtime adds provider-secret helpers around this local persistence path, but the core contract remains focused on bounded state and backup flows.

## subjectPack

Purpose: provide the authored module graph and all bounded teaching content.

Required methods:
- `getModule`
- `listConcepts`
- `listLessons`
- `listAssessmentItems`

The subject pack is authoritative for graph structure, lesson content, and validator-aware answer contracts.

## validationPlugin

Purpose: validate learner responses deterministically.

Required methods:
- `validateResponse`
- `classifyError`

The current implementation is the shared `MATH_VALIDATION_PLUGIN`.

## telemetrySink

Purpose: receive optional telemetry events without becoming a required runtime dependency.

Required methods:
- `recordEvent`
- `flush`

Telemetry remains opt-in and reviewable.

## uiComponentRegistry

Purpose: constrain rendering to fixed, documented product surfaces.

Required methods:
- `listComponents`
- `resolveComponent`

The fixed registry currently includes:
- landing setup
- provider config
- module selection
- tutoring workspace
- concept mastery map
- concept detail
- settings
- import/export
- telemetry preferences
