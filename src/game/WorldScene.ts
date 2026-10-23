import Phaser from 'phaser';
import { addPoise, newBossAI, STAGGER_DAMAGE, updateBoss, type BossAI, type BossEvent } from '../core/boss';
import { PERFECT_BUFF_TIME, PERFECT_DAMAGE, PERFECT_MANA, PERFECT_SLOWMO, perfectReady } from '../core/dodge';
import { showBoonPicker, isBoonPickerOpen } from '../ui/boons';
import { LEASH, newRun, updateTower, type FloorPlan, type FloorReward, type TowerRun } from '../core/tower';
import { BOONS } from '../data/boons';
import { applyDamage, computeDamage, Cooldowns, regenMana, tryCast, type Combatant } from '../core/combat';
import { COMBO, COMBO_WINDOW, commit, DASH, isDashing, isInvulnerable, newCombo, newDash, nextStep, tryDash, type ComboState, type DashState } from '../core/combo';
import { scaledEnemy } from '../core/balance';
import { BACKLASH, meditate, nextRealmLevel } from '../core/cultivation';
import { getDialogue } from '../core/dialogue';
const AMBUSH_MULT = 1.5; // sneak-attack damage bonus on an unaware enemy
const PACK_ALERT_RADIUS = 70; // hearing range for packmates when one is struck
import { deathTax, hpRegenPerSec } from '../core/recovery';
import { canSee, FOV, SENSE_RADIUS, turnToward, TURN_RATE } from '../core/perception';
import { newEnemyAI, updateEnemyAI, type EnemyAI } from '../core/enemyAI';
import { boonChoices, boonMods, gatherHerb, grantXp, isBossDefeated, registerKill, statsOf, takeBoon, tryBreakthrough, turnInQuest, unequipSlot, useItemSlot, type GameState } from '../core/gameState';
import { freePoints, scaledSkill, skillLevel, upgradeSkill, type ScaledSkill } from '../core/skills';
import { progressOf, isComplete } from '../core/quest';
import { inArc, inCircle, normalize } from '../core/hit';
import { addItem, equipFromSlot } from '../core/inventory';
import { impulse, stepKnockback } from '../core/knockback';
import { step, type Vec2 } from '../core/movement';
import { acceptQuest } from '../core/quest';
import { createRng } from '../core/rng';
import { generateChapter, isBlockedTile, moveWithCollision, TILE_SIZE, zoneAt, type WorldMap, type ZoneId } from '../core/world';
import { bossesOfChapter, type BossDef } from '../data/boss';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { ITEMS } from '../data/items';
import { NPCS, QUESTS, questsOfChapter } from '../data/quests';
import { REALMS } from '../data/realms';
import { SKILLS, type SkillDef } from '../data/skills';
import { ZONES, zonesOfChapter } from '../data/zones';
import { CHAPTERS, LAST_CHAPTER, canEnterChapter } from '../data/chapters';
import { showStory } from '../ui/story';
import { FLASK_MAX, manaOnSwing, refillFlask, useFlask } from '../core/sustain';
import { buildPanels, closePanels, isDialogueOpen, isPanelOpen, refreshPanels, showDialogue, togglePanel } from '../ui/panels';
import { hideScreen, showPause } from '../ui/menu';
import { setBossBar, setObjectiveArrow, setPrompt, showDeath, showZoneBanner, toast, updateHud } from '../ui/hud';
import { closeWorldMap, setMinimapZone, initMinimap, isWorldMapOpen, removeMinimap, toggleWorldMap, updateMinimap, updateWorldMap } from '../ui/minimap';
import { closeTrade, isTradeOpen, renderTrade, showTrade } from '../ui/trade';
import { craft } from '../core/alchemy';
import { buy, sell, sellValue } from '../core/shop';
import { Ambient } from './ambient';
import { audio, type Mood } from './audio';
import { Actor } from './actor';
import { COLORS, Fx, ROOT_COLOR } from './fx';
import { KeyInput } from './input';
import { mountTouchControls, wantsTouchControls } from '../ui/touch';
import { saveGame } from './storage';
import { renderWorld, updateOccluders, type HerbNode, type Occluder } from './worldRender';

const PLAYER_SPEED = 78;
const PLAYER_RADIUS = 5;
const TALK_RANGE = 36;
const PORTAL_RANGE = 44;
const GATHER_RANGE = 26;
const WORLD_SEED = 20261016;
const AUTOSAVE_SECONDS = 30;
const RESPAWN_CHECK_SECONDS = 4;
const ARRAY_RADIUS = 48;
const HERB_RESPAWN_SECONDS = 90;
const POTION_COOLDOWN = 2.5;

export interface GameHost { quitToMenu(): void }

interface Enemy {
  id: number; def: EnemyDef; c: Combatant; ai: EnemyAI; pos: Vec2; actor: Actor; kb: Vec2; stun: number;
  lockUntil: number; minion: boolean; elite: boolean; zone: ZoneId; vel: Vec2; home: Vec2; stuckT: number; stuckPos: Vec2; detour: { until: number; sign: number } | null; stuckCount: number; lastDetourEnd: number;
  burn: { t: number; dps: number; tick: number } | null; slow: number; shield: number; affix: Affix | null; label: Phaser.GameObjects.Text | null;
  alertUntil: number; sees: boolean; tower?: boolean;
}
type Affix = 'swift' | 'vampiric' | 'explosive' | 'shielded';
const AFFIX_NAME: Record<Affix, string> = { swift: 'Swift', vampiric: 'Vampiric', explosive: 'Volatile', shielded: 'Warded' };
interface BossEnt {
  burn: { t: number; dps: number; tick: number } | null; slow: number;
  rainTele: Phaser.GameObjects.Graphics | null; charge: { until: number; hit: boolean; width: number; mult: number } | null;
  slams: number; def: BossDef; c: Combatant; ai: BossAI; pos: Vec2; actor: Actor; engaged: boolean; tele: Phaser.GameObjects.Graphics | null; lockUntil: number; kb: Vec2;
}
interface Bolt {
  kind: 'sword' | 'wave' | 'hostile'; pos: Vec2; vel: Vec2; traveled: number; max: number; damage: number; pierce: number; hit: Set<unknown>;
  radius: number; sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; trail: number; color: number;
}
interface RainZone { pos: Vec2; left: number; every: number; timer: number; mult: number; radius: number; tele: Phaser.GameObjects.Image }
interface Npc { id: string; pos: Vec2; actor: Actor; mark: Phaser.GameObjects.Text; plate: Phaser.GameObjects.Text }
interface Target { pos: Vec2; radius: number; key: unknown; hit(mult: number, o?: HitOpts): void }
interface HitOpts { kb?: number; stun?: number; from?: Vec2; crit?: boolean; dot?: boolean }

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
  private chapter = 1;
  private traveling = false;
  private nextId = 1;
  private hpBars!: Phaser.GameObjects.Graphics;
  private kb!: KeyInput;
  private unmountTouch?: () => void;
  private meditating = false;
  private auraSprite: Phaser.GameObjects.Sprite | null = null;
  private uiPause = false;
  private hasPointer = false;
  private facing: Vec2 = { x: 1, y: 0 };
  private vision!: Phaser.GameObjects.Graphics;
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
  private potionReadyAt = 0;
  private lastZoneBanner: ZoneId | null = null;

  constructor() { super('World'); }

  init(data: { state: GameState; host: GameHost }): void { this.gs = data.state; this.host = data.host; }

  create(): void {
    this.enemies = []; this.bolts = []; this.rains = []; this.bosses = []; this.npcs = []; this.timers = [];
    this.traveling = false; this.tower = null;
    this.now = 0; this.cds = new Cooldowns(); this.combo = newCombo(); this.dashState = newDash();
    this.meditating = false; this.uiPause = false; this.respawnTimer = 0; this.autosaveTimer = 0; this.dead = false;
    this.potionReadyAt = 0; this.playerLockUntil = 0; this.hurtInvulnUntil = 3; this.lastCombat = -99; this.playerKb = { x: 0, y: 0 }; this.hitStopUntil = 0; this.lastZoneBanner = null;
    this.anims.globalTimeScale = 1;
    this.rng = createRng(WORLD_SEED + 1);
    this.chapter = this.gs.chapter;
    this.world = generateChapter(this.chapter, WORLD_SEED);
    const worldW = this.world.width * TILE_SIZE, worldH = this.world.height * TILE_SIZE;

    const rendered = renderWorld(this, this.world, WORLD_SEED + this.chapter - 1);
    this.herbs = rendered.herbs; this.occluders = rendered.occluders;
    initMinimap(this.world, () => { if (!this.uiPause) toggleWorldMap(this.world); });
    this.fx = new Fx(this);
    this.ambient = new Ambient(this, worldW, worldH);

    if (this.gs.hp <= 0) { const s0 = statsOf(this.gs); this.gs.hp = s0.maxHp; this.gs.mana = s0.maxMana; this.gs.pos = { ...this.world.spawn }; } // safety net for old/zombie saves
    this.pos = { ...this.gs.pos };
    this.pc = { hp: 0, maxHp: 1, mana: 0, maxMana: 1, atk: 0, def: 0, critChance: 0, critMult: 1, manaRegen: 0 };
    this.pullFromState();
    const hero = HEROES[this.gs.character.hero];
    this.player = new Actor(this, hero.sprite, this.pos.x, this.pos.y, hero.scale, 22);
    this.camTarget = this.add.zone(this.pos.x, this.pos.y - 10, 1, 1);

    for (const [id, p] of Object.entries(this.world.npcs)) {
      const ndef = NPCS[id]!;
      const actor = new Actor(this, ndef.sprite, p.x, p.y, 0.34, 22);
      actor.setPos(p.x, p.y);
      const plate = this.add.text(p.x, p.y + 7, ndef.role, { color: '#f1e3b0', fontSize: '7px', fontStyle: 'bold', fontFamily: 'Georgia, serif', stroke: '#0b0d14', strokeThickness: 2, backgroundColor: 'rgba(11,13,20,0.72)', padding: { x: 3, y: 1 } }).setOrigin(0.5, 0).setDepth(9e4);
      const mark = this.add.text(p.x, p.y - 38, '!', { color: '#ffd23f', fontSize: '14px', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(1e5);
      this.npcs.push({ id, pos: p, actor, mark, plate });
    }

    for (const zid of zonesOfChapter(this.chapter)) for (const [type, n] of Object.entries(ZONES[zid].spawns)) for (let i = 0; i < n; i++) this.spawnInZone(zid, type);
    for (const def of bossesOfChapter(this.chapter)) this.spawnBoss(def); // bosses always return: repeat kills pay less and drop no unique items
    this.hpBars = this.add.graphics().setDepth(1e5);

    const kb = this.kb = new KeyInput();
    kb.onPress(['Digit1', 'Numpad1'], () => this.digit(0)); kb.onPress(['Digit2', 'Numpad2'], () => this.digit(1));
    kb.onPress(['Digit3', 'Numpad3'], () => this.digit(2)); kb.onPress(['Digit4', 'Numpad4'], () => this.digit(3));
    kb.onPress('Space', () => this.attack());
    kb.onPress(['ShiftLeft', 'ShiftRight'], () => this.dash());
    kb.onPress('KeyF', () => this.useFlaskOrPotion()); kb.onPress('KeyG', () => this.quickUse('mana-potion'));
    kb.onPress('KeyE', () => this.interact());
    kb.onPress('KeyM', () => this.toggleMeditate()); kb.onPress('KeyB', () => this.breakthrough());
    kb.onPress('KeyI', () => { if (!this.uiPause) togglePanel('inv'); }); kb.onPress('KeyC', () => { if (!this.uiPause) togglePanel('chr'); });
    kb.onPress('KeyN', () => { audio.setMuted(!audio.muted); toast(audio.muted ? 'Sound off' : 'Sound on', 1000); document.getElementById('btn-audio')?.classList.toggle('off', audio.muted); });
    kb.onPress('KeyJ', () => { if (!this.uiPause && !this.dead) togglePanel('qlog'); });
    kb.onPress('Tab', () => { if (!this.uiPause) toggleWorldMap(this.world); });
    kb.onPress('Escape', () => this.escape());
    kb.onPress('KeyR', () => { if (this.dead) this.respawn(); });
    if (wantsTouchControls()) this.unmountTouch = mountTouchControls(kb);
    this.input.on('pointerdown', () => { if (!this.uiPause) this.attack(); });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!p.wasTouch) this.hasPointer = true; });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.camTarget, true, 0.12, 0.12);
    this.applyZoom();
    this.scale.on('resize', () => this.applyZoom());
    // vignette is a CSS overlay (#vig): a full-screen WebGL filter pass cost ~2x frame time on weaker GPUs
    this.hpBars.setDepth(1e5); this.vision = this.add.graphics().setDepth(2);
    this.events.once('shutdown', () => {
      this.unmountTouch?.(); this.kb.dispose(); closeTrade(); closeWorldMap(); showDeath(false); removeMinimap(); audio.stopMusic(); this.scale.off('resize'); closePanels(); showDialogue(null, () => undefined); setBossBar(null); setPrompt(null);
      this.anims.globalTimeScale = 1;
    });

    buildPanels({
      clickSlot: (i) => this.useSlot(i),
      unequip: (key) => { this.mutate(() => unequipSlot(this.gs, key)); },
      upgradeSkill: (id) => {
        const r = this.mutate(() => upgradeSkill(this.gs, id));
        if (r.ok) { toast('Technique improved.', 1200); audio.sfx('pickup'); } else toast(r.reason === 'points' ? 'No skill points left.' : r.reason === 'max' ? 'Already at maximum level.' : 'Not available yet.', 1400);
      },
      toggleMeditate: () => this.toggleMeditate(),
      breakthrough: () => this.breakthrough(),
    });
    this.installTestHooks();
    this.warmUp();
    audio.startMusic();
    this.maybeShowStory();
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
    // integer zoom keeps pixels even: 3 at 720p, 4 at 1080p
    this.cameras.main.setZoom(Phaser.Math.Clamp(Math.floor(this.scale.height / 225), 2, 5));
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
    // never persist a dead hero: quitting from the death screen respawns you at the village with full vitals
    const snapshot: GameState = this.dead || this.gs.hp <= 0 ? { ...this.gs, hp: this.pc.maxHp, mana: this.pc.maxMana, pos: { ...this.world.spawn } } : this.gs;
    const ok = saveGame(snapshot);
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
      if (Object.values(w.npcs).some((n) => Math.hypot(p.x - n.x, p.y - n.y) < 240)) continue; // never next to a shopkeeper
      if (Object.values(w.bossHomes).some((h) => Math.hypot(p.x - h.x, p.y - h.y) < 170)) continue; // boss courts stay clear of wanderers
      if (Math.hypot(p.x - w.portal.x, p.y - w.portal.y) < 90) continue;
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

  private spawnEnemy(type: string, pos: Vec2, minion = false, zone: ZoneId = 'bamboo', forceElite?: boolean): Enemy | null {
    const def = ENEMIES[type];
    if (!def) return null;
    const elite = forceElite ?? (!minion && this.rng() < 0.09);
    const sc = scaledEnemy(def, zone, elite);
    const c: Combatant = { hp: sc.maxHp, maxHp: sc.maxHp, mana: 0, maxMana: 0, atk: sc.atk, def: sc.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const prefix = elite && def.eliteSprites?.length ? def.eliteSprites[Math.floor(this.rng() * def.eliteSprites.length)]! : def.sprite;
    const actor = new Actor(this, prefix, pos.x, pos.y, def.scale * (elite ? 1.18 : 1), def.radius * 3);
    actor.setPos(pos.x, pos.y);
    if (def.tint !== undefined && prefix === def.sprite) actor.setBaseTint(def.tint);
    const e: Enemy = { id: this.nextId++, def, c, ai: newEnemyAI(), pos: { ...pos }, actor, kb: { x: 0, y: 0 }, stun: 0, lockUntil: 0, minion, elite, zone, vel: { x: 0, y: 0 }, home: { ...pos }, stuckT: 0, stuckPos: { ...pos }, detour: null, stuckCount: 0, lastDetourEnd: -9, burn: null, slow: 0, shield: 0, affix: null, label: null, alertUntil: 0, sees: false };
    { const a = this.rng() * Math.PI * 2; e.ai.facing = { x: Math.cos(a), y: Math.sin(a) }; }
    if (elite) {
      const affixes: Affix[] = ['swift', 'vampiric', 'explosive', 'shielded'];
      e.affix = affixes[Math.floor(this.rng() * affixes.length)]!;
      if (e.affix === 'shielded') e.shield = Math.round(sc.maxHp * 0.3);
      e.label = this.add.text(pos.x, pos.y, `${AFFIX_NAME[e.affix]} ${def.name}`, { color: '#ffd96a', fontSize: '7px', fontStyle: 'bold', fontFamily: 'Georgia, serif', stroke: '#1a0f00', strokeThickness: 2 }).setOrigin(0.5).setDepth(1e5);
    }
    this.enemies.push(e);
    return e;
  }

  private spawnBoss(def: BossDef): void {
    const c: Combatant = { hp: def.maxHp, maxHp: def.maxHp, mana: 0, maxMana: 0, atk: def.atk, def: def.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const pos = { ...this.world.bossHomes[def.id]! };
    const actor = new Actor(this, def.sprite, pos.x, pos.y, def.scale, 56);
    if (def.tint !== undefined) actor.setBaseTint(def.tint);
    actor.setPos(pos.x, pos.y);
    this.bosses.push({ burn: null, slow: 0, rainTele: null, charge: null, slams: 0, def, c, ai: newBossAI(), pos, actor, engaged: false, tele: null, lockUntil: 0, kb: { x: 0, y: 0 } });
  }

  // ---------- input actions ----------
  private digit(i: number): void {
    if (isDialogueOpen()) { document.querySelector<HTMLButtonElement>(`#dlg button[data-opt="${i}"]`)?.click(); return; }
    this.castSkill(i);
  }

  private escape(): void {
    if (isBoonPickerOpen()) return;
    if (isWorldMapOpen()) { closeWorldMap(); return; }
    if (isTradeOpen()) { closeTrade(); this.uiPause = false; return; }
    if (isDialogueOpen()) { showDialogue(null, () => undefined); this.uiPause = false; return; }
    if (isPanelOpen('inv') || isPanelOpen('chr') || isPanelOpen('qlog')) { closePanels(); return; }
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
    const res = this.mutate(() => tryBreakthrough(this.gs, this.roll));
    if (!res.ok) {
      const need = nextRealmLevel(this.gs.cultivation);
      toast(res.reason === 'no-pill' ? 'You need a Foundation Pill to attempt a breakthrough (brew one with Alchemist Yun).'
        : res.reason === 'level' ? `Your foundation is too shallow: reach level ${need} first.`
        : res.reason === 'max-realm' ? 'You have reached the highest realm available in this build.'
        : 'Your qi is not full enough to break through.', 2800);
      return;
    }
    this.meditating = false;
    if (res.success) {
      this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; });
      refillFlask(this.gs.flask);
      toast(`Breakthrough! You reach ${REALMS[this.gs.cultivation.realm]!.name}. (+2 skill points)`, 3600); audio.sfx('breakthrough');
      this.fx.play('xf_ascend', this.pos.x, this.pos.y, { scale: 0.55, tint: COLORS.gold });
      this.fx.play('xf_taiji', this.pos.x, this.pos.y - 14, { scale: 0.4, tint: COLORS.gold });
      this.fx.ring(this.pos.x, this.pos.y, 70, COLORS.gold, 600);
      this.fx.shake(250, 0.004);
      this.save(false);
    } else {
      const back = Math.min(this.pc.hp - 1, Math.floor(this.pc.maxHp * BACKLASH));
      this.pc.hp -= Math.max(0, back); this.floatText(this.pos, String(Math.max(0, back)), '#ff6b6b', true, 11);
      toast('The breakthrough fails — qi backlash! The pill is lost, half your qi scatters and you are wounded.', 3600); audio.sfx('fail');
      this.fx.play('xf_mirror_shatter', this.pos.x, this.pos.y - 14, { scale: 0.3, tint: COLORS.hurt });
    }
  }

  /** F: the spirit flask first (percentage heal, refills over time), then a Vitality Draught from the bag. */
  private useFlaskOrPotion(): void {
    if (this.uiPause || this.dead) return;
    if (this.now < this.potionReadyAt) { toast('Draughts are still settling…', 1000); return; }
    const heal = this.mutate(() => useFlask(this.gs.flask, this.pc.hp, this.pc.maxHp, boonMods(this.gs).flaskHeal));
    if (heal === null) { this.quickUse('hp-potion'); return; }
    this.mutate(() => { this.gs.hp = Math.min(this.pc.maxHp, this.pc.hp + heal); });
    this.potionReadyAt = this.now + POTION_COOLDOWN;
    toast(`Spirit flask: +${heal} HP (${this.gs.flask.charges}/${FLASK_MAX} left)`, 1400); audio.sfx('potion');
    this.fx.play('xf_pill_light', this.pos.x, this.pos.y - 14, { scale: 0.22, tint: COLORS.heal });
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
    if (def.type === 'material') { toast(`${def.name}: used when you attempt a breakthrough (B).`, 2200); return; }
    if (def.type !== 'consumable') { toast(`${def.name} cannot be used.`, 1200); return; }
    const st = statsOf(this.gs);
    if (def.heal && !def.mana && !def.qi && this.pc.hp >= st.maxHp) { toast('HP is already full.', 1200); return; }
    if (def.mana && !def.heal && !def.qi && this.pc.mana >= st.maxMana) { toast('Mana is already full.', 1200); return; }
    const draught = !!(def.heal || def.mana);
    if (draught && this.now < this.potionReadyAt) { toast('Draughts are still settling…', 1000); return; }
    this.mutate(() => useItemSlot(this.gs, i));
    if (draught) this.potionReadyAt = this.now + POTION_COOLDOWN;
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
    if (npc) { this.meditating = false; this.gs.tut |= 8; this.openDialogue(npc.id); return; }
    const herb = this.nearestHerb();
    if (herb) { this.gather(herb); return; }
    if (Math.hypot(this.pos.x - this.world.portal.x, this.pos.y - this.world.portal.y) < PORTAL_RANGE) this.useGate();
  }

  /** Chapter gate: forward to the next chapter (needs its gate conditions) or back to the previous one. */
  private useGate(): void {
    const target = this.chapter === 1 ? 2 : this.chapter - 1;
    if (!CHAPTERS[target]) { toast('The gate is sealed. More of the story is yet to be written.', 3000); return; }
    if (target > this.chapter) {
      const gate = canEnterChapter(target, this.gs.progress.level, this.gs.bosses);
      if (!gate.ok) { toast(gate.reason, 4200); audio.sfx('fail'); return; }
    }
    this.travelTo(target);
  }

  private travelTo(n: number): void {
    if (this.traveling || !CHAPTERS[n]) return;
    this.traveling = true;
    this.pushToState();
    this.gs.chapter = n;
    this.gs.pos = { ...generateChapter(n, WORLD_SEED).spawn };
    this.gs.hp = Math.max(1, this.pc.hp);
    saveGame(this.gs);
    toast(`${CHAPTERS[n]!.subtitle}: ${CHAPTERS[n]!.name}`, 2600);
    this.scene.restart({ state: this.gs, host: this.host });
  }

  /** First arrival in a chapter: story pages, once. */
  private maybeShowStory(): void {
    if (this.gs.story.includes(this.chapter)) return;
    const c = CHAPTERS[this.chapter]!;
    this.uiPause = true;
    showStory({ subtitle: c.subtitle, title: c.name, pages: c.story, onDone: () => { this.uiPause = false; this.gs.story.push(this.chapter); this.save(false); } });
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
    const npcDef = NPCS[npcId]!;
    const d = getDialogue(npcId, this.gs.quests, this.gs.inventory, this.gs.bosses, { best: this.gs.towerBest, active: !!this.tower });
    if (npcDef.trade && npcDef.trade !== 'tower' && !d.quest) { this.openTrade(npcDef.trade, npcId); return; } // nothing to discuss: straight to the shop
    this.uiPause = true;
    showDialogue(d, (a) => {
      if (a.type === 'close') { showDialogue(null, () => undefined); this.uiPause = false; return; }
      if (a.type === 'trade') { showDialogue(null, () => undefined); this.openTrade(npcDef.trade as 'shop' | 'outpost' | 'alchemy', npcId); return; }
      if (a.type === 'tower') { showDialogue(null, () => undefined); this.uiPause = false; if (a.start) this.startTower(); else this.endTower('left'); return; }
      if (a.type === 'accept') {
        if (acceptQuest(this.gs.quests, a.questId)) toast(`Quest accepted: ${QUESTS[a.questId]!.name}`, 2600);
        showDialogue(null, () => undefined); this.uiPause = false; return;
      }
      const r = this.mutate(() => turnInQuest(this.gs, a.questId));
      if (r.ok) {
        const q = QUESTS[a.questId]!;
        toast(`Quest complete: ${q.name} (+${q.reward.xp} XP${q.reward.stones ? `, +${q.reward.stones} stones` : ''})`, 3200);
        if (r.levelsGained > 0) this.levelUpFx();
        this.save(false);
        this.openDialogue(npcId); // chain: next quest offer or farewell
      } else {
        toast(r.reason === 'inventory-full' ? 'Your inventory is too full for the reward.' : 'The quest is not complete.', 2600);
      }
    });
  }

  private openTrade(kind: 'shop' | 'outpost' | 'alchemy', npcId: string): void {
    this.uiPause = true;
    const refresh = () => renderTrade(this.gs);
    const close = () => { closeTrade(); this.uiPause = false; };
    const who = NPCS[npcId]!;
    showTrade(kind, this.gs, { name: who.name, portrait: who.portrait, blurb: who.blurb ?? '' }, {
      close,
      buy: (id) => {
        const r = this.mutate(() => buy(this.gs, id, 1, kind === 'outpost' ? 'outpost' : 'sect'));
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
    this.gs.tut |= 2;
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
      if (any) this.pc.mana = Math.min(this.pc.maxMana, this.pc.mana + manaOnSwing(finisher) + boonMods(this.gs).manaOnHit); // landing blows feeds the techniques
    });
  }

  /** Khinh cong: a quick dodge with brief invulnerability. */
  private dash(): void {
    if (this.uiPause || this.dead) return;
    if (!tryDash(this.dashState, this.now, boonMods(this.gs).dashCdMult)) return;
    this.gs.tut |= 4;
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
    const sc = scaledSkill(sk, skillLevel(this.gs, sk.id));
    if (!tryCast(this.pc, this.cds, { id: sk.id, manaCost: sk.manaCost, cooldown: sc.cooldown }, this.now).ok) return;
    this.meditating = false;
    const dir = this.aimDir(aim);
    this.player.face(dir.x < 0 ? -1 : 1);
    this.facing = dir;
    this.playerLockUntil = this.now + 0.38;
    this.playerLockAnim = 'cast';
    this.player.play('cast', { force: true, duration: 0.42 });
    audio.sfx('cast');
    this.schedule(0.16, () => this.releaseSkill(sk, dir, sc, aim));
  }

  private releaseSkill(sk: SkillDef, dir: Vec2, sc: ScaledSkill, aim?: Vec2): void {
    const ox = this.pos.x + dir.x * 10, oy = this.pos.y - 12 + dir.y * 6;
    const color = this.heroColor;
    audio.sfx(sk.shape === 'projectile' ? 'sword' : sk.shape === 'wave' ? 'moon' : sk.shape === 'burst' ? 'lotus' : 'rain');
    if (sk.shape === 'projectile') {
      const sprite = this.fx.play(sk.fx.replace('fx.', ''), ox, oy, { scale: 0.2, rot: Math.atan2(dir.y, dir.x), tint: color, loop: true, depth: 1e4 });
      this.addBolt({ kind: 'sword', pos: { x: ox, y: oy + 12 }, vel: { x: dir.x * (sk.speed ?? 300), y: dir.y * (sk.speed ?? 300) }, max: sk.range, damage: sc.damageMult, pierce: sk.pierce ?? 1, radius: 7, sprite, color });
    } else if (sk.shape === 'wave') {
      const sprite = this.fx.play(sk.fx, ox, oy, { scale: 0.34, rot: Math.atan2(dir.y, dir.x), tint: color, loop: true, depth: 1e4, speed: 1.4 });
      this.addBolt({ kind: 'wave', pos: { x: ox, y: oy + 12 }, vel: { x: dir.x * (sk.speed ?? 220), y: dir.y * (sk.speed ?? 220) }, max: sk.range, damage: sc.damageMult, pierce: 99, radius: 16, sprite, color });
      this.fx.shake(90, 0.002);
    } else if (sk.shape === 'burst') {
      this.fx.play(sk.fx, this.pos.x, this.pos.y + 4, { scale: 0.5, tint: color });
      this.fx.ring(this.pos.x, this.pos.y, sk.range, color, 380);
      this.fx.shake(150, 0.0045);
      let any = false;
      for (const t of this.targets()) {
        if (inCircle(this.pos, sk.range, t.pos, t.radius)) { t.hit(sc.damageMult, { kb: 130, stun: sc.stun, from: this.pos }); any = true; }
      }
      if (any) this.hitStop(60);
    } else {
      let target = aim ? { ...aim } : this.hasPointer ? { ...this.aimWorld } : { x: this.pos.x + dir.x * 90, y: this.pos.y + dir.y * 90 };
      const dx = target.x - this.pos.x, dy = target.y - this.pos.y, d = Math.hypot(dx, dy);
      if (d > 220) target = { x: this.pos.x + (dx / d) * 220, y: this.pos.y + (dy / d) * 220 };
      const tele = this.add.image(target.x, target.y, 'ring').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setDisplaySize(sk.range * 2, sk.range * 2).setAlpha(0.65);
      this.rains.push({ pos: target, left: sk.ticks ?? 4, every: 0.28, timer: 0.5, mult: sc.damageMult, radius: sk.range, tele });
      for (let i = 0; i < 9; i++) { // a proper rain: many swords falling across the whole area, staggered
        const a = this.rng() * Math.PI * 2, rr = Math.sqrt(this.rng()) * sk.range * 0.8;
        const px = target.x + Math.cos(a) * rr, py = target.y + Math.sin(a) * rr;
        this.time.delayedCall(i * 70, () => this.fx.play(sk.fx, px, py + 4, { scale: 0.3, tint: color, speed: 1.1, depth: py + 3 }));
      }
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
    const ambush = !o.dot && e.ai.state === 'idle' && !e.minion && this.now >= e.alertUntil; // struck while unaware
    const r = computeDamage(this.pc, e.c, (ambush ? mult * AMBUSH_MULT : mult) * this.dodgeBuff(), this.rng);
    if (ambush) this.floatText(e.pos, 'Ambush!', '#ffd23f', false, 8);
    let amount = r.amount;
    if (e.shield > 0) { const ab = Math.min(e.shield, amount); e.shield -= ab; amount -= ab; if (e.shield <= 0) this.floatText(e.pos, 'Ward broken', '#9fd8ff', false, 8); }
    this.lastCombat = this.now;
    const killed = amount > 0 ? applyDamage(e.c, amount) : false;
    if (!o.dot) this.leech(r.amount);
    this.floatText(e.pos, String(r.amount), e.shield > 0 ? '#9fd8ff' : r.crit ? '#ffd23f' : '#ffffff', r.crit);
    audio.sfx(r.crit ? 'crit' : 'hit');
    if (!o.dot && !killed) this.rootEffect(e, null, r.amount);
    e.actor.flash(55);
    this.fx.burst(e.pos.x, e.pos.y - 10, r.crit ? COLORS.gold : this.heroColor, r.crit ? 14 : 8);
    this.fx.play('xf_ink_splash', e.pos.x, e.pos.y - 10, { scale: r.crit ? 0.11 : 0.07, tint: r.crit ? COLORS.gold : COLORS.white, alpha: 0.7 });
    if (r.crit) this.hitStop(55);
    this.alertEnemy(e); // being struck (even from behind) makes it turn and hunt you
    const from = o.from ?? this.pos;
    if (o.kb) e.kb = impulse({ x: e.pos.x - from.x, y: e.pos.y - from.y }, o.kb * (e.def.maxHp > 100 ? 0.4 : 1));
    if (o.stun) e.stun = Math.max(e.stun, o.stun);
    else if (!killed) { e.stun = Math.max(e.stun, e.def.maxHp > 100 ? 0.08 : 0.2); }
    if (!killed) { e.actor.play('hurt', { force: true }); e.lockUntil = this.now + 0.22; return; }
    this.killEnemy(e);
  }

  private autoBoonOff(): boolean {
    try { if (new URLSearchParams(location.search).get('boons') === '1') return false; return navigator.webdriver === true; } catch { return false; }
  }
  private dodgeBuff(): number { return this.now < this.perfectUntil ? PERFECT_DAMAGE : 1; }
  private leech(dealt: number): void {
    const ls = boonMods(this.gs).lifesteal;
    if (ls > 0 && this.pc.hp > 0) this.pc.hp = Math.min(this.pc.maxHp, this.pc.hp + dealt * ls);
  }
  /** Poise: enough punishment in a short time staggers a boss out of its move and exposes it to extra damage. */
  private poiseHit(b: BossEnt, dealt: number): void {
    if (!addPoise(b.ai, b.def, dealt, 1 + boonMods(this.gs).poiseMult)) return;
    b.tele?.destroy(); b.tele = null; b.rainTele?.destroy(); b.rainTele = null;
    b.actor.play('hurt', { force: true, duration: 0.5 }); b.lockUntil = this.now + 0.5;
    this.floatText({ x: b.pos.x, y: b.pos.y - 40 }, 'Staggered!', '#9fe8ff', true, 12);
    this.fx.ring(b.pos.x, b.pos.y, 70, 0x9fe8ff, 500); this.fx.shake(160, 0.004); this.hitStop(90); audio.sfx('crit');
  }

  // ---------- Trial Rift ----------
  private startTower(): void {
    if (this.tower || this.dead) return;
    this.tower = newRun(); this.towerOrigin = { ...this.pos };
    toast('The Trial Rift opens. Clear each floor to descend; falling or wandering off ends the run.', 3600); audio.sfx('roar');
    this.fx.ring(this.pos.x, this.pos.y, 90, COLORS.gold, 700);
  }
  private endTower(why: 'left' | 'fallen' | 'strayed'): void {
    if (!this.tower) return;
    const reached = this.tower.floor - (this.tower.phase === 'break' ? 1 : 0);
    for (const e of this.enemies.filter((x) => x.tower)) { e.label?.destroy(); e.actor.destroy(); }
    this.enemies = this.enemies.filter((x) => !x.tower);
    this.tower = null;
    toast(why === 'fallen' ? `The Rift swallows you on floor ${reached + 1}. Best: ${this.gs.towerBest}.` : `You leave the Rift (floors cleared: ${reached}). Best: ${this.gs.towerBest}.`, 3600);
  }
  private spawnFloor(plan: FloorPlan): void {
    const o = this.towerOrigin;
    for (const fe of plan.enemies) {
      let p: Vec2 | null = null;
      for (let i = 0; i < 24 && !p; i++) {
        const a = this.rng() * Math.PI * 2, d = 90 + this.rng() * 90, q = { x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d };
        if (!isBlockedTile(this.world, Math.floor(q.x / TILE_SIZE), Math.floor(q.y / TILE_SIZE))) p = q;
      }
      const e = this.spawnEnemy(fe.type, p ?? { x: o.x + 70, y: o.y }, false, plan.zone, fe.elite);
      if (!e) continue;
      e.tower = true;
      const hp = Math.round(e.c.maxHp * plan.hpMult * (plan.guardian && fe === plan.enemies[0] ? 1.6 : 1));
      e.c.maxHp = hp; e.c.hp = hp; e.c.atk = Math.round(e.c.atk * plan.atkMult);
      if (e.affix === 'shielded') e.shield = Math.round(hp * 0.3);
      this.alertEnemy(e, false);
    }
    toast(plan.guardian ? `Floor ${plan.floor}: a guardian awaits!` : `Floor ${plan.floor}`, 2200); audio.sfx(plan.guardian ? 'roar' : 'click');
  }
  private towerClear(floor: number, r: FloorReward): void {
    this.mutate(() => {
      if (r.record) this.gs.towerBest = floor;
      this.gs.stones += r.stones; this.gs.boonPicks += r.boonPick ? 1 : 0;
      for (const it of r.items) addItem(this.gs.inventory, it.id, it.count);
      const s = statsOf(this.gs);
      this.gs.hp = Math.min(s.maxHp, this.gs.hp + Math.round(s.maxHp * 0.2)); this.gs.mana = s.maxMana;
      if (floor % 5 === 0) refillFlask(this.gs.flask);
    });
    const parts = [r.record ? `New depth! +${r.stones} ◆` : 'Floor cleared', ...r.items.map((i) => `${ITEMS[i.id]!.name} x${i.count}`), ...(r.boonPick ? ['a boon pick'] : [])];
    toast(`Floor ${floor} clear: ${parts.join(' · ')}`, 3200); audio.sfx(r.record ? 'levelup' : 'pickup');
    this.fx.ring(this.pos.x, this.pos.y, 60, COLORS.gold, 500);
    if (r.record) this.save(false);
  }
  private updateTowerRun(dt: number): void {
    const run = this.tower;
    if (!run) return;
    if (Math.hypot(this.pos.x - this.towerOrigin.x, this.pos.y - this.towerOrigin.y) > LEASH) { this.endTower('strayed'); return; }
    const alive = this.enemies.filter((e) => e.tower && e.c.hp > 0).length;
    for (const ev of updateTower(run, this.gs.towerBest, alive, dt, this.rng)) {
      if (ev.type === 'spawn') this.spawnFloor(ev.plan); else this.towerClear(ev.floor, ev.reward);
    }
  }

  /** Offers the next banked boon pick (not mid-fight; automation skips it unless `force`). */
  private offerBoon(force = false): void {
    if (this.uiPause || this.dead || isBoonPickerOpen() || this.gs.boonPicks < 1) return;
    this.uiPause = true;
    const choices = boonChoices(this.gs);
    if (!choices.length) { this.gs.boonPicks = 0; this.uiPause = false; return; }
    showBoonPicker(choices, this.gs.boonPicks, (id) => {
      this.mutate(() => takeBoon(this.gs, id, choices));
      this.uiPause = false;
      toast(`Boon gained: ${BOONS[id]!.name}`, 2600); audio.sfx('levelup');
      this.fx.play('xf_ascend', this.pos.x, this.pos.y, { scale: 0.35, tint: COLORS.gold });
      this.save(false); refreshPanels(this.gs, this.meditating);
      this.boonCheckAt = this.now + (force ? 9e9 : 1);
    });
  }

  /** Spirit-root passives: Flame burns, Tide slows, Verdant drains life. */
  private rootEffect(e: Enemy | null, b: BossEnt | null, dealt: number): void {
    const root = this.gs.character.root;
    if (root === 'flame') {
      const burn = { t: 3, dps: Math.max(1, (dealt * 0.35) / 3), tick: 0.5 };
      if (e) e.burn = burn; else if (b) b.burn = burn;
    } else if (root === 'tide') {
      if (e) e.slow = Math.max(e.slow, 2.4); else if (b) b.slow = Math.max(b.slow, 1.2);
      this.pc.mana = Math.min(this.pc.maxMana, this.pc.mana + 1.5); // tide: qi flows back with every strike
    } else if (this.pc.hp > 0 && this.pc.hp < this.pc.maxHp) {
      const heal = Math.max(1, Math.round(dealt * 0.09));
      this.pc.hp = Math.min(this.pc.maxHp, this.pc.hp + heal);
      if (Math.random() < 0.35) this.floatText(this.pos, `+${heal}`, '#7dffb0', false, 8);
    }
  }

  private tickBurn(target: { burn: { t: number; dps: number; tick: number } | null; pos: Vec2; c: Combatant }, dt: number, kill: () => void): void {
    const bn = target.burn; if (!bn) return;
    bn.t -= dt; bn.tick -= dt;
    if (bn.tick <= 0) {
      bn.tick = 0.5; const d = Math.max(1, Math.round(bn.dps * 0.5));
      this.floatText({ x: target.pos.x, y: target.pos.y + 4 }, String(d), '#ff9a4a', false, 7);
      this.fx.burst(target.pos.x, target.pos.y - 8, 0xff7a2a, 2);
      if (applyDamage(target.c, d)) { kill(); return; }
    }
    if (bn.t <= 0) target.burn = null;
  }

  /** Volatile elites explode when they die: a short telegraph, then area damage. */
  private volatileBlast(at: Vec2, atk: number): void {
    const r = 46, g = this.add.graphics().setDepth(5);
    g.fillStyle(0xff7a2a, 0.22).lineStyle(2, 0xffa24a, 0.9).fillCircle(at.x, at.y, r).strokeCircle(at.x, at.y, r);
    this.schedule(0.8, () => {
      g.destroy(); this.fx.ring(at.x, at.y, r, 0xff8a3a, 360); this.fx.burst(at.x, at.y, 0xff8a3a, 20); this.fx.shake(150, 0.005); audio.sfx('slam');
      if (!this.dead && inCircle(at, r, this.pos, PLAYER_RADIUS)) this.hurtPlayer(atk * 1.3, at);
    });
  }

  private killEnemy(e: Enemy): void {
    this.enemies = this.enemies.filter((x) => x !== e);
    e.label?.destroy();
    if (e.affix === 'explosive') this.volatileBlast(e.pos, e.c.atk);
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
    this.lastCombat = this.now;
    const r = computeDamage(this.pc, b.c, mult * this.dodgeBuff() * (b.ai.state === 'stagger' ? STAGGER_DAMAGE : 1), this.rng);
    const killed = applyDamage(b.c, r.amount);
    if (!o.dot) this.leech(r.amount);
    if (!o.dot && !killed) this.poiseHit(b, r.amount);
    this.floatText(b.pos, String(r.amount), r.crit ? '#ffd23f' : '#ffffff', r.crit);
    if (!o.dot && !killed) this.rootEffect(null, b, r.amount);
    audio.sfx(r.crit ? 'crit' : 'hit');
    b.actor.flash(50);
    this.fx.burst(b.pos.x, b.pos.y - 22, r.crit ? COLORS.gold : this.heroColor, 10);
    if (o.kb && !killed) b.kb = impulse({ x: b.pos.x - (o.from ?? this.pos).x, y: b.pos.y - (o.from ?? this.pos).y }, o.kb * 0.15);
    if (!killed) return;
    b.tele?.destroy();
    this.bosses = this.bosses.filter((x) => x !== b);
    for (const m of this.enemies.filter((x) => x.minion && x.zone === b.def.zone)) m.actor.destroy();
    this.enemies = this.enemies.filter((x) => !(x.minion && x.zone === b.def.zone));
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
    this.lastCombat = this.now;
    if (isInvulnerable(this.dashState, this.now) || this.now < this.hurtInvulnUntil) {
      if (isInvulnerable(this.dashState, this.now) && perfectReady(this.lastPerfect, this.now)) this.perfectDodge();
      else if (isInvulnerable(this.dashState, this.now) && this.now - this.lastDodgeText > 0.4) { this.lastDodgeText = this.now; this.floatText(this.pos, 'Dodge', '#bfe9ff', false, 9); }
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
  private perfectDodge(): void {
    const m = boonMods(this.gs);
    this.lastPerfect = this.now; this.lastDodgeText = this.now;
    this.pc.mana = Math.min(this.pc.maxMana, this.pc.mana + PERFECT_MANA + m.perfectMana);
    this.perfectUntil = this.now + PERFECT_BUFF_TIME + m.perfectTime;
    this.slowUntil = this.time.now + PERFECT_SLOWMO * 1000;
    this.floatText({ x: this.pos.x, y: this.pos.y - 14 }, 'Perfect!', '#ffe27a', true, 11);
    this.fx.ring(this.pos.x, this.pos.y, 44, 0xffe27a, 380); audio.sfx('crit');
  }
  private lastDodgeText = -9;
  private tower: TowerRun | null = null;
  private towerOrigin: Vec2 = { x: 0, y: 0 };
  private lastPerfect = -9;
  private perfectUntil = 0;
  private slowUntil = 0;
  private boonCheckAt = 0;
  private lastCombat = -99;

  private die(): void {
    this.endTower('fallen');
    this.dead = true; this.meditating = false; audio.sfx('death');
    const lost = deathTax(this.gs.stones); this.gs.stones -= lost;
    showDeath(true, lost > 0 ? `You lose ${lost} spirit stones. Nothing else is lost: gather yourself and try again.` : 'Gather yourself and try again.', { respawn: () => this.respawn(), menu: () => { this.save(false); hideScreen(); this.host.quitToMenu(); } });
    this.player.play('death', { force: true });
    this.fx.shake(300, 0.005);
    this.save(false);
  }

  private respawn(): void {
    showDeath(false);
    this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; this.gs.pos = { ...this.world.spawn }; refillFlask(this.gs.flask); });
    this.scene.restart({ state: this.gs, host: this.host });
  }

  private floatText(at: Vec2, text: string, color: string, big = false, size = 10): void {
    const t = this.add.text(at.x + (Math.random() - 0.5) * 8, at.y - 22, text, { color, fontSize: `${big ? size + 6 : size + 1}px`, fontStyle: 'bold', fontFamily: 'Georgia, serif', stroke: '#14091f', strokeThickness: 3 }).setOrigin(0.5).setDepth(1e6);
    this.tweens.add({ targets: t, y: t.y - (big ? 26 : 18), alpha: 0, scale: big ? 1.25 : 1, duration: big ? 900 : 700, ease: 'cubic.out', onComplete: () => t.destroy() });
  }

  // ---------- frame update ----------
  update(_t: number, deltaMs: number): void {
    this.kb.pollGamepads();
    if (this.hitStopUntil > 0 && this.time.now >= this.hitStopUntil) { this.hitStopUntil = 0; this.anims.globalTimeScale = 1; }
    const stopped = this.hitStopUntil > 0;
    const dt = Math.min(deltaMs, 50) / 1000 * (this.time.now < this.slowUntil ? 0.4 : 1);
    if (this.hasPointer) { const p = this.input.activePointer; this.aimWorld = { x: p.worldX, y: p.worldY }; }

    if (!this.uiPause && !stopped) this.simulate(dt);
    this.player.setPos(this.pos.x, this.pos.y);
    this.camTarget.setPosition(this.pos.x, this.pos.y - 10);
    this.drawOverlays();

    const zone = zoneAt(this.world, this.pos);
    if (zone !== this.currentZone) this.currentZone = zone;
    if (this.lastZoneBanner !== zone) { this.lastZoneBanner = zone; if (zone === CHAPTERS[this.chapter]!.hub && this.gs.flask.charges < FLASK_MAX) { refillFlask(this.gs.flask); toast('Spirit flask refilled.', 1600); } if (!this.dead && !this.bosses.some((b) => b.engaged)) showZoneBanner(ZONES[zone].name, ZONES[zone].level); setMinimapZone(ZONES[zone].name, ZONES[zone].level); }
    this.ambient.update(dt, zone);
    const mood: Mood = this.bosses.some((b) => b.engaged) ? 'boss' : zone === 'marsh' ? 'mist' : zone === 'ruins' || zone === 'lair' || zone === 'barrow' || zone === 'summit' || this.enemies.some((e) => e.ai.state !== 'idle' && !e.minion) ? 'danger' : 'calm';
    audio.setMood(mood); audio.setZone(zone);
    updateOccluders(this.occluders, [{ x: this.pos.x, y: this.pos.y }, ...this.enemies.map((e) => e.pos), ...this.bosses.flatMap((b) => [b.pos, { x: b.pos.x, y: b.pos.y - 26 }, { x: b.pos.x - 26, y: b.pos.y - 10 }, { x: b.pos.x + 26, y: b.pos.y - 10 }])], dt);

    const npc = this.nearestNpc(), herb = this.nearestHerb();
    const nearPortal = !npc && Math.hypot(this.pos.x - this.world.portal.x, this.pos.y - this.world.portal.y) < PORTAL_RANGE;
    const nearArray = Math.hypot(this.pos.x - this.world.arrayPos.x, this.pos.y - this.world.arrayPos.y) < ARRAY_RADIUS;
    const prompt = this.dead ? null // the death screen already offers respawn
      : this.uiPause ? null
      : npc ? `Press E to talk to ${NPCS[npc.id]!.name}`
      : nearPortal ? (this.chapter === 1 ? 'Press E: step through the Sky Gate to Chapter 2' : 'Press E: return through the gate to Chapter 1')
      : herb ? 'Press E to gather the Spirit Herb'
      : nearArray && !this.meditating ? 'Spirit array: press M to meditate (qi gathers faster here)' : null;
    setPrompt(prompt);
    for (const n of this.npcs) {
      n.actor.face(this.pos.x < n.pos.x ? -1 : 1);
      { const d = getDialogue(n.id, this.gs.quests, this.gs.inventory, this.gs.bosses); const a = d.options[0]!.action; n.mark.setVisible(d.quest && (a.type === 'accept' || a.type === 'turnin')); }
      n.mark.y = n.pos.y - 38 + Math.sin(this.time.now / 260) * 2;
      const hidden = this.underMinimap(n.pos.x, n.pos.y + 7) || this.underMinimap(n.pos.x, n.pos.y - 38); // DOM widgets draw over the canvas, so hide what would sit behind them
      n.plate.setVisible(!this.underMinimap(n.pos.x, n.pos.y + 7));
      if (hidden) n.mark.setVisible(false);
    }

    if (!(this.gs.tut & 1) && Math.hypot(this.pos.x - this.world.spawn.x, this.pos.y - this.world.spawn.y) > 36) this.gs.tut |= 1;
    const obj = this.dead ? { text: '', target: null } : this.objective();
    const mm = {
      player: this.pos, facing: this.facing, enemies: this.enemies.filter((e) => !e.minion).map((e) => ({ x: e.pos.x, y: e.pos.y, elite: e.elite })),
      bosses: this.bosses.map((b) => b.pos), npcs: this.npcs.map((n) => n.pos), herbs: this.herbs.filter((h) => h.alive), objective: obj.target,
    };
    updateMinimap(mm, dt);
    if (isWorldMapOpen()) updateWorldMap({ ...mm, zones: zonesOfChapter(this.chapter).map((zid) => ({ name: ZONES[zid].name, x: this.world.anchors[zid]!.x, y: this.world.anchors[zid]!.y })) });
    const cam = this.cameras.main;
    setObjectiveArrow(obj.target && !this.uiPause ? { sx: (obj.target.x - cam.worldView.x) * cam.zoom, sy: (obj.target.y - cam.worldView.y) * cam.zoom, dist: Math.hypot(obj.target.x - this.pos.x, obj.target.y - this.pos.y) } : null, this.scale.width, this.scale.height);
    this.pushToState();
    updateHud({
      gs: this.gs, maxHp: this.pc.maxHp, maxMana: this.pc.maxMana, meditating: this.meditating,
      cooldowns: SKILLS.map((s) => this.cds.remaining(s.id, this.now)),
      cooldownMax: SKILLS.map((s) => scaledSkill(s, skillLevel(this.gs, s.id)).cooldown), skillLevels: SKILLS.map((s) => skillLevel(this.gs, s.id)), freePoints: freePoints(this.gs),
      potionCd: Math.max(0, this.potionReadyAt - this.now), potionMax: POTION_COOLDOWN, objective: obj.text,
      comboStep: this.now - this.combo.lastAt <= COMBO_WINDOW ? this.combo.step + 1 : 0,
      dashCd: Math.max(0, this.dashState.readyAt - this.now), dashMax: DASH.cooldown, zone: ZONES[zone].name,
    });
    refreshPanels(this.gs, this.meditating);
  }

  /** What the player should do next, and where it is (drives the objective line, the edge arrow and the minimap ring). */
  private objective(): { text: string; target: Vec2 | null } {
    const gs = this.gs, elder = this.world.npcs['elder-lin'] ?? this.world.spawn;
    if (this.tower) { const left = this.enemies.filter((e) => e.tower && e.c.hp > 0).length; return { text: `Trial Rift · Floor ${this.tower.floor} · ${this.tower.phase === 'fight' ? `${left} foe${left === 1 ? '' : 's'} left` : 'get ready'} · best ${this.gs.towerBest}`, target: null }; }
    const chapterQuests = questsOfChapter(this.chapter);
    const activeQ = chapterQuests.find((q) => gs.quests[q.id]?.status === 'active');
    if (gs.tut < 15 && !activeQ) { // the tutorial yields as soon as there is a real quest to follow
      if (!(gs.tut & 1)) return { text: 'Walk around with WASD', target: null };
      if (!(gs.tut & 2)) return { text: 'Attack: click or press Space (chain three hits)', target: null };
      if (!(gs.tut & 4)) return { text: 'Dodge: press Shift to dash (you are invulnerable for a moment)', target: null };
      return { text: 'Talk to Elder Lin: walk to the glowing ! and press E', target: elder };
    }
    const pts = freePoints(gs) > 0 ? `  ·  ${freePoints(gs)} skill point${freePoints(gs) > 1 ? 's' : ''} to spend (C)` : '';
    const active = activeQ;
    if (!active) {
      const next = chapterQuests.find((q) => gs.quests[q.id]?.status === 'inactive' && (!q.requires || gs.quests[q.requires]?.status === 'turnedIn'));
      if (next) return { text: `Talk to ${NPCS[next.giver]!.name}: "${next.name}"${pts}`, target: this.world.npcs[next.giver] ?? elder };
      if (this.chapter < LAST_CHAPTER && canEnterChapter(this.chapter + 1, gs.progress.level, gs.bosses).ok) return { text: `The way onward is open: step through the Sky Gate${pts}`, target: this.world.portal };
      return { text: `Explore the realms, grow stronger, cultivate${pts}`, target: null };
    }
    const st = gs.quests[active.id]!;
    if (isComplete(active, st, gs.inventory, gs.bosses)) return { text: `Return to ${NPCS[active.giver]!.name} to claim your reward${pts}`, target: this.world.npcs[active.giver] ?? elder };
    const prog = progressOf(active, st, gs.inventory, gs.bosses), i = prog.findIndex((p) => p.have < p.need), o = active.objectives[i]!, p = prog[i]!;
    let target: Vec2 | null = null;
    if (o.type === 'kill') {
      const zone = zonesOfChapter(this.chapter).find((z) => o.target in ZONES[z].spawns);
      target = this.world.bossHomes[o.target] ?? (zone ? this.world.anchors[zone] : undefined) ?? this.world.spawn;
    } else if (o.type === 'elite') {
      let bd = Infinity; for (const e of this.enemies) { if (!e.elite || e.minion) continue; const d = Math.hypot(e.pos.x - this.pos.x, e.pos.y - this.pos.y); if (d < bd) { bd = d; target = { ...e.pos }; } }
    } else { let bd = Infinity; for (const h of this.herbs) { if (!h.alive) continue; const d = Math.hypot(h.x - this.pos.x, h.y - this.pos.y); if (d < bd) { bd = d; target = { x: h.x, y: h.y }; } } }
    return { text: `${p.label} ${p.have}/${p.need}${pts}`, target };
  }

  /** True when a world point lands behind the minimap widget (a DOM element drawn above the canvas). */
  private underMinimap(wx: number, wy: number): boolean {
    const mm = document.getElementById('minimap')?.getBoundingClientRect(), cv = this.game.canvas.getBoundingClientRect(), cam = this.cameras.main;
    if (!mm || !cv.width) return false;
    const k = cv.width / this.scale.width;
    const sx = cv.left + (wx - cam.worldView.x) * cam.zoom * k, sy = cv.top + (wy - cam.worldView.y) * cam.zoom * k;
    return sx > mm.left - 40 && sx < mm.right + 40 && sy > mm.top - 12 && sy < mm.bottom + 12;
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
    if (alive) this.updateTowerRun(dt);
    if (this.gs.boonPicks > 0 && alive && this.now >= this.boonCheckAt && this.now - this.lastCombat > 2.5 && !this.autoBoonOff()) this.offerBoon();
    this.respawnTimer += dt;
    if (this.respawnTimer >= RESPAWN_CHECK_SECONDS) { this.respawnTimer = 0; this.topUpEnemies(); }
  }

  private topUpEnemies(): void {
    for (const z of zonesOfChapter(this.chapter).map((zid) => ZONES[zid])) {
      for (const [type, n] of Object.entries(z.spawns)) {
        const alive = this.enemies.filter((e) => !e.minion && !e.tower && e.def.id === type && e.zone === z.id).length;
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
    if (!this.dead) {
      const nearArr = Math.hypot(this.pos.x - this.world.arrayPos.x, this.pos.y - this.world.arrayPos.y) < ARRAY_RADIUS;
      const heal = hpRegenPerSec(this.pc.maxHp, this.now - this.lastCombat, nearArr) * dt;
      if (heal > 0 && this.pc.hp < this.pc.maxHp) { this.pc.hp = Math.min(this.pc.maxHp, this.pc.hp + heal); this.pushToState(); }
    }
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
    if (this.autosaveTimer >= AUTOSAVE_SECONDS && !this.bosses.some((b) => b.engaged)) { this.autosaveTimer = 0; this.save(false); }
  }

  private updateEnemy(e: Enemy, target: Vec2, alive: boolean, dt: number): void {
    e.stun = Math.max(0, e.stun - dt); e.slow = Math.max(0, e.slow - dt);
    this.tickBurn(e, dt, () => { e.burn = null; this.killEnemy(e); });
    if (e.c.hp <= 0) return;
    // knockback applies even while stunned
    if (Math.hypot(e.kb.x, e.kb.y) > 0) {
      const kb = stepKnockback(e.kb, dt); e.kb = kb.vel;
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + kb.move.x, y: e.pos.y + kb.move.y }, e.def.radius);
    }
    let attack: { kind: 'melee' | 'projectile'; count?: number } | undefined;
    e.vel = { x: 0, y: 0 };
    const prevState = e.ai.state;
    if (e.stun <= 0) {
      const range = e.ai.state === 'idle' ? e.def.aggroRange : e.def.aggroRange * 1.5;
      e.sees = alive && (e.minion || this.now < e.alertUntil || canSee(e.pos, e.ai.facing, target, range, (x, y) => isBlockedTile(this.world, Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE))));
      const wasState = e.ai.state, wasLost = e.ai.lostT;
      const out = updateEnemyAI(e.ai, e.def, e.pos, target, dt, e.sees);
      if (wasState === 'idle' && e.ai.state === 'chase') this.floatText(e.pos, '!', '#ff5a4a', true, 13);
      else if (wasState === 'chase' && wasLost === 0 && e.ai.lostT > 0) this.floatText(e.pos, '?', '#ffd23f', true, 8);
      let vx = out.vel.x, vy = out.vel.y;
      attack = out.attack;
      if (e.ai.state === 'idle' && !e.minion) { // lost the target: walk home and recover, so luring enemies away cannot be exploited
        const hx = e.home.x - e.pos.x, hy = e.home.y - e.pos.y, hd = Math.hypot(hx, hy);
        if (hd > 6) { vx = (hx / hd) * e.def.speed * 0.7; vy = (hy / hd) * e.def.speed * 0.7; }
        if (e.c.hp < e.c.maxHp) e.c.hp = Math.min(e.c.maxHp, e.c.hp + e.c.maxHp * 0.08 * dt);
      }
      // stuck behind scenery? sidestep around it for a moment instead of grinding against it
      e.stuckT += dt;
      if (e.stuckT >= 0.4) {
        const moved = Math.hypot(e.pos.x - e.stuckPos.x, e.pos.y - e.stuckPos.y);
        if (e.ai.state === 'chase' && Math.hypot(vx, vy) > 8 && moved < 2.5) {
          // keep going around the SAME side for longer each time we get stuck again, choosing the side that actually gives way
          e.stuckCount = this.now - e.lastDetourEnd < 2.5 ? e.stuckCount + 1 : 0;
          const l = Math.hypot(vx, vy) || 1, px = -vy / l, py = vx / l;
          const probe = (sg: number) => { const q = moveWithCollision(this.world, e.pos, { x: e.pos.x + px * sg * 10, y: e.pos.y + py * sg * 10 }, e.def.radius); return Math.hypot(q.x - e.pos.x, q.y - e.pos.y); };
          const a = probe(1), b = probe(-1);
          const dur = Math.min(4.5, 1.2 + 0.9 * e.stuckCount);
          e.detour = { until: this.now + dur, sign: a > b + 0.5 ? 1 : b > a + 0.5 ? -1 : (e.detour?.sign ?? (this.rng() < 0.5 ? -1 : 1)) };
          e.lastDetourEnd = this.now + dur;
        }
        e.stuckPos = { ...e.pos }; e.stuckT = 0;
      }
      if (e.detour && this.now < e.detour.until && (e.ai.state === 'chase' || e.ai.state === 'retreat')) {
        const th = e.detour.sign * 1.4, c = Math.cos(th), sn = Math.sin(th);
        [vx, vy] = [vx * c - vy * sn, vx * sn + vy * c];
      }
      // soft separation so packs spread out instead of stacking into one sprite
      for (const o of this.enemies) {
        if (o === e) continue;
        const dx = e.pos.x - o.pos.x, dy = e.pos.y - o.pos.y, d = Math.hypot(dx, dy), min = (e.def.radius + o.def.radius) * 1.1;
        if (d < min) {
          const ux = d > 0.01 ? dx / d : Math.cos(e.id), uy = d > 0.01 ? dy / d : Math.sin(e.id);
          const push = ((min - d) / min) * e.def.speed * 1.6 + 6; vx += ux * push; vy += uy * push;
        }
      }
      const spd = (e.slow > 0 ? 0.62 : 1) * (e.affix === 'swift' ? 1.35 : 1); vx *= spd; vy *= spd;
      e.vel = { x: vx, y: vy };
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + vx * dt, y: e.pos.y + vy * dt }, e.def.radius);
    }
    const toPlayer = { x: this.pos.x - e.pos.x, y: this.pos.y - e.pos.y };
    const dist = Math.hypot(toPlayer.x, toPlayer.y);
    if (e.ai.state === 'strike' && prevState !== 'strike') { // melee telegraph: wind up the attack animation now, hit lands when the windup ends
      const w = e.def.strikeWindup ?? 0.3;
      e.actor.play('attack', { force: true, duration: w + 0.15 }); e.lockUntil = this.now + w + 0.15;
      this.fx.flare(e.pos.x, e.pos.y - 14, 0xff8a4a, 18, w * 1000);
    }
    if (attack?.kind === 'melee') {
      if (dist <= e.def.attackRange + e.def.radius + PLAYER_RADIUS + (e.def.behavior === 'charger' ? 8 : 4)) { const before = this.pc.hp; this.hurtPlayer(e.c.atk, e.pos); if (e.affix === 'vampiric' && this.pc.hp < before) e.c.hp = Math.min(e.c.maxHp, e.c.hp + (before - this.pc.hp) * 0.5); }
      if (e.def.behavior === 'charger') { e.actor.play('attack', { force: true, duration: 0.4 }); e.lockUntil = this.now + 0.4; }
    } else if (attack?.kind === 'projectile') {
      const n = attack.count ?? 1, base = Math.atan2(toPlayer.y, toPlayer.x);
      for (let i = 0; i < n; i++) {
        const ang = base + (n === 1 ? 0 : (i - (n - 1) / 2) * 0.22);
        this.addBolt({ kind: 'hostile', pos: { x: e.pos.x, y: e.pos.y - 14 }, vel: { x: Math.cos(ang) * 96, y: Math.sin(ang) * 96 }, max: 190, damage: e.c.atk, pierce: 1, radius: 5, sprite: null, color: e.elite ? COLORS.gold : COLORS.wisp });
      }
      e.actor.play('attack', { force: true, duration: 0.4 }); e.lockUntil = this.now + 0.4;
    }
    // animation + facing
    if (e.stun <= 0 && this.now >= e.lockUntil) {
      if (e.ai.state === 'windup') { if (e.actor.anim !== 'attack') e.actor.play('attack', { force: true, duration: e.def.windup ?? 0.6 }); }
      else if (Math.hypot(e.vel.x, e.vel.y) > 6) e.actor.play('move'); else e.actor.play('idle');
    } else if (e.stun > 0 && this.now >= e.lockUntil && e.actor.anim !== 'hurt') e.actor.play('hurt');
    this.turnEnemy(e, target, dt);
    if (Math.abs(e.ai.facing.x) > 0.2) e.actor.face(e.ai.facing.x < 0 ? -1 : 1);
    e.actor.setPos(e.pos.x, e.pos.y);
    if (e.label) { e.label.setPosition(e.pos.x, e.pos.y - e.def.scale * 92 - 12); e.label.setVisible(dist < 150); }
    if (e.ai.state === 'windup' || e.ai.state === 'strike') e.actor.tint(0xffb066); else if (e.elite) e.actor.tint(0xffe9a8); else e.actor.untint();
  }

  /** Wakes an enemy and points it at the player (hit from behind, ally shouted, etc.). */
  private alertEnemy(e: Enemy, shout = true): void {
    e.alertUntil = this.now + 2.5;
    e.ai.facing = normalize({ x: this.pos.x - e.pos.x, y: this.pos.y - e.pos.y });
    e.ai.lastSeen = { ...this.pos }; e.ai.lostT = 0; e.ai.leash = 2.6; // struck from afar: keep hunting well beyond the normal leash
    if (e.ai.state === 'idle') { e.ai.state = 'chase'; this.floatText(e.pos, '!', '#ff5a4a', true, 13); }
    if (!shout) return;
    for (const o of this.enemies) { // packmates within earshot join in
      if (o === e || o.minion || o.c.hp <= 0 || o.ai.state !== 'idle' || o.zone !== e.zone) continue;
      if (Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) <= PACK_ALERT_RADIUS) this.alertEnemy(o, false);
    }
  }

  /** Eyes follow what the enemy is doing: the target while it sees it, the last-seen spot while searching, its walking direction or a slow look-around while idle. */
  private turnEnemy(e: Enemy, target: Vec2, dt: number): void {
    const st = e.ai.state, rate = TURN_RATE * (e.affix === 'swift' ? 1.3 : 1);
    if (st === 'windup' || st === 'dash') { e.ai.facing = turnToward(e.ai.facing, e.ai.dir, rate * dt); return; }
    if (st === 'idle') {
      const moving = Math.hypot(e.vel.x, e.vel.y) > 6;
      const sway = (e.id * 2.3) + Math.sin(this.now * 0.55 + e.id) * 1.1;
      e.ai.facing = turnToward(e.ai.facing, moving ? normalize(e.vel) : { x: Math.cos(sway), y: Math.sin(sway) }, (moving ? rate : 1.2) * dt);
      return;
    }
    const goal = e.sees || !e.ai.lastSeen ? target : e.ai.lastSeen;
    e.ai.facing = turnToward(e.ai.facing, { x: goal.x - e.pos.x, y: goal.y - e.pos.y }, rate * dt);
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
      b.engaged = false; b.c.hp = b.c.maxHp; b.ai = newBossAI(); b.tele?.destroy(); b.tele = null; b.rainTele?.destroy(); b.rainTele = null; b.charge = null; b.actor.setAlpha(1);
      for (const m of this.enemies.filter((x) => x.minion)) m.actor.destroy();
      this.enemies = this.enemies.filter((x) => !x.minion);
      setBossBar(null);
    }
    let vel = { x: 0, y: 0 };
    b.slow = Math.max(0, b.slow - dt); this.tickBurn(b, dt, () => { b.burn = null; this.hitBoss(b, 0.0001, { dot: true }); });
    if (Math.hypot(b.kb.x, b.kb.y) > 0) { const kb = stepKnockback(b.kb, dt); b.kb = kb.vel; b.pos = moveWithCollision(this.world, b.pos, { x: b.pos.x + kb.move.x, y: b.pos.y + kb.move.y }, b.def.radius - 4); }
    if (b.engaged) {
      const out = updateBoss(b.ai, b.def, b.c.hp / b.c.maxHp, b.pos, target, dt, this.enemies.filter((x) => x.minion).length, this.rng);
      vel = out.vel;
      b.pos = moveWithCollision(this.world, b.pos, { x: b.pos.x + out.vel.x * dt, y: b.pos.y + out.vel.y * dt }, b.def.radius - 4);
      for (const ev of out.events) this.bossEvent(b, ev);
      if (b.charge && this.now < b.charge.until && !b.charge.hit && alive && Math.hypot(this.pos.x - b.pos.x, this.pos.y - b.pos.y) < b.charge.width + b.def.radius * 0.6 + PLAYER_RADIUS) {
        b.charge.hit = true; this.hurtPlayer(b.def.atk * b.charge.mult, b.pos);
      }
      setBossBar(b.def.name, b.c.hp, b.c.maxHp);
    }
    if (this.now >= b.lockUntil) b.actor.play(Math.hypot(vel.x, vel.y) > 4 ? 'move' : 'idle');
    b.actor.face(target.x < b.pos.x ? -1 : 1);
    b.actor.setPos(b.pos.x, b.pos.y);
    if (b.ai.state === 'stagger') b.actor.tint(0x9fd8ff); else if (b.ai.phase === 3) b.actor.tint(0xff9a9a); else b.actor.untint();
  }

  /** Visual + damage resolution for every boss move event (the core only decides WHEN and WHERE). */
  private bossEvent(b: BossEnt, ev: BossEvent): void {
    const atk = b.def.atk;
    switch (ev.type) {
      case 'phase':
        audio.sfx('roar'); toast(ev.phase === 2 ? `${b.def.name} grows serious!` : `${b.def.name} is enraged!`, 2800);
        this.fx.shake(300, 0.006); this.fx.ring(b.pos.x, b.pos.y, 90, COLORS.boss, 600); break;
      case 'telegraph': {
        audio.sfx('telegraph');
        const anim = ev.move === 'slam' || ev.move === 'sweep' ? 'attack_a' : ev.move === 'charge' || ev.move === 'ring' ? 'attack_b' : 'special';
        b.actor.play(anim, { force: true, duration: Math.min(ev.duration, 1.2) }); b.lockUntil = this.now + ev.duration + 0.5;
        const warn = 0xff3b30, g = this.add.graphics().setDepth(5);
        g.fillStyle(warn, 0.24).lineStyle(2.5, 0xff5a4a, 0.95);
        if ((ev.move === 'slam' || ev.move === 'teleport') && ev.radius) { g.fillCircle(ev.at.x, ev.at.y, ev.radius).strokeCircle(ev.at.x, ev.at.y, ev.radius); }
        else if (ev.move === 'sweep' && ev.range && ev.halfAngle) {
          const a0 = Math.atan2(ev.dir.y, ev.dir.x);
          g.beginPath().moveTo(b.pos.x, b.pos.y).arc(b.pos.x, b.pos.y, ev.range, a0 - ev.halfAngle, a0 + ev.halfAngle).closePath().fillPath().strokePath();
        } else if (ev.move === 'charge' && ev.range && ev.width) {
          const nx = -ev.dir.y * ev.width, ny = ev.dir.x * ev.width, ex = b.pos.x + ev.dir.x * ev.range, ey = b.pos.y + ev.dir.y * ev.range;
          g.beginPath().moveTo(b.pos.x + nx, b.pos.y + ny).lineTo(ex + nx, ey + ny).lineTo(ex - nx, ey - ny).lineTo(b.pos.x - nx, b.pos.y - ny).closePath().fillPath().strokePath();
        } else if (ev.move === 'rain' && ev.zones && ev.radius) {
          for (const z of ev.zones) g.fillCircle(z.x, z.y, ev.radius).strokeCircle(z.x, z.y, ev.radius);
          b.rainTele?.destroy(); b.rainTele = g; if (ev.zones.length) return;
        } else if (ev.move === 'ring' || ev.move === 'summon') this.fx.flare(b.pos.x, b.pos.y - 24, ev.move === 'ring' ? COLORS.wisp : COLORS.boss, 70, ev.duration * 1000);
        if (ev.move !== 'rain') { b.tele?.destroy(); b.tele = g; } else g.destroy();
        if (ev.move === 'teleport') { this.tweens.add({ targets: [b.actor.sprite, b.actor.shadow], alpha: 0.12, duration: Math.max(80, ev.duration * 800) }); }
        break;
      }
      case 'slam':
        b.slams++; b.tele?.destroy(); b.tele = null; audio.sfx('slam');
        this.fx.ring(ev.at.x, ev.at.y, ev.radius, 0xff7043, 420);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; this.fx.play('xf_stone_spike', ev.at.x + Math.cos(a) * ev.radius * 0.7, ev.at.y + Math.sin(a) * ev.radius * 0.7, { scale: 0.17, tint: 0xffb28a, blend: 'normal', alpha: 0.85, depth: ev.at.y - 30 }); }
        this.fx.shake(220, 0.007);
        if (inCircle(ev.at, ev.radius, this.pos, PLAYER_RADIUS)) this.hurtPlayer(atk * ev.damageMult, ev.at);
        break;
      case 'sweep': {
        b.tele?.destroy(); b.tele = null; audio.sfx('moon');
        const a0 = Math.atan2(ev.dir.y, ev.dir.x), g = this.add.graphics().setDepth(b.pos.y + 4);
        g.fillStyle(0xffffff, 0.55).beginPath().moveTo(b.pos.x, b.pos.y).arc(b.pos.x, b.pos.y, ev.range, a0 - ev.halfAngle, a0 + ev.halfAngle).closePath().fillPath();
        this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        this.fx.play('xf_sword_qi', b.pos.x, b.pos.y - 14, { scale: 0.5, rot: a0, tint: COLORS.boss, depth: b.pos.y + 3 });
        this.fx.shake(140, 0.005);
        if (inArc(ev.origin, ev.dir, ev.range, ev.halfAngle, this.pos, PLAYER_RADIUS)) this.hurtPlayer(atk * ev.damageMult, ev.origin);
        break;
      }
      case 'charge':
        b.tele?.destroy(); b.tele = null; b.charge = { until: this.now + ev.duration, hit: false, width: ev.width, mult: ev.damageMult }; audio.sfx('dash');
        b.actor.play('move', { force: true }); b.lockUntil = this.now + ev.duration;
        break;
      case 'rain':
        b.slams++;
        this.schedule(ev.delay, () => {
          b.rainTele?.destroy(); b.rainTele = null; audio.sfx('slam'); this.fx.shake(200, 0.006);
          for (const z of ev.zones) {
            this.fx.ring(z.x, z.y, ev.radius, 0xff7043, 380); this.fx.burst(z.x, z.y, COLORS.boss, 12);
            this.fx.play('xf_stone_spike', z.x, z.y + 2, { scale: 0.16, tint: 0xffc09a, blend: 'normal', alpha: 0.85, depth: z.y - 30 });
            if (inCircle(z, ev.radius, this.pos, PLAYER_RADIUS)) { this.hurtPlayer(atk * ev.damageMult, z); break; }
          }
        });
        break;
      case 'teleport': {
        b.tele?.destroy(); b.tele = null;
        const ok = !isBlockedTile(this.world, Math.floor(ev.to.x / TILE_SIZE), Math.floor(ev.to.y / TILE_SIZE));
        if (ok) b.pos = { ...ev.to };
        this.tweens.killTweensOf(b.actor.sprite); b.actor.setAlpha(1);
        this.fx.ring(b.pos.x, b.pos.y, ev.radius, COLORS.wisp, 360); this.fx.play('xf_soul_wisp', b.pos.x, b.pos.y - 20, { scale: 0.3, tint: COLORS.wisp });
        audio.sfx('slam'); this.fx.shake(200, 0.006);
        if (inCircle(b.pos, ev.radius, this.pos, PLAYER_RADIUS)) this.hurtPlayer(atk * ev.damageMult, b.pos);
        break;
      }
      case 'summon':
        b.actor.play('special', { force: true, duration: 0.8 }); b.lockUntil = this.now + 0.9;
        for (let i = 0; i < ev.count; i++) {
          const a = this.rng() * Math.PI * 2;
          const p = { x: b.pos.x + Math.cos(a) * 36, y: b.pos.y + Math.sin(a) * 36 };
          if (!isBlockedTile(this.world, Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))) { this.spawnEnemy(ev.minionType, p, true, b.def.zone); this.fx.play('xf_soul_wisp', p.x, p.y - 10, { scale: 0.2, tint: COLORS.boss }); }
        }
        break;
      case 'ring':
        this.fx.ring(b.pos.x, b.pos.y, 60, COLORS.wisp, 360);
        for (let i = 0; i < ev.projectiles; i++) {
          const a = (i / ev.projectiles) * Math.PI * 2;
          this.addBolt({ kind: 'hostile', pos: { x: b.pos.x, y: b.pos.y - 14 }, vel: { x: Math.cos(a) * 88, y: Math.sin(a) * 88 }, max: 230, damage: atk * ev.damageMult, pierce: 1, radius: 6, sprite: null, color: COLORS.wisp });
        }
        break;
    }
  }

  private drawOverlays(): void {
    this.hpBars.clear(); this.vision.clear();
    for (const e of this.enemies) { // faint vision cone on unaware enemies near you, so stealth is readable
      if (e.minion || e.ai.state !== 'idle' || e.c.hp <= 0) continue;
      if (Math.hypot(e.pos.x - this.pos.x, e.pos.y - this.pos.y) > 260) continue;
      const a = Math.atan2(e.ai.facing.y, e.ai.facing.x), r = e.def.aggroRange;
      this.vision.fillStyle(0xffd23f, 0.17).lineStyle(1, 0xffd23f, 0.45).slice(e.pos.x, e.pos.y, r, a - FOV / 2, a + FOV / 2, false).fillPath().strokePath();
      this.vision.fillStyle(0xffd23f, 0.12).fillCircle(e.pos.x, e.pos.y, SENSE_RADIUS);
    }
    for (const e of this.enemies) {
      if (e.c.hp >= e.c.maxHp && e.ai.state === 'idle' && !e.elite) continue;
      const w = e.elite ? 26 : 22, x = e.pos.x - w / 2, y = e.pos.y - e.def.scale * 85 - 4;
      this.hpBars.fillStyle(0x000000, 0.8).fillRect(x - 1, y - 1, w + 2, 5);
      this.hpBars.fillStyle(e.elite ? 0xffc83d : 0xe74c3c, 1).fillRect(x, y, (w * e.c.hp) / e.c.maxHp, 3);
      if (e.shield > 0) this.hpBars.fillStyle(0x7fd0ff, 1).fillRect(x, y - 3, (w * e.shield) / (e.c.maxHp * 0.3), 2);
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
        hero: this.gs.character.hero, stones: this.gs.stones, tut: this.gs.tut, objective: this.objective().text, skills: { ...this.gs.skills }, freePoints: freePoints(this.gs), inventoryGear: { weapon: this.gs.inventory.weapon, armor: this.gs.inventory.armor, charm: this.gs.inventory.charm }, zone: this.currentZone, tower: this.tower ? { floor: this.tower.floor, phase: this.tower.phase } : null, towerBest: this.gs.towerBest, boons: [...this.gs.boons], boonPicks: this.gs.boonPicks, perfectBuff: this.now < this.perfectUntil, dead: this.dead, comboStep: this.combo.step, dashing: isDashing(this.dashState, this.now), invulnerable: isInvulnerable(this.dashState, this.now),
        quests: Object.fromEntries(Object.entries(this.gs.quests).map(([k, v]) => [k, v.status])),
        enemies: this.enemies.map((e) => ({ id: e.id, type: e.def.id, hp: e.c.hp, x: e.pos.x, y: e.pos.y, ai: e.ai.state, minion: e.minion, elite: e.elite, affix: e.affix, burning: !!e.burn, slowed: e.slow > 0, shield: e.shield, zone: e.zone, anim: e.actor.anim })),
        bosses: this.bosses.map((b) => ({ id: b.def.id, hp: b.c.hp, maxHp: b.c.maxHp, x: b.pos.x, y: b.pos.y, engaged: b.engaged, phase: b.ai.phase, state: b.ai.state === 'windup' ? `${b.ai.move}-windup` : b.ai.state, slams: b.slams, poise: Math.round(b.ai.poise) })),
        boss: this.boss ? { hp: this.boss.c.hp, maxHp: this.boss.c.maxHp, x: this.boss.pos.x, y: this.boss.pos.y, engaged: this.boss.engaged, phase: this.boss.ai.phase, state: this.boss.ai.state === 'windup' ? `${this.boss.ai.move}-windup` : this.boss.ai.state, slams: this.boss.slams } : null,
        chapter: this.chapter, portal: this.world.portal, bossHomes: this.world.bossHomes, story: [...this.gs.story],
        palace: this.world.props.find((p) => p.kind === 'palace'), lair: this.world.lair, den: this.world.den, pool: this.world.pool, spawn: this.world.spawn, npc: this.world.npcs['elder-lin'], npcs: this.world.npcs, npcPlates: Object.fromEntries(this.npcs.map((n) => [n.id, n.plate.visible])), arrayPos: this.world.arrayPos,
        herbs: this.herbs.map((h) => ({ x: h.x, y: h.y, alive: h.alive })), anchors: this.world.anchors,
        bag: this.gs.inventory.slots.map((sl) => sl?.id ?? null), bolts: this.bolts.filter((b) => b.kind === 'hostile').length, props: this.world.props.filter((p) => p.kind === 'lotusbowl' || p.kind === 'palace').map((p) => ({ kind: p.kind, x: p.x, y: p.y })), playerAnim: this.player.anim, items: this.gs.inventory.slots.filter((s) => s).map((s) => `${s!.id}:${s!.count}`),
      }),
      cast: (i: number, x: number, y: number) => { this.playerLockUntil = 0; this.castSkill(i, { x, y }); },
      attack: (x: number, y: number) => this.attack({ x, y }),
      dash: () => this.dash(),
      teleport: (x: number, y: number) => { this.pos = { x, y }; },
      spawn: (type: string, x: number, y: number) => { const en = this.spawnEnemy(type, { x, y }, false, 'bamboo', false); if (en) en.ai.facing = normalize({ x: this.pos.x - x, y: this.pos.y - y }); },
      spawnUnaware: (type: string, x: number, y: number) => { const en = this.spawnEnemy(type, { x, y }, false, 'bamboo', false); if (en) en.ai.facing = normalize({ x: x - this.pos.x, y: y - this.pos.y }); return en?.id ?? -1; },
      alertAll: () => { for (const en of this.enemies) en.alertUntil = this.now + 120; },
      strikeEnemy: (id: number) => { const en = this.enemies.find((q) => q.id === id); if (en) this.hitEnemy(en, 0.01); },
      spawnElite: (type: string, x: number, y: number) => { const en = this.spawnEnemy(type, { x, y }, false, 'marsh', true); if (en) en.ai.facing = normalize({ x: this.pos.x - x, y: this.pos.y - y }); },
      setTut: (n: number) => { this.gs.tut = n; },
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
      bossForce: (id: string, move: string) => { const b = this.bosses.find((x) => x.def.id === id); if (b) { b.engaged = true; b.ai.force = move as never; b.ai.gap = 0; } },
      setStones: (n: number) => { this.gs.stones = n; },
      useGate: () => this.useGate(),
      setFlask: (n: number) => { this.gs.flask.charges = n; this.gs.flask.kills = 0; },
      poiseBoss: (id: string, dmg: number) => { const b = this.bosses.find((x) => x.def.id === id); if (b) { b.engaged = true; this.poiseHit(b, dmg); } },
      clearTowerFoes: () => { for (const e of this.enemies.filter((x) => x.tower)) this.killEnemy(e); },
      startTower: () => this.startTower(), endTower: () => this.endTower('left'),
      offerBoon: () => this.offerBoon(true),
      addBoonPicks: (n: number) => { this.gs.boonPicks += n; },
      perfectDodge: () => this.perfectDodge(),
      defeatBoss: (id: string) => { if (!this.gs.bosses.includes(id)) this.gs.bosses.push(id); },
    };
  }
}
