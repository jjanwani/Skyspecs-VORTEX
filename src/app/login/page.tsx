'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformUsers, PlatformUser } from '@/lib/userStore';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);

  useEffect(() => { setUsers(getPlatformUsers()); }, []);

  const handleLogin = (user: PlatformUser) => {
    login(user);
    localStorage.setItem('authenticated', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SkySpecs</h1>
          <p className="text-gray-400 text-sm mt-1">Work Order Hub · Asset Register</p>
        </div>

        {/* User selection */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-4 text-center">Select your account to continue</p>
          <div className="space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800 transition-all text-left group"
              >
                <div className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white group-hover:bg-blue-600/30">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0', ROLE_COLORS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-gray-600">Contact your administrator to request access</p>
      </div>
    </div>
  );
}
