/** Three-hit sword combo: click again inside the window to chain; the third hit is the heavy finisher. */
export interface ComboHit {
  mult: number;
  range: number;
  /** seconds from input to the damage frame */
  windup: number;
  /** seconds before another input is accepted */
  recover: number;
  lunge: number;
  knockback: number;
  anim: 'combo1' | 'combo2' | 'combo3';
}

export const COMBO: readonly ComboHit[] = [
  { mult: 0.75, range: 38, windup: 0.14, recover: 0.3, lunge: 8, knockback: 50, anim: 'combo1' },
  { mult: 0.85, range: 40, windup: 0.14, recover: 0.3, lunge: 8, knockback: 60, anim: 'combo2' },
  { mult: 1.4, range: 46, windup: 0.2, recover: 0.5, lunge: 14, knockback: 150, anim: 'combo3' },
];
export const COMBO_WINDOW = 0.9; // seconds after the last hit during which the chain continues

export interface ComboState { step: number; lastAt: number; busyUntil: number }
export const newCombo = (): ComboState => ({ step: -1, lastAt: -999, busyUntil: 0 });

/** Which hit would fire at `now`, or -1 if the player is still recovering from the previous swing. */
export function nextStep(c: ComboState, now: number): number {
  if (now < c.busyUntil) return -1;
  if (c.step >= 0 && now - c.lastAt <= COMBO_WINDOW && c.step < COMBO.length - 1) return c.step + 1;
  return 0;
}

/** Records that hit `step` started at `now`. */
export function commit(c: ComboState, step: number, now: number): void {
  c.step = step; c.lastAt = now; c.busyUntil = now + COMBO[step]!.recover;
}

export interface DashState { readyAt: number; until: number; invulnUntil: number }
export const DASH = { distance: 62, duration: 0.18, invuln: 0.3, cooldown: 1.1 } as const;
export const newDash = (): DashState => ({ readyAt: 0, until: 0, invulnUntil: 0 });

export function tryDash(d: DashState, now: number, cdMult = 1): boolean {
  if (now < d.readyAt) return false;
  d.readyAt = now + DASH.cooldown * cdMult; d.until = now + DASH.duration; d.invulnUntil = now + DASH.invuln;
  return true;
}
export const isDashing = (d: DashState, now: number): boolean => now < d.until;
export const isInvulnerable = (d: DashState, now: number): boolean => now < d.invulnUntil;
