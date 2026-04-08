import test from "node:test";
import assert from "node:assert/strict";

import {
  ALGEBRA_FOUNDATIONS_MODULE,
  ALGEBRA_LESSONS,
  APP_CONFIG,
  advanceAssessment,
  applyMasteryEvidence,
  createDefaultState,
  createFallbackScene,
  detectCapabilities,
  getAlgebraConcept,
  getLessonForConcept,
  interpretScene,
  migrateState,
  nextCurriculumDecision,
  recordAssessmentCompletion,
  setActiveScene,
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
});

test("assessment advances through staged diagnostic checkpoints", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, { recommendedConceptId: "evaluate-expressions" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.substitution");

  state = advanceAssessment(state, { recommendedConceptId: "one-step-addition-equations" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.one-step");

  state = advanceAssessment(state, { recommendedConceptId: "two-step-equations" });
  assert.equal(nextCurriculumDecision(state).objectiveId, "diagnostic.two-step");
});

test("completed diagnostic unlocks the algebra tutoring flow", () => {
  const state = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  const decision = nextCurriculumDecision(state);

  assert.equal(decision.phase, "tutoring");
  assert.equal(decision.conceptId, "variables-and-expressions");
  assert.equal(decision.objectiveId, "concept.variables-and-expressions");
});

test("mastery evidence advances toward the next available algebra concept", () => {
  const assessed = recordAssessmentCompletion(createDefaultState(), "variables-and-expressions");
  const shifted = applyMasteryEvidence(assessed, "variables-and-expressions", 1);

  assert.equal(shifted.pedagogicalState.masteryByConcept["variables-and-expressions"].status, "mastered");
  assert.equal(shifted.pedagogicalState.currentConceptId, "evaluate-expressions");
  assert.equal(shifted.pedagogicalState.currentObjectiveId, "concept.evaluate-expressions");
});

test("algebra module metadata exposes the bounded concept pack", () => {
  const concept = getAlgebraConcept("two-step-equations");
  const lesson = getLessonForConcept("two-step-equations");

  assert.equal(ALGEBRA_FOUNDATIONS_MODULE.title, "Algebra Foundations");
  assert.ok(ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.length >= 20);
  assert.ok(ALGEBRA_LESSONS.length >= 4);
  assert.equal(concept?.label, "Two-step equations");
  assert.equal(lesson?.title, "Two-step equations");
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
