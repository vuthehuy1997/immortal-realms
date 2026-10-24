import { NPCS, QUESTS } from '../data/quests';
import type { Inventory } from './inventory';
import { acceptQuest, isComplete, progressOf, type QuestLog } from './quest';

export type DialogueAction = { type: 'accept' | 'turnin'; questId: string } | { type: 'trade' } | { type: 'tower'; start: boolean } | { type: 'close' };
export interface Dialogue {
  speaker: string;
  portrait: string;
  text: string;
  progress?: { label: string; have: number; need: number }[];
  options: { label: string; action: DialogueAction }[];
  /** false for the idle chat (traders open their shop instead of talking) */
  quest: boolean;
}

/** Dialogue is a pure function of quest state, so it always reflects the current game state. */
export function getDialogue(npcId: string, log: QuestLog, inv: Inventory, bosses: readonly string[] = [], tower?: { best: number; active: boolean }): Dialogue {
  const npc = NPCS[npcId]!;
  if (npc.trade === 'tower') {
    const t = tower ?? { best: 0, active: false };
    return { speaker: npc.name, portrait: npc.portrait, quest: false, text: `${npc.idle} ${t.best > 0 ? `Your deepest floor: ${t.best}.` : 'You have not entered yet.'} Rules: clear each floor to descend; every 5th floor has a guardian; rewards and boon picks are paid only for floors deeper than your best; kills give reduced XP; falling, leaving or wandering off ends the run. Level 8 or higher is wise.`, options: [t.active ? { label: 'Leave the Rift.', action: { type: 'tower', start: false } } : { label: 'Enter the Trial Rift.', action: { type: 'tower', start: true } }, { label: 'Farewell.', action: { type: 'close' } }] };
  }
  const wares = npc.trade ? [{ label: 'Browse wares', action: { type: 'trade' } as DialogueAction }] : [];
  for (const qid of npc.quests) {
    const def = QUESTS[qid]!, st = log[qid]!;
    if (st.status === 'turnedIn') continue;
    if (def.requires && log[def.requires]?.status !== 'turnedIn') continue;
    if (st.status === 'inactive') return { speaker: npc.name, portrait: npc.portrait, text: def.intro, quest: true, options: [{ label: 'I will do it.', action: { type: 'accept', questId: qid } }, ...wares, { label: 'Not now.', action: { type: 'close' } }] };
    const progress = progressOf(def, st, inv, bosses);
    if (isComplete(def, st, inv, bosses)) return { speaker: npc.name, portrait: npc.portrait, text: def.completeText, progress, quest: true, options: [{ label: 'Claim reward', action: { type: 'turnin', questId: qid } }, ...wares] };
    return { speaker: npc.name, portrait: npc.portrait, text: def.reminder, progress, quest: true, options: [...wares, { label: 'I am on it.', action: { type: 'close' } }] };
  }
  return { speaker: npc.name, portrait: npc.portrait, text: npc.idle, quest: false, options: [{ label: 'Farewell.', action: { type: 'close' } }] };
}

export { acceptQuest };
