import React, { useState } from 'react';

interface ProfileSettingsProps {
  onClose: () => void;
  userName: string | null;
  userEmail: string | null;
  onUpdateProfile?: (updates: { name?: string; email?: string }) => Promise<void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  onClose,
  userName,
  userEmail,
  onUpdateProfile,
  onChangePassword,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { name?: string; email?: string } = {};
      if (name !== userName) updates.name = name;
      if (email !== userEmail) updates.email = email;

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        setIsLoading(false);
        return;
      }

      await onUpdateProfile(updates);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onChangePassword) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await onChangePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-2xl shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-white bg-gray-100 dark:bg-gray-900">
          <h2 className="text-2xl font-black text-black dark:text-white">
            👤 Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="text-3xl font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 rounded transition-colors bg-white dark:bg-gray-800 w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
            aria-label="Close profile settings"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black dark:border-white">
          <button
            onClick={() => {
              setActiveTab('profile');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 px-6 py-3 font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-yellow-400 text-black'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 px-6 py-3 font-bold transition-all border-l-2 border-black dark:border-white ${
              activeTab === 'password'
                ? 'bg-yellow-400 text-black'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-mono text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-mono text-sm">{success}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="Your name"
                  required
                />
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                  This is how your name appears on the leaderboard
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                  Used for login and account recovery
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !onUpdateProfile}
                className="w-full px-6 py-3 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !onChangePassword}
                className="w-full px-6 py-3 border-2 border-black dark:border-white bg-yellow-400 text-black font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black hover:text-yellow-400 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
