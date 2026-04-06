import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Navbar       from './components/Navbar';
import ChatPanel, { ChatFAB } from './components/ChatPanel';
import AuthPage     from './pages/AuthPage';
import Dashboard    from './pages/Dashboard';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage  from './pages/BudgetsPage';
import ChatPage     from './pages/ChatPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
};

/**
 * Layout wraps every protected page.
 * ChatPanel + ChatFAB live here so they persist across navigations
 * and share state via ChatContext.
 */
const Layout = ({ children, hideFAB }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main>{children}</main>
    <ChatPanel />
    {!hideFAB && <ChatFAB />}
  </div>
);

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute><Layout><ExpensesPage /></Layout></ProtectedRoute>
      } />
      <Route path="/budgets" element={
        <ProtectedRoute><Layout><BudgetsPage /></Layout></ProtectedRoute>
      } />
      {/* On /chat the panel auto-opens; hide the FAB to avoid double toggle */}
      <Route path="/chat" element={
        <ProtectedRoute><Layout hideFAB><ChatPage /></Layout></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px' } }}
          />
          <AppRoutes />
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}
