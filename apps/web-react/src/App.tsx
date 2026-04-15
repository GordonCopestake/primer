import React, { useState, useEffect, useCallback } from 'react';
import { LearnerState, Concept, SceneBlueprint } from './types';
import { LandingPage } from './pages/LandingPage';
import { ProviderSetupPage } from './pages/ProviderSetupPage';
import { ModuleSelectionPage } from './pages/ModuleSelectionPage';
import { TutoringWorkspacePage } from './pages/TutoringWorkspacePage';
import { ConceptMapPage } from './pages/ConceptMapPage';
import { ConceptDetailPage } from './pages/ConceptDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { AppShell } from './components/AppShell';
import { createDefaultLearnerState } from './hooks/useLearnerState';

export type AppView = 
  | 'landing'
  | 'provider-setup'
  | 'module-selection'
  | 'tutoring'
  | 'concept-map'
  | 'concept-detail'
  | 'settings'
  | 'import-export'
  | 'telemetry';

export interface AppContextValue {
  state: LearnerState;
  updateState: (updates: Partial<LearnerState>) => void;
  currentView: AppView;
  setView: (view: AppView) => void;
  selectedConcept: Concept | null;
  setSelectedConcept: (concept: Concept | null) => void;
  currentScene: SceneBlueprint | null;
  setCurrentScene: (scene: SceneBlueprint | null) => void;
}

export const AppContext = React.createContext<AppContextValue | null>(null);

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export function App() {
  const [state, setState] = useState<LearnerState>(() => {
    const stored = localStorage.getItem('primer.state.v2');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return createDefaultLearnerState();
      }
    }
    return createDefaultLearnerState();
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (!state.moduleSelection.selectedModuleId) {
      return 'landing';
    }
    if (!state.providerConfig.configuredAt) {
      return 'provider-setup';
    }
    if (state.pedagogicalState.diagnosticStatus === 'not-started') {
      return 'module-selection';
    }
    return 'tutoring';
  });

  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [currentScene, setCurrentScene] = useState<SceneBlueprint | null>(null);

  useEffect(() => {
    localStorage.setItem('primer.state.v2', JSON.stringify(state));
  }, [state]);

  const updateState = useCallback((updates: Partial<LearnerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const contextValue: AppContextValue = {
    state,
    updateState,
    currentView,
    setView: navigateTo,
    selectedConcept,
    setSelectedConcept,
    currentScene,
    setCurrentScene,
  };

  const renderPage = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'provider-setup':
        return <ProviderSetupPage />;
      case 'module-selection':
        return <ModuleSelectionPage />;
      case 'tutoring':
        return <TutoringWorkspacePage />;
      case 'concept-map':
        return <ConceptMapPage />;
      case 'concept-detail':
        return <ConceptDetailPage />;
      case 'settings':
        return <SettingsPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'telemetry':
        return <TelemetryPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AppShell>
        {renderPage()}
      </AppShell>
    </AppContext.Provider>
  );
}
