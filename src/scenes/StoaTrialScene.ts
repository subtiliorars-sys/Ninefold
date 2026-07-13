import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { inputBridge } from '../systems/InputBridge';

/**
 * Stoa trial — dodge wind gusts across the cliff colonnade.
 * Reach the far Still Column without depleting composure (HP proxy).
 */
export class StoaTrialScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private gusts!: Phaser.Physics.Arcade.Group;
  private composure = 3;
  private done = false;
  private goal!: Phaser.GameObjects.Zone;

  constructor() {
    super('stoa-trial');
  }

  create(): void {
    const W = 960;
    const H = 720;
    this.cameras.main.setBackgroundColor('#2a3a4a');
    this.add.rectangle(W / 2, H / 2, W, H, 0x3a4a5a);

    // Path
    this.add.rectangle(W / 2, H / 2, W - 80, 160, 0x6b7a88).setStrokeStyle(2, 0x9ab0c0);
    for (let i = 0; i < 8; i++) {
      this.add.rectangle(80 + i * 110, H / 2 - 100, 24, 80, 0xc8d0d8);
      this.add.rectangle(80 + i * 110, H / 2 + 100, 24, 80, 0xc8d0d8);
    }

    this.add
      .text(W / 2, 36, 'Stoa Trial — Still Heart', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '32px',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 76, 'Dodge the wind. Reach the Still Column. Composure: hearts.', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '18px',
        color: '#c9e0d8',
      })
      .setOrigin(0.5);

    this.player = this.physics.add.sprite(100, H / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.goal = this.add.zone(W - 90, H / 2, 48, 120);
    this.physics.add.existing(this.goal, true);
    this.add.rectangle(W - 90, H / 2, 36, 100, 0xe8b86d).setStrokeStyle(2, 0xfff0c8);
    this.add
      .text(W - 90, H / 2 - 70, 'Still\nColumn', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '14px',
        color: '#f3e6c8',
        align: 'center',
      })
      .setOrigin(0.5);

    this.gusts = this.physics.add.group();
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.spawnGust(),
    });

    this.physics.add.overlap(this.player, this.gusts, (_p, g) => {
      const gust = g as Phaser.Physics.Arcade.Image;
      if (!gust.active || this.done) return;
      gust.destroy();
      this.composure -= 1;
      audio.sfx('hurt');
      this.cameras.main.shake(100, 0.006);
      this.game.events.emit('ninefold-toast', `Composure ${this.composure}`);
      if (this.composure <= 0) this.fail();
    });

    this.physics.add.overlap(this.player, this.goal, () => this.succeed());

    inputBridge.attach(this);
    this.game.events.emit('ninefold-toast', 'The cliff wind rises. Walk with a still heart.');
  }

  private spawnGust(): void {
    if (this.done) return;
    const y = 720 / 2 + Phaser.Math.Between(-50, 50);
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -40 : 1000;
    const gust = this.gusts.create(x, y, 'gust') as Phaser.Physics.Arcade.Image;
    gust.setDepth(8);
    gust.setVelocityX(fromLeft ? 220 : -220);
    gust.setVelocityY(Phaser.Math.Between(-30, 30));
    this.time.delayedCall(5000, () => {
      if (gust.active) gust.destroy();
    });
  }

  private succeed(): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('pickup');
    this.game.events.emit('ninefold-trial-complete', 'stoa');
    this.game.events.emit('ninefold-toast', 'Stoa trial complete — Still Heart earned.');
    this.time.delayedCall(900, () => {
      this.scene.stop('stoa-trial');
      this.scene.resume('world');
      this.scene.setVisible(true, 'ui');
    });
  }

  private fail(): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('defeat');
    this.game.events.emit('ninefold-toast', 'The wind carried you back. Try the shrine again.');
    this.time.delayedCall(900, () => {
      this.scene.stop('stoa-trial');
      this.scene.resume('world');
    });
  }

  update(): void {
    if (this.done || !this.player?.active) return;
    const f = inputBridge.sample(this);
    if (f.pauseJust) {
      this.fail();
      return;
    }
    const speed = 160;
    this.player.setVelocity(f.moveX * speed, f.moveY * speed);
    // Keep on the colonnade band
    this.player.y = Phaser.Math.Clamp(this.player.y, 720 / 2 - 60, 720 / 2 + 60);
  }
}
