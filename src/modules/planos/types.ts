export type Vector2 = { x: number; y: number };

export type PlanoEntityType = 'line' | 'rect' | 'circle' | 'text' | 'path';

export interface PlanoEntityDTO {
    type: PlanoEntityType;
    color?: string;
    strokeWidth?: number;
    fill?: boolean;
    points?: Vector2[]; // For line/path
    x?: number; // For rect/circle/text
    y?: number;
    width?: number; // For rect
    height?: number;
    radius?: number; // For circle
    text?: string; // For text
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
}

export interface PlanoDimensionDTO {
    start: Vector2;
    end: Vector2;
    value: string;
    offset: number; // Distance from the entity
    color?: string;
}

export interface PlanoSymbolDTO {
    type: 'bubble' | 'level' | 'section' | 'north';
    position: Vector2;
    label?: string;
    rotation?: number;
}

export interface PlanoTableDTO {
    title?: string;
    headers: string[];
    rows: string[][];
    position: Vector2;
    width: number;
}

export interface PlanoViewportDTO {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    viewCenter: Vector2; // Engineering center
}

export interface PlanoTitleBlockDTO {
    proyecto: string;
    cliente: string;
    ubicacion: string;
    fecha: string;
    version: string;
    escala: string;
    hoja: string;
    totalHojas: string;
    disclaimer: string;
}

export interface PlanoSheetDTO {
    id: string;
    numeroHoja: number;
    codigoHoja: string; // e.g. "A01"
    titulo: string;
    subtitulo?: string;
    viewports: PlanoViewportDTO[];
    entities: PlanoEntityDTO[];
    dimensions: PlanoDimensionDTO[];
    symbols: PlanoSymbolDTO[];
    tables: PlanoTableDTO[];
    titleBlock: PlanoTitleBlockDTO;
    warnings: string[];
}

export interface PlanosPackageDTO {
    proyectoId: string;
    nombreProyecto: string;
    fechaGeneracion: string;
    hojas: PlanoSheetDTO[];
    metadata: Record<string, any>;
}
