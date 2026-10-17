import { QUESTS, type QuestDef } from '../data/quests';
import { countOf, type Inventory } from './inventory';

export type QuestStatus = 'inactive' | 'active' | 'turnedIn';
export interface QuestState { status: QuestStatus; kills: Record<string, number> }
export type QuestLog = Record<string, QuestState>;

export const newQuestLog = (): QuestLog =>
  Object.fromEntries(Object.keys(QUESTS).map((id) => [id, { status: 'inactive' as QuestStatus, kills: {} }]));

export function acceptQuest(log: QuestLog, id: string): boolean {
  const def = QUESTS[id], st = log[id];
  if (!def || !st || st.status !== 'inactive') return false;
  if (def.requires && log[def.requires]?.status !== 'turnedIn') return false;
  st.status = 'active';
  return true;
}

export function onKill(log: QuestLog, enemyType: string): void {
  for (const [id, st] of Object.entries(log)) {
    const def = QUESTS[id];
    if (st.status !== 'active' || !def) continue;
    for (const o of def.objectives) if (o.type === 'kill' && o.target === enemyType) st.kills[o.target] = Math.min(o.count, (st.kills[o.target] ?? 0) + 1);
  }
}

export interface ObjectiveProgress { label: string; have: number; need: number }

/** `bosses` = ids of bosses the player has already defeated: a boss kill counts even if the quest was accepted later (no softlock). */
export function progressOf(def: QuestDef, st: QuestState, inv: Inventory, bosses: readonly string[] = []): ObjectiveProgress[] {
  return def.objectives.map((o) => ({
    label: o.label,
    need: o.count,
    have: o.type === 'kill' ? Math.min(o.count, bosses.includes(o.target) ? o.count : st.kills[o.target] ?? 0) : Math.min(o.count, countOf(inv, o.item)),
  }));
}

export const isComplete = (def: QuestDef, st: QuestState, inv: Inventory, bosses: readonly string[] = []): boolean =>
  st.status === 'active' && progressOf(def, st, inv, bosses).every((p) => p.have >= p.need);
