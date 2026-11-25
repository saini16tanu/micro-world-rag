"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useFancy } from "@/lib/useFancy";

const SPRING = { stiffness: 220, damping: 20, mass: 0.6 };

/** 3D tilt that follows the mouse (desktop only). Only transform is animated. */
export function Tilt({ children, max = 10, className = "" }: { children: React.ReactNode; max?: number; className?: string }) {
  const fancy = useFancy();
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fancy) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 600 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Button that is gently pulled toward the mouse (desktop only). */
export function Magnetic({
  children,
  onClick,
  className = "",
  strength = 0.3,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
}) {
  const fancy = useFancy();
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!fancy || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x, y }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
