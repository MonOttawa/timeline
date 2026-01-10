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
import SettingsModal from './components/SettingsModal';
import ToastContainer from './components/Toast';
import TimelineRender from './components/TimelineRender';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, signOut } = useAuth();
  const [viewOverride, setViewOverride] = useState(null); // null falls back to auth-derived view
  const [showLegal, setShowLegal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const initialRouteState = React.useMemo(() => {
    const path = window.location.pathname;
    const timelineMatch = path.match(/^\/timeline\/([^/]+)\/?$/);
    const embedMatch = path.match(/^\/embed\/([^/]+)\/?$/);
    const params = new URLSearchParams(window.location.search);
    const recordIdParam = params.get('rid');
    const embedParam = params.get('embed');
    const styleParamRaw = params.get('style');
    const styleParam = styleParamRaw ? styleParamRaw.toLowerCase() : null;
    const decodePathSegment = (value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const route = {
      publicSlug: null,
      publicRecordId: null,
      publicStyle: null,
      embedMode: false,
      renderMode: path === '/render'
    };

    if (timelineMatch) {
      route.publicSlug = decodePathSegment(timelineMatch[1]);
    } else if (embedMatch) {
      route.publicSlug = decodePathSegment(embedMatch[1]);
      route.embedMode = true;
    }

    if (recordIdParam) {
      route.publicRecordId = recordIdParam;
    }

    if (embedParam === '1') {
      route.embedMode = true;
    }

    if (styleParam) {
      const allowed = ['bauhaus', 'bauhaus-mono', 'neo-brutalist', 'corporate', 'handwritten'];
      if (allowed.includes(styleParam)) {
        route.publicStyle = styleParam;
      }
    }

    return route;
  }, []);
  const [publicSlug, setPublicSlug] = useState(initialRouteState.publicSlug);
  const [publicRecordId, setPublicRecordId] = useState(initialRouteState.publicRecordId);
  const [publicStyle, setPublicStyle] = useState(initialRouteState.publicStyle);
  const [embedMode, setEmbedMode] = useState(initialRouteState.embedMode);
  const [renderMode] = useState(initialRouteState.renderMode);
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [editingLearningItem, setEditingLearningItem] = useState(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const currentView = viewOverride || (user ? 'dashboard' : 'landing');

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    setViewOverride('landing');
    setIsDemoMode(false);
  };

  const handleAuthSuccess = () => {
    setViewOverride('dashboard');
    setIsDemoMode(false);
  };

  const handleStartDemo = () => {
    setViewOverride('editor');
    setIsDemoMode(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavigateHome = () => {
    setViewOverride(null); // fall back to auth-derived view
  };

  const handleNavigateTimeline = () => {
    setViewOverride('editor');
    setEditingTimeline(null); // Reset editing state for new timeline
  };

  const handleNavigateLearning = () => {
    setEditingLearningItem(null); // Clear any previously loaded learning item
    setViewOverride('learning');
  };

  const handleEditTimeline = (timeline) => {
    setEditingTimeline(timeline);
    setViewOverride('editor');
  };

  const handleCreateTimeline = () => {
    setEditingTimeline(null);
    setViewOverride('editor');
  };

  const appShell = renderMode ? (
    <TimelineRender />
  ) : (
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
          onNavigateSettings={() => setShowSettingsModal(true)}
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
                setViewOverride('landing');
                setEmbedMode(false);
              }}
            />
          </ErrorBoundary>
        ) : showLegal ? (
          <TermsAndPrivacy onBack={() => setShowLegal(false)} />
        ) : currentView === 'learning' ? (
          <ErrorBoundary>
            <LearningAssistant initialItem={editingLearningItem} />
          </ErrorBoundary>
        ) : currentView === 'dashboard' && user ? (
          <Dashboard
            user={user}
            onEdit={handleEditTimeline}
            onCreate={handleCreateTimeline}
            onEditLearning={(item) => {
              // Navigate to Learning Assistant and load the saved learning material
              setEditingLearningItem(item);
              setViewOverride('learning');
            }}
            onShare={(t) => {
              // For now, just open editor to share. 
              // Ideally Dashboard would have its own share modal, but we can reuse the editor's for now or implement later.
              handleEditTimeline(t);
            }}
          />
        ) : currentView === 'editor' ? (
          <ErrorBoundary>
            <TimelineGenerator
              isDemoMode={isDemoMode}
              initialTimeline={editingTimeline}
              onBack={() => setViewOverride('dashboard')}
            />
          </ErrorBoundary>
        ) : (
          <LandingPage
            onStart={user ? () => setViewOverride('dashboard') : handleStartDemo}
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

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      <ToastContainer />
    </div>
  );

  return appShell;
}

export default App;
