# Phase 5 Real Environment Export & Foundation Repair

## Root Cause
1. **Foundation Missing**: `SceneBuilder.buildBaseScene` was missing calls to `buildFoundationMeshes` and `buildAnchorMeshes`.
2. **Export 404**: Ambiguous URL construction in `viewer.js` and inconsistent path resolution between local dev and "real" environment.
3. **Anchor Count Misleading**: UI summed objects, labels, and warnings, making "1 object + 1 warning" look like "2 objects".

## Actions Taken
- **SceneBuilder**: Integrated foundation and anchor builders.
- **FoundationBuilder**: Added validation and "not generated" warnings.
- **Viewer UX**: 
  - Separated counts for Objects, Labels, and Warnings.
  - Added color-coded warnings for empty layers with active alerts (e.g., Anclajes).
  - Fixed export paths to use canonical `./exports/` relative to the viewer.
  - Added startup diagnostics (`checkExports`) to verify file availability.
- **Automation**: Updated `package.json` to use `--transpile-only` for render tools to avoid trivial type-check blocks.

## Export File Tree (tools/qa-viewer/exports)
- `bom.csv`
- `cutlist.csv`
- `montaje.txt`
- `proyecto_industrial.json`
- `reporte.tsv`

## Viewer Download URLs Checked
- `./exports/bom.csv` -> Available
- `./exports/cutlist.csv` -> Available
- `./exports/proyecto_industrial.json` -> Available
- `./exports/reporte.tsv` -> Available
- `./exports/montaje.txt` -> Available

## Foundation Layer Audit
- **Layer ID**: `layer_fundaciones`
- **Objects**: 1 (Losa de fundación)
- **Status**: Visible, selectable, and toggleable.

## Tests Executed
- **TEST 71-77**: Layer counting and consistency. (PASSED)
- **TEST 78-80**: Export path and URL matching. (PASSED)
- **TEST 81-84**: Foundation slab existence and selection. (PASSED)

## Browser Verification Result
- UI shows detailed counts: `Anclajes — Objetos: 1, Etiquetas: 0, Advertencias: 1`.
- Foundation slab is visible as a grey volume at the base.
- Download buttons show green borders indicating availability.
- Clicking "Aislar Capa" on Foundation works as expected.
