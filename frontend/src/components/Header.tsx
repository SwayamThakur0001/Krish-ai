import React from 'react';
import { HealthStatus } from '../types';

interface HeaderProps {
  dockOpen: boolean;
  onToggleDock: () => void;
  onNewSession: () => void;
  simulateFailure: string;
  onSelectSimulateFailure: (val: string) => void;
  health: HealthStatus | null;
  sessionId: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  hasSystemPrompt: boolean;
  onOpenSystemPrompt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dockOpen,
  onToggleDock,
  onNewSession,
  simulateFailure,
  onSelectSimulateFailure,
  health,
  sessionId,
  theme,
  onToggleTheme,
  hasSystemPrompt,
  onOpenSystemPrompt,
}) => {
  return (
    <header className="studio-topbar">
      <div className="topbar-brand-group">
        <div className="krish-logo-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path
              d="M9 7v18M9 16l10-9M13.5 12.5L21 25"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="brand-wordmark">
          <div className="brand-title-row">
            <span className="brand-name">Krish AI</span>
            <span className="brand-tag">Neural Studio</span>
          </div>
          <div className="brand-subtitle">
            <span>Thread:</span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{sessionId || 'initializing'}</code>
          </div>
        </div>
      </div>

      <div className="topbar-center-status" title="LiteLLM Gateway Live Health">
        <span className={health ? 'status-dot-live' : 'status-dot-offline'} />
        {health ? (
          <span>
            Gateway OK • {health.keys_configured} Keys • Cache {health.cache_enabled ? 'ON' : 'OFF'}
          </span>
        ) : (
          <span>Connecting to Gateway...</span>
        )}
      </div>

      <div className="topbar-controls">
        <select
          className="studio-select"
          value={simulateFailure}
          onChange={(e) => onSelectSimulateFailure(e.target.value)}
          title="X-Simulate-Failure test hook"
          aria-label="Failure simulation mode"
        >
          <option value="">Failover Sim: Off</option>
          <option value="key_1=429">Sim: key_1=429 (Limit)</option>
          <option value="key_1=500">Sim: key_1=500 (Error)</option>
          <option value="*=429">Sim: *=429 (All 503)</option>
        </select>

        <button
          className={`studio-icon-btn ${hasSystemPrompt ? 'active' : ''}`}
          onClick={onOpenSystemPrompt}
          title="Configure System Persona"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z" />
          </svg>
          <span className="hide-sm">Persona</span>
        </button>

        <button
          className="studio-icon-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Midnight Aurora' : 'Switch to Alabaster Studio'}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <button className="studio-primary-btn" onClick={onNewSession} title="Start New Thread">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hide-sm">New Thread</span>
        </button>

        <button
          className={`studio-icon-btn ${dockOpen ? 'active' : ''}`}
          onClick={onToggleDock}
          title={dockOpen ? 'Hide Studio Dock' : 'Show Studio Dock'}
          aria-label="Toggle Studio Dock"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
      </div>
    </header>
  );
};
