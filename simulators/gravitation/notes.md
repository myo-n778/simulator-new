# Gravitation Simulator Notes

## Source

- Route: `public/simulators/gravitation/index.html`
- Original top-level source: `U-gravitation.ver1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked ninth, as part of the astronomy group.

### Issues Fixed

- The play/pause button always added the `primary` class in both branches. It now removes the class when paused.

### Notes

- The simulator uses RK4 integration for orbital motion.
- The main orbit calculations were not redesigned in this pass.

### Not Changed

- Gravity model and RK4 integration were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main update loop with `PhysicsSimClock.FixedStepClock`.
- Physics model and UI controls were not otherwise changed.
