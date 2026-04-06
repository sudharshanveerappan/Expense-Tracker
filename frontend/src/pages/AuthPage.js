import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin]     = useState(true);
  const [form, setForm]           = useState({ name: '', email: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim())          e.name     = 'Name is required';
    if (!/\S+@\S+\.\S+/.test(form.email))       e.email    = 'Valid email required';
    if (form.password.length < 6)               e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = isLogin
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.signup(form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((v) => !v);
    setErrors({});
    setForm({ name: '', email: '', password: '' });
  };

  const passwordStrength = (p) => {
    if (p.length === 0) return null;
    if (p.length < 6)   return { label: 'Weak',   color: 'bg-red-400',   w: 'w-1/3' };
    if (p.length < 10)  return { label: 'Fair',   color: 'bg-amber-400', w: 'w-2/3' };
    return               { label: 'Strong', color: 'bg-emerald-500', w: 'w-full' };
  };
  const strength = !isLogin ? passwordStrength(form.password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-3xl font-bold text-gray-900">ExpenseAI</h1>
          <p className="text-gray-500 mt-1 text-sm">Your AI-powered expense tracker</p>
        </div>

        <div className="card p-8">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['Sign In', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                onClick={() => { setIsLogin(i === 0); setErrors({}); setForm({ name: '', email: '', password: '' }); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  isLogin === (i === 0)
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <Field label="Full Name" error={errors.name}>
                <input
                  className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-200' : ''}`}
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email" error={errors.email}>
              <input
                className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-200' : ''}`}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-200' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.w}`} />
                  </div>
                  <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                </div>
              )}
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Please wait...
                </span>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={switchMode} className="text-indigo-600 font-semibold hover:underline">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
