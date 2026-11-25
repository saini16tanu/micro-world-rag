"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import FrameCanvas from "./FrameCanvas";
import { Magnetic } from "./Effects";
import { useFancy } from "@/lib/useFancy";

type Align = "left" | "right" | "center";
type Beat = { start: number; end: number; align: Align; title: string; text: string; chips?: string[]; last?: boolean };

// The story, as scroll percentages of the 500vh section
const BEATS: Beat[] = [
  { start: 0.12, end: 0.27, align: "left", title: "1. Upload & Load",
    text: "PyPDFLoader reads your PDF page by page and keeps every page number." },
  { start: 0.27, end: 0.42, align: "right", title: "2. Clean",
    text: "Broken words joined. Page numbers removed. Repeated headers and footers erased." },
  { start: 0.42, end: 0.6, align: "left", title: "3. Chunk",
    text: "Recursive Character Splitting cuts at the biggest natural break first: paragraph, line, sentence, word.",
    chips: ["800 characters", "120 overlap"] },
  { start: 0.6, end: 0.75, align: "right", title: "4. Embed",
    text: "Each chunk becomes 384 numbers with all-MiniLM-L6-v2." },
  { start: 0.75, end: 0.88, align: "center", title: "5. Vector Database",
    text: "Chunks are stored in Chroma. Your question finds the 4 closest." },
  { start: 0.88, end: 1, align: "center", title: "6. Answer", last: true,
    text: "Gemini answers only from those chunks, with page numbers." },
];

export function scrollToChatbot() {
  document.getElementById("chatbot")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Scroll the window to a point (0..1) of the intro section. */
function scrollToProgress(p: number) {
  const el = document.getElementById("intro");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + p * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
}

export default function ScrollIntro({ introDone }: { introDone: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const fancy = useFancy();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Scroll -> frame. A light spring makes it feel smooth, not jumpy.
  const framePos = useSpring(scrollYProgress, { stiffness: 160, damping: 32, restDelta: 0.0005 });

  // Mouse tilt (max 6deg) + slow zoom when the mouse is near the cell (desktop only)
  const rotX = useSpring(0, { stiffness: 60, damping: 18 });
  const rotY = useSpring(0, { stiffness: 60, damping: 18 });
  const hover = useSpring(1, { stiffness: 30, damping: 14 });
  const onMove = (e: React.MouseEvent) => {
    if (!fancy) return;
    const px = e.clientX / window.innerWidth - 0.5;
    const py = e.clientY / window.innerHeight - 0.5;
    rotY.set(px * 12);
    rotX.set(-py * 12);
    hover.set(Math.hypot(px, py) < 0.22 ? 1.08 : 1);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); hover.set(1); };

  // At the very end we "dive into the nucleus" before the chatbot
  const dive = useTransform(scrollYProgress, [0.93, 1], [1, 1.7]);
  const diveFade = useTransform(scrollYProgress, [0.93, 1], [1, 0.2]);
  const scale = useTransform([hover, dive], ([h, d]: number[]) => h * d);

  return (
    <section id="intro" ref={ref} className="relative h-[500vh]" onMouseMove={onMove} onMouseLeave={onLeave}>
      {/* Invisible anchors for the navbar links (top = progress x 400vh) */}
      <span id="how-it-works" className="absolute left-0 top-[56vh] h-px w-px" aria-hidden />
      <span id="chunking" className="absolute left-0 top-[184vh] h-px w-px" aria-hidden />
      <span id="vector-db" className="absolute left-0 top-[316vh] h-px w-px" aria-hidden />

      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ perspective: 1200 }}>
        {/* 3D stage: fly-in (opening) -> mouse tilt -> hover zoom + nucleus dive */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            introDone
              ? { opacity: 1, rotateX: 0, z: 0, filter: "blur(0px)" }
              : { opacity: 0, rotateX: 25, z: -600, filter: "blur(10px)" }
          }
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div className="absolute inset-0" style={{ rotateX: rotX, rotateY: rotY }}>
            <motion.div className="absolute inset-0" style={{ scale, opacity: diveFade }}>
              <FrameCanvas position={framePos} showLoader />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* cyan light sweep, once, right after the cell arrives */}
        {introDone && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent"
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "360%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.3, delay: 0.5, ease: "easeInOut" }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />

        <HeroBeat progress={scrollYProgress} show={introDone} />
        {BEATS.map((b) => (
          <StoryBeat key={b.title} beat={b} progress={scrollYProgress} />
        ))}

        <ProgressDots progress={scrollYProgress} />
      </div>
    </section>
  );
}

/** 0-12%: the title, centered */
function HeroBeat({ progress, show }: { progress: MotionValue<number>; show: boolean }) {
  const opacity = useTransform(progress, [0, 0.08, 0.12], [1, 1, 0]);
  const y = useTransform(progress, [0, 0.12], [0, -40]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.4 ? "auto" : "none"));
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 18, filter: "blur(8px)" },
    animate: show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.div style={{ opacity, y, pointerEvents }} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute h-80 w-[44rem] max-w-full rounded-full bg-[radial-gradient(ellipse,rgba(1,2,3,0.8),transparent_70%)]" />
      <motion.h1 {...enter(0.3)} className="text-glow relative text-5xl font-extrabold tracking-tighter text-white sm:text-7xl md:text-8xl">
        MICRO WORLD RAG
      </motion.h1>
      <motion.p {...enter(0.5)} className="relative mt-5 max-w-xl text-lg text-white/70 sm:text-xl">
        Every document is a living cell. Ask it anything.
      </motion.p>
      <motion.div {...enter(0.7)} className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
        <Magnetic onClick={scrollToChatbot} className="btn-gradient rounded-full px-7 py-3 text-sm font-semibold text-white">
          Open Chatbot
        </Magnetic>
        <Magnetic onClick={() => scrollToProgress(0.15)} className="glass gradient-border rounded-full px-7 py-3 text-sm font-semibold text-white/90 [--gb-fill:rgba(1,2,3,0.7)]">
          See how it works
        </Magnetic>
      </motion.div>
      <motion.div {...enter(1)} className="relative mt-12 flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-white/45">Scroll to explore</span>
        <motion.span
          className="block h-10 w-px bg-gradient-to-b from-accent-cyan/80 to-transparent"
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </motion.div>
  );
}

function StoryBeat({ beat, progress }: { beat: Beat; progress: MotionValue<number> }) {
  const { start, end, align, last } = beat;
  const fade = Math.min(0.035, (end - start) / 4);

  // fade in at the start, hold, fade out at the end (the last beat stays)
  const opacity = useTransform(
    progress,
    last ? [start, start + fade, 1] : [start, start + fade, end - fade, end],
    last ? [0, 1, 1] : [0, 1, 1, 0],
  );
  // blur -> sharp while it comes in
  const filter = useTransform(progress, [start, start + fade], ["blur(10px)", "blur(0px)"]);
  const shift = align === "left" ? -40 : align === "right" ? 40 : 0;
  const x = useTransform(progress, [start, start + fade], [shift, 0]);
  const y = useTransform(progress, [start, start + fade], [align === "center" ? 30 : 0, 0]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.4 ? "auto" : "none"));

  const position =
    align === "left"
      ? "items-end justify-start sm:items-center pb-24 sm:pb-0"
      : align === "right"
        ? "items-end justify-end sm:items-center pb-24 sm:pb-0"
        : "items-end justify-center pb-24 sm:pb-20 text-center";

  return (
    <motion.div style={{ opacity, pointerEvents }} className={`absolute inset-0 z-10 flex px-6 sm:px-14 lg:px-24 ${position}`}>
      <motion.div style={{ x, y, filter }} className="relative max-w-md">
        {/* dark glow behind the text so it reads over the bright cell */}
        <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(ellipse,rgba(1,2,3,0.85),rgba(1,2,3,0.5)_50%,transparent_75%)]" />
        <div className="relative">
          <h2 className="text-glow text-3xl font-bold tracking-tight text-white sm:text-5xl">{beat.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">{beat.text}</p>
          {beat.chips && (
            <div className="mt-5 flex flex-wrap gap-2">
              {beat.chips.map((c) => (
                <span key={c} className="gradient-border-soft rounded-full px-3 py-1 text-xs font-medium text-white/85 [--gb-fill:rgba(1,2,3,0.85)]">
                  {c}
                </span>
              ))}
            </div>
          )}
          {last && (
            <Magnetic onClick={scrollToChatbot} className="btn-gradient mt-7 rounded-full px-7 py-3 text-sm font-semibold text-white">
              Start chatting
            </Magnetic>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** 6 dots on the right: which step you are on. Click a dot to jump there. */
function ProgressDots({ progress }: { progress: MotionValue<number> }) {
  const [active, setActive] = useState(-1);
  useMotionValueEvent(progress, "change", (p) => {
    let a = -1;
    BEATS.forEach((b, i) => { if (p >= b.start) a = i; });
    setActive(a);
  });
  return (
    <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {BEATS.map((b, i) => (
        <button
          key={b.title}
          onClick={() => scrollToProgress(b.start + 0.05)}
          aria-label={b.title}
          title={b.title}
          className="group flex h-4 w-4 items-center justify-center"
        >
          <span
            className={`block rounded-full transition-all duration-300 ${
              i === active
                ? "h-3 w-3 bg-accent-cyan shadow-[0_0_12px_rgba(0,214,255,0.9)]"
                : i < active
                  ? "h-2 w-2 bg-accent-violet/80"
                  : "h-2 w-2 bg-white/20 group-hover:bg-white/50"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
