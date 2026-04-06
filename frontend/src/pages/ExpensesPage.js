import { useState } from 'react';
import { expenseAPI } from '../api';
import { useExpenses } from '../hooks/useExpenses';
import ExpenseForm from '../components/ExpenseForm';
import toast from 'react-hot-toast';

const CATEGORIES = ['', 'Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];

const CATEGORY_STYLES = {
  Food:          'bg-orange-100 text-orange-700',
  Transport:     'bg-blue-100 text-blue-700',
  Housing:       'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Health:        'bg-green-100 text-green-700',
  Shopping:      'bg-yellow-100 text-yellow-700',
  Education:     'bg-indigo-100 text-indigo-700',
  Other:         'bg-gray-100 text-gray-700',
};

const PAYMENT_ICONS = {
  Cash: '💵', 'Credit Card': '💳', 'Debit Card': '🏧', UPI: '📱', 'Bank Transfer': '🏦',
};

const COLUMNS = [
  { key: 'date',          label: 'Date',    sortable: true },
  { key: 'category',      label: 'Category',sortable: true },
  { key: 'description',   label: 'Note',    sortable: false },
  { key: 'paymentMethod', label: 'Payment', sortable: false },
  { key: 'amount',        label: 'Amount',  sortable: true },
];

export default function ExpensesPage() {
  const { expenses, total, pages, page, setPage, filters, updateFilter, clearFilters, sort, toggleSort, loading, refetch } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleCreate = async (form) => {
    try {
      await expenseAPI.create(form);
      toast.success('Expense added!');
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  const handleUpdate = async (form) => {
    try {
      await expenseAPI.update(editing._id, form);
      toast.success('Updated!');
      setEditing(null);
      refetch();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.delete(id);
      toast.success('Deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const SortIcon = ({ field }) => {
    if (sort.field !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-500 ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} transaction{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 text-sm">
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Category</label>
            <select className="input-field !w-auto" value={filters.category || ''} onChange={(e) => updateFilter({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field !w-auto" value={filters.startDate || ''} onChange={(e) => updateFilter({ startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field !w-auto" value={filters.endDate || ''} onChange={(e) => updateFilter({ endDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Min $</label>
            <input type="number" min="0" placeholder="0" className="input-field !w-24" value={filters.minAmount || ''} onChange={(e) => updateFilter({ minAmount: e.target.value })} />
          </div>
          <div>
            <label className="label">Max $</label>
            <input type="number" min="0" placeholder="Any" className="input-field !w-24" value={filters.maxAmount || ''} onChange={(e) => updateFilter({ maxAmount: e.target.value })} />
          </div>
          <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 transition pb-2.5">
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 font-medium">No expenses found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new expense</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {COLUMNS.map(({ key, label, sortable }) => (
                      <th
                        key={key}
                        onClick={() => sortable && toggleSort(key)}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${sortable ? 'th-sortable' : ''}`}
                      >
                        {label}{sortable && <SortIcon field={key} />}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((e) => (
                    <>
                      <tr
                        key={e._id}
                        onClick={() => setExpanded(expanded === e._id ? null : e._id)}
                        className="hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_STYLES[e.category]}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{e.description || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {PAYMENT_ICONS[e.paymentMethod]} {e.paymentMethod}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">${e.amount.toFixed(2)}</td>
                        <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(e)} className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition">Edit</button>
                            <button onClick={() => handleDelete(e._id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition">Delete</button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded detail row */}
                      {expanded === e._id && (
                        <tr key={`${e._id}-detail`} className="bg-indigo-50/40">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                              <span><strong>ID:</strong> {e._id}</span>
                              <span><strong>Created:</strong> {new Date(e.createdAt).toLocaleString()}</span>
                              {e.description && <span><strong>Note:</strong> {e.description}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                {/* Footer total */}
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs text-gray-500">
                      Showing {expenses.length} of {total}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">${totalAmount.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > pages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'bg-indigo-600 text-white' : 'btn-ghost'}`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {showForm && <ExpenseForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      {editing   && <ExpenseForm onSubmit={handleUpdate} onClose={() => setEditing(null)} initial={editing} />}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 flex-1" />
          <div className="skeleton h-5 w-16" />
          <div className="skeleton h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
