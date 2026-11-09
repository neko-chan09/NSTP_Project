import { API_URL } from "../../../services/api";
import { getToken } from "../../../lib/token";
import type { CertificateDesign, CertificateType } from "./designerModel";

export interface SavedDesign { design: CertificateDesign; saved_at: string }
async function request(type: CertificateType, method = "GET", body?: unknown, preview = false) {
  // Existing installations may still have the API's stale-while-revalidate service worker.
  // A unique read URL prevents it from restoring an older template after a save.
  const fresh = method === "GET" ? `?fresh=${Date.now()}` : "";
  const response = await fetch(`${API_URL}/admin/certificates/design/${type}${preview ? "/preview" : ""}${fresh}`, {
    method, cache: "no-store",
    headers: { Accept: preview ? "application/pdf" : "application/json", "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = Object.values(error.errors ?? {}).flat().join(" ");
    throw new Error(detail || error.message || `Request failed (${response.status})`);
  }
  return response;
}
export const designerApi = {
  load: async (type: CertificateType): Promise<SavedDesign | null> => (await (await request(type)).json()).data,
  save: async (type: CertificateType, design: CertificateDesign): Promise<SavedDesign> =>
    (await (await request(type, "PUT", { design })).json()).data,
  preview: async (type: CertificateType, design: CertificateDesign, studentId?: number): Promise<Blob> =>
    (await request(type, "POST", { design, student_id: studentId }, true)).blob(),
};
