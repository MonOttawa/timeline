import React, { useMemo, useState } from 'react';
import type { PoemMetadata } from '../poemsLibrary';
import type { RemotePoemRecord } from '../services/poemRepository';
import { countWords } from '../utils/poemValidation';

type SeedStatus = 'idle' | 'pending' | 'success' | 'error';

interface PoemSeederModalProps {
  onClose: () => void;
  libraryPoems: PoemMetadata[];
  remotePoems: RemotePoemRecord[];
  onSeedPoem: (poem: PoemMetadata) => Promise<void>;
  onRefresh: () => Promise<RemotePoemRecord[]>;
  onUpdateMetadata: (recordId: string, updates: {
    status: RemotePoemRecord['status'];
    featured: boolean;
    hidden: boolean;
    curated: boolean;
    license: string;
    source: string;
    sourceUrl: string;
    wordCount?: number;
  }) => Promise<void>;
  onAddPoem?: () => void;
  isRefreshing: boolean;
  loadError?: string | null;
}

const difficultyBadge = (difficulty: PoemMetadata['difficulty']) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200';
    case 'intermediate':
      return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200';
    case 'advanced':
      return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200';
    default:
      return 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const PoemSeederModal: React.FC<PoemSeederModalProps> = ({
  onClose,
  libraryPoems,
  remotePoems,
  onSeedPoem,
  onRefresh,
  onUpdateMetadata,
  onAddPoem,
  isRefreshing,
  loadError,
}) => {
  const [seedStatuses, setSeedStatuses] = useState<Record<string, SeedStatus>>({});
  const [seedErrors, setSeedErrors] = useState<Record<string, string>>({});
  const [isSeedingAll, setIsSeedingAll] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RemotePoemRecord | null>(null);
  const [metadataDraft, setMetadataDraft] = useState({
    status: 'published' as RemotePoemRecord['status'],
    featured: false,
    hidden: false,
    curated: false,
    license: '',
    source: '',
    sourceUrl: '',
  });
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [promotingRecordId, setPromotingRecordId] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [difficultySortAsc, setDifficultySortAsc] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | RemotePoemRecord['status']>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const baseLibraryIds = useMemo(() => new Set(libraryPoems.map(poem => poem.id)), [libraryPoems]);

  const remoteMap = useMemo(() => {
    const map = new Map<string, RemotePoemRecord>();
    remotePoems.forEach((entry) => {
      map.set(entry.poem.id, entry);
    });
    return map;
  }, [remotePoems]);

  const catalogPoems = useMemo(() => {
    const extras = remotePoems
      .filter(entry => (entry.curated || (entry.status === 'published' && !entry.hidden)) && !baseLibraryIds.has(entry.poem.id))
      .map(entry => entry.poem);
    const combined = [...libraryPoems, ...extras];
    const unique = new Map<string, PoemMetadata>();
    combined.forEach(poem => {
      if (!unique.has(poem.id)) {
        unique.set(poem.id, poem);
      }
    });
    return Array.from(unique.values());
  }, [libraryPoems, remotePoems, baseLibraryIds]);

  const difficultyOrder: Record<string, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  const displayPoems = useMemo(() => {
    let list = [...catalogPoems];
    if (statusFilter !== 'all') {
      list = list.filter(poem => remoteMap.get(poem.id)?.status === statusFilter);
    }
    if (!showHidden) {
      list = list.filter(poem => !remoteMap.get(poem.id)?.hidden);
    }
    if (difficultySortAsc !== null) {
      list.sort((a, b) => {
        const aScore = difficultyOrder[a.difficulty ?? ''] ?? 99;
        const bScore = difficultyOrder[b.difficulty ?? ''] ?? 99;
        return difficultySortAsc ? aScore - bScore : bScore - aScore;
      });
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [catalogPoems, difficultySortAsc, statusFilter, showHidden, remoteMap]);

  const remoteIds = useMemo(() => new Set(remoteMap.keys()), [remoteMap]);
  const missingPoems = useMemo(
    () => displayPoems.filter((poem) => !remoteIds.has(poem.id)),
    [displayPoems, remoteIds]
  );

  const getStatus = (poemId: string): SeedStatus => {
    if (remoteIds.has(poemId)) return 'success';
    return seedStatuses[poemId] ?? 'idle';
  };

  const handleSeed = async (poem: PoemMetadata) => {
    const status = getStatus(poem.id);
    if (status === 'success' || status === 'pending') return;
    setSeedStatuses((prev) => ({ ...prev, [poem.id]: 'pending' }));
    setSeedErrors((prev) => ({ ...prev, [poem.id]: '' }));
    try {
      await onSeedPoem(poem);
      setSeedStatuses((prev) => {
        const next = { ...prev };
        delete next[poem.id];
        return next;
      });
      setSeedErrors((prev) => {
        const next = { ...prev };
        delete next[poem.id];
        return next;
      });
    } catch (error: any) {
      const message =
        typeof error?.message === 'string'
          ? error.message
          : 'Failed to seed poem. Check the console for details.';
      setSeedStatuses((prev) => ({ ...prev, [poem.id]: 'error' }));
      setSeedErrors((prev) => ({ ...prev, [poem.id]: message }));
    }
  };

  const handleSeedAll = async () => {
    if (missingPoems.length === 0 || isSeedingAll || isRefreshing) return;
    setIsSeedingAll(true);
    for (const poem of missingPoems) {
      await handleSeed(poem);
    }
    setIsSeedingAll(false);
  };

  const catalogIds = useMemo(() => new Set(displayPoems.map(poem => poem.id)), [displayPoems]);

  const remoteOnlyEntries = useMemo(
    () => remotePoems.filter((entry) => !catalogIds.has(entry.poem.id)),
    [remotePoems, catalogIds]
  );

  const seededPoems = useMemo(
    () => displayPoems.filter((poem) => remoteIds.has(poem.id)),
    [displayPoems, remoteIds]
  );

  const summaryStats = useMemo(() => {
    const totalWords = displayPoems.reduce((acc, poem) => acc + countWords(poem.text), 0);
    const seededWords = seededPoems.reduce((acc, poem) => acc + countWords(poem.text), 0);
    return {
      totalWords,
      seededWords,
    };
  }, [displayPoems, seededPoems]);

  const beginEditing = (entry: RemotePoemRecord) => {
    setEditingRecord(entry);
    setMetadataDraft({
      status: entry.status,
      featured: entry.featured,
      hidden: entry.hidden,
      curated: entry.curated,
      license: entry.license ?? '',
      source: entry.source ?? '',
      sourceUrl: entry.sourceUrl ?? '',
    });
    setMetadataError(null);
    setTimeout(() => {
      const editor = document.getElementById(`metadata-editor-${entry.recordId}`);
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusable = editor.querySelector('select, input');
        if (focusable instanceof HTMLElement) {
          focusable.focus();
        }
      }
    }, 60);
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setMetadataError(null);
  };

  const saveMetadata = async () => {
    if (!editingRecord) return;
    setIsSavingMeta(true);
    setMetadataError(null);
    try {
      const nextWordCount = countWords(editingRecord.poem.text);
      await onUpdateMetadata(editingRecord.recordId, {
        status: metadataDraft.status,
        featured: metadataDraft.featured,
        hidden: metadataDraft.hidden,
        curated: metadataDraft.curated,
        license: metadataDraft.license.trim(),
        source: metadataDraft.source.trim(),
        sourceUrl: metadataDraft.sourceUrl.trim(),
        wordCount: nextWordCount,
      });
      cancelEditing();
    } catch (error: any) {
      const message =
        typeof error?.message === 'string'
          ? error.message
          : 'Failed to update poem metadata. Please try again.';
      setMetadataError(message);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleJsonImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setIsImportingJson(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate that it's an array
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of poems');
      }

      // Validate each poem has required fields
      for (let i = 0; i < data.length; i++) {
        const poem = data[i];
        if (!poem.poemId || !poem.title || !poem.author || !poem.text || !poem.difficulty) {
          throw new Error(`Poem at index ${i} is missing required fields (poemId, title, author, text, difficulty)`);
        }
      }

      setImportProgress({ current: 0, total: data.length });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const poemData = data[i];
        setImportProgress({ current: i + 1, total: data.length });

        try {
          // Check if poem already exists
          const existing = remoteIds.has(poemData.poemId);
          if (existing) {
            console.log(`Skipping "${poemData.title}" - already exists`);
            successCount++;
            continue;
          }

          // Convert to PoemMetadata format
          const poem: PoemMetadata = {
            id: poemData.poemId,
            title: poemData.title,
            author: poemData.author,
            text: poemData.text,
            difficulty: poemData.difficulty,
            category: poemData.category,
            license: poemData.license,
            source: poemData.source,
            sourceUrl: poemData.sourceUrl,
            wordCount: poemData.wordCount,
            status: poemData.status,
            featured: poemData.featured,
            hidden: poemData.hidden,
            curated: poemData.curated,
            isCustom: poemData.isCustom,
          };

          await onSeedPoem(poem);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const message = error?.message || 'Unknown error';
          errors.push(`"${poemData.title}": ${message}`);
          console.error(`Failed to import "${poemData.title}":`, error);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (errorCount > 0) {
        setImportError(`Imported ${successCount} poems, but ${errorCount} failed:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`);
      } else {
        setImportError(null);
      }

      // Refresh the list
      await onRefresh();

    } catch (error: any) {
      const message = error?.message || 'Failed to parse JSON file';
      setImportError(message);
      console.error('JSON import error:', error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImportingJson(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const promoteRemotePoem = async (entry: RemotePoemRecord) => {
    if (!entry.license || entry.license.trim().length === 0) {
      setPromoteError('Cannot promote without a license/rights note.');
      return;
    }

    setPromoteError(null);
    setPromotingRecordId(entry.recordId);
    try {
      await onUpdateMetadata(entry.recordId, {
        status: 'published',
        featured: entry.featured,
        hidden: false,
        curated: true,
        license: entry.license ?? '',
        source: entry.source ?? '',
        sourceUrl: entry.sourceUrl ?? '',
        wordCount: countWords(entry.poem.text),
      });
      await onRefresh();
      const card = document.getElementById(`remote-only-${entry.recordId}`);
      if (card) {
        card.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-6px)', opacity: 0 },
          ],
          { duration: 180, easing: 'ease-in' }
        ).onfinish = () => {
          card.style.display = 'none';
        };
      }
      setTimeout(() => {
        const heading = document.getElementById('remote-only-heading');
        if (heading) {
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    } catch (error: any) {
      const message =
        typeof error?.message === 'string'
          ? error.message
          : 'Failed to promote poem. Please try again.';
      setPromoteError(message);
    } finally {
      setPromotingRecordId(null);
    }
  };

  const renderMetadataEditor = (entry: RemotePoemRecord, context: 'table' | 'card') => {
    if (editingRecord?.recordId !== entry.recordId) return null;

    const body = (
      <div className="border-2 border-black dark:border-white rounded-xl p-4 bg-white dark:bg-gray-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#FFF]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-black dark:text-white">Edit Metadata</h3>
          <button
            onClick={cancelEditing}
            className="text-xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close metadata editor"
            disabled={isSavingMeta}
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col text-xs font-mono text-black dark:text-white gap-1">
            Status
            <select
              value={metadataDraft.status}
              onChange={(event) => setMetadataDraft((prev) => ({ ...prev, status: event.target.value as RemotePoemRecord['status'] }))}
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="flex flex-col text-xs font-mono text-black dark:text-white gap-2">
            <span>Toggles</span>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadataDraft.featured}
                  onChange={(event) => setMetadataDraft((prev) => ({ ...prev, featured: event.target.checked }))}
                />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadataDraft.hidden}
                  onChange={(event) => setMetadataDraft((prev) => ({ ...prev, hidden: event.target.checked }))}
                />
                Hidden
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadataDraft.curated}
                  onChange={(event) => setMetadataDraft((prev) => ({ ...prev, curated: event.target.checked }))}
                />
                Curated
              </label>
            </div>
          </div>
          <label className="flex flex-col text-xs font-mono text-black dark:text-white gap-1 md:col-span-2">
            License / Rights
            <input
              type="text"
              value={metadataDraft.license}
              onChange={(event) => setMetadataDraft((prev) => ({ ...prev, license: event.target.value }))}
              placeholder="e.g. Public Domain"
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            />
          </label>
          <label className="flex flex-col text-xs font-mono text-black dark:text-white gap-1 md:col-span-2">
            Source
            <input
              type="text"
              value={metadataDraft.source}
              onChange={(event) => setMetadataDraft((prev) => ({ ...prev, source: event.target.value }))}
              placeholder="e.g. Project Gutenberg"
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            />
          </label>
          <label className="flex flex-col text-xs font-mono text-black dark:text-white gap-1 md:col-span-2">
            Source URL
            <input
              type="text"
              value={metadataDraft.sourceUrl}
              onChange={(event) => setMetadataDraft((prev) => ({ ...prev, sourceUrl: event.target.value }))}
              placeholder="https://example.com/"
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            />
          </label>
          <div className="text-xs font-mono text-gray-600 dark:text-gray-300">
            <p>
              Word count: <span className="font-bold text-black dark:text-white">{countWords(entry.poem.text)}</span>
            </p>
            <p className="mt-1 text-[10px]">
              (Recalculated automatically when you save.)
            </p>
          </div>
        </div>
        {metadataError && (
          <p className="mt-3 text-sm font-mono text-red-600 dark:text-red-400">{metadataError}</p>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={cancelEditing}
            className="px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            disabled={isSavingMeta}
          >
            Cancel
          </button>
          <button
            onClick={saveMetadata}
            disabled={isSavingMeta}
            className="px-4 py-2 border-2 border-black dark:border-white bg-green-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-green-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60"
          >
            {isSavingMeta ? 'Saving…' : 'Save Metadata'}
          </button>
        </div>
      </div>
    );

    if (context === 'table') {
      return (
        <tr id={`metadata-editor-${entry.recordId}`}>
          <td colSpan={7} className="px-3 py-3 bg-yellow-50 dark:bg-gray-900/70">
            {body}
          </td>
        </tr>
      );
    }

    return (
      <div id={`metadata-editor-${entry.recordId}`} className="mt-3">
        {body}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={() => {
        if (!isSeedingAll && !isRefreshing) onClose();
      }}
    >
      <div className="relative max-w-4xl w-full h-[90vh]" onClick={(event) => event.stopPropagation()}>
        <button
          onClick={onClose}
          disabled={isSeedingAll || isRefreshing}
          className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] disabled:opacity-60"
          aria-label="Close poem seeder"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                Poem Seeder
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                Publish the curated library to the shared PocketBase backend
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-yellow-200 dark:bg-yellow-700 text-black dark:text-white">
              <p className="text-xs font-mono uppercase tracking-wide opacity-80">Seeded</p>
              <p className="text-xl font-black">
                {seededPoems.length}
                <span className="text-sm font-mono opacity-70"> / {displayPoems.length}</span>
              </p>
            </div>
            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-green-200 dark:bg-green-700 text-black dark:text-white">
              <p className="text-xs font-mono uppercase tracking-wide opacity-80">Words Seeded</p>
              <p className="text-xl font-black">
                {summaryStats.seededWords.toLocaleString()}
                <span className="text-sm font-mono opacity-70"> / {summaryStats.totalWords.toLocaleString()}</span>
              </p>
            </div>
            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-red-200 dark:bg-red-700 text-black dark:text-white">
              <p className="text-xs font-mono uppercase tracking-wide opacity-80">Missing</p>
              <p className="text-2xl font-black">{missingPoems.length}</p>
            </div>
            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white">
              <p className="text-xs font-mono uppercase tracking-wide opacity-80">Remote Only</p>
              <p className="text-2xl font-black">{remoteOnlyEntries.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="text-xs sm:text-sm font-mono text-black dark:text-white">
              {remoteIds.size} of {displayPoems.length} catalog poems are in PocketBase.
              {missingPoems.length > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-300 font-bold">
                  {missingPoems.length} missing.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                {(['all', 'published', 'draft', 'archived'] as const).map((option) => {
                  const label =
                    option === 'all'
                      ? 'All'
                      : option.charAt(0).toUpperCase() + option.slice(1);
                  return (
                    <button
                      key={option}
                      onClick={() => setStatusFilter(option)}
                      className={`px-2 py-1 border border-black dark:border-white rounded-lg transition-all ${
                        statusFilter === option
                          ? 'bg-yellow-300 dark:bg-yellow-500 text-black'
                          : 'bg-white dark:bg-gray-700 text-black dark:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(event) => setShowHidden(event.target.checked)}
                  className="accent-black"
                />
                Show hidden
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {onAddPoem && (
              <button
                onClick={onAddPoem}
                className="px-3 py-2 border-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-500 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-yellow-400 dark:hover:bg-yellow-400 transition-all"
              >
                ➕ Add New Poem
              </button>
            )}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                disabled={isImportingJson || isRefreshing}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Import poems from JSON file"
              />
              <button
                disabled={isImportingJson || isRefreshing}
                className="px-3 py-2 border-2 border-black dark:border-white bg-green-300 dark:bg-green-500 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-green-400 dark:hover:bg-green-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60"
              >
                {isImportingJson ? `📥 Importing ${importProgress.current}/${importProgress.total}…` : '📥 Import JSON'}
              </button>
            </div>
            <button
              onClick={handleSeedAll}
              disabled={missingPoems.length === 0 || isSeedingAll || isRefreshing}
              className="px-3 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60"
            >
              {isSeedingAll ? 'Seeding…' : 'Seed all missing'}
            </button>
          </div>

          {loadError && (
            <p className="text-sm font-mono text-red-600 dark:text-red-400 border-2 border-red-400 dark:border-red-500 bg-red-100/70 dark:bg-red-900/40 rounded-lg p-3">
              {loadError}
            </p>
          )}

          {importError && (
            <div className="text-sm font-mono text-red-600 dark:text-red-400 border-2 border-red-400 dark:border-red-500 bg-red-100/70 dark:bg-red-900/40 rounded-lg p-3">
              <p className="font-bold mb-2">⚠️ Import Error</p>
              <pre className="whitespace-pre-wrap text-xs">{importError}</pre>
            </div>
          )}

          {isImportingJson && (
            <div className="text-sm font-mono text-blue-600 dark:text-blue-400 border-2 border-blue-400 dark:border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 rounded-lg p-3">
              <p className="font-bold">📥 Importing poems from JSON...</p>
              <p className="text-xs mt-1">Progress: {importProgress.current} / {importProgress.total}</p>
            </div>
          )}

          <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
            <table className="min-w-full divide-y-2 divide-black dark:divide-white">
              <thead className="bg-black dark:bg-white text-yellow-400 dark:text-black font-black uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-bold">Poem</th>
                  <th className="px-2 py-2 text-left font-mono">Author</th>
                  <th className="px-2 py-2 text-left font-mono">Words</th>
                  <th className="px-2 py-2 text-left font-mono">License</th>
                  <th className="px-2 py-2 text-left font-black">
                    <button
                      type="button"
                      onClick={() =>
                        setDifficultySortAsc((prev) => (prev === null ? true : prev ? false : null))
                      }
                      className="flex items-center gap-1"
                    >
                      <span>Difficulty</span>
                      <span>{difficultySortAsc === null ? '⇅' : difficultySortAsc ? '↑' : '↓'}</span>
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-gray-900 text-sm">
                {displayPoems.map((poem) => {
                  const remoteEntry = remoteMap.get(poem.id) ?? null;
                  const status = getStatus(poem.id);
                  const error = seedErrors[poem.id];
                  const warnings: string[] = [];
                  if (remoteEntry) {
                    if (!remoteEntry.license || remoteEntry.license.trim().length === 0) {
                      warnings.push('Add license/rights attribution');
                    }
                    if (remoteEntry.status !== 'published') {
                      warnings.push(`Status is ${remoteEntry.status}`);
                    }
                    if (remoteEntry.hidden) {
                      warnings.push('Poem is hidden');
                    }
                  } else if (!poem.license || poem.license.trim().length === 0) {
                    warnings.push('License missing (will be required when seeding)');
                  }
                  const statusLabel = (() => {
                    if (status === 'success') return 'Seeded';
                    if (status === 'pending') return 'Seeding…';
                    if (status === 'error') return 'Failed';
                    return 'Missing';
                  })();
                  const badgeColor =
                    status === 'success'
                      ? 'bg-green-200 text-green-900 dark:bg-green-700 dark:text-white'
                      : status === 'pending'
                        ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-white animate-pulse'
                        : status === 'error'
                          ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                          : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200';
                  return (
                    <React.Fragment key={poem.id}>
                      <tr className="align-top">
                        <td className="px-2 py-2 text-sm font-bold text-black dark:text-white leading-tight">
                          <div>{poem.title}</div>
                          {poem.category && (
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-0.5">
                              {poem.category}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 leading-tight">
                          {poem.author}
                        </td>
                        <td className="px-2 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 leading-tight">
                          {remoteEntry?.wordCount ?? countWords(poem.text)}
                        </td>
                        <td className="px-2 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 leading-tight">
                          {remoteEntry?.license ?? poem.license ?? '—'}
                        </td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${difficultyBadge(poem.difficulty)}`}>
                            {poem.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs leading-tight">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>
                            {statusLabel}
                          </span>
                          {remoteEntry && (
                            <div className="mt-0.5 text-[10px] font-mono text-gray-600 dark:text-gray-300">
                              {remoteEntry.status.toUpperCase()}
                              {remoteEntry.hidden ? ' • Hidden' : ''}
                              {remoteEntry.featured ? ' • Featured' : ''}
                            </div>
                          )}
                          {warnings.length > 0 && (
                            <ul className="mt-0.5 text-[10px] font-mono text-red-600 dark:text-red-400 space-y-0.5">
                              {warnings.map((warning) => (
                                <li key={warning}>⚠️ {warning}</li>
                              ))}
                            </ul>
                          )}
                          {error && (
                            <div className="mt-0.5 text-xs font-mono text-red-600 dark:text-red-400">
                              {error}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <button
                              onClick={() => handleSeed(poem)}
                              disabled={status === 'success' || status === 'pending' || isRefreshing}
                              className="px-3 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60"
                            >
                              {status === 'success' ? 'Seeded' : status === 'pending' ? 'Seeding…' : 'Seed'}
                            </button>
                            {remoteEntry && (
                              <button
                                onClick={() => beginEditing(remoteEntry)}
                                className="px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                                disabled={isSavingMeta && editingRecord?.recordId === remoteEntry.recordId}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {remoteEntry && renderMetadataEditor(remoteEntry, 'table')}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {remoteOnlyEntries.length > 0 && (
            <div
              id="remote-only-heading"
              className="border-2 border-black dark:border-white rounded-lg p-4 bg-gray-100 dark:bg-gray-800 text-sm font-mono text-black dark:text-white"
            >
              <p className="font-bold mb-2">Additional poems already on PocketBase</p>
              {promoteError && (
                <p className="mb-3 text-xs text-red-600 dark:text-red-400">{promoteError}</p>
              )}
              <div className="space-y-3">
                {remoteOnlyEntries.map((entry) => (
                  <React.Fragment key={entry.recordId}>
                    <div
                      id={`remote-only-${entry.recordId}`}
                      className="border-2 border-black dark:border-white rounded-lg p-3 bg-white dark:bg-gray-900 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white">{entry.poem.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">by {entry.poem.author}</p>
                        </div>
                        <span className="text-xs font-mono px-2 py-1 border border-black dark:border-white rounded">
                          {entry.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-gray-700 dark:text-gray-200">
                        <div>
                          Words: <span className="font-bold">{entry.wordCount}</span>
                        </div>
                        <div>
                          Hidden: <span className="font-bold">{entry.hidden ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          Featured: <span className="font-bold">{entry.featured ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          Curated: <span className="font-bold">{entry.curated ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      {entry.license && (
                        <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">License: {entry.license}</p>
                      )}
                      {entry.source && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">
                          Source: {entry.source}
                          {entry.sourceUrl && (
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1 underline"
                            >
                              link
                            </a>
                          )}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => beginEditing(entry)}
                          className="px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          disabled={isSavingMeta && editingRecord?.recordId === entry.recordId}
                        >
                          Edit Metadata
                        </button>
                        <button
                          onClick={() => promoteRemotePoem(entry)}
                          disabled={
                            promotingRecordId === entry.recordId ||
                            isRefreshing ||
                            !entry.license ||
                            entry.license.trim().length === 0
                          }
                          className={`px-3 py-2 border-2 border-black dark:border-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60 ${
                            !entry.license || entry.license.trim().length === 0
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              : 'bg-green-400 text-black hover:bg-black hover:text-green-300'
                          }`}
                        >
                          {promotingRecordId === entry.recordId ? 'Promoting…' : 'Add to library'}
                        </button>
                      </div>
                      {(!entry.license || entry.license.trim().length === 0) && (
                        <p className="mt-2 text-[11px] font-mono text-red-600 dark:text-red-400">
                          ⚠️ Add a license/rights note before promoting.
                        </p>
                      )}
                      {entry.status !== 'published' && (
                        <p className="text-[11px] font-mono text-red-600 dark:text-red-400">
                          ⚠️ Status is {entry.status}. Promoting will publish it.
                        </p>
                      )}
                    </div>
                    {renderMetadataEditor(entry, 'card')}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoemSeederModal;
