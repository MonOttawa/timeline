import React from "react";
import { Home } from "lucide-react";
import { BurgerMenu } from "./BurgerMenu";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onShowPoemSelector?: () => void;
  onShowKeyboardHelp?: () => void;
  onShowStats?: () => void;
  onShowLeaderboard?: () => void;
  userEmail?: string | null;
  userName?: string | null;
  onLogout?: () => void;
  canSeedPoems?: boolean;
  onShowSeeder?: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  onShowProfileSettings?: () => void;
  onShowTeleprompter?: () => void;
  onNavigateHome?: () => void;
  onNavigateTimeline?: () => void;
  onLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onShowPoemSelector,
  onShowKeyboardHelp,
  onShowStats,
  onShowLeaderboard,
  userEmail,
  userName,
  onLogout,
  canSeedPoems = false,
  onShowSeeder,
  onShowHistory,
  hasHistory = false,
  onShowProfileSettings,
  onShowTeleprompter,
  onNavigateHome,
  onNavigateTimeline,
  onLogin,
}) => {
  const displayName =
    userName && userName.trim().length > 0
      ? userName
      : userEmail
        ? userEmail.split("@")[0].split(/[._-]/)[0]
        : null;

  return (
    <header className="w-full mb-4 md:mb-8 px-4 pb-2">
      {/* Mobile: Stats, Session History, Leaderboard, Change Poem, and Burger Menu */}
      <div className="md:hidden flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pr-1">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white bg-blue-400 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#FFF] transition-all focus:outline-none text-sm whitespace-nowrap"
              title="Home"
            >
              <Home size={16} />
            </button>
          )}
          {onShowStats && (
            <button
              onClick={onShowStats}
              className="px-3 py-2 border-2 border-black dark:border-white bg-blue-300 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-blue-300 transition-all focus:outline-none text-sm whitespace-nowrap"
            >
              Stats
            </button>
          )}
          {hasHistory && onShowHistory && (
            <button
              onClick={onShowHistory}
              className="px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none text-sm whitespace-nowrap"
            >
              History
            </button>
          )}
          {onShowLeaderboard && (
            <button
              onClick={onShowLeaderboard}
              className="px-3 py-2 border-2 border-black dark:border-white bg-purple-300 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-purple-300 transition-all focus:outline-none text-sm whitespace-nowrap"
            >
              Leaderboard
            </button>
          )}
          {onShowPoemSelector && (
            <button
              onClick={onShowPoemSelector}
              className="px-3 py-2 border-2 border-black dark:border-white bg-green-300 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-green-300 transition-all focus:outline-none text-sm whitespace-nowrap"
            >
              Change Poem
            </button>
          )}
        </div>
        <BurgerMenu
          theme={theme}
          onToggleTheme={onToggleTheme}
          onShowKeyboardHelp={onShowKeyboardHelp}
          onShowStats={onShowStats}
          onShowLeaderboard={onShowLeaderboard}
          userEmail={userEmail}
          userName={userName}
          onLogout={onLogout}
          canSeedPoems={canSeedPoems}
          onShowSeeder={onShowSeeder}
          onShowProfileSettings={onShowProfileSettings}
          onShowTeleprompter={onShowTeleprompter}
        />
      </div>

      {/* Tablet/Desktop: Regular Button Bar */}
      <div className="hidden md:flex flex-wrap justify-center items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black dark:border-white bg-blue-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all focus:outline-none"
            title="Home"
          >
            <Home size={20} />
          </button>
        )}
        {onShowKeyboardHelp && (
          <button
            onClick={onShowKeyboardHelp}
            className="px-4 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          >
            ⌨️ Shortcuts
          </button>
        )}
        {onShowStats && (
          <button
            onClick={onShowStats}
            className="px-4 py-2 border-2 border-black dark:border-white bg-blue-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-blue-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          >
            📊 Stats
          </button>
        )}
        {onShowLeaderboard && (
          <button
            onClick={onShowLeaderboard}
            className="px-4 py-2 border-2 border-black dark:border-white bg-purple-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-purple-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          >
            🏆 Leaderboard
          </button>
        )}
        {canSeedPoems && onShowSeeder && (
          <button
            onClick={onShowSeeder}
            className="px-4 py-2 border-2 border-black dark:border-white bg-green-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-green-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          >
            📚 Seed Poems
          </button>
        )}
        {onShowTeleprompter && (
          <button
            onClick={onShowTeleprompter}
            className="px-4 py-2 border-2 border-black dark:border-white bg-pink-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-pink-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          >
            🎤 Teleprompter
          </button>
        )}
        <button
          onClick={onToggleTheme}
          className="px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-yellow-400 text-yellow-400 dark:text-black font-bold rounded-lg shadow-[4px_4px_0px_rgba(17,24,39,0.4)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.5)] hover:bg-yellow-400 hover:text-black dark:hover:bg-black dark:hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        {displayName && (
          <div className="flex items-center gap-2 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-mono text-sm font-semibold rounded-lg px-3 py-2 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]">
            <span
              className="truncate max-w-[12rem]"
              title={userEmail ?? displayName}
            >
              {displayName}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-1 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-md px-2 py-1 hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Log out
              </button>
            )}
          </div>
        )}
      </div>
    </header >
  );
};
