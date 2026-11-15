import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, KeyRound, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import {
  askCurio,
  GREETING,
  SUGGESTIONS,
  MODEL,
  getApiKey,
  setApiKey,
  keyIsFromEnv,
  proxyAvailable,
} from "../knowledge/curioChat";
import { KB_STATS } from "../knowledge/kb";
import { sound } from "../audio/SoundEngine";
import CurioAvatar from "./CurioAvatar";
import HudButton from "./HudButton";

/** Renders [S1]-style citation markers inside an answer as little amber chips. */
function AnswerText({ text }) {
  const parts = useMemo(() => text.split(/(\[S\d\])/g), [text]);
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-parchment/90">
      {parts.map((p, i) =>
        /^\[S\d\]$/.test(p) ? (
          <span
            key={i}
            className="mx-0.5 inline-block translate-y-[-1px] border border-amber/50 bg-amber/10 px-1 font-mono text-[9px] tracking-[0.1em] text-amber"
          >
            {p.slice(1, -1)}
          </span>
        ) : (
          p
        )
      )}
    </p>
  );
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-2.5 border-t border-white/10 pt-2">
      <p className="font-mono text-[9px] tracking-[0.22em] text-parchment/40">SOURCES</p>
      <ul className="mt-1.5 space-y-1">
        {sources.map((s) => (
          <li key={s.marker} className="flex items-start gap-1.5">
            <span className="mt-[1px] shrink-0 border border-amber/40 bg-amber/5 px-1 font-mono text-[9px] text-amber">{s.marker}</span>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-start gap-1 text-[11px] leading-snug text-signal/80 hover:text-signal"
              >
                {s.label}
                <ExternalLink size={9} className="mt-[3px] shrink-0 opacity-60" />
              </a>
            ) : (
              <span className="text-[11px] leading-snug text-parchment/55">{s.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyRow({ onSaved }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        setApiKey(value.trim());
        setValue("");
        onSaved?.();
      }}
      className="border-t border-amber/20 bg-amber/5 px-4 py-3"
    >
      <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-amber">
        <KeyRound size={11} /> CHATGPT KEY NOT SET · ANSWERING FROM THE ARCHIVE
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-parchment/60">
        Put <code className="text-parchment/80">VITE_OPENAI_API_KEY</code> in <code className="text-parchment/80">curio-app/.env.local</code> and
        restart, or paste it here (kept in this browser only).
      </p>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
          className="min-w-0 flex-1 border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-parchment outline-none placeholder:text-parchment/30 focus:border-amber/60"
        />
        <HudButton type="submit" variant="ghost" className="!px-3 !py-1.5" disabled={!value.trim()}>
          Save
        </HudButton>
      </div>
    </form>
  );
}

export default function AskCurio({ open, onOpenChange }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING, sources: [], mode: "archive" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!getApiKey());
  const [proxy, setProxy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scroller = useRef(null);
  const inputRef = useRef(null);

  // On a Vercel deployment the key lives in the serverless function, so there
  // is nothing for the visitor to paste.
  useEffect(() => {
    let alive = true;
    proxyAvailable().then((ok) => alive && setProxy(ok));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = useCallback(
    async (question) => {
      const q = String(question ?? "").trim();
      if (!q || busy) return;
      setInput("");
      setBusy(true);
      setSpeaking(true);
      const history = messages.filter((m) => !m.hidden).map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, { role: "user", content: q }]);
      try {
        const res = await askCurio(q, history);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.answer, sources: res.sources, mode: res.mode, error: res.error },
        ]);
        if (res.error === "no-key") setHasKey(false);
      } finally {
        setBusy(false);
        setTimeout(() => setSpeaking(false), 600);
      }
    },
    [busy, messages]
  );

  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <>
      {/* Floating launcher, on every screen */}
      <motion.div
        className="fixed bottom-5 right-5 z-[55]"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.8 : 1, y: open ? 20 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: open ? "none" : "auto" }}
      >
        <button
          type="button"
          onClick={() => {
            sound.click();
            onOpenChange(true);
          }}
          onMouseEnter={() => sound.hover()}
          aria-label="Ask C.U.R.I.O."
          className="group flex cursor-pointer items-center gap-2.5 border border-amber/50 bg-obsidian/85 py-2.5 pl-3 pr-4 font-mono text-[11px] uppercase tracking-[0.22em] text-amber shadow-[0_0_34px_rgba(255,179,71,0.25)] backdrop-blur-md transition-all hover:border-amber hover:bg-amber/10 hover:shadow-[0_0_46px_rgba(255,179,71,0.45)]"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber/25" />
            <MessageCircle size={15} className="relative" />
          </span>
          Ask C.U.R.I.O.
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[56] bg-obsidian/60 backdrop-blur-sm md:bg-obsidian/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              role="dialog"
              aria-label="Ask C.U.R.I.O."
              className="hud-glass fixed inset-x-0 bottom-0 top-14 z-[57] flex flex-col sm:inset-x-auto sm:right-0 sm:w-[25rem] lg:w-[27rem]"
              initial={{ x: "100%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.4 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {/* header */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <div className="-my-2 shrink-0">
                  <CurioAvatar size={44} speaking={speaking || busy} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-[0.26em] text-amber">ASK C.U.R.I.O.</p>
                  <p className="truncate font-mono text-[9px] tracking-[0.18em] text-parchment/45">
                    {KB_STATS.chunks} ARCHIVE ENTRIES ·{" "}
                    {proxy ? "SECURE UPLINK" : hasKey ? MODEL.toUpperCase() : "ARCHIVE MODE"}
                  </p>
                </div>
                <HudButton variant="icon" onClick={() => onOpenChange(false)} aria-label="Close C.U.R.I.O. chat">
                  <X size={15} />
                </HudButton>
              </div>

              {/* transcript */}
              <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                      <p className="max-w-[85%] border border-signal/30 bg-signal/10 px-3 py-2 text-[13px] leading-relaxed text-parchment">
                        {m.content}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="border border-white/10 bg-white/[0.04] px-3 py-2.5">
                        <AnswerText text={m.content} />
                        <SourceList sources={m.sources} />
                        {m.error && m.error !== "no-key" && (
                          <p className="mt-2 font-mono text-[9px] tracking-[0.15em] text-warn/80">UPLINK ERROR · {m.error}</p>
                        )}
                      </div>
                    </motion.div>
                  )
                )}

                {busy && lastIsUser && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-parchment/50">
                    <Loader2 size={12} className="animate-spin" /> SEARCHING THE ARCHIVE...
                  </motion.p>
                )}

                {messages.length === 1 && (
                  <div className="space-y-2 pt-1">
                    <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.22em] text-parchment/40">
                      <Sparkles size={10} /> TRY ASKING
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        onMouseEnter={() => sound.hover()}
                        className="block w-full cursor-pointer border border-white/10 px-3 py-2 text-left text-[12px] text-parchment/70 transition hover:border-amber/40 hover:bg-amber/5 hover:text-parchment"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!proxy && !hasKey && !keyIsFromEnv() && <KeyRow onSaved={() => setHasKey(true)} />}

              {/* composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2 border-t border-white/10 px-4 py-3"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about the films, photos or stories..."
                  className="max-h-28 min-h-[2.4rem] flex-1 resize-none border border-white/15 bg-black/40 px-3 py-2 text-[13px] text-parchment outline-none placeholder:text-parchment/35 focus:border-amber/60"
                />
                <HudButton variant="primary" type="submit" className="!px-3.5 !py-2.5" disabled={busy || !input.trim()} aria-label="Send question">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </HudButton>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
