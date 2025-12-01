import React, { useState, useEffect } from 'react';
import { X, Settings, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import {
    PROVIDERS,
    getSelectedProvider,
    setSelectedProvider,
    getProviderApiKey,
    setProviderApiKey,
    getProviderModel,
    setProviderModel,
    getProviderClient
} from '../lib/providers';

const SettingsModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('ai'); // 'ai', 'general', etc.
    const [selectedProviderId, setSelectedProviderId] = useState(getSelectedProvider());
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [models, setModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
    const [useCustomModel, setUseCustomModel] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'error'

    // Load initial state for the selected provider
    useEffect(() => {
        const key = getProviderApiKey(selectedProviderId);
        setApiKey(key);

        const model = getProviderModel(selectedProviderId);
        setSelectedModel(model);

        // Reset custom model toggle based on whether we have a model set
        setUseCustomModel(false);

        // Load models if we have a key
        if (key) {
            loadModels(selectedProviderId, key);
        } else {
            setModels([]);
        }
    }, [selectedProviderId]);

    const loadModels = async (providerId, key) => {
        if (!key) return;

        setIsLoadingModels(true);
        try {
            const client = await getProviderClient(providerId);
            const fetchedModels = await client.fetchModels(key);
            setModels(fetchedModels);

            // If current selected model is not in the list, and we have a selected model, 
            // it might be a custom one or just not returned by the API yet.
            // We'll keep it as is.
        } catch (err) {
            console.error('Error loading models:', err);
            setModels([]);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleProviderChange = (providerId) => {
        setSelectedProviderId(providerId);
        setIsProviderDropdownOpen(false);
        setSaveStatus('');
    };

    const handleSave = () => {
        try {
            // Save Provider Selection
            setSelectedProvider(selectedProviderId);

            // Save API Key
            setProviderApiKey(selectedProviderId, apiKey);

            // Save Model
            if (selectedModel) {
                setProviderModel(selectedProviderId, selectedModel);
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 3000);

            // Reload models if key changed
            if (apiKey) {
                loadModels(selectedProviderId, apiKey);
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            setSaveStatus('error');
        }
    };

    const currentProvider = PROVIDERS[selectedProviderId.toUpperCase()];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b-4 border-black dark:border-white">
                    <div className="flex items-center gap-3">
                        <Settings size={28} className="text-gray-700 dark:text-gray-300" />
                        <h2 className="text-2xl font-black font-display">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="w-full md:w-48 border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-4">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`w-full text-left px-4 py-3 font-bold rounded-lg transition-colors ${activeTab === 'ai'
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            AI Configuration
                        </button>
                        {/* Add more tabs here in the future */}
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1 p-6 space-y-6">
                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-4">AI Provider</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                                        Select the AI provider you want to use for generating timelines and learning content.
                                    </p>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                                            className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center justify-between text-left"
                                        >
                                            <span className="flex items-center gap-2">
                                                {currentProvider?.name || selectedProviderId}
                                            </span>
                                            <ChevronDown size={20} className={`transition-transform ${isProviderDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isProviderDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                                                {Object.entries(PROVIDERS).map(([key, provider]) => {
                                                    const providerKey = key.toLowerCase();
                                                    const configured = !!getProviderApiKey(providerKey);

                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => handleProviderChange(providerKey)}
                                                            className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-0 ${selectedProviderId === providerKey ? 'bg-purple-200 dark:bg-purple-800' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold">{provider.name}</span>
                                                                {configured && (
                                                                    <span className="text-xs text-green-600 dark:text-green-400 font-bold">✓ CONFIGURED</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{provider.description}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                    <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                                        {currentProvider?.name} Configuration
                                    </h4>

                                    <div>
                                        <label className="block font-bold mb-2 text-sm">API Key</label>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={`Enter your ${currentProvider?.name} API Key`}
                                            className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
                                        />
                                        {currentProvider?.docsUrl && (
                                            <a
                                                href={currentProvider.docsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                                            >
                                                Get your API key here &rarr;
                                            </a>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold mb-2 text-sm">Model</label>
                                        {models.length > 0 && !useCustomModel ? (
                                            <select
                                                value={selectedModel}
                                                onChange={(e) => {
                                                    setSelectedModel(e.target.value);
                                                    if (e.target.value === '__custom') {
                                                        setUseCustomModel(true);
                                                        setSelectedModel('');
                                                    }
                                                }}
                                                className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400"
                                                disabled={isLoadingModels}
                                            >
                                                <option value="">{isLoadingModels ? 'Loading models...' : 'Select a model'}</option>
                                                {models.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name || m.id} ({m.provider || 'model'})
                                                    </option>
                                                ))}
                                                <option value="__custom">Use custom model ID...</option>
                                            </select>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={selectedModel}
                                                    onChange={(e) => setSelectedModel(e.target.value)}
                                                    placeholder="e.g., gpt-4o, claude-3-5-sonnet-20240620"
                                                    className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
                                                />
                                                {models.length > 0 && (
                                                    <button
                                                        onClick={() => setUseCustomModel(false)}
                                                        className="text-xs text-left text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        Back to list
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    {saveStatus === 'saved' && (
                                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mr-4 animate-in fade-in">
                                            <Check size={20} /> Saved!
                                        </span>
                                    )}
                                    {saveStatus === 'error' && (
                                        <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mr-4 animate-in fade-in">
                                            <AlertTriangle size={20} /> Error saving
                                        </span>
                                    )}

                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-3 border-2 border-black dark:border-white font-bold rounded-lg bg-green-400 text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
