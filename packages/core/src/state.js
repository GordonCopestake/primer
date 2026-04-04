import { SCHEMA_VERSION, createStateShape } from "../../schemas/src/index.js";

export const createDefaultState = (overrides = {}) => createStateShape(overrides);

export const migrateState = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return createDefaultState();
  }

  if (!rawState.schemaVersion || rawState.schemaVersion < SCHEMA_VERSION) {
    return createDefaultState(rawState);
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
