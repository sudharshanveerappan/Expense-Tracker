import { useState, useEffect } from 'react';
import { budgetAPI } from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];
const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_ICONS = {
  Food:'🍔', Transport:'🚗', Housing:'🏠', Entertainment:'🎬',
  Health:'💊', Shopping:'🛍️', Education:'📚', Other:'📦',
};

const CATEGORY_COLORS = {
  Food:'bg-orange-500', Transport:'bg-blue-500', Housing:'bg-purple-500',
  Entertainment:'bg-pink-500', Health:'bg-green-500', Shopping:'bg-yellow-500',
  Education:'bg-indigo-500', Other:'bg-gray-400',
};

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth]     = useState(now.getMonth() + 1);
  const [year, setYear]       = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [form, setForm]       = useState({ category: 'Food', limit: '' });
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await budgetAPI.getAll({ month, year });
      setBudgets(data);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.limit || +form.limit <= 0) return toast.error('Enter a valid limit');
    try {
      await budgetAPI.upsert({ ...form, limit: +form.limit, month, year });
      toast.success('Budget saved!');
      setForm({ category: 'Food', limit: '' });
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleInlineEdit = async (b) => {
    if (!editLimit || +editLimit <= 0) return toast.error('Enter a valid limit');
    try {
      await budgetAPI.upsert({ category: b.category, limit: +editLimit, month, year });
      toast.success('Updated!');
      setEditingId(null);
      fetchBudgets();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetAPI.delete(id);
      toast.success('Budget removed');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Summary totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s, b) => s + b.spent, 0);
  const totalOver     = budgets.filter((b) => b.spent > b.limit).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field !py-1.5 !w-auto" value={month} onChange={(e) => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field !py-1.5 !w-auto" value={year} onChange={(e) => setYear(+e.target.value)}>
            {[2023, 2024, 2025].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary row */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Budgeted" value={`$${totalBudgeted.toFixed(2)}`} color="text-indigo-600" bg="bg-indigo-50" />
          <SummaryCard label="Total Spent"    value={`$${totalSpent.toFixed(2)}`}    color={totalSpent > totalBudgeted ? 'text-red-600' : 'text-emerald-600'} bg={totalSpent > totalBudgeted ? 'bg-red-50' : 'bg-emerald-50'} />
          <SummaryCard label="Over Budget"    value={`${totalOver} categor${totalOver !== 1 ? 'ies' : 'y'}`} color={totalOver > 0 ? 'text-red-600' : 'text-gray-500'} bg={totalOver > 0 ? 'bg-red-50' : 'bg-gray-50'} />
        </div>
      )}

      {/* Add budget form */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Set Monthly Budget</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Category</label>
            <select className="input-field !w-auto" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Monthly Limit ($)</label>
            <input
              className="input-field !w-36"
              type="number" min="1" step="0.01" placeholder="0.00"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
            Save Budget
          </button>
        </form>
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500 font-medium">No budgets set</p>
          <p className="text-gray-400 text-sm mt-1">Add a budget above to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const pct    = Math.min((b.spent / b.limit) * 100, 100);
            const isOver = b.spent > b.limit;
            const barColor = isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : CATEGORY_COLORS[b.category] || 'bg-emerald-500';

            return (
              <div key={b._id} className={`card p-5 transition ${isOver ? 'border-red-200 bg-red-50/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  {/* Left: icon + name + badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-xl">
                      {CATEGORY_ICONS[b.category]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{b.category}</span>
                        {isOver && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            Over Budget
                          </span>
                        )}
                        {!isOver && pct > 80 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Near Limit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}% used</p>
                    </div>
                  </div>

                  {/* Right: amounts + actions */}
                  <div className="flex items-center gap-3">
                    {editingId === b._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="1" step="0.01"
                          className="input-field !w-24 !py-1"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleInlineEdit(b)} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className={`font-bold text-sm ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                          ${b.spent.toFixed(2)} <span className="text-gray-400 font-normal">/ ${b.limit.toFixed(2)}</span>
                        </p>
                        <p className={`text-xs mt-0.5 ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                          {isOver ? `$${(b.spent - b.limit).toFixed(2)} over` : `$${b.remaining.toFixed(2)} left`}
                        </p>
                      </div>
                    )}
                    {editingId !== b._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingId(b._id); setEditLimit(String(b.limit)); }}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(b._id)} className="text-xs text-red-400 hover:text-red-600 font-medium transition">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full progress-bar ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Tick marks at 25%, 50%, 75% */}
                <div className="relative mt-1">
                  <div className="flex justify-between text-xs text-gray-300 px-0">
                    {['25%', '50%', '75%', '100%'].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bg }) {
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
