import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, MessageSquare } from 'lucide-react';

const AI_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
];

const AIGenerateModal = ({ onClose, onGenerate }) => {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [saveKey, setSaveKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load saved API key if exists
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSaveKey(true);
    }
  }, []);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key');
      return;
    }
    if (!prompt.trim()) {
      alert('Please enter a prompt describing your timeline');
      return;
    }

    setIsGenerating(true);

    try {
      // Save API key if requested
      if (saveKey) {
        localStorage.setItem('openrouter_api_key', apiKey);
      } else {
        localStorage.removeItem('openrouter_api_key');
      }

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Timeline.MD'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates timeline content in markdown format. Generate timelines with dates in *YYYY-MM-DD* format (or *Month YYYY* for less specific dates), followed by event descriptions. Separate each event with ---. Start with a title line using # if appropriate. Be concise and factual.'
            },
            {
              role: 'user',
              content: `Create a timeline for: ${prompt}\n\nFormat each event as:\n*Date*\nEvent description\n\n---\n\nBe specific with dates when possible.`
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;

      if (generatedContent) {
        onGenerate(generatedContent);
        onClose();
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('AI Generation error:', error);
      alert(`Failed to generate timeline: ${error.message}`);
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
          {/* API Key Input */}
          <div>
            <label className="flex items-center gap-2 font-bold mb-2">
              <Key size={20} />
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="saveKey"
                checked={saveKey}
                onChange={(e) => setSaveKey(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="saveKey" className="text-sm text-gray-600 dark:text-gray-400">
                Save API key in browser (stored locally only)
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">openrouter.ai/keys</a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="font-bold mb-2 block">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400"
            >
              {AI_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

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
