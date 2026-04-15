import { nextCurriculumDecision, deriveConceptStatuses, applyMasteryEvidence, advanceTutoringSession, advanceAssessment } from './curriculumEngine.js';
import { ALGEBRA_SUBJECT_PACK, getLessonForConcept, getInitialConceptId, getRecommendedConceptId, getDiagnosticPlacementConceptId } from './algebraModule.js';
import { createProviderClient, isProviderConfigured } from './providerClient.js';
import { validateMathResponse } from './mathValidation.js';
import { createDefaultState } from './state.js';

const SCENE_TEMPLATES = {
  'diagnostic': {
    sceneKind: 'diagnostic',
    promptTemplate: 'You are conducting a brief diagnostic assessment.\n\n{prompt}\n\nRespond with: {response_type}',
    responseField: 'learnerResponse',
    validationRequired: true,
  },
  'explain': {
    sceneKind: 'explain',
    promptTemplate: 'Explain the concept: {concept_description}\n\nKeep your explanation clear and scaffolded.',
    responseField: null,
    validationRequired: false,
  },
  'worked-example': {
    sceneKind: 'worked-example',
    promptTemplate: 'Here is a worked example:\n\n{worked_example}\n\nStudy this example carefully.',
    responseField: null,
    validationRequired: false,
  },
  'learner-attempt': {
    sceneKind: 'learner-attempt',
    promptTemplate: 'Try this problem:\n\n{prompt}\n\n{failed_attempts}',
    responseField: 'learnerResponse',
    validationRequired: true,
  },
  'hint': {
    sceneKind: 'hint',
    promptTemplate: 'Hint: {hint}\n\nUse this hint if you are stuck.',
    responseField: null,
    validationRequired: false,
  },
  'feedback': {
    sceneKind: 'feedback',
    promptTemplate: 'Feedback: {feedback}\n\n{next_step}',
    responseField: null,
    validationRequired: false,
  },
  'remediation': {
    sceneKind: 'remediation',
    promptTemplate: 'Let\'s review this concept:\n\n{remediation_content}\n\nTake your time to understand before trying again.',
    responseField: null,
    validationRequired: false,
  },
  'recommendation': {
    sceneKind: 'recommendation',
    promptTemplate: '{recommendation_message}',
    responseField: null,
    validationRequired: false,
  },
};

const formatDiagnosticPrompt = (decision, state) => {
  const item = ALGEBRA_SUBJECT_PACK.listAssessmentItems().find(i => i.id === decision.objectiveId);
  if (!item) return decision.prompt;
  return item.prompt;
};

const formatLessonPrompt = (decision, state, failedAttempts = []) => {
  const lesson = getLessonForConcept(decision.conceptId);
  if (!lesson) return decision.prompt;
  
  let prompt = lesson.prompt || '';
  if (failedAttempts.length > 0) {
    prompt += '\n\nYour previous attempts: ' + failedAttempts.map(a => a.input).join(', ');
  }
  return prompt;
};

const getHintForLesson = (decision) => {
  const lesson = getLessonForConcept(decision.conceptId);
  return lesson?.hint || 'Review the concept and try again.';
};

const getRemediationForLesson = (decision) => {
  const lesson = getLessonForConcept(decision.conceptId);
  return lesson?.remediation || 'Review the worked example and try again.';
};

const getLearnerSummary = (state) => {
  const masteryByConcept = state.pedagogicalState?.masteryByConcept ?? {};
  const mastered = Object.values(masteryByConcept).filter(m => m.status === 'mastered').length;
  const inProgress = Object.values(masteryByConcept).filter(m => m.status === 'in-progress').length;
  return `Mastered: ${mastered}, In Progress: ${inProgress}, Module: ${ALGEBRA_SUBJECT_PACK.getModule().title}`;
};

const buildSystemPrompt = (decision, state) => {
  const module = ALGEBRA_SUBJECT_PACK.getModule();
  return `You are an adaptive algebra tutor. Your role is to guide the learner through the concept graph, providing scaffolded explanations, worked examples, and practice problems.

Current module: ${module.title}
Focus: ${module.focus}

Learner state: ${getLearnerSummary(state)}

Rules:
1. Always reference the concept graph - do NOT invent concepts or prerequisites
2. Provide corrective feedback linked to the specific misconception when possible
3. Keep responses concise and scaffolded
4. Use the lesson content for explanations - do NOT invent new pedagogical content
5. When validating, compare mathematically, not with string comparison`;
};

const buildSceneMessages = (decision, state, sceneKind) => {
  const template = SCENE_TEMPLATES[sceneKind];
  if (!template) return [];
  
  const messages = [
    { role: 'system', content: buildSystemPrompt(decision, state) },
  ];
  
  const recentTurns = state.runtimeSession?.recentTurns ?? [];
  for (const turn of recentTurns.slice(-6)) {
    messages.push({ role: turn.role, content: turn.content });
  }
  
  let prompt = template.promptTemplate;
  
  if (sceneKind === 'diagnostic') {
    prompt = prompt.replace('{prompt}', formatDiagnosticPrompt(decision, state));
    prompt = prompt.replace('{response_type}', decision.inputType || 'short answer');
  } else if (sceneKind === 'learner-attempt') {
    const lesson = getLessonForConcept(decision.conceptId);
    prompt = prompt.replace('{prompt}', lesson?.prompt || decision.prompt);
    const failedAttempts = state.runtimeSession?.recentTurns?.filter(t => t.role === 'user' && t.assessmentCorrect === false) ?? [];
    prompt = prompt.replace('{failed_attempts}', failedAttempts.length > 0 ? failedAttempts.map(a => a.content).join('; ') : '');
  } else if (sceneKind === 'hint') {
    prompt = prompt.replace('{hint}', getHintForLesson(decision));
  } else if (sceneKind === 'remediation') {
    prompt = prompt.replace('{remediation_content}', getRemediationForLesson(decision));
  } else if (sceneKind === 'feedback') {
    const lastTurn = recentTurns[recentTurns.length - 1];
    const isCorrect = lastTurn?.assessmentCorrect ?? false;
    const feedback = isCorrect ? 'Correct!' : 'Not quite right. Let\'s review.';
    prompt = prompt.replace('{feedback}', feedback);
    prompt = prompt.replace('{next_step}', isCorrect ? 'Ready for the next concept.' : 'Try the hint or review the example.');
  }
  
  messages.push({ role: 'user', content: prompt });
  return messages;
};

const buildValidationContext = (decision, input, expectedResponse) => {
  return {
    conceptId: decision.conceptId,
    objectiveId: decision.objectiveId,
    inputType: decision.inputType,
    expectedResponse,
    phase: decision.phase,
  };
};

export class TutorOrchestrator {
  constructor(state = {}, providerClient = null) {
    this.state = createDefaultState(state);
    this.client = providerClient;
    this._initialized = false;
  }

  get initialized() {
    return this._initialized;
  }

  get currentDecision() {
    return this._currentDecision;
  }

  get currentLesson() {
    if (!this._currentDecision) return null;
    return getLessonForConcept(this._currentDecision.conceptId);
  }

  get currentSceneKind() {
    const lessonRecord = this.state.pedagogicalState.lessonRecords?.[`lesson.${this._currentDecision?.conceptId}`];
    return lessonRecord?.sessionPhase || 'explain';
  }

  async initialize(state) {
    this.state = createDefaultState(state);
    
    if (isProviderConfigured(state)) {
      this.client = createProviderClientFromState(state);
    }
    
    this._currentDecision = nextCurriculumDecision(this.state);
    this._initialized = true;
    return this;
  }

  async proposeScene() {
    if (!this._initialized) {
      throw new Error('Orchestrator not initialized');
    }

    const decision = this._currentDecision;
    const sceneKind = this.currentSceneKind;
    
    if (!this.client || !this.client.configured) {
      const template = SCENE_TEMPLATES[sceneKind];
      return {
        sceneKind,
        prompt: template?.promptTemplate.replace('{concept_description}', this.currentLesson?.description || ''),
        decision,
        providerUsed: false,
      };
    }

    const messages = buildSceneMessages(decision, this.state, sceneKind);
    const response = await this.client.complete(messages);
    
    return {
      sceneKind,
      prompt: response,
      decision,
      providerUsed: true,
    };
  }

  async validateAndProgress(input, expectedResponse) {
    if (!this._initialized) {
      throw new Error('Orchestrator not initialized');
    }

    const decision = this._currentDecision;
    const context = buildValidationContext(decision, input, expectedResponse);
    const result = validateMathResponse(input, expectedResponse, decision.conceptId);

    const turn = {
      role: 'user',
      content: input,
      assessmentCorrect: result.correct,
      assessmentResult: result,
      recordedAt: new Date().toISOString(),
    };

    this.state = {
      ...this.state,
      runtimeSession: {
        ...this.state.runtimeSession,
        recentTurns: [...(this.state.runtimeSession?.recentTurns ?? []), turn].slice(-8),
      },
    };

    if (decision.phase === 'diagnostic') {
      this.state = advanceAssessment(this.state, {
        correct: result.correct,
        learnerResponse: input,
        recommendedConceptId: decision.recommendedConceptId,
      });
    } else {
      const delta = result.correct ? 1 : -1;
      this.state = applyMasteryEvidence(this.state, decision.conceptId, delta);
      this.state = advanceTutoringSession(this.state, decision.conceptId, 'continue');
    }

    this._currentDecision = nextCurriculumDecision(this.state);

    return {
      correct: result.correct,
      feedback: result.feedback,
      reason: result.reason,
      state: this.state,
      nextSceneKind: this.currentSceneKind,
    };
  }

  async requestHint() {
    if (!this._initialized) {
      throw new Error('Orchestrator not initialized');
    }

    return {
      hint: getHintForLesson(this._currentDecision),
    };
  }

  getConceptMap() {
    return deriveConceptStatuses(this.state);
  }

  getState() {
    return this.state;
  }

  getRecommendedConcept() {
    return this.state.pedagogicalState.recommendedConceptId;
  }

  getDiagnosticProgress() {
    return {
      status: this.state.pedagogicalState.diagnosticStatus,
      step: this.state.pedagogicalState.diagnosticStep,
      totalItems: ALGEBRA_SUBJECT_PACK.listAssessmentItems().length,
    };
  }
}

export const createOrchestrator = (state, providerClient) => {
  const orchestrator = new TutorOrchestrator(state, providerClient);
  return orchestrator.initialize(state);
};

export const subjectPack = ALGEBRA_SUBJECT_PACK;
export { getInitialConceptId, getRecommendedConceptId, getDiagnosticPlacementConceptId };