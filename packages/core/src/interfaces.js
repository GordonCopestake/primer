export const AI_PROVIDER_INTERFACE = {
  name: "AIProviderAdapter",
  version: "1.0.0",
  description: "Interface for AI model providers used for tutoring responses.",
  methods: {
    proposeScene: {
      description: "Generate a scene blueprint for tutoring",
      parameters: {
        request: { type: "DirectorRequest", required: true },
      },
      returns: { type: "DirectorResponse" },
    },
    proposeChatReply: {
      description: "Generate a chat response for non-tutoring interactions",
      parameters: {
        request: { type: "ChatRequest", required: true },
      },
      returns: { type: "ChatResponse" },
    },
  },
};

export const STORAGE_ADAPTER_INTERFACE = {
  name: "StorageAdapter",
  version: "1.0.0",
  description: "Interface for storage backends that persist learner state.",
  methods: {
    save: {
      description: "Persist learner state to storage",
      parameters: { key: { type: "string", required: true }, data: { type: "LearnerState", required: true } },
      returns: { type: "Promise<void>" },
    },
    load: {
      description: "Retrieve learner state from storage",
      parameters: { key: { type: "string", required: true } },
      returns: { type: "Promise<LearnerState | null>" },
    },
    remove: {
      description: "Remove learner state from storage",
      parameters: { key: { type: "string", required: true } },
      returns: { type: "Promise<void>" },
    },
    estimateStorage: {
      description: "Estimate available storage capacity",
      parameters: {},
      returns: { type: "Promise<StorageEstimate>" },
    },
  },
};

export const TELEMETRY_SINK_INTERFACE = {
  name: "TelemetrySink",
  version: "1.0.0",
  description: "Interface for telemetry sinks that collect opt-in usage data.",
  methods: {
    consent: { description: "Check if telemetry consent has been granted", returns: { type: "boolean" } },
    track: {
      description: "Record a telemetry event",
      parameters: { event: { type: "TelemetryEvent", required: true } },
      returns: { type: "Promise<void>" },
    },
    flush: { description: "Flush buffered telemetry data", parameters: {}, returns: { type: "Promise<void>" } },
  },
};

export const VALIDATION_PLUGIN_INTERFACE = {
  name: "ValidationPlugin",
  version: "1.0.0",
  description: "Interface for custom validation plugins for subject-specific validation.",
  methods: {
    validate: {
      description: "Validate learner input against expected answer",
      parameters: {
        input: { type: "string", required: true },
        expected: { type: "string", required: true },
        options: { type: "object", required: false },
      },
      returns: {
        type: "ValidationResult",
        properties: {
          correct: { type: "boolean" },
          reason: { type: "string", enum: ["numeric", "expression", "equation", "syntax", "mismatch"] },
          detail: { type: "string", required: false },
        },
      },
    },
  },
};

export const UI_COMPONENT_REGISTRY = {
  name: "UIComponentRegistry",
  version: "1.0.0",
  description: "Metadata registry for fixed UI components. Model-authored UI is not supported.",
  components: [
    { id: "scene-card", description: "Main content area for scenes" },
    { id: "choice-button", description: "Selectable option buttons" },
    { id: "math-input", description: "Mathematical expression input field" },
    { id: "concept-map", description: "Tech-tree style concept progress view" },
    { id: "settings-dialog", description: "Configuration and privacy settings" },
    { id: "orb-button", description: "AI interaction trigger button" },
    { id: "trace-canvas", description: "Symbol tracing input area" },
  ],
};
