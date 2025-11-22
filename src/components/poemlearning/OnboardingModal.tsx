import React, { useState } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  content: React.ReactNode;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Recito! 🎭',
      icon: '👋',
      description: 'Master poetry through progressive recall and spaced repetition',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
            This app helps you <strong className="text-black dark:text-white">memorize poems</strong> using a scientifically-proven technique called <strong className="text-black dark:text-white">progressive recall</strong>.
          </p>
          <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
              💡 <strong>The secret:</strong> We gradually hide more words as you practice, forcing your brain to actively recall—the most powerful way to build lasting memories.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'How It Works',
      icon: '📖',
      description: 'Simple 3-step process',
      content: (
        <div className="space-y-4">
          <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <h4 className="font-black text-black dark:text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">1️⃣</span> Memorize
            </h4>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              First, read the sentence with all words visible. Take your time.
            </p>
          </div>

          <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-black text-black dark:text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">2️⃣</span> Recall
            </h4>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              Words are hidden. Type them from memory through 4 progressive stages (1 word → 2 → 3 → all hidden).
            </p>
          </div>

          <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <h4 className="font-black text-black dark:text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">3️⃣</span> Repeat
            </h4>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              Move to the next sentence. Come back later to strengthen your memory!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Keyboard Shortcuts ⌨️',
      icon: '⚡',
      description: 'Navigate lightning-fast',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-4">
            This app is designed for <strong className="text-black dark:text-white">keyboard-first</strong> interaction:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">Space</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">Start / Check answers</span>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">Tab</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">Navigate inputs</span>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">H</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">Reveal hint</span>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">Esc</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">Back to memorizing</span>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">P</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">Change poem</span>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <kbd className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-sm rounded">?</kbd>
              <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">View all shortcuts</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Track Your Progress 📊',
      icon: '🎯',
      description: 'See how far you\'ve come',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
            Your progress is automatically saved and synced to the cloud:
          </p>

          <div className="space-y-3">
            <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-black text-black dark:text-white mb-2">📊 Stats Dashboard</h4>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                View your practice time, streaks, mastery progress, and detailed session history.
              </p>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
              <h4 className="font-black text-black dark:text-white mb-2">🏆 Leaderboard</h4>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                Compare your progress with other poetry enthusiasts in the community.
              </p>
            </div>

            <div className="border-2 border-black dark:border-white rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <h4 className="font-black text-black dark:text-white mb-2">💪 Word Strength</h4>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                Each correct recall strengthens a word (0-5). Reach level 5 to master it!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Begin! 🚀',
      icon: '🎉',
      description: 'Choose your first poem and start memorizing',
      content: (
        <div className="space-y-4">
          <div className="border-4 border-black dark:border-white rounded-xl p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30">
            <h4 className="font-black text-2xl text-black dark:text-white mb-3 text-center">
              Pro Tips for Success 💡
            </h4>
            <ul className="space-y-2 text-sm font-mono text-gray-800 dark:text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Practice daily for just 5-10 minutes to build consistency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Start with shorter poems to build confidence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Avoid using hints—struggle strengthens memory!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Review poems multiple times over several days</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-gray-700 dark:text-gray-300 font-mono text-lg font-bold">
            Click "Get Started" to choose your first poem! 📚
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white max-w-3xl w-full rounded-2xl shadow-[12px_12px_0px_#000] dark:shadow-[12px_12px_0px_#FFF] overflow-hidden">
        {/* Header */}
        <div className="border-b-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-600 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-1">
                {currentStepData.title}
              </h2>
              <p className="text-sm font-mono text-black dark:text-white opacity-80">
                {currentStepData.description}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-sm font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-3 py-1 rounded border-2 border-black dark:border-white hover:bg-black hover:text-yellow-400 dark:hover:bg-white dark:hover:text-black"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2 items-center justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${index === currentStep
                    ? 'w-8 bg-yellow-400'
                    : index < currentStep
                      ? 'w-2 bg-green-400'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
              />
            ))}
          </div>
          <p className="text-center text-xs font-mono text-gray-600 dark:text-gray-400 mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="text-center mb-6">
            <span className="text-6xl">{currentStepData.icon}</span>
          </div>
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black dark:border-white px-6 py-4 bg-gray-100 dark:bg-gray-800 flex justify-between items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-6 py-2 border-2 border-black dark:border-white bg-green-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-green-400 transition-all focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2"
              >
                Get Started! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
