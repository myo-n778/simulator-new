# Wave Simulator Notes

## Source

- Route: `public/simulators/wave/index.html`
- Original top-level source: `wave_sim_marker.html`
- Original source file was not modified.

## Review 2026-05-05

Checked sixth, after spring simulators.

### Issues Fixed

- Plotly was loaded with `defer`, while the following inline script immediately used `Plotly`. Depending on execution order, initial drawing could run before Plotly was available.
- Repeatedly pressing play could start multiple animation loops. Playback now ignores play clicks while already playing and cancels the scheduled frame on pause.

### Notes

- The page currently loads Plotly from a CDN. This is acceptable for a browser prototype, but app/offline packaging should later localize or replace that dependency.

### Not Changed

- Wave formula and controls were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main animation loop with `PhysicsSimClock.FixedStepClock`.
- Plotly rendering and wave model were not otherwise changed.
