const DB_NAME = "primer-db";
const DB_VERSION = 1;
const STORES = { LEARNER_STATE: "learner-state", SCENES: "scenes", ASSETS: "assets", TELEMETRY: "telemetry", CACHE: "cache" };

let dbInstance = null;
let dbInitPromise = null;

const openDatabase = () => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => { dbInitPromise = null; reject(new Error("Failed to open IndexedDB")); };
    request.onsuccess = () => { dbInstance = request.result; dbInitPromise = null; resolve(dbInstance); };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.LEARNER_STATE)) {
        const stateStore = db.createObjectStore(STORES.LEARNER_STATE, { keyPath: "id" });
        stateStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SCENES)) {
        const sceneStore = db.createObjectStore(STORES.SCENES, { keyPath: "id" });
        sceneStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.ASSETS)) {
        const assetStore = db.createObjectStore(STORES.ASSETS, { keyPath: "id" });
        assetStore.createIndex("kind", "kind", { unique: false });
        assetStore.createIndex("installed", "installed", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.TELEMETRY)) {
        const telemetryStore = db.createObjectStore(STORES.TELEMETRY, { keyPath: "id", autoIncrement: true });
        telemetryStore.createIndex("type", "type", { unique: false });
        telemetryStore.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: "key" });
        cacheStore.createIndex("expiresAt", "expiresAt", { unique: false });
      }
    };
  });
  return dbInitPromise;
};

const transaction = (storeName, mode = "readonly") => openDatabase().then((db) => ({ tx: db.transaction(storeName, mode), store: db.transaction(storeName, mode).objectStore(storeName) }));

const promisifyRequest = (request) => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

export class IndexedDBStorageAdapter {
  constructor(options = {}) { this.name = "IndexedDB"; this.version = "1.0.0"; this._ready = false; }

  async init() { await openDatabase(); this._ready = true; return this; }
  get ready() { return this._ready; }

  async save(key, data) {
    const { store } = await transaction(STORES.LEARNER_STATE, "readwrite");
    await promisifyRequest(store.put({ id: key, data, updatedAt: Date.now() }));
    return true;
  }

  async load(key) { const { store } = await transaction(STORES.LEARNER_STATE, "readonly"); const result = await promisifyRequest(store.get(key)); return result?.data ?? null; }
  async remove(key) { const { store } = await transaction(STORES.LEARNER_STATE, "readwrite"); await promisifyRequest(store.delete(key)); return true; }
  async exists(key) { const { store } = await transaction(STORES.LEARNER_STATE, "readonly"); const result = await promisifyRequest(store.get(key)); return result !== undefined; }
  async keys() { const { store } = await transaction(STORES.LEARNER_STATE, "readonly"); return (await promisifyRequest(store.getAllKeys())).map((item) => item.id ?? item); }
  async clear() { const { store } = await transaction(STORES.LEARNER_STATE, "readwrite"); await promisifyRequest(store.clear()); return true; }

  async saveScene(sceneId, sceneData) { const { store } = await transaction(STORES.SCENES, "readwrite"); await promisifyRequest(store.put({ id: sceneId, data: sceneData, updatedAt: Date.now() })); return true; }
  async loadScene(sceneId) { const { store } = await transaction(STORES.SCENES, "readonly"); const result = await promisifyRequest(store.get(sceneId)); return result?.data ?? null; }
  async removeScene(sceneId) { const { store } = await transaction(STORES.SCENES, "readwrite"); await promisifyRequest(store.delete(sceneId)); return true; }

  async saveAsset(assetRecord) { const { store } = await transaction(STORES.ASSETS, "readwrite"); await promisifyRequest(store.put(assetRecord)); return true; }
  async loadAsset(assetId) { const { store } = await transaction(STORES.ASSETS, "readonly"); return promisifyRequest(store.get(assetId)); }
  async listAssets(kind = null) { const { store } = await transaction(STORES.ASSETS, "readonly"); if (kind) return promisifyRequest(store.index("Kind").getAll(kind)); return promisifyRequest(store.getAll()); }
  async removeAsset(assetId) { const { store } = await transaction(STORES.ASSETS, "readwrite"); await promisifyRequest(store.delete(assetId)); return true; }

  async saveTelemetryEvent(event) { const { store } = await transaction(STORES.TELEMETRY, "readwrite"); await promisifyRequest(store.put({ ...event, id: Date.now(), storedAt: Date.now() })); return true; }
  async loadTelemetryEvents(options = {}) {
    const { store } = await transaction(STORES.TELEMETRY, "readonly");
    let results = await promisifyRequest(store.getAll());
    if (options.type) results = results.filter((e) => e.type === options.type);
    if (options.since) results = results.filter((e) => new Date(e.timestamp) >= new Date(options.since));
    return results.slice(-(options.limit ?? 100));
  }
  async clearTelemetryEvents() { const { store } = await transaction(STORES.TELEMETRY, "readwrite"); await promisifyRequest(store.clear()); return true; }

  async cacheSet(key, value, ttlMs = 3600000) { const { store } = await transaction(STORES.CACHE, "readwrite"); await promisifyRequest(store.put({ key, value, expiresAt: Date.now() + ttlMs, createdAt: Date.now() })); return true; }
  async cacheGet(key) { const { store } = await transaction(STORES.CACHE, "readonly"); const result = await promisifyRequest(store.get(key)); if (!result) return null; if (result.expiresAt < Date.now()) { await this.cacheDelete(key); return null; } return result.value; }
  async cacheDelete(key) { const { store } = await transaction(STORES.CACHE, "readwrite"); await promisifyRequest(store.delete(key)); return true; }
  async cacheClear() { const { store } = await transaction(STORES.CACHE, "readwrite"); await promisifyRequest(store.clear()); return true; }

  async estimateStorage() { if (navigator.storage?.estimate) { const estimate = await navigator.storage.estimate(); return { usage: estimate.usage, quota: estimate.quota, percentUsed: estimate.quota > 0 ? (estimate.usage / estimate.quota) * 100 : 0 }; } return null; }

  async destroy() { if (dbInstance) { dbInstance.close(); dbInstance = null; } return new Promise((resolve, reject) => { const request = indexedDB.deleteDatabase(DB_NAME); request.onsuccess = () => resolve(true); request.onerror = () => reject(request.error); }); }
}

export const createIndexedDBAdapter = (options = {}) => { const adapter = new IndexedDBStorageAdapter(options); return adapter.init().then(() => adapter); };
export const isIndexedDBAvailable = () => { try { return typeof indexedDB !== "undefined" && indexedDB.open !== undefined; } catch { return false; } };
export const detectBestStorageAdapter = async () => { if (isIndexedDBAvailable()) { try { const adapter = await createIndexedDBAdapter(); await adapter.init(); return adapter; } catch { console.warn("IndexedDB unavailable, falling back to localStorage"); } } return null; };
