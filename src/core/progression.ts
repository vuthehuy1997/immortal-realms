export interface Progress { level: number; xp: number }

export const MAX_LEVEL = 30;

/** XP needed to go from `level` to level+1. */
export const xpToNext = (level: number): number => Math.round(20 * Math.pow(level, 1.5));

/** Adds XP, handling multiple level-ups. Returns levels gained. At max level XP is not accumulated. */
export function addXp(p: Progress, amount: number): number {
  let gained = 0;
  if (amount <= 0) return 0;
  p.xp += amount;
  while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    gained++;
  }
  if (p.level >= MAX_LEVEL) p.xp = 0;
  return gained;
}
