import { useState, useEffect, useRef } from 'react';

const CATEGORIES      = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'];

const CATEGORY_ICONS = {
  Food:'🍔', Transport:'🚗', Housing:'🏠', Entertainment:'🎬',
  Health:'💊', Shopping:'🛍️', Education:'📚', Other:'📦',
};

const defaultForm = {
  amount: '', category: 'Food', description: '',
  date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash',
};

export default function ExpenseForm({ onSubmit, onClose, initial }) {
  const [form, setForm]     = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const amountRef           = useRef(null);

  useEffect(() => {
    if (initial) setForm({ ...initial, date: initial.date?.split('T')[0] || defaultForm.date });
    else setForm(defaultForm);
    // Focus amount field on open
    setTimeout(() => amountRef.current?.focus(), 50);
  }, [initial]);

  // Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.amount || +form.amount <= 0) e.amount = 'Enter a valid amount';
    if (!form.category)                    e.category = 'Select a category';
    if (!form.date)                        e.date = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? '✏️ Edit Expense' : '➕ Add Expense'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  ref={amountRef}
                  className={`input-field pl-7 ${errors.amount ? 'border-red-300' : ''}`}
                  type="number" step="0.01" min="0.01" placeholder="0.00"
                  value={form.amount} onChange={set('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className={`input-field ${errors.date ? 'border-red-300' : ''}`}
                type="date" value={form.date} onChange={set('date')}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => { setForm((f) => ({ ...f, category: c })); setErrors((er) => ({ ...er, category: null })); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition ${
                    form.category === c
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{CATEGORY_ICONS[c]}</span>
                  {c}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Payment Method</label>
            <select className="input-field" value={form.paymentMethod} onChange={set('paymentMethod')}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Note <span className="text-gray-300">(optional)</span></label>
            <input
              className="input-field"
              placeholder="e.g. Lunch with team"
              value={form.description} onChange={set('description')}
              maxLength={300}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {initial ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-300">⌘ + Enter to submit</p>
        </form>
      </div>
    </div>
  );
}
