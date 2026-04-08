import { validateSceneBlueprint } from "./scene.js";

export const createStableError = (code, message, details = null) => ({
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

const ALLOWED_BOUNDED_INPUT_TYPES = new Set([
  "transcript",
  "tap-choice",
  "trace-result",
  "system-start",
  "math-input",
  "short-answer",
  "short-explanation",
]);

const validateBoundedTutorRequest = (request) => {
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
  if (request?.latestInput?.type && !ALLOWED_BOUNDED_INPUT_TYPES.has(request.latestInput.type)) {
    errors.push("latestInput.type must be a supported bounded input type.");
  }
  if (!request?.hardConstraints?.activeDomain || !request?.hardConstraints?.objectiveId) {
    errors.push("hardConstraints are required.");
  }
  if (
    request?.hardConstraints?.phase &&
    !["diagnostic", "tutoring", "review"].includes(request.hardConstraints.phase)
  ) {
    errors.push("hardConstraints.phase must be a supported tutor phase.");
  }
  if (
    request?.hardConstraints?.moduleId !== undefined &&
    typeof request.hardConstraints.moduleId !== "string"
  ) {
    errors.push("hardConstraints.moduleId must be a string when present.");
  }
  if (
    request?.hardConstraints?.conceptId !== undefined &&
    typeof request.hardConstraints.conceptId !== "string"
  ) {
    errors.push("hardConstraints.conceptId must be a string when present.");
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

export const validateDirectorRequest = validateBoundedTutorRequest;

export const validateTutorRequest = (request) => {
  const validation = validateBoundedTutorRequest(request);
  if (!validation.ok) {
    return validation;
  }

  if (!request?.hardConstraints?.moduleId) {
    validation.ok = false;
    validation.errors.push("hardConstraints.moduleId is required.");
  }

  if (!request?.hardConstraints?.conceptId) {
    validation.ok = false;
    validation.errors.push("hardConstraints.conceptId is required.");
  }

  return validation;
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

export const validateTutorResponse = validateDirectorResponse;

export const validateChatRequest = (request) => {
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
  if (request?.latestInput?.type && !ALLOWED_BOUNDED_INPUT_TYPES.has(request.latestInput.type)) {
    errors.push("latestInput.type must be a supported bounded input type.");
  }
  if (typeof request?.maxResponseChars !== "number" || request.maxResponseChars < 40 || request.maxResponseChars > 320) {
    errors.push("maxResponseChars must be between 40 and 320.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};

export const validateChatResponse = (response, maxResponseChars) => {
  const errors = [];
  const text = response?.reply?.text;

  if (typeof text !== "string" || text.length === 0) {
    errors.push("reply.text is required.");
  }
  if (typeof text === "string" && text.length > maxResponseChars) {
    errors.push("reply.text exceeds maxResponseChars.");
  }
  if (typeof text === "string" && /<[^>]+>/.test(text)) {
    errors.push("reply.text must not contain raw HTML.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};
