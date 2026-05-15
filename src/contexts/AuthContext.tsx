'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlatformUser, getCurrentUser, setCurrentUser } from '@/lib/userStore';
import { Permission, hasPermission } from '@/lib/permissions';

interface AuthContextValue {
  user: PlatformUser | null;
  login: (user: PlatformUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  can: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setUser(saved);
  }, []);

  const login = (u: PlatformUser) => { setUser(u); setCurrentUser(u); };
  const logout = () => { setUser(null); setCurrentUser(null); };
  const can = (p: Permission) => user ? hasPermission(user.role, p) : false;

  return <AuthContext.Provider value={{ user, login, logout, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
