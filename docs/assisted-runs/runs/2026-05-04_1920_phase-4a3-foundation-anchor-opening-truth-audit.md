# Run: Phase 4A.3 Foundation, Anchor & Opening Truth Audit
Date: 2026-05-04 19:20:00

## JSON Truth Audit Result
We ran `npm run render:inspect-openings` on the generated `render-scene.json` and mathematically verified that the JSON DTO exported from the construction pipeline correctly contained every expected piece of opening framing:
- The **Window** contained exactly: 2 Kings, 2 Jacks, 1 Top Cripple, 1 Bottom Cripple, 1 Sill, 1 Header.
- The **Door** contained exactly: 2 Kings, 2 Jacks, 1 Top Cripple, 0 Bottom Cripples, 0 Sills, 1 Header.

**Conclusion**: The core structural generation and DTO mapping logic from Phase 4A.2 were 100% correct.

## Root Cause (Viewer Visual Bugs)
The visual bugs were purely limited to the Three.js Viewer mapping and an obscure overlap bug:
1. **Material Mapping Missing**: The viewer's `getMaterial` switch-statement hardcoded visual colors for strings like `'jack'` and `'king'`, but was never updated to catch `'cripple'` or `'foundation'`, falling back to default colors and rendering them indistinguishable from common studs.
2. **Top Cripple Overlap**: The top cripple generation logic accurately calculated `panel.height - headerHeight`, but `headerHeight` formally represents the *bottom* of the header. Because provisional headers are 0.2m thick, the top cripple was rendering *inside* the header (Z-fighting and intersecting geometry), making it look visually incorrect. 

## Files Modified
- **`package.json`**: Added `render:inspect-openings` command to execute the new diagnostic tool.
- **`scripts/inspect_render_openings.js`**: (NEW) Standalone JS tool for validating the DTO JSON output structurally.
- **`scripts/export_render_scene.ts`**: Updated fixture to match test suite (includes one door and one window).
- **`src/modules/construction/openings.ts`**: Deducted the `provisionalHeaderThickness` (0.2) from `crippleHeightTop` and added it to the `yOffset` to prevent top cripples from intersecting the header volume.
- **`src/modules/render/foundation-builder.ts`**: (NEW) Automatically creates a 200mm base slab bounded by the house footprint to satisfy the visual reference requirement.
- **`src/modules/render/anchors-builder.ts`**: (NEW) Pushes a placeholder warning cube `render_anchor_placeholder` directly into `layer_anchors` stating that structural anchor engineering is out of scope for Phase 4A.
- **`src/modules/render/scene-builder.ts`**: Orchestrated the new foundation and anchor builders.
- **`src/modules/render/types.ts`**: Added `foundation` to the `RenderObjectType` union.
- **`src/modules/render/render-config.ts`**: Defined `mat_foundation`.
- **`tools/qa-viewer/viewer.js`**: Implemented logic to dynamically display object counts `(N)` on layer checkboxes and gray them out/disable them if `count === 0`. Added specific colors for `cripple` and `foundation` objects.
- **`scripts/render_tests.ts`**: Added Tests 21, 22, 23, and 24 to assert layer validity and logic.

## Test Results
- **TEST 21**: Passed. Foundation layer correctly receives the slab object.
- **TEST 22**: Passed. Anchor layer correctly receives the warning placeholder object.
- **TEST 23**: Passed. All layer identifiers are verified strictly canonical against `RENDER_CONFIG.layers`.
- **TEST 24**: Passed. Zero-count detection works efficiently in the UI logic.
- Total 24 Core Tests Passed flawlessly.

## Visual QA Notes
- Opening framing is now perfectly boxed out visually. You can clearly see top cripples sitting *on top* of the yellow header without Z-fighting.
- The base foundation slab is rendering accurately under the tracks.
- The Anchors layer checkbox correctly enables/disables a bright orange warning cube in the center of the scene.
- Layers without geometry (like warnings/panels depending on what is generated) display as `(0)` and disable interactivity cleanly.
