// src/hooks/useImportStudents.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../services/api";

export const STUDENTS_KEY = ["students"];

export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => adminApi.importStudents(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["students", "stats"] });
    },
  });
}