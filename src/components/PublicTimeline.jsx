import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { AlertCircle, Pin, ExternalLink, ArrowRight } from 'lucide-react';
import { getPublicTimeline, incrementViewCount } from '../lib/pocketbase';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';

const allowedStyles = ['bauhaus', 'neo-brutalist', 'corporate', 'handwritten'];
const handwrittenTitleStyle = { fontFamily: "'Just Another Hand', 'Caveat', cursive" };
const handwrittenBodyStyle = { fontFamily: "'Roboto', 'Inter', 'Helvetica', 'Arial', sans-serif" };

const PublicTimeline = ({ slug, recordId = null, embedMode = false, styleOverride = null, onCreateOwn }) => {
    const [timeline, setTimeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                setLoading(true);
                const data = await getPublicTimeline(slug, recordId);
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

        if (slug || recordId) {
            fetchTimeline();
        }
    }, [slug, recordId]);

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
            <div className={`max-w-4xl mx-auto ${embedMode ? 'mt-4 px-4' : 'mt-12'}`}>
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
            <div className={`max-w-4xl mx-auto ${embedMode ? 'mt-4 px-4' : 'mt-12'}`}>
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

    const timelineStyle = (styleOverride && allowedStyles.includes(styleOverride))
        ? styleOverride
        : (timeline?.style && allowedStyles.includes(timeline.style))
            ? timeline.style
            : 'bauhaus';
    const timelineTitle = timeline?.title || 'Timeline';

    return (
        <div className={`${embedMode ? 'max-w-5xl mx-auto p-4' : 'max-w-4xl mx-auto mt-12 px-4'}`}>

            {/* Timeline Display (mirrors editor rendering) */}
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
                            {/* Vertical Line */}
                            <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-black dark:bg-white"></div>

                            {events.map((event, index) => (
                                <div key={index} className="relative mb-16 pl-16">
                                    {/* Dot */}
                                    <div className="absolute left-[-11px] top-2 w-6 h-6 bg-[#C41E3A] rounded-full z-10"></div>

                                    <div className="flex flex-col gap-0">
                                        {/* Date */}
                                        {event.date && (
                                            <div className="text-4xl font-black font-display text-black dark:text-white mb-1 tracking-tighter px-2 py-1">
                                                {event.date}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div
                                            className="markdown-content prose prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug px-2 py-1"
                                            dangerouslySetInnerHTML={{ __html: event.content }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timelineStyle === 'neo-brutalist' ? (
                        /* Neo-Brutalist Style */
                        <div className="flex flex-col gap-6">
                            {events.map((event, index) => {
                                const lightColors = ['bg-yellow-300', 'bg-orange-300', 'bg-pink-300', 'bg-purple-300', 'bg-blue-300', 'bg-green-300'];
                                const darkColors = ['dark:bg-yellow-600', 'dark:bg-orange-600', 'dark:bg-pink-600', 'dark:bg-purple-600', 'dark:bg-blue-600', 'dark:bg-green-600'];
                                const bgColor = `${lightColors[index % lightColors.length]} ${darkColors[index % darkColors.length]}`;

                                return (
                                    <div key={index} className="relative">
                                        <div className={`${bgColor} border-4 border-black dark:border-white rounded-lg p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF]`}>
                                            {event.date && (
                                                <div className="text-3xl font-black font-display text-black dark:text-white mb-3 tracking-tight px-2 py-1">
                                                    {event.date}
                                                </div>
                                            )}

                                            <div
                                                className="markdown-content prose prose-lg max-w-none font-sans text-black dark:text-white font-medium px-2 py-1"
                                                dangerouslySetInnerHTML={{ __html: event.content }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : timelineStyle === 'corporate' ? (
                        /* Corporate/Professional Style (responsive: stack on small screens) */
                        <div className="relative">
                            {/* Center vertical line for desktop */}
                            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2"></div>

                            {events.map((event, index) => {
                                const isLeft = index % 2 === 0;

                                return (
                                    <div key={index} className={`relative ${index > 0 ? 'mt-4 md:mt-2' : ''}`}>
                                        {/* Desktop: dot + connector */}
                                        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C41E3A] rounded-full transform -translate-x-1/2 z-20 ring-3 ring-white dark:ring-gray-800"></div>
                                        <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-black dark:bg-gray-400 z-10 ${isLeft ? 'left-[48%] w-[2%]' : 'left-[50%] w-[2%]'}`}></div>

                                        {/* Event card - alternating sides on desktop, stacked on mobile */}
                                        <div className={`relative ${isLeft ? 'md:pr-[52%]' : 'md:pl-[52%]'}`}>
                                            <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] transition-all duration-300 relative ${isLeft ? 'md:text-right' : ''}`} style={{ zIndex: index }}>
                                                {/* Mobile date (inside card) */}
                                                {event.date && (
                                                    <div className="md:hidden text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                        {event.date}
                                                    </div>
                                                )}
                                                <div
                                                    className="markdown-content prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&>*]:my-1 px-2 py-1"
                                                    dangerouslySetInnerHTML={{ __html: event.content }}
                                                />
                                            </div>
                                        </div>

                                        {/* Desktop date - opposite side */}
                                        <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-[45%] ${isLeft ? 'left-[52%] text-left' : 'right-[52%] text-right'}`}>
                                            {event.date && (
                                                <div className="font-black text-2xl text-black dark:text-white tracking-tight px-2 py-1">
                                                    {event.date}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : timelineStyle === 'handwritten' ? (
                        /* Handwritten Style */
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[7.5rem] top-[2.5rem] bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

                            {events.map((event, index) => {
                                const plainText = event.content.replace(/<[^>]*>/g, '');
                                const [firstLine, ...restLines] = plainText.split('\n');
                                const restText = restLines.join('\n').trim();

                                return (
                                    <div key={index} className="relative mb-6 pl-40">
                                        {/* Date - positioned on left side of vertical line */}
                                        {event.date && (
                                            <div className="absolute left-0 top-[1.6rem] w-28 text-right pr-4 text-2xl text-slate-600 dark:text-slate-400 px-2 py-1" style={handwrittenTitleStyle}>
                                                {event.date}
                                            </div>
                                        )}

                                        {/* Dot */}
                                        <div className="absolute left-[7.3rem] top-8 w-3 h-3 bg-slate-600 dark:bg-slate-500 rounded-full z-10 ring-4 ring-white dark:ring-gray-800"></div>

                                        {/* Content Container */}
                                        <div className="flex flex-col gap-0">
                                            <div className="text-4xl text-slate-700 dark:text-slate-300 leading-tight px-2 py-1" style={handwrittenTitleStyle}>
                                                {firstLine || 'Event'}
                                            </div>

                                            {restText && (
                                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed px-2 py-1" style={handwrittenBodyStyle}>
                                                    {restText}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Discreet source reference */}
            <div className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <span>Made with Timeline.md</span>
                <button
                    onClick={onCreateOwn}
                    className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold hover:underline"
                >
                    Create yours
                    <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
};

export default PublicTimeline;
