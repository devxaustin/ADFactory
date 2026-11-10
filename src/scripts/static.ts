// TV static, drawn at a tiny resolution and scaled up with pixelated rendering
// so the grains are chunky. Tinted with whatever phosphor color is active.

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function phosphor(): [number, number, number] {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--ph-rgb')
    .trim()
    .split(/\s+/)
    .map(Number);
  return [v[0] || 255, v[1] || 176, v[2] || 32];
}

export interface StaticHandle {
  stop(): void;
}

/** Start drawing static on a canvas. Call stop() to fade it out. */
export function startStatic(canvas: HTMLCanvasElement, cols = 128): StaticHandle {
  if (reduce.matches) return { stop() {} };

  const ratio =
    canvas.clientWidth && canvas.clientHeight ? canvas.clientHeight / canvas.clientWidth : 9 / 16;
  const w = cols;
  const h = Math.max(8, Math.round(w * ratio));
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop() {} };
  const img = ctx.createImageData(w, h);
  const [r, g, b] = phosphor();

  let alive = true;
  let raf = 0;
  let last = 0;

  const frame = (t: number) => {
    if (!alive) return;
    if (t - last > 42) {
      last = t;
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random();
        const white = v * v * 150;
        d[i] = Math.min(255, r * v + white);
        d[i + 1] = Math.min(255, g * v + white);
        d[i + 2] = Math.min(255, b * v + white);
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    raf = requestAnimationFrame(frame);
  };

  canvas.classList.add('on');
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      canvas.classList.remove('on');
    },
  };
}

/** A short burst of static, then it clears. */
export function burst(canvas: HTMLCanvasElement, ms = 220): void {
  const s = startStatic(canvas);
  setTimeout(() => s.stop(), ms);
}
