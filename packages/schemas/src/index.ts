import { z } from "zod";

export const AgeBandSchema = z.enum(["4-5", "6-7", "8-9", "10-11"]);
export const SubjectSchema = z.enum(["reading", "maths", "science"]);
export const SessionModeSchema = z.enum(["daily_session", "live_tutor", "story_mode", "homework_help"]);
export const SessionStatusSchema = z.enum(["created", "active", "paused", "awaiting_input", "processing", "completed", "cancelled", "safety_paused"]);
export const ActorTypeSchema = z.enum(["child", "parent", "system"]);
export const SafetySeveritySchema = z.enum(["info", "warning", "high", "critical"]);
export const CurriculumNodeSchema = z.object({
  id: z.string().min(1),
  subject: SubjectSchema,
  ageBand: AgeBandSchema,
  skillCode: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  prerequisitesJson: z.array(z.string()),
  difficulty: z.number(),
  metadataJson: z.record(z.any()),
  version: z.string().min(1)
});

export const TutorResponseSchema = z.object({
  message: z.string(),
  messageStyle: z.enum(["coach", "story", "question", "feedback"]),
  suggestedUi: z.enum(["chat", "mcq", "free_text", "tap_choice", "story_panel"]),
  hints: z.array(z.string()).default([]),
  expectedResponseType: z.enum(["text", "choice", "number", "reading", "none"]),
  masterySignal: z.enum(["unknown", "improving", "mastered", "struggling"]).default("unknown"),
  shouldEscalateSafety: z.boolean().default(false),
  lessonStatePatch: z.record(z.any()).default({})
});

export const SessionCreateSchema = z.object({
  childId: z.string().min(1),
  mode: SessionModeSchema,
  subject: SubjectSchema.optional(),
  curriculumNodeId: z.string().optional()
});

export const HouseholdCreateSchema = z.object({
  ownerParentId: z.string().min(1),
  settingsJson: z.record(z.any()).default({})
});

export const ChildCreateSchema = z.object({
  householdId: z.string().min(1),
  displayName: z.string().min(1),
  birthDate: z.string().min(1),
  ageBand: AgeBandSchema,
  schoolYear: z.string().min(1),
  avatarUrl: z.string().url().optional().nullable()
});

export const SessionTurnCreateSchema = z.object({
  inputType: z.enum(["text", "voice", "image_reference", "structured_response"]),
  content: z.union([z.string(), z.record(z.any())])
});

export const HomeworkParseSchema = z.object({
  childId: z.string().min(1),
  sourceType: z.enum(["image", "text"]),
  blobUrl: z.string().optional(),
  extractedText: z.string().optional()
});

export const SafetyReviewSchema = z.object({
  childId: z.string().min(1)
});

export const SafetyEventSchema = z.object({
  id: z.string(),
  childProfileId: z.string(),
  sessionId: z.string().nullable().optional(),
  severity: SafetySeveritySchema,
  type: z.string(),
  triggerExcerpt: z.string(),
  systemAction: z.string(),
  reviewStatus: z.enum(["open", "reviewed"]),
  createdAt: z.string()
});

export const AuditEventSchema = z.object({
  id: z.string(),
  actorType: z.enum(["parent", "child", "system"]),
  actorId: z.string(),
  eventType: z.string(),
  payloadJson: z.record(z.any()),
  createdAt: z.string()
});

export type TutorResponse = z.infer<typeof TutorResponseSchema>;
export type SessionCreate = z.infer<typeof SessionCreateSchema>;
export type HouseholdCreate = z.infer<typeof HouseholdCreateSchema>;
export type ChildCreate = z.infer<typeof ChildCreateSchema>;
export type SessionTurnCreate = z.infer<typeof SessionTurnCreateSchema>;
export type HomeworkParse = z.infer<typeof HomeworkParseSchema>;
export type SafetyReview = z.infer<typeof SafetyReviewSchema>;
export type SafetyEvent = z.infer<typeof SafetyEventSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type CurriculumNode = z.infer<typeof CurriculumNodeSchema>;
