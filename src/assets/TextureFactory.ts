import Phaser from 'phaser';

/** Runtime pixel textures — replaceable later with atlas files. */
export function generateTextures(scene: Phaser.Scene): void {
  const mk = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    draw(ctx);
    canvas.refresh();
  };

  mk('player', 32, 32, (ctx) => {
    ctx.fillStyle = '#2a4a3c';
    ctx.fillRect(8, 14, 16, 14);
    ctx.fillStyle = '#f0d2a8';
    ctx.fillRect(10, 4, 12, 12);
    ctx.fillStyle = '#c45c3a';
    ctx.fillRect(8, 2, 16, 4);
    ctx.fillStyle = '#1a2a24';
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
  });

  mk('sword', 24, 24, (ctx) => {
    ctx.fillStyle = '#d8dde8';
    ctx.fillRect(10, 2, 4, 14);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(8, 16, 8, 4);
    ctx.fillStyle = '#e8b86d';
    ctx.fillRect(9, 15, 6, 2);
  });

  mk('npc', 32, 32, (ctx) => {
    ctx.fillStyle = '#4a6a8a';
    ctx.fillRect(8, 14, 16, 14);
    ctx.fillStyle = '#f3e0c0';
    ctx.fillRect(10, 4, 12, 12);
    ctx.fillStyle = '#e8d48a';
    ctx.fillRect(8, 2, 16, 5);
    ctx.fillStyle = '#1a2a24';
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
  });

  mk('enemy', 28, 28, (ctx) => {
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath();
    ctx.ellipse(14, 16, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07070';
    ctx.fillRect(8, 12, 4, 4);
    ctx.fillRect(16, 12, 4, 4);
  });

  mk('charm', 20, 20, (ctx) => {
    ctx.fillStyle = '#e8b86d';
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(18, 10);
    ctx.lineTo(10, 18);
    ctx.lineTo(2, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.fillRect(8, 8, 4, 4);
  });

  mk('grass', 48, 48, (ctx) => {
    ctx.fillStyle = '#4f8f62';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#5ea472';
    for (let i = 0; i < 12; i++) {
      const x = (i * 17) % 48;
      const y = (i * 11) % 48;
      ctx.fillRect(x, y, 3, 5);
    }
  });

  mk('sand', 48, 48, (ctx) => {
    ctx.fillStyle = '#e6d3a3';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#dcc58e';
    ctx.fillRect(8, 12, 2, 2);
    ctx.fillRect(28, 30, 2, 2);
    ctx.fillRect(40, 8, 2, 2);
  });

  mk('stone', 48, 48, (ctx) => {
    ctx.fillStyle = '#8a9098';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(4, 4, 18, 14);
    ctx.fillStyle = '#7a8088';
    ctx.fillRect(24, 22, 20, 18);
  });

  mk('water', 48, 48, (ctx) => {
    ctx.fillStyle = '#2f7f8e';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#3d97a6';
    ctx.fillRect(4, 10, 16, 3);
    ctx.fillRect(24, 28, 18, 3);
  });

  mk('tree', 48, 64, (ctx) => {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(20, 40, 8, 22);
    ctx.fillStyle = '#2f6b3c';
    ctx.beginPath();
    ctx.ellipse(24, 28, 20, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f8a4e';
    ctx.beginPath();
    ctx.ellipse(24, 20, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  mk('heart', 16, 16, (ctx) => {
    ctx.fillStyle = '#d64545';
    ctx.fillRect(2, 4, 5, 5);
    ctx.fillRect(9, 4, 5, 5);
    ctx.fillRect(4, 7, 8, 6);
    ctx.fillRect(6, 12, 4, 2);
  });

  mk('gust', 48, 24, (ctx) => {
    ctx.fillStyle = 'rgba(200,220,240,0.85)';
    ctx.beginPath();
    ctx.moveTo(4, 12);
    ctx.quadraticCurveTo(18, 2, 32, 10);
    ctx.quadraticCurveTo(40, 14, 46, 8);
    ctx.quadraticCurveTo(36, 20, 20, 18);
    ctx.quadraticCurveTo(10, 16, 4, 12);
    ctx.fill();
  });

  mk('shrine', 40, 48, (ctx) => {
    ctx.fillStyle = '#c8d0d8';
    ctx.fillRect(14, 18, 12, 28);
    ctx.fillStyle = '#e8b86d';
    ctx.fillRect(8, 10, 24, 10);
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(16, 4, 8, 8);
  });
}
