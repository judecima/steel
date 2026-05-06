'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function ProyectosPage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getProjects()
      .then(p => {
        setProjects(p);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <main className="proyectos-container animate-fade">
      <header className="page-header">
        <div className="header-text">
          <h1>Mis Proyectos</h1>
          <p>Listado completo de ingeniería en curso.</p>
        </div>
        <Link href="/proyectos/nuevo" className="btn-primary">
          <PlusCircle size={18} /> Nuevo Proyecto
        </Link>
      </header>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <style jsx>{`
        .proyectos-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 32px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }
        .header-text h1 {
          font-size: 28px;
          margin-bottom: 6px;
        }
        .header-text p {
          color: var(--muted);
          font-size: 14px;
        }
        .btn-primary {
          background: var(--accent);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: var(--accent-hover);
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
      `}</style>
    </main>
  );
}
