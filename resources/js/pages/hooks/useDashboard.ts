// src/hooks/useDashboard.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type DashboardStats } from '../../services/api';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'stats'];

export function useDashboard() {
  const queryClient = useQueryClient();
  
  const query = useQuery<DashboardStats>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => adminApi.getStats(),
    staleTime: 60000,
    retry: 2,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  return {
    ...query,
    refresh,
    isRefreshing: query.isFetching,
  };
}