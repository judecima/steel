'use client';

import React from 'react';
import { Download, FileText, Table, FileJson, Package } from 'lucide-react';

interface ExportCardProps {
  title: string;
  description: string;
  fileType: 'csv' | 'json' | 'txt' | 'pdf' | 'package' | 'tsv';
  url: string | null;
  status: 'pendiente' | 'disponible' | 'generando' | 'error';
  warning?: string;
  onGenerate?: () => void;
}

export default function ExportCard({ title, description, fileType, url, status, warning, onGenerate }: ExportCardProps) {
  const getIcon = () => {
    switch (fileType) {
      case 'csv':
      case 'tsv': return <Table size={20} />;
      case 'json': return <FileJson size={20} />;
      case 'pdf': return <FileText size={20} />;
      case 'package': return <Package size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div className={`export-card ${status}`}>
      <div className="icon-wrapper">
        {getIcon()}
      </div>
      <div className="content">
        <h4>{title}</h4>
        <p>{description}</p>
        {warning && <p className="warning-text">{warning}</p>}
      </div>
      <div className="action">
        {status === 'disponible' && url ? (
          <a href={url} download className="btn-download">
            <Download size={16} /> Descargar
          </a>
        ) : status === 'generando' ? (
          <span className="status-label pulse">Generando...</span>
        ) : onGenerate ? (
          <button onClick={onGenerate} className="btn-generate">
            Generar
          </button>
        ) : (
          <span className="status-label muted">Pendiente</span>
        )}
      </div>

      <style jsx>{`
        .export-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.2s;
        }
        .export-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .icon-wrapper {
          width: 48px;
          height: 48px;
          background: var(--bg);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        .content {
          flex: 1;
        }
        .content h4 {
          margin-bottom: 4px;
          font-size: 15px;
        }
        .content p {
          color: var(--muted);
          font-size: 12px;
        }
        .content p.warning-text {
          color: #f59e0b;
          margin-top: 4px;
          font-weight: 500;
        }
        .btn-download, .btn-generate {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-download {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .btn-download:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .btn-generate {
          background: var(--accent);
          color: white;
          border: none;
        }
        .btn-generate:hover {
          background: var(--accent-hover);
        }
        .status-label {
          font-size: 12px;
          font-weight: 600;
        }
        .pulse {
          color: var(--warning);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
