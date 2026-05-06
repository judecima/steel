/**
 * product-notifications.js
 * Sistema de notificaciones y feedback de usuario
 */

const ProductNotifications = {
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `product-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        const container = document.getElementById('toast-container') || this.createContainer();
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('visible');
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    },

    getIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    },

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; z-index: 9999;
            display: flex; flex-direction: column; gap: 12px;
        `;
        document.body.appendChild(container);
        
        // Inject base styles for toasts if not present
        if (!document.getElementById('product-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'product-toast-styles';
            style.innerHTML = `
                .product-toast {
                    background: var(--surface); color: var(--text); padding: 12px 20px;
                    border-radius: 8px; border: 1px solid var(--border);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                    transform: translateX(120%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 250px; font-size: 14px;
                }
                .product-toast.visible { transform: translateX(0); }
                .toast-success { border-left: 4px solid var(--success); }
                .toast-error { border-left: 4px solid var(--danger); }
                .toast-warning { border-left: 4px solid var(--warning); }
                .toast-info { border-left: 4px solid var(--accent); }
                .toast-content { display: flex; align-items: center; gap: 12px; }
            `;
            document.head.appendChild(style);
        }
        return container;
    },

    showPageError(title, message, actions = []) {
        const root = document.getElementById('product-layout-root') || document.body;
        const errorHtml = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;text-align:center;padding:40px;">
                <h1 style="font-size:48px;margin-bottom:16px;">⚠️</h1>
                <h2 style="font-size:24px;margin-bottom:12px;">${title}</h2>
                <p style="color:var(--muted);margin-bottom:32px;max-width:500px;">${message}</p>
                <div style="display:flex;gap:16px;">
                    ${actions.map(a => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" onclick="${a.onClick}">${a.text}</button>`).join('')}
                </div>
            </div>
        `;
        root.innerHTML = errorHtml;
    }
};

window.ProductNotifications = ProductNotifications;
