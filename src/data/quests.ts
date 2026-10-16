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
    id: 'pests', name: 'Pests of the Grove', giver: 'elder-lin',
    intro: 'The slimes are choking the spirit grove. Slay four of them and bring me two Spirit Herbs they have fouled. I will make it worth your while.',
    reminder: 'The grove is still overrun. Four slimes, two Spirit Herbs.',
    completeText: 'You have done well. Take this — and my thanks.',
    objectives: [
      { type: 'kill', target: 'slime', count: 4, label: 'Slay Moss Slimes' },
      { type: 'collect', item: 'spirit-herb', count: 2, label: 'Gather Spirit Herbs' },
    ],
    reward: { xp: 80, items: [{ id: 'iron-sword', count: 1 }, { id: 'hp-potion', count: 3 }] },
  },
  warden: {
    id: 'warden', name: 'The Stone Warden', giver: 'elder-lin', requires: 'pests',
    intro: 'Something older stirs in the lair to the north-east: the Stone Warden. Defeat it and the grove may finally rest.',
    reminder: 'The Warden still lives. Seek the lair, north-east of here.',
    completeText: 'The Warden is no more. You have the makings of a true cultivator.',
    objectives: [{ type: 'kill', target: 'warden', count: 1, label: 'Defeat the Stone Warden' }],
    reward: { xp: 200, items: [{ id: 'qi-pill', count: 2 }] },
  },
};

export const NPCS = { 'elder-lin': { name: 'Elder Lin', quests: ['pests', 'warden'], idle: 'Peace to you, traveler. The grove is quiet now.' } } as const;
