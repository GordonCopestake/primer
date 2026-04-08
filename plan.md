# Implementation Plan

## Current State Review

The repository is a working prototype, but it does not yet match `spec.md`.

What already exists and can be reused:
- local-first browser app shell with restore/autosave behavior
- local provider configuration UI and relay endpoints
- scene/schema validation and safe fallback handling
- import/export flow and basic persistence helpers
- basic concept-map style UI surface
- passing automated test suite for the current prototype

Main gaps against the spec:
- current curriculum is still a literacy/numeracy prototype, not one bounded algebra module
- no real module/subject-pack system yet
- no curated algebra concept graph with 20-30 concepts, prerequisites, or misconception taxonomy
- no proper diagnostic flow for algebra readiness
- no mastery engine for concept states like `locked`, `available`, `in progress`, `mastered`, `review due`, `recommended next`
- no serious tutoring workspace built around explain -> worked example -> learner attempt -> feedback -> next action
- maths support is only a very small string-based validator, not a reliable symbolic/numeric validation layer
- storage is local, but not yet modeled around the learner entities in the spec
- encrypted export is currently weak placeholder XOR logic and should not count as the required encrypted backup feature
- telemetry consent, import/export manifesting, and pluggable adapters are not implemented to spec depth
- browser runtime duplicates core logic from `packages/core`, which will make further implementation harder if left in place

Spec guardrails that must remain true while implementing:
- `spec.md` is the source of truth whenever current code or this plan disagrees
- MVP remains web-first, no-login, local-first, BYO API key only
- scope stays at one bounded maths module until the full core loop is coherent
- AI remains constrained by authored graph, schemas, validator rules, and fixed UI components
- non-functional requirements are not yet reflected in the architecture plan: accessibility, keyboard support, reduced motion, secure API key handling, maintainability, versioned schemas, and extensibility
- open-source architecture requirements are only partially present: AI provider/model/storage/validation/telemetry/UI registry interfaces are not formally defined

## Recommended Delivery Order

Build the MVP in vertical chunks, but first fix the foundation so later work does not land on the wrong model.

### Chunk 1: Re-baseline the domain and architecture
Goal: replace the current child-literacy assumptions with the algebra-first MVP shape from the spec.

Steps:
1. Define the MVP target module explicitly as `algebra foundations / linear equations`.
2. Remove literacy-specific terminology from state, curriculum, relay prompts, and tests.
3. Decide the canonical domain model location:
   - `packages/schemas` for shared shapes
   - `packages/core` for engine logic
   - `apps/web` for rendering only
4. Lock in MVP delivery constraints from the spec:
   - web-first
   - no mandatory login
   - BYO API key only
   - online AI required in MVP
   - local learner state by default
5. Define the top-level pluggable interfaces up front:
   - AI provider adapter
   - model adapter
   - storage adapter
   - subject pack
   - validation plugin
   - telemetry sink
   - fixed UI component registry metadata
6. Delete runtime duplication by making `apps/web/src/app/runtime.js` consume shared `packages/core` and `packages/schemas` logic instead of re-declaring it.
7. Update README and tests so they describe the new algebra MVP, not the old literacy prototype.

Exit criteria:
- one shared source of truth for state/curriculum/schema logic
- no literacy/preliteracy baseline flow left in active MVP code
- core extension points are named and located before feature work expands

### Chunk 2: Define the algebra subject pack
Goal: create the bounded content model the app will actually teach.

Steps:
1. Create a subject-pack structure for the MVP module.
2. Author the algebra concept graph with around 20-30 concepts.
3. Add explicit prerequisite edges.
4. Add concept metadata:
   - label
   - description
   - prerequisite list
   - dependents
   - mastery rule
   - misconception tags
5. Define first-class authored content entities for:
   - `Lesson`
   - `AssessmentItem`
   - `Attempt`
6. Add authored lesson/exercise templates that stay within validator capabilities.
7. Add deterministic starter content for explanations, worked examples, and assessment items.
8. Ensure the subject pack is the source of truth for graph, prerequisites, mastery rules, and misconceptions, with model-generated content limited to phrasing-level help.

Exit criteria:
- one bounded algebra module exists as data, not hardcoded UI fragments
- the app can derive progression from the concept graph

### Chunk 3: Redesign the learner state model
Goal: align persistence with the entities described in the spec.

Steps:
1. Replace the current stage/domain counters with concept-level mastery records.
2. Add state for:
   - selected module
   - module metadata
   - diagnostic completion
   - mastery per concept
   - lesson records
   - assessment items and attempts
   - evidence records
   - misconception tags
   - review schedule
   - recent activity
   - goals/milestones
   - provider settings
   - telemetry consent
   - export metadata
3. Add bounded recent interaction memory plus concept-linked evidence, matching the hybrid memory direction in the spec.
4. Add schema versioning and a real migration path from the current prototype state.
5. Keep local-first defaults and resume behavior.

Exit criteria:
- state shape matches MVP product concepts
- old state can be migrated or intentionally reset with a documented rule

### Chunk 4: Build the diagnostic flow
Goal: support first-use module entry per the spec.

Steps:
1. Add a first-run module selection step.
2. Build a lightweight algebra diagnostic with mixed input types:
   - numeric
   - expression
   - multiple choice
   - short explanation
3. Score diagnostic results into:
   - readiness
   - prerequisite gaps
   - likely misconceptions
   - recommended starting concept
4. Persist the diagnostic outcome into learner state.
5. Keep the diagnostic free of any age-based assumptions or age-input requirements.

Exit criteria:
- a first-time learner gets a starting concept from a real diagnostic

### Chunk 5: Implement the tutoring loop engine
Goal: move from scene switching to the real adaptive learning loop.

Steps:
1. Introduce a concept session model:
   - explain
   - worked example
   - learner attempt
   - feedback
   - hint/remediation
   - advance/review recommendation
2. Make lesson selection driven by the subject pack and learner state.
3. Update state only on meaningful evidence-producing actions.
4. Record why the learner advanced, stayed, or was redirected.
5. Keep model output bounded to phrasing/hints/feedback only; do not allow runtime graph invention.
6. Add explicit support for review scheduling and remediation loops, not just forward progression.

Exit criteria:
- concept progression is explainable and stateful
- next-step recommendations come from learner evidence, not simple rotation

### Chunk 6: Replace the maths validation layer
Goal: meet the spec requirement for deterministic maths validation.

Steps:
1. Introduce a proper maths parser/equivalence library.
2. Support numeric and symbolic equivalence checks.
3. Distinguish syntax errors from likely conceptual mistakes where possible.
4. Align all authored exercises to validator capabilities.
5. Add validator-focused tests for equivalent expressions, malformed input, and common algebra mistakes.
6. Keep maths input and validation contracts pluggable so future validation plugins can slot in cleanly.

Exit criteria:
- validation is no longer string-based
- authored algebra tasks are reliably checkable

### Chunk 7: Rebuild the web UI around the MVP journeys
Goal: match the specified screens and user flows.

Steps:
1. Replace the current single-scene shell with clear screens for:
   - landing/setup
   - provider configuration
   - module selection
   - tutoring workspace
   - concept mastery map
   - concept detail
   - settings
   - import/export
   - telemetry preferences
2. Keep the concept map as the primary progress surface.
3. Show concept node states from real mastery data.
4. Add recent activity and learner goals.
5. Add keyboard-friendly maths input in the tutoring workspace.
6. Keep the UI bounded to a fixed component registry; do not allow arbitrary model-authored UI.
7. Cover accessibility and interaction requirements:
   - keyboard access
   - reduced-motion support
   - readable fallback states

Exit criteria:
- all primary MVP screens exist
- UI state matches the learner engine and subject pack

### Chunk 8: Make provider and relay integration spec-compliant
Goal: preserve BYO-provider support while narrowing the contract to the tutoring MVP.

Steps:
1. Define a provider adapter interface for chat/tutoring responses.
2. Pass only the bounded tutoring context needed by the current concept/session.
3. Validate structured outputs before rendering.
4. Keep local deterministic fallback paths for key user actions.
5. Update the relay mock provider so it speaks the algebra tutoring contract instead of the old scene contract.
6. Keep the MVP provider contract consistent with BYO API key usage and no hosted credentials.

Exit criteria:
- provider integration is modular and bounded
- failure paths remain usable locally

### Chunk 9: Fix persistence, backup, and security posture
Goal: bring storage and recovery closer to spec quality.

Steps:
1. Move from placeholder encryption to real encrypted export/import.
2. Add export manifest/version metadata.
3. Define a pluggable backup adapter interface even if only local export ships in MVP.
4. Review API key local storage behavior and isolate sensitive settings from general learner state where practical.
5. Add migration/import validation tests.
6. Prefer IndexedDB-backed storage for durable structured learner data, with clear storage adapter boundaries.

Exit criteria:
- backup/import/export is credible for MVP
- security posture is improved from prototype level

### Chunk 10: Add telemetry consent and safety completion work
Goal: finish required product controls without blocking core tutoring.

Steps:
1. Add explicit opt-in telemetry preferences with default off.
2. Model what telemetry can be collected and what requires extra review.
3. Keep safety interruption and redirect flows, but retune them for the new general learner audience.
4. Ensure copy avoids companion framing and dependency cues.
5. Add support for validator mismatch loops, crashes, and user-reviewed richer trace donation as separate telemetry classes.

Exit criteria:
- telemetry is transparent, revocable, and off by default
- safety behavior matches the product posture

### Chunk 11: Replace and expand the test suite
Goal: make tests protect the real MVP.

Steps:
1. Remove tests that lock in the literacy prototype behavior.
2. Add tests for:
   - subject pack integrity
   - prerequisite graph logic
   - diagnostic scoring
   - tutoring loop transitions
   - maths validation
   - state migration
   - import/export
   - provider contract validation
3. Keep relay tests focused on bounded schemas and safety.
4. Add tests for extension-point contracts so adapters stay swappable.
5. Add basic accessibility checks for keyboard interaction and reduced-motion-safe behavior where feasible.

### Chunk 12: Non-functional and documentation completion
Goal: close the remaining spec requirements that are easy to miss during feature work.

Steps:
1. Verify keyboard access and reduced-motion support in the MVP UI.
2. Review local-first defaults, provider key handling, schema versioning, and import/export security posture.
3. Check performance-sensitive paths explicitly:
   - initial app load
   - concept map rendering
   - local persistence and restore
   - maths validation feedback loop
4. Review maintainability and extensibility by removing dead prototype code and confirming adapters and subject packs can be added without editing core orchestration logic.
5. Document:
   - subject-pack schema
   - learner-state schema
   - validator contract
   - provider/adapter interfaces
   - telemetry schema
6. Update README with the real MVP setup, constraints, and current implementation boundaries.
7. Run full regression tests and a final spec-to-code checklist.

Exit criteria:
- required schemas and interfaces are documented
- accessibility/privacy/performance/maintainability/extensibility requirements are explicitly checked

## Acceptance Mapping

The implementation is only complete when the codebase satisfies the MVP acceptance criteria in `spec.md`:

1. Open app without account.
2. Configure supported AI provider with BYO key.
3. Select the supported maths module.
4. Complete a short diagnostic.
5. Receive adaptive tutoring.
6. Enter maths answers with a dedicated input.
7. Get validated feedback.
8. View the concept mastery map.
9. Resume from local state on reopen.
10. Export and re-import state.

## Practical First Sprint

If implementation starts now, the best first slice is:

1. Do Chunk 1 first.
2. Start Chunk 2 and Chunk 3 immediately after.
3. Only then build Chunk 4 through Chunk 7.
4. Leave Chunk 10 until the tutoring loop and state model are stable.
5. Use Chunk 12 as the final acceptance gate before calling the MVP aligned with the spec.

## Immediate Next Actions

The next concrete coding steps should be:

1. Create shared algebra module data structures in `packages/schemas` and `packages/core`.
2. Replace the current curriculum/state naming with concept-based algebra naming.
3. Remove duplicated runtime logic from `apps/web/src/app/runtime.js`.
4. Rewrite the current tests to target the new algebra module foundation.
5. After the foundation is stable, build the diagnostic and concept-map workflow on top of it.
