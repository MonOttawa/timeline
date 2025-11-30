export default class MoonshotClient {
    constructor() {
        // Z.AI Coding API endpoint - uses Pro plan quota instead of separate API credits
        this.baseUrl = 'https://api.z.ai/api/coding/paas/v4';
    }

    async fetchModels(apiKey) {
        // Z.AI (formerly Zhipu AI) models - GLM-4 series
        return [
            {
                id: 'glm-4.6',
                name: 'GLM-4.6',
                provider: 'Z.AI',
                description: 'Most advanced model, excelling in all-round tasks',
                contextWindow: 131072,
                free: false
            },
            {
                id: 'glm-4.5v',
                name: 'GLM-4.5V',
                provider: 'Z.AI',
                description: 'Advanced visual understanding and analysis',
                contextWindow: 131072,
                free: false
            },
            {
                id: 'glm-4.5',
                name: 'GLM-4.5',
                provider: 'Z.AI',
                description: 'Previous flagship model',
                contextWindow: 131072,
                free: false
            }
        ];
    }

    async generateContent(apiKey, model, messages, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 4000,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Log full error for debugging
                console.error('Z.AI API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });

                // Handle Z.AI specific error messages
                const errorMessage = errorData.error?.message
                    || errorData.message
                    || `Z.AI API error: ${response.statusText}`;

                // Check for common Z.AI errors
                if (errorMessage.includes('balance') || errorMessage.includes('resource package')) {
                    throw new Error(`Z.AI Error: ${errorMessage}. Please check your subscription includes GLM-4.6 access at https://docs.z.ai`);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Z.AI generation error:', error);
            throw error;
        }
    }
}
