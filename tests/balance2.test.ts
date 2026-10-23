import { describe, expect, it } from 'vitest';
import { scaledEnemy } from '../src/core/balance';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { BOSSES } from '../src/data/boss';
import { ENEMIES } from '../src/data/enemies';
import { ZONES, zonesOfChapter, type ZoneId } from '../src/data/zones';

/** Chapter 2 design targets (QA report 3: fights were over in under 5s once free quest gear was equipped). */
const CH1_BEST = { weapon: 'jade-sword', armor: 'immortal-mantle', charm: 'dragon-pearl' };
const CH2_SHOP = { weapon: 'froststeel-blade', armor: 'frost-mail', charm: 'dragon-pearl' };
const LEVEL: Record<string, number> = { frostpass: 12, crystal: 14, barrow: 16 };
const stats = (level: number, gear: typeof CH1_BEST) => deriveStats('flame', level, level >= 10 ? 2 : 1, gear);
const crit = (s: ReturnType<typeof stats>) => 1 + s.critChance * (s.critMult - 1);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const comboDps = (s: ReturnType<typeof stats>, enemyDef: number) => COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - enemyDef * 0.5) * crit(s), 0) / cycle;
const enemyDps = (atk: number, cd: number, def: number) => Math.max(1, atk - def * 0.5) / cd;

describe('chapter 2 fights', () => {
  for (const zid of ['frostpass', 'crystal', 'barrow'] as ZoneId[]) {
    for (const id of Object.keys(ZONES[zid].spawns)) {
      it(`${zid}/${id}: a real fight with chapter 1 gear, still winnable with shop gear`, () => {
        const def = ENEMIES[id]!, sc = scaledEnemy(def, zid);
        const old = stats(LEVEL[zid]!, CH1_BEST), shop = stats(LEVEL[zid]!, CH2_SHOP);
        const ttkOld = sc.maxHp / comboDps(old, sc.def), ttkShop = sc.maxHp / comboDps(shop, sc.def);
        expect(ttkOld, `ttk with ch1 gear ${ttkOld.toFixed(1)}s`).toBeGreaterThan(3); expect(ttkOld).toBeLessThan(16);
        expect(ttkShop, `ttk with shop gear ${ttkShop.toFixed(1)}s`).toBeGreaterThan(2);
        const dps = enemyDps(sc.atk, def.attackCooldown, old.def);
        expect(old.maxHp / dps, `time to kill the player ${(old.maxHp / dps).toFixed(0)}s`).toBeGreaterThan(14);
        expect(dps * ttkOld, 'a single fight should cost HP').toBeGreaterThan(old.maxHp * 0.03);
        expect(dps * ttkOld, 'but not most of it').toBeLessThan(old.maxHp * 0.6);
      });
    }
  }
  it('chapter 2 zones get strictly tougher along the main path', () => {
    const t = (z: ZoneId) => ZONES[z].tier;
    expect(t('crystal').hp).toBeGreaterThan(t('frostpass').hp); expect(t('barrow').hp).toBeGreaterThan(t('crystal').hp);
    for (const z of zonesOfChapter(2).filter((x) => Object.keys(ZONES[x].spawns).length)) expect(t(z).hp).toBeGreaterThan(ZONES.ruins.tier.hp);
  });
  it('chapter 2 bosses outrank chapter 1 bosses and last long enough to have phases', () => {
    const s = stats(18, { weapon: 'froststeel-blade', armor: 'frost-mail', charm: 'barrow-ward' });
    for (const id of ['corpseking', 'crystalcolossus', 'sovereign']) {
      const b = BOSSES[id]!, ttk = b.maxHp / comboDps(s, b.def);
      expect(b.maxHp, id).toBeGreaterThan(BOSSES.jiaolong!.maxHp);
      expect(ttk, `${id} ttk ${ttk.toFixed(0)}s of pure damage`).toBeGreaterThan(40);
    }
  });
});
