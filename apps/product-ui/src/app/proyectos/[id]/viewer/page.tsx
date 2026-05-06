'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiClient, apiPost } from '@/lib/api';
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
  const [modalData, setModalData] = useState<any>(null);
  const [newOpening, setNewOpening] = useState({
    tipo: 'ventana',
    ancho: 1.2,
    alto: 1.0,
    antepecho: 0.9,
    posicion: 0
  });
  const [showInternalWallModal, setShowInternalWallModal] = useState(false);
  const [internalWallData, setInternalWallData] = useState({
    startX: 0,
    startZ: 0,
    endX: 0,
    endZ: 0,
    height: 2.6
  });

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
      if (event.data.type === 'VIEWER_DOUBLE_CLICK' || event.data.type === 'VIEWER_WALL_CLICK') {
        const { wallId, metadata, point } = event.data;
        if (!metadata) return;

        const dx = metadata.endX - metadata.startX;
        const dy = metadata.endY - metadata.startY;
        const len = Math.sqrt(dx*dx + dy*dy);
        
        const dpx = point.x - metadata.startX;
        const dpy = point.z - metadata.startY;
        
        let posRel = (dpx * dx + dpy * dy) / len;
        if (posRel < 0) posRel = 0;
        if (posRel > len) posRel = len;

        setModalData({ wallId, wallLength: len });
        setNewOpening(prev => ({ ...prev, posicion: Math.round(posRel * 100) / 100 }));
        setShowOpeningModal(true);
      } else if (event.data.type === 'VIEWER_OPENING_CLICK') {
        const { openingId, wallId, metadata } = event.data;
        // Lógica para editar abertura existente
        alert(`Editar abertura ${openingId} en muro ${wallId}`);
      } else if (event.data.type === 'VIEWER_FLOOR_CLICK') {
        const { point } = event.data;
        setInternalWallData({
          startX: Math.round(point.x * 10) / 10,
          startZ: Math.round(point.z * 10) / 10,
          endX: Math.round((point.x + 3) * 10) / 10,
          endZ: Math.round(point.z * 10) / 10,
          height: project?.historialVersiones?.[0]?.configuracion?.alturaMuro || 2.6
        });
        setShowInternalWallModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSaveOpening = async () => {
    try {
      setStatus('loading');
      const res: any = await apiPost(`/proyectos/${id}/aberturas`, {
        ...newOpening,
        wallId: modalData.wallId
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
      const res: any = await apiPost(`/proyectos/${id}/internal-walls`, internalWallData);
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
              <p>Muro: {modalData?.wallId}</p>
              
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
                  <small>Max: {modalData?.wallLength?.toFixed(2)}m</small>
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
      </main>

      <style jsx>{`
        .viewer-notification {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }
        .viewer-notification.timeout {
          background: #ffeb3b;
          color: #000;
          border: 1px solid #fbc02d;
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); }
          to { transform: translate(-50%, 0); }
        }
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--surface);
          padding: 32px;
          border-radius: 12px;
          width: 400px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .modal-content h3 { margin-bottom: 8px; color: var(--accent); }
        .modal-content p { font-size: 12px; color: var(--muted); margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
        .form-group input, .form-group select { 
          width: 100%; 
          padding: 10px; 
          background: var(--bg); 
          border: 1px solid var(--border); 
          border-radius: 6px; 
          color: white; 
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .btn-primary { background: var(--accent); color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; }
        .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .btn-primary:hover { background: var(--accent-hover); }

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
