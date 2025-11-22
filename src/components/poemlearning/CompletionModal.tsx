import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CompletionModalProps {
  onRestart: () => void;
  onChoosePoem: () => void;
  poemTitle: string;
  stats: {
    sentencesCompleted: number;
    totalSentences: number;
    hintsUsed: number;
    incorrectAttempts: number;
    totalTimeMs: number | null;
    sentenceStats: Array<{ index: number; hints: number; incorrectAttempts: number; durationMs: number }>;
  };
}

const formatDuration = (ms: number | null) => {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

export const CompletionModal: React.FC<CompletionModalProps> = ({ onRestart, onChoosePoem, poemTitle, stats }) => {
  const { sentencesCompleted, totalSentences, hintsUsed, incorrectAttempts, totalTimeMs, sentenceStats } = stats;

  // Fire confetti on mount
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    const text = `I just mastered "${poemTitle}" on Recito! 🧠✨ #LearnByHeart`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleCopyText = () => {
    const text = `I just mastered "${poemTitle}" on Recito! 🧠✨ #LearnByHeart`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full">
        <div className="bg-yellow-400 border-4 border-black dark:border-white p-8 text-center shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl">
          <h2 className="text-4xl font-black mb-2 text-black">🎉 MASTERY!</h2>
          <p className="text-xl font-bold mb-4 text-black">{poemTitle}</p>
          <p className="font-mono text-lg mb-8 text-black">
            You've completed this session. The words are strengthening in your memory. Keep practicing!
          </p>
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-xl p-4 mb-6 text-left">
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Session Summary</h3>
            <ul className="space-y-1 text-sm font-mono text-black dark:text-white">
              <li>Sentences mastered: {sentencesCompleted}/{totalSentences}</li>
              <li>Hints used: {hintsUsed}</li>
              <li>Incorrect attempts: {incorrectAttempts}</li>
              <li>Total time: {formatDuration(totalTimeMs)}</li>
            </ul>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-black dark:text-white mb-2 uppercase tracking-wide">Per Sentence</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {sentenceStats.map(({ index, hints, incorrectAttempts, durationMs }) => (
                  <div key={index} className="flex justify-between text-xs font-mono text-gray-700 dark:text-gray-300">
                    <span>Sentence {index + 1}</span>
                    <span>{hints} hints • {incorrectAttempts} misses • {formatDuration(durationMs)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={onRestart}
              className="w-full border-2 border-black dark:border-white bg-black text-yellow-400 font-bold py-3 px-6 hover:bg-white hover:text-black transition-all duration-150 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] active:shadow-none active:translate-x-1 active:translate-y-1 dark:hover:bg-black dark:hover:text-yellow-400 focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2 rounded-lg"
            >
              Practice Again
            </button>
            <button
              onClick={handleShare}
              className="w-full border-2 border-black dark:border-white bg-blue-400 text-black font-bold py-3 px-6 hover:bg-black hover:text-blue-400 transition-all duration-150 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] active:shadow-none active:translate-x-1 active:translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 rounded-lg"
            >
              📱 Share on X
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleLinkedInShare}
                className="flex-1 border-2 border-black dark:border-white bg-blue-700 text-white font-bold py-3 px-6 hover:bg-black hover:text-blue-700 transition-all duration-150 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] active:shadow-none active:translate-x-1 active:translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-2 rounded-lg"
              >
                in LinkedIn
              </button>
              <button
                onClick={handleCopyText}
                className="flex-1 border-2 border-black dark:border-white bg-gray-200 text-black font-bold py-3 px-6 hover:bg-black hover:text-white transition-all duration-150 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] active:shadow-none active:translate-x-1 active:translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
              >
                📋 Copy
              </button>
            </div>
            <button
              onClick={onChoosePoem}
              className="w-full border-2 border-black bg-white text-black font-bold py-3 px-6 hover:bg-gray-100 transition-all duration-150 shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded-lg"
            >
              Choose Different Poem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
