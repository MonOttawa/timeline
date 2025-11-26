// Anthropic API Client
// Uses Anthropic-specific API format (different from OpenAI)

export default class AnthropicClient {
    constructor() {
        this.endpoint = 'https://api.anthropic.com/v1';
        this.apiVersion = '2023-06-01';
    }

    async fetchModels(apiKey) {
        // Anthropic doesn't have a models endpoint, return known models
        return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', free: false },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', free: false },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', free: false },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', free: false },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', free: false }
        ];
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('Anthropic API key is required');
        }

        // Anthropic uses a different message format
        // Need to extract system message and convert messages
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const response = await fetch(`${this.endpoint}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': this.apiVersion,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                max_tokens: options.maxTokens || 1024,
                system: systemMessage?.content || 'You are a helpful AI assistant.',
                messages: userMessages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                })),
                temperature: options.temperature || 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = errorData.error || errorData;
            let errorMessage = error.message || 'Anthropic API request failed';

            if (response.status === 429) {
                errorMessage = 'Rate limit exceeded.\n\n💡 Tip: Anthropic has rate limits. Wait a moment and try again.';
            } else if (error.type === 'authentication_error' || errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get an Anthropic API key at console.anthropic.com/settings/keys';
            } else if (errorMessage.includes('credit')) {
                errorMessage += '\n\n💡 Tip: Add credits to your Anthropic account or use a free provider like Groq.';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.content[0]?.text;
    }
}
