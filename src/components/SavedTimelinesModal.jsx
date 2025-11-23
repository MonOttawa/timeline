import React from 'react';
import { X, FileText, Calendar, Trash2 } from 'lucide-react';

const SavedTimelinesModal = ({ timelines, onClose, onLoad, onDelete, loading }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg max-w-2xl w-full p-8 relative max-h-[80vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X size={24} className="text-black dark:text-white" />
                </button>

                <h2 className="text-3xl font-black mb-6 font-display text-black dark:text-white">
                    My Timelines
                </h2>

                <div className="overflow-y-auto flex-1 pr-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                        </div>
                    ) : timelines.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-bold">No saved timelines yet</p>
                            <p>Create a timeline and click Save to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {timelines.map((timeline) => (
                                <div
                                    key={timeline.id}
                                    className="border-2 border-black dark:border-white rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center group"
                                >
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => onLoad(timeline)}
                                    >
                                        <h3 className="text-xl font-bold text-black dark:text-white mb-1">
                                            {timeline.title || 'Untitled Timeline'}
                                        </h3>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(timeline.updated).toLocaleDateString()}
                                            </span>
                                            <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-xs font-mono text-black dark:text-white">
                                                {timeline.style || 'bauhaus'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to delete this timeline?')) {
                                                onDelete(timeline.id);
                                            }
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete timeline"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedTimelinesModal;
