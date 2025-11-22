import React, { useState } from "react";
import type { PersistedSessionSummary } from "../utils/localStorage";

interface SessionHistoryProps {
  summaries: PersistedSessionSummary[];
  onClose: () => void;
  onReviewSentence?: (sentenceIndex: number) => void;
}

const formatDuration = (ms: number | null) => {
  if (!ms || ms <= 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  summaries,
  onClose,
  onReviewSentence,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selected = summaries[selectedIndex];

  // Limit to 3 most recent sessions on mobile
  const mobileSummaries = summaries.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-yellow-50 dark:bg-gray-900 border-4 border-black dark:border-white max-w-5xl w-full my-auto rounded-2xl shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] overflow-hidden max-h-[90vh] md:max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-white bg-yellow-200 dark:bg-gray-800 flex-shrink-0">
          <h2 className="text-2xl font-black text-black dark:text-white">
            Session History
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded"
            aria-label="Close session history"
          >
            ✕
          </button>
        </div>

        {/* Mobile View: Single Column Layout */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {mobileSummaries.map((summary, idx) => (
            <div key={summary.savedAt} className="space-y-3">
              {/* Session Summary Card */}
              <div className="p-3 rounded-lg border-2 border-black dark:border-white bg-yellow-300 dark:bg-gray-700 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF]">
                <p className="font-bold text-sm text-black dark:text-white">
                  {new Date(summary.savedAt).toLocaleString()}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2 text-gray-700 dark:text-gray-300">
                  <span>
                    {summary.sentencesCompleted}/{summary.totalSentences} sent.
                  </span>
                  <span>{summary.hintsUsed} hints</span>
                  <span>{summary.incorrectAttempts} misses</span>
                  <span>{formatDuration(summary.totalTimeMs)}</span>
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-2 text-sm font-mono text-black dark:text-white">
                <div className="border-2 border-black dark:border-white rounded-lg p-2 bg-white dark:bg-gray-800">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Sentences
                  </p>
                  <p className="text-base font-bold">
                    {summary.sentencesCompleted}/{summary.totalSentences}
                  </p>
                </div>
                <div className="border-2 border-black dark:border-white rounded-lg p-2 bg-white dark:bg-gray-800">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Hints
                  </p>
                  <p className="text-base font-bold">{summary.hintsUsed}</p>
                </div>
                <div className="border-2 border-black dark:border-white rounded-lg p-2 bg-white dark:bg-gray-800">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Misses
                  </p>
                  <p className="text-base font-bold">
                    {summary.incorrectAttempts}
                  </p>
                </div>
                <div className="border-2 border-black dark:border-white rounded-lg p-2 bg-white dark:bg-gray-800">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Time
                  </p>
                  <p className="text-base font-bold">
                    {formatDuration(summary.totalTimeMs)}
                  </p>
                </div>
              </div>

              {/* Per Sentence Stats */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-black dark:text-white mb-2">
                  Per Sentence Performance
                </h4>
                <div className="space-y-1">
                  {summary.sentenceStats.map((stat) => (
                    <div
                      key={stat.index}
                      className="p-2 rounded-md bg-white dark:bg-gray-800 border border-black/20 dark:border-white/20"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-xs text-black dark:text-white">
                          Sentence {stat.index + 1}
                        </p>
                        {onReviewSentence && (
                          <button
                            onClick={() => {
                              onReviewSentence(stat.index);
                              onClose();
                            }}
                            className="border border-black dark:border-white px-2 py-1 rounded bg-yellow-300 text-black dark:bg-gray-700 dark:text-white text-[10px] font-bold"
                          >
                            Review
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] font-mono mt-1 text-gray-600 dark:text-gray-400">
                        <span>{stat.hints} hints</span>
                        <span>{stat.incorrectAttempts} misses</span>
                        <span>{formatDuration(stat.durationMs)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider between sessions */}
              {idx < mobileSummaries.length - 1 && (
                <div className="border-t-2 border-dashed border-gray-400 dark:border-gray-600 my-4" />
              )}
            </div>
          ))}

          {summaries.length > 3 && (
            <p className="text-xs text-center font-mono text-gray-600 dark:text-gray-400 py-2">
              Showing 3 most recent of {summaries.length} sessions
            </p>
          )}
        </div>

        {/* Desktop View: Split Layout */}
        <div className="hidden md:grid md:grid-cols-5 divide-x divide-black dark:divide-white flex-1 min-h-0 overflow-hidden">
          <div className="md:col-span-2 overflow-y-auto">
            {/* Desktop View: Table */}
            <table className="hidden md:table w-full text-xs md:text-sm font-mono text-black dark:text-white">
              <thead className="bg-black text-yellow-400 dark:bg-yellow-400 dark:text-black sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Sent</th>
                  <th className="px-3 py-2 text-left">Hints</th>
                  <th className="px-3 py-2 text-left">Misses</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary, idx) => {
                  const isActive = idx === selectedIndex;
                  return (
                    <tr
                      key={summary.savedAt}
                      onClick={() => setSelectedIndex(idx)}
                      className={`cursor-pointer transition-colors ${isActive ? "bg-yellow-300 dark:bg-gray-700" : idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-yellow-100 dark:bg-gray-700"}`}
                    >
                      <td className="px-3 py-2">
                        {new Date(summary.savedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {summary.sentencesCompleted}/{summary.totalSentences}
                      </td>
                      <td className="px-3 py-2">{summary.hintsUsed}</td>
                      <td className="px-3 py-2">{summary.incorrectAttempts}</td>
                      <td className="px-3 py-2">
                        {formatDuration(summary.totalTimeMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:col-span-3 p-4 md:p-6 space-y-4 overflow-y-auto">
            {selected ? (
              <>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-black dark:text-white">
                    Session Details
                  </h3>
                  <p className="text-xs md:text-sm font-mono text-gray-700 dark:text-gray-300">
                    Recorded {new Date(selected.savedAt).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm font-mono text-black dark:text-white">
                  <div className="border-2 border-black dark:border-white rounded-xl p-3 bg-white dark:bg-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sentences mastered
                    </p>
                    <p className="text-lg font-bold">
                      {selected.sentencesCompleted}/{selected.totalSentences}
                    </p>
                  </div>
                  <div className="border-2 border-black dark:border-white rounded-xl p-3 bg-white dark:bg-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Hints used
                    </p>
                    <p className="text-lg font-bold">{selected.hintsUsed}</p>
                  </div>
                  <div className="border-2 border-black dark:border-white rounded-xl p-3 bg-white dark:bg-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Incorrect attempts
                    </p>
                    <p className="text-lg font-bold">
                      {selected.incorrectAttempts}
                    </p>
                  </div>
                  <div className="border-2 border-black dark:border-white rounded-xl p-3 bg-white dark:bg-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total time
                    </p>
                    <p className="text-lg font-bold">
                      {formatDuration(selected.totalTimeMs)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mb-2">
                    Per Sentence performance
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-black/20 dark:border-white/20 rounded-lg">
                    {/* Mobile View: Card List */}
                    <div className="md:hidden space-y-1 p-1">
                      {selected.sentenceStats.map((stat) => (
                        <div
                          key={stat.index}
                          className={`p-2 rounded-md ${stat.index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-yellow-100 dark:bg-gray-700"}`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-sm text-black dark:text-white">
                              Sentence {stat.index + 1}
                            </p>
                            {onReviewSentence && (
                              <button
                                onClick={() => {
                                  onReviewSentence(stat.index);
                                  onClose();
                                }}
                                className="border-2 border-black dark:border-white px-2 py-1 rounded bg-yellow-300 text-black dark:bg-gray-700 dark:text-white hover:bg-black hover:text-yellow-300 dark:hover:bg-yellow-400 dark:hover:text-black transition-all text-xs font-bold"
                              >
                                Review
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between text-xs font-mono mt-1 text-gray-600 dark:text-gray-400">
                            <span>{stat.hints} hints</span>
                            <span>{stat.incorrectAttempts} misses</span>
                            <span>{formatDuration(stat.durationMs)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View: Table */}
                    <table className="hidden md:table w-full text-xs font-mono text-black dark:text-white">
                      <thead className="bg-black text-yellow-400 dark:bg-yellow-400 dark:text-black sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Sentence</th>
                          <th className="px-2 py-1 text-left">Hints</th>
                          <th className="px-2 py-1 text-left">Misses</th>
                          <th className="px-2 py-1 text-left">Time</th>
                          {onReviewSentence && (
                            <th className="px-2 py-1 text-left">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.sentenceStats.map((stat) => (
                          <tr
                            key={stat.index}
                            className={
                              stat.index % 2 === 0
                                ? "bg-white dark:bg-gray-800"
                                : "bg-yellow-100 dark:bg-gray-700"
                            }
                          >
                            <td className="px-2 py-1">
                              Sentence {stat.index + 1}
                            </td>
                            <td className="px-2 py-1">{stat.hints}</td>
                            <td className="px-2 py-1">
                              {stat.incorrectAttempts}
                            </td>
                            <td className="px-2 py-1">
                              {formatDuration(stat.durationMs)}
                            </td>
                            {onReviewSentence && (
                              <td className="px-2 py-1">
                                <button
                                  onClick={() => {
                                    onReviewSentence(stat.index);
                                    onClose();
                                  }}
                                  className="border-2 border-black dark:border-white px-2 py-1 rounded bg-yellow-300 text-black dark:bg-gray-700 dark:text-white hover:bg-black hover:text-yellow-300 dark:hover:bg-yellow-400 dark:hover:text-black transition-all text-xs font-bold"
                                >
                                  Review
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-sm font-mono text-gray-600 dark:text-gray-300">
                No session selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
