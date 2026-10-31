import { aB as resolveNumArray, a4 as parseTintColorSpace, aC as buildTintLookupTable, e as resolveArrayValue, w as extractDict, n as resolveIntValue, Z as findTopLevelKeyIndex, p as parsePdfLiteralString, a5 as tintComponentsToRGB, A as tokenizeContentStream, F as cmykToRgb, v as decodePdfName, D as matMul, aD as xyzToSRGB, aE as isCombiningOrIndicMark, aF as isDefaultIgnorable, aG as isComplexShapingScript, aH as drawnGlyphNeedsPUA, a6 as decodeTextCodes, aI as cidCodepoint, aw as ca, ai as ensureSubstituteFacesForRecords, J as parsePageFonts, K as substituteFaceResourceEntries, L as getPageContentStreams, M as patchPageContents, aJ as parseHiddenOCMCNames, P as extractPdfAnnotations, f as findRootObjNum, aK as scopeDictKeys, aL as resolveStringValue, C as parseFormMatrix, Y as resolveNumValue, r as resolveDictValue, d as bytesToLatin1, aM as parseGlyphStreamPaths, aN as evaluateFunction, aO as loadFontFace, aP as buildFontFromCFF, aQ as convertType1ToOTFNew, aR as rebuildFontFromGlyphs, aa as base14ToBuiltInFont, ab as cssFamilyToBuiltInFont, ac as standardFontToCSS, ad as genericToBuiltInFont, ae as cssGenericForFontObj, aS as FALLBACK_CHAIN, aT as parseSeparationTint, aU as parseFunction, aV as isFormOCHidden, aW as textPatchesTarget, $ as applyTextPatchRecords, aX as applyStandardFontWidths, aY as tintSamplesToRgb, aZ as zlibInflate, a_ as inflatePartial, a$ as applyPredictor } from "./base14Substitution-CpDFdGXj.js";
function parseTransparencyGroup(formObjText, objCache) {
  let groupText = null;
  const groupRefMatch = /\/Group\s+(\d+)\s+\d+\s+R/.exec(formObjText);
  if (groupRefMatch) {
    groupText = objCache.getObjectText(Number(groupRefMatch[1])) || null;
  } else {
    const groupIdx = formObjText.indexOf("/Group");
    if (groupIdx !== -1) {
      const afterGroup = formObjText.substring(groupIdx + 6);
      const dictStartRel = afterGroup.indexOf("<<");
      if (dictStartRel !== -1) {
        groupText = extractDict(formObjText, groupIdx + 6 + dictStartRel);
      }
    }
  }
  if (!groupText || !/\/S\s*\/Transparency\b/.test(groupText)) return null;
  return {
    isolated: /\/I\s*true\b/.test(groupText),
    knockout: /\/K\s*true\b/.test(groupText)
  };
}
function parsePageImages(pageObjText, objCache, options = {}) {
  const images = /* @__PURE__ */ new Map();
  const forms = /* @__PURE__ */ new Map();
  const recurseForms = options.recurseForms !== false;
  const maxDepth = Number.isFinite(options.maxDepth) ? Number(options.maxDepth) : 5;
  extractXObjectsFromResources(pageObjText, objCache, "", images, forms, 0, /* @__PURE__ */ new Set(), { recurseForms, maxDepth });
  return { images, forms };
}
function extractXObjectsFromResources(objText, objCache, prefix, images, forms, depth, visitedFormObjNums, options) {
  if (depth > options.maxDepth) return;
  let resourcesText = objText;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(objText);
  if (resRefMatch) {
    const resObj = objCache.getObjectText(Number(resRefMatch[1]));
    if (resObj) resourcesText = resObj;
  } else {
    const resInlineIdx = objText.indexOf("/Resources");
    if (resInlineIdx !== -1) {
      const afterRes = objText.substring(resInlineIdx + 10).trim();
      if (afterRes.startsWith("<<")) {
        const resDictText = extractDict(objText, resInlineIdx + 10 + objText.substring(resInlineIdx + 10).indexOf("<<"));
        if (resDictText) resourcesText = resDictText;
      }
    }
  }
  const xobjStart = resourcesText.indexOf("/XObject");
  if (xobjStart === -1) return;
  let xobjDictText;
  const afterXObj = resourcesText.substring(xobjStart + 8).trim();
  if (afterXObj.startsWith("<<")) {
    xobjDictText = extractDict(
      resourcesText,
      xobjStart + 8 + resourcesText.substring(xobjStart + 8).indexOf("<<")
    );
  } else {
    const xobjRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterXObj);
    if (xobjRefMatch) {
      const xObj = objCache.getObjectText(Number(xobjRefMatch[1]));
      if (xObj) xobjDictText = xObj;
    }
  }
  if (!xobjDictText) return;
  const entryRegex = /\/([^\s/]*)\s+(\d+)\s+\d+\s+R/g;
  const entries = [...xobjDictText.matchAll(entryRegex)];
  for (const entry of entries) {
    const tag = entry[1];
    const objNum = Number(entry[2]);
    const entryObjText = objCache.getObjectText(objNum);
    if (!entryObjText) continue;
    if (/\/Subtype\s*\/Image/.test(entryObjText)) {
      const info = parseImageObject(entryObjText, objNum, objCache);
      if (info) images.set(prefix + tag, info);
    } else if (/\/Subtype\s*\/Form/.test(entryObjText)) {
      const formEntry = { tag, objNum };
      const bboxStr = resolveArrayValue(entryObjText, "BBox", objCache);
      if (bboxStr) {
        formEntry.bbox = bboxStr.split(/\s+/).map(Number);
      }
      const transparencyGroup = parseTransparencyGroup(entryObjText, objCache);
      if (transparencyGroup) formEntry.transparencyGroup = transparencyGroup;
      forms.set(prefix + tag, formEntry);
      if (options.recurseForms && !visitedFormObjNums.has(objNum)) {
        visitedFormObjNums.add(objNum);
        extractXObjectsFromResources(
          entryObjText,
          objCache,
          `${prefix}${tag}/`,
          images,
          forms,
          depth + 1,
          visitedFormObjNums,
          options
        );
      }
    }
  }
}
function readTopLevelInt(objText, key, dflt, objCache) {
  const dictStart = objText.indexOf("<<");
  const dictBody = dictStart >= 0 ? extractDict(objText, dictStart).slice(2, -2) : objText;
  const idx = findTopLevelKeyIndex(dictBody, key);
  if (idx < 0) return dflt;
  const after = dictBody.slice(idx + key.length);
  const refMatch = /^\s+(\d+)\s+\d+\s+R/.exec(after);
  if (refMatch) {
    const refObjText = objCache.getObjectText(Number(refMatch[1]));
    const val = refObjText && /(\d+)/.exec(refObjText);
    return val ? Number(val[1]) : dflt;
  }
  const direct = /^\s+(\d+)/.exec(after);
  return direct ? Number(direct[1]) : dflt;
}
function parseImageObject(objText, objNum, objCache) {
  const width = readTopLevelInt(objText, "/Width", 0, objCache);
  const height = readTopLevelInt(objText, "/Height", 0, objCache);
  if (width === 0 || height === 0) return null;
  const bitsPerComponent = readTopLevelInt(objText, "/BitsPerComponent", 8, objCache);
  const imageMask = /\/ImageMask\s+true/.test(objText);
  const colorSpace = imageMask ? "DeviceGray" : parseColorSpace(objText, objCache);
  const iccProfileObjNum = imageMask ? null : findICCProfileObjNum(objText, objCache);
  const iccTransform = iccProfileObjNum ? parseICCProfile(iccProfileObjNum, objCache) : null;
  const filter = parseFilter(objText, objCache);
  const imgDecode = resolveNumArray(objText, "Decode", objCache, null);
  const decodeInvert = imgDecode != null && imgDecode.length >= 2 && imgDecode[0] > imgDecode[1];
  const imageData = null;
  let palette = null;
  let paletteBase = null;
  let paletteHival = null;
  if (colorSpace === "Indexed") {
    let csText = objText;
    let csObjNum = null;
    const csRefMatch = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(objText);
    if (csRefMatch) {
      csObjNum = Number(csRefMatch[1]);
      const csObj = objCache.getObjectText(csObjNum);
      if (csObj) csText = csObj;
    }
    const idxResult = parseIndexedColorSpace(csText, objCache, csObjNum || objNum);
    if (idxResult) {
      palette = idxResult.palette;
      paletteBase = idxResult.base;
      paletteHival = idxResult.hival;
    }
  }
  let separationTintSamples = null;
  if (colorSpace === "Separation") {
    let csText = objText;
    const csRefMatch2 = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(objText);
    if (csRefMatch2) {
      const csObj = objCache.getObjectText(Number(csRefMatch2[1]));
      if (csObj) csText = csObj;
    }
    const parsedTintCS = parseTintColorSpace(csText, objCache);
    if (parsedTintCS.tintFn && parsedTintCS.nInputs === 1) {
      separationTintSamples = buildTintLookupTable(parsedTintCS);
    }
  }
  let deviceNTintCS = null;
  if (colorSpace === "DeviceN") {
    let csText = objText;
    const csRefMatchDN = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(objText);
    if (csRefMatchDN) {
      const csObj = objCache.getObjectText(Number(csRefMatchDN[1]));
      if (csObj) csText = csObj;
    }
    const parsedTintCS = parseTintColorSpace(csText, objCache);
    if (parsedTintCS.tintFn && parsedTintCS.nInputs >= 1) deviceNTintCS = parsedTintCS;
  }
  let labWhitePoint = null;
  let labRange = null;
  if (colorSpace === "Lab") {
    let csText = objText;
    const csRefMatch3 = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(objText);
    if (csRefMatch3) {
      const csObj = objCache.getObjectText(Number(csRefMatch3[1]));
      if (csObj) csText = csObj;
    }
    const wpStr = resolveArrayValue(csText, "WhitePoint", objCache);
    if (wpStr) {
      labWhitePoint = wpStr.split(/\s+/).map(Number);
    }
    const rangeStr = resolveArrayValue(csText, "Range", objCache);
    if (rangeStr) {
      const rangeNums = rangeStr.split(/\s+/).map(Number);
      if (rangeNums.length >= 4) labRange = [rangeNums[0], rangeNums[1], rangeNums[2], rangeNums[3]];
    }
  }
  let sMask = null;
  let sMaskWidth = null;
  let sMaskHeight = null;
  let sMaskDecodeInvert = false;
  let colorKeyMask = null;
  const colorKeyContent = resolveArrayValue(objText, "Mask", objCache);
  if (colorKeyContent != null && /^[\d\s]+$/.test(colorKeyContent)) {
    colorKeyMask = colorKeyContent.trim().split(/\s+/).map(Number);
  }
  const sMaskRefMatch = /\/SMask\s+(\d+)\s+\d+\s+R/.exec(objText);
  const explicitMaskRefMatch = !sMaskRefMatch && colorKeyMask == null ? /\/Mask\s+(\d+)\s+\d+\s+R/.exec(objText) : null;
  const maskRefMatch = sMaskRefMatch || explicitMaskRefMatch;
  if (maskRefMatch) {
    const sMaskObjNum = Number(maskRefMatch[1]);
    const sMaskObjText = objCache.getObjectText(sMaskObjNum);
    if (sMaskObjText) {
      sMaskWidth = readTopLevelInt(sMaskObjText, "/Width", 0, objCache);
      sMaskHeight = readTopLevelInt(sMaskObjText, "/Height", 0, objCache);
      sMask = objCache.getStreamBytes(sMaskObjNum);
      if (sMask && sMaskWidth && sMaskHeight) {
        const isImageMask = /\/ImageMask\s+true/.test(sMaskObjText);
        const smBpc = readTopLevelInt(sMaskObjText, "/BitsPerComponent", isImageMask ? 1 : 8, objCache);
        if (smBpc === 1) {
          const unpacked = new Uint8Array(sMaskWidth * sMaskHeight);
          const rowBytes = Math.ceil(sMaskWidth / 8);
          for (let y = 0; y < sMaskHeight; y++) {
            let o = y * sMaskWidth;
            let r = y * rowBytes;
            let x = 0;
            for (; x + 8 <= sMaskWidth; x += 8) {
              const b = sMask[r++];
              unpacked[o++] = (b >> 7 & 1) * 255;
              unpacked[o++] = (b >> 6 & 1) * 255;
              unpacked[o++] = (b >> 5 & 1) * 255;
              unpacked[o++] = (b >> 4 & 1) * 255;
              unpacked[o++] = (b >> 3 & 1) * 255;
              unpacked[o++] = (b >> 2 & 1) * 255;
              unpacked[o++] = (b >> 1 & 1) * 255;
              unpacked[o++] = (b & 1) * 255;
            }
            if (x < sMaskWidth) {
              const b = sMask[r];
              for (; x < sMaskWidth; x++) unpacked[o++] = (b >> 7 - (x & 7) & 1) * 255;
            }
          }
          sMask = unpacked;
        }
        const isExplicitMask = !!explicitMaskRefMatch;
        const maskDecode = resolveNumArray(sMaskObjText, "Decode", objCache, null);
        const decodeInverted = maskDecode != null && maskDecode.length >= 2 && maskDecode[0] > maskDecode[1];
        const shouldInvert = isExplicitMask && isImageMask && !decodeInverted || !isExplicitMask && decodeInverted;
        let sMaskFilter = parseFilter(sMaskObjText);
        if (!sMaskFilter) {
          const sMaskFilterRef = /\/Filter\s+(\d+)\s+\d+\s+R/.exec(sMaskObjText);
          const sMaskFilterText = sMaskFilterRef ? objCache.getObjectText(Number(sMaskFilterRef[1])) : null;
          if (sMaskFilterText) sMaskFilter = parseFilter(`/Filter ${sMaskFilterText}`);
        }
        if (shouldInvert && (sMaskFilter === "DCTDecode" || sMaskFilter === "JPXDecode")) {
          sMaskDecodeInvert = true;
        } else if (shouldInvert) {
          const inverted = new Uint8Array(sMask.length);
          for (let j = 0; j < sMask.length; j++) inverted[j] = 255 - sMask[j];
          sMask = inverted;
        }
      }
    }
  }
  return {
    width,
    height,
    bitsPerComponent,
    colorSpace,
    filter,
    imageData,
    sMask,
    sMaskWidth,
    sMaskHeight,
    sMaskDecodeInvert,
    palette,
    paletteBase,
    paletteHival,
    imageMask,
    decodeInvert,
    separationTintSamples,
    deviceNTintCS,
    iccProfileObjNum,
    iccTransform,
    labWhitePoint,
    labRange,
    colorKeyMask,
    objNum
  };
}
function parseColorSpace(objText, objCache) {
  const nameMatch = /\/ColorSpace\s*\/(\w+)/.exec(objText);
  if (nameMatch) return nameMatch[1];
  const arrayMatch = /\/ColorSpace\s*\[\s*\/(\w+)/.exec(objText);
  if (arrayMatch) {
    if (arrayMatch[1] === "DeviceN") {
      return classifyDeviceN(objText);
    }
    if (arrayMatch[1] === "ICCBased" && objCache) {
      return resolveICCBased(objText, objCache);
    }
    return arrayMatch[1];
  }
  if (objCache) {
    const refMatch = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(objText);
    if (refMatch) {
      const csObjText = objCache.getObjectText(Number(refMatch[1]));
      if (csObjText) {
        const csArrayMatch = /\/(\w+)/.exec(csObjText);
        if (csArrayMatch) {
          if (csArrayMatch[1] === "DeviceN") {
            return classifyDeviceN(csObjText);
          }
          if (csArrayMatch[1] === "ICCBased") {
            return resolveICCBased(csObjText, objCache);
          }
          return csArrayMatch[1];
        }
      }
    }
  }
  return "DeviceRGB";
}
function parseICCProfile(profileObjNum, objCache) {
  const cache = objCache.iccProfileCache;
  if (cache.has(profileObjNum)) return cache.get(profileObjNum) || null;
  const streamBytes = objCache.getStreamBytes(profileObjNum);
  if (!streamBytes || streamBytes.length < 132) {
    cache.set(profileObjNum, null);
    return null;
  }
  const d = streamBytes;
  if (d[36] !== 97 || d[37] !== 99 || d[38] !== 115 || d[39] !== 112) {
    cache.set(profileObjNum, null);
    return null;
  }
  const csBytes = String.fromCharCode(d[16], d[17], d[18], d[19]);
  if (csBytes.trim() !== "RGB") {
    cache.set(profileObjNum, null);
    return null;
  }
  const tagCount = d[128] << 24 | d[129] << 16 | d[130] << 8 | d[131];
  if (tagCount < 1 || tagCount > 100) {
    cache.set(profileObjNum, null);
    return null;
  }
  const tags = {};
  for (let i = 0; i < tagCount; i++) {
    const off = 132 + i * 12;
    if (off + 12 > d.length) break;
    const sig = String.fromCharCode(d[off], d[off + 1], d[off + 2], d[off + 3]);
    const tagOff = d[off + 4] << 24 | d[off + 5] << 16 | d[off + 6] << 8 | d[off + 7];
    const tagSize = d[off + 8] << 24 | d[off + 9] << 16 | d[off + 10] << 8 | d[off + 11];
    tags[sig] = { offset: tagOff, size: tagSize };
  }
  const readXYZ = (tag) => {
    if (!tag || tag.offset + 20 > d.length) return null;
    const o = tag.offset + 8;
    const buf = new DataView(d.buffer, d.byteOffset);
    return [buf.getInt32(o) / 65536, buf.getInt32(o + 4) / 65536, buf.getInt32(o + 8) / 65536];
  };
  const rXYZ = readXYZ(tags.rXYZ);
  const gXYZ = readXYZ(tags.gXYZ);
  const bXYZ = readXYZ(tags.bXYZ);
  if (!rXYZ || !gXYZ || !bXYZ) {
    cache.set(profileObjNum, null);
    return null;
  }
  const matrix = [
    rXYZ[0],
    gXYZ[0],
    bXYZ[0],
    rXYZ[1],
    gXYZ[1],
    bXYZ[1],
    rXYZ[2],
    gXYZ[2],
    bXYZ[2]
  ];
  const readGamma = (tag) => {
    if (!tag || tag.offset + 12 > d.length) return 2.2;
    const buf = new DataView(d.buffer, d.byteOffset);
    const count = buf.getUint32(tag.offset + 8);
    if (count === 0) return 1;
    if (count === 1) return buf.getUint16(tag.offset + 12) / 256;
    return 2.2;
  };
  const gamma = [
    readGamma(tags.rTRC),
    readGamma(tags.gTRC),
    readGamma(tags.bTRC)
  ];
  const result = { gamma, matrix };
  cache.set(profileObjNum, result);
  return result;
}
function findICCProfileObjNum(objText, objCache) {
  const csContent = resolveArrayValue(objText, "ColorSpace", objCache);
  const iccMatch = csContent ? /^\/ICCBased\s+(\d+)\s+\d+\s+R/.exec(csContent) : null;
  return iccMatch ? Number(iccMatch[1]) : null;
}
function resolveICCBased(csText, objCache) {
  const iccRefMatch = /\/ICCBased\s+(\d+)\s+\d+\s+R/.exec(csText);
  if (iccRefMatch) {
    const iccObjText = objCache.getObjectText(Number(iccRefMatch[1]));
    if (iccObjText) {
      const n = resolveIntValue(iccObjText, "N", objCache, 3);
      return n === 1 ? "DeviceGray" : n === 4 ? "DeviceCMYK" : "DeviceRGB";
    }
  }
  return "DeviceRGB";
}
function convertTintPalette(palette, baseObjText, objCache) {
  const parsedTintCS = parseTintColorSpace(baseObjText, objCache);
  if (!parsedTintCS.tintFn || parsedTintCS.nInputs < 1) return null;
  const nComp = parsedTintCS.nInputs;
  const nColors = Math.floor(palette.length / nComp);
  if (nColors === 0) return null;
  const rgbPalette = new Uint8Array(nColors * 3);
  const inputs = new Array(nComp);
  for (let ci = 0; ci < nColors; ci++) {
    for (let c = 0; c < nComp; c++) inputs[c] = palette[ci * nComp + c] / 255;
    const rgb = tintComponentsToRGB(parsedTintCS, inputs);
    if (!rgb) return null;
    rgbPalette[ci * 3] = rgb[0];
    rgbPalette[ci * 3 + 1] = rgb[1];
    rgbPalette[ci * 3 + 2] = rgb[2];
  }
  return rgbPalette;
}
function parseIndexedColorSpace(rawCsText, objCache, objNum = null) {
  const csText = rawCsText.replace(/%[^\r\n]*/g, "");
  let paletteBase = null;
  let paletteHival = 0;
  let palette = null;
  let baseObjText = null;
  const directStreamMatch = /\/Indexed\s*\/(\w+)\s+(\d+)\s+(\d+)\s+\d+\s+R/.exec(csText);
  if (directStreamMatch) {
    paletteBase = directStreamMatch[1];
    paletteHival = Number(directStreamMatch[2]);
    const palObjNum = Number(directStreamMatch[3]);
    palette = objCache.getStreamBytes(palObjNum) || readIndirectLiteralPalette(objCache, palObjNum);
  }
  if (!palette) {
    const refStreamMatch = /\/Indexed\s+(\d+)\s+\d+\s+R\s+(\d+)\s+(\d+)\s+\d+\s+R/.exec(csText);
    if (refStreamMatch) {
      const baseObjNum = Number(refStreamMatch[1]);
      paletteHival = Number(refStreamMatch[2]);
      const palObjNum = Number(refStreamMatch[3]);
      palette = objCache.getStreamBytes(palObjNum) || readIndirectLiteralPalette(objCache, palObjNum);
      baseObjText = objCache.getObjectText(baseObjNum);
      if (baseObjText) {
        const m = /\/(\w+)/.exec(baseObjText);
        if (m) paletteBase = m[1];
      }
    }
  }
  if (!palette) {
    const arrBaseMatch = /\/Indexed\s*\[/.exec(csText);
    if (arrBaseMatch) {
      const arrStart = arrBaseMatch.index + arrBaseMatch[0].length;
      let depth = 1;
      let arrEnd = arrStart;
      while (arrEnd < csText.length && depth > 0) {
        if (csText[arrEnd] === "[") depth++;
        else if (csText[arrEnd] === "]") depth--;
        if (depth > 0) arrEnd++;
      }
      const baseArr = csText.substring(arrStart, arrEnd);
      const baseNameMatch = /\/(\w+)/.exec(baseArr);
      if (baseNameMatch) {
        const afterArr = csText.substring(arrEnd + 1).trim();
        const streamAfterArr = /^(\d+)\s+(\d+)\s+\d+\s+R/.exec(afterArr);
        const hexAfterArr = !streamAfterArr ? /^(\d+)\s*<([0-9a-fA-F\s]+)>/.exec(afterArr) : null;
        if (streamAfterArr) {
          paletteBase = baseNameMatch[1];
          baseObjText = baseArr;
          paletteHival = Number(streamAfterArr[1]);
          const palObjNum = Number(streamAfterArr[2]);
          palette = objCache.getStreamBytes(palObjNum) || readIndirectLiteralPalette(objCache, palObjNum);
        } else if (hexAfterArr) {
          paletteBase = baseNameMatch[1];
          baseObjText = baseArr;
          paletteHival = Number(hexAfterArr[1]);
          const hex = hexAfterArr[2].replace(/\s+/g, "");
          palette = new Uint8Array(hex.length / 2);
          for (let i = 0; i < palette.length; i++) palette[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
          palette = objCache.decryptObjectStringBytes(palette, objNum);
        } else {
          const litAfterArr = /^(\d+)\s*\(/.exec(afterArr);
          const litMatch = litAfterArr ? /\/Indexed[\s\S]*?\d+\s*\(/.exec(rawCsText) : null;
          if (litMatch) {
            paletteBase = baseNameMatch[1];
            baseObjText = baseArr;
            paletteHival = Number(litAfterArr[1]);
            palette = parseLiteralPalette(rawCsText, litMatch, objCache, objNum);
          }
        }
      }
    }
  }
  if (!palette) {
    const litDirectMatch = /\/Indexed\s*\/(\w+)\s+(\d+)\s*\(/.exec(rawCsText);
    if (litDirectMatch) {
      paletteBase = litDirectMatch[1];
      paletteHival = Number(litDirectMatch[2]);
      palette = parseLiteralPalette(rawCsText, litDirectMatch, objCache, objNum);
    }
  }
  if (!palette) {
    const litRefMatch = /\/Indexed\s+(\d+)\s+\d+\s+R\s+(\d+)\s*\(/.exec(rawCsText);
    if (litRefMatch) {
      const baseObjNum = Number(litRefMatch[1]);
      paletteHival = Number(litRefMatch[2]);
      baseObjText = objCache.getObjectText(baseObjNum);
      if (baseObjText) {
        const m = /\/(\w+)/.exec(baseObjText);
        if (m) paletteBase = m[1];
      }
      palette = parseLiteralPalette(rawCsText, litRefMatch, objCache, objNum);
    }
  }
  if (!palette) {
    const hexDirectMatch = /\/Indexed\s*\/(\w+)\s+(\d+)\s*<([0-9a-fA-F\s]+)>/.exec(csText);
    if (hexDirectMatch) {
      paletteBase = hexDirectMatch[1];
      paletteHival = Number(hexDirectMatch[2]);
      const hex = hexDirectMatch[3].replace(/\s+/g, "");
      palette = new Uint8Array(hex.length / 2);
      for (let i = 0; i < palette.length; i++) palette[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      palette = objCache.decryptObjectStringBytes(palette, objNum);
    }
  }
  if (!palette) {
    const hexRefMatch = /\/Indexed\s+(\d+)\s+\d+\s+R\s+(\d+)\s*<([0-9a-fA-F\s]+)>/.exec(csText);
    if (hexRefMatch) {
      const baseObjNum = Number(hexRefMatch[1]);
      paletteHival = Number(hexRefMatch[2]);
      const hex = hexRefMatch[3].replace(/\s+/g, "");
      palette = new Uint8Array(hex.length / 2);
      for (let i = 0; i < palette.length; i++) palette[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      palette = objCache.decryptObjectStringBytes(palette, objNum);
      baseObjText = objCache.getObjectText(baseObjNum);
      if (baseObjText) {
        const m = /\/(\w+)/.exec(baseObjText);
        if (m) paletteBase = m[1];
      }
    }
  }
  if (!palette || !paletteBase) return null;
  if (paletteBase === "CalRGB") paletteBase = "DeviceRGB";
  else if (paletteBase === "CalGray") paletteBase = "DeviceGray";
  if (paletteBase === "ICCBased") {
    const iccSrc = baseObjText || csText;
    const iccRefMatch = /(\d+)\s+\d+\s+R/.exec(iccSrc);
    if (iccRefMatch) {
      const iccObjText = objCache.getObjectText(Number(iccRefMatch[1]));
      const n = iccObjText ? resolveIntValue(iccObjText, "N", objCache, 3) : 3;
      paletteBase = n === 1 ? "DeviceGray" : n === 4 ? "DeviceCMYK" : "DeviceRGB";
    } else {
      paletteBase = "DeviceRGB";
    }
  }
  if ((paletteBase === "Separation" || paletteBase === "DeviceN") && baseObjText) {
    const converted = convertTintPalette(palette, baseObjText, objCache);
    if (converted) {
      palette = converted;
      paletteBase = "DeviceRGB";
    }
  }
  if (paletteBase === "Lab" && baseObjText) {
    const rangeStr = resolveArrayValue(baseObjText, "Range", objCache);
    const rangeNums = rangeStr ? rangeStr.split(/\s+/).map(Number) : null;
    const aMin = rangeNums && rangeNums.length >= 4 ? rangeNums[0] : -100;
    const aMax = rangeNums && rangeNums.length >= 4 ? rangeNums[1] : 100;
    const bMin = rangeNums && rangeNums.length >= 4 ? rangeNums[2] : -100;
    const bMax = rangeNums && rangeNums.length >= 4 ? rangeNums[3] : 100;
    const wpStr = resolveArrayValue(baseObjText, "WhitePoint", objCache);
    const wpNums = wpStr ? wpStr.split(/\s+/).map(Number) : null;
    const wp = wpNums && wpNums.length >= 3 ? [wpNums[0], wpNums[1], wpNums[2]] : [0.9642, 1, 0.8249];
    const nEntries = Math.floor(palette.length / 3);
    const rgbPalette = new Uint8Array(nEntries * 3);
    const delta = 6 / 29;
    const fInv = (ft) => ft > delta ? ft * ft * ft : 3 * delta * delta * (ft - 4 / 29);
    const gammaEnc = (v) => v <= 31308e-7 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    for (let i = 0; i < nEntries; i++) {
      const Lstar = palette[i * 3] / 255 * 100;
      const astar = palette[i * 3 + 1] / 255 * (aMax - aMin) + aMin;
      const bstar = palette[i * 3 + 2] / 255 * (bMax - bMin) + bMin;
      const fy = (Lstar + 16) / 116;
      const fx = fy + astar / 500;
      const fz = fy - bstar / 200;
      const xyzX = wp[0] * fInv(fx);
      const xyzY = wp[1] * fInv(fy);
      const xyzZ = wp[2] * fInv(fz);
      const lr = 3.1338561 * xyzX - 1.6168667 * xyzY - 0.4906146 * xyzZ;
      const lg = -0.9787684 * xyzX + 1.9161415 * xyzY + 0.033454 * xyzZ;
      const lb = 0.0719453 * xyzX - 0.2289914 * xyzY + 1.4052427 * xyzZ;
      rgbPalette[i * 3] = Math.max(0, Math.min(255, Math.round(255 * gammaEnc(Math.max(0, Math.min(1, lr))))));
      rgbPalette[i * 3 + 1] = Math.max(0, Math.min(255, Math.round(255 * gammaEnc(Math.max(0, Math.min(1, lg))))));
      rgbPalette[i * 3 + 2] = Math.max(0, Math.min(255, Math.round(255 * gammaEnc(Math.max(0, Math.min(1, lb))))));
    }
    palette = rgbPalette;
    paletteBase = "DeviceRGB";
  }
  return { palette, hival: paletteHival, base: paletteBase };
}
function readIndirectLiteralPalette(objCache, objNum) {
  const entry = objCache.xrefEntries[objNum];
  if (entry && entry.type === 1) {
    const pdfBytes = objCache.pdfBytes;
    const endSearch = Math.min(entry.offset + 5e3, pdfBytes.length);
    for (let i = entry.offset; i < endSearch; i++) {
      if (pdfBytes[i] === 40) {
        return objCache.decryptObjectStringBytes(parsePdfLiteralString(pdfBytes, i).value, objNum);
      }
      if (pdfBytes[i] === 60 || pdfBytes[i] === 47) return null;
    }
  }
  const text = objCache.getObjectText(objNum);
  if (!text) return null;
  const parenIdx = text.indexOf("(");
  if (parenIdx < 0) return null;
  const bytes = [];
  let depth = 1;
  for (let i = parenIdx + 1; i < text.length && depth > 0; i++) {
    const c = text.charCodeAt(i);
    if (c === 92) {
      i++;
      if (i >= text.length) break;
      const nc = text.charCodeAt(i);
      if (nc === 110) bytes.push(10);
      else if (nc === 114) bytes.push(13);
      else if (nc === 116) bytes.push(9);
      else if (nc === 98) bytes.push(8);
      else if (nc === 102) bytes.push(12);
      else if (nc === 13) {
        if (i + 1 < text.length && text.charCodeAt(i + 1) === 10) i++;
      } else if (nc === 10) ;
      else if (nc >= 48 && nc <= 55) {
        let oct = String.fromCharCode(nc);
        if (i + 1 < text.length && text.charCodeAt(i + 1) >= 48 && text.charCodeAt(i + 1) <= 55) oct += text[++i];
        if (i + 1 < text.length && text.charCodeAt(i + 1) >= 48 && text.charCodeAt(i + 1) <= 55) oct += text[++i];
        bytes.push(parseInt(oct, 8));
      } else {
        bytes.push(nc);
      }
    } else if (c === 40) {
      depth++;
      bytes.push(c);
    } else if (c === 41) {
      depth--;
      if (depth > 0) bytes.push(c);
    } else {
      bytes.push(c);
    }
  }
  return new Uint8Array(bytes);
}
function parseLiteralPalette(csText, regexMatch, objCache, objNum) {
  if (objNum != null) {
    const entry = objCache.xrefEntries[objNum];
    if (entry && entry.type === 1) {
      const objOffset = entry.offset;
      const pdfBytes = objCache.pdfBytes;
      const endSearch = Math.min(objOffset + 5e3, pdfBytes.length);
      let parenPos = -1;
      for (let si = objOffset; si < endSearch; si++) {
        if (pdfBytes[si] === 47) {
          if (si + 7 < endSearch && pdfBytes[si + 1] === 73 && pdfBytes[si + 2] === 110 && pdfBytes[si + 3] === 100 && pdfBytes[si + 4] === 101 && pdfBytes[si + 5] === 120 && pdfBytes[si + 6] === 101 && pdfBytes[si + 7] === 100) {
            for (let pi = si + 8; pi < endSearch; pi++) {
              if (pdfBytes[pi] === 40) {
                parenPos = pi;
                break;
              }
            }
            break;
          }
        }
      }
      if (parenPos >= 0) return objCache.decryptObjectStringBytes(parsePdfLiteralString(pdfBytes, parenPos).value, objNum);
    }
  }
  const parenIdx = csText.indexOf("(", regexMatch.index + regexMatch[0].length - 1);
  if (parenIdx < 0) return null;
  const bytes = [];
  let depth = 1;
  for (let i = parenIdx + 1; i < csText.length && depth > 0; i++) {
    const c = csText.charCodeAt(i);
    if (c === 92) {
      i++;
      if (i >= csText.length) break;
      const nc = csText.charCodeAt(i);
      if (nc === 110) bytes.push(10);
      else if (nc === 114) bytes.push(13);
      else if (nc === 116) bytes.push(9);
      else if (nc === 98) bytes.push(8);
      else if (nc === 102) bytes.push(12);
      else if (nc === 13) {
        if (i + 1 < csText.length && csText.charCodeAt(i + 1) === 10) i++;
      } else if (nc === 10) ;
      else if (nc >= 48 && nc <= 55) {
        let oct = String.fromCharCode(nc);
        if (i + 1 < csText.length && csText.charCodeAt(i + 1) >= 48 && csText.charCodeAt(i + 1) <= 55) oct += csText[++i];
        if (i + 1 < csText.length && csText.charCodeAt(i + 1) >= 48 && csText.charCodeAt(i + 1) <= 55) oct += csText[++i];
        bytes.push(parseInt(oct, 8));
      } else {
        bytes.push(nc);
      }
    } else if (c === 40) {
      depth++;
      bytes.push(c);
    } else if (c === 41) {
      depth--;
      if (depth > 0) bytes.push(c);
    } else {
      bytes.push(c);
    }
  }
  return objCache.decryptObjectStringBytes(new Uint8Array(bytes), objNum);
}
function classifyDeviceN(csText) {
  const namesMatch = /\/DeviceN\s*\[\s*((?:\/[^/[\]<>(){}\s]+\s*)+)\]/.exec(csText);
  if (namesMatch) {
    const colorants = namesMatch[1].match(/\/[^/[\]<>(){}\s]+/g) || [];
    if (colorants.length === 1) return "Separation";
  }
  return "DeviceN";
}
function parseFilter(objText, objCache) {
  const filterAlias = {
    AHx: "ASCIIHexDecode",
    A85: "ASCII85Decode",
    LZW: "LZWDecode",
    Fl: "FlateDecode",
    RL: "RunLengthDecode",
    CCF: "CCITTFaxDecode",
    DCT: "DCTDecode"
  };
  const arrayMatch = /\/Filter\s*\[([\s\S]*?)\]/.exec(objText);
  if (arrayMatch) {
    const filters = [...arrayMatch[1].matchAll(/\/([^\s/<>[\]]+)/g)].map((m) => filterAlias[m[1]] || m[1]);
    for (const f of filters) {
      if (f === "DCTDecode" || f === "JPXDecode") return f;
    }
    return filters[0] || null;
  }
  const nameMatch = /\/Filter\s*\/(\w+)/.exec(objText);
  if (nameMatch) return filterAlias[nameMatch[1]] || nameMatch[1];
  const indirectMatch = objCache ? /\/Filter\s+(\d+)\s+\d+\s+R/.exec(objText) : null;
  if (indirectMatch) {
    const filterObjText = objCache.getObjectText(Number(indirectMatch[1]));
    if (filterObjText) return parseFilter(`/Filter ${filterObjText}`);
  }
  return null;
}
function hexToLatin1(hex) {
  let str = "";
  for (let i = 0; i + 2 <= hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
}
function parseDrawOps(contentStream, fonts, extGStates, registeredFontNames, colorSpaces = /* @__PURE__ */ new Map(), symbolFontTags = /* @__PURE__ */ new Set(), cidPUATags = /* @__PURE__ */ new Set(), rawCharCodeTags = /* @__PURE__ */ new Set(), shadings = /* @__PURE__ */ new Map(), patterns = /* @__PURE__ */ new Map(), cidCollisionMap = /* @__PURE__ */ new Map(), inheritedTextState = null, hiddenOCMCNames = /* @__PURE__ */ new Set(), recoveredStreamFlags = [], streamBoundaryOffsets = []) {
  const ops = [];
  const tokens = tokenizeContentStream(contentStream);
  let nextStreamBoundaryIdx = 0;
  let ctm = [1, 0, 0, 1, 0, 0];
  const gsStack = [];
  const SMALL_CAPS_MULT = 0.75;
  function applySmallCaps(drawText, trm, smallCaps) {
    if (!smallCaps) return { text: drawText, applied: false };
    const upper = drawText.toUpperCase();
    if (upper === drawText) return { text: drawText, applied: false };
    trm[0] *= SMALL_CAPS_MULT;
    trm[1] *= SMALL_CAPS_MULT;
    trm[2] *= SMALL_CAPS_MULT;
    trm[3] *= SMALL_CAPS_MULT;
    return { text: upper, applied: true };
  }
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = [1, 0, 0, 1, 0, 0];
  let currentFont = null;
  let currentFontTag = "";
  const warnedMissingFontTags = /* @__PURE__ */ new Set();
  let fontSize = 12;
  let tc = inheritedTextState ? inheritedTextState.tc : 0;
  let tw = inheritedTextState ? inheritedTextState.tw : 0;
  let tl = inheritedTextState ? inheritedTextState.tl : 0;
  let tz = inheritedTextState ? inheritedTextState.tz : 100;
  let trise = inheritedTextState ? inheritedTextState.trise : 0;
  let textRenderMode = inheritedTextState ? inheritedTextState.textRenderMode : 0;
  let fillColor = "black";
  let fillColorExplicit = false;
  let fillPatternShading = null;
  let fillTilingPattern = null;
  let strokeColor = "rgb(0,0,0)";
  let strokeColorExplicit = false;
  let strokePatternShading = null;
  let strokeTilingPattern = null;
  let fillColorSpaceType = "";
  let strokeColorSpaceType = "";
  let fillTintSamples = null;
  let fillTintNComponents = 3;
  let fillDeviceNGrid = null;
  let fillIndexedInfo = null;
  let strokeIndexedInfo = null;
  let strokeTintSamples = null;
  let strokeTintNComponents = 3;
  let strokeDeviceNGrid = null;
  let fillLabWhitePoint = null;
  let strokeLabWhitePoint = null;
  let fillAlpha = 1;
  let strokeAlpha = 1;
  let fillAlphaExplicit = false;
  let strokeAlphaExplicit = false;
  let overprint = false;
  let blendMode = "Normal";
  let lineWidth = 1;
  let lineCap = 0;
  let lineJoin = 0;
  let miterLimit = 10;
  let dashArray = (
    /** @type {number[]} */
    []
  );
  let dashPhase = 0;
  let currentPath = [];
  let curX = 0;
  let curY = 0;
  let pathStartX = 0;
  let pathStartY = 0;
  let pendingClip = false;
  let pendingClipEvenOdd = false;
  let clipStack = [];
  let textClipChars = [];
  let currentSmask = null;
  const operandStack = [];
  let skipCorruptedPath = false;
  let pathAnomalyCount = 0;
  let streamCorrupted = false;
  let corruptionThreshold = recoveredStreamFlags[0] ? 1 : 5;
  const mcStack = [];
  let ocHidden = false;
  function showType3Literal(str) {
    if (!currentFont || !currentFont.type3) return;
    const { encoding, charProcObjNums, fontMatrix } = currentFont.type3;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const glyphName = encoding[charCode];
      const charProcObjNum = glyphName ? charProcObjNums[glyphName] : void 0;
      const rawWidth = currentFont.widths.get(charCode) ?? currentFont.defaultWidth;
      const glyphWidth = rawWidth / 1e3 * fontSize;
      if (charProcObjNum !== void 0 && textRenderMode !== 3) {
        const trm = matMul([fontSize * tz / 100, 0, 0, fontSize, 0, trise], matMul(tm, ctm));
        const transform = matMul(fontMatrix, trm);
        const type3XObjects = currentFont.type3?.xobjectResources;
        const type3Op = {
          type: "type3glyph",
          charProcObjNum,
          transform,
          fillColor,
          fillAlpha,
          type3XObjects
        };
        type3Op.advEm = rawWidth / 1e3;
        if (!fillColorExplicit) type3Op.fillColorInherited = true;
        if (!fillAlphaExplicit) type3Op.fillAlphaInherited = true;
        ops.push(type3Op);
      }
      const advance = (glyphWidth + tc + (charCode === 32 ? tw : 0)) * tz / 100;
      tm[4] += advance * tm[0];
      tm[5] += advance * tm[1];
    }
  }
  function advanceLiteral(str) {
    if (!currentFont) return;
    const registeredName = registeredFontNames && registeredFontNames.get(currentFontTag);
    const csRanges = currentFont.codespaceRanges;
    for (const { charCode, numBytes } of decodeTextCodes(str, csRanges, 1)) {
      const rawWidth = currentFont.widths.get(charCode) ?? currentFont.defaultWidth;
      const glyphWidth = rawWidth / 1e3 * fontSize;
      const unicode = currentFont.toUnicode.get(charCode) || String.fromCharCode(charCode);
      const drawText = currentFont.encodingUnicode?.get(charCode) || unicode;
      if (registeredName && textRenderMode !== 3 && glyphWidth !== 0 && drawText && drawText.trim().length > 0) {
        const trm = matMul([fontSize * tz / 100, 0, 0, fontSize, 0, trise], matMul(tm, ctm));
        const sc = applySmallCaps(drawText, trm, !!currentFont.smallCaps);
        const textOp = {
          type: "type0text",
          text: sc.text,
          fontSize,
          fontFamily: registeredName,
          bold: currentFont.bold,
          italic: currentFont.italic,
          x: trm[4],
          y: trm[5],
          a: trm[0],
          b: trm[1],
          c: trm[2],
          d: trm[3],
          fillColor,
          fillAlpha,
          textRenderMode,
          strokeColor,
          strokeAlpha,
          lineWidth: lineWidth * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])),
          advEm: rawWidth / 1e3
        };
        if (currentFont.verticalMode) textOp.vertical = true;
        if (!fillColorExplicit) textOp.fillColorInherited = true;
        if (!fillAlphaExplicit) textOp.fillAlphaInherited = true;
        if (!strokeColorExplicit) textOp.strokeColorInherited = true;
        if (!strokeAlphaExplicit) textOp.strokeAlphaInherited = true;
        ops.push(textOp);
      }
      const isWordSpace = numBytes === 1 && charCode === 32;
      if (currentFont.verticalMode) {
        const vAdvance = (-fontSize + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += vAdvance * tm[2];
        tm[5] += vAdvance * tm[3];
      } else {
        const advance = (glyphWidth + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += advance * tm[0];
        tm[5] += advance * tm[1];
      }
    }
  }
  let lastDrawnHex = "";
  let lastDrawnFontTag = "";
  function advanceHex(hex) {
    if (!currentFont) return;
    const registeredName = registeredFontNames && registeredFontNames.get(currentFontTag);
    const usePUA = cidPUATags.has(currentFontTag);
    const csRanges = currentFont.codespaceRanges;
    const isDup = hex === lastDrawnHex && lastDrawnFontTag !== currentFontTag && lastDrawnHex.length > 0;
    for (const { charCode, numBytes } of decodeTextCodes(hexToLatin1(hex), csRanges, 2)) {
      const rawWidth = currentFont.widths.get(charCode) ?? currentFont.defaultWidth;
      const glyphWidth = rawWidth / 1e3 * fontSize;
      if (!isDup) {
        const tuStr = currentFont.toUnicode.get(charCode);
        const encStr = currentFont.encodingUnicode?.get(charCode);
        const embeddedGlyphUnavailable = !usePUA && !tuStr && !encStr && !!currentFont.type0?.fontFile && !currentFont.toUnicode?.size;
        const collided = cidCollisionMap.get(currentFontTag)?.has(charCode);
        const drawText = usePUA ? String.fromCodePoint(cidCodepoint(collided ? void 0 : tuStr, charCode, currentFont.widths.get(charCode)).codepoint) : embeddedGlyphUnavailable ? "" : encStr || tuStr || String.fromCharCode(charCode);
        if (registeredName && textRenderMode !== 3 && drawText && drawText.trim().length > 0) {
          const trm = matMul([fontSize * tz / 100, 0, 0, fontSize, 0, trise], matMul(tm, ctm));
          const sc = applySmallCaps(drawText, trm, !!currentFont.smallCaps);
          const textOp = {
            type: "type0text",
            text: sc.text,
            fontSize,
            fontFamily: registeredName,
            bold: currentFont.bold,
            italic: currentFont.italic,
            x: trm[4],
            y: trm[5],
            a: trm[0],
            b: trm[1],
            c: trm[2],
            d: trm[3],
            fillColor,
            fillAlpha,
            textRenderMode,
            strokeColor,
            strokeAlpha,
            lineWidth: lineWidth * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])),
            advEm: rawWidth / 1e3
          };
          if (currentFont.verticalMode) textOp.vertical = true;
          if (!fillColorExplicit) textOp.fillColorInherited = true;
          if (!fillAlphaExplicit) textOp.fillAlphaInherited = true;
          if (!strokeColorExplicit) textOp.strokeColorInherited = true;
          if (!strokeAlphaExplicit) textOp.strokeAlphaInherited = true;
          ops.push(textOp);
        }
      }
      const isWordSpace = numBytes === 1 && charCode === 32;
      if (currentFont.verticalMode) {
        const vAdv = (-fontSize + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += vAdv * tm[2];
        tm[5] += vAdv * tm[3];
      } else {
        const advance = (glyphWidth + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += advance * tm[0];
        tm[5] += advance * tm[1];
      }
    }
    lastDrawnHex = hex;
    lastDrawnFontTag = currentFontTag;
  }
  function showType0Hex(hex) {
    if (!currentFont || !currentFont.type0) return;
    const registeredName = registeredFontNames && registeredFontNames.get(currentFontTag);
    if (!registeredName) return;
    showType0Literal(hexToLatin1(hex));
    lastDrawnHex = hex;
    lastDrawnFontTag = currentFontTag;
  }
  function showType0Literal(str) {
    if (!currentFont || !currentFont.type0) return;
    const registeredName = registeredFontNames && registeredFontNames.get(currentFontTag);
    if (!registeredName) return;
    const usePUA = cidPUATags.has(currentFontTag);
    const cmapLookup = currentFont.charCodeToCID;
    const csRanges = currentFont.codespaceRanges;
    for (const { charCode, numBytes } of decodeTextCodes(str, csRanges, 2)) {
      const cid = cmapLookup ? cmapLookup.get(charCode) ?? charCode : charCode;
      const rawWidth = currentFont.widths.get(cid) ?? currentFont.defaultWidth;
      const glyphWidth = rawWidth / 1e3 * fontSize;
      if (textRenderMode !== 3 && !currentFont.allGlyphsEmpty) {
        const trm = matMul([fontSize * tz / 100, 0, 0, fontSize, 0, trise], matMul(tm, ctm));
        const collided = cidCollisionMap.get(currentFontTag)?.has(cid);
        const tuStr = currentFont.toUnicode?.get(charCode);
        const embeddedGlyphUnavailable = !usePUA && !tuStr && !!currentFont.type0?.fontFile && !currentFont.toUnicode?.size && !currentFont.type0?.unicodeCMap;
        const unicode = cid === 0 ? String.fromCodePoint(cidCodepoint(void 0, cid, currentFont.widths.get(cid)).codepoint) : usePUA ? String.fromCodePoint(cidCodepoint(collided ? void 0 : tuStr, cid, currentFont.widths.get(cid)).codepoint) : embeddedGlyphUnavailable ? "" : tuStr || String.fromCharCode(charCode);
        if (unicode && unicode.trim().length > 0) {
          const isNonEmbedded = !!(currentFont.type0 && !currentFont.type0.fontFile);
          const sc = applySmallCaps(unicode, trm, isNonEmbedded && !!currentFont.smallCaps);
          const opObj = {
            type: "type0text",
            text: sc.text,
            fontSize,
            fontFamily: registeredName,
            bold: currentFont.bold,
            italic: currentFont.italic,
            x: trm[4],
            y: trm[5],
            a: trm[0],
            b: trm[1],
            c: trm[2],
            d: trm[3],
            fillColor,
            fillAlpha,
            textRenderMode,
            strokeColor,
            strokeAlpha,
            lineWidth: lineWidth * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])),
            advEm: rawWidth / 1e3
          };
          if (currentFont.verticalMode) opObj.vertical = true;
          if (isNonEmbedded && !sc.applied && !currentFont.widthsUnreliable) {
            opObj.pdfGlyphWidth = rawWidth;
          }
          if (!fillColorExplicit) opObj.fillColorInherited = true;
          if (!fillAlphaExplicit) opObj.fillAlphaInherited = true;
          if (!strokeColorExplicit) opObj.strokeColorInherited = true;
          if (!strokeAlphaExplicit) opObj.strokeAlphaInherited = true;
          ops.push(opObj);
        }
      }
      const isWordSpace = numBytes === 1 && charCode === 32;
      if (currentFont.verticalMode) {
        const vAdvance = (-fontSize + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += vAdvance * tm[2];
        tm[5] += vAdvance * tm[3];
      } else {
        const advance = (glyphWidth + tc + (isWordSpace ? tw : 0)) * tz / 100;
        tm[4] += advance * tm[0];
        tm[5] += advance * tm[1];
      }
    }
  }
  function showType1Literal(str) {
    if (!currentFont || !currentFont.type1) return;
    const registeredName = registeredFontNames && registeredFontNames.get(currentFontTag);
    if (!registeredName) return;
    const isSymbol = symbolFontTags.has(currentFontTag);
    const isRawCharCode = rawCharCodeTags.has(currentFontTag);
    const hasPUA = cidPUATags.has(currentFontTag);
    const isNonEmbedded = !currentFont.type1.fontFile;
    const hasDifferences = !!(currentFont.differences && Object.keys(currentFont.differences).length > 0);
    let rawCharToUniTargets = null;
    if (isRawCharCode) {
      rawCharToUniTargets = /* @__PURE__ */ new Set();
      for (const [, u] of currentFont.toUnicode) {
        if (u && [...u].length === 1) rawCharToUniTargets.add(u.codePointAt(0));
      }
    }
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const rawWidth = currentFont.widths.get(charCode) ?? currentFont.defaultWidth;
      const glyphWidth = rawWidth / 1e3 * fontSize;
      const unicode = currentFont.toUnicode.get(charCode) || str[i];
      const drawDefault = currentFont.encodingUnicode?.get(charCode) || unicode;
      const inDifferences = !!(currentFont.differences && currentFont.differences[charCode] !== void 0);
      const encWhitespace = charCode >= 32 && (currentFont.encodingUnicode?.get(charCode) ?? "x").trim() === "";
      const usesPUA = hasPUA && charCode > 0 && (hasDifferences && inDifferences || !hasDifferences && (charCode < 32 || !currentFont.encodingUnicode?.has(charCode)) || encWhitespace || currentFont.widths.has(charCode) && !currentFont.toUnicode.has(charCode) && !currentFont.encodingUnicode?.has(charCode));
      if (!currentFont.allGlyphsEmpty && textRenderMode !== 3 && glyphWidth !== 0 && (isSymbol || usesPUA || drawDefault && drawDefault.trim().length > 0)) {
        const baseTrm = matMul([fontSize * tz / 100, 0, 0, fontSize, 0, trise], matMul(tm, ctm));
        const fm = currentFont.type1.fontMatrix;
        const trm = fm ? matMul(fm, baseTrm) : baseTrm;
        let drawText;
        if (isSymbol) {
          drawText = String.fromCharCode(61440 + charCode);
        } else if (usesPUA) {
          drawText = String.fromCharCode(57344 + charCode);
        } else if (isRawCharCode) {
          {
            const uniStr = currentFont.toUnicode.get(charCode);
            const firstCp = uniStr ? uniStr.codePointAt(0) : 0;
            const needsPUA = uniStr && ([...uniStr].length > 1 || isCombiningOrIndicMark(firstCp) || isDefaultIgnorable(firstCp) || isComplexShapingScript(firstCp));
            if (needsPUA) {
              drawText = String.fromCharCode(57344 + charCode);
            } else if (uniStr) {
              drawText = String.fromCodePoint(firstCp);
            } else {
              drawText = String.fromCharCode(rawCharToUniTargets.has(charCode) ? 57344 + charCode : charCode);
            }
          }
        } else {
          const ddCp = drawDefault && [...drawDefault].length === 1 ? drawDefault.codePointAt(0) : void 0;
          drawText = ddCp !== void 0 && drawnGlyphNeedsPUA(ddCp, rawWidth) ? String.fromCharCode(57344 + charCode) : drawDefault;
        }
        const sc = applySmallCaps(drawText, trm, isNonEmbedded && !!currentFont.smallCaps);
        const opObj = {
          type: "type0text",
          text: sc.text,
          fontSize,
          fontFamily: registeredName,
          bold: currentFont.bold,
          italic: currentFont.italic,
          x: trm[4],
          y: trm[5],
          a: trm[0],
          b: trm[1],
          c: trm[2],
          d: trm[3],
          fillColor,
          fillAlpha,
          textRenderMode,
          strokeColor,
          strokeAlpha,
          lineWidth: lineWidth * Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]))
        };
        opObj.advEm = rawWidth / 1e3;
        if (isNonEmbedded && !sc.applied && !currentFont.widthsUnreliable) opObj.pdfGlyphWidth = rawWidth;
        if (!fillColorExplicit) opObj.fillColorInherited = true;
        if (!fillAlphaExplicit) opObj.fillAlphaInherited = true;
        if (!strokeColorExplicit) opObj.strokeColorInherited = true;
        if (!strokeAlphaExplicit) opObj.strokeAlphaInherited = true;
        ops.push(opObj);
      }
      const advance = (glyphWidth + tc + (charCode === 32 ? tw : 0)) * tz / 100;
      tm[4] += advance * tm[0];
      tm[5] += advance * tm[1];
    }
  }
  function showString(strTok) {
    if (!currentFont) return;
    const isType3 = !!currentFont.type3;
    const isType0 = !!currentFont.type0;
    const isType1 = !!currentFont.type1;
    if (strTok.type === "hexstring") {
      if (isType3) showType3Literal(hexToLatin1(strTok.value));
      else if (isType0) showType0Hex(strTok.value);
      else if (isType1) showType1Literal(hexToLatin1(strTok.value));
      else advanceHex(strTok.value);
    } else if (strTok.type === "string") {
      if (isType3) showType3Literal(strTok.value);
      else if (isType0) showType0Literal(strTok.value);
      else if (isType1) showType1Literal(strTok.value);
      else advanceLiteral(strTok.value);
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === "inlineImage") {
      if (ocHidden) continue;
      const { dictText, imageData } = tok.value;
      const inlineOp = {
        type: "inlineImage",
        dictText,
        imageData,
        ctm: ctm.slice(),
        fillColor,
        fillAlpha,
        colorSpaces
        // carry the active color space registry so Form XObject inline images resolve correctly
      };
      if (fillTilingPattern) inlineOp.tilingPattern = fillTilingPattern;
      if (fillPatternShading) inlineOp.patternShading = fillPatternShading;
      if (clipStack.length > 0) {
        inlineOp.clips = clipStack.map((c) => {
          const entry = { path: c.path ? c.path.slice() : null, ctm: c.ctm.slice(), evenOdd: c.evenOdd };
          if (c.textClip) entry.textClip = c.textClip;
          return entry;
        });
      }
      if (!fillColorExplicit) inlineOp.fillColorInherited = true;
      if (!fillAlphaExplicit) inlineOp.fillAlphaInherited = true;
      ops.push(inlineOp);
      continue;
    }
    if (tok.type !== "operator") {
      if (tok.type === "number" && !Number.isFinite(tok.value)) {
        operandStack.length = 0;
        if (currentPath.length > 0) {
          const flushOp = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: false,
            stroke: true,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) flushOp.smask = currentSmask;
          if (blendMode !== "Normal") flushOp.blendMode = blendMode;
          ops.push(flushOp);
          currentPath = [];
        }
        skipCorruptedPath = true;
        continue;
      }
      operandStack.push(tok);
      continue;
    }
    if (nextStreamBoundaryIdx < streamBoundaryOffsets.length && tok.start != null && tok.start >= streamBoundaryOffsets[nextStreamBoundaryIdx]) {
      while (nextStreamBoundaryIdx < streamBoundaryOffsets.length && tok.start >= streamBoundaryOffsets[nextStreamBoundaryIdx]) nextStreamBoundaryIdx++;
      if (streamCorrupted || skipCorruptedPath) operandStack.length = 0;
      pathAnomalyCount = 0;
      streamCorrupted = false;
      skipCorruptedPath = false;
      corruptionThreshold = recoveredStreamFlags[nextStreamBoundaryIdx] ? 1 : 5;
    }
    if (pathAnomalyCount >= corruptionThreshold && !streamCorrupted) {
      streamCorrupted = true;
      console.warn(`[renderPdfPage] Content stream appears corrupted (${pathAnomalyCount} path/color operand anomalies). Suppressing remaining draw operations to preserve valid content.`);
    }
    if (streamCorrupted) {
      operandStack.length = 0;
      continue;
    }
    if (tok.value === "BDC" || tok.value === "BMC") {
      let nowHidden = ocHidden;
      if (!nowHidden && tok.value === "BDC" && hiddenOCMCNames.size > 0) {
        const tagTok = operandStack[operandStack.length - 2];
        const propTok = operandStack[operandStack.length - 1];
        if (tagTok && tagTok.type === "name" && tagTok.value === "OC" && propTok && propTok.type === "name" && hiddenOCMCNames.has(propTok.value)) {
          nowHidden = true;
        }
      }
      mcStack.push(nowHidden);
      ocHidden = nowHidden;
      operandStack.length = 0;
      continue;
    }
    if (tok.value === "EMC") {
      if (mcStack.length > 0) mcStack.pop();
      ocHidden = mcStack.length > 0 && mcStack[mcStack.length - 1];
      operandStack.length = 0;
      continue;
    }
    const opsLenBeforeOp = ops.length;
    switch (tok.value) {
      // Graphics state
      case "q":
        gsStack.push({
          ctm: ctm.slice(),
          fillColor,
          fillColorExplicit,
          fillPatternShading,
          fillTilingPattern,
          strokeColor,
          strokeColorExplicit,
          strokePatternShading,
          strokeTilingPattern,
          fillColorSpaceType,
          strokeColorSpaceType,
          fillTintSamples,
          fillTintNComponents,
          strokeTintSamples,
          strokeTintNComponents,
          fillDeviceNGrid,
          strokeDeviceNGrid,
          fillIndexedInfo,
          strokeIndexedInfo,
          fillLabWhitePoint,
          strokeLabWhitePoint,
          fillAlpha,
          strokeAlpha,
          fillAlphaExplicit,
          strokeAlphaExplicit,
          lineWidth,
          lineCap,
          lineJoin,
          miterLimit,
          dashArray: dashArray.length > 0 ? dashArray.slice() : [],
          dashPhase,
          tc,
          tw,
          tl,
          tz,
          trise,
          textRenderMode,
          fontSize,
          currentFont,
          currentFontTag,
          clipStack: clipStack.length > 0 ? clipStack.map((c) => {
            const entry = { path: c.path ? c.path.slice() : null, ctm: c.ctm.slice(), evenOdd: c.evenOdd };
            if (c.textClip) entry.textClip = c.textClip;
            return entry;
          }) : [],
          currentSmask,
          overprint,
          blendMode,
          pendingClip,
          pendingClipEvenOdd
        });
        operandStack.length = 0;
        break;
      case "Q":
        if (gsStack.length > 0) {
          const saved = gsStack.pop();
          ctm = saved.ctm;
          fillColor = saved.fillColor;
          fillColorExplicit = saved.fillColorExplicit;
          fillPatternShading = saved.fillPatternShading;
          fillTilingPattern = saved.fillTilingPattern;
          strokeColor = saved.strokeColor;
          strokeColorExplicit = saved.strokeColorExplicit;
          strokePatternShading = saved.strokePatternShading;
          strokeTilingPattern = saved.strokeTilingPattern;
          fillColorSpaceType = saved.fillColorSpaceType;
          strokeColorSpaceType = saved.strokeColorSpaceType;
          fillTintSamples = saved.fillTintSamples;
          fillTintNComponents = saved.fillTintNComponents;
          strokeTintSamples = saved.strokeTintSamples;
          strokeTintNComponents = saved.strokeTintNComponents;
          fillDeviceNGrid = saved.fillDeviceNGrid;
          strokeDeviceNGrid = saved.strokeDeviceNGrid;
          fillIndexedInfo = saved.fillIndexedInfo;
          strokeIndexedInfo = saved.strokeIndexedInfo;
          fillLabWhitePoint = saved.fillLabWhitePoint;
          strokeLabWhitePoint = saved.strokeLabWhitePoint;
          fillAlpha = saved.fillAlpha;
          strokeAlpha = saved.strokeAlpha;
          fillAlphaExplicit = saved.fillAlphaExplicit;
          strokeAlphaExplicit = saved.strokeAlphaExplicit;
          overprint = saved.overprint;
          blendMode = saved.blendMode;
          lineWidth = saved.lineWidth;
          lineCap = saved.lineCap;
          lineJoin = saved.lineJoin;
          miterLimit = saved.miterLimit;
          dashArray = saved.dashArray;
          dashPhase = saved.dashPhase;
          tc = saved.tc;
          tw = saved.tw;
          tl = saved.tl;
          tz = saved.tz;
          trise = saved.trise;
          textRenderMode = saved.textRenderMode;
          fontSize = saved.fontSize;
          currentFont = saved.currentFont;
          currentFontTag = saved.currentFontTag;
          clipStack = saved.clipStack;
          currentSmask = saved.currentSmask;
          pendingClip = saved.pendingClip;
          pendingClipEvenOdd = saved.pendingClipEvenOdd;
        }
        operandStack.length = 0;
        break;
      case "cm":
        if (operandStack.length >= 6) {
          const m = operandStack.slice(operandStack.length - 6).map((t) => t.value);
          ctm = matMul(m, ctm);
        }
        operandStack.length = 0;
        break;
      case "gs":
        if (operandStack.length >= 1 && extGStates) {
          const gsName = String(operandStack[operandStack.length - 1].value).replace(/^\//, "");
          const gs = extGStates.get(gsName);
          if (gs) {
            if (gs.fillAlpha !== void 0) {
              fillAlpha = gs.fillAlpha;
              fillAlphaExplicit = true;
            }
            if (gs.strokeAlpha !== void 0) {
              strokeAlpha = gs.strokeAlpha;
              strokeAlphaExplicit = true;
            }
            if (gs.overprint !== void 0) overprint = gs.overprint;
            if (gs.blendMode !== void 0) blendMode = gs.blendMode;
            if (gs.lineWidth !== void 0) lineWidth = gs.lineWidth;
            if (gs.lineCap !== void 0) lineCap = gs.lineCap;
            if (gs.lineJoin !== void 0) lineJoin = gs.lineJoin;
            if (gs.miterLimit !== void 0) miterLimit = gs.miterLimit;
            if (gs.dashArray !== void 0) {
              dashArray = gs.dashArray;
              dashPhase = gs.dashPhase ?? 0;
            }
            if (gs.smask !== void 0) {
              currentSmask = gs.smask ? { ...gs.smask, parentCtm: ctm.slice() } : gs.smask;
            }
          }
        }
        operandStack.length = 0;
        break;
      // XObject
      case "Do":
        if (operandStack.length >= 1) {
          const name = operandStack[operandStack.length - 1].value;
          const doOp = {
            type: "image",
            name,
            ctm: ctm.slice(),
            fillAlpha,
            strokeAlpha,
            fillColor,
            strokeColor
          };
          if (fillTilingPattern) doOp.tilingPattern = fillTilingPattern;
          if (fillPatternShading) doOp.patternShading = fillPatternShading;
          if (overprint) doOp.overprint = true;
          if (blendMode !== "Normal") doOp.blendMode = blendMode;
          if (clipStack.length > 0) {
            doOp.clips = clipStack.map((c) => {
              const entry = { path: c.path ? c.path.slice() : null, ctm: c.ctm.slice(), evenOdd: c.evenOdd };
              if (c.textClip) entry.textClip = c.textClip;
              return entry;
            });
          }
          if (currentSmask) doOp.smask = currentSmask;
          if (!fillColorExplicit) doOp.fillColorInherited = true;
          if (!fillAlphaExplicit) doOp.fillAlphaInherited = true;
          if (!strokeColorExplicit) doOp.strokeColorInherited = true;
          if (!strokeAlphaExplicit) doOp.strokeAlphaInherited = true;
          doOp.textState = {
            tc,
            tw,
            tl,
            tz,
            trise
          };
          ops.push(doOp);
        }
        operandStack.length = 0;
        break;
      // Shading fill
      case "sh":
        if (operandStack.length >= 1) {
          const shName = operandStack[operandStack.length - 1].value;
          const shading = shadings.get(shName);
          if (shading) {
            const shOp = {
              type: "shading",
              shading,
              ctm: ctm.slice(),
              fillAlpha
            };
            if (clipStack.length > 0) {
              shOp.clips = clipStack.map((c) => {
                const entry = { path: c.path ? c.path.slice() : null, ctm: c.ctm.slice(), evenOdd: c.evenOdd };
                if (c.textClip) entry.textClip = c.textClip;
                return entry;
              });
            }
            if (currentSmask) shOp.smask = currentSmask;
            if (blendMode !== "Normal") shOp.blendMode = blendMode;
            ops.push(shOp);
          }
        }
        operandStack.length = 0;
        break;
      // Text object
      case "BT":
        skipCorruptedPath = false;
        tm = [1, 0, 0, 1, 0, 0];
        tlm = [1, 0, 0, 1, 0, 0];
        textClipChars = [];
        operandStack.length = 0;
        break;
      case "ET":
        if (textClipChars.length > 0) {
          clipStack.push({ textClip: textClipChars.slice(), ctm: [1, 0, 0, 1, 0, 0], evenOdd: false });
          textClipChars = [];
        }
        operandStack.length = 0;
        break;
      // Text state
      case "Tf": {
        const size = operandStack.length >= 2 ? operandStack[operandStack.length - 1] : null;
        const name = operandStack.length >= 2 ? operandStack[operandStack.length - 2] : null;
        if (name && name.type === "name" && size && size.type === "number") {
          const fontTag = decodePdfName(name.value);
          currentFont = fonts.get(fontTag) || null;
          currentFontTag = fontTag;
          fontSize = size.value;
          if (!currentFont && !warnedMissingFontTags.has(fontTag)) {
            warnedMissingFontTags.add(fontTag);
            console.warn(`[parseDrawOps] Tf references font "${fontTag}" not found in resources; its text will not render`);
          }
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
      case "Tr":
        if (operandStack.length >= 1) textRenderMode = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Ts":
        if (operandStack.length >= 1) trise = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "TL":
        if (operandStack.length >= 1) tl = operandStack[operandStack.length - 1].value;
        operandStack.length = 0;
        break;
      case "Tm":
        if (operandStack.length >= 6) {
          tm = operandStack.slice(operandStack.length - 6).map((t) => t.value);
          tlm = tm.slice();
        }
        operandStack.length = 0;
        break;
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
      // Show string operators
      case "Tj":
        if (operandStack.length >= 1 && currentFont) {
          showString(operandStack[operandStack.length - 1]);
        }
        operandStack.length = 0;
        break;
      case "TJ": {
        if (operandStack.length >= 1 && currentFont) {
          const arrTok = operandStack[operandStack.length - 1];
          if (arrTok.type === "array") {
            for (const elem of arrTok.value) {
              if (elem.type === "hexstring" || elem.type === "string") {
                showString(elem);
              } else if (elem.type === "number") {
                const adjustment = elem.value / 1e3 * fontSize * tz / 100;
                tm[4] -= adjustment * tm[0];
                tm[5] -= adjustment * tm[1];
              }
            }
          }
        }
        operandStack.length = 0;
        break;
      }
      case "'": {
        const txP = 0;
        const tyP = -tl;
        tlm = [
          tlm[0],
          tlm[1],
          tlm[2],
          tlm[3],
          txP * tlm[0] + tyP * tlm[2] + tlm[4],
          txP * tlm[1] + tyP * tlm[3] + tlm[5]
        ];
        tm = tlm.slice();
        if (operandStack.length >= 1 && currentFont) {
          showString(operandStack[operandStack.length - 1]);
        }
        operandStack.length = 0;
        break;
      }
      case '"': {
        if (operandStack.length >= 3) {
          tw = operandStack[operandStack.length - 3].value;
          tc = operandStack[operandStack.length - 2].value;
        }
        const txQ = 0;
        const tyQ = -tl;
        tlm = [
          tlm[0],
          tlm[1],
          tlm[2],
          tlm[3],
          txQ * tlm[0] + tyQ * tlm[2] + tlm[4],
          txQ * tlm[1] + tyQ * tlm[3] + tlm[5]
        ];
        tm = tlm.slice();
        if (operandStack.length >= 1 && currentFont) {
          showString(operandStack[operandStack.length - 1]);
        }
        operandStack.length = 0;
        break;
      }
      // ── Fill color operators ──────────────────────────────────────
      case "g":
        fillPatternShading = null;
        fillTilingPattern = null;
        fillColorExplicit = true;
        fillColorSpaceType = "DeviceGray";
        fillTintSamples = null;
        fillTintNComponents = 1;
        fillDeviceNGrid = null;
        fillIndexedInfo = null;
        if (operandStack.length !== 1) pathAnomalyCount++;
        if (operandStack.length >= 1) {
          const gv = Math.round(operandStack[operandStack.length - 1].value * 255);
          fillColor = `rgb(${gv},${gv},${gv})`;
        }
        operandStack.length = 0;
        break;
      case "rg":
        fillPatternShading = null;
        fillTilingPattern = null;
        fillColorExplicit = true;
        fillColorSpaceType = "DeviceRGB";
        fillTintSamples = null;
        fillTintNComponents = 3;
        fillDeviceNGrid = null;
        fillIndexedInfo = null;
        if (operandStack.length !== 3) pathAnomalyCount++;
        if (operandStack.length >= 3) {
          const r = Math.round(operandStack[operandStack.length - 3].value * 255);
          const gv = Math.round(operandStack[operandStack.length - 2].value * 255);
          const b = Math.round(operandStack[operandStack.length - 1].value * 255);
          fillColor = `rgb(${r},${gv},${b})`;
        }
        operandStack.length = 0;
        break;
      case "k":
        fillPatternShading = null;
        fillTilingPattern = null;
        fillColorExplicit = true;
        fillColorSpaceType = "DeviceCMYK";
        fillTintSamples = null;
        fillTintNComponents = 4;
        fillDeviceNGrid = null;
        fillIndexedInfo = null;
        if (operandStack.length !== 4) pathAnomalyCount++;
        if (operandStack.length >= 4) {
          const ck = operandStack[operandStack.length - 4].value;
          const mk = operandStack[operandStack.length - 3].value;
          const yk = operandStack[operandStack.length - 2].value;
          const kk = operandStack[operandStack.length - 1].value;
          if (ck >= -0.1 && ck <= 1.1 && mk >= -0.1 && mk <= 1.1 && yk >= -0.1 && yk <= 1.1 && kk >= -0.1 && kk <= 1.1) {
            const [rk, gk, bk] = cmykToRgb(ck, mk, yk, kk);
            fillColor = `rgb(${rk},${gk},${bk})`;
          }
        }
        operandStack.length = 0;
        break;
      // ── Stroke color operators ─────────────────────────────────────
      case "G":
        strokePatternShading = null;
        strokeTilingPattern = null;
        strokeColorExplicit = true;
        strokeColorSpaceType = "DeviceGray";
        strokeTintSamples = null;
        strokeTintNComponents = 1;
        strokeDeviceNGrid = null;
        strokeIndexedInfo = null;
        if (operandStack.length >= 1) {
          const gv = Math.round(operandStack[operandStack.length - 1].value * 255);
          strokeColor = `rgb(${gv},${gv},${gv})`;
        }
        operandStack.length = 0;
        break;
      case "RG":
        strokePatternShading = null;
        strokeTilingPattern = null;
        strokeColorExplicit = true;
        strokeColorSpaceType = "DeviceRGB";
        strokeTintSamples = null;
        strokeTintNComponents = 3;
        strokeDeviceNGrid = null;
        strokeIndexedInfo = null;
        if (operandStack.length >= 3) {
          const r = Math.round(operandStack[operandStack.length - 3].value * 255);
          const gv = Math.round(operandStack[operandStack.length - 2].value * 255);
          const b = Math.round(operandStack[operandStack.length - 1].value * 255);
          strokeColor = `rgb(${r},${gv},${b})`;
        }
        operandStack.length = 0;
        break;
      case "K":
        strokePatternShading = null;
        strokeTilingPattern = null;
        strokeColorExplicit = true;
        strokeColorSpaceType = "DeviceCMYK";
        strokeTintSamples = null;
        strokeTintNComponents = 4;
        strokeDeviceNGrid = null;
        strokeIndexedInfo = null;
        if (operandStack.length !== 4) pathAnomalyCount++;
        if (operandStack.length >= 4) {
          const cK = operandStack[operandStack.length - 4].value;
          const mK = operandStack[operandStack.length - 3].value;
          const yK = operandStack[operandStack.length - 2].value;
          const kK = operandStack[operandStack.length - 1].value;
          if (cK >= -0.1 && cK <= 1.1 && mK >= -0.1 && mK <= 1.1 && yK >= -0.1 && yK <= 1.1 && kK >= -0.1 && kK <= 1.1) {
            const [rK, gK, bK] = cmykToRgb(cK, mK, yK, kK);
            strokeColor = `rgb(${rK},${gK},${bK})`;
          }
        }
        operandStack.length = 0;
        break;
      // ── General color space operators ──────────────────────────────
      case "cs": {
        const csName = operandStack.length >= 1 ? operandStack[operandStack.length - 1].value : "";
        const csInfo = colorSpaces.get(csName);
        fillColorSpaceType = csInfo ? csInfo.type : csName;
        fillTintSamples = csInfo ? csInfo.tintSamples : null;
        fillTintNComponents = csInfo ? csInfo.nComponents : 3;
        fillDeviceNGrid = csInfo ? csInfo.deviceNGrid : null;
        fillIndexedInfo = csInfo ? csInfo.indexedInfo : null;
        fillLabWhitePoint = csInfo ? csInfo.labWhitePoint : null;
        operandStack.length = 0;
        break;
      }
      case "CS": {
        const csNameS = operandStack.length >= 1 ? operandStack[operandStack.length - 1].value : "";
        const csInfoS = colorSpaces.get(csNameS);
        strokeColorSpaceType = csInfoS ? csInfoS.type : csNameS;
        strokeTintSamples = csInfoS ? csInfoS.tintSamples : null;
        strokeTintNComponents = csInfoS ? csInfoS.nComponents : 3;
        strokeDeviceNGrid = csInfoS ? csInfoS.deviceNGrid : null;
        strokeIndexedInfo = csInfoS ? csInfoS.indexedInfo : null;
        strokeLabWhitePoint = csInfoS ? csInfoS.labWhitePoint : null;
        strokePatternShading = null;
        strokeTilingPattern = null;
        operandStack.length = 0;
        break;
      }
      case "sc":
      case "scn": {
        fillColorExplicit = true;
        if (operandStack.length >= 1) {
          if (fillColorSpaceType === "Pattern") {
            const patName = operandStack[operandStack.length - 1].value;
            const patInfo = typeof patName === "string" && patterns.get(patName);
            if (patInfo) {
              fillColor = patInfo.color;
              fillPatternShading = patInfo.shading || null;
              fillTilingPattern = patInfo.tiling ? { patName, ...patInfo.tiling } : null;
              if (fillTilingPattern && patInfo.tiling.paintType === 2) {
                const comps = operandStack.slice(0, -1).map((t) => t.value).filter((v) => typeof v === "number");
                if (comps.length === 1) {
                  const g = Math.round(comps[0] * 255);
                  fillTilingPattern.paintColor = `rgb(${g},${g},${g})`;
                } else if (comps.length === 3) {
                  fillTilingPattern.paintColor = `rgb(${Math.round(comps[0] * 255)},${Math.round(comps[1] * 255)},${Math.round(comps[2] * 255)})`;
                } else if (comps.length === 4) {
                  const [c, m, y, k] = comps;
                  fillTilingPattern.paintColor = `rgb(${Math.round(255 * (1 - c) * (1 - k))},${Math.round(255 * (1 - m) * (1 - k))},${Math.round(255 * (1 - y) * (1 - k))})`;
                }
              }
            }
            operandStack.length = 0;
            break;
          }
          fillPatternShading = null;
          fillTilingPattern = null;
          const vals = operandStack.map((t) => t.value);
          if (fillDeviceNGrid && vals.length === fillDeviceNGrid.nInputs) {
            const grid = fillDeviceNGrid;
            if (grid.parsedTint) {
              const rgb2 = tintComponentsToRGB(grid.parsedTint, vals);
              if (rgb2) {
                fillColor = `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`;
                operandStack.length = 0;
                break;
              }
            }
            const rgb = grid.rgbSamples;
            const nc = grid.nComponents;
            if (grid.nInputs === 2) {
              const s0 = grid.sizes[0];
              const s1 = grid.sizes[1];
              const fx = vals[0] * (s0 - 1);
              const fy = vals[1] * (s1 - 1);
              const x0 = Math.min(Math.floor(fx), s0 - 1);
              const y0 = Math.min(Math.floor(fy), s1 - 1);
              const x1 = Math.min(x0 + 1, s0 - 1);
              const y1 = Math.min(y0 + 1, s1 - 1);
              const dx = fx - x0;
              const dy = fy - y0;
              const i00 = (y0 * s0 + x0) * nc;
              const i10 = (y0 * s0 + x1) * nc;
              const i01 = (y1 * s0 + x0) * nc;
              const i11 = (y1 * s0 + x1) * nc;
              const r = Math.round((rgb[i00] * (1 - dx) + rgb[i10] * dx) * (1 - dy) + (rgb[i01] * (1 - dx) + rgb[i11] * dx) * dy);
              const g = Math.round((rgb[i00 + 1] * (1 - dx) + rgb[i10 + 1] * dx) * (1 - dy) + (rgb[i01 + 1] * (1 - dx) + rgb[i11 + 1] * dx) * dy);
              const b = Math.round((rgb[i00 + 2] * (1 - dx) + rgb[i10 + 2] * dx) * (1 - dy) + (rgb[i01 + 2] * (1 - dx) + rgb[i11 + 2] * dx) * dy);
              fillColor = `rgb(${r},${g},${b})`;
            } else {
              let flatIdx = 0;
              let stride = 1;
              for (let d = 0; d < grid.nInputs; d++) {
                const si = Math.min(Math.round(vals[d] * (grid.sizes[d] - 1)), grid.sizes[d] - 1);
                flatIdx += si * stride;
                stride *= grid.sizes[d];
              }
              const ri = flatIdx * nc;
              fillColor = `rgb(${rgb[ri]},${rgb[ri + 1]},${rgb[ri + 2]})`;
            }
            operandStack.length = 0;
            break;
          }
          if (vals.length === 1 && fillColorSpaceType === "Indexed" && fillIndexedInfo) {
            const idx = Math.max(0, Math.min(fillIndexedInfo.hival, Math.round(vals[0])));
            const base = fillIndexedInfo.base;
            const nComp = base === "DeviceCMYK" ? 4 : base === "DeviceGray" || base === "CalGray" ? 1 : 3;
            const po = idx * nComp;
            const pal = fillIndexedInfo.palette;
            if (nComp === 3) {
              fillColor = `rgb(${pal[po]},${pal[po + 1]},${pal[po + 2]})`;
            } else if (nComp === 1) {
              fillColor = `rgb(${pal[po]},${pal[po]},${pal[po]})`;
            } else if (nComp === 4) {
              const [ri, gi, bi] = cmykToRgb(pal[po] / 255, pal[po + 1] / 255, pal[po + 2] / 255, pal[po + 3] / 255);
              fillColor = `rgb(${ri},${gi},${bi})`;
            }
            operandStack.length = 0;
            break;
          }
          if (vals.length === 1) {
            if (fillColorSpaceType === "Separation" && fillTintSamples && fillTintSamples.length >= fillTintNComponents) {
              const nSamples = Math.floor(fillTintSamples.length / fillTintNComponents);
              const fi = Math.min(vals[0] * (nSamples - 1), nSamples - 1);
              const i0 = Math.min(Math.floor(fi), nSamples - 1);
              const i1 = Math.min(i0 + 1, nSamples - 1);
              const frac = fi - i0;
              if (fillTintNComponents >= 3) {
                const r = Math.round(fillTintSamples[i0 * 3] * (1 - frac) + fillTintSamples[i1 * 3] * frac);
                const g = Math.round(fillTintSamples[i0 * 3 + 1] * (1 - frac) + fillTintSamples[i1 * 3 + 1] * frac);
                const b = Math.round(fillTintSamples[i0 * 3 + 2] * (1 - frac) + fillTintSamples[i1 * 3 + 2] * frac);
                fillColor = `rgb(${r},${g},${b})`;
              } else {
                const v = Math.round(fillTintSamples[i0] * (1 - frac) + fillTintSamples[i1] * frac);
                fillColor = `rgb(${v},${v},${v})`;
              }
            } else if (fillColorSpaceType === "Separation") {
              const gv = Math.round(255 * (1 - vals[0]));
              fillColor = `rgb(${gv},${gv},${gv})`;
            } else {
              const gv = Math.round(vals[0] * 255);
              fillColor = `rgb(${gv},${gv},${gv})`;
            }
          } else if (vals.length === 3) {
            if (fillColorSpaceType === "Lab") {
              const fy = (vals[0] + 16) / 116;
              const fx = fy + vals[1] / 500;
              const fz = fy - vals[2] / 200;
              const delta = 6 / 29;
              const fInv = (ft) => ft > delta ? ft * ft * ft : 3 * delta * delta * (ft - 4 / 29);
              const wp = fillLabWhitePoint || [0.9642, 1, 0.8249];
              const [r, g, b] = xyzToSRGB(wp[0] * fInv(fx), wp[1] * fInv(fy), wp[2] * fInv(fz), wp);
              fillColor = `rgb(${r},${g},${b})`;
            } else {
              fillColor = `rgb(${Math.round(vals[0] * 255)},${Math.round(vals[1] * 255)},${Math.round(vals[2] * 255)})`;
            }
          } else if (vals.length === 4) {
            const [rf, gf, bf] = cmykToRgb(vals[0], vals[1], vals[2], vals[3]);
            fillColor = `rgb(${rf},${gf},${bf})`;
          }
        }
        operandStack.length = 0;
        break;
      }
      case "SC":
      case "SCN": {
        strokeColorExplicit = true;
        if (operandStack.length >= 1) {
          if (strokeColorSpaceType === "Pattern") {
            const patName = operandStack[operandStack.length - 1].value;
            const patInfo = typeof patName === "string" && patterns.get(patName);
            if (patInfo) {
              strokeColor = patInfo.color;
              strokePatternShading = patInfo.shading || null;
              strokeTilingPattern = patInfo.tiling ? { patName, ...patInfo.tiling } : null;
            }
            operandStack.length = 0;
            break;
          }
          strokePatternShading = null;
          strokeTilingPattern = null;
          const vals = operandStack.map((t) => t.value);
          if (vals.length === 1 && strokeColorSpaceType === "Indexed" && strokeIndexedInfo) {
            const idx = Math.max(0, Math.min(strokeIndexedInfo.hival, Math.round(vals[0])));
            const base = strokeIndexedInfo.base;
            const nComp = base === "DeviceCMYK" ? 4 : base === "DeviceGray" || base === "CalGray" ? 1 : 3;
            const po = idx * nComp;
            const pal = strokeIndexedInfo.palette;
            if (nComp === 3) {
              strokeColor = `rgb(${pal[po]},${pal[po + 1]},${pal[po + 2]})`;
            } else if (nComp === 1) {
              strokeColor = `rgb(${pal[po]},${pal[po]},${pal[po]})`;
            } else if (nComp === 4) {
              const [ri, gi, bi] = cmykToRgb(pal[po] / 255, pal[po + 1] / 255, pal[po + 2] / 255, pal[po + 3] / 255);
              strokeColor = `rgb(${ri},${gi},${bi})`;
            }
            operandStack.length = 0;
            break;
          }
          if (strokeDeviceNGrid && vals.length === strokeDeviceNGrid.nInputs) {
            const grid = strokeDeviceNGrid;
            if (grid.parsedTint) {
              const rgb2 = tintComponentsToRGB(grid.parsedTint, vals);
              if (rgb2) {
                strokeColor = `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`;
                operandStack.length = 0;
                break;
              }
            }
            const rgb = grid.rgbSamples;
            const nc = grid.nComponents;
            if (grid.nInputs === 2) {
              const s0 = grid.sizes[0];
              const s1 = grid.sizes[1];
              const fx = vals[0] * (s0 - 1);
              const fy = vals[1] * (s1 - 1);
              const x0 = Math.min(Math.floor(fx), s0 - 1);
              const y0 = Math.min(Math.floor(fy), s1 - 1);
              const x1 = Math.min(x0 + 1, s0 - 1);
              const y1 = Math.min(y0 + 1, s1 - 1);
              const dx = fx - x0;
              const dy = fy - y0;
              const i00 = (y0 * s0 + x0) * nc;
              const i10 = (y0 * s0 + x1) * nc;
              const i01 = (y1 * s0 + x0) * nc;
              const i11 = (y1 * s0 + x1) * nc;
              const r = Math.round((rgb[i00] * (1 - dx) + rgb[i10] * dx) * (1 - dy) + (rgb[i01] * (1 - dx) + rgb[i11] * dx) * dy);
              const g = Math.round((rgb[i00 + 1] * (1 - dx) + rgb[i10 + 1] * dx) * (1 - dy) + (rgb[i01 + 1] * (1 - dx) + rgb[i11 + 1] * dx) * dy);
              const bv = Math.round((rgb[i00 + 2] * (1 - dx) + rgb[i10 + 2] * dx) * (1 - dy) + (rgb[i01 + 2] * (1 - dx) + rgb[i11 + 2] * dx) * dy);
              strokeColor = `rgb(${r},${g},${bv})`;
            } else {
              let flatIdx = 0;
              let stride = 1;
              for (let d = 0; d < grid.nInputs; d++) {
                const si = Math.min(Math.round(vals[d] * (grid.sizes[d] - 1)), grid.sizes[d] - 1);
                flatIdx += si * stride;
                stride *= grid.sizes[d];
              }
              const ri = flatIdx * nc;
              strokeColor = `rgb(${rgb[ri]},${rgb[ri + 1]},${rgb[ri + 2]})`;
            }
            operandStack.length = 0;
            break;
          }
          if (vals.length === 1) {
            if (strokeColorSpaceType === "Separation" && strokeTintSamples && strokeTintSamples.length >= strokeTintNComponents) {
              const nSamples = Math.floor(strokeTintSamples.length / strokeTintNComponents);
              const fi = Math.min(vals[0] * (nSamples - 1), nSamples - 1);
              const i0 = Math.min(Math.floor(fi), nSamples - 1);
              const i1 = Math.min(i0 + 1, nSamples - 1);
              const frac = fi - i0;
              if (strokeTintNComponents >= 3) {
                const r = Math.round(strokeTintSamples[i0 * 3] * (1 - frac) + strokeTintSamples[i1 * 3] * frac);
                const g = Math.round(strokeTintSamples[i0 * 3 + 1] * (1 - frac) + strokeTintSamples[i1 * 3 + 1] * frac);
                const b = Math.round(strokeTintSamples[i0 * 3 + 2] * (1 - frac) + strokeTintSamples[i1 * 3 + 2] * frac);
                strokeColor = `rgb(${r},${g},${b})`;
              } else {
                const v = Math.round(strokeTintSamples[i0] * (1 - frac) + strokeTintSamples[i1] * frac);
                strokeColor = `rgb(${v},${v},${v})`;
              }
            } else if (strokeColorSpaceType === "Separation") {
              const gv = Math.round(255 * (1 - vals[0]));
              strokeColor = `rgb(${gv},${gv},${gv})`;
            } else {
              const gv = Math.round(vals[0] * 255);
              strokeColor = `rgb(${gv},${gv},${gv})`;
            }
          } else if (vals.length === 3) {
            if (strokeColorSpaceType === "Lab") {
              const fy = (vals[0] + 16) / 116;
              const fx = fy + vals[1] / 500;
              const fz = fy - vals[2] / 200;
              const delta = 6 / 29;
              const fInv = (ft) => ft > delta ? ft * ft * ft : 3 * delta * delta * (ft - 4 / 29);
              const wp = strokeLabWhitePoint || [0.9642, 1, 0.8249];
              const [r, g, b] = xyzToSRGB(wp[0] * fInv(fx), wp[1] * fInv(fy), wp[2] * fInv(fz), wp);
              strokeColor = `rgb(${r},${g},${b})`;
            } else {
              strokeColor = `rgb(${Math.round(vals[0] * 255)},${Math.round(vals[1] * 255)},${Math.round(vals[2] * 255)})`;
            }
          } else if (vals.length === 4) {
            const [rs, gs, bs] = cmykToRgb(vals[0], vals[1], vals[2], vals[3]);
            strokeColor = `rgb(${rs},${gs},${bs})`;
          }
        }
        operandStack.length = 0;
        break;
      }
      // ── Line style operators ───────────────────────────────────────
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
      // ── Path construction operators ────────────────────────────────
      case "m": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 2) pathAnomalyCount++;
        if (operandStack.length >= 2) {
          if (operandStack.length > 2) {
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          curX = operandStack[operandStack.length - 2].value;
          curY = operandStack[operandStack.length - 1].value;
          pathStartX = curX;
          pathStartY = curY;
          currentPath.push({ type: "M", x: curX, y: curY });
        }
        operandStack.length = 0;
        break;
      }
      case "l": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 2) pathAnomalyCount++;
        if (operandStack.length >= 2) {
          if (operandStack.length > 2) {
            pathAnomalyCount++;
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          curX = operandStack[operandStack.length - 2].value;
          curY = operandStack[operandStack.length - 1].value;
          currentPath.push({ type: "L", x: curX, y: curY });
        }
        operandStack.length = 0;
        break;
      }
      case "c": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 6) pathAnomalyCount++;
        if (operandStack.length >= 6) {
          if (operandStack.length > 6) {
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          const x1 = operandStack[operandStack.length - 6].value;
          const y1 = operandStack[operandStack.length - 5].value;
          const x2 = operandStack[operandStack.length - 4].value;
          const y2 = operandStack[operandStack.length - 3].value;
          const x3 = operandStack[operandStack.length - 2].value;
          const y3 = operandStack[operandStack.length - 1].value;
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          curX = x3;
          curY = y3;
          currentPath.push({
            type: "C",
            x1,
            y1,
            x2,
            y2,
            x: curX,
            y: curY
          });
        }
        operandStack.length = 0;
        break;
      }
      case "v": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 4) pathAnomalyCount++;
        if (operandStack.length >= 4) {
          if (operandStack.length > 4) {
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          const x2 = operandStack[operandStack.length - 4].value;
          const y2 = operandStack[operandStack.length - 3].value;
          const x3 = operandStack[operandStack.length - 2].value;
          const y3 = operandStack[operandStack.length - 1].value;
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          currentPath.push({
            type: "C",
            x1: curX,
            y1: curY,
            x2,
            y2,
            x: x3,
            y: y3
          });
          curX = x3;
          curY = y3;
        }
        operandStack.length = 0;
        break;
      }
      case "y": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 4) pathAnomalyCount++;
        if (operandStack.length >= 4) {
          if (operandStack.length > 4) {
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          const x1 = operandStack[operandStack.length - 4].value;
          const y1 = operandStack[operandStack.length - 3].value;
          const yx = operandStack[operandStack.length - 2].value;
          const yy = operandStack[operandStack.length - 1].value;
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          curX = yx;
          curY = yy;
          currentPath.push({
            type: "C",
            x1,
            y1,
            x2: curX,
            y2: curY,
            x: curX,
            y: curY
          });
        }
        operandStack.length = 0;
        break;
      }
      case "h":
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        currentPath.push({ type: "Z" });
        curX = pathStartX;
        curY = pathStartY;
        operandStack.length = 0;
        break;
      case "re": {
        if (skipCorruptedPath) {
          operandStack.length = 0;
          break;
        }
        if (operandStack.length !== 4) pathAnomalyCount++;
        if (operandStack.length >= 4) {
          if (operandStack.length > 4) {
            currentPath = [];
            operandStack.length = 0;
            break;
          }
          const rx = operandStack[operandStack.length - 4].value;
          const ry = operandStack[operandStack.length - 3].value;
          const rw = operandStack[operandStack.length - 2].value;
          const rh = operandStack[operandStack.length - 1].value;
          pathAnomalyCount = Math.max(0, pathAnomalyCount - 1);
          currentPath.push({ type: "M", x: rx, y: ry });
          currentPath.push({ type: "L", x: rx + rw, y: ry });
          currentPath.push({ type: "L", x: rx + rw, y: ry + rh });
          currentPath.push({ type: "L", x: rx, y: ry + rh });
          currentPath.push({ type: "Z" });
          curX = rx;
          curY = ry;
          pathStartX = rx;
          pathStartY = ry;
        }
        operandStack.length = 0;
        break;
      }
      // ── Path painting operators ────────────────────────────────────
      case "S":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpS = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: false,
            stroke: true,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpS.smask = currentSmask;
          if (blendMode !== "Normal") pathOpS.blendMode = blendMode;
          if (strokePatternShading) pathOpS.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOpS.strokeTilingPattern = strokeTilingPattern;
          if (!strokeColorExplicit) pathOpS.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOpS.strokeAlphaInherited = true;
          ops.push(pathOpS);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "s":
        if (operandStack.length > 0) pathAnomalyCount++;
        currentPath.push({ type: "Z" });
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOps2 = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: false,
            stroke: true,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOps2.smask = currentSmask;
          if (blendMode !== "Normal") pathOps2.blendMode = blendMode;
          if (strokePatternShading) pathOps2.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOps2.strokeTilingPattern = strokeTilingPattern;
          if (!strokeColorExplicit) pathOps2.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOps2.strokeAlphaInherited = true;
          ops.push(pathOps2);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "f":
      case "F":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pathAnomalyCount >= corruptionThreshold) {
          streamCorrupted = true;
          currentPath = [];
          operandStack.length = 0;
          break;
        }
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpF = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: false,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpF.smask = currentSmask;
          if (blendMode !== "Normal") pathOpF.blendMode = blendMode;
          if (fillPatternShading) pathOpF.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpF.tilingPattern = fillTilingPattern;
          if (!fillColorExplicit) pathOpF.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpF.fillAlphaInherited = true;
          ops.push(pathOpF);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "f*":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpFS = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: false,
            evenOdd: true,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpFS.smask = currentSmask;
          if (blendMode !== "Normal") pathOpFS.blendMode = blendMode;
          if (fillPatternShading) pathOpFS.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpFS.tilingPattern = fillTilingPattern;
          if (!fillColorExplicit) pathOpFS.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpFS.fillAlphaInherited = true;
          ops.push(pathOpFS);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "B":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpB = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: true,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpB.smask = currentSmask;
          if (blendMode !== "Normal") pathOpB.blendMode = blendMode;
          if (fillPatternShading) pathOpB.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpB.tilingPattern = fillTilingPattern;
          if (strokePatternShading) pathOpB.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOpB.strokeTilingPattern = strokeTilingPattern;
          if (!fillColorExplicit) pathOpB.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpB.fillAlphaInherited = true;
          if (!strokeColorExplicit) pathOpB.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOpB.strokeAlphaInherited = true;
          ops.push(pathOpB);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "B*":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpBS = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: true,
            evenOdd: true,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpBS.smask = currentSmask;
          if (blendMode !== "Normal") pathOpBS.blendMode = blendMode;
          if (fillPatternShading) pathOpBS.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpBS.tilingPattern = fillTilingPattern;
          if (strokePatternShading) pathOpBS.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOpBS.strokeTilingPattern = strokeTilingPattern;
          if (!fillColorExplicit) pathOpBS.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpBS.fillAlphaInherited = true;
          if (!strokeColorExplicit) pathOpBS.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOpBS.strokeAlphaInherited = true;
          ops.push(pathOpBS);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "b":
        if (operandStack.length > 0) pathAnomalyCount++;
        currentPath.push({ type: "Z" });
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpb = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: true,
            evenOdd: false,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpb.smask = currentSmask;
          if (blendMode !== "Normal") pathOpb.blendMode = blendMode;
          if (fillPatternShading) pathOpb.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpb.tilingPattern = fillTilingPattern;
          if (strokePatternShading) pathOpb.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOpb.strokeTilingPattern = strokeTilingPattern;
          if (!fillColorExplicit) pathOpb.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpb.fillAlphaInherited = true;
          if (!strokeColorExplicit) pathOpb.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOpb.strokeAlphaInherited = true;
          ops.push(pathOpb);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "b*":
        if (operandStack.length > 0) pathAnomalyCount++;
        currentPath.push({ type: "Z" });
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        if (currentPath.length > 0) {
          const pathOpbS = {
            type: "path",
            commands: currentPath,
            ctm: ctm.slice(),
            fill: true,
            stroke: true,
            evenOdd: true,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            miterLimit,
            dashArray: dashArray.length > 0 ? dashArray.slice() : dashArray,
            dashPhase,
            fillAlpha,
            strokeAlpha
          };
          if (currentSmask) pathOpbS.smask = currentSmask;
          if (blendMode !== "Normal") pathOpbS.blendMode = blendMode;
          if (fillPatternShading) pathOpbS.patternShading = fillPatternShading;
          if (fillTilingPattern) pathOpbS.tilingPattern = fillTilingPattern;
          if (strokePatternShading) pathOpbS.strokePatternShading = strokePatternShading;
          if (strokeTilingPattern) pathOpbS.strokeTilingPattern = strokeTilingPattern;
          if (!fillColorExplicit) pathOpbS.fillColorInherited = true;
          if (!fillAlphaExplicit) pathOpbS.fillAlphaInherited = true;
          if (!strokeColorExplicit) pathOpbS.strokeColorInherited = true;
          if (!strokeAlphaExplicit) pathOpbS.strokeAlphaInherited = true;
          ops.push(pathOpbS);
        }
        currentPath = [];
        operandStack.length = 0;
        break;
      case "n":
        if (operandStack.length > 0) pathAnomalyCount++;
        if (pendingClip && currentPath.length > 0) {
          clipStack.push({ path: currentPath.slice(), ctm: ctm.slice(), evenOdd: pendingClipEvenOdd });
        }
        pendingClip = false;
        pendingClipEvenOdd = false;
        currentPath = [];
        operandStack.length = 0;
        break;
      case "W":
      case "W*":
        pendingClip = true;
        pendingClipEvenOdd = tok.value === "W*";
        operandStack.length = 0;
        break;
      default:
        operandStack.length = 0;
        break;
    }
    if (ocHidden && ops.length > opsLenBeforeOp) ops.length = opsLenBeforeOp;
    if (clipStack.length > 0) {
      for (let j = opsLenBeforeOp; j < ops.length; j++) {
        if (!ops[j].clips) {
          ops[j].clips = clipStack.map((c) => {
            const entry = { path: c.path ? c.path.slice() : null, ctm: c.ctm.slice(), evenOdd: c.evenOdd };
            if (c.textClip) entry.textClip = c.textClip;
            return entry;
          });
        }
      }
    }
    if (fillPatternShading || fillTilingPattern) {
      for (let j = opsLenBeforeOp; j < ops.length; j++) {
        if (ops[j].type === "type0text") {
          if (fillPatternShading) ops[j].patternShading = fillPatternShading;
          if (fillTilingPattern) ops[j].tilingPattern = fillTilingPattern;
        }
      }
    }
    if (textRenderMode >= 4) {
      for (let j = opsLenBeforeOp; j < ops.length; j++) {
        const op = ops[j];
        if (op.type === "type0text" && op.fontFamily && op.text) {
          textClipChars.push({
            text: op.text,
            fontFamily: op.fontFamily,
            fontSize: op.fontSize,
            a: op.a,
            b: op.b,
            c: op.c,
            d: op.d,
            x: op.x,
            y: op.y
          });
        }
      }
    }
  }
  return ops;
}
function pageRectToContentRect(bboxPx, dims, box, rotate) {
  const corners = [
    [bboxPx.left, bboxPx.top],
    [bboxPx.right, bboxPx.top],
    [bboxPx.left, bboxPx.bottom],
    [bboxPx.right, bboxPx.bottom]
  ];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [px, py] of corners) {
    const [x, y] = pagePointToContentPoint(px, py, dims, box, rotate);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (!(x1 > x0 && y1 > y0)) return null;
  return [x0, y0, x1, y1];
}
function pagePointToContentPoint(px, py, dims, box, rotate) {
  const contentW = Math.abs(box[2] - box[0]);
  const contentH = Math.abs(box[3] - box[1]);
  const ox = Math.min(box[0], box[2]);
  const oy = Math.min(box[1], box[3]);
  const rot = (rotate % 360 + 360) % 360;
  const visW = rot % 180 === 0 ? contentW : contentH;
  const visH = rot % 180 === 0 ? contentH : contentW;
  const vx = px * (visW / dims.width);
  const vy = visH - py * (visH / dims.height);
  if (rot === 90) return [contentW + ox - vy, vx + oy];
  if (rot === 180) return [contentW + ox - vx, contentH + oy - vy];
  if (rot === 270) return [vy + ox, contentH + oy - vx];
  return [vx + ox, vy + oy];
}
function mapImageDelete(rec, dims, box, rotate) {
  const rect = pageRectToContentRect(rec.rect, dims, box, rotate);
  if (!rect) return null;
  const sites = [];
  for (const s of rec.sites || []) {
    const r = pageRectToContentRect(s, dims, box, rotate);
    if (r) sites.push({ objNum: Number.isFinite(s.objNum) ? (
      /** @type {number} */
      s.objNum
    ) : null, rect: r });
  }
  if (sites.length === 0) return null;
  const [ax, ay] = pagePointToContentPoint(0, 0, dims, box, rotate);
  const [bx, by] = pagePointToContentPoint(1, 0, dims, box, rotate);
  const tol = 2 * Math.hypot(bx - ax, by - ay);
  return { rect, sites, tol };
}
function imageDrawMatchesDelete(ctm, gate, objNum) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const x = u * ctm[0] + v * ctm[2] + ctm[4];
    const y = u * ctm[1] + v * ctm[3] + ctm[5];
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const t = gate.tol;
  if (x0 < gate.rect[0] - t || y0 < gate.rect[1] - t || x1 > gate.rect[2] + t || y1 > gate.rect[3] + t) return false;
  for (const s of gate.sites) {
    if (Math.abs(x0 - s.rect[0]) > t || Math.abs(y0 - s.rect[1]) > t || Math.abs(x1 - s.rect[2]) > t || Math.abs(y1 - s.rect[3]) > t) continue;
    if (s.objNum !== null && objNum !== null && objNum !== void 0 && s.objNum !== objNum) continue;
    return true;
  }
  return false;
}
function mapPathDelete(rec, dims, box, rotate) {
  const mapRect = (r) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [px, py] of [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]]) {
      const [x, y] = pagePointToContentPoint(px, py, dims, box, rotate);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    return (
      /** @type {[number, number, number, number]} */
      [x0, y0, x1, y1]
    );
  };
  const sites = [];
  for (const s of rec.sites || []) {
    if (typeof s.commands !== "number" || s.paint !== "f" && s.paint !== "s" && s.paint !== "fs") continue;
    sites.push({ rect: mapRect(s), paint: s.paint, commands: s.commands });
  }
  if (sites.length === 0) return null;
  const [ax, ay] = pagePointToContentPoint(0, 0, dims, box, rotate);
  const [bx, by] = pagePointToContentPoint(1, 0, dims, box, rotate);
  const tol = 2 * Math.hypot(bx - ax, by - ay);
  return { rect: mapRect(rec.rect), sites, tol };
}
function pathDrawMatchesDelete(hull, gate, paint, commands) {
  const t = gate.tol;
  if (hull[0] < gate.rect[0] - t || hull[1] < gate.rect[1] - t || hull[2] > gate.rect[2] + t || hull[3] > gate.rect[3] + t) return false;
  for (const s of gate.sites) {
    if (Math.abs(hull[0] - s.rect[0]) > t || Math.abs(hull[1] - s.rect[1]) > t || Math.abs(hull[2] - s.rect[2]) > t || Math.abs(hull[3] - s.rect[3]) > t) continue;
    if (s.paint !== paint || s.commands !== commands) continue;
    return true;
  }
  return false;
}
const idctCos = new Float64Array(64);
for (let x = 0; x < 8; x++) {
  for (let u = 0; u < 8; u++) {
    const alpha = u === 0 ? 1 / Math.sqrt(2) : 1;
    idctCos[x * 8 + u] = alpha * Math.cos((2 * x + 1) * u * Math.PI / 16) / 2;
  }
}
const idctScratch = new Float64Array(64);
function idct8x8(block) {
  for (let row = 0; row < 8; row++) {
    const b = row * 8;
    const f0 = block[b];
    const f1 = block[b + 1];
    const f2 = block[b + 2];
    const f3 = block[b + 3];
    const f4 = block[b + 4];
    const f5 = block[b + 5];
    const f6 = block[b + 6];
    const f7 = block[b + 7];
    for (let n = 0; n < 4; n++) {
      const r = n * 8;
      const E = f0 * idctCos[r] + f2 * idctCos[r + 2] + f4 * idctCos[r + 4] + f6 * idctCos[r + 6];
      const O = f1 * idctCos[r + 1] + f3 * idctCos[r + 3] + f5 * idctCos[r + 5] + f7 * idctCos[r + 7];
      idctScratch[b + n] = E + O;
      idctScratch[b + 7 - n] = E - O;
    }
  }
  for (let col = 0; col < 8; col++) {
    const f0 = idctScratch[col];
    const f1 = idctScratch[8 + col];
    const f2 = idctScratch[16 + col];
    const f3 = idctScratch[24 + col];
    const f4 = idctScratch[32 + col];
    const f5 = idctScratch[40 + col];
    const f6 = idctScratch[48 + col];
    const f7 = idctScratch[56 + col];
    for (let n = 0; n < 4; n++) {
      const r = n * 8;
      const E = f0 * idctCos[r] + f2 * idctCos[r + 2] + f4 * idctCos[r + 4] + f6 * idctCos[r + 6];
      const O = f1 * idctCos[r + 1] + f3 * idctCos[r + 3] + f5 * idctCos[r + 5] + f7 * idctCos[r + 7];
      block[n * 8 + col] = Math.round(E + O) + 128;
      block[(7 - n) * 8 + col] = Math.round(E - O) + 128;
    }
  }
}
function idct4x4(block) {
  for (let x = 0; x < 8; x++) {
    const c0 = idctCos[x * 8];
    const c1 = idctCos[x * 8 + 1];
    const c2 = idctCos[x * 8 + 2];
    const c3 = idctCos[x * 8 + 3];
    idctScratch[x] = block[0] * c0 + block[1] * c1 + block[2] * c2 + block[3] * c3;
    idctScratch[8 + x] = block[8] * c0 + block[9] * c1 + block[10] * c2 + block[11] * c3;
    idctScratch[16 + x] = block[16] * c0 + block[17] * c1 + block[18] * c2 + block[19] * c3;
    idctScratch[24 + x] = block[24] * c0 + block[25] * c1 + block[26] * c2 + block[27] * c3;
  }
  for (let y = 0; y < 8; y++) {
    const c0 = idctCos[y * 8];
    const c1 = idctCos[y * 8 + 1];
    const c2 = idctCos[y * 8 + 2];
    const c3 = idctCos[y * 8 + 3];
    const b = y * 8;
    for (let x = 0; x < 8; x++) {
      block[b + x] = Math.round(idctScratch[x] * c0 + idctScratch[8 + x] * c1 + idctScratch[16 + x] * c2 + idctScratch[24 + x] * c3) + 128;
    }
  }
}
function idct2x2(block) {
  const F0 = block[0];
  const F1 = block[1];
  const F8 = block[8];
  const F9 = block[9];
  for (let x = 0; x < 8; x++) {
    idctScratch[x] = F0 * idctCos[x * 8] + F1 * idctCos[x * 8 + 1];
    idctScratch[8 + x] = F8 * idctCos[x * 8] + F9 * idctCos[x * 8 + 1];
  }
  for (let y = 0; y < 8; y++) {
    const cy0 = idctCos[y * 8];
    const cy1 = idctCos[y * 8 + 1];
    const b = y * 8;
    for (let x = 0; x < 8; x++) block[b + x] = Math.round(idctScratch[x] * cy0 + idctScratch[8 + x] * cy1) + 128;
  }
}
const boxAvgMatrix = {};
for (const bm of [2, 4]) {
  const s = 8 / bm;
  const mat = new Float64Array(bm * 8);
  for (let j = 0; j < bm; j++) {
    for (let u = 0; u < 8; u++) {
      let acc = 0;
      for (let n = j * s; n < (j + 1) * s; n++) acc += idctCos[n * 8 + u];
      mat[j * 8 + u] = acc / s;
    }
  }
  boxAvgMatrix[bm] = mat;
}
const boxAvgScratch = new Float64Array(4 * 8);
function idctBoxAvg(block, m, mat, out, maxRow, maxCol) {
  for (let u = 0; u <= maxRow; u++) {
    const bu = u * 8;
    for (let i = 0; i < m; i++) {
      const mi = i * 8;
      let acc = 0;
      for (let c = 0; c <= maxCol; c++) acc += block[bu + c] * mat[mi + c];
      boxAvgScratch[u * m + i] = acc;
    }
  }
  for (let j = 0; j < m; j++) {
    const mj = j * 8;
    for (let i = 0; i < m; i++) {
      let acc = 0;
      for (let u = 0; u <= maxRow; u++) acc += boxAvgScratch[u * m + i] * mat[mj + u];
      let v = Math.round(acc) + 128;
      if (v < 0) v = 0;
      else if (v > 255) v = 255;
      out[j * m + i] = v;
    }
  }
}
function buildHuffmanTable(bits, values) {
  const entries = [];
  let code = 0;
  let vi = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < bits[len - 1]; i++) {
      entries.push({ code, len, symbol: values[vi] });
      vi++;
      code++;
    }
    code <<= 1;
  }
  const maxCode = new Int32Array(17).fill(-1);
  const minCode = new Int32Array(17).fill(0);
  const valOffset = new Int32Array(17).fill(0);
  const symbols = new Uint8Array(entries.length);
  let ei = 0;
  for (let len = 1; len <= 16; len++) {
    const count = bits[len - 1];
    if (count > 0) {
      valOffset[len] = ei;
      minCode[len] = entries[ei].code;
      for (let i = 0; i < count; i++) {
        symbols[ei] = entries[ei].symbol;
        ei++;
      }
      maxCode[len] = entries[ei - 1].code;
    }
  }
  const lut = new Int32Array(256);
  for (let idx = 0; idx < 256; idx++) {
    for (let len = 1; len <= 8; len++) {
      const code2 = idx >> 8 - len;
      if (maxCode[len] >= 0 && code2 <= maxCode[len]) {
        const sIdx = valOffset[len] + (code2 - minCode[len]);
        lut[idx] = sIdx >= 0 && sIdx < symbols.length ? len << 8 | symbols[sIdx] : -(len << 8);
        break;
      }
    }
  }
  return {
    maxCode,
    minCode,
    valOffset,
    symbols,
    lut
  };
}
class BitReader {
  /**
   * Buffered bitstream reader: keeps up to ~24 bits in bitBuf, refilling a byte at a time with 0xFF00 unstuffing.
   * A marker (0xFF followed by non-zero) stops refilling with pos left at the 0xFF, and reads return -1 once the buffered bits run out.
   * Past end-of-data (no marker) reads keep producing 0 bits.
   * @param {Uint8Array} data
   * @param {number} offset - start position in data
   */
  constructor(data, offset) {
    this.data = data;
    this.pos = offset;
    this.bitBuf = 0;
    this.bitCnt = 0;
    this.markerSeen = false;
  }
  fill() {
    const data = this.data;
    const len = data.length;
    while (this.bitCnt <= 16 && !this.markerSeen) {
      let b;
      if (this.pos >= len) {
        b = 0;
        this.pos++;
      } else {
        b = data[this.pos];
        if (b === 255) {
          const next = this.pos + 1 < len ? data[this.pos + 1] : -1;
          if (next === 0) {
            this.pos += 2;
          } else {
            this.markerSeen = true;
            break;
          }
        } else {
          this.pos++;
        }
      }
      this.bitBuf = this.bitBuf << 8 | b;
      this.bitCnt += 8;
    }
  }
  /**
   * Read the next bit from the bitstream.
   * @returns {number} 0 or 1, or -1 at a marker
   */
  readBit() {
    if (this.bitCnt === 0) {
      this.fill();
      if (this.bitCnt === 0) return -1;
    }
    this.bitCnt--;
    return this.bitBuf >>> this.bitCnt & 1;
  }
  /**
   * Read n bits as an unsigned integer (MSB first).
   * @param {number} n
   * @returns {number} the n-bit value, or -1 at a marker
   */
  readBits(n) {
    if (this.bitCnt < n) this.fill();
    if (this.bitCnt >= n) {
      this.bitCnt -= n;
      return this.bitBuf >>> this.bitCnt & (1 << n) - 1;
    }
    let val = 0;
    for (let i = 0; i < n; i++) {
      const bit = this.readBit();
      if (bit < 0) return -1;
      val = val << 1 | bit;
    }
    return val;
  }
  /**
   * Decode one Huffman symbol: 8-bit LUT fast path, bit-by-bit fallback for longer codes.
   * @param {{maxCode: Int32Array, minCode: Int32Array, valOffset: Int32Array, symbols: Uint8Array, lut: Int32Array}} table - Prebuilt Huffman decode table.
   * @returns {number|undefined} decoded symbol value, -1 on error, or undefined for an out-of-range symbol.
   */
  decodeHuffman(table) {
    if (this.bitCnt < 16) this.fill();
    if (this.bitCnt >= 8) {
      const idx = this.bitBuf >>> this.bitCnt - 8 & 255;
      const hit = table.lut[idx];
      if (hit > 0) {
        this.bitCnt -= hit >> 8;
        return hit & 255;
      }
      if (hit < 0) {
        this.bitCnt -= -hit >> 8;
        return void 0;
      }
      let code2 = idx;
      this.bitCnt -= 8;
      for (let len = 9; len <= 16; len++) {
        const bit = this.readBit();
        if (bit < 0) return -1;
        code2 = code2 << 1 | bit;
        if (table.maxCode[len] >= 0 && code2 <= table.maxCode[len]) {
          return table.symbols[table.valOffset[len] + (code2 - table.minCode[len])];
        }
      }
      return -1;
    }
    let code = 0;
    for (let len = 1; len <= 16; len++) {
      const bit = this.readBit();
      if (bit < 0) return -1;
      code = code << 1 | bit;
      if (table.maxCode[len] >= 0 && code <= table.maxCode[len]) {
        return table.symbols[table.valOffset[len] + (code - table.minCode[len])];
      }
    }
    return -1;
  }
}
function decodeJPEGComponents(jpegData, roi = null, scale = 1) {
  let pos = 0;
  const len = jpegData.length;
  function readMarker() {
    if (pos + 1 >= len) return -1;
    if (jpegData[pos] !== 255) return -1;
    pos++;
    while (pos < len && jpegData[pos] === 255) pos++;
    if (pos >= len) return -1;
    return jpegData[pos++];
  }
  function readUint16() {
    const v = jpegData[pos] << 8 | jpegData[pos + 1];
    pos += 2;
    return v;
  }
  let width = 0;
  let height = 0;
  let numComponents = 0;
  const components = [];
  const qtables = [null, null, null, null];
  const dcTables = [null, null, null, null];
  const acTables = [null, null, null, null];
  let adobeTransform = -1;
  let isBaseline = false;
  let maxHSamp = 1;
  let maxVSamp = 1;
  let restartInterval = 0;
  const soi = readMarker();
  if (soi !== 216) return null;
  let sosFound = false;
  while (pos < len && !sosFound) {
    const marker = readMarker();
    if (marker < 0) break;
    switch (marker) {
      case 192:
      // SOF0 — Baseline DCT
      case 193: {
        isBaseline = true;
        readUint16();
        const precision = jpegData[pos++];
        if (precision !== 8) return null;
        height = readUint16();
        width = readUint16();
        numComponents = jpegData[pos++];
        if (numComponents !== 3 && numComponents !== 4) return null;
        for (let i = 0; i < numComponents; i++) {
          const id = jpegData[pos++];
          const sampling = jpegData[pos++];
          const hSamp = sampling >> 4;
          const vSamp = sampling & 15;
          const qtId = jpegData[pos++];
          components.push({
            id,
            hSamp,
            vSamp,
            qtId,
            dcTableId: 0,
            acTableId: 0
          });
          if (hSamp > maxHSamp) maxHSamp = hSamp;
          if (vSamp > maxVSamp) maxVSamp = vSamp;
        }
        break;
      }
      case 194: {
        return null;
      }
      case 196: {
        const segLen = readUint16();
        const segEnd = pos + segLen - 2;
        while (pos < segEnd) {
          const info = jpegData[pos++];
          const tableClass = info >> 4;
          const tableId = info & 15;
          const bits = new Uint8Array(16);
          let totalCodes = 0;
          for (let i = 0; i < 16; i++) {
            bits[i] = jpegData[pos++];
            totalCodes += bits[i];
          }
          const values = new Uint8Array(totalCodes);
          for (let i = 0; i < totalCodes; i++) {
            values[i] = jpegData[pos++];
          }
          const table = buildHuffmanTable(bits, values);
          if (tableClass === 0) dcTables[tableId] = table;
          else acTables[tableId] = table;
        }
        pos = segEnd;
        break;
      }
      case 219: {
        const segLen = readUint16();
        const segEnd = pos + segLen - 2;
        while (pos < segEnd) {
          const info = jpegData[pos++];
          const precision = info >> 4;
          const tableId = info & 15;
          const qt = new Int32Array(64);
          if (precision === 0) {
            for (let i = 0; i < 64; i++) qt[i] = jpegData[pos++];
          } else {
            for (let i = 0; i < 64; i++) {
              qt[i] = jpegData[pos] << 8 | jpegData[pos + 1];
              pos += 2;
            }
          }
          qtables[tableId] = qt;
        }
        pos = segEnd;
        break;
      }
      case 218: {
        readUint16();
        const nComp = jpegData[pos++];
        for (let i = 0; i < nComp; i++) {
          const compId = jpegData[pos++];
          const tables = jpegData[pos++];
          const dcId = tables >> 4;
          const acId = tables & 15;
          for (const comp of components) {
            if (comp.id === compId) {
              comp.dcTableId = dcId;
              comp.acTableId = acId;
              break;
            }
          }
        }
        pos += 3;
        sosFound = true;
        break;
      }
      case 238: {
        const segLen = readUint16();
        const segEnd = pos + segLen - 2;
        if (segLen >= 14) {
          const id = String.fromCharCode(
            jpegData[pos],
            jpegData[pos + 1],
            jpegData[pos + 2],
            jpegData[pos + 3],
            jpegData[pos + 4]
          );
          if (id === "Adobe") {
            adobeTransform = jpegData[pos + 11];
          }
        }
        pos = segEnd;
        break;
      }
      case 217:
        return null;
      case 221: {
        readUint16();
        restartInterval = readUint16();
        break;
      }
      default: {
        if (marker >= 224 && marker <= 239) {
          const segLen = readUint16();
          pos += segLen - 2;
        } else if (marker >= 192) {
          const segLen = readUint16();
          pos += segLen - 2;
        }
        break;
      }
    }
  }
  if (!sosFound || numComponents !== 3 && numComponents !== 4 || !isBaseline) return null;
  const zigzag = [
    0,
    1,
    8,
    16,
    9,
    2,
    3,
    10,
    17,
    24,
    32,
    25,
    18,
    11,
    4,
    5,
    12,
    19,
    26,
    33,
    40,
    48,
    41,
    34,
    27,
    20,
    13,
    6,
    7,
    14,
    21,
    28,
    35,
    42,
    49,
    56,
    57,
    50,
    43,
    36,
    29,
    22,
    15,
    23,
    30,
    37,
    44,
    51,
    58,
    59,
    52,
    45,
    38,
    31,
    39,
    46,
    53,
    60,
    61,
    54,
    47,
    55,
    62,
    63
  ];
  const mcuW = maxHSamp * 8;
  const mcuH = maxVSamp * 8;
  const mcuCountX = Math.ceil(width / mcuW);
  const mcuCountY = Math.ceil(height / mcuH);
  const m = 8 / scale;
  const bs = scale === 1 ? 8 : m;
  const compBuffers = components.map((comp) => {
    const cw = mcuCountX * comp.hSamp * bs;
    const ch = mcuCountY * comp.vSamp * bs;
    return new Uint8Array(cw * ch);
  });
  const compWidths = components.map((comp) => mcuCountX * comp.hSamp * bs);
  const prevDC = new Int32Array(numComponents);
  const reader = new BitReader(jpegData, pos);
  let mcuCount = 0;
  const dX0 = roi ? roi.x0 - mcuW : 0;
  const dY0 = roi ? roi.y0 - mcuH : 0;
  const dX1 = roi ? roi.x1 + mcuW : width;
  const dY1 = roi ? roi.y1 + mcuH : height;
  const block = new Int32Array(64);
  const scaledOut = new Uint8Array(16);
  for (let mcuY = 0; mcuY < mcuCountY; mcuY++) {
    if (roi && mcuY * mcuH >= dY1) break;
    const rowVisible = !roi || mcuY * mcuH < dY1 && (mcuY + 1) * mcuH > dY0;
    for (let mcuX = 0; mcuX < mcuCountX; mcuX++) {
      const mcuVisible = rowVisible && (!roi || mcuX * mcuW < dX1 && (mcuX + 1) * mcuW > dX0);
      if (restartInterval > 0 && mcuCount > 0 && mcuCount % restartInterval === 0) {
        reader.bitBuf = 0;
        reader.bitCnt = 0;
        reader.markerSeen = false;
        let rPos = reader.pos;
        while (rPos < len - 1) {
          if (jpegData[rPos] === 255 && jpegData[rPos + 1] >= 208 && jpegData[rPos + 1] <= 215) {
            rPos += 2;
            break;
          }
          rPos++;
        }
        reader.pos = rPos;
        reader.bitBuf = 0;
        reader.bitCnt = 0;
        reader.markerSeen = false;
        prevDC.fill(0);
      }
      for (let ci = 0; ci < numComponents; ci++) {
        const comp = components[ci];
        const qt = qtables[comp.qtId];
        const dcTable = dcTables[comp.dcTableId];
        const acTable = acTables[comp.acTableId];
        if (!qt || !dcTable || !acTable) return null;
        const blocksH = comp.hSamp;
        const blocksV = comp.vSamp;
        for (let bv = 0; bv < blocksV; bv++) {
          for (let bh = 0; bh < blocksH; bh++) {
            block.fill(0);
            const dcCategory = reader.decodeHuffman(dcTable);
            if (dcCategory < 0) {
              break;
            }
            let dcVal = 0;
            if (dcCategory > 0) {
              dcVal = reader.readBits(dcCategory);
              if (dcVal < 0) break;
              if (dcVal < 1 << dcCategory - 1) {
                dcVal -= (1 << dcCategory) - 1;
              }
            }
            prevDC[ci] += dcVal;
            block[0] = prevDC[ci] * qt[0];
            let k = 1;
            let maxRow = 0;
            let maxCol = 0;
            while (k < 64) {
              const acSymbol = reader.decodeHuffman(acTable);
              if (acSymbol < 0) break;
              if (acSymbol === 0) break;
              const runLength = acSymbol >> 4;
              const acCategory = acSymbol & 15;
              k += runLength;
              if (k >= 64) break;
              if (acCategory > 0) {
                let acVal = reader.readBits(acCategory);
                if (acVal < 0) break;
                if (acVal < 1 << acCategory - 1) {
                  acVal -= (1 << acCategory) - 1;
                }
                const nat = zigzag[k];
                block[nat] = acVal * qt[k];
                const nr = nat >> 3;
                const nc = nat & 7;
                if (nr > maxRow) maxRow = nr;
                if (nc > maxCol) maxCol = nc;
              }
              k++;
            }
            if (!mcuVisible) continue;
            if (scale === 1) {
              if (maxRow === 0 && maxCol === 0) {
                block.fill(Math.round(block[0] * idctCos[0] * idctCos[0]) + 128);
              } else if (maxRow <= 1 && maxCol <= 1) {
                idct2x2(block);
              } else if (maxRow <= 3 && maxCol <= 3) {
                idct4x4(block);
              } else {
                idct8x8(block);
              }
              const cx = (mcuX * blocksH + bh) * 8;
              const cy = (mcuY * blocksV + bv) * 8;
              const cw = compWidths[ci];
              const cbuf = compBuffers[ci];
              for (let row = 0; row < 8; row++) {
                const dst = (cy + row) * cw + cx;
                const src = row * 8;
                let v0 = block[src];
                if (v0 < 0) v0 = 0;
                else if (v0 > 255) v0 = 255;
                let v1 = block[src + 1];
                if (v1 < 0) v1 = 0;
                else if (v1 > 255) v1 = 255;
                let v2 = block[src + 2];
                if (v2 < 0) v2 = 0;
                else if (v2 > 255) v2 = 255;
                let v3 = block[src + 3];
                if (v3 < 0) v3 = 0;
                else if (v3 > 255) v3 = 255;
                let v4 = block[src + 4];
                if (v4 < 0) v4 = 0;
                else if (v4 > 255) v4 = 255;
                let v5 = block[src + 5];
                if (v5 < 0) v5 = 0;
                else if (v5 > 255) v5 = 255;
                let v6 = block[src + 6];
                if (v6 < 0) v6 = 0;
                else if (v6 > 255) v6 = 255;
                let v7 = block[src + 7];
                if (v7 < 0) v7 = 0;
                else if (v7 > 255) v7 = 255;
                cbuf[dst] = v0;
                cbuf[dst + 1] = v1;
                cbuf[dst + 2] = v2;
                cbuf[dst + 3] = v3;
                cbuf[dst + 4] = v4;
                cbuf[dst + 5] = v5;
                cbuf[dst + 6] = v6;
                cbuf[dst + 7] = v7;
              }
            } else {
              if (m === 1) {
                let v = Math.round(block[0] * idctCos[0] * idctCos[0]) + 128;
                if (v < 0) v = 0;
                else if (v > 255) v = 255;
                scaledOut[0] = v;
              } else {
                idctBoxAvg(block, m, boxAvgMatrix[m], scaledOut, maxRow, maxCol);
              }
              const cx = (mcuX * blocksH + bh) * m;
              const cy = (mcuY * blocksV + bv) * m;
              const cw = compWidths[ci];
              for (let row = 0; row < m; row++) {
                for (let col = 0; col < m; col++) {
                  compBuffers[ci][(cy + row) * cw + (cx + col)] = scaledOut[row * m + col];
                }
              }
            }
          }
        }
      }
      mcuCount++;
    }
  }
  const compHeights = components.map((comp) => mcuCountY * comp.vSamp * bs);
  return {
    width,
    height,
    outW: scale === 1 ? width : Math.ceil(width / scale),
    outH: scale === 1 ? height : Math.ceil(height / scale),
    numComponents,
    compBuffers,
    compWidths,
    compHeights,
    compSampling: components.map((c) => ({ hSamp: c.hSamp, vSamp: c.vSamp })),
    maxHSamp,
    maxVSamp,
    adobeTransform
  };
}
function decodeCMYKJpegToRGB(jpegData, decodeInvert = false, roi = null, scale = 1) {
  const dec = decodeJPEGComponents(jpegData, roi, scale);
  if (!dec) return null;
  const {
    outW,
    outH,
    numComponents,
    compBuffers,
    compWidths,
    compHeights,
    compSampling,
    maxHSamp,
    maxVSamp,
    adobeTransform
  } = dec;
  const rgbData = new Uint8Array(outW * outH * 4);
  const rgb32 = new Uint32Array(rgbData.buffer);
  const rx0 = roi ? Math.max(0, Math.floor(roi.x0 / scale)) : 0;
  const ry0 = roi ? Math.max(0, Math.floor(roi.y0 / scale)) : 0;
  const rx1 = roi ? Math.min(outW, Math.ceil(roi.x1 / scale)) : outW;
  const ry1 = roi ? Math.min(outH, Math.ceil(roi.y1 / scale)) : outH;
  const noSubsampling = numComponents === 4 && compSampling.every((cs) => cs.hSamp === maxHSamp && cs.vSamp === maxVSamp);
  const b0 = compBuffers[0];
  const b1 = compBuffers[1];
  const b2 = compBuffers[2];
  const b3 = compBuffers[3];
  const w0 = compWidths[0];
  const w1 = compWidths[1];
  const w2 = compWidths[2];
  const w3 = compWidths[3];
  const comp = new Uint8Array(numComponents);
  let prevC = -1;
  let prevM = -1;
  let prevY = -1;
  let prevK = -1;
  let prevWord = 0;
  const cacheKey = new Int32Array(4096);
  const cacheVal = new Int32Array(4096);
  const cacheSet = new Uint8Array(4096);
  for (let py = ry0; py < ry1; py++) {
    const r0 = py * w0;
    const r1 = py * w1;
    const r2 = py * w2;
    const r3 = py * w3;
    for (let px = rx0; px < rx1; px++) {
      const di = (py * outW + px) * 4;
      let c;
      let m;
      let y;
      let k;
      if (noSubsampling) {
        c = b0[r0 + px];
        m = b1[r1 + px];
        y = b2[r2 + px];
        k = b3[r3 + px];
      } else {
        for (let ci = 0; ci < numComponents; ci++) {
          const cs = compSampling[ci];
          if (cs.hSamp === maxHSamp && cs.vSamp === maxVSamp) {
            comp[ci] = compBuffers[ci][py * compWidths[ci] + px];
          } else {
            const cw = compWidths[ci];
            const ch = compHeights[ci];
            const fx = px * cs.hSamp / maxHSamp;
            const fy = py * cs.vSamp / maxVSamp;
            const x0 = Math.floor(fx);
            const y0 = Math.floor(fy);
            const x1 = Math.min(x0 + 1, cw - 1);
            const y1 = Math.min(y0 + 1, ch - 1);
            const dx = fx - x0;
            const dy = fy - y0;
            const buf = compBuffers[ci];
            const v00 = buf[y0 * cw + x0];
            const v10 = buf[y0 * cw + x1];
            const v01 = buf[y1 * cw + x0];
            const v11 = buf[y1 * cw + x1];
            comp[ci] = (v00 * (1 - dx) + v10 * dx) * (1 - dy) + (v01 * (1 - dx) + v11 * dx) * dy + 0.5 | 0;
          }
        }
        c = comp[0];
        m = comp[1];
        y = comp[2];
        k = comp[3];
      }
      const rawC = c;
      const rawM = m;
      const rawY = y;
      const rawK = k;
      if (rawC === prevC && rawM === prevM && rawY === prevY && rawK === prevK) {
        rgb32[di >> 2] = prevWord;
        continue;
      }
      const key = rawC << 24 | rawM << 16 | rawY << 8 | rawK;
      const slot = Math.imul(key, 2654435761) >>> 20;
      if (cacheSet[slot] === 1 && cacheKey[slot] === key) {
        const word2 = cacheVal[slot];
        rgb32[di >> 2] = word2;
        prevC = rawC;
        prevM = rawM;
        prevY = rawY;
        prevK = rawK;
        prevWord = word2;
        continue;
      }
      if (adobeTransform === 2) {
        const Y = c;
        const Cb = m;
        const Cr = y;
        let R2 = Y + 1.402 * (Cr - 128);
        let G2 = Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128);
        let B2 = Y + 1.772 * (Cb - 128);
        if (R2 < 0) R2 = 0;
        if (R2 > 255) R2 = 255;
        if (G2 < 0) G2 = 0;
        if (G2 > 255) G2 = 255;
        if (B2 < 0) B2 = 0;
        if (B2 > 255) B2 = 255;
        c = 255 - R2;
        m = 255 - G2;
        y = 255 - B2;
      }
      if (decodeInvert) {
        c = 255 - c;
        m = 255 - m;
        y = 255 - y;
        k = 255 - k;
      }
      const cn = c / 255;
      const mn = m / 255;
      const yn = y / 255;
      const kn = k / 255;
      const ri = 255 + cn * (-4.387332384609988 * cn + 54.48615194189176 * mn + 18.82290502165302 * yn + 212.25662451639585 * kn - 285.2331026137004) + mn * (1.7149763477362134 * mn - 5.6096736904047315 * yn - 17.873870861415444 * kn - 5.497006427196366) + yn * (-2.5217340131683033 * yn - 21.248923337353073 * kn + 17.5119270841813) + kn * (-21.86122147463605 * kn - 189.48180835922747);
      const gi = 255 + cn * (8.841041422036149 * cn + 60.118027045597366 * mn + 6.871425592049007 * yn + 31.159100130055922 * kn - 79.2970844816548) + mn * (-15.310361306967817 * mn + 17.575251261109482 * yn + 131.35250912493976 * kn - 190.9453302588951) + yn * (4.444339102852739 * yn + 9.8632861493405 * kn - 24.86741582555878) + kn * (-20.737325471181034 * kn - 187.80453709719578);
      const bi = 255 + cn * (0.8842522430003296 * cn + 8.078677503112928 * mn + 30.89978309703729 * yn - 0.23883238689178934 * kn - 14.183576799673286) + mn * (10.49593273432072 * mn + 63.02378494754052 * yn + 50.606957656360734 * kn - 112.23884253719248) + yn * (0.03296041114873217 * yn + 115.60384449646641 * kn - 193.58209356861505) + kn * (-22.33816807309886 * kn - 180.12613974708367);
      const R = ri > 255 ? 255 : ri < 0 ? 0 : Math.round(ri);
      const G = gi > 255 ? 255 : gi < 0 ? 0 : Math.round(gi);
      const B = bi > 255 ? 255 : bi < 0 ? 0 : Math.round(bi);
      const word = (R | G << 8 | B << 16 | 4278190080) >>> 0;
      rgb32[di >> 2] = word;
      cacheKey[slot] = key;
      cacheVal[slot] = word;
      cacheSet[slot] = 1;
      prevC = rawC;
      prevM = rawM;
      prevY = rawY;
      prevK = rawK;
      prevWord = word;
    }
  }
  return { width: outW, height: outH, rgbData };
}
function labBytesToRGBA(data, width, height, whitePoint, range) {
  const rgbData = new Uint8Array(width * height * 4);
  const [Xw, Yw, Zw] = whitePoint;
  const r = range || [-128, 127, -128, 127];
  const aMin = r[0];
  const aSpan = r[1] - r[0];
  const bMin = r[2];
  const bSpan = r[3] - r[2];
  for (let i = 0; i < width * height; i++) {
    const si = i * 3;
    const L = data[si] * 100 / 255;
    const a = data[si + 1] / 255 * aSpan + aMin;
    const b = data[si + 2] / 255 * bSpan + bMin;
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const xr = fx > 6 / 29 ? fx * fx * fx : (fx - 16 / 116) * 3 * (6 / 29) * (6 / 29);
    const yr = fy > 6 / 29 ? fy * fy * fy : (fy - 16 / 116) * 3 * (6 / 29) * (6 / 29);
    const zr = fz > 6 / 29 ? fz * fz * fz : (fz - 16 / 116) * 3 * (6 / 29) * (6 / 29);
    const X = xr * Xw;
    const Y = yr * Yw;
    const Z = zr * Zw;
    const [rOut, gOut, bOut] = xyzToSRGB(X, Y, Z, whitePoint);
    const di = i * 4;
    rgbData[di] = rOut;
    rgbData[di + 1] = gOut;
    rgbData[di + 2] = bOut;
    rgbData[di + 3] = 255;
  }
  return rgbData;
}
function isCMYKJpeg(jpegData) {
  let i = 0;
  while (i < jpegData.length - 10) {
    if (jpegData[i] !== 255) {
      i++;
      continue;
    }
    const marker = jpegData[i + 1];
    if (marker === 0 || marker === 255) {
      i++;
      continue;
    }
    if (marker === 192 || marker === 193) {
      return jpegData[i + 9] === 4;
    }
    if (marker === 218) break;
    if (marker === 216 || marker === 217 || marker >= 208 && marker <= 215 || marker === 1) {
      i += 2;
      continue;
    }
    if (i + 3 < jpegData.length) {
      const segLen = jpegData[i + 2] << 8 | jpegData[i + 3];
      i += 2 + segLen;
    } else {
      break;
    }
  }
  return false;
}
var decodeJPEG = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  decodeCMYKJpegToRGB,
  isCMYKJpeg,
  labBytesToRGBA
});
const combHelvWidths = /* @__PURE__ */ new Map();
const combHelvDefaultWidth = applyStandardFontWidths("Helvetica", combHelvWidths) ?? 500;
function interpolateTint(tintSamples, nSamples, tint) {
  const t = tint / 255 * (nSamples - 1);
  const lo = Math.min(Math.floor(t), nSamples - 1);
  const hi = Math.min(lo + 1, nSamples - 1);
  const f = t - lo;
  const li = lo * 3;
  const hi3 = hi * 3;
  return [
    Math.round(tintSamples[li] * (1 - f) + tintSamples[hi3] * f),
    Math.round(tintSamples[li + 1] * (1 - f) + tintSamples[hi3 + 1] * f),
    Math.round(tintSamples[li + 2] * (1 - f) + tintSamples[hi3 + 2] * f)
  ];
}
function buildTintLut(tintSamples, nSamples) {
  const lut = new Uint8Array(256 * 3);
  for (let t = 0; t < 256; t++) {
    const [r, g, b] = interpolateTint(tintSamples, nSamples, t);
    lut[t * 3] = r;
    lut[t * 3 + 1] = g;
    lut[t * 3 + 2] = b;
  }
  return lut;
}
function cmykPaletteToRgb(palette) {
  const entries = Math.floor(palette.length / 4);
  const rgb = new Uint8Array(entries * 3);
  for (let e = 0; e < entries; e++) {
    const o = e * 4;
    const [r, g, b] = cmykToRgb(palette[o] / 255, palette[o + 1] / 255, palette[o + 2] / 255, palette[o + 3] / 255);
    rgb[e * 3] = r;
    rgb[e * 3 + 1] = g;
    rgb[e * 3 + 2] = b;
  }
  return rgb;
}
function pdfFontFamilyName(objCache, fontObjNum, fallbackTag) {
  if (fontObjNum != null) return `_pdf_d${objCache.docId}_f${fontObjNum}`;
  return `_pdf_d${objCache.docId}_t${fallbackTag}`;
}
function appendGenericFallbacks(registeredFontNames, fonts) {
  for (const [fontTag, name] of registeredFontNames) {
    const fontObj = fonts.get(fontTag);
    if (!fontObj) continue;
    const trailingGeneric = name.match(/,\s*(sans-serif|serif|monospace|cursive)\s*$/i);
    if (trailingGeneric) {
      registeredFontNames.set(fontTag, name.replace(
        /,\s*(sans-serif|serif|monospace|cursive)\s*$/i,
        `, ${FALLBACK_CHAIN}, $1`
      ));
    } else {
      const primary = /[",]/.test(name) ? name : `"${name}"`;
      registeredFontNames.set(fontTag, `${primary}, ${FALLBACK_CHAIN}, ${cssGenericForFontObj(fontObj)}`);
    }
  }
}
async function registerNonEmbeddedFont(fontObj, _familyName, targetMap, fontTag) {
  const hints = { bold: fontObj.bold, italic: fontObj.italic };
  const sub = base14ToBuiltInFont(fontObj.baseName, hints) || cssFamilyToBuiltInFont(standardFontToCSS(fontObj.baseName), hints) || genericToBuiltInFont(cssGenericForFontObj(fontObj), hints);
  if (sub) {
    try {
      let fontBytes;
      if (typeof process !== "undefined") {
        const { fileURLToPath } = await import("./__vite-browser-external-Dhvy_jtL.js");
        const { readFileSync } = await import("./__vite-browser-external-Dhvy_jtL.js");
        fontBytes = readFileSync(fileURLToPath(sub.url));
      } else {
        fontBytes = await fetch(sub.url).then((r) => r.arrayBuffer());
      }
      const face = loadFontFace(sub.alias, sub.faceStyle, sub.faceWeight, fontBytes);
      await face.loaded;
      targetMap.set(fontTag, sub.alias);
      return;
    } catch (_e) {
      const fallback2 = standardFontToCSS(fontObj.baseName) || cssGenericForFontObj(fontObj);
      targetMap.set(fontTag, fallback2);
      console.warn(`[renderPdfPage] Built-in font ${sub.alias} failed to load for "${fontObj.baseName}", using ${fallback2} fallback`);
      return;
    }
  }
  const cssFamily = standardFontToCSS(fontObj.baseName);
  const fallback = cssFamily || cssGenericForFontObj(fontObj);
  targetMap.set(fontTag, fallback);
  if (!cssFamily) console.warn(`[renderPdfPage] No font data for "${fontObj.baseName}", using ${fallback} fallback`);
}
async function convertAndRegisterFont(fontTag, fontObj, registeredFontNames, symbolFontTags, cidPUATags, rawCharCodeTags, cidCollisionMap, objCache, familyName) {
  const fontData = fontObj.type0 || fontObj.type1;
  if (!fontData || !fontData.fontFile) {
    await registerNonEmbeddedFont(fontObj, familyName, registeredFontNames, fontTag);
    return;
  }
  const cacheKey = fontObj.fontObjNum;
  if (cacheKey != null) {
    const cached = objCache.fontConversionCache.get(cacheKey);
    if (cached) {
      registeredFontNames.set(fontTag, cached.familyName);
      if (cached.usesPUA) cidPUATags.add(fontTag);
      if (cached.cidCollisions) cidCollisionMap.set(fontTag, cached.cidCollisions);
      if (cached.cmapType === "symbol") symbolFontTags.add(fontTag);
      else if (cached.cmapType === "rawCharCode") rawCharCodeTags.add(fontTag);
      if (cached.fontMatrix && fontObj.type1) fontObj.type1.fontMatrix = cached.fontMatrix;
      if (cached.allGlyphsEmpty) fontObj.allGlyphsEmpty = true;
      return;
    }
  }
  const ab = fontData.fontFile.buffer.slice(
    fontData.fontFile.byteOffset,
    fontData.fontFile.byteOffset + fontData.fontFile.byteLength
  );
  let fontBytes = new Uint8Array(ab);
  const isCFF = fontBytes.length >= 4 && fontBytes[0] === 1 && fontBytes[1] === 0;
  let isPFA = fontBytes.length >= 2 && fontBytes[0] === 37 && fontBytes[1] === 33;
  const isPFB = fontBytes.length >= 6 && fontBytes[0] === 128 && (fontBytes[1] === 1 || fontBytes[1] === 2);
  if (isPFB && !isCFF) {
    const segments = [];
    let pfbPos = 0;
    while (pfbPos + 6 <= fontBytes.length && fontBytes[pfbPos] === 128) {
      const segType = fontBytes[pfbPos + 1];
      if (segType === 3) break;
      const segLen = fontBytes[pfbPos + 2] | fontBytes[pfbPos + 3] << 8 | fontBytes[pfbPos + 4] << 16 | fontBytes[pfbPos + 5] << 24;
      pfbPos += 6;
      if (pfbPos + segLen > fontBytes.length) break;
      segments.push(fontBytes.subarray(pfbPos, pfbPos + segLen));
      pfbPos += segLen;
    }
    if (segments.length > 0) {
      const totalLen = segments.reduce((s, seg) => s + seg.length, 0);
      const pfaData = new Uint8Array(totalLen);
      let off = 0;
      for (const seg of segments) {
        pfaData.set(seg, off);
        off += seg.length;
      }
      fontBytes = pfaData;
      isPFA = true;
    }
  }
  let usesPUA = false;
  let cmapType = null;
  let cidCollisions = null;
  let fontMatrix = null;
  let registered = false;
  const isOTTO = fontBytes.length >= 4 && fontBytes[0] === 79 && fontBytes[1] === 84 && fontBytes[2] === 84 && fontBytes[3] === 79;
  if (isOTTO) {
    try {
      const face = loadFontFace(familyName, "normal", "normal", ab);
      await face.loaded;
      registered = true;
      if (cacheKey != null) objCache.fontBytesCache.set(cacheKey, { bytes: ab, kind: "original" });
    } catch (_e) {
      const numT = fontBytes[4] << 8 | fontBytes[5];
      for (let ti = 0; ti < numT; ti++) {
        const e = 12 + ti * 16;
        if (e + 16 > fontBytes.length) break;
        if (fontBytes[e] === 67 && fontBytes[e + 1] === 70 && fontBytes[e + 2] === 70 && fontBytes[e + 3] === 32) {
          const cffOff = fontBytes[e + 8] << 24 | fontBytes[e + 9] << 16 | fontBytes[e + 10] << 8 | fontBytes[e + 11];
          const cffLen = fontBytes[e + 12] << 24 | fontBytes[e + 13] << 16 | fontBytes[e + 14] << 8 | fontBytes[e + 15];
          if (cffOff + cffLen <= fontBytes.length) {
            const cffBytes = fontBytes.subarray(cffOff, cffOff + cffLen);
            const result = buildFontFromCFF(cffBytes, fontObj, fontObj.differences);
            if (result) {
              try {
                const face2 = loadFontFace(familyName, "normal", "normal", result.otfData);
                await face2.loaded;
                usesPUA = result.usesPUA;
                cidCollisions = result.cidCollisions;
                registered = true;
                if (cacheKey != null) objCache.fontBytesCache.set(cacheKey, { bytes: result.otfData, kind: "rebuilt" });
              } catch (_e2) {
              }
            }
          }
          break;
        }
      }
    }
  }
  if (!registered && isCFF) {
    const result = buildFontFromCFF(fontBytes, fontObj, fontObj.differences);
    if (!result) console.warn(`[renderPdfPage] buildFontFromCFF returned null for "${fontObj.baseName}"`);
    if (result) {
      try {
        const face = loadFontFace(familyName, "normal", "normal", result.otfData);
        await face.loaded;
        usesPUA = result.usesPUA;
        cidCollisions = result.cidCollisions;
        registered = true;
        if (cacheKey != null) objCache.fontBytesCache.set(cacheKey, { bytes: result.otfData, kind: "rebuilt" });
      } catch (cffErr) {
        console.warn(`[renderPdfPage] CFF OTF load failed for "${fontObj.baseName}":`, cffErr);
      }
    }
  }
  if (!registered && isPFA) {
    const type1Result = convertType1ToOTFNew(fontBytes, fontObj);
    if (type1Result) {
      try {
        const face = loadFontFace(familyName, "normal", "normal", type1Result.otfData);
        await face.loaded;
        fontMatrix = type1Result.fontMatrix || null;
        if (fontMatrix && fontObj.type1) fontObj.type1.fontMatrix = fontMatrix;
        usesPUA = type1Result.usesPUA;
        registered = true;
        if (cacheKey != null) objCache.fontBytesCache.set(cacheKey, { bytes: type1Result.otfData, kind: "rebuilt" });
      } catch (_e) {
      }
    }
  }
  if (!registered && !isPFA && !isCFF) {
    const cidToGidMap = fontData.cidToGidMap;
    let effectiveCidMap;
    if (cidToGidMap instanceof Uint8Array && cidToGidMap.length > 0) {
      effectiveCidMap = cidToGidMap;
    } else if (cidToGidMap === "identity") {
      const nT = fontBytes[4] << 8 | fontBytes[5];
      let numGlyphs = 0;
      for (let ti = 0; ti < nT; ti++) {
        const e = 12 + ti * 16;
        if (e + 16 > fontBytes.length) break;
        if (fontBytes[e] === 109 && fontBytes[e + 1] === 97 && fontBytes[e + 2] === 120 && fontBytes[e + 3] === 112) {
          const mo = fontBytes[e + 8] << 24 | fontBytes[e + 9] << 16 | fontBytes[e + 10] << 8 | fontBytes[e + 11];
          if (mo + 6 <= fontBytes.length) numGlyphs = fontBytes[mo + 4] << 8 | fontBytes[mo + 5];
          break;
        }
      }
      if (numGlyphs > 0) {
        effectiveCidMap = new Uint8Array(numGlyphs * 2);
        for (let g = 0; g < numGlyphs; g++) {
          effectiveCidMap[g * 2] = g >> 8 & 255;
          effectiveCidMap[g * 2 + 1] = g & 255;
        }
      }
    }
    const rebuilt = rebuildFontFromGlyphs(ab, fontObj, effectiveCidMap);
    if (rebuilt) {
      try {
        const face = loadFontFace(familyName, "normal", "normal", rebuilt.otfData);
        await face.loaded;
        usesPUA = rebuilt.usesPUA;
        cmapType = rebuilt.cmapType || null;
        cidCollisions = rebuilt.cidCollisions;
        registered = true;
        if (cacheKey != null) objCache.fontBytesCache.set(cacheKey, { bytes: rebuilt.otfData, kind: "rebuilt" });
      } catch (_e) {
        console.warn(`[renderPdfPage] Rebuilt TrueType font FAILED for "${fontObj.baseName}" (${rebuilt.otfData.byteLength} bytes):`, _e?.message || _e);
      }
    }
  }
  if (registered) {
    registeredFontNames.set(fontTag, familyName);
    if (usesPUA) cidPUATags.add(fontTag);
    if (cidCollisions) cidCollisionMap.set(fontTag, cidCollisions);
    if (cmapType === "symbol") symbolFontTags.add(fontTag);
    else if (cmapType === "rawCharCode") rawCharCodeTags.add(fontTag);
  } else {
    await registerNonEmbeddedFont(fontObj, familyName, registeredFontNames, fontTag);
  }
  if (cacheKey != null) {
    objCache.fontConversionCache.set(cacheKey, {
      familyName: registeredFontNames.get(fontTag),
      usesPUA,
      cmapType,
      cidCollisions,
      fontMatrix,
      allGlyphsEmpty: fontObj.allGlyphsEmpty
    });
  }
}
async function registerFontForEditing(fontObj, objCache) {
  const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, "edit");
  await convertAndRegisterFont(
    "editProbe",
    fontObj,
    /* @__PURE__ */ new Map(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Map(),
    objCache,
    familyName
  );
}
const pdfBlendToCanvas = {
  Multiply: "multiply",
  Screen: "screen",
  Overlay: "overlay",
  Darken: "darken",
  Lighten: "lighten",
  ColorDodge: "color-dodge",
  ColorBurn: "color-burn",
  HardLight: "hard-light",
  SoftLight: "soft-light",
  Difference: "difference",
  Exclusion: "exclusion",
  Hue: "hue",
  Saturation: "saturation",
  Color: "color",
  Luminosity: "luminosity"
};
function stripJpegExif(data) {
  if (data.length < 4 || data[0] !== 255 || data[1] !== 216) return data;
  const out = [255, 216];
  let pos = 2;
  while (pos < data.length - 1) {
    if (data[pos] !== 255) break;
    const marker = data[pos + 1];
    if (marker === 218) break;
    const segLen = data[pos + 2] << 8 | data[pos + 3];
    if (marker === 225) {
      pos += 2 + segLen;
      continue;
    }
    for (let i = 0; i < 2 + segLen; i++) out.push(data[pos + i]);
    pos += 2 + segLen;
  }
  for (let i = pos; i < data.length; i++) out.push(data[i]);
  return new Uint8Array(out);
}
async function decodeSmaskJpeg(rawData) {
  if (rawData.length >= 2 && rawData[0] === 255 && rawData[1] === 216) {
    let bitmap;
    try {
      bitmap = await ca.createImageBitmapFromData(rawData);
    } catch {
      return rawData;
    }
    const bw = bitmap.width;
    const bh = bitmap.height;
    const canvas = ca.makeCanvas(bw, bh);
    const ctx = (
      /** @type {OffscreenCanvasRenderingContext2D} */
      canvas.getContext("2d", { willReadFrequently: true })
    );
    ctx.drawImage(bitmap, 0, 0);
    ca.closeDrawable(bitmap);
    const imgData = ctx.getImageData(0, 0, bw, bh);
    const pixels = new Uint8Array(bw * bh);
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = imgData.data[i * 4];
    }
    ca.closeDrawable(canvas);
    return pixels;
  }
  const isJP2Box = rawData.length >= 6 && rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 0 && rawData[3] === 12 && rawData[4] === 106 && rawData[5] === 80;
  const isJ2kCodestream = rawData.length >= 2 && rawData[0] === 255 && rawData[1] === 79;
  if (isJP2Box || isJ2kCodestream) {
    const { decodeJPX } = await import("./decodeJPX-CqZ_Ue9s.js");
    const decoded = decodeJPX(rawData);
    if (decoded && decoded.pixelData) {
      return new Uint8Array(decoded.pixelData.buffer, decoded.pixelData.byteOffset, decoded.pixelData.byteLength);
    }
  }
  return rawData;
}
function applySoftMaskAlpha(px, w, h, sMask, sMaskWidth, sMaskHeight) {
  const n = w * h;
  if (sMaskWidth === w && sMaskHeight === h) {
    const n8 = n - n % 8;
    let i = 0;
    let a2 = 3;
    for (; i < n8; i += 8, a2 += 32) {
      px[a2] = sMask[i];
      px[a2 + 4] = sMask[i + 1];
      px[a2 + 8] = sMask[i + 2];
      px[a2 + 12] = sMask[i + 3];
      px[a2 + 16] = sMask[i + 4];
      px[a2 + 20] = sMask[i + 5];
      px[a2 + 24] = sMask[i + 6];
      px[a2 + 28] = sMask[i + 7];
    }
    for (; i < n; i++, a2 += 4) px[a2] = sMask[i];
    return;
  }
  const sxLUT = new Int32Array(w);
  for (let x = 0; x < w; x++) sxLUT[x] = Math.min(Math.floor(x * sMaskWidth / w), sMaskWidth - 1);
  const w4 = w - w % 4;
  let a = 3;
  for (let y = 0; y < h; y++) {
    const row = Math.min(Math.floor(y * sMaskHeight / h), sMaskHeight - 1) * sMaskWidth;
    let x = 0;
    for (; x < w4; x += 4, a += 16) {
      px[a] = sMask[row + sxLUT[x]];
      px[a + 4] = sMask[row + sxLUT[x + 1]];
      px[a + 8] = sMask[row + sxLUT[x + 2]];
      px[a + 12] = sMask[row + sxLUT[x + 3]];
    }
    for (; x < w; x++, a += 4) px[a] = sMask[row + sxLUT[x]];
  }
}
function boxDownsampleMask(sMask, sMaskWidth, sMaskHeight, outW, outH) {
  if (outW === sMaskWidth && outH === sMaskHeight) return sMask;
  const out = new Uint8Array(outW * outH);
  const colStart = new Int32Array(outW);
  const colW = new Int32Array(outW);
  for (let ox = 0; ox < outW; ox++) {
    const sx0 = Math.floor(ox * sMaskWidth / outW);
    const sx1 = Math.max(sx0 + 1, Math.floor((ox + 1) * sMaskWidth / outW));
    colStart[ox] = sx0;
    colW[ox] = sx1 - sx0;
  }
  let di = 0;
  for (let oy = 0; oy < outH; oy++) {
    const sy0 = Math.floor(oy * sMaskHeight / outH);
    const sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * sMaskHeight / outH));
    const rowH = sy1 - sy0;
    for (let ox = 0; ox < outW; ox++) {
      const sx0 = colStart[ox];
      const w = colW[ox];
      let sum = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        const row = sy * sMaskWidth + sx0;
        for (let k = 0; k < w; k++) sum += sMask[row + k];
      }
      out[di++] = sum / (rowH * w) + 0.5 | 0;
    }
  }
  return out;
}
function upsampleImageWithMask(src, w, h, maskA, outW, outH) {
  const out = new Uint8ClampedArray(outW * outH * 4);
  const out32 = new Uint32Array(out.buffer);
  if (w === 1 && h === 1) {
    const rgb = src[0] | src[1] << 8 | src[2] << 16;
    for (let i = 0, n = outW * outH; i < n; i++) out32[i] = rgb | maskA[i] << 24;
    return out;
  }
  const colSrc = new Int32Array(outW);
  for (let x = 0; x < outW; x++) colSrc[x] = Math.min(Math.floor(x * w / outW), w - 1);
  let di = 0;
  for (let y = 0; y < outH; y++) {
    const srcRow = Math.min(Math.floor(y * h / outH), h - 1) * w;
    const mRow = y * outW;
    for (let x = 0; x < outW; x++) {
      const s = (srcRow + colSrc[x]) * 4;
      out32[di] = src[s] | src[s + 1] << 8 | src[s + 2] << 16 | maskA[mRow + x] << 24;
      di++;
    }
  }
  return out;
}
function boxDownsampleRgba(rgba, width, height, outW, outH) {
  const out = new Uint8ClampedArray(outW * outH * 4);
  const colStart = new Int32Array(outW);
  const colW = new Int32Array(outW);
  for (let ox = 0; ox < outW; ox++) {
    const sx0 = Math.floor(ox * width / outW);
    colStart[ox] = sx0;
    colW[ox] = Math.max(sx0 + 1, Math.floor((ox + 1) * width / outW)) - sx0;
  }
  let di = 0;
  for (let oy = 0; oy < outH; oy++) {
    const sy0 = Math.floor(oy * height / outH);
    const sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * height / outH));
    const rowH = sy1 - sy0;
    for (let ox = 0; ox < outW; ox++) {
      const sx0 = colStart[ox];
      const wpx = colW[ox];
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        let si = (sy * width + sx0) * 4;
        for (let k = 0; k < wpx; k++) {
          r += rgba[si];
          g += rgba[si + 1];
          b += rgba[si + 2];
          a += rgba[si + 3];
          si += 4;
        }
      }
      const cnt = rowH * wpx;
      out[di] = r / cnt + 0.5 | 0;
      out[di + 1] = g / cnt + 0.5 | 0;
      out[di + 2] = b / cnt + 0.5 | 0;
      out[di + 3] = a / cnt + 0.5 | 0;
      di += 4;
    }
  }
  return out;
}
const DECODED_IMAGE_CACHE_BUDGET = 64 * 1024 * 1024;
const DECODED_IMAGE_MIN_DECODE_MS = 15;
function decodedImageKey(objNum, isMask, fillColor) {
  return isMask ? `${objNum}|${fillColor}` : `${objNum}`;
}
function putDecodedImage(objCache, key, bitmap, maxW, maxH, bytes, decodeMs) {
  const cache = objCache.decodedImageCache;
  const prev = cache.get(key);
  if (prev) {
    ca.closeDrawable(prev.bitmap);
    objCache.decodedImageCacheBytes -= prev.bytes;
  }
  cache.set(key, {
    bitmap,
    maxW,
    maxH,
    bytes,
    decodeMs
  });
  objCache.decodedImageCacheBytes += bytes;
  while (objCache.decodedImageCacheBytes > DECODED_IMAGE_CACHE_BUDGET && cache.size > 1) {
    let evictKey = null;
    let worstDensity = Infinity;
    for (const [k, e] of cache) {
      if (k === key) continue;
      const density = e.decodeMs / e.bytes;
      if (density < worstDensity) {
        worstDensity = density;
        evictKey = k;
      }
    }
    if (evictKey == null) break;
    const evicted = cache.get(evictKey);
    if (!evicted) break;
    ca.closeDrawable(evicted.bitmap);
    objCache.decodedImageCacheBytes -= evicted.bytes;
    cache.delete(evictKey);
  }
}
async function imageInfoToBitmap(imageInfo, objCache, maxW = 0, maxH = 0, roi = null, decodeScale = 1) {
  if (imageInfo.imageData == null && objCache && imageInfo.objNum != null) {
    imageInfo.imageData = objCache.getStreamBytes(imageInfo.objNum);
  }
  let {
    width,
    height,
    bitsPerComponent,
    colorSpace,
    filter,
    imageData,
    sMask,
    sMaskWidth,
    sMaskHeight,
    decodeInvert,
    colorKeyMask
  } = imageInfo;
  if (imageData == null) return null;
  if (sMask && sMaskWidth && sMaskHeight) {
    sMask = await decodeSmaskJpeg(sMask);
    if (imageInfo.sMaskDecodeInvert) {
      for (let i = 0; i < sMask.length; i++) sMask[i] = 255 - sMask[i];
    }
  }
  if (filter === "DCTDecode") {
    if (colorSpace === "DeviceCMYK") {
      const jpegBytes = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
      const cmykRoi = sMask && sMaskWidth && sMaskHeight ? null : roi;
      const cmykResult = decodeCMYKJpegToRGB(jpegBytes, decodeInvert, cmykRoi, decodeScale);
      if (cmykResult) {
        const { width: w, height: h, rgbData } = cmykResult;
        const canvas2 = ca.makeCanvas(w, h);
        const ctx2 = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          canvas2.getContext("2d", { willReadFrequently: true })
        );
        const imgData2 = new ImageData(new Uint8ClampedArray(rgbData.buffer, rgbData.byteOffset, rgbData.byteLength), w, h);
        if (sMask && sMaskWidth && sMaskHeight) {
          applySoftMaskAlpha(imgData2.data, w, h, sMask, sMaskWidth, sMaskHeight);
        }
        ctx2.putImageData(imgData2, 0, 0);
        return ca.createImageBitmapFromCanvas(canvas2);
      }
    }
    if (colorSpace === "Lab") {
      let jpegBytes = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
      if (jpegBytes.length >= 2 && !(jpegBytes[jpegBytes.length - 2] === 255 && jpegBytes[jpegBytes.length - 1] === 217)) {
        const f = new Uint8Array(jpegBytes.length + 2);
        f.set(jpegBytes);
        f[jpegBytes.length] = 255;
        f[jpegBytes.length + 1] = 217;
        jpegBytes = f;
      }
      try {
        const labBitmap = await ca.createImageBitmapFromData(stripJpegExif(jpegBytes));
        const w = labBitmap.width;
        const h = labBitmap.height;
        const tmp = ca.makeCanvas(w, h);
        const tctx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          tmp.getContext("2d", { willReadFrequently: true })
        );
        tctx.drawImage(labBitmap, 0, 0);
        const labPixels = tctx.getImageData(0, 0, w, h).data;
        const labBytes = new Uint8Array(w * h * 3);
        for (let j = 0; j < w * h; j++) {
          labBytes[j * 3] = labPixels[j * 4];
          labBytes[j * 3 + 1] = labPixels[j * 4 + 1];
          labBytes[j * 3 + 2] = labPixels[j * 4 + 2];
        }
        const { labBytesToRGBA: labBytesToRGBA2 } = await Promise.resolve().then(function() {
          return decodeJPEG;
        });
        const wp = imageInfo.labWhitePoint || [0.9642, 1, 0.8249];
        const range = imageInfo.labRange || [-100, 100, -100, 100];
        const rgba = labBytesToRGBA2(labBytes, w, h, wp, range);
        const out = ca.makeCanvas(w, h);
        const octx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          out.getContext("2d", { willReadFrequently: true })
        );
        octx.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), w, h), 0, 0);
        return ca.createImageBitmapFromCanvas(out);
      } catch {
      }
    }
    let jpegData = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
    if (jpegData.length >= 2 && !(jpegData[jpegData.length - 2] === 255 && jpegData[jpegData.length - 1] === 217)) {
      const fixed = new Uint8Array(jpegData.length + 2);
      fixed.set(jpegData);
      fixed[jpegData.length] = 255;
      fixed[jpegData.length + 1] = 217;
      jpegData = fixed;
    }
    jpegData = stripJpegExif(jpegData);
    let jpegBitmap;
    try {
      jpegBitmap = await ca.createImageBitmapFromData(jpegData);
    } catch {
      const w = width || 1;
      const h = height || 1;
      const blackPixels = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        blackPixels[i * 4 + 3] = 255;
      }
      return ca.createImageBitmapFromImageData(new ImageData(blackPixels, w, h));
    }
    if (colorSpace === "Separation") {
      const w = jpegBitmap.width;
      const h = jpegBitmap.height;
      const canvas2 = ca.makeCanvas(w, h);
      const ctx2 = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        canvas2.getContext("2d", { willReadFrequently: true })
      );
      ctx2.drawImage(jpegBitmap, 0, 0);
      ca.closeDrawable(jpegBitmap);
      const tintSamples = imageInfo.separationTintSamples;
      if (tintSamples && tintSamples.length >= 3) {
        const nSamples = Math.floor(tintSamples.length / 3);
        const lut = buildTintLut(tintSamples, nSamples);
        const imgData2 = ctx2.getImageData(0, 0, w, h);
        const px = imgData2.data;
        for (let i = 0; i < px.length; i += 4) {
          const o = (decodeInvert ? 255 - px[i] : px[i]) * 3;
          px[i] = lut[o];
          px[i + 1] = lut[o + 1];
          px[i + 2] = lut[o + 2];
        }
        ctx2.putImageData(imgData2, 0, 0);
      } else if (!decodeInvert) {
        ctx2.globalCompositeOperation = "difference";
        ctx2.fillStyle = "white";
        ctx2.fillRect(0, 0, w, h);
      }
      if (sMask && sMaskWidth && sMaskHeight) {
        const imgData2 = ctx2.getImageData(0, 0, w, h);
        applySoftMaskAlpha(imgData2.data, w, h, sMask, sMaskWidth, sMaskHeight);
        ctx2.putImageData(imgData2, 0, 0);
      }
      return ca.createImageBitmapFromCanvas(canvas2);
    }
    if (colorSpace === "Indexed" && imageInfo.palette) {
      const w = jpegBitmap.width;
      const h = jpegBitmap.height;
      const canvas2 = ca.makeCanvas(w, h);
      const ctx2 = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        canvas2.getContext("2d", { willReadFrequently: true })
      );
      ctx2.drawImage(jpegBitmap, 0, 0);
      ca.closeDrawable(jpegBitmap);
      const palette = imageInfo.palette;
      const base = imageInfo.paletteBase || "DeviceRGB";
      const nComp = base === "DeviceCMYK" ? 4 : base === "DeviceGray" || base === "CalGray" ? 1 : 3;
      const rgbPal = nComp === 4 ? cmykPaletteToRgb(palette) : new Uint8Array(0);
      const imgData2 = ctx2.getImageData(0, 0, w, h);
      const px = imgData2.data;
      for (let i = 0; i < px.length; i += 4) {
        const idx = px[i];
        if (nComp === 4) {
          const o = idx * 3;
          px[i] = rgbPal[o];
          px[i + 1] = rgbPal[o + 1];
          px[i + 2] = rgbPal[o + 2];
        } else if (nComp === 1) {
          px[i] = palette[idx];
          px[i + 1] = palette[idx];
          px[i + 2] = palette[idx];
        } else {
          const po = idx * nComp;
          px[i] = palette[po];
          px[i + 1] = palette[po + 1];
          px[i + 2] = palette[po + 2];
        }
      }
      ctx2.putImageData(imgData2, 0, 0);
      if (sMask && sMaskWidth && sMaskHeight) {
        const imgData22 = ctx2.getImageData(0, 0, w, h);
        applySoftMaskAlpha(imgData22.data, w, h, sMask, sMaskWidth, sMaskHeight);
        ctx2.putImageData(imgData22, 0, 0);
      }
      return ca.createImageBitmapFromCanvas(canvas2);
    }
    if (decodeInvert) {
      const w = jpegBitmap.width;
      const h = jpegBitmap.height;
      const canvas2 = ca.makeCanvas(w, h);
      const ctx2 = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        canvas2.getContext("2d", { willReadFrequently: true })
      );
      ctx2.drawImage(jpegBitmap, 0, 0);
      ca.closeDrawable(jpegBitmap);
      ctx2.globalCompositeOperation = "difference";
      ctx2.fillStyle = "white";
      ctx2.fillRect(0, 0, w, h);
      const invertedBitmap = await ca.createImageBitmapFromCanvas(canvas2);
      if (sMask && sMaskWidth && sMaskHeight) {
        const canvas22 = ca.makeCanvas(w, h);
        const ctx22 = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          canvas22.getContext("2d", { willReadFrequently: true })
        );
        ctx22.drawImage(invertedBitmap, 0, 0);
        ca.closeDrawable(invertedBitmap);
        const imgData2 = ctx22.getImageData(0, 0, w, h);
        applySoftMaskAlpha(imgData2.data, w, h, sMask, sMaskWidth, sMaskHeight);
        ctx22.putImageData(imgData2, 0, 0);
        return ca.createImageBitmapFromCanvas(canvas22);
      }
      return invertedBitmap;
    }
    if (sMask && sMaskWidth && sMaskHeight) {
      const w = jpegBitmap.width;
      const h = jpegBitmap.height;
      if (sMaskWidth > w || sMaskHeight > h) {
        let outW = sMaskWidth;
        let outH = sMaskHeight;
        if (maxW && maxH && (outW > maxW || outH > maxH)) {
          const k = Math.min(maxW / outW, maxH / outH);
          outW = Math.max(w, Math.round(sMaskWidth * k));
          outH = Math.max(h, Math.round(sMaskHeight * k));
        }
        const canvas3 = ca.makeCanvas(w, h);
        const ctx3 = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          canvas3.getContext("2d", { willReadFrequently: true })
        );
        ctx3.drawImage(jpegBitmap, 0, 0);
        ca.closeDrawable(jpegBitmap);
        const imgData3 = ctx3.getImageData(0, 0, w, h);
        const px = imgData3.data;
        const maskA = boxDownsampleMask(sMask, sMaskWidth, sMaskHeight, outW, outH);
        const upsampled = upsampleImageWithMask(px, w, h, maskA, outW, outH);
        return ca.createImageBitmapFromImageData(new ImageData(upsampled, outW, outH));
      }
      const canvas2 = ca.makeCanvas(w, h);
      const ctx2 = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        canvas2.getContext("2d", { willReadFrequently: true })
      );
      ctx2.drawImage(jpegBitmap, 0, 0);
      ca.closeDrawable(jpegBitmap);
      const imgData2 = ctx2.getImageData(0, 0, w, h);
      applySoftMaskAlpha(imgData2.data, w, h, sMask, sMaskWidth, sMaskHeight);
      ctx2.putImageData(imgData2, 0, 0);
      return ca.createImageBitmapFromCanvas(canvas2);
    }
    if (jpegBitmap.width === width && jpegBitmap.height === height) {
      return jpegBitmap;
    }
    const canvas = ca.makeCanvas(width, height);
    const ctx = (
      /** @type {OffscreenCanvasRenderingContext2D} */
      canvas.getContext("2d", { willReadFrequently: true })
    );
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(jpegBitmap, 0, 0);
    ca.closeDrawable(jpegBitmap);
    return ca.createImageBitmapFromCanvas(canvas);
  }
  if (filter === "JPXDecode") {
    const { decodeJPX } = await import("./decodeJPX-CqZ_Ue9s.js");
    let reduceLevels = 0;
    if (maxW && maxH) {
      let rw = imageInfo.width;
      let rh = imageInfo.height;
      while (reduceLevels < 5 && rw / 2 >= maxW * 1.41 && rh / 2 >= maxH * 1.41) {
        rw = Math.floor(rw / 2);
        rh = Math.floor(rh / 2);
        reduceLevels++;
      }
    }
    const decoded = decodeJPX(imageData, reduceLevels, !imageInfo.palette);
    if (!decoded) return null;
    const w = decoded.width;
    const h = decoded.height;
    const components = decoded.components;
    const pixels = decoded.pixelData;
    const expectedComponents = colorSpace === "DeviceGray" || colorSpace === "CalGray" ? 1 : colorSpace === "DeviceRGB" || colorSpace === "CalRGB" ? 3 : colorSpace === "DeviceCMYK" ? 4 : 0;
    const hasJpxAlpha = expectedComponents > 0 && components === expectedComponents + 1;
    const rgbaData2 = new Uint8ClampedArray(w * h * 4);
    if (colorSpace === "DeviceN" && imageInfo.deviceNTintCS && components === imageInfo.deviceNTintCS.nInputs) {
      const rgb = tintSamplesToRgb(imageInfo.deviceNTintCS, pixels, components, w * h);
      if (rgb) {
        for (let i = 0; i < w * h; i++) {
          rgbaData2[i * 4] = rgb[i * 3];
          rgbaData2[i * 4 + 1] = rgb[i * 3 + 1];
          rgbaData2[i * 4 + 2] = rgb[i * 3 + 2];
          rgbaData2[i * 4 + 3] = 255;
        }
      }
    } else if (components === 1 && colorSpace === "Indexed" && imageInfo.palette) {
      const palette = imageInfo.palette;
      const base = imageInfo.paletteBase || "DeviceRGB";
      const nComp = base === "DeviceCMYK" ? 4 : base === "DeviceGray" || base === "CalGray" ? 1 : 3;
      const jpxPrecision = decoded.precision ? decoded.precision[0] : 8;
      const idxShift = jpxPrecision < 8 ? 8 - jpxPrecision : 0;
      const rgbPal = nComp === 4 ? cmykPaletteToRgb(palette) : new Uint8Array(0);
      for (let i = 0; i < w * h; i++) {
        const idx = pixels[i] >> idxShift;
        const pi = i * 4;
        if (nComp === 4) {
          const o = idx * 3;
          rgbaData2[pi] = rgbPal[o];
          rgbaData2[pi + 1] = rgbPal[o + 1];
          rgbaData2[pi + 2] = rgbPal[o + 2];
        } else if (nComp === 1) {
          const gray = palette[idx];
          rgbaData2[pi] = gray;
          rgbaData2[pi + 1] = gray;
          rgbaData2[pi + 2] = gray;
        } else {
          const po = idx * nComp;
          rgbaData2[pi] = palette[po];
          rgbaData2[pi + 1] = palette[po + 1];
          rgbaData2[pi + 2] = palette[po + 2];
        }
        rgbaData2[pi + 3] = 255;
      }
    } else if (components === 1 && colorSpace === "Separation") {
      const tintSamples = imageInfo.separationTintSamples;
      if (tintSamples && tintSamples.length >= 3) {
        const nSamples = Math.floor(tintSamples.length / 3);
        const lut = buildTintLut(tintSamples, nSamples);
        for (let i = 0; i < w * h; i++) {
          const o = (decodeInvert ? 255 - pixels[i] : pixels[i]) * 3;
          rgbaData2[i * 4] = lut[o];
          rgbaData2[i * 4 + 1] = lut[o + 1];
          rgbaData2[i * 4 + 2] = lut[o + 2];
          rgbaData2[i * 4 + 3] = 255;
        }
      } else {
        for (let i = 0; i < w * h; i++) {
          const val = decodeInvert ? pixels[i] : 255 - pixels[i];
          rgbaData2[i * 4] = rgbaData2[i * 4 + 1] = rgbaData2[i * 4 + 2] = val;
          rgbaData2[i * 4 + 3] = 255;
        }
      }
    } else if (components === 1 || hasJpxAlpha && expectedComponents === 1) {
      for (let i = 0; i < w * h; i++) {
        rgbaData2[i * 4] = rgbaData2[i * 4 + 1] = rgbaData2[i * 4 + 2] = pixels[i * components];
        rgbaData2[i * 4 + 3] = hasJpxAlpha ? pixels[i * components + 1] : 255;
      }
    } else if (colorSpace === "Lab" && components === 3) {
      const { labBytesToRGBA: labBytesToRGBA2 } = await Promise.resolve().then(function() {
        return decodeJPEG;
      });
      const wp = imageInfo.labWhitePoint || [0.9505, 1, 1.089];
      const range = imageInfo.labRange || [-100, 100, -100, 100];
      rgbaData2.set(labBytesToRGBA2(pixels, w, h, wp, range));
    } else if (components === 3 || hasJpxAlpha && expectedComponents === 3) {
      for (let i = 0; i < w * h; i++) {
        rgbaData2[i * 4] = pixels[i * components];
        rgbaData2[i * 4 + 1] = pixels[i * components + 1];
        rgbaData2[i * 4 + 2] = pixels[i * components + 2];
        rgbaData2[i * 4 + 3] = hasJpxAlpha ? pixels[i * components + 3] : 255;
      }
    } else if (components === 4) {
      if (colorSpace === "DeviceCMYK") {
        let pc = -1;
        let pm = -1;
        let py = -1;
        let pk = -1;
        let pr = 0;
        let pg = 0;
        let pb = 0;
        for (let i = 0; i < w * h; i++) {
          const b0 = pixels[i * 4];
          const b1 = pixels[i * 4 + 1];
          const b2 = pixels[i * 4 + 2];
          const b3 = pixels[i * 4 + 3];
          if (b0 !== pc || b1 !== pm || b2 !== py || b3 !== pk) {
            const c = decodeInvert ? 1 - b0 / 255 : b0 / 255;
            const m = decodeInvert ? 1 - b1 / 255 : b1 / 255;
            const y = decodeInvert ? 1 - b2 / 255 : b2 / 255;
            const k = decodeInvert ? 1 - b3 / 255 : b3 / 255;
            const rgb = cmykToRgb(c, m, y, k);
            pr = rgb[0];
            pg = rgb[1];
            pb = rgb[2];
            pc = b0;
            pm = b1;
            py = b2;
            pk = b3;
          }
          rgbaData2[i * 4] = pr;
          rgbaData2[i * 4 + 1] = pg;
          rgbaData2[i * 4 + 2] = pb;
          rgbaData2[i * 4 + 3] = 255;
        }
      } else {
        for (let i = 0; i < w * h; i++) {
          rgbaData2[i * 4] = pixels[i * 4];
          rgbaData2[i * 4 + 1] = pixels[i * 4 + 1];
          rgbaData2[i * 4 + 2] = pixels[i * 4 + 2];
          rgbaData2[i * 4 + 3] = pixels[i * 4 + 3];
        }
      }
    }
    if (sMask && sMaskWidth && sMaskHeight) {
      if (sMaskWidth > w || sMaskHeight > h) {
        let outW = sMaskWidth;
        let outH = sMaskHeight;
        if (maxW && maxH && (outW > maxW || outH > maxH)) {
          const k = Math.min(maxW / outW, maxH / outH);
          outW = Math.max(w, Math.round(sMaskWidth * k));
          outH = Math.max(h, Math.round(sMaskHeight * k));
        }
        const maskA = boxDownsampleMask(sMask, sMaskWidth, sMaskHeight, outW, outH);
        const upsampled = upsampleImageWithMask(rgbaData2, w, h, maskA, outW, outH);
        return ca.createImageBitmapFromImageData(new ImageData(upsampled, outW, outH));
      }
      applySoftMaskAlpha(rgbaData2, w, h, sMask, sMaskWidth, sMaskHeight);
    }
    return ca.createImageBitmapFromImageData(new ImageData(rgbaData2, w, h));
  }
  let rgbaData;
  if (bitsPerComponent === 16) {
    const sampleCount = imageData.length / 2;
    const data8 = new Uint8Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      data8[i] = imageData[i * 2];
    }
    imageData = data8;
    bitsPerComponent = 8;
  }
  const mask11 = sMask && sMaskWidth === width && sMaskHeight === height;
  if (bitsPerComponent === 1 && (colorSpace === "DeviceGray" || colorSpace === "CalGray") && !imageInfo.transparentWhite && (!(sMask && sMaskWidth && sMaskHeight) || mask11) && !colorKeyMask && !imageInfo.iccTransform && maxW && maxH && (width > maxW || height > maxH) && width * height >= 4e7) {
    const k = Math.min(maxW / width, maxH / height);
    const outW = Math.max(1, Math.round(width * k));
    const outH = Math.max(1, Math.round(height * k));
    if (width * height >= outW * outH * 2) {
      const rowBytes = Math.ceil(width / 8);
      const ma = mask11 ? sMask : null;
      const out = new Uint8ClampedArray(outW * outH * 4);
      for (let oy = 0; oy < outH; oy++) {
        const sy0 = Math.floor(oy * height / outH);
        const sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * height / outH));
        for (let ox = 0; ox < outW; ox++) {
          const sx0 = Math.floor(ox * width / outW);
          const sx1 = Math.max(sx0 + 1, Math.floor((ox + 1) * width / outW));
          let sum = 0;
          let asum = 0;
          let cnt = 0;
          for (let sy = sy0; sy < sy1; sy++) {
            const rb = sy * rowBytes;
            const mrow = sy * width;
            for (let sx = sx0; sx < sx1; sx++) {
              sum += imageData[rb + (sx >> 3)] >> 7 - (sx & 7) & 1;
              if (ma) asum += ma[mrow + sx];
              cnt++;
            }
          }
          let v = sum / cnt * 255 + 0.5 | 0;
          if (decodeInvert) v = 255 - v;
          const di = (oy * outW + ox) * 4;
          out[di] = v;
          out[di + 1] = v;
          out[di + 2] = v;
          out[di + 3] = ma ? asum / cnt + 0.5 | 0 : 255;
        }
      }
      return ca.createImageBitmapFromImageData(new ImageData(out, outW, outH));
    }
  }
  if (bitsPerComponent === 8 && (colorSpace === "DeviceRGB" || colorSpace === "CalRGB" || colorSpace === "DeviceGray" || colorSpace === "CalGray") && !imageInfo.transparentWhite && !(sMask && sMaskWidth && sMaskHeight) && !colorKeyMask && !imageInfo.iccTransform && !decodeInvert && maxW && maxH && (width > maxW || height > maxH) && width * height >= 4e7) {
    const nc = colorSpace === "DeviceRGB" || colorSpace === "CalRGB" ? 3 : 1;
    const k = Math.min(maxW / width, maxH / height);
    const outW = Math.max(1, Math.round(width * k));
    const outH = Math.max(1, Math.round(height * k));
    if (width * height >= outW * outH * 2 && imageData.length >= width * height * nc) {
      const out = new Uint8ClampedArray(outW * outH * 4);
      const colStart = new Int32Array(outW);
      const colW = new Int32Array(outW);
      for (let ox = 0; ox < outW; ox++) {
        const sx0 = Math.floor(ox * width / outW);
        colStart[ox] = sx0;
        colW[ox] = Math.max(sx0 + 1, Math.floor((ox + 1) * width / outW)) - sx0;
      }
      let di = 0;
      for (let oy = 0; oy < outH; oy++) {
        const sy0 = Math.floor(oy * height / outH);
        const sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * height / outH));
        for (let ox = 0; ox < outW; ox++) {
          const sx0 = colStart[ox];
          const wpx = colW[ox];
          if (nc === 3) {
            let r = 0;
            let g = 0;
            let b = 0;
            for (let sy = sy0; sy < sy1; sy++) {
              let si = (sy * width + sx0) * 3;
              for (let px = 0; px < wpx; px++) {
                r += imageData[si];
                g += imageData[si + 1];
                b += imageData[si + 2];
                si += 3;
              }
            }
            const cnt = (sy1 - sy0) * wpx;
            out[di] = r / cnt + 0.5 | 0;
            out[di + 1] = g / cnt + 0.5 | 0;
            out[di + 2] = b / cnt + 0.5 | 0;
          } else {
            let sum = 0;
            for (let sy = sy0; sy < sy1; sy++) {
              let si = sy * width + sx0;
              for (let px = 0; px < wpx; px++) {
                sum += imageData[si];
                si++;
              }
            }
            const v = sum / ((sy1 - sy0) * wpx) + 0.5 | 0;
            out[di] = v;
            out[di + 1] = v;
            out[di + 2] = v;
          }
          out[di + 3] = 255;
          di += 4;
        }
      }
      return ca.createImageBitmapFromImageData(new ImageData(out, outW, outH));
    }
  }
  if (colorSpace === "Indexed" && imageInfo.palette) {
    const palette = imageInfo.palette;
    const base = imageInfo.paletteBase || "DeviceRGB";
    const nComp = base === "DeviceCMYK" ? 4 : base === "DeviceGray" || base === "CalGray" ? 1 : 3;
    const hival = imageInfo.paletteHival != null ? imageInfo.paletteHival : (1 << bitsPerComponent) - 1;
    rgbaData = new Uint8ClampedArray(width * height * 4);
    const rowBytes = Math.ceil(width * bitsPerComponent / 8);
    const maxBytes = imageData ? imageData.length : 0;
    const validRows = rowBytes > 0 ? Math.min(height, Math.floor(maxBytes / rowBytes)) : height;
    const rgbPal = nComp === 4 ? cmykPaletteToRgb(palette) : new Uint8Array(0);
    for (let y = 0; y < validRows; y++) {
      for (let x = 0; x < width; x++) {
        let idx;
        if (bitsPerComponent === 8) {
          idx = imageData[y * rowBytes + x];
        } else if (bitsPerComponent === 4) {
          const bytePos = y * rowBytes + Math.floor(x / 2);
          idx = x % 2 === 0 ? imageData[bytePos] >> 4 & 15 : imageData[bytePos] & 15;
        } else if (bitsPerComponent === 2) {
          const bytePos = y * rowBytes + Math.floor(x / 4);
          idx = imageData[bytePos] >> 6 - x % 4 * 2 & 3;
        } else {
          const bytePos = y * rowBytes + Math.floor(x / 8);
          idx = imageData[bytePos] >> 7 - x % 8 & 1;
        }
        if (decodeInvert) idx = hival - idx;
        const pi = (y * width + x) * 4;
        if (nComp === 4) {
          const o = idx * 3;
          rgbaData[pi] = rgbPal[o];
          rgbaData[pi + 1] = rgbPal[o + 1];
          rgbaData[pi + 2] = rgbPal[o + 2];
        } else if (nComp === 1) {
          const gray = palette[idx];
          rgbaData[pi] = gray;
          rgbaData[pi + 1] = gray;
          rgbaData[pi + 2] = gray;
        } else {
          const po = idx * nComp;
          rgbaData[pi] = palette[po];
          rgbaData[pi + 1] = palette[po + 1];
          rgbaData[pi + 2] = palette[po + 2];
        }
        rgbaData[pi + 3] = 255;
      }
    }
  } else if (bitsPerComponent === 1) {
    const isSeparation = colorSpace === "Separation";
    const tintSamples = isSeparation ? imageInfo.separationTintSamples : null;
    rgbaData = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      const rowByteWidth = Math.ceil(width / 8);
      for (let x = 0; x < width; x++) {
        const byteIndex = y * rowByteWidth + Math.floor(x / 8);
        const bitIndex = 7 - x % 8;
        const rawBit = imageData[byteIndex] >> bitIndex & 1;
        const bit = decodeInvert ? 1 - rawBit : rawBit;
        const pi = (y * width + x) * 4;
        if (isSeparation && tintSamples && tintSamples.length >= 3) {
          const nSamples = Math.floor(tintSamples.length / 3);
          const si = (bit === 0 ? 0 : nSamples - 1) * 3;
          rgbaData[pi] = tintSamples[si];
          rgbaData[pi + 1] = tintSamples[si + 1];
          rgbaData[pi + 2] = tintSamples[si + 2];
          rgbaData[pi + 3] = 255;
        } else if (isSeparation) {
          const val = (1 - bit) * 255;
          rgbaData[pi] = val;
          rgbaData[pi + 1] = val;
          rgbaData[pi + 2] = val;
          rgbaData[pi + 3] = 255;
        } else {
          const val = bit * 255;
          rgbaData[pi] = val;
          rgbaData[pi + 1] = val;
          rgbaData[pi + 2] = val;
          rgbaData[pi + 3] = imageInfo.transparentWhite && val === 255 ? 0 : 255;
        }
      }
    }
  } else if (colorSpace === "DeviceGray" || colorSpace === "CalGray") {
    rgbaData = new Uint8ClampedArray(width * height * 4);
    if (bitsPerComponent === 4) {
      const rowBytes = Math.ceil(width / 2);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const bytePos = y * rowBytes + (x >> 1);
          const nibble = (x & 1) === 0 ? imageData[bytePos] >> 4 & 15 : imageData[bytePos] & 15;
          const raw = nibble * 17;
          const val = decodeInvert ? 255 - raw : raw;
          const pi = (y * width + x) * 4;
          rgbaData[pi] = val;
          rgbaData[pi + 1] = val;
          rgbaData[pi + 2] = val;
          rgbaData[pi + 3] = 255;
        }
      }
    } else if (bitsPerComponent === 2) {
      const rowBytes = Math.ceil(width / 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const bytePos = y * rowBytes + (x >> 2);
          const sample = imageData[bytePos] >> 6 - (x & 3) * 2 & 3;
          const raw = sample * 85;
          const val = decodeInvert ? 255 - raw : raw;
          const pi = (y * width + x) * 4;
          rgbaData[pi] = val;
          rgbaData[pi + 1] = val;
          rgbaData[pi + 2] = val;
          rgbaData[pi + 3] = 255;
        }
      }
    } else {
      for (let i = 0; i < width * height; i++) {
        const val = decodeInvert ? 255 - imageData[i] : imageData[i];
        rgbaData[i * 4] = val;
        rgbaData[i * 4 + 1] = val;
        rgbaData[i * 4 + 2] = val;
        rgbaData[i * 4 + 3] = 255;
      }
    }
  } else if (colorSpace === "DeviceCMYK") {
    rgbaData = new Uint8ClampedArray(width * height * 4);
    if (bitsPerComponent === 8) {
      let pc = -1;
      let pm = -1;
      let py = -1;
      let pk = -1;
      let pr = 0;
      let pg = 0;
      let pb = 0;
      for (let i = 0; i < width * height; i++) {
        const b0 = imageData[i * 4];
        const b1 = imageData[i * 4 + 1];
        const b2 = imageData[i * 4 + 2];
        const b3 = imageData[i * 4 + 3];
        if (b0 !== pc || b1 !== pm || b2 !== py || b3 !== pk) {
          const c = decodeInvert ? 1 - b0 / 255 : b0 / 255;
          const m = decodeInvert ? 1 - b1 / 255 : b1 / 255;
          const y = decodeInvert ? 1 - b2 / 255 : b2 / 255;
          const k = decodeInvert ? 1 - b3 / 255 : b3 / 255;
          const rgb = cmykToRgb(c, m, y, k);
          pr = rgb[0];
          pg = rgb[1];
          pb = rgb[2];
          pc = b0;
          pm = b1;
          py = b2;
          pk = b3;
        }
        rgbaData[i * 4] = pr;
        rgbaData[i * 4 + 1] = pg;
        rgbaData[i * 4 + 2] = pb;
        rgbaData[i * 4 + 3] = 255;
      }
    } else {
      const rowBytes = Math.ceil(width * 4 * bitsPerComponent / 8);
      const compMax = (1 << bitsPerComponent) - 1;
      let pc = -1;
      let pm = -1;
      let py = -1;
      let pk = -1;
      let pr = 0;
      let pg = 0;
      let pb = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const comps = [0, 0, 0, 0];
          for (let cc = 0; cc < 4; cc++) {
            const bitOff = (x * 4 + cc) * bitsPerComponent;
            const byteIdx = y * rowBytes + (bitOff >> 3);
            const shift = 8 - (bitOff & 7) - bitsPerComponent;
            comps[cc] = imageData[byteIdx] >> shift & compMax;
          }
          if (comps[0] !== pc || comps[1] !== pm || comps[2] !== py || comps[3] !== pk) {
            const cN = decodeInvert ? 1 - comps[0] / compMax : comps[0] / compMax;
            const mN = decodeInvert ? 1 - comps[1] / compMax : comps[1] / compMax;
            const yN = decodeInvert ? 1 - comps[2] / compMax : comps[2] / compMax;
            const kN = decodeInvert ? 1 - comps[3] / compMax : comps[3] / compMax;
            const rgb = cmykToRgb(cN, mN, yN, kN);
            pr = rgb[0];
            pg = rgb[1];
            pb = rgb[2];
            pc = comps[0];
            pm = comps[1];
            py = comps[2];
            pk = comps[3];
          }
          const pi = (y * width + x) * 4;
          rgbaData[pi] = pr;
          rgbaData[pi + 1] = pg;
          rgbaData[pi + 2] = pb;
          rgbaData[pi + 3] = 255;
        }
      }
    }
  } else if (colorSpace === "Separation") {
    rgbaData = new Uint8ClampedArray(width * height * 4);
    const tintSamples = imageInfo.separationTintSamples;
    const readTint = (i) => {
      if (bitsPerComponent === 8) return imageData[i];
      if (bitsPerComponent === 4) {
        const rowBytes = Math.ceil(width / 2);
        const x = i % width;
        const y = Math.floor(i / width);
        const byte = imageData[y * rowBytes + (x >> 1)];
        const nibble = (x & 1) === 0 ? byte >> 4 & 15 : byte & 15;
        return nibble * 17;
      }
      if (bitsPerComponent === 2) {
        const rowBytes = Math.ceil(width / 4);
        const x = i % width;
        const y = Math.floor(i / width);
        const byte = imageData[y * rowBytes + (x >> 2)];
        const sample = byte >> 6 - (x & 3) * 2 & 3;
        return sample * 85;
      }
      if (bitsPerComponent === 1) {
        const rowBytes = Math.ceil(width / 8);
        const x = i % width;
        const y = Math.floor(i / width);
        const byte = imageData[y * rowBytes + (x >> 3)];
        return byte >> 7 - (x & 7) & 1 ? 255 : 0;
      }
      return imageData[i];
    };
    if (tintSamples && tintSamples.length >= 3) {
      const nSamples = Math.floor(tintSamples.length / 3);
      const lut = buildTintLut(tintSamples, nSamples);
      for (let i = 0; i < width * height; i++) {
        const raw = readTint(i);
        const o = (decodeInvert ? 255 - raw : raw) * 3;
        rgbaData[i * 4] = lut[o];
        rgbaData[i * 4 + 1] = lut[o + 1];
        rgbaData[i * 4 + 2] = lut[o + 2];
        rgbaData[i * 4 + 3] = 255;
      }
    } else {
      for (let i = 0; i < width * height; i++) {
        const raw = readTint(i);
        const val = decodeInvert ? raw : 255 - raw;
        rgbaData[i * 4] = val;
        rgbaData[i * 4 + 1] = val;
        rgbaData[i * 4 + 2] = val;
        rgbaData[i * 4 + 3] = 255;
      }
    }
  } else if ((colorSpace === "DeviceRGB" || colorSpace === "CalRGB") && (bitsPerComponent === 4 || bitsPerComponent === 2)) {
    rgbaData = new Uint8ClampedArray(width * height * 4);
    const rowBytes = Math.ceil(width * 3 * bitsPerComponent / 8);
    const compMax = (1 << bitsPerComponent) - 1;
    const scale = 255 / compMax;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const comps = [0, 0, 0];
        for (let c = 0; c < 3; c++) {
          const bitOff = (x * 3 + c) * bitsPerComponent;
          const byteIdx = y * rowBytes + (bitOff >> 3);
          const shift = 8 - (bitOff & 7) - bitsPerComponent;
          comps[c] = imageData[byteIdx] >> shift & compMax;
        }
        const r = decodeInvert ? compMax - comps[0] : comps[0];
        const g = decodeInvert ? compMax - comps[1] : comps[1];
        const b = decodeInvert ? compMax - comps[2] : comps[2];
        const pi = (y * width + x) * 4;
        rgbaData[pi] = Math.round(r * scale);
        rgbaData[pi + 1] = Math.round(g * scale);
        rgbaData[pi + 2] = Math.round(b * scale);
        rgbaData[pi + 3] = 255;
      }
    }
  } else if (colorSpace === "Lab") {
    const wp = imageInfo.labWhitePoint || [0.9505, 1, 1.089];
    const range = imageInfo.labRange || [-100, 100, -100, 100];
    const { labBytesToRGBA: labBytesToRGBA2 } = await Promise.resolve().then(function() {
      return decodeJPEG;
    });
    rgbaData = new Uint8ClampedArray(labBytesToRGBA2(imageData, width, height, wp, range).buffer);
  } else if (colorSpace === "DeviceN" && imageInfo.deviceNTintCS) {
    const nComp = imageInfo.deviceNTintCS.nInputs;
    rgbaData = new Uint8ClampedArray(width * height * 4);
    const rgb = tintSamplesToRgb(imageInfo.deviceNTintCS, imageData, nComp, width * height);
    if (rgb) {
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = rgb[i * 3];
        rgbaData[i * 4 + 1] = rgb[i * 3 + 1];
        rgbaData[i * 4 + 2] = rgb[i * 3 + 2];
        rgbaData[i * 4 + 3] = 255;
      }
    }
  } else {
    let components;
    if (colorSpace === "DeviceRGB" || colorSpace === "CalRGB" || colorSpace === "ICCBased") {
      components = 3;
    } else {
      components = Math.round(imageData.length / (width * height)) || 3;
    }
    rgbaData = new Uint8ClampedArray(width * height * 4);
    if (components === 1) {
      for (let i = 0; i < width * height; i++) {
        const val = decodeInvert ? 255 - imageData[i] : imageData[i];
        rgbaData[i * 4] = val;
        rgbaData[i * 4 + 1] = val;
        rgbaData[i * 4 + 2] = val;
        rgbaData[i * 4 + 3] = 255;
      }
    } else if (components === 4) {
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = decodeInvert ? 255 - imageData[i * 4] : imageData[i * 4];
        rgbaData[i * 4 + 1] = decodeInvert ? 255 - imageData[i * 4 + 1] : imageData[i * 4 + 1];
        rgbaData[i * 4 + 2] = decodeInvert ? 255 - imageData[i * 4 + 2] : imageData[i * 4 + 2];
        rgbaData[i * 4 + 3] = imageData[i * 4 + 3];
      }
    } else {
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = decodeInvert ? 255 - imageData[i * components] : imageData[i * components];
        rgbaData[i * 4 + 1] = decodeInvert ? 255 - imageData[i * components + 1] : imageData[i * components + 1];
        rgbaData[i * 4 + 2] = decodeInvert ? 255 - imageData[i * components + 2] : imageData[i * components + 2];
        rgbaData[i * 4 + 3] = 255;
      }
    }
  }
  if (imageInfo.iccTransform && rgbaData) {
    const { gamma, matrix: m } = imageInfo.iccTransform;
    const lut = gamma.map((g) => {
      const t = new Float32Array(256);
      for (let v = 0; v < 256; v++) t[v] = (v / 255) ** g;
      return t;
    });
    const xyzToSrgb = [
      3.1338561,
      -1.6168667,
      -0.4906146,
      -0.9787684,
      1.9161415,
      0.033454,
      0.0719453,
      -0.2289914,
      1.4052427
    ];
    const term = [];
    for (let j = 0; j < 9; j++) {
      const t = new Float64Array(256);
      const l = lut[j % 3];
      for (let v = 0; v < 256; v++) t[v] = m[j] * l[v];
      term.push(t);
    }
    const cacheKeys = new Int32Array(1 << 16).fill(-1);
    const cacheVals = new Int32Array(1 << 16);
    const n = width * height;
    for (let i = 0; i < n; i++) {
      const off = i * 4;
      const r = rgbaData[off];
      const g = rgbaData[off + 1];
      const b = rgbaData[off + 2];
      const key = r << 16 | g << 8 | b;
      const slot = Math.imul(key, 2654435761) >>> 16 & 65535;
      if (cacheKeys[slot] === key) {
        const v = cacheVals[slot];
        rgbaData[off] = v >>> 16 & 255;
        rgbaData[off + 1] = v >>> 8 & 255;
        rgbaData[off + 2] = v & 255;
        continue;
      }
      const x = term[0][r] + term[1][g] + term[2][b];
      const y = term[3][r] + term[4][g] + term[5][b];
      const z = term[6][r] + term[7][g] + term[8][b];
      const sr = xyzToSrgb[0] * x + xyzToSrgb[1] * y + xyzToSrgb[2] * z;
      const sg = xyzToSrgb[3] * x + xyzToSrgb[4] * y + xyzToSrgb[5] * z;
      const sb = xyzToSrgb[6] * x + xyzToSrgb[7] * y + xyzToSrgb[8] * z;
      const outR = Math.max(0, Math.min(255, Math.round(255 * Math.max(0, sr) ** (1 / 2.2))));
      const outG = Math.max(0, Math.min(255, Math.round(255 * Math.max(0, sg) ** (1 / 2.2))));
      const outB = Math.max(0, Math.min(255, Math.round(255 * Math.max(0, sb) ** (1 / 2.2))));
      rgbaData[off] = outR;
      rgbaData[off + 1] = outG;
      rgbaData[off + 2] = outB;
      cacheKeys[slot] = key;
      cacheVals[slot] = outR << 16 | outG << 8 | outB;
    }
  }
  if (sMask && sMaskWidth && sMaskHeight) {
    if (sMaskWidth > width || sMaskHeight > height) {
      const outW = sMaskWidth;
      const outH = sMaskHeight;
      const upsampled = upsampleImageWithMask(rgbaData, width, height, sMask, outW, outH);
      return ca.createImageBitmapFromImageData(new ImageData(upsampled, outW, outH));
    }
    applySoftMaskAlpha(rgbaData, width, height, sMask, sMaskWidth, sMaskHeight);
  }
  if (colorKeyMask && rgbaData) {
    const nComp = colorKeyMask.length / 2;
    const rowBytes = Math.ceil(width * nComp * bitsPerComponent / 8);
    const sampleMax = (1 << bitsPerComponent) - 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let masked = true;
        for (let c = 0; c < nComp; c++) {
          let val;
          if (bitsPerComponent === 8) {
            val = imageData[y * rowBytes + x * nComp + c];
          } else {
            const bitOff = (x * nComp + c) * bitsPerComponent;
            const byteIdx = y * rowBytes + (bitOff >> 3);
            val = imageData[byteIdx] >> 8 - (bitOff & 7) - bitsPerComponent & sampleMax;
          }
          if (val < colorKeyMask[c * 2] || val > colorKeyMask[c * 2 + 1]) {
            masked = false;
            break;
          }
        }
        if (masked) rgbaData[(y * width + x) * 4 + 3] = 0;
      }
    }
  }
  if (maxW && maxH && (width > maxW || height > maxH) && width * height >= 4e7) {
    const k = Math.min(maxW / width, maxH / height);
    const outW = Math.max(1, Math.round(width * k));
    const outH = Math.max(1, Math.round(height * k));
    if (width * height >= outW * outH * 2) {
      const small = boxDownsampleRgba(rgbaData, width, height, outW, outH);
      return ca.createImageBitmapFromImageData(new ImageData(small, outW, outH));
    }
  }
  const imgData = new ImageData(rgbaData, width, height);
  return ca.createImageBitmapFromImageData(imgData);
}
async function imageMaskToBitmap(imageInfo, fillColor, objCache) {
  if (imageInfo.imageData == null && objCache && imageInfo.objNum != null) {
    imageInfo.imageData = objCache.getStreamBytes(imageInfo.objNum);
  }
  const { width, height, imageData } = imageInfo;
  if (imageData == null) return null;
  const colorMatch = /rgb\((\d+),(\d+),(\d+)\)/.exec(fillColor);
  const r = colorMatch ? Number(colorMatch[1]) : 0;
  const g = colorMatch ? Number(colorMatch[2]) : 0;
  const b = colorMatch ? Number(colorMatch[3]) : 0;
  const rgbaData = new Uint8ClampedArray(width * height * 4);
  const rowBytes = Math.ceil(width / 8);
  const paintBit = imageInfo.decodeInvert ? 1 : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const byteIndex = y * rowBytes + Math.floor(x / 8);
      const bitIndex = 7 - x % 8;
      const bit = imageData[byteIndex] >> bitIndex & 1;
      const pi = (y * width + x) * 4;
      if (bit === paintBit) {
        rgbaData[pi] = r;
        rgbaData[pi + 1] = g;
        rgbaData[pi + 2] = b;
        rgbaData[pi + 3] = 255;
      }
    }
  }
  return ca.createImageBitmapFromImageData(new ImageData(rgbaData, width, height));
}
function transformSmaskCtm(smask, composedBase) {
  if (!smask) return smask;
  if (!smask.parentCtm) return { ...smask, parentCtm: composedBase.slice() };
  return { ...smask, parentCtm: matMul(smask.parentCtm, composedBase) };
}
function applyFormTransform(op, composedBase) {
  const composeFormRefs = (result) => {
    if (op.smask) result.smask = transformSmaskCtm(op.smask, composedBase);
    if (op.outerSmask) result.outerSmask = transformSmaskCtm(op.outerSmask, composedBase);
    if (op.tilingPattern) result.tilingPattern = { ...op.tilingPattern, matrix: matMul(op.tilingPattern.matrix, composedBase) };
    if (op.patternShading?.matrix) result.patternShading = { ...op.patternShading, matrix: matMul(op.patternShading.matrix, composedBase) };
    if (op.type === "path" && result.type === "path") {
      if (op.strokeTilingPattern) result.strokeTilingPattern = { ...op.strokeTilingPattern, matrix: matMul(op.strokeTilingPattern.matrix, composedBase) };
      if (op.strokePatternShading?.matrix) result.strokePatternShading = { ...op.strokePatternShading, matrix: matMul(op.strokePatternShading.matrix, composedBase) };
    }
  };
  switch (op.type) {
    case "image": {
      const finalCtm = matMul(op.ctm, composedBase);
      const result = { ...op, ctm: finalCtm };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    case "type0text": {
      const trm = matMul([op.a, op.b, op.c, op.d, op.x, op.y], composedBase);
      const result = {
        ...op,
        a: trm[0],
        b: trm[1],
        c: trm[2],
        d: trm[3],
        x: trm[4],
        y: trm[5]
      };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    case "type3glyph": {
      const newTransform = matMul(op.transform, composedBase);
      const result = { ...op, transform: newTransform };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    case "path": {
      const newCtm = matMul(op.ctm, composedBase);
      const result = { ...op, ctm: newCtm };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    case "shading": {
      const newCtm = matMul(op.ctm, composedBase);
      const result = { ...op, ctm: newCtm };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    case "inlineImage": {
      const newCtm = matMul(op.ctm, composedBase);
      const result = { ...op, ctm: newCtm };
      if (op.clips) result.clips = op.clips.map((c) => ({ ...c, ctm: matMul(c.ctm, composedBase) }));
      composeFormRefs(result);
      return result;
    }
    default:
      return op;
  }
}
async function flattenDrawOps(imageOps, images, forms, objCache, fonts, registeredFontNames, prefix = "", pageIndex = 0, symbolFontTags = /* @__PURE__ */ new Set(), cidPUATags = /* @__PURE__ */ new Set(), pageExtGStates = /* @__PURE__ */ new Map(), rawCharCodeTags = /* @__PURE__ */ new Set(), formResourceCache = /* @__PURE__ */ new Map(), depth = 0, offOCGs = /* @__PURE__ */ new Set(), cidCollisionMap = /* @__PURE__ */ new Map(), inheritedFillColor = "black", inheritedStrokeColor = "rgb(0,0,0)", inheritedFillAlpha = 1, inheritedStrokeAlpha = 1, groupContext = null, currentGroupId = null, textPatches = null) {
  const flattened = [];
  if (depth > 200) return flattened;
  const callCount = (formResourceCache.get("_callCount") || 0) + 1;
  formResourceCache.set("_callCount", callCount);
  if (callCount > 1e5) return flattened;
  for (const op of imageOps) {
    const fullName = prefix + op.name;
    if (images.has(fullName)) {
      const imgOp = {
        type: "image",
        name: fullName,
        ctm: op.ctm,
        fillAlpha: op.fillAlpha,
        strokeAlpha: op.strokeAlpha,
        fillColor: op.fillColor
      };
      if (op.clips) imgOp.clips = op.clips;
      if (op.overprint) imgOp.overprint = true;
      if (op.blendMode) imgOp.blendMode = op.blendMode;
      if (op.tilingPattern) imgOp.tilingPattern = op.tilingPattern;
      if (op.fillColorInherited) imgOp.fillColorInherited = true;
      if (op.fillAlphaInherited) imgOp.fillAlphaInherited = true;
      if (op.strokeColorInherited) imgOp.strokeColorInherited = true;
      if (op.strokeAlphaInherited) imgOp.strokeAlphaInherited = true;
      flattened.push(imgOp);
      continue;
    }
    const formInfo = forms.get(fullName);
    if (!formInfo) continue;
    const formObjText = objCache.getObjectText(formInfo.objNum);
    if (!formObjText) continue;
    if (offOCGs.size > 0 && isFormOCHidden(formObjText, offOCGs, objCache)) continue;
    const formMatrix = parseFormMatrix(formObjText, objCache);
    const composedBase = matMul(formMatrix, op.ctm);
    let bboxClip = null;
    if (formInfo.bbox && formInfo.bbox.length === 4) {
      const bx0 = Math.min(formInfo.bbox[0], formInfo.bbox[2]);
      const by0 = Math.min(formInfo.bbox[1], formInfo.bbox[3]);
      const bx1 = Math.max(formInfo.bbox[0], formInfo.bbox[2]);
      const by1 = Math.max(formInfo.bbox[1], formInfo.bbox[3]);
      bboxClip = {
        path: [
          { type: "M", x: bx0, y: by0 },
          { type: "L", x: bx1, y: by0 },
          { type: "L", x: bx1, y: by1 },
          { type: "L", x: bx0, y: by1 },
          { type: "Z" }
        ],
        ctm: composedBase.slice(),
        evenOdd: false,
        fromFormObjNum: formInfo.objNum
      };
    }
    const ts = op.textState || {
      tc: 0,
      tw: 0,
      tl: 0,
      tz: 100,
      trise: 0
    };
    const formStreamKey = { kind: "form", path: fullName };
    const formPatched = textPatchesTarget(textPatches, formStreamKey);
    const cacheKey = `${formInfo.objNum}_${ts.tc}_${ts.tw}_${ts.tl}_${ts.tz}_${ts.trise}${formPatched ? `_patched_${fullName}` : ""}`;
    let cached = formResourceCache.get(cacheKey);
    if (!cached) {
      const fontRefMatches = [...formObjText.matchAll(/\/Fo\w+\s+(\d+)\s+\d+\s+R/g)];
      const fontRefKey = fontRefMatches.map((m) => m[1]).sort().join(",");
      const cachedFontParse = fontRefKey ? formResourceCache.get(`_fonts_${fontRefKey}`) : null;
      let formFonts;
      if (cachedFontParse) {
        formFonts = cachedFontParse.formFonts;
      } else {
        formFonts = parsePageFonts(formObjText, objCache);
        if (fontRefKey) formResourceCache.set(`_fonts_${fontRefKey}`, { formFonts });
      }
      let effectiveFonts2 = fonts;
      let effectiveRegistered2 = registeredFontNames;
      let effectiveSymbol2 = symbolFontTags;
      let effectiveCidPUA2 = cidPUATags;
      let effectiveRaw2 = rawCharCodeTags;
      let effectiveCidCollisionMap2 = cidCollisionMap;
      if (formFonts.size > 0) {
        effectiveFonts2 = new Map([...fonts, ...formFonts]);
        effectiveRegistered2 = new Map(registeredFontNames);
        effectiveSymbol2 = new Set(symbolFontTags);
        effectiveCidPUA2 = new Set(cidPUATags);
        effectiveRaw2 = new Set(rawCharCodeTags);
        effectiveCidCollisionMap2 = new Map(cidCollisionMap);
        for (const [fontTag, fontObj] of formFonts) {
          const formId = fullName.replace(/\//g, "_");
          const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, `${formId}_${fontTag}`);
          effectiveSymbol2.delete(fontTag);
          effectiveCidPUA2.delete(fontTag);
          effectiveRaw2.delete(fontTag);
          await convertAndRegisterFont(
            fontTag,
            fontObj,
            effectiveRegistered2,
            effectiveSymbol2,
            effectiveCidPUA2,
            effectiveRaw2,
            effectiveCidCollisionMap2,
            objCache,
            familyName
          );
        }
        appendGenericFallbacks(effectiveRegistered2, effectiveFonts2);
      }
      const resRefMatches = [...formObjText.matchAll(/\/\w+\s+(\d+)\s+\d+\s+R/g)];
      const resKey = resRefMatches.map((m) => m[1]).join(",");
      const cachedRes = resKey ? formResourceCache.get(`_res_${resKey}`) : null;
      let formExtGStates;
      let formColorSpaces;
      let formImagesResult;
      let formShadings;
      let formPatterns;
      if (cachedRes) {
        formExtGStates = cachedRes.formExtGStates;
        formColorSpaces = cachedRes.formColorSpaces;
        formImagesResult = cachedRes.formImagesResult;
        formShadings = cachedRes.formShadings;
        formPatterns = cachedRes.formPatterns;
      } else {
        formExtGStates = parseExtGStates(formObjText, objCache);
        formColorSpaces = parsePageColorSpaces(formObjText, objCache);
        formImagesResult = parsePageImages(formObjText, objCache, { recurseForms: false });
        formShadings = parseShadings(formObjText, objCache);
        formPatterns = parsePatterns(formObjText, objCache);
        if (resKey) {
          formResourceCache.set(`_res_${resKey}`, {
            formExtGStates,
            formColorSpaces,
            formImagesResult,
            formShadings,
            formPatterns
          });
        }
      }
      let formResourcesText = formObjText;
      const formResRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(formObjText);
      if (formResRefMatch) {
        const formResObj = objCache.getObjectText(Number(formResRefMatch[1]));
        if (formResObj) formResourcesText = formResObj;
      }
      const formDefinesOwnExtGState = /\/ExtGState[\s/<]/.test(formResourcesText);
      const effectiveExtGStates2 = formDefinesOwnExtGState ? formExtGStates : formExtGStates.size > 0 ? new Map([...pageExtGStates, ...formExtGStates]) : pageExtGStates;
      const streamBytes = objCache.getStreamBytes(formInfo.objNum);
      let rawFormDrawOps = [];
      if (streamBytes) {
        let formStream = bytesToLatin1(streamBytes);
        if (formPatched) formStream = applyTextPatchRecords(formStream, textPatches, formStreamKey).text;
        rawFormDrawOps = parseDrawOps(
          formStream,
          effectiveFonts2,
          effectiveExtGStates2,
          effectiveRegistered2,
          formColorSpaces.size > 0 ? formColorSpaces : void 0,
          effectiveSymbol2,
          effectiveCidPUA2,
          effectiveRaw2,
          formShadings,
          formPatterns,
          effectiveCidCollisionMap2,
          ts,
          parseHiddenOCMCNames(formObjText, objCache, offOCGs)
        );
      }
      cached = {
        formImagesResult,
        rawFormDrawOps,
        effectiveFonts: effectiveFonts2,
        effectiveRegistered: effectiveRegistered2,
        effectiveExtGStates: effectiveExtGStates2,
        effectiveSymbol: effectiveSymbol2,
        effectiveCidPUA: effectiveCidPUA2,
        effectiveRaw: effectiveRaw2,
        effectiveCidCollisionMap: effectiveCidCollisionMap2
      };
      formResourceCache.set(cacheKey, cached);
    }
    const formInheritedFill = op.fillColorInherited ? inheritedFillColor : op.fillColor;
    const formInheritedStroke = op.strokeColorInherited ? inheritedStrokeColor : op.strokeColor || inheritedStrokeColor;
    const formInheritedFillAlpha = op.fillAlphaInherited ? inheritedFillAlpha : op.fillAlpha != null ? op.fillAlpha : 1;
    const formInheritedStrokeAlpha = op.strokeAlphaInherited ? inheritedStrokeAlpha : op.strokeAlpha != null ? op.strokeAlpha : 1;
    for (const [name, info] of cached.formImagesResult.images) {
      images.set(`${fullName}/${name}`, info);
    }
    for (const [name, info] of cached.formImagesResult.forms) {
      forms.set(`${fullName}/${name}`, info);
    }
    if (cached.formImagesResult.images.size === 0 && cached.formImagesResult.forms.size === 0 && !/\/Resources[\s<]/.test(formObjText)) {
      for (const [name, info] of [...images]) {
        const relName = prefix ? name.startsWith(prefix) ? name.substring(prefix.length) : null : name;
        if (relName && !relName.includes("/") && relName !== fullName.substring(prefix.length)) {
          images.set(`${fullName}/${relName}`, info);
        }
      }
      for (const [name, info] of [...forms]) {
        const relName = prefix ? name.startsWith(prefix) ? name.substring(prefix.length) : null : name;
        if (relName && !relName.includes("/") && relName !== fullName.substring(prefix.length)) {
          forms.set(`${fullName}/${relName}`, info);
        }
      }
    }
    const effectiveFonts = cached.effectiveFonts;
    const effectiveRegistered = cached.effectiveRegistered;
    const effectiveExtGStates = cached.effectiveExtGStates;
    const effectiveSymbol = cached.effectiveSymbol || symbolFontTags;
    const effectiveCidPUA = cached.effectiveCidPUA || cidPUATags;
    const effectiveRaw = cached.effectiveRaw || rawCharCodeTags;
    const effectiveCidCollisionMap = cached.effectiveCidCollisionMap || cidCollisionMap;
    const innerPrefix = `${fullName}/`;
    let formGroupId = null;
    const compositeIsTrivial = (!op.blendMode || op.blendMode === "Normal") && (op.fillAlpha == null || op.fillAlpha >= 1) && (op.strokeAlpha == null || op.strokeAlpha >= 1) && !op.smask;
    const singleOpAlphaGroup = !compositeIsTrivial && (!op.blendMode || op.blendMode === "Normal") && !op.smask && formInfo.transparencyGroup && !formInfo.transparencyGroup.knockout && cached.rawFormDrawOps.length === 1 && cached.rawFormDrawOps[0].type !== "image" && !(cached.rawFormDrawOps[0].fill && cached.rawFormDrawOps[0].stroke);
    const isolatedNeedsBuffer = formInfo.transparencyGroup && formInfo.transparencyGroup.isolated && cached.rawFormDrawOps.some((fop) => fop.blendMode && fop.blendMode !== "Normal");
    if (groupContext && formInfo.transparencyGroup && (!compositeIsTrivial || isolatedNeedsBuffer) && !singleOpAlphaGroup) {
      formGroupId = groupContext.nextId++;
      groupContext.registry.set(formGroupId, {
        isolated: !!formInfo.transparencyGroup.isolated,
        knockout: !!formInfo.transparencyGroup.knockout,
        blendMode: op.blendMode || "Normal",
        fillAlpha: op.fillAlpha != null ? op.fillAlpha : 1,
        strokeAlpha: op.strokeAlpha != null ? op.strokeAlpha : 1,
        smask: op.smask || null,
        parentGroupId: currentGroupId
      });
    }
    const innerGroupId = formGroupId !== null ? formGroupId : currentGroupId;
    const expandedFormOps = [];
    for (const innerOp of cached.rawFormDrawOps) {
      if (innerOp.type === "image") {
        const nestedGroupIdStart = groupContext ? groupContext.nextId : 0;
        const nestedFlattened = await flattenDrawOps(
          [innerOp],
          images,
          forms,
          objCache,
          effectiveFonts,
          effectiveRegistered,
          innerPrefix,
          pageIndex,
          effectiveSymbol,
          effectiveCidPUA,
          effectiveExtGStates,
          effectiveRaw,
          formResourceCache,
          depth + 1,
          offOCGs,
          effectiveCidCollisionMap,
          formInheritedFill,
          formInheritedStroke,
          formInheritedFillAlpha,
          formInheritedStrokeAlpha,
          groupContext,
          innerGroupId,
          textPatches
        );
        if (groupContext) {
          for (let gid = nestedGroupIdStart; gid < groupContext.nextId; gid++) {
            const ga = groupContext.registry.get(gid);
            if (ga && ga.smask) ga.smask = transformSmaskCtm(ga.smask, composedBase);
          }
        }
        for (const nestedOp of nestedFlattened) expandedFormOps.push(nestedOp);
      } else {
        expandedFormOps.push(innerOp);
      }
    }
    const hasFormSiblingSmasks = op.smask && expandedFormOps.some((fop) => fop.smask);
    for (const innerOp of expandedFormOps) {
      const transformed = applyFormTransform(innerOp, composedBase);
      if (innerOp.fillColorInherited) {
        transformed.fillColor = formInheritedFill;
        delete transformed.fillColorInherited;
      }
      if (innerOp.strokeColorInherited) {
        transformed.strokeColor = formInheritedStroke;
        delete transformed.strokeColorInherited;
      }
      const fillAlphaInherited = innerOp.fillAlphaInherited;
      const strokeAlphaInherited = innerOp.strokeAlphaInherited;
      delete transformed.fillAlphaInherited;
      delete transformed.strokeAlphaInherited;
      if (op.clips && op.clips.length > 0) {
        if (!transformed.clips) transformed.clips = [];
        for (const c of op.clips) transformed.clips.push({ ...c, ctm: c.ctm.slice() });
      }
      if (bboxClip) {
        if (!transformed.clips) transformed.clips = [];
        transformed.clips.push({ ...bboxClip, ctm: bboxClip.ctm.slice() });
      }
      if (formGroupId === null) {
        if (op.smask) {
          if (hasFormSiblingSmasks) {
            transformed.outerSmask = op.smask;
          } else if (!transformed.smask) {
            transformed.smask = op.smask;
          }
        }
        if (singleOpAlphaGroup) {
          const ownFill = fillAlphaInherited ? 1 : transformed.fillAlpha != null ? transformed.fillAlpha : 1;
          const ownStroke = strokeAlphaInherited ? 1 : transformed.strokeAlpha != null ? transformed.strokeAlpha : 1;
          if (op.fillAlpha != null) transformed.fillAlpha = ownFill * op.fillAlpha;
          if (op.strokeAlpha != null) transformed.strokeAlpha = ownStroke * op.strokeAlpha;
        } else {
          if (fillAlphaInherited && formInheritedFillAlpha < 1) transformed.fillAlpha = formInheritedFillAlpha;
          if (strokeAlphaInherited && formInheritedStrokeAlpha < 1) transformed.strokeAlpha = formInheritedStrokeAlpha;
        }
        if (op.blendMode && !transformed.blendMode) transformed.blendMode = op.blendMode;
      }
      if (op.overprint && !transformed.overprint) transformed.overprint = true;
      if (innerGroupId !== null && transformed.groupId === void 0) {
        transformed.groupId = innerGroupId;
      }
      flattened.push(transformed);
    }
  }
  return flattened;
}
function parseBlendMode(gsObjText) {
  const arrMatch = /\/BM\s*\[([^\]]+)\]/.exec(gsObjText);
  if (arrMatch) {
    const names = [...arrMatch[1].matchAll(/\/(\w+)/g)].map((m) => m[1]);
    for (const n of names) {
      if (n === "Normal" || pdfBlendToCanvas[n]) return n;
    }
    return names[0] || null;
  }
  const nameMatch = /\/BM\s*\/(\w+)/.exec(gsObjText);
  return nameMatch ? nameMatch[1] : null;
}
function parseSmaskTR(smaskDict, objCache) {
  if (/\/TR\s*\/Identity\b/.test(smaskDict)) return null;
  const refMatch = /\/TR\s+(\d+)\s+\d+\s+R/.exec(smaskDict);
  if (refMatch) return parseFunction(Number(refMatch[1]), objCache);
  const inlineIdx = smaskDict.indexOf("/TR");
  if (inlineIdx !== -1) {
    const after = smaskDict.substring(inlineIdx + 3).trimStart();
    if (after.startsWith("<<")) {
      const dictStart = smaskDict.indexOf("<<", inlineIdx + 3);
      if (dictStart !== -1) return parseFunction(extractDict(smaskDict, dictStart), objCache);
    }
  }
  return null;
}
function parseSmaskBC(smaskDict, objCache) {
  const arr = resolveNumArray(smaskDict, "BC", objCache);
  return arr && arr.length > 0 ? arr : null;
}
function parseExtGStates(pageObjText, objCache) {
  const states = /* @__PURE__ */ new Map();
  let resourcesText = null;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(pageObjText);
  if (resRefMatch) {
    resourcesText = objCache.getObjectText(Number(resRefMatch[1])) || null;
  } else {
    const resIdx = pageObjText.indexOf("/Resources");
    if (resIdx !== -1) {
      const dictStart = pageObjText.indexOf("<<", resIdx);
      if (dictStart !== -1) resourcesText = extractDict(pageObjText, dictStart);
    }
  }
  if (!resourcesText) return states;
  const gsStart = findTopLevelKey(resourcesText, "/ExtGState");
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
  const gsEntryRegex = /\/([^\s/<>[\]]+)\s+(\d+)\s+\d+\s+R/g;
  for (const match of gsDictText.matchAll(gsEntryRegex)) {
    const gsName = match[1];
    const gsObjNum = Number(match[2]);
    const gsObj = objCache.getObjectText(gsObjNum);
    if (!gsObj) continue;
    const entry = {};
    const fillA = resolveNumValue(gsObj, "ca", objCache, Number.NaN);
    const strokeA = resolveNumValue(gsObj, "CA", objCache, Number.NaN);
    if (!Number.isNaN(fillA)) entry.fillAlpha = fillA;
    if (!Number.isNaN(strokeA)) entry.strokeAlpha = strokeA;
    const opMatch = /\/op\s+(true|false)/.exec(gsObj);
    const OPMatch = /\/OP\s+(true|false)/.exec(gsObj);
    if (opMatch) {
      entry.overprint = opMatch[1] === "true";
    } else if (OPMatch) {
      entry.overprint = OPMatch[1] === "true";
    }
    if (/\/SMask\s*\/None/.test(gsObj)) {
      entry.smask = null;
    } else {
      const smaskRef = /\/SMask\s+(\d+)\s+\d+\s+R/.exec(gsObj);
      let smaskDict;
      if (smaskRef) {
        smaskDict = objCache.getObjectText(Number(smaskRef[1]));
      } else {
        const smaskIdx = gsObj.indexOf("/SMask");
        if (smaskIdx !== -1) {
          const afterSmask = gsObj.substring(smaskIdx + 6).trim();
          if (afterSmask.startsWith("<<")) {
            smaskDict = extractDict(gsObj, smaskIdx + 6 + gsObj.substring(smaskIdx + 6).indexOf("<<"));
          }
        }
      }
      if (smaskDict) {
        const gMatch = /\/G\s+(\d+)\s+\d+\s+R/.exec(smaskDict);
        const sMatch = /\/S\s*\/(\w+)/.exec(smaskDict);
        if (gMatch) {
          entry.smask = {
            formObjNum: Number(gMatch[1]),
            type: sMatch ? sMatch[1] : "Luminosity",
            tr: parseSmaskTR(smaskDict, objCache),
            bc: parseSmaskBC(smaskDict, objCache)
          };
        }
      }
    }
    const bm = parseBlendMode(gsObj);
    if (bm) entry.blendMode = bm;
    const lw = resolveNumValue(gsObj, "LW", objCache, Number.NaN);
    if (!Number.isNaN(lw)) entry.lineWidth = lw;
    const lc = resolveIntValue(gsObj, "LC", objCache, -1);
    if (lc !== -1) entry.lineCap = lc;
    const lj = resolveIntValue(gsObj, "LJ", objCache, -1);
    if (lj !== -1) entry.lineJoin = lj;
    const ml = resolveNumValue(gsObj, "ML", objCache, Number.NaN);
    if (!Number.isNaN(ml)) entry.miterLimit = ml;
    const dMatch = /\/D\s*\[\s*\[([^\]]*)\]\s*([0-9.]+)\s*\]/.exec(gsObj);
    if (dMatch) {
      entry.dashArray = dMatch[1].trim() ? dMatch[1].trim().split(/\s+/).map(Number).filter((x) => Number.isFinite(x)) : [];
      entry.dashPhase = parseFloat(dMatch[2]);
    }
    if (entry.fillAlpha !== void 0 || entry.strokeAlpha !== void 0 || entry.smask !== void 0 || entry.overprint !== void 0 || entry.blendMode !== void 0 || entry.lineWidth !== void 0 || entry.lineCap !== void 0 || entry.lineJoin !== void 0 || entry.miterLimit !== void 0 || entry.dashArray !== void 0) {
      states.set(gsName, entry);
    }
  }
  const inlineGsRegex = /\/([^\s/<>[\]]+)\s*<</g;
  let inlineMatch;
  while ((inlineMatch = inlineGsRegex.exec(gsDictText)) !== null) {
    const gsName = inlineMatch[1];
    if (states.has(gsName)) continue;
    const dictText = extractDict(gsDictText, inlineMatch.index + inlineMatch[0].length - 2);
    if (!dictText) continue;
    const entry = {};
    const ca2 = resolveNumValue(dictText, "ca", objCache, Number.NaN);
    const CA2 = resolveNumValue(dictText, "CA", objCache, Number.NaN);
    if (!Number.isNaN(ca2)) entry.fillAlpha = ca2;
    if (!Number.isNaN(CA2)) entry.strokeAlpha = CA2;
    const opMatch2 = /\/op\s+(true|false)/.exec(dictText);
    const OPMatch2 = /\/OP\s+(true|false)/.exec(dictText);
    if (opMatch2) {
      entry.overprint = opMatch2[1] === "true";
    } else if (OPMatch2) {
      entry.overprint = OPMatch2[1] === "true";
    }
    if (/\/SMask\s*\/None/.test(dictText)) {
      entry.smask = null;
    } else {
      const smaskRef = /\/SMask\s+(\d+)\s+\d+\s+R/.exec(dictText);
      let smaskDict;
      if (smaskRef) {
        smaskDict = objCache.getObjectText(Number(smaskRef[1]));
      } else {
        const smaskIdx = dictText.indexOf("/SMask");
        if (smaskIdx !== -1) {
          const afterSmask = dictText.substring(smaskIdx + 6).trim();
          if (afterSmask.startsWith("<<")) {
            smaskDict = extractDict(dictText, smaskIdx + 6 + dictText.substring(smaskIdx + 6).indexOf("<<"));
          }
        }
      }
      if (smaskDict) {
        const gMatch = /\/G\s+(\d+)\s+\d+\s+R/.exec(smaskDict);
        const sMatch = /\/S\s*\/(\w+)/.exec(smaskDict);
        if (gMatch) {
          entry.smask = {
            formObjNum: Number(gMatch[1]),
            type: sMatch ? sMatch[1] : "Luminosity",
            tr: parseSmaskTR(smaskDict, objCache),
            bc: parseSmaskBC(smaskDict, objCache)
          };
        }
      }
    }
    const bm2 = parseBlendMode(dictText);
    if (bm2) entry.blendMode = bm2;
    const lw2 = resolveNumValue(dictText, "LW", objCache, Number.NaN);
    if (!Number.isNaN(lw2)) entry.lineWidth = lw2;
    const lc2 = resolveIntValue(dictText, "LC", objCache, -1);
    if (lc2 !== -1) entry.lineCap = lc2;
    const lj2 = resolveIntValue(dictText, "LJ", objCache, -1);
    if (lj2 !== -1) entry.lineJoin = lj2;
    const ml2 = resolveNumValue(dictText, "ML", objCache, Number.NaN);
    if (!Number.isNaN(ml2)) entry.miterLimit = ml2;
    const dMatch2 = /\/D\s*\[\s*\[([^\]]*)\]\s*([0-9.]+)\s*\]/.exec(dictText);
    if (dMatch2) {
      entry.dashArray = dMatch2[1].trim() ? dMatch2[1].trim().split(/\s+/).map(Number).filter((x) => Number.isFinite(x)) : [];
      entry.dashPhase = parseFloat(dMatch2[2]);
    }
    if (entry.fillAlpha !== void 0 || entry.strokeAlpha !== void 0 || entry.smask !== void 0 || entry.overprint !== void 0 || entry.blendMode !== void 0 || entry.lineWidth !== void 0 || entry.lineCap !== void 0 || entry.lineJoin !== void 0 || entry.miterLimit !== void 0 || entry.dashArray !== void 0) {
      states.set(gsName, entry);
    }
  }
  return states;
}
function findTopLevelKey(dictText, key) {
  let depth = 0;
  let i = 0;
  const n = dictText.length;
  while (i < n) {
    const c = dictText.charCodeAt(i);
    if (c === 60 && dictText.charCodeAt(i + 1) === 60) {
      depth++;
      i += 2;
    } else if (c === 62 && dictText.charCodeAt(i + 1) === 62) {
      depth--;
      i += 2;
    } else if (depth === 1 && c === 47 && dictText.startsWith(key, i)) {
      const after = dictText.charCodeAt(i + key.length);
      if (after === 32 || after === 9 || after === 10 || after === 13 || after === 47 || after === 91 || after === 40 || after === 60 || after >= 48 && after <= 57) {
        return i;
      }
      i++;
    } else {
      i++;
    }
  }
  return -1;
}
function parsePageColorSpaces(pageObjText, objCache) {
  const colorSpaces = /* @__PURE__ */ new Map();
  let resourcesText = null;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(pageObjText);
  if (resRefMatch) {
    resourcesText = objCache.getObjectText(Number(resRefMatch[1])) || null;
  } else {
    const resIdx = pageObjText.indexOf("/Resources");
    if (resIdx !== -1) {
      const dictStart = pageObjText.indexOf("<<", resIdx);
      if (dictStart !== -1) resourcesText = extractDict(pageObjText, dictStart);
    }
  }
  if (!resourcesText) return colorSpaces;
  const csStart = findTopLevelKey(resourcesText, "/ColorSpace");
  if (csStart === -1) return colorSpaces;
  let csDictText;
  const afterCs = resourcesText.substring(csStart + 11).trim();
  if (afterCs.startsWith("<<")) {
    csDictText = extractDict(resourcesText, csStart + 11 + resourcesText.substring(csStart + 11).indexOf("<<"));
  } else {
    const csRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterCs);
    if (csRefMatch) {
      const csObj = objCache.getObjectText(Number(csRefMatch[1]));
      if (csObj) csDictText = csObj;
    }
  }
  if (!csDictText) return colorSpaces;
  const csEntryRegex = /\/([^\s/<>[\]]+)\s+(\d+)\s+\d+\s+R/g;
  for (const match of csDictText.matchAll(csEntryRegex)) {
    const csName = match[1];
    const csObjText = objCache.getObjectText(Number(match[2]));
    if (!csObjText) continue;
    const typeMatch = /\/(\w+)/.exec(csObjText);
    if (typeMatch) {
      let tintSamples = null;
      let nComponents = 3;
      let csType = typeMatch[1];
      let deviceNGrid = null;
      if (csType === "DeviceN") {
        const namesMatch = /\/DeviceN\s*\[\s*((?:\/[^/[\]<>(){}\s]+\s*)+)\]/.exec(csObjText);
        if (namesMatch) {
          const colorants = namesMatch[1].match(/\/[^/[\]<>(){}\s]+/g) || [];
          if (colorants.length === 1) {
            csType = "Separation";
          } else if (colorants.length >= 2) {
            const tintInfo = parseSeparationTint(csObjText, objCache);
            if (tintInfo.tintSamples) {
              const sizeMatch = /\/Size\s*\[\s*([\d\s]+)\]/.exec(csObjText);
              const allRefs = [...csObjText.matchAll(/(\d+)\s+\d+\s+R/g)];
              let funcObjText = null;
              if (allRefs.length > 0) {
                funcObjText = objCache.getObjectText(Number(allRefs[allRefs.length - 1][1]));
              }
              const sizeText = sizeMatch ? sizeMatch[1] : funcObjText?.match(/\/Size\s*\[\s*([\d\s]+)\]/)?.[1] || "";
              const gridSizes = sizeText.trim().split(/\s+/).map(Number).filter((n) => n > 0);
              if (gridSizes.length === colorants.length) {
                deviceNGrid = {
                  nInputs: colorants.length,
                  sizes: gridSizes,
                  rgbSamples: tintInfo.tintSamples,
                  nComponents: tintInfo.nComponents
                };
              }
            }
            if (!deviceNGrid) {
              const parsedTint = parseTintColorSpace(csObjText, objCache);
              if (parsedTint.tintFn && parsedTint.nInputs === colorants.length) {
                deviceNGrid = {
                  nInputs: colorants.length,
                  sizes: null,
                  rgbSamples: null,
                  nComponents: 3,
                  parsedTint
                };
              }
            }
          }
        }
      }
      if (csType === "Separation") {
        const tintInfo = parseSeparationTint(csObjText, objCache);
        tintSamples = tintInfo.tintSamples;
        nComponents = tintInfo.nComponents;
      }
      let indexedInfo = null;
      if (csType === "Indexed") {
        indexedInfo = parseIndexedColorSpace(csObjText, objCache, Number(match[2]));
      }
      let labWhitePoint = null;
      if (csType === "Lab") {
        const wpStr = resolveArrayValue(csObjText, "WhitePoint", objCache);
        labWhitePoint = wpStr ? wpStr.split(/\s+/).map(Number) : [0.9642, 1, 0.8249];
      }
      colorSpaces.set(csName, {
        type: csType,
        tintSamples,
        nComponents,
        deviceNGrid,
        indexedInfo,
        labWhitePoint
      });
    }
  }
  const inlineArrayRegex = /\/([^\s/<>[\]]+)\s*\[\s*\/(\w+)/g;
  for (const match of csDictText.matchAll(inlineArrayRegex)) {
    const csName = match[1];
    if (!colorSpaces.has(csName)) {
      let tintSamples = null;
      let nComponents = 3;
      let csType = match[2];
      const matchPos = csDictText.indexOf(match[0]);
      const arrStart = csDictText.indexOf("[", matchPos);
      let arrEnd = -1;
      if (arrStart !== -1) {
        let depth = 0;
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
      }
      const arrText = arrEnd > 0 ? csDictText.substring(arrStart, arrEnd) : "";
      if (csType === "DeviceN" && arrText) {
        const namesMatch = /\/DeviceN\s*\[\s*((?:\/\w+\s*)+)\]/.exec(arrText);
        if (namesMatch) {
          const colorants = namesMatch[1].trim().split(/(?=\/)/).filter((s) => s.startsWith("/"));
          if (colorants.length === 1) csType = "Separation";
        }
      }
      if (csType === "Separation" && arrText) {
        const tintInfo = parseSeparationTint(arrText, objCache);
        tintSamples = tintInfo.tintSamples;
        nComponents = tintInfo.nComponents;
      }
      let indexedInfo = null;
      if (csType === "Indexed" && arrText) {
        indexedInfo = parseIndexedColorSpace(arrText, objCache);
      }
      let labWhitePoint = null;
      if (csType === "Lab" && arrText) {
        const wpStr = resolveArrayValue(arrText, "WhitePoint", objCache);
        labWhitePoint = wpStr ? wpStr.split(/\s+/).map(Number) : [0.9642, 1, 0.8249];
      }
      colorSpaces.set(csName, {
        type: csType,
        tintSamples,
        nComponents,
        indexedInfo,
        labWhitePoint
      });
    }
  }
  return colorSpaces;
}
function shadingValuesToColor(values, colorInfo) {
  let r;
  let g;
  let b;
  if (colorInfo.deviceNTintCS) {
    const rgb = tintComponentsToRGB(colorInfo.deviceNTintCS, values);
    if (rgb) {
      [r, g, b] = rgb;
    } else {
      r = 128;
      g = 128;
      b = 128;
    }
  } else if (colorInfo.sepTintSamples) {
    const sepMax = colorInfo.sepTintSamples.length / 3 - 1;
    const idx = Math.round(Math.max(0, Math.min(1, values[0])) * sepMax) * 3;
    r = colorInfo.sepTintSamples[idx];
    g = colorInfo.sepTintSamples[idx + 1];
    b = colorInfo.sepTintSamples[idx + 2];
  } else if (colorInfo.isCMYK && values.length >= 4) {
    [r, g, b] = cmykToRgb(
      Math.max(0, Math.min(1, values[0])),
      Math.max(0, Math.min(1, values[1])),
      Math.max(0, Math.min(1, values[2])),
      Math.max(0, Math.min(1, values[3]))
    );
  } else {
    r = Math.round(Math.max(0, Math.min(1, values[0] ?? 0)) * 255);
    g = colorInfo.isGray ? r : Math.round(Math.max(0, Math.min(1, values[1] ?? 0)) * 255);
    b = colorInfo.isGray ? r : Math.round(Math.max(0, Math.min(1, values[2] ?? 0)) * 255);
  }
  return `rgb(${r},${g},${b})`;
}
function functionToShadingStops(fn, colorInfo) {
  const stops = [];
  if (Array.isArray(fn)) {
    const nStops2 = fn.some((f) => f && f.type === 0) ? 64 : 16;
    for (let i = 0; i < nStops2; i++) {
      const t = i / (nStops2 - 1);
      const values = fn.map((f) => f ? evaluateFunction(f, [t])?.[0] ?? 0 : 0);
      stops.push({ offset: t, color: shadingValuesToColor(values, colorInfo) });
    }
    return stops;
  }
  let nStops;
  if (fn.type === 0) nStops = Math.min(fn.size[0], 64);
  else if (fn.type === 2) nStops = fn.N === 1 ? 2 : 16;
  else nStops = fn.type === 3 && fn.functions.some((f) => f && f.type === 0) ? 64 : 16;
  for (let i = 0; i < nStops; i++) {
    const t = i / (nStops - 1);
    const values = evaluateFunction(fn, [t]) || [];
    stops.push({ offset: t, color: shadingValuesToColor(values, colorInfo) });
  }
  return stops;
}
function type1ShadingToAxial(shadingDict, objCache, colorInfo) {
  const domStr = resolveArrayValue(shadingDict, "Domain", objCache);
  const dom = domStr ? domStr.split(/\s+/).map(Number) : [0, 1, 0, 1];
  const [x0, x1, y0, y1] = dom;
  const mStr = resolveArrayValue(shadingDict, "Matrix", objCache);
  const m = mStr ? mStr.split(/\s+/).map(Number) : [1, 0, 0, 1, 0, 0];
  const mapPt = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  let funcDictText;
  let funcObjNum;
  const funcRefMatch = /\/Function\s+(\d+)\s+\d+\s+R/.exec(shadingDict);
  if (funcRefMatch) {
    funcObjNum = Number(funcRefMatch[1]);
    funcDictText = objCache.getObjectText(funcObjNum);
  } else {
    const fStart = shadingDict.indexOf("/Function");
    if (fStart !== -1) {
      const fOpen = shadingDict.indexOf("<<", fStart + 9);
      if (fOpen !== -1) funcDictText = extractDict(shadingDict, fOpen);
    }
  }
  const fn = funcDictText ? parseFunction(funcObjNum != null ? funcObjNum : funcDictText, objCache) : null;
  if (!fn) return null;
  const xm = (x0 + x1) / 2;
  const ym = (y0 + y1) / 2;
  const colorVar = (a, b) => {
    if (!a || !b) return 0;
    let mx = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) mx = Math.max(mx, Math.abs((a[i] ?? 0) - (b[i] ?? 0)));
    return mx;
  };
  const alongX = colorVar(evaluateFunction(fn, [x0, ym]), evaluateFunction(fn, [x1, ym])) >= colorVar(evaluateFunction(fn, [xm, y0]), evaluateFunction(fn, [xm, y1]));
  const nStops = 16;
  const stops = [];
  for (let i = 0; i < nStops; i++) {
    const t = i / (nStops - 1);
    const px = alongX ? x0 + (x1 - x0) * t : xm;
    const py = alongX ? ym : y0 + (y1 - y0) * t;
    stops.push({ offset: t, color: shadingValuesToColor(evaluateFunction(fn, [px, py]) || [], colorInfo) });
  }
  const [cx0, cy0] = mapPt(alongX ? x0 : xm, alongX ? ym : y0);
  const [cx1, cy1] = mapPt(alongX ? x1 : xm, alongX ? ym : y1);
  return {
    type: 2,
    coords: [cx0, cy0, cx1, cy1],
    stops,
    extend: [true, true]
  };
}
function coonsInteriorPt(corner, adj1, adj2, far1, far2, diag1, diag2, opp) {
  return [
    (-4 * corner[0] + 6 * (adj1[0] + adj2[0]) - 2 * (far1[0] + far2[0]) + 3 * (diag1[0] + diag2[0]) - opp[0]) / 9,
    (-4 * corner[1] + 6 * (adj1[1] + adj2[1]) - 2 * (far1[1] + far2[1]) + 3 * (diag1[1] + diag2[1]) - opp[1]) / 9
  ];
}
function parseMeshShading(shObjText, shObjNum, shadingType, objCache) {
  const bpc = resolveIntValue(shObjText, "BitsPerComponent", objCache);
  const bpco = resolveIntValue(shObjText, "BitsPerCoordinate", objCache);
  const bpf = resolveIntValue(shObjText, "BitsPerFlag", objCache);
  const decodeStr = resolveArrayValue(shObjText, "Decode", objCache);
  if (!bpc || !bpco || !bpf || !decodeStr) return null;
  const decode = decodeStr.split(/\s+/).map(Number);
  const nComps = (decode.length - 4) / 2;
  const streamBytes = objCache.getStreamBytes(shObjNum);
  if (!streamBytes || streamBytes.length === 0) return null;
  const colorEval = buildMeshColorEvaluator(shObjText, objCache);
  let bitPos = 0;
  const totalBits = streamBytes.length * 8;
  function readBits(n) {
    let val = 0;
    let rem = n;
    while (rem > 0) {
      const byteIdx = bitPos >>> 3;
      const bitOff = bitPos & 7;
      const avail = 8 - bitOff;
      const take = Math.min(avail, rem);
      const shift = avail - take;
      val = val * (1 << take) + (streamBytes[byteIdx] >>> shift & (1 << take) - 1);
      bitPos += take;
      rem -= take;
    }
    return val;
  }
  const coordMax = 2 ** bpco - 1;
  const compMax = 2 ** bpc - 1;
  function readCoord() {
    const rx = readBits(bpco);
    const ry = readBits(bpco);
    return [
      decode[0] + rx * (decode[1] - decode[0]) / coordMax,
      decode[2] + ry * (decode[3] - decode[2]) / coordMax
    ];
  }
  function readColor() {
    const comps = [];
    for (let i = 0; i < nComps; i++) {
      comps.push(decode[4 + i * 2] + readBits(bpc) * (decode[4 + i * 2 + 1] - decode[4 + i * 2]) / compMax);
    }
    return colorEval(comps);
  }
  function mapStreamPoints12(p) {
    return [
      [p[7], p[8], p[9], p[0]],
      // i=1: p10, p11, p12, p13
      [p[6], p[11], p[10], p[1]],
      // i=2: p20, p21, p22, p23
      [p[5], p[4], p[3], p[2]]
      // i=3: p30, p31, p32, p33
    ];
  }
  const bitsNewT7 = bpf + 32 * bpco + 4 * nComps * bpc;
  const bitsContT7 = bpf + 24 * bpco + 2 * nComps * bpc;
  const bitsNewT6 = bpf + 24 * bpco + 4 * nComps * bpc;
  const bitsContT6 = bpf + 16 * bpco + 2 * nComps * bpc;
  const patches = [];
  let prev = null;
  while (true) {
    const minBits = prev ? shadingType === 7 ? bitsContT7 : bitsContT6 : shadingType === 7 ? bitsNewT7 : bitsNewT6;
    if (bitPos + minBits > totalBits) break;
    const flag = readBits(bpf) & 3;
    if (!prev && flag !== 0) break;
    let points;
    let colors;
    if (shadingType === 7) {
      if (flag === 0) {
        const p = [];
        for (let k = 0; k < 16; k++) p.push(readCoord());
        const c = [readColor(), readColor(), readColor(), readColor()];
        const rows = mapStreamPoints12(p.slice(4));
        points = [[p[0], p[1], p[2], p[3]], rows[0], rows[1], rows[2]];
        colors = [c[0], c[1], c[2], c[3]];
      } else {
        let ip;
        let ic00;
        let ic03;
        if (flag === 1) {
          ip = [prev.points[0][3], prev.points[1][3], prev.points[2][3], prev.points[3][3]];
          ic00 = prev.colors[1];
          ic03 = prev.colors[2];
        } else if (flag === 2) {
          ip = [prev.points[3][3], prev.points[3][2], prev.points[3][1], prev.points[3][0]];
          ic00 = prev.colors[2];
          ic03 = prev.colors[3];
        } else {
          ip = [prev.points[3][0], prev.points[2][0], prev.points[1][0], prev.points[0][0]];
          ic00 = prev.colors[3];
          ic03 = prev.colors[0];
        }
        const p = [];
        for (let k = 0; k < 12; k++) p.push(readCoord());
        const nc33 = readColor();
        const nc30 = readColor();
        const rows = mapStreamPoints12(p);
        points = [[ip[0], ip[1], ip[2], ip[3]], rows[0], rows[1], rows[2]];
        colors = [ic00, ic03, nc33, nc30];
      }
    } else {
      let bp00;
      let bp10;
      let bp20;
      let bp30;
      let bp31;
      let bp32;
      let bp33;
      let bp23;
      let bp13;
      let bp03;
      let bp02;
      let bp01;
      let cc00;
      let cc03;
      let cc33;
      let cc30;
      if (flag === 0) {
        const p = [];
        for (let k = 0; k < 12; k++) p.push(readCoord());
        const c = [readColor(), readColor(), readColor(), readColor()];
        bp00 = p[0];
        bp10 = p[1];
        bp20 = p[2];
        bp30 = p[3];
        bp31 = p[4];
        bp32 = p[5];
        bp33 = p[6];
        bp23 = p[7];
        bp13 = p[8];
        bp03 = p[9];
        bp02 = p[10];
        bp01 = p[11];
        cc00 = c[0];
        cc30 = c[1];
        cc33 = c[2];
        cc03 = c[3];
      } else {
        if (flag === 1) {
          bp00 = prev.points[3][0];
          bp10 = prev.points[3][1];
          bp20 = prev.points[3][2];
          bp30 = prev.points[3][3];
          cc00 = prev.colors[3];
          cc30 = prev.colors[2];
        } else if (flag === 2) {
          bp00 = prev.points[3][3];
          bp10 = prev.points[2][3];
          bp20 = prev.points[1][3];
          bp30 = prev.points[0][3];
          cc00 = prev.colors[2];
          cc30 = prev.colors[1];
        } else {
          bp00 = prev.points[0][3];
          bp10 = prev.points[0][2];
          bp20 = prev.points[0][1];
          bp30 = prev.points[0][0];
          cc00 = prev.colors[1];
          cc30 = prev.colors[0];
        }
        const p = [];
        for (let k = 0; k < 8; k++) p.push(readCoord());
        cc33 = readColor();
        cc03 = readColor();
        bp31 = p[0];
        bp32 = p[1];
        bp33 = p[2];
        bp23 = p[3];
        bp13 = p[4];
        bp03 = p[5];
        bp02 = p[6];
        bp01 = p[7];
      }
      const bp11 = coonsInteriorPt(bp00, bp01, bp10, bp03, bp30, bp13, bp31, bp33);
      const bp12 = coonsInteriorPt(bp03, bp02, bp13, bp00, bp33, bp10, bp32, bp30);
      const bp21 = coonsInteriorPt(bp30, bp31, bp20, bp33, bp00, bp23, bp01, bp03);
      const bp22 = coonsInteriorPt(bp33, bp32, bp23, bp30, bp03, bp20, bp02, bp00);
      points = [
        [bp00, bp01, bp02, bp03],
        [bp10, bp11, bp12, bp13],
        [bp20, bp21, bp22, bp23],
        [bp30, bp31, bp32, bp33]
      ];
      colors = [cc00, cc03, cc33, cc30];
    }
    const patch = { points, colors };
    patches.push(patch);
    prev = patch;
  }
  return patches.length > 0 ? { type: "mesh", patches } : null;
}
function renderMeshPatches(ctx, patches) {
  const xform = ctx.getTransform();
  const ta = xform.a;
  const tb = xform.b;
  const tc = xform.c;
  const td = xform.d;
  const te = xform.e;
  const tf = xform.f;
  let minPx = Infinity;
  let minPy = Infinity;
  let maxPx = -Infinity;
  let maxPy = -Infinity;
  for (const patch of patches) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const sx = patch.points[i][j][0];
        const sy = patch.points[i][j][1];
        const px = ta * sx + tc * sy + te;
        const py = tb * sx + td * sy + tf;
        if (px < minPx) minPx = px;
        if (py < minPy) minPy = py;
        if (px > maxPx) maxPx = px;
        if (py > maxPy) maxPy = py;
      }
    }
  }
  const ox = Math.floor(minPx);
  const oy = Math.floor(minPy);
  const w = Math.ceil(maxPx) - ox + 1;
  const h = Math.ceil(maxPy) - oy + 1;
  if (w <= 0 || h <= 0 || w > 8e3 || h > 8e3) return;
  const tmpCanvas = ca.makeCanvas(w, h);
  const tmpCtx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    tmpCanvas.getContext("2d", { willReadFrequently: true })
  );
  const imgData = tmpCtx.createImageData(w, h);
  const pix = imgData.data;
  const MAX_N = 32;
  const outScale = Math.sqrt(Math.abs(ta * td - tb * tc)) || 1;
  const adaptTess = outScale < 1.5;
  const basisCache = /* @__PURE__ */ new Map();
  const basisFor = (n) => {
    let b = basisCache.get(n);
    if (b) return b;
    b = new Array(n + 1);
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const t1 = 1 - t;
      b[k] = [t1 * t1 * t1, 3 * t * t1 * t1, 3 * t * t * t1, t * t * t];
    }
    basisCache.set(n, b);
    return b;
  };
  for (const patch of patches) {
    const { points: pts, colors: [c00, c03, c33, c30] } = patch;
    let N = MAX_N;
    if (adaptTess) {
      let pminx = Infinity;
      let pminy = Infinity;
      let pmaxx = -Infinity;
      let pmaxy = -Infinity;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const sx = pts[i][j][0];
          const sy = pts[i][j][1];
          const px = ta * sx + tc * sy + te;
          const py = tb * sx + td * sy + tf;
          if (px < pminx) pminx = px;
          if (py < pminy) pminy = py;
          if (px > pmaxx) pmaxx = px;
          if (py > pmaxy) pmaxy = py;
        }
      }
      N = Math.min(MAX_N, Math.max(2, Math.ceil(2 * Math.max(pmaxx - pminx, pmaxy - pminy))));
    }
    const basis = basisFor(N);
    const gx = new Float64Array((N + 1) * (N + 1));
    const gy = new Float64Array((N + 1) * (N + 1));
    for (let jv = 0; jv <= N; jv++) {
      const bv = basis[jv];
      for (let iu = 0; iu <= N; iu++) {
        const bu = basis[iu];
        let sx = 0;
        let sy = 0;
        for (let i = 0; i < 4; i++) {
          const wi = bu[i];
          for (let j = 0; j < 4; j++) {
            const ww = wi * bv[j];
            sx += pts[i][j][0] * ww;
            sy += pts[i][j][1] * ww;
          }
        }
        const idx = jv * (N + 1) + iu;
        gx[idx] = ta * sx + tc * sy + te - ox;
        gy[idx] = tb * sx + td * sy + tf - oy;
      }
    }
    for (let jv = 0; jv < N; jv++) {
      for (let iu = 0; iu < N; iu++) {
        const i00 = jv * (N + 1) + iu;
        const i10 = i00 + 1;
        const i01 = i00 + (N + 1);
        const i11 = i01 + 1;
        const x0 = Math.max(0, Math.floor(Math.min(gx[i00], gx[i10], gx[i01], gx[i11])));
        const y0 = Math.max(0, Math.floor(Math.min(gy[i00], gy[i10], gy[i01], gy[i11])));
        const x1 = Math.min(w - 1, Math.ceil(Math.max(gx[i00], gx[i10], gx[i01], gx[i11])));
        const y1 = Math.min(h - 1, Math.ceil(Math.max(gy[i00], gy[i10], gy[i01], gy[i11])));
        const u = (iu + 0.5) / N;
        const v = (jv + 0.5) / N;
        const u1 = 1 - u;
        const v1 = 1 - v;
        const cr = u1 * v1 * c00[0] + u * v1 * c30[0] + u1 * v * c03[0] + u * v * c33[0];
        const cg = u1 * v1 * c00[1] + u * v1 * c30[1] + u1 * v * c03[1] + u * v * c33[1];
        const cb = u1 * v1 * c00[2] + u * v1 * c30[2] + u1 * v * c03[2] + u * v * c33[2];
        const rr = Math.round(cr);
        const gg = Math.round(cg);
        const bb = Math.round(cb);
        for (let py = y0; py <= y1; py++) {
          let off = (py * w + x0) * 4;
          for (let px = x0; px <= x1; px++) {
            pix[off] = rr;
            pix[off + 1] = gg;
            pix[off + 2] = bb;
            pix[off + 3] = 255;
            off += 4;
          }
        }
      }
    }
  }
  tmpCtx.putImageData(imgData, 0, 0);
  ctx.save();
  ctx.resetTransform();
  ctx.drawImage(tmpCanvas, ox, oy);
  ctx.restore();
  ca.closeDrawable(tmpCanvas);
}
function renderGouraudTriangles(ctx, triangles, clipBounds, canvasDims) {
  const xform = ctx.getTransform();
  const ta = xform.a;
  const tb = xform.b;
  const tc = xform.c;
  const td = xform.d;
  const te = xform.e;
  const tf = xform.f;
  let minPx = Infinity;
  let minPy = Infinity;
  let maxPx = -Infinity;
  let maxPy = -Infinity;
  for (const tri of triangles) {
    for (const v of tri.vertices) {
      const px = ta * v[0] + tc * v[1] + te;
      const py = tb * v[0] + td * v[1] + tf;
      if (px < minPx) minPx = px;
      if (py < minPy) minPy = py;
      if (px > maxPx) maxPx = px;
      if (py > maxPy) maxPy = py;
    }
  }
  const bxMin = clipBounds ? clipBounds[0] : 0;
  const byMin = clipBounds ? clipBounds[1] : 0;
  const bxMax = clipBounds ? clipBounds[2] : canvasDims ? canvasDims[0] : 8e3;
  const byMax = clipBounds ? clipBounds[3] : canvasDims ? canvasDims[1] : 8e3;
  const ox = Math.max(bxMin, Math.floor(minPx));
  const oy = Math.max(byMin, Math.floor(minPy));
  const w = Math.min(bxMax, Math.ceil(maxPx)) - ox + 1;
  const h = Math.min(byMax, Math.ceil(maxPy)) - oy + 1;
  if (w <= 0 || h <= 0 || w > 8e3 || h > 8e3) return;
  const tmpCanvas = ca.makeCanvas(w, h);
  const tmpCtx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    tmpCanvas.getContext("2d", { willReadFrequently: true })
  );
  const imgData = tmpCtx.createImageData(w, h);
  const pix = imgData.data;
  for (const tri of triangles) {
    const [v0, v1, v2] = tri.vertices;
    const [c0, c1, c2] = tri.colors;
    const x0 = ta * v0[0] + tc * v0[1] + te - ox;
    const y0 = tb * v0[0] + td * v0[1] + tf - oy;
    const x1 = ta * v1[0] + tc * v1[1] + te - ox;
    const y1 = tb * v1[0] + td * v1[1] + tf - oy;
    const x2 = ta * v2[0] + tc * v2[1] + te - ox;
    const y2 = tb * v2[0] + td * v2[1] + tf - oy;
    const bx0 = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const by0 = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const bx1 = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
    const by1 = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
    const d00 = x1 - x0;
    const d01 = x2 - x0;
    const d10 = y1 - y0;
    const d11 = y2 - y0;
    const denom = d00 * d11 - d01 * d10;
    if (Math.abs(denom) < 1e-10) continue;
    const invDenom = 1 / denom;
    for (let py = by0; py <= by1; py++) {
      for (let px = bx0; px <= bx1; px++) {
        const dx = px + 0.5 - x0;
        const dy = py + 0.5 - y0;
        const u = (dx * d11 - d01 * dy) * invDenom;
        const v = (d00 * dy - dx * d10) * invDenom;
        if (u < -1e-3 || v < -1e-3 || u + v > 1.002) continue;
        const w0 = 1 - u - v;
        const idx = (py * w + px) * 4;
        pix[idx] = Math.round(w0 * c0[0] + u * c1[0] + v * c2[0]);
        pix[idx + 1] = Math.round(w0 * c0[1] + u * c1[1] + v * c2[1]);
        pix[idx + 2] = Math.round(w0 * c0[2] + u * c1[2] + v * c2[2]);
        pix[idx + 3] = 255;
      }
    }
  }
  tmpCtx.putImageData(imgData, 0, 0);
  ctx.save();
  ctx.resetTransform();
  ctx.drawImage(tmpCanvas, ox, oy);
  ctx.restore();
  ca.closeDrawable(tmpCanvas);
}
function buildMeshColorEvaluator(shObjText, objCache) {
  let tintFn = null;
  let tintFnArray = null;
  const funcArrMatch = /\/Function\s*\[\s*((?:\d+\s+\d+\s+R\s*)+)\]/.exec(shObjText);
  if (funcArrMatch) {
    const refs = [...funcArrMatch[1].matchAll(/(\d+)\s+\d+\s+R/g)].map((m) => Number(m[1]));
    if (refs.length === 1) tintFn = parseFunction(refs[0], objCache);
    else tintFnArray = refs.map((r) => parseFunction(r, objCache));
  } else {
    const funcRefMatch = /\/Function\s+(\d+)\s+\d+\s+R/.exec(shObjText);
    if (funcRefMatch) {
      tintFn = parseFunction(Number(funcRefMatch[1]), objCache);
    } else {
      const funcIdx = shObjText.indexOf("/Function");
      if (funcIdx !== -1) {
        const funcDictOpen = shObjText.indexOf("<<", funcIdx + 9);
        if (funcDictOpen !== -1) {
          const funcDictText = extractDict(shObjText, funcDictOpen);
          if (funcDictText && /\/FunctionType/.test(funcDictText)) tintFn = parseFunction(funcDictText, objCache);
        }
      }
    }
  }
  let csText = null;
  const csArrStart = /\/ColorSpace\s*\[/.exec(shObjText);
  if (csArrStart) {
    const bracketIdx = csArrStart.index + csArrStart[0].length - 1;
    let depth = 1;
    let endIdx = bracketIdx + 1;
    while (endIdx < shObjText.length && depth > 0) {
      const ch = shObjText[endIdx];
      if (ch === "[") depth++;
      else if (ch === "]") depth--;
      if (depth > 0) endIdx++;
    }
    csText = shObjText.substring(bracketIdx, endIdx + 1);
  } else {
    const csRefMatch = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(shObjText);
    if (csRefMatch) csText = objCache.getObjectText(Number(csRefMatch[1]));
    else {
      const csNameMatch = /\/ColorSpace\s*\/(\w+)/.exec(shObjText);
      if (csNameMatch) csText = `/${csNameMatch[1]}`;
    }
  }
  const grayConvert = (c) => {
    const v = Math.max(0, Math.min(255, Math.round((c[0] || 0) * 255)));
    return [v, v, v];
  };
  const rgbConvert = (c) => [
    Math.max(0, Math.min(255, Math.round((c[0] || 0) * 255))),
    Math.max(0, Math.min(255, Math.round((c[1] || 0) * 255))),
    Math.max(0, Math.min(255, Math.round((c[2] || 0) * 255)))
  ];
  let csConvert;
  if (csText && /\/Separation|\/DeviceN/.test(csText)) {
    const parsed = parseTintColorSpace(csText, objCache);
    csConvert = (c) => tintComponentsToRGB(parsed, c) || [128, 128, 128];
  } else if (csText && /\/DeviceCMYK/.test(csText)) {
    csConvert = (c) => cmykToRgb(c[0] || 0, c[1] || 0, c[2] || 0, c[3] || 0);
  } else if (csText && /\/DeviceGray|\/CalGray/.test(csText)) {
    csConvert = grayConvert;
  } else if (csText && /\/ICCBased/.test(csText)) {
    const iccRefMatch = /(\d+)\s+\d+\s+R/.exec(csText);
    const iccObjText = iccRefMatch ? objCache.getObjectText(Number(iccRefMatch[1])) : null;
    const nComp = iccObjText ? resolveIntValue(iccObjText, "N", objCache, 3) : 3;
    if (nComp === 1) csConvert = grayConvert;
    else if (nComp === 4) csConvert = (c) => cmykToRgb(c[0] || 0, c[1] || 0, c[2] || 0, c[3] || 0);
    else csConvert = rgbConvert;
  } else {
    csConvert = rgbConvert;
  }
  if (tintFnArray) {
    return (comps) => csConvert(tintFnArray.map((fn) => {
      if (!fn) return 0;
      const o = evaluateFunction(fn, comps);
      return o ? o[0] : 0;
    }));
  }
  if (tintFn) {
    return (comps) => csConvert(evaluateFunction(tintFn, comps) || comps);
  }
  return (comps) => csConvert(comps);
}
function parseType4Shading(shObjText, shObjNum, objCache) {
  const bpc = resolveIntValue(shObjText, "BitsPerComponent", objCache);
  const bpco = resolveIntValue(shObjText, "BitsPerCoordinate", objCache);
  const bpf = resolveIntValue(shObjText, "BitsPerFlag", objCache);
  const decodeStr = resolveArrayValue(shObjText, "Decode", objCache);
  if (!bpc || !bpco || !bpf || !decodeStr) return null;
  const decode = decodeStr.split(/\s+/).map(Number);
  const nComps = (decode.length - 4) / 2;
  const streamBytes = objCache.getStreamBytes(shObjNum);
  if (!streamBytes || streamBytes.length === 0) return null;
  const colorEval = buildMeshColorEvaluator(shObjText, objCache);
  let bitPos = 0;
  const totalBits = streamBytes.length * 8;
  function readBits(n) {
    let val = 0;
    let rem = n;
    while (rem > 0) {
      const byteIdx = bitPos >>> 3;
      const bitOff = bitPos & 7;
      const avail = 8 - bitOff;
      const take = Math.min(avail, rem);
      const shift = avail - take;
      val = val * (1 << take) + (streamBytes[byteIdx] >>> shift & (1 << take) - 1);
      bitPos += take;
      rem -= take;
    }
    return val;
  }
  const coordMax = 2 ** bpco - 1;
  const compMax = 2 ** bpc - 1;
  function readVertex() {
    const rx = readBits(bpco);
    const ry = readBits(bpco);
    const x = decode[0] + rx * (decode[1] - decode[0]) / coordMax;
    const y = decode[2] + ry * (decode[3] - decode[2]) / coordMax;
    const comps = [];
    for (let i = 0; i < nComps; i++) {
      comps.push(decode[4 + i * 2] + readBits(bpc) * (decode[4 + i * 2 + 1] - decode[4 + i * 2]) / compMax);
    }
    return { coord: [x, y], color: colorEval(comps) };
  }
  const triangles = [];
  let prev = null;
  while (bitPos + bpf <= totalBits) {
    const flag = readBits(bpf) & 3;
    if (flag === 0) {
      const vertexBits = 2 * bpco + nComps * bpc;
      if (bitPos + 3 * vertexBits + 2 * bpf > totalBits) break;
      const v0 = readVertex();
      readBits(bpf);
      const v1 = readVertex();
      readBits(bpf);
      const v2 = readVertex();
      const tri = { vertices: [v0.coord, v1.coord, v2.coord], colors: [v0.color, v1.color, v2.color] };
      triangles.push(tri);
      prev = tri;
    } else if (flag === 1 && prev) {
      if (bitPos + 2 * bpco + nComps * bpc > totalBits) break;
      const vNew = readVertex();
      const tri = {
        vertices: [prev.vertices[1], prev.vertices[2], vNew.coord],
        colors: [prev.colors[1], prev.colors[2], vNew.color]
      };
      triangles.push(tri);
      prev = tri;
    } else if (flag === 2 && prev) {
      if (bitPos + 2 * bpco + nComps * bpc > totalBits) break;
      const vNew = readVertex();
      const tri = {
        vertices: [prev.vertices[0], prev.vertices[2], vNew.coord],
        colors: [prev.colors[0], prev.colors[2], vNew.color]
      };
      triangles.push(tri);
      prev = tri;
    } else {
      break;
    }
  }
  if (triangles.length === 0) return null;
  return { type: "gouraud", triangles };
}
function parseLatticeShading(shObjText, shObjNum, objCache) {
  const bpc = resolveIntValue(shObjText, "BitsPerComponent", objCache);
  const bpco = resolveIntValue(shObjText, "BitsPerCoordinate", objCache);
  const vpr = resolveIntValue(shObjText, "VerticesPerRow", objCache);
  const decodeStr = resolveArrayValue(shObjText, "Decode", objCache);
  if (!bpc || !bpco || !vpr || vpr < 2 || !decodeStr) return null;
  const decode = decodeStr.split(/\s+/).map(Number);
  const nComps = (decode.length - 4) / 2;
  const streamBytes = objCache.getStreamBytes(shObjNum);
  if (!streamBytes || streamBytes.length === 0) return null;
  const colorEval = buildMeshColorEvaluator(shObjText, objCache);
  let bitPos = 0;
  const totalBits = streamBytes.length * 8;
  function readBits(n) {
    let val = 0;
    let rem = n;
    while (rem > 0) {
      const byteIdx = bitPos >>> 3;
      const bitOff = bitPos & 7;
      const avail = 8 - bitOff;
      const take = Math.min(avail, rem);
      const shift = avail - take;
      val = val * (1 << take) + (streamBytes[byteIdx] >>> shift & (1 << take) - 1);
      bitPos += take;
      rem -= take;
    }
    return val;
  }
  const coordMax = 2 ** bpco - 1;
  const compMax = 2 ** bpc - 1;
  const bitsPerVertex = bpco * 2 + bpc * nComps;
  const vertices = [];
  while (bitPos + bitsPerVertex <= totalBits) {
    const rx = readBits(bpco);
    const ry = readBits(bpco);
    const x = decode[0] + rx * (decode[1] - decode[0]) / coordMax;
    const y = decode[2] + ry * (decode[3] - decode[2]) / coordMax;
    const comps = [];
    for (let i = 0; i < nComps; i++) {
      comps.push(decode[4 + i * 2] + readBits(bpc) * (decode[4 + i * 2 + 1] - decode[4 + i * 2]) / compMax);
    }
    vertices.push({ x, y, color: colorEval(comps) });
  }
  const nRows = Math.floor(vertices.length / vpr);
  if (nRows < 2) return null;
  const patches = [];
  for (let r = 0; r < nRows - 1; r++) {
    for (let c = 0; c < vpr - 1; c++) {
      const v00 = vertices[r * vpr + c];
      const v01 = vertices[r * vpr + (c + 1)];
      const v10 = vertices[(r + 1) * vpr + c];
      const v11 = vertices[(r + 1) * vpr + (c + 1)];
      const points = [];
      for (let i = 0; i < 4; i++) {
        const si = i / 3;
        const row = [];
        for (let j = 0; j < 4; j++) {
          const sj = j / 3;
          row.push([
            (1 - si) * ((1 - sj) * v00.x + sj * v01.x) + si * ((1 - sj) * v10.x + sj * v11.x),
            (1 - si) * ((1 - sj) * v00.y + sj * v01.y) + si * ((1 - sj) * v10.y + sj * v11.y)
          ]);
        }
        points.push(row);
      }
      patches.push({
        points,
        colors: [v00.color, v01.color, v11.color, v10.color]
      });
    }
  }
  return patches.length > 0 ? { type: "mesh", patches } : null;
}
function parseShadings(pageObjText, objCache) {
  const shadings = /* @__PURE__ */ new Map();
  let resourcesText = null;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(pageObjText);
  if (resRefMatch) {
    resourcesText = objCache.getObjectText(Number(resRefMatch[1])) || null;
  } else {
    const resIdx = pageObjText.indexOf("/Resources");
    if (resIdx !== -1) {
      const dictStart = pageObjText.indexOf("<<", resIdx);
      if (dictStart !== -1) resourcesText = extractDict(pageObjText, dictStart);
    }
  }
  if (!resourcesText) return shadings;
  const shStart = findTopLevelKey(resourcesText, "/Shading");
  if (shStart === -1) return shadings;
  let shDictText;
  const afterSh = resourcesText.substring(shStart + 8).trim();
  if (afterSh.startsWith("<<")) {
    shDictText = extractDict(resourcesText, shStart + 8 + resourcesText.substring(shStart + 8).indexOf("<<"));
  } else {
    const shRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterSh);
    if (shRefMatch) {
      const shObj = objCache.getObjectText(Number(shRefMatch[1]));
      if (shObj) shDictText = shObj;
    }
  }
  if (!shDictText) return shadings;
  const entries = [];
  {
    let depth = 0;
    let i = 0;
    const n = shDictText.length;
    while (i < n) {
      if (shDictText[i] === "<" && shDictText[i + 1] === "<") {
        depth++;
        i += 2;
      } else if (shDictText[i] === ">" && shDictText[i + 1] === ">") {
        depth--;
        i += 2;
      } else if (depth === 1 && shDictText[i] === "/") {
        const nameMatch = /^\/([^\s/<>[\]]+)/.exec(shDictText.substring(i));
        if (!nameMatch) {
          i++;
          continue;
        }
        let j = i + nameMatch[0].length;
        while (j < n && /\s/.test(shDictText[j])) j++;
        if (shDictText[j] === "<" && shDictText[j + 1] === "<") {
          const inlineDict = extractDict(shDictText, j);
          entries.push({ name: nameMatch[1], objNum: 0, inline: inlineDict });
          i = j + inlineDict.length;
        } else {
          const refMatch = /^(\d+)\s+\d+\s+R/.exec(shDictText.substring(j));
          if (refMatch) {
            entries.push({ name: nameMatch[1], objNum: Number(refMatch[1]), inline: null });
            i = j + refMatch[0].length;
          } else {
            i = j;
          }
        }
      } else {
        i++;
      }
    }
  }
  for (const entry of entries) {
    const shName = entry.name;
    const shObjNum = entry.objNum;
    const shObjText = entry.inline || (shObjNum ? objCache.getObjectText(shObjNum) : null);
    if (!shObjText) continue;
    const shadingType = resolveIntValue(shObjText, "ShadingType", objCache, 0);
    if (shadingType === 4) {
      const gouraudResult = parseType4Shading(shObjText, shObjNum, objCache);
      if (gouraudResult) shadings.set(shName, gouraudResult);
      continue;
    }
    if (shadingType === 5) {
      const meshResult = parseLatticeShading(shObjText, shObjNum, objCache);
      if (meshResult) shadings.set(shName, meshResult);
      continue;
    }
    if (shadingType === 6 || shadingType === 7) {
      const meshResult = parseMeshShading(shObjText, shObjNum, shadingType, objCache);
      if (meshResult) shadings.set(shName, meshResult);
      continue;
    }
    if (shadingType !== 1 && shadingType !== 2 && shadingType !== 3) continue;
    let coords = null;
    if (shadingType !== 1) {
      const coordsStr = resolveArrayValue(shObjText, "Coords", objCache);
      if (!coordsStr) continue;
      coords = coordsStr.split(/\s+/).map(Number);
    }
    const extendStr = resolveArrayValue(shObjText, "Extend", objCache);
    const extendParts = extendStr ? extendStr.split(/\s+/) : [];
    const extend = [extendParts[0] === "true", extendParts[1] === "true"];
    const bboxStr = resolveArrayValue(shObjText, "BBox", objCache);
    const bbox = bboxStr ? bboxStr.split(/\s+/).map(Number) : null;
    let csText = null;
    const csArrStart = /\/ColorSpace\s*\[/.exec(shObjText);
    if (csArrStart) {
      const bracketIdx = csArrStart.index + csArrStart[0].length - 1;
      let depth = 1;
      let endIdx = bracketIdx + 1;
      while (endIdx < shObjText.length && depth > 0) {
        const ch = shObjText[endIdx];
        if (ch === "[") depth++;
        else if (ch === "]") depth--;
        if (depth > 0) endIdx++;
      }
      csText = shObjText.substring(bracketIdx, endIdx + 1);
    } else {
      const csRefMatch = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(shObjText);
      if (csRefMatch) {
        csText = objCache.getObjectText(Number(csRefMatch[1]));
      } else {
        const csNameMatch = /\/ColorSpace\s*\/(\w+)/.exec(shObjText);
        if (csNameMatch) csText = `/${csNameMatch[1]}`;
      }
    }
    let shadingCS = "DeviceRGB";
    let isGray = false;
    let sepTintSamples = null;
    let deviceNTintCS = null;
    let isSeparationShading = false;
    if (csText) {
      if (/\/Separation|\/DeviceN/.test(csText)) {
        isSeparationShading = true;
        const dnNamesMatch = /\/DeviceN\s*\[\s*((?:\/[^/[\]<>(){}\s]+\s*)+)\]/.exec(csText);
        const dnNumColorants = dnNamesMatch ? (dnNamesMatch[1].match(/\/[^/[\]<>(){}\s]+/g) || []).length : 0;
        if (dnNumColorants >= 2) {
          deviceNTintCS = parseTintColorSpace(csText, objCache);
        } else {
          const tintInfo = parseSeparationTint(csText, objCache);
          if (tintInfo.tintSamples) sepTintSamples = tintInfo.tintSamples;
        }
      } else if (/\/DeviceCMYK/.test(csText)) {
        shadingCS = "DeviceCMYK";
      } else if (/\/DeviceGray|\/CalGray/.test(csText)) {
        shadingCS = "DeviceGray";
        isGray = true;
      } else if (/\/DeviceRGB|\/CalRGB/.test(csText)) {
        shadingCS = "DeviceRGB";
      } else if (/\/ICCBased/.test(csText)) {
        const iccRefMatch = /(\d+)\s+\d+\s+R/.exec(csText);
        if (iccRefMatch) {
          const iccObjText = objCache.getObjectText(Number(iccRefMatch[1]));
          const nComp = iccObjText ? resolveIntValue(iccObjText, "N", objCache, 3) : 3;
          if (nComp === 1) {
            shadingCS = "DeviceGray";
            isGray = true;
          } else if (nComp === 4) shadingCS = "DeviceCMYK";
          else shadingCS = "DeviceRGB";
        }
      }
    }
    if (shadingType === 1) {
      const axial = type1ShadingToAxial(shObjText, objCache, {
        deviceNTintCS,
        sepTintSamples,
        isCMYK: shadingCS === "DeviceCMYK",
        isGray
      });
      if (axial) {
        if (bbox) axial.bbox = bbox;
        if (isSeparationShading) axial.multiply = true;
        shadings.set(shName, axial);
      }
      continue;
    }
    const funcArrAllMatch = /\/Function\s*\[\s*((?:\d+\s+\d+\s+R\s*)+)\]/.exec(shObjText);
    const funcArrRefs = funcArrAllMatch ? [...funcArrAllMatch[1].matchAll(/(\d+)\s+\d+\s+R/g)].map((m) => Number(m[1])) : null;
    if (funcArrRefs && funcArrRefs.length > 1) {
      const fns = funcArrRefs.map((ref) => parseFunction(ref, objCache));
      const stops2 = functionToShadingStops(fns, {
        deviceNTintCS,
        sepTintSamples,
        isCMYK: shadingCS === "DeviceCMYK",
        isGray
      });
      shadings.set(shName, {
        type: shadingType,
        coords,
        stops: stops2,
        extend,
        bbox,
        multiply: isSeparationShading
      });
      continue;
    }
    let funcObjNum;
    if (funcArrRefs && funcArrRefs.length === 1) {
      funcObjNum = funcArrRefs[0];
    } else {
      const funcSingleMatch = /\/Function\s+(\d+)\s+\d+\s+R/.exec(shObjText);
      if (funcSingleMatch) funcObjNum = Number(funcSingleMatch[1]);
    }
    if (funcObjNum == null) continue;
    const fn = parseFunction(funcObjNum, objCache);
    if (!fn) continue;
    const stops = functionToShadingStops(fn, {
      deviceNTintCS,
      sepTintSamples,
      isCMYK: shadingCS === "DeviceCMYK",
      isGray
    });
    shadings.set(shName, {
      type: shadingType,
      coords,
      stops,
      extend,
      bbox,
      multiply: isSeparationShading
    });
  }
  return shadings;
}
function parsePatterns(pageObjText, objCache) {
  const patterns = /* @__PURE__ */ new Map();
  let resourcesText = pageObjText;
  const resRefMatch = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(pageObjText);
  if (resRefMatch) {
    const resObj = objCache.getObjectText(Number(resRefMatch[1]));
    if (resObj) resourcesText = resObj;
  }
  let patDictText;
  let searchFrom = 0;
  while (!patDictText) {
    const patStart = resourcesText.indexOf("/Pattern", searchFrom);
    if (patStart === -1) break;
    const afterPat = resourcesText.substring(patStart + 8).trim();
    if (afterPat.startsWith("<<")) {
      patDictText = extractDict(resourcesText, patStart + 8 + resourcesText.substring(patStart + 8).indexOf("<<"));
    } else {
      const patRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterPat);
      if (patRefMatch) {
        const patObj = objCache.getObjectText(Number(patRefMatch[1]));
        if (patObj) patDictText = patObj;
      }
    }
    searchFrom = patStart + 8;
  }
  if (!patDictText) return patterns;
  const patEntries = [];
  const patEntryRegex = /\/([^\s/<>[\]]+)\s+(\d+)\s+\d+\s+R/g;
  for (const match of patDictText.matchAll(patEntryRegex)) {
    const patObjText = objCache.getObjectText(Number(match[2]));
    if (patObjText) patEntries.push({ patName: match[1], patObjNum: Number(match[2]), patObjText });
  }
  const inlineRegex = /\/([^\s/<>[\]]+)\s*<</g;
  let inlineMatch;
  while ((inlineMatch = inlineRegex.exec(patDictText)) !== null) {
    const patName = inlineMatch[1];
    if (patEntries.some((e) => e.patName === patName)) continue;
    const dictStart = inlineMatch.index + inlineMatch[0].length - 2;
    const inlineDictText = extractDict(patDictText, dictStart);
    if (inlineDictText) patEntries.push({ patName, patObjNum: null, patObjText: inlineDictText });
  }
  for (const { patName, patObjNum, patObjText } of patEntries) {
    const patType = resolveIntValue(patObjText, "PatternType", objCache, 0);
    if (patType === 1) {
      const bboxStr2 = resolveArrayValue(patObjText, "BBox", objCache);
      if (!bboxStr2) continue;
      const bbox2 = bboxStr2.split(/\s+/).map(Number);
      const matrixStr2 = resolveArrayValue(patObjText, "Matrix", objCache);
      const matrix2 = matrixStr2 ? matrixStr2.split(/\s+/).map(Number) : [1, 0, 0, 1, 0, 0];
      const xStep = resolveNumValue(patObjText, "XStep", objCache) || bbox2[2] - bbox2[0];
      const yStep = resolveNumValue(patObjText, "YStep", objCache) || bbox2[3] - bbox2[1];
      const paintType = resolveIntValue(patObjText, "PaintType", objCache, 1);
      patterns.set(patName, {
        color: "rgb(128,128,128)",
        tiling: {
          objNum: patObjNum,
          bbox: bbox2,
          xStep,
          yStep,
          matrix: matrix2,
          paintType
        }
      });
      continue;
    }
    if (patType !== 2) continue;
    const shadingIdx = patObjText.indexOf("/Shading");
    if (shadingIdx === -1) continue;
    let shadingDict;
    const afterShading = patObjText.substring(shadingIdx + 8).trim();
    const shadingRefMatch = /^(\d+)\s+\d+\s+R/.exec(afterShading);
    if (shadingRefMatch) {
      shadingDict = objCache.getObjectText(Number(shadingRefMatch[1]));
    } else {
      const shadingDictStart = patObjText.indexOf("<<", shadingIdx + 8);
      if (shadingDictStart !== -1) shadingDict = extractDict(patObjText, shadingDictStart);
    }
    if (!shadingDict) continue;
    let patCsText = null;
    const patCsArrStart = /\/ColorSpace\s*\[/.exec(shadingDict);
    if (patCsArrStart) {
      const bracketIdx = patCsArrStart.index + patCsArrStart[0].length - 1;
      let depth = 1;
      let endIdx = bracketIdx + 1;
      while (endIdx < shadingDict.length && depth > 0) {
        const ch = shadingDict[endIdx];
        if (ch === "[") depth++;
        else if (ch === "]") depth--;
        if (depth > 0) endIdx++;
      }
      patCsText = shadingDict.substring(bracketIdx, endIdx + 1);
    } else {
      const csRefMatch = /\/ColorSpace\s+(\d+)\s+\d+\s+R/.exec(shadingDict);
      if (csRefMatch) {
        patCsText = objCache.getObjectText(Number(csRefMatch[1]));
      } else {
        const csNameMatch = /\/ColorSpace\s*\/(\w+)/.exec(shadingDict);
        if (csNameMatch) patCsText = `/${csNameMatch[1]}`;
      }
    }
    let patShadingCS = "DeviceRGB";
    let patSepTintSamples = null;
    let patDeviceNTintCS = null;
    if (patCsText) {
      if (/\/Separation|\/DeviceN/.test(patCsText)) {
        const dnNamesMatch = /\/DeviceN\s*\[\s*((?:\/[^/[\]<>(){}\s]+\s*)+)\]/.exec(patCsText);
        const dnNumColorants = dnNamesMatch ? (dnNamesMatch[1].match(/\/[^/[\]<>(){}\s]+/g) || []).length : 0;
        if (dnNumColorants >= 2) {
          patDeviceNTintCS = parseTintColorSpace(patCsText, objCache);
        } else {
          const tintInfo = parseSeparationTint(patCsText, objCache);
          if (tintInfo.tintSamples) patSepTintSamples = tintInfo.tintSamples;
        }
        patShadingCS = "Separation";
      } else if (/\/DeviceCMYK/.test(patCsText)) {
        patShadingCS = "DeviceCMYK";
      } else if (/\/DeviceGray|\/CalGray/.test(patCsText)) {
        patShadingCS = "DeviceGray";
      } else if (/\/DeviceRGB|\/CalRGB/.test(patCsText)) {
        patShadingCS = "DeviceRGB";
      } else if (/\/ICCBased/.test(patCsText)) {
        const iccRefMatch = /(\d+)\s+\d+\s+R/.exec(patCsText);
        if (iccRefMatch) {
          const iccObjText = objCache.getObjectText(Number(iccRefMatch[1]));
          const nComp = iccObjText ? resolveIntValue(iccObjText, "N", objCache, 3) : 3;
          patShadingCS = nComp === 1 ? "DeviceGray" : nComp === 4 ? "DeviceCMYK" : "DeviceRGB";
        }
      }
    }
    if (patShadingCS !== "DeviceRGB" && patShadingCS !== "DeviceGray" && patShadingCS !== "DeviceCMYK" && !patSepTintSamples && !patDeviceNTintCS) continue;
    const patIsGray = patShadingCS === "DeviceGray";
    const patIsCMYK = patShadingCS === "DeviceCMYK";
    const shadingType = resolveIntValue(shadingDict, "ShadingType", objCache, 0);
    if (shadingType === 4) {
      const shObjNum = shadingRefMatch ? Number(shadingRefMatch[1]) : null;
      if (shObjNum) {
        const gouraudResult = parseType4Shading(shadingDict, shObjNum, objCache);
        if (gouraudResult) {
          const matrixStr2 = resolveArrayValue(patObjText, "Matrix", objCache);
          const matrix2 = matrixStr2 ? matrixStr2.split(/\s+/).map(Number) : null;
          if (matrix2) gouraudResult.matrix = matrix2;
          patterns.set(patName, { color: "rgb(128,128,128)", shading: gouraudResult });
        }
      }
      continue;
    }
    if (shadingType === 5 || shadingType === 6 || shadingType === 7) {
      const shObjNum = shadingRefMatch ? Number(shadingRefMatch[1]) : null;
      let meshResult;
      if (shadingType === 5 && shObjNum) {
        meshResult = parseLatticeShading(shadingDict, shObjNum, objCache);
      } else if (shObjNum) {
        meshResult = parseMeshShading(shadingDict, shObjNum, shadingType, objCache);
      }
      if (meshResult) {
        const matrixStr2 = resolveArrayValue(patObjText, "Matrix", objCache);
        const matrix2 = matrixStr2 ? matrixStr2.split(/\s+/).map(Number) : null;
        if (matrix2) meshResult.matrix = matrix2;
        patterns.set(patName, { color: "rgb(128,128,128)", shading: meshResult });
      }
      continue;
    }
    if (shadingType === 1) {
      const axial = type1ShadingToAxial(shadingDict, objCache, {
        deviceNTintCS: patDeviceNTintCS,
        sepTintSamples: patSepTintSamples,
        isCMYK: patIsCMYK,
        isGray: patIsGray
      });
      if (axial) {
        const matrixStr2 = resolveArrayValue(patObjText, "Matrix", objCache);
        const matrix2 = matrixStr2 ? matrixStr2.split(/\s+/).map(Number) : null;
        if (matrix2) axial.matrix = matrix2;
        const color = axial.stops[Math.floor(axial.stops.length / 2)]?.color || "rgb(128,128,128)";
        patterns.set(patName, { color, shading: axial });
      }
      continue;
    }
    if (shadingType !== 2 && shadingType !== 3) continue;
    const coordsStr = resolveArrayValue(shadingDict, "Coords", objCache);
    if (!coordsStr) continue;
    const coords = coordsStr.split(/\s+/).map(Number);
    const extendStr = resolveArrayValue(shadingDict, "Extend", objCache);
    const extendParts = extendStr ? extendStr.split(/\s+/) : [];
    const extend = [extendParts[0] === "true", extendParts[1] === "true"];
    const bboxStr = resolveArrayValue(shadingDict, "BBox", objCache);
    const bbox = bboxStr ? bboxStr.split(/\s+/).map(Number) : null;
    const matrixStr = resolveArrayValue(patObjText, "Matrix", objCache);
    const matrix = matrixStr ? matrixStr.split(/\s+/).map(Number) : null;
    let funcDictText;
    let funcObjNum;
    const funcRefMatch = /\/Function\s+(\d+)\s+\d+\s+R/.exec(shadingDict);
    if (funcRefMatch) {
      funcObjNum = Number(funcRefMatch[1]);
      funcDictText = objCache.getObjectText(funcObjNum);
    } else {
      const funcDictStart = shadingDict.indexOf("/Function");
      if (funcDictStart !== -1) {
        const funcDictOpen = shadingDict.indexOf("<<", funcDictStart + 9);
        if (funcDictOpen !== -1) funcDictText = extractDict(shadingDict, funcDictOpen);
      }
    }
    const fn = funcDictText ? parseFunction(funcObjNum != null ? funcObjNum : funcDictText, objCache) : null;
    if (fn) {
      const stops = functionToShadingStops(fn, {
        deviceNTintCS: patDeviceNTintCS,
        sepTintSamples: patSepTintSamples,
        isCMYK: patIsCMYK,
        isGray: patIsGray
      });
      const shading = {
        type: shadingType,
        coords,
        stops,
        extend,
        ...bbox && { bbox },
        ...matrix && { matrix }
      };
      const color = stops[Math.floor(stops.length / 2)]?.color || "rgb(128,128,128)";
      patterns.set(patName, { color, shading });
    }
  }
  return patterns;
}
function tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale) {
  let tileW = Math.max(1, Math.round(bboxW * matScaleX * scale));
  let tileH = Math.max(1, Math.round(bboxH * matScaleY * scale));
  const maxDim = 4096;
  if (tileW > maxDim || tileH > maxDim) {
    const reduce = Math.min(maxDim / tileW, maxDim / tileH);
    tileW = Math.max(1, Math.round(tileW * reduce));
    tileH = Math.max(1, Math.round(tileH * reduce));
  }
  return { tileW, tileH };
}
async function renderTilingPatternTileForSmask(tp, objCache, scale) {
  const patObjText = objCache.getObjectText(tp.objNum);
  const patStreamBytes = objCache.getStreamBytes(tp.objNum);
  if (!patObjText || !patStreamBytes) return null;
  let patResText = patObjText;
  const patResRef = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(patObjText);
  if (patResRef) {
    const resObj = objCache.getObjectText(Number(patResRef[1]));
    if (resObj) patResText = resObj;
  }
  const { images: patImages, forms: patForms } = parsePageImages(patResText, objCache, { recurseForms: false });
  const patExtGStates = parseExtGStates(patObjText, objCache);
  const patPatterns = parsePatterns(patObjText, objCache);
  const patStream = bytesToLatin1(patStreamBytes);
  const rawPatDrawOps = parseDrawOps(
    patStream,
    /* @__PURE__ */ new Map(),
    patExtGStates,
    /* @__PURE__ */ new Map(),
    /* @__PURE__ */ new Map(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Set(),
    /* @__PURE__ */ new Map(),
    patPatterns
  );
  let patDrawOps;
  if (patForms.size > 0) {
    patDrawOps = [];
    for (const op of rawPatDrawOps) {
      if (op.type === "image" && patForms.has(op.name)) {
        const sub = await flattenDrawOps(
          [op],
          patImages,
          patForms,
          objCache,
          /* @__PURE__ */ new Map(),
          /* @__PURE__ */ new Map(),
          "",
          0,
          /* @__PURE__ */ new Set(),
          /* @__PURE__ */ new Set(),
          patExtGStates,
          /* @__PURE__ */ new Set(),
          /* @__PURE__ */ new Map(),
          0,
          /* @__PURE__ */ new Set(),
          /* @__PURE__ */ new Map(),
          "black",
          "rgb(0,0,0)",
          1,
          1,
          null,
          null
        );
        for (const sop of sub) patDrawOps.push(sop);
      } else {
        patDrawOps.push(op);
      }
    }
  } else {
    patDrawOps = rawPatDrawOps;
  }
  const bboxW = tp.bbox[2] - tp.bbox[0];
  const bboxH = tp.bbox[3] - tp.bbox[1];
  const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]) || 1;
  const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]) || 1;
  let tileW = Math.max(1, Math.round(bboxW * matScaleX * scale));
  let tileH = Math.max(1, Math.round(bboxH * matScaleY * scale));
  const maxDim = 4096;
  if (tileW > maxDim || tileH > maxDim) {
    const reduceFactor = Math.min(maxDim / tileW, maxDim / tileH);
    tileW = Math.max(1, Math.round(tileW * reduceFactor));
    tileH = Math.max(1, Math.round(tileH * reduceFactor));
  }
  const tileCanvas = ca.makeCanvas(tileW, tileH);
  const tileCtx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    tileCanvas.getContext("2d", { willReadFrequently: true })
  );
  const tileScaleX = tileW / bboxW;
  const tileScaleY = tileH / bboxH;
  for (const pop of patDrawOps) {
    if (pop.type === "image") {
      const imageInfo = patImages.get(pop.name);
      if (!imageInfo) continue;
      const bitmap = imageInfo.imageMask ? await imageMaskToBitmap(imageInfo, pop.fillColor || "black", objCache) : await imageInfoToBitmap(imageInfo, objCache);
      if (!bitmap) continue;
      tileCtx.save();
      tileCtx.setTransform(
        pop.ctm[0] * tileScaleX,
        -pop.ctm[1] * tileScaleY,
        pop.ctm[2] * tileScaleX,
        -pop.ctm[3] * tileScaleY,
        (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
        (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
      );
      tileCtx.transform(1, 0, 0, -1, 0, 1);
      tileCtx.drawImage(bitmap, 0, 0, 1, 1);
      tileCtx.restore();
      ca.closeDrawable(bitmap);
    } else if (pop.type === "path" && pop.fill) {
      tileCtx.save();
      if (pop.fillAlpha < 1) tileCtx.globalAlpha = pop.fillAlpha;
      tileCtx.setTransform(
        pop.ctm[0] * tileScaleX,
        -pop.ctm[1] * tileScaleY,
        pop.ctm[2] * tileScaleX,
        -pop.ctm[3] * tileScaleY,
        (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
        (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
      );
      tileCtx.beginPath();
      for (const cmd of pop.commands) {
        switch (cmd.type) {
          case "M":
            tileCtx.moveTo(cmd.x, cmd.y);
            break;
          case "L":
            tileCtx.lineTo(cmd.x, cmd.y);
            break;
          case "C":
            tileCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            break;
          case "Z":
            tileCtx.closePath();
            break;
        }
      }
      tileCtx.fillStyle = pop.fillColor || "black";
      tileCtx.fill(pop.evenOdd ? "evenodd" : "nonzero");
      tileCtx.restore();
    }
  }
  return tileCanvas;
}
async function decodeInlineImageBitmap(op, objCache, fallbackColorSpaces = /* @__PURE__ */ new Map()) {
  const { dictText, imageData } = op;
  const getVal = (abbrev, full) => {
    const re = new RegExp(`/${abbrev}(?![a-zA-Z])\\s*/?([^\\s/<>]+)`);
    const m = re.exec(dictText) || new RegExp(`/${full}(?![a-zA-Z])\\s*/?([^\\s/<>]+)`).exec(dictText);
    return m ? m[1] : null;
  };
  const getArr = (abbrev, full) => {
    const re = new RegExp(`/${abbrev}(?![a-zA-Z])\\s*\\[\\s*([^\\]]+)\\]`);
    const m = re.exec(dictText) || new RegExp(`/${full}(?![a-zA-Z])\\s*\\[\\s*([^\\]]+)\\]`).exec(dictText);
    return m ? m[1].trim().split(/\s+/).map(Number) : null;
  };
  const width = Number(getVal("W", "Width") || 0);
  const height = Number(getVal("H", "Height") || 0);
  if (!width || !height) return null;
  const bpc = Number(getVal("BPC", "BitsPerComponent") || 8);
  const isImageMask = getVal("IM", "ImageMask") === "true";
  const decode = getArr("D", "Decode");
  const filterMap = {
    CCF: "CCITTFaxDecode",
    DCT: "DCTDecode",
    Fl: "FlateDecode",
    LZW: "LZWDecode",
    RL: "RunLengthDecode",
    AHx: "ASCIIHexDecode",
    A85: "ASCII85Decode"
  };
  let filters;
  const filterArrMatch = /\/(?:F|Filter)\s*\[\s*([^\]]+)\]/.exec(dictText);
  if (filterArrMatch) {
    filters = (filterArrMatch[1].match(/\/[^\s/\]]+/g) || []).map((f) => {
      const name = f.replace(/^\//, "");
      return filterMap[name] || name;
    });
  } else {
    const filterRaw = getVal("F", "Filter") || "";
    const f = filterMap[filterRaw] || filterRaw;
    filters = f ? [f] : [];
  }
  const csRaw = getVal("CS", "ColorSpace") || "";
  const csMap = { G: "DeviceGray", RGB: "DeviceRGB", CMYK: "DeviceCMYK" };
  let colorSpace = csMap[csRaw] || csRaw;
  let resolvedCS = null;
  if (!["DeviceGray", "DeviceRGB", "DeviceCMYK"].includes(colorSpace)) {
    const csRegistry = op.colorSpaces || fallbackColorSpaces;
    const entry = csRegistry.get(csRaw);
    if (entry) {
      resolvedCS = entry;
      if (entry.type === "Indexed") {
        colorSpace = "Indexed";
      } else if (entry.type === "Separation" || entry.type === "DeviceN") {
        colorSpace = entry.type;
      } else if (entry.type === "DeviceRGB" || entry.type === "CalRGB") {
        colorSpace = "DeviceRGB";
      } else if (entry.type === "DeviceCMYK") {
        colorSpace = "DeviceCMYK";
      } else if (entry.type === "DeviceGray" || entry.type === "CalGray") {
        colorSpace = "DeviceGray";
      }
    }
    if (!resolvedCS) {
      const csKeyMatch = /\/(?:CS|ColorSpace)\s*\[/.exec(dictText);
      if (csKeyMatch) {
        const arrStart = dictText.indexOf("[", csKeyMatch.index);
        let depth = 0;
        let arrEnd = arrStart;
        for (let ci = arrStart; ci < dictText.length; ci++) {
          if (dictText[ci] === "[") depth++;
          else if (dictText[ci] === "]") {
            depth--;
            if (depth === 0) {
              arrEnd = ci + 1;
              break;
            }
          }
        }
        const csText = dictText.substring(arrStart, arrEnd).replace(/\/([A-Za-z][\w-]*)/g, " /$1 ").replace(/\/I\b/, "/Indexed").replace(/\/RGB\b/, "/DeviceRGB").replace(/\/G\b/, "/DeviceGray").replace(/\/CMYK\b/, "/DeviceCMYK");
        if (/\/Indexed\b/.test(csText)) {
          const idxResult = parseIndexedColorSpace(csText, objCache);
          if (idxResult) {
            colorSpace = "Indexed";
            resolvedCS = {
              type: "Indexed",
              indexedInfo: idxResult,
              tintSamples: null,
              nComponents: 1,
              deviceNGrid: null
            };
          }
        }
      }
    }
  }
  let data = new Uint8Array(imageData.length);
  for (let j = 0; j < imageData.length; j++) data[j] = imageData.charCodeAt(j);
  let imageCodec = null;
  for (const filter of filters) {
    if (filter === "DCTDecode" || filter === "JPXDecode") {
      imageCodec = filter;
      break;
    }
    if (filter === "ASCII85Decode") {
      const ascii = new TextDecoder("latin1").decode(data);
      const clean = ascii.replace(/\s/g, "");
      const endMarker = clean.indexOf("~>");
      const encoded = endMarker >= 0 ? clean.substring(0, endMarker) : clean;
      const output = [];
      let ai = 0;
      while (ai < encoded.length) {
        if (encoded[ai] === "z") {
          output.push(0, 0, 0, 0);
          ai++;
        } else {
          const groupLen = Math.min(5, encoded.length - ai);
          const group = [];
          for (let gj = 0; gj < groupLen; gj++) group.push(encoded.charCodeAt(ai + gj) - 33);
          while (group.length < 5) group.push(84);
          let val = 0;
          for (let gj = 0; gj < 5; gj++) val = val * 85 + group[gj];
          const numBytes = groupLen === 5 ? 4 : groupLen - 1;
          const divisors = [16777216, 65536, 256, 1];
          for (let gj = 0; gj < numBytes; gj++) output.push(Math.floor(val / divisors[gj]) % 256);
          ai += groupLen;
        }
      }
      data = new Uint8Array(output);
    } else if (filter === "ASCIIHexDecode") {
      const hex = new TextDecoder("latin1").decode(data).replace(/\s/g, "").replace(/>$/, "");
      const out = new Uint8Array(Math.floor(hex.length / 2));
      for (let hi = 0; hi < out.length; hi++) out[hi] = parseInt(hex.substring(hi * 2, hi * 2 + 2), 16);
      data = out;
    } else if (filter === "CCITTFaxDecode") {
      const { decodeCCITTFax } = await import("./base14Substitution-CpDFdGXj.js").then(function(n) {
        return n.b2;
      });
      const dpText = dictText;
      const params = {};
      const kMatch = /\/K\s+(-?\d+)/.exec(dpText) || /\/DP\s*<<[^>]*\/K\s+(-?\d+)/.exec(dpText);
      if (kMatch) params.K = Number(kMatch[1] || kMatch[2]);
      const colMatch = /\/Columns\s+(\d+)/.exec(dpText) || /\/DP\s*<<[^>]*\/Columns\s+(\d+)/.exec(dpText);
      if (colMatch) params.Columns = Number(colMatch[1] || colMatch[2]);
      else params.Columns = width;
      const blackIs1Match = /\/BlackIs1\s+true/.exec(dpText);
      if (blackIs1Match) params.BlackIs1 = true;
      params.Rows = height;
      params.EndOfBlock = false;
      const decoded = decodeCCITTFax(data, params);
      data = new Uint8Array(decoded.buffer);
    } else if (filter === "FlateDecode") {
      let inflated = zlibInflate(data);
      if (!(inflated instanceof Uint8Array)) inflated = inflatePartial(data);
      data = inflated;
      const dpMatch = /\/(?:DP|DecodeParms)\s*(?:\[\s*(?:null\s*)?)?<<([^>]*)>>/.exec(dictText);
      if (dpMatch) {
        let dpText = dpMatch[1];
        if (!/\/Columns\s+\d+/.test(dpText)) dpText = `/Columns ${width} ${dpText}`;
        data = applyPredictor(data, dpText, objCache);
      }
    } else if (filter === "LZWDecode") {
      const { decodeLZW } = await import("./base14Substitution-CpDFdGXj.js").then(function(n) {
        return n.b1;
      });
      data = decodeLZW(data, resolveIntValue(dictText, "EarlyChange", null, 1));
    } else if (filter === "RunLengthDecode") {
      const output = [];
      let pos = 0;
      while (pos < data.length) {
        const len = data[pos++];
        if (len < 128) {
          for (let k = 0; k < len + 1 && pos < data.length; k++) output.push(data[pos++]);
        } else if (len > 128) {
          const val = pos < data.length ? data[pos++] : 0;
          for (let k = 0; k < 257 - len; k++) output.push(val);
        } else break;
      }
      data = new Uint8Array(output);
    }
  }
  const invert = !!(decode && decode[0] === 1);
  const imageInfo = {
    width,
    height,
    bitsPerComponent: bpc,
    colorSpace,
    filter: imageCodec,
    imageData: data,
    objNum: -1,
    sMask: null,
    sMaskWidth: null,
    sMaskHeight: null,
    sMaskDecodeInvert: false,
    palette: null,
    paletteBase: null,
    imageMask: isImageMask,
    decodeInvert: invert,
    separationTintSamples: null,
    deviceNTintCS: null,
    iccProfileObjNum: null,
    iccTransform: null,
    labWhitePoint: null,
    labRange: null,
    paletteHival: null,
    colorKeyMask: null,
    transparentWhite: !!op.tilingPattern
  };
  if (isImageMask) {
    if (!op.fillColor || op.fillColor.includes("NaN")) return null;
    return imageMaskToBitmap(imageInfo, op.fillColor, objCache);
  }
  if (resolvedCS) {
    if (resolvedCS.indexedInfo) {
      imageInfo.palette = resolvedCS.indexedInfo.palette;
      imageInfo.paletteBase = resolvedCS.indexedInfo.base;
      imageInfo.paletteHival = resolvedCS.indexedInfo.hival;
      if (bpc === 1 && imageCodec == null && filters.includes("CCITTFaxDecode") && !decode && resolvedCS.indexedInfo.hival === 1) {
        const pal = resolvedCS.indexedInfo.palette;
        const nComp = resolvedCS.indexedInfo.base === "DeviceCMYK" ? 4 : resolvedCS.indexedInfo.base === "DeviceGray" || resolvedCS.indexedInfo.base === "CalGray" ? 1 : 3;
        const brightness = (o) => {
          if (nComp === 1) return pal[o];
          if (nComp === 4) {
            const [r, g, b] = cmykToRgb(pal[o] / 255, pal[o + 1] / 255, pal[o + 2] / 255, pal[o + 3] / 255);
            return 0.299 * r + 0.587 * g + 0.114 * b;
          }
          return 0.299 * pal[o] + 0.587 * pal[o + 1] + 0.114 * pal[o + 2];
        };
        if (pal && brightness(0) > brightness(nComp)) imageInfo.decodeInvert = true;
      }
    }
    if (resolvedCS.tintSamples) {
      imageInfo.separationTintSamples = resolvedCS.tintSamples;
      imageInfo.colorSpace = "Separation";
    }
  }
  return imageInfoToBitmap(imageInfo, objCache);
}
async function renderSMaskToCanvas(smaskInfo, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale, bbox = null) {
  const formObjText = objCache.getObjectText(smaskInfo.formObjNum);
  if (!formObjText) return null;
  const { images: maskImages, forms: maskForms } = parsePageImages(formObjText, objCache, { recurseForms: true });
  const streamBytes = objCache.getStreamBytes(smaskInfo.formObjNum);
  if (!streamBytes) return null;
  const formStream = bytesToLatin1(streamBytes);
  const maskExtGStates = parseExtGStates(formObjText, objCache);
  const maskShadings = parseShadings(formObjText, objCache);
  const maskPatterns = parsePatterns(formObjText, objCache);
  const maskColorSpaces = parsePageColorSpaces(formObjText, objCache);
  const maskFonts = parsePageFonts(formObjText, objCache);
  const maskRegistered = /* @__PURE__ */ new Map();
  const maskSymbolTags = /* @__PURE__ */ new Set();
  const maskCidPUATags = /* @__PURE__ */ new Set();
  const maskRawCharCodeTags = /* @__PURE__ */ new Set();
  const maskCidCollisionMap = /* @__PURE__ */ new Map();
  for (const [fontTag, fontObj] of maskFonts) {
    const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, `smask_${smaskInfo.formObjNum}_${fontTag}`);
    await convertAndRegisterFont(
      fontTag,
      fontObj,
      maskRegistered,
      maskSymbolTags,
      maskCidPUATags,
      maskRawCharCodeTags,
      maskCidCollisionMap,
      objCache,
      familyName
    );
  }
  appendGenericFallbacks(maskRegistered, maskFonts);
  const rawFormDrawOps = parseDrawOps(
    formStream,
    maskFonts,
    maskExtGStates,
    maskRegistered,
    maskColorSpaces,
    maskSymbolTags,
    maskCidPUATags,
    maskRawCharCodeTags,
    maskShadings,
    maskPatterns,
    maskCidCollisionMap
  );
  let formDrawOps;
  if (maskForms.size > 0) {
    formDrawOps = [];
    for (const op of rawFormDrawOps) {
      if (op.type === "image" && maskForms.has(op.name)) {
        const sub = await flattenDrawOps(
          [op],
          maskImages,
          maskForms,
          objCache,
          maskFonts,
          maskRegistered,
          "",
          0,
          maskSymbolTags,
          maskCidPUATags,
          maskExtGStates,
          maskRawCharCodeTags,
          /* @__PURE__ */ new Map(),
          0,
          /* @__PURE__ */ new Set(),
          maskCidCollisionMap,
          "black",
          "rgb(0,0,0)",
          1,
          1,
          null,
          null
        );
        for (const sop of sub) formDrawOps.push(sop);
      } else {
        formDrawOps.push(op);
      }
    }
  } else {
    formDrawOps = rawFormDrawOps;
  }
  const formMatrix = parseFormMatrix(formObjText, objCache);
  for (const op of formDrawOps) {
    if (op.ctm) op.ctm = matMul(op.ctm, formMatrix);
  }
  if (smaskInfo.parentCtm && smaskInfo.parentCtm.length === 6) {
    for (const op of formDrawOps) {
      const opAny = (
        /** @type {any} */
        op
      );
      if (opAny.ctm) opAny.ctm = matMul(opAny.ctm, smaskInfo.parentCtm);
      if (opAny.clips) {
        for (const clip of opAny.clips) {
          clip.ctm = matMul(clip.ctm, smaskInfo.parentCtm);
        }
      }
    }
  }
  const maskW = bbox ? bbox.width : canvasWidth;
  const maskH = bbox ? bbox.height : canvasHeight;
  const shiftX = bbox ? bbox.x : 0;
  const shiftY = bbox ? bbox.y : 0;
  const maskCanvas = ca.makeCanvas(maskW, maskH);
  const maskCtx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    maskCanvas.getContext("2d", { willReadFrequently: true })
  );
  const isAlphaMask = smaskInfo.type === "Alpha";
  if (!isAlphaMask) {
    const bc = smaskInfo.bc;
    let bcColor = "black";
    if (bc && bc.length === 1) {
      const v = Math.round(Math.max(0, Math.min(1, bc[0])) * 255);
      bcColor = `rgb(${v},${v},${v})`;
    } else if (bc && bc.length === 3) {
      bcColor = `rgb(${Math.round(bc[0] * 255)},${Math.round(bc[1] * 255)},${Math.round(bc[2] * 255)})`;
    } else if (bc && bc.length === 4) {
      const [r, g, b] = cmykToRgb(bc[0], bc[1], bc[2], bc[3]);
      bcColor = `rgb(${r},${g},${b})`;
    }
    maskCtx.fillStyle = bcColor;
    maskCtx.fillRect(0, 0, maskW, maskH);
  }
  for (const op of formDrawOps) {
    if (op.type === "image") {
      const imageInfo = maskImages.get(op.name);
      if (!imageInfo) continue;
      const bitmap = imageInfo.imageMask ? await imageMaskToBitmap(imageInfo, "white", objCache) : await imageInfoToBitmap(imageInfo, objCache);
      maskCtx.save();
      if (op.fillAlpha < 1) maskCtx.globalAlpha = op.fillAlpha;
      if (op.clips) {
        for (const clip of op.clips) {
          if (!clip.path) continue;
          maskCtx.setTransform(
            clip.ctm[0] * scale,
            -clip.ctm[1] * scale,
            clip.ctm[2] * scale,
            -clip.ctm[3] * scale,
            (clip.ctm[4] - boxOriginX) * scale - shiftX,
            (pageHeightPts + boxOriginY - clip.ctm[5]) * scale - shiftY
          );
          maskCtx.beginPath();
          for (const cmd of clip.path) {
            if (cmd.type === "M") maskCtx.moveTo(cmd.x, cmd.y);
            else if (cmd.type === "L") maskCtx.lineTo(cmd.x, cmd.y);
            else if (cmd.type === "C") maskCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            else if (cmd.type === "Z") maskCtx.closePath();
          }
          maskCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
        }
      }
      maskCtx.setTransform(
        op.ctm[0] * scale,
        -op.ctm[1] * scale,
        op.ctm[2] * scale,
        -op.ctm[3] * scale,
        (op.ctm[4] - boxOriginX) * scale - shiftX,
        (pageHeightPts + boxOriginY - op.ctm[5]) * scale - shiftY
      );
      maskCtx.transform(1, 0, 0, -1, 0, 1);
      maskCtx.drawImage(bitmap, 0, 0, 1, 1);
      maskCtx.restore();
      ca.closeDrawable(bitmap);
    } else if (op.type === "shading") {
      const sh = op.shading;
      maskCtx.save();
      if (op.fillAlpha < 1) maskCtx.globalAlpha = op.fillAlpha;
      if (op.clips) {
        for (const clip of op.clips) {
          if (!clip.path) continue;
          maskCtx.setTransform(
            clip.ctm[0] * scale,
            -clip.ctm[1] * scale,
            clip.ctm[2] * scale,
            -clip.ctm[3] * scale,
            (clip.ctm[4] - boxOriginX) * scale - shiftX,
            (pageHeightPts + boxOriginY - clip.ctm[5]) * scale - shiftY
          );
          maskCtx.beginPath();
          for (const cmd of clip.path) {
            if (cmd.type === "M") maskCtx.moveTo(cmd.x, cmd.y);
            else if (cmd.type === "L") maskCtx.lineTo(cmd.x, cmd.y);
            else if (cmd.type === "C") maskCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            else if (cmd.type === "Z") maskCtx.closePath();
          }
          maskCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
        }
      }
      maskCtx.setTransform(
        op.ctm[0] * scale,
        -op.ctm[1] * scale,
        op.ctm[2] * scale,
        -op.ctm[3] * scale,
        (op.ctm[4] - boxOriginX) * scale - shiftX,
        (pageHeightPts + boxOriginY - op.ctm[5]) * scale - shiftY
      );
      if (sh.type === 2) {
        const grad = maskCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
        for (const stop of sh.stops) {
          grad.addColorStop(stop.offset, stop.color);
        }
        maskCtx.fillStyle = grad;
        maskCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
      } else if (sh.type === 3) {
        const grad = maskCtx.createRadialGradient(
          sh.coords[0],
          sh.coords[1],
          sh.coords[2],
          sh.coords[3],
          sh.coords[4],
          sh.coords[5]
        );
        for (const stop of sh.stops) {
          grad.addColorStop(stop.offset, stop.color);
        }
        maskCtx.fillStyle = grad;
        maskCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
      } else if (sh.type === "mesh") {
        renderMeshPatches(maskCtx, sh.patches);
      } else if (sh.type === "gouraud") {
        renderGouraudTriangles(maskCtx, sh.triangles, null, [maskW, maskH]);
      }
      maskCtx.restore();
    } else if (op.type === "path" && op.fill) {
      maskCtx.save();
      if (op.fillAlpha < 1) maskCtx.globalAlpha = op.fillAlpha;
      if (op.clips) {
        for (const clip of op.clips) {
          if (!clip.path) continue;
          maskCtx.setTransform(
            clip.ctm[0] * scale,
            -clip.ctm[1] * scale,
            clip.ctm[2] * scale,
            -clip.ctm[3] * scale,
            (clip.ctm[4] - boxOriginX) * scale - shiftX,
            (pageHeightPts + boxOriginY - clip.ctm[5]) * scale - shiftY
          );
          maskCtx.beginPath();
          for (const cmd of clip.path) {
            if (cmd.type === "M") maskCtx.moveTo(cmd.x, cmd.y);
            else if (cmd.type === "L") maskCtx.lineTo(cmd.x, cmd.y);
            else if (cmd.type === "C") maskCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            else if (cmd.type === "Z") maskCtx.closePath();
          }
          maskCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
        }
      }
      maskCtx.setTransform(
        op.ctm[0] * scale,
        -op.ctm[1] * scale,
        op.ctm[2] * scale,
        -op.ctm[3] * scale,
        (op.ctm[4] - boxOriginX) * scale - shiftX,
        (pageHeightPts + boxOriginY - op.ctm[5]) * scale - shiftY
      );
      maskCtx.beginPath();
      for (const cmd of op.commands) {
        switch (cmd.type) {
          case "M":
            maskCtx.moveTo(cmd.x, cmd.y);
            break;
          case "L":
            maskCtx.lineTo(cmd.x, cmd.y);
            break;
          case "C":
            maskCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            break;
          case "Z":
            maskCtx.closePath();
            break;
        }
      }
      if (op.patternShading) {
        const sh = op.patternShading;
        maskCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
        if (sh.matrix) maskCtx.transform(...sh.matrix);
        if (sh.type === "mesh") {
          renderMeshPatches(maskCtx, sh.patches);
        } else if (sh.type === "gouraud") {
          renderGouraudTriangles(maskCtx, sh.triangles, null, [maskW, maskH]);
        } else {
          let grad;
          if (sh.type === 2) {
            grad = maskCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
          } else if (sh.type === 3) {
            grad = maskCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
          }
          if (grad) {
            for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
            maskCtx.fillStyle = grad;
            maskCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
          } else {
            maskCtx.fillStyle = op.fillColor || "black";
            maskCtx.fill(op.evenOdd ? "evenodd" : "nonzero");
          }
        }
      } else if (op.tilingPattern) {
        const tp = op.tilingPattern;
        const tileCanvas = await renderTilingPatternTileForSmask(tp, objCache, scale);
        if (tileCanvas) {
          const bboxW = tp.bbox[2] - tp.bbox[0];
          const bboxH = tp.bbox[3] - tp.bbox[1];
          const tileW = tileCanvas.width;
          const tileH = tileCanvas.height;
          const sx = bboxW / tileW * scale;
          const sy = bboxH / tileH * scale;
          maskCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
          maskCtx.setTransform(1, 0, 0, 1, 0, 0);
          const canvasPat = maskCtx.createPattern(tileCanvas, "repeat");
          if (canvasPat) {
            canvasPat.setTransform(new DOMMatrix([
              tp.matrix[0] * sx,
              -tp.matrix[1] * sx,
              -tp.matrix[2] * sy,
              tp.matrix[3] * sy,
              (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale - shiftX,
              (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale - shiftY
            ]));
            maskCtx.fillStyle = canvasPat;
            maskCtx.fillRect(0, 0, maskW, maskH);
          }
          ca.closeDrawable(tileCanvas);
        }
      } else {
        maskCtx.fillStyle = op.fillColor || "black";
        maskCtx.fill(op.evenOdd ? "evenodd" : "nonzero");
      }
      maskCtx.restore();
    } else if (op.type === "type0text" && op.fontFamily && op.text) {
      const isEmbedded = /^"?_pdf_/.test(op.fontFamily);
      const weight = !isEmbedded && op.bold ? "bold" : "normal";
      const style = !isEmbedded && op.italic ? "italic" : "normal";
      maskCtx.save();
      maskCtx.font = /[",]/.test(op.fontFamily) ? `${style} ${weight} 1px ${op.fontFamily}` : `${style} ${weight} 1px "${op.fontFamily}"`;
      maskCtx.textBaseline = "alphabetic";
      let hScale = 1;
      if (op.pdfGlyphWidth !== void 0) {
        const mw = maskCtx.measureText(op.text).width;
        if (mw > 0) {
          hScale = op.pdfGlyphWidth / (1e3 * mw);
          if (!isEmbedded && hScale > 2) hScale = 1;
        }
      }
      maskCtx.setTransform(
        op.a * scale * hScale,
        -op.b * scale * hScale,
        -op.c * scale,
        op.d * scale,
        (op.x - boxOriginX) * scale - shiftX,
        (pageHeightPts + boxOriginY - op.y) * scale - shiftY
      );
      maskCtx.fillStyle = op.fillColor || "black";
      if (op.fillAlpha < 1) maskCtx.globalAlpha = op.fillAlpha;
      maskCtx.fillText(op.text, 0, 0);
      maskCtx.restore();
    } else if (op.type === "inlineImage") {
      const bitmap = await decodeInlineImageBitmap(op, objCache);
      if (!bitmap) continue;
      if (Math.abs(op.ctm[0] * op.ctm[3] - op.ctm[1] * op.ctm[2]) < 1e-9) {
        ca.closeDrawable(bitmap);
        continue;
      }
      maskCtx.save();
      if (op.fillAlpha < 1) maskCtx.globalAlpha = op.fillAlpha;
      if (op.clips) {
        for (const clip of op.clips) {
          if (!clip.path) continue;
          maskCtx.setTransform(
            clip.ctm[0] * scale,
            -clip.ctm[1] * scale,
            clip.ctm[2] * scale,
            -clip.ctm[3] * scale,
            (clip.ctm[4] - boxOriginX) * scale - shiftX,
            (pageHeightPts + boxOriginY - clip.ctm[5]) * scale - shiftY
          );
          maskCtx.beginPath();
          for (const cmd of clip.path) {
            if (cmd.type === "M") maskCtx.moveTo(cmd.x, cmd.y);
            else if (cmd.type === "L") maskCtx.lineTo(cmd.x, cmd.y);
            else if (cmd.type === "C") maskCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            else if (cmd.type === "Z") maskCtx.closePath();
          }
          maskCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
        }
      }
      maskCtx.setTransform(
        op.ctm[0] * scale,
        -op.ctm[1] * scale,
        op.ctm[2] * scale,
        -op.ctm[3] * scale,
        (op.ctm[4] - boxOriginX) * scale - shiftX,
        (pageHeightPts + boxOriginY - op.ctm[5]) * scale - shiftY
      );
      maskCtx.transform(1, 0, 0, -1, 0, 1);
      maskCtx.drawImage(bitmap, 0, 0, 1, 1);
      maskCtx.restore();
      ca.closeDrawable(bitmap);
    }
  }
  const trFn = smaskInfo.tr || null;
  let trLut = null;
  if (trFn) {
    trLut = new Float64Array(256);
    for (let k = 0; k < 256; k++) {
      const out = evaluateFunction(trFn, [k / 255]);
      trLut[k] = out && out.length > 0 ? out[0] : k / 255;
    }
  }
  const maskData = maskCtx.getImageData(0, 0, maskW, maskH);
  const px = maskData.data;
  for (let i = 0; i < px.length; i += 4) {
    const alpha = px[i + 3] / 255;
    let outAlpha;
    if (isAlphaMask) {
      outAlpha = trLut ? trLut[px[i + 3]] : alpha;
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = Math.round(Math.max(0, Math.min(1, outAlpha)) * 255);
    } else {
      const luminosity = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      outAlpha = trLut ? trLut[Math.round(luminosity * 255)] : luminosity;
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = Math.round(Math.max(0, Math.min(1, outAlpha)) * alpha * 255);
    }
  }
  maskCtx.putImageData(maskData, 0, 0);
  return maskCanvas;
}
async function renderPdfPageAsImage(pageObjText, objCache, mediaBox, pageIndex, colorMode = "color", rotate = 0, dpi = 300, outputFormat = "png", quality = 0.6, edits = null) {
  const tRenderStart = performance.now();
  const perf = {
    prepMs: 0,
    drawMs: 0,
    decodeMs: 0,
    flushMs: 0
  };
  const offOCGs = objCache.getOffOCGs();
  const contentWidthPts = Math.abs(mediaBox[2] - mediaBox[0]);
  const contentHeightPts = Math.abs(mediaBox[3] - mediaBox[1]);
  const boxOriginX = Math.min(mediaBox[0], mediaBox[2]);
  const boxOriginY = Math.min(mediaBox[1], mediaBox[3]);
  let rotCtm = null;
  let pageWidthPts = contentWidthPts;
  let pageHeightPts = contentHeightPts;
  if (rotate === 90) {
    rotCtm = [0, -1, 1, 0, boxOriginX - boxOriginY, contentWidthPts + boxOriginX + boxOriginY];
    pageWidthPts = contentHeightPts;
    pageHeightPts = contentWidthPts;
  } else if (rotate === 180) {
    rotCtm = [-1, 0, 0, -1, contentWidthPts + 2 * boxOriginX, contentHeightPts + 2 * boxOriginY];
  } else if (rotate === 270) {
    rotCtm = [0, 1, -1, 0, contentHeightPts + boxOriginY + boxOriginX, boxOriginY - boxOriginX];
    pageWidthPts = contentHeightPts;
    pageHeightPts = contentWidthPts;
  }
  if (objCache.xrefSeverelyCorrupt && objCache.encryptionKey) {
    const scale2 = 300 / 72;
    const w = Math.ceil(pageWidthPts * scale2);
    const h = Math.ceil(pageHeightPts * scale2);
    const c = ca.makeCanvas(w, h);
    const cCtx = (
      /** @type {OffscreenCanvasRenderingContext2D} */
      c.getContext("2d", { willReadFrequently: true })
    );
    cCtx.fillStyle = "white";
    cCtx.fillRect(0, 0, w, h);
    const _imgData = cCtx.getImageData(0, 0, w, h);
    const out = {
      dataUrl: await buildPngDataUrl(_imgData, "gray"),
      colorMode: "gray",
      ok: false,
      failReason: "corrupt_encrypted"
    };
    ca.closeDrawable(c);
    return out;
  }
  const { images, forms } = parsePageImages(pageObjText, objCache, { recurseForms: false });
  await ensureSubstituteFacesForRecords(objCache, edits && edits.records);
  const fonts = parsePageFonts(pageObjText, objCache);
  const substituteEntries = substituteFaceResourceEntries(objCache, edits && edits.records);
  if (substituteEntries) for (const [tag, f] of parsePageFonts(`<</Resources<</Font<<${substituteEntries}>>>>>>`, objCache)) fonts.set(tag, f);
  const registeredFontNames = /* @__PURE__ */ new Map();
  const symbolFontTags = /* @__PURE__ */ new Set();
  const rawCharCodeTags = /* @__PURE__ */ new Set();
  const cidPUATags = /* @__PURE__ */ new Set();
  const cidCollisionMap = /* @__PURE__ */ new Map();
  const deferredFontTags = [];
  for (const [fontTag, fontObj] of fonts) {
    const fontData = fontObj.type0 || fontObj.type1;
    if (!fontData) {
      deferredFontTags.push(fontTag);
      continue;
    }
    const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, fontTag);
    await convertAndRegisterFont(
      fontTag,
      fontObj,
      registeredFontNames,
      symbolFontTags,
      cidPUATags,
      rawCharCodeTags,
      cidCollisionMap,
      objCache,
      familyName
    );
  }
  for (const fontTag of deferredFontTags) {
    const fontObj = fonts.get(fontTag);
    if (!fontObj) continue;
    if (fontObj.isCIDFont && fontObj.toUnicode.size === 0 && !fontObj.type0) {
      console.warn(`[renderPdfPage] Skipping non-embedded CID font "${fontObj.baseName}" (no toUnicode map)`);
      continue;
    }
    const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, fontTag);
    await registerNonEmbeddedFont(fontObj, familyName, registeredFontNames, fontTag);
  }
  appendGenericFallbacks(registeredFontNames, fonts);
  const extGStates = parseExtGStates(pageObjText, objCache);
  const colorSpaces = parsePageColorSpaces(pageObjText, objCache);
  const pageShadings = parseShadings(pageObjText, objCache);
  const pagePatterns = parsePatterns(pageObjText, objCache);
  let pageHasColor = false;
  for (const [, imgInfo] of images) {
    if (imgInfo.bitsPerComponent === 1) continue;
    const cs = imgInfo.colorSpace;
    if (cs === "DeviceGray" || cs === "CalGray") continue;
    if (cs === "Indexed") {
      if (imgInfo.paletteBase === "DeviceGray" || imgInfo.paletteBase === "CalGray") continue;
    }
    pageHasColor = true;
    break;
  }
  const contentStreams = getPageContentStreams(pageObjText, objCache);
  const recoveredFlags = objCache.lastContentStreamsRecovered;
  const textPatches = edits && edits.records ? (
    /** @type {Array<TextPatch>} */
    edits.records.filter((r) => r && r.type === "patchText")
  ) : null;
  const pageContents = contentStreams && contentStreams.length > 0 ? patchPageContents(contentStreams, textPatches) : null;
  const rawDrawOps = pageContents ? parseDrawOps(
    pageContents.text,
    fonts,
    extGStates,
    registeredFontNames,
    colorSpaces,
    symbolFontTags,
    cidPUATags,
    rawCharCodeTags,
    pageShadings,
    pagePatterns,
    cidCollisionMap,
    null,
    parseHiddenOCMCNames(pageObjText, objCache, offOCGs),
    recoveredFlags,
    pageContents.boundaries
  ) : [];
  if (pageContents && pageContents.text.length > 5e5) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  const drawOps = [];
  const groupContext = { nextId: 1, registry: /* @__PURE__ */ new Map() };
  if (forms.size > 0) {
    const sharedFormResourceCache = /* @__PURE__ */ new Map();
    for (const op of rawDrawOps) {
      if (op.type === "image") {
        const flattened = await flattenDrawOps(
          [op],
          images,
          forms,
          objCache,
          fonts,
          registeredFontNames,
          "",
          pageIndex,
          symbolFontTags,
          cidPUATags,
          extGStates,
          rawCharCodeTags,
          sharedFormResourceCache,
          0,
          offOCGs,
          cidCollisionMap,
          "black",
          "rgb(0,0,0)",
          1,
          1,
          groupContext,
          null,
          textPatches
        );
        for (let fi = 0; fi < flattened.length; fi++) drawOps.push(flattened[fi]);
      } else {
        drawOps.push(op);
      }
    }
  } else {
    for (let ri = 0; ri < rawDrawOps.length; ri++) drawOps.push(rawDrawOps[ri]);
  }
  if (edits && edits.records?.length && edits.dims) {
    const editEntries = [];
    for (const rec of edits.records) {
      if (!rec) continue;
      if (rec.type === "deleteImage") {
        const imageGate = mapImageDelete(rec, edits.dims, mediaBox, rotate);
        if (imageGate) {
          editEntries.push({
            rec,
            rects: [],
            gate: null,
            imageGate
          });
        }
        continue;
      }
      if (rec.type === "deletePath") {
        const pathGate = mapPathDelete(rec, edits.dims, mediaBox, rotate);
        if (pathGate) {
          editEntries.push({
            rec,
            rects: [],
            gate: null,
            pathGate
          });
        }
        continue;
      }
    }
    if (editEntries.length > 0) {
      let keep = 0;
      for (let i = 0; i < drawOps.length; i++) {
        const op = drawOps[i];
        if (op.type === "image" || op.type === "inlineImage") {
          const opObjNum = op.type === "image" ? images.get(op.name)?.objNum ?? null : null;
          let imageHit = false;
          for (const entry of editEntries) {
            if (entry.imageGate && imageDrawMatchesDelete(op.ctm, entry.imageGate, opObjNum)) {
              imageHit = true;
              break;
            }
          }
          if (imageHit) continue;
        }
        if (op.type === "path") {
          let hull = null;
          let pathHit = false;
          for (const entry of editEntries) {
            if (!entry.pathGate) continue;
            if (!hull) {
              let hx0 = Infinity;
              let hy0 = Infinity;
              let hx1 = -Infinity;
              let hy1 = -Infinity;
              for (const cmd of op.commands) {
                if (cmd.type === "Z") continue;
                const pts = cmd.type === "C" ? [[cmd.x1, cmd.y1], [cmd.x2, cmd.y2], [cmd.x, cmd.y]] : [[cmd.x, cmd.y]];
                for (const [cx2, cy2] of pts) {
                  const gx = cx2 * op.ctm[0] + cy2 * op.ctm[2] + op.ctm[4];
                  const gy = cx2 * op.ctm[1] + cy2 * op.ctm[3] + op.ctm[5];
                  hx0 = Math.min(hx0, gx);
                  hy0 = Math.min(hy0, gy);
                  hx1 = Math.max(hx1, gx);
                  hy1 = Math.max(hy1, gy);
                }
              }
              hull = [hx0, hy0, hx1, hy1];
            }
            const paint = op.fill && op.stroke ? "fs" : op.fill ? "f" : "s";
            if (pathDrawMatchesDelete(hull, entry.pathGate, paint, op.commands.length)) {
              pathHit = true;
              break;
            }
          }
          if (pathHit) continue;
        }
        drawOps[keep] = op;
        keep += 1;
      }
      drawOps.length = keep;
    }
  }
  const annotsParsed = extractPdfAnnotations(objCache, pageObjText);
  let needAppearances = false;
  {
    const rootObjNum = findRootObjNum(objCache.pdfBytes);
    const catalogText = rootObjNum ? objCache.getObjectText(rootObjNum) : null;
    const acroFormMatch = catalogText ? /\/AcroForm\s+(\d+)\s+\d+\s+R/.exec(catalogText) : null;
    const acroFormText = acroFormMatch ? objCache.getObjectText(Number(acroFormMatch[1])) : null;
    if (acroFormText && /\/NeedAppearances\s+true\b/.test(acroFormText)) needAppearances = true;
  }
  const highlightByRef = new Map(annotsParsed.highlights.map((h) => [h.objNum, h]));
  const annotRefsRaw = [
    ...annotsParsed.highlights.map((h) => h.objNum),
    ...annotsParsed.passthroughRefs
  ];
  const annotIsWidget = (ref) => {
    const t = objCache.getObjectText(ref);
    return t ? /\/Subtype\s*\/Widget\b/.test(scopeDictKeys(t).keyText("Subtype")) : false;
  };
  const annotRefs = [
    ...annotRefsRaw.filter((r) => !annotIsWidget(r)),
    ...annotRefsRaw.filter((r) => annotIsWidget(r))
  ];
  if (annotRefs.length > 0) {
    for (const annotRef of annotRefs) {
      const annotText = objCache.getObjectText(annotRef);
      if (!annotText) continue;
      const annotKeys = scopeDictKeys(annotText);
      const subtypeText = annotKeys.keyText("Subtype");
      const rectArrText = resolveArrayValue(annotKeys.keyText("Rect"), "Rect", objCache);
      if (rectArrText == null) continue;
      const rect = [];
      const rectTokRe = /(\d+)\s+\d+\s+R|(-?[\d.]+(?:[eE][-+]?\d+)?)/g;
      let rectTok;
      while ((rectTok = rectTokRe.exec(rectArrText)) && rect.length < 4) {
        if (rectTok[1] !== void 0) {
          const numText = objCache.getObjectText(Number(rectTok[1]));
          const numMatch = numText ? /(-?[\d.]+(?:[eE][-+]?\d+)?)/.exec(numText) : null;
          rect.push(numMatch ? Number(numMatch[1]) : NaN);
        } else {
          rect.push(Number(rectTok[2]));
        }
      }
      if (rect.length < 4 || rect.some(Number.isNaN)) continue;
      const rectX0 = Math.min(rect[0], rect[2]);
      const rectY0 = Math.min(rect[1], rect[3]);
      const rectW = Math.abs(rect[2] - rect[0]);
      const rectH = Math.abs(rect[3] - rect[1]);
      const isLineAnnot = /\/Subtype\s*\/Line\b/.test(subtypeText);
      const isInkAnnot = /\/Subtype\s*\/Ink\b/.test(subtypeText);
      if ((rectW <= 0 || rectH <= 0) && !isLineAnnot && !isInkAnnot) continue;
      const flags = resolveIntValue(annotKeys.keyText("F"), "F", objCache, 0);
      if (flags & 1 || flags & 2 || flags & 32) continue;
      let apObjNum = null;
      let apDictText = annotKeys.keyText("AP");
      const apIndirectMatch = /\/AP\s+(\d+)\s+\d+\s+R/.exec(annotKeys.keyText("AP"));
      if (apIndirectMatch) {
        const refText = objCache.getObjectText(Number(apIndirectMatch[1]));
        if (refText) apDictText = refText;
      }
      const apDirectMatch = /\/AP\s*<<[\s\S]*?\/N\s+(\d+)\s+\d+\s+R/.exec(apDictText) || /^<<[\s\S]*?\/N\s+(\d+)\s+\d+\s+R/.exec(apDictText);
      if (apDirectMatch) {
        apObjNum = Number(apDirectMatch[1]);
        const nObjText = objCache.getObjectText(apObjNum);
        if (nObjText && !/\/BBox/.test(nObjText)) {
          const asMatch = /\/AS\s*\/(\w+)/.exec(annotKeys.keyText("AS"));
          const currentState = asMatch ? asMatch[1] : "Off";
          const stateRefMatch = new RegExp(`\\/${currentState}\\s+(\\d+)\\s+\\d+\\s+R`).exec(nObjText);
          if (stateRefMatch) apObjNum = Number(stateRefMatch[1]);
        }
      } else {
        const apDictMatch = /\/AP\s*<<[\s\S]*?\/N\s*<<([\s\S]*?)>>/.exec(apDictText) || /^<<[\s\S]*?\/N\s*<<([\s\S]*?)>>/.exec(apDictText);
        if (apDictMatch) {
          const asMatch = /\/AS\s*\/(\w+)/.exec(annotKeys.keyText("AS"));
          const currentState = asMatch ? asMatch[1] : "Off";
          const stateRefMatch = new RegExp(`\\/${currentState}\\s+(\\d+)\\s+\\d+\\s+R`).exec(apDictMatch[1]);
          if (stateRefMatch) apObjNum = Number(stateRefMatch[1]);
        }
      }
      let resolvedFieldType = "";
      const ftSelfMatch = /\/FT\s*\/(\w+)/.exec(annotKeys.keyText("FT"));
      if (ftSelfMatch) {
        resolvedFieldType = ftSelfMatch[1];
      } else {
        const parentRefMatch = /\/Parent\s+(\d+)\s+\d+\s+R/.exec(annotKeys.keyText("Parent"));
        const parentText = parentRefMatch ? objCache.getObjectText(Number(parentRefMatch[1])) : null;
        const ftParentMatch = parentText ? /\/FT\s*\/(\w+)/.exec(scopeDictKeys(parentText).keyText("FT")) : null;
        if (ftParentMatch) resolvedFieldType = ftParentMatch[1];
      }
      let fieldValue = null;
      if (resolvedFieldType === "Tx" || resolvedFieldType === "Ch") {
        fieldValue = resolveStringValue(annotKeys.keyText("V"), "V", objCache);
        if (fieldValue && fieldValue.charCodeAt(0) === 65279) fieldValue = fieldValue.slice(1);
      }
      if (needAppearances && apObjNum !== null) {
        if (resolvedFieldType === "Tx") {
          const txMultiline = (resolveIntValue(annotKeys.keyText("Ff"), "Ff", objCache, 0) & 4096) !== 0;
          const synthCanRender = fieldValue === null || !/[^\x00-\xff]/.test(fieldValue);
          if (!txMultiline && synthCanRender) apObjNum = null;
        } else if (resolvedFieldType === "Btn") {
          if (!(resolveIntValue(annotKeys.keyText("Ff"), "Ff", objCache, 0) & 65536)) apObjNum = null;
        }
      }
      if (apObjNum === null) {
        if (resolvedFieldType === "Tx" || resolvedFieldType === "Ch") {
          if (fieldValue && fieldValue.length > 0) {
            const da = resolveStringValue(annotKeys.keyText("DA"), "DA", objCache) ?? "/Helvetica 10 Tf 0 g";
            const tfMatch = /\/[\w+-]+\s+([\d.]+)\s+Tf/.exec(da);
            let fontSize = tfMatch ? Number(tfMatch[1]) : 10;
            if (!fontSize) fontSize = Math.min(12, Math.max(6, rectH - 4));
            const tfEnd = da.lastIndexOf("Tf");
            const colorOps = tfEnd >= 0 ? da.slice(tfEnd + 2).trim() : "0 g";
            const quadding = resolveIntValue(annotKeys.keyText("Q"), "Q", objCache, 0);
            const synthFf = resolveIntValue(annotKeys.keyText("Ff"), "Ff", objCache, 0);
            const multiline = (synthFf & 4096) !== 0;
            const combMaxLen = resolvedFieldType === "Tx" && !multiline && synthFf & 16777216 ? resolveIntValue(annotKeys.keyText("MaxLen"), "MaxLen", objCache, 0) : 0;
            const pad = 2;
            const esc = (s) => s.replace(/[\\()]/g, (ch) => `\\${ch}`);
            const avgCharW = fontSize * 0.5;
            let textCommands = "";
            if (multiline) {
              const maxChars = Math.max(1, Math.floor((rectW - 2 * pad) / avgCharW));
              const lines = [];
              for (const para of fieldValue.split(/\r\n|\r|\n/)) {
                const words = para.split(/\s+/).filter((w) => w.length > 0);
                if (words.length === 0) {
                  lines.push("");
                  continue;
                }
                let line = "";
                for (const w of words) {
                  if (line.length === 0) line = w;
                  else if (line.length + 1 + w.length <= maxChars) line += ` ${w}`;
                  else {
                    lines.push(line);
                    line = w;
                  }
                }
                if (line.length > 0) lines.push(line);
              }
              const leading = fontSize * 1.15;
              let ty = rectH - pad - fontSize;
              textCommands = `${pad} ${ty} Td`;
              for (let li = 0; li < lines.length; li++) {
                if (li > 0) textCommands += ` 0 ${-leading} Td`;
                textCommands += ` (${esc(lines[li])}) Tj`;
                ty -= leading;
              }
            } else if (combMaxLen > 0) {
              const cellW = rectW / combMaxLen;
              const ty = Math.max(pad, (rectH - fontSize) / 2 + fontSize * 0.2);
              const ops = [];
              for (const m of fieldValue.matchAll(/\S/g)) {
                const chW = fontSize * ((combHelvWidths.get(m[0].charCodeAt(0)) ?? combHelvDefaultWidth) / 1e3);
                const x = m.index * cellW + (cellW - chW) / 2;
                ops.push(`1 0 0 1 ${x.toFixed(2)} ${ty.toFixed(2)} Tm (${esc(m[0])}) Tj`);
              }
              textCommands = ops.join(" ");
            } else {
              const textW = fieldValue.length * avgCharW;
              let tx = pad;
              if (quadding === 1) tx = Math.max(pad, (rectW - textW) / 2);
              else if (quadding === 2) tx = Math.max(pad, rectW - textW - pad);
              const ty = Math.max(pad, (rectH - fontSize) / 2 + fontSize * 0.2);
              textCommands = `${tx} ${ty} Td (${esc(fieldValue)}) Tj`;
            }
            const synthDict = `<</Type/XObject/Subtype/Form/FormType 1/BBox[0 0 ${rectW} ${rectH}]/Resources<</Font<</HsynthF<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>>>/ProcSet[/PDF/Text]>>>>`;
            const clip = `0 0 ${rectW} ${rectH} re W n`;
            const synthStream = `/Tx BMC q ${clip} BT /HsynthF ${fontSize} Tf ${colorOps} ${textCommands} ET Q EMC`;
            const synthObjNum = 9e8 + annotRef;
            objCache.addSyntheticObject(synthObjNum, synthDict, new TextEncoder().encode(synthStream));
            apObjNum = synthObjNum;
          }
        } else if (resolvedFieldType === "Btn") {
          const asMatch = /\/AS\s*\/(\w+)/.exec(annotKeys.keyText("AS"));
          if (asMatch && asMatch[1] !== "Off") {
            const da = resolveStringValue(annotKeys.keyText("DA"), "DA", objCache) ?? "0 g";
            const tfEnd = da.lastIndexOf("Tf");
            const dotColor = tfEnd >= 0 ? da.slice(tfEnd + 2).trim() : "0 g";
            const cx = rectW / 2;
            const cy = rectH / 2;
            const r = Math.min(rectW, rectH) * 0.25;
            const k = 0.5522847498 * r;
            const f = (n) => n.toFixed(3);
            const dotPath = `${f(cx + r)} ${f(cy)} m ${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c ${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} c ${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c ${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} c h f`;
            const dotDict = `<</Type/XObject/Subtype/Form/FormType 1/BBox[0 0 ${rectW} ${rectH}]/Resources<</ProcSet[/PDF]>>>>`;
            const dotStream = `q ${dotColor} ${dotPath} Q`;
            const dotObjNum = 9e8 + annotRef;
            objCache.addSyntheticObject(dotObjNum, dotDict, new TextEncoder().encode(dotStream));
            apObjNum = dotObjNum;
          }
        }
      }
      if (apObjNum !== null) {
        const apObjText = objCache.getObjectText(apObjNum);
        if (!apObjText) continue;
        const apSubtypeMatch = /\/Subtype\s*\/(\w+)/.exec(apObjText);
        if (apSubtypeMatch && apSubtypeMatch[1] !== "Form") continue;
        const bboxArr = resolveNumArray(apObjText, "BBox", objCache, null);
        const bbox = bboxArr && bboxArr.length === 4 ? bboxArr : [0, 0, rectW, rectH];
        const apMatrix = parseFormMatrix(apObjText, objCache);
        const corners = [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]]];
        const txArr = corners.map(([x, y]) => x * apMatrix[0] + y * apMatrix[2] + apMatrix[4]);
        const tyArr = corners.map(([x, y]) => x * apMatrix[1] + y * apMatrix[3] + apMatrix[5]);
        const effBBox = [Math.min(...txArr), Math.min(...tyArr), Math.max(...txArr), Math.max(...tyArr)];
        const effW = effBBox[2] - effBBox[0];
        const effH = effBBox[3] - effBBox[1];
        const sx = effW > 0 ? rectW / effW : 1;
        const sy = effH > 0 ? rectH / effH : 1;
        const annotTransform = [sx, 0, 0, sy, rectX0 - effBBox[0] * sx, rectY0 - effBBox[1] * sy];
        const annotFormKey = `_annot_${annotRef}`;
        forms.set(annotFormKey, { tag: annotFormKey, objNum: apObjNum, bbox: bbox.slice() });
        const syntheticOp = {
          type: "image",
          name: annotFormKey,
          ctm: annotTransform,
          fillAlpha: 1,
          strokeAlpha: 1,
          fillColor: "black"
        };
        const annotFlattened = await flattenDrawOps(
          [syntheticOp],
          images,
          forms,
          objCache,
          fonts,
          registeredFontNames,
          "",
          pageIndex,
          symbolFontTags,
          cidPUATags,
          extGStates,
          rawCharCodeTags,
          /* @__PURE__ */ new Map(),
          0,
          /* @__PURE__ */ new Set(),
          cidCollisionMap
        );
        const annotCA = resolveNumValue(annotKeys.keyText("CA"), "CA", objCache, 1);
        for (const aOp of annotFlattened) {
          if (annotCA < 1) {
            aOp.fillAlpha = (aOp.fillAlpha ?? 1) * annotCA;
            aOp.strokeAlpha = (aOp.strokeAlpha ?? 1) * annotCA;
          }
          drawOps.push(aOp);
        }
      } else {
        const highlight = highlightByRef.get(annotRef);
        if (highlight) {
          const coords = highlight.quadPoints;
          if (coords) {
            const hlColor = highlight.color ? `rgb(${Math.round(highlight.color[0] * 255)},${Math.round(highlight.color[1] * 255)},${Math.round(highlight.color[2] * 255)})` : "rgb(255,255,0)";
            for (let qi = 0; qi + 7 < coords.length; qi += 8) {
              if (highlight.subtype === "Underline" || highlight.subtype === "StrikeOut") {
                const t = highlight.subtype === "StrikeOut" ? 0.5 : 0;
                const sx = coords[qi + 4] + (coords[qi] - coords[qi + 4]) * t;
                const sy = coords[qi + 5] + (coords[qi + 1] - coords[qi + 5]) * t;
                const ex = coords[qi + 6] + (coords[qi + 2] - coords[qi + 6]) * t;
                const ey = coords[qi + 7] + (coords[qi + 3] - coords[qi + 7]) * t;
                const quadHeight = Math.hypot(coords[qi] - coords[qi + 4], coords[qi + 1] - coords[qi + 5]);
                drawOps.push({
                  type: "path",
                  commands: [{ type: "M", x: sx, y: sy }, { type: "L", x: ex, y: ey }],
                  ctm: [1, 0, 0, 1, 0, 0],
                  fill: false,
                  stroke: true,
                  evenOdd: false,
                  fillColor: hlColor,
                  strokeColor: hlColor,
                  lineWidth: Math.max(quadHeight * 0.07, 0.5),
                  lineCap: 0,
                  lineJoin: 0,
                  miterLimit: 10,
                  dashArray: [],
                  dashPhase: 0,
                  fillAlpha: 0,
                  strokeAlpha: highlight.opacity,
                  blendMode: "Normal"
                });
                continue;
              }
              const commands2 = [
                { type: "M", x: coords[qi], y: coords[qi + 1] },
                { type: "L", x: coords[qi + 2], y: coords[qi + 3] },
                { type: "L", x: coords[qi + 6], y: coords[qi + 7] },
                { type: "L", x: coords[qi + 4], y: coords[qi + 5] },
                { type: "Z" }
              ];
              drawOps.push({
                type: "path",
                commands: commands2,
                ctm: [1, 0, 0, 1, 0, 0],
                fill: true,
                stroke: false,
                evenOdd: false,
                fillColor: hlColor,
                strokeColor: "rgb(0,0,0)",
                lineWidth: 0,
                lineCap: 0,
                lineJoin: 0,
                miterLimit: 10,
                dashArray: [],
                dashPhase: 0,
                fillAlpha: 1,
                strokeAlpha: 0,
                blendMode: "Multiply"
              });
            }
          }
          continue;
        }
        if (/\/Subtype\s*\/Ink\b/.test(subtypeText)) {
          const inkListContent = resolveArrayValue(annotKeys.keyText("InkList"), "InkList", objCache);
          if (inkListContent != null) {
            const cMatchInk = /\/C\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(annotKeys.keyText("C"));
            const inkColor = cMatchInk ? `rgb(${Math.round(Number(cMatchInk[1]) * 255)},${Math.round(Number(cMatchInk[2]) * 255)},${Math.round(Number(cMatchInk[3]) * 255)})` : "rgb(0,0,0)";
            const bsInkMatch = /\/BS\s*<<([^>]*)>>/.exec(annotKeys.keyText("BS"));
            let inkWidth = 1;
            let inkDash = [];
            if (bsInkMatch) {
              const bsContent = bsInkMatch[1];
              inkWidth = resolveNumValue(bsContent, "W", objCache, 1);
              const dMatch = /\/D\s*\[\s*([\d.\s]+)\]/.exec(bsContent);
              if (dMatch) inkDash = dMatch[1].trim().split(/\s+/).map(Number);
            }
            const subArrays = [...inkListContent.matchAll(/\[([\d.\-+e\s]+)\]/g)];
            for (const subArr of subArrays) {
              const coords = subArr[1].trim().split(/\s+/).map(Number);
              if (coords.length < 4) continue;
              const commands2 = [{ type: "M", x: coords[0], y: coords[1] }];
              for (let i = 2; i < coords.length; i += 2) {
                commands2.push({ type: "L", x: coords[i], y: coords[i + 1] });
              }
              drawOps.push({
                type: "path",
                commands: commands2,
                ctm: [1, 0, 0, 1, 0, 0],
                fill: false,
                stroke: true,
                evenOdd: false,
                fillColor: "rgb(0,0,0)",
                strokeColor: inkColor,
                lineWidth: inkWidth,
                lineCap: 1,
                lineJoin: 1,
                miterLimit: 10,
                dashArray: inkDash,
                dashPhase: 0,
                fillAlpha: 1,
                strokeAlpha: 1
              });
            }
          }
          continue;
        }
        if (/\/Subtype\s*\/Widget\b/.test(subtypeText)) {
          const mkMatch = /\/MK\s*<<([\s\S]*?)>>/.exec(annotKeys.keyText("MK"));
          if (!mkMatch) continue;
          const mk = mkMatch[1];
          const parseMKColor = (key) => {
            const m = new RegExp(`\\/${key}\\s*\\[([^\\]]*)\\]`).exec(mk);
            if (!m) return null;
            const c = m[1].trim().split(/\s+/).filter((s) => s.length > 0).map(Number);
            if (c.length === 0 || c.some(Number.isNaN)) return null;
            if (c.length === 1) {
              const v = Math.round(c[0] * 255);
              return `rgb(${v},${v},${v})`;
            }
            if (c.length === 3) return `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
            if (c.length === 4) {
              const [r, g, b] = cmykToRgb(c[0], c[1], c[2], c[3]);
              return `rgb(${r},${g},${b})`;
            }
            return null;
          };
          const widgetBorderColor = parseMKColor("BC");
          const widgetBgColor = parseMKColor("BG");
          if (!widgetBorderColor && !widgetBgColor) continue;
          let widgetBorderWidth = widgetBorderColor ? 1 : 0;
          if (widgetBorderColor) {
            const bsWidgetMatch = /\/BS\s*<<([^>]*)>>/.exec(annotKeys.keyText("BS"));
            if (bsWidgetMatch) widgetBorderWidth = resolveNumValue(bsWidgetMatch[1], "W", objCache, 1);
          }
          const ftMatch = /\/FT\s*\/(\w+)/.exec(annotKeys.keyText("FT"));
          const ft = ftMatch ? ftMatch[1] : "";
          const ff = resolveIntValue(annotKeys.keyText("Ff"), "Ff", objCache, 0);
          if (ft === "Sig" || ft === "Btn" && ff & 65536) continue;
          const whw = widgetBorderWidth / 2;
          const wx0 = rect[0] + whw;
          const wy0 = rect[1] + whw;
          const wx1 = rect[2] - whw;
          const wy1 = rect[3] - whw;
          let widgetCommands;
          if (ft === "Btn" && ff & 32768) {
            const cx = (wx0 + wx1) / 2;
            const cy = (wy0 + wy1) / 2;
            const rx = (wx1 - wx0) / 2;
            const ry = (wy1 - wy0) / 2;
            const k = 0.5522847498;
            const kx = rx * k;
            const ky = ry * k;
            widgetCommands = [
              { type: "M", x: cx + rx, y: cy },
              {
                type: "C",
                x1: cx + rx,
                y1: cy + ky,
                x2: cx + kx,
                y2: cy + ry,
                x: cx,
                y: cy + ry
              },
              {
                type: "C",
                x1: cx - kx,
                y1: cy + ry,
                x2: cx - rx,
                y2: cy + ky,
                x: cx - rx,
                y: cy
              },
              {
                type: "C",
                x1: cx - rx,
                y1: cy - ky,
                x2: cx - kx,
                y2: cy - ry,
                x: cx,
                y: cy - ry
              },
              {
                type: "C",
                x1: cx + kx,
                y1: cy - ry,
                x2: cx + rx,
                y2: cy - ky,
                x: cx + rx,
                y: cy
              },
              { type: "Z" }
            ];
          } else {
            widgetCommands = [
              { type: "M", x: wx0, y: wy0 },
              { type: "L", x: wx1, y: wy0 },
              { type: "L", x: wx1, y: wy1 },
              { type: "L", x: wx0, y: wy1 },
              { type: "Z" }
            ];
          }
          drawOps.push({
            type: "path",
            commands: widgetCommands,
            ctm: [1, 0, 0, 1, 0, 0],
            fill: !!widgetBgColor,
            stroke: !!widgetBorderColor,
            evenOdd: false,
            fillColor: widgetBgColor || "rgb(255,255,255)",
            strokeColor: widgetBorderColor || "rgb(0,0,0)",
            lineWidth: widgetBorderWidth || 1,
            lineCap: 0,
            lineJoin: 0,
            miterLimit: 10,
            dashArray: [],
            dashPhase: 0,
            fillAlpha: 1,
            strokeAlpha: 1
          });
          continue;
        }
        const subtypeMatch = /\/Subtype\s*\/(Square|Circle|Polygon|PolyLine|Line)/.exec(subtypeText);
        if (!subtypeMatch) continue;
        const annotSubtype = subtypeMatch[1];
        const cMatch = /\/C\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(annotKeys.keyText("C"));
        const borderColor = cMatch ? `rgb(${Math.round(Number(cMatch[1]) * 255)},${Math.round(Number(cMatch[2]) * 255)},${Math.round(Number(cMatch[3]) * 255)})` : "rgb(0,0,0)";
        const icMatch = /\/IC\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(annotKeys.keyText("IC"));
        const hasFill = !!icMatch;
        const fillColor = icMatch ? `rgb(${Math.round(Number(icMatch[1]) * 255)},${Math.round(Number(icMatch[2]) * 255)},${Math.round(Number(icMatch[3]) * 255)})` : "rgb(0,0,0)";
        const borderMatch = /\/Border\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\]/.exec(annotKeys.keyText("Border"));
        const bsText = resolveDictValue(annotKeys.keyText("BS"), "BS", objCache);
        const bsWidth = bsText ? resolveNumValue(bsText, "W", objCache, Number.NaN) : Number.NaN;
        const borderWidth = Number.isNaN(bsWidth) ? borderMatch ? Number(borderMatch[1]) : 1 : bsWidth;
        const hw = borderWidth / 2;
        const x0 = rect[0] + hw;
        const y0 = rect[1] + hw;
        const x1 = rect[2] - hw;
        const y1 = rect[3] - hw;
        let commands;
        if (annotSubtype === "Line") {
          const lArr = resolveNumArray(annotKeys.keyText("L"), "L", objCache, null);
          if (!lArr || lArr.length < 4) continue;
          commands = [
            { type: "M", x: lArr[0], y: lArr[1] },
            { type: "L", x: lArr[2], y: lArr[3] }
          ];
        } else if (annotSubtype === "Polygon" || annotSubtype === "PolyLine") {
          const vertContent = resolveNumArray(annotKeys.keyText("Vertices"), "Vertices", objCache, null);
          if (!vertContent) continue;
          const coords = vertContent;
          if (coords.length < 4) continue;
          commands = [{ type: "M", x: coords[0], y: coords[1] }];
          for (let i = 2; i < coords.length; i += 2) {
            commands.push({ type: "L", x: coords[i], y: coords[i + 1] });
          }
          if (annotSubtype === "Polygon") commands.push({ type: "Z" });
        } else if (annotSubtype === "Square") {
          commands = [
            { type: "M", x: x0, y: y0 },
            { type: "L", x: x1, y: y0 },
            { type: "L", x: x1, y: y1 },
            { type: "L", x: x0, y: y1 },
            { type: "Z" }
          ];
        } else {
          const cx = (x0 + x1) / 2;
          const cy = (y0 + y1) / 2;
          const rx = (x1 - x0) / 2;
          const ry = (y1 - y0) / 2;
          const k = 0.5522847498;
          const kx = rx * k;
          const ky = ry * k;
          commands = [
            { type: "M", x: cx + rx, y: cy },
            {
              type: "C",
              x1: cx + rx,
              y1: cy + ky,
              x2: cx + kx,
              y2: cy + ry,
              x: cx,
              y: cy + ry
            },
            {
              type: "C",
              x1: cx - kx,
              y1: cy + ry,
              x2: cx - rx,
              y2: cy + ky,
              x: cx - rx,
              y: cy
            },
            {
              type: "C",
              x1: cx - rx,
              y1: cy - ky,
              x2: cx - kx,
              y2: cy - ry,
              x: cx,
              y: cy - ry
            },
            {
              type: "C",
              x1: cx + kx,
              y1: cy - ry,
              x2: cx + rx,
              y2: cy - ky,
              x: cx + rx,
              y: cy
            },
            { type: "Z" }
          ];
        }
        drawOps.push({
          type: "path",
          commands,
          ctm: [1, 0, 0, 1, 0, 0],
          fill: hasFill && annotSubtype !== "PolyLine" && annotSubtype !== "Line",
          stroke: true,
          evenOdd: false,
          fillColor,
          strokeColor: borderColor,
          lineWidth: borderWidth,
          lineCap: 0,
          lineJoin: 0,
          miterLimit: 10,
          dashArray: [],
          dashPhase: 0,
          fillAlpha: 1,
          strokeAlpha: 1
        });
      }
    }
  }
  const isGrayColor = (color) => {
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(color);
    return m && m[1] === m[2] && m[2] === m[3];
  };
  const t3xChecked = /* @__PURE__ */ new Set();
  if (!pageHasColor) {
    for (const op of drawOps) {
      if (op.type === "image") {
        const imgInfo = images.get(op.name);
        if (!imgInfo) continue;
        if (op.patternShading && op.patternShading.stops && op.patternShading.stops.some((stop) => !isGrayColor(stop.color))) {
          pageHasColor = true;
          break;
        }
        if (imgInfo.bitsPerComponent === 1) continue;
        const cs = imgInfo.colorSpace;
        if (cs !== "DeviceGray" && cs !== "CalGray") {
          if (cs !== "Indexed" || imgInfo.paletteBase !== "DeviceGray" && imgInfo.paletteBase !== "CalGray") {
            pageHasColor = true;
            break;
          }
        }
      } else if (op.type === "path") {
        if (op.fill && !isGrayColor(op.fillColor) || op.stroke && !isGrayColor(op.strokeColor)) {
          pageHasColor = true;
          break;
        }
        if (op.patternShading) {
          const sh = op.patternShading;
          if (sh.type === "mesh") {
            for (const patch of sh.patches) {
              for (const c of patch.colors) {
                if (c[0] !== c[1] || c[1] !== c[2]) {
                  pageHasColor = true;
                  break;
                }
              }
              if (pageHasColor) break;
            }
          } else if (sh.type === "gouraud") {
            for (const tri of sh.triangles) {
              for (const c of tri.colors) {
                if (c[0] !== c[1] || c[1] !== c[2]) {
                  pageHasColor = true;
                  break;
                }
              }
              if (pageHasColor) break;
            }
          } else if (sh.stops) {
            for (const stop of sh.stops) {
              if (!isGrayColor(stop.color)) {
                pageHasColor = true;
                break;
              }
            }
          }
          if (pageHasColor) break;
        }
      } else if (op.type === "type0text" && op.fillColor && !isGrayColor(op.fillColor)) {
        pageHasColor = true;
        break;
      } else if (op.type === "type3glyph") {
        if (op.fillColor && !isGrayColor(op.fillColor)) {
          pageHasColor = true;
          break;
        }
        if (op.type3XObjects) {
          for (const xObjNum of Object.values(op.type3XObjects)) {
            if (t3xChecked.has(xObjNum)) continue;
            t3xChecked.add(xObjNum);
            const xObjText = objCache.getObjectText(xObjNum);
            if (!xObjText || !/\/Subtype\s*\/Image/.test(xObjText)) continue;
            const ii = parseImageObject(xObjText, xObjNum, objCache);
            if (!ii || ii.imageMask || ii.bitsPerComponent === 1) continue;
            const cs = ii.colorSpace;
            if (cs !== "DeviceGray" && cs !== "CalGray" && (cs !== "Indexed" || ii.paletteBase !== "DeviceGray" && ii.paletteBase !== "CalGray")) {
              pageHasColor = true;
              break;
            }
          }
          if (pageHasColor) break;
        }
      } else if (op.type === "shading" && op.shading) {
        const sh = op.shading;
        if (sh.type === "mesh") {
          for (const patch of sh.patches) {
            for (const c of patch.colors) {
              if (c[0] !== c[1] || c[1] !== c[2]) {
                pageHasColor = true;
                break;
              }
            }
            if (pageHasColor) break;
          }
        } else if (sh.type === "gouraud") {
          for (const tri of sh.triangles) {
            for (const c of tri.colors) {
              if (c[0] !== c[1] || c[1] !== c[2]) {
                pageHasColor = true;
                break;
              }
            }
            if (pageHasColor) break;
          }
        } else if (sh.stops) {
          for (const stop of sh.stops) {
            if (!isGrayColor(stop.color)) {
              pageHasColor = true;
              break;
            }
          }
        }
        if (pageHasColor) break;
      }
    }
  }
  if (!pageHasColor) {
    for (const op of drawOps) {
      if (op.tilingPattern && op.tilingPattern.objNum) {
        const patObjText = objCache.getObjectText(op.tilingPattern.objNum);
        if (patObjText) {
          const patImgResult = parsePageImages(patObjText, objCache, { recurseForms: false });
          for (const [, imgInfo] of patImgResult.images) {
            if (imgInfo.bitsPerComponent === 1) continue;
            const cs = imgInfo.colorSpace;
            if (cs !== "DeviceGray" && cs !== "CalGray") {
              if (cs !== "Indexed" || imgInfo.paletteBase !== "DeviceGray" && imgInfo.paletteBase !== "CalGray") {
                pageHasColor = true;
                break;
              }
            }
          }
          if (!pageHasColor) {
            const patPats = parsePatterns(patObjText, objCache);
            for (const [, patInfo] of patPats) {
              if (patInfo.shading && patInfo.shading.stops) {
                for (const stop of patInfo.shading.stops) {
                  if (!isGrayColor(stop.color)) {
                    pageHasColor = true;
                    break;
                  }
                }
              }
              if (pageHasColor) break;
            }
          }
          if (!pageHasColor) {
            const patStreamBytes = objCache.getStreamBytes(op.tilingPattern.objNum);
            if (patStreamBytes) {
              const patStreamText = bytesToLatin1(patStreamBytes);
              const rgMatches = patStreamText.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(?:rg|RG)\b/g);
              for (const m of rgMatches) {
                if (m[1] !== m[2] || m[2] !== m[3]) {
                  pageHasColor = true;
                  break;
                }
              }
              if (!pageHasColor) {
                const kMatches = patStreamText.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+[kK]\b/g);
                for (const m of kMatches) {
                  if (m[1] !== "0" || m[2] !== "0" || m[3] !== "0") {
                    pageHasColor = true;
                    break;
                  }
                }
              }
            }
          }
        }
        if (pageHasColor) break;
      }
    }
  }
  if (!pageHasColor) {
    for (const op of drawOps) {
      if (op.type === "inlineImage") {
        pageHasColor = true;
        break;
      }
    }
  }
  const effectiveColorMode = pageHasColor && colorMode === "color" ? "color" : "gray";
  const maxCanvasWidth = 3500;
  const scaleReq = dpi / 72;
  const fullWidth = Math.ceil(pageWidthPts * scaleReq);
  const scale = fullWidth > maxCanvasWidth ? maxCanvasWidth / pageWidthPts : scaleReq;
  const canvasWidth = Math.ceil(pageWidthPts * scale - 1e-3);
  const canvasHeight = Math.ceil(pageHeightPts * scale - 1e-3);
  const canvas = ca.makeCanvas(canvasWidth, canvasHeight);
  const ctx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    canvas.getContext("2d", { willReadFrequently: true })
  );
  ctx.imageSmoothingQuality = "high";
  if (drawOps.length === 0) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    perf.prepMs = performance.now() - tRenderStart;
    const emptyImageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const out = {
      dataUrl: await buildPngDataUrl(emptyImageData, "gray"),
      colorMode: "gray",
      ok: true,
      perf
    };
    ca.closeDrawable(canvas);
    return out;
  }
  const tilingPatternCache = /* @__PURE__ */ new Map();
  const tileKeyOf = (ref) => {
    const base = ref.objNum != null ? `${ref.patName}#${ref.objNum}` : ref.patName;
    return ref.paintColor ? `${base}|${ref.paintColor}` : base;
  };
  const decodeInlineImage = (op) => decodeInlineImageBitmap(op, objCache, colorSpaces);
  const bitmapCache = /* @__PURE__ */ new Map();
  const smaskCanvasCache = /* @__PURE__ */ new Map();
  const transientPatterns = [];
  let textMeasureCanvas = null;
  let renderFailed = false;
  let failReason = "";
  let failDetail = "";
  const tDrawStart = performance.now();
  perf.prepMs = tDrawStart - tRenderStart;
  try {
    let applyClips = function(renderCtx, op, skipClip) {
      if (!op.clips || op.clips.length === 0) return;
      const clips = op.clips.length > 1 ? [...op.clips].sort((a, b) => (a.path ? a.path.length : 0) - (b.path ? b.path.length : 0)) : op.clips;
      for (const clip of clips) {
        if (clip === skipClip) continue;
        if (clip.textClip) continue;
        if (!clip.path) continue;
        renderCtx.setTransform(
          clip.ctm[0] * scale,
          -clip.ctm[1] * scale,
          clip.ctm[2] * scale,
          -clip.ctm[3] * scale,
          (clip.ctm[4] - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - clip.ctm[5]) * scale
        );
        renderCtx.beginPath();
        for (const cmd of clip.path) {
          if (cmd.type === "M") renderCtx.moveTo(cmd.x, cmd.y);
          else if (cmd.type === "L") renderCtx.lineTo(cmd.x, cmd.y);
          else if (cmd.type === "C") renderCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          else if (cmd.type === "Z") renderCtx.closePath();
        }
        renderCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
      }
    }, clipAxialExtend = function(renderCtx, coords, extend) {
      const [x0, y0, x1, y1] = coords;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const px = -dy;
      const py = dx;
      const perpMag = Math.sqrt(px * px + py * py) || 1;
      let extentUser = Math.max(1e4, pageWidthPts * 10, pageHeightPts * 10);
      const inv = renderCtx.getTransform().inverse();
      if (Number.isFinite(inv.a) && Number.isFinite(inv.e)) {
        let maxDist = 0;
        for (const [cx, cy] of [[0, 0], [canvasWidth, 0], [0, canvasHeight], [canvasWidth, canvasHeight]]) {
          const ux = inv.a * cx + inv.c * cy + inv.e;
          const uy = inv.b * cx + inv.d * cy + inv.f;
          const d = Math.hypot(ux - x0, uy - y0);
          if (d > maxDist) maxDist = d;
        }
        if (maxDist > 0) extentUser = maxDist * 2;
      }
      const BIG = extentUser / perpMag;
      if (!extend[0] && !extend[1]) {
        renderCtx.beginPath();
        renderCtx.moveTo(x0 + BIG * px, y0 + BIG * py);
        renderCtx.lineTo(x0 - BIG * px, y0 - BIG * py);
        renderCtx.lineTo(x1 - BIG * px, y1 - BIG * py);
        renderCtx.lineTo(x1 + BIG * px, y1 + BIG * py);
        renderCtx.closePath();
        renderCtx.clip();
      } else if (!extend[0]) {
        renderCtx.beginPath();
        renderCtx.moveTo(x0 + BIG * px, y0 + BIG * py);
        renderCtx.lineTo(x0 - BIG * px, y0 - BIG * py);
        renderCtx.lineTo(x0 - BIG * px + BIG * dx, y0 - BIG * py + BIG * dy);
        renderCtx.lineTo(x0 + BIG * px + BIG * dx, y0 + BIG * py + BIG * dy);
        renderCtx.closePath();
        renderCtx.clip();
      } else if (!extend[1]) {
        renderCtx.beginPath();
        renderCtx.moveTo(x1 + BIG * px, y1 + BIG * py);
        renderCtx.lineTo(x1 - BIG * px, y1 - BIG * py);
        renderCtx.lineTo(x1 - BIG * px - BIG * dx, y1 - BIG * py - BIG * dy);
        renderCtx.lineTo(x1 + BIG * px - BIG * dx, y1 + BIG * py - BIG * dy);
        renderCtx.closePath();
        renderCtx.clip();
      }
    }, fillRadialExtendBehind = function(renderCtx, sh) {
      if (!sh.extend || !sh.extend[0]) return;
      const [x0, y0, r0, x1, y1] = sh.coords;
      if (Math.abs(r0) > 1e-9) return;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-9) return;
      const ax = dx / len;
      const ay = dy / len;
      const px = -ay;
      const py = ax;
      const BIG = 1e6;
      renderCtx.beginPath();
      renderCtx.moveTo(x0 + BIG * px, y0 + BIG * py);
      renderCtx.lineTo(x0 - BIG * px, y0 - BIG * py);
      renderCtx.lineTo(x0 - BIG * px - BIG * ax, y0 - BIG * py - BIG * ay);
      renderCtx.lineTo(x0 + BIG * px - BIG * ax, y0 + BIG * py - BIG * ay);
      renderCtx.closePath();
      renderCtx.fillStyle = sh.stops[0].color;
      renderCtx.fill();
    }, getTextClip = function(op) {
      if (!op.clips) return null;
      for (const clip of op.clips) {
        if (clip.textClip) return clip.textClip;
      }
      return null;
    }, drawTextClipMask = function(maskCanvas, chars) {
      const mCtx = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        maskCanvas.getContext("2d", { willReadFrequently: true })
      );
      mCtx.fillStyle = "white";
      for (const ch of chars) {
        mCtx.save();
        mCtx.setTransform(
          ch.a * scale,
          -ch.b * scale,
          -ch.c * scale,
          ch.d * scale,
          (ch.x - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - ch.y) * scale
        );
        mCtx.font = /[",]/.test(ch.fontFamily) ? `1px ${ch.fontFamily}` : `1px "${ch.fontFamily}"`;
        mCtx.fillText(ch.text, 0, 0);
        mCtx.restore();
      }
    }, shiftOpBy = function(op, dxPdf, dyPdf) {
      const out = { ...op };
      if (op.clips) {
        out.clips = op.clips.map((c) => {
          const nc = {
            ...c,
            ctm: c.ctm ? [c.ctm[0], c.ctm[1], c.ctm[2], c.ctm[3], c.ctm[4] + dxPdf, c.ctm[5] + dyPdf] : c.ctm
          };
          if (c.textClip) nc.textClip = c.textClip.map((ch) => ({ ...ch, x: ch.x + dxPdf, y: ch.y + dyPdf }));
          return nc;
        });
      }
      if (op.smask && op.smask.parentCtm) {
        const pc = op.smask.parentCtm;
        out.smask = { ...op.smask, parentCtm: [pc[0], pc[1], pc[2], pc[3], pc[4] + dxPdf, pc[5] + dyPdf] };
      }
      if (Array.isArray(op.ctm) && op.ctm.length === 6) {
        out.ctm = [op.ctm[0], op.ctm[1], op.ctm[2], op.ctm[3], op.ctm[4] + dxPdf, op.ctm[5] + dyPdf];
      } else if (Array.isArray(op.transform) && op.transform.length === 6) {
        out.transform = [op.transform[0], op.transform[1], op.transform[2], op.transform[3], op.transform[4] + dxPdf, op.transform[5] + dyPdf];
      } else if (op.type === "type0text") {
        out.x = op.x + dxPdf;
        out.y = op.y + dyPdf;
      }
      return out;
    }, opDeviceBBox = function(op) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const acc = (ux, uy, m) => {
        const px = (m[0] * ux + m[2] * uy + m[4] - boxOriginX) * scale;
        const py = (pageHeightPts + boxOriginY - (m[1] * ux + m[3] * uy + m[5])) * scale;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      };
      if (op.type === "path" && op.commands && op.ctm) {
        for (const cmd of op.commands) {
          if (cmd.x != null) acc(cmd.x, cmd.y, op.ctm);
          if (cmd.x1 != null) acc(cmd.x1, cmd.y1, op.ctm);
          if (cmd.x2 != null) acc(cmd.x2, cmd.y2, op.ctm);
        }
        if (!Number.isFinite(minX)) return null;
        if (op.stroke) {
          const ctmScale = Math.sqrt(Math.abs(op.ctm[0] * op.ctm[3] - op.ctm[1] * op.ctm[2])) || 1;
          const pad = (op.lineWidth || 1) * ctmScale * scale / 2 + 2;
          minX -= pad;
          minY -= pad;
          maxX += pad;
          maxY += pad;
        }
      } else if (op.type === "image" && (op.ctm || op.transform)) {
        const m = op.ctm || op.transform;
        acc(0, 0, m);
        acc(1, 0, m);
        acc(0, 1, m);
        acc(1, 1, m);
      } else if (op.type === "type0text" && op.text && op.fontFamily) {
        if (!textMeasureCanvas) textMeasureCanvas = ca.makeCanvas(8, 8);
        const mctx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          textMeasureCanvas.getContext("2d")
        );
        mctx.font = /[",]/.test(op.fontFamily) ? `1px ${op.fontFamily}` : `1px "${op.fontFamily}"`;
        const mw = mctx.measureText(op.text).width || 0;
        let hScale = 1;
        if (op.pdfGlyphWidth !== void 0 && mw > 0) {
          hScale = op.pdfGlyphWidth / (1e3 * mw);
          if (!/^"?_pdf_/.test(op.fontFamily) && hScale > 2) hScale = 1;
        }
        const a = op.a * scale * hScale;
        const b = -op.b * scale * hScale;
        const c = -op.c * scale;
        const d = op.d * scale;
        const e = (op.x - boxOriginX) * scale;
        const f = (pageHeightPts + boxOriginY - op.y) * scale;
        for (const corner of [[-0.2, -1.3], [mw + 0.2, -1.3], [-0.2, 0.5], [mw + 0.2, 0.5]]) {
          const px = a * corner[0] + c * corner[1] + e;
          const py = b * corner[0] + d * corner[1] + f;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      } else if (op.type === "shading" && op.clips && op.clips.length) {
        let ix0 = -Infinity;
        let iy0 = -Infinity;
        let ix1 = Infinity;
        let iy1 = Infinity;
        for (const clip of op.clips) {
          if (!clip.path || !clip.ctm) return null;
          let c0x = Infinity;
          let c0y = Infinity;
          let c1x = -Infinity;
          let c1y = -Infinity;
          for (const cmd of clip.path) {
            const pts = cmd.x1 != null ? [[cmd.x1, cmd.y1], [cmd.x2, cmd.y2], [cmd.x, cmd.y]] : cmd.x != null ? [[cmd.x, cmd.y]] : [];
            for (const [ux, uy] of pts) {
              const px = (clip.ctm[0] * ux + clip.ctm[2] * uy + clip.ctm[4] - boxOriginX) * scale;
              const py = (pageHeightPts + boxOriginY - (clip.ctm[1] * ux + clip.ctm[3] * uy + clip.ctm[5])) * scale;
              if (px < c0x) c0x = px;
              if (px > c1x) c1x = px;
              if (py < c0y) c0y = py;
              if (py > c1y) c1y = py;
            }
          }
          if (!Number.isFinite(c0x)) return null;
          if (c0x > ix0) ix0 = c0x;
          if (c0y > iy0) iy0 = c0y;
          if (c1x < ix1) ix1 = c1x;
          if (c1y < iy1) iy1 = c1y;
        }
        if (ix1 <= ix0 || iy1 <= iy0) return null;
        minX = ix0;
        minY = iy0;
        maxX = ix1;
        maxY = iy1;
      } else {
        return null;
      }
      if (!Number.isFinite(minX)) return null;
      return {
        minX,
        minY,
        maxX,
        maxY
      };
    }, textClipDeviceBBox = function(chars) {
      if (!chars || chars.length === 0) return null;
      if (!textMeasureCanvas) textMeasureCanvas = ca.makeCanvas(8, 8);
      const mctx = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        textMeasureCanvas.getContext("2d")
      );
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const ch of chars) {
        mctx.font = /[",]/.test(ch.fontFamily) ? `1px ${ch.fontFamily}` : `1px "${ch.fontFamily}"`;
        const w = mctx.measureText(ch.text).width || 0;
        const corners = [[-0.2, -1.3], [w + 0.2, -1.3], [-0.2, 0.5], [w + 0.2, 0.5]];
        for (let ci = 0; ci < 4; ci++) {
          const lx = corners[ci][0];
          const ly = corners[ci][1];
          const dx = ch.a * scale * lx - ch.c * scale * ly + (ch.x - boxOriginX) * scale;
          const dy = -ch.b * scale * lx + ch.d * scale * ly + (pageHeightPts + boxOriginY - ch.y) * scale;
          if (dx < minX) minX = dx;
          if (dx > maxX) maxX = dx;
          if (dy < minY) minY = dy;
          if (dy > maxY) maxY = dy;
        }
      }
      if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
      const x = Math.max(0, Math.floor(minX) - 3);
      const y = Math.max(0, Math.floor(minY) - 3);
      const right = Math.min(canvasWidth, Math.ceil(maxX) + 3);
      const bottom = Math.min(canvasHeight, Math.ceil(maxY) + 3);
      return {
        x,
        y,
        w: right - x,
        h: bottom - y
      };
    }, renderPathOpSync = function(rCtx, op) {
      if (op.type !== "path") return false;
      if (op.stroke && (op.strokePatternShading || op.strokeTilingPattern)) return false;
      rCtx.save();
      if (op.blendMode && op.blendMode !== "Normal") {
        rCtx.globalCompositeOperation = pdfBlendToCanvas[op.blendMode] || op.blendMode.toLowerCase();
      }
      applyClips(rCtx, op);
      rCtx.setTransform(
        op.ctm[0] * scale,
        -op.ctm[1] * scale,
        op.ctm[2] * scale,
        -op.ctm[3] * scale,
        (op.ctm[4] - boxOriginX) * scale,
        (pageHeightPts + boxOriginY - op.ctm[5]) * scale
      );
      rCtx.beginPath();
      for (const cmd of op.commands) {
        switch (cmd.type) {
          case "M":
            rCtx.moveTo(cmd.x, cmd.y);
            break;
          case "L":
            rCtx.lineTo(cmd.x, cmd.y);
            break;
          case "C":
            rCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            break;
          case "Z":
            rCtx.closePath();
            break;
          default:
            break;
        }
      }
      if (op.fill) {
        rCtx.globalAlpha = op.fillAlpha;
        if (op.tilingPattern) {
          const tileCvs = tilingPatternCache.get(tileKeyOf(op.tilingPattern));
          if (tileCvs) {
            const tp = op.tilingPattern;
            const bboxW = tp.bbox[2] - tp.bbox[0];
            const bboxH = tp.bbox[3] - tp.bbox[1];
            const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]) || 1;
            const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]) || 1;
            const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
            const sx = bboxW / tileW * scale;
            const sy = bboxH / tileH * scale;
            rCtx.save();
            rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
            rCtx.setTransform(1, 0, 0, 1, 0, 0);
            const canvasPat = rCtx.createPattern(tileCvs, "repeat");
            transientPatterns.push(canvasPat);
            canvasPat.setTransform(new DOMMatrix([
              tp.matrix[0] * sx,
              -tp.matrix[1] * sx,
              -tp.matrix[2] * sy,
              tp.matrix[3] * sy,
              (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale,
              (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale
            ]));
            rCtx.fillStyle = canvasPat;
            rCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            rCtx.restore();
          } else {
            rCtx.fillStyle = op.fillColor;
            rCtx.fill(op.evenOdd ? "evenodd" : "nonzero");
          }
        } else if (op.patternShading) {
          const sh = op.patternShading;
          const bctm = op.patternBaseCTM;
          if (sh.type === "mesh") {
            rCtx.save();
            rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
            rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
            if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
            if (sh.matrix) rCtx.transform(...sh.matrix);
            renderMeshPatches(rCtx, sh.patches);
            rCtx.restore();
          } else if (sh.type === "gouraud") {
            rCtx.save();
            rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
            rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
            if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
            if (sh.matrix) rCtx.transform(...sh.matrix);
            renderGouraudTriangles(rCtx, sh.triangles, gouraudClipBounds);
            rCtx.restore();
          } else {
            rCtx.save();
            rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
            rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
            if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
            if (sh.matrix) rCtx.transform(...sh.matrix);
            if (sh.bbox) {
              rCtx.beginPath();
              rCtx.rect(sh.bbox[0], sh.bbox[1], sh.bbox[2] - sh.bbox[0], sh.bbox[3] - sh.bbox[1]);
              rCtx.clip();
            }
            if (sh.extend && (!sh.extend[0] || !sh.extend[1]) && sh.type === 2) {
              clipAxialExtend(rCtx, sh.coords, sh.extend);
            }
            let grad;
            if (sh.type === 2) {
              grad = rCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
            } else if (sh.type === 3) {
              grad = rCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
            }
            if (grad) {
              for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
              rCtx.fillStyle = grad;
              rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
            } else {
              rCtx.fillStyle = op.fillColor;
              rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
            }
            rCtx.restore();
          }
        } else {
          rCtx.fillStyle = op.fillColor;
          rCtx.fill(op.evenOdd ? "evenodd" : "nonzero");
        }
      }
      if (op.stroke) {
        rCtx.globalAlpha = op.strokeAlpha;
        rCtx.strokeStyle = op.strokeColor;
        if (op.lineWidth > 0) {
          rCtx.lineWidth = op.lineWidth;
        } else {
          const sx = Math.sqrt(op.ctm[0] * op.ctm[0] + op.ctm[1] * op.ctm[1]) * scale;
          const sy = Math.sqrt(op.ctm[2] * op.ctm[2] + op.ctm[3] * op.ctm[3]) * scale;
          rCtx.lineWidth = 1 / (Math.max(sx, sy) || 1);
        }
        rCtx.lineCap = /** @type {CanvasLineCap} */
        ["butt", "round", "square"][op.lineCap] || "butt";
        rCtx.lineJoin = /** @type {CanvasLineJoin} */
        ["miter", "round", "bevel"][op.lineJoin] || "miter";
        rCtx.miterLimit = op.miterLimit;
        if (op.dashArray.length > 0) {
          rCtx.setLineDash(op.dashArray);
          rCtx.lineDashOffset = op.dashPhase;
        }
        rCtx.stroke();
      }
      rCtx.restore();
      return true;
    };
    if (rotCtm) {
      for (const op of drawOps) {
        if (op.type === "type0text") {
          const oa = op.a;
          const ob = op.b;
          const oc = op.c;
          const od = op.d;
          const ox = op.x;
          const oy = op.y;
          op.a = rotCtm[0] * oa + rotCtm[2] * ob;
          op.b = rotCtm[1] * oa + rotCtm[3] * ob;
          op.c = rotCtm[0] * oc + rotCtm[2] * od;
          op.d = rotCtm[1] * oc + rotCtm[3] * od;
          op.x = rotCtm[0] * ox + rotCtm[2] * oy + rotCtm[4];
          op.y = rotCtm[1] * ox + rotCtm[3] * oy + rotCtm[5];
        } else if (op.ctm) {
          op.ctm = [
            rotCtm[0] * op.ctm[0] + rotCtm[2] * op.ctm[1],
            rotCtm[1] * op.ctm[0] + rotCtm[3] * op.ctm[1],
            rotCtm[0] * op.ctm[2] + rotCtm[2] * op.ctm[3],
            rotCtm[1] * op.ctm[2] + rotCtm[3] * op.ctm[3],
            rotCtm[0] * op.ctm[4] + rotCtm[2] * op.ctm[5] + rotCtm[4],
            rotCtm[1] * op.ctm[4] + rotCtm[3] * op.ctm[5] + rotCtm[5]
          ];
        }
        if (op.clips) {
          for (const clip of op.clips) {
            clip.ctm = [
              rotCtm[0] * clip.ctm[0] + rotCtm[2] * clip.ctm[1],
              rotCtm[1] * clip.ctm[0] + rotCtm[3] * clip.ctm[1],
              rotCtm[0] * clip.ctm[2] + rotCtm[2] * clip.ctm[3],
              rotCtm[1] * clip.ctm[2] + rotCtm[3] * clip.ctm[3],
              rotCtm[0] * clip.ctm[4] + rotCtm[2] * clip.ctm[5] + rotCtm[4],
              rotCtm[1] * clip.ctm[4] + rotCtm[3] * clip.ctm[5] + rotCtm[5]
            ];
          }
        }
        if (op.type === "type3glyph") {
          op.transform = [
            rotCtm[0] * op.transform[0] + rotCtm[2] * op.transform[1],
            rotCtm[1] * op.transform[0] + rotCtm[3] * op.transform[1],
            rotCtm[0] * op.transform[2] + rotCtm[2] * op.transform[3],
            rotCtm[1] * op.transform[2] + rotCtm[3] * op.transform[3],
            rotCtm[0] * op.transform[4] + rotCtm[2] * op.transform[5] + rotCtm[4],
            rotCtm[1] * op.transform[4] + rotCtm[3] * op.transform[5] + rotCtm[5]
          ];
        }
      }
      const rotatedShadings = /* @__PURE__ */ new Set();
      for (const op of drawOps) {
        const sh = op.patternShading;
        if (!sh || !sh.matrix || rotatedShadings.has(sh)) continue;
        rotatedShadings.add(sh);
        const m = sh.matrix;
        sh.matrix = [
          rotCtm[0] * m[0] + rotCtm[2] * m[1],
          rotCtm[1] * m[0] + rotCtm[3] * m[1],
          rotCtm[0] * m[2] + rotCtm[2] * m[3],
          rotCtm[1] * m[2] + rotCtm[3] * m[3],
          rotCtm[0] * m[4] + rotCtm[2] * m[5] + rotCtm[4],
          rotCtm[1] * m[4] + rotCtm[3] * m[5] + rotCtm[5]
        ];
      }
    }
    async function renderTilingPatternTile(patName, tp) {
      const cacheKey = tileKeyOf({ ...tp, patName });
      if (tilingPatternCache.has(cacheKey)) return;
      const patStreamBytes = objCache.getStreamBytes(tp.objNum);
      if (!patStreamBytes) return;
      const patStream = bytesToLatin1(patStreamBytes);
      const patObjText = objCache.getObjectText(tp.objNum);
      if (!patObjText) return;
      let patResText = patObjText;
      const patResRef = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(patObjText);
      if (patResRef) {
        const resObj = objCache.getObjectText(Number(patResRef[1]));
        if (resObj) patResText = resObj;
      }
      const patImagesResult = parsePageImages(patResText, objCache, { recurseForms: false });
      const patImages = patImagesResult.images;
      const patForms = patImagesResult.forms;
      const patFonts = parsePageFonts(patObjText, objCache);
      const patRegistered = /* @__PURE__ */ new Map();
      const patSymbolTags = /* @__PURE__ */ new Set();
      const patCidPUATags = /* @__PURE__ */ new Set();
      const patRawCharCodeTags = /* @__PURE__ */ new Set();
      for (const [fontTag, fontObj] of patFonts) {
        const familyName = pdfFontFamilyName(objCache, fontObj.fontObjNum, `pat_${patName}_${fontTag}`);
        await convertAndRegisterFont(
          fontTag,
          fontObj,
          patRegistered,
          patSymbolTags,
          patCidPUATags,
          patRawCharCodeTags,
          cidCollisionMap,
          objCache,
          familyName
        );
      }
      appendGenericFallbacks(patRegistered, patFonts);
      const fullBboxW = tp.bbox[2] - tp.bbox[0];
      const fullBboxH = tp.bbox[3] - tp.bbox[1];
      const bboxW = tp.xStep ? Math.min(fullBboxW, Math.abs(tp.xStep)) : fullBboxW;
      const bboxH = tp.yStep ? Math.min(fullBboxH, Math.abs(tp.yStep)) : fullBboxH;
      const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]);
      const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]);
      const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
      const tileCanvas = ca.makeCanvas(tileW, tileH);
      const tileCtx = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        tileCanvas.getContext("2d", { willReadFrequently: true })
      );
      const patExtGStates = parseExtGStates(patObjText, objCache);
      const patShadings = parseShadings(patObjText, objCache);
      const patPatterns = parsePatterns(patObjText, objCache);
      const patColorSpaces = parsePageColorSpaces(patObjText, objCache);
      const patRawDrawOps = parseDrawOps(
        patStream,
        patFonts,
        patExtGStates,
        patRegistered,
        patColorSpaces.size > 0 ? patColorSpaces : void 0,
        patSymbolTags,
        patCidPUATags,
        patRawCharCodeTags,
        patShadings,
        patPatterns,
        cidCollisionMap
      );
      let patDrawOps;
      if (patForms.size > 0) {
        patDrawOps = [];
        for (const op of patRawDrawOps) {
          if (op.type === "image") {
            const flattened = await flattenDrawOps(
              [op],
              patImages,
              patForms,
              objCache,
              patFonts,
              patRegistered,
              "",
              0,
              patSymbolTags,
              patCidPUATags,
              patExtGStates,
              patRawCharCodeTags,
              /* @__PURE__ */ new Map(),
              0,
              /* @__PURE__ */ new Set(),
              cidCollisionMap
            );
            for (let fi = 0; fi < flattened.length; fi++) patDrawOps.push(flattened[fi]);
          } else {
            patDrawOps.push(op);
          }
        }
      } else {
        patDrawOps = patRawDrawOps;
      }
      const tileScaleX = tileW / bboxW;
      const tileScaleY = tileH / bboxH;
      for (const pop of patDrawOps) {
        if (pop.type === "image") {
          const imgInfo = patImages.get(pop.name);
          if (!imgInfo) continue;
          const bitmap = imgInfo.imageMask ? await imageMaskToBitmap(imgInfo, tp.paintColor || pop.fillColor || "black", objCache) : await imageInfoToBitmap(imgInfo, objCache);
          tileCtx.save();
          tileCtx.setTransform(
            pop.ctm[0] * tileScaleX,
            -pop.ctm[1] * tileScaleY,
            pop.ctm[2] * tileScaleX,
            -pop.ctm[3] * tileScaleY,
            (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
            (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
          );
          tileCtx.transform(1, 0, 0, -1, 0, 1);
          tileCtx.drawImage(bitmap, 0, 0, 1, 1);
          tileCtx.restore();
          ca.closeDrawable(bitmap);
        } else if (pop.type === "inlineImage") {
          try {
            const bitmap = await decodeInlineImage(pop);
            if (bitmap) {
              tileCtx.save();
              tileCtx.setTransform(
                pop.ctm[0] * tileScaleX,
                -pop.ctm[1] * tileScaleY,
                pop.ctm[2] * tileScaleX,
                -pop.ctm[3] * tileScaleY,
                (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
                (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
              );
              tileCtx.transform(1, 0, 0, -1, 0, 1);
              tileCtx.drawImage(bitmap, 0, 0, 1, 1);
              tileCtx.restore();
              ca.closeDrawable(bitmap);
            }
          } catch {
          }
        } else if (pop.type === "path" && (pop.fill || pop.stroke)) {
          if (pop.fill) {
            let drawCtx = tileCtx;
            let tempCanvas = null;
            if (pop.smask) {
              tempCanvas = ca.makeCanvas(tileW, tileH);
              drawCtx = /** @type {OffscreenCanvasRenderingContext2D} */
              tempCanvas.getContext("2d", { willReadFrequently: true });
            }
            drawCtx.save();
            if (pop.fillAlpha < 1) drawCtx.globalAlpha = pop.fillAlpha;
            drawCtx.setTransform(
              pop.ctm[0] * tileScaleX,
              -pop.ctm[1] * tileScaleY,
              pop.ctm[2] * tileScaleX,
              -pop.ctm[3] * tileScaleY,
              (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
              (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
            );
            drawCtx.beginPath();
            for (const cmd of pop.commands) {
              switch (cmd.type) {
                case "M":
                  drawCtx.moveTo(cmd.x, cmd.y);
                  break;
                case "L":
                  drawCtx.lineTo(cmd.x, cmd.y);
                  break;
                case "C":
                  drawCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                  break;
                case "Z":
                  drawCtx.closePath();
                  break;
                default:
                  break;
              }
            }
            if (pop.tilingPattern) {
              const innerPatName = pop.tilingPattern.patName;
              const innerKey = tileKeyOf(pop.tilingPattern);
              if (pop.tilingPattern.objNum && !tilingPatternCache.has(innerKey)) {
                try {
                  await renderTilingPatternTile(innerPatName, pop.tilingPattern);
                } catch {
                }
              }
              const innerBitmap = tilingPatternCache.get(innerKey);
              if (innerBitmap) {
                drawCtx.clip(pop.evenOdd ? "evenodd" : "nonzero");
                const itp = pop.tilingPattern;
                const imatScaleX = Math.sqrt(itp.matrix[0] * itp.matrix[0] + itp.matrix[1] * itp.matrix[1]);
                const imatScaleY = Math.sqrt(itp.matrix[2] * itp.matrix[2] + itp.matrix[3] * itp.matrix[3]);
                const ibboxW = itp.bbox[2] - itp.bbox[0];
                const ibboxH = itp.bbox[3] - itp.bbox[1];
                const te0 = (itp.matrix[4] + itp.matrix[0] * itp.bbox[0] + itp.matrix[2] * (itp.bbox[1] + ibboxH) - tp.bbox[0]) * tileScaleX;
                const tf0 = (bboxH + tp.bbox[1] - itp.matrix[5] - itp.matrix[1] * itp.bbox[0] - itp.matrix[3] * (itp.bbox[1] + ibboxH)) * tileScaleY;
                const dex = itp.matrix[0] * itp.xStep * tileScaleX;
                const dfx = -itp.matrix[1] * itp.xStep * tileScaleY;
                const dey = itp.matrix[2] * itp.yStep * tileScaleX;
                const dfy = -itp.matrix[3] * itp.yStep * tileScaleY;
                const ta = itp.matrix[0] / imatScaleX;
                const tb2 = -itp.matrix[1] / imatScaleX;
                const tc2 = -itp.matrix[2] / imatScaleY;
                const td2 = itp.matrix[3] / imatScaleY;
                const stepXPx = Math.max(1, Math.sqrt(dex * dex + dfx * dfx));
                const stepYPx = Math.max(1, Math.sqrt(dey * dey + dfy * dfy));
                const repeatX = Math.ceil(tileW / stepXPx) + 2;
                const repeatY = Math.ceil(tileH / stepYPx) + 2;
                for (let ry = -repeatY; ry <= repeatY; ry++) {
                  for (let rx = -repeatX; rx <= repeatX; rx++) {
                    const te = te0 + rx * dex + ry * dey;
                    const tf = tf0 + rx * dfx + ry * dfy;
                    drawCtx.setTransform(ta, tb2, tc2, td2, te, tf);
                    drawCtx.drawImage(innerBitmap, 0, 0);
                  }
                }
              } else {
                drawCtx.fillStyle = pop.fillColor;
                drawCtx.fill(pop.evenOdd ? "evenodd" : "nonzero");
              }
            } else if (pop.patternShading) {
              const sh = pop.patternShading;
              drawCtx.clip(pop.evenOdd ? "evenodd" : "nonzero");
              if (sh.matrix) drawCtx.transform(...sh.matrix);
              if (sh.type === "mesh") {
                renderMeshPatches(drawCtx, sh.patches);
              } else if (sh.type === "gouraud") {
                renderGouraudTriangles(drawCtx, sh.triangles, null, [tileW, tileH]);
              } else {
                let grad;
                if (sh.type === 2) {
                  grad = drawCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
                } else if (sh.type === 3) {
                  grad = drawCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
                }
                if (grad) {
                  for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
                  drawCtx.fillStyle = grad;
                  drawCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
                } else {
                  drawCtx.fillStyle = pop.fillColor;
                  drawCtx.fill(pop.evenOdd ? "evenodd" : "nonzero");
                }
              }
            } else {
              drawCtx.fillStyle = pop.fillColor;
              drawCtx.fill(pop.evenOdd ? "evenodd" : "nonzero");
            }
            drawCtx.restore();
            if (pop.smask && tempCanvas) {
              const maskCanvas = await renderSMaskToCanvas(pop.smask, objCache, tileW, tileH, bboxH, tp.bbox[0], tp.bbox[1], tileScaleX);
              if (maskCanvas) {
                const tempCtx2 = (
                  /** @type {OffscreenCanvasRenderingContext2D} */
                  tempCanvas.getContext("2d", { willReadFrequently: true })
                );
                tempCtx2.globalCompositeOperation = "destination-in";
                tempCtx2.drawImage(maskCanvas, 0, 0);
                ca.closeDrawable(maskCanvas);
                tempCtx2.globalCompositeOperation = "source-over";
              }
              tileCtx.drawImage(tempCanvas, 0, 0);
              ca.closeDrawable(tempCanvas);
            }
          }
          if (pop.stroke) {
            tileCtx.save();
            if (pop.strokeAlpha < 1) tileCtx.globalAlpha = pop.strokeAlpha;
            tileCtx.setTransform(
              pop.ctm[0] * tileScaleX,
              -pop.ctm[1] * tileScaleY,
              pop.ctm[2] * tileScaleX,
              -pop.ctm[3] * tileScaleY,
              (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
              (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
            );
            tileCtx.beginPath();
            for (const cmd of pop.commands) {
              switch (cmd.type) {
                case "M":
                  tileCtx.moveTo(cmd.x, cmd.y);
                  break;
                case "L":
                  tileCtx.lineTo(cmd.x, cmd.y);
                  break;
                case "C":
                  tileCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                  break;
                case "Z":
                  tileCtx.closePath();
                  break;
                default:
                  break;
              }
            }
            tileCtx.strokeStyle = pop.strokeColor || "black";
            if (pop.lineWidth > 0) {
              tileCtx.lineWidth = pop.lineWidth;
            } else {
              const sx = Math.sqrt(pop.ctm[0] * pop.ctm[0] + pop.ctm[1] * pop.ctm[1]) * tileScaleX;
              const sy = Math.sqrt(pop.ctm[2] * pop.ctm[2] + pop.ctm[3] * pop.ctm[3]) * tileScaleY;
              tileCtx.lineWidth = 1 / (Math.max(sx, sy) || 1);
            }
            tileCtx.lineCap = /** @type {CanvasLineCap} */
            ["butt", "round", "square"][pop.lineCap] || "butt";
            tileCtx.lineJoin = /** @type {CanvasLineJoin} */
            ["miter", "round", "bevel"][pop.lineJoin] || "miter";
            if (pop.miterLimit) tileCtx.miterLimit = pop.miterLimit;
            if (pop.dashArray && pop.dashArray.length > 0) {
              tileCtx.setLineDash(pop.dashArray);
              tileCtx.lineDashOffset = pop.dashPhase || 0;
            }
            tileCtx.stroke();
            tileCtx.restore();
          }
        } else if (pop.type === "type0text" && pop.fontFamily && pop.text) {
          const isEmbedded = /^"?_pdf_/.test(pop.fontFamily);
          const weight = !isEmbedded && pop.bold ? "bold" : "normal";
          const style = !isEmbedded && pop.italic ? "italic" : "normal";
          tileCtx.save();
          tileCtx.font = /[",]/.test(pop.fontFamily) ? `${style} ${weight} 1px ${pop.fontFamily}` : `${style} ${weight} 1px "${pop.fontFamily}"`;
          tileCtx.textBaseline = "alphabetic";
          let tileHScale = 1;
          if (pop.pdfGlyphWidth !== void 0) {
            const mw = tileCtx.measureText(pop.text).width;
            if (mw > 0) {
              tileHScale = pop.pdfGlyphWidth / (1e3 * mw);
              if (!isEmbedded && tileHScale > 2) tileHScale = 1;
            }
          }
          tileCtx.setTransform(
            pop.a * tileScaleX * tileHScale,
            -pop.b * tileScaleY * tileHScale,
            -pop.c * tileScaleX,
            pop.d * tileScaleY,
            (pop.x - tp.bbox[0]) * tileScaleX,
            (bboxH + tp.bbox[1] - pop.y) * tileScaleY
          );
          tileCtx.fillStyle = pop.fillColor || "black";
          if (pop.fillAlpha < 1) tileCtx.globalAlpha = pop.fillAlpha;
          tileCtx.fillText(pop.text, 0, 0);
          tileCtx.restore();
        } else if (pop.type === "shading" && pop.shading) {
          const sh = pop.shading;
          tileCtx.save();
          if (pop.fillAlpha < 1) tileCtx.globalAlpha = pop.fillAlpha;
          if (pop.clips) {
            for (const clip of pop.clips) {
              if (clip.textClip || !clip.path) continue;
              tileCtx.setTransform(
                clip.ctm[0] * tileScaleX,
                -clip.ctm[1] * tileScaleY,
                clip.ctm[2] * tileScaleX,
                -clip.ctm[3] * tileScaleY,
                (clip.ctm[4] - tp.bbox[0]) * tileScaleX,
                (bboxH + tp.bbox[1] - clip.ctm[5]) * tileScaleY
              );
              tileCtx.beginPath();
              for (const cmd of clip.path) {
                if (cmd.type === "M") tileCtx.moveTo(cmd.x, cmd.y);
                else if (cmd.type === "L") tileCtx.lineTo(cmd.x, cmd.y);
                else if (cmd.type === "C") tileCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                else if (cmd.type === "Z") tileCtx.closePath();
              }
              tileCtx.clip(clip.evenOdd ? "evenodd" : "nonzero");
            }
          }
          tileCtx.setTransform(
            pop.ctm[0] * tileScaleX,
            -pop.ctm[1] * tileScaleY,
            pop.ctm[2] * tileScaleX,
            -pop.ctm[3] * tileScaleY,
            (pop.ctm[4] - tp.bbox[0]) * tileScaleX,
            (bboxH + tp.bbox[1] - pop.ctm[5]) * tileScaleY
          );
          if (sh.type === "mesh") {
            renderMeshPatches(tileCtx, sh.patches);
          } else if (sh.type === "gouraud") {
            renderGouraudTriangles(tileCtx, sh.triangles, null, [tileW, tileH]);
          } else if (sh.type === 2 || sh.type === 3) {
            const grad = sh.type === 2 ? tileCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]) : tileCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
            for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
            tileCtx.fillStyle = grad;
            tileCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
          }
          tileCtx.restore();
        }
      }
      const tileBitmap = await ca.createImageBitmapFromCanvas(tileCanvas);
      tilingPatternCache.set(cacheKey, tileBitmap);
    }
    for (const [patName, patInfo] of pagePatterns) {
      if (!patInfo.tiling) continue;
      try {
        await renderTilingPatternTile(patName, patInfo.tiling);
      } catch {
      }
    }
    for (const op of drawOps) {
      if (op.tilingPattern && op.tilingPattern.objNum && !tilingPatternCache.has(tileKeyOf(op.tilingPattern))) {
        try {
          await renderTilingPatternTile(op.tilingPattern.patName, op.tilingPattern);
        } catch {
        }
      }
    }
    const imageDrawCounts = /* @__PURE__ */ new Map();
    for (const op of drawOps) {
      if (op.type === "image") imageDrawCounts.set(op.name, (imageDrawCounts.get(op.name) || 0) + 1);
    }
    const glyphPathCache = /* @__PURE__ */ new Map();
    async function renderSingleOp(rCtx, op) {
      if (op.type === "image") {
        const imageInfo = images.get(op.name);
        if (!imageInfo) return;
        if (imageInfo.imageMask && op.tilingPattern) {
          const tileCvs = tilingPatternCache.get(tileKeyOf(op.tilingPattern));
          const canvasPat = tileCvs ? rCtx.createPattern(tileCvs, "repeat") : null;
          if (canvasPat) transientPatterns.push(canvasPat);
          if (canvasPat) {
            const tileMaskKey = `${op.name}|rgb(255,255,255)`;
            const cachedTileMask = bitmapCache.get(tileMaskKey);
            const maskBitmap = cachedTileMask || await imageMaskToBitmap(imageInfo, "rgb(255,255,255)", objCache);
            const imgW = Math.max(1, Math.round(Math.sqrt(op.ctm[0] * op.ctm[0] + op.ctm[1] * op.ctm[1]) * scale));
            const imgH = Math.max(1, Math.round(Math.sqrt(op.ctm[2] * op.ctm[2] + op.ctm[3] * op.ctm[3]) * scale));
            if (imgW <= 4096 && imgH <= 4096) {
              const tmpCanvas = ca.makeCanvas(imgW, imgH);
              const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
              tmpCtx.drawImage(maskBitmap, 0, 0, imgW, imgH);
              tmpCtx.globalCompositeOperation = "source-in";
              const tp = op.tilingPattern;
              const bboxW = tp.bbox[2] - tp.bbox[0];
              const bboxH = tp.bbox[3] - tp.bbox[1];
              const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]) || 1;
              const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]) || 1;
              const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
              const sx = bboxW / tileW * scale;
              const sy = bboxH / tileH * scale;
              const patOriginX = (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale;
              const patOriginY = (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale;
              const imgOriginX = (op.ctm[4] - boxOriginX) * scale;
              const imgOriginY = (pageHeightPts + boxOriginY - op.ctm[5]) * scale;
              canvasPat.setTransform(new DOMMatrix([
                tp.matrix[0] * sx,
                -tp.matrix[1] * sx,
                -tp.matrix[2] * sy,
                tp.matrix[3] * sy,
                patOriginX - imgOriginX,
                patOriginY - imgOriginY
              ]));
              tmpCtx.fillStyle = canvasPat;
              tmpCtx.fillRect(0, 0, imgW, imgH);
              rCtx.save();
              if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
              applyClips(rCtx, op);
              rCtx.setTransform(
                op.ctm[0] * scale,
                -op.ctm[1] * scale,
                op.ctm[2] * scale,
                -op.ctm[3] * scale,
                (op.ctm[4] - boxOriginX) * scale,
                (pageHeightPts + boxOriginY - op.ctm[5]) * scale
              );
              rCtx.transform(1, 0, 0, -1, 0, 1);
              rCtx.drawImage(tmpCanvas, 0, 0, 1, 1);
              ca.closeDrawable(tmpCanvas);
              rCtx.restore();
            }
            if (!cachedTileMask) ca.closeDrawable(maskBitmap);
            return;
          }
        }
        if (imageInfo.imageMask && op.patternShading && (op.patternShading.type === 2 || op.patternShading.type === 3) && op.patternShading.stops) {
          const sh = op.patternShading;
          const maskBitmap = await imageMaskToBitmap(imageInfo, "rgb(0,0,0)", objCache);
          if (maskBitmap) {
            const tmpCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
            tmpCtx.setTransform(
              op.ctm[0] * scale,
              -op.ctm[1] * scale,
              op.ctm[2] * scale,
              -op.ctm[3] * scale,
              (op.ctm[4] - boxOriginX) * scale,
              (pageHeightPts + boxOriginY - op.ctm[5]) * scale
            );
            tmpCtx.transform(1, 0, 0, -1, 0, 1);
            tmpCtx.drawImage(maskBitmap, 0, 0, 1, 1);
            tmpCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
            if (op.patternBaseCTM) tmpCtx.transform(...op.patternBaseCTM);
            if (sh.matrix) tmpCtx.transform(...sh.matrix);
            tmpCtx.globalCompositeOperation = "source-in";
            const grad = sh.type === 2 ? tmpCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]) : tmpCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
            for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
            tmpCtx.fillStyle = grad;
            tmpCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
            rCtx.save();
            if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
            applyClips(rCtx, op);
            rCtx.setTransform(1, 0, 0, 1, 0, 0);
            rCtx.drawImage(tmpCanvas, 0, 0);
            rCtx.restore();
            ca.closeDrawable(tmpCanvas);
            ca.closeDrawable(maskBitmap);
            return;
          }
        }
        const maskFillColor = op.fillColor;
        const docImgCache = objCache && objCache.decodedImageCache;
        const canDocCache = !!docImgCache && imageInfo.objNum != null;
        const docKey = canDocCache ? decodedImageKey(imageInfo.objNum, imageInfo.imageMask, maskFillColor) : "";
        let cachedBitmap = bitmapCache.get(op.name);
        if (!cachedBitmap && canDocCache) {
          const dc = docImgCache.get(docKey);
          if (dc && dc.maxW === canvasWidth && dc.maxH === canvasHeight) cachedBitmap = dc.bitmap;
        }
        let imageRoi = null;
        let decodeScale = 1;
        if (!cachedBitmap && !imageInfo.imageMask && imageInfo.filter === "DCTDecode" && imageInfo.colorSpace === "DeviceCMYK" && imageInfo.width > 0 && imageInfo.height > 0) {
          const s0 = op.ctm[0] * scale;
          const s1 = -op.ctm[1] * scale;
          const s2 = op.ctm[2] * scale;
          const s3 = -op.ctm[3] * scale;
          const s4 = (op.ctm[4] - boxOriginX) * scale;
          const s5 = (pageHeightPts + boxOriginY - op.ctm[5]) * scale;
          const W = imageInfo.width;
          const H = imageInfo.height;
          const drawW = Math.hypot(s0, s1);
          const drawH = Math.hypot(s2, s3);
          if (drawW > 0 && drawH > 0) {
            const over = Math.min(W / drawW, H / drawH);
            decodeScale = over >= 8 ? 8 : over >= 4 ? 4 : over >= 2 ? 2 : 1;
          }
          const a = s0 / W;
          const c = -s2 / H;
          const e = s2 + s4;
          const b = s1 / W;
          const d = -s3 / H;
          const f = s3 + s5;
          const det = a * d - b * c;
          if (Math.abs(det) > 1e-9) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (let corner = 0; corner < 4; corner++) {
              const gx = corner & 1 ? canvasWidth : 0;
              const gy = corner & 2 ? canvasHeight : 0;
              const ix = (d * (gx - e) - c * (gy - f)) / det;
              const iy = (a * (gy - f) - b * (gx - e)) / det;
              if (ix < minX) minX = ix;
              if (ix > maxX) maxX = ix;
              if (iy < minY) minY = iy;
              if (iy > maxY) maxY = iy;
            }
            const x0 = Math.max(0, Math.floor(minX) - 8);
            const y0 = Math.max(0, Math.floor(minY) - 8);
            const x1 = Math.min(W, Math.ceil(maxX) + 8);
            const y1 = Math.min(H, Math.ceil(maxY) + 8);
            if (x1 > x0 && y1 > y0 && (x1 - x0) * (y1 - y0) < 0.85 * W * H) {
              imageRoi = {
                x0,
                y0,
                x1,
                y1
              };
            }
          }
        }
        let decodeMs = 0;
        let bitmap = cachedBitmap;
        if (!bitmap) {
          const t0 = performance.now();
          bitmap = imageInfo.imageMask ? await imageMaskToBitmap(imageInfo, maskFillColor, objCache) : await imageInfoToBitmap(imageInfo, objCache, canvasWidth, canvasHeight, imageRoi, decodeScale);
          decodeMs = performance.now() - t0;
        }
        if (!bitmap) return;
        let aaClip = null;
        if (op.clips && op.clips.length > 0) {
          for (const clip of op.clips) {
            if (clip.textClip || !clip.path) continue;
            if (aaClip && clip.path.length <= aaClip.path.length) continue;
            const [ma, mb, mc, md] = clip.ctm;
            const diagonal = (x0, y0, x1, y1) => {
              const dx = ma * (x1 - x0) + mc * (y1 - y0);
              const dy = mb * (x1 - x0) + md * (y1 - y0);
              return Math.min(Math.abs(dx), Math.abs(dy)) > 1e-7 * Math.max(Math.abs(dx), Math.abs(dy));
            };
            let needsAa = false;
            let sx = NaN;
            let sy = NaN;
            let px = NaN;
            let py = NaN;
            for (const cmd of clip.path) {
              if (cmd.type === "C") {
                needsAa = true;
                break;
              }
              if (cmd.type === "M") {
                if (!Number.isNaN(px) && diagonal(px, py, sx, sy)) {
                  needsAa = true;
                  break;
                }
                sx = cmd.x;
                sy = cmd.y;
                px = cmd.x;
                py = cmd.y;
              } else if (cmd.type === "L") {
                if (diagonal(px, py, cmd.x, cmd.y)) {
                  needsAa = true;
                  break;
                }
                px = cmd.x;
                py = cmd.y;
              } else if (cmd.type === "Z") {
                if (diagonal(px, py, sx, sy)) {
                  needsAa = true;
                  break;
                }
                px = sx;
                py = sy;
              }
            }
            if (!needsAa && !Number.isNaN(px) && diagonal(px, py, sx, sy)) needsAa = true;
            if (needsAa) aaClip = clip;
          }
        }
        rCtx.save();
        if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
        if (op.overprint && imageInfo.colorSpace === "Separation") {
          rCtx.globalCompositeOperation = "multiply";
        } else if (op.blendMode && op.blendMode !== "Normal") {
          rCtx.globalCompositeOperation = pdfBlendToCanvas[op.blendMode] || op.blendMode.toLowerCase();
        }
        const aaPattern = aaClip ? rCtx.createPattern(bitmap, "no-repeat") : null;
        if (aaPattern) transientPatterns.push(aaPattern);
        applyClips(rCtx, op, aaPattern ? aaClip : null);
        if (aaPattern) {
          rCtx.setTransform(
            aaClip.ctm[0] * scale,
            -aaClip.ctm[1] * scale,
            aaClip.ctm[2] * scale,
            -aaClip.ctm[3] * scale,
            (aaClip.ctm[4] - boxOriginX) * scale,
            (pageHeightPts + boxOriginY - aaClip.ctm[5]) * scale
          );
          rCtx.beginPath();
          for (const cmd of aaClip.path) {
            if (cmd.type === "M") rCtx.moveTo(cmd.x, cmd.y);
            else if (cmd.type === "L") rCtx.lineTo(cmd.x, cmd.y);
            else if (cmd.type === "C") rCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            else if (cmd.type === "Z") rCtx.closePath();
          }
        }
        rCtx.setTransform(
          op.ctm[0] * scale,
          -op.ctm[1] * scale,
          op.ctm[2] * scale,
          -op.ctm[3] * scale,
          (op.ctm[4] - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - op.ctm[5]) * scale
        );
        rCtx.transform(1, 0, 0, -1, 0, 1);
        if (aaPattern) {
          aaPattern.setTransform(new DOMMatrix([1 / (bitmap.width || 1), 0, 0, 1 / (bitmap.height || 1), 0, 0]));
          rCtx.fillStyle = aaPattern;
          rCtx.fill(aaClip.evenOdd ? "evenodd" : "nonzero");
        } else {
          rCtx.drawImage(bitmap, 0, 0, 1, 1);
        }
        rCtx.restore();
        if (!cachedBitmap) {
          if (canDocCache && !imageRoi && decodeScale === 1 && decodeMs >= DECODED_IMAGE_MIN_DECODE_MS) {
            const bytes = (bitmap.width || canvasWidth) * (bitmap.height || canvasHeight) * 4;
            putDecodedImage(objCache, docKey, bitmap, canvasWidth, canvasHeight, bytes, decodeMs);
            perf.decodeMs += decodeMs;
          } else if (!imageInfo.imageMask && decodeScale === 1 && imageDrawCounts.get(op.name) > 1) {
            bitmapCache.set(op.name, bitmap);
          } else {
            ca.closeDrawable(bitmap);
          }
        }
      } else if (op.type === "type3glyph") {
        let pathData = glyphPathCache.get(op.charProcObjNum);
        if (!pathData) {
          const stBytes = objCache.getStreamBytes(op.charProcObjNum);
          if (!stBytes) return;
          pathData = parseGlyphStreamPaths(bytesToLatin1(stBytes));
          glyphPathCache.set(op.charProcObjNum, pathData);
        }
        if (pathData.doXObject && op.type3XObjects) {
          try {
            const xObjNum = op.type3XObjects[pathData.doXObject.name];
            if (xObjNum !== void 0) {
              const xObjText = objCache.getObjectText(xObjNum);
              if (xObjText && /\/Subtype\s*\/Image/.test(xObjText)) {
                const imageInfo = parseImageObject(xObjText, xObjNum, objCache);
                if (imageInfo) {
                  const bitmap = imageInfo.imageMask ? await imageMaskToBitmap(imageInfo, op.fillColor || "rgb(0,0,0)", objCache) : await imageInfoToBitmap(imageInfo, objCache, canvasWidth, canvasHeight);
                  rCtx.save();
                  if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
                  applyClips(rCtx, op);
                  rCtx.setTransform(
                    op.transform[0] * scale,
                    -op.transform[1] * scale,
                    op.transform[2] * scale,
                    -op.transform[3] * scale,
                    (op.transform[4] - boxOriginX) * scale,
                    (pageHeightPts + boxOriginY - op.transform[5]) * scale
                  );
                  rCtx.transform(pathData.doXObject.cm[0], pathData.doXObject.cm[1], pathData.doXObject.cm[2], pathData.doXObject.cm[3], pathData.doXObject.cm[4], pathData.doXObject.cm[5]);
                  rCtx.transform(1, 0, 0, -1, 0, 1);
                  rCtx.drawImage(bitmap, 0, 0, 1, 1);
                  rCtx.restore();
                  ca.closeDrawable(bitmap);
                }
              }
            }
          } catch {
          }
        } else if (pathData.inlineImage) {
          try {
            const syntheticOp = {
              dictText: pathData.inlineImage.dictText,
              imageData: pathData.inlineImage.imageData,
              fillColor: op.fillColor || "rgb(0,0,0)"
            };
            const bitmap = await decodeInlineImage(syntheticOp);
            if (bitmap) {
              rCtx.save();
              if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
              applyClips(rCtx, op);
              rCtx.setTransform(
                op.transform[0] * scale,
                -op.transform[1] * scale,
                op.transform[2] * scale,
                -op.transform[3] * scale,
                (op.transform[4] - boxOriginX) * scale,
                (pageHeightPts + boxOriginY - op.transform[5]) * scale
              );
              rCtx.transform(pathData.inlineImage.cm[0], pathData.inlineImage.cm[1], pathData.inlineImage.cm[2], pathData.inlineImage.cm[3], pathData.inlineImage.cm[4], pathData.inlineImage.cm[5]);
              rCtx.transform(1, 0, 0, -1, 0, 1);
              rCtx.drawImage(bitmap, 0, 0, 1, 1);
              rCtx.restore();
              ca.closeDrawable(bitmap);
            }
          } catch {
          }
        } else if (pathData.nestedText) {
          const nt = pathData.nestedText;
          const innerFont = fonts.get(nt.fontName);
          const innerReg = registeredFontNames.get(nt.fontName);
          if (innerFont && innerReg) {
            const sizeMat = [nt.fontSize, 0, 0, nt.fontSize, 0, 0];
            const t1 = matMul(sizeMat, nt.tm);
            const t2 = matMul(t1, nt.cm);
            const trm = matMul(t2, op.transform);
            const charCode = nt.text.charCodeAt(0);
            const unicode = innerFont.toUnicode.get(charCode) || nt.text;
            const drawText = innerFont.encodingUnicode?.get(charCode) || unicode;
            if (drawText && drawText.trim().length > 0) {
              rCtx.save();
              if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
              applyClips(rCtx, op);
              rCtx.font = /[",]/.test(innerReg) ? `1px ${innerReg}` : `1px "${innerReg}"`;
              rCtx.textBaseline = "alphabetic";
              rCtx.fillStyle = op.fillColor || "black";
              rCtx.setTransform(
                trm[0] * scale,
                -trm[1] * scale,
                -trm[2] * scale,
                trm[3] * scale,
                (trm[4] - boxOriginX) * scale,
                (pageHeightPts + boxOriginY - trm[5]) * scale
              );
              rCtx.fillText(drawText, 0, 0);
              rCtx.restore();
            }
          }
        } else if (pathData.commands.length > 0) {
          rCtx.save();
          if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
          applyClips(rCtx, op);
          rCtx.setTransform(
            op.transform[0] * scale,
            -op.transform[1] * scale,
            op.transform[2] * scale,
            -op.transform[3] * scale,
            (op.transform[4] - boxOriginX) * scale,
            (pageHeightPts + boxOriginY - op.transform[5]) * scale
          );
          rCtx.beginPath();
          for (const cmd of pathData.commands) {
            switch (cmd.type) {
              case "M":
                rCtx.moveTo(cmd.x, cmd.y);
                break;
              case "L":
                rCtx.lineTo(cmd.x, cmd.y);
                break;
              case "C":
                rCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                break;
              case "Z":
                rCtx.closePath();
                break;
              default:
                break;
            }
          }
          const mode = pathData.paintMode || "fill";
          if (mode === "fill" || mode === "fillStroke") {
            rCtx.fillStyle = pathData.fillColor || op.fillColor || "black";
            rCtx.fill(pathData.evenOdd ? "evenodd" : "nonzero");
          }
          if (mode === "stroke" || mode === "fillStroke") {
            rCtx.strokeStyle = pathData.strokeColor || op.fillColor || "black";
            const glyphToDevice = Math.sqrt(Math.abs(op.transform[0] * op.transform[3] - op.transform[1] * op.transform[2])) * scale || 1;
            rCtx.lineWidth = Math.max(pathData.lineWidth || 1, 1 / glyphToDevice);
            if (pathData.dashArray && pathData.dashArray.length > 0) {
              rCtx.setLineDash(pathData.dashArray);
              rCtx.lineDashOffset = pathData.dashPhase || 0;
            }
            rCtx.stroke();
          }
          rCtx.restore();
        }
      } else if (op.type === "type0text") {
        rCtx.save();
        if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
        applyClips(rCtx, op);
        const isEmbedded = /^"?_pdf_/.test(op.fontFamily);
        const weight = !isEmbedded && op.bold ? "bold" : "normal";
        const style = !isEmbedded && op.italic ? "italic" : "normal";
        rCtx.font = /[",]/.test(op.fontFamily) ? `${style} ${weight} 1px ${op.fontFamily}` : `${style} ${weight} 1px "${op.fontFamily}"`;
        rCtx.textBaseline = "alphabetic";
        let hScale = 1;
        if (op.pdfGlyphWidth !== void 0) {
          const measuredWidth = rCtx.measureText(op.text).width;
          if (measuredWidth > 0) {
            hScale = op.pdfGlyphWidth / (1e3 * measuredWidth);
            if (!isEmbedded && hScale > 2) hScale = 1;
          }
        }
        if (op.patternShading && op.patternShading.type === 2 && op.patternShading.extend && (!op.patternShading.extend[0] || !op.patternShading.extend[1]) && op.patternShading.coords) {
          const shExt = op.patternShading;
          rCtx.setTransform(
            scale,
            0,
            0,
            -scale,
            -boxOriginX * scale,
            (pageHeightPts + boxOriginY) * scale
          );
          if (op.patternBaseCTM) {
            rCtx.transform(op.patternBaseCTM[0], op.patternBaseCTM[1], op.patternBaseCTM[2], op.patternBaseCTM[3], op.patternBaseCTM[4], op.patternBaseCTM[5]);
          }
          if (shExt.matrix) rCtx.transform(...shExt.matrix);
          clipAxialExtend(rCtx, shExt.coords, shExt.extend);
        }
        rCtx.setTransform(
          op.a * scale * hScale,
          -op.b * scale * hScale,
          -op.c * scale,
          op.d * scale,
          (op.x - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - op.y) * scale
        );
        if (op.tilingPattern) {
          const tileCvs = tilingPatternCache.get(tileKeyOf(op.tilingPattern));
          const canvasPat = tileCvs ? rCtx.createPattern(tileCvs, "repeat") : null;
          if (canvasPat) transientPatterns.push(canvasPat);
          if (canvasPat) {
            const tp = op.tilingPattern;
            const bboxW = tp.bbox[2] - tp.bbox[0];
            const bboxH = tp.bbox[3] - tp.bbox[1];
            const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]);
            const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]);
            const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
            const sx = bboxW / tileW * scale;
            const sy = bboxH / tileH * scale;
            const dm = new DOMMatrix([
              tp.matrix[0] * sx,
              -tp.matrix[1] * sx,
              -tp.matrix[2] * sy,
              tp.matrix[3] * sy,
              (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale,
              (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale
            ]);
            const ctmNow = rCtx.getTransform();
            const composed = ctmNow.inverse().multiply(dm);
            canvasPat.setTransform(composed);
            rCtx.fillStyle = canvasPat;
          } else {
            rCtx.fillStyle = op.fillColor || "black";
          }
        } else if (op.patternShading) {
          const sh = op.patternShading;
          const det = op.a * op.d - op.b * op.c;
          if (det !== 0 && sh.coords && sh.stops) {
            const shMat = sh.matrix;
            const bctm = op.patternBaseCTM;
            const toPage = (px, py) => {
              let x = px;
              let y = py;
              if (shMat) {
                x = shMat[0] * px + shMat[2] * py + shMat[4];
                y = shMat[1] * px + shMat[3] * py + shMat[5];
              }
              if (bctm) {
                const ox = bctm[0] * x + bctm[2] * y + bctm[4];
                const oy = bctm[1] * x + bctm[3] * y + bctm[5];
                x = ox;
                y = oy;
              }
              return [x, y];
            };
            const txCoord = (px, py) => {
              const dx = px - op.x;
              const dy = op.y - py;
              return [
                (op.d * dx + op.c * dy) / (det * hScale),
                (op.a * dy + op.b * dx) / det
              ];
            };
            let grad;
            if (sh.type === 2) {
              const [px0, py0] = toPage(sh.coords[0], sh.coords[1]);
              const [px1, py1] = toPage(sh.coords[2], sh.coords[3]);
              const [x0, y0] = txCoord(px0, py0);
              const [x1, y1] = txCoord(px1, py1);
              grad = rCtx.createLinearGradient(x0, y0, x1, y1);
            } else if (sh.type === 3) {
              const [px0, py0] = toPage(sh.coords[0], sh.coords[1]);
              const [px1, py1] = toPage(sh.coords[3], sh.coords[4]);
              const [x0, y0] = txCoord(px0, py0);
              const [x1, y1] = txCoord(px1, py1);
              const shScale = shMat ? Math.sqrt(Math.abs(shMat[0] * shMat[3] - shMat[1] * shMat[2])) : 1;
              const avgScale = Math.sqrt(Math.abs(det)) * hScale / shScale;
              const r0 = sh.coords[2] / avgScale;
              const r1 = sh.coords[5] / avgScale;
              grad = rCtx.createRadialGradient(x0, y0, r0, x1, y1, r1);
            }
            if (grad) {
              for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
              rCtx.fillStyle = grad;
            } else {
              rCtx.fillStyle = op.fillColor || "black";
            }
          } else {
            rCtx.fillStyle = op.fillColor || "black";
          }
        } else {
          rCtx.fillStyle = op.fillColor || "black";
        }
        const trMode = op.textRenderMode || 0;
        if (trMode === 0 || trMode === 2) {
          rCtx.fillText(op.text, 0, 0);
        }
        if (trMode === 1 || trMode === 2) {
          rCtx.strokeStyle = op.strokeColor || "black";
          if (op.strokeAlpha < 1) rCtx.globalAlpha = op.strokeAlpha;
          rCtx.lineWidth = op.lineWidth / (Math.sqrt(op.a * op.a + op.b * op.b) || 1);
          rCtx.strokeText(op.text, 0, 0);
        }
        rCtx.restore();
      } else if (op.type === "path") {
        rCtx.save();
        if (op.blendMode && op.blendMode !== "Normal") {
          rCtx.globalCompositeOperation = pdfBlendToCanvas[op.blendMode] || op.blendMode.toLowerCase();
        }
        applyClips(rCtx, op);
        rCtx.setTransform(
          op.ctm[0] * scale,
          -op.ctm[1] * scale,
          op.ctm[2] * scale,
          -op.ctm[3] * scale,
          (op.ctm[4] - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - op.ctm[5]) * scale
        );
        rCtx.beginPath();
        for (const cmd of op.commands) {
          switch (cmd.type) {
            case "M":
              rCtx.moveTo(cmd.x, cmd.y);
              break;
            case "L":
              rCtx.lineTo(cmd.x, cmd.y);
              break;
            case "C":
              rCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
              break;
            case "Z":
              rCtx.closePath();
              break;
            default:
              break;
          }
        }
        if (op.fill) {
          rCtx.globalAlpha = op.fillAlpha;
          if (op.patternShading) {
            const sh = op.patternShading;
            const bctm = op.patternBaseCTM;
            if (sh.type === "mesh") {
              rCtx.save();
              rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
              rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
              if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
              if (sh.matrix) rCtx.transform(...sh.matrix);
              renderMeshPatches(rCtx, sh.patches);
              rCtx.restore();
            } else if (sh.type === "gouraud") {
              rCtx.save();
              rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
              rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
              if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
              if (sh.matrix) rCtx.transform(...sh.matrix);
              renderGouraudTriangles(rCtx, sh.triangles, gouraudClipBounds);
              rCtx.restore();
            } else {
              rCtx.save();
              rCtx.clip(op.evenOdd ? "evenodd" : "nonzero");
              rCtx.setTransform(scale, 0, 0, -scale, -boxOriginX * scale, (pageHeightPts + boxOriginY) * scale);
              if (bctm) rCtx.transform(bctm[0], bctm[1], bctm[2], bctm[3], bctm[4], bctm[5]);
              if (sh.matrix) rCtx.transform(...sh.matrix);
              if (sh.bbox) {
                rCtx.beginPath();
                rCtx.rect(sh.bbox[0], sh.bbox[1], sh.bbox[2] - sh.bbox[0], sh.bbox[3] - sh.bbox[1]);
                rCtx.clip();
              }
              if (sh.extend && (!sh.extend[0] || !sh.extend[1]) && sh.type === 2) {
                clipAxialExtend(rCtx, sh.coords, sh.extend);
              }
              let grad;
              if (sh.type === 2) {
                grad = rCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
              } else if (sh.type === 3) {
                grad = rCtx.createRadialGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3], sh.coords[4], sh.coords[5]);
              }
              if (grad) {
                for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
                rCtx.fillStyle = grad;
                rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
              } else {
                rCtx.fillStyle = op.fillColor;
                rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
              }
              rCtx.restore();
            }
          } else {
            rCtx.fillStyle = op.fillColor;
            rCtx.fill(op.evenOdd ? "evenodd" : "nonzero");
          }
        }
        if (op.stroke) {
          rCtx.globalAlpha = op.strokeAlpha;
          let strokeStyleVal = op.strokeColor;
          if (op.strokePatternShading) {
            const sh = op.strokePatternShading;
            if ((sh.type === 2 || sh.type === 3) && sh.coords && sh.stops) {
              const m = sh.matrix || [1, 0, 0, 1, 0, 0];
              const bm = op.patternBaseCTM;
              const userX = (px, py) => {
                const ux = m[0] * px + m[2] * py + m[4];
                const uy = m[1] * px + m[3] * py + m[5];
                if (bm) {
                  return [bm[0] * ux + bm[2] * uy + bm[4], bm[1] * ux + bm[3] * uy + bm[5]];
                }
                return [ux, uy];
              };
              const opM = op.ctm;
              const det = opM[0] * opM[3] - opM[1] * opM[2];
              const invOp = det !== 0 ? [
                opM[3] / det,
                -opM[1] / det,
                -opM[2] / det,
                opM[0] / det,
                (opM[2] * opM[5] - opM[3] * opM[4]) / det,
                (opM[1] * opM[4] - opM[0] * opM[5]) / det
              ] : [1, 0, 0, 1, 0, 0];
              const localCoord = (ux, uy) => [
                invOp[0] * ux + invOp[2] * uy + invOp[4],
                invOp[1] * ux + invOp[3] * uy + invOp[5]
              ];
              let grad;
              if (sh.type === 2) {
                const [u0x, u0y] = userX(sh.coords[0], sh.coords[1]);
                const [u1x, u1y] = userX(sh.coords[2], sh.coords[3]);
                const [lx0, ly0] = localCoord(u0x, u0y);
                const [lx1, ly1] = localCoord(u1x, u1y);
                grad = rCtx.createLinearGradient(lx0, ly0, lx1, ly1);
              } else {
                const [u0x, u0y] = userX(sh.coords[0], sh.coords[1]);
                const [u1x, u1y] = userX(sh.coords[3], sh.coords[4]);
                const [lx0, ly0] = localCoord(u0x, u0y);
                const [lx1, ly1] = localCoord(u1x, u1y);
                const avgScale = Math.sqrt(Math.abs(det)) * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
                grad = rCtx.createRadialGradient(lx0, ly0, sh.coords[2] / avgScale, lx1, ly1, sh.coords[5] / avgScale);
              }
              for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
              strokeStyleVal = grad;
            }
          } else if (op.strokeTilingPattern) {
            const tileCvs = tilingPatternCache.get(tileKeyOf(op.strokeTilingPattern));
            if (tileCvs) {
              const tp = op.strokeTilingPattern;
              const bboxW = tp.bbox[2] - tp.bbox[0];
              const bboxH = tp.bbox[3] - tp.bbox[1];
              const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]) || 1;
              const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]) || 1;
              const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
              const sx = bboxW / tileW * scale;
              const sy = bboxH / tileH * scale;
              const canvasPat = rCtx.createPattern(tileCvs, "repeat");
              transientPatterns.push(canvasPat);
              const dm = new DOMMatrix([
                tp.matrix[0] * sx,
                -tp.matrix[1] * sx,
                -tp.matrix[2] * sy,
                tp.matrix[3] * sy,
                (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale,
                (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale
              ]);
              const ctmNow = rCtx.getTransform();
              canvasPat.setTransform(ctmNow.inverse().multiply(dm));
              strokeStyleVal = canvasPat;
            }
          }
          rCtx.strokeStyle = strokeStyleVal;
          if (op.lineWidth > 0) {
            rCtx.lineWidth = op.lineWidth;
          } else {
            const sx = Math.sqrt(op.ctm[0] * op.ctm[0] + op.ctm[1] * op.ctm[1]) * scale;
            const sy = Math.sqrt(op.ctm[2] * op.ctm[2] + op.ctm[3] * op.ctm[3]) * scale;
            rCtx.lineWidth = 1 / (Math.max(sx, sy) || 1);
          }
          rCtx.lineCap = /** @type {CanvasLineCap} */
          ["butt", "round", "square"][op.lineCap] || "butt";
          rCtx.lineJoin = /** @type {CanvasLineJoin} */
          ["miter", "round", "bevel"][op.lineJoin] || "miter";
          rCtx.miterLimit = op.miterLimit;
          if (op.dashArray.length > 0) {
            rCtx.setLineDash(op.dashArray);
            rCtx.lineDashOffset = op.dashPhase;
          }
          rCtx.stroke();
        }
        rCtx.restore();
      } else if (op.type === "shading") {
        const sh = op.shading;
        if (!sh) return;
        rCtx.save();
        if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
        if (op.blendMode && op.blendMode !== "Normal") {
          rCtx.globalCompositeOperation = pdfBlendToCanvas[op.blendMode] || op.blendMode.toLowerCase();
        }
        applyClips(rCtx, op);
        rCtx.setTransform(
          op.ctm[0] * scale,
          -op.ctm[1] * scale,
          op.ctm[2] * scale,
          -op.ctm[3] * scale,
          (op.ctm[4] - boxOriginX) * scale,
          (pageHeightPts + boxOriginY - op.ctm[5]) * scale
        );
        if (sh.type === 2) {
          if (sh.bbox) {
            rCtx.beginPath();
            rCtx.rect(sh.bbox[0], sh.bbox[1], sh.bbox[2] - sh.bbox[0], sh.bbox[3] - sh.bbox[1]);
            rCtx.clip();
          }
          if (sh.extend && (!sh.extend[0] || !sh.extend[1])) {
            clipAxialExtend(rCtx, sh.coords, sh.extend);
          }
          const grad = rCtx.createLinearGradient(sh.coords[0], sh.coords[1], sh.coords[2], sh.coords[3]);
          for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
          rCtx.fillStyle = grad;
          rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
        } else if (sh.type === 3) {
          if (sh.bbox) {
            rCtx.beginPath();
            rCtx.rect(sh.bbox[0], sh.bbox[1], sh.bbox[2] - sh.bbox[0], sh.bbox[3] - sh.bbox[1]);
            rCtx.clip();
          }
          fillRadialExtendBehind(rCtx, sh);
          const grad = rCtx.createRadialGradient(
            sh.coords[0],
            sh.coords[1],
            sh.coords[2],
            sh.coords[3],
            sh.coords[4],
            sh.coords[5]
          );
          for (const stop of sh.stops) grad.addColorStop(stop.offset, stop.color);
          rCtx.fillStyle = grad;
          rCtx.fillRect(-1e9, -1e9, 2e9, 2e9);
        } else if (sh.type === "mesh") {
          renderMeshPatches(rCtx, sh.patches);
        } else if (sh.type === "gouraud") {
          renderGouraudTriangles(rCtx, sh.triangles, null, [canvasWidth, canvasHeight]);
        }
        rCtx.restore();
      } else if (op.type === "inlineImage") {
        try {
          if (Math.abs(op.ctm[0] * op.ctm[3] - op.ctm[1] * op.ctm[2]) < 1e-9) {
          } else if (op.tilingPattern) {
            const tileCvs = tilingPatternCache.get(tileKeyOf(op.tilingPattern));
            const canvasPat = tileCvs ? rCtx.createPattern(tileCvs, "repeat") : null;
            if (canvasPat) transientPatterns.push(canvasPat);
            const maskOp = { ...op, fillColor: "rgb(255,255,255)" };
            const maskBitmap = canvasPat ? await decodeInlineImage(maskOp) : null;
            if (maskBitmap && canvasPat) {
              const imgW = Math.max(1, Math.round(Math.sqrt(op.ctm[0] * op.ctm[0] + op.ctm[1] * op.ctm[1]) * scale));
              const imgH = Math.max(1, Math.round(Math.sqrt(op.ctm[2] * op.ctm[2] + op.ctm[3] * op.ctm[3]) * scale));
              if (imgW <= 4096 && imgH <= 4096) {
                const tmpCanvas = ca.makeCanvas(imgW, imgH);
                const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
                tmpCtx.drawImage(maskBitmap, 0, 0, imgW, imgH);
                tmpCtx.globalCompositeOperation = "source-in";
                const tp = op.tilingPattern;
                const bboxW = tp.bbox[2] - tp.bbox[0];
                const bboxH = tp.bbox[3] - tp.bbox[1];
                const matScaleX = Math.sqrt(tp.matrix[0] * tp.matrix[0] + tp.matrix[1] * tp.matrix[1]) || 1;
                const matScaleY = Math.sqrt(tp.matrix[2] * tp.matrix[2] + tp.matrix[3] * tp.matrix[3]) || 1;
                const { tileW, tileH } = tilingTilePixelDims(bboxW, bboxH, matScaleX, matScaleY, scale);
                const sx = bboxW / tileW * scale;
                const sy = bboxH / tileH * scale;
                const patOriginX = (tp.matrix[0] * tp.bbox[0] + tp.matrix[2] * (tp.bbox[1] + bboxH) + tp.matrix[4] - boxOriginX) * scale;
                const patOriginY = (pageHeightPts + boxOriginY - tp.matrix[1] * tp.bbox[0] - tp.matrix[3] * (tp.bbox[1] + bboxH) - tp.matrix[5]) * scale;
                const imgOriginX = (op.ctm[4] - boxOriginX) * scale;
                const imgOriginY = (pageHeightPts + boxOriginY - op.ctm[5]) * scale;
                canvasPat.setTransform(new DOMMatrix([
                  tp.matrix[0] * sx,
                  -tp.matrix[1] * sx,
                  -tp.matrix[2] * sy,
                  tp.matrix[3] * sy,
                  patOriginX - imgOriginX,
                  patOriginY - imgOriginY
                ]));
                tmpCtx.fillStyle = canvasPat;
                tmpCtx.fillRect(0, 0, imgW, imgH);
                rCtx.save();
                if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
                applyClips(rCtx, op);
                rCtx.setTransform(
                  op.ctm[0] * scale,
                  -op.ctm[1] * scale,
                  op.ctm[2] * scale,
                  -op.ctm[3] * scale,
                  (op.ctm[4] - boxOriginX) * scale,
                  (pageHeightPts + boxOriginY - op.ctm[5]) * scale
                );
                rCtx.transform(1, 0, 0, -1, 0, 1);
                rCtx.drawImage(tmpCanvas, 0, 0, 1, 1);
                ca.closeDrawable(tmpCanvas);
                rCtx.restore();
              }
              ca.closeDrawable(maskBitmap);
            }
          } else {
            const bitmap = await decodeInlineImage(op);
            if (bitmap) {
              rCtx.save();
              if (op.fillAlpha < 1) rCtx.globalAlpha = op.fillAlpha;
              if (bitmap.width <= 256 && bitmap.height <= 256) {
                rCtx.imageSmoothingEnabled = false;
              }
              applyClips(rCtx, op);
              rCtx.setTransform(
                op.ctm[0] * scale,
                -op.ctm[1] * scale,
                op.ctm[2] * scale,
                -op.ctm[3] * scale,
                (op.ctm[4] - boxOriginX) * scale,
                (pageHeightPts + boxOriginY - op.ctm[5]) * scale
              );
              rCtx.transform(1, 0, 0, -1, 0, 1);
              rCtx.drawImage(bitmap, 0, 0, 1, 1);
              rCtx.restore();
              ca.closeDrawable(bitmap);
            }
          }
        } catch {
        }
      }
    }
    let gouraudClipBounds = null;
    {
      for (const op of drawOps) {
        if (op.type !== "path" || !op.patternShading || op.patternShading.type !== "gouraud") continue;
        const clipEntry = op.clips?.[op.clips.length - 1];
        if (clipEntry?.path && clipEntry.ctm) {
          const ct = clipEntry.ctm;
          let x0 = Infinity;
          let y0 = Infinity;
          let x1 = -Infinity;
          let y1 = -Infinity;
          for (const cmd of clipEntry.path) {
            if (cmd.x == null) continue;
            const px = (ct[0] * cmd.x + ct[2] * cmd.y + ct[4] - boxOriginX) * scale;
            const py = (pageHeightPts + boxOriginY - ct[1] * cmd.x - ct[3] * cmd.y - ct[5]) * scale;
            if (px < x0) x0 = px;
            if (px > x1) x1 = px;
            if (py < y0) y0 = py;
            if (py > y1) y1 = py;
          }
          gouraudClipBounds = [
            Math.max(0, Math.floor(x0)),
            Math.max(0, Math.floor(y0)),
            Math.min(canvasWidth, Math.ceil(x1)),
            Math.min(canvasHeight, Math.ceil(y1))
          ];
        }
        break;
      }
    }
    const opGroups = [];
    {
      let prevKey = "";
      for (const op of drawOps) {
        const outerSmask = op.outerSmask || null;
        const smask = op.smask || null;
        const groupId = op.groupId || null;
        const groupKey = groupId !== null ? `g:${groupId}` : "";
        const smaskKey = outerSmask ? `outer:${outerSmask.formObjNum}` : smask ? String(smask.formObjNum) : "";
        const key = `${groupKey}|${smaskKey}`;
        if (key !== prevKey || opGroups.length === 0) {
          opGroups.push({
            smask: outerSmask || smask,
            outerSmask,
            groupId,
            ops: [op]
          });
          prevKey = key;
        } else {
          opGroups[opGroups.length - 1].ops.push(op);
        }
      }
    }
    async function renderOpsWithInnerSmask(targetCtx, ops) {
      const subGroups = [];
      let prevKey = "";
      for (const op of ops) {
        const smask = op.smask || null;
        const key = smask ? String(smask.formObjNum) : "";
        if (key !== prevKey || subGroups.length === 0) {
          subGroups.push({ smask, ops: [op] });
          prevKey = key;
        } else {
          subGroups[subGroups.length - 1].ops.push(op);
        }
      }
      for (const sub of subGroups) {
        let subCtx = targetCtx;
        let subCanvas = null;
        if (sub.smask) {
          subCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
          subCtx = /** @type {OffscreenCanvasRenderingContext2D} */
          subCanvas.getContext("2d", { willReadFrequently: true });
        }
        for (const op of sub.ops) {
          const textClipCharsForOp = getTextClip(op);
          const savedCtx = subCtx;
          let textClipCanvas = null;
          if (textClipCharsForOp) {
            textClipCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            subCtx = /** @type {OffscreenCanvasRenderingContext2D} */
            textClipCanvas.getContext("2d", { willReadFrequently: true });
          }
          if (!renderPathOpSync(subCtx, op)) await renderSingleOp(subCtx, op);
          if (textClipCanvas && textClipCharsForOp) {
            const mCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            drawTextClipMask(mCanvas, textClipCharsForOp);
            subCtx.globalCompositeOperation = "destination-in";
            subCtx.drawImage(mCanvas, 0, 0);
            ca.closeDrawable(mCanvas);
            subCtx.globalCompositeOperation = "source-over";
            subCtx = savedCtx;
            subCtx.drawImage(textClipCanvas, 0, 0);
            ca.closeDrawable(textClipCanvas);
          } else if (textClipCharsForOp) {
            subCtx = savedCtx;
          }
        }
        if (sub.smask && subCanvas) {
          const cacheKey = `${sub.smask.formObjNum}:${sub.smask.parentCtm ? sub.smask.parentCtm.join(",") : ""}`;
          let maskCanvas = smaskCanvasCache.get(cacheKey);
          if (!maskCanvas) {
            maskCanvas = await renderSMaskToCanvas(sub.smask, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale);
            if (maskCanvas) smaskCanvasCache.set(cacheKey, maskCanvas);
          }
          if (maskCanvas) {
            subCtx.globalCompositeOperation = "destination-in";
            subCtx.drawImage(maskCanvas, 0, 0);
            subCtx.globalCompositeOperation = "source-over";
          }
          const subBlend = sub.ops[0]?.blendMode;
          if (subBlend && subBlend !== "Normal") {
            targetCtx.globalCompositeOperation = pdfBlendToCanvas[subBlend] || subBlend.toLowerCase();
          }
          targetCtx.drawImage(subCanvas, 0, 0);
          ca.closeDrawable(subCanvas);
          if (subBlend && subBlend !== "Normal") {
            targetCtx.globalCompositeOperation = "source-over";
          }
        }
      }
    }
    const ctxStack = [{
      ctx,
      canvas: null,
      groupId: null,
      offX: 0,
      offY: 0,
      w: canvasWidth,
      h: canvasHeight
    }];
    let compositeFlushCounter = 0;
    const flushComposites = () => {
      if (++compositeFlushCounter % 12 !== 0) return;
      for (let i = 0; i < ctxStack.length; i++) ctxStack[i].ctx.getImageData(0, 0, 1, 1);
    };
    const popAndComposite = async () => {
      const top = ctxStack.pop();
      if (!top || top.groupId == null) return;
      const parent = ctxStack[ctxStack.length - 1];
      const attrs = groupContext.registry.get(top.groupId);
      if (!attrs) {
        ca.closeDrawable(top.canvas);
        return;
      }
      if (attrs.smask) {
        const isTight = top.w < canvasWidth || top.h < canvasHeight;
        let maskCanvas;
        if (isTight) {
          maskCanvas = await renderSMaskToCanvas(attrs.smask, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale, {
            x: top.offX,
            y: top.offY,
            width: top.w,
            height: top.h
          });
        } else {
          const cacheKey = `${attrs.smask.formObjNum}:${attrs.smask.parentCtm ? attrs.smask.parentCtm.join(",") : ""}`;
          maskCanvas = smaskCanvasCache.get(cacheKey);
          if (!maskCanvas) {
            maskCanvas = await renderSMaskToCanvas(attrs.smask, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale);
            if (maskCanvas) smaskCanvasCache.set(cacheKey, maskCanvas);
          }
        }
        if (maskCanvas) {
          top.ctx.globalCompositeOperation = "destination-in";
          top.ctx.drawImage(maskCanvas, 0, 0);
          top.ctx.globalCompositeOperation = "source-over";
          if (isTight) ca.closeDrawable(maskCanvas);
        }
      }
      parent.ctx.save();
      if (attrs.fillAlpha != null && attrs.fillAlpha < 1) parent.ctx.globalAlpha = attrs.fillAlpha;
      if (attrs.blendMode && attrs.blendMode !== "Normal") {
        parent.ctx.globalCompositeOperation = pdfBlendToCanvas[attrs.blendMode] || attrs.blendMode.toLowerCase();
      }
      parent.ctx.drawImage(top.canvas, top.offX - parent.offX, top.offY - parent.offY);
      parent.ctx.restore();
      ca.closeDrawable(top.canvas);
      flushComposites();
    };
    const getGroupChain = (groupId) => {
      const chain = [];
      let g = groupId;
      while (g != null) {
        chain.unshift(g);
        const a = groupContext.registry.get(g);
        g = a ? a.parentGroupId : null;
      }
      return chain;
    };
    async function compositeTightSmaskGroup(ops, smask, bx, by, bw, bh) {
      const mask = await renderSMaskToCanvas(
        smask,
        objCache,
        canvasWidth,
        canvasHeight,
        pageHeightPts,
        boxOriginX,
        boxOriginY,
        scale,
        {
          x: bx,
          y: by,
          width: bw,
          height: bh
        }
      );
      if (!mask) return false;
      const tightCanvas = ca.makeCanvas(bw, bh);
      const tightCtx = (
        /** @type {OffscreenCanvasRenderingContext2D} */
        tightCanvas.getContext("2d", { willReadFrequently: true })
      );
      const dx = -bx / scale;
      const dy = by / scale;
      for (const op of ops) {
        const shiftedOp = shiftOpBy(op, dx, dy);
        if (!renderPathOpSync(tightCtx, shiftedOp)) await renderSingleOp(tightCtx, shiftedOp);
      }
      tightCtx.globalCompositeOperation = "destination-in";
      tightCtx.drawImage(mask, 0, 0);
      ca.closeDrawable(mask);
      tightCtx.globalCompositeOperation = "source-over";
      const entry = ctxStack[ctxStack.length - 1];
      const blend = ops.length > 0 && ops[0].blendMode;
      if (blend && blend !== "Normal") entry.ctx.globalCompositeOperation = pdfBlendToCanvas[blend] || blend.toLowerCase();
      entry.ctx.drawImage(tightCanvas, bx - entry.offX, by - entry.offY);
      ca.closeDrawable(tightCanvas);
      if (blend && blend !== "Normal") entry.ctx.globalCompositeOperation = "source-over";
      return true;
    }
    async function smaskOutsideZeroContentBBox(smaskInfo) {
      const trFn = smaskInfo.tr || null;
      const clamp01 = (v) => Math.max(0, Math.min(1, v));
      let outsideByte;
      if (smaskInfo.type === "Alpha") {
        let outAlpha = 0;
        if (trFn) {
          const out = evaluateFunction(trFn, [0]);
          outAlpha = out && out.length > 0 ? out[0] : 0;
        }
        outsideByte = Math.round(clamp01(outAlpha) * 255);
      } else {
        const bc = smaskInfo.bc;
        let r = 0;
        let g = 0;
        let b = 0;
        if (bc && bc.length === 1) {
          r = Math.round(clamp01(bc[0]) * 255);
          g = r;
          b = r;
        } else if (bc && bc.length === 3) {
          r = Math.round(bc[0] * 255);
          g = Math.round(bc[1] * 255);
          b = Math.round(bc[2] * 255);
        } else if (bc && bc.length === 4) {
          [r, g, b] = cmykToRgb(bc[0], bc[1], bc[2], bc[3]);
        }
        const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        let outAlpha = luminosity;
        if (trFn) {
          const out = evaluateFunction(trFn, [Math.round(luminosity * 255) / 255]);
          outAlpha = out && out.length > 0 ? out[0] : luminosity;
        }
        outsideByte = Math.round(clamp01(outAlpha) * 255);
      }
      if (outsideByte !== 0) return null;
      const formObjText = objCache.getObjectText(smaskInfo.formObjNum);
      if (!formObjText) return null;
      const streamBytes = objCache.getStreamBytes(smaskInfo.formObjNum);
      if (!streamBytes) return null;
      const { forms: maskForms } = parsePageImages(formObjText, objCache, { recurseForms: true });
      if (maskForms.size > 0) return null;
      const maskExtGStates = parseExtGStates(formObjText, objCache);
      const maskShadings = parseShadings(formObjText, objCache);
      const maskPatterns = parsePatterns(formObjText, objCache);
      const maskColorSpaces = parsePageColorSpaces(formObjText, objCache);
      const maskOps = parseDrawOps(
        bytesToLatin1(streamBytes),
        /* @__PURE__ */ new Map(),
        maskExtGStates,
        /* @__PURE__ */ new Map(),
        maskColorSpaces,
        /* @__PURE__ */ new Set(),
        /* @__PURE__ */ new Set(),
        /* @__PURE__ */ new Set(),
        maskShadings,
        maskPatterns,
        /* @__PURE__ */ new Map()
      );
      const formMatrix = parseFormMatrix(formObjText, objCache);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const op of maskOps) {
        const oa = (
          /** @type {any} */
          op
        );
        if (oa.patternShading || oa.tilingPattern || oa.strokePatternShading || oa.strokeTilingPattern || oa.smask) return null;
        let composed = op;
        if (oa.ctm || oa.clips) {
          composed = { ...op };
          if (oa.ctm) {
            let ctm = matMul(oa.ctm, formMatrix);
            if (smaskInfo.parentCtm && smaskInfo.parentCtm.length === 6) ctm = matMul(ctm, smaskInfo.parentCtm);
            composed.ctm = ctm;
          }
          if (oa.clips) {
            composed.clips = oa.clips.map((c) => {
              let cctm = c.ctm ? matMul(c.ctm, formMatrix) : c.ctm;
              if (cctm && smaskInfo.parentCtm && smaskInfo.parentCtm.length === 6) cctm = matMul(cctm, smaskInfo.parentCtm);
              return { ...c, ctm: cctm };
            });
          }
        }
        const bb = opDeviceBBox(composed);
        if (!bb) return null;
        if (bb.minX < minX) minX = bb.minX;
        if (bb.minY < minY) minY = bb.minY;
        if (bb.maxX > maxX) maxX = bb.maxX;
        if (bb.maxY > maxY) maxY = bb.maxY;
      }
      if (!Number.isFinite(minX)) return null;
      const x = Math.max(0, Math.floor(minX) - 2);
      const y = Math.max(0, Math.floor(minY) - 2);
      const w = Math.min(canvasWidth, Math.ceil(maxX) + 2) - x;
      const h = Math.min(canvasHeight, Math.ceil(maxY) + 2) - y;
      if (w <= 0 || h <= 0 || w * h >= canvasWidth * canvasHeight) return null;
      return {
        x,
        y,
        w,
        h
      };
    }
    const groupTightBBox = /* @__PURE__ */ new Map();
    {
      const acc = /* @__PURE__ */ new Map();
      for (const og of opGroups) {
        if (og.groupId == null) continue;
        const chain = getGroupChain(og.groupId);
        for (const dop of og.ops) {
          const bb = opDeviceBBox(dop);
          const dpAny = (
            /** @type {any} */
            dop
          );
          const untightable = !!(dop.outerSmask || dop.patternShading || dop.tilingPattern || dpAny.strokePatternShading || dpAny.strokeTilingPattern);
          for (const g of chain) {
            let e = acc.get(g);
            if (!e) {
              e = {
                minX: Infinity,
                minY: Infinity,
                maxX: -Infinity,
                maxY: -Infinity,
                ok: true
              };
              acc.set(g, e);
            }
            if (!bb || untightable) {
              e.ok = false;
              continue;
            }
            if (bb.minX < e.minX) e.minX = bb.minX;
            if (bb.minY < e.minY) e.minY = bb.minY;
            if (bb.maxX > e.maxX) e.maxX = bb.maxX;
            if (bb.maxY > e.maxY) e.maxY = bb.maxY;
          }
        }
      }
      for (const [g, e] of acc) {
        const attrs = groupContext.registry.get(g);
        if (!e.ok || !attrs || !Number.isFinite(e.minX)) continue;
        const x = Math.max(0, Math.floor(e.minX) - 2);
        const y = Math.max(0, Math.floor(e.minY) - 2);
        const right = Math.min(canvasWidth, Math.ceil(e.maxX) + 2);
        const bottom = Math.min(canvasHeight, Math.ceil(e.maxY) + 2);
        const w = Math.max(1, right - x);
        const h = Math.max(1, bottom - y);
        if (w * h < canvasWidth * canvasHeight) {
          groupTightBBox.set(g, {
            x,
            y,
            w,
            h
          });
        }
      }
    }
    for (let groupIdx = 0; groupIdx < opGroups.length; groupIdx++) {
      const group = opGroups[groupIdx];
      const targetChain = group.groupId != null ? getGroupChain(group.groupId) : [];
      let common = 0;
      while (common < ctxStack.length - 1 && common < targetChain.length && ctxStack[common + 1].groupId === targetChain[common]) {
        common++;
      }
      while (ctxStack.length - 1 > common) {
        await popAndComposite();
      }
      for (let i = common; i < targetChain.length; i++) {
        const tb = groupTightBBox.get(targetChain[i]);
        const newCanvas = tb ? ca.makeCanvas(tb.w, tb.h) : ca.makeCanvas(canvasWidth, canvasHeight);
        const newCtx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          newCanvas.getContext("2d", { willReadFrequently: true })
        );
        ctxStack.push({
          ctx: newCtx,
          canvas: newCanvas,
          groupId: targetChain[i],
          offX: tb ? tb.x : 0,
          offY: tb ? tb.y : 0,
          w: tb ? tb.w : canvasWidth,
          h: tb ? tb.h : canvasHeight
        });
      }
      const currentEntry = ctxStack[ctxStack.length - 1];
      const currentCtx = currentEntry.ctx;
      const curOffX = currentEntry.offX;
      const curOffY = currentEntry.offY;
      if (group.outerSmask) {
        const groupCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
        const groupCtx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          groupCanvas.getContext("2d", { willReadFrequently: true })
        );
        await renderOpsWithInnerSmask(groupCtx, group.ops);
        const cacheKey = `${group.outerSmask.formObjNum}:${group.outerSmask.parentCtm ? group.outerSmask.parentCtm.join(",") : ""}`;
        let maskCanvas = smaskCanvasCache.get(cacheKey);
        if (!maskCanvas) {
          maskCanvas = await renderSMaskToCanvas(group.outerSmask, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale);
          if (maskCanvas) smaskCanvasCache.set(cacheKey, maskCanvas);
        }
        if (maskCanvas) {
          groupCtx.globalCompositeOperation = "destination-in";
          groupCtx.drawImage(maskCanvas, 0, 0);
          groupCtx.globalCompositeOperation = "source-over";
        }
        currentCtx.drawImage(groupCanvas, -curOffX, -curOffY);
        ca.closeDrawable(groupCanvas);
      } else if (group.smask) {
        const fastOp = group.ops.length === 1 && group.ops[0].type === "image" && /** @type {any} */
        group.ops[0].ctm && !getTextClip(group.ops[0]) ? (
          /** @type {any} */
          group.ops[0]
        ) : null;
        if (fastOp) {
          const corners = [
            [fastOp.ctm[4], fastOp.ctm[5]],
            [fastOp.ctm[0] + fastOp.ctm[4], fastOp.ctm[1] + fastOp.ctm[5]],
            [fastOp.ctm[2] + fastOp.ctm[4], fastOp.ctm[3] + fastOp.ctm[5]],
            [fastOp.ctm[0] + fastOp.ctm[2] + fastOp.ctm[4], fastOp.ctm[1] + fastOp.ctm[3] + fastOp.ctm[5]]
          ];
          let minPxX = Infinity;
          let minPxY = Infinity;
          let maxPxX = -Infinity;
          let maxPxY = -Infinity;
          for (let ci = 0; ci < 4; ci++) {
            const px = (corners[ci][0] - boxOriginX) * scale;
            const py = (pageHeightPts + boxOriginY - corners[ci][1]) * scale;
            if (px < minPxX) minPxX = px;
            if (px > maxPxX) maxPxX = px;
            if (py < minPxY) minPxY = py;
            if (py > maxPxY) maxPxY = py;
          }
          const bboxX = Math.max(0, Math.floor(minPxX) - 1);
          const bboxY = Math.max(0, Math.floor(minPxY) - 1);
          const bboxRight = Math.min(canvasWidth, Math.ceil(maxPxX) + 1);
          const bboxBottom = Math.min(canvasHeight, Math.ceil(maxPxY) + 1);
          const bboxW = bboxRight - bboxX;
          const bboxH = bboxBottom - bboxY;
          if (bboxW > 0 && bboxH > 0 && bboxW * bboxH < canvasWidth * canvasHeight / 4) {
            const fastBbox = {
              x: bboxX,
              y: bboxY,
              width: bboxW,
              height: bboxH
            };
            const fastMaskCanvas = await renderSMaskToCanvas(
              group.smask,
              objCache,
              canvasWidth,
              canvasHeight,
              pageHeightPts,
              boxOriginX,
              boxOriginY,
              scale,
              fastBbox
            );
            if (fastMaskCanvas) {
              const tightCanvas = ca.makeCanvas(bboxW, bboxH);
              const tightCtx = (
                /** @type {OffscreenCanvasRenderingContext2D} */
                tightCanvas.getContext("2d", { willReadFrequently: true })
              );
              const shiftedOp = {
                ...fastOp,
                ctm: [fastOp.ctm[0], fastOp.ctm[1], fastOp.ctm[2], fastOp.ctm[3], fastOp.ctm[4] - bboxX / scale, fastOp.ctm[5] + bboxY / scale],
                clips: fastOp.clips ? fastOp.clips.map((c) => ({
                  ...c,
                  ctm: c.ctm ? [c.ctm[0], c.ctm[1], c.ctm[2], c.ctm[3], c.ctm[4] - bboxX / scale, c.ctm[5] + bboxY / scale] : c.ctm
                })) : fastOp.clips
              };
              await renderSingleOp(tightCtx, shiftedOp);
              tightCtx.globalCompositeOperation = "destination-in";
              tightCtx.drawImage(fastMaskCanvas, 0, 0);
              ca.closeDrawable(fastMaskCanvas);
              tightCtx.globalCompositeOperation = "source-over";
              const fastBlend = fastOp.blendMode;
              if (fastBlend && fastBlend !== "Normal") {
                currentCtx.globalCompositeOperation = pdfBlendToCanvas[fastBlend] || fastBlend.toLowerCase();
              }
              currentCtx.drawImage(tightCanvas, bboxX - curOffX, bboxY - curOffY);
              ca.closeDrawable(tightCanvas);
              if (fastBlend && fastBlend !== "Normal") {
                currentCtx.globalCompositeOperation = "source-over";
              }
              continue;
            }
          }
        }
        let formBBoxFastHandled = false;
        if (!group.ops.some((o) => getTextClip(o))) {
          const firstFormClip = (() => {
            const clips = group.ops[0].clips;
            if (!clips) return null;
            for (let i = clips.length - 1; i >= 0; i--) {
              if (clips[i].fromFormObjNum !== void 0) return clips[i];
            }
            return null;
          })();
          let allShare = !!firstFormClip;
          if (firstFormClip) {
            for (let gi = 1; gi < group.ops.length && allShare; gi++) {
              const clipsI = group.ops[gi].clips;
              let foundI = null;
              if (clipsI) {
                for (let ci = clipsI.length - 1; ci >= 0; ci--) {
                  if (clipsI[ci].fromFormObjNum !== void 0) {
                    foundI = clipsI[ci];
                    break;
                  }
                }
              }
              if (!foundI || foundI.fromFormObjNum !== firstFormClip.fromFormObjNum) {
                allShare = false;
                break;
              }
              for (let mi = 0; mi < 6; mi++) {
                if (foundI.ctm[mi] !== firstFormClip.ctm[mi]) {
                  allShare = false;
                  break;
                }
              }
            }
          }
          if (allShare && firstFormClip && firstFormClip.path) {
            const pts = firstFormClip.path;
            let minPxX = Infinity;
            let minPxY = Infinity;
            let maxPxX = -Infinity;
            let maxPxY = -Infinity;
            for (let pi = 0; pi < pts.length; pi++) {
              const pt = pts[pi];
              if (pt.type !== "M" && pt.type !== "L") continue;
              const ux = firstFormClip.ctm[0] * pt.x + firstFormClip.ctm[2] * pt.y + firstFormClip.ctm[4];
              const uy = firstFormClip.ctm[1] * pt.x + firstFormClip.ctm[3] * pt.y + firstFormClip.ctm[5];
              const px = (ux - boxOriginX) * scale;
              const py = (pageHeightPts + boxOriginY - uy) * scale;
              if (px < minPxX) minPxX = px;
              if (px > maxPxX) maxPxX = px;
              if (py < minPxY) minPxY = py;
              if (py > maxPxY) maxPxY = py;
            }
            const fbBboxX = Math.max(0, Math.floor(minPxX) - 1);
            const fbBboxY = Math.max(0, Math.floor(minPxY) - 1);
            const fbBboxRight = Math.min(canvasWidth, Math.ceil(maxPxX) + 1);
            const fbBboxBottom = Math.min(canvasHeight, Math.ceil(maxPxY) + 1);
            const fbBboxW = fbBboxRight - fbBboxX;
            const fbBboxH = fbBboxBottom - fbBboxY;
            if (fbBboxW > 0 && fbBboxH > 0 && fbBboxW * fbBboxH < canvasWidth * canvasHeight / 4) {
              formBBoxFastHandled = await compositeTightSmaskGroup(group.ops, group.smask, fbBboxX, fbBboxY, fbBboxW, fbBboxH);
            }
          }
        }
        if (formBBoxFastHandled) continue;
        let generalTightHandled = false;
        if (!group.ops.some((o) => getTextClip(o))) {
          let uMinX = Infinity;
          let uMinY = Infinity;
          let uMaxX = -Infinity;
          let uMaxY = -Infinity;
          let tightable = true;
          let contentBounded = true;
          for (const op of group.ops) {
            const oa = (
              /** @type {any} */
              op
            );
            if (op.outerSmask || oa.patternShading || oa.tilingPattern || oa.strokePatternShading || oa.strokeTilingPattern) {
              tightable = false;
              break;
            }
            const obb = opDeviceBBox(op);
            if (!obb) {
              if (op.type === "shading") {
                contentBounded = false;
                continue;
              }
              tightable = false;
              break;
            }
            if (obb.minX < uMinX) uMinX = obb.minX;
            if (obb.minY < uMinY) uMinY = obb.minY;
            if (obb.maxX > uMaxX) uMaxX = obb.maxX;
            if (obb.maxY > uMaxY) uMaxY = obb.maxY;
          }
          if (tightable && contentBounded && Number.isFinite(uMinX)) {
            const ux = Math.max(0, Math.floor(uMinX) - 1);
            const uy = Math.max(0, Math.floor(uMinY) - 1);
            const uw = Math.min(canvasWidth, Math.ceil(uMaxX) + 1) - ux;
            const uh = Math.min(canvasHeight, Math.ceil(uMaxY) + 1) - uy;
            if (uw > 0 && uh > 0 && uw * uh < canvasWidth * canvasHeight) {
              generalTightHandled = await compositeTightSmaskGroup(group.ops, group.smask, ux, uy, uw, uh);
            }
          } else if (tightable && !contentBounded) {
            const mb = await smaskOutsideZeroContentBBox(group.smask);
            if (mb) {
              generalTightHandled = await compositeTightSmaskGroup(group.ops, group.smask, mb.x, mb.y, mb.w, mb.h);
            }
          }
        }
        if (generalTightHandled) continue;
        const groupCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
        const renderCtx = (
          /** @type {OffscreenCanvasRenderingContext2D} */
          groupCanvas.getContext("2d", { willReadFrequently: true })
        );
        for (const op of group.ops) {
          const textClipCharsForOp = getTextClip(op);
          let opCtx = renderCtx;
          let textClipCanvas = null;
          if (textClipCharsForOp) {
            textClipCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            opCtx = /** @type {OffscreenCanvasRenderingContext2D} */
            textClipCanvas.getContext("2d", { willReadFrequently: true });
          }
          if (!renderPathOpSync(opCtx, op)) await renderSingleOp(opCtx, op);
          if (textClipCanvas && textClipCharsForOp) {
            const mCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            drawTextClipMask(mCanvas, textClipCharsForOp);
            opCtx.globalCompositeOperation = "destination-in";
            opCtx.drawImage(mCanvas, 0, 0);
            ca.closeDrawable(mCanvas);
            opCtx.globalCompositeOperation = "source-over";
            renderCtx.drawImage(textClipCanvas, 0, 0);
            ca.closeDrawable(textClipCanvas);
          }
        }
        const cacheKey = `${group.smask.formObjNum}:${group.smask.parentCtm ? group.smask.parentCtm.join(",") : ""}`;
        let maskCanvas = smaskCanvasCache.get(cacheKey);
        if (!maskCanvas) {
          maskCanvas = await renderSMaskToCanvas(group.smask, objCache, canvasWidth, canvasHeight, pageHeightPts, boxOriginX, boxOriginY, scale);
          if (maskCanvas) smaskCanvasCache.set(cacheKey, maskCanvas);
        }
        if (maskCanvas) {
          renderCtx.globalCompositeOperation = "destination-in";
          renderCtx.drawImage(maskCanvas, 0, 0);
          renderCtx.globalCompositeOperation = "source-over";
        }
        const groupBlend = group.ops.length > 0 && group.ops[0].blendMode;
        if (groupBlend && groupBlend !== "Normal") {
          currentCtx.globalCompositeOperation = pdfBlendToCanvas[groupBlend] || groupBlend.toLowerCase();
        }
        currentCtx.drawImage(groupCanvas, -curOffX, -curOffY);
        ca.closeDrawable(groupCanvas);
        if (groupBlend && groupBlend !== "Normal") {
          currentCtx.globalCompositeOperation = "source-over";
        }
      } else {
        const tgtEntry = ctxStack[ctxStack.length - 1];
        const grpShift = tgtEntry.offX !== 0 || tgtEntry.offY !== 0;
        const grpDx = -tgtEntry.offX / scale;
        const grpDy = tgtEntry.offY / scale;
        for (let opIdx = 0; opIdx < group.ops.length; opIdx++) {
          const op = grpShift ? shiftOpBy(group.ops[opIdx], grpDx, grpDy) : group.ops[opIdx];
          const textClipCharsForOp = getTextClip(op);
          if (textClipCharsForOp) {
            const tb = textClipDeviceBBox(textClipCharsForOp);
            if (tb && tb.w > 0 && tb.h > 0 && tb.w * tb.h < canvasWidth * canvasHeight / 4) {
              const dxPdf = -tb.x / scale;
              const dyPdf = tb.y / scale;
              const tightCanvas = ca.makeCanvas(tb.w, tb.h);
              const tightCtx = (
                /** @type {OffscreenCanvasRenderingContext2D} */
                tightCanvas.getContext("2d", { willReadFrequently: true })
              );
              const shiftedOp = shiftOpBy(op, dxPdf, dyPdf);
              if (!renderPathOpSync(tightCtx, shiftedOp)) await renderSingleOp(tightCtx, shiftedOp);
              const shiftedChars = textClipCharsForOp.map((ch) => ({ ...ch, x: ch.x + dxPdf, y: ch.y + dyPdf }));
              const mCanvas = ca.makeCanvas(tb.w, tb.h);
              drawTextClipMask(mCanvas, shiftedChars);
              tightCtx.globalCompositeOperation = "destination-in";
              tightCtx.drawImage(mCanvas, 0, 0);
              ca.closeDrawable(mCanvas);
              tightCtx.globalCompositeOperation = "source-over";
              currentCtx.drawImage(tightCanvas, tb.x, tb.y);
              ca.closeDrawable(tightCanvas);
              flushComposites();
              continue;
            }
          }
          let opCtx = currentCtx;
          let textClipCanvas = null;
          if (textClipCharsForOp) {
            textClipCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            opCtx = /** @type {OffscreenCanvasRenderingContext2D} */
            textClipCanvas.getContext("2d", { willReadFrequently: true });
          }
          if (!renderPathOpSync(opCtx, op)) await renderSingleOp(opCtx, op);
          if (textClipCanvas && textClipCharsForOp) {
            const mCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
            drawTextClipMask(mCanvas, textClipCharsForOp);
            opCtx.globalCompositeOperation = "destination-in";
            opCtx.drawImage(mCanvas, 0, 0);
            ca.closeDrawable(mCanvas);
            opCtx.globalCompositeOperation = "source-over";
            currentCtx.drawImage(textClipCanvas, 0, 0);
            ca.closeDrawable(textClipCanvas);
            flushComposites();
          }
        }
      }
      flushComposites();
    }
    while (ctxStack.length > 1) {
      await popAndComposite();
    }
  } catch (err) {
    renderFailed = true;
    const frame = err instanceof Error && err.stack ? (err.stack.split("\n").find((l) => l.trimStart().startsWith("at ")) || "").trim() : "";
    failDetail = (err instanceof Error ? err.message : String(err)) + (frame ? ` (${frame})` : "");
    failReason = /** @type {any} */
    err?.renderAbort || "exception";
    console.warn(`[renderPdfPage] page ${pageIndex} returned blank: ${failDetail}`);
  } finally {
    for (const bmp of bitmapCache.values()) ca.closeDrawable(bmp);
    for (const bmp of tilingPatternCache.values()) ca.closeDrawable(bmp);
    for (const cvs of smaskCanvasCache.values()) ca.closeDrawable(cvs);
    for (const p of transientPatterns) ca.closeDrawable(p);
    if (textMeasureCanvas) ca.closeDrawable(textMeasureCanvas);
    bitmapCache.clear();
    tilingPatternCache.clear();
    smaskCanvasCache.clear();
    transientPatterns.length = 0;
  }
  perf.drawMs = performance.now() - tDrawStart;
  if (renderFailed) {
    ca.closeDrawable(canvas);
    const blankCanvas = ca.makeCanvas(canvasWidth, canvasHeight);
    const blankCtx = (
      /** @type {OffscreenCanvasRenderingContext2D} */
      blankCanvas.getContext("2d", { willReadFrequently: true })
    );
    blankCtx.fillStyle = "white";
    blankCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    const blankData = blankCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const blankResult = {
      dataUrl: await buildPngDataUrl(blankData, "gray"),
      colorMode: "gray",
      ok: false,
      failReason,
      failDetail
    };
    ca.closeDrawable(blankCanvas);
    return blankResult;
  }
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalCompositeOperation = "source-over";
  if (outputFormat === "bitmap" && typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    const tFlushStart2 = performance.now();
    const bitmap = canvas.transferToImageBitmap();
    perf.flushMs = performance.now() - tFlushStart2;
    ca.closeDrawable(canvas);
    return {
      bitmap,
      colorMode: effectiveColorMode,
      ok: true,
      perf
    };
  }
  if (outputFormat === "jpeg" || outputFormat === "webp") {
    const mime = outputFormat === "webp" ? "image/webp" : "image/jpeg";
    const tFlushStart2 = performance.now();
    const blob = await canvas.convertToBlob({ type: mime, mime, quality });
    perf.flushMs = performance.now() - tFlushStart2;
    ca.closeDrawable(canvas);
    return {
      blob,
      colorMode: effectiveColorMode,
      ok: true,
      perf
    };
  }
  const tFlushStart = performance.now();
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const dataUrl = await buildPngDataUrl(imageData, effectiveColorMode);
  perf.flushMs = performance.now() - tFlushStart;
  const result = {
    dataUrl,
    colorMode: effectiveColorMode,
    ok: true,
    perf
  };
  ca.closeDrawable(canvas);
  return result;
}
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  crcTable[n] = c;
}
const zlibCrc32 = typeof process !== "undefined" && typeof process.versions?.node === "string" ? process.getBuiltinModule("node:zlib").crc32 : null;
function crc32(bytes) {
  if (zlibCrc32) return zlibCrc32(bytes);
  let crc = 4294967295;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function makePngChunk(type, data) {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}
const zlibDeflateSync = typeof process !== "undefined" && typeof process.versions?.node === "string" ? process.getBuiltinModule("node:zlib").deflateSync : null;
function filterUpStripAlpha(data, width, height, isGray) {
  const channels = isGray ? 1 : 3;
  const raw = new Uint8Array(height * (1 + width * channels));
  let d = 0;
  let s = 0;
  raw[d++] = 2;
  const row0End = width * 4;
  if (isGray) {
    while (s < row0End) {
      raw[d++] = data[s];
      s += 4;
    }
  } else {
    while (s < row0End) {
      raw[d++] = data[s];
      raw[d++] = data[s + 1];
      raw[d++] = data[s + 2];
      s += 4;
    }
  }
  const rowStride = width * 4;
  for (let y = 1; y < height; y++) {
    raw[d++] = 2;
    let a = s - rowStride;
    const rowEnd = s + rowStride;
    if (isGray) {
      while (s < rowEnd) {
        raw[d++] = data[s] - data[a] & 255;
        s += 4;
        a += 4;
      }
    } else {
      const evenEnd = s + (width & -2) * 4;
      while (s < evenEnd) {
        raw[d++] = data[s] - data[a] & 255;
        raw[d++] = data[s + 1] - data[a + 1] & 255;
        raw[d++] = data[s + 2] - data[a + 2] & 255;
        raw[d++] = data[s + 4] - data[a + 4] & 255;
        raw[d++] = data[s + 5] - data[a + 5] & 255;
        raw[d++] = data[s + 6] - data[a + 6] & 255;
        s += 8;
        a += 8;
      }
      while (s < rowEnd) {
        raw[d++] = data[s] - data[a] & 255;
        raw[d++] = data[s + 1] - data[a + 1] & 255;
        raw[d++] = data[s + 2] - data[a + 2] & 255;
        s += 4;
        a += 4;
      }
    }
  }
  return raw;
}
const PNG_DEFLATE_LEVEL = 4;
function deflateCompressed(raw) {
  if (zlibDeflateSync) return zlibDeflateSync(raw, { level: PNG_DEFLATE_LEVEL });
  return deflateViaCompressionStream(raw);
}
async function deflateViaCompressionStream(raw) {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(raw);
  writer.close();
  const chunks = [];
  const reader = cs.readable.getReader();
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const compressedLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const compressedData = new Uint8Array(compressedLen);
  let p = 0;
  for (const chunk of chunks) {
    compressedData.set(chunk, p);
    p += chunk.length;
  }
  return compressedData;
}
function assemblePngDataUrl(width, height, isGray, compressedData) {
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = isGray ? 0 : 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makePngChunk("IHDR", ihdr);
  const idatChunk = makePngChunk("IDAT", compressedData);
  const iendChunk = makePngChunk("IEND", new Uint8Array(0));
  const totalLen = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const pngBytes = new Uint8Array(totalLen);
  let pos = 0;
  pngBytes.set(signature, pos);
  pos += signature.length;
  pngBytes.set(ihdrChunk, pos);
  pos += ihdrChunk.length;
  pngBytes.set(idatChunk, pos);
  pos += idatChunk.length;
  pngBytes.set(iendChunk, pos);
  if (typeof Buffer !== "undefined") {
    return `data:image/png;base64,${Buffer.from(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength).toString("base64")}`;
  }
  let binary = "";
  for (let i = 0; i < pngBytes.length; i++) {
    binary += String.fromCharCode(pngBytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
}
async function buildPngDataUrl(imageData, colorMode) {
  const { width, height, data } = imageData;
  const isGray = colorMode === "gray";
  const raw = filterUpStripAlpha(data, width, height, isGray);
  const compressed = await deflateCompressed(raw);
  return assemblePngDataUrl(width, height, isGray, compressed);
}
export {
  buildFontFromCFF as _buildFontFromCFF,
  buildPngDataUrl as _buildPngDataUrl,
  cssGenericForFontObj as _cssGenericForFontObj,
  imageInfoToBitmap as _imageInfoToBitmap,
  parseShadings as _parseShadings,
  type1ShadingToAxial as _type1ShadingToAxial,
  registerFontForEditing,
  renderPdfPageAsImage
};
//# sourceMappingURL=renderPdfPage-BUhf_3nL.js.map
