"use client";

import { useEffect, useState } from "react";
import { ParentAreaShell } from "../../features/parent-area";
import { getParentDashboardSnapshot, seedParentReviewDemoData } from "../../lib";

const CHILD_ID = "child_local_1";

type DashboardSnapshot = ReturnType<typeof getParentDashboardSnapshot>;

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function ProgressPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    seedParentReviewDemoData(localStorage, CHILD_ID);
    setSnapshot(getParentDashboardSnapshot(localStorage, CHILD_ID));
  }, []);

  return (
    <ParentAreaShell
      title="Progress"
      description="Inspect mastery trends and milestones from local learner history."
    >
      {snapshot === null ? (
        <p>Loading local learner progress…</p>
      ) : snapshot.learnerStates.length === 0 ? (
        <p>No learner state has been saved on this device yet.</p>
      ) : (
        <ul>
          {snapshot.learnerStates.map((state) => (
            <li key={state.id}>
              <h2>{state.subject}</h2>
              <p>Session tolerance: {state.sessionTolerance} minutes</p>
              <p>Preferred modes: {state.preferredModesJson.join(", ")}</p>
              <p>Interests: {state.interestTagsJson.join(", ")}</p>
              <p>
                Misconceptions:{" "}
                {state.misconceptionLogJson.length === 0 ? "none logged" : state.misconceptionLogJson.join(", ")}
              </p>
              <h3>Mastery</h3>
              <ul>
                {Object.entries(state.masteryMapJson).map(([nodeId, mastery]) => (
                  <li key={`${state.id}_${nodeId}`}>
                    {nodeId}: {formatPercent(mastery)} mastery,{" "}
                    {formatPercent(state.confidenceMapJson[nodeId] ?? 0)} confidence
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
