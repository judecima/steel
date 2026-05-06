import { ProjectResult } from '../../core/types';
import { 
    RenderSceneDTO, 
    RenderSceneIndustrialDTO, 
    ModoVisualizacion,
    ModeData
} from './types';
import { buildWallMeshes } from './wall-mesh-builder';
import { buildPanelMeshes } from './panel-mesh-builder';
import { buildStudMeshes } from './stud-mesh-builder';
import { buildOpeningMeshes } from './opening-mesh-builder';
import { buildHeaderMeshes } from './header-mesh-builder';
import { buildRoofMeshes } from './roof-mesh-builder';
import { buildFoundationMeshes } from './foundation-builder';
import { buildAnchorMeshes } from './anchors-builder';
import { buildLabels } from './labels-builder';
import { RENDER_CONFIG } from './render-config';
import { buildStructuralOverlays } from './overlay-estructural-builder';
import { buildShopScene } from './shop-mode-builder';
import { buildPanelCutLabels } from './panel-cutlist-builder';
import { buildSequenceScene } from './sequence-builder';
import { buildInspectionOverlays } from './inspection-overlay-builder';
import { buildJointMeshes } from './joint-mesh-builder';

export class SceneBuilder {
  /**
   * Genera una escena base estándar (Legacy alias).
   */
  static buildScene(projectResult: ProjectResult): RenderSceneDTO {
      return SceneBuilder.buildBaseScene(projectResult);
  }

  /**
   * Genera una escena base estándar.
   */
  static buildBaseScene(projectResult: ProjectResult): RenderSceneDTO {
    const foundationData = buildFoundationMeshes(projectResult);
    const anchorData = buildAnchorMeshes(projectResult);
    
    const objects = [
      ...foundationData.objects,
      ...anchorData.objects,
      ...buildWallMeshes(projectResult),
      ...buildPanelMeshes(projectResult),
      ...buildStudMeshes(projectResult),
      ...buildOpeningMeshes(projectResult),
      ...buildHeaderMeshes(projectResult),
      ...buildJointMeshes(projectResult),
      ...buildRoofMeshes(projectResult).objects
    ];

    const warnings = [
      ...foundationData.warnings,
      ...anchorData.warnings
    ];

    return {
      units: 'meters',
      objects,
      labels: buildLabels(projectResult),
      layers: RENDER_CONFIG.layers,
      warnings,
      cameraPresets: RENDER_CONFIG.camera.defaultPresets,
      metadata: {
        projectId: 'steel_project_v1',
        generatedAt: new Date().toISOString(),
        totalWalls: projectResult.house.muros.length,
        totalPanels: projectResult.construction.panels.length
      }
    };
  }

  /**
   * Genera la escena industrial completa con todos los modos disponibles para cambio dinámico.
   */
  static buildIndustrialScene(
      projectResult: ProjectResult, 
      modoInicial: ModoVisualizacion = 'estandar'
  ): RenderSceneIndustrialDTO {
    const escenaBase = SceneBuilder.buildBaseScene(projectResult);
    
    return {
      escenaBase,
      modoInicial,
      modos: {
        estandar: SceneBuilder.buildModeData(projectResult, 'estandar'),
        estructural: SceneBuilder.buildModeData(projectResult, 'estructural'),
        taller: SceneBuilder.buildModeData(projectResult, 'taller'),
        montaje: SceneBuilder.buildModeData(projectResult, 'montaje'),
        inspeccion: SceneBuilder.buildModeData(projectResult, 'inspeccion')
      }
    };
  }

  private static buildModeData(projectResult: ProjectResult, modo: ModoVisualizacion): ModeData {
    const objects = [];
    const labels = [];
    const overlays: any = {};
    const metadata: any = {};

    if (modo === 'estructural') {
        const { overlays: structuralOverlays, markers } = buildStructuralOverlays(projectResult);
        overlays.estructural = structuralOverlays;
        objects.push(...markers);
    }

    if (modo === 'taller') {
        metadata.taller = buildShopScene(projectResult);
        labels.push(...buildPanelCutLabels(projectResult));
    }

    if (modo === 'montaje') {
        metadata.montaje = buildSequenceScene(projectResult);
    }

    if (modo === 'inspeccion') {
        // Para inspección necesitamos la escena base para calcular colisiones/bounding boxes si fuera necesario
        // Pero aquí solo consumimos lo ya calculado
        const dummyScene = SceneBuilder.buildBaseScene(projectResult);
        overlays.inspeccion = buildInspectionOverlays(projectResult, dummyScene);
    }

    return { objects, labels, overlays, metadata };
  }
}
