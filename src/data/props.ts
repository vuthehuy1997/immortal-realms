/** Scenery props (CC0 Xianxia Pixel Pack). `scale` maps source pixels to world units (16 units = 1 tile). */
export type PropKind =
  | 'pavilion' | 'stonebridge' | 'bamboo' | 'pine' | 'stairs' | 'paifang' | 'tower' | 'moonwall' | 'corridor' | 'taihurocks' | 'willow'
  | 'lingzhi' | 'orchid' | 'rock' | 'bambooshoot' | 'lotuspond' | 'petals' | 'goldpaifang' | 'palace' | 'jadebridge' | 'dragonpillar'
  | 'lotusthrone' | 'goldgate' | 'floatisle' | 'lotusbowl' | 'array' | 'standstone' | 'stonecircle' | 'peachtree' | 'pagoda7';

/** Collision rectangle in TILES relative to the prop's base-centre (x grows right, y grows down; negative dy = above the base). */
export interface Rect { dx: number; dy: number; w: number; h: number }

export interface PropDef {
  scale: number;
  blocks: Rect[];
  /** drawn flat on the ground under actors (no y-sort), e.g. magic arrays */
  flat?: boolean;
  /** floats above the ground with a bobbing shadow */
  float?: boolean;
}

const tree: Rect[] = [{ dx: -0.5, dy: -1, w: 1, h: 1 }];
const gate = (half: number): Rect[] => [{ dx: -half, dy: -1.2, w: 1, h: 1.2 }, { dx: half - 1, dy: -1.2, w: 1, h: 1.2 }];

export const PROPS: Record<PropKind, PropDef> = {
  pavilion: { scale: 0.3, blocks: [{ dx: -3, dy: -1.6, w: 6, h: 1.6 }] },
  stonebridge: { scale: 0.25, blocks: [], flat: false },
  bamboo: { scale: 0.21, blocks: tree },
  pine: { scale: 0.26, blocks: tree },
  stairs: { scale: 0.22, blocks: [] },
  paifang: { scale: 0.28, blocks: gate(3) },
  tower: { scale: 0.26, blocks: [{ dx: -1.8, dy: -1.6, w: 3.6, h: 1.6 }] },
  moonwall: { scale: 0.26, blocks: gate(3) },
  corridor: { scale: 0.28, blocks: gate(3.4) },
  taihurocks: { scale: 0.24, blocks: [{ dx: -2, dy: -1.2, w: 4, h: 1.2 }] },
  willow: { scale: 0.26, blocks: tree },
  lingzhi: { scale: 0.13, blocks: [] },
  orchid: { scale: 0.13, blocks: [] },
  rock: { scale: 0.18, blocks: [{ dx: -0.5, dy: -1, w: 1, h: 1 }] },
  bambooshoot: { scale: 0.13, blocks: [] },
  lotuspond: { scale: 0.26, blocks: [], flat: true },
  petals: { scale: 0.22, blocks: [], flat: true },
  goldpaifang: { scale: 0.3, blocks: gate(3.4) },
  palace: { scale: 0.34, blocks: [{ dx: -4.2, dy: -1.8, w: 8.4, h: 1.8 }] },
  jadebridge: { scale: 0.22, blocks: [] },
  dragonpillar: { scale: 0.22, blocks: tree },
  lotusthrone: { scale: 0.26, blocks: [{ dx: -2, dy: -1.2, w: 4, h: 1.2 }] },
  goldgate: { scale: 0.3, blocks: gate(3.6) },
  floatisle: { scale: 0.2, blocks: [{ dx: -2, dy: -1.5, w: 4, h: 1.5 }], float: true },
  lotusbowl: { scale: 0.18, blocks: [{ dx: -1.8, dy: -1.2, w: 3.6, h: 1.2 }] },
  array: { scale: 0.3, blocks: [], flat: true },
  standstone: { scale: 0.26, blocks: tree },
  stonecircle: { scale: 0.24, blocks: [{ dx: -1.2, dy: -1.2, w: 2.4, h: 1.2 }] },
  peachtree: { scale: 0.24, blocks: tree },
  pagoda7: { scale: 0.3, blocks: [{ dx: -2, dy: -1.5, w: 4, h: 1.5 }] },
};
