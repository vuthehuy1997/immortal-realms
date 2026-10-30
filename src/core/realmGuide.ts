import { REALMS } from '../data/realms';
import { canBreakthrough, expectedRealm, hasNextRealm, qiMax, realmLag, type Cultivation } from './cultivation';

/** Where the hero stands on the road to the next realm. 'on-pace' means nothing is owed yet (or the top realm is reached). */
export type RealmStage = 'on-pace' | 'need-qi' | 'need-pill' | 'ready';

export interface RealmGuide {
  stage: RealmStage;
  /** realms the hero trails behind what their level assumes */
  lag: number;
  /** name of the realm they can reach next (null at the top realm) */
  next: string | null;
  /** stat multiplier now and after the next breakthrough */
  multNow: number;
  multNext: number | null;
  /** one-line status for the objective bar; null when nothing is owed */
  line: string | null;
  /** how loudly to say it: 'info' (eligible), 'warn' (trailing two or more realms, bosses will hit hard) */
  tone: 'none' | 'info' | 'warn';
}

/** Pure: reads the cultivation, level and pill count and says what the player should do about their realm. */
export function realmGuide(c: Cultivation, level: number, pills: number): RealmGuide {
  const lag = realmLag(c, level), next = hasNextRealm(c) ? REALMS[c.realm + 1]! : null;
  const multNow = REALMS[c.realm]!.statMult, multNext = next ? next.statMult : null;
  if (!next || lag < 1) return { stage: 'on-pace', lag, next: next?.name ?? null, multNow, multNext, line: null, tone: 'none' };
  const gain = `+${Math.round((next.statMult / multNow - 1) * 100)}% stats`;
  const tone = lag >= 2 ? 'warn' : 'info';
  const owed = Math.round((REALMS[expectedRealm(level)]!.statMult / multNow - 1) * 100);
  const behind = lag >= 2 ? ` You trail ${lag} realms: +${owed}% stats are waiting.` : '';
  if (canBreakthrough(c, level)) {
    if (pills >= 1) return { stage: 'ready', lag, next: next.name, multNow, multNext, line: `Breakthrough ready: press B to reach ${next.name} (${gain}).${behind}`, tone };
    return { stage: 'need-pill', lag, next: next.name, multNow, multNext, line: `Qi is full: brew a Foundation Pill with Alchemist Yun, then press B (${gain}).${behind}`, tone };
  }
  const pct = Math.floor((100 * c.qi) / qiMax(c));
  return { stage: 'need-qi', lag, next: next.name, multNow, multNext, line: `Break through to ${next.name} (${gain}): fill your qi with M, now ${pct}%.${behind}`, tone };
}

/** The realm a hero of this level is expected to have; re-exported so the UI never imports two modules for one idea. */
export { expectedRealm };
