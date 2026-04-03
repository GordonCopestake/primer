import { describe, expect, it } from "vitest";
import { reviewHomeworkArtifact, reviewStoryContent } from "../src/index";

describe("reviewStoryContent", () => {
  it("passes safe story content", () => {
    const result = reviewStoryContent({
      ageBand: "6-7",
      title: "The Curious Fox",
      segmentText: "Mina read the clue and found the next letter in the puzzle."
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("clean");
  });

  it("returns fallback content for unsafe titles", () => {
    const result = reviewStoryContent({
      ageBand: "8-9",
      title: "Keep this secret mission",
      segmentText: "They solved a maths riddle together."
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("story_title_failed_safety");
    expect(result.fallbackTitle).toBe("Learning Story");
  });
});


describe("reviewHomeworkArtifact", () => {
  it("fails when text source includes attachments", () => {
    const result = reviewHomeworkArtifact({
      ageBand: "6-7",
      sourceType: "text",
      attachmentCount: 1,
      extractedText: "8 + 3"
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("homework_attachment_not_allowed");
  });

  it("passes clean homework text", () => {
    const result = reviewHomeworkArtifact({
      ageBand: "8-9",
      sourceType: "text",
      attachmentCount: 0,
      extractedText: "Find the area of a rectangle with width 3 and length 5."
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("clean");
  });
});
