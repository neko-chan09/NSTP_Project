// src/hooks/useCertificates.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Certificate } from "../../services/api";

export const CERTIFICATES_KEY = ["certificates"];

export function useCertificates() {
  const queryClient = useQueryClient();

  const query = useQuery<Certificate[]>({
    queryKey: CERTIFICATES_KEY,
    queryFn: () => adminApi.getCertificates(),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useEligibleStudents(search?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["certificates", "eligible-students", search],
    queryFn: () => adminApi.getEligibleStudents(search),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["certificates", "eligible-students", search],
    });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useGenerateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      student_id,
      certificate_type,
      description,
      template_mode,
    }: {
      student_id: number;
      certificate_type: string;
      description?: string;
      template_mode?: "default" | "saved";
    }) =>
      adminApi.generateCertificate({
        student_id,
        certificate_type,
        description,
        template_mode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
    },
  });
}

export function useBatchGenerateCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      student_ids,
      certificate_type,
      template_mode,
    }: {
      student_ids: number[];
      certificate_type: string;
      template_mode?: "default" | "saved";
    }) => adminApi.batchGenerateCertificates({ student_ids, certificate_type, template_mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_KEY });
    },
  });
}
