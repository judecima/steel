# Localization Mode Selector Repair

## Root Cause
The visualization mode selector in `index.html` contained technical descriptions in parentheses (e.g., "Estándar (Constructivo)"), and the `stats-container` lacked a clear, localized header indicating the active mode.

## Exact Labels Changed
| Mode Value | Previous Label | New Label (Exactly) |
| :--- | :--- | :--- |
| `estandar` | Estándar (Constructivo) | **Estándar** |
| `estructural` | Estructural (Dinteles/Overlays) | **Estructural** |
| `taller` | Taller (Cut List/IDs) | **Taller** |
| `montaje` | Montaje (Secuencia) | **Montaje** |
| `inspeccion` | Inspección (Bounding Boxes) | **Inspección** |

## Actions Taken
1. **Localization Map**: Added `modos` category to `tools/qa-viewer/localizacion.js` and `src/modules/render/localizacion-dominio.ts`.
2. **HTML Cleanup**: Removed technical suffixes from the `<select>` options in `tools/qa-viewer/index.html`.
3. **Viewer UX**: Added a localized "Modo Activo" header to the statistics panel that updates dynamically when switching modes.
4. **Automated Test**: Added **TEST 86** to `scripts/layer_tests.ts` to ensure selector labels remain strictly localized in Spanish.

## Validation Results
- **npm run viewer:check**: PASSED
- **npm run localizacion:auditar**: PASSED (Spanish-first verified)
- **TEST 86**: PASSED (Mode selector labels verified)
- **Phase 5 Export Suite**: PASSED (20/20)

## Browser Verification Result
- Selector now shows clean, professional Spanish labels.
- Statistics panel includes a colored header with the mode name (e.g., "ESTRUCTURAL").
- All internal logic still uses the correct enum keys while displaying translated names.
