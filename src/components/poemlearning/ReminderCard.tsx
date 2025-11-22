import React, { useState } from 'react';

interface ReminderCardProps {
  onSetReminder: () => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ onSetReminder }) => {
  const [reminder, setReminder] = useState(false);

  const handleToggle = () => {
    const newReminderState = !reminder;
    setReminder(newReminderState);
    if (newReminderState) {
      onSetReminder();
    }
  };

  return (
    <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-gray-800 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-2xl">
      <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">Stay Sharp</h3>
      <p className="mb-6 font-mono text-gray-700 dark:text-gray-300">Consistency is key. Set a daily reminder to practice and master the poem.</p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg text-black dark:text-white">Daily Reminder</span>
        <label htmlFor="reminder-toggle" className="cursor-pointer">
          <div className="relative">
            <input 
              id="reminder-toggle" 
              type="checkbox" 
              className="sr-only" 
              checked={reminder} 
              onChange={handleToggle} 
              role="switch"
              aria-checked={reminder}
            />
            <div className={`block w-14 h-8 rounded-full transition-all ${reminder ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-black dark:bg-white w-6 h-6 rounded-full transition-transform ${reminder ? 'transform translate-x-full' : ''}`}></div>
          </div>
        </label>
      </div>
    </div>
  );
};