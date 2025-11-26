import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TimelineGenerator from './components/TimelineGenerator';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import AuthModal from './components/AuthModal';
import { Header } from './components/Header';
import { LearningAssistant } from './components/LearningAssistant';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, signOut } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
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
    setShowLearning(false);
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

  const handleNavigateHome = () => {
    setShowApp(false);
    setShowLearning(false);
  };

  const handleNavigateTimeline = () => {
    setShowApp(true);
    setShowLearning(false);
  };

  const handleNavigateLearning = () => {
    setShowLearning(true);
    setShowApp(false);
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-200`}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        userEmail={user?.email || null}
        onLogout={user ? handleLogout : null}
        onNavigateHome={showApp || showLearning ? handleNavigateHome : null}
        onNavigateTimeline={(!showApp && user) || showLearning ? handleNavigateTimeline : null}
        onNavigateLearning={!showLearning ? handleNavigateLearning : null}
        onLogin={!user ? handleLogin : null}
      />

      <main className="container mx-auto px-4 pb-12">
        {showLegal ? (
          <TermsAndPrivacy onBack={() => setShowLegal(false)} />
        ) : showLearning ? (
          <LearningAssistant />
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
