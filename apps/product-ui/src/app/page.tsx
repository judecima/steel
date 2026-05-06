import React from 'react';
import { ApiClient } from '@/lib/api';
import ApiStatusBadge from '@/components/ApiStatusBadge';
import Link from 'next/link';
import { PlusCircle, List, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  let projectCount = 0;
  try {
    const projects = await ApiClient.getProjects();
    projectCount = projects.length;
  } catch (e) {
    // API might be down, handled by component or error state
  }

  return (
    <main className="dashboard-container animate-fade">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Bienvenido al Panel de Control</h1>
          <p>Gestión integral de ingeniería y producción Steel Frame.</p>
        </div>
        <ApiStatusBadge />
      </section>

      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="card-header">
            <List className="icon" />
            <h3>Proyectos Activos</h3>
          </div>
          <div className="stats-value">{projectCount}</div>
          <p className="stats-label">Proyectos sincronizados con PostgreSQL</p>
          <Link href="/proyectos" className="card-link">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="action-card primary">
          <h3>Iniciar Nuevo Proyecto</h3>
          <p>Configura los parámetros base y genera la estructura inicial en segundos.</p>
          <Link href="/proyectos/nuevo" className="btn-action">
            <PlusCircle size={18} /> Crear Proyecto
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 32px;
        }
        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }
        .welcome-content h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .welcome-content p {
          color: var(--muted);
          font-size: 16px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .stats-card, .action-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          color: var(--muted);
        }
        .icon {
          color: var(--accent);
        }
        .stats-value {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .stats-label {
          color: var(--muted);
          font-size: 14px;
          margin-bottom: 24px;
        }
        .card-link {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          font-weight: 600;
          font-size: 14px;
        }
        .action-card.primary {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
          border-color: rgba(59, 130, 246, 0.2);
        }
        .action-card h3 {
          margin-bottom: 12px;
          font-size: 20px;
        }
        .action-card p {
          color: var(--muted);
          font-size: 14px;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .btn-action {
          background: var(--accent);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
