import { describe, expect, it } from 'vitest';
import { REALMS } from '../src/data/realms';
import { realmGuide } from '../src/core/realmGuide';

const full = (realm: number) => ({ realm, qi: REALMS[realm]!.qiMax });

describe('realm guide', () => {
  it('is silent while the hero is on pace', () => {
    for (let lvl = 1; lvl < REALMS[1]!.reqLevel; lvl++) expect(realmGuide({ realm: 0, qi: 0 }, lvl, 0)).toMatchObject({ stage: 'on-pace', line: null, tone: 'none', lag: 0 });
    expect(realmGuide({ realm: 1, qi: 0 }, REALMS[1]!.reqLevel, 0).stage).toBe('on-pace');
  });
  it('asks for qi first, with a percentage, once the level allows a breakthrough', () => {
    const g = realmGuide({ realm: 0, qi: 60 }, REALMS[1]!.reqLevel, 0);
    expect(g.stage).toBe('need-qi'); expect(g.tone).toBe('info'); expect(g.line).toContain('50%'); expect(g.line).toContain(REALMS[1]!.name);
  });
  it('asks for a pill when qi is full and none is owned, and says go when one is', () => {
    const lvl = REALMS[1]!.reqLevel;
    expect(realmGuide(full(0), lvl, 0)).toMatchObject({ stage: 'need-pill' });
    expect(realmGuide(full(0), lvl, 0).line).toContain('Foundation Pill');
    expect(realmGuide(full(0), lvl, 1)).toMatchObject({ stage: 'ready' });
    expect(realmGuide(full(0), lvl, 1).line).toContain('press B');
  });
  it('warns loudly when two or more realms behind, and quotes the stat gain', () => {
    const g = realmGuide({ realm: 0, qi: 0 }, 50, 0);
    expect(g.lag).toBeGreaterThanOrEqual(2); expect(g.tone).toBe('warn');
    expect(g.line).toContain(`+${Math.round((REALMS[1]!.statMult / REALMS[0]!.statMult - 1) * 100)}%`);
    expect(g.line).toContain(`You trail ${g.lag} realms`);
    expect(g.line).toContain(`+${Math.round((REALMS[6]!.statMult / REALMS[0]!.statMult - 1) * 100)}% stats are waiting`);
    expect(realmGuide({ realm: 0, qi: 0 }, REALMS[1]!.reqLevel, 0).line).not.toContain('You trail');
  });
  it('stays silent at the top realm', () => {
    const top = REALMS.length - 1;
    expect(realmGuide(full(top), 50, 3)).toMatchObject({ stage: 'on-pace', next: null, multNext: null, line: null });
  });
  it('never says anything for a hero exactly on pace at every level', () => {
    for (let lvl = 1; lvl <= 50; lvl++) {
      const realm = REALMS.reduce((b, r, i) => (lvl >= r.reqLevel ? i : b), 0);
      expect(realmGuide({ realm, qi: 0 }, lvl, 0).line, `level ${lvl}`).toBeNull();
    }
  });
});
