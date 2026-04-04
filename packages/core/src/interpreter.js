import { validateSceneBlueprint } from "../../schemas/src/index.js";
import { createFallbackScene } from "./fallback.js";

export const interpretScene = (blueprint, decision) => {
  const validation = validateSceneBlueprint(blueprint, decision);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      blueprint: createFallbackScene("validation-failure"),
    };
  }

  return {
    ok: true,
    errors: [],
    blueprint,
  };
};
