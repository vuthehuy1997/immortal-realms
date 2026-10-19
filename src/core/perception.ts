import type { Vec2 } from './movement';

/** Full width of an enemy's vision cone (radians). Anything behind this arc is invisible to it. */
export const FOV = (130 * Math.PI) / 180;
/** Inside this distance an enemy notices you regardless of facing (footsteps, qi) — but still not through walls. */
export const SENSE_RADIUS = 26;
/** How fast enemies can turn (rad/s): slipping behind a chasing enemy with a dash buys a moment. */
export const TURN_RATE = 4.5;
/** Seconds a chasing enemy keeps hunting the last place it saw you before giving up. */
export const MEMORY_SECONDS = 3;

export const angleOf = (v: Vec2): number => Math.atan2(v.y, v.x);
const wrap = (a: number): number => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

/** Rotates unit `facing` toward `desired` by at most `maxRad`. */
export function turnToward(facing: Vec2, desired: Vec2, maxRad: number): Vec2 {
  if (!desired.x && !desired.y) return facing;
  const d = wrap(angleOf(desired) - angleOf(facing));
  const a = angleOf(facing) + Math.max(-maxRad, Math.min(maxRad, d));
  return { x: Math.cos(a), y: Math.sin(a) };
}

/** True when the target is inside the viewer's cone (or sense radius) and within `range`. */
export function inVisionCone(self: Vec2, facing: Vec2, target: Vec2, range: number, fov = FOV): boolean {
  const dx = target.x - self.x, dy = target.y - self.y, d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d <= SENSE_RADIUS) return true;
  return Math.abs(wrap(Math.atan2(dy, dx) - angleOf(facing))) <= fov / 2;
}

/** Cone + line of sight: `solid(x, y)` says whether a world point is opaque. */
export function canSee(self: Vec2, facing: Vec2, target: Vec2, range: number, solid: (x: number, y: number) => boolean): boolean {
  if (!inVisionCone(self, facing, target, range)) return false;
  const dx = target.x - self.x, dy = target.y - self.y, n = Math.ceil(Math.hypot(dx, dy) / 8);
  for (let i = 1; i < n; i++) if (solid(self.x + (dx * i) / n, self.y + (dy * i) / n)) return false;
  return true;
}
