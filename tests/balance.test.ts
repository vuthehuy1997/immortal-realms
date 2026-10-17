import { describe, expect, it } from 'vitest';
import { scaledEnemy } from '../src/core/balance';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { xpToNext } from '../src/core/progression';
import { BOSSES } from '../src/data/boss';
import { ENEMIES } from '../src/data/enemies';
import { SKILLS } from '../src/data/skills';
import { ZONES, type ZoneId } from '../src/data/zones';

/**
 * Design targets, encoded as tests so balance cannot silently drift. Assumes a Flame-root player with no gear
 * (the strongest-attack root, so these targets are not artificially easy), fighting continuously with the sword combo.
 */
const GRIND_ZONES: ZoneId[] = ['bamboo', 'marsh', 'grove', 'ruins'];
/** Typical player level for each zone, i.e. the middle of its stated band. */
const ZONE_LEVEL: Record<string, number> = { bamboo: 2, marsh: 5, grove: 7, ruins: 10 };
const stats = (level: number) => deriveStats('flame', level, level >= 10 ? 2 : level >= 5 ? 1 : 0, null);
const crit = (s: ReturnType<typeof stats>) => 1 + s.critChance * (s.critMult - 1);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const comboDps = (level: number, enemyDef: number) => {
  const s = stats(level);
  return COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - enemyDef * 0.5) * crit(s), 0) / cycle;
};
const enemyDps = (atk: number, cooldown: number, playerDef: number) => Math.max(1, atk - playerDef * 0.5) / cooldown;

describe('zone danger', () => {
  it('each zone is strictly tougher and more rewarding than the previous one', () => {
    for (let i = 1; i < GRIND_ZONES.length; i++) {
      const a = ZONES[GRIND_ZONES[i - 1]!].tier, b = ZONES[GRIND_ZONES[i]!].tier;
      expect(b.hp).toBeGreaterThan(a.hp); expect(b.atk).toBeGreaterThan(a.atk); expect(b.xp).toBeGreaterThan(a.xp);
    }
  });

  for (const zid of GRIND_ZONES) {
    const level = ZONE_LEVEL[zid]!;
    for (const id of Object.keys(ZONES[zid].spawns)) {
      it(`${zid}/${id} at level ${level}: a real fight (several seconds) that hurts but does not one-shot`, () => {
        const def = ENEMIES[id]!, sc = scaledEnemy(def, zid), p = stats(level);
        const ttk = sc.maxHp / comboDps(level, sc.def);
        const dps = enemyDps(sc.atk, def.attackCooldown, p.def);
        const pct = (dps / p.maxHp) * 100; // % of player HP lost per second while the enemy is attacking
        expect(ttk, 'time to kill').toBeGreaterThanOrEqual(def.behavior === 'caster' ? 1.2 : 2.2);
        expect(ttk, 'time to kill').toBeLessThanOrEqual(def.maxHp >= 100 ? 16 : 9);
        expect(pct, '% hp per second').toBeGreaterThanOrEqual(1.5);
        expect(pct, '% hp per second').toBeLessThanOrEqual(11);
        const hit = Math.max(1, sc.atk - p.def * 0.5);
        expect(hit / p.maxHp, 'a single hit').toBeLessThan(0.2);
      });
    }
  }

  it('over-levelled players feel stronger: at +6 levels the same enemy dies at least 20% faster', () => {
    const sc = scaledEnemy(ENEMIES.skeleton!, 'ruins');
    expect(sc.maxHp / comboDps(16, sc.def)).toBeLessThan((sc.maxHp / comboDps(10, sc.def)) * 0.8);
  });
  it('under-levelled players are in real danger: level 1 in the ruins takes lethal damage fast', () => {
    const sc = scaledEnemy(ENEMIES.skeleton!, 'ruins'), p = stats(1);
    expect(p.maxHp / enemyDps(sc.atk, ENEMIES.skeleton!.attackCooldown, p.def)).toBeLessThan(8);
  });
  it('elites are meaningfully tougher and pay triple', () => {
    const n = scaledEnemy(ENEMIES.ghost!, 'marsh'), e = scaledEnemy(ENEMIES.ghost!, 'marsh', true);
    expect(e.maxHp).toBeGreaterThan(n.maxHp * 2); expect(e.atk).toBeGreaterThan(n.atk); expect(e.xp).toBe(n.xp * 3);
  });
});

describe('martial techniques', () => {
  it('techniques out-damage the combo per use and cost accordingly (they are burst, not filler)', () => {
    const s = stats(8), cyc = COMBO.reduce((a, h) => a + h.mult, 0) * s.atk;
    const byId = Object.fromEntries(SKILLS.map((k) => [k.id, k]));
    expect(byId['flying-sword']!.damageMult * s.atk).toBeGreaterThan(cyc / COMBO.length);
    expect(byId['lotus-burst']!.damageMult).toBeGreaterThan(byId['flying-sword']!.damageMult * 1.4);
    expect(byId['sword-rain']!.damageMult * (byId['sword-rain']!.ticks ?? 1)).toBeGreaterThan(byId['lotus-burst']!.damageMult * 1.8);
  });
  it('mana supports roughly one technique every few seconds, not spam', () => {
    const s = stats(5);
    const sustained = s.manaRegen / SKILLS[0]!.manaCost; // casts per second from regen alone
    expect(1 / sustained).toBeGreaterThan(2); expect(1 / sustained).toBeLessThan(8);
  });
});

describe('bosses', () => {
  const cases: [string, number][] = [['ninetail', 6], ['warden', 10]];
  for (const [id, level] of cases) {
    it(`${id} at level ${level}: a 40-150 second fight with slams that matter`, () => {
      const b = BOSSES[id]!, p = stats(level);
      const effective = comboDps(level, b.def) * 0.5; // you spend about half the fight dodging
      const ttk = b.maxHp / effective;
      expect(ttk).toBeGreaterThan(40); expect(ttk).toBeLessThan(150);
      const slam = Math.max(1, b.atk * b.slam.damageMult - p.def * 0.5);
      expect(slam / p.maxHp).toBeGreaterThan(0.12); expect(slam / p.maxHp).toBeLessThan(0.38);
    });
  }
  it('the final boss is tougher than the fox', () => { expect(BOSSES.warden!.maxHp).toBeGreaterThan(BOSSES.ninetail!.maxHp); expect(BOSSES.warden!.atk).toBeGreaterThan(BOSSES.ninetail!.atk); });
});

describe('progression pacing', () => {
  it('levelling inside a zone needs a meaningful number of kills, never one or hundreds', () => {
    for (const zid of GRIND_ZONES) {
      const level = ZONE_LEVEL[zid]!, entries = Object.entries(ZONES[zid].spawns);
      const total = entries.reduce((a, [, n]) => a + n, 0);
      const avgXp = entries.reduce((a, [id, n]) => a + scaledEnemy(ENEMIES[id]!, zid).xp * n, 0) / total;
      const kills = xpToNext(level) / avgXp;
      expect(kills, `${zid} kills to level`).toBeGreaterThan(4); expect(kills, `${zid} kills to level`).toBeLessThan(45);
    }
  });
  it('the first levels come quickly (hook) while later ones slow down', () => {
    expect(xpToNext(1)).toBeLessThan(40); expect(xpToNext(15)).toBeGreaterThan(xpToNext(5) * 3);
  });
});
