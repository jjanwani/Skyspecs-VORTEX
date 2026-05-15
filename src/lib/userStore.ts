import { UserRole } from './permissions';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const DEFAULT_USERS: PlatformUser[] = [
  { id: 'u-admin', name: 'Jiya Janwani', email: 'ext-jiya.janwani@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-pm', name: 'Jordan (PM)', email: 'jordan@skyspecs.com', role: 'production_manager', createdAt: '2024-01-01' },
  { id: 'u-tech', name: 'Kaj (Tech)', email: 'kaj@skyspecs.com', role: 'technician', createdAt: '2024-01-01' },
  { id: 'u-eng', name: 'Tyler (Eng)', email: 'tyler@skyspecs.com', role: 'engineer', createdAt: '2024-01-01' },
  { id: 'u-proc', name: 'Drake (Procurement)', email: 'drake@skyspecs.com', role: 'procurement', createdAt: '2024-01-01' },
  { id: 'u-loren', name: 'Loren Madden', email: 'loren.madden@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-eeshan', name: 'Eeshan Khanpara', email: 'eeshan.khanpara@skyspecs.com', role: 'engineer', createdAt: '2024-01-01' },
];

export function getPlatformUsers(): PlatformUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const saved = localStorage.getItem('platform-users');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_USERS;
}

export function savePlatformUsers(users: PlatformUser[]): void {
  localStorage.setItem('platform-users', JSON.stringify(users));
}

export function getCurrentUser(): PlatformUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('current-user');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function setCurrentUser(user: PlatformUser | null): void {
  if (user) localStorage.setItem('current-user', JSON.stringify(user));
  else localStorage.removeItem('current-user');
}
