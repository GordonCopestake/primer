export const PARENT_GATE_PIN_HASH_KEY = "primer.parentGate.pinHash";
export const PARENT_GATE_UNLOCKED_UNTIL_KEY = "primer.parentGate.unlockedUntil";

export const PARENT_GATE_UNLOCK_WINDOW_MS = 10 * 60 * 1000;

export type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function isValidParentPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export function isParentGateConfigured(storage: BrowserStorage): boolean {
  return Boolean(storage.getItem(PARENT_GATE_PIN_HASH_KEY));
}

export function isParentGateUnlocked(storage: BrowserStorage, nowMs = Date.now()): boolean {
  const unlockedUntil = storage.getItem(PARENT_GATE_UNLOCKED_UNTIL_KEY);

  if (!unlockedUntil) {
    return false;
  }

  const parsed = Number(unlockedUntil);

  if (!Number.isFinite(parsed) || parsed <= nowMs) {
    storage.removeItem(PARENT_GATE_UNLOCKED_UNTIL_KEY);
    return false;
  }

  return true;
}

export function setParentGateUnlocked(storage: BrowserStorage, nowMs = Date.now()): number {
  const unlockedUntil = nowMs + PARENT_GATE_UNLOCK_WINDOW_MS;
  storage.setItem(PARENT_GATE_UNLOCKED_UNTIL_KEY, String(unlockedUntil));
  return unlockedUntil;
}

async function digestSha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hashBytes = Array.from(new Uint8Array(digest));
  return hashBytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashParentPin(pin: string): Promise<string> {
  return digestSha256(pin);
}
