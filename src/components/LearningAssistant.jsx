import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, BookOpen, Brain, List, HelpCircle, Layers, ArrowRight, AlertTriangle, Settings, Key, X, Save, ChevronDown, Search, Edit2, Eye, FolderPlus, History, Trash2, Calendar } from 'lucide-react';
import { marked } from 'marked';
import { generateLearningContent, getStoredApiKey, fetchModels } from '../lib/openrouter';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';
import { pb } from '../lib/pocketbase';
import { useAuth } from '../hooks/useAuth';

export const LearningAssistant = () => {
    const { user } = useAuth();
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeMode, setActiveMode] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Settings State
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('openrouter_model') || '');
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [modelSearch, setModelSearch] = useState('');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        const storedKey = getStoredApiKey();
        if (storedKey) {
            setApiKey(storedKey);
        }

        // This block is now redundant due to the change in selectedModel's initial state
        // const storedModel = localStorage.getItem('openrouter_model');
        // if (storedModel) {
        //     setSelectedModel(storedModel);
        // } else {
        //     setSelectedModel('google/gemini-2.0-flash-lite-preview-02-05:free');
        // }
        // Re-adding the default if localStorage is empty, as the new initial state only sets ''
        if (!localStorage.getItem('openrouter_model')) {
            setSelectedModel('google/gemini-2.0-flash-lite-preview-02-05:free');
        }
    }, []);

    useEffect(() => {
        if (showSettings) {
            loadModels();
        }
    }, [showSettings]);

    useEffect(() => {
        if (showHistory && user) {
            fetchHistory();
        }
    }, [showHistory, user]);

    const loadModels = async () => {
        setIsLoadingModels(true);
        const fetchedModels = await fetchModels();
        setModels(fetchedModels);
        setIsLoadingModels(false);
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const records = await pb.collection('timelines').getList(1, 50, {
                sort: '-updated',
                filter: `user = "${user.id}"`
            });
            setHistoryItems(records.items);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load history.');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleLoadHistory = (item) => {
        setResult(item.content);
        // Try to extract topic from title "Topic - Mode"
        if (item.title && item.title.includes(' - ')) {
            const [extractedTopic, extractedMode] = item.title.split(' - ');
            setTopic(extractedTopic);
            // Map mode string back to key if possible, or just leave activeMode null/custom
            const modeMap = {
                'Explain': 'explain',
                'Key Points': 'summary',
                'Study Cards': 'flashcards',
                'Knowledge Check': 'quiz',
                'Blind Spots': 'missing',
                'Action Plan': 'stepByStep'
            };
            // Reverse lookup or simple lowercase check
            const modeKey = Object.keys(modeMap).find(key => extractedMode.includes(key))
                ? modeMap[Object.keys(modeMap).find(key => extractedMode.includes(key))]
                : 'custom';
            setActiveMode(modeKey);
        } else {
            setTopic(item.title);
            setActiveMode('custom');
        }
        setShowHistory(false);
        setIsEditing(false);
    };

    const handleDeleteHistory = async (id) => {
        try {
            await pb.collection('timelines').delete(id);
            setHistoryItems(historyItems.filter(item => item.id !== id));
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item.');
        }
    };

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('openrouter_api_key', apiKey.trim());
        } else {
            localStorage.removeItem('openrouter_api_key');
        }

        if (selectedModel) {
            localStorage.setItem('openrouter_model', selectedModel);
        }

        setShowSettings(false);
        setError('');
    };

    const handleAction = async (mode) => {
        if (!topic.trim()) return;

        const currentKey = getStoredApiKey();
        if (!currentKey) {
            setError('Please configure your OpenRouter API Key in settings first.');
            setShowSettings(true);
            return;
        }

        setLoading(true);
        setError('');
        setActiveMode(mode);
        setResult('');
        setIsEditing(false); // Reset edit mode on new generation
        setSaveSuccess(false);

        try {
            const content = await generateLearningContent(topic, mode);
            setResult(content);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('API key')) {
                setShowSettings(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToFiles = async () => {
        if (!user) {
            setError('You must be logged in to save files.');
            return;
        }
        if (!result) return;

        setIsSaving(true);
        try {
            const modeLabel = activeMode === 'explain' ? 'Explain' :
                activeMode === 'summary' ? 'Key Points' :
                    activeMode === 'flashcards' ? 'Study Cards' :
                        activeMode === 'quiz' ? 'Knowledge Check' :
                            activeMode === 'missing' ? 'Blind Spots' :
                                activeMode === 'stepByStep' ? 'Action Plan' : 'Custom';

            // Truncate topic if too long to prevent 400 errors (max 255 usually)
            const safeTopic = topic.length > 150 ? topic.substring(0, 150) + '...' : topic;
            const title = `${safeTopic} - ${modeLabel}`;

            // Check for existing record to prevent duplicates
            const existingRecords = await pb.collection('timelines').getList(1, 1, {
                filter: `user = "${user.id}" && title = "${title}"`
            });

            if (existingRecords.items.length > 0) {
                // Update existing record
                await pb.collection('timelines').update(existingRecords.items[0].id, {
                    content: result,
                    updated: new Date().toISOString()
                });
            } else {
                // Create new record
                await pb.collection('timelines').create({
                    user: user.id,
                    title: title,
                    content: result,
                    style: 'bauhaus' // Default style
                });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            const validationErrors = err.data?.data ? Object.entries(err.data.data).map(([key, val]) => `${key}: ${val.message}`).join(', ') : '';
            setError(`Failed to save: ${err.message} ${validationErrors ? `(${validationErrors})` : ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter models
    const filteredModels = models.filter(model => {
        const searchLower = modelSearch.toLowerCase();
        return (
            model.name.toLowerCase().includes(searchLower) ||
            model.provider.toLowerCase().includes(searchLower) ||
            model.id.toLowerCase().includes(searchLower)
        );
    });

    const selectedModelObj = models.find(m => m.id === selectedModel);
    const selectedModelDisplay = selectedModelObj
        ? `${selectedModelObj.name} (${selectedModelObj.provider})${selectedModelObj.free ? ' - FREE' : ''}`
        : selectedModel || 'Select a model';

    // Render markdown safely
    const renderContent = () => {
        if (!result) return null;
        const html = marked.parse(result);
        return { __html: sanitizeMarkdownHtml(html) };
    };

    return (
        <div className="max-w-4xl mx-auto p-6 relative">
            {/* Header Buttons - Responsive Layout */}
            <div className="flex justify-end mb-4 md:absolute md:top-6 md:right-6 gap-2 z-50">
                <button
                    onClick={() => {
                        if (!user) {
                            setError('Please log in to view your history.');
                            return;
                        }
                        setShowHistory(true);
                    }}
                    className={`p-2 rounded-full transition-colors ${user ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-50 hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                    title={user ? "My History" : "Log in to view history"}
                >
                    <History size={24} className={user ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"} />
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="API Settings"
                >
                    <Settings size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            <div className="text-center mb-10 mt-2 md:mt-0">
                <h1 className="text-4xl font-black mb-4 flex items-center justify-center gap-3 flex-wrap text-center">
                    <Sparkles className="text-purple-500 shrink-0" size={40} />
                    AI Learning Assistant
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    Master any topic in seconds with OpenRouter AI.
                </p>
            </div>

            <div className="mb-10">
                <div className="relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What do you want to learn? (e.g., Quantum Physics, Baking, History of Rome)"
                        className="w-full p-6 text-xl border-4 border-black dark:border-white rounded-xl shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] focus:outline-none focus:ring-4 focus:ring-purple-400 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400"
                    />
                    {topic && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600 dark:text-green-400 animate-pulse">
                            Ready to learn!
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 border-4 border-red-500 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 font-bold">
                    <AlertTriangle size={24} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <ActionButton
                    icon={<Brain />}
                    label="Explain like I'm 12"
                    onClick={() => handleAction('explain')}
                    disabled={!topic || loading}
                    color="bg-pink-300"
                />
                <ActionButton
                    icon={<List />}
                    label="Summary (5 bullets)"
                    onClick={() => handleAction('summary')}
                    disabled={!topic || loading}
                    color="bg-blue-300"
                />
                <ActionButton
                    icon={<Layers />}
                    label="Create Flashcards"
                    onClick={() => handleAction('flashcards')}
                    disabled={!topic || loading}
                    color="bg-green-300"
                />
                <ActionButton
                    icon={<HelpCircle />}
                    label="Quiz Me"
                    onClick={() => handleAction('quiz')}
                    disabled={!topic || loading}
                    color="bg-yellow-300"
                />
                <ActionButton
                    icon={<BookOpen />}
                    label="What am I missing?"
                    onClick={() => handleAction('missing')}
                    disabled={!topic || loading}
                    color="bg-purple-300"
                />
                <ActionButton
                    icon={<ArrowRight />}
                    label="Step-by-step Guide"
                    onClick={() => handleAction('stepByStep')}
                    disabled={!topic || loading}
                    color="bg-orange-300"
                />
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black dark:border-white mb-4"></div>
                    <p className="text-xl font-bold animate-pulse">Consulting the AI brain...</p>
                </div>
            )}

            {result && !loading && (
                <div className="border-4 border-black dark:border-white rounded-xl p-8 bg-white dark:bg-gray-800 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                    <div className="flex justify-between items-start mb-6 border-b-4 border-black dark:border-white pb-2">
                        <h3 className="text-2xl font-bold">
                            {activeMode === 'explain' && "Simple Explanation"}
                            {activeMode === 'summary' && "Key Points"}
                            {activeMode === 'flashcards' && "Study Cards"}
                            {activeMode === 'quiz' && "Knowledge Check"}
                            {activeMode === 'missing' && "Blind Spots"}
                            {activeMode === 'stepByStep' && "Action Plan"}
                        </h3>
                        <div className="flex gap-2">
                            {user && (
                                <button
                                    onClick={handleSaveToFiles}
                                    disabled={isSaving || saveSuccess}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${saveSuccess ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {saveSuccess ? (
                                        <>Saved! <Sparkles size={18} /></>
                                    ) : (
                                        <>{isSaving ? 'Saving...' : 'Save to Files'} <FolderPlus size={18} /></>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                            >
                                {isEditing ? <><Eye size={18} /> View</> : <><Edit2 size={18} /> Edit</>}
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <textarea
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                            className="w-full h-96 p-4 font-mono text-sm border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-400"
                        />
                    ) : (
                        <div
                            className="prose dark:prose-invert max-w-none text-lg font-medium"
                            dangerouslySetInnerHTML={renderContent()}
                        />
                    )}
                </div>
            )}

            {/* History Modal - Portal */}
            {showHistory && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <History className="text-purple-500" />
                                My History
                            </h2>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2">
                            {isLoadingHistory ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-black dark:border-white mb-2"></div>
                                    <p>Loading history...</p>
                                </div>
                            ) : historyItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <History size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-xl font-bold">No history yet</p>
                                    <p>Saved learning sessions will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {historyItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border-2 border-black dark:border-white rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center group cursor-pointer"
                                            onClick={() => handleLoadHistory(item)}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <h3 className="font-bold text-base truncate">{item.title || 'Untitled'}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                                    <Calendar size={12} />
                                                    {new Date(item.updated).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (deleteConfirmId === item.id) {
                                                        handleDeleteHistory(item.id);
                                                    } else {
                                                        setDeleteConfirmId(item.id);
                                                        // Auto-reset after 3 seconds
                                                        setTimeout(() => setDeleteConfirmId(null), 3000);
                                                    }
                                                }}
                                                className={`p-2 rounded transition-all z-10 flex items-center gap-1 ${deleteConfirmId === item.id
                                                    ? 'bg-red-500 text-white w-auto px-3'
                                                    : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900'
                                                    }`}
                                                title="Delete"
                                            >
                                                {deleteConfirmId === item.id ? (
                                                    <span className="text-xs font-bold whitespace-nowrap">Sure?</span>
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Settings Modal - Portal */}
            {showSettings && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Settings className="text-purple-500" />
                                Settings
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6 mb-6">
                            {/* API Key Input */}
                            <div>
                                <label className="block font-bold mb-2 flex items-center gap-2">
                                    <Key size={18} />
                                    OpenRouter API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-400"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline font-bold">openrouter.ai</a>
                                </p>
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className="block font-bold mb-2 flex items-center gap-2">
                                    <Brain size={18} />
                                    AI Model
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                        disabled={isLoadingModels}
                                        className="w-full p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center justify-between text-left disabled:opacity-50"
                                    >
                                        <span className="truncate text-sm">{selectedModelDisplay}</span>
                                        <ChevronDown size={20} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isModelDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 max-h-60 flex flex-col">
                                            <div className="p-2 border-b-2 border-black dark:border-white sticky top-0 bg-white dark:bg-gray-800 z-10">
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search models..."
                                                        value={modelSearch}
                                                        onChange={(e) => setModelSearch(e.target.value)}
                                                        className="w-full pl-8 pr-2 py-1 border-2 border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-purple-400"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {isLoadingModels ? (
                                                    <div className="p-4 text-center text-sm text-gray-500">Loading models...</div>
                                                ) : filteredModels.length > 0 ? (
                                                    filteredModels.map((model) => (
                                                        <button
                                                            key={model.id}
                                                            onClick={() => {
                                                                setSelectedModel(model.id);
                                                                setIsModelDropdownOpen(false);
                                                                setModelSearch('');
                                                            }}
                                                            className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${selectedModel === model.id ? 'bg-purple-50 dark:bg-purple-900/50' : ''}`}
                                                        >
                                                            <div className="font-bold text-sm truncate">{model.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                                <span>{model.provider}</span>
                                                                {model.free && (
                                                                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded text-[10px] font-bold">FREE</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-gray-500">No models found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Free models are recommended for testing.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveKey}
                                className="px-6 py-2 bg-purple-400 text-black font-bold rounded-lg border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const ActionButton = ({ icon, label, onClick, disabled, color }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
      flex items-center justify-center gap-3 p-4 text-lg font-bold border-4 border-black dark:border-white rounded-xl
      shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]
      transition-all
      ${disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                : `${color} hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:bg-black active:text-white`
            }
    `}
    >
        {icon}
        {label}
    </button>
);
