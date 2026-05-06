'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, HelpCircle, Box } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="shell-container">
      <header className="shell-header">
        <Link href="/" className="shell-logo">
          Steel<span>Frame</span>
        </Link>
        <nav className="shell-nav">
          <Link href="/proyectos" className={pathname.startsWith('/proyectos') ? 'active' : ''}>
            Proyectos
          </Link>
          <Link href="/ayuda">Ayuda</Link>
        </nav>
        <div className="shell-user">
          <div className="user-badge">Next Gen UI</div>
        </div>
      </header>
      
      <div className="shell-body">
        {children}
      </div>

      <style jsx>{`
        .shell-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .shell-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
          background: rgba(22, 27, 36, 0.8);
        }
        .shell-logo {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .shell-logo span {
          color: var(--accent);
        }
        .shell-nav {
          margin-left: 48px;
          display: flex;
          gap: 24px;
        }
        .shell-nav a {
          font-size: 14px;
          color: var(--muted);
          transition: color 0.2s;
          font-weight: 500;
        }
        .shell-nav a:hover, .shell-nav a.active {
          color: var(--text);
        }
        .shell-user {
          margin-left: auto;
        }
        .user-badge {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .shell-body {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
