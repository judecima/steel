'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-container">
      <div className="icon-wrapper">
        <AlertTriangle size={48} />
      </div>
      <h2>Ocurrió un error</h2>
      <p>{message || 'No se pudo conectar con el servidor de ingeniería.'}</p>
      
      {onRetry && (
        <button className="btn-retry" onClick={onRetry}>
          <RefreshCw size={16} /> Reintentar
        </button>
      )}

      <style jsx>{`
        .error-container {
          text-align: center;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .icon-wrapper {
          color: var(--error);
          margin-bottom: 24px;
        }
        h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }
        p {
          color: var(--muted);
          margin-bottom: 32px;
          font-size: 15px;
          max-width: 400px;
          line-height: 1.5;
        }
        .btn-retry {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .btn-retry:hover {
          background: var(--surface-hover);
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
