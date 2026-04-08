import {
  ALGEBRA_DIAGNOSTIC_ITEMS,
  ALGEBRA_FOUNDATIONS_MODULE,
  getRecommendedConceptId,
} from "./algebraModule.js";
import { createDefaultState } from "./state.js";

const DIAGNOSTIC_SCENE_KINDS = ["assessment", "fallback"];
const LESSON_SCENE_KINDS = ["lesson", "practice", "review", "fallback"];

const makeDiagnosticDecision = (state, item) => ({
  moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
  activeDomain: "mathematics",
  phase: "diagnostic",
  conceptId: item.conceptId,
  objectiveId: item.id,
  prompt: item.prompt,
  inputType: item.inputType,
  allowedSceneKinds: DIAGNOSTIC_SCENE_KINDS,
  allowedInteractionTypes:
    item.inputType === "multiple-choice"
      ? ["tap-choice", "none"]
      : item.inputType === "short-explanation"
        ? ["read-respond", "none"]
        : ["math-input", "none"],
  maxNarrationChars: 180,
  recommendedConceptId: state.pedagogicalState.recommendedConceptId,
});

const makeConceptDecision = (state, conceptId) => {
  const concept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((item) => item.id === conceptId);

  return {
    moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
    activeDomain: "mathematics",
    phase: "tutoring",
    conceptId,
    objectiveId: `concept.${conceptId}`,
    prompt: concept?.description ?? "Continue with the next algebra concept.",
    allowedSceneKinds: LESSON_SCENE_KINDS,
    allowedInteractionTypes: ["math-input", "tap-choice", "read-respond", "none"],
    maxNarrationChars: 220,
    recommendedConceptId: state.pedagogicalState.recommendedConceptId,
  };
};

const getDiagnosticItem = (step) => ALGEBRA_DIAGNOSTIC_ITEMS[Math.max(0, Math.min(step, ALGEBRA_DIAGNOSTIC_ITEMS.length - 1))];

const appendUniqueRecentActivity = (state, activity) => {
  const nextActivity = [...state.pedagogicalState.recentActivity, activity].slice(-10);
  return {
    ...state.pedagogicalState,
    recentActivity: nextActivity,
  };
};

export const nextCurriculumDecision = (state) => {
  if (state.pedagogicalState.diagnosticStatus !== "complete") {
    return makeDiagnosticDecision(state, getDiagnosticItem(state.pedagogicalState.diagnosticStep ?? 0));
  }

  const recommendedConceptId =
    state.pedagogicalState.currentConceptId ??
    state.pedagogicalState.recommendedConceptId ??
    getRecommendedConceptId(state.pedagogicalState.masteryByConcept);

  return makeConceptDecision(state, recommendedConceptId);
};

export const recordAssessmentCompletion = (state, recommendedConceptId = "variables-and-expressions") =>
  createDefaultState({
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      diagnosticStep: ALGEBRA_DIAGNOSTIC_ITEMS.length,
      diagnosticStatus: "complete",
      readiness: "ready",
      currentConceptId: recommendedConceptId,
      currentObjectiveId: `concept.${recommendedConceptId}`,
      recommendedConceptId,
      recentActivity: [
        ...state.pedagogicalState.recentActivity,
        {
          type: "diagnostic-complete",
          conceptId: recommendedConceptId,
        },
      ].slice(-10),
    },
  });

export const advanceAssessment = (state, result = {}) => {
  const currentStep = state.pedagogicalState.diagnosticStep ?? 0;
  const nextStep = currentStep + 1;
  const recommendedConceptId =
    result.recommendedConceptId ??
    state.pedagogicalState.recommendedConceptId ??
    "variables-and-expressions";

  if (nextStep >= ALGEBRA_DIAGNOSTIC_ITEMS.length) {
    return recordAssessmentCompletion(state, recommendedConceptId);
  }

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...appendUniqueRecentActivity(state, {
        type: "diagnostic-step-complete",
        step: currentStep,
      }),
      diagnosticStatus: "in-progress",
      diagnosticStep: nextStep,
      currentObjectiveId: getDiagnosticItem(nextStep).id,
      recommendedConceptId,
    },
  });
};

export const applyMasteryEvidence = (state, conceptId, delta = 1) => {
  const currentRecord = state.pedagogicalState.masteryByConcept[conceptId] ?? {};
  const nextScore = Math.max(0, (currentRecord.score ?? 0) + delta);
  const recommendedConceptId = getRecommendedConceptId({
    ...state.pedagogicalState.masteryByConcept,
    [conceptId]: {
      ...currentRecord,
      score: nextScore,
    },
  });

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...appendUniqueRecentActivity(state, {
        type: "mastery-evidence",
        conceptId,
        delta,
      }),
      currentConceptId: recommendedConceptId,
      currentObjectiveId: `concept.${recommendedConceptId}`,
      recommendedConceptId,
      masteryByConcept: {
        ...state.pedagogicalState.masteryByConcept,
        [conceptId]: {
          score: nextScore,
          status: nextScore >= 1 ? "mastered" : "in-progress",
          attempts: (currentRecord.attempts ?? 0) + 1,
          lastPracticedAt: new Date().toISOString(),
          reviewDueAt: null,
        },
      },
      evidenceLog: [
        ...state.pedagogicalState.evidenceLog,
        {
          conceptId,
          delta,
          recordedAt: new Date().toISOString(),
        },
      ].slice(-40),
    },
  });
};
