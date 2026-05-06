'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { ApiHealth } from '@/lib/types';
import { Activity, Database, AlertCircle } from 'lucide-react';

export default function ApiStatusBadge() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const data = await ApiClient.getHealth();
        setHealth(data);
        setError(false);
      } catch (e) {
        setError(true);
      }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOk = !error && health?.status === 'ok' && health?.database === 'connected';

  return (
    <div className={`status-badge ${isOk ? 'ok' : 'error'}`}>
      {isOk ? <Database size={14} /> : <AlertCircle size={14} />}
      <span>
        {error ? 'API Desconectada' : 
         health?.database === 'connected' ? 'PostgreSQL Conectado' : 'Sin DB'}
      </span>

      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .status-badge.ok {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
