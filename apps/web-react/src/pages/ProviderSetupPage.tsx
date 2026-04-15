import { useState } from 'react';
import { useApp } from '../App';
import './ProviderSetupPage.css';

export function ProviderSetupPage() {
  const { state, updateState, setView } = useApp();
  const [providerName, setProviderName] = useState(state.providerConfig.providerName);
  const [modelName, setModelName] = useState(state.providerConfig.modelName);
  const [endpointUrl, setEndpointUrl] = useState(state.providerConfig.endpointUrl);
  const [apiKey, setApiKey] = useState(state.providerConfig.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    updateState({
      providerConfig: {
        ...state.providerConfig,
        providerName,
        modelName,
        endpointUrl,
        apiKey,
        configuredAt: new Date().toISOString(),
      },
    });
    setView('module-selection');
  };

  const handleSkip = () => {
    setView('module-selection');
  };

  return (
    <div className="provider-setup-page">
      <header className="page-header">
        <h2 className="page-title">Configure AI Provider</h2>
        <p className="page-description">
          Primer uses your own API key to power the AI tutoring. No data is sent 
          to Primer's servers.
        </p>
      </header>

      <form className="setup-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-group">
          <label htmlFor="provider-name" className="form-label">
            Provider
          </label>
          <select
            id="provider-name"
            className="form-select"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
          >
            <option value="openrouter">OpenRouter</option>
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom Endpoint</option>
          </select>
          <p className="form-hint">
            Select your AI provider or choose "Custom Endpoint" for self-hosted models.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="model-name" className="form-label">
            Model
          </label>
          <input
            id="model-name"
            type="text"
            className="form-input"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., anthropic/claude-3-haiku"
          />
          <p className="form-hint">
            Enter the model identifier for your provider.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="endpoint-url" className="form-label">
            Endpoint URL
          </label>
          <input
            id="endpoint-url"
            type="url"
            className="form-input"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://api.openrouter.ai/v1"
          />
          <p className="form-hint">
            API endpoint base URL. Leave blank to use provider defaults.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="api-key" className="form-label">
            API Key
          </label>
          <div className="api-key-input-wrapper">
            <input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <button
              type="button"
              className="toggle-visibility-button"
              onClick={() => setShowApiKey(!showApiKey)}
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="form-hint">
            Your API key is stored locally and never sent to Primer's servers.
          </p>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={handleSkip}>
            Skip for Now
          </button>
          <button type="submit" className="primary-button">
            Save & Continue
          </button>
        </div>
      </form>

      <aside className="info-panel">
        <h4 className="info-title">Why BYO API Key?</h4>
        <ul className="info-list">
          <li>You control your costs and usage</li>
          <li>Your data stays between you and the provider</li>
          <li>No dependency on Primer's infrastructure</li>
          <li>Use any compatible model you prefer</li>
        </ul>
      </aside>
    </div>
  );
}
