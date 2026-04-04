const optionPool = ["Map", "Sun", "Tree", "Stone"];

const createTapChoiceInteraction = () => ({
  type: "tap-choice",
  options: optionPool.slice(0, 3).map((label, index) => ({
    id: label.toLowerCase(),
    label,
    audioLabel: label,
    correct: index === 0,
  })),
});

const createTraceInteraction = () => ({
  type: "trace-symbol",
  target: "M",
});

const createRepeatInteraction = () => ({
  type: "repeat-sound",
  phoneme: "m",
});

const createNoneInteraction = () => ({
  type: "none",
});

const chooseInteraction = (request) => {
  const allowed = request.hardConstraints.allowedInteractionTypes;

  if (request.latestInput.type === "trace-result" && allowed.includes("trace-symbol")) {
    return createTraceInteraction();
  }

  if (request.latestInput.type === "transcript" && allowed.includes("repeat-sound")) {
    return createRepeatInteraction();
  }

  if (allowed.includes("tap-choice")) {
    return createTapChoiceInteraction();
  }

  if (allowed.includes("trace-symbol")) {
    return createTraceInteraction();
  }

  if (allowed.includes("repeat-sound")) {
    return createRepeatInteraction();
  }

  return createNoneInteraction();
};

export const PINNED_PROVIDER = "local-mock-v1";

export const proposeSceneBlueprint = (request) => {
  const kind = request.hardConstraints.allowedSceneKinds[0] ?? "fallback";
  const interaction = chooseInteraction(request);

  return {
    blueprint: {
      version: 1,
      scene: {
        id: `relay_${request.requestId}`,
        kind,
        objectiveId: request.hardConstraints.objectiveId,
        transition: kind === "assessment" ? "fade" : "slide",
        tone: request.latestInput.type === "transcript" ? "encouraging" : "curious",
      },
      narration: {
        text:
          interaction.type === "trace-symbol"
            ? "Trace the large symbol, then continue when it feels steady."
            : interaction.type === "repeat-sound"
              ? "Listen for the sound and repeat it, or use the tap path."
              : "Choose one clear option to continue.",
        maxChars: request.hardConstraints.maxNarrationChars,
        estDurationMs: 1800,
        bargeInAllowed: true,
      },
      interaction,
      visualIntent: {
        type: "recipe",
        recipeId: interaction.type === "trace-symbol" ? "symbol_trace_board" : "neutral_choice_board",
        vars: {
          locale: request.hardConstraints.locale,
          provider: PINNED_PROVIDER,
        },
      },
      evidence: {
        observedSkill: request.hardConstraints.activeDomain,
        confidenceHint: 0.68,
      },
    },
  };
};
