import { describe, expect, it } from 'vitest';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { BOSSES } from '../src/data/boss';
import { CHAPTERS, CHAPTER_IDS } from '../src/data/chapters';
import { DUNGEONS } from '../src/data/dungeons';
import { REALMS } from '../src/data/realms';
import { ZONES, zonesOfChapter } from '../src/data/zones';

/** QA6 backlog 5: boss HP looked like a 15x jump (3.2k -> 330k). It is the hero's power curve; this test pins that the fights stay comparable. */
const realmAt = (level: number): number => REALMS.reduce((best, r, i) => (level >= r.reqLevel ? i : best), 0);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const topLevel = (n: number): number => Math.max(...[...zonesOfChapter(n).map((z) => ZONES[z]!), ...Object.values(DUNGEONS).filter((d) => d.chapter === n).map((d) => ZONES[d.id]!)].map((z) => Number(/Lv \d+-(\d+)/.exec(z.level)?.[1] ?? 0)));
const dpsAt = (n: number): number => {
  const top = topLevel(n), s = deriveStats('flame', top, realmAt(top), CHAPTERS[n]!.gear?.shop as never), crit = 1 + s.critChance * (s.critMult - 1);
  return COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult) * crit, 0) / cycle;
};
const median = (v: number[]): number => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]!;
const ttks = (n: number): number[] => Object.values(BOSSES).filter((b) => b.chapter === n).map((b) => b.maxHp / dpsAt(n));

describe('boss HP curve across chapters', () => {
  it('every boss, measured in seconds of the chapter-top hero hitting it, is a 15-250 s fight', () => {
    for (const n of CHAPTER_IDS) for (const b of Object.values(BOSSES).filter((x) => x.chapter === n)) {
      const t = b.maxHp / dpsAt(n);
      expect(t, `${b.id} ${t.toFixed(0)}s`).toBeGreaterThan(15); expect(t, `${b.id} ${t.toFixed(0)}s`).toBeLessThan(250);
    }
  });
  it('the typical fight length stays flat (within 2.2x) from chapter 1 to 5, so raw HP growth is just the power curve', () => {
    const meds = CHAPTER_IDS.map((n) => median(ttks(n)));
    expect(Math.max(...meds) / Math.min(...meds), meds.map((m) => m.toFixed(0)).join('/')).toBeLessThan(2.2);
  });
  it('boss HP never shrinks from a chapter to the next (median) and no chapter jumps more than 4x', () => {
    const med = CHAPTER_IDS.map((n) => median(Object.values(BOSSES).filter((b) => b.chapter === n).map((b) => b.maxHp)));
    for (let i = 1; i < med.length; i++) { expect(med[i]!).toBeGreaterThan(med[i - 1]!); expect(med[i]! / med[i - 1]!).toBeLessThan(4); }
  });
  it('each chapter has a finale: its longest fight is a main-map boss, not a cave boss', () => {
    for (const n of CHAPTER_IDS) {
      const bs = Object.values(BOSSES).filter((b) => b.chapter === n).sort((a, b) => b.maxHp - a.maxHp);
      expect(bs[0]!.dungeon, `chapter ${n} biggest boss ${bs[0]!.id}`).toBeUndefined();
    }
  });
});
