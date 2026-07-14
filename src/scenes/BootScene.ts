import Phaser from 'phaser';
import { generateTextures } from '../assets/TextureFactory';

/** Kenney CC0 keys from `public/assets/kenney/` (TextureFactory fills gaps). */
const KENNEY_IMAGES: Array<[string, string]> = [
  ['charm', 'assets/kenney/medals/flat_medal1.png'],
  ['player', 'assets/kenney/player.png'],
  ['npc', 'assets/kenney/npc.png'],
  ['enemy', 'assets/kenney/enemy.png'],
  ['grass', 'assets/kenney/grass.png'],
  ['sand', 'assets/kenney/sand.png'],
  ['stone', 'assets/kenney/stone.png'],
  ['water', 'assets/kenney/water.png'],
  ['tree', 'assets/kenney/tree.png'],
  ['shrine', 'assets/kenney/shrine.png'],
  ['heart', 'assets/kenney/heart.png'],
  ['title-bg', 'assets/kenney/title-bg.png'],
  ['btn', 'assets/kenney/btn.png'],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const [key, path] of KENNEY_IMAGES) {
      this.load.image(key, path);
    }
  }

  create(): void {
    generateTextures(this);
    this.scene.start('title');
  }
}
