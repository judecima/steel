'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ExportCard from '@/components/ExportCard';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { FileDown, RefreshCw } from 'lucide-react';

export default function ExportacionesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projData, historyData, statusRes] = await Promise.all([
        ApiClient.getProject(id),
        ApiClient.getExportHistory(id),
        ApiClient.getFilesStatus(id)
      ]);
      setProject(projData);
      setHistory(historyData);
      setFiles(statusRes.ok ? statusRes.exports : []);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const getFileStatus = (filename: string) => {
    const f = files.find(f => f.filename === filename);
    return f ? f.status : 'pendiente';
  };

  const getFileUrl = (filename: string) => {
    return `/api/exports/${id}/${filename}`;
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    let timeoutId = setTimeout(() => {
        setGenerating(false);
        alert('Tiempo agotado generando exportaciones.');
    }, 20000);

    try {
      const res = await ApiClient.generateAllExports(id);
      clearTimeout(timeoutId);
      if (res.ok) {
        await loadData();
        alert('Paquete de exportación generado con éxito.');
      } else {
        alert(`Error: ${res.message || 'Fallo en la generación'}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      alert('Error generando exportaciones: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const vActual = project?.historialVersiones?.find((v: any) => v.id === project.versionActual) || project?.historialVersiones?.[0];
  const isGenerated = !!vActual?.resultadoMotor;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="export-layout">
      <Sidebar projectId={id} />
      
      <main className="export-content animate-fade">
        <header className="export-header">
          <div className="header-info">
            <h1>Exportaciones Industriales</h1>
            <p>Descarga de activos de ingeniería y producción para {project.nombre}.</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleGenerateAll} 
              className="btn-generate-all"
              disabled={generating || !isGenerated}
              title={!isGenerated ? "Debe generar el proyecto primero" : ""}
            >
              {generating ? <RefreshCw className="animate-spin" size={18} /> : <FileDown size={18} />}
              <span>{generating ? 'Generando...' : 'Generar Paquete Completo'}</span>
            </button>
            <button onClick={loadData} className="btn-refresh" title="Actualizar">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {!isGenerated ? (
          <div className="export-overlay">
            <div className="overlay-msg">
              <h2>Proyecto no generado</h2>
              <p>Las exportaciones industriales requieren que el proyecto sea procesado por el motor geométrico primero.</p>
              <a href={`/proyectos/${id}`} className="btn-go-detail">Volver al Detalle para Generar</a>
            </div>
          </div>
        ) : (
          <>
            <section className="export-section">
              <h3>Archivos Estructurales y BOM</h3>
              <div className="export-grid">
                <ExportCard 
                  title="BOM Industrial (CSV)" 
                  description="Listado completo de materiales, perfiles y accesorios."
                  fileType="csv"
                  url={getFileUrl('BOM.csv')}
                  status={getFileStatus('BOM.csv')}
                />
                <ExportCard 
                  title="Lista de Corte (CSV)" 
                  description="Optimización de cortes por panel para taller."
                  fileType="csv"
                  url={getFileUrl('CUTLIST.csv')}
                  status={getFileStatus('CUTLIST.csv')}
                />
                <ExportCard 
                  title="Proyecto Industrial (JSON)" 
                  description="Modelo digital twin para visualizadores externos."
                  fileType="json"
                  url={getFileUrl('Proyecto.json')}
                  status={getFileStatus('Proyecto.json')}
                />
              </div>
            </section>

            <section className="export-section">
              <h3>Documentación Técnica (Fase 8A)</h3>
              <div className="export-grid">
                <ExportCard 
                  title="Planos Técnicos (PDF)" 
                  description="Paquete completo: Portada, Replanteos y Fichas de Paneles."
                  fileType="pdf"
                  url={getFileUrl('planos-tecnicos.pdf')}
                  status={getFileStatus('planos-tecnicos.pdf')}
                  warning={files.find(f => f.filename === 'planos-tecnicos.pdf')?.sizeBytes < 5000 && getFileStatus('planos-tecnicos.pdf') === 'disponible' ? "PDF generado pero posiblemente vacío" : undefined}
                />
                <ExportCard 
                  title="Package de Planos (JSON)" 
                  description="Data estructurada de todas las hojas y entidades gráficas."
                  fileType="package"
                  url={getFileUrl('planos-package.json')}
                  status={getFileStatus('planos-package.json')}
                />
              </div>
            </section>

            <section className="export-section">
              <h3>Maquinaria y Montaje</h3>
              <div className="export-grid">
                <ExportCard 
                  title="Instrucciones de Montaje (TXT)" 
                  description="Instrucciones paso a paso para armado en obra."
                  fileType="txt"
                  url={getFileUrl('Montaje.txt')}
                  status={getFileStatus('Montaje.txt')}
                />
                <ExportCard 
                  title="Reporte de Ingeniería (TSV)" 
                  description="Resumen técnico para auditoría estructural."
                  fileType="tsv"
                  url={getFileUrl('reporte.tsv')}
                  status={getFileStatus('reporte.tsv')}
                />
              </div>
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .export-layout {
          display: flex;
        }
        .export-content {
          flex: 1;
          padding: 48px 64px;
        }
        .export-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }
        .header-info h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header-info p {
          color: var(--muted);
          font-size: 14px;
        }
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .btn-generate-all {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--accent);
          color: white;
          border: none;
          padding: 0 24px;
          height: 44px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-generate-all:hover:not(:disabled) {
          background: var(--accent-hover, #3b82f6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .btn-generate-all:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-refresh {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--muted);
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-refresh:hover {
          color: var(--text);
          border-color: var(--accent);
        }
        .export-section {
          margin-bottom: 48px;
        }
        h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 24px;
        }
        .export-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }
        .export-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          text-align: center;
        }
        .overlay-msg h2 {
          font-size: 24px;
          margin-bottom: 16px;
          color: var(--accent);
        }
        .overlay-msg p {
          color: var(--muted);
          margin-bottom: 32px;
          max-width: 450px;
        }
        .btn-go-detail {
          display: inline-block;
          padding: 12px 32px;
          background: var(--accent);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-go-detail:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </div>
  );
}
