/**
 * product-layout.js
 * Inyección progresiva del layout unificado de producto
 */

const ProductLayout = {
    async init() {
        const root = document.getElementById('product-layout-root');
        if (!root) {
            console.log('[LAYOUT] No root found, skipping progressive injection');
            return;
        }

        const projectId = await window.ProductActiveProject.getActiveId();
        const project = projectId ? await window.ProductActiveProject.validateProject(projectId) : null;

        // Si teníamos un ID pero el proyecto ya no existe (fue limpiado por validateProject)
        const projectWasStale = projectId && !project;

        this.render(root, project, projectWasStale);
        
        // Start API status monitoring
        if (window.ProductApiStatus) {
            window.ProductApiStatus.init();
        }
    },

    render(root, project, projectWasStale = false) {
        const currentPath = window.location.pathname;
        const isDetail = currentPath.includes('proyecto-detalle') || currentPath.includes('viewer') || 
                         currentPath.includes('export') || currentPath.includes('presupuesto') || 
                         currentPath.includes('produccion');

        // Capture original content BEFORE replacing
        const originalContent = root.innerHTML;

        const html = `
            <div class="product-layout-shell">
                <header class="layout-header">
                    <div class="logo" onclick="window.location.href='/ui/product/index.html'" style="cursor:pointer">Steel<span>Frame</span></div>
                    <div class="header-nav">
                        <a href="${window.ProductRoutes.getProjectsUrl()}" class="${currentPath.includes('proyectos.html') ? 'active' : ''}">Proyectos</a>
                        <a href="#ayuda">Ayuda</a>
                    </div>
                    <div class="header-project-info">
                        ${project ? `
                            <div class="active-project-tag">
                                <span class="project-name">${project.nombre}</span>
                                <span class="project-id">ID: ${project.id.substring(0, 8)}...</span>
                            </div>
                        ` : ''}
                    </div>
                </header>
                <div class="layout-body">
                    ${isDetail && project ? this.renderSidebar(project, currentPath) : ''}
                    <main class="layout-content">
                        <div id="stale-project-warning" style="${projectWasStale ? 'display:block' : 'display:none'}; background:var(--error); color:#fff; padding:12px; text-align:center; font-size:14px; font-weight:600; border-radius:8px; margin-bottom:20px; border-left: 4px solid #fff;">
                            ⚠️ El proyecto activo ya no existe en PostgreSQL. Seleccione otro proyecto.
                        </div>
                        <div id="api-status-banner" style="display:none; background:var(--warning); color:#000; padding:10px; text-align:center; font-size:13px; font-weight:600; border-radius:8px; margin-bottom:20px;"></div>
                        <div id="page-content"></div>
                    </main>
                </div>
            </div>
        `;

        root.innerHTML = html;
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = originalContent;

        // Hide legacy elements within the newly moved content
        const legacyHeader = pageContent.querySelector('header');
        const legacySidebar = pageContent.querySelector('.sidebar') || pageContent.querySelector('aside');
        const legacyBreadcrumb = pageContent.querySelector('.breadcrumb');
        
        if (legacyHeader) legacyHeader.style.display = 'none';
        if (legacySidebar) legacySidebar.style.display = 'none';
        if (legacyBreadcrumb) legacyBreadcrumb.style.display = 'none';
        
        // Fix layout structure if it was a .layout container (like in detalle)
        const legacyLayout = pageContent.querySelector('.layout');
        if (legacyLayout) {
            legacyLayout.style.display = 'block'; // Undo grid
            legacyLayout.style.minHeight = 'auto';
        }

        this.injectStyles();
    },

    renderSidebar(project, currentPath) {
        const id = project.id;
        const routes = window.ProductRoutes;
        
        return `
            <aside class="layout-sidebar">
                <h2>Secciones</h2>
                <nav>
                    <a href="${routes.getProjectDetailUrl(id)}" class="${currentPath.includes('proyecto-detalle') ? 'active' : ''}">⚙️ Configuración</a>
                    <a href="${routes.getViewerUrl(id)}" class="${currentPath.includes('viewer') ? 'active' : ''}">🔭 Visualizar</a>
                    <a href="${routes.getBudgetUrl(id)}" class="${currentPath.includes('presupuesto') ? 'active' : ''}">💰 Presupuesto</a>
                    <a href="${routes.getExportsUrl(id)}" class="${currentPath.includes('export') ? 'active' : ''}">📦 Exportaciones</a>
                    <a href="${routes.getProductionUrl(id)}" class="${currentPath.includes('produccion') ? 'active' : ''}">🏗️ Producción</a>
                </nav>
            </aside>
        `;
    },

    injectStyles() {
        if (document.getElementById('product-layout-styles')) return;

        const style = document.createElement('style');
        style.id = 'product-layout-styles';
        style.innerHTML = `
            .layout-header {
                background: var(--surface); border-bottom: 1px solid var(--border);
                padding: 14px 32px; display: flex; align-items: center; justify-content: space-between;
                position: sticky; top: 0; z-index: 100;
            }
            .header-nav { display: flex; gap: 24px; margin-left: 40px; margin-right: auto; }
            .header-nav a { color: var(--muted); text-decoration: none; font-size: 14px; transition: color 0.2s; }
            .header-nav a:hover, .header-nav a.active { color: var(--text); }
            
            .header-project-info { display: flex; align-items: center; gap: 12px; }
            .active-project-tag { 
                background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
                padding: 4px 12px; border-radius: 6px; display: flex; flex-direction: column;
            }
            .active-project-tag .project-name { font-size: 12px; font-weight: 600; color: var(--accent); }
            .active-project-tag .project-id { font-size: 10px; color: var(--muted); }

            .layout-body { display: flex; min-height: calc(100vh - 60px); }
            .layout-sidebar { 
                width: 260px; background: var(--surface); border-right: 1px solid var(--border);
                padding: 24px; flex-shrink: 0;
            }
            .layout-sidebar h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 16px; }
            .layout-sidebar nav a {
                display: flex; align-items: center; gap: 10px;
                padding: 10px 12px; border-radius: 8px; margin-bottom: 4px;
                color: var(--muted); text-decoration: none; font-size: 14px; transition: all 0.2s;
            }
            .layout-sidebar nav a:hover, .layout-sidebar nav a.active { background: rgba(59,130,246,0.12); color: var(--text); }
            
            .layout-content { flex-grow: 1; padding: 0; position: relative; }
            #page-content { height: 100%; }
        `;
        document.head.appendChild(style);
    }
};

window.ProductLayout = ProductLayout;
