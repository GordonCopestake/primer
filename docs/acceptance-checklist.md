# MVP Acceptance Checklist

This document tracks compliance with Section 22 of `spec.md`.

## Acceptance Criteria (Section 22)

| # | Criterion | Status | Evidence |
|---|-----------|-------|----------|
| 1 | Open app without account | ✅ Complete | No login required; localStorage-based |
| 2 | Configure AI provider with BYO key | ✅ Complete | ProviderSetupPage, providerClient.js |
| 3 | Select maths module | ✅ Complete | ModuleSelectionPage, algebra module |
| 4 | Complete short diagnostic | ✅ Complete | 5-item adaptive diagnostic |
| 5 | Receive adaptive tutoring | ✅ Complete | tutorOrchestrator.js, curriculumEngine.js |
| 6 | Enter maths answers with dedicated input | ✅ Complete | MathInput.tsx |
| 7 | Get validated feedback | ✅ Complete | mathValidation.js |
| 8 | View concept mastery map | ✅ Complete | ConceptMapPage.tsx |
| 9 | Resume from local state on reopen | ✅ Complete | localStorage persistence |
| 10 | Export and re-import state | ✅ Complete | ImportExportPage.tsx, encryption.js |

## Functional Requirements (Section 10)

### 10.1 Onboarding/Config

| FR | Requirement | Status |
|----|------------|-------|
| FR-001 | No account required | ✅ |
| FR-002 | Provider setup flow | ✅ |
| FR-003 | Enter/store BYO API key locally | ✅ |
| FR-004 | Provider config options | ✅ |
| FR-005 | Sane defaults | ✅ |

### 10.2 Diagnostic

| FR | Requirement | Status |
|----|------------|-------|
| FR-006 | Lightweight adaptive diagnostic | ✅ |
| FR-007 | Estimate readiness/gaps/misconceptions | ✅ |
| FR-008 | Multiple input types | ✅ |
| FR-009 | No required age input | ✅ |

### 10.3 Tutoring Loop

| FR | Requirement | Status |
|----|------------|-------|
| FR-010 | Lessons linked to concept graph | ✅ |
| FR-011 | Lesson linked to concepts | ✅ |
| FR-012 | Explain/ask/hint/feedback/review | ✅ |
| FR-013 | Scaffolded help over dumping | ✅ |
| FR-014 | Update state after interactions | ✅ |

### 10.4 Progress Dashboard

| FR | Requirement | Status |
|----|------------|-------|
| FR-015 | Concept mastery map | ✅ |
| FR-016 | Concepts=nodes, prereqs=edges | ✅ |
| FR-017 | All node states | ✅ |
| FR-018 | Inspect concept/prereqs | ✅ |
| FR-019 | Show activity/goals | ✅ |

### 10.5 Maths Input/Validation

| FR | Requirement | Status |
|----|------------|-------|
| FR-020 | Dedicated maths input | ✅ |
| FR-021 | Numeric + symbolic | ✅ |
| FR-022 | Symbolic equivalence | ✅ |
| FR-023 | Authored assessments | ✅ |
| FR-024 | Distinguish syntax vs conceptual | ✅ |

### 10.6 Persistence/Backup

| FR | Requirement | Status |
|----|------------|-------|
| FR-025 | Local storage default | ✅ |
| FR-026 | Persist all state | ✅ |
| FR-027 | Encrypted export/import | ✅ |
| FR-028 | Pluggable storage interface | ✅ |

### 10.7 Safety

| FR | Requirement | Status |
|----|------------|-------|
| FR-029 | Interrupt harmful content | ✅ |
| FR-030 | Redirect safer resources | ✅ |
| FR-031 | Avoid dependency cues | ✅ |
| FR-032 | Conservative defaults | ✅ |

### 10.8 Telemetry

| FR | Requirement | Status |
|----|------------|-------|
| FR-033 | Opt-in consent | ✅ |
| FR-034 | Include mismatch events | ✅ |
| FR-035 | Off by default | ✅ |
| FR-036 | User review before donation | ✅ |

## Architecture Compliance (Section 12)

| Layer | Implementation | Status |
|-------|-------------|--------|
| UI | React + TypeScript | ✅ |
| Tutor orchestration | tutorOrchestrator.js | ✅ |
| Learner-state engine | state.js, curriculumEngine.js | ✅ |
| Subject engine | algebraModule.js | ✅ |
| Validation engine | mathValidation.js | ✅ |
| Provider abstraction | providerClient.js | ✅ |
| Storage abstraction | storageAdapter.js | ✅ |
| Safety | privacy.js | ✅ |
| Telemetry | telemetry.js | ✅ |

## Data Model Completeness (Section 13)

All entities from spec implemented:

- UserProfile ✅
- Module ✅
- Concept ✅
- PrerequisiteEdge ✅
- Lesson ✅
- AssessmentItem ✅
- Attempt ✅
- MisconceptionTag ✅
- MasteryRecord ✅
- EvidenceRecord ✅
- ReviewScheduleEntry ✅
- Goal ✅
- Milestone ✅
- ProviderConfig ✅
- ExportManifest ✅
- TelemetryConsent ✅

## Pluggable Interfaces (Section 20)

| Interface | Status |
|-----------|--------|
| AI provider adapter | ✅ |
| model adapter | ✅ |
| storage adapter | ✅ |
| subject pack | ✅ |
| validation plugin | ✅ |
| telemetry sink | ✅ |
| UI component registry | ✅ |

## Known Deviations

1. **Math input widget**: Uses custom input rather than MathLive library - functional but simpler
2. **Graph visualization**: Linear list with connector indicators rather than canvas-based graph library
3. **Symbolic validation**: Checkpoint-based equivalence testing rather than full CAS

These are intentional MVP simplifications that maintain functional compliance.

## Last Verified

Date: 2026-04-15
Commit: 29db539