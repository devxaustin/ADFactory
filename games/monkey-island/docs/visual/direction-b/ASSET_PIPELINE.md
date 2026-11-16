# Asset pipeline — Direction B (proposal, not executed)

**Images have not yet been generated for this package. No finished game assets, animation or integrated art are delivered.** All formats, dimensions, frame counts, grid sizes, filtering and camera choices below are tentative until proof. The current deliverable is documentation only: no runtime source/assets or rendering structure changes are authorized.

The user operates ChatGPT; Hermes briefs, evaluates returned original exports and prepares approved work locally. No payment, subscription, paid API, external generation service or premium tooling is required or recommended. Local software examples below are free options, not installed/verified dependencies or a requirement to install them. If unavailable, use an already available free equivalent or discuss the blocker rather than substituting a paid route.

Read the [brief](README.md), [prompts](CHATGPT_PROMPTS.md) and [handoff](HANDOFF.md). **An attractive concept is neither an animation nor a separable, tileable game asset.**

## 1. Originals, approvals and versioning

After the user supplies files, keep untouched originals in a review-only source area outside runtime `public/`. Proposed organization under this package (directories do not exist yet):

```text
references/originals/        original user-returned files, never overwritten
references/review/           explicitly labeled crops, scale checks, annotated reviews
production/source/          layered editable masters, only after production approval
production/exports/         candidate runtime exports, not automatically loaded
production/manifests/       provenance, frame contracts, collision/anchor specs
```

For every source, record actual filename, SHA-256, dimensions, format/color mode/alpha, received revision, prompt, named references, generation tool/model if visible (otherwise unknown), user-selected approval scope and edits. Preserve a separate approval record: environment mood ≠ layout approval ≠ player approval ≠ export approval ≠ integration approval. Never invent dates, hashes, model settings or rights guarantees. Establish reference usage rights and check applicable terms rather than promising ownership of a generated result. Do not send unrelated private material to the image tool.

Review the unmodified original first. Compare full scene and reduced-size crops, grayscale/value, player outline and both pickups. Log specific defects: angle mismatch, obscured east exit, contradictory sun, pouch-side drift, overlarge player, unreadable sandwich. Revision requests should preserve approved aspects and name the changed aspect. Do not hide a design failure behind a sharpening filter.

## 2. Free/local editing and truthful extraction

**Possible local tools:** Krita or GIMP for layered painting, masks and alpha cleanup; LibreSprite for hard-pixel frame editing if that finish is selected; Python with Pillow for measured inspection, crop/padding, contact-sheet assembly, seam tests and validation. ImageMagick is an optional free local alternative for batch operations. These tools prepare and inspect images; they do not invent approved art or automatically provide character-consistent animation. Do not create basic procedural replacement visuals to stand in for the requested illustrated concepts.

1. Duplicate an original into an editable layered master; keep the original read-only in practice. Record any resize, crop or color transform. Use sRGB working/export intent and check what the actual file contains; do not assume its profile.
2. Separate only usable elements. A flattened scene contains occlusion and baked shadows; cropping out a palm does not reveal its hidden trunk or the sand beneath it. Redraw missing approved parts locally or ask for a targeted revision. Do not call automatically segmented fragments a complete asset kit.
3. Use masks, not destructive erasing. Trace/paint edges at high zoom, then inspect at native and intended gameplay scale. Preserve deliberate leaves/fingers; remove sand-colored fringe. A neutral-sheet background can be close to skin/shirt values: one-click color deletion can eat the character.
4. For a future player export, use real RGBA transparency, no baked checkerboard, matte border or scene-colored rectangle. Check against white, black, bright magenta and the actual ground. Inspect partially transparent edge pixels for pale/dark halos and stray opaque pixels. Keep contact shadow as a separate approved asset/layer where needed.
5. Choose alpha rules **after finish proof**. A hard-pixel direction may use binary alpha and nearest-neighbor; painted art can require partial alpha and appropriate filtering. Do not force the old guide's no-antialiasing rule on an unapproved painted direction. Do not repeatedly quantize, sharpen or resize.
6. Keep full opaque ground coverage where appropriate; canopies/props use clean alpha. Never infer collision from transparency. Test straight/premultiplied-alpha appearance in Phaser instead of assuming an export checkbox fixes all fringes.

## 3. Resolution, tiling and composition proof

Review-image resolution is not native runtime resolution. Start from the combined concept's scale relationship. In a separately authorized local proof, compare candidate native dimensions, camera framing and displayed player sizes with readable feet, items and UI. The current 480×270 canvas and 16×24 player are facts, not targets. Downsampling a huge illustration may destroy its face and edge rhythm; upscaling an undersized export cannot recover detail. Choose filtering, pixel snapping and fractional/integer scaling together, and record the tradeoff.

Do not assume an illustrated Beach can be sliced into a seamless grid. Two reasonable future approaches are (a) layered authored ground/shore plates plus reusable props or (b) tiles/terrain transitions plus larger foliage stamps. Choose the simplest approach that meets the approved look and state changes; no engine replacement or mandatory Tiled migration. A static plate must not contain baked pickups, a permanent tree that should become a stump, or gate art that should disappear.

For each proposed repeatable texture/tile:

- Repeat it at least 3×3 at native size and intended scale. Inspect horizontal and vertical seams, especially corners, gradient discontinuities and repeated conspicuous motifs. Compare opposite-edge pixel strips; numeric equality alone cannot detect visible periodic patterns.
- Use a half-width/half-height wrap-offset view in the local editor to expose the seam in the middle; repair and re-test. For painted nonrepeatable scenery, mark it as a stamp/plate instead of making a false tileability claim.
- Test straight edges, convex and concave shore corners, narrow channels and mixed neighbors against actual underlayers. Verify wet-sand/foam continuity and no transparent holes. Every animated-water frame must tile against itself **and** its neighboring transition assets; play loops to catch brightness pumping and phase jumps.
- Test exported atlas at actual zoom and filtering for neighbor bleed. Use appropriate padding/extruded edge pixels for filtered atlases; keep frame content and metadata consistent. Fixed-grid sheets may require loader margin/spacing. Padding is not part of the visible footprint. Do not apply atlas extrusion blindly to a tile that must repeat seamlessly.

The [existing tileset guide](../../../art/TILESET_LAYOUT.md) and [manifest](../../../art/tileset_manifest.json) describe a planned asset scheme, **not the implemented renderer**. If reusing it, preserve its index meanings. If rejecting its grid, palette or layout, introduce a separately approved versioned contract and mapping; do not silently remap cells or generate its optional new areas.

## 4. Real animation production, not a prompt shortcut

The design sheet is a construction reference only. Generated turnarounds commonly change anatomy, proportions, clothing and light. A request for twelve poses does not establish equal frame bounds, consistent baseline, temporal motion or usable alpha. Independently generated frames may boil, drift, swap pouch sides or change limb lengths. A tweened static cutout is not an authored walk cycle; optical-flow interpolation does not repair anatomy. No reliable frame-perfect animation generator is claimed here.

After player identity and scale are approved:

1. Establish one canonical on-model body, elevated camera view and neutral feet anchor. Draw clean directional key poses locally from the approved reference; correct construction before adding detail.
2. Author/test idle and walk for down, left, right and up, since current movement supports all four. Draw side directions separately when necessary to preserve the anatomical right-hip pouch; do not mirror blindly. Start with a minimal playable loop, then propose additional frames only if they materially improve motion. Frame count and rate are not locked by this brief.
3. For each walk, solve contact, passing and opposing contact poses; keep planted feet from sliding at the selected world speed. Add in-betweens deliberately. Maintain head volume, clothing hem, pouch side and light direction. View onion skins and loop playback at gameplay scale, not just a contact sheet.
4. Use a fixed canvas and common pivot through every frame. Distinguish intentional body bob from accidental whole-frame registration jitter. Keep extremities inside the frame with transparent safety room. Separate shadow and body motion where useful. Verify idle↔walk and direction changes, diagonal movement and stop poses.
5. Keep existing chop feedback possible; a bespoke axe-swing animation is extra production work, not already delivered or required by a concept. Propose any new action state and timing contract separately without changing chop counts or inventory rules.

If local frame repair is beyond the available capability, report that honestly and stop at the approved static proof. Do not rename concept poses as a completed animation.

## 5. Sheet/atlas mapping contract

Source inspection: [BootScene.ts](../../../src/scenes/BootScene.ts) loads `player` as 16×24 frames. Three columns × four rows; down/left/right/up rows; walk order within each row is step, idle, other-step, idle at 8 fps. For example down idle=0, walk=[1,0,2,0]; left idle=3, walk=[4,3,5,3]; right idle=6, walk=[7,6,8,6]; up idle=9, walk=[10,9,11,9]. These are **existing mappings**, not a contract for the redesign.

Before exporting a replacement, write a versioned manifest covering:

| Field group | Required explicit data |
|---|---|
| Texture | Version, unique key, actual path, sheet vs atlas, pixel dimensions, color/alpha policy, filtering |
| Frame geometry | Cell width/height or named rects, margin, spacing, padding/extrusion, trimmed source dimensions and pivot policy |
| Animation | Direction and state, ordered indices/names, durations or frame rate, repeat and stop/idle behavior |
| Ground contact | Common feet pivot, origin, physics body width/height/offset in the chosen coordinate system; separate shadow anchor |
| Scenery/state | Per-item identity, prop scale, interaction/body anchors, depth/layer role, tree→stump and gate states |
| Evidence | Source/reference revisions, approvals, edits, tested scale and known limitations |

An example *naming convention*, not an existing export: `player_walk_down_00`, `player_idle_down_00`. Do not assign real frame indices until actual candidate files exist. For a uniform sheet, verify dimensions divide by the chosen geometry, every index is in range and crops show the intended frame. For an atlas, verify names, source sizes, trim offsets and pivots; avoid rotation/trim unless the loader and animation proof support them. Make a labeled inspection contact sheet **from real candidate frames**, never a fabricated preview, and compare it with the manifest.

## 6. Phaser migration plan — only after explicit authorization

The [current strategy](../../VISUAL_DEVELOPMENT_STRATEGY.md) summarizes wider migration facts. Read actual source again when implementation is authorized; these documentation observations do not authorize edits.

| Source/system | Current coupling and required future check |
|---|---|
| [main.ts](../../../src/main.ts), [config.ts](../../../src/config.ts) | Phaser.AUTO, pixelArt=true, 480×270, FIT canvas, TILE=16. Approved resolution/filter/camera changes affect world bounds, HUD, speed perception, interaction distance and exit gaps; do not change only the image size |
| [BootScene.ts](../../../src/scenes/BootScene.ts) | Player loader and animation rows plus code-generated scenery, pickup, NPC, shadow and FX textures. Its comment suggesting same-key swaps are enough is insufficient for a redesign: dimensions, body and mapping must be audited |
| [LocationScene.ts](../../../src/scenes/LocationScene.ts) | Ground TileSprite; rectangular static obstacle TileSprites; tinted shared pickup/NPC keys; player 8×6 body offset 4,18; tree/raft/NPC body setup; body-bottom depth; direction-sensitive shadow offset; prompts and bubbles positioned from sprite display dimensions. Update each affected anchor intentionally |
| [locations.ts](../../../src/data/locations.ts) | Explicit obstacle and interaction positions plus exit topology and flags. Preserve IDs/behavior; submit any layout or collision edits for approval with traversal evidence |
| [HudScene.ts](../../../src/scenes/HudScene.ts), [TitleScene.ts](../../../src/scenes/TitleScene.ts), [EndScene.ts](../../../src/scenes/EndScene.ts) | Audit inventory, dialogue, prompts, banners, title/ending and readable type at new scale; no approved UI redesign yet |
| [DodgeScene.ts](../../../src/minigames/DodgeScene.ts), [CatchScene.ts](../../../src/minigames/CatchScene.ts) | Review enlarged player/encounter art, arena framing, warning shapes, actual hit footprints, banana/coconut readability and HUD overlap separately from exploration |

Proposed sequence after authorization: preserve a reversible baseline → isolate a Beach-only proof with existing gameplay → load versioned candidate assets → map animations, origins/bodies and shadows → implement only the approved layer/depth split → check interactions and east exit → review before expanding to the other four areas. No entire flattening of interactive content into a background; no global canopy drawn over every player indiscriminately. A trunk's feet footprint should govern collision, while canopy occlusion has an explicit design. Larger art must not push the prompt off-screen or trap the player between invisible rectangles.

Keep inventory/trade/flag/state logic stable. Choose per-item visual identity instead of depending on tint alone; test WebGL **and** Canvas because Phaser.AUTO may fall back. Verify CRT-on/off if retained. New assets/metadata must not collide with generated texture keys. Keep loading failures visible and runtime URLs case-correct. Do not migrate to another renderer or introduce a new asset/map dependency merely because the concept is detailed.

## Beach-first milestone order

The next playable milestone is the Beach environment, not a mandatory completed player redesign. After G1, obtain explicit permission for a Beach-only technical/asset proof and integration scope using the existing temporary player. Assess the returned image for layer separation, walkable routes, pickups, the choppable tree and shoreline treatment first; do not slice and import the concept wholesale. The player-reference and combined-image gates below apply when redesigning/replacing the player, which follows the playable Beach milestone. Expand to the other four locations only after the approved look and Beach behavior hold up in game. All production/integration approval requirements remain in force.

## 7. Acceptance gates and evidence

No gates below have been passed by this package. Record owner decisions and real evidence at each gate; do not let success at one imply success at the next.

| Gate | Required evidence and decision | Stop condition |
|---|---|---|
| G0 — Scope/brief | Owner confirms B exploration and allowed content; no runtime changes | New mechanics/areas or imitation creep in |
| G1 — Beach reference | Original environment export reviewed for top water, east route, two rocks, pickups/palm and navigability; owner marks approved aspects | Missing objects, blocked route, noisy/unusable perspective |
| G2 — Player reference | Original design sheet reviewed for original identity, consistent anatomy/outfit, anatomical pouch side and compatible elevated view; owner approves | Portrait appeal masks construction/angle defects |
| G3 — Combined visual target | Both approved originals attached; gameplay-scale combined image reviewed for shared projection/light, readable hero/items and coherent finish | Oversized hero, pasted cutout, changed map or drifting identity |
| G4 — Technical-proof permission | Explicit permission for isolated proof and agreed resolution/finish experiments; owner sees what source/assets may change | Concept approval is being treated as implementation approval |
| G5 — Candidate production proof | Actual local exports, alpha/seam checks, directional loop playback, frame manifest, anchors and measured camera/UI proof reviewed; owner approves production contract | Fake alpha, jitter, wrong indices, fringe, bleed, unreadable scale or animation not actually produced |
| G6 — Integration permission | Explicit approval of candidates and scoped runtime/layer changes; rollback path and test plan | Unapproved replacement or broad renderer restructuring |
| G7 — Integrated acceptance | Build/regression output plus real manual traversal and encounter evidence; owner approves final presentation/publication separately | Automated state tests pass but collision/occlusion/animation fails |

Future verification commands, from the game directory with dependencies available: `npm run build` and `npm test` (see [TESTING.md](../../TESTING.md)). These are **not run or claimed to pass for new art** here. Existing tests can force encounter outcomes; they do not establish visual hit alignment or authentic encounter readability. Capture fresh runtime evidence separately; do not overwrite historical baseline/changelog to make the new look appear pre-existing.

Manual G7 checklist: all four directions and diagonal stops; feet/wall/palm contact; approach, pickup and persistent removal of axe/cheesesteak; chop feedback and persistent stump; Beach↔Jungle exit/arrival; all five locations and hub gates; medkit/rope and banana/sail trades; real dodge and catch telegraphs/hits, failures, retry/recovery; five-wood raft assembly and ending; inventory/dialogue/eight slots; canopy occlusion and prompts; target viewport sizes, input, frame-time/memory observations; WebGL/Canvas; optional CRT and non-CRT. Record actual device/browser/renderer, results and remaining defects. No “ready” label without these checks and owner approval.
