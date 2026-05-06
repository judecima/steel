import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaDintel, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';
import { buildCompoundHeaderMeshes } from './dintel-compuesto-builder';
import { buildTrussedHeaderMeshes } from './dintel-reticulado-builder';
import { buildTubularHeaderMeshes } from './dintel-tubular-builder';

export function buildHeaderMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    for (const abertura of panel.aberturas) {
      if (abertura.dintel) {
        const yTop = (abertura.sillHeight || 0) + abertura.height;
        const luz = abertura.dintel.span;
        
        // Buscar diseño estructural específico si existe
        const disenoEstructural = projectResult.structural?.disenosDintel.find(d => d.aberturaId === abertura.id);
        const estrategia = disenoEstructural?.candidatoSeleccionado?.estrategia || abertura.dintel.strategy;

        if (estrategia === 'dintel_compuesto') {
            objects.push(...buildCompoundHeaderMeshes(abertura, panel, tWall, luz, yTop));
        } else if (estrategia === 'dintel_reticulado') {
            const modelo = disenoEstructural?.candidatoSeleccionado?.metadata?.modelo || {};
            objects.push(...buildTrussedHeaderMeshes(abertura, panel, tWall, luz, yTop, modelo));
        } else if (estrategia === 'dintel_tubular') {
            objects.push(...buildTubularHeaderMeshes(abertura, panel, tWall, luz, yTop));
        } else if (estrategia === 'requiere_viga_estructural_externa') {
            objects.push(buildExternalBeamMarker(abertura, panel, tWall, luz, yTop));
        } else {
            // Dintel Simple (Default)
            const pos = applyTransform(
              panel.offset + abertura.position + (luz / 2),
              yTop + 0.1, 
              0,
              tWall
            );
            objects.push({
              id: `render_header_${abertura.id}`,
              type: 'dintel',
              sourceId: abertura.id,
              position: pos,
              rotation: { x: 0, y: tWall.rotY, z: 0 },
              dimensions: { x: luz, y: 0.2, z: RENDER_CONFIG.depth },
              material: RENDER_CONFIG.materials.header.id,
              layer: 'layer_dinteles',
              visible: true,
              metadata: { 
                ['Etiqueta']: crearEtiquetaDintel(luz),
                ['Estrategia']: 'Dintel Simple',
                ['Luz']: luz,
                [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
                [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId)
              }
            });
        }
      }
    }
  }

  return objects;
}

function buildExternalBeamMarker(abertura: any, panel: any, tWall: any, luz: number, yTop: number): RenderObject {
    const pos = applyTransform(
        panel.offset + abertura.position + (luz / 2),
        yTop + 0.3,
        0,
        tWall
    );

    return {
        id: `render_external_beam_req_${abertura.id}`,
        type: 'marcador_viga_externa',
        sourceId: abertura.id,
        position: pos,
        rotation: { x: 0, y: tWall.rotY, z: 0 },
        dimensions: { x: luz * 1.1, y: 0.4, z: 0.4 },
        material: 'mat_external_beam_warning',
        layer: 'layer_estructural_overlays',
        visible: true,
        metadata: {
            ['Aviso']: 'REQUIERE VIGA ESTRUCTURAL EXTERNA',
            ['Nota']: 'El diseño excede las capacidades del sistema Steel Frame estándar.',
            ['Revisión Requerida']: 'SÍ'
        }
    };
}
