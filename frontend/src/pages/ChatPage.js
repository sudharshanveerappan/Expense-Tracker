import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ChatPanel, { ChatFAB } from '../components/ChatPanel';

/**
 * /chat route — opens the panel automatically and hides the FAB
 * so the panel fills the right side of the layout without a redundant toggle.
 */
export default function ChatPage() {
  const { open } = useChat();

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🤖</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Expense Assistant</h1>
      <p className="text-gray-500 max-w-sm">
        The chat panel is open on the right. Ask me anything about your expenses in plain English.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md w-full">
        {[
          { icon: '➕', text: 'Add expenses naturally', example: '"I spent $50 on groceries"' },
          { icon: '📋', text: 'Query your history',    example: '"Show this month\'s expenses"' },
          { icon: '✏️', text: 'Update records',        example: '"Change last food to $80"' },
          { icon: '🗑️', text: 'Delete entries',        example: '"Delete last expense"' },
        ].map(({ icon, text, example }) => (
          <div key={text} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{icon}</span>
              <span className="font-medium text-sm text-gray-800">{text}</span>
            </div>
            <p className="text-xs text-gray-400 italic">{example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
