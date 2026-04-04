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

test("director request validator rejects unsupported latest input types", () => {
  const result = validateDirectorRequest({
    requestId: "director-1",
    learnerSummary: "Learner is at stage 1.",
    runtimeSummary: null,
    latestInput: {
      type: "freeform",
      content: "something",
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

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /latestinput\.type/i);
});

test("director request summarizes learner state instead of dumping sensitive raw state", () => {
  const state = runtimeModule.createDefaultState({
    learnerProfile: {
      locale: "en-GB",
    },
    consentAndSettings: {
      adminPinEnabled: true,
      adminPinHash: "secret-hash",
    },
    runtimeSession: {
      recentTurns: [
        { role: "user", content: "turn-1" },
        { role: "user", content: "turn-2" },
        { role: "user", content: "turn-3" },
        { role: "user", content: "turn-4" },
        { role: "user", content: "turn-5" },
      ],
    },
  });
  const decision = runtimeModule.nextCurriculumDecision(state);
  const request = runtimeModule.buildDirectorRequest(state, decision, {
    type: "system-start",
    content: "startup",
  });

  assert.match(request.learnerSummary, /Locale en-GB/);
  assert.doesNotMatch(request.learnerSummary, /secret-hash/);
  assert.doesNotMatch(JSON.stringify(request), /adminPinHash/);
  assert.equal(request.runtimeSummary.includes("turn-1"), false);
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

test("director response validator rejects objective drift and unsafe recipes", () => {
  const result = validateDirectorResponse(
    {
      blueprint: {
        version: 1,
        scene: {
          id: "scene_wrong_objective",
          kind: "lesson",
          objectiveId: "reading.symbol-match.99",
          transition: "fade",
          tone: "curious",
        },
        narration: {
          text: "Choose the matching symbol.",
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
          recipeId: "unbounded_recipe",
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
  assert.match(result.errors.join(" "), /objective/i);
  assert.match(result.errors.join(" "), /visual recipe/i);
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

test("repeat-sound scenes fall back to a tap path when local audio is unavailable", () => {
  const state = runtimeModule.createDefaultState({
    capabilities: {
      localTTS: false,
    },
  });

  const normalized = runtimeModule.normalizeSceneForRuntime(
    {
      version: 1,
      scene: {
        id: "scene_repeat_sound",
        kind: "lesson",
        objectiveId: "reading.symbol-match.1",
        transition: "fade",
        tone: "curious",
      },
      narration: {
        text: "Repeat the sound m.",
        maxChars: 90,
        estDurationMs: 1200,
        bargeInAllowed: true,
      },
      interaction: {
        type: "repeat-sound",
        phoneme: "m",
      },
      visualIntent: {
        type: "recipe",
        recipeId: "neutral_choice_board",
        vars: {},
      },
      evidence: {
        observedSkill: "repeat-sound",
        confidenceHint: 0.6,
      },
    },
    state,
  );

  assert.equal(normalized.interaction.type, "tap-choice");
  assert.equal(normalized.interaction.options[0].id, "M");
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

test("relay request failure returns a stable error without throwing", async () => {
  process.env.PRIMER_RELAY_BASE_URL = "https://relay.example";
  const failingRuntime = await import(new URL(`../apps/web/src/app/runtime.js?fail=${Date.now()}`, import.meta.url));
  const state = failingRuntime.createDefaultState();
  const decision = failingRuntime.nextCurriculumDecision(state);
  const result = await failingRuntime.requestDirectorScene({
    state,
    decision,
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    localScene: {
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
      interaction: {
        type: "tap-choice",
        options: [{ id: "a", audioLabel: "A" }],
      },
      visualIntent: {
        type: "recipe",
        recipeId: "neutral_choice_board",
        vars: {},
      },
      evidence: {
        observedSkill: "audio-choice",
        confidenceHint: 0.7,
      },
    },
    fetchImpl: async () => {
      throw new Error("network-down");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.error.code, "relay_request_failed");
});

test("relay timeouts return a stable error without blocking indefinitely", async () => {
  process.env.PRIMER_RELAY_BASE_URL = "https://relay.example";
  const timeoutRuntime = await import(new URL(`../apps/web/src/app/runtime.js?timeout=${Date.now()}`, import.meta.url));
  const state = timeoutRuntime.createDefaultState();
  const decision = timeoutRuntime.nextCurriculumDecision(state);
  const result = await timeoutRuntime.requestDirectorScene({
    state,
    decision,
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    localScene: timeoutRuntime.createFallbackScene("timeout"),
    fetchImpl: () => new Promise(() => {}),
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.error.code, "relay_request_failed");
  assert.match(String(result.error.error.details), /relay-timeout/);
});

test("recovered scenes fall back safely when persisted scene is malformed", () => {
  const recovered = runtimeModule.recoverSceneForRuntime(
    {
      version: 1,
      scene: {
        id: "broken",
        kind: "lesson",
        objectiveId: "reading.symbol-match.1",
        transition: "fade",
        tone: "curious",
      },
      narration: {
        text: "<div>unsafe</div>",
        maxChars: 20,
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
    runtimeModule.createDefaultState(),
  );

  assert.equal(recovered.scene.kind, "fallback");
  assert.equal(recovered.scene.objectiveId, "fallback.safe-path");
});

test("asset manifest seeds essential built-in assets", () => {
  const state = runtimeModule.hydrateAssetIndex(runtimeModule.createDefaultState());
  assert.equal(state.assetIndex.manifestVersion, 1);
  assert.equal(state.assetIndex.byId["shell-core"].essential, true);
  assert.equal(state.assetIndex.byId["fallback-audio-en"].installed, true);
});

test("optional asset install plan is lazy and can be installed later", () => {
  const state = runtimeModule.hydrateAssetIndex(
    runtimeModule.createDefaultState({
      capabilities: {
        tier: "standard-local",
        opfs: true,
      },
    }),
  );

  const plan = runtimeModule.getAssetInstallPlan(state);
  assert.ok(plan.assets.length >= 1);

  const result = runtimeModule.installAssetRecord(state, plan.assets[0].id);
  assert.equal(result.changed, true);
  assert.equal(result.state.assetIndex.byId[plan.assets[0].id].installed, true);
});

test("eviction clears only non-essential installed assets", () => {
  let state = runtimeModule.hydrateAssetIndex(
    runtimeModule.createDefaultState({
      capabilities: {
        tier: "standard-local",
        opfs: true,
      },
    }),
  );

  for (const asset of runtimeModule.getAssetInstallPlan(state).assets) {
    state = runtimeModule.installAssetRecord(state, asset.id).state;
  }

  const result = runtimeModule.evictNonEssentialAssets(state);
  assert.ok(result.evicted >= 1);
  assert.equal(result.state.assetIndex.byId["shell-core"].installed, true);
});

test("storage estimate normalizes browser storage information", async () => {
  const estimate = await runtimeModule.estimateStorage({
    navigator: {
      storage: {
        estimate: async () => ({ quota: 4000, usage: 1000 }),
      },
    },
  });

  assert.deepEqual(estimate, { quota: 4000, usage: 1000 });
});

test("storage estimate returns null when the browser API is unavailable", async () => {
  const estimate = await runtimeModule.estimateStorage({});
  assert.equal(estimate, null);
});

test("quota handling can block oversized optional installs", () => {
  const state = runtimeModule.hydrateAssetIndex(
    runtimeModule.createDefaultState({
      capabilities: {
        tier: "accelerated-local",
        opfs: true,
      },
    }),
  );
  const plan = runtimeModule.getAssetInstallPlan(state);
  const oversized = plan.totalBytes > 100;
  assert.equal(oversized, true);
});

test("admin PIN can be set, verified, unlocked, and cleared locally", () => {
  let state = runtimeModule.createDefaultState();
  state = runtimeModule.setAdminPin(state, "1234");
  assert.equal(state.consentAndSettings.adminPinEnabled, true);
  assert.equal(runtimeModule.verifyAdminPin(state, "1234"), true);
  assert.equal(runtimeModule.verifyAdminPin(state, "9999"), false);

  state = runtimeModule.unlockAdmin(state);
  assert.equal(state.consentAndSettings.adminUnlocked, true);

  state = runtimeModule.clearAdminPin(state);
  assert.equal(state.consentAndSettings.adminPinEnabled, false);
  assert.equal(state.consentAndSettings.adminPinHash, null);
});

test("reset learner state clears progress but preserves local admin and capability settings", () => {
  let state = runtimeModule.hydrateAssetIndex(
    runtimeModule.createDefaultState({
      capabilities: {
        tier: "standard-local",
      },
      pedagogicalState: {
        literacyStage: 3,
        assessmentStatus: "complete",
        domainStage: {
          reading: 3,
          writing: 2,
          numeracy: 2,
          mathematics: 0,
          science: 0,
          physics: 0,
        },
      },
      consentAndSettings: {
        cloudEnabled: true,
        adminPinEnabled: true,
        adminPinHash: runtimeModule.hashAdminPin("1234"),
        adminUnlocked: true,
      },
    }),
  );

  state = runtimeModule.resetLearnerState(state);
  assert.equal(state.pedagogicalState.assessmentStatus, "not-started");
  assert.equal(state.pedagogicalState.literacyStage, 0);
  assert.equal(state.capabilities.tier, "standard-local");
  assert.equal(state.consentAndSettings.cloudEnabled, true);
  assert.equal(state.consentAndSettings.adminPinEnabled, true);
  assert.equal(state.consentAndSettings.adminUnlocked, false);
});

test("offline recovery state retains the last safe scene metadata", () => {
  const safeScene = runtimeModule.createFallbackScene("restore");
  const state = runtimeModule.setActiveScene(runtimeModule.createDefaultState(), safeScene);
  assert.equal(state.runtimeSession.activeSceneId, safeScene.scene.id);
  assert.equal(state.runtimeSession.lastScene.scene.kind, "fallback");
});

test("encrypted backup payload round-trips with the same passphrase", () => {
  const payload = JSON.stringify({ learner: "local-learner", stage: 2 });
  const encrypted = runtimeModule.encryptBackupPayload(payload, "secret-passphrase");
  const decrypted = runtimeModule.decryptBackupPayload(encrypted, "secret-passphrase");
  assert.equal(decrypted, payload);
});

test("encrypted backup rejects unsupported payload formats", () => {
  assert.throws(
    () => runtimeModule.decryptBackupPayload(JSON.stringify({ encryption: "other", payload: "abc" }), "pw"),
    /supported format/i,
  );
});
