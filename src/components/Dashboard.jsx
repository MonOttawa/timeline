import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Trash2, Edit2, Share2, MoreVertical, FileText, Loader, Brain, BookOpen, Filter, LayoutGrid, List, ChevronLeft, ChevronRight, CheckSquare, Square, ArrowUpDown, Clock } from 'lucide-react';
import { listTimelinesByUser, deleteTimeline, updateTimeline } from '../lib/api/timelines';

const Dashboard = ({ user, onEdit, onCreate, onShare, onEditLearning }) => {
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [error, setError] = useState(null);
    const [contentFilter, setContentFilter] = useState('all'); // 'all', 'timelines', 'learning'

    // View State (force compact grid/table, remove toggle)
    const [viewMode, setViewMode] = useState('table'); // 'table', 'grid'
    const isCompact = true;
    const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const PER_PAGE = 20;

    const formatDate = (record) => {
        const candidates = [
            record?.updated,
            record?.created,
            record?.updatedAt,
            record?.createdAt,
        ].filter(Boolean);
        for (const c of candidates) {
            const d = new Date(c);
            if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
        }
        return '—';
    };

    const ensureTimestamps = async (items) => {
        const now = new Date().toISOString();
        const normalized = [];
        for (const item of items) {
            const hasUpdated = Boolean(item.updated);
            const updatedValue = item.updated || item.created || now;

            normalized.push({ ...item, updated: updatedValue, created: item.created || now });

            // If the record is missing an updated field, persist it so future reads have a date
            if (!hasUpdated && item.id) {
                try {
                    await updateTimeline(item.id, { updated: updatedValue });
                } catch (e) {
                    console.warn('Failed to backfill updated timestamp', item.id, e);
                }
            }
        }
        return normalized;
    };

    const fetchTimelines = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Convert sort config to API format
            const sortStr = `${sortConfig.direction === 'desc' ? '-' : '+'}${sortConfig.key}`;

            const result = await listTimelinesByUser(user.id, {
                page,
                perPage: PER_PAGE,
                sort: sortStr
            });

            const normalized = await ensureTimestamps(result.items);
            setTimelines(normalized);
            setTotalPages(result.totalPages);
            setTotalItems(result.totalItems);
        } catch (error) {
            if (error.isAbort) return;
            console.error('Error fetching timelines:', error);
            if (error?.status === 404) {
                setTimelines([]);
            } else {
                setError(`Unable to load timelines. Status: ${error?.status || 'Unknown'}.`);
            }
        } finally {
            setLoading(false);
        }
    }, [user, page, sortConfig]);

    useEffect(() => {
        fetchTimelines();
    }, [fetchTimelines]);

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        if (deleteConfirmId === id) {
            try {
                await deleteTimeline(id);
                setTimelines(timelines.filter(t => t.id !== id));
                setDeleteConfirmId(null);
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } catch (error) {
                console.error('Error deleting timeline:', error);
                setError('Failed to delete timeline.');
            }
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteTimeline(id)));
            setTimelines(timelines.filter(t => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
            fetchTimelines(); // Refresh to get correct pagination
        } catch (error) {
            console.error('Error bulk deleting:', error);
            setError('Failed to delete some items.');
        }
    };

    const toggleSelection = (id, e) => {
        e?.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === timelines.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(timelines.map(t => t.id)));
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const isLearningMaterial = (item) => {
        const learningModes = ['Explain', 'Key Points', 'Study Cards', 'Knowledge Check', 'Blind Spots', 'Action Plan', 'Deep Dive', 'Quick Notes'];
        const title = (item.title || '').toLowerCase();
        return learningModes.some(mode => {
            const normalizedMode = mode.toLowerCase();
            return title.includes(` - ${normalizedMode}`) || title.endsWith(` - ${normalizedMode}`);
        });
    };

    const filteredTimelines = timelines.filter(t => {
        if (contentFilter === 'timelines' && isLearningMaterial(t)) return false;
        if (contentFilter === 'learning' && !isLearningMaterial(t)) return false;
        return (t.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderPagination = () => (
        <div className="flex items-center justify-between mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {timelines.length} of {totalItems} items
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="flex items-center px-2 text-sm font-medium">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderTableView = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                        <th className={isCompact ? 'p-3 w-12' : 'p-4 w-12'}>
                            <button onClick={toggleSelectAll} className="hover:text-black dark:hover:text-white">
                                {selectedIds.size === timelines.length && timelines.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                        </th>
                        <th className={isCompact ? 'p-3 cursor-pointer hover:text-black dark:hover:text-white' : 'p-4 cursor-pointer hover:text-black dark:hover:text-white'} onClick={() => handleSort('title')}>
                            <div className="flex items-center gap-2">Title <ArrowUpDown size={14} /></div>
                        </th>
                        <th className={isCompact ? 'p-3 w-28' : 'p-4 w-32'}>Type</th>
                        <th className={isCompact ? 'p-3 w-28' : 'p-4 w-32'}>Status</th>
                        <th className={isCompact ? 'p-3 w-40 cursor-pointer hover:text-black dark:hover:text-white' : 'p-4 w-48 cursor-pointer hover:text-black dark:hover:text-white'} onClick={() => handleSort('updated')}>
                            <div className="flex items-center gap-2">Updated <ArrowUpDown size={14} /></div>
                        </th>
                        <th className={isCompact ? 'p-3 w-28 text-right' : 'p-4 w-32 text-right'}>Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredTimelines.map(timeline => {
                        const isLearning = isLearningMaterial(timeline);
                        const isSelected = selectedIds.has(timeline.id);

                        return (
                            <tr
                                key={timeline.id}
                                className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${isCompact ? 'text-sm' : 'text-base'}`}
                                onClick={() => isLearning && onEditLearning ? onEditLearning(timeline) : onEdit(timeline)}
                            >
                                <td className={isCompact ? 'p-3' : 'p-4'} onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => toggleSelection(timeline.id, e)} className="text-gray-400 hover:text-black dark:hover:text-white">
                                        {isSelected ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                                    </button>
                                </td>
                                <td className={`${isCompact ? 'p-3 text-sm' : 'p-4'} font-medium text-black dark:text-white cursor-pointer`}>
                                    {timeline.title || 'Untitled'}
                                </td>
                                <td className={isCompact ? 'p-3' : 'p-4'}>
                                    {isLearning ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            <Brain size={12} /> Learning
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                            <FileText size={12} /> Timeline
                                        </span>
                                    )}
                                </td>
                                <td className={isCompact ? 'p-3' : 'p-4'}>
                                    {timeline.public ? (
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">Public</span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Private</span>
                                    )}
                                </td>
                                <td className={`${isCompact ? 'p-3 text-xs' : 'p-4 text-sm'} text-gray-500 dark:text-gray-400`}>
                                    {formatDate(timeline)}
                                </td>
                                <td className={isCompact ? 'p-3 text-right' : 'p-4 text-right'} onClick={e => e.stopPropagation()}>
                                    <div className={`flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isCompact ? 'text-xs' : ''}`}>
                                        <button
                                            onClick={() => onShare(timeline)}
                                            className="p-1.5 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded"
                                            title="Share"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(timeline.id, e)}
                                            className={`p-1.5 rounded ${deleteConfirmId === timeline.id ? 'bg-red-500 text-white' : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500'}`}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const renderGridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTimelines.map((timeline) => {
                const isLearning = isLearningMaterial(timeline);
                const isSelected = selectedIds.has(timeline.id);

                return (
                    <div
                        key={timeline.id}
                        onClick={() => isLearning && onEditLearning ? onEditLearning(timeline) : onEdit(timeline)}
                        className={`group bg-white dark:bg-gray-800 border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-black dark:border-white'} rounded-lg p-3 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] dark:hover:shadow-[5px_5px_0px_#FFF] transition-all cursor-pointer relative`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                                <button onClick={(e) => toggleSelection(timeline.id, e)} className="text-gray-300 hover:text-blue-500">
                                    {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                </button>
                                {isLearning ? (
                                    <Brain size={16} className="text-blue-500" />
                                ) : (
                                    <FileText size={16} className="text-purple-500" />
                                )}
                            </div>
                            {timeline.public && (
                                <span className="w-2 h-2 rounded-full bg-green-500" title="Public"></span>
                            )}
                        </div>

                        <h3 className="font-bold text-sm mb-2 h-10 line-clamp-2 text-black dark:text-white leading-tight">
                            {timeline.title || 'Untitled'}
                        </h3>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-[10px] text-gray-500">
                                {formatDate(timeline)}
                            </span>

                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => onShare(timeline)} className="p-1 hover:text-cyan-600">
                                    <Share2 size={14} />
                                </button>
                                <button onClick={(e) => handleDelete(timeline.id, e)} className={`p-1 ${deleteConfirmId === timeline.id ? 'text-red-500' : 'hover:text-red-500'}`}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className={`flex flex-col md:flex-row justify-between items-center ${isCompact ? 'mb-4' : 'mb-8'} gap-3`}>
                <div>
                    <h1 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-black font-display text-black dark:text-white mb-1`}>My Projects</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {totalItems} items • {selectedIds.size} selected
                    </p>
                </div>
                <div className="flex gap-2 md:gap-3 items-center">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg font-bold shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#FFF] transition-all text-sm"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={onCreate}
                        className="flex items-center gap-2 bg-blue-600 dark:bg-blue-300 text-white dark:text-black px-3 py-2 rounded-lg font-bold shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#FFF] transition-all text-sm"
                    >
                        <Plus size={16} />
                        Create New
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 border-2 border-red-500 bg-red-50 text-red-700 font-semibold rounded-lg">
                    {error}
                </div>
            )}

            {/* Controls Bar */}
            <div className={`flex flex-col md:flex-row gap-4 ${isCompact ? 'mb-4' : 'mb-6'} justify-between items-end md:items-center`}>
                {/* Search & Filter */}
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-black dark:border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-800"
                        />
                    </div>

                    <div className="flex border-2 border-black dark:border-white rounded-lg overflow-hidden">
                        <button onClick={() => setContentFilter('all')} className={`px-3 py-1.5 text-sm font-bold ${contentFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>All</button>
                        <button onClick={() => setContentFilter('timelines')} className={`px-3 py-1.5 text-sm font-bold border-l-2 border-black dark:border-white ${contentFilter === 'timelines' ? 'bg-purple-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Timelines</button>
                        <button onClick={() => setContentFilter('learning')} className={`px-3 py-1.5 text-sm font-bold border-l-2 border-black dark:border-white ${contentFilter === 'learning' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Learning</button>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex gap-2">
                    <div className="flex border-2 border-black dark:border-white rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Table View">
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 border-l-2 border-black dark:border-white ${viewMode === 'grid' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Grid View">
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('compact')} className={`p-2 border-l-2 border-black dark:border-white ${viewMode === 'compact' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} title="Compact Grid">
                            <LayoutGrid size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin text-black dark:text-white" size={32} />
                </div>
            ) : filteredTimelines.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-1">No items found</h3>
                    <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    {viewMode === 'table' && renderTableView()}
                    {viewMode === 'grid' && renderGridView()}
                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default Dashboard;
