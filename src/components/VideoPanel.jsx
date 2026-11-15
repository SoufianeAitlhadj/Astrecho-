import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Film } from "lucide-react";
import HudFrame from "./HudFrame";

/**
 * Mission video. Order tried: video.src → video.fallback → "Choose video file" picker
 * (the picker always works, even when the browser blocks the file path).
 */
export default function VideoPanel({ video, label = "MISSION VIDEO" }) {
  const candidates = [video?.src, video?.fallback].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => () => picked && URL.revokeObjectURL(picked), [picked]);
  if (!candidates.length) return null;

  const current = picked || candidates[idx];
  const failed = !picked && idx >= candidates.length;

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) setPicked(URL.createObjectURL(f));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="py-10">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-amber">
        <Film size={13} /> {label} · {video.title?.toUpperCase()}
      </p>
      <HudFrame className="hud-glass overflow-hidden rounded-sm p-2" label="VIDEO FEED">
        {!failed ? (
          <video
            key={current}
            controls
            playsInline
            preload="metadata"
            onError={() => !picked && setIdx((i) => i + 1)}
            className="aspect-video w-full bg-black object-contain"
          >
            <source src={current} type="video/mp4" />
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black/60 p-6 text-center">
            <span className="font-mono text-[10px] tracking-[0.25em] text-warn">VIDEO FILE NOT FOUND</span>
            <span className="max-w-md break-all font-mono text-[10px] text-parchment/50">Tried: {candidates.join("  ·  ")}</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 border border-amber/60 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-amber hover:bg-amber/10"
            >
              <FolderOpen size={14} /> CHOOSE VIDEO FILE
            </button>
          </div>
        )}
      </HudFrame>
      {!failed && (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 font-mono text-[9px] tracking-[0.2em] text-parchment/40 hover:text-parchment/70">
          CHANGE VIDEO FILE
        </button>
      )}
      <input ref={inputRef} type="file" accept="video/*" onChange={onPick} className="hidden" />
    </motion.div>
  );
}
