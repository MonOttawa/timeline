import React, { useState, useEffect } from 'react';
import type { ScriptMetadata } from '../scriptsLibrary';
import { loadScripts, deleteScript, saveScript } from '../services/scriptRepository';
import { ScriptUploadModal } from './ScriptUploadModal';

interface ScriptSelectorModalProps {
    onClose: () => void;
    onSelectScript: (script: ScriptMetadata) => void;
}

export const ScriptSelectorModal: React.FC<ScriptSelectorModalProps> = ({ onClose, onSelectScript }) => {
    const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
    const [scripts, setScripts] = useState<ScriptMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);

    const refreshScripts = async () => {
        setIsLoading(true);
        try {
            const allScripts = await loadScripts();
            setScripts(allScripts);
        } catch (error) {
            console.error('Failed to load scripts', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshScripts();
    }, []);

    const libraryScripts = scripts.filter(s => s.curated || s.id.startsWith('mlk-')); // Simple filter for now
    const customScripts = scripts.filter(s => !s.curated && !s.id.startsWith('mlk-'));

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this script?')) {
            await deleteScript(id);
            refreshScripts();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-4xl w-full h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
                >
                    ✕
                </button>

                <div className="flex-1 bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <h2 className="text-3xl font-black text-black dark:text-white mb-2">
                            Select a Script
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                            Choose a speech to practice or add your own.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 px-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`flex-1 px-4 py-3 font-bold text-lg rounded-lg border-2 border-black dark:border-white transition-all focus:outline-none focus:ring-4 focus:ring-pink-400 focus:ring-offset-2 flex items-center justify-center gap-2 ${activeTab === 'library'
                                    ? 'bg-pink-400 text-black shadow-none translate-x-[2px] translate-y-[2px] ring-2 ring-inset ring-black/10'
                                    : 'bg-pink-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:brightness-110 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            Library
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`flex-1 px-4 py-3 font-bold text-lg rounded-lg border-2 border-black dark:border-white transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center gap-2 ${activeTab === 'custom'
                                    ? 'bg-yellow-400 text-black shadow-none translate-x-[2px] translate-y-[2px] ring-2 ring-inset ring-black/10'
                                    : 'bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:brightness-110 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            My Scripts
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'custom' && (
                                    <button
                                        onClick={() => setShowUpload(true)}
                                        className="w-full mb-6 py-4 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all group"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
                                        <span className="font-bold">Add New Script</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(activeTab === 'library' ? libraryScripts : customScripts).map((script) => (
                                        <div
                                            key={script.id}
                                            onClick={() => onSelectScript(script)}
                                            className="group relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-xl p-4 cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-black dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                        {script.title}
                                                    </h3>
                                                    <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-3">
                                                        by {script.author}
                                                    </p>
                                                </div>
                                                {activeTab === 'custom' && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, script.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Delete script"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {script.category && (
                                                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                                        {script.category}
                                                    </span>
                                                )}
                                                <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                                    {script.wordCount} words
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {(activeTab === 'library' ? libraryScripts : customScripts).length === 0 && (
                                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 font-mono">
                                            {activeTab === 'library'
                                                ? "No library scripts found."
                                                : "You haven't added any scripts yet."}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showUpload && (
                <ScriptUploadModal
                    onClose={() => setShowUpload(false)}
                    onSubmit={async (input) => {
                        await saveScript(input);
                        refreshScripts();
                    }}
                />
            )}
        </div>
    );
};
