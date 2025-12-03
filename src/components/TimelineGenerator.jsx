import React, { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { Upload, Download, FileText, Palette, Save, FolderOpen, ChevronDown, Sparkles, Layout, Share2 } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { useAuth } from '../hooks/useAuth';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';
import AuthModal from './AuthModal';
import SavedTimelinesModal from './SavedTimelinesModal';
import AIGenerateModal from './AIGenerateModal';
import TemplatesModal from './TemplatesModal';
import ShareModal from './ShareModal';
import { slugify, makeUniqueSlug } from '../lib/slugify';
import { sampleTimelines } from '../data/sampleTimelines';
import { createTimeline, updateTimeline, listTimelinesByUser, deleteTimeline as deleteTimelineApi, findTimelineByTitle } from '../lib/api/timelines';
import { buildShareUrl } from '../lib/shareLinks';

const TimelineGenerator = ({ isDemoMode = false, initialTimeline = null, onBack = null }) => {
  const compactBtn = (bg) => `inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-black dark:border-white rounded-lg ${bg} text-black shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all`;

  const [events, setEvents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('My Project Timeline');
  const [timelineStyle, setTimelineStyle] = useState('bauhaus');
  const [exportFormat, setExportFormat] = useState('');
  const timelineRef = useRef(null);
  const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const sampleDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const [editingEvent, setEditingEvent] = useState(null); // { index, field: 'date' | 'content' }
  const [hasLoadedDemo, setHasLoadedDemo] = useState(false);

  // Auth & Persistence
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedTimelines, setShowSavedTimelines] = useState(false);
  const [savedTimelines, setSavedTimelines] = useState([]);
  const [currentTimelineId, setCurrentTimelineId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTimelines, setIsLoadingTimelines] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [currentSlug, setCurrentSlug] = useState('');
  const [viewCount, setViewCount] = useState(0);

  // SVG arrow for dropdown buttons
  const arrowSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sampleDropdownRef.current && !sampleDropdownRef.current.contains(event.target)) {
        setIsSampleDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setIsStyleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Parse markdown to extract events only (without changing title)
  const parseMarkdownEvents = useCallback((markdownContent) => {
    console.log('parseMarkdownEvents called with content length:', markdownContent?.length);
    if (!markdownContent) {
      setEvents([]);
      return;
    }

    let contentToProcess = markdownContent;
    const lines = markdownContent.split('\n');

    // Skip title line if it exists
    let titleLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine) {
        if (trimmedLine.startsWith('#')) {
          titleLineIndex = i;
        }
        break;
      }
    }

    if (titleLineIndex >= 0) {
      contentToProcess = lines.slice(titleLineIndex + 1).join('\n');
    }

    const rawEvents = contentToProcess.split('---').filter(event => event.trim() !== '');
    console.log('Found raw events:', rawEvents.length);

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

    console.log('Setting events:', sortedEvents.length);
    setEvents(sortedEvents);
  }, []);

  // Load initial timeline if provided
  useEffect(() => {
    console.log('initialTimeline changed:', initialTimeline);
    if (initialTimeline) {
      const content = initialTimeline.content || '';
      console.log('Loading timeline:', initialTimeline.title, 'Content length:', content.length);

      // Set all timeline properties first
      setTimelineTitle(initialTimeline.title || 'My Project Timeline');
      setTimelineStyle(initialTimeline.style || 'bauhaus');
      setCurrentTimelineId(initialTimeline.id);
      setCurrentSlug(initialTimeline.slug || '');
      setIsPublic(initialTimeline.public || false);
      setViewCount(initialTimeline.viewCount || 0);
      setMarkdownContent(content);

      // Parse markdown to extract events (without overwriting title)
      if (content) {
        console.log('Parsing events from content');
        parseMarkdownEvents(content);
      } else {
        console.log('No content to parse');
        setEvents([]);
      }
    }
  }, [initialTimeline, parseMarkdownEvents]); // React to full initialTimeline changes

  // Auto-load sample timeline in demo mode
  useEffect(() => {
    if (isDemoMode && !hasLoadedDemo && sampleTimelines.length > 0 && !initialTimeline) {
      const firstSample = sampleTimelines[0];
      setMarkdownContent(firstSample.content);
      parseMarkdown(firstSample.content);
      setTimelineTitle(firstSample.name);
      setFileName(`${firstSample.name}.md`);
      setHasLoadedDemo(true);
    }
  }, [isDemoMode, hasLoadedDemo, initialTimeline]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setMarkdownContent(content);
      parseMarkdown(content);
      setShowEditor(false);
    };
    reader.readAsText(file);
  };



  const parseMarkdown = (markdownContent) => {
    if (!markdownContent) {
      setEvents([]);
      return;
    }

    // Extract title from first non-empty line if it starts with #
    let title = 'My Project Timeline';
    let contentToProcess = markdownContent;

    const lines = markdownContent.split('\n');

    // Find first non-empty line
    let titleLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine) {
        if (trimmedLine.startsWith('#')) {
          title = trimmedLine.replace(/^#+\s*/, '').trim();
          titleLineIndex = i;
        }
        break; // Stop after first non-empty line
      }
    }

    // Remove title line from content if found
    if (titleLineIndex >= 0) {
      contentToProcess = lines.slice(titleLineIndex + 1).join('\n');
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

      // Helper to extract the first year from a date string
      const getYear = (dateStr) => {
        const match = dateStr.match(/\d{4}/);
        return match ? parseInt(match[0], 10) : null;
      };

      const yearA = getYear(a.date);
      const yearB = getYear(b.date);

      // If we can extract years, compare them
      if (yearA !== null && yearB !== null) {
        return yearA - yearB;
      }

      // Fallback to standard date parsing if no year found (or for non-year dates)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return dateA - dateB;
    });

    setEvents(sortedEvents);
  };

  // Regenerate markdown from events array
  const regenerateMarkdown = (eventsArray) => {
    const title = timelineTitle !== 'My Project Timeline' ? `# ${timelineTitle}\n\n` : '';
    const eventMarkdown = eventsArray.map(event => {
      const dateLine = event.date ? `*${event.date}*\n\n` : '';
      // Convert HTML back to markdown (simple approach)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = event.content;
      const plainContent = tempDiv.textContent || tempDiv.innerText || '';
      return `${dateLine}${plainContent.trim()}`;
    }).join('\n\n---\n\n');
    return title + eventMarkdown;
  };

  // Handle event field update
  const handleEventUpdate = (index, field, value) => {
    const updatedEvents = [...events];
    if (field === 'date') {
      updatedEvents[index].date = value;
    } else if (field === 'content') {
      const htmlContent = marked.parse(value);
      updatedEvents[index].content = sanitizeMarkdownHtml(htmlContent);
    }
    setEvents(updatedEvents);

    // Regenerate and update markdown content
    const newMarkdown = regenerateMarkdown(updatedEvents);
    setMarkdownContent(newMarkdown);
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

  // Persistence Functions
  const handleSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      return null;
    }

    if (!markdownContent) return null;

    setIsSaving(true);
    let record = null;
    try {
    const safeTitle = (timelineTitle || '').trim() || 'Untitled Timeline';
    if (safeTitle !== timelineTitle) {
      setTimelineTitle(safeTitle);
    }

    const data = {
      user: user.id,
      title: safeTitle,
      content: markdownContent,
      style: timelineStyle,
    };

      // Ensure every saved timeline has a slug, even for older records
      let slugToUse = currentSlug;
      if (!slugToUse) {
        const baseSlug = slugify(safeTitle || 'timeline');
        slugToUse = makeUniqueSlug(baseSlug);
        setCurrentSlug(slugToUse);

        // If this is a brand-new timeline, reset share state
        if (!currentTimelineId) {
          setIsPublic(false);
          setViewCount(0);
        }
      }

      data.slug = slugToUse;
      data.public = typeof isPublic === 'boolean' ? isPublic : false;
      data.viewCount = typeof viewCount === 'number' ? viewCount : 0;

      const datedData = { ...data, updated: new Date().toISOString() };

      // If no current ID, check for existing title to avoid duplicates and update instead of create
      let targetId = currentTimelineId;
      if (!targetId) {
        const existingByTitle = await findTimelineByTitle(user.id, safeTitle);
        if (existingByTitle?.id) {
          targetId = existingByTitle.id;
          setCurrentTimelineId(targetId);
          setCurrentSlug(existingByTitle.slug || slugToUse);
          setIsPublic(Boolean(existingByTitle.public));
          setViewCount(existingByTitle.viewCount || 0);
        }
      }

      if (targetId) {
        record = await updateTimeline(targetId, datedData);
      } else {
        record = await createTimeline(datedData);
        setCurrentTimelineId(record.id);
      }

      // Update state with saved data
      if (record.slug) setCurrentSlug(record.slug);
      if (typeof record.public !== 'undefined') setIsPublic(record.public);
      if (typeof record.viewCount !== 'undefined') setViewCount(record.viewCount);

      // Show simple success feedback (could be a toast in a real app)
      const originalTitle = timelineTitle;
      setTimelineTitle('Saved! ✓');
      setTimeout(() => setTimelineTitle(originalTitle), 2000);
    } catch (error) {
      console.error('Error saving timeline:', error);
      alert(`Failed to save timeline: ${error.message || error.data?.message || 'Unknown error'}. Please check your internet connection and ensure the "timelines" collection exists with correct API rules.`);
    } finally {
      setIsSaving(false);
    }

    return record;
  };

  const handleLoadSample = (sampleId) => {
    const sample = sampleTimelines.find(t => t.id === sampleId);
    if (sample) {
      setMarkdownContent(sample.content);
      parseMarkdown(sample.content);
      setTimelineTitle(sample.name);
      setFileName(`${sample.name}.md`);
      setCurrentTimelineId(null); // Reset ID as this is a new "file"
      setIsSampleDropdownOpen(false);
    }
  };

  const buildFallbackTimeline = (topic = 'AI Timeline') => {
    const year = new Date().getFullYear();
    return `# ${topic}

*${year - 2}-01-01*
### Kickoff
Initial milestone and context.

---

*${year - 1}-06-01*
### Midpoint
Key progress update and learnings.

---

*${year}-12-01*
### Wrap-up
Outcome, impact, and next steps.
`;
  };

  const normalizeAIMarkdown = (content, promptContext) => {
    let result = (content || '').trim();
    const topic = promptContext || timelineTitle || 'AI Timeline';

    if (!result.startsWith('#')) {
      result = `# ${topic}\n\n${result}`;
    }

    const eventBlocks = result.split('---').filter(block => block.trim() !== '');
    if (eventBlocks.length === 0) {
      return buildFallbackTimeline(topic);
    }

    return result;
  };

  const handleAIGenerate = (generatedContent, promptContext) => {
    const normalized = normalizeAIMarkdown(generatedContent, promptContext);
    setMarkdownContent(normalized);
    parseMarkdown(normalized);
    setFileName('AI Generated Timeline.md');
    setCurrentTimelineId(null); // Reset ID as this is a new "file"
  };

  const handleSelectTemplate = (template) => {
    setMarkdownContent(template.content);
    parseMarkdown(template.content);
    setTimelineTitle(template.name);
    setFileName(`${template.name}.md`);
    setCurrentTimelineId(null); // Reset ID as this is a new "file"
  };

  const fetchTimelines = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowSavedTimelines(true);
    setIsLoadingTimelines(true);

    try {
      const result = await listTimelinesByUser(user.id);
      setSavedTimelines(result.items);
    } catch (error) {
      console.error('Error fetching timelines:', error);
      // Don't alert 404s (collection empty/missing), just show empty list
      if (error.status !== 404) {
        alert('Failed to fetch timelines. Make sure the "timelines" collection exists.');
      }
    } finally {
      setIsLoadingTimelines(false);
    }
  }, [user]);

  const handleLoadTimeline = (record) => {
    setMarkdownContent(record.content);
    parseMarkdown(record.content);
    setTimelineTitle(record.title);
    setTimelineStyle(record.style || 'bauhaus');
    setCurrentTimelineId(record.id);
    // Load sharing state
    setCurrentSlug(record.slug || '');
    setIsPublic(record.public || false);
    setViewCount(record.viewCount || 0);
    setShowSavedTimelines(false);
  };

  const handleDeleteTimeline = async (id) => {
    try {
      await deleteTimelineApi(id);
      setSavedTimelines(savedTimelines.filter(t => t.id !== id));
      if (currentTimelineId === id) {
        setCurrentTimelineId(null);
      }
    } catch (error) {
      console.error('Error deleting timeline:', error);
      alert('Failed to delete timeline.');
    }
  };

  // Sharing Functions
  const handleShareClick = async () => {
    if (!currentTimelineId || !currentSlug) {
      const savedRecord = await handleSave();
      if (!savedRecord?.id) return;
    }
    setShowShareModal(true);
  };

  const handleTogglePublic = async () => {
    if (!currentTimelineId) return;

    setIsSaving(true);
    try {
      // Ensure we have a slug before making public
      let slugToUse = currentSlug;
      if (!slugToUse) {
        const baseSlug = slugify(timelineTitle || 'timeline');
        slugToUse = makeUniqueSlug(baseSlug);
        setCurrentSlug(slugToUse);
      }

      const newPublicStatus = !isPublic;
      const record = await updateTimeline(currentTimelineId, {
        public: newPublicStatus,
        slug: slugToUse,
        updated: new Date().toISOString(),
      });

      setIsPublic(newPublicStatus);
      if (typeof record.viewCount !== 'undefined') {
        setViewCount(record.viewCount);
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
      alert('Failed to update sharing settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format = exportFormat) => {
    if (!timelineRef.current || !format) return;

    const element = timelineRef.current;
    const filename = sanitizeFilename(timelineTitle);

    try {
      // Ensure all fonts are loaded before exporting
      await document.fonts.ready;

      if (format === 'svg') {
        // Add a temporary style to remove all borders and ensure fonts during export
        const style = document.createElement('style');
        style.innerHTML = `
          #timeline-container,
          #timeline-container *,
          #timeline-container *::before,
          #timeline-container *::after {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .font-cursive {
            font-family: 'Caveat', cursive !important;
          }
        `;
        document.head.appendChild(style);

        // SVG export with all styles embedded
        const dataUrl = await domtoimage.toSvg(element, {
          quality: 1,
          bgcolor: null,
          width: element.offsetWidth * 2,
          height: element.offsetHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left',
            width: element.offsetWidth + 'px',
            height: element.offsetHeight + 'px',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }
        });

        // Remove temporary style
        document.head.removeChild(style);

        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'png') {
        // Add a temporary style to remove all borders and ensure fonts during export
        const style = document.createElement('style');
        style.innerHTML = `
          #timeline-container,
          #timeline-container *,
          #timeline-container *::before,
          #timeline-container *::after {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .font-cursive {
            font-family: 'Caveat', cursive !important;
          }
        `;
        document.head.appendChild(style);

        // PNG export with transparent background
        const dataUrl = await domtoimage.toPng(element, {
          quality: 1,
          bgcolor: null,
          width: element.offsetWidth * 2,
          height: element.offsetHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left',
            width: element.offsetWidth + 'px',
            height: element.offsetHeight + 'px',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }
        });

        // Remove temporary style
        document.head.removeChild(style);

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'jpg') {
        // Add a temporary style to remove all borders and ensure fonts during export
        const style = document.createElement('style');
        style.innerHTML = `
          #timeline-container,
          #timeline-container *,
          #timeline-container *::before,
          #timeline-container *::after {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .font-cursive {
            font-family: 'Caveat', cursive !important;
          }
        `;
        document.head.appendChild(style);

        // JPG export with white background
        const dataUrl = await domtoimage.toJpeg(element, {
          quality: 1,
          bgcolor: '#ffffff',
          width: element.offsetWidth * 2,
          height: element.offsetHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left',
            width: element.offsetWidth + 'px',
            height: element.offsetHeight + 'px',
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          }
        });

        // Remove temporary style
        document.head.removeChild(style);

        const link = document.createElement('a');
        link.download = `${filename}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 mb-8 text-center border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
        <input
          value={timelineTitle}
          onChange={(e) => setTimelineTitle(e.target.value)}
          className="text-4xl font-black mb-4 font-display text-center bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg px-4 py-2 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] focus:outline-none focus:ring-4 focus:ring-yellow-300"
          aria-label="Timeline title"
        />
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Upload your Markdown file to generate a beautiful timeline.</p>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <label className="cursor-pointer">
            <div className={`${compactBtn('bg-blue-300')} w-auto px-4`}>
              <Upload size={18} />
              {fileName || 'Upload'}
            </div>
            <input type="file" accept=".md" onChange={handleFileSelect} className="hidden" />
          </label>

          <div className="relative" ref={sampleDropdownRef}>
            <button
              onClick={() => {
                setIsSampleDropdownOpen(!isSampleDropdownOpen);
                setIsExportDropdownOpen(false);
                setIsStyleDropdownOpen(false);
              }}
              style={{
                backgroundImage: `url("${arrowSvg}")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.2em'
              }}
              className="appearance-none inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 pl-6 pr-10 bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg cursor-pointer text-center min-w-[180px] justify-center"
            >
              <FileText size={20} />
              Load Sample
            </button>

            {isSampleDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                {sampleTimelines.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample.id)}
                    className="py-3 px-4 text-left font-bold text-black dark:text-white hover:bg-yellow-400 hover:text-black transition-colors"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-orange-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
          >
            <Layout size={20} />
            Templates
          </button>

          <button
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-purple-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
          >
            <Sparkles size={20} />
            Generate with AI
          </button>

          {user && (
            <>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-green-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg disabled:opacity-50"
                disabled={isSaving}
              >
                <Save size={20} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={fetchTimelines}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-cyan-200 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
              >
                <FolderOpen size={20} />
                Load Saved
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
                >
                  <ChevronDown className="rotate-90" size={20} />
                  Back
                </button>
              )}




            </>
          )}

          {events.length > 0 && (
            <>
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => {
                    setIsExportDropdownOpen(!isExportDropdownOpen);
                    setIsSampleDropdownOpen(false);
                    setIsStyleDropdownOpen(false);
                  }}
                  style={{
                    backgroundImage: `url("${arrowSvg}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.2em'
                  }}
                  className="appearance-none inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 pl-6 pr-10 bg-green-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg cursor-pointer text-center min-w-[180px] justify-center"
                >
                  <Download size={20} />
                  Export As...
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                    {[
                      { value: 'png', label: 'PNG (Transparent)' },
                      { value: 'jpg', label: 'JPG' },
                      { value: 'svg', label: 'SVG (Transparent)' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={async () => {
                          setExportFormat(option.value);
                          await handleExport(option.value);
                          setExportFormat('');
                          setIsExportDropdownOpen(false);
                        }}
                        className="py-3 px-4 text-left font-bold text-black dark:text-white hover:bg-green-400 hover:text-black transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowEditor(!showEditor)}
                className="inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 px-6 bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg"
              >
                <FileText size={20} />
                {showEditor ? 'Hide' : 'Show'} Editor
              </button>

              <div className="relative" ref={styleDropdownRef}>
                <button
                  onClick={() => {
                    setIsStyleDropdownOpen(!isStyleDropdownOpen);
                    setIsSampleDropdownOpen(false);
                    setIsExportDropdownOpen(false);
                  }}
                  style={{
                    backgroundImage: `url("${arrowSvg}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.2em'
                  }}
                  className="appearance-none inline-flex items-center gap-2 border-2 border-black dark:border-white font-bold py-3 pl-6 pr-10 bg-purple-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all rounded-lg cursor-pointer text-center min-w-[200px] justify-center"
                >
                  <Palette size={20} />
                  {timelineStyle === 'bauhaus' ? 'Bauhaus' :
                    timelineStyle === 'neo-brutalist' ? 'Neo-Brutalist' :
                      timelineStyle === 'corporate' ? 'Corporate' :
                        'Handwritten'}
                </button>

                {isStyleDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                    {[
                      { value: 'bauhaus', label: 'Bauhaus' },
                      { value: 'neo-brutalist', label: 'Neo-Brutalist' },
                      { value: 'corporate', label: 'Corporate' },
                      { value: 'handwritten', label: 'Handwritten' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimelineStyle(option.value);
                          setIsStyleDropdownOpen(false);
                        }}
                        className={`py-3 px-4 text-left font-bold hover:bg-purple-400 hover:text-black transition-colors ${timelineStyle === option.value ? 'bg-purple-200 dark:bg-purple-900' : 'text-black dark:text-white'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
      {
        showEditor && markdownContent && (
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
        )
      }

      {
        events.length > 0 && (
          <div
            id="timeline-container"
            ref={timelineRef}
            className={`relative max-w-3xl mx-auto p-8 ${timelineStyle === 'bauhaus' ? 'pl-10' : ''}`}
            style={{ backgroundColor: 'transparent' }}
          >
            {/* Timeline Title */}
            <input
              value={timelineTitle}
              onChange={(e) => setTimelineTitle(e.target.value)}
              className={`text-5xl font-black font-display mb-12 text-black dark:text-white tracking-tighter bg-transparent border-none focus:outline-none ${timelineStyle === 'bauhaus' ? 'text-left pl-16' : 'text-center'}`}
              aria-label="Timeline title"
            />

            {timelineStyle === 'bauhaus' ? (
              /* Bauhaus Style */
              <div className="relative">
                {/* Vertical Line - starts at center of first red dot (top-5 = 1.25rem = top-2 + half h-6) */}
                <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-black dark:bg-white"></div>

                {events.map((event, index) => (
                  <div key={index} className="relative mb-16 pl-16">
                    {/* Dot */}
                    <div className="absolute left-[-11px] top-2 w-6 h-6 bg-[#C41E3A] rounded-full z-10"></div>

                    {/* Content Container */}
                    <div className="flex flex-col gap-0">
                      {/* Date */}
                      {event.date && (
                        editingEvent?.index === index && editingEvent?.field === 'date' ? (
                          <input
                            type="text"
                            value={event.date}
                            onChange={(e) => handleEventUpdate(index, 'date', e.target.value)}
                            onBlur={() => setEditingEvent(null)}
                            autoFocus
                            className="text-4xl font-black font-display text-black dark:text-white mb-1 tracking-tighter bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <div
                            onClick={() => setEditingEvent({ index, field: 'date' })}
                            className="text-4xl font-black font-display text-black dark:text-white mb-1 tracking-tighter cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            {event.date}
                          </div>
                        )
                      )}

                      {/* Content Body */}
                      {editingEvent?.index === index && editingEvent?.field === 'content' ? (
                        <textarea
                          value={event.content.replace(/<[^>]*>/g, '')}
                          onChange={(e) => handleEventUpdate(index, 'content', e.target.value)}
                          onBlur={() => setEditingEvent(null)}
                          autoFocus
                          className="w-full min-h-[100px] markdown-content prose prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingEvent({ index, field: 'content' })}
                          className="markdown-content prose prose-invert max-w-none font-sans text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                          dangerouslySetInnerHTML={{ __html: event.content }}
                        />
                      )}
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
                      {/* Event Card */}
                      <div className={`${bgColor} border-4 border-black dark:border-white rounded-lg p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF]`}>
                        {/* Date */}
                        {event.date && (
                          editingEvent?.index === index && editingEvent?.field === 'date' ? (
                            <input
                              type="text"
                              value={event.date}
                              onChange={(e) => handleEventUpdate(index, 'date', e.target.value)}
                              onBlur={() => setEditingEvent(null)}
                              autoFocus
                              className="text-3xl font-black font-display text-black dark:text-white mb-3 tracking-tight bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                          ) : (
                            <div
                              onClick={() => setEditingEvent({ index, field: 'date' })}
                              className="text-3xl font-black font-display text-black dark:text-white mb-3 tracking-tight cursor-pointer hover:opacity-80 px-2 py-1 rounded transition-opacity"
                            >
                              {event.date}
                            </div>
                          )
                        )}

                        {/* Content Body */}
                        {editingEvent?.index === index && editingEvent?.field === 'content' ? (
                          <textarea
                            value={event.content.replace(/<[^>]*>/g, '')}
                            onChange={(e) => handleEventUpdate(index, 'content', e.target.value)}
                            onBlur={() => setEditingEvent(null)}
                            autoFocus
                            className="w-full min-h-[100px] markdown-content prose prose-lg max-w-none font-sans text-black dark:text-white font-medium bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        ) : (
                          <div
                            onClick={() => setEditingEvent({ index, field: 'content' })}
                            className="markdown-content prose prose-lg max-w-none font-sans text-black dark:text-white font-medium cursor-pointer hover:opacity-80 px-2 py-1 rounded transition-opacity"
                            dangerouslySetInnerHTML={{ __html: event.content }}
                          />
                        )}
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
                    <div key={index} className={`relative ${index > 0 ? 'mt-2' : ''}`}>
                      {/* Timeline dot - centered on card */}
                      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C41E3A] rounded-full transform -translate-x-1/2 z-20 ring-3 ring-white dark:ring-gray-800"></div>

                      {/* Connecting line from dot to card */}
                      <div className={`absolute top-1/2 -translate-y-1/2 h-px bg-black dark:bg-gray-400 z-10 ${isLeft ? 'left-[48%] w-[2%]' : 'left-[50%] w-[2%]'}`}></div>

                      {/* Event card - alternating sides */}
                      <div className={`relative ${isLeft ? 'pr-[52%]' : 'pl-[52%]'}`}>
                        <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] transition-all duration-300 relative ${isLeft ? 'text-right' : ''}`} style={{ zIndex: index }}>
                          {/* Content */}
                          {editingEvent?.index === index && editingEvent?.field === 'content' ? (
                            <textarea
                              value={event.content.replace(/<[^>]*>/g, '')}
                              onChange={(e) => handleEventUpdate(index, 'content', e.target.value)}
                              onBlur={() => setEditingEvent(null)}
                              autoFocus
                              className="w-full min-h-[80px] markdown-content prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                          ) : (
                            <div
                              onClick={() => setEditingEvent({ index, field: 'content' })}
                              className="markdown-content prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&>*]:my-1 cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                              dangerouslySetInnerHTML={{ __html: event.content }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Date - Positioned on the opposite side */}
                      <div className={`absolute top-1/2 -translate-y-1/2 w-[45%] ${isLeft ? 'left-[52%] text-left' : 'right-[52%] text-right'}`}>
                        {event.date && (
                          editingEvent?.index === index && editingEvent?.field === 'date' ? (
                            <input
                              type="text"
                              value={event.date}
                              onChange={(e) => handleEventUpdate(index, 'date', e.target.value)}
                              onBlur={() => setEditingEvent(null)}
                              autoFocus
                              className="font-black text-2xl text-black dark:text-white tracking-tight bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full"
                            />
                          ) : (
                            <div
                              onClick={() => setEditingEvent({ index, field: 'date' })}
                              className="font-black text-2xl text-black dark:text-white tracking-tight cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                            >
                              {event.date}
                            </div>
                          )
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

                {events.map((event, index) => (
                  <div key={index} className="relative mb-6 pl-40">
                    {/* Date - positioned on left side of vertical line */}
                    {event.date && (
                      editingEvent?.index === index && editingEvent?.field === 'date' ? (
                        <input
                          type="text"
                          value={event.date}
                          onChange={(e) => handleEventUpdate(index, 'date', e.target.value)}
                          onBlur={() => setEditingEvent(null)}
                          autoFocus
                          className="absolute left-0 top-[1.6rem] w-28 text-right pr-4 text-2xl font-handwritten text-slate-600 dark:text-slate-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingEvent({ index, field: 'date' })}
                          className="absolute left-0 top-[1.6rem] w-28 text-right pr-4 text-2xl font-handwritten text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          {event.date}
                        </div>
                      )
                    )}

                    {/* Dot */}
                    <div className="absolute left-[7.3rem] top-8 w-3 h-3 bg-slate-600 dark:bg-slate-500 rounded-full z-10 ring-4 ring-white dark:ring-gray-800"></div>

                    {/* Content Container - positioned above dot */}
                    <div className="flex flex-col gap-0">

                      {/* Event Title - using purple color from old label */}
                      {editingEvent?.index === index && editingEvent?.field === 'content' ? (
                        <textarea
                          value={event.content.replace(/<[^>]*>/g, '')}
                          onChange={(e) => handleEventUpdate(index, 'content', e.target.value)}
                          onBlur={() => setEditingEvent(null)}
                          autoFocus
                          className="w-full min-h-[100px] font-body text-slate-700 dark:text-slate-300 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingEvent({ index, field: 'content' })}
                          className="font-handwritten text-4xl text-slate-700 dark:text-slate-300 leading-tight cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          {event.content.replace(/<[^>]*>/g, '').split('\n')[0] || 'Event'}
                        </div>
                      )}

                      {/* Event Description */}
                      {!(editingEvent?.index === index && editingEvent?.field === 'content') && event.content.replace(/<[^>]*>/g, '').split('\n').slice(1).join('\n').trim() && (
                        <div
                          onClick={() => setEditingEvent({ index, field: 'content' })}
                          className="font-body text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          {event.content.replace(/<[^>]*>/g, '').split('\n').slice(1).join('\n')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )
      }

      {/* Bottom Share Button */}
      {events.length > 0 && (
        <div className="max-w-3xl mx-auto px-8 pb-12 flex justify-center">
          <button
            onClick={handleShareClick}
            className="inline-flex items-center gap-3 border-4 border-black dark:border-white font-black text-xl py-4 px-8 bg-cyan-400 text-black shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_#000] dark:hover:shadow-[12px_12px_0px_#FFF] transition-all rounded-xl transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            <Share2 size={28} />
            Share Timeline
          </button>
        </div>
      )}

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // If we were trying to save, save now? Or just let user click again.
          }}
        />
      )}

      {showSavedTimelines && (
        <SavedTimelinesModal
          timelines={savedTimelines}
          onClose={() => setShowSavedTimelines(false)}
          onLoad={handleLoadTimeline}
          onDelete={handleDeleteTimeline}
          loading={isLoadingTimelines}
        />
      )}

      {showAIModal && (
        <AIGenerateModal
          onClose={() => setShowAIModal(false)}
          onGenerate={handleAIGenerate}
        />
      )}

      {showTemplatesModal && (
        <TemplatesModal
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          isPublic={isPublic}
          onTogglePublic={handleTogglePublic}
          shareUrl={buildShareUrl({
            slug: currentSlug || undefined,
            id: currentTimelineId || undefined,
            style: timelineStyle || undefined,
          })}
          viewCount={viewCount}
          isSaving={isSaving}
        />
      )}
    </div >
  );
};

export default TimelineGenerator;
