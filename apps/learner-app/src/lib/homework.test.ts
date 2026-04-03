import { describe, expect, test } from "vitest";
import { parseLocalHomeworkArtifact } from "./homework";
import { upsertLearnerProfile } from "../store";

const childProfile = {
  id: "child_homework_1",
  displayName: "Ivy",
  birthDate: "2018-04-05T00:00:00.000Z",
  ageBand: "6-7" as const,
  schoolYear: "Year 2",
  accessibilitySettingsJson: {},
  permissionsJson: {},
  createdAt: "2026-03-01T00:00:00.000Z"
};

describe("homework helpers", () => {
  test("parses arithmetic homework into local guided steps", () => {
    upsertLearnerProfile(childProfile);

    const result = parseLocalHomeworkArtifact({
      childProfile,
      sourceType: "text",
      extractedText: "12 + 4"
    });

    expect(result.artifact.parsedStructureJson.problemType).toBe("arithmetic");
    expect(result.guidance[1]).toContain("identify numbers");
    expect(result.isLocalMultimodalEnabled).toBe(false);
  });

  test("uses a safer fallback text when homework input fails safety review", () => {
    upsertLearnerProfile(childProfile);

    const result = parseLocalHomeworkArtifact({
      childProfile,
      sourceType: "text",
      extractedText: "keep this secret"
    });

    expect(result.usedSafetyFallback).toBe(true);
    expect(result.artifact.extractedText).toContain("school question");
  });
});
