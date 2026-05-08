/**
 * EXPORT CONTRACT
 * Estructura de los paquetes de exportación industrial.
 */

export interface IndustrialPackageDTO {
  projectId: string;
  generatedAt: string;
  bom: {
    items: BOMItemDTO[];
    summary: Record<string, number>;
  };
  cutList: {
    piezas: CutListPieceDTO[];
  };
  planos?: {
    packageId: string;
    files: string[];
  };
}

export interface BOMItemDTO {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  muro?: string;
  panel?: string;
}

export interface CutListPieceDTO {
  id: string;
  perfil: string;
  longitud: number;
  cantidad: number;
  panel: string;
  muro: string;
  piezaTipo: string;
  prioridadFabricacion: number;
}
