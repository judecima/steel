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
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) { }
    const error = new Error((errorData as any).error || `API Error: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: 'no-store'
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.code || `API Error: ${response.status}`);
  if (data?.ok === false) throw new Error(`${data.code}: ${data.message}`);
  return data as T;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.code || `API Error: ${response.status}`);
  if (data?.ok === false) throw new Error(`${data.code}: ${data.message}`);
  return data as T;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.code || `API Error: ${response.status}`);
  if (data?.ok === false) throw new Error(`${data.code}: ${data.message}`);
  return data as T;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.code || `API Error: ${response.status}`);
  if (data?.ok === false) throw new Error(`${data.code}: ${data.message}`);
  return data as T;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "DELETE" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.code || `API Error: ${response.status}`);
  if (data?.ok === false) throw new Error(`${data.code}: ${data.message}`);
  return data as T;
}

export const ApiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,

  async getHealth(): Promise<ApiHealth> { return apiRequest<ApiHealth>('/health'); },
  async getProjects(): Promise<Project[]> { return apiRequest<Project[]>('/proyectos'); },
  async getProject(id: string): Promise<Project> { return apiRequest<Project>(`/proyectos/${id}`); },
  async createProject(payload: Partial<Project>): Promise<Project> {
    return apiRequest<Project>('/proyectos', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateProject(id: string, payload: Partial<Project>): Promise<Project> {
    return apiRequest<Project>(`/proyectos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async createVersion(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/versiones`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async exportPlanos(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/planos/exportar`, { method: 'POST' });
  },
  async regenerarProyecto(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/regenerar`, { method: 'POST' });
  },
  async getIndustrialExports(projectId: string): Promise<any> {
    return {
      bom: '/api/exports/BOM.csv',
      cutlist: '/api/exports/CUTLIST.csv',
      json: '/api/exports/Proyecto.json',
      txt: '/api/exports/Montaje.txt',
      pdf: '/api/exports/planos-tecnicos.pdf',
      package: '/api/exports/planos-package.json'
    };
  },
  async getProduction(projectId: string): Promise<any> { return apiRequest<any>(`/proyectos/${projectId}/produccion`); },
  async updateProduction(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/produccion`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async getCatalog(): Promise<any[]> { return apiRequest<any[]>('/costos/catalogo'); },
  async updateCatalog(payload: any[]): Promise<any> {
    return apiRequest<any>('/costos/catalogo', { method: 'PUT', body: JSON.stringify(payload) });
  },
  async getBudget(projectId: string): Promise<any> { return apiRequest<any>(`/proyectos/${projectId}/presupuesto`); },
  async saveBudget(projectId: string, payload: any): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/presupuesto`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async getExportHistory(projectId: string): Promise<any[]> { return apiRequest<any[]>(`/proyectos/${projectId}/exportaciones`); },
  async generateAllExports(projectId: string): Promise<any> {
    return apiRequest<any>(`/proyectos/${projectId}/exportaciones/generar`, { method: 'POST' });
  },
  async getFilesStatus(projectId: string): Promise<any> { return apiRequest<any>(`/exports?projectId=${projectId}`); }
};
