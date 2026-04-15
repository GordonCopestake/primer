import { useApp } from '../App';
import { Concept } from '../types';
import './ConceptMapPage.css';

const mockConceptGraph: Concept[] = [
  { id: 'variables', label: 'Variables', description: 'Understanding variables as placeholders', prerequisites: [], dependents: ['expressions'], masteryRule: 'Understand x as unknown', masteryThreshold: 1, misconceptionTags: ['variable-as-label'], estimatedMinutes: 15, optional: false },
  { id: 'expressions', label: 'Expressions', description: 'Writing and evaluating expressions', prerequisites: ['variables'], dependents: ['equations'], masteryRule: 'Evaluate 3x+2 for x=4', masteryThreshold: 1, misconceptionTags: ['order-of-ops'], estimatedMinutes: 20, optional: false },
  { id: 'equations', label: 'One-Step Equations', description: 'Solving x+a=b', prerequisites: ['expressions'], dependents: ['two-step'], masteryRule: 'Solve x+5=12', masteryThreshold: 1, misconceptionTags: ['inverse-ops'], estimatedMinutes: 25, optional: false },
  { id: 'two-step', label: 'Two-Step Equations', description: 'Solving ax+b=c', prerequisites: ['equations'], dependents: [], masteryRule: 'Solve 2x+3=11', masteryThreshold: 1, misconceptionTags: [], estimatedMinutes: 30, optional: false },
];

export function ConceptMapPage() {
  const { state, setView, setSelectedConcept } = useApp();
  const masteryByConcept = state.pedagogicalState.masteryByConcept;

  const getConceptStatus = (conceptId: string): 'locked' | 'available' | 'in-progress' | 'mastered' => {
    const mastery = masteryByConcept[conceptId];
    if (mastery?.status === 'mastered') return 'mastered';
    if (mastery?.status === 'in-progress') return 'in-progress';
    
    const concept = mockConceptGraph.find(c => c.id === conceptId);
    if (!concept) return 'locked';
    
    const prereqsMet = concept.prerequisites.every(p => masteryByConcept[p]?.status === 'mastered');
    return prereqsMet ? 'available' : 'locked';
  };

  const masteredCount = Object.values(masteryByConcept).filter(m => m.status === 'mastered').length;
  const totalConcepts = mockConceptGraph.length;

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
            Track your progress through the algebra foundations module
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
          style={{ width: `${(masteredCount / totalConcepts) * 100}%` }}
        />
      </div>

      <div className="concept-grid">
        {mockConceptGraph.map((concept, index) => {
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
                    {status === 'locked' && '🔒'}
                  </span>
                </div>
                {status !== 'locked' && (
                  <p className="node-description">{concept.description}</p>
                )}
              </button>

              {concept.dependents.length > 0 && (
                <div className="connector-line">
                  <span className="connector-label">leads to</span>
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
        </div>
      </div>
    </div>
  );
}
