// Groq API Client
// Uses OpenAI-compatible API format

export default class GroqClient {
    constructor() {
        this.endpoint = 'https://api.groq.com/openai/v1';
    }

    async fetchModels(apiKey) {
        if (!apiKey) {
            // Return default models without API call
            return [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Meta', free: true },
                { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', provider: 'Meta', free: true },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Meta', free: true },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Mistral', free: true },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Google', free: true }
            ];
        }

        try {
            const response = await fetch(`${this.endpoint}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }

            const data = await response.json();
            return data.data.map(model => ({
                id: model.id,
                name: model.id.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                provider: 'Groq',
                free: true // Groq has generous free tier
            }));
        } catch (error) {
            console.error('Groq models fetch error:', error);
            // Return defaults on error
            return this.fetchModels(null);
        }
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('Groq API key is required');
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
            let errorMessage = error.message || 'Groq API request failed';

            if (response.status === 429) {
                errorMessage = 'Rate limit exceeded. Groq has generous free limits, but you may need to wait a moment.\n\n💡 Tip: Try again in a few seconds or switch to a different model.';
            } else if (error.code === 'invalid_api_key' || errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get a free Groq API key at console.groq.com/keys';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }
}
