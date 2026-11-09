import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEligibleStudents } from "../../hooks/useCertificates";
import { designerApi } from "./designerApi";
import { clampElement, createDesign, FIELDS, newElement, PAGE_HEIGHT, PAGE_WIDTH, substitute, uid } from "./designerModel";
import type { CertificateDesign, CertificateType, DesignElement, ElementKind } from "./designerModel";
import "./designer.css";

const tools = [
  ["templates", "fa-th-large", "Templates"], ["text", "fa-font", "Text"],
  ["elements", "fa-shapes", "Elements"], ["uploads", "fa-image", "Uploads"],
  ["fields", "fa-user-graduate", "Student fields"], ["layers", "fa-layer-group", "Layers"],
] as const;
type Tool = typeof tools[number][0];
const fieldLabel = (field: string) => field.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const Icon = ({ name }: { name: string }) => <i aria-hidden="true" className={`fas ${name}`} />;

// Rasterize uploaded artwork so saved designs contain only self-contained PNG/JPEG images.
async function imageData(file: File): Promise<string> {
  if (!["image/png", "image/jpeg"].includes(file.type)) throw new Error("Choose a PNG or JPG image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("Could not read this image.")); image.src = url;
    });
    const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(img.width * ratio); canvas.height = Math.round(img.height * ratio);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing is unavailable.");
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL(file.type, 0.9);
    if (data.length > 2_000_000) throw new Error("This image is too detailed. Please use a smaller image.");
    return data;
  } finally { URL.revokeObjectURL(url); }
}

export default function CertificateDesigner() {
  const navigate = useNavigate();
  const [type, setType] = useState<CertificateType>("completion");
  const [design, setDesign] = useState<CertificateDesign>(() => createDesign());
  const [selectedId, setSelectedId] = useState<string | null>("student");
  const [tool, setTool] = useState<Tool>("fields");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saved, setSaved] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewStudent, setPreviewStudent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(0.6);
  const [undo, setUndo] = useState<CertificateDesign[]>([]);
  const [redo, setRedo] = useState<CertificateDesign[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const current = useRef(design); current.current = design;
  const dirty = JSON.stringify(design) !== saved;
  const selected = design.elements.find((item) => item.id === selectedId);
  const { data: students = [], isError: studentsError } = useEligibleStudents();
  const student = students.find((item: any) => String(item.id) === previewStudent);
  const eligibleCount = students.filter((item: any) => item.is_eligible_for_completion).length;
  const year = new Date().getFullYear();
  const values: Record<string, string> = {
    student_name: student ? `${student.user.first_name} ${student.user.last_name}` : "MARIA SANTOS",
    student_number: student?.student_id ?? "STU-0001", course: student?.course ?? "BSIT", section: student?.section ?? "A",
    component: student?.nstp_component_selected?.toUpperCase() ?? "CWTS", academic_year: `${year - 1}–${year}`,
    completion_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    hours_completed: "90", certificate_number: "NSTP-PREVIEW", certificate_type: type.toUpperCase(),
  };

  useEffect(() => {
    let active = true; setLoading(true); setLoadError(""); setPreview(false);
    designerApi.load(type).then((result) => {
      if (!active) return;
      const next = result?.design ?? createDesign(type);
      setDesign(next); setSaved(JSON.stringify(next)); setLastSaved(result?.saved_at ?? "");
      setUndo([]); setRedo([]); setSelectedId(null);
    }).catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, reload]);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(0.95, Math.max(0.15, (entry.contentRect.width - 48) / PAGE_WIDTH))));
    observer.observe(viewport.current); return () => observer.disconnect();
  }, [loading, loadError]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty && !loading) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, loading]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const commit = useCallback((next: CertificateDesign) => {
    setUndo((history) => [...history.slice(-39), current.current]); setRedo([]); setDesign(next);
  }, []);
  const patch = (changes: Partial<DesignElement>) => {
    if (!selected) return;
    commit({ ...design, elements: design.elements.map((item) => item.id === selected.id ? clampElement({ ...item, ...changes }) : item) });
  };
  const add = (kind: ElementKind, extra: Partial<DesignElement> = {}) => {
    if (design.elements.length >= 50) { toast.error("A certificate can contain up to 50 elements."); return; }
    const item = clampElement(newElement(kind, extra)); commit({ ...design, elements: [...design.elements, item] });
    setSelectedId(item.id); setPreview(false);
  };
  const deleteSelected = () => { if (selected) { commit({ ...design, elements: design.elements.filter((item) => item.id !== selected.id) }); setSelectedId(null); } };
  const undoChange = () => {
    if (!undo.length) return;
    setRedo((history) => [...history, design]); setDesign(undo[undo.length - 1]); setUndo(undo.slice(0, -1));
  };
  const redoChange = () => {
    if (!redo.length) return;
    setUndo((history) => [...history, design]); setDesign(redo[redo.length - 1]); setRedo(redo.slice(0, -1));
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input,textarea,select,button,[contenteditable]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redoChange() : undoChange(); }
      else if (!preview && (event.key === "Delete" || event.key === "Backspace")) { event.preventDefault(); deleteSelected(); }
      else if (!preview && selected && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); const step = event.shiftKey ? 10 : 1;
        patch({ x: selected.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), y: selected.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0) });
      }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  });

  const gesture = (event: React.PointerEvent, item: DesignElement, resize = false) => {
    if (preview || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); setSelectedId(item.id);
    const node = event.currentTarget as HTMLElement;
    (resize ? node.parentElement : node)?.focus({ preventScroll: true });
    node.setPointerCapture(event.pointerId);
    const start = current.current; const x = event.clientX; const y = event.clientY; const actualScale = page.current!.getBoundingClientRect().width / PAGE_WIDTH;
    let changed = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x) / actualScale; const dy = (ev.clientY - y) / actualScale;
      if (Math.abs(dx) + Math.abs(dy) < 2) return; changed = true;
      const next = clampElement({ ...item, ...(resize ? { width: Math.round(Math.max(20, Math.min(PAGE_WIDTH - item.x, item.width + dx))), height: Math.round(Math.max(1, Math.min(PAGE_HEIGHT - item.y, item.height + dy))) } : { x: Math.round(item.x + dx), y: Math.round(item.y + dy) }) });
      setDesign({ ...start, elements: start.elements.map((el) => el.id === item.id ? next : el) });
    };
    const end = () => {
      node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", end); node.removeEventListener("pointercancel", cancel);
      if (changed) { setUndo((history) => [...history.slice(-39), start]); setRedo([]); }
    };
    const cancel = () => { setDesign(start); changed = false; end(); };
    node.addEventListener("pointermove", move); node.addEventListener("pointerup", end); node.addEventListener("pointercancel", cancel);
  };
  const save = async (): Promise<boolean> => {
    setSaving(true); const snapshot = current.current;
    try { const result = await designerApi.save(type, snapshot); setSaved(JSON.stringify(snapshot)); setLastSaved(result.saved_at); toast.success("Template saved. It is ready in Generate."); return true; }
    catch (error: any) { toast.error(error.message); return false; }
    finally { setSaving(false); }
  };
  const pdfPreview = async () => {
    setPreviewing(true);
    try { const blob = await designerApi.preview(type, design, previewStudent ? Number(previewStudent) : undefined); setPreviewUrl(URL.createObjectURL(blob)); }
    catch (error: any) { toast.error(error.message); }
    finally { setPreviewing(false); }
  };
  const generate = async () => {
    if ((dirty || !lastSaved) && !(await save())) return;
    navigate(`/admin/certificates/generate?design=${type}`);
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>, background = false) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const src = await imageData(file);
      if (background) commit({ ...design, backgroundImage: src });
      else add("image", { src, text: file.name, x: 460, y: 75, width: 200, height: 110 });
    } catch (error: any) { toast.error(error.message); }
  };
  const replaceTemplate = (modern: boolean) => {
    if (!window.confirm("Replace the current canvas? You can undo this change.")) return;
    commit(createDesign(type, modern)); setSelectedId(null);
  };
  const reorder = (direction: number) => {
    if (!selected) return; const items = [...design.elements]; const index = items.findIndex((el) => el.id === selected.id);
    const next = Math.max(0, Math.min(items.length - 1, index + direction)); [items[index], items[next]] = [items[next], items[index]];
    commit({ ...design, elements: items });
  };
  const numberControl = (label: string, key: "x" | "y" | "width" | "height", min = 0) => selected && <label>{label}<input aria-label={label} type="number" min={min} max={key === "x" || key === "width" ? PAGE_WIDTH : PAGE_HEIGHT} value={selected[key]} onChange={(e) => patch({ [key]: Number(e.target.value) })} /></label>;

  return <div className="certificate-designer">
    <header className="cd-header">
      <div><p className="cd-eyebrow">CERTIFICATES / DESIGN STUDIO</p><h2>Certificate Designer <span className="cd-beta">A4 LANDSCAPE</span></h2>
        <p>Create once. Personalize for every graduate.</p></div>
      <div className="cd-actions"><button className="cd-button" disabled={loading || !!loadError || previewing} onClick={pdfPreview}><Icon name="fa-file-pdf" /> {previewing ? "Preparing…" : "PDF preview"}</button>
        <button className="cd-button" disabled={loading || !!loadError || saving} onClick={() => save()}><Icon name="fa-save" /> {saving ? "Saving…" : "Save template"}</button>
        <button className="cd-button cd-primary" disabled={loading || !!loadError || saving} onClick={generate}>Use in Generate <Icon name="fa-arrow-right" /></button></div>
    </header>
    {loading ? <div className="cd-state" role="status">Loading your saved design…</div> : loadError ? <div className="cd-state" role="alert"><p>Could not load the certificate design: {loadError}</p><button className="cd-button" onClick={() => setReload((n) => n + 1)}>Try again</button></div> : <>
      <div className="cd-documentbar">
        <input aria-label="Template name" maxLength={120} value={design.name} onChange={(e) => commit({ ...design, name: e.target.value })} />
        <span className={dirty ? "cd-unsaved" : "cd-saved"}>{dirty ? "● Unsaved changes" : lastSaved ? "✓ Saved to server" : "Starter template"}</span>
        <select aria-label="Certificate type" value={type} disabled={saving} onChange={(e) => { if (!dirty || window.confirm("Discard your unsaved changes and switch certificate type?")) setType(e.target.value as CertificateType); }}>
          <option value="completion">Completion</option><option value="participation">Participation</option><option value="training">Training</option>
        </select>
      </div>
      <div className="cd-workspace">
        <nav className="cd-tools" aria-label="Design tools">{tools.map(([id, icon, label]) => <button key={id} aria-pressed={tool === id} onClick={() => setTool(id)}><Icon name={icon} /><span>{label}</span></button>)}</nav>
        <aside className="cd-library">
          <h3>{tools.find(([id]) => id === tool)?.[2]}</h3>
          {tool === "fields" && <><p>Drag a field onto the page, or click to add it. Student details are filled automatically.</p><div className="cd-tip"><Icon name="fa-magic" /> One design, every graduate.</div>
            {FIELDS.map((field) => <button className="cd-field" key={field} draggable onDragStart={(e) => e.dataTransfer.setData("application/nstp-field", field)} onClick={() => add("text", { text: `{{${field}}}`, fontSize: field === "student_name" ? 44 : 20 })}><Icon name="fa-grip-vertical" /><span>{fieldLabel(field)}<small>{`{{${field}}}`}</small></span><Icon name="fa-plus" /></button>)}</>}
          {tool === "templates" && <><p>Start with an editable layout. All elements can be moved and changed.</p>{[false, true].map((modern) => <button className="cd-template" key={String(modern)} onClick={() => replaceTemplate(modern)}><div className={modern ? "cd-mini modern" : "cd-mini"}><small>OPOL COMMUNITY COLLEGE</small><strong>CERTIFICATE</strong><i>Student Name</i><span>___________________</span></div><b>{modern ? "Clean double border" : "Classic navy & gold"}</b></button>)}<button className="cd-button" onClick={() => { if (window.confirm("Start with a blank canvas? You can undo this change.")) commit({ ...createDesign(type), border: "none", elements: [] }); }}>Start blank</button></>}
          {tool === "text" && <><p>Add text, then use the toolbar or properties to style it.</p><button className="cd-text-add heading" onClick={() => add("text", { text: "Your heading", fontSize: 40, bold: true, height: 70 })}>Add a heading</button><button className="cd-text-add" onClick={() => add("text", { text: "Your subheading", fontSize: 26 })}>Add a subheading</button><button className="cd-text-add small" onClick={() => add("text", { text: "Add your certificate text", fontSize: 18 })}>Add body text</button></>}
          {tool === "elements" && <div className="cd-stack"><p>Add finishing details to your certificate.</p><button className="cd-button" onClick={() => add("line", { width: 300, height: 2, color: design.accent })}><Icon name="fa-minus" /> Divider line</button><button className="cd-button" onClick={() => add("qr", { width: 90, height: 90 })}><Icon name="fa-qrcode" /> Verification QR</button><button className="cd-button" onClick={() => { add("text", { text: "Authorized Signatory\nProgram Coordinator", fontSize: 18, width: 300, height: 65, y: 670 }); }}><Icon name="fa-signature" /> Signatory text</button><p>Upload a transparent PNG signature in Uploads and position it above the signatory.</p></div>}
          {tool === "uploads" && <div className="cd-stack"><p>Add your school logo, seal, or signature. PNG and JPG, up to 5 MB.</p><label className="cd-upload"><Icon name="fa-cloud-upload-alt" /> Upload image<input type="file" accept="image/png,image/jpeg" onChange={(e) => upload(e)} /></label><label className="cd-upload"><Icon name="fa-image" /> Upload background<input type="file" accept="image/png,image/jpeg" onChange={(e) => upload(e, true)} /></label>{design.backgroundImage && <button className="cd-button" onClick={() => commit({ ...design, backgroundImage: "" })}>Remove background image</button>}<p>Background artwork fills the page. Logos and signatures keep their proportions inside their resize box.</p></div>}
          {tool === "layers" && <><p>Top layers appear in front. Select a layer to edit it.</p>{[...design.elements].reverse().map((item) => <button className={`cd-layer ${selectedId === item.id ? "active" : ""}`} key={item.id} onClick={() => { setSelectedId(item.id); setPreview(false); }}><Icon name={item.kind === "text" ? "fa-font" : item.kind === "image" ? "fa-image" : item.kind === "qr" ? "fa-qrcode" : "fa-minus"} /><span>{item.kind === "text" ? item.text : item.kind === "qr" ? "Verification QR" : item.text || item.kind}</span></button>)}</>}
        </aside>
        <section className="cd-editor">
          <div className="cd-toolbar" role="toolbar" aria-label="Text formatting">
            <button title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!undo.length} onClick={undoChange}><Icon name="fa-undo" /></button><button title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!redo.length} onClick={redoChange}><Icon name="fa-redo" /></button><span className="cd-separator" />
            <select aria-label="Font family" disabled={selected?.kind !== "text"} value={selected?.fontFamily ?? "serif"} onChange={(e) => patch({ fontFamily: e.target.value as DesignElement["fontFamily"] })}><option value="serif">Classic serif</option><option value="sans-serif">Modern sans</option><option value="monospace">Monospace</option></select>
            <input aria-label="Font size" type="number" min={8} max={96} disabled={selected?.kind !== "text"} value={selected?.fontSize ?? 24} onChange={(e) => patch({ fontSize: Math.max(8, Math.min(96, Number(e.target.value))) })} />
            <button aria-label="Bold" aria-pressed={selected?.bold ?? false} disabled={selected?.kind !== "text"} onClick={() => patch({ bold: !selected?.bold })}><b>B</b></button><button aria-label="Italic" aria-pressed={selected?.italic ?? false} disabled={selected?.kind !== "text"} onClick={() => patch({ italic: !selected?.italic })}><i>I</i></button>
            {(["left", "center", "right"] as const).map((align) => <button key={align} aria-label={`Align ${align}`} aria-pressed={selected?.align === align} disabled={selected?.kind !== "text"} onClick={() => patch({ align })}><Icon name={`fa-align-${align}`} /></button>)}
            <input aria-label="Element color" title="Element color" type="color" disabled={!selected} value={selected?.color ?? "#142440"} onChange={(e) => patch({ color: e.target.value })} />
            <button className="cd-preview-toggle" aria-pressed={preview} onClick={() => setPreview(!preview)}><Icon name="fa-eye" /> {preview ? "Edit fields" : "Live preview"}</button>
          </div>
          <div className="cd-viewport" ref={viewport}>
            <div className="cd-paper-space" style={{ width: PAGE_WIDTH * scale * zoom, height: PAGE_HEIGHT * scale * zoom }}>
              <div className={`cd-paper cd-border-${design.border}`} ref={page} style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${scale * zoom})`, backgroundColor: design.background, "--cd-accent": design.accent } as React.CSSProperties}
                onPointerDown={() => setSelectedId(null)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const field = e.dataTransfer.getData("application/nstp-field"); if (!FIELDS.includes(field as any)) return; const rect = page.current!.getBoundingClientRect(); const factor = rect.width / PAGE_WIDTH; add("text", { text: `{{${field}}}`, x: (e.clientX - rect.left) / factor, y: (e.clientY - rect.top) / factor, width: 400, height: 60 }); }}>
                {design.backgroundImage && <img className="cd-background" src={design.backgroundImage} alt="Certificate background" draggable={false} />}
                {design.border !== "none" && <div className="cd-border-art" />}
                {design.elements.map((item) => <div key={item.id} role="button" tabIndex={preview ? -1 : 0} aria-label={`${item.kind}: ${item.text || "Verification QR"}`} aria-pressed={selectedId === item.id} className={`cd-element ${!preview && selectedId === item.id ? "selected" : ""} ${preview ? "preview" : ""}`}
                  style={{ left: item.x, top: item.y, width: item.width, height: item.height }} onPointerDown={(e) => gesture(e, item)} onFocus={() => { if (!preview) setSelectedId(item.id); }} onClick={(e) => e.stopPropagation()}>
                  {item.kind === "text" && <div className="cd-element-text" style={{ fontFamily: item.fontFamily === "serif" ? '"DejaVu Serif", Georgia, serif' : item.fontFamily === "sans-serif" ? '"DejaVu Sans", Arial, sans-serif' : '"DejaVu Sans Mono", monospace', fontSize: item.fontSize, color: item.color, fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal", textAlign: item.align }}>{preview ? substitute(item.text, values) : item.text}</div>}
                  {item.kind === "image" && <img src={item.src} alt={item.text || "Certificate artwork"} draggable={false} />}
                  {item.kind === "line" && <div style={{ width: "100%", height: "100%", background: item.color }} />}
                  {item.kind === "qr" && <div className="cd-qr-placeholder"><Icon name="fa-qrcode" /><small>Verify certificate</small></div>}
                  {!preview && selectedId === item.id && <><span className="cd-element-label">{item.kind === "text" ? `${item.fontSize}px` : item.kind}</span><button aria-label="Resize selected element" className="cd-resize" onPointerDown={(e) => gesture(e, item, true)} /></>}
                </div>)}
              </div>
            </div>
          </div>
          <footer className="cd-canvas-footer"><span><Icon name="fa-lock" /> A4 · 297 × 210 mm <span className="cd-footer-hint"> / Drag to move · corner to resize</span></span><div><button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))}>−</button><button title="Fit page" onClick={() => setZoom(1)}>{Math.round(scale * zoom * 100)}%</button><button aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button></div></footer>
        </section>
        <aside className="cd-properties">
          <h3><Icon name="fa-sliders-h" /> {selected ? "Element properties" : "Certificate settings"}</h3>
          {selected ? <div className="cd-stack">
            {selected.kind === "text" && <label>Text content<textarea aria-label="Text content" rows={4} maxLength={2000} value={selected.text} onChange={(e) => patch({ text: e.target.value })} /></label>}
            <div className="cd-number-grid">{numberControl("Left", "x")}{numberControl("Top", "y")}{numberControl("Width", "width", 20)}{numberControl("Height", "height", 1)}</div>
            <div className="cd-button-grid"><button className="cd-button" onClick={() => reorder(-1)}><Icon name="fa-arrow-down" /> Backward</button><button className="cd-button" onClick={() => reorder(1)}><Icon name="fa-arrow-up" /> Forward</button></div>
            <button className="cd-button" onClick={() => add(selected.kind, { ...selected, id: uid(), x: selected.x + 20, y: selected.y + 20 })}><Icon name="fa-copy" /> Duplicate element</button><button className="cd-button cd-delete" onClick={deleteSelected}><Icon name="fa-trash" /> Delete element</button>
            {selected.kind === "qr" && <p>The actual QR code is generated in the PDF and links to this certificate’s verification page.</p>}
            <button className="cd-link" onClick={() => setSelectedId(null)}>Back to certificate settings</button>
          </div> : <div className="cd-stack"><label>Page background<input aria-label="Page background" type="color" value={design.background} onChange={(e) => commit({ ...design, background: e.target.value })} /></label><label>Border style<select value={design.border} onChange={(e) => commit({ ...design, border: e.target.value as CertificateDesign["border"] })}><option value="classic">Classic navy & gold</option><option value="double">Double border</option><option value="none">No border</option></select></label><label>Accent color<input aria-label="Accent color" type="color" value={design.accent} onChange={(e) => commit({ ...design, accent: e.target.value })} /></label><p>Click an element to edit its content, position, or size.</p></div>}
          <div className="cd-property-section"><h4><Icon name="fa-user" /> Preview student</h4><select aria-label="Preview student" value={previewStudent} onChange={(e) => { setPreviewStudent(e.target.value); setPreview(true); }}><option value="">Sample: Maria Santos</option>{students.map((s: any) => <option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name}</option>)}</select><p>Live preview uses sample dates and hours. PDF preview uses the student’s stored data and current academic year.</p></div>
          <div className="cd-graduates"><span>ELIGIBLE GRADUATES</span><strong>{studentsError ? "—" : eligibleCount}<small> students</small></strong><p>{studentsError ? "Student list unavailable. You can still design with sample data." : "Review and select recipients in Generate."}</p><button className="cd-button" disabled={saving} onClick={generate}>Review recipients <Icon name="fa-arrow-right" /></button></div>
        </aside>
      </div>
      <p className="cd-footnote">Save a separate design for each certificate type. Issued certificates keep their original PDF when you update a template.</p>
    </>}
    {previewUrl && <div className="cd-modal" role="dialog" aria-modal="true" aria-label="Certificate PDF preview"><div className="cd-modal-body"><header><h3>PDF preview · not issued</h3><a className="cd-button" href={previewUrl} download="certificate-preview.pdf">Download preview</a><button className="cd-button" onClick={() => setPreviewUrl(null)}>Close</button></header><iframe src={previewUrl} title="Certificate PDF preview" /></div></div>}
  </div>;
}
