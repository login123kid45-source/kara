import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import {
  emailPasswordSignIn,
  emailPasswordSignUp,
  ensureUserProfile,
  FIREBASE_PROJECT_ID,
  UserProfileData,
} from '../lib/firebase';
import type { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, profile: UserProfileData) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConsoleInfo, setShowConsoleInfo] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const derivedName = (displayName || cleanEmail.split('@')[0] || 'Explorer').trim();
      let user: User;
      if (authTab === 'signup') {
        user = await emailPasswordSignUp(cleanEmail, password, derivedName);
      } else {
        user = await emailPasswordSignIn(cleanEmail, password, derivedName);
      }

      const prof = await ensureUserProfile(user, displayName || undefined);
      onSuccess(user, prof);
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Incorrect password for this email account. Please try again.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters long.');
      } else {
        setErrorMsg(err?.message || 'Unable to sign in. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const consoleUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0F131C] border border-neutral-800 rounded-3xl p-6 text-neutral-100 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <span>Email & Password Authentication</span>
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              {authTab === 'signin' ? 'Sign In to KARA' : 'Create Your KARA Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            aria-label="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthTab('signin');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-medium rounded-xl transition-colors ${
              authTab === 'signin'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Email Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-medium rounded-xl transition-colors ${
              authTab === 'signup'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">
              Display Name {authTab === 'signin' && <span className="text-neutral-500">(optional)</span>}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should KARA address you?"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={authTab === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 p-1 text-neutral-500 hover:text-neutral-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {loading
                ? 'Signing in to KARA...'
                : authTab === 'signin'
                ? 'Sign In with Email & Password'
                : 'Create Account & Sign In'}
            </span>
          </button>
        </form>

        {/* Footer Info & Firebase Console Provider Guide */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
          <span>New emails are registered automatically</span>
          <button
            type="button"
            onClick={() => setShowConsoleInfo((s) => !s)}
            className="text-neutral-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Cloud Auth Settings</span>
          </button>
        </div>

        {showConsoleInfo && (
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 space-y-2">
            <p className="font-semibold text-white">
              Firebase Console Email/Password Provider:
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Your account works immediately. To also sync with Firebase Cloud Authentication in project{' '}
              <span className="font-mono text-neutral-200">{FIREBASE_PROJECT_ID}</span>, ensure{' '}
              <strong className="text-neutral-200">Email/Password</strong> is enabled under{' '}
              <strong className="text-neutral-200">Authentication &gt; Sign-in method</strong>.
            </p>
            <a
              href={consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:underline pt-1"
            >
              <span>Open Firebase Authentication Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
