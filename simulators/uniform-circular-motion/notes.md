# Uniform Circular Motion Simulator Notes

- Route: `public/simulators/uniform-circular-motion/index.html`
- Created: 2026-06-12.
- Purpose: show uniform circular motion with speed, angular velocity, centripetal acceleration, and centripetal force.
- Uses the common simulator shell and `PhysicsSimClock.FixedStepClock`.
- Controls:
  - radius `r`
  - mass `m`
  - period `T`
  - playback speed
  - trail, component guides, centripetal force vector, and grid display
- Physics:
  - `omega = 2 pi / T`
  - `v = r omega`
  - `a = v^2 / r = r omega^2`
  - `F = ma`
- Existing simulator route files were not modified.
