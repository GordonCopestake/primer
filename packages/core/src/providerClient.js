const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const mapProviderToEndpoint = (providerName, modelName, endpointUrl) => {
  const endpoints = {
    openai: endpointUrl || 'https://api.openai.com/v1/chat/completions',
    anthropic: endpointUrl || 'https://api.anthropic.com/v1/messages',
    openrouter: endpointUrl || 'https://openrouter.ai/api/v1/chat/completions',
    custom: endpointUrl || '',
  };
  return endpoints[providerName] || endpoints.custom;
};

const mapProviderToHeaders = (providerName, apiKey) => {
  const baseHeaders = { ...DEFAULT_HEADERS };
  if (providerName === 'anthropic') {
    baseHeaders['x-api-key'] = apiKey;
    baseHeaders['anthropic-version'] = '2023-06-01';
  } else if (providerName === 'openrouter') {
    baseHeaders['Authorization'] = `Bearer ${apiKey}`;
  } else {
    baseHeaders['Authorization'] = `Bearer ${apiKey}`;
  }
  return baseHeaders;
};

const mapProviderToPayload = (providerName, modelName, messages, options = {}) => {
  const { temperature = 0.7, maxTokens = 1024 } = options;
  
  if (providerName === 'anthropic') {
    return {
      model: modelName || 'claude-3-haiku-20240307',
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : m.role, content: m.content })),
      max_tokens: maxTokens,
      temperature,
    };
  }

  return {
    model: modelName || 'gpt-4o-mini',
    messages,
    temperature,
    max_tokens: maxTokens,
  };
};

const extractAnthropicContent = (response) => {
  return response.content?.[0]?.text || '';
};

const extractOpenAIContent = (response) => {
  return response.choices?.[0]?.message?.content || '';
};

const extractContent = (providerName, response) => {
  if (providerName === 'anthropic') {
    return extractAnthropicContent(response);
  }
  return extractOpenAIContent(response);
};

export class ProviderClient {
  constructor(config = {}) {
    this.providerName = config.providerName || 'openrouter';
    this.modelName = config.modelName || 'anthropic/claude-3-haiku';
    this.endpointUrl = config.endpointUrl || '';
    this.apiKey = config.apiKey || '';
    this._configured = Boolean(this.apiKey);
  }

  get configured() {
    return this._configured;
  }

  updateConfig(config = {}) {
    if (config.providerName) this.providerName = config.providerName;
    if (config.modelName) this.modelName = config.modelName;
    if (config.endpointUrl) this.endpointUrl = config.endpointUrl;
    if (config.apiKey) {
      this.apiKey = config.apiKey;
      this._configured = true;
    }
    return this;
  }

  async complete(messages, options = {}) {
    if (!this._configured) {
      throw new Error('Provider not configured - provide API key');
    }

    const endpoint = mapProviderToEndpoint(this.providerName, this.modelName, this.endpointUrl);
    const headers = mapProviderToHeaders(this.providerName, this.apiKey);
    const payload = mapProviderToPayload(this.providerName, this.modelName, messages, options);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Provider error ${response.status}: ${error}`);
    }

    const data = await response.json();
    return extractContent(this.providerName, data);
  }

  async completeWithJson(messages, schema, options = {}) {
    const text = await this.complete(messages, options);
    try {
      const parsed = JSON.parse(text);
      if (schema) {
        return schema.parse(parsed);
      }
      return parsed;
    } catch {
      return { text, error: 'json-parse-failed' };
    }
  }
}

export const createProviderClient = (config = {}) => new ProviderClient(config);

export const createProviderClientFromState = (state) => {
  const { providerConfig } = state;
  return new ProviderClient({
    providerName: providerConfig.providerName,
    modelName: providerConfig.modelName,
    endpointUrl: providerConfig.endpointUrl,
    apiKey: providerConfig.apiKey,
  });
};

export const isProviderConfigured = (state) => {
  return Boolean(state?.providerConfig?.apiKey && state?.providerConfig?.configuredAt);
};