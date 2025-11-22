import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import { Upload, Download, FileText } from 'lucide-react';

const TimelineGenerator = () => {
  const [events, setEvents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('My Project Timeline');
  const timelineRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setMarkdownContent(content);
      parseMarkdown(content);
      setShowEditor(true);
    };
    reader.readAsText(file);
  };

  const parseMarkdown = (markdownContent) => {
    // Extract title from first line if it starts with #
    let title = 'My Project Timeline';
    let contentToProcess = markdownContent;

    const lines = markdownContent.split('\n');
    if (lines[0] && lines[0].trim().startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      // Remove the title line from content to process
      contentToProcess = lines.slice(1).join('\n');
    }

    setTimelineTitle(title);

    const rawEvents = contentToProcess.split('---').filter(event => event.trim() !== '');

    const parsedEvents = rawEvents.map((eventMarkdown) => {
      let date = '';
      const dateRegex = /\*(.*?)\*/; // Look for *Date*
      const dateMatch = eventMarkdown.match(dateRegex);

      let contentMarkdown = eventMarkdown;
      if (dateMatch) {
        date = dateMatch[1];
        contentMarkdown = eventMarkdown.replace(dateMatch[0], '').trim();
      }

      return {
        date,
        content: marked.parse(contentMarkdown.trim())
      };
    });

    setEvents(parsedEvents);
  };

  const handleMarkdownChange = (e) => {
    const content = e.target.value;
    setMarkdownContent(content);
    parseMarkdown(content);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName || 'timeline.md';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
    if (!timelineRef.current) return;

    const element = timelineRef.current;
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${element.offsetWidth}" height="${element.offsetHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${element.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'timeline.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 mb-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
        <h1 className="text-4xl font-black mb-4 font-display">{timelineTitle}</h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Upload your Markdown file to generate a Bauhaus-style timeline.</p>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <label className="cursor-pointer">
            <div className="w-auto inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-blue-400 text-black shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all rounded-lg">
              <Upload size={20} />
              {fileName || 'Choose Markdown File'}
            </div>
            <input type="file" accept=".md" onChange={handleFileSelect} className="hidden" />
          </label>

          {events.length > 0 && (
            <>
              <button
                onClick={handleExportSVG}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-green-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all rounded-lg"
              >
                <Download size={20} />
                Export SVG
              </button>

              <button
                onClick={() => setShowEditor(!showEditor)}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all rounded-lg"
              >
                <FileText size={20} />
                {showEditor ? 'Hide' : 'Show'} Editor
              </button>
            </>
          )}
        </div>

        {events.length > 0 && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Tip: You can convert the SVG to PNG using any image editor or online converter
          </p>
        )}
      </div>

      {/* Markdown Editor */}
      {showEditor && markdownContent && (
        <div className="bg-white dark:bg-gray-800 p-6 mb-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black font-display">Edit Markdown</h2>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-2 px-4 bg-blue-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all rounded-lg text-sm"
            >
              <Download size={16} />
              Download MD
            </button>
          </div>
          <textarea
            value={markdownContent}
            onChange={handleMarkdownChange}
            className="w-full h-96 p-4 font-mono text-sm border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            placeholder="Enter your markdown here..."
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Changes are reflected in real-time on the timeline below
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div
          id="timeline-container"
          ref={timelineRef}
          className="relative max-w-3xl mx-auto p-8 pl-10"
        >
          {/* Timeline Title */}
          <h2 className="text-5xl font-black font-display text-left mb-12 text-black dark:text-white tracking-tighter pl-16">
            {timelineTitle}
          </h2>

          {/* Vertical Line - starts at center of first red dot */}
          <div className="absolute left-10 bottom-8 w-0.5 bg-black dark:bg-white" style={{ top: 'calc(5rem + 3rem + 0.5rem + 0.75rem)' }}></div>

          {events.map((event, index) => (
            <div key={index} className="relative mb-16 pl-16">
              {/* Dot */}
              <div className="absolute left-[-11px] top-2 w-6 h-6 bg-[#C41E3A] rounded-full z-10"></div>

              {/* Content Container */}
              <div className="flex flex-col gap-0">
                {/* Date */}
                {event.date && (
                  <div className="text-4xl font-black font-display text-black dark:text-white mb-1 tracking-tighter">
                    {event.date}
                  </div>
                )}

                {/* Content Body */}
                <div
                  className="markdown-content prose dark:prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug"
                  dangerouslySetInnerHTML={{ __html: event.content }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineGenerator;
