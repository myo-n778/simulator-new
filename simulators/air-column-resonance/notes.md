# 気柱の共鳴 Notes

## Purpose

- 気柱の共鳴を、筒内の空気分子を表す球体の縦波運動として可視化する。
- 分子の軸方向変位によって球体の間隔が変わり、疎と密が生じることを確認できるようにする。
- 片端閉管と両端開管で、変位の節・腹と圧力/密度の節・腹の対応が変わることを示す。

## Implementation

- Route: `public/simulators/air-column-resonance/index.html`
- Dependencies: none
- Uses the common simulator shell and `PhysicsSimClock.FixedStepClock`.
- Canvas rendering draws the tube, molecule spheres, density bands, node/antinode markers, displacement arrows, and a lower transverse displacement graph aligned to the tube axis.
- The density-change graph is intentionally not drawn; density is shown through particle spacing, particle color, labels, and density bands.
- 片端閉管:
  - Displacement shape: `u(x) = sin(kx)`
  - `kL = (2m - 1)π/2`
  - `λ = 4L / (2m - 1)`
- 両端開管:
  - Displacement shape: `u(x) = cos(kx)`
  - `kL = nπ`
  - `λ = 2L / n`
- Density variation is shown as proportional to `-∂u/∂x`.

## Checks

- Tube type switches between 片端閉管 and 両端開管.
- Resonance mode changes node/antinode positions and frequency/wavelength readouts.
- Molecule spheres move only along the tube axis and form visible sparse/dense regions.
- Dense/sparse bands can be toggled without stopping the particle animation.
- Node/antinode markers and the lower transverse displacement graph can be toggled.
- Higher modes such as 5倍振動 show multiple dense/sparse labels at all pressure/density extrema.
- Open and closed ends are labeled on the tube drawing.
- Playback, pause, frame-step, reset, molecule count, amplitude, density emphasis, sound speed, and length controls update the canvas and readouts.
- Playback, frame-step, and reset controls are placed next to the diagram.
