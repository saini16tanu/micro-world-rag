"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Opening (about 1.6 s, once per visit): a glowing dot pulses, then splits like a dividing cell.
 * After that the page shows the big cell flying in (done in ScrollIntro).
 */
export default function OpeningIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  const dot = "absolute h-4 w-4 rounded-full bg-accent-cyan shadow-[0_0_24px_8px_rgba(0,214,255,0.7)]";
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-void"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onDone}
    >
      {/* pulse */}
      <motion.span
        className={dot}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 1, 1.3, 1], opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.3, 0.5, 0.75, 1] }}
      />
      {/* split into two */}
      {[-1, 1].map((d) => (
        <motion.span
          key={d}
          className={dot}
          initial={{ x: 0, opacity: 0, scale: 0.8 }}
          animate={{ x: d * 70, opacity: [0, 1, 0], scale: [0.8, 1, 0.6] }}
          transition={{ duration: 0.75, delay: 0.85, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}
