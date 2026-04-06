import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, expenseAPI, budgetAPI } from '../api';
import toast from 'react-hot-toast';

export const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Builds a full 12-month series for a given year's monthlyTrend array,
 * filling missing months with 0 so the line chart has no gaps.
 */
export function buildMonthSeries(monthlyTrend = []) {
  const map = Object.fromEntries(monthlyTrend.map((m) => [m._id.month, m.total]));
  return MONTHS.map((name, i) => ({ name, amount: map[i + 1] ?? 0 }));
}

/**
 * Merges two month series into a single array for a comparison line chart.
 * Each entry: { name, current, previous }
 */
export function buildComparisonSeries(currTrend = [], prevTrend = []) {
  const currMap = Object.fromEntries(currTrend.map((m) => [m._id.month, m.total]));
  const prevMap = Object.fromEntries(prevTrend.map((m) => [m._id.month, m.total]));
  return MONTHS.map((name, i) => ({
    name,
    current:  currMap[i + 1] ?? 0,
    previous: prevMap[i + 1] ?? 0,
  }));
}

/**
 * Attaches color, percentage share, and rank to each category entry.
 */
export function enrichCategories(breakdown = []) {
  const total = breakdown.reduce((s, c) => s + c.total, 0);
  return breakdown.map((c, i) => ({
    name:    c._id,
    value:   c.total,
    count:   c.count,
    color:   COLORS[i % COLORS.length],
    share:   total > 0 ? ((c.total / total) * 100).toFixed(1) : '0',
    rank:    i + 1,
  }));
}

/**
 * Main analytics hook.
 * Fetches current month, previous month, full-year trend, recent expenses, and budgets.
 */
export function useAnalytics(month, year) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const pad = (n) => String(n).padStart(2, '0');

    try {
      const [pairRes, recentRes, budgetRes] = await Promise.all([
        analyticsAPI.getMonthPair(month, year),
        expenseAPI.getAll({
          startDate: `${year}-${pad(month)}-01`,
          endDate:   `${year}-${pad(month)}-31`,
          limit: 5,
        }),
        budgetAPI.getAll({ month, year }),
      ]);

      const { curr, prev, prevMonth, prevYear } = pairRes;

      const currCategories = enrichCategories(curr.categoryBreakdown);
      const prevCategories = enrichCategories(prev.categoryBreakdown);

      const currTotal = currCategories.reduce((s, c) => s + c.value, 0);
      const prevTotal = prevCategories.reduce((s, c) => s + c.value, 0);
      const pctChange = prevTotal > 0
        ? (((currTotal - prevTotal) / prevTotal) * 100).toFixed(1)
        : null;

      // Build per-category delta vs previous month
      const prevMap = Object.fromEntries(prevCategories.map((c) => [c.name, c.value]));
      const categoriesWithDelta = currCategories.map((c) => ({
        ...c,
        prevValue: prevMap[c.name] ?? 0,
        delta: prevMap[c.name] != null
          ? (((c.value - prevMap[c.name]) / prevMap[c.name]) * 100).toFixed(1)
          : null,
      }));

      setData({
        // Current month
        currTotal,
        currCount:      recentRes.data.total,
        currCategories: categoriesWithDelta,
        currMonthly:    buildMonthSeries(curr.monthlyTrend),

        // Previous month
        prevTotal,
        prevMonth,
        prevYear,
        prevCategories,

        // Derived
        pctChange,
        avgPerTx: recentRes.data.total > 0 ? currTotal / recentRes.data.total : 0,

        // Year comparison series (both years on same chart)
        comparisonSeries: buildComparisonSeries(curr.monthlyTrend, prev.monthlyTrend),

        // Supporting data
        recent:  recentRes.data.expenses,
        budgets: budgetRes.data.slice(0, 3),
      });
    } catch (err) {
      setError(err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
