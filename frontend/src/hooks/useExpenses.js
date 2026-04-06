import { useState, useEffect, useCallback } from 'react';
import { expenseAPI } from '../api';
import toast from 'react-hot-toast';

export function useExpenses(initialFilters = {}, initialPage = 1) {
  const [expenses, setExpenses]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(initialPage);
  const [filters, setFilters]     = useState(initialFilters);
  const [sort, setSort]           = useState({ field: 'date', dir: 'desc' });
  const [loading, setLoading]     = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await expenseAPI.getAll({
        page,
        limit: 10,
        sortField: sort.field,
        sortDir: sort.dir,
        ...activeFilters,
      });
      setExpenses(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, filters, sort]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const toggleSort = (field) => {
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  return { expenses, total, pages, page, setPage, filters, updateFilter, clearFilters, sort, toggleSort, loading, refetch: fetch };
}
