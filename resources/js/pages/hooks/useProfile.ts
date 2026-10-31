// src/hooks/useProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../services/api";

export const PROFILE_KEY = ["profile", "me"];

export interface SelfProfile {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  role: "super_admin" | "admin" | "faculty" | "student";
  contact_number?: string;
  nstp_component?: "cwts" | "rotc" | "lts" | null;
  class_code?: string | null;
  course?: string | null;
  year_level?: number | null;
  section?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  full_name?: string;
  initials?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<SelfProfile>({
    queryKey: PROFILE_KEY,
    queryFn: () => profileApi.getProfile(),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
  };

  return { ...query, refresh, isRefreshing: query.isFetching };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      first_name?: string;
      last_name?: string;
      email?: string;
      contact_number?: string;
    }) => profileApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });

      // Also refresh the "user" entry in localStorage so the header
      // and sidebar reflect the new name/photo immediately
      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = { ...existing, ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
        window.dispatchEvent(new StorageEvent("storage"));
      } catch {
        /* ignore */
      }
    },
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => profileApi.uploadPhoto(formData),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });

      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = { ...existing, ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
        window.dispatchEvent(new StorageEvent("storage"));
      } catch {
        /* ignore */
      }
    },
  });
}

export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.deletePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });

      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        existing.profile_photo = null;
        existing.profile_photo_url = null;
        localStorage.setItem("user", JSON.stringify(existing));
        window.dispatchEvent(new StorageEvent("storage"));
      } catch {
        /* ignore */
      }
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
      confirmPassword,
    }: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) =>
      profileApi.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      ),
  });
}