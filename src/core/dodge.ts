/** Perfect dodge: being hit while dash-invulnerable pays off (mana, a short damage bonus, slow motion), at most once per cooldown. */
export const PERFECT_COOLDOWN = 1.2;
export const PERFECT_MANA = 8;
export const PERFECT_DAMAGE = 1.25;
export const PERFECT_BUFF_TIME = 3;
export const PERFECT_SLOWMO = 0.35; // real seconds

/** True when a dodge at `now` earns the reward (and the cooldown is then the caller's to record). */
export const perfectReady = (lastAt: number, now: number): boolean => now - lastAt >= PERFECT_COOLDOWN;
