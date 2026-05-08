# Route Map Audit — Steel Frame Project

Este documento audita las rutas actuales para restaurar la integridad arquitectónica del sistema.

## 1. Rutas de API — Gestión de Proyectos

---

### Ruta: `/api/proyectos/[id]`
**Responsabilidad**: Operaciones CRUD básicas de un proyecto específico (GET, PUT, DELETE).  
**Fuente de datos**: PostgreSQL (`PostgresStorageAdapter`).  
**DTO de entrada**: `ProjectDTO` (historial de versiones, configuración).  
**DTO de salida**: `ProjectDTO` + metadata de reparación.  
**Módulos que llama**: `PostgresStorageAdapter`, `ensureActiveVersion`, `normalizarConfiguracionParametrica`.  
**Puede mutar DB**: Sí (PUT para actualizar, DELETE para borrar, GET si requiere reparación).  
**Puede llamar EngineFacade**: No.  
**Debe regenerar**: No.  
**Errores controlados**: 404 (No encontrado), 500 (Error interno).  
**Estado actual**: Funcional.  
**Riesgo**: Bajo. La lógica de reparación automática en el GET asegura la integridad pero puede ser impredecible si no se monitorea.

---

### Ruta: `/api/proyectos/[id]/regenerar`
**Responsabilidad**: Disparar la regeneración geométrica y estructural del modelo a partir de la configuración paramétrica.  
**Fuente de datos**: PostgreSQL (Lee config, guarda `resultadoMotor`).  
**DTO de entrada**: N/A (usa el estado persistido).  
**DTO de salida**: Status, mensaje y estadísticas del modelo generado.  
**Módulos que llama**: `EngineFacade`, `PostgresStorageAdapter`, `ensureActiveVersion`.  
**Puede mutar DB**: Sí (guarda el resultado del motor en la versión actual).  
**Puede llamar EngineFacade**: Sí (Punto crítico de integración).  
**Debe regenerar**: Sí (Es su única función).  
**Errores controlados**: 404 (No encontrado), 500 (Fallo del motor).  
**Estado actual**: Funcional, pero el mapeo de `config` a `HouseInput` está hardcodeado en el handler.  
**Riesgo**: Medio. El mapeo debería estar en un servicio o adaptador para evitar desincronización entre la UI y el motor.

---

### Ruta: `/api/proyectos/[id]/render`
**Responsabilidad**: Generar el DTO de visualización 3D (RenderScene) para el viewer.  
**Fuente de datos**: PostgreSQL (`resultadoMotor`).  
**DTO de entrada**: N/A.  
**DTO de salida**: `RenderSceneIndustrialDTO`.  
**Módulos que llama**: `SceneBuilder`, `PostgresStorageAdapter`.  
**Puede mutar DB**: No (Salvo reparación automática).  
**Puede llamar EngineFacade**: No (Consume el resultado previo).  
**Debe regenerar**: No.  
**Errores controlados**: 404, `PROJECT_NOT_GENERATED`, `RENDER_TIMEOUT`.  
**Estado actual**: Estable.  
**Riesgo**: Bajo. Depende totalmente de que `resultadoMotor` sea válido y esté actualizado.

---

### Ruta: `/api/proyectos/[id]/aberturas`
**Responsabilidad**: Agregar o editar aberturas (ventanas/puertas) y forzar la regeneración inmediata.  
**Fuente de datos**: PostgreSQL.  
**DTO de entrada**: `wallId`, `tipo`, `ancho`, `alto`, `posicion`, `antepecho`.  
**DTO de salida**: `ProjectDTO` actualizado con el nuevo `resultadoMotor`.  
**Módulos que llama**: `EngineFacade`, `mapUIConfigToEngineInput`, `PostgresStorageAdapter`.  
**Puede mutar DB**: Sí.  
**Puede llamar EngineFacade**: Sí.  
**Debe regenerar**: Sí.  
**Errores controlados**: `INVALID_WALL_ID`, `OPENING_OUT_OF_WALL_BOUNDS`, `OPENING_HEIGHT_OUT_OF_BOUNDS`.  
**Estado actual**: Refactorizado recientemente para validación de límites.  
**Riesgo**: Medio. La duplicación de la lógica de regeneración (comparado con `/regenerar`) sugiere la necesidad de un `ProjectService`.

---

### Ruta: `/api/proyectos/[id]/internal-walls`
**Responsabilidad**: Gestión de tabiquería interna (muros no estructurales).  
**Fuente de datos**: PostgreSQL.  
**DTO de entrada**: Coordenadas de inicio/fin, altura, espesor.  
**DTO de salida**: Proyecto actualizado.  
**Módulos que llama**: `EngineFacade`.  
**Puede mutar DB**: Sí.  
**Puede llamar EngineFacade**: Sí.  
**Debe regenerar**: Sí.  
**Estado actual**: En desarrollo/Estabilización.  
**Riesgo**: Alto. La interacción entre muros internos y el motor perimetral debe estar bien definida para evitar solapamientos.

---

### Ruta: `/api/proyectos/[id]/exportaciones` y `/generar`
**Responsabilidad**: Generación de documentación técnica (BOM, CutList, PDFs).  
**Fuente de datos**: PostgreSQL (`resultadoMotor`).  
**DTO de salida**: Archivos binarios o JSON de exportación.  
**Módulos que llama**: `ExportService` (o similares), `SceneBuilder` (para planos).  
**Puede mutar DB**: No.  
**Puede llamar EngineFacade**: No.  
**Debe regenerar**: No (Debe usar el estado validado).  
**Estado actual**: Fragmentado.  
**Riesgo**: Alto. La generación de PDFs a menudo usa datos crudos en lugar de DTOs estables.

---

## 2. Rutas de UI (Pages)

---

### Ruta: `/proyectos/[id]`
**Responsabilidad**: Dashboard principal del proyecto. Edición paramétrica básica.  
**DTO de entrada**: `ProjectDTO`.  
**Estado actual**: Funcional.  
**Riesgo**: Bajo.

---

### Ruta: `/proyectos/[id]/viewer`
**Responsabilidad**: Interacción 3D avanzada. Colocación de aberturas y muros.  
**DTO de entrada**: `RenderSceneIndustrialDTO` (vía `/api/.../render`).  
**Estado actual**: Restaurado.  
**Riesgo**: Medio. La comunicación vía `postMessage` con el iframe es propensa a desincronización si el contrato del viewer cambia.

---

### Ruta: `/proyectos/[id]/presupuesto`
**Responsabilidad**: Visualización de costos y BOM.  
**DTO de entrada**: `BOM` (del `resultadoMotor`).  
**Estado actual**: Estable.  
**Riesgo**: Bajo.

---

### Ruta: `/api/exports` (GET)
**Responsabilidad**: Consultar el estado y disponibilidad de los archivos exportados físicamente en el disco.  
**Fuente de datos**: Sistema de archivos (`tools/qa-viewer/exports`) y tabla `exportaciones` en DB.  
**DTO de salida**: Lista de archivos con status (`disponible`, `error`, `incompleto`).  
**Módulos que llama**: `fs`, `pg` (pool directo).  
**Puede mutar DB**: No.  
**Riesgo**: Medio. Dependencia directa de rutas relativas fuera de `apps/product-ui`. El uso de `pg.query` directo en el handler rompe la abstracción del `StorageAdapter`.

---

### Ruta: `/api/proyectos/[id]/exportaciones/generar` (POST)
**Responsabilidad**: Orquestar la generación de todos los entregables industriales y planos técnicos.  
**Fuente de datos**: `ProjectDTO` -> `resultadoMotor`.  
**Módulos que llama**: `PackageBuilder`, `CSVExporter`, `PlanoPackageBuilder`, `TechnicalPdfExporter`.  
**Puede mutar DB**: Sí (Registra el evento en la tabla `exportaciones`).  
**Puede llamar EngineFacade**: No directamente (usa el resultado persistido), pero `PlanoPackageBuilder` puede disparar lógicas pesadas.  
**Riesgo**: Muy Alto. Ejecuta tareas intensivas de CPU (PDF generation) sincrónicamente con un timeout de 20s. Mezcla lógica de exportación industrial con generación de planos.

---

## 3. Conclusiones Arquitectónicas (Fase R1)

1. **Fragmentación de Persistencia**: Se detecta el uso de `PostgresStorageAdapter` en algunas rutas y `pg.query` directo en otras (ej. exportaciones). **Acción**: Unificar acceso a datos en el adaptador o un `ProjectService`.
2. **Duplicación de Lógica de Motor**: Las rutas de `/regenerar`, `/aberturas` e `/internal-walls` disparan `EngineFacade.generate`. **Acción**: Centralizar en un servicio que asegure la consistencia de los inputs.
3. **Dependencias del FileSystem**: El sistema confía en que `../../tools/qa-viewer/exports` sea escribible y accesible. **Acción**: Abstraer el almacenamiento de archivos (FileStorageProvider).
4. **Acoplamiento de Planos**: La generación de planos está incrustada en el flujo de exportación. Si los planos fallan, la exportación industrial se marca como error. **Acción**: Desacoplar procesos.
5. **Estado de Reparación**: La lógica de `ensureActiveVersion` en casi todos los GETs indica que los datos en DB a menudo están en un estado "inválido" o "viejo". **Acción**: Mejorar las migraciones para que el "repair" no sea necesario en runtime de lectura.

---

## R2/R6 Contract Gates

Se han establecido contratos canónicos y un script de auditoría automatizada para bloquear infracciones arquitectónicas.

### Contratos Canónicos (Fase R2)
- `src/contracts/project-config.contract.ts`: Verdad única de configuración paramétrica.
- `src/contracts/engine-input.contract.ts`: Interfaz estricta para el motor (HouseInput).
- `src/contracts/render-scene.contract.ts`: DTO de comunicación con el visor 3D.
- `src/contracts/export.contract.ts`: Estructura de paquetes industriales.
- `src/contracts/viewer-events.contract.ts`: Protocolo de mensajes Viewer <-> App.

### Auditoría de Integridad (Fase R6)
Resultados del script `scripts/architecture_integrity_check.ts`:

| Regla | Estado | Infracciones | Rutas Críticas |
| :--- | :--- | :--- | :--- |
| **Check 1: require()** | ✅ Pasa | 0 | Ninguna |
| **Check 2: EngineFacade Directo** | ✅ Pasa | 0 | Saneado vía ProjectService |
| **Check 3: pg.Pool Directo** | ❌ Falla | 7 | `/exports`, `/presupuesto`, `/produccion`, `/planos/exportar` |
| **Check 4: Rutas Relativas Externas** | ❌ Falla | 4 | `/api/exports`, `/exportaciones/generar` |
| **Check 5: Save antes de Generate** | ✅ Pasa | 0 | Saneado vía ProjectService |
| **Check 7: Duplicación Mapper** | ✅ Pasa | 0 | Unificado en ProjectService |
| **Check 8: Human Labels en wallId** | ❌ Falla | 1 | `qa-viewer/viewer.js` |
| **Check 10: Tipos Duplicados** | ✅ Pasa | 0 | Centralizado en src/contracts |

### Rutas Saneadas (Fase R7)
- **`/api/proyectos/[id]/regenerar`**: Ahora delegada totalmente a `ProjectService`.
- **`/api/proyectos/[id]/aberturas`**: Validaciones de límites y regeneración centralizadas.
- **`/api/proyectos/[id]/internal-walls`**: Inyección de tabiquería saneada.

### Rutas Infractoras Restantes
1. **`/api/proyectos/[id]/exportaciones/generar`**: Pendiente de migración a un servicio de exportación. Mantiene Check 3 y 4.
2. **`/api/exports`**: Mantiene Check 3 y 4.
3. **`viewer.js`**: Requiere refactor de strings localizadas.


---

**Próxima Fase**: Implementación de `ProjectService` para sanear los Checks 2, 3, 5 y 7.

