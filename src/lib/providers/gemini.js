// Google Gemini API Client
// Refactored from gemini.js to fit provider pattern

export default class GeminiClient {
    constructor() {
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async fetchModels() {
        // Return known Gemini models
        return [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', provider: 'Google', free: true },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', free: true },
            { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', provider: 'Google', free: true },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', free: true }
        ];
    }

    async generateContent(apiKey, model, messages, options = {}) {
        if (!apiKey) {
            throw new Error('Google Gemini API key is required');
        }

        // Convert messages to Gemini format
        const contents = messages
            .filter(m => m.role !== 'system') // Gemini doesn't use system messages in the same way
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        // Get system instruction if provided
        const systemMessage = messages.find(m => m.role === 'system');

        const requestBody = {
            contents,
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 1024
            }
        };

        if (systemMessage) {
            requestBody.systemInstruction = {
                parts: [{ text: systemMessage.content }]
            };
        }

        const response = await fetch(
            `${this.endpoint}/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            const error = errorData.error || errorData;
            let errorMessage = error.message || 'Gemini API request failed';

            if (response.status === 429) {
                errorMessage = 'Rate limit exceeded.\n\n💡 Tip: Gemini has generous free tier limits. Wait a moment and try again.';
            } else if (errorMessage.includes('API key')) {
                errorMessage += '\n\n💡 Tip: Get a free Gemini API key at aistudio.google.com/app/apikey';
            } else if (errorMessage.includes('quota')) {
                errorMessage += '\n\n💡 Tip: You may have exceeded the free quota. Check your usage at aistudio.google.com';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text;
    }
}
