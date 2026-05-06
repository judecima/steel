'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.cliente) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        nombre: formData.nombre,
        cliente: formData.cliente,
        fechaCreacion: now,
        fechaActualizacion: now,
        estado: 'borrador',
        // El backend generará el ID y la versión inicial si no se proveen,
        // o podemos enviarlos para control total
        id: 'proj_' + Date.now(),
        versionActual: 'v_1',
        historialVersiones: [{
          id: 'v_1',
          fecha: now,
          nota: 'Versión inicial',
          configuracion: {
            alturaMuro: 2.6,
            espesorPerfil: 0.9,
            separacionMontantes: 0.4,
            tipoPerfil: 'PGC 100x0.9',
            material: 'acero_galvanizado',
            tipoCubierta: 'one_slope',
            tipoFundacion: 'losa'
          }
        }]
      };

      const project = await ApiClient.createProject(payload as any);
      router.push(`/proyectos/${project.id}`);
    } catch (error) {
      alert('Error al crear el proyecto. Verifique la conexión con la API.');
      setLoading(false);
    }
  };

  return (
    <main className="form-container animate-fade">
      <Link href="/proyectos" className="back-link">
        <ArrowLeft size={16} /> Volver a proyectos
      </Link>

      <div className="card">
        <header className="card-header">
          <h1>Nuevo Proyecto</h1>
          <p>Define los datos básicos para comenzar la ingeniería.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Proyecto</label>
            <input 
              id="nombre"
              type="text" 
              placeholder="Ej: Residencia Lomas — Lote 12"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cliente">Cliente</label>
            <input 
              id="cliente"
              type="text" 
              placeholder="Nombre del cliente o razón social"
              value={formData.cliente}
              onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              required
              disabled={loading}
            />
          </div>

          <footer className="form-footer">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </footer>
        </form>
      </div>

      <style jsx>{`
        .form-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 64px 32px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 14px;
          margin-bottom: 32px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--text);
        }
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 40px;
        }
        .card-header {
          margin-bottom: 40px;
        }
        .card-header h1 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .card-header p {
          color: var(--muted);
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 24px;
        }
        label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 8px;
        }
        input {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 15px;
          transition: border-color 0.2s;
        }
        input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .form-footer {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
        .btn-save {
          background: var(--accent);
          color: white;
          padding: 12px 32px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }
        .btn-save:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
