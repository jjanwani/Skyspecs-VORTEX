'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') return;
    if (localStorage.getItem('authenticated') !== 'true') {
      router.replace('/login');
    }
  }, [router, pathname]);

  return <>{children}</>;
}
