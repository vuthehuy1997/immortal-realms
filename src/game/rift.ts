import { addItem } from '../core/inventory';
import { refillFlask } from '../core/sustain';
import { statsOf, type GameState } from '../core/gameState';
import { LEASH, newRun, updateTower, type FloorPlan, type FloorReward, type TowerRun } from '../core/tower';
import { isBlockedTile, TILE_SIZE, type WorldMap, type ZoneId } from '../core/world';
import type { Vec2 } from '../core/movement';
import { ITEMS } from '../data/items';
import { toast } from '../ui/hud';
import { audio } from './audio';

/** What the Trial Rift needs from the scene. Keeping it this small is the point: the rift logic no longer reaches into WorldScene internals. */
export interface RiftHost {
  gs(): GameState; world(): WorldMap; rng(): number; pos(): Vec2; dead(): boolean;
  /** spawns one hostile of the rift, scaled by the multipliers (the scene owns sprites, AI and rewards) */
  spawnFoe(type: string, at: Vec2, zone: ZoneId, elite: boolean, hpMult: number, atkMult: number): void;
  aliveFoes(): number; clearFoes(): void;
  mutate<T>(fn: () => T): T; save(): void; ring(x: number, y: number, radius: number, ms: number): void;
}

/** One Trial Rift run: floors of foes around the point where it began. The pure rules live in core/tower.ts. */
export class RiftController {
  private run: TowerRun | null = null;
  private origin: Vec2 = { x: 0, y: 0 };
  constructor(private readonly h: RiftHost) {}

  get active(): boolean { return this.run !== null; }
  get floor(): number { return this.run?.floor ?? 0; }
  get fighting(): boolean { return this.run?.phase === 'fight'; }
  /** test hook view */
  snapshot(): { floor: number; phase: string } | null { return this.run ? { floor: this.run.floor, phase: this.run.phase } : null; }

  start(): void {
    if (this.run || this.h.dead()) return;
    const p = this.h.pos();
    this.run = newRun(); this.origin = { ...p };
    toast('The Trial Rift opens. Clear each floor to descend; falling or wandering off ends the run.', 3600); audio.sfx('roar');
    this.h.ring(p.x, p.y, 90, 700);
  }

  end(why: 'left' | 'fallen' | 'strayed'): void {
    if (!this.run) return;
    const reached = this.run.floor - (this.run.phase === 'break' ? 1 : 0);
    this.h.clearFoes();
    this.run = null;
    const best = this.h.gs().towerBest;
    toast(why === 'fallen' ? `The Rift swallows you on floor ${reached + 1}. Best: ${best}.` : `You leave the Rift (floors cleared: ${reached}). Best: ${best}.`, 3600);
  }

  /** Objective-line text while a run is on. */
  hud(): string | null {
    if (!this.run) return null;
    const left = this.h.aliveFoes();
    return `Trial Rift · Floor ${this.run.floor} · ${this.run.phase === 'fight' ? `${left} foe${left === 1 ? '' : 's'} left` : 'get ready'} · best ${this.h.gs().towerBest}`;
  }

  update(dt: number): void {
    const run = this.run;
    if (!run) return;
    const p = this.h.pos();
    if (Math.hypot(p.x - this.origin.x, p.y - this.origin.y) > LEASH) { this.end('strayed'); return; }
    for (const ev of updateTower(run, this.h.gs().towerBest, this.h.aliveFoes(), dt, this.h.rng)) {
      if (ev.type === 'spawn') this.spawnFloor(ev.plan); else this.clear(ev.floor, ev.reward);
    }
  }

  private spawnFloor(plan: FloorPlan): void {
    const o = this.origin, world = this.h.world();
    for (const fe of plan.enemies) {
      let p: Vec2 | null = null;
      for (let i = 0; i < 24 && !p; i++) {
        const a = this.h.rng() * Math.PI * 2, d = 90 + this.h.rng() * 90, q = { x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d };
        if (!isBlockedTile(world, Math.floor(q.x / TILE_SIZE), Math.floor(q.y / TILE_SIZE))) p = q;
      }
      this.h.spawnFoe(fe.type, p ?? { x: o.x + 70, y: o.y }, plan.zone, fe.elite, plan.hpMult * (plan.guardian && fe === plan.enemies[0] ? 1.6 : 1), plan.atkMult);
    }
    toast(plan.guardian ? `Floor ${plan.floor}: a guardian awaits!` : `Floor ${plan.floor}`, 2200); audio.sfx(plan.guardian ? 'roar' : 'click');
  }

  private clear(floor: number, r: FloorReward): void {
    const gs = this.h.gs();
    this.h.mutate(() => {
      if (r.record) gs.towerBest = floor;
      gs.stones += r.stones; gs.boonPicks += r.boonPick ? 1 : 0;
      for (const it of r.items) addItem(gs.inventory, it.id, it.count);
      const s = statsOf(gs);
      gs.hp = Math.min(s.maxHp, gs.hp + Math.round(s.maxHp * 0.2)); gs.mana = s.maxMana;
      if (floor % 5 === 0) refillFlask(gs.flask);
    });
    const parts = [r.record ? `New depth! +${r.stones} ◆` : 'Floor cleared', ...r.items.map((i) => `${ITEMS[i.id]!.name} x${i.count}`), ...(r.boonPick ? ['a boon pick'] : [])];
    toast(`Floor ${floor} clear: ${parts.join(' · ')}`, 3200); audio.sfx(r.record ? 'levelup' : 'pickup');
    const p = this.h.pos(); this.h.ring(p.x, p.y, 60, 500);
    if (r.record) this.h.save();
  }
}
