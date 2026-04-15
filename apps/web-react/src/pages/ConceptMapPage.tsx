import { useApp } from '../App';
import { Concept } from '../types';
// @ts-ignore - local JS module
import { deriveConceptStatuses } from '../../../../packages/core/src/curriculumEngine.js';
import { ALGEBRA_FOUNDATIONS_MODULE } from '../../../../packages/core/src/algebraModule.js';
import './ConceptMapPage.css';

interface ConceptStatus extends Concept {
  state: 'locked' | 'available' | 'in progress' | 'mastered' | 'review due' | 'recommended next';
}

export function ConceptMapPage() {
  const { state, setView, setSelectedConcept } = useApp();
  const masteryByConcept = state.pedagogicalState.masteryByConcept;

  const conceptStatuses = deriveConceptStatuses(state) as ConceptStatus[];
  void state.pedagogicalState.recommendedConceptId;

  const getConceptStatus = (conceptId: string): 'locked' | 'available' | 'in-progress' | 'mastered' | 'review due' | 'recommended next' => {
    const statusInfo = conceptStatuses.find((c: ConceptStatus) => c.id === conceptId);
    if (!statusInfo) return 'locked';
    
    if (statusInfo.state === 'mastered') return 'mastered';
    if (statusInfo.state === 'review due') return 'review due';
    if (statusInfo.state === 'in progress') return 'in-progress';
    if (statusInfo.state === 'recommended next') return 'in-progress';
    if (statusInfo.state === 'available') return 'available';
    return 'locked';
  };

  const masteredCount = Object.values(masteryByConcept).filter(m => m.status === 'mastered').length;
  const totalConcepts = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.length;

  const handleConceptClick = (concept: Concept) => {
    setSelectedConcept(concept);
    setView('concept-detail');
  };

  return (
    <div className="concept-map-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Concept Mastery Map</h2>
          <p className="page-description">
            Track your progress through the {ALGEBRA_FOUNDATIONS_MODULE.title} module
          </p>
        </div>
        <div className="progress-summary">
          <span className="progress-value">{masteredCount}/{totalConcepts}</span>
          <span className="progress-label">Mastered</span>
        </div>
      </header>

      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0}%` }}
        />
      </div>

      <div className="concept-grid">
        {conceptStatuses.map((concept: ConceptStatus, index: number) => {
          const status = getConceptStatus(concept.id);
          const isClickable = status !== 'locked';

          return (
            <div key={concept.id} className="concept-map-row">
              <div className="row-index">{index + 1}</div>
              
              <button
                className={`concept-node ${status}`}
                onClick={() => isClickable && handleConceptClick(concept)}
                disabled={!isClickable}
                aria-label={`${concept.label}: ${status}`}
              >
                <div className="node-content">
                  <span className="node-label">{concept.label}</span>
                  <span className="node-status-icon">
                    {status === 'mastered' && '✓'}
                    {status === 'in-progress' && '→'}
                    {status === 'available' && '○'}
                    {status === 'review due' && '🔄'}
                    {status === 'locked' && '🔒'}
                  </span>
                </div>
                {status !== 'locked' && (
                  <p className="node-description">{concept.description}</p>
                )}
              </button>

              {concept.dependents && concept.dependents.length > 0 && (
                <div className="connector-line leads-to">
                  <span className="connector-arrow">↓</span>
                  <span className="connector-label">{concept.dependents.length === 1 
                    ? ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((c: Concept) => c.id === concept.dependents[0])?.label
                    : `${concept.dependents.length} concepts`}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="legend">
        <h4 className="legend-title">Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">🔒</span>
            <span>Locked (complete prerequisites first)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">○</span>
            <span>Available (ready to learn)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">→</span>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">✓</span>
            <span>Mastered</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🔄</span>
            <span>Review Due</span>
          </div>
        </div>
      </div>
    </div>
  );
}