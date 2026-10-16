/**
 * Procedural audio (WebAudio): every sound effect and the music are synthesised in code, so there is nothing to license.
 * Music is a generative guqin-style pentatonic loop whose density follows the mood (calm / mist / danger / boss).
 */
export type SfxName =
  | 'slash1' | 'slash2' | 'slash3' | 'hit' | 'crit' | 'cast' | 'sword' | 'moon' | 'lotus' | 'rain' | 'dash' | 'hurt' | 'death'
  | 'pickup' | 'levelup' | 'breakthrough' | 'potion' | 'click' | 'slam' | 'roar' | 'gather' | 'telegraph' | 'kill' | 'fail';
export type Mood = 'calm' | 'mist' | 'danger' | 'boss';

const PENTA = [0, 2, 4, 7, 9]; // major pentatonic degrees (semitones)
const MIST_SCALE = [0, 3, 5, 7, 10]; // minor pentatonic for eerie zones
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private reverb!: DelayNode;
  private mood: Mood = 'calm';
  private musicOn = false;
  private nextTime = 0;
  private step = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private lastMelody = 4;
  muted = false;
  volume = 0.7;
  readonly stats = { sfx: 0, notes: 0, last: '' as string };

  constructor() {
    try { this.muted = localStorage.getItem('ir-muted') === '1'; const v = Number(localStorage.getItem('ir-vol')); if (v > 0 && v <= 1) this.volume = v; } catch { /* storage unavailable */ }
    const unlock = () => { this.ensure(); };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
  }

  get state(): string { return this.ctx?.state ?? 'none'; }

  /** Creates the AudioContext (must happen inside a user gesture). */
  ensure(): boolean {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : this.volume; this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.gain.value = 0.5; this.musicBus.connect(this.master);
      // cheap echo "reverb" for the music
      this.reverb = c.createDelay(1); this.reverb.delayTime.value = 0.23;
      const fb = c.createGain(); fb.gain.value = 0.38; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      this.reverb.connect(lp); lp.connect(fb); fb.connect(this.reverb); lp.connect(this.musicBus);
      const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try { localStorage.setItem('ir-muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  // ---------- synthesis helpers ----------
  private tone(freq: number, dur: number, type: OscillatorType, gain: number, o: { slideTo?: number; delay?: number; bus?: GainNode; attack?: number } = {}): void {
    const c = this.ctx!, t = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + (o.attack ?? 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.bus ?? this.sfxBus); osc.start(t); osc.stop(t + dur + 0.05);
  }
  private noise(dur: number, f0: number, f1: number, gain: number, o: { q?: number; type?: BiquadFilterType; delay?: number } = {}): void {
    const c = this.ctx!, t = c.currentTime + (o.delay ?? 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type ?? 'bandpass'; f.Q.value = o.q ?? 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + dur + 0.05);
  }
  private bell(freq: number, gain: number, dur: number, delay = 0): void {
    for (const [m, g] of [[1, 1], [2.76, 0.5], [5.4, 0.28], [8.9, 0.12]] as [number, number][]) this.tone(freq * m, dur / (0.6 + m * 0.25), 'sine', gain * g, { delay });
  }

  /** Plays a sound effect. Safe to call before the context exists (it is simply skipped). */
  sfx(name: SfxName): void {
    this.stats.sfx++; this.stats.last = name;
    if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
    switch (name) {
      case 'slash1': this.noise(0.16, 900, 3200, 0.5, { q: 1.5 }); this.tone(380, 0.12, 'sawtooth', 0.05, { slideTo: 160 }); break;
      case 'slash2': this.noise(0.16, 1100, 3600, 0.5, { q: 1.5 }); this.tone(440, 0.12, 'sawtooth', 0.05, { slideTo: 190 }); break;
      case 'slash3': this.noise(0.3, 500, 4200, 0.7, { q: 1.2 }); this.tone(260, 0.28, 'sawtooth', 0.09, { slideTo: 90 }); this.bell(880, 0.04, 0.5, 0.03); break;
      case 'hit': this.noise(0.09, 1800, 300, 0.45, { q: 0.8 }); this.tone(170, 0.11, 'sine', 0.5, { slideTo: 55 }); break;
      case 'crit': this.noise(0.12, 2600, 400, 0.55, { q: 0.8 }); this.tone(190, 0.13, 'sine', 0.55, { slideTo: 50 }); this.bell(1320, 0.1, 0.5); break;
      case 'cast': this.tone(300, 0.3, 'sine', 0.12, { slideTo: 760 }); this.tone(450, 0.3, 'triangle', 0.06, { slideTo: 1100 }); break;
      case 'sword': this.noise(0.4, 1500, 5200, 0.4, { q: 2 }); this.tone(660, 0.35, 'triangle', 0.08, { slideTo: 1500 }); break;
      case 'moon': this.noise(0.55, 400, 2600, 0.5, { q: 1 }); this.tone(220, 0.5, 'sawtooth', 0.07, { slideTo: 440 }); this.bell(587, 0.06, 0.8, 0.05); break;
      case 'lotus': this.bell(392, 0.18, 1.6); this.bell(523, 0.12, 1.4, 0.06); this.bell(784, 0.09, 1.2, 0.12); this.noise(0.5, 3000, 600, 0.2, { type: 'lowpass' }); break;
      case 'rain': for (let i = 0; i < 6; i++) { this.noise(0.1, 4000, 1500, 0.3, { delay: i * 0.07, q: 3 }); this.tone(2200 + i * 180, 0.12, 'triangle', 0.05, { delay: i * 0.07 }); } break;
      case 'dash': this.noise(0.22, 2800, 500, 0.4, { q: 0.7 }); break;
      case 'hurt': this.tone(140, 0.22, 'sawtooth', 0.22, { slideTo: 60 }); this.noise(0.14, 900, 200, 0.4, { type: 'lowpass' }); break;
      case 'death': this.tone(260, 1.0, 'triangle', 0.22, { slideTo: 55 }); this.noise(0.9, 800, 80, 0.3, { type: 'lowpass' }); break;
      case 'pickup': this.tone(880, 0.15, 'sine', 0.2); this.tone(1318, 0.25, 'sine', 0.18, { delay: 0.08 }); break;
      case 'gather': this.tone(660, 0.12, 'sine', 0.18); this.tone(990, 0.18, 'sine', 0.16, { delay: 0.07 }); this.tone(1480, 0.3, 'sine', 0.12, { delay: 0.14 }); break;
      case 'levelup': PENTA.concat([12, 14]).forEach((n, i) => this.bell(midi(72 + n), 0.11, 0.9, i * 0.09)); break;
      case 'breakthrough': this.bell(midi(48), 0.35, 4.2); this.bell(midi(55), 0.2, 3.6, 0.1); [0, 4, 7, 12, 16].forEach((n, i) => this.bell(midi(72 + n), 0.1, 1.4, 0.4 + i * 0.12)); break;
      case 'potion': for (let i = 0; i < 5; i++) this.tone(500 + Math.random() * 500, 0.09, 'sine', 0.1, { delay: i * 0.06, slideTo: 900 + i * 90 }); break;
      case 'click': this.tone(700, 0.06, 'triangle', 0.12); break;
      case 'slam': this.tone(70, 0.6, 'sine', 0.8, { slideTo: 30 }); this.noise(0.5, 600, 60, 0.7, { type: 'lowpass' }); break;
      case 'roar': this.tone(90, 0.9, 'sawtooth', 0.3, { slideTo: 45 }); this.tone(135, 0.9, 'sawtooth', 0.18, { slideTo: 70 }); this.noise(0.8, 500, 100, 0.3, { q: 0.6 }); break;
      case 'telegraph': this.tone(240, 0.5, 'triangle', 0.14, { slideTo: 520 }); break;
      case 'kill': this.tone(520, 0.12, 'triangle', 0.14, { slideTo: 180 }); this.noise(0.18, 1200, 200, 0.3); break;
      case 'fail': this.tone(300, 0.4, 'sawtooth', 0.14, { slideTo: 120 }); break;
    }
  }

  // ---------- music ----------
  setMood(m: Mood): void { this.mood = m; if (this.droneFilter && this.ctx) this.droneFilter.frequency.setTargetAtTime(m === 'calm' ? 500 : m === 'mist' ? 380 : m === 'danger' ? 900 : 1300, this.ctx.currentTime, 1.5); }

  startMusic(): void {
    if (this.musicOn || !this.ensure()) return;
    const c = this.ctx!;
    this.musicOn = true; this.nextTime = c.currentTime + 0.2; this.step = 0;
    // soft drone pad: D2 + A2 with slow detune
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; this.droneFilter = f;
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 3); this.droneGain = g;
    for (const [fr, det] of [[73.4, -5], [110, 6], [146.8, 3]] as [number, number][]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07 + Math.random() * 0.05; lg.gain.value = 7; lfo.connect(lg); lg.connect(o.detune); lfo.start();
      o.connect(f); o.start();
    }
    f.connect(g); g.connect(this.musicBus);
    this.timer = setInterval(() => this.schedule(), 120);
  }
  stopMusic(): void { if (this.timer) clearInterval(this.timer); this.timer = null; this.musicOn = false; this.droneGain?.gain.setTargetAtTime(0.0001, this.ctx?.currentTime ?? 0, 0.4); }

  private schedule(): void {
    const c = this.ctx; if (!c || !this.musicOn) return;
    const tempo = this.mood === 'calm' ? 56 : this.mood === 'mist' ? 48 : this.mood === 'danger' ? 84 : 100;
    const dt = 60 / tempo / 2;
    while (this.nextTime < c.currentTime + 0.5) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += dt; this.step++;
    }
  }

  private pluck(freq: number, when: number, gain: number): void {
    const c = this.ctx!;
    const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 2.005;
    f.type = 'lowpass'; f.frequency.setValueAtTime(freq * 9, when); f.frequency.exponentialRampToValueAtTime(freq * 1.5, when + 0.9);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(gain, when + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.musicBus); g.connect(this.reverb);
    o.start(when); o2.start(when); o.stop(when + 1.7); o2.stop(when + 1.7);
    this.stats.notes++;
  }

  private drum(when: number, deep: boolean): void {
    const c = this.ctx!;
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(deep ? 110 : 160, when); o.frequency.exponentialRampToValueAtTime(deep ? 42 : 70, when + 0.25);
    g.gain.setValueAtTime(deep ? 0.55 : 0.3, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
    o.connect(g); g.connect(this.musicBus); o.start(when); o.stop(when + 0.35);
  }

  private playStep(step: number, when: number): void {
    const scale = this.mood === 'mist' || this.mood === 'boss' ? MIST_SCALE : PENTA;
    const density = this.mood === 'calm' ? 0.34 : this.mood === 'mist' ? 0.3 : this.mood === 'danger' ? 0.55 : 0.7;
    if (Math.random() < density) {
      // melodic random walk over two octaves of the scale
      this.lastMelody = Math.max(0, Math.min(scale.length * 2 - 1, this.lastMelody + Math.floor(Math.random() * 5) - 2));
      const deg = this.lastMelody, note = 62 + scale[deg % scale.length]! + 12 * Math.floor(deg / scale.length);
      this.pluck(midi(note), when, 0.16 + Math.random() * 0.06);
    }
    if (step % 16 === 0) this.pluck(midi(50), when, 0.2); // low root every bar
    if ((this.mood === 'danger' || this.mood === 'boss') && step % 4 === 0) this.drum(when, step % 8 === 0);
    if (this.mood === 'boss' && step % 2 === 1) this.drum(when, false);
  }
}

export const audio = new AudioEngine();
(window as unknown as { __audio: AudioEngine }).__audio = audio; // test hook
