# Design QA

## Scope

- Screen: `simulators/dice-roll/index.html`
- Visual target: Product Design option 1, `Probability Lab`
- Date: 2026-06-09

## Checks

- Desktop layout uses left controls, central die stage, right cumulative bars, and bottom summary stats.
- The die is prominent and closer to the selected reference: large rounded white cube, red `1` on the top face, black pips on front/side faces, and stronger depth.
- Rolled results are displayed on the top face of the die, while front/side faces remain supporting visible faces.
- Pips remain projected along the visible die faces and read as recessed holes rather than pasted circles.
- The canvas die uses a unified white body layer and softer seams so the visible faces read more as one rounded cube.
- Auto display fit keeps the primary simulator surface inside a `1365 x 768` viewport, with manual zoom controls available.
- Target preset `50` run completed at `50 / 50`.
- Odd/even counts summed to the total run count.
- Browser console errors: none observed.
- Mobile viewport `390 x 844` had no horizontal overflow.
- Mobile viewport `390 x 844` also stayed within the viewport in auto display mode.

## Notes

- The existing simulator shell header remains in place to preserve the site's navigation pattern.
- The implementation follows the selected visual direction without changing the dice simulation logic.

final result: passed
