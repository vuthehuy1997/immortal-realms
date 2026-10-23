import { describe, expect, it } from 'vitest';
import { aggregate, applyBoons, CHOICES, NO_MODS, picksForLevels, rollChoices, validBoons } from '../src/core/boons';
import { boonChoices, grantXp, newGameState, registerKill, statsOf, takeBoon } from '../src/core/gameState';
import { parseSave, serialize, checksum } from '../src/core/save';
import { xpToNext } from '../src/core/progression';
import { BOON_IDS, BOONS } from '../src/data/boons';
import { deriveStats } from '../src/core/character';
import { createRng } from '../src/core/rng';

const fresh = () => newGameState('Lin', 'flame', 'swordsman', { x: 10, y: 10 });

describe('boon data', () => {
  it('has unique ids, text and at least one effect each', () => {
    expect(BOON_IDS.length).toBeGreaterThanOrEqual(12);
    for (const b of Object.values(BOONS)) { expect(b.name.length).toBeGreaterThan(2); expect(b.desc.length).toBeGreaterThan(5); expect(Object.keys(b.mods).length).toBeGreaterThan(0); }
  });
  it('taking every boon stays bounded (no runaway build)', () => {
    const m = aggregate(BOON_IDS);
    expect(m.atkPct).toBeLessThan(0.5); expect(m.maxHpPct).toBeLessThan(0.5); expect(m.lifesteal).toBeLessThanOrEqual(0.06);
    expect(m.dashCdMult).toBeGreaterThanOrEqual(0.6);
    const base = deriveStats('flame', 20, 2, null), s = applyBoons(base, m);
    expect(s.critChance).toBeLessThanOrEqual(0.9);
    expect(s.atk / base.atk).toBeLessThan(1.5);
  });
});

describe('boon maths', () => {
  it('no boons changes nothing', () => {
    const base = deriveStats('tide', 7, 1, null);
    expect(applyBoons(base, aggregate([]))).toEqual(base);
    expect(aggregate([])).toEqual(NO_MODS);
  });
  it('sums stat mods and multiplies the dash multiplier', () => {
    const m = aggregate(['sword-heart', 'dragon-vein', 'wind-step']);
    expect(m.atkPct).toBeCloseTo(0.18); expect(m.dashCdMult).toBeCloseTo(0.75);
  });
  it('picks are earned at every fifth level', () => {
    expect(picksForLevels(1, 4)).toBe(0); expect(picksForLevels(4, 5)).toBe(1); expect(picksForLevels(1, 12)).toBe(2); expect(picksForLevels(1, 30)).toBe(6); expect(picksForLevels(30, 30)).toBe(0);
  });
});

describe('rolling choices', () => {
  it('is deterministic, distinct and never offers an owned boon', () => {
    const owned = ['sword-heart', 'iron-bone'];
    const a = rollChoices(7, owned), b = rollChoices(7, owned);
    expect(a).toEqual(b); expect(a).toHaveLength(CHOICES); expect(new Set(a).size).toBe(CHOICES);
    for (const id of a) expect(owned).not.toContain(id);
  });
  it('different seeds give variety and rarer boons show up less often', () => {
    const seen = new Set<string>(); const count = { common: 0, rare: 0, epic: 0 };
    const rng = createRng(3);
    for (let i = 0; i < 400; i++) for (const id of rollChoices(Math.floor(rng() * 1e9), [])) { seen.add(id); count[BOONS[id]!.rarity]++; }
    expect(seen.size).toBe(BOON_IDS.length);
    const perCommon = count.common / 6, perEpic = count.epic / 3;
    expect(perCommon).toBeGreaterThan(perEpic);
  });
  it('offers fewer when the pool runs dry', () => { expect(rollChoices(1, BOON_IDS.slice(2))).toHaveLength(2); expect(rollChoices(1, BOON_IDS)).toEqual([]); });
});

describe('game state', () => {
  it('level-ups and first boss kills bank picks, repeat boss kills do not', () => {
    const gs = fresh(); expect(gs.boonPicks).toBe(0);
    let need = 0; for (let l = 1; l < 5; l++) need += xpToNext(l);
    grantXp(gs, need); expect(gs.progress.level).toBe(5); expect(gs.boonPicks).toBe(1);
    registerKill(gs, 'warden', () => 0.5); expect(gs.boonPicks).toBe(2);
    registerKill(gs, 'warden', () => 0.5); expect(gs.boonPicks).toBe(2);
  });
  it('takeBoon spends a pick only on an offered, unowned boon and changes stats', () => {
    const gs = fresh(); gs.boonPicks = 1;
    const offered = boonChoices(gs); expect(offered).toHaveLength(3);
    expect(takeBoon(gs, 'not-a-boon', offered)).toBe(false);
    const notOffered = BOON_IDS.find((id) => !offered.includes(id))!;
    expect(takeBoon(gs, notOffered, offered)).toBe(false);
    const before = statsOf(gs);
    expect(takeBoon(gs, 'iron-bone', ['iron-bone'])).toBe(true);
    expect(gs.boonPicks).toBe(0); expect(statsOf(gs).maxHp).toBeGreaterThan(before.maxHp);
    expect(takeBoon(gs, 'sword-heart', ['sword-heart'])).toBe(false); // no pick left
  });
  it('choices are stable until a boon is taken', () => {
    const gs = fresh(); gs.boonPicks = 2;
    expect(boonChoices(gs)).toEqual(boonChoices(gs));
  });
});

describe('save', () => {
  it('round-trips boons and picks', () => {
    const gs = fresh(); gs.boons = ['sword-heart']; gs.boonPicks = 2;
    const r = parseSave(serialize(gs));
    expect(r.ok && r.state.boons).toEqual(['sword-heart']); expect(r.ok && r.state.boonPicks).toBe(2);
  });
  it('an older save without boons gets the picks it already earned', () => {
    const gs = fresh(); gs.progress.level = 12; gs.bosses = ['warden'];
    const env = JSON.parse(serialize(gs)) as { state: Record<string, unknown>; checksum: string };
    delete env.state.boons; delete env.state.boonPicks;
    env.checksum = checksum(JSON.stringify(env.state));
    const r = parseSave(JSON.stringify(env));
    expect(r.ok).toBe(true); if (r.ok) { expect(r.state.boons).toEqual([]); expect(r.state.boonPicks).toBe(2 + 1); }
  });
  it('rejects unknown or duplicate boons', () => {
    expect(validBoons(['sword-heart', 'sword-heart'])).toBe(false); expect(validBoons(['nope'])).toBe(false); expect(validBoons([])).toBe(true);
    const gs = fresh(); gs.boons = ['nope'];
    expect(parseSave(serialize(gs)).ok).toBe(false);
  });
});
