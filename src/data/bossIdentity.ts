import type { BossDef } from './boss';

/**
 * Round 22 boss identity pass. Layered over the chapter-authored defs (see the loop in `boss.ts`): a different sprite base from the licensed
 * pack, a luminance palette ramp (not a tint), satellites / sigil / phase+death fx, and ONE mechanic per boss that changes how it is fought.
 * Art is still the pack's sprites (PLACEHOLDER until identity art is commissioned) - the silhouettes differ, the pixels are not new.
 */
type Override = Partial<Pick<BossDef, 'sprite' | 'scale' | 'tint' | 'aura' | 'look' | 'mech' | 'mechTip' | 'kit'>> & { moves?: Partial<BossDef['moves']> };

export const BOSS_IDENTITY: Record<string, Override> = {
  // ch2 finale: a sundered great sword wreathed in a ring, shards circling it; a spirit ward guards each phase
  sovereign: {
    sprite: 'mob.swordspirit', scale: 0.95, tint: undefined, aura: 0x8fb8ff,
    look: { silhouette: 'horizontal great sword in a ring', ramp: [0x0b1233, 0x6f9cff, 0xf4fbff], orbit: { fx: 'xf_flying_sword', count: 4, radius: 54, scale: 0.13, tint: 0xbfe4ff, speed: 1.1, lift: 26 },
      sigil: { fx: 'xf_star_array', color: 0x9fd0ff, size: 200 }, phaseFx: { fx: 'xf_mirror_shatter', tint: 0xbfe4ff, scale: 0.7 }, deathFx: { fx: 'xf_mirror_shatter', tint: 0xdff0ff, scale: 1.2 } },
    mech: { ward: { frac: 0.07, phases: [2, 3], ttl: 16, healFrac: 0.03 } },
    mechTip: 'A spirit ward shields this foe. Pour damage into it to shatter it (the boss staggers); if it holds, it fades and heals the boss.',
  },
  // ch3: burrowing serpent
  sandwyrm: {
    sprite: 'mob.snake', scale: 1.55, tint: undefined, aura: 0xe0a850,
    look: { silhouette: 'long low serpent', ramp: [0x2a1608, 0xc98a3a, 0xffefb0], sigil: { fx: 'xf_array_seal', color: 0xffc860, size: 210 }, phaseFx: { fx: 'xf_gale_vortex', tint: 0xffd890, scale: 0.6 }, deathFx: { fx: 'xf_gale_vortex', tint: 0xffe0a0, scale: 1.1 } },
    moves: { burrow: { windup: 1.9, lockBefore: 0.65, recover: 0.9, cooldown: 11, radius: 56, damageMult: 1.8, minRange: 30 } },
    kit: [['sweep', 'charge', 'burrow'], ['charge', 'burrow', 'rain', 'summon', 'slam'], ['burrow', 'rain', 'ring', 'charge', 'slam', 'sweep']],
    mechTip: 'It dives underground. The marked circle follows you until the last moment, then locks: keep moving, then dash out.',
  },
  // ch3: mirror illusions
  mirageempress: {
    sprite: 'mob.peachspirit', scale: 1.8, tint: undefined, aura: 0xff8ae0,
    look: { silhouette: 'tall robed spirit', ramp: [0x2b0a3d, 0xd35ad8, 0xffe7a8], orbit: { fx: 'xf_soul_wisp', count: 3, radius: 46, scale: 0.11, tint: 0xffd0f0, speed: 1.4, lift: 40 },
      sigil: { fx: 'xf_star_array', color: 0xff9de8, size: 190 }, phaseFx: { fx: 'xf_mirror_shatter', tint: 0xff9de8, scale: 0.7 }, deathFx: { fx: 'xf_mirror_shatter', tint: 0xffc8f0, scale: 1.2 } },
    mech: { illusions: { count: 3, every: 16, ttl: 10, phases: [2, 3], ring: 78, radius: 30, burstMult: 0.9 } },
    mechTip: 'Mirror images! One is real. Decoys have no shadow and shatter when struck (hurting you if you are close): strike the one that casts a shadow.',
  },
  // ch3 finale: lava pools
  furnacewarden: {
    sprite: 'mob.soldier', scale: 1.9, tint: undefined, aura: 0xff6a20,
    look: { silhouette: 'towering armoured halberdier', ramp: [0x1a0500, 0xe0521a, 0xffe27a], orbit: { fx: 'xf_soul_wisp', count: 4, radius: 50, scale: 0.1, tint: 0xff7a30, speed: 1.6, lift: 34 },
      sigil: { fx: 'xf_array_seal', color: 0xff6a20, size: 220 }, phaseFx: { fx: 'xf_phoenix', tint: 0xff8a40, scale: 0.7 }, deathFx: { fx: 'xf_phoenix', tint: 0xffb060, scale: 1.3 } },
    mech: { pools: { every: 10, count: 3, radius: 26, warn: 1.1, ttl: 8, dpsMult: 0.4, phases: [1, 2, 3] } },
    mechTip: 'Molten pools pool up around you: they flash red first, then burn for several seconds. Do not stand still.',
  },
  // ch4: rotating wind blades
  cranelord: {
    sprite: 'mob.thunderbird', scale: 2.0, tint: undefined, aura: 0x9ff0e0,
    look: { silhouette: 'great winged crane', ramp: [0x0e2a2a, 0x7fd8c8, 0xffffff], orbit: { fx: 'xf_amb_crane_flap_far', count: 3, radius: 62, scale: 1.2, tint: 0xe8fffa, speed: 0.9, lift: 48 },
      sigil: { fx: 'xf_gale_vortex', color: 0x9ff0e0, size: 210 }, phaseFx: { fx: 'xf_crane', tint: 0xe8fffa, scale: 0.6 }, deathFx: { fx: 'xf_crane', tint: 0xffffff, scale: 1.1 } },
    mech: { beams: { arms: 3, speed: 0.55, length: 170, width: 9, warn: 1.4, active: 6, every: 14, damageMult: 1.1, phases: [2, 3] } },
    mechTip: 'Wind blades sweep around the boss. Thin lines show where they will cut: keep moving with the rotation or dash through a gap.',
  },
  // ch4 finale: seal pylons
  magistrate: {
    sprite: 'mob.jiangshi', scale: 1.8, tint: undefined, aura: 0xffd060,
    look: { silhouette: 'hatted official, arms out', ramp: [0x1a1000, 0xb88a1c, 0xfff0b0], orbit: { fx: 'xf_talisman', count: 4, radius: 50, scale: 0.12, tint: 0xffe08a, speed: 0.8, lift: 40 },
      sigil: { fx: 'xf_array_seal', color: 0xffd060, size: 200 }, phaseFx: { fx: 'xf_bell_ward', tint: 0xffe08a, scale: 0.6 }, deathFx: { fx: 'xf_bell_ward', tint: 0xfff0b0, scale: 1.1 } },
    mech: { pylons: { count: 3, hpFrac: 0.012, reduction: 0.85, phases: [2, 3], ring: 100, defMult: 0.5 } },
    mechTip: 'Seal pylons shield the boss: while any stands it takes only a sliver of damage. Destroy the pylons first.',
  },
  // ch5: leech wisps
  'abyss-matron': {
    sprite: 'mob.ghost', scale: 2.2, tint: undefined, aura: 0xb040f0,
    look: { silhouette: 'drifting lantern wraith', ramp: [0x12001f, 0x9a2fd6, 0xffa0e8], orbit: { fx: 'xf_soul_wisp', count: 3, radius: 58, scale: 0.12, tint: 0xff5ad0, speed: 1.2, lift: 50 },
      sigil: { fx: 'xf_taiji', color: 0xb040f0, size: 220 }, phaseFx: { fx: 'xf_ink_splash', tint: 0xb040f0, scale: 0.7 }, deathFx: { fx: 'xf_ink_splash', tint: 0xff8af0, scale: 1.3 } },
    mech: { leech: { every: 15, count: 3, healFrac: 0.015, hpFrac: 0.0025, speed: 38, phases: [2, 3], max: 6 } },
    mechTip: 'Blood wisps drift toward the boss to heal it. Cut them down before they arrive.',
  },
  // ch5 finale: ward + blade wheel
  'abyss-daodemon': {
    sprite: 'boss.fallenimmortal', scale: 0.85, tint: undefined, aura: 0xff3050,
    look: { silhouette: 'cloaked swordsman wreathed in blades', ramp: [0x100008, 0xc01830, 0xff9a70], orbit: { fx: 'xf_flying_sword', count: 5, radius: 64, scale: 0.12, tint: 0xff3a50, speed: 1.3, lift: 44 },
      sigil: { fx: 'xf_star_array', color: 0xff3050, size: 240 }, phaseFx: { fx: 'xf_tribulation', tint: 0xff4060, scale: 0.7 }, deathFx: { fx: 'xf_tribulation', tint: 0xff8090, scale: 1.2 } },
    mech: { ward: { frac: 0.04, phases: [3], ttl: 18, healFrac: 0.02 }, beams: { arms: 4, speed: 0.5, length: 190, width: 8, warn: 1.5, active: 7, every: 13, damageMult: 0.8, phases: [3] } },
    mechTip: 'The Dao Demon wraps itself in a ward and a wheel of blades: break the ward, and slip between the spinning blades.',
  },
  // recolour-only slice (PLACEHOLDER silhouettes: still the recycled dragon / fox sprites)
  'abyss-tyrant': { tint: undefined, aura: 0xff5a4a, look: { silhouette: 'PLACEHOLDER recycled dragon, blood ramp', ramp: [0x1a0000, 0xc02a1a, 0xffb090] } },
  archivekeeper: { tint: undefined, aura: 0xffd890, look: { silhouette: 'PLACEHOLDER recycled fox, parchment ramp', ramp: [0x2a1a08, 0xd8b060, 0xfff4d0] } },
  mirrorqueen: { tint: undefined, aura: 0xc8e0ff, look: { silhouette: 'PLACEHOLDER recycled fox, moon-silver ramp', ramp: [0x10182a, 0x8fa8d8, 0xf4f8ff] } },
  's2-glacierwyrm': { tint: undefined, aura: 0xbfe4ff, look: { silhouette: 'PLACEHOLDER recycled dragon, glacier ramp', ramp: [0x081a2a, 0x4aa8d8, 0xf0fbff] } },
};
