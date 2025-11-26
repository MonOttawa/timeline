const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const SITE_NAME = 'Timeline.MD';

export const getStoredApiKey = () => {
    return import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '';
};

export const fetchModels = async () => {
    try {
        const response = await fetch(`${OPENROUTER_API_URL}/models`);
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
        console.error('Failed to fetch models:', error);
        return [
            { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite', provider: 'Google', free: true },
            { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct', provider: 'Meta', free: true },
        ];
    }
};

export const generateContent = async (apiKey, model, messages) => {
    if (!apiKey) throw new Error('API key is missing');

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME
        },
        body: JSON.stringify({
            model,
            messages
        })
    });

    if (!response.ok) {
        const errorData = await response.json();

        // OpenRouter returns errors in this structure:
        // { error: { message, code, type, metadata, provider } }
        const error = errorData.error || errorData;

        let errorMessage = error.message || 'API request failed';

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
            errorMessage += '\n\n💡 Tip: Check your API key in settings. Get a valid key at openrouter.ai/keys';
        } else if (errorMessage.includes('model')) {
            errorMessage += '\n\n💡 Tip: This model may be offline or unavailable. Try selecting a different model in settings.';
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
};

// Helper for Learning Assistant specific prompts
export const generateLearningContent = async (topic, mode) => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
        throw new Error("OpenRouter API key is missing. Please add it to .env or settings.");
    }

    // Use stored model or default to free Gemini
    const model = localStorage.getItem('openrouter_model') || 'google/gemini-2.0-flash-lite-preview-02-05:free';

    const PROMPTS = {
        explain: (t) => `Explain "${t}" to me like I'm 12 years old. Use simple analogies and clear language. Keep it under 200 words.`,
        summary: (t) => `Provide a 5-point summary of "${t}". Format the output as a bulleted list. Keep each point concise.`,
        flashcards: (t) => `Create 5 study flashcards for "${t}". Format them as "Q: [Question] \n A: [Answer]".`,
        quiz: (t) => `Create a short 3-question multiple choice quiz about "${t}". Include the correct answer at the end of the quiz.`,
        missing: (t) => `What are some key concepts or nuances about "${t}" that people often miss or misunderstand? Provide 3 distinct points.`,
        stepByStep: (t) => `Provide a step-by-step guide to learning or mastering "${t}". Break it down into 5 actionable steps.`
    };

    const messages = [
        {
            role: 'system',
            content: 'You are a helpful AI tutor. Provide clear, accurate, and educational content.'
        },
        {
            role: 'user',
            content: PROMPTS[mode](topic)
        }
    ];

    return generateContent(apiKey, model, messages);
};
