// src/hooks/useStudents.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminApi } from "../../services/api";
import type { Student, StudentResponse } from "../../types/api";

export interface StudentFilters {
  search?: string;
  component?: string;
  status?: string;
  eligible?: string;
  course?: string;
  section?: string;
  page?: number;
  per_page?: number;
}

export const STUDENTS_KEY = ["students"];

export function useStudents(filters: StudentFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<StudentResponse>({
    queryKey: [...STUDENTS_KEY, filters],
    queryFn: () => adminApi.getStudents(filters),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
  
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...STUDENTS_KEY, filters] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useStudent(id: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<Student>({
    queryKey: ["student", id],
    queryFn: () => adminApi.getStudent(id!),
    enabled: !!id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["student", id] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useStudentStats() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["students", "stats"],
    queryFn: () => adminApi.getStudentStats(),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["students", "stats"] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Student>) => adminApi.createStudent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      qc.invalidateQueries({ queryKey: ["students", "stats"] });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Student> }) =>
      adminApi.updateStudent(id, payload),
    onSuccess: (updated, { id }) => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      qc.setQueryData(["student", id], updated);
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      qc.invalidateQueries({ queryKey: ["students", "stats"] });
    },
  });
}

export function useBulkDeleteStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => adminApi.bulkDeleteStudents(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      qc.invalidateQueries({ queryKey: ["students", "stats"] });
    },
  });
}

export async function downloadStudentCsv(component?: string) {
  const blob = await adminApi.exportStudents({ component });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
