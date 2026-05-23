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

## Re-projectile 2026-05-23

Added `Re-projectile.html` while leaving the existing `index.html` unchanged.

### UI Design

- Basic mode keeps only initial speed, launch angle, gravity, trajectory display, playback, one-step, reset, and fit.
- Detail mode contains initial position/height, wall display and wall dimensions, wall/ground restitution, time step, time scale, theory/grid display, stop-on-ground, zoom, and pan.
- The entry page links both the original route and the Re route, so the original remains available for comparison.
- Tablet and touch operation were improved:
  - one-finger drag pans the view;
  - two-finger pinch zooms around the pinch center;
  - mouse wheel or trackpad scroll zooms around the cursor;
  - controls have larger touch targets.
- Dark theme is the default to preserve the original simulator atmosphere.
- Light theme is available only through the explicit `Dark` / `Light` switch.

### Physics Model

- Coordinates use `x` horizontal and `y` vertical upward, with ground at `y = 0`.
- Motion between events is analytic:
  - `x(t) = x + vx t`
  - `y(t) = y + vy t - 1/2 g t^2`
  - `vy(t) = vy - g t`
- Each simulation step repeatedly searches the next event within the remaining step time.
- Event candidates are:
  - ground arrival, selected from the positive root of `y + vy t - 1/2 g t^2 = 0` only when crossing downward;
  - wall arrival, selected from `t = (wallX - x) / vx` only when `0 <= y(t) <= wallHeight`.
- The earliest positive event is applied first, then the remaining time in the same step continues from the reflected velocity.
- Reflection rules:
  - wall collision: `vx = -ew * vx`
  - ground collision: `vy = -eg * vy`
- If `eg = 0` or stop-on-ground is enabled, the projectile stops at the ground without bouncing.
- Air resistance is intentionally not included.

### Reason For Rework

- The original route had wall and ground collision handling split across branches, including a same-step post-ground wall check whose condition was effectively unreachable.
- The Re route uses one event-selection path for readability and to reduce missed-collision fallback behavior.
