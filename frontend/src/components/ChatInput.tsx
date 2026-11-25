import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="composer-dock">
      <form className="composer-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          data-testid="chat-input"
          className="composer-textarea"
          placeholder="Ask Krish AI anything..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />

        <div className="composer-footer-row">
          <div className="composer-hints">
            <span>Enter ↵ send</span>
            <span>•</span>
            <span>Shift+Enter newline</span>
            <span className="hide-sm">•</span>
            <span className="hide-sm">{input.length}/4000</span>
          </div>

          <button
            type="submit"
            data-testid="send-button"
            className="composer-send-btn"
            disabled={!input.trim() || disabled}
            title="Send to Krish AI"
          >
            {disabled ? (
              <>
                <div className="spinner-ring" />
                <span>Sending</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
