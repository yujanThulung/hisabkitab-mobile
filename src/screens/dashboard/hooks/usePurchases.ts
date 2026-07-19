import { useCallback, useEffect, useState } from 'react';
import { toast } from '../../../utils/toast';
import { expenseApi } from '../../../api/expense';
import type { Expense } from '../../../types/expense';

const PAGE_LIMIT = 20;

export function usePurchases() {
  const [items, setItems] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await expenseApi.getExpenses({
        page: pageNum,
        limit: PAGE_LIMIT,
        sortBy: 'date',
        sortOrder: 'desc',
      });
      const newItems = res.data?.items ?? [];
      setHasMore(res.data?.pagination?.hasMore ?? false);
      setItems((prev) => (pageNum === 1 ? newItems : [...prev, ...newItems]));
      setPage(pageNum);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to load expenses');
      }
      if (pageNum === 1) setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      fetchPage(page + 1);
    }
  }, [loading, refreshing, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return { items, loading, refreshing, hasMore, loadMore, refresh, reload: () => fetchPage(1) };
}