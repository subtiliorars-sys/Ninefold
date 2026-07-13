/** Tiny Web Audio bus — procedural bed + one-shot SFX. */

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

const REGION_SCALES: Record<string, number[]> = {
  agora: [262, 294, 330, 392, 440, 523],
  stoa: [247, 294, 330, 370, 440],
  garden: [294, 330, 349, 392, 523],
  academy: [262, 311, 349, 415, 494],
  way: [220, 262, 294, 330, 392],
  harmony: [262, 294, 330, 349, 392],
  inquiry: [277, 311, 370, 415, 466],
  craft: [196, 247, 294, 370, 440],
  compassion: [233, 294, 349, 392, 466],
  emptiness: [196, 220, 247, 294],
};

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private muted = false;
  private started = false;
  private scale = REGION_SCALES.agora!;
  private regionKey = 'agora';

  ensure(): void {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.45;
    this.sfxGain.connect(this.master);
  }

  async unlock(): Promise<void> {
    this.ensure();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.startMusic();
    }
  }

  setRegion(key: string): void {
    const k = key.toLowerCase();
    if (k === this.regionKey) return;
    this.regionKey = k;
    this.scale = REGION_SCALES[k] ?? REGION_SCALES.agora!;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.7;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(dest: GainNode, t: Tone, when = 0): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.value = t.freq;
    const now = this.ctx.currentTime + when;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(t.gain ?? 0.2, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + t.dur + 0.02);
  }

  sfx(kind: 'slash' | 'pickup' | 'talk' | 'hurt' | 'ui' | 'defeat' | 'ferry'): void {
    this.ensure();
    if (!this.sfxGain || this.muted) return;
    const map: Record<string, Tone[]> = {
      slash: [
        { freq: 220, dur: 0.08, type: 'square', gain: 0.12 },
        { freq: 140, dur: 0.12, type: 'sawtooth', gain: 0.08 },
      ],
      pickup: [
        { freq: 523, dur: 0.1, type: 'triangle', gain: 0.18 },
        { freq: 784, dur: 0.16, type: 'triangle', gain: 0.14 },
      ],
      talk: [{ freq: 340, dur: 0.05, type: 'triangle', gain: 0.1 }],
      hurt: [{ freq: 90, dur: 0.18, type: 'sawtooth', gain: 0.15 }],
      ui: [{ freq: 440, dur: 0.06, type: 'sine', gain: 0.1 }],
      defeat: [
        { freq: 180, dur: 0.08, type: 'triangle', gain: 0.1 },
        { freq: 90, dur: 0.2, type: 'triangle', gain: 0.08 },
      ],
      ferry: [
        { freq: 196, dur: 0.12, type: 'sine', gain: 0.12 },
        { freq: 247, dur: 0.18, type: 'triangle', gain: 0.1 },
      ],
    };
    map[kind].forEach((t, i) => this.tone(this.sfxGain!, t, i * 0.05));
  }

  private startMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    const step = () => {
      if (!this.ctx || !this.musicGain || this.muted) {
        this.musicTimer = window.setTimeout(step, 900);
        return;
      }
      const scale = this.scale;
      const note = scale[Math.floor(Math.random() * scale.length)]!;
      this.tone(this.musicGain, { freq: note / 2, dur: 1.4, type: 'sine', gain: 0.08 });
      if (Math.random() > 0.45) {
        this.tone(
          this.musicGain,
          {
            freq: note,
            dur: 0.35,
            type: 'triangle',
            gain: 0.06,
          },
          0.15,
        );
      }
      this.musicTimer = window.setTimeout(step, 700 + Math.random() * 900);
    };
    step();
  }

  dispose(): void {
    if (this.musicTimer != null) window.clearTimeout(this.musicTimer);
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const audio = new AudioBus();
