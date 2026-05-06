import { BOMItem, BillOfMaterials, StudRole } from '../../core/types';

export type IndustrialBOMItem = BOMItem & {
    codigo: string;
    descripcion: string;
    muro?: string;
    panel?: string;
};

export type IndustrialBOMDTO = {
    items: IndustrialBOMItem[];
    resumenPorPerfil: Record<string, number>;
};

export type IndustrialCutListPiece = {
    id: string;
    perfil: string;
    longitud: number;
    cantidad: number;
    anguloInicio: number;
    anguloFin: number;
    panel: string;
    muro: string;
    prioridadFabricacion: number;
};

export type IndustrialCutListDTO = {
    piezas: IndustrialCutListPiece[];
};

export type PanelPackageDTO = {
    panelId: string;
    geometria: any; // RenderObject[] simplified
    piezas: IndustrialCutListPiece[];
    bomLocal: BillOfMaterials;
    metadata: Record<string, any>;
};

export type AssemblyStepDTO = {
    orden: number;
    titulo: string;
    descripcion: string;
    panelesInvolucrados: string[];
    advertencias: string[];
};

export type AssemblySheetDTO = {
    muroId: string;
    pasos: AssemblyStepDTO[];
};

export type IndustrialPackageDTO = {
    projectId: string;
    bom: IndustrialBOMDTO;
    cutList: IndustrialCutListDTO;
    paneles: PanelPackageDTO[];
    montaje: AssemblySheetDTO[];
    generadoEn: string;
};
