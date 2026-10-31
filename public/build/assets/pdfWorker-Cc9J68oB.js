import { s as setupEncryption, i as isAsciiDigit, a as isPdfWhitespace, b as bytesEqualAt, m as matchesObjMarker, c as byteIndexOf, d as bytesToLatin1, o as objTextEnd, f as findRootObjNum, r as resolveDictValue, e as resolveArrayValue, g as extractStream, h as aesDecrypt, j as computeObjectKey, k as rc4, p as parsePdfLiteralString, l as parsePdfHexString, n as resolveIntValue, q as derefStringToken, t as decodePdfString, u as resolveNameValue, v as decodePdfName, w as extractDict, x as parseDictEntries, y as parsePdfDate, z as getPageContentStream, A as tokenizeContentStream, B as findFormXObjects, C as parseFormMatrix, D as matMul, E as getRandomAlphanum, F as cmykToRgb, G as quantile, O as OcrPar, H as calcBboxUnion, I as range, J as parsePageFonts, K as substituteFaceResourceEntries, L as getPageContentStreams, M as patchPageContents, N as ocr, P as extractPdfAnnotations, Q as pdfHighlightToAnnotation, R as pdfFreeTextToAnnotation, S as pdfTextAnnotToAnnotation, T as pdfShapeToAnnotation, U as pdfRedactToAnnotations, V as calcLang, W as round3, X as formatPdfNumber, Y as resolveNumValue, Z as findTopLevelKeyIndex, _ as serializeContentToken, $ as applyTextPatchRecords, a0 as parseFormBBox, a1 as glyphInkBox, a2 as cleanFamilyName, a3 as mean50, a4 as parseTintColorSpace, a5 as tintComponentsToRGB, a6 as decodeTextCodes, a7 as round6, a8 as opentype, a9 as extendedFamilyToBuiltInFont, aa as base14ToBuiltInFont, ab as cssFamilyToBuiltInFont, ac as standardFontToCSS, ad as genericToBuiltInFont, ae as cssGenericForFontObj, af as findXrefOffset, ag as parseXref, ah as getPageObjects, ai as ensureSubstituteFacesForRecords, aj as glyphCopies, ak as fontCodeTable, al as loadSubstituteProgram, am as ensureSubstituteFace, an as substituteFaceByObjNum, ao as locateWords, ap as planTextEdit, aq as editsFromPlans, ar as rewriteShowOperator, as as glyphVisible, at as recordFaceTag, au as charStateKey, av as drawnPen, aw as ca, ax as enumerateType3Fonts, ay as buildType3OpentypeFont, az as unregisterFontFacesMatching, aA as segmentAt } from "./base14Substitution-CpDFdGXj.js";
const TEXT_CACHE_BUDGET_CHARS = 32 * 1024 * 1024;
const OBJ_STM_CACHE_BUDGET_CHARS = 32 * 1024 * 1024;
const STREAM_BYTES_CACHE_BUDGET = 128 * 1024 * 1024;
let _objectCacheDocIdCounter = 0;
class ObjectCache {
  /**
   * @param {Uint8Array} pdfBytes
   * @param {{ [objNum: number]: any }} xrefEntries
   */
  constructor(pdfBytes, xrefEntries) {
    this.pdfBytes = pdfBytes;
    this.xrefEntries = xrefEntries;
    this.docId = ++_objectCacheDocIdCounter;
    this.textCache = /* @__PURE__ */ new Map();
    this.textCacheChars = 0;
    this.syntheticObjects = /* @__PURE__ */ new Map();
    this.objStmCache = /* @__PURE__ */ new Map();
    this.objStmCacheChars = 0;
    this.fontCache = /* @__PURE__ */ new Map();
    this.fontConversionCache = /* @__PURE__ */ new Map();
    this.fontBytesCache = /* @__PURE__ */ new Map();
    this.streamBytesCache = /* @__PURE__ */ new Map();
    this.streamBytesCacheBytes = 0;
    this.decodedImageCache = /* @__PURE__ */ new Map();
    this.decodedImageCacheBytes = 0;
    this.iccProfileCache = /* @__PURE__ */ new Map();
    this.encryptionKey = null;
    this.encryptObjNum = 0;
    this.cipherMode = "RC4";
    this.filtersUsed = /* @__PURE__ */ new Set();
    this.unsupportedFilters = /* @__PURE__ */ new Set();
    this.recoveredStreamObjs = /* @__PURE__ */ new Set();
    this.lastContentStreamsRecovered = [];
    this.xrefSeverelyCorrupt = false;
    this._offOCGs = null;
    this._xrefRepaired = false;
    const fileLen = this.pdfBytes.length;
    for (const entry of Object.values(this.xrefEntries)) {
      if (entry.type === 1 && entry.offset >= fileLen) {
        this.xrefSeverelyCorrupt = true;
        break;
      }
    }
    setupEncryption(this);
  }
  /**
   * Insert an entry into `textCache`, evicting FIFO entries while the total
   * cached character count exceeds the budget. FIFO (insertion-order) eviction
   * was chosen over LRU because PDF parsing is mostly read-once per object;
   * the LRU "touch on hit" cost (delete+set on every cache lookup) was a
   * significant overhead with no meaningful hit-rate benefit in practice.
   * @param {number} objNum
   * @param {string} content
   */
  _putText(objNum, content) {
    this.textCache.set(objNum, content);
    this.textCacheChars += content.length;
    while (this.textCacheChars > TEXT_CACHE_BUDGET_CHARS && this.textCache.size > 1) {
      const firstKey = this.textCache.keys().next().value;
      const evicted = this.textCache.get(firstKey);
      this.textCache.delete(firstKey);
      this.textCacheChars -= evicted.length;
    }
  }
  _repairXref() {
    const bytes = this.pdfBytes;
    const len = bytes.length;
    const scanIndex = {};
    let pos = 0;
    while (pos < len) {
      while (pos < len && !isAsciiDigit(bytes[pos])) pos++;
      if (pos >= len) break;
      if (pos > 0 && isAsciiDigit(bytes[pos - 1])) {
        while (pos < len && isAsciiDigit(bytes[pos])) pos++;
        continue;
      }
      const numStart = pos;
      let objNum = 0;
      while (pos < len && isAsciiDigit(bytes[pos])) {
        objNum = objNum * 10 + (bytes[pos] - 48);
        pos++;
      }
      if (pos >= len || !isPdfWhitespace(bytes[pos])) {
        pos = numStart + 1;
        continue;
      }
      while (pos < len && isPdfWhitespace(bytes[pos])) pos++;
      if (pos >= len || !isAsciiDigit(bytes[pos])) {
        pos = numStart + 1;
        continue;
      }
      while (pos < len && isAsciiDigit(bytes[pos])) pos++;
      if (pos >= len || !isPdfWhitespace(bytes[pos])) {
        pos = numStart + 1;
        continue;
      }
      while (pos < len && isPdfWhitespace(bytes[pos])) pos++;
      if (!bytesEqualAt(bytes, pos, "obj")) {
        pos = numStart + 1;
        continue;
      }
      const after = pos + 3;
      if (after < len) {
        const c = bytes[after];
        if (isAsciiDigit(c) || c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 95) {
          pos = numStart + 1;
          continue;
        }
      }
      scanIndex[objNum] = numStart;
      pos = after;
    }
    for (const objNumStr of Object.keys(scanIndex)) {
      const objNum = Number(objNumStr);
      const scannedOffset = scanIndex[objNum];
      const entry = this.xrefEntries[objNum];
      if (!entry || entry.type === 0) {
        this.xrefEntries[objNum] = { type: 1, offset: scannedOffset };
      } else if (entry.type === 1) {
        if (!matchesObjMarker(bytes, entry.offset, objNum)) entry.offset = scannedOffset;
      }
    }
    for (const objNumStr of Object.keys(this.xrefEntries)) {
      const objNum = Number(objNumStr);
      const entry = this.xrefEntries[objNum];
      if (entry && entry.type === 1 && !scanIndex[objNum]) {
        if (!matchesObjMarker(bytes, entry.offset, objNum)) delete this.xrefEntries[objNum];
      }
    }
    if (this.xrefSeverelyCorrupt) {
      let anyStillBad = false;
      for (const objNumStr of Object.keys(this.xrefEntries)) {
        const objNum = Number(objNumStr);
        const entry = this.xrefEntries[objNum];
        if (!entry || entry.type !== 1) continue;
        if (entry.offset >= len || !matchesObjMarker(bytes, entry.offset, objNum)) {
          anyStillBad = true;
          break;
        }
      }
      if (!anyStillBad) this.xrefSeverelyCorrupt = false;
    }
  }
  /**
   * Get the text content of an object (the dictionary/value part, not including "N 0 obj").
   * @param {number} objNum
   * @returns {string|null}
   */
  getObjectText(objNum) {
    const synthetic = this.syntheticObjects.get(objNum);
    if (synthetic !== void 0) return synthetic.text;
    const cached = this.textCache.get(objNum);
    if (cached !== void 0) return cached;
    let content = this._readObjectTextDirect(objNum);
    if (content === null && !this._xrefRepaired) {
      this.ensureXrefRepaired();
      content = this._readObjectTextDirect(objNum);
    }
    if (content !== null) this._putText(objNum, content);
    return content;
  }
  /**
   * Ensure the full-file xref repair scan has run.
   */
  ensureXrefRepaired() {
    if (this._xrefRepaired) return;
    this._xrefRepaired = true;
    this._repairXref();
  }
  /**
   * Reads an object's dictionary text directly from its xref entry.
   * Unlike `getObjectText`, it does not cache the result and does not trigger a lazy xref repair.
   * Returns null when the entry is missing or free, when a type-1 offset does not point at the object's
   * "N G obj" header, or when a compressed object is absent from its object stream.
   * @param {number} objNum
   * @returns {string|null}
   */
  _readObjectTextDirect(objNum) {
    const bytes = this.pdfBytes;
    const entry = this.xrefEntries[objNum];
    if (!entry) return null;
    if (entry.type === 1) {
      const offset = entry.offset;
      if (!matchesObjMarker(bytes, offset, objNum)) return null;
      const endObj = byteIndexOf(bytes, "endobj", offset);
      if (endObj === -1) return null;
      const objStart = byteIndexOf(bytes, "obj", offset);
      if (objStart === -1 || objStart >= endObj) return null;
      return bytesToLatin1(bytes, objStart + 3, objTextEnd(bytes, objStart, endObj)).trim();
    }
    if (entry.type === 2) {
      this.decompressObjStm(entry.objStmNum);
      const cachedStm = this.objStmCache.get(entry.objStmNum);
      const stmText = cachedStm ? cachedStm.get(objNum) : void 0;
      if (stmText !== void 0) return stmText;
    }
    return null;
  }
  /**
   * Returns the set of OCG object numbers that should be hidden when rendering
   * for on-screen viewing. Computed lazily on first call from:
   *   1. /OCProperties/D/OFF[...] — explicitly hidden OCGs
   *   2. /OCProperties/D/AS[...] — auto-state entries with /Event/View; for
   *      each listed OCG, /Usage/View/ViewState=/OFF marks it hidden in View
   *      mode (used to author print-only watermarks).
   * Cached for the lifetime of the ObjectCache. Always returns the same Set
   * instance so callers may compare or short-circuit on identity.
   */
  getOffOCGs() {
    if (this._offOCGs !== null) return this._offOCGs;
    const off = /* @__PURE__ */ new Set();
    const rootObjNum = findRootObjNum(this.pdfBytes);
    if (rootObjNum != null) {
      const catText = this.getObjectText(rootObjNum);
      if (catText) {
        const ocpText = resolveDictValue(catText, "OCProperties", this);
        if (ocpText) {
          const dText = resolveDictValue(ocpText, "D", this) || ocpText;
          const offContent = resolveArrayValue(dText, "OFF", this);
          if (offContent != null) {
            for (const m of offContent.matchAll(/(\d+)\s+\d+\s+R/g)) off.add(Number(m[1]));
          }
          const asBody = resolveArrayValue(dText, "AS", this);
          if (asBody != null) {
            let j = 0;
            while (j < asBody.length) {
              const dictOpen = asBody.indexOf("<<", j);
              if (dictOpen === -1) break;
              let dDepth = 0;
              let dictEnd = -1;
              for (let k = dictOpen; k < asBody.length - 1; k++) {
                if (asBody[k] === "<" && asBody[k + 1] === "<") {
                  dDepth++;
                  k++;
                } else if (asBody[k] === ">" && asBody[k + 1] === ">") {
                  dDepth--;
                  if (dDepth === 0) {
                    dictEnd = k + 2;
                    break;
                  }
                  k++;
                }
              }
              if (dictEnd === -1) break;
              const entry = asBody.substring(dictOpen, dictEnd);
              j = dictEnd;
              if (!/\/Event\s*\/View\b/.test(entry)) continue;
              const ocgsContent = resolveArrayValue(entry, "OCGs", this);
              if (ocgsContent == null) continue;
              for (const m of ocgsContent.matchAll(/(\d+)\s+\d+\s+R/g)) {
                const ocgNum = Number(m[1]);
                const ocgText = this.getObjectText(ocgNum);
                if (!ocgText) continue;
                const usageText = resolveDictValue(ocgText, "Usage", this);
                const viewText = usageText && resolveDictValue(usageText, "View", this);
                if (viewText && /\/ViewState\s*\/OFF\b/.test(viewText)) off.add(ocgNum);
              }
            }
          }
        }
      }
    }
    this._offOCGs = off;
    return off;
  }
  /**
   * Get the raw stream bytes for a stream object.
   * @param {number} objNum
   * @returns {Uint8Array|null}
   */
  getStreamBytes(objNum) {
    const synthetic = this.syntheticObjects.get(objNum);
    if (synthetic !== void 0) return synthetic.bytes;
    const cached = this.streamBytesCache.get(objNum);
    if (cached !== void 0) return cached;
    const bytes = this.pdfBytes;
    let entry = this.xrefEntries[objNum];
    if (entry && entry.type === 1 && entry.offset >= bytes.length) {
      entry = null;
    }
    let result = null;
    if (!entry) {
      const marker = `${objNum} 0 obj`;
      let idx = 0;
      while ((idx = byteIndexOf(bytes, marker, idx)) !== -1) {
        if (idx === 0 || isPdfWhitespace(bytes[idx - 1])) {
          result = extractStream(bytes, idx, this, objNum);
          break;
        }
        idx += marker.length;
      }
    } else if (entry.type === 1) {
      result = extractStream(bytes, entry.offset, this, objNum);
    }
    if (result !== null) this._putStreamBytes(objNum, result);
    return result;
  }
  /**
   * Add object lacking an /AP in the input (certain form fields).
   * @param {number} objNum
   * @param {string} text - The object's dict text (e.g. a Form XObject dictionary).
   * @param {Uint8Array} bytes - The object's uncompressed content stream.
   */
  addSyntheticObject(objNum, text, bytes) {
    this.syntheticObjects.set(objNum, { text, bytes });
  }
  /**
   * Insert a decompressed stream into the cache, evicting FIFO-oldest
   * entries while the total byte count exceeds the budget.
   * @param {number} objNum
   * @param {Uint8Array} data
   */
  _putStreamBytes(objNum, data) {
    this.streamBytesCache.set(objNum, data);
    this.streamBytesCacheBytes += data.byteLength;
    while (this.streamBytesCacheBytes > STREAM_BYTES_CACHE_BUDGET && this.streamBytesCache.size > 1) {
      const firstKey = this.streamBytesCache.keys().next().value;
      if (firstKey === objNum) break;
      const evicted = this.streamBytesCache.get(firstKey);
      this.streamBytesCache.delete(firstKey);
      this.streamBytesCacheBytes -= evicted.byteLength;
    }
  }
  /**
   * Decompress an ObjStm and cache its contained objects.
   * @param {number} objStmNum
   */
  decompressObjStm(objStmNum) {
    if (this.objStmCache.has(objStmNum)) return;
    const stmEntries = /* @__PURE__ */ new Map();
    this.objStmCache.set(objStmNum, stmEntries);
    const bytes = this.pdfBytes;
    const entry = this.xrefEntries[objStmNum];
    if (!entry || entry.type !== 1) return;
    const offset = entry.offset;
    let endObj = byteIndexOf(bytes, "endobj", offset);
    if (endObj === -1) endObj = Math.min(offset + 1e5, bytes.length);
    const objText = bytesToLatin1(bytes, offset, objTextEnd(bytes, offset, endObj));
    const objStmInt = (key) => {
      const direct = resolveIntValue(objText, key, null, -1);
      if (direct !== -1) return direct;
      const ref = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R(?![0-9A-Za-z])`).exec(objText);
      const target = ref && this.xrefEntries[Number(ref[1])];
      if (!target || target.type !== 1) return -1;
      return resolveIntValue(objText, key, this, -1);
    };
    const n = objStmInt("N");
    const first = objStmInt("First");
    if (n < 0 || first < 0) return;
    const streamData = extractStream(bytes, offset, this, objStmNum);
    if (!streamData) return;
    const streamText = bytesToLatin1(streamData);
    const headerPart = streamText.substring(0, first).trim();
    const headerNums = headerPart.split(/\s+/).map(Number);
    let addedChars = 0;
    for (let i = 0; i < n; i++) {
      const objNum = headerNums[i * 2];
      const objOffset = headerNums[i * 2 + 1];
      const startPos = first + objOffset;
      const nextObjOffset = i + 1 < n ? first + headerNums[(i + 1) * 2 + 1] : streamText.length;
      const content = streamText.substring(startPos, nextObjOffset).trim();
      stmEntries.set(objNum, content);
      addedChars += content.length;
    }
    this.objStmCacheChars += addedChars;
    while (this.objStmCacheChars > OBJ_STM_CACHE_BUDGET_CHARS && this.objStmCache.size > 1) {
      const firstKey = this.objStmCache.keys().next().value;
      if (firstKey === objStmNum) break;
      const evicted = this.objStmCache.get(firstKey);
      let evictedChars = 0;
      for (const v of evicted.values()) evictedChars += v.length;
      this.objStmCache.delete(firstKey);
      this.objStmCacheChars -= evictedChars;
    }
  }
  /**
   * Decrypt a PDF string's raw bytes for the given object.
   * PDF encryption applies per-object keys to string values (Algorithm 3.1 from spec).
   * @param {Uint8Array} encryptedBytes - Raw encrypted string bytes
   * @param {number} objNum - Object number
   * @param {number} [genNum] - Generation number; when omitted, looked up from xref entries.
   */
  decryptStringBytes(encryptedBytes, objNum, genNum) {
    if (!this.encryptionKey || objNum === this.encryptObjNum) return encryptedBytes;
    const gen = genNum !== void 0 ? genNum : this.xrefEntries[objNum]?.gen ?? 0;
    if (this.cipherMode === "AESV3") {
      return aesDecrypt(this.encryptionKey, encryptedBytes);
    }
    if (this.cipherMode === "AESV2") {
      const objKey2 = computeObjectKey(this.encryptionKey, objNum, gen, true);
      return aesDecrypt(objKey2, encryptedBytes);
    }
    const objKey = computeObjectKey(this.encryptionKey, objNum, gen, false);
    return rc4(objKey, encryptedBytes);
  }
  /**
   * Decrypt the bytes of a string value read from an object's body.
   * @param {Uint8Array|null} bytes - Raw string bytes extracted from the object body
   * @param {number|null} objNum - Object number the string was read from
   * @returns {Uint8Array|null} the decrypted bytes, or `bytes` unchanged when decryption does not apply
   */
  decryptObjectStringBytes(bytes, objNum) {
    if (!bytes || !this.encryptionKey || objNum == null) return bytes;
    const entry = this.xrefEntries[objNum];
    if (entry && entry.type === 1) return this.decryptStringBytes(bytes, objNum);
    return bytes;
  }
  /**
   * Find a PDF string value for a given dict key in an object's raw bytes,
   * decrypt it, and return the result. Works directly with raw bytes to avoid
   * TextDecoder('latin1') Windows-1252 corruption of encrypted byte values.
   * @param {number} objNum - Object number containing the dict
   * @param {string} keyName - Dict key without leading slash (e.g., 'Registry')
   */
  decryptDictString(objNum, keyName) {
    if (!this.encryptionKey) return null;
    const entry = this.xrefEntries[objNum];
    if (!entry || entry.type !== 1) return null;
    const offset = entry.offset;
    const bytes = this.pdfBytes;
    let endIdx = offset;
    while (endIdx < bytes.length - 6) {
      if (bytes[endIdx] === 101 && bytes[endIdx + 1] === 110 && bytes[endIdx + 2] === 100 && bytes[endIdx + 3] === 111 && bytes[endIdx + 4] === 98 && bytes[endIdx + 5] === 106) break;
      endIdx++;
    }
    if (endIdx >= bytes.length - 6) return null;
    const keyStr = `/${keyName}`;
    let pos = offset;
    let found = false;
    while (pos < endIdx - keyStr.length) {
      let match = true;
      for (let k = 0; k < keyStr.length; k++) {
        if (bytes[pos + k] !== keyStr.charCodeAt(k)) {
          match = false;
          break;
        }
      }
      if (match) {
        found = true;
        break;
      }
      pos++;
    }
    if (!found) return null;
    pos += keyStr.length;
    while (pos < endIdx && (bytes[pos] === 32 || bytes[pos] === 10 || bytes[pos] === 13 || bytes[pos] === 9)) pos++;
    if (pos >= endIdx) return null;
    let rawBytes;
    let stringObjNum = objNum;
    if (bytes[pos] === 40) {
      rawBytes = parsePdfLiteralString(bytes, pos).value;
    } else if (bytes[pos] === 60 && pos + 1 < endIdx && bytes[pos + 1] !== 60) {
      rawBytes = parsePdfHexString(bytes, pos).value;
    } else if (isAsciiDigit(bytes[pos])) {
      const refM = /^(\d+)\s+\d+\s+R/.exec(bytesToLatin1(bytes, pos, Math.min(pos + 32, endIdx)));
      const target = refM && this.xrefEntries[Number(refM[1])];
      if (!target || target.type !== 1) return null;
      const objKw = byteIndexOf(bytes, "obj", target.offset);
      if (objKw === -1) return null;
      let sPos = objKw + 3;
      while (sPos < bytes.length && isPdfWhitespace(bytes[sPos])) sPos++;
      if (bytes[sPos] === 40) rawBytes = parsePdfLiteralString(bytes, sPos).value;
      else if (bytes[sPos] === 60 && bytes[sPos + 1] !== 60) rawBytes = parsePdfHexString(bytes, sPos).value;
      else return null;
      stringObjNum = Number(refM[1]);
    } else {
      return null;
    }
    const decrypted = this.decryptStringBytes(rawBytes, stringObjNum);
    let result = "";
    for (let i = 0; i < decrypted.length; i++) result += String.fromCharCode(decrypted[i]);
    return result;
  }
}
let idCounter = 0;
function nextOutlineId() {
  idCounter += 1;
  return idCounter;
}
function makeOutlineNode({
  title = "",
  dest = null,
  action = null,
  open = true,
  children = []
} = {}) {
  return {
    id: nextOutlineId(),
    title,
    dest,
    action,
    open,
    children
  };
}
function parseOutline(objCache, pages) {
  const catalogObjNum = findRootObjNum(objCache.pdfBytes);
  if (!catalogObjNum) return [];
  const catalogText = objCache.getObjectText(catalogObjNum);
  if (!catalogText) return [];
  const outlinesObjNum = refObjNum(catalogText, "Outlines");
  if (!outlinesObjNum) return [];
  const rootText = objCache.getObjectText(outlinesObjNum);
  if (!rootText) return [];
  const objNumToIndex = new Map(pages.map((p, i) => [p.objNum, i]));
  const nameDests = buildNameDests(objCache, catalogText);
  const firstObjNum = refObjNum(rootText, "First");
  if (!firstObjNum) return [];
  return walkSiblings(firstObjNum, objCache, nameDests, objNumToIndex, pages, /* @__PURE__ */ new Set());
}
function walkSiblings(firstObjNum, objCache, nameDests, objNumToIndex, pages, visited) {
  const out = [];
  let cur = firstObjNum;
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const text = objCache.getObjectText(cur);
    if (!text) break;
    const { dest, action } = resolveItemDest(text, nameDests, objNumToIndex, objCache);
    if (dest) setDestYFrac(dest, pages[dest.pageIndex]);
    const node = makeOutlineNode({
      title: derefStringToken(rawValue(text, "Title") || "", objCache),
      dest,
      action,
      // /Count is negative for a collapsed item with descendants; absent/positive means open.
      open: !(resolveIntValue(text, "Count", objCache, 0) < 0)
    });
    const childFirst = refObjNum(text, "First");
    if (childFirst) node.children = walkSiblings(childFirst, objCache, nameDests, objNumToIndex, pages, visited);
    out.push(node);
    cur = refObjNum(text, "Next");
  }
  return out;
}
function setDestYFrac(dest, page) {
  const box = page && (page.cropBox || page.mediaBox);
  if (!box || box.length !== 4) return;
  const kind = dest.view[0];
  let x = null;
  let y = null;
  if (kind === "XYZ") [, x, y] = dest.view;
  else if (kind === "FitH" || kind === "FitBH") [, y] = dest.view;
  else if (kind === "FitV" || kind === "FitBV") [, x] = dest.view;
  else if (kind === "FitR") [, x, , , y] = dest.view;
  const ox = Math.min(box[0], box[2]);
  const oy = Math.min(box[1], box[3]);
  const w = Math.abs(box[2] - box[0]);
  const h = Math.abs(box[3] - box[1]);
  const rot = ((page.rotate || 0) % 360 + 360) % 360;
  let yFromTop = null;
  if (rot === 90 && typeof x === "number") yFromTop = x - ox;
  else if (rot === 180 && typeof y === "number") yFromTop = y - oy;
  else if (rot === 270 && typeof x === "number") yFromTop = ox + w - x;
  else if (rot === 0 && typeof y === "number") yFromTop = oy + h - y;
  const visualH = rot % 180 === 90 ? w : h;
  if (yFromTop != null && visualH > 0) dest.yFrac = Math.min(1, Math.max(0, yFromTop / visualH));
}
function resolveItemDest(itemText, nameDests, objNumToIndex, objCache) {
  let destToken = rawValue(itemText, "Dest");
  if (!destToken) {
    const actionText = resolveDictValue(itemText, "A", objCache);
    if (actionText) {
      if (/\/S\s*\/GoTo\b/.test(actionText)) destToken = rawValue(actionText, "D");
      else return { dest: null, action: actionText.trim() };
    }
  }
  if (!destToken) return { dest: null, action: null };
  const arrText = destTokenToArrayText(destToken.trim(), nameDests, objCache);
  const parsed = arrText ? parseDestArray(arrText) : null;
  if (!parsed || !objNumToIndex.has(parsed.pageObjNum)) return { dest: null, action: null };
  return { dest: { pageIndex: objNumToIndex.get(parsed.pageObjNum), view: parsed.view }, action: null };
}
function destTokenToArrayText(token, nameDests, objCache) {
  if (token.startsWith("[")) return token;
  if (token.startsWith("(") || token.startsWith("<")) return resolveValueToDestArray(nameDests.get(decodePdfString(token)), objCache);
  if (token.startsWith("/")) return resolveValueToDestArray(nameDests.get(token.slice(1)), objCache);
  if (/^\d+\s+\d+\s+R/.test(token)) return resolveValueToDestArray(token, objCache);
  return null;
}
function resolveValueToDestArray(value, objCache) {
  if (!value) return null;
  const t = value.trim();
  if (t.startsWith("[")) return t;
  if (t.startsWith("<<")) {
    const d = rawValue(t, "D");
    return d ? resolveValueToDestArray(d, objCache) : null;
  }
  const refMatch = /^(\d+)\s+\d+\s+R/.exec(t);
  if (refMatch) return resolveValueToDestArray(objCache.getObjectText(Number(refMatch[1])), objCache);
  return null;
}
function parseDestArray(arrText) {
  const m = /^\s*\[\s*(\d+)\s+\d+\s+R\b([\s\S]*?)\]\s*$/.exec(arrText.trim());
  if (!m) return null;
  const tail = m[2].trim();
  const view = tail ? tail.replace(/^\//, "").split(/\s+/).filter(Boolean).map((tk) => tk === "null" ? null : /^-?[\d.]+$/.test(tk) ? Number(tk) : tk) : [];
  return { pageObjNum: Number(m[1]), view };
}
function buildNameDests(objCache, catalogText) {
  const nameDests = /* @__PURE__ */ new Map();
  const namesText = resolveDictValue(catalogText, "Names", objCache);
  let hasModernTree = false;
  if (namesText) {
    const destsTreeNum = refObjNum(namesText, "Dests");
    if (destsTreeNum) {
      hasModernTree = true;
      walkNameTree(destsTreeNum, objCache, nameDests, /* @__PURE__ */ new Set());
    } else {
      const inlineRoot = resolveDictValue(namesText, "Dests", objCache);
      if (inlineRoot) {
        hasModernTree = true;
        collectNameTreeNode(inlineRoot, objCache, nameDests, /* @__PURE__ */ new Set());
      }
    }
  }
  if (!hasModernTree) {
    const legacyNum = refObjNum(catalogText, "Dests");
    if (legacyNum) {
      const legacyText = objCache.getObjectText(legacyNum);
      if (legacyText) {
        for (const m of legacyText.matchAll(/\/([^\s/<>()[\]]+)\s*(\[[\s\S]*?\]|<<[\s\S]*?>>|\d+\s+\d+\s+R)/g)) if (!nameDests.has(m[1])) nameDests.set(m[1], m[2]);
      }
    }
  }
  return nameDests;
}
function walkNameTree(nodeObjNum, objCache, nameDests, visited) {
  if (visited.has(nodeObjNum)) return;
  visited.add(nodeObjNum);
  const text = objCache.getObjectText(nodeObjNum);
  if (!text) return;
  collectNameTreeNode(text, objCache, nameDests, visited);
}
function collectNameTreeNode(text, objCache, nameDests, visited) {
  const namesArr = arrayTokenOf(rawValue(text, "Names"), objCache);
  if (namesArr) parseNameLeaf(namesArr.slice(1, -1), nameDests);
  const kidsArr = arrayTokenOf(rawValue(text, "Kids"), objCache);
  if (kidsArr) for (const m of kidsArr.matchAll(/(\d+)\s+\d+\s+R/g)) walkNameTree(Number(m[1]), objCache, nameDests, visited);
}
function arrayTokenOf(token, objCache) {
  if (!token) return null;
  if (token[0] === "[") return token;
  const m = /^(\d+)\s+\d+\s+R$/.exec(token);
  if (!m) return null;
  const body = (objCache.getObjectText(Number(m[1])) || "").trim();
  return body[0] === "[" ? body : null;
}
function parseNameLeaf(inner, nameDests) {
  let i = 0;
  const readToken = () => {
    while (i < inner.length && /\s/.test(inner[i])) i += 1;
    if (i >= inner.length) return null;
    const c = inner[i];
    if (c === "(") {
      let depth = 0;
      let j = i;
      for (; j < inner.length; j += 1) {
        const ch = inner[j];
        if (ch === "\\") {
          j += 1;
        } else if (ch === "(") depth += 1;
        else if (ch === ")") {
          depth -= 1;
          if (depth === 0) {
            j += 1;
            break;
          }
        }
      }
      const tok = inner.slice(i, j);
      i = j;
      return tok;
    }
    if (c === "<" && inner[i + 1] === "<") {
      let depth = 0;
      let j = i;
      for (; j < inner.length - 1; j += 1) {
        if (inner[j] === "<" && inner[j + 1] === "<") {
          depth += 1;
          j += 1;
        } else if (inner[j] === ">" && inner[j + 1] === ">") {
          depth -= 1;
          j += 1;
          if (depth === 0) {
            j += 1;
            break;
          }
        }
      }
      const tok = inner.slice(i, j);
      i = j;
      return tok;
    }
    if (c === "<") {
      const j = inner.indexOf(">", i);
      const tok = inner.slice(i, j + 1);
      i = j + 1;
      return tok;
    }
    if (c === "[") {
      let depth = 0;
      let j = i;
      for (; j < inner.length; j += 1) {
        if (inner[j] === "[") depth += 1;
        else if (inner[j] === "]") {
          depth -= 1;
          if (depth === 0) {
            j += 1;
            break;
          }
        }
      }
      const tok = inner.slice(i, j);
      i = j;
      return tok;
    }
    const rest = inner.slice(i);
    const refMatch = /^\d+\s+\d+\s+R/.exec(rest);
    if (refMatch) {
      i += refMatch[0].length;
      return refMatch[0];
    }
    const other = /^\S+/.exec(rest);
    i += other[0].length;
    return other[0];
  };
  let key = readToken();
  while (key != null) {
    const value = readToken();
    if (value == null) break;
    const name = decodePdfString(key);
    if (!nameDests.has(name)) nameDests.set(name, value);
    key = readToken();
  }
}
function refObjNum(text, key) {
  const m = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(text);
  return m ? Number(m[1]) : null;
}
function rawValue(text, key) {
  const re = new RegExp(`/${key}\\s*`, "g");
  const m = re.exec(text);
  if (!m) return null;
  const i = re.lastIndex;
  const c = text[i];
  if (c === "(") {
    let depth = 0;
    let j = i;
    for (; j < text.length; j += 1) {
      const ch = text[j];
      if (ch === "\\") {
        j += 1;
      } else if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    return text.slice(i, j);
  }
  if (c === "<" && text[i + 1] === "<") {
    let depth = 0;
    let j = i;
    for (; j < text.length - 1; j += 1) {
      if (text[j] === "<" && text[j + 1] === "<") {
        depth += 1;
        j += 1;
      } else if (text[j] === ">" && text[j + 1] === ">") {
        depth -= 1;
        j += 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    return text.slice(i, j);
  }
  if (c === "<") {
    const j = text.indexOf(">", i);
    return j === -1 ? null : text.slice(i, j + 1);
  }
  if (c === "[") {
    let depth = 0;
    let j = i;
    for (; j < text.length; j += 1) {
      if (text[j] === "[") depth += 1;
      else if (text[j] === "]") {
        depth -= 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    return text.slice(i, j);
  }
  const rest = text.slice(i);
  const refMatch = /^\d+\s+\d+\s+R/.exec(rest);
  if (refMatch) return refMatch[0];
  const nameMatch = /^\/[^\s/<>()[\]]+/.exec(rest);
  if (nameMatch) return nameMatch[0];
  const numMatch = /^-?[\d.]+/.exec(rest);
  return numMatch ? numMatch[0] : null;
}
function parseAttachments(objCache) {
  const result = { collection: null, files: [] };
  const catalogObjNum = findRootObjNum(objCache.pdfBytes);
  if (!catalogObjNum) return result;
  const catalogText = objCache.getObjectText(catalogObjNum);
  if (!catalogText) return result;
  const dictOf = (token) => {
    if (!token) return null;
    const t = token.trim();
    if (t.startsWith("<<")) return t;
    const m = /^(\d+)\s+\d+\s+R$/.exec(t);
    if (!m) return null;
    const text = objCache.getObjectText(Number(m[1]));
    const i = text ? text.indexOf("<<") : -1;
    return i === -1 ? null : extractDict(
      /** @type {string} */
      text,
      i
    );
  };
  const entriesOf = (dict) => new Map(dict ? parseDictEntries(dict.slice(2, -2)).map((e) => [e.name, e.valueText]) : []);
  const tree = /* @__PURE__ */ new Map();
  const namesText = resolveDictValue(catalogText, "Names", objCache);
  if (namesText) {
    const rootRef = /\/EmbeddedFiles\s+(\d+)\s+\d+\s+R/.exec(namesText);
    if (rootRef) walkNameTree(Number(rootRef[1]), objCache, tree, /* @__PURE__ */ new Set());
    else {
      const inlineRoot = resolveDictValue(namesText, "EmbeddedFiles", objCache);
      if (inlineRoot) collectNameTreeNode(inlineRoot, objCache, tree, /* @__PURE__ */ new Set());
    }
  }
  const collectionText = resolveDictValue(catalogText, "Collection", objCache);
  for (const [rawKey, specToken] of tree) {
    const spec = dictOf(specToken);
    if (!spec) continue;
    const ef = resolveDictValue(spec, "EF", objCache);
    const streamRef = ef ? /\/UF\s+(\d+)\s+\d+\s+R/.exec(ef) || /\/F\s+(\d+)\s+\d+\s+R/.exec(ef) : null;
    if (!streamRef) continue;
    const objNum = Number(streamRef[1]);
    const stream = dictOf(`${objNum} 0 R`);
    const specEntries = entriesOf(spec);
    const folder = /^<(\d+)>(.*)$/.exec(rawKey);
    const key = rawKey;
    const nameToken = specEntries.get("UF") ?? specEntries.get("F");
    const descToken = specEntries.get("Desc");
    const params = stream ? resolveDictValue(stream, "Params", objCache) : null;
    const paramEntries = entriesOf(params);
    const dateOf = (token) => token ? parsePdfDate(derefStringToken(token, objCache)) : null;
    const size = params ? resolveIntValue(params, "Size", objCache, -1) : -1;
    const subtype = stream ? resolveNameValue(stream, "Subtype", objCache) : null;
    const file = {
      key,
      name: nameToken ? derefStringToken(nameToken, objCache) : folder ? folder[2] : rawKey,
      folderId: folder ? Number(folder[1]) : null,
      description: descToken ? derefStringToken(descToken, objCache) : null,
      mimeType: subtype ? decodePdfName(subtype) : null,
      size: size >= 0 ? size : null,
      modDate: dateOf(paramEntries.get("ModDate")),
      creationDate: dateOf(paramEntries.get("CreationDate")),
      objNum
    };
    result.files.push(file);
  }
  if (collectionText) {
    const colEntries = entriesOf(collectionText);
    const initialToken = colEntries.get("D");
    const initialRaw = initialToken ? derefStringToken(initialToken, objCache) : null;
    const folders = [];
    const rootFolder = resolveDictValue(collectionText, "Folders", objCache);
    if (rootFolder) {
      const seen = /* @__PURE__ */ new Set();
      const walkFolders = (token, parentId, parentPath) => {
        let t = token;
        while (t) {
          const m = /^\s*(\d+)\s+\d+\s+R\s*$/.exec(t);
          if (!m || seen.has(Number(m[1]))) return;
          seen.add(Number(m[1]));
          const dict = dictOf(t);
          if (!dict) return;
          const entries = entriesOf(dict);
          const id = resolveIntValue(dict, "ID", objCache, -1);
          const nameToken = entries.get("Name");
          const name = nameToken ? derefStringToken(nameToken, objCache) : "";
          const path = parentPath ? `${parentPath}/${name}` : name;
          folders.push({
            id,
            name,
            parentId,
            path
          });
          walkFolders(entries.get("Child") ?? null, id, path);
          t = entries.get("Next") ?? null;
        }
      };
      walkFolders(entriesOf(rootFolder).get("Child") ?? null, resolveIntValue(rootFolder, "ID", objCache, 0), "");
    }
    result.collection = {
      // The spec falls back to the first file when /D is absent or names nothing in the tree.
      initial: (initialRaw != null && result.files.some((f) => f.key === initialRaw) ? initialRaw : null) || result.files[0]?.key || null,
      folders
    };
  }
  return result;
}
function layoutFieldValue(value, rectW, rectH, opts = {}) {
  const tfMatch = opts.da ? /\/[\w+-]+\s+([\d.]+)\s+Tf/.exec(opts.da) : null;
  let fontSize = tfMatch ? Number(tfMatch[1]) : 10;
  if (!fontSize) fontSize = Math.min(12, Math.max(6, rectH - 4));
  const avgCharW = fontSize * 0.5;
  const pad = 2;
  const lines = [];
  const wordsOf = (text, lineX, charW) => {
    const out = [];
    for (const m of text.matchAll(/\S+/g)) {
      out.push({ text: m[0], x0: lineX + m.index * charW, x1: lineX + (m.index + m[0].length) * charW });
    }
    return out;
  };
  if (opts.multiline) {
    const maxChars = Math.max(1, Math.floor((rectW - 2 * pad) / avgCharW));
    const wrapped = [];
    for (const para of value.split(/\r\n|\r|\n/)) {
      const words = para.split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 0) {
        wrapped.push("");
        continue;
      }
      let line = "";
      for (const w of words) {
        if (line.length === 0) line = w;
        else if (line.length + 1 + w.length <= maxChars) line += ` ${w}`;
        else {
          wrapped.push(line);
          line = w;
        }
      }
      if (line.length > 0) wrapped.push(line);
    }
    const leading = fontSize * 1.15;
    let y2 = rectH - pad - fontSize;
    for (const text of wrapped) {
      if (text.length > 0) {
        lines.push({
          text,
          x: pad,
          y: y2,
          words: wordsOf(text, pad, avgCharW)
        });
      }
      y2 -= leading;
    }
    return { fontSize, lines };
  }
  const y = Math.max(pad, (rectH - fontSize) / 2 + fontSize * 0.2);
  if (opts.comb && opts.maxLen && opts.maxLen > 0) {
    const cellW = rectW / opts.maxLen;
    const combWords = [];
    for (const m of value.matchAll(/\S+/g)) {
      combWords.push({ text: m[0], x0: m.index * cellW, x1: (m.index + m[0].length) * cellW });
    }
    lines.push({
      text: value,
      x: 0,
      y,
      words: combWords
    });
    return { fontSize, lines };
  }
  const textW = value.length * avgCharW;
  let x = pad;
  if (opts.quadding === 1) x = Math.max(pad, (rectW - textW) / 2);
  else if (opts.quadding === 2) x = Math.max(pad, rectW - textW - pad);
  lines.push({
    text: value,
    x,
    y,
    words: wordsOf(value, x, avgCharW)
  });
  return { fontSize, lines };
}
function parsePagePaths(pageObjText, objCache, prefetchedTokens, collect) {
  let tokens = prefetchedTokens;
  if (!tokens) {
    const contentStreamText = getPageContentStream(pageObjText, objCache);
    if (!contentStreamText) return [];
    tokens = tokenizeContentStream(contentStreamText);
  }
  const expanded = inlineFormXObjects(tokens, pageObjText, objCache, /* @__PURE__ */ new Set());
  return executePathOperators(expanded, collect);
}
function inlineFormXObjects(tokens, containerObjText, objCache, visited) {
  const imageObjNums = /* @__PURE__ */ new Map();
  const forms = findFormXObjects(containerObjText, objCache, imageObjNums);
  if (forms.size === 0 && imageObjNums.size === 0) return tokens;
  const result = [];
  const operandStack = [];
  for (const tok of tokens) {
    if (tok.type !== "operator") {
      operandStack.push(tok);
      result.push(tok);
      continue;
    }
    if (tok.value === "Do" && operandStack.length >= 1) {
      const name = operandStack[operandStack.length - 1].value;
      const imageObjNum = imageObjNums.get(name);
      if (imageObjNum !== void 0) {
        result.push({ type: "operator", value: "Do", imageObjNum });
        operandStack.length = 0;
        continue;
      }
      const form = forms.get(name);
      if (form && !visited.has(form.objNum)) {
        result.pop();
        visited.add(form.objNum);
        const formObjText = objCache.getObjectText(form.objNum);
        const formBytes = formObjText ? objCache.getStreamBytes(form.objNum) : null;
        if (formObjText && formBytes) {
          const formContentStream = bytesToLatin1(formBytes);
          const formMatrix = parseFormMatrix(formObjText, objCache);
          const formTokens = tokenizeContentStream(formContentStream);
          const expanded = inlineFormXObjects(formTokens, formObjText, objCache, visited);
          result.push({ type: "operator", value: "q" });
          for (const v of formMatrix) result.push({ type: "number", value: v });
          result.push({ type: "operator", value: "cm" });
          for (const t of expanded) result.push(t);
          result.push({ type: "operator", value: "Q" });
        }
        operandStack.length = 0;
        continue;
      }
    }
    result.push(tok);
    operandStack.length = 0;
  }
  return result;
}
function transformPoint(x, y, ctm) {
  return {
    x: ctm[0] * x + ctm[2] * y + ctm[4],
    y: ctm[1] * x + ctm[3] * y + ctm[5]
  };
}
function ctmScale(ctm) {
  return Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]));
}
function executePathOperators(tokens, collect) {
  const paths = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  let fillColor = [0, 0, 0];
  let fillColorSpace = "gray";
  let strokeColor = [0, 0, 0];
  let strokeColorSpace = "gray";
  let lineWidth = 1;
  let lineCap = 0;
  let lineJoin = 0;
  let miterLimit = 10;
  let dashArray = (
    /** @type {number[]} */
    []
  );
  let dashPhase = 0;
  const gstateStack = [];
  let currentPath = [];
  let curX = 0;
  let curY = 0;
  let pathStartX = 0;
  let pathStartY = 0;
  const operandStack = [];
  function popNums(n) {
    const start = operandStack.length - n;
    const vals = operandStack.slice(start).map((t) => t.value);
    operandStack.length = 0;
    return vals;
  }
  function recordImagePlacement(objNum) {
    if (!collect || !collect.imagePlacements) return;
    const effCtm = collect.initialCtm ? matMul(ctm, collect.initialCtm) : ctm;
    const corners = [
      transformPoint(0, 0, effCtm),
      transformPoint(1, 0, effCtm),
      transformPoint(0, 1, effCtm),
      transformPoint(1, 1, effCtm)
    ];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of corners) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const placement = {
      left: minX,
      bottom: minY,
      right: maxX,
      top: maxY
    };
    if (objNum !== void 0) placement.objNum = objNum;
    collect.imagePlacements.push(placement);
  }
  function emitPath(fill, stroke, evenOdd) {
    if (currentPath.length === 0) return;
    const cmds = (
      /** @type {PathCommand[]} */
      []
    );
    for (const cmd of currentPath) {
      switch (cmd.type) {
        case "M":
        case "L": {
          const p = transformPoint(cmd.x, cmd.y, ctm);
          cmds.push({ type: cmd.type, x: p.x, y: p.y });
          break;
        }
        case "C": {
          const p1 = transformPoint(cmd.x1, cmd.y1, ctm);
          const p2 = transformPoint(cmd.x2, cmd.y2, ctm);
          const p3 = transformPoint(cmd.x, cmd.y, ctm);
          cmds.push({
            type: "C",
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            x: p3.x,
            y: p3.y
          });
          break;
        }
        case "Z":
          cmds.push({ type: "Z" });
          break;
      }
    }
    paths.push({
      commands: cmds,
      fill,
      stroke,
      evenOdd,
      fillColor: fillColor.slice(),
      fillColorSpace,
      strokeColor: strokeColor.slice(),
      strokeColorSpace,
      lineWidth: lineWidth * ctmScale(ctm),
      lineCap,
      lineJoin,
      miterLimit,
      dashArray: dashArray.slice(),
      dashPhase
    });
    if (collect && collect.pathPlacements && cmds.length >= 2) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const cmd of cmds) {
        if (cmd.type === "Z") continue;
        if (cmd.type === "C") {
          if (cmd.x1 < minX) minX = cmd.x1;
          if (cmd.x1 > maxX) maxX = cmd.x1;
          if (cmd.y1 < minY) minY = cmd.y1;
          if (cmd.y1 > maxY) maxY = cmd.y1;
          if (cmd.x2 < minX) minX = cmd.x2;
          if (cmd.x2 > maxX) maxX = cmd.x2;
          if (cmd.y2 < minY) minY = cmd.y2;
          if (cmd.y2 > maxY) maxY = cmd.y2;
        }
        if (cmd.x < minX) minX = cmd.x;
        if (cmd.x > maxX) maxX = cmd.x;
        if (cmd.y < minY) minY = cmd.y;
        if (cmd.y > maxY) maxY = cmd.y;
      }
      if (minX <= maxX) {
        if (collect.initialCtm) {
          const corners = [
            transformPoint(minX, minY, collect.initialCtm),
            transformPoint(maxX, minY, collect.initialCtm),
            transformPoint(minX, maxY, collect.initialCtm),
            transformPoint(maxX, maxY, collect.initialCtm)
          ];
          minX = Infinity;
          maxX = -Infinity;
          minY = Infinity;
          maxY = -Infinity;
          for (const p of corners) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
        }
        collect.pathPlacements.push({
          left: minX,
          bottom: minY,
          right: maxX,
          top: maxY,
          paint: fill && stroke ? "fs" : fill ? "f" : "s",
          commands: cmds.length
        });
      }
    }
    currentPath = [];
  }
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === "inlineImage") {
      recordImagePlacement();
      operandStack.length = 0;
      continue;
    }
    if (tok.type !== "operator") {
      operandStack.push(tok);
      continue;
    }
    const op = tok.value;
    switch (op) {
      // ── XObjects ─────────────────────────────────────────────────
      case "Do":
        recordImagePlacement(tok.imageObjNum);
        operandStack.length = 0;
        break;
      // ── Graphics state ────────────────────────────────────────────
      case "q":
        gstateStack.push({
          ctm: ctm.slice(),
          fillColor: fillColor.slice(),
          fillColorSpace,
          strokeColor: strokeColor.slice(),
          strokeColorSpace,
          lineWidth,
          lineCap,
          lineJoin,
          miterLimit,
          dashArray: dashArray.slice(),
          dashPhase
        });
        operandStack.length = 0;
        break;
      case "Q":
        if (gstateStack.length > 0) {
          const s = (
            /** @type {typeof gstateStack[0]} */
            gstateStack.pop()
          );
          ctm = s.ctm;
          fillColor = s.fillColor;
          fillColorSpace = s.fillColorSpace;
          strokeColor = s.strokeColor;
          strokeColorSpace = s.strokeColorSpace;
          lineWidth = s.lineWidth;
          lineCap = s.lineCap;
          lineJoin = s.lineJoin;
          miterLimit = s.miterLimit;
          dashArray = s.dashArray;
          dashPhase = s.dashPhase;
        }
        operandStack.length = 0;
        break;
      case "cm":
        if (operandStack.length >= 6) {
          const m = popNums(6);
          ctm = matMul(m, ctm);
        } else {
          operandStack.length = 0;
        }
        break;
      case "w":
        if (operandStack.length >= 1) lineWidth = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "J":
        if (operandStack.length >= 1) lineCap = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "j":
        if (operandStack.length >= 1) lineJoin = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "M":
        if (operandStack.length >= 1) miterLimit = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "d":
        if (operandStack.length >= 2) {
          const phase = operandStack[operandStack.length - 1];
          const arr = operandStack[operandStack.length - 2];
          dashPhase = phase.value;
          dashArray = arr.type === "array" ? arr.value.map((v) => v.value) : [];
        }
        operandStack.length = 0;
        break;
      // ── Color operators ───────────────────────────────────────────
      case "g":
        if (operandStack.length >= 1) {
          fillColor = popNums(1);
          fillColorSpace = "gray";
        } else {
          operandStack.length = 0;
        }
        break;
      case "G":
        if (operandStack.length >= 1) {
          strokeColor = popNums(1);
          strokeColorSpace = "gray";
        } else {
          operandStack.length = 0;
        }
        break;
      case "rg":
        if (operandStack.length >= 3) {
          fillColor = popNums(3);
          fillColorSpace = "rgb";
        } else {
          operandStack.length = 0;
        }
        break;
      case "RG":
        if (operandStack.length >= 3) {
          strokeColor = popNums(3);
          strokeColorSpace = "rgb";
        } else {
          operandStack.length = 0;
        }
        break;
      case "k":
        if (operandStack.length >= 4) {
          fillColor = popNums(4);
          fillColorSpace = "cmyk";
        } else {
          operandStack.length = 0;
        }
        break;
      case "K":
        if (operandStack.length >= 4) {
          strokeColor = popNums(4);
          strokeColorSpace = "cmyk";
        } else {
          operandStack.length = 0;
        }
        break;
      case "cs":
        if (operandStack.length >= 1) {
          fillColorSpace = operandStack[operandStack.length - 1].value;
        }
        operandStack.length = 0;
        break;
      case "CS":
        if (operandStack.length >= 1) {
          strokeColorSpace = operandStack[operandStack.length - 1].value;
        }
        operandStack.length = 0;
        break;
      case "sc":
      case "scn":
        if (operandStack.length >= 1) {
          fillColor = operandStack.map((t) => t.value);
        }
        operandStack.length = 0;
        break;
      case "SC":
      case "SCN":
        if (operandStack.length >= 1) {
          strokeColor = operandStack.map((t) => t.value);
        }
        operandStack.length = 0;
        break;
      // ── Path construction ─────────────────────────────────────────
      case "m": {
        if (operandStack.length >= 2) {
          const vals = popNums(2);
          curX = vals[0];
          curY = vals[1];
          pathStartX = curX;
          pathStartY = curY;
          currentPath.push({ type: "M", x: curX, y: curY });
        } else {
          operandStack.length = 0;
        }
        break;
      }
      case "l": {
        if (operandStack.length >= 2) {
          const vals = popNums(2);
          curX = vals[0];
          curY = vals[1];
          currentPath.push({ type: "L", x: curX, y: curY });
        } else {
          operandStack.length = 0;
        }
        break;
      }
      case "c": {
        if (operandStack.length >= 6) {
          const vals = popNums(6);
          currentPath.push({
            type: "C",
            x1: vals[0],
            y1: vals[1],
            x2: vals[2],
            y2: vals[3],
            x: vals[4],
            y: vals[5]
          });
          curX = vals[4];
          curY = vals[5];
        } else {
          operandStack.length = 0;
        }
        break;
      }
      case "v": {
        if (operandStack.length >= 4) {
          const vals = popNums(4);
          currentPath.push({
            type: "C",
            x1: curX,
            y1: curY,
            x2: vals[0],
            y2: vals[1],
            x: vals[2],
            y: vals[3]
          });
          curX = vals[2];
          curY = vals[3];
        } else {
          operandStack.length = 0;
        }
        break;
      }
      case "y": {
        if (operandStack.length >= 4) {
          const vals = popNums(4);
          currentPath.push({
            type: "C",
            x1: vals[0],
            y1: vals[1],
            x2: vals[2],
            y2: vals[3],
            x: vals[2],
            y: vals[3]
          });
          curX = vals[2];
          curY = vals[3];
        } else {
          operandStack.length = 0;
        }
        break;
      }
      case "h":
        currentPath.push({ type: "Z" });
        curX = pathStartX;
        curY = pathStartY;
        operandStack.length = 0;
        break;
      case "re": {
        if (operandStack.length >= 4) {
          const vals = popNums(4);
          const [rx, ry, rw, rh] = vals;
          currentPath.push({ type: "M", x: rx, y: ry });
          currentPath.push({ type: "L", x: rx + rw, y: ry });
          currentPath.push({ type: "L", x: rx + rw, y: ry + rh });
          currentPath.push({ type: "L", x: rx, y: ry + rh });
          currentPath.push({ type: "Z" });
          curX = rx;
          curY = ry;
          pathStartX = rx;
          pathStartY = ry;
        } else {
          operandStack.length = 0;
        }
        break;
      }
      // ── Path painting ─────────────────────────────────────────────
      case "S":
        emitPath(false, true, false);
        operandStack.length = 0;
        break;
      case "s":
        currentPath.push({ type: "Z" });
        emitPath(false, true, false);
        operandStack.length = 0;
        break;
      case "f":
      case "F":
        emitPath(true, false, false);
        operandStack.length = 0;
        break;
      case "f*":
        emitPath(true, false, true);
        operandStack.length = 0;
        break;
      case "B":
        emitPath(true, true, false);
        operandStack.length = 0;
        break;
      case "B*":
        emitPath(true, true, true);
        operandStack.length = 0;
        break;
      case "b":
        currentPath.push({ type: "Z" });
        emitPath(true, true, false);
        operandStack.length = 0;
        break;
      case "b*":
        currentPath.push({ type: "Z" });
        emitPath(true, true, true);
        operandStack.length = 0;
        break;
      case "n":
        currentPath = [];
        operandStack.length = 0;
        break;
      // ── Clipping (modifies clip, then path is consumed by next paint/n) ──
      case "W":
      case "W*":
        operandStack.length = 0;
        break;
      // ── Skip text/image/other operators ───────────────────────────
      default:
        operandStack.length = 0;
        break;
    }
  }
  return paths;
}
class LayoutBoxBase {
  /**
   * Create a layout box.
   * @param {bbox} coords - The coordinates of the layout box.
   */
  constructor(coords) {
    this.id = getRandomAlphanum(10);
    this.coords = coords;
    this.inclusionRule = "majority";
    this.inclusionLevel = "word";
  }
}
class LayoutDataColumn extends LayoutBoxBase {
  /**
   * Create a layout data column.
   * @param {bbox} coords - The coordinates of the layout data column.
   * @param {LayoutDataTable} table - The layout data table to which the column belongs.
   */
  constructor(coords, table) {
    super(coords);
    this.type = "dataColumn";
    this.table = table;
  }
}
class LayoutDataTable {
  /**
   * Create a layout data table.
   * @param {LayoutDataTablePage} page - The layout data table page to which the table belongs.
   */
  constructor(page) {
    this.page = page;
    this.id = getRandomAlphanum(10);
    this.boxes = [];
    this.rowBounds = null;
    this.detectionMethod = "text";
    this.title = null;
    this.continuesPrev = false;
    this.headerRows = null;
    this.bandColor = null;
  }
}
function LayoutDataTablePage(n) {
  this.n = n;
  this.default = true;
  this.tables = [];
}
function calcColumnBounds(boundingBoxes) {
  const tolerance = 5;
  const columnBounds = [];
  boundingBoxes.sort((a, b) => a.left - b.left);
  boundingBoxes.forEach((box) => {
    let addedToColumn = false;
    for (const column of columnBounds) {
      if (box.left <= column.right + tolerance && box.right >= column.left - tolerance) {
        column.left = Math.min(column.left, box.left);
        column.right = Math.max(column.right, box.right);
        addedToColumn = true;
        break;
      }
    }
    if (!addedToColumn) {
      columnBounds.push({
        left: box.left,
        right: box.right
      });
    }
  });
  for (let i = 0; i < columnBounds.length - 1; i++) {
    const boundRight = (columnBounds[i].right + columnBounds[i + 1].left) / 2;
    columnBounds[i].right = boundRight;
    columnBounds[i + 1].left = boundRight;
  }
  return columnBounds;
}
const MAX_TABLE_DETECTION_PATHS = 2e4;
const isNumToken = (t) => /^[\d,$%.()+-]+$/.test(t);
const isNumWord = (t) => isNumToken(t) && (/\d/.test(t) || t === "-");
function isRightClusteredNumeric(words) {
  if (words.length < 4) return false;
  let numW = 0;
  for (const w of words) if (isNumWord(w.text)) numW++;
  if (numW < 3) return false;
  let lastTextIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (!isNumToken(words[i].text)) lastTextIdx = i;
  }
  let numAfterText = 0;
  for (let i = lastTextIdx + 1; i < words.length; i++) {
    if (!isNumToken(words[i].text)) return false;
    if (isNumWord(words[i].text)) numAfterText++;
  }
  return numAfterText >= 3;
}
function detectTableRegions(pageObj, paths, scale, visualHeightPts, boxOriginX = 0, boxOriginY = 0, textUnderlines = []) {
  const lines = pageObj.lines;
  if (lines.length < 3) return [];
  if (paths.length > MAX_TABLE_DETECTION_PATHS) paths = [];
  let sameYPairs = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (Math.abs(lines[i].bbox.top - lines[i + 1].bbox.top) < 5) {
      sameYPairs++;
    }
  }
  let hasDotLeaderCluster = false;
  if (sameYPairs === 0) {
    const dotLeaderYs = [];
    for (const line of lines) {
      if (isRightClusteredNumeric(line.words)) dotLeaderYs.push(line.bbox.top);
    }
    dotLeaderYs.sort((a, b) => a - b);
    for (let i = 0; i + 2 < dotLeaderYs.length; i++) {
      if (dotLeaderYs[i + 2] - dotLeaderYs[i] < 300) {
        hasDotLeaderCluster = true;
        break;
      }
    }
  }
  if (sameYPairs === 0 && !hasDotLeaderCluster) {
    const strictAllEarly = detectStrictGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines).filter((t) => t.colSeparators.length > 0);
    const provisionalEarly = strictAllEarly.filter((t) => t.provisionalTopOpen);
    const strictEarly = strictAllEarly.filter((t) => !t.provisionalTopOpen && t.detectionMethod === "grid-strong");
    const columnRuleEarly = strictAllEarly.filter((t) => t.detectionMethod === "column-rule");
    const segEarly = detectSegmentedHLineGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines);
    for (const st of segEarly) {
      let blocked = false;
      for (const v of strictEarly) {
        if (bboxOverlap(v.bbox, st.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictEarly.push(st);
    }
    for (const ct of columnRuleEarly) {
      let blocked = false;
      for (const v of strictEarly) {
        if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictEarly.push(ct);
    }
    const pathDataEarly = classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX, boxOriginY, textUnderlines);
    const headerRuleEarly = detectHeaderRuleTables(pathDataEarly.hLines, pageObj);
    for (const ht of headerRuleEarly) {
      let blocked = false;
      for (const v of strictEarly) {
        if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictEarly.push(ht);
    }
    return [...strictEarly, ...provisionalEarly];
  }
  const rows = groupLinesIntoRows(lines);
  const tableLikeRows = [];
  for (const row of rows) {
    if (row.lineIndices.length < 2) {
      if (row.lineIndices.length === 1 && isRightClusteredNumeric(lines[row.lineIndices[0]].words)) {
        tableLikeRows.push({ ...row, hasNumbers: true });
      }
      continue;
    }
    const indices = row.lineIndices;
    let maxGap = 0;
    for (let i = 1; i < indices.length; i++) {
      const gap = indices[i] - indices[i - 1];
      if (gap > maxGap) maxGap = gap;
    }
    const isConsecutive = maxGap <= 2;
    if (!isConsecutive) {
      const subRows = [];
      let currentSub = [indices[0]];
      for (let j = 1; j < indices.length; j++) {
        if (indices[j] - indices[j - 1] <= 2) {
          currentSub.push(indices[j]);
        } else {
          subRows.push(currentSub);
          currentSub = [indices[j]];
        }
      }
      subRows.push(currentSub);
      if (subRows.length >= 4) {
        let pureNumericSubs = 0;
        for (const sub of subRows) {
          if (sub.length === 1) {
            const w = lines[sub[0]].words;
            if (w.length === 1 && /^[\d,$%.()+-]+$/.test(w[0].text) && /\d/.test(w[0].text)) {
              pureNumericSubs++;
            }
          }
        }
        if (pureNumericSubs >= 3) {
          tableLikeRows.push({ y: row.y, lineIndices: indices.slice(), hasNumbers: true });
          continue;
        }
      }
      for (const sub of subRows) {
        if (sub.length < 2) {
          if (sub.length === 1 && isRightClusteredNumeric(lines[sub[0]].words)) {
            tableLikeRows.push({ y: lines[sub[0]].bbox.top, lineIndices: sub, hasNumbers: true });
          }
          continue;
        }
        let subNumericCount = 0;
        for (const idx of sub) {
          for (const word of lines[idx].words) {
            if (/^[\d,$%.()+-]+$/.test(word.text) && /\d/.test(word.text)) subNumericCount++;
          }
        }
        if (subNumericCount >= 1 || sub.length >= 3) {
          const subY = sub.reduce((sum, idx) => sum + lines[idx].bbox.top, 0) / sub.length;
          tableLikeRows.push({ y: subY, lineIndices: sub, hasNumbers: subNumericCount >= 1 });
        }
      }
      continue;
    }
    let numericWordCount = 0;
    for (const idx of indices) {
      for (const word of lines[idx].words) {
        if (/^[\d,$%.()+-]+$/.test(word.text) && /\d/.test(word.text)) {
          numericWordCount++;
        }
      }
    }
    const hasNumbers = numericWordCount >= 1;
    if (hasNumbers || indices.length >= 3) {
      tableLikeRows.push({ ...row, hasNumbers });
    }
  }
  if (tableLikeRows.length === 0) {
    const strictAllFallback = detectStrictGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines).filter((t) => t.colSeparators.length > 0);
    const provisionalFallback = strictAllFallback.filter((t) => t.provisionalTopOpen);
    const strictFallback = strictAllFallback.filter((t) => !t.provisionalTopOpen && t.detectionMethod === "grid-strong");
    const columnRuleFallback = strictAllFallback.filter((t) => t.detectionMethod === "column-rule");
    const segFallback = detectSegmentedHLineGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines);
    for (const st of segFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, st.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(st);
    }
    for (const ct of columnRuleFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(ct);
    }
    const pathDataFallback = classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX, boxOriginY, textUnderlines);
    const headerRuleFallback = detectHeaderRuleTables(pathDataFallback.hLines, pageObj);
    for (const ht of headerRuleFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(ht);
    }
    return [...strictFallback, ...provisionalFallback];
  }
  const candidates = groupRowsIntoCandidates(tableLikeRows, lines, pageObj);
  if (candidates.length === 0) {
    const strictAllFallback = detectStrictGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines).filter((t) => t.colSeparators.length > 0);
    const provisionalFallback = strictAllFallback.filter((t) => t.provisionalTopOpen);
    const strictFallback = strictAllFallback.filter((t) => !t.provisionalTopOpen && t.detectionMethod === "grid-strong");
    const columnRuleFallback = strictAllFallback.filter((t) => t.detectionMethod === "column-rule");
    const segFallback = detectSegmentedHLineGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines);
    for (const st of segFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, st.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(st);
    }
    for (const ct of columnRuleFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(ct);
    }
    const pathDataFallback = classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX, boxOriginY, textUnderlines);
    const headerRuleFallback = detectHeaderRuleTables(pathDataFallback.hLines, pageObj);
    for (const ht of headerRuleFallback) {
      let blocked = false;
      for (const v of strictFallback) {
        if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
          blocked = true;
          break;
        }
      }
      if (!blocked) strictFallback.push(ht);
    }
    return [...strictFallback, ...provisionalFallback];
  }
  const pathData = classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX, boxOriginY, textUnderlines);
  for (const candidate of candidates) {
    correlatePathsWithCandidate(candidate, pathData);
  }
  const rowBandRegions = extractRowBandStructure(pathData.filledRects, lines);
  const validated = candidates.filter((c) => validateCandidate(c, lines));
  const strictAllGrids = detectStrictGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines).filter((t) => t.colSeparators.length > 0);
  const provisionalGrids = strictAllGrids.filter((t) => t.provisionalTopOpen);
  const strictGrids = strictAllGrids.filter((t) => !t.provisionalTopOpen && t.detectionMethod === "grid-strong");
  const columnRuleTables = strictAllGrids.filter((t) => t.detectionMethod === "column-rule");
  const segGrids = detectSegmentedHLineGrids(pageObj, paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines);
  const gridTables = [...strictGrids];
  for (const st of segGrids) {
    let blocked = false;
    for (const v of strictGrids) {
      if (bboxOverlap(v.bbox, st.bbox) > 0.3) {
        blocked = true;
        break;
      }
    }
    if (!blocked) gridTables.push(st);
  }
  for (const gt of gridTables) {
    for (let i = validated.length - 1; i >= 0; i--) {
      if (bboxOverlap(validated[i].bbox, gt.bbox) > 0.3) {
        validated.splice(i, 1);
      }
    }
    validated.push(gt);
  }
  for (const table of validated) {
    if (!table.detectionMethod) table.detectionMethod = "text";
  }
  const pageWidthForRbr = pageObj.dims.width;
  const usableRowBandRegions = rowBandRegions.filter(
    (rbr) => rbr.right - rbr.left >= pageWidthForRbr * 0.3
  );
  const regionMatches = /* @__PURE__ */ new Map();
  for (const rbr of usableRowBandRegions) {
    const matches = [];
    for (const cand of validated) {
      if (bboxOverlap(cand.bbox, {
        left: rbr.left,
        top: rbr.top,
        right: rbr.right,
        bottom: rbr.bottom
      }) > 0.3) {
        matches.push(cand);
      }
    }
    regionMatches.set(rbr, matches);
  }
  const candToRegions = /* @__PURE__ */ new Map();
  for (const [rbr, cands] of regionMatches) {
    for (const c of cands) {
      let arr = candToRegions.get(c);
      if (!arr) {
        arr = [];
        candToRegions.set(c, arr);
      }
      arr.push(rbr);
    }
  }
  const candsToRemove = /* @__PURE__ */ new Set();
  const candsToAdd = [];
  for (const [cand, regions] of candToRegions) {
    if (regions.length !== 1) continue;
    const rbr = regions[0];
    if (cand.detectionMethod === "grid-strong") continue;
    cand.rowBandRegion = rbr;
    const prevTop = cand.bbox.top;
    const prevBottom = cand.bbox.bottom;
    const prevLeft = cand.bbox.left;
    const prevRight = cand.bbox.right;
    const topBand = rbr.rowYs[0];
    let topBandHasNumeric = false;
    const topBandWords = [];
    for (const line of lines) {
      const yC = (line.bbox.top + line.bbox.bottom) / 2;
      if (yC < topBand.top || yC > topBand.bottom) continue;
      if (line.bbox.right < rbr.left || line.bbox.left > rbr.right) continue;
      for (const w of line.words) {
        topBandWords.push(w);
        if (/^[\d,$%.()+-]+$/.test(w.text) && /\d/.test(w.text)) topBandHasNumeric = true;
      }
    }
    let topBandClusters = 0;
    if (topBandWords.length > 0) {
      topBandWords.sort((a, b) => a.bbox.left - b.bbox.left);
      let hSum = 0;
      for (const w of topBandWords) hSum += w.bbox.bottom - w.bbox.top;
      const bandGap = hSum / topBandWords.length * 0.6;
      topBandClusters = 1;
      for (let wi = 1; wi < topBandWords.length; wi++) {
        if (topBandWords[wi].bbox.left - topBandWords[wi - 1].bbox.right > bandGap) topBandClusters++;
      }
    }
    const headerInBand = topBandClusters >= 3 && !topBandHasNumeric;
    cand.bbox.top = headerInBand ? rbr.top : Math.min(cand.bbox.top, rbr.top);
    cand.bbox.bottom = Math.max(cand.bbox.bottom, rbr.bottom);
    cand.bbox.left = Math.min(cand.bbox.left, rbr.left);
    cand.bbox.right = Math.max(cand.bbox.right, rbr.right);
    if (cand.bbox.left < prevLeft - 5 && (cand.detectionMethod === "header-rule" || cand.detectionMethod === "segmented-hline")) {
      const seps = cand.colSeparators ? [...cand.colSeparators] : [];
      seps.unshift(prevLeft);
      seps.sort((a, b) => a - b);
      cand.colSeparators = seps;
    }
    if (cand.bbox.top !== prevTop || cand.bbox.bottom > prevBottom || cand.bbox.left < prevLeft - 5 || cand.bbox.right > prevRight + 5) {
      cand.rows = collectRowsInBbox(cand.bbox, lines);
    }
  }
  for (const [cand, regions] of candToRegions) {
    if (regions.length < 2) continue;
    if (cand.detectionMethod === "grid-strong") continue;
    const allHaveFiveBands = regions.every((r) => r.rowYs.length >= 5);
    const allHaveTwoBands = regions.every((r) => r.rowYs.length >= 2);
    const sortedByTop = [...regions].sort((a, b) => a.top - b.top);
    let shouldSplit = false;
    if (regions.length >= 3 && allHaveFiveBands) {
      shouldSplit = true;
    } else if (allHaveTwoBands) {
      let allSeparatedByHeader = true;
      for (let ri = 1; ri < sortedByTop.length; ri++) {
        const gapTop = sortedByTop[ri - 1].bottom;
        const gapBottom = sortedByTop[ri].top;
        const yGroups = [];
        for (const line of lines) {
          if (line.bbox.top < gapTop || line.bbox.top >= gapBottom) continue;
          if (line.bbox.right < cand.bbox.left || line.bbox.left > cand.bbox.right) continue;
          let matched = false;
          for (const g of yGroups) {
            if (Math.abs(g.y - line.bbox.top) < 5) {
              g.count++;
              matched = true;
              break;
            }
          }
          if (!matched) yGroups.push({ y: line.bbox.top, count: 1 });
        }
        const hasHeaderRow = yGroups.some((g) => g.count >= 2);
        if (!hasHeaderRow) {
          allSeparatedByHeader = false;
          break;
        }
      }
      if (allSeparatedByHeader) shouldSplit = true;
    }
    if (!shouldSplit && regions.length >= 2 && regions.every((r) => r.rowYs.length >= 5)) {
      let allGapsEmpty = true;
      for (let ri = 1; ri < sortedByTop.length; ri++) {
        const gapTop = sortedByTop[ri - 1].bottom;
        const gapBottom = sortedByTop[ri].top;
        if (gapBottom - gapTop < 5) {
          allGapsEmpty = false;
          break;
        }
        for (const line of lines) {
          const yC = (line.bbox.top + line.bbox.bottom) / 2;
          if (yC <= gapTop || yC >= gapBottom) continue;
          if (line.bbox.right < cand.bbox.left || line.bbox.left > cand.bbox.right) continue;
          allGapsEmpty = false;
          break;
        }
        if (!allGapsEmpty) break;
      }
      if (allGapsEmpty) shouldSplit = true;
    }
    if (!shouldSplit) continue;
    candsToRemove.add(cand);
    for (const rbr of regions) {
      for (const c of makeRowBandCandidates(rbr, cand, lines)) candsToAdd.push(c);
    }
  }
  for (const [rbr, cands] of regionMatches) {
    if (cands.length === 0 && rbr.rowYs.length >= 8) {
      for (const c of makeRowBandCandidates(rbr, null, lines)) candsToAdd.push(c);
    }
  }
  for (const c of candsToRemove) {
    const idx = validated.indexOf(c);
    if (idx >= 0) validated.splice(idx, 1);
  }
  for (const c of candsToAdd) validated.push(c);
  for (const table of validated) {
    table.headers = detectHeaders(table, lines);
  }
  for (const table of validated) {
    extractStructure(table, lines);
  }
  const headerRuleTables = detectHeaderRuleTables(pathData.hLines, pageObj);
  const hasNarrowTextColumn = (table) => {
    const seps = [table.bbox.left, ...table.colSeparators, table.bbox.right];
    for (let i = 1; i < seps.length; i++) {
      if (seps[i] - seps[i - 1] < 100) return true;
    }
    return false;
  };
  for (const ht of headerRuleTables) {
    let blocked = false;
    const overlappingText = [];
    for (const v of validated) {
      if (v.detectionMethod === "grid-strong" || v.detectionMethod === "segmented-hline") {
        if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
          blocked = true;
          break;
        }
      } else if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
        overlappingText.push(v);
      }
    }
    if (blocked) continue;
    if (overlappingText.length > 0) {
      const htCols = ht.colSeparators.length + 1;
      const maxTextCols = Math.max(...overlappingText.map((t) => t.colSeparators.length + 1));
      const anyNarrow = overlappingText.some(hasNarrowTextColumn);
      if (maxTextCols > htCols && !anyNarrow) continue;
    }
    for (let i = validated.length - 1; i >= 0; i--) {
      const v = validated[i];
      if (v.detectionMethod === "grid-strong" || v.detectionMethod === "segmented-hline") continue;
      if (bboxOverlap(v.bbox, ht.bbox) > 0.3) {
        validated.splice(i, 1);
      }
    }
    validated.push(ht);
  }
  for (const ct of columnRuleTables) {
    let blocked = false;
    const overlappingText = [];
    for (const v of validated) {
      if (v.detectionMethod === "grid-strong" || v.detectionMethod === "segmented-hline") {
        if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
          blocked = true;
          break;
        }
      } else if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
        overlappingText.push(v);
      }
    }
    const viableClaims = overlappingText.filter((v) => {
      if (v.colSeparators.length === 0) return false;
      if (v.detectionMethod !== "text") return true;
      const seps = [v.bbox.left, ...v.colSeparators, v.bbox.right];
      for (let i = 1; i < seps.length; i++) {
        if (seps[i] - seps[i - 1] < 30) return false;
      }
      return true;
    });
    for (const rbr of viableClaims.some((v) => v.colSeparators.length >= 2) ? rowBandRegions : []) {
      if (rbr.rowYs.length < 3) continue;
      const covered = Math.min(rbr.bottom, ct.bbox.bottom) - Math.max(rbr.top, ct.bbox.top);
      if (covered < (ct.bbox.bottom - ct.bbox.top) * 0.8) continue;
      const tops = [];
      for (const l of lines) {
        const yC = (l.bbox.top + l.bbox.bottom) / 2;
        if (yC < rbr.top || yC > rbr.bottom) continue;
        if (l.bbox.right < rbr.left || l.bbox.left > rbr.right) continue;
        tops.push(l.bbox.top);
      }
      tops.sort((a, b) => a - b);
      let textRows = 0;
      let prevTop = -Infinity;
      for (const t of tops) {
        if (t - prevTop > 5) {
          textRows++;
          prevTop = t;
        }
      }
      if (rbr.rowYs.length >= textRows * 0.5) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    if (overlappingText.length > 0) {
      const ctCols = ct.colSeparators.length + 1;
      const maxTextCols = Math.max(...overlappingText.map((t) => t.colSeparators.length + 1));
      const anyNarrow = overlappingText.some(hasNarrowTextColumn);
      if (maxTextCols > ctCols && !anyNarrow) continue;
      let losesRows = false;
      for (const v of viableClaims) {
        if (!v.rows || v.rows.length === 0) continue;
        let lost = 0;
        for (const r of v.rows) {
          if (r.y < ct.bbox.top - 5 || r.y > ct.bbox.bottom + 5) lost++;
        }
        if (lost > v.rows.length * 0.25) {
          losesRows = true;
          break;
        }
      }
      if (losesRows) continue;
    }
    for (let i = validated.length - 1; i >= 0; i--) {
      const v = validated[i];
      if (v.detectionMethod === "grid-strong" || v.detectionMethod === "segmented-hline") continue;
      if (bboxOverlap(v.bbox, ct.bbox) > 0.3) {
        validated.splice(i, 1);
      }
    }
    validated.push(ct);
  }
  for (const cand of validated) {
    if (cand.rowBandRegion) continue;
    const matches = [];
    for (const rbr2 of rowBandRegions) {
      if (bboxOverlap(cand.bbox, {
        left: rbr2.left,
        top: rbr2.top,
        right: rbr2.right,
        bottom: rbr2.bottom
      }) > 0.3) {
        matches.push(rbr2);
      }
    }
    if (matches.length !== 1) continue;
    const rbr = matches[0];
    if (cand.detectionMethod === "grid-strong" || cand.detectionMethod === "column-rule") continue;
    cand.rowBandRegion = rbr;
    const prevTop = cand.bbox.top;
    const prevBottom = cand.bbox.bottom;
    const prevLeft = cand.bbox.left;
    const prevRight = cand.bbox.right;
    cand.bbox.top = Math.min(cand.bbox.top, rbr.top);
    cand.bbox.bottom = Math.max(cand.bbox.bottom, rbr.bottom);
    cand.bbox.left = Math.min(cand.bbox.left, rbr.left);
    cand.bbox.right = Math.max(cand.bbox.right, rbr.right);
    if (cand.bbox.left < prevLeft - 5 && (cand.detectionMethod === "header-rule" || cand.detectionMethod === "segmented-hline")) {
      const seps = cand.colSeparators ? [...cand.colSeparators] : [];
      seps.unshift(prevLeft);
      seps.sort((a, b) => a - b);
      cand.colSeparators = seps;
    }
    if (cand.bbox.top < prevTop || cand.bbox.bottom > prevBottom || cand.bbox.left < prevLeft - 5 || cand.bbox.right > prevRight + 5) {
      cand.rows = collectRowsInBbox(cand.bbox, lines);
    }
  }
  const splitWork = [];
  for (const cand of validated) {
    if (!cand.rowBandRegion) continue;
    if (!cand.rows || cand.rows.length < 4) continue;
    const sorted = [...cand.rows].sort((a, b) => a.y - b.y);
    const spacings = [];
    for (let i = 1; i < sorted.length; i++) spacings.push(sorted[i].y - sorted[i - 1].y);
    const sortedSpacings = [...spacings].sort((a, b) => a - b);
    const median = sortedSpacings[Math.floor(sortedSpacings.length / 2)];
    const groups = [{ start: 0, end: 0 }];
    for (let i = 1; i < sorted.length; i++) {
      if (spacings[i - 1] > median * 2 && spacings[i - 1] > 50) {
        groups.push({ start: i, end: i });
      } else {
        groups[groups.length - 1].end = i;
      }
    }
    if (groups.length !== 2) continue;
    const endsInTotal = (rowSpec) => {
      for (const li of rowSpec.lineIndices) {
        const text = lines[li].words.map((w) => w.text).join(" ").trim();
        if (/^Total\b/i.test(text)) return true;
      }
      return false;
    };
    const firstEnd = sorted[groups[0].end];
    const secondEnd = sorted[groups[1].end];
    if (!endsInTotal(firstEnd) || !endsInTotal(secondEnd)) continue;
    const splits = [];
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      if (g.end - g.start < 1) continue;
      const groupRows = sorted.slice(g.start, g.end + 1);
      let groupTop;
      let groupBottom;
      if (gi === 0) {
        groupTop = cand.bbox.top;
      } else {
        groupTop = groupRows[0].y;
      }
      if (gi === groups.length - 1) {
        groupBottom = cand.bbox.bottom;
      } else {
        let maxBot = -Infinity;
        for (const r of groupRows) {
          for (const li of r.lineIndices) {
            if (lines[li].bbox.bottom > maxBot) maxBot = lines[li].bbox.bottom;
          }
        }
        groupBottom = maxBot + 5;
      }
      splits.push({
        bbox: {
          left: cand.bbox.left,
          top: groupTop,
          right: cand.bbox.right,
          bottom: groupBottom
        },
        rows: groupRows,
        colSeparators: [...cand.colSeparators || []],
        hLines: cand.hLines || [],
        vLines: cand.vLines || [],
        detectionMethod: cand.detectionMethod,
        rowBandRegion: cand.rowBandRegion,
        // Without this, refineTableTop's gap scan chains upward through the previous split's data rows and pulls bbox.top to the shared column-header band.
        splitTopLocked: gi > 0
      });
    }
    if (splits.length >= 2) splitWork.push({ cand, splits });
  }
  for (const { cand, splits } of splitWork) {
    const idx = validated.indexOf(cand);
    if (idx >= 0) validated.splice(idx, 1, ...splits);
  }
  for (const table of validated) {
    const hasBand = !!table.rowBandRegion;
    if (table.splitTopLocked) continue;
    if (table.detectionMethod === "grid-strong") continue;
    if (table.detectionMethod === "column-rule") continue;
    if (!hasBand && table.detectionMethod === "segmented-hline") continue;
    if (!hasBand && table.detectionMethod === "header-rule") continue;
    const myFirstRowY = table.rows.length > 0 ? Math.min(...table.rows.map((r) => r.y)) : table.bbox.top;
    let topFloor = 0;
    for (const other of validated) {
      if (other === table) continue;
      if (other.bbox.bottom <= myFirstRowY && other.bbox.bottom > topFloor && other.bbox.right >= table.bbox.left && other.bbox.left <= table.bbox.right) {
        topFloor = other.bbox.bottom;
      }
    }
    refineTableTop(table, lines, topFloor);
  }
  for (const table of validated) {
    table.title = detectTableTitle(table, lines);
  }
  const multiCol = validated.filter((t) => {
    if (t.colSeparators.length === 0) return false;
    if (t.detectionMethod !== "text") return true;
    const seps = [t.bbox.left, ...t.colSeparators, t.bbox.right];
    for (let i = 1; i < seps.length; i++) {
      if (seps[i] - seps[i - 1] < 30) return false;
    }
    return true;
  });
  for (const table of multiCol) {
    if (table.detectionMethod === "grid-strong") continue;
    if (table.detectionMethod === "segmented-hline") continue;
    if (table.detectionMethod === "header-rule") continue;
    if (table.detectionMethod === "column-rule") continue;
    extendTableToAdjacentContent(table, lines, multiCol);
  }
  const ruleClusters = findDisjointRuleClusters(pathData.hLines, pageObj);
  for (const table of multiCol) {
    if (table.detectionMethod !== "text") continue;
    let bestCluster = null;
    for (const cluster of ruleClusters) {
      if (cluster.y < table.bbox.top - 30 || cluster.y > table.bbox.bottom + 30) continue;
      const ruleLeft = cluster.cols[0].left;
      const ruleRight = cluster.cols[cluster.cols.length - 1].right;
      if (ruleLeft < table.bbox.left - 30) continue;
      if (ruleRight > table.bbox.right + 30) continue;
      if (!bestCluster || cluster.cols.length > bestCluster.cols.length) {
        bestCluster = cluster;
      }
    }
    if (!bestCluster) continue;
    const wouldSynthesizeLabel = table.bbox.left < bestCluster.cols[0].left - 20;
    const newColCount = bestCluster.cols.length + (wouldSynthesizeLabel ? 1 : 0);
    const currentColCount = table.colSeparators.length + 1;
    if (currentColCount > newColCount) continue;
    const newSeps = [];
    if (wouldSynthesizeLabel) newSeps.push(bestCluster.cols[0].left);
    for (let i = 1; i < bestCluster.cols.length; i++) {
      newSeps.push((bestCluster.cols[i - 1].right + bestCluster.cols[i].left) / 2);
    }
    newSeps.sort((a, b) => a - b);
    table.colSeparators = newSeps;
  }
  for (const table of multiCol) {
    if (table.detectionMethod === "text" && table.rowBandRegion) table.detectionMethod = "row-band";
  }
  return [...multiCol.filter((t) => t.detectionMethod === "grid-strong" || t.detectionMethod === "column-rule" || validateStreamOrder(t, lines)), ...provisionalGrids];
}
function collectRowsInBbox(bbox, lines) {
  const regionLineIndices = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.bbox.top >= bbox.top - 5 && line.bbox.bottom <= bbox.bottom + 5 && line.bbox.left >= bbox.left - 10 && line.bbox.right <= bbox.right + 10) {
      regionLineIndices.push(i);
    }
  }
  const regionLines = regionLineIndices.map((i) => lines[i]);
  const rowGroups = groupLinesIntoRows(regionLines);
  return rowGroups.map((rg) => ({
    lineIndices: rg.lineIndices.map((i) => regionLineIndices[i]),
    y: rg.y
  }));
}
function makeRowBandCandidates(rbr, baseCand, lines) {
  const left = baseCand ? Math.min(baseCand.bbox.left, rbr.left) : rbr.left;
  const right = baseCand ? Math.max(baseCand.bbox.right, rbr.right) : rbr.right;
  const bbox = {
    left,
    top: rbr.top,
    right,
    bottom: rbr.bottom
  };
  const rows = collectRowsInBbox(bbox, lines);
  if (rows.length < 3) {
    return [{
      bbox,
      rows,
      colSeparators: [],
      hLines: [],
      vLines: [],
      detectionMethod: "row-band",
      rowBandRegion: rbr
    }];
  }
  const sorted = [...rows].sort((a, b) => a.y - b.y);
  const spacings = [];
  for (let i = 1; i < sorted.length; i++) spacings.push(sorted[i].y - sorted[i - 1].y);
  const sortedSpacings = [...spacings].sort((a, b) => a - b);
  const medianSpacing = sortedSpacings[Math.floor(sortedSpacings.length / 2)];
  const groups = [{ startIdx: 0, endIdx: 0 }];
  for (let i = 1; i < sorted.length; i++) {
    const last = groups[groups.length - 1];
    if (spacings[i - 1] > medianSpacing * 2 && spacings[i - 1] > 50) {
      groups.push({ startIdx: i, endIdx: i });
    } else {
      last.endIdx = i;
    }
  }
  if (groups.length === 1) {
    return [{
      bbox,
      rows,
      colSeparators: [],
      hLines: [],
      vLines: [],
      detectionMethod: "row-band",
      rowBandRegion: rbr
    }];
  }
  return groups.filter((g) => g.endIdx - g.startIdx >= 2).map((g) => {
    const groupRows = sorted.slice(g.startIdx, g.endIdx + 1);
    let groupBottom = -Infinity;
    for (const r of groupRows) {
      for (const li of r.lineIndices) {
        if (lines[li].bbox.bottom > groupBottom) groupBottom = lines[li].bbox.bottom;
      }
    }
    const subBbox = {
      left,
      top: g.startIdx === 0 ? bbox.top : groupRows[0].y,
      right,
      bottom: g.endIdx === sorted.length - 1 ? bbox.bottom : groupBottom + 5
    };
    return {
      bbox: subBbox,
      rows: collectRowsInBbox(subBbox, lines),
      colSeparators: [],
      hLines: [],
      vLines: [],
      detectionMethod: "row-band",
      rowBandRegion: rbr
    };
  });
}
function groupLinesIntoRows(lines) {
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const top = lines[i].bbox.top;
    let added = false;
    for (const row of rows) {
      if (Math.abs(top - row.y) <= 5) {
        row.lineIndices.push(i);
        row.y = row.lineIndices.reduce((sum, idx) => sum + lines[idx].bbox.top, 0) / row.lineIndices.length;
        added = true;
        break;
      }
    }
    if (!added) {
      rows.push({ y: top, lineIndices: [i] });
    }
  }
  rows.sort((a, b) => a.y - b.y);
  return rows;
}
function groupRowsIntoCandidates(tableLikeRows, lines, pageObj) {
  tableLikeRows.sort((a, b) => a.y - b.y);
  let yGapThreshold = 150;
  if (tableLikeRows.length >= 3) {
    const spacings = [];
    for (let i = 1; i < tableLikeRows.length; i++) {
      spacings.push(tableLikeRows[i].y - tableLikeRows[i - 1].y);
    }
    spacings.sort((a, b) => a - b);
    const medianSpacing = spacings[Math.floor(spacings.length / 2)];
    yGapThreshold = Math.max(medianSpacing * 3, 150);
  }
  const pageHeight = pageObj && pageObj.dims ? pageObj.dims.height : Infinity;
  yGapThreshold = Math.min(yGapThreshold, pageHeight * 0.2);
  const candidates = [];
  let runStart = 0;
  for (let i = 1; i <= tableLikeRows.length; i++) {
    let isContinuation = false;
    if (i < tableLikeRows.length) {
      const directGap = tableLikeRows[i].y - tableLikeRows[i - 1].y;
      if (directGap < yGapThreshold) {
        isContinuation = true;
      } else {
        const yLow = tableLikeRows[i - 1].y;
        const yHigh = tableLikeRows[i].y;
        let runLeft = Infinity;
        let runRight = -Infinity;
        for (const ri of [i - 1, i]) {
          for (const idx of tableLikeRows[ri].lineIndices) {
            if (lines[idx].bbox.left < runLeft) runLeft = lines[idx].bbox.left;
            if (lines[idx].bbox.right > runRight) runRight = lines[idx].bbox.right;
          }
        }
        const runWidth = runRight - runLeft;
        const xTol = Math.max(50, runWidth * 0.05);
        const bracketSet = /* @__PURE__ */ new Set();
        for (const ri of [i - 1, i]) {
          for (const idx of tableLikeRows[ri].lineIndices) bracketSet.add(idx);
        }
        const bridgeYs = [yLow];
        let anyWide = false;
        for (let li = 0; li < lines.length; li++) {
          if (bracketSet.has(li)) continue;
          const ly = lines[li].bbox.top;
          if (ly > yLow && ly < yHigh) {
            const lx = lines[li].bbox.left;
            if (lx >= runLeft - xTol && lx <= runRight) {
              bridgeYs.push(ly);
              const lineWidth = lines[li].bbox.right - lines[li].bbox.left;
              if (lineWidth > runWidth * 0.6) anyWide = true;
            }
          }
        }
        const interveningCount = bridgeYs.length - 1;
        if (interveningCount > 0 && interveningCount <= 3 && !anyWide) {
          bridgeYs.push(yHigh);
          bridgeYs.sort((a, b) => a - b);
          let maxStep = 0;
          for (let s = 1; s < bridgeYs.length; s++) {
            const step = bridgeYs[s] - bridgeYs[s - 1];
            if (step > maxStep) maxStep = step;
          }
          if (maxStep < yGapThreshold) {
            isContinuation = true;
          }
        }
      }
    }
    if (!isContinuation) {
      const run = tableLikeRows.slice(runStart, i);
      const hasAnyNumbers = run.some((r) => r.hasNumbers);
      const minRows = hasAnyNumbers ? 3 : 4;
      if (run.length >= minRows) {
        const rowExtents = run.map((r) => {
          let left = Infinity;
          let right = -Infinity;
          for (const idx of r.lineIndices) {
            if (lines[idx].bbox.left < left) left = lines[idx].bbox.left;
            if (lines[idx].bbox.right > right) right = lines[idx].bbox.right;
          }
          return { left, right };
        });
        const parent = run.map((_, idx) => idx);
        const find = (idx) => {
          while (parent[idx] !== idx) {
            parent[idx] = parent[parent[idx]];
            idx = parent[idx];
          }
          return idx;
        };
        const unite = (a, b) => {
          parent[find(a)] = find(b);
        };
        for (let a = 0; a < run.length; a++) {
          for (let b = a + 1; b < run.length; b++) {
            if (rowExtents[a].right > rowExtents[b].left + 10 && rowExtents[b].right > rowExtents[a].left + 10) {
              unite(a, b);
            }
          }
        }
        const clusters = {};
        for (let j = 0; j < run.length; j++) {
          const root = find(j);
          if (!clusters[root]) clusters[root] = [];
          clusters[root].push(run[j]);
        }
        for (const cluster of Object.values(clusters)) {
          if (cluster.length < minRows) continue;
          cluster.sort((a, b) => a.y - b.y);
          let clusterLeft = Infinity;
          let clusterRight = -Infinity;
          for (const r of cluster) {
            for (const idx of r.lineIndices) {
              if (lines[idx].bbox.left < clusterLeft) clusterLeft = lines[idx].bbox.left;
              if (lines[idx].bbox.right > clusterRight) clusterRight = lines[idx].bbox.right;
            }
          }
          const clusterWidth = clusterRight - clusterLeft;
          const clusterXTol = Math.max(50, clusterWidth * 0.05);
          const splitPoints = [0];
          for (let k = 1; k < cluster.length; k++) {
            const gap = cluster[k].y - cluster[k - 1].y;
            if (gap <= yGapThreshold) continue;
            const yLow = cluster[k - 1].y;
            const yHigh = cluster[k].y;
            const bracketSet2 = /* @__PURE__ */ new Set();
            for (const ki of [k - 1, k]) {
              for (const idx of cluster[ki].lineIndices) bracketSet2.add(idx);
            }
            const bridgeYs = [yLow];
            let anyWide = false;
            for (let li = 0; li < lines.length; li++) {
              if (bracketSet2.has(li)) continue;
              const ly = lines[li].bbox.top;
              if (ly > yLow && ly < yHigh) {
                const lx = lines[li].bbox.left;
                if (lx >= clusterLeft - clusterXTol && lx <= clusterRight) {
                  bridgeYs.push(ly);
                  const lineWidth = lines[li].bbox.right - lines[li].bbox.left;
                  if (lineWidth > clusterWidth * 0.6) anyWide = true;
                }
              }
            }
            const interveningCount = bridgeYs.length - 1;
            let bridgeOK = false;
            if (interveningCount > 0 && interveningCount <= 3 && !anyWide) {
              bridgeYs.push(yHigh);
              bridgeYs.sort((a, b) => a - b);
              let maxStep = 0;
              for (let s = 1; s < bridgeYs.length; s++) {
                const step = bridgeYs[s] - bridgeYs[s - 1];
                if (step > maxStep) maxStep = step;
              }
              if (maxStep < yGapThreshold) bridgeOK = true;
            }
            if (!bridgeOK) splitPoints.push(k);
          }
          splitPoints.push(cluster.length);
          for (let si = 0; si < splitPoints.length - 1; si++) {
            const subCluster = cluster.slice(splitPoints[si], splitPoints[si + 1]);
            if (subCluster.length < minRows) continue;
            const allLineIndices = subCluster.flatMap((r) => r.lineIndices);
            const bbox = computeBboxFromLineIndices(allLineIndices, lines);
            const avgRowHeight = (bbox.bottom - bbox.top) / subCluster.length;
            bbox.top = Math.max(0, bbox.top - avgRowHeight * 3);
            candidates.push({
              bbox,
              rows: subCluster.map((r) => ({ lineIndices: r.lineIndices, y: r.y })),
              colSeparators: [],
              hLines: [],
              vLines: []
            });
          }
        }
      }
      runStart = i;
    }
  }
  return candidates;
}
function classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX = 0, boxOriginY = 0, textUnderlines = []) {
  const pageHeight = pageObj.dims.height;
  pageObj.dims.width;
  const lineHeightsPts = pageObj.lines.map((l) => (l.bbox.bottom - l.bbox.top) / scale).filter((h) => h > 2 && h < 100);
  lineHeightsPts.sort((a, b) => a - b);
  const minHLineWidthPts = lineHeightsPts.length > 0 ? lineHeightsPts[Math.floor(lineHeightsPts.length / 2)] : 30;
  const isAchromaticColor = (color) => {
    if (!color || color.length === 0) return true;
    if (color.length === 1) return true;
    if (color.length === 3) {
      const maxC = Math.max(color[0], color[1], color[2]);
      const minC = Math.min(color[0], color[1], color[2]);
      return maxC - minC < 0.15;
    }
    if (color.length === 4) return color[0] < 0.15 && color[1] < 0.15 && color[2] < 0.15;
    return true;
  };
  const isPathAchromatic = (path) => isAchromaticColor(path.stroke ? path.strokeColor : path.fillColor);
  const isRowBandColor = (color) => {
    if (isAchromaticColor(color)) return true;
    if (!color) return false;
    if (color.length === 3) return color[0] >= 0.5 && color[1] >= 0.5 && color[2] >= 0.5;
    if (color.length === 4) {
      const [r, g, b] = cmykToRgb(color[0], color[1], color[2], color[3]);
      return r >= 128 && g >= 128 && b >= 128;
    }
    return false;
  };
  const tilingRectSet = /* @__PURE__ */ new Set();
  const strokedRectBounds = [];
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi];
    if (!path.stroke) continue;
    const cmds = path.commands;
    if (cmds.length !== 5 || cmds[0].type !== "M" || cmds[4].type !== "Z") continue;
    let rMinX = Infinity;
    let rMaxX = -Infinity;
    let rMinY = Infinity;
    let rMaxY = -Infinity;
    for (const c of cmds) {
      if (c.type === "Z") continue;
      if (c.x < rMinX) rMinX = c.x;
      if (c.x > rMaxX) rMaxX = c.x;
      if (c.y < rMinY) rMinY = c.y;
      if (c.y > rMaxY) rMaxY = c.y;
    }
    if (rMaxX - rMinX > 10 && rMaxY - rMinY > 5) {
      strokedRectBounds.push({
        idx: pi,
        left: rMinX,
        right: rMaxX,
        top: rMinY,
        bottom: rMaxY
      });
    }
  }
  for (let i = 0; i < strokedRectBounds.length; i++) {
    if (tilingRectSet.has(strokedRectBounds[i].idx)) continue;
    const a = strokedRectBounds[i];
    for (let j = i + 1; j < strokedRectBounds.length; j++) {
      const b = strokedRectBounds[j];
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const sharedH = xOverlap > 5 && (Math.abs(a.top - b.bottom) < 2 || Math.abs(a.bottom - b.top) < 2);
      const sharedV = yOverlap > 5 && (Math.abs(a.left - b.right) < 2 || Math.abs(a.right - b.left) < 2);
      if (sharedH || sharedV) {
        tilingRectSet.add(a.idx);
        tilingRectSet.add(b.idx);
      }
    }
  }
  const hLines = [];
  const vLines = [];
  const filledRects = [];
  const headerFills = [];
  for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
    const path = paths[pathIdx];
    if (!path.fill && !path.stroke) continue;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const cmd of path.commands) {
      if (cmd.type === "Z") continue;
      if (cmd.x < minX) minX = cmd.x;
      if (cmd.x > maxX) maxX = cmd.x;
      if (cmd.y < minY) minY = cmd.y;
      if (cmd.y > maxY) maxY = cmd.y;
    }
    if (!isFinite(minX)) continue;
    const w = maxX - minX;
    const h = maxY - minY;
    const cmds = path.commands;
    if (path.stroke && cmds.length >= 4) {
      let mlSegments = 0;
      for (let k = 0; k < cmds.length - 1; k++) {
        if (cmds[k].type === "M" && cmds[k + 1].type === "L") mlSegments++;
      }
      if (mlSegments >= 6 && isPathAchromatic(path)) {
        for (let k = 0; k < cmds.length - 1; k++) {
          if (cmds[k].type !== "M" && cmds[k].type !== "L") continue;
          if (cmds[k + 1].type !== "L") continue;
          const p1 = cmds[k];
          const p2 = cmds[k + 1];
          const segW = Math.abs(p2.x - p1.x);
          const segH = Math.abs(p2.y - p1.y);
          if (segH < 2 && segW >= minHLineWidthPts) {
            const segY = (visualHeightPts - ((p1.y + p2.y) / 2 - boxOriginY)) * scale;
            if (segY >= pageHeight * 0.05 && segY <= pageHeight * 0.95) {
              hLines.push({
                left: (Math.min(p1.x, p2.x) - boxOriginX) * scale,
                right: (Math.max(p1.x, p2.x) - boxOriginX) * scale,
                y: segY
              });
            }
          } else if (segW < 2 && segH > 10) {
            const segX = ((p1.x + p2.x) / 2 - boxOriginX) * scale;
            const segTop = (visualHeightPts - (Math.max(p1.y, p2.y) - boxOriginY)) * scale;
            const segBot = (visualHeightPts - (Math.min(p1.y, p2.y) - boxOriginY)) * scale;
            if (segBot - segTop <= pageHeight * 0.8) {
              vLines.push({ top: segTop, bottom: segBot, x: segX });
            }
          }
        }
        continue;
      }
    }
    if (path.fill && cmds.length >= 10 && isRowBandColor(path.fillColor)) {
      const subRects = [];
      for (let k = 0; k + 4 < cmds.length; k++) {
        if (cmds[k].type !== "M") continue;
        if (cmds[k + 1].type !== "L" || cmds[k + 2].type !== "L" || cmds[k + 3].type !== "L" || cmds[k + 4].type !== "Z") continue;
        const p0 = cmds[k];
        const p1 = cmds[k + 1];
        const p2 = cmds[k + 2];
        const p3 = cmds[k + 3];
        const tol = 0.01;
        const horizFirst = Math.abs(p0.y - p1.y) < tol && Math.abs(p2.y - p3.y) < tol && Math.abs(p0.x - p3.x) < tol && Math.abs(p1.x - p2.x) < tol;
        const vertFirst = Math.abs(p0.x - p1.x) < tol && Math.abs(p2.x - p3.x) < tol && Math.abs(p0.y - p3.y) < tol && Math.abs(p1.y - p2.y) < tol;
        if (!horizFirst && !vertFirst) continue;
        const sMinX = Math.min(p0.x, p1.x, p2.x, p3.x);
        const sMaxX = Math.max(p0.x, p1.x, p2.x, p3.x);
        const sMinY = Math.min(p0.y, p1.y, p2.y, p3.y);
        const sMaxY = Math.max(p0.y, p1.y, p2.y, p3.y);
        subRects.push({
          minX: sMinX,
          maxX: sMaxX,
          minY: sMinY,
          maxY: sMaxY
        });
        k += 4;
      }
      if (subRects.length >= 2) {
        for (const sr of subRects) {
          const sw = sr.maxX - sr.minX;
          const sh = sr.maxY - sr.minY;
          if (sw <= minHLineWidthPts) continue;
          if (sh <= minHLineWidthPts * 0.3 || sh >= minHLineWidthPts * 5) continue;
          filledRects.push({
            left: (sr.minX - boxOriginX) * scale,
            top: (visualHeightPts - (sr.maxY - boxOriginY)) * scale,
            right: (sr.maxX - boxOriginX) * scale,
            bottom: (visualHeightPts - (sr.minY - boxOriginY)) * scale,
            color: path.fillColor || []
          });
        }
        continue;
      }
    }
    if (path.stroke && cmds.length === 5 && cmds[0].type === "M" && cmds[1].type === "L" && cmds[2].type === "L" && cmds[3].type === "L" && cmds[4].type === "Z" && w > 10 && h > 5 && tilingRectSet.has(pathIdx)) {
      const pts = [cmds[0], cmds[1], cmds[2], cmds[3]];
      for (let k = 0; k < 4; k++) {
        const p1 = pts[k];
        const p2 = pts[(k + 1) % 4];
        const segW = Math.abs(p2.x - p1.x);
        const segH = Math.abs(p2.y - p1.y);
        if (segH < 2 && segW >= minHLineWidthPts) {
          const segY = (visualHeightPts - ((p1.y + p2.y) / 2 - boxOriginY)) * scale;
          if (segY >= pageHeight * 0.05 && segY <= pageHeight * 0.95) {
            hLines.push({
              left: (Math.min(p1.x, p2.x) - boxOriginX) * scale,
              right: (Math.max(p1.x, p2.x) - boxOriginX) * scale,
              y: segY
            });
          }
        } else if (segW < 2 && segH > 10) {
          const segX = ((p1.x + p2.x) / 2 - boxOriginX) * scale;
          const segTop = (visualHeightPts - (Math.max(p1.y, p2.y) - boxOriginY)) * scale;
          const segBot = (visualHeightPts - (Math.min(p1.y, p2.y) - boxOriginY)) * scale;
          if (segBot - segTop <= pageHeight * 0.8) {
            vLines.push({ top: segTop, bottom: segBot, x: segX });
          }
        }
      }
      continue;
    }
    const displayLeft = (minX - boxOriginX) * scale;
    const displayRight = (maxX - boxOriginX) * scale;
    const displayTop = (visualHeightPts - (maxY - boxOriginY)) * scale;
    const displayBottom = (visualHeightPts - (minY - boxOriginY)) * scale;
    if (h < 2 && w >= minHLineWidthPts && isPathAchromatic(path)) {
      const displayY = (visualHeightPts - ((minY + maxY) / 2 - boxOriginY)) * scale;
      if (displayY < pageHeight * 0.05 || displayY > pageHeight * 0.95) continue;
      hLines.push({ left: displayLeft, right: displayRight, y: displayY });
    } else if (w < 2 && h > 10 && isPathAchromatic(path)) {
      const displayX = ((minX + maxX) / 2 - boxOriginX) * scale;
      const vLineHeight = displayBottom - displayTop;
      if (vLineHeight > pageHeight * 0.8) continue;
      vLines.push({ top: displayTop, bottom: displayBottom, x: displayX });
    } else if (path.fill && w > minHLineWidthPts && h > minHLineWidthPts * 0.5 && h < minHLineWidthPts * 5 && isRowBandColor(path.fillColor)) {
      filledRects.push({
        left: displayLeft,
        top: displayTop,
        right: displayRight,
        bottom: displayBottom,
        color: path.fillColor || []
      });
    } else if (path.fill && w > minHLineWidthPts * 5 && h >= minHLineWidthPts * 3 && h < pageHeight * 0.3 && isPathAchromatic(path)) {
      headerFills.push({
        left: displayLeft,
        top: displayTop,
        right: displayRight,
        bottom: displayBottom,
        color: path.fillColor || []
      });
    }
  }
  reconstituteDashedLines(paths, hLines, vLines, scale, visualHeightPts, boxOriginX, boxOriginY, pageHeight);
  const hLinesKept = dropConsumedUnderlines(hLines, vLines, textUnderlines);
  const rulingRowMembers = /* @__PURE__ */ new Set();
  {
    const yGroups = [];
    for (const hl of hLinesKept) {
      let group = null;
      for (const g of yGroups) {
        if (Math.abs(g.y - hl.y) <= 3) {
          group = g;
          break;
        }
      }
      if (group) {
        group.lines.push(hl);
        group.y = group.lines.reduce((s, l) => s + l.y, 0) / group.lines.length;
      } else {
        yGroups.push({ y: hl.y, lines: [hl] });
      }
    }
    for (const g of yGroups) {
      if (g.lines.length < 2) continue;
      const sorted = [...g.lines].sort((a, b) => a.left - b.left);
      let disjoint = true;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].left < sorted[i - 1].right - 1) {
          disjoint = false;
          break;
        }
      }
      if (!disjoint) continue;
      for (const hl of g.lines) rulingRowMembers.add(hl);
    }
  }
  const filteredHLines = hLinesKept.filter((hl) => {
    if (rulingRowMembers.has(hl)) return true;
    for (const line of pageObj.lines) {
      const lineBottom = line.bbox.bottom;
      const yDist = Math.abs(hl.y - lineBottom);
      if (yDist > 5) continue;
      const lineLeft = line.bbox.left;
      const lineRight = line.bbox.right;
      if (Math.abs(hl.left - lineLeft) < 10 && Math.abs(hl.right - lineRight) < 10) {
        return false;
      }
    }
    return true;
  });
  const rulingHLines = filteredHLines.filter((hl) => rulingRowMembers.has(hl));
  const nonRulingHLines = filteredHLines.filter((hl) => !rulingRowMembers.has(hl));
  const mergedHLines = [
    ...mergeCollinearSegments(rulingHLines, "y", "left", "right", 5, 10),
    ...mergeCollinearSegments(nonRulingHLines, "y", "left", "right", 5, 10)
  ];
  const mergedVLines = mergeCollinearSegments(vLines, "x", "top", "bottom", 5, 10);
  return {
    hLines: mergedHLines,
    vLines: mergedVLines,
    filledRects,
    headerFills
  };
}
function extractRowBandStructure(filledRects, pageLines) {
  if (!filledRects || filledRects.length < 3) return [];
  const sameColor = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.01);
  const visible = [];
  for (let i = 0; i < filledRects.length; i++) {
    const f = filledRects[i];
    let contained = false;
    for (let j = 0; j < filledRects.length; j++) {
      if (i === j) continue;
      const g = filledRects[j];
      if (!sameColor(f.color, g.color)) continue;
      const inside = f.left >= g.left - 1 && f.right <= g.right + 1 && f.top >= g.top - 1 && f.bottom <= g.bottom + 1;
      if (!inside) continue;
      const identical = g.left >= f.left - 1 && g.right <= f.right + 1 && g.top >= f.top - 1 && g.bottom <= f.bottom + 1;
      if (!identical || j < i) {
        contained = true;
        break;
      }
    }
    if (!contained) visible.push(f);
  }
  filledRects = visible;
  const yGroups = [];
  for (const f of filledRects) {
    const g = yGroups.find((gg) => Math.abs(gg.top - f.top) < 2 && Math.abs(gg.bottom - f.bottom) < 2);
    if (g) g.items.push(f);
    else yGroups.push({ top: f.top, bottom: f.bottom, items: [f] });
  }
  const rowCandidates = [];
  for (const g of yGroups) {
    g.items.sort((a, b) => a.left - b.left);
    const ranges = [];
    const cells = [];
    let widest = g.items[0];
    for (const f of g.items) {
      if (f.right - f.left > widest.right - widest.left) widest = f;
      cells.push({ left: f.left, right: f.right });
      const last = ranges[ranges.length - 1];
      if (last && f.left <= last.right + 0.5) {
        last.right = Math.max(last.right, f.right);
      } else {
        ranges.push({ left: f.left, right: f.right });
      }
    }
    rowCandidates.push({
      top: g.top,
      bottom: g.bottom,
      ranges,
      cells,
      color: widest.color
    });
  }
  const bands = rowCandidates.filter((c) => {
    if (c.ranges.length === 0) return false;
    const width = c.ranges[c.ranges.length - 1].right - c.ranges[0].left;
    return width > 50;
  });
  if (bands.length < 3) return [];
  bands.sort((a, b) => a.top - b.top);
  const regions = [];
  for (const b of bands) {
    const bLeft = b.ranges[0].left;
    const bRight = b.ranges[b.ranges.length - 1].right;
    let added = false;
    for (const r of regions) {
      const last = r[r.length - 1];
      const gap = b.top - last.bottom;
      const lastLeft = last.ranges[0].left;
      const lastRight = last.ranges[last.ranges.length - 1].right;
      const hOverlap = bRight > lastLeft && bLeft < lastRight;
      if (!hOverlap) continue;
      if (gap <= 10) {
        r.push(b);
        added = true;
        break;
      }
      const paintedHeights = r.filter((band) => band.cells.length > 0).map((band) => band.bottom - band.top).sort((x, y) => x - y);
      const medH = paintedHeights[Math.floor(paintedHeights.length / 2)];
      const k = Math.round(gap / medH);
      const intervalUnpainted = !bands.some((other) => other !== last && other !== b && other.bottom > last.bottom + 1 && other.top < b.top - 1);
      if (intervalUnpainted && k >= 1 && k <= 2 && Math.abs(gap - k * medH) <= medH * 0.4) {
        let rLeft = Infinity;
        let rRight = -Infinity;
        for (const band of r) {
          if (band.ranges[0].left < rLeft) rLeft = band.ranges[0].left;
          if (band.ranges[band.ranges.length - 1].right > rRight) rRight = band.ranges[band.ranges.length - 1].right;
        }
        const hasText = pageLines.some((line) => {
          const yC = (line.bbox.top + line.bbox.bottom) / 2;
          return yC > last.bottom && yC < b.top && line.bbox.right > rLeft && line.bbox.left < rRight;
        });
        if (hasText) {
          for (let vi = 0; vi < k; vi++) {
            r.push({
              top: last.bottom + gap * vi / k,
              bottom: last.bottom + gap * (vi + 1) / k,
              ranges: [{ left: rLeft, right: rRight }],
              cells: []
            });
          }
          r.push(b);
          added = true;
          break;
        }
      }
    }
    if (!added) regions.push([b]);
  }
  for (let i = regions.length - 1; i >= 0; i--) {
    const a = regions[i];
    const aTop = a[0].top;
    const aBottom = a[a.length - 1].bottom;
    const aLeft = Math.min(...a.map((band) => band.ranges[0].left));
    const aRight = Math.max(...a.map((band) => band.ranges[band.ranges.length - 1].right));
    for (let j = 0; j < regions.length; j++) {
      if (i === j) continue;
      const c = regions[j];
      const cTop = c[0].top;
      const cBottom = c[c.length - 1].bottom;
      const cLeft = Math.min(...c.map((band) => band.ranges[0].left));
      const cRight = Math.max(...c.map((band) => band.ranges[band.ranges.length - 1].right));
      const inside = aTop >= cTop - 5 && aBottom <= cBottom + 5 && aLeft >= cLeft - 5 && aRight <= cRight + 5;
      if (inside && c.length > a.length) {
        c.push(...a);
        c.sort((x, y) => x.top - y.top);
        regions.splice(i, 1);
        break;
      }
    }
  }
  const results = [];
  for (const region of regions) {
    const paintedCount = region.filter((band) => band.cells.length > 0).length;
    if (paintedCount < 3) continue;
    const anchorTol = 3;
    const leftAnchors = [];
    const rightAnchors = [];
    for (const b of region) {
      for (const c of b.cells) {
        leftAnchors.push(c.left);
        rightAnchors.push(c.right);
      }
    }
    const cluster = (values) => {
      values.sort((a, b) => a - b);
      const clusters = [];
      for (const v of values) {
        const last = clusters[clusters.length - 1];
        if (last && v - last.mean < anchorTol) {
          last.values.push(v);
          last.mean = last.values.reduce((s, x) => s + x, 0) / last.values.length;
        } else {
          clusters.push({ values: [v], mean: v });
        }
      }
      return clusters;
    };
    const leftClusters = cluster(leftAnchors);
    const rightClusters = cluster(rightAnchors);
    const minCount = Math.ceil(paintedCount / 2);
    const dominantLefts = leftClusters.filter((c) => c.values.length >= minCount).map((c) => c.mean).sort((a, b) => a - b);
    const dominantRights = rightClusters.filter((c) => c.values.length >= minCount).map((c) => c.mean).sort((a, b) => a - b);
    if (dominantLefts.length < 1) continue;
    const colXs = [];
    for (let i = 0; i < dominantLefts.length - 1; i++) {
      const thisRight = dominantRights[i];
      const nextLeft = dominantLefts[i + 1];
      if (thisRight === void 0 || nextLeft === void 0) continue;
      colXs.push((thisRight + nextLeft) / 2);
    }
    const left = dominantLefts[0];
    const right = dominantRights[dominantRights.length - 1];
    const top = region[0].top;
    const bottom = region[region.length - 1].bottom;
    const rowYs = region.map((b) => ({ top: b.top, bottom: b.bottom }));
    const colorVotes = /* @__PURE__ */ new Map();
    for (const b of region) {
      if (b.cells.length === 0 || !b.color || b.color.length === 0) continue;
      const key = b.color.join(",");
      colorVotes.set(key, (colorVotes.get(key) || 0) + 1);
    }
    let bandColor = null;
    let bandColorVotes = 0;
    for (const [key, votes] of colorVotes) {
      if (votes <= bandColorVotes) continue;
      const c = key.split(",").map(Number);
      let rgb;
      if (c.length === 1) rgb = [c[0] * 255, c[0] * 255, c[0] * 255];
      else if (c.length === 3) rgb = [c[0] * 255, c[1] * 255, c[2] * 255];
      else rgb = cmykToRgb(c[0], c[1], c[2], c[3]);
      rgb = rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))));
      if (rgb.every((v) => v >= 250) || Math.min(...rgb) < 128) continue;
      bandColor = `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      bandColorVotes = votes;
    }
    results.push({
      top,
      bottom,
      left,
      right,
      colXs,
      rowYs,
      bandColor
    });
  }
  return results;
}
function mergeCollinearSegments(segments, posKey, startKey, endKey, tolerance, gapTolerance) {
  const extentGap = gapTolerance;
  if (segments.length === 0) return segments;
  const groups = [];
  for (const seg of segments) {
    let added = false;
    for (const group of groups) {
      if (Math.abs(seg[posKey] - group.pos) <= tolerance) {
        group.segs.push(seg);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push({ pos: seg[posKey], segs: [seg] });
    }
  }
  const result = [];
  for (const group of groups) {
    group.segs.sort((a, b) => a[startKey] - b[startKey]);
    let current = { ...group.segs[0] };
    let currentParts = [{ [startKey]: group.segs[0][startKey], [endKey]: group.segs[0][endKey] }];
    for (let i = 1; i < group.segs.length; i++) {
      const seg = group.segs[i];
      if (seg[startKey] <= current[endKey] + extentGap) {
        if (seg[endKey] > current[endKey]) current[endKey] = seg[endKey];
        currentParts.push({ [startKey]: seg[startKey], [endKey]: seg[endKey] });
      } else {
        current.segments = currentParts;
        result.push(current);
        current = { ...seg };
        currentParts = [{ [startKey]: seg[startKey], [endKey]: seg[endKey] }];
      }
    }
    current.segments = currentParts;
    result.push(current);
  }
  return result;
}
function reconstituteDashedLines(paths, hLines, vLines, scale, visualHeightPts, boxOriginX, boxOriginY, pageHeight) {
  const vCandidates = [];
  const hCandidates = [];
  for (const path of paths) {
    if (!path.stroke) continue;
    const cmds = path.commands;
    if (cmds.length !== 2 || cmds[0].type !== "M" || cmds[1].type !== "L") continue;
    const w = Math.abs(cmds[1].x - cmds[0].x);
    const h = Math.abs(cmds[1].y - cmds[0].y);
    if (w < 2 && h > 1 && h <= 10) {
      vCandidates.push({
        x: (cmds[0].x + cmds[1].x) / 2,
        y1: Math.min(cmds[0].y, cmds[1].y),
        y2: Math.max(cmds[0].y, cmds[1].y)
      });
    } else if (h < 2 && w > 1 && w <= 30) {
      hCandidates.push({
        y: (cmds[0].y + cmds[1].y) / 2,
        x1: Math.min(cmds[0].x, cmds[1].x),
        x2: Math.max(cmds[0].x, cmds[1].x)
      });
    }
  }
  if (vCandidates.length >= 5) {
    const groups = groupByPosition(vCandidates, "x", 2);
    for (const group of groups) {
      if (group.length < 5) continue;
      group.sort((a, b) => a.y1 - b.y1);
      const gaps = [];
      for (let i = 1; i < group.length; i++) {
        gaps.push(group[i].y1 - group[i - 1].y2);
      }
      const sortedGaps = [...gaps].sort((a, b) => a - b);
      const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)];
      if (medianGap < 0 || medianGap >= 2) continue;
      const minY = group[0].y1;
      const maxY = group[group.length - 1].y2;
      const avgX = group.reduce((s, g) => s + g.x, 0) / group.length;
      const displayX = (avgX - boxOriginX) * scale;
      const displayTop = (visualHeightPts - (maxY - boxOriginY)) * scale;
      const displayBot = (visualHeightPts - (minY - boxOriginY)) * scale;
      if (displayBot - displayTop > pageHeight * 0.8) continue;
      vLines.push({ top: displayTop, bottom: displayBot, x: displayX });
    }
  }
  if (hCandidates.length >= 5) {
    const groups = groupByPosition(hCandidates, "y", 2);
    for (const group of groups) {
      if (group.length < 5) continue;
      group.sort((a, b) => a.x1 - b.x1);
      const gaps = [];
      for (let i = 1; i < group.length; i++) {
        gaps.push(group[i].x1 - group[i - 1].x2);
      }
      const sortedGaps = [...gaps].sort((a, b) => a - b);
      const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)];
      if (medianGap < 0 || medianGap >= 2) continue;
      const minX = group[0].x1;
      const maxX = group[group.length - 1].x2;
      const avgY = group.reduce((s, g) => s + g.y, 0) / group.length;
      const displayLeft = (minX - boxOriginX) * scale;
      const displayRight = (maxX - boxOriginX) * scale;
      const displayY = (visualHeightPts - (avgY - boxOriginY)) * scale;
      if (displayY < pageHeight * 0.05 || displayY > pageHeight * 0.95) continue;
      hLines.push({ left: displayLeft, right: displayRight, y: displayY });
    }
  }
}
function groupByPosition(items, posKey, tolerance) {
  const groups = [];
  for (const item of items) {
    let added = false;
    for (const group of groups) {
      if (Math.abs(item[posKey] - group[0][posKey]) <= tolerance) {
        group.push(item);
        added = true;
        break;
      }
    }
    if (!added) groups.push([item]);
  }
  return groups;
}
function correlatePathsWithCandidate(candidate, pathData) {
  const b = candidate.bbox;
  const yTol = 15;
  const xOverlapThreshold = 0.3;
  for (const hl of pathData.hLines) {
    if (hl.y < b.top - yTol || hl.y > b.bottom + yTol) continue;
    const overlapLeft = Math.max(hl.left, b.left);
    const overlapRight = Math.min(hl.right, b.right);
    const overlap = Math.max(0, overlapRight - overlapLeft);
    const hlWidth = hl.right - hl.left;
    if (hlWidth > 0 && overlap / hlWidth > xOverlapThreshold) {
      candidate.hLines.push(hl);
    }
  }
  for (const vl of pathData.vLines) {
    if (vl.x < b.left - 5 || vl.x > b.right + 5) continue;
    const overlapTop = Math.max(vl.top, b.top);
    const overlapBottom = Math.min(vl.bottom, b.bottom);
    if (overlapBottom - overlapTop > (b.bottom - b.top) * 0.2) {
      candidate.vLines.push(vl);
    }
  }
}
function validateCandidate(candidate, lines) {
  const rows = candidate.rows;
  const rowIsMultiSeg = (r) => r.lineIndices.length >= 2 || r.lineIndices.length === 1 && isRightClusteredNumeric(lines[r.lineIndices[0]].words);
  const multiSegRows = rows.filter(rowIsMultiSeg);
  if (multiSegRows.length < 3) return false;
  const leftEdges = [];
  const rightEdges = [];
  for (const row of rows) {
    for (const idx of row.lineIndices) {
      leftEdges.push(Math.round(lines[idx].bbox.left / 5) * 5);
      rightEdges.push(Math.round(lines[idx].bbox.right / 5) * 5);
    }
  }
  const leftCounts = {};
  for (const x of leftEdges) leftCounts[x] = (leftCounts[x] || 0) + 1;
  const rightCounts = {};
  for (const x of rightEdges) rightCounts[x] = (rightCounts[x] || 0) + 1;
  const alignMinCount = Math.max(2, rows.length * 0.3);
  const alignedLeft = Object.values(leftCounts).filter((c) => c >= alignMinCount).length;
  const alignedRight = Object.values(rightCounts).filter((c) => c >= alignMinCount).length;
  if (alignedLeft + alignedRight < 2) return false;
  const segCounts = {};
  for (const row of multiSegRows) {
    const n = row.lineIndices.length;
    segCounts[n] = (segCounts[n] || 0) + 1;
  }
  if (multiSegRows.length >= 10) {
    let bestCluster = 0;
    for (const k of Object.keys(segCounts)) {
      const c = Number(k);
      const cluster = (segCounts[c - 1] || 0) + (segCounts[c] || 0) + (segCounts[c + 1] || 0);
      if (cluster > bestCluster) bestCluster = cluster;
    }
    if (bestCluster < multiSegRows.length * 0.4) return false;
  } else {
    const maxSegCount = Object.values(segCounts).reduce((m, v) => Math.max(m, v), -Infinity);
    if (maxSegCount < multiSegRows.length * 0.4) return false;
  }
  let tinyCount = 0;
  let totalLines = 0;
  for (const row of rows) {
    for (const idx of row.lineIndices) {
      totalLines++;
      if (lines[idx].bbox.right - lines[idx].bbox.left < 70) tinyCount++;
    }
  }
  if (totalLines > 0 && tinyCount / totalLines > 0.7) return false;
  const hasLetter = (s) => /[a-zA-Z]/.test(s);
  const isNumToken2 = (s) => /^[\d,$%.()+-]+$/.test(s) && /\d/.test(s);
  const cellIsProse = (lineIdx) => {
    const words = lines[lineIdx].words;
    if (words.length < 3) return false;
    let alpha = 0;
    let numeric = 0;
    for (const w of words) {
      if (hasLetter(w.text)) alpha++;
      if (isNumToken2(w.text)) numeric++;
    }
    return alpha >= 3 && numeric === 0;
  };
  let proseRowCount = 0;
  for (const row of rows) {
    if (row.lineIndices.length < 2) continue;
    let proseCells = 0;
    let numericCells = 0;
    for (const idx of row.lineIndices) {
      if (cellIsProse(idx)) proseCells++;
      if (lines[idx].words.some((w) => isNumToken2(w.text))) numericCells++;
    }
    if (proseCells >= 2 && numericCells < 2) proseRowCount++;
  }
  if (proseRowCount > rows.length * 0.4) return false;
  const cellIsTextFragment = (lineIdx) => {
    const words = lines[lineIdx].words;
    if (words.length < 2) return false;
    for (const w of words) if (hasLetter(w.text)) return true;
    return false;
  };
  const multiSegRowCount = rows.filter((r) => r.lineIndices.length >= 2).length;
  if (multiSegRowCount >= 3) {
    let narrativeRowCount = 0;
    for (const row of rows) {
      if (row.lineIndices.length < 2) continue;
      let allNarrative = true;
      let maxWidth = 0;
      for (const idx of row.lineIndices) {
        const w = lines[idx].bbox.right - lines[idx].bbox.left;
        if (w > maxWidth) maxWidth = w;
      }
      for (const idx of row.lineIndices) {
        if (!cellIsTextFragment(idx)) {
          allNarrative = false;
          break;
        }
        const w = lines[idx].bbox.right - lines[idx].bbox.left;
        if (w < maxWidth * 0.5) {
          allNarrative = false;
          break;
        }
      }
      if (allNarrative) narrativeRowCount++;
    }
    if (narrativeRowCount > multiSegRowCount * 0.5) return false;
  }
  return true;
}
function dropConsumedUnderlines(hLines, vLines, textUnderlines) {
  if (textUnderlines.length === 0) return hLines;
  return hLines.filter((h) => {
    const match = textUnderlines.some((u) => Math.abs(h.y - u.y) <= 5 && Math.abs(h.left - u.left) <= 5 && Math.abs(h.right - u.right) <= 5);
    if (!match) return true;
    return vLines.some((v) => (v.x1 ?? v.x) >= h.left - 2 && (v.x0 ?? v.x) <= h.right + 2 && (h.y1 ?? h.y) >= v.top - 2 && (h.y0 ?? h.y) <= v.bottom + 2);
  });
}
function extractGridSegments(paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines = []) {
  const hPieces = [];
  const vPieces = [];
  const bandRects = [];
  const addPiece = (p1x, p1y, p2x, p2y, halfThick, barKey = -1, chroma = false) => {
    const segW = Math.abs(p2x - p1x);
    const segH = Math.abs(p2y - p1y);
    if (segH < 2 && segW > 0) {
      const pos = (p1y + p2y) / 2;
      hPieces.push({
        pos,
        start: Math.min(p1x, p2x),
        end: Math.max(p1x, p2x),
        b0: pos - halfThick,
        b1: pos + halfThick,
        barKey,
        chroma
      });
    }
    if (segW < 2 && segH > 0) {
      const pos = (p1x + p2x) / 2;
      vPieces.push({
        pos,
        start: Math.min(p1y, p2y),
        end: Math.max(p1y, p2y),
        b0: pos - halfThick,
        b1: pos + halfThick,
        barKey,
        chroma
      });
    }
  };
  for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
    const path = paths[pathIdx];
    if (!path.fill && !path.stroke) continue;
    const cmds = path.commands;
    const halfStroke = (path.lineWidth || 1) / 2;
    const pcolor = path.stroke ? path.strokeColor : path.fillColor;
    let pathChroma = false;
    if (Array.isArray(pcolor)) {
      if (pcolor.length === 3) pathChroma = Math.max(pcolor[0], pcolor[1], pcolor[2]) - Math.min(pcolor[0], pcolor[1], pcolor[2]) >= 0.15;
      else if (pcolor.length === 4) pathChroma = !(pcolor[0] < 0.15 && pcolor[1] < 0.15 && pcolor[2] < 0.15);
    }
    const fc = path.fillColor;
    const lightFill = !!path.fill && Array.isArray(fc) && fc.length > 0 && (fc.length === 1 ? fc[0] >= 0.5 : fc.length === 3 ? fc[0] >= 0.5 && fc[1] >= 0.5 && fc[2] >= 0.5 : fc.length === 4 && fc[0] < 0.5 && fc[1] < 0.5 && fc[2] < 0.5 && fc[3] < 0.5);
    const subBoxes = [];
    for (const c of cmds) {
      if (c.type === "Z") continue;
      if (c.type === "M") {
        subBoxes.push({
          x0: c.x,
          x1: c.x,
          y0: c.y,
          y1: c.y,
          curved: false
        });
        continue;
      }
      const b = subBoxes[subBoxes.length - 1];
      if (!b) continue;
      if (c.type === "C") b.curved = true;
      for (const [px, py] of c.type === "C" ? [[c.x1, c.y1], [c.x2, c.y2], [c.x, c.y]] : [[c.x, c.y]]) {
        if (px < b.x0) b.x0 = px;
        if (px > b.x1) b.x1 = px;
        if (py < b.y0) b.y0 = py;
        if (py > b.y1) b.y1 = py;
      }
    }
    const thinH = subBoxes.length >= 2 && subBoxes.every((b) => !b.curved && b.y1 - b.y0 < 2) && Math.max(...subBoxes.map((b) => (b.y0 + b.y1) / 2)) - Math.min(...subBoxes.map((b) => (b.y0 + b.y1) / 2)) <= 1;
    const thinV = subBoxes.length >= 2 && subBoxes.every((b) => !b.curved && b.x1 - b.x0 < 2) && Math.max(...subBoxes.map((b) => (b.x0 + b.x1) / 2)) - Math.min(...subBoxes.map((b) => (b.x0 + b.x1) / 2)) <= 1;
    const pathBarKey = thinH || thinV ? pathIdx : -1;
    if (path.stroke && cmds.length === 5 && cmds[0].type === "M" && cmds[1].type === "L" && cmds[2].type === "L" && cmds[3].type === "L" && cmds[4].type === "Z") {
      const pts = [cmds[0], cmds[1], cmds[2], cmds[3]];
      for (let k = 0; k < 4; k++) {
        addPiece(pts[k].x, pts[k].y, pts[(k + 1) % 4].x, pts[(k + 1) % 4].y, halfStroke, pathBarKey, pathChroma);
      }
      continue;
    }
    if (path.stroke) {
      for (let k = 0; k < cmds.length - 1; k++) {
        if ((cmds[k].type === "M" || cmds[k].type === "L") && cmds[k + 1].type === "L") {
          addPiece(cmds[k].x, cmds[k].y, cmds[k + 1].x, cmds[k + 1].y, halfStroke, pathBarKey, pathChroma);
        }
      }
      continue;
    }
    if (path.fill) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let pts = [];
      const emitSubpath = () => {
        if (!Number.isFinite(minX)) {
          pts = [];
          return;
        }
        const w = maxX - minX;
        const h = maxY - minY;
        if (h < 5 && w > 0) {
          hPieces.push({
            pos: (minY + maxY) / 2,
            start: minX,
            end: maxX,
            b0: minY,
            b1: maxY,
            barKey: pathBarKey,
            chroma: pathChroma
          });
        }
        if (w < 5 && h > 0) {
          vPieces.push({
            pos: (minX + maxX) / 2,
            start: minY,
            end: maxY,
            b0: minX,
            b1: maxX,
            barKey: pathBarKey,
            chroma: pathChroma
          });
        }
        if (lightFill && h >= 5 && w >= 5 && pts.length >= 4 && pts.length <= 5) {
          let rect = true;
          for (let i = 0; i < pts.length && rect; i++) {
            const p = pts[i];
            const q = pts[(i + 1) % pts.length];
            if (Math.abs(q.x - p.x) >= 2 && Math.abs(q.y - p.y) >= 2) rect = false;
          }
          if (rect) {
            bandRects.push({
              minX,
              maxX,
              minY,
              maxY
            });
          }
        }
        if (h >= 5 && w >= 5 && pts.length >= 4) {
          let area2 = 0;
          let perim = 0;
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            const q = pts[(i + 1) % pts.length];
            area2 += p.x * q.y - q.x * p.y;
            perim += Math.hypot(q.x - p.x, q.y - p.y);
          }
          const t = perim > 0 ? Math.abs(area2) / perim : Infinity;
          let isStrip = t < 5;
          if (isStrip) {
            for (let i = 0; i < pts.length; i++) {
              const p = pts[i];
              const q = pts[(i + 1) % pts.length];
              const dx = Math.abs(q.x - p.x);
              const dy = Math.abs(q.y - p.y);
              if (dx >= 2 && dy >= 2 && Math.hypot(dx, dy) > Math.max(3 * t, 3)) {
                isStrip = false;
                break;
              }
            }
          }
          if (isStrip) {
            for (let i = 0; i < pts.length; i++) {
              const p = pts[i];
              const q = pts[(i + 1) % pts.length];
              const dx = Math.abs(q.x - p.x);
              const dy = Math.abs(q.y - p.y);
              if ((dx < 2 || dy < 2) && Math.max(dx, dy) > Math.max(3 * t, 5)) {
                addPiece(p.x, p.y, q.x, q.y, t / 2, -1, pathChroma);
              }
            }
          }
        }
        pts = [];
        minX = Infinity;
        maxX = -Infinity;
        minY = Infinity;
        maxY = -Infinity;
      };
      for (const c of cmds) {
        if (c.type === "Z") continue;
        if (c.type === "M") emitSubpath();
        pts.push({ x: c.x, y: c.y });
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      }
      emitSubpath();
    }
  }
  const mergeAbutting = (pieces) => {
    const groups = [];
    for (const piece of pieces) {
      let group = null;
      for (const g of groups) {
        if (Math.abs(piece.pos - g.pos) <= 0.5) {
          group = g;
          break;
        }
      }
      if (!group) {
        group = { pos: piece.pos, segs: [] };
        groups.push(group);
      }
      group.segs.push(piece);
    }
    const runs = [];
    for (const g of groups) {
      g.segs.sort((a, b) => a.start - b.start);
      const groupRuns = [];
      let cur = { ...g.segs[0], barKeys: new Set(g.segs[0].barKey >= 0 ? [g.segs[0].barKey] : []) };
      for (let i = 1; i < g.segs.length; i++) {
        const s = g.segs[i];
        if (s.start <= cur.end + 0.5) {
          if (s.end > cur.end) cur.end = s.end;
          if (s.b0 < cur.b0) cur.b0 = s.b0;
          if (s.b1 > cur.b1) cur.b1 = s.b1;
          if (!s.chroma) cur.chroma = false;
          if (s.barKey >= 0) cur.barKeys.add(s.barKey);
        } else {
          groupRuns.push(cur);
          cur = { ...s, barKeys: new Set(s.barKey >= 0 ? [s.barKey] : []) };
        }
      }
      groupRuns.push(cur);
      for (let i = 0; i < groupRuns.length; i++) {
        const r = groupRuns[i];
        if (r.barKeys.size === 0) continue;
        for (let j = i + 1; j < groupRuns.length; j++) {
          const o = groupRuns[j];
          let sameShape = false;
          for (const k1 of r.barKeys) {
            if (o.barKeys.has(k1)) {
              sameShape = true;
              break;
            }
          }
          if (!sameShape) continue;
          if (o.start < r.start) r.start = o.start;
          if (o.end > r.end) r.end = o.end;
          if (o.b0 < r.b0) r.b0 = o.b0;
          if (o.b1 > r.b1) r.b1 = o.b1;
          for (const k of o.barKeys) r.barKeys.add(k);
          groupRuns.splice(j, 1);
          j--;
        }
      }
      runs.push(...groupRuns);
    }
    return runs.filter((r) => r.end - r.start > 5);
  };
  const hLines = mergeAbutting(hPieces).map((r) => ({
    left: (r.start - boxOriginX) * scale,
    right: (r.end - boxOriginX) * scale,
    y: (visualHeightPts - (r.pos - boxOriginY)) * scale,
    y0: (visualHeightPts - (r.b1 - boxOriginY)) * scale,
    y1: (visualHeightPts - (r.b0 - boxOriginY)) * scale,
    chroma: r.chroma === true
  }));
  const vLines = mergeAbutting(vPieces).map((r) => ({
    x: (r.pos - boxOriginX) * scale,
    top: (visualHeightPts - (r.end - boxOriginY)) * scale,
    bottom: (visualHeightPts - (r.start - boxOriginY)) * scale,
    x0: (r.b0 - boxOriginX) * scale,
    x1: (r.b1 - boxOriginX) * scale,
    chroma: r.chroma === true
  }));
  const bands = bandRects.map((b) => ({
    left: (b.minX - boxOriginX) * scale,
    right: (b.maxX - boxOriginX) * scale,
    top: (visualHeightPts - (b.maxY - boxOriginY)) * scale,
    bottom: (visualHeightPts - (b.minY - boxOriginY)) * scale
  }));
  return { hLines: dropConsumedUnderlines(hLines, vLines, textUnderlines), vLines, bands };
}
function detectStrictGrids(pageObj, paths, scale, visualHeightPts, boxOriginX = 0, boxOriginY = 0, textUnderlines = []) {
  const raw = extractGridSegments(paths, scale, visualHeightPts, boxOriginX, boxOriginY, textUnderlines);
  const hLines = mergeCollinearSegments(raw.hLines, "y", "left", "right", 5, 10);
  const vLines = mergeCollinearSegments(raw.vLines, "x", "top", "bottom", 5, 10);
  if (hLines.length < 3 || vLines.length < 2) return [];
  const TOL = 6;
  const INK_EPS = 2;
  const N = hLines.length + vLines.length;
  const parent = new Int32Array(N);
  for (let i = 0; i < N; i++) parent[i] = i;
  const find = (i) => {
    let r = i;
    while (parent[r] !== r) r = parent[r];
    while (parent[i] !== r) {
      const next = parent[i];
      parent[i] = r;
      i = next;
    }
    return r;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < hLines.length; i++) {
    const a = hLines[i];
    for (let j = i + 1; j < hLines.length; j++) {
      const b = hLines[j];
      if (Math.abs(a.y - b.y) <= TOL && Math.min(a.right, b.right) >= Math.max(a.left, b.left) - TOL) {
        union(i, j);
      }
    }
    for (let j = 0; j < vLines.length; j++) {
      const v = vLines[j];
      if ((v.x1 ?? v.x) >= a.left - INK_EPS && (v.x0 ?? v.x) <= a.right + INK_EPS && (a.y1 ?? a.y) >= v.top - INK_EPS && (a.y0 ?? a.y) <= v.bottom + INK_EPS) {
        union(i, hLines.length + j);
      }
    }
  }
  for (let i = 0; i < vLines.length; i++) {
    const a = vLines[i];
    for (let j = i + 1; j < vLines.length; j++) {
      const b = vLines[j];
      if (Math.abs(a.x - b.x) <= TOL && Math.min(a.bottom, b.bottom) >= Math.max(a.top, b.top) - TOL) {
        union(hLines.length + i, hLines.length + j);
      }
    }
  }
  const components = /* @__PURE__ */ new Map();
  for (let i = 0; i < hLines.length; i++) {
    const r = find(i);
    let c = components.get(r);
    if (!c) {
      c = { hs: [], vs: [] };
      components.set(r, c);
    }
    c.hs.push(hLines[i]);
  }
  for (let i = 0; i < vLines.length; i++) {
    const r = find(hLines.length + i);
    let c = components.get(r);
    if (!c) {
      c = { hs: [], vs: [] };
      components.set(r, c);
    }
    c.vs.push(vLines[i]);
  }
  const results = [];
  for (const comp of components.values()) {
    let t = null;
    if (comp.hs.length >= 3 && comp.vs.length >= 2) {
      t = tryDetectStrictGrid(comp.hs, comp.vs, pageObj, raw.bands);
    }
    if (!t && comp.hs.length >= 1 && comp.vs.length >= 2) {
      t = tryDetectColumnRuleTable(comp.hs, comp.vs, pageObj);
    }
    if (t) results.push(t);
  }
  results.sort((a, b) => a.bbox.top - b.bbox.top);
  for (let i = 0; i + 1 < results.length; i++) {
    const cur = results[i];
    const next = results[i + 1];
    if (cur.provisionalTopOpen || next.provisionalTopOpen) continue;
    if (cur.detectionMethod !== next.detectionMethod) continue;
    const gap = next.bbox.top - cur.bbox.bottom;
    if (gap < 0 || gap >= 40) continue;
    if (Math.abs(cur.bbox.left - next.bbox.left) > 15 || Math.abs(cur.bbox.right - next.bbox.right) > 15) continue;
    if (cur.colSeparators.length !== next.colSeparators.length) continue;
    let sameCols = true;
    for (let c = 0; c < cur.colSeparators.length; c++) {
      if (Math.abs(cur.colSeparators[c] - next.colSeparators[c]) >= 10) {
        sameCols = false;
        break;
      }
    }
    if (!sameCols) continue;
    cur.bbox.left = Math.min(cur.bbox.left, next.bbox.left);
    cur.bbox.right = Math.max(cur.bbox.right, next.bbox.right);
    cur.bbox.bottom = next.bbox.bottom;
    cur.rows.push(...next.rows);
    cur.hLines.push(...next.hLines);
    cur.vLines.push(...next.vLines);
    results.splice(i + 1, 1);
    i--;
  }
  return results;
}
function clusterValuesLocal(values, tol) {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1];
    if (sorted[i] - last[last.length - 1] <= tol) {
      last.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  return clusters.map((c) => c[Math.floor(c.length / 2)]);
}
function unionSpansFully(segs, left, right, tol) {
  if (segs.length === 0) return false;
  if (segs[0].left > left + tol) return false;
  let furthest = segs[0].right;
  for (let i = 1; i < segs.length; i++) {
    if (segs[i].left > furthest + tol) return false;
    if (segs[i].right > furthest) furthest = segs[i].right;
  }
  return furthest >= right - tol;
}
function tryDetectStrictGrid(hs, vs, pageObj, bands = []) {
  if (hs.length < 3) return null;
  const left = hs.reduce((m, h) => Math.min(m, h.left), Infinity);
  const right = hs.reduce((m, h) => Math.max(m, h.right), -Infinity);
  const ys = clusterValuesLocal(hs.map((h) => h.y), 5);
  if (ys.length < 3) return null;
  if (right - left < pageObj.dims.width * 0.3 && ys.length - 1 < 6) return null;
  const segsByY = /* @__PURE__ */ new Map();
  for (const py of ys) {
    const segs = hs.filter((h) => Math.abs(h.y - py) < 5).map((h) => ({ left: h.left, right: h.right })).sort((a, b) => a.left - b.left);
    segsByY.set(py, segs);
  }
  let provisionalTopOpen = false;
  if (ys.length >= 4 && !unionSpansFully(segsByY.get(ys[0]), left, right, 15) && unionSpansFully(segsByY.get(ys[1]), left, right, 15)) {
    provisionalTopOpen = true;
    ys.shift();
  }
  const minY = ys[0];
  const maxY = ys[ys.length - 1];
  const strips = [];
  for (let i = 0; i < ys.length - 1; i++) {
    const top = ys[i];
    const bot = ys[i + 1];
    const stripVs = vs.filter((v) => v.top <= top + 10 && v.bottom >= bot - 10);
    const xs = clusterValuesLocal(stripVs.map((v) => v.x), 10);
    if (xs.length < 2 || Math.abs(xs[0] - left) > 15 || Math.abs(xs[xs.length - 1] - right) > 15) return null;
    strips.push({ top, bottom: bot, xs });
  }
  if (strips.length < 2) return null;
  const maxCols = Math.max(...strips.map((s) => s.xs.length));
  const dataStrips = strips.filter((s) => s.xs.length === maxCols);
  if (dataStrips.length < 2) return null;
  const canonicalXs = dataStrips[0].xs;
  for (const s of dataStrips) {
    if (s.xs.length !== canonicalXs.length) return null;
    for (let i = 0; i < s.xs.length; i++) {
      if (Math.abs(s.xs[i] - canonicalXs[i]) >= 10) return null;
    }
  }
  for (const s of strips) {
    if (s.xs.length === maxCols) continue;
    for (const x of s.xs) {
      if (!canonicalXs.some((cx) => Math.abs(cx - x) < 10)) return null;
    }
  }
  for (let i = 0; i < ys.length; i++) {
    const segs = segsByY.get(ys[i]);
    if (i === 0 || i === ys.length - 1) {
      if (!unionSpansFully(segs, left, right, 15)) return null;
      continue;
    }
    if (segs[0].left > left + 15) return null;
    let furthest = segs[0].right;
    for (let j = 1; j < segs.length; j++) {
      if (segs[j].left > furthest + 15) {
        const gapStart = furthest;
        const gapEnd = segs[j].left;
        if (!canonicalXs.some((cx) => Math.abs(cx - gapStart) < 10) || !canonicalXs.some((cx) => Math.abs(cx - gapEnd) < 10)) return null;
      }
      if (segs[j].right > furthest) furthest = segs[j].right;
    }
    if (furthest < right - 15) return null;
  }
  const colSeparators = canonicalXs.slice(1, -1);
  const bbox = {
    left,
    top: minY - 5,
    right,
    bottom: maxY + 5
  };
  const rows = [];
  for (const strip of strips) {
    let idxs = [];
    for (let i = 0; i < pageObj.lines.length; i++) {
      const ln = pageObj.lines[i];
      const yC = (ln.bbox.top + ln.bbox.bottom) / 2;
      if (yC >= strip.top - 5 && yC <= strip.bottom + 5 && ln.bbox.left >= bbox.left - 10 && ln.bbox.right <= bbox.right + 10) {
        idxs.push(i);
      }
    }
    if (idxs.length === 0) continue;
    if (strip === strips[0]) {
      for (const band of bands) {
        const edge = band.bottom;
        if (Math.abs(band.top - strip.top) > 6 || band.left > left + 15 || band.right < right - 15) continue;
        if (edge < strip.top + 6 || edge > strip.bottom - 6) continue;
        const above = idxs.filter((i) => (pageObj.lines[i].bbox.top + pageObj.lines[i].bbox.bottom) / 2 < edge);
        if (above.length === 0 || above.length === idxs.length) continue;
        if (idxs.some((i) => pageObj.lines[i].bbox.top < edge - 2 && pageObj.lines[i].bbox.bottom > edge + 2)) continue;
        rows.push({
          lineIndices: above,
          y: above.reduce((s, i) => s + pageObj.lines[i].bbox.top, 0) / above.length,
          bottom: edge
        });
        idxs = idxs.filter((i) => !above.includes(i));
        break;
      }
    }
    const yMean = idxs.reduce((s, i) => s + pageObj.lines[i].bbox.top, 0) / idxs.length;
    rows.push({ lineIndices: idxs, y: yMean, bottom: strip.bottom });
  }
  if (rows.length < 2) return null;
  const colVs = vs.filter((v) => canonicalXs.some((cx) => Math.abs(cx - v.x) < 10));
  const absorbCutRow = (regionTop, regionBottom, atTop) => {
    const idxs = [];
    for (let i = 0; i < pageObj.lines.length; i++) {
      const ln = pageObj.lines[i];
      const yC = (ln.bbox.top + ln.bbox.bottom) / 2;
      if (yC >= regionTop && yC <= regionBottom && ln.bbox.left >= bbox.left - 10 && ln.bbox.right <= bbox.right + 10) {
        idxs.push(i);
      }
    }
    if (idxs.length === 0) return;
    const yMean = idxs.reduce((s, i) => s + pageObj.lines[i].bbox.top, 0) / idxs.length;
    if (atTop) {
      rows.unshift({ lineIndices: idxs, y: yMean, bottom: regionBottom });
      bbox.top = regionTop - 5;
    } else {
      rows.push({ lineIndices: idxs, y: yMean, bottom: regionBottom });
      bbox.bottom = regionBottom + 5;
    }
  };
  const cutTopVs = colVs.filter((v) => v.top <= minY - 15);
  if (cutTopVs.length >= 2 && Math.min(...cutTopVs.map((v) => v.x)) <= left + 15 && Math.max(...cutTopVs.map((v) => v.x)) >= right - 15) {
    absorbCutRow(Math.min(...cutTopVs.map((v) => v.top)), minY, true);
  }
  const cutBotVs = colVs.filter((v) => v.bottom >= maxY + 15);
  if (cutBotVs.length >= 2 && Math.min(...cutBotVs.map((v) => v.x)) <= left + 15 && Math.max(...cutBotVs.map((v) => v.x)) >= right - 15) {
    absorbCutRow(maxY, Math.max(...cutBotVs.map((v) => v.bottom)), false);
  }
  const gridColBounds = [bbox.left, ...colSeparators, bbox.right];
  let stripInHeader = true;
  for (let ri = 0; ri < rows.length; ri++) {
    const strip = rows[ri];
    if (strip.lineIndices.length < 2) continue;
    let logical = null;
    if (stripInHeader) {
      const hRows = deriveLogicalRows(strip.lineIndices, pageObj.lines, gridColBounds, "header");
      const hts = strip.lineIndices.map((li) => pageObj.lines[li].bbox.bottom - pageObj.lines[li].bbox.top).filter((h) => h > 0).sort((a, b) => a - b);
      const stripMedH = hts[Math.floor(hts.length / 2)] || 20;
      const solidCompletePair = hRows.some((r, i) => i > 0 && r.top - hRows[i - 1].bottom <= stripMedH * 0.8 && r.colsHit >= 2 && hRows[i - 1].colsHit >= 2);
      if (hRows.length >= 4 || solidCompletePair) {
        stripInHeader = false;
      } else {
        logical = hRows;
      }
    }
    if (!logical) logical = deriveLogicalRows(strip.lineIndices, pageObj.lines, gridColBounds);
    if (logical.length < 2) continue;
    const replacement = logical.map((r, li) => ({
      lineIndices: r.lineIndices,
      y: r.top,
      bottom: li + 1 < logical.length ? (r.bottom + logical[li + 1].top) / 2 : strip.bottom
    }));
    rows.splice(ri, 1, ...replacement);
    ri += replacement.length - 1;
  }
  const table = {
    bbox,
    rows,
    colSeparators,
    hLines: hs,
    vLines: vs,
    detectionMethod: "grid-strong"
  };
  if (provisionalTopOpen) table.provisionalTopOpen = true;
  return table;
}
function deriveLogicalRows(lineIdxArr, lines, colBounds, mode = "data") {
  if (lineIdxArr.length === 0) return [];
  const heights = lineIdxArr.map((i) => lines[i].bbox.bottom - lines[i].bbox.top).filter((h) => h > 0).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)] || 20;
  const entries = lineIdxArr.map((i) => ({ i, top: lines[i].bbox.top, bottom: lines[i].bbox.bottom })).sort((a, b) => a.bottom - b.bottom);
  const rows = [];
  for (const e of entries) {
    const cur = rows[rows.length - 1];
    if (cur && e.bottom - cur.bottom <= medH * 0.45) {
      cur.lineIndices.push(e.i);
      if (e.top < cur.top) cur.top = e.top;
      if (e.bottom > cur.bottom) cur.bottom = e.bottom;
    } else {
      rows.push({
        lineIndices: [e.i],
        top: e.top,
        bottom: e.bottom,
        cols: /* @__PURE__ */ new Map()
      });
    }
  }
  const colOf = (x) => {
    for (let c = 1; c < colBounds.length - 1; c++) {
      if (x < colBounds[c]) return c - 1;
    }
    return colBounds.length - 2;
  };
  const fillCols = (row) => {
    row.cols.clear();
    for (const li of row.lineIndices) {
      for (const w of lines[li].words) {
        const c = colOf((w.bbox.left + w.bbox.right) / 2);
        let arr = row.cols.get(c);
        if (!arr) {
          arr = [];
          row.cols.set(c, arr);
        }
        arr.push(w);
      }
    }
    for (const arr of row.cols.values()) arr.sort((a, b) => a.bbox.left - b.bbox.left);
  };
  for (const row of rows) fillCols(row);
  rows.sort((a, b) => a.top - b.top);
  const isValueRowPair = (a, b) => {
    let aligned = 0;
    for (const [c, aWords] of a.cols) {
      const bWords = b.cols.get(c);
      if (!bWords) continue;
      const aR = aWords[aWords.length - 1].bbox.right;
      const bR = bWords[bWords.length - 1].bbox.right;
      if (Math.abs(aR - bR) <= 4) aligned++;
      if (aligned >= 2) return true;
    }
    return false;
  };
  const canMerge = (a, b) => {
    if (mode === "header") {
      if (b.top - a.bottom > medH * 0.8) return false;
      return !(a.cols.size >= 2 && b.cols.size >= 2 && isValueRowPair(a, b));
    }
    if (b.top - a.bottom > medH * 0.25) return false;
    const shared = [];
    for (const c of a.cols.keys()) if (b.cols.has(c)) shared.push(c);
    if (shared.length === 0) return false;
    for (const c of shared) {
      const bFirst = (
        /** @type {OcrWord[]} */
        b.cols.get(c)[0]
      );
      const colLeft = colBounds[c];
      if (bFirst.bbox.left >= colLeft + (colBounds[c + 1] - colLeft) * 0.55) return false;
      if (!/^[\p{Ll}([{]/u.test(bFirst.text)) return false;
    }
    return true;
  };
  let mergedAny = rows.length > 1;
  while (mergedAny) {
    mergedAny = false;
    const pairs = [];
    for (let i = 0; i + 1 < rows.length; i++) {
      pairs.push({ i, gap: rows[i + 1].top - rows[i].bottom });
    }
    pairs.sort((a, b) => a.gap - b.gap);
    for (const { i } of pairs) {
      const a = rows[i];
      const b = rows[i + 1];
      if (!a || !b) continue;
      if (!canMerge(a, b)) continue;
      a.lineIndices.push(...b.lineIndices);
      if (b.top < a.top) a.top = b.top;
      if (b.bottom > a.bottom) a.bottom = b.bottom;
      fillCols(a);
      rows.splice(i + 1, 1);
      mergedAny = true;
      break;
    }
  }
  return rows.map((r) => ({
    lineIndices: r.lineIndices,
    top: r.top,
    bottom: r.bottom,
    colsHit: r.cols.size
  }));
}
function tryDetectColumnRuleTable(hs, vs, pageObj) {
  const lines = pageObj.lines;
  if (lines.length === 0) return null;
  hs = hs.filter((h) => !h.chroma);
  vs = vs.filter((v) => !v.chroma);
  if (hs.length < 1 || vs.length < 2) return null;
  const pageHeights = lines.map((l) => l.bbox.bottom - l.bbox.top).filter((h) => h > 2).sort((a, b) => a - b);
  const pageMedH = pageHeights[Math.floor(pageHeights.length / 2)] || 20;
  const xs = clusterValuesLocal(vs.map((v) => v.x), 10);
  let boundaries = xs.map((bx) => {
    const members = vs.filter((v) => Math.abs(v.x - bx) < 10);
    return {
      x: bx,
      top: Math.min(...members.map((v) => v.top)),
      bottom: Math.max(...members.map((v) => v.bottom))
    };
  });
  let spanTop = Math.min(...boundaries.map((b) => b.top));
  let spanBottom = Math.max(...boundaries.map((b) => b.bottom));
  boundaries = boundaries.filter((b) => b.bottom - b.top >= (spanBottom - spanTop) * 0.4 && b.bottom - b.top >= pageMedH * 3);
  if (boundaries.length < 2) return null;
  spanTop = Math.min(...boundaries.map((b) => b.top));
  spanBottom = Math.max(...boundaries.map((b) => b.bottom));
  const minBx = Math.min(...boundaries.map((b) => b.x));
  const maxBx = Math.max(...boundaries.map((b) => b.x));
  let extentLeft = minBx;
  let extentRight = maxBx;
  for (const h of hs) {
    if (h.left <= minBx + 10 && h.right >= maxBx - 10) {
      if (h.left < extentLeft) extentLeft = h.left;
      if (h.right > extentRight) extentRight = h.right;
    }
  }
  const separators = boundaries.filter((b) => b.x > extentLeft + 10 && b.x < extentRight - 10).map((b) => b.x);
  if (separators.length < 2) return null;
  if (extentLeft < -20 || extentRight > pageObj.dims.width + 20 || spanTop < -20 || spanBottom > pageObj.dims.height + 20) return null;
  const landsOnBoundary = (x) => x <= extentLeft + 10 || x >= extentRight - 10 || boundaries.some((b) => Math.abs(b.x - x) <= 10);
  const bandYs = [];
  for (const h of hs) {
    if (h.y < spanTop - 6 || h.y > spanBottom + 6) continue;
    if (!landsOnBoundary(h.left) || !landsOnBoundary(h.right)) continue;
    const covered = separators.filter((x) => x >= h.left - 10 && x <= h.right + 10);
    if (covered.length < separators.length) {
      if (covered.length < separators.length / 2) continue;
      const uncoveredLeading = separators.filter((x) => x < h.left - 10).length;
      const uncoveredTrailing = separators.filter((x) => x > h.right + 10).length;
      if (uncoveredLeading > 0 && uncoveredTrailing > 0) continue;
    }
    if (!bandYs.some((y) => Math.abs(y - h.y) <= 6)) bandYs.push(h.y);
  }
  bandYs.sort((a, b) => a - b);
  const interiorBandYs = bandYs.filter((y) => y > spanTop + 4 && y < spanBottom - 4);
  const colBounds = [extentLeft, ...separators, extentRight];
  const regionLineIdxs = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const yC = (l.bbox.top + l.bbox.bottom) / 2;
    if (yC < spanTop || yC > spanBottom) continue;
    if (l.bbox.left < extentLeft - 15 || l.bbox.right > extentRight + 15) continue;
    regionLineIdxs.push(i);
  }
  if (regionLineIdxs.length < 3) return null;
  const rotated = regionLineIdxs.filter((i) => (lines[i].orientation || 0) !== 0).length;
  if (rotated > regionLineIdxs.length / 2) return null;
  const bandEdges = [spanTop, ...interiorBandYs, spanBottom];
  const rows = [];
  let headerBandBottom = spanTop;
  let inHeader = true;
  for (let bi = 0; bi + 1 < bandEdges.length; bi++) {
    const bandIdxs = regionLineIdxs.filter((i) => {
      const l = lines[i];
      const baseline = l.bbox.bottom - (l.bbox.bottom - l.bbox.top) * 0.2;
      return baseline >= bandEdges[bi] && baseline < bandEdges[bi + 1];
    });
    if (bandIdxs.length === 0) continue;
    let logical = null;
    if (inHeader) {
      const hRows = deriveLogicalRows(bandIdxs, lines, colBounds, "header");
      const hts = bandIdxs.map((i) => lines[i].bbox.bottom - lines[i].bbox.top).filter((h) => h > 0).sort((a, b) => a - b);
      const bandMedH = hts[Math.floor(hts.length / 2)] || 20;
      const solidCompletePair = hRows.some((r, ri) => ri > 0 && r.top - hRows[ri - 1].bottom <= bandMedH * 0.8 && r.colsHit >= 2 && hRows[ri - 1].colsHit >= 2);
      if (hRows.length >= 4 || solidCompletePair) {
        inHeader = false;
      } else {
        logical = hRows;
        headerBandBottom = bandEdges[bi + 1];
      }
    }
    if (!logical) logical = deriveLogicalRows(bandIdxs, lines, colBounds);
    for (let ri = 0; ri < logical.length; ri++) {
      const r = logical[ri];
      const bottom = ri + 1 < logical.length ? (r.bottom + logical[ri + 1].top) / 2 : bandEdges[bi + 1];
      rows.push({
        lineIndices: r.lineIndices,
        y: r.top,
        bottom,
        colsHit: r.colsHit
      });
    }
  }
  if (rows.length < 3) return null;
  if (rows.filter((r) => r.colsHit >= 2).length < 2) return null;
  const colFillCount = new Array(colBounds.length - 1).fill(0);
  for (const r of rows) {
    const seen = /* @__PURE__ */ new Set();
    for (const li of r.lineIndices) {
      for (const w of lines[li].words) {
        const cx = (w.bbox.left + w.bbox.right) / 2;
        for (let c = 0; c < colBounds.length - 1; c++) {
          if (cx >= colBounds[c] && cx < colBounds[c + 1]) {
            seen.add(c);
            break;
          }
        }
      }
    }
    for (const c of seen) colFillCount[c]++;
  }
  const sortedFill = [...colFillCount].sort((a, b) => a - b);
  if (sortedFill[Math.floor(sortedFill.length / 2)] < rows.length * 0.5) return null;
  if (colFillCount.filter((c) => c === 0).length > (colBounds.length - 1) * 0.1) return null;
  for (const sx of separators) {
    let crossingRows = 0;
    for (const r of rows) {
      let crosses = false;
      for (const li of r.lineIndices) {
        for (const w of lines[li].words) {
          if (w.bbox.left < sx - 2 && w.bbox.right > sx + 2) {
            crosses = true;
            break;
          }
        }
        if (crosses) break;
      }
      if (crosses) crossingRows++;
    }
    if (crossingRows > rows.length * 0.25) return null;
  }
  let headers = null;
  let bboxTop = spanTop;
  if (headerBandBottom > spanTop) {
    headers = {
      columnAnchors: [],
      bandTop: spanTop,
      bandBottom: headerBandBottom,
      confidence: "strong"
    };
  } else {
    const aboveIdxs = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.bbox.bottom > spanTop || l.bbox.bottom < spanTop - pageMedH * 8) continue;
      if (l.bbox.left < extentLeft - 15 || l.bbox.right > extentRight + 15) continue;
      aboveIdxs.push(i);
    }
    const aboveRows = deriveLogicalRows(aboveIdxs, lines, colBounds);
    const absorbed = [];
    let prevTop = spanTop;
    for (let ri = aboveRows.length - 1; ri >= 0; ri--) {
      const r = aboveRows[ri];
      if (prevTop - r.bottom > pageMedH * 1.6) break;
      if (r.colsHit < 2) break;
      absorbed.unshift(r);
      prevTop = r.top;
    }
    if (absorbed.length > 0) {
      for (let ri = 0; ri < absorbed.length; ri++) {
        const r = absorbed[ri];
        const bottom = ri + 1 < absorbed.length ? (r.bottom + absorbed[ri + 1].top) / 2 : spanTop;
        rows.splice(ri, 0, {
          lineIndices: r.lineIndices,
          y: r.top,
          bottom,
          colsHit: r.colsHit
        });
      }
      bboxTop = absorbed[0].top - 2;
      headers = {
        columnAnchors: [],
        bandTop: bboxTop,
        bandBottom: spanTop,
        confidence: "strong"
      };
    }
  }
  const lastRowBottom = Math.max(...rows.map((r) => r.bottom));
  let bboxBottom = Math.min(spanBottom + 2, lastRowBottom + 4);
  const belowIdxs = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.bbox.top < spanBottom || l.bbox.top > spanBottom + pageMedH * 3) continue;
    if (l.bbox.left < extentLeft - 15 || l.bbox.right > extentRight + 15) continue;
    belowIdxs.push(i);
  }
  const belowRows = deriveLogicalRows(belowIdxs, lines, colBounds);
  let prevBottom = spanBottom;
  for (const r of belowRows) {
    if (r.top - prevBottom > pageMedH * 1.5) break;
    if (r.colsHit < 2) break;
    let inLead = false;
    for (const li of r.lineIndices) {
      for (const w of lines[li].words) {
        if ((w.bbox.left + w.bbox.right) / 2 < colBounds[1]) {
          inLead = true;
          break;
        }
      }
      if (inLead) break;
    }
    if (!inLead) break;
    let straddles = false;
    for (const li of r.lineIndices) {
      for (const w of lines[li].words) {
        if (separators.some((sx) => w.bbox.left < sx - 2 && w.bbox.right > sx + 2)) {
          straddles = true;
          break;
        }
      }
      if (straddles) break;
    }
    if (straddles) break;
    rows.push({
      lineIndices: r.lineIndices,
      y: r.top,
      bottom: r.bottom + 4,
      colsHit: r.colsHit
    });
    prevBottom = r.bottom;
    if (r.bottom + 4 > bboxBottom) bboxBottom = r.bottom + 4;
  }
  const table = {
    bbox: {
      left: extentLeft,
      top: bboxTop,
      right: extentRight,
      bottom: bboxBottom
    },
    rows: rows.map((r) => ({ lineIndices: r.lineIndices, y: r.y, bottom: r.bottom })),
    colSeparators: separators,
    hLines: hs,
    vLines: vs,
    detectionMethod: "column-rule"
  };
  if (headers) table.headers = headers;
  return table;
}
function detectSegmentedHLineGrids(pageObj, paths, scale, visualHeightPts, boxOriginX = 0, boxOriginY = 0, textUnderlines = []) {
  const pathData = classifyPaths(paths, scale, visualHeightPts, pageObj, boxOriginX, boxOriginY, textUnderlines);
  if (pathData.hLines.length < 3) return [];
  const hLineClusters = clusterHLinesByXExtent(pathData.hLines);
  const processed = [];
  for (const cluster of hLineClusters) {
    if (cluster.length < 3) continue;
    for (const sub of splitClusterByYGap(cluster)) {
      if (sub.length >= 3) processed.push(sub);
    }
  }
  const tables = [];
  for (const cluster of processed) {
    const clusterLeft = cluster.reduce((m, h) => Math.min(m, h.left), Infinity);
    const clusterRight = cluster.reduce((m, h) => Math.max(m, h.right), -Infinity);
    const clusterTop = cluster.reduce((m, h) => Math.min(m, h.y), Infinity);
    const clusterBottom = cluster.reduce((m, h) => Math.max(m, h.y), -Infinity);
    const regionVLines = pathData.vLines.filter((vl) => vl.x >= clusterLeft - 5 && vl.x <= clusterRight + 5 && vl.top <= clusterBottom + 5 && vl.bottom >= clusterTop - 5);
    if (regionVLines.length >= 3) continue;
    const segTables = detectSegmentedHLineTables(cluster, pathData.headerFills, pageObj);
    for (const st of segTables) tables.push(st);
  }
  return tables;
}
function detectHeaders(table, lines) {
  if (table.rows.length === 0) return null;
  const sortedRowYs = table.rows.map((r) => r.y).sort((a, b) => a - b);
  let avgRowHeight = 50;
  if (sortedRowYs.length > 1) {
    const spacings = [];
    for (let i = 1; i < sortedRowYs.length; i++) spacings.push(sortedRowYs[i] - sortedRowYs[i - 1]);
    spacings.sort((a, b) => a - b);
    avgRowHeight = spacings[Math.floor(spacings.length / 2)];
  }
  const firstRowY = sortedRowYs[0];
  const lookbackLimit = firstRowY - avgRowHeight * 10;
  const existingLineSet = new Set(table.rows.flatMap((r) => r.lineIndices));
  const aboveLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (existingLineSet.has(i)) continue;
    const line = lines[i];
    if (line.bbox.top >= firstRowY) continue;
    if (line.bbox.top < lookbackLimit) continue;
    if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
    aboveLines.push({ idx: i, line });
  }
  if (aboveLines.length === 0) return null;
  const yGroups = [];
  for (const al of aboveLines) {
    let found = null;
    for (const g of yGroups) {
      if (Math.abs(g.y - al.line.bbox.top) < 5) {
        found = g;
        break;
      }
    }
    if (found) {
      found.items.push(al);
    } else {
      yGroups.push({ y: al.line.bbox.top, items: [al] });
    }
  }
  const isDataValueToken = (t) => /^[\d,$%.()+-]+$/.test(t) && /\d/.test(t) && !/^(?:19|20)\d\d$/.test(t);
  const extractCells = (items) => {
    const allWords = [];
    for (const { line } of items) {
      for (const w of line.words) allWords.push(w);
    }
    if (allWords.length === 0) return [];
    allWords.sort((a, b) => a.bbox.left - b.bbox.left);
    let heightSum = 0;
    for (const w of allWords) heightSum += w.bbox.bottom - w.bbox.top;
    const avgH = heightSum / allWords.length;
    const gapThreshold = avgH * 0.6;
    const cells = [];
    let current = {
      left: allWords[0].bbox.left,
      right: allWords[0].bbox.right,
      words: [allWords[0]]
    };
    for (let i = 1; i < allWords.length; i++) {
      const w = allWords[i];
      const gap = w.bbox.left - current.right;
      if (gap < gapThreshold) {
        current.right = Math.max(current.right, w.bbox.right);
        current.words.push(w);
      } else {
        cells.push(current);
        current = { left: w.bbox.left, right: w.bbox.right, words: [w] };
      }
    }
    cells.push(current);
    return cells;
  };
  yGroups.sort((a, b) => b.y - a.y);
  const annotated = [];
  for (const g of yGroups) {
    const cells = extractCells(g.items);
    let allText = true;
    let alphaCount = 0;
    let dataCount = 0;
    for (const c of cells) {
      for (const w of c.words) {
        if (isDataValueToken(w.text)) {
          allText = false;
          dataCount++;
        } else if (/[a-zA-Z]/.test(w.text)) {
          alphaCount++;
        }
      }
    }
    const mostlyText = alphaCount > dataCount;
    annotated.push({
      y: g.y,
      cells,
      allText,
      mostlyText
    });
  }
  let bestGroup = null;
  let bestCells = null;
  for (const a of annotated) {
    if (!a.allText) continue;
    if (a.cells.length < 3) continue;
    if (!bestCells || a.cells.length > bestCells.length) {
      bestGroup = a;
      bestCells = a.cells;
    }
  }
  const countAlpha = (cell) => {
    let n = 0;
    for (const w of cell.words) if (/[a-zA-Z]/.test(w.text)) n++;
    return n;
  };
  const isHeaderLikeRow = (a) => {
    if (a.cells.length >= 2) return a.allText;
    if (a.cells.length === 1) return a.mostlyText && countAlpha(a.cells[0]) <= 4;
    return false;
  };
  let bandTop = firstRowY;
  let lastAcceptedY = firstRowY;
  const gapLimit = avgRowHeight * 2;
  for (const a of annotated) {
    if (!isHeaderLikeRow(a)) continue;
    if (lastAcceptedY - a.y > gapLimit) break;
    bandTop = a.y;
    lastAcceptedY = a.y;
  }
  let fromStackedRule = false;
  if (!bestGroup || !bestCells) {
    const twoCellRows = annotated.filter((a) => a.allText && a.cells.length === 2);
    if (twoCellRows.length >= 2) {
      const bboxW = table.bbox.right - table.bbox.left;
      const xTol = bboxW * 0.15;
      const ref = twoCellRows[0];
      const refLC = (ref.cells[0].left + ref.cells[0].right) / 2;
      const refRC = (ref.cells[1].left + ref.cells[1].right) / 2;
      let matchCount = 0;
      let anchorSumL = 0;
      let anchorSumR = 0;
      for (const r of twoCellRows) {
        const lc = (r.cells[0].left + r.cells[0].right) / 2;
        const rc = (r.cells[1].left + r.cells[1].right) / 2;
        if (Math.abs(lc - refLC) < xTol && Math.abs(rc - refRC) < xTol) {
          anchorSumL += lc;
          anchorSumR += rc;
          matchCount++;
        }
      }
      if (matchCount >= 2) {
        const avgL = anchorSumL / matchCount;
        const avgR = anchorSumR / matchCount;
        fromStackedRule = true;
        bestGroup = twoCellRows[0];
        bestCells = [
          {
            left: avgL - 50,
            right: avgL + 50,
            words: [{
              text: "",
              bbox: {
                left: avgL - 50,
                right: avgL + 50,
                top: 0,
                bottom: 0
              }
            }]
          },
          {
            left: avgR - 50,
            right: avgR + 50,
            words: [{
              text: "",
              bbox: {
                left: avgR - 50,
                right: avgR + 50,
                top: 0,
                bottom: 0
              }
            }]
          }
        ];
      }
    }
  }
  if (!bestGroup || !bestCells) {
    if (bandTop >= firstRowY) return null;
    return {
      columnAnchors: [],
      bandTop,
      bandBottom: firstRowY,
      confidence: "weak"
    };
  }
  const alignedCells = [];
  for (const c of bestCells) {
    let aligned = false;
    for (const r of table.rows) {
      if (aligned) break;
      for (const i of r.lineIndices) {
        if (aligned) break;
        for (const w of lines[i].words) {
          const wc = (w.bbox.left + w.bbox.right) / 2;
          if (wc >= c.left - 5 && wc <= c.right + 5) {
            aligned = true;
            break;
          }
        }
      }
    }
    if (aligned) alignedCells.push(c);
  }
  const alignedAnchors = alignedCells.map((c) => (c.left + c.right) / 2);
  const minAnchors = fromStackedRule ? 2 : 4;
  const confidence = alignedAnchors.length >= minAnchors && alignedCells.length >= bestCells.length * 0.5 ? "strong" : "weak";
  return {
    columnAnchors: alignedAnchors,
    bandTop,
    bandBottom: firstRowY,
    confidence
  };
}
function extractStructure(table, lines) {
  if (table.colSeparators.length > 0) return;
  if (table.vLines.length >= 2) {
    const vLineXPositions = clusterValues(table.vLines.map((vl) => vl.x), 10);
    const interior = vLineXPositions.filter((x) => x > table.bbox.left + 5 && x < table.bbox.right - 5);
    if (interior.length > 0) {
      table.colSeparators = interior.sort((a, b) => a - b);
      return;
    }
  }
  let headerSeps = null;
  if (table.headers && table.headers.confidence === "strong" && table.headers.columnAnchors.length >= 2) {
    const anchors = [...table.headers.columnAnchors].sort((a, b) => a - b);
    const seps = [];
    for (let i = 0; i < anchors.length - 1; i++) {
      seps.push((anchors[i] + anchors[i + 1]) / 2);
    }
    let hasLabelCol = false;
    const leftGuard = anchors[0] - 10;
    for (const r of table.rows) {
      for (const i of r.lineIndices) {
        if (lines[i].bbox.right < leftGuard) {
          hasLabelCol = true;
          break;
        }
      }
      if (hasLabelCol) break;
    }
    if (hasLabelCol) {
      const halfSpacing = (anchors[1] - anchors[0]) / 2;
      const labelSep = anchors[0] - halfSpacing;
      if (labelSep > table.bbox.left + 5 && anchors[0] - table.bbox.left > halfSpacing * 2) {
        seps.unshift(labelSep);
      }
    }
    seps.sort((a, b) => a - b);
    headerSeps = seps;
  }
  const isCurrencySymbol = (text) => /^[$€£¥¢]+$/.test(text);
  const allWordBboxes = [];
  const candidateWidth = table.bbox.right - table.bbox.left;
  const isNarrativeLine = (line) => {
    let totalCount = 0;
    let numericCount = 0;
    for (const word of line.words) {
      if (/^[*.]+$/.test(word.text)) continue;
      totalCount++;
      if (/^[\d,$%.()+-]+$/.test(word.text) && /\d/.test(word.text)) numericCount++;
      else if (/^[$€£¥¢]+$/.test(word.text)) numericCount++;
    }
    if (totalCount <= 6) return false;
    return numericCount / totalCount < 0.5;
  };
  const isYearLike = (text) => /^(?:19|20)\d\d$/.test(text);
  const isFootnoteMarker = (text) => /^\(\d\)$/.test(text);
  const isDataValueWord = (text) => /^[\d,$%.()+-]+$/.test(text) && /\d/.test(text) && !isYearLike(text) && !isFootnoteMarker(text);
  let firstDataRowIdx = -1;
  for (let ri = 0; ri < table.rows.length; ri++) {
    const r = table.rows[ri];
    let dataValueCount = 0;
    let hasCurrency = false;
    for (const i of r.lineIndices) {
      for (const word of lines[i].words) {
        if (isDataValueWord(word.text)) dataValueCount++;
        if (isCurrencySymbol(word.text)) hasCurrency = true;
      }
    }
    if (dataValueCount >= 2 || hasCurrency) {
      firstDataRowIdx = ri;
      break;
    }
  }
  for (let ri = 0; ri < table.rows.length; ri++) {
    const r = table.rows[ri];
    if (firstDataRowIdx >= 0 && ri < firstDataRowIdx) continue;
    const lineIsPureText = (line) => {
      for (const word of line.words) {
        if (/^[\d,$%.()+-]+$/.test(word.text) && /\d/.test(word.text)) return false;
        if (/^[$€£¥¢]+$/.test(word.text)) return false;
      }
      return true;
    };
    let hasNarrativeLine = false;
    for (const i of r.lineIndices) {
      const lw = lines[i].bbox.right - lines[i].bbox.left;
      if (candidateWidth > 0 && lw > candidateWidth * 0.5 && isNarrativeLine(lines[i])) {
        if (r.lineIndices.length > 1 && lineIsPureText(lines[i])) {
          let otherHasNumeric = false;
          for (const j of r.lineIndices) {
            if (j === i) continue;
            for (const word of lines[j].words) {
              if (/^[\d,$%.()+-]+$/.test(word.text) && /\d/.test(word.text)) {
                otherHasNumeric = true;
                break;
              }
              if (/^[$€£¥¢]+$/.test(word.text)) {
                otherHasNumeric = true;
                break;
              }
            }
            if (otherHasNumeric) break;
          }
          if (otherHasNumeric) continue;
        }
        hasNarrativeLine = true;
        break;
      }
    }
    if (hasNarrativeLine) continue;
    const rowWords = [];
    let hSum = 0;
    let hCount = 0;
    for (const i of r.lineIndices) {
      const line = lines[i];
      const lineH = line.bbox.bottom - line.bbox.top;
      if (lineH > 0) {
        hSum += lineH;
        hCount++;
      }
      for (const word of line.words) rowWords.push(word);
    }
    rowWords.sort((a, b) => a.bbox.left - b.bbox.left);
    const avgLineHeight = hCount > 0 ? hSum / hCount : 20;
    const gapThreshold = avgLineHeight * 0.4;
    const expand = (box, b) => ({
      left: Math.min(box.left, b.left),
      top: Math.min(box.top, b.top),
      right: Math.max(box.right, b.right),
      bottom: Math.max(box.bottom, b.bottom)
    });
    let w = 0;
    while (w < rowWords.length) {
      if (isCurrencySymbol(rowWords[w].text)) {
        let current = { ...rowWords[w].bbox };
        let j = w + 1;
        while (j < rowWords.length && isCurrencySymbol(rowWords[j].text)) {
          current = expand(current, rowWords[j].bbox);
          j++;
        }
        if (j < rowWords.length) {
          current = expand(current, rowWords[j].bbox);
          j++;
        }
        allWordBboxes.push(current);
        w = j;
      } else {
        let current = { ...rowWords[w].bbox };
        let j = w + 1;
        const hasDigit = (s) => /\d/.test(s);
        const isLeaderFiller = (s) => s.length >= 3 && /^[*.]+$/.test(s);
        const currentHasDigit = hasDigit(rowWords[w].text);
        if (j < rowWords.length && /^\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}$/.test(rowWords[w].text) && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(rowWords[j].text) && rowWords[j].bbox.left - current.right <= gapThreshold) {
          current = expand(current, rowWords[j].bbox);
          j++;
        }
        while (j < rowWords.length && !isCurrencySymbol(rowWords[j].text)) {
          if (isLeaderFiller(rowWords[j].text)) {
            current = expand(current, rowWords[j].bbox);
            j++;
            continue;
          }
          if (currentHasDigit || hasDigit(rowWords[j].text)) break;
          const gap = rowWords[j].bbox.left - current.right;
          if (gap > gapThreshold) break;
          current = expand(current, rowWords[j].bbox);
          j++;
        }
        allWordBboxes.push(current);
        w = j;
      }
    }
  }
  if (allWordBboxes.length >= 2) {
    const wordColumnBounds = calcColumnBounds(allWordBboxes);
    const headerYRows = [];
    if (wordColumnBounds.length > 2) {
      const yTol = 10;
      const yRows = [];
      for (const bbox of allWordBboxes) {
        let matched = false;
        for (const row of yRows) {
          if (Math.abs(bbox.top - row.y) < yTol) {
            row.bboxes.push(bbox);
            matched = true;
            break;
          }
        }
        if (!matched) yRows.push({ y: bbox.top, bboxes: [bbox] });
      }
      const dataRowCount = yRows.length;
      const addHeaderWord = (w) => {
        let matched = false;
        for (const row of headerYRows) {
          if (Math.abs(w.bbox.top - row.y) < yTol) {
            row.bboxes.push(w.bbox);
            matched = true;
            break;
          }
        }
        if (!matched) headerYRows.push({ y: w.bbox.top, bboxes: [w.bbox] });
      };
      if (firstDataRowIdx > 0) {
        for (let ri = 0; ri < firstDataRowIdx; ri++) {
          if (table.rows[ri].lineIndices.length < 2) continue;
          for (const i of table.rows[ri].lineIndices) {
            for (const word of lines[i].words) addHeaderWord(word);
          }
        }
      }
      if (table.headers && typeof table.headers.bandTop === "number" && typeof table.headers.bandBottom === "number") {
        const hTop = table.headers.bandTop;
        const hBottom = table.headers.bandBottom;
        for (const line of lines) {
          if (line.bbox.top < hTop || line.bbox.top >= hBottom) continue;
          if (line.bbox.top >= table.bbox.top) continue;
          if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
          for (const word of line.words) addHeaderWord(word);
        }
      }
      const coverageFloor = Math.max(2, dataRowCount * 0.25);
      const colContains = (col, b) => {
        const center = (b.left + b.right) / 2;
        return center >= col.left && center <= col.right;
      };
      for (let c = wordColumnBounds.length - 1; c >= 0; c--) {
        if (wordColumnBounds.length <= 2) break;
        let dataRowsHere = 0;
        for (const row of yRows) {
          if (row.bboxes.some((b) => colContains(wordColumnBounds[c], b))) dataRowsHere++;
        }
        let headerRowsHere = 0;
        for (const row of headerYRows) {
          if (row.bboxes.some((b) => colContains(wordColumnBounds[c], b))) headerRowsHere++;
        }
        const totalRowsHere = dataRowsHere + headerRowsHere;
        if (dataRowsHere === 0 || totalRowsHere < coverageFloor) {
          if (c === 0) {
            wordColumnBounds[1].left = wordColumnBounds[0].left;
          } else {
            wordColumnBounds[c - 1].right = wordColumnBounds[c].right;
          }
          wordColumnBounds.splice(c, 1);
        }
      }
    }
    const seps = [];
    for (let i = 0; i < wordColumnBounds.length - 1; i++) {
      let sep = (wordColumnBounds[i].right + wordColumnBounds[i + 1].left) / 2;
      if (headerYRows.some((row) => row.bboxes.some((b) => b.left < sep && b.right > sep))) {
        let leftEdge = wordColumnBounds[i].left;
        let rightEdge = wordColumnBounds[i + 1].right;
        for (const b of allWordBboxes) {
          const c = (b.left + b.right) / 2;
          if (c >= wordColumnBounds[i].left && c < sep) leftEdge = Math.max(leftEdge, b.right);
          else if (c >= sep && c <= wordColumnBounds[i + 1].right) rightEdge = Math.min(rightEdge, b.left);
        }
        for (const row of headerYRows) {
          for (const b of row.bboxes) {
            if (b.right <= leftEdge || b.left >= rightEdge) continue;
            if ((b.left + b.right) / 2 <= sep) leftEdge = Math.max(leftEdge, b.right);
            else rightEdge = Math.min(rightEdge, b.left);
          }
        }
        if (leftEdge < rightEdge) sep = (leftEdge + rightEdge) / 2;
      }
      seps.push(sep);
    }
    table.colSeparators = seps;
  }
  if (headerSeps) {
    const sparseUnderCount = headerSeps.length > table.colSeparators.length && table.colSeparators.length < 3;
    const overSplit = headerSeps.length < table.colSeparators.length && headerSeps.length >= 2 && headerSeps.length <= table.colSeparators.length * 0.5;
    const rowBandOverSplit = table.detectionMethod === "row-band" && headerSeps.length >= 2 && headerSeps.length < table.colSeparators.length;
    if (sparseUnderCount || overSplit || rowBandOverSplit) {
      table.colSeparators = headerSeps;
    }
  }
  if (table.rowBandRegion && table.rowBandRegion.colXs.length > 0 && table.colSeparators.length > 0) {
    const fillSeps = table.rowBandRegion.colXs.slice().sort((a, b) => a - b);
    const textSeps = table.colSeparators;
    const textColWidths = [];
    let prev = table.bbox.left;
    for (const s of textSeps) {
      textColWidths.push(s - prev);
      prev = s;
    }
    textColWidths.push(table.bbox.right - prev);
    textColWidths.sort((a, b) => a - b);
    const medianWidth = textColWidths[Math.floor(textColWidths.length / 2)];
    const minWidth = textColWidths[0];
    const textHasNarrowOutlier = medianWidth > 0 && minWidth < medianWidth * 0.3;
    if (textHasNarrowOutlier && fillSeps.length + 1 >= 3) {
      table.colSeparators = fillSeps;
    }
  }
}
function refineTableTop(table, lines, topFloor = 0) {
  const rows = table.rows;
  if (rows.length === 0) return;
  if (table.headers && table.headers.confidence === "strong") {
    let strongTop = Math.max(topFloor, table.headers.bandTop - 5);
    const firstDataY = [...rows].sort((a, b) => a.y - b.y)[0].y;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (line.bbox.top < strongTop || line.bbox.top >= firstDataY) continue;
      if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
      const lastWord = line.words.length > 0 ? line.words[line.words.length - 1].text : "";
      if (lastWord === "follows:" && line.bbox.bottom > strongTop) {
        strongTop = line.bbox.bottom + 1;
      }
    }
    table.bbox.top = strongTop;
    return;
  }
  const sortedRows = [...rows].sort((a, b) => a.y - b.y);
  const candidateWidthForSkip = table.bbox.right - table.bbox.left;
  let firstIdx = 0;
  while (firstIdx < sortedRows.length - 1) {
    const r = sortedRows[firstIdx];
    if (r.lineIndices.length !== 1) break;
    const line = lines[r.lineIndices[0]];
    const lastText = line.words.length > 0 ? line.words[line.words.length - 1].text : "";
    const lastIsNumeric = /^[\d,$%.()+-]+$/.test(lastText) && /\d/.test(lastText) && /[\d)%]$/.test(lastText);
    if (lastIsNumeric) break;
    const wide = line.bbox.right - line.bbox.left > candidateWidthForSkip * 0.5;
    const sentenceEnd = /[.!?:]$/.test(lastText) && line.words.length >= 3;
    if (!wide && !sentenceEnd) break;
    firstIdx++;
  }
  const firstRowY = sortedRows[firstIdx].y;
  sortedRows[sortedRows.length - 1].y;
  let avgRowHeight = 50;
  if (sortedRows.length > 1) {
    const spacings = [];
    for (let i = 1; i < sortedRows.length; i++) {
      spacings.push(sortedRows[i].y - sortedRows[i - 1].y);
    }
    spacings.sort((a, b) => a - b);
    avgRowHeight = spacings[Math.floor(spacings.length / 2)];
  }
  const allLineIndicesSet = new Set(rows.flatMap((r) => r.lineIndices));
  const candidateWidth = table.bbox.right - table.bbox.left;
  let scanAnchor = firstRowY;
  if (table.hLines.length > 0) {
    const limit = firstRowY - avgRowHeight * 1.5;
    for (const hl of table.hLines) {
      if (hl.y < firstRowY && hl.y > limit) {
        if (scanAnchor === firstRowY || hl.y > scanAnchor) {
          scanAnchor = hl.y;
        }
      }
    }
  }
  let dataLeftEdge = Infinity;
  for (const r of rows) {
    for (const idx of r.lineIndices) {
      if (lines[idx].bbox.left < dataLeftEdge) dataLeftEdge = lines[idx].bbox.left;
    }
  }
  let headerTop = scanAnchor;
  const aboveLines = [];
  for (let li = 0; li < lines.length; li++) {
    if (allLineIndicesSet.has(li)) continue;
    const line = lines[li];
    if (line.bbox.top >= firstRowY) continue;
    if (line.bbox.bottom <= topFloor) continue;
    if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
    aboveLines.push({ idx: li, line });
  }
  aboveLines.sort((a, b) => b.line.bbox.top - a.line.bbox.top);
  let singleSegRange = null;
  for (const { idx, line } of aboveLines) {
    const lineWidth = line.bbox.right - line.bbox.left;
    let isMultiSegment = false;
    for (let lj = 0; lj < lines.length; lj++) {
      if (lj === idx) continue;
      if (Math.abs(lines[lj].bbox.top - line.bbox.top) < 5 && lines[lj].bbox.right >= table.bbox.left && lines[lj].bbox.left <= table.bbox.right) {
        isMultiSegment = true;
        break;
      }
    }
    const lineText = line.words.length > 0 ? line.words[line.words.length - 1].text : "";
    if (lineText === "follows:") break;
    const gapToHeader = headerTop - line.bbox.bottom;
    if (isMultiSegment) {
      if (gapToHeader > avgRowHeight * 2.5) break;
      headerTop = Math.min(headerTop, line.bbox.top);
      singleSegRange = null;
      continue;
    }
    if (gapToHeader > avgRowHeight * 0.45) continue;
    if (lineWidth > candidateWidth * 0.6) break;
    if (line.bbox.left < dataLeftEdge - 20) break;
    if (singleSegRange && (line.bbox.right < singleSegRange.left || line.bbox.left > singleSegRange.right)) {
      break;
    }
    headerTop = Math.min(headerTop, line.bbox.top);
    if (lineWidth <= candidateWidth * 0.5) {
      if (!singleSegRange) {
        singleSegRange = { left: line.bbox.left, right: line.bbox.right };
      } else {
        singleSegRange.left = Math.min(singleSegRange.left, line.bbox.left);
        singleSegRange.right = Math.max(singleSegRange.right, line.bbox.right);
      }
    }
  }
  let finalTop = Math.max(topFloor, headerTop - 5);
  let pushed = true;
  while (pushed) {
    pushed = false;
    for (let li = 0; li < lines.length; li++) {
      if (allLineIndicesSet.has(li)) continue;
      const line = lines[li];
      if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
      if (line.bbox.bottom <= finalTop || line.bbox.top >= firstRowY) continue;
      if (line.bbox.top < finalTop) {
        finalTop = line.bbox.bottom + 1;
        pushed = true;
        continue;
      }
      const lastWord = line.words.length > 0 ? line.words[line.words.length - 1].text : "";
      if (lastWord === "follows:") {
        finalTop = line.bbox.bottom + 1;
        pushed = true;
        continue;
      }
      const lineWidth = line.bbox.right - line.bbox.left;
      let isMulti = false;
      for (let lj = 0; lj < lines.length; lj++) {
        if (lj === li) continue;
        if (Math.abs(lines[lj].bbox.top - line.bbox.top) < 5 && lines[lj].bbox.right >= table.bbox.left && lines[lj].bbox.left <= table.bbox.right) {
          isMulti = true;
          break;
        }
      }
      if (!isMulti && lineWidth > candidateWidth * 0.6) {
        finalTop = line.bbox.bottom + 1;
        pushed = true;
      }
    }
  }
  for (const r of sortedRows) {
    if (r.y > finalTop + avgRowHeight * 1.5) break;
    let allFollows = true;
    for (const idx of r.lineIndices) {
      const words = lines[idx].words;
      if (words.length > 0 && words[words.length - 1].text !== "follows:") {
        allFollows = false;
        break;
      }
    }
    if (allFollows && r.lineIndices.length > 0) {
      let rowBot = -Infinity;
      for (const idx of r.lineIndices) rowBot = Math.max(rowBot, lines[idx].bbox.bottom);
      if (rowBot > finalTop) finalTop = rowBot + 1;
    } else {
      break;
    }
  }
  table.bbox.top = finalTop;
}
function detectHeaderRuleTables(hLines, pageObj) {
  const lines = pageObj.lines;
  if (lines.length === 0) return [];
  const yGroups = [];
  for (const hl of hLines) {
    let group = null;
    for (const g of yGroups) {
      if (Math.abs(g.y - hl.y) <= 3) {
        group = g;
        break;
      }
    }
    if (group) {
      group.lines.push(hl);
      group.y = group.lines.reduce((s, l) => s + l.y, 0) / group.lines.length;
    } else {
      yGroups.push({ y: hl.y, lines: [hl] });
    }
  }
  const rulingRows = [];
  const pageWidth = pageObj.dims.width;
  for (const g of yGroups) {
    if (g.lines.length < 3) continue;
    const sorted = [...g.lines].sort((a, b) => a.left - b.left);
    let disjoint = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].left < sorted[i - 1].right - 1) {
        disjoint = false;
        break;
      }
    }
    if (!disjoint) continue;
    const xSpan = sorted[sorted.length - 1].right - sorted[0].left;
    if (xSpan < pageWidth * 0.3) continue;
    rulingRows.push({
      y: g.y,
      cols: sorted.map((l) => ({ left: l.left, right: l.right })),
      hLines: sorted
    });
  }
  if (rulingRows.length === 0) return [];
  rulingRows.sort((a, b) => a.y - b.y);
  const isSubsetGeometry = (subRow, primaryRow, tol) => {
    for (const c of subRow.cols) {
      let matched = false;
      for (const pc of primaryRow.cols) {
        if (Math.abs(c.left - pc.left) < tol && Math.abs(c.right - pc.right) < tol) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }
    return true;
  };
  const primaryIndices = [];
  for (let ri = 0; ri < rulingRows.length; ri++) {
    let isSubtotal = false;
    for (const pi of primaryIndices) {
      if (isSubsetGeometry(rulingRows[ri], rulingRows[pi], 5)) {
        isSubtotal = true;
        break;
      }
    }
    if (!isSubtotal) primaryIndices.push(ri);
  }
  const primaries = primaryIndices.map((ri) => {
    const rule = rulingRows[ri];
    const ruleLeft = rule.cols[0].left;
    const ruleRight = rule.cols[rule.cols.length - 1].right;
    return {
      ri,
      rule,
      ruleLeft,
      ruleRight,
      xSlack: Math.max(20, (ruleRight - ruleLeft) * 0.02),
      headerTopY: rule.y,
      headerLineIndices: (
        /** @type {number[]} */
        []
      )
    };
  });
  for (let pii = 0; pii < primaries.length; pii++) {
    const p = primaries[pii];
    const upperBound = pii > 0 ? primaries[pii - 1].rule.y + 5 : 0;
    const linesAbove = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.bbox.bottom > p.rule.y) continue;
      if (l.bbox.bottom < upperBound) continue;
      if (l.bbox.left < p.ruleLeft - p.xSlack) continue;
      if (l.bbox.right > p.ruleRight + p.xSlack) continue;
      linesAbove.push({ idx: i, line: l });
    }
    linesAbove.sort((a, b) => b.line.bbox.top - a.line.bbox.top);
    const tops = linesAbove.slice(0, 8).map((x) => x.line.bbox.top).sort((a, b) => b - a);
    const headerSpacings = [];
    for (let i = 1; i < tops.length; i++) headerSpacings.push(tops[i - 1] - tops[i]);
    headerSpacings.sort((a, b) => a - b);
    const medianHeaderSpacing = headerSpacings[Math.floor(headerSpacings.length / 2)] || 30;
    const gapLimit = Math.max(medianHeaderSpacing * 1.5, 45);
    let prevTopU = p.rule.y;
    for (const { idx, line } of linesAbove) {
      const gap = prevTopU - line.bbox.top;
      if (gap > gapLimit) break;
      p.headerLineIndices.push(idx);
      p.headerTopY = line.bbox.top;
      prevTopU = line.bbox.top;
    }
  }
  const results = [];
  for (let pii = 0; pii < primaries.length; pii++) {
    const p = primaries[pii];
    const lowerBound = pii + 1 < primaries.length ? primaries[pii + 1].headerTopY - 1 : pageObj.dims.height;
    const linesBelow = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.bbox.top < p.rule.y) continue;
      if (l.bbox.top > lowerBound) continue;
      if (l.bbox.left < p.ruleLeft - p.xSlack) continue;
      if (l.bbox.right > p.ruleRight + p.xSlack) continue;
      linesBelow.push({ idx: i, line: l });
    }
    linesBelow.sort((a, b) => a.line.bbox.top - b.line.bbox.top);
    if (linesBelow.length < 2) continue;
    const earlySpacings = [];
    const earlyN = Math.min(linesBelow.length - 1, 5);
    for (let i = 1; i <= earlyN; i++) {
      earlySpacings.push(linesBelow[i].line.bbox.top - linesBelow[i - 1].line.bbox.top);
    }
    earlySpacings.sort((a, b) => a - b);
    const medianDataSpacing = earlySpacings[Math.floor(earlySpacings.length / 2)] || 30;
    const dataGapLimit = Math.max(medianDataSpacing * 2.5, 80);
    const dataIndices = [];
    let prevDataTop = p.rule.y;
    for (const { idx, line } of linesBelow) {
      const gap = line.bbox.top - prevDataTop;
      if (dataIndices.length > 0 && gap > dataGapLimit) break;
      dataIndices.push(idx);
      prevDataTop = line.bbox.top;
    }
    if (dataIndices.length < 2) continue;
    for (const hIdx of p.headerLineIndices) dataIndices.push(hIdx);
    const colSeparators = [];
    for (let i = 1; i < p.rule.cols.length; i++) {
      colSeparators.push((p.rule.cols[i - 1].right + p.rule.cols[i].left) / 2);
    }
    let bboxBottom = p.rule.y;
    for (const idx of dataIndices) {
      if (lines[idx].bbox.bottom > bboxBottom) bboxBottom = lines[idx].bbox.bottom;
    }
    const regionLines = dataIndices.map((i) => lines[i]);
    const rowGroups = groupLinesIntoRows(regionLines);
    const mappedRows = rowGroups.map((rg) => ({
      lineIndices: rg.lineIndices.map((i) => dataIndices[i]),
      y: rg.y
    }));
    if (mappedRows.length < 3) continue;
    const colBounds = [p.ruleLeft, ...colSeparators, p.ruleRight];
    const numColsCount = colBounds.length - 1;
    const colNumericRowCount = new Array(numColsCount).fill(0);
    let numericMultiColRows = 0;
    for (const row of mappedRows) {
      const numColsHit = /* @__PURE__ */ new Set();
      for (const idx of row.lineIndices) {
        for (const word of lines[idx].words) {
          if (!/\d/.test(word.text)) continue;
          if (!/^[\d,$%.()+-]+$/.test(word.text)) continue;
          const cx = (word.bbox.left + word.bbox.right) / 2;
          for (let ci = 0; ci < colBounds.length - 1; ci++) {
            if (cx >= colBounds[ci] && cx < colBounds[ci + 1]) {
              numColsHit.add(ci);
              break;
            }
          }
        }
      }
      if (numColsHit.size >= 2) numericMultiColRows++;
      for (const ci of numColsHit) colNumericRowCount[ci]++;
    }
    if (numericMultiColRows < 5) continue;
    let hasConsistentNumCol = false;
    for (let ci = 1; ci < numColsCount; ci++) {
      if (colNumericRowCount[ci] >= mappedRows.length * 0.5) {
        hasConsistentNumCol = true;
        break;
      }
    }
    if (!hasConsistentNumCol) continue;
    results.push({
      bbox: {
        left: p.ruleLeft,
        right: p.ruleRight,
        top: p.headerTopY,
        bottom: bboxBottom
      },
      rows: mappedRows,
      colSeparators,
      hLines: p.rule.hLines,
      vLines: [],
      detectionMethod: "header-rule"
    });
  }
  return results;
}
function findDisjointRuleClusters(hLines, pageObj) {
  const yGroups = [];
  for (const hl of hLines) {
    let group = null;
    for (const g of yGroups) {
      if (Math.abs(g.y - hl.y) <= 3) {
        group = g;
        break;
      }
    }
    if (group) {
      group.lines.push(hl);
      group.y = group.lines.reduce((s, l) => s + l.y, 0) / group.lines.length;
    } else {
      yGroups.push({ y: hl.y, lines: [hl] });
    }
  }
  const pageWidth = pageObj.dims.width;
  const clusters = [];
  for (const g of yGroups) {
    if (g.lines.length < 2) continue;
    const sorted = [...g.lines].sort((a, b) => a.left - b.left);
    let disjoint = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].left < sorted[i - 1].right - 1) {
        disjoint = false;
        break;
      }
    }
    if (!disjoint) continue;
    const xSpan = sorted[sorted.length - 1].right - sorted[0].left;
    if (xSpan < pageWidth * 0.2) continue;
    clusters.push({
      y: g.y,
      cols: sorted.map((l) => ({ left: l.left, right: l.right }))
    });
  }
  return clusters;
}
function detectSegmentedHLineTables(cluster, headerFills, pageObj) {
  const rowBreaks = [];
  for (const hl of cluster) {
    if (!hl.segments || hl.segments.length < 2) continue;
    const sorted = [...hl.segments].sort((a, b) => a.left - b.left);
    const breaks = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      breaks.push(Math.round(sorted[i].right));
    }
    rowBreaks.push({
      y: hl.y,
      breaks,
      left: sorted[0].left,
      right: sorted[sorted.length - 1].right,
      hl
    });
  }
  if (rowBreaks.length < 3) return [];
  const breakGroups = [];
  for (const rb of rowBreaks) {
    let matched = false;
    for (const group of breakGroups) {
      const ref = group[0].breaks;
      if (ref.length !== rb.breaks.length) continue;
      let consistent = true;
      for (let j = 0; j < ref.length; j++) {
        if (Math.abs(ref[j] - rb.breaks[j]) > 5) {
          consistent = false;
          break;
        }
      }
      if (consistent) {
        group.push(rb);
        matched = true;
        break;
      }
    }
    if (!matched) breakGroups.push([rb]);
  }
  const results = [];
  for (const group of breakGroups) {
    if (group.length < 3) continue;
    if (group[0].breaks.length < 2) continue;
    const colSeparators = group[0].breaks.map((_, j) => {
      let sum = 0;
      for (const rb of group) sum += rb.breaks[j];
      return sum / group.length;
    });
    const groupLeft = Math.min(...group.map((rb) => rb.left));
    const groupRight = Math.max(...group.map((rb) => rb.right));
    const groupTop = Math.min(...group.map((rb) => rb.y));
    const groupBottom = Math.max(...group.map((rb) => rb.y));
    const gridWidth = groupRight - groupLeft;
    if (gridWidth < pageObj.dims.width * 0.3) continue;
    const groupHLines = group.map((rb) => rb.hl);
    let headerFill = null;
    for (const fill of headerFills) {
      if (Math.abs(fill.left - groupLeft) > 15) continue;
      if (Math.abs(fill.right - groupRight) > 15) continue;
      if (fill.bottom > groupTop + 5) continue;
      if (fill.bottom < groupTop - 200) continue;
      headerFill = {
        left: fill.left,
        top: fill.top,
        right: fill.right,
        bottom: fill.bottom
      };
      break;
    }
    const typicalRowH = (groupBottom - groupTop) / Math.max(1, group.length - 1);
    const bboxTop = headerFill ? headerFill.top - 5 : groupTop - typicalRowH * 1.5;
    const bbox = {
      left: groupLeft,
      top: Math.max(0, bboxTop),
      right: groupRight,
      bottom: groupBottom + 5
    };
    const regionLineIndices = [];
    for (let i = 0; i < pageObj.lines.length; i++) {
      const line = pageObj.lines[i];
      if (line.bbox.top >= bbox.top - 5 && line.bbox.bottom <= bbox.bottom + 5 && line.bbox.left >= bbox.left - 10 && line.bbox.right <= bbox.right + 10) {
        regionLineIndices.push(i);
      }
    }
    if (regionLineIndices.length < 2) continue;
    const regionLines = regionLineIndices.map((i) => pageObj.lines[i]);
    const rowGroups = groupLinesIntoRows(regionLines);
    const mappedRows = rowGroups.map((rg) => ({
      lineIndices: rg.lineIndices.map((i) => regionLineIndices[i]),
      y: rg.y
    }));
    if (mappedRows.length < 2) continue;
    const multiSegGridRows = mappedRows.filter((r) => r.lineIndices.length >= 2).length;
    if (multiSegGridRows < 2) continue;
    results.push({
      bbox,
      rows: mappedRows,
      colSeparators: colSeparators.sort((a, b) => a - b),
      hLines: groupHLines,
      vLines: [],
      detectionMethod: "segmented-hline",
      headerFill
    });
  }
  return results;
}
const TABLE_TITLE_RE = /^Table\s+\d+/i;
function detectTableTitle(table, lines) {
  const maxAboveDist = 50;
  let bestAbove = null;
  for (const line of lines) {
    if (line.bbox.bottom > table.bbox.top) continue;
    if (line.bbox.bottom < table.bbox.top - maxAboveDist) continue;
    if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
    const text = line.words.map((w) => w.text).join(" ");
    if (!TABLE_TITLE_RE.test(text)) continue;
    const dist = table.bbox.top - line.bbox.bottom;
    if (!bestAbove || dist < bestAbove.dist) {
      bestAbove = {
        text,
        bbox: {
          left: line.bbox.left,
          top: line.bbox.top,
          right: line.bbox.right,
          bottom: line.bbox.bottom
        },
        dist
      };
    }
  }
  if (bestAbove) return { text: bestAbove.text, bbox: bestAbove.bbox };
  let firstInside = null;
  for (const line of lines) {
    if (line.bbox.top < table.bbox.top || line.bbox.top > table.bbox.bottom) continue;
    if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
    if (!firstInside || line.bbox.top < firstInside.bbox.top) firstInside = line;
  }
  if (firstInside) {
    const text = firstInside.words.map((w) => w.text).join(" ");
    if (TABLE_TITLE_RE.test(text)) {
      return {
        text,
        bbox: {
          left: firstInside.bbox.left,
          top: firstInside.bbox.top,
          right: firstInside.bbox.right,
          bottom: firstInside.bbox.bottom
        }
      };
    }
  }
  return null;
}
function extendTableToAdjacentContent(table, lines, siblings) {
  if (table.rows.length < 2) return;
  const sortedRows = [...table.rows].sort((a, b) => a.y - b.y);
  const spacings = [];
  for (let i = 1; i < sortedRows.length; i++) {
    spacings.push(sortedRows[i].y - sortedRows[i - 1].y);
  }
  spacings.sort((a, b) => a - b);
  const medianSpacing = spacings.length > 0 ? spacings[Math.floor(spacings.length / 2)] : 50;
  const yMatch = Math.max(10, medianSpacing * 0.4);
  const existingLineSet = new Set(table.rows.flatMap((r) => r.lineIndices));
  const bboxWidth = table.bbox.right - table.bbox.left;
  const leftAdjByRow = /* @__PURE__ */ new Map();
  const overlapByRow = /* @__PURE__ */ new Map();
  for (let i = 0; i < lines.length; i++) {
    if (existingLineSet.has(i)) continue;
    const line = lines[i];
    if (line.bbox.left >= table.bbox.left - 10) continue;
    let matchedRowY = null;
    for (const r of table.rows) {
      if (Math.abs(line.bbox.top - r.y) <= yMatch) {
        matchedRowY = r.y;
        break;
      }
    }
    if (matchedRowY === null) continue;
    const lineWidth = line.bbox.right - line.bbox.left;
    const clearlyLeft = line.bbox.right < table.bbox.left - 10;
    const reasonableWidth = lineWidth < bboxWidth * 0.5;
    if (clearlyLeft && reasonableWidth) {
      if (!leftAdjByRow.has(matchedRowY)) leftAdjByRow.set(matchedRowY, []);
      leftAdjByRow.get(matchedRowY).push({ idx: i, line });
    } else if (!clearlyLeft) {
      if (!overlapByRow.has(matchedRowY)) overlapByRow.set(matchedRowY, []);
      overlapByRow.get(matchedRowY).push({ idx: i, line });
    }
  }
  let extendedLeft = false;
  const oldBBoxLeft = table.bbox.left;
  if (leftAdjByRow.size > table.rows.length * 0.5 && leftAdjByRow.size >= 2) {
    let newLeft = Infinity;
    let maxRight = -Infinity;
    let alphabeticLines = 0;
    for (const arr of leftAdjByRow.values()) {
      for (const { line } of arr) {
        if (line.bbox.left < newLeft) newLeft = line.bbox.left;
        if (line.bbox.right > maxRight) maxRight = line.bbox.right;
        for (const word of line.words) {
          if (/[a-zA-Z]/.test(word.text)) {
            alphabeticLines++;
            break;
          }
        }
      }
    }
    if (alphabeticLines === 0) return;
    const candidateLabelSpan = maxRight - newLeft;
    if (candidateLabelSpan >= bboxWidth * 0.5) return;
    if (newLeft < oldBBoxLeft - 10) {
      table.colSeparators = [oldBBoxLeft, ...table.colSeparators].sort((a, b) => a - b);
      table.bbox.left = newLeft;
      for (const [rowY, arr] of leftAdjByRow) {
        const r = table.rows.find((row) => row.y === rowY);
        if (r) {
          for (const { idx } of arr) {
            if (!r.lineIndices.includes(idx)) r.lineIndices.push(idx);
          }
        }
      }
      for (const [rowY, arr] of overlapByRow) {
        const r = table.rows.find((row) => row.y === rowY);
        if (r) {
          for (const { idx } of arr) {
            if (!r.lineIndices.includes(idx)) r.lineIndices.push(idx);
          }
        }
      }
      extendedLeft = true;
    }
  }
  if (extendedLeft) {
    const labelColRight = table.colSeparators[0];
    const labelColLeft = table.bbox.left;
    const topLimit = table.bbox.top - medianSpacing * 2;
    for (let i = 0; i < lines.length; i++) {
      if (existingLineSet.has(i)) continue;
      const line = lines[i];
      if (line.bbox.top >= table.bbox.top) continue;
      if (line.bbox.top < topLimit) continue;
      if (line.bbox.left < labelColLeft - 5 || line.bbox.right > labelColRight + 5) continue;
      if (line.bbox.top < table.bbox.top) table.bbox.top = line.bbox.top;
    }
  }
  const colBoundaries = [table.bbox.left, ...table.colSeparators, table.bbox.right];
  let belowLimit = table.bbox.bottom + medianSpacing * 1.5;
  if (siblings) {
    for (const other of siblings) {
      if (other === table || !other.rows || other.rows.length === 0) continue;
      if (other.bbox.right < table.bbox.left || other.bbox.left > table.bbox.right) continue;
      let otherFirstRowY = Infinity;
      for (const r of other.rows) if (r.y < otherFirstRowY) otherFirstRowY = r.y;
      if (otherFirstRowY > table.bbox.bottom && otherFirstRowY - 5 < belowLimit) {
        belowLimit = otherFirstRowY - 5;
      }
    }
  }
  const belowLinesByY = /* @__PURE__ */ new Map();
  for (let i = 0; i < lines.length; i++) {
    if (existingLineSet.has(i)) continue;
    const line = lines[i];
    const ly = line.bbox.top;
    if (ly <= table.bbox.bottom || ly > belowLimit) continue;
    if (line.bbox.right < table.bbox.left || line.bbox.left > table.bbox.right) continue;
    let matchedY = null;
    for (const y of belowLinesByY.keys()) {
      if (Math.abs(ly - y) < 5) {
        matchedY = y;
        break;
      }
    }
    if (matchedY === null) {
      belowLinesByY.set(ly, [{ idx: i, line }]);
    } else {
      belowLinesByY.get(matchedY).push({ idx: i, line });
    }
  }
  const sortedBelowYs = [...belowLinesByY.keys()].sort((a, b) => a - b);
  for (const y of sortedBelowYs) {
    const arr = belowLinesByY.get(y);
    if (arr.length < 2) continue;
    let colHits = 0;
    for (const { line } of arr) {
      for (let c = 0; c < colBoundaries.length - 1; c++) {
        if (line.bbox.right > colBoundaries[c] && line.bbox.left < colBoundaries[c + 1]) {
          colHits++;
          break;
        }
      }
    }
    if (colHits < 2) break;
    let rowBottom = table.bbox.bottom;
    for (const { line } of arr) {
      if (line.bbox.bottom > rowBottom) rowBottom = line.bbox.bottom;
    }
    table.bbox.bottom = rowBottom;
    table.rows.push({
      y,
      lineIndices: arr.map((a) => a.idx)
    });
  }
}
function validateStreamOrder(table, lines) {
  for (let i = table.rows.length - 1; i >= 0; i--) {
    const row = table.rows[i];
    if (row.lineIndices.length < 2) continue;
    let maxGap = 0;
    for (let k = 1; k < row.lineIndices.length; k++) {
      const g = row.lineIndices[k] - row.lineIndices[k - 1];
      if (g > maxGap) maxGap = g;
    }
    if (maxGap > 2) continue;
    const sorted = [...row.lineIndices].sort((a, b) => lines[a].bbox.left - lines[b].bbox.left);
    let bad = false;
    for (let j = 1; j < sorted.length; j++) {
      if (sorted[j] < sorted[j - 1]) {
        bad = true;
        break;
      }
    }
    if (bad) table.rows.splice(i, 1);
  }
  return table.rows.length >= 3;
}
function computeBboxFromLineIndices(indices, lines) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const i of indices) {
    const b = lines[i].bbox;
    if (b.left < left) left = b.left;
    if (b.top < top) top = b.top;
    if (b.right > right) right = b.right;
    if (b.bottom > bottom) bottom = b.bottom;
  }
  return {
    left,
    top,
    right,
    bottom
  };
}
function bboxOverlap(a, b) {
  const overlapLeft = Math.max(a.left, b.left);
  const overlapTop = Math.max(a.top, b.top);
  const overlapRight = Math.min(a.right, b.right);
  const overlapBottom = Math.min(a.bottom, b.bottom);
  if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) return 0;
  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  const aArea = (a.right - a.left) * (a.bottom - a.top);
  const bArea = (b.right - b.left) * (b.bottom - b.top);
  const minArea = Math.min(aArea, bArea);
  return minArea > 0 ? overlapArea / minArea : 0;
}
function splitClusterByYGap(cluster) {
  const sorted = [...cluster].sort((a, b) => a.y - b.y);
  const uniqueYEntries = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i].y - sorted[i - 1].y > 2) {
      uniqueYEntries.push({ y: sorted[i].y, index: i });
    }
  }
  if (uniqueYEntries.length < 2) return [cluster];
  const gaps = [];
  for (let i = 1; i < uniqueYEntries.length; i++) {
    gaps.push({ gap: uniqueYEntries[i].y - uniqueYEntries[i - 1].y, index: uniqueYEntries[i].index });
  }
  const sortedGaps = [...gaps].sort((a, b) => a.gap - b.gap);
  const medianGap = sortedGaps[Math.floor((sortedGaps.length - 1) / 2)].gap;
  const maxEntry = sortedGaps[sortedGaps.length - 1];
  const gapRatioLimit = uniqueYEntries.length >= 10 ? 4 : 5;
  if (medianGap <= 0 || maxEntry.gap <= medianGap * gapRatioLimit) {
    return [cluster];
  }
  const left = sorted.slice(0, maxEntry.index);
  const right = sorted.slice(maxEntry.index);
  return [...splitClusterByYGap(left), ...splitClusterByYGap(right)];
}
function clusterHLinesByXExtent(hLines) {
  const clusters = [];
  for (const hl of hLines) {
    let added = false;
    for (const cluster of clusters) {
      const overlapLeft = Math.max(hl.left, cluster.left);
      const overlapRight = Math.min(hl.right, cluster.right);
      const overlap = Math.max(0, overlapRight - overlapLeft);
      const hlWidth = hl.right - hl.left;
      const clusterWidth = cluster.right - cluster.left;
      const minWidth = Math.min(hlWidth, clusterWidth);
      const gap = overlapLeft - overlapRight;
      if (minWidth > 0 && overlap / minWidth > 0.5 || gap >= 0 && gap < 15) {
        cluster.lines.push(hl);
        if (hl.left < cluster.left) cluster.left = hl.left;
        if (hl.right > cluster.right) cluster.right = hl.right;
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({ lines: [hl], left: hl.left, right: hl.right });
    }
  }
  return clusters.map((c) => c.lines);
}
function clusterValues(values, tolerance) {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const lastMedian = lastCluster[Math.floor(lastCluster.length / 2)];
    if (sorted[i] - lastMedian <= tolerance) {
      lastCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  return clusters.map((c) => c[Math.floor(c.length / 2)]);
}
function assignParagraphs(page, angle) {
  let endsEarlyPrev = false;
  let startsLatePrev = false;
  let bulletPrev = false;
  let letterEndPrev = false;
  let newPar = true;
  let reason = "first line";
  const sinAngle = Math.sin(angle * (Math.PI / 180));
  const cosAngle = Math.cos(angle * (Math.PI / 180));
  const parArr = [];
  const lineLeftArr = (
    /** @type {Array<number>} */
    []
  );
  const lineRightArr = (
    /** @type {Array<number>} */
    []
  );
  const lineWidthArr = (
    /** @type {Array<number>} */
    []
  );
  const lineCenterArr = (
    /** @type {Array<number>} */
    []
  );
  const lineSpaceArr = (
    /** @type {Array<number>} */
    []
  );
  let y2Prev = null;
  for (let h = 0; h < page.lines.length; h++) {
    const line = page.lines[h];
    if (!line) continue;
    lineSpaceArr.push(line.bbox.bottom - y2Prev);
    const x1Rot = line.bbox.left * cosAngle - sinAngle * line.bbox.bottom;
    const x2Rot = line.bbox.right * cosAngle - sinAngle * line.bbox.bottom;
    lineLeftArr.push(x1Rot);
    lineRightArr.push(x2Rot);
    lineWidthArr.push(line.bbox.right - line.bbox.left);
    lineCenterArr.push((x1Rot + x2Rot) / 2);
    y2Prev = line.bbox.bottom;
  }
  const calcExpected = (lineIndex) => {
    const windowSize = 5;
    const linesPrev = page.lines.slice(Math.max(0, lineIndex - windowSize), lineIndex).filter((x) => x.bbox.bottom <= page.lines[lineIndex].bbox.bottom);
    const linesNext = page.lines.slice(lineIndex + 1, lineIndex + windowSize + 1).filter((x) => x.bbox.bottom >= page.lines[lineIndex].bbox.bottom);
    const linesNextN = linesNext.length;
    const linesPrevN = Math.min(windowSize - linesNextN, linesPrev.length);
    const compIndices = [];
    if (linesPrevN) compIndices.push(...range(lineIndex - linesPrevN, lineIndex - 1));
    if (linesNextN) compIndices.push(...range(lineIndex + 1, lineIndex + linesNextN));
    if (!compIndices.length) return null;
    const lineLeftMedian = quantile(compIndices.map((x) => lineLeftArr[x]), 0.5);
    const lineRightMedian = quantile(compIndices.map((x) => lineRightArr[x]), 0.5);
    const lineWidthMedian = quantile(compIndices.map((x) => lineWidthArr[x]), 0.5);
    const lineSpaceMedian = quantile(compIndices.map((x) => lineSpaceArr[x]), 0.5);
    if (lineLeftMedian === null || lineRightMedian === null || lineWidthMedian === null || lineSpaceMedian === null) return null;
    return {
      lineLeftMedian,
      lineRightMedian,
      lineWidthMedian,
      lineSpaceMedian
    };
  };
  for (let h = 0; h < page.lines.length; h++) {
    const line = page.lines[h];
    let endsEarlyInt = false;
    let startsLate = false;
    if (h > 0 && line.orientation !== page.lines[h - 1].orientation) {
      newPar = true;
      reason = "orientation change";
    }
    let bullet = /^([•◦▪▫●○◼◻➢«»]|((i+|\d+|[a-z])(\.|\)))$)/.test(line.words[0].text);
    if (bullet && line.words[0].text === "v.") bullet = false;
    let isRealListItem = bullet;
    if (isRealListItem && h > 0) {
      const prevLine = page.lines[h - 1];
      const prevLineLast = prevLine.words[prevLine.words.length - 1].text;
      if (!/[.!?:]$/.test(prevLineLast)) isRealListItem = false;
      else {
        const prevText = prevLine.words.map((w) => w.text).join("");
        const lastOpen = prevText.lastIndexOf("(");
        const lastClose = prevText.lastIndexOf(")");
        if (lastOpen > lastClose) isRealListItem = false;
      }
    }
    const lowerStart = /[a-z]/.test(line.words[0].text.slice(0, 1));
    const letterEnd = /\w/.test(line.words[line.words.length - 1].text.slice(-1));
    const lowerConnection = lowerStart && letterEndPrev;
    if (isRealListItem && h > 0) {
      newPar = true;
      reason = "bullet/list item";
    }
    const firstWordSup = line.words[0].style && line.words[0].style.sup;
    if (firstWordSup && h > 0) {
      newPar = true;
      reason = "superscript/footnote";
    }
    let parLineIndices = (
      /** @type {?Array<number>} */
      []
    );
    if (parArr[parArr.length - 1] && parArr[parArr.length - 1].lines.length > 0) {
      parLineIndices = parArr[parArr.length - 1].lines.map((line2) => page.lines.indexOf(line2));
      if (parArr[parArr.length - 1].lines.length > 2 && !bulletPrev) {
        const parLeftMedian = quantile(parLineIndices.map((x) => lineLeftArr[x]), 0.5);
        const parWidthMedian = quantile(parLineIndices.map((x) => lineWidthArr[x]), 0.5);
        const leftChangeThresh = Math.max(parWidthMedian * 0.05, 50);
        if (parLeftMedian && parWidthMedian && lineLeftArr[h] && Math.abs(lineLeftArr[h] - lineLeftArr[h - 1]) > leftChangeThresh && Math.abs(lineLeftArr[h] - parLeftMedian) > leftChangeThresh && Math.abs(lineLeftArr[h + 1] - parLeftMedian) > leftChangeThresh) {
          newPar = true;
          reason = "left change";
        }
      }
    }
    const expected = calcExpected(h);
    if (!expected) {
      newPar = true;
      reason = "default value (unable to calculate)";
    } else {
      const {
        lineLeftMedian,
        lineRightMedian,
        lineWidthMedian,
        lineSpaceMedian
      } = expected;
      const parInProgress = parArr[parArr.length - 1];
      const parFirstLineLeft = parLineIndices && parLineIndices.length > 0 ? lineLeftArr[parLineIndices[0]] : null;
      const continuesPrevIndent = parInProgress && parInProgress.lines.length >= 2 && lineLeftArr[h - 1] !== void 0 && Math.abs(lineLeftArr[h] - lineLeftArr[h - 1]) < lineWidthMedian * 0.025 && parFirstLineLeft !== null && parFirstLineLeft < lineLeftArr[h] - lineWidthMedian * 0.025;
      const continuesAtSameIndent = parInProgress && parInProgress.lines.length >= 1 && parInProgress.lines[parInProgress.lines.length - 1] === page.lines[h - 1] && lineLeftArr[h - 1] !== void 0 && Math.abs(lineLeftArr[h] - lineLeftArr[h - 1]) < lineWidthMedian * 0.025;
      const indented = lineLeftMedian && h + 1 < page.lines.length && lineLeftArr[h] > lineLeftMedian + lineWidthMedian * 0.025 && lineLeftArr[h] > lineLeftArr[h + 1] && !continuesPrevIndent && !continuesAtSameIndent;
      const centerAlignedPrev = parLineIndices && parLineIndices.map((x) => lineCenterArr[x]).every((x) => Math.abs(x - lineCenterArr[h - 1]) < lineWidthMedian * 0.0125);
      let trulyCenterAlignedPrev = false;
      if (centerAlignedPrev && parLineIndices) {
        if (parLineIndices.length > 1) {
          trulyCenterAlignedPrev = parLineIndices.map((x) => lineWidthArr[x]).some((x) => Math.abs(x - lineWidthArr[h - 1]) > lineWidthMedian * 0.05);
        } else if (parLineIndices.length === 1) {
          const prevIdx = parLineIndices[0];
          const sharedCenter = Math.abs(lineCenterArr[prevIdx] - lineCenterArr[h]) < lineWidthMedian * 0.0125;
          const widthDiffers = Math.abs(lineWidthArr[prevIdx] - lineWidthArr[h]) > lineWidthMedian * 0.05;
          trulyCenterAlignedPrev = sharedCenter && widthDiffers;
        }
      }
      const centerAligned = lineCenterArr[h - 1] && Math.abs(lineCenterArr[h - 1] - lineCenterArr[h]) < lineWidthMedian * 0.0125;
      const centerAlignedNext = lineCenterArr[h + 1] && Math.abs(lineCenterArr[h + 1] - lineCenterArr[h]) < lineWidthMedian * 0.0125;
      const centerAlignedStart = !centerAlignedPrev && !centerAligned && centerAlignedNext;
      const centerAlignedEnd = centerAlignedPrev && !centerAligned;
      if (parLineIndices && lineCenterArr[h - 1] && (centerAlignedStart || centerAlignedEnd)) {
        const widthVariationPrev = parLineIndices && parLineIndices.length > 1 && parLineIndices.map((x) => lineWidthArr[x]).some((x) => Math.abs(x - lineWidthArr[h - 1]) > lineWidthMedian * 0.05);
        const widthVariation = lineRightArr[h - 1] && Math.abs(lineRightArr[h] - lineRightArr[h - 1]) > lineWidthMedian * 0.05;
        const widthVariationNext = lineRightArr[h + 1] && Math.abs(lineRightArr[h] - lineRightArr[h + 1]) > lineWidthMedian * 0.05;
        const leftChange = lineLeftArr[h - 1] && Math.abs(lineLeftArr[h - 1] - lineLeftArr[h]) > lineWidthMedian * 0.025;
        const rightChange = lineRightArr[h - 1] && Math.abs(lineRightArr[h - 1] - lineRightArr[h]) > lineWidthMedian * 0.025;
        if (leftChange && rightChange && widthVariationPrev && widthVariation && widthVariationNext) {
          newPar = true;
          reason = "alignment change";
        }
      }
      const indentedWeak = lineLeftArr[h] > lineLeftArr[h - 1] + 1;
      const lineSpaceWeak = lineSpaceArr[h - 1] > 0 && lineSpaceArr[h] > 1.1 * lineSpaceArr[h - 1];
      const lineNextFirstWord = page.lines[h + 1] && page.lines[h + 1].words[0];
      endsEarlyInt = lineRightMedian - lineRightArr[h] > lineWidthMedian * 0.1 && !!lineRightArr[h - 1] && lineRightArr[h - 1] - lineRightArr[h] > lineWidthMedian * 0.1 && lineNextFirstWord && lineNextFirstWord.bbox.right - lineNextFirstWord.bbox.left < lineRightMedian - lineRightArr[h];
      startsLate = lineLeftArr[h] > lineLeftMedian + lineWidthMedian * 0.2 && !!lineLeftArr[h - 1] && lineLeftArr[h] - lineLeftArr[h - 1] > lineWidthMedian * 0.2;
      if (endsEarlyPrev && !lowerConnection && (lineSpaceWeak || indentedWeak)) {
        newPar = true;
        reason = "prev line ends early";
      } else if (startsLatePrev && !lowerConnection && !centerAlignedPrev) {
        newPar = true;
        reason = "prev line starts late";
      } else if (indented && !bulletPrev && !lowerConnection && !trulyCenterAlignedPrev) {
        newPar = true;
        reason = "indentation";
      } else if (h === 1 && lineSpaceArr[h] > 1.5 * lineSpaceMedian) {
        newPar = true;
        reason = "large space (first line)";
      }
    }
    const lineHeight = line.bbox.bottom - line.bbox.top;
    if (lineSpaceArr[h] && lineSpaceArr[h] < lineHeight * -1) {
      newPar = true;
      reason = "new column";
    }
    const lineSpaceIncrease = lineSpaceArr[h - 1] > 0 && lineSpaceArr[h] > 1.5 * lineSpaceArr[h - 1];
    const lineSpaceDecrease = lineSpaceArr[h + 1] > 0 && lineSpaceArr[h] > 1.5 * lineSpaceArr[h + 1];
    if (lineSpaceIncrease || lineSpaceDecrease) {
      newPar = true;
      reason = "large space (relative)";
    }
    const bbox = line.bbox;
    const bboxPrev = page.lines[h - 1]?.bbox;
    const height = bbox.bottom - bbox.top;
    const width = bbox.right - bbox.left;
    const heightRot = height * cosAngle - sinAngle * width;
    if (lineSpaceArr[h] && lineSpaceArr[h] > 3 * heightRot) {
      newPar = true;
      reason = "large space (absolute)";
    }
    if (bboxPrev && (bboxPrev.right < bbox.left || bboxPrev.left > bbox.right) && (bboxPrev.bottom < bbox.top || bboxPrev.top > bbox.bottom)) {
      newPar = true;
      reason = "no overlap";
    }
    if (newPar) {
      const par = new OcrPar(page, {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      });
      par.reason = reason;
      parArr.push(par);
      reason = "";
    }
    parArr[parArr.length - 1].lines.push(line);
    endsEarlyPrev = endsEarlyInt && !newPar;
    startsLatePrev = startsLate;
    bulletPrev = bullet;
    letterEndPrev = letterEnd;
    newPar = false;
  }
  parArr.forEach((parObj) => {
    parObj.lines.forEach((lineObj) => {
      lineObj.par = parObj;
    });
    parObj.bbox = calcBboxUnion(parObj.lines.map((x) => x.bbox));
  });
  page.pars = parArr;
}
const GRAPHICS_HEAVY_STREAM_BYTES = 2e6;
const PATH_PLACEMENT_CAP = 2e3;
const STRUCTURAL_MC_TAGS = /* @__PURE__ */ new Set(["P", "H", "H1", "H2", "H3", "H4", "H5", "H6", "LBody", "Lbl", "LI", "Title", "Caption", "BlockQuote", "Note", "TOCI", "Reference", "Quote", "Code"]);
const PATH_TEXT_H_MIN = 3;
const PATH_TEXT_H_MAX = 80;
function colorToRgb(c) {
  if (c.length === 1) return [c[0], c[0], c[0]];
  if (c.length === 3) return [c[0], c[1], c[2]];
  if (c.length === 4) {
    const [r, g, b] = cmykToRgb(c[0], c[1], c[2], c[3]);
    return [r / 255, g / 255, b / 255];
  }
  return null;
}
function rgbToHex(rgb) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));
  const hex = (x) => clamp(x).toString(16).padStart(2, "0");
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`;
}
function parseFillAlphaExtGStates(containerObjText, objCache) {
  const states = /* @__PURE__ */ new Map();
  let resourcesText = containerObjText;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(containerObjText);
  if (resRefMatch) {
    const resObj = objCache.getObjectText(Number(resRefMatch[1]));
    if (resObj) resourcesText = resObj;
  }
  const gsStart = resourcesText.indexOf("/ExtGState");
  if (gsStart === -1) return states;
  let gsDictText;
  const afterGs = resourcesText.substring(gsStart + 10).trim();
  if (afterGs.startsWith("<<")) {
    gsDictText = extractDict(resourcesText, gsStart + 10 + resourcesText.substring(gsStart + 10).indexOf("<<"));
  } else {
    const gsRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterGs);
    if (gsRefMatch) {
      const gsObj = objCache.getObjectText(Number(gsRefMatch[1]));
      if (gsObj) gsDictText = gsObj;
    }
  }
  if (!gsDictText) return states;
  let i = 2;
  while (i < gsDictText.length) {
    if (gsDictText[i] !== "/") {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < gsDictText.length && !/[\s/<>[\]]/.test(gsDictText[j])) j++;
    const gsName = gsDictText.substring(i + 1, j);
    while (j < gsDictText.length && /\s/.test(gsDictText[j])) j++;
    let gsBody;
    if (gsDictText.startsWith("<<", j)) {
      gsBody = extractDict(gsDictText, j);
      i = j + gsBody.length;
    } else {
      const refMatch = /^(\d+)\s+\d+\s+R/.exec(gsDictText.substring(j));
      if (refMatch) {
        const refObj = objCache.getObjectText(Number(refMatch[1]));
        gsBody = refObj || "";
        i = j + refMatch[0].length;
      } else {
        i = j + 1;
        continue;
      }
    }
    const ca2 = resolveNumValue(gsBody, "ca", objCache, Number.NaN);
    states.set(gsName, { fillAlpha: Number.isNaN(ca2) ? null : ca2 });
  }
  return states;
}
const SYMBOL_FONT_RE = /^(?:Webdings|Wingdings|ZapfDingbats|Dingbats|Symbol|SymbolMT|Quivira)(?:[-\s].*)?$/i;
function isSymbolFont(fontInfo) {
  if (!fontInfo) return false;
  return SYMBOL_FONT_RE.test(fontInfo.familyName || "");
}
const SYMBOL_CHAR_RE = /[•‣⁃∙─-➿]/;
function isSymbolChar(text = "") {
  return text.length > 0 && SYMBOL_CHAR_RE.test(text);
}
const MATH_FONT_RE = /^(?:CM(?:MI|SY|EX)|lm(?:mi|sy|ex)|MS[AB]M|EUF[MB]|EUS[MB]|RSFS|MT(?:MI|SY|EX))|MathJax|[A-Za-z]*Math\b/i;
const MATH_CHAR_RE = /[ℂℏℑℕ℘ℚℜℝℤℵ∀-⋿⟀-⟯⦀-⧿⨀-⫿\u{1D400}-\u{1D7FF}]/u;
const BULLET_CHAR_RE = /[·•‣⁃∙■-◿・]/;
function isBulletChar(text = "") {
  return text.length > 0 && BULLET_CHAR_RE.test(text);
}
function findDoOperators(tokens, formXObjects, initialCtm, initialTextState) {
  const doOps = [];
  let ctm = initialCtm.slice();
  const ctmStack = [];
  const operandStack = [];
  let tc = initialTextState ? initialTextState.tc : 0;
  let tw = initialTextState ? initialTextState.tw : 0;
  let tl = initialTextState ? initialTextState.tl : 0;
  let tz = initialTextState ? initialTextState.tz : 100;
  let trise = initialTextState ? initialTextState.trise : 0;
  const mcStack = [];
  let artifactDepth = initialTextState && initialTextState.artifact ? 1 : 0;
  const gsStack = [];
  for (const tok of tokens) {
    if (tok.type !== "operator") {
      operandStack.push(tok);
      continue;
    }
    switch (tok.value) {
      case "BDC":
      case "BMC": {
        const tagTok = operandStack[0];
        const isArtifact = !!(tagTok && tagTok.type === "name" && tagTok.value === "Artifact");
        mcStack.push(isArtifact);
        if (isArtifact) artifactDepth++;
        break;
      }
      case "EMC": {
        const wasArtifact = mcStack.pop();
        if (wasArtifact && artifactDepth > 0) artifactDepth--;
        break;
      }
      case "q":
        ctmStack.push(ctm.slice());
        gsStack.push({
          ctm: ctm.slice(),
          tc,
          tw,
          tl,
          tz,
          trise
        });
        break;
      case "Q":
        if (ctmStack.length > 0) ctm = ctmStack.pop();
        if (gsStack.length > 0) {
          const saved = (
            /** @type {NonNullable<ReturnType<typeof gsStack.pop>>} */
            gsStack.pop()
          );
          tc = saved.tc;
          tw = saved.tw;
          tl = saved.tl;
          tz = saved.tz;
          trise = saved.trise;
        }
        break;
      case "cm":
        if (operandStack.length >= 6) {
          const m = operandStack.slice(operandStack.length - 6).map((t) => t.value);
          ctm = matMul(m, ctm);
        }
        break;
      case "Tc":
        if (operandStack.length >= 1) tc = operandStack[operandStack.length - 1].value;
        break;
      case "Tw":
        if (operandStack.length >= 1) tw = operandStack[operandStack.length - 1].value;
        break;
      case "TL":
        if (operandStack.length >= 1) tl = operandStack[operandStack.length - 1].value;
        break;
      case "Tz":
        if (operandStack.length >= 1) tz = operandStack[operandStack.length - 1].value;
        break;
      case "Ts":
        if (operandStack.length >= 1) trise = operandStack[operandStack.length - 1].value;
        break;
      case "TD":
        if (operandStack.length >= 2) tl = -operandStack[operandStack.length - 1].value;
        break;
      case "Do":
        if (operandStack.length >= 1) {
          const name = operandStack[operandStack.length - 1].value;
          if (formXObjects.has(name)) {
            doOps.push({
              name,
              ctm: ctm.slice(),
              textState: {
                tc,
                tw,
                tl,
                tz,
                trise,
                artifact: artifactDepth > 0
              }
            });
          }
        }
        break;
    }
    operandStack.length = 0;
  }
  return doOps;
}
function parseTextColorSpaces(containerObjText, objCache) {
  const map = /* @__PURE__ */ new Map();
  let resourcesText = null;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(containerObjText);
  if (resRefMatch) {
    resourcesText = objCache.getObjectText(Number(resRefMatch[1])) || null;
  } else {
    const resIdx = containerObjText.indexOf("/Resources");
    if (resIdx !== -1) {
      const dictStart = containerObjText.indexOf("<<", resIdx);
      if (dictStart !== -1) resourcesText = extractDict(containerObjText, dictStart);
    }
  }
  if (!resourcesText) return map;
  const resBody = resourcesText.startsWith("<<") ? resourcesText.slice(2) : resourcesText;
  const csIdx = findTopLevelKeyIndex(resBody, "/ColorSpace");
  if (csIdx === -1) return map;
  let csDictText = null;
  const afterCs = resBody.substring(csIdx + 11).trim();
  if (afterCs.startsWith("<<")) {
    csDictText = extractDict(resBody, csIdx + 11 + resBody.substring(csIdx + 11).indexOf("<<"));
  } else {
    const refMatch = /^(\d+)\s+\d+\s+R/.exec(afterCs);
    if (refMatch) csDictText = objCache.getObjectText(Number(refMatch[1]));
  }
  if (!csDictText) return map;
  const addEntry = (name, csText) => {
    if (!csText || !/\/(Separation|DeviceN)\b/.test(csText)) return;
    const tint = parseTintColorSpace(csText, objCache);
    if (tint && tint.tintFn) map.set(name, { nInputs: tint.nInputs, tint });
  };
  for (const m of csDictText.matchAll(/\/([^\s/<>[\]]+)\s+(\d+)\s+\d+\s+R/g)) {
    addEntry(m[1], objCache.getObjectText(Number(m[2])));
  }
  for (const m of csDictText.matchAll(/\/([^\s/<>[\]]+)\s*\[/g)) {
    const arrStart = m.index + m[0].length - 1;
    let depth = 0;
    let arrEnd = -1;
    for (let i = arrStart; i < csDictText.length; i++) {
      if (csDictText[i] === "[") depth++;
      else if (csDictText[i] === "]") {
        depth--;
        if (depth === 0) {
          arrEnd = i + 1;
          break;
        }
      }
    }
    if (arrEnd > 0) addEntry(m[1], csDictText.substring(arrStart, arrEnd));
  }
  return map;
}
function transformedRectBounds(rect, m) {
  const xs = [];
  const ys = [];
  for (const [x, y] of [[rect[0], rect[1]], [rect[2], rect[1]], [rect[2], rect[3]], [rect[0], rect[3]]]) {
    xs.push(m[0] * x + m[2] * y + m[4]);
    ys.push(m[1] * x + m[3] * y + m[5]);
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function intersectRects(a, b) {
  if (!a) return b ? b.slice() : null;
  if (!b) return a.slice();
  return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
}
function extractFormXObjectText(containerObjText, containerTokens, parentFonts, scale, pageHeightPts, containerCtm, objCache, visited, parentExtGStates, parentTextState, parentColorSpaces, glyphOpMap = null, records = null, pathPrefix = "", containerDos = null) {
  const chars = [];
  const formXObjects = findFormXObjects(containerObjText, objCache);
  if (formXObjects.size === 0) return chars;
  const doOps = findDoOperators(containerTokens, formXObjects, containerCtm, parentTextState);
  let doCursor = 0;
  for (const doOp of doOps) {
    let visibleAtDo = null;
    if (containerDos) {
      while (doCursor < containerDos.length && containerDos[doCursor].name !== doOp.name) doCursor += 1;
      if (doCursor < containerDos.length) visibleAtDo = containerDos[doCursor].visible;
      doCursor += 1;
    }
    const form = formXObjects.get(doOp.name);
    if (visited.has(form.objNum)) continue;
    visited.add(form.objNum);
    const formObjText = objCache.getObjectText(form.objNum);
    if (!formObjText) continue;
    const formBytes = objCache.getStreamBytes(form.objNum);
    if (!formBytes) continue;
    const formPath = `${pathPrefix}${doOp.name}`;
    const formStream = { kind: (
      /** @type {'form'} */
      "form"
    ), path: formPath };
    const formPatched = applyTextPatchRecords(bytesToLatin1(formBytes), records, formStream);
    const formContentStream = formPatched.text;
    const formFonts = parsePageFonts(formObjText, objCache);
    const mergedFonts = new Map([...parentFonts, ...formFonts]);
    const formExtGStates = parseFillAlphaExtGStates(formObjText, objCache);
    const mergedExtGStates = formExtGStates.size > 0 ? new Map([...parentExtGStates || [], ...formExtGStates]) : parentExtGStates;
    const formColorSpaces = parseTextColorSpaces(formObjText, objCache);
    const mergedColorSpaces = formColorSpaces.size > 0 ? new Map([...parentColorSpaces || [], ...formColorSpaces]) : parentColorSpaces;
    const formMatrix = parseFormMatrix(formObjText, objCache);
    const formCtm = matMul(formMatrix, doOp.ctm);
    const formTokens = tokenizeContentStream(formContentStream);
    let formVisible = null;
    if (glyphOpMap) {
      const bbox = parseFormBBox(formObjText, objCache);
      formVisible = bbox ? intersectRects(visibleAtDo, transformedRectBounds(bbox, formCtm)) : visibleAtDo;
      glyphOpMap.stream = formStream;
      glyphOpMap.streams.push({
        stream: glyphOpMap.stream,
        text: formContentStream,
        tokens: formTokens,
        segments: formPatched.segments,
        fonts: mergedFonts,
        extGStates: mergedExtGStates,
        colorSpaces: mergedColorSpaces,
        dos: []
      });
    }
    const formEntry = glyphOpMap ? glyphOpMap.streams[glyphOpMap.streams.length - 1] : null;
    const formChars = executeTextOperators(
      formTokens,
      mergedFonts,
      scale,
      pageHeightPts,
      formCtm,
      mergedExtGStates,
      doOp.textState,
      mergedColorSpaces,
      glyphOpMap,
      formVisible
    );
    for (let ci = 0; ci < formChars.length; ci++) chars.push(formChars[ci]);
    const nestedChars = extractFormXObjectText(
      formObjText,
      formTokens,
      mergedFonts,
      scale,
      pageHeightPts,
      formCtm,
      objCache,
      visited,
      mergedExtGStates,
      doOp.textState,
      mergedColorSpaces,
      glyphOpMap,
      records,
      `${formPath}/`,
      formEntry ? formEntry.dos : null
    );
    for (let ci = 0; ci < nestedChars.length; ci++) chars.push(nestedChars[ci]);
  }
  return chars;
}
function scorePageChars(chars) {
  let printable = 0;
  let printableVis = 0;
  let pua = 0;
  let control = 0;
  let controlVis = 0;
  let visibleAll = 0;
  for (const ch of chars) {
    const codePoint = ch.text.codePointAt(0);
    if (codePoint === void 0) continue;
    if (codePoint >= 33 && codePoint <= 127) {
      printable++;
      if (!ch.invisible) {
        printableVis++;
        visibleAll++;
      }
    } else if (codePoint >= 57344 && codePoint <= 63743) {
      pua++;
      if (!ch.invisible) visibleAll++;
    } else if (codePoint >= 161) {
      printable++;
      if (!ch.invisible) {
        printableVis++;
        visibleAll++;
      }
    } else if (codePoint < 32 || codePoint === 65533) {
      control++;
      if (!ch.invisible) {
        controlVis++;
        visibleAll++;
      }
    }
  }
  return {
    printable,
    printableVis,
    pua,
    control,
    controlVis,
    visibleAll
  };
}
const brokenFontCache = /* @__PURE__ */ new WeakMap();
const brokenToUnicodeFont = (f) => {
  if (!f || !f.toUnicode || f.toUnicode.size === 0) return false;
  const cached = brokenFontCache.get(f);
  if (cached !== void 0) return cached;
  const fillerHashes = /* @__PURE__ */ new Set();
  if (f.type3) {
    const enc = f.type3.encoding || {};
    const glyphs = f.type3.glyphs || {};
    const hashCount = /* @__PURE__ */ new Map();
    for (const [cc] of f.toUnicode) {
      const g = glyphs[enc[cc]];
      if (g && g.pathHash) hashCount.set(g.pathHash, (hashCount.get(g.pathHash) || 0) + 1);
    }
    for (const [hash, count] of hashCount) {
      if (count >= 3) fillerHashes.add(hash);
    }
  }
  let mapped = 0;
  let broken = 0;
  for (const [cc, str] of f.toUnicode) {
    if (fillerHashes.size > 0) {
      const g = f.type3.glyphs?.[f.type3.encoding?.[cc]];
      if (g && g.pathHash && fillerHashes.has(g.pathHash)) continue;
    }
    mapped++;
    if (!str) continue;
    const cp = str.codePointAt(0);
    if (cp >= 57344 && cp <= 63743 || cp === 65533) broken++;
  }
  const isBroken = broken >= 3 && broken >= mapped * 0.5;
  brokenFontCache.set(f, isBroken);
  return isBroken;
};
function parseSinglePage(page, objCache, n, dpi, type3GlyphMappings, destInfo, glyphOpMap = null, records = null) {
  const {
    objText,
    mediaBox,
    cropBox,
    rotate
  } = page;
  const effectiveBox = cropBox || mediaBox;
  const contentWidthPts = Math.abs(effectiveBox[2] - effectiveBox[0]);
  const contentHeightPts = Math.abs(effectiveBox[3] - effectiveBox[1]);
  const boxOriginX = Math.min(effectiveBox[0], effectiveBox[2]);
  const boxOriginY = Math.min(effectiveBox[1], effectiveBox[3]);
  let initialCtm = [1, 0, 0, 1, -boxOriginX, -boxOriginY];
  let visualWidthPts = contentWidthPts;
  let visualHeightPts = contentHeightPts;
  if (rotate === 90) {
    initialCtm = [0, -1, 1, 0, -boxOriginY, contentWidthPts + boxOriginX];
    visualWidthPts = contentHeightPts;
    visualHeightPts = contentWidthPts;
  } else if (rotate === 180) {
    initialCtm = [-1, 0, 0, -1, contentWidthPts + boxOriginX, contentHeightPts + boxOriginY];
  } else if (rotate === 270) {
    initialCtm = [0, 1, -1, 0, contentHeightPts + boxOriginY, -boxOriginX];
    visualWidthPts = contentHeightPts;
    visualHeightPts = contentWidthPts;
  }
  const maxWidth = 3500;
  const scale300 = dpi / 72;
  const fullWidth = Math.round(visualWidthPts * scale300);
  const scale = fullWidth > maxWidth ? maxWidth / visualWidthPts : scale300;
  const pageWidth = Math.round(visualWidthPts * scale);
  const pageHeight = Math.round(visualHeightPts * scale);
  const fonts = parsePageFonts(objText, objCache, type3GlyphMappings);
  const substituteEntries = substituteFaceResourceEntries(objCache, records);
  if (substituteEntries) for (const [tag, f] of parsePageFonts(`<</Resources<</Font<<${substituteEntries}>>>>>>`, objCache, type3GlyphMappings)) fonts.set(tag, f);
  const contentEntries = getPageContentStreams(objText, objCache);
  const pagePatched = contentEntries && contentEntries.length > 0 ? patchPageContents(contentEntries, records) : null;
  const contentStreamText = pagePatched ? pagePatched.text : null;
  if (!contentStreamText) {
    const pageObj2 = new ocr.OcrPage(n, { width: pageWidth, height: pageHeight });
    const pageStats2 = {
      largestImageFrac: 0,
      invisibleTextChars: 0,
      visibleChars: 0,
      visibleReadableChars: 0,
      printableVis: 0,
      control: 0,
      controlVis: 0,
      pathTextCandidates: 0,
      imageTextCandidates: 0,
      longestBrokenRun: 0,
      pageSize: [Math.round(visualWidthPts), Math.round(visualHeightPts)]
    };
    return {
      pageObj: pageObj2,
      langSet: /* @__PURE__ */ new Set(),
      fontSet: /* @__PURE__ */ new Set(),
      dataTablePage: new LayoutDataTablePage(n),
      pageStats: pageStats2
    };
  }
  const tokens = tokenizeContentStream(contentStreamText);
  const extGStates = parseFillAlphaExtGStates(objText, objCache);
  const textColorSpaces = parseTextColorSpaces(objText, objCache);
  if (glyphOpMap) {
    glyphOpMap.stream = { kind: "page" };
    glyphOpMap.pageHeightPts = visualHeightPts;
    glyphOpMap.scale = scale;
    glyphOpMap.streams.push({
      stream: glyphOpMap.stream,
      text: contentStreamText,
      tokens,
      segments: pagePatched.segments,
      fonts,
      extGStates,
      colorSpaces: textColorSpaces,
      dos: []
    });
  }
  const chars = executeTextOperators(
    tokens,
    fonts,
    scale,
    visualHeightPts,
    initialCtm,
    extGStates,
    void 0,
    textColorSpaces,
    glyphOpMap,
    glyphOpMap ? [0, 0, visualWidthPts, visualHeightPts] : null
  );
  const formChars = extractFormXObjectText(
    objText,
    tokens,
    fonts,
    scale,
    visualHeightPts,
    initialCtm,
    objCache,
    /* @__PURE__ */ new Set(),
    extGStates,
    void 0,
    textColorSpaces,
    glyphOpMap,
    records,
    "",
    glyphOpMap ? glyphOpMap.streams[0].dos : null
  );
  for (let ci = 0; ci < formChars.length; ci++) chars.push(formChars[ci]);
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    const margin = ch.fontSize || 0;
    if (ch.x + margin < 0 || ch.x > pageWidth + margin || ch.y + margin < 0 || ch.y > pageHeight + margin) {
      chars.splice(i, 1);
    }
  }
  const DEDUP_COORD_OFF = 33554432;
  const DEDUP_COORD_MUL = 67108864;
  const seenByText = /* @__PURE__ */ new Map();
  const dedupedChars = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const flagsSize = Math.round(ch.fontSize * 10) * 4 + (ch.fontInfo.bold ? 2 : 0) + (ch.fontInfo.italic ? 1 : 0);
    const bucketSize = Math.max(0.25, ch.fontSize * 0.05);
    const xb = Math.round(ch.x / bucketSize);
    const yb = Math.round(ch.y / bucketSize);
    let byFamily = seenByText.get(ch.text);
    if (!byFamily) {
      byFamily = /* @__PURE__ */ new Map();
      seenByText.set(ch.text, byFamily);
    }
    let byFlags = byFamily.get(ch.fontInfo.familyName);
    if (!byFlags) {
      byFlags = /* @__PURE__ */ new Map();
      byFamily.set(ch.fontInfo.familyName, byFlags);
    }
    let coords = byFlags.get(flagsSize);
    if (!coords) {
      coords = /* @__PURE__ */ new Map();
      byFlags.set(flagsSize, coords);
    }
    let dupOf = null;
    for (let dx = -1; dx <= 1 && !dupOf; dx++) {
      for (let dy = -1; dy <= 1 && !dupOf; dy++) {
        dupOf = coords.get((xb + dx + DEDUP_COORD_OFF) * DEDUP_COORD_MUL + (yb + dy + DEDUP_COORD_OFF)) || null;
      }
    }
    if (dupOf) continue;
    coords.set((xb + DEDUP_COORD_OFF) * DEDUP_COORD_MUL + (yb + DEDUP_COORD_OFF), ch);
    dedupedChars.push(ch);
  }
  chars.length = 0;
  for (let i = 0; i < dedupedChars.length; i++) chars.push(dedupedChars[i]);
  const charStats = scorePageChars(chars);
  let longestBrokenRun = 0;
  let brokenRun = 0;
  let printableVisNonBroken = 0;
  let bodyReadableChars = 0;
  const bodyTop = pageHeight * 0.1;
  const bodyBottom = pageHeight * 0.9;
  let mathFontGlyphs = 0;
  let mathCharGlyphs = 0;
  for (const ch of chars) {
    if (brokenToUnicodeFont(ch._font)) {
      brokenRun++;
      if (brokenRun > longestBrokenRun) longestBrokenRun = brokenRun;
      continue;
    }
    brokenRun = 0;
    if (ch.invisible) continue;
    const cp = ch.text.codePointAt(0);
    if (cp === void 0) continue;
    if (MATH_FONT_RE.test(ch.fontInfo.baseName || "")) mathFontGlyphs++;
    if (MATH_CHAR_RE.test(ch.text)) mathCharGlyphs++;
    if (!(cp >= 33 && cp <= 127 || cp >= 161 && !(cp >= 57344 && cp <= 63743))) continue;
    printableVisNonBroken++;
    if (ch.y >= bodyTop && ch.y <= bodyBottom) bodyReadableChars++;
  }
  const pageHasMath = mathFontGlyphs >= 8 || mathCharGlyphs >= 6 && mathCharGlyphs >= printableVisNonBroken * 8e-4;
  const graphicsHeavy = contentStreamText.length > GRAPHICS_HEAVY_STREAM_BYTES;
  const imagePlacements = [];
  const pathPlacements = [];
  const paths = graphicsHeavy ? [] : parsePagePaths(objText, objCache, tokens, { imagePlacements, pathPlacements, initialCtm });
  if (rotate === 90 || rotate === 180 || rotate === 270) {
    const [a, b, c, d, e, f] = initialCtm;
    for (const path of paths) {
      for (const cmd of path.commands) {
        if (cmd.type === "Z") continue;
        if (cmd.type === "C") {
          const x1 = a * cmd.x1 + c * cmd.y1 + e + boxOriginX;
          cmd.y1 = b * cmd.x1 + d * cmd.y1 + f + boxOriginY;
          cmd.x1 = x1;
          const x2 = a * cmd.x2 + c * cmd.y2 + e + boxOriginX;
          cmd.y2 = b * cmd.x2 + d * cmd.y2 + f + boxOriginY;
          cmd.x2 = x2;
        }
        const x = a * cmd.x + c * cmd.y + e + boxOriginX;
        cmd.y = b * cmd.x + d * cmd.y + f + boxOriginY;
        cmd.x = x;
      }
    }
  }
  if (graphicsHeavy) {
    let ctmH = initialCtm.slice();
    const ctmStackH = [];
    const numsH = [];
    const imageObjNumsH = /* @__PURE__ */ new Map();
    findFormXObjects(objText, objCache, imageObjNumsH);
    let lastNameH = null;
    for (const t of tokens) {
      if (t.type === "number") {
        numsH.push(t.value);
        continue;
      }
      if (t.type === "name") {
        lastNameH = t.value;
        numsH.length = 0;
        continue;
      }
      if (t.type === "inlineImage" || t.type === "operator" && t.value === "Do") {
        const corners = [
          [ctmH[4], ctmH[5]],
          [ctmH[0] + ctmH[4], ctmH[1] + ctmH[5]],
          [ctmH[2] + ctmH[4], ctmH[3] + ctmH[5]],
          [ctmH[0] + ctmH[2] + ctmH[4], ctmH[1] + ctmH[3] + ctmH[5]]
        ];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const [px, py] of corners) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
        const placementH = {
          left: minX,
          bottom: minY,
          right: maxX,
          top: maxY
        };
        if (t.type === "operator" && lastNameH !== null && imageObjNumsH.has(lastNameH)) placementH.objNum = imageObjNumsH.get(lastNameH);
        imagePlacements.push(placementH);
        lastNameH = null;
        numsH.length = 0;
        continue;
      }
      if (t.type !== "operator") {
        lastNameH = null;
        numsH.length = 0;
        continue;
      }
      if (t.value === "q") ctmStackH.push(ctmH.slice());
      else if (t.value === "Q") {
        if (ctmStackH.length > 0) ctmH = ctmStackH.pop();
      } else if (t.value === "cm" && numsH.length >= 6) {
        const nh = numsH.length;
        const a = numsH[nh - 6];
        const b = numsH[nh - 5];
        const c = numsH[nh - 4];
        const d = numsH[nh - 3];
        const e = numsH[nh - 2];
        const fv = numsH[nh - 1];
        ctmH = [
          a * ctmH[0] + b * ctmH[2],
          a * ctmH[1] + b * ctmH[3],
          c * ctmH[0] + d * ctmH[2],
          c * ctmH[1] + d * ctmH[3],
          e * ctmH[0] + fv * ctmH[2] + ctmH[4],
          e * ctmH[1] + fv * ctmH[3] + ctmH[5]
        ];
      }
      lastNameH = null;
      numsH.length = 0;
    }
  }
  const mergedPlacements = [];
  const placementCols = /* @__PURE__ */ new Map();
  for (const p of imagePlacements) {
    const key = `${Math.round(p.left * 2)}_${Math.round((p.right - p.left) * 2)}`;
    if (!placementCols.has(key)) placementCols.set(key, []);
    placementCols.get(key).push(p);
  }
  const placementSite = (p) => {
    const site = {
      left: p.left,
      bottom: p.bottom,
      right: p.right,
      top: p.top
    };
    if (p.objNum !== void 0) site.objNum = p.objNum;
    return site;
  };
  const mergedFrom = (p) => ({
    left: p.left,
    bottom: p.bottom,
    right: p.right,
    top: p.top,
    sites: [placementSite(p)]
  });
  for (const group of placementCols.values()) {
    group.sort((a, b) => b.top - a.top);
    let cur = mergedFrom(group[0]);
    for (let gi = 1; gi < group.length; gi++) {
      const nxt = group[gi];
      if (cur.bottom - nxt.top <= 1.5) {
        if (nxt.bottom < cur.bottom) cur.bottom = nxt.bottom;
        cur.sites.push(placementSite(nxt));
      } else {
        mergedPlacements.push(cur);
        cur = mergedFrom(nxt);
      }
    }
    mergedPlacements.push(cur);
  }
  const pageAreaPts = visualWidthPts * visualHeightPts;
  let largestImageFrac = 0;
  for (const p of mergedPlacements) {
    const frac = Math.abs((p.right - p.left) * (p.top - p.bottom)) / pageAreaPts;
    if (frac > largestImageFrac) largestImageFrac = frac;
  }
  largestImageFrac = Math.round(largestImageFrac * 1e4) / 1e4;
  let imageTextCandidates = 0;
  for (const p of mergedPlacements) {
    const w = Math.abs(p.right - p.left);
    const h = Math.abs(p.top - p.bottom);
    if (!(h >= PATH_TEXT_H_MIN && h <= PATH_TEXT_H_MAX)) continue;
    if (w < h * 4) continue;
    const pxLeft = p.left * scale;
    const pxRight = p.right * scale;
    const pxTop = (visualHeightPts - p.top) * scale;
    const pxBottom = (visualHeightPts - p.bottom) * scale;
    let coveredWidth = 0;
    for (const ch of chars) {
      const cx = ch.x + ch.width / 2;
      if (cx < pxLeft || cx > pxRight) continue;
      const chTop = ch.y - ch.fontSize * 0.8;
      const chBottom = ch.y + ch.fontSize * 0.2;
      const overlap = Math.min(chBottom, pxBottom) - Math.max(chTop, pxTop);
      if (overlap < (chBottom - chTop) * 0.5) continue;
      coveredWidth += ch.width;
    }
    if (coveredWidth >= (pxRight - pxLeft) * 0.3) continue;
    imageTextCandidates++;
  }
  let pathTextCandidates = 0;
  for (const path of paths) {
    if (!path.fill) continue;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let hasCurve = false;
    for (const cmd of path.commands) {
      if (cmd.type === "C") {
        hasCurve = true;
        if (cmd.x1 < minX) minX = cmd.x1;
        if (cmd.x1 > maxX) maxX = cmd.x1;
        if (cmd.y1 < minY) minY = cmd.y1;
        if (cmd.y1 > maxY) maxY = cmd.y1;
        if (cmd.x2 < minX) minX = cmd.x2;
        if (cmd.x2 > maxX) maxX = cmd.x2;
        if (cmd.y2 < minY) minY = cmd.y2;
        if (cmd.y2 > maxY) maxY = cmd.y2;
      }
      if (cmd.type === "M" || cmd.type === "L" || cmd.type === "C") {
        if (cmd.x < minX) minX = cmd.x;
        if (cmd.x > maxX) maxX = cmd.x;
        if (cmd.y < minY) minY = cmd.y;
        if (cmd.y > maxY) maxY = cmd.y;
      }
    }
    const h = maxY - minY;
    if (!(h >= PATH_TEXT_H_MIN && h <= PATH_TEXT_H_MAX)) continue;
    let allRect = !hasCurve;
    if (allRect) {
      let sub = [];
      const subpaths = [];
      for (const cmd of path.commands) {
        if (cmd.type === "M") {
          if (sub.length > 0) subpaths.push(sub);
          sub = [[cmd.x, cmd.y]];
        } else if (cmd.type === "L") sub.push([cmd.x, cmd.y]);
      }
      if (sub.length > 0) subpaths.push(sub);
      for (const pts of subpaths) {
        if (pts.length < 4 || pts.length > 5) {
          allRect = false;
          break;
        }
        for (let si = 0; si < pts.length; si++) {
          const [x1, y1] = pts[si];
          const [x2, y2] = pts[(si + 1) % pts.length];
          if (Math.abs(x2 - x1) > 0.01 && Math.abs(y2 - y1) > 0.01) {
            allRect = false;
            break;
          }
        }
        if (!allRect) break;
      }
    }
    if (allRect) continue;
    pathTextCandidates++;
  }
  const pageStats = {
    largestImageFrac,
    invisibleTextChars: charStats.printable - charStats.printableVis,
    visibleChars: charStats.visibleAll,
    visibleReadableChars: printableVisNonBroken,
    bodyReadableChars,
    printableVis: charStats.printableVis,
    control: charStats.control,
    controlVis: charStats.controlVis,
    pathTextCandidates,
    imageTextCandidates,
    longestBrokenRun,
    pageSize: [Math.round(visualWidthPts), Math.round(visualHeightPts)]
  };
  const underlineRects = [];
  const fillSquares = [];
  const fillMarks = [];
  let fillMarksOverflow = false;
  const pushFillMark = (x0, y0, x1, y1) => {
    const mw = x1 - x0;
    const mh = y1 - y0;
    if (!(mw > 0.2) || !(mh > 0.2) || mw > 50 || mh > 50) return;
    if (Math.min(mw, mh) < 1.5 && Math.max(mw, mh) > 10) return;
    if (fillMarks.length >= 500) {
      fillMarksOverflow = true;
      return;
    }
    fillMarks.push({
      left: (x0 - boxOriginX) * scale,
      top: (visualHeightPts - (y1 - boxOriginY)) * scale,
      right: (x1 - boxOriginX) * scale,
      bottom: (visualHeightPts - (y0 - boxOriginY)) * scale
    });
  };
  for (const path of paths) {
    if (!path.fill && !path.stroke) continue;
    const lineColor = path.stroke ? path.strokeColor : path.fillColor;
    const fc = path.fill ? path.fillColor : null;
    let inkFill = false;
    if (fc) {
      const cs = path.fillColorSpace || "";
      if (fc.length === 4) inkFill = Math.max(...fc) > 0.15;
      else if (fc.length === 1) inkFill = cs === "gray" ? fc[0] < 0.85 : fc[0] > 0.15;
      else if (fc.length === 3) inkFill = fc.some((v) => v > 1.5) ? fc[0] < 85 : Math.min(...fc) < 0.85;
    }
    const drawsInk = !!path.stroke || inkFill;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let hasCurve = false;
    let fMinX = Infinity;
    let fMaxX = -Infinity;
    let fMinY = Infinity;
    let fMaxY = -Infinity;
    for (const cmd of path.commands) {
      if (cmd.type === "C") {
        hasCurve = true;
        for (const [cx, cy] of [[cmd.x1, cmd.y1], [cmd.x2, cmd.y2], [cmd.x, cmd.y]]) {
          if (cx < fMinX) fMinX = cx;
          if (cx > fMaxX) fMaxX = cx;
          if (cy < fMinY) fMinY = cy;
          if (cy > fMaxY) fMaxY = cy;
        }
      }
      if (cmd.type === "M" || cmd.type === "L") {
        if (cmd.x < minX) minX = cmd.x;
        if (cmd.x > maxX) maxX = cmd.x;
        if (cmd.y < minY) minY = cmd.y;
        if (cmd.y > maxY) maxY = cmd.y;
        if (cmd.x < fMinX) fMinX = cmd.x;
        if (cmd.x > fMaxX) fMaxX = cmd.x;
        if (cmd.y < fMinY) fMinY = cmd.y;
        if (cmd.y > fMaxY) fMaxY = cmd.y;
      }
    }
    const w = maxX - minX;
    const h = maxY - minY;
    if (h < 2 && w > 10) {
      underlineRects.push({
        left: (minX - boxOriginX) * scale,
        right: (maxX - boxOriginX) * scale,
        y: (visualHeightPts - (maxY - boxOriginY)) * scale,
        color: lineColor
      });
      continue;
    }
    if (hasCurve) {
      if (drawsInk) pushFillMark(fMinX, fMinY, fMaxX, fMaxY);
      continue;
    }
    const subpaths = [];
    for (const cmd of path.commands) {
      if (cmd.type === "M") subpaths.push([[cmd.x, cmd.y]]);
      else if (cmd.type === "L" && subpaths.length) subpaths[subpaths.length - 1].push([cmd.x, cmd.y]);
    }
    for (const pts of subpaths) {
      let sMinX = Infinity;
      let sMaxX = -Infinity;
      let sMinY = Infinity;
      let sMaxY = -Infinity;
      for (const [px, py] of pts) {
        if (px < sMinX) sMinX = px;
        if (px > sMaxX) sMaxX = px;
        if (py < sMinY) sMinY = py;
        if (py > sMaxY) sMaxY = py;
      }
      let rect = pts.length >= 4 && pts.length <= 5;
      if (rect) {
        for (let si = 0; si < pts.length; si++) {
          const [x1, y1] = pts[si];
          const [x2, y2] = pts[(si + 1) % pts.length];
          if (Math.abs(x2 - x1) > 0.01 && Math.abs(y2 - y1) > 0.01) {
            rect = false;
            break;
          }
        }
      }
      if (!rect) {
        if (drawsInk) pushFillMark(sMinX, sMinY, sMaxX, sMaxY);
        continue;
      }
      const sw = sMaxX - sMinX;
      const sh = sMaxY - sMinY;
      if (sh < 2 && sw > 10) {
        underlineRects.push({
          left: (sMinX - boxOriginX) * scale,
          right: (sMaxX - boxOriginX) * scale,
          y: (visualHeightPts - (sMaxY - boxOriginY)) * scale,
          color: lineColor
        });
      } else if (sw >= 5 && sw <= 24 && sh >= 5 && sh <= 24 && sw / sh > 0.7 && sw / sh < 1.43 && fillSquares.length < 200 && !inkFill) {
        fillSquares.push({
          left: (sMinX - boxOriginX) * scale,
          top: (visualHeightPts - (sMaxY - boxOriginY)) * scale,
          right: (sMaxX - boxOriginX) * scale,
          bottom: (visualHeightPts - (sMinY - boxOriginY)) * scale,
          stroke: !!path.stroke
        });
      } else if (inkFill) {
        pushFillMark(sMinX, sMinY, sMaxX, sMaxY);
      }
    }
  }
  const squaresByKey = /* @__PURE__ */ new Map();
  for (const sq of fillSquares) {
    const key = `${Math.round(sq.left)},${Math.round(sq.top)},${Math.round(sq.right)},${Math.round(sq.bottom)}`;
    const prev = squaresByKey.get(key);
    if (prev) prev.stroke = prev.stroke || sq.stroke;
    else squaresByKey.set(key, sq);
  }
  const fillSquaresDeduped = [...squaresByKey.values()];
  const fillImages = [];
  const placementToPagePx = (p) => ({
    left: p.left * scale,
    top: (visualHeightPts - p.top) * scale,
    right: p.right * scale,
    bottom: (visualHeightPts - p.bottom) * scale
  });
  for (const p of mergedPlacements) {
    if (fillImages.length >= 100) break;
    const entry = placementToPagePx(p);
    entry.sites = p.sites.map((s) => {
      const site = placementToPagePx(s);
      if (s.objNum !== void 0) site.objNum = s.objNum;
      return site;
    });
    fillImages.push(entry);
  }
  let fillPaths = [];
  const fillPathsByKey = /* @__PURE__ */ new Map();
  for (const p of pathPlacements) {
    const site = placementToPagePx(p);
    site.paint = p.paint;
    site.commands = p.commands;
    const key = `${Math.round(site.left)},${Math.round(site.top)},${Math.round(site.right)},${Math.round(site.bottom)}`;
    const prev = fillPathsByKey.get(key);
    if (prev) {
      prev.sites.push(site);
    } else {
      const entry = {
        left: site.left,
        top: site.top,
        right: site.right,
        bottom: site.bottom,
        sites: [site]
      };
      fillPathsByKey.set(key, entry);
      fillPaths.push(entry);
    }
  }
  let fillPathsIneligible = graphicsHeavy;
  if (fillPaths.length > PATH_PLACEMENT_CAP) {
    fillPaths = [];
    fillPathsIneligible = true;
  }
  const {
    pageObj,
    langSet,
    fontSet,
    wordSignals,
    nativeText,
    dataTablePage,
    provisionalTables,
    fillGlyphBoxes
  } = groupCharsIntoPage(chars, n, pageWidth, pageHeight, underlineRects, paths, scale, visualHeightPts, boxOriginX, boxOriginY, pageHasMath, glyphOpMap);
  pageObj.rules = underlineRects.filter((r) => !r.isUnderline).map((r) => ({ y: r.y, left: r.left, right: r.right }));
  const {
    highlights: highlightsRaw,
    freeTexts: freeTextsRaw,
    textAnnots: textAnnotsRaw,
    shapes: shapesRaw,
    redacts: redactsRaw,
    links: linksRaw,
    widgets: widgetsRaw
  } = extractPdfAnnotations(objCache, objText);
  const mapPoint = (x, y) => {
    const cx = initialCtm[0] * x + initialCtm[2] * y + initialCtm[4];
    const cy = initialCtm[1] * x + initialCtm[3] * y + initialCtm[5];
    return { x: cx * scale, y: (visualHeightPts - cy) * scale };
  };
  const linkAnnots = [];
  if (linksRaw.length > 0) {
    const uriBoxes = [];
    for (const l of linksRaw) {
      const p1 = mapPoint(l.rect[0], l.rect[1]);
      const p2 = mapPoint(l.rect[2], l.rect[3]);
      const bbox = {
        left: Math.min(p1.x, p2.x),
        top: Math.min(p1.y, p2.y),
        right: Math.max(p1.x, p2.x),
        bottom: Math.max(p1.y, p2.y)
      };
      if (l.uri) {
        linkAnnots.push({ type: "link", bbox, uri: l.uri });
        uriBoxes.push({ ...bbox, uri: l.uri });
      } else if (l.annotText && destInfo) {
        if (!destInfo.nameDests) {
          const catalogObjNum = findRootObjNum(objCache.pdfBytes);
          const catalogText = catalogObjNum && objCache.getObjectText(catalogObjNum) || "";
          destInfo.nameDests = buildNameDests(objCache, catalogText);
        }
        const { dest } = resolveItemDest(l.annotText, destInfo.nameDests, destInfo.objNumToIndex, objCache);
        if (dest) {
          setDestYFrac(dest, destInfo.pages[dest.pageIndex]);
          linkAnnots.push({ type: "link", bbox, dest });
        }
      }
    }
    if (uriBoxes.length > 0) {
      for (const line of pageObj.lines) {
        for (const word of line.words) {
          const cx = (word.bbox.left + word.bbox.right) / 2;
          const cy = (word.bbox.top + word.bbox.bottom) / 2;
          const hit = uriBoxes.find((b) => cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom);
          if (hit) word.style.link = hit.uri;
        }
      }
    }
  }
  const annotations = highlightsRaw.map((raw) => pdfHighlightToAnnotation(raw, {
    scale,
    visualHeightPts,
    initialCtm,
    groupId: `_pdf_p${n}_a${raw.objNum}`
  }));
  for (const raw of freeTextsRaw) {
    annotations.push(pdfFreeTextToAnnotation(raw, { scale, visualHeightPts, initialCtm }));
  }
  for (const raw of textAnnotsRaw) {
    annotations.push(pdfTextAnnotToAnnotation(raw, { scale, visualHeightPts, initialCtm }));
  }
  for (const raw of shapesRaw) {
    annotations.push(pdfShapeToAnnotation(raw, { scale, visualHeightPts, initialCtm }));
  }
  for (const raw of redactsRaw) {
    annotations.push(...pdfRedactToAnnotations(raw, {
      scale,
      visualHeightPts,
      initialCtm,
      groupId: `_pdf_p${n}_a${raw.objNum}`
    }));
  }
  annotations.push(...linkAnnots);
  let fieldIdx = 0;
  for (const w of widgetsRaw) {
    const p1 = mapPoint(w.rect[0], w.rect[1]);
    const p2 = mapPoint(w.rect[2], w.rect[3]);
    const bbox = {
      left: Math.round(Math.min(p1.x, p2.x)),
      top: Math.round(Math.min(p1.y, p2.y)),
      right: Math.round(Math.max(p1.x, p2.x)),
      bottom: Math.round(Math.max(p1.y, p2.y))
    };
    let fieldType = "text";
    if (w.ft === "Ch") fieldType = "choice";
    else if (w.ft === "Sig") fieldType = "signature";
    else if (w.ft === "Btn") {
      if (w.ff & 65536) fieldType = "button";
      else if (w.ff & 32768) fieldType = "radio";
      else fieldType = "checkbox";
    }
    const field = {
      type: "field",
      fieldType,
      name: w.name,
      bbox,
      value: w.value,
      srcRef: w.objNum
    };
    if (w.ff & 1) field.readOnly = true;
    if (w.ff & 2) field.required = true;
    if (w.ft === "Tx" && w.ff & 4096) field.multiline = true;
    if (w.ft === "Tx" && w.ff & 16777216) field.comb = true;
    if (field.comb && w.maxLen) field.maxLen = w.maxLen;
    if (w.signed) field.signed = true;
    if (w.flags & 2 || w.flags & 32) field.hidden = true;
    if (w.quadding) field.quadding = w.quadding;
    if (w.da) field.da = w.da;
    if (w.onState != null && (fieldType === "checkbox" || fieldType === "radio")) field.onState = w.onState;
    if (w.options != null && fieldType === "choice") field.options = w.options;
    annotations.push(field);
    if (w.flags & 2 || w.flags & 32) continue;
    if (!(w.ft === "Tx" || w.ft === "Ch") || !w.value || w.value.trim().length === 0) continue;
    const rectW = Math.abs(w.rect[2] - w.rect[0]);
    const rectH = Math.abs(w.rect[3] - w.rect[1]);
    if (rectW <= 0 || rectH <= 0) continue;
    const llx = Math.min(w.rect[0], w.rect[2]);
    const lly = Math.min(w.rect[1], w.rect[3]);
    const layout = layoutFieldValue(w.value, rectW, rectH, {
      multiline: !!field.multiline,
      comb: !!field.comb,
      maxLen: w.maxLen,
      quadding: w.quadding,
      da: w.da
    });
    fieldIdx++;
    const asc = layout.fontSize * 0.8;
    const desc = layout.fontSize * 0.2;
    let liftLineIdx = 0;
    for (const ll of layout.lines) {
      if (ll.words.length === 0) continue;
      liftLineIdx++;
      const wordSpecs = ll.words.map((lw) => {
        const pa = mapPoint(llx + lw.x0, lly + ll.y + asc);
        const pb = mapPoint(llx + lw.x1, lly + ll.y - desc);
        return {
          text: lw.text,
          bbox: {
            left: Math.round(Math.min(pa.x, pb.x)),
            top: Math.round(Math.min(pa.y, pb.y)),
            right: Math.round(Math.max(pa.x, pb.x)),
            bottom: Math.round(Math.max(pa.y, pb.y))
          }
        };
      });
      const lineBbox = {
        left: Math.min(...wordSpecs.map((s) => s.bbox.left)),
        top: Math.min(...wordSpecs.map((s) => s.bbox.top)),
        right: Math.max(...wordSpecs.map((s) => s.bbox.right)),
        bottom: Math.max(...wordSpecs.map((s) => s.bbox.bottom))
      };
      const baseP = mapPoint(llx + ll.x, lly + ll.y);
      const lineObj = new ocr.OcrLine(pageObj, lineBbox, [0, Math.round(baseP.y) - lineBbox.bottom], asc * scale, null);
      for (let wi = 0; wi < wordSpecs.length; wi++) {
        const wordID = `word_${n + 1}_f${fieldIdx}_${liftLineIdx}_${wi + 1}`;
        const wordObj = new ocr.OcrWord(lineObj, wordID, wordSpecs[wi].text, wordSpecs[wi].bbox);
        wordObj.conf = 100;
        wordObj.visualCoords = false;
        wordObj.lang = calcLang(wordSpecs[wi].text);
        langSet.add(wordObj.lang);
        wordObj.style.font = "Helvetica";
        wordObj.style.size = round3(layout.fontSize * scale);
        lineObj.words.push(wordObj);
      }
      pageStats.printableVis += wordSpecs.reduce((acc, s) => acc + s.text.length, 0);
      const insertAt = pageObj.lines.findIndex((l) => l.bbox.top > lineBbox.top);
      if (insertAt === -1) pageObj.lines.push(lineObj);
      else pageObj.lines.splice(insertAt, 0, lineObj);
    }
  }
  return {
    pageObj,
    langSet,
    fontSet,
    wordSignals,
    nativeText,
    dataTablePage,
    provisionalTables,
    pageStats,
    annotations,
    fillSquares: fillSquaresDeduped,
    fillMarks,
    fillMarksOverflow,
    fillImages,
    fillPaths,
    fillPathsIneligible,
    fillGlyphBoxes
  };
}
function executeRewrittenOperator(glyphOpMap, op, text, extraFonts, scale) {
  const stream = glyphOpMap.streams[op.streamIdx];
  const run = {
    stream: op.stream,
    streams: [{ ...stream, dos: [] }],
    ops: [],
    glyphs: [],
    pageHeightPts: glyphOpMap.pageHeightPts
  };
  const fonts = extraFonts.size > 0 ? new Map([...stream.fonts, ...extraFonts]) : stream.fonts;
  const extGStates = new Map(stream.extGStates);
  extGStates.set("GSpreview", { fillAlpha: op.fillAlpha });
  const lineOp = op.op === "'" || op.op === '"';
  const preamble = [
    "BT",
    `${(lineOp ? op.tlm : op.tm).map(formatPdfNumber).join(" ")} Tm`,
    lineOp ? `${formatPdfNumber(op.tl)} TL` : "",
    `${formatPdfNumber(op.tc)} Tc ${formatPdfNumber(op.tw)} Tw ${formatPdfNumber(op.tz)} Tz ${formatPdfNumber(op.trise)} Ts ${op.tr} Tr`,
    op.fontTag ? `/${op.fontTag} ${formatPdfNumber(op.fontSize)} Tf` : "",
    op.fillColorSrc,
    op.strokeColorSrc,
    `${formatPdfNumber(op.lineWidth)} w /GSpreview gs`
  ].join("\n");
  const tokens = tokenizeContentStream(`${preamble}
${text}
ET`);
  const chars = executeTextOperators(tokens, fonts, scale, glyphOpMap.pageHeightPts, op.ctm, extGStates, void 0, stream.colorSpaces, run, op.visible);
  return { chars, ops: run.ops };
}
function executeTextOperators(tokens, fonts, scale, pageHeightPts, initialCtm, extGStates, inheritedTextState, colorSpaces, glyphOpMap = null, initialVisible = null) {
  const chars = (
    /** @type {Array<PositionedChar>} */
    []
  );
  const streamIdx = glyphOpMap ? glyphOpMap.streams.length - 1 : -1;
  let visible = initialVisible ? initialVisible.slice() : null;
  let path = null;
  let pendingClip = false;
  const addPathPoint = (x, y) => {
    const px = ctm[0] * x + ctm[2] * y + ctm[4];
    const py = ctm[1] * x + ctm[3] * y + ctm[5];
    if (!path) path = [px, py, px, py];
    else {
      path[0] = Math.min(path[0], px);
      path[1] = Math.min(path[1], py);
      path[2] = Math.max(path[2], px);
      path[3] = Math.max(path[3], py);
    }
  };
  let currentFontTag = null;
  let ctm = initialCtm ? initialCtm.slice() : [1, 0, 0, 1, 0, 0];
  let tr = 0;
  let textColor = [0];
  let fillTintCS = null;
  let fillAlpha = 1;
  let strokeColor = [0];
  let strokeTintCS = null;
  let lineWidth = 1;
  let fillColorSrc = "0 g";
  let strokeColorSrc = "0 G";
  let fillCsSrc = "";
  let strokeCsSrc = "";
  const gsStack = [];
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = [1, 0, 0, 1, 0, 0];
  let currentFont = null;
  let fontSize = 12;
  let tc = inheritedTextState ? inheritedTextState.tc : 0;
  let tw = inheritedTextState ? inheritedTextState.tw : 0;
  let tz = inheritedTextState ? inheritedTextState.tz : 100;
  let tl = inheritedTextState ? inheritedTextState.tl : 0;
  let trise = inheritedTextState ? inheritedTextState.trise : 0;
  const operandStack = [];
  const mcStack = [];
  let artifactDepth = inheritedTextState && inheritedTextState.artifact ? 1 : 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type !== "operator") {
      operandStack.push(tok);
      continue;
    }
    const op = tok.value;
    const charsBeforeOp = chars.length;
    switch (op) {
      // Graphics state operators
      case "q":
        gsStack.push({
          ctm: ctm.slice(),
          tr,
          tc,
          tw,
          tz,
          tl,
          trise,
          fontSize,
          currentFont,
          currentFontTag,
          textColor: textColor.slice(),
          fillAlpha,
          fillTintCS,
          strokeColor: strokeColor.slice(),
          strokeTintCS,
          lineWidth,
          fillColorSrc,
          strokeColorSrc,
          fillCsSrc,
          strokeCsSrc,
          visible: visible ? visible.slice() : null
        });
        operandStack.length = 0;
        break;
      case "Q":
        if (gsStack.length > 0) {
          const saved = (
            /** @type {NonNullable<ReturnType<typeof gsStack.pop>>} */
            gsStack.pop()
          );
          ctm = saved.ctm;
          tr = saved.tr;
          tc = saved.tc;
          tw = saved.tw;
          tz = saved.tz;
          tl = saved.tl;
          trise = saved.trise;
          fontSize = saved.fontSize;
          currentFont = saved.currentFont;
          currentFontTag = saved.currentFontTag;
          textColor = saved.textColor;
          fillAlpha = saved.fillAlpha;
          fillTintCS = saved.fillTintCS;
          strokeColor = saved.strokeColor;
          strokeTintCS = saved.strokeTintCS;
          lineWidth = saved.lineWidth;
          fillColorSrc = saved.fillColorSrc;
          strokeColorSrc = saved.strokeColorSrc;
          fillCsSrc = saved.fillCsSrc;
          strokeCsSrc = saved.strokeCsSrc;
          visible = saved.visible;
        }
        operandStack.length = 0;
        break;
      case "cm": {
        if (operandStack.length >= 6) {
          const m = operandStack.slice(operandStack.length - 6).map((t) => t.value);
          ctm = matMul(m, ctm);
        }
        operandStack.length = 0;
        break;
      }
      // Text object operators
      case "BT":
        tm = [1, 0, 0, 1, 0, 0];
        tlm = [1, 0, 0, 1, 0, 0];
        operandStack.length = 0;
        break;
      case "ET":
        operandStack.length = 0;
        break;
      case "BDC":
      case "BMC": {
        const tagTok = operandStack[0];
        const tag = tagTok && tagTok.type === "name" ? tagTok.value : "";
        const propsTok = operandStack[1];
        let mcid = null;
        if (propsTok && propsTok.type === "dict" && typeof propsTok.value === "string") {
          const mm = /\/MCID\s+(\d+)/.exec(propsTok.value);
          if (mm) mcid = parseInt(mm[1], 10);
        }
        const art = tag === "Artifact";
        mcStack.push({ tag, mcid, art });
        if (art) artifactDepth++;
        operandStack.length = 0;
        break;
      }
      case "EMC": {
        const popped = mcStack.pop();
        if (popped && popped.art && artifactDepth > 0) artifactDepth--;
        operandStack.length = 0;
        break;
      }
      case "Tf": {
        const size = operandStack.length >= 2 ? operandStack[operandStack.length - 1] : null;
        const name = operandStack.length >= 2 ? operandStack[operandStack.length - 2] : null;
        if (name && name.type === "name" && size && size.type === "number") {
          currentFontTag = decodePdfName(name.value);
          currentFont = fonts.get(currentFontTag) || null;
          fontSize = size.value;
        }
        operandStack.length = 0;
        break;
      }
      case "Tc":
        if (operandStack.length >= 1) tc = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Tw":
        if (operandStack.length >= 1) tw = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Tz":
        if (operandStack.length >= 1) tz = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "TL":
        if (operandStack.length >= 1) tl = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Tr":
        if (operandStack.length >= 1) tr = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Ts":
        if (operandStack.length >= 1) trise = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Tm": {
        if (operandStack.length >= 6) {
          tm = operandStack.slice(operandStack.length - 6).map((t) => t.value);
          tlm = tm.slice();
        }
        operandStack.length = 0;
        break;
      }
      case "Td": {
        if (operandStack.length >= 2) {
          const tx = operandStack[operandStack.length - 2].value;
          const ty = operandStack[operandStack.length - 1].value;
          tlm = [
            tlm[0],
            tlm[1],
            tlm[2],
            tlm[3],
            tx * tlm[0] + ty * tlm[2] + tlm[4],
            tx * tlm[1] + ty * tlm[3] + tlm[5]
          ];
          tm = tlm.slice();
        }
        operandStack.length = 0;
        break;
      }
      case "TD": {
        if (operandStack.length >= 2) {
          const tx = operandStack[operandStack.length - 2].value;
          const ty = operandStack[operandStack.length - 1].value;
          tl = -ty;
          tlm = [
            tlm[0],
            tlm[1],
            tlm[2],
            tlm[3],
            tx * tlm[0] + ty * tlm[2] + tlm[4],
            tx * tlm[1] + ty * tlm[3] + tlm[5]
          ];
          tm = tlm.slice();
        }
        operandStack.length = 0;
        break;
      }
      case "T*": {
        const tx = 0;
        const ty = -tl;
        tlm = [
          tlm[0],
          tlm[1],
          tlm[2],
          tlm[3],
          tx * tlm[0] + ty * tlm[2] + tlm[4],
          tx * tlm[1] + ty * tlm[3] + tlm[5]
        ];
        tm = tlm.slice();
        operandStack.length = 0;
        break;
      }
      case "Tj":
      case "TJ":
      case "'":
      case '"': {
        const showOp = glyphOpMap ? {
          stream: glyphOpMap.stream,
          streamIdx,
          tokIdx: i,
          start: operandStack.length > 0 && typeof operandStack[0].start === "number" ? operandStack[0].start : tok.start,
          end: tok.start + op.length,
          op,
          tm: tm.slice(),
          tlm: tlm.slice(),
          ctm: ctm.slice(),
          tc,
          tw,
          tz,
          tl,
          trise,
          tr,
          fontTag: currentFontTag,
          fontObjNum: currentFont && Number.isFinite(currentFont.fontObjNum) ? currentFont.fontObjNum : null,
          fontSize,
          font: currentFont,
          textColor: textColor.slice(),
          strokeColor: strokeColor.slice(),
          lineWidth,
          fillAlpha,
          fillColorSrc,
          strokeColorSrc,
          tmAfter: tm,
          tlmAfter: tlm,
          visible: visible ? visible.slice() : null
        } : null;
        const opIdx = glyphOpMap ? glyphOpMap.ops.length : -1;
        if (op === "'" || op === '"') {
          if (op === '"' && operandStack.length >= 3) {
            tw = operandStack[operandStack.length - 3].value;
            tc = operandStack[operandStack.length - 2].value;
            if (showOp) {
              showOp.tc = tc;
              showOp.tw = tw;
            }
          }
          tlm = [tlm[0], tlm[1], tlm[2], tlm[3], -tl * tlm[2] + tlm[4], -tl * tlm[3] + tlm[5]];
          tm = tlm.slice();
        }
        if (operandStack.length >= 1 && currentFont) {
          const operand = operandStack[operandStack.length - 1];
          const elems = op === "TJ" ? operand.type === "array" ? operand.value : [] : [operand];
          for (let ei = 0; ei < elems.length; ei++) {
            const elem = elems[ei];
            if (elem.type === "hexstring") {
              showHexString(elem.value, currentFont, fontSize, tm, ctm, tc, tw, tz, tr, trise, chars, scale, pageHeightPts, opIdx, ei);
            } else if (elem.type === "string") {
              showLiteralString(elem.value, currentFont, fontSize, tm, ctm, tc, tw, tz, tr, trise, chars, scale, pageHeightPts, opIdx, ei);
            } else if (elem.type === "number") {
              const adjustment = elem.value / 1e3 * fontSize * tz / 100;
              tm[4] -= adjustment * tm[0];
              tm[5] -= adjustment * tm[1];
            }
          }
        }
        if (showOp) {
          showOp.tmAfter = tm.slice();
          showOp.tlmAfter = tlm.slice();
          glyphOpMap.ops.push(showOp);
        }
        operandStack.length = 0;
        break;
      }
      // These operators also select a device color space, deselecting any named color space chosen by `cs`.
      case "g":
      case "rg":
      case "k":
        textColor = operandStack.map((t) => t.value);
        fillTintCS = null;
        if (glyphOpMap) {
          fillColorSrc = `${operandStack.map(serializeContentToken).join(" ")} ${op}`;
          fillCsSrc = "";
        }
        operandStack.length = 0;
        break;
      case "G":
      case "RG":
      case "K":
        strokeColor = operandStack.map((t) => t.value);
        strokeTintCS = null;
        if (glyphOpMap) {
          strokeColorSrc = `${operandStack.map(serializeContentToken).join(" ")} ${op}`;
          strokeCsSrc = "";
        }
        operandStack.length = 0;
        break;
      case "cs": {
        const csName = operandStack.length >= 1 ? operandStack[operandStack.length - 1].value : "";
        fillTintCS = colorSpaces && colorSpaces.get(csName) || null;
        if (glyphOpMap) {
          fillCsSrc = `${operandStack.map(serializeContentToken).join(" ")} cs`;
          fillColorSrc = fillCsSrc;
        }
        operandStack.length = 0;
        break;
      }
      case "CS": {
        const csName = operandStack.length >= 1 ? operandStack[operandStack.length - 1].value : "";
        strokeTintCS = colorSpaces && colorSpaces.get(csName) || null;
        if (glyphOpMap) {
          strokeCsSrc = `${operandStack.map(serializeContentToken).join(" ")} CS`;
          strokeColorSrc = strokeCsSrc;
        }
        operandStack.length = 0;
        break;
      }
      // Stored raw, a Separation/DeviceN component reads as gray and inverts the color (tint 1 = full ink, gray 1 = white).
      case "sc":
      case "scn": {
        let resolved = null;
        if (fillTintCS) {
          const comps = operandStack.map((t) => t.value).filter((v) => typeof v === "number");
          if (comps.length === fillTintCS.nInputs) {
            const rgb = tintComponentsToRGB(fillTintCS.tint, comps);
            if (rgb) resolved = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
          }
        }
        textColor = resolved || operandStack.map((t) => t.value);
        if (glyphOpMap) fillColorSrc = `${fillCsSrc ? `${fillCsSrc} ` : ""}${operandStack.map(serializeContentToken).join(" ")} ${op}`;
        operandStack.length = 0;
        break;
      }
      case "SC":
      case "SCN": {
        let resolved = null;
        if (strokeTintCS) {
          const comps = operandStack.map((t) => t.value).filter((v) => typeof v === "number");
          if (comps.length === strokeTintCS.nInputs) {
            const rgb = tintComponentsToRGB(strokeTintCS.tint, comps);
            if (rgb) resolved = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
          }
        }
        strokeColor = resolved || operandStack.map((t) => t.value);
        if (glyphOpMap) strokeColorSrc = `${strokeCsSrc ? `${strokeCsSrc} ` : ""}${operandStack.map(serializeContentToken).join(" ")} ${op}`;
        operandStack.length = 0;
        break;
      }
      case "w":
        if (operandStack.length >= 1) lineWidth = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      // Graphics state parameters (sets non-stroking alpha via /ca).
      case "gs": {
        if (operandStack.length >= 1 && extGStates) {
          const nameTok = operandStack[operandStack.length - 1];
          if (nameTok && nameTok.type === "name") {
            const entry = extGStates.get(nameTok.value);
            if (entry && entry.fillAlpha !== null && entry.fillAlpha !== void 0) {
              fillAlpha = entry.fillAlpha;
            }
          }
        }
        operandStack.length = 0;
        break;
      }
      // Path construction, clipping and Do, kept only for a glyph-op map.
      // The region an operator paints into is the page box cut down by the clips in force.
      case "m":
      case "l":
        if (visible && operandStack.length >= 2) addPathPoint(operandStack[operandStack.length - 2].value, operandStack[operandStack.length - 1].value);
        operandStack.length = 0;
        break;
      case "c":
      case "v":
      case "y":
        if (visible) for (let k = 0; k + 1 < operandStack.length; k += 2) addPathPoint(operandStack[k].value, operandStack[k + 1].value);
        operandStack.length = 0;
        break;
      case "re":
        if (visible && operandStack.length >= 4) {
          const [x, y, w, h] = operandStack.slice(operandStack.length - 4).map((t) => t.value);
          addPathPoint(x, y);
          addPathPoint(x + w, y);
          addPathPoint(x + w, y + h);
          addPathPoint(x, y + h);
        }
        operandStack.length = 0;
        break;
      case "W":
      case "W*":
        pendingClip = true;
        operandStack.length = 0;
        break;
      case "n":
      case "f":
      case "F":
      case "f*":
      case "B":
      case "B*":
      case "b":
      case "b*":
      case "S":
      case "s":
        if (pendingClip && visible) {
          visible = path ? intersectRects(visible, path) : [0, 0, 0, 0];
        }
        pendingClip = false;
        path = null;
        operandStack.length = 0;
        break;
      case "Do":
        if (glyphOpMap && operandStack.length >= 1) glyphOpMap.streams[streamIdx].dos.push({ name: operandStack[operandStack.length - 1].value, visible: visible ? visible.slice() : null });
        operandStack.length = 0;
        break;
      default:
        operandStack.length = 0;
        break;
    }
    if (op === "Tj" || op === "TJ" || op === "'" || op === '"') {
      const inArtifact = artifactDepth > 0;
      let structTag = null;
      let mcid = null;
      for (let s = mcStack.length - 1; s >= 0; s--) {
        if (STRUCTURAL_MC_TAGS.has(mcStack[s].tag)) {
          structTag = mcStack[s].tag;
          mcid = mcStack[s].mcid;
          break;
        }
      }
      const stroked = tr === 1 || tr === 2;
      const strokeWidthPx = stroked ? lineWidth * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])) * scale : 0;
      const fillHidden = fillAlpha === 0 && tr !== 1 && tr !== 2 && tr !== 5 && tr !== 6;
      for (let ci = charsBeforeOp; ci < chars.length; ci++) {
        chars[ci].textColor = textColor;
        chars[ci].alpha = fillAlpha;
        if (fillHidden) chars[ci].invisible = true;
        if (stroked) {
          chars[ci].renderMode = tr;
          chars[ci].strokeWidthPx = strokeWidthPx;
          chars[ci].strokeColor = strokeColor;
        }
        if (inArtifact) chars[ci].artifact = true;
        if (structTag) {
          chars[ci].structTag = structTag;
          chars[ci].mcid = mcid;
        }
        if (glyphOpMap) glyphOpMap.glyphs.push(chars[ci]);
      }
    }
  }
  return chars;
}
function showHexString(hex, font, fontSize, tm, ctm, tc, tw, tz, tr, trise, chars, scale, pageHeightPts, opIdx = -1, elemIdx = 0) {
  let str = "";
  for (let i = 0; i + 1 <= hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  showLiteralString(str, font, fontSize, tm, ctm, tc, tw, tz, tr, trise, chars, scale, pageHeightPts, opIdx, elemIdx);
}
function showLiteralString(str, font, fontSize, tm, ctm, tc, tw, tz, tr, trise, chars, scale, pageHeightPts, opIdx = -1, elemIdx = 0) {
  const hScale = Math.hypot(tm[0] * ctm[0] + tm[1] * ctm[2], tm[0] * ctm[1] + tm[1] * ctm[3]);
  const trmA = tm[0] * ctm[0] + tm[1] * ctm[2];
  const trmB = tm[0] * ctm[1] + tm[1] * ctm[3];
  const trmC = tm[2] * ctm[0] + tm[3] * ctm[2];
  const trmD = tm[2] * ctm[1] + tm[3] * ctm[3];
  const vScale = hScale > 0 ? Math.abs(trmA * trmD - trmB * trmC) / hScale : Math.hypot(trmC, trmD);
  let byteOff = 0;
  const dirX = tm[0] * ctm[0] + tm[1] * ctm[2];
  const dirY = -(tm[0] * ctm[1] + tm[1] * ctm[3]);
  const dirMag = Math.hypot(dirX, dirY);
  let orientation = 0;
  if (dirMag > 1e-3) {
    const ndx = dirX / dirMag;
    const ndy = dirY / dirMag;
    if (Math.abs(ndx) < 0.5 && ndy >= 0.5) orientation = 1;
    else if (ndx <= -0.5 && Math.abs(ndy) < 0.5) orientation = 2;
    else if (Math.abs(ndx) < 0.5 && ndy <= -0.5) orientation = 3;
  }
  const isCID = font.type0 || font.isCIDFont;
  const csRanges = font.codespaceRanges;
  for (const { charCode, numBytes } of decodeTextCodes(str, isCID ? csRanges : null, isCID ? 2 : 1)) {
    const codeByte = byteOff;
    byteOff += numBytes;
    const toUnicodeValue = font.toUnicode.get(charCode);
    const encodingValue = font.encodingUnicode?.get(charCode);
    let unicode = toUnicodeValue || encodingValue;
    if (font.preferEncodingCase && toUnicodeValue && encodingValue && toUnicodeValue.length === 1 && encodingValue.length === 1 && /[A-Za-z]/.test(toUnicodeValue) && /[A-Za-z]/.test(encodingValue) && toUnicodeValue !== encodingValue && toUnicodeValue.toLowerCase() === encodingValue.toLowerCase()) {
      unicode = encodingValue;
    }
    let fallbackUsed = false;
    if (!unicode) {
      if (isCID && font.validCIDs && !font.validCIDs.has(charCode)) continue;
      unicode = String.fromCharCode(charCode);
      fallbackUsed = true;
    }
    if (/^\s+$/.test(unicode)) unicode = " ";
    else unicode = unicode.replace(/^\s+|\s+$/g, "");
    let dropNoTextMapping = false;
    if (!fallbackUsed && unicode.indexOf("\0") !== -1) {
      unicode = unicode.split("\0").join("");
      dropNoTextMapping = unicode === "";
    }
    const widthKey = isCID && font.charCodeToCID ? font.charCodeToCID.get(charCode) ?? charCode : charCode;
    const glyphWidth = (font.widths.get(widthKey) ?? font.defaultWidth) / 1e3 * fontSize;
    const visualWidthRaw = font.glyphVisualWidths?.get(charCode);
    const visualGlyphWidth = visualWidthRaw !== void 0 ? visualWidthRaw / 1e3 * fontSize : glyphWidth;
    const dropFallbackControl = fallbackUsed && !isCID && unicode.length === 1 && (unicode.charCodeAt(0) < 32 || unicode.charCodeAt(0) === 127);
    const ox = tm[2] * trise + tm[4];
    const oy = tm[3] * trise + tm[5];
    const pageX = ctm[0] * ox + ctm[2] * oy + ctm[4];
    const pageY = ctm[1] * ox + ctm[3] * oy + ctm[5];
    const isWordSpace = numBytes === 1 && charCode === 32;
    const advance = (glyphWidth + tc + (isWordSpace ? tw : 0)) * tz / 100;
    if (!dropFallbackControl && !dropNoTextMapping) {
      const shearDen = tm[0] * tm[0] + tm[1] * tm[1];
      const shearRaw = shearDen > 0 ? (tm[0] * tm[2] + tm[1] * tm[3]) / shearDen : 0;
      const matrixShear = Math.abs(shearRaw) > 0.05 ? Math.round(shearRaw * 1e4) / 1e4 : 0;
      const matrixStretch = vScale > 0 ? Math.round(hScale * tz / (100 * vScale) * 1e4) / 1e4 : 1;
      const glyphName = font.charCodeToGlyphName ? font.charCodeToGlyphName.get(charCode) : void 0;
      chars.push({
        superior: glyphName !== void 0 && /\.(superior|sups)$/.test(glyphName),
        text: unicode,
        x: pageX * scale,
        y: (pageHeightPts - pageY) * scale,
        width: Math.abs(visualGlyphWidth * tz / 100) * hScale * scale,
        fontSize: Math.abs(fontSize * vScale * scale),
        fontInfo: {
          baseName: font.baseName,
          bold: font.bold || tr === 1 || tr === 2,
          italic: font.italic || matrixShear !== 0,
          smallCaps: font.smallCaps,
          familyName: font.familyName,
          ascent: font.ascent,
          descent: font.descent
        },
        skew: matrixShear,
        stretch: Math.abs(matrixStretch - 1) > 0.01 ? matrixStretch : 0,
        _font: font,
        _charCode: charCode,
        invisible: tr === 3,
        // the per-op tag loop also sets this for zero-fill-alpha text
        orientation,
        dirX,
        dirY
      });
      if (opIdx >= 0) {
        chars[chars.length - 1]._src = {
          op: opIdx,
          elem: elemIdx,
          byte: codeByte,
          nBytes: numBytes,
          advPx: advance * hScale * scale,
          space: isWordSpace,
          tx: tm[4],
          ty: tm[5],
          adv: advance
        };
      }
    }
    tm[4] += advance * tm[0];
    tm[5] += advance * tm[1];
  }
}
function convertDetectedTable(dt, dataTablePage, pageObj) {
  const dataTable = new LayoutDataTable(dataTablePage);
  const separators = [dt.bbox.left, ...dt.colSeparators, dt.bbox.right];
  for (let i = 0; i < separators.length - 1; i++) {
    const colBbox = {
      left: separators[i],
      top: dt.bbox.top,
      right: separators[i + 1],
      bottom: dt.bbox.bottom
    };
    dataTable.boxes.push(new LayoutDataColumn(colBbox, dataTable));
  }
  dataTable.detectionMethod = dt.detectionMethod || "text";
  dataTable.bandColor = dt.rowBandRegion?.bandColor ?? null;
  dataTable.title = dt.title || null;
  if (dt.rows && dt.rows.length > 0) {
    const bands = dt.rowBandRegion ? dt.rowBandRegion.rowYs : null;
    const bandUsable = bands ? bands.map((b, i) => bands.every((o, j) => j === i || o.bottom <= b.top + 1 || o.top >= b.bottom - 1)) : null;
    let usedExact = false;
    const bottoms = [];
    const tops = [];
    for (const row of dt.rows) {
      const lineBottoms = row.lineIndices.map((li) => pageObj.lines[li].bbox.bottom).filter(Number.isFinite);
      const lineTops = row.lineIndices.map((li) => pageObj.lines[li].bbox.top).filter(Number.isFinite);
      if (lineTops.length > 0) tops.push(Math.min(...lineTops));
      let bottom = lineBottoms.length > 0 ? Math.max(...lineBottoms) : NaN;
      if (Number.isFinite(row.bottom)) {
        bottom = /** @type {number} */
        row.bottom;
        usedExact = true;
      } else if (bands && bandUsable && lineTops.length > 0 && lineBottoms.length > 0) {
        const mid = (Math.min(...lineTops) + Math.max(...lineBottoms)) / 2;
        const bi = bands.findIndex((b) => mid >= b.top && mid <= b.bottom);
        if (bi >= 0 && bandUsable[bi] && bands[bi].bottom >= bottom - 1) {
          bottom = bands[bi].bottom;
          usedExact = true;
        }
      }
      if (Number.isFinite(bottom)) bottoms.push(bottom);
    }
    bottoms.sort((a, b) => a - b);
    const deduped = bottoms.filter((b, i) => i === 0 || b > bottoms[i - 1] + 1);
    const rowSpan = deduped.length > 0 && tops.length > 0 ? deduped[deduped.length - 1] - Math.min(...tops) : 0;
    if (deduped.length > 0 && (usedExact || rowSpan >= (dt.bbox.bottom - dt.bbox.top) * 0.8)) dataTable.rowBounds = deduped;
  }
  if (dt.headers && dt.headers.confidence === "strong" && Number.isFinite(dt.headers.bandTop) && Number.isFinite(dt.headers.bandBottom)) {
    const bandLineTops = [];
    for (const line of pageObj.lines) {
      const yC = (line.bbox.top + line.bbox.bottom) / 2;
      if (yC <= dt.bbox.top || yC < dt.headers.bandTop - 2 || yC >= dt.headers.bandBottom - 2) continue;
      if (line.bbox.right < dt.bbox.left || line.bbox.left > dt.bbox.right) continue;
      if (!bandLineTops.some((t) => Math.abs(t - line.bbox.top) < 5)) bandLineTops.push(line.bbox.top);
    }
    if (bandLineTops.length > 0) {
      if (dataTable.rowBounds) {
        const boundsInBand = dataTable.rowBounds.filter((b) => b > dt.bbox.top && b <= dt.headers.bandBottom + 2).length;
        dataTable.headerRows = boundsInBand > 0 ? boundsInBand : 1;
      } else {
        dataTable.headerRows = Math.min(bandLineTops.length, 5);
      }
    } else if (["text", "row-band"].includes(dt.detectionMethod || "text") && !dt.splitTopLocked) {
      dataTable.headerRows = 0;
    }
  }
  if (dataTable.headerRows === null && dt.rows && dt.rows.length >= 2) {
    const sortedRows = [...dt.rows].sort((a, b) => a.y - b.y);
    const rowTokens = (row) => row.lineIndices.flatMap((li) => pageObj.lines[li].words.map((w) => w.text));
    const isDataTok = (t) => /^[\d,$%.()+-]+$/.test(t) && /\d/.test(t) && !/^(?:19|20)\d\d$/.test(t);
    const firstToks = rowTokens(sortedRows[0]);
    const firstData = firstToks.filter(isDataTok).length;
    const bodyRows = sortedRows.slice(1);
    const bodyData = bodyRows.reduce((s, r) => s + rowTokens(r).filter(isDataTok).length, 0) / bodyRows.length;
    if (firstData >= 2 || firstData >= 1 && bodyData >= 1) dataTable.headerRows = 0;
    else if (firstData === 0 && firstToks.some((t) => /[A-Za-z]/.test(t))) dataTable.headerRows = 1;
  }
  return dataTable;
}
function groupCharsIntoPage(chars, n, pageWidth, pageHeight, underlineRects = [], paths = [], scale = 1, visualHeightPts = 0, boxOriginX = 0, boxOriginY = 0, pageHasMath = false, glyphOpMap = null) {
  const pageObj = new ocr.OcrPage(n, { width: pageWidth, height: pageHeight });
  pageObj.textSource = "pdf";
  const langSet = /* @__PURE__ */ new Set();
  const fontSet = /* @__PURE__ */ new Set();
  const wordSignals = /* @__PURE__ */ new Map();
  const nativeText = {};
  const fillGlyphBoxes = [];
  if (chars.length === 0) {
    return {
      pageObj,
      langSet,
      fontSet,
      wordSignals,
      nativeText,
      dataTablePage: new LayoutDataTablePage(n),
      fillGlyphBoxes
    };
  }
  for (const ch of chars) {
    if (/^\s$/.test(ch.text)) ch.text = " ";
  }
  const SAME_TM_LOOKBACK = 500;
  chars = (() => {
    const result = [];
    const POS_OFF = 4194304;
    const POS_MUL = 67108864;
    const positionByText = /* @__PURE__ */ new Map();
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const posNum = (Math.round(ch.x * 100) + POS_OFF) * POS_MUL + (Math.round(ch.y * 100) + POS_OFF) * 4 + ch.orientation;
      let byBase = positionByText.get(ch.text);
      if (!byBase) {
        byBase = /* @__PURE__ */ new Map();
        positionByText.set(ch.text, byBase);
      }
      let posMap = byBase.get(ch.fontInfo.baseName);
      if (!posMap) {
        posMap = /* @__PURE__ */ new Map();
        byBase.set(ch.fontInfo.baseName, posMap);
      }
      const mapped = posMap.get(posNum);
      let dupeIdx = mapped === void 0 || result.length - mapped > SAME_TM_LOOKBACK ? -1 : mapped;
      let dupeKind = dupeIdx >= 0 ? "sameTm" : "";
      if (dupeIdx < 0) {
        for (let j = result.length - 1; j >= Math.max(0, result.length - 8); j--) {
          const prev = result[j];
          if (prev.text !== ch.text || prev.fontInfo.baseName !== ch.fontInfo.baseName || prev.orientation !== ch.orientation) continue;
          if (Math.abs(prev.fontSize - ch.fontSize) < ch.fontSize * 0.05 && Math.abs(prev.y - ch.y) < ch.fontSize * 0.2) {
            const xOverlap = Math.min(prev.x + prev.width, ch.x + ch.width) - Math.max(prev.x, ch.x);
            const minWidth = Math.min(prev.width, ch.width);
            if (xOverlap > 0 && minWidth > 0 && xOverlap / minWidth > 0.5) {
              dupeIdx = j;
              dupeKind = "overlap";
              break;
            }
          }
        }
      }
      if (dupeIdx >= 0) {
        const prev = result[dupeIdx];
        if (ch.fontInfo.bold) prev.fontInfo.bold = true;
        if (!ch.invisible) prev.invisible = false;
        if (dupeKind === "overlap") {
          prev.x = ch.x;
          prev.y = ch.y;
          prev.width = ch.width;
          prev.fontSize = ch.fontSize;
        }
        continue;
      }
      posMap.set(posNum, result.length);
      result.push(ch);
    }
    return result;
  })();
  for (const ch of chars) {
    if (ch.orientation === 1) {
      const vx = ch.y;
      const vy = pageWidth - ch.x;
      ch.x = vx;
      ch.y = vy;
    } else if (ch.orientation === 2) {
      ch.x = pageWidth - ch.x;
      ch.y = pageHeight - ch.y;
    } else if (ch.orientation === 3) {
      const vx = pageHeight - ch.y;
      const vy = ch.x;
      ch.x = vx;
      ch.y = vy;
    }
  }
  let avgDirX = 0;
  let avgDirY = 0;
  let orient0Count = 0;
  for (const ch of chars) {
    if (ch.orientation === 0) {
      avgDirX += ch.dirX;
      avgDirY += ch.dirY;
      orient0Count++;
    }
  }
  if (orient0Count > 0) {
    const mag = Math.hypot(avgDirX, avgDirY);
    if (mag > 0) {
      avgDirX /= mag;
      avgDirY /= mag;
    }
  }
  if (orient0Count === 0 || avgDirX === 0 && avgDirY === 0) {
    avgDirX = 1;
    avgDirY = 0;
  }
  for (const ch of chars) {
    if (ch.orientation === 0) {
      ch._perpDist = -ch.x * avgDirY + ch.y * avgDirX;
    }
  }
  const lines = [];
  let currentLine = [chars[0]];
  let anchorY = chars[0]._perpDist ?? chars[0].y;
  let anchorFontSize = chars[0].fontSize;
  let lineBodyY = chars[0].text === " " ? null : chars[0]._perpDist ?? chars[0].y;
  let lineBodySize = chars[0].text === " " ? 0 : chars[0].fontSize;
  for (let i = 1; i < chars.length; i++) {
    const ch = chars[i];
    if (ch.text === " ") {
      let lastNonSpace = null;
      for (let j = currentLine.length - 1; j >= 0; j--) {
        if (currentLine[j].text !== " ") {
          lastNonSpace = currentLine[j];
          break;
        }
      }
      if (lastNonSpace) {
        const spMaxFs = Math.max(ch.fontSize, lastNonSpace.fontSize);
        const spFsChange = Math.abs(ch.fontSize - lastNonSpace.fontSize) > spMaxFs * 0.1;
        const spYGap = Math.abs((ch._perpDist ?? ch.y) - (lastNonSpace._perpDist ?? lastNonSpace.y));
        if (spFsChange) {
          const spMinFs = Math.min(ch.fontSize, lastNonSpace.fontSize);
          if (spYGap > spMaxFs * 0.7 || spYGap > spMinFs * 1.5) {
            lines.push(currentLine);
            currentLine = [ch];
            anchorY = ch._perpDist ?? ch.y;
            anchorFontSize = ch.fontSize;
            lineBodyY = null;
            lineBodySize = 0;
            continue;
          }
        }
      }
      currentLine.push(ch);
      continue;
    }
    let compPrev = chars[i - 1];
    if (compPrev.text === " ") {
      for (let j = currentLine.length - 1; j >= 0; j--) {
        if (currentLine[j].text !== " ") {
          compPrev = currentLine[j];
          break;
        }
      }
    }
    const chY = ch._perpDist ?? ch.y;
    const prevY = compPrev._perpDist ?? compPrev.y;
    const yGap = Math.abs(chY - prevY);
    const xGap = ch.x - (compPrev.x + compPrev.width);
    const chSize = Math.max(ch.fontSize, ch.width);
    const prevSize = Math.max(compPrev.fontSize, compPrev.width);
    const maxFont = Math.max(chSize, prevSize);
    const minFont = Math.min(chSize, prevSize);
    const fontRatio = ch.fontSize / compPrev.fontSize;
    const symbolBoundary = isSymbolFont(ch.fontInfo) || isSymbolFont(compPrev.fontInfo);
    const inlineSymbolBoundary = symbolBoundary && yGap < maxFont * 0.5 && xGap > -maxFont * 0.2 && xGap < maxFont;
    const reducedScript = ch.fontSize < anchorFontSize * 0.85 && chY - ch.fontSize * 0.8 < anchorY + anchorFontSize * 0.2 && chY + ch.fontSize * 0.2 > anchorY - anchorFontSize * 0.8;
    const radicalRadicand = (/^[√∛∜]$/.test(compPrev.text) || /^[√∛∜]$/.test(ch.text)) && fontRatio > 0.8 && fontRatio < 1.25 && xGap > -maxFont * 0.2 && xGap < maxFont * 0.5 && yGap < maxFont * 1.1;
    const mathContext = MATH_FONT_RE.test(ch.fontInfo.baseName || "") || MATH_FONT_RE.test(compPrev.fontInfo.baseName || "") || /^[√∛∜]$/.test(compPrev.text) || /^[√∛∜]$/.test(ch.text) || ch.fontSize < anchorFontSize * 0.85 || compPrev.fontSize < anchorFontSize * 0.85 || fontRatio > 0.8 && fontRatio < 1.25 && Math.abs(chY - anchorY) < anchorFontSize * 0.35;
    const withinEnvelope = Math.abs(chY - anchorY) < anchorFontSize * 1.3;
    const horizontalContinuity = xGap > -anchorFontSize * 1.5 && xGap < maxFont * 4;
    const builtUpMath = pageHasMath && mathContext && withinEnvelope && horizontalContinuity;
    const inlineMath = reducedScript || radicalRadicand || builtUpMath;
    const leadingMarker = anchorFontSize < ch.fontSize * 0.85 && xGap > -maxFont * 0.3 && xGap < maxFont * 0.8 && yGap < maxFont * 0.8;
    let isCut = false;
    if (ch.orientation !== compPrev.orientation && !inlineSymbolBoundary) isCut = true;
    else if (lineBodySize > 0 && !leadingMarker && !builtUpMath && ch.fontSize < lineBodySize * 0.85 && (chY - lineBodyY > lineBodySize * 0.4 || chY - lineBodyY < -lineBodySize * 0.9)) isCut = true;
    else if ((yGap > maxFont * 0.7 || yGap > minFont * 1.5) && !inlineMath && !leadingMarker) isCut = true;
    else if (xGap < -maxFont * 2 && !builtUpMath) isCut = true;
    else if (xGap > maxFont * 4) isCut = true;
    else if (!inlineMath && !leadingMarker && fontRatio > 0.8 && fontRatio < 1.25 && (xGap < -maxFont * 0.1 || xGap > maxFont * 0.5 || yGap > minFont * 0.5) && yGap > (xGap > maxFont ? minFont * 0.2 : minFont * 0.3)) isCut = true;
    else if (!inlineSymbolBoundary && !builtUpMath && yGap > minFont * 0.1 && (fontRatio > 1.75 || fontRatio < 1 / 1.75) && (xGap < -maxFont * 0.1 || xGap > maxFont * 0.5)) isCut = true;
    else if (!inlineSymbolBoundary && !builtUpMath && yGap > minFont * 0.1 && (fontRatio < 0.8 || fontRatio > 1.25)) {
      let persistCount = 0;
      const targetSize = Math.min(ch.fontSize, compPrev.fontSize);
      for (let j = i + 1; j < chars.length && persistCount < 3; j++) {
        if (chars[j].text === " ") continue;
        if (Math.abs(chars[j].fontSize - targetSize) < targetSize * 0.15) persistCount++;
        else break;
      }
      if (persistCount >= 3) isCut = true;
    }
    if (!isCut && !builtUpMath && ch.fontSize >= anchorFontSize * 0.8 && ch.fontSize <= anchorFontSize * 1.25 && Math.abs(chY - anchorY) > anchorFontSize * 0.3 && xGap > maxFont * 0.5) isCut = true;
    if (isCut) {
      lines.push(currentLine);
      currentLine = [ch];
      anchorY = chY;
      anchorFontSize = ch.fontSize;
      lineBodyY = chY;
      lineBodySize = ch.fontSize;
    } else {
      currentLine.push(ch);
      if (ch.fontSize >= anchorFontSize * 0.8 && !(pageHasMath && chY < anchorY - anchorFontSize * 0.25)) {
        anchorY = chY;
      }
      if (ch.text !== " " && (lineBodySize === 0 || ch.fontSize >= lineBodySize * 0.95)) {
        lineBodySize = Math.max(lineBodySize, ch.fontSize);
        lineBodyY = chY;
      }
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);
  const lineExtents = lines.map((lineChars) => {
    let minX = Infinity;
    let maxRight = -Infinity;
    let maxFontSize = 0;
    for (const ch of lineChars) {
      if (ch.x < minX) minX = ch.x;
      const r = ch.x + ch.width;
      if (r > maxRight) maxRight = r;
      if (ch.fontSize > maxFontSize) maxFontSize = ch.fontSize;
    }
    return { minX, maxRight, maxFontSize };
  });
  for (let li = lines.length - 1; li >= 0; li--) {
    if (lines[li].length !== 1) continue;
    const orphan = lines[li][0];
    const orphanRight = orphan.x + orphan.width;
    const orphanTop = orphan.y - orphan.fontInfo.ascent / 1e3 * orphan.fontSize;
    let merged = false;
    for (let lj = 0; lj < lines.length && !merged; lj++) {
      if (lj === li) continue;
      const target = lines[lj];
      const ext = lineExtents[lj];
      const slack = Math.max(orphan.fontSize, ext.maxFontSize) * 0.1;
      if (orphanRight < ext.minX - slack || orphan.x > ext.maxRight + slack) continue;
      for (const ch of target) {
        if (orphan.fontInfo.familyName !== ch.fontInfo.familyName) continue;
        const chRight = ch.x + ch.width;
        const maxFont = Math.max(orphan.fontSize, ch.fontSize);
        const minFont = Math.min(orphan.fontSize, ch.fontSize);
        const sameSize = Math.abs(orphan.fontSize - ch.fontSize) < maxFont * 0.1;
        const xAdj = orphanRight >= ch.x - maxFont * 0.1 && orphan.x <= chRight + maxFont * 0.1;
        if (sameSize && xAdj && Math.abs(orphan.y - ch.y) < maxFont * 0.5) {
          let insertIdx = target.length;
          for (let k = 0; k < target.length; k++) {
            if (target[k].x > orphan.x) {
              insertIdx = k;
              break;
            }
          }
          target.splice(insertIdx, 0, orphan);
          if (orphan.x < ext.minX) ext.minX = orphan.x;
          if (orphanRight > ext.maxRight) ext.maxRight = orphanRight;
          if (orphan.fontSize > ext.maxFontSize) ext.maxFontSize = orphan.fontSize;
          lines.splice(li, 1);
          lineExtents.splice(li, 1);
          merged = true;
          break;
        }
        if (!sameSize && orphan.fontSize > ch.fontSize * 2 && /[A-Z]/.test(orphan.text) && xAdj) {
          const chTop = ch.y - ch.fontInfo.ascent / 1e3 * ch.fontSize;
          if (Math.abs(orphanTop - chTop) < minFont * 0.25) {
            let insertIdx = target.length;
            for (let k = 0; k < target.length; k++) {
              if (target[k].x > orphan.x) {
                insertIdx = k;
                break;
              }
            }
            target.splice(insertIdx, 0, orphan);
            if (orphan.x < ext.minX) ext.minX = orphan.x;
            if (orphanRight > ext.maxRight) ext.maxRight = orphanRight;
            if (orphan.fontSize > ext.maxFontSize) ext.maxFontSize = orphan.fontSize;
            lines.splice(li, 1);
            lineExtents.splice(li, 1);
            merged = true;
            break;
          }
        }
      }
    }
  }
  const lineAnchorOf = (lineChars) => {
    let maxSize = 0;
    let anchorFamily = null;
    for (const ch of lineChars) {
      if (ch.text !== " " && ch.fontSize > maxSize) {
        maxSize = ch.fontSize;
        anchorFamily = ch.fontInfo.familyName;
      }
    }
    if (maxSize === 0) return null;
    const ys = [];
    let leftX = Infinity;
    let rightX = -Infinity;
    for (const ch of lineChars) {
      if (ch.text === " ") continue;
      if (ch.fontSize >= maxSize * 0.8) ys.push(ch._perpDist ?? ch.y);
      if (ch.x < leftX) leftX = ch.x;
      const r = ch.x + ch.width;
      if (r > rightX) rightX = r;
    }
    if (ys.length === 0) return null;
    ys.sort((a, b) => a - b);
    return {
      anchorFontSize: maxSize,
      anchorFamily,
      baselineY: ys[Math.floor(ys.length / 2)],
      leftX,
      rightX
    };
  };
  for (let li = lines.length - 2; li >= 0; li--) {
    const a = lineAnchorOf(lines[li]);
    const b = lineAnchorOf(lines[li + 1]);
    if (!a || !b) continue;
    const anchorSize = Math.max(a.anchorFontSize, b.anchorFontSize);
    const gap = b.leftX - a.rightX;
    if (gap < -anchorSize * 0.1 || gap > anchorSize) continue;
    const smallerIsA = a.anchorFontSize < b.anchorFontSize * 0.85;
    const smallerIsB = b.anchorFontSize < a.anchorFontSize * 0.85;
    const supContinuation = Math.abs(gap) < anchorSize * 0.1 && (smallerIsA && a.baselineY < b.baselineY || smallerIsB && b.baselineY < a.baselineY);
    const baselineTol = supContinuation ? anchorSize * 0.5 : anchorSize * 0.25;
    if (Math.abs(a.baselineY - b.baselineY) > baselineTol) continue;
    let lastA = null;
    for (let k = lines[li].length - 1; k >= 0; k--) {
      if (lines[li][k].text !== " ") {
        lastA = lines[li][k];
        break;
      }
    }
    let firstB = null;
    for (let k = 0; k < lines[li + 1].length; k++) {
      if (lines[li + 1][k].text !== " ") {
        firstB = lines[li + 1][k];
        break;
      }
    }
    const supBoundary = lastA && lastA.fontSize < anchorSize * 0.85 || firstB && firstB.fontSize < anchorSize * 0.85;
    if (!supBoundary) continue;
    lines[li] = [...lines[li], ...lines[li + 1]];
    lines.splice(li + 1, 1);
  }
  const anchors = lines.map(lineAnchorOf);
  const refMarker = /^[0-9,]+$|^[®*†‡§]+$/;
  const fnMarker = /^FN\d{1,3}$/;
  for (let li = lines.length - 1; li >= 0; li--) {
    const frag = lines[li].filter((c) => c.text !== " ");
    if (frag.length === 0 || frag.length > 6) continue;
    const fragText = frag.map((c) => c.text).join("");
    const isFnMarker = fnMarker.test(fragText);
    if (!refMarker.test(fragText) && !isFnMarker) continue;
    let fragSize = 0;
    let fragFamily = null;
    let fragLeft = Infinity;
    let fragBaseline = 0;
    for (const c of frag) {
      if (c.fontSize > fragSize) {
        fragSize = c.fontSize;
        fragFamily = c.fontInfo.familyName;
      }
      if (c.x < fragLeft) fragLeft = c.x;
      fragBaseline = c._perpDist ?? c.y;
    }
    let best = -1;
    let bestDist = Infinity;
    for (let lj = 0; lj < lines.length; lj++) {
      if (lj === li) continue;
      const host = anchors[lj];
      if (!host) continue;
      if (isFnMarker) {
        if (fragSize < host.anchorFontSize * 0.7 || fragSize > host.anchorFontSize * 1.15) continue;
      } else if (fragSize >= host.anchorFontSize * 0.85 || fragSize < host.anchorFontSize * 0.4) continue;
      if (host.anchorFamily !== fragFamily) continue;
      const drop = host.baselineY - fragBaseline;
      if (drop < -host.anchorFontSize * 0.1 || drop > host.anchorFontSize * 0.8) continue;
      if (fragLeft < host.leftX - host.anchorFontSize * 0.5) continue;
      if (fragLeft > host.rightX + host.anchorFontSize) continue;
      if (Math.abs(drop) < bestDist) {
        bestDist = Math.abs(drop);
        best = lj;
      }
    }
    if (best < 0) continue;
    const target = lines[best];
    let insertIdx = target.length;
    for (let k = 0; k < target.length; k++) {
      if (target[k].x > fragLeft) {
        insertIdx = k;
        break;
      }
    }
    target.splice(insertIdx, 0, ...lines[li]);
    anchors[best] = lineAnchorOf(target);
    lines.splice(li, 1);
    anchors.splice(li, 1);
  }
  const wordGapThresholds = /* @__PURE__ */ new Map();
  {
    const keyOf = (c) => `${c.fontInfo && c.fontInfo.familyName || "?"}|${Math.round(c.fontSize)}`;
    const fontStats = /* @__PURE__ */ new Map();
    for (const lineChars of lines) {
      let prevNS = null;
      for (const c of lineChars) {
        const k = keyOf(c);
        let st = fontStats.get(k);
        if (!st) {
          st = { chars: 0, spaces: 0, ratios: [] };
          fontStats.set(k, st);
        }
        st.chars++;
        if (c.text === " ") {
          st.spaces++;
          continue;
        }
        if (prevNS && c.fontSize > 0 && prevNS.fontInfo.familyName === c.fontInfo.familyName) {
          st.ratios.push((c.x - (prevNS.x + prevNS.width)) / c.fontSize);
        }
        prevNS = c;
      }
    }
    for (const [k, st] of fontStats) {
      if (st.chars < 100 || st.spaces > 0 || st.ratios.length < 200) continue;
      const a = st.ratios.slice().sort((p, q) => p - q);
      const nR = a.length;
      const prefix = new Float64Array(nR + 1);
      for (let i = 0; i < nR; i++) prefix[i + 1] = prefix[i] + a[i];
      const idxOf = (v) => {
        let lo = 0;
        let hi = nR;
        while (lo < hi) {
          const mid = lo + hi >> 1;
          if (a[mid] < v) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      };
      let theta;
      for (const w of [0.04, 0.03, 0.02]) {
        for (let x = 0.02; x <= 0.16 && theta === void 0; x += 5e-3) {
          const iX = idxOf(x);
          if ((idxOf(x + w) - iX) / nR >= 5e-3) continue;
          const iLo = idxOf(x + w);
          const iHi = idxOf(0.45 + 1e-9);
          const share = (iHi - iLo) / nR;
          if (share < 0.03 || share > 0.4) continue;
          if (iX / nR < 0.5) continue;
          const aMean = (prefix[iHi] - prefix[iLo]) / (iHi - iLo);
          if (aMean - x < 0.08) continue;
          if (iX > 0 && a[Math.min(iX - 1, Math.floor(0.995 * iX))] > x - 0.015) continue;
          theta = x + w / 2;
        }
        if (theta !== void 0) break;
      }
      if (theta !== void 0 && theta < 0.15) wordGapThresholds.set(k, theta);
    }
    if (wordGapThresholds.size > 0) {
      const pieceStats = /* @__PURE__ */ new Map();
      for (const lineChars of lines) {
        let prevNS = null;
        let runKey = null;
        let piece = 0;
        const closePiece = (k) => {
          if (piece === 0 || k === null) return;
          let st = pieceStats.get(k);
          if (!st) {
            st = { n: 0, len: 0, single: 0 };
            pieceStats.set(k, st);
          }
          st.n++;
          st.len += piece;
          if (piece === 1) st.single++;
          piece = 0;
        };
        for (const c of lineChars) {
          if (c.text === " ") {
            closePiece(runKey);
            prevNS = null;
            runKey = null;
            continue;
          }
          const k = keyOf(c);
          const th = wordGapThresholds.get(k);
          if (th === void 0 || prevNS && prevNS.fontInfo.familyName !== c.fontInfo.familyName) {
            closePiece(runKey);
            prevNS = c;
            runKey = null;
            continue;
          }
          if (prevNS && c.fontSize > 0) {
            const r = (c.x - (prevNS.x + prevNS.width)) / c.fontSize;
            if (r > th) closePiece(k);
          }
          runKey = k;
          if (/[A-Za-zÀ-ɏ]/.test(c.text)) piece++;
          prevNS = c;
        }
        closePiece(runKey);
      }
      for (const [k, st] of pieceStats) {
        if (st.n > 0 && (st.len / st.n < 3.2 || st.single / st.n > 0.2)) wordGapThresholds.delete(k);
      }
    }
  }
  const WORDGAP_MARK_RE = /[\u0060\u00A8\u00B4\u02BB\u02BC\u02C6-\u02DF\u0300-\u036F]/;
  for (const lineChars of lines) {
    const wordsInitial = [];
    let currentWord = [];
    const adaptiveSplitAfter = /* @__PURE__ */ new Set();
    for (let i = 0; i < lineChars.length; i++) {
      const ch = lineChars[i];
      if (ch.text === " ") {
        if (currentWord.length > 0) {
          let nextNonSpace = null;
          for (let j = i + 1; j < lineChars.length; j++) {
            if (lineChars[j].text !== " ") {
              nextNonSpace = lineChars[j];
              break;
            }
          }
          if (nextNonSpace) {
            const prevCh = currentWord[currentWord.length - 1];
            const visualGap = nextNonSpace.x - (prevCh.x + prevCh.width);
            const adjacencyTol = prevCh.fontSize * 0.15;
            const positiveTol = Math.max(prevCh.fontSize * 0.01, ch.width * 0.1);
            const isKerningArtifact = visualGap >= -adjacencyTol && visualGap < positiveTol;
            if (isKerningArtifact && prevCh.text !== ",") {
              continue;
            }
          }
          wordsInitial.push(currentWord);
          currentWord = [];
        }
        continue;
      }
      if (currentWord.length > 0) {
        const prevCh = currentWord[currentWord.length - 1];
        const gap = ch.x - (prevCh.x + prevCh.width);
        const fontSizeMin = Math.min(ch.fontSize, prevCh.fontSize);
        if (ch.text === "—" && /[.!?]/.test(prevCh.text)) {
          wordsInitial.push(currentWord);
          wordsInitial.push([ch]);
          currentWord = [];
          continue;
        }
        if (currentWord.length === 1 && isBulletChar(prevCh.text) && /[A-Za-z0-9]/.test(ch.text)) {
          wordsInitial.push(currentWord);
          currentWord = [];
          currentWord.push(ch);
          continue;
        }
        if ((ch.fontInfo.bold !== prevCh.fontInfo.bold || ch.fontInfo.italic !== prevCh.fontInfo.italic) && !(",.;:!?)]}”’".includes(ch.text) && gap <= fontSizeMin * 0.15) && !(("—–".includes(ch.text) || "—–".includes(prevCh.text)) && gap <= fontSizeMin * 0.15)) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (ch.fontInfo.familyName !== prevCh.fontInfo.familyName && (gap > fontSizeMin * 0.15 || isSymbolFont(ch.fontInfo) || isSymbolFont(prevCh.fontInfo) || isSymbolChar(ch.text) || isSymbolChar(prevCh.text))) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (prevCh.text === "”" && /[A-Za-z]/.test(ch.text)) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (gap > ch.fontSize * 0.15) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (fontSizeMin > 0 && Math.abs(ch.y - prevCh.y) > fontSizeMin * 0.25) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (gap < -ch.fontSize * 0.5 && ch.x < prevCh.x) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (gap < -fontSizeMin * 0.1 && fontSizeMin > 0 && ch.fontSize > prevCh.fontSize * 1.1) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (fontSizeMin > 0 && Math.max(ch.fontSize, prevCh.fontSize) >= fontSizeMin * 2) {
          wordsInitial.push(currentWord);
          currentWord = [];
        } else if (ch.text === "." && prevCh.text !== ".") {
          let dotCount = 0;
          for (let j = i; j < lineChars.length && lineChars[j].text === "."; j++) dotCount++;
          if (dotCount >= 5) {
            wordsInitial.push(currentWord);
            currentWord = [];
          }
        } else if (wordGapThresholds.size > 0 && ch.fontInfo.familyName === prevCh.fontInfo.familyName && !/[-\u2010\u2011\u2013\u2014]/.test(ch.text) && !WORDGAP_MARK_RE.test(ch.text) && !WORDGAP_MARK_RE.test(prevCh.text)) {
          const th = wordGapThresholds.get(`${ch.fontInfo.familyName || "?"}|${Math.round(ch.fontSize)}`);
          if (th !== void 0 && gap > ch.fontSize * th) {
            adaptiveSplitAfter.add(prevCh);
            wordsInitial.push(currentWord);
            currentWord = [];
          }
        }
      }
      currentWord.push(ch);
    }
    if (currentWord.length > 0) wordsInitial.push(currentWord);
    if (adaptiveSplitAfter.size > 0) {
      let single = 0;
      for (const w of wordsInitial) {
        if (w.length === 1 && /[A-Za-z]/.test(w[0].text)) single++;
      }
      if (single / wordsInitial.length > 0.4) {
        for (let wi = wordsInitial.length - 2; wi >= 0; wi--) {
          const w = wordsInitial[wi];
          if (adaptiveSplitAfter.has(w[w.length - 1])) {
            w.push(...wordsInitial[wi + 1]);
            wordsInitial.splice(wi + 1, 1);
          }
        }
      }
    }
    wordsInitial.sort((a, b) => a[0].x - b[0].x);
    const wordsMerged = [];
    for (let wi = 0; wi < wordsInitial.length; wi++) {
      const curr = wordsInitial[wi];
      const next = wordsInitial[wi + 1];
      if (curr.length === 1 && /[A-Z]/.test(curr[0].text) && next && next.length > 0 && /[A-Z]/.test(next[0].text) && curr[0].fontInfo.familyName === next[0].fontInfo.familyName && next[0].fontSize < curr[0].fontSize * 0.95 && Math.abs(next[0].y - curr[0].y) / Math.min(next[0].fontSize, curr[0].fontSize) < 0.15) {
        const lastChar = curr[curr.length - 1];
        const nextChar = next[0];
        const gap = nextChar.x - (lastChar.x + lastChar.width);
        if (gap <= nextChar.fontSize * 0.3) {
          wordsMerged.push([...curr, ...next]);
          wi++;
        } else {
          wordsMerged.push(curr);
        }
      } else {
        wordsMerged.push(curr);
      }
    }
    const wordsAfterCJK = [];
    for (const wordChars of wordsMerged) {
      const wordText = wordChars.map((c) => c.text).join("");
      if (calcLang(wordText) === "chi_sim") {
        for (const ch of wordChars) {
          wordsAfterCJK.push([ch]);
        }
      } else {
        wordsAfterCJK.push(wordChars);
      }
    }
    if (wordsAfterCJK.length === 0) continue;
    const words = [];
    let normalBaselineY = null;
    let smallCapsAltActive = false;
    for (let wi = 0; wi < wordsAfterCJK.length; wi++) {
      const wordChars = wordsAfterCJK[wi];
      const splitPoints = [];
      for (let ci = 1; ci < wordChars.length; ci++) {
        const prev = wordChars[ci - 1];
        const curr = wordChars[ci];
        const fontSizeMin = Math.min(prev.fontSize, curr.fontSize);
        if (fontSizeMin === 0) continue;
        const baselineDelta = (curr.y - prev.y) / fontSizeMin;
        const sizeDelta = (curr.fontSize - prev.fontSize) / fontSizeMin;
        if (Number.isFinite(baselineDelta) && Number.isFinite(sizeDelta) && (baselineDelta < -0.25 && sizeDelta < -0.05 || baselineDelta > 0.25 && sizeDelta > 0.05)) {
          splitPoints.push({ index: ci, sizeDelta });
        } else if (!!prev.superior !== !!curr.superior) {
          splitPoints.push({ index: ci, sizeDelta: 0, bySuperior: true });
        } else if (ci === 1 && /[A-Z]/.test(prev.text) && curr.fontSize < prev.fontSize && prev.fontSize > 0 && Math.abs(baselineDelta) < 0.1) ;
      }
      let forceSupForSplits = false;
      if (splitPoints.length === 0 && wordChars.length > 4) {
        const wText = wordChars.map((c) => c.text).join("");
        let openClose = null;
        if (/^(\(\d+\))+$/.test(wText)) openClose = ["(", ")"];
        else if (/^(\[\d+\])+$/.test(wText)) openClose = ["[", "]"];
        if (openClose) {
          const [open, close] = openClose;
          for (let ci = 1; ci < wordChars.length; ci++) {
            if (wordChars[ci - 1].text === close && wordChars[ci].text === open) {
              splitPoints.push({ index: ci, sizeDelta: 0 });
            }
          }
          const wFontSize = wordChars[0].fontSize;
          const prevNeighbor = wi > 0 ? wordsAfterCJK[wi - 1] : null;
          const nextNeighbor = wi + 1 < wordsAfterCJK.length ? wordsAfterCJK[wi + 1] : null;
          const prevFontSize = prevNeighbor && prevNeighbor.length > 0 ? prevNeighbor[0].fontSize : 0;
          const nextFontSize = nextNeighbor && nextNeighbor.length > 0 ? nextNeighbor[0].fontSize : 0;
          if (prevFontSize > 0 && wFontSize < prevFontSize * 0.95 || nextFontSize > 0 && wFontSize < nextFontSize * 0.95) {
            forceSupForSplits = true;
          }
        }
      }
      if (splitPoints.length === 0) {
        words.push({
          chars: wordChars,
          sup: wordChars.every((c) => c.superior),
          dropcap: false,
          smallCapsAlt: smallCapsAltActive,
          smallCapsAltTitleCase: false,
          smallCapsLargeFontSize: 0
        });
      } else {
        let start = 0;
        let prevWasSup = false;
        for (const sp of splitPoints) {
          if (sp.index > start) {
            let supForSegment;
            if (forceSupForSplits) {
              supForSegment = true;
            } else if (sp.bySuperior) {
              supForSegment = !!wordChars[start].superior;
            } else if (sp.sizeDelta > 0) {
              supForSegment = prevWasSup;
            } else {
              supForSegment = sp.sizeDelta < 0;
            }
            words.push({
              chars: wordChars.slice(start, sp.index),
              sup: supForSegment,
              dropcap: false,
              smallCapsAlt: false,
              smallCapsAltTitleCase: false,
              smallCapsLargeFontSize: 0
            });
            if (!supForSegment && normalBaselineY === null) {
              normalBaselineY = wordChars[start].y;
            }
            prevWasSup = supForSegment;
          }
          start = sp.index;
          prevWasSup = sp.bySuperior ? !!wordChars[sp.index].superior : forceSupForSplits ? true : sp.sizeDelta < 0;
        }
        if (start < wordChars.length) {
          words.push({
            chars: wordChars.slice(start),
            sup: prevWasSup,
            dropcap: false,
            smallCapsAlt: false,
            smallCapsAltTitleCase: false,
            smallCapsLargeFontSize: 0
          });
          if (!prevWasSup && normalBaselineY === null) {
            normalBaselineY = wordChars[start].y;
          }
        }
      }
      if (normalBaselineY === null && words.length > 0 && !words[words.length - 1].sup) {
        normalBaselineY = words[words.length - 1].chars[0].y;
      }
    }
    for (let i = 0; i < words.length; i++) {
      if (words[i].sup || words[i].chars.length !== 1) continue;
      const nextIdx = i + 1;
      if (nextIdx >= words.length || words[nextIdx].chars.length === 0) continue;
      const dcFontSize = words[i].chars[0].fontSize;
      const nextFontSize = words[nextIdx].chars[0].fontSize;
      if (dcFontSize > nextFontSize * 2 && words[i].chars[0].y > words[nextIdx].chars[0].y) {
        words[i].dropcap = true;
      }
    }
    let supChanged = true;
    while (supChanged) {
      supChanged = false;
      for (let i = 0; i < words.length; i++) {
        if (words[i].sup || words[i].dropcap || words[i].chars.length === 0) continue;
        if (words[i].chars.length > 4) {
          const wText = words[i].chars.map((c) => c.text).join("");
          if (!/^[([]\d+[)\]]$/.test(wText)) continue;
        }
        const wChars = words[i].chars;
        const wFontSize = wChars.reduce((sum, c) => sum + c.fontSize, 0) / wChars.length;
        const wBaseline = wChars.reduce((sum, c) => sum + c.y, 0) / wChars.length;
        let followIdx = i + 1;
        while (followIdx < words.length && (words[followIdx].sup || words[followIdx].dropcap)) followIdx++;
        let sizeTransition = false;
        if (followIdx < words.length && words[followIdx].chars.length > 0) {
          const followFontSize = words[followIdx].chars.reduce((sum, c) => sum + c.fontSize, 0) / words[followIdx].chars.length;
          sizeTransition = Math.abs(wFontSize - followFontSize) < Math.max(wFontSize, followFontSize) * 0.1;
        }
        let prevIdx = i - 1;
        while (prevIdx >= 0 && (words[prevIdx].sup || words[prevIdx].dropcap)) prevIdx--;
        if (!sizeTransition && prevIdx >= 0 && words[prevIdx].chars.length > 0) {
          const prevChars = words[prevIdx].chars;
          const prevFontSize = prevChars.reduce((sum, c) => sum + c.fontSize, 0) / prevChars.length;
          const prevBaseline = prevChars.reduce((sum, c) => sum + c.y, 0) / prevChars.length;
          const fontSizeMin = Math.min(wFontSize, prevFontSize);
          if (fontSizeMin > 0) {
            const sizeDelta = (wFontSize - prevFontSize) / fontSizeMin;
            const baselineDelta = (wBaseline - prevBaseline) / fontSizeMin;
            if (sizeDelta < -0.05 && baselineDelta < -0.25) {
              words[i].sup = true;
              supChanged = true;
              if (normalBaselineY === null) normalBaselineY = prevBaseline;
              continue;
            }
            if (sizeDelta < -0.3 && baselineDelta < -0.05) {
              words[i].sup = true;
              supChanged = true;
              if (normalBaselineY === null) normalBaselineY = prevBaseline;
              continue;
            }
          }
        }
        let nextNonSupIdx = i + 1;
        while (nextNonSupIdx < words.length && (words[nextNonSupIdx].sup || words[nextNonSupIdx].dropcap)) nextNonSupIdx++;
        if (nextNonSupIdx < words.length && words[nextNonSupIdx].chars.length > 0) {
          const nextChars = words[nextNonSupIdx].chars;
          const nextFontSize = nextChars.reduce((sum, c) => sum + c.fontSize, 0) / nextChars.length;
          const nextBaseline = nextChars.reduce((sum, c) => sum + c.y, 0) / nextChars.length;
          const fontSizeMin = Math.min(wFontSize, nextFontSize);
          if (fontSizeMin > 0) {
            const sizeDelta = (wFontSize - nextFontSize) / fontSizeMin;
            const baselineDelta = (wBaseline - nextBaseline) / fontSizeMin;
            if (sizeDelta < -0.05 && baselineDelta < -0.25) {
              words[i].sup = true;
              supChanged = true;
              if (normalBaselineY === null) normalBaselineY = nextBaseline;
              continue;
            }
            if (sizeDelta < -0.3 && baselineDelta < -0.05) {
              words[i].sup = true;
              supChanged = true;
              if (normalBaselineY === null) normalBaselineY = nextBaseline;
              continue;
            }
          }
        }
      }
    }
    normalBaselineY = null;
    for (const w of words) {
      if (!w.sup && !w.dropcap && w.chars.length > 0) {
        normalBaselineY = w.chars[0].y;
        break;
      }
    }
    if (normalBaselineY !== null) {
      for (const w of words) {
        if (w.sup || w.dropcap || w.chars.length === 0) continue;
        if (!/^FN\d{1,3}$/.test(w.chars.map((c) => c.text).join(""))) continue;
        if (w.chars[0].y < normalBaselineY - w.chars[0].fontSize * 0.2) w.sup = true;
      }
    }
    let smallCapsBaseFontSize = 0;
    for (let i = 0; i < words.length; i++) {
      if (words[i].sup) continue;
      const wc = words[i].chars;
      if (wc.length < 2) continue;
      let maxFontSize = 0;
      let minFontSize = Infinity;
      for (const c of wc) {
        if (c.fontSize > maxFontSize) maxFontSize = c.fontSize;
        if (c.fontSize < minFontSize) minFontSize = c.fontSize;
      }
      const hasMixedSizes = maxFontSize > 0 && minFontSize < maxFontSize * 0.95;
      if (hasMixedSizes) {
        const allText = wc.map((c) => c.text).join("");
        if (!/[a-z]/.test(allText) && /[A-Z]/.test(allText)) {
          const largeChar = wc.find((c) => c.fontSize >= maxFontSize * 0.95);
          const smallChar = wc.find((c) => c.fontSize <= minFontSize * 1.05);
          const baselineDelta = largeChar && smallChar ? Math.abs(smallChar.y - largeChar.y) / minFontSize : 0;
          if (baselineDelta < 0.15) {
            words[i].smallCapsAlt = true;
            words[i].smallCapsLargeFontSize = maxFontSize;
            const firstAlpha = wc.find((c) => /[A-Z]/.test(c.text));
            if (firstAlpha && firstAlpha.fontSize >= maxFontSize * 0.95) {
              words[i].smallCapsAltTitleCase = true;
            }
            smallCapsAltActive = true;
            smallCapsBaseFontSize = maxFontSize;
          }
        }
      } else if (smallCapsAltActive) {
        const firstCharFontSize = wc[0].fontSize;
        const secondCharFontSize = wc[1].fontSize;
        const fontSizeMin = Math.min(firstCharFontSize, secondCharFontSize);
        const sizeDelta = fontSizeMin > 0 ? (secondCharFontSize - firstCharFontSize) / fontSizeMin : 0;
        if (Number.isFinite(sizeDelta) && sizeDelta > 0.05) {
          smallCapsAltActive = false;
        } else {
          words[i].smallCapsAlt = true;
          words[i].smallCapsLargeFontSize = smallCapsBaseFontSize;
        }
      }
    }
    const allLineChars = [];
    const nonSupChars = [];
    for (const w of words) {
      for (const c of w.chars) {
        allLineChars.push(c);
        if (!w.sup) nonSupChars.push(c);
      }
    }
    const bboxChars = nonSupChars.length > 0 ? nonSupChars : allLineChars;
    let lineLeft = Infinity;
    let lineRight = -Infinity;
    let lineTop = Infinity;
    let lineBottom = -Infinity;
    for (const c of bboxChars) {
      const l = Math.round(c.x);
      const r = Math.round(c.x + c.width);
      const t = Math.round(c.y - c.fontInfo.ascent / 1e3 * c.fontSize);
      const b = Math.round(c.y - c.fontInfo.descent / 1e3 * c.fontSize);
      if (l < lineLeft) lineLeft = l;
      if (r > lineRight) lineRight = r;
      if (t < lineTop) lineTop = t;
      if (b > lineBottom) lineBottom = b;
    }
    const baselineY = normalBaselineY ?? allLineChars[0].y;
    const baselineOffset = Math.round(baselineY - lineBottom);
    const ascHeight = (nonSupChars.length > 0 ? nonSupChars[0] : allLineChars[0]).fontSize * 0.6;
    let baselineSlope = 0;
    const lineOrientation = allLineChars[0].orientation;
    let sumDirX = 0;
    let sumDirY = 0;
    for (const ch of bboxChars) {
      sumDirX += ch.dirX;
      sumDirY += ch.dirY;
    }
    const lineDirMag = Math.hypot(sumDirX, sumDirY);
    if (lineDirMag > 0) {
      const ndx = sumDirX / lineDirMag;
      const ndy = sumDirY / lineDirMag;
      if (lineOrientation === 1) {
        baselineSlope = round6(-ndx);
      } else if (lineOrientation === 2) {
        baselineSlope = round6(-ndy);
      } else if (lineOrientation === 3) {
        baselineSlope = round6(ndx);
      } else if (Math.abs(ndx) > 0.01) {
        baselineSlope = round6(ndy);
      }
    }
    const lineBbox = {
      left: lineLeft,
      top: lineTop,
      right: lineRight,
      bottom: lineBottom
    };
    const lineObj = new ocr.OcrLine(pageObj, lineBbox, [baselineSlope, baselineOffset], ascHeight, null);
    lineObj.orientation = lineOrientation;
    for (let wi = 0; wi < words.length; wi++) {
      const wordChars = words[wi].chars;
      const isSup = words[wi].sup;
      const wordText = wordChars.map((c) => c.text).join("");
      if (wordText.trim() === "") continue;
      const wordLang = calcLang(wordText);
      langSet.add(wordLang);
      const wordLeft = Math.round(wordChars[0].x);
      const wordRight = Math.round(wordChars[wordChars.length - 1].x + wordChars[wordChars.length - 1].width);
      const wordTop = wordChars.reduce((m, c) => Math.min(m, Math.round(c.y - c.fontInfo.ascent / 1e3 * c.fontSize)), Infinity);
      const wordBottom = wordChars.reduce((m, c) => Math.max(m, Math.round(c.y - c.fontInfo.descent / 1e3 * c.fontSize)), -Infinity);
      const wordBbox = {
        left: wordLeft,
        top: wordTop,
        right: wordRight,
        bottom: wordBottom
      };
      const wordID = `word_${n + 1}_${pageObj.lines.length + 1}_${wi + 1}`;
      if (glyphOpMap) glyphOpMap.words.set(wordID, wordChars);
      if (wordChars.length === 1 && !wordChars[0].orientation && wordText.codePointAt(0) > 255) {
        const glyphChar = wordChars[0];
        const ink = glyphChar._font ? glyphInkBox(glyphChar._font, glyphChar._charCode) : null;
        if (ink) {
          fillGlyphBoxes.push({
            id: wordID,
            bbox: {
              left: Math.round(glyphChar.x + ink.left * glyphChar.fontSize),
              top: Math.round(glyphChar.y - ink.yMax * glyphChar.fontSize),
              right: Math.round(glyphChar.x + ink.right * glyphChar.fontSize),
              bottom: Math.round(glyphChar.y - ink.yMin * glyphChar.fontSize)
            }
          });
        }
      }
      const wordObj = new ocr.OcrWord(lineObj, wordID, wordText, wordBbox);
      wordObj.conf = 100;
      wordObj.visualCoords = false;
      wordObj.lang = wordLang;
      const artifact = wordChars.some((c) => c.artifact);
      const sChar = wordChars.find((c) => c.structTag) || null;
      const brokenFont = wordChars.some((c) => brokenToUnicodeFont(c._font));
      if (artifact || sChar || brokenFont) {
        wordSignals.set(wordObj, {
          artifact,
          mcid: sChar?.mcid ?? null,
          structElemId: null,
          structElemTag: null,
          brokenFont
        });
      }
      const firstAlphaNum = wordChars.find((c) => /[A-Za-z\d]/.test(c.text)) || wordChars[0];
      if (!wordChars.some((c) => c.invisible || c.alpha === 0)) {
        const ntEntry2 = { baselineY: round3(wordChars[0].y) };
        if (Number.isFinite(firstAlphaNum._font?.fontObjNum)) ntEntry2.fontObjNum = firstAlphaNum._font.fontObjNum;
        if (wordChars.some((c) => c._font && (c._font.type3 || c._font.verticalMode))) ntEntry2.uneditable = true;
        if ((firstAlphaNum.renderMode === 1 || firstAlphaNum.renderMode === 2) && firstAlphaNum.strokeWidthPx > 0) {
          ntEntry2.renderMode = firstAlphaNum.renderMode;
          ntEntry2.strokeWidthPx = round3(firstAlphaNum.strokeWidthPx);
          const strokeRgb = firstAlphaNum.strokeColor ? colorToRgb(firstAlphaNum.strokeColor) : null;
          if (strokeRgb) ntEntry2.strokeColor = rgbToHex(strokeRgb);
        }
        nativeText[wordID] = ntEntry2;
      }
      wordObj.style.font = firstAlphaNum.fontInfo.familyName;
      wordObj.style.bold = firstAlphaNum.fontInfo.bold;
      wordObj.style.italic = firstAlphaNum.fontInfo.italic;
      if (firstAlphaNum.textColor) {
        const rgb = colorToRgb(firstAlphaNum.textColor);
        if (rgb) wordObj.style.color = rgbToHex(rgb);
      }
      if (firstAlphaNum.invisible) {
        wordObj.style.opacity = 0;
      } else if (typeof firstAlphaNum.alpha === "number") {
        wordObj.style.opacity = firstAlphaNum.alpha;
      }
      if (isSup) {
        wordObj.style.size = round3(wordChars[0].fontSize);
        wordObj.style.sup = true;
      } else if (words[wi].dropcap) {
        wordObj.style.size = round3(wordChars[0].fontSize);
        wordObj.style.dropcap = true;
      } else {
        wordObj.style.size = round3(firstAlphaNum.fontSize);
      }
      if (firstAlphaNum.fontInfo.smallCaps) {
        wordObj.style.smallCaps = true;
      } else if (words[wi].smallCapsAlt) {
        if (!/[a-z]/.test(wordObj.text) && /[A-Z].?[A-Z]/.test(wordObj.text)) {
          wordObj.style.smallCaps = true;
          if (words[wi].smallCapsLargeFontSize > 0) {
            wordObj.style.size = round3(words[wi].smallCapsLargeFontSize);
          }
        }
      }
      if (underlineRects.length > 0) {
        const baselineYWord = wordChars[0].y;
        const charColor = wordChars[0].textColor;
        const ruleOverhangLimit = wordChars[0].fontSize * 0.5;
        for (const rect of underlineRects) {
          if (rect.right > wordLeft && rect.left < wordRight && rect.y >= baselineYWord - wordChars[0].fontSize * 0.1 && rect.y <= baselineYWord + wordChars[0].fontSize * 0.35 && rect.left >= lineLeft - ruleOverhangLimit && rect.right <= lineRight + ruleOverhangLimit) {
            if (rect.color && charColor) {
              const rectRgb = colorToRgb(rect.color);
              const charRgb = colorToRgb(charColor);
              const rectGray = rectRgb && Math.max(...rectRgb) - Math.min(...rectRgb) < 0.1;
              const bothDark = rectRgb && charRgb && rectRgb.every((v) => v < 0.3) && charRgb.every((v) => v < 0.3);
              if (rectRgb && charRgb && !bothDark && !rectGray && rectRgb.some((v, ci) => Math.abs(v - charRgb[ci]) > 0.1)) {
                continue;
              }
            }
            wordObj.style.underline = true;
            rect.isUnderline = true;
            break;
          }
        }
      }
      fontSet.add(cleanFamilyName(wordObj.style.font));
      wordObj.chars = wordChars.map((c) => {
        let charTop = Math.round(c.y - c.fontInfo.ascent / 1e3 * c.fontSize);
        let charBottom = Math.round(c.y - c.fontInfo.descent / 1e3 * c.fontSize);
        if (isSup && normalBaselineY !== null) {
          const supBaselineOffset = c.y - normalBaselineY;
          charTop -= Math.round(supBaselineOffset);
          charBottom -= Math.round(supBaselineOffset);
        }
        return new ocr.OcrChar(c.text, {
          left: Math.round(c.x),
          top: charTop,
          right: Math.round(c.x + c.width),
          bottom: charBottom
        });
      });
      const ntEntry = nativeText[wordID];
      if (ntEntry) {
        ntEntry.penX = wordChars.map((c) => round3(c.x));
        if (wordChars.some((c) => c.stretch)) ntEntry.stretch = wordChars.map((c) => c.stretch || 0);
        const placeholderCode = (c) => c._font?.type3 && Number.isInteger(c._charCode) && c.text === String.fromCodePoint(57344 + c._charCode) ? c._charCode : -1;
        if (wordChars.some((c) => placeholderCode(c) >= 0)) ntEntry.codes = wordChars.map(placeholderCode);
      }
      if (wordObj.style.smallCaps && words[wi].smallCapsAlt) {
        const lgFont = words[wi].smallCapsLargeFontSize;
        const wc = words[wi].chars;
        if (lgFont > 0) {
          for (let ci = 0; ci < wordObj.chars.length; ci++) {
            if (wc[ci].fontSize < lgFont * 0.95) {
              wordObj.chars[ci].text = wordObj.chars[ci].text.toLowerCase();
            }
          }
        } else if (words[wi].smallCapsAltTitleCase) {
          wordObj.chars.slice(1).forEach((x) => {
            x.text = x.text.toLowerCase();
          });
        } else {
          wordObj.chars.forEach((x) => {
            x.text = x.text.toLowerCase();
          });
        }
        wordObj.text = wordObj.chars.map((x) => x.text).join("");
      }
      wordObj.text = ocr.replaceLigatures(wordObj.text);
      if (wordChars[0].fontInfo.bold === wordObj.style.bold && wordChars[0].fontInfo.italic === wordObj.style.italic && wordChars[0].fontInfo.smallCaps === wordObj.style.smallCaps) {
        let textOffset = ocr.replaceLigatures(wordChars[0].text).length;
        for (let ci = 1; ci < wordChars.length; ci++) {
          const prevFi = wordChars[ci - 1].fontInfo;
          const fi = wordChars[ci].fontInfo;
          if (fi.bold !== prevFi.bold || fi.italic !== prevFi.italic || fi.smallCaps !== prevFi.smallCaps) {
            const delta = {};
            if (fi.bold !== wordObj.style.bold) delta.bold = fi.bold;
            if (fi.italic !== wordObj.style.italic) delta.italic = fi.italic;
            if (fi.smallCaps !== wordObj.style.smallCaps) delta.smallCaps = fi.smallCaps;
            wordObj.styleRuns = wordObj.styleRuns || [];
            wordObj.styleRuns.push({ i: textOffset, style: delta });
          }
          textOffset += ocr.replaceLigatures(wordChars[ci].text).length;
        }
      }
      lineObj.words.push(wordObj);
    }
    if (lineObj.words.length === 0) continue;
    ocr.updateLineBbox(lineObj);
    pageObj.lines.push(lineObj);
  }
  const angleRisePage = pageObj.lines.filter((l) => l.orientation === 0).map((l) => l.baseline[0]).filter((s) => Math.abs(s) < 0.3);
  const angleRiseMedian = mean50(angleRisePage) || 0;
  pageObj.angle = Math.asin(angleRiseMedian) * (180 / Math.PI);
  const detectedTables = detectTableRegions(
    pageObj,
    paths,
    scale,
    visualHeightPts,
    boxOriginX,
    boxOriginY,
    underlineRects.filter((r) => r.isUnderline)
  );
  const provisionalTables = detectedTables.filter((dt) => dt.provisionalTopOpen);
  const dataTablePage = new LayoutDataTablePage(n);
  for (const dt of detectedTables) {
    if (dt.provisionalTopOpen) continue;
    dataTablePage.tables.push(convertDetectedTable(dt, dataTablePage, pageObj));
  }
  if (pageObj.lines.length > 0) {
    assignParagraphs(pageObj, pageObj.angle);
  }
  return {
    pageObj,
    langSet,
    fontSet,
    wordSignals,
    nativeText,
    dataTablePage,
    provisionalTables,
    fillGlyphBoxes
  };
}
function parseEditFontPayload(payload) {
  if (!payload) return null;
  let font = null;
  if (payload.bytes && !payload.allGlyphsEmpty) {
    try {
      font = opentype.parse(payload.bytes);
    } catch {
      font = null;
    }
  }
  return {
    kind: (
      /** @type {'original'|'rebuilt'|'type3'|'none'} */
      payload.kind
    ),
    font,
    glyphs: payload.glyphs ?? null,
    allGlyphsEmpty: !!payload.allGlyphsEmpty,
    baseName: payload.baseName,
    familyName: payload.familyName,
    bold: !!payload.bold,
    italic: !!payload.italic,
    serifFlag: payload.serifFlag ?? null,
    capHeightPdf: payload.capHeightPdf ?? null,
    xHeightPdf: payload.xHeightPdf ?? null
  };
}
function drawableGlyph(font, ch) {
  const gid = font.charToGlyphIndex(ch);
  if (!(gid > 0)) return null;
  const glyph = font.glyphs.get(gid);
  const drawable = /\s/.test(ch) || !!glyph.isComposite || (glyph.path?.commands || []).some((c) => c.type === "L" || c.type === "C" || c.type === "Q");
  return drawable ? { gid, glyph } : null;
}
const FIT_PROBE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const XH_PROBE = "xonezscuvw";
const CAP_PROBE = "HIEFTLBD";
function medianInkTop(font, chars) {
  const tops = [];
  for (const ch of chars) {
    const d = drawableGlyph(font, ch);
    if (!d) continue;
    try {
      const bb = d.glyph.getBoundingBox();
      if (bb.y2 > bb.y1) tops.push(bb.y2 / font.unitsPerEm);
    } catch {
    }
  }
  if (tops.length < 2) return null;
  tops.sort((a, b) => a - b);
  return tops[Math.floor(tops.length / 2)];
}
function builtInFit(orig, subFont) {
  const f = (
    /** @type {import('../font-parser/src/index.js').Font} */
    orig.font
  );
  const wd = [];
  const ws = [];
  let lowerN = 0;
  for (const ch of FIT_PROBE) {
    const d = drawableGlyph(f, ch);
    if (!d || !(d.glyph.advanceWidth > 0)) continue;
    const sg = subFont.charToGlyphIndex(ch);
    if (!(sg > 0)) continue;
    const sAdv = subFont.glyphs.get(sg).advanceWidth;
    if (!(sAdv > 0)) continue;
    wd.push(d.glyph.advanceWidth / f.unitsPerEm);
    ws.push(sAdv / subFont.unitsPerEm);
    if (/[a-z]/.test(ch)) lowerN += 1;
  }
  let sizeMult = 1;
  const xhS = medianInkTop(subFont, XH_PROBE);
  const capS = medianInkTop(subFont, CAP_PROBE);
  const xhD = lowerN >= 2 ? medianInkTop(f, XH_PROBE) : null;
  const capD = medianInkTop(f, CAP_PROBE);
  if (xhD && xhS) sizeMult = xhD / xhS;
  else if (capD && capS) sizeMult = capD / capS;
  else if (orig.xHeightPdf && orig.xHeightPdf > 200 && xhS) sizeMult = orig.xHeightPdf / 1e3 / xhS;
  else if (orig.capHeightPdf && orig.capHeightPdf > 300 && capS) sizeMult = orig.capHeightPdf / 1e3 / capS;
  sizeMult = Math.min(1.15, Math.max(0.85, sizeMult));
  let stretch = 1;
  let monoAdvEm;
  if (wd.length >= 4) {
    let num = 0;
    let den = 0;
    let min = Infinity;
    let max = 0;
    let sum = 0;
    for (let i = 0; i < wd.length; i++) {
      num += wd[i] * ws[i];
      den += ws[i] * ws[i];
      if (wd[i] < min) min = wd[i];
      if (wd[i] > max) max = wd[i];
      sum += wd[i];
    }
    if (den > 0) {
      const kTotal = num / den;
      if (Math.abs(kTotal - 1) < 0.035 && Math.abs(sizeMult - 1) < 0.06) sizeMult = 1;
      else if (Math.abs(sizeMult - 1) < 0.02) sizeMult = 1;
      stretch = Math.min(1.25, Math.max(0.8, kTotal / sizeMult));
      if (Math.abs(stretch - 1) < 0.02) stretch = 1;
    }
    if (max / min < 1.02) monoAdvEm = sum / wd.length;
  } else if (Math.abs(sizeMult - 1) < 0.02) {
    sizeMult = 1;
  }
  const r = (v) => Math.round(v * 1e4) / 1e4;
  return monoAdvEm !== void 0 ? { sizeMult: r(sizeMult), stretch: r(stretch), monoAdvEm: r(monoAdvEm) } : { sizeMult: r(sizeMult), stretch: r(stretch) };
}
function substituteFaceFor(orig, hints) {
  const baseName = orig?.baseName || "";
  const font = orig?.kind === "type3" ? null : orig?.font;
  const sub = (font ? extendedFamilyToBuiltInFont(baseName, hints) : null) || base14ToBuiltInFont(baseName, hints) || cssFamilyToBuiltInFont(standardFontToCSS(baseName), hints) || genericToBuiltInFont(cssGenericForFontObj({
    baseName,
    familyName: orig?.familyName,
    serifFlag: orig?.serifFlag ?? void 0
  }), hints);
  if (!sub || !sub.variant) return null;
  const styleKey = sub.variant === "Regular" ? "normal" : sub.variant === "Bold" ? "bold" : sub.variant === "Italic" ? "italic" : "boldItalic";
  return { family: sub.family, styleKey };
}
function resolveReplacementChar(ch, orig, style) {
  const codepoint = (
    /** @type {number} */
    ch.codePointAt(0)
  );
  const font = orig?.kind === "type3" ? null : orig?.font;
  if (font) {
    const d = drawableGlyph(font, ch);
    if (d) {
      const advEm = d.glyph.advanceWidth / orig.font.unitsPerEm;
      return {
        kind: "orig",
        codepoint,
        gid: d.gid,
        advEm
      };
    }
  }
  const face = substituteFaceFor(orig, { bold: !!style?.bold, italic: !!style?.italic });
  if (face) {
    const { styleKey } = face;
  }
  return { kind: "tofu", advEm: 0.5 };
}
class PdfCore {
  /** @type {?ObjectCache} */
  #objCache = null;
  /** @type {?ReturnType<typeof getPageObjects>} */
  #pages = null;
  /** @type {?import('./parsePdfDoc.js').LinkDestInfo} */
  #linkDestInfo = null;
  /**
   * Load PDF bytes and parse the document structure.
   * @param {Uint8Array | ArrayBuffer} pdfBytes
   */
  async load(pdfBytes) {
    await this.unload();
    const arr = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    const xrefOffset = findXrefOffset(arr);
    const xrefEntries = parseXref(arr, xrefOffset);
    this.#objCache = new ObjectCache(arr, xrefEntries);
    this.#pages = getPageObjects(this.#objCache);
    this.#linkDestInfo = { objNumToIndex: new Map(this.#pages.map((p, i) => [p.objNum, i])), pages: this.#pages, nameDests: null };
    return {
      pageCount: this.#pages.length,
      pages: this.#pages.map((p) => ({ mediaBox: p.cropBox || p.mediaBox, rotate: p.rotate })),
      // Document outline (bookmarks), page-index-normalized; serializable across the worker boundary.
      outline: parseOutline(this.#objCache, this.#pages),
      // Embedded files and the portfolio collection, a name-tree walk with no stream decoded.
      attachments: parseAttachments(this.#objCache)
    };
  }
  /**
   * Parse a single page for text extraction + type-detection scoring.
   * @param {{ pageIndex: number, dpi: number }} args
   */
  parsePage({ pageIndex, dpi }) {
    if (!this.#objCache || !this.#pages) throw new Error("PDF not loaded");
    return parseSinglePage(this.#pages[pageIndex], this.#objCache, pageIndex, dpi, void 0, this.#linkDestInfo ?? void 0);
  }
  /**
   * @typedef {{ glyphOpMap: GlyphOpMap, pageObj: OcrPage, nativeText: Record<string, NativeTextWord>,
   *   fonts: Map<import('./parsePdfDoc.js').PageFont, { table: ?Map<string, import('./textPatch.js').FontCode>, substitute: ?SubstituteFace }> }} OpMappedPage
   */
  /**
   * @typedef {{ tag: string, font: import('../font-parser/src/index.js').Font, family: string, styleKey: string, sizeMult: number, stretch: number,
   *   metrics: ?{ ascent: number, descent: number } }} SubstituteFace
   */
  /**
   * The last op-mapped pages, keyed by page and the records they were parsed with.
   * An open, its previews and its commit parse the page once, and the parse that verified a commit serves the next open.
   * @type {Map<string, OpMappedPage>}
   */
  #opMappedPages = /* @__PURE__ */ new Map();
  /**
   * Parse a page into its glyph-op map with the given edit records applied to its streams, or take it from the cache.
   * @param {number} pageIndex
   * @param {number} dpi
   * @param {?Array<ContentEdit>} records
   * @returns {Promise<OpMappedPage>}
   */
  async #opMappedPage(pageIndex, dpi, records) {
    if (!this.#objCache || !this.#pages) throw new Error("PDF not loaded");
    const recs = (records || []).filter((r) => r && r.type === "patchText");
    const key = `${pageIndex}:${dpi}:${JSON.stringify(recs)}`;
    const hit = this.#opMappedPages.get(key);
    if (hit) return hit;
    await ensureSubstituteFacesForRecords(this.#objCache, recs);
    const glyphOpMap = {
      stream: { kind: "page" },
      streams: [],
      ops: [],
      words: /* @__PURE__ */ new Map(),
      glyphs: [],
      pageHeightPts: 0,
      scale: 1
    };
    const parsed = parseSinglePage(this.#pages[pageIndex], this.#objCache, pageIndex, dpi, void 0, this.#linkDestInfo ?? void 0, glyphOpMap, recs);
    const entry = {
      glyphOpMap,
      pageObj: parsed.pageObj,
      nativeText: parsed.nativeText,
      fonts: /* @__PURE__ */ new Map()
    };
    this.#opMappedPages.set(key, entry);
    if (this.#opMappedPages.size > 4) this.#opMappedPages.delete(
      /** @type {string} */
      this.#opMappedPages.keys().next().value
    );
    return entry;
  }
  /**
   * The planner's `codeTable` and `substituteFor` for the fonts the found words draw with, each computed once per op-mapped page.
   * @param {OpMappedPage} entry
   * @param {number} pageIndex
   * @param {Array<?import('./textPatch.js').LocatedWord>} found
   */
  async #codeInputs(entry, pageIndex, found) {
    const fontObjs = /* @__PURE__ */ new Set();
    for (const w of found) {
      for (const c of w ? w.chars : []) {
        for (const d of glyphCopies(entry.glyphOpMap, c)) {
          if (d._font) fontObjs.add(d._font);
        }
      }
    }
    for (const fontObj of fontObjs) {
      if (entry.fonts.has(fontObj)) continue;
      if (fontObj.type3 || fontObj.verticalMode) {
        entry.fonts.set(fontObj, { table: null, substitute: null });
        continue;
      }
      let program = null;
      if (Number.isFinite(fontObj.fontObjNum)) {
        let pending = this.#editPrograms.get(fontObj.fontObjNum);
        if (!pending) {
          pending = this.getFontBytes({ fontObjNum: fontObj.fontObjNum, pageIndex }).then((payload) => parseEditFontPayload(payload));
          this.#editPrograms.set(fontObj.fontObjNum, pending);
          pending.catch(() => this.#editPrograms.delete(fontObj.fontObjNum));
        }
        program = await pending;
      }
      const drawable = program && program.font ? (text) => resolveReplacementChar(text, program, {}).kind === "orig" : null;
      const table = fontCodeTable(fontObj, entry.glyphOpMap, drawable);
      let substitute = null;
      const face = substituteFaceFor(program, { bold: !!program?.bold, italic: !!program?.italic });
      if (face) {
        try {
          const font = await loadSubstituteProgram(face.family, face.styleKey);
          const fit = program && program.font ? builtInFit(program, font) : null;
          const sizeMult = fit?.sizeMult ?? 1;
          const metrics = Number.isFinite(fontObj.ascent) && Number.isFinite(fontObj.descent) ? { ascent: Math.round(fontObj.ascent / sizeMult), descent: Math.round(fontObj.descent / sizeMult) } : null;
          const faceEntry = await ensureSubstituteFace(this.#objCache, face.family, face.styleKey, metrics);
          substitute = {
            tag: faceEntry.tag,
            font: faceEntry.font,
            family: face.family,
            styleKey: face.styleKey,
            sizeMult,
            stretch: fit?.stretch ?? 1,
            metrics
          };
        } catch (e) {
          console.warn(`[applyTextEdit] page ${pageIndex + 1}: the substitute face ${face.family}/${face.styleKey} is unavailable: ${e?.message || e}`);
        }
      }
      entry.fonts.set(fontObj, { table, substitute });
    }
    return {
      codeTable: (fontObj) => entry.fonts.get(fontObj)?.table ?? null,
      substituteFor: (fontObj, text) => {
        const fb = entry.fonts.get(fontObj)?.substitute;
        if (!fb || [...text].length !== 1) return null;
        const gid = fb.font.charToGlyphIndex(text);
        if (!(gid > 0)) return null;
        const glyph = fb.font.glyphs.get(gid);
        if (!glyph || !(glyph.advanceWidth >= 0)) return null;
        return {
          tag: fb.tag,
          gid,
          advEm: glyph.advanceWidth / fb.font.unitsPerEm,
          sizeMult: fb.sizeMult,
          stretch: fb.stretch,
          family: fb.family,
          styleKey: fb.styleKey,
          ascent: fb.metrics ? fb.metrics.ascent : void 0,
          descent: fb.metrics ? fb.metrics.descent : void 0
        };
      }
    };
  }
  /**
   * A glyph as the line editor draws it.
   * @param {PositionedChar} c
   * @returns {LineGlyph}
   */
  #lineGlyph(c) {
    const fill = c.textColor ? colorToRgb(c.textColor) : null;
    const g = {
      text: c.text,
      penX: c.x,
      penY: c.y,
      widthPx: c.width,
      sizePx: c.fontSize,
      fontObjNum: Number.isFinite(c._font?.fontObjNum) ? c._font.fontObjNum : null,
      fillColor: fill ? rgbToHex(fill) : "#000000",
      skew: c.skew || 0,
      stretch: c.stretch || 0
    };
    if (c._font?.widthsUnreliable) g.widthsUnreliable = true;
    const face = substituteFaceByObjNum(
      /** @type {ObjectCache} */
      this.#objCache,
      g.fontObjNum
    );
    if (face) g.face = face;
    if ((c.renderMode === 1 || c.renderMode === 2) && c.strokeWidthPx > 0) {
      g.renderMode = c.renderMode;
      g.strokeWidthPx = c.strokeWidthPx;
      const stroke = c.strokeColor ? colorToRgb(c.strokeColor) : null;
      if (stroke) g.strokeColor = rgbToHex(stroke);
    }
    return g;
  }
  /** @type {Map<number, Promise<?import('./glyphResolve.js').EditFontProgram>>} */
  #editPrograms = /* @__PURE__ */ new Map();
  /**
   * The glyphs of a page's words as the content stream draws them.
   * @param {{ pageIndex: number, dpi: number, records: ?Array<ContentEdit>, words: Array<TextEditWordSpec> }} args
   *   `dpi` must be the resolution the words' pens were recorded at.
   * @returns {Promise<LineState>}
   */
  async getLineState({
    pageIndex,
    dpi,
    records,
    words: specs
  }) {
    const { glyphOpMap } = await this.#opMappedPage(pageIndex, dpi, records);
    const located = locateWords(glyphOpMap, specs);
    const words = located.map((found, wi) => found ? { id: specs[wi].id, glyphs: found.chars.map((c) => this.#lineGlyph(c)) } : null);
    let hide = null;
    if (located.every((w) => w)) {
      const { plans } = planTextEdit(glyphOpMap, { kind: "delete", words: specs });
      const { edits, folded } = editsFromPlans(glyphOpMap, plans);
      const foldedIds = new Set(folded.map((r) => r.id));
      hide = [
        ...(records || []).filter((r) => r && !foldedIds.has(r.id)),
        ...[...edits].map(([streamIdx, list]) => (
          /** @type {TextPatch} */
          {
            type: "patchText",
            id: `hide${streamIdx}`,
            stream: glyphOpMap.streams[streamIdx].stream,
            edits: list
          }
        ))
      ];
    }
    return { words, hide };
  }
  /**
   * The glyphs of a line as a replacement of it would draw them, for the editor's preview.
   * @param {{ pageIndex: number, dpi: number, records: ?Array<ContentEdit>, req: import('./textPatch.js').TextEditRequest }} args
   * @returns {Promise<TextEditPreview>}
   */
  async previewTextEdit({
    pageIndex,
    dpi,
    records,
    req
  }) {
    const entry = await this.#opMappedPage(pageIndex, dpi, records);
    const { glyphOpMap } = entry;
    const found = locateWords(glyphOpMap, req.words);
    if (found.some((w) => !w)) return { refused: `The page's stream has no glyphs at the pens of ${req.words.filter((w, i) => !found[i]).map((w) => w.id).join(", ")}.` };
    const {
      plans,
      predictedWords,
      refused,
      faces
    } = planTextEdit(glyphOpMap, { ...req, ...await this.#codeInputs(entry, pageIndex, found) });
    if (refused) return { refused };
    const { scale } = glyphOpMap;
    const extraFonts = faces && faces.length > 0 ? parsePageFonts(`<</Resources<</Font<<${substituteFaceResourceEntries(this.#objCache, [{ type: "patchText", fonts: faces }])}>>>>>>`, this.#objCache) : /* @__PURE__ */ new Map();
    const rewritten = /* @__PURE__ */ new Map();
    for (const [opIdx, plan] of plans) {
      const stream = glyphOpMap.streams[plan.op.streamIdx];
      rewritten.set(opIdx, executeRewrittenOperator(glyphOpMap, plan.op, rewriteShowOperator(plan.op, stream.tokens, plan.actions, plan.pens), extraFonts, scale));
    }
    const untouched = /* @__PURE__ */ new Map();
    for (const chars of glyphOpMap.words.values()) {
      for (const c of chars) {
        if (!c._src) continue;
        const list = untouched.get(c._src.op) || [];
        untouched.set(c._src.op, list);
        list.push(c);
      }
    }
    const poolOf = (opIdx) => {
      const run = rewritten.get(opIdx);
      return run ? { chars: run.chars, ops: run.ops } : { chars: untouched.get(opIdx) || [], ops: glyphOpMap.ops };
    };
    const words = [];
    for (const p of predictedWords || []) {
      const op = glyphOpMap.ops[p.op];
      let { chars: pool, ops } = poolOf(p.op);
      let start = -1;
      let best = Infinity;
      pool.forEach((c, i2) => {
        if (!c._src) return;
        const d = Math.abs(c._src.tx - p.pen[0]) + Math.abs(c._src.ty - p.pen[1]);
        if (d < best) {
          best = d;
          start = i2;
        }
      });
      if (start < 0 || best > 0.5 * Math.abs(op.fontSize)) return { refused: `"${p.text}" has no glyph at its pen in the preview.` };
      const target = p.text.toLowerCase();
      const glyphs = [];
      const opsOf = [];
      let spelled = "";
      let opIdx = p.op;
      let i = start;
      while (spelled.length < target.length) {
        if (i >= pool.length) {
          opIdx += 1;
          if (opIdx >= glyphOpMap.ops.length || glyphOpMap.ops[opIdx].streamIdx !== op.streamIdx) break;
          ({ chars: pool, ops } = poolOf(opIdx));
          i = 0;
          continue;
        }
        const c = pool[i];
        i += 1;
        if (c.text.trim() === "") {
          if (glyphs.length === 0) continue;
          break;
        }
        glyphs.push(c);
        opsOf.push(ops);
        spelled += ocr.replaceLigatures(c.text).toLowerCase();
      }
      if (spelled !== target) return { refused: `"${p.text}" previews as "${spelled}".` };
      if (glyphs.some((c, k) => c._src && !glyphVisible(opsOf[k][c._src.op], c._src))) return { refused: `"${p.text}" would run past the edge of what the page shows.` };
      words.push({ text: p.text, oldId: p.oldId, glyphs: glyphs.map((c) => this.#lineGlyph(c)) });
    }
    return { words };
  }
  /**
   * Turn a deletion or a replacement of a line's words into content-stream patch records.
   * A re-parse of the patched page must show every glyph outside the edit unmoved and a replaced line that reads back as typed, or the edit is refused.
   * @param {{ pageIndex: number, dpi: number, records: ?Array<ContentEdit>, req: import('./textPatch.js').TextEditRequest, groupId?: string }} args
   * @returns {Promise<TextEditResult>}
   */
  async applyTextEdit({
    pageIndex,
    dpi,
    records,
    req,
    groupId
  }) {
    const recs = (records || []).filter((r) => r && r.type === "patchText");
    const before = await this.#opMappedPage(pageIndex, dpi, recs);
    const { glyphOpMap, pageObj: beforePage } = before;
    const foundWords = locateWords(glyphOpMap, req.words);
    const missingIds = req.words.filter((w, i) => !foundWords[i]).map((w) => w.id);
    if (missingIds.length > 0) return { refused: `The page's stream has no glyphs at the pens of ${missingIds.join(", ")}.` };
    const request = req.kind === "replace" ? { ...req, ...await this.#codeInputs(before, pageIndex, foundWords) } : req;
    const {
      plans,
      located,
      twinIds,
      dropped,
      wordGlyphs,
      predictedWords,
      refused,
      faces
    } = planTextEdit(glyphOpMap, request);
    if (refused) return { refused };
    if (plans.size === 0) return { unchanged: true };
    const { edits, folded } = editsFromPlans(glyphOpMap, plans);
    const foldedIds = new Set(folded.map((r) => r.id));
    const fonts = /* @__PURE__ */ new Map();
    for (const r of folded) for (const f of r.fonts || []) fonts.set(recordFaceTag(f), f);
    for (const f of faces || []) {
      fonts.set(f.tag, Number.isFinite(f.ascent) && Number.isFinite(f.descent) ? {
        family: f.family,
        styleKey: f.styleKey,
        ascent: (
          /** @type {number} */
          f.ascent
        ),
        descent: (
          /** @type {number} */
          f.descent
        )
      } : { family: f.family, styleKey: f.styleKey });
    }
    const newRecords = [];
    for (const [streamIdx, list] of edits) {
      const rec = {
        type: "patchText",
        id: getRandomAlphanum(10),
        stream: glyphOpMap.streams[streamIdx].stream,
        edits: list
      };
      if (groupId) rec.groupId = groupId;
      if (fonts.size > 0) rec.fonts = [...fonts.values()];
      newRecords.push(rec);
    }
    const originOf = (map, opIdx) => {
      const op = map.ops[opIdx];
      const seg = segmentAt(map.streams[op.streamIdx].segments, op.start);
      if (!seg) return `${op.streamIdx}:?`;
      return `${op.streamIdx}:${seg.rec ? seg.origStart : seg.origStart + (op.start - seg.start)}`;
    };
    const lineOrigins = /* @__PURE__ */ new Set();
    if (req.kind === "replace") {
      for (const d of wordGlyphs) if (d._src) lineOrigins.add(originOf(glyphOpMap, d._src.op));
      for (const opIdx of plans.keys()) lineOrigins.add(originOf(glyphOpMap, opIdx));
    }
    const touched = /* @__PURE__ */ new Set([...wordGlyphs, ...dropped]);
    if (req.kind === "replace") {
      for (const d of glyphOpMap.glyphs) {
        if (d._src && lineOrigins.has(originOf(glyphOpMap, d._src.op))) touched.add(d);
      }
    }
    const TOL = 0.02;
    const drawnAt = (map, c) => c._src ? drawnPen(map.ops[c._src.op], c._src.tx, c._src.ty) : [c.x, c.y];
    const expected = /* @__PURE__ */ new Map();
    for (const d of glyphOpMap.glyphs) {
      if (touched.has(d)) continue;
      const k = charStateKey(d);
      let list = expected.get(k);
      if (!list) {
        list = [];
        expected.set(k, list);
      }
      list.push({ c: d, at: drawnAt(glyphOpMap, d) });
    }
    const after = await this.#opMappedPage(pageIndex, dpi, [...recs.filter((r) => !foldedIds.has(r.id)), ...newRecords]);
    const kept = /* @__PURE__ */ new Set();
    if (req.kind === "replace") {
      for (const d of after.glyphOpMap.glyphs) {
        if (d._src && lineOrigins.has(originOf(after.glyphOpMap, d._src.op))) kept.add(d);
      }
    }
    const actual = /* @__PURE__ */ new Map();
    for (const d of after.glyphOpMap.glyphs) {
      if (kept.has(d)) continue;
      const k = charStateKey(d);
      let list = actual.get(k);
      if (!list) {
        list = [];
        actual.set(k, list);
      }
      list.push({ c: d, at: drawnAt(after.glyphOpMap, d) });
    }
    const describe = (c) => `"${c.text}" at ${c.x.toFixed(2)},${c.y.toFixed(2)} size ${c.fontSize.toFixed(2)}`;
    for (const [k, list] of expected) {
      const candidates = (actual.get(k) || []).slice();
      for (const e of list) {
        const j = candidates.findIndex((a) => Math.abs(a.at[0] - e.at[0]) <= TOL && Math.abs(a.at[1] - e.at[1]) <= TOL && Math.abs(a.c.fontSize - e.c.fontSize) <= TOL);
        if (j === -1) return { refused: `A glyph outside the edited words changed: ${describe(e.c)} is not drawn there after the edit.` };
        candidates.splice(j, 1);
      }
      if (candidates.length > 0) return { refused: `The patched page draws a glyph the source did not: ${describe(candidates[0].c)}.` };
      actual.delete(k);
    }
    if (actual.size > 0) {
      const [list] = actual.values();
      return { refused: `The patched page draws a glyph the source did not: ${describe(list[0].c)}.` };
    }
    if (req.kind === "delete") {
      const twins = twinIds.map((id) => {
        const chars = (
          /** @type {Array<PositionedChar>} */
          glyphOpMap.words.get(id)
        );
        return { penX: chars.map((c) => Math.round(c.x * 1e3) / 1e3), baselineY: Math.round(chars[0].y * 1e3) / 1e3 };
      });
      return { records: newRecords, foldedIds: [...foldedIds], twins };
    }
    const byId = /* @__PURE__ */ new Map();
    for (const line of after.pageObj.lines) for (const word of line.words) byId.set(word.id, word);
    const byFirstPen = /* @__PURE__ */ new Map();
    for (const [id, chars] of after.glyphOpMap.words) {
      if (chars.length === 0 || !chars[0]._src || !byId.has(id)) continue;
      const pen = drawnPen(after.glyphOpMap.ops[chars[0]._src.op], chars[0]._src.tx, chars[0]._src.ty);
      const key = Math.round(pen[0] * 1e3);
      let list = byFirstPen.get(key);
      if (!list) {
        list = [];
        byFirstPen.set(key, list);
      }
      list.push([id, pen]);
    }
    const PEN_TOL = 5e-3;
    const lineWordIds = [];
    for (const p of predictedWords || []) {
      const pen = drawnPen(glyphOpMap.ops[p.op], p.pen[0], p.pen[1]);
      const k = Math.round(pen[0] * 1e3);
      const candidates = [k - 1, k, k + 1].flatMap((key) => byFirstPen.get(key) || []).filter(([, at]) => Math.abs(at[0] - pen[0]) <= PEN_TOL && Math.abs(at[1] - pen[1]) <= PEN_TOL).map(([id]) => id);
      const hit = candidates.find((id) => (
        /** @type {OcrWord} */
        byId.get(id).text === p.text
      ));
      if (!hit) {
        const found = candidates.map((id) => (
          /** @type {OcrWord} */
          byId.get(id).text
        ));
        return { refused: `"${p.text}" reads back ${found.length ? `as "${found.join('", "')}"` : "as nothing"} at its pen.` };
      }
      lineWordIds.push(hit);
    }
    const afterLine = (
      /** @type {OcrLine} */
      after.pageObj.lines.find((line) => line.words.some((word) => word.id === lineWordIds[0]))
    );
    const split = lineWordIds.find((id) => !afterLine.words.some((word) => word.id === id));
    if (split) return { refused: `The line would split before "${/** @type {OcrWord} */
    byId.get(split).text}".` };
    const penKeyOf = (map, id) => {
      const chars = map.words.get(id);
      if (!chars || chars.length === 0 || !chars[0]._src) return null;
      const pen = drawnPen(map.ops[chars[0]._src.op], chars[0]._src.tx, chars[0]._src.ty);
      return `${Math.round(pen[0] * 100)}:${Math.round(pen[1] * 100)}`;
    };
    const beforeIds = new Set(located.filter((w) => w).map((w) => (
      /** @type {{parseId: string}} */
      w.parseId
    )));
    const beforeLine = beforePage.lines.find((line) => line.words.some((word) => beforeIds.has(word.id)));
    const beforePens = new Set((beforeLine ? beforeLine.words : []).map((word) => penKeyOf(glyphOpMap, word.id)).filter((k) => k));
    const merged = afterLine.words.filter((word) => !lineWordIds.includes(word.id) && !beforePens.has(penKeyOf(after.glyphOpMap, word.id)));
    if (merged.length > 0) return { refused: `The line would merge with the text beside it ("${merged.map((word) => word.text).join(" ")}").` };
    for (const id of lineWordIds) {
      for (const c of after.glyphOpMap.words.get(id) || []) {
        if (c._src && !glyphVisible(after.glyphOpMap.ops[c._src.op], c._src)) return { refused: `"${/** @type {OcrWord} */
        byId.get(id).text}" would run past the edge of what the page shows.` };
      }
    }
    const invisible = lineWordIds.find((id) => !after.nativeText[id]);
    if (invisible) return { refused: `"${/** @type {OcrWord} */
    byId.get(invisible).text}" reads back as text the page does not show.` };
    const lineWords = lineWordIds.map((id, i) => {
      const word = (
        /** @type {OcrWord} */
        byId.get(id)
      );
      return {
        oldId: (
          /** @type {Array<{oldId: ?string}>} */
          predictedWords[i].oldId
        ),
        text: word.text,
        bbox: { ...word.bbox },
        chars: (word.chars || []).map((c) => ({ text: c.text, bbox: { ...c.bbox } })),
        style: { ...word.style },
        lang: word.lang,
        entry: after.nativeText[id]
      };
    });
    return { records: newRecords, foldedIds: [...foldedIds], lineWords };
  }
  /**
   * Render a single page to an image data URL, a JPEG/WebP blob, or a transferable ImageBitmap.
   * @param {{ pageIndex: number, colorMode: string, dpi?: number, targetWidth?: number,
   * outputFormat?: 'png'|'jpeg'|'webp'|'bitmap', quality?: number,
   * edits?: ?RenderEdits }} args - `targetWidth` renders the page exactly that many pixels wide, taking precedence over `dpi`.
   * @returns {Promise<{ dataUrl?: string, blob?: Blob, bitmap?: ImageBitmap, colorMode: string, ok: boolean, failReason?: string, failDetail?: string,
   *   perf?: { prepMs: number, drawMs: number, decodeMs: number, flushMs: number } }>}
   */
  async renderPage({
    pageIndex,
    colorMode,
    dpi,
    targetWidth,
    outputFormat = "png",
    quality = 0.6,
    edits = null
  }) {
    if (!this.#objCache || !this.#pages) throw new Error("PDF not loaded");
    const { renderPdfPageAsImage } = await import("./renderPdfPage-BUhf_3nL.js");
    if (typeof process !== "undefined") await ca.getCanvasNode();
    const page = this.#pages[pageIndex];
    const box = page.cropBox || page.mediaBox;
    if (targetWidth) {
      const widthPts = Math.abs(box[2] - box[0]);
      const heightPts = Math.abs(box[3] - box[1]);
      const visualWidthPts = page.rotate === 90 || page.rotate === 270 ? heightPts : widthPts;
      dpi = 72 * targetWidth / visualWidthPts;
    }
    return renderPdfPageAsImage(page.objText, this.#objCache, box, pageIndex, colorMode, page.rotate, dpi, outputFormat, quality, edits);
  }
  /**
   * Every Type 3 font in the file with the outline hash of the glyph bound to each character code.
   * @returns {{ fonts: Array<{ objNum: number, codes: number[], hashes: Array<?string>, blank: boolean[] }> }}
   *   `hashes[i]` is null when the procedure bound to `codes[i]` could not be read.
   *   `blank[i]` marks a procedure that draws nothing.
   */
  getType3GlyphHashes() {
    if (!this.#objCache) throw new Error("PDF not loaded");
    const fonts = [];
    for (const [objNum, info] of enumerateType3Fonts(this.#objCache)) {
      const codes = [];
      const hashes = [];
      const blank = [];
      for (const [codeStr, name] of Object.entries(info.encoding)) {
        const glyph = info.glyphs[name];
        codes.push(Number(codeStr));
        hashes.push(glyph?.pathHash ?? null);
        blank.push(!glyph || glyph.bbox === null);
      }
      fonts.push({
        objNum,
        codes,
        hashes,
        blank
      });
    }
    return { fonts };
  }
  /**
   * The font program the renderer draws the given embedded font with, plus the cascade inputs native-text editing needs.
   * @param {{ fontObjNum: number, pageIndex?: number }} args - `pageIndex` is a page the font is used on, letting this instance resolve a font from a page it never parsed.
   * @returns {Promise<?{ kind: 'original'|'rebuilt'|'type3'|'none', bytes?: ArrayBuffer, allGlyphsEmpty?: boolean,
   *   glyphs?: Array<{ name: string, codes: number[], text: ?string, pathHash: ?string, hasOutline: boolean }>,
   *   baseName: string, familyName: string, bold: boolean, italic: boolean, serifFlag: boolean|null, capHeightPdf: ?number, xHeightPdf: ?number }>}
   *   `kind: 'none'` means the font has no usable embedded program, so editing must fall back the same way the renderer did.
   *   `kind: 'type3'` is a program built from a Type 3 font's CharProcs, which the Inspect panel draws with but edited text does not.
   *   `glyphs` names each CharProc with the codes that reach it and the text they extract as.
   *   Null means the `fontObjNum` is unknown.
   */
  async getFontBytes({ fontObjNum, pageIndex }) {
    if (!this.#objCache) throw new Error("PDF not loaded");
    let fontObj = this.#objCache.fontCache.get(fontObjNum);
    if (!fontObj && pageIndex !== void 0 && this.#pages?.[pageIndex]) {
      this.parsePage({ pageIndex, dpi: 300 });
      fontObj = this.#objCache.fontCache.get(fontObjNum);
    }
    if (!fontObj) return null;
    if (!this.#objCache.fontBytesCache.has(fontObjNum) && !this.#objCache.fontConversionCache.has(fontObjNum)) {
      const { registerFontForEditing } = await import("./renderPdfPage-BUhf_3nL.js");
      if (typeof process !== "undefined") await ca.getCanvasNode();
      await registerFontForEditing(fontObj, this.#objCache);
    }
    if (fontObj.type3 && !this.#objCache.fontBytesCache.has(fontObjNum)) {
      const t3 = fontObj.type3;
      const overrides = /* @__PURE__ */ new Map();
      const table = [];
      const taken = /* @__PURE__ */ new Set();
      for (const name of Object.keys(t3.charProcObjNums)) {
        const info = t3.glyphs[name];
        const hasOutline = !!(info && info.commands && info.commands.some((c) => c.type === "L" || c.type === "C"));
        const codes = Object.entries(t3.encoding).filter(([, n]) => n === name).map(([c]) => Number(c)).sort((a, b) => a - b);
        const unicodes = [];
        for (const code of codes) {
          const text = fontObj.toUnicode.get(code);
          if (!text || [...text].length !== 1) continue;
          const cp = (
            /** @type {number} */
            text.codePointAt(0)
          );
          if (taken.has(cp)) continue;
          taken.add(cp);
          unicodes.push(cp);
        }
        const advanceWidth = info && info.placeholderD1 && info.bbox && info.bbox.x1 > 0 ? info.bbox.x1 + Math.max(0, info.bbox.x0) : info ? info.advanceWidth : 0;
        overrides.set(name, { unicodes, advanceWidth });
        table.push({
          name,
          codes,
          text: codes.length ? fontObj.toUnicode.get(codes[0]) ?? null : null,
          pathHash: info && info.pathHash || null,
          hasOutline
        });
      }
      const objText = this.#objCache.getObjectText(fontObjNum);
      const built = objText && table.some((g) => g.hasOutline) ? buildType3OpentypeFont(objText, this.#objCache, overrides) : null;
      if (built) {
        const file = built.fontFile;
        this.#objCache.fontBytesCache.set(fontObjNum, { bytes: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), kind: "type3", glyphs: table });
      }
    }
    const meta = {
      baseName: fontObj.baseName,
      familyName: fontObj.familyName,
      bold: !!fontObj.bold,
      italic: !!fontObj.italic,
      serifFlag: fontObj.serifFlag ?? null,
      capHeightPdf: fontObj.capHeightPdf ?? null,
      xHeightPdf: fontObj.xHeightPdf ?? null
    };
    const entry = this.#objCache.fontBytesCache.get(fontObjNum);
    if (!entry) return { kind: "none", ...meta };
    const allGlyphsEmpty = !!(fontObj.allGlyphsEmpty || this.#objCache.fontConversionCache.get(fontObjNum)?.allGlyphsEmpty);
    return {
      kind: entry.kind,
      bytes: entry.bytes.slice(0),
      allGlyphsEmpty,
      ...meta,
      ...entry.glyphs ? { glyphs: entry.glyphs } : {}
    };
  }
  /**
   * The decoded bytes of an embedded file stream (a portfolio member or a plain attachment), by the object number `doc.attachments.files[].objNum` carries.
   * @param {{ objNum: number }} args
   * @returns {?{ bytes: ArrayBuffer }} A fresh buffer, so the postMessage transfer can never detach cached data.
   *   Null when the object is not a readable stream.
   */
  getEmbeddedFileBytes({ objNum }) {
    if (!this.#objCache) throw new Error("PDF not loaded");
    const bytes = this.#objCache.getStreamBytes(objNum);
    if (!bytes) return null;
    return { bytes: bytes.slice().buffer };
  }
  /**
   * Release `_pdf_d${docId}_*` fonts (Node + browser registries) and clear the parsed document state.
   */
  async unload() {
    if (!this.#objCache) return;
    const { docId } = this.#objCache;
    const prefix = `_pdf_d${docId}_`;
    ca.unregisterFontsMatching((name) => name.startsWith(prefix));
    unregisterFontFacesMatching((family) => family.startsWith(prefix));
    const imgCache = this.#objCache.decodedImageCache;
    if (imgCache) {
      for (const entry of imgCache.values()) ca.closeDrawable(entry.bitmap);
      imgCache.clear();
      this.#objCache.decodedImageCacheBytes = 0;
    }
    this.#objCache = null;
    this.#pages = null;
    this.#linkDestInfo = null;
    this.#editPrograms.clear();
    this.#opMappedPages.clear();
  }
}
const parentPort = typeof process === "undefined" ? globalThis : (await import("./__vite-browser-external-Dhvy_jtL.js")).parentPort;
const core = new PdfCore();
async function loadPdfForParsing({ pdfBytes }) {
  return core.load(pdfBytes);
}
async function parsePdfPage(args) {
  return core.parsePage(args);
}
async function renderPdfPage(args) {
  return core.renderPage(args);
}
async function getPdfFontBytes(args) {
  return core.getFontBytes(args);
}
async function getPdfType3GlyphHashes() {
  return core.getType3GlyphHashes();
}
async function getPdfLineState(args) {
  return core.getLineState(args);
}
async function previewPdfTextEdit(args) {
  return core.previewTextEdit(args);
}
async function applyPdfTextEdit(args) {
  return core.applyTextEdit(args);
}
async function getPdfEmbeddedFileBytes(args) {
  return core.getEmbeddedFileBytes(args);
}
async function unloadPdf() {
  return core.unload();
}
if (parentPort) {
  const port = parentPort;
  const handleMessage = async (data) => {
    const func = data[0];
    const args = data[1];
    const id = data[2];
    ({
      loadPdfForParsing,
      parsePdfPage,
      renderPdfPage,
      getPdfFontBytes,
      getPdfType3GlyphHashes,
      getPdfLineState,
      previewPdfTextEdit,
      applyPdfTextEdit,
      getPdfEmbeddedFileBytes,
      unloadPdf
    })[func](args).then((x) => {
      const transfer = typeof ImageBitmap !== "undefined" && x && x.bitmap instanceof ImageBitmap ? [x.bitmap] : x && x.bytes instanceof ArrayBuffer ? [x.bytes] : [];
      port.postMessage({ data: x, id, status: "resolve" }, transfer);
    }).catch((err) => port.postMessage({ data: err, id, status: "reject" }));
  };
  if (typeof process === "undefined") {
    onmessage = (event) => handleMessage(event.data);
  } else {
    port.on("message", handleMessage);
  }
  port.postMessage({ data: "ready", id: 0, status: "resolve" });
}
//# sourceMappingURL=pdfWorker-Cc9J68oB.js.map
