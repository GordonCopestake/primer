import React, { useState, useRef } from 'react';
import { useApp } from '../App';
import './ImportExportPage.css';

export function ImportExportPage() {
  const { state, updateState, setView } = useApp();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      schemaVersion: state.schemaVersion,
      learnerProfile: state.learnerProfile,
      pedagogicalState: state.pedagogicalState,
      consentAndSettings: state.consentAndSettings,
      exportMetadata: {
        ...state.exportMetadata,
        lastExportedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primer-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updateState({
      exportMetadata: {
        ...state.exportMetadata,
        lastExportedAt: new Date().toISOString(),
      },
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (!imported.schemaVersion || !imported.learnerProfile || !imported.pedagogicalState) {
          throw new Error('Invalid backup file format');
        }

        updateState({
          ...state,
          ...imported,
          exportMetadata: {
            ...state.exportMetadata,
            lastImportedAt: new Date().toISOString(),
          },
        });

        setImportStatus('success');
        setImportMessage('Backup restored successfully!');
      } catch {
        setImportStatus('error');
        setImportMessage('Failed to import: Invalid or corrupted backup file');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMergeImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="import-export-page">
      <header className="page-header">
        <button className="back-button" onClick={() => setView('settings')}>
          ← Back to Settings
        </button>
        <h2 className="page-title">Import & Export</h2>
      </header>

      <section className="info-section">
        <p className="info-text">
          Export your progress to create a backup, or import a previous backup to restore your data.
          Exports include your learning progress, mastery records, and settings.
        </p>
        {state.exportMetadata.lastExportedAt && (
          <p className="last-export">
            Last exported: {new Date(state.exportMetadata.lastExportedAt).toLocaleString()}
          </p>
        )}
        {state.exportMetadata.lastImportedAt && (
          <p className="last-import">
            Last imported: {new Date(state.exportMetadata.lastImportedAt).toLocaleString()}
          </p>
        )}
      </section>

      <section className="action-section">
        <h3 className="section-title">Export Backup</h3>
        <p className="section-description">
          Download a JSON file containing all your progress and settings.
        </p>
        <button className="primary-button" onClick={handleExport}>
          <span className="button-icon">↓</span>
          Export Data
        </button>
      </section>

      <section className="action-section">
        <h3 className="section-title">Import Backup</h3>
        <p className="section-description">
          Restore from a previous backup. This will replace your current progress.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button className="primary-button" onClick={handleMergeImport}>
          <span className="button-icon">↑</span>
          Choose Backup File
        </button>

        {importStatus !== 'idle' && (
          <div className={`status-message ${importStatus}`}>
            {importMessage}
          </div>
        )}
      </section>

      <section className="warning-section">
        <h3 className="warning-title">Important Notes</h3>
        <ul className="warning-list">
          <li>Backups do not include your AI provider configuration</li>
          <li>Importing will replace all current progress</li>
          <li>Keep your backup files in a safe location</li>
          <li>Backup files are not encrypted - avoid sharing them publicly</li>
        </ul>
      </section>

      <section className="schema-section">
        <h3 className="section-title">Export Format</h3>
        <div className="schema-info">
          <code className="schema-version">Schema v{state.exportMetadata.exportFormatVersion}</code>
          <pre className="schema-preview">
{`{
  "schemaVersion": 2,
  "learnerProfile": { ... },
  "pedagogicalState": { ... },
  "consentAndSettings": { ... }
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
