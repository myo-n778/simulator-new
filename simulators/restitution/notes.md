# Restitution Simulator Notes

## Source

- Route: `public/simulators/restitution/index.html`
- Original source: new simulator created on 2026-05-30.
- Existing simulator files were not modified.

## Scope

- Mode 1: vertical free fall toward a floor, with bounce speed controlled by coefficient of restitution `e`.
- Mode 2: oblique collision with a floor, preserving the horizontal component and reversing only the vertical component by `e`.
- Mode 3: stair-like step descent, where a ball bounces from horizontal treads and vertical risers.
- Mode 4: one-dimensional head-on collision of two balls, showing pre-collision and post-collision speeds.

## Physics Model

- Floor collision:
  - Free fall uses `y(t) = y0 + vy t - 1/2 g t^2`.
  - Ground event time is solved analytically inside each step.
  - Vertical collision applies `vy' = -e vy`.
  - Oblique collision keeps `vx` unchanged and applies `vy' = -e vy`.
  - If the post-collision normal component is nearly zero, the ball is constrained to the floor and continues horizontally without sinking through the floor.
- Two-ball collision:
  - Uses momentum conservation and restitution:
    - `m1 u1 + m2 u2 = m1 v1 + m2 v2`
    - `e = (v2 - v1) / (u1 - u2)`
  - The implemented post-collision velocities are:
    - `v1 = ((m1 - e m2)u1 + (1 + e)m2 u2) / (m1 + m2)`
    - `v2 = ((m2 - e m1)u2 + (1 + e)m1 u1) / (m1 + m2)`
- Stair collision:
  - The step width `w`, step height `d`, and number of steps are adjustable.
  - Horizontal treads reflect only the vertical velocity component: `vy' = -e vy`.
  - Vertical risers reflect only the horizontal velocity component: `vx' = -e vx`.
  - If the post-collision normal component is nearly zero on a horizontal tread, the ball remains on that tread until it reaches the edge.

## Not Included

- Air resistance.
- Floor friction.
- Rotation of balls.
- General two-dimensional ball-ball collision.
- Rotation and rolling on stair surfaces.

## Checks

- Pending: HTML/JavaScript syntax check.
- Pending: local browser visual and interaction check.
