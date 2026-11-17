# Beach sample 01 — proposed production specifications

**Status: waiting for visual sample approval. This is not a playable Phaser prototype.**

The approved direction is **16-Bit Tropical Adventure**. The user approved preparation of a representative sample, then a playable Beach only after reviewing that sample. Do not mistake approval of the broad scope for approval of these particular images.

## Proposed defaults and reasoning

| Area | Default for the Beach proof | Reason / approval boundary |
| --- | --- | --- |
| Native drawing grid | One native art pixel per world unit; 16 × 16 terrain cells | Supports chunky clusters, small reusable transitions and precise world alignment. It does not inherit an old tileset/art contract. |
| Logical review canvas | 480 × 270 for the isolated Beach proof | Provides room for the reference's large silhouettes without rescaling the whole game or changing the other four locations. This is a provisional presentation choice, not a permanent native-art restriction. Change density before integration if the sample looks too fine/coarse. The last tile row is deliberately clipped by 2 pixels; no fractional tile scaling. |
| Palette | Proposed 32-color Beach core plus transparency | Golden/peach sand, bright turquoise and blue water, yellow-green highlights through dark-teal foliage, lavender-gray rocks, restrained red accents. `manifest.json` contains the actual hex values; they are an adapted proposal, not a claim the reference has exactly 32 colors. |
| Shading | Usually 3–5 shades per material, hard-edged clusters, upper-left light | Different materials on one sprite may use different ramps. No gradients, blur, smooth antialiasing or procedural lighting overlay. No copied franchise tiles, characters or branding. |
| Camera / display | Native world scale; nearest-neighbor sampling; integer 1×/2×/3× review sizes | Use existing Phaser pixel-art support. Do not change the global canvas or the other locations to force a Beach preview. Browser FIT at noninteger sizes can create uneven pixel widths even without blur; verify and disclose this separately. |
| Props | Native frames in the table below, not scaled fractional textures | Sizes follow the reference's readable silhouettes and large vegetation. Frames are not collision boxes. Do not impose the temporary player's proportions on a later character design. |
| Shadows | Separate crisp pixel masks, one 96/255 opacity level, cast down-right/contact area | Consistent flat shadows without soft alpha gradients. Sample sprites have binary alpha; shadows are the explicit exception. Reference-derived base crevices are material shading, not fully separated dynamic lighting. |
| Water | Four 16 × 16 frames at 4 fps for the study | Quiet discrete motion, not shader gradients, distortion, particles or foam effects that obscure movement. Direction, phase variation and repetition still need refinement. |
| Effects | No new effects initially | No extra gameplay, heavy bloom, realistic waves, drifting particles or camera effects. Environmental palm animation is deferred, not fabricated from a static image. |

### Native sprite frames in this sample

| Component | Frame | Notes |
| --- | --- | --- |
| Rock A | 48 × 40 | Includes moss/pebbles/transparent margin; the main solid footprint must be aligned during integration. |
| Rock B | 64 × 48 | Separate obstacle, not a copy of Rock A. |
| Interactive palm | 80 × 96 | Large reference-like silhouette; sample pivot `[33, 89]` locates the trunk base within the export. |
| Stump | 16 × 12 | Shares the palm's trunk/wood ramp. It must replace the palm at its ground anchor, not float at the canopy center. |
| Bush / fern / flower | 32 × 24 / 24 × 24 / 16 × 16 | Small family of representative local studies, not a complete vegetation set. |
| Rusty axe | 16 × 16 | Metal edge, rusty head, brown handle. Small pickup anchor stays independent of art edges. |
| Cheesesteak | 24 × 16 | Long toasted roll, chopped steak and melted cheese; deliberately not a hamburger silhouette. |
| Temporary player | Existing 16 × 24 frame, unchanged | Used only as a scale reference. Future character design is a separate milestone; no final dimensions prescribed. |

The palm's apparent height is roughly three to four temporary-player heights. Rocks read as distinct substantial objects; pickups must remain recognizable at 1×. These proportions need artistic approval in the mockup. If they feel wrong, revise assets rather than stretching sprites in Phaser.

## Layering and depth sorting

1. Opaque ground tiles: sand and water base/depth transitions.
2. Coast/wet-sand/foam detail layer; all source pieces remain reusable.
3. Ground accents and independent shadow sprites; shadows do not collide.
4. Pickups, scenery and player, sorted by **ground-foot Y**, not image center, texture height or canopy top.
5. Canopy occlusion treatment where necessary. Split trunk/canopy for final production only if required; when a character walks behind foliage, preserve readable interaction feedback. The current palm export is not already a split canopy asset.
6. Existing HUD/dialogue stays above the world. No new interface design in this sample.

A small Beach-only rendering adapter should reuse existing gameplay/state APIs. A Phaser tile layer or simple tile/image layers can provide modular terrain without introducing Tiled, replacing the entire renderer or rewriting stable logic. Other locations retain their current render path. Exact adapter design is deliberately deferred until the sample is approved.

## Collision and interaction anchors

Source facts are pinned to main commit `a4aa13e250dfbc9d08b93a9d0a95fef1b4e3719a`, `src/data/locations.ts` and `src/scenes/LocationScene.ts`:

- Water baseline body: `(0, 0, 480, 40)`.
- Rock A baseline body: `(150, 90, 32, 32)`.
- Rock B baseline body: `(300, 170, 48, 32)`.
- Axe interaction point: `(190, 150)`.
- Cheesesteak interaction point: `(235, 115)`.
- Palm interaction point: `(420, 215)`; its old 10 × 6 body has world bounds `(415, 222, 10, 6)` with the existing texture/origin/offset.
- Mid-right Jungle opening reserved for review: `x=440..479`, `y=105..164`. This is an approach lane, not a new trigger definition or proof of accessibility.

**The red overlay shows inherited bodies, not a validated new collision map.** New rock silhouettes have overhangs, moss and pebbles outside those rectangles. Before runtime integration, align each main solid base with an appropriate footprint; do not blindly reuse a rectangle because it was recorded here. Prefer adjusting art/pivots to preserve proven routes. Any necessary footprint adjustment stays scoped to the Beach and must pass movement/clearance tests. Canopies, shadows and loose small pebbles are not solid wall bounds.

Keep gameplay interaction anchors and IDs stable even when visual foot pivots differ. In particular, drawing the palm at its base must not move the old interaction point to its leaf center. Use a visual offset or a separate collision/interaction entity. Compute body offset from `worldBodyTopLeft - visualTopLeft`; never copy the old texture offset onto a larger frame.

Retain the existing axe/food inventory behavior, chopping prerequisites/reward/persistence, stump replacement, exactly two rock obstacles and existing Jungle transition behavior. This sample has not exercised these mechanics.

## What's produced and how

The export manifest enumerates **32 individual PNG pieces**, including four-frame water/depth/shore groups. It records each file's dimensions, source method, palette, alpha class and SHA-256. It also records baseline world geometry as alignment evidence, not as new tested physics.

- **Code-authored locally with Pillow:** sand, straight water/shore/depth examples, small vegetation, stump, axe, cheesesteak and flat shadows. No image service or new AI image generation was called.
- **Reference-derived candidates:** two rocks and the isolated lower-right palm. Bounded masks remove background, tiny islands are filtered, images are nearest-neighbor resampled to native frames and mapped to the proposed palette. This process does not recover hidden pixels or magically create seamless tiles or animation. Inspect silhouettes on checkerboard and in the room before approving.
- **Existing temporary player:** read from the game's unchanged sprite sheet for the mockup only.
- **Raw reference:** remains local. Neither the full reference nor the user's local input paths are copied into the public repository.

The generator requires the reviewed original (SHA-256 `f80dc18550addd5c7cddb3f83adab994356902e15345d58971c91d04a3ec2e48`) and the baseline Beach screenshot as local inputs. Committed exports can be tested without publishing either local input. The baseline comparison is an engine capture versus a static study without HUD; it is not a matched-renderer visual regression.

## Artistic approval requested

Approve or request revisions to:

1. Native pixel density and the balance of chunky clusters versus detail.
2. Sand/water/foliage/rock palette and shadow strength.
3. Palm, rock and pickup size relative to the temporary character.
4. Open-room composition, vegetation framing and visible east passage.
5. Whether the masked/reference-derived prop treatment is a useful direction, or whether new clean standalone art should replace it.

Approval unlocks completion of only the necessary Beach kit and the scoped playable prototype. It does **not** approve the final player, other four locations, merge, deployment or a new paid service.

## Known visual gaps before full production

- Water is simpler and more periodic than the reference. Add organic variation and shore corner/turn transitions after sample approval.
- One palm silhouette is repeated in the room; the complete palm family is not yet made.
- Small foliage is simpler than the reference-derived palm/rocks; unify material detail and native-pixel clusters in the production pass.
- Alpha cleanup, trunk base/stump matching and visual-to-solid-footprint alignment require another pass.
- No canopy animation, dynamic shadow system or final character work is present.
- Decorative edge foliage currently has no implemented collider; do not imply it is a tested boundary.

## Prototype acceptance checklist — AFTER sample approval

- Write regression tests for Beach-specific rendering/collision/interaction integration before runtime changes. Reuse Batch A tests once available; do not duplicate them here.
- Both rock obstacles block cardinal and diagonal approaches, without invisible walls or walking through the solid base.
- Player can walk behind/in front of tall props with correct foot-Y ordering; canopy never hides an interaction cue indefinitely.
- Axe and cheesesteak can be collected exactly once; inventory and reload/revisit behavior are preserved.
- Palm rejects chopping without the axe; chopping reward, state persistence and stump behavior remain unchanged.
- Jungle passage is visually obvious and traversable in both directions, including approach near the opening's sides.
- Spawn/re-entry positions never intersect scenery. Decorative bounds do not trap the player or invent new hazards.
- Check water boundary visually against physics; no apparent walkable sand is blocked and no apparently deep water becomes a walking route.
- Verify native / 2× / 3× sharpness, resizing, actual WebGL plus fallback where available, and no clipped HUD/interaction labels.
- Re-run inventory/progression/recovery suite and the full portfolio build. Catch corrections remain separate.
- Compare Jungle/Village/Volcano/Dock screenshots and state behavior to the pre-change baseline.
- Deliver actual Phaser screenshots, before/after comparison, manual test evidence and remaining caveats. A static Pillow mockup never substitutes for that evidence.

## Branch and approval controls

This sample branch starts directly from current `origin/main`, not PR #1, #2 or #3. It adds sample art/tooling/docs only; it does not carry Batch A, Catch or earlier visual docs as duplicate commits. Keep this PR draft pending review. PR #2 remains a separate draft visual-planning record.

For implementation, first inspect the then-current approved/merged state. If Batch A has merged, start a fresh prototype branch from updated main and bring in only approved Beach sample commits/files. If Batch A remains unmerged, do not silently create another stacked dependency: agree on the test-baseline sequence before integration. Neither PR #1 nor #3 needs to merge merely to review these samples. Never merge/deploy without explicit approval.
