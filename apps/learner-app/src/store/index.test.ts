import { describe, expect, test } from "vitest";
import { getLearnerState, listLearnerProfiles, upsertLearnerProfile } from "./index";

describe("learner store", () => {
  test("stores and lists local learner profiles", () => {
    upsertLearnerProfile({
      id: "child_local_1",
      displayName: "Mia",
      birthDate: "2019-03-05T00:00:00.000Z",
      ageBand: "6-7",
      schoolYear: "Year 1",
      accessibilitySettingsJson: {},
      permissionsJson: {},
      createdAt: "2026-03-01T00:00:00.000Z"
    });

    expect(listLearnerProfiles().some((profile) => profile.id === "child_local_1")).toBe(true);
  });

  test("creates default learner state on first read", () => {
    const state = getLearnerState("child_local_1", "reading");
    expect(state.childProfileId).toBe("child_local_1");
    expect(state.subject).toBe("reading");
  });
});
