import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildInspectionOverlays(projectResult: ProjectResult, sceneBase: any): RenderObject[] {
  const inspectionObjects: RenderObject[] = [];

  // 1. Generar Bounding Boxes para todos los objetos de la escena base
  sceneBase.objects.forEach((obj: RenderObject) => {
    inspectionObjects.push({
      id: `bbox_${obj.id}`,
      type: 'box_inspeccion',
      sourceId: obj.id,
      position: obj.position,
      rotation: obj.rotation,
      dimensions: {
          x: obj.dimensions.x + 0.01, // Ligeramente más grande para evitar z-fighting
          y: obj.dimensions.y + 0.01,
          z: obj.dimensions.z + 0.01
      },
      material: 'mat_inspection_bbox',
      layer: 'layer_inspeccion',
      visible: true,
      metadata: {
          ['ID Original']: obj.id,
          ['Dimensiones']: `${obj.dimensions.x.toFixed(2)}x${obj.dimensions.y.toFixed(2)}x${obj.dimensions.z.toFixed(2)}`
      }
    });
  });

  // 2. Visualizar advertencias existentes como marcadores 3D
  projectResult.warnings.forEach((warn, index) => {
      // Si la advertencia tiene posición (o la inferimos)
      inspectionObjects.push({
        id: `warn_marker_${index}`,
        type: 'advertencia',
        sourceId: `warn_${index}`,
        position: { x: 0, y: 3, z: 0 }, // Posición genérica arriba si no hay datos
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: 0.3, y: 0.3, z: 0.3 },
        material: 'mat_warning_high',
        layer: 'layer_advertencias',
        visible: true,
        metadata: {
            ['Mensaje']: warn,
            ['Severidad']: 'advertencia'
        }
      });
  });

  return inspectionObjects;
}
