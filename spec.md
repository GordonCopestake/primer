# Product Specification

## Project: Open-Source Modular AI Tutor
## Version: PM Handover Draft v1

## 1. Executive summary

Build an open-source, web-first, local-first AI tutoring application for self-directed learning in hard, fact-based subjects.

The product will:
- run primarily as a web app
- require no login for core use
- store learner state locally by default
- use user-selected AI providers via bring-your-own API key in MVP
- provide adaptive tutoring within a bounded, curated concept graph
- show progress through a tech-tree style concept mastery map
- support modular AI backends, modular storage backends, and future subject packs

The MVP proves the core loop on one bounded maths module with deterministic validation and structured learner-state tracking.

## 2. Product vision

Create a lifelong learning tool that tracks mastery of concepts, prerequisites, misconceptions, and progress locally, without forcing age bands/grades.

The system should feel like a serious tutor, configurable personal learning environment, concept-driven map, and modular OSS platform.

## 3. Product goals

### 3.1 Primary goal
Deliver an MVP where learner can:
- choose a supported subject module
- complete a short diagnostic
- receive adaptive tutoring and practice
- see progress on a concept graph
- return later and continue from local state

### 3.2 Secondary goals
- prove local-first architecture
- prove provider modularity
- prove concept-graph pedagogy
- prove deterministic maths validation reliability
- provide base for local-model and backup-provider support

## 4. Non-goals for MVP

Out of scope:
- universal all-subject tutor
- full mathematics curriculum
- free project-hosted inference
- dashboards for institutions/teachers/parents
- arbitrary model-generated UI
- advanced multimodal orchestration
- required cloud sync

## 5. Target users

Primary user: self-motivated independent learner.

Likely profiles include adult beginners, secondary/college learners, university revision learners, and technical workers filling gaps.

Do not assume age/stage implies level.

## 6. MVP scope

### 6.1 Delivery model
- web app first
- online AI required in MVP
- no mandatory login
- BYO API key only in MVP

### 6.2 Subject scope
One bounded mathematics module (recommended: algebra foundations / linear equations), with ~20-30 concepts, explicit prerequisites, misconception taxonomy, validator-aware exercises.

### 6.3 Success condition
Fully support one coherent journey rather than partial support for many.

## 7. Product principles

- local-first learner state
- no forced identity
- user-configurable provider/storage
- constrained intelligence (app controls graph/UI/schema/validation/safety)
- pedagogically serious and scaffolded
- open-source friendly extensibility

## 8. Pedagogical model

Structured adaptive loop:
1. identify concept
2. check prerequisites
3. explain
4. show worked example
5. ask learner attempt
6. analyze response
7. targeted feedback
8. decide advance/review/remediate
9. update learner state

## 9. Core user journeys

- first use: open app -> choose module -> configure provider/API key -> diagnostic -> starting concept -> lesson flow -> local autosave
- return user: load local state -> dashboard concept graph -> recommended next -> resume
- recovery: import export package -> validate -> restore local state

## 10. Functional requirements

### 10.1 Onboarding/config
- FR-001 no account required
- FR-002 provider setup flow
- FR-003 enter/store BYO API key locally
- FR-004 provider config options (provider/model/endpoint/key)
- FR-005 sane defaults excluding hosted credentials

### 10.2 Diagnostic
- FR-006 lightweight adaptive diagnostic on first module entry
- FR-007 estimate readiness/prereq gaps/misconceptions/start point
- FR-008 inputs: numeric, expression, multiple-choice, short explanation
- FR-009 no required age input

### 10.3 Tutoring loop
- FR-010 lessons linked to curated concept graph
- FR-011 lesson linked to concept(s)
- FR-012 explain/ask/hint/feedback/review/recommend next
- FR-013 scaffolded help over answer-dumping
- FR-014 update learner state after meaningful interactions

### 10.4 Progress dashboard
- FR-015 concept mastery map is primary progress surface
- FR-016 concepts=nodes, prerequisites=edges
- FR-017 node states: locked, available, in progress, mastered, review due, recommended next
- FR-018 inspect concept/prereqs/dependents/status/launch action
- FR-019 show recent activity and goals

### 10.5 Maths input/validation
- FR-020 dedicated maths expression input
- FR-021 numeric + symbolic validation
- FR-022 symbolic equivalence library (not string compare)
- FR-023 authored assessments aligned with validator capabilities
- FR-024 distinguish syntax issues vs conceptual mistakes where possible

### 10.6 Persistence/backup
- FR-025 local storage default
- FR-026 persist mastery/summaries/misconceptions/goals/settings/provider metadata/export metadata
- FR-027 encrypted export/import
- FR-028 pluggable backup adapter interface

### 10.7 Safety
- FR-029 interrupt tutoring on harmful/disallowed content
- FR-030 redirect to safer resources when appropriate
- FR-031 avoid companion framing/dependency cues
- FR-032 conservative unknown-age defaults

### 10.8 Telemetry
- FR-033 optional explicit consent telemetry
- FR-034 include validator mismatch loops/crashes/optional donated traces
- FR-035 telemetry off by default or explicit opt-in
- FR-036 user review before richer data donation

## 11. Non-functional requirements

Privacy/security/performance/accessibility/maintainability/extensibility requirements apply, including secure API key storage, local-first defaults, keyboard access, reduced-motion support, versioned schemas, and pluggable adapters.

## 12. System architecture

Client-heavy web app with modular layers:
1. UI
2. Tutor orchestration
3. Learner-state engine
4. Subject engine
5. Validation engine
6. Model/provider abstraction
7. Storage abstraction
8. Safety
9. Telemetry

## 13. Data model

Core entities include UserProfile, Module, Concept, PrerequisiteEdge, Lesson, AssessmentItem, Attempt, MisconceptionTag, MasteryRecord, EvidenceRecord, ReviewScheduleEntry, Goal, Milestone, ProviderConfig, ExportManifest, TelemetryConsent.

Use hybrid memory: structured long-term state + bounded recent interaction window + concept-linked evidence.

## 14. Subject content model

MVP subject pack defines module metadata, concept graph, prerequisite edges, mastery rules, misconception taxonomy, task templates, explanation guidance, validation constraints.

Model may generate phrasing/examples/hints/feedback, but must not invent graph/prereqs/mastery rules at runtime.

## 15. UI and interaction

Primary MVP screens:
1. Landing/setup
2. Provider configuration
3. Module selection
4. Tutoring workspace
5. Concept mastery map
6. Concept detail
7. Settings
8. Import/export
9. Telemetry preferences

Fixed component registry only; no arbitrary model-authored UI.

## 16. AI integration requirements

- BYO API key only in MVP
- minimal prompt packaging with relevant tutoring context
- structured outputs preferred
- outputs validated against schema/component registry/safety/validator results

## 17. Safety and moderation policy

Block/redirect harmful content, stop normal tutoring when needed, avoid pseudo-therapeutic engagement.

## 18. Telemetry and quality improvement

Opt-in only, transparent, revocable, and inspectable for richer submissions.

## 19. Technical implementation guidance

Recommended stack:
- React + TypeScript
- local state + IndexedDB
- graph visualization library
- math input widget (MathLive or equivalent)

Validation: numeric + symbolic equivalence + parser-aware errors.

Backend optional in MVP; avoid unnecessary complexity.

## 20. Open-source architecture requirements

Pluggable interfaces:
- AI provider adapter
- model adapter
- storage adapter
- subject pack
- validation plugin
- telemetry sink
- UI component registry metadata

Document subject pack schema, adapter interfaces, learner-state schema, validator contract, telemetry schema.

## 21. Risks and mitigations

Scope/cost/reliability/UX/privacy/complexity risks mitigated via bounded module, BYO keys, deterministic validation, dedicated math input, opt-in telemetry, fixed component library.

## 22. Acceptance criteria for MVP

Learner can:
1. open app without account
2. configure supported AI provider with BYO key
3. select supported maths module
4. complete short diagnostic
5. receive adaptive tutoring
6. enter maths answers with dedicated input
7. get validated feedback
8. view concept mastery map
9. resume from local state on reopen
10. export and re-import state

Team verifies coherent graph/state/validation/tutor behavior/dashboard + optional transparent telemetry.

## 23. Delivery plan

### Phase 1: Core Loop MVP
- web app
- no login
- BYO API key
- one bounded algebra module
- local persistence
- concept map
- structured tutoring loop
- maths input
- basic symbolic validation
- export/import
- opt-in telemetry

### Phase 2: Strengthening
- broader foundational maths
- richer tasks
- stronger validators
- remediation analytics
- optional backup adapters

### Phase 3: Platform Expansion
- additional STEM packs
- local/self-hosted adapters
- richer multimodal input
- advanced frontier-topic mode
- richer backup/sync options

## 24. Final product definition

An open-source, web-first, no-login, local-first AI tutoring platform for self-directed STEM learning, starting with one bounded maths module, BYO AI credentials, deterministic validation, structured learner-state tracking, and a concept mastery map as core progress model.
