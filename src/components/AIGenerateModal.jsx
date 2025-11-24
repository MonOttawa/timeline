import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Key, MessageSquare, Search, ChevronDown } from 'lucide-react';

const AIGenerateModal = ({ onClose, onGenerate }) => {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [saveKey, setSaveKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const modelDropdownRef = useRef(null);

  useEffect(() => {
    // Load saved API key if exists
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSaveKey(true);
    }

    // Fetch available models from OpenRouter
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const data = await response.json();

      // Process and format models
      const formattedModels = data.data.map(model => ({
        id: model.id,
        name: model.name || model.id.split('/').pop(),
        provider: model.id.split('/')[0],
        free: model.pricing?.prompt === '0' || model.id.includes(':free'),
        contextLength: model.context_length,
      }));

      // Sort: free models first, then by provider
      formattedModels.sort((a, b) => {
        if (a.free !== b.free) return a.free ? -1 : 1;
        return a.provider.localeCompare(b.provider);
      });

      setModels(formattedModels);

      // Set default to first free model if available
      const firstFree = formattedModels.find(m => m.free);
      if (firstFree) {
        setSelectedModel(firstFree.id);
      } else if (formattedModels.length > 0) {
        setSelectedModel(formattedModels[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Fallback to a basic model list if fetch fails
      const fallbackModels = [
        { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct', provider: 'Meta', free: true },
        { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'Google', free: true },
      ];
      setModels(fallbackModels);
      setSelectedModel(fallbackModels[0].id);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter models based on search
  const filteredModels = models.filter(model => {
    const searchLower = modelSearch.toLowerCase();
    return (
      model.name.toLowerCase().includes(searchLower) ||
      model.provider.toLowerCase().includes(searchLower) ||
      model.id.toLowerCase().includes(searchLower)
    );
  });

  // Get selected model display name
  const selectedModelObj = models.find(m => m.id === selectedModel);
  const selectedModelDisplay = isLoadingModels
    ? 'Loading models...'
    : selectedModelObj
      ? `${selectedModelObj.name} (${selectedModelObj.provider})${selectedModelObj.free ? ' - FREE' : ''}`
      : 'Select a model';

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
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenRouter API Error:', errorData);

        // Extract detailed error message
        let errorMessage = 'API request failed';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        // Add metadata if available
        if (errorData.metadata?.provider_name) {
          errorMessage += ` (Provider: ${errorData.metadata.provider_name})`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('OpenRouter API Response:', data);

      const generatedContent = data.choices[0]?.message?.content;

      if (generatedContent) {
        onGenerate(generatedContent);
        onClose();
      } else {
        throw new Error('No content generated from the AI model');
      }
    } catch (error) {
      console.error('AI Generation error:', error);

      // Provide more helpful error messages
      let userMessage = error.message;

      if (error.message.includes('insufficient_quota') || error.message.includes('credits')) {
        userMessage = 'This model requires credits. Please add credits to your OpenRouter account or try a free model.';
      } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
        userMessage = 'Invalid API key. Please check your OpenRouter API key.';
      } else if (error.message.includes('model_not_found') || error.message.includes('not found')) {
        userMessage = 'Model not available. Please try a different model.';
      } else if (error.message.includes('rate_limit')) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }

      alert(`Failed to generate timeline: ${userMessage}`);
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
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                disabled={isLoadingModels}
                className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">{selectedModelDisplay}</span>
                <ChevronDown size={20} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModelDropdownOpen && !isLoadingModels && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50">
                  {/* Search Input */}
                  <div className="p-3 border-b-2 border-black dark:border-white">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Model List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      <>
                        {/* Free Models Section */}
                        {filteredModels.some(m => m.free) && (
                          <>
                            <div className="px-3 py-2 bg-green-100 dark:bg-green-900 text-xs font-bold text-green-800 dark:text-green-200">
                              FREE MODELS
                            </div>
                            {filteredModels.filter(m => m.free).map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setIsModelDropdownOpen(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors border-b border-gray-200 dark:border-gray-700 ${selectedModel === model.id ? 'bg-purple-200 dark:bg-purple-800' : ''}`}
                              >
                                <div className="font-bold text-sm">{model.name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {model.provider} • <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}

                        {/* Premium Models Section */}
                        {filteredModels.some(m => !m.free) && (
                          <>
                            <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900 text-xs font-bold text-orange-800 dark:text-orange-200">
                              PREMIUM MODELS
                            </div>
                            {filteredModels.filter(m => !m.free).map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setIsModelDropdownOpen(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors border-b border-gray-200 dark:border-gray-700 ${selectedModel === model.id ? 'bg-purple-200 dark:bg-purple-800' : ''}`}
                              >
                                <div className="font-bold text-sm">{model.name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {model.provider} • <span className="text-orange-600 dark:text-orange-400 font-bold">PAID</span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No models found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isLoadingModels ? 'Fetching latest models from OpenRouter...' : 'Free models available with API key • Premium models require credits'}
            </p>
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
