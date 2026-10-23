export type Objective =
  | { type: 'kill'; target: string; count: number; label: string }
  | { type: 'collect'; item: string; count: number; label: string }
  | { type: 'elite'; count: number; label: string }; // slay elite (affixed) monsters of any kind

export interface QuestDef {
  id: string; name: string; giver: string;
  intro: string; reminder: string; completeText: string;
  objectives: Objective[];
  reward: { xp: number; stones?: number; items: { id: string; count: number }[] };
  requires?: string; // quest that must be turned in first
  /** chapter the quest belongs to (default 1) */
  chapter?: number;
}

export const QUESTS: Record<string, QuestDef> = {
  pests: {
    id: 'pests', name: 'Wolves of the Bamboo', giver: 'elder-lin',
    intro: 'Spirit wolves prowl the Whispering Bamboo Forest to the west and trample the herb beds. Slay four of them and gather two Spirit Herbs (lingzhi, press E beside the glowing mushrooms). The sect will reward you.',
    reminder: 'The forest is still overrun. Four wolves, two Spirit Herbs.',
    completeText: 'You have done well. Take this — and my thanks.',
    objectives: [
      { type: 'kill', target: 'wolf', count: 4, label: 'Slay Spirit Wolves' },
      { type: 'collect', item: 'spirit-herb', count: 2, label: 'Gather Spirit Herbs' },
    ],
    reward: { xp: 80, items: [{ id: 'iron-sword', count: 1 }, { id: 'hp-potion', count: 3 }] },
  },
  fox: {
    id: 'fox', name: 'The Fox of the Peach Grove', giver: 'elder-lin', requires: 'pests',
    intro: 'Well done. Now a greater trouble: a nine-tailed fox spirit has made its den in the Peach Grove, north-west of here, and bewitches travellers. Slay it.',
    reminder: 'The fox spirit still haunts the grove. Follow the north road, then west into the peach trees.',
    completeText: 'The grove breathes again. This blade came from my own youth. Take it.',
    objectives: [{ type: 'kill', target: 'ninetail', count: 1, label: 'Slay the Nine-Tailed Fox Spirit' }],
    reward: { xp: 150, items: [{ id: 'steel-blade', count: 1 }, { id: 'qi-pill', count: 2 }, { id: 'hp-potion', count: 3 }] },
  },
  warden: {
    id: 'warden', name: 'The Fallen Sword Immortal', giver: 'elder-lin', requires: 'fox',
    intro: 'Beyond the Peach Grove, in the north-east court, a sword immortal who fell from grace stirs once more. Defeat the Fallen Sword Immortal and the sect may finally rest.',
    reminder: 'The Fallen Immortal still lives. Follow the north-east road to his court.',
    completeText: 'The Fallen Immortal is no more. You have the makings of a true cultivator.',
    objectives: [{ type: 'kill', target: 'warden', count: 1, label: 'Defeat the Fallen Sword Immortal' }],
    reward: { xp: 200, items: [{ id: 'qi-pill', count: 2 }] },
  },
  jiaolong: {
    id: 'jiaolong', name: 'The Dragon of the Mist Pool', giver: 'elder-lin', requires: 'champions',
    intro: 'One last trial, champion. Deep in Mistveil Marsh, east of the southern road, a jiao dragon has woken in its pool. Barges vanish and the mist grows thick. Slay the Jiao Dragon, and bring me its pearl.',
    reminder: 'Follow the southern road into the marsh, then east to the still pool where the mist is thickest.',
    completeText: 'The mist is thinning already. The pearl is yours by right; you have earned it.',
    objectives: [{ type: 'kill', target: 'jiaolong', count: 1, label: 'Slay the Jiao Dragon' }],
    reward: { xp: 320, stones: 120, items: [{ id: 'hp-potion', count: 3 }, { id: 'mana-potion', count: 3 }] },
  },
  toads: {
    id: 'toads', name: 'Toads in the Ledger', giver: 'merchant-qiao', requires: 'pests',
    intro: 'Marsh toads keep swallowing my supply barges in Mistveil Marsh, south of here. Thin out six of them and I will make it worth your while.',
    reminder: 'Six marsh toads, south in Mistveil Marsh. Mind the ghosts in the mist.',
    completeText: 'My barges float again! A fair price, as promised.',
    objectives: [{ type: 'kill', target: 'toad', count: 6, label: 'Slay Marsh Toads' }],
    reward: { xp: 110, stones: 60, items: [{ id: 'hp-potion', count: 2 }] },
  },
  furnace: {
    id: 'furnace', name: 'Herbs for the Furnace', giver: 'alchemist-yun', requires: 'pests',
    intro: 'My furnace is hungry and my herb baskets are empty. Bring me five Spirit Herbs (lingzhi, glowing mushrooms) and I will share what I brew.',
    reminder: 'Five Spirit Herbs, please. Look for the glowing mushrooms in the forests.',
    completeText: 'Splendid, fresh and potent. Take these pills with my thanks.',
    objectives: [{ type: 'collect', item: 'spirit-herb', count: 5, label: 'Gather Spirit Herbs' }],
    reward: { xp: 90, stones: 40, items: [{ id: 'qi-pill', count: 3 }, { id: 'hp-potion', count: 2 }] },
  },
  champions: {
    id: 'champions', name: 'Trial of Champions', giver: 'elder-lin', requires: 'warden',
    intro: 'Some beasts grow beyond their kind, wearing a golden aura and strange powers. Prove your mastery: slay two of these elite monsters.',
    reminder: 'Two elite monsters, marked by their golden names. They appear anywhere beyond the sect.',
    completeText: 'Your blade has earned its reputation. Wear this charm with pride.',
    objectives: [{ type: 'elite', count: 2, label: 'Slay Elite Monsters' }],
    reward: { xp: 240, stones: 100, items: [{ id: 'tiger-fang', count: 1 }] },
  },
  // ---- Chapter 2: The Sundered Sky ----
  'rift-scouts': {
    id: 'rift-scouts', chapter: 2, name: 'Scouts of the Rift', giver: 'commander-shen',
    intro: 'You came through the gate? Then you are the disciple who put down the three guardians. Good. The Fissure widened when they fell, and frost beasts pour down the Whitefrost Pass. Cull eight Frost Wolves and four Frost Wisps so my scouts can reach the Barrow.',
    reminder: 'Eight Frost Wolves and four Frost Wisps in Whitefrost Pass, north-east of the outpost.',
    completeText: 'The scouts are through. The quartermaster stocks blades forged for this cold; spend this well.',
    objectives: [
      { type: 'kill', target: 'frostwolf', count: 8, label: 'Cull Frost Wolves' },
      { type: 'kill', target: 'frostwisp', count: 4, label: 'Douse Frost Wisps' },
    ],
    reward: { xp: 420, stones: 300, items: [{ id: 'greater-hp-potion', count: 4 }, { id: 'qi-pill', count: 2 }] },
  },
  'shard-harvest': {
    id: 'shard-harvest', chapter: 2, name: 'Warmth for the Wounded', giver: 'herbalist-mo', requires: 'rift-scouts',
    intro: 'Our wounded are freezing, and my stores of lingzhi are gone. Bring me six Spirit Herbs; they cling on near the crystal veins and the graves, where the cold is thinnest.',
    reminder: 'Six Spirit Herbs: look for glowing mushrooms in the Hollow, the Pass and the Barrow.',
    completeText: 'Warm broth tonight, thanks to you. Take these, brewed fresh.',
    objectives: [{ type: 'collect', item: 'spirit-herb', count: 6, label: 'Gather Spirit Herbs' }],
    reward: { xp: 330, stones: 160, items: [{ id: 'greater-mana-potion', count: 3 }, { id: 'qi-pill', count: 3 }] },
  },
  'frost-elites': {
    id: 'frost-elites', chapter: 2, name: 'Frostbound Champions', giver: 'commander-shen', requires: 'rift-scouts',
    intro: 'The Rift twists the strongest beasts, gold-marked and cruel. Slay three of these elites and my soldiers will know the road is safe.',
    reminder: 'Three elite monsters (golden names) anywhere beyond the outpost.',
    completeText: 'Three less to fear. Take this purse; frontier steel is not cheap.',
    objectives: [{ type: 'elite', count: 3, label: 'Slay Elite Monsters' }],
    reward: { xp: 540, stones: 450, items: [{ id: 'greater-mana-potion', count: 4 }, { id: 'qi-pill', count: 2 }] },
  },
  'barrow-rites': {
    id: 'barrow-rites', chapter: 2, name: 'The Barrow Rites', giver: 'commander-shen', requires: 'rift-scouts',
    intro: 'West of here the Ashen Barrow stirs: the old Corpse King walks again, raising soldiers from the ash. Break the rites. Slay the Corpse King of the Ashen Barrow.',
    reminder: 'The Corpse King sits at the heart of the Ashen Barrow, north-west of the outpost.',
    completeText: 'The graves are quiet. This ward was his; the dead owe you nothing now.',
    objectives: [{ type: 'kill', target: 'corpseking', count: 1, label: 'Slay the Corpse King' }],
    reward: { xp: 900, stones: 400, items: [{ id: 'greater-hp-potion', count: 3 }, { id: 'qi-pill', count: 2 }] },
  },
  'hollow-heart': {
    id: 'hollow-heart', chapter: 2, name: 'The Heart of the Hollow', giver: 'hermit-wen', requires: 'barrow-rites',
    intro: 'Youngster. The Hollow sings because a heart of crystal beats under it: a colossus woven from the Fissure itself. While it lives, the way to the summit stays barred. Shatter the Crystal Colossus.',
    reminder: 'The Crystal Colossus stands in the Crystal Hollow, east of Whitefrost Pass.',
    completeText: 'Hear that? Silence. The path to the summit is open, and I have not been so afraid in forty years.',
    objectives: [{ type: 'kill', target: 'crystalcolossus', count: 1, label: 'Shatter the Crystal Colossus' }],
    reward: { xp: 1100, stones: 520, items: [{ id: 'greater-mana-potion', count: 3 }, { id: 'greater-hp-potion', count: 3 }] },
  },
  'sundered-sovereign': {
    id: 'sundered-sovereign', chapter: 2, name: 'The Sundered Sovereign', giver: 'commander-shen', requires: 'hollow-heart',
    intro: 'This is what the guardians were bred to hold back: the Sundered Sovereign, waiting at the summit. We cannot seal it again; we can only end it. Climb the north-east path and do what the founder could not.',
    reminder: 'Follow the north-east road to the Sundered Sky Summit.',
    completeText: 'The sky is whole. Chapter closed, disciple. Whatever lies beyond the Fissure, you have earned the right to look.',
    objectives: [{ type: 'kill', target: 'sovereign', count: 1, label: 'Slay the Sundered Sovereign' }],
    reward: { xp: 1800, stones: 900, items: [{ id: 'greater-hp-potion', count: 5 }, { id: 'greater-mana-potion', count: 5 }] },
  },
};

export interface NpcDef {
  name: string; portrait: string; quests: readonly string[]; idle: string;
  trade?: 'shop' | 'outpost' | 'alchemy';
  /** chapter whose hub they live in (default 1) */
  chapter?: number;
  /** actor sprite prefix and nameplate text */
  sprite: string; role: string;
  /** trade window blurb */
  blurb?: string;
}
export const NPCS: Record<string, NpcDef> = {
  'elder-lin': { sprite: 'hero.staffbeggar', role: 'Elder Lin · Quests', name: 'Elder Lin', portrait: 'elder_neutral', quests: ['pests', 'fox', 'warden', 'champions', 'jiaolong'], idle: 'Peace to you, traveler. The grove is quiet now.' },
  'merchant-qiao': { sprite: 'hero.spearman', role: 'Merchant Qiao · Shop', blurb: 'Spirit stones for steel and draughts, friend.', name: 'Merchant Qiao', portrait: 'peddler_neutral', quests: ['toads'], idle: 'Welcome, welcome! Spirit stones speak louder than words.', trade: 'shop' },
  'alchemist-yun': { sprite: 'hero.archer', role: 'Alchemist Yun · Alchemy', blurb: 'Bring me lingzhi and a few stones, and I will brew what you need.', name: 'Alchemist Yun', portrait: 'alchemist_neutral', quests: ['furnace'], idle: 'The furnace is warm. What shall we brew today?', trade: 'alchemy' },
  'commander-shen': { chapter: 2, sprite: 'hero.saber', role: 'Commander Shen · Quests', name: 'Commander Shen', portrait: 'constable_neutral', quests: ['rift-scouts', 'frost-elites', 'barrow-rites', 'sundered-sovereign'], idle: 'Hold the line, disciple. The Fissure does not rest.' },
  'quartermaster-gu': { chapter: 2, sprite: 'hero.twinblade', role: 'Quartermaster Gu · Shop', blurb: 'Outpost prices, frontier steel. Everything is heavier up here.', name: 'Quartermaster Gu', portrait: 'blacksmith_neutral', quests: [], idle: 'Frost mail, draughts, honest weight. What do you need?', trade: 'outpost' },
  'herbalist-mo': { chapter: 2, sprite: 'hero.fanscholar', role: 'Herbalist Mo · Alchemy', blurb: 'The furnace keeps the whole outpost alive. Bring herbs.', name: 'Herbalist Mo', portrait: 'herbalist_neutral', quests: ['shard-harvest'], idle: 'Warm hands, warm heart. The furnace is lit.', trade: 'alchemy' },
  'hermit-wen': { chapter: 2, sprite: 'hero.monk', role: 'Hermit Wen · Lore', name: 'Hermit Wen', portrait: 'hermit_neutral', quests: ['hollow-heart'], idle: 'The founder left a ledger of seals. Three guardians were never enough, you know.' },
};

export const questsOfChapter = (n: number): QuestDef[] => Object.values(QUESTS).filter((q) => (q.chapter ?? 1) === n);
export const npcsOfChapter = (n: number): string[] => Object.keys(NPCS).filter((id) => (NPCS[id]!.chapter ?? 1) === n);
