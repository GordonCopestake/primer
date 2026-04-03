import { createLearnerState } from "@primer/learner-model";
import {
  createHomeworkArtifactStore,
  createLearnerProfileStore,
  createLearnerStateStore,
  createSessionTranscriptStore,
  createStoryInstanceStore,
  type LocalChildProfile,
  type LocalHomeworkArtifact,
  type LocalLearnerState,
  type LocalSessionTranscript,
  type LocalStoryInstance
} from "@primer/local-storage";
import type { Subject } from "@primer/types";
import { getLearnerStorage } from "../lib";

const storage = getLearnerStorage();
const profileStore = createLearnerProfileStore(storage);
const stateStore = createLearnerStateStore(storage);
const transcriptStore = createSessionTranscriptStore(storage);
const storyStore = createStoryInstanceStore(storage);
const homeworkArtifactStore = createHomeworkArtifactStore(storage);

export function listLearnerProfiles(): LocalChildProfile[] {
  return profileStore.list();
}

export function getLearnerProfile(profileId: string): LocalChildProfile | null {
  return profileStore.get(profileId);
}

export function upsertLearnerProfile(profile: LocalChildProfile): LocalChildProfile {
  return profileStore.upsert(profile);
}

export function getLearnerState(childProfileId: string, subject: Subject): LocalLearnerState {
  const existing = stateStore.get(childProfileId, subject);
  if (existing) {
    return existing;
  }

  const created = createLearnerState(childProfileId, subject);
  return stateStore.upsert(created);
}

export function upsertLearnerState(state: LocalLearnerState): LocalLearnerState {
  return stateStore.upsert(state);
}

export function listSessionTranscripts(childProfileId: string): LocalSessionTranscript[] {
  return transcriptStore.listByChildProfileId(childProfileId);
}

export function upsertSessionTranscript(transcript: LocalSessionTranscript): LocalSessionTranscript {
  return transcriptStore.upsert(transcript);
}

export function listStoryInstances(childProfileId: string): LocalStoryInstance[] {
  return storyStore.listByChildProfileId(childProfileId);
}

export function upsertStoryInstance(story: LocalStoryInstance): LocalStoryInstance {
  return storyStore.upsert(story);
}


export function listHomeworkArtifacts(childProfileId: string): LocalHomeworkArtifact[] {
  return homeworkArtifactStore.listByChildProfileId(childProfileId);
}

export function upsertHomeworkArtifact(artifact: LocalHomeworkArtifact): LocalHomeworkArtifact {
  return homeworkArtifactStore.upsert(artifact);
}
