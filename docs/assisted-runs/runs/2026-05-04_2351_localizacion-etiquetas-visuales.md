# Log de Ejecución: Localización de Etiquetas Visuales

**Fecha:** 2026-05-04
**Fase:** Localización de Etiquetas Visuales (Post-Auditoría de Visibilidad)

## Causa Raíz
Las etiquetas 3D visibles en el visor de QA aún utilizaban identificadores técnicos internos (ej. `Pwall_south_0(str)`), lo cual no cumplía con los estándares de "Truth Certified" para el dominio en español.

## Archivos Modificados
- `src/modules/render/etiquetas-visuales.ts` [NUEVO]: Helpers para generación de etiquetas legibles (Panel Sur 1, Ventana 1.0x1.0).
- `src/modules/render/labels-builder.ts`: Integración de los nuevos helpers y almacenamiento de IDs técnicos en metadatos.
- `src/modules/render/panel-mesh-builder.ts`: Inyección de etiquetas legibles en metadatos de paneles.
- `src/modules/render/wall-mesh-builder.ts`: Inyección de etiquetas legibles en metadatos de muros.
- `src/modules/render/opening-mesh-builder.ts`: Inyección de etiquetas legibles en metadatos de aberturas.
- `src/modules/render/header-mesh-builder.ts`: Inyección de etiquetas legibles en metadatos de dinteles.
- `src/modules/render/stud-mesh-builder.ts`: Inyección de etiquetas legibles en metadatos de montantes y soleras.
- `tools/qa-viewer/viewer.js`: Actualización del panel de selección y etiquetas flotantes para priorizar la "Etiqueta" sobre el ID técnico.
- `tools/qa-viewer/localizacion.js`: Nuevas claves de UI (`Objeto`, `ID Técnico`).

## Ejemplos Antes/Después

| Tipo | Antes (Visible) | Después (Visible) | ID Técnico (Metadata) |
| :--- | :--- | :--- | :--- |
| **Panel** | `Pwall_south_0(str)` | `Panel Sur 1` | `panel_wall_south_0` |
| **Abertura** | `V 1.5x1.0` | `Ventana 1.50x1.00` | `abertura_yhru82qbu` |
| **Montante** | `king` | `Montante Principal` | `stud_kxm2pmaqu` |

## Pruebas Ejecutadas
- `scripts/label_localization_tests.ts`:
  - **TEST 1 (Paneles):** PASADO (Sin términos 'wall', 'north', etc.; uso de 'Norte', 'Sur').
  - **TEST 2 (Metadatos):** PASADO (Separación clara de Etiqueta e ID Técnico).
  - **TEST 3 (Aberturas):** PASADO (Uso de 'Ventana'/'Puerta').

🏆 **ESTADO FINAL:** Las etiquetas visuales son ahora 100% legibles y centradas en el dominio argentino, manteniendo la trazabilidad técnica mediante metadatos no intrusivos.
