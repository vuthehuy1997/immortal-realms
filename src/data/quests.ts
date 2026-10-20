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
};

export interface NpcDef { name: string; quests: readonly string[]; idle: string; trade?: 'shop' | 'alchemy' }
export const NPCS: Record<string, NpcDef> = {
  'elder-lin': { name: 'Elder Lin', quests: ['pests', 'fox', 'warden', 'champions'], idle: 'Peace to you, traveler. The grove is quiet now.' },
  'merchant-qiao': { name: 'Merchant Qiao', quests: ['toads'], idle: 'Welcome, welcome! Spirit stones speak louder than words.', trade: 'shop' },
  'alchemist-yun': { name: 'Alchemist Yun', quests: ['furnace'], idle: 'The furnace is warm. What shall we brew today?', trade: 'alchemy' },
};

