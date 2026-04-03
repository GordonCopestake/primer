import { describe, expect, it } from "vitest";
import { listCurriculumNodes } from "@primer/curriculum-engine";
import {
  createChildProfile,
  createHousehold,
  listSafetyEventsForChild,
  parseHomeworkArtifact,
  startSession,
  submitSessionTurn
} from "./mock-store";

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

describe("submitSessionTurn", () => {
  it("keeps the session subject when orchestrating a tutor turn", () => {
    const household = createHousehold({ ownerParentId: "parent_test" });
    const child = createChildProfile({
      householdId: household.id,
      displayName: "Test Child",
      birthDate: "2018-01-01T00:00:00.000Z",
      ageBand: "6-7",
      schoolYear: "Year 2"
    });
    const mathsNode = listCurriculumNodes("maths", "6-7")[0];
    expect(mathsNode).toBeDefined();

    const session = startSession({
      childId: child.id,
      mode: "daily_session",
      subject: "maths",
      curriculumNodeId: mathsNode?.id
    });
    const result = submitSessionTurn({
      sessionId: session.id,
      inputType: "text",
      content: { text: "I need help" }
    });

    expect(result.tutorResponse.lessonStatePatch.prompt.learnerSubject).toBe("maths");
    expect(result.tutorResponse.lessonStatePatch.prompt.targetNodeId).toBe(mathsNode?.id);
  });
});
