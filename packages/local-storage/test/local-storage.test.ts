import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  createHomeworkArtifactStore,
  createLearnerProfileStore,
  createLearnerStateStore,
  createSafetyHistoryStore,
  createSessionTranscriptStore,
  createStoryInstanceStore,
  createStructuredStore,
  createWebFileStore,
  createWebSecretStore
} from "../src/index";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    }
  };
}

describe("structured store", () => {
  test("writes and reads schema-validated data", () => {
    const storage = createMemoryStorage();
    const store = createStructuredStore(storage, "learner");

    const schema = z.object({ streak: z.number().int().min(0) });
    store.set("progress", schema, { streak: 3 });

    expect(store.get("progress", schema)).toEqual({ streak: 3 });
  });

  test("cleans invalid persisted values", () => {
    const storage = createMemoryStorage();
    storage.setItem("primer.learner.structured.progress", "not-json");
    const store = createStructuredStore(storage, "learner");

    expect(store.get("progress", z.object({ streak: z.number() }))).toBeNull();
    expect(storage.getItem("primer.learner.structured.progress")).toBeNull();
  });
});

describe("web file store", () => {
  test("upserts with stable createdAt and refreshed updatedAt", async () => {
    const storage = createMemoryStorage();
    const store = createWebFileStore(storage, "homework");

    const first = store.upsert("artifact-1", {
      createdAt: new Date().toISOString(),
      mimeType: "image/png",
      contentBase64: "abc"
    });

    await new Promise((resolve) => setTimeout(resolve, 2));

    const second = store.upsert("artifact-1", {
      createdAt: new Date().toISOString(),
      mimeType: "image/png",
      contentBase64: "def"
    });

    expect(second.createdAt).toBe(first.createdAt);
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(first.updatedAt).getTime());
    expect(second.contentBase64).toBe("def");
  });
});

describe("web secret store", () => {
  test("writes and removes local-only secrets", () => {
    const storage = createMemoryStorage();
    const store = createWebSecretStore(storage, "parentGate");

    store.set("pinHash", "hash-value");
    expect(store.get("pinHash")).toBe("hash-value");

    store.remove("pinHash");
    expect(store.get("pinHash")).toBeNull();
  });
});

describe("learner profile store", () => {
  test("upserts and retrieves local child profiles", () => {
    const storage = createMemoryStorage();
    const profileStore = createLearnerProfileStore(storage);

    profileStore.upsert({
      id: "child_1",
      displayName: "Alex",
      birthDate: "2019-01-01T00:00:00.000Z",
      ageBand: "6-7",
      schoolYear: "Year 1",
      accessibilitySettingsJson: {},
      permissionsJson: { homeworkHelpEnabled: true },
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    expect(profileStore.get("child_1")?.displayName).toBe("Alex");
    expect(profileStore.list()).toHaveLength(1);
  });
});

describe("learner state store", () => {
  test("stores per-subject learner state by child profile", () => {
    const storage = createMemoryStorage();
    const stateStore = createLearnerStateStore(storage);

    stateStore.upsert({
      id: "state_child_1_reading",
      childProfileId: "child_1",
      subject: "reading",
      masteryMapJson: { "reading-6-7-cvc-words": 0.4 },
      confidenceMapJson: { "reading-6-7-cvc-words": 0.6 },
      misconceptionLogJson: ["letters mixed up"],
      interestTagsJson: ["animals"],
      preferredModesJson: ["daily_session"],
      sessionTolerance: 15,
      updatedAt: "2026-01-03T00:00:00.000Z"
    });

    expect(stateStore.get("child_1", "reading")?.masteryMapJson["reading-6-7-cvc-words"]).toBe(0.4);
    expect(stateStore.listByChildProfileId("child_1")).toHaveLength(1);
  });
});


describe("story instance store", () => {
  test("persists per-child story checkpoints locally", () => {
    const storage = createMemoryStorage();
    const storyStore = createStoryInstanceStore(storage);

    storyStore.upsert({
      id: "story_1",
      childProfileId: "child_1",
      curriculumNodeId: "reading-1",
      title: "Forest Puzzle",
      branchStateJson: { choice: "path_a" },
      progressJson: { checkpoint: 1, completed: false },
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z"
    });

    expect(storyStore.listByChildProfileId("child_1")).toHaveLength(1);
    expect(storyStore.get("story_1")?.progressJson.checkpoint).toBe(1);
  });
});


describe("homework artifact store", () => {
  test("persists guided solve artifacts locally", () => {
    const storage = createMemoryStorage();
    const artifactStore = createHomeworkArtifactStore(storage);

    artifactStore.upsert({
      id: "artifact_1",
      childProfileId: "child_1",
      sourceType: "text",
      blobUrl: "",
      extractedText: "7 + 5",
      parsedStructureJson: {
        problemType: "arithmetic",
        steps: ["identify numbers", "add", "check"],
        confidence: 0.8
      },
      createdAt: "2026-01-03T00:00:00.000Z"
    });

    expect(artifactStore.listByChildProfileId("child_1")).toHaveLength(1);
    expect(artifactStore.get("artifact_1")?.parsedStructureJson.problemType).toBe("arithmetic");
  });
});

describe("session transcript store", () => {
  test("persists transcripts for parent review", () => {
    const storage = createMemoryStorage();
    const transcriptStore = createSessionTranscriptStore(storage);

    transcriptStore.upsert({
      id: "transcript_1",
      childProfileId: "child_1",
      sessionId: "session_1",
      mode: "daily_session",
      turns: [
        { actor: "tutor", text: "Let's try 9 + 6.", createdAt: "2026-01-03T00:00:00.000Z" },
        { actor: "child", text: "15", createdAt: "2026-01-03T00:01:00.000Z" }
      ],
      summary: "Worked through addition with confidence.",
      createdAt: "2026-01-03T00:02:00.000Z"
    });

    expect(transcriptStore.listByChildProfileId("child_1")).toHaveLength(1);
  });
});

describe("safety history store", () => {
  test("marks local safety events as reviewed", () => {
    const storage = createMemoryStorage();
    const safetyStore = createSafetyHistoryStore(storage);

    safetyStore.upsert({
      id: "event_1",
      childProfileId: "child_1",
      severity: "warning",
      type: "session_output_blocked",
      triggerExcerpt: "unsafe response candidate",
      systemAction: "safe_fallback_response",
      reviewStatus: "open",
      createdAt: "2026-01-03T00:00:00.000Z"
    });

    const reviewed = safetyStore.markReviewed("event_1", "2026-01-03T00:05:00.000Z");
    expect(reviewed?.reviewStatus).toBe("reviewed");
    expect(reviewed?.reviewedAt).toBe("2026-01-03T00:05:00.000Z");
  });
});
