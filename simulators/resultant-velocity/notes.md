# 合成速度 Notes

## Purpose

- 川を進む船を題材に、船の速度と川の流れの合成速度を可視化する。
- 1次元では、川上へ進む場合と川下へ進む場合で、地面から見た速度がどう変わるかを確認する。
- 2次元では、船の進行角度を変えたときの渡河時間、下流または上流へのずれ、合成速度の成分を確認する。
- 川の流れがない場合の比較船を同時に表示し、流れだけでどれだけ経路が変わるかを確認する。

## Implementation

- Route: `public/simulators/resultant-velocity/index.html`
- Dependencies: none
- Uses the common simulator shell and `PhysicsSimClock.FixedStepClock`.
- Canvas rendering draws the river, real boat, ghost boat for no-current comparison, fixed velocity arrows, start/goal markers, and path traces.
- 1次元:
  - Downstream velocity: `v_down = v_b + v_c`
  - Upstream velocity magnitude when reachable: `v_up = v_b - v_c`
  - If `v_b <= v_c`, upstream travel is shown as unreachable.
  - A ghost boat shows the same boat motion when current speed is `0`.
- 2次元:
  - Angle `θ` is measured from the downstream current direction.
  - Crossing direction can be switched between lower bank to opposite bank and opposite bank to lower bank.
  - Boat velocity relative to water: `(v_b cosθ, v_b sinθ)`
  - Ground velocity: `(v_b cosθ + v_c, v_b sinθ)`
  - Crossing time: `t = W / (v_b sinθ)` when the cross-river component is positive.
  - Drift: `d = (v_b cosθ + v_c)t`; positive means downstream, negative means upstream.
  - The no-current ghost path uses the same heading and boat speed with current component removed.

## Checks

- Mode switch changes between 1次元 and 2次元 without losing control visibility.
- 1次元 mode switches between 川上へ and 川下へ.
- 1次元 readouts show upstream speed, downstream speed, selected travel time, ground velocity, and distance.
- Upstream travel reports unreachable when the current speed is greater than or equal to the boat speed.
- 2次元 controls include boat speed, current speed, river width, angle, and playback speed.
- 2次元 controls include a crossing-direction switch for starting from the lower bank or from the opposite bank.
- 2次元 readouts show crossing time, drift distance, current-only difference, resultant speed, downstream component, and cross-river component.
- Angle `90°` sends the boat straight across relative to the water, while the ground path drifts downstream by the current.
- Angles greater than `90°` point the boat upstream and can reduce or reverse the drift.
- Velocity arrows are fixed in the scene and do not move with the animated boats.
- The no-current ghost boat and ghost trail can be toggled with `流れなし比較`.
- Playback, pause, frame-step, reset, vector display, and trail display work in both modes.
- Mobile and desktop layouts keep the scene and controls visible without horizontal overflow.
