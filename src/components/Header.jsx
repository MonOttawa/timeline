import React from "react";
import { ChartNoAxesGantt, Moon, Sun, Sparkles } from "lucide-react";
import logo from "../assets/timelinelogo.svg";
import { BurgerMenu } from "./BurgerMenu";

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
}) => {
    const displayName =
        userName && userName.trim().length > 0
            ? userName
            : userEmail
                ? userEmail.split("@")[0].split(/[._-]/)[0]
                : null;

    return (
        <header className="w-full mb-4 md:mb-8 px-4 pb-2 pt-4">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                <div
                    className="flex items-center cursor-pointer"
                    onClick={onNavigateHome}
                >
                    <img
                        src={logo}
                        alt="Markdown Timeline logo"
                        className="h-[50px] w-auto"
                    />
                </div>

                <div className="flex-1 flex items-center gap-3 justify-end">
                    <div
                        id="header-toolbar-slot"
                        className="hidden md:flex items-center gap-2 flex-nowrap"
                    />

                    <BurgerMenu>
                        <button
                            onClick={onToggleTheme}
                            className="px-4 py-2 border-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-300 dark:hover:bg-black dark:hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                            aria-label={
                                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
                            }
                            title={
                                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
                            }
                        >
                            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {onNavigateTimeline && (
                            <button
                                onClick={onNavigateTimeline}
                                className="px-4 py-2 border-2 border-black dark:border-white bg-purple-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-purple-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                            >
                                <ChartNoAxesGantt size={20} className="inline" /> Timeline
                            </button>
                        )}

                        {onNavigateLearning && (
                            <button
                                onClick={onNavigateLearning}
                                className="px-4 py-2 border-2 border-black dark:border-white bg-pink-300 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-pink-300 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                            >
                                <Sparkles size={20} className="inline" /> Learning
                            </button>
                        )}

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
                    </BurgerMenu>

                </div>
            </div>
        </header >
    );
};
