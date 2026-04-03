import { describe, expect, test } from "vitest";
import {
  getLearnerState,
  getLearnerProfile,
  listSessionTranscripts,
  listHomeworkArtifacts,
  listLearnerProfiles,
  listStoryInstances,
  upsertHomeworkArtifact,
  upsertLearnerProfile,
  upsertSessionTranscript,
  upsertStoryInstance
} from "./index";

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
    expect(getLearnerProfile("child_local_1")?.displayName).toBe("Mia");
  });

  test("creates default learner state on first read", () => {
    const state = getLearnerState("child_local_1", "reading");
    expect(state.childProfileId).toBe("child_local_1");
    expect(state.subject).toBe("reading");
  });

  test("stores local story checkpoints", () => {
    upsertStoryInstance({
      id: "story_local_1",
      childProfileId: "child_local_1",
      curriculumNodeId: "reading-6-7-main-idea",
      title: "Mystery Map",
      branchStateJson: { branch: "north" },
      progressJson: { checkpoint: 2, completed: false },
      createdAt: "2026-03-03T00:00:00.000Z",
      updatedAt: "2026-03-03T00:00:00.000Z"
    });

    expect(listStoryInstances("child_local_1")[0]?.id).toBe("story_local_1");
  });
  test("stores homework artifacts with guided solve steps", () => {
    upsertHomeworkArtifact({
      id: "artifact_local_1",
      childProfileId: "child_local_1",
      sourceType: "text",
      blobUrl: "",
      extractedText: "12 - 4",
      parsedStructureJson: {
        problemType: "arithmetic",
        steps: ["read", "subtract", "check"],
        confidence: 0.72
      },
      createdAt: "2026-03-03T00:00:00.000Z"
    });

    expect(listHomeworkArtifacts("child_local_1")[0]?.id).toBe("artifact_local_1");
  });

  test("stores local tutoring transcripts", () => {
    upsertSessionTranscript({
      id: "transcript_local_1",
      childProfileId: "child_local_1",
      sessionId: "session_local_1",
      mode: "daily_session",
      turns: [
        {
          actor: "child",
          text: "I think the answer is 8",
          createdAt: "2026-03-03T00:00:00.000Z"
        }
      ],
      summary: "Working on number bonds.",
      createdAt: "2026-03-03T00:00:00.000Z"
    });

    expect(listSessionTranscripts("child_local_1")[0]?.id).toBe("transcript_local_1");
  });
});
