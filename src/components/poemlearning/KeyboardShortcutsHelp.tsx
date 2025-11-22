import React from 'react';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: Shortcut[];
}

const shortcutSections: ShortcutSection[] = [
  {
    title: 'Home Screen',
    shortcuts: [
      { keys: ['←', '→'], description: 'Browse through available poems' },
      { keys: ['Space', 'Enter'], description: 'Start memorizing the selected poem' },
    ]
  },
  {
    title: 'Memorizing',
    shortcuts: [
      { keys: ['Space', 'Enter'], description: 'Start recalling the sentence' },
      { keys: ['Esc'], description: 'Review sentence again' },
      { keys: ['←', '→'], description: 'Navigate sentences (when unlocked)' },
    ]
  },
  {
    title: 'Recalling',
    shortcuts: [
      { keys: ['Tab'], description: 'Move to next input field' },
      { keys: ['Shift', 'Tab'], description: 'Move to previous input field' },
      { keys: ['Enter'], description: 'Submit answers' },
      { keys: ['H'], description: 'Reveal hint for focused word' },
      { keys: ['R'], description: 'Restart sentence and clear answers' },
      { keys: ['Esc'], description: 'Return to memorizing mode' },
    ]
  },
  {
    title: 'Sentence Complete',
    shortcuts: [
      { keys: ['Space', 'Enter'], description: 'Continue to next sentence' },
      { keys: ['R'], description: 'Practice this sentence again' },
    ]
  },
  {
    title: 'Global',
    shortcuts: [
      { keys: ['?'], description: 'Toggle this help menu' },
      { keys: ['P'], description: 'Open poem selector' },
    ]
  }
];

const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
  <kbd className="px-2 py-1 text-sm font-mono bg-black dark:bg-white text-yellow-400 dark:text-black border-2 border-black dark:border-white rounded shadow-sm">
    {keyName}
  </kbd>
);

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
          aria-label="Close keyboard shortcuts"
          title="Close (Esc)"
        >
          ✕
        </button>
        <div className="h-full w-full flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
                ⌨️ Keyboard Shortcuts
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                Navigate faster with these keyboard shortcuts
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
          {shortcutSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xl font-bold mb-3 text-yellow-600 dark:text-yellow-400 border-b-2 border-black dark:border-white pb-2">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.shortcuts.map((shortcut, shortcutIdx) => (
                  <div
                    key={shortcutIdx}
                    className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  >
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-2 items-center">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <KeyBadge keyName={key} />
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t-2 border-black dark:border-white">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 text-center">
              Press <KeyBadge keyName="?" /> at any time to toggle this help menu
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
