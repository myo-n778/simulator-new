# Design QA

## Scope

- Screen: `simulators/dice-roll/index.html`
- Visual target: Product Design option 1, `Probability Lab`
- Date: 2026-06-09

## Checks

- Desktop layout uses left controls, central die stage, right cumulative bars, and bottom summary stats.
- The die remains prominent and readable as a cube.
- Pips remain projected along the visible die faces.
- Target preset `50` run completed at `50 / 50`.
- Odd/even counts summed to the total run count.
- Browser console errors: none observed.
- Mobile viewport `390 x 844` had no horizontal overflow.

## Notes

- The existing simulator shell header remains in place to preserve the site's navigation pattern.
- The implementation follows the selected visual direction without changing the dice simulation logic.

final result: passed
