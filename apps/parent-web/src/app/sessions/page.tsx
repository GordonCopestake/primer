"use client";

import { useEffect, useState } from "react";
import { ParentAreaShell } from "../../features/parent-area";
import { createParentReviewStores, seedParentReviewDemoData } from "../../lib";
import type { LocalSessionTranscript } from "@primer/local-storage";

const CHILD_ID = "child_local_1";

export default function SessionsPage() {
  const [transcripts, setTranscripts] = useState<ReturnType<ReturnType<typeof createParentReviewStores>["listTranscripts"]>>([]);

  useEffect(() => {
    seedParentReviewDemoData(localStorage, CHILD_ID);
    const stores = createParentReviewStores(localStorage);
    setTranscripts(stores.listTranscripts(CHILD_ID));
  }, []);

  return (
    <ParentAreaShell
      title="Session transcripts"
      description="Review recent tutoring sessions saved locally for parent visibility."
    >
      {transcripts.length === 0 ? (
        <p>No session transcripts saved on this device yet.</p>
      ) : (
        <ul>
          {transcripts.map((transcript) => (
            <li key={transcript.id}>
              <p>
                <strong>{transcript.mode}</strong> · {new Date(transcript.createdAt).toLocaleString()}
              </p>
              <p>{transcript.summary}</p>
              <ul>
                {transcript.turns.map((turn: LocalSessionTranscript["turns"][number], index: number) => (
                  <li key={`${transcript.id}_${index}`}>
                    {turn.actor}: {turn.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </ParentAreaShell>
  );
}
