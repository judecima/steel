'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ params }: { params: { id: string } }) {
  return (
    <div className="detail-layout">
      <Sidebar projectId={params.id} />
      <main className="detail-content">
        <div className="placeholder-card">
          <Construction size={48} className="icon" />
          <h1>Sección en Construcción</h1>
          <p>Esta sección será migrada en la Fase 9B.</p>
        </div>
      </main>

      <style jsx>{`
        .detail-layout { display: flex; }
        .detail-content { flex: 1; padding: 48px 64px; display: flex; align-items: center; justify-content: center; }
        .placeholder-card { text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 64px; max-width: 400px; }
        .icon { color: var(--warning); margin-bottom: 24px; }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: var(--muted); }
      `}</style>
    </div>
  );
}
