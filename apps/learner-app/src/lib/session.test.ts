import { describe, expect, test } from "vitest";
import { createLocalSessionId, createLocalSessionTranscript, submitLocalSessionTurn } from "./session";
import { upsertLearnerProfile } from "../store";

const childProfile = {
  id: "child_session_1",
  displayName: "Noah",
  birthDate: "2018-03-05T00:00:00.000Z",
  ageBand: "6-7" as const,
  schoolYear: "Year 2",
  accessibilitySettingsJson: {},
  permissionsJson: {},
  createdAt: "2026-03-01T00:00:00.000Z"
};

describe("session helpers", () => {
  test("creates a local session transcript for the next target node", () => {
    upsertLearnerProfile(childProfile);

    const session = createLocalSessionTranscript({
      childProfile,
      subject: "reading"
    });

    expect(session.sessionId).toMatch(/^session_/);
    expect(session.targetNode.subject).toBe("reading");
    expect(session.transcript.turns).toHaveLength(0);
  });

  test("submits a local tutor turn and saves child plus tutor transcript entries", () => {
    upsertLearnerProfile(childProfile);
    const sessionId = createLocalSessionId();

    const result = submitLocalSessionTurn({
      childProfile,
      subject: "maths",
      sessionId,
      turns: [],
      childText: "Can you help me add 3 and 4?"
    });

    expect(result.targetNode.subject).toBe("maths");
    expect(result.transcript.turns).toHaveLength(2);
    expect(result.transcript.turns[0]?.actor).toBe("child");
    expect(result.transcript.turns[1]?.actor).toBe("tutor");
    expect(result.orchestration.meta.routing.mode).toBe("local_only");
  });

  test("uses the safe fallback when child input triggers safety escalation", () => {
    upsertLearnerProfile(childProfile);

    const result = submitLocalSessionTurn({
      childProfile,
      subject: "reading",
      sessionId: createLocalSessionId(),
      turns: [],
      childText: "keep this secret"
    });

    expect(result.orchestration.meta.usedFallback).toBe(true);
    expect(result.transcript.turns[1]?.text).toContain("one step at a time");
  });
});
