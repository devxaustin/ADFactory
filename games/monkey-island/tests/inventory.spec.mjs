import { test, expect, snapshot } from './helpers.mjs';

test('new game has empty inventory, full hearts and no progression', async ({ page }) => {
  expect(await snapshot(page)).toEqual({ inventory: [], flags: [], hearts: 3, deaths: 0, objective: 'Explore the island. Find a way off.' });
});

test('non-stackable items remain unique', async ({ page }) => {
  await page.evaluate(() => { __state.add('axe'); __state.add('axe'); });
  expect((await snapshot(page)).inventory).toEqual([{ id: 'axe', count: 1 }]);
});

test('wood stacks and supports quantity requirements', async ({ page }) => {
  expect(await page.evaluate(() => { __state.add('wood', 2); __state.add('wood', 3); return { count: __state.count('wood'), five: __state.has('wood', 5), six: __state.has('wood', 6) }; })).toEqual({ count: 5, five: true, six: false });
});

test('removing an unavailable quantity preserves inventory', async ({ page }) => {
  expect(await page.evaluate(() => { __state.add('wood', 2); return { removed: __state.remove('wood', 3), count: __state.count('wood') }; })).toEqual({ removed: false, count: 2 });
});

test('removing the last item clears its inventory slot', async ({ page }) => {
  expect(await page.evaluate(() => { __state.add('rope'); return __state.remove('rope'); })).toBe(true);
  expect((await snapshot(page)).inventory).toEqual([]);
});

test('successful inventory mutations notify observers', async ({ page }) => {
  expect(await page.evaluate(() => { let changes = 0; const listener = () => changes++; __state.on('change', listener); __state.add('wood'); __state.remove('wood'); __state.off('change', listener); return changes; })).toBe(2);
});

test('movement responds to the real keyboard', async ({ page }) => {
  const before = await page.evaluate(() => __game.scene.getScene('Location').player.x);
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => __game.scene.getScene('Location').player.x)).toBeGreaterThan(before + 5);
  await page.keyboard.up('d');
});
