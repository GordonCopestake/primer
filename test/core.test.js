import test from "node:test";
import assert from "node:assert/strict";

import {
  appendRecentTurn,
  applyMasteryEvidence,
  createDefaultState,
  createFallbackScene,
  detectCapabilities,
  interpretScene,
  migrateState,
  nextCurriculumDecision,
  recordAssessmentCompletion,
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
  const decision = nextCurriculumDecision(createDefaultState());
  assert.equal(decision.activeDomain, "preliteracy");
  assert.deepEqual(decision.allowedSceneKinds, ["assessment", "fallback"]);
});

test("completed assessment unlocks deterministic reading flow", () => {
  const state = recordAssessmentCompletion(createDefaultState(), 1);
  const decision = nextCurriculumDecision(state);
  assert.equal(decision.activeDomain, "reading");
  assert.equal(decision.objectiveId, "reading.symbol-match.1");
});

test("mastery evidence can shift the next domain decision", () => {
  const assessed = recordAssessmentCompletion(createDefaultState(), 1);
  const shifted = applyMasteryEvidence(assessed, "reading", 2);
  const decision = nextCurriculumDecision(shifted);
  assert.equal(decision.activeDomain, "numeracy");
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

test("fallback scene is always locally renderable", () => {
  const fallback = createFallbackScene("test");
  assert.equal(fallback.scene.kind, "fallback");
  assert.equal(fallback.interaction.type, "none");
  assert.match(fallback.narration.text, /continue another way/i);
});
