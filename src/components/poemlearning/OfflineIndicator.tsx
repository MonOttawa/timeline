import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and notification not showing
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div
        className={`px-4 py-2 rounded-lg border-2 font-bold text-sm shadow-lg ${
          isOnline
            ? 'bg-green-400 border-black text-black'
            : 'bg-orange-400 border-black text-black'
        }`}
      >
        {isOnline ? (
          <span>✅ Back online</span>
        ) : (
          <span>📴 Offline mode - Your data is saved locally</span>
        )}
      </div>
    </div>
  );
};
