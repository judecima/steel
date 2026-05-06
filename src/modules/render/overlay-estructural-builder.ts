import { ProjectResult } from '../../core/types';
import { OverlayEstructuralDTO, RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';

export function buildStructuralOverlays(projectResult: ProjectResult): { overlays: OverlayEstructuralDTO[], markers: RenderObject[] } {
  if (!projectResult.structural || !projectResult.structural.disenosDintel) {
    return { overlays: [], markers: [] };
  }

  const overlays: OverlayEstructuralDTO[] = [];
  const markers: RenderObject[] = [];

  for (const diseno of projectResult.structural.disenosDintel) {
    const aberturaId = diseno.aberturaId;
    
    // Buscar la abertura en el modelo constructivo para posicionar el marcador
    let targetAbertura = null;
    let targetPanel = null;
    for (const panel of projectResult.construction.panels) {
        const op = panel.aberturas.find(o => o.id === aberturaId);
        if (op) {
            targetAbertura = op;
            targetPanel = panel;
            break;
        }
    }

    if (!targetAbertura || !targetPanel) continue;

    const muro = projectResult.house.muros.find(w => w.id === targetPanel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    // Mapeo de color según estado
    let color = '#808080'; // Gris (insufficient_data / not_checked)
    if (diseno.estado === 'preliminary_pass') color = '#2ecc71'; // Verde
    if (diseno.estado === 'requires_engineer_review') color = '#f1c40f'; // Amarillo
    if (diseno.estado === 'preliminary_fail') color = '#e74c3c'; // Rojo

    overlays.push({
      aberturaId,
      estado: diseno.estado,
      color,
      advertencias: diseno.advertencias,
      requiereRevision: diseno.estado === 'requires_engineer_review' || diseno.estado === 'preliminary_fail'
    });

    // Marcador visual (indicador estructural sobre el dintel)
    const yPos = (targetAbertura.sillHeight || 0) + targetAbertura.height + 0.25; // 25cm sobre el dintel
    const pos = applyTransform(
        targetPanel.offset + targetAbertura.position + (targetAbertura.width / 2),
        yPos,
        0.1, // Ligeramente al frente
        tWall
    );

    markers.push({
      id: `structural_indicator_${aberturaId}`,
      type: 'indicador_estructural',
      sourceId: aberturaId,
      position: pos,
      rotation: { x: 0, y: tWall.rotY, z: 0 },
      dimensions: { x: 0.15, y: 0.15, z: 0.05 },
      material: `mat_struct_${diseno.estado}`, // Se definirá en el visor
      layer: 'layer_estructural_overlays',
      visible: true,
      metadata: {
          ['Estado']: diseno.estado,
          ['Advertencias']: diseno.advertencias.join('; '),
          ['Revisión Requerida']: diseno.estado === 'requires_engineer_review' ? 'SÍ' : 'NO'
      }
    });

    // Caso especial: Marcador de Viga Externa
    if (diseno.candidatoSeleccionado?.estrategia === 'requiere_viga_estructural_externa') {
        markers.push({
            id: `external_beam_marker_${aberturaId}`,
            type: 'marcador_viga_externa',
            sourceId: aberturaId,
            position: { ...pos, y: pos.y + 0.3 }, // Un poco más arriba que el indicador normal
            rotation: { x: 0, y: tWall.rotY, z: 0 },
            dimensions: { x: targetAbertura.width, y: 0.1, z: 0.1 },
            material: 'mat_external_beam_warning',
            layer: 'layer_estructural_overlays',
            visible: true,
            metadata: {
                ['Aviso']: 'REQUIERE VIGA ESTRUCTURAL EXTERNA',
                ['Motivo']: 'Luz excede límites de perfiles PGC estándar'
            }
        });
    }
  }

  return { overlays, markers };
}
