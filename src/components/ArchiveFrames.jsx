import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { framesFromChapter, resolveFromManifest, searchNasaImages } from "../lib/mission";

/** One polaroid. Tries the direct URL, then NASA's asset manifest / search, then shows an "archive offline" card. */
function Polaroid({ frame, index, feature = false }) {
  const [src, setSrc] = useState(frame.src);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  const tilt = [-3.2, 2.4, -1.6, 3][index % 4];

  const onError = async () => {
    if (tries === 0 && frame.fallbackSrc) {
      setTries(1);
      return setSrc(frame.fallbackSrc);
    }
    if (tries <= 1 && frame.manifest) {
      setTries(2);
      const alt = await resolveFromManifest(frame.manifest);
      if (alt && alt !== src) return setSrc(alt);
    }
    if (tries <= 2 && frame.searchId) {
      setTries(3);
      const [hit] = await searchNasaImages(frame.searchId, 1);
      if (hit?.src) return setSrc(hit.src);
    }
    setFailed(true);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 40, rotate: tilt * 2.2, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ rotate: 0, scale: 1.03, zIndex: 5 }}
      className={`relative bg-[#ece6d6] p-2.5 pb-3 text-obsidian shadow-[0_24px_50px_rgba(0,0,0,0.55)] ${feature ? "sm:col-span-2" : ""}`}
    >
      <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-2deg] bg-[#f4efe1]/70 shadow-sm" />
      <div className={`relative overflow-hidden bg-[#141720] ${feature ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        {!failed ? (
          <img
            src={src}
            alt={frame.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={onError}
            className="h-full w-full object-cover saturate-[0.85] sepia-[0.12] transition duration-700 hover:saturate-100 hover:sepia-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="font-mono text-[10px] tracking-[0.25em] text-warn">ARCHIVE FRAME OFFLINE</span>
            <span className="text-[11px] text-parchment/60">Open it on NASA&apos;s site instead.</span>
          </div>
        )}
        <span className="absolute left-2 top-2 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.15em] text-parchment/85">
          {frame.tag}
        </span>
      </div>
      <figcaption className="mt-2.5 px-0.5">
        <p className="font-serif text-[13px] leading-snug text-[#1b1d26]">{frame.title}</p>
        <a
          href={frame.link}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.18em] text-[#1b1d26]/60 hover:text-[#1b1d26]"
        >
          {frame.credit?.toUpperCase()} {frame.fromSearch ? "· IMAGE LIBRARY" : ""} <ExternalLink size={10} />
        </a>
      </figcaption>
    </motion.figure>
  );
}

/** Chapter photo wall: verified NASA images first, topped up from the NASA Image Library search. */
export default function ArchiveFrames({ chapter, max = 3 }) {
  const [frames, setFrames] = useState(() => framesFromChapter(chapter).slice(0, max));

  useEffect(() => {
    let alive = true;
    const base = framesFromChapter(chapter).slice(0, max);
    setFrames(base);
    const searches = chapter.metadata?.images?.searches ?? [];
    if (base.length >= max || !searches.length) return;
    (async () => {
      const extra = [];
      for (const s of searches) {
        if (base.length + extra.length >= max) break;
        const hits = await searchNasaImages(s.query, 2);
        for (const h of hits) {
          if (base.length + extra.length >= max) break;
          if (![...base, ...extra].some((f) => f.key === h.key)) extra.push(h);
        }
      }
      if (alive && extra.length) setFrames([...base, ...extra]);
    })();
    return () => {
      alive = false;
    };
  }, [chapter, max]);

  if (!frames.length) return null;
  return (
    <div className={`grid gap-6 ${frames.length === 1 ? "max-w-md" : "grid-cols-1 sm:grid-cols-2"}`}>
      {frames.map((f, i) => (
        <Polaroid key={f.key} frame={f} index={i} feature={frames.length === 3 && i === 0} />
      ))}
    </div>
  );
}
