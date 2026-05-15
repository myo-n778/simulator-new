# 三原色 Notes

## Purpose

- 赤・緑・青の光を重ねる加法混色を、ベン図風の重なりとRGBスライダーで確認する。
- シアン・マゼンタ・イエローの色材を重ねる減法混色を、同じ操作体系で確認する。
- 指示に従ってRGB値を変えるミッションで、色が連続的に変化することを実感できるようにする。

## Implementation

- Route: `public/simulators/light-rgb/index.html`
- Dependencies: none
- Uses the common simulator shell.
- Canvas rendering uses `globalCompositeOperation = 'lighter'` to show additive light overlap.
- Color-material mode uses a simplified CMY subtractive model:
  - `RGB = (255 - C, 255 - M, 255 - Y)`
- Controls are event-driven; no shared fixed-step clock is required.

## Checks

- RGB/CMY sliders update the canvas, swatches, readouts, and mission score.
- The `光の三原色` / `色の三原色` switch preserves the existing `ベン図` / `ミッション` modes.
- Preset buttons set white, black, and random RGB values.
- Palette buttons set representative colors for the selected primary-color system.
- Mission mode shows a target color and evaluates distance from the current RGB value.
