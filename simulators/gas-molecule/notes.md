# Gas Molecule Simulator Notes

## Source

- Route: `public/simulators/gas-molecule/index.html`
- Original top-level source: `GasMoleculeMotion1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked seventh, after wave.

### Issues Fixed

- The visible `初期化` button had no event handler.
- The visible `一時停止` button had no event handler.
- The `分子同士の弾性衝突` and `温度制御（等温）` checkboxes were only reflected indirectly when other parameters changed.
- Added direct handlers for reset, pause/resume, collision toggle, and thermostat toggle.

### Notes

- The page currently loads Three.js from a CDN. This is acceptable for a browser prototype, but app/offline packaging should later vendor or bundle Three.js.
- The pressure displayed from wall impulses is a short rolling estimate, while the ideal pressure uses `N kB T / V`.

### Not Changed

- Particle collision logic was not redesigned.
- Temperature and pressure formulas were not changed.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main Three.js animation loop with `PhysicsSimClock.FixedStepClock`.
- Three.js rendering, particle logic, and UI controls were not otherwise changed.
