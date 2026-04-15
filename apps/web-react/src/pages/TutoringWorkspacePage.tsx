import { useState, useCallback } from 'react';
import { useApp } from '../App';
import { MathInput } from '../components/MathInput';
// @ts-ignore - local JS module
import { validateMathResponse } from '../../../../packages/core/src/mathValidation.js';
import './TutoringWorkspacePage.css';

export function TutoringWorkspacePage() {
  const { state, updateState } = useApp();
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'hint'; message: string } | null>(null);

  const diagnosticStatus = state.pedagogicalState.diagnosticStatus;
  const currentConceptId = state.pedagogicalState.currentConceptId;
  const recommendedConceptId = state.pedagogicalState.recommendedConceptId || currentConceptId;

  const handleSubmit = useCallback(() => {
    if (!userInput.trim()) return;

    const result = validateMathResponse(userInput, '7');

    if (result.correct) {
      setFeedback({ type: 'correct', message: 'Correct! Well done.' });
      
      const newMastery = {
        ...state.pedagogicalState.masteryByConcept,
        [recommendedConceptId || 'diagnostic']: {
          score: 1,
          status: 'mastered' as const,
          attempts: 1,
          lastPracticedAt: new Date().toISOString(),
          reviewDueAt: null,
        },
      };

      updateState({
        pedagogicalState: {
          ...state.pedagogicalState,
          masteryByConcept: newMastery,
          diagnosticStatus: diagnosticStatus === 'in-progress' ? 'complete' : diagnosticStatus,
        },
      });
    } else {
      setFeedback({ 
        type: result.reason === 'syntax' ? 'hint' : 'incorrect', 
        message: result.feedback || 'Not quite right. Try again.' 
      });
    }
  }, [userInput, state, updateState, recommendedConceptId, diagnosticStatus]);

  const handleHint = () => {
    setFeedback({ type: 'hint', message: 'Remember: the variable x represents the unknown value. Try substituting a number for x.' });
  };

  const renderDiagnostic = () => (
    <div className="diagnostic-section">
      <div className="phase-indicator">
        <span className="phase-badge">Diagnostic</span>
        <span className="phase-progress">Question {state.pedagogicalState.diagnosticStep + 1} of 4</span>
      </div>

      <div className="question-card">
        <h3 className="question-prompt">
          If x = 4, what is x + 3?
        </h3>
        <p className="question-hint">
          Replace x with 4 in the expression x + 3.
        </p>
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
        <h3 className="concept-name">{recommendedConceptId || 'Introduction'}</h3>
      </div>

      <div className="lesson-card">
        <div className="lesson-content">
          <h4 className="lesson-title">Understanding Variables</h4>
          <p className="lesson-text">
            A variable is a letter that represents a number. In algebra, we use 
            variables to write expressions and equations that describe real situations.
          </p>
          <div className="worked-example">
            <span className="example-label">Example:</span>
            <p className="example-text">
              If <strong>x = 5</strong>, then <strong>x + 3 = 5 + 3 = 8</strong>
            </p>
          </div>
        </div>
      </div>

      <MathInput
        value={userInput}
        onChange={setUserInput}
        placeholder="Try: x + 3 when x = 5"
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
      {diagnosticStatus === 'not-started' || diagnosticStatus === 'in-progress' 
        ? renderDiagnostic() 
        : renderTutoring()}
    </div>
  );
}
