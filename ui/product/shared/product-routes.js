/**
 * product-routes.js
 * Centralización de rutas para la interfaz de producto
 */

const ProductRoutes = {
    RUTAS: {
        dashboard: '/ui/product/index.html',
        proyectos: '/ui/product/proyectos.html',
        detalle: '/ui/product/proyecto-detalle.html',
        viewer: '/ui/product/viewer.html',
        exportaciones: '/ui/product/exportaciones.html',
        presupuesto: '/ui/product/presupuesto.html',
        produccion: '/ui/product/produccion.html'
    },

    getDashboardUrl() { return this.RUTAS.dashboard; },
    getProjectsUrl() { return this.RUTAS.proyectos; },
    
    getProjectDetailUrl(id) { 
        if (!id) return this.RUTAS.proyectos;
        return `${this.RUTAS.detalle}?id=${encodeURIComponent(id)}`; 
    },
    
    getViewerUrl(id) { 
        if (!id) return this.RUTAS.proyectos;
        return `${this.RUTAS.viewer}?id=${encodeURIComponent(id)}`; 
    },
    
    getExportsUrl(id) { 
        if (!id) return this.RUTAS.proyectos;
        return `${this.RUTAS.exportaciones}?id=${encodeURIComponent(id)}`; 
    },
    
    getBudgetUrl(id) { 
        if (!id) return this.RUTAS.proyectos;
        return `${this.RUTAS.presupuesto}?id=${encodeURIComponent(id)}`; 
    },
    
    getProductionUrl(id) { 
        if (!id) return this.RUTAS.proyectos;
        return `${this.RUTAS.produccion}?id=${encodeURIComponent(id)}`; 
    }
};

window.ProductRoutes = ProductRoutes;
