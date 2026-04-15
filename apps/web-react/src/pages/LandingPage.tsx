import { useApp } from '../App';
import './LandingPage.css';

export function LandingPage() {
  const { setView, state } = useApp();

  const hasCompletedSetup = state.moduleSelection.selectedModuleId !== null;
  const hasConfiguredProvider = state.providerConfig.configuredAt !== null;

  const handleGetStarted = () => {
    if (!hasCompletedSetup) {
      setView('module-selection');
    } else if (!hasConfiguredProvider) {
      setView('provider-setup');
    } else {
      setView('tutoring');
    }
  };

  const handleContinue = () => {
    setView('concept-map');
  };

  const masteredCount = Object.values(state.pedagogicalState.masteryByConcept)
    .filter(m => m.status === 'mastered').length;

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">
            Master algebra at your own pace
          </h2>
          <p className="hero-description">
            Primer is an adaptive tutoring system that guides you through 
            a structured concept graph. Start with a diagnostic, receive 
            personalized practice, and track your progress.
          </p>
          <div className="hero-actions">
            {hasCompletedSetup && hasConfiguredProvider ? (
              <button 
                className="primary-button"
                onClick={handleContinue}
              >
                Continue Learning
              </button>
            ) : (
              <button 
                className="primary-button"
                onClick={handleGetStarted}
              >
                Get Started
              </button>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="concept-preview">
            <div className="concept-node completed">
              <span className="node-label">Variables</span>
              <span className="node-status">✓</span>
            </div>
            <div className="concept-connector" />
            <div className="concept-node completed">
              <span className="node-label">Expressions</span>
              <span className="node-status">✓</span>
            </div>
            <div className="concept-connector" />
            <div className="concept-node in-progress">
              <span className="node-label">Equations</span>
              <span className="node-status">→</span>
            </div>
            <div className="concept-connector locked" />
            <div className="concept-node locked">
              <span className="node-label">Word Problems</span>
              <span className="node-status">🔒</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h3 className="section-title">How it works</h3>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4 className="feature-title">Diagnostic Assessment</h4>
            <p className="feature-description">
              Start with a short diagnostic to understand your current level 
              and identify any gaps in your knowledge.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4 className="feature-title">Adaptive Practice</h4>
            <p className="feature-description">
              Receive personalized problems that adapt to your performance, 
              with targeted feedback and hints when you need them.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h4 className="feature-title">Concept Map</h4>
            <p className="feature-description">
              See your progress on a visual concept map. Track which 
              concepts you've mastered and what's coming next.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h4 className="feature-title">Local-First</h4>
            <p className="feature-description">
              Your data stays on your device. No accounts, no tracking. 
              Export your progress anytime.
            </p>
          </div>
        </div>
      </section>

      {masteredCount > 0 && (
        <section className="progress-section">
          <div className="progress-card">
            <h3 className="progress-title">Your Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">{masteredCount}</span>
                <span className="stat-label">Concepts Mastered</span>
              </div>
              <div className="stat">
                <span className="stat-value">{state.pedagogicalState.attemptLog.length}</span>
                <span className="stat-label">Problems Attempted</span>
              </div>
            </div>
            <button 
              className="secondary-button"
              onClick={() => setView('concept-map')}
            >
              View Concept Map
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
