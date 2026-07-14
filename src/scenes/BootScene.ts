import Phaser from 'phaser';
import { generateTextures } from '../assets/TextureFactory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.image('charm', 'assets/kenney/medals/flat_medal1.png');
  }

  create(): void {
    generateTextures(this);
    this.scene.start('title');
  }
}
