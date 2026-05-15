# Ladder Simulator Notes

## Source

- Route: `public/simulators/ladder/index.html`
- Original top-level source: `ladder_sim_1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked fifteenth.

### Findings

- No immediate syntax issue was found in this pass.
- Main controls for reset, play/stop, full view, and person dragging are bound in the script.

### Not Changed

- Force-balance model and friction settings were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main update loop with `PhysicsSimClock.FixedStepClock`.
- Force-balance logic, jump display, and UI controls were not otherwise changed.
