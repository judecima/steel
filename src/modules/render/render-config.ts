import { RenderMaterial, RenderLayer } from './types';

export const RENDER_CONFIG = {
  units: 'm',
  depth: 0.1, // Default depth for studs/tracks (PGC 100)
  
  layers: [
    { id: 'layer_foundation', name: 'Foundation', visibleByDefault: true, description: 'Base foundation markers' },
    { id: 'layer_walls', name: 'Walls', visibleByDefault: false, description: 'Transparent wall volumes' },
    { id: 'layer_panels', name: 'Panels', visibleByDefault: false, description: 'Panel bounding volumes' },
    { id: 'layer_framing', name: 'Framing', visibleByDefault: true, description: 'Studs and tracks' },
    { id: 'layer_openings', name: 'Openings', visibleByDefault: true, description: 'Transparent voids for doors and windows' },
    { id: 'layer_headers', name: 'Headers', visibleByDefault: true, description: 'Header markers over openings' },
    { id: 'layer_roof', name: 'Roof', visibleByDefault: true, description: 'Roof geometry' },
    { id: 'layer_anchors', name: 'Anchors', visibleByDefault: true, description: 'Foundation anchor markers' },
    { id: 'layer_labels', name: 'Labels', visibleByDefault: true, description: 'Text labels' },
    { id: 'layer_warnings', name: 'Warnings', visibleByDefault: true, description: 'Structural overlay warnings' }
  ] as RenderLayer[],

  materials: {
    wall_volume: { id: 'mat_wall', name: 'Wall Volume', color: '#00BFFF', opacity: 0.1, metalness: 0, roughness: 1 },
    panel_volume: { id: 'mat_panel', name: 'Panel Volume', color: '#32CD32', opacity: 0.1, metalness: 0, roughness: 1 },
    stud_common: { id: 'mat_stud_common', name: 'Common Stud', color: '#C0C0C0', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    stud_king: { id: 'mat_stud_king', name: 'King Stud', color: '#A9A9A9', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    stud_jack: { id: 'mat_stud_jack', name: 'Jack Stud', color: '#808080', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    track: { id: 'mat_track', name: 'Track', color: '#D3D3D3', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    opening_void: { id: 'mat_opening', name: 'Opening Void', color: '#FF6347', opacity: 0.2, metalness: 0, roughness: 1 },
    header: { id: 'mat_header', name: 'Header', color: '#FFD700', opacity: 1.0, metalness: 0.8, roughness: 0.2 },
    roof: { id: 'mat_roof', name: 'Roof', color: '#8B4513', opacity: 0.8, metalness: 0.1, roughness: 0.9 },
    warning_critical: { id: 'mat_warn_crit', name: 'Warning Critical', color: '#FF0000', opacity: 0.8, metalness: 0, roughness: 1 },
    warning_review: { id: 'mat_warn_rev', name: 'Warning Review', color: '#FFA500', opacity: 0.8, metalness: 0, roughness: 1 }
  } as Record<string, RenderMaterial>,

  camera: {
    defaultPresets: [
      { id: 'cam_iso', name: 'Isometric', position: { x: 10, y: 10, z: 10 }, target: { x: 0, y: 0, z: 0 } },
      { id: 'cam_top', name: 'Top', position: { x: 0, y: 15, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      { id: 'cam_front', name: 'Front', position: { x: 0, y: 2, z: 15 }, target: { x: 0, y: 2, z: 0 } }
    ]
  }
};
