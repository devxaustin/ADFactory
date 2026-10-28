# Monkey Island (web)

Browser rewrite of the Java text adventure. Phaser 3 + TypeScript + Vite.
Lives inside the ADFactory repo and is built automatically with the site.

From the ADFactory root:

    npm run dev:game   # game only, hot reload (fastest while working on it)
    npm run build      # builds the game into public/monkey-island, then the site
    npm run preview    # serve the full site, game at /ADFactory/monkey-island/

Publishing is just `git push`: the GitHub Action builds the game, then the site.

Controls: WASD / arrows to move, E or Space to interact and advance dialogue.

## Layout
- `src/data/` locations, items (content lives here, not in scene code)
- `src/systems/GameState.ts` inventory, flags, objective
- `src/scenes/BootScene.ts` generates placeholder art; swap for real assets under the same texture keys
- `src/scenes/LocationScene.ts` renders any location from data
- `src/scenes/HudScene.ts` objective, inventory, dialogue, banners
