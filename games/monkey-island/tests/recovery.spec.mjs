import { test, expect, snapshot, visit, closeDialogue, interact } from './helpers.mjs';

test('health cannot fall below zero', async ({ page }) => {
  expect(await page.evaluate(() => [__state.hurt(), __state.hurt(), __state.hurt(), __state.hurt()])).toEqual([2, 1, 0, 0]);
});

test('death returns to beach with full hearts and retained progress', async ({ page }) => {
  await page.evaluate(() => { __state.add('axe'); __state.add('wood', 2); __state.setFlag('villager_helped'); __state.bump('hits:beach-tree'); __state.hurt(); __state.hurt(); });
  await visit(page, 'jungle');
  await page.evaluate(() => {
    const scene = __game.scene.getScene('Location');
    const target = scene.spawned.find(s => s.def.id === 'jungle-tiger');
    scene.failEncounter(target.def, target.def.trade);
  });
  expect((await snapshot(page)).hearts).toBe(0);
  await closeDialogue(page);
  await page.waitForFunction(() => {
    const scene = __game.scene.getScene('Location');
    return scene.def.id === 'beach' && !scene.leaving && __state.deaths === 1;
  });
  const state = await snapshot(page);
  expect(state.hearts).toBe(3);
  expect(state.deaths).toBe(1);
  expect(state.inventory).toEqual([{ id: 'axe', count: 1 }, { id: 'wood', count: 2 }]);
  expect(state.flags).toContain('villager_helped');
  expect(await page.evaluate(() => __state.bump('hits:beach-tree'))).toBe(2);
});

test('actual ending replay resets inventory, flags, health, deaths and counters', async ({ page }) => {
  await page.evaluate(() => {
    __state.add('wood', 5); __state.add('rope'); __state.add('sail');
    __state.setFlag('taken:beach-axe'); __state.setFlag('chopped:beach-tree');
    __state.bump('hits:beach-tree'); __state.bump('attempts:tiger_fed');
    __state.die(); __state.hurt();
  });
  await visit(page, 'dock'); await interact(page, 'dock-raft'); await closeDialogue(page);
  await page.waitForFunction(() => __game.scene.isActive('End'));
  await page.waitForTimeout(1_000); // EndScene intentionally delays replay input.
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => __game.scene.isActive('Title'));
  await page.keyboard.press('e');
  await page.waitForFunction(() => __game.scene.isActive('Location'));
  expect(await snapshot(page)).toEqual({ inventory: [], flags: [], hearts: 3, deaths: 0, objective: 'Explore the island. Find a way off.' });
  expect(await page.evaluate(() => ({ hits: __state.bump('hits:beach-tree'), attempts: __state.bump('attempts:tiger_fed'), axe: __game.scene.getScene('Location').spawned.some(s => s.def.id === 'beach-axe'), tree: __game.scene.getScene('Location').spawned.some(s => s.def.id === 'beach-tree') }))).toEqual({ hits: 1, attempts: 1, axe: true, tree: true });
});
