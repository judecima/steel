import { ProyectoDTO } from './types';

export interface ProjectStorage {
    saveProject(project: ProyectoDTO): Promise<void>;
    getProject(id: string): Promise<ProyectoDTO | null>;
    listProjects(): Promise<ProyectoDTO[]>;
    deleteProject(id: string): Promise<void>;
}
