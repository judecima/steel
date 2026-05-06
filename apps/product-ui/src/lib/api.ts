import { Project, ApiHealth } from './types';

const API_BASE_URL = '/api';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store', // Always fresh data for this phase
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignorar fallo de parseo
    }
    const error = new Error((errorData as any).error || `API Error: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export const ApiClient = {
  async getHealth(): Promise<ApiHealth> {
    return apiRequest<ApiHealth>('/health');
  },

  async getProjects(): Promise<Project[]> {
    return apiRequest<Project[]>('/proyectos');
  },

  async getProject(id: string): Promise<Project> {
    return apiRequest<Project>(`/proyectos/${id}`);
  },

  async createProject(payload: Partial<Project>): Promise<Project> {
    return apiRequest<Project>('/proyectos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProject(id: string, payload: Partial<Project>): Promise<Project> {
    return apiRequest<Project>(`/proyectos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async createVersion(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/versiones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async exportPlanos(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/planos/exportar`, {
      method: 'POST',
    });
  },

  async regenerarProyecto(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/regenerar`, {
      method: 'POST',
    });
  },

  async getIndustrialExports(projectId: string): Promise<any> {
    // Note: For 9D, these are the standard secure download paths
    return {
      bom: '/api/exports/bom-industrial.csv',
      cutlist: '/api/exports/cutlist-paneles.csv',
      json: '/api/exports/proyecto-render.json',
      txt: '/api/exports/secuencia-montaje.txt',
      pdf: '/api/exports/planos-tecnicos.pdf',
      package: '/api/exports/planos-package.json'
    };
  },

  async getProduction(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/produccion`);
  },

  async updateProduction(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/produccion`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getCatalog(): Promise<any[]> {
    return apiRequest<any[]>('/costos/catalogo');
  },

  async updateCatalog(payload: any[]): Promise<any> {
    return apiRequest<any>('/costos/catalogo', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getBudget(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/presupuesto`);
  },

  async saveBudget(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/presupuesto`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getExportHistory(projectId: string): Promise<any[]> {
    return apiRequest<any[]>(`/proyectos/${projectId}/exportaciones`);
  },

  async generateAllExports(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/exportaciones/generar`, {
      method: 'POST',
    });
  },

  async getFilesStatus(): Promise<any[]> {
    return apiRequest<any[]>('/exports');
  }
};
