import React, { useState } from 'react';

interface AuthGateProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onRegister: (email: string, password: string, name: string) => Promise<void> | void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLogin, onRegister, isLoading, errorMessage }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!email.trim() || !password) return;

    if (mode === 'register') {
      // Validation for registration
      if (!name.trim()) {
        setValidationError('Name is required');
        return;
      }
      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
      await onRegister(email.trim(), password, name.trim());
    } else {
      await onLogin(email.trim(), password);
    }
  };

  const isDisabled = isLoading || !email.trim() || password.length === 0 ||
    (mode === 'register' && (!name.trim() || !confirmPassword));

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border-4 border-black dark:border-white rounded-2xl bg-white dark:bg-gray-800 shadow-[10px_10px_0px_#000] dark:shadow-[10px_10px_0px_#FFF] p-8 space-y-6"
      >
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-black text-black dark:text-white">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
            {mode === 'login'
              ? 'Enter your credentials to access Recito.'
              : 'Create a new account to start memorizing poems.'}
          </p>
        </header>

        <div className="space-y-4">
          {mode === 'register' && (
            <label className="block text-left">
              <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                Name
              </span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                className="mt-1 w-full border-2 border-black dark:border-white rounded-lg px-3 py-2 font-mono text-black dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                placeholder="Your Name"
                required={mode === 'register'}
              />
            </label>
          )}
          <label className="block text-left">
            <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wide">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-1 w-full border-2 border-black dark:border-white rounded-lg px-3 py-2 font-mono text-black dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
              placeholder="user@example.com"
              required
            />
          </label>

          <label className="block text-left">
            <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wide">
              Password
            </span>
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-1 w-full border-2 border-black dark:border-white rounded-lg px-3 py-2 font-mono text-black dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
              placeholder="••••••••"
              required
            />
            {mode === 'register' && (
              <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                Must be at least 8 characters
              </p>
            )}
          </label>

          {mode === 'register' && (
            <label className="block text-left">
              <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                Confirm Password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="mt-1 w-full border-2 border-black dark:border-white rounded-lg px-3 py-2 font-mono text-black dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
                placeholder="••••••••"
                required={mode === 'register'}
              />
            </label>
          )}

          {(errorMessage || validationError) && (
            <p role="alert" className="text-sm font-mono text-red-600 dark:text-red-400">
              {validationError || errorMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full border-2 border-black dark:border-white bg-yellow-400 text-black font-bold py-3 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading
            ? mode === 'register' ? 'Creating account…' : 'Signing in…'
            : mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>

        <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setValidationError(null);
            }}
            className="mt-2 font-bold text-black dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            {mode === 'login' ? 'Create an account' : 'Sign in instead'}
          </button>
        </div>
      </form>
    </div>
  );
};
