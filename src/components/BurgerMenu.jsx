import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const BurgerMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            {/* Burger Button - Only visible on mobile */}
            <button
                onClick={toggleMenu}
                className="md:hidden px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop - Always show children */}
            <div className="hidden md:flex items-center gap-3 flex-nowrap">
                {children}
            </div>

            {/* Mobile - Show children in dropdown when open */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                        onClick={toggleMenu}
                        aria-hidden="true"
                    />

                    {/* Menu Panel */}
                    <div className="md:hidden absolute right-0 top-14 bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-lg shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] z-50 min-w-[200px] p-4">
                        <div className="flex flex-col gap-3">
                            {React.Children.map(children, (child) => {
                                if (!child) return null;

                                // Clone child and add onClick to close menu
                                return React.cloneElement(child, {
                                    onClick: (e) => {
                                        if (child.props.onClick) {
                                            child.props.onClick(e);
                                        }
                                        setIsOpen(false);
                                    },
                                    className: `${child.props.className || ''} w-full justify-center`
                                });
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
