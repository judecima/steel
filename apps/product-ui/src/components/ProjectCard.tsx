'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { formatDate, ESTADO_LABELS, getEstadoColor } from '@/lib/format';
import { Calendar, User, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/proyectos/${project.id}`} className="project-card">
      <div className="card-header">
        <div className="title-area">
          <h3>{project.nombre}</h3>
          <div className="client-info">
            <User size={12} /> {project.cliente}
          </div>
        </div>
        <div 
          className="status-badge" 
          style={{ backgroundColor: `${getEstadoColor(project.estado)}20`, color: getEstadoColor(project.estado) }}
        >
          {ESTADO_LABELS[project.estado]}
        </div>
      </div>

      <div className="card-footer">
        <div className="date-info">
          <Calendar size={12} /> {formatDate(project.fechaCreacion)}
        </div>
        <div className="view-more">
          Detalle <ChevronRight size={14} />
        </div>
      </div>

      <style jsx>{`
        .project-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: all 0.2s ease-in-out;
        }
        .project-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .title-area h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }
        .client-info {
          font-size: 13px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .date-info {
          font-size: 12px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .view-more {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 2px;
        }
      `}</style>
    </Link>
  );
}
