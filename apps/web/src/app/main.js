import {
  ALGEBRA_CONCEPT_GRAPH,
  APP_CONFIG,
  advanceAssessment,
  appendRecentTurn,
  applyMasteryEvidence,
  clearAdminPin,
  createDefaultState,
  createFallbackScene,
  decryptBackupPayload,
  deleteAssetRecord,
  detectCapabilities,
  estimateInstalledAssetBytes,
  estimateStorage,
  encryptBackupPayload,
  evictNonEssentialAssets,
  getAssetInstallPlan,
  hydrateAssetIndex,
  installAssetRecord,
  interpretScene,
  lockAdmin,
  listInstalledAssets,
  migrateState,
  normalizeSceneForRuntime,
  nextCurriculumDecision,
  queueImageGeneration,
  recoverSceneForRuntime,
  resetLearnerState,
  requestDirectorScene,
  requestVisionInterpretation,
  scoreTrace,
  setAdminPin,
  setActiveScene,
  validateMathInputResponse,
  unlockAdmin,
  updateAssetAccess,
  updateQuotaEstimate,
  updateConsentSettings,
  verifyAdminPin,
} from "./runtime.js";

const sceneRoot = document.querySelector("#scene-root");
const capabilityIndicator = document.querySelector("#capability-indicator");
const statusIndicator = document.querySelector("#status-indicator");
const loadingIndicator = document.querySelector("#loading-indicator");
const listenButton = document.querySelector("#listen-button");
const replayButton = document.querySelector("#replay-button");
const conceptMapButton = document.querySelector("#concept-map-button");
const settingsButton = document.querySelector("#settings-button");
const stopButton = document.querySelector("#stop-button");
const fallbackButton = document.querySelector("#fallback-button");
const settingsDialog = document.querySelector("#settings-dialog");
const soundEnabledInput = document.querySelector("#sound-enabled");
const captionsEnabledInput = document.querySelector("#captions-enabled");
const cloudEnabledInput = document.querySelector("#cloud-enabled");
const providerNameInput = document.querySelector("#provider-name-input");
const providerModelInput = document.querySelector("#provider-model-input");
const providerEndpointInput = document.querySelector("#provider-endpoint-input");
const providerApiKeyInput = document.querySelector("#provider-api-key-input");
const saveProviderButton = document.querySelector("#save-provider-button");
const cloudImageEnabledInput = document.querySelector("#cloud-image-enabled");
const cloudVisionEnabledInput = document.querySelector("#cloud-vision-enabled");
const encryptedExportEnabledInput = document.querySelector("#encrypted-export-enabled");
const telemetryEnabledInput = document.querySelector("#telemetry-enabled");
const adminPinEnabledInput = document.querySelector("#admin-pin-enabled");
const adminPinInput = document.querySelector("#admin-pin-input");
const savePinButton = document.querySelector("#save-pin-button");
const unlockAdminButton = document.querySelector("#unlock-admin-button");
const resetButton = document.querySelector("#reset-button");
const storageIndicator = document.querySelector("#storage-indicator");
const assetIndicator = document.querySelector("#asset-indicator");
const adminIndicator = document.querySelector("#admin-indicator");
const installAssetsButton = document.querySelector("#install-assets-button");
const evictAssetsButton = document.querySelector("#evict-assets-button");
const refreshStorageButton = document.querySelector("#refresh-storage-button");
const requestPersistenceButton = document.querySelector("#request-persistence-button");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importInput = document.querySelector("#import-input");

const STORAGE_KEY = "primer.state.v1";
const SCENE_KEY = "primer.scene.v1";

const capabilitySnapshot = detectCapabilities(globalThis);
const recognitionCtor = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
let recognition = null;
let currentDecision = null;
let currentScene = null;
let lastLessonScene = null;
let latestInput = {
  type: "system-start",
  content: "startup",
};
let activeTracePad = null;
let orbState = "idle";

const setOrbState = (nextState) => {
  orbState = nextState;
  if (listenButton) {
    listenButton.dataset.orbState = nextState;
  }
};

const speakText = (text, statusMessage = null) => {
  if (!state.consentAndSettings.soundEnabled) {
    setOrbState("muted");
    setStatus("Sound is turned off. Tap controls remain available.");
    return false;
  }

  if (!capabilitySnapshot.localTTS || !globalThis.speechSynthesis) {
    setOrbState("error");
    setStatus("Text audio is unavailable here. Tap controls remain available.");
    return false;
  }

  stopAudioAndInput();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onstart = () => {
    setOrbState("speaking");
    setLoading("Narrating");
  };
  utterance.onend = () => {
    setOrbState("idle");
    setLoading("Idle");
    if (statusMessage) {
      setStatus(statusMessage);
    }
  };
  utterance.onerror = () => {
    setOrbState("error");
    setLoading("Idle");
    setStatus("Narration could not start. Tap controls are still available.");
  };
  globalThis.speechSynthesis.speak(utterance);
  return true;
};

const createTracePad = (canvas, onStateChange) => {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const resize = () => {
    const ratio = globalThis.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.floor(bounds.width * ratio);
    canvas.height = Math.floor(bounds.height * ratio);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#16324f";
    context.lineWidth = 10;
  };

  let drawing = false;
  let hasDrawn = false;
  const points = [];

  const pointFromEvent = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const start = (event) => {
    drawing = true;
    const point = pointFromEvent(event);
    points.push(point);
    context.beginPath();
    context.moveTo(point.x, point.y);
    event.preventDefault();
  };

  const move = (event) => {
    if (!drawing) {
      return;
    }

    const point = pointFromEvent(event);
    points.push(point);
    context.lineTo(point.x, point.y);
    context.stroke();
    if (!hasDrawn) {
      hasDrawn = true;
      onStateChange(true);
    }
    event.preventDefault();
  };

  const stop = () => {
    drawing = false;
  };

  resize();
  globalThis.addEventListener("resize", resize);

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointerleave", stop);

  return {
    getTraceMetrics() {
      return {
        points: [...points],
        bounds: canvas.getBoundingClientRect(),
        dataUrl: canvas.toDataURL("image/png"),
      };
    },
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      points.length = 0;
      hasDrawn = false;
      onStateChange(false);
    },
    destroy() {
      globalThis.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", stop);
      canvas.removeEventListener("pointerleave", stop);
    },
  };
};

const setStatus = (message) => {
  if (statusIndicator) {
    statusIndicator.textContent = message;
  }
};

const setLoading = (message) => {
  if (loadingIndicator) {
    loadingIndicator.textContent = message;
  }
};

const updateProviderConfig = (updates) => {
  state = createDefaultState({
    ...state,
    providerConfig: {
      ...state.providerConfig,
      ...updates,
    },
  });
};

const readStorage = (key) => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch (error) {
    console.error("Storage write failed", error);
    setStatus("Storage is unavailable. Progress will only last this session.");
  }
};

const removeStorage = (key) => {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore storage removal failures and continue locally.
  }
};

const hydrateState = () => {
  const raw = readStorage(STORAGE_KEY);
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const migrated = migrateState(parsed);
  return createDefaultState({
    ...migrated,
    capabilities: capabilitySnapshot,
  });
};

const hydrateScene = () => {
  const raw = readStorage(SCENE_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let state = hydrateAssetIndex(hydrateState());

const persistState = () => {
  writeStorage(STORAGE_KEY, JSON.stringify(state));
};

const persistScene = (scene) => {
  writeStorage(SCENE_KEY, JSON.stringify(scene));
};

const selectModule = (moduleId) => {
  state = createDefaultState({
    ...state,
    moduleSelection: {
      ...state.moduleSelection,
      selectedModuleId: moduleId,
      selectedAt: state.moduleSelection.selectedAt ?? new Date().toISOString(),
    },
  });
  persistState();
};

const renderModuleSelectionView = () => {
  sceneRoot.innerHTML = `
    <div class="scene-body">
      <div class="scene-meta">
        <span>setup</span>
        <span>module selection</span>
      </div>
      <h2>Choose your starting module</h2>
      <p class="helper">The MVP currently ships one bounded maths module with a concept map, short diagnostic, and local progress tracking.</p>
      <div class="choice-grid">
        <button type="button" class="choice-button" id="select-algebra-module">
          Algebra foundations
        </button>
      </div>
    </div>
  `;

  sceneRoot.querySelector("#select-algebra-module")?.addEventListener("click", async () => {
    selectModule("algebra-foundations");
    setStatus("Algebra foundations selected.");
    await renderCurrentDecisionScene();
  });
};

const createSceneFromDecision = (decision) => {
  const fallbackScene = createFallbackScene("decision");

  if (decision?.moduleId !== "algebra-foundations") {
    return createFallbackScene("decision-miss");
  }

  const conceptLabel =
    ALGEBRA_CONCEPT_GRAPH.find((concept) => concept.id === decision.conceptId)?.label ?? "algebra concept";

  if (decision.phase === "diagnostic") {
    if (decision.inputType === "short-explanation") {
      return {
        version: 1,
        scene: {
          id: `scene_${decision.objectiveId.replaceAll(".", "_")}`,
          kind: "assessment",
          objectiveId: decision.objectiveId,
          transition: "fade",
          tone: "focused",
        },
        narration: {
          text: "Start with a short algebra diagnostic so Primer can place your first concept.",
          maxChars: 180,
          estDurationMs: 2200,
          bargeInAllowed: true,
        },
        visualIntent: fallbackScene.visualIntent,
        interaction: {
          type: "read-respond",
          prompt: decision.prompt,
          expectedKeywords: ["unknown", "number", "value", "variable"],
        },
        evidence: {
          observedSkill: decision.conceptId,
          confidenceHint: 0.5,
        },
      };
    }

    return {
      version: 1,
      scene: {
        id: `scene_${decision.objectiveId.replaceAll(".", "_")}`,
        kind: "assessment",
        objectiveId: decision.objectiveId,
        transition: "fade",
        tone: "focused",
      },
      narration: {
        text: `Diagnostic check: ${conceptLabel}.`,
        maxChars: 180,
        estDurationMs: 1800,
        bargeInAllowed: true,
      },
      visualIntent: fallbackScene.visualIntent,
      interaction: {
        type: "math-input",
        expressionPrompt: decision.prompt,
        expectedExpression:
          decision.objectiveId === "diagnostic.substitution"
            ? "9"
            : decision.objectiveId === "diagnostic.one-step"
              ? "7"
              : "4",
      },
      evidence: {
        observedSkill: decision.conceptId,
        confidenceHint: 0.5,
      },
    };
  }

  return {
    version: 1,
    scene: {
      id: `scene_${decision.conceptId.replaceAll("-", "_")}`,
      kind: "lesson",
      objectiveId: decision.objectiveId,
      transition: "slide",
      tone: "encouraging",
    },
    narration: {
      text: `Next concept: ${conceptLabel}. Solve one bounded algebra step and Primer will update your mastery map.`,
      maxChars: 220,
      estDurationMs: 2400,
      bargeInAllowed: true,
    },
    visualIntent: fallbackScene.visualIntent,
    interaction: {
      type: "math-input",
      expressionPrompt:
        decision.conceptId === "variables-and-expressions"
          ? "If x = 4, what is x + 3?"
          : decision.conceptId === "evaluate-expressions"
            ? "Evaluate 3x - 2 when x = 5."
            : decision.conceptId === "one-step-addition-equations"
              ? "Solve x + 4 = 11."
              : "Solve 2x + 3 = 11.",
      expectedExpression:
        decision.conceptId === "variables-and-expressions"
          ? "7"
          : decision.conceptId === "evaluate-expressions"
            ? "13"
            : decision.conceptId === "one-step-addition-equations"
              ? "7"
              : "4",
    },
    evidence: {
      observedSkill: decision.conceptId,
      confidenceHint: 0.68,
    },
  };
};

const deriveConceptStatuses = () => {
  const masteryByConcept = state.pedagogicalState.masteryByConcept ?? {};
  const hasConceptMastery = Object.keys(masteryByConcept).length > 0;
  const recommendedConceptId =
    state.pedagogicalState.recommendedConceptId ??
    state.pedagogicalState.currentConceptId ??
    ALGEBRA_CONCEPT_GRAPH[0]?.id;

  return ALGEBRA_CONCEPT_GRAPH.map((concept, index) => {
    const mastery = masteryByConcept[concept.id];
    if ((mastery?.score ?? 0) >= 1) {
      return { ...concept, state: "mastered" };
    }

    if (concept.id === recommendedConceptId) {
      return { ...concept, state: "recommended next" };
    }

    const prereqsMet = hasConceptMastery
      ? concept.prerequisites.every((prereq) => (masteryByConcept[prereq]?.score ?? 0) >= 1)
      : index === 0;

    return {
      ...concept,
      state: prereqsMet ? "available" : "locked",
    };
  });
};

const isDiagnosticComplete = () =>
  (state.pedagogicalState.diagnosticStatus ?? state.pedagogicalState.assessmentStatus) === "complete";

const renderConceptMapView = () => {
  const nodes = deriveConceptStatuses();
  const rows = nodes
    .map(
      (node) => `
        <li class="concept-node" data-node-state="${node.state.replaceAll(" ", "-")}">
          <div>
            <strong>${node.label}</strong>
            <p class="helper">Prerequisites: ${node.prerequisites.length ? node.prerequisites.join(", ") : "None"}</p>
          </div>
          <span class="status-pill subtle">${node.state}</span>
        </li>
      `,
    )
    .join("");

  sceneRoot.innerHTML = `
    <div class="scene-body">
      <h2>Algebra foundations concept map</h2>
      <p class="helper">Tech-tree style progress view for the bounded MVP module.</p>
      <ul class="concept-map-list">${rows}</ul>
      <div class="trace-actions">
        <button id="resume-lesson-button" type="button" class="choice-button">Resume lesson</button>
      </div>
    </div>
  `;

  sceneRoot.querySelector("#resume-lesson-button")?.addEventListener("click", () => {
    if (lastLessonScene) {
      renderScene(lastLessonScene);
      return;
    }
    renderCurrentDecisionScene().catch((error) => {
      console.error("Resume lesson failed", error);
      renderScene(createFallbackScene("resume-failure"));
    });
  });
  setStatus("Concept map loaded.");
};

const stopAudioAndInput = () => {
  globalThis.speechSynthesis?.cancel();
  recognition?.stop();
  setOrbState(state.consentAndSettings.soundEnabled ? "idle" : "muted");
  setLoading("Interrupted");
};

const speakScene = (scene) => {
  speakText(scene.narration.text);
};

const renderScene = (scene) => {
  activeTracePad?.destroy();
  activeTracePad = null;
  currentDecision = nextCurriculumDecision(state);
  const runtimeScene = normalizeSceneForRuntime(scene, state);
  const result = interpretScene(runtimeScene, currentDecision);
  const safeScene = result.ok ? result.blueprint : createFallbackScene("validation-failure");
  const interactionType = safeScene.interaction.type;

  currentScene = safeScene;
  lastLessonScene = safeScene;
  state = setActiveScene(state, safeScene);
  if (safeScene.visualIntent?.recipeId) {
    state = updateAssetAccess(state, "shell-core");
  }
  persistState();
  persistScene(safeScene);

  const choiceMarkup = safeScene.interaction.options
    ?.map(
      (option) => `
        <button
          type="button"
          class="choice-button"
          data-choice-id="${option.id}"
          data-correct="${option.correct ? "true" : "false"}"
        >
          ${option.label}
        </button>
      `,
    )
    .join("");

  const traceMarkup =
    interactionType === "trace-symbol"
      ? `
        <div class="trace-stage">
          <div class="trace-board">
            <div class="trace-guide">${safeScene.interaction.target}</div>
            <canvas class="trace-canvas" id="trace-canvas"></canvas>
          </div>
          <p class="trace-hint">Trace over the large ${safeScene.interaction.target}. When the shape feels clear, tap Continue.</p>
          <div class="trace-actions">
            <button type="button" class="choice-button" id="trace-clear-button">Clear</button>
            <button
              type="button"
              class="choice-button"
              id="trace-continue-button"
              data-trace-action="continue"
              disabled
            >
              Continue
            </button>
            <button type="button" class="choice-button" data-choice-id="skip" data-correct="false">
              Skip for now
            </button>
          </div>
        </div>
      `
      : "";

  const repeatMarkup =
    interactionType === "repeat-sound"
      ? `
        <div class="choice-grid">
          <button type="button" class="choice-button" id="repeat-audio-button">
            Play "${safeScene.interaction.phoneme}" again
          </button>
          <button type="button" class="choice-button" id="repeat-tap-path-button">
            Use tap path
          </button>
        </div>
      `
      : "";

  const continueMarkup =
    interactionType === "none"
      ? `
        <div class="trace-actions">
          <button type="button" class="choice-button" id="continue-scene-button">
            Continue
          </button>
        </div>
      `
      : "";

  const readRespondMarkup =
    interactionType === "read-respond"
      ? `
        <div class="trace-stage">
          <p class="trace-hint">${safeScene.interaction.prompt}</p>
          <input id="read-respond-input" class="response-input" type="text" maxlength="80" />
          <div class="trace-actions">
            <button type="button" class="choice-button" id="read-respond-submit">Submit</button>
            <button type="button" class="choice-button" id="read-respond-skip">Skip</button>
          </div>
        </div>
      `
      : "";

  const mathInputMarkup =
    interactionType === "math-input"
      ? `
        <div class="trace-stage">
          <p class="trace-hint">${safeScene.interaction.expressionPrompt}</p>
          <input id="math-response-input" class="response-input" type="text" inputmode="text" maxlength="80" />
          <div class="trace-actions">
            <button type="button" class="choice-button" id="math-response-submit">Submit</button>
            <button type="button" class="choice-button" id="math-response-skip">Skip</button>
          </div>
        </div>
      `
      : "";

  sceneRoot.innerHTML = `
    <div class="scene-body">
      <div class="scene-meta">
        <span>${safeScene.scene.kind}</span>
        <span>${interactionType}</span>
      </div>
      <h2>${safeScene.narration.text}</h2>
      ${
        interactionType === "tap-choice"
          ? `<div class="choice-grid">${choiceMarkup}</div>`
          : traceMarkup || repeatMarkup || readRespondMarkup || mathInputMarkup || continueMarkup
      }
      ${
        state.consentAndSettings.captionsEnabled
          ? `<p class="helper">Objective: ${safeScene.scene.objectiveId}</p>`
          : ""
      }
    </div>
  `;

  sceneRoot.querySelectorAll("[data-choice-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const masteryTarget = currentDecision.conceptId ?? currentDecision.activeDomain;
      const correct = button.dataset.correct === "true";
      const choiceId = button.dataset.choiceId;

      state = appendRecentTurn(state, {
        role: "user",
        content: `interaction:${safeScene.scene.objectiveId}:${choiceId}`,
      });
      latestInput = {
        type: "tap-choice",
        content: `${safeScene.scene.objectiveId}:${choiceId}`,
      };

      if (!isDiagnosticComplete()) {
        state = advanceAssessment(state, {
          recommendedConceptId: correct
            ? currentDecision.conceptId
            : state.pedagogicalState.recommendedConceptId ?? "variables-and-expressions",
        });
        setStatus("Assessment updated locally.");
      } else {
        state = applyMasteryEvidence(state, masteryTarget, correct ? 1 : 0);
        setStatus(correct ? "Progress saved." : "Saved. Another path is ready.");
      }

      persistState();
      await renderCurrentDecisionScene();
    });
  });

  if (interactionType === "trace-symbol") {
    const canvas = sceneRoot.querySelector("#trace-canvas");
    const continueButton = sceneRoot.querySelector("#trace-continue-button");
    const clearButton = sceneRoot.querySelector("#trace-clear-button");
    const skipButton = [...sceneRoot.querySelectorAll("[data-choice-id='skip']")][0];
    const pad = createTracePad(canvas, (ready) => {
      if (continueButton) {
        continueButton.disabled = !ready;
      }
    });
    activeTracePad = pad ?? null;

    continueButton?.addEventListener("click", async (event) => {
      event.preventDefault();
      const traceMetrics = pad?.getTraceMetrics();
      const traceScore = scoreTrace(traceMetrics?.points ?? [], traceMetrics?.bounds);
      const masteryTarget = currentDecision.conceptId ?? currentDecision.activeDomain;
      latestInput = {
        type: "trace-result",
        content: `confidence:${traceScore.confidence}`,
      };

      if (traceScore.success) {
        state = appendRecentTurn(state, {
          role: "user",
          content: `trace:${safeScene.interaction.target}:local:${traceScore.confidence}`,
        });
        if (!isDiagnosticComplete()) {
          state = advanceAssessment(state, { recommendedConceptId: currentDecision.conceptId });
        } else {
          state = applyMasteryEvidence(state, masteryTarget, 1);
        }
        persistState();
        setStatus(`Trace accepted locally (${traceScore.confidence}).`);
        await renderCurrentDecisionScene();
        return;
      }

      if (
        traceScore.ambiguous &&
        state.consentAndSettings.cloudEnabled &&
        state.consentAndSettings.cloudVisionEnabled &&
        APP_CONFIG.features.cloudVision
      ) {
        setLoading("Checking trace");
        const relayResult = await requestVisionInterpretation({
          traceDataUrl: traceMetrics?.dataUrl ?? "",
          decision: currentDecision,
          target: safeScene.interaction.target,
        });
        setLoading("Idle");

        if (relayResult.ok && relayResult.response.success) {
          state = appendRecentTurn(state, {
            role: "user",
            content: `trace:${safeScene.interaction.target}:vision:${relayResult.response.confidence}`,
          });
          if (!isDiagnosticComplete()) {
            state = advanceAssessment(state, { recommendedConceptId: currentDecision.conceptId });
          } else {
            state = applyMasteryEvidence(state, masteryTarget, 1);
          }
          persistState();
          setStatus(relayResult.response.feedbackAudio || "Trace accepted after review.");
          await renderCurrentDecisionScene();
          return;
        }
      }

      setStatus(
        traceScore.ambiguous
          ? "Trace was close. Try one clearer stroke before continuing."
          : "Trace needs a larger, clearer shape before continuing.",
      );
    });

    clearButton?.addEventListener("click", () => {
      pad?.clear();
      setStatus("Trace cleared.");
    });

    skipButton?.addEventListener("click", () => {
      latestInput = {
        type: "trace-result",
        content: "skipped",
      };
    });
  }

  if (interactionType === "repeat-sound") {
    const repeatAudioButton = sceneRoot.querySelector("#repeat-audio-button");
    const tapPathButton = sceneRoot.querySelector("#repeat-tap-path-button");

    repeatAudioButton?.addEventListener("click", () => {
      latestInput = {
        type: "system-start",
        content: `repeat:${safeScene.interaction.phoneme}`,
      };
      speakText(safeScene.interaction.phoneme, `Repeated "${safeScene.interaction.phoneme}".`);
    });

    tapPathButton?.addEventListener("click", () => {
      latestInput = {
        type: "tap-choice",
        content: `${safeScene.scene.objectiveId}:tap-path`,
      };
      renderScene(normalizeSceneForRuntime(safeScene, updateConsentSettings(state, { soundEnabled: false })));
      setStatus("Tap path opened for this step.");
    });
  }

  if (interactionType === "none") {
    sceneRoot.querySelector("#continue-scene-button")?.addEventListener("click", async () => {
      latestInput = {
        type: "tap-choice",
        content: `${safeScene.scene.objectiveId}:continue`,
      };
      state = appendRecentTurn(state, {
        role: "user",
        content: `continue:${safeScene.scene.objectiveId}`,
      });
      persistState();
      await renderCurrentDecisionScene();
    });
  }

  if (interactionType === "read-respond") {
    const input = sceneRoot.querySelector("#read-respond-input");
    const submitButton = sceneRoot.querySelector("#read-respond-submit");
    const skipButton = sceneRoot.querySelector("#read-respond-skip");

    submitButton?.addEventListener("click", async () => {
      const masteryTarget = currentDecision.conceptId ?? currentDecision.activeDomain;
      const response = String(input?.value ?? "").trim().toLowerCase();
      const expected = safeScene.interaction.expectedKeywords.map((value) => String(value).toLowerCase());
      const correct = expected.some((keyword) => response.includes(keyword));
      latestInput = {
        type: "transcript",
        content: response || "empty",
      };
      state = appendRecentTurn(state, {
        role: "user",
        content: `read-respond:${safeScene.scene.objectiveId}:${response || "empty"}`,
      });
      if (!isDiagnosticComplete()) {
        state = advanceAssessment(state, {
          recommendedConceptId: correct ? currentDecision.conceptId : state.pedagogicalState.recommendedConceptId,
        });
        setStatus(correct ? "Diagnostic note saved." : "Saved. Primer will continue the diagnostic.");
      } else {
        state = applyMasteryEvidence(state, masteryTarget, correct ? 1 : 0);
        setStatus(correct ? "Explanation recorded." : "Saved. Try another response on the next step.");
      }
      persistState();
      await renderCurrentDecisionScene();
    });

    skipButton?.addEventListener("click", async () => {
      latestInput = {
        type: "tap-choice",
        content: `${safeScene.scene.objectiveId}:skip-read-respond`,
      };
      state = appendRecentTurn(state, {
        role: "user",
        content: `read-respond-skip:${safeScene.scene.objectiveId}`,
      });
      if (!isDiagnosticComplete()) {
        state = advanceAssessment(state, {
          recommendedConceptId: state.pedagogicalState.recommendedConceptId ?? currentDecision.conceptId,
        });
        setStatus("Skipped. Primer will continue the diagnostic.");
      }
      persistState();
      await renderCurrentDecisionScene();
    });
  }

  if (interactionType === "math-input") {
    const input = sceneRoot.querySelector("#math-response-input");
    const submitButton = sceneRoot.querySelector("#math-response-submit");
    const skipButton = sceneRoot.querySelector("#math-response-skip");

    submitButton?.addEventListener("click", async () => {
      const masteryTarget = currentDecision.conceptId ?? currentDecision.activeDomain;
      const response = String(input?.value ?? "").trim();
      const validation = validateMathInputResponse(response, safeScene.interaction.expectedExpression);
      latestInput = {
        type: "math-input",
        content: response || "empty",
      };
      state = appendRecentTurn(state, {
        role: "user",
        content: `math-input:${safeScene.scene.objectiveId}:${response || "empty"}`,
      });

      if (!isDiagnosticComplete()) {
        state = advanceAssessment(state, {
          recommendedConceptId: validation.correct
            ? currentDecision.conceptId
            : state.pedagogicalState.recommendedConceptId ?? currentDecision.conceptId,
        });
        setStatus(validation.correct ? "Diagnostic step accepted." : `Saved with ${validation.reason} feedback.`);
      } else {
        state = applyMasteryEvidence(state, masteryTarget, validation.correct ? 1 : 0);
        setStatus(validation.correct ? "Validated and saved." : `Saved with ${validation.reason} feedback.`);
      }

      persistState();
      await renderCurrentDecisionScene();
    });

    skipButton?.addEventListener("click", async () => {
      latestInput = {
        type: "tap-choice",
        content: `${safeScene.scene.objectiveId}:skip-math-input`,
      };
      state = appendRecentTurn(state, {
        role: "user",
        content: `math-input-skip:${safeScene.scene.objectiveId}`,
      });
      if (!isDiagnosticComplete()) {
        state = advanceAssessment(state, {
          recommendedConceptId: state.pedagogicalState.recommendedConceptId ?? currentDecision.conceptId,
        });
        setStatus("Skipped. Primer will continue the diagnostic.");
      }
      persistState();
      await renderCurrentDecisionScene();
    });
  }

  capabilityIndicator.textContent = `Capability tier: ${state.capabilities.tier}`;
  listenButton.disabled = !(capabilitySnapshot.localSTT && capabilitySnapshot.microphone);
  listenButton.dataset.orbState = orbState;
  speakScene(safeScene);
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
};

const maybeQueueSceneImage = async (scene) => {
  if (
    !state.consentAndSettings.cloudEnabled ||
    !state.consentAndSettings.cloudImageEnabled ||
    !APP_CONFIG.features.cloudImage
  ) {
    return;
  }

  const result = await queueImageGeneration({ scene });
  if (result.ok && result.response.status === "queued") {
    setStatus("Scene ready. Optional image queued in the background.");
  }
};

const renderCurrentDecisionScene = async () => {
  const decision = nextCurriculumDecision(state);
  const localScene = createSceneFromDecision(decision);
  const hasProviderKey = typeof state.providerConfig?.apiKey === "string" && state.providerConfig.apiKey.length > 0;

  if (state.consentAndSettings.cloudEnabled && hasProviderKey) {
    setLoading("Checking scene");
    const relayResult = await requestDirectorScene({
      state,
      decision,
      latestInput,
      localScene,
    });
    setLoading("Idle");

    if (relayResult.ok) {
      renderScene(relayResult.blueprint);
      maybeQueueSceneImage(relayResult.blueprint).catch((error) => {
        console.error("Image queue failed", error);
      });
      return;
    }

    setStatus("Relay unavailable. Continuing in local deterministic mode.");
  } else if (state.consentAndSettings.cloudEnabled && !hasProviderKey) {
    setStatus("Cloud assist is enabled, but no API key is configured. Using local deterministic mode.");
  }

  renderScene(localScene);
  maybeQueueSceneImage(localScene).catch((error) => {
    console.error("Image queue failed", error);
  });
};

const updateSettingsForm = () => {
  soundEnabledInput.checked = state.consentAndSettings.soundEnabled;
  captionsEnabledInput.checked = state.consentAndSettings.captionsEnabled;
  cloudEnabledInput.checked = state.consentAndSettings.cloudEnabled;
  if (providerNameInput) providerNameInput.value = state.providerConfig?.providerName ?? "";
  if (providerModelInput) providerModelInput.value = state.providerConfig?.modelName ?? "";
  if (providerEndpointInput) providerEndpointInput.value = state.providerConfig?.endpointUrl ?? "";
  if (providerApiKeyInput) providerApiKeyInput.value = state.providerConfig?.apiKey ?? "";
  cloudImageEnabledInput.checked = state.consentAndSettings.cloudImageEnabled;
  cloudVisionEnabledInput.checked = state.consentAndSettings.cloudVisionEnabled;
  encryptedExportEnabledInput.checked = APP_CONFIG.features.encryptedExport;
  telemetryEnabledInput.checked = state.consentAndSettings.telemetryEnabled;
  adminPinEnabledInput.checked = state.consentAndSettings.adminPinEnabled;
  adminPinInput.value = "";
  const quota = state.assetIndex.quotaEstimate?.quota ?? null;
  const usage = state.assetIndex.quotaEstimate?.usage ?? null;
  const installedBytes = estimateInstalledAssetBytes(state);
  const installedAssets = listInstalledAssets(state);
  storageIndicator.textContent =
    `Storage persistence: ${state.consentAndSettings.storagePersistenceGranted}. ` +
    `Relay: ${APP_CONFIG.relayBaseUrl || "disabled"}. Provider: ${state.providerConfig?.providerName || "unset"}. ` +
    (quota ? `Usage ${Math.round((usage ?? 0) / 1024)} KB of ${Math.round(quota / 1024)} KB.` : "Usage estimate unavailable.");
  assetIndicator.textContent =
    `Assets: ${installedAssets.length} installed, ${Math.round(installedBytes / 1024)} KB local.`;
  adminIndicator.textContent =
    `Admin PIN: ${state.consentAndSettings.adminPinEnabled ? "enabled" : "off"}. ` +
    `Admin actions: ${state.consentAndSettings.adminUnlocked ? "unlocked" : "locked"}.`;
  unlockAdminButton.disabled = !state.consentAndSettings.adminPinEnabled;
  resetButton.disabled = state.consentAndSettings.adminPinEnabled && !state.consentAndSettings.adminUnlocked;
};

const syncStorageStatus = async () => {
  if (!navigator.storage?.persisted) {
    return;
  }

  const persisted = await navigator.storage.persisted();
  state = updateConsentSettings(state, {
    storagePersistenceGranted: persisted ? "granted" : "not-granted",
  });
  const quotaEstimate = await estimateStorage(globalThis);
  state = updateQuotaEstimate(state, quotaEstimate);
  persistState();
  updateSettingsForm();
};

const exportBackup = () => {
  const payload = JSON.stringify({ state, scene: currentScene }, null, 2);
  let data = payload;
  let filename = "primer-backup.json";

  if (APP_CONFIG.features.encryptedExport && encryptedExportEnabledInput.checked) {
    const passphrase = globalThis.prompt("Enter a passphrase for the encrypted backup:");
    if (!passphrase) {
      setStatus("Encrypted export cancelled.");
      return;
    }
    data = encryptBackupPayload(payload, passphrase);
    filename = "primer-backup.encrypted.json";
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Backup exported locally.");
};

const importBackup = async (file) => {
  let text = await file.text();
  if (file.name.endsWith(".encrypted.json")) {
    const passphrase = globalThis.prompt("Enter the backup passphrase:");
    if (!passphrase) {
      throw new Error("Missing backup passphrase.");
    }
    text = decryptBackupPayload(text, passphrase);
  }
  const parsed = JSON.parse(text);
  state = hydrateAssetIndex(
    createDefaultState({
      ...migrateState(parsed.state),
      capabilities: capabilitySnapshot,
    }),
  );
  currentScene = parsed.scene ?? null;
  persistState();
  if (currentScene) {
    persistScene(currentScene);
    renderScene(currentScene);
  } else {
    removeStorage(SCENE_KEY);
    renderCurrentDecisionScene();
  }
  updateSettingsForm();
  setStatus("Backup restored locally.");
};

fallbackButton?.addEventListener("click", () => {
  stopAudioAndInput();
  renderScene(createFallbackScene("manual"));
});

conceptMapButton?.addEventListener("click", () => {
  stopAudioAndInput();
  renderConceptMapView();
});

replayButton?.addEventListener("click", () => {
  if (currentScene) {
    speakScene(currentScene);
    setStatus("Narration replayed.");
  }
});

stopButton?.addEventListener("click", () => {
  stopAudioAndInput();
  setStatus("Playback stopped.");
});

listenButton?.addEventListener("click", () => {
  if (!recognitionCtor || !(capabilitySnapshot.localSTT && capabilitySnapshot.microphone)) {
    setOrbState("error");
    setStatus("Listening is unavailable. Tap controls remain available.");
    return;
  }

  stopAudioAndInput();
  recognition = new recognitionCtor();
  recognition.lang = state.learnerProfile.locale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    setOrbState("listening");
    setLoading("Listening");
    setStatus("Listening locally where supported.");
  };
  recognition.onresult = (event) => {
    setOrbState("thinking");
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    state = appendRecentTurn(state, { role: "user", content: `speech:${transcript}` });
    persistState();
    latestInput = {
      type: "transcript",
      content: transcript || "empty",
    };
    setStatus(`Heard: ${transcript || "nothing clear"}`);
    renderCurrentDecisionScene().catch((error) => {
      console.error("Voice follow-up failed", error);
    });
  };
  recognition.onerror = () => {
    setOrbState("error");
    setStatus("Listening failed. Tap controls remain available.");
    setLoading("Idle");
  };
  recognition.onend = () => {
    if (orbState === "listening" || orbState === "thinking") {
      setOrbState(state.consentAndSettings.soundEnabled ? "idle" : "muted");
    }
    setLoading("Idle");
  };
  recognition.start();
});

settingsButton?.addEventListener("click", () => {
  updateSettingsForm();
  settingsDialog?.showModal();
});

soundEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, { soundEnabled: soundEnabledInput.checked });
  persistState();
  setOrbState(soundEnabledInput.checked ? "idle" : "muted");
});

captionsEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, { captionsEnabled: captionsEnabledInput.checked });
  persistState();
  renderScene(currentScene ?? createFallbackScene("captions"));
});

saveProviderButton?.addEventListener("click", () => {
  updateProviderConfig({
    providerName: providerNameInput?.value.trim() || "openrouter",
    modelName: providerModelInput?.value.trim() || "",
    endpointUrl: providerEndpointInput?.value.trim() || "",
    apiKey: providerApiKeyInput?.value.trim() || "",
    configuredAt: new Date().toISOString(),
  });
  persistState();
  updateSettingsForm();
  setStatus("Provider settings saved locally.");
});

cloudEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, {
    cloudEnabled: cloudEnabledInput.checked,
    cloudImageEnabled: cloudEnabledInput.checked,
    cloudVisionEnabled: cloudEnabledInput.checked,
  });
  persistState();
  updateSettingsForm();
});

cloudImageEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, { cloudImageEnabled: cloudImageEnabledInput.checked });
  persistState();
  updateSettingsForm();
});

cloudVisionEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, { cloudVisionEnabled: cloudVisionEnabledInput.checked });
  persistState();
  updateSettingsForm();
});

telemetryEnabledInput?.addEventListener("change", () => {
  state = updateConsentSettings(state, { telemetryEnabled: telemetryEnabledInput.checked });
  persistState();
  updateSettingsForm();
  setStatus(telemetryEnabledInput.checked ? "Telemetry opt-in enabled." : "Telemetry opt-in disabled.");
});

adminPinEnabledInput?.addEventListener("change", () => {
  if (!adminPinEnabledInput.checked) {
    state = clearAdminPin(state);
    persistState();
    updateSettingsForm();
    setStatus("Admin PIN removed.");
    return;
  }

  setStatus("Enter a PIN and save it to protect admin actions.");
});

savePinButton?.addEventListener("click", () => {
  const pin = adminPinInput.value.trim();
  if (pin.length < 4) {
    setStatus("Admin PIN must be at least 4 digits or characters.");
    return;
  }

  state = setAdminPin(state, pin);
  persistState();
  updateSettingsForm();
  setStatus("Admin PIN saved locally.");
});

unlockAdminButton?.addEventListener("click", () => {
  const pin = adminPinInput.value.trim();
  if (!state.consentAndSettings.adminPinEnabled) {
    setStatus("Admin PIN is not enabled.");
    return;
  }

  if (!verifyAdminPin(state, pin)) {
    setStatus("Admin PIN did not match.");
    return;
  }

  state = unlockAdmin(state);
  persistState();
  updateSettingsForm();
  setStatus("Admin actions unlocked for this session.");
});

resetButton?.addEventListener("click", () => {
  if (state.consentAndSettings.adminPinEnabled && !state.consentAndSettings.adminUnlocked) {
    setStatus("Unlock admin actions before resetting local learner data.");
    return;
  }

  const confirmed = globalThis.confirm("Reset local learner progress and restore the baseline path?");
  if (!confirmed) {
    return;
  }

  state = lockAdmin(resetLearnerState(state));
  currentScene = null;
  persistState();
  removeStorage(SCENE_KEY);
  updateSettingsForm();
  setStatus("Local learner progress reset.");
  renderCurrentDecisionScene().catch((error) => {
    console.error("Reset render failed", error);
    renderScene(createFallbackScene("reset-failure"));
  });
});

requestPersistenceButton?.addEventListener("click", async () => {
  if (!navigator.storage?.persist) {
    setStatus("Persistent storage request is unavailable here.");
    return;
  }

  const granted = await navigator.storage.persist();
  state = updateConsentSettings(state, {
    storagePersistenceGranted: granted ? "granted" : "not-granted",
  });
  persistState();
  updateSettingsForm();
  setStatus(granted ? "Persistent storage granted." : "Persistent storage not granted.");
});

installAssetsButton?.addEventListener("click", async () => {
  const plan = getAssetInstallPlan(state);
  if (plan.assets.length === 0) {
    setStatus("Starter assets are already installed for this device tier.");
    return;
  }

  const quotaEstimate = (await estimateStorage(globalThis)) ?? state.assetIndex.quotaEstimate;
  if (quotaEstimate) {
    state = updateQuotaEstimate(state, quotaEstimate);
  }
  const availableBytes =
    quotaEstimate?.quota && quotaEstimate?.usage ? quotaEstimate.quota - quotaEstimate.usage : null;

  if (availableBytes !== null && plan.totalBytes > availableBytes) {
    setStatus("Not enough local storage for the optional asset pack. Clear cache or request more space.");
    persistState();
    updateSettingsForm();
    return;
  }

  if (plan.totalBytes > 1_000_000) {
    const confirmed = globalThis.confirm(
      `Install ${plan.assets.length} optional asset${plan.assets.length === 1 ? "" : "s"} ` +
        `(${Math.round(plan.totalBytes / 1024)} KB) on this device?`,
    );
    if (!confirmed) {
      setStatus("Optional asset install cancelled.");
      return;
    }
  }

  for (const asset of plan.assets) {
    const result = installAssetRecord(state, asset.id);
    state = result.state;
  }

  persistState();
  updateSettingsForm();
  setStatus(`Installed ${plan.assets.length} optional local asset${plan.assets.length === 1 ? "" : "s"}.`);
});

evictAssetsButton?.addEventListener("click", () => {
  const result = evictNonEssentialAssets(state);
  state = result.state;
  persistState();
  updateSettingsForm();
  setStatus(
    result.evicted > 0
      ? `Cleared ${result.evicted} non-essential cached asset${result.evicted === 1 ? "" : "s"}.`
      : "No non-essential cached assets were installed.",
  );
});

refreshStorageButton?.addEventListener("click", async () => {
  const quotaEstimate = await estimateStorage(globalThis);
  state = updateQuotaEstimate(state, quotaEstimate);
  persistState();
  updateSettingsForm();
  setStatus(quotaEstimate ? "Storage estimate refreshed." : "Storage estimate is unavailable on this device.");
});

exportButton?.addEventListener("click", () => {
  exportBackup();
});

importButton?.addEventListener("click", () => {
  importInput?.click();
});

importInput?.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) {
    return;
  }
  try {
    await importBackup(file);
    state = hydrateAssetIndex(state);
    updateSettingsForm();
  } catch (error) {
    console.error("Import failed", error);
    setStatus("Import failed. The existing learner data was kept.");
  } finally {
    importInput.value = "";
  }
});

if (APP_CONFIG.appMode !== "test") {
  registerServiceWorker();
}

syncStorageStatus().catch((error) => {
  console.error("Storage check failed", error);
});

setOrbState(state.consentAndSettings.soundEnabled ? "idle" : "muted");

const restoredScene = hydrateScene();
if (!state.moduleSelection?.selectedAt) {
  setStatus("Choose a module to begin.");
  renderModuleSelectionView();
} else if (restoredScene) {
  setStatus("Restored the last safe scene.");
  renderScene(recoverSceneForRuntime(restoredScene, state));
} else {
  setStatus("Starting with the local baseline path.");
  renderCurrentDecisionScene().catch((error) => {
    console.error("Initial scene render failed", error);
    renderScene(createFallbackScene("startup-failure"));
  });
}
