import { reviewTutorResponse } from "@primer/safety-engine";
import { TutorResponseSchema } from "@primer/schemas";
import type { CurriculumNode, LearnerState, SessionMode } from "@primer/types";

export interface OrchestrationInput {
  learnerState: LearnerState;
  targetNode: CurriculumNode;
  mode: SessionMode;
  recentTranscript: Array<{ actor: "child" | "tutor"; content: string }>;
}

export function buildTutorPrompt(input: OrchestrationInput) {
  return {
    learnerSubject: input.learnerState.subject,
    targetNodeId: input.targetNode.id,
    mode: input.mode,
    transcriptWindow: input.recentTranscript.slice(-6),
    learnerStatePatch: {
      masteryKeys: Object.keys(input.learnerState.masteryMapJson),
      confidenceKeys: Object.keys(input.learnerState.confidenceMapJson)
    }
  };
}

export function buildTutorCandidate(input: OrchestrationInput) {
  const prompt = buildTutorPrompt(input);
  const message = `Let's work on ${input.targetNode.title}. Try this: ${input.targetNode.description}`;
  return TutorResponseSchema.parse({
    message,
    messageStyle: input.mode === "story_mode" ? "story" : "coach",
    suggestedUi: input.mode === "homework_help" ? "free_text" : "chat",
    hints: [`Look for the key idea in ${input.targetNode.skillCode}.`],
    expectedResponseType: "text",
    masterySignal: "unknown",
    shouldEscalateSafety: false,
    lessonStatePatch: {
      goalNodeId: input.targetNode.id,
      prompt
    }
  });
}

export function orchestrateTutorTurn(input: OrchestrationInput) {
  const candidate = buildTutorCandidate(input);
  return reviewTutorResponse(candidate);
}
