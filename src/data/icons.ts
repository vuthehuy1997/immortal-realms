/** Item icons come from the Xianxia Pixel Pack UI kit (`ui`) and weapon icon sheet (`icon`). */
export const ITEM_ICON: Record<string, { kind: 'ui' | 'icon'; key: string }> = {
  'hp-potion': { kind: 'ui', key: 'item_gourd' },
  'mana-potion': { kind: 'ui', key: 'item_conch' },
  'qi-pill': { kind: 'ui', key: 'item_pill_bottle' },
  'spirit-herb': { kind: 'ui', key: 'item_lingzhi' },
  'iron-sword': { kind: 'icon', key: 'blade_01_01' },
  'jade-sword': { kind: 'icon', key: 'blade_01_05' },
};
