import { test, expect, visit, interact, closeDialogue, snapshot } from './helpers.mjs';

test('Beach loads modular terrain with the redesigned player', async ({ page }) => {
  const view = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return {
      terrain: scene.children.getByName('beach-ground')?.displayTexture.key ?? null,
      player: scene.player.texture.key,
    };
  });
  expect(view).toEqual({ terrain: 'beach-sand-c', player: 'adventure-player' });
});

test('Beach renders two separate rocks with the baseline solid footprints', async ({ page }) => {
  const rocks = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return ['a', 'b'].map(id => {
      const visual = scene.children.getByName(`beach-rock-${id}`);
      const body = scene.children.getByName(`beach-rock-${id}-collider`)?.body;
      return { texture: visual?.texture.key ?? null, rect: body ? [body.x, body.y, body.width, body.height] : null };
    });
  });
  expect(rocks).toEqual([
    { texture: 'beach-rock-a', rect: [150, 90, 32, 32] },
    { texture: 'beach-rock-b', rect: [300, 170, 48, 32] },
  ]);
});

test('Beach water cycles real exported textures without changing its collision boundary', async ({ page }) => {
  const first = await page.evaluate(() => window.__game.scene.getScene('Location').children.getByName('beach-water-deep')?.displayTexture.key ?? null);
  expect(first).toEqual(expect.stringMatching(/^beach-water-deep-[0-3]$/));
  await expect.poll(() => page.evaluate(() => window.__game.scene.getScene('Location').children.getByName('beach-water-deep').displayTexture.key)).not.toBe(first);
  expect(await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    const b = scene.children.getByName('beach-water-collider').body;
    return [b.x, b.y, b.width, b.height];
  })).toEqual([0, 0, 480, 40]);
});

test('Beach skins pickups and palm without moving their gameplay bodies', async ({ page }) => {
  await page.waitForTimeout(100);
  const props = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return scene.spawned.map(({ def, sprite }) => ({ id: def.id, key: sprite.texture.key,
      size: [sprite.body.width, sprite.body.height],
      treeRect: def.kind === 'tree' ? [sprite.body.x, sprite.body.y, sprite.body.width, sprite.body.height] : null }));
  });
  expect(props).toEqual([
    { id: 'beach-axe', key: 'beach-axe', size: [10, 10], treeRect: null },
    { id: 'beach-cheesesteak', key: 'beach-cheesesteak', size: [10, 10], treeRect: null },
    { id: 'beach-tree', key: 'beach-palm', size: [10, 6], treeRect: [415, 222, 10, 6] },
  ]);
});

test('Chopping replaces the palm with the new stump and persists on revisit', async ({ page }) => {
  await interact(page, 'beach-axe');
  await closeDialogue(page);
  for (let hit = 0; hit < 3; hit++) await interact(page, 'beach-tree');
  const state = await snapshot(page);
  expect(state.flags).toContain('chopped:beach-tree');
  expect(state.inventory.find(slot => slot.id === 'wood')?.count).toBe(1);
  const read = () => page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return { stump: scene.children.getByName('beach-stump')?.texture.key ?? null,
      tree: scene.spawned.some(s => s.def.id === 'beach-tree'),
      oldShadow: !!scene.children.getByName('beach-tree-shadow') };
  });
  expect(await read()).toEqual({ stump: 'beach-stump', tree: false, oldShadow: false });
  await visit(page, 'jungle');
  await visit(page, 'beach');
  expect(await read()).toEqual({ stump: 'beach-stump', tree: false, oldShadow: false });
});

test('Beach foliage frames a clearly marked, collision-free east approach', async ({ page }) => {
  const view = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return { path: !!scene.children.getByName('beach-exit-path'),
      bushes: scene.children.list.filter(c => c.texture?.key === 'beach-bush').length,
      ferns: scene.children.list.filter(c => c.texture?.key === 'beach-fern').length,
      flowers: scene.children.list.filter(c => c.texture?.key === 'beach-flower').length,
      blocked: scene.physics.world.staticBodies.entries.some(b => b.x < 480 && b.right > 440 && b.y < 165 && b.bottom > 105) };
  });
  expect(view.path).toBe(true);
  expect(view.bushes).toBeGreaterThanOrEqual(10);
  expect(view.ferns).toBeGreaterThanOrEqual(3);
  expect(view.flowers).toBeGreaterThanOrEqual(2);
  expect(view.blocked).toBe(false);
});

for (const [id, rect] of [['a', [150, 90, 32, 32]], ['b', [300, 170, 48, 32]]]) {
  for (const side of ['left', 'right', 'above', 'below']) {
    test(`Rock ${id} blocks a real keyboard approach from ${side}`, async ({ page }) => {
      const [x, y, w, h] = rect;
      const setup = {
        left: { position: [x - 12, y + h / 2 - 9], key: 'd', edge: 'right', wall: x },
        right: { position: [x + w + 12, y + h / 2 - 9], key: 'a', edge: 'left', wall: x + w },
        above: { position: [x + w / 2, y - 22], key: 's', edge: 'bottom', wall: y },
        below: { position: [x + w / 2, y + h + 4], key: 'w', edge: 'top', wall: y + h },
      }[side];
      await page.evaluate(p => window.__game.scene.getScene('Location').player.body.reset(...p), setup.position);
      await page.keyboard.down(setup.key);
      try {
        await expect.poll(() => page.evaluate(edge => window.__game.scene.getScene('Location').player.body[edge], setup.edge)).toBeCloseTo(setup.wall, 1);
      } finally { await page.keyboard.up(setup.key); }
    });
  }
}

test('Keyboard E collects both themed pickups exactly once', async ({ page }) => {
  for (const [id, item, position] of [['beach-axe', 'axe', [174, 141]], ['beach-cheesesteak', 'cheesesteak', [219, 106]]]) {
    await page.evaluate(p => window.__game.scene.getScene('Location').player.body.reset(...p), position);
    await page.waitForFunction(id => window.__game.scene.getScene('Location').nearby?.def.id === id, id);
    await page.waitForFunction(() => performance.now() - window.__game.scene.getScene('Hud').lastClosedAt > 450);
    await page.keyboard.press('e', { delay: 80 });
    await page.waitForFunction(item => window.__state.inventory.some(s => s.id === item), item);
    await closeDialogue(page);
  }
  await visit(page, 'jungle');
  await visit(page, 'beach');
  expect(await page.evaluate(() => window.__game.scene.getScene('Location').spawned.filter(s => s.def.kind === 'pickup').length)).toBe(0);
  const state = await snapshot(page);
  expect(state.inventory.filter(s => s.id === 'axe' || s.id === 'cheesesteak').map(s => s.count)).toEqual([1, 1]);
});

test('Palm depth follows feet so the player can pass behind and in front', async ({ page }) => {
  for (const [y, behind] of [[198, true], [243, false]]) {
    await page.evaluate(y => window.__game.scene.getScene('Location').player.body.reset(420, y), y);
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__game.scene.getScene('Location');
      return scene.player.depth < scene.spawned.find(s => s.def.kind === 'tree').sprite.depth;
    })).toBe(behind);
  }
});

test('The marked Jungle passage works in both directions using keyboard movement', async ({ page }) => {
  await page.evaluate(() => window.__game.scene.getScene('Location').player.body.reset(438, 126));
  await page.keyboard.down('d');
  try { await page.waitForFunction(() => window.__game.scene.getScene('Location').def.id === 'jungle'); }
  finally { await page.keyboard.up('d'); }
  await page.waitForFunction(() => !window.__game.scene.getScene('Location').cameras.main.fadeEffect.isRunning);
  await page.keyboard.down('a');
  try { await page.waitForFunction(() => window.__game.scene.getScene('Location').def.id === 'beach'); }
  finally { await page.keyboard.up('a'); }
  await page.waitForFunction(() => !!window.__game.scene.getScene('Location').children.getByName('beach-ground'));
});

test('Other four locations keep the original render path and texture keys', async ({ page }) => {
  for (const id of ['jungle', 'village', 'volcano', 'dock']) {
    await visit(page, id);
    const view = await page.evaluate(() => {
      const scene = window.__game.scene.getScene('Location');
      return { modular: !!scene.beach, beachObjects: scene.children.list.filter(c => c.name?.startsWith('beach-')).length,
        ground: scene.children.list.find(c => c.depth === -1000)?.displayTexture.key };
    });
    expect(view).toEqual({ modular: false, beachObjects: 0, ground: `ground-${id}` });
  }
});

test('Original Beach remains playable via the rollback URL', async ({ page }) => {
  await page.goto('/?debug&crt=0&beach=original');
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
  await page.keyboard.press('e', { delay: 80 });
  await page.waitForFunction(() => window.__game.scene.isActive('Location'));
  const view = await page.evaluate(() => {
    const scene = window.__game.scene.getScene('Location');
    return { modular: !!scene.beach, keys: scene.spawned.map(s => s.sprite.texture.key),
      ground: scene.children.list.find(c => c.depth === -1000)?.displayTexture.key };
  });
  expect(view).toEqual({ modular: false, keys: ['pickup', 'pickup', 'tree-chop'], ground: 'ground-beach' });
  await interact(page, 'beach-axe');
  expect((await snapshot(page)).flags).toContain('taken:beach-axe');
});
