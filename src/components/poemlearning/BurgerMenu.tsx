import React, { useState, useEffect } from "react";

interface BurgerMenuProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onShowKeyboardHelp: () => void;
  onShowStats: () => void;
  onShowLeaderboard: () => void;
  userEmail?: string | null;
  userName?: string | null;
  onLogout?: () => void;
  canSeedPoems?: boolean;
  onShowSeeder?: () => void;
  onShowProfileSettings?: () => void;
  onShowTeleprompter?: () => void;
  className?: string;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({
  theme,
  onToggleTheme,
  onShowKeyboardHelp,
  onShowStats,
  onShowLeaderboard,
  userEmail,
  userName,
  onLogout,
  canSeedPoems = false,
  onShowSeeder,
  onShowProfileSettings,
  onShowTeleprompter,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayName =
    userName && userName.trim().length > 0
      ? userName
      : userEmail
        ? userEmail.split("@")[0].split(/[._-]/)[0]
        : null;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest(".burger-menu-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={`burger-menu-container ${className || ""}`.trim()}>
      {/* Burger Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-center items-center px-3 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none"
        aria-label="Menu"
      >
        <div className="flex flex-col gap-1 w-6">
          <div
            className={`h-0.5 bg-current transition-transform ${isOpen ? "rotate-45 translate-y-1.5" : ""}`}
          ></div>
          <div
            className={`h-0.5 bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`}
          ></div>
          <div
            className={`h-0.5 bg-current transition-transform ${isOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
          ></div>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 border-l-4 border-black dark:border-white shadow-[-8px_0_0px_rgba(0,0,0,0.2)] dark:shadow-[-8px_0_0px_rgba(255,255,255,0.2)] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Menu Header */}
        <div className="flex justify-between items-center p-4 border-b-2 border-black dark:border-white">
          <h2 className="text-xl font-black">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col h-full">
          {/* Top Section - User Profile & Settings */}
          <div className="flex-1 overflow-y-auto">
            {displayName && (
              <div className="p-4 space-y-3">
                {/* User Profile */}
                <div className="p-3 border-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="font-mono text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">
                    Signed in as
                  </p>
                  <p
                    className="font-mono text-sm font-semibold truncate text-black dark:text-white"
                    title={userEmail ?? displayName}
                  >
                    {displayName}
                  </p>
                  {userEmail && (
                    <p
                      className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate mt-1"
                      title={userEmail}
                    >
                      {userEmail}
                    </p>
                  )}
                </div>

                {/* Profile Button */}
                <button
                  onClick={() =>
                    handleMenuAction(onShowProfileSettings || (() => { }))
                  }
                  className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none"
                >
                  👤 Profile Settings
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => handleMenuAction(onToggleTheme)}
                  className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-black dark:bg-yellow-400 text-yellow-400 dark:text-black font-bold rounded-lg shadow-[2px_2px_0px_rgba(17,24,39,0.4)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.5)] hover:bg-yellow-400 hover:text-black dark:hover:bg-black dark:hover:text-yellow-400 transition-all focus:outline-none"
                >
                  {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>

                {/* Teleprompter Button */}
                {onShowTeleprompter && (
                  <button
                    onClick={() => handleMenuAction(onShowTeleprompter)}
                    className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-pink-400 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-pink-400 transition-all focus:outline-none"
                  >
                    🎤 Teleprompter
                  </button>
                )}

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={() => handleMenuAction(onLogout)}
                    className="w-full px-4 py-3 border-2 border-black dark:border-white bg-red-400 text-black font-bold rounded-lg shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:bg-black hover:text-red-400 transition-all focus:outline-none"
                  >
                    🚪 Log Out
                  </button>
                )}

                {/* Admin/Curator Tools */}
                {canSeedPoems && onShowSeeder && (
                  <>
                    <div className="border-t-2 border-black dark:border-white my-3"></div>
                    <button
                      onClick={() => handleMenuAction(onShowSeeder)}
                      className="w-full text-left px-4 py-3 border-2 border-black dark:border-white bg-green-300 text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:bg-black hover:text-green-300 transition-all focus:outline-none"
                    >
                      📚 Seed Poems
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};
