import {
  ALGEBRA_FOUNDATIONS_MODULE,
  APP_CONFIG,
  advanceAssessment as advanceAssessmentCore,
  advanceTutoringSession as advanceTutoringSessionCore,
  appendRecentTurn as appendRecentTurnCore,
  applyMasteryEvidence as applyMasteryEvidenceCore,
  createDefaultState as createDefaultStateCore,
  createFallbackScene as createFallbackSceneCore,
  detectCapabilities as detectCapabilitiesCore,
  interpretScene as interpretSceneCore,
  getLessonForConcept as getLessonForConceptCore,
  migrateState as migrateStateCore,
  nextCurriculumDecision as nextCurriculumDecisionCore,
  setActiveScene as setActiveSceneCore,
  updateConsentSettings as updateConsentSettingsCore,
} from "../shared/core.js";
import {
  createStableError as createStableErrorSchema,
  validateDirectorRequest as validateDirectorRequestSchema,
  validateDirectorResponse as validateDirectorResponseSchema,
  validateSceneBlueprint,
} from "../shared/schemas.js";

const DIRECTOR_TIMEOUT_MS = 3_500;
const IMAGE_TIMEOUT_MS = 2_500;
const VISION_TIMEOUT_MS = 2_500;
const ASSET_MANIFEST_VERSION = 1;
const EXPORT_FORMAT_VERSION = 2;
const ENCRYPTION_AES_GCM = "primer-aes-gcm-v1";
const ENCRYPTION_LEGACY_XOR = "primer-xor-v1";
const PBKDF2_ITERATIONS = 250_000;
const ALGEBRA_CONCEPT_GRAPH = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph;

const createDefaultState = (overrides = {}) => createDefaultStateCore(overrides);
const migrateState = (rawState) => migrateStateCore(rawState);
const appendRecentTurn = (state, turn) => appendRecentTurnCore(state, turn);
const nextCurriculumDecision = (state) => nextCurriculumDecisionCore(state);
const advanceAssessment = (state, result = {}) => advanceAssessmentCore(state, result);
const advanceTutoringSession = (state, conceptId, action = "continue") =>
  advanceTutoringSessionCore(state, conceptId, action);
const applyMasteryEvidence = (state, conceptId, delta = 1) => applyMasteryEvidenceCore(state, conceptId, delta);
const getLessonForConcept = (conceptId) => getLessonForConceptCore(conceptId);
const setActiveScene = (state, scene) => setActiveSceneCore(state, scene);
const updateConsentSettings = (state, updates) => updateConsentSettingsCore(state, updates);
const detectCapabilities = (runtime) => detectCapabilitiesCore(runtime);
const interpretScene = (blueprint, decision) => interpretSceneCore(blueprint, decision);
const createFallbackScene = (reason = "unknown") => createFallbackSceneCore(reason);
const createStableError = (code, message, details = null) => createStableErrorSchema(code, message, details);
const validateDirectorRequest = (request) => validateDirectorRequestSchema(request);
const validateDirectorResponse = (response, hardConstraints) =>
  validateDirectorResponseSchema(response, hardConstraints);
const getRelayBaseUrl = () =>
  String(globalThis.process?.env?.PRIMER_RELAY_BASE_URL ?? APP_CONFIG.relayBaseUrl ?? "").trim();

const createTapChoiceFallbackScene = (scene) => {
  if (scene?.interaction?.type !== "repeat-sound") {
    return scene;
  }

  const phoneme = String(scene.interaction.phoneme || "").trim().toLowerCase();
  const symbol = phoneme ? phoneme[0].toUpperCase() : "M";
  const distractors = ["S", "T", "L"].filter((option) => option !== symbol).slice(0, 2);

  return {
    ...scene,
    narration: {
      ...scene.narration,
      text: `Use the tap path. Choose the letter for the sound ${symbol}.`,
      maxChars: Math.max(scene.narration?.maxChars ?? 0, 64),
    },
    interaction: {
      type: "tap-choice",
      options: [
        { id: symbol, label: symbol, audioLabel: `Letter ${symbol}`, correct: true },
        ...distractors.map((option) => ({
          id: option,
          label: option,
          audioLabel: `Letter ${option}`,
          correct: false,
        })),
      ],
    },
  };
};

const normalizeSceneForRuntime = (scene, runtimeState) => {
  if (!scene) {
    return createFallbackScene("scene-missing");
  }

  if (
    scene.interaction?.type === "repeat-sound" &&
    (!runtimeState?.consentAndSettings?.soundEnabled || !runtimeState?.capabilities?.localTTS)
  ) {
    return createTapChoiceFallbackScene(scene);
  }

  return scene;
};

const truncateText = (text, maxChars) => {
  if (typeof text !== "string") {
    return "";
  }

  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 1))}...` : text;
};

const createDefaultLearnerState = (capabilities, assetIndex = null) =>
  hydrateAssetIndex(
    createDefaultState({
      capabilities,
      assetIndex:
        assetIndex ?? {
          manifestVersion: ASSET_MANIFEST_VERSION,
          byId: {},
          quotaEstimate: null,
        },
    }),
  );

const resetLearnerState = (state) => {
  const nextState = createDefaultLearnerState(state.capabilities, state.assetIndex);
  return createDefaultState({
    ...nextState,
    consentAndSettings: {
      ...nextState.consentAndSettings,
      cloudEnabled: state.consentAndSettings.cloudEnabled,
      cloudImageEnabled: state.consentAndSettings.cloudImageEnabled,
      cloudVisionEnabled: state.consentAndSettings.cloudVisionEnabled,
      telemetryEnabled: state.consentAndSettings.telemetryEnabled,
      adminPinEnabled: state.consentAndSettings.adminPinEnabled,
      adminPinHash: state.consentAndSettings.adminPinHash,
      adminUnlocked: false,
      storagePersistenceGranted: state.consentAndSettings.storagePersistenceGranted,
      captionsEnabled: state.consentAndSettings.captionsEnabled,
      soundEnabled: state.consentAndSettings.soundEnabled,
    },
    providerConfig: state.providerConfig,
    assetIndex: state.assetIndex,
  });
};

const checksumFor = (seed) => {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `ck-${hash.toString(16).padStart(8, "0")}`;
};

const hashAdminPin = (pin) => checksumFor(`pin:${String(pin).trim()}`);

const setAdminPin = (state, pin) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      adminPinEnabled: true,
      adminPinHash: hashAdminPin(pin),
      adminUnlocked: false,
    },
  });

const clearAdminPin = (state) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      adminPinEnabled: false,
      adminPinHash: null,
      adminUnlocked: false,
    },
  });

const verifyAdminPin = (state, pin) => state.consentAndSettings.adminPinHash === hashAdminPin(pin);

const unlockAdmin = (state) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      adminUnlocked: true,
    },
  });

const lockAdmin = (state) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      adminUnlocked: false,
    },
  });

const encodeBase64 = (bytes) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary);
};

const decodeBase64 = (text) => {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(text, "base64"));
  }

  const binary = globalThis.atob(text);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getCryptoRuntime = async () => {
  if (globalThis.crypto?.subtle && typeof globalThis.crypto.getRandomValues === "function") {
    return globalThis.crypto;
  }

  if (typeof process !== "undefined" && process.versions?.node) {
    const { webcrypto } = await import("node:crypto");
    return webcrypto;
  }

  throw new Error("Secure encryption is unavailable in this runtime.");
};

const encryptBackupPayloadLegacy = (jsonText, passphrase) =>
  JSON.stringify({
    encryption: ENCRYPTION_LEGACY_XOR,
    payload: encodeBase64(
      textEncoder.encode(
        jsonText
          .split("")
          .map((character, index) =>
            String.fromCharCode(character.charCodeAt(0) ^ passphrase.charCodeAt(index % passphrase.length)),
          )
          .join(""),
      ),
    ),
  });

const decryptBackupPayloadLegacy = (encodedText, passphrase) => {
  const parsed = JSON.parse(encodedText);
  if (parsed.encryption !== ENCRYPTION_LEGACY_XOR || typeof parsed.payload !== "string") {
    throw new Error("Backup is not encrypted with the supported format.");
  }

  const decoded = textDecoder.decode(decodeBase64(parsed.payload));
  return decoded
    .split("")
    .map((character, index) =>
      String.fromCharCode(character.charCodeAt(0) ^ passphrase.charCodeAt(index % passphrase.length)),
    )
    .join("");
};

const derivePassphraseKey = async (passphrase, salt) => {
  const cryptoRuntime = await getCryptoRuntime();
  const baseKey = await cryptoRuntime.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return cryptoRuntime.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
};

const encryptBackupPayload = async (jsonText, passphrase) => {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Backup passphrase is required.");
  }

  const cryptoRuntime = await getCryptoRuntime();
  const salt = cryptoRuntime.getRandomValues(new Uint8Array(16));
  const iv = cryptoRuntime.getRandomValues(new Uint8Array(12));
  const key = await derivePassphraseKey(passphrase, salt);
  const ciphertext = await cryptoRuntime.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    textEncoder.encode(jsonText),
  );

  return JSON.stringify({
    encryption: ENCRYPTION_AES_GCM,
    formatVersion: EXPORT_FORMAT_VERSION,
    kdf: "pbkdf2-sha256",
    iterations: PBKDF2_ITERATIONS,
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    payload: encodeBase64(new Uint8Array(ciphertext)),
  });
};

const decryptBackupPayload = async (encodedText, passphrase) => {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Backup passphrase is required.");
  }

  const parsed = JSON.parse(encodedText);
  if (parsed.encryption === ENCRYPTION_LEGACY_XOR) {
    return decryptBackupPayloadLegacy(encodedText, passphrase);
  }

  if (
    parsed.encryption !== ENCRYPTION_AES_GCM ||
    parsed.kdf !== "pbkdf2-sha256" ||
    typeof parsed.payload !== "string" ||
    typeof parsed.salt !== "string" ||
    typeof parsed.iv !== "string"
  ) {
    throw new Error("Backup is not encrypted with the supported format.");
  }

  try {
    const cryptoRuntime = await getCryptoRuntime();
    const key = await derivePassphraseKey(passphrase, decodeBase64(parsed.salt));
    const plaintext = await cryptoRuntime.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodeBase64(parsed.iv),
      },
      key,
      decodeBase64(parsed.payload),
    );
    return textDecoder.decode(new Uint8Array(plaintext));
  } catch {
    throw new Error("Backup could not be decrypted with that passphrase.");
  }
};

const createExportBundle = ({ state, scene, encrypted = false, exportedAt = new Date().toISOString() }) => ({
  manifest: {
    manifestType: "primer-export-manifest",
    formatVersion: EXPORT_FORMAT_VERSION,
    schemaVersion: state?.schemaVersion ?? 2,
    moduleId: state?.moduleSelection?.selectedModuleId ?? "algebra-foundations",
    exportedAt,
    encryption: encrypted ? ENCRYPTION_AES_GCM : "none",
    assetManifestVersion: state?.assetIndex?.manifestVersion ?? ASSET_MANIFEST_VERSION,
    telemetryConsent: state?.consentAndSettings?.telemetryEnabled ? "opt-in" : "off",
    selectedProvider: state?.providerConfig?.providerName ?? "",
  },
  state,
  scene,
});

const parseImportBundle = (rawBundle) => {
  if (rawBundle?.manifest?.manifestType === "primer-export-manifest") {
    return rawBundle;
  }

  return createExportBundle({
    state: rawBundle?.state ?? rawBundle,
    scene: rawBundle?.scene ?? null,
    encrypted: false,
    exportedAt: new Date().toISOString(),
  });
};

const createAssetRecord = ({
  id,
  kind,
  storage,
  version,
  bytes,
  essential = false,
  installed = true,
  generated = false,
  label,
}) => ({
  id,
  kind,
  storage,
  version,
  bytes,
  essential,
  installed,
  generated,
  label,
  checksum: checksumFor(`${id}:${version}:${bytes}`),
  lastAccess: new Date().toISOString(),
});

const getBuiltInAssetManifest = (capabilities) => {
  const manifest = {
    "shell-core": createAssetRecord({
      id: "shell-core",
      kind: "built-in-shell-assets",
      storage: "bundle",
      version: "1.0.0",
      bytes: 96_000,
      essential: true,
      label: "Core shell assets",
    }),
    "fallback-audio-en": createAssetRecord({
      id: "fallback-audio-en",
      kind: "fallback-audio",
      storage: "idb",
      version: "1.0.0",
      bytes: 48_000,
      essential: true,
      label: "Fallback shell audio",
    }),
  };

  if (capabilities.tier !== "minimal") {
    manifest["starter-algebra-pack"] = createAssetRecord({
      id: "starter-algebra-pack",
      kind: "lesson-assets",
      storage: capabilities.opfs ? "opfs" : "idb",
      version: "1.0.0",
      bytes: 220_000,
      installed: false,
      label: "Starter algebra pack",
    });
  }

  if (capabilities.tier === "accelerated-local") {
    manifest["model-pack-stt-lite"] = createAssetRecord({
      id: "model-pack-stt-lite",
      kind: "local-model-pack",
      storage: capabilities.opfs ? "opfs" : "idb",
      version: "1.0.0",
      bytes: 1_800_000,
      installed: false,
      label: "Local STT lite model",
    });
  }

  return manifest;
};

const hydrateAssetIndex = (state) =>
  createDefaultState({
    ...state,
    assetIndex: {
      manifestVersion: ASSET_MANIFEST_VERSION,
      quotaEstimate: state.assetIndex?.quotaEstimate ?? null,
      byId: {
        ...getBuiltInAssetManifest(state.capabilities),
        ...(state.assetIndex?.byId ?? {}),
      },
    },
  });

const updateAssetAccess = (state, assetId) => {
  const asset = state.assetIndex.byId[assetId];
  if (!asset) {
    return state;
  }

  return createDefaultState({
    ...state,
    assetIndex: {
      ...state.assetIndex,
      byId: {
        ...state.assetIndex.byId,
        [assetId]: {
          ...asset,
          lastAccess: new Date().toISOString(),
        },
      },
    },
  });
};

const installAssetRecord = (state, assetId) => {
  const asset = state.assetIndex.byId[assetId];
  if (!asset) {
    return {
      state,
      changed: false,
      warning: "Asset was not found.",
    };
  }

  const nextState = createDefaultState({
    ...state,
    assetIndex: {
      ...state.assetIndex,
      byId: {
        ...state.assetIndex.byId,
        [assetId]: {
          ...asset,
          installed: true,
          lastAccess: new Date().toISOString(),
        },
      },
    },
  });

  return {
    state: nextState,
    changed: !asset.installed,
    warning: null,
  };
};

const deleteAssetRecord = (state, assetId) => {
  const asset = state.assetIndex.byId[assetId];
  if (!asset) {
    return {
      state,
      changed: false,
      warning: "Asset was not found.",
    };
  }

  if (asset.essential) {
    return {
      state,
      changed: false,
      warning: "Essential fallback assets cannot be removed.",
    };
  }

  return {
    state: createDefaultState({
      ...state,
      assetIndex: {
        ...state.assetIndex,
        byId: {
          ...state.assetIndex.byId,
          [assetId]: {
            ...asset,
            installed: false,
          },
        },
      },
    }),
    changed: asset.installed,
    warning: null,
  };
};

const listInstalledAssets = (state) =>
  Object.values(state.assetIndex.byId).filter((asset) => asset.installed);

const estimateInstalledAssetBytes = (state) =>
  listInstalledAssets(state).reduce((sum, asset) => sum + (asset.bytes ?? 0), 0);

const evictNonEssentialAssets = (state) => {
  const removableAssets = Object.values(state.assetIndex.byId)
    .filter((asset) => asset.installed && !asset.essential)
    .sort((left, right) => String(left.lastAccess).localeCompare(String(right.lastAccess)));

  let nextState = state;
  let evicted = 0;
  for (const asset of removableAssets) {
    const result = deleteAssetRecord(nextState, asset.id);
    nextState = result.state;
    if (result.changed) {
      evicted += 1;
    }
  }

  return {
    state: nextState,
    evicted,
  };
};

const updateQuotaEstimate = (state, estimate) =>
  createDefaultState({
    ...state,
    assetIndex: {
      ...state.assetIndex,
      quotaEstimate: estimate,
    },
  });

const estimateStorage = async (runtime) => {
  if (!runtime?.navigator?.storage?.estimate) {
    return null;
  }

  const result = await runtime.navigator.storage.estimate();
  return {
    quota: result.quota ?? null,
    usage: result.usage ?? null,
  };
};

const getAssetInstallPlan = (state) => {
  const pending = Object.values(state.assetIndex.byId).filter((asset) => !asset.installed);
  return {
    assets: pending,
    totalBytes: pending.reduce((sum, asset) => sum + (asset.bytes ?? 0), 0),
  };
};

const buildLearnerSummary = (state) => {
  const masteredConcepts = Object.values(state.pedagogicalState.masteryByConcept ?? {}).filter(
    (record) => (record?.score ?? 0) >= 1,
  ).length;

  return truncateText(
    `Locale ${state.learnerProfile.locale}. Module ${state.moduleSelection.selectedModuleId}. ` +
      `Diagnostic ${state.pedagogicalState.diagnosticStatus}. ` +
      `Current concept ${state.pedagogicalState.currentConceptId ?? "variables-and-expressions"}. ` +
      `Mastered ${masteredConcepts} concepts.`,
    180,
  );
};

const buildRuntimeSummary = (state) =>
  state.runtimeSession.recentTurns.length > 0
    ? truncateText(
        state.runtimeSession.recentTurns
          .slice(-4)
          .map((turn) => truncateText(String(turn.content), 48))
          .join(" | "),
        220,
      )
    : null;

const createRequestId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const buildDirectorRequest = (state, decision, latestInput) => ({
  requestId: createRequestId("director"),
  learnerSummary: buildLearnerSummary(state),
  runtimeSummary: buildRuntimeSummary(state),
  latestInput,
  hardConstraints: {
    activeDomain: decision.activeDomain,
    moduleId: decision.moduleId,
    conceptId: decision.conceptId,
    phase: decision.phase,
    objectiveId: decision.objectiveId,
    allowedSceneKinds: decision.allowedSceneKinds,
    allowedInteractionTypes: decision.allowedInteractionTypes,
    maxNarrationChars: decision.maxNarrationChars,
    imageGenerationAllowed: APP_CONFIG.features.cloudImage && state.consentAndSettings.cloudImageEnabled,
    locale: state.learnerProfile.locale,
  },
});

const createMockDirectorResponse = (request, localScene) => {
  const contentType = request.latestInput.type;
  const blueprint = {
    ...localScene,
    scene: {
      ...localScene.scene,
      tone: contentType === "transcript" ? "encouraging" : localScene.scene.tone,
    },
    narration: {
      ...localScene.narration,
      text:
        contentType === "transcript"
          ? "I heard you. Let's keep going with one clear algebra step."
          : localScene.narration.text,
    },
    visualIntent: {
      ...(localScene.visualIntent ?? { type: "recipe", recipeId: "neutral_choice_board", vars: {} }),
      recipeId: localScene.interaction?.type === "trace-symbol" ? "symbol_trace_board" : "neutral_choice_board",
    },
  };

  return { blueprint };
};

const withTimeout = async (promiseFactory, timeoutMs, timeoutCode) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promiseFactory(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const requestDirectorScene = async ({ state, decision, latestInput, localScene, fetchImpl = fetch }) => {
  const request = buildDirectorRequest(state, decision, latestInput);
  const requestValidation = validateDirectorRequest(request);
  if (!requestValidation.ok) {
    return {
      ok: false,
      error: createStableError("director_request_invalid", "Director request validation failed.", requestValidation.errors),
    };
  }

  const relayBaseUrl = getRelayBaseUrl();
  if (!relayBaseUrl) {
    return {
      ok: false,
      error: createStableError("relay_unavailable", "Relay is not configured."),
    };
  }

  try {
    const response = await withTimeout(
      async () =>
        relayBaseUrl === "mock"
          ? createMockDirectorResponse(request, localScene)
          : fetchImpl(`${relayBaseUrl}/director`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(request),
            }).then(async (res) => {
              if (!res.ok) {
                throw new Error(`relay-${res.status}`);
              }
              return res.json();
            }),
      DIRECTOR_TIMEOUT_MS,
      "relay-timeout",
    );

    const validation = validateDirectorResponse(response, request.hardConstraints);
    if (!validation.ok) {
      return {
        ok: false,
        error: createStableError("director_response_invalid", "Director response validation failed.", validation.errors),
      };
    }

    return {
      ok: true,
      blueprint: response.blueprint,
    };
  } catch (error) {
    return {
      ok: false,
      error: createStableError("relay_request_failed", "Relay request failed.", String(error)),
    };
  }
};

const buildImageRequest = (scene) => ({
  requestId: createRequestId("image"),
  recipeId: scene?.visualIntent?.recipeId ?? "ambient_safe_path",
  vars: scene?.visualIntent?.vars ?? {},
  cacheKey: `${scene?.scene?.objectiveId ?? "scene"}:${scene?.visualIntent?.recipeId ?? "ambient_safe_path"}`,
});

const queueImageGeneration = async ({ scene, fetchImpl = fetch }) => {
  const relayBaseUrl = getRelayBaseUrl();
  if (!relayBaseUrl) {
    return {
      ok: false,
      error: createStableError("relay_unavailable", "Relay is not configured."),
    };
  }

  const request = buildImageRequest(scene);
  try {
    const response = await withTimeout(
      async () =>
        relayBaseUrl === "mock"
          ? { status: "queued", cacheKey: request.cacheKey, jobId: createRequestId("image-job") }
          : fetchImpl(`${relayBaseUrl}/image`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(request),
            }).then(async (res) => {
              if (!res.ok) {
                throw new Error(`image-${res.status}`);
              }
              return res.json();
            }),
      IMAGE_TIMEOUT_MS,
      "image-timeout",
    );

    return {
      ok: true,
      response,
    };
  } catch (error) {
    return {
      ok: false,
      error: createStableError("image_request_failed", "Image request failed.", String(error)),
    };
  }
};

const scoreTrace = (points, bounds) => {
  if (!Array.isArray(points) || points.length < 6 || !bounds) {
    return {
      success: false,
      confidence: 0.2,
      ambiguous: false,
    };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const widthScore = Math.min(1, width / Math.max(1, bounds.width * 0.18));
  const heightScore = Math.min(1, height / Math.max(1, bounds.height * 0.28));
  const densityScore = Math.min(1, points.length / 28);
  const confidence = Number(((widthScore + heightScore + densityScore) / 3).toFixed(2));

  return {
    success: confidence >= 0.72,
    confidence,
    ambiguous: confidence >= 0.45 && confidence < 0.72,
  };
};

const getMathFeedbackMessage = (validation, conceptId = "algebra") => {
  if (validation.correct) {
    return validation.mode === "numeric"
      ? "That answer checks out numerically."
      : "That expression is equivalent to the expected result.";
  }

  if (validation.reason === "syntax") {
    return "The response could not be parsed as safe algebra. Check symbols, operators, and equation format.";
  }

  if (validation.reason === "equation-form") {
    return "Keep the equality sign and isolate the value or expression you want to show.";
  }

  const conceptMessages = {
    "variables-and-expressions": "Focus on what the variable stands for before combining anything.",
    "evaluate-expressions": "Substitute the given value first, then simplify in order.",
    "one-step-addition-equations": "Undo the addition with the inverse operation, then check the result.",
    "two-step-equations": "Reverse the operations one step at a time instead of jumping straight to the answer.",
  };

  return conceptMessages[conceptId] ?? "Try the next step more carefully and check each operation.";
};

const classifyConceptualMathError = (inputRhs, expectedRhs) => {
  if (inputRhs.includes("=") || expectedRhs.includes("=")) {
    return "equation-form";
  }

  return "conceptual";
};

const validateMathInputResponse = (input, expectedExpression, conceptId = null) => {
  const normalizedInput = String(input ?? "").trim();
  const normalizedExpected = String(expectedExpression ?? "").trim();
  const safePattern = /^[0-9xX+\-*/().\s=]+$/;

  if (!normalizedInput || !safePattern.test(normalizedInput)) {
    return {
      correct: false,
      reason: "syntax",
      feedback: getMathFeedbackMessage({ correct: false, reason: "syntax" }, conceptId ?? "algebra"),
    };
  }

  const inputRhs = normalizedInput.includes("=") ? normalizedInput.split("=").pop().trim() : normalizedInput;
  const expectedRhs = normalizedExpected.includes("=")
    ? normalizedExpected.split("=").pop().trim()
    : normalizedExpected;

  const asNumber = Number(inputRhs);
  const expectedNumber = Number(expectedRhs);
  if (Number.isFinite(asNumber) && Number.isFinite(expectedNumber)) {
    const correct = Math.abs(asNumber - expectedNumber) <= 1e-6;
    const reason = correct ? "numeric" : classifyConceptualMathError(inputRhs, expectedRhs);
    return {
      correct,
      reason,
      mode: "numeric",
      feedback: getMathFeedbackMessage({ correct, reason, mode: "numeric" }, conceptId ?? "algebra"),
    };
  }

  try {
    const toEvaluator = (expr) => Function("x", `"use strict"; return (${expr});`);
    const leftEval = toEvaluator(inputRhs);
    const rightEval = toEvaluator(expectedRhs);
    const checkpoints = [-3, -1, 0, 1, 2, 4];
    const equivalent = checkpoints.every((x) => {
      const left = leftEval(x);
      const right = rightEval(x);
      return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 1e-6;
    });
    const reason = equivalent ? "expression" : classifyConceptualMathError(inputRhs, expectedRhs);
    return {
      correct: equivalent,
      reason,
      mode: "expression",
      feedback: getMathFeedbackMessage({ correct: equivalent, reason, mode: "expression" }, conceptId ?? "algebra"),
    };
  } catch {
    return {
      correct: false,
      reason: "syntax",
      feedback: getMathFeedbackMessage({ correct: false, reason: "syntax" }, conceptId ?? "algebra"),
    };
  }
};

const validateShortTextResponse = (input, expectedResponse) => {
  const normalizedInput = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const normalizedExpected = String(expectedResponse ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalizedInput) {
    return {
      correct: false,
      reason: "empty",
      feedback: "Enter a short answer before continuing.",
    };
  }

  const correct =
    normalizedInput === normalizedExpected ||
    normalizedInput.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedInput);

  return {
    correct,
    reason: correct ? "short-text" : "conceptual",
    feedback: correct
      ? "That short response matches the expected idea."
      : "That response does not match the expected idea yet. Re-read the key operation or check.",
  };
};

const requestVisionInterpretation = async ({ traceDataUrl, decision, target, fetchImpl = fetch }) => {
  const relayBaseUrl = getRelayBaseUrl();
  if (!relayBaseUrl) {
    return {
      ok: false,
      error: createStableError("relay_unavailable", "Relay is not configured."),
    };
  }

  const request = {
    requestId: createRequestId("vision"),
    imageBase64: traceDataUrl.split(",")[1] ?? "",
    task: "complex-symbol-check",
    context: {
      target,
      learnerStage: decision.phase === "diagnostic" ? 0 : 1,
      domain: decision.activeDomain,
    },
  };

  try {
    const response = await withTimeout(
      async () =>
        relayBaseUrl === "mock"
          ? {
              success: true,
              confidence: 0.78,
              feedbackAudio: `That ${target} looks steady.`,
              evidence: { observedSkill: "symbol-trace", confidenceHint: 0.78 },
            }
          : fetchImpl(`${relayBaseUrl}/vision`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(request),
            }).then(async (res) => {
              if (!res.ok) {
                throw new Error(`vision-${res.status}`);
              }
              return res.json();
            }),
      VISION_TIMEOUT_MS,
      "vision-timeout",
    );

    return {
      ok: true,
      response,
    };
  } catch (error) {
    return {
      ok: false,
      error: createStableError("vision_request_failed", "Vision request failed.", String(error)),
    };
  }
};

const recoverSceneForRuntime = (scene, runtimeState, decision = null) => {
  if (!scene) {
    return null;
  }

  const normalizedScene = normalizeSceneForRuntime(scene, runtimeState);
  const validation = validateSceneBlueprint(normalizedScene, decision);
  return validation.ok ? normalizedScene : createFallbackScene("recovery");
};

export {
  ALGEBRA_CONCEPT_GRAPH,
  APP_CONFIG,
  ASSET_MANIFEST_VERSION,
  advanceAssessment,
  advanceTutoringSession,
  appendRecentTurn,
  applyMasteryEvidence,
  buildDirectorRequest,
  clearAdminPin,
  createExportBundle,
  createDefaultLearnerState,
  createDefaultState,
  createFallbackScene,
  createStableError,
  createTapChoiceFallbackScene,
  decryptBackupPayload,
  deleteAssetRecord,
  detectCapabilities,
  DIRECTOR_TIMEOUT_MS,
  ENCRYPTION_AES_GCM,
  ENCRYPTION_LEGACY_XOR,
  encryptBackupPayload,
  estimateInstalledAssetBytes,
  estimateStorage,
  evictNonEssentialAssets,
  EXPORT_FORMAT_VERSION,
  getAssetInstallPlan,
  getBuiltInAssetManifest,
  getLessonForConcept,
  hashAdminPin,
  hydrateAssetIndex,
  installAssetRecord,
  interpretScene,
  listInstalledAssets,
  lockAdmin,
  migrateState,
  nextCurriculumDecision,
  normalizeSceneForRuntime,
  parseImportBundle,
  queueImageGeneration,
  recoverSceneForRuntime,
  requestDirectorScene,
  requestVisionInterpretation,
  resetLearnerState,
  scoreTrace,
  setActiveScene,
  setAdminPin,
  unlockAdmin,
  updateAssetAccess,
  updateConsentSettings,
  updateQuotaEstimate,
  getMathFeedbackMessage,
  validateShortTextResponse,
  validateDirectorRequest,
  validateDirectorResponse,
  validateMathInputResponse,
  verifyAdminPin,
};
