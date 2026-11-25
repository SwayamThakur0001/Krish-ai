import React, { useState, useEffect } from 'react';
import { ChatMessage, HealthStatus, ChatResponsePayload } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { SystemPromptModal } from './components/SystemPromptModal';

function generateSessionId(): string {
  const rand = Math.random().toString(16).substring(2, 10);
  return `s-${rand}`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SESSIONS_STORAGE_KEY = 'krish_ai_sessions';
const THEME_STORAGE_KEY = 'krish_ai_theme';

export const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isSystemModalOpen, setIsSystemModalOpen] = useState<boolean>(false);
  const [simulateFailure, setSimulateFailure] = useState<string>('');
  const [dockOpen, setDockOpen] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const newId = generateSessionId();
    setSessionId(newId);

    const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const initialList = [newId, ...parsed.filter((s) => s !== newId)].slice(0, 20);
          setSessions(initialList);
          localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initialList));
        }
      } catch (_) {
        setSessions([newId]);
      }
    } else {
      setSessions([newId]);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([newId]));
    }

    fetchHealth();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data: HealthStatus = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.warn('Health check unreachable:', err);
    }
  };

  const handleNewSession = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setMessages([]);
    setSessions((prev) => {
      const updated = [newId, ...prev.filter((s) => s !== newId)].slice(0, 20);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectSession = async (sid: string) => {
    if (sid === sessionId) return;
    setSessionId(sid);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sid}/messages`);
      if (res.ok) {
        const data = await res.json();
        const loaded: ChatMessage[] = (data.messages || []).map((m: any, idx: number) => ({
          id: `loaded-${idx}`,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          timestamp: new Date().toISOString(),
        }));
        setMessages(loaded);
      } else {
        setMessages([]);
      }
    } catch (_) {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sid: string) => {
    const updated = sessions.filter((s) => s !== sid);
    setSessions(updated);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));

    if (sid === sessionId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        const newId = generateSessionId();
        setSessionId(newId);
        setMessages([]);
        setSessions([newId]);
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([newId]));
      }
    }

    try {
      await fetch(`${API_BASE_URL}/sessions/${sid}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Failed to delete session on backend:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (simulateFailure) {
        headers['X-Simulate-Failure'] = simulateFailure;
      }

      const payload: {
        session_id: string;
        message: string;
        system_prompt?: string;
      } = {
        session_id: sessionId,
        message: text,
      };
      if (systemPrompt.trim()) {
        payload.system_prompt = systemPrompt.trim();
      }

      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorDetail = `Request failed with status ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) {
            errorDetail =
              typeof errJson.detail === 'string'
                ? errJson.detail
                : JSON.stringify(errJson.detail);
          }
        } catch (_) {}

        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'error',
          content: `Error (${res.status}): ${errorDetail}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const data: ChatResponsePayload = await res.json();
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        metadata: data.metadata,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'error',
        content: `Connection Error: ${err.message || 'Unable to reach backend gateway'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="krish-studio-shell" data-theme={theme}>
      <Header
        dockOpen={dockOpen}
        onToggleDock={() => setDockOpen((prev) => !prev)}
        onNewSession={handleNewSession}
        simulateFailure={simulateFailure}
        onSelectSimulateFailure={setSimulateFailure}
        health={health}
        sessionId={sessionId}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        hasSystemPrompt={Boolean(systemPrompt.trim())}
        onOpenSystemPrompt={() => setIsSystemModalOpen(true)}
      />

      <div className="studio-workspace">
        <main className="conversation-stage">
          {simulateFailure && (
            <div className="sim-banner">
              <span>
                Failover Simulation Active: <code>X-Simulate-Failure: {simulateFailure}</code>
              </span>
              <button className="sim-banner-reset" onClick={() => setSimulateFailure('')}>
                Reset
              </button>
            </div>
          )}

          <MessageList
            messages={messages}
            onSelectSamplePrompt={handleSendMessage}
            isLoading={isLoading}
          />

          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </main>

        <Sidebar
          isOpen={dockOpen}
          currentSessionId={sessionId}
          sessions={sessions}
          messages={messages}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          health={health}
          systemPrompt={systemPrompt}
          onOpenSystemPrompt={() => setIsSystemModalOpen(true)}
        />
      </div>

      <SystemPromptModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        systemPrompt={systemPrompt}
        onSave={setSystemPrompt}
      />
    </div>
  );
};

export default App;
