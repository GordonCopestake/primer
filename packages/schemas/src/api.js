import { validateSceneBlueprint } from "./scene.js";

export const createStableError = (code, message, details = null) => ({
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

export const validateDirectorRequest = (request) => {
  const errors = [];
  if (!request?.requestId) {
    errors.push("requestId is required.");
  }
  if (typeof request?.learnerSummary !== "string" || request.learnerSummary.length === 0) {
    errors.push("learnerSummary is required.");
  }
  if (!request?.latestInput?.type || typeof request?.latestInput?.content !== "string") {
    errors.push("latestInput is required.");
  }
  if (!request?.hardConstraints?.activeDomain || !request?.hardConstraints?.objectiveId) {
    errors.push("hardConstraints are required.");
  }
  if (!Array.isArray(request?.hardConstraints?.allowedSceneKinds)) {
    errors.push("allowedSceneKinds are required.");
  }
  if (!Array.isArray(request?.hardConstraints?.allowedInteractionTypes)) {
    errors.push("allowedInteractionTypes are required.");
  }
  return {
    ok: errors.length === 0,
    errors,
  };
};

export const validateDirectorResponse = (response, hardConstraints) => {
  if (!response || typeof response !== "object" || !response.blueprint) {
    return {
      ok: false,
      errors: ["Response must include blueprint."],
    };
  }

  return validateSceneBlueprint(response.blueprint, {
    activeDomain: hardConstraints.activeDomain,
    literacyStage: hardConstraints.literacyStage,
    objectiveId: hardConstraints.objectiveId,
    allowedSceneKinds: hardConstraints.allowedSceneKinds,
    allowedInteractionTypes: hardConstraints.allowedInteractionTypes,
    maxNarrationChars: hardConstraints.maxNarrationChars,
  });
};
