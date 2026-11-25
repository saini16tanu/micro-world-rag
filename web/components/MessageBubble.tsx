"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ChatMessage } from "@/lib/types";
import CellIcon from "./CellIcon";
import SourceChip from "./SourceChip";
import { Markdown } from "./Markdown";

/** One chat message. User = right (violet), bot = left (dark glass, cyan edge, cell avatar). */
export default function MessageBubble({ message, onTyped }: { message: ChatMessage; onTyped?: () => void }) {
  const isUser = message.role === "user";
  const reduce = useReducedMotion();
  const full = message.text;
  const typewriter = !isUser && message.animate && !reduce;
  const [shown, setShown] = useState(typewriter ? 0 : full.length);
  const [copied, setCopied] = useState(false);

  // Typewriter: reveal the answer in about 1.5 seconds, whatever its length
  useEffect(() => {
    if (!typewriter) return;
    const step = Math.max(2, Math.ceil(full.length / 90));
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(full.length, n + step);
        if (next >= full.length) clearInterval(t);
        return next;
      });
      onTyped?.();
    }, 16);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typewriter, full]);

  const done = shown >= full.length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <span className="mt-1">
          <CellIcon size={28} pulse={!done} />
        </span>
      )}
      <div className={`max-w-[85%] sm:max-w-[78%] ${isUser ? "" : "min-w-0"}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-accent-violet to-[#4F46E5] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-[0_0_24px_rgba(124,58,237,0.35)]"
              : `glass rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] leading-relaxed text-white/80 ${
                  message.error
                    ? "border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                    : "border-accent-cyan/25 shadow-[0_0_22px_rgba(0,214,255,0.12)]"
                }`
          }
        >
          {isUser ? <p className="whitespace-pre-wrap break-words">{full}</p> : <Markdown text={full.slice(0, shown)} />}
        </div>

        {!isUser && done && !message.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex flex-wrap items-center gap-1.5">
            {message.sources?.map((s) => <SourceChip key={s.page} source={s} />)}
            <button
              onClick={copy}
              className="ml-1 rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/50 transition hover:border-white/30 hover:text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
