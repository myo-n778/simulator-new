# 斜面上の物体 notes

## Scope

- New simulator created on 2026-05-06.
- Models a rectangular block on an inclined plane.
- Width `L` is measured along the plane.
- Height `h` is measured perpendicular to the plane.

## Physics

- Gravity: `mg`
- Normal force: `N = mg cosθ`
- Required static friction: `f = mg sinθ`
- Normal reaction point from the downhill lower edge:
  - `P = L/2 - h tanθ/2`
- Sliding threshold:
  - `tanθ > μs`
- Tipping threshold:
  - `tanθ > L/h`
- When sliding and tipping are both possible, the simulator uses the lower critical angle as the event that occurs first.

## Display

- The diagram is on the left.
- The status and numerical readouts are on the right at desktop widths.
- Force arrows are available for gravity, normal force, friction, and gravity components.
- The normal force arrow starts at the computed point `P`.
- 3D-style view can be toggled; it projects the same inclined plane and rectangular prism from a draggable camera angle without changing the physics model.

## Animation

- Sliding uses kinetic-friction acceleration:
  - `a = g(sinθ - μk cosθ)`
- Tipping uses rigid-body rotation about the downhill lower edge.
- The block rotates in the downhill tipping direction by increasing the block angle from the initial slope-relative orientation.
- Tipping continues until the side of the block reaches the plane-contact angle instead of stopping with a visible gap above the slope.
- Reset returns slide displacement, slide velocity, rotation angle, angular velocity, and restart delay to the initial state.
- Continuous animation mode keeps the animation clock active, restarts motion after a short delay when sliding or tipping reaches its end, and restarts automatically after parameter changes.
- Force labels are offset from arrow tips and drawn on a light background to reduce overlap.
- The initial block placement is shifted upward and the drawing scale is reduced from the first draft.
- The slope is drawn as a thin board below the mathematical plane surface so the block bottom sits on the plane rather than being visually embedded.
- Width label `L` is drawn on the top side of the block.
- Force-label placement is calculated after all force arrows are known, so labels avoid other labels and arrow segments.
- The block is centered by deriving the slope origin from the desired initial block center.
- The slope is extended beyond the block on both sides.
- Force names and values are now displayed in a top-right legend instead of directly beside arrow tips.
- The downhill side of the slope is extended farther so the incline continues below the block.
- The initial position control `s` was removed because it was not needed for this simulator's main concept.
- In 3D-style mode, pointer drag changes the projected camera angle around the fixed slope and rectangular prism.
- Full WebGL/Three.js camera/orbit viewing remains a later extension.
