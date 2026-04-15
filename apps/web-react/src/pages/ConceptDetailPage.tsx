import { useApp } from '../App';
import './ConceptDetailPage.css';

export function ConceptDetailPage() {
  const { selectedConcept, state, setView } = useApp();

  if (!selectedConcept) {
    return (
      <div className="concept-detail-page">
        <div className="empty-state">
          <p>No concept selected.</p>
          <button onClick={() => setView('concept-map')}>Back to Concept Map</button>
        </div>
      </div>
    );
  }

  const mastery = state.pedagogicalState.masteryByConcept[selectedConcept.id];
  const masteryPercent = mastery ? Math.round((mastery.score / selectedConcept.masteryThreshold) * 100) : 0;

  const prerequisites = selectedConcept.prerequisites.map(prereqId => {
    const prereq = { id: prereqId, label: prereqId.charAt(0).toUpperCase() + prereqId.slice(1).replace(/-/g, ' ') };
    const prereqMastery = state.pedagogicalState.masteryByConcept[prereqId];
    return { ...prereq, mastered: prereqMastery?.status === 'mastered' };
  });

  return (
    <div className="concept-detail-page">
      <button className="back-button" onClick={() => setView('concept-map')}>
        ← Back to Concept Map
      </button>

      <header className="concept-header">
        <h2 className="concept-title">{selectedConcept.label}</h2>
        <div className="concept-meta">
          <span className="meta-badge">{selectedConcept.estimatedMinutes} min</span>
          {selectedConcept.optional && <span className="meta-badge optional">Optional</span>}
          {mastery?.status === 'mastered' && <span className="meta-badge mastered">Mastered</span>}
        </div>
      </header>

      <p className="concept-description">{selectedConcept.description}</p>

      {mastery && (
        <div className="mastery-section">
          <h3 className="section-title">Your Progress</h3>
          <div className="mastery-bar-container">
            <div className="mastery-bar-fill" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="mastery-stats">
            <span>{mastery.score}/{selectedConcept.masteryThreshold} mastered</span>
            <span>{masteryPercent}%</span>
          </div>
          {mastery.lastPracticedAt && (
            <p className="last-practiced">
              Last practiced: {new Date(mastery.lastPracticedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className="mastery-rule-section">
        <h3 className="section-title">Mastery Rule</h3>
        <div className="mastery-rule-card">
          <code>{selectedConcept.masteryRule}</code>
        </div>
      </div>

      {prerequisites.length > 0 && (
        <div className="prerequisites-section">
          <h3 className="section-title">Prerequisites</h3>
          <div className="prerequisites-list">
            {prerequisites.map(prereq => (
              <div key={prereq.id} className={`prerequisite-item ${prereq.mastered ? 'mastered' : ''}`}>
                <span className="prereq-status">{prereq.mastered ? '✓' : '○'}</span>
                <span className="prereq-label">{prereq.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedConcept.misconceptionTags.length > 0 && (
        <div className="misconceptions-section">
          <h3 className="section-title">Common Misconceptions</h3>
          <ul className="misconceptions-list">
            {selectedConcept.misconceptionTags.map(tag => (
              <li key={tag} className="misconception-item">
                {tag.replace(/-/g, ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-section">
        <button 
          className="start-lesson-button"
          onClick={() => setView('tutoring')}
        >
          {mastery ? 'Continue Learning' : 'Start Learning'}
        </button>
      </div>
    </div>
  );
}
