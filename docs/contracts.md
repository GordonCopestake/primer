# Primer Contracts

`spec.md` is the source of truth. This document makes the MVP extension points explicit in code-facing terms.

## Subject Pack

A subject pack owns the authored module content for one bounded learning domain.

Required methods:
- `getModule()`
- `listConcepts()`
- `listLessons()`
- `listAssessmentItems()`

The pack is authoritative for module metadata, concept graph, prerequisite edges, misconception tags, mastery rules, and validator-aware task constraints. Runtime AI help may rephrase explanations and hints, but it must not invent graph structure or mastery policy.

## Adapter Interfaces

The codebase formalizes these pluggable contracts in [`packages/core/src/contracts.js`](/home/gordon/source/primer/packages/core/src/contracts.js):

- `aiProviderAdapter`
- `modelAdapter`
- `storageAdapter`
- `validationPlugin`
- `telemetrySink`
- `uiComponentRegistry`

Each contract defines the minimum required methods so new adapters can be added without editing core orchestration logic.

## Learner-State Schema

The learner-state schema lives in [`packages/schemas/src/state.js`](/home/gordon/source/primer/packages/schemas/src/state.js).

Key top-level areas:
- `learnerProfile`
- `moduleSelection`
- `pedagogicalState`
- `runtimeSession`
- `consentAndSettings`
- `providerConfig`
- `capabilities`
- `assetIndex`
- `exportMetadata`

This schema is versioned by `schemaVersion` and migrated through the shared state helpers in [`packages/core/src/state.js`](/home/gordon/source/primer/packages/core/src/state.js).

## Validator Contract

A validation plugin must expose:
- `validateResponse()`
- `classifyError()`

The validator is responsible for deterministic correctness checks and for distinguishing syntax problems from likely conceptual issues when feasible.

## Telemetry Schema

Telemetry is opt-in only. The manifest and state surfaces store only whether richer telemetry was explicitly enabled. Telemetry sinks must treat events as optional, inspectable, and revocable.

## Export Manifest

Backups are wrapped in a manifest bundle with:
- `manifestType`
- `formatVersion`
- `schemaVersion`
- `moduleId`
- `exportedAt`
- `encryption`
- `assetManifestVersion`
- `telemetryConsent`
- `selectedProvider`

Encrypted exports now use `primer-aes-gcm-v1`. Legacy `primer-xor-v1` payloads remain importable for compatibility, but they are not the target format going forward.
