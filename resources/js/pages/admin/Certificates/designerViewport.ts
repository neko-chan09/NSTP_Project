import { PAGE_WIDTH, PAGE_HEIGHT } from "./designerModel";

export function fitCertificateScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0.15;
  return Math.max(0.1, Math.min(1, (width - 48) / PAGE_WIDTH, (height - 48) / PAGE_HEIGHT));
}
