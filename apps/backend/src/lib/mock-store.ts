import { randomUUID } from "node:crypto";
import { createLearnerState } from "@primer/learner-model";
import { createSafetyEventPayload } from "@primer/safety-engine";
import { listCurriculumNodes, selectNextNode } from "@primer/curriculum-engine";
import { orchestrateTutorTurn } from "@primer/tutor-orchestrator";
import type { AgeBand, ChildProfile, Household, Session, SessionMode, SafetyEvent, Subject } from "@primer/types";

type SessionTurn = {
  id: string;
  sessionId: string;
  actor: "child" | "tutor" | "system";
  contentJson: Record<string, unknown>;
  safetyStatus: "pending" | "approved" | "blocked";
  createdAt: string;
};

type LearnerRecord = ReturnType<typeof createLearnerState>;

const households = new Map<string, Household>();
const children = new Map<string, ChildProfile>();
const learners = new Map<string, LearnerRecord>();
const sessions = new Map<string, Session>();
const turns = new Map<string, SessionTurn[]>();
const safetyEvents = new Map<string, SafetyEvent[]>();

function ensureChild(childId: string) {
  const child = children.get(childId);
  if (!child) {
    throw new Error(`Unknown child: ${childId}`);
  }
  return child;
}

function ensureLearner(childId: string, subject: Subject = "reading") {
  const key = `${childId}:${subject}`;
  const learner = learners.get(key);
  if (learner) return learner;
  const created = createLearnerState(childId, subject);
  learners.set(key, created);
  return created;
}

export function createHousehold(input: { ownerParentId: string; settingsJson?: Record<string, unknown> }) {
  const household: Household = {
    id: randomUUID(),
    ownerParentId: input.ownerParentId,
    settingsJson: input.settingsJson ?? {},
    createdAt: new Date().toISOString()
  };
  households.set(household.id, household);
  return household;
}

export function createChildProfile(input: {
  householdId: string;
  displayName: string;
  birthDate: string;
  ageBand: AgeBand;
  schoolYear: string;
  avatarUrl?: string | null;
}) {
  const child: ChildProfile = {
    id: randomUUID(),
    householdId: input.householdId,
    displayName: input.displayName,
    birthDate: input.birthDate,
    ageBand: input.ageBand,
    schoolYear: input.schoolYear,
    avatarUrl: input.avatarUrl ?? null,
    accessibilitySettingsJson: {},
    permissionsJson: {},
    createdAt: new Date().toISOString()
  };
  children.set(child.id, child);
  learners.set(`${child.id}:reading`, createLearnerState(child.id, "reading"));
  learners.set(`${child.id}:maths`, createLearnerState(child.id, "maths"));
  return child;
}

export function getChildHome(childId: string) {
  const child = ensureChild(childId);
  const learner = ensureLearner(childId, "reading");
  const targetNode = selectNextNode({
    subject: learner.subject,
    ageBand: child.ageBand,
    masteryMap: learner.masteryMapJson
  });

  return {
    child,
    currentStreak: 3,
    recommendedLesson: targetNode ?? listCurriculumNodes(learner.subject, child.ageBand)[0] ?? null,
    pendingReviews: [],
    rewardsSnapshot: {
      stars: 12,
      badges: ["starter"]
    }
  };
}

export function startSession(input: { childId: string; mode: SessionMode; subject?: Subject; curriculumNodeId?: string | null }) {
  ensureChild(input.childId);
  const subject = input.subject ?? "reading";
  const learner = ensureLearner(input.childId, subject);
  const targetNode =
    input.curriculumNodeId ? listCurriculumNodes(subject).find((node) => node.id === input.curriculumNodeId) : undefined;
  const session: Session = {
    id: randomUUID(),
    childProfileId: input.childId,
    mode: input.mode,
    status: "active",
    goalNodeId: targetNode?.id ?? null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: null,
    summaryJson: {
      learnerSubject: learner.subject,
      targetNodeId: targetNode?.id ?? null
    }
  };
  sessions.set(session.id, session);
  turns.set(session.id, []);
  return session;
}

export function submitSessionTurn(input: { sessionId: string; content: Record<string, unknown>; inputType: string }) {
  const session = sessions.get(input.sessionId);
  if (!session) {
    throw new Error(`Unknown session: ${input.sessionId}`);
  }

  const turn: SessionTurn = {
    id: randomUUID(),
    sessionId: session.id,
    actor: "child",
    contentJson: {
      inputType: input.inputType,
      ...input.content
    },
    safetyStatus: "approved",
    createdAt: new Date().toISOString()
  };
  turns.get(session.id)?.push(turn);

  const child = ensureChild(session.childProfileId);
  const learner = ensureLearner(child.id, "reading");
  const targetNode =
    session.goalNodeId ? listCurriculumNodes(learner.subject, child.ageBand).find((node) => node.id === session.goalNodeId) : undefined;
  const orchestration = orchestrateTutorTurn({
    learnerState: learner,
    targetNode: targetNode ?? listCurriculumNodes(learner.subject, child.ageBand)[0]!,
    mode: session.mode,
    recentTranscript: []
  });

  if (!orchestration.ok && orchestration.issue) {
    const event = createSafetyEventPayload({
      id: randomUUID(),
      childProfileId: child.id,
      type: "unsafe_tutor_output",
      triggerExcerpt: input.content.inputType,
      systemAction: orchestration.issue.fallbackMessage,
      severity: orchestration.issue.severity
    });
    const existing = safetyEvents.get(child.id) ?? [];
    existing.push(event);
    safetyEvents.set(child.id, existing);
  }

  return {
    turn,
    tutorResponse: orchestration.ok ? orchestration.response : null
  };
}

export function completeSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Unknown session: ${sessionId}`);
  }
  const completed: Session = {
    ...session,
    status: "completed",
    endedAt: new Date().toISOString(),
    durationSeconds: 120,
    summaryJson: {
      ...session.summaryJson,
      completed: true
    }
  };
  sessions.set(sessionId, completed);
  return completed;
}

export function parseHomeworkArtifact(input: { childId: string; sourceType: "image" | "text"; blobUrl?: string; extractedText?: string }) {
  ensureChild(input.childId);
  return {
    id: randomUUID(),
    childProfileId: input.childId,
    sourceType: input.sourceType,
    blobUrl: input.blobUrl ?? "",
    extractedText: input.extractedText ?? "",
    parsedStructureJson: {
      problemType: "guided",
      steps: ["identify", "solve", "check"]
    },
    createdAt: new Date().toISOString()
  };
}

export function listSafetyEventsForChild(childId: string) {
  return safetyEvents.get(childId) ?? [];
}

export function reviewSafetyEvent(childId: string, eventId: string) {
  const events = safetyEvents.get(childId) ?? [];
  const updated = events.map((event) =>
    event.id === eventId ? { ...event, reviewStatus: "reviewed" as const } : event
  );
  safetyEvents.set(childId, updated);
  return updated.find((event) => event.id === eventId);
}

export function getProgressReport(childId: string) {
  const child = ensureChild(childId);
  const learner = ensureLearner(childId, "reading");
  return {
    child,
    learnerState: learner,
    curriculumCount: listCurriculumNodes(learner.subject, child.ageBand).length,
    completedSessions: Array.from(sessions.values()).filter((session) => session.childProfileId === childId && session.status === "completed").length
  };
}

export function seedDemoData() {
  if (households.size > 0) return;
  const household: Household = {
    id: "household_demo",
    ownerParentId: "parent_demo",
    settingsJson: { locale: "en-GB" },
    createdAt: new Date().toISOString()
  };
  households.set(household.id, household);

  const child: ChildProfile = {
    id: "child_demo",
    householdId: household.id,
    displayName: "Ava",
    birthDate: "2018-03-12",
    ageBand: "6-7",
    schoolYear: "Year 2",
    avatarUrl: null,
    accessibilitySettingsJson: {},
    permissionsJson: {},
    createdAt: new Date().toISOString()
  };
  children.set(child.id, child);
  learners.set(`${child.id}:reading`, createLearnerState(child.id, "reading"));
  learners.set(`${child.id}:maths`, createLearnerState(child.id, "maths"));
}

seedDemoData();
