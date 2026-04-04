export const SCHEMA_VERSION = 1;

export const masteryBucket = () => ({
  phonemes: {},
  graphemes: {},
  vocabularyThemes: {},
  numeracyConcepts: {},
  mathConcepts: {},
  scienceConcepts: {},
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
    currentObjectiveId: "baseline.audio-choice.1",
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
    cloudEnabled: false,
    cloudImageEnabled: false,
    cloudVisionEnabled: false,
    adminPinEnabled: false,
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
    byId: {},
    ...overrides.assetIndex,
  },
});
