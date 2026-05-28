/**
 * Google Drive API v3 integration.
 *
 * Auth: extends the existing GIS login (NEXT_PUBLIC_GOOGLE_CLIENT_ID) with an
 * OAuth2 access token request. No backend required — all calls are client-side.
 *
 * Usage:
 *   const { token, requestAccess } = useDriveAuth();
 *   const files = await listFolder('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs');
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
].join(' ');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  description?: string;
  size?: string;
  parents?: string[];
}

export type DriveConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ── Token store (in-memory only — access tokens should not be persisted) ──────

let _accessToken: string | null = null;
let _tokenExpiry: number = 0;          // epoch ms
let _tokenClient: unknown = null;      // google.accounts.oauth2.TokenClient

function tokenValid(): boolean {
  return !!_accessToken && Date.now() < _tokenExpiry - 60_000; // 60s buffer
}

export function getDriveToken(): string | null {
  return tokenValid() ? _accessToken : null;
}

// ── OAuth2 token request ──────────────────────────────────────────────────────

/**
 * Requests a Drive access token via GIS. Shows the Google consent popup if
 * this is the first time or the token has expired. Returns the token string.
 */
export function requestDriveAccess(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if (!CLIENT_ID) return reject(new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set'));
    if (tokenValid()) return resolve(_accessToken!);

    const google = (window as Window & { google?: { accounts: { oauth2: { initTokenClient: (cfg: object) => { requestAccessToken: () => void } } } } }).google;
    if (!google?.accounts?.oauth2) return reject(new Error('GIS not loaded'));

    if (!_tokenClient) {
      _tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: (response: { access_token?: string; expires_in?: string; error?: string }) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          _accessToken = response.access_token ?? null;
          _tokenExpiry = Date.now() + (parseInt(response.expires_in ?? '3600') * 1000);
          resolve(_accessToken!);
        },
      });
    }

    ((_tokenClient as { requestAccessToken: () => void })).requestAccessToken();
  });
}

// ── Drive API helpers ─────────────────────────────────────────────────────────

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const FILE_FIELDS = 'id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,description,size,parents';

async function driveGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = getDriveToken();
  if (!token) throw new Error('Not authenticated with Drive');

  const url = new URL(`${DRIVE_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Drive API error ${res.status}`);
  }

  return res.json();
}

/**
 * List files in a Drive folder. Pass a real folder ID, not a full URL.
 * Returns up to 100 files sorted by name.
 */
export async function listFolder(folderId: string): Promise<DriveFile[]> {
  const resp = await driveGet<{ files: DriveFile[] }>('/files', {
    q: `'${folderId}' in parents and trashed = false`,
    fields: `files(${FILE_FIELDS})`,
    orderBy: 'name',
    pageSize: '100',
  });
  return resp.files ?? [];
}

/**
 * Get metadata for a single file by its Drive file ID.
 */
export async function getFile(fileId: string): Promise<DriveFile> {
  return driveGet<DriveFile>(`/files/${fileId}`, { fields: FILE_FIELDS });
}

/**
 * Full-text search across the team's Drive.
 * `query` maps directly to Drive's `q` filter syntax, or you can pass a plain
 * string and it will be wrapped in a name contains search.
 */
export async function searchFiles(query: string, folderId?: string): Promise<DriveFile[]> {
  const nameFilter = `name contains '${query.replace(/'/g, "\\'")}'`;
  const folderFilter = folderId ? ` and '${folderId}' in parents` : '';
  const q = `${nameFilter}${folderFilter} and trashed = false`;

  const resp = await driveGet<{ files: DriveFile[] }>('/files', {
    q,
    fields: `files(${FILE_FIELDS})`,
    orderBy: 'modifiedTime desc',
    pageSize: '20',
  });
  return resp.files ?? [];
}

/**
 * Extract a Drive file/folder ID from any standard Drive URL.
 * Returns null if the URL is not a recognizable Drive URL.
 *
 * Handles formats:
 *   https://drive.google.com/file/d/<ID>/view
 *   https://drive.google.com/drive/folders/<ID>
 *   https://docs.google.com/document/d/<ID>/edit
 *   https://drive.google.com/open?id=<ID>
 */
export function extractDriveId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Infer a human-readable file type label from a Drive MIME type.
 */
export function mimeTypeLabel(mimeType: string): 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'video' | 'folder' | 'file' {
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder';
  if (mimeType === 'application/vnd.google-apps.document') return 'doc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'sheet';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'slide';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

// ── Picker API ────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    gapi?: {
      load: (lib: string, cb: () => void) => void;
      client?: unknown;
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (cfg: object) => { requestAccessToken: () => void };
        };
        id?: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
      picker?: {
        PickerBuilder: new () => {
          addView: (view: unknown) => unknown;
          setOAuthToken: (token: string) => unknown;
          setDeveloperKey: (key: string) => unknown;
          setCallback: (cb: (data: { action: string; docs?: Array<{ id: string; name: string; mimeType: string; url: string; iconUrl?: string }> }) => void) => unknown;
          build: () => { setVisible: (v: boolean) => void };
        };
        ViewId: { DOCS: string; FOLDERS: string };
        DocsView: new (viewId?: string) => {
          setIncludeFolders: (v: boolean) => unknown;
          setMimeTypes: (types: string) => unknown;
        };
        Action: { PICKED: string; CANCEL: string };
      };
    };
  }
}

let _gapiLoaded = false;
let _pickerLoaded = false;

function loadGapi(): Promise<void> {
  return new Promise(resolve => {
    if (_gapiLoaded) return resolve();
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      _gapiLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function loadPicker(): Promise<void> {
  return new Promise(resolve => {
    if (_pickerLoaded) return resolve();
    loadGapi().then(() => {
      window.gapi!.load('picker', () => {
        _pickerLoaded = true;
        resolve();
      });
    });
  });
}

export interface PickerOptions {
  /** Limit to specific MIME types, e.g. 'application/pdf' */
  mimeTypes?: string;
  /** Allow folder selection */
  includeFolders?: boolean;
  /** Developer key from Google Cloud Console (enables usage tracking) */
  developerKey?: string;
}

/**
 * Opens the Google Drive file picker. Returns the selected DriveFile, or null
 * if the user cancelled.
 *
 * Requires NEXT_PUBLIC_GOOGLE_API_KEY for the developerKey param (optional but
 * recommended to avoid quota issues on shared apps).
 */
export async function openDrivePicker(options: PickerOptions = {}): Promise<DriveFile | null> {
  const token = await requestDriveAccess();
  await loadPicker();

  return new Promise(resolve => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const picker = window.google!.picker! as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const view: any = new picker.DocsView();
    view.setIncludeFolders(options.includeFolders ?? false);
    if (options.mimeTypes) view.setMimeTypes(options.mimeTypes);

    let builder = new picker.PickerBuilder()
      .addView(view as unknown as never)
      .setOAuthToken(token)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .setCallback((data: any) => {
        if (data.action === picker.Action.PICKED && data.docs?.[0]) {
          const doc = data.docs[0];
          resolve({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            webViewLink: doc.url,
            iconLink: doc.iconUrl,
          });
        } else if (data.action === picker.Action.CANCEL) {
          resolve(null);
        }
      });

    if (options.developerKey) builder = builder.setDeveloperKey(options.developerKey) as typeof builder;

    builder.build().setVisible(true);
  });
}
