# Planet Retrograde Simulator Notes

## Source

- Route: `public/simulators/planet-retrograde/index.html`
- Original top-level source: `planetmove1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked tenth, as part of the astronomy group.

### Findings

- No immediate syntax or button-binding issue was found in this pass.
- Playback uses a continuously scheduled animation loop and only advances dates while `playing` is true.
- Date conversion is normalized to noon UTC for stable day counting.

### Not Changed

- Planet periods and circular-orbit approximation were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Kept resize follow-up rendering local because it is a layout timing guard.
- Orbit model and UI controls were not otherwise changed.
