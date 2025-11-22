import React, { useState } from 'react';
import type { PoemMetadata } from '../poemsLibrary';
import { getAllPoemsProgress, clearPoemProgress } from '../utils/localStorage';

interface PoemSelectorProps {
  poems: PoemMetadata[];
  currentPoem: PoemMetadata | null;
  onSelectPoem: (poem: PoemMetadata) => void;
  onClose: () => void;
}

const getDifficultyColor = (difficulty: string): string => {
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

export const PoemSelector: React.FC<PoemSelectorProps> = ({ poems, currentPoem, onSelectPoem, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  const poemsProgress = getAllPoemsProgress();

  const categories = ['All', ...Array.from(new Set(poems.map(p => p.category).filter(Boolean)))] ;

  const filteredPoems = selectedCategory === 'All'
    ? poems
    : poems.filter(p => p.category === selectedCategory);

  const featuredPoems = filteredPoems
    .filter(poem => Boolean(poem.featured))
    .sort((a, b) => a.title.localeCompare(b.title));

  const regularPoems = filteredPoems
    .filter(poem => !poem.featured)
    .sort((a, b) => a.title.localeCompare(b.title));

  const renderPoemCard = (poem: PoemMetadata, mode: 'featured' | 'regular') => {
    const progress = poemsProgress[poem.id];
    const isSelected = currentPoem?.id === poem.id;
    const isFeatured = mode === 'featured';

    return (
      <button
        key={poem.id}
        onClick={() => handleSelectPoem(poem)}
        className={`p-3 border-2 border-black dark:border-white rounded-xl cursor-pointer transition-all hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 text-left w-full ${
          isSelected
            ? 'bg-yellow-400 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]'
            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-lg font-bold text-black dark:text-white leading-tight">{poem.title}</h3>
          <div className="flex items-center gap-2">
            {isFeatured && (
              <span className="text-xs font-bold uppercase tracking-wide bg-pink-500 text-white px-2 py-1 rounded shadow-[2px_2px_0px_#000]">
                Featured
              </span>
            )}
            {isSelected && (
              <span className="text-xs font-mono bg-black text-yellow-400 px-2 py-0.5 rounded">
                Current
              </span>
            )}
          </div>
        </div>

        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-1.5 line-clamp-1">
          by {poem.author}
        </p>

        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-bold px-2 py-1 rounded ${getDifficultyColor(poem.difficulty)}`}>
            {poem.difficulty.toUpperCase()}
          </span>
          {poem.category && (
            <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400">
              {poem.category}
            </span>
          )}
          {poem.license && (
            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
              {poem.license}
            </span>
          )}
        </div>

        {progress && progress.hasProgress && (
          <div className="mt-2 pt-2 border-t border-dashed border-black dark:border-white">
            <div className="flex justify-between items-center gap-2">
              <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
                {progress.completedWords > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    ⭐ {progress.completedWords} words mastered
                  </span>
                )}
                {progress.completedWords === 0 && (
                  <span className="text-gray-500">In progress...</span>
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => handleResetProgress(poem.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResetProgress(poem.id, e as any);
                  }
                }}
                className={`text-[10px] px-2 py-0.5 border-2 border-black dark:border-white rounded font-bold transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 ${
                  showResetConfirm === poem.id
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-600 text-black dark:text-white hover:bg-red-100 dark:hover:bg-red-900'
                }`}
              >
                {showResetConfirm === poem.id ? 'Click to Confirm' : 'Reset'}
              </div>
            </div>
          </div>
        )}
      </button>
    );
  };

  const handleSelectPoem = (poem: PoemMetadata) => {
    onSelectPoem(poem);
    onClose();
  };

  const handleResetProgress = (poemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showResetConfirm === poemId) {
      clearPoemProgress(poemId);
      setShowResetConfirm(null);
      // Refresh the component to show updated progress
      window.location.reload();
    } else {
      setShowResetConfirm(poemId);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowResetConfirm(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
          aria-label="Close poem selector"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                Choose a Poem
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {poems.length} {poems.length === 1 ? 'poem' : 'poems'} available
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 border-2 border-black dark:border-white font-bold rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 ${
                selectedCategory === category
                  ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]'
                  : 'bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {featuredPoems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wide">Featured</h3>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                Curated highlights to jump-start your practice.
              </span>
            </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredPoems.map(poem => renderPoemCard(poem, 'featured'))}
        </div>
      </div>
    )}

        {regularPoems.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wide">
                {featuredPoems.length > 0 ? 'All Poems' : 'Poems'}
              </h3>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                Sorted alphabetically.
              </span>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {regularPoems.map(poem => renderPoemCard(poem, 'regular'))}
        </div>
      </>
    )}
          </div>
        </div>
      </div>
    </div>
  );
};
