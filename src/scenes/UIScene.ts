import Phaser from 'phaser';

interface HudState {
  hp: number;
  maxHp: number;
  charms: number;
  region: string;
  muted: boolean;
}

interface DialoguePayload {
  speaker: string;
  text: string;
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
  private paused = false;

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

    // Dialogue panel
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
      .text(360, 52, 'E / Enter to close', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '14px',
        color: '#8aa8a0',
      })
      .setOrigin(1, 0.5);

    this.dialogueBox = this.add
      .container(this.scale.width / 2, this.scale.height - 100, [boxBg, this.dialogueSpeaker, this.dialogueBody, hint])
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false);

    // Pause
    const pBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0e1f1d, 0.72);
    const pTitle = this.add
      .text(0, -40, 'Paused', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '48px',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);
    const pBody = this.add
      .text(0, 30, 'Esc to resume · M mute · Collect 9 Virtue Charms', {
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

    this.game.events.on('ninefold-hud', (s: HudState) => this.drawHud(s));
    this.game.events.on('ninefold-toast', (msg: string) => this.showToast(msg));
    this.game.events.on('ninefold-dialogue', (d: DialoguePayload | null) => this.showDialogue(d));
    this.game.events.on('ninefold-pause-toggle', () => this.togglePause());

    this.scale.on('resize', () => {
      this.regionText.setX(this.scale.width / 2);
      this.charmText.setX(this.scale.width - pad);
      this.toastText.setX(this.scale.width / 2);
      this.dialogueBox.setPosition(this.scale.width / 2, this.scale.height - 100);
      this.pauseOverlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    });
  }

  private drawHud(s: HudState): void {
    this.hearts.forEach((h, i) => h.setVisible(i < s.hp));
    this.regionText.setText(s.region);
    this.charmText.setText(`Charms ${s.charms} / 9${s.muted ? ' · muted' : ''}`);
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

  private togglePause(): void {
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    const world = this.scene.get('world');
    if (this.paused) this.scene.pause('world');
    else this.scene.resume('world');
    void world;
  }
}
