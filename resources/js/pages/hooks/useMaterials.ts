// src/hooks/useMaterials.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { facultyApi } from "../../services/api";

export const MATERIALS_KEY = ["faculty", "materials"];

export interface LearningMaterial {
  id: number;
  class_id: number;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  topic?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  creator?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

// ------------------------------------------------------------------
// LIST — all materials for one class
// ------------------------------------------------------------------
export function useClassMaterials(classId: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<LearningMaterial[]>({
    queryKey: [...MATERIALS_KEY, classId],
    queryFn: () => facultyApi.getClassMaterials(classId!),
    enabled: !!classId,
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, classId] });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

// ------------------------------------------------------------------
// UPLOAD — single file
// ------------------------------------------------------------------
export function useUploadMaterial(classId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      facultyApi.uploadMaterial(classId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, classId] });
    },
  });
}

// ------------------------------------------------------------------
// UPDATE — title / description / topic
// ------------------------------------------------------------------
export function useUpdateMaterial(classId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      facultyApi.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, classId] });
    },
  });
}

// ------------------------------------------------------------------
// DELETE
// ------------------------------------------------------------------
export function useDeleteMaterial(classId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facultyApi.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, classId] });
    },
  });
}

// ------------------------------------------------------------------
// Helpers — file visual + size formatting
// ------------------------------------------------------------------
export type IconName =
  | "fa-file-pdf"
  | "fa-file-image"
  | "fa-file-word"
  | "fa-file-excel"
  | "fa-file-powerpoint"
  | "fa-file-archive"
  | "fa-file-video"
  | "fa-file-audio"
  | "fa-file";

export interface FileVisual {
  icon: IconName;
  bg: string;
  fg: string;
}

export function getFileVisual(fileName: string): FileVisual {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf")
    return { icon: "fa-file-pdf", bg: "bg-red-50", fg: "text-red-600" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return { icon: "fa-file-image", bg: "bg-purple-50", fg: "text-purple-600" };
  if (["doc", "docx"].includes(ext))
    return { icon: "fa-file-word", bg: "bg-blue-50", fg: "text-blue-600" };
  if (["xls", "xlsx"].includes(ext))
    return { icon: "fa-file-excel", bg: "bg-emerald-50", fg: "text-emerald-600" };
  if (["ppt", "pptx"].includes(ext))
    return { icon: "fa-file-powerpoint", bg: "bg-orange-50", fg: "text-orange-600" };
  if (["zip", "rar", "7z"].includes(ext))
    return { icon: "fa-file-archive", bg: "bg-slate-100", fg: "text-slate-600" };
  if (["mp4", "mov", "avi", "mkv"].includes(ext))
    return { icon: "fa-file-video", bg: "bg-slate-100", fg: "text-navy-700" };
  if (["mp3", "wav", "aac"].includes(ext))
    return { icon: "fa-file-audio", bg: "bg-slate-100", fg: "text-navy-700" };
  return { icon: "fa-file", bg: "bg-slate-100", fg: "text-slate-600" };
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}