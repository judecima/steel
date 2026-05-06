import { RenderObject, Vector3 } from './types';
import { RENDER_CONFIG } from './render-config';
import { applyTransform } from './transform-helper';
import { crearEtiquetaDintel, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';

export function buildCompoundHeaderMeshes(
    abertura: any, 
    panel: any, 
    tWall: any, 
    luz: number, 
    yTop: number
): RenderObject[] {
  const objects: RenderObject[] = [];
  
  // Representación de perfil doble (cajón o espalda con espalda)
  // Creamos dos perfiles ligeramente desplazados en Z
  const offsetsZ = [-0.02, 0.02];
  
  offsetsZ.forEach((zOffset, index) => {
    const pos = applyTransform(
        panel.offset + abertura.position + (luz / 2),
        yTop + 0.05, // Altura del centro (perfil de 100mm)
        zOffset,
        tWall
    );

    objects.push({
      id: `render_header_compuesto_${abertura.id}_${index}`,
      type: 'dintel',
      sourceId: abertura.id,
      position: pos,
      rotation: { x: 0, y: tWall.rotY, z: 0 },
      dimensions: { x: luz, y: 0.1, z: 0.05 },
      material: RENDER_CONFIG.materials.header.id,
      layer: 'layer_dinteles',
      visible: true,
      metadata: { 
        ['Etiqueta']: `Dintel Compuesto (Pieza ${index + 1})`,
        ['Estrategia']: 'Dintel Compuesto',
        ['Luz']: luz,
        [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
        [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId)
      }
    });
  });

  return objects;
}
