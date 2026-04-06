import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useChat } from '../context/ChatContext';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Health: '💊', Shopping: '🛍️', Education: '📚', Other: '📦',
};

const FUNCTION_META = {
  add_expense:    { label: 'Expense Added',   icon: '✅', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  get_expenses:   { label: 'Expenses Found',  icon: '📋', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  update_expense: { label: 'Expense Updated', icon: '✏️', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  delete_expense: { label: 'Expense Deleted', icon: '🗑️', color: 'border-red-200 bg-red-50 text-red-800' },
  unknown:        { label: 'Not Understood',  icon: '❓', color: 'border-gray-200 bg-gray-50 text-gray-600' },
};

const SUGGESTIONS = [
  'I spent $50 on groceries today',
  'Add $120 for uber and $30 for lunch',
  'Show my expenses this month',
  'Delete last expense',
  'Update last food expense to $80',
];

const MAX_CHARS = 500;

/* ─── Floating toggle button ─────────────────────────────────────────────── */

export function ChatFAB() {
  const { isOpen, toggle, messages, loading, ollamaStatus } = useChat();
  const unread = messages.filter((m) => m.role === 'assistant' && !m._seen).length;
  const isOffline = ollamaStatus.checked && !ollamaStatus.ok;

  return (
    <button
      onClick={toggle}
      className="chat-fab"
      aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      title={isOpen ? 'Close chat' : 'Ask AI assistant'}
    >
      {loading ? (
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <span className="relative">
          🤖
          {isOffline && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" title="Ollama offline" />
          )}
          {!isOffline && !isOpen && unread > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
              {Math.min(unread - 1, 9)}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/* ─── Main panel ─────────────────────────────────────────────────────────── */

export default function ChatPanel() {
  const { messages, loading, isOpen, close, send, clearHistory, ollamaStatus, checkHealth } = useChat();
  const [input, setInput]   = useState('');
  const [copied, setCopied] = useState(null);
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    send(input.trim());
    setInput('');
  }, [input, loading, send]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleSuggestion = useCallback((s) => {
    send(s);
  }, [send]);

  const copyText = useCallback((id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  if (!isOpen) return null;

  const showSuggestions = messages.length <= 1;
  const charsLeft = MAX_CHARS - input.length;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={close}
        aria-hidden="true"
      />

      <aside className="chat-panel" role="complementary" aria-label="AI Chat Assistant">
        {/* ── Panel header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">AI Expense Assistant</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                loading ? 'bg-amber-400 animate-pulse'
                : !ollamaStatus.checked ? 'bg-gray-300'
                : ollamaStatus.ok ? 'bg-emerald-400'
                : 'bg-red-400'
              }`} />
              <span className="text-xs text-gray-400">
                {loading ? 'Thinking…'
                  : !ollamaStatus.checked ? 'Checking…'
                  : ollamaStatus.ok ? `${ollamaStatus.model} · Local`
                  : 'Ollama offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              title="Clear chat history"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-xs"
            >
              🗑️
            </button>
            <button
              onClick={close}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Message list ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} copied={copied} onCopy={copyText} onRetry={checkHealth} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0">🤖</div>
              <div className="chat-bubble flex items-center gap-1 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ── */}
        {showSuggestions && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-xs text-gray-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <SuggestionChip key={s} text={s} onClick={handleSuggestion} />
              ))}
            </div>
          </div>
        )}

        {/* ── Input area ── */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={MAX_CHARS}
                className="input-field resize-none overflow-y-auto"
                style={{ maxHeight: '96px' }}
                placeholder="e.g. I spent $50 on groceries…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                aria-label="Chat message input"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary w-10 h-10 flex items-center justify-center shrink-0 rounded-xl"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-300">Enter to send · Shift+Enter for newline</span>
            <span className={`text-xs ${charsLeft < 50 ? 'text-amber-500' : 'text-gray-300'}`}>
              {charsLeft}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Single message row ─────────────────────────────────────────────────── */

const MessageRow = memo(function MessageRow({ msg, copied, onCopy, onRetry }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex items-end gap-2 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mb-0.5">
          🤖
        </div>
      )}

      <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className="group relative">
          {msg.isError
            ? <ErrorBubble msg={msg} onRetry={msg.errorType === 'ollama_offline' ? onRetry : null} />
            : <div className={isUser ? 'chat-bubble-user' : 'chat-bubble'}><FormattedText text={msg.text} /></div>
          }

          {/* Copy button — appears on hover */}
          {!isUser && (
            <button
              onClick={() => onCopy(msg.id, msg.text)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition
                         w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm
                         flex items-center justify-center text-[10px] hover:bg-gray-50"
              title="Copy"
              aria-label="Copy message"
            >
              {copied === msg.id ? '✓' : '⎘'}
            </button>
          )}
        </div>

        {/* Result cards */}
        {msg.results?.map((r, i) => (
          <ResultCard key={i} result={r} />
        ))}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-300 px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

/* ─── Error bubble with retry ───────────────────────────────────────────── */

function ErrorBubble({ msg, onRetry }) {
  const isOllama = msg.errorType === 'ollama_offline';
  return (
    <div className="rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-2 max-w-xs">
      <div className="flex items-center gap-2 font-semibold">
        <span>⚠️</span>
        <span>{isOllama ? 'Ollama is offline' : 'Something went wrong'}</span>
      </div>
      <p className="text-xs text-red-700 leading-relaxed">{msg.text}</p>
      {isOllama && (
        <div className="text-xs text-red-600 bg-red-100 rounded-lg p-2 font-mono space-y-0.5">
          <p>1. ollama serve</p>
          <p>2. ollama pull phi</p>
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 transition"
        >
          ↺ Check again
        </button>
      )}
    </div>
  );
}

/* ─── Formatted text — renders newlines and bullet points ───────────────── */

function FormattedText({ text }) {
  return (
    <div className="space-y-0.5 leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-1" />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

/* ─── Function result card ───────────────────────────────────────────────── */

function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const fn   = result.intent?.function;
  const meta = FUNCTION_META[fn] || FUNCTION_META.unknown;
  const data = result.data;

  return (
    <div className={`rounded-xl border p-3 text-xs w-full ${result.success ? meta.color : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        {!result.success && <span className="text-red-500 font-medium">Failed</span>}
      </div>

      {/* add / update */}
      {(fn === 'add_expense' || fn === 'update_expense') && data && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base">{CATEGORY_ICONS[data.category] || '📦'}</span>
          <span className="font-bold text-sm">${data.amount?.toFixed(2)}</span>
          <span className="opacity-50">·</span>
          <span>{data.category}</span>
          <span className="opacity-50">·</span>
          <span>{new Date(data.date).toLocaleDateString()}</span>
          {data.paymentMethod && (
            <><span className="opacity-50">·</span><span>{data.paymentMethod}</span></>
          )}
          {data.description && (
            <><span className="opacity-50">·</span><span className="italic opacity-70">{data.description}</span></>
          )}
        </div>
      )}

      {/* get_expenses */}
      {fn === 'get_expenses' && data?.expenses && (
        <div className="space-y-1.5">
          {data.expenses.slice(0, 5).map((e) => (
            <div key={e._id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span>{CATEGORY_ICONS[e.category] || '📦'}</span>
                <span className="truncate">{e.description || e.category}</span>
                <span className="opacity-50 shrink-0">{new Date(e.date).toLocaleDateString()}</span>
              </div>
              <span className="font-semibold shrink-0">${e.amount.toFixed(2)}</span>
            </div>
          ))}
          {data.total > 5 && (
            <p className="opacity-60 text-center pt-1 border-t border-current/10">
              +{data.total - 5} more · Total: ${data.totalAmount?.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* delete */}
      {fn === 'delete_expense' && data?.deletedId && (
        <p className="opacity-70 font-mono text-[10px] truncate">id: {data.deletedId}</p>
      )}

      {/* Extracted parameters — collapsible */}
      {result.intent?.parameters && Object.keys(result.intent.parameters).length > 0 && (
        <div className="mt-2 border-t border-current/10 pt-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 opacity-50 hover:opacity-80 transition"
          >
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Extracted parameters
          </button>
          {expanded && (
            <pre className="mt-1.5 text-[10px] bg-black/5 rounded-lg p-2 overflow-x-auto leading-relaxed">
              {JSON.stringify(result.intent.parameters, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Suggestion chip ────────────────────────────────────────────────────── */

const SuggestionChip = memo(function SuggestionChip({ text, onClick }) {
  const handleClick = useCallback(() => onClick(text), [text, onClick]);
  return (
    <button
      onClick={handleClick}
      className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full
                 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition"
    >
      {text}
    </button>
  );
});
