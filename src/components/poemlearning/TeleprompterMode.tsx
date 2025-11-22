import React, { useState, useEffect, useRef } from 'react';
import type { ScriptMetadata } from '../scriptsLibrary';

interface TeleprompterModeProps {
    script: ScriptMetadata;
    onClose: () => void;
}

export const TeleprompterMode: React.FC<TeleprompterModeProps> = ({ script, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(150); // Words per minute
    const [progress, setProgress] = useState(0); // 0-100
    const [fontSize, setFontSize] = useState(24);
    const [mirrorMode, setMirrorMode] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();

    const words = script.text.split(/\s+/);
    const totalWords = words.length;



    const speedRef = useRef(speed);
    const scrollAccumulatorRef = useRef(0);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    // Auto-scroll effect
    useEffect(() => {
        if (!isPlaying || !containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const text = textRef.current;
        // Initialize accumulator with current scroll position
        scrollAccumulatorRef.current = container.scrollTop;

        let lastTimestamp = 0;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Calculate current speed based on ref
            const wordsPerSecond = speedRef.current / 60;
            const avgPixelsPerWord = fontSize * 0.6;
            const scrollSpeed = wordsPerSecond * avgPixelsPerWord;

            // Scroll by calculated amount
            const scrollAmount = (scrollSpeed * delta) / 1000;

            // Use accumulator for sub-pixel precision
            scrollAccumulatorRef.current += scrollAmount;
            container.scrollTop = scrollAccumulatorRef.current;

            // Update progress
            const maxScroll = text.scrollHeight - container.clientHeight;
            const currentProgress = (container.scrollTop / maxScroll) * 100;
            setProgress(Math.min(100, Math.max(0, currentProgress)));

            // Stop at end
            if (container.scrollTop >= maxScroll) {
                setIsPlaying(false);
                return;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, fontSize]); // Removed speed from dependency to prevent loop restart

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSpeed(prev => Math.min(300, prev + 10));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSpeed(prev => Math.max(50, prev - 10));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (containerRef.current) {
                        containerRef.current.scrollTop -= 100;
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (containerRef.current) {
                        containerRef.current.scrollTop += 100;
                    }
                    break;
                case 'Escape':
                    onClose();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    setFontSize(prev => Math.min(48, prev + 2));
                    break;
                case '-':
                    e.preventDefault();
                    setFontSize(prev => Math.max(16, prev - 2));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleContainerClick = () => {
        setIsPlaying(prev => !prev);
    };

    const handleReset = () => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setProgress(0);
            setIsPlaying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[300] flex flex-col">
            {/* Progress Bar */}
            <div className="h-1 bg-gray-800">
                <div
                    className="h-full bg-yellow-400 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Teleprompter Text */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden cursor-pointer"
                onClick={handleContainerClick}
                style={{
                    scrollBehavior: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <div className="min-h-screen flex items-start justify-center pt-[40vh] pb-[60vh] px-8">
                    <div
                        ref={textRef}
                        className="max-w-4xl text-white leading-relaxed"
                        style={{
                            fontSize: `${fontSize}px`,
                            transform: mirrorMode ? 'scaleX(-1)' : 'none',
                            textAlign: 'center',
                            lineHeight: '1.8'
                        }}
                    >
                        {script.text}
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-gray-900 border-t-2 border-gray-700 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    {/* Left: Play/Pause & Reset */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 border-2 border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#FFF] hover:bg-white hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400"
                            title="Play/Pause (Space)"
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 border-2 border-white bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all focus:outline-none"
                            title="Reset to beginning"
                        >
                            ⏮ Reset
                        </button>
                    </div>

                    {/* Center: Speed Control */}
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center gap-3">
                            <label className="text-white font-bold text-sm whitespace-nowrap">
                                Speed: {speed} WPM
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="300"
                                step="10"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* Right: Font Size & Options */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                                className="w-8 h-8 border border-white bg-gray-800 text-white font-bold rounded hover:bg-gray-700"
                                title="Decrease font size (-)"
                            >
                                A-
                            </button>
                            <span className="text-white text-sm font-mono">{fontSize}px</span>
                            <button
                                onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
                                className="w-8 h-8 border border-white bg-gray-800 text-white font-bold rounded hover:bg-gray-700"
                                title="Increase font size (+)"
                            >
                                A+
                            </button>
                        </div>

                        <button
                            onClick={() => setMirrorMode(!mirrorMode)}
                            className={`px-3 py-2 border-2 border-white font-bold rounded-lg transition-all focus:outline-none ${mirrorMode
                                ? 'bg-yellow-400 text-black'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                }`}
                            title="Mirror mode for physical teleprompters"
                        >
                            🪞 Mirror
                        </button>

                        <button
                            onClick={onClose}
                            className="px-4 py-2 border-2 border-white bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all focus:outline-none focus:ring-4 focus:ring-red-400"
                            title="Exit (Esc)"
                        >
                            ✕ Exit
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts Help */}
                <div className="mt-3 text-center text-xs text-gray-400 font-mono">
                    <span className="mr-4">Space: Play/Pause</span>
                    <span className="mr-4">↑↓: Speed</span>
                    <span className="mr-4">←→: Scroll</span>
                    <span className="mr-4">+/-: Font Size</span>
                    <span>Esc: Exit</span>
                </div>
            </div>
        </div>
    );
};
