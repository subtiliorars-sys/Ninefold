import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { clearSave, hasSave } from '../systems/SaveGame';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    const { width, height } = this.scale;
    const saved = hasSave();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3d3a);
    for (let i = 0; i < 40; i++) {
      this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 2, 0x3d8a84, 0.35);
    }

    this.add
      .text(width / 2, height * 0.22, 'NINEFOLD', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '72px',
        color: '#f3e6c8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.34, 'Nine philosophies. One island paradise.', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '22px',
        color: '#c9e0d8',
      })
      .setOrigin(0.5);

    const start = this.mkButton(width / 2, height * 0.52, 'New Journey', async () => {
      clearSave();
      await this.begin(false);
    });

    if (saved) {
      this.mkButton(width / 2, height * 0.62, 'Continue', async () => this.begin(true));
    }

    this.tweens.add({ targets: start, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });

    this.add
      .text(
        width / 2,
        height * 0.82,
        'Enter / Space to start · WASD move · E talk · N Fold · M music · Esc pause · touch / gamepad OK',
        {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '16px',
          color: '#8aa8a0',
        },
      )
      .setOrigin(0.5);

    const startGame = () => void this.begin(saved);
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);
  }

  private mkButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '24px',
        color: '#e8b86d',
        backgroundColor: '#12302c',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => onClick());
    t.on('pointerover', () => t.setColor('#fff0d0'));
    t.on('pointerout', () => t.setColor('#e8b86d'));
    return t;
  }

  private async begin(continueSave: boolean): Promise<void> {
    await audio.unlock();
    audio.sfx('ui');
    this.scene.start('world', { continue: continueSave });
    this.scene.launch('ui');
  }
}
