import Phaser from 'phaser';

export interface InputFrame {
  moveX: number;
  moveY: number;
  swordJust: boolean;
  interactJust: boolean;
  muteJust: boolean;
  pauseJust: boolean;
  foldJust: boolean;
}

/** Aggregates keyboard, gamepad, and virtual touch into one frame. */
export class InputBridge {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private swordKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private muteKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private foldKey!: Phaser.Input.Keyboard.Key;
  private padSwordPrev = false;
  private padInteractPrev = false;
  private padMutePrev = false;
  private padPausePrev = false;
  private padFoldPrev = false;

  /** Virtual stick / buttons — written by UIScene touch layer */
  virtualMove = new Phaser.Math.Vector2(0, 0);
  virtualSword = false;
  virtualInteract = false;
  virtualFold = false;
  private virtualSwordPrev = false;
  private virtualInteractPrev = false;
  private virtualFoldPrev = false;

  attach(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
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
    this.foldKey = kb.addKey('N');
    scene.input.gamepad?.once('connected', () => {
      scene.game.events.emit('ninefold-toast', 'Gamepad connected');
    });
  }

  sample(scene: Phaser.Scene): InputFrame {
    let moveX = 0;
    let moveY = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) moveX -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) moveX += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) moveY -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) moveY += 1;

    moveX += this.virtualMove.x;
    moveY += this.virtualMove.y;

    const pad = scene.input.gamepad?.getPad(0);
    let swordJust = Phaser.Input.Keyboard.JustDown(this.swordKey);
    let interactJust =
      Phaser.Input.Keyboard.JustDown(this.interactKey) || Phaser.Input.Keyboard.JustDown(this.enterKey);
    let muteJust = Phaser.Input.Keyboard.JustDown(this.muteKey);
    let pauseJust = Phaser.Input.Keyboard.JustDown(this.pauseKey);
    let foldJust = Phaser.Input.Keyboard.JustDown(this.foldKey);

    if (pad) {
      const stickX = Math.abs(pad.leftStick.x) > 0.18 ? pad.leftStick.x : 0;
      const stickY = Math.abs(pad.leftStick.y) > 0.18 ? pad.leftStick.y : 0;
      moveX += stickX;
      moveY += stickY;
      if (pad.left) moveX -= 1;
      if (pad.right) moveX += 1;
      if (pad.up) moveY -= 1;
      if (pad.down) moveY += 1;

      const a = pad.A;
      const x = pad.X;
      const start = pad.buttons[9]?.pressed ?? false;
      const select = pad.buttons[8]?.pressed ?? false;
      const yBtn = pad.Y;

      if (a && !this.padSwordPrev) swordJust = true;
      if (x && !this.padInteractPrev) interactJust = true;
      if (select && !this.padMutePrev) muteJust = true;
      if (start && !this.padPausePrev) pauseJust = true;
      if (yBtn && !this.padFoldPrev) foldJust = true;

      this.padSwordPrev = a;
      this.padInteractPrev = x;
      this.padMutePrev = select;
      this.padPausePrev = start;
      this.padFoldPrev = yBtn;
    }

    if (this.virtualSword && !this.virtualSwordPrev) swordJust = true;
    if (this.virtualInteract && !this.virtualInteractPrev) interactJust = true;
    if (this.virtualFold && !this.virtualFoldPrev) foldJust = true;
    this.virtualSwordPrev = this.virtualSword;
    this.virtualInteractPrev = this.virtualInteract;
    this.virtualFoldPrev = this.virtualFold;
    this.virtualSword = false;
    this.virtualInteract = false;
    this.virtualFold = false;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }
    }

    return { moveX, moveY, swordJust, interactJust, muteJust, pauseJust, foldJust };
  }
}

export const inputBridge = new InputBridge();
