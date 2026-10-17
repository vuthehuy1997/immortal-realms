import Phaser from 'phaser';
import { newBossAI, updateBoss, type BossAI } from '../core/boss';
import { applyDamage, computeDamage, Cooldowns, regenMana, tryCast, type Combatant } from '../core/combat';
import { COMBO, COMBO_WINDOW, commit, DASH, isDashing, isInvulnerable, newCombo, newDash, nextStep, tryDash, type ComboState, type DashState } from '../core/combo';
import { scaledEnemy } from '../core/balance';
import { attemptBreakthrough, BACKLASH, canBreakthrough, meditate, nextRealmLevel } from '../core/cultivation';
import { getDialogue } from '../core/dialogue';
import { newEnemyAI, updateEnemyAI, type EnemyAI } from '../core/enemyAI';
import { gatherHerb, grantXp, isBossDefeated, registerKill, statsOf, turnInQuest, unequipWeapon, useItemSlot, type GameState } from '../core/gameState';
import { inArc, inCircle, normalize } from '../core/hit';
import { addItem, equipFromSlot } from '../core/inventory';
import { impulse, stepKnockback } from '../core/knockback';
import { step, type Vec2 } from '../core/movement';
import { acceptQuest } from '../core/quest';
import { createRng } from '../core/rng';
import { generateWorld, isBlockedTile, moveWithCollision, TILE_SIZE, zoneAt, type WorldMap, type ZoneId } from '../core/world';
import { BOSSES, type BossDef } from '../data/boss';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { REALMS } from '../data/realms';
import { SKILLS, type SkillDef } from '../data/skills';
import { ZONES } from '../data/zones';
import { buildPanels, closePanels, isDialogueOpen, isPanelOpen, refreshPanels, showDialogue, togglePanel } from '../ui/panels';
import { hideScreen, showPause } from '../ui/menu';
import { setBossBar, setPrompt, showZoneBanner, toast, updateHud } from '../ui/hud';
import { initMinimap, removeMinimap, updateMinimap } from '../ui/minimap';
import { closeTrade, isTradeOpen, renderTrade, showTrade } from '../ui/trade';
import { craft } from '../core/alchemy';
import { buy, sell, sellValue } from '../core/shop';
import { Ambient } from './ambient';
import { audio, type Mood } from './audio';
import { Actor } from './actor';
import { COLORS, Fx, ROOT_COLOR } from './fx';
import { KeyInput } from './input';
import { saveGame } from './storage';
import { renderWorld, updateOccluders, type HerbNode, type Occluder } from './worldRender';

const PLAYER_SPEED = 78;
const PLAYER_RADIUS = 5;
const TALK_RANGE = 36;
const GATHER_RANGE = 26;
const WORLD_SEED = 20261016;
const AUTOSAVE_SECONDS = 30;
const RESPAWN_CHECK_SECONDS = 4;
const ARRAY_RADIUS = 48;
const HERB_RESPAWN_SECONDS = 90;

export interface GameHost { quitToMenu(): void }

interface Enemy {
  id: number; def: EnemyDef; c: Combatant; ai: EnemyAI; pos: Vec2; actor: Actor; kb: Vec2; stun: number;
  lockUntil: number; minion: boolean; elite: boolean; zone: ZoneId; vel: Vec2; home: Vec2;
}
interface BossEnt {
  slams: number; def: BossDef; c: Combatant; ai: BossAI; pos: Vec2; actor: Actor; engaged: boolean; tele: Phaser.GameObjects.Graphics | null; lockUntil: number; kb: Vec2;
}
interface Bolt {
  kind: 'sword' | 'wave' | 'hostile'; pos: Vec2; vel: Vec2; traveled: number; max: number; damage: number; pierce: number; hit: Set<unknown>;
  radius: number; sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; trail: number; color: number;
}
interface RainZone { pos: Vec2; left: number; every: number; timer: number; mult: number; radius: number; tele: Phaser.GameObjects.Image }
interface Npc { id: string; pos: Vec2; actor: Actor; mark: Phaser.GameObjects.Text }
interface Target { pos: Vec2; radius: number; key: unknown; hit(mult: number, o?: HitOpts): void }
interface HitOpts { kb?: number; stun?: number; from?: Vec2; crit?: boolean }

/** Open xianxia overworld with real-time martial-arts combat. Art: CC0 Xianxia Pixel Pack (see docs/ASSET_LICENSE_AUDIT.md). */
export class WorldScene extends Phaser.Scene {
  private gs!: GameState;
  private host!: GameHost;
  private world!: WorldMap;
  private fx!: Fx;
  private ambient!: Ambient;
  private rng = createRng(WORLD_SEED + 1);
  private rngOverride: number | null = null;
  private pos: Vec2 = { x: 0, y: 0 };
  private player!: Actor;
  private camTarget!: Phaser.GameObjects.Zone;
  private pc!: Combatant;
  private cds = new Cooldowns();
  private combo: ComboState = newCombo();
  private dashState: DashState = newDash();
  private dashDir: Vec2 = { x: 1, y: 0 };
  private now = 0;
  private timers: { at: number; fn: () => void }[] = [];
  private enemies: Enemy[] = [];
  private bolts: Bolt[] = [];
  private rains: RainZone[] = [];
  private bosses: BossEnt[] = [];
  /** the main boss (Fallen Sword Immortal), or the first one present — used by the minimal test hooks */
  private get boss(): BossEnt | null { return this.bosses.find((b) => b.def.id === 'warden') ?? this.bosses[0] ?? null; }
  private herbs: HerbNode[] = [];
  private occluders: Occluder[] = [];
  private npcs: Npc[] = [];
  private nextId = 1;
  private hpBars!: Phaser.GameObjects.Graphics;
  private kb!: KeyInput;
  private meditating = false;
  private auraSprite: Phaser.GameObjects.Sprite | null = null;
  private uiPause = false;
  private hasPointer = false;
  private facing: Vec2 = { x: 1, y: 0 };
  private aimWorld: Vec2 = { x: 0, y: 0 };
  private respawnTimer = 0;
  private autosaveTimer = 0;
  private playerLockUntil = 0;
  private playerLockAnim = '';
  private hurtInvulnUntil = 0;
  private playerKb: Vec2 = { x: 0, y: 0 };
  private afterimageTimer = 0;
  private hitStopUntil = 0;
  private currentZone: ZoneId = 'village';
  private dead = false;
  private lastZoneBanner: ZoneId | null = null;

  constructor() { super('World'); }

  init(data: { state: GameState; host: GameHost }): void { this.gs = data.state; this.host = data.host; }

  create(): void {
    this.enemies = []; this.bolts = []; this.rains = []; this.bosses = []; this.npcs = []; this.timers = [];
    this.now = 0; this.cds = new Cooldowns(); this.combo = newCombo(); this.dashState = newDash();
    this.meditating = false; this.uiPause = false; this.respawnTimer = 0; this.autosaveTimer = 0; this.dead = false;
    this.playerLockUntil = 0; this.hurtInvulnUntil = 0; this.playerKb = { x: 0, y: 0 }; this.hitStopUntil = 0; this.lastZoneBanner = null;
    this.anims.globalTimeScale = 1;
    this.rng = createRng(WORLD_SEED + 1);
    this.world = generateWorld(WORLD_SEED);
    const worldW = this.world.width * TILE_SIZE, worldH = this.world.height * TILE_SIZE;

    const rendered = renderWorld(this, this.world, WORLD_SEED);
    this.herbs = rendered.herbs; this.occluders = rendered.occluders;
    initMinimap(this.world);
    this.fx = new Fx(this);
    this.ambient = new Ambient(this, worldW, worldH);

    this.pos = this.gs.hp > 0 ? { ...this.gs.pos } : { ...this.world.spawn };
    this.pc = { hp: 0, maxHp: 1, mana: 0, maxMana: 1, atk: 0, def: 0, critChance: 0, critMult: 1, manaRegen: 0 };
    this.pullFromState();
    const hero = HEROES[this.gs.character.hero];
    this.player = new Actor(this, hero.sprite, this.pos.x, this.pos.y, hero.scale, 22);
    this.camTarget = this.add.zone(this.pos.x, this.pos.y - 10, 1, 1);

    const npcSprite: Record<string, string> = { 'elder-lin': 'hero.staffbeggar', 'merchant-qiao': 'hero.spearman', 'alchemist-yun': 'hero.archer' };
    for (const [id, p] of Object.entries(this.world.npcs)) {
      const actor = new Actor(this, npcSprite[id] ?? 'hero.staffbeggar', p.x, p.y, 0.34, 22);
      actor.setPos(p.x, p.y);
      const mark = this.add.text(p.x, p.y - 38, '!', { color: '#ffd23f', fontSize: '14px', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(1e5);
      this.npcs.push({ id, pos: p, actor, mark });
    }

    for (const z of Object.values(ZONES)) for (const [type, n] of Object.entries(z.spawns)) for (let i = 0; i < n; i++) this.spawnInZone(z.id, type);
    for (const def of Object.values(BOSSES)) if (!isBossDefeated(this.gs, def.id)) this.spawnBoss(def);
    this.hpBars = this.add.graphics().setDepth(1e5);

    const kb = this.kb = new KeyInput();
    kb.onPress(['Digit1', 'Numpad1'], () => this.digit(0)); kb.onPress(['Digit2', 'Numpad2'], () => this.digit(1));
    kb.onPress(['Digit3', 'Numpad3'], () => this.digit(2)); kb.onPress(['Digit4', 'Numpad4'], () => this.digit(3));
    kb.onPress(['Space', 'KeyJ'], () => this.attack());
    kb.onPress(['ShiftLeft', 'ShiftRight'], () => this.dash());
    kb.onPress('KeyF', () => this.quickUse('hp-potion')); kb.onPress('KeyG', () => this.quickUse('mana-potion'));
    kb.onPress('KeyE', () => this.interact());
    kb.onPress('KeyM', () => this.toggleMeditate()); kb.onPress('KeyB', () => this.breakthrough());
    kb.onPress('KeyI', () => { if (!this.uiPause) togglePanel('inv'); }); kb.onPress('KeyC', () => { if (!this.uiPause) togglePanel('chr'); });
    kb.onPress('KeyN', () => { audio.setMuted(!audio.muted); toast(audio.muted ? 'Sound off' : 'Sound on', 1000); document.getElementById('btn-audio')?.classList.toggle('off', audio.muted); });
    kb.onPress('Escape', () => this.escape());
    kb.onPress('KeyR', () => { if (this.dead) this.respawn(); });
    this.input.on('pointerdown', () => { if (!this.uiPause) this.attack(); });
    this.input.on('pointermove', () => { this.hasPointer = true; });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.camTarget, true, 0.12, 0.12);
    this.applyZoom();
    this.scale.on('resize', () => this.applyZoom());
    if (!location.search.includes('novig')) { try { cam.filters.external.addVignette(0.5, 0.5, 1.0, 0.32); } catch { /* filters unavailable (Canvas fallback) */ } }
    this.hpBars.setDepth(1e5);
    this.events.once('shutdown', () => {
      this.kb.dispose(); closeTrade(); removeMinimap(); audio.stopMusic(); this.scale.off('resize'); closePanels(); showDialogue(null, () => undefined); setBossBar(null); setPrompt(null);
      this.anims.globalTimeScale = 1;
    });

    buildPanels({
      clickSlot: (i) => this.useSlot(i),
      unequip: () => { this.mutate(() => unequipWeapon(this.gs)); },
      toggleMeditate: () => this.toggleMeditate(),
      breakthrough: () => this.breakthrough(),
    });
    this.installTestHooks();
    this.warmUp();
    audio.startMusic();
  }

  /** Draws every effect type once, invisibly, so shaders compile now instead of during the first fight (avoids a hitch). */
  private warmUp(): void {
    const { x, y } = this.pos;
    const tmp: Phaser.GameObjects.Sprite[] = [];
    const sp = this.fx.play('xf_sword_qi', x, y, { scale: 0.05, tint: 0xffffff, alpha: 0.01 }); if (sp) tmp.push(sp);
    this.fx.play('xf_lotus', x, y, { scale: 0.05, tint: COLORS.gold, alpha: 0.01 });
    this.fx.burst(x, y, this.heroColor, 1);
    this.fx.burst(x, y, COLORS.gold, 1); this.fx.burst(x, y, COLORS.hurt, 1); this.fx.burst(x, y, COLORS.wisp, 1);
    this.fx.flare(x, y, this.heroColor, 4, 80); this.fx.ring(x, y, 4, this.heroColor, 80);
    this.player.flash(30); this.player.setPos(x, y);
    this.floatText({ x, y }, ' ', '#ffffff', true);
    const g = this.add.graphics().setAlpha(0.01); g.fillStyle(0xff0000, 1).fillCircle(x, y, 2).lineStyle(1, 0xff0000, 1).strokeCircle(x, y, 3); this.time.delayedCall(120, () => g.destroy());
    for (const t of tmp) t.setVisible(false);
  }

  private applyZoom(): void {
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.scale.height / 205, 2, 6));
  }

  // ---------- state sync (gs <-> live combatant) ----------
  private pushToState(): void { this.gs.hp = this.pc.hp; this.gs.mana = this.pc.mana; this.gs.pos = { ...this.pos }; }
  private pullFromState(): void {
    const s = statsOf(this.gs);
    Object.assign(this.pc, s, { hp: this.gs.hp, mana: this.gs.mana });
  }
  /** Run a gs-mutating operation with the live vitals flushed before and reloaded after. */
  private mutate<T>(fn: () => T): T { this.pushToState(); const r = fn(); this.pullFromState(); return r; }
  private roll = (): number => this.rngOverride ?? this.rng();
  private save(announce: boolean): boolean {
    this.pushToState();
    const ok = saveGame(this.gs);
    if (announce) toast(ok ? 'Game saved.' : 'Could not save (storage unavailable).');
    return ok;
  }
  private schedule(delaySec: number, fn: () => void): void { this.timers.push({ at: this.now + delaySec, fn }); }
  private get heroColor(): number { return ROOT_COLOR[this.gs.character.root]; }

  // ---------- spawning ----------
  private spotInZone(z: ZoneId, farFrom?: Vec2, minDist = 0): Vec2 | null {
    const w = this.world;
    for (let tries = 0; tries < 400; tries++) {
      const tx = 4 + Math.floor(this.rng() * (w.width - 8)), ty = 4 + Math.floor(this.rng() * (w.height - 8));
      if (w.zone[ty * w.width + tx] !== z || isBlockedTile(w, tx, ty)) continue;
      const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
      if (Math.hypot(p.x - w.spawn.x, p.y - w.spawn.y) < 130) continue; // keep the village approach safe
      if (Math.hypot(p.x - w.den.x, p.y - w.den.y) < 130 || Math.hypot(p.x - w.lair.x, p.y - w.lair.y) < 170) continue; // boss courts stay clear of wanderers
      if (farFrom && Math.hypot(p.x - farFrom.x, p.y - farFrom.y) < minDist) continue;
      if (isBlockedTile(w, tx + 1, ty) || isBlockedTile(w, tx - 1, ty) || isBlockedTile(w, tx, ty + 1) || isBlockedTile(w, tx, ty - 1)) continue;
      return p;
    }
    return null;
  }
  private spawnInZone(z: ZoneId, type: string, farFrom?: Vec2): void {
    const p = this.spotInZone(z, farFrom, 160);
    if (p) this.spawnEnemy(type, p, false, z);
  }

  private spawnEnemy(type: string, pos: Vec2, minion = false, zone: ZoneId = 'bamboo'): Enemy | null {
    const def = ENEMIES[type];
    if (!def) return null;
    const elite = !minion && !!def.eliteSprites && this.rng() < 0.1;
    const sc = scaledEnemy(def, zone, elite);
    const c: Combatant = { hp: sc.maxHp, maxHp: sc.maxHp, mana: 0, maxMana: 0, atk: sc.atk, def: sc.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const prefix = elite ? def.eliteSprites![Math.floor(this.rng() * def.eliteSprites!.length)]! : def.sprite;
    const actor = new Actor(this, prefix, pos.x, pos.y, def.scale * (elite ? 1.18 : 1), def.radius * 3);
    actor.setPos(pos.x, pos.y);
    const e: Enemy = { id: this.nextId++, def, c, ai: newEnemyAI(), pos: { ...pos }, actor, kb: { x: 0, y: 0 }, stun: 0, lockUntil: 0, minion, elite, zone, vel: { x: 0, y: 0 }, home: { ...pos } };
    this.enemies.push(e);
    return e;
  }

  private spawnBoss(def: BossDef): void {
    const c: Combatant = { hp: def.maxHp, maxHp: def.maxHp, mana: 0, maxMana: 0, atk: def.atk, def: def.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const pos = { ...(def.home === 'lair' ? this.world.lair : this.world.den) };
    const actor = new Actor(this, def.sprite, pos.x, pos.y, def.scale, 56);
    actor.setPos(pos.x, pos.y);
    this.bosses.push({ slams: 0, def, c, ai: newBossAI(), pos, actor, engaged: false, tele: null, lockUntil: 0, kb: { x: 0, y: 0 } });
  }

  // ---------- input actions ----------
  private digit(i: number): void {
    if (isDialogueOpen()) { document.querySelector<HTMLButtonElement>(`#dlg button[data-opt="${i}"]`)?.click(); return; }
    this.castSkill(i);
  }

  private escape(): void {
    if (isTradeOpen()) { closeTrade(); this.uiPause = false; return; }
    if (isDialogueOpen()) { showDialogue(null, () => undefined); this.uiPause = false; return; }
    if (isPanelOpen('inv') || isPanelOpen('chr')) { closePanels(); return; }
    if (this.uiPause) { this.resume(); return; }
    this.uiPause = true;
    showPause({ onResume: () => this.resume(), onSave: () => { this.save(true); }, onQuit: () => { this.save(false); hideScreen(); this.host.quitToMenu(); } });
  }
  private resume(): void { hideScreen(); this.uiPause = false; }

  private toggleMeditate(): void {
    if (this.uiPause || this.dead) return;
    this.meditating = !this.meditating;
    toast(this.meditating ? 'You settle into meditation…' : 'You stop meditating.', 1400);
  }

  private breakthrough(): void {
    if (this.uiPause || this.dead) return;
    const lvl = this.gs.progress.level;
    if (this.gs.cultivation.qi >= REALMS[this.gs.cultivation.realm]!.qiMax && lvl < nextRealmLevel(this.gs.cultivation) && nextRealmLevel(this.gs.cultivation) < Infinity) { toast(`Your foundation is too shallow: reach level ${nextRealmLevel(this.gs.cultivation)} first.`, 2600); return; }
    if (!canBreakthrough(this.gs.cultivation, lvl)) { toast('Your qi is not full enough to break through.', 1800); return; }
    const res = this.mutate(() => attemptBreakthrough(this.gs.cultivation, this.roll, 0, lvl));
    if (!res.ok) return;
    this.meditating = false;
    if (res.success) {
      this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; });
      toast(`Breakthrough! You reach ${REALMS[this.gs.cultivation.realm]!.name}.`, 3600); audio.sfx('breakthrough');
      this.fx.play('xf_ascend', this.pos.x, this.pos.y, { scale: 0.55, tint: COLORS.gold });
      this.fx.play('xf_taiji', this.pos.x, this.pos.y - 14, { scale: 0.4, tint: COLORS.gold });
      this.fx.ring(this.pos.x, this.pos.y, 70, COLORS.gold, 600);
      this.fx.shake(250, 0.004);
      this.save(false);
    } else {
      const back = Math.min(this.pc.hp - 1, Math.floor(this.pc.maxHp * BACKLASH));
      this.pc.hp -= Math.max(0, back); this.floatText(this.pos, String(Math.max(0, back)), '#ff6b6b', true, 11);
      toast('The breakthrough fails — qi backlash! Half of your qi is lost and you are wounded.', 3600); audio.sfx('fail');
      this.fx.play('xf_mirror_shatter', this.pos.x, this.pos.y - 14, { scale: 0.3, tint: COLORS.hurt });
    }
  }

  private quickUse(itemId: string): void {
    if (this.uiPause || this.dead) return;
    const i = this.gs.inventory.slots.findIndex((s) => s?.id === itemId);
    if (i >= 0) this.useSlot(i); else toast(`No ${ITEMS[itemId]!.name}.`, 1200);
  }

  /** Inventory slot click (also used by F/G): consumables are used, weapons are equipped. */
  useSlot(i: number): void {
    const stack = this.gs.inventory.slots[i];
    const def = stack ? ITEMS[stack.id] : undefined;
    if (!stack || !def || this.dead) return;
    if (def.type === 'equipment') { this.mutate(() => equipFromSlot(this.gs.inventory, i)); toast(`Equipped ${def.name}.`, 1400); return; }
    if (def.type !== 'consumable') { toast(`${def.name} cannot be used.`, 1200); return; }
    const st = statsOf(this.gs);
    if (def.heal && !def.mana && !def.qi && this.pc.hp >= st.maxHp) { toast('HP is already full.', 1200); return; }
    if (def.mana && !def.heal && !def.qi && this.pc.mana >= st.maxMana) { toast('Mana is already full.', 1200); return; }
    this.mutate(() => useItemSlot(this.gs, i));
    toast(`Used ${def.name}.`, 1200); audio.sfx('potion');
    this.fx.play('xf_pill_light', this.pos.x, this.pos.y - 14, { scale: 0.22, tint: def.heal ? COLORS.heal : def.mana ? COLORS.mana : COLORS.gold });
  }

  private nearestNpc(): Npc | null {
    let best: Npc | null = null, bd = TALK_RANGE;
    for (const n of this.npcs) { const d = Math.hypot(this.pos.x - n.pos.x, this.pos.y - n.pos.y); if (d <= bd) { bd = d; best = n; } }
    return best;
  }
  private nearestHerb(): HerbNode | null {
    let best: HerbNode | null = null, bd = GATHER_RANGE;
    for (const h of this.herbs) { if (!h.alive) continue; const d = Math.hypot(this.pos.x - h.x, this.pos.y - h.y); if (d <= bd) { bd = d; best = h; } }
    return best;
  }

  private interact(): void {
    if (this.uiPause || this.dead) return;
    const npc = this.nearestNpc();
    if (npc) { this.meditating = false; this.openDialogue(npc.id); return; }
    const herb = this.nearestHerb();
    if (herb) this.gather(herb);
  }

  private gather(h: HerbNode): void {
    const ok = this.mutate(() => gatherHerb(this.gs));
    if (!ok) { toast('Your inventory is full.', 1600); return; }
    h.alive = false; h.respawnAt = this.now + HERB_RESPAWN_SECONDS; h.img.setVisible(false); h.glow.setVisible(false);
    toast('Gathered Spirit Herb.', 1500); audio.sfx('gather');
    this.fx.play('xf_soul_wisp', h.x, h.y - 8, { scale: 0.18, tint: COLORS.gold });
    this.fx.burst(h.x, h.y - 6, COLORS.gold, 10);
  }

  private openDialogue(npcId: string): void {
    if (npcId === 'merchant-qiao' || npcId === 'alchemist-yun') { this.openTrade(npcId === 'merchant-qiao' ? 'shop' : 'alchemy'); return; }
    this.uiPause = true;
    showDialogue(getDialogue('elder-lin', this.gs.quests, this.gs.inventory), (a) => {
      if (a.type === 'close') { showDialogue(null, () => undefined); this.uiPause = false; return; }
      if (a.type === 'accept') {
        if (acceptQuest(this.gs.quests, a.questId)) toast(`Quest accepted: ${QUESTS[a.questId]!.name}`, 2600);
        showDialogue(null, () => undefined); this.uiPause = false; return;
      }
      const r = this.mutate(() => turnInQuest(this.gs, a.questId));
      if (r.ok) {
        toast(`Quest complete: ${QUESTS[a.questId]!.name} (+${QUESTS[a.questId]!.reward.xp} XP)`, 3200);
        if (r.levelsGained > 0) this.levelUpFx();
        this.save(false);
        this.openDialogue(npcId); // chain: next quest offer or farewell
      } else {
        toast(r.reason === 'inventory-full' ? 'Your inventory is too full for the reward.' : 'The quest is not complete.', 2600);
      }
    });
  }

  private openTrade(kind: 'shop' | 'alchemy'): void {
    this.uiPause = true;
    const refresh = () => renderTrade(this.gs);
    const close = () => { closeTrade(); this.uiPause = false; };
    showTrade(kind, this.gs, {
      close,
      buy: (id) => {
        const r = this.mutate(() => buy(this.gs, id));
        if (r.ok) { toast(`Bought ${ITEMS[id]!.name}.`, 1400); audio.sfx('pickup'); } else toast(r.reason === 'stones' ? 'Not enough spirit stones.' : r.reason === 'full' ? 'Your bag is full.' : 'Not available.', 1800);
        refresh();
      },
      sell: (slot) => {
        const id = this.gs.inventory.slots[slot]?.id;
        const r = this.mutate(() => sell(this.gs, slot, 1));
        if (r.ok && id) { toast(`Sold ${ITEMS[id]!.name} (+${sellValue(id)} ◆).`, 1400); audio.sfx('pickup'); }
        refresh();
      },
      craft: (rid) => {
        const r = this.mutate(() => craft(this.gs, rid));
        if (r.ok) { toast('The furnace glows — brewing complete.', 1800); audio.sfx('potion'); this.fx.play('xf_pill_light', this.pos.x, this.pos.y - 14, { scale: 0.26, tint: COLORS.gold }); }
        else toast(r.reason === 'herbs' ? 'You need more Spirit Herbs.' : r.reason === 'stones' ? 'Not enough spirit stones.' : 'Your bag is full.', 2000);
        refresh();
      },
    });
  }

  private levelUpFx(): void {
    toast(`Level up! You are now level ${this.gs.progress.level}.`, 3000); audio.sfx('levelup');
    const unlocked = SKILLS.filter((s) => s.unlockLevel === this.gs.progress.level);
    for (const s of unlocked) toast(`Technique learned: ${s.name} (${s.alt})`, 4200);
    this.fx.play('xf_ascend', this.pos.x, this.pos.y, { scale: 0.4, tint: COLORS.gold });
    this.fx.ring(this.pos.x, this.pos.y, 50, COLORS.gold, 500);
  }

  // ---------- combat: player ----------
  private aimDir(aim?: Vec2): Vec2 {
    if (aim) return normalize({ x: aim.x - this.pos.x, y: aim.y - this.pos.y });
    if (!this.hasPointer) return this.facing;
    return normalize({ x: this.aimWorld.x - this.pos.x, y: this.aimWorld.y - this.pos.y });
  }

  private canAct(): boolean { return !this.uiPause && !this.dead && this.now >= this.playerLockUntil; }

  /** Three-hit sword combo (click / Space / J). */
  private attack(aim?: Vec2): void {
    if (this.uiPause || this.dead || isDashing(this.dashState, this.now)) return;
    const stepIdx = nextStep(this.combo, this.now);
    if (stepIdx < 0) return;
    const hit = COMBO[stepIdx]!;
    commit(this.combo, stepIdx, this.now);
    this.meditating = false;
    const dir = this.aimDir(aim);
    this.player.face(dir.x < 0 ? -1 : 1);
    this.facing = dir;
    this.playerLockUntil = this.now + hit.recover * 0.85;
    this.playerLockAnim = hit.anim;
    this.player.play(hit.anim, { force: true, duration: hit.windup + hit.recover + 0.18 });
    audio.sfx(stepIdx === 0 ? 'slash1' : stepIdx === 1 ? 'slash2' : 'slash3');
    this.schedule(hit.windup, () => {
      const dmgDir = dir;
      const lunged = moveWithCollision(this.world, this.pos, { x: this.pos.x + dmgDir.x * hit.lunge, y: this.pos.y + dmgDir.y * hit.lunge }, PLAYER_RADIUS);
      this.pos = lunged;
      const finisher = stepIdx === COMBO.length - 1;
      this.fx.play('xf_sword_qi', this.pos.x + dmgDir.x * 6, this.pos.y - 12 + dmgDir.y * 4, { scale: finisher ? 0.42 : 0.3, rot: Math.atan2(dmgDir.y, dmgDir.x), tint: finisher ? COLORS.gold : this.heroColor, depth: this.pos.y + 2 });
      let any = false;
      for (const t of this.targets()) {
        if (inArc(this.pos, dmgDir, hit.range, (finisher ? 80 : 65) * Math.PI / 180, t.pos, t.radius)) { t.hit(hit.mult, { kb: hit.knockback, from: this.pos }); any = true; }
      }
      if (finisher) { this.fx.shake(110, 0.0035); if (any) this.hitStop(70); }
    });
  }

  /** Khinh cong: a quick dodge with brief invulnerability. */
  private dash(): void {
    if (this.uiPause || this.dead) return;
    if (!tryDash(this.dashState, this.now)) return;
    this.meditating = false;
    const k = this.kb;
    const mv = { x: Number(k.isDown('KeyD', 'ArrowRight')) - Number(k.isDown('KeyA', 'ArrowLeft')), y: Number(k.isDown('KeyS', 'ArrowDown')) - Number(k.isDown('KeyW', 'ArrowUp')) };
    this.dashDir = mv.x || mv.y ? normalize(mv) : this.hasPointer ? this.aimDir() : this.facing;
    this.player.face(this.dashDir.x < 0 ? -1 : 1);
    this.playerLockUntil = this.now + DASH.duration;
    this.playerLockAnim = 'dash';
    this.player.play('dash', { force: true, duration: DASH.duration + 0.12 });
    audio.sfx('dash');
    this.fx.play('xf_gale_vortex', this.pos.x, this.pos.y, { scale: 0.18, tint: 0xcfefff, alpha: 0.7 });
    this.afterimageTimer = 0;
  }

  private castSkill(i: number, aim?: Vec2): void {
    const sk = SKILLS[i];
    if (!sk || this.dead || this.uiPause) return;
    if (this.gs.progress.level < sk.unlockLevel) { toast(`${sk.name} unlocks at level ${sk.unlockLevel}.`, 1800); return; }
    if (!this.canAct() && !aim) return;
    if (!tryCast(this.pc, this.cds, sk, this.now).ok) return;
    this.meditating = false;
    const dir = this.aimDir(aim);
    this.player.face(dir.x < 0 ? -1 : 1);
    this.facing = dir;
    this.playerLockUntil = this.now + 0.38;
    this.playerLockAnim = 'cast';
    this.player.play('cast', { force: true, duration: 0.42 });
    audio.sfx('cast');
    this.schedule(0.16, () => this.releaseSkill(sk, dir, aim));
  }

  private releaseSkill(sk: SkillDef, dir: Vec2, aim?: Vec2): void {
    const ox = this.pos.x + dir.x * 10, oy = this.pos.y - 12 + dir.y * 6;
    const color = this.heroColor;
    audio.sfx(sk.shape === 'projectile' ? 'sword' : sk.shape === 'wave' ? 'moon' : sk.shape === 'burst' ? 'lotus' : 'rain');
    if (sk.shape === 'projectile') {
      const sprite = this.fx.play(sk.fx.replace('fx.', ''), ox, oy, { scale: 0.2, rot: Math.atan2(dir.y, dir.x), tint: color, loop: true, depth: 1e4 });
      this.addBolt({ kind: 'sword', pos: { x: ox, y: oy + 12 }, vel: { x: dir.x * (sk.speed ?? 300), y: dir.y * (sk.speed ?? 300) }, max: sk.range, damage: sk.damageMult, pierce: sk.pierce ?? 1, radius: 7, sprite, color });
    } else if (sk.shape === 'wave') {
      const sprite = this.fx.play(sk.fx, ox, oy, { scale: 0.34, rot: Math.atan2(dir.y, dir.x), tint: color, loop: true, depth: 1e4, speed: 1.4 });
      this.addBolt({ kind: 'wave', pos: { x: ox, y: oy + 12 }, vel: { x: dir.x * (sk.speed ?? 220), y: dir.y * (sk.speed ?? 220) }, max: sk.range, damage: sk.damageMult, pierce: 99, radius: 16, sprite, color });
      this.fx.shake(90, 0.002);
    } else if (sk.shape === 'burst') {
      this.fx.play(sk.fx, this.pos.x, this.pos.y + 4, { scale: 0.5, tint: color });
      this.fx.ring(this.pos.x, this.pos.y, sk.range, color, 380);
      this.fx.shake(150, 0.0045);
      let any = false;
      for (const t of this.targets()) {
        if (inCircle(this.pos, sk.range, t.pos, t.radius)) { t.hit(sk.damageMult, { kb: 130, stun: sk.stun, from: this.pos }); any = true; }
      }
      if (any) this.hitStop(60);
    } else {
      let target = aim ? { ...aim } : this.hasPointer ? { ...this.aimWorld } : { x: this.pos.x + dir.x * 90, y: this.pos.y + dir.y * 90 };
      const dx = target.x - this.pos.x, dy = target.y - this.pos.y, d = Math.hypot(dx, dy);
      if (d > 220) target = { x: this.pos.x + (dx / d) * 220, y: this.pos.y + (dy / d) * 220 };
      const tele = this.add.image(target.x, target.y, 'ring').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setDisplaySize(sk.range * 2, sk.range * 2).setAlpha(0.65);
      this.rains.push({ pos: target, left: sk.ticks ?? 4, every: 0.28, timer: 0.5, mult: sk.damageMult, radius: sk.range, tele });
      this.fx.play(sk.fx, target.x, target.y + 4, { scale: 0.55, tint: color, speed: 0.8, depth: target.y + 3 });
    }
  }

  private addBolt(b: Omit<Bolt, 'hit' | 'traveled' | 'trail' | 'sprite'> & { sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null }): void {
    const sprite = b.sprite ?? this.add.image(b.pos.x, b.pos.y, 'glow').setTint(b.color).setBlendMode(Phaser.BlendModes.ADD).setDepth(1e4).setDisplaySize(16, 16);
    this.bolts.push({ ...b, sprite, hit: new Set(), traveled: 0, trail: 0 });
  }

  private hitStop(ms: number): void {
    if (this.hitStopUntil > this.time.now) return;
    this.hitStopUntil = this.time.now + ms;
    this.anims.globalTimeScale = 0.02;
  }

  // ---------- combat: shared ----------
  private targets(): Target[] {
    const t: Target[] = this.enemies.map((e) => ({ pos: e.pos, radius: e.def.radius, key: e, hit: (m: number, o?: HitOpts) => this.hitEnemy(e, m, o) }));
    for (const b of this.bosses) t.push({ pos: b.pos, radius: b.def.radius, key: b, hit: (m: number, o?: HitOpts) => this.hitBoss(b, m, o) });
    return t;
  }

  private hitEnemy(e: Enemy, mult: number, o: HitOpts = {}): void {
    if (e.c.hp <= 0) return;
    const r = computeDamage(this.pc, e.c, mult, this.rng);
    const killed = applyDamage(e.c, r.amount);
    this.floatText(e.pos, String(r.amount), r.crit ? '#ffd23f' : '#ffffff', r.crit);
    audio.sfx(r.crit ? 'crit' : 'hit');
    e.actor.flash(80);
    this.fx.burst(e.pos.x, e.pos.y - 10, r.crit ? COLORS.gold : this.heroColor, r.crit ? 14 : 8);
    this.fx.play('xf_ink_splash', e.pos.x, e.pos.y - 10, { scale: r.crit ? 0.2 : 0.13, tint: r.crit ? COLORS.gold : COLORS.white });
    if (r.crit) this.hitStop(55);
    const from = o.from ?? this.pos;
    if (o.kb) e.kb = impulse({ x: e.pos.x - from.x, y: e.pos.y - from.y }, o.kb * (e.def.maxHp > 100 ? 0.4 : 1));
    if (o.stun) e.stun = Math.max(e.stun, o.stun);
    else if (!killed) { e.stun = Math.max(e.stun, e.def.maxHp > 100 ? 0.08 : 0.2); }
    if (!killed) { e.actor.play('hurt', { force: true }); e.lockUntil = this.now + 0.22; return; }
    this.killEnemy(e);
  }

  private killEnemy(e: Enemy): void {
    this.enemies = this.enemies.filter((x) => x !== e);
    audio.sfx('kill');
    const actor = e.actor;
    actor.play('death', { force: true });
    this.fx.play('xf_soul_wisp', e.pos.x, e.pos.y - 14, { scale: 0.2, tint: e.elite ? COLORS.gold : COLORS.wisp });
    this.fx.burst(e.pos.x, e.pos.y - 8, e.elite ? COLORS.gold : COLORS.wisp, 14);
    this.tweens.add({ targets: [actor.sprite], alpha: 0, duration: 700, delay: 500, onComplete: () => actor.destroy() });
    this.tweens.add({ targets: [actor.shadow], alpha: 0, duration: 700, delay: 500 });
    if (!e.minion) this.onKill(e.def.id, e.pos, e.elite, e.zone);
  }

  private hitBoss(b: BossEnt, mult: number, o: HitOpts = {}): void {
    if (!b.engaged) b.engaged = true;
    const r = computeDamage(this.pc, b.c, mult, this.rng);
    const killed = applyDamage(b.c, r.amount);
    this.floatText(b.pos, String(r.amount), r.crit ? '#ffd23f' : '#ffffff', r.crit);
    audio.sfx(r.crit ? 'crit' : 'hit');
    b.actor.flash(70);
    this.fx.burst(b.pos.x, b.pos.y - 22, r.crit ? COLORS.gold : this.heroColor, 10);
    if (o.kb && !killed) b.kb = impulse({ x: b.pos.x - (o.from ?? this.pos).x, y: b.pos.y - (o.from ?? this.pos).y }, o.kb * 0.15);
    if (!killed) return;
    b.tele?.destroy();
    this.bosses = this.bosses.filter((x) => x !== b);
    for (const m of this.enemies.filter((x) => x.minion && x.zone === (b.def.home === 'lair' ? 'lair' : 'grove'))) m.actor.destroy();
    this.enemies = this.enemies.filter((x) => !(x.minion && x.zone === (b.def.home === 'lair' ? 'lair' : 'grove')));
    setBossBar(null);
    const actor = b.actor;
    actor.play('death', { force: true });
    this.fx.play('xf_ascend', b.pos.x, b.pos.y, { scale: 0.8, tint: COLORS.gold });
    this.fx.ring(b.pos.x, b.pos.y, 120, COLORS.gold, 900);
    this.fx.shake(500, 0.007);
    this.hitStop(160);
    this.tweens.add({ targets: [actor.sprite], alpha: 0, duration: 1200, delay: 1200, onComplete: () => actor.destroy() });
    this.tweens.add({ targets: [actor.shadow], alpha: 0, duration: 1200, delay: 1200 });
    this.onKill(b.def.id, b.pos, false);
    toast(`${b.def.name} has been defeated!`, 4500); audio.sfx('roar');
    this.save(false);
  }

  private onKill(type: string, at: Vec2, elite: boolean, zone?: string): void {
    const r = this.mutate(() => registerKill(this.gs, type, this.roll, { elite, zone }));
    this.floatText({ x: at.x, y: at.y - 12 }, `+${r.xp} XP`, '#b9a3ff', false, 8);
    if (r.stones > 0) this.floatText({ x: at.x + 8, y: at.y - 2 }, `+${r.stones} ◆`, '#7fd8ff', false, 8);
    for (const d of r.drops) { toast(`Found ${ITEMS[d.id]!.name}`, 1800); audio.sfx('pickup'); }
    for (const o of r.overflow) toast(`Inventory full: lost ${ITEMS[o]!.name}`, 2200);
    if (r.levelsGained > 0) { this.levelUpFx(); this.save(false); }
  }

  private hurtPlayer(attackValue: number, from?: Vec2): void {
    if (this.dead) return;
    if (isInvulnerable(this.dashState, this.now) || this.now < this.hurtInvulnUntil) {
      if (isInvulnerable(this.dashState, this.now) && this.now - this.lastDodgeText > 0.4) { this.lastDodgeText = this.now; this.floatText(this.pos, 'Dodge', '#bfe9ff', false, 9); }
      return;
    }
    const r = computeDamage({ atk: attackValue, critChance: 0, critMult: 1 }, this.pc, 1, this.rng);
    applyDamage(this.pc, r.amount);
    this.meditating = false;
    this.hurtInvulnUntil = this.now + 0.55;
    this.floatText(this.pos, String(r.amount), '#ff6b6b', false, 11);
    this.player.flash(100, 0xff6a6a);
    this.fx.burst(this.pos.x, this.pos.y - 12, COLORS.hurt, 8);
    this.fx.shake(90, 0.003);
    if (from) this.playerKb = impulse({ x: this.pos.x - from.x, y: this.pos.y - from.y }, 40);
    this.hitStop(35); audio.sfx('hurt');
    if (this.pc.hp <= 0) { this.die(); return; }
    this.player.play('hurt', { force: true });
    this.playerLockUntil = Math.max(this.playerLockUntil, this.now + 0.22); this.playerLockAnim = 'hurt';
  }
  private lastDodgeText = -9;

  private die(): void {
    this.dead = true; this.meditating = false; audio.sfx('death');
    this.player.play('death', { force: true });
    this.fx.shake(300, 0.005);
    this.save(false);
  }

  private respawn(): void {
    this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; this.gs.pos = { ...this.world.spawn }; });
    this.scene.restart({ state: this.gs, host: this.host });
  }

  private floatText(at: Vec2, text: string, color: string, big = false, size = 10): void {
    const t = this.add.text(at.x + (Math.random() - 0.5) * 8, at.y - 22, text, { color, fontSize: `${big ? size + 6 : size + 1}px`, fontStyle: 'bold', fontFamily: 'Georgia, serif', stroke: '#14091f', strokeThickness: 3 }).setOrigin(0.5).setDepth(1e6);
    this.tweens.add({ targets: t, y: t.y - (big ? 26 : 18), alpha: 0, scale: big ? 1.25 : 1, duration: big ? 900 : 700, ease: 'cubic.out', onComplete: () => t.destroy() });
  }

  // ---------- frame update ----------
  update(_t: number, deltaMs: number): void {
    if (this.hitStopUntil > 0 && this.time.now >= this.hitStopUntil) { this.hitStopUntil = 0; this.anims.globalTimeScale = 1; }
    const stopped = this.hitStopUntil > 0;
    const dt = Math.min(deltaMs, 50) / 1000;
    if (this.hasPointer) { const p = this.input.activePointer; this.aimWorld = { x: p.worldX, y: p.worldY }; }

    if (!this.uiPause && !stopped) this.simulate(dt);
    this.player.setPos(this.pos.x, this.pos.y);
    this.camTarget.setPosition(this.pos.x, this.pos.y - 10);
    this.drawOverlays();

    const zone = zoneAt(this.world, this.pos);
    if (zone !== this.currentZone) this.currentZone = zone;
    if (this.lastZoneBanner !== zone) { this.lastZoneBanner = zone; showZoneBanner(ZONES[zone].name, ZONES[zone].level); }
    this.ambient.update(dt, zone);
    const mood: Mood = this.bosses.some((b) => b.engaged) ? 'boss' : zone === 'marsh' ? 'mist' : zone === 'ruins' || zone === 'lair' || this.enemies.some((e) => e.ai.state !== 'idle' && !e.minion) ? 'danger' : 'calm';
    audio.setMood(mood);
    updateOccluders(this.occluders, [{ x: this.pos.x, y: this.pos.y }, ...this.enemies.map((e) => e.pos), ...this.bosses.flatMap((b) => [b.pos, { x: b.pos.x, y: b.pos.y - 26 }, { x: b.pos.x - 26, y: b.pos.y - 10 }, { x: b.pos.x + 26, y: b.pos.y - 10 }])], dt);

    const npc = this.nearestNpc(), herb = this.nearestHerb();
    const nearArray = Math.hypot(this.pos.x - this.world.arrayPos.x, this.pos.y - this.world.arrayPos.y) < ARRAY_RADIUS;
    const prompt = this.dead ? 'You have fallen — press R to respawn'
      : this.uiPause ? null
      : npc ? `Press E to talk to ${npc.id === 'elder-lin' ? 'Elder Lin' : npc.id === 'merchant-qiao' ? 'Merchant Qiao' : 'Alchemist Yun'}`
      : herb ? 'Press E to gather the Spirit Herb'
      : nearArray && !this.meditating ? 'Spirit array: press M to meditate (qi gathers faster here)' : null;
    setPrompt(prompt);
    for (const n of this.npcs) {
      n.actor.face(this.pos.x < n.pos.x ? -1 : 1);
      if (n.id === 'elder-lin') { const d = getDialogue('elder-lin', this.gs.quests, this.gs.inventory).options[0]!.action; n.mark.setVisible(d.type === 'accept' || d.type === 'turnin'); } else n.mark.setVisible(false);
      n.mark.y = n.pos.y - 38 + Math.sin(this.time.now / 260) * 2;
    }

    updateMinimap({
      player: this.pos, facing: this.facing, enemies: this.enemies.filter((e) => !e.minion).map((e) => ({ x: e.pos.x, y: e.pos.y, elite: e.elite })),
      bosses: this.bosses.map((b) => b.pos), npcs: this.npcs.map((n) => n.pos), herbs: this.herbs.filter((h) => h.alive),
    }, dt);
    this.pushToState();
    updateHud({
      gs: this.gs, maxHp: this.pc.maxHp, maxMana: this.pc.maxMana, meditating: this.meditating,
      cooldowns: SKILLS.map((s) => this.cds.remaining(s.id, this.now)),
      comboStep: this.now - this.combo.lastAt <= COMBO_WINDOW ? this.combo.step + 1 : 0,
      dashCd: Math.max(0, this.dashState.readyAt - this.now), dashMax: DASH.cooldown, zone: ZONES[zone].name,
    });
    refreshPanels(this.gs, this.meditating);
  }

  private simulate(dt: number): void {
    this.now += dt;
    const alive = !this.dead;
    // scheduled actions
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= this.now);
      if (due.length) { this.timers = this.timers.filter((t) => t.at > this.now); for (const t of due) t.fn(); }
    }

    if (alive) this.updatePlayer(dt);
    const target = alive ? this.pos : { x: 1e9, y: 1e9 };
    for (const e of [...this.enemies]) this.updateEnemy(e, target, alive, dt);
    for (const b of [...this.bosses]) this.updateBossEntity(b, target, alive, dt);
    this.updateBolts(dt, alive);
    this.updateRains(dt);

    for (const h of this.herbs) if (!h.alive && this.now >= h.respawnAt) { h.alive = true; h.img.setVisible(true); h.glow.setVisible(true); }
    this.respawnTimer += dt;
    if (this.respawnTimer >= RESPAWN_CHECK_SECONDS) { this.respawnTimer = 0; this.topUpEnemies(); }
  }

  private topUpEnemies(): void {
    for (const z of Object.values(ZONES)) {
      for (const [type, n] of Object.entries(z.spawns)) {
        const alive = this.enemies.filter((e) => !e.minion && e.def.id === type && e.zone === z.id).length;
        if (alive < n) { this.spawnInZone(z.id, type, this.pos); return; } // one per check
      }
    }
  }

  private updatePlayer(dt: number): void {
    const k = this.kb;
    const mv = { x: Number(k.isDown('KeyD', 'ArrowRight')) - Number(k.isDown('KeyA', 'ArrowLeft')), y: Number(k.isDown('KeyS', 'ArrowDown')) - Number(k.isDown('KeyW', 'ArrowUp')) };
    const moving = mv.x !== 0 || mv.y !== 0;
    const dashing = isDashing(this.dashState, this.now);
    const locked = this.now < this.playerLockUntil;

    if (dashing) {
      const sp = DASH.distance / DASH.duration;
      this.pos = moveWithCollision(this.world, this.pos, { x: this.pos.x + this.dashDir.x * sp * dt, y: this.pos.y + this.dashDir.y * sp * dt }, PLAYER_RADIUS);
      this.afterimageTimer -= dt;
      if (this.afterimageTimer <= 0) { this.afterimageTimer = 0.04; this.fx.afterimage(this.player.sprite, 0x9fdcff); }
    } else if (!locked || this.playerLockAnim.startsWith('combo')) {
      const speed = this.playerLockAnim.startsWith('combo') && locked ? PLAYER_SPEED * 0.25 : PLAYER_SPEED;
      if (moving) { this.meditating = false; if (!locked) this.facing = normalize(mv); }
      this.pos = moveWithCollision(this.world, this.pos, step(this.pos, mv, speed, dt), PLAYER_RADIUS);
    }
    if (Math.hypot(this.playerKb.x, this.playerKb.y) > 0) {
      const kb = stepKnockback(this.playerKb, dt); this.playerKb = kb.vel;
      this.pos = moveWithCollision(this.world, this.pos, { x: this.pos.x + kb.move.x, y: this.pos.y + kb.move.y }, PLAYER_RADIUS);
    }

    regenMana(this.pc, dt);
    if (this.meditating) {
      this.pushToState();
      const nearArray = Math.hypot(this.pos.x - this.world.arrayPos.x, this.pos.y - this.world.arrayPos.y) < ARRAY_RADIUS;
      meditate(this.gs.cultivation, dt * (nearArray ? 2.5 : 1));
    }
    // facing: pointer if used, otherwise movement
    if (!locked) {
      if (this.hasPointer && !moving) this.player.face(this.aimWorld.x < this.pos.x ? -1 : 1);
      else if (moving && mv.x !== 0) this.player.face(mv.x < 0 ? -1 : 1);
    }
    // animation
    if (!locked && !dashing) {
      if (this.meditating) this.player.play('idle');
      else if (moving) this.player.play('walk'); else this.player.play('idle');
    }
    // meditation aura
    if (this.meditating && !this.auraSprite) this.auraSprite = this.fx.play('xf_array_seal', this.pos.x, this.pos.y + 4, { scale: 0.34, tint: COLORS.qi, loop: true, depth: this.pos.y - 1, alpha: 0.85 });
    if (this.auraSprite) {
      if (!this.meditating) { this.auraSprite.destroy(); this.auraSprite = null; } else { this.auraSprite.setPosition(this.pos.x, this.pos.y + 4); if (Math.random() < 0.15) this.fx.burst(this.pos.x + (Math.random() - 0.5) * 24, this.pos.y - 4, COLORS.qi, 1); }
    }

    this.autosaveTimer += dt;
    if (this.autosaveTimer >= AUTOSAVE_SECONDS) { this.autosaveTimer = 0; this.save(false); }
  }

  private updateEnemy(e: Enemy, target: Vec2, alive: boolean, dt: number): void {
    e.stun = Math.max(0, e.stun - dt);
    // knockback applies even while stunned
    if (Math.hypot(e.kb.x, e.kb.y) > 0) {
      const kb = stepKnockback(e.kb, dt); e.kb = kb.vel;
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + kb.move.x, y: e.pos.y + kb.move.y }, e.def.radius);
    }
    let attackKind: 'melee' | 'projectile' | undefined;
    e.vel = { x: 0, y: 0 };
    if (e.stun <= 0) {
      const out = updateEnemyAI(e.ai, e.def, e.pos, target, dt);
      e.vel = out.vel;
      if (e.ai.state === 'idle' && !e.minion) { // lost the target: walk home and recover, so luring enemies away cannot be exploited
        const hx = e.home.x - e.pos.x, hy = e.home.y - e.pos.y, hd = Math.hypot(hx, hy);
        if (hd > 6) e.vel = { x: (hx / hd) * e.def.speed * 0.7, y: (hy / hd) * e.def.speed * 0.7 };
        if (e.c.hp < e.c.maxHp) e.c.hp = Math.min(e.c.maxHp, e.c.hp + e.c.maxHp * 0.08 * dt);
      }
      // soft separation so packs spread out instead of stacking into one sprite
      for (const o of this.enemies) {
        if (o === e) continue;
        const dx = e.pos.x - o.pos.x, dy = e.pos.y - o.pos.y, d = Math.hypot(dx, dy), min = (e.def.radius + o.def.radius) * 1.1;
        if (d < min && d > 0.01) { const push = ((min - d) / min) * e.def.speed * 1.4; e.vel = { x: e.vel.x + (dx / d) * push, y: e.vel.y + (dy / d) * push }; }
      }
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + out.vel.x * dt, y: e.pos.y + out.vel.y * dt }, e.def.radius);
      attackKind = out.attack?.kind;
    }
    const toPlayer = { x: this.pos.x - e.pos.x, y: this.pos.y - e.pos.y };
    const dist = Math.hypot(toPlayer.x, toPlayer.y);
    if (attackKind === 'melee') {
      if (dist <= e.def.attackRange + e.def.radius + PLAYER_RADIUS + (e.def.behavior === 'charger' ? 8 : 4)) this.hurtPlayer(e.c.atk, e.pos);
      e.actor.play('attack', { force: true, duration: 0.4 }); e.lockUntil = this.now + 0.4;
    } else if (attackKind === 'projectile') {
      const d = normalize(toPlayer);
      this.addBolt({ kind: 'hostile', pos: { x: e.pos.x, y: e.pos.y - 14 }, vel: { x: d.x * 96, y: d.y * 96 }, max: 190, damage: e.c.atk, pierce: 1, radius: 5, sprite: null, color: e.elite ? COLORS.gold : COLORS.wisp });
      e.actor.play('attack', { force: true, duration: 0.4 }); e.lockUntil = this.now + 0.4;
    }
    // animation + facing
    if (e.stun <= 0 && this.now >= e.lockUntil) {
      if (e.ai.state === 'windup') { if (e.actor.anim !== 'attack') e.actor.play('attack', { force: true, duration: e.def.windup ?? 0.6 }); }
      else if (Math.hypot(e.vel.x, e.vel.y) > 6) e.actor.play('move'); else e.actor.play('idle');
    } else if (e.stun > 0 && this.now >= e.lockUntil && e.actor.anim !== 'hurt') e.actor.play('hurt');
    if (alive && e.ai.state !== 'idle' && dist < e.def.aggroRange * 1.4) e.actor.face(toPlayer.x < 0 ? -1 : 1);
    else if (Math.abs(e.vel.x) > 4) e.actor.face(e.vel.x < 0 ? -1 : 1);
    e.actor.setPos(e.pos.x, e.pos.y);
    if (e.ai.state === 'windup') e.actor.tint(0xffb066); else if (e.elite) e.actor.tint(0xffe9a8); else e.actor.untint();
  }

  private updateBolts(dt: number, alive: boolean): void {
    for (const b of [...this.bolts]) {
      const dx = b.vel.x * dt, dy = b.vel.y * dt;
      b.pos = { x: b.pos.x + dx, y: b.pos.y + dy };
      b.traveled += Math.hypot(dx, dy);
      b.sprite.setPosition(b.pos.x, b.pos.y - 12);
      b.sprite.setDepth(b.pos.y + 20);
      b.trail -= dt;
      if (b.trail <= 0) { b.trail = 0.05; this.fx.burst(b.pos.x, b.pos.y - 12, b.color, 1); }
      let consumed = b.traveled >= b.max || (b.kind !== 'wave' && isBlockedTile(this.world, Math.floor(b.pos.x / TILE_SIZE), Math.floor(b.pos.y / TILE_SIZE)));
      if (!consumed && b.kind === 'hostile') {
        if (alive && inCircle(b.pos, b.radius, this.pos, PLAYER_RADIUS + 3)) { this.hurtPlayer(b.damage, b.pos); consumed = true; this.fx.burst(b.pos.x, b.pos.y, b.color, 8); }
      } else if (!consumed) {
        for (const t of this.targets()) {
          if (b.hit.has(t.key) || !inCircle(b.pos, b.radius, t.pos, t.radius)) continue;
          b.hit.add(t.key); t.hit(b.damage, { kb: b.kind === 'wave' ? 70 : 40, from: { x: b.pos.x - b.vel.x, y: b.pos.y - b.vel.y } });
          b.pierce--; this.fx.flare(b.pos.x, b.pos.y - 12, b.color, 36, 220);
          if (b.pierce <= 0) { consumed = true; break; }
        }
      }
      if (consumed) { b.sprite.destroy(); this.bolts = this.bolts.filter((x) => x !== b); }
    }
  }

  private updateRains(dt: number): void {
    for (const r of [...this.rains]) {
      r.timer -= dt;
      r.tele.setAlpha(0.35 + 0.3 * Math.sin(this.now * 18));
      if (r.timer > 0) continue;
      r.timer = r.every; r.left--;
      this.fx.shake(60, 0.0025);
      this.fx.burst(r.pos.x, r.pos.y, this.heroColor, 10);
      for (const t of this.targets()) if (inCircle(r.pos, r.radius, t.pos, t.radius)) t.hit(r.mult, { kb: 35, from: r.pos });
      if (r.left <= 0) { r.tele.destroy(); this.rains = this.rains.filter((x) => x !== r); }
    }
  }

  private updateBossEntity(b: BossEnt, target: Vec2, alive: boolean, dt: number): void {
    const dist = Math.hypot(target.x - b.pos.x, target.y - b.pos.y);
    if (!b.engaged && alive && dist < 170) b.engaged = true;
    if (b.engaged && (dist > 360 || !alive)) { // leash / player died: reset the fight
      b.engaged = false; b.c.hp = b.c.maxHp; b.ai = newBossAI(); b.tele?.destroy(); b.tele = null;
      for (const m of this.enemies.filter((x) => x.minion)) m.actor.destroy();
      this.enemies = this.enemies.filter((x) => !x.minion);
      setBossBar(null);
    }
    let vel = { x: 0, y: 0 };
    if (Math.hypot(b.kb.x, b.kb.y) > 0) { const kb = stepKnockback(b.kb, dt); b.kb = kb.vel; b.pos = moveWithCollision(this.world, b.pos, { x: b.pos.x + kb.move.x, y: b.pos.y + kb.move.y }, b.def.radius - 4); }
    if (b.engaged) {
      const out = updateBoss(b.ai, b.def, b.c.hp / b.c.maxHp, b.pos, target, dt, this.enemies.filter((x) => x.minion).length);
      vel = out.vel;
      b.pos = moveWithCollision(this.world, b.pos, { x: b.pos.x + out.vel.x * dt, y: b.pos.y + out.vel.y * dt }, b.def.radius - 4);
      for (const ev of out.events) {
        if (ev.type === 'phase') { audio.sfx('roar'); toast(ev.phase === 2 ? `${b.def.name} calls its minions!` : `${b.def.name} is enraged!`, 2800); this.fx.shake(300, 0.006); this.fx.ring(b.pos.x, b.pos.y, 90, COLORS.boss, 600); }
        else if (ev.type === 'slam-telegraph') {
          b.tele?.destroy();
          const g = this.add.graphics().setDepth(5);
          g.fillStyle(0xff3b30, 0.26).fillCircle(ev.at.x, ev.at.y, ev.radius).lineStyle(2.5, 0xff5a4a, 0.95).strokeCircle(ev.at.x, ev.at.y, ev.radius);
          audio.sfx('telegraph'); b.tele = g; b.actor.play('attack_a', { force: true, duration: ev.duration }); b.lockUntil = this.now + ev.duration + 0.5;
        } else if (ev.type === 'slam') {
          b.slams++; b.tele?.destroy(); b.tele = null; audio.sfx('slam');
          this.fx.ring(ev.at.x, ev.at.y, ev.radius, 0xff7043, 420);
          for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; this.fx.play('xf_stone_spike', ev.at.x + Math.cos(a) * ev.radius * 0.7, ev.at.y + Math.sin(a) * ev.radius * 0.7, { scale: 0.24, tint: 0xffb28a, blend: 'normal', depth: ev.at.y + Math.sin(a) * ev.radius }); }
          this.fx.shake(220, 0.007);
          if (inCircle(ev.at, ev.radius, this.pos, PLAYER_RADIUS)) this.hurtPlayer(b.def.atk * ev.damageMult, ev.at);
        } else if (ev.type === 'summon') {
          b.actor.play('special', { force: true, duration: 0.8 }); b.lockUntil = this.now + 0.9;
          for (let i = 0; i < ev.count; i++) {
            const a = this.rng() * Math.PI * 2;
            const p = { x: b.pos.x + Math.cos(a) * 36, y: b.pos.y + Math.sin(a) * 36 };
            if (!isBlockedTile(this.world, Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))) { this.spawnEnemy(ev.minionType, p, true, b.def.home === 'lair' ? 'lair' : 'grove'); this.fx.play('xf_soul_wisp', p.x, p.y - 10, { scale: 0.2, tint: COLORS.boss }); }
          }
        } else if (ev.type === 'ring-telegraph') { b.actor.play('attack_b', { force: true, duration: ev.duration }); b.lockUntil = this.now + ev.duration + 0.4; this.fx.flare(b.pos.x, b.pos.y - 24, COLORS.wisp, 70, ev.duration * 1000); }
        else if (ev.type === 'ring') {
          this.fx.ring(b.pos.x, b.pos.y, 60, COLORS.wisp, 360);
          for (let i = 0; i < ev.projectiles; i++) {
            const a = (i / ev.projectiles) * Math.PI * 2;
            this.addBolt({ kind: 'hostile', pos: { x: b.pos.x, y: b.pos.y - 14 }, vel: { x: Math.cos(a) * 88, y: Math.sin(a) * 88 }, max: 230, damage: b.def.atk * ev.damageMult, pierce: 1, radius: 6, sprite: null, color: COLORS.wisp });
          }
        }
      }
      setBossBar(b.def.name, b.c.hp, b.c.maxHp);
    }
    if (this.now >= b.lockUntil) b.actor.play(Math.hypot(vel.x, vel.y) > 4 ? 'move' : 'idle');
    b.actor.face(target.x < b.pos.x ? -1 : 1);
    b.actor.setPos(b.pos.x, b.pos.y);
    if (b.ai.phase === 3) b.actor.tint(0xff9a9a); else b.actor.untint();
  }

  private drawOverlays(): void {
    this.hpBars.clear();
    for (const e of this.enemies) {
      if (e.c.hp >= e.c.maxHp) continue;
      const w = 18, x = e.pos.x - w / 2, y = e.pos.y - e.def.scale * 85 - 4;
      this.hpBars.fillStyle(0x000000, 0.75).fillRect(x - 1, y - 1, w + 2, 4);
      this.hpBars.fillStyle(e.elite ? 0xffc83d : 0xe74c3c, 1).fillRect(x, y, (w * e.c.hp) / e.c.maxHp, 2);
    }
  }

  // ---------- test hooks (used by e2e only) ----------
  private installTestHooks(): void {
    const w = window as unknown as Record<string, unknown>;
    w.__world = () => ({ x: this.pos.x, y: this.pos.y });
    w.__rpg = {
      state: () => ({
        now: this.now, hp: this.pc.hp, mana: this.pc.mana, maxHp: this.pc.maxHp, kills: this.gs.kills, xp: this.gs.progress.xp, level: this.gs.progress.level,
        realm: this.gs.cultivation.realm, qi: this.gs.cultivation.qi, weapon: this.gs.inventory.weapon, meditating: this.meditating, bossDefeated: isBossDefeated(this.gs, 'warden'), bossesDefeated: [...this.gs.bosses],
        hero: this.gs.character.hero, stones: this.gs.stones, zone: this.currentZone, dead: this.dead, comboStep: this.combo.step, dashing: isDashing(this.dashState, this.now), invulnerable: isInvulnerable(this.dashState, this.now),
        quests: Object.fromEntries(Object.entries(this.gs.quests).map(([k, v]) => [k, v.status])),
        enemies: this.enemies.map((e) => ({ id: e.id, type: e.def.id, hp: e.c.hp, x: e.pos.x, y: e.pos.y, ai: e.ai.state, minion: e.minion, elite: e.elite, zone: e.zone, anim: e.actor.anim })),
        bosses: this.bosses.map((b) => ({ id: b.def.id, hp: b.c.hp, maxHp: b.c.maxHp, x: b.pos.x, y: b.pos.y, engaged: b.engaged, phase: b.ai.phase, state: b.ai.state, slams: b.slams })),
        boss: this.boss ? { hp: this.boss.c.hp, maxHp: this.boss.c.maxHp, x: this.boss.pos.x, y: this.boss.pos.y, engaged: this.boss.engaged, phase: this.boss.ai.phase, state: this.boss.ai.state, slams: this.boss.slams } : null,
        palace: this.world.props.find((p) => p.kind === 'palace'), lair: this.world.lair, den: this.world.den, spawn: this.world.spawn, npc: this.world.npcs['elder-lin'], npcs: this.world.npcs, arrayPos: this.world.arrayPos,
        herbs: this.herbs.map((h) => ({ x: h.x, y: h.y, alive: h.alive })), anchors: this.world.anchors,
        playerAnim: this.player.anim, items: this.gs.inventory.slots.filter((s) => s).map((s) => `${s!.id}:${s!.count}`),
      }),
      cast: (i: number, x: number, y: number) => { this.playerLockUntil = 0; this.castSkill(i, { x, y }); },
      attack: (x: number, y: number) => this.attack({ x, y }),
      dash: () => this.dash(),
      teleport: (x: number, y: number) => { this.pos = { x, y }; },
      spawn: (type: string, x: number, y: number) => { this.spawnEnemy(type, { x, y }); },
      clear: () => { this.enemies.forEach((e) => e.actor.destroy()); this.enemies = []; },
      setRoll: (v: number | null) => { this.rngOverride = v; },
      setQi: (v: number) => { this.gs.cultivation.qi = v; },
      setBossHpRatio: (r: number, id = 'warden') => { const b = this.bosses.find((x) => x.def.id === id); if (b) b.c.hp = Math.max(1, Math.round(b.c.maxHp * r)); },
      giveXp: (n: number) => this.mutate(() => grantXp(this.gs, n)),
      give: (id: string, n: number) => this.mutate(() => addItem(this.gs.inventory, id, n)),
      setHp: (n: number) => { this.pc.hp = n; },
      killPlayer: () => { this.hurtInvulnUntil = 0; this.dashState.invulnUntil = 0; this.hurtPlayer(99999); },
      respawnNow: () => this.respawn(),
      useSlot: (i: number) => this.useSlot(i),
      gather: () => this.interact(),
    };
  }
}
