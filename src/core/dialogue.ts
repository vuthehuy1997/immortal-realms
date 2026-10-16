import { NPCS, QUESTS } from '../data/quests';
import type { Inventory } from './inventory';
import { acceptQuest, isComplete, progressOf, type QuestLog } from './quest';

export type DialogueAction = { type: 'accept' | 'turnin'; questId: string } | { type: 'close' };
export interface Dialogue {
  speaker: string;
  text: string;
  progress?: { label: string; have: number; need: number }[];
  options: { label: string; action: DialogueAction }[];
}

/** Dialogue is a pure function of quest state, so it always reflects the current game state. */
export function getDialogue(npcId: keyof typeof NPCS, log: QuestLog, inv: Inventory): Dialogue {
  const npc = NPCS[npcId];
  for (const qid of npc.quests) {
    const def = QUESTS[qid]!, st = log[qid]!;
    if (st.status === 'turnedIn') continue;
    if (def.requires && log[def.requires]?.status !== 'turnedIn') continue;
    if (st.status === 'inactive') return { speaker: npc.name, text: def.intro, options: [{ label: 'I will do it.', action: { type: 'accept', questId: qid } }, { label: 'Not now.', action: { type: 'close' } }] };
    const progress = progressOf(def, st, inv);
    if (isComplete(def, st, inv)) return { speaker: npc.name, text: def.completeText, progress, options: [{ label: 'Claim reward', action: { type: 'turnin', questId: qid } }] };
    return { speaker: npc.name, text: def.reminder, progress, options: [{ label: 'I am on it.', action: { type: 'close' } }] };
  }
  return { speaker: npc.name, text: npc.idle, options: [{ label: 'Farewell.', action: { type: 'close' } }] };
}

export { acceptQuest };
