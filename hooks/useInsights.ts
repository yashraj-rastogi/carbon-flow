import { useState, useCallback } from 'react';
import type { InsightItem } from '@/types';

interface UseInsightsReturn {
  insights: InsightItem[] | null;
  loading: boolean;
  error: string | null;
  fetchInsights: () => Promise<void>;
}

export function useInsights(token: string): UseInsightsReturn {
  const [insights, setInsights] = useState<InsightItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/insights', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      if (data.success && data.data?.insights) {
        setInsights(data.data.insights);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { insights, loading, error, fetchInsights };
}
