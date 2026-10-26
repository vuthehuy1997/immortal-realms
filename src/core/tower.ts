import { ZONES, type ZoneId } from '../data/zones';

/** The Trial Rift: an endless run of fighting floors. Pure state machine: the scene spawns what a `spawn` event describes and reports how many foes are left. */
export interface FloorEnemy { type: string; elite: boolean }
export interface FloorPlan { floor: number; zone: ZoneId; enemies: FloorEnemy[]; hpMult: number; atkMult: number; guardian: boolean }
export interface FloorReward { stones: number; items: { id: string; count: number }[]; boonPick: boolean; record: boolean }
export type TowerEvent = { type: 'spawn'; plan: FloorPlan } | { type: 'clear'; floor: number; reward: FloorReward };
export interface TowerRun { floor: number; phase: 'break' | 'fight'; timer: number; foes: number }

export const GUARDIAN_EVERY = 5;
export const BREAK_SECONDS = 3;
export const START_SECONDS = 1.5;
/** How far from the start the hero may stray before the run is abandoned. */
export const LEASH = 420;
/** Kills inside the rift pay this share of normal XP (stones are unchanged), so the tower is not the best levelling spot. */
export const TOWER_XP = 0.35;

/** Floors are grouped into bands; each band borrows the enemy roster and difficulty tier of a zone. */
export const BANDS: { from: number; zone: ZoneId }[] = [
  { from: 1, zone: 'bamboo' }, { from: 4, zone: 'marsh' }, { from: 7, zone: 'grove' }, { from: 10, zone: 'ruins' },
  { from: 13, zone: 'frostpass' }, { from: 17, zone: 'crystal' }, { from: 21, zone: 'barrow' }, { from: 26, zone: 'summit' },
];
export const zoneOfFloor = (floor: number): ZoneId => [...BANDS].reverse().find((b) => floor >= b.from)!.zone;
/** Extra scaling on top of the zone tier so deep floors keep climbing. */
export const floorHp = (floor: number): number => 1 + 0.06 * (floor - 1);
export const floorAtk = (floor: number): number => 1 + 0.04 * (floor - 1);
export const isGuardian = (floor: number): boolean => floor % GUARDIAN_EVERY === 0;

/** Summit has no wild roster of its own: it draws on the barrow and crystal mobs. */
function rosterOf(zone: ZoneId): string[] {
  const own = Object.keys(ZONES[zone]!.spawns);
  return own.length ? own : [...Object.keys(ZONES.barrow!.spawns), ...Object.keys(ZONES.crystal!.spawns)];
}

export function planFloor(floor: number, rng: () => number): FloorPlan {
  const zone = zoneOfFloor(floor), roster = rosterOf(zone), guardian = isGuardian(floor);
  const count = Math.min(10, 3 + Math.floor(floor / 3));
  const eliteP = Math.min(0.4, 0.04 * floor);
  const enemies: FloorEnemy[] = [];
  if (guardian) enemies.push({ type: roster[roster.length - 1]!, elite: true });
  while (enemies.length < count) enemies.push({ type: roster[Math.floor(rng() * roster.length)]!, elite: rng() < eliteP });
  return { floor, zone, enemies, hpMult: floorHp(floor) * (guardian ? 1.4 : 1), atkMult: floorAtk(floor), guardian };
}

/** Rewards only pay for NEW depth (floors beyond the personal best), so replaying low floors cannot be farmed for them. */
export function floorReward(floor: number, best: number): FloorReward {
  const record = floor > best;
  if (!record) return { stones: 0, items: [], boonPick: false, record };
  const items: { id: string; count: number }[] = [];
  if (floor % 5 === 0) items.push({ id: 'qi-pill', count: 1 + Math.floor(floor / 10) });
  if (floor % 10 === 0) items.push({ id: 'foundation-pill', count: 1 });
  return { stones: 20 + 8 * floor + (isGuardian(floor) ? 60 : 0), items, boonPick: floor % 10 === 0, record };
}

export const newRun = (): TowerRun => ({ floor: 1, phase: 'break', timer: START_SECONDS, foes: 0 });

/** Advances the run. `alive` is how many foes of the current floor are still standing. */
export function updateTower(run: TowerRun, best: number, alive: number, dt: number, rng: () => number): TowerEvent[] {
  const ev: TowerEvent[] = [];
  if (run.phase === 'break') {
    run.timer -= dt;
    if (run.timer <= 0) { const plan = planFloor(run.floor, rng); run.phase = 'fight'; run.foes = plan.enemies.length; ev.push({ type: 'spawn', plan }); }
    return ev;
  }
  if (alive <= 0) {
    ev.push({ type: 'clear', floor: run.floor, reward: floorReward(run.floor, best) });
    run.floor++; run.phase = 'break'; run.timer = BREAK_SECONDS;
  }
  return ev;
}

export const validTowerBest = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 999;
