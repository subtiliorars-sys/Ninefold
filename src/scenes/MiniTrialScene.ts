import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { trialMeta, type TrialMeta } from '../data/trials';
import type { PhilosophyId } from '../data/philosophies';
import { inputBridge } from '../systems/InputBridge';

/**
 * Shared mini-dungeons for each philosophy school.
 * Launch with: scene.launch('mini-trial', { trialId: 'garden' })
 */
export class MiniTrialScene extends Phaser.Scene {
  private trialId!: PhilosophyId;
  private meta!: TrialMeta;
  private player!: Phaser.Physics.Arcade.Sprite;
  private done = false;
  private swordHit!: Phaser.Physics.Arcade.Image;
  private swinging = false;
  private facing = new Phaser.Math.Vector2(1, 0);
  private lives = 3;
  private invulnUntil = 0;
  private progress = 0;
  private need = 1;
  private order: number[] = [];
  private nextIdx = 0;
  private pads: Phaser.GameObjects.Rectangle[] = [];
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('mini-trial');
  }

  init(data: { trialId: PhilosophyId }): void {
    this.trialId = data.trialId;
    this.meta = trialMeta(data.trialId)!;
    this.done = false;
    this.lives = 3;
    this.progress = 0;
    this.nextIdx = 0;
    this.pads = [];
    this.order = [];
  }

  create(): void {
    const W = 960;
    const H = 720;
    this.cameras.main.setBackgroundColor('#1a2a28');
    this.add.rectangle(W / 2, H / 2, W, H, 0x243834);

    this.add
      .text(W / 2, 32, this.meta.title, {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '30px',
        color: '#f3e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 68, this.meta.hint, {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '17px',
        color: '#c9e0d8',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(W / 2, H - 28, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '16px',
        color: '#e8b86d',
      })
      .setOrigin(0.5);

    this.player = this.physics.add.sprite(120, H / 2, 'player');
    this.player.setDisplaySize(36, 46);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.swordHit = this.physics.add.image(-100, -100, 'sword');
    this.swordHit.setVisible(false);
    this.swordHit.body!.enable = false;

    inputBridge.attach(this);
    this.buildForTrial();
    this.refreshStatus();
    this.game.events.emit('ninefold-toast', this.meta.hint);
  }

  private refreshStatus(): void {
    this.statusText.setText(`Progress ${this.progress}/${this.need} · Lives ${this.lives} · Esc to leave`);
  }

  private buildForTrial(): void {
    switch (this.trialId) {
      case 'stoa':
        this.buildStoa();
        break;
      case 'garden':
        this.buildGarden();
        break;
      case 'academy':
        this.buildAcademy();
        break;
      case 'way':
        this.buildWay();
        break;
      case 'craft':
        this.buildCraft();
        break;
      case 'harmony':
        this.buildHarmony();
        break;
      case 'inquiry':
        this.buildInquiry();
        break;
      case 'compassion':
        this.buildCompassion();
        break;
      case 'emptiness':
        this.buildEmptiness();
        break;
    }
  }

  private buildStoa(): void {
    this.need = 1;
    const H = 720;
    this.add.rectangle(480, H / 2, 880, 160, 0x6b7a88);
    const goal = this.add.zone(870, H / 2, 48, 120);
    this.physics.add.existing(goal, true);
    this.add.rectangle(870, H / 2, 36, 100, 0xe8b86d);
    const gusts = this.physics.add.group();
    this.time.addEvent({
      delay: 850,
      loop: true,
      callback: () => {
        if (this.done) return;
        const y = H / 2 + Phaser.Math.Between(-50, 50);
        const fromLeft = Math.random() > 0.5;
        const g = gusts.create(fromLeft ? -40 : 1000, y, 'gust') as Phaser.Physics.Arcade.Image;
        g.setVelocityX(fromLeft ? 230 : -230);
        this.time.delayedCall(4500, () => g.destroy());
      },
    });
    this.physics.add.overlap(this.player, gusts, (_p, g) => {
      (g as Phaser.GameObjects.GameObject).destroy();
      this.hit();
    });
    this.physics.add.overlap(this.player, goal, () => {
      this.progress = 1;
      this.succeed();
    });
  }

  private buildGarden(): void {
    this.need = 5;
    const olives = this.physics.add.group();
    const snares = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const o = olives.create(200 + i * 130, 200 + (i % 2) * 280, 'charm') as Phaser.Physics.Arcade.Image;
      o.setTint(0xc4d67a);
    }
    for (let i = 0; i < 4; i++) {
      const s = snares.create(260 + i * 150, 360, 'enemy') as Phaser.Physics.Arcade.Image;
      s.setTint(0xaa3030);
      s.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
      s.setBounce(1, 1);
      s.setCollideWorldBounds(true);
    }
    this.physics.add.overlap(this.player, olives, (_p, o) => {
      (o as Phaser.GameObjects.GameObject).destroy();
      this.progress += 1;
      audio.sfx('pickup');
      this.refreshStatus();
      if (this.progress >= this.need) this.succeed();
    });
    this.physics.add.overlap(this.player, snares, () => this.hit());
  }

  private buildAcademy(): void {
    this.need = 4;
    this.order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
    const labels = ['A', 'B', 'C', 'D'];
    const flash = this.add
      .text(480, 120, `Order: ${this.order.map((i) => labels[i]).join(' → ')}`, {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '22px',
        color: '#9bb7d4',
      })
      .setOrigin(0.5);
    this.time.delayedCall(3500, () => flash.setText('Step the pads…'));

    for (let i = 0; i < 4; i++) {
      const x = 220 + i * 170;
      const y = 400;
      const pad = this.add.rectangle(x, y, 80, 80, 0x9bb7d4, 0.5).setStrokeStyle(2, 0xf3e6c8);
      this.add.text(x, y, labels[i]!, { fontSize: '28px', color: '#f3e6c8' }).setOrigin(0.5);
      this.physics.add.existing(pad, true);
      this.pads.push(pad);
      this.physics.add.overlap(this.player, pad, () => this.onPad(i, pad));
    }
  }

  private onPad(i: number, pad: Phaser.GameObjects.Rectangle): void {
    if (this.done) return;
    if (pad.getData('used')) return;
    const expected = this.order[this.nextIdx];
    if (i !== expected) {
      this.hit();
      this.nextIdx = 0;
      this.progress = 0;
      this.pads.forEach((p) => {
        p.setData('used', false);
        p.setFillStyle(0x9bb7d4, 0.5);
      });
      this.refreshStatus();
      return;
    }
    pad.setData('used', true);
    pad.setFillStyle(0xe8b86d, 0.8);
    this.nextIdx += 1;
    this.progress = this.nextIdx;
    audio.sfx('ui');
    this.refreshStatus();
    if (this.nextIdx >= 4) this.succeed();
  }

  private buildWay(): void {
    this.need = 1;
    // Crooked corridor of safe sand tiles; walls hurt
    const path: { x: number; y: number }[] = [];
    let x = 80;
    let y = 360;
    for (let i = 0; i < 14; i++) {
      path.push({ x, y });
      x += 60;
      y += i % 2 === 0 ? -70 : 70;
    }
    const walls = this.physics.add.staticGroup();
    for (let gx = 0; gx < 960; gx += 48) {
      for (let gy = 120; gy < 640; gy += 48) {
        const onPath = path.some((p) => Math.hypot(p.x - gx, p.y - gy) < 55);
        if (!onPath) {
          const w = walls.create(gx + 24, gy + 24, 'stone') as Phaser.Physics.Arcade.Sprite;
          w.setTint(0x2f4a3a);
        } else {
          this.add.image(gx + 24, gy + 24, 'sand');
        }
      }
    }
    this.physics.add.collider(this.player, walls, () => this.hit());
    const goal = this.add.zone(path[path.length - 1]!.x, path[path.length - 1]!.y, 40, 40);
    this.physics.add.existing(goal, true);
    this.add.circle(goal.x, goal.y, 16, 0xe8b86d);
    this.player.setPosition(path[0]!.x, path[0]!.y);
    this.physics.add.overlap(this.player, goal, () => {
      this.progress = 1;
      this.succeed();
    });
  }

  private buildCraft(): void {
    this.need = 5;
    const sparks = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const s = sparks.create(250 + i * 120, 280 + (i % 2) * 160, 'charm') as Phaser.Physics.Arcade.Image;
      s.setTint(0xff8844);
      this.tweens.add({ targets: s, alpha: 0.4, yoyo: true, duration: 400, repeat: -1 });
    }
    this.physics.add.overlap(this.swordHit, sparks, (_s, sp) => {
      (sp as Phaser.GameObjects.GameObject).destroy();
      this.progress += 1;
      audio.sfx('slash');
      this.refreshStatus();
      if (this.progress >= this.need) this.succeed();
    });
  }

  private buildHarmony(): void {
    this.need = 3;
    const order = ['Elder', 'Child', 'Traveler'];
    const guests = order.map((name, i) => {
      const g = this.physics.add.staticImage(280 + i * 180, 380, 'npc');
      g.setTint(i === 0 ? 0xe0b87a : i === 1 ? 0xc4d67a : 0x9bb7d4);
      g.setData('name', name);
      g.setData('idx', i);
      this.add.text(g.x, g.y - 36, name, { fontSize: '14px', color: '#f3e6c8' }).setOrigin(0.5);
      return g;
    });
    // Shuffle visual positions but keep idx
    Phaser.Utils.Array.Shuffle(guests);
    guests.forEach((g, i) => g.setPosition(280 + i * 180, 380));
  }

  private harmonyTalk(guests: Phaser.Physics.Arcade.Image[]): void {
    if (this.done) return;
    const near = guests.find(
      (g) => g.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, g.x, g.y) < 56,
    );
    if (!near) return;
    const idx = near.getData('idx') as number;
    if (idx !== this.progress) {
      this.hit();
      return;
    }
    near.destroy();
    this.progress += 1;
    audio.sfx('talk');
    this.refreshStatus();
    if (this.progress >= 3) this.succeed();
  }

  private buildInquiry(): void {
    this.need = 1;
    const doors = [
      { label: 'Why must I win?', good: false },
      { label: 'What am I afraid to ask?', good: true },
      { label: 'Who is wrong?', good: false },
    ];
    doors.forEach((d, i) => {
      const x = 220 + i * 240;
      const zone = this.add.zone(x, 400, 100, 140);
      this.physics.add.existing(zone, true);
      this.add.rectangle(x, 400, 100, 140, 0xd4a0c8, 0.35).setStrokeStyle(2, 0xf3e6c8);
      this.add
        .text(x, 400, d.label, {
          fontSize: '14px',
          color: '#f3e6c8',
          align: 'center',
          wordWrap: { width: 90 },
        })
        .setOrigin(0.5);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.done) return;
        if (d.good) {
          this.progress = 1;
          this.succeed();
        } else this.hit();
      });
    });
    this.player.setPosition(480, 560);
  }

  private buildCompassion(): void {
    this.need = 4;
    const mites = this.physics.add.group();
    for (let i = 0; i < 4; i++) {
      const m = mites.create(220 + i * 160, 300 + (i % 2) * 140, 'enemy') as Phaser.Physics.Arcade.Sprite;
      m.setTint(0xe89aa0);
      m.setData('calm', false);
      m.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-30, 30));
      m.setBounce(1, 1);
      m.setCollideWorldBounds(true);
    }
    this.physics.add.overlap(this.swordHit, mites, () => {
      this.game.events.emit('ninefold-toast', 'Sword frightens them — use Talk (E) near a mite.');
      this.hit();
    });
  }

  private compassionTalk(): void {
    if (this.done || this.trialId !== 'compassion') return;
    const mites = this.children.list.filter(
      (c) => (c as Phaser.Physics.Arcade.Sprite).texture?.key === 'enemy',
    ) as Phaser.Physics.Arcade.Sprite[];
    const near = mites.find(
      (m) => m.active && !m.getData('calm') && Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y) < 56,
    );
    if (!near) return;
    near.setData('calm', true);
    near.setTint(0x88ddaa);
    near.setVelocity(0, 0);
    this.progress += 1;
    audio.sfx('talk');
    this.refreshStatus();
    if (this.progress >= 4) this.succeed();
  }

  private buildEmptiness(): void {
    this.need = 3;
    this.add.circle(480, 360, 90, 0xe8e0d0, 0.25).setStrokeStyle(2, 0xf3e6c8);
    const burdens = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      const b = burdens.create(200 + i * 100, 200, 'charm') as Phaser.Physics.Arcade.Image;
      b.setTint(0xaaaaaa);
      b.setData('carried', false);
    }
    let carrying: Phaser.Physics.Arcade.Image | null = null;
    this.physics.add.overlap(this.player, burdens, (_p, b) => {
      const burden = b as Phaser.Physics.Arcade.Image;
      if (carrying || burden.getData('placed') || burden.getData('carried')) return;
      carrying = burden;
      burden.setData('carried', true);
      (burden.body as Phaser.Physics.Arcade.Body).enable = false;
      audio.sfx('ui');
    });
    // Drop in circle via interact handled in update
    this.events.on('drop-burden', () => {
      if (!carrying || this.done) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, 480, 360);
      if (dist > 95) {
        this.game.events.emit('ninefold-toast', 'Place burdens inside the white circle.');
        return;
      }
      carrying.setPosition(480 + Phaser.Math.Between(-40, 40), 360 + Phaser.Math.Between(-40, 40));
      carrying.setData('placed', true);
      carrying.setData('carried', false);
      carrying.setTint(0xe8e0d0);
      carrying = null;
      this.progress += 1;
      audio.sfx('pickup');
      this.refreshStatus();
      if (this.progress >= 3) this.succeed();
    });
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (carrying?.active) carrying.setPosition(this.player.x + 12, this.player.y - 12);
      },
    });
  }

  private hit(): void {
    if (this.done || this.time.now < this.invulnUntil) return;
    this.invulnUntil = this.time.now + 700;
    this.lives -= 1;
    audio.sfx('hurt');
    this.cameras.main.shake(80, 0.005);
    this.player.setTint(0xff8888);
    this.time.delayedCall(150, () => this.player.clearTint());
    this.refreshStatus();
    if (this.lives <= 0) this.fail();
  }

  private succeed(): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('pickup');
    this.game.events.emit('ninefold-trial-complete', this.trialId);
    this.game.events.emit('ninefold-toast', this.meta.successToast);
    this.time.delayedCall(800, () => {
      this.scene.stop('mini-trial');
      this.scene.resume('world');
    });
  }

  private fail(): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('defeat');
    this.game.events.emit('ninefold-toast', 'The trial resets you. Try the shrine again.');
    this.time.delayedCall(800, () => {
      this.scene.stop('mini-trial');
      this.scene.resume('world');
    });
  }

  private swing(): void {
    if (this.swinging || this.done) return;
    this.swinging = true;
    audio.sfx('slash');
    const dist = 28;
    this.swordHit.setPosition(this.player.x + this.facing.x * dist, this.player.y + this.facing.y * dist);
    this.swordHit.setVisible(true);
    this.swordHit.body!.enable = true;
    this.time.delayedCall(140, () => {
      this.swordHit.setVisible(false);
      this.swordHit.body!.enable = false;
      this.swinging = false;
    });
  }

  update(): void {
    if (this.done || !this.player?.active) return;
    const f = inputBridge.sample(this);
    if (f.pauseJust) {
      this.fail();
      return;
    }
    if (f.interactJust) {
      if (this.trialId === 'harmony') {
        /* handled via key in build — also: */
        const guests = this.children.list.filter(
          (c) => (c as Phaser.Physics.Arcade.Image).texture?.key === 'npc',
        ) as Phaser.Physics.Arcade.Image[];
        this.harmonyTalk(guests);
      } else if (this.trialId === 'compassion') this.compassionTalk();
      else if (this.trialId === 'emptiness') this.events.emit('drop-burden');
    }
    if (f.swordJust) this.swing();

    const speed = 170;
    this.player.setVelocity(f.moveX * speed, f.moveY * speed);
    if (f.moveX || f.moveY) this.facing.set(f.moveX, f.moveY).normalize();

    if (this.trialId === 'stoa') {
      this.player.y = Phaser.Math.Clamp(this.player.y, 300, 420);
    }
  }
}
