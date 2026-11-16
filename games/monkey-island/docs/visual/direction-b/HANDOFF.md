# First handoff — Beach only

**Status:** Direction B is preferred exploration, not final approval. Images for this package have not yet been generated; no finished game assets exist. Runtime source/assets remain unchanged. Export formats and resolutions are tentative until proof.

## Exact first image request

Open ChatGPT's image tool yourself and copy the **entire fenced block under “Prompt 1 — Beach environment only (first request)”** in [CHATGPT_PROMPTS.md](CHATGPT_PROMPTS.md). Send that as a single request, text only, with no reference attachments on this first pass.

Request **one original opaque landscape Beach concept**, not a player, spritesheet, tileset or gameplay screenshot. It must show top/north water, clear sand traversal, an open east/right Jungle route, two rocks, the rusty axe and cheesesteak as separate pickups, and an approachable choppable palm. No new gameplay props/areas, raft site, UI or franchise imitation. The prompt contains the full perspective, lighting, material and negative constraints; do not replace it with this summary. Prefer PNG, 16:9 if supported; 1536×864 is a review suggestion, not a requirement or game-resolution commitment.

Hermes provides the prompt, **not direct image generation**. No other generation service, subscription, payment or API is part of this workflow.

## Return to Hermes

1. The **downloaded original export file** at its actual resolution, not a screenshot/thumbnail or resized copy. Suggested filename: `beach-b-concept-v01-original.png`; keep the real extension if it is another format.
2. The exact prompt you used and any changes you made; note whether you attached anything. Tool/model/version if visible, otherwise “unknown.” Actual file dimensions/format if available; Hermes can inspect them if not.
3. Your decision: **approve as reference / revise / reject**. Name the file/revision and specify which aspects you approve—mood, palette, density, perspective, layout—and which remain open. For example: “Approve lighting and shoreline; revise dense east edge; no layout or production approval yet.”
4. Two or three specific observations: can you find both pickups, read the east route and imagine walking to the palm? Does it feel richly illustrated without becoming noisy? You do not need to approve anything just because it was generated.

Hermes then reviews the actual export against the [brief](README.md), flags technical risks and drafts targeted corrections if needed. **Do not request all three images yet.** Once the Beach is approved, use Prompt 2 with its original export; once the player sheet is also approved, use Prompt 3 with both originals. Local sprite/tile/animation production and runtime integration each require later explicit approval under [ASSET_PIPELINE.md](ASSET_PIPELINE.md). No finished animation, transparency, tileability or working integration is implied by a concept approval.
