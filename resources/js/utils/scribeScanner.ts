import { normalizeScanPage, type ScanPage } from './scanSelection';

export interface ScanResult {
  text: string;
  pages: ScanPage[];
  pageImage: (pageIndex: number) => Promise<string>;
  exportDocument: (format: 'pdf' | 'docx') => Promise<Blob>;
  close: () => Promise<void>;
}

let scribePromise: Promise<any> | null = null;
let sessionInUse = false;
const getScribe = () => {
  if (!scribePromise) {
    scribePromise = import('scribe.js-ocr').then((m: any) => m.default ?? m).catch(error => {
      scribePromise = null;
      throw error;
    });
  }
  return scribePromise;
};

function namedFile(input: File | Blob, fileName?: string): File {
  const name = fileName || (input instanceof File ? input.name : '') || 'document.jpg';
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  const types: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff', gif: 'image/gif' };
  const type = input.type && input.type !== 'application/octet-stream' ? input.type : types[extension];
  if (!type || (!type.startsWith('image/') && type !== 'application/pdf')) {
    throw new Error('Select an image or PDF document to scan.');
  }
  return new File([input], name, { type });
}

/** Own one session; never terminate the process-wide engine used by other documents. */
export async function scanDocument(file: File | Blob, onProgress?: (message: string) => void,
  options: { fileName?: string; signal?: AbortSignal } = {}): Promise<ScanResult> {
  if (sessionInUse) throw new Error('The previous scanner is finishing. Please try again in a moment.');
  sessionInUse = true;
  let doc: any = null;
  let scribe: any = null;
  let closed = false;
  const assertOpen = () => {
    if (options.signal?.aborted || closed) throw new DOMException('Scan cancelled', 'AbortError');
  };
  const close = async () => {
    if (closed) return;
    closed = true;
    try { if (doc) await doc.close(); }
    finally {
      sessionInUse = false;
    }
  };
  try {
    const input = namedFile(file, options.fileName);
    assertOpen();
    scribe = await getScribe();
    assertOpen();
    onProgress?.('Opening document…');
    doc = await scribe.openDocument([input]);
    assertOpen();
    doc.progressHandler = (message: any) => {
      if (!options.signal?.aborted && !closed && message?.type === 'recognize') onProgress?.('Recognizing document text…');
    };
    onProgress?.('Detecting words and their positions…');
    await doc.recognize({ langs: ['eng'], modeAdv: 'lstm', ocrPages: 'autoShallow', signal: options.signal });
    assertOpen();
    const pages = doc.pageMetrics.map((metrics: any, i: number) => normalizeScanPage(doc.ocr.active[i], metrics));
    const text = String(await doc.exportData('txt'));
    assertOpen();
    if (!text.trim() && !pages.some((page: ScanPage) => page.words.length)) {
      throw new Error('No readable text was found. Try a clearer image or another document.');
    }
    let operations: Promise<unknown> = Promise.resolve();
    const run = <T,>(operation: () => Promise<T>): Promise<T> => {
      const next = operations.then(() => { assertOpen(); return operation(); });
      operations = next.catch(() => {});
      return next;
    };
    return {
      text, pages,
      pageImage: (pageIndex) => run(async () => {
        if (!Number.isInteger(pageIndex) || !pages[pageIndex]) throw new Error('Invalid document page.');
        // Raw image and OCR boxes share this coordinate space; avoid deskewed/upscaled rasters.
        const image = await doc.images.getNative(pageIndex, { rotated: false, upscaled: false, colorMode: 'color' });
        const src = image?.ensureSrc?.() ?? image?.src;
        if (!src) throw new Error('The document page preview could not be loaded.');
        assertOpen();
        return src;
      }),
      exportDocument: (format) => run(async () => {
        const data = await doc.exportData(format);
        assertOpen();
        return new Blob([data], { type: format === 'pdf' ? 'application/pdf' :
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }),
      close: async () => { await operations; await close(); },
    };
  } catch (error) {
    await close().catch(() => {});
    throw error;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function checkLanguageData(): Promise<boolean> {
  try {
    const response = await fetch('/tessdata/eng.traineddata.gz', { method: 'HEAD' });
    return response.ok && !(response.headers.get('content-type') || '').includes('text/html');
  } catch { return false; }
}
