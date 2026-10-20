import { NPCS, QUESTS } from '../data/quests';
import type { Inventory } from './inventory';
import { acceptQuest, isComplete, progressOf, type QuestLog } from './quest';

export type DialogueAction = { type: 'accept' | 'turnin'; questId: string } | { type: 'trade' } | { type: 'close' };
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
export function getDialogue(npcId: string, log: QuestLog, inv: Inventory, bosses: readonly string[] = []): Dialogue {
  const npc = NPCS[npcId]!;
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
