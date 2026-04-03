import { SafetyEventSchema, TutorResponseSchema } from "@primer/schemas";
import type { TutorResponse } from "@primer/schemas";
import type { SafetySeverity } from "@primer/types";

export interface SafetyReviewResult {
  ok: boolean;
  severity: SafetySeverity;
  reason: string;
  fallbackMessage: string;
}

const prohibitedPatterns = [
  /keep this secret/i,
  /i love you more than/i,
  /hurt yourself/i,
  /suicide/i,
  /sex/i,
  /dangerous/i,
  /you have (?:an )?diagnosis/i
];

export function classifyTextSafety(input: string): SafetyReviewResult {
  const hit = prohibitedPatterns.find((pattern) => pattern.test(input));
  if (!hit) {
    return {
      ok: true,
      severity: "info",
      reason: "clean",
      fallbackMessage: ""
    };
  }

  return {
    ok: false,
    severity: "high",
    reason: `matched ${hit.toString()}`,
    fallbackMessage: "Let's keep this about learning. Ask a parent or guardian for help."
  };
}

export function isAgeBandLanguageSafe(text: string, ageBand: "4-5" | "6-7" | "8-9" | "10-11") {
  const maxLength = ageBand === "4-5" ? 120 : ageBand === "6-7" ? 180 : ageBand === "8-9" ? 240 : 320;
  return text.length <= maxLength;
}

export function isAttachmentAllowed(sourceType: "image" | "text", attachmentCount: number) {
  if (sourceType === "text") return attachmentCount === 0;
  return attachmentCount <= 1;
}

export function shouldEscalateSafety(input: { text: string; ageBand: "4-5" | "6-7" | "8-9" | "10-11" }) {
  const textCheck = classifyTextSafety(input.text);
  if (!textCheck.ok) return true;
  return !isAgeBandLanguageSafe(input.text, input.ageBand);
}

export function reviewTutorResponse(response: unknown): {
  ok: boolean;
  response?: TutorResponse;
  issue?: SafetyReviewResult;
} {
  const parsed = TutorResponseSchema.safeParse(response);
  if (!parsed.success) {
    return {
      ok: false,
      issue: {
        ok: false,
        severity: "high",
        reason: "invalid structured response",
        fallbackMessage: "I need to switch to a safer learning prompt."
      }
    };
  }

  const safety = classifyTextSafety(parsed.data.message);
  if (!safety.ok || parsed.data.shouldEscalateSafety) {
    return { ok: false, issue: safety };
  }

  return { ok: true, response: parsed.data };
}

export function createSafetyEventPayload(input: {
  id: string;
  childProfileId: string;
  type: string;
  triggerExcerpt: string;
  systemAction: string;
  severity?: SafetySeverity;
  sessionId?: string;
}) {
  return SafetyEventSchema.parse({
    id: input.id,
    childProfileId: input.childProfileId,
    sessionId: input.sessionId ?? null,
    severity: input.severity ?? "warning",
    type: input.type,
    triggerExcerpt: input.triggerExcerpt,
    systemAction: input.systemAction,
    reviewStatus: "open",
    createdAt: new Date().toISOString()
  });
}

export function reviewStoryContent(input: {
  ageBand: "4-5" | "6-7" | "8-9" | "10-11";
  title: string;
  segmentText: string;
}) {
  const titleCheck = classifyTextSafety(input.title);
  if (!titleCheck.ok) {
    return {
      ok: false as const,
      reason: "story_title_failed_safety",
      fallbackTitle: "Learning Story",
      fallbackSegment: "Let's choose a kinder story topic and keep learning together."
    };
  }

  const segmentCheck = classifyTextSafety(input.segmentText);
  if (!segmentCheck.ok || !isAgeBandLanguageSafe(input.segmentText, input.ageBand)) {
    return {
      ok: false as const,
      reason: !segmentCheck.ok ? "story_segment_failed_safety" : "story_segment_age_band_mismatch",
      fallbackTitle: input.title,
      fallbackSegment: "Let's continue with a simpler, safer story moment."
    };
  }

  return {
    ok: true as const,
    reason: "clean",
    fallbackTitle: input.title,
    fallbackSegment: input.segmentText
  };
}

export function reviewHomeworkArtifact(input: {
  ageBand: "4-5" | "6-7" | "8-9" | "10-11";
  sourceType: "image" | "text";
  attachmentCount: number;
  extractedText: string;
}) {
  const attachmentAllowed = isAttachmentAllowed(input.sourceType, input.attachmentCount);
  if (!attachmentAllowed) {
    return {
      ok: false as const,
      reason: "homework_attachment_not_allowed",
      safeExtractedText: ""
    };
  }

  if (shouldEscalateSafety({ text: input.extractedText, ageBand: input.ageBand })) {
    return {
      ok: false as const,
      reason: "homework_text_failed_safety",
      safeExtractedText: "Let's focus on a school question you can solve step by step."
    };
  }

  return {
    ok: true as const,
    reason: "clean",
    safeExtractedText: input.extractedText
  };
}
