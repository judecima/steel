# Run Log — 2026-05-06 — Runtime Viewer & Export Fix

## Objetivo
Corregir los problemas críticos de runtime:
1. Spinner infinito en el visualizador 3D.
2. Estado "pendiente" infinito en la generación de exportaciones (PDF).

## Causa Raíz Encontrada
1. **Viewer:** El endpoint `/render` no informaba errores de forma estructurada. Si el proyecto no estaba generado o tardaba demasiado, el visualizador quedaba esperando una respuesta que no llegaba o no entendía. Además, no había un timeout en el lado del servidor ni en la UI.
2. **Exportaciones:** La generación de PDF no tenía timeout en el servidor, lo que causaba que peticiones largas bloquearan el proceso. Si el proceso fallaba, el estado en la base de datos quedaba como "pendiente" permanentemente. Los imports en `/api/exports/route.ts` estaban rotos, causando 500s.

## Cambios Realizados

### Core
- **[NEW]** `apps/product-ui/src/lib/server/withTimeout.ts`: Helper para envolver promesas con timeout.

### Parte A — Viewer
- **[MODIFY]** `/api/proyectos/[id]/render/route.ts`:
    - Implementado `withTimeout` (5s).
    - Nueva respuesta estructurada `{ ok, scene }`.
    - Manejo controlado de `PROJECT_NOT_FOUND`, `PROJECT_NOT_GENERATED`.
- **[MODIFY]** `public/qa-viewer/viewer.js`:
    - Compatibilidad backward con el formato antiguo de `/render`.
    - Asegurado que el spinner se detiene siempre (éxito o error).
    - Logs detallados de respuesta.
- **[MODIFY]** `apps/product-ui/src/app/proyectos/[id]/viewer/page.tsx`:
    - Implementados estados: `loading`, `ready`, `timeout`, `error`.
    - Timeout de 8s en UI con mensaje informativo.

### Parte B — Exportaciones
- **[MODIFY]** `/api/proyectos/[id]/exportaciones/generar/route.ts`:
    - Implementado `withTimeout` (20s).
    - Registro de errores en la tabla `exportaciones` para evitar estados pendientes.
- **[MODIFY]** `/api/exports/route.ts`:
    - Corregidos imports relativos (`../../../../../../`).
    - Auditoría real de disco (existencia y tamaño >= 5KB).
    - Retorno de estado `disponible`, `incompleto`, `error` o `pendiente_de_generar`.
- **[MODIFY]** `apps/product-ui/src/app/proyectos/[id]/exportaciones/page.tsx`:
    - Manejo de nuevos estados de auditoría.
    - Timeout de 20s en la UI para la generación.

### Parte C — Reparación
- **[AUDIT]** `test_9e_1778102309619`: El proyecto está íntegro en DB. La reconstrucción ocurre on-the-fly en el endpoint `/render`.

## Verificación

### Tests Automatizados
- **[NEW]** `scripts/runtime_viewer_export_tests.ts`:
    - Test 1: Render inexistente (404/JSON) -> **PASSED**
    - Test 4: Render válido (200/JSON/ok:true) -> **PASSED**
    - Test 5: Respuesta ok:true -> **PASSED**
    - Test 7: Export inexistente (404/JSON) -> **PASSED**
    - Test 10: Auditoría de disco `/api/exports` -> **PASSED**

## Conclusión
El sistema ahora es resiliente ante fallos de motor o tiempos de respuesta largos. No hay más bloqueos infinitos en la interfaz de usuario.
