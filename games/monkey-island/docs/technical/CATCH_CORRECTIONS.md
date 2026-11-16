# Catch minigame corrections — scoped Batch B technical work

## Scope and dependency

This branch is stacked on the unmerged Batch A branch `test/monkey-island-batch-a` (PR #1). Its PR should be reviewed against that branch so only this correction is shown. Do not merge into Batch A or main without owner approval. After PR #1 is approved and merged, rebase/retarget this PR to main and rerun validation.

No visual-concept work, art assets, rendering-system restructuring, new locations, progression changes or balance changes belong to this technical PR.

## Corrections

1. **Horizontal-only basket input:** take the sign of the shared normalized X input. Up/down keys no longer reduce horizontal speed; opposing horizontal keys still cancel. World/tiger movement and shared input logic are unchanged.
2. **Continuous falling-item contact:** determine the interval within each frame during which the falling item's centre crosses the original open vertical catch band. Check horizontal overlap against the basket's clamped movement during that same interval, rather than only comparing final positions. Process the item once, before offscreen cleanup.

The original horizontal tolerance, vertical band, basket speed and boundaries remain. The code accounts for when the basket reaches a screen edge, rather than assuming it moved linearly between its initial and already-clamped final positions.

Unchanged: target banana count, time limit, coconut limit, spawn randomness/probabilities, difficulty, health loss, trade consumption/rewards, graphics and audio. Catch fairness/quota changes are not included.

## Test-first evidence

- Before the input fix, actual held diagonal keys moved the basket about 14.849242 pixels in a 0.1-second tick instead of the expected 21; both left/up and right/down regression tests failed, while horizontal-only, vertical-only and opposing keys passed.
- After the minimal input correction, all five horizontal cases passed.
- Before crossing detection, fast banana/coconut objects passed completely through the catch band without a score/hit. Both tests failed with zero recorded interactions. After crossing detection both passed.
- Moving-basket tests demonstrated why a vertical-only sweep plus final X position is insufficient: it awarded a catch after the item had already passed, and missed an actual interception when the basket finished elsewhere. Both failed before the interval-based relative contact correction and passed afterward.
- Additional guards cover ordinary small steps, objects already below the basket, horizontal misses, unchanged open-boundary behavior, single processing, and clamping at both screen edges.

## Validation

- Seventeen new Catch regression cases; forty-one tests total including all Batch A regressions.
- Local full run: **41 passed**.
- Full root `npm run build`: passed, including TypeScript, Vite game build and Astro portfolio build. Existing portfolio chunk warning remains. Generated output is not committed.
- Local Windows packaged Chromium failed to launch, so an uncommitted execution adapter used installed Chrome 157.0.8103.79. The unchanged authored-route test exceeded the repository's 30-second bound on this slower local setup; with a local-only 60-second bound the full suite passed (route took about 33 seconds). No test expectations or repository timeout were weakened. Hosted CI should be checked separately with its normal Chromium configuration.

The tests instantiate real Phaser scenes in a browser and manually tick the actual Catch implementation with deterministic supplied items while its intro is open. They use real keyboard events for movement. This directly tests the two corrected algorithms; it is still not a difficulty benchmark, a normal human playthrough or complete large-frame simulation of spawning/timers.

## CI support

The existing read-only validation workflow also accepts PRs targeting the unmerged Batch A branch so this stacked correction receives tests/build validation. No push deployment, Pages permission, publication step or automatic merge is added. PR #1's branch itself is not modified.
