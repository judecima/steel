# Auditoría Quirúrgica de Runtime — Fase 9F

Este informe detalla las causas raíz de los fallos detectados en los flujos de PDF, Aberturas y Muros Interiores.

## Matriz de Causa Raíz

| Flujo | Acción | Endpoint | Causa Raíz | Archivo | Línea | Fix Quirúrgico |
| ----- | ------ | -------- | ---------- | ------- | ----- | -------------- |
| **PDF** | Generar Descargable | `/api/proyectos/[id]/planos/exportar` | Drift en DTO de geometría: Entidades sin `start/end` o con coordenadas `NaN`. | `pdf-exporter.ts` | ~150 | Implementar guards en `normalizePanelGeometry` y `PdfExporter`. |
| **Aberturas** | Doble Click + Guardar | `/api/proyectos/[id]/aberturas` | **Drift de Configuración**: Se envía `anchoVivienda` pero el motor espera `width`. | `engine-facade.ts` | 30-40 | Mapear explícitamente `anchoVivienda` -> `width` y `largoVivienda` -> `length`. |
| **Muros Int.** | Doble Click + Guardar | `/api/proyectos/[id]/internal-walls` | **Violación de Schema**: Intento de guardado sin campo `estado` (required en DB). | `postgres-storage-adapter.ts` | 24 | Asegurar que todo objeto `ProyectoDTO` incluya `estado: 'borrador'` por defecto. |

---

## Hallazgos por Componente

### 1. PDF Exporter & Scene Adapter
- **Problema**: El error `Cannot read properties of undefined (reading 'x')` ocurre cuando `normalizePanelGeometry` no encuentra puntos válidos en el objeto (ej. `PlanoDimensionDTO`).
- **Evidencia**: El log del simulador mostró que si bien los casos simples pasan, el motor industrial genera estructuras `escenaBase` que el exporter legacy no siempre mapea correctamente.
- **Acción**: Reforzar `pdf-scene-adapter.ts` para que nunca devuelva `NaN` y que `PdfExporter` ignore entidades corruptas sin abortar todo el PDF.

### 2. EngineFacade & Drifting
- **Problema**: `RangeError: Invalid array length` en `candidate-generator.ts`.
- **Causa Exacta**: `wallLength` llegaba como `undefined` porque el motor recibía un objeto con `anchoVivienda` (formato UI/DB) en lugar de `width` (formato Engine).
- **Acción**: El `EngineFacade` debe actuar como un traductor estricto entre el DTO de persistencia y el input del motor.

### 3. Persistencia (PostgreSQL)
- **Problema**: Fallo en `INSERT` debido a `estado` nulo.
- **Causa**: Las llamadas desde los nuevos endpoints (`/aberturas`, `/internal-walls`) a veces reconstruyen el objeto de proyecto pero omiten campos obligatorios de la tabla `proyectos`.
- **Acción**: Centralizar la "reparación" del objeto proyecto antes de cada `storage.saveProject`.

## Fixes aplicados

### 1. Mapper Centralizado (`mapUIConfigToEngineInput`)
- **Archivo**: `src/modules/product/map-ui-config-to-engine-input.ts`
- **Causa Raíz Cerrada**: Se eliminó el drift entre `anchoVivienda/largoVivienda` (UI) y `width/length` (Engine).
- **Resultado**: El motor ya no recibe `undefined` para las dimensiones del muro, eliminando el `RangeError`.

### 2. Sanitización de Persistencia (`ensureProjectPersistenceDefaults`)
- **Archivo**: `src/modules/product/storage/storage-utils.ts`
- **Causa Raíz Cerrada**: Se garantiza que el campo `estado` (borrador) y `fechaActualizacion` estén presentes antes de cada `INSERT/UPDATE`.
- **Resultado**: Fin de los errores de restricción `NOT NULL` en PostgreSQL al guardar aberturas o muros internos.

### 3. PDF Exporter Robusto
- **Archivo**: `src/modules/planos/pdf-exporter.ts` y `pdf-scene-adapter.ts`.
- **Causa Raíz Cerrada**: Implementación de `readPoint` que tolera formatos metros/milímetros y guards contra `NaN`.
- **Resultado**: El PDF se genera incluso si hay entidades con geometría incompleta, logueando un warning en lugar de crashear.

## Evidencia de Validación
- **Auditoría de Contratos**: `scripts/debug_contracts.ts` confirma normalización de `wallId` OK.
- **Simulación de Flujo**: `scripts/debug_runtime_flows.ts` completa el ciclo Proyecto -> Abertura -> Muro Interno -> PDF con éxito.
- **Estabilidad**: `npm run dev` operativo y endpoints respondiendo con éxito técnico (`ok: true`).
