// Cerebras API Client
// Uses OpenAI-compatible API format

export default class CerebrasClient {
    constructor() {
        this.endpoint = 'https://api.cerebras.ai/v1';
    }

    async fetchModels(apiKey) {
        // Cerebras has a smaller model selection
        return [
            { id: 'llama3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', free: true },
            { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta', free: true }
        ];
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('Cerebras API key is required');
        }

        const response = await fetch(`${this.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = errorData.error || errorData;
            let errorMessage = error.message || 'Cerebras API request failed';

            if (response.status === 429) {
                errorMessage = 'Rate limit exceeded.\n\n💡 Tip: Wait a moment and try again, or switch to a different provider.';
            } else if (error.code === 'invalid_api_key' || errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get a Cerebras API key at cloud.cerebras.ai/platform';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }
}
