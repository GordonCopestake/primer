import { describe, expect, it } from "vitest";
import { importBackupBundleJson, exportBackupBundleJson, summarizeBackupBundleJson } from "./backup";
import { seedParentReviewDemoData } from "./parent-review";
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

describe("backup helpers", () => {
  it("exports and summarizes a local backup bundle", () => {
    const storage = createStorage();
    seedParentReviewDemoData(storage, "child_local_1");

    const json = exportBackupBundleJson(storage);
    const summary = summarizeBackupBundleJson(json);

    expect(summary.version).toBe(1);
    expect(summary.recordCounts.profiles).toBeGreaterThan(0);
    expect(summary.recordCounts.sessionTranscripts).toBeGreaterThan(0);
  });

  it("imports a backup bundle into a fresh storage target", () => {
    const sourceStorage = createStorage();
    const targetStorage = createStorage();
    seedParentReviewDemoData(sourceStorage, "child_local_1");

    const manifest = importBackupBundleJson(targetStorage, exportBackupBundleJson(sourceStorage));

    expect(manifest.recordCounts.learnerStates).toBeGreaterThan(0);
    expect(manifest.recordCounts.safetyEvents).toBeGreaterThan(0);
  });
});
