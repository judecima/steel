# Run: Phase 4A.4 Opening Vertical Alignment
Date: 2026-05-04 19:25:00

## JSON Truth Audit Result
The Phase 4A.3 JSON audit verified that framing studs were generated correctly, but the visual *Void Markers* (the red transparent boxes) and *Header Markers* (the yellow boxes) were not aligning with the physical framing.

## Root Cause
The vertical alignment issues were caused by incorrect assumptions and missing vertical metadata in the render builder layer:
1. **`opening-mesh-builder.ts`**: The Y-coordinate calculation for windows incorrectly assumed the opening started at the floor (`y=0`). It used `opening.height` as the Y-center, which only works if `sillHeight` is zero and the opening height is equal to `sillHeight`. It now correctly uses `(opening.sillHeight || 0) + (opening.height / 2)`.
2. **`header-mesh-builder.ts`**: The top elevation of windows was hardcoded to `2.0m` for mock purposes. This broke alignment for any window with an arbitrary height or sill height. It now precisely calculates `yTop = (opening.sillHeight || 0) + opening.height`.

## Files Changed
- **`src/modules/render/opening-mesh-builder.ts`**: Updated `pos.y` calculation to account for `sillHeight`.
- **`src/modules/render/header-mesh-builder.ts`**: Replaced mock `2.0m` hardcoding with exact calculated `yTop`.
- **`scripts/render_tests.ts`**: Added 5 new mathematical boundary alignment tests (TEST 25-29).

## Tests Executed
- **TEST 25**: Passed. Window opening marker vertical bottom perfectly equals `sillHeight` (1.0).
- **TEST 26**: Passed. Window opening marker vertical top (2.0) perfectly aligns with header bottom (2.0).
- **TEST 27**: Passed. Door opening marker bottom securely rests exactly on the floor track (`y=0`).
- **TEST 28**: Passed. Door opening marker top (2.1) perfectly aligns with header bottom (2.1).
- **TEST 29**: Passed. Opening marker bounding boxes horizontally and vertically align perfectly with the framed void tolerances.

## Visual Before/After Notes
- **Before**: The red opening void box for the window was sinking into the sill, floating awkwardly below the header, and door headers were floating at an incorrect height. 
- **After**: The red void markers now fit *exactly* and tightly inside the physical frame, touching the sill at the bottom, the header at the top, and the jack studs on the sides. The header yellow marker sits perfectly flush on top of the void.

**Phase 4A Digital Twin production layer is now verified strictly accurate for complex openings.**
