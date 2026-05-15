'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check localStorage directly since context might not be hydrated yet
    const savedUser = localStorage.getItem('current-user');
    // Also keep backward compat with old 'authenticated' key
    const legacyAuth = localStorage.getItem('authenticated') === 'true';
    const authed = !!savedUser || legacyAuth;
    if (!authed && pathname !== '/login') {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
