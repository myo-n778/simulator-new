# Double Spring Simulator Notes

## Source

- Route: `public/simulators/double-spring/index.html`
- Original top-level source: `2重ばね振り子水平ver1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked twelfth.

### Issues Fixed

- Reset forced all parameters back to built-in defaults instead of restarting from the current initial values shown in the controls.
- Reset now restarts from the current `x0` and `v0` values without rewriting the controls.

### Notes

- Like the horizontal spring simulator, dry friction is implemented with a smoothed `tanh` sign approximation.
- The page currently loads MathJax from a CDN. App/offline packaging should later localize or remove that dependency.

### Not Changed

- Effective spring constant model `kL + kR` was not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Physics model and UI controls were not otherwise changed.
