/**
 * curioChat.js — the "G" in this simplified RAG.
 *
 * Retrieval happens locally (retrieve.js) over the fixed corpus (kb.js); only
 * the question and the retrieved excerpts leave the browser. The prompt and
 * the OpenAI call itself live in llm.js, shared with the serverless function.
 *
 * Three ways an answer can be produced, tried in this order:
 *   1. /api/curio — the Vercel function, which holds the key server-side.
 *      This is the path a public deployment should use. Nothing secret ships
 *      to the browser.
 *   2. A local key — VITE_OPENAI_API_KEY from curio-app/.env.local, or one
 *      pasted into the chat panel (kept in localStorage). Handy in dev; on a
 *      public build the VITE_ one is readable by visitors, so prefer (1).
 *   3. The archive itself — no key, no network, no problem: the best-matching
 *      chunk is read out with the same citations. The demo never dies on stage.
 */

import { retrieve, buildContext } from "./retrieve";
import { buildMessages, callChatCompletions, DEFAULT_MODEL } from "./llm";

const PROXY_URL = "/api/curio";
const KEY_STORAGE = "curio.openai.key";

export const MODEL = import.meta.env.VITE_OPENAI_MODEL || DEFAULT_MODEL;

/* ---------- key handling (local path only) ---------- */

export function getApiKey() {
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    return localStorage.getItem(KEY_STORAGE) || null;
  } catch {
    return null;
  }
}

export function setApiKey(key) {
  try {
    const v = String(key ?? "").trim();
    if (v) localStorage.setItem(KEY_STORAGE, v);
    else localStorage.removeItem(KEY_STORAGE);
    return true;
  } catch {
    return false;
  }
}

export const keyIsFromEnv = () => !!import.meta.env.VITE_OPENAI_API_KEY?.trim();

/* ---------- is the serverless proxy there? ---------- */

let proxyProbe = null;

/** True when /api/curio exists AND has a key. Asked once, then remembered. */
export function proxyAvailable() {
  if (!proxyProbe) {
    proxyProbe = fetch(PROXY_URL, { method: "GET", headers: { Accept: "application/json" } })
      .then(async (r) => {
        // In `npm run dev` there is no function, and a static host may answer
        // with index.html, so insist on a real JSON answer.
        if (!r.ok || !(r.headers.get("content-type") || "").includes("application/json")) return false;
        const json = await r.json().catch(() => null);
        return !!json?.configured;
      })
      .catch(() => false);
  }
  return proxyProbe;
}

/* ---------- offline answer (no key, no proxy, or network down) ---------- */

function offlineAnswer(hits, reason = "down") {
  if (!hits.length) {
    return "*click* My archive doesn't hold that one, explorer. Try asking me about Eagle on the Moon, Opportunity on Mars, Pioneer 10 out in the dark — or about the films and photographs on these pages.";
  }
  const opener =
    reason === "no-key"
      ? "*whirr* I haven't been given a key to my big computer yet, so here's the page straight from my archive [S1]."
      : "*whirr* My transmitter to the big computer is down, so here's the page straight from my archive [S1].";
  const body = hits[0].chunk.text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .slice(0, 2)
    .join("\n\n");
  const extra = hits.length > 1 ? ` There's more in my file on ${hits[1].chunk.title} [S2].` : "";
  return `${opener}\n\n${body}${extra}`;
}

/* ---------- main entry ---------- */

/**
 * @param {string} question
 * @param {{role:"user"|"assistant", content:string}[]} history  recent turns
 * @returns {Promise<{answer:string, sources:object[], mode:"api"|"archive", error?:string}>}
 */
export async function askCurio(question, history = []) {
  const hits = retrieve(question, { k: 5 });
  const { context, sources } = buildContext(hits);

  if (!hits.length) {
    return { answer: offlineAnswer(hits), sources, mode: "archive" };
  }

  const payload = { question, context, history: history.slice(-6) };

  // 1. The serverless proxy, if this build has one.
  if (await proxyAvailable()) {
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.answer) return finish(json.answer, sources);
      return { answer: offlineAnswer(hits), sources, mode: "archive", error: json?.error || `HTTP ${res.status}` };
    } catch (e) {
      return { answer: offlineAnswer(hits), sources, mode: "archive", error: e?.message || "network error" };
    }
  }

  // 2. A key in this browser.
  const key = getApiKey();
  if (!key) {
    return { answer: offlineAnswer(hits, "no-key"), sources, mode: "archive", error: "no-key" };
  }

  try {
    const result = await callChatCompletions(key, { model: MODEL, messages: buildMessages(payload) });
    if (!result.ok) {
      return { answer: offlineAnswer(hits), sources, mode: "archive", error: result.error };
    }
    return finish(result.answer, sources);
  } catch (e) {
    return { answer: offlineAnswer(hits), sources, mode: "archive", error: e?.message || "network error" };
  }
}

/** Keep only the citations the answer actually used. */
function finish(answer, sources) {
  const used = sources.filter((s) => answer.includes(`[${s.marker}]`));
  return { answer, sources: used.length ? used : sources.slice(0, 2), mode: "api" };
}

/** Opening lines + a few starter questions for the panel. */
export const GREETING =
  "*click* ...*whirr* Oh! Hello, explorer. I'm C.U.R.I.O., and I keep the stories of machines nobody listens to any more. Ask me anything about the films, the photographs or the stories on these pages. If my archive doesn't have it, I'll tell you straight.";

export const SUGGESTIONS = [
  "What happens in the Opportunity film?",
  "Why was Eagle left on the Moon?",
  "What is on Pioneer 10's gold plaque?",
  "What are the Mars blueberries?",
  "Where do the photographs come from?",
];
