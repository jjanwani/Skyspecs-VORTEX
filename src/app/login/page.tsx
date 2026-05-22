'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformUsers } from '@/lib/userStore';
import Script from 'next/script';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function decodeGoogleJwt(token: string): { email: string; name: string; picture?: string } {
  const payload = token.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

function DroneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <line x1="9" y1="9" x2="5" y2="5" />
      <line x1="15" y1="9" x2="19" y2="5" />
      <line x1="9" y1="15" x2="5" y2="19" />
      <line x1="15" y1="15" x2="19" y2="19" />
      <circle cx="3.5" cy="3.5" r="2" />
      <circle cx="20.5" cy="3.5" r="2" />
      <circle cx="3.5" cy="20.5" r="2" />
      <circle cx="20.5" cy="20.5" r="2" />
    </svg>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: '#060D1F' }}
    >
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,201,167,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,201,167,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow orbs */}
      <div
        className="absolute -top-32 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,201,167,0.10) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,140,200,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(0,201,167,0.08)',
              border: '1px solid rgba(0,201,167,0.30)',
              boxShadow: '0 0 32px rgba(0,201,167,0.14)',
            }}
          >
            <DroneIcon className="w-8 h-8 text-teal-400" />
          </div>
          <h1
            className="text-3xl font-black tracking-[0.35em] text-white mb-2"
          >
            VORTEX
          </h1>
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(0,201,167,0.35))' }} />
            <span className="text-xs font-medium" style={{ color: '#00C9A7' }}>by SkySpecs</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(0,201,167,0.35))' }} />
          </div>
          <p className="text-xs text-gray-500">Visual Operations & Real-Time Equipment Execution</p>
        </div>

        {children}

        <p className="text-center text-xs text-gray-600 mt-5">
          Access is managed by your administrator
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const handleCredential = (response: { credential: string }) => {
    const { email, name } = decodeGoogleJwt(response.credential);
    const users = getPlatformUsers();
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const user = match ?? {
      id: `u-${email.split('@')[0]}`,
      name: name ?? email.split('@')[0],
      email,
      role: 'admin' as const,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    login(user);
    localStorage.setItem('authenticated', 'true');
    router.push('/');
  };

  const initGoogle = () => {
    if (!window.google || !CLIENT_ID) return;
    window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  };

  useEffect(() => { if (scriptReady) initGoogle(); }, [scriptReady]);

  if (!CLIENT_ID) return <EmailLogin />;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => { setScriptReady(true); initGoogle(); }}
      />
      <LoginShell>
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(10, 20, 45, 0.85)',
            border: '1px solid rgba(0,201,167,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {!denied ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">Sign in with your SkySpecs account</p>
              <div ref={buttonRef} className="flex justify-center" />
            </div>
          ) : (
            <div className="text-center space-y-3 py-1">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-red-400 text-base">✕</span>
              </div>
              <p className="text-sm font-semibold text-white">Access denied</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-300">{denied}</span> is not authorized. Contact your administrator to request access.
              </p>
              <button
                onClick={() => setDenied(null)}
                className="w-full py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Try a different account
              </button>
            </div>
          )}
        </div>
      </LoginShell>
    </>
  );
}

function EmailLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const users = getPlatformUsers();
    const trimmed = email.trim();
    const match = users.find(u => u.email.toLowerCase() === trimmed.toLowerCase());
    const user = match ?? {
      id: `u-${trimmed.split('@')[0]}`,
      name: trimmed.split('@')[0],
      email: trimmed,
      role: 'admin' as const,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    login(user);
    localStorage.setItem('authenticated', 'true');
    router.push('/');
  };

  return (
    <LoginShell>
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(10, 20, 45, 0.85)',
          border: '1px solid rgba(0,201,167,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {!denied ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">Sign in with your SkySpecs account</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                placeholder="yourname@skyspecs.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  // @ts-ignore
                  '--tw-ring-color': '#00C9A7',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,201,167,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all"
                style={{ background: loading ? 'rgba(0,201,167,0.5)' : '#00C9A7', color: '#060D1F' }}
              >
                {loading ? 'Signing in…' : 'Continue →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center space-y-3 py-1">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-400 text-base">✕</span>
            </div>
            <p className="text-sm font-semibold text-white">Access denied</p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-300">{denied}</span> is not authorized.
            </p>
            <button
              onClick={() => setDenied(null)}
              className="w-full py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </LoginShell>
  );
}
