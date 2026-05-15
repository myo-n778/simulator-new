# Ideal Gas Process Simulator Notes

## Source

- Route: `public/simulators/ideal-gas-process/index.html`
- Original top-level source: `IdealGasProcess1.00.html`
- Original source file was not modified.

## Review 2026-05-05

Checked eighth, after gas molecule simulator.

### Issues Fixed

- The simulator used `gamma = 1.4` for adiabatic paths, but internal energy used `gamma = 5/3` through `Cv = R/(5/3 - 1)`.
- Internal energy now uses `Cv = R/(gamma - 1)`, matching the adiabatic exponent used elsewhere in the simulator.
- Undo/Redo adjusted total heat using net heat `Qnet`. If one process segment contained both positive and negative heat portions, this could restore `Q_in` and `Q_out` incorrectly.
- Undo/Redo now use stored positive and negative heat components separately.
- `履歴クリア` cleared curves and steps but left accumulated thermodynamic totals. It now resets and refreshes totals as well.

### Not Changed

- Process selection and UI layout were not redesigned.
- Existing animation and graph drawing were kept.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Replaced the main frame loop with `PhysicsSimClock.FixedStepClock`.
- Kept process-curve animation local because it is a bounded operation animation.
- Thermodynamic calculations and UI controls were not otherwise changed.
