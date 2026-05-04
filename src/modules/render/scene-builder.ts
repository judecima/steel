import { ProjectResult } from '../../core/types';
import { RenderSceneDTO, RenderObject, RenderWarning, RenderLabel } from './types';
import { RENDER_CONFIG } from './render-config';
import { buildWallMeshes } from './wall-mesh-builder';
import { buildPanelMeshes } from './panel-mesh-builder';
import { buildStudMeshes } from './stud-mesh-builder';
import { buildOpeningMeshes } from './opening-mesh-builder';
import { buildHeaderMeshes } from './header-mesh-builder';
import { buildRoofMeshes } from './roof-mesh-builder';
import { buildLabels } from './labels-builder';

export class SceneBuilder {
  static buildScene(projectResult: ProjectResult): RenderSceneDTO {
    // 1. Gather all objects
    const objects: RenderObject[] = [
      ...buildWallMeshes(projectResult),
      ...buildPanelMeshes(projectResult),
      ...buildStudMeshes(projectResult),
      ...buildOpeningMeshes(projectResult),
      ...buildHeaderMeshes(projectResult)
    ];

    const roofData = buildRoofMeshes(projectResult);
    objects.push(...roofData.objects);

    const labels: RenderLabel[] = buildLabels(projectResult);
    const warnings: RenderWarning[] = [...roofData.warnings];

    // 2. Sort deterministically (by ID)
    objects.sort((a, b) => a.id.localeCompare(b.id));
    labels.sort((a, b) => a.id.localeCompare(b.id));
    warnings.sort((a, b) => a.id.localeCompare(b.id));

    // 3. Ensure all objects have sourceId
    const missingSourceId = objects.find(o => !o.sourceId);
    if (missingSourceId) {
      throw new Error(`CRITICAL: Render object ${missingSourceId.id} is missing sourceId.`);
    }

    return {
      units: RENDER_CONFIG.units,
      objects,
      labels,
      layers: RENDER_CONFIG.layers,
      warnings,
      cameraPresets: RENDER_CONFIG.camera.defaultPresets,
      metadata: {
        projectId: 'project_' + Date.now(), // Real project ID should be passed if available
        generatedAt: new Date().toISOString(),
        units: RENDER_CONFIG.units,
        sourcePhase: 'Phase 4A',
        objectCount: objects.length,
        warningCount: warnings.length
      }
    };
  }
}
