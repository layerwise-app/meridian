/**
 * The contour field: Meridian's one generative figure.
 *
 * A slowly drifting scalar field (seeded simplex noise plus a gentle slope),
 * traced into iso-lines with marching squares. The same seed always gives the
 * same figure, so the canvas on a page, its pre-rendered still, and its share
 * image all match. This file has no imports and no DOM access: the canvas
 * component and `scripts/share-images.mjs` both use it.
 */

/** 32-bit hash of a string (cyrb-style), used to seed everything else. */
export function hashSeed(input: string): number {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 ^ h1) >>> 0;
}

/** Small, fast, seeded PRNG returning numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRAD3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0,
  -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
]);

/** Seeded 3D simplex noise in roughly [-1, 1]. */
export function createNoise3D(random: () => number) {
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
  const F3 = 1 / 3;
  const G3 = 1 / 6;

  return function noise(x: number, y: number, z: number): number {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);
    // Which simplex corner offsets apply, without allocating in this hot path.
    let i1 = 0, j1 = 0, k1 = 0, i2 = 0, j2 = 0, k2 = 0;
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; i2 = 1; j2 = 1;
      } else if (x0 >= z0) {
        i1 = 1; i2 = 1; k2 = 1;
      } else {
        k1 = 1; i2 = 1; k2 = 1;
      }
    } else if (y0 < z0) {
      k1 = 1; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      j1 = 1; j2 = 1; k2 = 1;
    } else {
      j1 = 1; i2 = 1; j2 = 1;
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n = 0;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      const g = permMod12[ii + perm[jj + perm[kk]]] * 3;
      t0 *= t0;
      n += t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      const g = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
      t1 *= t1;
      n += t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      const g = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
      t2 *= t2;
      n += t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      const g = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
      t3 *= t3;
      n += t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3);
    }
    return 32 * n;
  };
}

export type FieldParams = {
  /** Field units across the figure's width. Larger means busier. */
  scale: number;
  /** Direction and strength of the underlying slope. */
  angle: number;
  slope: number;
  /** Strength of the domain warp that gives lines their swing. */
  warp: number;
  /** Spacing between contour levels. */
  step: number;
  /** Every `indexEvery`-th line is drawn heavier, like a survey map. */
  indexEvery: number;
  /** Slow drift of the whole field, in field units per time unit. */
  driftX: number;
  driftY: number;
  offsetX: number;
  offsetY: number;
};

export type Field = {
  seed: string;
  params: FieldParams;
  sample: (u: number, v: number, t: number) => number;
};

/** Build the field for a seed, like `home` or a post's slug. */
export function createField(seed: string): Field {
  const random = mulberry32(hashSeed(seed));
  const noise = createNoise3D(random);
  const between = (min: number, max: number) => min + random() * (max - min);
  const params: FieldParams = {
    scale: between(1.7, 2.5),
    angle: between(0, Math.PI * 2),
    slope: between(0.3, 0.55),
    warp: between(0.35, 0.6),
    step: between(0.04, 0.05),
    indexEvery: 5,
    driftX: between(-0.05, 0.05),
    driftY: between(-0.035, 0.035),
    offsetX: between(-40, 40),
    offsetY: between(-40, 40)
  };
  const cos = Math.cos(params.angle);
  const sin = Math.sin(params.angle);

  const sample = (u: number, v: number, t: number) => {
    const x = u * params.scale + params.offsetX + params.driftX * t;
    const y = v * params.scale + params.offsetY + params.driftY * t;
    const wx = x + params.warp * noise(x * 0.55 + 13.1, y * 0.55, t * 0.35);
    const wy = y + params.warp * noise(x * 0.55, y * 0.55 + 7.7, t * 0.35);
    const n =
      0.74 * noise(wx * 0.7, wy * 0.7, t) +
      0.22 * noise(wx * 1.6 + 3.3, wy * 1.6 - 1.7, t * 1.3) +
      0.04 * noise(wx * 3.4 - 8.2, wy * 3.4 + 2.9, t * 1.7);
    return n + params.slope * (u * cos + v * sin);
  };

  return { seed, params, sample };
}

export type Pointer = { x: number; y: number; strength: number };

export type ContourOptions = {
  width: number;
  height: number;
  /** Grid cell size in the same units as width and height. */
  cell: number;
  /** Field time. 0 is the still shown before motion and under reduced motion. */
  t: number;
  /** Lines bend away from this point. `strength` is 0 (none) to 1 (full). */
  pointer?: Pointer | null;
  /** Radius of the pointer's influence, as a fraction of the width. */
  pointerRadius?: number;
};

/** Flat arrays of line segments: x1, y1, x2, y2, x1, y1, … */
export type Contours = {
  lines: number[];
  index: number[];
  accent: number[];
};

/**
 * Trace the field's contour lines for one frame with marching squares.
 * Values are sampled on a regular grid; the grid's vertices are then nudged
 * away from the pointer, so the traced lines bend around it.
 */
export function traceContours(field: Field, options: ContourOptions): Contours {
  const { width, height, cell, t, pointer } = options;
  const cols = Math.max(2, Math.ceil(width / cell));
  const rows = Math.max(2, Math.ceil(height / cell));
  const dx = width / cols;
  const dy = height / rows;
  const stride = cols + 1;
  const count = stride * (rows + 1);
  const values = new Float32Array(count);
  const px = new Float32Array(count);
  const py = new Float32Array(count);

  const radius = (options.pointerRadius ?? 0.16) * width;
  const push = pointer ? pointer.strength * radius * 0.42 : 0;
  const twoSigma2 = 2 * radius * radius;

  for (let r = 0; r <= rows; r++) {
    const y = r * dy;
    for (let c = 0; c <= cols; c++) {
      const x = c * dx;
      const i = r * stride + c;
      values[i] = field.sample(x / width, y / width, t);
      let ox = x;
      let oy = y;
      if (push > 0 && pointer) {
        const ddx = x - pointer.x;
        const ddy = y - pointer.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < twoSigma2 * 4.5) {
          const d = Math.sqrt(d2) || 1;
          const f = push * Math.exp(-d2 / twoSigma2);
          ox += (ddx / d) * f;
          oy += (ddy / d) * f;
        }
      }
      px[i] = ox;
      py[i] = oy;
    }
  }

  const step = field.params.step;
  const every = field.params.indexEvery;
  // The one accent line is the level passing through the figure's centre at
  // rest, so it stays in view for every aspect ratio.
  const accentLevel = Math.round(
    field.sample(0.5, height / width / 2, 0) / step
  );
  const out: Contours = { lines: [], index: [], accent: [] };

  // Edge interpolation between two grid vertices for level `level`.
  const ex = new Float32Array(4);
  const ey = new Float32Array(4);
  const lerpEdge = (slot: number, a: number, b: number, level: number) => {
    const va = values[a];
    const vb = values[b];
    const k = va === vb ? 0.5 : (level - va) / (vb - va);
    ex[slot] = px[a] + (px[b] - px[a]) * k;
    ey[slot] = py[a] + (py[b] - py[a]) * k;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = r * stride + c;
      const tr = tl + 1;
      const bl = tl + stride;
      const br = bl + 1;
      const vtl = values[tl];
      const vtr = values[tr];
      const vbl = values[bl];
      const vbr = values[br];
      const lo = Math.min(vtl, vtr, vbl, vbr);
      const hi = Math.max(vtl, vtr, vbl, vbr);
      const kMin = Math.ceil(lo / step);
      const kMax = Math.floor(hi / step);
      for (let k = kMin; k <= kMax; k++) {
        const level = k * step;
        let code = 0;
        if (vtl > level) code |= 8;
        if (vtr > level) code |= 4;
        if (vbr > level) code |= 2;
        if (vbl > level) code |= 1;
        if (code === 0 || code === 15) continue;
        // Edges: 0 top, 1 right, 2 bottom, 3 left.
        lerpEdge(0, tl, tr, level);
        lerpEdge(1, tr, br, level);
        lerpEdge(2, bl, br, level);
        lerpEdge(3, tl, bl, level);
        const target =
          k === accentLevel
            ? out.accent
            : k % every === 0
              ? out.index
              : out.lines;
        const seg = (a: number, b: number) =>
          target.push(ex[a], ey[a], ex[b], ey[b]);
        switch (code) {
          case 1:
          case 14:
            seg(3, 2);
            break;
          case 2:
          case 13:
            seg(2, 1);
            break;
          case 3:
          case 12:
            seg(3, 1);
            break;
          case 4:
          case 11:
            seg(0, 1);
            break;
          case 6:
          case 9:
            seg(0, 2);
            break;
          case 7:
          case 8:
            seg(3, 0);
            break;
          case 5:
          case 10: {
            // Saddle: decide by the cell's centre value.
            const centre = (vtl + vtr + vbl + vbr) / 4 > level;
            if ((code === 5) === centre) {
              seg(3, 0);
              seg(2, 1);
            } else {
              seg(0, 1);
              seg(3, 2);
            }
            break;
          }
        }
      }
    }
  }
  return out;
}

/** Stroke styles shared by the canvas and the rendered stills. */
export const FIELD_STROKES = {
  lines: { width: 0.6, alpha: 0.42 },
  index: { width: 1, alpha: 0.78 },
  accent: { width: 1.35, alpha: 1 }
} as const;

/** Approximate time units per second of real time while animating. */
export const FIELD_SPEED = 0.008;
