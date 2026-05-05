# Run: Phase 4A.5 Opening Modulation Integrity
Date: 2026-05-04 19:35:00

## Root Cause
The structural engine was correctly dropping common studs at precise modular spacing (0.4m intervals). However, when calculating opening reinforcements (`openings.ts`), the logic was deleting all common studs intersecting the opening but was replacing them with exactly **one** centered top cripple (and one bottom cripple). This broke the physical modular sheathing rhythm above and below the opening, which is an unacceptable constructive violation.

## Before / After Framing Logic
- **Before**: `openings.ts` pushed exactly one `CRIPPLE_TOP` stud at `relPos + op.width / 2` regardless of the opening's width.
- **After**: `openings.ts` filters the existing `COMMON` studs to capture all layout positions that physically intersect the opening void area. For every interrupted `COMMON` stud, it spawns a corresponding `CRIPPLE_TOP` (and `CRIPPLE_BOTTOM` for windows) exactly at that X-coordinate. If the opening is extremely narrow and intersects no modular marks, it safely falls back to a single centered cripple.

## Files Modified
- **`src/modules/construction/openings.ts`**: Implemented logic to map `CRIPPLE_TOP` and `CRIPPLE_BOTTOM` positions mathematically onto the interrupted `COMMON` stud positions.
- **`scripts/inspect_render_openings.js`**: Upgraded the script to map, sort, and calculate the mathematical delta between top cripple X-positions to verify rhythm continuity.
- **`scripts/render_tests.ts`**: Introduced TESTS 30-34. Note: Added a precision de-duplication filter in TEST 32/33 to ensure vertically stacked top/bottom cripples (which naturally share the same X) don't trigger false duplicate-stud failures.

## Tests Executed
- **TEST 30 & 31**: Passed. Verified that wide openings (>0.9m) organically generate multiple top cripples, preserving rhythm.
- **TEST 32 & 33**: Passed. Verified opening framing strictly preserves modular spacing tolerance with absolutely no duplicate studs.
- **TEST 34**: Passed. Ensured header span bounds mathematically match the jack studs mapping beneath it.

## Visual QA Notes
- Both the Window and Door now visually display multiple (2) top cripples in the 3D viewer.
- The 0.4m modular rhythm is perfectly continuous from the floor, through the bottom cripples, across the void, and through the top cripples to the roof.
- Sheathing lines would perfectly align.
- `render:inspect-openings` clearly verified a perfect `0.40` delta between cripple X-positions.
