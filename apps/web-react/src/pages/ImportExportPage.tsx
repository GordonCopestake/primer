import React, { useState, useRef } from 'react';
import { useApp } from '../App';
import { encryptForExport, decryptFromImport, isEncryptedExport } from '../../../../packages/core/src/encryption.js';
import './ImportExportPage.css';

export function ImportExportPage() {
  const { state, updateState, setView } = useApp();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [showExportPasswordPrompt, setShowExportPasswordPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!exportPassword || exportPassword.length < 4) {
      setImportMessage('Password must be at least 4 characters');
      setImportStatus('error');
      return;
    }

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

    try {
      const encrypted = await encryptForExport(exportData, exportPassword);
      const blob = new Blob([encrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `primer-backup-${new Date().toISOString().split('T')[0]}.enc`;
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

      setShowExportPasswordPrompt(false);
      setExportPassword('');
      setImportStatus('success');
      setImportMessage('Backup exported and encrypted!');
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Export failed: ' + String(error));
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!importPassword || importPassword.length < 4) {
      setImportMessage('Enter password to decrypt backup');
      setImportStatus('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const imported = isEncryptedExport(content)
          ? await decryptFromImport(content, importPassword)
          : JSON.parse(content);

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
        setImportPassword('');
      } catch (error) {
        setImportStatus('error');
        setImportMessage(String(error).includes('Decryption')
          ? 'Decryption failed - wrong password?'
          : 'Failed to import: Invalid or corrupted backup');
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
          Export your progress to create an encrypted backup, or import a previous backup to restore your data.
          Backups are encrypted with AES-256-GCM using your chosen password.
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
        <h3 className="section-title">Export Encrypted Backup</h3>
        <p className="section-description">
          Download an encrypted JSON file with your chosen password.
        </p>
        {!showExportPasswordPrompt ? (
          <button
            className="primary-button"
            onClick={() => setShowExportPasswordPrompt(true)}
          >
            <span className="button-icon">↓</span>
            Export Data
          </button>
        ) : (
          <div className="password-prompt">
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              placeholder="Enter encryption password (min 4 chars)"
              className="password-input"
              minLength={4}
            />
            <div className="password-actions">
              <button className="action-button" onClick={handleExport}>
                Confirm & Export
              </button>
              <button
                className="action-button secondary"
                onClick={() => {
                  setShowExportPasswordPrompt(false);
                  setExportPassword('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="action-section">
        <h3 className="section-title">Import Backup</h3>
        <p className="section-description">
          Restore from a previous backup. Enter the password used during export.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".enc,.json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <input
          type="password"
          value={importPassword}
          onChange={(e) => setImportPassword(e.target.value)}
          placeholder="Enter import password"
          className="password-input"
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
          <li>Your password cannot be recovered - don't lose it!</li>
        </ul>
      </section>

      <section className="schema-section">
        <h3 className="section-title">Export Format</h3>
        <div className="schema-info">
          <code className="schema-version">Encrypted v1 (AES-256-GCM)</code>
        </div>
      </section>
    </div>
  );
}