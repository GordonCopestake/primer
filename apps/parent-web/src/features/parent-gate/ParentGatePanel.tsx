"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  hashParentPin,
  isParentGateConfigured,
  isParentGateUnlocked,
  isValidParentPin,
  PARENT_GATE_PIN_HASH_KEY,
  setParentGateUnlocked
} from "../../lib/parent-gate";

const parentAreaLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/children", label: "Children" },
  { href: "/progress", label: "Progress" },
  { href: "/sessions", label: "Sessions" },
  { href: "/safety", label: "Safety" },
  { href: "/settings", label: "Settings" }
];

export function ParentGatePanel() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setConfigured(isParentGateConfigured(localStorage));
    setUnlocked(isParentGateUnlocked(localStorage));
    setIsHydrated(true);
  }, []);

  const mode = useMemo(() => {
    if (!isHydrated) {
      return "loading";
    }

    if (!configured) {
      return "setup";
    }

    if (!unlocked) {
      return "unlock";
    }

    return "unlocked";
  }, [configured, isHydrated, unlocked]);

  async function handleSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!isValidParentPin(setupPin)) {
      setErrorMessage("Use a 4-8 digit PIN.");
      return;
    }

    if (setupPin !== setupConfirmPin) {
      setErrorMessage("PIN values do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const pinHash = await hashParentPin(setupPin);
      localStorage.setItem(PARENT_GATE_PIN_HASH_KEY, pinHash);
      setParentGateUnlocked(localStorage);
      setConfigured(true);
      setUnlocked(true);
      setSetupPin("");
      setSetupConfirmPin("");
      setStatusMessage("Parent gate PIN saved on this device.");
    } catch {
      setErrorMessage("Unable to set parent gate right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!isValidParentPin(unlockPin)) {
      setErrorMessage("Enter your 4-8 digit parent PIN.");
      return;
    }

    setIsSubmitting(true);

    try {
      const enteredHash = await hashParentPin(unlockPin);
      const storedHash = localStorage.getItem(PARENT_GATE_PIN_HASH_KEY);

      if (!storedHash || enteredHash !== storedHash) {
        setErrorMessage("Incorrect PIN.");
        return;
      }

      setParentGateUnlocked(localStorage);
      setUnlocked(true);
      setUnlockPin("");
      setStatusMessage("Parent area unlocked for this session window.");
    } catch {
      setErrorMessage("Unable to unlock parent area right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "loading") {
    return <p>Loading parent gate…</p>;
  }

  if (mode === "setup") {
    return (
      <main>
        <h1>Set up parent gate</h1>
        <p>Create a local PIN to protect parent controls on this device.</p>

        <form onSubmit={handleSetup}>
          <label htmlFor="parent-pin">Parent PIN</label>
          <input
            id="parent-pin"
            inputMode="numeric"
            autoComplete="off"
            value={setupPin}
            onChange={(event) => setSetupPin(event.target.value.replace(/\D/g, ""))}
          />

          <label htmlFor="parent-pin-confirm">Confirm PIN</label>
          <input
            id="parent-pin-confirm"
            inputMode="numeric"
            autoComplete="off"
            value={setupConfirmPin}
            onChange={(event) => setSetupConfirmPin(event.target.value.replace(/\D/g, ""))}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save PIN"}
          </button>
        </form>

        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        {statusMessage ? <p>{statusMessage}</p> : null}
      </main>
    );
  }

  if (mode === "unlock") {
    return (
      <main>
        <h1>Unlock parent area</h1>
        <p>Enter your local parent PIN to access progress, settings, and safety review.</p>

        <form onSubmit={handleUnlock}>
          <label htmlFor="unlock-parent-pin">Parent PIN</label>
          <input
            id="unlock-parent-pin"
            inputMode="numeric"
            autoComplete="off"
            value={unlockPin}
            onChange={(event) => setUnlockPin(event.target.value.replace(/\D/g, ""))}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        {statusMessage ? <p>{statusMessage}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <h1>Parent area</h1>
      <p>Unlocked locally on this device.</p>

      <ul>
        {parentAreaLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
