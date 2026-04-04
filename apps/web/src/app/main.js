import {
  APP_CONFIG,
  createDefaultState,
  createFallbackScene,
  detectCapabilities,
  interpretScene,
  nextCurriculumDecision,
} from "../../../../packages/core/src/index.js";

const sceneRoot = document.querySelector("#scene-root");
const replayButton = document.querySelector("#replay-button");
const fallbackButton = document.querySelector("#fallback-button");

const state = createDefaultState({
  capabilities: detectCapabilities(globalThis),
});

const renderScene = (scene) => {
  const result = interpretScene(scene, nextCurriculumDecision(state));
  const safeScene = result.ok ? result.blueprint : createFallbackScene("validation-failure");
  const interactionType = safeScene.interaction.type;

  sceneRoot.innerHTML = `
    <div class="scene-meta">
      <span>${safeScene.scene.kind}</span>
      <span>${interactionType}</span>
    </div>
    <h2>${safeScene.narration.text}</h2>
    <p class="helper">Capability tier: ${state.capabilities.tier}</p>
  `;
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./public/sw.js");
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
};

fallbackButton?.addEventListener("click", () => {
  renderScene(createFallbackScene("manual"));
});

replayButton?.addEventListener("click", () => {
  renderScene(createFallbackScene("replay"));
});

if (APP_CONFIG.appMode !== "test") {
  registerServiceWorker();
}

renderScene(createFallbackScene("startup"));
