'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { formatDateTime, ESTADO_LABELS, getEstadoColor } from '@/lib/format';
import { Calendar, User, Clock, Rocket } from 'lucide-react';

interface ProjectPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getProject(id)
      .then(p => {
        setProject(p);
        setLoading(false);
      })
      .catch(e => {
        if (e.status === 404) {
          setError('El proyecto solicitado no existe en PostgreSQL o fue eliminado.');
        } else {
          setError(e.message);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (error || !project) {
    return <ErrorState message={error || 'No se encontró el proyecto'} />;
  }

  const vActual = project.historialVersiones?.find(v => v.id === project.versionActual) || project.historialVersiones?.[0];
  const config = vActual?.configuracion;

  return (
    <div className="detail-layout">
      <Sidebar projectId={id} />
      
      <main className="detail-content animate-fade">
        <header className="detail-header">
          <div className="header-main">
            <h1>{project.nombre}</h1>
            <div className="meta-row">
              <span className="meta-item"><User size={14} /> {project.cliente}</span>
              <span className="meta-item"><Calendar size={14} /> {formatDateTime(project.fechaCreacion)}</span>
            </div>
          </div>
          <div className="header-status">
             <div 
               className="status-pill" 
               style={{ backgroundColor: `${getEstadoColor(project.estado)}20`, color: getEstadoColor(project.estado) }}
             >
               {ESTADO_LABELS[project.estado]}
             </div>
          </div>
        </header>

        <section className="config-grid">
          <div className="config-card">
            <h3>Configuración Dimensional</h3>
            <div className="config-params">
              <div className="param">
                <span className="label">Altura Muro</span>
                <span className="value">{config?.alturaMuro} m</span>
              </div>
              <div className="param">
                <span className="label">Separación Montantes</span>
                <span className="value">{config?.separacionMontantes} m</span>
              </div>
              <div className="param">
                <span className="label">Tipo de Perfil</span>
                <span className="value">{config?.tipoPerfil}</span>
              </div>
              <div className="param">
                <span className="label">Cubierta</span>
                <span className="value">{config?.tipoCubierta === 'one_slope' ? 'Un agua' : 'Dos aguas'}</span>
              </div>
            </div>
          </div>

          <div className="actions-card">
            <h3>Acciones</h3>
            <div className="action-buttons">
              <button className="btn-secondary">Cambiar Estado</button>
              <button className="btn-accent">
                <Rocket size={16} /> Regenerar (API)
              </button>
            </div>
            <p className="action-hint">La regeneración aplicará los cambios paramétricos vía motor industrial.</p>
          </div>
        </section>

        <section className="history-section">
          <h3>Historial de Versiones</h3>
          <div className="version-list">
            {project.historialVersiones?.map((v, idx) => (
              <div key={v.id} className="version-item">
                <div className="version-info">
                  <span className="version-tag">V{project.historialVersiones.length - idx}</span>
                  <span className="version-date">{formatDateTime(v.fecha)}</span>
                </div>
                <div className="version-note">{v.nota}</div>
                {v.id === project.versionActual && <span className="active-mark">Activa</span>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .detail-layout {
          display: flex;
        }
        .detail-content {
          flex: 1;
          padding: 48px 64px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }
        .header-main h1 {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .meta-row {
          display: flex;
          gap: 24px;
          color: var(--muted);
          font-size: 14px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-pill {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .config-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 48px;
        }
        .config-card, .actions-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
        }
        h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 24px;
        }
        .config-params {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .param {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .param .label {
          font-size: 12px;
          color: var(--muted);
        }
        .param .value {
          font-size: 16px;
          font-weight: 600;
        }
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .btn-secondary, .btn-accent {
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .btn-secondary:hover {
          border-color: var(--muted);
        }
        .btn-accent {
          background: var(--accent);
          color: white;
          border: none;
        }
        .btn-accent:hover {
          background: var(--accent-hover);
        }
        .action-hint {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.4;
        }
        .history-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
        }
        .version-list {
          display: flex;
          flex-direction: column;
        }
        .version-item {
          display: flex;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
          gap: 24px;
        }
        .version-item:last-child {
          border-bottom: none;
        }
        .version-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 180px;
        }
        .version-tag {
          background: var(--bg);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
        }
        .version-date {
          font-size: 13px;
          color: var(--muted);
        }
        .version-note {
          flex: 1;
          font-size: 14px;
        }
        .active-mark {
          font-size: 11px;
          font-weight: 700;
          color: var(--success);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
