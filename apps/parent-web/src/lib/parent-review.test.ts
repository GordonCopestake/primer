import { describe, expect, it } from "vitest";
import { createParentReviewStores, seedParentReviewDemoData } from "./parent-review";
import type { BrowserStorage } from "./parent-gate";

function createStorage(seed: Record<string, string> = {}): BrowserStorage {
  const map = new Map(Object.entries(seed));

  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    }
  };
}

describe("parent review stores", () => {
  it("seeds and lists local transcript and safety history", () => {
    const storage = createStorage();
    seedParentReviewDemoData(storage, "child_local_1");

    const stores = createParentReviewStores(storage);
    expect(stores.listTranscripts("child_local_1").length).toBeGreaterThan(0);
    expect(stores.listSafetyEvents("child_local_1").length).toBeGreaterThan(0);
  });

  it("marks safety event reviewed", () => {
    const storage = createStorage();
    const stores = createParentReviewStores(storage);

    stores.upsertSafetyEvent({
      id: "event_local_1",
      childProfileId: "child_local_1",
      severity: "warning",
      type: "story_safety_fallback",
      triggerExcerpt: "unsafe title",
      systemAction: "fallback",
      reviewStatus: "open",
      createdAt: new Date().toISOString()
    });

    const reviewed = stores.markSafetyEventReviewed("event_local_1");
    expect(reviewed?.reviewStatus).toBe("reviewed");
  });
});
