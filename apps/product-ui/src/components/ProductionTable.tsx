'use client';

import React from 'react';
import { CheckCircle, Clock, Truck, Hammer, XCircle } from 'lucide-react';

interface Panel {
  id: string;
  nombre: string;
  largo: number;
  perfiles: number;
  estado: 'pendiente' | 'fabricacion' | 'fabricado' | 'despachado' | 'montado';
}

interface ProductionTableProps {
  panels: Panel[];
  onStatusChange: (id: string, status: string) => void;
}

export default function ProductionTable({ panels, onStatusChange }: ProductionTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente': return <Clock size={14} />;
      case 'fabricacion': return <Hammer size={14} />;
      case 'fabricado': return <CheckCircle size={14} />;
      case 'despachado': return <Truck size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'var(--muted)';
      case 'fabricacion': return 'var(--warning)';
      case 'fabricado': return 'var(--success)';
      case 'despachado': return 'var(--accent)';
      case 'montado': return '#a855f7';
      default: return 'var(--muted)';
    }
  };

  return (
    <div className="production-container">
      <table className="production-table">
        <thead>
          <tr>
            <th>ID Panel</th>
            <th>Dimensiones</th>
            <th>Perfiles</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {panels.map((panel) => (
            <tr key={panel.id}>
              <td className="panel-name">{panel.nombre}</td>
              <td className="panel-dim">{(panel.largo || 0).toFixed(2)}m</td>
              <td>{panel.perfiles}</td>
              <td>
                <div className="status-cell" style={{ color: getStatusColor(panel.estado) }}>
                  {getStatusIcon(panel.estado)}
                  <span>{panel.estado.toUpperCase()}</span>
                </div>
              </td>
              <td>
                <select 
                  value={panel.estado}
                  onChange={(e) => onStatusChange(panel.id, e.target.value)}
                  className="status-select"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="fabricacion">En Fabricación</option>
                  <option value="fabricado">Fabricado</option>
                  <option value="despachado">Despachado</option>
                  <option value="montado">Montado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .production-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .production-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th {
          background: rgba(255, 255, 255, 0.02);
          text-align: left;
          padding: 16px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
        }
        td {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        tr:last-child td {
          border-bottom: none;
        }
        .panel-name {
          font-weight: 700;
        }
        .panel-dim {
          color: var(--muted);
          font-family: monospace;
        }
        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-select {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          outline: none;
        }
        .status-select:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
