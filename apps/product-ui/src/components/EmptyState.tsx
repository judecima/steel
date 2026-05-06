import React from 'react';
import { FileSearch } from 'lucide-react';
import Link from 'next/link';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="icon-wrapper">
        <FileSearch size={48} />
      </div>
      <h2>No hay proyectos todavía</h2>
      <p>Comienza creando tu primer proyecto de ingeniería.</p>
      <Link href="/proyectos/nuevo" className="btn-primary">
        Crear Proyecto
      </Link>

      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .icon-wrapper {
          color: var(--muted);
          margin-bottom: 24px;
          opacity: 0.5;
        }
        h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }
        p {
          color: var(--muted);
          margin-bottom: 32px;
          font-size: 15px;
        }
        .btn-primary {
          background: var(--accent);
          color: white;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </div>
  );
}
