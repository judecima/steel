/**
 * VIEWER EVENTS CONTRACT
 * Contrato para mensajes postMessage entre Viewer e Iframe.
 */

export type ViewerEventType = 
  | 'VIEWER_EXTERNAL_WALL_DBLCLICK'
  | 'VIEWER_INTERNAL_WALL_DBLCLICK'
  | 'VIEWER_OPENING_DBLCLICK'
  | 'VIEWER_FLOOR_DBLCLICK'
  | 'VIEWER_READY';

export interface ViewerEventDTO {
  type: ViewerEventType;
  wallId?: string;
  openingId?: string;
  internalWallId?: string;
  point?: { x: number; y: number; z: number };
  wallLocalPosition?: number;
  displayWallName?: string;
  metadata?: Record<string, any>;
}

export const VIEWER_EVENT_SCHEMAS = {
  EXTERNAL_WALL: {
    required: ['wallId', 'point', 'wallLocalPosition']
  }
};
