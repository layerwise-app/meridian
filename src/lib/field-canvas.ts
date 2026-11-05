import {
  createField,
  FIELD_SPEED,
  FIELD_STROKES,
  traceContours,
  type Contours
} from '~/lib/field';

type MountOptions = {
  seed: string;
  /** Called once, after the first frame is on the canvas. */
  onReady?: () => void;
};

/**
 * Runs the contour field on a canvas. It draws only while the figure is on
 * screen and the tab is visible, holds the finished still (t = 0, no pointer)
 * under prefers-reduced-motion, and coarsens its grid on slow devices.
 * Returns a cleanup function.
 */
export function mountField(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  { seed, onReady }: MountOptions
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const field = createField(seed);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const styles = getComputedStyle(container);
  const ink = styles.getPropertyValue('--ink').trim() || '#1c1a17';
  const accent = styles.getPropertyValue('--accent').trim() || '#7a2b22';

  let width = 0;
  let height = 0;
  let dpr = 1;
  let cell = 6;
  let minCell = 6;
  let t = 0;
  let last = 0;
  let raf = 0;
  let onScreen = false;
  let pageVisible = document.visibilityState === 'visible';
  let drawnOnce = false;
  let slowFrames = 0;
  let fastFrames = 0;
  const pointer = { x: 0, y: 0, strength: 0, target: 0 };

  const strokeSet = (coords: number[], style: { width: number; alpha: number }, color: string) => {
    if (coords.length === 0) return;
    ctx.beginPath();
    for (let i = 0; i < coords.length; i += 4) {
      ctx.moveTo(coords[i], coords[i + 1]);
      ctx.lineTo(coords[i + 2], coords[i + 3]);
    }
    ctx.globalAlpha = style.alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = style.width;
    ctx.stroke();
  };

  const draw = () => {
    if (width === 0 || height === 0) return;
    const started = performance.now();
    const contours: Contours = traceContours(field, {
      width,
      height,
      cell,
      t,
      pointer: pointer.strength > 0.002 ? pointer : null
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    strokeSet(contours.lines, FIELD_STROKES.lines, ink);
    strokeSet(contours.index, FIELD_STROKES.index, ink);
    strokeSet(contours.accent, FIELD_STROKES.accent, accent);
    ctx.globalAlpha = 1;

    // Keep each frame cheap: coarsen the grid if frames run long, refine
    // again when there is headroom.
    const spent = performance.now() - started;
    if (spent > 9) slowFrames++;
    else if (spent < 4) fastFrames++;
    if (slowFrames > 3) {
      cell = Math.min(cell * 1.2, minCell * 2.2);
      slowFrames = 0;
    } else if (fastFrames > 60 && cell > minCell) {
      cell = Math.max(minCell, cell / 1.1);
      fastFrames = 0;
    }

    if (!drawnOnce) {
      drawnOnce = true;
      onReady?.();
    }
  };

  const resize = () => {
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    // About 110 cells across, never finer than 4.5 CSS px.
    minCell = Math.max(4.5, width / 110);
    cell = Math.max(cell, minCell);
    if (drawnOnce || onScreen) draw();
  };

  const frame = (now: number) => {
    const dt = Math.min(now - last, 64) / 1000;
    last = now;
    t += dt * FIELD_SPEED;
    // Ease the pointer's influence in and out instead of snapping.
    pointer.strength += (pointer.target - pointer.strength) * Math.min(1, dt * 4);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const shouldRun = onScreen && pageVisible && !reduced.matches;
    if (shouldRun && raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (onScreen && !drawnOnce) draw();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (reduced.matches || !onScreen) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const margin = rect.width * 0.12;
    const inside =
      x > -margin &&
      y > -margin &&
      x < rect.width + margin &&
      y < rect.height + margin;
    pointer.x = x;
    pointer.y = y;
    pointer.target = inside ? 1 : 0;
  };
  const onPointerOut = () => {
    pointer.target = 0;
  };
  const onVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    sync();
  };
  const onReducedChange = () => {
    if (reduced.matches) {
      t = 0;
      pointer.strength = 0;
      pointer.target = 0;
      draw();
    }
    sync();
  };

  const visibility = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    },
    { rootMargin: '80px 0px' }
  );
  const sizing = new ResizeObserver(resize);

  resize();
  sizing.observe(container);
  visibility.observe(container);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerOut);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onReducedChange);

  return () => {
    cancelAnimationFrame(raf);
    raf = 0;
    visibility.disconnect();
    sizing.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onPointerOut);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onReducedChange);
  };
}
