# Playable Beach visual polish

Branch: `feat/monkey-island-beach-polish`, based on PR #5 / `feat/monkey-island-playable-beach`. No merge/deployment authorized. PR #5 stays intact for comparison; this follow-up contains only the polish delta.

## Play locally (PowerShell)

```powershell
Set-Location C:\dev\factory-site
if (git status --porcelain) { throw "Commit or stash existing work before switching. Do not reset or clean." }
git fetch origin
git switch --track origin/feat/monkey-island-beach-polish
npm ci --prefix games/monkey-island
npm run dev --prefix games/monkey-island -- --host 127.0.0.1 --port 5175 --strictPort
```

If the branch already exists locally, use `git switch feat/monkey-island-beach-polish` instead of `--track`.

- Polished Beach: http://127.0.0.1:5175/?crt=0
- Original Beach/player comparison: http://127.0.0.1:5175/?crt=0&beach=original
- E starts; WASD/arrows move; E/Space interacts; Enter advances dialogue.

## Implemented

- Repaired enclosed accidental transparency in both reference-derived rocks and the palm without changing original opaque pixels or border-connected transparency/open frond gaps. Native dimensions/pivots stay unchanged.
- Denser edge clusters: broader leaf plants, alternate shrubs, grass tufts, flower clusters, mirrored/edited palm and short fan palm. The same three decorative trunk colliders, two rock bodies, water body, pickup bodies and choppable-palm body remain.
- Coast pebbles/shells, mixed foam silhouettes and animation phases; removed the flat yellow exit block in favor of sand texture. The east opening and central pickup/movement routes remain clear.
- Opaque, camera-fixed backing beneath existing Beach HUD/slot rectangles; no shared HUD layout rewrite.
- Axe redrawn at 20x20 and cheesesteak at 28x20, with their original 10x10 pickup bodies retained.
- Original new 20x28 adventurer: coral bandana, teal shirt, tan backpack and boots. Twelve frames provide idle/two walk poses in all four directions. World-space 8x6 feet and movement speed are unchanged. Separate texture/animation keys preserve the legacy sheet.

The new player follows the player through normal overworld travel for continuity. **No Jungle/Village/Volcano/Dock environment art, location data or gameplay was redesigned.** Minigames and original comparison mode retain their legacy player sheet. Catch corrections remain separate in PR #3.

## Validation

- **50 real-browser regressions passed locally**, including all previous progression checks, new animation/body invariance, inventory backing, repeated scene/timer cleanup and original-mode coverage.
- **7 offline pixel-art checks passed**: dimensions/pivots, real alpha, clean margins, hole repair, original opaque-color/exterior-mask preservation, shoreline endpoints, manifest hashes and genuinely distinct walk poses. CI runs them from a shallow checkout without private reference inputs.
- Complete root `npm run build` passed: TypeScript, Vite and Astro. Existing portfolio bundle warning/root dependency advisories are not addressed by this visual pass.
- Production-built **WebGL** smoke passed from normal spawn with real keyboard-only movement: collect axe/food, chop palm, walk around obstacles to Jungle, return with inventory/stump persisted, verify original comparison. No teleport, injected inventory, forced outcome or manual frame stepping in that smoke. No uncaught exceptions or failed game assets observed.
- Other regression progression helpers retain their disclosed debug-assisted/forced-minigame-result setup. Mobile/touch, broad GPU compatibility, performance and gameplay balance are not certified.

Actual engine captures and smoke evidence: [polished start](beach-polish/beach-phaser-start.png), [pickups/chopping](beach-polish/beach-phaser-pickups-and-stump.png), [Beach return](beach-polish/beach-phaser-return.png), [original comparison](beach-polish/beach-phaser-original.png), [smoke JSON](beach-polish/smoke-results.json).

## Art provenance / regeneration

The rock/palm repairs are derived from PR #5 assets at commit `63a16c4`; new plants, pickups and player are locally code-authored Pillow pixel art, not new AI/image-service outputs. No paid service used. `public/beach/asset-manifest.json` records sizes, pivots, hashes and repair details. No flattened background is used.

From repo root: `python -m pip install -r tools/beach-art-requirements.txt`, then `python tools/test_beach_art.py`. Regeneration uses `python tools/polish_beach_art.py` and requires the original PR #5 commit in local Git history; validation of committed exports does not. Review contact sheets are generated locally under ignored `tools/artifacts/`.

Remaining refinement: plants/player use cleaner geometric clusters than the reference-derived scenery; coast still uses a straight-band layout; inventory contents retain the existing colored-chip UI. Border vegetation is intentionally clipped by the viewport, not by its PNG frames. This is an implemented polish pass for feedback, not a claim the final artistic target is finished.
