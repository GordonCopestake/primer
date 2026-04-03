import { describe, expect, test } from "vitest";
import { createLocalStoryInstance, advanceLocalStoryCheckpoint } from "./story";
import { upsertLearnerProfile } from "../store";

const childProfile = {
  id: "child_story_1",
  displayName: "Ruby",
  birthDate: "2018-04-05T00:00:00.000Z",
  ageBand: "6-7" as const,
  schoolYear: "Year 2",
  accessibilitySettingsJson: {},
  permissionsJson: {},
  createdAt: "2026-03-01T00:00:00.000Z"
};

describe("story helpers", () => {
  test("creates a local story instance with the first checkpoint", () => {
    upsertLearnerProfile(childProfile);

    const result = createLocalStoryInstance({
      childProfile
    });

    expect(result.story.childProfileId).toBe(childProfile.id);
    expect(result.story.progressJson.completed).toBe(false);
    expect(result.story.progressJson.checkpoint).toBe(0);
  });

  test("advances the story checkpoint and records the choice path", () => {
    upsertLearnerProfile(childProfile);
    const initial = createLocalStoryInstance({
      childProfile
    });

    const next = advanceLocalStoryCheckpoint({
      childProfile,
      story: initial.story,
      choiceId: "look_closer"
    });

    expect(next.story.progressJson.checkpoint).toBe(1);
    expect(next.story.branchStateJson.path).toContain("look_closer");
  });

  test("completes the story after the final checkpoint", () => {
    upsertLearnerProfile(childProfile);
    const initial = createLocalStoryInstance({
      childProfile
    });
    const stepOne = advanceLocalStoryCheckpoint({
      childProfile,
      story: initial.story,
      choiceId: "look_closer"
    });
    const stepTwo = advanceLocalStoryCheckpoint({
      childProfile,
      story: stepOne.story,
      choiceId: "try_it_out"
    });
    const final = advanceLocalStoryCheckpoint({
      childProfile,
      story: stepTwo.story,
      choiceId: "check_answer"
    });

    expect(final.story.progressJson.completed).toBe(true);
    expect(final.story.branchStateJson.choices).toEqual([]);
  });
});
