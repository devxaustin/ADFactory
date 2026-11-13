import { test, expect, snapshot, visit, closeDialogue, interact, winEncounter } from './helpers.mjs';

test('picked-up items stay removed when revisiting a location', async ({ page }) => {
  await interact(page, 'beach-axe');
  await closeDialogue(page);
  await visit(page, 'jungle');
  await visit(page, 'beach');
  expect((await snapshot(page)).inventory).toEqual([{ id: 'axe', count: 1 }]);
  expect(await page.evaluate(() => __game.scene.getScene('Location').spawned.some(s => s.def.id === 'beach-axe'))).toBe(false);
});

test('villager cannot trade without a medkit', async ({ page }) => {
  await visit(page, 'village');
  await interact(page, 'village-villager');
  await closeDialogue(page);
  expect((await snapshot(page)).flags).not.toContain('villager_helped');
  expect((await snapshot(page)).inventory).toEqual([]);
});

test('villager consumes medkit and gives rope exactly once', async ({ page }) => {
  await visit(page, 'village');
  await interact(page, 'village-medkit');
  await closeDialogue(page);
  await interact(page, 'village-villager');
  await closeDialogue(page);
  expect((await snapshot(page)).inventory).toEqual([{ id: 'rope', count: 1 }]);
  expect((await snapshot(page)).flags).toContain('villager_helped');
  // A second medkit must not be consumed by the completed trade.
  await page.evaluate(() => __state.add('medkit'));
  await interact(page, 'village-villager');
  await closeDialogue(page);
  expect(await page.evaluate(() => ({ medkit: __state.count('medkit'), rope: __state.count('rope') }))).toEqual({ medkit: 1, rope: 1 });
});

for (const encounter of [
  { location: 'jungle', target: 'jungle-tiger', item: 'cheesesteak', key: 'mg-dodge', flag: 'tiger_fed' },
  { location: 'volcano', target: 'volcano-monkeys', item: 'bananas', key: 'mg-catch', flag: 'monkeys_fed' },
]) {
  test(`${encounter.key} failure loses one heart but keeps its trade item`, async ({ page }) => {
    await page.evaluate(item => __state.add(item), encounter.item);
    await visit(page, encounter.location);
    await interact(page, encounter.target);
    await closeDialogue(page);
    await page.waitForFunction(key => __game.scene.isActive(key), encounter.key);
    await page.evaluate(key => __game.scene.getScene(key).lose('Test result'), encounter.key);
    await page.waitForFunction(key => !__game.scene.isActive(key), encounter.key);
    await closeDialogue(page);
    expect((await snapshot(page)).hearts).toBe(2);
    expect((await snapshot(page)).inventory).toEqual([{ id: encounter.item, count: 1 }]);
    expect((await snapshot(page)).flags).not.toContain(encounter.flag);
  });
}

test('tiger success consumes food and removes the gate and tiger', async ({ page }) => {
  await page.evaluate(() => __state.add('cheesesteak'));
  await visit(page, 'jungle');
  expect(await page.evaluate(() => __game.scene.getScene('Location').gates.length)).toBe(1);
  await winEncounter(page, 'jungle-tiger');
  expect((await snapshot(page)).flags).toContain('tiger_fed');
  expect((await snapshot(page)).inventory).toEqual([]);
  expect(await page.evaluate(() => ({ gates: __game.scene.getScene('Location').gates.length, tiger: __game.scene.getScene('Location').spawned.some(s => s.def.id === 'jungle-tiger') }))).toEqual({ gates: 0, tiger: false });
  await visit(page, 'beach');
  await visit(page, 'jungle');
  expect(await page.evaluate(() => __game.scene.getScene('Location').gates.length)).toBe(0);
});

test('monkey success consumes bananas and grants the sail', async ({ page }) => {
  await page.evaluate(() => __state.add('bananas'));
  await visit(page, 'volcano');
  await winEncounter(page, 'volcano-monkeys');
  expect((await snapshot(page)).flags).toContain('monkeys_fed');
  expect((await snapshot(page)).inventory).toEqual([{ id: 'sail', count: 1 }]);
});

test('chopping without an axe grants no wood or chop progress', async ({ page }) => {
  await interact(page, 'beach-tree');
  await closeDialogue(page);
  expect((await snapshot(page)).inventory).toEqual([]);
  await page.evaluate(() => __state.add('axe'));
  await interact(page, 'beach-tree');
  await interact(page, 'beach-tree');
  expect(await page.evaluate(() => __state.count('wood'))).toBe(0);
});

test('three axe swings yield one wood and a persistent stump', async ({ page }) => {
  await page.evaluate(() => __state.add('axe'));
  await interact(page, 'beach-tree');
  await interact(page, 'beach-tree');
  expect(await page.evaluate(() => __state.count('wood'))).toBe(0);
  await interact(page, 'beach-tree');
  expect(await page.evaluate(() => __state.count('wood'))).toBe(1);
  expect((await snapshot(page)).flags).toContain('chopped:beach-tree');
  await visit(page, 'jungle');
  await visit(page, 'beach');
  expect(await page.evaluate(() => {
    const scene = __game.scene.getScene('Location');
    return { tree: scene.spawned.some(s => s.def.id === 'beach-tree'), stumps: scene.children.list.filter(s => s.texture?.key === 'stump').length };
  })).toEqual({ tree: false, stumps: 1 });
});

for (const missing of ['wood', 'rope', 'sail']) {
  test(`raft refuses construction when missing ${missing}`, async ({ page }) => {
    await page.evaluate(missing => {
      __state.add('wood', missing === 'wood' ? 4 : 5);
      if (missing !== 'rope') __state.add('rope');
      if (missing !== 'sail') __state.add('sail');
    }, missing);
    await visit(page, 'dock');
    const before = await snapshot(page);
    await interact(page, 'dock-raft');
    await closeDialogue(page);
    expect(await snapshot(page)).toEqual(before);
    expect(await page.evaluate(() => __game.scene.isActive('Location'))).toBe(true);
  });
}

test('raft consumes exactly five wood, rope and sail before escape', async ({ page }) => {
  await page.evaluate(() => { __state.add('axe'); __state.add('wood', 6); __state.add('rope'); __state.add('sail'); });
  await visit(page, 'dock');
  await interact(page, 'dock-raft');
  expect((await snapshot(page)).inventory).toEqual([{ id: 'axe', count: 1 }, { id: 'wood', count: 1 }]);
  expect((await snapshot(page)).flags).toContain('raft_built');
  await closeDialogue(page);
  await page.waitForFunction(() => __game.scene.isActive('End'));
  expect((await snapshot(page)).flags).toContain('escaped');
  expect(await page.evaluate(() => __game.scene.isActive('Hud'))).toBe(false);
});

test('complete authored resource route reaches the ending', async ({ page }) => {
  for (const id of ['beach-axe', 'beach-cheesesteak']) { await interact(page, id); await closeDialogue(page); }
  await visit(page, 'jungle');
  await winEncounter(page, 'jungle-tiger');
  await interact(page, 'jungle-bananas'); await closeDialogue(page);
  await visit(page, 'village');
  await interact(page, 'village-medkit'); await closeDialogue(page);
  await interact(page, 'village-villager'); await closeDialogue(page);
  await visit(page, 'volcano'); await winEncounter(page, 'volcano-monkeys');
  // Visit authored trees, never inject raft materials into the state.
  for (const [area, ids] of [
    ['beach', ['beach-tree']], ['jungle', ['jungle-tree-1', 'jungle-tree-2']],
    ['village', ['village-tree-1', 'village-tree-2']],
  ]) {
    await visit(page, area);
    for (const id of ids) for (let swing = 0; swing < 3; swing++) await interact(page, id);
  }
  expect(await page.evaluate(() => __state.count('wood'))).toBe(5);
  await visit(page, 'dock'); await interact(page, 'dock-raft'); await closeDialogue(page);
  await page.waitForFunction(() => __game.scene.isActive('End'));
  expect((await snapshot(page)).flags).toEqual(expect.arrayContaining(['tiger_fed', 'villager_helped', 'monkeys_fed', 'raft_built', 'escaped']));
});
