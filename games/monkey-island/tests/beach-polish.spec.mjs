import { test, expect, visit } from './helpers.mjs';

test('Polish assets integrate a new actor and varied foliage with unchanged player feet', async ({ page }) => {
  await page.waitForFunction(() => {
    const p = window.__game.scene.getScene('Location').player;
    return p.body.x === p.x - 4 && p.body.y === p.y + 6;
  });
  const view = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Location');
    const p = s.player;
    return { player: p.texture.key, frame: [p.width, p.height],
      feet: [p.body.x - p.x, p.body.y - p.y, p.body.width, p.body.height],
      foliage: [...new Set(s.children.list.map(c => c.texture?.key).filter(k => k?.startsWith('beach-')))] };
  });
  expect(view.player).toBe('adventure-player');
  expect(view.frame).toEqual([20, 28]);
  expect(view.feet).toEqual([-4, 6, 8, 6]);
  expect(view.foliage).toEqual(expect.arrayContaining(['beach-palm-b', 'beach-fan-palm', 'beach-broadleaf', 'beach-bush-b', 'beach-grass-tuft', 'beach-flowers']));
});

test('Beach HUD has opaque backing above world foliage', async ({ page }) => {
  const backing = await page.evaluate(() => {
    const b = window.__game.scene.getScene('Location').children.getByName('beach-hud-backing');
    return b ? { alpha: b.fillAlpha, depth: b.depth, width: b.width, height: b.height } : null;
  });
  expect(backing).toEqual({ alpha: 1, depth: 9500, width: 480, height: 20 });
});

test('Inventory cells have opaque Beach-only backing without blanking the coast', async ({ page }) => {
  const cells = await page.evaluate(() => window.__game.scene.getScene('Location').children.list
    .filter(c => c.name?.startsWith('beach-slot-backing-'))
    .map(c => [c.x, c.y, c.width, c.height, c.fillAlpha, c.scrollFactorX, c.scrollFactorY]));
  expect(cells).toEqual(Array.from({ length: 8 }, (_, i) => [8 + i * 24, 20, 20, 20, 1, 0, 0]));
});

test('New actor has directional walk poses and stable feet through animation', async ({ page }) => {
  expect(await page.evaluate(() => Object.keys(window.__game.textures.get('adventure-player').frames).filter(k => k !== '__BASE').length)).toBe(12);
  for (const [key, dir, row] of [['d', 'right', 2], ['a', 'left', 1], ['w', 'up', 3], ['s', 'down', 0]]) {
    await page.keyboard.down(key);
    try {
      await expect.poll(() => page.evaluate(() => window.__game.scene.getScene('Location').player.anims.currentAnim.key)).toBe(`adventure-player-walk-${dir}`);
      const view = await page.evaluate(dir => {
        const s = window.__game.scene.getScene('Location');
        const p = s.player;
        return { frames: window.__game.anims.get(`adventure-player-walk-${dir}`).frames.map(f => Number(f.frame.name)),
          size: [p.body.width, p.body.height], offset: [p.body.offset.x, p.body.offset.y] };
      }, dir);
      expect(view).toEqual({ frames: [row * 3 + 1, row * 3, row * 3 + 2, row * 3], size: [8, 6], offset: [6, 20] });
    } finally { await page.keyboard.up(key); }
    await expect.poll(() => page.evaluate(() => window.__game.scene.getScene('Location').player.anims.currentAnim.key)).toBe(`adventure-player-idle-${dir}`);
  }
});

test('Actor stays consistent on scene return and repeated shoreline timers do not accumulate', async ({ page }) => {
  // Inspect Phaser 3.90's real Clock queues without mutating them.
  const timerCount = () => page.evaluate(() => {
    const clock = window.__game.scene.getScene('Location').time;
    return [...clock._active, ...clock._pendingInsertion].filter(e => e.loop && e.delay === 250).length;
  });
  expect(await timerCount()).toBe(1);
  for (let i = 0; i < 3; i++) {
    await visit(page, 'jungle');
    expect(await timerCount()).toBe(0);
    expect(await page.evaluate(() => window.__game.scene.getScene('Location').player.texture.key)).toBe('adventure-player');
    await visit(page, 'beach');
    expect(await timerCount()).toBe(1);
  }
});

test('Original comparison keeps old player frames and no polish layers', async ({ page }) => {
  await page.goto('/?debug&crt=0&beach=original');
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
  await page.keyboard.press('e', { delay: 80 });
  await page.waitForFunction(() => window.__game.scene.isActive('Location'));
  const view = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Location');
    return { key: s.player.texture.key, size: [s.player.width, s.player.height], backing: !!s.children.getByName('beach-hud-backing'),
      newTexture: window.__game.textures.exists('adventure-player') };
  });
  expect(view).toEqual({ key: 'player', size: [16, 24], backing: false, newTexture: false });
});
