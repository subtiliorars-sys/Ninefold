import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3d3a);
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, 2, 0x3d8a84, 0.35);
    }

    this.add
      .text(width / 2, height * 0.28, 'NINEFOLD', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '72px',
        color: '#f3e6c8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.40, 'Nine philosophies. One island paradise.', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '22px',
        color: '#c9e0d8',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.52,
        'Explore · Talk · Collect · Swing gently at shade-mites',
        {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '18px',
          color: '#a8c4bc',
        },
      )
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height * 0.68, 'Press Enter / Click to begin', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '24px',
        color: '#e8b86d',
        backgroundColor: '#12302c',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height * 0.86, 'WASD move · Space/Click sword · E talk · M mute', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '16px',
        color: '#8aa8a0',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: start,
      alpha: 0.55,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const go = async () => {
      await audio.unlock();
      audio.sfx('ui');
      this.scene.start('world');
      this.scene.launch('ui');
    };

    start.on('pointerdown', () => void go());
    this.input.keyboard?.once('keydown-ENTER', () => void go());
    this.input.keyboard?.once('keydown-SPACE', () => void go());
  }
}
