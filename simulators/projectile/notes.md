# Projectile Simulator Notes

## Source

- Route: `public/simulators/projectile/index.html`
- Original top-level source: `projectile_with_wall1.10.html`
- Original source file was not modified.

## Review 2026-05-05

Checked second, after the momentum simulator.

### Issues Fixed

- `.wrap` used `var(-w)` instead of `var(--w)`, so the intended max-width custom property was invalid.
- The first `t` pill in the stats HTML was missing its closing `</span>`, which caused malformed stats markup.
- Animation advanced by `state.dt` once per animation frame, so simulation speed depended on display frame rate. It now accumulates real elapsed time, applies `speed`, and uses `dt` as the maximum physics step size.
- Added the common simulator shell for the "一覧へ" header.
- Replaced the local requestAnimationFrame loop with `PhysicsSimClock.FixedStepClock` from `public/assets/sim-clock.js`.

### Not Changed

- Visual design was not redesigned.
- Wall and ground collision behavior were not conceptually changed.
- Existing controls and labels were kept.
- Model, view, and controls were not split into separate modules yet.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.
- Ran a Node-based DOM/canvas mock smoke test:
  - initial draw executed,
  - play advanced frames,
  - reset executed,
  - stats and annotations rendered,
  - animation frame scheduling remained active.
