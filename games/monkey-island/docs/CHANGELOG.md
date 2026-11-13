# Monkey Island development record

## Batch A — baseline, regression protection, PR validation, visual exploration

Baseline runtime source: `a4aa13e250dfbc9d08b93a9d0a95fef1b4e3719a`.

### Changes

- Documented existing mechanics, locations, progression, visual state, source evidence and a manual regression route.
- Captured eleven real-browser baseline screenshots with source commit, capture timestamp, viewport, renderer and SHA-256 manifest. Screens are explicitly debug-staged; no unaided completion is claimed.
- Added Playwright as an exact-pinned game-only development dependency, with isolated regression and explicit baseline-capture projects.
- Added 24 real-Phaser browser regression tests for inventory, pickup persistence, trade conditions/results, chopping, raft requirements, health/recovery, and replay reset. Existing debug hooks are used; no production test API was added.
- Added a read-only pull-request workflow to install dependencies/browser, run tests, build the game/portfolio, and retain reports. No deployment/publication step was added. Existing main-push deployment configuration is unchanged.
- Replaced the initial restrictive art-contract draft with a flexible visual development strategy after owner clarification. All existing graphics, proportions and dimensions are placeholders; Phaser, the five locations' gameplay purposes and core progression remain the constraints.
- Added three original procedural style studies and a self-contained comparison board, outside runtime assets. Verified local PNG processing operations. A generative-image connector was discovered but is not connected; no successful model generation or pricing is claimed.
- Final art contracts and major asset integration require owner approval. New styles, player dimensions, camera and rendering changes may be proposed as needed.

### Local verification

- Clean game dependency install and all 24 regression tests: passed.
- Explicit baseline capture: passed; all eleven screenshot hashes verified.
- Sensitivity check: a temporary local mutation replacing wood accumulation with assignment made the wood-stacking test fail as intended (received 3, expected 5). The mutation was immediately restored; final runtime source diff is empty.
- Root clean dependency install and full `npm run build`: passed, including game TypeScript check, Vite production build and Astro static build.
- Existing portfolio chunk-size warning remains. Root install reported three dependency vulnerabilities (one moderate, two high); no root dependency files were changed. Game install reported zero vulnerabilities. These audit results are time-specific package-database reports, not proof of browser exploitability.
- Initial local Chromium headless-shell launch was blocked by Windows application control. The pinned full Chromium channel runs successfully; no OS security controls were weakened.

### Limits / deferred work

The test suite forces minigame results to validate integration; it does not establish challenge balance or count as an unaided playthrough. Local screenshots use Canvas fallback and may differ in tint from WebGL rendering. Browser/device playtesting, Catch algorithm fixes, new item/character art, objective changes, touch support, audio and saving are not implemented in Batch A. See the PR's actual check results for remote validation rather than inferring CI success from this local record.

No runtime source, game assets, five-location layout, player proportions, story dependencies, portfolio appearance, or existing deploy workflow is changed by this batch. No merge/deployment is authorized.
