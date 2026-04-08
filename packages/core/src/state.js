import {
  SCHEMA_VERSION,
  createModuleMetadata,
  createRecentInteractionMemoryEntry,
  createStateShape,
} from "../../schemas/src/index.js";
import { ALGEBRA_FOUNDATIONS_MODULE, getInitialConceptId } from "./algebraModule.js";

const createDefaultModuleMetadataById = () => ({
  [ALGEBRA_FOUNDATIONS_MODULE.id]: createModuleMetadata({
    moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
    title: ALGEBRA_FOUNDATIONS_MODULE.title,
    subject: ALGEBRA_FOUNDATIONS_MODULE.subject,
    focus: ALGEBRA_FOUNDATIONS_MODULE.focus,
    description: ALGEBRA_FOUNDATIONS_MODULE.description,
  }),
});

const normalizeModuleSelection = (moduleSelection = {}) => ({
  selectedModuleId: ALGEBRA_FOUNDATIONS_MODULE.id,
  availableModuleIds: [ALGEBRA_FOUNDATIONS_MODULE.id],
  moduleMetadataById: {
    ...createDefaultModuleMetadataById(),
    ...(moduleSelection.moduleMetadataById ?? {}),
  },
  selectedAt: null,
  ...moduleSelection,
});

const normalizeRecentInteractionMemory = (runtimeSession = {}, pedagogicalState = {}) => {
  if (Array.isArray(runtimeSession.recentInteractionMemory) && runtimeSession.recentInteractionMemory.length > 0) {
    return runtimeSession.recentInteractionMemory.slice(-12);
  }

  return (runtimeSession.recentTurns ?? []).slice(-8).map((turn, index) =>
    createRecentInteractionMemoryEntry({
      interactionId: `migrated-turn-${index}`,
      role: turn?.role ?? "user",
      content: turn?.content ?? "",
      conceptId: pedagogicalState.currentConceptId ?? getInitialConceptId(),
      objectiveId: pedagogicalState.currentObjectiveId ?? "diagnostic.variables",
      recordedAt: null,
    }),
  );
};

const normalizeState = (rawState = {}) =>
  createDefaultState({
    ...rawState,
    schemaVersion: SCHEMA_VERSION,
    moduleSelection: normalizeModuleSelection(rawState.moduleSelection),
    pedagogicalState: {
      ...rawState.pedagogicalState,
      assessmentAttempts: rawState.pedagogicalState?.assessmentAttempts ?? [],
      tutoringDecisions: rawState.pedagogicalState?.tutoringDecisions ?? [],
    },
    runtimeSession: {
      ...rawState.runtimeSession,
      recentInteractionMemory: normalizeRecentInteractionMemory(rawState.runtimeSession, rawState.pedagogicalState ?? {}),
    },
  });

export const createDefaultState = (overrides = {}) => {
  const initialConceptId = getInitialConceptId();

  return createStateShape({
    ...overrides,
    moduleSelection: normalizeModuleSelection(overrides.moduleSelection),
    pedagogicalState: {
      currentConceptId: initialConceptId,
      recommendedConceptId: initialConceptId,
      ...overrides.pedagogicalState,
    },
  });
};

const migrateLegacyPedagogicalState = (rawState) => ({
  diagnosticStatus: "not-started",
  diagnosticStep: 0,
  readiness: "unknown",
  prerequisiteGaps: [],
  likelyMisconceptions: [],
  diagnosticSummary: null,
  currentConceptId: getInitialConceptId(),
  currentLessonId: null,
  currentObjectiveId: "diagnostic.variables",
  recommendedConceptId: getInitialConceptId(),
  masteryByConcept: {},
  misconceptionsByConcept: {},
  evidenceLog: [],
  reviewSchedule: [],
  recentActivity: [],
  tutoringDecisions: [],
  lessonRecords: {},
  assessmentItems: {},
  assessmentAttempts: [],
  attemptLog: [],
  goals: [],
  milestones: createDefaultState().pedagogicalState.milestones,
  ...(rawState?.pedagogicalState?.goals ? { goals: rawState.pedagogicalState.goals } : {}),
});

export const migrateState = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return createDefaultState();
  }

  if (!rawState.schemaVersion || rawState.schemaVersion < 2) {
    const legacyPedagogicalState = migrateLegacyPedagogicalState(rawState);
    return normalizeState({
      learnerProfile: {
        ...createDefaultState().learnerProfile,
        ...(rawState.learnerProfile ?? {}),
      },
      moduleSelection: normalizeModuleSelection(rawState.moduleSelection),
      pedagogicalState: {
        ...legacyPedagogicalState,
      },
      runtimeSession: {
        ...createDefaultState().runtimeSession,
        recentTurns: rawState.runtimeSession?.recentTurns ?? [],
        recentInteractionMemory: normalizeRecentInteractionMemory(rawState.runtimeSession ?? {}, legacyPedagogicalState),
        runningSummary: rawState.runtimeSession?.runningSummary ?? null,
      },
      consentAndSettings: {
        ...createDefaultState().consentAndSettings,
        ...(rawState.consentAndSettings ?? {}),
      },
      providerConfig: {
        ...createDefaultState().providerConfig,
        ...(rawState.providerConfig ?? {}),
      },
      capabilities: {
        ...createDefaultState().capabilities,
        ...(rawState.capabilities ?? {}),
      },
      assetIndex: {
        ...createDefaultState().assetIndex,
        ...(rawState.assetIndex ?? {}),
      },
      exportMetadata: {
        ...createDefaultState().exportMetadata,
        ...(rawState.exportMetadata ?? {}),
      },
    });
  }

  return normalizeState({
    ...rawState,
    providerConfig: {
      ...rawState.providerConfig,
      hasStoredApiKey: Boolean(rawState.providerConfig?.apiKey || rawState.providerConfig?.hasStoredApiKey),
    },
  });
};

export const appendRecentTurn = (state, turn) => {
  const recentTurns = [...state.runtimeSession.recentTurns, turn].slice(-8);
  const interactionEntry = createRecentInteractionMemoryEntry({
    interactionId: `turn-${Date.now()}`,
    role: turn?.role ?? "user",
    content: turn?.content ?? "",
    conceptId: state.pedagogicalState.currentConceptId ?? getInitialConceptId(),
    objectiveId: state.pedagogicalState.currentObjectiveId ?? "diagnostic.variables",
    recordedAt: new Date().toISOString(),
  });
  return createDefaultState({
    ...state,
    runtimeSession: {
      ...state.runtimeSession,
      recentTurns,
      recentInteractionMemory: [...(state.runtimeSession.recentInteractionMemory ?? []), interactionEntry].slice(-12),
    },
  });
};

export const setActiveScene = (state, scene) =>
  createDefaultState({
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      currentObjectiveId: scene?.scene?.objectiveId ?? state.pedagogicalState.currentObjectiveId,
      ...(typeof scene?.scene?.objectiveId === "string" && scene.scene.objectiveId.startsWith("concept.")
        ? { currentConceptId: scene.scene.objectiveId.slice("concept.".length) }
        : {}),
    },
    runtimeSession: {
      ...state.runtimeSession,
      activeSceneId: scene?.scene?.id ?? null,
      lastScene: scene ?? null,
    },
  });

export const updateConsentSettings = (state, updates) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      ...updates,
    },
  });
