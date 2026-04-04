import test from "node:test";
import assert from "node:assert/strict";

import {
  APP_CONFIG,
  advanceAssessment,
  appendRecentTurn,
  applyMasteryEvidence,
  createDefaultState,
  createFallbackScene,
  detectCapabilities,
  interpretScene,
  migrateState,
  nextCurriculumDecision,
  recordAssessmentCompletion,
  setActiveScene,
} from "../packages/core/src/index.js";

test("migrateState returns a spec-shaped default state", () => {
  const migrated = migrateState({ schemaVersion: 0, learnerProfile: { locale: "en-US" } });
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.learnerProfile.locale, "en-US");
  assert.equal(migrated.pedagogicalState.assessmentStatus, "not-started");
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

test("new learner starts in embedded baseline assessment", () => {
  const state = createDefaultState();
  const decision = nextCurriculumDecision(state);
  assert.equal(decision.activeDomain, "preliteracy");
  assert.equal(decision.objectiveId, "baseline.observe-sound.0");
  assert.deepEqual(decision.allowedSceneKinds, ["assessment", "fallback"]);
  assert.equal(state.pedagogicalState.currentObjectiveId, "baseline.observe-sound.0");
  assert.equal(state.consentAndSettings.cloudEnabled, true);
});

test("assessment advances through staged baseline checkpoints", () => {
  let state = createDefaultState();
  state = advanceAssessment(state, 0);
  assert.equal(nextCurriculumDecision(state).objectiveId, "baseline.symbol-match.1");

  state = advanceAssessment(state, 1);
  assert.equal(nextCurriculumDecision(state).objectiveId, "baseline.trace-letter.2");

  state = advanceAssessment(state, 2);
  assert.equal(nextCurriculumDecision(state).objectiveId, "baseline.read-short.3");
});

test("completed assessment unlocks deterministic reading flow", () => {
  const state = recordAssessmentCompletion(createDefaultState(), 2);
  const decision = nextCurriculumDecision(state);
  assert.equal(decision.activeDomain, "reading");
  assert.equal(decision.objectiveId, "reading.symbol-match.2");
});

test("writing enters the rotation before numeracy when weaker than reading", () => {
  const state = recordAssessmentCompletion(createDefaultState(), 3);
  const decision = nextCurriculumDecision(state);
  assert.equal(decision.activeDomain, "writing");
  assert.equal(decision.objectiveId, "writing.trace-and-build.2");
});

test("cloud and backup defaults follow the spec contract", () => {
  assert.equal(APP_CONFIG.cloudMode, "required");
  assert.equal(APP_CONFIG.features.exportImport, true);
  assert.equal(APP_CONFIG.features.cloudDirector, true);
});

test("assessment completion records a bounded stage", () => {
  const completed = advanceAssessment(
    advanceAssessment(advanceAssessment(advanceAssessment(createDefaultState(), 0), 1), 2),
    3,
  );
  assert.equal(completed.pedagogicalState.assessmentStatus, "complete");
  assert.equal(completed.pedagogicalState.literacyStage, 3);
});

test("mastery evidence rotates from reading to writing to numeracy deterministically", () => {
  const assessed = recordAssessmentCompletion(createDefaultState(), 2);
  const shifted = applyMasteryEvidence(assessed, "writing", 1);
  const shiftedAgain = applyMasteryEvidence(shifted, "reading", 2);
  const shiftedFinal = applyMasteryEvidence(shiftedAgain, "writing", 1);

  assert.equal(nextCurriculumDecision(shifted).activeDomain, "reading");
  assert.equal(nextCurriculumDecision(shiftedAgain).activeDomain, "writing");
  assert.equal(nextCurriculumDecision(shiftedFinal).activeDomain, "numeracy");
});

test("invalid scene output is replaced by the safe fallback scene", () => {
  const result = interpretScene(
    {
      version: 1,
      scene: {
        id: "bad.scene",
        kind: "lesson",
        objectiveId: "reading.symbol-match.1",
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
    nextCurriculumDecision(recordAssessmentCompletion(createDefaultState(), 1)),
  );

  assert.equal(result.ok, false);
  assert.equal(result.blueprint.scene.kind, "fallback");
});

test("recent turns are bounded", () => {
  let state = createDefaultState();
  for (let index = 0; index < 10; index += 1) {
    state = appendRecentTurn(state, { role: "user", content: `turn-${index}` });
  }

  assert.equal(state.runtimeSession.recentTurns.length, 8);
  assert.equal(state.runtimeSession.recentTurns[0].content, "turn-2");
});

test("active scene syncs the pedagogical current objective", () => {
  const nextState = setActiveScene(createDefaultState(), {
    scene: {
      id: "scene_reading_1",
      objectiveId: "reading.symbol-match.1",
    },
  });

  assert.equal(nextState.pedagogicalState.currentObjectiveId, "reading.symbol-match.1");
});

test("fallback scene is always locally renderable", () => {
  const fallback = createFallbackScene("test");
  assert.equal(fallback.scene.kind, "fallback");
  assert.equal(fallback.interaction.type, "none");
  assert.match(fallback.narration.text, /continue another way/i);
});
