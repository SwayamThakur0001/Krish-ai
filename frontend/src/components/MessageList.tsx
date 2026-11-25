import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  onSelectSamplePrompt: (prompt: string) => void;
  isLoading: boolean;
}

const STARTER_PROMPTS = [
  {
    tag: 'CACHE TEST',
    badgeClass: 'cyan',
    title: 'What is the capital of France?',
    subtitle: 'Trigger live inference first, then test instant SHA-256 cache hits.',
    prompt: 'What is the capital of France?',
  },
  {
    tag: 'TELEMETRY',
    badgeClass: '',
    title: 'Explain quantum computing simply',
    subtitle: 'Inspect token accounting, model routing, and latency metrics.',
    prompt: 'Explain quantum computing in 2 simple sentences.',
  },
  {
    tag: 'CODE GEN',
    badgeClass: 'orange',
    title: 'Write a Python palindrome check',
    subtitle: 'Preview syntax-framed code block rendering from Krish AI.',
    prompt: 'Write a Python function to check if a string is a palindrome.',
  },
  {
    tag: 'MEMORY',
    badgeClass: 'emerald',
    title: 'Verify multi-turn context',
    subtitle: 'Check persistent SQLite conversation recall across turns.',
    prompt: 'What was the first question I asked you?',
  },
];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSelectSamplePrompt,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="messages-viewport">
      <div className="messages-inner">
        {messages.length === 0 ? (
          <div className="bento-hero">
            <div className="hero-banner-card">
              <div className="hero-eyebrow">
                <span className="status-dot-live" />
                <span>KRISH AI WORKSPACE</span>
              </div>

              <h1 className="hero-heading">
                Think faster with <span>Krish AI</span>.
              </h1>

              <p className="hero-desc">
                A resilient multi-provider AI workspace featuring deterministic SHA-256 response
                caching, automatic API key failover, and persistent SQLite conversation threads.
              </p>

              <div className="hero-capabilities">
                <span className="cap-chip">⚡ Millisecond Cache</span>
                <span className="cap-chip">🛡️ Multi-Key Failover</span>
                <span className="cap-chip">💾 SQLite History</span>
                <span className="cap-chip">📊 Per-Turn Telemetry</span>
              </div>
            </div>

            <div className="bento-prompts-grid">
              {STARTER_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="bento-prompt-card"
                  onClick={() => onSelectSamplePrompt(item.prompt)}
                >
                  <div className="bento-card-top">
                    <span className={`bento-card-badge ${item.badgeClass}`}>{item.tag}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <div className="bento-card-title">{item.title}</div>
                  <div className="bento-card-sub">{item.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="assistant-turn-card">
            <div className="assistant-card-header">
              <div className="assistant-identity">
                <div className="krish-avatar-badge">K</div>
                <span className="assistant-name-label">Krish AI</span>
              </div>
              <div className="spinner-ring" style={{ color: 'var(--brand-indigo)' }} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Synthesizing response through LiteLLM gateway...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
