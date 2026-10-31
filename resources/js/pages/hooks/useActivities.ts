// src/hooks/useActivities.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Activity } from "../../services/api";

export const ACTIVITIES_KEY = ["activities"];

export function useActivities() {
  const queryClient = useQueryClient();

  const query = useQuery<Activity[]>({
    queryKey: ACTIVITIES_KEY,
    queryFn: () => adminApi.getActivities(),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => adminApi.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
    },
  });
}
