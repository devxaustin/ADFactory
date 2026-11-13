# Monkey Island (web)

Browser rewrite of the Java text adventure. Phaser 3 + TypeScript + Vite.
Lives inside the ADFactory repo and is built automatically with the site.

From the ADFactory root:

    npm run dev:game   # game only, hot reload (fastest while working on it)
    npm run build      # builds the game into public/monkey-island, then the site
    npm run preview    # serve the full site, game at /ADFactory/monkey-island/

Publishing uses the existing GitHub Pages workflow on pushes to `main`. Feature branches and pull requests do not deploy; PR validation runs tests and the full build only. Do not merge or publish without approval.

## Batch A baseline and proposed art direction

- [Current-state baseline and screenshots](docs/baseline/README.md)
- [Regression testing and validation](docs/TESTING.md)
- [Flexible visual development strategy — direction approval required](docs/VISUAL_DEVELOPMENT_STRATEGY.md)
- [Three procedural visual direction studies](docs/concepts/index.html)

From this game directory, run `npm ci`, `npx playwright install --no-shell chromium`, then `npm test`. Run `npm run baseline:capture` only to deliberately refresh the reviewed screenshot record; normal tests do not overwrite it.

Controls: WASD / arrows to move, E or Space to interact and advance dialogue.

## Layout
- `src/data/` locations, items (content lives here, not in scene code)
- `src/systems/GameState.ts` inventory, flags, objective
- `src/scenes/BootScene.ts` generates placeholder art; swap for real assets under the same texture keys
- `src/scenes/LocationScene.ts` renders any location from data
- `src/scenes/HudScene.ts` objective, inventory, dialogue, banners
