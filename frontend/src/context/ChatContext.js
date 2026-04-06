import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { chatAPI } from '../api';

const ChatContext = createContext();

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm your AI expense assistant 🤖\n\nTell me about your expenses in plain English:\n• \"I spent $50 on groceries today\"\n• \"Add $120 for uber and $30 for lunch\"\n• \"Show my expenses this month\"\n• \"Delete last expense\"",
  results: null,
  ts: Date.now(),
};

// ollamaStatus shape: { checked: bool, ok: bool, modelReady: bool, model: string, error: string|null }
const DEFAULT_STATUS = { checked: false, ok: false, modelReady: false, model: 'phi', error: null };

export function ChatProvider({ children }) {
  const [messages, setMessages]       = useState([WELCOME]);
  const [loading, setLoading]         = useState(false);
  const [isOpen, setIsOpen]           = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(DEFAULT_STATUS);

  // Check Ollama health once on mount
  const checkHealth = useCallback(async () => {
    try {
      const { data } = await chatAPI.health();
      setOllamaStatus({ checked: true, ...data });
    } catch (err) {
      // Read body from 503 response if available, otherwise mark as offline
      const data = err.response?.data;
      setOllamaStatus(data
        ? { checked: true, ...data }
        : { checked: true, ok: false, modelReady: false, model: 'phi', error: 'Cannot reach backend' }
      );
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const send = useCallback(async (text) => {
    const msg = text?.trim();
    if (!msg || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: msg, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const { data } = await chatAPI.send(msg);
      // Mark Ollama as online after a successful call
      setOllamaStatus((s) => ({ ...s, checked: true, ok: true }));
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: data.message,
          results: data.results,
          context: data.context,
          ts: Date.now(),
        },
      ]);
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.message || 'Something went wrong.';

      // Mark Ollama offline on 503
      if (status === 503) {
        setOllamaStatus((s) => ({ ...s, checked: true, ok: false, error: errMsg }));
      }

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: errMsg,
          isError: true,
          errorType: status === 503 ? 'ollama_offline' : 'general',
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearHistory = useCallback(() => setMessages([WELCOME]), []);
  const open   = useCallback(() => setIsOpen(true),          []);
  const close  = useCallback(() => setIsOpen(false),         []);
  const toggle = useCallback(() => setIsOpen((v) => !v),     []);

  return (
    <ChatContext.Provider value={{
      messages, loading, isOpen, ollamaStatus,
      send, clearHistory, open, close, toggle, checkHealth,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
