import { bossesOfChapter } from './boss';
import type { ZoneId } from './zones';
import type { Gear } from '../core/character';
import { CONTENT } from './content';

/** A chapter is one map with its own hub, zones, bosses, NPCs and quest chain. Gated by progress in the previous one. */
export interface ChapterDef {
  id: number;
  name: string;
  subtitle: string;
  /** zone the player arrives in */
  hub: ZoneId;
  /** story pages shown the first time the player arrives (also the prologue for chapter 1) */
  story: string[];
  /** what the gate leading onward from this chapter is called (default 'gate') */
  gateName?: string;
  /** gear ids used by the balance tests: what a hero typically carries on arrival (best of the previous chapter) and what this chapter's shop sells */
  gear: { arrive: Gear; shop: Gear };
  /** requirements to travel here; `bosses` defaults to every open-map boss of the previous chapter */
  gate?: { level: number; bosses?: string[]; hint: string };
}

export const CHAPTERS: Record<number, ChapterDef> = {
  1: {
    id: 1, name: 'The Broken Seals', subtitle: 'Chapter 1', hub: 'village', gateName: 'Sky Gate',
    gear: { arrive: {}, shop: { weapon: 'steel-blade', armor: 'sect-robe', charm: 'jade-pendant' } },
    story: [
      'Long ago the founder of the Azure Cloud Sect sealed the Heavenly Fissure, a wound in the sky that leaks ruin into the world.',
      'He bound three guardians to hold the seals: a sword immortal, a nine-tailed fox, a dragon of the mist pool.',
      'Centuries passed. The seals rotted. The guardians went feral, and the sect has called for every disciple who can hold a blade.',
      'You are the newest of them. Walk the realms, grow in the Way, and put the guardians to rest.',
    ],
  },
  2: {
    id: 2, name: 'The Sundered Sky', subtitle: 'Chapter 2', hub: 'outpost',
    gear: { arrive: { weapon: 'jade-sword', armor: 'immortal-mantle', charm: 'dragon-pearl' }, shop: { weapon: 'froststeel-blade', armor: 'frost-mail', charm: 'dragon-pearl' } },
    story: [
      'With the three guardians gone, the Heavenly Fissure tore open, and the cold of another world poured through.',
      'The Skyfall Outpost, last fort on the Fissure\'s rim, answers to Commander Shen. Beyond it lie the Whitefrost Pass, the Crystal Hollow and the Ashen Barrow.',
      'At the summit waits the Sundered Sovereign, the thing the guardians were bred to hold back.',
      'The seals can no longer be mended. They can only be ended.',
    ],
    gate: { level: 10, bosses: ['warden', 'ninetail', 'jiaolong'], hint: 'Defeat the three guardians (Fallen Sword Immortal, Nine-Tailed Fox, Jiao Dragon) and reach level 10.' },
  },
};

for (const c of CONTENT) if (c.chapter) CHAPTERS[c.chapter.id] = c.chapter;

export const CHAPTER_IDS = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
export const LAST_CHAPTER = CHAPTER_IDS[CHAPTER_IDS.length - 1]!;

export type GateCheck = { ok: true } | { ok: false; reason: string };

/** Pure gate test: can a character with this level and these defeated bosses travel to chapter `n`? */
export function canEnterChapter(n: number, level: number, defeated: readonly string[]): GateCheck {
  const c = CHAPTERS[n];
  if (!c) return { ok: false, reason: 'No such chapter.' };
  if (!c.gate) return { ok: true };
  const missing = (c.gate.bosses ?? chapterBosses(n - 1)).filter((b) => !defeated.includes(b));
  if (level < c.gate.level || missing.length) return { ok: false, reason: c.gate.hint };
  return { ok: true };
}

/** Bosses that must fall to complete a chapter. */
export const chapterBosses = (n: number): string[] => bossesOfChapter(n).map((b) => b.id);
