import { ProyectoDTO } from './types';
import { ProjectStorage } from './project-storage';

export class LocalStorageAdapter implements ProjectStorage {
    private readonly KEY_PREFIX = 'steel_project_';
    private readonly LIST_KEY = 'steel_projects_list';

    async saveProject(project: ProyectoDTO): Promise<void> {
        localStorage.setItem(this.KEY_PREFIX + project.id, JSON.stringify(project));
        
        const list = await this.listProjects();
        if (!list.find(p => p.id === project.id)) {
            const newList = [...list, project];
            localStorage.setItem(this.LIST_KEY, JSON.stringify(newList.map(p => p.id)));
        }
    }

    async getProject(id: string): Promise<ProyectoDTO | null> {
        const data = localStorage.getItem(this.KEY_PREFIX + id);
        return data ? JSON.parse(data) : null;
    }

    async listProjects(): Promise<ProyectoDTO[]> {
        const listIdsData = localStorage.getItem(this.LIST_KEY);
        if (!listIdsData) return [];
        
        const ids: string[] = JSON.parse(listIdsData);
        const projects: ProyectoDTO[] = [];
        
        for (const id of ids) {
            const p = await this.getProject(id);
            if (p) projects.push(p);
        }
        
        return projects;
    }

    async deleteProject(id: string): Promise<void> {
        localStorage.removeItem(this.KEY_PREFIX + id);
        const list = await this.listProjects();
        const newListIds = list.filter(p => p.id !== id).map(p => p.id);
        localStorage.setItem(this.LIST_KEY, JSON.stringify(newListIds));
    }
}
