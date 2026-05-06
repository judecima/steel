/**
 * api-client.js
 * Cliente unificado para la API Local de Steel Frame
 */

const API_BASE = 'http://localhost:3001/api';

async function apiRequest(path, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }

        if (!response.ok) {
            const error = new Error(data.error || `Error API: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return data;
    } catch (e) {
        console.error(`[API-CLIENT ERROR] ${path}:`, e);
        throw e;
    }
}

const ApiClient = {
    async health() {
        return apiRequest('/health');
    },

    async getProyectos() {
        return apiRequest('/proyectos');
    },

    async getProyecto(id) {
        return apiRequest(`/proyectos/${id}`);
    },

    async createProyecto(proyecto) {
        return apiRequest('/proyectos', {
            method: 'POST',
            body: JSON.stringify(proyecto)
        });
    },

    async updateProyecto(id, proyecto) {
        return apiRequest(`/proyectos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(proyecto)
        });
    },

    async deleteProyecto(id) {
        return apiRequest(`/proyectos/${id}`, {
            method: 'DELETE'
        });
    },

    async addVersion(proyectoId, version) {
        return apiRequest(`/proyectos/${proyectoId}/versiones`, {
            method: 'POST',
            body: JSON.stringify(version)
        });
    }
};

// Exportar globalmente para las pantallas HTML
window.ApiClient = ApiClient;
