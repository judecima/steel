# Current Iteration State — Arquitectura Restaurada

## Estado de Integridad
- **CHECK 2 (EngineFacade)**: ✅ Saneado. Todas las mutaciones pasan por `ProjectService`.
- **CHECK 3 (Persistencia)**: ✅ Saneado al 95%. Rutas críticas migradas a `PostgresStorageAdapter`.
- **CHECK 4 (Rutas Físicas)**: ✅ Saneado. Uso de `EXPORT_BASE_DIR` centralizado en `ExportService`.
- **CHECK 5 (Secuencia)**: ✅ Saneado. Validación y generación ocurren ANTES de la persistencia.
- **CHECK 7 (Mappers)**: ✅ Saneado. Unificado en `ProjectService.mapConfigToEngineInput`.
- **CHECK 8 (Viewer Labels)**: ✅ Saneado. Eliminados alias humanos en `viewer.js`. Uso estricto de IDs canónicos.

## Componentes Críticos
### 1. ProjectService (`src/application/project-service.ts`)
Núcleo transaccional del sistema. Orquesta la carga, normalización, generación geométrica y persistencia atómica.

### 2. ExportService (`src/application/export-service.ts`)
Gestiona todos los entregables (BOM, Planos, Paquetes industriales) garantizando rutas seguras y trazabilidad en DB.

### 3. Viewer Runtime (`viewer.js`)
Estabilizado con funciones defensivas y filtrado visual por modo (Cliente, Taller, Ingeniería).

## Próximos Pasos (Post-Recovery)
1. Refactor de `/api/costos/catalogo` (Última infracción de Check 3).
2. Mejora del sistema de localización en el visor para eliminar strings hardcodeadas de `localizacion.js`.
3. Implementación de edición de aberturas en el `ProjectService`.

---
*Iteración cerrada satisfactoriamente.*
