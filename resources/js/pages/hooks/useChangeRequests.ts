// src/hooks/useChangeRequests.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type ComponentChangeRequest } from "../../services/api";

export const CHANGE_REQUESTS_KEY = ["change-requests"];

export function useChangeRequests(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<ComponentChangeRequest[]>({
    queryKey: [...CHANGE_REQUESTS_KEY, status],
    queryFn: () => adminApi.getChangeRequests(status),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: [...CHANGE_REQUESTS_KEY, status],
    });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useHandleChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      admin_remarks,
    }: {
      id: number;
      status: "approved" | "rejected";
      admin_remarks?: string;
    }) => adminApi.handleChangeRequest(id, status, admin_remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANGE_REQUESTS_KEY });
    },
  });
}
