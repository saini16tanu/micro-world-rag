"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Small glowing cell (membrane + nucleus). Used for the bot avatar and the empty chat. */
export default function CellIcon({ size = 28, pulse = true }: { size?: number; pulse?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {/* soft outer glow */}
      <span className="absolute inset-[-20%] rounded-full bg-[radial-gradient(circle,rgba(0,214,255,0.35),transparent_70%)]" />
      {/* membrane that breathes */}
      <motion.span
        className="absolute inset-[6%] rounded-[46%_54%_50%_50%] border border-accent-cyan/70 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.18),rgba(124,58,237,0.18)_60%,transparent)] shadow-[0_0_10px_rgba(0,214,255,0.5),inset_0_0_8px_rgba(124,58,237,0.5)]"
        animate={pulse && !reduce ? { scale: [1, 1.07, 1], rotate: [0, 8, 0] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* nucleus */}
      <span className="absolute inset-[34%] rounded-full bg-white/90 shadow-[0_0_8px_2px_rgba(0,214,255,0.85)]" />
    </span>
  );
}
