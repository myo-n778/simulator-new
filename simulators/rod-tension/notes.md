# 壁と棒と糸

## 2026-05-06

- Added as a new simulator route: `public/simulators/rod-tension/`.
- The rod is treated as massless.
- A movable weight can be dragged or tapped along the rod.
- The string angle relative to the rod is adjustable.
- Support modes:
  - hinge-fixed wall end
  - rough wall contact with adjustable static friction coefficient
- Displays:
  - tension magnitude
  - tension x and y components
  - weight
  - hinge horizontal/vertical reactions and resultant in hinge mode
  - wall friction/required friction coefficient in rough wall mode

## 2026-05-06 Update

- Added hinge force vector drawing for `Rx`, `Ry`, and resultant `R`.
- Added the hinge resultant to the numerical readouts and formula summary.
- Narrowed the condition/readout panel so it stays beside the figure at a practical width on desktop.
- Adjusted scene geometry and force label placement so the weight and right-side force labels remain visible on narrow screens.
- Corrected force-vector origins:
  - tension and its components now start at contact point `B`
  - hinge reaction or wall contact forces now start at contact point `A`
  - weight now starts from the weight position on the rod so support-force arrows remain readable
- Kept string attachment point `C` on the wall line instead of moving it horizontally when fitting the figure.
- Extended the wall drawing to the support line so points `A` and `C` visibly contact the wall.
- Changed force-vector scaling to a fixed pixels-per-newton scale with a display cap. This keeps the gravity arrow from changing when mass is unchanged and only angle or position changes.
- Increased the fixed force-vector scale after moving the gravity arrow origin to the rod.

## Model

- Torque equilibrium about the wall end:
  - `Ty L = mg x`
  - `T = Ty / sin(theta)`
- Tension components:
  - `Tx = T cos(theta)`
  - `Ty = T sin(theta)`
- Rough wall mode:
  - `N = Tx`
  - `f = mg - Ty`
  - static condition: `|f| <= mu N`

## Verification Notes

- This simulator is event-driven and does not need `PhysicsSimClock.FixedStepClock`.
- The existing common simulator shell is used.
