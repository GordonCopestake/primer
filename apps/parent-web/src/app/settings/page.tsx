"use client";

import { useEffect, useState } from "react";
import { ParentAreaShell } from "../../features/parent-area";
import {
  exportBackupBundleJson,
  importBackupBundleJson,
  seedParentReviewDemoData,
  summarizeBackupBundleJson
} from "../../lib";

const CHILD_ID = "child_local_1";

export default function SettingsPage() {
  const [exportJson, setExportJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    seedParentReviewDemoData(localStorage, CHILD_ID);
    setExportJson(exportBackupBundleJson(localStorage));
  }, []);

  const refreshExport = () => {
    setExportJson(exportBackupBundleJson(localStorage));
  };

  const handleImport = () => {
    try {
      const manifest = importBackupBundleJson(localStorage, importJson);
      setStatus(
        `Imported backup from ${new Date(manifest.exportedAt).toLocaleString()} with ${manifest.recordCounts.profiles} profiles and ${manifest.recordCounts.sessionTranscripts} transcripts.`
      );
      refreshExport();
    } catch {
      setStatus("Import failed. Check that the backup JSON is complete and valid.");
    }
  };

  const exportSummary =
    exportJson.trim().length === 0
      ? null
      : summarizeBackupBundleJson(exportJson);

  return (
    <ParentAreaShell
      title="Parent settings"
      description="Update local parent controls, privacy preferences, and manual backup bundles."
    >
      <section aria-label="Backup summary">
        <h2>Local backup bundle</h2>
        {exportSummary === null ? (
          <p>No local backup is ready yet.</p>
        ) : (
          <ul>
            <li>Exported at: {new Date(exportSummary.exportedAt).toLocaleString()}</li>
            <li>Profiles: {exportSummary.recordCounts.profiles}</li>
            <li>Learner states: {exportSummary.recordCounts.learnerStates}</li>
            <li>Stories: {exportSummary.recordCounts.stories}</li>
            <li>Homework artifacts: {exportSummary.recordCounts.homeworkArtifacts}</li>
            <li>Session transcripts: {exportSummary.recordCounts.sessionTranscripts}</li>
            <li>Safety events: {exportSummary.recordCounts.safetyEvents}</li>
          </ul>
        )}
        <button onClick={refreshExport} type="button">
          Refresh export snapshot
        </button>
      </section>

      <section aria-label="Export backup">
        <h2>Export JSON</h2>
        <p>Copy this bundle to create a manual local backup. Parent gate secrets are not included.</p>
        <textarea readOnly rows={18} value={exportJson} />
      </section>

      <section aria-label="Import backup">
        <h2>Import JSON</h2>
        <p>Paste a previously exported bundle to restore learner and parent-review records on this device.</p>
        <textarea
          onChange={(event) => setImportJson(event.target.value)}
          placeholder="Paste a Primer backup bundle here."
          rows={18}
          value={importJson}
        />
        <button onClick={handleImport} type="button">
          Import backup bundle
        </button>
        {status ? <p>{status}</p> : null}
      </section>
    </ParentAreaShell>
  );
}
