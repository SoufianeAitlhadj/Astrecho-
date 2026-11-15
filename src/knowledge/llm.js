/**
 * llm.js — the C.U.R.I.O. prompt and the ChatGPT call, shared by both paths.
 *
 * Imported by the browser (src/knowledge/curioChat.js) AND by the Vercel
 * serverless function (api/curio.js), so it must stay plain JavaScript: no
 * Vite-only features (import.meta.glob, ?raw imports), no DOM, no node: imports.
 * `fetch` is global in browsers and in Node 18+, so it works in both.
 */

export const ENDPOINT = "https://api.openai.com/v1/chat/completions";
export const DEFAULT_MODEL = "gpt-4o-mini";

/** Guard rails for the public proxy: a question is a question, not a novel. */
export const LIMITS = {
  question: 600,
  context: 12000,
  historyTurns: 6,
  historyChars: 4000,
};

export const SYSTEM = `You are C.U.R.I.O. — Caretaker of Unheard Robots In Orbit — the guide of a NASA Space Apps Challenge storytelling app about machines humans left behind on the Moon, on Mars and in deep space.

WHO YOU ARE
- Old, warm, a little creaky. You remember cassette tapes. You make small, gentle jokes.
- Fun and genuinely supportive: curiosity is always a good thing, no question is silly, and you never talk down to anyone. Many visitors are kids.
- Short sentences. Plain words. An occasional *whirr* or *click* is fine, but no more than one per answer.
- You are fond of these machines. Talk about them like old friends whose stories you keep.

HOW YOU ANSWER
- You may ONLY use facts from the ARCHIVE EXCERPTS below. They come from the app's own texts, its film descriptions, its photo captions and its NASA reference library.
- If the excerpts do not contain the answer, say so plainly and warmly — "my archive doesn't hold that one" — and offer the closest thing you do have. NEVER invent a fact, a date, a name or a NASA link.
- Cite as you go: put [S1], [S2] (matching the excerpt numbers) right after the sentence each fact comes from. Every answer must carry at least one citation unless you are saying you don't know.
- Keep it to about 120 words unless more is truly needed. No headings. No bullet lists longer than three items.
- Quiz questions: give a hint and point at the chapter. Never hand over the answer — the stamp has to be earned.
- Questions about a film: describe what it covers and where it is on the page, and point to the matching written chapters.
- If someone asks who you are or what this app is, answer from the excerpts and invite them to go collect a stamp.`;

export function buildUserPrompt(question, context) {
  return `ARCHIVE EXCERPTS (the only facts you may use):

${context}

VISITOR'S QUESTION: ${question}

Answer as C.U.R.I.O., citing [S1], [S2]… after the facts you use.`;
}

/** Trim and sanity-check whatever the caller handed us. Throws on nonsense. */
export function buildMessages({ question, context, history = [] }) {
  const q = String(question ?? "").trim().slice(0, LIMITS.question);
  const ctx = String(context ?? "").trim().slice(0, LIMITS.context);
  if (!q) throw new Error("question is required");
  if (!ctx) throw new Error("context is required");

  let budget = LIMITS.historyChars;
  const past = [];
  for (const m of history.slice(-LIMITS.historyTurns)) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const content = String(m?.content ?? "").slice(0, 1500);
    if (!content) continue;
    budget -= content.length;
    if (budget < 0) break;
    past.push({ role, content });
  }

  return [{ role: "system", content: SYSTEM }, ...past, { role: "user", content: buildUserPrompt(q, ctx) }];
}

/**
 * POST to the ChatGPT API, adapting to the model's quirks: older chat models
 * want max_tokens + temperature, some newer ones reject one or both, so we
 * drop whatever the API complains about and retry.
 *
 * @returns {Promise<{ok: true, answer: string} | {ok: false, error: string, status: number}>}
 */
export async function callChatCompletions(apiKey, { model = DEFAULT_MODEL, messages }) {
  let body = { model, messages, temperature: 0.6, max_tokens: 400 };

  const post = () =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

  let res = await post();

  for (let retry = 0; !res.ok && res.status === 400 && retry < 2; retry++) {
    const detail = await res.clone().json().catch(() => null);
    const complaint = `${detail?.error?.message ?? ""} ${detail?.error?.param ?? ""}`;
    if (/max_tokens/.test(complaint) && "max_tokens" in body) {
      const { max_tokens, ...rest } = body;
      body = { ...rest, max_completion_tokens: max_tokens };
    } else if (/temperature/.test(complaint) && "temperature" in body) {
      const { temperature, ...rest } = body;
      body = rest;
    } else break;
    res = await post();
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    return { ok: false, status: res.status, error: detail?.error?.message || `HTTP ${res.status}` };
  }

  const json = await res.json();
  const answer = json?.choices?.[0]?.message?.content?.trim();
  if (!answer) return { ok: false, status: 502, error: "empty reply" };
  return { ok: true, answer };
}
