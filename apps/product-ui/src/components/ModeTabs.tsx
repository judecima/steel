'use client';

import React from 'react';
import { User, Hammer, Ruler } from 'lucide-react';

interface ModeTabsProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export default function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  const modes = [
    { id: 'estandar', label: 'Cliente', icon: User },
    { id: 'taller', label: 'Taller', icon: Hammer },
    { id: 'estructural', label: 'Ingeniería', icon: Ruler },
  ];

  return (
    <div className="mode-tabs">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            className={`mode-tab ${isActive ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
          >
            <Icon size={16} />
            <span>{mode.label}</span>
          </button>
        );
      })}

      <style jsx>{`
        .mode-tabs {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }
        .mode-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-tab:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.03);
        }
        .mode-tab.active {
          background: var(--bg);
          color: var(--accent);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
