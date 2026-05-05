# Log de Ejecución: Localización de Visibilidad Final

**Fecha:** 2026-05-04
**Fase:** Auditoría de Visibilidad de Lenguaje de Dominio

## Causa Raíz
Aunque el motor interno ya utilizaba términos en español, las superficies de visualización (QA Viewer) y la exportación de metadatos (RenderSceneDTO) aún conservaban términos en inglés heredados de la arquitectura original y nombres de claves técnicos.

## Archivos Modificados
- `src/modules/render/localizacion-dominio.ts` [NUEVO]: Mapa centralizado de traducciones.
- `tools/qa-viewer/localizacion.js` [NUEVO]: Mapa de localización para el navegador.
- `tools/qa-viewer/index.html`: Localización de etiquetas UI estáticas.
- `tools/qa-viewer/viewer.js`: Implementación de consumo de mapa de traducción y localización de estadísticas/selección.
- `src/modules/render/render-config.ts`: Localización de presets de cámara.
- `src/modules/render/scene-builder.ts`: Localización de metadatos de escena (Fase 4A).
- `src/modules/render/stud-mesh-builder.ts`: Localización de claves y valores de metadatos de montantes.
- `src/modules/render/opening-mesh-builder.ts`: Localización de claves y valores de metadatos de aberturas.
- `src/modules/render/header-mesh-builder.ts`: Localización de estrategias de dintel.
- `src/modules/render/panel-mesh-builder.ts`: Localización de roles de panel.
- `src/modules/render/roof-mesh-builder.ts`: Localización de tipos de techo.
- `src/modules/render/labels-builder.ts`: Localización de metadatos de etiquetas.
- `scripts/export_render_scene.ts`: Corrección de compatibilidad con tipos refactorizados.

## Cadenas Localizadas (Ejemplos)
- `KING` -> `Montante Principal`
- `JACK` -> `Montante de Apoyo`
- `provisional_boxed_header` -> `Dintel Cajón Provisional`
- `one_slope` -> `Una Pendiente`
- `Selection Info` -> `Información de Selección`
- `role` -> `Rol`
- `type` -> `Tipo`

## Pruebas Ejecutadas
- `scripts/visibility_tests.ts`:
  - **TEST 1 (Valores):** PASADO (Cero términos prohibidos como 'king', 'header' en metadatos).
  - **TEST 2 (Claves):** PASADO (Claves como 'role', 'type' reemplazadas por 'Rol', 'Tipo').
  - **TEST 3 (Capas):** PASADO (Nombres de capas en español).

🏆 **ESTADO FINAL:** Todo el contenido visible para el usuario en el Visor de QA y en el JSON de renderizado está completamente localizado al español (Argentina).
