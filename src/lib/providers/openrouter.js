// OpenRouter API Client
// Refactored to fit provider pattern

export default class OpenRouterClient {
    constructor() {
        this.endpoint = 'https://openrouter.ai/api/v1';
        this.siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
        this.siteName = 'Substantifique';
    }

    async fetchModels(apiKey) {
        try {
            const response = await fetch(`${this.endpoint}/models`);
            const data = await response.json();

            const formattedModels = data.data.map(model => ({
                id: model.id,
                name: model.name || model.id.split('/').pop(),
                provider: model.id.split('/')[0],
                free: model.pricing?.prompt === '0' || model.id.includes(':free'),
                contextLength: model.context_length,
            }));

            // Sort: free models first
            return formattedModels.sort((a, b) => {
                if (a.free !== b.free) return a.free ? -1 : 1;
                return a.provider.localeCompare(b.provider);
            });
        } catch (error) {
            console.error('Failed to fetch OpenRouter models:', error);
            return [
                { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite', provider: 'Google', free: true },
                { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct', provider: 'Meta', free: true },
            ];
        }
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        const response = await fetch(`${this.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': this.siteUrl,
                'X-Title': this.siteName
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

            let errorMessage = error.message || 'OpenRouter API request failed';

            // Add error code if available
            if (error.code) {
                errorMessage = `[${error.code}] ${errorMessage}`;
            }

            // Add provider-specific error if available
            if (error.metadata?.raw) {
                const providerError = error.metadata.raw;
                if (providerError.error?.message) {
                    errorMessage += `\n\nProvider says: ${providerError.error.message}`;
                }
            }

            // Add helpful suggestions based on error type
            if (error.code === 'rate_limited' || errorMessage.includes('rate limit')) {
                errorMessage += '\n\n💡 Tip: Try switching to a different free model in settings, or wait a few moments and retry.';
            } else if (error.code === 'insufficient_credits' || errorMessage.includes('credits')) {
                errorMessage += '\n\n💡 Tip: This model requires credits. Switch to a FREE model in settings (look for the green "FREE" badge).';
            } else if (error.code === 'invalid_api_key' || errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get a free key at openrouter.ai/keys';
            } else if (errorMessage.includes('model')) {
                errorMessage += '\n\n💡 Tip: This model may be offline or unavailable. Try selecting a different model in settings.';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }
}
