import React, { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { Upload, Download, FileText, Palette, Save, FolderOpen, ChevronDown, Sparkles, Layout, Share2, Loader, AlertTriangle, Plus, Image, Type, Monitor, X, Menu, ChevronLeft } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
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
import { getPocketBaseErrorMessage, formatPocketBaseValidationErrors } from '../lib/pocketbaseError';

const TimelineGenerator = ({ isDemoMode = false, initialTimeline = null, onBack = null }) => {
  const [events, setEvents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('My Project Timeline');
  const [timelineStyle, setTimelineStyle] = useState('bauhaus');
  const [exportFormat, setExportFormat] = useState('');
  const timelineRef = useRef(null);
  
  // Unified Menu State
  const [activeMenu, setActiveMenu] = useState(null); // 'file', 'insert', 'style', 'export'
  const menuRef = useRef(null);
  
  const [editingEvent, setEditingEvent] = useState(null); // { index, field: 'date' | 'content' }
  const [hasLoadedDemo, setHasLoadedDemo] = useState(false);

  // Auth & Persistence
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedTimelines, setShowSavedTimelines] = useState(false);
  const [savedTimelines, setSavedTimelines] = useState([]);
  const [currentTimelineId, setCurrentTimelineId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingTimelines, setIsLoadingTimelines] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  // Dirty state for unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // Toast
  const { showToast } = useToast();

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [currentSlug, setCurrentSlug] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [warning, setWarning] = useState('');

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Parse markdown to extract events only (without changing title)
  const parseMarkdownEvents = useCallback((markdownContent) => {
    if (import.meta.env.DEV) console.log('parseMarkdownEvents called with content length:', markdownContent?.length);
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
    if (import.meta.env.DEV) console.log('Found raw events:', rawEvents.length);

    const parsedEvents = rawEvents.map((eventMarkdown) => {
      const lines = eventMarkdown.split('\n');
      let date = '';
      let contentLines = lines;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;
        const match = trimmed.match(/^\*(.*?)\*$/);
        if (match) {
          date = match[1].trim();
          contentLines = [...lines.slice(0, i), ...lines.slice(i + 1)];
        }
        break;
      }

      const htmlContent = marked.parse(contentLines.join('\n').trim());
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

    if (import.meta.env.DEV) console.log('Setting events:', sortedEvents.length);
    setEvents(sortedEvents);
  }, []);

  // Load initial timeline if provided
  useEffect(() => {
    if (import.meta.env.DEV) console.log('initialTimeline changed:', initialTimeline);
    if (initialTimeline) {
      const content = initialTimeline.content || '';
      if (import.meta.env.DEV) console.log('Loading timeline:', initialTimeline.title, 'Content length:', content.length);

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
        if (import.meta.env.DEV) console.log('Parsing events from content');
        parseMarkdownEvents(content);
      } else {
        if (import.meta.env.DEV) console.log('No content to parse');
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

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle back navigation with unsaved changes
  const handleBack = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    if (onBack) onBack();
  };

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
      setIsDirty(true);
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
      const lines = eventMarkdown.split('\n');
      let date = '';
      let contentLines = lines;

      // Treat the first non-empty line as the date only if it is a standalone `*...*` line.
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;
        const match = trimmed.match(/^\*(.*?)\*$/);
        if (match) {
          date = match[1].trim();
          contentLines = [...lines.slice(0, i), ...lines.slice(i + 1)];
        }
        break;
      }

      const htmlContent = marked.parse(contentLines.join('\n').trim());
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
    setIsDirty(true);
  };

  const handleMarkdownChange = (e) => {
    const content = e.target.value;
    setMarkdownContent(content);
    parseMarkdown(content);
    setIsDirty(true);
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
    if (!user?.id) {
      setWarning('Session expired. Please log in again.');
      setShowAuthModal(true);
      return null;
    }

    if (!markdownContent) return null;

    setIsSaving(true);
    let record = null;
    try {
    let baseTitle = (timelineTitle || '').trim() || 'Untitled Timeline';
    if (baseTitle !== timelineTitle) {
      setTimelineTitle(baseTitle);
    }

    const data = {
      user: String(user.id), // Ensure string
      title: baseTitle,
      content: markdownContent,
      style: timelineStyle,
    };

      // Ensure every saved timeline has a slug, even for older records
      let slugToUse = currentSlug;
      if (!slugToUse) {
        const baseSlug = slugify(baseTitle || "timeline");
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

      // Enforce unique title: block save and ask for a new title if it already exists
      const existingByTitle = await findTimelineByTitle(user.id, baseTitle);
      if (existingByTitle?.id && existingByTitle.id !== currentTimelineId) {
        setWarning('Title already exists. Please choose a different title.');
        setIsSaving(false);
        return null;
      }

      console.log('Saving timeline payload:', JSON.stringify(data));

      try {
        if (currentTimelineId) {
          record = await updateTimeline(currentTimelineId, data);
        } else {
          record = await createTimeline(data);
          setCurrentTimelineId(record.id);
        }
      } catch (err) {
        // Fallback: If 400 Bad Request on create, try minimal payload (ignoring extra fields like slug/style)
        if (!currentTimelineId && err.status === 400) {
           console.warn('First save attempt failed with 400, attempting minimal payload fallback...');
           const minimal = {
             user: String(user.id),
             title: baseTitle,
             content: markdownContent
           };
           // This will throw if it fails, which is caught by the outer catch
           record = await createTimeline(minimal);
           setCurrentTimelineId(record.id);
           showToast({ type: 'warning', message: 'Saved (some settings reset due to error)' });
        } else {
           throw err;
        }
      }

      // Update state with saved data
      if (record.slug) setCurrentSlug(record.slug);
      if (typeof record.public !== 'undefined') setIsPublic(record.public);
      if (typeof record.viewCount !== 'undefined') setViewCount(record.viewCount);

      showToast({ type: 'success', message: 'Timeline saved successfully!' });
      setIsDirty(false);
      setWarning('');
    } catch (error) {
      console.error('Error saving timeline:', error);
      const statusHint = error?.status ? `Status: ${error.status}. ` : '';
      const msg = getPocketBaseErrorMessage(error);
      const validationErrors = formatPocketBaseValidationErrors(error);
      
      let details = validationErrors ? ` (${validationErrors})` : '';
      // Debug: If 400 with no validation, show raw data to help debug
      if (error?.status === 400 && !validationErrors && error?.response?.data) {
         try {
           const raw = JSON.stringify(error.response.data);
           if (raw !== '{}') details = ` (Debug: ${raw})`;
         } catch (e) { /* ignore */ }
      }

      showToast({ type: 'error', message: `Failed to save: ${msg}` });
      setWarning(`Failed to save timeline: ${statusHint}${msg}${details}`);
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
      setActiveMenu(null);
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
    setIsDirty(true);
  };

  const handleSelectTemplate = (template) => {
    setMarkdownContent(template.content);
    parseMarkdown(template.content);
    setTimelineTitle(template.name);
    setFileName(`${template.name}.md`);
    setCurrentTimelineId(null); // Reset ID as this is a new "file"
    setIsDirty(true);
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
        showToast({ type: 'error', message: 'Failed to fetch timelines' });
      }
    } finally {
      setIsLoadingTimelines(false);
    }
  }, [user, showToast]);

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
    setIsDirty(false);
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
      showToast({ type: 'error', message: 'Failed to delete timeline' });
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
      });

      setIsPublic(newPublicStatus);
      if (typeof record.viewCount !== 'undefined') {
        setViewCount(record.viewCount);
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
      showToast({ type: 'error', message: 'Failed to update sharing settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format = exportFormat) => {
    if (!timelineRef.current || !format) return;

    const element = timelineRef.current;
    const filename = sanitizeFilename(timelineTitle);
    
    setIsExporting(true);

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
      
      showToast({ type: 'success', message: `Exported ${filename}.${format}` });
    } catch (error) {
      console.error('Export failed:', error);
      showToast({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const ToolbarButton = ({ icon: Icon, label, onClick, isActive, color = "bg-white dark:bg-gray-800" }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 text-sm font-bold border-2 border-black dark:border-white rounded-md transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black' : `${color} text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700`}`}
      title={label}
    >
      <Icon size={16} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  const isBauhausStyle = timelineStyle === 'bauhaus' || timelineStyle === 'bauhaus-mono';
  const isBauhausMono = timelineStyle === 'bauhaus-mono';

  return (
    <div className="max-w-6xl mx-auto">
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] flex flex-col items-center">
            <Loader className="animate-spin mb-3 text-black dark:text-white" size={32} />
            <p className="font-bold text-black dark:text-white">Exporting {exportFormat ? exportFormat.toUpperCase() : 'Image'}...</p>
          </div>
        </div>
      )}
      
      {/* Warning Toast */}
      {warning && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-right">
          <div className="p-4 border-4 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 rounded-xl shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#FFF] flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5" />
            <div className="text-sm font-bold leading-snug">
              {warning}
              <button onClick={() => setWarning('')} className="ml-2 underline text-xs text-yellow-800 dark:text-yellow-200">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b-4 border-black dark:border-white mb-6 pb-2 pt-1 -mx-4 px-4 shadow-sm transition-all">
        <div className="flex flex-col gap-3">
          
          {/* Top Row: Navigation & Title */}
          <div className="flex items-center justify-between gap-3">
             <div className="flex items-center gap-2 flex-1 min-w-0">
                {onBack && (
                  <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <input
                  value={timelineTitle}
                  onChange={(e) => {
                    setTimelineTitle(e.target.value);
                    if (warning) setWarning('');
                  }}
                  className="text-xl font-black font-display bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none w-full flex-1 min-w-0 px-1"
                  aria-label="Timeline title"
                />
                 {isDirty && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Unsaved changes" />
                  )}
             </div>
             
             <div className="flex items-center gap-2" />
          </div>

          {/* Bottom Row: Editor Tools */}
          <div className="flex items-center justify-between gap-2 flex-wrap" ref={menuRef}>
            <div className="flex items-center gap-2">
              
              {/* File Menu */}
              <div className="relative">
                <ToolbarButton icon={FolderOpen} label="File" onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')} isActive={activeMenu === 'file'} />
                {activeMenu === 'file' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                    <label className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer font-bold">
                       <Upload size={16} /> Upload MD
                       <input type="file" accept=".md" onChange={handleFileSelect} className="hidden" />
                    </label>
                    <button onClick={() => { setActiveMenu('samples'); }} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-bold">
                       <FileText size={16} /> Load Sample
                    </button>
                    {user && (
                      <button onClick={fetchTimelines} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-bold">
                         <FolderOpen size={16} /> Open Saved
                      </button>
                    )}
                  </div>
                )}
                {/* Nested Samples Menu */}
                 {activeMenu === 'samples' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                    <button onClick={() => setActiveMenu('file')} className="px-4 py-2 text-xs text-gray-500 uppercase font-bold border-b border-gray-100 dark:border-gray-700">← Back</button>
                    {sampleTimelines.map(sample => (
                      <button key={sample.id} onClick={() => handleLoadSample(sample.id)} className="px-4 py-3 hover:bg-yellow-400 hover:text-black text-left font-bold transition-colors">
                        {sample.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Insert Menu */}
              <div className="relative">
                 <ToolbarButton icon={Plus} label="Insert" onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')} isActive={activeMenu === 'insert'} />
                 {activeMenu === 'insert' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                    <button onClick={() => { setShowAIModal(true); setActiveMenu(null); }} className="flex items-center gap-2 px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left font-bold text-purple-600 dark:text-purple-400">
                       <Sparkles size={16} /> Generate with AI
                    </button>
                    <button onClick={() => { setShowTemplatesModal(true); setActiveMenu(null); }} className="flex items-center gap-2 px-4 py-3 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-left font-bold text-orange-600 dark:text-orange-400">
                       <Layout size={16} /> Use Template
                    </button>
                  </div>
                 )}
              </div>
            </div>

            <div className="flex items-center gap-2">
               {/* Style Dropdown */}
               <div className="relative">
                 <ToolbarButton icon={Palette} label="Style" onClick={() => setActiveMenu(activeMenu === 'style' ? null : 'style')} isActive={activeMenu === 'style'} />
                 {activeMenu === 'style' && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col">
                     {[
                      { value: 'bauhaus', label: 'Bauhaus' },
                      { value: 'bauhaus-mono', label: 'Bauhaus Mono' },
                      { value: 'neo-brutalist', label: 'Neo-Brutalist' },
                      { value: 'corporate', label: 'Corporate' },
                      { value: 'handwritten', label: 'Handwritten' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setTimelineStyle(option.value); setActiveMenu(null); }}
                        className={`px-4 py-3 text-left font-bold hover:bg-gray-100 dark:hover:bg-gray-700 ${timelineStyle === option.value ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                 )}
               </div>

               <ToolbarButton 
                 icon={showEditor ? Monitor : FileText} 
                 label={showEditor ? "Preview" : "Editor"} 
                 onClick={() => setShowEditor(!showEditor)} 
                 isActive={showEditor}
                 color="bg-yellow-100 dark:bg-yellow-900/20"
               />

               {user && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-400 text-black font-bold border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 text-sm"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
               )}
               <button
                  onClick={() => setActiveMenu(activeMenu === 'export' ? null : 'export')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] transition-all relative text-sm"
               >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
               </button>
            </div>
          </div>
          
           {/* Export Menu (Positioned Absolute to avoid overflow clip in flex container if needed, but relative works usually) */}
           {activeMenu === 'export' && (
              <div className="absolute top-[80px] right-4 w-48 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] rounded-lg overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                 {[
                      { value: 'png', label: 'PNG Image', icon: Image },
                      { value: 'jpg', label: 'JPG Image', icon: Image },
                      { value: 'svg', label: 'SVG Vector', icon: Type }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={async () => {
                        setExportFormat(option.value);
                        setActiveMenu(null);
                        await handleExport(option.value);
                        setExportFormat('');
                      }}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-green-100 dark:hover:bg-green-900/30 text-left font-bold"
                    >
                      <option.icon size={16} /> {option.label}
                    </button>
                  ))}
                  <button onClick={handleDownloadMarkdown} className="flex items-center gap-2 px-4 py-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left font-bold border-t border-gray-100 dark:border-gray-700">
                     <FileText size={16} /> Download MD
                  </button>
              </div>
           )}

        </div>
      </div>

      {/* Markdown Editor Panel */}
      {
        showEditor && markdownContent && (
          <div className="bg-white dark:bg-gray-800 p-4 mb-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg animate-in slide-in-from-top-4">
            <textarea
              value={markdownContent}
              onChange={handleMarkdownChange}
              className="w-full h-96 p-4 font-mono text-sm border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 resize-y"
              placeholder="Enter your markdown here..."
            />
            <p className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
              Live Preview Below
            </p>
          </div>
        )
      }

      {/* Empty State / Upload Prompt */}
      {events.length === 0 && !markdownContent && (
         <div className="text-center py-20 border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">No timeline content yet</h3>
            <p className="text-gray-400 mb-6">Use the Insert menu to create or upload content</p>
            <button onClick={() => setActiveMenu('insert')} className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg shadow-lg hover:bg-purple-600 transition-colors">
               Get Started
            </button>
         </div>
      )}

      {/* Timeline Render Area */}
      {
        events.length > 0 && (
          <div
            id="timeline-container"
            ref={timelineRef}
            className={`relative max-w-3xl mx-auto p-8 ${isBauhausStyle ? 'pl-10' : ''}`}
            style={{ backgroundColor: 'transparent' }}
          >
            {/* Timeline Title (Hidden in export mostly, but useful context) */}
            <h1 className={`text-5xl font-black mb-12 text-black dark:text-white tracking-tighter ${isBauhausStyle ? 'text-left pl-16' : 'text-center'} ${isBauhausMono ? 'font-doto' : 'font-display'}`}>
              {timelineTitle}
            </h1>

            {isBauhausStyle ? (
              /* Bauhaus Style */
              <div className="relative">
                {/* Vertical Line - starts at center of first red dot (top-5 = 1.25rem = top-2 + half h-6) */}
                <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-black dark:bg-white"></div>

                {events.map((event, index) => (
                  <div key={index} className="relative mb-10 pl-16">
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
                            className={`text-4xl font-black text-black dark:text-white mb-1 tracking-tighter bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${isBauhausMono ? 'font-doto' : 'font-display'}`}
                          />
                        ) : (
                          <div
                            onClick={() => setEditingEvent({ index, field: 'date' })}
                            className={`text-4xl font-black text-black dark:text-white mb-1 tracking-tighter cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors ${isBauhausMono ? 'font-doto' : 'font-display'}`}
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
                          className={`w-full min-h-[100px] markdown-content prose prose-invert max-w-none text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${isBauhausMono ? 'font-vt323' : 'font-sans'}`}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingEvent({ index, field: 'content' })}
                          className={`markdown-content prose prose-invert max-w-none text-lg font-medium uppercase tracking-wide text-gray-800 dark:text-gray-200 leading-snug cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors ${isBauhausMono ? 'font-vt323' : 'font-sans'}`}
                          dangerouslySetInnerHTML={{ __html: event.content }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : timelineStyle === 'neo-brutalist' ? (
              /* Neo-Brutalist Style */
              <div className="flex flex-col gap-4">
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
              <div className="relative font-cursive">
                {/* Center vertical line - hand drawn look */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-black dark:bg-gray-500 transform -translate-x-1/2 opacity-70" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)' }}></div>
                
                {events.map((event, index) => (
                    <div key={index} className="relative mb-6">
                       {/* Date - alternating sides */}
                       <div className={`absolute top-0 w-1/3 text-2xl font-bold ${index % 2 === 0 ? 'left-[10%] text-right' : 'right-[10%] text-left'}`} style={{ fontFamily: 'Caveat, cursive' }}>
                          {event.date}
                       </div>
                       
                       {/* Node on line */}
                       <div className="w-4 h-4 bg-black rounded-full border-2 border-white mx-auto z-10 relative mb-4"></div>

                       {/* Content Box */}
                       <div className={`w-2/3 mx-auto border-2 border-black p-4 rounded-lg bg-white dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] transform ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                          {editingEvent?.index === index && editingEvent?.field === 'content' ? (
                            <textarea
                              value={event.content.replace(/<[^>]*>/g, '')}
                              onChange={(e) => handleEventUpdate(index, 'content', e.target.value)}
                              onBlur={() => setEditingEvent(null)}
                              autoFocus
                              className="w-full min-h-[80px] font-cursive text-xl bg-transparent focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => setEditingEvent({ index, field: 'content' })}
                              className="font-cursive text-xl markdown-content"
                              dangerouslySetInnerHTML={{ __html: event.content }}
                            />
                          )}
                       </div>
                    </div>
                ))}
              </div>
            ) : null}
          </div>
        )
      }

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (activeMenu === 'file') fetchTimelines(); // Refresh saved if auth successful
          }}
        />
      )}

      {showSavedTimelines && (
        <SavedTimelinesModal
          timelines={savedTimelines}
          onClose={() => setShowSavedTimelines(false)}
          onLoad={handleLoadTimeline}
          onDelete={handleDeleteTimeline}
          isLoading={isLoadingTimelines}
        />
      )}

      {showAIModal && (
        <AIGenerateModal
          onClose={() => setShowAIModal(false)}
          onGenerate={(content, prompt) => {
            handleAIGenerate(content, prompt);
            setShowAIModal(false);
          }}
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
          onClose={() => setShowShareModal(false)}
          title={timelineTitle}
          slug={currentSlug}
          isPublic={isPublic}
          viewCount={viewCount}
          onTogglePublic={handleTogglePublic}
        />
      )}
    </div>
  );
};

export default TimelineGenerator;
