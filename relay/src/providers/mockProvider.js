const createTapChoiceInteraction = (request) => {
  const authoredOptions = request.hardConstraints?.tutoringContext?.choiceOptions ?? [];
  const expectedResponse = request.hardConstraints?.tutoringContext?.expectedResponse ?? null;
  const options = authoredOptions.length > 0 ? authoredOptions : ["7", "5", "9", "4"];
  return {
  type: "tap-choice",
  options: options.slice(0, 4).map((label, index) => ({
    id: String(label).toLowerCase(),
    label,
    audioLabel: String(label),
    correct: expectedResponse ? String(label) === String(expectedResponse) : index === 0,
  })),
  };
};

const createMathInputInteraction = (request, objectiveId) => {
  const tutoringContext = request.hardConstraints?.tutoringContext ?? {};
  if (tutoringContext.expectedExpression) {
    return {
      type: "math-input",
      expressionPrompt: tutoringContext.prompt ?? "Solve the bounded algebra step.",
      expectedExpression: tutoringContext.expectedExpression,
    };
  }

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

const createReadRespondInteraction = (request) => ({
  type: "read-respond",
  prompt: request.hardConstraints?.tutoringContext?.prompt ?? "Give a short answer.",
  expectedKeywords: request.hardConstraints?.tutoringContext?.expectedKeywords ?? [],
});

const createNoneInteraction = () => ({
  type: "none",
});

const chooseInteraction = (request) => {
  const allowed = request.hardConstraints.allowedInteractionTypes;
  const objectiveId = request.hardConstraints.objectiveId ?? "";
  const tutoringContext = request.hardConstraints?.tutoringContext ?? {};
  const preferredResponseType = tutoringContext.responseType ?? null;

  if (preferredResponseType === "multiple-choice" && allowed.includes("tap-choice")) {
    return createTapChoiceInteraction(request);
  }

  if (preferredResponseType === "math-input" && allowed.includes("math-input")) {
    return createMathInputInteraction(request, objectiveId);
  }

  if (preferredResponseType === "short-text" && allowed.includes("read-respond")) {
    return createReadRespondInteraction(request);
  }

  if (allowed.includes("tap-choice") && tutoringContext.choiceOptions?.length > 0) {
    return createTapChoiceInteraction(request);
  }

  if (allowed.includes("math-input") && tutoringContext.expectedExpression) {
    return createMathInputInteraction(request, objectiveId);
  }

  if (allowed.includes("read-respond") && tutoringContext.expectedKeywords?.length > 0) {
    return createReadRespondInteraction(request);
  }

  if (allowed.includes("math-input")) {
    return createMathInputInteraction(request, objectiveId);
  }

  if (allowed.includes("tap-choice")) {
    return createTapChoiceInteraction(request);
  }

  if (allowed.includes("read-respond")) {
    return createReadRespondInteraction(request);
  }

  return createNoneInteraction();
};

export const PINNED_PROVIDER = "local-mock-v1";

export const proposeSceneBlueprint = (request) => {
  const kind = request.hardConstraints.allowedSceneKinds[0] ?? "fallback";
  const interaction = chooseInteraction(request);
  const phase = request.hardConstraints.phase ?? "tutoring";
  const tutoringContext = request.hardConstraints.tutoringContext ?? {};

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
          tutoringContext.sceneHint ??
          (interaction.type === "math-input"
            ? "Solve the equation carefully, then enter your answer."
            : interaction.type === "read-respond"
              ? "Give one short algebra explanation to continue."
              : "Choose one clear algebra option to continue."),
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

export const MOCK_PROVIDER_ADAPTER = Object.freeze({
  providerId: PINNED_PROVIDER,
  sendTutorTurn(request) {
    return proposeSceneBlueprint(request);
  },
  sendChatTurn(request) {
    return proposeChatReply(request);
  },
});
