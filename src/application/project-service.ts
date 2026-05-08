import { PostgresStorageAdapter } from "../modules/product/storage/postgres-storage-adapter";
import { EngineFacade } from "../modules/product/engine-facade";
import { HouseInput } from "../core/types";
import { normalizarConfiguracionParametrica } from "../../apps/product-ui/src/lib/parametric-config";
import { ensureActiveVersion } from "../../apps/product-ui/src/lib/project-repair";

export interface AddOpeningPayload {
    wallId: string;
    tipo: 'ventana' | 'puerta';
    ancho: number;
    alto: number;
    posicion: number;
    antepecho: number;
}

export interface AddInternalWallPayload {
    startX: number;
    startZ: number;
    endX: number;
    endZ: number;
    height: number;
    thickness: number;
}

export class ProjectService {
    private storage = new PostgresStorageAdapter();

    async regenerateProject(projectId: string) {
        // 1. Cargar proyecto
        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");

        // 2. Asegurar versión activa y reparar si es necesario
        const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(project);
        if (wasRepaired) {
            console.warn(`[ProjectService] Proyecto ${projectId} reparado: ${warning}`);
        }

        const version = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
        if (!version) throw new Error("Versión actual no encontrada");

        // 3. Normalizar configuración
        const config = normalizarConfiguracionParametrica(version.configuracion);

        // 4. Mapear Config -> Engine Input (Single Source Mapper)
        const input = this.mapConfigToEngineInput(config);

        // 5. Llamar EngineFacade.generate
        console.log(`[ProjectService] Regenerando proyecto ${projectId}...`);
        const result = EngineFacade.generate(input);

        // [R7] Validar resultado del motor
        if (!result || !result.house || result.house.muros.length === 0) {
            throw new Error("Fallo crítico en la generación de geometría: El motor no devolvió muros.");
        }

        // 6. Persistir solo si hay resultado válido (Secuencia obligatoria)
        version.resultadoMotor = result;
        version.configuracion = config; // Guardar la versión normalizada
        
        await this.storage.saveProject(repaired);


        return {
            ok: true,
            project: repaired,
            repairedVersion: wasRepaired,
            repairWarning: warning,
            stats: {
                walls: result.house.muros.length,
                panels: result.construction.panels.length,
                bomItems: result.bom.aggregated.length
            }
        };
    }

    async addOpening(projectId: string, payload: AddOpeningPayload) {
        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");

        const { project: repaired } = ensureActiveVersion(project);
        const version = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
        if (!version) throw new Error("Versión actual no encontrada");

        // Normalizar config actual
        const config = normalizarConfiguracionParametrica(version.configuracion);

        const wallLength = this.getWallLength(payload.wallId, config);
        const wallHeight = Number(config.alturaMuro);

        if (payload.posicion < 0 || payload.posicion + payload.ancho > wallLength) {
            throw new Error(`La abertura excede el largo del muro (${wallLength}m)`);
        }

        if (payload.antepecho + payload.alto > wallHeight) {
            throw new Error(`La abertura excede la altura del muro (${wallHeight}m)`);
        }

        // 4. Crear nextConfig (Inyectar nueva abertura)

        const newOpening = {
            id: `op-${Date.now()}`,
            ...payload
        };
        
        config.aberturas = [...(config.aberturas || []), newOpening];

        // 5. Mapear y Generar
        const input = this.mapConfigToEngineInput(config);
        const result = EngineFacade.generate(input);

        // 6. Persistir una sola vez (Atómico)
        version.resultadoMotor = result;
        version.configuracion = config;
        
        await this.storage.saveProject(repaired);

        return {
            ok: true,
            project: repaired,
            newOpeningId: newOpening.id
        };
    }

    async addInternalWall(projectId: string, payload: AddInternalWallPayload) {
        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");

        const { project: repaired } = ensureActiveVersion(project);
        const version = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
        if (!version) throw new Error("Versión actual no encontrada");

        const config = normalizarConfiguracionParametrica(version.configuracion);

        // Inyectar muro interno
        const newInternalWall = {
            id: `iw-${Date.now()}`,
            ...payload
        };
        
        config.murosInternos = [...(config.murosInternos || []), newInternalWall];

        // Mapear y Generar
        const input = this.mapConfigToEngineInput(config);
        const result = EngineFacade.generate(input);

        // Persistir
        version.resultadoMotor = result;
        version.configuracion = config;
        
        await this.storage.saveProject(repaired);

        return {
            ok: true,
            project: repaired,
            newInternalWallId: newInternalWall.id
        };
    }

    private getWallLength(wallId: string, config: any): number {
        const width = Number(config.anchoVivienda);
        const length = Number(config.largoVivienda);

        if (wallId === "wall_north" || wallId === "wall_south") return width;
        if (wallId === "wall_east" || wallId === "wall_west") return length;
        
        throw new Error(`Wall ID desconocido: ${wallId}`);
    }

    private mapConfigToEngineInput(config: any): HouseInput {

        return {
            width: config.anchoVivienda,
            length: config.largoVivienda,
            minHeight: config.alturaMuro,
            roofType: config.tipoCubierta,
            roofSlope: config.pendienteTecho,
            openings: (config.aberturas || []).map((a: any) => ({
                wallId: a.wallId,
                type: a.tipo === 'puerta' ? 'door' : 'window',
                width: a.ancho,
                height: a.alto,
                position: a.posicion,
                sillHeight: a.antepecho
            })),
            internalWalls: (config.murosInternos || []).map((w: any) => ({
                id: w.id,
                startXmm: w.startX * 1000,
                startZmm: w.startZ * 1000,
                endXmm: w.endX * 1000,
                endZmm: w.endZ * 1000,
                heightMm: w.altura * 1000,
                thicknessMm: w.espesor * 1000,
                openings: []
            }))
        };
    }
}

export const projectService = new ProjectService();
