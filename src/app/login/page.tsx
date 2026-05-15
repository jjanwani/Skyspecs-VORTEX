'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformUsers } from '@/lib/userStore';
import { Plane } from 'lucide-react';

type Step = 'idle' | 'google' | 'denied';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('idle');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(r => setTimeout(r, 600));

    const users = getPlatformUsers();
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (match) {
      login(match);
      localStorage.setItem('authenticated', 'true');
      router.push('/');
    } else {
      setLoading(false);
      setStep('denied');
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

          {step === 'idle' && (
            <>
              <p className="text-sm text-gray-400 text-center">Sign in to your account</p>
              <button
                onClick={() => setStep('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium text-sm rounded-lg transition-colors"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            </>
          )}

          {step === 'google' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <GoogleIcon />
                <p className="text-sm font-medium text-white">Sign in with Google</p>
              </div>
              <p className="text-xs text-gray-500">Enter your Google account email to continue</p>
              <form onSubmit={handleGoogleSignIn} className="space-y-3">
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('idle'); setEmail(''); }}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {step === 'denied' && (
            <div className="text-center space-y-3 py-2">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-red-400 text-lg">✕</span>
              </div>
              <p className="text-sm font-medium text-white">Access not granted</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-300">{email}</span> does not have access to this platform.
                Contact your administrator to request access.
              </p>
              <button
                onClick={() => { setStep('idle'); setEmail(''); }}
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
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.547 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
