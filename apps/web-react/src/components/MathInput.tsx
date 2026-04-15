import React, { useRef, useCallback } from 'react';
import './MathInput.css';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function MathInput({ 
  value, 
  onChange, 
  placeholder = 'Enter your answer...', 
  onSubmit,
  disabled = false 
}: MathInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

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
        <span className="hint-item">Use <kbd>x</kbd> for variables</span>
        <span className="hint-item">Operators: <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd></span>
        <span className="hint-item">Parentheses: <kbd>(</kbd> <kbd>)</kbd></span>
      </div>
    </div>
  );
}
