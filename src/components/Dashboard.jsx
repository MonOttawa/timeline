import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Trash2, Edit2, Share2, MoreVertical, FileText, Loader } from 'lucide-react';
import { pb } from '../lib/pocketbase';

const Dashboard = ({ user, onEdit, onCreate, onShare }) => {
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTimelines();
    }, [user]);

    const fetchTimelines = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const records = await pb.collection('timelines').getList(1, 50, {
                sort: '-updated',
                filter: `user = "${user.id}"`,
                fields: '*' // Fetch all fields including content
            });
            setTimelines(records.items);
        } catch (error) {
            console.error('Error fetching timelines:', error);
            setError('Unable to load timelines. Please refresh or try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (deleteConfirmId === id) {
            try {
                await pb.collection('timelines').delete(id);
                setTimelines(timelines.filter(t => t.id !== id));
                setDeleteConfirmId(null);
            } catch (error) {
                console.error('Error deleting timeline:', error);
                setError('Failed to delete timeline. Please try again.');
            }
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const filteredTimelines = timelines.filter(t =>
        (t.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black font-display text-black dark:text-white mb-1">My Projects</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your timelines and learning sessions</p>
                </div>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all text-sm"
                >
                    <Plus size={16} />
                    Create New
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 border-2 border-red-500 bg-red-50 text-red-700 font-semibold rounded-lg">
                    {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search timelines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black dark:border-white rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-800 text-black dark:text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF]"
                />
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin text-black dark:text-white" size={32} />
                </div>
            ) : filteredTimelines.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-1">No timelines found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {searchQuery ? "Try a different search term" : "Start by creating your first timeline"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={onCreate}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline text-sm"
                        >
                            Create a new timeline
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredTimelines.map((timeline) => (
                        <div
                            key={timeline.id}
                            onClick={() => onEdit(timeline)}
                            className="group bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg p-4 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] dark:hover:shadow-[5px_5px_0px_#FFF] transition-all cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                                    <FileText size={16} />
                                </div>
                                <div className="flex gap-1">
                                    {timeline.public && (
                                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold rounded border border-green-200 dark:border-green-800">
                                            PUBLIC
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-1 line-clamp-2 h-12 text-black dark:text-white leading-tight">
                                {timeline.title || 'Untitled Timeline'}
                            </h3>

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                <Calendar size={12} />
                                <span>Updated {new Date(timeline.updated).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 uppercase">
                                    {timeline.style || 'bauhaus'}
                                </span>

                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onShare(timeline);
                                        }}
                                        className="p-1.5 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded transition-colors"
                                        title="Share"
                                    >
                                        <Share2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(timeline.id, e)}
                                        className={`p-1.5 rounded transition-colors ${deleteConfirmId === timeline.id
                                            ? 'bg-red-500 text-white'
                                            : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500'
                                            }`}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
