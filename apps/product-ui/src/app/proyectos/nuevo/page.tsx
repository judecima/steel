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
    largo: 16.0,
    ancho: 4.0,
    alto: 2.6,
    pendiente: 10,
    separacion: 0.4,
    espesor: 0.9
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
        id: 'proj_' + Date.now(),
        versionActual: 'v_1',
        historialVersiones: [{
          id: 'v_1',
          fecha: now,
          nota: 'Versión inicial',
          configuracion: {
            largoVivienda: Number(formData.largo),
            anchoVivienda: Number(formData.ancho),
            alturaMuro: Number(formData.alto),
            pendienteTecho: Number(formData.pendiente),
            separacionMontantes: Number(formData.separacion),
            espesorPerfil: Number(formData.espesor),
            tipoPerfil: 'PGC 100x0.9',
            material: 'acero_galvanizado',
            tipoCubierta: 'one_slope',
            tipoFundacion: 'losa',
            direccionCaida: 'ancho'
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
          <p>Define los datos básicos y técnicos para comenzar.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
             <h3>Datos Básicos</h3>
             <div className="form-group">
               <label htmlFor="nombre">Nombre del Proyecto</label>
               <input id="nombre" type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required disabled={loading} />
             </div>
             <div className="form-group">
               <label htmlFor="cliente">Cliente</label>
               <input id="cliente" type="text" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} required disabled={loading} />
             </div>
          </div>

          <div className="form-section">
             <h3>Configuración Paramétrica</h3>
             <div className="form-row">
                <div className="form-group">
                  <label>Largo (m)</label>
                  <input type="number" step="0.1" value={formData.largo} onChange={(e) => setFormData({...formData, largo: parseFloat(e.target.value)})} required disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Ancho (m)</label>
                  <input type="number" step="0.1" value={formData.ancho} onChange={(e) => setFormData({...formData, ancho: parseFloat(e.target.value)})} required disabled={loading} />
                </div>
             </div>
             <div className="form-row">
                <div className="form-group">
                  <label>Alto Muros (m)</label>
                  <input type="number" step="0.1" value={formData.alto} onChange={(e) => setFormData({...formData, alto: parseFloat(e.target.value)})} required disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Pendiente (°)</label>
                  <input type="number" step="1" value={formData.pendiente} onChange={(e) => setFormData({...formData, pendiente: parseFloat(e.target.value)})} required disabled={loading} />
                </div>
             </div>
             <div className="form-row">
                <div className="form-group">
                  <label>Separación (m)</label>
                  <select value={formData.separacion} onChange={(e) => setFormData({...formData, separacion: parseFloat(e.target.value)})} disabled={loading}>
                    <option value={0.4}>0.4 m</option>
                    <option value={0.6}>0.6 m</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Espesor (mm)</label>
                  <input type="number" step="0.1" value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: parseFloat(e.target.value)})} required disabled={loading} />
                </div>
             </div>
             <p className="form-hint">La caída del techo se calcula siempre hacia el ancho de la vivienda.</p>
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
        .form-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
        }
        h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 24px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-hint {
          font-size: 12px;
          color: var(--accent);
          margin-top: 8px;
          font-weight: 500;
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
        input, select {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 15px;
          transition: border-color 0.2s;
          outline: none;
        }
        input:focus, select:focus {
          border-color: var(--accent);
        }
        .form-footer {
          margin-top: 16px;
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
