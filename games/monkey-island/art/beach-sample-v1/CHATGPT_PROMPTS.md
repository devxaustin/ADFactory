# Optional ChatGPT art prompts — Beach production follow-up

These prompts are available **if visual review calls for new clean artwork**. No additional generation is required to open/review the current local sample. Hermes has not accessed ChatGPT generation directly and has not called any paid image service.

Use your existing ChatGPT workflow. Attach the approved original Beach reference and, if helpful, this sample's contact sheet. Ask for **one standalone asset per image**, not another full map or an automatically assembled sprite sheet. Do not use the full flattened Beach image as a finished playable background.

## Common requirements to include with every request

- Original art compatible with the reference's chunky 16-bit tropical RPG treatment. No Pokémon/franchise characters, branding, maps or copied tiles.
- Elevated top-down overworld perspective: visible tops/fronts, upper-left light, flat shade ramps, dark-teal foliage shadows, golden/peach sand, turquoise/blue water and gray/lavender rocks.
- Clearly intentional pixel clusters. No painterly micro-texture, smooth gradients, realistic materials, blur or antialiased halos.
- Complete silhouettes, generous transparent margin, no cut-off fronds, no background, labels, grid, checkerboard drawing, ground patch or baked cast shadow.
- Return the **original PNG export**, not a screenshot, JPEG, chat thumbnail or resaved social image. True alpha transparency is required for props. If transparency is unavailable, disclose that instead of drawing a fake checkerboard; a flat contrasting matte is a cleanup source, not a finished transparent sprite.
- Target dimensions below describe the intended **native art**, not an assumption the model will obey exact sizes or the pixel grid. A clean 8× integer enlargement is acceptable as a working source; send the original dimensions unchanged for inspection. Hermes will verify alpha, scale, pixel clusters, seams, perspective, palette, frame/pivot layout and in-game readability before integration. Downsampling/quantization alone does not establish production readiness.

## 1. New palm variation / clean interactive palm

Copy after the common requirements:

> Create one original isolated tropical palm sprite matching the attached Beach reference. This is a modular game object, not a scene or illustration. Preserve a strong readable canopy with long layered fronds, a naturally curved segmented brown trunk and a clear trunk base. Use yellow-green highlights, medium greens and dark-teal shadows with about four foliage shades, plus a separate small wood ramp. Include no rocks, flowers, sand, surrounding plants, cast shadow or texture behind the tree. Avoid tiny leaf veins and noisy single-pixel detail. All fronds must fit inside the canvas. Intended native frame: 80 × 96 pixels, with a tree silhouette approximately three to four 24-pixel temporary-player heights; retain transparent margin. The trunk ground-contact point must be unambiguous. If exporting enlarged, use exactly 640 × 768 with 8 × 8 blocks per native pixel and no interpolation. Do not claim an enlarged bitmap is pixel art unless the clusters really follow that grid. Produce ONE PNG asset. This first image is a candidate; do not add animation frames.

After a palm is approved, request a **matching stump separately**, using its trunk thickness, bark ramp and cut-surface perspective. Native stump target 16 × 12, optional exact 8× source 128 × 96. The stump's contact pivot must match the tree's ground location; never reuse a canopy-center pivot.

## 2. Cohesive tropical ground vegetation

Copy after the common requirements, selecting one plant type per request:

> Create one isolated [broad-leaf tropical bush / ground fern / small red tropical flowering plant] for the attached Beach's modular game kit. Use the same pixel size, green ramp, upper-left light and elevated top-down perspective as the approved palm. Form a dense readable silhouette from overlapping broad leaves with a few deliberate highlights, not a skeletal line drawing or many tiny disconnected leaves. No pot, sand mound, grass carpet, cast shadow or surroundings. Intended native frame [32 × 24 for bush / 24 × 24 for fern / 16 × 16 for flower]. Keep a transparent border and an identifiable bottom-center ground contact. For the flower, use small restrained red blooms rather than bright oversized decorative signage. Return one original PNG. If a clean 8× enlarged export is easier, use [256 × 192 / 192 × 192 / 128 × 128] with crisp integer pixel blocks and no smoothing.

Request silhouettes with different masses/leaf arrangements, not arbitrary palette or scale changes. Hermes will check consistency beside the palm and temporary player.

## 3. Clean rock obstacle source

Copy after the common requirements, choosing A or B:

> Create one isolated moss-topped tropical beach rock [A: compact upright boulder / B: wider low boulder group], matching the attached reference's gray/lavender rock planes, dark outline accents and restrained green moss. Use broad 3–4-tone stone faces with no realistic texture, sandy background or baked cast shadow. Include a clear solid ground base; keep loose decorative pebbles minimal so the collision footprint is readable. Intended native frame [A: 48 × 40 / B: 64 × 48]. Leave transparent padding. Do not put a flat rectangular rock silhouette into a painting or add labels. Return one PNG, optionally at exact 8× enlargement [384 × 320 / 512 × 384]. This art must be checked against the existing two obstacle positions before it becomes a collider; the frame rectangle itself is not the collider.

## Terrain follow-up

Terrain is currently authored locally. Prefer local seam-safe editing for the small tiles; do not ask ChatGPT to invent a finished tilemap or trust a tiled preview as proof of seams. If a new material source is requested, obtain isolated sand/water material studies, then author actual 16 × 16 repeating cells, edge/corner transitions and a measured four-frame loop locally. Water/ground tiles are opaque; props need real alpha. Animated waves require coherent frame-to-frame motion, not four unrelated generated illustrations.

## Handoff checklist

Send the original PNG(s), the exact prompt used and whether the result is approved or still exploratory. Do not crop off transparent borders or upscale through a browser editor. Hermes will measure the returned file rather than assume its requested size, alpha, palette, tileability or animation consistency. Artistic acceptance and technical acceptance remain separate.
