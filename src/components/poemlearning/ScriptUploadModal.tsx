import React, { useState } from 'react';
import type { CreateScriptInput } from '../services/scriptRepository';

interface ScriptUploadModalProps {
    onClose: () => void;
    onSubmit: (script: CreateScriptInput) => Promise<void>;
}

export const ScriptUploadModal: React.FC<ScriptUploadModalProps> = ({ onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [text, setText] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit =
        !isSubmitting &&
        title.trim().length > 0 &&
        author.trim().length > 0 &&
        text.trim().length > 0;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!title.trim() || !author.trim() || !text.trim()) {
            setError('Please fill in the title, author, and script text.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                title: title.trim(),
                author: author.trim(),
                text: text.trim(),
                category: category.trim() || 'Custom',
                type: 'speech', // Default type
                difficulty: 'intermediate', // Default difficulty
            });
            onClose();
        } catch (err) {
            console.error('Failed to save script', err);
            if (err instanceof Error && err.message) {
                setError(err.message);
            } else {
                setError('Failed to save the script. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-3xl w-full h-[90vh]" onClick={(event) => event.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
                    aria-label="Close script upload"
                    title="Close (Esc)"
                    disabled={isSubmitting}
                >
                    ✕
                </button>
                <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                                Add a Custom Script
                            </h2>
                            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                Paste a speech, monologue, or text you want to memorize.
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <form className="flex-1 min-h-0 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
                                Title
                                <input
                                    type="text"
                                    value={title}
                                    onChange={event => setTitle(event.target.value)}
                                    className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2"
                                    placeholder="e.g. The Gettysburg Address"
                                    autoFocus
                                />
                            </label>
                            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
                                Author/Speaker
                                <input
                                    type="text"
                                    value={author}
                                    onChange={event => setAuthor(event.target.value)}
                                    className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2"
                                    placeholder="e.g. Abraham Lincoln"
                                />
                            </label>
                        </div>

                        <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
                            Category <span className="text-xs text-gray-500">(Optional)</span>
                            <input
                                type="text"
                                value={category}
                                onChange={event => setCategory(event.target.value)}
                                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2"
                                placeholder="e.g. Historical, Movie Monologue"
                            />
                        </label>

                        <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2 flex-1">
                            Script Text
                            <textarea
                                value={text}
                                onChange={event => setText(event.target.value)}
                                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 min-h-[300px] font-serif text-lg leading-relaxed resize-none"
                                placeholder="Paste the full text here..."
                            />
                        </label>

                        {error && (
                            <p className="text-sm font-mono text-red-600 dark:text-red-400">{error}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 border-2 border-black dark:border-white rounded-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-4 py-2 border-2 border-black dark:border-white rounded-lg font-bold bg-pink-500 text-white hover:bg-black hover:text-pink-500 transition-all focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving…' : 'Save Script'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
