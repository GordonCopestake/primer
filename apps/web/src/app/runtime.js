const env = typeof process === "undefined" ? {} : process.env;
const DIRECTOR_TIMEOUT_MS = 3_500;
const IMAGE_TIMEOUT_MS = 2_500;
const VISION_TIMEOUT_MS = 2_500;

const APP_CONFIG = {
  appMode: env.PRIMER_APP_MODE ?? "development",
  cloudMode: env.PRIMER_CLOUD_MODE ?? "required",
  relayBaseUrl: env.PRIMER_RELAY_BASE_URL ?? "",
  capabilityMode: env.PRIMER_CAPABILITY_MODE ?? "auto",
  features: {
    cloudDirector: env.FEATURE_CLOUD_DIRECTOR !== "false",
    cloudImage: env.FEATURE_CLOUD_IMAGE !== "false",
    cloudVision: env.FEATURE_CLOUD_VISION === "true",
    exportImport: env.FEATURE_EXPORT_IMPORT !== "false",
    encryptedExport: env.FEATURE_ENCRYPTED_EXPORT === "true",
    debugTools: env.FEATURE_DEBUG_TOOLS === "true",
  },
};

const SCHEMA_VERSION = 1;
const V1_INTERACTIONS = ["none", "tap-choice", "repeat-sound", "trace-symbol"];
const V1_SCENE_KINDS = ["assessment", "lesson", "practice", "review", "reward", "fallback"];
const VALID_TRANSITIONS = new Set(["fade", "slide", "pan"]);
const VALID_TONES = new Set(["calm", "encouraging", "celebratory", "focused", "curious"]);
const SAFE_RECIPE_IDS = new Set(["ambient_safe_path", "neutral_choice_board", "symbol_trace_board"]);
const ASSET_MANIFEST_VERSION = 1;

const masteryBucket = () => ({
  phonemes: {},
  graphemes: {},
  vocabularyThemes: {},
  numeracyConcepts: {},
  mathConcepts: {},
  scienceConcepts: {},
});

const createStateShape = (overrides = {}) => ({
  schemaVersion: SCHEMA_VERSION,
  learnerProfile: {
    learnerId: "local-learner",
    locale: "en-GB",
    interests: [],
    avatarSeed: null,
    preferredModalities: ["audio", "visual", "interactive"],
    ...overrides.learnerProfile,
  },
  pedagogicalState: {
    literacyStage: 0,
    assessmentStep: 0,
    domainStage: {
      reading: 0,
      writing: 0,
      numeracy: 0,
      mathematics: 0,
      science: 0,
      physics: 0,
    },
    currentObjectiveId: "baseline.observe-sound.0",
    assessmentStatus: "not-started",
    mastery: masteryBucket(),
    ...overrides.pedagogicalState,
  },
  runtimeSession: {
    activeSceneId: null,
    lastScene: null,
    recentTurns: [],
    runningSummary: null,
    pendingAssetJobs: [],
    ...overrides.runtimeSession,
  },
  consentAndSettings: {
    cloudEnabled: true,
    cloudImageEnabled: true,
    cloudVisionEnabled: false,
    adminPinEnabled: false,
    adminPinHash: null,
    adminUnlocked: false,
    captionsEnabled: true,
    soundEnabled: true,
    storagePersistenceGranted: "unknown",
    ...overrides.consentAndSettings,
  },
  capabilities: {
    tier: "minimal",
    webgpu: false,
    opfs: false,
    indexedDb: true,
    localTTS: true,
    localSTT: false,
    microphone: false,
    ...overrides.capabilities,
  },
  assetIndex: {
    manifestVersion: ASSET_MANIFEST_VERSION,
    byId: {},
    quotaEstimate: null,
    ...overrides.assetIndex,
  },
});

const lessonKinds = ["lesson", "practice", "review", "reward", "fallback"];

const assessmentSequence = [
  {
    objectiveId: "baseline.observe-sound.0",
    activeDomain: "preliteracy",
    literacyStage: 0,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "repeat-sound", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 90,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.symbol-match.1",
    activeDomain: "preliteracy",
    literacyStage: 1,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "trace-symbol", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 96,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.trace-letter.2",
    activeDomain: "writing",
    literacyStage: 2,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["trace-symbol", "tap-choice", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 104,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.read-short.3",
    activeDomain: "reading",
    literacyStage: 3,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "repeat-sound", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 120,
    maxPromptComplexity: 2,
  },
];

const readingDecision = (stage = 1) => ({
  objectiveId: `reading.symbol-match.${stage}`,
  activeDomain: "reading",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["tap-choice", "trace-symbol", "repeat-sound", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
});

const writingDecision = (stage = 1) => ({
  objectiveId: `writing.trace-and-build.${stage}`,
  activeDomain: "writing",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["trace-symbol", "tap-choice", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 110,
  maxPromptComplexity: 2,
});

const numeracyDecision = (stage = 1) => ({
  objectiveId: `numeracy.more-less.${stage}`,
  activeDomain: "numeracy",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["tap-choice", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
});

const getMasteryScore = (state, domain) => state.pedagogicalState.domainStage[domain] ?? 0;

const nextCurriculumDecision = (state) => {
  if (state.pedagogicalState.assessmentStatus !== "complete") {
    const step = Math.max(
      0,
      Math.min(state.pedagogicalState.assessmentStep ?? 0, assessmentSequence.length - 1),
    );
    return assessmentSequence[step];
  }

  const readingScore = getMasteryScore(state, "reading");
  const writingScore = getMasteryScore(state, "writing");
  const numeracyScore = getMasteryScore(state, "numeracy");
  const currentObjectiveId = state.pedagogicalState.currentObjectiveId ?? "";

  if (currentObjectiveId.startsWith("reading.") && readingScore <= Math.max(writingScore, numeracyScore)) {
    return readingDecision(Math.max(1, readingScore));
  }

  if (readingScore <= writingScore && readingScore <= numeracyScore) {
    return readingDecision(Math.max(1, readingScore));
  }

  if (writingScore <= numeracyScore) {
    return writingDecision(Math.max(1, writingScore));
  }

  return numeracyDecision(Math.max(1, numeracyScore));
};

const createDefaultState = (overrides = {}) => createStateShape(overrides);

const migrateState = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return createDefaultState();
  }

  return createDefaultState(rawState);
};

const appendRecentTurn = (state, turn) => {
  const recentTurns = [...state.runtimeSession.recentTurns, turn].slice(-8);
  return createDefaultState({
    ...state,
    runtimeSession: {
      ...state.runtimeSession,
      recentTurns,
    },
  });
};

const setActiveScene = (state, scene) =>
  createDefaultState({
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      currentObjectiveId: scene?.scene?.objectiveId ?? state.pedagogicalState.currentObjectiveId,
    },
    runtimeSession: {
      ...state.runtimeSession,
      activeSceneId: scene?.scene?.id ?? null,
      lastScene: scene ?? null,
    },
  });

const updateConsentSettings = (state, updates) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      ...updates,
    },
  });

const recordAssessmentCompletion = (state, literacyStage = 1) => ({
  ...state,
  pedagogicalState: {
    ...state.pedagogicalState,
    assessmentStep: assessmentSequence.length,
    assessmentStatus: "complete",
    literacyStage,
    currentObjectiveId: readingDecision(Math.max(1, literacyStage)).objectiveId,
    domainStage: {
      ...state.pedagogicalState.domainStage,
      reading: Math.max(state.pedagogicalState.domainStage.reading, literacyStage),
      writing: Math.max(state.pedagogicalState.domainStage.writing, literacyStage - 1),
      numeracy: Math.max(state.pedagogicalState.domainStage.numeracy, Math.min(2, literacyStage)),
    },
  },
});

const advanceAssessment = (state, demonstratedStage = null) => {
  const currentStep = state.pedagogicalState.assessmentStep ?? 0;
  const inferredStage = demonstratedStage ?? currentStep;
  const nextStep = currentStep + 1;

  if (nextStep >= assessmentSequence.length) {
    return recordAssessmentCompletion(state, Math.max(0, Math.min(3, inferredStage)));
  }

  return {
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      assessmentStatus: "in-progress",
      assessmentStep: nextStep,
      literacyStage: Math.max(state.pedagogicalState.literacyStage, inferredStage),
      currentObjectiveId: assessmentSequence[nextStep].objectiveId,
    },
  };
};

const applyMasteryEvidence = (state, domain, delta = 1) => ({
  ...state,
  pedagogicalState: {
    ...state.pedagogicalState,
    domainStage: {
      ...state.pedagogicalState.domainStage,
      [domain]: Math.max(0, (state.pedagogicalState.domainStage[domain] ?? 0) + delta),
    },
  },
});

const createFallbackScene = (reason = "unknown") => ({
  version: 1,
  scene: {
    id: `fallback.${reason}`,
    kind: "fallback",
    objectiveId: "fallback.safe-path",
    transition: "fade",
    tone: "calm",
  },
  narration: {
    text: "Let’s continue another way.",
    maxChars: 64,
    estDurationMs: 1800,
    bargeInAllowed: true,
  },
  visualIntent: {
    type: "recipe",
    recipeId: "ambient_safe_path",
    vars: {
      palette: "sand-and-sky",
    },
  },
  interaction: {
    type: "none",
  },
  evidence: {
    observedSkill: "fallback-recovery",
    confidenceHint: 1,
  },
});

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

const createStableError = (code, message, details = null) => ({
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

const truncateText = (text, maxChars) => {
  if (typeof text !== "string") {
    return "";
  }

  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 1))}…` : text;
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
      adminPinEnabled: state.consentAndSettings.adminPinEnabled,
      adminPinHash: state.consentAndSettings.adminPinHash,
      adminUnlocked: false,
      storagePersistenceGranted: state.consentAndSettings.storagePersistenceGranted,
      captionsEnabled: state.consentAndSettings.captionsEnabled,
      soundEnabled: state.consentAndSettings.soundEnabled,
    },
    assetIndex: state.assetIndex,
  });
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

const encodeBase64 = (text) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(text, "utf8").toString("base64");
  }

  return globalThis.btoa(unescape(encodeURIComponent(text)));
};

const decodeBase64 = (text) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(text, "base64").toString("utf8");
  }

  return decodeURIComponent(escape(globalThis.atob(text)));
};

const encryptBackupPayload = (jsonText, passphrase) =>
  JSON.stringify({
    encryption: "primer-xor-v1",
    payload: encodeBase64(
      jsonText
        .split("")
        .map((character, index) =>
          String.fromCharCode(character.charCodeAt(0) ^ passphrase.charCodeAt(index % passphrase.length)),
        )
        .join(""),
    ),
  });

const decryptBackupPayload = (encodedText, passphrase) => {
  const parsed = JSON.parse(encodedText);
  if (parsed.encryption !== "primer-xor-v1" || typeof parsed.payload !== "string") {
    throw new Error("Backup is not encrypted with the supported format.");
  }

  const decoded = decodeBase64(parsed.payload);
  return decoded
    .split("")
    .map((character, index) =>
      String.fromCharCode(character.charCodeAt(0) ^ passphrase.charCodeAt(index % passphrase.length)),
    )
    .join("");
};

const checksumFor = (seed) => {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `ck-${hash.toString(16).padStart(8, "0")}`;
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
    manifest["starter-phoneme-pack"] = createAssetRecord({
      id: "starter-phoneme-pack",
      kind: "lesson-assets",
      storage: capabilities.opfs ? "opfs" : "idb",
      version: "1.0.0",
      bytes: 220_000,
      installed: false,
      label: "Starter phoneme pack",
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

const toConstraintDecision = (hardConstraints) => ({
  activeDomain: hardConstraints.activeDomain,
  literacyStage: hardConstraints.literacyStage,
  objectiveId: hardConstraints.objectiveId,
  allowedSceneKinds: hardConstraints.allowedSceneKinds,
  allowedInteractionTypes: hardConstraints.allowedInteractionTypes,
  maxNarrationChars: hardConstraints.maxNarrationChars,
});

const validateSceneBlueprint = (blueprint, decision = null) => {
  const errors = [];

  if (!blueprint || blueprint.version !== 1) {
    errors.push("Scene version must be 1.");
  }

  if (!blueprint?.scene?.id) {
    errors.push("Scene id is required.");
  }

  if (!V1_SCENE_KINDS.includes(blueprint?.scene?.kind)) {
    errors.push("Unsupported scene kind.");
  }

  if (!VALID_TRANSITIONS.has(blueprint?.scene?.transition)) {
    errors.push("Unsupported transition.");
  }

  if (!VALID_TONES.has(blueprint?.scene?.tone)) {
    errors.push("Unsupported tone.");
  }

  if (typeof blueprint?.narration?.text !== "string" || blueprint.narration.text.length === 0) {
    errors.push("Narration text is required.");
  }

  if (typeof blueprint?.narration?.maxChars !== "number") {
    errors.push("Narration budget is required.");
  }

  if (blueprint?.narration?.text?.length > blueprint?.narration?.maxChars) {
    errors.push("Narration exceeds scene budget.");
  }

  const interactionType = blueprint?.interaction?.type;
  if (!V1_INTERACTIONS.includes(interactionType)) {
    errors.push("Unsupported interaction type.");
  }

  if (interactionType === "tap-choice") {
    const options = blueprint?.interaction?.options;
    if (!Array.isArray(options) || options.length === 0 || options.length > 4) {
      errors.push("Tap choice must contain one to four options.");
    }
  }

  if (interactionType === "trace-symbol" && !blueprint?.interaction?.target) {
    errors.push("Trace symbol scenes require a target.");
  }

  if (interactionType === "repeat-sound" && !blueprint?.interaction?.phoneme) {
    errors.push("Repeat sound scenes require a phoneme.");
  }

  const narrationText = blueprint?.narration?.text ?? "";
  if (/[<>]/.test(narrationText)) {
    errors.push("Raw HTML is not allowed.");
  }

  if (decision) {
    if (blueprint?.scene?.objectiveId !== decision.objectiveId) {
      errors.push("Scene objective is outside curriculum constraints.");
    }

    if (!decision.allowedSceneKinds.includes(blueprint?.scene?.kind)) {
      errors.push("Scene kind is outside curriculum constraints.");
    }

    if (!decision.allowedInteractionTypes.includes(interactionType)) {
      errors.push("Interaction type is outside curriculum constraints.");
    }

    if (narrationText.length > decision.maxNarrationChars) {
      errors.push("Narration exceeds curriculum budget.");
    }
  }

  if (blueprint?.visualIntent?.recipeId && !SAFE_RECIPE_IDS.has(blueprint.visualIntent.recipeId)) {
    errors.push("Visual recipe is not allowed.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};

const interpretScene = (blueprint, decision) => {
  const validation = validateSceneBlueprint(blueprint, decision);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      blueprint: createFallbackScene("validation-failure"),
    };
  }

  return {
    ok: true,
    errors: [],
    blueprint,
  };
};

const hasIndexedDb = (runtime) => Boolean(runtime?.indexedDB);
const hasOpfs = (runtime) => Boolean(runtime?.navigator?.storage?.getDirectory);
const hasSpeechSynthesis = (runtime) => Boolean(runtime?.speechSynthesis);
const hasSpeechRecognition = (runtime) =>
  Boolean(runtime?.SpeechRecognition || runtime?.webkitSpeechRecognition);
const hasMicrophone = (runtime) => Boolean(runtime?.navigator?.mediaDevices?.getUserMedia);
const hasWebGpu = (runtime) => Boolean(runtime?.navigator?.gpu);

const detectCapabilities = (runtime) => {
  const indexedDb = hasIndexedDb(runtime);
  const opfs = hasOpfs(runtime);
  const localTTS = hasSpeechSynthesis(runtime);
  const localSTT = hasSpeechRecognition(runtime);
  const microphone = hasMicrophone(runtime);
  const webgpu = hasWebGpu(runtime);

  let tier = "minimal";
  if (indexedDb && localTTS && (localSTT || microphone)) {
    tier = "standard-local";
  }
  if (tier === "standard-local" && webgpu && opfs) {
    tier = "accelerated-local";
  }

  return {
    tier,
    webgpu,
    opfs,
    indexedDb,
    localTTS,
    localSTT,
    microphone,
  };
};

const buildLearnerSummary = (state) =>
  truncateText(
    `Locale ${state.learnerProfile.locale}. Literacy stage ${state.pedagogicalState.literacyStage}. ` +
      `Reading ${state.pedagogicalState.domainStage.reading}, writing ${state.pedagogicalState.domainStage.writing}, ` +
      `numeracy ${state.pedagogicalState.domainStage.numeracy}.`,
    180,
  );

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
    literacyStage: decision.literacyStage,
    objectiveId: decision.objectiveId,
    allowedSceneKinds: decision.allowedSceneKinds,
    allowedInteractionTypes: decision.allowedInteractionTypes,
    maxNarrationChars: decision.maxNarrationChars,
    imageGenerationAllowed: APP_CONFIG.features.cloudImage && state.consentAndSettings.cloudImageEnabled,
    locale: state.learnerProfile.locale,
  },
});

const validateDirectorRequest = (request) => {
  const errors = [];
  const allowedInputTypes = new Set(["transcript", "tap-choice", "trace-result", "system-start"]);
  if (!request?.requestId) {
    errors.push("requestId is required.");
  }
  if (typeof request?.learnerSummary !== "string" || request.learnerSummary.length === 0) {
    errors.push("learnerSummary is required.");
  }
  if (!request?.latestInput?.type || typeof request?.latestInput?.content !== "string") {
    errors.push("latestInput is required.");
  }
  if (request?.latestInput?.type && !allowedInputTypes.has(request.latestInput.type)) {
    errors.push("latestInput.type must be a supported bounded input type.");
  }
  if (!request?.hardConstraints?.activeDomain || !request?.hardConstraints?.objectiveId) {
    errors.push("hardConstraints are required.");
  }
  if (!Array.isArray(request?.hardConstraints?.allowedSceneKinds)) {
    errors.push("allowedSceneKinds are required.");
  }
  if (!Array.isArray(request?.hardConstraints?.allowedInteractionTypes)) {
    errors.push("allowedInteractionTypes are required.");
  }
  return {
    ok: errors.length === 0,
    errors,
  };
};

const validateDirectorResponse = (response, hardConstraints) => {
  if (!response || typeof response !== "object" || !response.blueprint) {
    return {
      ok: false,
      errors: ["Response must include blueprint."],
    };
  }

  return validateSceneBlueprint(response.blueprint, toConstraintDecision(hardConstraints));
};

const createMockDirectorResponse = (request, localScene) => {
  const contentType = request.latestInput.type;
  const mood = contentType === "transcript" ? "encouraging" : "curious";
  const blueprint = {
    ...localScene,
    scene: {
      ...localScene.scene,
      tone: mood,
    },
    narration: {
      ...localScene.narration,
      text:
        contentType === "transcript"
          ? "I heard you. Let’s keep going with one clear step."
          : localScene.narration.text,
    },
    visualIntent: {
      ...(localScene.visualIntent ?? { type: "recipe", recipeId: "neutral_choice_board", vars: {} }),
      recipeId:
        localScene.interaction?.type === "trace-symbol" ? "symbol_trace_board" : "neutral_choice_board",
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

  const relayBaseUrl = APP_CONFIG.relayBaseUrl?.trim();
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
  const relayBaseUrl = APP_CONFIG.relayBaseUrl?.trim();
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

const requestVisionInterpretation = async ({ traceDataUrl, decision, target, fetchImpl = fetch }) => {
  const relayBaseUrl = APP_CONFIG.relayBaseUrl?.trim();
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
      learnerStage: decision.literacyStage,
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
  APP_CONFIG,
  ASSET_MANIFEST_VERSION,
  advanceAssessment,
  appendRecentTurn,
  buildDirectorRequest,
  clearAdminPin,
  createStableError,
  applyMasteryEvidence,
  createDefaultState,
  createDefaultLearnerState,
  deleteAssetRecord,
  decryptBackupPayload,
  estimateInstalledAssetBytes,
  estimateStorage,
  encryptBackupPayload,
  evictNonEssentialAssets,
  createFallbackScene,
  createTapChoiceFallbackScene,
  DIRECTOR_TIMEOUT_MS,
  detectCapabilities,
  getAssetInstallPlan,
  getBuiltInAssetManifest,
  hashAdminPin,
  hydrateAssetIndex,
  installAssetRecord,
  interpretScene,
  lockAdmin,
  listInstalledAssets,
  migrateState,
  nextCurriculumDecision,
  queueImageGeneration,
  recoverSceneForRuntime,
  resetLearnerState,
  requestDirectorScene,
  requestVisionInterpretation,
  scoreTrace,
  setAdminPin,
  setActiveScene,
  normalizeSceneForRuntime,
  unlockAdmin,
  updateAssetAccess,
  updateQuotaEstimate,
  updateConsentSettings,
  validateDirectorRequest,
  validateDirectorResponse,
  verifyAdminPin,
};
