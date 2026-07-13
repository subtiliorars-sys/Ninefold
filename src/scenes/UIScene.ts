import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import type { DialogueLogEntry } from '../systems/SaveGame';

interface HudState {
  hp: number;
  maxHp: number;
  charms: number;
  region: string;
  muted: boolean;
  trials?: number;
}

interface DialoguePayload {
  speaker: string;
  text: string;
}

interface FoldCharm {
  id: string;
  name: string;
  charm: string;
  blurb: string;
  owned: boolean;
  trialDone: boolean;
}

interface FoldPayload {
  charms: FoldCharm[];
  log: DialogueLogEntry[];
}

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private regionText!: Phaser.GameObjects.Text;
  private charmText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueSpeaker!: Phaser.GameObjects.Text;
  private dialogueBody!: Phaser.GameObjects.Text;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private foldOverlay!: Phaser.GameObjects.Container;
  private foldBody!: Phaser.GameObjects.Text;
  private paused = false;
  private touchRoot!: Phaser.GameObjects.Container;
  private stickKnob!: Phaser.GameObjects.Arc;
  private stickOrigin = new Phaser.Math.Vector2(110, 600);
  private stickPointerId: number | null = null;

  constructor() {
    super('ui');
  }

  create(): void {
    const pad = 16;

    for (let i = 0; i < 5; i++) {
      const h = this.add.image(pad + 12 + i * 22, pad + 12, 'heart').setScrollFactor(0).setDepth(100);
      this.hearts.push(h);
    }

    this.regionText = this.add
      .text(this.scale.width / 2, pad + 4, 'Agora Grove', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '28px',
        color: '#f3e6c8',
        stroke: '#0e1f1d',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.charmText = this.add
      .text(this.scale.width - pad, pad + 8, 'Charms 0 / 9', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '18px',
        color: '#e8b86d',
        stroke: '#0e1f1d',
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.toastText = this.add
      .text(this.scale.width / 2, 64, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '18px',
        color: '#f3e6c8',
        backgroundColor: '#12302cee',
        padding: { x: 14, y: 8 },
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(110)
      .setAlpha(0);

    const boxBg = this.add.rectangle(0, 0, 760, 140, 0x12302c, 0.94).setStrokeStyle(2, 0xe8b86d);
    this.dialogueSpeaker = this.add
      .text(-360, -52, '', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '24px',
        color: '#e8b86d',
      })
      .setOrigin(0, 0);
    this.dialogueBody = this.add
      .text(-360, -18, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '20px',
        color: '#f3e6c8',
        wordWrap: { width: 720 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    const hint = this.add
      .text(360, 52, 'E / Enter / Talk to close', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '14px',
        color: '#8aa8a0',
      })
      .setOrigin(1, 0.5);

    this.dialogueBox = this.add
      .container(this.scale.width / 2, this.scale.height - 100, [
        boxBg,
        this.dialogueSpeaker,
        this.dialogueBody,
        hint,
      ])
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false);

    const pBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0e1f1d, 0.72);
    const pTitle = this.add
      .text(0, -50, 'Paused', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '48px',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);
    const pBody = this.add
      .text(0, 30, 'Esc resume · N Fold notebook · M mute · auto-saves', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '20px',
        color: '#c9e0d8',
        align: 'center',
      })
      .setOrigin(0.5);
    this.pauseOverlay = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [pBg, pTitle, pBody])
      .setScrollFactor(0)
      .setDepth(200)
      .setVisible(false);

    const fBg = this.add.rectangle(0, 0, 820, 520, 0x12302c, 0.96).setStrokeStyle(2, 0xe8b86d);
    const fTitle = this.add
      .text(0, -230, 'The Fold', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '40px',
        color: '#e8b86d',
      })
      .setOrigin(0.5);
    this.foldBody = this.add
      .text(0, -180, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '17px',
        color: '#f3e6c8',
        align: 'left',
        lineSpacing: 6,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0);
    const fHint = this.add
      .text(0, 230, 'N / Fold button to close', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '14px',
        color: '#8aa8a0',
      })
      .setOrigin(0.5);
    this.foldOverlay = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [fBg, fTitle, this.foldBody, fHint])
      .setScrollFactor(0)
      .setDepth(190)
      .setVisible(false);

    this.buildTouchControls();

    this.game.events.on('ninefold-hud', (s: HudState) => this.drawHud(s));
    this.game.events.on('ninefold-toast', (msg: string) => this.showToast(msg));
    this.game.events.on('ninefold-dialogue', (d: DialoguePayload | null) => this.showDialogue(d));
    this.game.events.on('ninefold-pause-toggle', () => this.togglePause());
    this.game.events.on('ninefold-fold', (p: FoldPayload | null) => this.showFold(p));

    this.scale.on('resize', () => this.layout());
    this.layout();
  }

  private layout(): void {
    const pad = 16;
    this.regionText.setX(this.scale.width / 2);
    this.charmText.setX(this.scale.width - pad);
    this.toastText.setX(this.scale.width / 2);
    this.dialogueBox.setPosition(this.scale.width / 2, this.scale.height - 100);
    this.pauseOverlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.foldOverlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.stickOrigin.set(110, this.scale.height - 120);
    this.touchRoot?.setPosition(0, 0);
  }

  private buildTouchControls(): void {
    const showTouch = this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.isCoarsePointer();
    this.touchRoot = this.add.container(0, 0).setScrollFactor(0).setDepth(150).setAlpha(showTouch ? 0.9 : 0.55);

    const base = this.add.circle(this.stickOrigin.x, this.stickOrigin.y, 64, 0x12302c, 0.55).setStrokeStyle(2, 0xe8b86d);
    this.stickKnob = this.add.circle(this.stickOrigin.x, this.stickOrigin.y, 28, 0xe8b86d, 0.85);
    base.setInteractive(new Phaser.Geom.Circle(0, 0, 70), Phaser.Geom.Circle.Contains);

    const mkBtn = (x: number, y: number, label: string, event: 'sword' | 'interact' | 'fold') => {
      const c = this.add.circle(x, y, 36, 0x12302c, 0.7).setStrokeStyle(2, 0xe8b86d);
      const t = this.add
        .text(x, y, label, {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '14px',
          color: '#f3e6c8',
        })
        .setOrigin(0.5);
      c.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
      c.on('pointerdown', () => {
        audio.sfx('ui');
        this.game.events.emit('ninefold-touch', { [event]: true });
      });
      return [c, t];
    };

    const bx = this.scale.width - 90;
    const by = this.scale.height - 120;
    this.touchRoot.add([
      base,
      this.stickKnob,
      ...mkBtn(bx, by, 'Sword', 'sword'),
      ...mkBtn(bx - 88, by + 10, 'Talk', 'interact'),
      ...mkBtn(bx - 44, by - 78, 'Fold', 'fold'),
    ]);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, this.stickOrigin.x, this.stickOrigin.y);
      if (d < 78) this.stickPointerId = p.id;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.stickPointerId !== p.id) return;
      const dx = p.x - this.stickOrigin.x;
      const dy = p.y - this.stickOrigin.y;
      const len = Math.hypot(dx, dy) || 1;
      const max = 48;
      const clamped = Math.min(len, max);
      const nx = (dx / len) * clamped;
      const ny = (dy / len) * clamped;
      this.stickKnob.setPosition(this.stickOrigin.x + nx, this.stickOrigin.y + ny);
      this.game.events.emit('ninefold-touch', { moveX: nx / max, moveY: ny / max });
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.stickPointerId !== p.id) return;
      this.stickPointerId = null;
      this.stickKnob.setPosition(this.stickOrigin.x, this.stickOrigin.y);
      this.game.events.emit('ninefold-touch', { moveX: 0, moveY: 0 });
    });
  }

  private isCoarsePointer(): boolean {
    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  }

  private drawHud(s: HudState): void {
    this.hearts.forEach((h, i) => h.setVisible(i < s.hp));
    this.regionText.setText(s.region);
    const trials = s.trials != null ? ` · Trials ${s.trials}` : '';
    this.charmText.setText(`Charms ${s.charms} / 9${trials}${s.muted ? ' · muted' : ''}`);
  }

  private showToast(msg: string): void {
    this.toastText.setText(msg);
    this.toastText.setAlpha(1);
    this.toastTimer?.remove(false);
    this.toastTimer = this.time.delayedCall(3200, () => {
      this.tweens.add({ targets: this.toastText, alpha: 0, duration: 400 });
    });
  }

  private showDialogue(d: DialoguePayload | null): void {
    if (!d) {
      this.dialogueBox.setVisible(false);
      return;
    }
    this.dialogueSpeaker.setText(d.speaker);
    this.dialogueBody.setText(d.text);
    this.dialogueBox.setVisible(true);
  }

  private showFold(p: FoldPayload | null): void {
    if (!p) {
      this.foldOverlay.setVisible(false);
      return;
    }
    const lines = p.charms.map((c) => {
      const mark = c.owned ? '◆' : '◇';
      const trial = c.trialDone ? ' (trial ✓)' : '';
      return `${mark} ${c.name} — ${c.charm}${trial}\n    ${c.blurb}`;
    });
    const log =
      p.log.length === 0
        ? '\nRecent talks: (none yet)'
        : '\nRecent talks:\n' + p.log.map((l) => `• ${l.speaker}: ${l.text.slice(0, 72)}…`).join('\n');
    this.foldBody.setText(lines.join('\n\n') + '\n' + log);
    this.foldOverlay.setVisible(true);
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    if (this.paused) {
      if (this.scene.isActive('world')) this.scene.pause('world');
      if (this.scene.isActive('mini-trial')) this.scene.pause('mini-trial');
      if (this.scene.isActive('stoa-trial')) this.scene.pause('stoa-trial');
    } else {
      if (this.scene.isPaused('world')) this.scene.resume('world');
      if (this.scene.isPaused('mini-trial')) this.scene.resume('mini-trial');
      if (this.scene.isPaused('stoa-trial')) this.scene.resume('stoa-trial');
    }
  }
}
