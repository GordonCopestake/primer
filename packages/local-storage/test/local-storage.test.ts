import { describe, expect, test } from "vitest";
import { z } from "zod";

import { createStructuredStore, createWebFileStore, createWebSecretStore } from "../src/index";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    }
  };
}

describe("structured store", () => {
  test("writes and reads schema-validated data", () => {
    const storage = createMemoryStorage();
    const store = createStructuredStore(storage, "learner");

    const schema = z.object({ streak: z.number().int().min(0) });
    store.set("progress", schema, { streak: 3 });

    expect(store.get("progress", schema)).toEqual({ streak: 3 });
  });

  test("cleans invalid persisted values", () => {
    const storage = createMemoryStorage();
    storage.setItem("primer.learner.structured.progress", "not-json");
    const store = createStructuredStore(storage, "learner");

    expect(store.get("progress", z.object({ streak: z.number() }))).toBeNull();
    expect(storage.getItem("primer.learner.structured.progress")).toBeNull();
  });
});

describe("web file store", () => {
  test("upserts with stable createdAt and refreshed updatedAt", async () => {
    const storage = createMemoryStorage();
    const store = createWebFileStore(storage, "homework");

    const first = store.upsert("artifact-1", {
      createdAt: new Date().toISOString(),
      mimeType: "image/png",
      contentBase64: "abc"
    });

    await new Promise((resolve) => setTimeout(resolve, 2));

    const second = store.upsert("artifact-1", {
      createdAt: new Date().toISOString(),
      mimeType: "image/png",
      contentBase64: "def"
    });

    expect(second.createdAt).toBe(first.createdAt);
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(first.updatedAt).getTime());
    expect(second.contentBase64).toBe("def");
  });
});

describe("web secret store", () => {
  test("writes and removes local-only secrets", () => {
    const storage = createMemoryStorage();
    const store = createWebSecretStore(storage, "parentGate");

    store.set("pinHash", "hash-value");
    expect(store.get("pinHash")).toBe("hash-value");

    store.remove("pinHash");
    expect(store.get("pinHash")).toBeNull();
  });
});
