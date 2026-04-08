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

const createMathInputInteraction = (objectiveId) => {
  if (objectiveId.includes("two-step-equations")) {
    return {
      type: "math-input",
      expressionPrompt: "Solve 2x + 3 = 11.",
      expectedExpression: "4",
    };
  }

  if (objectiveId.includes("one-step-addition-equations")) {
    return {
      type: "math-input",
      expressionPrompt: "Solve x + 5 = 12.",
      expectedExpression: "7",
    };
  }

  if (objectiveId.includes("evaluate-expressions")) {
    return {
      type: "math-input",
      expressionPrompt: "Evaluate 2x + 1 when x = 4.",
      expectedExpression: "9",
    };
  }

  return {
    type: "math-input",
    expressionPrompt: "Solve x + 2 = 9.",
    expectedExpression: "7",
  };
};

const createNoneInteraction = () => ({
  type: "none",
});

const chooseInteraction = (request) => {
  const allowed = request.hardConstraints.allowedInteractionTypes;
  const objectiveId = request.hardConstraints.objectiveId ?? "";

  if (allowed.includes("math-input")) {
    return createMathInputInteraction(objectiveId);
  }

  if (allowed.includes("tap-choice")) {
    return createTapChoiceInteraction();
  }

  return createNoneInteraction();
};

export const PINNED_PROVIDER = "local-mock-v1";

export const proposeSceneBlueprint = (request) => {
  const kind = request.hardConstraints.allowedSceneKinds[0] ?? "fallback";
  const interaction = chooseInteraction(request);
  const phase = request.hardConstraints.phase ?? "tutoring";

  return {
    blueprint: {
      version: 1,
      scene: {
        id: `relay_${request.requestId}`,
        kind,
        objectiveId: request.hardConstraints.objectiveId,
        transition: kind === "assessment" ? "fade" : "slide",
        tone: request.latestInput.type === "transcript" ? "encouraging" : phase === "diagnostic" ? "focused" : "curious",
      },
      narration: {
        text:
          interaction.type === "math-input"
            ? "Solve the equation carefully, then enter your answer."
            : "Choose one clear algebra option to continue.",
        maxChars: request.hardConstraints.maxNarrationChars,
        estDurationMs: 1800,
        bargeInAllowed: true,
      },
      interaction,
      visualIntent: {
        type: "recipe",
        recipeId: "neutral_choice_board",
        vars: {
          locale: request.hardConstraints.locale,
          provider: PINNED_PROVIDER,
        },
      },
      evidence: {
        observedSkill: request.hardConstraints.conceptId ?? request.hardConstraints.activeDomain,
        confidenceHint: 0.68,
      },
    },
  };
};

export const proposeChatReply = (request) => {
  const boundedInput = request.latestInput.content.trim();
  const objectiveId = request.objectiveId ?? request.hardConstraints?.objectiveId ?? "concept.variables-and-expressions";
  const baseReply =
    boundedInput.length > 0
      ? `Great question. ${boundedInput} is a good step. Let's try one short example together.`
      : "Great question. Let's try one short example together.";

  const text = baseReply.slice(0, request.maxResponseChars);
  return {
    reply: {
      text,
      maxChars: request.maxResponseChars,
      estDurationMs: 1800,
      bargeInAllowed: true,
    },
    suggestedNextScene: {
      objectiveId,
    },
  };
};
