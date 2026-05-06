import React from 'react';

export default function LoadingState() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando información...</p>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 0;
          gap: 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        p {
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
