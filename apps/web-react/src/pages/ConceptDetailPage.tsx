import { useApp } from '../App';
import { Concept } from '../types';
import './ConceptDetailPage.css';
// @ts-ignore - local JS module
import { ALGEBRA_FOUNDATIONS_MODULE } from '../../../../packages/core/src/algebraModule.js';

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

  const fullConcept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((c: Concept) => c.id === selectedConcept.id) || selectedConcept;
  const mastery = state.pedagogicalState.masteryByConcept[selectedConcept.id];
  const masteryPercent = mastery ? Math.round((mastery.score / (fullConcept.masteryThreshold || 1)) * 100) : 0;

  const prerequisites = (fullConcept.prerequisites || []).map((prereqId: string) => {
    const prereqConcept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((c: Concept) => c.id === prereqId);
    const prereq = { 
      id: prereqId, 
      label: prereqConcept?.label || prereqId.charAt(0).toUpperCase() + prereqId.slice(1).replace(/-/g, ' ') 
    };
    const prereqMastery = state.pedagogicalState.masteryByConcept[prereqId];
    return { ...prereq, mastered: prereqMastery?.status === 'mastered' };
  });

  const dependents = (fullConcept.dependents || []).map((depId: string) => {
    const depConcept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((c: Concept) => c.id === depId);
    return {
      id: depId,
      label: depConcept?.label || depId.charAt(0).toUpperCase() + depId.slice(1).replace(/-/g, ' '),
    };
  });

  return (
    <div className="concept-detail-page">
      <button className="back-button" onClick={() => setView('concept-map')}>
        ← Back to Concept Map
      </button>

      <header className="concept-header">
        <h2 className="concept-title">{fullConcept.label}</h2>
        <div className="concept-meta">
          <span className="meta-badge">{fullConcept.estimatedMinutes || 20} min</span>
          {fullConcept.optional && <span className="meta-badge optional">Optional</span>}
          {mastery?.status === 'mastered' && <span className="meta-badge mastered">Mastered</span>}
        </div>
      </header>

      <p className="concept-description">{fullConcept.description}</p>

      {mastery && (
        <div className="mastery-section">
          <h3 className="section-title">Your Progress</h3>
          <div className="mastery-bar-container">
            <div className="mastery-bar-fill" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="mastery-stats">
            <span>{mastery.score}/1 mastered</span>
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
          <code>{fullConcept.masteryRule || 'Complete exercises to demonstrate mastery'}</code>
        </div>
      </div>

      {prerequisites.length > 0 && (
        <div className="prerequisites-section">
          <h3 className="section-title">Prerequisites</h3>
          <div className="prerequisites-list">
            {prerequisites.map((prereq: { id: string; label: string; mastered: boolean }) => (
              <div key={prereq.id} className={`prerequisite-item ${prereq.mastered ? 'mastered' : ''}`}>
                <span className="prereq-status">{prereq.mastered ? '✓' : '○'}</span>
                <span className="prereq-label">{prereq.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dependents.length > 0 && (
        <div className="dependents-section">
          <h3 className="section-title">Leads To</h3>
          <div className="dependents-list">
            {dependents.map((dep: { id: string; label: string }) => (
              <div key={dep.id} className="dependent-item">
                <span className="dep-label">{dep.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fullConcept.misconceptionTags && fullConcept.misconceptionTags.length > 0 && (
        <div className="misconceptions-section">
          <h3 className="section-title">Common Misconceptions</h3>
          <ul className="misconceptions-list">
            {fullConcept.misconceptionTags.map((tag: string) => (
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