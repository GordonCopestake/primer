import { useApp } from '../App';
import './ModuleSelectionPage.css';

interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  concepts: number;
  estimatedHours: number;
  difficulty: string;
}

const availableModules: ModuleInfo[] = [
  {
    id: 'algebra-foundations',
    title: 'Algebra Foundations',
    description: 'Master the fundamentals of algebra including variables, expressions, equations, and problem-solving techniques.',
    concepts: 20,
    estimatedHours: 10,
    difficulty: 'Beginner',
  },
];

export function ModuleSelectionPage() {
  const { state, updateState, setView } = useApp();

  const handleSelectModule = (moduleId: string) => {
    updateState({
      moduleSelection: {
        ...state.moduleSelection,
        selectedModuleId: moduleId,
        selectedAt: new Date().toISOString(),
      },
      pedagogicalState: {
        ...state.pedagogicalState,
        diagnosticStatus: 'not-started',
        diagnosticStep: 0,
      },
    });
    setView('tutoring');
  };

  return (
    <div className="module-selection-page">
      <header className="page-header">
        <h2 className="page-title">Choose Your Module</h2>
        <p className="page-description">
          Select a subject module to begin your learning journey. Each module 
          contains a structured concept graph with adaptive practice.
        </p>
      </header>

      <div className="modules-grid">
        {availableModules.map(module => (
          <article key={module.id} className="module-card">
            <div className="module-header">
              <span className="module-badge">{module.difficulty}</span>
              <h3 className="module-title">{module.title}</h3>
            </div>
            
            <p className="module-description">{module.description}</p>
            
            <div className="module-stats">
              <div className="module-stat">
                <span className="stat-icon">📚</span>
                <span className="stat-value">{module.concepts}</span>
                <span className="stat-label">Concepts</span>
              </div>
              <div className="module-stat">
                <span className="stat-icon">⏱️</span>
                <span className="stat-value">~{module.estimatedHours}h</span>
                <span className="stat-label">Estimated</span>
              </div>
            </div>

            <button
              className="module-select-button"
              onClick={() => handleSelectModule(module.id)}
            >
              Start Module
            </button>
          </article>
        ))}

        <article className="module-card coming-soon">
          <div className="module-header">
            <span className="module-badge upcoming">Coming Soon</span>
            <h3 className="module-title">Geometry</h3>
          </div>
          
          <p className="module-description">
            Shapes, area, volume, and geometric proofs.
          </p>
          
          <div className="module-stats">
            <div className="module-stat">
              <span className="stat-icon">📚</span>
              <span className="stat-value">25</span>
              <span className="stat-label">Concepts</span>
            </div>
            <div className="module-stat">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">~12h</span>
              <span className="stat-label">Estimated</span>
            </div>
          </div>

          <button className="module-select-button" disabled>
            Coming Soon
          </button>
        </article>
      </div>
    </div>
  );
}
