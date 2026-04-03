"use client";

import { useEffect, useState } from "react";
import { ParentAreaShell } from "../../features/parent-area";
import { getParentDashboardSnapshot, seedParentReviewDemoData } from "../../lib";

const CHILD_ID = "child_local_1";

type DashboardSnapshot = ReturnType<typeof getParentDashboardSnapshot>;

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    seedParentReviewDemoData(localStorage, CHILD_ID);
    setSnapshot(getParentDashboardSnapshot(localStorage, CHILD_ID));
  }, []);

  return (
    <ParentAreaShell
      title="Parent dashboard"
      description="Review local progress, activity highlights, and safety status for this device."
    >
      {snapshot === null ? (
        <p>Loading local dashboard data…</p>
      ) : (
        <>
          <section aria-label="Child overview">
            <h2>{snapshot.profile?.displayName ?? "Child profile unavailable"}</h2>
            {snapshot.profile ? (
              <p>
                Age band {snapshot.profile.ageBand} · {snapshot.profile.schoolYear}
              </p>
            ) : (
              <p>No local child profile has been saved on this device yet.</p>
            )}
          </section>

          <section aria-label="Activity summary">
            <h2>Activity summary</h2>
            <ul>
              <li>{snapshot.stats.masteryEntries} mastery entries tracked locally</li>
              <li>{snapshot.stats.transcriptCount} transcript records saved</li>
              <li>{snapshot.stats.storyCount} story sessions in progress</li>
              <li>{snapshot.stats.homeworkCount} homework artifacts captured</li>
              <li>{snapshot.stats.openSafetyCount} safety events still need review</li>
            </ul>
          </section>

          <section aria-label="Recent local activity">
            <h2>Recent local activity</h2>
            <ul>
              {snapshot.transcripts.slice(0, 1).map((transcript) => (
                <li key={transcript.id}>
                  Latest session: {transcript.summary}
                </li>
              ))}
              {snapshot.stories.slice(0, 1).map((story) => (
                <li key={story.id}>
                  Story checkpoint: {story.title} at checkpoint {story.progressJson.checkpoint}
                </li>
              ))}
              {snapshot.homeworkArtifacts.slice(0, 1).map((artifact) => (
                <li key={artifact.id}>Latest homework: {artifact.extractedText}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </ParentAreaShell>
  );
}
