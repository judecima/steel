import { RenderObject, Vector3 } from './types';
import { RENDER_CONFIG } from './render-config';
import { applyTransform } from './transform-helper';
import { traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';
import { LOCALIZACION_DOMINIO } from './localizacion-dominio';

export function buildTubularHeaderMeshes(
    abertura: any, 
    panel: any, 
    tWall: any, 
    luz: number, 
    yTop: number
): RenderObject[] {
  const objects: RenderObject[] = [];
  
  // Representación como un solo tubo grueso (ej. 100x100 o similar según metadata)
  const pos = applyTransform(
      panel.offset + abertura.position + (luz / 2),
      yTop + 0.05,
      0,
      tWall
  );

  objects.push({
    id: `render_header_tubular_${abertura.id}`,
    type: 'dintel',
    sourceId: abertura.id,
    position: pos,
    rotation: { x: 0, y: tWall.rotY, z: 0 },
    dimensions: { x: luz, y: 0.1, z: 0.1 }, // Tubo de 100x100mm
    material: RENDER_CONFIG.materials.header.id,
    layer: 'layer_dinteles',
    visible: true,
    metadata: { 
      ['Estrategia']: 'Dintel Tubular',
      ['Luz']: luz,
      [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
      [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId)
    }
  });

  return objects;
}
