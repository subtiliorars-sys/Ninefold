import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { StoaTrialScene } from './scenes/StoaTrialScene';

const parent = document.getElementById('game-root') ?? undefined;

new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  width: 960,
  height: 720,
  backgroundColor: '#1a3d3a',
  pixelArt: true,
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, WorldScene, UIScene, StoaTrialScene],
});
