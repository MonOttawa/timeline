import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const PROMPTS = {
    explain: (topic) => `Explain "${topic}" to me like I'm 12 years old. Use simple analogies and clear language. Keep it under 200 words.`,
    summary: (topic) => `Provide a 5-point summary of "${topic}". Format the output as a bulleted list. Keep each point concise.`,
    flashcards: (topic) => `Create 5 study flashcards for "${topic}". Format them as "Q: [Question] \n A: [Answer]".`,
    quiz: (topic) => `Create a short 3-question multiple choice quiz about "${topic}". Include the correct answer at the end of the quiz.`,
    missing: (topic) => `What are some key concepts or nuances about "${topic}" that people often miss or misunderstand? Provide 3 distinct points.`,
    stepByStep: (topic) => `Provide a step-by-step guide to learning or mastering "${topic}". Break it down into 5 actionable steps.`
};

export const generateLearningContent = async (topic, mode) => {
    if (!API_KEY) {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    if (!model) {
        // Re-initialize if key was added later (though usually requires reload)
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    try {
        const prompt = PROMPTS[mode](topic);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate content. Please try again later.");
    }
};
