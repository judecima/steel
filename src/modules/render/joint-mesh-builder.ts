import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';

export function buildJointMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const wall of projectResult.house.muros) {
    const wallPanels = projectResult.construction.panels
        .filter(p => p.wallId === wall.id)
        .sort((a, b) => a.offset - b.offset);

    if (wallPanels.length <= 1) continue;

    const tWall = getWallTransform(wall, projectResult.house);

    // Generar una junta al final de cada panel excepto el último
    for (let i = 0; i < wallPanels.length - 1; i++) {
      const panelLeft = wallPanels[i];
      const panelRight = wallPanels[i+1];
      const jointPos = panelLeft.offset + panelLeft.width;

      // Calcular altura en la junta por interpolación
      const hJoint = wall.heightStart + (wall.heightEnd - wall.heightStart) * (jointPos / wall.length);
      
      const pos = applyTransform(jointPos, hJoint / 2, 0, tWall);

      objects.push({
        id: `render_joint_${wall.id}_${i}`,
        type: 'indicador_estructural', // O uno nuevo si prefieres
        sourceId: `joint_${panelLeft.id}_${panelRight.id}`,
        position: pos,
        rotation: { x: 0, y: tWall.rotY, z: 0 },
        dimensions: { x: 0.05, y: hJoint, z: RENDER_CONFIG.depth + 0.02 },
        material: RENDER_CONFIG.materials.mat_panel_joint.id,
        layer: 'layer_panel_joints',
        visible: true,
        metadata: {
          ['Etiqueta']: 'Junta de Panel',
          ['Muro']: wall.id,
          ['Panel Izq']: panelLeft.id,
          ['Panel Der']: panelRight.id,
          ['Posición']: `${jointPos.toFixed(2)}m`
        }
      });
    }
  }

  return objects;
}
