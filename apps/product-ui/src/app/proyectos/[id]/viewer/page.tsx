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
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingDraft, setOpeningDraft] = useState<any>(null);
  const [newOpening, setNewOpening] = useState({
    tipo: 'ventana',
    ancho: 1.2,
    alto: 1.0,
    antepecho: 0.9,
    posicion: 0
  });

  const [showInternalWallModal, setShowInternalWallModal] = useState(false);
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
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (event.data?.type) {
        case "VIEWER_EXTERNAL_WALL_DBLCLICK":
          // Calcular posición relativa si es posible
          setOpeningDraft({
            wallId: event.data.wallId,
            point: event.data.point,
            displayWallName: event.data.displayWallName,
            metadata: event.data.metadata
          });
          
          // Tanteo de posición relativa
          const meta = event.data.metadata;
          if (meta && meta.startX !== undefined) {
              const dx = meta.endX - meta.startX;
              const dy = meta.endZ - meta.startZ;
              const len = Math.sqrt(dx*dx + dy*dy);
              const dpx = event.data.point.x - meta.startX;
              const dpy = event.data.point.z - meta.startZ;
              let posRel = (dpx * dx + dpy * dy) / len;
              if (posRel < 0) posRel = 0;
              if (posRel > len) posRel = len;
              setNewOpening(prev => ({ ...prev, posicion: Math.round(posRel * 100) / 100 }));
          }
          
          setShowOpeningModal(true);
          break;

        case "VIEWER_INTERIOR_PANEL_DBLCLICK":
        case "VIEWER_FLOOR_DBLCLICK":
          setInternalWallDraft({
            startX: Math.round(event.data.point.x * 10) / 10,
            startZ: Math.round(event.data.point.z * 10) / 10,
            endX: Math.round((event.data.point.x + 3) * 10) / 10,
            endZ: Math.round(event.data.point.z * 10) / 10,
            height: project?.historialVersiones?.[0]?.configuracion?.alturaMuro || 2.6,
            thickness: 0.1
          });
          setShowInternalWallModal(true);
          break;

        case "VIEWER_INTERNAL_WALL_DBLCLICK":
          setInternalWallActionDraft({
            internalWallId: event.data.internalWallId,
            point: event.data.point,
          });
          setShowInternalWallActionModal(true);
          break;

        case "VIEWER_OPENING_DBLCLICK":
          setOpeningEditDraft({
            openingId: event.data.openingId,
            wallId: event.data.wallId,
            metadata: event.data.metadata
          });
          setShowOpeningEditModal(true);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSaveOpening = async () => {
    try {
      setStatus('loading');
      const canonicalWallId = normalizeWallId(openingDraft.wallId);
      
      if (!canonicalWallId || !["wall_north", "wall_south", "wall_east", "wall_west"].includes(canonicalWallId)) {
        throw new Error(`Identificador de muro no reconocido: ${openingDraft.wallId}`);
      }

      const res: any = await apiPost(`/proyectos/${id}/aberturas`, {
        ...newOpening,
        wallId: canonicalWallId
      });
      setShowOpeningModal(false);
      
      if (res.renderScene) {
          const updated = await ApiClient.getProject(id);
          setProject(updated);
          reloadIframe();
      } else {
          alert('Abertura guardada. Debe regenerar el proyecto para ver los cambios estructurales.');
      }
      
      setStatus('ready');
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
      setStatus('ready');
    }
  };

  const handleSaveInternalWall = async () => {
    try {
      setStatus('loading');
      const res: any = await apiPost(`/proyectos/${id}/internal-walls`, internalWallDraft);
      setShowInternalWallModal(false);
      
      if (res.renderScene) {
          // La API ya regeneró la escena
          const updated = await ApiClient.getProject(id);
          setProject(updated);
          reloadIframe();
      }
      
      setStatus('ready');
    } catch (e: any) {
      alert('Error al guardar muro: ' + e.message);
      setStatus('ready');
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
  };

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
            <ModeTabs activeMode={mode} onModeChange={handleModeChange} />
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

        {showOpeningModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Insertar Abertura</h3>
              <p>Muro: {openingDraft?.displayWallName || openingDraft?.wallId}</p>
              
              <div className="form-group">
                <label>Tipo</label>
                <select 
                  value={newOpening.tipo} 
                  onChange={e => setNewOpening({...newOpening, tipo: e.target.value as any, antepecho: e.target.value === 'puerta' ? 0 : 0.9})}
                >
                  <option value="ventana">Ventana</option>
                  <option value="puerta">Puerta</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ancho (m)</label>
                  <input type="number" step="0.1" value={newOpening.ancho} onChange={e => setNewOpening({...newOpening, ancho: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Alto (m)</label>
                  <input type="number" step="0.1" value={newOpening.alto} onChange={e => setNewOpening({...newOpening, alto: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Posición (m)</label>
                  <input type="number" step="0.01" value={newOpening.posicion} onChange={e => setNewOpening({...newOpening, posicion: parseFloat(e.target.value)})} />
                </div>
                {newOpening.tipo === 'ventana' && (
                  <div className="form-group">
                    <label>Antepecho (m)</label>
                    <input type="number" step="0.1" value={newOpening.antepecho} onChange={e => setNewOpening({...newOpening, antepecho: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowOpeningModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleSaveOpening}>Guardar Abertura</button>
              </div>
            </div>
          </div>
        )}

        {showInternalWallModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Agregar Pared Interna</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Inicio X</label>
                  <input type="number" step="0.1" value={internalWallDraft.startX} onChange={e => setInternalWallDraft({...internalWallDraft, startX: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Inicio Z</label>
                  <input type="number" step="0.1" value={internalWallDraft.startZ} onChange={e => setInternalWallDraft({...internalWallDraft, startZ: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fin X</label>
                  <input type="number" step="0.1" value={internalWallDraft.endX} onChange={e => setInternalWallDraft({...internalWallDraft, endX: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Fin Z</label>
                  <input type="number" step="0.1" value={internalWallDraft.endZ} onChange={e => setInternalWallDraft({...internalWallDraft, endZ: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Altura (m)</label>
                  <input type="number" step="0.1" value={internalWallDraft.height} onChange={e => setInternalWallDraft({...internalWallDraft, height: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Espesor (m)</label>
                  <input type="number" step="0.01" value={internalWallDraft.thickness} onChange={e => setInternalWallDraft({...internalWallDraft, thickness: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowInternalWallModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleSaveInternalWall}>Guardar Pared</button>
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
