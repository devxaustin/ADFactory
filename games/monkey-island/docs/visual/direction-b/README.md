# Direction B — Lush Adventure Diorama

**Review package, not an approved production art contract.** B is the preferred exploration, not the final choice. Images for this package have **not yet been generated**. There are **no finished game assets** here. No runtime source, existing asset, renderer or layout is replaced by this documentation.

Hermes writes the brief and prompts → the **user operates ChatGPT's image tool** → the user returns original exports and identifies approved references → Hermes evaluates and, after the appropriate approval, prepares sprites, tiles and animation → user reviews production proof → integration only after explicit approval. Hermes does not have direct access to that image tool and cannot promise its output, resolution, transparency or consistency. No other generation service, subscription, paid API or purchase is part of this route.

## Read/use order

1. [HANDOFF.md](HANDOFF.md): the exact first request and what to return.
2. [CHATGPT_PROMPTS.md](CHATGPT_PROMPTS.md): three sequential, copy-ready prompts and reference/export rules.
3. This brief: judge composition and style before judging implementation.
4. [ASSET_PIPELINE.md](ASSET_PIPELINE.md): local preparation, mapping, technical proof and acceptance gates.

Context: [visual strategy](../../VISUAL_DEVELOPMENT_STRATEGY.md), [existing A/B/C comparison board](../../concepts/index.html), [historical baseline](../../baseline/README.md). Existing comparison images are procedural taste studies, **not** newly generated images, polished previews or production references. This package adds no substitute previews.

## 1. The original art brief

### The promise

An inviting but substantial tropical island: sun-warmed sand against cool, layered foliage; water described by depth bands and deliberate foam shapes; an observant, resourceful castaway small enough to explore, large enough to act. Detail belongs to crafted plant masses, bark and shore transitions, not uniformly noisy pixels. The eye should find the player, both pickups and the Jungle route before it starts admiring leaf texture.

“Diorama” means coherent scale, overlapping painted planes and tactile materials. It does **not** mean a tilted miniature camera, visible model base, isometric diamond grid, miniature blur, 3D engine requirement or photorealistic rendering. For this first refinement, propose **high-detail 2D pixel illustration with painterly lighting, intentional pixel clusters and controlled, sprite-friendly edges**. This is an exploration of the requested tropical pixel-art inspiration, not a finalized finish: a smoothly painted alternative may be requested separately. Do not quantize a concept automatically and call that authored pixel art.

### Protected scope

Keep Phaser and the island-escape progression. All present graphics, player dimensions, palette, UI, CRT treatment, camera behavior and rendering organization are replaceable **after approval**; none is an artistic constraint. Do not silently add quests, NPCs, functional props, regions or new traversal abilities. The initial Beach composition retains the current top-water/east-Jungle orientation to make review comparable; a different layout can be proposed separately, not assumed.

| Existing location | Gameplay purpose to preserve | B's proposed visual translation, not an approved asset list |
|---|---|---|
| Beach | Starting/respawn area, axe and cheesesteak pickups, choppable palm, east route to Jungle | Open warm-sand travel lane framed by cool vegetation; readable shoreline and isolated pickup silhouettes |
| Jungle | Traversal hub, tiger/cheesesteak dodge encounter and disappearing thicket gate, bananas, wood trees | Dense layered greens outside travel lanes; tiger, gate state and hub exits remain unmistakable |
| Village | Medkit pickup, medkit-for-rope exchange, wood trees | Weathered materials and lived-in warmth; respectful original inhabitants, no stereotyped costume shorthand |
| Volcano | Banana-for-sail catch encounter and hazard setting | Controlled hot/cool contrast, clean hazard edges, quiet arena under moving encounter objects |
| Dock | Wood tree and raft assembly/escape site | Legible working shoreline, wood/rope/sail state changes and a clear escape focus |

Do not relocate the raft site to the Beach or add a shipwreck, bridge, cave, treasure chest, extra encounter or new island. Existing baseline and changelog are historical facts, not art constraints or targets for revision. Preserve trades, flags, inventory, recovery, five-wood requirement and escape logic rather than redesigning them to suit an image.

### Beach content and hierarchy

Source: [locations.ts](../../../src/data/locations.ts). Water currently spans the top; the only exit is east/right to Jungle near the vertical midpoint. The Beach has two rock obstacles, a rusty axe, a cheesesteak and one choppable palm. The first concept should contain these, not a more impressive invented level. Current coordinates need not be painted literally, but movement space and route continuity must remain plausible. No free swimming is implied by shallow-looking water.

- **First read:** player in the later combined proof; in the first environment-only image, the open playable sand and route east.
- **Second read:** distinctive axe silhouette, sandwich shape and the choppable palm's exposed trunk base. Food must not read as a shell or generic glowing loot dot.
- **Third read:** wet sand, foam, rock facets and layered leaves. Avoid every edge carrying equal contrast.
- Keep both sides of the east corridor visually open; do not let a canopy or foreground prop look like a closed wall there. Decorative foliage must not impersonate a second exit.
- Put visual richness around the travel area, not over every interaction point. Keep trunk approach space and stump replacement plausible. Do not paint the pickups permanently into a future ground plate.

## 2. Redesigned player: the practical castaway

**Original proposal, all traits open to owner revision:** an adult coastal repairer abruptly stranded, alert and dryly amused rather than swaggering. Medium-brown skin, short dense dark curls, strong eyebrows, a broad slightly angular face and a compact sturdy torso over active, visible legs. Approximately five-heads-tall stylization: taller and more expressive than C's compact figure, less elongated than realistic adventure illustration. No named franchise character, actor likeness or pirate-adventure imitation.

Proposed wardrobe: a faded rust-red short work jacket worn open over a sand-colored collarless shirt, deep blue-green cropped work trousers, simple dark canvas shoes and a **small rectangular repair pouch at the right hip**. One light elbow patch gives a readable secondary shape without adding jewelry or miniature tools. No hat, sword, gun, skull emblem, long blond ponytail, recognizable pirate coat or copied costume/color arrangement. The “repairer” identity is characterization only: it adds no usable equipment, recipe, inventory item or mechanic.

The silhouette comes from curls, squared short jacket hem and separated lower legs—not an enormous head or ornamental gear. Expressions: attentive neutral, skeptical amusement and quiet determination. Idle stance slightly forward, hands relaxed and visible; walk must be practical, not a heroic strut. No permanently held axe: pickups and inventory must remain independent of costume. The hip pouch stays on the same anatomical side when turning; do not mirror asymmetric costume details blindly.

**Design-sheet purpose:** establish identity, outfit, proportions and compatible viewing angle. Turnaround views and expression studies are illustration references, **not aligned animation frames**. A separate later sprite-production pass must solve feet, frame extents and motion.

## 3. Perspective, scale and light contract to test

These are proposal rules for the next images, not final engine constants.

| Dimension | Proposed rule | Reject/revise when |
|---|---|---|
| Projection | Orthographic-like elevated three-quarter/top-down 2D; camera looks down roughly 40–50 degrees; vertical trunks upright on screen; no horizon or vanishing-point convergence | Character is side-on while ground is aerial, scene becomes isometric, or roof/rock top faces use conflicting angles |
| Direction | Screen north is up; shoreline at top; east/right route stays legible | A cinematic horizon, rotated map or closed east edge breaks orientation |
| Depth | Overlap and value grouping, not distant-object shrinkage; same-sized objects keep scale across the screen | Player size changes with screen height or foreground decoration becomes an unexplained giant |
| Character scale | Begin combined proof with full player height around 10–12% of playable scene height; head, hands and feet readable without portrait enlargement | Hero dominates scene or becomes an unrecognizable speck |
| Relative scale | Palm taller than player; trunk approachable; rock bases and pickups plausibly sized, with deliberate modest item exaggeration | Palm behaves like a bush, axe becomes a weapon monument or sandwich cannot be found |
| Light | Single broad warm light from screen upper-left; cool blue-green ambient fill; shadows fall lower-right, short enough not to hide travel space | Rotating a character rotates its sunlight, shadows contradict each other, or every leaf has independent rim glow |
| Value | Pale quiet sand; grouped mid/dark foliage; distinct player and item silhouette; subdued distant texture | Grayscale review loses player or exits; shiny water becomes the only focal point |
| Edges | Crisp designed contours, sparse material texture, selective internal soft shading | Photographic microtexture, thick black outlines on only one asset or airbrushed cutout halos appear |

The concept-sheet frontal/rear views document anatomy; the elevated game-facing views govern integration. Ground decorations lie in the same projected plane; tree/rock bases define ground contact. Keep contact shadows separate from long decorative shadows where later layering requires it. Foreground canopy is a proposed occlusion layer, not permission to hide interactions.

**Tentative review canvas:** request landscape 16:9, for example 1536×864 if ChatGPT supports it. This is an image-review target only, not a native game resolution. Record the actual export size; never fabricate it or upscale to claim native detail. Player percent height is a composition hypothesis, not a mandated frame size. The combined image is the place to approve/revise it. Formats, native resolution, sprite sizes, camera zoom, tile grid, outline policy, alpha policy and UI treatment remain tentative until technical proof.

## 4. What B changes relative to A and C

This compares the documented directions, not newly produced images or a measured quality ranking.

| Decision | A — Sunlit storybook coast | B — Lush adventure diorama | C — Graphic island folklore |
|---|---|---|---|
| Spatial composition | Airy negative space, rounded plant clusters, wide sandy paths | Rich boundary vegetation and shore layering around deliberately quiet walkways | Strong carved shapes, patterned materials, bolder negative-space design |
| Player | Approachable medium proportions and expressive broad poses | Slightly taller practical explorer; face, jacket and gait carry personality | Compact expressive castaway; graphic silhouette carries more than small anatomy |
| Color/light | Warm, light, welcoming; cream/parchment framing | Cool shaded greens against warm sand and restrained highlights; dark quiet framing candidate | Coral/jade relationships and graphic value blocks; less simulated light |
| Production burden | Simpler masses offer easier reusable pieces; risk of remaining sparse | More shoreline transitions, foliage layers, cleanup and multi-angle character work; highest occlusion risk | Shape/pattern consistency needs deliberate authorship; abstract objects may need redesign for recognition |
| Gameplay failure to test | Pleasant but landmarks may lack distinction | Beautiful detail hides pickups, routes, collisions or attack telegraphs | Symbols/patterns obscure item identity and walkable surfaces |
| What to borrow deliberately | Warmth and uncluttered paths can improve B | The current preferred *test*, not a final winner | Shape economy can restrain B's foliage noise |

Do not average all three into an incoherent mashup. Review B's richer materials with A-level path clarity and C-level silhouette discipline; if a different priority wins, name that change and request approval rather than calling it unchanged B.

## 5. Review questions and approval record

Ask the owner to mark each returned image **approve as reference / revise / reject**, with the exact filename and revision. Approval of one image's palette does not approve its layout, character, asset sizes or integration.

1. Does this feel like a place to explore rather than a backdrop or toy model?
2. Is vegetation rich without concealing the east route, pickups or palm base?
3. Does the new player feel original and fit the world at actual gameplay scale?
4. Are ground contact, view angle, light and material finish consistent?
5. Which choices are approved: environment mood, layout, player identity, perspective, scale, finish? Which remain open?

No approvals are recorded yet. Start with the environment request in [HANDOFF.md](HANDOFF.md), review the returned original for playable feasibility, and approve a scoped production plan before a Beach-only playable proof using the temporary player. The redesigned player follows that milestone; then use the player sheet and combined scene prompts with explicitly approved earlier exports. A pleasing combined image approves a visual target, not tiles, sprites, animation or runtime replacement. The gates in [ASSET_PIPELINE.md](ASSET_PIPELINE.md) keep those decisions separate.
