'use client';

import React from 'react';
import { DollarSign, Save } from 'lucide-react';

interface PriceItem {
  id: string;
  label: string;
  unit: string;
  price: number | null;
}

interface PriceCatalogFormProps {
  prices: PriceItem[];
  onPriceChange: (id: string, value: number) => void;
  onSave: () => void;
}

export default function PriceCatalogForm({ prices, onPriceChange, onSave }: PriceCatalogFormProps) {
  return (
    <div className="price-catalog">
      <header className="catalog-header">
        <h3>Catálogo de Precios</h3>
        <button onClick={onSave} className="btn-save">
          <Save size={16} /> Guardar Cambios
        </button>
      </header>
      
      <div className="price-list">
        {prices.map((item) => (
          <div key={item.id} className="price-item">
            <div className="item-info">
              <span className="label">{item.label}</span>
              <span className="unit">Unidad: {item.unit}</span>
            </div>
            <div className="input-wrapper">
              <DollarSign size={14} className="currency-icon" />
              <input
                type="number"
                value={item.price || ''}
                onChange={(e) => onPriceChange(item.id, parseFloat(e.target.value))}
                placeholder="Precio"
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .price-catalog {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
        }
        .catalog-header {
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
        .btn-save {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-save:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .price-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .item-info {
          display: flex;
          flex-direction: column;
        }
        .label {
          font-size: 14px;
          font-weight: 600;
        }
        .unit {
          font-size: 11px;
          color: var(--muted);
        }
        .input-wrapper {
          position: relative;
          width: 120px;
        }
        .currency-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }
        input {
          width: 100%;
          padding: 8px 8px 8px 28px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 14px;
        }
        input:focus {
          outline: none;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
