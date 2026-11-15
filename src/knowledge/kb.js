/**
 * kb.js — the fixed corpus Ask C.U.R.I.O. is allowed to answer from.
 *
 * Two kinds of fixed files feed it, and nothing else:
 *   1. src/knowledge/docs/*.md  — the NASA Space Apps reference library,
 *      the film notes and the app guide. Each "## heading" becomes one chunk;
 *      an HTML comment of the form
 *          <!-- source: LABEL | URL -->
 *      right under the heading sets the citation for that chunk.
 *   2. src/data/missionData.js  — the story texts, chapter metadata, archive
 *      photo captions, locked-device readouts and the mission films.
 *
 * Every chunk carries a `source` ({ label, url }). The chat layer numbers the
 * retrieved chunks [S1], [S2]... and the answer has to cite them, so an answer
 * can never be more than one hop from a NASA reference.
 */

import { VIDEOS, destinations, CURIO, LOCKED_HUD } from "../data/missionData";

/* ------------------------------------------------------------------ */
/* 1. Markdown reference files                                         */
/* ------------------------------------------------------------------ */

const rawDocs = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const SOURCE_RE = /<!--\s*source:\s*([^|]+?)\s*\|\s*(\S+?)\s*-->/;

function chunksFromMarkdown(path, raw) {
  const fileName = path.split("/").pop();
  const docTitle = (raw.match(/^#\s+(.+)$/m)?.[1] ?? fileName).trim();
  const out = [];

  // Split on "## " headings; anything before the first one is front matter.
  const parts = raw.split(/^##\s+/m).slice(1);
  parts.forEach((part, i) => {
    const lines = part.split("\n");
    const heading = lines.shift().trim();
    const body = lines.join("\n");
    const m = body.match(SOURCE_RE);
    const text = body.replace(SOURCE_RE, "").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) return;
    out.push({
      id: `${fileName}#${i}`,
      title: heading,
      kind: "reference",
      dest: null,
      text: `${docTitle} — ${heading}\n${text}`,
      source: {
        label: m ? m[1].trim() : docTitle,
        url: m ? m[2].trim() : null,
      },
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* 2. Mission data                                                     */
/* ------------------------------------------------------------------ */

const clean = (s) => String(s ?? "").replace(/\{name\}/g, "explorer").trim();

const specLine = (key, value) => {
  const label = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
  if (Array.isArray(value)) return `${label}: ${value.join("; ")}`;
  if (value && typeof value === "object") return null;
  return `${label}: ${value}`;
};

function locationText(loc) {
  if (!loc) return "";
  const bits = [loc.name, loc.body && `on ${loc.body}`];
  if (loc.lat != null && loc.lon != null) {
    bits.push(
      `coordinates ${Math.abs(loc.lat).toFixed(3)}°${loc.lat >= 0 ? "N" : "S"}, ${
        loc.body === "Mars"
          ? `${loc.lon.toFixed(2)}°E`
          : `${Math.abs(loc.lon).toFixed(3)}°${loc.lon >= 0 ? "E" : "W"}`
      }${loc.approximate ? " (approximate)" : ""}`
    );
  }
  if (loc.distanceFromEarthKm)
    bits.push(`about ${(loc.distanceFromEarthKm / 1e9).toFixed(2)} billion km from Earth`);
  return bits.filter(Boolean).join(", ");
}

function imageCaptions(chapter) {
  const v = chapter.metadata?.images?.verified ?? [];
  return v
    .map((img) => {
      const id = img.nasaId?.toUpperCase() || img.pia || null;
      const link = img.detailPage || img.page || img.url || null;
      return [id && `[${id}]`, img.title, img.credit && `(credit ${img.credit})`, link]
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean);
}

function chunksFromDestination(dest) {
  const d = dest.heroDevice;
  const home = d.missionPage || d.nssdcUrl || null;
  const who = `${d.name}${d.nickname ? ` (nicknamed ${d.nickname})` : ""}`;
  const out = [];

  /* --- the destination itself --- */
  out.push({
    id: `${dest.id}-overview`,
    title: `${dest.name} — overview`,
    kind: "story-text",
    dest: dest.name,
    text: [
      `Destination: ${dest.name}. Surface location: ${dest.surfaceName}.`,
      `The machine whose signal C.U.R.I.O. can open here is ${who}, also known by its catalogue ID ${d.nssdcId}.`,
      d.whatYouSee && `What you see on the surface: ${d.whatYouSee}.`,
      `C.U.R.I.O.'s arrival line: "${clean(dest.arrival)}"`,
      `C.U.R.I.O.'s introduction to the machine: "${clean(d.heroIntro)}"`,
      d.departure && `On leaving: "${clean(dest.departure)}"`,
      d.modelNote && `About the 3D model shown here: ${d.modelNote}`,
    ]
      .filter(Boolean)
      .join("\n"),
    source: { label: `${dest.name} story page · ${d.shortName}`, url: home },
  });

  /* --- one chunk per chapter: the actual written text --- */
  d.chapters.forEach((c) => {
    const m = c.metadata ?? {};
    const specs = Object.entries(m.missionSpecs ?? {})
      .map(([k, v]) => specLine(k, v))
      .filter(Boolean);
    const people = (m.people ?? []).map((p) => `${p.name} — ${p.role}`);
    const photos = imageCaptions(c);
    out.push({
      id: `${dest.id}-ch${c.number}`,
      title: `${d.shortName} — Chapter ${c.number}: ${c.title}`,
      kind: "story-text",
      dest: dest.name,
      text: [
        `${dest.name} story, Chapter ${c.number} of ${d.chapters.length}, "${c.title}" (${m.dateDisplay ?? ""}).`,
        c.paragraphs.map(clean).join("\n\n"),
        c.curioAside && `C.U.R.I.O. adds: "${clean(c.curioAside)}"`,
        locationText(m.location) && `Where: ${locationText(m.location)}.`,
        specs.length && `Mission facts — ${specs.join(" · ")}`,
        people.length && `People — ${people.join(" · ")}`,
        photos.length && `Archive photographs shown with this chapter — ${photos.join(" · ")}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      source: {
        label: `${dest.name} story · Chapter ${c.number}, "${c.title}"`,
        url: (m.sources ?? [])[0] || home,
      },
    });
  });

  /* --- the film, if this destination has one --- */
  const vid = d.video;
  if (vid?.src) {
    out.push({
      id: `${dest.id}-video`,
      title: `Mission film — ${vid.title}`,
      kind: "video",
      dest: dest.name,
      text: [
        `There is a narrated mission film on the ${dest.name} story page, titled "${vid.title}".`,
        `Where to find it: open the ${dest.name} story, and the panel marked MISSION VIDEO sits just below C.U.R.I.O.'s introduction, above Chapter 01.`,
        vid.file && `File: ${vid.src} (originally ${vid.file}).`,
        `What the film covers: ${vid.summary}`,
        vid.coversChapters?.length
          ? `The narration follows the written chapters ${vid.coversChapters.join(", ")} on the same page, so those chapters are the matching text for anything said in the film.`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      source: { label: `Mission film · ${vid.title}`, url: home },
    });
  }

  /* --- the quiz: questions and hints only, never the answers --- */
  const quiz = d.missionQuiz;
  if (quiz) {
    out.push({
      id: `${dest.id}-quiz`,
      title: `${dest.name} quiz — questions and hints`,
      kind: "quiz",
      dest: dest.name,
      text: [
        `The ${dest.name} quiz asks ${quiz.questions.length} questions and you need ${quiz.passScore} right to earn the stamp. Retries are allowed.`,
        "IMPORTANT: the correct answers are deliberately not recorded here. Give a hint and point at the chapter, never the answer.",
        ...quiz.questions.map(
          (q) =>
            `Question (relates to Chapter ${q.relatedChapter}): ${q.question} Hints C.U.R.I.O. gives for wrong picks: ${Object.values(
              q.wrongHints ?? {}
            )
              .map(clean)
              .join(" / ")}`
        ),
      ].join("\n\n"),
      source: { label: `${dest.name} quiz · C.U.R.I.O.`, url: home },
    });
  }

  /* --- the stamp --- */
  const r = d.stampReward;
  if (r) {
    out.push({
      id: `${dest.id}-stamp`,
      title: `${dest.name} stamp — ${r.title}`,
      kind: "reference",
      dest: dest.name,
      text: [
        `Passing the ${dest.name} quiz earns stamp ${r.stampSlot} of 3: "${r.title}"${r.subtitle ? `, ${r.subtitle}` : ""}.`,
        r.unlockCode && `Unlock code ${r.unlockCode}${r.unlockCodeMeaning ? ` — ${r.unlockCodeMeaning}` : ""}.`,
        r.stampText && `The stamp reads: ${r.stampText}.`,
        r.patch?.elements?.length && `The patch artwork shows: ${r.patch.elements.join("; ")}.`,
      ]
        .filter(Boolean)
        .join("\n"),
      source: { label: `Space Explorer Passport · ${r.title}`, url: home },
    });
  }

  /* --- the locked machines in the background --- */
  (dest.backgroundDevices ?? []).forEach((b) => {
    const status = LOCKED_HUD.statuses[b.hud?.status]?.label ?? b.hud?.status ?? "LOCKED";
    out.push({
      id: `${dest.id}-locked-${b.id}`,
      title: `${b.name} — locked machine on ${dest.name}`,
      kind: "story-text",
      dest: dest.name,
      text: [
        `${b.name} stands in the background on ${dest.name}. Its signal is ${status}, so its full story is archived for a future update.`,
        b.hud?.readout?.length && `Telemetry readout — ${b.hud.readout.join(" · ")}`,
        b.hud?.curioWhisper && `C.U.R.I.O. whispers: "${clean(b.hud.curioWhisper)}"`,
        b.teaserForFutureUpdate && `Teaser: ${clean(b.teaserForFutureUpdate)}`,
        b.images?.length && `Photograph: ${b.images.map((i) => `${i.title} (${i.url})`).join(" · ")}`,
        b.nssdcUrl && `Catalogue record: ${b.nssdcUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
      source: {
        label: `${dest.name} surface · ${b.name}`,
        url: b.missionPage || b.nssdcUrl || home,
      },
    });
  });

  return out;
}

/* ------------------------------------------------------------------ */
/* 3. The corpus                                                       */
/* ------------------------------------------------------------------ */

function build() {
  const docs = Object.entries(rawDocs).flatMap(([p, raw]) => chunksFromMarkdown(p, raw));
  const missions = destinations.flatMap(chunksFromDestination);

  const curio = {
    id: "curio-persona",
    title: "C.U.R.I.O. — who he is",
    kind: "reference",
    dest: null,
    text: `${CURIO.name} stands for ${CURIO.stands_for}. Personality: ${CURIO.personality} Voice: ${CURIO.voiceNotes}`,
    source: { label: "C.U.R.I.O. mission brief", url: null },
  };

  const noFilm = Object.entries(VIDEOS)
    .filter(([, v]) => !v?.src)
    .map(([k]) => k);
  const gaps = noFilm.length
    ? [
        {
          id: "video-gaps",
          title: "Which chapters have a film",
          kind: "video",
          dest: null,
          text: `Films exist for: ${Object.entries(VIDEOS)
            .filter(([, v]) => v?.src)
            .map(([, v]) => v.title)
            .join("; ")}. No film has been made yet for: ${noFilm.join(", ")}. If someone asks to watch a film that does not exist, say so plainly and point them to the written chapters and the archive photographs instead.`,
          source: { label: "Mission film availability", url: null },
        },
      ]
    : [];

  return [curio, ...docs, ...missions, ...gaps].map((c, i) => ({ ...c, n: i }));
}

export const KB = build();

export const KB_STATS = {
  chunks: KB.length,
  files: Object.keys(rawDocs).length + 1, // markdown docs + missionData.js
  byKind: KB.reduce((acc, c) => ({ ...acc, [c.kind]: (acc[c.kind] ?? 0) + 1 }), {}),
};
