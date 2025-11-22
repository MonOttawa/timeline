import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import { Upload, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';

const TimelineGenerator = () => {
  const [events, setEvents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('My Project Timeline');
  const [timelineStyle, setTimelineStyle] = useState('bauhaus');
  const [exportFormat, setExportFormat] = useState('');
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

    // Sort events by date
    const sortedEvents = parsedEvents.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // If date parsing fails, keep original order
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return dateA - dateB;
    });

    setEvents(sortedEvents);
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

  const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const handleExport = async (format = exportFormat) => {
    if (!timelineRef.current || !format) return;

    const element = timelineRef.current;
    const filename = sanitizeFilename(timelineTitle);

    if (format === 'svg') {
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
      link.download = `${filename}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // PNG or JPG export
      const canvas = await html2canvas(element, {
        backgroundColor: format === 'png' ? null : '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, `image/${format === 'jpg' ? 'jpeg' : 'png'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 mb-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
        <h1 className="text-4xl font-black mb-4 font-display">{timelineTitle}</h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Upload your Markdown file to generate a beautiful timeline.</p>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <label className="cursor-pointer">
            <div className="w-auto inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-blue-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg">
              <Upload size={20} />
              {fileName || 'Choose Markdown File'}
            </div>
            <input type="file" accept=".md" onChange={handleFileSelect} className="hidden" />
          </label>

          {events.length > 0 && (
            <>
              <select
                value={exportFormat}
                onChange={async (e) => {
                  const format = e.target.value;
                  if (!format) return;
                  setExportFormat(format);
                  // Trigger export on next tick to ensure state is updated
                  await new Promise(resolve => setTimeout(resolve, 0));
                  await handleExport();
                  // Reset to default
                  setExportFormat('');
                }}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-green-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg cursor-pointer"
              >
                <option value="">Export As...</option>
                <option value="png">PNG (Transparent)</option>
                <option value="jpg">JPG</option>
                <option value="svg">SVG (Transparent)</option>
              </select>

              <button
                onClick={() => setShowEditor(!showEditor)}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
              >
                <FileText size={20} />
                {showEditor ? 'Hide' : 'Show'} Editor
              </button>

              <select
                value={timelineStyle}
                onChange={(e) => setTimelineStyle(e.target.value)}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-purple-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg cursor-pointer"
              >
                <option value="bauhaus">Bauhaus</option>
                <option value="neo-brutalist">Neo-Brutalist</option>
                <option value="corporate">Corporate</option>
              </select>
            </>
          )}
        </div>

        {events.length > 0 && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Tip: PNG & SVG exports have transparent backgrounds • JPG has white background
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
          <p className="mt-2 text-sm text-gray-500 text-gray-400">
            Changes are reflected in real-time on the timeline below
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div
          id="timeline-container"
          ref={timelineRef}
          className={`relative max-w-3xl mx-auto p-8 ${timelineStyle === 'bauhaus' ? 'pl-10' : ''}`}
        >
          {/* Timeline Title */}
          <h2 className={`text-5xl font-black font-display mb-12 text-black dark:text-white tracking-tighter ${timelineStyle === 'bauhaus' ? 'text-left pl-16' : 'text-center'}`}>
            {timelineTitle}
          </h2>

          {timelineStyle === 'bauhaus' ? (
            /* Bauhaus Style */
            <>
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
                      className="markdown-content prose prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 text-gray-200 leading-snug"
                      dangerouslySetInnerHTML={{ __html: event.content }}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : timelineStyle === 'neo-brutalist' ? (
            /* Neo-Brutalist Style */
            <div className="flex flex-col gap-6">
              {events.map((event, index) => {
                const lightColors = ['bg-yellow-300', 'bg-orange-300', 'bg-pink-300', 'bg-purple-300', 'bg-blue-300', 'bg-green-300'];
                const darkColors = ['dark:bg-yellow-600', 'dark:bg-orange-600', 'dark:bg-pink-600', 'dark:bg-purple-600', 'dark:bg-blue-600', 'dark:bg-green-600'];
                const bgColor = `${lightColors[index % lightColors.length]} ${darkColors[index % darkColors.length]}`;

                return (
                  <div key={index} className="relative">
                    {/* Event Card */}
                    <div className={`${bgColor} border-4 border-black dark:border-white rounded-lg p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF]`}>
                      {/* Date */}
                      {event.date && (
                        <div className="text-3xl font-black font-display text-black dark:text-white mb-3 tracking-tight">
                          {event.date}
                        </div>
                      )}

                      {/* Content Body */}
                      <div
                        className="markdown-content prose prose-lg max-w-none font-sans text-black dark:text-white font-medium"
                        dangerouslySetInnerHTML={{ __html: event.content }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : timelineStyle === 'corporate' ? (
            /* Corporate/Professional Style */
            <div className="relative">
              {/* Center vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2"></div>

              {events.map((event, index) => {
                const isLeft = index % 2 === 0;

                return (
                  <div key={index} className={`relative ${index > 0 ? '-mt-16' : ''}`}>
                    {/* Timeline dot - centered on card */}
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C41E3A] rounded-full transform -translate-x-1/2 z-20 ring-3 ring-white dark:ring-gray-800"></div>

                    {/* Connecting line from dot to card */}
                    <div className={`absolute top-1/2 -translate-y-1/2 h-px bg-black dark:bg-gray-400 z-10 ${isLeft ? 'left-[48%] w-[2%]' : 'left-[50%] w-[2%]'}`}></div>

                    {/* Event card - alternating sides */}
                    <div className={`relative ${isLeft ? 'pr-[52%]' : 'pl-[52%]'}`}>
                      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] transition-all duration-300 relative ${isLeft ? 'text-right' : ''}`} style={{ zIndex: index }}>
                        {/* Date */}
                        {event.date && (
                          <div className="font-black text-lg text-black dark:text-white mb-1.5 tracking-tight">
                            {event.date}
                          </div>
                        )}

                        {/* Content */}
                        <div
                          className="markdown-content prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&>*]:my-1"
                          dangerouslySetInnerHTML={{ __html: event.content }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TimelineGenerator;
