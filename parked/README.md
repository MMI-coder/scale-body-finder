# Parked: the male catalogue

Nine male bodies, taken out of the shipped app on 2026-10-17. Nothing here is
broken or abandoned — it was switched off because it wasn't earning its place:

> *"I don't care so much about the male bodies at this point. Handy? Sure. But
> honestly a bit useless at this point."*

## What's here

- `bodies-male.csv` — the nine rows, with the same header as `data/bodies.csv`,
  so they paste straight back in
- `images/` — their nine images, byte-for-byte as supplied

## How to bring it back

1. Append the rows of `parked/bodies-male.csv` (everything but the header line)
   to `data/bodies.csv`
2. Move `parked/images/*` back into `images/`
3. Set `MALE_CATALOGUE = true` in `utils/matching.js`
4. `npm run data && npm run verify`

The Gender control reappears, the male section works as it did, and the
catalogue export picks the bodies back up on the next `npm run catalogue`.

## Why this is safe to leave alone

The male code paths were not deleted — the engine, importer, card and batch all
still handle `Gender: Male`, and the verifier still exercises them against
fixtures on every push. That's deliberate. Dormant code normally rots silently
and "turn it back on" quietly becomes "rebuild it"; here CI fails instead, so a
future change that breaks the male path announces itself.

## What was true when it was parked

- Nine bodies: one TBLeague M-34, seven WorldBox AT-series, one MoJoy MJ-DD01
- Seven of the nine had **only** a height — no chest, waist or hips. That is why
  Height was the male section's only sort, and why parking them is what allowed
  Height to stop being a priority on the female side.
- The male head allowance (peg + 11–15mm) was never actually used: every male
  body supplied a height, so none fell back to deriving one. The two that could
  calibrate it both disagreed with it — M-34 measures +20mm above its peg,
  MJ-DD01 +27mm. If this comes back and a body ever arrives with a peg and no
  height, that range will read low.
- Builds in use: Heavily Muscled, Average Muscle Build, Athletic, Heavy,
  Asian Athletic, Asian Average. All nine `Build` values and their definitions
  are still in `TERMINOLOGY.md` and the glossary.
