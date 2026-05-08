'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiClient, apiPost } from '@/lib/api';
import { normalizeWallId } from '../../../../../../../src/modules/validation/wall-utils';
import Sidebar from '@/components/Sidebar';
import ModeTabs from '@/components/ModeTabs';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { Maximize2, RefreshCw } from 'lucide-react';

export default function ViewerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [mode, setMode] = useState('estandar');
  const [status, setStatus] = useState<'loading' | 'ready' | 'timeout' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<any>(null);
  type ViewerPoint = {
    x: number;
    y: number;
    z: number;
  };

  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [internalWallModalOpen, setInternalWallModalOpen] = useState(false);
  const [openingDraft, setOpeningDraft] = useState<any>(null);
  const [internalWallDraft, setInternalWallDraft] = useState<any>(null);

  const [showOpeningEditModal, setShowOpeningEditModal] = useState(false);
  const [openingEditDraft, setOpeningEditDraft] = useState<any>(null);

  const [showInternalWallActionModal, setShowInternalWallActionModal] = useState(false);
  const [internalWallActionDraft, setInternalWallActionDraft] = useState<any>(null);

  useEffect(() => {
    console.log('[VIEWER] projectId', id);
    loadProject();
    
    // Timeout de 8s para el visualizador
    timeoutRef.current = setTimeout(() => {
      setStatus(current => {
        if (current === 'loading') {
          console.warn('[VIEWER] Timeout reached (8s)');
          return 'timeout';
        }
        return current;
      });
    }, 8000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await ApiClient.getProject(id);
      setProject(data);
      // No seteamos status a ready aquí, esperamos al iframe onLoad
    } catch (e: any) {
      console.error('[VIEWER] Error loading project:', e);
      setError(e.message);
      setStatus('error');
    }
  };

  const handleIframeLoad = () => {
    console.log('[VIEWER] Iframe loaded successfully');
    setStatus('ready');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleIframeError = () => {
    console.error('[VIEWER] Iframe load error');
    setError('No se pudo cargar el visualizador');
    setStatus('error');
  };

  useEffect(() => {
    function handleViewerMessage(event: MessageEvent) {
      const data = event.data;

      if (!data || typeof data.type !== "string") return;

      console.log("[VIEWER_PAGE] message", data);

      switch (data.type) {
        case "VIEWER_EXTERNAL_WALL_DBLCLICK":
          setOpeningDraft({
            wallId: data.wallId,
            point: data.point,
            wallLocalPosition: data.wallLocalPosition,
            displayWallName: data.displayWallName,
            tipo: "ventana",
            ancho: 1.2,
            alto: 1.2,
            antepecho: 0.9,
          });
          setOpeningModalOpen(true);
          break;

        case "VIEWER_FLOOR_DBLCLICK":
          setInternalWallDraft({
            startPoint: data.point,
            length: 2.4,
            orientation: "x",
            height: project?.configuracion?.alturaMuro ?? 2.6,
            thickness: 0.1,
          });
          setInternalWallModalOpen(true);
          break;

        case "VIEWER_OPENING_DBLCLICK":
          setOpeningEditDraft({
            openingId: data.openingId,
            wallId: data.wallId,
            metadata: data.metadata || {}
          });
          setShowOpeningEditModal(true);
          break;

        case "VIEWER_INTERNAL_WALL_DBLCLICK":
          setInternalWallActionDraft({
            internalWallId: data.internalWallId,
            point: data.point,
          });
          setShowInternalWallActionModal(true);
          break;

        default:
          return;
      }

    }

    window.addEventListener("message", handleViewerMessage);
    return () => window.removeEventListener("message", handleViewerMessage);
  }, [project]);

  async function saveOpening() {
    if (!openingDraft) return;

    try {
      setStatus('loading');
      const payload = {
        wallId: openingDraft.wallId,
        tipo: openingDraft.tipo,
        ancho: Number(openingDraft.ancho),
        alto: Number(openingDraft.alto),
        antepecho: openingDraft.tipo === "puerta" ? 0 : Number(openingDraft.antepecho),
        posicion: calculateOpeningPosition(openingDraft),
      };

      const response = await apiPost<any>(`/api/proyectos/${id}/aberturas`, payload);

      if (response?.ok === false) {
        throw new Error(`${response.code}: ${response.message}`);
      }

      setOpeningModalOpen(false);
      setOpeningDraft(null);
      await reloadProjectAndViewer();
      setStatus('ready');
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
      setStatus('ready');
    }
  }

  async function saveInternalWall() {
    if (!internalWallDraft?.startPoint) return;

    try {
      setStatus('loading');
      const start = internalWallDraft.startPoint as ViewerPoint;
      const length = Number(internalWallDraft.length ?? 2.4);
      const orientation = internalWallDraft.orientation ?? "x";

      const endX = orientation === "x" ? start.x + length : start.x;
      const endZ = orientation === "z" ? start.z + length : start.z;

      const payload = {
        startX: start.x,
        startZ: start.z,
        endX,
        endZ,
        height: Number(internalWallDraft.height ?? 2.6),
        thickness: Number(internalWallDraft.thickness ?? 0.1),
      };

      const response = await apiPost<any>(`/api/proyectos/${id}/internal-walls`, payload);

      if (response?.ok === false) {
        throw new Error(`${response.code}: ${response.message}`);
      }

      setInternalWallModalOpen(false);
      setInternalWallDraft(null);
      await reloadProjectAndViewer();
      setStatus('ready');
    } catch (e: any) {
      alert('Error al guardar muro: ' + e.message);
      setStatus('ready');
    }
  }

  async function reloadProjectAndViewer() {
    const updated = await ApiClient.getProject(id);
    setProject(updated);
    reloadIframe();
  }

  function calculateOpeningPosition(draft: any): number {
    const local = Number(draft?.wallLocalPosition);

    if (Number.isFinite(local)) {
      return Math.max(0.3, local);
    }

    const point = draft?.point;
    if (!point) return 1;

    if (draft.wallId === "wall_north" || draft.wallId === "wall_south") {
      return Math.max(0.3, Math.abs(Number(point.x) || 1));
    }

    if (draft.wallId === "wall_east" || draft.wallId === "wall_west") {
      return Math.max(0.3, Math.abs(Number(point.z) || 1));
    }

    return 1;
  }


  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setStatus('loading');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus(current => current === 'loading' ? 'timeout' : current);
      }, 8000);
    }
  };

  if (status === 'loading' && !project) return <LoadingState />;
  if (status === 'error') return <ErrorState message={error || 'Error desconocido'} />;
  if (!project) return <LoadingState />;

  const vActual = project.historialVersiones?.find((v: any) => v.id === project.versionActual) || project.historialVersiones?.[0];
  const isGenerated = !!vActual?.resultadoMotor;

  return (
    <div className="viewer-layout">
      <Sidebar projectId={id} />
      
      <main className="viewer-content">
        <header className="viewer-header">
          <div className="header-info">
            <h1>Visualizador 3D</h1>
            <p>{project.nombre} — Modo {mode.toUpperCase()}</p>
          </div>
          <div className="header-actions">
            <ModeTabs activeMode={mode} onModeChange={setMode} />
            <button onClick={reloadIframe} className="btn-icon" title="Recargar">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <div className="iframe-container">
          {isGenerated ? (
            <>
              {status === 'timeout' && (
                <div className="viewer-notification timeout">
                  El visualizador no respondió. Revise la generación del proyecto.
                </div>
              )}
              <iframe 
                ref={iframeRef}
                src={`/qa-viewer/index.html?id=${id}&mode=${mode}`}
                className="viewer-iframe"
                title="QA Viewer"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </>
          ) : (
            <div className="viewer-overlay">
              <div className="overlay-msg">
                <h2>Proyecto no generado</h2>
                <p>Debe generar el proyecto desde la pantalla de detalle para habilitar el visualizador 3D.</p>
                <a href={`/proyectos/${id}`} className="btn-go-back">Volver al Detalle</a>
              </div>
            </div>
          )}
        </div>

        {openingModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Insertar Abertura</h3>
              <p>Muro: {openingDraft?.displayWallName || openingDraft?.wallId}</p>
              
              <div className="form-group">
                <label>Tipo</label>
                <select 
                  value={openingDraft.tipo} 
                  onChange={e => setOpeningDraft({...openingDraft, tipo: e.target.value as any, antepecho: e.target.value === 'puerta' ? 0 : 0.9})}
                >
                  <option value="ventana">Ventana</option>
                  <option value="puerta">Puerta</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ancho (m)</label>
                  <input type="number" step="0.1" value={openingDraft.ancho} onChange={e => setOpeningDraft({...openingDraft, ancho: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Alto (m)</label>
                  <input type="number" step="0.1" value={openingDraft.alto} onChange={e => setOpeningDraft({...openingDraft, alto: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="form-row">
                {openingDraft.tipo === 'ventana' && (
                  <div className="form-group">
                    <label>Antepecho (m)</label>
                    <input type="number" step="0.1" value={openingDraft.antepecho} onChange={e => setOpeningDraft({...openingDraft, antepecho: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setOpeningModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveOpening}>Guardar Abertura</button>
              </div>
            </div>
          </div>
        )}

        {internalWallModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Agregar Pared Interna</h3>
              
              <div className="form-group">
                <label>Orientación</label>
                <select 
                  value={internalWallDraft.orientation} 
                  onChange={e => setInternalWallDraft({...internalWallDraft, orientation: e.target.value})}
                >
                  <option value="x">Horizontal (Eje X)</option>
                  <option value="z">Vertical (Eje Z)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Largo (m)</label>
                  <input type="number" step="0.1" value={internalWallDraft.length} onChange={e => setInternalWallDraft({...internalWallDraft, length: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Altura (m)</label>
                  <input type="number" step="0.1" value={internalWallDraft.height} onChange={e => setInternalWallDraft({...internalWallDraft, height: parseFloat(e.target.value)})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Espesor (m)</label>
                <input type="number" step="0.01" value={internalWallDraft.thickness} onChange={e => setInternalWallDraft({...internalWallDraft, thickness: parseFloat(e.target.value)})} />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setInternalWallModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveInternalWall}>Guardar Pared</button>
              </div>
            </div>
          </div>
        )}

        {showOpeningEditModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Editar Abertura</h3>
                    <p>ID: {openingEditDraft?.openingId}</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowOpeningEditModal(false)}>Cerrar</button>
                        <button className="btn-primary" disabled>Próximamente: Editar</button>
                    </div>
                </div>
            </div>
        )}

        {showInternalWallActionModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Acción Pared Interna</h3>
                    <p>ID: {internalWallActionDraft?.internalWallId}</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowInternalWallActionModal(false)}>Cerrar</button>
                        <button className="btn-primary" disabled>Próximamente: Acciones</button>
                    </div>
                </div>
            </div>
        )}
      </main>

      <style jsx>{`
        .viewer-notification {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .viewer-notification.timeout {
          background: rgba(255, 235, 59, 0.9);
          color: #2c2c2c;
          border: 1px solid rgba(251, 192, 45, 0.5);
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: rgba(28, 28, 30, 0.95);
          padding: 40px;
          border-radius: 24px;
          width: 440px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
          position: relative;
          overflow: hidden;
        }
        .modal-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent), #64ffda);
        }
        .modal-content h3 { 
          margin-bottom: 12px; 
          color: #fff; 
          font-size: 24px; 
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .modal-content p { 
          font-size: 14px; 
          color: rgba(255, 255, 255, 0.5); 
          margin-bottom: 32px; 
          line-height: 1.6;
        }
        .form-group { margin-bottom: 24px; }
        .form-group label { 
          display: block; 
          font-size: 11px; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.4); 
          margin-bottom: 8px; 
          font-weight: 700;
        }
        .form-group input, .form-group select { 
          width: 100%; 
          padding: 14px 18px; 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 12px; 
          color: white; 
          font-size: 16px;
          transition: all 0.2s;
          outline: none;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 4px rgba(0, 204, 255, 0.1);
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .modal-actions { 
          display: flex; 
          justify-content: flex-end; 
          gap: 16px; 
          margin-top: 40px; 
        }
        .btn-primary { 
          background: var(--accent); 
          color: white; 
          padding: 14px 28px; 
          border-radius: 12px; 
          font-weight: 700; 
          cursor: pointer; 
          border: none;
          box-shadow: 0 8px 20px rgba(0, 204, 255, 0.3);
          transition: all 0.2s;
        }
        .btn-secondary { 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          color: rgba(255, 255, 255, 0.7); 
          padding: 14px 28px; 
          border-radius: 12px; 
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary:hover { 
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 204, 255, 0.4);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .btn-primary:active { transform: translateY(0); }

        .viewer-layout {
          display: flex;
          height: calc(100vh - 64px);
        }
        .viewer-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .viewer-header {
          padding: 16px 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-info h1 {
          font-size: 18px;
          margin-bottom: 2px;
        }
        .header-info p {
          font-size: 12px;
          color: var(--muted);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-icon {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--muted);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          color: var(--text);
          border-color: var(--accent);
        }
        .iframe-container {
          flex: 1;
          position: relative;
          background: #000;
        }
        .viewer-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .viewer-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.9);
          color: white;
          text-align: center;
          padding: 40px;
        }
        .overlay-msg h2 {
          font-size: 24px;
          margin-bottom: 16px;
          color: var(--accent);
        }
        .overlay-msg p {
          color: var(--muted);
          margin-bottom: 32px;
          max-width: 400px;
        }
        .btn-go-back {
          display: inline-block;
          padding: 12px 32px;
          background: var(--accent);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-go-back:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </div>
  );
}
