# Phase 9D.1 — Real Export Files & PDF Repair

## Goal
Fix the industrial export layer to ensure all technical files (BOM, Cutlist, JSON, TXT, PDF) are generated with real content and correctly served to the user.

## Proposed Changes

### Technical Fixes
- **PDF Exporter**: Added safety check to prevent empty PDF generation.
- **Plano Package Builder**: Added debug logs and improved error handling.
- **Industrial Export Generator**: Created `POST /api/proyectos/[id]/exportaciones/generar` to unify all industrial assets.
- **Export List API**: Created `GET /api/exports` to provide real-time status of files.
- **Download API**: Improved 404 handling to return JSON instead of HTML.

### UI Improvements
- **Export Page**: Added "Generar Paquete Completo" button.
- **Export Status**: Cards now show "Disponible" or "Pendiente" based on physical file existence.
- **Warnings**: Added visual warning if PDF is generated but suspiciously small (< 5KB).

## Verification Plan

### Automated Tests
- `npx ts-node --transpile-only scripts/export_files_audit.ts`: Audits physical files.
- `npx ts-node --transpile-only scripts/next_exports_real_tests.ts`: Full API/Integration test.

### Manual Verification
1. Ir a /proyectos/[id]/exportaciones.
2. Presionar "Generar Paquete Completo".
3. Verificar que los archivos pasen de "Pendiente" a "Disponible".
4. Descargar BOM.csv y planos-tecnicos.pdf y verificar contenido.
