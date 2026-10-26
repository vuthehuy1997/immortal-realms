import { describe, expect, it } from 'vitest';
import { scaledEnemy } from '../src/core/balance';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { BOSSES } from '../src/data/boss';
import { CHAPTERS, CHAPTER_IDS } from '../src/data/chapters';
import { DUNGEONS } from '../src/data/dungeons';
import { ENEMIES } from '../src/data/enemies';
import { REALMS } from '../src/data/realms';
import { ZONES, zonesOfChapter, type ZoneDef } from '../src/data/zones';

/**
 * Whole-game balance targets, one set for every chapter from 3 on (chapters 1-2 keep their own, older tests).
 * A flame-root hero (the strongest-attack root, so targets are not artificially easy) fights with the sword combo.
 * Gear comes from `ChapterDef.gear`: `arrive` is the previous chapter's best, `shop` what this chapter sells.
 */
const bandOf = (z: ZoneDef): [number, number] | null => { const m = /Lv (\d+)-(\d+)/.exec(z.level); return m ? [Number(m[1]), Number(m[2])] : null; };
const realmAt = (level: number): number => REALMS.reduce((best, r, i) => (level >= r.reqLevel ? i : best), 0);
const stats = (level: number, gear: Parameters<typeof deriveStats>[3]) => deriveStats('flame', level, realmAt(level), gear);
const crit = (s: ReturnType<typeof stats>) => 1 + s.critChance * (s.critMult - 1);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const comboDps = (s: ReturnType<typeof stats>, enemyDef: number) => COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - enemyDef * 0.5) * crit(s), 0) / cycle;
const enemyDps = (atk: number, cd: number, def: number) => Math.max(1, atk - def * 0.5) / cd;

const LATE = CHAPTER_IDS.filter((n) => n >= 3);
const fightZones = (n: number): ZoneDef[] => [...zonesOfChapter(n).map((z) => ZONES[z]!), ...Object.values(DUNGEONS).filter((d) => d.chapter === n).map((d) => ZONES[d.id]!)].filter((z) => Object.keys(z.spawns).length > 0);
const chapterTop = (n: number): number => Math.max(...fightZones(n).map((z) => bandOf(z)?.[1] ?? 0));

describe('chapter 3+ layout of the level curve', () => {
  it('chapters are stacked: each starts where the last ended, up to the level cap', () => {
    let prevTop = 12;
    for (const n of LATE) {
      const bands = fightZones(n).map((z) => bandOf(z)!).filter(Boolean);
      expect(bands.length, `chapter ${n} has levelled zones`).toBeGreaterThan(0);
      const lo = Math.min(...bands.map((b) => b[0])), hi = Math.max(...bands.map((b) => b[1]));
      expect(lo, `chapter ${n} starts near level ${prevTop}`).toBeGreaterThanOrEqual(prevTop - 4); expect(lo).toBeLessThanOrEqual(prevTop + 2);
      expect(hi).toBeGreaterThan(lo + 4); expect(hi).toBeLessThanOrEqual(50);
      prevTop = hi;
    }
  });
  it('zone danger never drops from one chapter to the next', () => {
    let prev = Math.max(...fightZones(2).map((z) => z.tier.hp));
    for (const n of LATE) { const tiers = fightZones(n).map((z) => z.tier.hp); expect(Math.min(...tiers), `chapter ${n} weakest zone`).toBeGreaterThan(prev * 0.8); prev = Math.max(...tiers); }
  });
});

for (const n of LATE) {
  const ch = CHAPTERS[n]!;
  describe(`chapter ${n} fights (${ch.name})`, () => {
    for (const z of fightZones(n)) {
      const band = bandOf(z);
      if (!band) continue;
      const level = Math.round((band[0] + band[1]) / 2);
      for (const id of Object.keys(z.spawns)) {
        it(`${z.id}/${id} at level ${level}: a real fight with last chapter's gear, winnable with shop gear`, () => {
          const def = ENEMIES[id]!, sc = scaledEnemy(def, z.id);
          const old = stats(level, ch.gear.arrive), shop = stats(level, ch.gear.shop);
          const ttkOld = sc.maxHp / comboDps(old, sc.def), ttkShop = sc.maxHp / comboDps(shop, sc.def);
          expect(ttkOld, `ttk with arrival gear ${ttkOld.toFixed(1)}s`).toBeGreaterThan(def.behavior === 'caster' ? 2 : 3); expect(ttkOld).toBeLessThan(def.maxHp >= 100 ? 24 : 16);
          expect(ttkShop, `ttk with shop gear ${ttkShop.toFixed(1)}s`).toBeGreaterThan(1.8);
          const dps = enemyDps(sc.atk, def.attackCooldown, old.def);
          expect(old.maxHp / dps, `time to kill the hero ${(old.maxHp / dps).toFixed(0)}s`).toBeGreaterThan(12);
          expect(dps * ttkOld, 'a single fight should cost HP').toBeGreaterThan(old.maxHp * 0.03);
          expect(dps * ttkOld, 'but not most of it').toBeLessThan(old.maxHp * 0.65);
          expect(Math.max(1, sc.atk - old.def * 0.5) / old.maxHp, 'one hit').toBeLessThan(0.25);
        });
      }
    }
    it('bosses are long, phased fights that hit hard but do not one-shot', () => {
      const top = chapterTop(n), s = stats(top, ch.gear.shop);
      const bosses = Object.values(BOSSES).filter((b) => b.chapter === n);
      expect(bosses.length, `chapter ${n} has bosses`).toBeGreaterThanOrEqual(3);
      for (const b of bosses) {
        const ttk = b.maxHp / comboDps(s, b.def);
        expect(ttk, `${b.id} ttk ${ttk.toFixed(0)}s of pure damage`).toBeGreaterThan(b.dungeon ? 25 : 40); expect(ttk).toBeLessThan(300);
        expect(b.atk * 1.9 - s.def * 0.5, `${b.id}: its heaviest hit`).toBeLessThan(s.maxHp * 0.5);
        expect(b.atk, `${b.id}: its damage is a real threat`).toBeGreaterThan(s.maxHp * 0.06);
      }
    });
  });
}
