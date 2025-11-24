import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TimelineGenerator from './components/TimelineGenerator';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import AuthModal from './components/AuthModal';
import { Header } from './components/Header';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, signOut } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    setShowApp(false);
    setIsDemoMode(false);
  };

  const handleAuthSuccess = () => {
    setShowApp(true);
    setIsDemoMode(false);
  };

  const handleStartDemo = () => {
    setShowApp(true);
    setIsDemoMode(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-200`}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        userEmail={user?.email || null}
        onLogout={user ? handleLogout : null}
        onNavigateHome={showApp ? () => setShowApp(false) : null}
        onNavigateTimeline={!showApp && user ? () => setShowApp(true) : null}
        onLogin={!user ? handleLogin : null}
      />

      <main className="container mx-auto px-4 pb-12">
        {showLegal ? (
          <TermsAndPrivacy onBack={() => setShowLegal(false)} />
        ) : !showApp ? (
          <LandingPage
            onStart={user ? () => setShowApp(true) : handleStartDemo}
            onLogin={handleLogin}
            isLoggedIn={!!user}
            onShowLegal={() => setShowLegal(true)}
          />
        ) : (
          <TimelineGenerator isDemoMode={isDemoMode} />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
