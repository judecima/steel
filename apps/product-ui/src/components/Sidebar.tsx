'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Eye, DollarSign, Package, Construction } from 'lucide-react';

interface SidebarProps {
  projectId: string;
}

export default function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Configuración', icon: Settings, href: `/proyectos/${projectId}` },
    { label: 'Visualizar', icon: Eye, href: `/proyectos/${projectId}/viewer` },
    { label: 'Presupuesto', icon: DollarSign, href: `/proyectos/${projectId}/presupuesto` },
    { label: 'Exportaciones', icon: Package, href: `/proyectos/${projectId}/exportaciones` },
    { label: 'Producción', icon: Construction, href: `/proyectos/${projectId}/produccion` },
  ];

  return (
    <aside className="sidebar">
      <h2>Secciones</h2>
      <nav>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .sidebar {
          width: 260px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 32px 24px;
          height: calc(100vh - 64px);
          position: sticky;
          top: 64px;
        }
        h2 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 24px;
        }
        nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        nav :global(a) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        nav :global(a):hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text);
        }
        nav :global(a).active {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }
      `}</style>
    </aside>
  );
}
