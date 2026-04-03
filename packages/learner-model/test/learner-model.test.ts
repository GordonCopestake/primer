import { describe, expect, it } from "vitest";
import { createLearnerState, recordAssessmentOutcome } from "../src";

describe("learner-model", () => {
  it("records assessment outcomes into mastery and confidence maps", () => {
    const state = createLearnerState("child_1", "reading");
    const next = recordAssessmentOutcome(state, {
      nodeId: "reading-6-7-cvc-words",
      score: 0.9,
      confidence: 0.8
    });

    expect(next.masteryMapJson["reading-6-7-cvc-words"]).toBe(0.9);
    expect(next.confidenceMapJson["reading-6-7-cvc-words"]).toBe(0.8);
    expect(next.updatedAt).not.toBe(state.updatedAt);
  });

  it("captures the latest misconception while keeping the log bounded", () => {
    const state = createLearnerState("child_1", "maths");
    const next = recordAssessmentOutcome(state, {
      nodeId: "maths-6-7-add-within-10",
      score: 0.3,
      confidence: 0.4,
      misconception: "counted the wrong total"
    });

    expect(next.misconceptionLogJson).toContain("counted the wrong total");
  });
});
