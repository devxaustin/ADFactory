# Monkey Island regression testing

## Install and run

From `games/monkey-island`:

```sh
npm ci
npx playwright install --with-deps --no-shell chromium
npm test
```

Playwright launches Chromium (the full `chromium` channel in headless mode) and an isolated Vite server on `127.0.0.1:4174`. The port must be free: an unrelated existing server is deliberately not reused. System-library installation may require administrator rights on Linux; local Windows/macOS installs can use `npx playwright install --no-shell chromium`.

Full integration/build check from the repository root:

```sh
npm ci
npm test --prefix games/monkey-island
npm run build
```

Install the game's dependencies/browser first as above. `npm run build` retains the existing game TypeScript/Vite build followed by the Astro portfolio build. Builds may modify the legacy tracked Phaser output in `public/monkey-island`; do not commit generated output as part of game source work.

## Coverage and boundaries

The suite executes the existing game in a real browser, not a mock Phaser engine or duplicated progression model. Each test has a fresh page/context and checks for uncaught page exceptions.

- Inventory: clean start, unique non-stackable items, wood stacking/count/has, failed removal without mutation, last-slot removal, change notifications.
- Input: a real held keyboard key moves the player.
- Pickups and chopping: removed pickups stay removed, axe is required, three swings yield one wood, persistent stump on revisit.
- Trades: missing medkit does not trade; successful village trade consumes medkit and gives rope only once; both minigame failure callbacks lose a heart but retain the offered item; success consumes food and applies rewards/gate changes.
- Raft: missing wood, rope or sail does not consume materials or end the game; success consumes exactly the required materials and transitions to End.
- Authored resource route: collect actual pickups, run trade integration, chop five authored trees, build and reach the ending without injecting raft supplies.
- Recovery/reset: health floor, beach respawn with retained inventory/flags/counters and full hearts, actual End -> Title -> new game resetting all progress and respawning pickups/trees.

**Not an unaided end-to-end playthrough:** helpers use the existing `?debug` hooks to stage locations and call the real scene interactions. Minigame results are deliberately forced through `win`/`lose` to check result-to-world integration. Dialogue advances through actual keyboard input. This does not test minigame skill, randomness fairness, all collision paths, touch support, visual pixel equality, audio, WebGL compatibility or performance. Keep the manual route in the baseline document as a separate requirement.

Tests intentionally describe existing valid-count behavior; inventory API hardening, Catch collision/input fixes, balance changes and new art are deferred to their approved future batches. Do not encode known risky algorithms as desired permanent behavior.

## Reports and screenshots

- `npm run test:report`: view the local HTML report.
- Failure screenshots and traces are written under ignored `test-results/`; HTML output is under ignored `playwright-report/`.
- `npm run baseline:capture`: explicitly refresh the human-review screenshot baseline and manifest. This is a separate Playwright project, not part of `npm test` or PR validation. Never silently refresh a reviewed baseline while developing art.
- Hold polled keyboard input across a frame; zero-delay down/up can be missed by Phaser's update-based `JustDown` polling. Helpers use a short key hold for dialogue.

## Optional visual-study tooling

`python tools/make_visual_studies.py` regenerates only the three procedural concept PNGs and their manifest under `docs/concepts/`, and runs in-memory checks for RGBA creation, alpha-bound cropping, nearest-neighbor resize, sheet assembly, quantization and PNG export/import. It requires Python 3 and Pillow, not a new game/runtime dependency. The manifest records Pillow version and image hashes. The comparison HTML embeds its images; if revising the PNGs, refresh that presentation deliberately as well. These are concept studies, not approved production assets or image-service outputs.

## Pull request validation

`.github/workflows/monkey-island-validation.yml` runs on pull requests to `main`. It installs locked dependencies and Chromium, runs regression tests, builds the game and portfolio, and preserves test reports for seven days. It has read-only repository permission and no Pages/deploy step, publication credential or `pull_request_target` execution. It does not run the baseline capture command.

The existing main-push Pages deployment workflow is unchanged. Opening this PR does not invoke that deployment; merging into main would still trigger the repository's existing deployment, so merge requires the owner's approval. Required-check branch protection is a separate repository setting and is not silently changed by this batch.
