import React from 'react';
import { GameStatus } from '../types';
import { NeoButton } from './ui/NeoButton';

interface ControlsProps {
  status: GameStatus;
  isStageComplete: boolean;
  hasMistakes: boolean;
  onCheck: () => void;
  onHint: () => void;
  onRestart: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ status, isStageComplete, hasMistakes, onCheck, onHint, onRestart }) => {
  if (status !== GameStatus.Recalling) return null;

  const primaryStyles = 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black disabled:hover:bg-black disabled:hover:text-yellow-400 dark:bg-yellow-400 dark:text-black dark:hover:bg-black dark:hover:text-yellow-400';
  const secondaryStyles = 'bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 disabled:hover:bg-yellow-400 disabled:hover:text-black dark:bg-black dark:text-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-black';
  const tertiaryStyles = 'bg-white text-black hover:bg-yellow-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
      <NeoButton onClick={onHint} disabled={isStageComplete} className={primaryStyles}>
        Reveal Hint
        <span className="block text-xs font-mono font-normal opacity-70 mt-1">(H key)</span>
      </NeoButton>
      <NeoButton onClick={onCheck} disabled={isStageComplete} className={secondaryStyles}>
        Check Answers
        <span className="block text-xs font-mono font-normal opacity-70 mt-1">(Enter) • Esc to review</span>
      </NeoButton>
      {hasMistakes && (
        <NeoButton onClick={onRestart} className={`${tertiaryStyles} sm:col-span-2`}>
          Restart Sentence
          <span className="block text-xs font-mono font-normal opacity-70 mt-1">(R) • Clears your answers</span>
        </NeoButton>
      )}
    </div>
  );
};
