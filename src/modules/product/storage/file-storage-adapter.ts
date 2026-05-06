import * as fs from 'fs';
import * as path from 'path';
import { ProyectoDTO } from '../types';
import { ProjectStorage } from './storage-adapter';

export class FileStorageAdapter implements ProjectStorage {
    private dir: string;

    constructor(dir: string) {
        this.dir = dir;
        if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    }

    async healthCheck(): Promise<boolean> {
        return fs.existsSync(this.dir);
    }

    async saveProject(project: ProyectoDTO): Promise<void> {
        fs.writeFileSync(this._filePath(project.id), JSON.stringify(project, null, 2), 'utf-8');
    }

    async getProject(id: string): Promise<ProyectoDTO | null> {
        const fp = this._filePath(id);
        if (!fs.existsSync(fp)) return null;
        return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    }

    async listProjects(): Promise<ProyectoDTO[]> {
        const files = fs.readdirSync(this.dir).filter(f => f.endsWith('.json'));
        return files.map(f => JSON.parse(fs.readFileSync(path.join(this.dir, f), 'utf-8')));
    }

    async deleteProject(id: string): Promise<void> {
        const fp = this._filePath(id);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    private _filePath(id: string): string {
        return path.join(this.dir, `${id}.json`);
    }

    cleanup(): void {
        const files = fs.readdirSync(this.dir).filter(f => f.endsWith('.json'));
        files.forEach(f => fs.unlinkSync(path.join(this.dir, f)));
        fs.rmdirSync(this.dir);
    }
}
