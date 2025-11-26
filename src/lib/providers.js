// Provider definitions and configuration
export const PROVIDERS = {
    OPENROUTER: {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Access multiple AI models through one API',
        endpoint: 'https://openrouter.ai/api/v1',
        docsUrl: 'https://openrouter.ai/keys',
        requiresApiKey: true,
        hasFreeModels: true,
        format: 'openai' // OpenAI-compatible API
    },
    GROQ: {
        id: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference with free tier',
        endpoint: 'https://api.groq.com/openai/v1',
        docsUrl: 'https://console.groq.com/keys',
        requiresApiKey: true,
        hasFreeModels: true,
        format: 'openai'
    },
    CEREBRAS: {
        id: 'cerebras',
        name: 'Cerebras',
        description: 'Fast inference on CS-3 chips',
        endpoint: 'https://api.cerebras.ai/v1',
        docsUrl: 'https://cloud.cerebras.ai/platform',
        requiresApiKey: true,
        hasFreeModels: true,
        format: 'openai'
    },
    OPENAI: {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other models',
        endpoint: 'https://api.openai.com/v1',
        docsUrl: 'https://platform.openai.com/api-keys',
        requiresApiKey: true,
        hasFreeModels: false,
        format: 'openai'
    },
    ANTHROPIC: {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models',
        endpoint: 'https://api.anthropic.com/v1',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        requiresApiKey: true,
        hasFreeModels: false,
        format: 'anthropic' // Uses different API format
    },
    GEMINI: {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s Gemini models',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        requiresApiKey: true,
        hasFreeModels: true,
        format: 'gemini' // Uses Google-specific format
    }
};

// Get stored provider selection
export const getSelectedProvider = () => {
    return localStorage.getItem('ai_provider') || 'openrouter';
};

// Set provider selection
export const setSelectedProvider = (providerId) => {
    localStorage.setItem('ai_provider', providerId);
};

// Get API key for a specific provider
export const getProviderApiKey = (providerId) => {
    const envKeys = {
        'openrouter': import.meta.env.VITE_OPENROUTER_API_KEY,
        'groq': import.meta.env.VITE_GROQ_API_KEY,
        'cerebras': import.meta.env.VITE_CEREBRAS_API_KEY,
        'openai': import.meta.env.VITE_OPENAI_API_KEY,
        'anthropic': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'gemini': import.meta.env.VITE_GEMINI_API_KEY
    };

    return envKeys[providerId] || localStorage.getItem(`${providerId}_api_key`) || '';
};

// Set API key for a specific provider
export const setProviderApiKey = (providerId, apiKey) => {
    if (apiKey && apiKey.trim()) {
        localStorage.setItem(`${providerId}_api_key`, apiKey.trim());
    } else {
        localStorage.removeItem(`${providerId}_api_key`);
    }
};

// Get selected model for a provider
export const getProviderModel = (providerId) => {
    return localStorage.getItem(`${providerId}_model`) || '';
};

// Set selected model for a provider
export const setProviderModel = (providerId, model) => {
    if (model) {
        localStorage.setItem(`${providerId}_model`, model);
    } else {
        localStorage.removeItem(`${providerId}_model`);
    }
};

// Get the active provider client
export const getProviderClient = async (providerId) => {
    switch (providerId) {
        case 'openrouter':
            const { default: OpenRouterClient } = await import('./providers/openrouter.js');
            return new OpenRouterClient();
        case 'groq':
            const { default: GroqClient } = await import('./providers/groq.js');
            return new GroqClient();
        case 'cerebras':
            const { default: CerebrasClient } = await import('./providers/cerebras.js');
            return new CerebrasClient();
        case 'openai':
            const { default: OpenAIClient } = await import('./providers/openai.js');
            return new OpenAIClient();
        case 'anthropic':
            const { default: AnthropicClient } = await import('./providers/anthropic.js');
            return new AnthropicClient();
        case 'gemini':
            const { default: GeminiClient } = await import('./providers/gemini.js');
            return new GeminiClient();
        default:
            throw new Error(`Unknown provider: ${providerId}`);
    }
};

// Generate content using the selected provider
export const generateContent = async (messages, options = {}) => {
    const providerId = getSelectedProvider();
    const apiKey = getProviderApiKey(providerId);
    const model = getProviderModel(providerId);

    if (!apiKey) {
        throw new Error(`API key not configured for ${PROVIDERS[providerId.toUpperCase()]?.name || providerId}`);
    }

    if (!model) {
        throw new Error(`No model selected for ${PROVIDERS[providerId.toUpperCase()]?.name || providerId}`);
    }

    const client = await getProviderClient(providerId);
    return client.generateContent(apiKey, model, messages, options);
};
