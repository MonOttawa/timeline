import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, Settings } from 'lucide-react';
import { generateContent } from '../lib/providers';

const AIGenerateModal = ({ onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerate = async () => {
    setErrorMessage('');
    if (!prompt.trim()) {
      setErrorMessage('Please enter a prompt describing your timeline.');
      return;
    }

    setIsGenerating(true);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant that generates timeline content in markdown format. Follow this EXACT format:

CRITICAL: Your response MUST start with a title line using # (e.g., "# History of Space Exploration")

Then for each event, use this structure:
   - Date in asterisks: *YYYY-MM-DD* or *Month YYYY* for less specific dates
   - Optional heading with ### (e.g., "### Project Kickoff")
   - Event description (can be bullet points with - or paragraphs)
   - Empty line
   - Three dashes: ---
   - Empty line

EXAMPLE FORMAT:
# History of the Internet

*1969-10-29*
### ARPANET
The first message sent over ARPANET, precursor to the modern Internet.

---

*1989-03-12*
### World Wide Web
Tim Berners-Lee proposes the World Wide Web project at CERN.

---

IMPORTANT:
1. ALWAYS start with a # title as the FIRST line
2. Use asterisks around dates
3. Include the --- separator between events
4. Add empty lines before and after separators
5. Be concise and factual`
        },
        {
          role: 'user',
          content: `Create a timeline for: ${prompt}\n\nIMPORTANT: Start your response with a # title based on the topic, then include timeline events with *dates*, optional ### headings, descriptions, and --- separators.`
        }
      ];

      const generatedContent = await generateContent(messages);

      if (generatedContent) {
        onGenerate(generatedContent);
        onClose();
      } else {
        throw new Error('No content generated from the AI model');
      }
    } catch (error) {
      console.error('AI Generation error:', error);

      let userMessage = error.message;

      if (error.message.includes('insufficient_quota') || error.message.includes('credits')) {
        userMessage = 'This model requires credits. Please add credits to your account or try a different model/provider in Settings.';
      } else if (error.message.includes('API key not configured') || error.message.includes('No model selected')) {
        userMessage = 'Please configure your AI provider and model in Settings (⚙️ icon in header).';
      } else if (error.message.includes('rate_limit')) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }

      setErrorMessage(userMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-4 border-black dark:border-white">
          <div className="flex items-center gap-3">
            <Sparkles size={28} className="text-purple-500" />
            <h2 className="text-2xl font-black font-display">Generate with AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 border-2 border-red-500 bg-red-50 text-red-700 font-semibold rounded-lg text-sm flex items-center gap-2">
              <Settings size={16} />
              {errorMessage}
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <label className="flex items-center gap-2 font-bold mb-2">
              <MessageSquare size={20} />
              Describe your timeline
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., The history of space exploration from 1957 to 2024"
              className="w-full h-32 p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-400 resize-none"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Be specific about the topic, time period, and any key events you want included
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
            <Settings size={16} />
            <span>AI settings are now configured globally. Click the gear icon in the top header to change providers.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black dark:border-white flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-black dark:border-white font-bold rounded-lg bg-gray-200 dark:bg-gray-700 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 border-2 border-black dark:border-white font-bold rounded-lg bg-purple-400 text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles size={20} />
            {isGenerating ? 'Generating...' : 'Generate Timeline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;
