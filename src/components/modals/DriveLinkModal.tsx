'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Search, FileText, Image as ImageIcon, Video, FolderOpen, ChevronRight,
  ExternalLink, Check, Clock, Sparkles, RefreshCw, Wifi, WifiOff, Loader2,
} from 'lucide-react';
import { WorkOrder } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  requestDriveAccess, listFolder, getDriveToken, resetDriveToken, mimeTypeLabel, type DriveFile,
} from '@/lib/driveApi';
import { HUB_DOCS } from '@/lib/data/hubDocs';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DriveAttachment {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  attachedAt: string;
}

interface FolderCrumb {
  id: string;
  name: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHARED_FOLDER_ID = '1XgYzQXGMM7RmnoE-pAQFZIqod1Q85CNl';
const ROOT_CRUMB: FolderCrumb = { id: SHARED_FOLDER_ID, name: 'SkySpecs Drive' };
const HISTORY_KEY = 'drive-links-history';

// Static hub docs mapped to DriveFile shape for uniform rendering (offline fallback)
const HUB_FILES: DriveFile[] = HUB_DOCS.map(d => ({
  id: d.id,
  name: d.name,
  mimeType: d.type === 'pdf' ? 'application/pdf' : d.type === 'video' ? 'video/mp4' : 'image/png',
  webViewLink: d.driveLink,
  modifiedTime: d.lastUpdated,
  description: d.description,
}));

// ── History helpers ───────────────────────────────────────────────────────────

function getHistory(): DriveAttachment[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

export function addToHistory(file: DriveAttachment): void {
  const history = getHistory().filter(h => h.fileId !== file.fileId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([file, ...history].slice(0, 30)));
}

// ── Per-folder session cache ──────────────────────────────────────────────────

function cacheKey(folderId: string) { return `drive-folder-cache-${folderId}`; }

function getCachedFolder(folderId: string): DriveFile[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(folderId));
    if (!raw) return null;
    const { files, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > 5 * 60 * 1000) return null; // 5-min TTL
    return files;
  } catch { return null; }
}

function setCachedFolder(folderId: string, files: DriveFile[]): void {
  if (files.length === 0) return; // don't cache empty — may be an access issue
  try {
    sessionStorage.setItem(cacheKey(folderId), JSON.stringify({ files, fetchedAt: Date.now() }));
  } catch {}
}

function clearFolderCache(folderId: string) {
  try { sessionStorage.removeItem(cacheKey(folderId)); } catch {}
}

// ── Suggestion scoring ────────────────────────────────────────────────────────

function scoreFile(name: string, wo: WorkOrder): number {
  const n = name.toLowerCase();
  let score = 0;

  if (wo.ernReference) {
    if (n.includes(wo.ernReference.toLowerCase())) score += 100;
    const ernNum = wo.ernReference.replace(/\D/g, '');
    if (ernNum.length > 2 && n.includes(ernNum)) score += 60;
  }

  const stop = new Set(['the', 'and', 'for', 'from', 'with', 'this', 'that', 'to', 'of', 'a', 'an', 'in', 'on', 'at', 'by', 'or', 'is', 'it']);
  const titleWords = wo.title.toLowerCase().split(/[\s\-_\/]+/).filter(w => w.length > 2 && !stop.has(w));
  for (const word of titleWords) {
    if (n.includes(word)) score += 15;
  }

  const typeKws: Record<string, string[]> = {
    rca: ['rca', 'root cause', 'crash', 'investigation', 'analysis', 'failure'],
    maintenance: ['maintenance', 'replacement', 'procedure', 'guide', 'repair', 'troubleshoot', 'ern', 'checklist'],
    upgrade: ['upgrade', 'ecn', 'release', 'update', 'notice', 'firmware'],
    issue: ['troubleshoot', 'guide', 'diagnosis', 'issue', 'debug', 'diagnostic'],
  };
  for (const kw of typeKws[wo.type] ?? []) {
    if (n.includes(kw)) score += 8;
  }

  return score;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const type = mimeTypeLabel(mimeType);
  const cls = cn('flex-shrink-0', className);
  if (type === 'image') return <ImageIcon className={cn(cls, 'text-blue-400')} />;
  if (type === 'video') return <Video className={cn(cls, 'text-purple-400')} />;
  if (type === 'folder') return <FolderOpen className={cn(cls, 'text-amber-400')} />;
  if (type === 'sheet') return <FileText className={cn(cls, 'text-green-400')} />;
  if (type === 'doc') return <FileText className={cn(cls, 'text-blue-400')} />;
  return <FileText className={cn(cls, 'text-red-400')} />;
}

function FileRow({
  file, isAttached, onAttach, onDetach, onOpenFolder,
}: {
  file: DriveFile;
  isAttached: boolean;
  onAttach: (f: DriveFile) => void;
  onDetach: (fileId: string) => void;
  onOpenFolder?: (f: DriveFile) => void;
}) {
  const isFolder = mimeTypeLabel(file.mimeType) === 'folder';

  if (isFolder) {
    return (
      <button
        onClick={() => onOpenFolder?.(file)}
        className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-800/60 w-full text-left transition-colors group"
      >
        <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate group-hover:text-amber-300 transition-colors">{file.name}</p>
          {file.modifiedTime && (
            <p className="text-xs text-gray-600">{file.modifiedTime.slice(0, 10)}</p>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-800/60 group transition-colors">
      <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{file.name}</p>
        {file.modifiedTime && (
          <p className="text-xs text-gray-600">{file.modifiedTime.slice(0, 10)}</p>
        )}
      </div>
      <a
        href={file.webViewLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all flex-shrink-0"
        title="Open in Drive"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
      {isAttached ? (
        <button
          onClick={() => onDetach(file.id)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Check className="w-3 h-3" /> Attached
        </button>
      ) : (
        <button
          onClick={() => onAttach(file)}
          className="text-xs px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          Attach
        </button>
      )}
    </div>
  );
}

function Section({
  icon, label, count, children, defaultOpen = true,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left mb-1.5 group"
      >
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-gray-600 ml-1">({count})</span>
        )}
        <span className="text-xs text-gray-700 ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  wo: WorkOrder;
  parts?: Array<{ name: string }>;
  attached: DriveAttachment[];
  onAttach: (file: DriveAttachment) => void;
  onDetach: (fileId: string) => void;
  onClose: () => void;
}

export default function DriveLinkModal({ wo, parts: _parts, attached, onAttach, onDetach, onClose }: Props) {
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'loaded' | 'error'>(
    getDriveToken() ? 'loaded' : 'idle'
  );
  // Root-level files (for folder browser starting point)
  const [rootFiles, setRootFiles] = useState<DriveFile[]>([]);
  // Current folder contents (changes as user navigates)
  const [currentItems, setCurrentItems] = useState<DriveFile[]>([]);
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderStack, setFolderStack] = useState<FolderCrumb[]>([ROOT_CRUMB]);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<DriveAttachment[]>([]);

  const attachedIds = useMemo(() => new Set(attached.map(a => a.fileId)), [attached]);
  const isLive = driveStatus === 'loaded' && rootFiles.length > 0;
  const currentCrumb = folderStack[folderStack.length - 1];

  useEffect(() => {
    setHistory(getHistory());
    if (getDriveToken()) loadRootFolder();
  }, []);

  const loadRootFolder = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) clearFolderCache(SHARED_FOLDER_ID);

    const cached = getCachedFolder(SHARED_FOLDER_ID);
    if (cached) {
      setRootFiles(cached);
      setCurrentItems(cached);
      setFolderStack([ROOT_CRUMB]);
      setDriveStatus('loaded');
      return;
    }

    setDriveStatus('connecting');
    setDriveError(null);
    try {
      await requestDriveAccess();
      const files = await listFolder(SHARED_FOLDER_ID);
      setCachedFolder(SHARED_FOLDER_ID, files);
      setRootFiles(files);
      setCurrentItems(files);
      setFolderStack([ROOT_CRUMB]);
      setDriveStatus('loaded');
    } catch (e) {
      setDriveStatus('error');
      setDriveError(e instanceof Error ? e.message : 'Failed to connect to Drive');
    }
  }, []);

  const navigateInto = useCallback(async (folder: DriveFile) => {
    setSearch('');
    const cached = getCachedFolder(folder.id);
    if (cached) {
      setCurrentItems(cached);
      setFolderStack(s => [...s, { id: folder.id, name: folder.name }]);
      return;
    }
    setFolderLoading(true);
    try {
      const files = await listFolder(folder.id);
      setCachedFolder(folder.id, files);
      setCurrentItems(files);
      setFolderStack(s => [...s, { id: folder.id, name: folder.name }]);
    } catch (e) {
      console.error('Failed to open folder', e);
    } finally {
      setFolderLoading(false);
    }
  }, []);

  const navigateTo = useCallback(async (crumb: FolderCrumb, index: number) => {
    if (index === folderStack.length - 1) return; // already here
    setSearch('');
    const isRoot = crumb.id === SHARED_FOLDER_ID;
    if (isRoot) {
      setCurrentItems(rootFiles);
      setFolderStack([ROOT_CRUMB]);
      return;
    }
    const cached = getCachedFolder(crumb.id);
    setFolderStack(s => s.slice(0, index + 1));
    if (cached) {
      setCurrentItems(cached);
      return;
    }
    setFolderLoading(true);
    try {
      const files = await listFolder(crumb.id);
      setCachedFolder(crumb.id, files);
      setCurrentItems(files);
    } catch (e) {
      console.error('Failed to navigate to folder', e);
    } finally {
      setFolderLoading(false);
    }
  }, [folderStack, rootFiles]);

  const handleAttach = (file: DriveFile) => {
    const attachment: DriveAttachment = {
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      attachedAt: new Date().toISOString(),
    };
    addToHistory(attachment);
    setHistory(getHistory());
    onAttach(attachment);
  };

  // Offline fallback
  const offlineFiles = HUB_FILES;

  // Files-only list for the current folder (folders are always shown separately at top)
  const currentFolders = useMemo(
    () => currentItems.filter(f => mimeTypeLabel(f.mimeType) === 'folder'),
    [currentItems]
  );
  const currentFiles = useMemo(
    () => currentItems.filter(f => mimeTypeLabel(f.mimeType) !== 'folder'),
    [currentItems]
  );

  // Filtered view of current folder
  const filteredFolders = useMemo(() => {
    if (!search.trim()) return currentFolders;
    const q = search.toLowerCase();
    return currentFolders.filter(f => f.name.toLowerCase().includes(q));
  }, [currentFolders, search]);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return currentFiles;
    const q = search.toLowerCase();
    return currentFiles.filter(f => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
  }, [currentFiles, search]);

  // Keyword suggestions: from root-level files when live, from HUB_FILES when offline
  const suggestions = useMemo(() => {
    const pool = isLive
      ? rootFiles.filter(f => mimeTypeLabel(f.mimeType) !== 'folder')
      : offlineFiles;
    return pool
      .map(f => ({ file: f, score: scoreFile(f.name, wo) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.file);
  }, [isLive, rootFiles, offlineFiles, wo]);

  const recentHistory = useMemo(() => {
    const sugIds = new Set(suggestions.map(f => f.id));
    return history.filter(h => !sugIds.has(h.fileId)).slice(0, 6);
  }, [history, suggestions]);

  const isAtRoot = folderStack.length === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: '#0e1828', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Attach Drive Documents</h2>
            {attached.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-blue-400">
                {attached.length} attached
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {driveStatus === 'loaded' && rootFiles.length > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live from Drive
              </span>
            ) : driveStatus === 'loaded' && rootFiles.length === 0 ? (
              <button
                onClick={() => { resetDriveToken(); loadRootFolder(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="No files returned — click to re-authenticate with Drive scope"
              >
                <WifiOff className="w-3 h-3" /> No files — Re-authenticate
              </button>
            ) : driveStatus === 'connecting' ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </span>
            ) : driveStatus === 'error' ? (
              <button
                onClick={() => { resetDriveToken(); loadRootFolder(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <WifiOff className="w-3 h-3" /> {driveError ?? 'Error'} — Retry
              </button>
            ) : (
              <button
                onClick={() => loadRootFolder()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Wifi className="w-3 h-3" /> Connect to Drive
              </button>
            )}
            {driveStatus === 'loaded' && rootFiles.length > 0 && (
              <button
                onClick={() => loadRootFolder(true)}
                className="text-gray-600 hover:text-gray-300 transition-colors"
                title="Refresh from Drive"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              autoFocus
              type="text"
              placeholder={isLive ? `Search in ${currentCrumb.name}…` : 'Search documents…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {!isLive && (
            <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Showing known documents — connect to Drive to browse live files
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Keyword Suggestions — only at root, no search active */}
          {isAtRoot && !search && suggestions.length > 0 && (
            <Section
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="Suggested for this work order"
              count={suggestions.length}
              defaultOpen
            >
              <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                {suggestions.map(f => (
                  <FileRow
                    key={f.id}
                    file={f}
                    isAttached={attachedIds.has(f.id)}
                    onAttach={handleAttach}
                    onDetach={onDetach}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Currently attached */}
          {isAtRoot && attached.length > 0 && !search && (
            <Section icon={<Check className="w-3.5 h-3.5 text-green-400" />} label="Attached to this work order" count={attached.length}>
              <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                {attached.map(a => {
                  const asFile: DriveFile = { id: a.fileId, name: a.name, mimeType: a.mimeType, webViewLink: a.webViewLink };
                  return (
                    <FileRow
                      key={a.fileId}
                      file={asFile}
                      isAttached
                      onAttach={handleAttach}
                      onDetach={onDetach}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {/* Recently used */}
          {isAtRoot && recentHistory.length > 0 && !search && (
            <Section icon={<Clock className="w-3.5 h-3.5" />} label="Recently used" count={recentHistory.length} defaultOpen={suggestions.length === 0}>
              <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                {recentHistory.map(h => {
                  const asFile: DriveFile = { id: h.fileId, name: h.name, mimeType: h.mimeType, webViewLink: h.webViewLink };
                  return (
                    <FileRow
                      key={h.fileId}
                      file={asFile}
                      isAttached={attachedIds.has(h.fileId)}
                      onAttach={handleAttach}
                      onDetach={onDetach}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {/* Folder browser */}
          {isLive ? (
            <Section
              icon={<FolderOpen className="w-3.5 h-3.5" />}
              label={search ? 'Search results' : currentCrumb.name}
              count={(filteredFolders.length + filteredFiles.length) || undefined}
              defaultOpen={!isAtRoot || suggestions.length === 0}
            >
              {/* Breadcrumb */}
              {folderStack.length > 1 && (
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {folderStack.map((crumb, i) => (
                    <span key={crumb.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                      <button
                        onClick={() => navigateTo(crumb, i)}
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded transition-colors',
                          i === folderStack.length - 1
                            ? 'text-white font-medium'
                            : 'text-blue-400 hover:text-blue-300'
                        )}
                      >
                        {crumb.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {folderLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">
                  {search ? 'No items match your search.' : 'This folder is empty.'}
                </p>
              ) : (
                <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                  {filteredFolders.map(f => (
                    <FileRow
                      key={f.id}
                      file={f}
                      isAttached={false}
                      onAttach={handleAttach}
                      onDetach={onDetach}
                      onOpenFolder={navigateInto}
                    />
                  ))}
                  {filteredFiles.map(f => (
                    <FileRow
                      key={f.id}
                      file={f}
                      isAttached={attachedIds.has(f.id)}
                      onAttach={handleAttach}
                      onDetach={onDetach}
                    />
                  ))}
                </div>
              )}
            </Section>
          ) : (
            /* Offline fallback */
            <Section
              icon={<FolderOpen className="w-3.5 h-3.5" />}
              label={search ? 'Search results' : 'All documents'}
              count={filteredFiles.length}
              defaultOpen={suggestions.length === 0}
            >
              {filteredFiles.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">No documents match your search.</p>
              ) : (
                <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                  {offlineFiles
                    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
                    .map(f => (
                      <FileRow
                        key={f.id}
                        file={f}
                        isAttached={attachedIds.has(f.id)}
                        onAttach={handleAttach}
                        onDetach={onDetach}
                      />
                    ))}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-600">
            {isLive
              ? `${currentItems.length} items in ${currentCrumb.name}`
              : `${HUB_FILES.length} known documents`}
            {attached.length > 0 && ` · ${attached.length} attached to this WO`}
          </p>
          <button onClick={onClose} className="px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
