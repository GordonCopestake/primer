import { reviewTutorResponse } from "@primer/safety-engine";
import { TutorResponseSchema } from "@primer/schemas";
import type { TutorResponse } from "@primer/schemas";
import type { AgeBand, CurriculumNode, LearnerState, SessionMode } from "@primer/types";

export type ExecutionMode = "local_only" | "local_preferred_cloud_fallback" | "cloud_preferred_local_fallback" | "cloud_required";

export interface DeviceCapability {
  localTextModelAvailable: boolean;
  localMultimodalModelAvailable: boolean;
  networkAvailable: boolean;
}

export interface OrchestrationInput {
  learnerState: LearnerState;
  targetNode: CurriculumNode;
  mode: SessionMode;
  ageBand: AgeBand;
  recentTranscript: Array<{ actor: "child" | "tutor"; content: string }>;
  deviceCapability?: Partial<DeviceCapability>;
  safetyTriggered?: boolean;
  needsMultimodal?: boolean;
}

export interface RoutingDecision {
  mode: ExecutionMode;
  reason: string;
}

export interface OrchestrationMeta {
  routing: RoutingDecision;
  usedFallback: boolean;
  fallbackReason: string | null;
}

export interface OrchestrationResult {
  ok: boolean;
  response: TutorResponse;
  meta: OrchestrationMeta;
}

const defaultDeviceCapability: DeviceCapability = {
  localTextModelAvailable: true,
  localMultimodalModelAvailable: false,
  networkAvailable: false
};

function resolveDeviceCapability(input?: Partial<DeviceCapability>): DeviceCapability {
  return {
    ...defaultDeviceCapability,
    ...input
  };
}

export function determineRoutingDecision(input: OrchestrationInput): RoutingDecision {
  const device = resolveDeviceCapability(input.deviceCapability);

  if (input.safetyTriggered) {
    return {
      mode: device.networkAvailable ? "cloud_required" : "local_only",
      reason: device.networkAvailable ? "safety trigger requires cloud review when available" : "safety trigger downgraded to local-only because network is unavailable"
    };
  }

  if (input.needsMultimodal && !device.localMultimodalModelAvailable) {
    if (device.networkAvailable) {
      return {
        mode: "cloud_required",
        reason: "multimodal request needs cloud fallback because local multimodal runtime is unavailable"
      };
    }

    return {
      mode: "local_only",
      reason: "multimodal runtime unavailable and offline; use local text-safe fallback"
    };
  }

  if (!device.localTextModelAvailable) {
    return {
      mode: device.networkAvailable ? "cloud_preferred_local_fallback" : "local_only",
      reason: device.networkAvailable ? "local text runtime unavailable; prefer cloud path" : "local text runtime unavailable while offline; use local fallback"
    };
  }

  if (input.mode === "daily_session" || input.mode === "live_tutor" || input.mode === "story_mode") {
    return {
      mode: device.networkAvailable ? "local_preferred_cloud_fallback" : "local_only",
      reason: "routine tutoring flow defaults to local-first"
    };
  }

  return {
    mode: device.networkAvailable ? "local_preferred_cloud_fallback" : "local_only",
    reason: "homework flow defaults to local-first with optional cloud fallback"
  };
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
    shouldRequireCloudReview: false,
    lessonStatePatch: {
      goalNodeId: input.targetNode.id,
      prompt
    }
  });
}

export function buildSafeFallbackResponse(input: OrchestrationInput, reason: string): TutorResponse {
  return TutorResponseSchema.parse({
    message: "Let's keep going one step at a time. Can you tell me what part feels tricky?",
    messageStyle: "question",
    suggestedUi: "free_text",
    hints: ["You can answer in a short sentence."],
    expectedResponseType: "text",
    masterySignal: "unknown",
    shouldEscalateSafety: false,
    shouldRequireCloudReview: input.safetyTriggered ?? false,
    lessonStatePatch: {
      fallbackReason: reason,
      targetNodeId: input.targetNode.id
    }
  });
}

export function orchestrateTutorTurn(input: OrchestrationInput): OrchestrationResult {
  const routing = determineRoutingDecision(input);

  if (input.safetyTriggered) {
    const fallbackReason = "safety trigger requires cautious fallback";
    return {
      ok: false,
      response: buildSafeFallbackResponse(input, fallbackReason),
      meta: {
        routing,
        usedFallback: true,
        fallbackReason
      }
    };
  }

  const candidate = buildTutorCandidate(input);
  const reviewed = reviewTutorResponse(candidate);

  if (reviewed.ok && reviewed.response) {
    return {
      ok: true,
      response: reviewed.response,
      meta: {
        routing,
        usedFallback: false,
        fallbackReason: null
      }
    };
  }

  const fallbackReason = reviewed.issue?.reason ?? "unknown safety validation failure";
  const fallback = buildSafeFallbackResponse(input, fallbackReason);

  return {
    ok: false,
    response: fallback,
    meta: {
      routing,
      usedFallback: true,
      fallbackReason
    }
  };
}
