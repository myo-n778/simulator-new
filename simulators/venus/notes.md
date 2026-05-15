# Venus Simulator Notes

## Source

- Route: `public/simulators/venus/index.html`
- Original top-level source: `Venus1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked eleventh, as part of the astronomy group.

### Findings

- No immediate syntax or button-binding issue was found in this pass.
- Playback schedules animation only while playing, and pause stops the loop naturally.
- Reset returns the simulation day to `0` and redraws both views.

### Not Changed

- Venus geometry and phase drawing were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main play loop with `PhysicsSimClock.FixedStepClock`.
- Rendering model and UI controls were not otherwise changed.
