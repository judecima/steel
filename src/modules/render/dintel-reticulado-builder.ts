import { RenderObject, Vector3 } from './types';
import { RENDER_CONFIG } from './render-config';
import { applyTransform } from './transform-helper';
import { traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';

export function buildTrussedHeaderMeshes(
    abertura: any, 
    panel: any, 
    tWall: any, 
    luz: number, 
    yTop: number,
    modelo: any
): RenderObject[] {
  const objects: RenderObject[] = [];
  const altura = modelo.altura || 0.3;
  const paneles = modelo.cantidadPaneles || 4;

  // 1. Cordón Inferior
  const posInf = applyTransform(
    panel.offset + abertura.position + (luz / 2),
    yTop + 0.05,
    0,
    tWall
  );
  objects.push({
    id: `header_truss_bottom_${abertura.id}`,
    type: 'dintel',
    sourceId: abertura.id,
    position: posInf,
    rotation: { x: 0, y: tWall.rotY, z: 0 },
    dimensions: { x: luz, y: 0.1, z: RENDER_CONFIG.depth },
    material: RENDER_CONFIG.materials.header.id,
    layer: 'layer_dinteles',
    visible: true,
    metadata: { ['Rol']: 'Cordón Inferior' }
  });

  // 2. Cordón Superior
  const posSup = applyTransform(
    panel.offset + abertura.position + (luz / 2),
    yTop + altura - 0.05,
    0,
    tWall
  );
  objects.push({
    id: `header_truss_top_${abertura.id}`,
    type: 'dintel',
    sourceId: abertura.id,
    position: posSup,
    rotation: { x: 0, y: tWall.rotY, z: 0 },
    dimensions: { x: luz, y: 0.1, z: RENDER_CONFIG.depth },
    material: RENDER_CONFIG.materials.header.id,
    layer: 'layer_dinteles',
    visible: true,
    metadata: { ['Rol']: 'Cordón Superior' }
  });

  // 3. Diagonales/Montantes del Alma (Representación simplificada como paneles verticales)
  const panelWidth = luz / paneles;
  for (let i = 0; i <= paneles; i++) {
      const posAlma = applyTransform(
          panel.offset + abertura.position + (i * panelWidth),
          yTop + (altura / 2),
          0,
          tWall
      );
      objects.push({
        id: `header_truss_alma_${abertura.id}_${i}`,
        type: 'dintel',
        sourceId: abertura.id,
        position: posAlma,
        rotation: { x: 0, y: tWall.rotY, z: 0 },
        dimensions: { x: 0.05, y: altura - 0.2, z: RENDER_CONFIG.depth * 0.8 },
        material: RENDER_CONFIG.materials.header.id,
        layer: 'layer_dinteles',
        visible: true,
        metadata: { ['Rol']: 'Alma Reticulada' }
      });
  }

  return objects;
}
