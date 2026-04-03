import { createLearnerState } from "@primer/learner-model";
import { createLearnerProfileStore, createLearnerStateStore, type LocalChildProfile, type LocalLearnerState } from "@primer/local-storage";
import type { Subject } from "@primer/types";
import { getLearnerStorage } from "../lib";

const storage = getLearnerStorage();
const profileStore = createLearnerProfileStore(storage);
const stateStore = createLearnerStateStore(storage);

export function listLearnerProfiles(): LocalChildProfile[] {
  return profileStore.list();
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
