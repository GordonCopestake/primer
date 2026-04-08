import { V1_INTERACTIONS, V1_SCENE_KINDS } from "./curriculum.js";

const VALID_TRANSITIONS = new Set(["fade", "slide", "pan"]);
const VALID_TONES = new Set(["calm", "encouraging", "celebratory", "focused", "curious"]);
const SAFE_RECIPE_IDS = new Set(["ambient_safe_path", "neutral_choice_board", "symbol_trace_board"]);

export const validateSceneBlueprint = (blueprint, decision = null) => {
  const errors = [];

  if (!blueprint || blueprint.version !== 1) {
    errors.push("Scene version must be 1.");
  }

  if (!blueprint?.scene?.id) {
    errors.push("Scene id is required.");
  }

  if (!V1_SCENE_KINDS.includes(blueprint?.scene?.kind)) {
    errors.push("Unsupported scene kind.");
  }

  if (!VALID_TRANSITIONS.has(blueprint?.scene?.transition)) {
    errors.push("Unsupported transition.");
  }

  if (!VALID_TONES.has(blueprint?.scene?.tone)) {
    errors.push("Unsupported tone.");
  }

  if (typeof blueprint?.narration?.text !== "string" || blueprint.narration.text.length === 0) {
    errors.push("Narration text is required.");
  }

  if (typeof blueprint?.narration?.maxChars !== "number") {
    errors.push("Narration budget is required.");
  }

  if (blueprint?.narration?.text?.length > blueprint?.narration?.maxChars) {
    errors.push("Narration exceeds scene budget.");
  }

  const interactionType = blueprint?.interaction?.type;
  if (!V1_INTERACTIONS.includes(interactionType)) {
    errors.push("Unsupported interaction type.");
  }

  if (interactionType === "tap-choice") {
    const options = blueprint?.interaction?.options;
    if (!Array.isArray(options) || options.length === 0 || options.length > 4) {
      errors.push("Tap choice must contain one to four options.");
    }
  }

  if (interactionType === "trace-symbol" && !blueprint?.interaction?.target) {
    errors.push("Trace symbol scenes require a target.");
  }

  if (interactionType === "repeat-sound" && !blueprint?.interaction?.phoneme) {
    errors.push("Repeat sound scenes require a phoneme.");
  }

  if (interactionType === "read-respond") {
    if (!blueprint?.interaction?.prompt || typeof blueprint.interaction.prompt !== "string") {
      errors.push("Read/respond scenes require a prompt.");
    }
    if (
      !Array.isArray(blueprint?.interaction?.expectedKeywords) ||
      blueprint.interaction.expectedKeywords.length === 0
    ) {
      errors.push("Read/respond scenes require expected keywords.");
    }
  }

  if (interactionType === "math-input") {
    if (!blueprint?.interaction?.expressionPrompt || typeof blueprint.interaction.expressionPrompt !== "string") {
      errors.push("Math input scenes require an expressionPrompt.");
    }
    if (!blueprint?.interaction?.expectedExpression || typeof blueprint.interaction.expectedExpression !== "string") {
      errors.push("Math input scenes require an expectedExpression.");
    }
  }

  const narrationText = blueprint?.narration?.text ?? "";
  if (/[<>]/.test(narrationText)) {
    errors.push("Raw HTML is not allowed.");
  }

  if (decision) {
    if (blueprint?.scene?.objectiveId !== decision.objectiveId) {
      errors.push("Scene objective is outside curriculum constraints.");
    }

    if (!decision.allowedSceneKinds.includes(blueprint?.scene?.kind)) {
      errors.push("Scene kind is outside curriculum constraints.");
    }

    if (!decision.allowedInteractionTypes.includes(interactionType)) {
      errors.push("Interaction type is outside curriculum constraints.");
    }

    if (narrationText.length > decision.maxNarrationChars) {
      errors.push("Narration exceeds curriculum budget.");
    }
  }

  if (blueprint?.visualIntent?.recipeId && !SAFE_RECIPE_IDS.has(blueprint.visualIntent.recipeId)) {
    errors.push("Visual recipe is not allowed.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};
