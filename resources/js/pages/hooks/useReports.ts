// src/hooks/useReports.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../services/api";

// Make sure this is defined
export function useAccomplishmentReport(params?: {
    component?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["reports", "accomplishment", params],
        queryFn: () => adminApi.getAccomplishmentReport(params),
        staleTime: 120000,
        retry: 1,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["reports", "accomplishment", params] });
    };

    return { ...query, refresh, isRefreshing: query.isFetching };
}

// Export the download functions
export async function downloadAccomplishmentPDF(params?: {
    component?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}) {
    const blob = await adminApi.downloadAccomplishmentPDF(params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accomplishment_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function exportAccomplishmentCSV(params?: {
    component?: string;
    status?: string;
}) {
    const blob = await adminApi.exportAccomplishmentCSV(params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accomplishment_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function useEnrollmentReport() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reports", "enrollment"],
    queryFn: () => adminApi.getEnrollmentReport(),
    staleTime: 120000,
    retry: 1,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["reports", "enrollment"] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useDeficiencyReport() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reports", "deficiency"],
    queryFn: () => adminApi.getDeficiencyReport(),
    staleTime: 120000,
    retry: 1,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["reports", "deficiency"] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useAttendanceReport(params: {
  start_date: string;
  end_date: string;
  component?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reports", "attendance", params],
    queryFn: () => adminApi.getAttendanceReport(params),
    enabled: !!params.start_date && !!params.end_date,
    staleTime: 120000,
    retry: 2,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["reports", "attendance", params],
    });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
  
}
