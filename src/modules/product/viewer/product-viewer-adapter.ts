/**
 * ProductViewerAdapter
 *
 * Adapts existing RenderSceneIndustrialDTO + viewer.js capabilities to the
 * Product UI. Does NOT implement a new Three.js runtime.
 *
 * Responsibilities:
 * - Map product viewer modes → existing DTO mode keys
 * - Communicate with the existing QA viewer iframe via postMessage
 * - Provide a clean API for product screens to use
 */
import { ModoVisorProductivo, modoHaciaDTOMode, ProductViewerState, estadoInicial } from './product-viewer-state';

export class ProductViewerAdapter {
    private state: ProductViewerState;
    private viewerIframe: HTMLIFrameElement | null = null;

    constructor() {
        this.state = estadoInicial();
    }

    /**
     * Conecta el adapter con el iframe del visor existente.
     */
    conectar(iframe: HTMLIFrameElement): void {
        this.viewerIframe = iframe;
    }

    cambiarModo(modo: ModoVisorProductivo): void {
        this.state.modoActivo = modo;
        const dtoMode = modoHaciaDTOMode(modo);
        this.enviarMensaje({ tipo: 'SET_MODE', modo: dtoMode });
    }

    seleccionarPanel(panelId: string | null): void {
        this.state.panelSeleccionado = panelId;
        this.enviarMensaje({ tipo: 'SELECCIONAR_OBJETO', id: panelId });
    }

    toggleWireframe(activo: boolean): void {
        this.state.wireframe = activo;
        this.enviarMensaje({ tipo: 'SET_WIREFRAME', activo });
    }

    obtenerEstado(): Readonly<ProductViewerState> {
        return { ...this.state };
    }

    private enviarMensaje(mensaje: Record<string, unknown>): void {
        if (!this.viewerIframe?.contentWindow) {
            console.warn('[ProductViewerAdapter] Visor no conectado. Mensaje ignorado:', mensaje);
            return;
        }
        this.viewerIframe.contentWindow.postMessage(mensaje, '*');
    }
}
