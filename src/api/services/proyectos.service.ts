import { PostgresStorageAdapter } from '../../modules/product/storage/postgres-storage-adapter';
import { ProyectoDTO, VersionProyectoDTO } from '../../modules/product/types';

const storage = new PostgresStorageAdapter();

export const ProyectosService = {
    async healthCheck() {
        return await storage.healthCheck();
    },

    async listProyectos() {
        return await storage.listProjects();
    },

    async getProyecto(id: string) {
        return await storage.getProject(id);
    },

    async createProyecto(proyecto: ProyectoDTO) {
        await storage.saveProject(proyecto);
        return proyecto;
    },

    async updateProyecto(id: string, proyecto: ProyectoDTO) {
        // Ensure ID matches
        proyecto.id = id;
        await storage.saveProject(proyecto);
        return proyecto;
    },

    async deleteProyecto(id: string) {
        await storage.deleteProject(id);
    },

    async addVersion(proyectoId: string, version: VersionProyectoDTO) {
        const proyecto = await storage.getProject(proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');
        
        proyecto.historialVersiones.push(version);
        proyecto.versionActual = version.id;
        proyecto.fechaActualizacion = new Date().toISOString();
        
        await storage.saveProject(proyecto);
        return version;
    }
};
