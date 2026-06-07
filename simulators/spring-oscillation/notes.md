# Spring Oscillation Simulator Notes

## Source

- Route: `public/simulators/spring-oscillation/index.html`
- Original source: `new-simulator-2026-06-07`
- Existing spring simulators were not modified.

## Initial Build 2026-06-07

Added as a new integrated spring simple-harmonic-motion simulator.

### Scope

- Switches between horizontal and vertical display.
- Switches between one spring and two springs.
- In two-spring mode, switches between parallel/left-right and series connection.
- Uses displacement `q` measured from the equilibrium position.
- In vertical mode, separately displays the static stretch `mg/k_eff`.

### Physics Model

- Motion model:
  `m q'' + c q' + k_eff q = 0`
- One spring:
  `k_eff = k1`
- Parallel/two-side springs:
  `k_eff = k1 + k2`
- Series springs:
  `1/k_eff = 1/k1 + 1/k2`
- Numerical update uses RK4 inside the shared fixed-step clock.

### Not Changed

- `spring-horizontal`, `spring-vertical`, and `double-spring` remain available as existing routes.
- No external CDN dependency was added.

### Checks

- Inline JavaScript syntax check passed.
- Metadata route check passed for `physics-simulator-work/public` and `simulator-new`: 25 main routes, 0 missing.
- Local HTTP response check passed for `/` and `/simulators/spring-oscillation/`.
- Browser check passed for the initial horizontal one-spring display.
- Browser interaction check passed for vertical, two-spring, series, frame-step, play, and pause.
- Browser responsive checks passed at 600px and 390px widths without horizontal overflow.
- Browser listing check confirmed the entry page shows 25 cards and the `ばね単振動` card.
- Browser console error check passed: 0 errors.

## Visual Adjustment 2026-06-07

- Corrected the horizontal drawing so spring force lines connect to the mass on the same centerline.
- Two-spring horizontal parallel/left-right mode now draws the left and right springs on the same action line instead of offsetting one upward and the other downward.
- Two-spring horizontal series mode also keeps both spring segments on the same action line.
