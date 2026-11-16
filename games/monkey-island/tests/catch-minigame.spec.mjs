import { test, expect, visit, interact, closeDialogue } from './helpers.mjs';

// Leave the real encounter intro open so automatic gameplay never runs. Each
// manual tick exercises actual Catch logic without random spawns or engine mocks.
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => __state.add('bananas'));
  await visit(page, 'volcano');
  await interact(page, 'volcano-monkeys');
  await closeDialogue(page);
  await page.waitForFunction(() => __game.scene.isActive('mg-catch'));
  expect(await page.evaluate(() => __game.scene.getScene('mg-catch').running)).toBe(false);
});

for (const [name, keys, expected] of [
  ['right', ['ArrowRight'], 21],
  ['right and down', ['ArrowRight', 'ArrowDown'], 21],
  ['left and up', ['a', 'w'], -21],
  ['vertical only', ['ArrowDown'], 0],
  ['opposing horizontal keys', ['ArrowLeft', 'ArrowRight'], 0],
]) {
  test(`Catch horizontal speed: ${name}`, async ({ page }) => {
    for (const key of keys) await page.keyboard.down(key);
    try {
      const moved = await page.evaluate(() => {
        const scene = __game.scene.getScene('mg-catch');
        const before = scene.basket.x;
        scene.tick(0.1);
        return scene.basket.x - before;
      });
      expect(moved).toBeCloseTo(expected, 6);
    } finally {
      for (const key of keys) await page.keyboard.up(key);
    }
  });
}

async function fallingStep(page, { kind = 'banana', x = 240, y = 237, vy = 400, dt = 0.5, basketX = 240 }) {
  return page.evaluate(({ kind, x, y, vy, dt, basketX }) => {
    const scene = __game.scene.getScene('mg-catch');
    scene.basket.x = basketX;
    scene.spawnIn = Number.POSITIVE_INFINITY; // Isolate one object from random spawning.
    const obj = scene.add.rectangle(x, y, 12, 5, 0xf2e04a);
    scene.items.push({ obj, kind, vy });
    scene.tick(dt);
    const result = { caught: scene.caught, bonks: scene.bonks, remaining: scene.items.length };
    scene.tick(0.01);
    return { ...result, afterNextTick: { caught: scene.caught, bonks: scene.bonks } };
  }, { kind, x, y, vy, dt, basketX });
}

for (const kind of ['banana', 'coconut']) {
  test(`Catch crossing: fast ${kind} is processed exactly once`, async ({ page }) => {
    const result = await fallingStep(page, { kind });
    const expected = { caught: kind === 'banana' ? 1 : 0, bonks: kind === 'coconut' ? 1 : 0 };
    expect(result).toEqual({ ...expected, remaining: 0, afterNextTick: expected });
  });
}

for (const [name, setup, caught] of [
  ['normal small step', { y: 240, vy: 60, dt: 0.1 }, 1],
  ['already below the basket', { y: 270 }, 0],
  ['outside horizontal range', { x: 280 }, 0],
  ['exact horizontal boundary', { x: 263, y: 250, vy: 0, dt: 0.1 }, 0],
  ['exact upper boundary', { y: 242, vy: 0, dt: 0.1 }, 0],
  ['exact lower boundary', { y: 258, vy: 0, dt: 0.1 }, 0],
]) {
  test(`Catch collision guard: ${name}`, async ({ page }) => {
    const result = await fallingStep(page, setup);
    expect(result.caught).toBe(caught);
    expect(result.bonks).toBe(0);
  });
}

test('Catch moving basket: arriving after the item passed is not a catch', async ({ page }) => {
  await page.keyboard.down('ArrowRight');
  try {
    const result = await fallingStep(page, { basketX: 200, x: 240, y: 237, vy: 500, dt: 0.2 });
    expect(result.caught).toBe(0);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
});

test('Catch moving basket: interception counts even if the basket ends elsewhere', async ({ page }) => {
  await page.keyboard.down('ArrowRight');
  try {
    const result = await fallingStep(page, { basketX: 200, x: 225, y: 237, vy: 50, dt: 0.5 });
    expect(result.caught).toBe(1);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
});

for (const [name, key, basketX, x] of [
  ['right edge', 'ArrowRight', 400, 430],
  ['left edge', 'ArrowLeft', 80, 50],
]) {
  test(`Catch moving basket: swept contact before clamping at ${name}`, async ({ page }) => {
    await page.keyboard.down(key);
    try {
      const result = await fallingStep(page, { basketX, x, y: 237, vy: 500, dt: 0.5 });
      expect(result.caught).toBe(1);
    } finally {
      await page.keyboard.up(key);
    }
  });
}
