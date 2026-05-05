# Run: Phase 4A.2 Opening Framing Audit
Date: 2026-05-04 19:06:00

## Root Cause
The window and door framing visual inconsistencies were caused by a structural DTO mismatch and a mapping logic error in the Render engine:
1. The `Stud` interface lacked a `yOffset` property, forcing all studs (including top cripples) to be rendered starting at `y=0`.
2. The constructive planner (`src/modules/construction/openings.ts`) did not generate any horizontal track representation for Window Sills or any vertical studs for Bottom Cripples.
3. The `RenderSceneDTO` materials map lacked distinct visual representation for cripples and sills.

## Files Modified
- **`src/core/types.ts`**: Added `yOffset?: number` to `Stud` interface. Added `SILL = 'sill'` to `StudRole` enum.
- **`src/modules/construction/openings.ts`**: Added generation logic for bottom cripples and horizontal sills for windows with `sillHeight > 0.1`. Added correct `yOffset` mappings to top and bottom cripples.
- **`src/modules/render/types.ts`**: Added `sill` to `RenderObjectType`.
- **`src/modules/render/render-config.ts`**: Introduced `stud_cripple` material to differentiate cripples visually from common/king/jack studs.
- **`src/modules/render/stud-mesh-builder.ts`**: Updated coordinate mapping to respect `yOffset`. Added conditional rendering for `StudRole.SILL` to render horizontally exactly like a top/bottom track.
- **`tools/qa-viewer/viewer.js`**: Implemented a dynamic 3D Sprite Label that hovers over the selected object, prominently displaying the structural role (e.g. `KING`, `JACK`, `CRIPPLE_TOP`) in the 3D viewport.
- **`scripts/render_tests.ts`**: Updated the base test fixture to include one window and one door. Added Tests 17 through 20.

## Tests Added
- **TEST 17**: Window framing completeness (Validates presence of king, jack, top cripples, bottom cripples, sill, and header).
- **TEST 18**: Door framing completeness (Validates presence of king, jack, and header).
- **TEST 19**: Door has no sill (Validates absence of sill and bottom cripples on doors).
- **TEST 20**: Opening framing roles preserved into RenderSceneDTO.

## Before/After Visual Notes
**Before**: Top cripples rendered at the bottom track instead of above the header. Windows had no lower boundary. All studs looked the same. Clicking a stud required looking at the HTML side panel to see its role.
**After**: Windows are perfectly boxed in with horizontal sills and properly elevated top and bottom cripples. Cripples are shaded distinctly. Selecting any stud pops up a bright yellow 3D label instantly identifying its role in the framing assembly. Doors render cleanly without unwanted sills.
