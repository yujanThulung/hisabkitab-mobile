import { useState, useEffect, useCallback } from 'react';
import { toast } from '../../../utils/toast';
import {
  settlementApi,
  type SettlementPreview,
  type SettlementRecord,
} from '../../../api/settlement';

export interface UseSettlementReturn {
  preview: SettlementPreview | null;
  lastSettlement: SettlementRecord | null;
  loading: boolean;
  settling: boolean;
  refresh: () => Promise<void>;
  settle: () => Promise<boolean>;
}

export function useSettlement(): UseSettlementReturn {
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [lastSettlement, setLastSettlement] = useState<SettlementRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [previewRes, logsRes] = await Promise.all([
        settlementApi.getPreview(),
        settlementApi.getSettlements(),
      ]);
      setPreview(previewRes.data ?? null);
      setLastSettlement(logsRes.data?.[0] ?? null);
    } catch {
      // Silently leave both as null — screen shows appropriate empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const settle = useCallback(async (): Promise<boolean> => {
    setSettling(true);
    try {
      const body = preview
        ? { periodFrom: preview.periodFrom, periodTo: preview.periodTo }
        : undefined;
      const res = await settlementApi.createSettlement(body);
      setLastSettlement(res.data);
      setPreview(null);
      toast.success('All settled! New cycle starts from now.');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Settlement failed. Please try again.');
      return false;
    } finally {
      setSettling(false);
    }
  }, [preview]);

  return { preview, lastSettlement, loading, settling, refresh: fetchAll, settle };
}