import { describe, expect, it } from "vitest";
import {
  isParentGateConfigured,
  isParentGateUnlocked,
  isValidParentPin,
  PARENT_GATE_UNLOCKED_UNTIL_KEY,
  setParentGateUnlocked,
  storeParentPinHash,
  type BrowserStorage
} from "./parent-gate";

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

describe("parent-gate storage helpers", () => {
  it("validates 4-8 digit pin values", () => {
    expect(isValidParentPin("1234")).toBe(true);
    expect(isValidParentPin("12345678")).toBe(true);
    expect(isValidParentPin("123")).toBe(false);
    expect(isValidParentPin("abcd")).toBe(false);
  });

  it("detects configured gate from stored pin hash", () => {
    const configuredStorage = createStorage();
    storeParentPinHash(configuredStorage, "hash");

    expect(isParentGateConfigured(configuredStorage)).toBe(true);
    expect(isParentGateConfigured(createStorage())).toBe(false);
  });

  it("stores and evaluates unlock window timestamps", () => {
    const storage = createStorage();
    const now = 10_000;
    const unlockedUntil = setParentGateUnlocked(storage, now);

    expect(unlockedUntil).toBeGreaterThan(now);
    expect(isParentGateUnlocked(storage, now + 1)).toBe(true);
    expect(isParentGateUnlocked(storage, unlockedUntil + 1)).toBe(false);
    expect(storage.getItem(PARENT_GATE_UNLOCKED_UNTIL_KEY)).toBeNull();
  });
});
