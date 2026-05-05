# Run: Phase 4A.1 Visual Geometry Calibration
Date: 2026-05-04 18:57:00

## Visual Issues Addressed
The Phase 4A RenderSceneDTO export previously lacked coordinate coherence:
- Walls were disconnected or overlapping at origins.
- Panels and studs were not correctly mapped to their parent wall's orientation.
- Roof generated as a massive opaque block covering the framing.
- Labels stacked on top of each other, obscuring information.
- The QA viewer lacked tools for isolating problems in 3D.

## Files Changed
- `src/modules/render/transform-helper.ts` (NEW): Centralized transformation helper (`getWallTransform`, `applyTransform`) to map local panel/stud/opening coordinates into global house coordinates deterministically.
- `src/modules/render/wall-mesh-builder.ts`: Updated to apply proper translation and rotation via the transform helper.
- `src/modules/render/panel-mesh-builder.ts`: Updated to position panels dynamically within their rotated parent wall.
- `src/modules/render/stud-mesh-builder.ts`: Updated to align studs along the vector of their parent wall.
- `src/modules/render/opening-mesh-builder.ts`: Updated to respect wall rotation for correct void geometry projection.
- `src/modules/render/header-mesh-builder.ts`: Updated header positions and dimensions.
- `src/modules/render/roof-mesh-builder.ts`: Improved visual abstraction to display a realistic 0.2m thickness pitched roof rather than an opaque block.
- `src/modules/render/labels-builder.ts`: Offset labels along the wall normal vector to prevent Z-fighting and overlapping. Shortened text for improved readability.
- `tools/qa-viewer/index.html`: Added toggles for Roof Opacity, Layer Isolation, Scene Statistics, and Focus Button.
- `tools/qa-viewer/viewer.js`: Implemented the interaction logic, bounding box visualization, and camera focusing logic.
- `scripts/render_tests.ts`: Expanded to validate geometric alignment and immutability.

## Calibration Tests Added
- **TEST 11**: Wall footprint closes rectangle.
- **TEST 12**: Panels remain within wall bounds.
- **TEST 13**: Studs remain within panel bounds.
- **TEST 14**: Roof footprint aligns with house bounds.
- **TEST 15**: Label count and label uniqueness are deterministic.
- **TEST 16**: Transform helpers must not mutate source `ProjectResult` (Strict Deep Immutability check).

## Before/After Notes
**Before**: Engine output was perfectly valid, but the visualization layer produced a messy jumble of framing pieces clustered at the origin, heavily obscured by a massive 1.0m thick roof block. Debugging was essentially impossible.
**After**: The exact same Engine output now translates into a perfect 1:1 visually inspectable framing house in 3D. Users can click on studs, focus the camera, view precise bounding boxes, and verify panels visually before sending to shop drawings. No engine intelligence logic was altered during this calibration.
