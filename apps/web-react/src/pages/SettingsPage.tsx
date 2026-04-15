import { useState } from 'react';
import { useApp } from '../App';
import './SettingsPage.css';

export function SettingsPage() {
  const { state, updateState, setView } = useApp();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleToggleCloud = () => {
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        cloudEnabled: !state.consentAndSettings.cloudEnabled,
      },
    });
  };

  const handleToggleTelemetry = () => {
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        telemetryEnabled: !state.consentAndSettings.telemetryEnabled,
      },
    });
  };

  const handleToggleCaptions = () => {
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        captionsEnabled: !state.consentAndSettings.captionsEnabled,
      },
    });
  };

  const handleToggleSound = () => {
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        soundEnabled: !state.consentAndSettings.soundEnabled,
      },
    });
  };

  const handleSetupPin = () => {
    if (pinInput.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    const hash = btoa(pinInput);
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        adminPinEnabled: true,
        adminPinHash: hash,
      },
    });
    setPinInput('');
    setShowPinSetup(false);
    setPinError('');
  };

  const handleRemovePin = () => {
    updateState({
      consentAndSettings: {
        ...state.consentAndSettings,
        adminPinEnabled: false,
        adminPinHash: null,
      },
    });
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      updateState({
        pedagogicalState: {
          ...state.pedagogicalState,
          diagnosticStatus: 'not-started',
          diagnosticStep: 0,
          readiness: 'unknown',
          currentConceptId: null,
          currentLessonId: null,
          currentObjectiveId: null,
          recommendedConceptId: null,
          masteryByConcept: {},
          misconceptionsByConcept: {},
          evidenceLog: [],
          reviewSchedule: [],
          attemptLog: [],
          goals: [],
          milestones: [],
        },
      });
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This will delete your progress, settings, and configuration. This cannot be undone.')) {
      localStorage.removeItem('primer.state.v2');
      window.location.reload();
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <button className="back-button" onClick={() => setView('tutoring')}>
          ← Back
        </button>
        <h2 className="page-title">Settings</h2>
      </header>

      <section className="settings-section">
        <h3 className="section-title">Accessibility</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Captions</span>
            <span className="setting-description">Show captions for audio content</span>
          </div>
          <button
            className={`toggle-button ${state.consentAndSettings.captionsEnabled ? 'on' : 'off'}`}
            onClick={handleToggleCaptions}
            aria-pressed={state.consentAndSettings.captionsEnabled}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Sound Effects</span>
            <span className="setting-description">Play sounds for feedback</span>
          </div>
          <button
            className={`toggle-button ${state.consentAndSettings.soundEnabled ? 'on' : 'off'}`}
            onClick={handleToggleSound}
            aria-pressed={state.consentAndSettings.soundEnabled}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">Privacy</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Anonymous Telemetry</span>
            <span className="setting-description">Help improve Primer by sharing anonymous usage data</span>
          </div>
          <button
            className={`toggle-button ${state.consentAndSettings.telemetryEnabled ? 'on' : 'off'}`}
            onClick={handleToggleTelemetry}
            aria-pressed={state.consentAndSettings.telemetryEnabled}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Cloud Sync</span>
            <span className="setting-description">Sync progress across devices (requires API configuration)</span>
          </div>
          <button
            className={`toggle-button ${state.consentAndSettings.cloudEnabled ? 'on' : 'off'}`}
            onClick={handleToggleCloud}
            aria-pressed={state.consentAndSettings.cloudEnabled}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">Security</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Admin PIN Protection</span>
            <span className="setting-description">
              {state.consentAndSettings.adminPinEnabled 
                ? 'PIN protection is enabled' 
                : 'Require PIN to access settings'}
            </span>
          </div>
          {state.consentAndSettings.adminPinEnabled ? (
            <button className="action-button danger" onClick={handleRemovePin}>
              Remove PIN
            </button>
          ) : (
            <button className="action-button" onClick={() => setShowPinSetup(!showPinSetup)}>
              Set PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <div className="pin-setup">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (min 4 characters)"
              className="pin-input"
              maxLength={8}
            />
            {pinError && <p className="error-message">{pinError}</p>}
            <div className="pin-actions">
              <button className="action-button" onClick={handleSetupPin}>Save PIN</button>
              <button className="action-button secondary" onClick={() => { setShowPinSetup(false); setPinInput(''); setPinError(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3 className="section-title">Data Management</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Import / Export</span>
            <span className="setting-description">Backup or restore your progress</span>
          </div>
          <button className="action-button" onClick={() => setView('import-export')}>
            Manage Data
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Reset Progress</span>
            <span className="setting-description">Clear all learning progress (keeps settings)</span>
          </div>
          <button className="action-button danger" onClick={handleResetProgress}>
            Reset
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Clear All Data</span>
            <span className="setting-description">Delete all data including settings and configuration</span>
          </div>
          <button className="action-button danger" onClick={handleClearAllData}>
            Clear All
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">Provider Configuration</h3>
        <button className="action-button full-width" onClick={() => setView('provider-setup')}>
          Configure AI Provider
        </button>
      </section>

      <section className="settings-section">
        <h3 className="section-title">Telemetry</h3>
        <button className="action-button" onClick={() => setView('telemetry')}>
          View Telemetry Details
        </button>
      </section>
    </div>
  );
}
