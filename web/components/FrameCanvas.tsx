"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import { FRAME_BG, FRAME_COUNT, getFrameCache, nearestFrame } from "@/lib/frames";

type Props = {
  /** 0 = first frame, 1 = last frame */
  position: MotionValue<number>;
  /** show the thin glowing loading bar while frames download */
  showLoader?: boolean;
};

/**
 * Draws the amoeba image sequence on a canvas. Used by the scroll intro AND the chat background.
 * - frames come from one shared cache (downloaded once)
 * - draws only inside requestAnimationFrame, and only when the frame changes
 * - "cover" on desktop, "contain" on mobile, devicePixelRatio max 2
 * - a soft radial vignette melts the edges into the page color
 */
export default function FrameCanvas({ position, showLoader = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawn = useRef(-1);
  const rafId = useRef(0);
  const [percent, setPercent] = useState(0);
  const [ready, setReady] = useState(false);

  const toIndex = (v: number) => Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(v * (FRAME_COUNT - 1))));

  const draw = (index: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 1) return;
    if (!force && index === lastDrawn.current) return;
    const img = nearestFrame(index);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!img || !ctx) return;
    lastDrawn.current = index;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.fillStyle = FRAME_BG;
    ctx.fillRect(0, 0, cw, ch);

    // desktop = cover (fills the screen), mobile/portrait = contain (the cell is never cut off)
    const cover = cw >= ch && window.innerWidth >= 768;
    const scale = (cover ? Math.max : Math.min)(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

    // soft radial vignette: edges fade into the page color, so no image border shows
    const r = Math.hypot(Math.min(cw, dw), Math.min(ch, dh)) / 2;
    const g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(dw, dh) * 0.3, cw / 2, ch / 2, r);
    g.addColorStop(0, "rgba(1,2,3,0)");
    g.addColorStop(0.7, "rgba(1,2,3,0.5)");
    g.addColorStop(1, FRAME_BG);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  };

  const scheduleDraw = (force = false) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => draw(toIndex(position.get()), force));
  };

  // 1. Listen to the shared frame cache
  useEffect(() => {
    const c = getFrameCache();
    const update = () => {
      setPercent(Math.round((c.loaded / c.total) * 100));
      if (c.done) setReady(true);
      scheduleDraw(true);
    };
    c.listeners.add(update);
    update();
    return () => {
      c.listeners.delete(update);
      cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Keep the canvas the size of its box (sharp on retina), redraw on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      scheduleDraw(true);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Position changed -> draw the new frame on the next animation frame
  useMotionValueEvent(position, "change", () => scheduleDraw());

  return (
    <div className="pointer-events-none absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}
        aria-hidden
      />
      <AnimatePresence>
        {showLoader && !ready && (
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-3" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
              <div className="btn-gradient h-full rounded-full transition-[width] duration-200" style={{ width: `${percent}%`, boxShadow: "0 0 12px rgba(0,214,255,0.9)" }} />
            </div>
            <p className="text-xs tabular-nums tracking-[0.25em] text-white/40">GROWING CELL {percent}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
