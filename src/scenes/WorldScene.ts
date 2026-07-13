import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import {
  AGORA,
  PHILOSOPHIES,
  WORLD_H,
  WORLD_W,
  philosophyAt,
  regionLabel,
  type Philosophy,
} from '../data/philosophies';

type DialoguePayload = { speaker: string; text: string };

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private swordKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private muteKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private enemies!: Phaser.Physics.Arcade.Group;
  private npcs!: Phaser.Physics.Arcade.StaticGroup;
  private charms!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private swordHit!: Phaser.Physics.Arcade.Image;
  private swinging = false;
  private facing = new Phaser.Math.Vector2(0, 1);
  private hp = 5;
  private maxHp = 5;
  private charmsCollected = new Set<string>();
  private lastRegion = '';
  private talking = false;
  private invulnUntil = 0;

  constructor() {
    super('world');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBackgroundColor('#2a6f6b');

    this.buildTerrain();
    this.walls = this.physics.add.staticGroup();
    this.scatterProps();

    this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2 + 80, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(20, 24).setOffset(6, 6);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.swordHit = this.physics.add.image(-100, -100, 'sword');
    this.swordHit.setVisible(false);
    this.swordHit.body!.enable = false;

    this.npcs = this.physics.add.staticGroup();
    this.spawnMentors();

    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    this.charms = this.physics.add.group();
    this.spawnCharms();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.player, this.npcs);

    this.physics.add.overlap(this.player, this.charms, (_p, c) => {
      const charm = c as Phaser.Physics.Arcade.Image;
      const id = charm.getData('id') as string;
      if (this.charmsCollected.has(id)) return;
      this.charmsCollected.add(id);
      audio.sfx('pickup');
      charm.destroy();
      const name = charm.getData('name') as string;
      this.game.events.emit('ninefold-toast', `Virtue Charm: ${name}`);
      this.game.events.emit('ninefold-hud', this.hudState());
    });

    this.physics.add.overlap(this.swordHit, this.enemies, (_s, e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return;
      audio.sfx('defeat');
      enemy.destroy();
    });

    this.physics.add.overlap(this.player, this.enemies, () => {
      this.hurtPlayer();
    });

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey('W'),
      A: kb.addKey('A'),
      S: kb.addKey('S'),
      D: kb.addKey('D'),
    };
    this.swordKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.interactKey = kb.addKey('E');
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.muteKey = kb.addKey('M');
    this.pauseKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.talking) return;
      if (pointer.leftButtonDown()) this.swingSword(true);
    });

    this.game.events.emit('ninefold-hud', this.hudState());
    this.game.events.emit(
      'ninefold-toast',
      'You wake in Agora Grove. Visit the nine schools. Talk to mentors (E).',
    );

    // Beach wreck marker text
    this.add
      .text(WORLD_W / 2, WORLD_H / 2 + 200, 'Agora Grove', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '28px',
        color: '#f3e6c8',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0.85);
  }

  private hudState() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      charms: this.charmsCollected.size,
      region: regionLabel(this.player.x, this.player.y),
      muted: audio.isMuted(),
    };
  }

  private buildTerrain(): void {
    // Base grass
    for (let y = 0; y < WORLD_H; y += 48) {
      for (let x = 0; x < WORLD_W; x += 48) {
        const img = this.add.image(x + 24, y + 24, 'grass').setDepth(0);
        const phil = philosophyAt(x + 24, y + 24);
        if (phil) img.setTint(Phaser.Display.Color.GetColor(
          (phil.color >> 16) & 0xff,
          (phil.color >> 8) & 0xff,
          phil.color & 0xff,
        ));
      }
    }

    // Agora sand plaza
    const a = AGORA.bounds;
    for (let y = a.y + 120; y < a.y + a.h - 120; y += 48) {
      for (let x = a.x + 120; x < a.x + a.w - 120; x += 48) {
        this.add.image(x + 24, y + 24, 'sand').setDepth(0);
      }
    }

    // Soft water border
    for (let x = 0; x < WORLD_W; x += 48) {
      this.add.image(x + 24, 24, 'water').setDepth(0);
      this.add.image(x + 24, WORLD_H - 24, 'water').setDepth(0);
    }
    for (let y = 0; y < WORLD_H; y += 48) {
      this.add.image(24, y + 24, 'water').setDepth(0);
      this.add.image(WORLD_W - 24, y + 24, 'water').setDepth(0);
    }

    // Region labels
    for (const p of PHILOSOPHIES) {
      if (p.id === 'emptiness') continue;
      const cx = p.bounds.x + p.bounds.w / 2;
      const cy = p.bounds.y + 56;
      this.add
        .text(cx, cy, p.name, {
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '26px',
          color: '#f3e6c8',
          stroke: '#1a2a24',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(3)
        .setAlpha(0.9);
    }
    const e = PHILOSOPHIES.find((p) => p.id === 'emptiness')!;
    this.add
      .text(e.bounds.x + e.bounds.w / 2, e.bounds.y + 40, 'Emptiness Plateau', {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#1a2a24',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  private scatterProps(): void {
    const rng = (n: number) => Phaser.Math.Between(0, n);
    for (let i = 0; i < 90; i++) {
      const x = 80 + rng(WORLD_W - 160);
      const y = 80 + rng(WORLD_H - 160);
      // Keep agora clearer
      if (x > AGORA.bounds.x + 150 && x < AGORA.bounds.x + AGORA.bounds.w - 150 &&
          y > AGORA.bounds.y + 150 && y < AGORA.bounds.y + AGORA.bounds.h - 150) {
        continue;
      }
      const tree = this.add.image(x, y, 'tree').setDepth(5);
      const body = this.walls.create(x, y + 18, 'stone') as Phaser.Physics.Arcade.Sprite;
      body.setVisible(false);
      body.setSize(20, 16);
      body.refreshBody();
      void tree;
    }

    // Border walls (sea cliffs)
    for (let x = 0; x < WORLD_W; x += 48) {
      (this.walls.create(x + 24, 40, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
      (this.walls.create(x + 24, WORLD_H - 40, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
    }
    for (let y = 0; y < WORLD_H; y += 48) {
      (this.walls.create(40, y + 24, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
      (this.walls.create(WORLD_W - 40, y + 24, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
    }
  }

  private spawnMentors(): void {
    for (const p of PHILOSOPHIES) {
      const x = p.bounds.x + p.bounds.w / 2;
      const y = p.bounds.y + p.bounds.h / 2;
      const npc = this.npcs.create(x, y, 'npc') as Phaser.Physics.Arcade.Sprite;
      npc.setTint(p.color);
      npc.setData('speaker', p.mentor);
      npc.setData('text', p.greeting);
      npc.setData('school', p.name);
      npc.setDepth(8);
      npc.setSize(22, 22);

      this.add
        .text(x, y - 28, p.mentor, {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '14px',
          color: '#f3e6c8',
          backgroundColor: '#12302caa',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(9);
    }

    // Agora greeter
    const greeter = this.npcs.create(WORLD_W / 2, WORLD_H / 2 - 40, 'npc') as Phaser.Physics.Arcade.Sprite;
    greeter.setTint(0xe8b86d);
    greeter.setData('speaker', 'Ferry Keeper');
    greeter.setData('text', AGORA.greeting);
    greeter.setData('school', AGORA.name);
    greeter.setDepth(8);
    this.add
      .text(WORLD_W / 2, WORLD_H / 2 - 68, 'Ferry Keeper', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '14px',
        color: '#f3e6c8',
        backgroundColor: '#12302caa',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private spawnEnemies(): void {
    for (const p of PHILOSOPHIES) {
      if (p.id === 'emptiness') continue;
      for (let i = 0; i < 3; i++) {
        const x = p.bounds.x + 120 + Math.random() * (p.bounds.w - 240);
        const y = p.bounds.y + 120 + Math.random() * (p.bounds.h - 240);
        const e = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite;
        e.setDepth(8);
        e.setBounce(1, 1);
        e.setCollideWorldBounds(true);
        e.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
      }
    }
  }

  private spawnCharms(): void {
    for (const p of PHILOSOPHIES) {
      const x = p.bounds.x + p.bounds.w * 0.72;
      const y = p.bounds.y + p.bounds.h * 0.72;
      const c = this.charms.create(x, y, 'charm') as Phaser.Physics.Arcade.Image;
      c.setData('id', p.id);
      c.setData('name', p.charm);
      c.setDepth(7);
      this.tweens.add({
        targets: c,
        y: y - 6,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private hurtPlayer(): void {
    if (this.time.now < this.invulnUntil || this.talking) return;
    this.hp = Math.max(0, this.hp - 1);
    this.invulnUntil = this.time.now + 900;
    audio.sfx('hurt');
    this.cameras.main.shake(120, 0.004);
    this.player.setTint(0xff8888);
    this.time.delayedCall(200, () => this.player.clearTint());
    this.game.events.emit('ninefold-hud', this.hudState());
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.player.setPosition(WORLD_W / 2, WORLD_H / 2 + 80);
      this.game.events.emit('ninefold-toast', 'The Grove restores you. Try again, Seeker.');
      this.game.events.emit('ninefold-hud', this.hudState());
    }
  }

  private swingSword(fromMouse: boolean): void {
    if (this.swinging || this.talking) return;
    this.swinging = true;
    audio.sfx('slash');

    if (fromMouse) {
      const ptr = this.input.activePointer;
      const world = ptr.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.facing.set(world.x - this.player.x, world.y - this.player.y).normalize();
    }

    const dist = 28;
    const sx = this.player.x + this.facing.x * dist;
    const sy = this.player.y + this.facing.y * dist;
    this.swordHit.setPosition(sx, sy);
    this.swordHit.setVisible(true);
    this.swordHit.setRotation(Math.atan2(this.facing.y, this.facing.x));
    this.swordHit.body!.enable = true;
    (this.swordHit.body as Phaser.Physics.Arcade.Body).setSize(22, 22);

    this.time.delayedCall(140, () => {
      this.swordHit.setVisible(false);
      this.swordHit.body!.enable = false;
      this.swordHit.setPosition(-100, -100);
      this.swinging = false;
    });
  }

  private tryTalk(): void {
    if (this.talking) {
      this.talking = false;
      this.game.events.emit('ninefold-dialogue', null);
      return;
    }
    const nearby = this.npcs.getChildren().find((obj) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y) < 56;
    }) as Phaser.Physics.Arcade.Sprite | undefined;

    if (!nearby) {
      this.game.events.emit('ninefold-toast', 'No one nearby. Walk up to a mentor and press E.');
      return;
    }

    audio.sfx('talk');
    this.talking = true;
    const payload: DialoguePayload = {
      speaker: `${nearby.getData('speaker')} — ${nearby.getData('school')}`,
      text: nearby.getData('text') as string,
    };
    this.game.events.emit('ninefold-dialogue', payload);
  }

  update(): void {
    if (!this.player?.active) return;

    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      const muted = audio.toggleMute();
      this.game.events.emit('ninefold-toast', muted ? 'Music muted' : 'Music on');
      this.game.events.emit('ninefold-hud', this.hudState());
    }

    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.game.events.emit('ninefold-pause-toggle');
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.tryTalk();
    }

    if (this.talking) {
      this.player.setVelocity(0, 0);
      return;
    }

    const speed = 170;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
      this.player.setVelocity(v.x, v.y);
      this.facing.set(vx, vy).normalize();
    } else {
      this.player.setVelocity(0, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.swordKey)) this.swingSword(false);

    // Wander enemies gently
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.body) return;
      if (Math.random() < 0.01) {
        e.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
      }
    });

    const region = regionLabel(this.player.x, this.player.y);
    if (region !== this.lastRegion) {
      this.lastRegion = region;
      this.game.events.emit('ninefold-hud', this.hudState());
      const phil: Philosophy | null = philosophyAt(this.player.x, this.player.y);
      if (phil) {
        this.game.events.emit('ninefold-toast', `${phil.name}: ${phil.blurb}`);
      } else if (region === AGORA.name) {
        this.game.events.emit('ninefold-toast', 'Agora Grove — the heart of the isle');
      }
    }
  }
}
