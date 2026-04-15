import React, { useRef, useCallback } from 'react';
import './MathInput.css';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
}

const EQUATION_EXAMPLES = [
  { label: 'Equation', example: 'x = 5', hint: 'Solve for x' },
  { label: 'Expression', example: '3x + 2', hint: 'Simplify' },
  { label: 'Evaluate', example: 'x = 4 → 2x', hint: 'Substitute' },
];

export function MathInput({ 
  value, 
  onChange, 
  placeholder = 'e.g., x = 7 or 3x + 1 = 10', 
  onSubmit,
  disabled = false 
}: MathInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = React.useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const insertExample = (example: string) => {
    onChange(example);
    inputRef.current?.focus();
  };

  return (
    <div className="math-input-container">
      <div className="math-input-wrapper">
        <span className="math-input-icon">ƒ</span>
        <input
          ref={inputRef}
          type="text"
          className="math-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Mathematical expression input"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onFocus={() => setShowHelp(true)}
          onBlur={() => setTimeout(() => setShowHelp(false), 150)}
        />
        {value && (
          <button
            type="button"
            className="clear-button"
            onClick={() => onChange('')}
            aria-label="Clear input"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="math-input-hints">
        <span className="hint-item">Variables: <kbd>x</kbd></span>
        <span className="hint-item">Operators: <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd></span>
        <span className="hint-item">Equals: <kbd>=</kbd></span>
        <span className="hint-item">Grouping: <kbd>(</kbd> <kbd>)</kbd></span>
      </div>

      {showHelp && (
        <div className="math-input-examples">
          <span className="examples-label">Quick examples:</span>
          {EQUATION_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="example-button"
              onClick={() => insertExample(ex.example)}
              title={ex.hint}
            >
              <span className="example-type">{ex.label}</span>
              <code className="example-value">{ex.example}</code>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
