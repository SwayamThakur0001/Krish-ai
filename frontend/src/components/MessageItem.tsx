import React, { useState } from 'react';
import { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

function renderFormattedContent(content: string) {
  const segments = content.split(/(```[\s\S]*?```)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const inner = segment.slice(3, -3);
      const firstNewline = inner.indexOf('\n');
      const language =
        firstNewline !== -1 ? inner.slice(0, firstNewline).trim() || 'code' : 'code';
      const code = firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;

      return (
        <div key={index} className="code-block-wrapper">
          <div className="code-block-header">
            <span>{language}</span>
          </div>
          <pre className="code-block-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    if (!segment) return null;
    return (
      <div key={index} className="assistant-text-block">
        {segment}
      </div>
    );
  });
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="user-turn-row">
        <div className="user-turn-card">{message.content}</div>
      </div>
    );
  }

  if (message.role === 'error') {
    return (
      <div className="error-turn-card">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{message.content}</span>
      </div>
    );
  }

  const meta = message.metadata;
  const isCache = meta?.resolution_source === 'LLM_CACHE';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="assistant-turn-card" data-testid="assistant-message">
      <div className="assistant-card-header">
        <div className="assistant-identity">
          <div className="krish-avatar-badge" title="Krish AI">
            K
          </div>
          <span className="assistant-name-label">Krish AI</span>
        </div>

        <button onClick={handleCopy} className="copy-action-btn" title="Copy response">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="assistant-body-content">{renderFormattedContent(message.content)}</div>

      {meta && (
        <div className="telemetry-strip">
          <span
            className={`telemetry-tag ${isCache ? 'source-cache' : 'source-live'}`}
            data-testid="meta-source"
          >
            {isCache ? '⚡ ' : '● '}
            {meta.resolution_source}
          </span>

          <span className="telemetry-tag" data-testid="meta-model">
            {meta.model}
          </span>

          <span className="telemetry-tag" data-testid="meta-latency">
            {meta.latency_ms} ms
          </span>

          <span className="telemetry-tag" title="Prompt input tokens">
            in: <span data-testid="meta-input-tokens">{meta.input_tokens}</span>
          </span>

          <span className="telemetry-tag" title="Completion output tokens">
            out: <span data-testid="meta-output-tokens">{meta.output_tokens}</span>
          </span>

          {meta.key_id ? (
            <span className={`telemetry-tag ${meta.fallback_attempts > 0 ? 'failover-warn' : ''}`}>
              key: {meta.key_id}
              {meta.fallback_attempts > 0 && ` (${meta.fallback_attempts} fallback)`}
            </span>
          ) : (
            <span className="telemetry-tag">key: null</span>
          )}
        </div>
      )}
    </article>
  );
};
