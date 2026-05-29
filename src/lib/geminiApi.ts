/**
 * Gemini API helper for AI-powered Drive file suggestions.
 *
 * Requires NEXT_PUBLIC_GEMINI_API_KEY. All calls are client-side — no backend needed.
 * Get a key at https://aistudio.google.com/app/apikey
 */

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-1.5-flash-latest';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface SuggestionContext {
  title: string;
  type: string;
  notes?: string;
  ernReference?: string;
  parts?: string[];
}

/**
 * Ask Gemini to rank Drive files by relevance to a work order.
 * Returns an ordered array of file IDs (most relevant first), max `maxResults`.
 * Throws if the API key is missing or the request fails.
 */
export async function suggestDriveFiles(
  files: Array<{ id: string; name: string; description?: string }>,
  ctx: SuggestionContext,
  maxResults = 5
): Promise<string[]> {
  if (!API_KEY) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not set');
  if (files.length === 0) return [];

  const fileList = files
    .slice(0, 200) // guard against enormous folders
    .map((f, i) => `${i + 1}. [${f.id}] ${f.name}${f.description ? ` — ${f.description}` : ''}`)
    .join('\n');

  const prompt = `You are assisting a drone maintenance technician. Select the most relevant documentation files for this work order.

Work Order:
- Title: ${ctx.title}
- Type: ${ctx.type}
${ctx.ernReference ? `- ERN Reference: ${ctx.ernReference}\n` : ''}\
${ctx.notes ? `- Notes: ${ctx.notes}\n` : ''}\
${ctx.parts?.length ? `- Parts involved: ${ctx.parts.join(', ')}\n` : ''}\

Available files:
${fileList}

Return a JSON array of the bracketed file IDs for the top ${maxResults} most relevant files, ordered by relevance. Return ONLY the JSON array, no explanation. If nothing is relevant, return [].`;

  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 256 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Gemini API error ${res.status}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

export function geminiAvailable(): boolean {
  return !!API_KEY;
}
