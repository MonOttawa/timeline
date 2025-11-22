import React, { useState, useEffect } from "react";
import {
  fetchLeaderboardData,
  formatPracticeTime,
  type LeaderboardEntry,
} from "../services/leaderboardService";
import { hasPocketBase } from "../services/pocketbaseClient";

type SortBy = "score" | "sessions" | "practiceTime" | "accuracy" | "completed";

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTop, setShowTop] = useState<number>(50); // Show top 50 by default

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!hasPocketBase) {
        setError(
          "Leaderboard requires backend connection. Please configure PocketBase.",
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchLeaderboardData();
        if (!cancelled) {
          setLeaderboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load leaderboard:", err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load leaderboard. Please try again.";
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeaderboard = async () => {
    if (!hasPocketBase) {
      setError(
        "Leaderboard requires backend connection. Please configure PocketBase.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchLeaderboardData();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load leaderboard. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedLeaderboard = [...leaderboard]
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "sessions":
          return b.totalSessions - a.totalSessions;
        case "practiceTime":
          return b.totalPracticeTimeMs - a.totalPracticeTimeMs;
        case "accuracy":
          return b.averageAccuracy - a.averageAccuracy;
        case "completed":
          return b.poemsCompleted - a.poemsCompleted;
        default:
          return b.score - a.score;
      }
    })
    .slice(0, showTop);

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 90) return "text-green-600 dark:text-green-400";
    if (accuracy >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (!hasPocketBase) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="border-4 border-black dark:border-white p-8 bg-white dark:bg-gray-800 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl text-center">
          <h2 className="text-3xl font-black mb-4 text-black dark:text-white">
            Leaderboard Unavailable
          </h2>
          <p className="text-gray-700 dark:text-gray-300 font-mono">
            The leaderboard requires a PocketBase backend connection. Please
            configure your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
          aria-label="Close leaderboard"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                🏆 Community Leaderboard
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                See how you rank against other poetry masters
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-mono">
                  Loading leaderboard...
                </p>
              </div>
            ) : error ? (
              <div className="border-4 border-red-500 p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl text-center">
                <h3 className="text-2xl font-black mb-4 text-red-700 dark:text-red-400">
                  Error
                </h3>
                <p className="text-red-600 dark:text-red-300 font-mono mb-4">
                  {error}
                </p>
                <button
                  onClick={loadLeaderboard}
                  className="px-6 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Controls - Desktop Only */}
                <div className="hidden md:flex flex-wrap gap-4 items-center justify-between p-4 border-2 border-black dark:border-white rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-bold text-black dark:text-white">
                      Sort by:
                    </span>
                    {(
                      [
                        "score",
                        "sessions",
                        "practiceTime",
                        "accuracy",
                        "completed",
                      ] as SortBy[]
                    ).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`px-4 py-2 border-2 font-bold rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 ${
                          sortBy === option
                            ? "border-black dark:border-white bg-yellow-400 text-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
                            : "border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                        }`}
                      >
                        {option === "practiceTime"
                          ? "Time"
                          : option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black dark:text-white text-sm">
                      Show:
                    </span>
                    <select
                      value={showTop}
                      onChange={(e) => setShowTop(Number(e.target.value))}
                      className="px-3 py-2 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="10">Top 10</option>
                      <option value="25">Top 25</option>
                      <option value="50">Top 50</option>
                      <option value="100">Top 100</option>
                    </select>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
                  <div className="bg-black dark:bg-white px-4 py-3 border-b-4 border-black dark:border-white">
                    <h3 className="text-lg font-black text-yellow-400 dark:text-black">
                      Rankings
                    </h3>
                  </div>
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-900">
                      <p className="text-4xl mb-4">🏆</p>
                      <p className="text-lg font-bold text-black dark:text-white mb-2">
                        No rankings yet!
                      </p>
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        Complete some practice sessions to see your rank.
                      </p>
                    </div>
                  ) : leaderboard.length === 1 &&
                    leaderboard[0].isCurrentUser ? (
                    <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 border-t-4 border-yellow-400">
                      <p className="text-lg font-bold text-black dark:text-white mb-2">
                        🌟 You're the first one here!
                      </p>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-400">
                        Other users' sessions will appear here once they start
                        practicing.
                        <br />
                        <span className="text-xs">
                          Note: You can only see sessions from users who have
                          completed practice sessions.
                        </span>
                      </p>
                    </div>
                  ) : null}

                  {/* Mobile View: Card List */}
                  <div className="md:hidden bg-white dark:bg-gray-900">
                    {sortedLeaderboard.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={`border-b-2 border-gray-200 dark:border-gray-700 p-4 ${
                          entry.isCurrentUser
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : ""
                        }`}
                      >
                        {/* Rank & User Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl font-black flex-shrink-0">
                            {getRankIcon(index + 1)}
                          </span>
                          <div className="w-12 h-12 rounded-full bg-yellow-400 border-2 border-black dark:border-white flex items-center justify-center font-black text-black text-xl flex-shrink-0">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-black dark:text-white truncate">
                              {entry.username}
                            </p>
                            {entry.isCurrentUser && (
                              <span className="inline-block text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">
                              Score
                            </p>
                            <p className="font-black text-xl text-black dark:text-white">
                              {entry.score.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-300 dark:border-gray-600">
                            <p className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase">
                              Sessions
                            </p>
                            <p className="font-bold text-sm text-black dark:text-white">
                              {entry.totalSessions}
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-300 dark:border-gray-600">
                            <p className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase">
                              Time
                            </p>
                            <p className="font-bold text-sm text-black dark:text-white">
                              {formatPracticeTime(entry.totalPracticeTimeMs)}
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-300 dark:border-gray-600">
                            <p className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase">
                              Accuracy
                            </p>
                            <p
                              className={`font-bold text-sm ${getAccuracyColor(entry.averageAccuracy)}`}
                            >
                              {entry.averageAccuracy.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Completed Poems */}
                        <div className="mt-2 text-center">
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                            Completed:{" "}
                            <span className="font-bold text-black dark:text-white">
                              {entry.poemsCompleted} / {entry.poemsStarted}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-900">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-black dark:border-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            User
                          </th>
                          <th className="px-4 py-3 text-center font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Score
                          </th>
                          <th className="px-4 py-3 text-center font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Sessions
                          </th>
                          <th className="px-4 py-3 text-center font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Time
                          </th>
                          <th className="px-4 py-3 text-center font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Accuracy
                          </th>
                          <th className="px-4 py-3 text-center font-black text-black dark:text-white uppercase tracking-wide text-xs">
                            Completed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLeaderboard.map((entry, index) => (
                          <tr
                            key={entry.userId}
                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              entry.isCurrentUser
                                ? "bg-yellow-50 dark:bg-yellow-900/20"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-4">
                              <span className="text-2xl font-black">
                                {getRankIcon(index + 1)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-black dark:border-white flex items-center justify-center font-black text-black">
                                  {entry.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-black dark:text-white">
                                    {entry.username}
                                    {entry.isCurrentUser && (
                                      <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-black">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-black text-lg text-black dark:text-white">
                                {entry.score.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-mono text-gray-700 dark:text-gray-300">
                                {entry.totalSessions}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-mono text-gray-700 dark:text-gray-300">
                                {formatPracticeTime(entry.totalPracticeTimeMs)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`font-bold ${getAccuracyColor(entry.averageAccuracy)}`}
                              >
                                {entry.averageAccuracy.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-mono text-gray-700 dark:text-gray-300">
                                {entry.poemsCompleted} / {entry.poemsStarted}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {leaderboard.length === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400 font-mono">
                          No data yet. Be the first to practice and appear on
                          the leaderboard!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Summary */}
                {leaderboard.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-blue-200 dark:bg-blue-700">
                      <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                        Total Users
                      </p>
                      <p className="text-2xl font-black text-black dark:text-white">
                        {leaderboard.length}
                      </p>
                    </div>
                    <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-green-200 dark:bg-green-700">
                      <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                        Total Sessions
                      </p>
                      <p className="text-2xl font-black text-black dark:text-white">
                        {leaderboard
                          .reduce((sum, e) => sum + e.totalSessions, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-yellow-200 dark:bg-yellow-700">
                      <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                        Total Practice Time
                      </p>
                      <p className="text-2xl font-black text-black dark:text-white">
                        {formatPracticeTime(
                          leaderboard.reduce(
                            (sum, e) => sum + e.totalPracticeTimeMs,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
