import { describe, expect, it } from "vitest";
import { SessionTurnCreateSchema, TutorResponseSchema } from "../src";

describe("schema contracts", () => {
  it("supports the tutor response cloud review flag", () => {
    const parsed = TutorResponseSchema.parse({
      message: "Let's solve this together.",
      messageStyle: "coach",
      suggestedUi: "chat",
      expectedResponseType: "text"
    });

    expect(parsed.shouldRequireCloudReview).toBe(false);
  });

  it("rejects unsupported session turn input types", () => {
    expect(() =>
      SessionTurnCreateSchema.parse({
        inputType: "voice",
        content: "hello"
      })
    ).toThrow();
  });
});
