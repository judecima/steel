/**
 * product-active-project.js
 * Gestión del proyecto seleccionado/activo
 */

const ProductActiveProject = {
    PROJECT_KEY: 'steel_active_project_id',

    async getActiveId() {
        // 1. Prioridad: URL param
        const params = new URLSearchParams(window.location.search);
        let id = params.get('id');

        // 2. Fallback: sessionStorage (persistencia entre pestañas de la misma sesión)
        if (!id) {
            id = sessionStorage.getItem(this.PROJECT_KEY);
        }

        // 3. Last Resort: localStorage (persistencia global)
        if (!id) {
            id = localStorage.getItem('steel_last_project_id');
        }

        if (id) {
            this.setActiveId(id);
        }

        return id;
    },

    setActiveId(id) {
        if (!id) return;
        sessionStorage.setItem(this.PROJECT_KEY, id);
        localStorage.setItem('steel_last_project_id', id);
    },

    clearActiveProject() {
        sessionStorage.removeItem(this.PROJECT_KEY);
        localStorage.removeItem('steel_last_project_id');
        console.log('[ACTIVE-PROJECT] Estado local limpiado');
    },

    async validateProject(id) {
        if (!id) return null;
        try {
            if (window.ApiClient) {
                const project = await window.ApiClient.getProyecto(id);
                return project;
            }
        } catch (e) {
            // Si es 404, el proyecto REALMENTE no existe en la base de datos
            if (e.status === 404 || String(e.message).includes('404')) {
                console.error('[ACTIVE-PROJECT] Proyecto no encontrado en API (404). Limpiando estado.');
                this.clearActiveProject();
                return null;
            }

            // Solo fallback si el error NO es un 404 (ej: API caída)
            console.warn('[ACTIVE-PROJECT] Error de conexión API, buscando en caché local');
            const projects = JSON.parse(localStorage.getItem('steel_projects_v1') || '[]');
            return projects.find(p => p.id === id) || null;
        }
        return null;
    }
};

window.ProductActiveProject = ProductActiveProject;
