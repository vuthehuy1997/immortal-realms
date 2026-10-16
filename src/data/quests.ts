export type Objective =
  | { type: 'kill'; target: string; count: number; label: string }
  | { type: 'collect'; item: string; count: number; label: string };

export interface QuestDef {
  id: string; name: string; giver: string;
  intro: string; reminder: string; completeText: string;
  objectives: Objective[];
  reward: { xp: number; items: { id: string; count: number }[] };
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
};

export const NPCS = { 'elder-lin': { name: 'Elder Lin', quests: ['pests', 'fox', 'warden'], idle: 'Peace to you, traveler. The grove is quiet now.' } } as const;
