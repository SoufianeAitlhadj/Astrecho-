import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Award, ChevronDown, ExternalLink, IdCard, Map as MapIcon } from "lucide-react";
import { destinations, fillTemplate } from "../data/missionData";
import { useProfile } from "../context/ProfileContext";
import ModelPanel from "../components/ModelPanel";
import ArchiveFrames from "../components/ArchiveFrames";
import CurioAvatar from "../components/CurioAvatar";
import Dialogue from "../components/Dialogue";
import HudButton from "../components/HudButton";
import HudFrame from "../components/HudFrame";
import Quiz from "../components/Quiz";
import StampSlam from "../components/StampSlam";
import Patch from "../components/Patch";
import { modelKeyFor, pullQuoteFor } from "../lib/mission";

function Chapter({ chapter, index, total, registerRef }) {
  const quote = useMemo(() => pullQuoteFor(chapter), [chapter]);
  const m = chapter.metadata;
  return (
    <section ref={registerRef} data-index={index} className="relative py-24 md:py-32">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9 }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.3em] text-amber">
            CHAPTER {String(chapter.number).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-white/20" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-parchment/50">{m.dateDisplay.toUpperCase()}</span>
        </div>
        <h2 className="mt-4 font-serif text-5xl leading-[1.02] text-parchment text-balance md:text-6xl">{chapter.title}</h2>
      </motion.div>

      <div className="mt-10 space-y-6">
        {chapter.paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className={`font-serif text-[21px] leading-[1.6] text-parchment/85 md:text-[23px] ${i === 0 ? "dropcap" : ""}`}
          >
            {p}
          </motion.p>
        ))}
      </div>

      <motion.blockquote
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.1 }}
        className="relative my-16 border-l border-amber/60 pl-6 md:pl-10"
      >
        <span className="absolute -left-2 -top-10 font-serif text-8xl leading-none text-amber/30">&ldquo;</span>
        <p className="font-serif text-3xl italic leading-[1.2] text-parchment text-balance md:text-[42px]">{quote.text}</p>
      </motion.blockquote>

      <ArchiveFrames chapter={chapter} />

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7 }}
        className="mt-14 flex items-start gap-4"
      >
        <CurioAvatar size={64} className="shrink-0" />
        <div className="hud-glass relative rounded-sm rounded-tl-none px-5 py-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-amber">C.U.R.I.O. ADDS</p>
          <p className="mt-1 text-[16px] leading-relaxed text-parchment/85">{chapter.curioAside}</p>
        </div>
      </motion.div>

      <details className="group mt-8 border-t border-white/10 pt-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-parchment/50 hover:text-parchment/80">
          <ChevronDown size={12} className="transition group-open:rotate-180" /> MISSION FILE · PEOPLE &amp; SOURCES
        </summary>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <ul className="space-y-1.5">
            {m.people.map((p) => (
              <li key={p.name} className="text-sm text-parchment/75">
                <span className="text-parchment">{p.name}</span> · <span className="text-parchment/55">{p.role}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5">
            {m.sources.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-mono text-[10px] text-signal/80 hover:text-signal">
                  {s.replace(/^https?:\/\//, "").slice(0, 70)} <ExternalLink size={10} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}

export default function StoryView({ destination, onBack, onHub, onOpenPassport, onStamped }) {
  const device = destination.heroDevice;
  const reward = device.stampReward;
  const { profile, hasStamp, awardStamp, stampCount } = useProfile();
  const [active, setActive] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [slam, setSlam] = useState(false);
  const [done, setDone] = useState(false);
  const refs = useRef([]);
  const modelKey = useMemo(() => modelKeyFor(device), [device]);
  const alreadyStamped = hasStamp(destination.id);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [destination.id]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const finishSlam = () => {
    awardStamp(destination.id, reward);
    setSlam(false);
    setDone(true);
    onStamped?.();
  };

  const allDone = stampCount === destinations.length;

  return (
    <div className="relative pt-14 lg:grid lg:grid-cols-2">
      {/* LEFT: sticky 3D inspection */}
      <div className="relative h-[58vh] border-b border-white/10 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:border-b-0 lg:border-r">
        <ModelPanel device={device} modelKey={modelKey} chapterIndex={active} destinationId={destination.id} />
      </div>

      {/* RIGHT: scrollytelling */}
      <div className="relative px-6 md:px-12 xl:px-20">
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center py-16">
          <HudButton onClick={onBack} className="mb-10 self-start">
            <ArrowLeft size={14} /> Back to surface
          </HudButton>
          <p className="font-mono text-[11px] tracking-[0.35em] text-signal">SIGNAL DECODED · {destination.name.toUpperCase()}</p>
          <h1 className="mt-4 font-serif text-6xl leading-[0.95] text-parchment text-balance md:text-7xl">{device.name}</h1>
          {device.whatYouSee && <p className="mt-4 font-mono text-[11px] tracking-[0.15em] text-parchment/50">{device.whatYouSee.toUpperCase()}</p>}
          <div className="mt-10 flex items-start gap-4">
            <CurioAvatar size={96} speaking={speaking} className="shrink-0" />
            <Dialogue text={fillTemplate(device.heroIntro, { name: profile.name })} onSpeakingChange={setSpeaking} textClassName="text-lg" />
          </div>
          <motion.div className="mt-14 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-parchment/50" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown size={14} /> SCROLL TO READ THE STORY
          </motion.div>
        </div>

        {device.chapters.map((c, i) => (
          <Chapter key={c.number} chapter={c} index={i} total={device.chapters.length} registerRef={(el) => (refs.current[i] = el)} />
        ))}

        <section className="pb-32 pt-10">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key="quiz" exit={{ opacity: 0, y: -20 }}>
                <Quiz quiz={device.missionQuiz} name={profile.name} alreadyStamped={alreadyStamped} onPass={() => setSlam(true)} />
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <HudFrame className="hud-glass flex flex-col items-center gap-6 rounded-sm p-8 text-center md:p-12" label="PASSPORT UPDATED">
                  <Patch svg={reward.patch.svg} size={150} title={reward.title} style={{ transform: `rotate(${reward.ink.rotationDeg}deg)` }} />
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.3em] text-amber">STAMP {stampCount} OF 3 · {reward.unlockCode}</p>
                    <h3 className="mt-2 font-serif text-5xl text-parchment">{reward.title}</h3>
                    <p className="mx-auto mt-3 max-w-md text-parchment/70">
                      {allDone
                        ? `That's all three, Astronaut ${profile.name}. Your Space Relic Historian Certificate is unlocked in your passport.`
                        : `${device.shortName}'s story is safe with you now. ${3 - stampCount} world${3 - stampCount > 1 ? "s" : ""} left to visit.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <HudButton variant="primary" onClick={onOpenPassport}>
                      {allDone ? <Award size={14} /> : <IdCard size={14} />} {allDone ? "Claim certificate" : "Open passport"}
                    </HudButton>
                    <HudButton onClick={onHub}>
                      <MapIcon size={14} /> Mission map
                    </HudButton>
                  </div>
                </HudFrame>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>{slam && <StampSlam reward={reward} destinationName={destination.name} onDone={finishSlam} />}</AnimatePresence>
    </div>
  );
}
