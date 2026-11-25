"use client";

import { useEffect, useState } from "react";

/**
 * True only on a desktop with a mouse and without "reduce motion".
 * The extra 3D effects (tilt, magnetic buttons, parallax) are turned on only then.
 */
export function useFancy(): boolean {
  const [fancy, setFancy] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setFancy(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fancy;
}
