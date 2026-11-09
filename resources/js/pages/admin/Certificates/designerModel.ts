export type CertificateType = "completion" | "participation" | "training";
export type ElementKind = "text" | "image" | "line" | "qr";
export interface DesignElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  src: string;
  fontSize: number;
  fontFamily: "serif" | "sans-serif" | "monospace";
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
}
export interface CertificateDesign {
  version: 1;
  name: string;
  background: string;
  backgroundImage: string;
  border: "classic" | "double" | "none";
  accent: string;
  elements: DesignElement[];
}
export const PAGE_WIDTH = 1120;
export const PAGE_HEIGHT = 792;
export const FIELDS = [
  "student_name", "student_number", "course", "section", "component",
  "academic_year", "completion_date", "hours_completed", "certificate_number", "certificate_type",
] as const;
export const uid = () => crypto.randomUUID();
export function newElement(kind: ElementKind, overrides: Partial<DesignElement> = {}): DesignElement {
  return { id: uid(), kind, x: 340, y: 350, width: 440, height: 60,
    text: "Your text here", src: "", fontSize: 24, fontFamily: "serif", color: "#142440",
    bold: false, italic: false, align: "center", ...overrides };
}
export function createDesign(type: CertificateType = "completion", modern = false): CertificateDesign {
  const text = (id: string, y: number, value: string, fontSize: number, extra: Partial<DesignElement> = {}) =>
    newElement("text", { id, x: 100, y, width: 920, height: Math.ceil(fontSize * 1.6), text: value, fontSize, ...extra });
  return {
    version: 1, name: `NSTP ${type[0].toUpperCase() + type.slice(1)} Certificate`,
    background: modern ? "#ffffff" : "#fffdf7", backgroundImage: "", border: modern ? "double" : "classic", accent: "#c8a039",
    elements: [
      text("school", 88, "OPOL COMMUNITY COLLEGE", 22, { bold: true }),
      text("office", 128, "National Service Training Program", 18),
      newElement("line", { id: "divider", x: 430, y: 182, width: 260, height: 2, color: "#c8a039" }),
      text("heading", 211, "CERTIFICATE OF {{certificate_type}}", 38, { bold: true }),
      text("intro", 296, "This certifies that", 21, { italic: true }),
      text("student", 343, "{{student_name}}", 48, { bold: true, height: 76 }),
      text("details", 429, "{{student_number}}  •  {{course}}  •  {{section}}", 16),
      text("body", 480, "has successfully fulfilled the prescribed NSTP requirements", 21),
      text("component", 522, "{{component}}  •  Academic Year {{academic_year}}", 20, { bold: true }),
      text("date", 565, "Given on {{completion_date}}", 16),
      newElement("line", { id: "signature-left", x: 140, y: 665, width: 280, height: 1 }),
      newElement("line", { id: "signature-right", x: 700, y: 665, width: 280, height: 1 }),
      text("coordinator", 677, "NSTP Coordinator", 17, { x: 140, width: 280, bold: true }),
      text("dean", 677, "College Dean", 17, { x: 700, width: 280, bold: true }),
      newElement("qr", { id: "verification", x: 516, y: 634, width: 88, height: 88 }),
      text("number", 735, "{{certificate_number}}", 11, { fontFamily: "monospace" }),
    ],
  };
}
export function substitute(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (token, key) => values[key] ?? token);
}
export function clampElement(item: DesignElement): DesignElement {
  const width = Math.max(20, Math.min(PAGE_WIDTH, item.width));
  const height = Math.max(1, Math.min(PAGE_HEIGHT, item.height));
  return { ...item, width, height,
    x: Math.max(0, Math.min(PAGE_WIDTH - width, item.x)),
    y: Math.max(0, Math.min(PAGE_HEIGHT - height, item.y)) };
}
