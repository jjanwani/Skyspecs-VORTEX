'use client';

/**
 * DriveContext — app-wide Google Drive connection state.
 *
 * Wrap the app (or any subtree) with <DriveProvider>.
 * Components call useDrive() to get connection status, trigger auth, and call
 * the API helpers (which automatically use the stored token).
 *
 * Example:
 *   const { status, connect, listFolder, openPicker } = useDrive();
 *   if (status !== 'connected') return <button onClick={connect}>Connect Drive</button>;
 *   const files = await listFolder(SHARED_FOLDER_ID);
 */

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  DriveConnectionStatus, DriveFile,
  requestDriveAccess, getDriveToken,
  listFolder as apiListFolder,
  getFile as apiGetFile,
  searchFiles as apiSearchFiles,
  openDrivePicker as apiOpenPicker,
  PickerOptions,
} from '@/lib/driveApi';

interface DriveContextValue {
  /** Current OAuth2 connection state */
  status: DriveConnectionStatus;
  /** Error message if status === 'error' */
  error: string | null;
  /** Trigger the Google OAuth2 consent flow to obtain a Drive access token */
  connect: () => Promise<void>;
  /** True if we have a valid access token right now */
  isConnected: boolean;

  // API methods — all throw if not connected
  listFolder: (folderId: string) => Promise<DriveFile[]>;
  getFile: (fileId: string) => Promise<DriveFile>;
  searchFiles: (query: string, folderId?: string) => Promise<DriveFile[]>;
  openPicker: (options?: PickerOptions) => Promise<DriveFile | null>;
}

const DriveContext = createContext<DriveContextValue | null>(null);

export function DriveProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DriveConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // On mount, check if we already have a valid in-memory token (e.g. after a
  // soft navigation — the token survives as long as the JS bundle stays loaded)
  useEffect(() => {
    if (getDriveToken()) setStatus('connected');
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      await requestDriveAccess();
      setStatus('connected');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  const isConnected = status === 'connected';

  const listFolder = useCallback((folderId: string) => apiListFolder(folderId), []);
  const getFile = useCallback((fileId: string) => apiGetFile(fileId), []);
  const searchFiles = useCallback((query: string, folderId?: string) => apiSearchFiles(query, folderId), []);
  const openPicker = useCallback((options?: PickerOptions) => apiOpenPicker(options), []);

  return (
    <DriveContext.Provider value={{ status, error, connect, isConnected, listFolder, getFile, searchFiles, openPicker }}>
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive(): DriveContextValue {
  const ctx = useContext(DriveContext);
  if (!ctx) throw new Error('useDrive must be used inside <DriveProvider>');
  return ctx;
}
