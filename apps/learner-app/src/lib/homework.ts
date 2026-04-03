import { reviewHomeworkArtifact } from "@primer/safety-engine";
import type { LocalChildProfile, LocalHomeworkArtifact } from "@primer/local-storage";
import { upsertHomeworkArtifact } from "../store";

export type HomeworkInput = {
  childProfile: LocalChildProfile;
  sourceType: "image" | "text";
  extractedText: string;
  blobUrl?: string;
};

export type GuidedSolvePlan = {
  artifact: LocalHomeworkArtifact;
  isLocalMultimodalEnabled: boolean;
  guidance: string[];
  usedSafetyFallback: boolean;
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildGuidance(problemType: string, steps: string[]) {
  if (problemType === "arithmetic") {
    return [
      "Read the numbers and the operation.",
      `Try this order: ${steps.join(", ")}.`,
      "Say the answer out loud and then check it."
    ];
  }

  return [
    "Read the whole question first.",
    `Use these steps: ${steps.join(", ")}.`,
    "Explain why your final step makes sense."
  ];
}

export function parseLocalHomeworkArtifact(input: HomeworkInput): GuidedSolvePlan {
  const safety = reviewHomeworkArtifact({
    ageBand: input.childProfile.ageBand,
    sourceType: input.sourceType,
    attachmentCount: input.sourceType === "image" ? 1 : 0,
    extractedText: input.extractedText
  });
  const safeText = safety.safeExtractedText;
  const problemType = /\d/.test(safeText) ? "arithmetic" : safeText.length > 0 ? "word_problem" : "guided";
  const steps =
    problemType === "arithmetic"
      ? ["identify numbers", "choose operation", "compute", "check result"]
      : ["read the question", "find key details", "solve one step", "check result"];
  const artifact: LocalHomeworkArtifact = {
    id: makeId("artifact"),
    childProfileId: input.childProfile.id,
    sourceType: input.sourceType,
    blobUrl: input.blobUrl ?? "",
    extractedText: safeText,
    parsedStructureJson: {
      problemType,
      steps,
      confidence: safety.ok ? 0.82 : 0.55
    },
    createdAt: new Date().toISOString()
  };

  return {
    artifact: upsertHomeworkArtifact(artifact),
    isLocalMultimodalEnabled: false,
    guidance: buildGuidance(problemType, steps),
    usedSafetyFallback: !safety.ok
  };
}
