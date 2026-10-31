// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type Document,
  type DocumentResponse,
  type OfficeDocument,
} from "../../services/api";

export const DOCUMENTS_KEY = ["documents"];
export const OFFICE_DOCUMENTS_KEY = ["office-documents"];

export function useDocuments(filters?: {
  status?: string;
  student_id?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery<DocumentResponse>({
    queryKey: [...DOCUMENTS_KEY, filters],
    queryFn: () => adminApi.getDocuments(filters),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...DOCUMENTS_KEY, filters] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useOfficeDocuments(filters?: { category?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery<{ data: OfficeDocument[] }>({
    queryKey: [...OFFICE_DOCUMENTS_KEY, filters],
    queryFn: () => adminApi.getOfficeDocuments(filters),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: [...OFFICE_DOCUMENTS_KEY, filters],
    });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      rejection_reason,
    }: {
      id: number;
      status: "approved" | "rejected";
      rejection_reason?: string;
    }) => adminApi.verifyDocument(id, status, rejection_reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

export function useUploadOfficeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => adminApi.uploadOfficeDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFICE_DOCUMENTS_KEY });
    },
  });
}

export function useDeleteOfficeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteOfficeDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFICE_DOCUMENTS_KEY });
    },
  });
}
