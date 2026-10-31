// resources/js/utils/scribeScanner.ts

export interface ScanResult {
  text: string;
  pdfBlob: Blob | null;
  docxBlob: Blob | null;
}

/**
 * Lazy-load scribe so its large code stays out of the main bundle
 * and is only fetched when a scan is actually started.
 */
let scribePromise: Promise<any> | null = null;

const getScribe = async () => {
  if (!scribePromise) {
    scribePromise = import('scribe.js-ocr').then((m: any) => m.default ?? m);
  }
  return scribePromise;
};

/**
 * Scribe inspects file.name and file.type with regexes. A raw Blob
 * (canvas export, camera capture) has no name, which causes
 * "Cannot read properties of undefined (reading 'match')".
 * Always hand scribe a real File with a name and a MIME type.
 */
const toNamedFile = (input: File | Blob): File => {
  const type = input.type || 'image/jpeg';

  const extByType: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tif',
  };
  const ext = extByType[type] ?? 'jpg';

  if (input instanceof File && input.name && input.type) {
    return input;
  }

  const name =
    input instanceof File && input.name ? input.name : `scan-${Date.now()}.${ext}`;

  return new File([input], name, { type });
};

/**
 * Scan an image or PDF with Scribe.js.
 * Returns extracted text plus optional PDF and DOCX blobs.
 *
 * Language files must be in public/tessdata/ (e.g. eng.traineddata.gz).
 */
export const scanDocument = async (
  file: File | Blob,
  onProgress?: (message: string) => void
): Promise<ScanResult> => {
  const scribe = await getScribe();

  // Configure self-hosted language data before any recognition
//   scribe.opt.langPath = '/tessdata';

  if (onProgress) {
    scribe.opt.progressHandler = (msg: any) => {
      if (msg?.type === 'recognize') {
        onProgress(`Recognizing text... ${Math.round((msg.progress || 0) * 100)}%`);
      } else if (msg?.type === 'export') {
        onProgress('Generating document...');
      }
    };
  }

  let doc: any;
  try {
    onProgress?.('Opening document...');
    doc = await scribe.openDocument([toNamedFile(file)]);
  } catch (err: any) {
    console.error('scribe.openDocument failed:', err);
    throw new Error(`Failed to open document: ${err?.message || 'Unknown error'}`);
  }

  try {
    onProgress?.('Running OCR...');
    await doc.recognize({
  langs: ['eng'],
  modeAdv: 'lstm',
});
  } catch (err: any) {
  console.error('recognize failed:', err);
  try { await doc.terminate(); } catch { /* ignore */ }
  throw new Error(`OCR failed: ${err?.message || String(err) || 'Recognition error'}`);
}

  let text = '';
  let pdfBlob: Blob | null = null;
  let docxBlob: Blob | null = null;

  try {
    onProgress?.('Extracting text...');
    text = await doc.exportData('text');
    if (typeof text !== 'string') text = String(text);
  } catch (err: any) {
    console.warn('Text export failed:', err);
  }

  try {
    onProgress?.('Generating PDF...');
    const pdfArrayBuffer = await doc.exportData('pdf');
    pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  } catch (err: any) {
    console.warn('PDF export failed:', err);
  }

  try {
    onProgress?.('Generating Word document...');
    const docxArrayBuffer = await doc.exportData('docx');
    docxBlob = new Blob([docxArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  } catch (err: any) {
    console.warn('DOCX export failed:', err);
  }

  try {
    await doc.terminate();
  } catch {
    /* ignore cleanup errors */
  }

  return { text, pdfBlob, docxBlob };
};

/**
 * Trigger a browser download for a Blob.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Check if language data is available before attempting a scan.
 */
export const checkLanguageData = async (): Promise<boolean> => {
  try {
    const res = await fetch('/tessdata/eng.traineddata.gz', { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    return res.ok && !type.includes('text/html');
  } catch {
    return false;
  }
};