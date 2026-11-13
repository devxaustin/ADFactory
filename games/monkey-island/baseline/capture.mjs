import { test, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { visit, interact, closeDialogue } from '../tests/helpers.mjs';

// Explicit capture command only. Never runs in the regression CI project.
// This writes visual records, not replacement game assets or golden-pixel assertions.
test('capture the unchanged game for human comparison', async ({ page, browser }) => {
  const output = fileURLToPath(new URL('../docs/baseline/screenshots/', import.meta.url));
  await mkdir(output, { recursive: true });
  const captures = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const capture = async (name, note) => {
    const filename = `${name}.png`;
    await page.screenshot({ path: join(output, filename) });
    const bytes = await readFile(join(output, filename));
    captures.push({ file: `screenshots/${filename}`, sha256: createHash('sha256').update(bytes).digest('hex'), viewport: page.viewportSize(), note });
  };
  await page.goto('/?debug&crt=0');
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
  await page.waitForTimeout(500);
  await capture('title', 'Title screen, CRT off.');
  await page.keyboard.press('e');
  await page.waitForFunction(() => __game.scene.isActive('Location') && __game.scene.isActive('Hud'));
  for (const id of ['beach', 'jungle', 'village', 'volcano', 'dock']) {
    await visit(page, id);
    await page.waitForTimeout(2_000); // Let the location banner fade for a clear art reference.
    await capture(id, 'Pristine location staged by debug scene restart; no quest completion implied. CRT off.');
  }
  await visit(page, 'beach');
  await page.waitForTimeout(2_000);
  await page.evaluate(() => document.documentElement.classList.remove('no-crt'));
  await capture('beach-crt', 'Same beach with the existing CRT effect enabled.');
  await page.evaluate(() => document.documentElement.classList.add('no-crt'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await capture('portrait', 'Portrait canvas-fit reference only; does not establish touch playability.');
  await page.setViewportSize({ width: 960, height: 540 });
  for (const encounter of [
    { location: 'jungle', target: 'jungle-tiger', item: 'cheesesteak', key: 'mg-dodge' },
    { location: 'volcano', target: 'volcano-monkeys', item: 'bananas', key: 'mg-catch' },
  ]) {
    await page.evaluate(item => __state.add(item), encounter.item);
    await visit(page, encounter.location);
    await interact(page, encounter.target);
    await closeDialogue(page);
    await page.waitForFunction(key => __game.scene.isActive(key), encounter.key);
    await page.waitForTimeout(600);
    await capture(encounter.key, 'Real encounter introduction launched through its trade; inventory seeded for staging. CRT off.');
    await page.evaluate(key => { __game.scene.getScene(key).scene.stop(); __game.scene.getScene('Hud').setMinigame(); }, encounter.key);
  }
  await page.evaluate(() => {
    __game.scene.stop('Hud');
    __game.scene.getScene('Location').scene.start('End');
  });
  await page.waitForFunction(() => __game.scene.isActive('End'));
  await page.waitForTimeout(1_000);
  await capture('ending', 'Ending staged directly, not evidence of an unaided completed playthrough. CRT off.');
  expect(errors).toEqual([]);
  const manifest = {
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    capturedAt: new Date().toISOString(),
    browser: browser.version(),
    renderer: await page.evaluate(() => __game.renderer.type === 2 ? 'WebGL' : 'Canvas'),
    logicalResolution: { width: 480, height: 270 },
    method: 'Real Phaser renderer in Playwright Chromium; debug-staged scenes. Human comparison references, not pixel-perfect regression expectations.',
    captures,
  };
  await writeFile(join(output, '../manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  expect(captures).toHaveLength(11);
});
