import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import {
  AGORA,
  PHILOSOPHIES,
  WORLD_H,
  WORLD_W,
  philosophyAt,
  regionLabel,
  type PhilosophyId,
} from '../data/philosophies';
import { ferryDocks, shrinePos, trialMeta, TRIALS } from '../data/trials';
import { inputBridge } from '../systems/InputBridge';
import { loadSave, writeSave, type DialogueLogEntry, type SaveData } from '../systems/SaveGame';

type DialoguePayload = { speaker: string; text: string };

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private npcs!: Phaser.Physics.Arcade.StaticGroup;
  private charms!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private swordHit!: Phaser.Physics.Arcade.Image;
  private swinging = false;
  private facing = new Phaser.Math.Vector2(0, 1);
  private hp = 5;
  private maxHp = 5;
  private charmsCollected = new Set<PhilosophyId>();
  private trialsCompleted = new Set<string>();
  private dialogueLog: DialogueLogEntry[] = [];
  private lastRegion = '';
  private talking = false;
  private foldOpen = false;
  private invulnUntil = 0;
  private saveTimer?: Phaser.Time.TimerEvent;
  private continueFromSave = false;

  constructor() {
    super('world');
  }

  init(data: { continue?: boolean }): void {
    this.continueFromSave = Boolean(data?.continue);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBackgroundColor('#2a6f6b');

    this.buildTerrain();
    this.walls = this.physics.add.staticGroup();
    this.scatterProps();

    const spawnX = WORLD_W / 2;
    const spawnY = WORLD_H / 2 + 80;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setDisplaySize(36, 46);
    this.player.setSize(20, 24).setOffset(8, 14);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.swordHit = this.physics.add.image(-100, -100, 'sword');
    this.swordHit.setVisible(false);
    this.swordHit.body!.enable = false;

    this.npcs = this.physics.add.staticGroup();
    this.spawnMentors();

    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    this.charms = this.physics.add.group();

    if (this.continueFromSave) this.applySave(loadSave());
    else {
      this.charmsCollected.clear();
      this.trialsCompleted.clear();
      this.dialogueLog = [];
    }

    this.spawnShrines();
    this.spawnFerries();
    this.spawnCharms();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.player, this.npcs);

    this.physics.add.overlap(this.player, this.charms, (_p, c) => {
      const charm = c as Phaser.Physics.Arcade.Image;
      const id = charm.getData('id') as PhilosophyId;
      if (this.charmsCollected.has(id)) return;
      this.charmsCollected.add(id);
      audio.sfx('pickup');
      charm.destroy();
      const name = charm.getData('name') as string;
      this.game.events.emit('ninefold-toast', `Virtue Charm: ${name}`);
      this.emitHud();
      this.persist();
    });

    this.physics.add.overlap(this.swordHit, this.enemies, (_s, e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return;
      audio.sfx('defeat');
      enemy.destroy();
    });

    this.physics.add.overlap(this.player, this.enemies, () => this.hurtPlayer());

    inputBridge.attach(this);
    this.input.keyboard?.enabled && this.input.addPointer(2);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.talking || this.foldOpen) return;
      const touchy =
        this.sys.game.device.os.android ||
        this.sys.game.device.os.iOS ||
        (window.matchMedia?.('(pointer: coarse)').matches ?? false);
      if (touchy && (pointer.x < 200 || pointer.x > this.scale.width - 160)) return;
      if (pointer.leftButtonDown()) this.swingSword(true);
    });

    this.game.events.on('ninefold-trial-complete', this.onTrialComplete, this);
    this.game.events.on('ninefold-touch', this.onTouch, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ninefold-trial-complete', this.onTrialComplete, this);
      this.game.events.off('ninefold-touch', this.onTouch, this);
      this.saveTimer?.remove(false);
    });

    this.saveTimer = this.time.addEvent({
      delay: 8000,
      loop: true,
      callback: () => this.persist(),
    });

    this.emitHud();
    this.game.events.emit(
      'ninefold-toast',
      this.continueFromSave
        ? 'Welcome back, Seeker. Your Fold remembers.'
        : 'Agora Grove — use ferries, find school shrines (E), N opens The Fold.',
    );
    // Avoid a second region-entry toast on the first update frame.
    this.lastRegion = regionLabel(this.player.x, this.player.y);

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

  private onTouch(payload: {
    moveX?: number;
    moveY?: number;
    sword?: boolean;
    interact?: boolean;
    fold?: boolean;
    mute?: boolean;
  }): void {
    if (payload.moveX != null && payload.moveY != null) {
      inputBridge.virtualMove.set(payload.moveX, payload.moveY);
    }
    if (payload.sword) inputBridge.virtualSword = true;
    if (payload.interact) inputBridge.virtualInteract = true;
    if (payload.fold) inputBridge.virtualFold = true;
    if (payload.mute) inputBridge.virtualMute = true;
  }

  private onTrialComplete(id: string): void {
    this.trialsCompleted.add(id);
    const philId = id as PhilosophyId;
    if (!this.charmsCollected.has(philId) && PHILOSOPHIES.some((p) => p.id === philId)) {
      this.charmsCollected.add(philId);
      this.charms.getChildren().forEach((obj) => {
        const c = obj as Phaser.Physics.Arcade.Image;
        if (c.getData('id') === philId) c.destroy();
      });
    }
    this.emitHud();
    this.persist();
  }

  private applySave(data: SaveData | null): void {
    if (!data) return;
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    this.charmsCollected = new Set(data.charms);
    this.trialsCompleted = new Set(data.trials);
    this.dialogueLog = data.dialogueLog ?? [];
    this.player.setPosition(data.x, data.y);
    if (data.muted !== audio.isMuted()) audio.toggleMute();
  }

  private persist(): void {
    if (!this.player?.active) return;
    const data: SaveData = {
      version: 1,
      hp: this.hp,
      maxHp: this.maxHp,
      charms: [...this.charmsCollected],
      trials: [...this.trialsCompleted],
      x: this.player.x,
      y: this.player.y,
      dialogueLog: this.dialogueLog.slice(-24),
      muted: audio.isMuted(),
      savedAt: Date.now(),
    };
    writeSave(data);
  }

  private emitHud(): void {
    this.game.events.emit('ninefold-hud', {
      hp: this.hp,
      maxHp: this.maxHp,
      charms: this.charmsCollected.size,
      region: this.player ? regionLabel(this.player.x, this.player.y) : 'Agora Grove',
      muted: audio.isMuted(),
      trials: this.trialsCompleted.size,
    });
  }

  private foldPayload() {
    return {
      charms: PHILOSOPHIES.map((p) => ({
        id: p.id,
        name: p.name,
        charm: p.charm,
        blurb: p.blurb,
        owned: this.charmsCollected.has(p.id),
        trialDone: this.trialsCompleted.has(p.id),
      })),
      log: this.dialogueLog.slice(-8).reverse(),
    };
  }

  private toggleFold(): void {
    this.foldOpen = !this.foldOpen;
    if (this.foldOpen) {
      this.talking = false;
      this.game.events.emit('ninefold-dialogue', null);
      this.game.events.emit('ninefold-fold', this.foldPayload());
      audio.sfx('ui');
    } else {
      this.game.events.emit('ninefold-fold', null);
    }
  }

  private buildTerrain(): void {
    for (let y = 0; y < WORLD_H; y += 48) {
      for (let x = 0; x < WORLD_W; x += 48) {
        const img = this.add.image(x + 24, y + 24, 'grass').setDisplaySize(48, 48).setDepth(0);
        const phil = philosophyAt(x + 24, y + 24);
        if (phil) {
          img.setTint(
            Phaser.Display.Color.GetColor(
              (phil.color >> 16) & 0xff,
              (phil.color >> 8) & 0xff,
              phil.color & 0xff,
            ),
          );
        }
      }
    }

    const a = AGORA.bounds;
    for (let y = a.y + 120; y < a.y + a.h - 120; y += 48) {
      for (let x = a.x + 120; x < a.x + a.w - 120; x += 48) {
        this.add.image(x + 24, y + 24, 'sand').setDisplaySize(48, 48).setDepth(0);
      }
    }

    for (let x = 0; x < WORLD_W; x += 48) {
      this.add.image(x + 24, 24, 'water').setDisplaySize(48, 48).setDepth(0);
      this.add.image(x + 24, WORLD_H - 24, 'water').setDisplaySize(48, 48).setDepth(0);
    }
    for (let y = 0; y < WORLD_H; y += 48) {
      this.add.image(24, y + 24, 'water').setDisplaySize(48, 48).setDepth(0);
      this.add.image(WORLD_W - 24, y + 24, 'water').setDisplaySize(48, 48).setDepth(0);
    }

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
      if (
        x > AGORA.bounds.x + 150 &&
        x < AGORA.bounds.x + AGORA.bounds.w - 150 &&
        y > AGORA.bounds.y + 150 &&
        y < AGORA.bounds.y + AGORA.bounds.h - 150
      ) {
        continue;
      }
      this.add.image(x, y, 'tree').setDisplaySize(48, 48).setDepth(5);
      const body = this.walls.create(x, y + 18, 'stone') as Phaser.Physics.Arcade.Sprite;
      body.setVisible(false);
      body.setSize(20, 16);
      body.refreshBody();
    }

    for (let x = 0; x < WORLD_W; x += 48) {
      (this.walls.create(x + 24, 40, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
      (this.walls.create(x + 24, WORLD_H - 40, 'stone') as Phaser.Physics.Arcade.Sprite)
        .setVisible(false)
        .refreshBody();
    }
    for (let y = 0; y < WORLD_H; y += 48) {
      (this.walls.create(40, y + 24, 'stone') as Phaser.Physics.Arcade.Sprite).setVisible(false).refreshBody();
      (this.walls.create(WORLD_W - 40, y + 24, 'stone') as Phaser.Physics.Arcade.Sprite)
        .setVisible(false)
        .refreshBody();
    }
  }

  private spawnMentors(): void {
    for (const p of PHILOSOPHIES) {
      const x = p.bounds.x + p.bounds.w / 2;
      const y = p.bounds.y + p.bounds.h / 2;
      const npc = this.npcs.create(x, y, 'npc') as Phaser.Physics.Arcade.Sprite;
      npc.setDisplaySize(36, 46);
      npc.setTint(p.color);
      npc.setData('speaker', p.mentor);
      npc.setData('text', p.greeting);
      npc.setData('school', p.name);
      npc.setData('kind', 'mentor');
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

    const greeter = this.npcs.create(WORLD_W / 2, WORLD_H / 2 - 40, 'npc') as Phaser.Physics.Arcade.Sprite;
    greeter.setDisplaySize(36, 46);
    greeter.setTint(0xe8b86d);
    greeter.setData('speaker', 'Ferry Keeper');
    greeter.setData('text', AGORA.greeting);
    greeter.setData('school', AGORA.name);
    greeter.setData('kind', 'mentor');
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

  private spawnShrines(): void {
    for (const t of TRIALS) {
      const { x, y } = shrinePos(t.id);
      const shrine = this.npcs.create(x, y, 'shrine') as Phaser.Physics.Arcade.Sprite;
      shrine.setDisplaySize(40, 48);
      const done = this.trialsCompleted.has(t.id);
      shrine.setData('speaker', `${t.id} shrine`);
      shrine.setData(
        'text',
        done ? `${t.title} complete. Enter again to retrain.` : `Press E — ${t.hint}`,
      );
      shrine.setData('school', t.title);
      shrine.setData('kind', 'trial-shrine');
      shrine.setData('trialId', t.id);
      shrine.setDepth(8);
      shrine.setTint(PHILOSOPHIES.find((p) => p.id === t.id)?.color ?? 0xe8b86d);
      this.add
        .text(x, y - 36, `${PHILOSOPHIES.find((p) => p.id === t.id)?.name ?? t.id} Shrine`, {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '14px',
          color: '#e8b86d',
          backgroundColor: '#12302caa',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(9);
    }
  }

  private spawnFerries(): void {
    for (const d of ferryDocks()) {
      const ferry = this.npcs.create(d.x, d.y, 'shrine') as Phaser.Physics.Arcade.Sprite;
      ferry.setDisplaySize(36, 40);
      ferry.setTint(0x4aa0c8);
      ferry.setData('speaker', 'Island Ferry');
      ferry.setData('text', `Sail to ${d.destLabel}?`);
      ferry.setData('school', d.label);
      ferry.setData('kind', 'ferry');
      ferry.setData('destX', d.destX);
      ferry.setData('destY', d.destY);
      ferry.setData('destLabel', d.destLabel);
      ferry.setDepth(8);
      this.add
        .text(d.x, d.y - 32, d.label, {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '12px',
          color: '#a8d8f0',
          backgroundColor: '#12302caa',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(9);
    }
  }

  private spawnEnemies(): void {
    for (const p of PHILOSOPHIES) {
      if (p.id === 'emptiness') continue;
      for (let i = 0; i < 3; i++) {
        const x = p.bounds.x + 120 + Math.random() * (p.bounds.w - 240);
        const y = p.bounds.y + 120 + Math.random() * (p.bounds.h - 240);
        const e = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite;
        e.setDisplaySize(34, 44);
        e.setDepth(8);
        e.setBounce(1, 1);
        e.setCollideWorldBounds(true);
        e.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
      }
    }
  }

  private spawnCharms(): void {
    for (const p of PHILOSOPHIES) {
      if (this.charmsCollected.has(p.id)) continue;
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
    if (this.time.now < this.invulnUntil || this.talking || this.foldOpen) return;
    this.hp = Math.max(0, this.hp - 1);
    this.invulnUntil = this.time.now + 900;
    audio.sfx('hurt');
    this.cameras.main.shake(120, 0.004);
    this.player.setTint(0xff8888);
    this.time.delayedCall(200, () => this.player.clearTint());
    this.emitHud();
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.player.setPosition(WORLD_W / 2, WORLD_H / 2 + 80);
      this.game.events.emit('ninefold-toast', 'The Grove restores you. Try again, Seeker.');
      this.emitHud();
      this.persist();
    }
  }

  private swingSword(fromMouse: boolean): void {
    if (this.swinging || this.talking || this.foldOpen) return;
    this.swinging = true;
    audio.sfx('slash');

    if (fromMouse) {
      const ptr = this.input.activePointer;
      const world = ptr.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.facing.set(world.x - this.player.x, world.y - this.player.y).normalize();
    }

    const dist = 28;
    this.swordHit.setPosition(this.player.x + this.facing.x * dist, this.player.y + this.facing.y * dist);
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
    if (this.foldOpen) {
      this.toggleFold();
      return;
    }
    if (this.talking) {
      this.talking = false;
      this.game.events.emit('ninefold-dialogue', null);
      return;
    }
    const nearby = this.npcs.getChildren().find((obj) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y) < 64;
    }) as Phaser.Physics.Arcade.Sprite | undefined;

    if (!nearby) {
      this.game.events.emit('ninefold-toast', 'No one nearby. Walk up to a mentor or shrine (E).');
      return;
    }

    if (nearby.getData('kind') === 'trial-shrine') {
      const trialId = nearby.getData('trialId') as PhilosophyId;
      if (!trialMeta(trialId)) return;
      audio.sfx('ui');
      this.persist();
      this.scene.pause('world');
      this.scene.launch('mini-trial', { trialId });
      return;
    }

    if (nearby.getData('kind') === 'ferry') {
      const destX = nearby.getData('destX') as number;
      const destY = nearby.getData('destY') as number;
      const destLabel = nearby.getData('destLabel') as string;
      audio.sfx('ferry');
      this.player.setPosition(destX, destY);
      this.cameras.main.flash(200, 40, 80, 90);
      this.game.events.emit('ninefold-toast', `Ferry arrives at ${destLabel}`);
      this.emitHud();
      this.persist();
      return;
    }

    audio.sfx('talk');
    this.talking = true;
    const payload: DialoguePayload = {
      speaker: `${nearby.getData('speaker')} — ${nearby.getData('school')}`,
      text: nearby.getData('text') as string,
    };
    this.dialogueLog.push({ ...payload, at: Date.now() });
    this.game.events.emit('ninefold-dialogue', payload);
    this.persist();
  }

  update(): void {
    if (!this.player?.active) return;
    if (this.scene.isPaused()) return;

    const f = inputBridge.sample(this);

    if (f.muteJust) {
      const muted = audio.toggleMute();
      this.game.events.emit('ninefold-toast', muted ? 'Music off' : 'Music on');
      this.emitHud();
      this.persist();
    }

    if (f.pauseJust) {
      if (this.talking) {
        this.talking = false;
        this.game.events.emit('ninefold-dialogue', null);
      } else if (this.foldOpen) {
        this.toggleFold();
      } else {
        this.game.events.emit('ninefold-pause-toggle');
      }
    }
    if (f.foldJust) this.toggleFold();
    if (f.interactJust) this.tryTalk();

    if (this.talking || this.foldOpen) {
      this.player.setVelocity(0, 0);
      return;
    }

    const speed = 170;
    if (f.moveX !== 0 || f.moveY !== 0) {
      this.player.setVelocity(f.moveX * speed, f.moveY * speed);
      this.facing.set(f.moveX, f.moveY).normalize();
    } else {
      this.player.setVelocity(0, 0);
    }

    if (f.swordJust) this.swingSword(false);

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.body) return;
      if (Math.random() < 0.01) {
        e.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
      }
    });

    const region = regionLabel(this.player.x, this.player.y);
    const phil = philosophyAt(this.player.x, this.player.y);
    audio.setRegion(phil?.id ?? (region === AGORA.name ? 'agora' : 'agora'));
    if (region !== this.lastRegion) {
      this.lastRegion = region;
      this.emitHud();
      if (phil) this.game.events.emit('ninefold-toast', `${phil.name}: ${phil.blurb}`);
      else if (region === AGORA.name) {
        this.game.events.emit('ninefold-toast', 'Agora Grove — ferries ring the plaza');
      }
    }
  }
}
