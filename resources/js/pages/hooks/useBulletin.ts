import { useAuth } from './useAuth';
// src/hooks/useBulletin.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type BulletinPost } from "../../services/api";

export const BULLETIN_KEY = ["bulletin"];

export function useBulletin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<BulletinPost[]>({
    queryKey: [...BULLETIN_KEY, user?.id],
    queryFn: () => adminApi.getBulletin(),
    staleTime: 15000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: BULLETIN_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useCreateBulletin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => adminApi.createBulletin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BULLETIN_KEY });
    },
  });
}

export function useUpdateBulletin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateBulletin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BULLETIN_KEY });
    },
  });
}

export function useDeleteBulletin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteBulletin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BULLETIN_KEY });
    },
  });
}
