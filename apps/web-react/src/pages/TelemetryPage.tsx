import { useApp } from '../App';
import './TelemetryPage.css';

interface TelemetryEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function TelemetryPage() {
  const { state, setView } = useApp();
  const { telemetryEnabled, cloudEnabled } = state.consentAndSettings;

  const recentActivity: TelemetryEvent[] = state.pedagogicalState.recentActivity.map(activity => ({
    type: activity.type,
    timestamp: activity.timestamp,
    data: activity.metadata || {},
  }));

  const evidenceLog: TelemetryEvent[] = state.pedagogicalState.evidenceLog.map(evidence => ({
    type: evidence.type,
    timestamp: evidence.recordedAt,
    data: { conceptId: evidence.conceptId, delta: evidence.delta },
  }));

  const attemptLog: TelemetryEvent[] = state.pedagogicalState.attemptLog.slice(-20).map(attempt => ({
    type: 'assessment-submit',
    timestamp: attempt.timestamp,
    data: { conceptId: attempt.conceptId, correct: attempt.correct },
  }));

  const allEvents = [...recentActivity, ...evidenceLog, ...attemptLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return (
    <div className="telemetry-page">
      <header className="page-header">
        <button className="back-button" onClick={() => setView('settings')}>
          ← Back to Settings
        </button>
        <h2 className="page-title">Telemetry</h2>
      </header>

      <section className="consent-section">
        <div className="consent-status">
          <div className={`status-indicator ${telemetryEnabled ? 'enabled' : 'disabled'}`}>
            {telemetryEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="consent-info">
            <p className="consent-description">
              {telemetryEnabled
                ? 'Anonymous usage data is being collected to help improve Primer.'
                : 'Telemetry collection is disabled. Enable it in Settings to help improve Primer.'}
            </p>
            {cloudEnabled && (
              <p className="cloud-note">
                Cloud sync is also enabled - your progress data may be stored on the cloud.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="info-section">
        <h3 className="section-title">What We Collect</h3>
        <ul className="collection-list">
          <li>Anonymous session start/end events</li>
          <li>Concept mastery progress (no personal content)</li>
          <li>Feature usage patterns (e.g., hint usage)</li>
          <li>Error occurrences (no error messages)</li>
          <li>Diagnostic and assessment completion events</li>
        </ul>
      </section>

      <section className="info-section">
        <h3 className="section-title">What We Do NOT Collect</h3>
        <ul className="not-collection-list">
          <li>Your answers or input content</li>
          <li>Personal identification information</li>
          <li>AI provider API keys or configuration</li>
          <li>Error message details</li>
          <li>Any content from lessons or assessments</li>
        </ul>
      </section>

      <section className="events-section">
        <h3 className="section-title">Recent Events</h3>
        <p className="events-description">
          The last {allEvents.length} events that would be (or were) sent to telemetry.
        </p>
        
        {allEvents.length === 0 ? (
          <div className="empty-events">
            <p>No events recorded yet.</p>
            <p className="hint">Start learning to see telemetry events appear here.</p>
          </div>
        ) : (
          <div className="events-list">
            {allEvents.map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="event-item">
                <div className="event-header">
                  <span className="event-type">{event.type}</span>
                  <span className="event-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <pre className="event-data">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="privacy-section">
        <h3 className="section-title">Privacy Commitment</h3>
        <p className="privacy-text">
          Telemetry data is aggregated and anonymized. We cannot identify individual
          learners from telemetry data. Data is used solely for product improvement
          purposes and is never sold or shared with third parties.
        </p>
      </section>
    </div>
  );
}
