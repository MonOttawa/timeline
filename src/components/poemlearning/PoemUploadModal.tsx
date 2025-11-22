import React, { useMemo, useState } from 'react';
import type { CreatePoemInput } from '../services/poemRepository';
import { validatePoemCompleteness, poemValidationThresholds } from '../utils/poemValidation';

interface PoemUploadModalProps {
  onClose: () => void;
  onSubmit: (poem: CreatePoemInput) => Promise<void>;
}

const difficulties: CreatePoemInput['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

export const PoemUploadModal: React.FC<PoemUploadModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [difficulty, setDifficulty] = useState<CreatePoemInput['difficulty']>('beginner');
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completenessIssues = useMemo(() => validatePoemCompleteness(text), [text]);
  const canSubmit =
    !isSubmitting &&
    title.trim().length > 0 &&
    author.trim().length > 0 &&
    text.trim().length > 0 &&
    completenessIssues.length === 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !author.trim() || !text.trim()) {
      setError('Please fill in the title, author, and poem text.');
      return;
    }

    if (completenessIssues.length > 0) {
      setError(completenessIssues[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        text: text.trim(),
        difficulty,
        category: category.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to save poem', err);
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Failed to save the poem. Please try again.');
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
          className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
          aria-label="Close poem upload"
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
                Add a Custom Poem
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                Share your favorite poem with the community
              </p>
            </div>
          </div>

          {/* Content */}
          <form className="flex-1 min-h-0 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
          <div className="border-2 border-black dark:border-white rounded-lg bg-yellow-100 dark:bg-gray-800 text-sm font-mono text-black dark:text-white p-4">
            <p className="font-bold">Heads up!</p>
            <p className="mt-2">
              Paste the <span className="underline">full poem</span>. Include every stanza and line. We look for at least {poemValidationThresholds.minLines} lines, {poemValidationThresholds.minWords} words, and about {poemValidationThresholds.minCharacters} characters so other learners can practice the complete piece.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
              Title
              <input
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                placeholder="e.g. If—"
              />
            </label>
            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
              Author
              <input
                type="text"
                value={author}
                onChange={event => setAuthor(event.target.value)}
                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                placeholder="e.g. Rudyard Kipling"
              />
            </label>
            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
              Difficulty
              <select
                value={difficulty}
                onChange={event => setDifficulty(event.target.value as CreatePoemInput['difficulty'])}
                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
              >
                {difficulties.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
              <span>
                Category <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
              </span>
              <input
                type="text"
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                placeholder="e.g. Classic, Modern"
              />
            </label>
          </div>

          <label className="flex flex-col text-sm font-mono text-black dark:text-white gap-2">
            Poem Text
            <textarea
              value={text}
              onChange={event => setText(event.target.value)}
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 min-h-[200px]"
              placeholder="Paste the full poem here. Separate stanzas with blank lines."
            />
          </label>

          {text.trim().length > 0 && completenessIssues.length > 0 && (
            <div className="border-2 border-red-500 dark:border-red-400 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg p-4 text-xs font-mono space-y-2">
              <p className="font-bold">Still looks incomplete:</p>
              <ul className="list-disc ml-5 space-y-1">
                {completenessIssues.map(issue => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-sm font-mono text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border-2 border-black dark:border-white rounded-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 border-2 border-black dark:border-white rounded-lg font-bold bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : 'Save Poem'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default PoemUploadModal;
