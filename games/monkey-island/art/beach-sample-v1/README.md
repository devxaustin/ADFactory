# Beach sample 01 — visual approval package

**Awaiting sample approval. No playable prototype has been implemented.**

Open [the self-contained review board](review.html) in a browser. It includes native/2×/3× controls, a water-loop preview, baseline collision guides, the before/after comparison and the actual sample exports.

- [Proposed production specifications and prototype acceptance plan](SPECIFICATIONS.md)
- [Optional ChatGPT prompts and export requirements](CHATGPT_PROMPTS.md)
- [Native mockup](mockup.png) · [3× mockup](mockup-3x.png)
- [Before/after comparison](comparison.png)
- [Sample contact sheet](contact-sheet.png) · [Water-loop GIF](water-loop.gif)
- [Baseline collision/exit guide overlay — not tested new physics](mockup-collision-plan.png)
- [Machine-readable asset manifest, provenance and hashes](manifest.json)

## Organization

`terrain/` contains separate opaque 16 × 16 PNG cells: sand variations and four-frame water/depth/shore studies. `sprites/` contains independent scenery, pickups and shadow masks. The manifest enumerates 32 PNG pieces. The mockup is assembled from them; it is never loaded into the game as a flattened background.

The palette is a proposed 32-color Beach core. Non-shadow sprites have binary alpha; shadow masks use a single flat 96/255 opacity level. Palm/rocks are disclosed derivatives of the user-supplied reference, masked and nearest-neighbor resampled; terrain and small props are local code-authored studies. Existing player art appears in the mockup only for scale. There was no new AI generation, paid service, background-image replacement or claim that cropping a reference alone creates finished production assets.

## What to approve

Review pixel density, palette/shadows, palm/rock/pickup scale and room composition. The sample intentionally stops short of full production. Water repetition, vegetation variety/material detail and silhouette/footprint cleanup still require refinement. Artistic approval unlocks the scoped asset-completion and Phaser-prototype stage, not merge/deployment or other-location work.

## Validation performed locally

```sh
# From games/monkey-island; Pillow 13.0.0 is an optional art-tool dependency only.
python -m pip install -r tools/beach-sample-requirements.txt
python tools/test_beach_sample.py

# From repository root; existing game TypeScript/Vite + portfolio Astro build.
npm ci
npm run build
```

- Six asset/review-package checks pass: expected sample roles/dimensions/status; SHA-256/dimensions/palette/alpha; repeat-edge contract; recorded baseline geometry; offline board/GIF structure; complete nonconstant animation groups.
- Initial asset checks failed before export generation. The cheesesteak size contract was subsequently changed and failed before the longer roll export was implemented. The offline-board check also failed before board creation.
- Existing game TypeScript/Vite and portfolio Astro build pass. The generated tracked Phaser bundle was restored after build; no runtime source, game assets or website build artifacts are included in this change.
- The root dependency audit reports one moderate and two high findings in the unchanged lockfile; these are not fixed by this art-only change. The game package audit reports zero. Build emits the existing large-bundle warning.
- Browser inspection: all three embedded board images load; 1×/2×/3× and static/water/guide controls switch correctly; the review pane scrolls horizontally at large zoom rather than scaling pixels fractionally. No page-level horizontal overflow was observed at the inspected viewport.
- This is **not** a run of the unmerged Batch A/Catch gameplay suites. No new gameplay or collision pass is claimed. The [specification](SPECIFICATIONS.md#prototype-acceptance-checklist--after-sample-approval) lists the real-runtime tests required after approval.

A separate read-only, art-only PR workflow validates the committed sample without the private original. It does not duplicate Batch A's game/build workflow and cannot deploy.

## Regeneration

```sh
# Inputs stay local; do not commit the flattened reference or local user paths.
python tools/make_beach_sample.py --reference ORIGINAL.png --baseline BEFORE.png
```

The original must match the reviewed SHA in the manifest. `BEFORE.png` is the Batch A Beach baseline capture from source main commit `a4aa13e250dfbc9d08b93a9d0a95fef1b4e3719a`. The generator uses a fixed seed, nearest-neighbor resampling, explicit palette/mask operations and the pinned Pillow version. Both local inputs are required to regenerate the complete board; neither is required just to validate the committed exports. A new source image needs a separately reviewed mask/anchor plan, not a silently substituted file.

## Development boundaries

This branch is based directly on `origin/main`, not the unmerged PR #1/#2/#3 branches. All samples/tooling/docs are review-only. No existing art, gameplay, Catch code, other location or deployment workflow changes. Do not merge or deploy without explicit user approval. Plan the implementation branch against then-current main after this sample is approved; do not silently create a new stack on unmerged Batch A.
