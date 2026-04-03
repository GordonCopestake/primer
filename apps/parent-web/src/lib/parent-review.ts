import {
  createSafetyHistoryStore,
  createSessionTranscriptStore,
  type KeyValueStorage,
  type LocalSafetyHistoryEvent,
  type LocalSessionTranscript
} from "@primer/local-storage";

function nowIso() {
  return new Date().toISOString();
}

export function createParentReviewStores(storage: KeyValueStorage) {
  const transcriptStore = createSessionTranscriptStore(storage);
  const safetyStore = createSafetyHistoryStore(storage);

  return {
    listTranscripts(childProfileId: string): LocalSessionTranscript[] {
      return transcriptStore.listByChildProfileId(childProfileId);
    },
    upsertTranscript(transcript: LocalSessionTranscript): LocalSessionTranscript {
      return transcriptStore.upsert(transcript);
    },
    listSafetyEvents(childProfileId: string): LocalSafetyHistoryEvent[] {
      return safetyStore.listByChildProfileId(childProfileId);
    },
    upsertSafetyEvent(event: LocalSafetyHistoryEvent): LocalSafetyHistoryEvent {
      return safetyStore.upsert(event);
    },
    markSafetyEventReviewed(eventId: string): LocalSafetyHistoryEvent | null {
      return safetyStore.markReviewed(eventId, nowIso());
    }
  };
}

export function seedParentReviewDemoData(storage: KeyValueStorage, childProfileId: string) {
  const stores = createParentReviewStores(storage);

  if (stores.listTranscripts(childProfileId).length === 0) {
    stores.upsertTranscript({
      id: `${childProfileId}_transcript_1`,
      childProfileId,
      sessionId: `${childProfileId}_session_1`,
      mode: "daily_session",
      turns: [
        { actor: "tutor", text: "Let's solve 8 + 7 together.", createdAt: nowIso() },
        { actor: "child", text: "I think it is 15.", createdAt: nowIso() }
      ],
      summary: "Practised number bonds and showed improving confidence.",
      createdAt: nowIso()
    });
  }

  if (stores.listSafetyEvents(childProfileId).length === 0) {
    stores.upsertSafetyEvent({
      id: `${childProfileId}_event_1`,
      childProfileId,
      severity: "warning",
      type: "homework_safety_fallback",
      triggerExcerpt: "keep this secret",
      systemAction: "safe_fallback_response",
      reviewStatus: "open",
      createdAt: nowIso()
    });
  }
}
