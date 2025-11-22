import React from "react";
// import { BurgerMenu } from "./BurgerMenu"; // Commenting out for now as I haven't ported it yet, or will replace with simple menu

export const Header = ({
    theme,
    onToggleTheme,
    userEmail,
    userName,
    onLogout,
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
        <header className="w-full mb-4 md:mb-8 px-4 pb-2 pt-4 flex justify-between items-center">
            {/* Left: Site Title */}
            <div className="flex items-center border-2 border-gray-300 bg-gray-100 shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all rounded-lg p-1 cursor-pointer" onClick={onNavigateHome}>
                <svg
                    width="150"
                    height="50"
                    viewBox="0 0 150 50"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="Markdown Timeline logo"
                    className="inline-block"
                >
                    <rect width="150" height="50" rx="6" fill="#050608" />
                    <rect
                        x="1.5"
                        y="1.5"
                        width="147"
                        height="47"
                        rx="5"
                        fill="none"
                        stroke="#F5F5F5"
                        strokeWidth="3"
                    />
                    <g transform="translate(18, 13)">
                        <line
                            x1="0"
                            y1="12"
                            x2="50"
                            y2="12"
                            stroke="#F5F5F5"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle cx="0" cy="12" r="5" fill="#050608" stroke="#F5F5F5" strokeWidth="3" />
                        <circle cx="25" cy="12" r="5" fill="#00FF85" stroke="#050608" strokeWidth="2" />
                        <circle cx="50" cy="12" r="5" fill="#050608" stroke="#F5F5F5" strokeWidth="3" />
                    </g>
                    <text
                        x="78"
                        y="22"
                        fill="#F5F5F5"
                        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                        fontSize="9"
                        fontWeight="700"
                        letterSpacing="0.14em"
                    >
                        MARKDOWN
                    </text>
                    <text
                        x="78"
                        y="36"
                        fill="#00FF85"
                        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                        fontSize="11"
                        fontWeight="800"
                        letterSpacing="0.18em"
                    >
                        TIMELINE
                    </text>
                </svg>
            </div>

            {/* Right: Navigation & Actions */}
            <div className="flex items-center gap-3">
                {/* Mobile: Menu (Simplified) */}
                <div className="md:hidden">
                    <button className="px-3 py-2 border-2 border-black font-bold rounded-lg shadow-[2px_2px_0px_#000]">Menu</button>
                </div>

                {/* Tablet/Desktop: Regular Button Bar */}
                <div className="hidden md:flex items-center gap-3">
                    {onNavigateHome && (
                        <button
                            onClick={onNavigateHome}
                            className="px-4 py-2 border-2 border-black dark:border-white bg-blue-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-blue-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                        >
                            🏠 Home
                        </button>
                    )}

                    {onNavigateTimeline && (
                        <button
                            onClick={onNavigateTimeline}
                            className="px-4 py-2 border-2 border-black dark:border-white bg-purple-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-purple-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                        >
                            ⏳ Timeline
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

                    {!displayName && onLogin && (
                        <button
                            onClick={onLogin}
                            className="px-4 py-2 border-2 border-black dark:border-white bg-white text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-white transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                        >
                            Login
                        </button>
                    )}

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
            </div>
        </header >
    );
};
