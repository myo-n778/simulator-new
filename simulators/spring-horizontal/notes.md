# Horizontal Spring Simulator Notes

## Source

- Route: `public/simulators/spring-horizontal/index.html`
- Original top-level source: `ばね振り子水平ver1.01.html`
- Original source file was not modified.

## Review 2026-05-05

Checked fourth, after pendulum.

### Issues Fixed

- Reset forced `x0` back to `0.50` regardless of the current initial displacement input.
- Reset now restarts from the current initial values already shown in the controls.

### Notes

- Integration already used elapsed time with fixed RK4 substeps.
- Coulomb friction is implemented as a smoothed sign function using `tanh`, which avoids numerical chatter near zero but is an approximation of ideal dry friction.
- The page currently loads MathJax from a CDN. This is acceptable for a browser prototype, but app/offline packaging should later localize or remove that dependency.

### Not Changed

- Visual design was not redesigned.
- Existing controls and labels were kept.
- The friction model was not changed.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Physics model and UI controls were not otherwise changed.
