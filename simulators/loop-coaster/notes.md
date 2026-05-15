# Loop Coaster Simulator Notes

## Source

- Route: `public/simulators/loop-coaster/index.html`
- Original top-level source: `omega_coaster_sim_v1.36_buttons_each_redframe.html`
- Original source file was not modified.

## Review 2026-05-05

Checked thirteenth.

### Issues Fixed

- `eFloor` and `eSlope` control binding was nested inside the `mu` binding callback.
- This meant changing `mu` could repeatedly register extra handlers for restitution controls.
- The three bindings are now independent.

### Not Changed

- Track geometry, loop physics, detachment logic, and collision handling were not redesigned.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main frame loop with `PhysicsSimClock.FixedStepClock`.
- Track geometry, energy logic, and UI controls were not otherwise changed.
