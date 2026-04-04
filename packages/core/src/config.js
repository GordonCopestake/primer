const env = typeof process === "undefined" ? {} : process.env;

export const APP_CONFIG = {
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
