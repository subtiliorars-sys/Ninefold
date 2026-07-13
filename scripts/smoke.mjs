import { chromium } from 'playwright';

const base = process.env.SMOKE_URL ?? 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });

try {
  await page.goto(base, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const canvas = await page.$('canvas');
  if (!canvas) throw new Error('No canvas element — Phaser did not boot');

  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { width: c?.width ?? 0, height: c?.height ?? 0 };
  });
  console.log('BOOT_OK canvas', info.width, 'x', info.height);

  await page.screenshot({ path: 'docs/smoke-title.png' });
  console.log('SHOT docs/smoke-title.png');

  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'docs/smoke-world.png' });
  console.log('SHOT docs/smoke-world.png (after Enter → world)');

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/smoke-actions.png' });
  console.log('SHOT docs/smoke-actions.png (move+sword+talk)');

  console.log('SMOKE_PASS');
} catch (err) {
  console.error('SMOKE_FAIL', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
