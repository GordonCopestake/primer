import { APP_CONFIG } from "./config.js";

const lessonKinds = ["lesson", "practice", "review", "reward", "fallback"];

const assessmentSequence = [
  {
    objectiveId: "baseline.observe-sound.0",
    activeDomain: "preliteracy",
    literacyStage: 0,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "repeat-sound", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 90,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.symbol-match.1",
    activeDomain: "preliteracy",
    literacyStage: 1,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "trace-symbol", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 96,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.trace-letter.2",
    activeDomain: "writing",
    literacyStage: 2,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["trace-symbol", "tap-choice", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 104,
    maxPromptComplexity: 1,
  },
  {
    objectiveId: "baseline.read-short.3",
    activeDomain: "reading",
    literacyStage: 3,
    allowedSceneKinds: ["assessment", "fallback"],
    allowedInteractionTypes: ["tap-choice", "repeat-sound", "none"],
    cloudEscalationAllowed: false,
    maxNarrationChars: 120,
    maxPromptComplexity: 2,
  },
];

const readingDecision = (stage = 1) => ({
  objectiveId: `reading.symbol-match.${stage}`,
  activeDomain: "reading",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["tap-choice", "trace-symbol", "repeat-sound", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
});

const writingDecision = (stage = 1) => ({
  objectiveId: `writing.trace-and-build.${stage}`,
  activeDomain: "writing",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["trace-symbol", "tap-choice", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 110,
  maxPromptComplexity: 2,
});

const numeracyDecision = (stage = 1) => ({
  objectiveId: `numeracy.more-less.${stage}`,
  activeDomain: "numeracy",
  literacyStage: stage,
  allowedSceneKinds: lessonKinds,
  allowedInteractionTypes: ["tap-choice", "none"],
  cloudEscalationAllowed: APP_CONFIG.features.cloudDirector,
  maxNarrationChars: 120,
  maxPromptComplexity: 2,
});

const getMasteryScore = (state, domain) => state.pedagogicalState.domainStage[domain] ?? 0;

export const nextCurriculumDecision = (state) => {
  if (state.pedagogicalState.assessmentStatus !== "complete") {
    const step = Math.max(
      0,
      Math.min(state.pedagogicalState.assessmentStep ?? 0, assessmentSequence.length - 1),
    );
    return assessmentSequence[step];
  }

  const readingScore = getMasteryScore(state, "reading");
  const writingScore = getMasteryScore(state, "writing");
  const numeracyScore = getMasteryScore(state, "numeracy");
  const currentObjectiveId = state.pedagogicalState.currentObjectiveId ?? "";

  if (currentObjectiveId.startsWith("reading.") && readingScore <= Math.max(writingScore, numeracyScore)) {
    return readingDecision(Math.max(1, readingScore));
  }

  if (readingScore <= writingScore && readingScore <= numeracyScore) {
    return readingDecision(Math.max(1, readingScore));
  }

  if (writingScore <= numeracyScore) {
    return writingDecision(Math.max(1, writingScore));
  }

  return numeracyDecision(Math.max(1, numeracyScore));
};

export const recordAssessmentCompletion = (state, literacyStage = 1) => ({
  ...state,
  pedagogicalState: {
    ...state.pedagogicalState,
    assessmentStep: assessmentSequence.length,
    assessmentStatus: "complete",
    literacyStage,
    currentObjectiveId: readingDecision(Math.max(1, literacyStage)).objectiveId,
    domainStage: {
      ...state.pedagogicalState.domainStage,
      reading: Math.max(state.pedagogicalState.domainStage.reading, literacyStage),
      writing: Math.max(state.pedagogicalState.domainStage.writing, literacyStage - 1),
      numeracy: Math.max(state.pedagogicalState.domainStage.numeracy, Math.min(2, literacyStage)),
    },
  },
});

export const advanceAssessment = (state, demonstratedStage = null) => {
  const currentStep = state.pedagogicalState.assessmentStep ?? 0;
  const inferredStage = demonstratedStage ?? currentStep;
  const nextStep = currentStep + 1;

  if (nextStep >= assessmentSequence.length) {
    return recordAssessmentCompletion(state, Math.max(0, Math.min(3, inferredStage)));
  }

  return {
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      assessmentStatus: "in-progress",
      assessmentStep: nextStep,
      literacyStage: Math.max(state.pedagogicalState.literacyStage, inferredStage),
      currentObjectiveId: assessmentSequence[nextStep].objectiveId,
    },
  };
};

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
