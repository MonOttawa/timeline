// OpenAI API Client

export default class OpenAIClient {
    constructor() {
        this.endpoint = 'https://api.openai.com/v1';
    }

    async fetchModels(apiKey) {
        if (!apiKey) {
            // Return common models without API call
            return [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', free: false },
                { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', free: false },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', free: false },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', free: false }
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
            // Filter to only show GPT models
            return data.data
                .filter(model => model.id.startsWith('gpt-'))
                .map(model => ({
                    id: model.id,
                    name: model.id.toUpperCase().replace(/-/g, ' '),
                    provider: 'OpenAI',
                    free: false
                }))
                .sort((a, b) => b.id.localeCompare(a.id)); // Newest first
        } catch (error) {
            console.error('OpenAI models fetch error:', error);
            return this.fetchModels(null);
        }
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
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
            let errorMessage = error.message || 'OpenAI API request failed';

            if (response.status === 429) {
                errorMessage = 'Rate limit exceeded or insufficient quota.\n\n💡 Tip: Check your OpenAI billing and usage limits at platform.openai.com/account/billing';
            } else if (error.code === 'insufficient_quota') {
                errorMessage = 'Insufficient quota. You need to add credits to your OpenAI account.\n\n💡 Tip: Add credits at platform.openai.com/account/billing or use a free provider like Groq or Cerebras.';
            } else if (error.code === 'invalid_api_key' || errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get an OpenAI API key at platform.openai.com/api-keys';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }
}
