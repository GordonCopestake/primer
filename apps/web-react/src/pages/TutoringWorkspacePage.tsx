import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { MathInput } from '../components/MathInput';
// @ts-ignore - local JS module
import { TutorOrchestrator, createOrchestrator, subjectPack, getInitialConceptId, getLessonForConcept, nextCurriculumDecision, deriveConceptStatuses, advanceAssessment, applyMasteryEvidence, advanceTutoringSession } from '../../../../packages/core/src/tutorOrchestrator.js';
// @ts-ignore - local JS module
import { validateMathResponse } from '../../../../packages/core/src/mathValidation.js';
// @ts-ignore - local JS module
import { createProviderClient, isProviderConfigured } from '../../../../packages/core/src/providerClient.js';
import './TutoringWorkspacePage.css';

export function TutoringWorkspacePage() {
  const { state, updateState } = useApp();
  const orchestratorRef = useRef<TutorOrchestrator | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'hint'; message: string } | null>(null);
  const [currentScene, setCurrentScene] = useState<{ prompt: string; sceneKind: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState<{ title: string; text: string; workedExample: string } | null>(null);

  const diagnosticStatus = state.pedagogicalState.diagnosticStatus;
  const recommendedConceptId = state.pedagogicalState.recommendedConceptId || state.pedagogicalState.currentConceptId || getInitialConceptId();

  useEffect(() => {
    const initOrchestrator = async () => {
      let client = null;
      if (isProviderConfigured(state)) {
        client = createProviderClient({
          providerName: state.providerConfig.providerName,
          modelName: state.providerConfig.modelName,
          endpointUrl: state.providerConfig.endpointUrl,
          apiKey: state.providerConfig.apiKey,
        });
      }
      orchestratorRef.current = await createOrchestrator(state, client);
      await loadScene();
    };
    initOrchestrator();
  }, []);

  const loadScene = async () => {
    if (!orchestratorRef.current) return;
    
    setLoading(true);
    try {
      const decision = orchestratorRef.current.currentDecision;
      const lesson = getLessonForConcept(decision?.conceptId);
      
      if (decision?.phase === 'diagnostic') {
        const items = subjectPack.listAssessmentItems();
        const currentItem = items[state.pedagogicalState.diagnosticStep];
        setCurrentScene({ prompt: currentItem?.prompt || '', sceneKind: 'diagnostic' });
        setLessonContent({
          title: 'Diagnostic Assessment',
          text: 'Complete the following questions to assess your current level.',
          workedExample: '',
        });
      } else if (lesson) {
        setCurrentScene({ prompt: lesson.prompt || '', sceneKind: lesson.lessonType || 'learner-attempt' });
        setLessonContent({
          title: lesson.title,
          text: lesson.objective,
          workedExample: lesson.workedExample,
        });
      }
      
      const conceptStatuses = deriveConceptStatuses(state);
      setCurrentScene(prev => prev);
    } catch (err) {
      console.error('Failed to load scene:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!userInput.trim()) return;

    const decision = orchestratorRef.current?.currentDecision;
    if (!decision) return;

    const expectedResponse = decision.expectedResponse;
    const result = validateMathResponse(userInput, expectedResponse || '7', decision.conceptId);
    const newState = orchestratorRef.current?.getState();

    if (result.correct) {
      setFeedback({ type: 'correct', message: result.feedback || 'Correct! Well done.' });
      
      if (diagnosticStatus !== 'complete') {
        const nextState = newState ? advanceAssessment(newState, { correct: true, learnerResponse: userInput }) : null;
        if (nextState) {
          updateState(nextState);
        }
      } else {
        const nextState = newState ? applyMasteryEvidence(newState, recommendedConceptId, 1) : null;
        if (nextState) {
          updateState(nextState);
          advanceTutoringSession(nextState, recommendedConceptId, 'continue');
        }
      }
      
      setUserInput('');
      setTimeout(() => {
        setFeedback(null);
        loadScene();
      }, 1500);
    } else {
      setFeedback({ 
        type: result.reason === 'syntax' ? 'hint' : 'incorrect', 
        message: result.feedback || 'Not quite right. Try again.' 
      });
    }
  }, [userInput, state, updateState, diagnosticStatus, recommendedConceptId]);

  const handleHint = () => {
    const decision = orchestratorRef.current?.currentDecision;
    if (!decision) return;
    
    const lesson = getLessonForConcept(decision.conceptId);
    setFeedback({ type: 'hint', message: lesson?.hint || 'Review the concept and try again.' });
  };

  const renderDiagnostic = () => (
    <div className="diagnostic-section">
      <div className="phase-indicator">
        <span className="phase-badge">Diagnostic</span>
        <span className="phase-progress">Question {state.pedagogicalState.diagnosticStep + 1} of {subjectPack.listAssessmentItems().length}</span>
      </div>

      <div className="question-card">
        <h3 className="question-prompt">
          {currentScene?.prompt || 'Complete this diagnostic question.'}
        </h3>
      </div>

      <MathInput
        value={userInput}
        onChange={setUserInput}
        placeholder="Enter your answer..."
        onSubmit={handleSubmit}
      />

      {feedback && (
        <div className={`feedback feedback-${feedback.type}`}>
          <span className="feedback-icon">
            {feedback.type === 'correct' ? '✓' : feedback.type === 'incorrect' ? '✗' : '💡'}
          </span>
          <p className="feedback-message">{feedback.message}</p>
        </div>
      )}

      <div className="action-buttons">
        <button className="hint-button" onClick={handleHint}>
          Get a Hint
        </button>
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={!userInput.trim()}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );

  const renderTutoring = () => (
    <div className="tutoring-section">
      <div className="concept-indicator">
        <span className="concept-badge">Current Concept</span>
        <h3 className="concept-name">{lessonContent?.title || recommendedConceptId}</h3>
      </div>

      <div className="lesson-card">
        <div className="lesson-content">
          <h4 className="lesson-title">{lessonContent?.title}</h4>
          <p className="lesson-text">
            {lessonContent?.text}
          </p>
          {lessonContent?.workedExample && (
            <div className="worked-example">
              <span className="example-label">Example:</span>
              <p className="example-text">{lessonContent.workedExample}</p>
            </div>
          )}
        </div>
      </div>

      <MathInput
        value={userInput}
        onChange={setUserInput}
        placeholder="Enter your answer..."
        onSubmit={handleSubmit}
      />

      {feedback && (
        <div className={`feedback feedback-${feedback.type}`}>
          <span className="feedback-icon">
            {feedback.type === 'correct' ? '✓' : feedback.type === 'incorrect' ? '✗' : '💡'}
          </span>
          <p className="feedback-message">{feedback.message}</p>
        </div>
      )}

      <div className="action-buttons">
        <button className="hint-button" onClick={handleHint}>
          Hint
        </button>
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={!userInput.trim()}
        >
          Check Answer
        </button>
      </div>
    </div>
  );

  return (
    <div className="tutoring-workspace-page">
      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : diagnosticStatus === 'not-started' || diagnosticStatus === 'in-progress' 
        ? renderDiagnostic() 
        : renderTutoring()}
    </div>
  );
}