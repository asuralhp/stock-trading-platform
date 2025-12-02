'use client';

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { dataEventBus } from '../lib/dataEventBus';

type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  text: string;
};

type ConnectionState = 'idle' | 'connecting' | 'ready' | 'error';

type ChatMode = 'ask' | 'agent';

const AgentChat = () => {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('ask');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userUid = (session?.user as { userUid?: string } | undefined)?.userUid ?? '';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resolveWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    const endpoint = mode === 'ask' ? '/ws/ask' : '/ws/agent';
    const params = userUid ? `?userUid=${encodeURIComponent(userUid)}` : '';
    return `${protocol}://${host}:3003${endpoint}${params}`;
  }, [mode, userUid]);

  useEffect(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (!isOpen) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionState('idle');
      return;
    }

    // Close existing connection before opening new one
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Delay connection to avoid React Strict Mode double-mount issues
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionState('connecting');
      const wsUrl = resolveWsUrl();
      console.log('Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected:', wsUrl);
        setConnectionState('ready');
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setConnectionState('error');
      };
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        if (socketRef.current === ws) {
          setConnectionState((prev) => (prev === 'error' ? 'error' : 'idle'));
          socketRef.current = null;
        }
      };
      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        
        let displayText = event.data;
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(event.data);
          
          // Check for explicit data update event
          if (parsed.__dataUpdate) {
            const updateEvent = {
              type: parsed.__dataUpdate.type,
              action: parsed.__dataUpdate.action,
              data: parsed.__dataUpdate.data,
              id: parsed.__dataUpdate.id,
              timestamp: Date.now(),
            };
            console.log('[AgentChat] Dispatching data update:', updateEvent);
            dataEventBus.dispatch(updateEvent);
            
            displayText = parsed.message ?? `Updated ${parsed.__dataUpdate.type}`;
          } else if (parsed.message) {
            displayText = parsed.message;
          }
        } catch {
          // Not JSON, check for keywords in text to trigger updates
          const lowerText = event.data.toLowerCase();
          
          if (lowerText.includes('updated') || lowerText.includes('changed') || lowerText.includes('modified')) {
            if (lowerText.includes('profile') || lowerText.includes('user')) {
              dataEventBus.dispatch({ type: 'user', action: 'update', timestamp: Date.now() });
            }
            if (lowerText.includes('account') || lowerText.includes('balance') || lowerText.includes('fund')) {
              dataEventBus.dispatch({ type: 'account', action: 'update', timestamp: Date.now() });
            }
          }
          
          if (lowerText.includes('bought') || lowerText.includes('sold') || lowerText.includes('order')) {
             dataEventBus.dispatch({ type: 'account', action: 'update', timestamp: Date.now() });
             // Also trigger stock update if we had a stock page listening
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            role: 'agent',
            text: displayText,
          },
        ]);
      };
    }, 100);

    return () => {
      console.log('Cleaning up WebSocket');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isOpen, mode]);

  const sendMessage = useCallback(() => {
    const trimmed = pendingMessage.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        role: 'user',
        text: trimmed,
      },
    ]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(trimmed);
    }

    setPendingMessage('');
  }, [pendingMessage]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendMessage();
    },
    [sendMessage],
  );

  const statusLabel = useMemo(() => {
    if (connectionState === 'connecting') return 'Connecting to agent...';
    if (connectionState === 'error') return 'Connection error';
    return null;
  }, [connectionState]);

  if (!isMounted) {
    return null;
  }

  return (
    <div style={containerStyle}>
      <div style={interactiveWrapperStyle}>
        {isOpen ? (
          <div style={chatWindowStyle}>
          <header style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>Agent</strong>
              {statusLabel && <span style={statusStyle}>{statusLabel}</span>}
            </div>
            <button type="button" onClick={() => setIsOpen(false)} style={iconButtonStyle} aria-label="Close chat">
              ×
            </button>
          </header>
          <div style={messagesStyle}>
            {messages.length === 0 && connectionState === 'ready' && (
              <p style={placeholderStyle}>Say hi! The agent echoes your message for now.</p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...messageBubbleStyle,
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.role === 'user' ? '#4f46e5' : '#1f2937',
                }}
              >
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={formStyle}>
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'ask' ? 'agent' : 'ask'))}
              style={toggleButtonStyle}
              aria-label="Toggle mode"
              title={mode === 'ask' ? 'Ask mode' : 'Agent mode'}
            >
              {mode === 'ask' ? '❓' : '🤖'}
            </button>
            <input
              type="text"
              value={pendingMessage}
              onChange={(event) => setPendingMessage(event.target.value)}
              placeholder={connectionState === 'ready' ? (mode === 'ask' ? 'Ask the agent...' : 'Tell the agent...') : 'Waiting for connection...'}
              style={inputStyle}
              disabled={connectionState !== 'ready'}
            />
            <button type="submit" style={sendButtonStyle} disabled={connectionState !== 'ready' || !pendingMessage.trim()} title="Send" aria-label="Send message">
              ➤
            </button>
          </form>
          </div>
        ) : (
          <button type="button" style={launcherButtonStyle} onClick={() => setIsOpen(true)}>
            Agent Chat
          </button>
        )}
      </div>
    </div>
  );
};

const containerStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 1000,
  pointerEvents: 'none',
};

const interactiveWrapperStyle: CSSProperties = {
  pointerEvents: 'auto',
};

const chatWindowStyle: CSSProperties = {
  width: '420px',
  maxWidth: '90vw',
  height: '420px',
  backgroundColor: '#111827',
  color: 'white',
  borderRadius: '1rem',
  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: '#0f172a',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
};

const iconButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'white',
  fontSize: '1.5rem',
  cursor: 'pointer',
};

const toggleButtonStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const statusStyle: CSSProperties = {
  fontSize: '0.85rem',
  marginLeft: '0.35rem',
  color: 'rgba(255, 255, 255, 0.7)',
};

const messagesStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '1rem',
  overflowY: 'auto',
};

const messageBubbleStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '0.75rem',
  maxWidth: '90%',
  lineHeight: 1.4,
  fontSize: '0.95rem',
};

const placeholderStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.65)',
  fontSize: '0.9rem',
};

const formStyle: CSSProperties = {
  padding: '0.75rem',
  display: 'flex',
  gap: '0.5rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: '#0f172a',
};

const inputStyle: CSSProperties = {
  flex: 1,
  borderRadius: '0.5rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: '#1f2937',
  color: 'white',
  padding: '0.5rem 0.75rem',
};

const sendButtonStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
};

const launcherButtonStyle: CSSProperties = {
  borderRadius: '999px',
  padding: '0.75rem 1.5rem',
  border: 'none',
  backgroundColor: '#2563eb',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(37, 99, 235, 0.35)',
};

export default AgentChat;
