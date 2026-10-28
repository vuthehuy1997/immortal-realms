/** Layout of floating combat numbers: a new number is lifted until it no longer overlaps one that is still rising nearby. */
export interface FloatSlot { x: number; y: number; t: number }
export const FLOAT_LIFE_MS = 650;

/** Prunes expired slots, finds a free y for a number at (x, y0), records it and returns the y. Mutates `slots`. */
export function placeFloat(slots: FloatSlot[], x: number, y0: number, nowMs: number, stepY = 8, maxTries = 6): number {
  for (let i = slots.length - 1; i >= 0; i--) if (nowMs - slots[i]!.t >= FLOAT_LIFE_MS) slots.splice(i, 1);
  let y = y0, tries = 0;
  while (tries++ < maxTries && slots.some((f) => Math.abs(f.x - x) < 16 && Math.abs(f.y - y) < stepY)) y -= stepY;
  slots.push({ x, y, t: nowMs });
  return y;
}
