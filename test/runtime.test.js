import test from "node:test";
import assert from "node:assert/strict";

import {
  createStableError,
  validateChatRequest,
  validateChatResponse,
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
    learnerSummary: "Learner is working in the algebra foundations module.",
    runtimeSummary: null,
    latestInput: {
      type: "math-input",
      content: "x = 7",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["math-input", "none"],
      maxNarrationChars: 180,
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
    learnerSummary: "Learner is working in the algebra foundations module.",
    runtimeSummary: null,
    latestInput: {
      type: "freeform",
      content: "something",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["math-input", "none"],
      maxNarrationChars: 180,
      imageGenerationAllowed: false,
      locale: "en-GB",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /latestinput\.type/i);
});

test("chat request validator accepts bounded chat shape", () => {
  const result = validateChatRequest({
    requestId: "chat-1",
    learnerSummary: "Learner is at stage 1.",
    latestInput: {
      type: "transcript",
      content: "How do I do this?",
    },
    maxResponseChars: 120,
  });

  assert.equal(result.ok, true);
});

test("chat response validator rejects HTML in text", () => {
  const result = validateChatResponse(
    {
      reply: {
        text: "<b>Unsafe</b>",
      },
    },
    120,
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /html/i);
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
          objectiveId: "concept.one-step-addition-equations",
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
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 180,
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
          objectiveId: "concept.wrong-concept",
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
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 180,
    },
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /objective/i);
  assert.match(result.errors.join(" "), /visual recipe/i);
});

test("director response validator accepts read/respond interaction when constrained", () => {
  const result = validateDirectorResponse(
    {
      blueprint: {
        version: 1,
        scene: {
          id: "scene_read_respond",
          kind: "lesson",
          objectiveId: "concept.variables-and-expressions",
          transition: "fade",
          tone: "encouraging",
        },
        narration: {
          text: "Read and reply with one key word.",
          maxChars: 120,
          estDurationMs: 1200,
          bargeInAllowed: true,
        },
        interaction: {
          type: "read-respond",
          prompt: "Read: The map is on the table.",
          expectedKeywords: ["map", "table"],
        },
        visualIntent: {
          type: "recipe",
          recipeId: "neutral_choice_board",
          vars: {},
        },
      },
    },
    {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "variables-and-expressions",
      phase: "diagnostic",
      objectiveId: "concept.variables-and-expressions",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["read-respond", "none"],
      maxNarrationChars: 180,
    },
  );

  assert.equal(result.ok, true);
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

test("math input validator accepts equivalent numeric answers", () => {
  const result = runtimeModule.validateMathInputResponse("x = 4", "4");
  assert.equal(result.correct, true);
  assert.match(result.feedback, /checks out|equivalent/i);
});

test("math input validator accepts equivalent symbolic answers", () => {
  const result = runtimeModule.validateMathInputResponse("(x + 1) + 2", "x + 3");
  assert.equal(result.correct, true);
  assert.equal(result.mode, "expression");
});

test("math input validator rejects malformed expressions", () => {
  const result = runtimeModule.validateMathInputResponse("2**x", "4");
  assert.equal(result.correct, false);
  assert.equal(result.reason, "syntax");
  assert.match(result.feedback, /could not be parsed|check symbols/i);
});

test("math input validator returns concept-aware remediation for incorrect algebra steps", () => {
  const result = runtimeModule.validateMathInputResponse("9", "7", "one-step-addition-equations");
  assert.equal(result.correct, false);
  assert.equal(result.reason, "conceptual");
  assert.match(result.feedback, /inverse operation|check the result/i);
});

test("math input validator flags mismatched equation form", () => {
  const result = runtimeModule.validateMathInputResponse("x + 4", "x = 4");
  assert.equal(result.correct, false);
  assert.equal(result.reason, "equation-form");
});

test("math input validator rejects unsupported variables safely", () => {
  const result = runtimeModule.validateMathInputResponse("y + 2", "x + 2");
  assert.equal(result.correct, false);
  assert.equal(result.reason, "unsupported-variable");
});

test("short text validator accepts bounded textual responses", () => {
  const result = runtimeModule.validateShortTextResponse("divide by 5", "divide by 5");
  assert.equal(result.correct, true);
  assert.equal(result.reason, "short-text");
});

test("short text validator accepts any authored keyword match", () => {
  const result = runtimeModule.validateShortTextResponse("unknown number", ["unknown", "value", "variable"]);
  assert.equal(result.correct, true);
  assert.equal(result.reason, "short-text");
});

test("scene normalization preserves bounded algebra interactions unchanged", () => {
  const scene = {
    version: 1,
    scene: {
      id: "scene_order_of_operations",
      kind: "assessment",
      objectiveId: "diagnostic.order-of-operations",
      transition: "fade",
      tone: "focused",
    },
    narration: {
      text: "Diagnostic check: Order of operations.",
      maxChars: 90,
      estDurationMs: 1200,
      bargeInAllowed: true,
    },
    interaction: {
      type: "tap-choice",
      options: [
        { id: "14", label: "14", audioLabel: "14", correct: true },
        { id: "20", label: "20", audioLabel: "20", correct: false },
      ],
    },
    visualIntent: {
      type: "recipe",
      recipeId: "neutral_choice_board",
      vars: {},
    },
    evidence: {
      observedSkill: "order-of-operations",
      confidenceHint: 0.6,
    },
  };

  const normalized = runtimeModule.normalizeSceneForRuntime(scene, runtimeModule.createDefaultState());
  assert.deepEqual(normalized, scene);
});

test("mock director can propose a bounded scene when relay is set to mock", async () => {
  process.env.PRIMER_RELAY_BASE_URL = "mock";
  const mockedRuntime = await import(new URL(`../apps/web/src/app/runtime.js?mock=${Date.now()}`, import.meta.url));
  const state = mockedRuntime.createDefaultState({
    moduleSelection: {
      selectedModuleId: "algebra-foundations",
    },
    pedagogicalState: {
      diagnosticStatus: "complete",
      currentConceptId: "one-step-addition-equations",
      currentObjectiveId: "concept.one-step-addition-equations",
      recommendedConceptId: "one-step-addition-equations",
      masteryByConcept: {},
      misconceptionsByConcept: {},
      evidenceLog: [],
      reviewSchedule: [],
      recentActivity: [],
      lessonRecords: {
        "lesson.one-step-addition-equations": {
          lessonId: "lesson.one-step-addition-equations",
          conceptId: "one-step-addition-equations",
          status: "in-progress",
          sessionPhase: "learner-attempt",
          lastUpdatedAt: new Date().toISOString(),
        },
      },
      assessmentItems: {},
      attemptLog: [],
      goals: [],
    },
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
      id: "scene_lesson_one_step_addition",
      kind: "lesson",
      objectiveId: decision.objectiveId,
      transition: "slide",
      tone: "encouraging",
    },
    narration: {
      text: "Solve the short algebra prompt.",
      maxChars: 180,
      estDurationMs: 1200,
      bargeInAllowed: true,
    },
    visualIntent: {
      type: "recipe",
      recipeId: "neutral_choice_board",
      vars: {},
    },
    interaction: {
      type: "math-input",
      expressionPrompt: "Solve x + 5 = 12.",
      expectedExpression: "7",
    },
    evidence: {
      observedSkill: "one-step-addition-equations",
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
  assert.equal(result.blueprint.scene.kind, "lesson");
  assert.equal(result.blueprint.interaction.type, "math-input");
});

test("browser relay config is used when process env is unavailable", async () => {
  const originalRelayBaseUrl = process.env.PRIMER_RELAY_BASE_URL;
  const originalPrimerConfig = globalThis.PRIMER_CONFIG;
  delete process.env.PRIMER_RELAY_BASE_URL;
  globalThis.PRIMER_CONFIG = {
    relayBaseUrl: "https://relay.example",
  };

  const configuredRuntime = await import(new URL(`../apps/web/src/app/runtime.js?browser-config=${Date.now()}`, import.meta.url));
  const state = configuredRuntime.createDefaultState();
  const decision = configuredRuntime.nextCurriculumDecision(state);
  let requestedUrl = null;
  const interactionType = decision.allowedInteractionTypes[0];
  const interaction =
    interactionType === "read-respond"
      ? {
          type: "read-respond",
          prompt: "Share one short algebra idea.",
          expectedKeywords: ["variable"],
        }
      : interactionType === "math-input"
        ? {
            type: "math-input",
            expressionPrompt: "Solve x + 2 = 9.",
            expectedExpression: "7",
          }
        : interactionType === "tap-choice"
          ? {
              type: "tap-choice",
              options: [
                { id: "7", label: "7", audioLabel: "7", correct: true },
                { id: "5", label: "5", audioLabel: "5", correct: false },
              ],
            }
          : {
              type: "none",
            };

  const result = await configuredRuntime.requestDirectorScene({
    state,
    decision,
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    localScene: configuredRuntime.createFallbackScene("configured-relay"),
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          blueprint: {
            version: 1,
            scene: {
              id: "scene_configured_relay",
              kind: decision.allowedSceneKinds[0],
              objectiveId: decision.objectiveId,
              transition: "slide",
              tone: "encouraging",
            },
            narration: {
              text: "Stay with the current bounded algebra objective.",
              maxChars: decision.maxNarrationChars,
              estDurationMs: 1200,
              bargeInAllowed: true,
            },
            interaction,
            visualIntent: {
              type: "recipe",
              recipeId: "neutral_choice_board",
              vars: {},
            },
            evidence: {
              observedSkill: decision.conceptId ?? "algebra-foundations",
              confidenceHint: 0.7,
            },
          },
        }),
      };
    },
  });

  if (originalRelayBaseUrl === undefined) {
    delete process.env.PRIMER_RELAY_BASE_URL;
  } else {
    process.env.PRIMER_RELAY_BASE_URL = originalRelayBaseUrl;
  }
  if (originalPrimerConfig === undefined) {
    delete globalThis.PRIMER_CONFIG;
  } else {
    globalThis.PRIMER_CONFIG = originalPrimerConfig;
  }

  assert.equal(result.ok, true);
  assert.equal(requestedUrl, "https://relay.example/director");
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

test("relay moderation blocks are returned as explicit runtime safety errors", async () => {
  process.env.PRIMER_RELAY_BASE_URL = "https://relay.example";
  const runtime = await import(new URL(`../apps/web/src/app/runtime.js?moderation=${Date.now()}`, import.meta.url));
  const state = runtime.createDefaultState({
    consentAndSettings: { cloudEnabled: true },
    providerConfig: { apiKey: "test-key" },
  });
  const decision = runtime.nextCurriculumDecision(state);
  const result = await runtime.requestDirectorScene({
    state,
    decision,
    latestInput: { type: "transcript", content: "graphic violence" },
    localScene: runtime.createFallbackScene("moderation"),
    fetchImpl: async () => ({
      ok: false,
      json: async () => ({
        error: {
          code: "moderation_blocked",
          message: "Request blocked by mixed-age-safe moderation.",
          details: ["graphic violence"],
        },
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.error.code, "moderation_blocked");
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
        diagnosticStatus: "complete",
        currentConceptId: "two-step-equations",
        currentObjectiveId: "concept.two-step-equations",
        recommendedConceptId: "two-step-equations",
      },
      consentAndSettings: {
        cloudEnabled: true,
        adminPinEnabled: true,
        adminPinHash: runtimeModule.hashAdminPin("1234"),
        adminUnlocked: true,
      },
      providerConfig: {
        providerName: "openrouter",
        modelName: "provider/model",
        endpointUrl: "https://openrouter.ai/api/v1",
        apiKey: "test-key",
      },
    }),
  );

  state = runtimeModule.resetLearnerState(state);
  assert.equal(state.pedagogicalState.diagnosticStatus, "not-started");
  assert.equal(state.pedagogicalState.currentConceptId, "variables-and-expressions");
  assert.equal(state.moduleSelection.selectedModuleId, "algebra-foundations");
  assert.equal(state.capabilities.tier, "standard-local");
  assert.equal(state.consentAndSettings.cloudEnabled, true);
  assert.equal(state.consentAndSettings.adminPinEnabled, true);
  assert.equal(state.consentAndSettings.adminUnlocked, false);
  assert.equal(state.providerConfig.apiKey, "test-key");
});

test("persistable state strips provider api keys from the learner blob", () => {
  const state = runtimeModule.createDefaultState({
    providerConfig: {
      providerName: "openrouter",
      apiKey: "secret-key",
    },
  });

  const sanitized = runtimeModule.sanitizeStateForPersistence(state);
  assert.equal(sanitized.providerConfig.apiKey, "");
  assert.equal(sanitized.providerConfig.hasStoredApiKey, true);
});

test("browser storage adapter keeps provider secret separate from saved state", async () => {
  const backingStore = new Map();
  const localStorage = {
    getItem(key) {
      return backingStore.has(key) ? backingStore.get(key) : null;
    },
    setItem(key, value) {
      backingStore.set(key, String(value));
    },
    removeItem(key) {
      backingStore.delete(key);
    },
  };
  const adapter = runtimeModule.createBrowserStorageAdapter({ localStorage });
  const state = runtimeModule.sanitizeStateForPersistence(
    runtimeModule.createDefaultState({
      providerConfig: {
        providerName: "openrouter",
        apiKey: "secret-key",
      },
    }),
  );

  await adapter.saveState(state);
  await adapter.saveProviderSecret("secret-key");

  const loadedState = await adapter.loadState();
  const loadedSecret = await adapter.loadProviderSecret();

  assert.equal(loadedState.providerConfig.apiKey, "");
  assert.equal(loadedState.providerConfig.hasStoredApiKey, true);
  assert.equal(loadedSecret, "secret-key");
});

test("telemetry events are gated by explicit opt-in and category preferences", () => {
  let state = runtimeModule.createDefaultState();
  state = runtimeModule.recordTelemetryEvent(state, "validator-mismatch", "Should not record.");
  assert.equal(state.telemetryState.eventLog.length, 0);

  state = runtimeModule.createDefaultState({
    consentAndSettings: {
      telemetryEnabled: true,
      telemetryPreferences: {
        validatorMismatchEnabled: true,
        crashReportsEnabled: false,
        reviewedTraceDonationEnabled: false,
      },
    },
  });
  state = runtimeModule.recordTelemetryEvent(state, "validator-mismatch", "Recorded mismatch.");
  assert.equal(state.telemetryState.eventLog.length, 1);
  assert.equal(state.telemetryState.eventLog[0].category, "validator-mismatch");
});

test("reviewed trace donation requires a staged draft and clears it after recording", () => {
  let state = runtimeModule.createDefaultState({
    consentAndSettings: {
      telemetryEnabled: true,
      telemetryPreferences: {
        validatorMismatchEnabled: false,
        crashReportsEnabled: false,
        reviewedTraceDonationEnabled: true,
      },
    },
  });
  const scene = runtimeModule.createFallbackScene("trace-review");
  state = runtimeModule.stageTraceDonationDraft(state, scene);
  assert.ok(state.telemetryState.pendingTraceDonation);

  state = runtimeModule.donateReviewedTrace(state);
  assert.equal(state.telemetryState.pendingTraceDonation, null);
  assert.equal(state.telemetryState.eventLog.at(-1).category, "reviewed-trace-donation");
});

test("safety redirect scene uses bounded non-companion recovery copy", () => {
  const scene = runtimeModule.createSafetyRedirectScene(["graphic violence"]);
  assert.equal(scene.scene.objectiveId, "safety.redirect");
  assert.match(scene.narration.text, /paused normal tutoring/i);
  assert.doesNotMatch(scene.narration.text, /friend|companion|always here/i);
});

test("offline recovery state retains the last safe scene metadata", () => {
  const safeScene = runtimeModule.createFallbackScene("restore");
  const state = runtimeModule.setActiveScene(runtimeModule.createDefaultState(), safeScene);
  assert.equal(state.runtimeSession.activeSceneId, safeScene.scene.id);
  assert.equal(state.runtimeSession.lastScene.scene.kind, "fallback");
});

test("encrypted backup payload round-trips with the same passphrase", async () => {
  const payload = JSON.stringify({ learner: "local-learner", stage: 2 });
  const encrypted = await runtimeModule.encryptBackupPayload(payload, "secret-passphrase");
  const decrypted = await runtimeModule.decryptBackupPayload(encrypted, "secret-passphrase");
  const parsed = JSON.parse(encrypted);

  assert.equal(parsed.encryption, runtimeModule.ENCRYPTION_AES_GCM);
  assert.equal(parsed.formatVersion, runtimeModule.EXPORT_FORMAT_VERSION);
  assert.equal(decrypted, payload);
});

test("encrypted backup rejects unsupported payload formats", async () => {
  await assert.rejects(
    runtimeModule.decryptBackupPayload(JSON.stringify({ encryption: "other", payload: "abc" }), "pw"),
    /supported format/i,
  );
});

test("legacy encrypted backup payloads remain importable", async () => {
  const payload = JSON.stringify({ learner: "local-learner", stage: 2 });
  const encrypted = JSON.stringify({
    encryption: runtimeModule.ENCRYPTION_LEGACY_XOR,
    payload: Buffer.from(
      payload
        .split("")
        .map((character, index) =>
          String.fromCharCode(character.charCodeAt(0) ^ "secret-passphrase".charCodeAt(index % "secret-passphrase".length)),
        )
        .join(""),
      "utf8",
    ).toString("base64"),
  });

  const decrypted = await runtimeModule.decryptBackupPayload(encrypted, "secret-passphrase");
  assert.equal(decrypted, payload);
});

test("export bundle wraps state with a manifest and legacy imports normalize", () => {
  const state = runtimeModule.createDefaultState({
    providerConfig: {
      providerName: "openrouter",
      apiKey: "secret-key",
    },
  });
  const bundle = runtimeModule.createExportBundle({ state, scene: null, encrypted: true });
  const normalized = runtimeModule.parseImportBundle({ state, scene: null });

  assert.equal(bundle.manifest.manifestType, "primer-export-manifest");
  assert.equal(bundle.manifest.encryption, runtimeModule.ENCRYPTION_AES_GCM);
  assert.equal(bundle.state.providerConfig.apiKey, "");
  assert.equal(bundle.state.providerConfig.hasStoredApiKey, true);
  assert.equal(normalized.manifest.formatVersion, runtimeModule.EXPORT_FORMAT_VERSION);
  assert.equal(normalized.state.schemaVersion, state.schemaVersion);
});

test("import bundle validation rejects missing state payloads", () => {
  assert.throws(
    () => runtimeModule.parseImportBundle({ manifest: { manifestType: "primer-export-manifest" } }),
    /import manifest is invalid|state is required/i,
  );
});
