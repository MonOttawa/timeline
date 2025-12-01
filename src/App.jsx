import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TimelineGenerator from './components/TimelineGenerator';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import AuthModal from './components/AuthModal';
import { Header } from './components/Header';
import { LearningAssistant } from './components/LearningAssistant';
import PublicTimeline from './components/PublicTimeline';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'dashboard', 'editor', 'learning'
  const [showLegal, setShowLegal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [publicSlug, setPublicSlug] = useState(null);
  const [publicRecordId, setPublicRecordId] = useState(null);
  const [publicStyle, setPublicStyle] = useState(null);
  const [embedMode, setEmbedMode] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check for public timeline URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const timelineMatch = path.match(/^\/timeline\/([^/]+)\/?$/);
    const embedMatch = path.match(/^\/embed\/([^/]+)\/?$/);
    const params = new URLSearchParams(window.location.search);
    const recordIdParam = params.get('rid');
    const embedParam = params.get('embed');
    const styleParamRaw = params.get('style');
    const styleParam = styleParamRaw ? styleParamRaw.toLowerCase() : null;

    if (timelineMatch) {
      setPublicSlug(timelineMatch[1]);
    } else if (embedMatch) {
      setPublicSlug(embedMatch[1]);
      setEmbedMode(true);
    }

    if (recordIdParam) {
      setPublicRecordId(recordIdParam);
    }

    if (embedParam === '1') {
      setEmbedMode(true);
    }

    if (styleParam) {
      const allowed = ['bauhaus', 'neo-brutalist', 'corporate', 'handwritten'];
      if (allowed.includes(styleParam)) {
        setPublicStyle(styleParam);
      }
    }
  }, []);

  // Tweak page chrome for embeds (transparent background, no overflow tweaks)
  useEffect(() => {
    if (embedMode) {
      const originalBodyBg = document.body.style.backgroundColor;
      const originalHtmlBg = document.documentElement.style.backgroundColor;
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      return () => {
        document.body.style.backgroundColor = originalBodyBg;
        document.documentElement.style.backgroundColor = originalHtmlBg;
      };
    }
    return undefined;
  }, [embedMode]);

  // Redirect to dashboard on login
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    } else if (!user && currentView === 'dashboard') {
      setCurrentView('landing');
    }
  }, [user, currentView]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentView('landing');
    setIsDemoMode(false);
  };

  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
    setIsDemoMode(false);
  };

  const handleStartDemo = () => {
    setCurrentView('editor');
    setIsDemoMode(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavigateHome = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
  };

  const handleNavigateTimeline = () => {
    setCurrentView('editor');
    setEditingTimeline(null); // Reset editing state for new timeline
  };

  const handleNavigateLearning = () => {
    setCurrentView('learning');
  };

  const handleEditTimeline = (timeline) => {
    setEditingTimeline(timeline);
    setCurrentView('editor');
  };

  const handleCreateTimeline = () => {
    setEditingTimeline(null);
    setCurrentView('editor');
  };

  const appShell = (
    <div className={`min-h-screen bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-200`}>
      {(!(publicSlug || publicRecordId) && !embedMode) && (
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          userEmail={user?.email || null}
          onLogout={user ? handleLogout : null}
          onNavigateHome={handleNavigateHome}
          onNavigateTimeline={currentView !== 'editor' ? handleNavigateTimeline : null}
          onNavigateLearning={currentView !== 'learning' ? handleNavigateLearning : null}
          onLogin={!user ? handleLogin : null}
          showDashboard={!!user}
        />
      )}

      <main className={`${embedMode ? '' : 'container mx-auto px-4 pb-12'}`}>
        {publicSlug || publicRecordId ? (
          <ErrorBoundary
            fallback={() => (
              <div className="max-w-4xl mx-auto mt-12 p-6 text-center border-4 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                <h2 className="text-2xl font-black mb-2 font-display">Unable to load timeline</h2>
                <p className="text-gray-600 dark:text-gray-400">Please refresh or check the link.</p>
              </div>
            )}
          >
            <PublicTimeline
              slug={publicSlug}
              recordId={publicRecordId}
              embedMode={embedMode}
              styleOverride={publicStyle}
              onCreateOwn={() => {
                setPublicSlug(null);
                setPublicRecordId(null);
                setPublicStyle(null);
                window.history.pushState({}, '', '/');
                setCurrentView('landing');
                setEmbedMode(false);
              }}
            />
          </ErrorBoundary>
        ) : showLegal ? (
          <TermsAndPrivacy onBack={() => setShowLegal(false)} />
        ) : currentView === 'learning' ? (
          <LearningAssistant />
        ) : currentView === 'dashboard' && user ? (
          <Dashboard
            user={user}
            onEdit={handleEditTimeline}
            onCreate={handleCreateTimeline}
            onShare={(t) => {
              // For now, just open editor to share. 
              // Ideally Dashboard would have its own share modal, but we can reuse the editor's for now or implement later.
              handleEditTimeline(t);
            }}
          />
        ) : currentView === 'editor' ? (
          <TimelineGenerator
            isDemoMode={isDemoMode}
            initialTimeline={editingTimeline}
            onBack={() => setCurrentView('dashboard')}
          />
        ) : (
          <LandingPage
            onStart={user ? () => setCurrentView('dashboard') : handleStartDemo}
            onLogin={handleLogin}
            isLoggedIn={!!user}
            onShowLegal={() => setShowLegal(true)}
          />
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

  return appShell;
}

export default App;
