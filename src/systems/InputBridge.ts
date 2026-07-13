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

export interface CustomKeyBinds {
  up: number;
  left: number;
  down: number;
  right: number;
  sword: number;
  interact: number;
  fold: number;
  pause: number;
  mute: number;
}

export const DEFAULT_BINDS: CustomKeyBinds = {
  up: 87, // W
  left: 65, // A
  down: 83, // S
  right: 68, // D
  sword: 32, // SPACE
  interact: 69, // E
  fold: 78, // N
  pause: 27, // ESC
  mute: 77, // M
};

const LOCAL_STORAGE_KEY = 'ninefold-keybinds';

export function getFriendlyKeyName(code: number): string {
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(code);
  }
  if (code >= 48 && code <= 57) {
    return String.fromCharCode(code);
  }
  switch (code) {
    case 32: return 'SPACE';
    case 13: return 'ENTER';
    case 27: return 'ESC';
    case 38: return 'UP';
    case 40: return 'DOWN';
    case 37: return 'LEFT';
    case 39: return 'RIGHT';
    default:
      if (Phaser.Input.Keyboard.KeyCodes) {
        for (const [name, val] of Object.entries(Phaser.Input.Keyboard.KeyCodes)) {
          if (val === code) return name;
        }
      }
      return `KEY_${code}`;
  }
}

/** Aggregates keyboard, gamepad, and virtual touch into one frame. */
export class InputBridge {
  public currentScene: Phaser.Scene | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private registeredKeys: { [action: string]: Phaser.Input.Keyboard.Key } = {};
  private currentBinds: CustomKeyBinds = { ...DEFAULT_BINDS };

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

  getBinds(): CustomKeyBinds {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.up === 'number' &&
          typeof parsed.left === 'number' &&
          typeof parsed.down === 'number' &&
          typeof parsed.right === 'number' &&
          typeof parsed.sword === 'number' &&
          typeof parsed.interact === 'number' &&
          typeof parsed.fold === 'number' &&
          typeof parsed.pause === 'number' &&
          typeof parsed.mute === 'number'
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load keybinds', e);
    }
    return { ...DEFAULT_BINDS };
  }

  saveBinds(binds: CustomKeyBinds): void {
    this.currentBinds = { ...binds };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(binds));
    } catch (e) {
      console.error('Failed to save keybinds', e);
    }
  }

  registerKeys(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
    for (const action in this.registeredKeys) {
      const keyObj = this.registeredKeys[action];
      if (keyObj) {
        kb.removeKey(keyObj.keyCode);
      }
    }
    this.registeredKeys = {};

    for (const [action, keyCode] of Object.entries(this.currentBinds)) {
      this.registeredKeys[action] = kb.addKey(keyCode);
    }
  }

  attach(scene: Phaser.Scene): void {
    this.currentScene = scene;
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.currentBinds = this.getBinds();
    this.registerKeys(scene);

    scene.input.gamepad?.once('connected', () => {
      scene.game.events.emit('ninefold-toast', 'Gamepad connected');
    });
  }

  sample(scene: Phaser.Scene): InputFrame {
    let moveX = 0;
    let moveY = 0;

    const keyLeft = this.registeredKeys['left'];
    const keyRight = this.registeredKeys['right'];
    const keyUp = this.registeredKeys['up'];
    const keyDown = this.registeredKeys['down'];

    if (this.cursors.left.isDown || (keyLeft && keyLeft.isDown)) moveX -= 1;
    if (this.cursors.right.isDown || (keyRight && keyRight.isDown)) moveX += 1;
    if (this.cursors.up.isDown || (keyUp && keyUp.isDown)) moveY -= 1;
    if (this.cursors.down.isDown || (keyDown && keyDown.isDown)) moveY += 1;

    moveX += this.virtualMove.x;
    moveY += this.virtualMove.y;

    const pad = scene.input.gamepad?.getPad(0);

    const keySword = this.registeredKeys['sword'];
    const keyInteract = this.registeredKeys['interact'];
    const keyMute = this.registeredKeys['mute'];
    const keyPause = this.registeredKeys['pause'];
    const keyFold = this.registeredKeys['fold'];

    let swordJust = keySword ? Phaser.Input.Keyboard.JustDown(keySword) : false;
    let interactJust =
      (keyInteract ? Phaser.Input.Keyboard.JustDown(keyInteract) : false) || Phaser.Input.Keyboard.JustDown(this.enterKey);
    let muteJust = keyMute ? Phaser.Input.Keyboard.JustDown(keyMute) : false;
    let pauseJust = keyPause ? Phaser.Input.Keyboard.JustDown(keyPause) : false;
    let foldJust = keyFold ? Phaser.Input.Keyboard.JustDown(keyFold) : false;

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
