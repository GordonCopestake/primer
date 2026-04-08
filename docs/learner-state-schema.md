# Learner-State Schema

Primer's learner-state schema is defined in [`packages/schemas/src/state.js`](/home/gordon/source/primer/packages/schemas/src/state.js) and normalized or migrated in [`packages/core/src/state.js`](/home/gordon/source/primer/packages/core/src/state.js).

Current schema version: `5`.

## Top-Level Shape

The persisted learner state includes:
- `schemaVersion`
- `learnerProfile`
- `moduleSelection`
- `pedagogicalState`
- `runtimeSession`
- `consentAndSettings`
- `providerConfig`
- `capabilities`
- `assetIndex`
- `exportMetadata`
- `telemetryState`

## Learner Profile

Current learner profile fields:
- `learnerId`
- `locale`
- `interests`
- `avatarSeed`
- `preferredModalities`

## Module Selection

Module selection stores both the chosen module and the authored metadata needed to recover it safely.

Current fields:
- `selectedModuleId`
- `availableModuleIds`
- `moduleMetadataById`
- `selectedAt`

`moduleMetadataById` stores records with:
- `moduleId`
- `title`
- `subject`
- `focus`
- `description`
- `versionTag`

## Pedagogical State

This is the core learner-progress area.

Current fields:
- `diagnosticStatus`
- `diagnosticStep`
- `readiness`
- `prerequisiteGaps`
- `likelyMisconceptions`
- `diagnosticSummary`
- `currentConceptId`
- `currentLessonId`
- `currentObjectiveId`
- `recommendedConceptId`
- `masteryByConcept`
- `misconceptionsByConcept`
- `evidenceLog`
- `reviewSchedule`
- `recentActivity`
- `tutoringDecisions`
- `lessonRecords`
- `assessmentItems`
- `assessmentAttempts`
- `attemptLog`
- `goals`
- `milestones`

Important nested records are normalized with helper constructors:
- mastery records
- assessment-attempt records
- evidence records

## Runtime Session

Runtime session keeps bounded local context for recovery and tutoring continuity.

Current fields:
- `activeSceneId`
- `lastScene`
- `recentTurns`
- `recentInteractionMemory`
- `runningSummary`
- `pendingAssetJobs`

`recentInteractionMemory` is bounded local interaction memory, not an unbounded transcript store.

## Consent And Settings

Current fields:
- `cloudEnabled`
- `cloudImageEnabled`
- `cloudVisionEnabled`
- `telemetryEnabled`
- `telemetryPreferences`
- `adminPinEnabled`
- `adminPinHash`
- `adminUnlocked`
- `captionsEnabled`
- `soundEnabled`
- `storagePersistenceGranted`

`telemetryPreferences` currently separates:
- `validatorMismatchEnabled`
- `crashReportsEnabled`
- `reviewedTraceDonationEnabled`

## Provider Config

Current fields:
- `providerName`
- `modelName`
- `endpointUrl`
- `apiKey`
- `hasStoredApiKey`
- `configuredAt`

The browser runtime sanitizes persisted state and export bundles so the provider secret is stored separately from the general learner-state blob.

## Telemetry State

Current fields:
- `eventLog`
- `pendingTraceDonation`
- `lastCrashAt`

Telemetry remains opt-in and revocable. `pendingTraceDonation` is a review draft, not an automatic upload.

## Migration Rule

Older saved states are migrated forward when possible. Legacy prototype shapes and older schema versions are normalized into the current algebra-first learner model during load.
