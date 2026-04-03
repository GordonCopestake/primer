import { describe, expect, it } from "vitest";
import { determineRoutingDecision, orchestrateTutorTurn, type OrchestrationInput } from "../src/index";

const baseInput: OrchestrationInput = {
  learnerState: {
    id: "state_1",
    childProfileId: "child_1",
    subject: "reading",
    masteryMapJson: {},
    confidenceMapJson: {},
    misconceptionLogJson: [],
    interestTagsJson: [],
    preferredModesJson: ["daily_session"],
    sessionTolerance: 10,
    updatedAt: new Date().toISOString()
  },
  targetNode: {
    id: "node_1",
    subject: "reading",
    ageBand: "6-7",
    skillCode: "READ.1",
    title: "Reading basics",
    description: "Find the main idea in a short sentence.",
    prerequisitesJson: [],
    difficulty: 1,
    metadataJson: {},
    version: "v1"
  },
  mode: "daily_session",
  ageBand: "6-7",
  recentTranscript: []
};

describe("determineRoutingDecision", () => {
  it("uses local preferred mode when local model is available", () => {
    const decision = determineRoutingDecision({
      ...baseInput,
      deviceCapability: {
        localTextModelAvailable: true,
        networkAvailable: true
      }
    });

    expect(decision.mode).toBe("local_preferred_cloud_fallback");
  });

  it("requires cloud for multimodal when local multimodal runtime is unavailable", () => {
    const decision = determineRoutingDecision({
      ...baseInput,
      needsMultimodal: true,
      deviceCapability: {
        localTextModelAvailable: true,
        localMultimodalModelAvailable: false,
        networkAvailable: true
      }
    });

    expect(decision.mode).toBe("cloud_required");
  });
});

describe("orchestrateTutorTurn", () => {
  it("returns a structured tutor response", () => {
    const result = orchestrateTutorTurn(baseInput);

    expect(result.response.message.length).toBeGreaterThan(0);
    expect(result.meta.usedFallback).toBe(false);
  });

  it("returns a safe fallback response when safety escalation is triggered", () => {
    const result = orchestrateTutorTurn({
      ...baseInput,
      safetyTriggered: true,
      deviceCapability: {
        localTextModelAvailable: true,
        networkAvailable: true
      }
    });

    expect(result.response.messageStyle).toBe("question");
    expect(result.response.shouldRequireCloudReview).toBe(true);
    expect(result.meta.routing.mode).toBe("cloud_required");
  });
});
