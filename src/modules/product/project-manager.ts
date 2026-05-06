import { ProyectoDTO, VersionProyectoDTO, EstadoProyecto, ConfiguracionProyectoDTO } from './types';
import { ProjectStorage } from './project-storage';

let _idCounter = Date.now();
function generateId(prefix: string): string {
    return `${prefix}_${_idCounter++}`;
}

export class ProjectManager {
    constructor(private storage: ProjectStorage) {}

    async crear(nombre: string, cliente: string, config: ConfiguracionProyectoDTO): Promise<ProyectoDTO> {
        const versionId = generateId('v');
        const now = new Date().toISOString();
        const primeraVersion: VersionProyectoDTO = {
            id: versionId,
            fecha: now,
            configuracion: config,
            nota: 'Versión inicial'
        };
        const proyecto: ProyectoDTO = {
            id: generateId('proj'),
            nombre,
            cliente,
            fechaCreacion: now,
            fechaActualizacion: now,
            estado: EstadoProyecto.BORRADOR,
            versionActual: versionId,
            historialVersiones: [primeraVersion]
        };
        await this.storage.saveProject(proyecto);
        return proyecto;
    }

    async guardar(proyecto: ProyectoDTO): Promise<void> {
        proyecto.fechaActualizacion = new Date().toISOString();
        await this.storage.saveProject(proyecto);
    }

    async duplicar(id: string, nuevoNombre: string): Promise<ProyectoDTO> {
        const original = await this.storage.getProject(id);
        if (!original) throw new Error(`Proyecto ${id} no encontrado`);
        const now = new Date().toISOString();
        const versionActual = original.historialVersiones.find(v => v.id === original.versionActual)!;
        const nuevaVersion: VersionProyectoDTO = {
            id: generateId('v'),
            fecha: now,
            configuracion: { ...versionActual.configuracion },
            nota: `Duplicado desde ${original.nombre}`
        };
        const copia: ProyectoDTO = {
            ...original,
            id: generateId('proj'),
            nombre: nuevoNombre,
            fechaCreacion: now,
            fechaActualizacion: now,
            estado: EstadoProyecto.BORRADOR,
            versionActual: nuevaVersion.id,
            historialVersiones: [nuevaVersion]
        };
        await this.storage.saveProject(copia);
        return copia;
    }

    /**
     * Marca el proyecto como "requiere regeneración" sin ejecutarla.
     * La regeneración efectiva debe ser disparada explícitamente por el usuario.
     */
    marcarRequiereRegeneracion(proyecto: ProyectoDTO, nuevaConfig: ConfiguracionProyectoDTO): ProyectoDTO {
        const now = new Date().toISOString();
        const versionPendiente: VersionProyectoDTO = {
            id: generateId('v_pending'),
            fecha: now,
            configuracion: nuevaConfig,
            nota: 'Pendiente de regeneración'
        };
        return {
            ...proyecto,
            fechaActualizacion: now,
            versionActual: versionPendiente.id,
            historialVersiones: [...proyecto.historialVersiones, versionPendiente]
        };
    }

    cambiarEstado(proyecto: ProyectoDTO, nuevoEstado: EstadoProyecto): ProyectoDTO {
        return {
            ...proyecto,
            estado: nuevoEstado,
            fechaActualizacion: new Date().toISOString()
        };
    }

    async listar(): Promise<ProyectoDTO[]> {
        return this.storage.listProjects();
    }

    async obtener(id: string): Promise<ProyectoDTO | null> {
        return this.storage.getProject(id);
    }

    async archivar(id: string): Promise<void> {
        const p = await this.storage.getProject(id);
        if (!p) throw new Error(`Proyecto ${id} no encontrado`);
        const archivado = this.cambiarEstado(p, EstadoProyecto.FINALIZADO);
        await this.guardar(archivado);
    }
}
