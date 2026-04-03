export type PackageName = "@primer/types" | "@primer/schemas" | "@primer/curriculum-engine" | "@primer/learner-model" | "@primer/tutor-orchestrator" | "@primer/safety-engine" | "@primer/analytics" | "@primer/api-client" | "@primer/ui" | "@primer/design-tokens" | "@primer/config" | "@primer/local-storage";

export type Subject = "reading" | "maths" | "science";
export type AgeBand = "4-5" | "6-7" | "8-9" | "10-11";
export type SessionMode = "daily_session" | "live_tutor" | "story_mode" | "homework_help";
export type SessionStatus = "created" | "active" | "paused" | "awaiting_input" | "processing" | "completed" | "cancelled" | "safety_paused";
export type ActorType = "child" | "parent" | "system";
export type SafetySeverity = "info" | "warning" | "high" | "critical";

export interface ParentAccount {
  id: string;
  email: string;
  authProvider: string;
  createdAt: string;
  locale: string;
  subscriptionStatus: string;
}

export interface Household {
  id: string;
  ownerParentId: string;
  settingsJson: Record<string, unknown>;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  householdId: string;
  displayName: string;
  birthDate: string;
  ageBand: AgeBand;
  schoolYear: string;
  avatarUrl?: string | null;
  accessibilitySettingsJson: Record<string, unknown>;
  permissionsJson: Record<string, unknown>;
  createdAt: string;
}

export interface LearnerState {
  id: string;
  childProfileId: string;
  subject: Subject;
  masteryMapJson: Record<string, number>;
  confidenceMapJson: Record<string, number>;
  misconceptionLogJson: string[];
  interestTagsJson: string[];
  preferredModesJson: SessionMode[];
  sessionTolerance: number;
  updatedAt: string;
}

export interface CurriculumNode {
  id: string;
  subject: Subject;
  ageBand: AgeBand;
  skillCode: string;
  title: string;
  description: string;
  prerequisitesJson: string[];
  difficulty: number;
  metadataJson: Record<string, unknown>;
  version: string;
}

export interface Session {
  id: string;
  childProfileId: string;
  mode: SessionMode;
  status: SessionStatus;
  goalNodeId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  summaryJson: Record<string, unknown>;
}

export interface SessionTurn {
  id: string;
  sessionId: string;
  actor: ActorType;
  contentJson: Record<string, unknown>;
  safetyStatus: "pending" | "approved" | "blocked";
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  childProfileId: string;
  sessionId?: string | null;
  curriculumNodeId?: string | null;
  performanceType: string;
  score: number;
  confidenceEstimate: number;
  createdAt: string;
}

export interface SafetyEvent {
  id: string;
  childProfileId: string;
  sessionId?: string | null;
  severity: SafetySeverity;
  type: string;
  triggerExcerpt: string;
  systemAction: string;
  reviewStatus: "open" | "reviewed";
  createdAt: string;
}

export interface StoryInstance {
  id: string;
  childProfileId: string;
  curriculumNodeId: string;
  title: string;
  branchStateJson: Record<string, unknown>;
  progressJson: Record<string, unknown>;
}

export interface HomeworkArtifact {
  id: string;
  childProfileId: string;
  sourceType: "image" | "text";
  blobUrl: string;
  extractedText: string;
  parsedStructureJson: Record<string, unknown>;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorType: "parent" | "child" | "system";
  actorId: string;
  eventType: string;
  payloadJson: Record<string, unknown>;
  createdAt: string;
}
