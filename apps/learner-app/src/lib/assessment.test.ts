import { describe, expect, test } from "vitest";
import { createLearnerState } from "@primer/learner-model";
import { buildBaselineAssessmentPlan, saveBaselineAssessmentOutcome } from "./assessment";
import type { LocalChildProfile } from "@primer/local-storage";

const profile: LocalChildProfile = {
  id: "child_assessment_1",
  displayName: "Mia",
  birthDate: "2019-03-05T00:00:00.000Z",
  ageBand: "6-7",
  schoolYear: "Year 1",
  accessibilitySettingsJson: {},
  permissionsJson: {},
  createdAt: "2026-03-01T00:00:00.000Z"
};

describe("baseline assessment plan", () => {
  test("selects the next open curriculum node for the learner", () => {
    const learnerState = createLearnerState(profile.id, "reading");

    const plan = buildBaselineAssessmentPlan({
      childProfile: profile,
      learnerState,
      subject: "reading"
    });

    expect(plan.recommendedNode?.id).toBe("reading-6-7-cvc-words");
    expect(plan.remediationNode?.id).toBe("reading-6-7-cvc-words");
  });

  test("persists a mastered assessment outcome locally and closes the current recommendation", () => {
    const savedState = saveBaselineAssessmentOutcome({
      childProfileId: profile.id,
      subject: "reading",
      nodeId: "reading-6-7-cvc-words",
      score: 0.92,
      confidence: 0.84
    });

    const plan = buildBaselineAssessmentPlan({
      childProfile: profile,
      learnerState: savedState,
      subject: "reading"
    });

    expect(savedState.masteryMapJson["reading-6-7-cvc-words"]).toBe(0.92);
    expect(plan.recommendedNode).toBeUndefined();
  });
});
