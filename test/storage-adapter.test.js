import test from "node:test";
import assert from "node:assert/strict";
import {
  IndexedDBStorageAdapter,
  createIndexedDBAdapter,
  isIndexedDBAvailable,
} from "../packages/core/src/storageAdapter.js";

const SKIP_DB_TESTS = !isIndexedDBAvailable();

test("IndexedDBStorageAdapter is defined", () => {
  assert.ok(IndexedDBStorageAdapter);
  assert.equal(typeof IndexedDBStorageAdapter, "function");
});

test("isIndexedDBAvailable returns boolean", () => {
  const result = isIndexedDBAvailable();
  assert.equal(typeof result, "boolean");
});

if (SKIP_DB_TESTS) {
  test.skip("IndexedDB operations require browser environment", () => {});
} else {
  test("IndexedDB adapter initializes successfully", async () => {
    const adapter = await createIndexedDBAdapter();
    assert.ok(adapter);
    assert.equal(adapter.ready, true);
    await adapter.destroy();
  });

  test("IndexedDB adapter can save and load learner state", async () => {
    const adapter = await createIndexedDBAdapter();
    const testKey = `test-learner-state-${Date.now()}`;
    const testData = { schemaVersion: 2, learnerProfile: { learnerId: "test-user" } };
    await adapter.save(testKey, testData);
    const loaded = await adapter.load(testKey);
    assert.deepEqual(loaded, testData);
    await adapter.remove(testKey);
    await adapter.destroy();
  });

  test("IndexedDB adapter load returns null for missing key", async () => {
    const adapter = await createIndexedDBAdapter();
    const result = await adapter.load(`nonexistent-${Date.now()}`);
    assert.equal(result, null);
    await adapter.destroy();
  });

  test("IndexedDB adapter exists returns boolean", async () => {
    const adapter = await createIndexedDBAdapter();
    const testKey = `test-exists-${Date.now()}`;
    await adapter.save(testKey, { test: true });
    const exists = await adapter.exists(testKey);
    assert.equal(exists, true);
    await adapter.remove(testKey);
    await adapter.destroy();
  });

  test("IndexedDB adapter can save telemetry events", async () => {
    const adapter = await createIndexedDBAdapter();
    const event = { type: "test_event", timestamp: new Date().toISOString(), data: { test: true } };
    await adapter.saveTelemetryEvent(event);
    const events = await adapter.loadTelemetryEvents({ limit: 10 });
    assert.ok(Array.isArray(events));
    await adapter.clearTelemetryEvents();
    await adapter.destroy();
  });

  test("IndexedDB adapter cache operations work", async () => {
    const adapter = await createIndexedDBAdapter();
    const cacheKey = `cache-${Date.now()}`;
    await adapter.cacheSet(cacheKey, { cached: true }, 60000);
    const cached = await adapter.cacheGet(cacheKey);
    assert.deepEqual(cached, { cached: true });
    await adapter.cacheDelete(cacheKey);
    await adapter.destroy();
  });
}
