'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import HuntBuddyLogo from '../hunt-buddy-logo';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24C18.34 15.9 19.6 13.26 19.6 10.23z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.97-.9 6.62-2.43l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.12H1.07v2.6A10 10 0 0 0 10 20z" fill="#34A853"/>
    <path d="M4.41 11.89A6.01 6.01 0 0 1 4.1 10c0-.66.11-1.3.31-1.89V5.51H1.07A10 10 0 0 0 0 10c0 1.61.39 3.13 1.07 4.49l3.34-2.6z" fill="#FBBC05"/>
    <path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.96.99 12.69 0 10 0A10 10 0 0 0 1.07 5.51l3.34 2.6C5.2 5.71 7.4 3.96 10 3.96z" fill="#EA4335"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        alert('Account created! Check your email or log in.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This will redirect the user back to your app after authentication
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
    // No need to set loading to false on success, as the page will redirect.
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#f5f8ff' }}
    >
      {/* left decorative panel */}
      <div
        className="hidden lg:flex flex-col p-12 w-[480px] flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%)' }}
      >
        <div className="flex items-center gap-3">
          <HuntBuddyLogo size={36} />
          <span className="text-white font-bold text-xl tracking-tight">Hunt Buddy</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-white/50 text-sm uppercase tracking-widest font-medium mb-4">Your hunt. Organized.</p>
          <h2 className="text-white text-4xl font-bold leading-tight mb-6">
            Track every lead,<br />close every deal.
          </h2>
          <p className="text-blue-200 text-base leading-relaxed max-w-xs">
            Hunt Buddy keeps your pipeline sharp — manage prospects, follow-ups, and wins all in one place.
          </p>
        </div>
      </div>

      {/* right: form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">

          {/* mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <HuntBuddyLogo size={36} />
            <span className="font-bold text-xl text-gray-900 tracking-tight">Hunt Buddy</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p className="text-gray-500 text-sm">{isSignUp ? 'Start tracking your job applications' : 'Sign in to your Hunt Buddy account'}</p>
          </div>

          {/* Error Alert Message */}
          {errorMsg && (
            <div className="mb-5 text-sm text-red-600 bg-red-100 border border-red-200 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border text-sm font-medium text-gray-700 transition-all duration-150 mb-5 disabled:opacity-50"
            style={{
              background: '#ffffff',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => {
              if (loading) return;
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
            }}
            onMouseLeave={e => {
              if (loading) return;
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
          </div>

          {/* form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {/* email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all duration-150"
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${emailFocus ? '#2563eb' : '#e2e8f0'}`,
                  boxShadow: emailFocus ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            {/* password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                {!isSignUp && (
                  <a
                    href="#"
                    className="text-xs font-medium transition-colors"
                    style={{ color: '#2563eb' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#2563eb')}>
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all duration-150 pr-11"
                  style={{
                    background: '#ffffff',
                    border: `1.5px solid ${passFocus ? '#2563eb' : '#e2e8f0'}`,
                    boxShadow: passFocus ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: '#94a3b8' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 mt-1 disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.45)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.35)')}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* sign up / sign in toggle */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="font-semibold transition-colors"
              style={{ color: '#2563eb' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#2563eb')}
            >
              {isSignUp ? 'Sign in' : 'Sign up for free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
