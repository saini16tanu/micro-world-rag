"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import FrameCanvas from "./FrameCanvas";
import { FRAME_COUNT } from "@/lib/frames";
import { useFancy } from "@/lib/useFancy";

/**
 * Behind the chatbot: the amoeba frames loop slowly (about 15 fps), forward then backward.
 * Not linked to scroll. Darkened + slightly blurred, with mouse parallax.
 * It glows a bit brighter while the bot is typing. Paused when off screen.
 */
export default function ChatBackground({ typing }: { typing: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const fancy = useFancy();
  const pos = useMotionValue(0);

  // 15 fps ping-pong loop, only while visible
  useEffect(() => {
    if (!inView || reduce) return;
    let frame = Math.round(pos.get() * (FRAME_COUNT - 1));
    let dir = 1;
    const t = setInterval(() => {
      frame += dir;
      if (frame >= FRAME_COUNT - 1 || frame <= 0) dir = -dir;
      pos.set(frame / (FRAME_COUNT - 1));
    }, 1000 / 15);
    return () => clearInterval(t);
  }, [inView, reduce, pos]);

  // slight mouse parallax
  const x = useSpring(0, { stiffness: 40, damping: 16 });
  const y = useSpring(0, { stiffness: 40, damping: 16 });
  useEffect(() => {
    if (!fancy) return;
    const move = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * -24);
      y.set((e.clientY / window.innerHeight - 0.5) * -24);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [fancy, x, y]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div className="absolute -inset-8" style={{ x, y, filter: "brightness(0.45) blur(2px)" }}>
        <FrameCanvas position={pos} />
      </motion.div>
      {/* brighter cyan glow while the bot is typing (opacity only) */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,214,255,0.14),rgba(124,58,237,0.08)_40%,transparent_70%)]"
        animate={{ opacity: typing ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />
      {/* dark gradient on the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(1,2,3,0.9)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent" />
    </div>
  );
}
