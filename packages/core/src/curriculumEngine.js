import { APP_CONFIG } from "./config.js";

const assessmentDecision = {
  objectiveId: "baseline.audio-choice.1",
  activeDomain: "preliteracy",
  literacyStage: 0,
  allowedSceneKinds: ["assessment", "fallback"],
  allowedInteractionTypes: ["tap-choice", "repeat-sound", "trace-symbol", "none"],
  cloudEscalationAllowed: false,
  maxNarrationChars: 90,
  maxPromptComplexity: 1,
};

const readingDecision = {
  objectiveId: "reading.symbol-match.1",
  activeDomain: "reading",
  literacyStage: 1,
  allowedSceneKinds: ["lesson", "practice", "review", "reward", "fallback"],
  allowedInteractionTypes: ["tap-choice", "trace-symbol", "repeat-sound", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
};

const numeracyDecision = {
  objectiveId: "numeracy.more-less.1",
  activeDomain: "numeracy",
  literacyStage: 1,
  allowedSceneKinds: ["lesson", "practice", "review", "reward", "fallback"],
  allowedInteractionTypes: ["tap-choice", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
};

const getMasteryScore = (state, domain) => state.pedagogicalState.domainStage[domain] ?? 0;

export const nextCurriculumDecision = (state) => {
  if (state.pedagogicalState.assessmentStatus !== "complete") {
    return assessmentDecision;
  }

  const readingScore = getMasteryScore(state, "reading");
  const numeracyScore = getMasteryScore(state, "numeracy");
  return readingScore <= numeracyScore ? readingDecision : numeracyDecision;
};

export const recordAssessmentCompletion = (state, literacyStage = 1) => ({
  ...state,
  pedagogicalState: {
    ...state.pedagogicalState,
    assessmentStatus: "complete",
    literacyStage,
    currentObjectiveId: readingDecision.objectiveId,
    domainStage: {
      ...state.pedagogicalState.domainStage,
      reading: Math.max(state.pedagogicalState.domainStage.reading, literacyStage),
      writing: Math.max(state.pedagogicalState.domainStage.writing, literacyStage - 1),
      numeracy: Math.max(state.pedagogicalState.domainStage.numeracy, 1),
    },
  },
});

export const applyMasteryEvidence = (state, domain, delta = 1) => ({
  ...state,
  pedagogicalState: {
    ...state.pedagogicalState,
    domainStage: {
      ...state.pedagogicalState.domainStage,
      [domain]: Math.max(0, (state.pedagogicalState.domainStage[domain] ?? 0) + delta),
    },
  },
});
