# Monkey Island — Batch A baseline

This records the game **before visual or gameplay improvements**. Source baseline: `a4aa13e250dfbc9d08b93a9d0a95fef1b4e3719a`. Batch A adds documentation, development-only testing tools and PR validation; it does not change runtime source or game assets.

## What the game is

A compact, top-down island-escape adventure, adapted from a Java text adventure. Phaser 3.90.0 + TypeScript + Vite; 480x270 logical canvas, `pixelArt: true`, Arcade Physics, FIT scaling. Astro hosts its build under the portfolio's Monkey Island path. The surrounding site's Three.js models are not game assets.

### Existing controls and mechanics

- WASD/arrows: normalized movement; feet-based collision and Y-depth ordering.
- E/Space: interact with the nearest eligible object and advance dialogue. Enter also advances dialogue and is accepted at the title/ending.
- Item pickups, automatic contextual trades, stackable wood, eight display-only inventory slots, objective text derived from progress flags.
- Typewriter dialogue, instant reveal/advance, repeat speech bubbles, location banners, transitions, chop feedback and particles.
- Three hearts. A failed encounter costs one heart but retains its trade item. Zero hearts triggers beach recovery: hearts refill, death count increases, inventory/flags/chop progress remain.
- No implemented save/continue, pause/settings, touch movement, gamepad input or audio was found in this source baseline. These are gaps, not newly introduced regressions.
- Title, ending and replay. A new game resets inventory, flags, counters, hearts and death count.
- `?crt=0` disables the CRT overlay; `?debug` exposes the existing `__game` and `__state` inspection hooks.

## Locations and progression

| Location | Existing content | Connections |
|---|---|---|
| Beach | Axe, cheesesteak, one choppable tree, water/rocks | Jungle |
| Jungle | Tiger gate, bananas, two choppable trees | Beach, Village, Volcano, Dock |
| Village | Villager trade, medkit behind huts, two choppable trees | Jungle |
| Volcano | Monkey trade and lava/rocks | Jungle |
| Dock | Raft site, one choppable tree, water/rock | Jungle |

1. Collect the axe and cheesesteak on the Beach.
2. Complete the tiger encounter and feed it: consumes cheesesteak, sets `tiger_fed`, removes the guarded thicket and tiger.
3. Collect bananas. Obtain rope by trading the village medkit; obtain a sail by winning the monkeys' challenge and trading bananas. Rope/sail tasks can be completed in either order after the tiger gate opens.
4. Chop trees with the axe. Three interactions per tree yield one wood; chopped trees become persistent stumps. Six trees exist; five wood are required.
5. Build at the Dock with five wood, rope and sail. Required materials are consumed; the axe and excess wood remain. Dialogue transitions to the escape ending.
6. Replay returns through the title and begins a clean game.

### Challenges

- **Tiger:** five escalating horizontal/vertical telegraphed lunge waves. After surviving, approach within the throw range and press E/Space during a timed window. Missing that window triggers another wave. Current encounter difficulty is 1.
- **Monkeys:** move a basket horizontally, catch ten bananas within 28 seconds, and avoid reaching two coconut hits. Current encounter difficulty is 1. Spawn selection is random, not a guaranteed fair sequence.

### Items

Axe, cheesesteak, medkit, bananas, wood, rope, sail. Only wood is marked stackable. Inventory does not currently offer item selection, combination or equipping.

## Current visual appearance

The authored player is surrounded mainly by generated placeholder art: speckled ground, rectangular rocks/huts/terrain, square pickups and colored inventory rectangles. Tiger and monkeys share a generic four-legged `critter` texture. Title and ending are text-led. The game uses monospace text and an optional CRT overlay.

The village task and escape are largely described by text. Sound and more detailed environmental art are not implemented yet. These observations describe the baseline; they are not approval to redesign it.

## Screenshot evidence

[manifest.json](manifest.json) records source commit, capture time, browser, renderer, viewport, SHA-256 hashes and staging notes. Eleven actual browser screenshots are included:

| Reference | Purpose |
|---|---|
| [Title](screenshots/title.png) | Existing start presentation |
| [Beach](screenshots/beach.png) | Player/world scale and item placeholders |
| [Jungle](screenshots/jungle.png) | Tiger, gate and navigation |
| [Village](screenshots/village.png) | Hut and villager placeholders |
| [Volcano](screenshots/volcano.png) | Lava and monkey encounter site |
| [Dock](screenshots/dock.png) | Existing raft site and water boundary |
| [Beach with CRT](screenshots/beach-crt.png) | Overlay-on comparison |
| [Portrait](screenshots/portrait.png) | Current 390x844 canvas-fit behavior, not touch support |
| [Tiger introduction](screenshots/mg-dodge.png) | Real encounter introduction |
| [Monkey introduction](screenshots/mg-catch.png) | Real encounter introduction |
| [Ending](screenshots/ending.png) | Current ending presentation |

**Capture limits:** real Phaser rendering, but locations/ending were debug-staged and minigame inventory was seeded. These are not proof of an unaided playthrough. This environment selected **Canvas**, not WebGL; sprite tints can differ from a WebGL-capable machine. The manifest records this distinction. Animation phase and font/platform rendering can vary; these are human-review references, not pixel-perfect golden tests. The monkey introduction currently has overlapping bottom text; preserve the evidence rather than retouching it.

The shipped source selects `Phaser.AUTO`; no renderer change is made by Batch A. Recheck art on WebGL and Canvas before accepting future visual work.

## Source-to-claim map

Paths below are relative to the game root. Source commit is pinned above.

| Claim | Primary evidence | Additional verification |
|---|---|---|
| Canvas configuration, physics, scene registration | `src/main.ts`, `src/config.ts` | Real browser boots in regression suite |
| Locations, dependencies and dialogue | `src/data/locations.ts` | Trade and authored-resource-route tests |
| Inventory/health/objectives/reset | `src/systems/GameState.ts` | Inventory and recovery tests |
| Pickups, trade outcomes, chop/raft requirements | `src/scenes/LocationScene.ts` | Browser integration assertions |
| Loaded player versus generated art | `src/scenes/BootScene.ts` | Baseline screenshots and asset dimensions |
| UI inventory representation | `src/scenes/HudScene.ts` | Screenshot references |
| Challenge rules | `src/minigames/DodgeScene.ts`, `CatchScene.ts` | Source inspection; outcomes deliberately injected for integration tests |
| Existing art plans are not the runtime pipeline | `art/TILESET_LAYOUT.md`, `art/tileset_manifest.json`, `BootScene.ts`, `LocationScene.ts` | No Tiled map loader added |

## Compare future changes

Keep this source-pinned baseline. Capture later milestones in separate, clearly named directories rather than silently replacing these images. Compare the same viewport, renderer, CRT setting and story state. Review object readability, walk-behind order, exits, interaction range, collision alignment and HUD contrast. Player proportions and all other current graphics are temporary, not preservation constraints; compare functional behavior while allowing an owner-approved artistic overhaul.

`npm run baseline:capture` from the game root intentionally rewrites this capture set and its manifest. Run it only when deliberately refreshing a reviewed baseline; ordinary `npm test` and PR CI do not capture or overwrite it.

## Manual regression route

Complete a keyboard-only fresh playthrough without debug calls: collect both Beach items; talk before possessing each trade item; fail/retry each encounter; verify death recovery; finish both trades in either order; chop five trees; inspect the raft while materials are missing; construct and escape; replay. Check every exit in both directions, dialogue reveal/advance, prompt reopening, occlusion, CRT-on/off and window resize. Record browser/device and actual outcomes. Automated debug-assisted route checks do **not** replace this real playthrough or assess difficulty.
