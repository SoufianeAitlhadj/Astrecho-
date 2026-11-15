import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Award, ChevronDown, IdCard, Map as MapIcon } from "lucide-react";
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
import VideoPanel from "../components/VideoPanel";
import { modelKeyFor } from "../lib/mission";

function Chapter({ chapter, index, total, registerRef }) {
  const m = chapter.metadata;
  return (
    <section ref={registerRef} data-index={index} className="relative py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9 }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.3em] text-amber">
            CHAPTER {String(chapter.number).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-white/20" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-parchment/50">{m.dateDisplay.toUpperCase()}</span>
        </div>
        <h2 className="mt-4 font-serif text-2xl leading-[1.05] text-parchment text-balance md:text-3xl">{chapter.title}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8 }}
        className="mt-6 max-w-[62ch] space-y-4"
      >
        {chapter.paragraphs.map((p, i) => (
          <p key={i} className={`text-[13px] leading-[1.75] text-parchment/80 ${i === 0 ? "dropcap" : ""}`}>
            {p}
          </p>
        ))}
      </motion.div>

      <div className="mt-10">
        <ArchiveFrames chapter={chapter} />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7 }}
        className="mt-12 flex items-start gap-4"
      >
        <CurioAvatar size={64} className="shrink-0" />
        <div className="hud-glass relative rounded-sm rounded-tl-none px-5 py-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-amber">C.U.R.I.O. ADDS</p>
          <p className="mt-1 text-[13px] leading-relaxed text-parchment/85">{chapter.curioAside}</p>
        </div>
      </motion.div>
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
          <h1 className="mt-4 font-serif text-4xl leading-[0.95] text-parchment text-balance md:text-5xl">{device.name}</h1>
          {device.whatYouSee && <p className="mt-4 font-mono text-[11px] tracking-[0.15em] text-parchment/50">{device.whatYouSee.toUpperCase()}</p>}
          <div className="mt-10 flex items-start gap-4">
            <CurioAvatar size={96} speaking={speaking} className="shrink-0" />
            <Dialogue text={fillTemplate(device.heroIntro, { name: profile.name })} onSpeakingChange={setSpeaking} textClassName="text-sm" />
          </div>
          <motion.div className="mt-14 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-parchment/50" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown size={14} /> SCROLL TO EXPLORE
          </motion.div>
        </div>

        <VideoPanel video={device.video} />

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
                    <h3 className="mt-2 font-serif text-3xl text-parchment">{reward.title}</h3>
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
