import { SCHEMA_VERSION, createStateShape } from "../../schemas/src/index.js";

export const createDefaultState = (overrides = {}) => createStateShape(overrides);

const migrateLegacyPedagogicalState = (rawState) => ({
  diagnosticStatus: "not-started",
  diagnosticStep: 0,
  readiness: "unknown",
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
  ...(rawState?.pedagogicalState?.goals ? { goals: rawState.pedagogicalState.goals } : {}),
});

export const migrateState = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return createDefaultState();
  }

  if (!rawState.schemaVersion || rawState.schemaVersion < SCHEMA_VERSION) {
    return createDefaultState({
      learnerProfile: {
        ...createDefaultState().learnerProfile,
        ...(rawState.learnerProfile ?? {}),
      },
      moduleSelection: {
        ...createDefaultState().moduleSelection,
        ...(rawState.moduleSelection ?? {}),
      },
      pedagogicalState: {
        ...migrateLegacyPedagogicalState(rawState),
      },
      runtimeSession: {
        ...createDefaultState().runtimeSession,
        recentTurns: rawState.runtimeSession?.recentTurns ?? [],
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

  return createDefaultState(rawState);
};

export const appendRecentTurn = (state, turn) => {
  const recentTurns = [...state.runtimeSession.recentTurns, turn].slice(-8);
  return createDefaultState({
    ...state,
    runtimeSession: {
      ...state.runtimeSession,
      recentTurns,
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
