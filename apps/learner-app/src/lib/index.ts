import type { KeyValueStorage } from "@primer/local-storage";

function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();

  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

export function getLearnerStorage(): KeyValueStorage {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return createMemoryStorage();
}
