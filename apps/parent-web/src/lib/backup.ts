import {
  exportLocalBackupBundle,
  importLocalBackupBundle,
  LocalBackupBundleSchema,
  type ExportBundleManifest,
  type KeyValueStorage
} from "@primer/local-storage";

export type BrowserStorage = KeyValueStorage;

export function exportBackupBundleJson(storage: BrowserStorage): string {
  return JSON.stringify(exportLocalBackupBundle(storage), null, 2);
}

export function importBackupBundleJson(storage: BrowserStorage, json: string): ExportBundleManifest {
  const parsed = LocalBackupBundleSchema.parse(JSON.parse(json));
  return importLocalBackupBundle(storage, parsed).manifest;
}

export function summarizeBackupBundleJson(json: string): ExportBundleManifest {
  return LocalBackupBundleSchema.parse(JSON.parse(json)).manifest;
}
