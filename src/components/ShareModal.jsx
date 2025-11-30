import React, { useState } from 'react';
import { X, Share2, Copy, Check, Eye } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, isPublic, onTogglePublic, shareUrl, viewCount, isSaving }) => {
    const [copied, setCopied] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    const embedUrl = shareUrl
        ? `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}embed=1`
        : '';
    const embedCode = embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="800" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
        : '';
    const styleHint = (() => {
        if (!shareUrl) return '';
        try {
            const url = new URL(shareUrl);
            return url.searchParams.get('style') || '';
        } catch {
            return '';
        }
    })();

    if (!isOpen) return null;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy link to clipboard');
        }
    };

    const handleCopyEmbed = async () => {
        if (!embedCode) return;
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        } catch (error) {
            console.error('Failed to copy embed code:', error);
            alert('Failed to copy embed code');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg max-w-md w-full p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Share2 size={24} className="text-purple-500" />
                        <h2 className="text-2xl font-black font-display">Share Timeline</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Public/Private Toggle */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="font-bold text-lg">Make Public</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isPublic ? 'Anyone with the link can view' : 'Only you can view this timeline'}
                            </p>
                        </div>
                        <button
                            onClick={onTogglePublic}
                            disabled={isSaving}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors border-2 border-black dark:border-white ${isPublic ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white border-2 border-black dark:border-white transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Share Link (only shown when public) */}
                {isPublic && (
                    <div className="mb-6">
                        <label className="block font-bold mb-2">Share Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-4 py-2 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-mono"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-blue-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                        {styleHint && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Preserves style: <span className="font-mono">{styleHint}</span> (parameter in the URL)
                            </p>
                        )}
                    </div>
                )}

                {/* Embed Code */}
                {isPublic && embedCode && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block font-bold">Embed on your site</label>
                            <span className="text-xs text-gray-500">iframe, same style as shared page</span>
                        </div>
                        <div className="flex gap-2">
                            <textarea
                                readOnly
                                value={embedCode}
                                className="flex-1 p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-xs font-mono h-24"
                            />
                            <button
                                onClick={handleCopyEmbed}
                                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-green-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg h-24"
                            >
                                {copiedEmbed ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* View Count */}
                {isPublic && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Eye size={20} className="text-purple-600 dark:text-purple-400" />
                            <span className="font-bold">
                                {viewCount || 0} {viewCount === 1 ? 'view' : 'views'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full border-2 border-black dark:border-white font-bold py-3 px-6 bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
