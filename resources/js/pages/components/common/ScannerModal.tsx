import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { scanDocument, downloadBlob, type ScanResult } from '../../../utils/scribeScanner';
import { nearestScanWord, selectedScanText } from '../../../utils/scanSelection';
import { ocrApi } from '../../../services/api';
import './scanner.css';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | Blob | null;
  fileName: string;
  documentId?: number;
  documentType?: 'student' | 'office';
  onTextExtracted: (text: string) => void;
}
type Range = { anchor: number; end: number };
const emptyRange: Range = { anchor: -1, end: -1 };

export default function ScannerModal({ isOpen, onClose, file, fileName, documentId,
  documentType, onTextExtracted }: ScannerModalProps) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [image, setImage] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageReady, setImageReady] = useState(false);
  const [range, setRange] = useState<Range>(emptyRange);
  const [draft, setDraft] = useState('');
  const [scope, setScope] = useState<'page' | 'document'>('page');
  const [zoom, setZoom] = useState(100);
  const [busy, setBusy] = useState(false);
  const session = useRef<ScanResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const rangeRef = useRef<Range>(emptyRange);
  const dragging = useRef<'range' | 'start' | 'end' | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const page = result?.pages[pageIndex];
  const usable = !!draft.trim();
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const baseName = fileName.replace(/\.[^/.]+$/, '') || 'document';

  useEffect(() => {
    generation.current++;
    controller.current?.abort();
    const old = session.current;
    session.current = null;
    void old?.close().catch(() => {});
    setStep('idle'); setResult(null); setDraft(''); setError(''); setMessage('');
    setPageIndex(0); setZoom(100); setBusy(false); setScope('page');
    setRange(emptyRange); rangeRef.current = emptyRange;
    return () => {
      generation.current++;
      controller.current?.abort();
      const current = session.current;
      session.current = null;
      void current?.close().catch(() => {});
    };
  }, [isOpen, file]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen]);

  useEffect(() => {
    let current = true;
    setImage(''); setImageError(''); setImageReady(false);
    if (result) {
      result.pageImage(pageIndex).then(src => { if (current) setImage(src); })
        .catch(err => { if (current) setImageError(err instanceof Error ? err.message : 'Page preview failed.'); });
    }
    return () => { current = false; };
  }, [result, pageIndex]);

  async function startScan() {
    if (!file || step === 'scanning') return;
    const current = ++generation.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setStep('scanning'); setError(''); setResult(null); setDraft('');
    try {
      await session.current?.close(); session.current = null;
      const scanned = await scanDocument(file, msg => {
        if (current === generation.current) setMessage(msg);
      }, { fileName, signal: abort.signal });
      if (current !== generation.current || abort.signal.aborted) { await scanned.close(); return; }
      session.current = scanned; setResult(scanned); setPageIndex(0);
      setStep('done'); setMessage('Select text on the document, then review your selection.');
    } catch (err) {
      if (current !== generation.current || abort.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'The document could not be scanned.');
      setStep('error');
    }
  }

  function choose(next: Range) {
    if (!page) return;
    rangeRef.current = next; setRange(next); setScope('page');
    setDraft(selectedScanText(page, next.anchor, next.end));
  }
  function changePage(next: number) {
    if (!result || next < 0 || next >= result.pages.length) return;
    setPageIndex(next); setDraft(''); setScope('page');
    rangeRef.current = emptyRange; setRange(emptyRange); dragging.current = null;
  }
  function pointerIndex(event: React.PointerEvent) {
    if (!surface.current || !page) return -1;
    const bounds = surface.current.getBoundingClientRect();
    return nearestScanWord(page, (event.clientX - bounds.left) / bounds.width * page.width,
      (event.clientY - bounds.top) / bounds.height * page.height);
  }
  function startPointer(event: React.PointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-word], [data-handle]');
    if (!target || !page || !imageReady || event.button !== 0) return;
    const index = pointerIndex(event);
    if (index < 0) return;
    event.preventDefault();
    const mode = target.dataset.handle as 'start' | 'end' | undefined;
    dragging.current = mode ?? 'range';
    const old = rangeRef.current;
    if (mode === 'start') choose({ anchor: index, end: Math.max(old.anchor, old.end) });
    else if (mode === 'end') choose({ anchor: Math.min(old.anchor, old.end), end: index });
    else choose({ anchor: event.shiftKey && old.anchor >= 0 ? old.anchor : index, end: index });
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const index = pointerIndex(event);
    if (index < 0) return;
    const old = rangeRef.current;
    choose(dragging.current === 'start' ? { anchor: index, end: old.end } : { anchor: old.anchor, end: index });
  }
  async function copyText() {
    try { await navigator.clipboard.writeText(draft); toast.success('Selected text copied'); }
    catch { textArea.current?.focus(); textArea.current?.select(); toast('Use Copy on your device or press Ctrl+C.'); }
  }
  async function saveText() {
    if (!usable || !documentId || !documentType || busy) return;
    const current = generation.current;
    setBusy(true);
    try {
      const response = await ocrApi.saveOCR({ document_id: documentId, document_type: documentType,
        extracted_text: draft, file_name: fileName });
      if (current !== generation.current) return;
      toast.success(response?.queued ? 'Selected text queued for sync' : 'Selected text saved to system');
    } catch (err) {
      if (current === generation.current) toast.error(err instanceof Error ? err.message : 'Selected text could not be saved.');
    } finally { if (current === generation.current) setBusy(false); }
  }
  async function exportFull(format: 'pdf' | 'docx') {
    if (!result || busy) return;
    const current = generation.current;
    setBusy(true);
    try {
      const blob = await result.exportDocument(format);
      if (current === generation.current) downloadBlob(blob, `${baseName}_full_scan.${format}`);
    } catch (err) {
      if (current === generation.current) toast.error(err instanceof Error ? err.message : 'Document export failed.');
    } finally { if (current === generation.current) setBusy(false); }
  }
  function trapKeys(event: React.KeyboardEvent) {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, select, summary, [tabindex="0"]') ?? [])
      .filter(element => element.getClientRects().length > 0);
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  if (!isOpen) return null;
  const low = Math.min(range.anchor, range.end), high = Math.max(range.anchor, range.end);
  const handle = (index: number, side: 'start' | 'end') => {
    const word = page?.words[index];
    if (!word || scope === 'document') return null;
    return <button type="button" className={`scanner-handle scanner-handle-${side}`} data-handle={side}
      aria-label={`Move selection ${side}`} style={{ left: `${(word.left + (side === 'end' ? word.width : 0)) / page!.width * 100}%`,
        top: `${(word.top + word.height) / page!.height * 100}%` }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault(); const next = Math.max(0, Math.min(page!.words.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
        choose(side === 'start' ? { anchor: next, end: high } : { anchor: low, end: next });
      }} />;
  };
  return <div className="modal-overlay scanner-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal scanner-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="scanner-title" onKeyDown={trapKeys}>
      <div className="modal-header"><div><h3 id="scanner-title">Scan &amp; select text</h3><p className="scanner-filename">{fileName}</p></div>
        <button type="button" className="modal-close" ref={closeButton} onClick={onClose} aria-label="Close scanner">×</button></div>
      {step !== 'done' ? <div className="modal-body scanner-start">
        {step === 'scanning' ? <><div className="spinner" /><p role="status">{message || 'Preparing scanner…'}</p><p className="text-sm text-slate-500">Large documents may take longer. You can close this window to cancel.</p></> :
          <><i className="fas fa-expand text-gold-500 text-3xl" aria-hidden="true" /><p>Detect text, select words directly on the document, and review before using them.</p>
            {error && <p className="text-red-700" role="alert">{error}</p>}
            <button type="button" className="btn btn-primary" onClick={startScan} disabled={!file}>{step === 'error' ? 'Try scanning again' : 'Detect text'}</button></>}
      </div> : <div className="scanner-layout">
        <section className="scanner-viewer" aria-label="Scanned document">
          <div className="scanner-toolbar"><div className="scanner-page-nav">
            <button type="button" className="btn btn-secondary btn-sm" aria-label="Previous page" disabled={pageIndex === 0} onClick={() => changePage(pageIndex - 1)}>‹</button>
            <span>Page {pageIndex + 1} of {result?.pages.length}</span>
            <button type="button" className="btn btn-secondary btn-sm" aria-label="Next page" disabled={!result || pageIndex === result.pages.length - 1} onClick={() => changePage(pageIndex + 1)}>›</button></div>
            <label className="scanner-zoom">Zoom <select aria-label="Document zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={100}>Fit</option><option value={150}>150%</option><option value={200}>200%</option></select></label></div>
          <p className="scanner-hint">Tap a word or drag across words. Drag the blue handles to adjust; Shift + click extends a selection.</p>
          <div className="scanner-scroll">
            {imageError ? <p className="scanner-preview-status" role="alert">{imageError} You can still select all document text on the right.</p> : !image ?
              <p className="scanner-preview-status" role="status">Loading page preview…</p> :
              <div ref={surface} className="scanner-paper" style={{ width: `${zoom}%`, aspectRatio: `${page?.width ?? 1} / ${page?.height ?? 1}` }}
                onPointerDown={startPointer} onPointerMove={movePointer} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }} onLostPointerCapture={() => { dragging.current = null; }}>
                <img src={image} alt={`Original document page ${pageIndex + 1}`} draggable={false} onLoad={() => setImageReady(true)} onError={() => { setImageReady(false); setImageError('The page image could not be displayed.'); }} />
                {imageReady && page?.words.map((word, i) => <button type="button" key={word.id} data-word={i} className={`scanner-word ${scope === 'document' || (low >= 0 && i >= low && i <= high) ? 'is-selected' : ''}`}
                  aria-label={`Select ${word.text}`} aria-pressed={scope === 'document' || (low >= 0 && i >= low && i <= high)}
                  style={{ left: `${word.left / page.width * 100}%`, top: `${word.top / page.height * 100}%`, width: `${word.width / page.width * 100}%`, height: `${word.height / page.height * 100}%` }}
                  onClick={event => { if (event.detail === 0) choose({ anchor: event.shiftKey && rangeRef.current.anchor >= 0 ? rangeRef.current.anchor : i, end: i }); }} />)}
                {imageReady && low >= 0 && <>{handle(low, 'start')}{handle(high, 'end')}</>}
              </div>}
          </div>
          {!page?.words.length && <p className="scanner-hint">No selectable word positions on this page. Use Select entire document to review the extracted text.</p>}
        </section>
        <section className="scanner-review" aria-label="Selected text review">
          <div className="scanner-review-heading"><h4>Selected text</h4><span aria-live="polite">{wordCount} words</span></div>
          <div className="scanner-selection-actions"><button type="button" className="btn btn-secondary btn-sm" disabled={!page?.words.length} onClick={() => choose({ anchor: 0, end: page!.words.length - 1 })}>Select page</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setScope('document'); setDraft(result?.text ?? ''); setRange(emptyRange); rangeRef.current = emptyRange; }}>Select entire document</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => choose(emptyRange)}>Clear</button></div>
          <label htmlFor="scanner-selected-text">{scope === 'document' ? 'Entire document · editable' : `Page ${pageIndex + 1} selection · editable`}</label>
          <textarea ref={textArea} id="scanner-selected-text" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Select words on the page to review and correct them here." />
          <p className="scanner-hint">Only this reviewed text is copied, applied, saved, or downloaded as TXT. Switching pages starts a new selection.</p>
          <div className="scanner-selection-actions">
            {documentId && documentType ? <button type="button" className="btn btn-primary" disabled={!usable || busy} onClick={saveText}>{busy ? 'Please wait…' : 'Save selected text to system'}</button> :
              <button type="button" className="btn btn-primary" disabled={!usable || busy} onClick={() => { onTextExtracted(draft); onClose(); }}>Apply selected text</button>}
            <button type="button" className="btn btn-secondary" disabled={!usable} onClick={copyText}>Copy</button>
            <button type="button" className="btn btn-secondary" disabled={!usable} onClick={() => downloadBlob(new Blob([draft], { type: 'text/plain;charset=utf-8' }), `${baseName}_selected.txt`)}>Download TXT</button>
          </div>
          <details className="scanner-exports"><summary>Full document exports</summary><p className="scanner-hint">PDF and Word contain the full scan. Selection edits above are included only in selected-text actions.</p>
            <div className="scanner-selection-actions"><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => exportFull('pdf')}>Full scan PDF</button><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => exportFull('docx')}>Full scan Word</button></div></details>
        </section>
      </div>}
    </div>
  </div>;
}
