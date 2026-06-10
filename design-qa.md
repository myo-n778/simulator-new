**Source Visual Truth**
- `/var/folders/h1/t4sbffcs779593dgryyn0kx00000gn/T/codex-clipboard-0e9c8ca7-ea2a-47c6-8fb1-57ad424d8f8f.png`

**Implementation Screenshot**
- `/tmp/spring-remake-v16.png`

**Viewport**
- 1486 x 1057

**State**
- `spring-oscillation/Remake-spring-oscillation.html`
- Light theme
- Horizontal, one spring
- Initial state

**Full-View Comparison Evidence**
- The implementation now follows the same major structure: top header, mode controls, large experiment canvas, live metrics, time graphs, and parameter panel.
- The reference remains more polished in density and proportional balance: its canvas, metrics, graph column, parameter panel, summary, and formula panels all fit into one well-balanced viewport.

**Focused Region Comparison Evidence**
- Canvas region: implementation has a cleaner lab surface and improved mass/spring drawing, but the reference spring and fixture still look more realistic and more mechanically rendered.
- Right-side panels: implementation now matches the live metrics and graph column direction, but graph density and typography are still lighter than the reference.
- Bottom panel: implementation exposes the parameter panel, but the reference has a stronger three-panel split: parameters, result summary, and formula memo.

**Findings**
- [P2] Bottom information architecture is not yet at reference quality
  Location: parameter/result/formula lower area.
  Evidence: reference has three clearly balanced bottom panels; implementation still concentrates most content into the parameter panel and leaves the summary/formula treatment weaker.
  Impact: the page feels improved but still less like a finished product dashboard.
  Fix: split the lower area into dedicated parameter, result summary, and formula memo panels with fixed proportional tracks.

- [P2] Canvas asset realism still trails the target
  Location: main simulation canvas.
  Evidence: reference spring, wall, contact points, and floor texture have stronger material depth. Implementation is cleaner than before but still more schematic.
  Impact: the simulator still feels slightly less premium than the target.
  Fix: refine canvas drawing for spring coils, wall fixture, connector joints, force arrows, and floor hatch texture.

- [P2] First viewport still does not fully match the reference composition
  Location: full page layout.
  Evidence: reference shows the entire working dashboard, including footer, in the viewport. Implementation shows the top and parameter start at 1486 x 1057.
  Impact: the page no longer looks broken, but the screenshot target is denser and more complete.
  Fix: reduce vertical chrome, make canvas/graph heights tokenized, and compress the lower panel.

**Patches Made Since Previous QA**
- Reworked the spring remake layout into a one-screen lab dashboard structure.
- Moved live metrics and graphs visually to the right of the main canvas.
- Made the parameter panel a full-width lower section.
- Tightened graph and live metric density.
- Preserved the existing physical model and controls.

**Implementation Checklist**
- Split lower dashboard into parameters, result summary, formula memo.
- Refine canvas rendering realism.
- Re-run desktop and mobile visual checks.
- Apply the finalized tokens to the remaining remake pages only after the representative page passes.

**Follow-up Polish**
- Add clearer icon treatment to playback controls.
- Tune typography weights in numeric readouts.
- Improve graph axis labeling and line contrast.

**final result: blocked**
