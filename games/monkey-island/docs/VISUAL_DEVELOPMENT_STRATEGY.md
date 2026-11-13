# Monkey Island — flexible visual development strategy

**Status: exploration, not a finalized art contract. No direction or asset replacement is approved.** This document supersedes the earlier restrictive contract following the owner's clarification: **preserve the gameplay, not the placeholder graphics.** D1, T1 and T2 continue unchanged.

## What stays and what can change

Keep Phaser, the core island-escape adventure, five existing locations and their gameplay purposes. Avoid unnecessary rewrites of stable trade/progression/state logic. All current graphics are temporary: player design/proportions, sprite dimensions, textures, terrain, props, UI, animation, palette and CRT styling may be redesigned. Camera behavior, world presentation, scaling, collision boundaries and asset systems can change when required by an approved direction, with regression checks and manual traversal validation.

The existing screenshots are records of behavior and starting appearance, **not artistic constraints**. Neither the current 16x24 player nor the guide's 16x16 character proposal defines the future style.

## Rendering and asset architecture: migration facts, not requirements

| Inspected system | Current implementation | What an approved redesign may require |
|---|---|---|
| Game canvas/camera | `src/main.ts`: 480x270 logical canvas, FIT scaling, Phaser.AUTO | Choose logical resolution, zoom and camera composition after testing character/environment readability; update bounds and HUD layout together |
| Player | `BootScene`: 48x96 sheet, 16x24 frames, 3 columns x 4 directions | New design, dimensions, animation rows or atlas; explicit frame mapping and movement animations |
| Player collision | `LocationScene.createPlayer`: 8x6 feet body, offset 4,18 | New feet anchor/body offset tied to the approved sprite, independent of decorative silhouette |
| Other existing PNGs | Villager 48x72; monkey 80x16; both not currently loaded | Reuse only if they fit the selected direction; no presumption they must survive |
| Scenery | Generated textures + TileSprites and explicit rectangular obstacles | Layered sprites, atlas frames, larger scenery stamps or authored tilemaps if useful; no automatic engine rewrite |
| Pickups/NPCs/trees | Shared keys, tint and explicit sizing/body setup | Per-asset mapping, interaction anchors, state variants and replacement animations |
| Ground and plans | Mostly 16px generated ground; guide/manifest/layout tool describe a future tileset | Grid size and atlas layout remain open; retain existing indices only if continuing that manifest; otherwise introduce a versioned mapping rather than silently changing meaning |
| HUD/dialogue | Fixed-position Phaser rectangles/text, eight slots | New framing, type system, icons, scale and layout; preserve objective/inventory/dialogue functions |
| Minigames | Geometric arenas; world placeholder art enlarged/reused | New encounter art, player scale, camera/framing and telegraphs; verify visual hit alignment separately from world collisions |
| Renderer | Phaser.AUTO; local baseline selected Canvas | Test WebGL and Canvas; do not rely on tint support to establish species/item identity |

Relevant code: `src/config.ts`, `src/main.ts`, `src/scenes/BootScene.ts`, `LocationScene.ts`, `HudScene.ts`, `TitleScene.ts`, `EndScene.ts`, and both minigame scenes. The existing tileset guide is planning material, not an implemented Tiled pipeline.

## Three distinct directions for review

Open [the comparison board](concepts/index.html). The included PNGs are **original procedural direction studies**, not AI-service outputs, production assets, game screenshots, or a promise of final illustration quality. They deliberately vary scene density, silhouettes, character scale and UI posture. They help compare taste; generative/model-assisted concept refinement remains a separate step.

### A — Sunlit storybook coast

Warm, airy tropical adventure with generous sandy paths, soft rounded palm clusters, clear turquoise shallows and approachable medium-proportion characters. Clean cream/parchment UI and expressive poses. Visual priority: welcoming exploration, clarity and charm.

Proposed experiment, not a contract: modest native pixel density and a relatively large, readable character silhouette. Risk: if kept too simple, the island may still feel sparse; add detail through crafted landmarks rather than noisy ground.

### B — Lush adventure diorama (recommended first exploration)

Dense but navigable vegetation, layered canopies, rich shoreline bands, weathered timber and a slightly taller expressive explorer. Strong foreground/midground/background separation and restrained warm highlights. Quiet dark UI framing. Visual priority: detailed tropical environments and a strong hero scene while keeping interactables legible.

Proposed experiment: higher-detail sprites/environment canvas, camera scale chosen with the new character rather than inherited from the prototype. Risk: more asset and animation work, canopy occlusion and excess detail hiding exits. Prove one Beach slice and a movement/collision study before committing to the full island.

### C — Graphic island folklore

Bold sculpted foliage, compact expressive castaways, patterned materials and coral/jade color relationships. Geometric silhouettes and strong negative space; graphic dark UI with restrained warm accents. Visual priority: distinctive authorship and a playful island identity rather than simulated realism.

Proposed experiment: deliberately compact characters and stylized scenery shapes, with carefully limited pattern density. Risk: visual abstraction can weaken object recognition; test silhouettes and item identity early.

These are starting points, not a forced selection. The owner may combine B's shoreline detail with A's warmth, request a fourth direction, or reject all three. No palette, frame dimensions, outline rules, lighting system, camera scale or UI treatment is locked yet.

## Verified creation tools and limits

| Capability | Verification / current status | Limitations |
|---|---|---|
| Local procedural image creation | Python + Pillow produced the included concept PNGs and preview board | Code-authored studies are not a substitute for polished illustrated concept art |
| PNG processing | Local smoke checks exercise RGBA creation, nearest-neighbor resizing, cropping, palette quantization and sheet assembly | Automated operations do not guarantee consistent anatomy, clean animation or attractive art; visual review remains necessary |
| Generative image service | Higgsfield `GENERATE_IMAGE` tool was discovered and its schema inspected; a `gpt_image_2` cost-preflight request returned CONNECTION_REQUIRED; connection attempt remained not_connected | No successful generation, editing, pricing or model output has been verified. Owner connection/authorization and a fresh cost check are needed before using it. Do not claim working access or spend credits silently |
| Browser inspection / integration engineering | Existing real Phaser renderer, loaders, physics and debug-backed tests have been exercised | New art integration has NOT happened. Tests currently force encounter outcomes and do not certify art/collision correctness, visual quality or performance |
| Animation and 3D generation | No specialized rigging, character-consistent animation generator or 3D-model generator has been verified | Static concept tools must not be advertised as reliable frame-perfect spritesheet/rigged-model production. Custom frame work or additional tools may be required |

Do not upload private research, credentials or unrelated user assets to an image service. For external references, establish usage rights. Track generated outputs and human/procedural edits honestly; do not claim ownership/licensing guarantees without checking the relevant service terms and source provenance.

## Conversational art-production workflow

1. **Brief:** translate the owner's request into a specific visual change, region, mood, character traits and retained gameplay behaviors. Identify references the owner has rights to use.
2. **Explore:** produce distinct concept views and character silhouettes. Label each preview by method and maturity. Keep alternatives under versioned review paths, outside runtime `public/`.
3. **Owner chooses:** approve a direction or request revision. Record what is actually approved and what remains open. No production asset replacement yet.
4. **Technical proof:** test candidate character proportions, camera, shoreline layering, UI scale and feet/collision anchors in an isolated development branch. Agree measurable export needs only after this proof.
5. **Asset specification:** choose PNG/atlas/spritesheet structure, native dimensions, palettes, alpha handling, naming and animation frame contracts for the selected direction. Version these contracts; they serve the art, not the old placeholders.
6. **Generate or draw, then edit:** use available authorized tools, inspect outputs, repair edges/alpha, produce consistent frames and organize source versus runtime exports. Ask before costs or new services are required. Retain a provenance manifest (brief, tool/model if used, source refs, edits, status and export details).
7. **Validate assets:** check file loading, dimensions, alpha, frame boundaries, tiling/seams, consistent scale/light/outline vocabulary, item readability and animation continuity. Do not mistake a concept sheet for an import-ready tileset.
8. **Integrate carefully:** update loader/atlas mappings, origins, movement animations, feet bodies, depth ordering, interaction anchors, HUD and camera as needed. Reuse stable item/trade/flag logic. Keep collision data explicit rather than deriving it blindly from opaque pixels.
9. **Review in game:** automated state/build tests plus actual traversal, both encounters, occlusion, exits, CRT choice, WebGL/Canvas and target-device checks. Compare the baseline for functionality, not artistic similarity.
10. **Reviewed PR:** show before/after evidence and remaining limits. Owner approves major art decisions and merge/publication separately. No automatic merge or deploy.

## First decisions requested

- Which direction, combination or alternative should receive a refined concept pass?
- What player personality/proportions best fit it? The current castaway is not the default final design.
- How dense and detailed should environments feel relative to navigation readability?
- Does the chosen look retain CRT as an optional presentation, reinterpret it, or leave it out of the game?

After direction approval, run a new character-and-Beach proof before choosing final resolution/frame sizes. Five existing areas remain; new regions are not required for a successful visual overhaul.
