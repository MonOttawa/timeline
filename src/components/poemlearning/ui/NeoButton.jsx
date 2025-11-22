import React from 'react';

/**
 * Neo-brutalist styled button with consistent focus indicators for accessibility
 */
export const NeoButton = ({
    onClick,
    children,
    className = '',
    disabled = false,
    type = 'button'
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`w-full border-2 border-black dark:border-white font-bold py-3 px-6
      transition-all duration-150
      shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]
      active:shadow-none active:translate-x-1 active:translate-y-1
      focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      disabled:active:shadow-[4px_4px_0px_#000] disabled:active:shadow-[4px_4px_0px_#FFF]
      disabled:active:translate-x-0 disabled:active:translate-y-0
      rounded-lg dark:bg-green-600 dark:text-white ${className}`}
    >
        {children}
    </button>
);
