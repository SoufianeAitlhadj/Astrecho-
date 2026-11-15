/**
 * retrieve.js — the "R" in this simplified RAG.
 *
 * No embeddings, no network: a small BM25 index over the fixed corpus in kb.js.
 * BM25 (rather than plain cosine) because the chunks differ wildly in length —
 * a one-line note would otherwise outrank a whole chapter on a shared word.
 * Titles are indexed with extra weight, a verbatim phrase match gets a bonus,
 * and the query is expanded with a few visitor-to-archive synonyms. That is
 * enough to pick the right 2–3 chunks out of ~60, and it works offline.
 */

import { KB } from "./kb";

const STOP = new Set(
  `a an and the of to in on at for from by with about as is are was were be been being it its it's this that these those
   i you he she they we me my your his her their our us them do does did doing done have has had can could would should
   will shall may might must not no nor so than then there here what which who whom whose when where why how all any
   both each few more most other some such only own same too very just also if or but into over under again further
   once because while during before after above below up down out off out why ok okay tell say said explain
   please thanks thank hey hi hello`
    .split(/\s+/)
    .filter(Boolean)
);

/** "c.u.r.i.o." → "curio", "u.s.a." → "usa". Leaves 3.8 and sol-5111 alone. */
const unDot = (w) => (/^(?:[a-z]\.){2,}[a-z]?\.?$/.test(w) ? w.replace(/\./g, "") : w);

/**
 * Lowercase, split on non-letters/digits, drop stopwords, crude de-pluralise.
 * Hyphens split too, so "gold-anodized" also matches a question about gold.
 */
export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9°.\s]/g, " ")
    .split(/\s+/)
    .map((w) => unDot(w.replace(/^\.+|\.+$/g, "")))
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

/**
 * Query-side synonyms. Visitors say "video" where the corpus says "film",
 * "picture" where it says "photograph". Expanded terms count for less than
 * the words the visitor actually typed.
 */
const SYNONYMS = {
  video: ["film", "movie"],
  film: ["video", "movie"],
  movie: ["film", "video"],
  watch: ["film", "video"],
  photo: ["photograph", "image", "picture"],
  photograph: ["photo", "image", "picture"],
  picture: ["photograph", "image", "photo"],
  image: ["photograph", "photo", "picture"],
  pic: ["photograph", "image"],
  robot: ["machine", "spacecraft", "probe", "rover"],
  machine: ["robot", "spacecraft"],
  spacecraft: ["probe", "machine", "lander"],
  probe: ["spacecraft", "machine"],
  story: ["chapter", "text"],
  text: ["chapter", "story"],
  oppy: ["opportunity"],
  rover: ["opportunity", "spirit"],
  lander: ["lunar", "module", "eagle"],
  moon: ["lunar", "tranquility"],
  lunar: ["moon"],
  martian: ["mars"],
  badge: ["stamp", "patch"],
  quiz: ["question", "stamp"],
  model: ["glb", "3d"],
};
const EXPANSION_WEIGHT = 0.55;

/* ---------- index, built once ---------- */

const K1 = 1.4; // term-frequency saturation
const B = 0.6; // length normalisation
const TITLE_WEIGHT = 3; // a title word counts as three body words

const index = (() => {
  const df = new Map();
  const docs = KB.map((chunk) => {
    const titleTokens = tokenize(chunk.title);
    const bodyTokens = tokenize(chunk.text);
    const tf = new Map();
    const add = (t, w) => tf.set(t, (tf.get(t) ?? 0) + w);
    bodyTokens.forEach((t) => add(t, 1));
    titleTokens.forEach((t) => add(t, TITLE_WEIGHT));
    new Set(tf.keys()).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
    return {
      chunk,
      tf,
      len: bodyTokens.length + titleTokens.length * TITLE_WEIGHT,
      haystack: `${chunk.title} ${chunk.text}`.toLowerCase(),
    };
  });

  const N = docs.length || 1;
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / N || 1;
  // Robertson/Sparck-Jones idf, floored so a term in most chunks still counts.
  const idf = (t) => {
    const n = df.get(t) ?? 0;
    return Math.max(0.05, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  };

  return { docs, idf, avgLen };
})();

/* ---------- query ---------- */

/**
 * @returns {{chunk: object, score: number}[]} best chunks, highest score first.
 */
export function retrieve(query, { k = 5, minScore = 0.9 } = {}) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  // Query terms, each with a weight: typed words count fully, synonyms less.
  const terms = new Map();
  tokens.forEach((t) => terms.set(t, 1));
  tokens.forEach((t) =>
    (SYNONYMS[t] ?? []).forEach((syn) => {
      if (!terms.has(syn)) terms.set(syn, EXPANSION_WEIGHT);
    })
  );

  const phrase = String(query).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const phraseWorthChecking = phrase.split(" ").length >= 2 && phrase.length >= 8;

  const scored = index.docs.map((d) => {
    let score = 0;
    terms.forEach((qw, t) => {
      const tf = d.tf.get(t);
      if (!tf) return;
      const denom = tf + K1 * (1 - B + (B * d.len) / index.avgLen);
      score += qw * index.idf(t) * ((tf * (K1 + 1)) / denom);
    });

    // Verbatim phrase in the body: almost certainly the right chunk.
    if (phraseWorthChecking && d.haystack.includes(phrase)) score *= 1.3;

    return { chunk: d.chunk, score };
  });

  const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const strong = ranked.filter((s) => s.score >= minScore);

  // Questions made only of very common words ("who is C.U.R.I.O.?") score low
  // everywhere, because a word in every chunk carries almost no information.
  // Rather than shrug, hand back the best few matches we do have.
  return (strong.length ? strong : ranked.slice(0, Math.min(3, k))).slice(0, k);
}

/** Trim a chunk so a handful of them still fit a modest context window. */
export function clip(text, maxChars = 1500) {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("\n"));
  return `${stop > maxChars * 0.5 ? cut.slice(0, stop + 1) : cut}…`;
}

/** Numbered [S1]… context block for the model, and the matching citation list. */
export function buildContext(hits) {
  const sources = hits.map((h, i) => ({
    marker: `S${i + 1}`,
    title: h.chunk.title,
    label: h.chunk.source?.label ?? h.chunk.title,
    url: h.chunk.source?.url ?? null,
    kind: h.chunk.kind,
    score: h.score,
  }));
  const context = hits
    .map((h, i) => {
      const s = h.chunk.source ?? {};
      return `[S${i + 1}] ${h.chunk.title}\nSOURCE: ${s.label ?? h.chunk.title}${s.url ? ` (${s.url})` : ""}\n${clip(h.chunk.text)}`;
    })
    .join("\n\n---\n\n");
  return { context, sources };
}
