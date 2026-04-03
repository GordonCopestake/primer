import { z } from "zod";

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const WebFileRecordSchema = z.object({
  id: z.string().min(1),
  mimeType: z.string().min(1),
  contentBase64: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type WebFileRecord = z.infer<typeof WebFileRecordSchema>;

export function createStructuredStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.structured.`;

  return {
    get<T>(key: string, schema: z.ZodType<T>): T | null {
      const storageKey = `${prefix}${key}`;
      const raw = storage.getItem(storageKey);

      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw);
        return schema.parse(parsed);
      } catch {
        storage.removeItem(storageKey);
        return null;
      }
    },
    set<T>(key: string, schema: z.ZodType<T>, value: T): T {
      const valid = schema.parse(value);
      storage.setItem(`${prefix}${key}`, JSON.stringify(valid));
      return valid;
    },
    remove(key: string): void {
      storage.removeItem(`${prefix}${key}`);
    }
  };
}

export function createWebFileStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.file.`;

  const getRecord = (fileId: string): WebFileRecord | null => {
    const storageKey = `${prefix}${fileId}`;
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    try {
      return WebFileRecordSchema.parse(JSON.parse(raw));
    } catch {
      storage.removeItem(storageKey);
      return null;
    }
  };

  return {
    get(fileId: string): WebFileRecord | null {
      return getRecord(fileId);
    },
    upsert(fileId: string, input: Omit<WebFileRecord, "id" | "updatedAt">): WebFileRecord {
      const now = new Date().toISOString();
      const existing = getRecord(fileId);
      const record: WebFileRecord = {
        id: fileId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        mimeType: input.mimeType,
        contentBase64: input.contentBase64
      };

      storage.setItem(`${prefix}${fileId}`, JSON.stringify(WebFileRecordSchema.parse(record)));
      return record;
    },
    remove(fileId: string): void {
      storage.removeItem(`${prefix}${fileId}`);
    }
  };
}

export function createWebSecretStore(storage: KeyValueStorage, namespace: string) {
  const prefix = `primer.${namespace}.secret.`;

  return {
    get(secretKey: string): string | null {
      return storage.getItem(`${prefix}${secretKey}`);
    },
    set(secretKey: string, value: string): void {
      storage.setItem(`${prefix}${secretKey}`, value);
    },
    remove(secretKey: string): void {
      storage.removeItem(`${prefix}${secretKey}`);
    }
  };
}

export const localStorageFoundationNotes = {
  structuredData: "Structured records are schema-validated with Zod before read/write.",
  fileStorage: "Web file records are stored as base64 payloads and metadata in browser-local storage.",
  secrets: "Web secret storage is local-only and should be replaced by secure native storage on iOS/Android."
} as const;
