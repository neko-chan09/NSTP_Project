// resources/js/hooks/useClasses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type ClassGroup,
  type CreateClassRequest,
  type UpdateClassRequest,
} from "../../services/api";

export const CLASSES_KEY = ["classes"];

export interface ClassFilters {
  component_type?: string;
  status?: string;
  search?: string;
  school_year?: string;
  academic_year_id?: number | string;
}

export function useClasses(filters?: ClassFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<ClassGroup[]>({
    queryKey: [...CLASSES_KEY, filters],
    queryFn: () => adminApi.getClasses(filters),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CLASSES_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useClassSchoolYears() {
  return useQuery<string[]>({
    queryKey: ["classes", "school-years"],
    queryFn: () => adminApi.getClassSchoolYears(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassRequest) => adminApi.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_KEY });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassRequest }) =>
      adminApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_KEY });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_KEY });
    },
  });
}

export function useToggleArchiveClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.toggleArchiveClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_KEY });
    },
  });
}

// NOTE: useRegenerateClassCode and useImportClasses/useImportClassEnrollments
// REMOVED — those features were removed.