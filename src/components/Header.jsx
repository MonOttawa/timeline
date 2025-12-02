import React, { useState, useRef, useEffect } from "react";
import { ChartNoAxesGantt, Moon, Sun, Sparkles, ChevronDown, Settings, LogOut, LayoutGrid } from "lucide-react";
import { BurgerMenu } from "./BurgerMenu";
import newLogo from '../assets/newlogo.png';

export const Header = ({
    theme,
    onToggleTheme,
    userEmail,
    userName,
    onLogout,
    onNavigateHome,
    onNavigateTimeline,
    onNavigateLearning,
    onLogin,
    onNavigateSettings,
    showDashboard
}) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const displayName =
        userName && userName.trim().length > 0
            ? userName
            : userEmail
                ? userEmail.split("@")[0].split(/[._-]/)[0]
                : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="w-full mb-4 md:mb-8 px-8 md:px-12 lg:px-16 pb-2 pt-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                    <div
                        className="flex items-center cursor-pointer bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg px-3 py-2 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all h-12 md:h-12"
                        onClick={onNavigateHome}
                    >
                        <img
                            src={newLogo}
                            alt="Substantifique Logo"
                            className="h-[26px] md:h-[30px] w-auto"
                        />
                        <span className="font-display font-bold text-lg tracking-wider ml-3 hidden md:block">SUBSTANTIFIQUE</span>
                    </div>

                    <div className="flex-1 flex items-center gap-3 justify-end">
                        <div
                            id="header-toolbar-slot"
                            className="hidden md:flex items-center gap-2 flex-nowrap"
                        />

                        <BurgerMenu>
                            {showDashboard && onNavigateHome && (
                                <button
                                    onClick={onNavigateHome}
                                    className="h-12 px-4 border-2 border-black dark:border-white bg-blue-300 text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center"
                                >
                                    <LayoutGrid size={20} className="inline" /> Dashboard
                                </button>
                            )}

                            {onNavigateTimeline && (
                                <button
                                    onClick={onNavigateTimeline}
                                    className="h-12 px-4 border-2 border-black dark:border-white bg-purple-300 text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center"
                                >
                                    <ChartNoAxesGantt size={20} className="inline" /> Timeline
                                </button>
                            )}

                            {onNavigateLearning && (
                                <button
                                    onClick={onNavigateLearning}
                                    className="h-12 px-4 border-2 border-black dark:border-white bg-pink-300 text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center"
                                >
                                    <Sparkles size={20} className="inline" /> Learning
                                </button>
                            )}

                            {!displayName && onLogin && (
                                <button
                                    onClick={onLogin}
                                    className="h-12 px-4 border-2 border-black dark:border-white bg-white text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center"
                                >
                                    Login
                                </button>
                            )}

                            {displayName && (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-mono text-sm font-semibold rounded-lg px-3 h-12 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                                        aria-label="User menu"
                                    >
                                        <span
                                            className="truncate max-w-[12rem]"
                                            title={userEmail ?? displayName}
                                        >
                                            {displayName}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 border-2 border-black dark:border-white bg-white dark:bg-gray-700 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] overflow-hidden z-50">
                                            {onNavigateSettings && (
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        onNavigateSettings();
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b-2 border-black dark:border-white"
                                                >
                                                    <Settings size={18} />
                                                    <span className="font-semibold">Settings</span>
                                                </button>
                                            )}
                                            {onLogout && (
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        onLogout();
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <LogOut size={18} />
                                                    <span className="font-semibold">Log out</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={onToggleTheme}
                                className="h-12 px-4 border-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-400 text-black font-bold rounded-lg shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 flex items-center justify-center"
                                aria-label={
                                    theme === "light" ? "Switch to dark mode" : "Switch to light mode"
                                }
                                title={
                                    theme === "light" ? "Switch to dark mode" : "Switch to light mode"
                                }
                            >
                                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                        </BurgerMenu>

                    </div>
                </div>
            </div>
        </header >
    );
};
