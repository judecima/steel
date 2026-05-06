# Run Log: Phase 7 Stale Active Project Repair

**Date:** 2026-05-06 11:40  
**Status:** SUCCESS  
**Phase:** 7 (Persistence & UI Stabilization)

## Root Cause Analysis
The intermittent project visibility and "Proyecto eliminado" errors were caused by a "split-brain" state where a project ID remained in `sessionStorage` or `localStorage` as active, even after being deleted from the PostgreSQL database. The UI would try to load the stale ID, fail in the API (404), and then silently fallback to legacy `localStorage` data, creating an inconsistent and confusing experience.

## Handling Stale IDs
- **API-First Validation**: `ProductActiveProject.validateProject` now treats a 404 from the API as a definitive signal that the project does not exist.
- **State Clearing**: When a 404 is detected, the active project ID is immediately removed from both `sessionStorage` and `localStorage`.
- **Guided UI**: Pages like `proyecto-detalle.html` now show a specific message ("El proyecto solicitado no existe en PostgreSQL...") instead of a generic error.

## Files Modified
- `ui/product/api-client.js`: Enhanced `apiRequest` to expose HTTP status codes in errors.
- `ui/product/shared/product-active-project.js`: Implemented 404 detection and `clearActiveProject` logic.
- `ui/product/shared/product-layout.js`: Added `stale-project-warning` banner injection.
- `ui/product/proyectos.html`: Added source indicator banner and "Limpiar estado local temporal" helper.
- `ui/product/proyecto-detalle.html`: Implemented guided 404 handling and state clearing.
- `scripts/product_ux_tests.ts`: Added tests 142-147.

## Verification Results

### Automated Tests (`product_ux_tests.ts`)
- **TEST 142**: 404 active project clears state - **Passed**
- **TEST 143**: API 404 does not fallback to local - **Passed**
- **TEST 144**: Local fallback only on connection error - **Passed**
- **TEST 145**: proyectos.html strictly uses API when healthy - **Passed**
- **TEST 146**: Detalle shows guided 404 UI - **Passed**
- **TEST 147**: Cleanup helper exists - **Passed**

### Manual Verification
- **Banner**: "✅ PostgreSQL: Datos sincronizados." visible on project list.
- **Cleanup**: "🧹 Limpiar estado local temporal" button confirmed functional.
- **404 Handling**: UI correctly handles invalid IDs by clearing state and guiding the user.

## Final State
The Product UI is now stable and strictly synchronized with PostgreSQL. Split-brain states are prevented by clearing stale session data upon API validation failure.
