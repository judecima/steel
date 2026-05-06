'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ModeTabs from '@/components/ModeTabs';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { Maximize2, RefreshCw } from 'lucide-react';

export default function ViewerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [mode, setMode] = useState('estandar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    ApiClient.getProject(id)
      .then(p => {
        setProject(p);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Enviar postMessage al iframe del QA Viewer
      iframeRef.current.contentWindow.postMessage({ type: 'CHANGE_MODE', mode: newMode }, '*');
    }
  };

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

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
          {/* 
            Embebemos el QA Viewer existente. 
            Como estamos en /proyectos/[id]/viewer, la ruta absoluta al viewer es /ui/product/viewer.html
          */}
          <iframe 
            ref={iframeRef}
            src={`/ui/product/viewer.html?id=${id}&mode=${mode}`}
            className="viewer-iframe"
            title="QA Viewer"
          />
        </div>
      </main>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}
