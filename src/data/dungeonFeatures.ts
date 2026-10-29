import type { FeatureDef, FeatureKind } from '../core/dungeonFeatures';

/**
 * Round 22: what each cave / secret realm does beyond "walk, fight, boss". Layout is decided by `layoutFeatures` (core), seeded by the dungeon.
 * One seal gate per dungeon at most (plates OR braziers). Damage is a share of the hero's max HP, so it scales with the chapter by itself.
 */
const spike = (fields: number, per = 5): FeatureDef => ({ kind: 'traps', style: 'spike', fields, per, period: 3.2, warn: 0.9, active: 0.5, pct: 0.07 });
const fire = (fields: number, per = 4): FeatureDef => ({ kind: 'traps', style: 'fire', fields, per, period: 3.6, warn: 1.0, active: 0.9, pct: 0.08 });
const mist = (fields: number): FeatureDef => ({ kind: 'traps', style: 'mist', fields, per: 1, period: 7, warn: 1.2, active: 3.5, pct: 0.03 });
const plates = (count: number): FeatureDef => ({ kind: 'plates', count });
const braziers = (count: number, litFor: number): FeatureDef => ({ kind: 'braziers', count, litFor });
const collapse = (patches: number, ch: number): FeatureDef => ({ kind: 'collapse', patches, pit: 6, cache: 10 + 10 * ch, fall: 0.06 });
const ambush = (waves: number, per: number, ch: number): FeatureDef => ({ kind: 'ambush', waves, per, gap: 11, xp: 0, stones: 20 * ch });

export const DUNGEON_FEATURES: Record<string, FeatureDef[]> = {
  wolfden: [ambush(3, 3, 1), spike(2)],
  swordsanctum: [braziers(3, 14), spike(3)],
  's1-pearlgrotto': [collapse(2, 1), mist(2)],
  's1-stormroost': [plates(3), spike(2, 4)],
  's2-rimeheart': [spike(3, 4), ambush(2, 5, 2)],
  's2-gravewind': [braziers(4, 16), mist(2)],
  's2-mirrorvault': [plates(4), collapse(2, 2)],
  's2-wyrmden': [collapse(3, 2), fire(2), ambush(2, 5, 2)],
  'ember-burrow': [fire(3), plates(3)],
  'ember-mine': [collapse(2, 3), fire(2), braziers(3, 14)],
  'ember-vault': [plates(4), fire(3), ambush(3, 4, 3)],
  cloudhollow: [collapse(3, 4), mist(3)],
  jademine: [plates(3), spike(3), ambush(3, 4, 4)],
  scrollvault: [braziers(3, 15), mist(3), spike(2, 3)],
  moonpalace: [plates(3), collapse(3, 4), ambush(3, 4, 4)],
  'abyss-bonecavern': [ambush(4, 4, 5), spike(3), mist(1)],
  'abyss-bloodgrotto': [braziers(3, 14), fire(3), collapse(2, 5)],
  'abyss-mirrorvault': [plates(4), ambush(3, 5, 5), mist(2)],
  'abyss-ashmaw': [braziers(4, 16), fire(3), collapse(3, 5), ambush(4, 5, 5)],
};

export const featureKinds = (id: string): FeatureKind[] => [...new Set((DUNGEON_FEATURES[id] ?? []).map((f) => f.kind))];
/** A short label for the entrance prompt / design snapshot, e.g. "traps, seal gate (plates), ambush". */
export function featureBlurb(id: string): string {
  const out: string[] = [];
  for (const f of DUNGEON_FEATURES[id] ?? []) {
    out.push(f.kind === 'traps' ? (f.style === 'mist' ? 'poison mist' : f.style === 'fire' ? 'fire jets' : 'spike traps') : f.kind === 'plates' ? 'pressure-plate seal' : f.kind === 'braziers' ? 'brazier seal' : f.kind === 'collapse' ? 'collapsing floor' : 'ambush waves');
  }
  return [...new Set(out)].join(', ');
}
