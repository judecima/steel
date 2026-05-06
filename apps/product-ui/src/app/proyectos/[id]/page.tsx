'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { normalizarConfiguracionParametrica } from '@/lib/parametric-config';
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
 
  useEffect(() => {
    fetchProject();
  }, [id]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.largoVivienda || formData.largoVivienda <= 0) errors.largoVivienda = 'Largo debe ser mayor a 0';
    if (!formData.anchoVivienda || formData.anchoVivienda <= 0) errors.anchoVivienda = 'Ancho debe ser mayor a 0';
    if (!formData.alturaMuro || formData.alturaMuro <= 0) errors.alturaMuro = 'Alto debe ser mayor a 0';
    if (!formData.pendienteTecho || formData.pendienteTecho < 1 || formData.pendienteTecho > 45) 
      errors.pendienteTecho = 'Ángulo debe estar entre 1° y 45°';
    if (![0.4, 0.6].includes(formData.separacionMontantes)) errors.separacionMontantes = 'Separación debe ser 0.4 o 0.6';
    if (!formData.espesorPerfil || formData.espesorPerfil <= 0) errors.espesorPerfil = 'Espesor debe ser mayor a 0';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchProject = async () => {
    try {
      const p = await ApiClient.getProject(id);
      setProject(p);
      
      if (p.repairedVersion) {
        console.warn('Proyecto reparado:', p.repairWarning);
        // Toast simple via alert para este MVP
        setTimeout(() => alert(`⚠️ Inconsistencia reparada: ${p.repairWarning}`), 500);
      }

      const v = p.historialVersiones?.find((v: any) => v.id === p.versionActual) || p.historialVersiones?.[0];
      setFormData(normalizarConfiguracionParametrica(v?.configuracion));
      setLoading(false);
    } catch (e: any) {
      setError(e.status === 404 ? 'El proyecto solicitado no existe.' : e.message);
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await ApiClient.regenerarProyecto(id);
      if (result.repairedVersion) {
        alert(`⚠️ Inconsistencia reparada durante la generación: ${result.repairWarning}`);
      }
      await fetchProject();
      alert('Proyecto generado exitosamente');
    } catch (e: any) {
      alert('Error al generar: ' + e.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!validateForm()) return;
    try {
      // Para simplificar, guardamos en la versión actual o creamos una nueva
      await ApiClient.updateProject(id, {
        ...project,
        historialVersiones: project.historialVersiones.map((v: any) => 
          v.id === project.versionActual 
            ? { ...v, configuracion: formData, resultadoMotor: null } // Limpiar resultado al editar
            : v
        )
      });
      setIsEditing(false);
      fetchProject();
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !project) {
    return <ErrorState message={error || 'No se encontró el proyecto'} />;
  }

  const vActual = project.historialVersiones?.find((v: any) => v.id === project.versionActual) || project.historialVersiones?.[0];
  const config = normalizarConfiguracionParametrica(vActual?.configuracion);
  const resultado = vActual?.resultadoMotor;

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
            <div className="card-header">
              <h3>Configuración Paramétrica</h3>
              {!isEditing ? (
                <button className="btn-small" onClick={() => setIsEditing(true)}>Editar</button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-small btn-cancel" onClick={() => setIsEditing(false)}>Cancelar</button>
                  <button className="btn-small btn-save" onClick={handleSaveConfig}>Guardar</button>
                </div>
              )}
            </div>

              <div className="config-params">
                <div className="param">
                  <span className="label">Largo de vivienda (m)</span>
                  {isEditing && formData ? (
                    <>
                      <input type="number" step="0.1" value={formData.largoVivienda || 0} onChange={e => setFormData({...formData, largoVivienda: parseFloat(e.target.value) || 0})} />
                      {formErrors.largoVivienda && <span className="error-text">{formErrors.largoVivienda}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.largoVivienda || '-'} m</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Ancho de vivienda (m)</span>
                  {isEditing && formData ? (
                    <>
                      <input type="number" step="0.1" value={formData.anchoVivienda || 0} onChange={e => setFormData({...formData, anchoVivienda: parseFloat(e.target.value) || 0})} />
                      {formErrors.anchoVivienda && <span className="error-text">{formErrors.anchoVivienda}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.anchoVivienda || '-'} m</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Alto de muros (m)</span>
                  {isEditing && formData ? (
                    <>
                      <input type="number" step="0.1" value={formData.alturaMuro || 0} onChange={e => setFormData({...formData, alturaMuro: parseFloat(e.target.value) || 0})} />
                      {formErrors.alturaMuro && <span className="error-text">{formErrors.alturaMuro}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.alturaMuro || '-'} m</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Ángulo de techo (°)</span>
                  {isEditing && formData ? (
                    <>
                      <input type="number" step="1" value={formData.pendienteTecho || 0} onChange={e => setFormData({...formData, pendienteTecho: parseFloat(e.target.value) || 0})} />
                      {formErrors.pendienteTecho && <span className="error-text">{formErrors.pendienteTecho}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.pendienteTecho || '-'}°</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Separación montantes (m)</span>
                  {isEditing && formData ? (
                    <>
                      <select value={formData.separacionMontantes} onChange={e => setFormData({...formData, separacionMontantes: parseFloat(e.target.value)})}>
                        <option value={0.4}>0.4 m</option>
                        <option value={0.6}>0.6 m</option>
                      </select>
                      {formErrors.separacionMontantes && <span className="error-text">{formErrors.separacionMontantes}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.separacionMontantes || '-'} m</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Espesor perfil (mm)</span>
                  {isEditing && formData ? (
                    <>
                      <input type="number" step="0.1" value={formData.espesorPerfil || 0} onChange={e => setFormData({...formData, espesorPerfil: parseFloat(e.target.value) || 0})} />
                      {formErrors.espesorPerfil && <span className="error-text">{formErrors.espesorPerfil}</span>}
                    </>
                  ) : (
                    <span className="value">{config?.espesorPerfil || '-'} mm</span>
                  )}
                </div>
                <div className="param">
                  <span className="label">Tipo de Cubierta</span>
                  {isEditing && formData ? (
                    <select value={formData.tipoCubierta} onChange={e => setFormData({...formData, tipoCubierta: e.target.value})}>
                      <option value="one_slope">Techo a un agua</option>
                      <option value="two_slope">Dos aguas (Gable)</option>
                    </select>
                  ) : (
                    <span className="value">{config?.tipoCubierta === 'one_slope' ? 'Techo a un agua' : 'Dos aguas (Gable)'}</span>
                  )}
                </div>
                <div className="param full-width">
                   <div className="info-box">
                      <Clock size={14} />
                      <span>Caída del techo: hacia el ancho de la vivienda</span>
                   </div>
                </div>
            </div>
          </div>

          <div className="actions-card">
            <h3>Generación Técnica</h3>
            <div className="action-buttons">
              <button 
                className={`btn-accent ${isRegenerating ? 'loading' : ''}`}
                onClick={handleRegenerate}
                disabled={isRegenerating || isEditing}
              >
                <Rocket size={16} /> 
                {isRegenerating ? 'Generando...' : 'Generar Proyecto'}
              </button>
            </div>
            
            {resultado ? (
              <div className="gen-stats animate-fade">
                <div className="stat-item">
                  <span className="stat-val">{resultado.house.muros.length}</span>
                  <span className="stat-lbl">Muros</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">{resultado.construction.panels.length}</span>
                  <span className="stat-lbl">Paneles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">{resultado.bom.aggregated.length}</span>
                  <span className="stat-lbl">Materiales</span>
                </div>
              </div>
            ) : (
              <p className="action-hint">Requiere generación para habilitar Viewer y Exportaciones.</p>
            )}
          </div>
        </section>

        <section className="history-section">
          <h3>Historial de Versiones</h3>
          <div className="version-list">
            {project.historialVersiones?.map((v: any, idx: number) => (
              <div key={v.id} className="version-item">
                <div className="version-info">
                  <span className="version-tag">V{project.historialVersiones.length - idx}</span>
                  <span className="version-date">{formatDateTime(v.fecha)}</span>
                </div>
                <div className="version-note">{v.nota}</div>
                {v.id === project.versionActual && <span className="active-mark">Activa</span>}
                {v.resultadoMotor && <span className="gen-mark">✓ Generada</span>}
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
        .actions-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .card-header h3 {
          margin-bottom: 0;
        }
        .btn-small {
          padding: 4px 12px;
          font-size: 11px;
          border-radius: 4px;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          cursor: pointer;
        }
        .edit-actions {
          display: flex;
          gap: 8px;
        }
        .btn-save {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        .btn-cancel {
          color: var(--error);
        }
        input[type="number"], select {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 4px 8px;
          border-radius: 4px;
          width: 120px;
          font-family: inherit;
          outline: none;
        }
        input[type="number"]:focus, select:focus {
          border-color: var(--accent);
        }
        .gen-stats {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-val {
          font-size: 20px;
          font-weight: 700;
          color: var(--accent);
        }
        .stat-lbl {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--muted);
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
        .error-text {
          color: var(--error);
          font-size: 10px;
          font-weight: 700;
          margin-top: 4px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .info-box {
          background: rgba(var(--accent-rgb), 0.1);
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
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
        .btn-accent:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-hint {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.4;
          text-align: center;
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
        .gen-mark {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
