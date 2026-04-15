import React from 'react';
import { LearnerState } from '../types';

export function createDefaultLearnerState(): LearnerState {
  return {
    schemaVersion: 2,
    learnerProfile: {
      learnerId: `local-${Date.now().toString(36)}`,
      locale: navigator.language || 'en',
      interests: [],
      avatarSeed: null,
      preferredModalities: ['visual', 'interactive'],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
    moduleSelection: {
      selectedModuleId: null,
      availableModuleIds: ['algebra-foundations'],
      selectedAt: null,
    },
    pedagogicalState: {
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
      recentActivity: [],
      lessonRecords: {},
      attemptLog: [],
      goals: [],
      milestones: [],
    },
    runtimeSession: {
      activeSceneId: null,
      lastScene: null,
      recentTurns: [],
      runningSummary: null,
    },
    consentAndSettings: {
      cloudEnabled: false,
      cloudImageEnabled: false,
      cloudVisionEnabled: false,
      telemetryEnabled: false,
      adminPinEnabled: false,
      adminPinHash: null,
      adminUnlocked: false,
      captionsEnabled: true,
      soundEnabled: true,
      storagePersistenceGranted: 'unknown',
    },
    providerConfig: {
      providerName: 'openrouter',
      modelName: '',
      endpointUrl: '',
      apiKey: '',
      configuredAt: null,
    },
    capabilities: {
      tier: 'standard-local',
      webgpu: false,
      opfs: false,
      indexedDb: true,
      localTTS: 'speechSynthesis' in window,
      localSTT: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      microphone: false,
    },
    assetIndex: {
      manifestVersion: 1,
      byId: {},
      quotaEstimate: null,
    },
    exportMetadata: {
      lastExportedAt: null,
      lastImportedAt: null,
      exportFormatVersion: 2,
    },
  };
}

export function useLearnerState() {
  const [state, setState] = React.useState<LearnerState>(() => createDefaultLearnerState());

  React.useEffect(() => {
    const stored = localStorage.getItem('primer.state.v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.schemaVersion) {
          setState(parsed);
        }
      } catch {
        // Use default state
      }
    }
  }, []);

  const persistState = React.useCallback((newState: LearnerState) => {
    localStorage.setItem('primer.state.v2', JSON.stringify(newState));
    setState(newState);
  }, []);

  return { state, setState: persistState };
}
