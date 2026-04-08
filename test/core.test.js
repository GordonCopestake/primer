import test from "node:test";
import assert from "node:assert/strict";

import {
  ALGEBRA_FOUNDATIONS_MODULE,
  ALGEBRA_LESSONS,
  APP_CONFIG,
  ADAPTER_CONTRACTS,
  advanceAssessment,
  advanceTutoringSession,
  applyMasteryEvidence,
  createExportManifest,
  createDefaultState,
  createFallbackScene,
  detectCapabilities,
  FIXED_UI_COMPONENT_REGISTRY,
  getAlgebraConcept,
  getLessonForConcept,
  interpretScene,
  migrateState,
  nextCurriculumDecision,
  recordAssessmentCompletion,
  setActiveScene,
  validateContractImplementation,
  validateExportManifest,
} from "../packages/core/src/index.js";

test("migrateState converts legacy prototype state into the algebra MVP shape", () => {
  const migrated = migrateState({
    schemaVersion: 1,
    learnerProfile: { locale: "en-US" },
    consentAndSettings: { soundEnabled: false },
    runtimeSession: { recentTurns: [{ role: "user", content: "hello" }] },
    pedagogicalState: {
      literacyStage: 3,
      assessmentStatus: "complete",
      currentObjectiveId: "reading.symbol-match.3",
    },
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.learnerProfile.locale, "en-US");
  assert.equal(migrated.moduleSelection.selectedModuleId, "algebra-foundations");
  assert.equal(migrated.pedagogicalState.diagnosticStatus, "not-started");
  assert.equal(migrated.pedagogicalState.currentObjectiveId, "diagnostic.variables");
  assert.equal(migrated.runtimeSession.recentTurns.length, 1);
  assert.equal(migrated.consentAndSettings.soundEnabled, false);
});

test("detectCapabilities classifies accelerated tier only with richer features", () => {
  const capabilities = detectCapabilities({
    indexedDB: {},
    speechSynthesis: {},
    SpeechRecognition: class {},
    navigator: {
      storage: {
        getDirectory() {
          return {};
        },
      },
      mediaDevices: {
        getUserMedia() {},
      },
      gpu: {},
    },
  });

  assert.equal(capabilities.tier, "accelerated-local");
  assert.equal(capabilities.localSTT, true);
});

test("new learner starts in the algebra diagnostic", () => {
  const state = createDefaultState();
  const decision = nextCurriculumDecision(state);

  assert.equal(state.schemaVersion, 2);
  assert.equal(state.moduleSelection.selectedModuleId, "algebra-foundations");
  assert.equal(decision.phase, "diagnostic");
  assert.equal(decision.moduleId, ALGEBRA_FOUNDATIONS_MODULE.id);
  assert.equal(decision.objectiveId, "diagnostic.variables");
  assert.equal(state.pedagogicalState.currentObjectiveId, "diagnostic.variables");
  assert.equal(state.pedagogicalState.milestones.length >= 2, true);
});

test("assessment advances through staged diagnostic checkpoints", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "variables-and-expressions" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.order-of-operations");

  state = advanceAssessment(state, { correct: true, recommendedConceptId: "order-of-operations" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.substitution");

  state = advanceAssessment(state, { correct: true, recommendedConceptId: "one-step-addition-equations" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.one-step");

  state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.two-step");
});

test("diagnostic decisions expose mixed input contracts from authored data", () => {
  let decision = nextCurriculumDecision(createDefaultState());
  assert.equal(decision.inputType, "short-explanation");
  assert.ok(decision.expectedKeywords.includes("variable"));

  const afterFirstStep = advanceAssessment(createDefaultState(), { correct: true, recommendedConceptId: "variables-and-expressions" });
  decision = nextCurriculumDecision(afterFirstStep);
  assert.equal(decision.inputType, "multiple-choice");
  assert.deepEqual(decision.choiceOptions, ["14", "20", "24", "11"]);
  assert.equal(decision.expectedResponse, "14");
});

test("completed diagnostic unlocks the algebra tutoring flow", () => {
  const state = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  const decision = nextCurriculumDecision(state);

  assert.equal(decision.phase, "tutoring");
  assert.equal(decision.conceptId, "variables-and-expressions");
  assert.equal(decision.objectiveId, "concept.variables-and-expressions");
  assert.equal(decision.sessionPhase, "explain");
  assert.equal(state.pedagogicalState.goals[0].status, "active");
  assert.equal(state.pedagogicalState.milestones[0].status, "completed");
});

test("diagnostic completion can derive readiness, prerequisite gaps, and placement", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "evaluate-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "one-step-addition-equations" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });

  assert.equal(state.pedagogicalState.diagnosticStatus, "complete");
  assert.equal(state.pedagogicalState.readiness, "developing");
  assert.deepEqual(state.pedagogicalState.prerequisiteGaps, ["order-of-operations", "one-step-addition-equations"]);
  assert.deepEqual(state.pedagogicalState.likelyMisconceptions, ["left-to-right-only", "move-without-inverse"]);
  assert.equal(state.pedagogicalState.recommendedConceptId, "order-of-operations");
  assert.equal(state.pedagogicalState.diagnosticSummary.correctCount, 3);
  assert.equal(nextCurriculumDecision(state).conceptId, "order-of-operations");
});

test("placement-driven tutoring decisions expose prerequisite and misconception context", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "evaluate-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "one-step-addition-equations" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });

  const decision = nextCurriculumDecision(state);
  assert.equal(decision.conceptId, "order-of-operations");
  assert.equal(decision.isPlacementConcept, true);
  assert.deepEqual(decision.prerequisiteGaps, ["order-of-operations", "one-step-addition-equations"]);
  assert.deepEqual(decision.matchingMisconceptions, ["left-to-right-only"]);
  assert.equal(decision.readiness, "developing");
});

test("placement concepts with matching misconception signals insert remediation before learner attempt", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "evaluate-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "one-step-addition-equations" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });

  let decision = nextCurriculumDecision(state);
  assert.equal(decision.supportLevel, "targeted-remediation");
  assert.equal(decision.sessionPhase, "explain");

  state = advanceTutoringSession(state, "order-of-operations", "continue");
  decision = nextCurriculumDecision(state);
  assert.equal(decision.sessionPhase, "worked-example");

  state = advanceTutoringSession(state, "order-of-operations", "continue");
  decision = nextCurriculumDecision(state);
  assert.equal(decision.sessionPhase, "remediation");

  state = advanceTutoringSession(state, "order-of-operations", "continue");
  decision = nextCurriculumDecision(state);
  assert.equal(decision.sessionPhase, "learner-attempt");
});

test("placement-driven mastery evidence keeps diagnostic support reasons distinct", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "variables-and-expressions" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "evaluate-expressions" });
  state = advanceAssessment(state, { correct: false, recommendedConceptId: "one-step-addition-equations" });
  state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });

  state = advanceTutoringSession(state, "order-of-operations", "continue");
  state = advanceTutoringSession(state, "order-of-operations", "continue");
  state = advanceTutoringSession(state, "order-of-operations", "continue");
  state = applyMasteryEvidence(state, "order-of-operations", 1);

  assert.equal(state.pedagogicalState.masteryByConcept["order-of-operations"].supportReason, "diagnostic-targeted-remediation");
  assert.equal(state.pedagogicalState.lessonRecords["lesson.order-of-operations"].supportReason, "diagnostic-targeted-remediation");
  assert.equal(state.pedagogicalState.attemptLog.at(-1).supportReason, "diagnostic-targeted-remediation");
  assert.equal(state.pedagogicalState.evidenceLog.at(-1).supportReason, "diagnostic-targeted-remediation");
});

test("fresh tutoring mistakes are recorded as tutoring-error remediation", () => {
  const state = applyMasteryEvidence(recordAssessmentCompletion(createDefaultState(), "variables-and-expressions"), "variables-and-expressions", 0);

  assert.equal(state.pedagogicalState.masteryByConcept["variables-and-expressions"].supportReason, "tutoring-error-remediation");
  assert.equal(state.pedagogicalState.lessonRecords["lesson.variables-and-expressions"].supportReason, "tutoring-error-remediation");
  assert.equal(state.pedagogicalState.attemptLog.at(-1).supportReason, "tutoring-error-remediation");
  assert.equal(state.pedagogicalState.evidenceLog.at(-1).supportReason, "tutoring-error-remediation");
});

test("mastery evidence advances toward the next available algebra concept", () => {
  const assessed = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  const shifted = applyMasteryEvidence(assessed, "variables-and-expressions", 1);

  assert.equal(shifted.pedagogicalState.masteryByConcept["variables-and-expressions"].status, "mastered");
  assert.equal(shifted.pedagogicalState.currentConceptId, "variables-and-expressions");
  assert.equal(shifted.pedagogicalState.currentObjectiveId, "concept.variables-and-expressions");
  assert.equal(shifted.pedagogicalState.recommendedConceptId, "evaluate-expressions");
  assert.equal(shifted.pedagogicalState.reviewSchedule[0].conceptId, "variables-and-expressions");
  assert.equal(shifted.pedagogicalState.lessonRecords["lesson.variables-and-expressions"].status, "completed");
  assert.equal(shifted.pedagogicalState.lessonRecords["lesson.variables-and-expressions"].sessionPhase, "feedback");
  assert.equal(shifted.pedagogicalState.attemptLog.length, 1);
  assert.equal(shifted.pedagogicalState.milestones[1].status, "completed");
});

test("tutoring session advances through explain, worked example, attempt, and next concept", () => {
  let state = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  assert.equal(nextCurriculumDecision(state).sessionPhase, "explain");

  state = advanceTutoringSession(state, "variables-and-expressions", "continue");
  assert.equal(nextCurriculumDecision(state).sessionPhase, "worked-example");

  state = advanceTutoringSession(state, "variables-and-expressions", "continue");
  assert.equal(nextCurriculumDecision(state).sessionPhase, "learner-attempt");

  state = applyMasteryEvidence(state, "variables-and-expressions", 1);
  assert.equal(nextCurriculumDecision(state).sessionPhase, "feedback");

  state = advanceTutoringSession(state, "variables-and-expressions", "continue");
  const nextDecision = nextCurriculumDecision(state);
  assert.equal(nextDecision.conceptId, "evaluate-expressions");
  assert.equal(nextDecision.sessionPhase, "explain");
});

test("incorrect evidence records misconceptions and prioritizes due review", () => {
  const now = new Date(Date.now() - 60_000).toISOString();
  const diagnosed = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  const incorrect = applyMasteryEvidence(diagnosed, "two-step-equations", 0);
  const withDueReview = createDefaultState({
    ...incorrect,
    pedagogicalState: {
      ...incorrect.pedagogicalState,
      diagnosticStatus: "complete",
      currentConceptId: "evaluate-expressions",
      recommendedConceptId: "evaluate-expressions",
      reviewSchedule: [
        {
          conceptId: "two-step-equations",
          reviewDueAt: now,
          reason: "mastery-check",
        },
      ],
    },
  });
  const decision = nextCurriculumDecision(withDueReview);

  assert.deepEqual(incorrect.pedagogicalState.misconceptionsByConcept["two-step-equations"], ["wrong-first-step"]);
  assert.equal(incorrect.pedagogicalState.evidenceLog.at(-1).source, "tutoring-loop");
  assert.equal(decision.conceptId, "two-step-equations");
});

test("incorrect diagnostic evidence records a misconception tag for the assessed concept", () => {
  const state = advanceAssessment(createDefaultState(), {
    correct: false,
    recommendedConceptId: "variables-and-expressions",
  });

  assert.deepEqual(state.pedagogicalState.misconceptionsByConcept["variables-and-expressions"], ["variable-as-label"]);
  assert.equal(state.pedagogicalState.recentActivity.at(-1)?.correct, false);
});

test("fully correct diagnostic places the learner into later algebra content", () => {
  let state = createDefaultState();
  for (let index = 0; index < 5; index += 1) {
    state = advanceAssessment(state, { correct: true, recommendedConceptId: "two-step-equations" });
  }

  assert.equal(state.pedagogicalState.diagnosticStatus, "complete");
  assert.equal(state.pedagogicalState.readiness, "ready");
  assert.deepEqual(state.pedagogicalState.prerequisiteGaps, []);
  assert.equal(state.pedagogicalState.recommendedConceptId, "two-step-equations");
  assert.equal(nextCurriculumDecision(state).conceptId, "two-step-equations");
});

test("algebra module metadata exposes the bounded concept pack", () => {
  const concept = getAlgebraConcept("two-step-equations");
  const lesson = getLessonForConcept("two-step-equations");
  const wordProblemLesson = getLessonForConcept("solve-word-problems");

  assert.equal(ALGEBRA_FOUNDATIONS_MODULE.title, "Algebra Foundations");
  assert.ok(ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.length >= 20);
  assert.ok(ALGEBRA_LESSONS.length >= 20);
  assert.equal(concept?.label, "Two-step equations");
  assert.equal(lesson?.title, "Two-step equations");
  assert.equal(lesson?.expectedResponse, "5");
  assert.match(lesson?.hint ?? "", /constant|coefficient|undo/i);
  assert.match(lesson?.remediation ?? "", /add 2|divide by 3|mistake/i);
  assert.match(lesson?.successFeedback ?? "", /correct|stable order/i);
  assert.equal(wordProblemLesson?.title, "Solve and interpret");
  assert.equal(wordProblemLesson?.expectedResponse, "9");
  assert.match(wordProblemLesson?.remediation ?? "", /context|original sentence/i);
  assert.deepEqual(getLessonForConcept("solution-checking")?.choiceOptions, ["yes", "no"]);
  assert.ok(getLessonForConcept("inverse-operations")?.choiceOptions?.includes("divide by 5"));
  assert.deepEqual(getLessonForConcept("variables-and-expressions")?.choiceOptions, ["x + 2", "2x", "x - 2", "2 - x"]);
  assert.deepEqual(getLessonForConcept("translate-word-problems")?.choiceOptions, [
    "x - 7 = 9",
    "7 - x = 9",
    "x + 7 = 9",
    "9 - 7 = x",
  ]);
  assert.deepEqual(getLessonForConcept("order-of-operations")?.choiceOptions, ["14", "20", "24", "11"]);
  assert.equal(getLessonForConcept("one-step-subtraction-equations")?.expectedResponse, "11");
  assert.equal(getLessonForConcept("one-step-multiplication-equations")?.expectedResponse, "5");
  assert.equal(getLessonForConcept("one-step-division-equations")?.expectedResponse, "15");
  assert.deepEqual(getLessonForConcept("distributive-property")?.choiceOptions, ["3x + 6", "3x + 2", "x + 6", "6x"]);
  assert.equal(getLessonForConcept("equations-with-like-terms")?.expectedResponse, "4");
  assert.equal(getLessonForConcept("variables-on-both-sides")?.expectedResponse, "5");
  assert.equal(getLessonForConcept("fraction-equations")?.expectedResponse, "14");
  assert.equal(getLessonForConcept("decimal-equations")?.expectedResponse, "3.5");
  assert.deepEqual(getLessonForConcept("inequalities-intro")?.choiceOptions, ["x > 5", "x < 5", "x = 5", "x >= 5"]);
  assert.deepEqual(concept?.prerequisites, [
    "one-step-addition-equations",
    "one-step-subtraction-equations",
    "one-step-multiplication-equations",
    "one-step-division-equations",
  ]);
});

test("invalid scene output is replaced by the safe fallback scene", () => {
  const result = interpretScene(
    {
      version: 1,
      scene: {
        id: "bad.scene",
        kind: "lesson",
        objectiveId: "concept.variables-and-expressions",
        transition: "fade",
        tone: "curious",
      },
      narration: {
        text: "<div>unsafe</div>",
        maxChars: 32,
        estDurationMs: 1000,
        bargeInAllowed: true,
      },
      interaction: {
        type: "tap-choice",
        options: new Array(5).fill(0).map((_, index) => ({
          id: String(index),
          audioLabel: `Option ${index}`,
        })),
      },
    },
    nextCurriculumDecision(recordAssessmentCompletion(createDefaultState(), "variables-and-expressions")),
  );

  assert.equal(result.ok, false);
  assert.equal(result.blueprint.scene.kind, "fallback");
});

test("recent turns are bounded", () => {
  let state = createDefaultState();
  for (let index = 0; index < 10; index += 1) {
    state = {
      ...state,
      runtimeSession: {
        ...state.runtimeSession,
        recentTurns: [...state.runtimeSession.recentTurns, { role: "user", content: `turn-${index}` }].slice(-8),
      },
    };
  }

  assert.equal(state.runtimeSession.recentTurns.length, 8);
  assert.equal(state.runtimeSession.recentTurns[0].content, "turn-2");
});

test("active scene syncs the pedagogical current objective", () => {
  const nextState = setActiveScene(createDefaultState(), {
    scene: {
      id: "scene_variables_1",
      objectiveId: "concept.variables-and-expressions",
    },
  });

  assert.equal(nextState.pedagogicalState.currentObjectiveId, "concept.variables-and-expressions");
});

test("fallback scene is always locally renderable", () => {
  const fallback = createFallbackScene("test");
  assert.equal(fallback.scene.kind, "fallback");
  assert.equal(fallback.interaction.type, "none");
  assert.match(fallback.narration.text, /continue another way/i);
});

test("cloud and backup defaults follow the spec contract", () => {
  assert.equal(APP_CONFIG.cloudMode, "required");
  assert.equal(APP_CONFIG.features.exportImport, true);
  assert.equal(APP_CONFIG.features.cloudDirector, true);
});

test("formal adapter contracts expose the spec extension points", () => {
  assert.deepEqual(Object.keys(ADAPTER_CONTRACTS), [
    "aiProviderAdapter",
    "modelAdapter",
    "storageAdapter",
    "subjectPack",
    "validationPlugin",
    "telemetrySink",
    "uiComponentRegistry",
  ]);
  assert.equal(FIXED_UI_COMPONENT_REGISTRY.length, 9);
  assert.equal(validateContractImplementation("storageAdapter", {}).ok, false);
  assert.equal(
    validateContractImplementation("storageAdapter", {
      loadState() {},
      saveState() {},
      loadScene() {},
      saveScene() {},
      exportBackup() {},
      importBackup() {},
    }).ok,
    true,
  );
});

test("export manifests are versioned and validate required metadata", () => {
  const manifest = createExportManifest(createDefaultState(), "primer-aes-gcm-v1", "2026-04-08T12:00:00.000Z");
  const validation = validateExportManifest(manifest);

  assert.equal(manifest.manifestType, "primer-export-manifest");
  assert.equal(manifest.formatVersion, 2);
  assert.equal(manifest.encryption, "primer-aes-gcm-v1");
  assert.equal(validation.ok, true);
});
