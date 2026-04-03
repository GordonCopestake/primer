import { selectNextNode, selectRemediationNode } from "@primer/curriculum-engine";
import { recordAssessmentOutcome } from "@primer/learner-model";
import type { CurriculumNode, Subject } from "@primer/types";
import type { LocalChildProfile, LocalLearnerState } from "@primer/local-storage";
import { getLearnerState, upsertLearnerState } from "../store";

export type BaselineAssessmentPlan = {
  childProfile: LocalChildProfile;
  learnerState: LocalLearnerState;
  subject: Subject;
  recommendedNode: CurriculumNode | undefined;
  remediationNode: CurriculumNode | undefined;
};

export function buildBaselineAssessmentPlan(params: {
  childProfile: LocalChildProfile;
  learnerState: LocalLearnerState;
  subject: Subject;
}): BaselineAssessmentPlan {
  const { childProfile, learnerState, subject } = params;
  const placement = {
    subject,
    ageBand: childProfile.ageBand,
    masteryMap: learnerState.masteryMapJson
  };

  return {
    childProfile,
    learnerState,
    subject,
    recommendedNode: selectNextNode(placement),
    remediationNode: selectRemediationNode(placement)
  };
}

export function saveBaselineAssessmentOutcome(params: {
  childProfileId: string;
  subject: Subject;
  nodeId: string;
  score: number;
  confidence: number;
  misconception?: string;
}): LocalLearnerState {
  const currentState = getLearnerState(params.childProfileId, params.subject);
  const nextState = recordAssessmentOutcome(currentState, {
    nodeId: params.nodeId,
    score: params.score,
    confidence: params.confidence,
    misconception: params.misconception
  });

  return upsertLearnerState(nextState);
}
