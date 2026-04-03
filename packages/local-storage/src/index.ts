import { z } from "zod";

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const WebFileRecordSchema = z.object({
  id: z.string().min(1),
  mimeType: z.string().min(1),
  contentBase64: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type WebFileRecord = z.infer<typeof WebFileRecordSchema>;

const LocalAgeBandSchema = z.enum(["4-5", "6-7", "8-9", "10-11"]);
const LocalSubjectSchema = z.enum(["reading", "maths", "science"]);
const LocalSessionModeSchema = z.enum(["daily_session", "live_tutor", "story_mode", "homework_help"]);

export const LocalChildProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  birthDate: z.string().datetime(),
  ageBand: LocalAgeBandSchema,
  schoolYear: z.string().min(1),
  accessibilitySettingsJson: z.record(z.unknown()),
  permissionsJson: z.record(z.unknown()),
  createdAt: z.string().datetime()
});

export type LocalChildProfile = z.infer<typeof LocalChildProfileSchema>;

export const LocalLearnerStateSchema = z.object({
  id: z.string().min(1),
  childProfileId: z.string().min(1),
  subject: LocalSubjectSchema,
  masteryMapJson: z.record(z.number()),
  confidenceMapJson: z.record(z.number()),
  misconceptionLogJson: z.array(z.string()),
  interestTagsJson: z.array(z.string()),
  preferredModesJson: z.array(LocalSessionModeSchema),
  sessionTolerance: z.number().int().min(1),
  updatedAt: z.string().datetime()
});

export type LocalLearnerState = z.infer<typeof LocalLearnerStateSchema>;

export const LocalStoryInstanceSchema = z.object({
  id: z.string().min(1),
  childProfileId: z.string().min(1),
  curriculumNodeId: z.string().min(1),
  title: z.string().min(1),
  branchStateJson: z.record(z.unknown()),
  progressJson: z.object({
    checkpoint: z.number().int().min(0),
    completed: z.boolean()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type LocalStoryInstance = z.infer<typeof LocalStoryInstanceSchema>;

export const LocalHomeworkArtifactSchema = z.object({
  id: z.string().min(1),
  childProfileId: z.string().min(1),
  sourceType: z.enum(["image", "text"]),
  blobUrl: z.string(),
  extractedText: z.string(),
  parsedStructureJson: z.object({
    problemType: z.string(),
    steps: z.array(z.string()),
    confidence: z.number().min(0).max(1)
  }),
  createdAt: z.string().datetime()
});

export type LocalHomeworkArtifact = z.infer<typeof LocalHomeworkArtifactSchema>;

export const LocalTranscriptTurnSchema = z.object({
  actor: z.enum(["child", "tutor", "system"]),
  text: z.string(),
  createdAt: z.string().datetime()
});

export const LocalSessionTranscriptSchema = z.object({
  id: z.string().min(1),
  childProfileId: z.string().min(1),
  sessionId: z.string().min(1),
  mode: LocalSessionModeSchema,
  turns: z.array(LocalTranscriptTurnSchema),
  summary: z.string(),
  createdAt: z.string().datetime()
});

export type LocalSessionTranscript = z.infer<typeof LocalSessionTranscriptSchema>;

export const LocalSafetyHistoryEventSchema = z.object({
  id: z.string().min(1),
  childProfileId: z.string().min(1),
  severity: z.enum(["info", "warning", "high", "critical"]),
  type: z.string().min(1),
  triggerExcerpt: z.string(),
  systemAction: z.string(),
  reviewStatus: z.enum(["open", "reviewed"]),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional()
});

export type LocalSafetyHistoryEvent = z.infer<typeof LocalSafetyHistoryEventSchema>;

export function createStructuredStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.structured.`;

  return {
    get<T>(key: string, schema: z.ZodType<T>): T | null {
      const storageKey = `${prefix}${key}`;
      const raw = storage.getItem(storageKey);

      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw);
        return schema.parse(parsed);
      } catch {
        storage.removeItem(storageKey);
        return null;
      }
    },
    set<T>(key: string, schema: z.ZodType<T>, value: T): T {
      const valid = schema.parse(value);
      storage.setItem(`${prefix}${key}`, JSON.stringify(valid));
      return valid;
    },
    remove(key: string): void {
      storage.removeItem(`${prefix}${key}`);
    }
  };
}

export function createLearnerProfileStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "learnerProfiles");
  const listSchema = LocalChildProfileSchema.array();
  const indexKey = "profiles";

  return {
    list(): LocalChildProfile[] {
      return structured.get(indexKey, listSchema) ?? [];
    },
    get(profileId: string): LocalChildProfile | null {
      return this.list().find((profile) => profile.id === profileId) ?? null;
    },
    upsert(profile: LocalChildProfile): LocalChildProfile {
      const valid = LocalChildProfileSchema.parse(profile);
      const nextProfiles = this.list().filter((existing) => existing.id !== valid.id);
      nextProfiles.push(valid);
      nextProfiles.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      structured.set(indexKey, listSchema, nextProfiles);
      return valid;
    },
    remove(profileId: string): void {
      const nextProfiles = this.list().filter((profile) => profile.id !== profileId);
      structured.set(indexKey, listSchema, nextProfiles);
    }
  };
}

export function createLearnerStateStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "learnerState");
  const listSchema = LocalLearnerStateSchema.array();
  const indexKey = "states";

  return {
    listByChildProfileId(childProfileId: string): LocalLearnerState[] {
      return (structured.get(indexKey, listSchema) ?? []).filter((state) => state.childProfileId === childProfileId);
    },
    get(childProfileId: string, subject: LocalLearnerState["subject"]): LocalLearnerState | null {
      return this.listByChildProfileId(childProfileId).find((state) => state.subject === subject) ?? null;
    },
    upsert(state: LocalLearnerState): LocalLearnerState {
      const valid = LocalLearnerStateSchema.parse(state);
      const current = structured.get(indexKey, listSchema) ?? [];
      const nextStates = current.filter((existing) => existing.id !== valid.id);
      nextStates.push(valid);
      nextStates.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      structured.set(indexKey, listSchema, nextStates);
      return valid;
    },
    remove(stateId: string): void {
      const nextStates = (structured.get(indexKey, listSchema) ?? []).filter((state) => state.id !== stateId);
      structured.set(indexKey, listSchema, nextStates);
    }
  };
}

export function createStoryInstanceStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "storyInstances");
  const listSchema = LocalStoryInstanceSchema.array();
  const indexKey = "stories";

  return {
    listByChildProfileId(childProfileId: string): LocalStoryInstance[] {
      return (structured.get(indexKey, listSchema) ?? []).filter((story) => story.childProfileId === childProfileId);
    },
    get(storyId: string): LocalStoryInstance | null {
      return (structured.get(indexKey, listSchema) ?? []).find((story) => story.id === storyId) ?? null;
    },
    upsert(story: LocalStoryInstance): LocalStoryInstance {
      const valid = LocalStoryInstanceSchema.parse(story);
      const current = structured.get(indexKey, listSchema) ?? [];
      const nextStories = current.filter((existing) => existing.id !== valid.id);
      nextStories.push(valid);
      nextStories.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      structured.set(indexKey, listSchema, nextStories);
      return valid;
    },
    remove(storyId: string): void {
      const nextStories = (structured.get(indexKey, listSchema) ?? []).filter((story) => story.id !== storyId);
      structured.set(indexKey, listSchema, nextStories);
    }
  };
}

export function createHomeworkArtifactStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "homeworkArtifacts");
  const listSchema = LocalHomeworkArtifactSchema.array();
  const indexKey = "artifacts";

  return {
    listByChildProfileId(childProfileId: string): LocalHomeworkArtifact[] {
      return (structured.get(indexKey, listSchema) ?? []).filter((artifact) => artifact.childProfileId === childProfileId);
    },
    get(artifactId: string): LocalHomeworkArtifact | null {
      return (structured.get(indexKey, listSchema) ?? []).find((artifact) => artifact.id === artifactId) ?? null;
    },
    upsert(artifact: LocalHomeworkArtifact): LocalHomeworkArtifact {
      const valid = LocalHomeworkArtifactSchema.parse(artifact);
      const current = structured.get(indexKey, listSchema) ?? [];
      const nextArtifacts = current.filter((existing) => existing.id !== valid.id);
      nextArtifacts.push(valid);
      nextArtifacts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      structured.set(indexKey, listSchema, nextArtifacts);
      return valid;
    },
    remove(artifactId: string): void {
      const nextArtifacts = (structured.get(indexKey, listSchema) ?? []).filter((artifact) => artifact.id !== artifactId);
      structured.set(indexKey, listSchema, nextArtifacts);
    }
  };
}

export function createSessionTranscriptStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "sessionTranscripts");
  const listSchema = LocalSessionTranscriptSchema.array();
  const indexKey = "transcripts";

  return {
    listByChildProfileId(childProfileId: string): LocalSessionTranscript[] {
      return (structured.get(indexKey, listSchema) ?? []).filter((transcript) => transcript.childProfileId === childProfileId);
    },
    upsert(transcript: LocalSessionTranscript): LocalSessionTranscript {
      const valid = LocalSessionTranscriptSchema.parse(transcript);
      const current = structured.get(indexKey, listSchema) ?? [];
      const nextTranscripts = current.filter((existing) => existing.id !== valid.id);
      nextTranscripts.push(valid);
      nextTranscripts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      structured.set(indexKey, listSchema, nextTranscripts);
      return valid;
    }
  };
}

export function createSafetyHistoryStore(storage: KeyValueStorage) {
  const structured = createStructuredStore(storage, "safetyHistory");
  const listSchema = LocalSafetyHistoryEventSchema.array();
  const indexKey = "events";

  return {
    listByChildProfileId(childProfileId: string): LocalSafetyHistoryEvent[] {
      return (structured.get(indexKey, listSchema) ?? []).filter((event) => event.childProfileId === childProfileId);
    },
    upsert(event: LocalSafetyHistoryEvent): LocalSafetyHistoryEvent {
      const valid = LocalSafetyHistoryEventSchema.parse(event);
      const current = structured.get(indexKey, listSchema) ?? [];
      const nextEvents = current.filter((existing) => existing.id !== valid.id);
      nextEvents.push(valid);
      nextEvents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      structured.set(indexKey, listSchema, nextEvents);
      return valid;
    },
    markReviewed(eventId: string, reviewedAt = new Date().toISOString()): LocalSafetyHistoryEvent | null {
      const current = structured.get(indexKey, listSchema) ?? [];
      let updatedEvent: LocalSafetyHistoryEvent | null = null;

      const updated = current.map((event) => {
        if (event.id !== eventId) return event;
        updatedEvent = {
          ...event,
          reviewStatus: "reviewed",
          reviewedAt
        };
        return updatedEvent;
      });

      structured.set(indexKey, listSchema, updated);
      return updatedEvent;
    }
  };
}

export function createWebFileStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.file.`;

  const getRecord = (fileId: string): WebFileRecord | null => {
    const storageKey = `${prefix}${fileId}`;
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    try {
      return WebFileRecordSchema.parse(JSON.parse(raw));
    } catch {
      storage.removeItem(storageKey);
      return null;
    }
  };

  return {
    get(fileId: string): WebFileRecord | null {
      return getRecord(fileId);
    },
    upsert(fileId: string, input: Omit<WebFileRecord, "id" | "updatedAt">): WebFileRecord {
      const now = new Date().toISOString();
      const existing = getRecord(fileId);
      const record: WebFileRecord = {
        id: fileId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        mimeType: input.mimeType,
        contentBase64: input.contentBase64
      };

      storage.setItem(`${prefix}${fileId}`, JSON.stringify(WebFileRecordSchema.parse(record)));
      return record;
    },
    remove(fileId: string): void {
      storage.removeItem(`${prefix}${fileId}`);
    }
  };
}

export function createWebSecretStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.secret.`;

  return {
    get(secretKey: string): string | null {
      return storage.getItem(`${prefix}${secretKey}`);
    },
    set(secretKey: string, value: string): void {
      storage.setItem(`${prefix}${secretKey}`, value);
    },
    remove(secretKey: string): void {
      storage.removeItem(`${prefix}${secretKey}`);
    }
  };
}

export const localStorageFoundationNotes = {
  structuredData: "Structured records are schema-validated with Zod before read/write.",
  fileStorage: "Web file records are stored as base64 payloads and metadata in browser-local storage.",
  secrets: "Web secret storage is local-only and should be replaced by secure native storage on iOS/Android.",
  learnerProfiles: "Child profiles persist in local structured storage and remain on-device by default.",
  learnerState: "Per-subject learner mastery and confidence state is stored locally and schema-validated.",
  storyInstances: "Story progress checkpoints persist locally with structured story state and completion markers.",
  homeworkArtifacts: "Homework artifacts and guided solve steps persist locally for parent-visible review.",
  sessionTranscripts: "Session transcript history is stored locally for parent-only review.",
  safetyHistory: "Safety events are tracked locally with review status for parent controls."
} as const;
