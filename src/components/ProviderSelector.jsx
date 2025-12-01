import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  PROVIDERS,
  getProviderApiKey,
  getProviderModel,
  getProviderClient,
  setProviderApiKey,
  setProviderModel,
} from '../lib/providers';

/**
 * Shared provider selector for AI features.
 * Handles provider dropdown, API key, model selection (dropdown + custom), and persistence.
 */
export const ProviderSelector = ({
  initialProvider = 'openrouter',
  onChange, // (providerId, { apiKey, model })
}) => {
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);

  useEffect(() => {
    // seed from storage/env
    setApiKeyInput(getProviderApiKey(selectedProvider) || '');
    setModelInput(getProviderModel(selectedProvider) || '');
    setModels([]);
    setUseCustomModel(false);
  }, [selectedProvider]);

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

  useEffect(() => {
    onChange?.(selectedProvider, { apiKey: apiKeyInput, model: modelInput });
  }, [selectedProvider, apiKeyInput, modelInput, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="font-bold mb-2 block">AI Provider</label>
        <div className="relative">
          <button
            onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
            className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2">
              {PROVIDERS[selectedProvider.toUpperCase()]?.name || selectedProvider}
              {!apiKeyInput && <span className="text-xs text-red-500">(Not configured)</span>}
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
      </div>

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
                const value = e.target.value;
                if (value === '__custom') {
                  setUseCustomModel(true);
                  setModelInput('');
                } else {
                  setModelInput(value);
                  setUseCustomModel(false);
                }
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
          type="button"
          onClick={() => {
            setProviderApiKey(selectedProvider, apiKeyInput);
            if (modelInput) setProviderModel(selectedProvider, modelInput);
            setUseCustomModel(!models.length);
          }}
          className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg text-sm"
        >
          Save Provider
        </button>
      </div>
    </div>
  );
};

export default ProviderSelector;
