export const createFallbackScene = (reason = "unknown") => ({
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
