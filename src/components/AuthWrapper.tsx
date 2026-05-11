'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem('authenticated') === 'true';
    if (!authed && pathname !== '/login') {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
