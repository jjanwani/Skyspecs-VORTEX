'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Search, FileText, Image as ImageIcon, Video, FolderOpen,
  ExternalLink, Check, Clock, Sparkles, RefreshCw, Wifi, WifiOff, Loader2,
} from 'lucide-react';
import { WorkOrder } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  requestDriveAccess, listFolder, getDriveToken, mimeTypeLabel, type DriveFile,
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SHARED_FOLDER_ID = '1XgYzQXGMM7RmnoE-pAQFZIqod1Q85CNl';
const HISTORY_KEY = 'drive-links-history';
const SESSION_CACHE_KEY = 'drive-folder-cache';

// Static hub docs mapped to DriveFile shape for uniform rendering
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

// ── Session cache helpers ─────────────────────────────────────────────────────

function getCachedDriveFiles(): DriveFile[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const { files, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > 5 * 60 * 1000) return null; // 5-min TTL
    return files;
  } catch { return null; }
}

function setCachedDriveFiles(files: DriveFile[]): void {
  if (files.length === 0) return; // don't cache empty — may be a Shared Drive access issue
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ files, fetchedAt: Date.now() }));
  } catch {}
}

// ── Suggestion scoring ────────────────────────────────────────────────────────

function scoreFile(name: string, wo: WorkOrder): number {
  const n = name.toLowerCase();
  let score = 0;

  // ERN reference is the strongest signal
  if (wo.ernReference) {
    if (n.includes(wo.ernReference.toLowerCase())) score += 100;
    const ernNum = wo.ernReference.replace(/\D/g, '');
    if (ernNum.length > 2 && n.includes(ernNum)) score += 60;
  }

  // Title keywords (skip very short / stop words)
  const stop = new Set(['the', 'and', 'for', 'from', 'with', 'this', 'that', 'to', 'of', 'a', 'an', 'in', 'on', 'at', 'by', 'or', 'is', 'it']);
  const titleWords = wo.title.toLowerCase().split(/[\s\-_\/]+/).filter(w => w.length > 2 && !stop.has(w));
  for (const word of titleWords) {
    if (n.includes(word)) score += 15;
  }

  // WO type keywords
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
  file, isAttached, onAttach, onDetach,
}: {
  file: DriveFile;
  isAttached: boolean;
  onAttach: (f: DriveFile) => void;
  onDetach: (fileId: string) => void;
}) {
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
  attached: DriveAttachment[];
  onAttach: (file: DriveAttachment) => void;
  onDetach: (fileId: string) => void;
  onClose: () => void;
}

export default function DriveLinkModal({ wo, attached, onAttach, onDetach, onClose }: Props) {
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'loaded' | 'error'>(
    getDriveToken() ? 'loaded' : 'idle'
  );
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<DriveAttachment[]>([]);

  const attachedIds = useMemo(() => new Set(attached.map(a => a.fileId)), [attached]);

  useEffect(() => {
    setHistory(getHistory());
    // Auto-load if we already have a token
    if (getDriveToken()) loadDriveFiles();
  }, []);

  const loadDriveFiles = useCallback(async () => {
    const cached = getCachedDriveFiles();
    if (cached) { setDriveFiles(cached); setDriveStatus('loaded'); return; }

    setDriveStatus('connecting');
    setDriveError(null);
    try {
      await requestDriveAccess();
      const files = await listFolder(SHARED_FOLDER_ID);
      setCachedDriveFiles(files);
      setDriveFiles(files);
      setDriveStatus('loaded');
    } catch (e) {
      setDriveStatus('error');
      setDriveError(e instanceof Error ? e.message : 'Failed to connect to Drive');
    }
  }, []);

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

  // Source of truth: live Drive files if connected, else static hub docs
  const allFiles = driveStatus === 'loaded' && driveFiles.length > 0 ? driveFiles : HUB_FILES;
  const isLive = driveStatus === 'loaded' && driveFiles.length > 0;

  // Filter by search
  const filteredFiles = useMemo(() => {
    if (!search.trim()) return allFiles;
    const q = search.toLowerCase();
    return allFiles.filter(f =>
      f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
    );
  }, [allFiles, search]);

  // Suggestions: score all files, take top 5 with score > 0
  const suggestions = useMemo(() => {
    if (search.trim()) return []; // hide suggestions while searching
    return allFiles
      .map(f => ({ file: f, score: scoreFile(f.name, wo) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.file);
  }, [allFiles, wo, search]);

  // History items not already in suggestions
  const recentHistory = useMemo(() => {
    const sugIds = new Set(suggestions.map(f => f.id));
    return history.filter(h => !sugIds.has(h.fileId)).slice(0, 6);
  }, [history, suggestions]);

  // Browse list: all files minus suggestions when not searching
  const browseFiles = useMemo(() => {
    if (search.trim()) return filteredFiles;
    const sugIds = new Set(suggestions.map(f => f.id));
    return allFiles.filter(f => !sugIds.has(f.id));
  }, [allFiles, suggestions, filteredFiles, search]);

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
            {/* Connection status */}
            {driveStatus === 'loaded' ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live from Drive
              </span>
            ) : driveStatus === 'connecting' ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </span>
            ) : driveStatus === 'error' ? (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <WifiOff className="w-3 h-3" /> {driveError ?? 'Error'}
              </span>
            ) : (
              <button
                onClick={loadDriveFiles}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Wifi className="w-3 h-3" /> Connect to Drive
              </button>
            )}
            {driveStatus === 'loaded' && (
              <button
                onClick={() => { sessionStorage.removeItem(SESSION_CACHE_KEY); loadDriveFiles(); }}
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
              placeholder={isLive ? 'Search files in SkySpecs Drive…' : 'Search documents…'}
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

          {/* Suggested */}
          {suggestions.length > 0 && (
            <Section icon={<Sparkles className="w-3.5 h-3.5" />} label="Suggested for this work order" count={suggestions.length}>
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
          {attached.length > 0 && (
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

          {/* Recently used across all WOs */}
          {recentHistory.length > 0 && !search && (
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

          {/* Browse all */}
          <Section
            icon={<FolderOpen className="w-3.5 h-3.5" />}
            label={search ? `Search results` : isLive ? 'All files in SkySpecs Drive' : 'All documents'}
            count={browseFiles.length}
            defaultOpen={suggestions.length === 0 && recentHistory.length === 0}
          >
            {browseFiles.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">No documents match your search.</p>
            ) : (
              <div className="bg-gray-800/40 rounded-xl px-2 py-1 divide-y divide-gray-800/60">
                {browseFiles.map(f => (
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-600">
            {isLive ? `${allFiles.length} files from Drive` : `${HUB_FILES.length} known documents`}
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
