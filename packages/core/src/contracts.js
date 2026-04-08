export const ADAPTER_CONTRACTS = Object.freeze({
  aiProviderAdapter: Object.freeze({
    description: "Executes bounded tutoring and chat requests against a configured provider.",
    requiredMethods: Object.freeze(["sendTutorTurn", "sendChatTurn"]),
  }),
  modelAdapter: Object.freeze({
    description: "Describes a selectable model and enforces capability metadata.",
    requiredMethods: Object.freeze(["getModelId", "getDisplayName", "supportsCapability"]),
  }),
  storageAdapter: Object.freeze({
    description: "Persists learner state, scenes, and backup bundles for local-first recovery.",
    requiredMethods: Object.freeze(["loadState", "saveState", "loadScene", "saveScene", "exportBackup", "importBackup"]),
  }),
  subjectPack: Object.freeze({
    description: "Provides the authored module graph, lessons, assessment items, and validation constraints.",
    requiredMethods: Object.freeze(["getModule", "listConcepts", "listLessons", "listAssessmentItems"]),
  }),
  validationPlugin: Object.freeze({
    description: "Checks learner answers deterministically and reports syntax versus conceptual issues.",
    requiredMethods: Object.freeze(["validateResponse", "classifyError"]),
  }),
  telemetrySink: Object.freeze({
    description: "Receives opt-in telemetry events without becoming a required product dependency.",
    requiredMethods: Object.freeze(["recordEvent", "flush"]),
  }),
  uiComponentRegistry: Object.freeze({
    description: "Constrains runtime rendering to fixed, documented component types.",
    requiredMethods: Object.freeze(["listComponents", "resolveComponent"]),
  }),
});

export const FIXED_UI_COMPONENT_REGISTRY = Object.freeze([
  Object.freeze({ id: "landing-setup", surface: "screen", bounded: true }),
  Object.freeze({ id: "provider-config", surface: "screen", bounded: true }),
  Object.freeze({ id: "module-selection", surface: "screen", bounded: true }),
  Object.freeze({ id: "tutoring-workspace", surface: "screen", bounded: true }),
  Object.freeze({ id: "concept-mastery-map", surface: "screen", bounded: true }),
  Object.freeze({ id: "concept-detail", surface: "screen", bounded: true }),
  Object.freeze({ id: "settings", surface: "screen", bounded: true }),
  Object.freeze({ id: "import-export", surface: "screen", bounded: true }),
  Object.freeze({ id: "telemetry-preferences", surface: "screen", bounded: true }),
]);

export const validateContractImplementation = (contractName, implementation) => {
  const contract = ADAPTER_CONTRACTS[contractName];
  if (!contract) {
    return {
      ok: false,
      errors: [`Unknown contract: ${contractName}.`],
    };
  }

  const errors = contract.requiredMethods
    .filter((methodName) => typeof implementation?.[methodName] !== "function")
    .map((methodName) => `Missing method ${methodName}.`);

  return {
    ok: errors.length === 0,
    errors,
  };
};

export const createExportManifest = (state, encryption = "none", exportedAt = new Date().toISOString()) => ({
  manifestType: "primer-export-manifest",
  formatVersion: 2,
  schemaVersion: state?.schemaVersion ?? 5,
  moduleId: state?.moduleSelection?.selectedModuleId ?? "algebra-foundations",
  exportedAt,
  encryption,
  assetManifestVersion: state?.assetIndex?.manifestVersion ?? 1,
  telemetryConsent: state?.consentAndSettings?.telemetryEnabled ? "opt-in" : "off",
  selectedProvider: state?.providerConfig?.providerName ?? "",
});

export const validateExportManifest = (manifest) => {
  const errors = [];

  if (manifest?.manifestType !== "primer-export-manifest") {
    errors.push("manifestType must be primer-export-manifest.");
  }
  if (typeof manifest?.formatVersion !== "number" || manifest.formatVersion < 2) {
    errors.push("formatVersion must be 2 or later.");
  }
  if (typeof manifest?.schemaVersion !== "number") {
    errors.push("schemaVersion is required.");
  }
  if (typeof manifest?.moduleId !== "string" || manifest.moduleId.length === 0) {
    errors.push("moduleId is required.");
  }
  if (typeof manifest?.exportedAt !== "string" || manifest.exportedAt.length === 0) {
    errors.push("exportedAt is required.");
  }
  if (!["none", "primer-aes-gcm-v1", "primer-xor-v1"].includes(manifest?.encryption)) {
    errors.push("Unsupported manifest encryption.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};
