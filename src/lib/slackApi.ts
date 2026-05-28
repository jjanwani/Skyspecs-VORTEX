/**
 * Slack Web API integration.
 *
 * Auth: a bot token (xoxb-...) is stored in an env var. Since this is a
 * static export, the token cannot live in the browser — it must go through
 * a lightweight proxy. Two options are noted below; pick one.
 *
 * OPTION A — Slack App with a Vercel/Netlify Edge Function proxy (recommended)
 *   Browser → POST /api/slack  (your proxy, adds the bot token)  → Slack API
 *   Env var: SLACK_BOT_TOKEN  (server-side only, never in NEXT_PUBLIC_*)
 *
 * OPTION B — Slack App manifest with allowed origins + user tokens
 *   Browser → Slack API directly (with a per-user Slack OAuth token)
 *   Env var: NEXT_PUBLIC_SLACK_CLIENT_ID  (for OAuth2 flow)
 *
 * The interface below is written against Option A. If you switch to B,
 * replace PROXY_BASE with the Slack API base URL and attach the user token.
 *
 * Required bot token scopes:
 *   channels:history    — read messages in a channel
 *   channels:read       — list channels, resolve names to IDs
 *   files:read          — read files attached to messages
 *   reactions:read      — read emoji reactions (e.g. ✅ = flight test passed)
 *   users:read          — resolve user IDs to display names
 *   chat:write          — post status-change notifications (optional)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SlackMessage {
  ts: string;           // Slack timestamp, also the message ID
  text: string;
  userId: string;       // raw Slack user ID — resolve with getUser()
  userName?: string;    // pre-resolved display name, if available
  reactions?: SlackReaction[];
  files?: SlackFile[];
  threadTs?: string;    // parent ts if this is a threaded reply
  replyCount?: number;
}

export interface SlackReaction {
  name: string;         // e.g. "white_check_mark"
  count: number;
  userIds: string[];
}

export interface SlackFile {
  id: string;
  name: string;
  mimeType: string;
  urlPrivate: string;   // requires bot token to download
  permalink: string;    // shareable link
}

export interface SlackChannel {
  id: string;
  name: string;
  topic?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

// IMPORTANT: this proxy URL is a server-side Edge Function you control that
// forwards requests to api.slack.com after attaching the bot token.
// Deploy one file: /api/slack/route.ts (Next.js) or functions/slack.ts (Netlify)
const PROXY_BASE = process.env.NEXT_PUBLIC_SLACK_PROXY_URL ?? '/api/slack';

// Known channel IDs (resolve once with listChannels() and store here or in env)
export const CHANNELS = {
  flightTest: process.env.NEXT_PUBLIC_SLACK_CHANNEL_FLIGHT_TEST ?? '',
  workOrders: process.env.NEXT_PUBLIC_SLACK_CHANNEL_WORK_ORDERS ?? '',
  incidents: process.env.NEXT_PUBLIC_SLACK_CHANNEL_INCIDENTS ?? '',
} as const;

// ── Proxy helper ──────────────────────────────────────────────────────────────

async function slackCall<T>(method: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const url = new URL(PROXY_BASE, window.location.origin);
  url.searchParams.set('method', method);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Slack proxy error ${res.status}`);

  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);

  return data;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * List all public channels the bot has been invited to.
 */
export async function listChannels(): Promise<SlackChannel[]> {
  const resp = await slackCall<{ channels: Array<{ id: string; name: string; topic: { value: string } }> }>(
    'conversations.list',
    { exclude_archived: true, types: 'public_channel,private_channel', limit: 200 }
  );
  return resp.channels.map(c => ({ id: c.id, name: c.name, topic: c.topic?.value }));
}

/**
 * Get recent messages from a channel, optionally filtered to a thread.
 *
 * Pass threadTs to read a specific thread (e.g. the one linked in a work order's
 * slackThread URL). The thread ts is the last segment of most Slack URLs:
 *   https://skyspecs.slack.com/archives/C09TW74LC92/p177767012514734497
 *   → channelId = C09TW74LC92, threadTs = 1777670125.14734497
 */
export async function getChannelMessages(channelId: string, limit = 25): Promise<SlackMessage[]> {
  const resp = await slackCall<{ messages: RawSlackMessage[] }>(
    'conversations.history',
    { channel: channelId, limit }
  );
  return resp.messages.map(normalizeMessage);
}

export async function getThreadReplies(channelId: string, threadTs: string): Promise<SlackMessage[]> {
  const resp = await slackCall<{ messages: RawSlackMessage[] }>(
    'conversations.replies',
    { channel: channelId, ts: threadTs, limit: 50 }
  );
  return resp.messages.map(normalizeMessage);
}

/**
 * Resolve a Slack thread URL to { channelId, threadTs } params usable by
 * getThreadReplies().
 *
 * Handles:
 *   https://skyspecs.slack.com/archives/C09TW74LC92/p177767012514734497
 */
export function parseSlackThreadUrl(url: string): { channelId: string; threadTs: string } | null {
  const match = url.match(/\/archives\/([A-Z0-9]+)\/p(\d+)/);
  if (!match) return null;
  const [, channelId, tsRaw] = match;
  // Slack's "p"-prefixed ts has no dot; the actual ts is digits with dot at pos -6
  const threadTs = tsRaw.slice(0, -6) + '.' + tsRaw.slice(-6);
  return { channelId, threadTs };
}

/**
 * Read a flight test result from a Slack thread.
 *
 * Looks at the most recent message in the thread for one of these patterns:
 *   ✅ / :white_check_mark: reaction  → 'pass'
 *   ❌ / :x: reaction                 → 'fail'
 *   text containing "pass" or "fail"  → 'pass' | 'fail'
 *
 * Returns null if the thread contains no discernible result.
 */
export async function getFlightTestResult(
  slackThreadUrl: string
): Promise<'pass' | 'fail' | 'pending' | null> {
  const parsed = parseSlackThreadUrl(slackThreadUrl);
  if (!parsed) return null;

  const messages = await getThreadReplies(parsed.channelId, parsed.threadTs);

  for (const msg of [...messages].reverse()) {
    // Check reactions first (most reliable signal)
    if (msg.reactions) {
      const reactionNames = msg.reactions.map(r => r.name);
      if (reactionNames.some(r => ['white_check_mark', 'heavy_check_mark', 'pass'].includes(r))) return 'pass';
      if (reactionNames.some(r => ['x', 'no_entry', 'fail'].includes(r))) return 'fail';
    }
    // Fall back to message text
    const lower = msg.text.toLowerCase();
    if (/\bpass(ed)?\b/.test(lower) || /flight test.*ok/i.test(lower)) return 'pass';
    if (/\bfail(ed)?\b/.test(lower) || /flight test.*no/i.test(lower)) return 'fail';
  }

  return messages.length > 0 ? 'pending' : null;
}

/**
 * Post a notification message to a Slack channel.
 * Only available if the bot has chat:write scope.
 *
 * Use for: drone status changes, WO completions, low inventory alerts.
 */
export async function postMessage(channelId: string, text: string, blocks?: unknown[]): Promise<void> {
  const params: Record<string, string | number | boolean> = { channel: channelId, text };
  if (blocks) (params as Record<string, unknown>).blocks = JSON.stringify(blocks);
  await slackCall('chat.postMessage', params);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface RawSlackMessage {
  ts: string;
  text: string;
  user?: string;
  username?: string;
  reactions?: Array<{ name: string; count: number; users: string[] }>;
  files?: Array<{ id: string; name: string; mimetype: string; url_private: string; permalink: string }>;
  thread_ts?: string;
  reply_count?: number;
}

function normalizeMessage(raw: RawSlackMessage): SlackMessage {
  return {
    ts: raw.ts,
    text: raw.text,
    userId: raw.user ?? raw.username ?? 'unknown',
    reactions: raw.reactions?.map(r => ({ name: r.name, count: r.count, userIds: r.users })),
    files: raw.files?.map(f => ({
      id: f.id, name: f.name, mimeType: f.mimetype,
      urlPrivate: f.url_private, permalink: f.permalink,
    })),
    threadTs: raw.thread_ts,
    replyCount: raw.reply_count,
  };
}

// ── Proxy implementation reference ───────────────────────────────────────────
//
// If you add a Next.js App Router API route (requires switching from
// output: 'export' to a hosted deployment), it looks like this:
//
//   // src/app/api/slack/route.ts
//   import { NextRequest, NextResponse } from 'next/server';
//
//   export async function GET(req: NextRequest) {
//     const { searchParams } = new URL(req.url);
//     const method = searchParams.get('method');
//     const params = Object.fromEntries(searchParams.entries());
//     delete params.method;
//
//     const url = new URL(`https://slack.com/api/${method}`);
//     Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
//
//     const res = await fetch(url.toString(), {
//       headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
//     });
//     return NextResponse.json(await res.json());
//   }
//
// For GitHub Pages (fully static), deploy the proxy as a Cloudflare Worker,
// Vercel serverless function, or Google Cloud Run service instead.
