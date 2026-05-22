import { UserRole } from './permissions';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const DEFAULT_USERS: PlatformUser[] = [
  { id: 'u-jiya', name: 'Jiya Janwani', email: 'ext-jiya.janwani@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-jiya2', name: 'Jiya Janwani', email: 'jjanwani@umich.edu', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-gus', name: 'Gus Simshauser', email: 'gus.simshauser@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-alicia', name: 'Alicia Brown', email: 'alicia.brown@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-fischer', name: 'Fischer Meono', email: 'fischer.meono@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-rc', name: 'Rob Cupit', email: 'rob.cupit@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-loren', name: 'Loren Madden', email: 'loren.madden@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-eeshan', name: 'Eeshan Khanpara', email: 'eeshan.khanpara@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-tyler', name: 'Tyler Stone', email: 'tyler.stone@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-hannah', name: 'Hannah Kuperus', email: 'hannah.kuperus@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-ricardo', name: 'Ricardo Martinez', email: 'ricardo.martinez@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-kaj', name: 'Kaj Moua', email: 'kaj.moua@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-kepler', name: 'Kepler Eberle', email: 'kepler.eberle@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-garret', name: 'Garret Poissant', email: 'garret.poissant@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-rohit', name: 'Rohit Bhattiprolu', email: 'ext-rohit.bhattiprolu@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u-lizzie', name: 'Lizzie Kinsey', email: 'ext-elizabeth.kinsey@skyspecs.com', role: 'admin', createdAt: '2024-01-01' },
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
