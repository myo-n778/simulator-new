# Momentum Simulator Notes

## Source

- Route: `public/simulators/momentum/index.html`
- Original top-level source: `運動量保存則シミュレーター.html`
- Original source file was not modified.

## Review 2026-05-05

Checked first because it is the first planned brush-up target.

### Issues Fixed

- Reset set `state = null`, and the animation loop returned before scheduling the next frame. After pressing reset, starting again could recreate state without restarting animation.
- History was appended every animation frame even while paused. Because time did not advance while paused, this could grow without limit and distort graph data.
- Friction updated velocity before position and stopped immediately when the velocity crossed zero, losing the remaining stopping distance within that frame.
- Cart overlap handling always forced cart 1 to the left and cart 2 to the right. If the user placed cart 1 to the right of cart 2, collision resolution could swap their order visually.
- Collision response was applied whenever carts overlapped, even if they were already moving apart. It now changes velocities only when the carts are approaching, while still resolving overlap.
- The two carts were drawn on separate vertical lanes even though the model is a one-dimensional collision. They are now drawn on the same track line, with labels and velocity arrows offset for readability.
- Added the common simulator shell for the "一覧へ" header.
- Replaced the local requestAnimationFrame loop with `PhysicsSimClock.FixedStepClock` from `public/assets/sim-clock.js`.

### Not Changed

- Visual design was not redesigned.
- The simulator remains a single-file HTML copy.
- Wall and cart collisions remain elastic.
- Collision physics was not changed for the same-track visual adjustment.
- Model, view, and controls were not split into separate modules yet.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.
- Entry page links were checked; missing links: 0.
- Ran a Node-based DOM/canvas mock smoke test:
  - initial loop executed,
  - reset executed,
  - start after reset executed,
  - readouts updated after restart,
  - animation frame scheduling remained active.
