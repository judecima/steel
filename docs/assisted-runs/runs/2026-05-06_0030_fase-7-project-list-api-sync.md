# Run Log: Phase 7 Project List API Sync

**Date:** 2026-05-05 21:30  
**Status:** SUCCESS  
**Phase:** 7 (Persistence Integration)

## Root Cause
The project listing in `proyectos.html` was not correctly prioritizing the API or handling various response shapes from the backend. Additionally, the data-source indicators were hardcoded to "Modo local", providing misleading information to the user even when the API was active.

## Changes Implemented

### UI Components
- **`ui/product/proyectos.html`**:
    - Added `normalizarListaProyectos` to support arrays, `{data: []}`, `{proyectos: []}`, and `{items: []}`.
    - Updated `cargarProyectos` to prioritize API results and only fallback to `localStorage` in case of connection failure.
    - Added a dynamic `data-source-indicator` that shows "PostgreSQL: Datos sincronizados" when active.
    - Added console diagnostics for API health, data source, and loaded projects.
    - Updated `crearProyecto` to use the ID returned by the API and refresh the list before redirecting.

### Testing
- **`scripts/product_ux_tests.ts`**:
    - Added tests for `api-client` base URL verification.
    - Added tests for `getProyectos` call presence.
    - Added tests for normalization logic and data-source banner presence.
    - Added a regex-based test to ensure `localStorage` fallback only exists inside `catch` blocks.

## Verification Results

### Automated Tests
- `npx ts-node scripts/product_ux_tests.ts`: **Passed** (14/14 tests).

### Manual Verification
1.  **API Connection**: `http://localhost:3001/api/health` confirmed as `connected`.
2.  **Project Creation**: Created "Lote 99" and "Lote 100" via the UI.
3.  **Persistence**: Confirmed projects appear in the list after refresh.
4.  **Backend Check**: `curl http://localhost:3001/api/proyectos` confirmed projects are stored in PostgreSQL.

## Final Result
The Product UI now correctly synchronizes with the PostgreSQL backend. Projects created by the user are immediately visible in the list and persist across sessions via the API.
