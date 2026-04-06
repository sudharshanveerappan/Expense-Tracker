import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAnalytics, MONTHS } from '../hooks/useAnalytics';

const CATEGORY_ICONS = {
  Food:'🍔', Transport:'🚗', Housing:'🏠', Entertainment:'🎬',
  Health:'💊', Shopping:'🛍️', Education:'📚', Other:'📦',
};

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const { data, loading } = useAnalytics(month, year);

  if (loading) return <DashboardSkeleton />;

  const { currTotal, currCount, currCategories, currMonthly,
          prevTotal, pctChange, avgPerTx, recent, budgets } = data;

  const topCategory = currCategories[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/analytics" className="btn-ghost px-3 py-1.5 text-xs font-medium">
            📈 Analytics
          </Link>
          <select className="input-field !py-1.5 !w-auto" value={month} onChange={(e) => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field !py-1.5 !w-auto" value={year} onChange={(e) => setYear(+e.target.value)}>
            {[2023, 2024, 2025].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Spent" icon="💳" accent="indigo"
          value={`$${currTotal.toFixed(2)}`}
          sub={pctChange !== null
            ? `${pctChange > 0 ? '▲' : '▼'} ${Math.abs(pctChange)}% vs last month`
            : 'No prior data'}
          subColor={pctChange === null ? 'text-gray-400' : +pctChange > 0 ? 'text-red-500' : 'text-emerald-500'}
        />
        <StatCard label="Transactions" icon="📋" accent="blue"
          value={currCount} sub="this period" />
        <StatCard label="Avg per Transaction" icon="📊" accent="violet"
          value={currCount ? `$${avgPerTx.toFixed(2)}` : '$0'} sub="per expense" />
        <StatCard label="Top Category" icon="🏆" accent="amber"
          value={topCategory ? `${CATEGORY_ICONS[topCategory.name]} ${topCategory.name}` : '—'}
          sub={topCategory ? `$${topCategory.value.toFixed(2)} · ${topCategory.share}%` : 'No data'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Area chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Spending Trend — {year}</h2>
            <Link to="/analytics" className="text-xs text-indigo-500 hover:underline">Full view →</Link>
          </div>
          {currMonthly.some((m) => m.amount > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={currMonthly}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Spent']} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2}
                  fill="url(#areaGrad)" dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Donut pie */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">By Category</h2>
            <Link to="/analytics" className="text-xs text-indigo-500 hover:underline">Details →</Link>
          </div>
          {currCategories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={currCategories} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {currCategories.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {currCategories.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-gray-600">{c.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">${c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Recent + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Recent Transactions</h2>
            <Link to="/expenses" className="text-xs text-indigo-500 hover:underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e) => (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
                      {CATEGORY_ICONS[e.category] || '📦'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.description || e.category}</p>
                      <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">${e.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Budget Snapshot</h2>
            <Link to="/budgets" className="text-xs text-indigo-500 hover:underline">Manage →</Link>
          </div>
          {budgets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No budgets set for this period</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const pct    = Math.min((b.spent / b.limit) * 100, 100);
                const isOver = b.spent > b.limit;
                return (
                  <div key={b._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{CATEGORY_ICONS[b.category]} {b.category}</span>
                      <span className={isOver ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        ${b.spent.toFixed(2)} / ${b.limit.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full progress-bar ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, subColor = 'text-gray-400', icon, accent }) {
  const accents = {
    indigo: 'from-indigo-50 to-indigo-100/50 border-indigo-100',
    blue:   'from-blue-50   to-blue-100/50   border-blue-100',
    violet: 'from-violet-50 to-violet-100/50 border-violet-100',
    amber:  'from-amber-50  to-amber-100/50  border-amber-100',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent]}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2 truncate">{value}</p>
      <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>;
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="skeleton h-64 rounded-2xl lg:col-span-3" />
        <div className="skeleton h-64 rounded-2xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    </div>
  );
}
