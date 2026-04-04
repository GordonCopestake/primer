import test from "node:test";
import assert from "node:assert/strict";

import {
  createStableError,
  validateDirectorRequest,
  validateDirectorResponse,
} from "../packages/schemas/src/index.js";

const runtimeModule = await import(new URL("../apps/web/src/app/runtime.js?test", import.meta.url));

test("stable relay errors preserve code, message, and details", () => {
  const error = createStableError("relay_unavailable", "Relay is not configured.", ["missing URL"]);
  assert.equal(error.error.code, "relay_unavailable");
  assert.equal(error.error.message, "Relay is not configured.");
  assert.deepEqual(error.error.details, ["missing URL"]);
});

test("director request validator accepts the bounded request shape", () => {
  const result = validateDirectorRequest({
    requestId: "director-1",
    learnerSummary: "Learner is at stage 1.",
    runtimeSummary: null,
    latestInput: {
      type: "tap-choice",
      content: "reading.symbol-match.1:map",
    },
    hardConstraints: {
      activeDomain: "reading",
      literacyStage: 1,
      objectiveId: "reading.symbol-match.1",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 120,
      imageGenerationAllowed: false,
      locale: "en-GB",
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("director response validator rejects HTML in narration", () => {
  const result = validateDirectorResponse(
    {
      blueprint: {
        version: 1,
        scene: {
          id: "scene_bad",
          kind: "lesson",
          objectiveId: "reading.symbol-match.1",
          transition: "fade",
          tone: "curious",
        },
        narration: {
          text: "<b>unsafe</b>",
          maxChars: 40,
          estDurationMs: 1000,
          bargeInAllowed: true,
        },
        interaction: {
          type: "tap-choice",
          options: [{ id: "a", audioLabel: "A" }],
        },
        visualIntent: {
          type: "recipe",
          recipeId: "neutral_choice_board",
          vars: {},
        },
      },
    },
    {
      activeDomain: "reading",
      literacyStage: 1,
      objectiveId: "reading.symbol-match.1",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 120,
    },
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /raw html/i);
});

test("local trace scoring accepts broad, deliberate strokes", () => {
  const points = [
    { x: 10, y: 10 },
    { x: 18, y: 30 },
    { x: 25, y: 50 },
    { x: 32, y: 80 },
    { x: 40, y: 110 },
    { x: 46, y: 140 },
    { x: 52, y: 165 },
    { x: 60, y: 190 },
    { x: 70, y: 160 },
    { x: 82, y: 130 },
    { x: 94, y: 98 },
    { x: 106, y: 65 },
    { x: 118, y: 30 },
  ];

  const score = runtimeModule.scoreTrace(points, { width: 220, height: 220 });
  assert.equal(score.success, true);
  assert.ok(score.confidence >= 0.72);
});

test("mock director can propose a bounded scene when relay is set to mock", async () => {
  process.env.PRIMER_RELAY_BASE_URL = "mock";
  const mockedRuntime = await import(new URL(`../apps/web/src/app/runtime.js?mock=${Date.now()}`, import.meta.url));
  const state = mockedRuntime.createDefaultState({
    consentAndSettings: {
      cloudEnabled: true,
      cloudImageEnabled: true,
      cloudVisionEnabled: true,
    },
  });
  const decision = mockedRuntime.nextCurriculumDecision(state);
  const localScene = {
    version: 1,
    scene: {
      id: "scene_assessment",
      kind: "assessment",
      objectiveId: decision.objectiveId,
      transition: "fade",
      tone: "calm",
    },
    narration: {
      text: "Choose the sound that matches.",
      maxChars: 90,
      estDurationMs: 1200,
      bargeInAllowed: true,
    },
    visualIntent: {
      type: "recipe",
      recipeId: "neutral_choice_board",
      vars: {},
    },
    interaction: {
      type: "tap-choice",
      options: [
        { id: "a", audioLabel: "A" },
        { id: "b", audioLabel: "B" },
      ],
    },
    evidence: {
      observedSkill: "audio-choice",
      confidenceHint: 0.7,
    },
  };

  const result = await mockedRuntime.requestDirectorScene({
    state,
    decision,
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    localScene,
  });

  assert.equal(result.ok, true);
  assert.equal(result.blueprint.scene.kind, "assessment");
});
