/**
 * /api/curio — Vercel serverless function for the Ask C.U.R.I.O. chatbot.
 *
 * Why it exists: this is a browser-only app, so anything in VITE_* ends up in
 * the public JavaScript bundle. The OpenAI key must not. This function holds
 * it server-side and forwards the request.
 *
 * Set OPENAI_API_KEY in Vercel → Settings → Environment Variables.
 * NOT prefixed with VITE_ — that prefix is exactly what would leak it.
 * Optionally set OPENAI_MODEL (defaults to gpt-4o-mini).
 *
 * Retrieval still runs in the browser, so only the visitor's question and the
 * five chosen archive excerpts ever cross the wire.
 *
 *   GET  /api/curio   → { configured: boolean }   (no secrets in the answer)
 *   POST /api/curio   → { answer } | { error }
 *     body: { question: string, context: string, history?: [{role, content}] }
 */

import { buildMessages, callChatCompletions, DEFAULT_MODEL } from "../src/knowledge/llm.js";

const MAX_BODY_BYTES = 64 * 1024;

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;

  if (req.method === "GET") {
    // Lets the UI know whether to show its "paste a key" box. Says nothing else.
    return res.status(200).json({ configured: !!key });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!key) {
    return res.status(503).json({ error: "OPENAI_API_KEY is not set on the server" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Expected a JSON body" });
    }
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "Request too large" });
    }

    // The model, the system prompt and the token ceiling are decided here, not
    // by the caller: a public endpoint should not take instructions on trust.
    const messages = buildMessages(body);
    const result = await callChatCompletions(key, {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages,
    });

    if (!result.ok) {
      // Upstream wording can mention account details, so keep it generic.
      console.error("[api/curio] OpenAI error:", result.status, result.error);
      return res.status(502).json({ error: "The archive uplink failed. Try again in a moment." });
    }

    return res.status(200).json({ answer: result.answer });
  } catch (err) {
    const message = err?.message === "question is required" || err?.message === "context is required"
      ? err.message
      : "Bad request";
    console.error("[api/curio]", err);
    return res.status(400).json({ error: message });
  }
}
