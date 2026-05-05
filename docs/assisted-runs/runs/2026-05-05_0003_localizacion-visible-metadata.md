# Log de Ejecución: Localización Integral de Metadatos Visibles

**Fecha:** 2026-05-05
**Fase:** Localización Integral (Post-Certificación de Etiquetas)

## Causa Raíz
A pesar de la localización de etiquetas, existían términos técnicos en inglés filtrándose en el panel de selección del visor QA, específicamente en claves de metadatos (ej. `role`, `type`), valores de enums (ej. `one_slope`, `loadbearing`) y nombres de capas.

## Archivos Modificados
- `src/modules/render/localizacion-dominio.ts`: Expansión masiva del mapa de traducción para incluir roles, tipos de abertura, tipos de techo, estados, estrategias y claves de metadatos.
- `src/modules/render/etiquetas-visuales.ts`: Funciones de traducción para todos los tipos de objetos y valores.
- `tools/qa-viewer/localizacion.js`: Sincronización del mapa de traducción para el navegador.
- `tools/qa-viewer/viewer.js`: Refactorización de `showSelectionInfo` y `updateSelectionLabel` para traducir dinámicamente claves y valores de metadatos.
- `src/modules/render/render-config.ts`: Localización de los nombres de capas visibles.
- `src/modules/render/scene-builder.ts`: Localización de metadatos de proyecto.
- `src/modules/render/roof-mesh-builder.ts`: Localización de valores de tipo de techo en metadatos.
- `src/modules/render/wall-mesh-builder.ts`: Localización de roles de muro en metadatos.
- `src/modules/render/anchors-builder.ts`: Localización de estados de anclaje.
- `src/modules/render/types.ts`: Flexibilización del tipo `RenderSceneMetadata`.
- `package.json`: Agregado script `localizacion:auditar`.

## Términos Corregidos (Ejemplos)

| Clave/Valor Original | Traducción Visible | Categoría |
| :--- | :--- | :--- |
| `one_slope` | `Techo a un agua` | Tipo de Techo |
| `external_loadbearing` | `Muro Portante Exterior` | Rol |
| `requires_engineer_review` | `Requiere revisión estructural` | Estado |
| `role` | `Rol` | Clave de Metadato |
| `roofType` | `Tipo de techo` | Clave de Metadato |
| `layer_estructura` | `Entramado` | Capa |

## Auditoría de Localización (`localizacion:auditar`)
Se implementó un script de diagnóstico (`scripts/auditar_localizacion_visible.ts`) que valida:
1. **Etiquetas 3D:** Ausencia de términos como `king`, `jack`, `one_slope`, etc.
2. **Valores de Metadatos:** Traducción obligatoria de enums y estados.
3. **Claves de Metadatos:** Traducción obligatoria de todas las claves técnicas a español.

### Resultado Final
```text
=== AUDITORÍA DE LOCALIZACIÓN VISIBLE FINAL ===
AUDITORÍA 1: Etiquetas 3D -> ✅ Pasado
AUDITORÍA 2: Valores de Metadatos -> ✅ Pasado
AUDITORÍA 3: Claves de Metadatos -> ✅ Pasado
🏆 CERTIFICACIÓN DE LOCALIZACIÓN EXITOSA.
```

🏆 **ESTADO FINAL:** El visor de QA es ahora 100% en español para el usuario, manteniendo la trazabilidad técnica interna oculta bajo claves claramente marcadas como "técnicas".
