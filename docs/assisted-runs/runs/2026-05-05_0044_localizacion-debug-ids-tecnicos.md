# Log de Ejecución: Separación de IDs Técnicos (Modo Debug)

**Fecha:** 2026-05-05
**Fase:** Mejora de UX y Separación de Trazabilidad

## Causa Raíz
La ficha de selección del visor QA mostraba una mezcla de etiquetas legibles e IDs técnicos crudos (`panel_wall_south_0`, etc.) de forma redundante, lo que sobrecargaba la interfaz para el usuario final y no cumplía con el estándar de "idioma 100% humano".

## Archivos Modificados
- `tools/qa-viewer/index.html`: Agregado checkbox "Mostrar IDs técnicos" en el panel de controles.
- `tools/qa-viewer/viewer.js`: 
    - Implementación de estado `debugMode`.
    - Refactorización de `showSelectionInfo` para ocultar IDs crudos por defecto.
    - Creación de sección condicional "IDs técnicos" visible solo en modo debug.
    - Filtrado de campos que contienen "interno" en el nombre para evitar redundancia en modo normal.
- `src/modules/render/localizacion-dominio.ts` & `localizacion.js`: Sincronización de claves de metadatos para lenguaje humano.
- `scripts/auditar_localizacion_visible.ts`: Actualización de reglas para permitir IDs técnicos solo en campos explícitamente marcados como tales.

## Comportamiento Implementado

### Modo Normal (Predeterminado)
- **Objeto**: Panel Sur 1
- **Fuente**: Abertura
- **Muro**: Muro Sur
- **Panel**: Panel Sur 1
- **IDs crudos**: OCULTOS (No se muestran `wall_south`, `render_...`, etc.)

### Modo Debug (Activado por usuario)
- Se añade la sección **IDs técnicos** al final de la ficha.
- **Campos**:
    - `ID render`: render_panel_panel_wall_south_0
    - `ID fuente interno`: abertura_mzikzkck
    - `ID interno de muro`: wall_south
    - `ID interno de panel`: panel_wall_south_0

## Auditoría de Localización (`localizacion:auditar`)
El script de auditoría ahora es más estricto: cualquier ID técnico detectado en un campo que no esté en la "lista blanca técnica" disparará un error.

### Resultado Final
```text
=== AUDITORÍA DE LOCALIZACIÓN VISIBLE FINAL ===
AUDITORÍA 1: Etiquetas 3D -> ✅ Pasado
AUDITORÍA 2: Valores de Metadatos -> ✅ Pasado
AUDITORÍA 3: Claves de Metadatos -> ✅ Pasado
🏆 CERTIFICACIÓN DE LOCALIZACIÓN EXITOSA.
```

🏆 **ESTADO FINAL:** Interfaz limpia y profesional para el usuario final, con herramientas de trazabilidad avanzada disponibles bajo demanda para ingeniería.
