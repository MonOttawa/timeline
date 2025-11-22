import React, { useMemo } from "react";
import type { PersistedSessionSummary } from "../utils/localStorage";
import {
  getAllSessionSummaries,
  getAllPoemsProgress,
} from "../utils/localStorage";
import type { PoemMetadata } from "../poemsLibrary";

interface StatsDashboardProps {
  onClose: () => void;
  poems: PoemMetadata[];
}

const formatDuration = (ms: number | null) => {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  onClose,
  poems,
}) => {
  // Fetch fresh data on every render to ensure stats are up-to-date
  const allSessions = getAllSessionSummaries();
  const poemsProgress = getAllPoemsProgress();

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalSessions = allSessions.length;
    const totalPracticeTime = allSessions.reduce(
      (sum, s) => sum + (s.totalTimeMs || 0),
      0,
    );
    const totalHints = allSessions.reduce((sum, s) => sum + s.hintsUsed, 0);
    const totalSentencesCompleted = allSessions.reduce(
      (sum, s) => sum + s.sentencesCompleted,
      0,
    );
    const totalWords = Object.values(poemsProgress).reduce(
      (sum, p) => sum + p.completedWords,
      0,
    );
    const poemsStarted = Object.keys(poemsProgress).length;

    return {
      totalSessions,
      totalPracticeTime,
      totalHints,
      totalSentencesCompleted,
      totalWords,
      poemsStarted,
    };
  }, [allSessions, poemsProgress]);

  // Calculate practice streak (consecutive days with sessions)
  const streak = useMemo(() => {
    if (allSessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique practice days
    const practiceDays = new Set(
      allSessions.map((s) => {
        const date = new Date(s.savedAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }),
    );

    const sortedDays = Array.from(practiceDays).sort((a, b) => b - a);

    // Check if practiced today or yesterday to start streak
    const todayTime = today.getTime();
    const yesterdayTime = todayTime - 24 * 60 * 60 * 1000;

    if (sortedDays[0] !== todayTime && sortedDays[0] !== yesterdayTime) {
      return 0; // Streak broken
    }

    let currentStreak = 0;
    let expectedDay = sortedDays[0] === todayTime ? todayTime : yesterdayTime;

    for (const day of sortedDays) {
      if (day === expectedDay) {
        currentStreak++;
        expectedDay -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }

    return currentStreak;
  }, [allSessions]);

  // Get recent sessions (last 7 days)
  const recentSessions = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allSessions.filter((s) => s.savedAt >= sevenDaysAgo);
  }, [allSessions]);

  // Group sessions by poem
  const sessionsByPoem = useMemo(() => {
    const grouped = new Map<string, PersistedSessionSummary[]>();
    allSessions.forEach((session) => {
      const existing = grouped.get(session.poemId) || [];
      grouped.set(session.poemId, [...existing, session]);
    });
    return grouped;
  }, [allSessions]);

  // Get poem title by ID
  const getPoemTitle = (poemId: string) => {
    const poem = poems.find((p) => p.id === poemId);
    return poem?.title || poemId;
  };

  // Generate calendar heatmap data (current year)
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get session counts by date
    const sessionsByDate = new Map<string, number>();
    allSessions.forEach((session) => {
      const date = new Date(session.savedAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split("T")[0];
      sessionsByDate.set(dateStr, (sessionsByDate.get(dateStr) || 0) + 1);
    });

    // Start from January 1st of current year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);

    // Go back to the Sunday before or on Jan 1st
    const startDayOfWeek = yearStart.getDay();
    const startDate = new Date(yearStart);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Calculate number of weeks from start to today
    const daysDiff = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeks = Math.ceil(daysDiff / 7) + 1;

    // Build grid: array of weeks, each week has 7 days
    const grid: Array<Array<{ date: Date; count: number; dateStr: string }>> =
      [];

    for (let week = 0; week < weeks; week++) {
      const weekData: Array<{ date: Date; count: number; dateStr: string }> =
        [];

      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + week * 7 + day);
        const dateStr = date.toISOString().split("T")[0];

        // Only include dates up to today and within current year
        if (date <= today && date.getFullYear() === today.getFullYear()) {
          weekData.push({
            date,
            count: sessionsByDate.get(dateStr) || 0,
            dateStr,
          });
        } else if (date < yearStart) {
          // Placeholder for days before Jan 1
          weekData.push({
            date,
            count: -1, // Use -1 to indicate "not in range"
            dateStr,
          });
        }
      }

      if (weekData.length > 0) {
        grid.push(weekData);
      }
    }

    return grid;
  }, [allSessions]);

  // Calculate weekly practice data (last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks = 8;
    const today = new Date();
    const weeklyTotals: Array<{ week: string; time: number }> = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekSessions = allSessions.filter(
        (s) =>
          s.savedAt >= weekStart.getTime() && s.savedAt <= weekEnd.getTime(),
      );

      const totalTime = weekSessions.reduce(
        (sum, s) => sum + (s.totalTimeMs || 0),
        0,
      );

      weeklyTotals.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        time: totalTime,
      });
    }

    return weeklyTotals;
  }, [allSessions]);

  // Export functions
  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      stats,
      streak,
      sessions: allSessions,
      poemsProgress,
      calendarData: calendarData.flatMap((week) =>
        week.map((d) => ({ date: d.dateStr, sessions: d.count })),
      ),
      weeklyData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poem-stats-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Poem",
      "Sentences Completed",
      "Total Sentences",
      "Time (seconds)",
      "Hints Used",
      "Incorrect Attempts",
    ];
    const rows = allSessions.map((s) => [
      new Date(s.savedAt).toISOString(),
      getPoemTitle(s.poemId),
      s.sentencesCompleted,
      s.totalSentences,
      Math.floor((s.totalTimeMs || 0) / 1000),
      s.hintsUsed,
      s.incorrectAttempts,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poem-stats-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          aria-label="Close statistics dashboard"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                📊 Statistics Dashboard
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                Track your memorization progress and achievements
              </p>
            </div>
            {allSessions.length > 0 && (
              <div className="hidden md:flex justify-end gap-2">
                <button
                  onClick={exportToJSON}
                  className="text-xs font-mono border-2 border-black dark:border-white px-3 py-1 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-gray-600 transition-all"
                  title="Export as JSON"
                >
                  📥 JSON
                </button>
                <button
                  onClick={exportToCSV}
                  className="text-xs font-mono border-2 border-black dark:border-white px-3 py-1 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-gray-600 transition-all"
                  title="Export as CSV"
                >
                  📥 CSV
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {allSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400 font-mono">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-lg font-bold">No practice sessions yet!</p>
                <p className="text-sm mt-2">
                  Complete a poem to start seeing your stats here.
                </p>
              </div>
            ) : (
              <>
                {/* Overall Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-yellow-200 dark:bg-yellow-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Total Practice Time
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {formatDuration(stats.totalPracticeTime)}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-green-200 dark:bg-green-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Practice Sessions
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {stats.totalSessions}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-blue-200 dark:bg-blue-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Words Mastered
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {stats.totalWords}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-red-200 dark:bg-red-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Hints Used
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {stats.totalHints}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-purple-200 dark:bg-purple-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Sentences Completed
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {stats.totalSentencesCompleted}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-pink-200 dark:bg-pink-700">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Poems Started
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {stats.poemsStarted}
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-orange-200 dark:bg-orange-700 col-span-2">
                    <p className="text-xs font-mono uppercase tracking-wide opacity-80 text-black dark:text-white">
                      Current Streak 🔥
                    </p>
                    <p className="text-2xl font-black text-black dark:text-white">
                      {streak} {streak === 1 ? "day" : "days"}
                    </p>
                    <p className="text-xs font-mono mt-1 opacity-70 text-black dark:text-white">
                      {streak > 0
                        ? "Keep it going!"
                        : "Practice today to start a streak!"}
                    </p>
                  </div>
                </div>

                {/* Calendar Heatmap */}
                <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
                  <div className="bg-black dark:bg-white px-4 py-2">
                    <h3 className="text-base font-black text-yellow-400 dark:text-black">
                      📅 Practice Calendar ({new Date().getFullYear()})
                    </h3>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 overflow-x-auto">
                    <div className="inline-block min-w-full">
                      {/* Month labels */}
                      <div className="flex mb-1 ml-7">
                        {calendarData.map((week, weekIdx) => {
                          const firstDay = week[0].date;
                          const showLabel =
                            weekIdx === 0 || firstDay.getDate() <= 7;
                          return (
                            <div
                              key={weekIdx}
                              className="text-[9px] font-mono text-gray-500 dark:text-gray-400 mr-0.5"
                              style={{ width: "12px" }}
                            >
                              {showLabel
                                ? firstDay.toLocaleDateString("en-US", {
                                    month: "short",
                                  })
                                : ""}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-0.5">
                        {/* Day labels */}
                        <div className="flex flex-col gap-0.5 text-[9px] font-mono text-gray-500 dark:text-gray-400 pr-1 w-6">
                          <div className="h-3 flex items-center"></div>
                          <div className="h-3 flex items-center">Mon</div>
                          <div className="h-3 flex items-center"></div>
                          <div className="h-3 flex items-center">Wed</div>
                          <div className="h-3 flex items-center"></div>
                          <div className="h-3 flex items-center">Fri</div>
                          <div className="h-3 flex items-center"></div>
                        </div>

                        {/* Heatmap grid */}
                        {calendarData.map((week, weekIdx) => (
                          <div key={weekIdx} className="flex flex-col gap-0.5">
                            {week.map((day, dayIdx) => {
                              // Skip placeholder days (before Jan 1)
                              if (day.count === -1) {
                                return <div key={dayIdx} className="w-3 h-3" />;
                              }

                              const intensity =
                                day.count === 0
                                  ? 0
                                  : Math.min(Math.ceil(day.count / 2), 4);
                              const colors = [
                                "bg-gray-200 dark:bg-gray-800",
                                "bg-green-200 dark:bg-green-900",
                                "bg-green-300 dark:bg-green-700",
                                "bg-green-400 dark:bg-green-600",
                                "bg-green-500 dark:bg-green-500",
                              ];

                              return (
                                <div
                                  key={dayIdx}
                                  className={`w-3 h-3 rounded-sm border border-black/20 dark:border-white/20 ${colors[intensity]}`}
                                  title={`${day.date.toLocaleDateString()}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-mono text-gray-600 dark:text-gray-400">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-sm border border-black/20 dark:border-white/20 ${
                            level === 0
                              ? "bg-gray-200 dark:bg-gray-800"
                              : level === 1
                                ? "bg-green-200 dark:bg-green-900"
                                : level === 2
                                  ? "bg-green-300 dark:bg-green-700"
                                  : level === 3
                                    ? "bg-green-400 dark:bg-green-600"
                                    : "bg-green-500 dark:bg-green-500"
                          }`}
                        />
                      ))}
                      <span>More</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Practice Time Chart */}
                <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
                  <div className="bg-black dark:bg-white px-4 py-3">
                    <h3 className="text-lg font-black text-yellow-400 dark:text-black">
                      📈 Practice Time Trend (Last 8 Weeks)
                    </h3>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900">
                    {weeklyData.every((w) => w.time === 0) ? (
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        No practice data yet for weekly view.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-end justify-between h-48 gap-2">
                          {weeklyData.map((week, idx) => {
                            const maxTime = Math.max(
                              ...weeklyData.map((w) => w.time),
                            );
                            const heightPercent =
                              maxTime > 0 ? (week.time / maxTime) * 100 : 0;

                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center gap-1"
                              >
                                <div className="w-full flex flex-col justify-end h-40">
                                  <div
                                    className="w-full bg-blue-400 dark:bg-blue-600 border-2 border-black dark:border-white rounded-t transition-all hover:bg-blue-500 dark:hover:bg-blue-500"
                                    style={{ height: `${heightPercent}%` }}
                                    title={`Week of ${week.week}: ${formatDuration(week.time)}`}
                                  />
                                </div>
                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                  {week.week}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 text-center text-xs font-mono text-gray-600 dark:text-gray-400">
                          Hover over bars to see detailed time
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
                  <div className="bg-black dark:bg-white px-4 py-3">
                    <h3 className="text-lg font-black text-yellow-400 dark:text-black">
                      Recent Activity (Last 7 Days)
                    </h3>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900">
                    {recentSessions.length === 0 ? (
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        No practice sessions in the last 7 days.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recentSessions.slice(0, 10).map((session, idx) => (
                          <div
                            key={`${session.poemId}-${session.savedAt}-${idx}`}
                            className="border border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-sm text-black dark:text-white">
                                  {getPoemTitle(session.poemId)}
                                </p>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  {formatDate(session.savedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-mono text-black dark:text-white">
                                  {session.sentencesCompleted}/
                                  {session.totalSentences} sentences
                                </p>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  {formatDuration(session.totalTimeMs)}
                                </p>
                              </div>
                            </div>
                            {(session.hintsUsed > 0 ||
                              session.incorrectAttempts > 0) && (
                              <div className="mt-2 flex gap-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                                {session.hintsUsed > 0 && (
                                  <span>💡 {session.hintsUsed} hints</span>
                                )}
                                {session.incorrectAttempts > 0 && (
                                  <span>
                                    ❌ {session.incorrectAttempts} mistakes
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-Poem Progress with Mastery Breakdown */}
                <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden">
                  <div className="bg-black dark:bg-white px-4 py-3">
                    <h3 className="text-lg font-black text-yellow-400 dark:text-black">
                      📚 Mastery by Poem
                    </h3>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 space-y-4">
                    {Array.from(sessionsByPoem.entries()).map(
                      ([poemId, sessions]) => {
                        const progress = poemsProgress[poemId];
                        const totalTime = sessions.reduce(
                          (sum, s) => sum + (s.totalTimeMs || 0),
                          0,
                        );
                        const lastSession = sessions[0];

                        // Calculate mastery percentage
                        const poem = poems.find((p) => p.id === poemId);
                        const totalWords = poem
                          ? poem.text.split(/\s+/).length
                          : 0;
                        const masteredWords = progress?.completedWords || 0;
                        const masteryPercent =
                          totalWords > 0
                            ? Math.round((masteredWords / totalWords) * 100)
                            : 0;

                        return (
                          <div
                            key={poemId}
                            className="border-2 border-black dark:border-white rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-black text-lg text-black dark:text-white">
                                  {getPoemTitle(poemId)}
                                </h4>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  Last practiced:{" "}
                                  {formatDate(lastSession.savedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-black dark:text-white">
                                  {masteryPercent}%
                                </p>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  mastery
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 dark:bg-gray-800 border-2 border-black dark:border-white rounded-full h-6 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${
                                    masteryPercent < 25
                                      ? "bg-red-400"
                                      : masteryPercent < 50
                                        ? "bg-orange-400"
                                        : masteryPercent < 75
                                          ? "bg-yellow-400"
                                          : masteryPercent < 100
                                            ? "bg-blue-400"
                                            : "bg-green-400"
                                  }`}
                                  style={{ width: `${masteryPercent}%` }}
                                >
                                  {masteryPercent > 10 && (
                                    <span className="text-xs font-bold text-black">
                                      {masteredWords}/{totalWords}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded border border-black dark:border-white">
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  Sessions
                                </p>
                                <p className="text-lg font-black text-black dark:text-white">
                                  {sessions.length}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded border border-black dark:border-white">
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  Time
                                </p>
                                <p className="text-lg font-black text-black dark:text-white">
                                  {formatDuration(totalTime)}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded border border-black dark:border-white">
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  Words
                                </p>
                                <p className="text-lg font-black text-black dark:text-white">
                                  {masteredWords}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
