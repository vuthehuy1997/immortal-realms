import { createRng } from './rng';

/** Deterministic 2D value noise (0..1), smooth, built from a seeded lattice. */
export function createNoise(seed: number, size = 256): (x: number, y: number) => number {
  const rng = createRng(seed);
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng();
  const at = (ix: number, iy: number) => lattice[((iy & (size - 1)) * size) + (ix & (size - 1))]!;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a + (d - b - c + a) * fx) * fy;
  };
}

/** Fractal brownian motion on top of a base noise; result normalised to 0..1. */
export function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves = 4): number {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * freq, y * freq) * amp; norm += amp; amp *= 0.5; freq *= 2;
  }
  return sum / norm;
}
