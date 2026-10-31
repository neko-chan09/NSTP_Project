// src/hooks/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type AttendanceSession,
  type AttendanceLog,
} from "../../services/api";

export const ATTENDANCE_SESSIONS_KEY = ["attendance", "sessions"];

export function useAttendanceSessions(filters?: { class_id?: number }) {
  const queryClient = useQueryClient();

  const query = useQuery<AttendanceSession[]>({
    queryKey: [...ATTENDANCE_SESSIONS_KEY, filters],
    queryFn: () => adminApi.getAttendanceSessions(filters),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...ATTENDANCE_SESSIONS_KEY, filters] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useSessionLogs(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<AttendanceLog[]>({
    queryKey: ["attendance", "session", sessionId, "logs"],
    queryFn: () => adminApi.getSessionLogs(sessionId!),
    enabled: !!sessionId,
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["attendance", "session", sessionId, "logs"],
    });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => adminApi.createAttendanceSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_SESSIONS_KEY });
    },
  });
}

export function useCloseAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.closeAttendanceSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_SESSIONS_KEY });
    },
  });
}
