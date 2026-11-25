import React from 'react';
import { ChatMessage, HealthStatus } from '../types';

interface SidebarProps {
  isOpen: boolean;
  currentSessionId: string;
  sessions: string[];
  messages: ChatMessage[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  health: HealthStatus | null;
  systemPrompt: string;
  onOpenSystemPrompt: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  currentSessionId,
  sessions,
  messages,
  onSelectSession,
  onDeleteSession,
  health,
  systemPrompt,
  onOpenSystemPrompt,
}) => {
  const assistantMessages = messages.filter((m) => m.role === 'assistant' && m.metadata);
  const totalTokens = assistantMessages.reduce(
    (sum, m) => sum + (m.metadata?.input_tokens || 0) + (m.metadata?.output_tokens || 0),
    0
  );
  const cacheHits = assistantMessages.filter(
    (m) => m.metadata?.resolution_source === 'LLM_CACHE'
  ).length;
  const avgLatency =
    assistantMessages.length > 0
      ? Math.round(
          assistantMessages.reduce((sum, m) => sum + (m.metadata?.latency_ms || 0), 0) /
            assistantMessages.length
        )
      : 0;

  return (
    <aside className={`studio-right-dock ${!isOpen ? 'collapsed' : ''}`} aria-label="Krish AI Studio Dock">
      <div className="dock-section">
        <div className="dock-section-header">
          <span>Session Telemetry</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--brand-indigo)' }}>
            {health ? `${health.keys_configured} KEYS` : 'OFFLINE'}
          </span>
        </div>

        <div className="telemetry-kpi-grid">
          <div className="kpi-box">
            <span className="kpi-label">Responses</span>
            <span className="kpi-value">{assistantMessages.length}</span>
          </div>
          <div className="kpi-box">
            <span className="kpi-label">Total Tokens</span>
            <span className="kpi-value">{totalTokens}</span>
          </div>
          <div className="kpi-box">
            <span className="kpi-label">Cache Hits</span>
            <span className="kpi-value" style={{ color: 'var(--status-cyan)' }}>
              {cacheHits}
            </span>
          </div>
          <div className="kpi-box">
            <span className="kpi-label">Avg Latency</span>
            <span className="kpi-value">{avgLatency} ms</span>
          </div>
        </div>

        <button className="persona-trigger-card" onClick={onOpenSystemPrompt}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>System Persona</div>
            <div
              style={{
                fontSize: '0.71rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '210px',
              }}
            >
              {systemPrompt.trim() ? systemPrompt.trim() : 'Default Krish AI assistant'}
            </div>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>

      <div className="dock-section" style={{ borderBottom: 'none', paddingBottom: '6px' }}>
        <div className="dock-section-header">
          <span>Saved Threads</span>
          <span>{sessions.length}</span>
        </div>
      </div>

      <div className="threads-scroll-area">
        {sessions.map((sid) => (
          <div
            key={sid}
            className={`thread-row ${sid === currentSessionId ? 'active' : ''}`}
          >
            <button
              className="thread-select-btn"
              onClick={() => onSelectSession(sid)}
              title={sid}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="thread-id-text">{sid}</span>
            </button>
            <button
              className="thread-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(sid);
              }}
              title="Delete thread"
              aria-label={`Delete thread ${sid}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};
