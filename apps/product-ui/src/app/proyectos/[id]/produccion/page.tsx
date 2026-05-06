'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ProductionTable from '@/components/ProductionTable';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { Activity, AlertTriangle, Layers, CheckCircle } from 'lucide-react';

export default function ProduccionPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [panels, setPanels] = useState<any[]>([]);
  const [globalStatus, setGlobalStatus] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [p, prod] = await Promise.all([
        ApiClient.getProject(id),
        ApiClient.getProduction(id)
      ]);
      setProject(p);
      setGlobalStatus(prod.estado_global || 'pendiente');
      
      const vActual = p.historialVersiones?.find((v: any) => v.id === p.versionActual) || p.historialVersiones?.[0];
      const enginePanels = vActual?.resultadoMotor?.construction?.panels || [];

      if (enginePanels.length > 0) {
        const merged = enginePanels.map((ep: any) => {
          const saved = prod.paneles?.find((sp: any) => sp.panel_id === ep.id);
          return {
            id: ep.id,
            nombre: `Panel ${ep.id}`,
            largo: ep.width,
            perfiles: ep.studs.length,
            estado: saved ? saved.estado : 'pendiente'
          };
        });
        setPanels(merged);
      } else {
        setPanels([]);
      }
      
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const vActual = project?.historialVersiones?.find((v: any) => v.id === project.versionActual) || project?.historialVersiones?.[0];
  const isGenerated = !!vActual?.resultadoMotor;

  const handleStatusChange = async (panelId: string, newStatus: any) => {
    const updatedPanels = panels.map(p => p.id === panelId ? { ...p, estado: newStatus } : p);
    setPanels(updatedPanels);
    saveProduction(updatedPanels);
  };

  const saveProduction = async (currentPanels: any[]) => {
    setSaving(true);
    try {
      const finished = currentPanels.filter(p => ['fabricado', 'despachado', 'montado'].includes(p.estado)).length;
      const progress = currentPanels.length > 0 ? Math.round((finished / currentPanels.length) * 100) : 0;
      
      await ApiClient.updateProduction(id, {
        estado_global: progress === 100 ? 'completado' : 'en_progreso',
        avance_porcentaje: progress,
        paneles: currentPanels.map(p => ({ panel_id: p.id, estado: p.estado }))
      });
    } catch (e) {
      console.error('Error guardando producción', e);
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    if (panels.length === 0) return 0;
    const finished = panels.filter(p => ['fabricado', 'despachado', 'montado'].includes(p.estado)).length;
    return Math.round((finished / panels.length) * 100);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  if (!isGenerated) {
    return (
      <div className="prod-layout">
        <Sidebar projectId={id} />
        <main className="prod-content">
           <div className="empty-state-overlay">
              <h2>Producción no disponible</h2>
              <p>El seguimiento de producción requiere un listado real de paneles generado por el motor.</p>
              <a href={`/proyectos/${id}`} className="btn-primary">Ir a Generar Proyecto</a>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="prod-layout">
      <Sidebar projectId={id} />
      
      <main className="prod-content animate-fade">
        <header className="prod-header">
          <div className="header-info">
            <h1>Seguimiento de Producción</h1>
            <p>Control de fabricación y montaje por panel para {project.nombre}.</p>
          </div>
          <div className="progress-card">
            <div className="progress-info">
              <span className="label">Progreso de Obra</span>
              <span className="value">{getProgress()}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${getProgress()}%` }} />
            </div>
          </div>
        </header>

        <section className="notice-section">
          <div className="notice-card success">
            <CheckCircle size={20} className="icon-ok" />
            <div className="notice-text">
              <h4>Control de Producción Persistente</h4>
              <p>Los cambios se guardan automáticamente en PostgreSQL. {saving ? 'Sincronizando...' : 'Datos sincronizados.'}</p>
            </div>
          </div>
        </section>

        <section className="table-section">
          <div className="section-header">
            <div className="title-with-icon">
              <Layers size={18} />
              <h3>Paneles de Estructura</h3>
            </div>
            <span className="panel-count">{panels.length} ítems en listado</span>
          </div>
          
          <ProductionTable panels={panels} onStatusChange={handleStatusChange} />
        </section>

        <section className="stats-row">
          <div className="stat-mini">
            <span className="val">{panels.filter(p => p.estado === 'pendiente').length}</span>
            <span className="lab">Pendientes</span>
          </div>
          <div className="stat-mini">
            <span className="val">{panels.filter(p => p.estado === 'fabricacion' || p.estado === 'en_fabricacion').length}</span>
            <span className="lab">En Taller</span>
          </div>
          <div className="stat-mini">
            <span className="val">{panels.filter(p => p.estado === 'fabricado').length}</span>
            <span className="lab">Fabricados</span>
          </div>
        </section>
      </main>

      <style jsx>{`
        .prod-layout {
          display: flex;
        }
        .prod-content {
          flex: 1;
          padding: 48px 64px;
        }
        .empty-state-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          text-align: center;
        }
        .empty-state-overlay h2 {
          font-size: 24px;
          margin-bottom: 16px;
          color: var(--accent);
        }
        .empty-state-overlay p {
          color: var(--muted);
          margin-bottom: 32px;
          max-width: 400px;
        }
        .prod-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .header-info h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header-info p {
          color: var(--muted);
          font-size: 14px;
        }
        .progress-card {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 16px 24px;
          border-radius: 12px;
          width: 240px;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 12px;
        }
        .progress-info .label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 700;
        }
        .progress-info .value {
          font-size: 20px;
          font-weight: 800;
          color: var(--accent);
        }
        .progress-bar-bg {
          height: 6px;
          background: var(--bg);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.4s ease-out;
        }
        .notice-section {
          margin-bottom: 32px;
        }
        .notice-card {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 16px 24px;
          border-radius: 12px;
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .icon-warn { color: var(--warning); }
        .notice-text h4 { font-size: 14px; margin-bottom: 2px; }
        .notice-text p { font-size: 13px; color: var(--muted); }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--muted);
        }
        h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text);
        }
        .panel-count {
          font-size: 12px;
          color: var(--muted);
        }
        .stats-row {
          margin-top: 32px;
          display: flex;
          gap: 24px;
        }
        .stat-mini {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 16px 24px;
          border-radius: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-mini .val { font-size: 24px; font-weight: 800; }
        .stat-mini .lab { font-size: 11px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      `}</style>
    </div>
  );
}
