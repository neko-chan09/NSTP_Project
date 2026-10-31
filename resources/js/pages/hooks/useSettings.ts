// src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type SystemSettings } from "../../services/api";

export const SETTINGS_KEY = ["settings"];

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<SystemSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: () => adminApi.getSettings(),
    staleTime: 120000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SystemSettings>) =>
      adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
