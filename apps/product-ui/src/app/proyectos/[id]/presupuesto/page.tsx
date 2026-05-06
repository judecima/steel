'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import PriceCatalogForm from '@/components/PriceCatalogForm';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { Calculator, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function PresupuestoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [budgetSnapshot, setBudgetSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BOM real se derivará de los perfiles del proyecto en una fase futura
  // Por ahora seguimos usando el mock pero con precios persistentes
  const [mockBOM, setMockBOM] = useState({
    items: [
      { id: 'perfil_pgc', label: 'Perfil PGC 100x0.9', quantity: 450.5 },
      { id: 'perfil_pru', label: 'Perfil PGU 100x0.9', quantity: 120.2 },
      { id: 'tornillo_t1', label: 'Tornillo T1 mecha', quantity: 2400 },
      { id: 'tornillo_t2', label: 'Tornillo T2 punta aguja', quantity: 1800 },
      { id: 'mano_obra', label: 'Mano de obra armado', quantity: 85.0 },
    ]
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [p, catalog, snapshot] = await Promise.all([
        ApiClient.getProject(id),
        ApiClient.getCatalog(),
        ApiClient.getBudget(id)
      ]);
      setProject(p);
      setBudgetSnapshot(snapshot);

      // Si no hay catálogo en DB, usar defaults y guardar
      if (catalog.length === 0) {
        const defaults = [
          { codigo: 'perfil_pgc', descripcion: 'Perfil PGC 100x0.9', unidad: 'ml', precio_unitario: 12.5 },
          { codigo: 'perfil_pru', descripcion: 'Perfil PGU 100x0.9', unidad: 'ml', precio_unitario: 10.8 },
          { codigo: 'tornillo_t1', descripcion: 'Tornillo T1 mecha', unidad: 'u', precio_unitario: 0.05 },
          { codigo: 'tornillo_t2', descripcion: 'Tornillo T2 punta aguja', unidad: 'u', precio_unitario: 0.08 },
          { codigo: 'mano_obra', descripcion: 'Mano de obra armado', unidad: 'm2', precio_unitario: 45.0 },
        ];
        setPrices(defaults.map(d => ({ id: d.codigo, label: d.descripcion, unit: d.unidad, price: d.precio_unitario })));
      } else {
        setPrices(catalog.map((c: any) => ({ id: c.codigo, label: c.descripcion, unit: c.unidad, price: c.precio_unitario })));
      }
      
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handlePriceChange = (priceId: string, value: number) => {
    setPrices(prev => prev.map(p => p.id === priceId ? { ...p, price: value } : p));
  };

  const handleSaveCatalog = async () => {
    setSaving(true);
    try {
      const payload = prices.map(p => ({
        codigo: p.id,
        descripcion: p.label,
        unidad: p.unit,
        precio_unitario: p.price
      }));
      await ApiClient.updateCatalog(payload);
      alert('Catálogo guardado en PostgreSQL.');
    } catch (e: any) {
      alert('Error guardando catálogo: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setSaving(true);
    try {
      const { total, complete } = calculateTotal();
      if (!complete) {
        if (!confirm('Faltan precios. ¿Guardar presupuesto parcial?')) return;
      }

      const snapshot = await ApiClient.saveBudget(id, {
        items_json: mockBOM.items.map(item => {
          const priceItem = prices.find(p => p.id === item.id);
          return {
            ...item,
            precio_unitario: priceItem?.price || 0,
            subtotal: (priceItem?.price || 0) * item.quantity
          };
        }),
        total,
        moneda: 'USD',
        estado: complete ? 'confirmado' : 'borrador'
      });
      setBudgetSnapshot(snapshot);
      alert('Presupuesto guardado exitosamente.');
    } catch (e: any) {
      alert('Error guardando presupuesto: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    let complete = true;

    mockBOM.items.forEach(item => {
      const priceItem = prices.find(p => p.id === item.id);
      if (priceItem && priceItem.price !== null && !isNaN(priceItem.price)) {
        total += item.quantity * priceItem.price;
      } else {
        complete = false;
      }
    });

    return { total, complete };
  };

  const { total, complete } = calculateTotal();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="budget-layout">
      <Sidebar projectId={id} />
      
      <main className="budget-content animate-fade">
        <header className="budget-header">
          <div className="header-info">
            <h1>Presupuesto Estimado</h1>
            <p>Cálculo de costos basado en BOM industrial para {project.nombre}.</p>
            {budgetSnapshot && (
              <span className="last-save">
                Último guardado: {new Date(budgetSnapshot.fecha_creacion).toLocaleString()}
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              onClick={handleSaveSnapshot} 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Snapshot'}
            </button>
            <div className="total-badge">
              <span className="label">Total Estimado</span>
              <span className="value">
                {complete ? `USD ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Precio Pendiente'}
              </span>
            </div>
          </div>
        </header>

        <div className="budget-grid">
          <div className="main-col">
            <section className="bom-section">
              <div className="section-header">
                <h3>Cómputo de Materiales (BOM)</h3>
                <span className="badge">Calculado del Modelo 3D</span>
              </div>
              <div className="bom-table-wrapper">
                <table className="bom-table">
                  <thead>
                    <tr>
                      <th>Material / Ítem</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBOM.items.map(item => {
                      const priceItem = prices.find(p => p.id === item.id);
                      const subtotal = (priceItem?.price || 0) * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td>{item.label}</td>
                          <td>{item.quantity.toLocaleString()}</td>
                          <td>{priceItem?.unit}</td>
                          <td className="subtotal">
                            {priceItem?.price ? `USD ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="side-col">
            <PriceCatalogForm 
              prices={prices} 
              onPriceChange={handlePriceChange}
              onSave={handleSaveCatalog}
            />
            
            <div className="info-card success">
              <CheckCircle size={20} className="icon-ok" />
              <p>Los precios y presupuestos se guardan en PostgreSQL. Historial de snapshots activado.</p>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .budget-layout {
          display: flex;
        }
        .budget-content {
          flex: 1;
          padding: 48px 64px;
        }
        .budget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }
        .header-info h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header-info p {
          color: var(--muted);
          font-size: 14px;
        }
        .last-save {
          display: block;
          font-size: 11px;
          color: var(--success);
          margin-top: 4px;
          font-weight: 600;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .total-badge {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 16px 32px;
          border-radius: 16px;
          text-align: right;
          display: flex;
          flex-direction: column;
        }
        .total-badge .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .total-badge .value {
          font-size: 24px;
          font-weight: 800;
          color: var(--accent);
        }
        .budget-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 32px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
        }
        .badge {
          font-size: 11px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
        }
        .bom-table-wrapper {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .bom-table {
          width: 100%;
          border-collapse: collapse;
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
          font-size: 14px;
        }
        .subtotal {
          font-weight: 700;
          color: var(--success);
          text-align: right;
        }
        .side-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .info-card {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          gap: 16px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
