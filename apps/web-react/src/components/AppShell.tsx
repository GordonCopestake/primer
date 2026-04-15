import React from 'react';
import { useApp, AppView } from '../App';
import './AppShell.css';

interface NavItem {
  id: AppView;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'landing', label: 'Home', icon: '🏠' },
  { id: 'tutoring', label: 'Tutor', icon: '📚' },
  { id: 'concept-map', label: 'Concepts', icon: '🗺️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'import-export', label: 'Backup', icon: '💾' },
  { id: 'telemetry', label: 'Telemetry', icon: '📊' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentView, setView, state } = useApp();

  const masteredCount = Object.values(state.pedagogicalState.masteryByConcept)
    .filter(m => m.status === 'mastered').length;

  const totalConcepts = 20;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">Primer</h1>
          <span className="app-tagline">Adaptive Algebra Tutor</span>
        </div>

        <nav className="app-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-button ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-header-right">
          <div className="progress-indicator" aria-label={`Progress: ${masteredCount} of ${totalConcepts} concepts mastered`}>
            <span className="progress-text">{masteredCount}/{totalConcepts}</span>
            <span className="progress-label">mastered</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="app-main" role="main">
        {children}
      </main>

      <footer className="app-footer">
        <p className="footer-text">
          Primer v0.1.0 — Open-source AI tutoring platform
        </p>
        <p className="footer-subtext">
          Local-first, privacy-respecting, BYO AI key
        </p>
      </footer>
    </div>
  );
}
