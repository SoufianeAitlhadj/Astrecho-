import { Sparkles } from "lucide-react";
import { SiMark } from "./SiWatermark";

/**
 * The small note that closes every page: who made it (Supersintelligence · SI)
 * and an honest line about which parts of the media are AI-generated.
 *
 * `compact` is for the full-screen views (splash, surface panorama), where
 * there is no page bottom to sit on — one line, absolutely positioned.
 */
export default function PageNote({ compact = false, className = "" }) {
  if (compact) {
    return (
      <p
        // The side padding keeps the line clear of the Ask C.U.R.I.O. launcher.
        className={`pointer-events-none flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pl-4 pr-4 text-center font-mono text-[9px] leading-4 tracking-[0.2em] text-parchment/35 sm:pl-52 sm:pr-52 ${className}`}
      >
        <SiMark />
        <span>SUPERSINTELLIGENCE (SI)</span>
        <span className="text-parchment/20">·</span>
        <span>AI-GENERATED FILMS &amp; NARRATION, BUILT ON REAL NASA DATA</span>
      </p>
    );
  }

  return (
    <footer className={`border-t border-white/10 pt-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SiMark label />
        <span className="font-mono text-[9px] tracking-[0.22em] text-parchment/35">
          NASA SPACE APPS CHALLENGE · THE MACHINES WE LEFT BEHIND
        </span>
      </div>
      <p className="mt-2 flex max-w-[78ch] items-start gap-2 font-mono text-[9px] leading-[1.7] tracking-[0.08em] text-parchment/40">
        <Sparkles size={11} className="mt-[3px] shrink-0 text-amber/70" />
        <span>
          AI-generated media: the mission films on this site were generated with AI in a Vox-style edit from real NASA
          photographs and mission records, and the narration was synthesized with the ElevenLabs API. Dates, distances,
          coordinates and quotes come from NASA sources — the images, voices and motion are synthetic.
        </span>
      </p>
    </footer>
  );
}
