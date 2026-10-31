// src/hooks/useGrades.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../services/api";

export const GRADES_KEY = ["grades"];

export interface GradeData {
  id: number;
  student_id: string;
  name: string;
  email: string;
  component: string;
  completed_hours: number;
  total_hours: number;
  percentage: number | null;
  grade: number | null;
  grade_label: string;
  grade_remarks: string | null;
  is_passing: boolean;
  status: string;
  grade_updated_at: string | null;
}

export interface GradeStats {
  total: number;
  excellent: number;
  good: number;
  satisfactory: number;
  deficient: number;
  ungraded: number;
  passing_rate: number;
  average_grade: number;
  average_grade_value: number;
}

export function useGrades(filters?: {
  component?: string;
  grade_status?: "passing" | "failing" | "ungraded";
  grade_level?: "excellent" | "good" | "satisfactory" | "deficient";
  search?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery<GradeData[]>({
    queryKey: [...GRADES_KEY, filters],
    queryFn: () => adminApi.getGrades(filters),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...GRADES_KEY, filters] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useGradeStats() {
  const queryClient = useQueryClient();

  const query = useQuery<GradeStats>({
    queryKey: [...GRADES_KEY, "stats"],
    queryFn: () => adminApi.getGradeStats(),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...GRADES_KEY, "stats"] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useGradeScale() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...GRADES_KEY, "scale"],
    queryFn: () => adminApi.getGradeScale(),
    staleTime: 3600000, // 1 hour
  });

  return query;
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADES_KEY });
      queryClient.invalidateQueries({ queryKey: [...GRADES_KEY, "stats"] });
    },
  });
}

export function useBatchUpdateGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      student_ids: number[];
      percentage: number;
      remarks?: string;
    }) => adminApi.batchUpdateGrades(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADES_KEY });
      queryClient.invalidateQueries({ queryKey: [...GRADES_KEY, "stats"] });
    },
  });
}

export function useRecalculateGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { component?: string }) =>
      adminApi.recalculateGrades(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADES_KEY });
      queryClient.invalidateQueries({ queryKey: [...GRADES_KEY, "stats"] });
    },
  });
}

// ============================================================
// EXPORT THE downloadGradeCSV FUNCTION - FIXED
// ============================================================
export async function downloadGradeCSV(component?: string) {
  const blob = await adminApi.exportGrades({ component });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grades_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
