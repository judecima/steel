import { RenderMaterial, RenderLayer } from './types';

export const RENDER_CONFIG = {
  units: 'm',
  depth: 0.1, // Default depth for studs/tracks (PGC 100)
  
  layers: [
    { id: 'layer_fundaciones', name: 'Fundación', visibleByDefault: true, description: 'Marcadores base de fundacion' },
    { id: 'layer_muros', name: 'Muros', visibleByDefault: false, description: 'Volumenes transparentes de muros' },
    { id: 'layer_paneles', name: 'Paneles', visibleByDefault: false, description: 'Volumenes de paneles' },
    { id: 'layer_estructura', name: 'Entramado', visibleByDefault: true, description: 'Montantes y soleras' },
    { id: 'layer_aberturas', name: 'Aberturas', visibleByDefault: true, description: 'Vacios transparentes de puertas y ventanas' },
    { id: 'layer_dinteles', name: 'Dinteles', visibleByDefault: true, description: 'Marcadores de dinteles sobre aberturas' },
    { id: 'layer_cerchas', name: 'Cerchas', visibleByDefault: true, description: 'Estructura de cerchas de techo' },
    { id: 'layer_techo', name: 'Techo', visibleByDefault: true, description: 'Geometría del techo' },
    { id: 'layer_anclajes', name: 'Anclajes', visibleByDefault: true, description: 'Marcadores de anclajes de fundacion' },
    { id: 'layer_etiquetas', name: 'Etiquetas', visibleByDefault: true, description: 'Textos y etiquetas' },
    { id: 'layer_advertencias', name: 'Advertencias', visibleByDefault: true, description: 'Advertencias estructurales' },
    { id: 'layer_panel_joints', name: 'Juntas de Paneles', visibleByDefault: true, description: 'Líneas divisorias entre paneles' },
    { id: 'layer_estructural_overlays', name: 'Overlays Estructurales', visibleByDefault: true, description: 'Indicadores de estado structural' },
    { id: 'layer_shop_labels', name: 'Etiquetas de Taller', visibleByDefault: true, description: 'IDs de piezas y longitudes' },
    { id: 'layer_inspeccion', name: 'Capa de Inspección', visibleByDefault: true, description: 'Bounding boxes y diagnósticos' },
    { id: 'layer_floor_interaction', name: 'Interacción Piso', visibleByDefault: true, description: 'Plano para detección de clics en el suelo' }

  ] as RenderLayer[],

  materials: {
    mat_foundation: { id: 'mat_foundation', name: 'Losa de Fundacion', color: '#808080', opacity: 1.0, metalness: 0.1, roughness: 0.9 },
    wall_volume: { id: 'mat_wall', name: 'Volumen de Muro', color: '#00BFFF', opacity: 0.1, metalness: 0, roughness: 1 },
    panel_volume: { id: 'mat_panel', name: 'Volumen de Panel', color: '#32CD32', opacity: 0.1, metalness: 0, roughness: 1 },
    stud_common: { id: 'mat_stud_common', name: 'Montante Común', color: '#C0C0C0', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    stud_king: { id: 'mat_stud_king', name: 'Montante Principal', color: '#A9A9A9', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    stud_jack: { id: 'mat_stud_jack', name: 'Montante de Apoyo', color: '#808080', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    stud_cripple: { id: 'mat_stud_cripple', name: 'Montante Corto', color: '#696969', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    track: { id: 'mat_track', name: 'Solera', color: '#D3D3D3', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    opening_void: { id: 'mat_opening', name: 'Vacio de Abertura', color: '#FF6347', opacity: 0.2, metalness: 0, roughness: 1 },
    header: { id: 'mat_header', name: 'Dintel', color: '#FFD700', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    roof: { id: 'mat_roof', name: 'Techo', color: '#8B4513', opacity: 0.8, metalness: 0.1, roughness: 0.9 },
    mat_panel_joint: { id: 'mat_panel_joint', name: 'Junta de Panel', color: '#FF8C00', opacity: 1.0, metalness: 0.5, roughness: 0.5 },
    warning_critical: { id: 'mat_warn_crit', name: 'Advertencia Critica', color: '#FF0000', opacity: 0.8, metalness: 0, roughness: 1 },
    warning_review: { id: 'mat_warn_rev', name: 'Requiere Revision', color: '#FFA500', opacity: 0.8, metalness: 0, roughness: 1 },
    mat_struct_preliminary_pass: { id: 'mat_struct_pass', name: 'Pase Preliminar', color: '#2ecc71', opacity: 0.9, metalness: 0.5, roughness: 0.5 },
    mat_struct_requires_engineer_review: { id: 'mat_struct_rev', name: 'Revisión Requerida', color: '#f1c40f', opacity: 0.9, metalness: 0.5, roughness: 0.5 },
    mat_struct_preliminary_fail: { id: 'mat_struct_fail', name: 'Fallo Preliminar', color: '#e74c3c', opacity: 0.9, metalness: 0.5, roughness: 0.5 },
    mat_struct_insufficient_data: { id: 'mat_struct_none', name: 'Datos Insuficientes', color: '#808080', opacity: 0.9, metalness: 0.5, roughness: 0.5 },
    mat_external_beam_warning: { id: 'mat_ext_beam', name: 'Viga Externa', color: '#8e44ad', opacity: 0.7, metalness: 0.5, roughness: 0.5 },
    mat_inspection_bbox: { id: 'mat_inspect_bbox', name: 'Caja Inspección', color: '#ffffff', opacity: 0.1, metalness: 0, roughness: 1 },
    mat_floor_interaction: { id: 'mat_floor_interaction', name: 'Interacción Piso', color: '#94a3b8', opacity: 0.08, metalness: 0, roughness: 1 }

  } as Record<string, RenderMaterial>,

  camera: {
    defaultPresets: [
      { id: 'cam_iso', name: 'Isométrica', position: { x: 10, y: 10, z: 10 }, target: { x: 0, y: 0, z: 0 } },
      { id: 'cam_top', name: 'Superior', position: { x: 0, y: 15, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      { id: 'cam_front', name: 'Frontal', position: { x: 0, y: 2, z: 15 }, target: { x: 0, y: 2, z: 0 } }
    ]
  }
};
