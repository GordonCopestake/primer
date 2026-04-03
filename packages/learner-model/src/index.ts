import type { LearnerState, Subject, SessionMode } from "@primer/types";

export function createLearnerState(childProfileId: string, subject: Subject): LearnerState {
  return {
    id: `learner_${childProfileId}_${subject}`,
    childProfileId,
    subject,
    masteryMapJson: {},
    confidenceMapJson: {},
    misconceptionLogJson: [],
    interestTagsJson: [],
    preferredModesJson: ["daily_session"],
    sessionTolerance: 15,
    updatedAt: new Date().toISOString()
  };
}

export function updateMasteryFromAssessment(
  state: LearnerState,
  nodeId: string,
  score: number,
  confidence: number
): LearnerState {
  return {
    ...state,
    masteryMapJson: {
      ...state.masteryMapJson,
      [nodeId]: Math.max(0, Math.min(1, score))
    },
    confidenceMapJson: {
      ...state.confidenceMapJson,
      [nodeId]: Math.max(0, Math.min(1, confidence))
    },
    updatedAt: new Date().toISOString()
  };
}

export function applyPreferredMode(state: LearnerState, mode: SessionMode): LearnerState {
  if (state.preferredModesJson.includes(mode)) {
    return state;
  }

  return {
    ...state,
    preferredModesJson: [...state.preferredModesJson, mode],
    updatedAt: new Date().toISOString()
  };
}

export function updateConfidence(state: LearnerState, nodeId: string, confidence: number): LearnerState {
  return {
    ...state,
    confidenceMapJson: {
      ...state.confidenceMapJson,
      [nodeId]: Math.max(0, Math.min(1, confidence))
    },
    updatedAt: new Date().toISOString()
  };
}

export function recordMisconception(state: LearnerState, misconception: string): LearnerState {
  return {
    ...state,
    misconceptionLogJson: [...state.misconceptionLogJson, misconception].slice(-20),
    updatedAt: new Date().toISOString()
  };
}

export function recordAssessmentOutcome(
  state: LearnerState,
  params: {
    nodeId: string;
    score: number;
    confidence: number;
    misconception?: string;
  }
): LearnerState {
  const nextState = updateMasteryFromAssessment(state, params.nodeId, params.score, params.confidence);

  if (params.misconception) {
    return recordMisconception(nextState, params.misconception);
  }

  return nextState;
}
