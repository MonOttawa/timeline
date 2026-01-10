import React, { useMemo } from 'react';
import { marked } from 'marked';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';

const parseTimelineMarkdown = (markdownContent) => {
  if (!markdownContent) return { title: 'Timeline', events: [] };

  let title = 'Timeline';
  let contentToProcess = markdownContent;
  const lines = markdownContent.split('\n');

  // Extract title from first non-empty line if it starts with #
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (!trimmedLine) continue;
    if (trimmedLine.startsWith('#')) {
      title = trimmedLine.replace(/^#+\s*/, '').trim() || title;
      contentToProcess = lines.slice(i + 1).join('\n');
    }
    break;
  }

  const rawEvents = contentToProcess.split('---').filter(event => event.trim() !== '');
  const parsedEvents = rawEvents.map((eventMarkdown) => {
    const eventLines = eventMarkdown.split('\n');
    let date = '';
    let contentLines = eventLines;

    for (let i = 0; i < eventLines.length; i++) {
      const trimmed = eventLines[i].trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^\*(.*?)\*$/);
      if (match) {
        date = match[1].trim();
        contentLines = [...eventLines.slice(0, i), ...eventLines.slice(i + 1)];
      }
      break;
    }

    const htmlContent = marked.parse(contentLines.join('\n').trim());
    return {
      date,
      content: sanitizeMarkdownHtml(htmlContent)
    };
  });

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

    if (Number.isNaN(dateA.getTime()) && Number.isNaN(dateB.getTime())) return 0;
    if (Number.isNaN(dateA.getTime())) return 1;
    if (Number.isNaN(dateB.getTime())) return -1;

    return dateA - dateB;
  });

  return { title, events: sortedEvents };
};

const getQueryParam = (key) => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

const decodeMarkdown = (encoded) => {
  if (!encoded) return '';
  try {
    const decoded = decodeURIComponent(encoded);
    return atob(decoded);
  } catch {
    try {
      return atob(encoded);
    } catch {
      return '';
    }
  }
};

const allowedStyles = ['bauhaus', 'bauhaus-mono', 'neo-brutalist', 'corporate', 'handwritten'];

const TimelineRender = () => {
  const markdown = decodeMarkdown(getQueryParam('md'));
  const styleParam = getQueryParam('style')?.toLowerCase();
  const forcedTitle = getQueryParam('title');

  const timelineStyle = allowedStyles.includes(styleParam) ? styleParam : 'bauhaus-mono';

  const { title, events } = useMemo(() => parseTimelineMarkdown(markdown), [markdown]);
  const timelineTitle = forcedTitle ? decodeURIComponent(forcedTitle) : title;
  const isBauhausStyle = timelineStyle === 'bauhaus' || timelineStyle === 'bauhaus-mono';
  const isBauhausMono = timelineStyle === 'bauhaus-mono';

  return (
    <div className="min-h-screen bg-white text-black">
      <div
        id="timeline-container"
        className={`relative max-w-3xl mx-auto p-8 ${isBauhausStyle ? 'pl-10' : ''} ${isBauhausStyle ? 'timeline-bauhaus' : ''} ${isBauhausMono ? 'timeline-bauhaus-mono' : ''}`}
        style={{ backgroundColor: 'transparent' }}
      >
        <h1 className={`text-5xl font-black mb-12 text-black tracking-tighter ${isBauhausStyle ? 'text-left pl-16' : 'text-center'} ${isBauhausMono ? 'font-doto' : 'font-display'}`}>
          {timelineTitle}
        </h1>

        {isBauhausStyle ? (
          <div className="relative">
            <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-black"></div>

            {events.map((event, index) => (
              <div key={index} className="relative mb-10 pl-16">
                <div className="absolute left-[-11px] top-2 w-6 h-6 bg-[#C41E3A] rounded-full z-10"></div>

                <div className="flex flex-col gap-0">
                  {event.date && (
                    <div className={`text-4xl font-black text-black mb-1 tracking-tighter ${isBauhausMono ? 'font-doto' : 'font-display'}`}>
                      {event.date}
                    </div>
                  )}

                  <div
                    className={`markdown-content prose prose-invert max-w-none text-lg font-medium uppercase tracking-wide text-gray-800 leading-snug ${isBauhausMono ? 'font-vt323' : 'font-sans'}`}
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : timelineStyle === 'neo-brutalist' ? (
          <div className="flex flex-col gap-4">
            {events.map((event, index) => {
              const lightColors = ['bg-yellow-300', 'bg-orange-300', 'bg-pink-300', 'bg-purple-300', 'bg-blue-300', 'bg-green-300'];
              const bgColor = lightColors[index % lightColors.length];

              return (
                <div key={index} className="relative">
                  <div className={`${bgColor} border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_#000]`}>
                    {event.date && (
                      <div className="text-3xl font-black font-display text-black mb-3 tracking-tight">
                        {event.date}
                      </div>
                    )}

                    <div
                      className="markdown-content prose prose-lg max-w-none font-sans text-black font-medium"
                      dangerouslySetInnerHTML={{ __html: event.content }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : timelineStyle === 'corporate' ? (
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 transform -translate-x-1/2"></div>

            {events.map((event, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div key={index} className={`relative ${index > 0 ? 'mt-2' : ''}`}>
                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C41E3A] rounded-full transform -translate-x-1/2 z-20 ring-3 ring-white"></div>
                  <div className={`absolute top-1/2 -translate-y-1/2 h-px bg-black z-10 ${isLeft ? 'left-[48%] w-[2%]' : 'left-[50%] w-[2%]'}`}></div>

                  <div className={`relative ${isLeft ? 'pr-[52%]' : 'pl-[52%]'}`}>
                    <div className={`bg-white rounded-lg p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 relative ${isLeft ? 'text-right' : ''}`}>
                      <div
                        className="markdown-content prose prose-sm max-w-none text-gray-700 [&>*]:my-1"
                        dangerouslySetInnerHTML={{ __html: event.content }}
                      />
                    </div>
                  </div>

                  <div className={`absolute top-1/2 -translate-y-1/2 w-[45%] ${isLeft ? 'left-[52%] text-left' : 'right-[52%] text-right'}`}>
                    {event.date && (
                      <div className="font-black text-2xl text-black tracking-tight">
                        {event.date}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative font-cursive">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-black transform -translate-x-1/2 opacity-70" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)' }}></div>

            {events.map((event, index) => (
              <div key={index} className="relative mb-6">
                <div className={`absolute top-0 w-1/3 text-2xl font-bold ${index % 2 === 0 ? 'left-[10%] text-right' : 'right-[10%] text-left'}`} style={{ fontFamily: 'Caveat, cursive' }}>
                  {event.date}
                </div>
                <div className="w-4 h-4 bg-black rounded-full border-2 border-white mx-auto z-10 relative mb-4"></div>
                <div className={`w-2/3 mx-auto border-2 border-black p-4 rounded-lg bg-white shadow-[4px_4px_0px_#000] transform ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                  <div
                    className="font-cursive text-xl markdown-content"
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineRender;
