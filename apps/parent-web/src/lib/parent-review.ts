import {
  createHomeworkArtifactStore,
  createLearnerProfileStore,
  createLearnerStateStore,
  createSafetyHistoryStore,
  createSessionTranscriptStore,
  createStoryInstanceStore,
  type KeyValueStorage,
  type LocalChildProfile,
  type LocalHomeworkArtifact,
  type LocalLearnerState,
  type LocalSafetyHistoryEvent,
  type LocalSessionTranscript,
  type LocalStoryInstance
} from "@primer/local-storage";

function nowIso() {
  return new Date().toISOString();
}

export function createParentReviewStores(storage: KeyValueStorage) {
  const profileStore = createLearnerProfileStore(storage);
  const learnerStateStore = createLearnerStateStore(storage);
  const storyStore = createStoryInstanceStore(storage);
  const homeworkStore = createHomeworkArtifactStore(storage);
  const transcriptStore = createSessionTranscriptStore(storage);
  const safetyStore = createSafetyHistoryStore(storage);

  return {
    listProfiles(): LocalChildProfile[] {
      return profileStore.list();
    },
    upsertProfile(profile: LocalChildProfile): LocalChildProfile {
      return profileStore.upsert(profile);
    },
    listLearnerStates(childProfileId: string): LocalLearnerState[] {
      return learnerStateStore.listByChildProfileId(childProfileId);
    },
    upsertLearnerState(state: LocalLearnerState): LocalLearnerState {
      return learnerStateStore.upsert(state);
    },
    listStories(childProfileId: string): LocalStoryInstance[] {
      return storyStore.listByChildProfileId(childProfileId);
    },
    upsertStory(story: LocalStoryInstance): LocalStoryInstance {
      return storyStore.upsert(story);
    },
    listHomeworkArtifacts(childProfileId: string): LocalHomeworkArtifact[] {
      return homeworkStore.listByChildProfileId(childProfileId);
    },
    upsertHomeworkArtifact(artifact: LocalHomeworkArtifact): LocalHomeworkArtifact {
      return homeworkStore.upsert(artifact);
    },
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

  if (!stores.listProfiles().some((profile) => profile.id === childProfileId)) {
    stores.upsertProfile({
      id: childProfileId,
      displayName: "Ava",
      birthDate: "2018-03-12T00:00:00.000Z",
      ageBand: "6-7",
      schoolYear: "Year 2",
      accessibilitySettingsJson: {},
      permissionsJson: {},
      createdAt: nowIso()
    });
  }

  if (stores.listLearnerStates(childProfileId).length === 0) {
    stores.upsertLearnerState({
      id: `${childProfileId}_learner_reading`,
      childProfileId,
      subject: "reading",
      masteryMapJson: {
        "reading-6-7-cvc-words": 0.86
      },
      confidenceMapJson: {
        "reading-6-7-cvc-words": 0.74
      },
      misconceptionLogJson: ["mixed up short vowel sounds"],
      interestTagsJson: ["stories", "animals"],
      preferredModesJson: ["daily_session", "story_mode"],
      sessionTolerance: 15,
      updatedAt: nowIso()
    });
    stores.upsertLearnerState({
      id: `${childProfileId}_learner_maths`,
      childProfileId,
      subject: "maths",
      masteryMapJson: {
        "maths-6-7-add-within-10": 0.62
      },
      confidenceMapJson: {
        "maths-6-7-add-within-10": 0.58
      },
      misconceptionLogJson: ["skips counting one number"],
      interestTagsJson: ["puzzles"],
      preferredModesJson: ["daily_session", "homework_help"],
      sessionTolerance: 12,
      updatedAt: nowIso()
    });
  }

  if (stores.listStories(childProfileId).length === 0) {
    stores.upsertStory({
      id: `${childProfileId}_story_1`,
      childProfileId,
      curriculumNodeId: "reading-6-7-cvc-words",
      title: "Lantern Quest: CVC Words",
      branchStateJson: {
        latestSegment: "A lantern clue points toward the next reading challenge.",
        choices: [],
        path: ["look_closer", "try_it_out"]
      },
      progressJson: {
        checkpoint: 2,
        completed: false
      },
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }

  if (stores.listHomeworkArtifacts(childProfileId).length === 0) {
    stores.upsertHomeworkArtifact({
      id: `${childProfileId}_artifact_1`,
      childProfileId,
      sourceType: "text",
      blobUrl: "",
      extractedText: "12 + 4",
      parsedStructureJson: {
        problemType: "arithmetic",
        steps: ["identify numbers", "choose operation", "compute", "check result"],
        confidence: 0.82
      },
      createdAt: nowIso()
    });
  }

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

export function getParentDashboardSnapshot(storage: KeyValueStorage, childProfileId: string) {
  const stores = createParentReviewStores(storage);
  const profile = stores.listProfiles().find((entry) => entry.id === childProfileId) ?? null;
  const learnerStates = stores.listLearnerStates(childProfileId);
  const transcripts = stores.listTranscripts(childProfileId);
  const safetyEvents = stores.listSafetyEvents(childProfileId);
  const stories = stores.listStories(childProfileId);
  const homeworkArtifacts = stores.listHomeworkArtifacts(childProfileId);
  const openSafetyEvents = safetyEvents.filter((event) => event.reviewStatus === "open");
  const masteryEntries = learnerStates.reduce((count, state) => count + Object.keys(state.masteryMapJson).length, 0);

  return {
    profile,
    learnerStates,
    transcripts,
    safetyEvents,
    stories,
    homeworkArtifacts,
    stats: {
      masteryEntries,
      transcriptCount: transcripts.length,
      openSafetyCount: openSafetyEvents.length,
      homeworkCount: homeworkArtifacts.length,
      storyCount: stories.length
    }
  };
}
