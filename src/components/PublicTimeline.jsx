import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { getPublicTimeline, incrementViewCount } from '../lib/pocketbase';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';

const PublicTimeline = ({ slug, onCreateOwn }) => {
    const [timeline, setTimeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                setLoading(true);
                const data = await getPublicTimeline(slug);
                setTimeline(data);

                // Increment view count
                await incrementViewCount(data.id);

                // Parse markdown content
                parseMarkdown(data.content, data.title);
            } catch (err) {
                console.error('Error fetching public timeline:', err);
                setError(err.message || 'Timeline not found');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchTimeline();
        }
    }, [slug]);

    const parseMarkdown = (markdownContent, title) => {
        const lines = markdownContent.split('\n');
        let contentToProcess = markdownContent;

        // Remove title line if present
        let titleLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();
            if (trimmedLine && trimmedLine.startsWith('#')) {
                titleLineIndex = i;
                break;
            }
        }

        if (titleLineIndex >= 0) {
            contentToProcess = lines.slice(titleLineIndex + 1).join('\n');
        }

        const rawEvents = contentToProcess.split('---').filter(event => event.trim() !== '');

        const parsedEvents = rawEvents.map((eventMarkdown) => {
            let date = '';
            const dateRegex = /\*(.*?)\*/;
            const dateMatch = eventMarkdown.match(dateRegex);

            let contentMarkdown = eventMarkdown;
            if (dateMatch) {
                date = dateMatch[1];
                contentMarkdown = eventMarkdown.replace(dateMatch[0], '').trim();
            }

            const htmlContent = marked.parse(contentMarkdown.trim());
            return {
                date,
                content: sanitizeMarkdownHtml(htmlContent)
            };
        });

        // Sort events by date
        const sortedEvents = parsedEvents.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;

            const getYear = (dateStr) => {
                const match = dateStr.match(/\d{4}/);
                return match ? parseInt(match[0], 10) : null;
            };

            const yearA = getYear(a.date);
            const yearB = getYear(b.date);

            if (yearA !== null && yearB !== null) {
                return yearA - yearB;
            }

            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;

            return dateA - dateB;
        });

        setEvents(sortedEvents);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto mt-12">
                <div className="bg-white dark:bg-gray-800 p-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading timeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-12">
                <div className="bg-white dark:bg-gray-800 p-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-black mb-4 font-display">Timeline Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This timeline doesn't exist or is not publicly shared.
                    </p>
                    <button
                        onClick={onCreateOwn}
                        className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-blue-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
                    >
                        Create Your Own Timeline
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    const timelineStyle = timeline?.style || 'bauhaus';
    const timelineTitle = timeline?.title || 'Timeline';

    return (
        <div className="max-w-4xl mx-auto mt-12">
            {/* Header Banner */}
            <div className="bg-purple-400 dark:bg-purple-600 p-6 mb-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                <p className="text-lg font-bold text-black dark:text-white mb-2">
                    📌 Shared Timeline
                </p>
                <button
                    onClick={onCreateOwn}
                    className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg text-sm"
                >
                    Create Your Own
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Timeline Display */}
            {events.length > 0 && (
                <div
                    className={`relative max-w-3xl mx-auto p-8 ${timelineStyle === 'bauhaus' ? 'pl-10' : ''}`}
                    style={{ backgroundColor: 'transparent' }}
                >
                    {/* Timeline Title */}
                    <h2 className={`text-5xl font-black font-display mb-12 text-black dark:text-white tracking-tighter ${timelineStyle === 'bauhaus' ? 'text-left pl-16' : 'text-center'}`}>
                        {timelineTitle}
                    </h2>

                    {timelineStyle === 'bauhaus' ? (
                        /* Bauhaus Style */
                        <div className="relative">
                            <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-black dark:bg-white"></div>

                            {events.map((event, index) => (
                                <div key={index} className="relative mb-16 pl-16">
                                    <div className="absolute left-[-11px] top-2 w-6 h-6 bg-[#C41E3A] rounded-full z-10"></div>

                                    <div className="flex flex-col gap-0">
                                        {event.date && (
                                            <div className="text-4xl font-black font-display text-black dark:text-white mb-1 tracking-tighter">
                                                {event.date}
                                            </div>
                                        )}

                                        <div
                                            className="markdown-content prose prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug"
                                            dangerouslySetInnerHTML={{ __html: event.content }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timelineStyle === 'neo-brutalist' ? (
                        /* Neo-Brutalist Style */
                        <div className="space-y-8">
                            {events.map((event, index) => (
                                <div key={index} className="relative">
                                    <div className="bg-gradient-to-br from-yellow-300 to-pink-300 dark:from-yellow-600 dark:to-pink-600 p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg transform hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_#000] dark:hover:shadow-[12px_12px_0px_#FFF] transition-all">
                                        {event.date && (
                                            <div className="text-2xl font-black font-display text-black dark:text-white mb-3 tracking-tight">
                                                {event.date}
                                            </div>
                                        )}

                                        <div
                                            className="markdown-content prose prose-invert max-w-none text-black dark:text-white font-sans text-base leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: event.content }}
                                        />
                                    </div>

                                    {index < events.length - 1 && (
                                        <div className="flex justify-center my-4">
                                            <div className="text-4xl text-black dark:text-white">↓</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : timelineStyle === 'corporate' ? (
                        /* Corporate Style */
                        <div className="space-y-6">
                            {events.map((event, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-6 border-l-4 border-blue-500 shadow-lg rounded-r-lg">
                                    {event.date && (
                                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                                            {event.date}
                                        </div>
                                    )}

                                    <div
                                        className="markdown-content prose prose-invert max-w-none text-gray-800 dark:text-gray-200 font-sans text-base leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: event.content }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Handwritten Style */
                        <div className="space-y-12">
                            {events.map((event, index) => (
                                <div key={index} className="relative">
                                    {event.date && (
                                        <div className="text-3xl font-cursive text-black dark:text-white mb-3" style={{ fontFamily: "'Just Another Hand', cursive" }}>
                                            {event.date}
                                        </div>
                                    )}

                                    <div
                                        className="markdown-content prose prose-invert max-w-none text-gray-800 dark:text-gray-200 font-cursive text-xl leading-relaxed"
                                        style={{ fontFamily: "'Just Another Hand', cursive" }}
                                        dangerouslySetInnerHTML={{ __html: event.content }}
                                    />

                                    {index < events.length - 1 && (
                                        <div className="mt-6 border-b-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicTimeline;
