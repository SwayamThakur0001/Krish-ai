import React, { useState, useEffect } from 'react';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSave: (prompt: string) => void;
}

const PRESETS = [
  {
    label: 'Software Architect',
    text: 'You are Krish AI, an expert software architect who provides clean, modular, production-ready code and clear trade-off analysis.',
  },
  {
    label: 'Concise Tutor',
    text: 'You are Krish AI, a crystal-clear tutor. Explain concepts concisely in plain language with one short example.',
  },
  {
    label: 'Strict Reviewer',
    text: 'You are Krish AI, a senior code reviewer focused on security, edge cases, and performance.',
  },
  {
    label: 'Reset Default',
    text: '',
  },
];

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSave,
}) => {
  const [prompt, setPrompt] = useState(systemPrompt);

  useEffect(() => {
    if (isOpen) {
      setPrompt(systemPrompt);
    }
  }, [isOpen, systemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  return (
    <div className="studio-modal-backdrop" onClick={onClose}>
      <div className="studio-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
            Krish AI Persona
          </h2>
          <button
            onClick={onClose}
            className="studio-icon-btn"
            style={{ height: '30px', padding: '0 8px' }}
            aria-label="Close persona modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Override the system prompt sent to <strong>Krish AI</strong> for this session.
        </p>

        <div className="preset-chips-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-chip"
              onClick={() => setPrompt(preset.text)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <textarea
          data-testid="system-prompt-input"
          className="studio-modal-textarea"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. You are Krish AI, an expert software architect who provides clean, robust, and tested code."
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="studio-icon-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="studio-primary-btn" onClick={handleSave}>
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};
