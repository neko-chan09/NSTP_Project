// resources/js/hooks/useBackupSchedules.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminApi } from "../../services/api";
import type { BackupSchedule } from "../../types/api";

export const SCHEDULES_KEY = ["superadmin", "backup-schedules"];

export function useBackupSchedules() {
  const queryClient = useQueryClient();

  const query = useQuery<BackupSchedule[]>({
    queryKey: SCHEDULES_KEY,
    queryFn: () => superAdminApi.getBackupSchedules(),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useCreateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => superAdminApi.createBackupSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      superAdminApi.updateBackupSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useToggleBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superAdminApi.toggleBackupSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useRunBackupScheduleNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superAdminApi.runBackupScheduleNow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "backups"],
      });
    },
  });
}

export function useDeleteBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superAdminApi.deleteBackupSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function usePurgeOldBackups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => superAdminApi.purgeOldBackupsNow(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "backups"],
      });
    },
  });
}