# Subject-Pack Schema

Primer's bounded algebra content lives in the authored subject pack at [`packages/core/src/algebraModule.js`](/home/gordon/source/primer/packages/core/src/algebraModule.js).

## Module

The module record is the entry point for one bounded learning domain.

Current fields:
- `id`
- `title`
- `slug`
- `subject`
- `focus`
- `description`
- `conceptGraph`

For the current MVP, `id` is `algebra-foundations` and `conceptGraph` contains the full authored concept list.

## Concept

Each concept node is authored as bounded data, not inferred at runtime.

Current fields:
- `id`
- `label`
- `description`
- `prerequisites`
- `dependents`
- `masteryRule`
- `misconceptionTags`

`prerequisites` are authored directly. `dependents` are derived from those prerequisite edges so the graph can be traversed in both directions.

## Lesson

Lessons are first-class authored tutoring records created through `createLesson(...)`.

Current fields:
- `id`
- `conceptId`
- `lessonType`
- `title`
- `objective`
- `workedExample`
- `responseType`
- `prompt`
- `expectedResponse`
- `choiceOptions`
- `hint`
- `remediation`
- `successFeedback`

`responseType` is bounded to the interaction modes the runtime can validate safely, such as expression, multiple choice, or short-text/read-respond style tasks.

## Assessment Item

Assessment items are first-class authored records created through `createAssessmentItem(...)`.

Current fields:
- `id`
- `conceptId`
- `prompt`
- `inputType`
- `expectedResponse`
- `expectedKeywords`
- `choiceOptions`
- `misconceptionTag`
- `kind`
- `rubric`

These are used for diagnostic placement and concept-linked assessment coverage.

## Attempt Template

Attempt records are normalized through `createAttempt(...)`.

Current fields:
- `result`
- `evidence`
- `misconceptionTags`
- `feedback`

Runtime state adds timestamps, lesson identifiers, and support metadata around this bounded authored shape.

## Pack Helpers

The shared pack exports deterministic helpers for the engine and tests:
- `ALGEBRA_FOUNDATIONS_MODULE`
- `ALGEBRA_LESSONS`
- `ALGEBRA_DIAGNOSTIC_ITEMS`
- `ALGEBRA_ASSESSMENT_ITEMS`
- `getConceptById(...)`
- `getLessonsForConcept(...)`
- `getAssessmentItemsForConcept(...)`
- `getInitialConceptId()`
- `getDiagnosticPlacementConceptId()`

The subject pack is authoritative for graph structure, authored teaching content, misconception tags, and validator-aware answer contracts.
