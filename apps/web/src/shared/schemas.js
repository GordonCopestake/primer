export const SCHEMA_VERSION = 2;

export const createMasteryRecord = (overrides = {}) => ({
  score: 0,
  status: "available",
  attempts: 0,
  lastPracticedAt: null,
  reviewDueAt: null,
  ...overrides,
});

export const createStateShape = (overrides = {}) => ({
  schemaVersion: SCHEMA_VERSION,
  learnerProfile: {
    learnerId: "local-learner",
    locale: "en-GB",
    interests: [],
    avatarSeed: null,
    preferredModalities: ["audio", "visual", "interactive"],
    ...overrides.learnerProfile,
  },
  moduleSelection: {
    selectedModuleId: "algebra-foundations",
    availableModuleIds: ["algebra-foundations"],
    selectedAt: null,
    ...overrides.moduleSelection,
  },
  pedagogicalState: {
    diagnosticStatus: "not-started",
    diagnosticStep: 0,
    readiness: "unknown",
    prerequisiteGaps: [],
    likelyMisconceptions: [],
    diagnosticSummary: null,
    currentConceptId: "variables-and-expressions",
    currentLessonId: null,
    currentObjectiveId: "diagnostic.variables",
    recommendedConceptId: "variables-and-expressions",
    masteryByConcept: {},
    misconceptionsByConcept: {},
    evidenceLog: [],
    reviewSchedule: [],
    recentActivity: [],
    lessonRecords: {},
    assessmentItems: {},
    attemptLog: [],
    goals: [],
    milestones: [
      {
        id: "complete-diagnostic",
        label: "Complete the algebra diagnostic",
        status: "active",
      },
      {
        id: "master-first-concept",
        label: "Master your first algebra concept",
        status: "upcoming",
      },
    ],
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
    telemetryEnabled: false,
    adminPinEnabled: false,
    adminPinHash: null,
    adminUnlocked: false,
    captionsEnabled: true,
    soundEnabled: true,
    storagePersistenceGranted: "unknown",
    ...overrides.consentAndSettings,
  },
  providerConfig: {
    providerName: "openrouter",
    modelName: "",
    endpointUrl: "",
    apiKey: "",
    configuredAt: null,
    ...overrides.providerConfig,
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
    manifestVersion: 1,
    byId: {},
    quotaEstimate: null,
    ...overrides.assetIndex,
  },
  exportMetadata: {
    lastExportedAt: null,
    lastImportedAt: null,
    exportFormatVersion: 1,
    ...overrides.exportMetadata,
  },
});

export const SUPPORTED_SUBJECTS = ["mathematics"];
export const SUPPORTED_MODULE_IDS = ["algebra-foundations"];
export const CONCEPT_NODE_STATES = [
  "locked",
  "available",
  "in-progress",
  "mastered",
  "review-due",
  "recommended-next",
];

export const V1_INTERACTIONS = [
  "none",
  "tap-choice",
  "repeat-sound",
  "trace-symbol",
  "read-respond",
  "math-input",
];

export const V1_SCENE_KINDS = ["assessment", "lesson", "practice", "review", "fallback"];

const VALID_TRANSITIONS = new Set(["fade", "slide", "pan"]);
const VALID_TONES = new Set(["calm", "encouraging", "celebratory", "focused", "curious"]);
const SAFE_RECIPE_IDS = new Set(["ambient_safe_path", "neutral_choice_board", "symbol_trace_board"]);

export const validateSceneBlueprint = (blueprint, decision = null) => {
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

  if (interactionType === "read-respond") {
    if (!blueprint?.interaction?.prompt || typeof blueprint.interaction.prompt !== "string") {
      errors.push("Read/respond scenes require a prompt.");
    }
    if (
      !Array.isArray(blueprint?.interaction?.expectedKeywords) ||
      blueprint.interaction.expectedKeywords.length === 0
    ) {
      errors.push("Read/respond scenes require expected keywords.");
    }
  }

  if (interactionType === "math-input") {
    if (!blueprint?.interaction?.expressionPrompt || typeof blueprint.interaction.expressionPrompt !== "string") {
      errors.push("Math input scenes require an expression prompt.");
    }
    if (!blueprint?.interaction?.expectedExpression || typeof blueprint.interaction.expectedExpression !== "string") {
      errors.push("Math input scenes require an expected expression.");
    }
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

export const createStableError = (code, message, details = null) => ({
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

const ALLOWED_BOUNDED_INPUT_TYPES = new Set([
  "transcript",
  "tap-choice",
  "trace-result",
  "system-start",
  "math-input",
  "short-answer",
  "short-explanation",
]);

const validateBoundedTutorRequest = (request) => {
  const errors = [];

  if (!request?.requestId) {
    errors.push("requestId is required.");
  }
  if (typeof request?.learnerSummary !== "string" || request.learnerSummary.length === 0) {
    errors.push("learnerSummary is required.");
  }
  if (!request?.latestInput?.type || typeof request?.latestInput?.content !== "string") {
    errors.push("latestInput is required.");
  }
  if (request?.latestInput?.type && !ALLOWED_BOUNDED_INPUT_TYPES.has(request.latestInput.type)) {
    errors.push("latestInput.type must be a supported bounded input type.");
  }
  if (!request?.hardConstraints?.activeDomain || !request?.hardConstraints?.objectiveId) {
    errors.push("hardConstraints are required.");
  }
  if (
    request?.hardConstraints?.phase &&
    !["diagnostic", "tutoring", "review"].includes(request.hardConstraints.phase)
  ) {
    errors.push("hardConstraints.phase must be a supported tutor phase.");
  }
  if (
    request?.hardConstraints?.moduleId !== undefined &&
    typeof request.hardConstraints.moduleId !== "string"
  ) {
    errors.push("hardConstraints.moduleId must be a string when present.");
  }
  if (
    request?.hardConstraints?.conceptId !== undefined &&
    typeof request.hardConstraints.conceptId !== "string"
  ) {
    errors.push("hardConstraints.conceptId must be a string when present.");
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

export const validateDirectorRequest = validateBoundedTutorRequest;

export const validateTutorRequest = (request) => {
  const validation = validateBoundedTutorRequest(request);
  if (!validation.ok) {
    return validation;
  }

  if (!request?.hardConstraints?.moduleId) {
    validation.ok = false;
    validation.errors.push("hardConstraints.moduleId is required.");
  }

  if (!request?.hardConstraints?.conceptId) {
    validation.ok = false;
    validation.errors.push("hardConstraints.conceptId is required.");
  }

  return validation;
};

export const validateDirectorResponse = (response, hardConstraints) => {
  if (!response || typeof response !== "object" || !response.blueprint) {
    return {
      ok: false,
      errors: ["Response must include blueprint."],
    };
  }

  return validateSceneBlueprint(response.blueprint, {
    activeDomain: hardConstraints.activeDomain,
    literacyStage: hardConstraints.literacyStage,
    objectiveId: hardConstraints.objectiveId,
    allowedSceneKinds: hardConstraints.allowedSceneKinds,
    allowedInteractionTypes: hardConstraints.allowedInteractionTypes,
    maxNarrationChars: hardConstraints.maxNarrationChars,
  });
};

export const validateTutorResponse = validateDirectorResponse;

export const validateChatRequest = (request) => {
  const errors = [];

  if (!request?.requestId) {
    errors.push("requestId is required.");
  }
  if (typeof request?.learnerSummary !== "string" || request.learnerSummary.length === 0) {
    errors.push("learnerSummary is required.");
  }
  if (!request?.latestInput?.type || typeof request?.latestInput?.content !== "string") {
    errors.push("latestInput is required.");
  }
  if (request?.latestInput?.type && !ALLOWED_BOUNDED_INPUT_TYPES.has(request.latestInput.type)) {
    errors.push("latestInput.type must be a supported bounded input type.");
  }
  if (typeof request?.maxResponseChars !== "number" || request.maxResponseChars < 40 || request.maxResponseChars > 320) {
    errors.push("maxResponseChars must be between 40 and 320.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};

export const validateChatResponse = (response, maxResponseChars) => {
  const errors = [];
  const text = response?.reply?.text;

  if (typeof text !== "string" || text.length === 0) {
    errors.push("reply.text is required.");
  }
  if (typeof text === "string" && text.length > maxResponseChars) {
    errors.push("reply.text exceeds maxResponseChars.");
  }
  if (typeof text === "string" && /<[^>]+>/.test(text)) {
    errors.push("reply.text must not contain raw HTML.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};
