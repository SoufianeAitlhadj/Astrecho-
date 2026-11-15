import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdCard, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { useSound } from "../context/SoundContext";
import HudButton from "./HudButton";
import { SiMark } from "./SiWatermark";

function UtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{now.toISOString().slice(11, 19)} UTC</span>;
}

export default function HudBar({ onOpenPassport, onAskCurio, location, stampPulse = 0 }) {
  const { profile, stampCount, passportButtonRef } = useProfile();
  const { muted, toggleMute } = useSound();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/10 bg-obsidian/70 backdrop-blur-md">
      <div className="mx-auto flex h-full items-center gap-4 px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap sm:gap-3">
          <span className="relative hidden h-2.5 w-2.5 sm:flex">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.28em] text-parchment/90">
            C.U.R.I.O.<span className="hidden sm:inline"> ARCHIVE</span>
          </span>
          {/* Supersintelligence watermark — rides the HUD bar, so it is on every screen. */}
          <span className="hidden h-5 w-px bg-white/15 sm:block" />
          <span className="hidden xl:block">
            <SiMark label />
          </span>
          <span className="block xl:hidden">
            <SiMark />
          </span>
          <span className="hidden font-mono text-[9px] tracking-[0.2em] text-parchment/40 2xl:inline">
            UPLINK · <UtcClock />
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <AnimatePresence mode="wait">
            {location && (
              <motion.span
                key={location}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="truncate whitespace-nowrap font-mono text-[10px] tracking-[0.22em] text-signal/80"
              >
                {location}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 xl:hidden" />

        <div className="flex items-center gap-2 md:gap-3">
          <HudButton variant="ghost" onClick={onAskCurio} className="!px-3 !py-2" aria-label="Ask C.U.R.I.O.">
            <MessageCircle size={14} />
            <span className="hidden md:inline">Ask C.U.R.I.O.</span>
          </HudButton>
          <AnimatePresence>
            {profile.name && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 md:gap-3"
              >
                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <span className="hud-label text-[9px]">Astronaut</span>
                  <span className="font-mono text-xs tracking-[0.18em] text-parchment">{profile.name.toUpperCase()}</span>
                </div>
                <span className="hidden h-7 w-px bg-white/15 sm:block" />
                <div className="flex flex-col items-end leading-tight">
                  <span className="hud-label text-[9px]">Stamps</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-parchment">
                    <motion.span key={stampPulse} initial={{ scale: 1.8, color: "#ffb347" }} animate={{ scale: 1, color: "#f4f1e8" }} transition={{ duration: 0.8 }}>
                      {stampCount}
                    </motion.span>
                    /3
                    <span className="ml-1 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < stampCount ? "bg-amber" : "border border-white/30"}`} />
                      ))}
                    </span>
                  </span>
                </div>
                <HudButton ref={passportButtonRef} variant="ghost" onClick={onOpenPassport} className="!px-3 !py-2" aria-label="Open Explorer Passport">
                  <IdCard size={15} />
                  <span className="hidden md:inline">Passport</span>
                </HudButton>
              </motion.div>
            )}
          </AnimatePresence>
          <HudButton variant="icon" onClick={toggleMute} aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </HudButton>
        </div>
      </div>
    </header>
  );
}
