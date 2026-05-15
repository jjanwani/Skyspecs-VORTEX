'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformUsers } from '@/lib/userStore';
import { Plane } from 'lucide-react';
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

    if (match) {
      login(match);
      localStorage.setItem('authenticated', 'true');
      router.push('/');
    } else {
      setDenied(email);
    }
  };

  const initGoogle = () => {
    if (!window.google || !CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
    });
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  };

  // Re-init if script already loaded before component mounted
  useEffect(() => {
    if (scriptReady) initGoogle();
  }, [scriptReady]);

  // No Client ID configured — fall back to the mock email flow
  if (!CLIENT_ID) return <EmailLogin />;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => { setScriptReady(true); initGoogle(); }}
      />

      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">SkySpecs</h1>
            <p className="text-gray-400 text-sm mt-1">Work Order Hub</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            {!denied ? (
              <>
                <p className="text-sm text-gray-400 text-center">Sign in to your account</p>
                {/* Google renders its own button here */}
                <div ref={buttonRef} className="flex justify-center" />
              </>
            ) : (
              <div className="text-center space-y-3 py-2">
                <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-red-400 text-lg">✕</span>
                </div>
                <p className="text-sm font-medium text-white">Access not granted</p>
                <p className="text-xs text-gray-500">
                  <span className="text-gray-300">{denied}</span> does not have access to this platform.
                  Contact your administrator to request access.
                </p>
                <button
                  onClick={() => setDenied(null)}
                  className="w-full py-2.5 border border-gray-700 hover:border-gray-500 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Try a different account
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-600">
            Access is managed by your SkySpecs administrator
          </p>
        </div>
      </div>
    </>
  );
}

// Shown locally when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set
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
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      login(match);
      localStorage.setItem('authenticated', 'true');
      router.push('/');
    } else {
      setLoading(false);
      setDenied(email);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SkySpecs</h1>
          <p className="text-gray-400 text-sm mt-1">Work Order Hub</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {!denied ? (
            <>
              <p className="text-sm text-gray-400 text-center">Sign in with your account</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="yourname@skyspecs.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-3 py-2">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-red-400 text-lg">✕</span>
              </div>
              <p className="text-sm font-medium text-white">Access not granted</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-300">{denied}</span> does not have access.
              </p>
              <button onClick={() => setDenied(null)} className="w-full py-2.5 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                Try again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600">Access is managed by your SkySpecs administrator</p>
      </div>
    </div>
  );
}
