import type { DecoKind, GroundKind } from '../core/world';

/** Frame indices into Kenney Tiny Town / Tiny Dungeon packed sheets (12 cols, 16px, no spacing). */
export const GROUND_FRAME: Record<GroundKind, number> = {
  grass: 0, grassFlowerA: 2, grassFlowerB: 1, path: 25,
};
/** Trees are two tiles tall (top, bottom); bush is a single tile. */
export const DECO_FRAMES: Record<Exclude<DecoKind, 'none'>, readonly number[]> = {
  treeGreen: [4, 16], treeOrange: [3, 15], bush: [5],
};
export const DUNGEON_FRAME = { hero: 85, wizard: 84, slime: 108, bat: 120, spider: 122, bossPlaceholder: 110 } as const;
