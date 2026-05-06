# Scene Statistics Localization Repair

## Root Cause
The scene statistics panel was using technical abbreviations (`Obj:`, `Etq:`, `Adv:`) which are not suitable for a production-grade Spanish UI.

## Exact Labels Changed
| Abbreviation | New Localized Label |
| :--- | :--- |
| `Obj:` | **Objetos:** |
| `Etq:` | **Etiquetas:** |
| `Adv:` | **Advertencias:** |

## Actions Taken
1. **Localization Map**: Added `objetos`, `etiquetas`, and `advertencias` to the `ui` category in both `localizacion.js` and `localizacion-dominio.ts`.
2. **Helper Function**: Implemented `formatearEstadisticasCapa(s, plainText)` in `viewer.js` to centralize the formatting logic and ensure consistent localization.
3. **UI Update**: 
   - Replaced inline abbreviation logic with the new helper.
   - Removed counts with zero values to keep the UI clean.
   - Standardized the hover tooltips (titles) to use the same localized format.
4. **Console Cleanup**: Renamed internal `console.log` keys to avoid accidental matches during localization audits.
5. **Automated Tests**: Added **TEST 87-90** to verify the absence of abbreviations and English terms in the statistics panel.

## Validation Results
- **npm run viewer:check**: PASSED
- **npm run localizacion:auditar**: PASSED
- **TEST 87**: PASSED (No abbreviations found)
- **TEST 88**: PASSED (Full Spanish labels found)
- **TEST 89**: PASSED (Verified separate counting for Anclajes)
- **TEST 90**: PASSED (No English terms found)

## Examples
**Before:**
`Anclajes: Obj: 1, Adv: 1`

**After:**
`Anclajes: Objetos: 1, Advertencias: 1` (with proper color coding for warnings)
