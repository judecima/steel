/**
 * product-api-status.js
 * Monitoreo del estado de la API y persistencia
 */

const ProductApiStatus = {
    config: {
        healthEndpoint: 'http://localhost:3001/api/health',
        checkInterval: 30000 // 30 segundos
    },

    status: {
        online: false,
        database: 'disconnected',
        mode: 'local'
    },

    async checkHealth() {
        try {
            const response = await fetch(this.config.healthEndpoint);
            const data = await response.json();
            
            this.status.online = response.ok;
            this.status.database = data.database || 'disconnected';
            this.status.mode = response.ok ? 'api' : 'local';
            
            this.updateUI();
            return this.status;
        } catch (e) {
            this.status.online = false;
            this.status.database = 'disconnected';
            this.status.mode = 'local';
            
            this.updateUI();
            return this.status;
        }
    },

    updateUI() {
        const banner = document.getElementById('api-status-banner');
        if (!banner) return;

        if (!this.status.online) {
            banner.style.display = 'block';
            banner.style.background = 'var(--warning)';
            banner.innerHTML = '⚠️ API local no disponible. Usando modo local temporal (LocalStorage).';
        } else if (this.status.database !== 'connected') {
            banner.style.display = 'block';
            banner.style.background = 'var(--danger)';
            banner.innerHTML = '❌ Error de conexión con la Base de Datos PostgreSQL.';
        } else {
            banner.style.display = 'none';
        }

        // Update dashboard badge if it exists
        const badgeText = document.getElementById('db-text');
        const badgeDot = document.getElementById('db-dot');
        if (badgeText && badgeDot) {
            if (this.status.online && this.status.database === 'connected') {
                badgeText.textContent = 'PostgreSQL: Conectado';
                badgeDot.className = 'status-dot';
            } else {
                badgeText.textContent = 'PostgreSQL: Desconectado';
                badgeDot.className = 'status-dot offline';
            }
        }
    },

    init() {
        this.checkHealth();
        setInterval(() => this.checkHealth(), this.config.checkInterval);
    }
};

window.ProductApiStatus = ProductApiStatus;
