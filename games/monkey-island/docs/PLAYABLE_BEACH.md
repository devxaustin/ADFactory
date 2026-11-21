# Playable Beach prototype

Branch: `feat/monkey-island-playable-beach`. Temporary art integrated into actual Phaser; no finished-visual-overhaul claim. Default = modular Beach. Add `beach=original` to restore the original Beach renderer. Other four locations and Catch implementation remain unchanged.

## Safe checkout in the regular Windows clone (PowerShell)

```powershell
Set-Location C:\dev\factory-site
if (git status --porcelain) { throw "Working tree has changes. Commit or stash your work before switching; do not reset or clean." }
git fetch origin
git switch --track origin/feat/monkey-island-playable-beach
npm ci --prefix games/monkey-island
npm run dev --prefix games/monkey-island -- --host 127.0.0.1 --port 5175 --strictPort
```

If the local branch already exists, use `git switch feat/monkey-island-playable-beach` instead of `--track`. Do not force checkout or overwrite other work. Port 5175 avoids the older prototype server on 5173; if occupied, stop the conflicting server or deliberately choose another port rather than viewing an old tab.

- New Beach: http://127.0.0.1:5175/?crt=0
- Original: http://127.0.0.1:5175/?crt=0&beach=original
- E starts; WASD/arrows move; E/Space interacts; Enter advances dialogue.
- `npm run dev:game` is the existing shortcut, normally using Vite's default port. It reads this branch's source. The explicit command above fixes the port and fails instead of silently choosing another one.
- Use game-only Vite for current source. Astro dev/preview can serve an older generated game until a build.

## Scope and PR relationships

Based on PR #1's `test/monkey-island-batch-a` to reuse existing regression/CI infrastructure. Review this PR against that base; no duplicate Batch A commits in the feature diff. Once PR #1 is explicitly approved/merged, rebase/retarget appropriately and rerun checks. No merge is authorized by this prototype.

PR #2 remains historical visual-planning documentation. Runtime PNGs are byte-for-byte copies of PR #4's assets at `e9a040858c98d38e08b47c0cedbc7a904727372e`; neither branch needs to be checked out or merged to run this prototype. No generation tools or private reference input are needed. PR #3's Catch fixes are deliberately NOT included; this is separate Beach work.

The original procedural textures/renderer remain intact behind the URL flag. Shared texture keys are not replaced. The player sheet, location definitions, state/progression logic, other four render paths and deployment workflow are unchanged.

## Validation

- Remaining stump-test failure reproduced before repair. The regression now runs in **both modes**, retaining two-hit/no-wood, third-hit/one-wood, chopped flag, removed tree, exactly one correct-mode stump, no wrong-mode stump, and revisit persistence checks.
- **44 local regression tests passed**, including 19 Beach-specific cases. Actual keyboard pickup checks, eight rock approach checks, depth sorting, water frames, Jungle round trip and original-mode rollback pass. Local Windows command: `PLAYWRIGHT_CHANNEL=chrome npm test -- --timeout=60000` from the game folder (Bash); PowerShell can set `$env:PLAYWRIGHT_CHANNEL='chrome'` before `npm test -- --timeout=60000`.
- `npx tsc --noEmit` passed. Complete root `npm ci && npm run build` passed (game TypeScript/Vite and Astro portfolio).
- Windows initially blocked the root build's game reinstall because an existing dev server held Rollup's native module. That server was left running. Full build used an isolated copy with all 138 input files hash-matched to the working source, avoiding overwrite/reset of the implementation.
- Production-built **WebGL** smoke passed: normal spawn, real keyboard-only walking, collect axe/food, chop three times, walk around the rocks to Jungle and back, verify persistent inventory/stump, then verify original mode. No teleports, inventory injection, forced results or manual frame stepping in this smoke. No uncaught page errors or failed game asset requests observed. `pixelArt` was enabled.
- Broader progression regression helpers still use debug-assisted setup and forced minigame outcomes. They are not a human balance/performance benchmark.

To run regression tests elsewhere: install game dependencies, `npx playwright install --no-shell chromium` from the game folder, then `npm test`. Default CI keeps Chromium and the original timeout; optional `PLAYWRIGHT_CHANNEL` only selects an installed local browser.

## Actual engine captures

[Initial Beach](beach-prototype/beach-phaser-start.png) · [Pickups collected / palm chopped](beach-prototype/beach-phaser-pickups-and-stump.png) · [Jungle arrival](beach-prototype/jungle-phaser-arrival.png) · [Beach return](beach-prototype/beach-phaser-return.png) · [Original mode](beach-prototype/beach-phaser-original.png)

[Machine-readable smoke evidence and screenshot hashes](beach-prototype/smoke-results.json)

## Known limitations

Temporary repeated palm/foliage silhouettes, simple repeating shoreline/water bands, approximate scenery overhangs relative to retained ground footprints, and the existing transparent HUD overlapping edge foliage. The temporary player/UI are not redesigned. Mobile/touch, broad device compatibility and performance are not certified. Existing root dependency advisories (one moderate, two high) and bundle-size warning remain outside this scope. The game dependency audit reported zero vulnerabilities.

Do not merge or deploy without explicit owner approval. Merging main would trigger the existing deployment workflow.
