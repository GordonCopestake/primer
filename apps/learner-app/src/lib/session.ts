import { listCurriculumNodes, selectNextNode } from "@primer/curriculum-engine";
import { shouldEscalateSafety } from "@primer/safety-engine";
import { orchestrateTutorTurn, type OrchestrationResult } from "@primer/tutor-orchestrator";
import type { LocalChildProfile, LocalLearnerState, LocalSessionTranscript } from "@primer/local-storage";
import type { CurriculumNode, Subject } from "@primer/types";
import { getLearnerState, upsertSessionTranscript } from "../store";

export type SessionTurnInput = {
  childProfile: LocalChildProfile;
  subject: Subject;
  sessionId: string;
  turns: LocalSessionTranscript["turns"];
  childText: string;
};

export type SessionTurnResult = {
  learnerState: LocalLearnerState;
  targetNode: CurriculumNode;
  transcript: LocalSessionTranscript;
  orchestration: OrchestrationResult;
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTargetNode(childProfile: LocalChildProfile, learnerState: LocalLearnerState): CurriculumNode {
  const recommendedNode = selectNextNode({
    subject: learnerState.subject,
    ageBand: childProfile.ageBand,
    masteryMap: learnerState.masteryMapJson
  });

  return recommendedNode ?? listCurriculumNodes(learnerState.subject, childProfile.ageBand)[0]!;
}

export function createLocalSessionId() {
  return makeId("session");
}

export function buildSessionSummary(targetNode: CurriculumNode, transcript: LocalSessionTranscript["turns"]) {
  if (transcript.length === 0) {
    return `Warm up on ${targetNode.title}.`;
  }

  return `Working on ${targetNode.title} with ${transcript.length} saved turns.`;
}

export function createLocalSessionTranscript(params: {
  childProfile: LocalChildProfile;
  subject: Subject;
  sessionId?: string;
}): {
  learnerState: LocalLearnerState;
  sessionId: string;
  targetNode: CurriculumNode;
  transcript: LocalSessionTranscript;
} {
  const learnerState = getLearnerState(params.childProfile.id, params.subject);
  const targetNode = getTargetNode(params.childProfile, learnerState);
  const sessionId = params.sessionId ?? createLocalSessionId();
  const now = new Date().toISOString();

  const transcript: LocalSessionTranscript = {
    id: `transcript_${sessionId}`,
    childProfileId: params.childProfile.id,
    sessionId,
    mode: "daily_session",
    turns: [],
    summary: buildSessionSummary(targetNode, []),
    createdAt: now
  };

  return {
    learnerState,
    sessionId,
    targetNode,
    transcript: upsertSessionTranscript(transcript)
  };
}

export function submitLocalSessionTurn(params: SessionTurnInput): SessionTurnResult {
  const learnerState = getLearnerState(params.childProfile.id, params.subject);
  const targetNode = getTargetNode(params.childProfile, learnerState);
  const childTurn = {
    actor: "child" as const,
    text: params.childText,
    createdAt: new Date().toISOString()
  };
  const transcriptWindow = [...params.turns, childTurn];
  const orchestration = orchestrateTutorTurn({
    learnerState,
    targetNode,
    mode: "daily_session",
    ageBand: params.childProfile.ageBand,
    recentTranscript: transcriptWindow.map((turn) => ({
      actor: turn.actor === "child" ? "child" : "tutor",
      content: turn.text
    })),
    safetyTriggered: shouldEscalateSafety({
      text: params.childText,
      ageBand: params.childProfile.ageBand
    }),
    deviceCapability: {
      localTextModelAvailable: true,
      localMultimodalModelAvailable: false,
      networkAvailable: false
    }
  });
  const tutorTurn = {
    actor: "tutor" as const,
    text: orchestration.response.message,
    createdAt: new Date().toISOString()
  };
  const nextTurns = [...transcriptWindow, tutorTurn];

  const transcript: LocalSessionTranscript = {
    id: `transcript_${params.sessionId}`,
    childProfileId: params.childProfile.id,
    sessionId: params.sessionId,
    mode: "daily_session",
    turns: nextTurns,
    summary: buildSessionSummary(targetNode, nextTurns),
    createdAt: nextTurns[0]?.createdAt ?? new Date().toISOString()
  };

  return {
    learnerState,
    targetNode,
    transcript: upsertSessionTranscript(transcript),
    orchestration
  };
}
