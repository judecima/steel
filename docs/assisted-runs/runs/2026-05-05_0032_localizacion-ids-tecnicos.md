# Log de Ejecución: Localización de IDs Técnicos

**Fecha:** 2026-05-05
**Fase:** Localización de Identificadores Técnicos

## Causa Raíz
A pesar de la localización de metadatos generales, los identificadores internos del motor (IDs de muros, paneles y aberturas) se mostraban en crudo en inglés técnico (`wall_south`, `panel_wall_south_0`) como valores primarios en la ficha de selección del visor QA.

## Archivos Modificados
- `src/modules/render/etiquetas-visuales.ts`: Agregados helpers `traducirIdMuro`, `traducirIdPanel`, `traducirIdAbertura`, `traducirIdRender` y `crearEtiquetaDesdeIdTecnico`.
- `tools/qa-viewer/localizacion.js`: Sincronización de los nuevos helpers de traducción de IDs al visor.
- `tools/qa-viewer/viewer.js`: Actualización de `showSelectionInfo` para mostrar etiquetas legibles en campos primarios y mover IDs crudos a campos técnicos/internos.
- `src/modules/render/localizacion-dominio.ts`: Renombramiento de claves de metadatos (`wallId` -> `Muro`, `panelId` -> `Panel`, `sourceId` -> `Fuente`).
- Builders (`panel-mesh-builder.ts`, `stud-mesh-builder.ts`, `opening-mesh-builder.ts`, `header-mesh-builder.ts`): Actualizados para inyectar etiquetas legibles en los campos primarios y preservar trazabilidad en campos `ID interno`.

## Comportamiento Implementado (Antes vs Después)

| Campo en Visor | Valor Anterior | Valor Nuevo (Primario) | Valor Nuevo (Técnico/Interno) |
| :--- | :--- | :--- | :--- |
| **Objeto** | `render_panel_panel_wall_south_0` | `Panel Sur 1` | `render_panel_panel_wall_south_0` |
| **Fuente** | `abertura_mzikzkck` | `Abertura` | `abertura_mzikzkck` |
| **Muro** | `wall_south` | `Muro Sur` | `wall_south` |
| **Panel** | `panel_wall_south_0` | `Panel Sur 1` | `panel_wall_south_0` |

## Auditoría de Localización (`localizacion:auditar`)
Se actualizó el script de auditoría para prohibir patrones como `wall_`, `panel_` o `render_` en cualquier campo que no sea explícitamente técnico (`ID técnico`, `ID interno`, `sourceId`, etc).

### Resultado Final
```text
=== AUDITORÍA DE LOCALIZACIÓN VISIBLE FINAL ===
AUDITORÍA 1: Etiquetas 3D -> ✅ Pasado
AUDITORÍA 2: Valores de Metadatos -> ✅ Pasado
AUDITORÍA 3: Claves de Metadatos -> ✅ Pasado
🏆 CERTIFICACIÓN DE LOCALIZACIÓN EXITOSA.
```

🏆 **ESTADO FINAL:** La interfaz de selección ahora presenta un lenguaje 100% humano y localizado, manteniendo la integridad técnica para depuración avanzada sin sacrificar la experiencia de usuario.
