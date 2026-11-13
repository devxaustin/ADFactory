import { test as base, expect } from '@playwright/test';

// Exercise the real Phaser game in Chromium. No engine/state mocks or production edits.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?debug&crt=0');
    await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__game.scene.isActive('Location') && window.__game.scene.isActive('Hud'));
    await use(page);
    expect(errors, 'No uncaught browser exceptions').toEqual([]);
  },
});
export { expect };

export async function snapshot(page) {
  return page.evaluate(() => ({
    inventory: window.__state.inventory.map(slot => ({ ...slot })),
    flags: [...window.__state.flags].sort(),
    hearts: window.__state.hearts,
    deaths: window.__state.deaths,
    objective: window.__state.objective,
  }));
}

export async function visit(page, id) {
  await page.evaluate(id => window.__game.scene.getScene('Location').scene.restart({ id }), id);
  await page.waitForFunction(id => {
    const scene = window.__game.scene.getScene('Location');
    return scene.scene.isActive() && scene.def.id === id && !scene.cameras.main.fadeEffect.isRunning;
  }, id);
}

export async function closeDialogue(page) {
  // Enter advances the real HUD but cannot accidentally interact with the world.
  for (let press = 0; press < 20; press++) {
    if (!await page.evaluate(() => window.__game.scene.getScene('Hud').isDialogueOpen)) return;
    await page.waitForTimeout(180);
    // Hold across a render frame: Phaser polls JustDown in update().
    await page.keyboard.press('Enter', { delay: 60 });
  }
  throw new Error('Dialogue did not close after 20 Enter presses');
}

export async function interact(page, id) {
  await page.evaluate(id => {
    const scene = window.__game.scene.getScene('Location');
    const target = scene.spawned.find(target => target.def.id === id);
    if (!target) throw new Error(`Missing interaction: ${id}`);
    scene.interact(target);
  }, id);
}

export async function winEncounter(page, id) {
  await interact(page, id);
  await closeDialogue(page);
  const key = id === 'jungle-tiger' ? 'mg-dodge' : 'mg-catch';
  await page.waitForFunction(key => window.__game.scene.isActive(key), key);
  // Deliberately force ONLY the result. This verifies real result -> trade integration,
  // not player skill, minigame balance, or an unaided end-to-end playthrough.
  await page.evaluate(key => window.__game.scene.getScene(key).win('Test result'), key);
  await page.waitForFunction(key => !window.__game.scene.isActive(key), key);
  await closeDialogue(page);
}
