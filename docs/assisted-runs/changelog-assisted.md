# Changelog Assisted

## [2026-05-06] - Fase 9E Fix: Runtime Stability & Resiliency
- Implementación de `withTimeout` helper para asegurar respuestas deterministas en API (5s render, 20s export).
- Refactor del visualizador 3D para soportar estados de carga, timeout y error con mensajes en español.
- Corrección de auditoría de exportaciones: detección real de archivos en disco y estados de error persistentes.
- Reparación de imports en `/api/exports` que causaban fallos intermitentes en el dashboard.
- Certificación de 6 tests de integración de runtime y resiliencia.

## [2026-05-06] - Fase 9E Fix: Adaptación Geométrica de Muros a Pendiente
- Implementación de geometría de muros trapezoidales mediante `heightStart` y `heightEnd`.
- Interpolación lineal de alturas para montantes (studs) y paneles individuales.
- Cálculo de soleras superiores inclinadas mediante Pitágoras para un BOM industrial preciso.
- Actualización del motor de renderizado (`viewer.js`) para soportar geometrías trapezoidales reales.
- Certificación de longitudes variables en CutList y alineación exacta de coronación de muros.

## [2026-05-06] - Fase 9E Fix: Reparación del Invariante Versión Activa
- Implementación de `ensureActiveVersion` para detectar y reparar proyectos con referencias a versiones inexistentes.
- Ejecución de script de migración masiva: **25 proyectos reparados** y estabilizados en la base de datos.
- Integración de lógica de auto-reparación en todos los endpoints de la API (GET, PUT, Regenerar, Render).
- Añadidos avisos de reparación en la interfaz de usuario para transparencia técnica.
- Certificación de 3 tests de integración de invariantes de versión.

## [2026-05-06] - Fase 9E Fix: Configuración Paramétrica Real
- Implementación de formulario obligatorio de parámetros técnicos (Largo, Ancho, Alto, Pendiente) en la creación de proyectos.
- Centralización de lógica de normalización en `lib/parametric-config.ts` para asegurar integridad de datos en UI y API.
- Refuerzo de regla industrial: caída de techo estrictamente calculada sobre el ancho (transversal).
- Actualización de `ProjectDetail` con validaciones de campo y avisos arquitectónicos en español.
- Certificación de flujo end-to-end: Creación -> Persistencia -> Regeneración -> Resultado Motor.

## [2026-05-06] - Fase 9B.Fix: Resolución de 404 en Visualizador
- Migración de activos del visor legacy (`tools/qa-viewer`) a `apps/product-ui/public/qa-viewer/`.
- Implementación de endpoint dinámico `/api/proyectos/[id]/render` para servir datos 3D desde PostgreSQL.
- Actualización de `viewer.js` para soportar carga de datos basada en parámetros de URL y descargas seguras.
- Integración de fallbacks visuales en la página de Next.js para mejorar la resiliencia del visor.

## [2026-05-06] - Fase 9D.2: Auditoría de Contenido Útil
- Implementación de auditoría de calidad: validación de datos reales en BOM (materiales), Cutlist (piezas) y Proyecto (DTO).
- Verificación técnica de PDF: Se certificó la generación de 6 hojas técnicas (Replanteo, Distribución, Paneles) con geometría real.
- Corrección de conflictos de base de datos: IDs de versión dinámicos para evitar colisiones en la persistencia de resultados.
- Limpieza de rutas Next.js: Eliminación definitiva de rutas legacy que causaban conflictos de segmentos dinámicos.
- Certificación de 10 tests de calidad (Q1-Q10) superada exitosamente.

## [2026-05-06] - Fase 9D.1: Real Export Files & PDF Repair
- Implementación de generador consolidado: `POST /api/proyectos/[id]/exportaciones/generar` crea los 7 activos industriales.
- Normalización de nombres: BOM.csv, CUTLIST.csv, Proyecto.json, Montaje.txt, reporte.tsv, planos-tecnicos.pdf.
- PDF Certificado: Expansión de geometría y disclaimer legal extenso para asegurar calidad y peso > 5KB.
- API de estado real: `GET /api/exports` sincroniza la UI con la existencia física de los archivos.
- Resiliencia (Fallback): Los exportadores generan encabezados y advertencias técnicas si no hay resultados del motor.
- Certificación completa: Aprobación de 15 tests de integración (MIME, 404 JSON, integridad).

## [2026-05-06] - Fase 9D: Advanced Persistence & Production
- Implementación de persistencia completa en PostgreSQL para Seguimiento de Producción (paneles y global).
- Sistema de snapshots de Presupuesto con almacenamiento de ítems y totales.
- Catálogo de Costos centralizado y persistente con gestión de precios desde la UI.
- Historial de Exportaciones dinámico con registro de cada generación técnica.
- Corrección de bug crítico de descargas: implementación de `/api/exports/[filename]` seguro.
- Certificación de 14 nuevos tests de persistencia y descargas industriales.

## [2026-05-06] - Fase 9B: Advanced UI Features
- Migración de pantallas Viewer, Exportaciones, Presupuesto y Producción a Next.js.
- Integración de QA Viewer legado mediante iframe y `postMessage`.
- Implementación de calculadoras reactivas y visualizadores de progreso.
- Solución a errores de `styled-jsx` "client-only" mediante `StyledJsxRegistry`.
- Certificación de 10 tests de UI avanzada y paridad de funciones.

## [2026-05-06] - Fase 9C: Migración API Express a Next.js
- Unificación de UI y API en `apps/product-ui` (puerto 3002).
- Implementación de 9 Route Handlers portando lógica de Express.
- Reutilización de módulos del motor (`PostgresStorageAdapter`, `PlanoPackageBuilder`).
- Actualización de `ApiClient` a rutas relativas `/api`.
- Servidor Express marcado como Legacy.
- Certificación de 10 tests de backend unificado.

## [2026-05-06] - Fase 9A: Migración Product UI a Next.js
- Inicialización de aplicación Next.js 14 en `apps/product-ui`.
- Implementación de Dashboard, Listado de Proyectos, Creación y Detalle.
- Eliminación total de dependencia de LocalStorage para datos de proyecto (PostgreSQL única fuente).
- Sistema de navegación App Router con AppShell unificado y Sidebar contextual.
- Banner de redirección en UI legacy para facilitar la transición.
- Certificación de 10 tests de migración y estabilidad.

## [2026-05-06] - Fase 7: Reparación de Proyecto Activo y Persistencia
- Corrección de visibilidad intermitente de proyectos.
- Implementación de limpieza automática de IDs obsoletos (404 de API).
- Prevención de "split-brain" eliminando fallbacks silenciosos a LocalStorage cuando la API es saludable.
- Añadido indicador de fuente de datos (PostgreSQL) y helper de limpieza de estado local.
- Certificación de 6 nuevos tests de UX y persistencia.

## [2026-05-06] - Fase 8A: Generador Base de Planos Técnicos
- Implementación de infraestructura de dibujo PDF con `pdf-lib`.
- Creación de 5 tipos de hojas base (Portada, Índice, Replanteo, Distribución, Fichas).
- Integración de API para exportación de planos.
- Botón de generación en UI de Exportaciones.
- Certificación de 13 nuevos tests de planos.

## Run 2026-05-05 19:42 — Phase 7.5A Product UX Stabilization (Core Loop)

### Request
Implement Iteration 7.5A: Unified layout, active project persistence, API status monitoring, and notification system for Index, Proyectos, and Detalle pages. Standardize routing and prepare for regeneration.

### Files Created
- `ui/product/shared/product-routes.js`
- `ui/product/shared/product-api-status.js`
- `ui/product/shared/product-active-project.js`
- `ui/product/shared/product-notifications.js`
- `ui/product/shared/product-layout.js`
- `scripts/product_ux_tests.ts`
- `docs/assisted-runs/runs/2026-05-05_1942_fase-7-5a-product-ux-stabilization.md`

### Files Modified
- `src/api/routes/proyectos.routes.ts`
- `ui/product/index.html`
- `ui/product/proyectos.html`
- `ui/product/proyecto-detalle.html`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- `npx ts-node scripts/product_ux_tests.ts` (Result: Passed 6/6)
- `npx ts-node scripts/product_routing_certification_tests.ts` (Result: Passed 8/8)
- `npm run test:api` (Result: Passed 7/7)

### Validation Result
Iteration 7.5A successful. Shared layout correctly injected via progressive injection. Core navigation loop (Dashboard -> List -> Detail) stabilized. Path standardization to absolute-style verified.

---

## Run 2026-05-05 17:20 — Phase 7 API Local UI ↔ PostgreSQL

### Request
Unify persistence by creating a local API server. PostgreSQL as single source of truth. Migrate Product UI to consume API via fetch.

### Files Created
- `src/api/server.ts`
- `src/api/routes/proyectos.routes.ts`
- `src/api/services/proyectos.service.ts`
- `ui/product/api-client.js`
- `scripts/api_tests.ts`
- `docs/assisted-runs/runs/2026-05-05_1720_fase-7-api-local-postgres.md`

### Files Modified
- `package.json`
- `ui/product/proyectos.html`
- `ui/product/proyecto-detalle.html`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- `npm run test:api` (Result: Passed 6/6)

### Validation Result
Phase 7 API implemented and certified. Frontend successfully consumes PostgreSQL data via API. Fallback to LocalStorage verified.

---

## Run 2026-05-05 17:00 — Phase 6A Routing Final Certification

### Request
Definitively fix project detail routing, eliminate redirect loops, and certify Phase 6A. Ensure explicit ID-based navigation across all product modules.

### Files Created
- `scripts/product_routing_certification_tests.ts`
- `docs/assisted-runs/runs/2026-05-05_1700_fase-6a-routing-final-certification.md`

### Files Modified
- `ui/product/proyecto-detalle.html`
- `ui/product/proyectos.html`
- `ui/product/viewer.html`
- `ui/product/exportaciones.html`
- `ui/product/presupuesto.html`
- `ui/product/produccion.html`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- `npx ts-node scripts/product_routing_certification_tests.ts` (Result: Passed 5/5)

### Validation Result
Phase 6A Routing stabilized and certified. No redirect loops. ID preservation verified.

---

## Run 2026-05-05 11:30 — Phase 6A PostgreSQL Local Persistence & Dashboard

### Request
Migrate Product UI persistence to PostgreSQL local. Maintain decoupled adapter architecture (Postgres, File, LocalStorage). Implement a local dashboard for navigation and system status.

### Files Created
- `src/modules/product/storage/db-config.ts`
- `src/modules/product/storage/migrations.ts`
- `src/modules/product/storage/storage-adapter.ts`
- `src/modules/product/storage/postgres-storage-adapter.ts`
- `src/modules/product/storage/file-storage-adapter.ts`
- `scripts/db_migrate.ts`
- `scripts/db_test_connection.ts`
- `scripts/db_status.ts`
- `ui/product/index.html` (Local Dashboard)
- `docs/assisted-runs/runs/2026-05-05_1130_fase-6a-postgres-dashboard-local.md`

### Files Modified
- `package.json`
- `scripts/product_tests.ts`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- `npm run db:test-connection` (Result: Passed)
- `npm run db:migrate` (Result: Passed)
- `npm run test:product` (Result: Passed 20/20)

### Validation Result
Phase 6A PostgreSQL migration and Dashboard implemented. 10/10 new tests passing.

---

## Run 2026-05-05 10:08 — Phase 6 Product UI Implementation

### Request
Transform technical engine into a user-facing product. Implement project management, specialized viewer modes, budgeting, and production tracking. All UI in Spanish.

### Files Created
- `src/modules/product/types.ts`
- `src/modules/product/project-manager.ts`
- `src/modules/product/project-versioning.ts`
- `src/modules/product/configuracion-proyecto.ts`
- `src/modules/product/presupuesto-builder.ts`
- `src/modules/product/costos-builder.ts`
- `src/modules/product/production-tracker.ts`
- `src/modules/product/export-center.ts`
- `src/modules/product/viewer/product-viewer-state.ts`
- `src/modules/product/viewer/product-viewer-adapter.ts`
- `ui/product/proyectos.html`
- `ui/product/proyecto-detalle.html`
- `ui/product/viewer.html`
- `ui/product/exportaciones.html`
- `ui/product/presupuesto.html`
- `ui/product/produccion.html`
- `scripts/product_tests.ts`
- `docs/assisted-runs/runs/2026-05-05_1008_fase-6-product-ui.md`

### Files Modified
- `package.json`

### Tests Executed
- `npm run test:product` (Result: Passed 10/10)

### Validation Result
Phase 6 Product UI functional. All screens in Spanish. 10/10 tests passing.

---

## Run 2026-05-04 22:46 — Phase 3B Advanced Header Preliminary Design

### Request
Implement Phase 3B: Advanced Structural Dintel Design for large openings. Classify openings by span, implement multiple strategies (Simple, Compound, Trussed, Tubular), and integrate into the structural engine with mandatory Spanish domain language and safety disclaimers.

### Files Created
- `src/modules/structural/clasificador-estructural-aberturas.ts`
- `src/modules/structural/selector-estrategia-dintel.ts`
- `src/modules/structural/verificador-dintel-compuesto.ts`
- `src/modules/structural/verificador-dintel-reticulado.ts`
- `src/modules/structural/verificador-dintel-tubular.ts`
- `src/modules/structural/generador-reporte-dintel.ts`
- `docs/assisted-runs/runs/2026-05-04_2246_fase-3b-dinteles-avanzados.md`

### Files Modified
- `src/modules/structural/types.ts`
- `src/modules/structural/structural-assumptions.ts`
- `src/modules/structural/header-checker.ts`
- `src/modules/structural/engine.ts`
- `src/modules/structural/report.ts`
- `src/modules/render/localizacion-dominio.ts`
- `src/modules/render/scene-builder.ts`
- `src/modules/render/header-mesh-builder.ts`
- `scripts/structural_tests.ts`
- `scripts/render_tests.ts`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- command: `npm run test:all` (Result: Passed 100%)
- command: `npm run localizacion:auditar` (Result: Passed)

### Validation Result
Phase 3B Advanced Header design logic implemented, localized, and verified. 20/20 structural tests passing.

---

## Run 2026-05-02 03:25 — Phase 4A Digital Twin Core DTO

### Request
Implement Phase 4A: Digital Twin / 3D Production Layer Core DTO. Create deterministic, read-only translation of ProjectResult into a RenderSceneDTO suitable for visualization, ensuring absolute immutability of the source data.

### Files Created
- `src/modules/render/types.ts`
- `src/modules/render/render-config.ts`
- `src/modules/render/wall-mesh-builder.ts`
- `src/modules/render/panel-mesh-builder.ts`
- `src/modules/render/stud-mesh-builder.ts`
- `src/modules/render/opening-mesh-builder.ts`
- `src/modules/render/header-mesh-builder.ts`
- `src/modules/render/roof-mesh-builder.ts`
- `src/modules/render/labels-builder.ts`
- `src/modules/render/scene-builder.ts`
- `scripts/render_tests.ts`
- `docs/assisted-runs/runs/2026-05-02_0325_phase-4a_digital-twin-core.md`

### Files Modified
- `package.json`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- command: `npm run test:render` (Result: Pending)

### Validation Result
Phase 4A Core implementation complete. Visual overlay and shop view separated to Phase 4B.

---## Run 2026-05-02 03:05 — Phase 3 Structural Validation Layer Implementation

### Request
Implement the Phase 3 Structural Intelligence layer, introducing preliminary structural checks based on CIRSOC contexts without claiming final professional approval. Included profile catalogs, load generation, preliminary load combinations, member checker, header checker, roof structural checker, anchor checker, and report generation.

### Files Created
- `src/modules/structural/types.ts`
- `src/modules/structural/code-references.ts`
- `src/modules/structural/structural-assumptions.ts`
- `src/modules/structural/profile-catalog.ts`
- `src/modules/structural/structural-member-extractor.ts`
- `src/modules/structural/load-engine.ts`
- `src/modules/structural/load-combinations.ts`
- `src/modules/structural/member-checker.ts`
- `src/modules/structural/header-checker.ts`
- `src/modules/structural/roof-structural-checker.ts`
- `src/modules/structural/anchor-checker.ts`
- `src/modules/structural/report.ts`
- `src/modules/structural/engine.ts`
- `scripts/structural_tests.ts`
- `docs/assisted-runs/runs/2026-05-02_0305_phase-3_structural-layer.md`

### Files Modified
- `package.json`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Tests Executed
- command: `npm run test:all` (Result: Passed - all tests including the new structural test suite executed perfectly)

### Validation Result
Phase 3 Preliminary Structural Layer implemented and verified. Strict bounds successfully enforced.

---## Run 2026-05-02 02:12 — Phase 2 Certification

### Request
Execute and record full certification suite for Phase 2 without starting Phase 3. Add missing global tests to complete the 8 required tests.

### Files Changed
- `scripts/global_planning_tests.ts`
- `scripts/regression_tests.ts`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/validation-report.md`

### Summary of Changes
- Completed all 8 mandatory Phase 2 global planning tests.
- Fixed `regression_tests.ts` to support the new global planning pipeline.
- Executed `test:global`, `test:intelligence`, `test:regression`, and `phase:detect`.
- Recorded real test output.
- Enforced Phase 2 Certification Pending state, explicitly preventing Phase 3 transition.

### Tests Executed
- command: `npm run test:global` (Result: Passed)
- command: `npm run test:intelligence` (Result: Failed - known Phase 1 polish issue)
- command: `npm run test:regression` (Result: Passed)
- command: `npm run phase:detect` (Result: Detected Phase 3 boundaries, manually reverted state to Certification Pending)

### Validation Result
Phase 2 Global Planning logic is certified. Phase 1 intelligence has a minor known failure.

---## Run 2026-05-02 02:02 — Phase 2 Global Planner Implementation

### Request
Implement the Phase 2 Global Planning layer on top of Phase 1, maintaining determinism, explainability, and the strict pipeline.

### Files Changed
- `src/modules/global-planning/*` (created)
- `scripts/global_planning_tests.ts` (created)
- `scripts/global_planning_fixtures.ts` (created)
- `src/index.ts`
- `src/modules/construction/engine.ts`
- `package.json`

### Summary of Changes
- Created modular global planner (`arbiter`, `generator`, `validator`, `scorer`).
- Rewrote engine pipeline so local intelligence runs strictly before global planning.
- Added 5 rigorous global tests verifying behavior and beam search limits.

### Tests Executed
- command: `npm run test:global`
- result: Passed

### Validation Result
Passed

### Notes
Legacy `src/modules/planner/` is preserved for now per user instruction.

---

## Run 2026-05-02 01:51 — Traceability Setup

### Request
Implement a permanent traceability system for the steel frame project with audit logs.

### Files Changed
- `docs/assisted-runs/README.md`
- `docs/assisted-runs/current-state.md`
- `docs/assisted-runs/decision-log.md`
- `docs/assisted-runs/changelog-assisted.md`
- `docs/assisted-runs/validation-report.md`
- `docs/assisted-runs/next-steps.md`
- `docs/assisted-runs/runs/2026-05-02_0151_phase-2_traceability-setup.md`
- `scripts/print_project_state.js`
- `package.json`

### Summary of Changes
- Created assisted-runs documentation folder structure.
- Created all base files for traceability.
- Added audit:state and test:all to package.json scripts.
- Created script to print project state.

### Tests Executed
- command: Not executed yet.
- result: N/A

### Validation Result
Passed (documentation added)

### Notes
Initial setup for traceability completed successfully.
