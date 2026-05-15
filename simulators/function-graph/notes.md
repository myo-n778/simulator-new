# Function Graph Simulator Notes

## Source

- Route: `public/simulators/function-graph/index.html`
- Original top-level source: `function_graph1.10.html`
- Original source file was not modified.

## Review 2026-05-05

Checked fourteenth.

### Issues Fixed

- KaTeX was loaded with `defer`, while the main inline script can call `katex.render`.
- The KaTeX script now loads before the inline simulator script, matching the existing Plotly and math.js loading style.

### Notes

- The page currently loads Plotly, math.js, and KaTeX from CDNs. App/offline packaging should later vendor or bundle these dependencies.

### Not Changed

- Function parsing, derivative calculation, and graphing logic were not redesigned.
- Visual design was not redesigned.
- The original source HTML in the source folder was not changed.

### Checks

- Extracted inline JavaScript passed `node --check`.

## Standardization 2026-05-06

- Added the common simulator shell for the "一覧へ" header.
- Did not apply the shared clock because this simulator is event-driven rather than continuously animated.
- Function parsing, graph rendering, and UI controls were not otherwise changed.
