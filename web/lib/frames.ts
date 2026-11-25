// Info about the amoeba image sequence in public/frames/ (made from the ezgif frames).
// These values come from the real files, nothing is guessed.
export const FRAME_COUNT = 238;
export const FRAME_EXT = "jpg";

// Average of the 4 corner pixels of frame_0001.jpg. The page uses this color, so frame edges disappear.
export const FRAME_BG = "#010203";

/** Path of one frame. Index starts at 1. */
export function framePath(i: number): string {
  return `/frames/frame_${String(i).padStart(4, "0")}.${FRAME_EXT}`;
}

/** Phones / touch screens: smaller download, every 2nd frame only. */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

// ---------- shared frame cache: frames are downloaded ONCE and reused by every canvas ----------

type Cache = {
  images: (HTMLImageElement | null)[];
  loaded: number; // how many finished (ok or failed)
  total: number; // how many we try to load
  done: boolean;
  listeners: Set<() => void>;
};

let cache: Cache | null = null;

/** Start loading (only the first call does work). Returns the shared cache. */
export function getFrameCache(): Cache {
  if (cache) return cache;
  const step = isMobileDevice() ? 2 : 1; // phones: every 2nd frame
  const indexes: number[] = [];
  for (let i = 0; i < FRAME_COUNT; i += step) indexes.push(i);

  const c: Cache = { images: new Array(FRAME_COUNT).fill(null), loaded: 0, total: indexes.length, done: false, listeners: new Set() };
  cache = c;

  const notify = () => c.listeners.forEach((fn) => fn());
  for (const i of indexes) {
    const img = new Image();
    img.decoding = "async";
    img.src = framePath(i + 1);
    img
      .decode()
      .then(() => { c.images[i] = img; })
      .catch(() => {})
      .finally(() => {
        c.loaded++;
        if (c.loaded === c.total) c.done = true;
        // update listeners a few times, not 238 times
        if (c.loaded % 6 === 0 || c.done) notify();
      });
  }
  return c;
}

/** Closest frame that has loaded (so we never draw an empty canvas). */
export function nearestFrame(index: number): HTMLImageElement | null {
  const imgs = getFrameCache().images;
  for (let d = 0; d < imgs.length; d++) {
    const a = imgs[index - d];
    if (a) return a;
    const b = imgs[index + d];
    if (b) return b;
  }
  return null;
}
