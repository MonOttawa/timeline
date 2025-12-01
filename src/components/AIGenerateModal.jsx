import React, { useState, useEffect } from 'react';
import { X, Sparkles, Settings, MessageSquare, ChevronDown } from 'lucide-react';
import {
  PROVIDERS,
  getProviderClient,
  getProviderApiKey,
  getProviderModel,
  setProviderApiKey,
  setProviderModel,
} from '../lib/providers';

const AIGenerateModal = ({ onClose, onGenerate }) => {
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);

  useEffect(() => {
    // Set default provider to first one with API key configured
    const configuredProvider = Object.keys(PROVIDERS).find(key => {
      const provider = key.toLowerCase();
      return getProviderApiKey(provider);
    });

    if (configuredProvider) {
      setSelectedProvider(configuredProvider.toLowerCase());
    }
  }, []);

  // Sync inputs when provider changes
  useEffect(() => {
    setApiKeyInput(getProviderApiKey(selectedProvider) || '');
    setModelInput(getProviderModel(selectedProvider) || '');
    setModels([]);
    setUseCustomModel(false);
  }, [selectedProvider]);

  // Load models when provider or apiKey changes (best-effort)
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const client = await getProviderClient(selectedProvider);
        const fetched = await client.fetchModels(apiKeyInput);
        setModels(fetched || []);
        if (!modelInput && fetched?.length) {
          setModelInput(fetched[0].id);
          setUseCustomModel(false);
        } else if (modelInput && fetched?.length) {
          const match = fetched.find(m => m.id === modelInput);
          setUseCustomModel(!match);
        } else {
          setUseCustomModel(true);
        }
      } catch (err) {
        console.error('Error loading models:', err);
        setModels([]);
        setUseCustomModel(true);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, apiKeyInput]);

  const currentProvider = PROVIDERS[selectedProvider.toUpperCase()];
  const hasApiKey = !!apiKeyInput;
  const hasModel = !!modelInput;

  const handleGenerate = async () => {
    setErrorMessage('');
    if (!prompt.trim()) {
      setErrorMessage('Please enter a prompt describing your timeline.');
      return;
    }

    if (!hasApiKey) {
      setErrorMessage(`Configure your ${currentProvider?.name || selectedProvider} API key in Settings first.`);
      return;
    }

    if (!hasModel) {
      setErrorMessage(`Select a model for ${currentProvider?.name || selectedProvider} in Settings.`);
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

      const client = await getProviderClient(selectedProvider);
      const apiKey = apiKeyInput;
      const model = modelInput;

      const generatedContent = await client.generateContent(apiKey, model, messages);

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
        userMessage = 'This model requires credits. Please add credits to your account or try a different model/provider.';
      } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
        userMessage = 'Invalid API key. Please check your API key in Settings.';
      } else if (error.message.includes('model_not_found') || error.message.includes('not found')) {
        userMessage = 'Model not available. Please select a different model in Settings.';
      } else if (error.message.includes('rate_limit')) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }

      setErrorMessage(`Failed to generate timeline: ${userMessage}`);
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
            <div className="p-3 border-2 border-red-500 bg-red-50 text-red-700 font-semibold rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="font-bold mb-2 block">AI Provider</label>
            <div className="relative">
              <button
                onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-2">
                  {currentProvider?.name || selectedProvider}
                  {!hasApiKey && <span className="text-xs text-red-500">(Not configured)</span>}
                </span>
                <ChevronDown size={20} className={`transition-transform ${isProviderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProviderDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50">
                  {Object.entries(PROVIDERS).map(([key, provider]) => {
                    const providerKey = key.toLowerCase();
                    const configured = !!getProviderApiKey(providerKey);

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedProvider(providerKey);
                          setIsProviderDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors border-b border-gray-200 dark:border-gray-700 ${selectedProvider === providerKey ? 'bg-purple-200 dark:bg-purple-800' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{provider.name}</span>
                          {configured ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-bold">✓ CONFIGURED</span>
                          ) : (
                            <span className="text-xs text-gray-400">Not set up</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!hasApiKey && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Provider not configured
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please configure your {currentProvider?.name || selectedProvider} API key and model in the Learning Assistant settings.
                </p>
              </div>
            )}
          </div>

          {/* Provider Credentials (inline) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 text-sm">API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block font-bold mb-2 text-sm">Model</label>
              {models.length > 0 && !useCustomModel ? (
                <select
                  value={modelInput}
                  onChange={(e) => {
                    setModelInput(e.target.value);
                    setUseCustomModel(false);
                  }}
                  className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400"
                  disabled={isLoadingModels}
                >
                  <option value="">{isLoadingModels ? 'Loading models…' : 'Select a model'}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id} ({m.provider || 'model'})
                    </option>
                  ))}
                  <option value="__custom">Custom model…</option>
                </select>
              ) : null}
              {useCustomModel || models.length === 0 ? (
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="e.g., glm-4.6"
                  className="w-full mt-2 p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
                />
              ) : null}
              {models.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomModel(!useCustomModel);
                    if (!useCustomModel && models[0]) {
                      setModelInput('');
                    }
                  }}
                  className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-300 hover:underline"
                >
                  {useCustomModel ? 'Use provider list' : 'Use custom model'}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setProviderApiKey(selectedProvider, apiKeyInput);
                if (modelInput) setProviderModel(selectedProvider, modelInput);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg text-sm"
            >
              Save Provider
            </button>
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

          {/* Settings Link */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Settings size={16} />
            <span>Configure providers in the Learning Assistant settings (⚙️ icon in header)</span>
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
            disabled={isGenerating || !hasApiKey || !hasModel}
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
