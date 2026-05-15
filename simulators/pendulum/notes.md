# Pendulum Simulator Notes

## Source

- Route: `public/simulators/pendulum/index.html`
- Original top-level source: `simple pendulum1.02.html`
- Original source file was not modified.

## Review 2026-05-05

Checked third, after momentum and projectile.

### Issues Fixed

- Playback advanced by a frame-count based number of RK4 steps, so apparent simulation speed depended on display frame rate.
- Playback now accumulates real elapsed time, applies the speed multiplier, and uses the internal `dt` value as the physics step size.

### Not Changed

- RK4 integration was kept.
- Small-angle mode and full `sin(theta)` mode were kept.
- Visual design was not redesigned.
- Existing controls and labels were kept.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Kept the long-press single-step helper local because it is a control-specific repeat action, not the main simulation clock.
- Physics model and UI controls were not otherwise changed.
