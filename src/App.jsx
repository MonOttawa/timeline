import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TimelineGenerator from './components/TimelineGenerator';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import { Header } from './components/poemlearning/Header';

function App() {
  const [showApp, setShowApp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowApp(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-200`}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        userEmail={isLoggedIn ? "user@example.com" : null}
        onLogout={isLoggedIn ? () => { setIsLoggedIn(false); setShowApp(false); } : null}
        onNavigateHome={showApp ? () => setShowApp(false) : null}
        onNavigateTimeline={!showApp && isLoggedIn ? () => setShowApp(true) : null}
        onLogin={!isLoggedIn ? handleLogin : null}
      />

      <main className="container mx-auto px-4 pb-12">
        {showLegal ? (
          <TermsAndPrivacy onBack={() => setShowLegal(false)} />
        ) : !showApp ? (
          <LandingPage
            onStart={() => setShowApp(true)}
            onLogin={handleLogin}
            isLoggedIn={isLoggedIn}
            onShowLegal={() => setShowLegal(true)}
          />
        ) : (
          <TimelineGenerator />
        )}
      </main>
    </div>
  );
}

export default App;
