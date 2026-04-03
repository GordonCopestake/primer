import { describe, expect, it } from "vitest";
import { listSafetyEventsForChild, parseHomeworkArtifact } from "./mock-store";

describe("parseHomeworkArtifact", () => {
  it("returns guided arithmetic steps for numeric text", () => {
    const artifact = parseHomeworkArtifact({
      childId: "child_demo",
      sourceType: "text",
      extractedText: "9 + 6"
    });

    expect(artifact.parsedStructureJson.problemType).toBe("arithmetic");
    expect(artifact.parsedStructureJson.steps).toContain("compute");
  });

  it("creates safety fallback output for unsafe text", () => {
    const beforeCount = listSafetyEventsForChild("child_demo").length;

    const artifact = parseHomeworkArtifact({
      childId: "child_demo",
      sourceType: "text",
      extractedText: "keep this secret"
    });

    const afterCount = listSafetyEventsForChild("child_demo").length;
    expect(artifact.extractedText.length).toBeGreaterThan(0);
    expect(afterCount).toBe(beforeCount + 1);
  });
});
