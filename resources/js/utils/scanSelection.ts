export interface ScanWord {
  id: string;
  text: string;
  line: number;
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface ScanPage { width: number; height: number; words: ScanWord[] }

/** Copy engine reading order and raw image coordinates, excluding unusable boxes. */
export function normalizeScanPage(page: any, metrics: any): ScanPage {
  const width = Number(page?.dims?.width ?? metrics?.dims?.width);
  const height = Number(page?.dims?.height ?? metrics?.dims?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('The scanner could not read the page dimensions.');
  }
  const words: ScanWord[] = [];
  (page?.lines ?? []).forEach((line: any, lineIndex: number) => {
    (line.words ?? []).forEach((word: any, wordIndex: number) => {
      const text = String(word.text ?? '').trim();
      const box = word.bbox;
      if (!text || !box || ![box.left, box.top, box.right, box.bottom].every(Number.isFinite)) return;
      const left = Math.max(0, Math.min(width, box.left));
      const top = Math.max(0, Math.min(height, box.top));
      const right = Math.max(left, Math.min(width, box.right));
      const bottom = Math.max(top, Math.min(height, box.bottom));
      if (right <= left || bottom <= top) return;
      words.push({ id: `${lineIndex}-${wordIndex}`, text, line: lineIndex,
        left, top, width: right - left, height: bottom - top });
    });
  });
  return { width, height, words };
}

export function selectedScanText(page: ScanPage, anchor: number, end: number): string {
  if (anchor < 0 || end < 0 || anchor >= page.words.length || end >= page.words.length) return '';
  const selected = page.words.slice(Math.min(anchor, end), Math.max(anchor, end) + 1);
  return selected.map((word, i) => `${i ? (word.line === selected[i - 1].line ? ' ' : '\n') : ''}${word.text}`).join('');
}

export function nearestScanWord(page: ScanPage, x: number, y: number): number {
  let distance = Infinity;
  let index = -1;
  page.words.forEach((word, i) => {
    const dx = Math.max(word.left - x, 0, x - word.left - word.width);
    const dy = Math.max(word.top - y, 0, y - word.top - word.height);
    const d = dx * dx + dy * dy;
    if (d < distance) { distance = d; index = i; }
  });
  return index;
}
