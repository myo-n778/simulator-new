# Vertical Spring Simulator Notes

## Source

- Route: `public/simulators/spring-vertical/index.html`
- Original top-level source: `ばね振り子鉛直ver1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked fifth, after horizontal spring.

### Issues Fixed

- The HTML control default showed `y0 = 0.2`, but startup JavaScript overwrote `y0` to `0`.
- Reset also forced `y0` back to `0` regardless of the current initial displacement input.
- Startup and reset now use the current initial values shown in the controls.

### Notes

- Integration already used elapsed time with fixed RK4 substeps.
- The equation uses downward-positive displacement from natural length:
  `y'' = -(k/m)y - (c/m)y' + g`.
- The displayed equilibrium-based displacement is computed as `x = y - mg/k`.

### Not Changed

- Visual design was not redesigned.
- Existing controls and labels were kept.
- Damping and gravity model were not changed.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Kept the graph-canvas readiness retry local because it is a startup layout guard, not the main simulation clock.
- Physics model and UI controls were not otherwise changed.
