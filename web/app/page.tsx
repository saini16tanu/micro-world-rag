"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useInView } from "framer-motion";
import Navbar from "@/components/Navbar";
import ScrollIntro, { scrollToChatbot } from "@/components/ScrollIntro";
import UploadPanel from "@/components/UploadPanel";
import ChatWindow from "@/components/ChatWindow";
import ChatBackground from "@/components/ChatBackground";
import OpeningIntro from "@/components/OpeningIntro";
import { ApiError, BACKEND_DOWN, askQuestion, checkHealth, getStatus } from "@/lib/api";
import type { ChatMessage, DocInfo } from "@/lib/types";

const newId = () => Math.random().toString(36).slice(2);
const BADGES = ["LangChain", "Chroma", "Gemini", "Next.js", "Framer Motion"];

export default function Home() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [doc, setDoc] = useState<DocInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [opening, setOpening] = useState<boolean | null>(null); // null = not decided yet
  const chatRef = useRef<HTMLElement>(null);
  const chatInView = useInView(chatRef, { amount: 0.35 });
  const panelsIn = useInView(chatRef, { amount: 0.2, once: true });

  // Opening animation: once per visit, and never with "reduce motion"
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("mwr-opening") === "1";
    setOpening(!reduce && !seen && window.scrollY < 50);
  }, []);
  const finishOpening = useCallback(() => {
    sessionStorage.setItem("mwr-opening", "1");
    setOpening(false);
  }, []);
  const introDone = opening === false;

  // Check the backend now and every 10 seconds (green / red dot)
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      const ok = await checkHealth();
      if (alive) setOnline(ok);
    };
    ping();
    const t = setInterval(ping, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // On page load: is a PDF already loaded in the backend?
  useEffect(() => {
    getStatus()
      .then((s) => {
        if (s.has_pdf && s.file)
          setDoc({ file: s.file, pages: s.pages, chunks: s.chunks, avgChunkLength: s.avg_chunk_length ?? null });
      })
      .catch(() => {});
  }, [online]);

  const send = useCallback(
    async (question: string) => {
      // last 4 real messages = history for follow-up questions
      const history = messages
        .filter((m) => !m.error)
        .slice(-4)
        .map((m) => ({ role: m.role, text: m.text }));
      setMessages((prev) => [...prev, { id: newId(), role: "user", text: question }]);
      setWaiting(true);
      try {
        const r = await askQuestion(question, history);
        // no page chips when the answer is not in the PDF
        const unknown = /^\s*i do not know/i.test(r.answer);
        setMessages((prev) => [...prev, { id: newId(), role: "bot", text: r.answer, sources: unknown ? [] : r.sources, animate: true }]);
        setOnline(true);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : BACKEND_DOWN;
        if (e instanceof ApiError && e.backendDown) setOnline(false);
        setMessages((prev) => [...prev, { id: newId(), role: "bot", text: msg, error: true }]);
      } finally {
        setWaiting(false);
      }
    },
    [messages],
  );

  // chat panels fly in from far away (translateZ -400px) the first time you reach the chatbot
  const flyIn = (delay: number) => ({
    initial: { opacity: 0, z: -400, rotateX: 8 },
    animate: panelsIn ? { opacity: 1, z: 0, rotateX: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{opening && <OpeningIntro onDone={finishOpening} />}</AnimatePresence>

      <Navbar online={online} show={introDone} />

      <main className="relative">
        <ScrollIntro introDone={introDone} />

        {/* PART 2: the chatbot */}
        <section id="chatbot" ref={chatRef} className="relative isolate min-h-screen">
          <ChatBackground typing={waiting} />

          <div
            className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-10 pt-20 sm:px-6 lg:grid lg:h-screen lg:grid-cols-[320px_1fr] lg:gap-5"
            style={{ perspective: 1400 }}
          >
            <motion.div {...flyIn(0)} className="lg:h-full lg:min-h-0">
              <UploadPanel
                doc={doc}
                onUploaded={(d) => { setDoc(d); setMessages([]); setOnline(true); }}
                onReset={() => setMessages([])}
              />
            </motion.div>
            <motion.div {...flyIn(0.12)} className="lg:h-full lg:min-h-0">
              <ChatWindow doc={doc} messages={messages} waiting={waiting} onSend={send} onClear={() => setMessages([])} />
            </motion.div>
          </div>

          {online === false && (
            <p className="relative z-10 mx-auto max-w-7xl px-6 pb-6 text-center text-xs text-rose-300/80">{BACKEND_DOWN}</p>
          )}
        </section>

        <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10 text-center text-sm text-white/45">
          <p>
            Built by Tanu Saini · Mirai School of Technology ·{" "}
            <a href="https://github.com/saini16tanu" target="_blank" rel="noreferrer" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
              GitHub
            </a>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {BADGES.map((b) => (
              <span key={b} className="gradient-border-soft rounded-full px-3 py-1 text-xs text-white/70 [--gb-fill:#010203]">{b}</span>
            ))}
          </div>
        </footer>
      </main>

      {/* Always-available shortcut while the intro is on screen */}
      <motion.button
        onClick={scrollToChatbot}
        animate={{ opacity: chatInView || !introDone ? 0 : 1, y: chatInView ? 12 : 0 }}
        style={{ pointerEvents: chatInView || !introDone ? "none" : "auto" }}
        className="glass gradient-border fixed bottom-5 right-5 z-40 rounded-full px-4 py-2 text-sm font-medium text-white/90 shadow-[0_0_24px_rgba(0,214,255,0.3)] [--gb-fill:rgba(1,2,3,0.8)]"
      >
        Skip to chatbot ↓
      </motion.button>
    </MotionConfig>
  );
}
