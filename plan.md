# Remaining Spec Gap Plan

`spec.md` is the source of truth. This plan replaces the original migration plan and reflects the current repository state after the algebra-first MVP rebuild work that is already complete.

## Audit Summary

The codebase is now much closer to the spec than the original prototype:

- one bounded algebra module exists as shared subject-pack data
- learner state is structured, versioned, and migrated
- a mixed-input diagnostic exists and feeds tutoring placement
- the tutoring loop is explicit and evidence-driven
- deterministic math validation exists for numeric and symbolic checks
- the web app has the required MVP screens in broad form
- telemetry, safety, local persistence, and encrypted backup/import exist
- core contracts and schemas are documented
- automated coverage is strong and regression-oriented

The remaining work is no longer “foundational rewrite” work. The biggest remaining gaps are product-journey and spec-posture mismatches.

## Confirmed Gaps Against `spec.md`

### Gap 1: BYO provider flow is not truly implemented end to end

Spec references:
- FR-002
- FR-003
- FR-004
- Section 6.1
- Section 16
- Acceptance criterion 2

Current state:
- the app stores provider name/model/endpoint/key locally
- the browser relay path is wired and bounded
- the relay still uses `MOCK_PROVIDER_ADAPTER` for tutoring/chat
- provider settings do not actually drive a real external provider request
- the saved model and endpoint are not meaningfully used to execute tutoring

Impact:
- the product appears to support BYO providers, but the live tutoring path is still mock-backed
- the spec’s “configure supported AI provider with BYO key” acceptance criterion is not fully met

### Gap 2: MVP delivery posture still conflicts with the spec

Spec references:
- Section 6.1
- Section 9 first-use journey

Current state:
- the app can proceed through setup, diagnostic, and tutoring without a configured provider key
- local deterministic fallback remains a normal operating path, not just a bounded recovery path
- onboarding does not enforce the spec’s intended order of module selection -> provider setup -> diagnostic

Impact:
- the repo still behaves like “cloud optional, local fallback normal”
- the spec says online AI is required in MVP, with fallback as a safety/recovery behavior rather than the main path

### Gap 3: Return-user journey is not yet dashboard-first

Spec references:
- Section 9 return-user journey
- FR-015
- Acceptance criterion 9

Current state:
- local reopen/resume now works and is covered by tests
- startup can restore a safe scene or resume from learner state
- the default return flow still restores into the tutoring path rather than the concept-map dashboard

Impact:
- the spec’s intended return journey is “load local state -> dashboard concept graph -> recommended next -> resume”
- the code still centers direct scene recovery more than dashboard-first re-entry

### Gap 4: Concept map is not yet a real tech-tree style graph

Spec references:
- FR-015
- FR-016
- FR-018
- Section 15

Current state:
- concept statuses exist and are backed by learner state
- concept detail exists
- prerequisites and dependents are shown as text
- the map itself is still rendered as a list of concept cards, not a graph with visible prerequisite edges

Impact:
- the product meets the data side of the concept map requirement more than the visual/interaction side
- the primary progress surface still undershoots the “tech-tree style concept mastery map” expectation

### Gap 5: Math input is functional but still below spec-quality UX

Spec references:
- FR-020
- FR-024
- Section 19

Current state:
- dedicated math-input scenes exist
- deterministic validation exists
- learner feedback distinguishes syntax and conceptual issues
- input is still a plain text field rather than a more intentional math-expression entry surface

Impact:
- the minimum functional requirement is largely present
- the experience still feels closer to “validated text box” than “serious math input workspace”

### Gap 6: Provider/storage extensibility is documented better than it is exercised

Spec references:
- Section 7
- Section 12
- Section 20

Current state:
- contracts exist for provider/model/storage/validation/telemetry/UI registry
- subject-pack boundaries are explicit
- only the mock provider path is implemented in practice
- storage is local-first and adapter-shaped, but there is no second concrete storage/backend implementation proving swappability

Impact:
- architecture is in the right shape
- extensibility is proven on paper more than in real interchangeable implementations

### Gap 7: Final acceptance walkthrough is still distributed across code and tests rather than captured as one explicit release gate

Spec references:
- Section 22
- Section 21
- Section 11

Current state:
- tests are strong and broad
- many acceptance behaviors are individually covered
- there is no single maintained acceptance checklist in the repo that clearly says which acceptance criteria are fully met, partially met, or intentionally deferred

Impact:
- the project is easy to overestimate
- the remaining work can drift unless the last acceptance-stage gaps are tracked explicitly

## Delivery Strategy

Finish the remaining work in four passes:

1. make the provider path real
2. align first-use and return-user journeys to the spec
3. upgrade the progress surface and math-input UX
4. close the release/acceptance loop with explicit proof

## Workstream 1: Real BYO Provider Execution

Goal: make provider setup actually power tutoring and chat, not just save config.

### Tasks

1. Introduce a real provider adapter for the supported MVP provider path.
2. Route relay tutoring/chat through the selected adapter instead of always calling `MOCK_PROVIDER_ADAPTER`.
3. Pass provider name, endpoint, model, and local API key to the relay in a controlled way.
4. Keep request minimization and schema validation intact around the real provider path.
5. Preserve the mock adapter for tests and local development, but stop presenting it as the normal MVP cloud path.
6. Add contract tests for:
   - successful provider-backed tutoring
   - invalid provider config
   - upstream provider failure
   - moderation/safety behavior during provider-backed requests

### Exit Criteria

- configuring a supported provider with a BYO key actually changes the tutoring backend
- the relay no longer hardcodes the mock adapter for normal tutoring/chat execution
- acceptance criterion 2 is materially satisfied

## Workstream 2: Spec-Aligned Onboarding And Return Flows

Goal: make the first-use and return-user journeys match Section 9 of the spec.

### Tasks

1. Make the onboarding flow explicit and ordered:
   - choose module
   - configure provider
   - begin diagnostic
2. Decide and implement the exact MVP policy for cloud-required behavior:
   - if the spec remains authoritative as written, block tutoring start until provider + relay are ready
   - keep bounded local fallback for interruption, recovery, and testing only
3. Rework the setup screen copy and button states so “Open tutor” cannot skip required setup.
4. Change return-user startup so the primary re-entry surface is the concept map/dashboard with recommended next visible.
5. Preserve last-safe-scene recovery as a deliberate resume action from the dashboard instead of always auto-dropping into a scene.
6. Add regression tests for:
   - first-run setup gating
   - return-user dashboard-first flow
   - explicit resume action after reopen

### Exit Criteria

- the first-use flow matches the spec order
- return users land on the concept map/dashboard first
- local recovery remains available without becoming the main product posture

## Workstream 3: Concept Map And Progress Surface Upgrade

Goal: turn the current progress list into the spec’s primary tech-tree style mastery map.

### Tasks

1. Replace the simple list rendering with a graph-like layout that shows prerequisite edges.
2. Make node styling clearly communicate all required states:
   - locked
   - available
   - in progress
   - mastered
   - review due
   - recommended next
3. Show the current recommended path through the graph, not just isolated node labels.
4. Improve concept detail to act as a true inspect-and-launch surface with clear prerequisite/dependent navigation.
5. Ensure recent activity and learner goals stay visible from the progress surface.
6. Add UI tests or source-level guards for graph-state rendering and launch interactions.

### Exit Criteria

- the concept map reads as a tech-tree, not just a card list
- prerequisite relationships are visible, not only described in text
- the progress surface fully satisfies FR-015 through FR-019

## Workstream 4: Math Input UX Upgrade

Goal: keep the current deterministic validation engine, but give the learner a more intentional math-entry experience.

### Tasks

1. Replace the plain text math input with a more math-oriented entry surface.
2. Add lightweight expression affordances:
   - clearer placeholder/examples
   - syntax-aware inline guidance
   - better handling for equations vs expressions
3. Keep keyboard-first interaction and reduced-motion compatibility.
4. Make validation feedback more obviously tied to the learner’s entered expression.
5. Ensure the upgraded input stays compatible with the current bounded validator contract.

### Exit Criteria

- math entry feels like a dedicated tutoring input, not a generic text field
- syntax guidance and conceptual feedback are easier to interpret during practice

## Workstream 5: Extensibility Proof Rather Than Just Extensibility Shape

Goal: prove at least one more adapter boundary in practice so the architecture is not only theoretical.

### Tasks

1. Add one real non-mock provider adapter implementation behind the shared provider contract.
2. If feasible within MVP scope, add one secondary storage adapter path or a test-only adapter package that exercises the storage contract end to end.
3. Remove or isolate any remaining code paths that are effectively singleton implementations hiding behind “adapter” names.
4. Expand contract validation tests to cover real implementations, not just shape checks.

### Exit Criteria

- at least one major adapter boundary is proven by multiple implementations
- swappability is demonstrated, not just documented

## Workstream 6: Final Acceptance And Release Gate

Goal: convert the remaining spec mismatch into an explicit release checklist and close it.

### Tasks

1. Add a maintained acceptance checklist section to the repo documentation.
2. Map each acceptance criterion from Section 22 to:
   - code location
   - test coverage
   - current status: complete / partial / blocked
3. Add one end-to-end smoke test or scripted manual checklist for:
   - first use
   - return use
   - export/import recovery
   - provider-backed tutoring
4. Update `README.md` to distinguish:
   - fully implemented MVP behaviors
   - bounded development/test fallbacks
   - known remaining limitations

### Exit Criteria

- the repo has one explicit acceptance gate instead of scattered progress notes
- the remaining mismatch count against `spec.md` is small, explicit, and intentional

## Recommended Order

Implement the remaining work in this order:

1. Workstream 1: real provider execution
2. Workstream 2: onboarding and return-flow alignment
3. Workstream 3: concept map upgrade
4. Workstream 4: math input UX upgrade
5. Workstream 5: extensibility proof
6. Workstream 6: final acceptance gate

## Definition Of Done

This repo should only be called spec-aligned when all of the following are true:

1. A learner can configure a real supported provider with a BYO key and actually receive provider-backed tutoring.
2. The first-use flow enforces the intended setup order before tutoring starts.
3. A returning learner lands on the concept-map dashboard first and can deliberately resume.
4. The progress surface is a visible concept graph with real edges and status states.
5. Math input remains deterministic but feels like a dedicated algebra workspace.
6. The acceptance criteria in `spec.md` are tracked explicitly and pass as a coherent MVP journey.
