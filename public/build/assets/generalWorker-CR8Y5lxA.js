const ascCharArr = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "b",
  "d",
  "h",
  "k",
  "l",
  "t",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
];
const xCharArr = ["a", "c", "e", "m", "n", "o", "r", "s", "u", "v", "w", "x", "z"];
const descCharArr = ["g", "j", "p", "q", "y"];
const calcBboxUnion = (bboxArr) => ({
  left: Math.min(...bboxArr.map((x) => x.left)),
  top: Math.min(...bboxArr.map((x) => x.top)),
  right: Math.max(...bboxArr.map((x) => x.right)),
  bottom: Math.max(...bboxArr.map((x) => x.bottom))
});
function calcBoxOverlap(boxA, boxB) {
  const left = Math.max(boxA.left, boxB.left);
  const top = Math.max(boxA.top, boxB.top);
  const right = Math.min(boxA.right, boxB.right);
  const bottom = Math.min(boxA.bottom, boxB.bottom);
  const width = right - left;
  const height = bottom - top;
  if (width < 0 || height < 0) return 0;
  const areaA = (boxA.bottom - boxA.top) * (boxA.right - boxA.left);
  const area = width * height;
  return area / areaA;
}
function getRandomInt(min, max) {
  const minI = Math.ceil(min);
  const maxI = Math.floor(max);
  return Math.floor(Math.random() * (maxI - minI) + minI);
}
function getRandomAlphanum(num) {
  const outArr = new Array(num);
  for (let i = 0; i < num; i++) {
    let intI = getRandomInt(1, 62);
    if (intI <= 10) {
      intI += 47;
    } else if (intI <= 36) {
      intI = intI - 10 + 64;
    } else {
      intI = intI - 36 + 96;
    }
    outArr[i] = String.fromCharCode(intI);
  }
  return outArr.join("");
}
function quantile(arr, ntile) {
  if (arr.length === 0) {
    return null;
  }
  const arr1 = [...arr];
  const mid = Math.floor(arr.length * ntile);
  arr1.sort((a, b) => a - b);
  return arr1[mid];
}
const mean50 = (arr) => {
  if (arr.length === 0) {
    return null;
  }
  const per25 = Math.floor(arr.length / 4) - 1;
  const per75 = Math.ceil(arr.length * 3 / 4) - 1;
  const nums = [...arr].sort((a, b) => a - b);
  const numsMiddle = nums.slice(per25, per75 + 1);
  return numsMiddle.reduce((a, b) => a + b) / numsMiddle.length;
};
function unescapeXml(string) {
  const replaceFunc = (match, p1) => String.fromCharCode(parseInt(p1, 16));
  return string.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&#x([0-9a-f]+);/g, replaceFunc).replace(/\u00AD/g, "-");
}
function calcLang(str) {
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code >= 0 && code <= 127) continue;
    if (code >= 19968 && code <= 40959 || code >= 13312 && code <= 19903 || code >= 131072 && code <= 173791 || code >= 173824 && code <= 177983 || code >= 177984 && code <= 178207 || code >= 178208 && code <= 183983 || code >= 63744 && code <= 64255 || code >= 194560 && code <= 195103) return "chi_sim";
    if (code >= 1024 && code <= 1279 || code >= 1280 && code <= 1327 || code === 7296 || code === 7297) return "rus";
  }
  return "eng";
}
function round6$1(x) {
  return Math.round(x * 1e6) / 1e6;
}
function clearObjectProperties(obj) {
  for (const prop in obj) {
    if (Object.hasOwnProperty.call(obj, prop)) {
      delete obj[prop];
    }
  }
}
const serifFonts = [
  "SerifDefault",
  "Archer",
  "Baskerville",
  "Bembo",
  "Bodoni",
  "Bookman",
  "C059",
  "Calibri",
  "Cambria",
  "Century",
  "Cheltenham",
  "Courier",
  "Garamond",
  "Georgia",
  "LucidaBright",
  "Minion",
  "NimbusMono",
  "Optima",
  "P052",
  "Palatino",
  "Times"
];
const sansFonts = [
  "SansDefault",
  "Amplitude",
  "Avenir",
  "Arial",
  "Calibri",
  "Candara",
  "Carlito",
  "Clarika",
  "Comic",
  "Franklin",
  "Frutiger",
  "Futura",
  "Gotham",
  "Gothic",
  "Halvorsen",
  "Helvetica",
  "Impact",
  "Interstate",
  "Kievit",
  "Lato",
  "Myriad",
  "Segoe",
  "Tahoma",
  "Trebuchet",
  "Univers",
  "Verdana"
];
const symbolFonts = ["SymbolDefault", "Dingbats", "Wingdings", "Webdings", "ZapfDingbats", "Symbol", "SymbolMT", "Quivira"];
const serifFontsRegex = new RegExp(serifFonts.reduce((x, y) => `${x}|${y}`), "i");
const sansFontsRegex = new RegExp(sansFonts.reduce((x, y) => `${x}|${y}`), "i");
const symbolFontsRegex = new RegExp(symbolFonts.reduce((x, y) => `${x}|${y}`), "i");
function determineSansSerif(fontName) {
  fontName = fontName?.replaceAll(/[_\s]/gi, "");
  let fontFamily = "Default";
  if (fontName && !["Default", "GlyphLessFont", "HiddenHorzOCR"].includes(fontName)) {
    if (symbolFontsRegex.test(fontName)) {
      fontFamily = "SymbolDefault";
    } else if (/(^|\W|_)sans($|\W|_)/i.test(fontName)) {
      fontFamily = "SansDefault";
    } else if (/(^|\W|_)serif($|\W|_)/i.test(fontName)) {
      fontFamily = "SerifDefault";
    } else if (serifFontsRegex.test(fontName)) {
      fontFamily = "SerifDefault";
    } else if (sansFontsRegex.test(fontName)) {
      fontFamily = "SansDefault";
    } else if (fontName !== "Default Metrics Font") {
      if (/serif|rom/i.test(fontName) && !/sans/i.test(fontName)) {
        fontFamily = "SerifDefault";
      } else if (/san/i.test(fontName)) {
        fontFamily = "SansDefault";
      }
    }
  }
  return fontFamily;
}
function getTextScript(text) {
  let han = 0;
  let latin = 0;
  const letterArr = typeof text === "string" ? text.split("") : text;
  for (let j = 0; j < letterArr.length; j++) {
    if (new RegExp("\\p{Script=Han}", "u").test(letterArr[j])) han++;
    if (new RegExp("\\p{Script=Latin}", "u").test(letterArr[j])) latin++;
  }
  return { han, latin };
}
const superscriptMap = {
  // Superscript digits
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  // Superscript lowercase Latin letters
  "ᵃ": "a",
  "ᵇ": "b",
  "ᶜ": "c",
  "ᵈ": "d",
  "ᵉ": "e",
  "ᶠ": "f",
  "ᵍ": "g",
  ʰ: "h",
  "ⁱ": "i",
  ʲ: "j",
  "ᵏ": "k",
  ˡ: "l",
  "ᵐ": "m",
  ⁿ: "n",
  "ᵒ": "o",
  "ᵖ": "p",
  ʳ: "r",
  ˢ: "s",
  "ᵗ": "t",
  "ᵘ": "u",
  "ᵛ": "v",
  ʷ: "w",
  ˣ: "x",
  ʸ: "y",
  "ᶻ": "z",
  // Superscript uppercase Latin letters
  "ᴬ": "A",
  "ᴮ": "B",
  "ᴰ": "D",
  "ᴱ": "E",
  "ᴳ": "G",
  "ᴴ": "H",
  "ᴵ": "I",
  "ᴶ": "J",
  "ᴷ": "K",
  "ᴸ": "L",
  "ᴹ": "M",
  "ᴺ": "N",
  "ᴼ": "O",
  "ᴾ": "P",
  "ᴿ": "R",
  "ᵀ": "T",
  "ᵁ": "U",
  "ⱽ": "V",
  "ᵂ": "W",
  // Superscript symbols and punctuation
  "⁺": "+",
  "⁻": "-",
  "⁼": "=",
  "⁽": "(",
  "⁾": ")"
};
function removeSuperscript(text) {
  if (typeof text !== "string") {
    throw new TypeError("Input must be a string");
  }
  return text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ⁺⁻⁼⁽⁾ᵅᵝᵞᵟᵋᶿᶥᶲᵠᵡ]/g, (match) => superscriptMap[match] || match);
}
const getStyleLookup = (style) => {
  let styleStr = "normal";
  if (style.bold && style.italic) {
    styleStr = "boldItalic";
  } else if (style.bold) {
    styleStr = "bold";
  } else if (style.italic) {
    styleStr = "italic";
  }
  return styleStr;
};
const cleanFamilyName = (family) => {
  let familyClean = family;
  if (/NimbusRom/i.test(family)) {
    familyClean = "NimbusRoman";
  } else if (/TimesNewRom/i.test(family)) {
    familyClean = "TimesNewRoman";
  } else if (/NimbusSan/i.test(family)) {
    familyClean = "NimbusSans";
  } else if (/Helvetica/i.test(family)) {
    familyClean = "Helvetica";
  } else if (/Arial/i.test(family)) {
    familyClean = "Arial";
  } else if (/CenturySch/i.test(family)) {
    familyClean = "CenturySchoolbook";
  } else if (/Palatino/i.test(family)) {
    familyClean = "Palatino";
  } else if (/Garamond/i.test(family)) {
    familyClean = "Garamond";
  } else if (/CenturyGothic/i.test(family)) {
    familyClean = "CenturyGothic";
  } else if (/AvantGarde/i.test(family)) {
    familyClean = "AvantGarde";
  } else if (/Carlito/i.test(family)) {
    familyClean = "Carlito";
  } else if (/Calibri/i.test(family)) {
    familyClean = "Calibri";
  } else if (/Courier/i.test(family)) {
    familyClean = "Courier";
  } else if (/NimbusMono/i.test(family)) {
    familyClean = "NimbusMono";
  } else if (/Dingbats/i.test(family)) {
    familyClean = "Dingbats";
  } else if (/Wingdings/i.test(family)) {
    familyClean = "Wingdings";
  }
  return familyClean;
};
function OcrPage(n, dims) {
  this.n = n;
  this.dims = dims;
  this.angle = 0;
  this.pars = [];
  this.lines = [];
  this.rules = [];
  this.tableBoxes = [];
  this.textSource = null;
}
function parIsFurniture(par) {
  return !!par && (par.type === "pagenum" || par.type === "header" || par.type === "footer" || par.type === "linenum");
}
function ParDebugInfo() {
  this.raw = null;
  this.sourceType = null;
  this.sourceStyle = null;
}
function OcrPar(page, bbox) {
  this.page = page;
  this.bbox = bbox;
  this.lines = [];
  this.id = getRandomAlphanum(8);
  this.reason = "";
  this.type = "body";
  this.marker = null;
  this.parNum = null;
  this.footnoteRefId = null;
  this.headingLevel = null;
  this.debug = new ParDebugInfo();
}
function LineDebugInfo() {
  this.raw = null;
}
function OcrLine(page, bbox, baseline, ascHeight = null, xHeight = null) {
  this.id = getRandomAlphanum(8);
  this.bbox = bbox;
  this.baseline = baseline;
  this.ascHeight = ascHeight;
  this.xHeight = xHeight;
  this.words = [];
  this.page = page;
  this.par = null;
  this.orientation = 0;
  this.lineNum = null;
  this.pageNum = null;
  this.debug = new LineDebugInfo();
}
function WordDebugInfo() {
  this.raw = null;
}
function OcrWord(line, id, text, bbox) {
  this.text = text;
  this.alt = void 0;
  this.style = {
    font: null,
    size: null,
    bold: false,
    italic: false,
    underline: false,
    smallCaps: false,
    sup: false,
    dropcap: false,
    color: "#000000",
    opacity: 1
  };
  this.styleRuns = void 0;
  this.lang = "eng";
  this.conf = 0;
  this.bbox = bbox;
  this.compTruth = false;
  this.matchTruth = false;
  this.id = id;
  this.line = line;
  this.chars = null;
  this.visualCoords = true;
  this.debug = new WordDebugInfo();
  this.footnoteParId = null;
}
function OcrChar(text, bbox) {
  this.text = text;
  this.bbox = bbox;
}
function scaleChar(char, scale) {
  char.bbox.left *= scale;
  char.bbox.top *= scale;
  char.bbox.right *= scale;
  char.bbox.bottom *= scale;
}
function scaleWord(word, scale) {
  word.bbox.left *= scale;
  word.bbox.top *= scale;
  word.bbox.right *= scale;
  word.bbox.bottom *= scale;
  if (word.chars) {
    for (const char of word.chars) {
      scaleChar(char, scale);
    }
  }
}
function scaleLine(line, scale) {
  line.bbox.left *= scale;
  line.bbox.top *= scale;
  line.bbox.right *= scale;
  line.bbox.bottom *= scale;
  for (const word of line.words) {
    scaleWord(word, scale);
  }
  if (line.ascHeight) line.ascHeight *= scale;
  if (line.xHeight) line.xHeight *= scale;
  line.baseline[1] *= scale;
}
function scalePage(page, scale) {
  for (const line of page.lines) {
    scaleLine(line, scale);
  }
  page.dims.width *= scale;
  page.dims.height *= scale;
}
const getPrevLine = (lineObj) => {
  if (!lineObj.words[0]) throw new Error("All lines must contain >=1 word");
  const lineIndex = lineObj.page.lines.findIndex((elem) => elem.words?.[0]?.id === lineObj.words[0].id);
  if (lineIndex < 1) return null;
  return lineObj.page.lines[lineIndex - 1];
};
const getNextLine = (lineObj) => {
  if (!lineObj.words[0]) throw new Error("All lines must contain >=1 word");
  const lineIndex = lineObj.page.lines.findIndex((elem) => elem.words?.[0]?.id === lineObj.words[0].id);
  if (lineIndex + 1 >= lineObj.page.lines.length) return null;
  return lineObj.page.lines[lineIndex + 1];
};
const getPageWord = (page, id) => {
  for (let i = 0; i < page.lines.length; i++) {
    for (let j = 0; j < page.lines[i].words.length; j++) {
      if (page.lines[i].words[j].id === id) return page.lines[i].words[j];
    }
  }
  return null;
};
const deletePageWords = (page, ids) => {
  for (let i = 0; i < page.lines.length; i++) {
    for (let j = 0; j < page.lines[i].words.length; j++) {
      const idsIndex = ids.indexOf(page.lines[i].words[j].id);
      if (idsIndex >= 0) {
        ids.splice(idsIndex, 1);
        page.lines[i].words.splice(j, 1);
        j--;
        if (page.lines[i].words.length === 0) {
          page.lines.splice(i, 1);
          i--;
          break;
        } else if (j + 1 === page.lines[i].words.length || ids.length === 0) {
          ocr.updateLineBbox(page.lines[i]);
        }
        if (ids.length === 0) return;
      }
    }
  }
};
const getPageWords = (page) => {
  const words = [];
  for (let i = 0; i < page.lines.length; i++) {
    words.push(...page.lines[i].words);
  }
  return words;
};
const getDistinctChars = (ocrPageArr) => {
  const charsAll = {};
  for (const ocrPage of ocrPageArr) {
    for (const ocrLine of ocrPage.lines) {
      for (const ocrWord of ocrLine.words) {
        ocrWord.text.split("").forEach((x) => {
          charsAll[x] = true;
        });
      }
    }
  }
  return Object.keys(charsAll);
};
const getLineText = (line) => {
  let text = "";
  for (let i = 0; i < line.words.length; i++) {
    text += `${line.words[i].text}`;
    if (i < line.words.length - 1) text += " ";
  }
  return text;
};
const getParText = (par) => {
  let text = "";
  for (let i = 0; i < par.lines.length; i++) {
    if (i > 0) text += " ";
    text += getLineText(par.lines[i]);
  }
  return text;
};
const getPageText = (page) => {
  let text = "";
  for (let i = 0; i < page.lines.length; i++) {
    if (i > 0) text += "\n";
    text += getLineText(page.lines[i]);
  }
  return text;
};
const getRegionText = (page, bbox) => {
  const regionWords = (
    /** @type {OcrWord[]} */
    []
  );
  for (let i = 0; i < page.lines.length; i++) {
    const line = page.lines[i];
    for (let j = 0; j < line.words.length; j++) {
      const word = line.words[j];
      if (calcBoxOverlap(word.bbox, bbox) > 0) {
        regionWords.push(word);
      }
    }
  }
  if (regionWords.length === 0) return "";
  let text = "";
  for (let i = 0; i < regionWords.length; i++) {
    if (i > 0 && regionWords[i - 1].line !== regionWords[i].line) {
      text += "\n";
    } else if (i > 0) {
      text += " ";
    }
    text += regionWords[i].text;
  }
  return text;
};
function calcLineStartAngleAdj(line) {
  if (!line.words[0]) {
    console.log("No words in line, report as bug.");
    return { x: 0, y: 0 };
  }
  const angle = line.page.angle * -1;
  const dims = line.page.dims;
  const sinAngle = Math.sin(angle * (Math.PI / 180));
  const cosAngle = Math.cos(angle * (Math.PI / 180));
  let bbox;
  const char0Bbox = line.words[0]?.chars?.[0]?.bbox;
  if (char0Bbox) {
    bbox = char0Bbox;
  } else {
    bbox = line.words[0].bbox;
  }
  const width = line.orientation % 2 === 0 ? dims.width : dims.height;
  const height = line.orientation % 2 === 0 ? dims.height : dims.width;
  const bboxRot = rotateBbox(bbox, cosAngle, sinAngle, width, height);
  return { x: bboxRot.left - bbox.left, y: bboxRot.bottom - bbox.bottom };
}
function calcWordAngleAdj(word) {
  const { angle } = word.line.page;
  if (Math.abs(angle ?? 0) > 0.05) {
    const sinAngle = Math.sin(angle * (Math.PI / 180));
    const cosAngle = Math.cos(angle * (Math.PI / 180));
    const x = word.bbox.left - word.line.bbox.left;
    const y = word.bbox.bottom - (word.line.bbox.bottom + word.line.baseline[1]);
    if (word.style.sup || word.style.dropcap) {
      const tanAngle = sinAngle / cosAngle;
      const angleAdjYSup = (y - x * tanAngle) * cosAngle - y;
      const angleAdjXSup = angle > 0 ? 0 : angleAdjYSup * tanAngle;
      return { x: 0 - angleAdjXSup, y: angleAdjYSup };
    }
    const angleAdjXBaseline = x / cosAngle - x;
    return { x: angleAdjXBaseline, y: 0 };
  }
  return { x: 0, y: 0 };
}
const LIGATURE_ANY_RE = /[ĲĳŉǱǲǳǄǅǆǇǈǉǊǋǌﬀﬁﬂﬃﬄﬅﬆ]/;
const LIGATURE_ALL_RE = /[ĲĳŉǱǲǳǄǅǆǇǈǉǊǋǌﬀﬁﬂﬃﬄﬅﬆ]/g;
const LIGATURE_MAP = {
  Ĳ: "IJ",
  ĳ: "ij",
  ŉ: "ʼn",
  Ǳ: "DZ",
  ǲ: "Dz",
  ǳ: "dz",
  Ǆ: "DŽ",
  ǅ: "Dž",
  ǆ: "dž",
  Ǉ: "LJ",
  ǈ: "Lj",
  ǉ: "lj",
  Ǌ: "NJ",
  ǋ: "Nj",
  ǌ: "nj",
  ﬀ: "ff",
  ﬁ: "fi",
  ﬂ: "fl",
  ﬃ: "ffi",
  ﬄ: "ffl",
  ﬅ: "ſt",
  ﬆ: "st"
};
function replaceLigatures(text) {
  if (!LIGATURE_ANY_RE.test(text)) return text;
  return text.replace(LIGATURE_ALL_RE, (m) => LIGATURE_MAP[m]);
}
const LIGATURE_INVERSE = Object.fromEntries(Object.entries(LIGATURE_MAP).map(([lig, expansion]) => [expansion, lig]));
function ligatureForText(text) {
  if (LIGATURE_MAP[text]) return text;
  return LIGATURE_INVERSE[text] || null;
}
function escapeXml(string) {
  return string.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function updateLineBbox(line, adjustBaseline = true) {
  const lineboxBottomOrig = line.bbox.bottom;
  const wordBoxArr = line.words.map((x) => x.bbox);
  line.bbox = calcBboxUnion(wordBoxArr);
  if (adjustBaseline) line.baseline[1] += lineboxBottomOrig - line.bbox.bottom;
}
function calcWordBbox(word) {
  if (!word.chars || word.chars.length === 0) return;
  const charBoxArr = word.chars.map((x) => x.bbox);
  word.bbox = calcBboxUnion(charBoxArr);
}
function rotateBbox(bbox, cosAngle, sinAngle, width, height) {
  const bboxOut = { ...bbox };
  const xCenter = width / 2;
  const yCenter = height / 2;
  bboxOut.left = cosAngle * (bbox.left - xCenter) - sinAngle * (bbox.bottom - yCenter) + xCenter;
  bboxOut.right = cosAngle * (bbox.right - xCenter) - sinAngle * (bbox.bottom - yCenter) + xCenter;
  bboxOut.top = sinAngle * (bbox.left - xCenter) + cosAngle * (bbox.top - yCenter) + yCenter;
  bboxOut.bottom = sinAngle * (bbox.left - xCenter) + cosAngle * (bbox.bottom - yCenter) + yCenter;
  return bboxOut;
}
function rotateLine(line, angle, dims = null, useCharLevel = false) {
  if (Math.abs(angle) <= 0.05) return;
  const dims1 = dims || line.page.dims;
  const sinAngle = Math.sin(angle * (Math.PI / 180));
  const cosAngle = Math.cos(angle * (Math.PI / 180));
  const { baseline } = line;
  const baselineAngleRadXML = Math.atan(baseline[0]);
  const baselineAngleRadAdj = angle * (Math.PI / 180);
  const baselineAngleRadTotal = Math.tan(baselineAngleRadXML + baselineAngleRadAdj);
  for (let i = 0; i < line.words.length; i++) {
    const word = line.words[i];
    if (useCharLevel && word.chars && word.chars.length > 0) {
      for (let j = 0; j < word.chars.length; j++) {
        const char = word.chars[j];
        char.bbox = rotateBbox(char.bbox, cosAngle, sinAngle, dims1.width, dims1.height);
      }
      ocr.calcWordBbox(word);
    } else {
      word.bbox = rotateBbox(word.bbox, cosAngle, sinAngle, dims1.width, dims1.height);
    }
  }
  const lineBoxRot = rotateBbox(line.bbox, cosAngle, sinAngle, dims1.width, dims1.height);
  updateLineBbox(line, false);
  const baselineOffsetAdj = lineBoxRot.bottom - line.bbox.bottom;
  const baselineOffsetTotal = baseline[1] + baselineOffsetAdj;
  line.baseline[0] = baselineAngleRadTotal;
  line.baseline[1] = baselineOffsetTotal;
}
function clonePage(page) {
  const pageNew = new OcrPage(page.n, { ...page.dims });
  pageNew.angle = page.angle;
  pageNew.textSource = page.textSource;
  pageNew.rules = (page.rules || []).map((rule) => ({ ...rule }));
  pageNew.tableBoxes = (page.tableBoxes || []).map((box) => ({ ...box }));
  const lineMap = /* @__PURE__ */ new Map();
  for (const line of page.lines) {
    const lineNew = cloneLine(line);
    lineNew.page = pageNew;
    lineMap.set(line, lineNew);
    pageNew.lines.push(lineNew);
  }
  for (const par of page.pars || []) {
    const parNew = new OcrPar(pageNew, { ...par.bbox });
    parNew.lines = par.lines.map((line) => lineMap.get(line)).filter(Boolean);
    parNew.id = par.id;
    parNew.reason = par.reason;
    parNew.type = par.type;
    parNew.marker = par.marker;
    parNew.parNum = par.parNum;
    parNew.footnoteRefId = par.footnoteRefId;
    parNew.headingLevel = par.headingLevel;
    Object.assign(parNew.debug, par.debug);
    for (const lineNew of parNew.lines) lineNew.par = parNew;
    pageNew.pars.push(parNew);
  }
  return pageNew;
}
function reIdPage(page) {
  const wordIdMap = /* @__PURE__ */ new Map();
  if (!page) return wordIdMap;
  const lines = new Set(page.lines || []);
  for (const par of page.pars || []) {
    par.id = getRandomAlphanum(8);
    for (const line of par.lines || []) lines.add(line);
  }
  for (const line of lines) {
    line.id = getRandomAlphanum(8);
    for (const word of line.words || []) {
      const newId = getRandomAlphanum(8);
      wordIdMap.set(word.id, newId);
      word.id = newId;
    }
  }
  return wordIdMap;
}
function cloneLine(line) {
  const lineNew = new OcrLine(line.page, { ...line.bbox }, line.baseline.slice(), line.ascHeight, line.xHeight);
  lineNew.id = line.id;
  lineNew.orientation = line.orientation;
  lineNew.lineNum = line.lineNum;
  lineNew.pageNum = line.pageNum;
  Object.assign(lineNew.debug, line.debug);
  for (const word of line.words) {
    const wordNew = cloneWord(word);
    wordNew.line = lineNew;
    lineNew.words.push(wordNew);
  }
  return lineNew;
}
function cloneWord(word) {
  const wordNew = new OcrWord(word.line, word.id, word.text, { ...word.bbox });
  wordNew.alt = word.alt ? word.alt.map((a) => ({ ...a })) : void 0;
  wordNew.conf = word.conf;
  wordNew.style = { ...word.style };
  if (word.styleRuns) wordNew.styleRuns = word.styleRuns.map((run) => ({ i: run.i, style: { ...run.style } }));
  wordNew.lang = word.lang;
  wordNew.compTruth = word.compTruth;
  wordNew.matchTruth = word.matchTruth;
  wordNew.visualCoords = word.visualCoords;
  Object.assign(wordNew.debug, word.debug);
  wordNew.footnoteParId = word.footnoteParId;
  if (word.chars) {
    wordNew.chars = [];
    for (const char of word.chars) {
      wordNew.chars.push(cloneChar(char));
    }
  }
  return wordNew;
}
function cloneChar(char) {
  const charNew = new OcrChar(char.text, { ...char.bbox });
  return charNew;
}
function getWordStyleSegments(word) {
  if (!word.styleRuns || word.styleRuns.length === 0) return null;
  const segments = [];
  let start = 0;
  let style = word.style;
  for (const run of word.styleRuns) {
    segments.push({ start, end: run.i, style });
    start = run.i;
    style = { ...word.style, ...run.style };
  }
  segments.push({ start, end: word.text.length, style });
  return segments.filter((segment) => segment.end > segment.start);
}
function getMatchingWords(text, ocrPage) {
  text = text.trim().toLowerCase();
  if (!text) return [];
  const textArr = text.split(" ");
  const wordArr = ocr.getPageWords(ocrPage);
  const matchArr = [];
  for (let i = 0; i < wordArr.length - (textArr.length - 1); i++) {
    const word = wordArr[i];
    if (!word.text.toLowerCase().includes(textArr[0])) continue;
    const candArr = wordArr.slice(i, i + textArr.length);
    const candText = candArr.map((x) => x.text).join(" ").toLowerCase();
    if (candText.toLowerCase().includes(text)) {
      matchArr.push(...candArr);
    }
  }
  return matchArr;
}
function getMatchingWordsInLine(text, line) {
  text = text.trim().toLowerCase();
  if (!text) return [];
  const textArr = text.split(" ");
  const wordArr = line.words;
  const matchArr = [];
  for (let i = 0; i <= wordArr.length - textArr.length; i++) {
    const word = wordArr[i];
    if (!word.text.toLowerCase().includes(textArr[0])) continue;
    const candArr = wordArr.slice(i, i + textArr.length);
    const candText = candArr.map((x) => x.text).join(" ").toLowerCase();
    if (candText.includes(text)) {
      matchArr.push(...candArr);
    }
  }
  return matchArr;
}
function getMatchingWordIds(text, ocrPage) {
  text = text.trim().toLowerCase();
  if (!text) return [];
  const textArr = text.split(" ");
  const wordArr = ocr.getPageWords(ocrPage);
  const matchIdArr = [];
  for (let i = 0; i < wordArr.length - (textArr.length - 1); i++) {
    const word = wordArr[i];
    if (!word.text.toLowerCase().includes(textArr[0])) continue;
    const candArr = wordArr.slice(i, i + textArr.length);
    const candText = candArr.map((x) => x.text).join(" ").toLowerCase();
    if (candText.toLowerCase().includes(text)) {
      matchIdArr.push(...candArr.map((x) => x.id));
    }
  }
  return matchIdArr;
}
function getDocMatches(text, ocrPages) {
  text = text.trim().toLowerCase();
  if (!text) return [];
  const textArr = text.split(" ");
  const matches = [];
  for (let p = 0; p < ocrPages.length; p++) {
    const page = ocrPages[p];
    if (!page) continue;
    const wordArr = ocr.getPageWords(page);
    for (let i = 0; i <= wordArr.length - textArr.length; i++) {
      const word = wordArr[i];
      if (!word.text.toLowerCase().includes(textArr[0])) continue;
      const candArr = wordArr.slice(i, i + textArr.length);
      const candText = candArr.map((x) => x.text).join(" ").toLowerCase();
      if (candText.includes(text)) {
        matches.push({ pageN: page.n, wordIds: candArr.map((x) => x.id) });
        i += textArr.length - 1;
      }
    }
  }
  return matches;
}
function getWordFillOpacity(word, displayMode, confThreshMed = 75, confThreshHigh = 85, overlayOpacity = 80) {
  let fillColorHex;
  if (word.conf > confThreshHigh) {
    fillColorHex = "#00ff7b";
  } else if (word.conf > confThreshMed) {
    fillColorHex = "#ffc800";
  } else {
    fillColorHex = "#ff0000";
  }
  const fillColorHexMatch = word.matchTruth ? "#00ff7b" : "#ff0000";
  let opacity;
  let fill;
  if (displayMode === "invis") {
    opacity = 0;
    fill = "black";
  } else if (displayMode === "annot") {
    opacity = 1;
    fill = "black";
  } else if (displayMode === "ebook") {
    opacity = 1;
    fill = "black";
  } else if (displayMode === "eval") {
    opacity = overlayOpacity / 100;
    fill = fillColorHexMatch;
  } else {
    opacity = overlayOpacity / 100;
    fill = fillColorHex;
  }
  return { opacity, fill };
}
const removeCircularRefsOcr = (pages, options = {}) => {
  const { includeText = false, includeCharBoxes = true } = options;
  const pagesClone = structuredClone(pages);
  pagesClone.forEach((page) => {
    if (!page) return;
    if (includeText) {
      page.text = getPageText(page);
    }
    page.pars.forEach((par) => {
      if (includeText) {
        par.text = getParText(par);
      }
      delete par.page;
      par.lineIds = par.lines.map((line) => line.id);
      delete par.lines;
      if (par.debug && !par.debug.raw && !par.debug.sourceType && !par.debug.sourceStyle) {
        delete par.debug;
      }
    });
    page.lines.forEach((line) => {
      if (includeText) {
        line.text = getLineText(line);
      }
      delete line.page;
      if (line.par) {
        line.parId = line.par.id;
      }
      delete line.par;
      if (line.debug && !line.debug.raw) {
        delete line.debug;
      }
      line.words.forEach((word) => {
        delete word.line;
        if (!includeCharBoxes) {
          delete word.chars;
        }
        if (word.debug && !word.debug.raw) {
          delete word.debug;
        }
      });
    });
  });
  return pagesClone;
};
const addCircularRefsOcr = (pages) => {
  pages.forEach((page) => {
    if (!page) return;
    delete page.text;
    page.lines.forEach((line) => {
      delete line.text;
      line.page = page;
      if (!line.debug) {
        line.debug = new LineDebugInfo();
      }
      line.words.forEach((word) => {
        word.line = line;
        if (word.footnoteParId === void 0) {
          word.footnoteParId = null;
        }
        delete word.lineNum;
        if (!word.debug) {
          word.debug = new WordDebugInfo();
        }
      });
    });
    if (!page.pars) {
      page.pars = [];
    }
    page.pars.forEach((par) => {
      delete par.text;
      par.page = page;
      if (!par.debug) {
        par.debug = new ParDebugInfo();
      }
      if (par.footnoteRefId === void 0) {
        par.footnoteRefId = null;
      }
      if (par.headingLevel === void 0) {
        par.headingLevel = null;
      }
      if (par.marker === void 0) par.marker = null;
      if (par.parNum === void 0) par.parNum = null;
      if (par.lineIds && !par.lines) {
        par.lines = par.lineIds.map((id) => page.lines.find((line) => line.id === id)).filter((line) => line !== void 0);
        delete par.lineIds;
      }
      if (!par.lines) {
        par.lines = [];
      }
    });
    page.lines.forEach((line) => {
      if (line.parId !== void 0) {
        line.par = page.pars.find((par) => par.id === line.parId) || null;
        delete line.parId;
      } else if (line.par === void 0) {
        line.par = null;
      }
    });
  });
  return pages;
};
const ocr = {
  OcrPage,
  OcrPar,
  OcrLine,
  OcrWord,
  OcrChar,
  ParDebugInfo,
  WordDebugInfo,
  LineDebugInfo,
  calcLineStartAngleAdj,
  updateLineBbox,
  calcBboxUnion,
  calcWordBbox,
  calcWordAngleAdj,
  getPageWord,
  getPageWords,
  getDistinctChars,
  getMatchingWords,
  getMatchingWordsInLine,
  getMatchingWordIds,
  getDocMatches,
  getPageText,
  getParText,
  getLineText,
  getRegionText,
  getPrevLine,
  getNextLine,
  getWordFillOpacity,
  clonePage,
  reIdPage,
  cloneLine,
  cloneWord,
  cloneChar,
  getWordStyleSegments,
  rotateLine,
  deletePageWords,
  replaceLigatures,
  ligatureForText,
  scaleLine,
  scalePage,
  escapeXml,
  removeCircularRefsOcr,
  addCircularRefsOcr,
  parIsFurniture
};
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
  constructor(coords, table2) {
    super(coords);
    this.type = "dataColumn";
    this.table = table2;
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
const superscriptCharsRegex = /[⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ⁺⁻⁼⁽⁾]+/g;
function splitUnicodeSuperscripts(lineObj, wordPolys) {
  const newWords = [];
  for (let i = 0; i < lineObj.words.length; i++) {
    const wordObj = lineObj.words[i];
    const text = wordObj.text;
    if (!superscriptCharsRegex.test(text)) {
      newWords.push(wordObj);
      continue;
    }
    superscriptCharsRegex.lastIndex = 0;
    const segments = [];
    let lastIndex = 0;
    let match;
    while (true) {
      match = superscriptCharsRegex.exec(text);
      if (match === null) break;
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), isSup: false });
      }
      segments.push({ text: match[0], isSup: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isSup: false });
    }
    if (segments.length === 1) {
      wordObj.text = removeSuperscript(wordObj.text);
      wordObj.style.sup = segments[0].isSup;
      newWords.push(wordObj);
      continue;
    }
    const wordWidth = wordObj.bbox.right - wordObj.bbox.left;
    const totalChars = text.length;
    let charOffset = 0;
    const wordPoly = wordPolys?.get(wordObj.id);
    for (let j = 0; j < segments.length; j++) {
      const segment = segments[j];
      const segmentChars = segment.text.length;
      const startRatio = charOffset / totalChars;
      const endRatio = (charOffset + segmentChars) / totalChars;
      const wordHeight = wordObj.bbox.bottom - wordObj.bbox.top;
      const supHeightRatio = 0.58;
      const supBottomOffset = wordHeight * 0.42;
      const segmentBbox = {
        left: Math.round(wordObj.bbox.left + wordWidth * startRatio),
        top: wordObj.bbox.top,
        right: Math.round(wordObj.bbox.left + wordWidth * endRatio),
        bottom: segment.isSup ? Math.round(wordObj.bbox.top + supBottomOffset) : wordObj.bbox.bottom
      };
      const segmentId = j === 0 ? wordObj.id : `${wordObj.id}_${j}`;
      const segmentText = segment.isSup ? removeSuperscript(segment.text) : segment.text;
      if (wordPoly) {
        const polyWidth = wordPoly.tr.x - wordPoly.tl.x;
        const polyBottomWidth = wordPoly.br.x - wordPoly.bl.x;
        const polyHeight = (wordPoly.bl.y - wordPoly.tl.y + (wordPoly.br.y - wordPoly.tr.y)) / 2;
        const blY = segment.isSup ? wordPoly.tl.y + polyHeight * supHeightRatio : wordPoly.bl.y;
        const brY = segment.isSup ? wordPoly.tr.y + polyHeight * supHeightRatio : wordPoly.br.y;
        wordPolys.set(segmentId, {
          tl: {
            x: wordPoly.tl.x + polyWidth * startRatio,
            y: wordPoly.tl.y
          },
          tr: {
            x: wordPoly.tl.x + polyWidth * endRatio,
            y: wordPoly.tr.y
          },
          bl: {
            x: wordPoly.bl.x + polyBottomWidth * startRatio,
            y: blY
          },
          br: {
            x: wordPoly.bl.x + polyBottomWidth * endRatio,
            y: brY
          }
        });
      }
      const segmentWord = new ocr.OcrWord(lineObj, segmentId, segmentText, segmentBbox);
      segmentWord.conf = wordObj.conf;
      segmentWord.lang = wordObj.lang;
      if (segment.isSup) {
        segmentWord.style.sup = true;
      }
      newWords.push(segmentWord);
      charOffset += segmentChars;
    }
  }
  lineObj.words = newWords;
}
function pass2(pageObj, rotateAngle) {
  for (const lineObj of pageObj.lines) {
    ocr.updateLineBbox(lineObj);
  }
  if (Math.abs(rotateAngle) > 0.05) {
    for (let i = 0; i < pageObj.lines.length; i++) {
      ocr.rotateLine(pageObj.lines[i], rotateAngle, null, true);
    }
  }
  for (let i = 0; i < pageObj.lines.length; i++) {
    const lineObj = pageObj.lines[i];
    let firstWord = false;
    const smallCapsWordArr = [];
    const titleCaseArr = [];
    for (let j = 0; j < lineObj.words.length; j++) {
      const wordObj = lineObj.words[j];
      if (wordObj.style.smallCaps) {
        smallCapsWordArr.push(wordObj);
        firstWord = true;
        continue;
      }
      if (!/[a-z]/.test(wordObj.text) && /[A-Z].?[A-Z]/.test(wordObj.text) && wordObj.chars) {
        const letterChars = wordObj.chars.filter((x) => /[a-z]/i.test(x.text));
        const firstLetterHeight = letterChars[0].bbox.bottom - letterChars[0].bbox.top;
        const otherLetters = letterChars.slice(1).filter((x) => !/[q]/i.test(x.text));
        if (otherLetters.length === 0) continue;
        const otherLetterHeightArr = otherLetters.map((x) => x.bbox.bottom - x.bbox.top);
        const otherLetterHeightMax = Math.max(...otherLetterHeightArr);
        const otherLetterHeightMin = Math.min(...otherLetterHeightArr);
        const firstLetterThresh = ["q", "Q"].includes(letterChars[0].text) ? 1.3 : 1.1;
        if (firstLetterHeight > otherLetterHeightMax * firstLetterThresh) {
          if (otherLetterHeightMax / otherLetterHeightMin < 1.15) {
            smallCapsWordArr.push(wordObj);
            if (j === 0) firstWord = true;
            titleCaseArr[smallCapsWordArr.length - 1] = true;
          }
        } else {
          const letterCharsAsc = wordObj.chars.filter((x) => /[a-pr-z]/i.test(x.text));
          if (letterCharsAsc.length < 2) continue;
          const allLetterHeightArr = letterCharsAsc.map((x) => x.bbox.bottom - x.bbox.top);
          const allLetterHeightMax = Math.max(...allLetterHeightArr);
          const allLetterHeightMin = Math.min(...allLetterHeightArr);
          if (allLetterHeightMax / allLetterHeightMin < 1.15) {
            smallCapsWordArr.push(wordObj);
            if (j === 0) firstWord = true;
            titleCaseArr[smallCapsWordArr.length - 1] = false;
          }
        }
      }
    }
    if (firstWord || smallCapsWordArr.length >= 2) {
      const titleCaseTotal = titleCaseArr.reduce((x, y) => Number(x) + Number(y), 0);
      for (let k = 0; k < smallCapsWordArr.length; k++) {
        const wordObj = smallCapsWordArr[k];
        wordObj.style.smallCaps = true;
        if (!wordObj.chars || !titleCaseTotal) continue;
        if (titleCaseArr[k]) {
          wordObj.chars.slice(1).forEach((x) => {
            x.text = x.text.toLowerCase();
          });
          wordObj.text = wordObj.chars.map((x) => x.text).join("");
        } else {
          wordObj.chars.forEach((x) => {
            x.text = x.text.toLowerCase();
          });
          wordObj.text = wordObj.chars.map((x) => x.text).join("");
        }
      }
    }
  }
  for (const lineObj of pageObj.lines) {
    for (let i = 0; i < lineObj.words.length; i++) {
      const wordObj = lineObj.words[i];
      if (["chi_sim", "chi_tra"].includes(wordObj.lang) || !wordObj.chars || wordObj.chars.length === 0) continue;
      const trailingNumStr = wordObj.text.match(/\d+$/)?.[0];
      if (!trailingNumStr) continue;
      const lineboxAdj = { ...lineObj.bbox };
      if (lineObj.baseline[0] < 0) {
        lineboxAdj.top -= (lineboxAdj.right - lineboxAdj.left) * lineObj.baseline[0];
      } else {
        lineboxAdj.bottom -= (lineboxAdj.right - lineboxAdj.left) * lineObj.baseline[0];
      }
      const baselinePointAdj = lineObj.baseline[0] < 0 ? lineObj.baseline[1] : lineObj.baseline[1] + (lineObj.bbox.bottom - lineboxAdj.bottom);
      const expectedBaseline = (wordObj.bbox.left + (wordObj.bbox.right - wordObj.bbox.left) / 2 - lineboxAdj.left) * lineObj.baseline[0] + baselinePointAdj + lineboxAdj.bottom;
      const lineAscHeight = expectedBaseline - lineboxAdj.top;
      let baseN = 0;
      for (let j = wordObj.chars.length - 1; j >= 0; j--) {
        const charObj = wordObj.chars[j];
        if (charObj.bbox.bottom < expectedBaseline - lineAscHeight / 4) {
          baseN++;
        } else {
          break;
        }
      }
      const superN = Math.min(trailingNumStr.length, baseN);
      if (superN === 0) continue;
      if (superN === wordObj.text.length) {
        wordObj.style.sup = true;
        wordObj.style.bold = false;
        wordObj.style.italic = false;
        wordObj.style.underline = false;
        continue;
      }
      const wordObjSup = ocr.cloneWord(wordObj);
      const charCoreArr = wordObj.chars.slice(0, wordObj.chars.length - superN);
      const wordObjSupChars = (
        /** @type {OcrChar[]} */
        wordObjSup.chars
      );
      const charSuperArr = wordObjSupChars.slice(wordObj.chars.length - superN, wordObj.chars.length);
      const textCore = charCoreArr.map((x) => x.text).join("");
      const textSuper = charSuperArr.map((x) => x.text).join("");
      wordObjSup.text = textSuper;
      wordObjSup.chars = charSuperArr;
      wordObjSup.style.bold = false;
      wordObjSup.style.italic = false;
      wordObjSup.style.underline = false;
      wordObjSup.style.sup = true;
      wordObjSup.id = `${wordObj.id}a`;
      ocr.calcWordBbox(wordObjSup);
      wordObj.text = textCore;
      wordObj.chars = charCoreArr;
      ocr.calcWordBbox(wordObj);
      lineObj.words.splice(i + 1, 0, wordObjSup);
      i++;
    }
  }
}
function pass3(pageObj) {
  const langSet = /* @__PURE__ */ new Set();
  if (!pageObj.angle) {
    const angleRisePage = [];
    for (const lineObj of pageObj.lines) {
      if (lineObj.bbox.right - lineObj.bbox.left >= 200) {
        angleRisePage.push(lineObj.baseline[0]);
      }
    }
    const angleRiseMedian = mean50(angleRisePage) || 0;
    pageObj.angle = Math.asin(angleRiseMedian) * (180 / Math.PI);
  }
  for (const lineObj of pageObj.lines) {
    const lineAscHeightArr = [];
    const lineXHeightArr = [];
    const lineAllHeightArr = [];
    for (const wordObj of lineObj.words) {
      const letterArr = wordObj.text.split("");
      const charObjArr = wordObj.chars;
      langSet.add(wordObj.lang);
      if (wordObj.chars && wordObj.chars.length !== wordObj.text.length) continue;
      if (['"', "'"].includes(letterArr[0]) && letterArr.length > 1 && /[a-z\d]/i.test(letterArr[1])) {
        if (letterArr[0] === '"') {
          letterArr[0] = "“";
          if (charObjArr) charObjArr[0].text = "“";
        } else if (letterArr[0] === "'") {
          letterArr[0] = "‘";
          if (charObjArr) charObjArr[0].text = "‘";
        }
      }
      if (['"', "'"].includes(letterArr[letterArr.length - 1]) && /[a-z\d][.,!?;]?['"]$/i.test(wordObj.text)) {
        if (letterArr[letterArr.length - 1] === '"') {
          letterArr[letterArr.length - 1] = "”";
          if (charObjArr) charObjArr[letterArr.length - 1].text = "”";
        } else if (letterArr[letterArr.length - 1] === "'") {
          letterArr[letterArr.length - 1] = "’";
          if (charObjArr) charObjArr[letterArr.length - 1].text = "’";
        }
      }
      for (let k = 0; k < letterArr.length; k++) {
        if (["'"].includes(letterArr[k]) && k > 0 && k + 1 < letterArr.length && /[a-z\d]/i.test(letterArr[k + 1]) && /[a-z\d]/i.test(letterArr[k - 1])) {
          letterArr[k] = "’";
          if (charObjArr) charObjArr[k].text = "’";
        }
      }
      if (wordObj.chars) {
        for (let k = 0; k < letterArr.length; k++) {
          const charObj = wordObj.chars[k];
          if (wordObj.style.sup || wordObj.style.dropcap) continue;
          const contentStrLetter = letterArr[k];
          const charHeight = charObj.bbox.bottom - charObj.bbox.top;
          const ascChar = wordObj.style.smallCaps && /[A-Z0-9]/.test(contentStrLetter) || !wordObj.style.smallCaps && ascCharArr.includes(contentStrLetter);
          const xChar = wordObj.style.smallCaps && /[a-z]/.test(contentStrLetter) || !wordObj.style.smallCaps && xCharArr.includes(contentStrLetter);
          lineAllHeightArr.push(charHeight);
          if (ascChar) {
            lineAscHeightArr.push(charHeight);
          } else if (xChar) {
            lineXHeightArr.push(charHeight);
          }
        }
      }
      wordObj.text = letterArr.join("");
    }
    const lineAllHeight = Math.max(...lineAllHeightArr);
    const lineAscHeight = quantile(lineAscHeightArr, 0.5);
    const lineXHeight = quantile(lineXHeightArr, 0.5);
    if (lineAscHeight) lineObj.ascHeight = lineAscHeight;
    if (lineXHeight) lineObj.xHeight = lineXHeight;
    if (lineObj.ascHeight && lineObj.xHeight && lineObj.xHeight >= lineObj.ascHeight * 0.9) {
      if (lineAscHeightArr.length > lineXHeightArr.length) {
        lineObj.xHeight = null;
      } else {
        lineObj.ascHeight = null;
      }
    }
    if (!lineAscHeight && !lineXHeight && lineAllHeight && Number.isFinite(lineAllHeight)) lineObj.ascHeight = lineAllHeight;
    for (const wordObj of lineObj.words) {
      if (wordObj.chars && wordObj.chars.length !== wordObj.text.length) continue;
      const letterArr = wordObj.text.split("");
      const charObjArr = wordObj.chars;
      if (!charObjArr || !wordObj.line.xHeight) continue;
      for (let k = 0; k < letterArr.length; k++) {
        const enoughInfo = letterArr.length > 2 || wordObj.line.words.length > 2;
        if (["-", "–", "—", "¬"].includes(letterArr[k]) && enoughInfo) {
          let charWidth = charObjArr[k].bbox.right - charObjArr[k].bbox.left;
          if (charObjArr[k - 1]) {
            const rightBound = charObjArr[k + 1] ? charObjArr[k + 1].bbox.left : charObjArr[k].bbox.right;
            const charWidth2 = rightBound - charObjArr[k - 1].bbox.right;
            charWidth = Math.min(charWidth, charWidth2);
          }
          const charWidthNorm = charWidth / wordObj.line.xHeight;
          if (charWidthNorm > 1.5) {
            letterArr[k] = "—";
            if (charObjArr) charObjArr[k].text = "—";
          } else if (charWidthNorm > 0.9) {
            letterArr[k] = "–";
            if (charObjArr) charObjArr[k].text = "–";
          } else {
            letterArr[k] = "-";
            if (charObjArr) charObjArr[k].text = "-";
          }
        }
      }
      wordObj.text = ocr.replaceLigatures(letterArr.join(""));
    }
  }
  return langSet;
}
const abbyyDropCapRegex = /<par dropCapCharsCount=['"](\d*)/i;
const abbyyLineBoxRegex = /<line baseline=['"](\d*)['"] l=['"](\d*)['"] t=['"](\d*)['"] r=['"](\d*)['"] b=['"](\d*)['"]>/i;
const abbyySplitRegex = /(?:<charParams[^>]*>\s*<\/charParams>)|(?:<\/formatting>\s*(?=<formatting))/ig;
const abbyyCharRegex = /(<formatting[^>]+>\s*)?<charParams l=['"](\d*)['"] t=['"](\d*)['"] r=['"](\d*)['"] b=['"](\d*)['"](?: suspicious=['"](\w*)['"])?[^>]*>([^<]*)<\/charParams>/ig;
async function convertPageAbbyy({ ocrStr, n }) {
  const pageAttrStr = ocrStr.match(/<page[^>]*>/);
  const widthStr = pageAttrStr?.[0].match(/width=['"](\d+)['"]/)?.[1];
  const heightStr = pageAttrStr?.[0].match(/height=['"](\d+)['"]/)?.[1];
  const rotationStr = pageAttrStr?.[0].match(/rotation=['"](\w+)['"]/)?.[1];
  if (!widthStr || !heightStr) throw new Error("Failed to parse page dimensions.");
  let pageOrientation = 0;
  if (rotationStr === "RotatedClockwise") {
    pageOrientation = 3;
  } else if (rotationStr === "RotatedUpsidedown") {
    pageOrientation = 2;
  } else if (rotationStr === "RotatedCounterclockwise") {
    pageOrientation = 1;
  }
  const pageDims = { height: parseInt(heightStr), width: parseInt(widthStr) };
  const pageObj = new ocr.OcrPage(n, pageDims);
  pageObj.textSource = "abbyy";
  if (!/<charParams/i.test(ocrStr)) {
    const warn = { char: "char_error" };
    return {
      pageObj,
      charMetricsObj: {},
      dataTables: new LayoutDataTablePage(n),
      warn
    };
  }
  const tablesPage = convertTableLayoutAbbyy(n, ocrStr);
  const angleRisePage = [];
  function convertTextAbbyy(xmlText) {
    const textAttrStr = xmlText.match(/<text[^>]*>/);
    const textOrientationStr = textAttrStr?.[0].match(/orientation=['"](\w+)['"]/)?.[1];
    let textOrientation = 0;
    if (textOrientationStr === "RotatedClockwise") {
      textOrientation = 1;
    } else if (textOrientationStr === "RotatedUpsidedown") {
      textOrientation = 2;
    } else if (textOrientationStr === "RotatedCounterclockwise") {
      textOrientation = 3;
    }
    const textOrientationFinal = (pageOrientation + textOrientation) % 4;
    function convertParAbbyy(xmlPar) {
      const parLineArr = [];
      function convertLineAbbyy(xmlLine) {
        const baselineSlopeArr = (
          /** @type {Array<Number>} */
          []
        );
        const baselineFirst = (
          /** @type {Array<Number>} */
          []
        );
        const xmlLinePreChar = xmlLine.match(/^[\s\S]*?(?=<charParams)/)?.[0];
        const xmlLineFormatting = xmlLinePreChar?.match(/<formatting[^>]+/)?.[0];
        const fontName = xmlLineFormatting?.match(/ff=['"]([^'"]*)/)?.[1];
        let dropCap = false;
        const dropCapMatch = xmlLine.match(abbyyDropCapRegex);
        if (dropCapMatch != null && parseInt(dropCapMatch[1]) > 0) {
          dropCap = true;
        }
        let lineBoxArr = xmlLine.match(abbyyLineBoxRegex);
        if (lineBoxArr == null) return;
        lineBoxArr = [...lineBoxArr].map((x) => parseInt(x));
        xmlLine = xmlLine.replaceAll(/isTab=['"](?:1|true)['"][^>]*>[^<]+/ig, "> ");
        xmlLine = xmlLine.replaceAll(/(<\/formatting><formatting[^>]*>\s*)<charParams[^>]*>\s*<\/charParams>/ig, "$1");
        xmlLine = xmlLine.replaceAll(/<charParams[^>]*>\s*<\/charParams>(\s*<\/formatting><formatting[^>]*>\s*)/ig, "$1");
        const wordStrArr1 = xmlLine.split(abbyySplitRegex);
        const wordStrArr = [];
        for (let i = 0; i < wordStrArr1.length; i++) {
          const wordStrArrI = wordStrArr1[i];
          const wordMatch = wordStrArrI.match(/>([^<>]+?)(?=<\/charParams>)/g)?.map((x) => x.substring(1));
          if (!wordMatch) {
            continue;
          } else if (wordMatch.length === 1) {
            if (wordMatch[0] === ".") {
              if (wordStrArr.length > 0 && !/superscript=['"](1|true)/i.test(wordStrArr[wordStrArr.length - 1])) {
                wordStrArr[wordStrArr.length - 1] = wordStrArr[wordStrArr.length - 1] + wordStrArrI.replace(/(<formatting[^>]+>\s*)/i, "");
                continue;
              }
            }
          }
          wordStrArr.push(wordStrArrI);
        }
        if (wordStrArr.length === 0) return;
        const bboxes = Array(wordStrArr.length);
        let text = Array(wordStrArr.length);
        const charObjArrLine = Array(wordStrArr.length);
        text = text.fill("");
        const italicArr = Array(wordStrArr.length).fill(false);
        const boldArr = Array(wordStrArr.length).fill(false);
        const underlineArr = Array(wordStrArr.length).fill(false);
        const supArr = Array(wordStrArr.length).fill(false);
        const dropcapArr = Array(wordStrArr.length).fill(false);
        const smallCapsArr = Array(wordStrArr.length).fill(false);
        const wordSusp = Array(wordStrArr.length).fill(false);
        for (let i = 0; i < wordStrArr.length; i++) {
          const wordStr = wordStrArr[i];
          const letterArr = [...wordStr.matchAll(abbyyCharRegex)];
          if (typeof letterArr[0][1] !== "undefined") {
            if (dropCap && i === 0) {
              dropcapArr[i] = true;
            } else if (/superscript=['"](1|true)/i.test(letterArr[0][1])) {
              supArr[i] = true;
            } else {
              if (/italic=['"](1|true)/i.test(letterArr[0][1])) {
                italicArr[i] = true;
              }
              if (/bold=['"](1|true)/i.test(letterArr[0][1])) {
                boldArr[i] = true;
              }
              if (/underline=['"](1|true)/i.test(letterArr[0][1])) {
                underlineArr[i] = true;
              }
            }
            if (/smallcaps=['"](1|true)/i.test(letterArr[0][1])) {
              smallCapsArr[i] = true;
            }
          } else if (i > 0 && !dropcapArr[i - 1]) {
            italicArr[i] = italicArr[i - 1];
            boldArr[i] = boldArr[i - 1];
            underlineArr[i] = underlineArr[i - 1];
            supArr[i] = supArr[i - 1];
            smallCapsArr[i] = smallCapsArr[i - 1];
          }
          let dropCapFix = false;
          if (dropCap && i === 1 && smallCapsArr[i]) {
            smallCapsArr[i] = false;
            dropCapFix = true;
          }
          bboxes[i] = [];
          charObjArrLine[i] = [];
          for (let j = 0; j < letterArr.length; j++) {
            if (letterArr[j][2] === "0") {
              continue;
            }
            const bboxRaw = {
              l: parseInt(letterArr[j][2]),
              t: parseInt(letterArr[j][3]),
              r: parseInt(letterArr[j][4]),
              b: parseInt(letterArr[j][5])
            };
            let bbox2;
            if (textOrientationFinal === 1) {
              bbox2 = {
                left: Math.round(bboxRaw.t),
                top: Math.round(pageDims.width - Math.max(bboxRaw.r, bboxRaw.l)),
                right: Math.round(bboxRaw.b),
                bottom: Math.round(pageDims.width - Math.min(bboxRaw.l, bboxRaw.l))
              };
            } else if (textOrientationFinal === 2) {
              bbox2 = {
                left: Math.round(pageDims.width - bboxRaw.r),
                top: Math.round(pageDims.height - bboxRaw.b),
                right: Math.round(pageDims.width - bboxRaw.l),
                bottom: Math.round(pageDims.height - bboxRaw.t)
              };
            } else if (textOrientationFinal === 3) {
              bbox2 = {
                left: Math.round(pageDims.height - bboxRaw.b),
                top: Math.round(Math.min(bboxRaw.l, bboxRaw.l)),
                right: Math.round(pageDims.height - bboxRaw.t),
                bottom: Math.round(Math.max(bboxRaw.r, bboxRaw.r))
              };
            } else {
              bbox2 = {
                left: Math.round(bboxRaw.l),
                top: Math.round(bboxRaw.t),
                right: Math.round(bboxRaw.r),
                bottom: Math.round(bboxRaw.b)
              };
            }
            bboxes[i][j] = bbox2;
            let letterSusp = false;
            if (letterArr[j][6] === "1" || letterArr[j][6] === "true") {
              wordSusp[i] = true;
              letterSusp = true;
            }
            if (dropCapFix) {
              letterArr[j][7] = letterArr[j][7].toUpperCase();
            }
            letterArr[j][7] = unescapeXml(letterArr[j][7]);
            const contentStrLetter = letterArr[j][7];
            const ascChar = ascCharArr.includes(contentStrLetter);
            const xChar = xCharArr.includes(contentStrLetter);
            if ((ascChar || xChar) && !letterSusp && !dropCapFix && !(dropCap && i === 0)) {
              if (baselineFirst.length === 0) {
                baselineFirst.push(bboxes[i][j].left, bboxes[i][j].bottom);
              } else {
                const baselineSlope2 = (bboxes[i][j].bottom - baselineFirst[1]) / (bboxes[i][j].left - baselineFirst[0]);
                if (Number.isFinite(baselineSlope2)) baselineSlopeArr.push(baselineSlope2);
              }
            }
            text[i] += contentStrLetter;
            const charObj = new ocr.OcrChar(contentStrLetter, bbox2);
            charObjArrLine[i].push(charObj);
          }
        }
        const lineBoxArrCalc = new Array(4);
        lineBoxArrCalc[0] = Math.min(...bboxes.reduce((acc, val) => acc.concat(val), []).map((x) => x.left).filter((x) => x > 0));
        lineBoxArrCalc[1] = Math.min(...bboxes.reduce((acc, val) => acc.concat(val), []).map((x) => x.top).filter((x) => x > 0));
        lineBoxArrCalc[2] = Math.max(...bboxes.reduce((acc, val) => acc.concat(val), []).map((x) => x.right).filter((x) => x > 0));
        lineBoxArrCalc[3] = Math.max(...bboxes.reduce((acc, val) => acc.concat(val), []).map((x) => x.bottom).filter((x) => x > 0));
        const baselineSlope = quantile(baselineSlopeArr, 0.5) || 0;
        let baselinePoint = baselineFirst[1] - lineBoxArrCalc[3];
        if (baselineSlope < 0) {
          baselinePoint -= baselineSlope * (baselineFirst[0] - lineBoxArrCalc[0]);
        }
        baselinePoint = baselinePoint || 0;
        const lineBoxArrOut = Number.isFinite(lineBoxArrCalc[0]) && Number.isFinite(lineBoxArrCalc[1]) && Number.isFinite(lineBoxArrCalc[2]) && Number.isFinite(lineBoxArrCalc[3]) ? lineBoxArrCalc : lineBoxArr.slice(2, 6);
        const baselineOut = [round6$1(baselineSlope), Math.round(baselinePoint)];
        const bbox = {
          left: lineBoxArrOut[0],
          top: lineBoxArrOut[1],
          right: lineBoxArrOut[2],
          bottom: lineBoxArrOut[3]
        };
        const lineObj = new ocr.OcrLine(pageObj, bbox, baselineOut);
        lineObj.orientation = textOrientationFinal;
        let lettersKept = 0;
        for (let i = 0; i < text.length; i++) {
          if (text[i].trim() === "") continue;
          const bboxesI = bboxes[i];
          const bboxesILeft = Math.min(...bboxesI.map((x) => x.left).filter((x) => x > 0));
          const bboxesIRight = Math.max(...bboxesI.map((x) => x.right).filter((x) => x > 0));
          const bboxesITop = Math.min(...bboxesI.map((x) => x.top).filter((x) => x > 0));
          const bboxesIBottom = Math.max(...bboxesI.map((x) => x.bottom).filter((x) => x > 0));
          if (!Number.isFinite(bboxesITop) || !Number.isFinite(bboxesIBottom) || !Number.isFinite(bboxesILeft) || !Number.isFinite(bboxesIRight)) {
            continue;
          }
          const bboxWord = {
            left: bboxesILeft,
            top: bboxesITop,
            right: bboxesIRight,
            bottom: bboxesIBottom
          };
          const id = `word_${n + 1}_${pageObj.lines.length + 1}_${i + 1}`;
          const wordObj = new ocr.OcrWord(lineObj, id, text[i], bboxWord);
          wordObj.chars = charObjArrLine[i];
          wordObj.conf = wordSusp[i] ? 0 : 100;
          console.assert(wordObj.chars.length === text[i].length, `Likely parsing error for word: ${id}. Number of letters in text does not match number of \`ocrChar\` objects.`);
          if (italicArr[i]) {
            wordObj.style.italic = true;
          }
          if (boldArr[i]) {
            wordObj.style.bold = true;
          }
          if (underlineArr[i]) {
            wordObj.style.underline = true;
          }
          wordObj.style.smallCaps = smallCapsArr[i];
          if (fontName) wordObj.style.font = fontName;
          if (supArr[i]) {
            wordObj.style.sup = true;
          } else if (dropcapArr[i]) {
            wordObj.style.dropcap = true;
          }
          lineObj.words.push(wordObj);
          lettersKept++;
        }
        if (lettersKept === 0) return;
        pageObj.lines.push(lineObj);
        parLineArr.push(lineObj);
        return baselineSlope;
      }
      const lineStrArr = xmlPar.split(/<\/line>/);
      for (let i = 0; i < lineStrArr.length; i++) {
        const angle = convertLineAbbyy(lineStrArr[i]);
        if (typeof angle === "number" && !Number.isNaN(angle)) angleRisePage.push(angle);
      }
      if (parLineArr.length === 0) return;
      const parbox = calcBboxUnion(parLineArr.map((x) => x.bbox));
      const parObj = new ocr.OcrPar(pageObj, parbox);
      parLineArr.forEach((x) => {
        x.par = parObj;
      });
      parObj.lines = parLineArr;
      pageObj.pars.push(parObj);
    }
    const parStrArr = xmlText.split(/<\/par>/);
    for (let i = 0; i < parStrArr.length; i++) {
      convertParAbbyy(parStrArr[i]);
    }
  }
  const textStrArr = ocrStr.split(/<\/text>/);
  for (let i = 0; i < textStrArr.length; i++) {
    convertTextAbbyy(textStrArr[i]);
  }
  const angleRiseMedian = mean50(angleRisePage) || 0;
  const angleOut = Math.asin(angleRiseMedian) * (180 / Math.PI);
  pageObj.angle = angleOut;
  const langSet = pass3(pageObj);
  return { pageObj, dataTables: tablesPage, langSet };
}
function convertTableLayoutAbbyy(n, ocrStr) {
  const tableRegex = /<block blockType=["']Table[\s\S]+?(?:<\/block>\s*)/ig;
  const tablesStrArr = ocrStr.match(tableRegex);
  const tablesPage = new LayoutDataTablePage(n);
  if (!tablesStrArr) return tablesPage;
  for (let i = 0; i < tablesStrArr.length; i++) {
    const tableBoxes = [];
    const tableStr = tablesStrArr[i];
    const tableCoords = tableStr.match(/<block blockType=['"]Table['"][^>]*?l=['"](\d+)['"] t=['"](\d+)['"] r=['"](\d+)['"] b=['"](\d+)['"]/i)?.slice(1, 5).map((x) => parseInt(x));
    if (!tableCoords || tableCoords[0] === void 0 || tableCoords[1] === void 0 || tableCoords[2] === void 0 || tableCoords[3] === void 0) {
      console.log("Failed to parse table");
      continue;
    }
    let leftLast = tableCoords?.[0];
    const rows = tableStr.match(/<row[\s\S]+?(?:<\/row>\s*)/g);
    const firstRow = rows?.[1] && /colSpan/.test(rows[0]) ? rows[1] : rows?.[0];
    const firstRowCells = firstRow?.match(/<cell[\s\S]+?(?:<\/cell>\s*)/ig);
    if (leftLast === null || leftLast === void 0 || !firstRowCells || !rows) {
      console.warn("Failed to parse table:");
      console.warn(tableStr);
      continue;
    }
    const table2 = new LayoutDataTable(tablesPage);
    table2.detectionMethod = "abbyy";
    for (let j = 0; j < firstRowCells.length; j++) {
      const cell = firstRowCells[j];
      const cellWidth = parseInt(cell.match(/width=['"](\d+)['"]/)?.[1]);
      const cellLeft = leftLast;
      const cellRight = leftLast + cellWidth;
      leftLast = cellRight;
      tableBoxes.push(new LayoutDataColumn({
        left: cellLeft,
        top: tableCoords[1],
        right: cellRight,
        bottom: tableCoords[3]
      }, table2));
    }
    if (Math.abs(leftLast - tableCoords[2]) > 10) {
      let colLeftArr = [];
      let colRightArr = [];
      for (let j = 0; j < rows.length; j++) {
        const cells = rows[j].match(/<cell[\s\S]+?(?:<\/cell>\s*)/ig);
        if (!cells) {
          console.warn("Failed to parse rows:");
          continue;
        }
        for (let k = 0; k < cells.length; k++) {
          const coordsArrStr = cells[k].match(/l=['"](\d+)['"] t=['"](\d+)['"] r=['"](\d+)['"] b=['"](\d+)['"]/ig);
          if (!coordsArrStr) continue;
          const coordsArr = coordsArrStr.map((x) => x.match(/\d+/g).map((y) => parseInt(y)));
          const cellLeft = Math.min(...coordsArr.map((x) => x[0]));
          const cellRight = Math.max(...coordsArr.map((x) => x[2]));
          if (!colLeftArr[k]) {
            colLeftArr[k] = [];
            colRightArr[k] = [];
          }
          colLeftArr[k].push(cellLeft);
          colRightArr[k].push(cellRight);
        }
      }
      colLeftArr = colLeftArr.filter((x) => x);
      colRightArr = colRightArr.filter((x) => x);
      const colLeftMin = colLeftArr.map((x) => Math.min(...x));
      const colRightMax = [];
      for (let j = 0; j < colRightArr.length; j++) {
        const colRightArrJ = j + 1 === colRightArr.length ? colRightArr[j] : colRightArr[j].filter((x) => x < colLeftMin[j + 1]);
        colRightMax.push(Math.max(...colRightArrJ));
      }
      tableBoxes.length = 0;
      for (let j = 0; j < colLeftArr.length; j++) {
        let cellLeft;
        if (j === 0) {
          cellLeft = tableCoords[0];
        } else if (!Number.isFinite(colRightMax[j - 1])) {
          cellLeft = Math.round(colLeftMin[j]);
        } else {
          cellLeft = Math.round((colLeftMin[j] + colRightMax[j - 1]) / 2);
        }
        let cellRight;
        if (j + 1 === colLeftArr.length) {
          cellRight = tableCoords[2];
        } else if (!Number.isFinite(colRightMax[j])) {
          cellRight = colLeftMin[j + 1];
        } else {
          cellRight = Math.round((colLeftMin[j + 1] + colRightMax[j]) / 2);
        }
        tableBoxes.push(new LayoutDataColumn({
          left: cellLeft,
          top: tableCoords[1],
          right: cellRight,
          bottom: tableCoords[3]
        }, table2));
      }
    }
    table2.boxes = tableBoxes;
    table2.rowBounds = [];
    for (const rowStr of rows) {
      const coordsArrStr = rowStr.match(/l=['"]\d+['"] t=['"]\d+['"] r=['"]\d+['"] b=['"](\d+)['"]/ig);
      let maxBottom = 0;
      if (coordsArrStr) {
        for (const coordStr of coordsArrStr) {
          const b = parseInt(coordStr.match(/b=['"](\d+)['"]/i)?.[1] || "0");
          if (b > maxBottom) maxBottom = b;
        }
      }
      table2.rowBounds.push(maxBottom);
    }
    tablesPage.tables.push(table2);
  }
  return tablesPage;
}
async function convertPageAlto({ ocrStr, n }) {
  const pageElement = ocrStr.match(/<Page[^>]+>/i);
  if (!pageElement) throw new Error("Failed to parse ALTO page element.");
  const heightStr = pageElement[0].match(/HEIGHT=["'](\d+)["']/i)?.[1];
  const widthStr = pageElement[0].match(/WIDTH=["'](\d+)["']/i)?.[1];
  if (!heightStr || !widthStr) throw new Error("Failed to parse page dimensions.");
  const pageDims = { height: parseInt(heightStr), width: parseInt(widthStr) };
  const pageObj = new ocr.OcrPage(n, pageDims);
  pageObj.textSource = "alto";
  const textLineRegex = /<TextLine[^>]*>([\s\S]*?)<\/TextLine>/gi;
  function getAttr(elemStr, attrName) {
    const regex = new RegExp(`${attrName}=["']([^"']+)["']`, "i");
    return elemStr.match(regex)?.[1] || null;
  }
  function convertLine(match, blockStyleRefs = null) {
    const textLineTag = match.match(/<TextLine[^>]+>/i)?.[0];
    if (!textLineTag) return "";
    const lineVposStr = getAttr(textLineTag, "VPOS");
    const lineHposStr = getAttr(textLineTag, "HPOS");
    const lineHeightheightStr = getAttr(textLineTag, "HEIGHT");
    const lineWidthStr = getAttr(textLineTag, "WIDTH");
    if (!lineVposStr || !lineHposStr || !lineHeightheightStr || !lineWidthStr) {
      console.warn("Missing required positional attributes in ALTO TextLine element, skipping line.");
      return "";
    }
    const linebox = {
      left: parseInt(lineHposStr),
      top: parseInt(lineVposStr),
      right: parseInt(lineHposStr) + parseInt(lineWidthStr),
      bottom: parseInt(lineVposStr) + parseInt(lineHeightheightStr)
    };
    const baseline = [0, 0];
    const lineObj = new ocr.OcrLine(pageObj, linebox, baseline, null, null);
    const contentRegex = /<(?:String)\s+[^>]+\/?>/gi;
    const contentMatches = [...match.matchAll(contentRegex)];
    for (let i = 0; i < contentMatches.length; i++) {
      const contentMatch = contentMatches[i][0];
      const content = getAttr(contentMatch, "CONTENT");
      if (!content) continue;
      const text = unescapeXml(content);
      const strHpos = getAttr(contentMatch, "HPOS");
      const strVpos = getAttr(contentMatch, "VPOS");
      const strHeight = getAttr(contentMatch, "HEIGHT");
      const strWidth = getAttr(contentMatch, "WIDTH");
      if (!strHpos || !strVpos || !strHeight || !strWidth) {
        console.warn("Missing required positional attributes in ALTO String element, skipping element.");
        continue;
      }
      const wordBox = {
        left: parseInt(strHpos),
        top: parseInt(strVpos),
        right: parseInt(strHpos) + parseInt(strWidth),
        bottom: parseInt(strVpos) + parseInt(strHeight)
      };
      const wordID = `word_${n + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
      const wordObj = new ocr.OcrWord(lineObj, wordID, text, wordBox);
      const wcStr = getAttr(contentMatch, "WC");
      if (wcStr) {
        wordObj.conf = Math.round(parseFloat(wcStr) * 100);
      }
      const styleAttr = getAttr(contentMatch, "STYLE");
      if (styleAttr) {
        if (/bold/i.test(styleAttr)) wordObj.style.bold = true;
        if (/italic/i.test(styleAttr)) wordObj.style.italic = true;
        if (/underline/i.test(styleAttr)) wordObj.style.underline = true;
        if (/superscript/i.test(styleAttr)) wordObj.style.sup = true;
        if (/smallcaps/i.test(styleAttr)) wordObj.style.smallCaps = true;
      }
      const styleRefs = getAttr(contentMatch, "STYLEREFS") || blockStyleRefs;
      if (styleRefs) {
        const styleRegex = new RegExp(`<TextStyle\\s*ID=["']${styleRefs}["'][^>]*>`, "i");
        const styleMatch = ocrStr.match(styleRegex);
        if (styleMatch) {
          const fontFamily = getAttr(styleMatch[0], "FONTFAMILY");
          if (fontFamily) wordObj.style.font = fontFamily;
        }
      }
      lineObj.words.push(wordObj);
    }
    if (lineObj.words.length > 0) {
      const wordsWithDescenders = (
        /** @type {OcrWord[]} */
        []
      );
      const wordsWithoutDescenders = (
        /** @type {OcrWord[]} */
        []
      );
      for (const word of lineObj.words) {
        const hasDescender = word.text.split("").some((char) => descCharArr.includes(char));
        if (hasDescender) {
          wordsWithDescenders.push(word);
        } else {
          wordsWithoutDescenders.push(word);
        }
      }
      if (wordsWithoutDescenders.length > 0) {
        const bottoms = wordsWithoutDescenders.map((w) => w.bbox.bottom);
        const medianBottom = bottoms.sort((a, b) => a - b)[Math.floor(bottoms.length / 2)];
        lineObj.baseline[1] = medianBottom - lineObj.bbox.bottom;
      } else if (wordsWithDescenders.length > 0) {
        const lineHeight = lineObj.bbox.bottom - lineObj.bbox.top;
        const estimatedDescenderDepth = Math.round(lineHeight * 0.25);
        lineObj.baseline[1] = -estimatedDescenderDepth;
      }
      const xHeightOnlyWords = lineObj.words.filter((word) => {
        const chars = word.text.split("");
        return chars.every((char) => xCharArr.includes(char));
      });
      const hasAscenders = lineObj.words.some((word) => word.text.split("").some((char) => ascCharArr.includes(char)));
      if (xHeightOnlyWords.length > 0) {
        const heights = xHeightOnlyWords.map((w) => w.bbox.bottom - w.bbox.top);
        lineObj.xHeight = heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)];
      } else {
        const baselineY = lineObj.bbox.bottom + lineObj.baseline[1];
        const topToBaseline = baselineY - lineObj.bbox.top;
        if (!hasAscenders) {
          lineObj.xHeight = Math.round(topToBaseline);
        } else {
          lineObj.xHeight = Math.round(topToBaseline * 0.67);
        }
      }
      pageObj.lines.push(lineObj);
    }
    return "";
  }
  const textBlockRegex = /<TextBlock[^>]*>([\s\S]*?)<\/TextBlock>/gi;
  const textBlockMatches = [...ocrStr.matchAll(textBlockRegex)];
  for (const blockMatch of textBlockMatches) {
    const blockTag = blockMatch[0].match(/<TextBlock[^>]+>/i)?.[0];
    const blockStyleRefs = blockTag ? getAttr(blockTag, "STYLEREFS") : null;
    const blockContent = blockMatch[1];
    const parLineArr = [];
    const textLinesInBlock = [...blockContent.matchAll(textLineRegex)];
    for (const lineMatch of textLinesInBlock) {
      const lineCountBefore = pageObj.lines.length;
      convertLine(lineMatch[0], blockStyleRefs);
      if (pageObj.lines.length > lineCountBefore) {
        parLineArr.push(pageObj.lines[pageObj.lines.length - 1]);
      }
    }
    if (parLineArr.length > 0) {
      const parbox = calcBboxUnion(parLineArr.map((x) => x.bbox));
      const parObj = new ocr.OcrPar(pageObj, parbox);
      parLineArr.forEach((x) => {
        x.par = parObj;
      });
      parObj.lines = parLineArr;
      pageObj.pars.push(parObj);
    }
  }
  const warn = { char: "char_warning" };
  pass2(pageObj, 0);
  const langSet = pass3(pageObj);
  const dataTablePage = new LayoutDataTablePage(n);
  return {
    pageObj,
    dataTables: dataTablePage,
    warn,
    langSet
  };
}
const baselineCharArr = [...xCharArr, ...ascCharArr];
async function convertPageBlocks({
  ocrBlocks,
  n,
  pageDims,
  rotateAngle,
  upscale = false
}) {
  rotateAngle = rotateAngle || 0;
  if (upscale) {
    pageDims.height *= 2;
    pageDims.width *= 2;
  }
  const currentLang = "eng";
  const pageObj = new ocr.OcrPage(n, pageDims);
  pageObj.textSource = "scribe.js";
  let wordCount = 0;
  const dropChars = [];
  for (let i = 0; i < ocrBlocks.length; i++) {
    const block = ocrBlocks[i];
    for (let j = 0; j < block.paragraphs.length; j++) {
      const paragraph = block.paragraphs[j];
      const parbox = {
        left: paragraph.bbox.x0,
        top: paragraph.bbox.y0,
        right: paragraph.bbox.x1,
        bottom: paragraph.bbox.y1
      };
      const parObj = new ocr.OcrPar(pageObj, parbox);
      for (let k = 0; k < paragraph.lines.length; k++) {
        const line = paragraph.lines[k];
        const linebox = {
          left: line.bbox.x0,
          top: line.bbox.y0,
          right: line.bbox.x1,
          bottom: line.bbox.y1
        };
        const x0 = line.baseline.x0 - linebox.left;
        const x1 = line.baseline.x1 - linebox.left;
        const y0 = line.baseline.y0 - linebox.bottom;
        const y1 = line.baseline.y1 - linebox.bottom;
        const baselineSlope = (y1 - y0) / (x1 - x0);
        const baselinePoint = y0 - baselineSlope * x0;
        const baseline = [baselineSlope, baselinePoint];
        if (!Number.isFinite(baselineSlope) || !Number.isFinite(baselinePoint)) {
          baseline[0] = 0;
          baseline[1] = 0;
        }
        const lineObj = new ocr.OcrLine(pageObj, linebox, baseline, line.ascheight, line.xheight);
        lineObj.par = parObj;
        for (let l = 0; l < line.words.length; l++) {
          const word = line.words[l];
          const wordbox = {
            left: word.bbox.x0,
            top: word.bbox.y0,
            right: word.bbox.x1,
            bottom: word.bbox.y1
          };
          const id = `word_${n + 1}_${wordCount}`;
          wordCount++;
          if (word.text.trim() === "") continue;
          let wordLang = word.language || currentLang;
          if (["chi_sim", "chi_tra"].includes(wordLang)) {
            const { han: hanChars, latin: latinChars } = getTextScript(word.text);
            if (hanChars === 0) {
              if (!["chi_sim", "chi_tra"].includes(currentLang)) {
                wordLang = currentLang;
              } else if (latinChars > 0) {
                wordLang = "eng";
              }
            }
          }
          if (["chi_sim", "chi_tra"].includes(wordLang) && word.symbols) {
            for (let m = 0; m < word.symbols.length; m++) {
              const symbol = word.symbols[m];
              const symbolbox = {
                left: symbol.bbox.x0,
                top: symbol.bbox.y0,
                right: symbol.bbox.x1,
                bottom: symbol.bbox.y1
              };
              const wordObj2 = new ocr.OcrWord(lineObj, `${id}_${m}`, symbol.text, symbolbox);
              wordObj2.conf = symbol.confidence;
              wordObj2.lang = wordLang;
              lineObj.words.push(wordObj2);
            }
            continue;
          }
          const wordObj = new ocr.OcrWord(lineObj, id, word.text.trim(), wordbox);
          wordObj.lang = wordLang;
          wordObj.conf = word.confidence;
          wordObj.style.font = word.font_name;
          wordObj.style.italic = !!word.italic;
          wordObj.style.smallCaps = !!word.smallcaps;
          wordObj.style.sup = !!word.superscript;
          wordObj.compTruth = !!word.comp;
          wordObj.matchTruth = !!word.match;
          if (word.alt) wordObj.alt = word.alt;
          wordObj.chars = word.symbols === null ? null : word.symbols.map((symbol) => new ocr.OcrChar(symbol.text, {
            left: symbol.bbox.x0,
            top: symbol.bbox.y0,
            right: symbol.bbox.x1,
            bottom: symbol.bbox.y1
          }));
          if (!word.charsKept) dropChars.push(wordObj);
          lineObj.words.push(wordObj);
        }
        if (lineObj.words.length > 0) {
          pageObj.lines.push(lineObj);
          parObj.lines.push(lineObj);
        }
      }
      if (parObj.lines.length > 0) {
        pageObj.pars.push(parObj);
      }
    }
  }
  pageObj.angle = rotateAngle;
  if (upscale) ocr.scalePage(pageObj, 0.5);
  if (Math.abs(rotateAngle) > 0.05) {
    for (const lineObj of pageObj.lines) ocr.rotateLine(lineObj, rotateAngle, null, true);
  }
  for (const wordObj of dropChars) wordObj.chars = null;
  if (!pageObj.angle) {
    const angleRisePage = pageObj.lines.filter((lineObj) => lineObj.bbox.right - lineObj.bbox.left >= 200).map((lineObj) => lineObj.baseline[0]);
    pageObj.angle = Math.asin(mean50(angleRisePage) || 0) * (180 / Math.PI);
  }
  const langSet = /* @__PURE__ */ new Set();
  for (const lineObj of pageObj.lines) for (const wordObj of lineObj.words) langSet.add(wordObj.lang);
  return {
    pageObj,
    dataTables: new LayoutDataTablePage(n),
    warn: { char: "" },
    langSet
  };
}
async function convertPageBlocksVanilla({
  ocrBlocks,
  n,
  pageDims,
  rotateAngle,
  legacy,
  upscale = false
}) {
  rotateAngle = rotateAngle || 0;
  if (upscale) {
    pageDims.height *= 2;
    pageDims.width *= 2;
  }
  const currentLang = "eng";
  const pageObj = new ocr.OcrPage(n, pageDims);
  pageObj.textSource = "tesseract";
  let wordCount = 0;
  for (let i = 0; i < ocrBlocks.length; i++) {
    const block = ocrBlocks[i];
    for (let j = 0; j < block.paragraphs.length; j++) {
      const paragraph = block.paragraphs[j];
      const parbox = {
        left: paragraph.bbox.x0,
        top: paragraph.bbox.y0,
        right: paragraph.bbox.x1,
        bottom: paragraph.bbox.y1
      };
      const parObj = new ocr.OcrPar(pageObj, parbox);
      for (let k = 0; k < paragraph.lines.length; k++) {
        const line = paragraph.lines[k];
        const linebox = {
          left: line.bbox.x0,
          top: line.bbox.y0,
          right: line.bbox.x1,
          bottom: line.bbox.y1
        };
        const x0 = line.baseline.x0 - linebox.left;
        const x1 = line.baseline.x1 - linebox.left;
        const y0 = line.baseline.y0 - linebox.bottom;
        const y1 = line.baseline.y1 - linebox.bottom;
        const baselineSlope = (y1 - y0) / (x1 - x0);
        const baselinePoint = y0 - baselineSlope * x0;
        const baseline = [baselineSlope, baselinePoint];
        if (!Number.isFinite(baselineSlope) || !Number.isFinite(baselinePoint)) {
          baseline[0] = 0;
          baseline[1] = 0;
        }
        const ascHeight = line.rowAttributes.rowHeight - line.rowAttributes.descenders;
        const xHeight = line.rowAttributes.rowHeight - line.rowAttributes.descenders - line.rowAttributes.ascenders;
        const lineObj = new ocr.OcrLine(pageObj, linebox, baseline, ascHeight, xHeight);
        lineObj.par = parObj;
        for (let l = 0; l < line.words.length; l++) {
          const word = line.words[l];
          const wordbox = {
            left: word.bbox.x0,
            top: word.bbox.y0,
            right: word.bbox.x1,
            bottom: word.bbox.y1
          };
          const id = `word_${n + 1}_${wordCount}`;
          wordCount++;
          if (word.text.trim() === "") continue;
          let wordLang = word.language || currentLang;
          if (["chi_sim", "chi_tra"].includes(wordLang)) {
            const { han: hanChars, latin: latinChars } = getTextScript(word.text);
            if (hanChars === 0) {
              if (!["chi_sim", "chi_tra"].includes(currentLang)) {
                wordLang = currentLang;
              } else if (latinChars > 0) {
                wordLang = "eng";
              }
            }
          }
          if (["chi_sim", "chi_tra"].includes(wordLang)) {
            for (let m = 0; m < word.symbols.length; m++) {
              const symbol = word.symbols[m];
              const symbolbox = {
                left: symbol.bbox.x0,
                top: symbol.bbox.y0,
                right: symbol.bbox.x1,
                bottom: symbol.bbox.y1
              };
              const wordObj2 = new ocr.OcrWord(lineObj, `${id}_${m}`, symbol.text, symbolbox);
              wordObj2.conf = symbol.confidence;
              wordObj2.lang = wordLang;
              lineObj.words.push(wordObj2);
            }
            continue;
          }
          const wordObj = new ocr.OcrWord(lineObj, id, word.text.trim(), wordbox);
          wordObj.lang = wordLang;
          wordObj.conf = word.confidence;
          if (word.choices.length > 0) {
            word.choices.sort((a, b) => b.confidence - a.confidence);
            if (word.choices[0].text !== word.text) {
              wordObj.alt = [{ text: word.choices[0].text, conf: word.choices[0].confidence, span: 1 }];
            }
          }
          wordObj.chars = [];
          for (let m = 0; m < word.symbols.length; m++) {
            const symbol = word.symbols[m];
            if (!symbol.text?.trim()) continue;
            const symbolbox = {
              left: symbol.bbox.x0,
              top: symbol.bbox.y0,
              right: symbol.bbox.x1,
              bottom: symbol.bbox.y1
            };
            const charObj = new ocr.OcrChar(symbol.text, symbolbox);
            wordObj.chars.push(charObj);
          }
          lineObj.words.push(wordObj);
        }
        if (lineObj.words.length > 0) {
          if (lineObj.words.length === 1 && legacy && lineObj.words[0].chars) {
            const baselineBottomArr = lineObj.words[0].chars.filter((char) => baselineCharArr.includes(char.text)).map((char) => char.bbox.bottom);
            if (baselineBottomArr.length * 2 > lineObj.words[0].chars.length) {
              const baselineBottom = mean50(baselineBottomArr);
              lineObj.baseline[1] = baselineBottom - lineObj.bbox.bottom;
            }
          }
          pageObj.lines.push(lineObj);
          parObj.lines.push(lineObj);
        }
      }
      if (parObj.lines.length > 0) {
        pageObj.pars.push(parObj);
      }
    }
  }
  pageObj.angle = rotateAngle;
  if (upscale) ocr.scalePage(pageObj, 0.5);
  pass2(pageObj, rotateAngle);
  const langSet = pass3(pageObj);
  return {
    pageObj,
    dataTables: new LayoutDataTablePage(n),
    warn: { char: "" },
    langSet
  };
}
const adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0;
  let s2 = adler >>> 16 & 65535 | 0;
  let n = 0;
  while (len !== 0) {
    n = len > 2e3 ? 2e3 : len;
    len -= n;
    do {
      s1 = s1 + buf[pos++] | 0;
      s2 = s2 + s1 | 0;
    } while (--n);
    s1 %= 65521;
    s2 %= 65521;
  }
  return s1 | s2 << 16 | 0;
};
const crcTable = (() => {
  const table2 = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table2[n] = c;
  }
  return table2;
})();
const crc32 = (crc, buf, len, pos) => {
  const end = pos + len;
  crc ^= -1;
  for (let i = pos; i < end; i++) {
    crc = crc >>> 8 ^ crcTable[(crc ^ buf[i]) & 255];
  }
  return crc ^ -1;
};
const HEAD = 16180;
const FLAGS = 16181;
const TIME = 16182;
const OS = 16183;
const EXLEN = 16184;
const EXTRA = 16185;
const NAME = 16186;
const COMMENT = 16187;
const HCRC = 16188;
const DICTID = 16189;
const DICT = 16190;
const TYPE = 16191;
const TYPEDO = 16192;
const STORED = 16193;
const COPY_ = 16194;
const COPY = 16195;
const TABLE = 16196;
const LENLENS = 16197;
const CODELENS = 16198;
const LEN_ = 16199;
const LEN = 16200;
const LENEXT = 16201;
const DIST = 16202;
const DISTEXT = 16203;
const MATCH = 16204;
const LIT = 16205;
const CHECK = 16206;
const LENGTH = 16207;
const DONE = 16208;
const BAD = 16209;
const MEM = 16210;
const SYNC = 16211;
const Z_NO_FLUSH = 0;
const Z_FINISH = 4;
const Z_BLOCK = 5;
const Z_TREES = 6;
const Z_OK = 0;
const Z_STREAM_END = 1;
const Z_NEED_DICT = 2;
const Z_STREAM_ERROR = -2;
const Z_DATA_ERROR = -3;
const Z_MEM_ERROR = -4;
const Z_BUF_ERROR = -5;
const Z_DEFLATED = 8;
const MAXBITS = 15;
const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
const CODES = 0;
const LENS = 1;
const DISTS = 2;
const inflate_fast = (strm, start) => {
  let _in;
  let last;
  let _out;
  let beg;
  let end;
  let dmax;
  let wsize;
  let whave;
  let wnext;
  let s_window;
  let hold;
  let bits;
  let lcode;
  let dcode;
  let lmask;
  let dmask;
  let here;
  let op;
  let len;
  let dist;
  let from;
  let from_source;
  let input;
  let output;
  const state = strm.state;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
  dmax = state.dmax;
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;
  top:
    do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      for (; ; ) {
        op = here >>> 24;
        hold >>>= op;
        bits -= op;
        op = here >>> 16 & 255;
        if (op === 0) {
          output[_out++] = here & 65535;
        } else if (op & 16) {
          len = here & 65535;
          op &= 15;
          if (op) {
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
            }
            len += hold & (1 << op) - 1;
            hold >>>= op;
            bits -= op;
          }
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = dcode[hold & dmask];
          for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op & 16) {
              dist = here & 65535;
              op &= 15;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
              }
              dist += hold & (1 << op) - 1;
              if (dist > dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break top;
              }
              hold >>>= op;
              bits -= op;
              op = _out - beg;
              if (dist > op) {
                op = dist - op;
                if (op > whave && state.sane) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break top;
                }
                from = 0;
                from_source = s_window;
                if (wnext === 0) {
                  from += wsize - op;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;
                    from_source = output;
                  }
                } else if (wnext < op) {
                  from += wsize + wnext - op;
                  op -= wnext;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = 0;
                    if (wnext < len) {
                      op = wnext;
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;
                      from_source = output;
                    }
                  }
                } else {
                  from += wnext - op;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;
                    from_source = output;
                  }
                }
                while (len > 2) {
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  len -= 3;
                }
                if (len) {
                  output[_out++] = from_source[from++];
                  if (len > 1) output[_out++] = from_source[from++];
                }
              } else {
                from = _out - dist;
                do {
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  len -= 3;
                } while (len > 2);
                if (len) {
                  output[_out++] = output[from++];
                  if (len > 1) output[_out++] = output[from++];
                }
              }
            } else if ((op & 64) === 0) {
              here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue;
            } else {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break top;
            }
            break;
          }
        } else if ((op & 64) === 0) {
          here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
          continue;
        } else if (op & 32) {
          state.mode = TYPE;
          break top;
        } else {
          strm.msg = "invalid literal/length code";
          state.mode = BAD;
          break top;
        }
        break;
      }
    } while (_in < last && _out < end);
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
  strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
  state.hold = hold;
  state.bits = bits;
};
const lbase = new Uint16Array([
  // length codes 257..285 base
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]);
const lext = new Uint8Array([
  // length codes 257..285 extra
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]);
const dbase = new Uint16Array([
  // distance codes 0..29 base
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]);
const dext = new Uint8Array([
  // distance codes 0..29 extra
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]);
const inflate_table = (type, lens, lens_index, codes, table2, table_index, work, opts) => {
  const bits = opts.bits;
  let len = 0;
  let sym = 0;
  let min = 0;
  let max = 0;
  let root = 0;
  let curr = 0;
  let drop = 0;
  let left = 0;
  let used = 0;
  let huff = 0;
  let incr;
  let fill;
  let low;
  let mask;
  let next;
  let base = null;
  let match;
  const count = new Uint16Array(MAXBITS + 1);
  const offs = new Uint16Array(MAXBITS + 1);
  let extra = null;
  let here_bits;
  let here_op;
  let here_val;
  for (sym = 0; sym < codes; sym++) count[lens[lens_index + sym]]++;
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) break;
  }
  if (root > max) root = max;
  if (max === 0) {
    table2[table_index++] = 1 << 24 | 64 << 16 | 0;
    table2[table_index++] = 1 << 24 | 64 << 16 | 0;
    opts.bits = 1;
    return 0;
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) break;
  }
  if (root < min) root = min;
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) return -1;
  }
  if (left > 0 && (type === CODES || max !== 1)) return -1;
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }
  if (type === CODES) {
    base = extra = work;
    match = 20;
  } else if (type === LENS) {
    base = lbase;
    extra = lext;
    match = 257;
  } else {
    base = dbase;
    extra = dext;
    match = 0;
  }
  huff = 0;
  sym = 0;
  len = min;
  next = table_index;
  curr = root;
  drop = 0;
  low = -1;
  used = 1 << root;
  mask = used - 1;
  if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
  for (; ; ) {
    here_bits = len - drop;
    if (work[sym] + 1 < match) {
      here_op = 0;
      here_val = work[sym];
    } else if (work[sym] >= match) {
      here_op = extra[work[sym] - match];
      here_val = base[work[sym] - match];
    } else {
      here_op = 32 + 64;
      here_val = 0;
    }
    incr = 1 << len - drop;
    fill = 1 << curr;
    min = fill;
    do {
      fill -= incr;
      table2[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
    } while (fill !== 0);
    incr = 1 << len - 1;
    while (huff & incr) incr >>= 1;
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }
    sym++;
    if (--count[len] === 0) {
      if (len === max) break;
      len = lens[lens_index + work[sym]];
    }
    if (len > root && (huff & mask) !== low) {
      if (drop === 0) drop = root;
      next += min;
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) break;
        curr++;
        left <<= 1;
      }
      used += 1 << curr;
      if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
      low = huff & mask;
      table2[low] = root << 24 | curr << 16 | next - table_index | 0;
    }
  }
  if (huff !== 0) table2[next + huff] = len - drop << 24 | 64 << 16 | 0;
  opts.bits = root;
  return 0;
};
const zswap32 = (q) => (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
class InflateState {
  constructor() {
    this.strm = null;
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
}
class ZStream {
  constructor() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
}
class GZheader {
  constructor() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
}
const inflateStateCheck = (strm) => {
  if (!strm) return 1;
  const state = strm.state;
  if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) return 1;
  return 0;
};
const inflateResetKeep = (strm) => {
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = "";
  if (state.wrap) strm.adler = state.wrap & 1;
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.flags = -1;
  state.dmax = 32768;
  state.head = null;
  state.hold = 0;
  state.bits = 0;
  state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
  state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
  state.sane = 1;
  state.back = -1;
  return Z_OK;
};
const inflateReset = (strm) => {
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);
};
const inflateReset2 = (strm, windowBits) => {
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  let wrap;
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else {
    wrap = (windowBits >> 4) + 5;
    if (windowBits < 48) windowBits &= 15;
  }
  if (windowBits && (windowBits < 8 || windowBits > 15)) return Z_STREAM_ERROR;
  if (state.window !== null && state.wbits !== windowBits) state.window = null;
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
};
const inflateInit2 = (strm, windowBits) => {
  if (!strm) return Z_STREAM_ERROR;
  const state = new InflateState();
  strm.state = state;
  state.strm = strm;
  state.window = null;
  state.mode = HEAD;
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) strm.state = null;
  return ret;
};
let virgin = true;
let lenfix;
let distfix;
const fixedtables = (state) => {
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);
    let sym = 0;
    while (sym < 144) state.lens[sym++] = 8;
    while (sym < 256) state.lens[sym++] = 9;
    while (sym < 280) state.lens[sym++] = 7;
    while (sym < 288) state.lens[sym++] = 8;
    inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
    sym = 0;
    while (sym < 32) state.lens[sym++] = 5;
    inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
    virgin = false;
  }
  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
};
const updatewindow = (strm, src, end, copy) => {
  const state = strm.state;
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;
    state.window = new Uint8Array(state.wsize);
  }
  if (copy >= state.wsize) {
    state.window.set(src.subarray(end - state.wsize, end), 0);
    state.wnext = 0;
    state.whave = state.wsize;
  } else {
    let dist = state.wsize - state.wnext;
    if (dist > copy) dist = copy;
    state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
    copy -= dist;
    if (copy) {
      state.window.set(src.subarray(end - copy, end), 0);
      state.wnext = copy;
      state.whave = state.wsize;
    } else {
      state.wnext += dist;
      if (state.wnext === state.wsize) state.wnext = 0;
      if (state.whave < state.wsize) state.whave += dist;
    }
  }
  return 0;
};
const order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
const inflateCore = (strm, flush) => {
  let state;
  let input;
  let output;
  let next;
  let put;
  let have;
  let left;
  let hold;
  let bits;
  let _in;
  let _out;
  let copy;
  let from;
  let from_source;
  let here = 0;
  let here_bits;
  let here_op;
  let here_val;
  let last_bits;
  let last_op;
  let last_val;
  let len;
  let ret;
  const hbuf = new Uint8Array(4);
  let opts;
  let n;
  if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) return Z_STREAM_ERROR;
  state = strm.state;
  if (state.mode === TYPE) state.mode = TYPEDO;
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  _in = have;
  _out = left;
  ret = Z_OK;
  inf_leave:
    for (; ; ) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.wrap & 2 && hold === 35615) {
            if (state.wbits === 0) state.wbits = 15;
            state.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state.mode = FLAGS;
            break;
          }
          if (state.head) state.head.done = false;
          if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state.mode = BAD;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state.wbits === 0) state.wbits = len;
          if (len > 15 || len > state.wbits) {
            strm.msg = "invalid window size";
            state.mode = BAD;
            break;
          }
          state.dmax = 1 << state.wbits;
          state.flags = 0;
          strm.adler = state.check = 1;
          state.mode = hold & 512 ? DICTID : TYPE;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.flags = hold;
          if ((state.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          if (state.flags & 57344) {
            strm.msg = "unknown header flags set";
            state.mode = BAD;
            break;
          }
          if (state.head) state.head.text = hold >> 8 & 1;
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = TIME;
        /* falls through */
        case TIME:
          while (bits < 32) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) state.head.time = hold;
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state.check = crc32(state.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = OS;
        /* falls through */
        case OS:
          while (bits < 16) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.xflags = hold & 255;
            state.head.os = hold >> 8;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = EXLEN;
        /* falls through */
        case EXLEN:
          if (state.flags & 1024) {
            while (bits < 16) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length = hold;
            if (state.head) state.head.extra_len = hold;
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state.head) {
            state.head.extra = null;
          }
          state.mode = EXTRA;
        /* falls through */
        case EXTRA:
          if (state.flags & 1024) {
            copy = state.length;
            if (copy > have) copy = have;
            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;
                if (!state.head.extra) state.head.extra = new Uint8Array(state.head.extra_len);
                state.head.extra.set(input.subarray(next, next + copy), len);
              }
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state.length -= copy;
            }
            if (state.length) break inf_leave;
          }
          state.length = 0;
          state.mode = NAME;
        /* falls through */
        case NAME:
          if (state.flags & 2048) {
            if (have === 0) break inf_leave;
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) break inf_leave;
          } else if (state.head) {
            state.head.name = null;
          }
          state.length = 0;
          state.mode = COMMENT;
        /* falls through */
        case COMMENT:
          if (state.flags & 4096) {
            if (have === 0) break inf_leave;
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) break inf_leave;
          } else if (state.head) {
            state.head.comment = null;
          }
          state.mode = HCRC;
        /* falls through */
        case HCRC:
          if (state.flags & 512) {
            while (bits < 16) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.check & 65535)) {
              strm.msg = "header crc mismatch";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }
          strm.adler = state.check = 0;
          state.mode = TYPE;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state.mode = DICT;
        /* falls through */
        case DICT:
          if (state.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            return Z_NEED_DICT;
          }
          strm.adler = state.check = 1;
          state.mode = TYPE;
        /* falls through */
        case TYPE:
          if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
        /* falls through */
        case TYPEDO:
          if (state.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state.mode = STORED;
              break;
            case 1:
              fixedtables(state);
              state.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state.mode = BAD;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state.mode = BAD;
            break;
          }
          state.length = hold & 65535;
          hold = 0;
          bits = 0;
          state.mode = COPY_;
          if (flush === Z_TREES) break inf_leave;
        /* falls through */
        case COPY_:
          state.mode = COPY;
        /* falls through */
        case COPY:
          copy = state.length;
          if (copy) {
            if (copy > have) copy = have;
            if (copy > left) copy = left;
            if (copy === 0) break inf_leave;
            output.set(input.subarray(next, next + copy), put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          }
          state.mode = TYPE;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = LENLENS;
        /* falls through */
        case LENLENS:
          while (state.have < state.ncode) {
            while (bits < 3) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.lens[order[state.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state.have < 19) state.lens[order[state.have++]] = 0;
          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = { bits: state.lenbits };
          ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = CODELENS;
        /* falls through */
        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) break;
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) break inf_leave;
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                len = state.lens[state.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) break inf_leave;
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) break inf_leave;
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = "invalid bit length repeat";
                state.mode = BAD;
                break;
              }
              while (copy--) state.lens[state.have++] = len;
            }
          }
          if (state.mode === BAD) break;
          if (state.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state.mode = BAD;
            break;
          }
          state.lenbits = 9;
          opts = { bits: state.lenbits };
          ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state.mode = BAD;
            break;
          }
          state.distbits = 6;
          state.distcode = state.distdyn;
          opts = { bits: state.distbits };
          ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
          state.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state.mode = BAD;
            break;
          }
          state.mode = LEN_;
          if (flush === Z_TREES) break inf_leave;
        /* falls through */
        case LEN_:
          state.mode = LEN;
        /* falls through */
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            inflate_fast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits;
            if (state.mode === TYPE) state.back = -1;
            break;
          }
          state.back = 0;
          for (; ; ) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) break;
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) break;
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          state.length = here_val;
          if (here_op === 0) {
            state.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state.back = -1;
            state.mode = TYPE;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state.mode = BAD;
            break;
          }
          state.extra = here_op & 15;
          state.mode = LENEXT;
        /* falls through */
        case LENEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          state.was = state.length;
          state.mode = DIST;
        /* falls through */
        case DIST:
          for (; ; ) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) break;
            if (have === 0) break inf_leave;
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) break;
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state.mode = BAD;
            break;
          }
          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;
        /* falls through */
        case DISTEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.offset += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          if (state.offset > state.dmax) {
            strm.msg = "invalid distance too far back";
            state.mode = BAD;
            break;
          }
          state.mode = MATCH;
        /* falls through */
        case MATCH:
          if (left === 0) break inf_leave;
          copy = _out - left;
          if (state.offset > copy) {
            copy = state.offset - copy;
            if (copy > state.whave && state.sane) {
              strm.msg = "invalid distance too far back";
              state.mode = BAD;
              break;
            }
            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }
            if (copy > state.length) copy = state.length;
            from_source = state.window;
          } else {
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }
          if (copy > left) copy = left;
          left -= copy;
          state.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state.length === 0) state.mode = LEN;
          break;
        case LIT:
          if (left === 0) break inf_leave;
          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;
        case CHECK:
          if (state.wrap) {
            while (bits < 32) {
              if (have === 0) break inf_leave;
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (state.wrap & 4 && _out) {
              strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
            }
            _out = left;
            if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = "incorrect data check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = LENGTH;
        /* falls through */
        case LENGTH:
          if (state.wrap && state.flags) {
            while (bits < 32) {
              if (have === 0) break inf_leave;
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = DONE;
        /* falls through */
        case DONE:
          ret = Z_STREAM_END;
          break inf_leave;
        case BAD:
          ret = Z_DATA_ERROR;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR;
        case SYNC:
        default:
          return Z_STREAM_ERROR;
      }
    }
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
    updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out);
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap & 4 && _out) {
    strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) ret = Z_BUF_ERROR;
  return ret;
};
const inflateEnd = (strm) => {
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  if (state.window) state.window = null;
  strm.state = null;
  return Z_OK;
};
const inflateGetHeader = (strm, head) => {
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
  state.head = head;
  head.done = false;
  return Z_OK;
};
const inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;
  if (inflateStateCheck(strm)) return Z_STREAM_ERROR;
  const state = strm.state;
  if (state.wrap !== 0 && state.mode !== DICT) return Z_STREAM_ERROR;
  if (state.mode === DICT) {
    const dictid = adler32(1, dictionary, dictLength, 0);
    if (dictid !== state.check) return Z_DATA_ERROR;
  }
  updatewindow(strm, dictionary, dictLength, dictLength);
  state.havedict = 1;
  return Z_OK;
};
const flattenChunks = (chunks) => {
  let len = 0;
  for (let i = 0; i < chunks.length; i++) len += chunks[i].length;
  const result = new Uint8Array(len);
  let pos = 0;
  for (let i = 0; i < chunks.length; i++) {
    result.set(chunks[i], pos);
    pos += chunks[i].length;
  }
  return result;
};
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();
const utf8border = (buf, max) => {
  max = max || buf.length;
  if (max > buf.length) max = buf.length;
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
  if (pos < 0 || pos === 0) return max;
  const lead = buf[pos];
  const seqLen = lead >= 240 ? 4 : lead >= 224 ? 3 : lead >= 192 ? 2 : 1;
  return pos + seqLen > max ? pos : max;
};
const messages = {
  2: "need dictionary",
  1: "stream end",
  0: "",
  "-1": "file error",
  "-2": "stream error",
  "-3": "data error",
  "-4": "insufficient memory",
  "-5": "buffer error",
  "-6": "incompatible version"
};
class Inflate {
  constructor(options) {
    this.options = {
      chunkSize: 64 * 1024,
      windowBits: 15,
      to: "",
      ...options || {}
    };
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) opt.windowBits = -15;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new ZStream();
    this.strm.avail_out = 0;
    let status = inflateInit2(this.strm, opt.windowBits);
    if (status !== Z_OK) throw new Error(messages[status]);
    this.header = new GZheader();
    inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = utf8Encoder.encode(opt.dictionary);
      } else if (opt.dictionary instanceof ArrayBuffer) {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) throw new Error(messages[status]);
      }
    }
  }
  /**
   * Feed a chunk of compressed data into the inflator.
   * @param {Uint8Array|ArrayBuffer} data
   * @param {number|boolean} [flushMode] - 0..6 (Z_NO_FLUSH..Z_TREES);
   *   `true` is shorthand for `Z_FINISH`, `false`/undefined for `Z_NO_FLUSH`.
   * @returns {boolean} `true` on success, `false` on error.
   */
  push(data, flushMode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    if (this.ended) return false;
    let flushValue;
    if (typeof flushMode === "number" && flushMode === ~~flushMode) flushValue = flushMode;
    else flushValue = flushMode === true ? Z_FINISH : Z_NO_FLUSH;
    strm.input = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      let status = inflateCore(strm, flushValue);
      if (status === Z_NEED_DICT && dictionary) {
        status = inflateSetDictionary(strm, dictionary);
        if (status === Z_OK) status = inflateCore(strm, flushValue);
        else if (status === Z_DATA_ERROR) status = Z_NEED_DICT;
      }
      while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
        inflateReset(strm);
        status = inflateCore(strm, flushValue);
      }
      if (status === Z_STREAM_ERROR || status === Z_DATA_ERROR || status === Z_NEED_DICT || status === Z_MEM_ERROR) {
        this.onEnd(status);
        this.ended = true;
        return false;
      }
      const lastAvailOut = strm.avail_out;
      if (strm.next_out && (strm.avail_out === 0 || status === Z_STREAM_END)) {
        if (this.options.to === "string") {
          const next_out_utf8 = utf8border(strm.output, strm.next_out);
          const tail = strm.next_out - next_out_utf8;
          const utf8str = utf8Decoder.decode(strm.output.subarray(0, next_out_utf8));
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
          this.onData(utf8str);
        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
      if (status === Z_OK && lastAvailOut === 0) continue;
      if (status === Z_STREAM_END) {
        const endStatus = inflateEnd(this.strm);
        this.onEnd(endStatus);
        this.ended = true;
        return true;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  }
  /** Default chunk sink - override to stream output elsewhere. */
  onData(chunk) {
    this.chunks.push(chunk);
  }
  /** Default end callback - flattens chunks into `this.result`. */
  onEnd(status) {
    if (this.chunks.length > 0) {
      this.result = this.options.to === "string" ? this.chunks.join("") : flattenChunks(this.chunks);
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  }
}
const salvagePartial = (inflator) => {
  if (inflator.result instanceof Uint8Array) return inflator.result;
  const parts = [];
  if (inflator.chunks.length > 0) parts.push(...inflator.chunks);
  if (inflator.strm && inflator.strm.next_out > 0) {
    parts.push(inflator.strm.output.slice(0, inflator.strm.next_out));
  }
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : flattenChunks(parts);
};
function inflateRaw(data, options, meta) {
  const inflator = new Inflate({ ...{}, raw: true });
  inflator.push(data);
  const salvaged = salvagePartial(inflator);
  if (salvaged) inflator.result = salvaged;
  if (inflator.err) {
    if (inflator.result instanceof Uint8Array && inflator.result.length > 0) {
      return inflator.result;
    }
    throw inflator.msg || messages[inflator.err];
  }
  return inflator.result || new Uint8Array(0);
}
function fail(message) {
  throw new Error(message);
}
function argument(predicate, message) {
  if (!predicate) {
    fail(message);
  }
}
const check = { fail, argument, assert: argument };
function checkArgument(expression, message) {
  if (!expression) {
    throw message;
  }
}
const LIMIT16 = 32768;
const LIMIT32 = 2147483648;
const decode = {};
const encode = {};
const sizeOf = {};
function constant(v) {
  return function() {
    return v;
  };
}
encode.BYTE = function(v) {
  check.argument(v >= 0 && v <= 255, "Byte value should be between 0 and 255.");
  return [v];
};
sizeOf.BYTE = constant(1);
encode.CHAR = function(v) {
  return [v.charCodeAt(0)];
};
sizeOf.CHAR = constant(1);
encode.CHARARRAY = function(v) {
  if (typeof v === "undefined") {
    v = "";
    console.warn("Undefined CHARARRAY encountered and treated as an empty string. This is probably caused by a missing glyph name.");
  }
  const b = [];
  for (let i = 0; i < v.length; i += 1) {
    b[i] = v.charCodeAt(i);
  }
  return b;
};
sizeOf.CHARARRAY = function(v) {
  if (typeof v === "undefined") {
    return 0;
  }
  return v.length;
};
encode.USHORT = function(v) {
  return [v >> 8 & 255, v & 255];
};
sizeOf.USHORT = constant(2);
encode.SHORT = function(v) {
  if (v >= LIMIT16) {
    v = -(2 * LIMIT16 - v);
  }
  return [v >> 8 & 255, v & 255];
};
sizeOf.SHORT = constant(2);
encode.UINT24 = function(v) {
  return [v >> 16 & 255, v >> 8 & 255, v & 255];
};
sizeOf.UINT24 = constant(3);
encode.ULONG = function(v) {
  return [v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255];
};
sizeOf.ULONG = constant(4);
encode.LONG = function(v) {
  if (v >= LIMIT32) {
    v = -(2 * LIMIT32 - v);
  }
  return [v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255];
};
sizeOf.LONG = constant(4);
encode.FIXED = encode.ULONG;
sizeOf.FIXED = sizeOf.ULONG;
encode.FWORD = encode.SHORT;
sizeOf.FWORD = sizeOf.SHORT;
encode.UFWORD = encode.USHORT;
sizeOf.UFWORD = sizeOf.USHORT;
encode.LONGDATETIME = function(v) {
  return [0, 0, 0, 0, v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255];
};
sizeOf.LONGDATETIME = constant(8);
encode.TAG = function(v) {
  check.argument(v.length === 4, "Tag should be exactly 4 ASCII characters.");
  return [
    v.charCodeAt(0),
    v.charCodeAt(1),
    v.charCodeAt(2),
    v.charCodeAt(3)
  ];
};
sizeOf.TAG = constant(4);
encode.Card8 = encode.BYTE;
sizeOf.Card8 = sizeOf.BYTE;
encode.Card16 = encode.USHORT;
sizeOf.Card16 = sizeOf.USHORT;
encode.OffSize = encode.BYTE;
sizeOf.OffSize = sizeOf.BYTE;
encode.SID = encode.USHORT;
sizeOf.SID = sizeOf.USHORT;
encode.NUMBER = function(v) {
  if (v >= -107 && v <= 107) {
    return [v + 139];
  }
  if (v >= 108 && v <= 1131) {
    v -= 108;
    return [(v >> 8) + 247, v & 255];
  }
  if (v >= -1131 && v <= -108) {
    v = -v - 108;
    return [(v >> 8) + 251, v & 255];
  }
  if (v >= -32768 && v <= 32767) {
    return encode.NUMBER16(v);
  }
  return encode.NUMBER32(v);
};
sizeOf.NUMBER = function(v) {
  return encode.NUMBER(v).length;
};
encode.NUMBER16 = function(v) {
  return [28, v >> 8 & 255, v & 255];
};
sizeOf.NUMBER16 = constant(3);
encode.NUMBER32 = function(v) {
  return [29, v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255];
};
sizeOf.NUMBER32 = constant(5);
encode.REAL = function(v) {
  let value = v.toString();
  const m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
  if (m) {
    const epsilon = parseFloat(`1e${(m[2] ? +m[2] : 0) + m[1].length}`);
    value = (Math.round(v * epsilon) / epsilon).toString();
  }
  let nibbles = "";
  for (let i = 0, ii = value.length; i < ii; i += 1) {
    const c = value[i];
    if (c === "e") {
      nibbles += value[++i] === "-" ? "c" : "b";
    } else if (c === ".") {
      nibbles += "a";
    } else if (c === "-") {
      nibbles += "e";
    } else {
      nibbles += c;
    }
  }
  nibbles += nibbles.length & 1 ? "f" : "ff";
  const out = [30];
  for (let i = 0, ii = nibbles.length; i < ii; i += 2) {
    out.push(parseInt(nibbles.substr(i, 2), 16));
  }
  return out;
};
sizeOf.REAL = function(v) {
  return encode.REAL(v).length;
};
encode.NAME = encode.CHARARRAY;
sizeOf.NAME = sizeOf.CHARARRAY;
encode.STRING = encode.CHARARRAY;
sizeOf.STRING = sizeOf.CHARARRAY;
decode.UTF8 = function(data, offset, numBytes) {
  const codePoints = [];
  const numChars = numBytes;
  for (let j = 0; j < numChars; j++, offset += 1) {
    codePoints[j] = data.getUint8(offset);
  }
  return String.fromCharCode.apply(null, codePoints);
};
decode.UTF16 = function(data, offset, numBytes) {
  const codePoints = [];
  const numChars = numBytes / 2;
  for (let j = 0; j < numChars; j++, offset += 2) {
    codePoints[j] = data.getUint16(offset);
  }
  return String.fromCharCode.apply(null, codePoints);
};
encode.UTF16 = function(v) {
  const b = [];
  for (let i = 0; i < v.length; i += 1) {
    const codepoint = v.charCodeAt(i);
    b[b.length] = codepoint >> 8 & 255;
    b[b.length] = codepoint & 255;
  }
  return b;
};
sizeOf.UTF16 = function(v) {
  return v.length * 2;
};
const eightBitMacEncodings = {
  "x-mac-croatian": (
    // Python: 'mac_croatian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
  ),
  "x-mac-cyrillic": (
    // Python: 'mac_cyrillic'
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю"
  ),
  "x-mac-gaelic": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæøṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ"
  ),
  "x-mac-greek": (
    // Python: 'mac_greek'
    "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ­"
  ),
  "x-mac-icelandic": (
    // Python: 'mac_iceland'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-inuit": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
    "ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł"
  ),
  "x-mac-ce": (
    // Python: 'mac_latin2'
    "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
  ),
  macintosh: (
    // Python: 'mac_roman'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-romanian": (
    // Python: 'mac_romanian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-turkish": (
    // Python: 'mac_turkish'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ"
  )
};
decode.MACSTRING = function(dataView, offset, dataLength, encoding) {
  const table2 = eightBitMacEncodings[encoding];
  if (table2 === void 0) {
    return void 0;
  }
  let result = "";
  for (let i = 0; i < dataLength; i++) {
    const c = dataView.getUint8(offset + i);
    if (c <= 127) {
      result += String.fromCharCode(c);
    } else {
      result += table2[c & 127];
    }
  }
  return result;
};
const macEncodingTableCache = typeof WeakMap === "function" && /* @__PURE__ */ new WeakMap();
let macEncodingCacheKeys;
const getMacEncodingTable = function(encoding) {
  if (!macEncodingCacheKeys) {
    macEncodingCacheKeys = {};
    for (const e in eightBitMacEncodings) {
      macEncodingCacheKeys[e] = new String(e);
    }
  }
  const cacheKey = macEncodingCacheKeys[encoding];
  if (cacheKey === void 0) {
    return void 0;
  }
  if (macEncodingTableCache) {
    const cachedTable = macEncodingTableCache.get(cacheKey);
    if (cachedTable !== void 0) {
      return cachedTable;
    }
  }
  const decodingTable = eightBitMacEncodings[encoding];
  if (decodingTable === void 0) {
    return void 0;
  }
  const encodingTable = {};
  for (let i = 0; i < decodingTable.length; i++) {
    encodingTable[decodingTable.charCodeAt(i)] = i + 128;
  }
  if (macEncodingTableCache) {
    macEncodingTableCache.set(cacheKey, encodingTable);
  }
  return encodingTable;
};
encode.MACSTRING = function(str, encoding) {
  const table2 = getMacEncodingTable(encoding);
  if (table2 === void 0) {
    return void 0;
  }
  const result = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 128) {
      c = table2[c];
      if (c === void 0) {
        return void 0;
      }
    }
    result[i] = c;
  }
  return result;
};
sizeOf.MACSTRING = function(str, encoding) {
  const b = encode.MACSTRING(str, encoding);
  if (b !== void 0) {
    return b.length;
  }
  return 0;
};
function isByteEncodable(value) {
  return value >= -128 && value <= 127;
}
function encodeVarDeltaRunAsZeroes(deltas, pos, result) {
  let runLength = 0;
  const numDeltas = deltas.length;
  while (pos < numDeltas && runLength < 64 && deltas[pos] === 0) {
    ++pos;
    ++runLength;
  }
  result.push(128 | runLength - 1);
  return pos;
}
function encodeVarDeltaRunAsBytes(deltas, offset, result) {
  let runLength = 0;
  const numDeltas = deltas.length;
  let pos = offset;
  while (pos < numDeltas && runLength < 64) {
    const value = deltas[pos];
    if (!isByteEncodable(value)) {
      break;
    }
    if (value === 0 && pos + 1 < numDeltas && deltas[pos + 1] === 0) {
      break;
    }
    ++pos;
    ++runLength;
  }
  result.push(runLength - 1);
  for (let i = offset; i < pos; ++i) {
    result.push(deltas[i] + 256 & 255);
  }
  return pos;
}
function encodeVarDeltaRunAsWords(deltas, offset, result) {
  let runLength = 0;
  const numDeltas = deltas.length;
  let pos = offset;
  while (pos < numDeltas && runLength < 64) {
    const value = deltas[pos];
    if (value === 0) {
      break;
    }
    if (isByteEncodable(value) && pos + 1 < numDeltas && isByteEncodable(deltas[pos + 1])) {
      break;
    }
    ++pos;
    ++runLength;
  }
  result.push(64 | runLength - 1);
  for (let i = offset; i < pos; ++i) {
    const val = deltas[i];
    result.push(val + 65536 >> 8 & 255, val + 256 & 255);
  }
  return pos;
}
encode.VARDELTAS = function(deltas) {
  let pos = 0;
  const result = [];
  while (pos < deltas.length) {
    const value = deltas[pos];
    if (value === 0) {
      pos = encodeVarDeltaRunAsZeroes(deltas, pos, result);
    } else if (value >= -128 && value <= 127) {
      pos = encodeVarDeltaRunAsBytes(deltas, pos, result);
    } else {
      pos = encodeVarDeltaRunAsWords(deltas, pos, result);
    }
  }
  return result;
};
encode.INDEX = function(l) {
  if (l.length === 0) {
    return [0, 0];
  }
  const encodedItems = new Array(l.length);
  let totalDataSize = 0;
  for (let i = 0; i < l.length; i += 1) {
    const v = encode.OBJECT(l[i]);
    encodedItems[i] = v;
    totalDataSize += v.length;
  }
  const lastOffset = totalDataSize + 1;
  const offSize = 1 + Math.floor(Math.log(lastOffset) / Math.log(2)) / 8 | 0;
  const offsetTableSize = (l.length + 1) * offSize;
  const headerSize = 2 + 1 + offsetTableSize;
  const result = new Array(headerSize + totalDataSize);
  result[0] = l.length >> 8 & 255;
  result[1] = l.length & 255;
  result[2] = offSize;
  let dataPos = headerSize;
  let curOffset = 1;
  for (let i = 0; i < l.length; i += 1) {
    const offPos = 3 + i * offSize;
    if (offSize === 1) {
      result[offPos] = curOffset & 255;
    } else if (offSize === 2) {
      result[offPos] = curOffset >> 8 & 255;
      result[offPos + 1] = curOffset & 255;
    } else if (offSize === 3) {
      result[offPos] = curOffset >> 16 & 255;
      result[offPos + 1] = curOffset >> 8 & 255;
      result[offPos + 2] = curOffset & 255;
    } else {
      result[offPos] = curOffset >> 24 & 255;
      result[offPos + 1] = curOffset >> 16 & 255;
      result[offPos + 2] = curOffset >> 8 & 255;
      result[offPos + 3] = curOffset & 255;
    }
    const itemBytes = encodedItems[i];
    for (let j = 0; j < itemBytes.length; j += 1) {
      result[dataPos++] = itemBytes[j];
    }
    curOffset += itemBytes.length;
  }
  const lastOffPos = 3 + l.length * offSize;
  if (offSize === 1) {
    result[lastOffPos] = curOffset & 255;
  } else if (offSize === 2) {
    result[lastOffPos] = curOffset >> 8 & 255;
    result[lastOffPos + 1] = curOffset & 255;
  } else if (offSize === 3) {
    result[lastOffPos] = curOffset >> 16 & 255;
    result[lastOffPos + 1] = curOffset >> 8 & 255;
    result[lastOffPos + 2] = curOffset & 255;
  } else {
    result[lastOffPos] = curOffset >> 24 & 255;
    result[lastOffPos + 1] = curOffset >> 16 & 255;
    result[lastOffPos + 2] = curOffset >> 8 & 255;
    result[lastOffPos + 3] = curOffset & 255;
  }
  return result;
};
sizeOf.INDEX = function(v) {
  if (v.length === 0) {
    return 2;
  }
  let dataSize = 0;
  for (let i = 0; i < v.length; i += 1) {
    dataSize += sizeOf.OBJECT(v[i]);
  }
  const lastOffset = dataSize + 1;
  const offSize = 1 + Math.floor(Math.log(lastOffset) / Math.log(2)) / 8 | 0;
  return 2 + 1 + (v.length + 1) * offSize + dataSize;
};
encode.DICT = function(m) {
  const d = [];
  const keys = Object.keys(m);
  const length = keys.length;
  for (let i = 0; i < length; i += 1) {
    const k = parseInt(keys[i], 0);
    const v = m[k];
    const enc1 = encode.OPERAND(v.value, v.type);
    const enc2 = encode.OPERATOR(k);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
    for (let j = 0; j < enc2.length; j++) {
      d.push(enc2[j]);
    }
  }
  return d;
};
sizeOf.DICT = function(m) {
  return encode.DICT(m).length;
};
encode.OPERATOR = function(v) {
  if (v < 1200) {
    return [v];
  }
  return [12, v - 1200];
};
encode.OPERAND = function(v, type) {
  const d = [];
  if (Array.isArray(type)) {
    for (let i = 0; i < type.length; i += 1) {
      check.argument(v.length === type.length, `Not enough arguments given for type${type}`);
      const enc1 = encode.OPERAND(v[i], type[i]);
      for (let j = 0; j < enc1.length; j++) {
        d.push(enc1[j]);
      }
    }
  } else if (type === "SID") {
    const enc1 = encode.NUMBER(v);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
  } else if (type === "offset") {
    const enc1 = encode.NUMBER32(v);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
  } else if (type === "number") {
    const enc1 = encode.NUMBER(v);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
  } else if (type === "real") {
    const enc1 = encode.REAL(v);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
  } else {
    throw new Error(`Unknown operand type ${type}`);
  }
  return d;
};
encode.OP = encode.BYTE;
sizeOf.OP = sizeOf.BYTE;
const wmm = typeof WeakMap === "function" && /* @__PURE__ */ new WeakMap();
encode.CHARSTRING = function(ops) {
  if (wmm) {
    const cachedValue = wmm.get(ops);
    if (cachedValue !== void 0) {
      return cachedValue;
    }
  }
  const d = [];
  const length = ops.length;
  for (let i = 0; i < length; i += 1) {
    const op = ops[i];
    const enc1 = encode[op.type](op.value);
    for (let j = 0; j < enc1.length; j++) {
      d.push(enc1[j]);
    }
  }
  if (wmm) {
    wmm.set(ops, d);
  }
  return d;
};
sizeOf.CHARSTRING = function(ops) {
  return encode.CHARSTRING(ops).length;
};
encode.OBJECT = function(v) {
  const encodingFunction = encode[v.type];
  check.argument(encodingFunction !== void 0, `No encoding function for type ${v.type}`);
  return encodingFunction(v.value);
};
sizeOf.OBJECT = function(v) {
  const sizeOfFunction = sizeOf[v.type];
  check.argument(sizeOfFunction !== void 0, `No sizeOf function for type ${v.type}`);
  return sizeOfFunction(v.value);
};
encode.TABLE = function(table2) {
  const d = [];
  const length = table2.fields.length;
  const subtables = [];
  const subtableOffsets = [];
  for (let i = 0; i < length; i += 1) {
    const field = table2.fields[i];
    const encodingFunction = encode[field.type];
    check.argument(encodingFunction !== void 0, `No encoding function for field type ${field.type} (${field.name})`);
    let value = table2[field.name];
    if (value === void 0) {
      value = field.value;
    }
    const bytes = encodingFunction(value);
    if (field.type === "TABLE") {
      subtableOffsets.push(d.length);
      d.push(...[0, 0]);
      subtables.push(bytes);
    } else {
      for (let j = 0; j < bytes.length; j++) {
        d.push(bytes[j]);
      }
    }
  }
  for (let i = 0; i < subtables.length; i += 1) {
    const o = subtableOffsets[i];
    const offset = d.length;
    check.argument(offset < 65536, `Table ${table2.tableName} too big.`);
    d[o] = offset >> 8;
    d[o + 1] = offset & 255;
    for (let j = 0; j < subtables[i].length; j++) {
      d.push(subtables[i][j]);
    }
  }
  return d;
};
sizeOf.TABLE = function(table2) {
  let numBytes = 0;
  const length = table2.fields.length;
  for (let i = 0; i < length; i += 1) {
    const field = table2.fields[i];
    const sizeOfFunction = sizeOf[field.type];
    check.argument(sizeOfFunction !== void 0, `No sizeOf function for field type ${field.type} (${field.name})`);
    let value = table2[field.name];
    if (value === void 0) {
      value = field.value;
    }
    numBytes += sizeOfFunction(value);
    if (field.type === "TABLE") {
      numBytes += 2;
    }
  }
  return numBytes;
};
encode.RECORD = encode.TABLE;
sizeOf.RECORD = sizeOf.TABLE;
encode.LITERAL = function(v) {
  return v;
};
sizeOf.LITERAL = function(v) {
  return v.length;
};
function getByte(dataView, offset) {
  return dataView.getUint8(offset);
}
function getUShort(dataView, offset) {
  return dataView.getUint16(offset, false);
}
function getShort(dataView, offset) {
  return dataView.getInt16(offset, false);
}
function getULong(dataView, offset) {
  return dataView.getUint32(offset, false);
}
function getFixed(dataView, offset) {
  const decimal = dataView.getInt16(offset, false);
  const fraction = dataView.getUint16(offset + 2, false);
  return decimal + fraction / 65535;
}
function getTag(dataView, offset) {
  let tag = "";
  for (let i = offset; i < offset + 4; i += 1) {
    tag += String.fromCharCode(dataView.getInt8(i));
  }
  return tag;
}
function getOffset(dataView, offset, offSize) {
  let v = 0;
  for (let i = 0; i < offSize; i += 1) {
    v <<= 8;
    v += dataView.getUint8(offset + i);
  }
  return v;
}
function getBytes(dataView, startOffset, endOffset) {
  const bytes = [];
  for (let i = startOffset; i < endOffset; i += 1) {
    bytes.push(dataView.getUint8(i));
  }
  return bytes;
}
function bytesToString(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}
const typeOffsets = {
  byte: 1,
  uShort: 2,
  short: 2,
  uLong: 4,
  fixed: 4,
  longDateTime: 8,
  tag: 4
};
class Parser {
  constructor(data, offset) {
    this.data = data;
    this.offset = offset;
    this.relativeOffset = 0;
  }
  parseByte() {
    const v = this.data.getUint8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
  }
  parseChar() {
    const v = this.data.getInt8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
  }
  parseUShort() {
    const v = this.data.getUint16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
  }
  parseShort() {
    const v = this.data.getInt16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
  }
  parseF2Dot14() {
    const v = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
    this.relativeOffset += 2;
    return v;
  }
  parseULong() {
    const v = getULong(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
  }
  parseFixed() {
    const v = getFixed(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
  }
  parseString(length) {
    const dataView = this.data;
    const offset = this.offset + this.relativeOffset;
    let string = "";
    this.relativeOffset += length;
    for (let i = 0; i < length; i++) {
      string += String.fromCharCode(dataView.getUint8(offset + i));
    }
    return string;
  }
  parseTag() {
    return this.parseString(4);
  }
  parseLongDateTime() {
    let v = getULong(this.data, this.offset + this.relativeOffset + 4);
    v -= 2082844800;
    this.relativeOffset += 8;
    return v;
  }
  parseVersion(minorBase) {
    const major = getUShort(this.data, this.offset + this.relativeOffset);
    const minor = getUShort(this.data, this.offset + this.relativeOffset + 2);
    this.relativeOffset += 4;
    if (minorBase === void 0) minorBase = 4096;
    return major + minor / minorBase / 10;
  }
  skip(type, amount) {
    if (amount === void 0) {
      amount = 1;
    }
    this.relativeOffset += typeOffsets[type] * amount;
  }
  parseULongList(count) {
    if (count === void 0) {
      count = this.parseULong();
    }
    const offsets = new Array(count);
    const dataView = this.data;
    let offset = this.offset + this.relativeOffset;
    for (let i = 0; i < count; i++) {
      offsets[i] = dataView.getUint32(offset);
      offset += 4;
    }
    this.relativeOffset += count * 4;
    return offsets;
  }
  parseUShortList(count) {
    if (count === void 0) {
      count = this.parseUShort();
    }
    const offsets = new Array(count);
    const dataView = this.data;
    let offset = this.offset + this.relativeOffset;
    for (let i = 0; i < count; i++) {
      offsets[i] = dataView.getUint16(offset);
      offset += 2;
    }
    this.relativeOffset += count * 2;
    return offsets;
  }
  parseShortList(count) {
    const list = new Array(count);
    const dataView = this.data;
    let offset = this.offset + this.relativeOffset;
    for (let i = 0; i < count; i++) {
      list[i] = dataView.getInt16(offset);
      offset += 2;
    }
    this.relativeOffset += count * 2;
    return list;
  }
  parseByteList(count) {
    const list = new Array(count);
    const dataView = this.data;
    let offset = this.offset + this.relativeOffset;
    for (let i = 0; i < count; i++) {
      list[i] = dataView.getUint8(offset++);
    }
    this.relativeOffset += count;
    return list;
  }
  parseList(count, itemCallback) {
    if (!itemCallback) {
      itemCallback = count;
      count = this.parseUShort();
    }
    const list = new Array(count);
    for (let i = 0; i < count; i++) {
      list[i] = itemCallback.call(this);
    }
    return list;
  }
  parseList32(count, itemCallback) {
    if (!itemCallback) {
      itemCallback = count;
      count = this.parseULong();
    }
    const list = new Array(count);
    for (let i = 0; i < count; i++) {
      list[i] = itemCallback.call(this);
    }
    return list;
  }
  parseRecordList(count, recordDescription) {
    if (!recordDescription) {
      recordDescription = count;
      count = this.parseUShort();
    }
    const records = new Array(count);
    const fields = Object.keys(recordDescription);
    for (let i = 0; i < count; i++) {
      const rec = {};
      for (let j = 0; j < fields.length; j++) {
        const fieldName = fields[j];
        const fieldType = recordDescription[fieldName];
        rec[fieldName] = fieldType.call(this);
      }
      records[i] = rec;
    }
    return records;
  }
  parseRecordList32(count, recordDescription) {
    if (!recordDescription) {
      recordDescription = count;
      count = this.parseULong();
    }
    const records = new Array(count);
    const fields = Object.keys(recordDescription);
    for (let i = 0; i < count; i++) {
      const rec = {};
      for (let j = 0; j < fields.length; j++) {
        const fieldName = fields[j];
        const fieldType = recordDescription[fieldName];
        rec[fieldName] = fieldType.call(this);
      }
      records[i] = rec;
    }
    return records;
  }
  parseStruct(description) {
    if (typeof description === "function") {
      return description.call(this);
    }
    const fields = Object.keys(description);
    const struct = {};
    for (let j = 0; j < fields.length; j++) {
      const fieldName = fields[j];
      const fieldType = description[fieldName];
      struct[fieldName] = fieldType.call(this);
    }
    return struct;
  }
  parseValueRecord(valueFormat) {
    if (valueFormat === void 0) {
      valueFormat = this.parseUShort();
    }
    if (valueFormat === 0) {
      return;
    }
    const valueRecord = {};
    if (valueFormat & 1) {
      valueRecord.xPlacement = this.parseShort();
    }
    if (valueFormat & 2) {
      valueRecord.yPlacement = this.parseShort();
    }
    if (valueFormat & 4) {
      valueRecord.xAdvance = this.parseShort();
    }
    if (valueFormat & 8) {
      valueRecord.yAdvance = this.parseShort();
    }
    if (valueFormat & 16) {
      valueRecord.xPlaDevice = void 0;
      this.parseShort();
    }
    if (valueFormat & 32) {
      valueRecord.yPlaDevice = void 0;
      this.parseShort();
    }
    if (valueFormat & 64) {
      valueRecord.xAdvDevice = void 0;
      this.parseShort();
    }
    if (valueFormat & 128) {
      valueRecord.yAdvDevice = void 0;
      this.parseShort();
    }
    return valueRecord;
  }
  parseValueRecordList() {
    const valueFormat = this.parseUShort();
    const valueCount = this.parseUShort();
    const values = new Array(valueCount);
    for (let i = 0; i < valueCount; i++) {
      values[i] = this.parseValueRecord(valueFormat);
    }
    return values;
  }
  parsePointer(description) {
    const structOffset = this.parseOffset16();
    if (structOffset > 0) {
      return new Parser(this.data, this.offset + structOffset).parseStruct(description);
    }
    return void 0;
  }
  parsePointer32(description) {
    const structOffset = this.parseOffset32();
    if (structOffset > 0) {
      return new Parser(this.data, this.offset + structOffset).parseStruct(description);
    }
    return void 0;
  }
  parseListOfLists(itemCallback) {
    const offsets = this.parseOffset16List();
    const count = offsets.length;
    const relativeOffset = this.relativeOffset;
    const list = new Array(count);
    for (let i = 0; i < count; i++) {
      const start = offsets[i];
      if (start === 0) {
        list[i] = void 0;
        continue;
      }
      this.relativeOffset = start;
      if (itemCallback) {
        const subOffsets = this.parseOffset16List();
        const subList = new Array(subOffsets.length);
        for (let j = 0; j < subOffsets.length; j++) {
          this.relativeOffset = start + subOffsets[j];
          subList[j] = itemCallback.call(this);
        }
        list[i] = subList;
      } else {
        list[i] = this.parseUShortList();
      }
    }
    this.relativeOffset = relativeOffset;
    return list;
  }
  parseCoverage() {
    const startOffset = this.offset + this.relativeOffset;
    const format = this.parseUShort();
    const count = this.parseUShort();
    if (format === 1) {
      return {
        format: 1,
        glyphs: this.parseUShortList(count)
      };
    }
    if (format === 2) {
      const ranges = new Array(count);
      for (let i = 0; i < count; i++) {
        ranges[i] = {
          start: this.parseUShort(),
          end: this.parseUShort(),
          index: this.parseUShort()
        };
      }
      return {
        format: 2,
        ranges
      };
    }
    throw new Error(`0x${startOffset.toString(16)}: Coverage format must be 1 or 2.`);
  }
  parseClassDef() {
    const startOffset = this.offset + this.relativeOffset;
    const format = this.parseUShort();
    if (format === 1) {
      return {
        format: 1,
        startGlyph: this.parseUShort(),
        classes: this.parseUShortList()
      };
    }
    if (format === 2) {
      return {
        format: 2,
        ranges: this.parseRecordList({
          start: Parser.uShort,
          end: Parser.uShort,
          classId: Parser.uShort
        })
      };
    }
    throw new Error(`0x${startOffset.toString(16)}: ClassDef format must be 1 or 2.`);
  }
  parseScriptList() {
    return this.parsePointer(Parser.recordList({
      tag: Parser.tag,
      script: Parser.pointer({
        defaultLangSys: Parser.pointer(langSysTable),
        langSysRecords: Parser.recordList({
          tag: Parser.tag,
          langSys: Parser.pointer(langSysTable)
        })
      })
    })) || [];
  }
  parseFeatureList() {
    return this.parsePointer(Parser.recordList({
      tag: Parser.tag,
      feature: Parser.pointer({
        featureParams: Parser.offset16,
        lookupListIndexes: Parser.uShortList
      })
    })) || [];
  }
  parseLookupList(lookupTableParsers) {
    return this.parsePointer(Parser.list(Parser.pointer(function() {
      const lookupType = this.parseUShort();
      check.argument(lookupType >= 1 && lookupType <= 9, `GPOS/GSUB lookup type ${lookupType} unknown.`);
      const lookupFlag = this.parseUShort();
      const useMarkFilteringSet = lookupFlag & 16;
      return {
        lookupType,
        lookupFlag,
        subtables: this.parseList(Parser.pointer(lookupTableParsers[lookupType])),
        markFilteringSet: useMarkFilteringSet ? this.parseUShort() : void 0
      };
    }))) || [];
  }
  parseFeatureVariationsList() {
    return this.parsePointer32(function() {
      const majorVersion = this.parseUShort();
      const minorVersion = this.parseUShort();
      check.argument(majorVersion === 1 && minorVersion < 1, "GPOS/GSUB feature variations table unknown.");
      const featureVariations = this.parseRecordList32({
        conditionSetOffset: Parser.offset32,
        featureTableSubstitutionOffset: Parser.offset32
      });
      return featureVariations;
    }) || [];
  }
}
Parser.prototype.parseCard8 = Parser.prototype.parseByte;
Parser.prototype.parseCard16 = Parser.prototype.parseUShort;
Parser.prototype.parseSID = Parser.prototype.parseUShort;
Parser.prototype.parseOffset16 = Parser.prototype.parseUShort;
Parser.prototype.parseOffset32 = Parser.prototype.parseULong;
Parser.prototype.parseOffset16List = Parser.prototype.parseUShortList;
Parser.list = function(count, itemCallback) {
  return function() {
    return this.parseList(count, itemCallback);
  };
};
Parser.list32 = function(count, itemCallback) {
  return function() {
    return this.parseList32(count, itemCallback);
  };
};
Parser.recordList = function(count, recordDescription) {
  return function() {
    return this.parseRecordList(count, recordDescription);
  };
};
Parser.recordList32 = function(count, recordDescription) {
  return function() {
    return this.parseRecordList32(count, recordDescription);
  };
};
Parser.pointer = function(description) {
  return function() {
    return this.parsePointer(description);
  };
};
Parser.pointer32 = function(description) {
  return function() {
    return this.parsePointer32(description);
  };
};
Parser.tag = Parser.prototype.parseTag;
Parser.byte = Parser.prototype.parseByte;
Parser.uShort = Parser.offset16 = Parser.prototype.parseUShort;
Parser.uShortList = Parser.prototype.parseUShortList;
Parser.uLong = Parser.offset32 = Parser.prototype.parseULong;
Parser.uLongList = Parser.prototype.parseULongList;
Parser.struct = Parser.prototype.parseStruct;
Parser.coverage = Parser.prototype.parseCoverage;
Parser.classDef = Parser.prototype.parseClassDef;
const langSysTable = {
  reserved: Parser.uShort,
  reqFeatureIndex: Parser.uShort,
  featureIndexes: Parser.uShortList
};
const parse = {
  getByte,
  getCard8: getByte,
  getUShort,
  getCard16: getUShort,
  getShort,
  getULong,
  getFixed,
  getTag,
  getOffset,
  getBytes,
  bytesToString,
  Parser
};
class Table {
  constructor(tableName, fields, options) {
    if (fields.length && (fields[0].name !== "coverageFormat" || fields[0].value === 1)) {
      for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        this[field.name] = field.value;
      }
    }
    this.tableName = tableName;
    this.fields = fields;
    if (options) {
      const optionKeys = Object.keys(options);
      for (let i = 0; i < optionKeys.length; i += 1) {
        const k = optionKeys[i];
        const v = options[k];
        if (this[k] !== void 0) {
          this[k] = v;
        }
      }
    }
  }
  encode() {
    return encode.TABLE(this);
  }
  sizeOf() {
    return sizeOf.TABLE(this);
  }
}
function ushortList(itemName, list, count) {
  if (count === void 0) {
    count = list.length;
  }
  const fields = new Array(list.length + 1);
  fields[0] = { name: `${itemName}Count`, type: "USHORT", value: count };
  for (let i = 0; i < list.length; i++) {
    fields[i + 1] = { name: itemName + i, type: "USHORT", value: list[i] };
  }
  return fields;
}
function tableList(itemName, records, itemCallback) {
  const count = records.length;
  const fields = new Array(count + 1);
  fields[0] = { name: `${itemName}Count`, type: "USHORT", value: count };
  for (let i = 0; i < count; i++) {
    fields[i + 1] = { name: itemName + i, type: "TABLE", value: itemCallback(records[i], i) };
  }
  return fields;
}
function recordList(itemName, records, itemCallback) {
  const count = records.length;
  let fields = [];
  fields[0] = { name: `${itemName}Count`, type: "USHORT", value: count };
  for (let i = 0; i < count; i++) {
    fields = fields.concat(itemCallback(records[i], i));
  }
  return fields;
}
class Coverage extends Table {
  constructor(coverageTable) {
    if (coverageTable.format === 1) {
      super(
        "coverageTable",
        [{ name: "coverageFormat", type: "USHORT", value: 1 }].concat(ushortList("glyph", coverageTable.glyphs))
      );
    } else if (coverageTable.format === 2) {
      super(
        "coverageTable",
        [{ name: "coverageFormat", type: "USHORT", value: 2 }].concat(recordList("rangeRecord", coverageTable.ranges, (RangeRecord) => [
          { name: "startGlyphID", type: "USHORT", value: RangeRecord.start },
          { name: "endGlyphID", type: "USHORT", value: RangeRecord.end },
          { name: "startCoverageIndex", type: "USHORT", value: RangeRecord.index }
        ]))
      );
    } else {
      super("coverageTable", []);
      check.assert(false, "Coverage format must be 1 or 2.");
    }
  }
}
class ScriptList extends Table {
  constructor(scriptListTable) {
    super(
      "scriptListTable",
      recordList("scriptRecord", scriptListTable, (scriptRecord, i) => {
        const script = scriptRecord.script;
        const defaultLangSys = script.defaultLangSys;
        check.assert(!!defaultLangSys, `Unable to write GSUB: script ${scriptRecord.tag} has no default language system.`);
        return [
          { name: `scriptTag${i}`, type: "TAG", value: scriptRecord.tag },
          {
            name: `script${i}`,
            type: "TABLE",
            value: new Table("scriptTable", [
              {
                name: "defaultLangSys",
                type: "TABLE",
                value: new Table("defaultLangSys", [
                  { name: "lookupOrder", type: "USHORT", value: 0 },
                  { name: "reqFeatureIndex", type: "USHORT", value: defaultLangSys.reqFeatureIndex }
                ].concat(ushortList("featureIndex", defaultLangSys.featureIndexes)))
              }
            ].concat(recordList("langSys", script.langSysRecords, (langSysRecord, j) => {
              const langSys = langSysRecord.langSys;
              return [
                { name: `langSysTag${j}`, type: "TAG", value: langSysRecord.tag },
                {
                  name: `langSys${j}`,
                  type: "TABLE",
                  value: new Table("langSys", [
                    { name: "lookupOrder", type: "USHORT", value: 0 },
                    { name: "reqFeatureIndex", type: "USHORT", value: langSys.reqFeatureIndex }
                  ].concat(ushortList("featureIndex", langSys.featureIndexes)))
                }
              ];
            })))
          }
        ];
      })
    );
  }
}
class FeatureList extends Table {
  constructor(featureListTable) {
    super(
      "featureListTable",
      recordList("featureRecord", featureListTable, (featureRecord, i) => {
        const feature = featureRecord.feature;
        return [
          { name: `featureTag${i}`, type: "TAG", value: featureRecord.tag },
          {
            name: `feature${i}`,
            type: "TABLE",
            value: new Table("featureTable", [
              { name: "featureParams", type: "USHORT", value: feature.featureParams }
            ].concat(ushortList("lookupListIndex", feature.lookupListIndexes)))
          }
        ];
      })
    );
  }
}
class LookupList extends Table {
  constructor(lookupListTable, subtableMakers2) {
    super("lookupListTable", tableList("lookup", lookupListTable, (lookupTable) => {
      const subtableCallback = subtableMakers2[lookupTable.lookupType];
      check.assert(!!subtableCallback, `Unable to write GSUB lookup type ${lookupTable.lookupType} tables.`);
      return new Table("lookupTable", [
        { name: "lookupType", type: "USHORT", value: lookupTable.lookupType },
        { name: "lookupFlag", type: "USHORT", value: lookupTable.lookupFlag }
      ].concat(tableList("subtable", lookupTable.subtables, subtableCallback)));
    }));
  }
}
const Record = Table;
const table = {
  Table,
  Record,
  Coverage,
  ScriptList,
  FeatureList,
  LookupList,
  ushortList,
  tableList,
  recordList
};
const cffStandardStrings = [
  ".notdef",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "questiondown",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "AE",
  "ordfeminine",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "ae",
  "dotlessi",
  "lslash",
  "oslash",
  "oe",
  "germandbls",
  "onesuperior",
  "logicalnot",
  "mu",
  "trademark",
  "Eth",
  "onehalf",
  "plusminus",
  "Thorn",
  "onequarter",
  "divide",
  "brokenbar",
  "degree",
  "thorn",
  "threequarters",
  "twosuperior",
  "registered",
  "minus",
  "eth",
  "multiply",
  "threesuperior",
  "copyright",
  "Aacute",
  "Acircumflex",
  "Adieresis",
  "Agrave",
  "Aring",
  "Atilde",
  "Ccedilla",
  "Eacute",
  "Ecircumflex",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Ntilde",
  "Oacute",
  "Ocircumflex",
  "Odieresis",
  "Ograve",
  "Otilde",
  "Scaron",
  "Uacute",
  "Ucircumflex",
  "Udieresis",
  "Ugrave",
  "Yacute",
  "Ydieresis",
  "Zcaron",
  "aacute",
  "acircumflex",
  "adieresis",
  "agrave",
  "aring",
  "atilde",
  "ccedilla",
  "eacute",
  "ecircumflex",
  "edieresis",
  "egrave",
  "iacute",
  "icircumflex",
  "idieresis",
  "igrave",
  "ntilde",
  "oacute",
  "ocircumflex",
  "odieresis",
  "ograve",
  "otilde",
  "scaron",
  "uacute",
  "ucircumflex",
  "udieresis",
  "ugrave",
  "yacute",
  "ydieresis",
  "zcaron",
  "exclamsmall",
  "Hungarumlautsmall",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "isuperior",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "ff",
  "ffi",
  "ffl",
  "parenleftinferior",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "Dotaccentsmall",
  "Macronsmall",
  "figuredash",
  "hypheninferior",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "zerosuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall",
  "001.000",
  "001.001",
  "001.002",
  "001.003",
  "Black",
  "Bold",
  "Book",
  "Light",
  "Medium",
  "Regular",
  "Roman",
  "Semibold"
];
const cffStandardEncoding = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "",
  "questiondown",
  "",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "",
  "ring",
  "cedilla",
  "",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "AE",
  "",
  "ordfeminine",
  "",
  "",
  "",
  "",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "",
  "",
  "",
  "",
  "",
  "ae",
  "",
  "",
  "",
  "dotlessi",
  "",
  "",
  "lslash",
  "oslash",
  "oe",
  "germandbls"
];
const cffExpertEncoding = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclamsmall",
  "Hungarumlautsmall",
  "",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "comma",
  "hyphen",
  "period",
  "fraction",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "colon",
  "semicolon",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "",
  "",
  "isuperior",
  "",
  "",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "",
  "",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "",
  "ff",
  "fi",
  "fl",
  "ffi",
  "ffl",
  "parenleftinferior",
  "",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "",
  "",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "",
  "Dotaccentsmall",
  "",
  "",
  "Macronsmall",
  "",
  "",
  "figuredash",
  "hypheninferior",
  "",
  "",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "",
  "",
  "",
  "onequarter",
  "onehalf",
  "threequarters",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "",
  "",
  "zerosuperior",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall"
];
const standardNames = [
  ".notdef",
  ".null",
  "nonmarkingreturn",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quotesingle",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "grave",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "Adieresis",
  "Aring",
  "Ccedilla",
  "Eacute",
  "Ntilde",
  "Odieresis",
  "Udieresis",
  "aacute",
  "agrave",
  "acircumflex",
  "adieresis",
  "atilde",
  "aring",
  "ccedilla",
  "eacute",
  "egrave",
  "ecircumflex",
  "edieresis",
  "iacute",
  "igrave",
  "icircumflex",
  "idieresis",
  "ntilde",
  "oacute",
  "ograve",
  "ocircumflex",
  "odieresis",
  "otilde",
  "uacute",
  "ugrave",
  "ucircumflex",
  "udieresis",
  "dagger",
  "degree",
  "cent",
  "sterling",
  "section",
  "bullet",
  "paragraph",
  "germandbls",
  "registered",
  "copyright",
  "trademark",
  "acute",
  "dieresis",
  "notequal",
  "AE",
  "Oslash",
  "infinity",
  "plusminus",
  "lessequal",
  "greaterequal",
  "yen",
  "mu",
  "partialdiff",
  "summation",
  "product",
  "pi",
  "integral",
  "ordfeminine",
  "ordmasculine",
  "Omega",
  "ae",
  "oslash",
  "questiondown",
  "exclamdown",
  "logicalnot",
  "radical",
  "florin",
  "approxequal",
  "Delta",
  "guillemotleft",
  "guillemotright",
  "ellipsis",
  "nonbreakingspace",
  "Agrave",
  "Atilde",
  "Otilde",
  "OE",
  "oe",
  "endash",
  "emdash",
  "quotedblleft",
  "quotedblright",
  "quoteleft",
  "quoteright",
  "divide",
  "lozenge",
  "ydieresis",
  "Ydieresis",
  "fraction",
  "currency",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "daggerdbl",
  "periodcentered",
  "quotesinglbase",
  "quotedblbase",
  "perthousand",
  "Acircumflex",
  "Ecircumflex",
  "Aacute",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Oacute",
  "Ocircumflex",
  "apple",
  "Ograve",
  "Uacute",
  "Ucircumflex",
  "Ugrave",
  "dotlessi",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "Lslash",
  "lslash",
  "Scaron",
  "scaron",
  "Zcaron",
  "zcaron",
  "brokenbar",
  "Eth",
  "eth",
  "Yacute",
  "yacute",
  "Thorn",
  "thorn",
  "minus",
  "multiply",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "onehalf",
  "onequarter",
  "threequarters",
  "franc",
  "Gbreve",
  "gbreve",
  "Idotaccent",
  "Scedilla",
  "scedilla",
  "Cacute",
  "cacute",
  "Ccaron",
  "ccaron",
  "dcroat"
];
class DefaultEncoding {
  constructor(font) {
    this.font = font;
  }
  charToGlyphIndex(c) {
    const code = c.codePointAt(0);
    const glyphs = this.font.glyphs;
    if (glyphs) {
      for (let i = 0; i < glyphs.length; i += 1) {
        const glyph = glyphs.get(i);
        for (let j = 0; j < glyph.unicodes.length; j += 1) {
          if (glyph.unicodes[j] === code) {
            return i;
          }
        }
      }
    }
    return null;
  }
}
class CmapEncoding {
  constructor(cmap) {
    this.cmap = cmap;
  }
  charToGlyphIndex(c) {
    return this.cmap.glyphIndexMap[c.codePointAt(0)] || 0;
  }
}
class CffEncoding {
  constructor(encoding, charset) {
    this.encoding = encoding;
    this.charset = charset;
  }
  charToGlyphIndex(s) {
    const code = s.codePointAt(0);
    const charName = this.encoding[code];
    return this.charset.indexOf(charName);
  }
}
function addGlyphNames(font) {
  let glyph;
  const glyphIndexMap = font.tables.cmap.glyphIndexMap;
  const charCodes = Object.keys(glyphIndexMap);
  for (let i = 0; i < charCodes.length; i += 1) {
    const c = charCodes[i];
    const glyphIndex = glyphIndexMap[c];
    glyph = font.glyphs.get(glyphIndex);
    glyph.addUnicode(parseInt(c));
  }
  for (let i = 0; i < font.glyphs.length; i += 1) {
    glyph = font.glyphs.get(i);
    if (font.cffEncoding) {
      if (font.isCIDFont) {
        glyph.name = `gid${i}`;
      } else {
        glyph.name = font.cffEncoding.charset[i];
      }
    } else if (font.glyphNames && font.glyphNames.names) {
      glyph.name = font.glyphNames.names[i];
    }
  }
}
function derive(v0, v1, v2, v3, t) {
  return (1 - t) ** 3 * v0 + 3 * (1 - t) ** 2 * t * v1 + 3 * (1 - t) * t ** 2 * v2 + t ** 3 * v3;
}
class BoundingBox {
  constructor() {
    this.x1 = Number.NaN;
    this.y1 = Number.NaN;
    this.x2 = Number.NaN;
    this.y2 = Number.NaN;
  }
  isEmpty() {
    return Number.isNaN(this.x1) || Number.isNaN(this.y1) || Number.isNaN(this.x2) || Number.isNaN(this.y2);
  }
  addPoint(x, y) {
    if (typeof x === "number") {
      if (Number.isNaN(this.x1) || Number.isNaN(this.x2)) {
        this.x1 = x;
        this.x2 = x;
      }
      if (x < this.x1) {
        this.x1 = x;
      }
      if (x > this.x2) {
        this.x2 = x;
      }
    }
    if (typeof y === "number") {
      if (Number.isNaN(this.y1) || Number.isNaN(this.y2)) {
        this.y1 = y;
        this.y2 = y;
      }
      if (y < this.y1) {
        this.y1 = y;
      }
      if (y > this.y2) {
        this.y2 = y;
      }
    }
  }
  addX(x) {
    this.addPoint(x, null);
  }
  addY(y) {
    this.addPoint(null, y);
  }
  addBezier(x0, y0, x1, y1, x2, y2, x, y) {
    const p0 = [x0, y0];
    const p1 = [x1, y1];
    const p2 = [x2, y2];
    const p3 = [x, y];
    this.addPoint(x0, y0);
    this.addPoint(x, y);
    for (let i = 0; i <= 1; i++) {
      const b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
      const a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
      const c = 3 * p1[i] - 3 * p0[i];
      if (a === 0) {
        if (b === 0) continue;
        const t = -c / b;
        if (t > 0 && t < 1) {
          if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t));
          if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t));
        }
        continue;
      }
      const b2ac = b ** 2 - 4 * c * a;
      if (b2ac < 0) continue;
      const t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
      if (t1 > 0 && t1 < 1) {
        if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t1));
        if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t1));
      }
      const t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
      if (t2 > 0 && t2 < 1) {
        if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t2));
        if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t2));
      }
    }
  }
  addQuad(x0, y0, x1, y1, x, y) {
    const cp1x = x0 + 2 / 3 * (x1 - x0);
    const cp1y = y0 + 2 / 3 * (y1 - y0);
    const cp2x = cp1x + 1 / 3 * (x - x0);
    const cp2y = cp1y + 1 / 3 * (y - y0);
    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y);
  }
}
class Path {
  constructor() {
    this.commands = [];
    this.fill = "black";
    this.stroke = null;
    this.strokeWidth = 1;
    this.unitsPerEm = 0;
  }
  moveTo(x, y) {
    this.commands.push({ type: "M", x, y });
  }
  lineTo(x, y) {
    this.commands.push({ type: "L", x, y });
  }
  curveTo(x1, y1, x2, y2, x, y) {
    this.commands.push({
      type: "C",
      x1,
      y1,
      x2,
      y2,
      x,
      y
    });
  }
  quadTo(x1, y1, x, y) {
    this.commands.push({
      type: "Q",
      x1,
      y1,
      x,
      y
    });
  }
  close() {
    this.commands.push({ type: "Z" });
  }
  extend(pathOrCommands) {
    if (pathOrCommands.commands) {
      pathOrCommands = pathOrCommands.commands;
    } else if (pathOrCommands instanceof BoundingBox) {
      const box = pathOrCommands;
      this.moveTo(box.x1, box.y1);
      this.lineTo(box.x2, box.y1);
      this.lineTo(box.x2, box.y2);
      this.lineTo(box.x1, box.y2);
      this.close();
      return;
    }
    Array.prototype.push.apply(this.commands, pathOrCommands);
  }
  getBoundingBox() {
    const box = new BoundingBox();
    let startX = 0;
    let startY = 0;
    let prevX = 0;
    let prevY = 0;
    for (let i = 0; i < this.commands.length; i++) {
      const cmd = this.commands[i];
      switch (cmd.type) {
        case "M":
          box.addPoint(cmd.x, cmd.y);
          startX = prevX = cmd.x;
          startY = prevY = cmd.y;
          break;
        case "L":
          box.addPoint(cmd.x, cmd.y);
          prevX = cmd.x;
          prevY = cmd.y;
          break;
        case "Q":
          box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
          prevX = cmd.x;
          prevY = cmd.y;
          break;
        case "C":
          box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          prevX = cmd.x;
          prevY = cmd.y;
          break;
        case "Z":
          prevX = startX;
          prevY = startY;
          break;
        default:
          throw new Error(`Unexpected path command ${cmd.type}`);
      }
    }
    if (box.isEmpty()) {
      box.addPoint(0, 0);
    }
    return box;
  }
  draw(ctx) {
    ctx.beginPath();
    for (let i = 0; i < this.commands.length; i += 1) {
      const cmd = this.commands[i];
      if (cmd.type === "M") {
        ctx.moveTo(cmd.x, cmd.y);
      } else if (cmd.type === "L") {
        ctx.lineTo(cmd.x, cmd.y);
      } else if (cmd.type === "C") {
        ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      } else if (cmd.type === "Q") {
        ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
      } else if (cmd.type === "Z") {
        ctx.closePath();
      }
    }
    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
  }
  toPathData(decimalPlaces) {
    decimalPlaces = decimalPlaces !== void 0 ? decimalPlaces : 2;
    function floatToString(v) {
      if (Math.round(v) === v) {
        return `${Math.round(v)}`;
      }
      return v.toFixed(decimalPlaces);
    }
    function packValues() {
      let s = "";
      for (let i = 0; i < arguments.length; i += 1) {
        const v = arguments[i];
        if (v >= 0 && i > 0) {
          s += " ";
        }
        s += floatToString(v);
      }
      return s;
    }
    let d = "";
    for (let i = 0; i < this.commands.length; i += 1) {
      const cmd = this.commands[i];
      if (cmd.type === "M") {
        d += `M${packValues(cmd.x, cmd.y)}`;
      } else if (cmd.type === "L") {
        d += `L${packValues(cmd.x, cmd.y)}`;
      } else if (cmd.type === "C") {
        d += `C${packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y)}`;
      } else if (cmd.type === "Q") {
        d += `Q${packValues(cmd.x1, cmd.y1, cmd.x, cmd.y)}`;
      } else if (cmd.type === "Z") {
        d += "Z";
      }
    }
    return d;
  }
  toSVG(decimalPlaces) {
    let svg = '<path d="';
    svg += this.toPathData(decimalPlaces);
    svg += '"';
    if (this.fill && this.fill !== "black") {
      if (this.fill === null) {
        svg += ' fill="none"';
      } else {
        svg += ` fill="${this.fill}"`;
      }
    }
    if (this.stroke) {
      svg += ` stroke="${this.stroke}" stroke-width="${this.strokeWidth}"`;
    }
    svg += "/>";
    return svg;
  }
}
Path.prototype.bezierCurveTo = Path.prototype.curveTo;
Path.prototype.quadraticCurveTo = Path.prototype.quadTo;
Path.prototype.closePath = Path.prototype.close;
function getPathDefinition(glyph, path) {
  let _path = path || new Path();
  return {
    configurable: true,
    get() {
      if (typeof _path === "function") {
        _path = _path();
      }
      return _path;
    },
    set(p) {
      _path = p;
    }
  };
}
class Glyph {
  /**
   * @param {GlyphOptions} options
   */
  constructor(options) {
    this.index = options.index || 0;
    this.name = options.name || null;
    this.unicode = options.unicode || void 0;
    this.unicodes = options.unicodes || (options.unicode !== void 0 ? [options.unicode] : []);
    this.xMin = void 0;
    this.xMax = void 0;
    this.yMin = void 0;
    this.yMax = void 0;
    this.advanceWidth = void 0;
    this.leftSideBearing = void 0;
    this.numberOfContours = void 0;
    this.isComposite = void 0;
    this.components = void 0;
    this.instructions = void 0;
    this.points = void 0;
    if ("xMin" in options) {
      this.xMin = options.xMin;
    }
    if ("yMin" in options) {
      this.yMin = options.yMin;
    }
    if ("xMax" in options) {
      this.xMax = options.xMax;
    }
    if ("yMax" in options) {
      this.yMax = options.yMax;
    }
    if ("advanceWidth" in options) {
      this.advanceWidth = options.advanceWidth;
    }
    Object.defineProperty(this, "path", getPathDefinition(this, options.path));
  }
  addUnicode(unicode) {
    if (this.unicodes.length === 0) {
      this.unicode = unicode;
    }
    this.unicodes.push(unicode);
  }
  getBoundingBox() {
    return this.path.getBoundingBox();
  }
  getPath(x, y, fontSize, options) {
    x = x !== void 0 ? x : 0;
    y = y !== void 0 ? y : 0;
    fontSize = fontSize !== void 0 ? fontSize : 72;
    if (!options) options = {};
    const commands = this.path.commands;
    const scale = 1 / (this.path.unitsPerEm || 1e3) * fontSize;
    const xScale = options.xScale !== void 0 ? options.xScale : scale;
    const yScale = options.yScale !== void 0 ? options.yScale : scale;
    const p = new Path();
    for (let i = 0; i < commands.length; i += 1) {
      const cmd = commands[i];
      if (cmd.type === "M") {
        p.moveTo(x + cmd.x * xScale, y + -cmd.y * yScale);
      } else if (cmd.type === "L") {
        p.lineTo(x + cmd.x * xScale, y + -cmd.y * yScale);
      } else if (cmd.type === "Q") {
        p.quadraticCurveTo(
          x + cmd.x1 * xScale,
          y + -cmd.y1 * yScale,
          x + cmd.x * xScale,
          y + -cmd.y * yScale
        );
      } else if (cmd.type === "C") {
        p.curveTo(
          x + cmd.x1 * xScale,
          y + -cmd.y1 * yScale,
          x + cmd.x2 * xScale,
          y + -cmd.y2 * yScale,
          x + cmd.x * xScale,
          y + -cmd.y * yScale
        );
      } else if (cmd.type === "Z") {
        p.closePath();
      }
    }
    return p;
  }
  getContours() {
    if (this.points === void 0) {
      return [];
    }
    const contours = [];
    let currentContour = [];
    for (let i = 0; i < this.points.length; i += 1) {
      const pt = this.points[i];
      currentContour.push(pt);
      if (pt.lastPointOfContour) {
        contours.push(currentContour);
        currentContour = [];
      }
    }
    check.argument(currentContour.length === 0, "There are still points left in the current contour.");
    return contours;
  }
  getMetrics() {
    const commands = this.path.commands;
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;
    for (let i = 0; i < commands.length; i += 1) {
      const cmd = commands[i];
      if (cmd.type !== "Z") {
        if (cmd.x < xMin) xMin = cmd.x;
        if (cmd.x > xMax) xMax = cmd.x;
        if (cmd.y < yMin) yMin = cmd.y;
        if (cmd.y > yMax) yMax = cmd.y;
      }
      if (cmd.type === "Q" || cmd.type === "C") {
        if (cmd.x1 < xMin) xMin = cmd.x1;
        if (cmd.x1 > xMax) xMax = cmd.x1;
        if (cmd.y1 < yMin) yMin = cmd.y1;
        if (cmd.y1 > yMax) yMax = cmd.y1;
      }
      if (cmd.type === "C") {
        if (cmd.x2 < xMin) xMin = cmd.x2;
        if (cmd.x2 > xMax) xMax = cmd.x2;
        if (cmd.y2 < yMin) yMin = cmd.y2;
        if (cmd.y2 > yMax) yMax = cmd.y2;
      }
    }
    if (!Number.isFinite(xMin)) xMin = 0;
    if (!Number.isFinite(xMax)) xMax = this.advanceWidth;
    if (!Number.isFinite(yMin)) yMin = 0;
    if (!Number.isFinite(yMax)) yMax = 0;
    return {
      xMin,
      yMin,
      xMax,
      yMax,
      leftSideBearing: this.leftSideBearing,
      rightSideBearing: this.advanceWidth - this.leftSideBearing - (xMax - xMin)
    };
  }
}
const fsSelectionValues = {
  REGULAR: 64
};
const usWidthClasses = {
  MEDIUM: 5
};
const usWeightClasses = {
  MEDIUM: 500
};
function searchTag(arr, tag) {
  let imin = 0;
  let imax = arr.length - 1;
  while (imin <= imax) {
    const imid = imin + imax >>> 1;
    const val = arr[imid].tag;
    if (val === tag) {
      return imid;
    }
    if (val < tag) {
      imin = imid + 1;
    } else {
      imax = imid - 1;
    }
  }
  return -imin - 1;
}
function binSearch(arr, value) {
  let imin = 0;
  let imax = arr.length - 1;
  while (imin <= imax) {
    const imid = imin + imax >>> 1;
    const val = arr[imid];
    if (val === value) {
      return imid;
    }
    if (val < value) {
      imin = imid + 1;
    } else {
      imax = imid - 1;
    }
  }
  return -imin - 1;
}
function searchRange(ranges, value) {
  let range;
  let imin = 0;
  let imax = ranges.length - 1;
  while (imin <= imax) {
    const imid = imin + imax >>> 1;
    range = ranges[imid];
    const start = range.start;
    if (start === value) {
      return range;
    }
    if (start < value) {
      imin = imid + 1;
    } else {
      imax = imid - 1;
    }
  }
  if (imin > 0) {
    range = ranges[imin - 1];
    if (value > range.end) return 0;
    return range;
  }
}
function getGlyphClass(classDefTable, glyphIndex) {
  switch (classDefTable.format) {
    case 1:
      if (classDefTable.startGlyph <= glyphIndex && glyphIndex < classDefTable.startGlyph + classDefTable.classes.length) {
        return classDefTable.classes[glyphIndex - classDefTable.startGlyph];
      }
      return 0;
    case 2: {
      const range = searchRange(classDefTable.ranges, glyphIndex);
      return range ? range.classId : 0;
    }
  }
}
function getCoverageIndex(coverageTable, glyphIndex) {
  switch (coverageTable.format) {
    case 1: {
      const index = binSearch(coverageTable.glyphs, glyphIndex);
      return index >= 0 ? index : -1;
    }
    case 2: {
      const range = searchRange(coverageTable.ranges, glyphIndex);
      return range ? range.index + glyphIndex - range.start : -1;
    }
  }
}
function expandCoverage(coverageTable) {
  if (coverageTable.format === 1) {
    return coverageTable.glyphs;
  }
  const glyphs = [];
  const ranges = coverageTable.ranges;
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const start = range.start;
    const end = range.end;
    for (let j = start; j <= end; j++) {
      glyphs.push(j);
    }
  }
  return glyphs;
}
function arraysEqual(ar1, ar2) {
  const n = ar1.length;
  if (n !== ar2.length) {
    return false;
  }
  for (let i = 0; i < n; i++) {
    if (ar1[i] !== ar2[i]) {
      return false;
    }
  }
  return true;
}
function getSubstFormat(lookupTable, format, defaultSubtable) {
  const subtables = lookupTable.subtables;
  for (let i = 0; i < subtables.length; i++) {
    const subtable = subtables[i];
    if (subtable.substFormat === format) {
      return subtable;
    }
  }
  if (defaultSubtable) {
    subtables.push(defaultSubtable);
    return defaultSubtable;
  }
  return void 0;
}
class Layout {
  constructor(font, tableName) {
    this.font = font;
    this.tableName = tableName;
  }
  getTable(create) {
    let layout = this.font.tables[this.tableName];
    if (!layout && create) {
      layout = this.font.tables[this.tableName] = this.createDefaultTable();
    }
    return layout;
  }
  getScriptNames() {
    const layout = this.getTable();
    if (!layout) {
      return [];
    }
    return layout.scripts.map((script) => script.tag);
  }
  getDefaultScriptName() {
    const layout = this.getTable();
    if (!layout) {
      return;
    }
    let hasLatn = false;
    for (let i = 0; i < layout.scripts.length; i++) {
      const name = layout.scripts[i].tag;
      if (name === "DFLT") return name;
      if (name === "latn") hasLatn = true;
    }
    if (hasLatn) return "latn";
  }
  getScriptTable(script, create) {
    const layout = this.getTable(create);
    if (layout) {
      script = script || "DFLT";
      const scripts = layout.scripts;
      const pos = searchTag(layout.scripts, script);
      if (pos >= 0) {
        return scripts[pos].script;
      }
      if (create) {
        const scr = {
          tag: script,
          script: {
            defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
            langSysRecords: []
          }
        };
        scripts.splice(-1 - pos, 0, scr);
        return scr.script;
      }
    }
  }
  getLangSysTable(script, language, create) {
    const scriptTable = this.getScriptTable(script, create);
    if (scriptTable) {
      if (!language || language === "dflt" || language === "DFLT") {
        return scriptTable.defaultLangSys;
      }
      const pos = searchTag(scriptTable.langSysRecords, language);
      if (pos >= 0) {
        return scriptTable.langSysRecords[pos].langSys;
      }
      if (create) {
        const langSysRecord = {
          tag: language,
          langSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }
        };
        scriptTable.langSysRecords.splice(-1 - pos, 0, langSysRecord);
        return langSysRecord.langSys;
      }
    }
  }
  getFeatureTable(script, language, feature, create) {
    const langSysTable2 = this.getLangSysTable(script, language, create);
    if (langSysTable2) {
      let featureRecord;
      const featIndexes = langSysTable2.featureIndexes;
      const allFeatures = this.font.tables[this.tableName].features;
      for (let i = 0; i < featIndexes.length; i++) {
        featureRecord = allFeatures[featIndexes[i]];
        if (featureRecord.tag === feature) {
          return featureRecord.feature;
        }
      }
      if (create) {
        const index = allFeatures.length;
        check.assert(index === 0 || feature >= allFeatures[index - 1].tag, "Features must be added in alphabetical order.");
        featureRecord = {
          tag: feature,
          feature: { params: 0, lookupListIndexes: [] }
        };
        allFeatures.push(featureRecord);
        featIndexes.push(index);
        return featureRecord.feature;
      }
    }
  }
  getLookupTables(script, language, feature, lookupType, create) {
    const featureTable = this.getFeatureTable(script, language, feature, create);
    const tables = [];
    if (featureTable) {
      let lookupTable;
      const lookupListIndexes = featureTable.lookupListIndexes;
      const allLookups = this.font.tables[this.tableName].lookups;
      for (let i = 0; i < lookupListIndexes.length; i++) {
        lookupTable = allLookups[lookupListIndexes[i]];
        if (lookupTable.lookupType === lookupType) {
          tables.push(lookupTable);
        }
      }
      if (tables.length === 0 && create) {
        lookupTable = {
          lookupType,
          lookupFlag: 0,
          subtables: [],
          markFilteringSet: void 0
        };
        const index = allLookups.length;
        allLookups.push(lookupTable);
        lookupListIndexes.push(index);
        return [lookupTable];
      }
    }
    return tables;
  }
}
class Position extends Layout {
  constructor(font) {
    super(font, "gpos");
  }
  init() {
    const script = this.getDefaultScriptName();
    this.defaultKerningTables = this.getKerningTables(script);
  }
  getKerningValue(kerningLookups, leftIndex, rightIndex) {
    for (let i = 0; i < kerningLookups.length; i++) {
      const subtables = kerningLookups[i].subtables;
      for (let j = 0; j < subtables.length; j++) {
        const subtable = subtables[j];
        const covIndex = getCoverageIndex(subtable.coverage, leftIndex);
        if (covIndex < 0) continue;
        switch (subtable.posFormat) {
          case 1: {
            const pairSet = subtable.pairSets[covIndex];
            for (let k = 0; k < pairSet.length; k++) {
              const pair = pairSet[k];
              if (pair.secondGlyph === rightIndex) {
                return pair.value1 && pair.value1.xAdvance || 0;
              }
            }
            break;
          }
          case 2: {
            const class1 = getGlyphClass(subtable.classDef1, leftIndex);
            const class2 = getGlyphClass(subtable.classDef2, rightIndex);
            const pair = subtable.classRecords[class1][class2];
            return pair.value1 && pair.value1.xAdvance || 0;
          }
        }
      }
    }
    return 0;
  }
  getKerningTables(script, language) {
    if (this.font.tables.gpos) {
      return this.getLookupTables(script, language, "kern", 2);
    }
  }
}
class Substitution extends Layout {
  constructor(font) {
    super(font, "gsub");
  }
  createDefaultTable() {
    return {
      version: 1,
      scripts: [{
        tag: "DFLT",
        script: {
          defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
          langSysRecords: []
        }
      }],
      features: [],
      lookups: []
    };
  }
  getSingle(feature, script, language) {
    const substitutions = [];
    const lookupTables = this.getLookupTables(script, language, feature, 1);
    for (let idx = 0; idx < lookupTables.length; idx++) {
      const subtables = lookupTables[idx].subtables;
      for (let i = 0; i < subtables.length; i++) {
        const subtable = subtables[i];
        const glyphs = expandCoverage(subtable.coverage);
        let j;
        if (subtable.substFormat === 1) {
          const delta = subtable.deltaGlyphId;
          for (j = 0; j < glyphs.length; j++) {
            const glyph = glyphs[j];
            substitutions.push({ sub: glyph, by: glyph + delta });
          }
        } else {
          const substitute = subtable.substitute;
          for (j = 0; j < glyphs.length; j++) {
            substitutions.push({ sub: glyphs[j], by: substitute[j] });
          }
        }
      }
    }
    return substitutions;
  }
  getMultiple(feature, script, language) {
    const substitutions = [];
    const lookupTables = this.getLookupTables(script, language, feature, 2);
    for (let idx = 0; idx < lookupTables.length; idx++) {
      const subtables = lookupTables[idx].subtables;
      for (let i = 0; i < subtables.length; i++) {
        const subtable = subtables[i];
        const glyphs = expandCoverage(subtable.coverage);
        for (let j = 0; j < glyphs.length; j++) {
          const glyph = glyphs[j];
          const replacements = subtable.sequences[j];
          substitutions.push({ sub: glyph, by: replacements });
        }
      }
    }
    return substitutions;
  }
  getAlternates(feature, script, language) {
    const alternates = [];
    const lookupTables = this.getLookupTables(script, language, feature, 3);
    for (let idx = 0; idx < lookupTables.length; idx++) {
      const subtables = lookupTables[idx].subtables;
      for (let i = 0; i < subtables.length; i++) {
        const subtable = subtables[i];
        const glyphs = expandCoverage(subtable.coverage);
        const alternateSets = subtable.alternateSets;
        for (let j = 0; j < glyphs.length; j++) {
          alternates.push({ sub: glyphs[j], by: alternateSets[j] });
        }
      }
    }
    return alternates;
  }
  getLigatures(feature, script, language) {
    const ligatures = [];
    const lookupTables = this.getLookupTables(script, language, feature, 4);
    for (let idx = 0; idx < lookupTables.length; idx++) {
      const subtables = lookupTables[idx].subtables;
      for (let i = 0; i < subtables.length; i++) {
        const subtable = subtables[i];
        const glyphs = expandCoverage(subtable.coverage);
        const ligatureSets = subtable.ligatureSets;
        for (let j = 0; j < glyphs.length; j++) {
          const startGlyph = glyphs[j];
          const ligSet = ligatureSets[j];
          for (let k = 0; k < ligSet.length; k++) {
            const lig = ligSet[k];
            ligatures.push({
              sub: [startGlyph].concat(lig.components),
              by: lig.ligGlyph
            });
          }
        }
      }
    }
    return ligatures;
  }
  addSingle(feature, substitution, script, language) {
    const lookupTable = this.getLookupTables(script, language, feature, 1, true)[0];
    const subtable = getSubstFormat(lookupTable, 2, {
      substFormat: 2,
      coverage: { format: 1, glyphs: [] },
      substitute: []
    });
    check.assert(subtable.coverage.format === 1, `Single: unable to modify coverage table format ${subtable.coverage.format}`);
    const coverageGlyph = substitution.sub;
    let pos = binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos < 0) {
      pos = -1 - pos;
      subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
      subtable.substitute.splice(pos, 0, 0);
    }
    subtable.substitute[pos] = substitution.by;
  }
  addMultiple(feature, substitution, script, language) {
    check.assert(substitution.by instanceof Array && substitution.by.length > 1, 'Multiple: "by" must be an array of two or more ids');
    const lookupTable = this.getLookupTables(script, language, feature, 2, true)[0];
    const subtable = getSubstFormat(lookupTable, 1, {
      substFormat: 1,
      coverage: { format: 1, glyphs: [] },
      sequences: []
    });
    check.assert(subtable.coverage.format === 1, `Multiple: unable to modify coverage table format ${subtable.coverage.format}`);
    const coverageGlyph = substitution.sub;
    let pos = binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos < 0) {
      pos = -1 - pos;
      subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
      subtable.sequences.splice(pos, 0, 0);
    }
    subtable.sequences[pos] = substitution.by;
  }
  addAlternate(feature, substitution, script, language) {
    const lookupTable = this.getLookupTables(script, language, feature, 3, true)[0];
    const subtable = getSubstFormat(lookupTable, 1, {
      substFormat: 1,
      coverage: { format: 1, glyphs: [] },
      alternateSets: []
    });
    check.assert(subtable.coverage.format === 1, `Alternate: unable to modify coverage table format ${subtable.coverage.format}`);
    const coverageGlyph = substitution.sub;
    let pos = binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos < 0) {
      pos = -1 - pos;
      subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
      subtable.alternateSets.splice(pos, 0, 0);
    }
    subtable.alternateSets[pos] = substitution.by;
  }
  addLigature(feature, ligature, script, language) {
    const lookupTable = this.getLookupTables(script, language, feature, 4, true)[0];
    let subtable = lookupTable.subtables[0];
    if (!subtable) {
      subtable = {
        substFormat: 1,
        coverage: { format: 1, glyphs: [] },
        ligatureSets: []
      };
      lookupTable.subtables[0] = subtable;
    }
    check.assert(subtable.coverage.format === 1, `Ligature: unable to modify coverage table format ${subtable.coverage.format}`);
    const coverageGlyph = ligature.sub[0];
    const ligComponents = ligature.sub.slice(1);
    const ligatureTable = {
      ligGlyph: ligature.by,
      components: ligComponents
    };
    let pos = binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos >= 0) {
      const ligatureSet = subtable.ligatureSets[pos];
      for (let i = 0; i < ligatureSet.length; i++) {
        if (arraysEqual(ligatureSet[i].components, ligComponents)) {
          return;
        }
      }
      ligatureSet.push(ligatureTable);
    } else {
      pos = -1 - pos;
      subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
      subtable.ligatureSets.splice(pos, 0, [ligatureTable]);
    }
  }
  add(feature, sub, script, language) {
    if (/ss\d\d/.test(feature)) {
      return this.addSingle(feature, sub, script, language);
    }
    switch (feature) {
      case "aalt":
      case "salt":
        if (typeof sub.by === "number") {
          return this.addSingle(feature, sub, script, language);
        }
        return this.addAlternate(feature, sub, script, language);
      case "dlig":
      case "liga":
      case "rlig":
        return this.addLigature(feature, sub, script, language);
      case "ccmp":
        if (sub.by instanceof Array) {
          return this.addMultiple(feature, sub, script, language);
        }
        return this.addLigature(feature, sub, script, language);
    }
    return void 0;
  }
}
class GlyphSet {
  constructor(font, glyphs) {
    this.font = font;
    this.glyphs = {};
    if (Array.isArray(glyphs)) {
      for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i];
        glyph.path.unitsPerEm = font.unitsPerEm;
        this.glyphs[i] = glyph;
      }
    }
    this.length = glyphs && glyphs.length || 0;
  }
  get(index) {
    let glyph = this.glyphs[index];
    if (typeof glyph === "function") {
      glyph = this.glyphs[index] = glyph();
    } else if (glyph === void 0 && index >= 0 && index < this.length) {
      glyph = this.glyphs[index] = new Glyph({ index, font: this.font });
    }
    return glyph;
  }
  push(index, loader) {
    this.glyphs[index] = loader;
    this.length++;
  }
}
function ttfGlyphLoader(font, index, parseGlyph2, data, position, buildPath2) {
  return function() {
    const glyph = new Glyph({ index, font });
    glyph.path = function() {
      parseGlyph2(glyph, data, position);
      const path = buildPath2(font.glyphs, glyph);
      path.unitsPerEm = font.unitsPerEm;
      return path;
    };
    return glyph;
  };
}
function cffGlyphLoader(font, index, parseCFFCharstring2, charstring) {
  return function() {
    const glyph = new Glyph({ index, font });
    glyph.path = function() {
      const path = parseCFFCharstring2(font, glyph, charstring);
      path.unitsPerEm = font.unitsPerEm;
      return path;
    };
    return glyph;
  };
}
class Font {
  constructor(options) {
    options = options || {};
    options.tables = options.tables || {};
    if (!options.empty) {
      checkArgument(options.familyName, "When creating a new Font object, familyName is required.");
      checkArgument(options.styleName, "When creating a new Font object, styleName is required.");
      checkArgument(options.unitsPerEm, "When creating a new Font object, unitsPerEm is required.");
      checkArgument(options.ascender, "When creating a new Font object, ascender is required.");
      checkArgument(options.descender <= 0, "When creating a new Font object, negative descender value is required.");
      this.names = {
        fontFamily: { en: options.familyName || " " },
        fontSubfamily: { en: options.styleName || " " },
        fullName: { en: options.fullName || `${options.familyName} ${options.styleName}` },
        postScriptName: { en: options.postScriptName || (options.familyName + options.styleName).replace(/\s/g, "") },
        designer: { en: options.designer || " " },
        designerURL: { en: options.designerURL || " " },
        manufacturer: { en: options.manufacturer || " " },
        manufacturerURL: { en: options.manufacturerURL || " " },
        license: { en: options.license || " " },
        licenseURL: { en: options.licenseURL || " " },
        version: { en: options.version || "Version 0.1" },
        description: { en: options.description || " " },
        copyright: { en: options.copyright || " " },
        trademark: { en: options.trademark || " " }
      };
      this.unitsPerEm = options.unitsPerEm || 1e3;
      this.ascender = options.ascender;
      this.descender = options.descender;
      this.createdTimestamp = options.createdTimestamp;
      this.tables = Object.assign(options.tables, {
        os2: {
          usWeightClass: options.weightClass || usWeightClasses.MEDIUM,
          usWidthClass: options.widthClass || usWidthClasses.MEDIUM,
          fsSelection: options.fsSelection || fsSelectionValues.REGULAR,
          ...options.tables.os2
        }
      });
    }
    this.supported = true;
    this.glyphs = new GlyphSet(this, options.glyphs || []);
    this.encoding = new DefaultEncoding(this);
    this.position = new Position(this);
    this.substitution = new Substitution(this);
    this.tables = this.tables || {};
    this.outlinesFormat = void 0;
    this.numGlyphs = void 0;
    this.numberOfHMetrics = void 0;
    this.kerningPairs = {};
    this.glyphNames = void 0;
    this.cffEncoding = void 0;
    this.isCIDFont = void 0;
  }
  hasChar(c) {
    return this.encoding.charToGlyphIndex(c) !== null;
  }
  charToGlyphIndex(s) {
    return this.encoding.charToGlyphIndex(s);
  }
  charToGlyph(c) {
    const glyphIndex = this.charToGlyphIndex(c);
    let glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
      glyph = this.glyphs.get(0);
    }
    return glyph;
  }
  nameToGlyphIndex(name) {
    return this.glyphNames.names.indexOf(name);
  }
  nameToGlyph(name) {
    const glyphIndex = this.nameToGlyphIndex(name);
    let glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
      glyph = this.glyphs.get(0);
    }
    return glyph;
  }
  glyphIndexToName(gid) {
    if (!this.glyphNames.names) {
      return "";
    }
    return this.glyphNames.names[gid];
  }
  getKerningValue(leftGlyph, rightGlyph) {
    leftGlyph = leftGlyph.index || leftGlyph;
    rightGlyph = rightGlyph.index || rightGlyph;
    const gposKerning = this.position.defaultKerningTables;
    if (gposKerning) {
      return this.position.getKerningValue(gposKerning, leftGlyph, rightGlyph);
    }
    if (this.kerningPairs) {
      return this.kerningPairs[`${leftGlyph},${rightGlyph}`] || 0;
    }
    return 0;
  }
  getEnglishName(name) {
    const translations = this.names[name];
    if (translations) {
      return translations.en;
    }
  }
  validate() {
    const _this = this;
    function assert(predicate, message) {
    }
    function assertNamePresent(name) {
      const englishName = _this.getEnglishName(name);
      assert(englishName && englishName.trim().length > 0);
    }
    assertNamePresent("fontFamily");
    assertNamePresent("weightName");
    assertNamePresent("manufacturer");
    assertNamePresent("copyright");
    assertNamePresent("version");
    assert(this.unitsPerEm > 0);
  }
  /** @returns {*} */
  toTables() {
    return null;
  }
  /** @returns {ArrayBuffer} */
  toArrayBuffer() {
    return this.toTables().buffer;
  }
}
function equals(a, b) {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!equals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
function calcCFFSubroutineBias(subrs) {
  let bias;
  if (subrs.length < 1240) {
    bias = 107;
  } else if (subrs.length < 33900) {
    bias = 1131;
  } else {
    bias = 32768;
  }
  return bias;
}
function parseCFFIndex(data, start, conversionFn) {
  const offsets = [];
  const objects = [];
  const count = parse.getCard16(data, start);
  let objectOffset;
  let endOffset;
  if (count !== 0) {
    const offsetSize = parse.getByte(data, start + 2);
    objectOffset = start + (count + 1) * offsetSize + 2;
    let pos = start + 3;
    for (let i = 0; i < count + 1; i += 1) {
      offsets.push(parse.getOffset(data, pos, offsetSize));
      pos += offsetSize;
    }
    endOffset = objectOffset + offsets[count];
  } else {
    endOffset = start + 2;
  }
  for (let i = 0; i < offsets.length - 1; i += 1) {
    let value = parse.getBytes(data, objectOffset + offsets[i], objectOffset + offsets[i + 1]);
    if (conversionFn) {
      value = conversionFn(value);
    }
    objects.push(value);
  }
  return { objects, startOffset: start, endOffset };
}
function parseFloatOperand(parser) {
  let s = "";
  const eof = 15;
  const lookup = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"];
  while (true) {
    const b = parser.parseByte();
    const n1 = b >> 4;
    const n2 = b & 15;
    if (n1 === eof) {
      break;
    }
    s += lookup[n1];
    if (n2 === eof) {
      break;
    }
    s += lookup[n2];
  }
  return parseFloat(s);
}
function parseOperand(parser, b0) {
  let b1;
  let b2;
  let b3;
  let b4;
  if (b0 === 28) {
    b1 = parser.parseByte();
    b2 = parser.parseByte();
    return b1 << 8 | b2;
  }
  if (b0 === 29) {
    b1 = parser.parseByte();
    b2 = parser.parseByte();
    b3 = parser.parseByte();
    b4 = parser.parseByte();
    return b1 << 24 | b2 << 16 | b3 << 8 | b4;
  }
  if (b0 === 30) {
    return parseFloatOperand(parser);
  }
  if (b0 >= 32 && b0 <= 246) {
    return b0 - 139;
  }
  if (b0 >= 247 && b0 <= 250) {
    b1 = parser.parseByte();
    return (b0 - 247) * 256 + b1 + 108;
  }
  if (b0 >= 251 && b0 <= 254) {
    b1 = parser.parseByte();
    return -(b0 - 251) * 256 - b1 - 108;
  }
  throw new Error(`Invalid b0 ${b0}`);
}
function entriesToObject(entries) {
  const o = {};
  for (let i = 0; i < entries.length; i += 1) {
    const key = entries[i][0];
    const values = entries[i][1];
    let value;
    if (values.length === 1) {
      value = values[0];
    } else {
      value = values;
    }
    o[key] = value;
  }
  return o;
}
function parseCFFDict(data, start, size) {
  start = start !== void 0 ? start : 0;
  const parser = new parse.Parser(data, start);
  const entries = [];
  let operands = [];
  size = size !== void 0 ? size : data.length;
  while (parser.relativeOffset < size) {
    let op = parser.parseByte();
    if (op <= 21) {
      if (op === 12) {
        op = 1200 + parser.parseByte();
      }
      entries.push([op, operands]);
      operands = [];
    } else if (op >= 22 && op <= 27 || op === 31 || op === 255) ;
    else {
      operands.push(parseOperand(parser, op));
    }
  }
  return entriesToObject(entries);
}
function getCFFString(strings, index) {
  if (index <= 390) {
    index = cffStandardStrings[index];
  } else {
    index = strings[index - 391];
  }
  return index;
}
function interpretDict(dict, meta, strings) {
  const newDict = {};
  let value;
  for (let i = 0; i < meta.length; i += 1) {
    const m = meta[i];
    if (Array.isArray(m.type)) {
      const values = [];
      values.length = m.type.length;
      for (let j = 0; j < m.type.length; j++) {
        value = dict[m.op] !== void 0 ? dict[m.op][j] : void 0;
        if (value === void 0) {
          value = m.value !== void 0 && m.value[j] !== void 0 ? m.value[j] : null;
        }
        if (m.type[j] === "SID") {
          value = getCFFString(strings, value);
        }
        values[j] = value;
      }
      newDict[m.name] = values;
    } else {
      value = dict[m.op];
      if (value === void 0) {
        value = m.value !== void 0 ? m.value : null;
      }
      if (m.type === "SID") {
        value = getCFFString(strings, value);
      }
      newDict[m.name] = value;
    }
  }
  return newDict;
}
function parseCFFHeader(data, start) {
  const header = {};
  header.formatMajor = parse.getCard8(data, start);
  header.formatMinor = parse.getCard8(data, start + 1);
  header.size = parse.getCard8(data, start + 2);
  header.offsetSize = parse.getCard8(data, start + 3);
  header.startOffset = start;
  header.endOffset = start + 4;
  return header;
}
const TOP_DICT_META = [
  { name: "version", op: 0, type: "SID" },
  { name: "notice", op: 1, type: "SID" },
  { name: "copyright", op: 1200, type: "SID" },
  { name: "fullName", op: 2, type: "SID" },
  { name: "familyName", op: 3, type: "SID" },
  { name: "weight", op: 4, type: "SID" },
  {
    name: "isFixedPitch",
    op: 1201,
    type: "number",
    value: 0
  },
  {
    name: "italicAngle",
    op: 1202,
    type: "number",
    value: 0
  },
  {
    name: "underlinePosition",
    op: 1203,
    type: "number",
    value: -100
  },
  {
    name: "underlineThickness",
    op: 1204,
    type: "number",
    value: 50
  },
  {
    name: "paintType",
    op: 1205,
    type: "number",
    value: 0
  },
  {
    name: "charstringType",
    op: 1206,
    type: "number",
    value: 2
  },
  {
    name: "fontMatrix",
    op: 1207,
    type: ["real", "real", "real", "real", "real", "real"],
    value: [1e-3, 0, 0, 1e-3, 0, 0]
  },
  { name: "uniqueId", op: 13, type: "number" },
  {
    name: "fontBBox",
    op: 5,
    type: ["number", "number", "number", "number"],
    value: [0, 0, 0, 0]
  },
  {
    name: "strokeWidth",
    op: 1208,
    type: "number",
    value: 0
  },
  {
    name: "xuid",
    op: 14,
    type: [],
    value: null
  },
  {
    name: "charset",
    op: 15,
    type: "offset",
    value: 0
  },
  {
    name: "encoding",
    op: 16,
    type: "offset",
    value: 0
  },
  {
    name: "charStrings",
    op: 17,
    type: "offset",
    value: 0
  },
  {
    name: "private",
    op: 18,
    type: ["number", "offset"],
    value: [0, 0]
  },
  { name: "ros", op: 1230, type: ["SID", "SID", "number"] },
  {
    name: "cidFontVersion",
    op: 1231,
    type: "number",
    value: 0
  },
  {
    name: "cidFontRevision",
    op: 1232,
    type: "number",
    value: 0
  },
  {
    name: "cidFontType",
    op: 1233,
    type: "number",
    value: 0
  },
  {
    name: "cidCount",
    op: 1234,
    type: "number",
    value: 8720
  },
  { name: "uidBase", op: 1235, type: "number" },
  { name: "fdArray", op: 1236, type: "offset" },
  { name: "fdSelect", op: 1237, type: "offset" },
  { name: "fontName", op: 1238, type: "SID" }
];
const PRIVATE_DICT_META = [
  {
    name: "subrs",
    op: 19,
    type: "offset",
    value: 0
  },
  {
    name: "defaultWidthX",
    op: 20,
    type: "number",
    value: 0
  },
  {
    name: "nominalWidthX",
    op: 21,
    type: "number",
    value: 0
  }
];
function parseCFFTopDict(data, strings) {
  const dict = parseCFFDict(data, 0, data.byteLength);
  return interpretDict(dict, TOP_DICT_META, strings);
}
function parseCFFPrivateDict(data, start, size, strings) {
  const dict = parseCFFDict(data, start, size);
  return interpretDict(dict, PRIVATE_DICT_META, strings);
}
function gatherCFFTopDicts(data, start, cffIndex, strings) {
  const topDictArray = [];
  for (let iTopDict = 0; iTopDict < cffIndex.length; iTopDict += 1) {
    const topDictData = new DataView(new Uint8Array(cffIndex[iTopDict]).buffer);
    const topDict = parseCFFTopDict(topDictData, strings);
    topDict._subrs = [];
    topDict._subrsBias = 0;
    topDict._defaultWidthX = 0;
    topDict._nominalWidthX = 0;
    const privateSize = topDict.private[0];
    const privateOffset = topDict.private[1];
    if (privateSize !== 0 && privateOffset !== 0) {
      const privateDict = parseCFFPrivateDict(data, privateOffset + start, privateSize, strings);
      topDict._defaultWidthX = privateDict.defaultWidthX;
      topDict._nominalWidthX = privateDict.nominalWidthX;
      if (privateDict.subrs !== 0) {
        const subrOffset = privateOffset + privateDict.subrs;
        const subrIndex = parseCFFIndex(data, subrOffset + start);
        topDict._subrs = subrIndex.objects;
        topDict._subrsBias = calcCFFSubroutineBias(topDict._subrs);
      }
      topDict._privateDict = privateDict;
    }
    topDictArray.push(topDict);
  }
  return topDictArray;
}
function parseCFFCharset(data, start, nGlyphs, strings) {
  let sid;
  let count;
  const parser = new parse.Parser(data, start);
  nGlyphs -= 1;
  const charset = [".notdef"];
  const format = parser.parseCard8();
  if (format === 0) {
    for (let i = 0; i < nGlyphs; i += 1) {
      sid = parser.parseSID();
      charset.push(getCFFString(strings, sid));
    }
  } else if (format === 1) {
    while (charset.length <= nGlyphs) {
      sid = parser.parseSID();
      count = parser.parseCard8();
      for (let i = 0; i <= count; i += 1) {
        charset.push(getCFFString(strings, sid));
        sid += 1;
      }
    }
  } else if (format === 2) {
    while (charset.length <= nGlyphs) {
      sid = parser.parseSID();
      count = parser.parseCard16();
      for (let i = 0; i <= count; i += 1) {
        charset.push(getCFFString(strings, sid));
        sid += 1;
      }
    }
  } else {
    throw new Error(`Unknown charset format ${format}`);
  }
  return charset;
}
function parseCFFEncoding(data, start, charset, strings) {
  let code;
  const enc = {};
  const parser = new parse.Parser(data, start);
  const formatByte = parser.parseCard8();
  const hasSupplement = (formatByte & 128) !== 0;
  const format = formatByte & 127;
  if (format === 0) {
    const nCodes = parser.parseCard8();
    for (let i = 0; i < nCodes; i += 1) {
      code = parser.parseCard8();
      enc[code] = i;
    }
  } else if (format === 1) {
    const nRanges = parser.parseCard8();
    code = 0;
    for (let i = 0; i < nRanges; i += 1) {
      const first = parser.parseCard8();
      const nLeft = parser.parseCard8();
      for (let j = first; j <= first + nLeft; j += 1) {
        enc[j] = code;
        code += 1;
      }
    }
  } else {
    throw new Error(`Unknown encoding format ${format}`);
  }
  if (hasSupplement) {
    const nSups = parser.parseCard8();
    for (let i = 0; i < nSups; i += 1) {
      const supCode = parser.parseCard8();
      const sid = parser.parseUShort();
      const glyphName = sid < cffStandardStrings.length ? cffStandardStrings[sid] : strings && strings[sid - cffStandardStrings.length];
      if (glyphName) {
        const gid = charset.indexOf(glyphName);
        if (gid > 0) enc[supCode] = gid - 1;
      }
    }
  }
  return new CffEncoding(enc, charset);
}
function parseCFFCharstring(font, glyph, code) {
  let c1x;
  let c1y;
  let c2x;
  let c2y;
  const p = new Path();
  const stack = [];
  let nStems = 0;
  let haveWidth = false;
  let open = false;
  let x = 0;
  let y = 0;
  let subrs;
  let subrsBias;
  let defaultWidthX;
  let nominalWidthX;
  if (font.isCIDFont) {
    const fdIndex = font.tables.cff.topDict._fdSelect[glyph.index];
    const fdDict = font.tables.cff.topDict._fdArray[fdIndex];
    subrs = fdDict._subrs;
    subrsBias = fdDict._subrsBias;
    defaultWidthX = fdDict._defaultWidthX;
    nominalWidthX = fdDict._nominalWidthX;
  } else {
    subrs = font.tables.cff.topDict._subrs;
    subrsBias = font.tables.cff.topDict._subrsBias;
    defaultWidthX = font.tables.cff.topDict._defaultWidthX;
    nominalWidthX = font.tables.cff.topDict._nominalWidthX;
  }
  let width = defaultWidthX;
  function newContour(x2, y2) {
    if (open) {
      p.closePath();
    }
    p.moveTo(x2, y2);
    open = true;
  }
  function parseStems() {
    let hasWidthArg;
    hasWidthArg = stack.length % 2 !== 0;
    if (hasWidthArg && !haveWidth) {
      width = stack.shift() + nominalWidthX;
    }
    nStems += stack.length >> 1;
    stack.length = 0;
    haveWidth = true;
  }
  function parse2(code2) {
    let b1;
    let b2;
    let b3;
    let b4;
    let codeIndex;
    let subrCode;
    let jpx;
    let jpy;
    let c3x;
    let c3y;
    let c4x;
    let c4y;
    let i = 0;
    while (i < code2.length) {
      let v = code2[i];
      i += 1;
      switch (v) {
        case 1:
          parseStems();
          break;
        case 3:
          parseStems();
          break;
        case 4:
          if (stack.length > 1 && !haveWidth) {
            width = stack.shift() + nominalWidthX;
            haveWidth = true;
          }
          y += stack.pop();
          newContour(x, y);
          break;
        case 5:
          while (stack.length > 0) {
            x += stack.shift();
            y += stack.shift();
            p.lineTo(x, y);
          }
          break;
        case 6:
          while (stack.length > 0) {
            x += stack.shift();
            p.lineTo(x, y);
            if (stack.length === 0) {
              break;
            }
            y += stack.shift();
            p.lineTo(x, y);
          }
          break;
        case 7:
          while (stack.length > 0) {
            y += stack.shift();
            p.lineTo(x, y);
            if (stack.length === 0) {
              break;
            }
            x += stack.shift();
            p.lineTo(x, y);
          }
          break;
        case 8:
          while (stack.length > 0) {
            c1x = x + stack.shift();
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            y = c2y + stack.shift();
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          break;
        case 10:
          codeIndex = stack.pop() + subrsBias;
          subrCode = subrs[codeIndex];
          if (subrCode) {
            parse2(subrCode);
          }
          break;
        case 11:
          return;
        case 12:
          v = code2[i];
          i += 1;
          switch (v) {
            case 0:
              break;
            case 35:
              c1x = x + stack.shift();
              c1y = y + stack.shift();
              c2x = c1x + stack.shift();
              c2y = c1y + stack.shift();
              jpx = c2x + stack.shift();
              jpy = c2y + stack.shift();
              c3x = jpx + stack.shift();
              c3y = jpy + stack.shift();
              c4x = c3x + stack.shift();
              c4y = c3y + stack.shift();
              x = c4x + stack.shift();
              y = c4y + stack.shift();
              stack.shift();
              p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
              p.curveTo(c3x, c3y, c4x, c4y, x, y);
              break;
            case 34:
              c1x = x + stack.shift();
              c1y = y;
              c2x = c1x + stack.shift();
              c2y = c1y + stack.shift();
              jpx = c2x + stack.shift();
              jpy = c2y;
              c3x = jpx + stack.shift();
              c3y = c2y;
              c4x = c3x + stack.shift();
              c4y = y;
              x = c4x + stack.shift();
              p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
              p.curveTo(c3x, c3y, c4x, c4y, x, y);
              break;
            case 36:
              c1x = x + stack.shift();
              c1y = y + stack.shift();
              c2x = c1x + stack.shift();
              c2y = c1y + stack.shift();
              jpx = c2x + stack.shift();
              jpy = c2y;
              c3x = jpx + stack.shift();
              c3y = c2y;
              c4x = c3x + stack.shift();
              c4y = c3y + stack.shift();
              x = c4x + stack.shift();
              p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
              p.curveTo(c3x, c3y, c4x, c4y, x, y);
              break;
            case 37:
              c1x = x + stack.shift();
              c1y = y + stack.shift();
              c2x = c1x + stack.shift();
              c2y = c1y + stack.shift();
              jpx = c2x + stack.shift();
              jpy = c2y + stack.shift();
              c3x = jpx + stack.shift();
              c3y = jpy + stack.shift();
              c4x = c3x + stack.shift();
              c4y = c3y + stack.shift();
              if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                x = c4x + stack.shift();
              } else {
                y = c4y + stack.shift();
              }
              p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
              p.curveTo(c3x, c3y, c4x, c4y, x, y);
              break;
            default:
              console.log(`Glyph ${glyph.index}: unknown operator ${1200}${v}`);
              stack.length = 0;
          }
          break;
        case 14:
          if (!haveWidth && (stack.length === 1 || stack.length === 5)) {
            width = stack.shift() + nominalWidthX;
            haveWidth = true;
          }
          if (stack.length >= 4) {
            const adx = stack.shift();
            const ady = stack.shift();
            const bchar = stack.shift();
            const achar = stack.shift();
            const baseName = cffStandardEncoding[bchar];
            const accentName = cffStandardEncoding[achar];
            const charset = font.tables.cff.charset;
            if (baseName && accentName && charset) {
              const baseGID = charset.indexOf(baseName);
              const accentGID = charset.indexOf(accentName);
              if (baseGID > 0) {
                const baseGlyph = font.glyphs.get(baseGID);
                if (baseGlyph && baseGlyph.path && baseGlyph.path.commands) {
                  for (const cmd of baseGlyph.path.commands) {
                    if (cmd.type === "M") p.moveTo(cmd.x, cmd.y);
                    else if (cmd.type === "L") p.lineTo(cmd.x, cmd.y);
                    else if (cmd.type === "C") p.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                    else if (cmd.type === "Q") p.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
                    else if (cmd.type === "Z") p.closePath();
                  }
                }
              }
              if (accentGID > 0) {
                const accentGlyph = font.glyphs.get(accentGID);
                if (accentGlyph && accentGlyph.path && accentGlyph.path.commands) {
                  for (const cmd of accentGlyph.path.commands) {
                    if (cmd.type === "M") p.moveTo(cmd.x + adx, cmd.y + ady);
                    else if (cmd.type === "L") p.lineTo(cmd.x + adx, cmd.y + ady);
                    else if (cmd.type === "C") p.curveTo(cmd.x1 + adx, cmd.y1 + ady, cmd.x2 + adx, cmd.y2 + ady, cmd.x + adx, cmd.y + ady);
                    else if (cmd.type === "Q") p.quadTo(cmd.x1 + adx, cmd.y1 + ady, cmd.x + adx, cmd.y + ady);
                    else if (cmd.type === "Z") p.closePath();
                  }
                }
              }
            }
          }
          if (open) {
            p.closePath();
            open = false;
          }
          break;
        case 18:
          parseStems();
          break;
        case 19:
        // hintmask
        case 20:
          parseStems();
          i += nStems + 7 >> 3;
          break;
        case 21:
          if (stack.length > 2 && !haveWidth) {
            width = stack.shift() + nominalWidthX;
            haveWidth = true;
          }
          y += stack.pop();
          x += stack.pop();
          newContour(x, y);
          break;
        case 22:
          if (stack.length > 1 && !haveWidth) {
            width = stack.shift() + nominalWidthX;
            haveWidth = true;
          }
          x += stack.pop();
          newContour(x, y);
          break;
        case 23:
          parseStems();
          break;
        case 24:
          while (stack.length > 2) {
            c1x = x + stack.shift();
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            y = c2y + stack.shift();
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          x += stack.shift();
          y += stack.shift();
          p.lineTo(x, y);
          break;
        case 25:
          while (stack.length > 6) {
            x += stack.shift();
            y += stack.shift();
            p.lineTo(x, y);
          }
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x + stack.shift();
          y = c2y + stack.shift();
          p.curveTo(c1x, c1y, c2x, c2y, x, y);
          break;
        case 26:
          if (stack.length % 2) {
            x += stack.shift();
          }
          while (stack.length > 0) {
            c1x = x;
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x;
            y = c2y + stack.shift();
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          break;
        case 27:
          if (stack.length % 2) {
            y += stack.shift();
          }
          while (stack.length > 0) {
            c1x = x + stack.shift();
            c1y = y;
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            y = c2y;
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          break;
        case 28:
          b1 = code2[i];
          b2 = code2[i + 1];
          stack.push((b1 << 24 | b2 << 16) >> 16);
          i += 2;
          break;
        case 29:
          codeIndex = stack.pop() + font.gsubrsBias;
          subrCode = font.gsubrs[codeIndex];
          if (subrCode) {
            parse2(subrCode);
          }
          break;
        case 30:
          while (stack.length > 0) {
            c1x = x;
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            y = c2y + (stack.length === 1 ? stack.shift() : 0);
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
            if (stack.length === 0) {
              break;
            }
            c1x = x + stack.shift();
            c1y = y;
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            y = c2y + stack.shift();
            x = c2x + (stack.length === 1 ? stack.shift() : 0);
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          break;
        case 31:
          while (stack.length > 0) {
            c1x = x + stack.shift();
            c1y = y;
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            y = c2y + stack.shift();
            x = c2x + (stack.length === 1 ? stack.shift() : 0);
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
            if (stack.length === 0) {
              break;
            }
            c1x = x;
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            y = c2y + (stack.length === 1 ? stack.shift() : 0);
            p.curveTo(c1x, c1y, c2x, c2y, x, y);
          }
          break;
        default:
          if (v < 32) {
            console.log(`Glyph ${glyph.index}: unknown operator ${v}`);
          } else if (v < 247) {
            stack.push(v - 139);
          } else if (v < 251) {
            b1 = code2[i];
            i += 1;
            stack.push((v - 247) * 256 + b1 + 108);
          } else if (v < 255) {
            b1 = code2[i];
            i += 1;
            stack.push(-(v - 251) * 256 - b1 - 108);
          } else {
            b1 = code2[i];
            b2 = code2[i + 1];
            b3 = code2[i + 2];
            b4 = code2[i + 3];
            i += 4;
            stack.push((b1 << 24 | b2 << 16 | b3 << 8 | b4) / 65536);
          }
      }
    }
  }
  parse2(code);
  glyph.advanceWidth = width;
  return p;
}
function parseCFFFDSelect(data, start, nGlyphs, fdArrayCount) {
  const fdSelect = [];
  let fdIndex;
  const parser = new parse.Parser(data, start);
  const format = parser.parseCard8();
  if (format === 0) {
    for (let iGid = 0; iGid < nGlyphs; iGid++) {
      fdIndex = parser.parseCard8();
      if (fdIndex >= fdArrayCount) {
        throw new Error(`CFF table CID Font FDSelect has bad FD index value ${fdIndex} (FD count ${fdArrayCount})`);
      }
      fdSelect.push(fdIndex);
    }
  } else if (format === 3) {
    const nRanges = parser.parseCard16();
    let first = parser.parseCard16();
    if (first !== 0) {
      throw new Error(`CFF Table CID Font FDSelect format 3 range has bad initial GID ${first}`);
    }
    let next;
    for (let iRange = 0; iRange < nRanges; iRange++) {
      fdIndex = parser.parseCard8();
      next = parser.parseCard16();
      if (fdIndex >= fdArrayCount) {
        throw new Error(`CFF table CID Font FDSelect has bad FD index value ${fdIndex} (FD count ${fdArrayCount})`);
      }
      if (next > nGlyphs) {
        throw new Error(`CFF Table CID Font FDSelect format 3 range has bad GID ${next}`);
      }
      for (; first < next; first++) {
        fdSelect.push(fdIndex);
      }
      first = next;
    }
    if (next !== nGlyphs) {
      throw new Error(`CFF Table CID Font FDSelect format 3 range has bad final GID ${next}`);
    }
  } else {
    throw new Error(`CFF Table CID Font FDSelect table has unsupported format ${format}`);
  }
  return fdSelect;
}
function parseCFFTable(data, start, font) {
  font.tables.cff = {};
  const header = parseCFFHeader(data, start);
  const nameIndex = parseCFFIndex(data, header.endOffset, parse.bytesToString);
  const topDictIndex = parseCFFIndex(data, nameIndex.endOffset);
  const stringIndex = parseCFFIndex(data, topDictIndex.endOffset, parse.bytesToString);
  const globalSubrIndex = parseCFFIndex(data, stringIndex.endOffset);
  font.gsubrs = globalSubrIndex.objects;
  font.gsubrsBias = calcCFFSubroutineBias(font.gsubrs);
  const topDictArray = gatherCFFTopDicts(data, start, topDictIndex.objects, stringIndex.objects);
  if (topDictArray.length !== 1) {
    throw new Error(`CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = ${topDictArray.length}`);
  }
  const topDict = topDictArray[0];
  font.tables.cff.topDict = topDict;
  if (topDict._privateDict) {
    font.defaultWidthX = topDict._privateDict.defaultWidthX;
    font.nominalWidthX = topDict._privateDict.nominalWidthX;
  }
  if (topDict.ros[0] !== void 0 && topDict.ros[1] !== void 0) {
    font.isCIDFont = true;
  }
  const charStringsIndex = parseCFFIndex(data, start + topDict.charStrings);
  font.nGlyphs = charStringsIndex.objects.length;
  if (font.isCIDFont) {
    let fdArrayOffset = topDict.fdArray;
    let fdSelectOffset = topDict.fdSelect;
    if (fdArrayOffset === 0 || fdSelectOffset === 0) {
      throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
    }
    fdArrayOffset += start;
    const fdArrayIndex = parseCFFIndex(data, fdArrayOffset);
    const fdArray = gatherCFFTopDicts(data, start, fdArrayIndex.objects, stringIndex.objects);
    topDict._fdArray = fdArray;
    fdSelectOffset += start;
    topDict._fdSelect = parseCFFFDSelect(data, fdSelectOffset, font.nGlyphs, fdArray.length);
  }
  const privateDictOffset = start + topDict.private[1];
  const privateDict = parseCFFPrivateDict(data, privateDictOffset, topDict.private[0], stringIndex.objects);
  font.defaultWidthX = privateDict.defaultWidthX;
  font.nominalWidthX = privateDict.nominalWidthX;
  if (privateDict.subrs !== 0) {
    const subrOffset = privateDictOffset + privateDict.subrs;
    const subrIndex = parseCFFIndex(data, subrOffset);
    font.subrs = subrIndex.objects;
    font.subrsBias = calcCFFSubroutineBias(font.subrs);
  } else {
    font.subrs = [];
    font.subrsBias = 0;
  }
  let charset;
  if (topDict.charset <= 2) {
    charset = [".notdef"];
    for (let gi = 1; gi < font.nGlyphs; gi++) {
      charset.push(cffStandardStrings[gi] || `sid${gi}`);
    }
  } else {
    charset = parseCFFCharset(data, start + topDict.charset, font.nGlyphs, stringIndex.objects);
  }
  font.tables.cff.charset = charset;
  if (topDict.encoding === 0) {
    font.cffEncoding = new CffEncoding(cffStandardEncoding, charset);
  } else if (topDict.encoding === 1) {
    font.cffEncoding = new CffEncoding(cffExpertEncoding, charset);
  } else {
    font.cffEncoding = parseCFFEncoding(data, start + topDict.encoding, charset, stringIndex.objects);
  }
  font.encoding = font.encoding || font.cffEncoding;
  font.glyphs = new GlyphSet(font);
  for (let i = 0; i < font.nGlyphs; i += 1) {
    const charString = charStringsIndex.objects[i];
    font.glyphs.push(i, cffGlyphLoader(font, i, parseCFFCharstring, charString));
  }
}
function encodeString(s, strings) {
  let sid;
  let i = cffStandardStrings.indexOf(s);
  if (i >= 0) {
    sid = i;
  }
  i = strings.indexOf(s);
  if (i >= 0) {
    sid = i + cffStandardStrings.length;
  } else {
    sid = cffStandardStrings.length + strings.length;
    strings.push(s);
  }
  return sid;
}
function makeHeader() {
  return new table.Record("Header", [
    { name: "major", type: "Card8", value: 1 },
    { name: "minor", type: "Card8", value: 0 },
    { name: "hdrSize", type: "Card8", value: 4 },
    { name: "major", type: "Card8", value: 1 }
  ]);
}
function makeNameIndex(fontNames) {
  const t = new table.Record("Name INDEX", [
    { name: "names", type: "INDEX", value: [] }
  ]);
  t.names = [];
  for (let i = 0; i < fontNames.length; i += 1) {
    t.names.push({ name: `name_${i}`, type: "NAME", value: fontNames[i] });
  }
  return t;
}
function makeDict(meta, attrs, strings) {
  const m = {};
  for (let i = 0; i < meta.length; i += 1) {
    const entry = meta[i];
    let value = attrs[entry.name];
    if (value !== void 0 && !equals(value, entry.value)) {
      if (entry.type === "SID") {
        value = encodeString(value, strings);
      }
      m[entry.op] = { name: entry.name, type: entry.type, value };
    }
  }
  return m;
}
function makeTopDict(attrs, strings) {
  const t = new table.Record("Top DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  t.dict = makeDict(TOP_DICT_META, attrs, strings);
  return t;
}
function makeTopDictIndex(topDict) {
  const t = new table.Record("Top DICT INDEX", [
    { name: "topDicts", type: "INDEX", value: [] }
  ]);
  t.topDicts = [{ name: "topDict_0", type: "TABLE", value: topDict }];
  return t;
}
function makeStringIndex(strings) {
  const t = new table.Record("String INDEX", [
    { name: "strings", type: "INDEX", value: [] }
  ]);
  t.strings = [];
  for (let i = 0; i < strings.length; i += 1) {
    t.strings.push({ name: `string_${i}`, type: "STRING", value: strings[i] });
  }
  return t;
}
function makeGlobalSubrIndex() {
  return new table.Record("Global Subr INDEX", [
    { name: "subrs", type: "INDEX", value: [] }
  ]);
}
function makeCharsets(glyphNames, strings) {
  const data = new Array(1 + glyphNames.length * 2);
  data[0] = 0;
  for (let i = 0; i < glyphNames.length; i += 1) {
    const glyphSID = encodeString(glyphNames[i], strings);
    const off = 1 + i * 2;
    data[off] = glyphSID >> 8 & 255;
    data[off + 1] = glyphSID & 255;
  }
  return new table.Record("Charsets", [
    { name: "data", type: "LITERAL", value: data }
  ]);
}
function pushNumber(d, v) {
  if (v >= -107 && v <= 107) {
    d.push(v + 139);
  } else if (v >= 108 && v <= 1131) {
    v -= 108;
    d.push((v >> 8) + 247, v & 255);
  } else if (v >= -1131 && v <= -108) {
    v = -v - 108;
    d.push((v >> 8) + 251, v & 255);
  } else if (v >= -32768 && v <= 32767) {
    d.push(28, v >> 8 & 255, v & 255);
  } else {
    d.push(29, v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255);
  }
}
function encodeGlyphToBytes(glyph) {
  const d = [];
  const path = glyph.path;
  pushNumber(d, glyph.advanceWidth);
  let x = 0;
  let y = 0;
  for (let i = 0; i < path.commands.length; i += 1) {
    let cmd = path.commands[i];
    if (cmd.type === "Q") {
      const _13 = 1 / 3;
      const _23 = 2 / 3;
      cmd = {
        type: "C",
        x: cmd.x,
        y: cmd.y,
        x1: Math.round(_13 * x + _23 * cmd.x1),
        y1: Math.round(_13 * y + _23 * cmd.y1),
        x2: Math.round(_13 * cmd.x + _23 * cmd.x1),
        y2: Math.round(_13 * cmd.y + _23 * cmd.y1)
      };
    }
    if (cmd.type === "M") {
      pushNumber(d, Math.round(cmd.x - x));
      pushNumber(d, Math.round(cmd.y - y));
      d.push(21);
      x = Math.round(cmd.x);
      y = Math.round(cmd.y);
    } else if (cmd.type === "L") {
      pushNumber(d, Math.round(cmd.x - x));
      pushNumber(d, Math.round(cmd.y - y));
      d.push(5);
      x = Math.round(cmd.x);
      y = Math.round(cmd.y);
    } else if (cmd.type === "C") {
      pushNumber(d, Math.round(cmd.x1 - x));
      pushNumber(d, Math.round(cmd.y1 - y));
      pushNumber(d, Math.round(cmd.x2 - cmd.x1));
      pushNumber(d, Math.round(cmd.y2 - cmd.y1));
      pushNumber(d, Math.round(cmd.x - cmd.x2));
      pushNumber(d, Math.round(cmd.y - cmd.y2));
      d.push(8);
      x = Math.round(cmd.x);
      y = Math.round(cmd.y);
    }
  }
  d.push(14);
  return d;
}
function makeCharStringsIndex(glyphs) {
  const t = new table.Record("CharStrings INDEX", [
    { name: "charStrings", type: "INDEX", value: [] }
  ]);
  for (let i = 0; i < glyphs.length; i += 1) {
    const glyph = glyphs.get(i);
    const bytes = encodeGlyphToBytes(glyph);
    t.charStrings.push({ name: glyph.name, type: "LITERAL", value: bytes });
  }
  return t;
}
function makePrivateDict(attrs, strings) {
  const t = new table.Record("Private DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
  return t;
}
function makeCFFTable(glyphs, options) {
  const t = new table.Table("CFF ", [
    { name: "header", type: "RECORD" },
    { name: "nameIndex", type: "RECORD" },
    { name: "topDictIndex", type: "RECORD" },
    { name: "stringIndex", type: "RECORD" },
    { name: "globalSubrIndex", type: "RECORD" },
    { name: "charsets", type: "RECORD" },
    { name: "charStringsIndex", type: "RECORD" },
    { name: "privateDict", type: "RECORD" }
  ]);
  const fontScale = 1 / options.unitsPerEm;
  const attrs = {
    version: options.version,
    fullName: options.fullName,
    familyName: options.familyName,
    weight: options.weightName,
    fontBBox: options.fontBBox || [0, 0, 0, 0],
    fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
    charset: 999,
    encoding: 0,
    charStrings: 999,
    private: [0, 999]
  };
  const privateAttrs = {};
  const glyphNames = [];
  let glyph;
  for (let i = 1; i < glyphs.length; i += 1) {
    glyph = glyphs.get(i);
    glyphNames.push(glyph.name);
  }
  const strings = [];
  t.header = makeHeader();
  t.nameIndex = makeNameIndex([options.postScriptName]);
  let topDict = makeTopDict(attrs, strings);
  t.topDictIndex = makeTopDictIndex(topDict);
  t.globalSubrIndex = makeGlobalSubrIndex();
  t.charsets = makeCharsets(glyphNames, strings);
  t.charStringsIndex = makeCharStringsIndex(glyphs);
  t.privateDict = makePrivateDict(privateAttrs, strings);
  t.stringIndex = makeStringIndex(strings);
  const startOffset = t.header.sizeOf() + t.nameIndex.sizeOf() + t.topDictIndex.sizeOf() + t.stringIndex.sizeOf() + t.globalSubrIndex.sizeOf();
  attrs.charset = startOffset;
  attrs.encoding = 0;
  attrs.charStrings = attrs.charset + t.charsets.sizeOf();
  attrs.private[1] = attrs.charStrings + t.charStringsIndex.sizeOf();
  topDict = makeTopDict(attrs, strings);
  t.topDictIndex = makeTopDictIndex(topDict);
  return t;
}
function decryptCharstring(encrypted, lenIV) {
  const decrypted = new Uint8Array(encrypted.length);
  let R = 4330;
  for (let i = 0; i < encrypted.length; i++) {
    const cipher = encrypted[i];
    decrypted[i] = cipher ^ R >> 8;
    R = (cipher + R) * 52845 + 22719 & 65535;
  }
  return decrypted.subarray(lenIV);
}
function interpretCharstring(data, subrs) {
  const path = new Path();
  let advanceWidth = 0;
  let x = 0;
  let y = 0;
  let open = false;
  const stack = [];
  const psStack = [];
  let flexMode = false;
  const flexPoints = [];
  let seacData = null;
  let sbx = 0;
  function processCharstring(csData, depth) {
    if (depth > 10) return;
    let i = 0;
    while (i < csData.length) {
      const b0 = csData[i];
      if (b0 >= 32 && b0 <= 246) {
        stack.push(b0 - 139);
        i++;
      } else if (b0 >= 247 && b0 <= 250) {
        stack.push((b0 - 247) * 256 + csData[i + 1] + 108);
        i += 2;
      } else if (b0 >= 251 && b0 <= 254) {
        stack.push(-(b0 - 251) * 256 - csData[i + 1] - 108);
        i += 2;
      } else if (b0 === 255) {
        const val = csData[i + 1] << 24 | csData[i + 2] << 16 | csData[i + 3] << 8 | csData[i + 4];
        stack.push(val);
        i += 5;
      } else {
        let op = b0;
        i++;
        if (b0 === 12 && i < csData.length) {
          op = 1200 + csData[i];
          i++;
        }
        switch (op) {
          case 13:
            if (stack.length >= 2) {
              x = stack[0];
              sbx = stack[0];
              advanceWidth = stack[1];
            } else {
              advanceWidth = stack[0] || 0;
            }
            stack.length = 0;
            break;
          case 1207:
            if (stack.length >= 4) {
              x = stack[0];
              y = stack[1];
              advanceWidth = stack[2];
            } else {
              advanceWidth = stack.length >= 3 ? stack[2] : 0;
            }
            stack.length = 0;
            break;
          case 1:
          case 3:
          case 1201:
          case 1202:
            stack.length = 0;
            break;
          case 1200:
            stack.length = 0;
            break;
          case 21: {
            const dx = stack.length >= 2 ? stack[stack.length - 2] : 0;
            const dy = stack.length >= 2 ? stack[stack.length - 1] : 0;
            x += dx;
            y += dy;
            if (flexMode) {
              flexPoints.push({ x, y });
            } else {
              if (open) path.close();
              path.moveTo(x, y);
              open = true;
            }
            stack.length = 0;
            break;
          }
          case 22: {
            const dx = stack.length >= 1 ? stack[stack.length - 1] : 0;
            x += dx;
            if (flexMode) {
              flexPoints.push({ x, y });
            } else {
              if (open) path.close();
              path.moveTo(x, y);
              open = true;
            }
            stack.length = 0;
            break;
          }
          case 4: {
            const dy = stack.length >= 1 ? stack[stack.length - 1] : 0;
            y += dy;
            if (flexMode) {
              flexPoints.push({ x, y });
            } else {
              if (open) path.close();
              path.moveTo(x, y);
              open = true;
            }
            stack.length = 0;
            break;
          }
          case 5:
            for (let si = 0; si + 1 < stack.length; si += 2) {
              x += stack[si];
              y += stack[si + 1];
              path.lineTo(x, y);
            }
            stack.length = 0;
            break;
          case 6: {
            const dx = stack.length >= 1 ? stack[stack.length - 1] : 0;
            x += dx;
            path.lineTo(x, y);
            stack.length = 0;
            break;
          }
          case 7: {
            const dy = stack.length >= 1 ? stack[stack.length - 1] : 0;
            y += dy;
            path.lineTo(x, y);
            stack.length = 0;
            break;
          }
          case 8:
            if (stack.length >= 6) {
              const x1 = x + stack[0];
              const y1 = y + stack[1];
              const x2 = x1 + stack[2];
              const y2 = y1 + stack[3];
              x = x2 + stack[4];
              y = y2 + stack[5];
              path.curveTo(x1, y1, x2, y2, x, y);
            }
            stack.length = 0;
            break;
          case 30:
            if (stack.length >= 4) {
              const x1 = x;
              const y1 = y + stack[0];
              const x2 = x1 + stack[1];
              const y2 = y1 + stack[2];
              x = x2 + stack[3];
              y = y2;
              path.curveTo(x1, y1, x2, y2, x, y);
            }
            stack.length = 0;
            break;
          case 31:
            if (stack.length >= 4) {
              const x1 = x + stack[0];
              const y1 = y;
              const x2 = x1 + stack[1];
              const y2 = y1 + stack[2];
              x = x2;
              y = y2 + stack[3];
              path.curveTo(x1, y1, x2, y2, x, y);
            }
            stack.length = 0;
            break;
          case 9:
            if (open) {
              path.close();
              open = false;
            }
            stack.length = 0;
            break;
          case 14:
            if (open) {
              path.close();
              open = false;
            }
            stack.length = 0;
            return;
          case 10: {
            const subrIdx = stack.pop();
            if (subrIdx !== void 0 && subrs[subrIdx]) {
              processCharstring(subrs[subrIdx], depth + 1);
            }
            break;
          }
          case 11:
            return;
          case 1212: {
            const b = stack.pop();
            const a = stack.pop();
            if (a !== void 0 && b !== void 0 && b !== 0) stack.push(Math.round(a / b));
            else stack.push(0);
            break;
          }
          case 1206: {
            if (stack.length >= 5) {
              seacData = {
                asb: stack[stack.length - 5],
                adx: stack[stack.length - 4],
                ady: stack[stack.length - 3],
                bchar: stack[stack.length - 2],
                achar: stack[stack.length - 1]
              };
            }
            stack.length = 0;
            if (open) {
              path.close();
              open = false;
            }
            return;
          }
          case 1216: {
            const otherSubrIdx = stack.pop();
            const nArgs = stack.pop() || 0;
            const psArgs = [];
            for (let a = 0; a < nArgs; a++) psArgs.unshift(stack.pop() || 0);
            if (otherSubrIdx === 1) {
              flexMode = true;
              flexPoints.length = 0;
              flexPoints.push({ x, y });
            } else if (otherSubrIdx === 0 && flexMode) {
              if (flexPoints.length >= 8) {
                const p = flexPoints;
                path.curveTo(p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
                path.curveTo(p[4].x, p[4].y, p[5].x, p[5].y, p[6].x, p[6].y);
              }
              flexMode = false;
              if (psArgs.length >= 3) {
                psStack.push(psArgs[2]);
                psStack.push(psArgs[1]);
              }
            } else {
              for (let a = psArgs.length - 1; a >= 0; a--) psStack.push(psArgs[a]);
            }
            break;
          }
          case 1217:
            if (psStack.length > 0) stack.push(psStack.pop());
            break;
          case 1233: {
            if (stack.length >= 2) {
              x = stack[stack.length - 2];
              y = stack[stack.length - 1];
            }
            stack.length = 0;
            break;
          }
          default:
            stack.length = 0;
            break;
        }
      }
    }
  }
  processCharstring(data, 0);
  if (open) path.close();
  return {
    path,
    advanceWidth,
    seac: seacData,
    sbx
  };
}
function parseType1Font(pfaBytes) {
  try {
    let pfaText = "";
    for (let i = 0; i < pfaBytes.length; i += 16384) {
      pfaText += String.fromCharCode.apply(null, Array.from(pfaBytes.subarray(i, Math.min(i + 16384, pfaBytes.length))));
    }
    const eexecIdx = pfaText.indexOf("currentfile eexec");
    if (eexecIdx === -1) return null;
    let hexStart = eexecIdx + "currentfile eexec".length;
    while (hexStart < pfaText.length && (pfaText[hexStart] === "\n" || pfaText[hexStart] === "\r" || pfaText[hexStart] === " ")) hexStart++;
    const sampleLen = Math.min(20, pfaText.length - hexStart);
    const isHex = /^[0-9A-Fa-f\s]+$/.test(pfaText.substring(hexStart, hexStart + sampleLen));
    let eexecBytes;
    if (isHex) {
      const hexStr = pfaText.substring(hexStart).replace(/\s/g, "");
      const zeroRun = hexStr.indexOf("0000000000");
      const cleanHex = zeroRun > 0 ? hexStr.substring(0, zeroRun) : hexStr;
      eexecBytes = new Uint8Array(cleanHex.length >> 1);
      for (let i = 0; i < eexecBytes.length; i++) {
        eexecBytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
      }
    } else {
      eexecBytes = pfaBytes.subarray(hexStart);
    }
    const decrypted = new Uint8Array(eexecBytes.length);
    let R = 55665;
    for (let i = 0; i < eexecBytes.length; i++) {
      const cipher = eexecBytes[i];
      decrypted[i] = cipher ^ R >> 8;
      R = (cipher + R) * 52845 + 22719 & 65535;
    }
    const decSub = decrypted.subarray(4);
    let privateText = "";
    for (let i = 0; i < decSub.length; i += 16384) {
      privateText += String.fromCharCode.apply(null, Array.from(decSub.subarray(i, Math.min(i + 16384, decSub.length))));
    }
    const lenIVMatch = privateText.match(/\/lenIV\s+(\d+)/);
    const lenIV = lenIVMatch ? Number(lenIVMatch[1]) : 4;
    const rdOp = /-\|\s*\{string/.test(privateText) ? "-\\|" : "RD";
    const subrs = [];
    const subrsMatch = privateText.match(/\/Subrs\s+(\d+)\s+array/);
    if (subrsMatch) {
      const nSubrs = Number(subrsMatch[1]);
      let sPos = subrsMatch.index + subrsMatch[0].length;
      const subrRegex = new RegExp(`dup\\s+(\\d+)\\s+(\\d+)\\s+${rdOp}\\s`);
      for (let s = 0; s < nSubrs; s++) {
        const dupMatch = subrRegex.exec(privateText.substring(sPos));
        if (!dupMatch) break;
        const subrIdx = Number(dupMatch[1]);
        const subrLen = Number(dupMatch[2]);
        const dataStart = sPos + dupMatch.index + dupMatch[0].length;
        const csBytes = decrypted.subarray(4 + dataStart, 4 + dataStart + subrLen);
        const csDecrypted = decryptCharstring(csBytes, lenIV);
        if (subrIdx >= 0 && subrIdx < nSubrs) subrs[subrIdx] = csDecrypted;
        sPos = dataStart + subrLen;
      }
    }
    const charStringsMatch = privateText.match(/\/CharStrings\s+(\d+)\s+dict/);
    if (!charStringsMatch) return null;
    const csPos = charStringsMatch.index + charStringsMatch[0].length;
    const csRegex = new RegExp(`\\/(\\S+)\\s+(\\d+)\\s+${rdOp}\\s`, "g");
    csRegex.lastIndex = csPos;
    const glyphs = /* @__PURE__ */ new Map();
    for (let csMatch = csRegex.exec(privateText); csMatch; csMatch = csRegex.exec(privateText)) {
      const glyphName = csMatch[1];
      const csLen = Number(csMatch[2]);
      const dataStart = csMatch.index + csMatch[0].length;
      const csBytes = decrypted.subarray(4 + dataStart, 4 + dataStart + csLen);
      const csDecrypted = decryptCharstring(csBytes, lenIV);
      const result = interpretCharstring(csDecrypted, subrs);
      glyphs.set(glyphName, result);
      csRegex.lastIndex = dataStart + csLen;
    }
    if (glyphs.size === 0) return null;
    for (const [, result] of glyphs) {
      if (!result.seac) continue;
      const {
        adx,
        ady,
        bchar,
        achar
      } = result.seac;
      const baseName = cffStandardEncoding[bchar] || "";
      const accentName = cffStandardEncoding[achar] || "";
      const baseGlyph = baseName ? glyphs.get(baseName) : null;
      const accentGlyph = accentName ? glyphs.get(accentName) : null;
      if (!baseGlyph || !accentGlyph) continue;
      const accentOffsetX = adx - (accentGlyph.sbx || 0);
      const accentOffsetY = ady;
      const composedPath = new Path();
      for (const cmd of baseGlyph.path.commands) {
        composedPath.commands.push({ ...cmd });
      }
      for (const cmd of accentGlyph.path.commands) {
        const shifted = { ...cmd };
        if (shifted.type === "M" || shifted.type === "L") {
          shifted.x += accentOffsetX;
          shifted.y += accentOffsetY;
        } else if (shifted.type === "C") {
          shifted.x1 += accentOffsetX;
          shifted.y1 += accentOffsetY;
          shifted.x2 += accentOffsetX;
          shifted.y2 += accentOffsetY;
          shifted.x += accentOffsetX;
          shifted.y += accentOffsetY;
        } else if (shifted.type === "Q") {
          shifted.x1 += accentOffsetX;
          shifted.y1 += accentOffsetY;
          shifted.x += accentOffsetX;
          shifted.y += accentOffsetY;
        }
        composedPath.commands.push(shifted);
      }
      result.path = composedPath;
    }
    const encoding = /* @__PURE__ */ new Map();
    const encMatch = pfaText.match(/\/Encoding\s+\d+\s+array/);
    if (encMatch) {
      const encRegex = /dup\s+(\d+)\s+\/(\S+)\s+put/g;
      encRegex.lastIndex = encMatch.index;
      for (let em = encRegex.exec(pfaText); em; em = encRegex.exec(pfaText)) {
        if (em.index > encMatch.index + 5e3) break;
        const code = Number(em[1]);
        const name = em[2];
        if (glyphs.has(name)) encoding.set(code, name);
      }
    }
    const fontNameMatch = pfaText.match(/\/FontName\s+\/(\S+)/);
    const fontName = fontNameMatch ? fontNameMatch[1] : "Type1Font";
    const fmMatch = pfaText.match(/\/FontMatrix\s*\[([^\]]+)\]/);
    const fontMatrix = fmMatch ? fmMatch[1].trim().split(/\s+/).map(Number) : null;
    return {
      glyphs,
      encoding,
      fontName,
      fontMatrix
    };
  } catch (_e) {
    return null;
  }
}
function parseCmapTableFormat0(cmap, p, platformID, encodingID) {
  cmap.length = p.parseUShort();
  cmap.language = p.parseUShort() - 1;
  const indexMap = p.parseByteList(cmap.length);
  const glyphIndexMap = { ...indexMap };
  cmap.byteToGlyphIndex = indexMap.slice(0, 256);
  const encoding = getEncoding(platformID, encodingID, cmap.language);
  const decodingTable = eightBitMacEncodings[encoding];
  for (let i = 0; i < decodingTable.length; i++) {
    glyphIndexMap[decodingTable.charCodeAt(i)] = indexMap[128 + i];
  }
  cmap.glyphIndexMap = glyphIndexMap;
}
function parseCmapTableFormat12or13(cmap, p, format) {
  p.parseUShort();
  cmap.length = p.parseULong();
  cmap.language = p.parseULong();
  let groupCount;
  cmap.groupCount = groupCount = p.parseULong();
  cmap.glyphIndexMap = {};
  for (let i = 0; i < groupCount; i += 1) {
    const startCharCode = p.parseULong();
    const endCharCode = p.parseULong();
    let startGlyphId = p.parseULong();
    for (let c = startCharCode; c <= endCharCode; c += 1) {
      cmap.glyphIndexMap[c] = startGlyphId;
      if (format === 12) {
        startGlyphId++;
      }
    }
  }
}
function parseCmapTableFormat4(cmap, p, data, start, offset) {
  cmap.length = p.parseUShort();
  cmap.language = p.parseUShort();
  let segCount;
  cmap.segCount = segCount = p.parseUShort() >> 1;
  p.skip("uShort", 3);
  cmap.glyphIndexMap = {};
  const endCountParser = new parse.Parser(data, start + offset + 14);
  const startCountParser = new parse.Parser(data, start + offset + 16 + segCount * 2);
  const idDeltaParser = new parse.Parser(data, start + offset + 16 + segCount * 4);
  const idRangeOffsetParser = new parse.Parser(data, start + offset + 16 + segCount * 6);
  let glyphIndexOffset = start + offset + 16 + segCount * 8;
  for (let i = 0; i < segCount - 1; i += 1) {
    let glyphIndex;
    const endCount = endCountParser.parseUShort();
    const startCount = startCountParser.parseUShort();
    const idDelta = idDeltaParser.parseShort();
    const idRangeOffset = idRangeOffsetParser.parseUShort();
    for (let c = startCount; c <= endCount; c += 1) {
      if (idRangeOffset !== 0) {
        glyphIndexOffset = idRangeOffsetParser.offset + idRangeOffsetParser.relativeOffset - 2;
        glyphIndexOffset += idRangeOffset;
        glyphIndexOffset += (c - startCount) * 2;
        glyphIndex = parse.getUShort(data, glyphIndexOffset);
        if (glyphIndex !== 0) {
          glyphIndex = glyphIndex + idDelta & 65535;
        }
      } else {
        glyphIndex = c + idDelta & 65535;
      }
      cmap.glyphIndexMap[c] = glyphIndex;
    }
  }
}
function parseCmapTableFormat6(cmap, p, platformID, encodingID) {
  cmap.length = p.parseUShort();
  cmap.language = p.parseUShort();
  const firstCode = p.parseUShort();
  const entryCount = p.parseUShort();
  const glyphIndexMap = {};
  for (let i = 0; i < entryCount; i++) {
    glyphIndexMap[firstCode + i] = p.parseUShort();
  }
  if (platformID === 1) {
    cmap.byteToGlyphIndex = Array.from({ length: 256 }, (_, c) => glyphIndexMap[c] || 0);
    const encoding = getEncoding(platformID, encodingID, cmap.language);
    const decodingTable = eightBitMacEncodings[encoding];
    if (decodingTable) {
      for (let i = 0; i < decodingTable.length; i++) {
        const macCharCode = 128 + i;
        if (glyphIndexMap[macCharCode] !== void 0) {
          glyphIndexMap[decodingTable.charCodeAt(i)] = glyphIndexMap[macCharCode];
        }
      }
    }
  }
  cmap.glyphIndexMap = glyphIndexMap;
}
function parseCmapTable(data, start) {
  const cmap = {};
  cmap.version = parse.getUShort(data, start);
  check.argument(cmap.version === 0, "cmap table version should be 0.");
  cmap.numTables = parse.getUShort(data, start + 2);
  let format14Parser = null;
  let format14offset = -1;
  let offset = -1;
  let platformId = null;
  let encodingId = null;
  const platform0Encodings = [0, 1, 2, 3, 4, 6];
  const platform3Encodings = [0, 1, 10];
  let bestPriority = -1;
  for (let i = cmap.numTables - 1; i >= 0; i -= 1) {
    const curPlatformId = parse.getUShort(data, start + 4 + i * 8);
    const curEncodingId = parse.getUShort(data, start + 4 + i * 8 + 2);
    if (curPlatformId === 3 && platform3Encodings.includes(curEncodingId) || curPlatformId === 0 && platform0Encodings.includes(curEncodingId) || curPlatformId === 1 && curEncodingId === 0) {
      const priority = curPlatformId === 3 ? 2 : curPlatformId === 0 ? 1 : 0;
      if (priority < bestPriority) continue;
      if (priority === bestPriority && offset > 0) continue;
      offset = parse.getULong(data, start + 4 + i * 8 + 4);
      platformId = curPlatformId;
      encodingId = curEncodingId;
      bestPriority = priority;
      if (format14Parser && bestPriority >= 1) {
        break;
      }
    } else if (curPlatformId === 0 && curEncodingId === 5) {
      format14offset = parse.getULong(data, start + 4 + i * 8 + 4);
      format14Parser = new parse.Parser(data, start + format14offset);
      if (format14Parser.parseUShort() !== 14) {
        format14offset = -1;
        format14Parser = null;
      } else if (offset > 0 && bestPriority >= 1) {
        break;
      }
    }
  }
  if (offset === -1) {
    throw new Error("No valid cmap sub-tables found.");
  }
  cmap.platformID = platformId;
  cmap.encodingID = encodingId;
  const p = new parse.Parser(data, start + offset);
  cmap.format = p.parseUShort();
  if (cmap.format === 0) {
    parseCmapTableFormat0(cmap, p, platformId, encodingId);
  } else if (cmap.format === 12 || cmap.format === 13) {
    parseCmapTableFormat12or13(cmap, p, cmap.format);
  } else if (cmap.format === 4) {
    parseCmapTableFormat4(cmap, p, data, start, offset);
  } else if (cmap.format === 6) {
    parseCmapTableFormat6(cmap, p, platformId, encodingId);
  } else {
    throw new Error(
      `Only format 0, 4, 6, 12 and 14 cmap tables are supported (found format ${cmap.format}, platformId ${platformId}, encodingId ${encodingId}).`
    );
  }
  return cmap;
}
function writeUint16(d, pos, v) {
  d[pos] = v >> 8 & 255;
  d[pos + 1] = v & 255;
}
function writeInt16(d, pos, v) {
  if (v < 0) {
    v += 65536;
  }
  d[pos] = v >> 8 & 255;
  d[pos + 1] = v & 255;
}
function writeUint32(d, pos, v) {
  d[pos] = v >> 24 & 255;
  d[pos + 1] = v >> 16 & 255;
  d[pos + 2] = v >> 8 & 255;
  d[pos + 3] = v & 255;
}
function makeCmapTable(glyphs) {
  let needFormat12 = false;
  let i;
  for (i = glyphs.length - 1; i > 0; i -= 1) {
    const g = glyphs.get(i);
    if (g.unicode > 65535) {
      needFormat12 = true;
      break;
    }
  }
  const rawEntries = [];
  for (i = 0; i < glyphs.length; i += 1) {
    const glyph = glyphs.get(i);
    for (let j = 0; j < glyph.unicodes.length; j += 1) {
      rawEntries.push({ unicode: glyph.unicodes[j], glyphIndex: i });
    }
  }
  rawEntries.sort((a, b) => a.unicode - b.unicode);
  const bmpSegments = [];
  for (const e of rawEntries) {
    if (e.unicode > 65535) {
      continue;
    }
    const last = bmpSegments[bmpSegments.length - 1];
    if (last && last.end === e.unicode - 1 && last.endGid === e.glyphIndex - 1) {
      last.end = e.unicode;
      last.endGid = e.glyphIndex;
    } else {
      bmpSegments.push({
        start: e.unicode,
        end: e.unicode,
        startGid: e.glyphIndex,
        endGid: e.glyphIndex
      });
    }
  }
  const cmap4Segments = bmpSegments.map((s) => ({
    start: s.start,
    end: s.end,
    delta: s.startGid - s.start,
    offset: 0
  }));
  cmap4Segments.push({
    start: 65535,
    end: 65535,
    delta: 1,
    offset: 0
  });
  const segCount4 = cmap4Segments.length;
  const cmap4Length = 14 + segCount4 * 2 * 4 + 2;
  const cmap4Overflows = cmap4Length > 65535 || segCount4 * 2 > 65535;
  const useFormat12Only = cmap4Overflows;
  const emitFormat12 = needFormat12 || useFormat12Only;
  const cmap12Groups = [];
  if (emitFormat12) {
    for (const e of rawEntries) {
      const last = cmap12Groups[cmap12Groups.length - 1];
      if (last && last.end === e.unicode - 1 && last.glyphIndex + (last.end - last.start) + 1 === e.glyphIndex) {
        last.end = e.unicode;
      } else {
        cmap12Groups.push({ start: e.unicode, end: e.unicode, glyphIndex: e.glyphIndex });
      }
    }
  }
  const numEncodingRecords = useFormat12Only ? 1 : emitFormat12 ? 2 : 1;
  const headerSize = 4 + numEncodingRecords * 8;
  const segCountX2 = segCount4 * 2;
  const searchRange2 = 2 ** Math.floor(Math.log(segCount4) / Math.log(2)) * 2;
  const entrySelector = Math.log(searchRange2 / 2) / Math.log(2);
  const rangeShift = segCountX2 - searchRange2;
  const cmap4Offset = headerSize;
  const cmap12Length = emitFormat12 ? 16 + cmap12Groups.length * 12 : 0;
  const cmap12Offset = useFormat12Only ? headerSize : cmap4Offset + cmap4Length;
  const totalSize = headerSize + (useFormat12Only ? 0 : cmap4Length) + cmap12Length;
  const d = new Array(totalSize);
  let p = 0;
  writeUint16(d, p, 0);
  p += 2;
  writeUint16(d, p, numEncodingRecords);
  p += 2;
  if (!useFormat12Only) {
    writeUint16(d, p, 3);
    p += 2;
    writeUint16(d, p, 1);
    p += 2;
    writeUint32(d, p, cmap4Offset);
    p += 4;
  }
  if (emitFormat12) {
    writeUint16(d, p, 3);
    p += 2;
    writeUint16(d, p, 10);
    p += 2;
    writeUint32(d, p, cmap12Offset);
    p += 4;
  }
  if (!useFormat12Only) {
    writeUint16(d, p, 4);
    p += 2;
    writeUint16(d, p, cmap4Length);
    p += 2;
    writeUint16(d, p, 0);
    p += 2;
    writeUint16(d, p, segCountX2);
    p += 2;
    writeUint16(d, p, searchRange2);
    p += 2;
    writeUint16(d, p, entrySelector);
    p += 2;
    writeUint16(d, p, rangeShift);
    p += 2;
    for (i = 0; i < segCount4; i += 1) {
      writeUint16(d, p, cmap4Segments[i].end);
      p += 2;
    }
    writeUint16(d, p, 0);
    p += 2;
    for (i = 0; i < segCount4; i += 1) {
      writeUint16(d, p, cmap4Segments[i].start);
      p += 2;
    }
    for (i = 0; i < segCount4; i += 1) {
      writeInt16(d, p, cmap4Segments[i].delta);
      p += 2;
    }
    for (i = 0; i < segCount4; i += 1) {
      writeUint16(d, p, cmap4Segments[i].offset);
      p += 2;
    }
  }
  if (emitFormat12) {
    const nGroups12 = cmap12Groups.length;
    writeUint16(d, p, 12);
    p += 2;
    writeUint16(d, p, 0);
    p += 2;
    writeUint32(d, p, cmap12Length);
    p += 4;
    writeUint32(d, p, 0);
    p += 4;
    writeUint32(d, p, nGroups12);
    p += 4;
    for (i = 0; i < nGroups12; i += 1) {
      writeUint32(d, p, cmap12Groups[i].start);
      p += 4;
      writeUint32(d, p, cmap12Groups[i].end);
      p += 4;
      writeUint32(d, p, cmap12Groups[i].glyphIndex);
      p += 4;
    }
  }
  return new table.Table("cmap", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseColrTable(data, start) {
  const p = new Parser(data, start);
  const version = p.parseUShort();
  check.argument(version === 0, "Only COLRv0 supported.");
  const numBaseGlyphRecords = p.parseUShort();
  const baseGlyphRecordsOffset = p.parseOffset32();
  const layerRecordsOffset = p.parseOffset32();
  const numLayerRecords = p.parseUShort();
  p.relativeOffset = baseGlyphRecordsOffset;
  const baseGlyphRecords = p.parseRecordList(numBaseGlyphRecords, {
    glyphID: Parser.uShort,
    firstLayerIndex: Parser.uShort,
    numLayers: Parser.uShort
  });
  p.relativeOffset = layerRecordsOffset;
  const layerRecords = p.parseRecordList(numLayerRecords, {
    glyphID: Parser.uShort,
    paletteIndex: Parser.uShort
  });
  return { version, baseGlyphRecords, layerRecords };
}
function makeColrTable({ version = 0, baseGlyphRecords = [], layerRecords = [] }) {
  check.argument(version === 0, "Only COLRv0 supported.");
  const baseGlyphRecordsOffset = 14;
  const layerRecordsOffset = baseGlyphRecordsOffset + baseGlyphRecords.length * 6;
  const totalSize = 14 + baseGlyphRecords.length * 6 + layerRecords.length * 4;
  const d = new Array(totalSize);
  let p = 0;
  writeUint16(d, p, version);
  p += 2;
  writeUint16(d, p, baseGlyphRecords.length);
  p += 2;
  writeUint32(d, p, baseGlyphRecordsOffset);
  p += 4;
  writeUint32(d, p, layerRecordsOffset);
  p += 4;
  writeUint16(d, p, layerRecords.length);
  p += 2;
  for (let i = 0; i < baseGlyphRecords.length; i++) {
    writeUint16(d, p, baseGlyphRecords[i].glyphID);
    p += 2;
    writeUint16(d, p, baseGlyphRecords[i].firstLayerIndex);
    p += 2;
    writeUint16(d, p, baseGlyphRecords[i].numLayers);
    p += 2;
  }
  for (let i = 0; i < layerRecords.length; i++) {
    writeUint16(d, p, layerRecords[i].glyphID);
    p += 2;
    writeUint16(d, p, layerRecords[i].paletteIndex);
    p += 2;
  }
  return new table.Table("COLR", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseCpalTable(data, start) {
  const p = new Parser(data, start);
  const version = p.parseShort();
  const numPaletteEntries = p.parseShort();
  const numPalettes = p.parseShort();
  const numColorRecords = p.parseShort();
  const colorRecordsArrayOffset = p.parseOffset32();
  const colorRecordIndices = p.parseUShortList(numPalettes);
  p.relativeOffset = colorRecordsArrayOffset;
  const colorRecords = p.parseULongList(numColorRecords);
  return {
    version,
    numPaletteEntries,
    colorRecords,
    colorRecordIndices
  };
}
function makeCpalTable({
  version = 0,
  numPaletteEntries = 0,
  colorRecords = [],
  colorRecordIndices = [0]
}) {
  check.argument(version === 0, "Only CPALv0 are supported.");
  check.argument(colorRecords.length, "No colorRecords given.");
  check.argument(colorRecordIndices.length, "No colorRecordIndices given.");
  if (colorRecordIndices.length > 1) {
    check.argument(numPaletteEntries, "Can't infer numPaletteEntries on multiple colorRecordIndices");
  }
  const totalSize = 12 + colorRecordIndices.length * 2 + colorRecords.length * 4;
  const d = new Array(totalSize);
  let p = 0;
  writeUint16(d, p, version);
  p += 2;
  writeUint16(d, p, numPaletteEntries || colorRecords.length);
  p += 2;
  writeUint16(d, p, colorRecordIndices.length);
  p += 2;
  writeUint16(d, p, colorRecords.length);
  p += 2;
  writeUint32(d, p, 12 + 2 * colorRecordIndices.length);
  p += 4;
  for (let i = 0; i < colorRecordIndices.length; i++) {
    writeUint16(d, p, colorRecordIndices[i]);
    p += 2;
  }
  for (let i = 0; i < colorRecords.length; i++) {
    writeUint32(d, p, colorRecords[i]);
    p += 4;
  }
  return new table.Table("CPAL", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseGlyphCoordinate(p, flag, previousValue, shortVectorBitMask, sameBitMask) {
  let v;
  if ((flag & shortVectorBitMask) > 0) {
    v = p.parseByte();
    if ((flag & sameBitMask) === 0) {
      v = -v;
    }
    v = previousValue + v;
  } else {
    if ((flag & sameBitMask) > 0) {
      v = previousValue;
    } else {
      v = previousValue + p.parseShort();
    }
  }
  return v;
}
function parseGlyph(glyph, data, start) {
  const p = new parse.Parser(data, start);
  glyph.numberOfContours = p.parseShort();
  glyph._xMin = p.parseShort();
  glyph._yMin = p.parseShort();
  glyph._xMax = p.parseShort();
  glyph._yMax = p.parseShort();
  let flags;
  let flag;
  if (glyph.numberOfContours > 0) {
    const endPointIndices = glyph.endPointIndices = [];
    for (let i = 0; i < glyph.numberOfContours; i += 1) {
      endPointIndices.push(p.parseUShort());
    }
    glyph.instructionLength = p.parseUShort();
    glyph.instructions = [];
    for (let i = 0; i < glyph.instructionLength; i += 1) {
      glyph.instructions.push(p.parseByte());
    }
    const numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1;
    flags = [];
    for (let i = 0; i < numberOfCoordinates; i += 1) {
      flag = p.parseByte();
      flags.push(flag);
      if ((flag & 8) > 0) {
        const repeatCount = p.parseByte();
        for (let j = 0; j < repeatCount; j += 1) {
          flags.push(flag);
          i += 1;
        }
      }
    }
    check.argument(flags.length === numberOfCoordinates, "Bad flags.");
    if (endPointIndices.length > 0) {
      const points = [];
      let point;
      if (numberOfCoordinates > 0) {
        for (let i = 0; i < numberOfCoordinates; i += 1) {
          flag = flags[i];
          point = {};
          point.onCurve = !!(flag & 1);
          point.lastPointOfContour = endPointIndices.indexOf(i) >= 0;
          points.push(point);
        }
        let px = 0;
        for (let i = 0; i < numberOfCoordinates; i += 1) {
          flag = flags[i];
          point = points[i];
          point.x = parseGlyphCoordinate(p, flag, px, 2, 16);
          px = point.x;
        }
        let py = 0;
        for (let i = 0; i < numberOfCoordinates; i += 1) {
          flag = flags[i];
          point = points[i];
          point.y = parseGlyphCoordinate(p, flag, py, 4, 32);
          py = point.y;
        }
      }
      glyph.points = points;
    } else {
      glyph.points = [];
    }
  } else if (glyph.numberOfContours === 0) {
    glyph.points = [];
  } else {
    glyph.isComposite = true;
    glyph.points = [];
    glyph.components = [];
    let moreComponents = true;
    while (moreComponents) {
      flags = p.parseUShort();
      const component = {
        glyphIndex: p.parseUShort(),
        xScale: 1,
        scale01: 0,
        scale10: 0,
        yScale: 1,
        dx: 0,
        dy: 0
      };
      if ((flags & 1) > 0) {
        if ((flags & 2) > 0) {
          component.dx = p.parseShort();
          component.dy = p.parseShort();
        } else {
          component.matchedPoints = [p.parseUShort(), p.parseUShort()];
        }
      } else {
        if ((flags & 2) > 0) {
          component.dx = p.parseChar();
          component.dy = p.parseChar();
        } else {
          component.matchedPoints = [p.parseByte(), p.parseByte()];
        }
      }
      if ((flags & 8) > 0) {
        component.xScale = component.yScale = p.parseF2Dot14();
      } else if ((flags & 64) > 0) {
        component.xScale = p.parseF2Dot14();
        component.yScale = p.parseF2Dot14();
      } else if ((flags & 128) > 0) {
        component.xScale = p.parseF2Dot14();
        component.scale01 = p.parseF2Dot14();
        component.scale10 = p.parseF2Dot14();
        component.yScale = p.parseF2Dot14();
      }
      component.flags = flags;
      glyph.components.push(component);
      moreComponents = !!(flags & 32);
    }
    if (flags & 256) {
      glyph.instructionLength = p.parseUShort();
      glyph.instructions = [];
      for (let i = 0; i < glyph.instructionLength; i += 1) {
        glyph.instructions.push(p.parseByte());
      }
    }
  }
}
function transformPoints(points, transform) {
  const newPoints = [];
  for (let i = 0; i < points.length; i += 1) {
    const pt = points[i];
    const newPt = {
      x: transform.xScale * pt.x + transform.scale10 * pt.y + transform.dx,
      y: transform.scale01 * pt.x + transform.yScale * pt.y + transform.dy,
      onCurve: pt.onCurve,
      lastPointOfContour: pt.lastPointOfContour
    };
    newPoints.push(newPt);
  }
  return newPoints;
}
function getContours(points) {
  const contours = [];
  let currentContour = [];
  for (let i = 0; i < points.length; i += 1) {
    const pt = points[i];
    currentContour.push(pt);
    if (pt.lastPointOfContour) {
      contours.push(currentContour);
      currentContour = [];
    }
  }
  check.argument(currentContour.length === 0, "There are still points left in the current contour.");
  return contours;
}
function getPath(points) {
  const p = new Path();
  if (!points) {
    return p;
  }
  const contours = getContours(points);
  for (let contourIndex = 0; contourIndex < contours.length; ++contourIndex) {
    const contour = contours[contourIndex];
    let curr = contour[contour.length - 1];
    let next = contour[0];
    if (curr.onCurve) {
      p.moveTo(curr.x, curr.y);
    } else if (next.onCurve) {
      p.moveTo(next.x, next.y);
    } else {
      const start = { x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5 };
      p.moveTo(start.x, start.y);
    }
    for (let i = 0; i < contour.length; ++i) {
      curr = next;
      next = contour[(i + 1) % contour.length];
      if (curr.onCurve) {
        p.lineTo(curr.x, curr.y);
      } else {
        let next2 = next;
        if (!next.onCurve) {
          next2 = { x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5 };
        }
        p.quadraticCurveTo(curr.x, curr.y, next2.x, next2.y);
      }
    }
    p.closePath();
  }
  return p;
}
function buildPath(glyphs, glyph) {
  if (glyph.isComposite) {
    for (let j = 0; j < glyph.components.length; j += 1) {
      const component = glyph.components[j];
      const componentGlyph = glyphs.get(component.glyphIndex);
      if (!componentGlyph) continue;
      componentGlyph.getPath();
      if (componentGlyph.points) {
        let transformedPoints;
        if (component.matchedPoints === void 0) {
          transformedPoints = transformPoints(componentGlyph.points, component);
        } else {
          if (component.matchedPoints[0] > glyph.points.length - 1 || component.matchedPoints[1] > componentGlyph.points.length - 1) {
            throw Error(`Matched points out of range in ${glyph.name}`);
          }
          const firstPt = glyph.points[component.matchedPoints[0]];
          let secondPt = componentGlyph.points[component.matchedPoints[1]];
          const transform = {
            xScale: component.xScale,
            scale01: component.scale01,
            scale10: component.scale10,
            yScale: component.yScale,
            dx: 0,
            dy: 0
          };
          secondPt = transformPoints([secondPt], transform)[0];
          transform.dx = firstPt.x - secondPt.x;
          transform.dy = firstPt.y - secondPt.y;
          transformedPoints = transformPoints(componentGlyph.points, transform);
        }
        glyph.points = glyph.points.concat(transformedPoints);
      }
    }
  }
  return getPath(glyph.points);
}
function parseGlyfTable(data, start, loca, font) {
  const glyphs = new GlyphSet(font);
  const numGlyphs = loca.length - 1;
  for (let i = 0; i < numGlyphs; i += 1) {
    const offset = loca[i];
    const nextOffset = loca[i + 1];
    if (offset !== nextOffset) {
      glyphs.push(i, ttfGlyphLoader(font, i, parseGlyph, data, start + offset, buildPath));
    }
  }
  glyphs.length = numGlyphs;
  return glyphs;
}
const gposSubtableParsers = new Array(10);
gposSubtableParsers[1] = function parseLookup1() {
  const start = this.offset + this.relativeOffset;
  const posformat = this.parseUShort();
  if (posformat === 1) {
    return {
      posFormat: 1,
      coverage: this.parsePointer(Parser.coverage),
      value: this.parseValueRecord()
    };
  }
  if (posformat === 2) {
    return {
      posFormat: 2,
      coverage: this.parsePointer(Parser.coverage),
      values: this.parseValueRecordList()
    };
  }
  check.assert(false, `0x${start.toString(16)}: GPOS lookup type 1 format must be 1 or 2.`);
};
gposSubtableParsers[2] = function parseLookup2() {
  const start = this.offset + this.relativeOffset;
  const posFormat = this.parseUShort();
  check.assert(posFormat === 1 || posFormat === 2, `0x${start.toString(16)}: GPOS lookup type 2 format must be 1 or 2.`);
  const coverage = this.parsePointer(Parser.coverage);
  const valueFormat1 = this.parseUShort();
  const valueFormat2 = this.parseUShort();
  if (posFormat === 1) {
    return {
      posFormat,
      coverage,
      valueFormat1,
      valueFormat2,
      pairSets: this.parseList(Parser.pointer(Parser.list(function() {
        return {
          // pairValueRecord
          secondGlyph: this.parseUShort(),
          value1: this.parseValueRecord(valueFormat1),
          value2: this.parseValueRecord(valueFormat2)
        };
      })))
    };
  }
  if (posFormat === 2) {
    const classDef1 = this.parsePointer(Parser.classDef);
    const classDef2 = this.parsePointer(Parser.classDef);
    const class1Count = this.parseUShort();
    const class2Count = this.parseUShort();
    return {
      // Class Pair Adjustment
      posFormat,
      coverage,
      valueFormat1,
      valueFormat2,
      classDef1,
      classDef2,
      class1Count,
      class2Count,
      classRecords: this.parseList(class1Count, Parser.list(class2Count, function() {
        return {
          value1: this.parseValueRecord(valueFormat1),
          value2: this.parseValueRecord(valueFormat2)
        };
      }))
    };
  }
};
gposSubtableParsers[3] = function parseLookup3() {
  return { error: "GPOS Lookup 3 not supported" };
};
gposSubtableParsers[4] = function parseLookup4() {
  return { error: "GPOS Lookup 4 not supported" };
};
gposSubtableParsers[5] = function parseLookup5() {
  return { error: "GPOS Lookup 5 not supported" };
};
gposSubtableParsers[6] = function parseLookup6() {
  return { error: "GPOS Lookup 6 not supported" };
};
gposSubtableParsers[7] = function parseLookup7() {
  return { error: "GPOS Lookup 7 not supported" };
};
gposSubtableParsers[8] = function parseLookup8() {
  return { error: "GPOS Lookup 8 not supported" };
};
gposSubtableParsers[9] = function parseLookup9() {
  return { error: "GPOS Lookup 9 not supported" };
};
function parseGposTable(data, start) {
  start = start || 0;
  const p = new Parser(data, start);
  const tableVersion = p.parseVersion(1);
  check.argument(tableVersion === 1 || tableVersion === 1.1, `Unsupported GPOS table version ${tableVersion}`);
  if (tableVersion === 1) {
    return {
      version: tableVersion,
      scripts: p.parseScriptList(),
      features: p.parseFeatureList(),
      lookups: p.parseLookupList(gposSubtableParsers)
    };
  }
  return {
    version: tableVersion,
    scripts: p.parseScriptList(),
    features: p.parseFeatureList(),
    lookups: p.parseLookupList(gposSubtableParsers),
    variations: p.parseFeatureVariationsList()
  };
}
function writeTag(d, pos, tag) {
  d[pos] = tag.charCodeAt(0);
  d[pos + 1] = tag.charCodeAt(1);
  d[pos + 2] = tag.charCodeAt(2);
  d[pos + 3] = tag.charCodeAt(3);
}
function makeGposTable(kerningPairs) {
  const kerningArray = Object.entries(kerningPairs);
  kerningArray.sort((a, b) => {
    const aLeftGlyph = parseInt(a[0].match(/\d+/)[0]);
    const aRightGlyph = parseInt(a[0].match(/\d+$/)[0]);
    const bLeftGlyph = parseInt(b[0].match(/\d+/)[0]);
    const bRightGlyph = parseInt(b[0].match(/\d+$/)[0]);
    if (aLeftGlyph < bLeftGlyph) {
      return -1;
    }
    if (aLeftGlyph > bLeftGlyph) {
      return 1;
    }
    if (aRightGlyph < bRightGlyph) {
      return -1;
    }
    return 1;
  });
  const nPairs = kerningArray.length;
  const firstGlyphs = [];
  const kerningGlyphs2 = [];
  for (let i = 0; i < nPairs; i++) {
    const firstGlyph = parseInt(kerningArray[i][0].match(/\d+/)[0]);
    const secondGlyph = parseInt(kerningArray[i][0].match(/\d+$/)[0]);
    if (firstGlyph !== firstGlyphs[firstGlyphs.length - 1]) {
      firstGlyphs.push(firstGlyph);
      kerningGlyphs2[firstGlyphs.length - 1] = [];
    }
    kerningGlyphs2[firstGlyphs.length - 1].push([secondGlyph, kerningArray[i][1]]);
  }
  let dynamicSize = 2 * firstGlyphs.length;
  for (let i = 0; i < kerningGlyphs2.length; i++) {
    dynamicSize += 2 + 4 * kerningGlyphs2[i].length;
  }
  dynamicSize += 4 + 2 * firstGlyphs.length;
  const d = new Array(dynamicSize);
  let p = 0;
  let offsetN = 10 + 2 * firstGlyphs.length;
  for (let i = 0; i < firstGlyphs.length; i++) {
    writeUint16(d, p, offsetN);
    p += 2;
    offsetN = offsetN + 2 + 4 * kerningGlyphs2[i].length;
  }
  for (let i = 0; i < kerningGlyphs2.length; i++) {
    writeUint16(d, p, kerningGlyphs2[i].length);
    p += 2;
    for (let j = 0; j < kerningGlyphs2[i].length; j++) {
      writeUint16(d, p, kerningGlyphs2[i][j][0]);
      p += 2;
      writeUint16(d, p, kerningGlyphs2[i][j][1]);
      p += 2;
    }
  }
  writeUint16(d, p, 1);
  p += 2;
  writeUint16(d, p, firstGlyphs.length);
  p += 2;
  for (let i = 0; i < firstGlyphs.length; i++) {
    writeUint16(d, p, firstGlyphs[i]);
    p += 2;
  }
  const header = new Array(72);
  let h = 0;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 10);
  h += 2;
  writeUint16(header, h, 48);
  h += 2;
  writeUint16(header, h, 62);
  h += 2;
  writeUint16(header, h, 2);
  h += 2;
  writeTag(header, h, "DFLT");
  h += 4;
  writeUint16(header, h, 14);
  h += 2;
  writeTag(header, h, "latn");
  h += 4;
  writeUint16(header, h, 26);
  h += 2;
  writeUint16(header, h, 4);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 65535);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 4);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 65535);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeTag(header, h, "kern");
  h += 4;
  writeUint16(header, h, 8);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 4);
  h += 2;
  writeUint16(header, h, 2);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 8);
  h += 2;
  writeUint16(header, h, 1);
  h += 2;
  writeUint16(header, h, 10 + 4 * firstGlyphs.length + 4 * nPairs);
  h += 2;
  writeUint16(header, h, 4);
  h += 2;
  writeUint16(header, h, 0);
  h += 2;
  writeUint16(header, h, firstGlyphs.length);
  h += 2;
  return new table.Table("GPOS", [
    { name: "header", type: "LITERAL", value: header },
    { name: "data", type: "LITERAL", value: d }
  ]);
}
const subtableParsers = new Array(9);
subtableParsers[1] = function parseLookup12() {
  const start = this.offset + this.relativeOffset;
  const substFormat = this.parseUShort();
  if (substFormat === 1) {
    return {
      substFormat: 1,
      coverage: this.parsePointer(Parser.coverage),
      deltaGlyphId: this.parseShort()
    };
  }
  if (substFormat === 2) {
    return {
      substFormat: 2,
      coverage: this.parsePointer(Parser.coverage),
      substitute: this.parseOffset16List()
    };
  }
  check.assert(false, `0x${start.toString(16)}: lookup type 1 format must be 1 or 2.`);
};
subtableParsers[2] = function parseLookup22() {
  const substFormat = this.parseUShort();
  check.argument(substFormat === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1");
  return {
    substFormat,
    coverage: this.parsePointer(Parser.coverage),
    sequences: this.parseListOfLists()
  };
};
subtableParsers[3] = function parseLookup32() {
  const substFormat = this.parseUShort();
  check.argument(substFormat === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1");
  return {
    substFormat,
    coverage: this.parsePointer(Parser.coverage),
    alternateSets: this.parseListOfLists()
  };
};
subtableParsers[4] = function parseLookup42() {
  const substFormat = this.parseUShort();
  check.argument(substFormat === 1, "GSUB ligature table identifier-format must be 1");
  return {
    substFormat,
    coverage: this.parsePointer(Parser.coverage),
    ligatureSets: this.parseListOfLists(function() {
      return {
        ligGlyph: this.parseUShort(),
        components: this.parseUShortList(this.parseUShort() - 1)
      };
    })
  };
};
const lookupRecordDesc = {
  sequenceIndex: Parser.uShort,
  lookupListIndex: Parser.uShort
};
subtableParsers[5] = function parseLookup52() {
  const start = this.offset + this.relativeOffset;
  const substFormat = this.parseUShort();
  if (substFormat === 1) {
    return {
      substFormat,
      coverage: this.parsePointer(Parser.coverage),
      ruleSets: this.parseListOfLists(function() {
        const glyphCount = this.parseUShort();
        const substCount = this.parseUShort();
        return {
          input: this.parseUShortList(glyphCount - 1),
          lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
        };
      })
    };
  }
  if (substFormat === 2) {
    return {
      substFormat,
      coverage: this.parsePointer(Parser.coverage),
      classDef: this.parsePointer(Parser.classDef),
      classSets: this.parseListOfLists(function() {
        const glyphCount = this.parseUShort();
        const substCount = this.parseUShort();
        return {
          classes: this.parseUShortList(glyphCount - 1),
          lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
        };
      })
    };
  }
  if (substFormat === 3) {
    const glyphCount = this.parseUShort();
    const substCount = this.parseUShort();
    return {
      substFormat,
      coverages: this.parseList(glyphCount, Parser.pointer(Parser.coverage)),
      lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
    };
  }
  check.assert(false, `0x${start.toString(16)}: lookup type 5 format must be 1, 2 or 3.`);
};
subtableParsers[6] = function parseLookup62() {
  const start = this.offset + this.relativeOffset;
  const substFormat = this.parseUShort();
  if (substFormat === 1) {
    return {
      substFormat: 1,
      coverage: this.parsePointer(Parser.coverage),
      chainRuleSets: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(lookupRecordDesc)
        };
      })
    };
  }
  if (substFormat === 2) {
    return {
      substFormat: 2,
      coverage: this.parsePointer(Parser.coverage),
      backtrackClassDef: this.parsePointer(Parser.classDef),
      inputClassDef: this.parsePointer(Parser.classDef),
      lookaheadClassDef: this.parsePointer(Parser.classDef),
      chainClassSet: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(lookupRecordDesc)
        };
      })
    };
  }
  if (substFormat === 3) {
    return {
      substFormat: 3,
      backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
      inputCoverage: this.parseList(Parser.pointer(Parser.coverage)),
      lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
      lookupRecords: this.parseRecordList(lookupRecordDesc)
    };
  }
  check.assert(false, `0x${start.toString(16)}: lookup type 6 format must be 1, 2 or 3.`);
};
subtableParsers[7] = function parseLookup72() {
  const substFormat = this.parseUShort();
  check.argument(substFormat === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
  const extensionLookupType = this.parseUShort();
  const extensionParser = new Parser(this.data, this.offset + this.parseULong());
  return {
    substFormat: 1,
    lookupType: extensionLookupType,
    extension: subtableParsers[extensionLookupType].call(extensionParser)
  };
};
subtableParsers[8] = function parseLookup82() {
  const substFormat = this.parseUShort();
  check.argument(substFormat === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1");
  return {
    substFormat,
    coverage: this.parsePointer(Parser.coverage),
    backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
    lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
    substitutes: this.parseUShortList()
  };
};
function parseGsubTable(data, start) {
  start = start || 0;
  const p = new Parser(data, start);
  const tableVersion = p.parseVersion(1);
  check.argument(tableVersion === 1 || tableVersion === 1.1, "Unsupported GSUB table version.");
  if (tableVersion === 1) {
    return {
      version: tableVersion,
      scripts: p.parseScriptList(),
      features: p.parseFeatureList(),
      lookups: p.parseLookupList(subtableParsers)
    };
  }
  return {
    version: tableVersion,
    scripts: p.parseScriptList(),
    features: p.parseFeatureList(),
    lookups: p.parseLookupList(subtableParsers),
    variations: p.parseFeatureVariationsList()
  };
}
const subtableMakers = new Array(9);
subtableMakers[1] = function makeLookup1(subtable) {
  if (subtable.substFormat === 1) {
    return new table.Table("substitutionTable", [
      { name: "substFormat", type: "USHORT", value: 1 },
      { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) },
      { name: "deltaGlyphID", type: "SHORT", value: subtable.deltaGlyphId }
    ]);
  }
  return new table.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 2 },
    { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) }
  ].concat(table.ushortList("substitute", subtable.substitute)));
};
subtableMakers[2] = function makeLookup2(subtable) {
  check.assert(subtable.substFormat === 1, "Lookup type 2 substFormat must be 1.");
  return new table.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) }
  ].concat(table.tableList("seqSet", subtable.sequences, (sequenceSet) => new table.Table("sequenceSetTable", table.ushortList("sequence", sequenceSet)))));
};
subtableMakers[3] = function makeLookup3(subtable) {
  check.assert(subtable.substFormat === 1, "Lookup type 3 substFormat must be 1.");
  return new table.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) }
  ].concat(table.tableList("altSet", subtable.alternateSets, (alternateSet) => new table.Table("alternateSetTable", table.ushortList("alternate", alternateSet)))));
};
subtableMakers[4] = function makeLookup4(subtable) {
  check.assert(subtable.substFormat === 1, "Lookup type 4 substFormat must be 1.");
  return new table.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) }
  ].concat(table.tableList("ligSet", subtable.ligatureSets, (ligatureSet) => new table.Table("ligatureSetTable", table.tableList("ligature", ligatureSet, (ligature) => new table.Table(
    "ligatureTable",
    [{ name: "ligGlyph", type: "USHORT", value: ligature.ligGlyph }].concat(table.ushortList("component", ligature.components, ligature.components.length + 1))
  ))))));
};
subtableMakers[6] = function makeLookup6(subtable) {
  if (subtable.substFormat === 1) {
    const returnTable = new table.Table("chainContextTable", [
      { name: "substFormat", type: "USHORT", value: subtable.substFormat },
      { name: "coverage", type: "TABLE", value: new table.Coverage(subtable.coverage) }
    ].concat(table.tableList("chainRuleSet", subtable.chainRuleSets, (chainRuleSet) => new table.Table("chainRuleSetTable", table.tableList("chainRule", chainRuleSet, (chainRule) => {
      let tableData = table.ushortList("backtrackGlyph", chainRule.backtrack, chainRule.backtrack.length).concat(table.ushortList("inputGlyph", chainRule.input, chainRule.input.length + 1)).concat(table.ushortList("lookaheadGlyph", chainRule.lookahead, chainRule.lookahead.length)).concat(table.ushortList("substitution", [], chainRule.lookupRecords.length));
      chainRule.lookupRecords.forEach((record, i) => {
        tableData = tableData.concat({ name: `sequenceIndex${i}`, type: "USHORT", value: record.sequenceIndex }).concat({ name: `lookupListIndex${i}`, type: "USHORT", value: record.lookupListIndex });
      });
      return new table.Table("chainRuleTable", tableData);
    })))));
    return returnTable;
  }
  if (subtable.substFormat === 2) {
    check.assert(false, "lookup type 6 format 2 is not yet supported.");
  } else if (subtable.substFormat === 3) {
    let tableData = [
      { name: "substFormat", type: "USHORT", value: subtable.substFormat }
    ];
    tableData.push({ name: "backtrackGlyphCount", type: "USHORT", value: subtable.backtrackCoverage.length });
    subtable.backtrackCoverage.forEach((coverage, i) => {
      tableData.push({ name: `backtrackCoverage${i}`, type: "TABLE", value: new table.Coverage(coverage) });
    });
    tableData.push({ name: "inputGlyphCount", type: "USHORT", value: subtable.inputCoverage.length });
    subtable.inputCoverage.forEach((coverage, i) => {
      tableData.push({ name: `inputCoverage${i}`, type: "TABLE", value: new table.Coverage(coverage) });
    });
    tableData.push({ name: "lookaheadGlyphCount", type: "USHORT", value: subtable.lookaheadCoverage.length });
    subtable.lookaheadCoverage.forEach((coverage, i) => {
      tableData.push({ name: `lookaheadCoverage${i}`, type: "TABLE", value: new table.Coverage(coverage) });
    });
    tableData.push({ name: "substitutionCount", type: "USHORT", value: subtable.lookupRecords.length });
    subtable.lookupRecords.forEach((record, i) => {
      tableData = tableData.concat({ name: `sequenceIndex${i}`, type: "USHORT", value: record.sequenceIndex }).concat({ name: `lookupListIndex${i}`, type: "USHORT", value: record.lookupListIndex });
    });
    const returnTable = new table.Table("chainContextTable", tableData);
    return returnTable;
  }
  check.assert(false, "lookup type 6 format must be 1, 2 or 3.");
};
function makeGsubTable(gsub) {
  return new table.Table("GSUB", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "scripts", type: "TABLE", value: new table.ScriptList(gsub.scripts) },
    { name: "features", type: "TABLE", value: new table.FeatureList(gsub.features) },
    { name: "lookups", type: "TABLE", value: new table.LookupList(gsub.lookups, subtableMakers) }
  ]);
}
function parseHeadTable(data, start) {
  const head = {};
  const p = new parse.Parser(data, start);
  head.version = p.parseVersion();
  head.fontRevision = Math.round(p.parseFixed() * 1e3) / 1e3;
  head.checkSumAdjustment = p.parseULong();
  head.magicNumber = p.parseULong();
  check.argument(head.magicNumber === 1594834165, "Font header has wrong magic number.");
  head.flags = p.parseUShort();
  head.unitsPerEm = p.parseUShort();
  head.created = p.parseLongDateTime();
  head.modified = p.parseLongDateTime();
  head.xMin = p.parseShort();
  head.yMin = p.parseShort();
  head.xMax = p.parseShort();
  head.yMax = p.parseShort();
  head.macStyle = p.parseUShort();
  head.lowestRecPPEM = p.parseUShort();
  head.fontDirectionHint = p.parseShort();
  head.indexToLocFormat = p.parseShort();
  head.glyphDataFormat = p.parseShort();
  return head;
}
function makeHeadTable(options) {
  const o = options || {};
  const d = new Array(54);
  let p = 0;
  writeUint32(d, p, o.version !== void 0 ? o.version : 65536);
  p += 4;
  writeUint32(d, p, o.fontRevision !== void 0 ? o.fontRevision : 65536);
  p += 4;
  writeUint32(d, p, o.checkSumAdjustment !== void 0 ? o.checkSumAdjustment : 0);
  p += 4;
  writeUint32(d, p, o.magicNumber !== void 0 ? o.magicNumber : 1594834165);
  p += 4;
  writeUint16(d, p, o.flags !== void 0 ? o.flags : 0);
  p += 2;
  writeUint16(d, p, o.unitsPerEm !== void 0 ? o.unitsPerEm : 1e3);
  p += 2;
  const created = o.created !== void 0 ? o.created : o.createdTimestamp !== void 0 ? o.createdTimestamp + 2082844800 : 0;
  d[p] = 0;
  d[p + 1] = 0;
  d[p + 2] = 0;
  d[p + 3] = 0;
  writeUint32(d, p + 4, created);
  p += 8;
  const modified = o.modified !== void 0 ? o.modified : 0;
  d[p] = 0;
  d[p + 1] = 0;
  d[p + 2] = 0;
  d[p + 3] = 0;
  writeUint32(d, p + 4, modified);
  p += 8;
  writeInt16(d, p, o.xMin !== void 0 ? o.xMin : 0);
  p += 2;
  writeInt16(d, p, o.yMin !== void 0 ? o.yMin : 0);
  p += 2;
  writeInt16(d, p, o.xMax !== void 0 ? o.xMax : 0);
  p += 2;
  writeInt16(d, p, o.yMax !== void 0 ? o.yMax : 0);
  p += 2;
  writeUint16(d, p, o.macStyle !== void 0 ? o.macStyle : 0);
  p += 2;
  writeUint16(d, p, o.lowestRecPPEM !== void 0 ? o.lowestRecPPEM : 0);
  p += 2;
  writeInt16(d, p, o.fontDirectionHint !== void 0 ? o.fontDirectionHint : 2);
  p += 2;
  writeInt16(d, p, o.indexToLocFormat !== void 0 ? o.indexToLocFormat : 0);
  p += 2;
  writeInt16(d, p, o.glyphDataFormat !== void 0 ? o.glyphDataFormat : 0);
  p += 2;
  return new table.Table("head", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseHheaTable(data, start) {
  const hhea = {};
  const p = new parse.Parser(data, start);
  hhea.version = p.parseVersion();
  hhea.ascender = p.parseShort();
  hhea.descender = p.parseShort();
  hhea.lineGap = p.parseShort();
  hhea.advanceWidthMax = p.parseUShort();
  hhea.minLeftSideBearing = p.parseShort();
  hhea.minRightSideBearing = p.parseShort();
  hhea.xMaxExtent = p.parseShort();
  hhea.caretSlopeRise = p.parseShort();
  hhea.caretSlopeRun = p.parseShort();
  hhea.caretOffset = p.parseShort();
  p.relativeOffset += 8;
  hhea.metricDataFormat = p.parseShort();
  hhea.numberOfHMetrics = p.parseUShort();
  return hhea;
}
function makeHheaTable(options) {
  const o = options || {};
  const d = new Array(36);
  let p = 0;
  writeUint32(d, p, o.version !== void 0 ? o.version : 65536);
  p += 4;
  writeInt16(d, p, o.ascender !== void 0 ? o.ascender : 0);
  p += 2;
  writeInt16(d, p, o.descender !== void 0 ? o.descender : 0);
  p += 2;
  writeInt16(d, p, o.lineGap !== void 0 ? o.lineGap : 0);
  p += 2;
  writeUint16(d, p, o.advanceWidthMax !== void 0 ? o.advanceWidthMax : 0);
  p += 2;
  writeInt16(d, p, o.minLeftSideBearing !== void 0 ? o.minLeftSideBearing : 0);
  p += 2;
  writeInt16(d, p, o.minRightSideBearing !== void 0 ? o.minRightSideBearing : 0);
  p += 2;
  writeInt16(d, p, o.xMaxExtent !== void 0 ? o.xMaxExtent : 0);
  p += 2;
  writeInt16(d, p, o.caretSlopeRise !== void 0 ? o.caretSlopeRise : 1);
  p += 2;
  writeInt16(d, p, o.caretSlopeRun !== void 0 ? o.caretSlopeRun : 0);
  p += 2;
  writeInt16(d, p, o.caretOffset !== void 0 ? o.caretOffset : 0);
  p += 2;
  writeInt16(d, p, 0);
  p += 2;
  writeInt16(d, p, 0);
  p += 2;
  writeInt16(d, p, 0);
  p += 2;
  writeInt16(d, p, 0);
  p += 2;
  writeInt16(d, p, o.metricDataFormat !== void 0 ? o.metricDataFormat : 0);
  p += 2;
  writeUint16(d, p, o.numberOfHMetrics !== void 0 ? o.numberOfHMetrics : 0);
  p += 2;
  return new table.Table("hhea", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs, length) {
  let advanceWidth;
  let leftSideBearing;
  const p = new parse.Parser(data, start);
  for (let i = 0; i < numGlyphs; i += 1) {
    if (i < numMetrics) {
      advanceWidth = p.parseUShort();
      leftSideBearing = p.parseShort();
    } else if (p.relativeOffset + 2 <= length) {
      leftSideBearing = p.parseShort();
    }
    const glyph = glyphs.get(i);
    glyph.advanceWidth = advanceWidth;
    glyph.leftSideBearing = leftSideBearing;
  }
}
function makeHmtxTable(glyphs) {
  const data = new Array(glyphs.length * 4);
  for (let i = 0; i < glyphs.length; i += 1) {
    const glyph = glyphs.get(i);
    const advanceWidth = glyph.advanceWidth || 0;
    const leftSideBearing = glyph.leftSideBearing || 0;
    const off = i * 4;
    data[off] = advanceWidth >> 8 & 255;
    data[off + 1] = advanceWidth & 255;
    data[off + 2] = leftSideBearing >> 8 & 255;
    data[off + 3] = leftSideBearing & 255;
  }
  return new table.Table("hmtx", [
    { name: "metrics", type: "LITERAL", value: data }
  ]);
}
function parseKernTable(data, start) {
  const p = new parse.Parser(data, start);
  const tableVersion = p.parseUShort();
  const pairs = {};
  if (tableVersion === 0) {
    p.skip("uShort");
    const subtableVersion = p.parseUShort();
    check.argument(subtableVersion === 0, "Unsupported kern sub-table version.");
    p.skip("uShort", 2);
    const nPairs = p.parseUShort();
    p.skip("uShort", 3);
    for (let i = 0; i < nPairs; i += 1) {
      const leftIndex = p.parseUShort();
      const rightIndex = p.parseUShort();
      const value = p.parseShort();
      pairs[`${leftIndex},${rightIndex}`] = value;
    }
  } else if (tableVersion === 1) {
    p.skip("uShort");
    const nTables = p.parseULong();
    if (nTables > 1) {
      console.warn("Only the first kern subtable is supported.");
    }
    p.skip("uLong");
    const coverage = p.parseUShort();
    const subtableVersion = coverage & 255;
    p.skip("uShort");
    if (subtableVersion === 0) {
      const nPairs = p.parseUShort();
      p.skip("uShort", 3);
      for (let i = 0; i < nPairs; i += 1) {
        const leftIndex = p.parseUShort();
        const rightIndex = p.parseUShort();
        const value = p.parseShort();
        pairs[`${leftIndex},${rightIndex}`] = value;
      }
    }
  } else {
    throw new Error(`Unsupported kern table version (${tableVersion}).`);
  }
  return pairs;
}
function parseLocaTable(data, start, numGlyphs, shortVersion) {
  const p = new parse.Parser(data, start);
  const parseFn = shortVersion ? p.parseUShort : p.parseULong;
  const glyphOffsets = [];
  for (let i = 0; i < numGlyphs + 1; i += 1) {
    let glyphOffset = parseFn.call(p);
    if (shortVersion) {
      glyphOffset *= 2;
    }
    glyphOffsets.push(glyphOffset);
  }
  return glyphOffsets;
}
function makeLtagTable(tags) {
  let stringPool = "";
  const stringPoolOffset = 12 + tags.length * 4;
  const offsets = [];
  for (let i = 0; i < tags.length; ++i) {
    let pos = stringPool.indexOf(tags[i]);
    if (pos < 0) {
      pos = stringPool.length;
      stringPool += tags[i];
    }
    offsets.push({ offset: stringPoolOffset + pos, length: tags[i].length });
  }
  const totalSize = 12 + tags.length * 4 + stringPool.length;
  const d = new Array(totalSize);
  let p = 0;
  writeUint32(d, p, 1);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, tags.length);
  p += 4;
  for (let i = 0; i < offsets.length; i++) {
    writeUint16(d, p, offsets[i].offset);
    p += 2;
    writeUint16(d, p, offsets[i].length);
    p += 2;
  }
  for (let i = 0; i < stringPool.length; i++) {
    d[p++] = stringPool.charCodeAt(i);
  }
  return new table.Table("ltag", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parseLtagTable(data, start) {
  const p = new parse.Parser(data, start);
  const tableVersion = p.parseULong();
  check.argument(tableVersion === 1, "Unsupported ltag table version.");
  p.skip("uLong", 1);
  const numTags = p.parseULong();
  const tags = [];
  for (let i = 0; i < numTags; i++) {
    let tag = "";
    const offset = start + p.parseUShort();
    const length = p.parseUShort();
    for (let j = offset; j < offset + length; ++j) {
      tag += String.fromCharCode(data.getInt8(j));
    }
    tags.push(tag);
  }
  return tags;
}
function parseMaxpTable(data, start) {
  const maxp = {};
  const p = new parse.Parser(data, start);
  maxp.version = p.parseVersion();
  maxp.numGlyphs = p.parseUShort();
  if (maxp.version === 1) {
    maxp.maxPoints = p.parseUShort();
    maxp.maxContours = p.parseUShort();
    maxp.maxCompositePoints = p.parseUShort();
    maxp.maxCompositeContours = p.parseUShort();
    maxp.maxZones = p.parseUShort();
    maxp.maxTwilightPoints = p.parseUShort();
    maxp.maxStorage = p.parseUShort();
    maxp.maxFunctionDefs = p.parseUShort();
    maxp.maxInstructionDefs = p.parseUShort();
    maxp.maxStackElements = p.parseUShort();
    maxp.maxSizeOfInstructions = p.parseUShort();
    maxp.maxComponentElements = p.parseUShort();
    maxp.maxComponentDepth = p.parseUShort();
  }
  return maxp;
}
function makeMaxpTable(numGlyphs) {
  const d = new Array(6);
  let p = 0;
  writeUint32(d, p, 20480);
  p += 4;
  writeUint16(d, p, numGlyphs);
  p += 2;
  return new table.Table("maxp", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function makeMaxpTableTrueType(numGlyphs, maxPoints, maxContours, maxCompositePoints, maxCompositeContours, maxComponentElements, maxComponentDepth, hintingMetrics) {
  const h = hintingMetrics || {};
  const d = new Array(32);
  let p = 0;
  writeUint32(d, p, 65536);
  p += 4;
  writeUint16(d, p, numGlyphs);
  p += 2;
  writeUint16(d, p, maxPoints);
  p += 2;
  writeUint16(d, p, maxContours);
  p += 2;
  writeUint16(d, p, maxCompositePoints || 0);
  p += 2;
  writeUint16(d, p, maxCompositeContours || 0);
  p += 2;
  writeUint16(d, p, h.maxZones || 1);
  p += 2;
  writeUint16(d, p, h.maxTwilightPoints || 0);
  p += 2;
  writeUint16(d, p, h.maxStorage || 0);
  p += 2;
  writeUint16(d, p, h.maxFunctionDefs || 0);
  p += 2;
  writeUint16(d, p, h.maxInstructionDefs || 0);
  p += 2;
  writeUint16(d, p, h.maxStackElements || 0);
  p += 2;
  writeUint16(d, p, h.maxSizeOfInstructions || 0);
  p += 2;
  writeUint16(d, p, maxComponentElements || 0);
  p += 2;
  writeUint16(d, p, maxComponentDepth || 0);
  p += 2;
  return new table.Table("maxp", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function encodeSimpleGlyph(glyph) {
  const points = glyph.points;
  if (!points || points.length === 0) return [];
  const endPtsOfContours = [];
  for (let i = 0; i < points.length; i++) {
    if (points[i].lastPointOfContour) endPtsOfContours.push(i);
  }
  if (endPtsOfContours.length === 0) return [];
  let xMin;
  let yMin;
  let xMax;
  let yMax;
  if (glyph._xMin !== void 0) {
    xMin = glyph._xMin;
    yMin = glyph._yMin;
    xMax = glyph._xMax;
    yMax = glyph._yMax;
  } else {
    xMin = Infinity;
    yMin = Infinity;
    xMax = -Infinity;
    yMax = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.x < xMin) xMin = pt.x;
      if (pt.y < yMin) yMin = pt.y;
      if (pt.x > xMax) xMax = pt.x;
      if (pt.y > yMax) yMax = pt.y;
    }
  }
  const numberOfContours = endPtsOfContours.length;
  const d = [];
  pushInt16(d, numberOfContours);
  pushInt16(d, Math.round(xMin));
  pushInt16(d, Math.round(yMin));
  pushInt16(d, Math.round(xMax));
  pushInt16(d, Math.round(yMax));
  for (let i = 0; i < numberOfContours; i++) {
    pushUint16(d, endPtsOfContours[i]);
  }
  const instructions = glyph.instructions || [];
  pushUint16(d, instructions.length);
  for (let i = 0; i < instructions.length; i++) {
    d.push(instructions[i]);
  }
  let prevX = 0;
  let prevY = 0;
  const flags = [];
  const xDeltas = [];
  const yDeltas = [];
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const x = Math.round(pt.x);
    const y = Math.round(pt.y);
    const dx = x - prevX;
    const dy = y - prevY;
    prevX = x;
    prevY = y;
    let flag = pt.onCurve ? 1 : 0;
    if (i === 0) flag |= 64;
    if (dx === 0) {
      flag |= 16;
    } else if (dx >= -255 && dx <= 255) {
      flag |= 2;
      if (dx > 0) flag |= 16;
    }
    if (dy === 0) {
      flag |= 32;
    } else if (dy >= -255 && dy <= 255) {
      flag |= 4;
      if (dy > 0) flag |= 32;
    }
    flags.push(flag);
    xDeltas.push(dx);
    yDeltas.push(dy);
  }
  for (let i = 0; i < flags.length; ) {
    const flag = flags[i];
    let repeatCount = 0;
    while (i + 1 + repeatCount < flags.length && flags[i + 1 + repeatCount] === flag && repeatCount < 255) {
      repeatCount++;
    }
    if (repeatCount > 0) {
      d.push(flag | 8);
      d.push(repeatCount);
      i += 1 + repeatCount;
    } else {
      d.push(flag);
      i++;
    }
  }
  for (let i = 0; i < xDeltas.length; i++) {
    const dx = xDeltas[i];
    if (flags[i] & 2) {
      d.push(Math.abs(dx));
    } else if (!(flags[i] & 16)) {
      pushInt16(d, dx);
    }
  }
  for (let i = 0; i < yDeltas.length; i++) {
    const dy = yDeltas[i];
    if (flags[i] & 4) {
      d.push(Math.abs(dy));
    } else if (!(flags[i] & 32)) {
      pushInt16(d, dy);
    }
  }
  return d;
}
function encodeCompositeGlyph(glyph) {
  const components = glyph.components;
  if (!components || components.length === 0) return [];
  let xMin;
  let yMin;
  let xMax;
  let yMax;
  if (glyph._xMin !== void 0) {
    xMin = glyph._xMin;
    yMin = glyph._yMin;
    xMax = glyph._xMax;
    yMax = glyph._yMax;
  } else {
    const pts = glyph.points || [];
    xMin = Infinity;
    yMin = Infinity;
    xMax = -Infinity;
    yMax = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].x < xMin) xMin = pts[i].x;
      if (pts[i].y < yMin) yMin = pts[i].y;
      if (pts[i].x > xMax) xMax = pts[i].x;
      if (pts[i].y > yMax) yMax = pts[i].y;
    }
    if (xMin === Infinity) {
      xMin = 0;
      yMin = 0;
      xMax = 0;
      yMax = 0;
    }
  }
  const instructions = glyph.instructions || [];
  const hasInstructions = instructions.length > 0;
  const d = [];
  pushInt16(d, -1);
  pushInt16(d, Math.round(xMin));
  pushInt16(d, Math.round(yMin));
  pushInt16(d, Math.round(xMax));
  pushInt16(d, Math.round(yMax));
  for (let ci = 0; ci < components.length; ci++) {
    const comp = components[ci];
    const isLast = ci === components.length - 1;
    const hasScale = comp.xScale !== 1 || comp.yScale !== 1;
    const hasXYScale = hasScale && comp.xScale !== comp.yScale;
    const has2x2 = comp.scale01 !== 0 || comp.scale10 !== 0;
    let useWords;
    if (comp.flags !== void 0) {
      useWords = !!(comp.flags & 1);
    } else {
      useWords = comp.dx < -128 || comp.dx > 127 || comp.dy < -128 || comp.dy > 127 || comp.matchedPoints !== void 0;
    }
    let flags = 0;
    if (useWords) flags |= 1;
    if (comp.matchedPoints === void 0) flags |= 2;
    if (!isLast) flags |= 32;
    if (has2x2) flags |= 128;
    else if (hasXYScale) flags |= 64;
    else if (hasScale) flags |= 8;
    if (isLast && hasInstructions) flags |= 256;
    if (comp.flags !== void 0) {
      flags |= comp.flags & (4 | 512 | 1024 | 2048 | 4096);
    }
    pushUint16(d, flags);
    pushUint16(d, comp.glyphIndex);
    if (comp.matchedPoints !== void 0) {
      if (useWords) {
        pushUint16(d, comp.matchedPoints[0]);
        pushUint16(d, comp.matchedPoints[1]);
      } else {
        d.push(comp.matchedPoints[0] & 255);
        d.push(comp.matchedPoints[1] & 255);
      }
    } else if (useWords) {
      pushInt16(d, Math.round(comp.dx));
      pushInt16(d, Math.round(comp.dy));
    } else {
      d.push(Math.round(comp.dx) & 255);
      d.push(Math.round(comp.dy) & 255);
    }
    if (has2x2) {
      pushInt16(d, Math.round(comp.xScale * 16384));
      pushInt16(d, Math.round(comp.scale01 * 16384));
      pushInt16(d, Math.round(comp.scale10 * 16384));
      pushInt16(d, Math.round(comp.yScale * 16384));
    } else if (hasXYScale) {
      pushInt16(d, Math.round(comp.xScale * 16384));
      pushInt16(d, Math.round(comp.yScale * 16384));
    } else if (hasScale) {
      pushInt16(d, Math.round(comp.xScale * 16384));
    }
  }
  if (hasInstructions) {
    pushUint16(d, instructions.length);
    for (let i = 0; i < instructions.length; i++) {
      d.push(instructions[i]);
    }
  }
  while (d.length % 2 !== 0) d.push(0);
  return d;
}
function pushInt16(d, v) {
  if (v < 0) v += 65536;
  d.push(v >> 8 & 255, v & 255);
}
function pushUint16(d, v) {
  d.push(v >> 8 & 255, v & 255);
}
function makeGlyfTable(glyphs) {
  const allGlyfBytes = [];
  const locaOffsets = [];
  let maxPoints = 0;
  let maxContours = 0;
  let maxCompositePoints = 0;
  let maxCompositeContours = 0;
  let maxComponentElements = 0;
  let maxComponentDepth = 0;
  let maxSizeOfInstructions = 0;
  let offset = 0;
  for (let i = 0; i < glyphs.length; i++) {
    locaOffsets.push(offset);
    const glyph = glyphs.get(i);
    const pts = glyph.points;
    if (!pts || pts.length === 0) {
      continue;
    }
    const isComp = glyph.isComposite && glyph.components && glyph.components.length > 0;
    const glyphBytes = isComp ? encodeCompositeGlyph(glyph) : encodeSimpleGlyph(glyph);
    if (glyphBytes.length === 0) continue;
    while (glyphBytes.length % 2 !== 0) glyphBytes.push(0);
    for (let b = 0; b < glyphBytes.length; b++) allGlyfBytes.push(glyphBytes[b]);
    offset += glyphBytes.length;
    const instrLen = glyph.instructions ? glyph.instructions.length : 0;
    if (instrLen > maxSizeOfInstructions) maxSizeOfInstructions = instrLen;
    if (isComp) {
      if (pts.length > maxCompositePoints) maxCompositePoints = pts.length;
      const nc = pts.filter((p) => p.lastPointOfContour).length;
      if (nc > maxCompositeContours) maxCompositeContours = nc;
      if (glyph.components.length > maxComponentElements) maxComponentElements = glyph.components.length;
      if (maxComponentDepth < 1) maxComponentDepth = 1;
    } else {
      if (pts.length > maxPoints) maxPoints = pts.length;
      const nc = pts.filter((p) => p.lastPointOfContour).length;
      if (nc > maxContours) maxContours = nc;
    }
  }
  locaOffsets.push(offset);
  const indexToLocFormat = offset / 2 > 65535 ? 1 : 0;
  const locaBytes = [];
  for (let i = 0; i < locaOffsets.length; i++) {
    if (indexToLocFormat === 0) {
      pushUint16(locaBytes, locaOffsets[i] / 2);
    } else {
      const v = locaOffsets[i];
      locaBytes.push(v >> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255);
    }
  }
  const glyfTable = new table.Table("glyf", [
    { name: "data", type: "LITERAL", value: allGlyfBytes }
  ]);
  const locaTable = new table.Table("loca", [
    { name: "data", type: "LITERAL", value: locaBytes }
  ]);
  return {
    glyfTable,
    locaTable,
    indexToLocFormat,
    maxPoints,
    maxContours,
    maxCompositePoints,
    maxCompositeContours,
    maxComponentElements,
    maxComponentDepth,
    maxSizeOfInstructions
  };
}
function parseMetaTable(data, start) {
  const p = new parse.Parser(data, start);
  const tableVersion = p.parseULong();
  check.argument(tableVersion === 1, "Unsupported META table version.");
  p.parseULong();
  p.parseULong();
  const numDataMaps = p.parseULong();
  const tags = {};
  for (let i = 0; i < numDataMaps; i++) {
    const tag = p.parseTag();
    const dataOffset = p.parseULong();
    const dataLength = p.parseULong();
    tags[tag] = decode.UTF8(data, start + dataOffset, dataLength);
  }
  return tags;
}
function makeMetaTable(tags) {
  const tagKeys = Object.keys(tags);
  const numTags = tagKeys.length;
  let stringPool = "";
  const stringPoolOffset = 16 + numTags * 12;
  const entries = [];
  for (let i = 0; i < tagKeys.length; i++) {
    const tag = tagKeys[i];
    const pos = stringPool.length;
    stringPool += tags[tag];
    entries.push({ tag, offset: stringPoolOffset + pos, length: tags[tag].length });
  }
  const totalSize = 16 + numTags * 12 + stringPool.length;
  const d = new Array(totalSize);
  let p = 0;
  writeUint32(d, p, 1);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, stringPoolOffset);
  p += 4;
  writeUint32(d, p, numTags);
  p += 4;
  for (let i = 0; i < entries.length; i++) {
    writeTag(d, p, entries[i].tag);
    p += 4;
    writeUint32(d, p, entries[i].offset);
    p += 4;
    writeUint32(d, p, entries[i].length);
    p += 4;
  }
  for (let i = 0; i < stringPool.length; i++) {
    d[p++] = stringPool.charCodeAt(i);
  }
  return new table.Table("meta", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
const nameTableNames = [
  "copyright",
  // 0
  "fontFamily",
  // 1
  "fontSubfamily",
  // 2
  "uniqueID",
  // 3
  "fullName",
  // 4
  "version",
  // 5
  "postScriptName",
  // 6
  "trademark",
  // 7
  "manufacturer",
  // 8
  "designer",
  // 9
  "description",
  // 10
  "manufacturerURL",
  // 11
  "designerURL",
  // 12
  "license",
  // 13
  "licenseURL",
  // 14
  "reserved",
  // 15
  "preferredFamily",
  // 16
  "preferredSubfamily",
  // 17
  "compatibleFullName",
  // 18
  "sampleText",
  // 19
  "postScriptFindFontName",
  // 20
  "wwsFamily",
  // 21
  "wwsSubfamily"
  // 22
];
const macLanguages = {
  0: "en",
  1: "fr",
  2: "de",
  3: "it",
  4: "nl",
  5: "sv",
  6: "es",
  7: "da",
  8: "pt",
  9: "no",
  10: "he",
  11: "ja",
  12: "ar",
  13: "fi",
  14: "el",
  15: "is",
  16: "mt",
  17: "tr",
  18: "hr",
  19: "zh-Hant",
  20: "ur",
  21: "hi",
  22: "th",
  23: "ko",
  24: "lt",
  25: "pl",
  26: "hu",
  27: "es",
  28: "lv",
  29: "se",
  30: "fo",
  31: "fa",
  32: "ru",
  33: "zh",
  34: "nl-BE",
  35: "ga",
  36: "sq",
  37: "ro",
  38: "cz",
  39: "sk",
  40: "si",
  41: "yi",
  42: "sr",
  43: "mk",
  44: "bg",
  45: "uk",
  46: "be",
  47: "uz",
  48: "kk",
  49: "az-Cyrl",
  50: "az-Arab",
  51: "hy",
  52: "ka",
  53: "mo",
  54: "ky",
  55: "tg",
  56: "tk",
  57: "mn-CN",
  58: "mn",
  59: "ps",
  60: "ks",
  61: "ku",
  62: "sd",
  63: "bo",
  64: "ne",
  65: "sa",
  66: "mr",
  67: "bn",
  68: "as",
  69: "gu",
  70: "pa",
  71: "or",
  72: "ml",
  73: "kn",
  74: "ta",
  75: "te",
  76: "si",
  77: "my",
  78: "km",
  79: "lo",
  80: "vi",
  81: "id",
  82: "tl",
  83: "ms",
  84: "ms-Arab",
  85: "am",
  86: "ti",
  87: "om",
  88: "so",
  89: "sw",
  90: "rw",
  91: "rn",
  92: "ny",
  93: "mg",
  94: "eo",
  128: "cy",
  129: "eu",
  130: "ca",
  131: "la",
  132: "qu",
  133: "gn",
  134: "ay",
  135: "tt",
  136: "ug",
  137: "dz",
  138: "jv",
  139: "su",
  140: "gl",
  141: "af",
  142: "br",
  143: "iu",
  144: "gd",
  145: "gv",
  146: "ga",
  147: "to",
  148: "el-polyton",
  149: "kl",
  150: "az",
  151: "nn"
};
const macLanguageToScript = {
  0: 0,
  // langEnglish → smRoman
  1: 0,
  // langFrench → smRoman
  2: 0,
  // langGerman → smRoman
  3: 0,
  // langItalian → smRoman
  4: 0,
  // langDutch → smRoman
  5: 0,
  // langSwedish → smRoman
  6: 0,
  // langSpanish → smRoman
  7: 0,
  // langDanish → smRoman
  8: 0,
  // langPortuguese → smRoman
  9: 0,
  // langNorwegian → smRoman
  10: 5,
  // langHebrew → smHebrew
  11: 1,
  // langJapanese → smJapanese
  12: 4,
  // langArabic → smArabic
  13: 0,
  // langFinnish → smRoman
  14: 6,
  // langGreek → smGreek
  15: 0,
  // langIcelandic → smRoman (modified)
  16: 0,
  // langMaltese → smRoman
  17: 0,
  // langTurkish → smRoman (modified)
  18: 0,
  // langCroatian → smRoman (modified)
  19: 2,
  // langTradChinese → smTradChinese
  20: 4,
  // langUrdu → smArabic
  21: 9,
  // langHindi → smDevanagari
  22: 21,
  // langThai → smThai
  23: 3,
  // langKorean → smKorean
  24: 29,
  // langLithuanian → smCentralEuroRoman
  25: 29,
  // langPolish → smCentralEuroRoman
  26: 29,
  // langHungarian → smCentralEuroRoman
  27: 29,
  // langEstonian → smCentralEuroRoman
  28: 29,
  // langLatvian → smCentralEuroRoman
  29: 0,
  // langSami → smRoman
  30: 0,
  // langFaroese → smRoman (modified)
  31: 4,
  // langFarsi → smArabic (modified)
  32: 7,
  // langRussian → smCyrillic
  33: 25,
  // langSimpChinese → smSimpChinese
  34: 0,
  // langFlemish → smRoman
  35: 0,
  // langIrishGaelic → smRoman (modified)
  36: 0,
  // langAlbanian → smRoman
  37: 0,
  // langRomanian → smRoman (modified)
  38: 29,
  // langCzech → smCentralEuroRoman
  39: 29,
  // langSlovak → smCentralEuroRoman
  40: 0,
  // langSlovenian → smRoman (modified)
  41: 5,
  // langYiddish → smHebrew
  42: 7,
  // langSerbian → smCyrillic
  43: 7,
  // langMacedonian → smCyrillic
  44: 7,
  // langBulgarian → smCyrillic
  45: 7,
  // langUkrainian → smCyrillic (modified)
  46: 7,
  // langByelorussian → smCyrillic
  47: 7,
  // langUzbek → smCyrillic
  48: 7,
  // langKazakh → smCyrillic
  49: 7,
  // langAzerbaijani → smCyrillic
  50: 4,
  // langAzerbaijanAr → smArabic
  51: 24,
  // langArmenian → smArmenian
  52: 23,
  // langGeorgian → smGeorgian
  53: 7,
  // langMoldavian → smCyrillic
  54: 7,
  // langKirghiz → smCyrillic
  55: 7,
  // langTajiki → smCyrillic
  56: 7,
  // langTurkmen → smCyrillic
  57: 27,
  // langMongolian → smMongolian
  58: 7,
  // langMongolianCyr → smCyrillic
  59: 4,
  // langPashto → smArabic
  60: 4,
  // langKurdish → smArabic
  61: 4,
  // langKashmiri → smArabic
  62: 4,
  // langSindhi → smArabic
  63: 26,
  // langTibetan → smTibetan
  64: 9,
  // langNepali → smDevanagari
  65: 9,
  // langSanskrit → smDevanagari
  66: 9,
  // langMarathi → smDevanagari
  67: 13,
  // langBengali → smBengali
  68: 13,
  // langAssamese → smBengali
  69: 11,
  // langGujarati → smGujarati
  70: 10,
  // langPunjabi → smGurmukhi
  71: 12,
  // langOriya → smOriya
  72: 17,
  // langMalayalam → smMalayalam
  73: 16,
  // langKannada → smKannada
  74: 14,
  // langTamil → smTamil
  75: 15,
  // langTelugu → smTelugu
  76: 18,
  // langSinhalese → smSinhalese
  77: 19,
  // langBurmese → smBurmese
  78: 20,
  // langKhmer → smKhmer
  79: 22,
  // langLao → smLao
  80: 30,
  // langVietnamese → smVietnamese
  81: 0,
  // langIndonesian → smRoman
  82: 0,
  // langTagalog → smRoman
  83: 0,
  // langMalayRoman → smRoman
  84: 4,
  // langMalayArabic → smArabic
  85: 28,
  // langAmharic → smEthiopic
  86: 28,
  // langTigrinya → smEthiopic
  87: 28,
  // langOromo → smEthiopic
  88: 0,
  // langSomali → smRoman
  89: 0,
  // langSwahili → smRoman
  90: 0,
  // langKinyarwanda → smRoman
  91: 0,
  // langRundi → smRoman
  92: 0,
  // langNyanja → smRoman
  93: 0,
  // langMalagasy → smRoman
  94: 0,
  // langEsperanto → smRoman
  128: 0,
  // langWelsh → smRoman (modified)
  129: 0,
  // langBasque → smRoman
  130: 0,
  // langCatalan → smRoman
  131: 0,
  // langLatin → smRoman
  132: 0,
  // langQuechua → smRoman
  133: 0,
  // langGuarani → smRoman
  134: 0,
  // langAymara → smRoman
  135: 7,
  // langTatar → smCyrillic
  136: 4,
  // langUighur → smArabic
  137: 26,
  // langDzongkha → smTibetan
  138: 0,
  // langJavaneseRom → smRoman
  139: 0,
  // langSundaneseRom → smRoman
  140: 0,
  // langGalician → smRoman
  141: 0,
  // langAfrikaans → smRoman
  142: 0,
  // langBreton → smRoman (modified)
  143: 28,
  // langInuktitut → smEthiopic (modified)
  144: 0,
  // langScottishGaelic → smRoman (modified)
  145: 0,
  // langManxGaelic → smRoman (modified)
  146: 0,
  // langIrishGaelicScript → smRoman (modified)
  147: 0,
  // langTongan → smRoman
  148: 6,
  // langGreekAncient → smRoman
  149: 0,
  // langGreenlandic → smRoman
  150: 0,
  // langAzerbaijanRoman → smRoman
  151: 0
  // langNynorsk → smRoman
};
const windowsLanguages = {
  1078: "af",
  1052: "sq",
  1156: "gsw",
  1118: "am",
  5121: "ar-DZ",
  15361: "ar-BH",
  3073: "ar",
  2049: "ar-IQ",
  11265: "ar-JO",
  13313: "ar-KW",
  12289: "ar-LB",
  4097: "ar-LY",
  6145: "ary",
  8193: "ar-OM",
  16385: "ar-QA",
  1025: "ar-SA",
  10241: "ar-SY",
  7169: "aeb",
  14337: "ar-AE",
  9217: "ar-YE",
  1067: "hy",
  1101: "as",
  2092: "az-Cyrl",
  1068: "az",
  1133: "ba",
  1069: "eu",
  1059: "be",
  2117: "bn",
  1093: "bn-IN",
  8218: "bs-Cyrl",
  5146: "bs",
  1150: "br",
  1026: "bg",
  1027: "ca",
  3076: "zh-HK",
  5124: "zh-MO",
  2052: "zh",
  4100: "zh-SG",
  1028: "zh-TW",
  1155: "co",
  1050: "hr",
  4122: "hr-BA",
  1029: "cs",
  1030: "da",
  1164: "prs",
  1125: "dv",
  2067: "nl-BE",
  1043: "nl",
  3081: "en-AU",
  10249: "en-BZ",
  4105: "en-CA",
  9225: "en-029",
  16393: "en-IN",
  6153: "en-IE",
  8201: "en-JM",
  17417: "en-MY",
  5129: "en-NZ",
  13321: "en-PH",
  18441: "en-SG",
  7177: "en-ZA",
  11273: "en-TT",
  2057: "en-GB",
  1033: "en",
  12297: "en-ZW",
  1061: "et",
  1080: "fo",
  1124: "fil",
  1035: "fi",
  2060: "fr-BE",
  3084: "fr-CA",
  1036: "fr",
  5132: "fr-LU",
  6156: "fr-MC",
  4108: "fr-CH",
  1122: "fy",
  1110: "gl",
  1079: "ka",
  3079: "de-AT",
  1031: "de",
  5127: "de-LI",
  4103: "de-LU",
  2055: "de-CH",
  1032: "el",
  1135: "kl",
  1095: "gu",
  1128: "ha",
  1037: "he",
  1081: "hi",
  1038: "hu",
  1039: "is",
  1136: "ig",
  1057: "id",
  1117: "iu",
  2141: "iu-Latn",
  2108: "ga",
  1076: "xh",
  1077: "zu",
  1040: "it",
  2064: "it-CH",
  1041: "ja",
  1099: "kn",
  1087: "kk",
  1107: "km",
  1158: "quc",
  1159: "rw",
  1089: "sw",
  1111: "kok",
  1042: "ko",
  1088: "ky",
  1108: "lo",
  1062: "lv",
  1063: "lt",
  2094: "dsb",
  1134: "lb",
  1071: "mk",
  2110: "ms-BN",
  1086: "ms",
  1100: "ml",
  1082: "mt",
  1153: "mi",
  1146: "arn",
  1102: "mr",
  1148: "moh",
  1104: "mn",
  2128: "mn-CN",
  1121: "ne",
  1044: "nb",
  2068: "nn",
  1154: "oc",
  1096: "or",
  1123: "ps",
  1045: "pl",
  1046: "pt",
  2070: "pt-PT",
  1094: "pa",
  1131: "qu-BO",
  2155: "qu-EC",
  3179: "qu",
  1048: "ro",
  1047: "rm",
  1049: "ru",
  9275: "smn",
  4155: "smj-NO",
  5179: "smj",
  3131: "se-FI",
  1083: "se",
  2107: "se-SE",
  8251: "sms",
  6203: "sma-NO",
  7227: "sms",
  1103: "sa",
  7194: "sr-Cyrl-BA",
  3098: "sr",
  6170: "sr-Latn-BA",
  2074: "sr-Latn",
  1132: "nso",
  1074: "tn",
  1115: "si",
  1051: "sk",
  1060: "sl",
  11274: "es-AR",
  16394: "es-BO",
  13322: "es-CL",
  9226: "es-CO",
  5130: "es-CR",
  7178: "es-DO",
  12298: "es-EC",
  17418: "es-SV",
  4106: "es-GT",
  18442: "es-HN",
  2058: "es-MX",
  19466: "es-NI",
  6154: "es-PA",
  15370: "es-PY",
  10250: "es-PE",
  20490: "es-PR",
  // Microsoft has defined two different language codes for
  // “Spanish with modern sorting” and “Spanish with traditional
  // sorting”. This makes sense for collation APIs, and it would be
  // possible to express this in BCP 47 language tags via Unicode
  // extensions (eg., es-u-co-trad is Spanish with traditional
  // sorting). However, for storing names in fonts, the distinction
  // does not make sense, so we give “es” in both cases.
  3082: "es",
  1034: "es",
  21514: "es-US",
  14346: "es-UY",
  8202: "es-VE",
  2077: "sv-FI",
  1053: "sv",
  1114: "syr",
  1064: "tg",
  2143: "tzm",
  1097: "ta",
  1092: "tt",
  1098: "te",
  1054: "th",
  1105: "bo",
  1055: "tr",
  1090: "tk",
  1152: "ug",
  1058: "uk",
  1070: "hsb",
  1056: "ur",
  2115: "uz-Cyrl",
  1091: "uz",
  1066: "vi",
  1106: "cy",
  1160: "wo",
  1157: "sah",
  1144: "ii",
  1130: "yo"
};
function getLanguageCode(platformID, languageID, ltag) {
  switch (platformID) {
    case 0:
      if (languageID === 65535) {
        return "und";
      }
      if (ltag) {
        return ltag[languageID];
      }
      break;
    case 1:
      return macLanguages[languageID];
    case 3:
      return windowsLanguages[languageID];
  }
  return void 0;
}
const utf16 = "utf-16";
const macScriptEncodings = {
  0: "macintosh",
  // smRoman
  1: "x-mac-japanese",
  // smJapanese
  2: "x-mac-chinesetrad",
  // smTradChinese
  3: "x-mac-korean",
  // smKorean
  6: "x-mac-greek",
  // smGreek
  7: "x-mac-cyrillic",
  // smCyrillic
  9: "x-mac-devanagai",
  // smDevanagari
  10: "x-mac-gurmukhi",
  // smGurmukhi
  11: "x-mac-gujarati",
  // smGujarati
  12: "x-mac-oriya",
  // smOriya
  13: "x-mac-bengali",
  // smBengali
  14: "x-mac-tamil",
  // smTamil
  15: "x-mac-telugu",
  // smTelugu
  16: "x-mac-kannada",
  // smKannada
  17: "x-mac-malayalam",
  // smMalayalam
  18: "x-mac-sinhalese",
  // smSinhalese
  19: "x-mac-burmese",
  // smBurmese
  20: "x-mac-khmer",
  // smKhmer
  21: "x-mac-thai",
  // smThai
  22: "x-mac-lao",
  // smLao
  23: "x-mac-georgian",
  // smGeorgian
  24: "x-mac-armenian",
  // smArmenian
  25: "x-mac-chinesesimp",
  // smSimpChinese
  26: "x-mac-tibetan",
  // smTibetan
  27: "x-mac-mongolian",
  // smMongolian
  28: "x-mac-ethiopic",
  // smEthiopic
  29: "x-mac-ce",
  // smCentralEuroRoman
  30: "x-mac-vietnamese",
  // smVietnamese
  31: "x-mac-extarabic"
  // smExtArabic
};
const macLanguageEncodings = {
  15: "x-mac-icelandic",
  // langIcelandic
  17: "x-mac-turkish",
  // langTurkish
  18: "x-mac-croatian",
  // langCroatian
  24: "x-mac-ce",
  // langLithuanian
  25: "x-mac-ce",
  // langPolish
  26: "x-mac-ce",
  // langHungarian
  27: "x-mac-ce",
  // langEstonian
  28: "x-mac-ce",
  // langLatvian
  30: "x-mac-icelandic",
  // langFaroese
  37: "x-mac-romanian",
  // langRomanian
  38: "x-mac-ce",
  // langCzech
  39: "x-mac-ce",
  // langSlovak
  40: "x-mac-ce",
  // langSlovenian
  143: "x-mac-inuit",
  // langInuktitut
  146: "x-mac-gaelic"
  // langIrishGaelicScript
};
function getEncoding(platformID, encodingID, languageID) {
  switch (platformID) {
    case 0:
      return utf16;
    case 1:
      return macLanguageEncodings[languageID] || macScriptEncodings[encodingID];
    case 3:
      if (encodingID === 1 || encodingID === 10) {
        return utf16;
      }
      break;
  }
  return void 0;
}
function parseNameTable(data, start, ltag) {
  const name = {};
  const p = new parse.Parser(data, start);
  const format = p.parseUShort();
  const count = p.parseUShort();
  const stringOffset = p.offset + p.parseUShort();
  for (let i = 0; i < count; i++) {
    const platformID = p.parseUShort();
    const encodingID = p.parseUShort();
    const languageID = p.parseUShort();
    const nameID = p.parseUShort();
    const property = nameTableNames[nameID] || nameID;
    const byteLength = p.parseUShort();
    const offset = p.parseUShort();
    const language = getLanguageCode(platformID, languageID, ltag);
    const encoding = getEncoding(platformID, encodingID, languageID);
    if (encoding !== void 0 && language !== void 0) {
      let text;
      if (encoding === utf16) {
        text = decode.UTF16(data, stringOffset + offset, byteLength);
      } else {
        text = decode.MACSTRING(data, stringOffset + offset, byteLength, encoding);
      }
      if (text) {
        let translations = name[property];
        if (translations === void 0) {
          translations = name[property] = {};
        }
        translations[language] = text;
      }
    }
  }
  if (format === 1) {
    p.parseUShort();
  }
  return name;
}
function reverseDict(dict) {
  const result = {};
  for (const key in dict) {
    result[dict[key]] = parseInt(key);
  }
  return result;
}
function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
  return new table.Record("NameRecord", [
    { name: "platformID", type: "USHORT", value: platformID },
    { name: "encodingID", type: "USHORT", value: encodingID },
    { name: "languageID", type: "USHORT", value: languageID },
    { name: "nameID", type: "USHORT", value: nameID },
    { name: "length", type: "USHORT", value: length },
    { name: "offset", type: "USHORT", value: offset }
  ]);
}
function findSubArray(needle, haystack) {
  const needleLength = needle.length;
  const limit = haystack.length - needleLength + 1;
  loop:
    for (let pos = 0; pos < limit; pos++) {
      for (; pos < limit; pos++) {
        for (let k = 0; k < needleLength; k++) {
          if (haystack[pos + k] !== needle[k]) {
            continue loop;
          }
        }
        return pos;
      }
    }
  return -1;
}
function addStringToPool(s, pool) {
  let offset = findSubArray(s, pool);
  if (offset < 0) {
    offset = pool.length;
    let i = 0;
    const len = s.length;
    for (; i < len; ++i) {
      pool.push(s[i]);
    }
  }
  return offset;
}
function makeNameTable(names, ltag) {
  let nameID;
  const nameIDs = [];
  const namesWithNumericKeys = {};
  const nameTableIds = reverseDict(nameTableNames);
  for (const key in names) {
    let id = nameTableIds[key];
    if (id === void 0) {
      id = key;
    }
    nameID = parseInt(id);
    if (Number.isNaN(nameID)) {
      throw new Error(`Name table entry "${key}" does not exist, see nameTableNames for complete list.`);
    }
    namesWithNumericKeys[nameID] = names[key];
    nameIDs.push(nameID);
  }
  const macLanguageIds = reverseDict(macLanguages);
  const windowsLanguageIds = reverseDict(windowsLanguages);
  const nameRecords = [];
  const stringPool = [];
  for (let i = 0; i < nameIDs.length; i++) {
    nameID = nameIDs[i];
    const translations = namesWithNumericKeys[nameID];
    for (const lang in translations) {
      const text = translations[lang];
      let macPlatform = 1;
      let macLanguage = macLanguageIds[lang];
      let macScript = macLanguageToScript[macLanguage];
      const macEncoding = getEncoding(macPlatform, macScript, macLanguage);
      let macName = encode.MACSTRING(text, macEncoding);
      if (macName === void 0) {
        macPlatform = 0;
        macLanguage = ltag.indexOf(lang);
        if (macLanguage < 0) {
          macLanguage = ltag.length;
          ltag.push(lang);
        }
        macScript = 4;
        macName = encode.UTF16(text);
      }
      const macNameOffset = addStringToPool(macName, stringPool);
      nameRecords.push(makeNameRecord(
        macPlatform,
        macScript,
        macLanguage,
        nameID,
        macName.length,
        macNameOffset
      ));
      const winLanguage = windowsLanguageIds[lang];
      if (winLanguage !== void 0) {
        const winName = encode.UTF16(text);
        const winNameOffset = addStringToPool(winName, stringPool);
        nameRecords.push(makeNameRecord(
          3,
          1,
          winLanguage,
          nameID,
          winName.length,
          winNameOffset
        ));
      }
    }
  }
  nameRecords.sort((a, b) => a.platformID - b.platformID || a.encodingID - b.encodingID || a.languageID - b.languageID || a.nameID - b.nameID);
  const headerAndRecords = new Array(6 + nameRecords.length * 12);
  headerAndRecords[0] = 0;
  headerAndRecords[1] = 0;
  headerAndRecords[2] = nameRecords.length >> 8 & 255;
  headerAndRecords[3] = nameRecords.length & 255;
  const stringOffset = 6 + nameRecords.length * 12;
  headerAndRecords[4] = stringOffset >> 8 & 255;
  headerAndRecords[5] = stringOffset & 255;
  for (let r = 0; r < nameRecords.length; r++) {
    const rec = nameRecords[r];
    const off = 6 + r * 12;
    headerAndRecords[off] = rec.platformID >> 8 & 255;
    headerAndRecords[off + 1] = rec.platformID & 255;
    headerAndRecords[off + 2] = rec.encodingID >> 8 & 255;
    headerAndRecords[off + 3] = rec.encodingID & 255;
    headerAndRecords[off + 4] = rec.languageID >> 8 & 255;
    headerAndRecords[off + 5] = rec.languageID & 255;
    headerAndRecords[off + 6] = rec.nameID >> 8 & 255;
    headerAndRecords[off + 7] = rec.nameID & 255;
    headerAndRecords[off + 8] = rec.length >> 8 & 255;
    headerAndRecords[off + 9] = rec.length & 255;
    headerAndRecords[off + 10] = rec.offset >> 8 & 255;
    headerAndRecords[off + 11] = rec.offset & 255;
  }
  return new table.Table("name", [
    { name: "header", type: "LITERAL", value: headerAndRecords },
    { name: "strings", type: "LITERAL", value: stringPool }
  ]);
}
const unicodeRanges = [
  { begin: 0, end: 127 },
  // Basic Latin
  { begin: 128, end: 255 },
  // Latin-1 Supplement
  { begin: 256, end: 383 },
  // Latin Extended-A
  { begin: 384, end: 591 },
  // Latin Extended-B
  { begin: 592, end: 687 },
  // IPA Extensions
  { begin: 688, end: 767 },
  // Spacing Modifier Letters
  { begin: 768, end: 879 },
  // Combining Diacritical Marks
  { begin: 880, end: 1023 },
  // Greek and Coptic
  { begin: 11392, end: 11519 },
  // Coptic
  { begin: 1024, end: 1279 },
  // Cyrillic
  { begin: 1328, end: 1423 },
  // Armenian
  { begin: 1424, end: 1535 },
  // Hebrew
  { begin: 42240, end: 42559 },
  // Vai
  { begin: 1536, end: 1791 },
  // Arabic
  { begin: 1984, end: 2047 },
  // NKo
  { begin: 2304, end: 2431 },
  // Devanagari
  { begin: 2432, end: 2559 },
  // Bengali
  { begin: 2560, end: 2687 },
  // Gurmukhi
  { begin: 2688, end: 2815 },
  // Gujarati
  { begin: 2816, end: 2943 },
  // Oriya
  { begin: 2944, end: 3071 },
  // Tamil
  { begin: 3072, end: 3199 },
  // Telugu
  { begin: 3200, end: 3327 },
  // Kannada
  { begin: 3328, end: 3455 },
  // Malayalam
  { begin: 3584, end: 3711 },
  // Thai
  { begin: 3712, end: 3839 },
  // Lao
  { begin: 4256, end: 4351 },
  // Georgian
  { begin: 6912, end: 7039 },
  // Balinese
  { begin: 4352, end: 4607 },
  // Hangul Jamo
  { begin: 7680, end: 7935 },
  // Latin Extended Additional
  { begin: 7936, end: 8191 },
  // Greek Extended
  { begin: 8192, end: 8303 },
  // General Punctuation
  { begin: 8304, end: 8351 },
  // Superscripts And Subscripts
  { begin: 8352, end: 8399 },
  // Currency Symbol
  { begin: 8400, end: 8447 },
  // Combining Diacritical Marks For Symbols
  { begin: 8448, end: 8527 },
  // Letterlike Symbols
  { begin: 8528, end: 8591 },
  // Number Forms
  { begin: 8592, end: 8703 },
  // Arrows
  { begin: 8704, end: 8959 },
  // Mathematical Operators
  { begin: 8960, end: 9215 },
  // Miscellaneous Technical
  { begin: 9216, end: 9279 },
  // Control Pictures
  { begin: 9280, end: 9311 },
  // Optical Character Recognition
  { begin: 9312, end: 9471 },
  // Enclosed Alphanumerics
  { begin: 9472, end: 9599 },
  // Box Drawing
  { begin: 9600, end: 9631 },
  // Block Elements
  { begin: 9632, end: 9727 },
  // Geometric Shapes
  { begin: 9728, end: 9983 },
  // Miscellaneous Symbols
  { begin: 9984, end: 10175 },
  // Dingbats
  { begin: 12288, end: 12351 },
  // CJK Symbols And Punctuation
  { begin: 12352, end: 12447 },
  // Hiragana
  { begin: 12448, end: 12543 },
  // Katakana
  { begin: 12544, end: 12591 },
  // Bopomofo
  { begin: 12592, end: 12687 },
  // Hangul Compatibility Jamo
  { begin: 43072, end: 43135 },
  // Phags-pa
  { begin: 12800, end: 13055 },
  // Enclosed CJK Letters And Months
  { begin: 13056, end: 13311 },
  // CJK Compatibility
  { begin: 44032, end: 55215 },
  // Hangul Syllables
  { begin: 55296, end: 57343 },
  // Non-Plane 0 *
  { begin: 67840, end: 67871 },
  // Phoenicia
  { begin: 19968, end: 40959 },
  // CJK Unified Ideographs
  { begin: 57344, end: 63743 },
  // Private Use Area (plane 0)
  { begin: 12736, end: 12783 },
  // CJK Strokes
  { begin: 64256, end: 64335 },
  // Alphabetic Presentation Forms
  { begin: 64336, end: 65023 },
  // Arabic Presentation Forms-A
  { begin: 65056, end: 65071 },
  // Combining Half Marks
  { begin: 65040, end: 65055 },
  // Vertical Forms
  { begin: 65104, end: 65135 },
  // Small Form Variants
  { begin: 65136, end: 65279 },
  // Arabic Presentation Forms-B
  { begin: 65280, end: 65519 },
  // Halfwidth And Fullwidth Forms
  { begin: 65520, end: 65535 },
  // Specials
  { begin: 3840, end: 4095 },
  // Tibetan
  { begin: 1792, end: 1871 },
  // Syriac
  { begin: 1920, end: 1983 },
  // Thaana
  { begin: 3456, end: 3583 },
  // Sinhala
  { begin: 4096, end: 4255 },
  // Myanmar
  { begin: 4608, end: 4991 },
  // Ethiopic
  { begin: 5024, end: 5119 },
  // Cherokee
  { begin: 5120, end: 5759 },
  // Unified Canadian Aboriginal Syllabics
  { begin: 5760, end: 5791 },
  // Ogham
  { begin: 5792, end: 5887 },
  // Runic
  { begin: 6016, end: 6143 },
  // Khmer
  { begin: 6144, end: 6319 },
  // Mongolian
  { begin: 10240, end: 10495 },
  // Braille Patterns
  { begin: 40960, end: 42127 },
  // Yi Syllables
  { begin: 5888, end: 5919 },
  // Tagalog
  { begin: 66304, end: 66351 },
  // Old Italic
  { begin: 66352, end: 66383 },
  // Gothic
  { begin: 66560, end: 66639 },
  // Deseret
  { begin: 118784, end: 119039 },
  // Byzantine Musical Symbols
  { begin: 119808, end: 120831 },
  // Mathematical Alphanumeric Symbols
  { begin: 1044480, end: 1048573 },
  // Private Use (plane 15)
  { begin: 65024, end: 65039 },
  // Variation Selectors
  { begin: 917504, end: 917631 },
  // Tags
  { begin: 6400, end: 6479 },
  // Limbu
  { begin: 6480, end: 6527 },
  // Tai Le
  { begin: 6528, end: 6623 },
  // New Tai Lue
  { begin: 6656, end: 6687 },
  // Buginese
  { begin: 11264, end: 11359 },
  // Glagolitic
  { begin: 11568, end: 11647 },
  // Tifinagh
  { begin: 19904, end: 19967 },
  // Yijing Hexagram Symbols
  { begin: 43008, end: 43055 },
  // Syloti Nagri
  { begin: 65536, end: 65663 },
  // Linear B Syllabary
  { begin: 65856, end: 65935 },
  // Ancient Greek Numbers
  { begin: 66432, end: 66463 },
  // Ugaritic
  { begin: 66464, end: 66527 },
  // Old Persian
  { begin: 66640, end: 66687 },
  // Shavian
  { begin: 66688, end: 66735 },
  // Osmanya
  { begin: 67584, end: 67647 },
  // Cypriot Syllabary
  { begin: 68096, end: 68191 },
  // Kharoshthi
  { begin: 119552, end: 119647 },
  // Tai Xuan Jing Symbols
  { begin: 73728, end: 74751 },
  // Cuneiform
  { begin: 119648, end: 119679 },
  // Counting Rod Numerals
  { begin: 7040, end: 7103 },
  // Sundanese
  { begin: 7168, end: 7247 },
  // Lepcha
  { begin: 7248, end: 7295 },
  // Ol Chiki
  { begin: 43136, end: 43231 },
  // Saurashtra
  { begin: 43264, end: 43311 },
  // Kayah Li
  { begin: 43312, end: 43359 },
  // Rejang
  { begin: 43520, end: 43615 },
  // Cham
  { begin: 65936, end: 65999 },
  // Ancient Symbols
  { begin: 66e3, end: 66047 },
  // Phaistos Disc
  { begin: 66208, end: 66271 },
  // Carian
  { begin: 127024, end: 127135 }
  // Domino Tiles
];
function getUnicodeRange(unicode) {
  for (let i = 0; i < unicodeRanges.length; i += 1) {
    const range = unicodeRanges[i];
    if (unicode >= range.begin && unicode < range.end) {
      return i;
    }
  }
  return -1;
}
function parseOS2Table(data, start) {
  const os2 = {};
  const p = new parse.Parser(data, start);
  os2.version = p.parseUShort();
  os2.xAvgCharWidth = p.parseShort();
  os2.usWeightClass = p.parseUShort();
  os2.usWidthClass = p.parseUShort();
  os2.fsType = p.parseUShort();
  os2.ySubscriptXSize = p.parseShort();
  os2.ySubscriptYSize = p.parseShort();
  os2.ySubscriptXOffset = p.parseShort();
  os2.ySubscriptYOffset = p.parseShort();
  os2.ySuperscriptXSize = p.parseShort();
  os2.ySuperscriptYSize = p.parseShort();
  os2.ySuperscriptXOffset = p.parseShort();
  os2.ySuperscriptYOffset = p.parseShort();
  os2.yStrikeoutSize = p.parseShort();
  os2.yStrikeoutPosition = p.parseShort();
  os2.sFamilyClass = p.parseShort();
  os2.panose = [];
  for (let i = 0; i < 10; i++) {
    os2.panose[i] = p.parseByte();
  }
  os2.ulUnicodeRange1 = p.parseULong();
  os2.ulUnicodeRange2 = p.parseULong();
  os2.ulUnicodeRange3 = p.parseULong();
  os2.ulUnicodeRange4 = p.parseULong();
  os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
  os2.fsSelection = p.parseUShort();
  os2.usFirstCharIndex = p.parseUShort();
  os2.usLastCharIndex = p.parseUShort();
  os2.sTypoAscender = p.parseShort();
  os2.sTypoDescender = p.parseShort();
  os2.sTypoLineGap = p.parseShort();
  os2.usWinAscent = p.parseUShort();
  os2.usWinDescent = p.parseUShort();
  if (os2.version >= 1) {
    os2.ulCodePageRange1 = p.parseULong();
    os2.ulCodePageRange2 = p.parseULong();
  }
  if (os2.version >= 2) {
    os2.sxHeight = p.parseShort();
    os2.sCapHeight = p.parseShort();
    os2.usDefaultChar = p.parseUShort();
    os2.usBreakChar = p.parseUShort();
    os2.usMaxContent = p.parseUShort();
  }
  return os2;
}
function makeOS2Table(options) {
  const o = options || {};
  const d = new Array(96);
  let p = 0;
  writeUint16(d, p, o.version !== void 0 ? o.version : 3);
  p += 2;
  writeInt16(d, p, o.xAvgCharWidth !== void 0 ? o.xAvgCharWidth : 0);
  p += 2;
  writeUint16(d, p, o.usWeightClass !== void 0 ? o.usWeightClass : 0);
  p += 2;
  writeUint16(d, p, o.usWidthClass !== void 0 ? o.usWidthClass : 0);
  p += 2;
  writeUint16(d, p, o.fsType !== void 0 ? o.fsType : 0);
  p += 2;
  writeInt16(d, p, o.ySubscriptXSize !== void 0 ? o.ySubscriptXSize : 650);
  p += 2;
  writeInt16(d, p, o.ySubscriptYSize !== void 0 ? o.ySubscriptYSize : 699);
  p += 2;
  writeInt16(d, p, o.ySubscriptXOffset !== void 0 ? o.ySubscriptXOffset : 0);
  p += 2;
  writeInt16(d, p, o.ySubscriptYOffset !== void 0 ? o.ySubscriptYOffset : 140);
  p += 2;
  writeInt16(d, p, o.ySuperscriptXSize !== void 0 ? o.ySuperscriptXSize : 650);
  p += 2;
  writeInt16(d, p, o.ySuperscriptYSize !== void 0 ? o.ySuperscriptYSize : 699);
  p += 2;
  writeInt16(d, p, o.ySuperscriptXOffset !== void 0 ? o.ySuperscriptXOffset : 0);
  p += 2;
  writeInt16(d, p, o.ySuperscriptYOffset !== void 0 ? o.ySuperscriptYOffset : 479);
  p += 2;
  writeInt16(d, p, o.yStrikeoutSize !== void 0 ? o.yStrikeoutSize : 49);
  p += 2;
  writeInt16(d, p, o.yStrikeoutPosition !== void 0 ? o.yStrikeoutPosition : 258);
  p += 2;
  writeInt16(d, p, o.sFamilyClass !== void 0 ? o.sFamilyClass : 0);
  p += 2;
  d[p++] = o.bFamilyType !== void 0 ? o.bFamilyType : 0;
  d[p++] = o.bSerifStyle !== void 0 ? o.bSerifStyle : 0;
  d[p++] = o.bWeight !== void 0 ? o.bWeight : 0;
  d[p++] = o.bProportion !== void 0 ? o.bProportion : 0;
  d[p++] = o.bContrast !== void 0 ? o.bContrast : 0;
  d[p++] = o.bStrokeVariation !== void 0 ? o.bStrokeVariation : 0;
  d[p++] = o.bArmStyle !== void 0 ? o.bArmStyle : 0;
  d[p++] = o.bLetterform !== void 0 ? o.bLetterform : 0;
  d[p++] = o.bMidline !== void 0 ? o.bMidline : 0;
  d[p++] = o.bXHeight !== void 0 ? o.bXHeight : 0;
  writeUint32(d, p, o.ulUnicodeRange1 !== void 0 ? o.ulUnicodeRange1 : 0);
  p += 4;
  writeUint32(d, p, o.ulUnicodeRange2 !== void 0 ? o.ulUnicodeRange2 : 0);
  p += 4;
  writeUint32(d, p, o.ulUnicodeRange3 !== void 0 ? o.ulUnicodeRange3 : 0);
  p += 4;
  writeUint32(d, p, o.ulUnicodeRange4 !== void 0 ? o.ulUnicodeRange4 : 0);
  p += 4;
  const vendID = o.achVendID !== void 0 ? o.achVendID : "XXXX";
  for (let i = 0; i < 4; i++) {
    d[p++] = i < vendID.length ? vendID.charCodeAt(i) : 0;
  }
  writeUint16(d, p, o.fsSelection !== void 0 ? o.fsSelection : 0);
  p += 2;
  writeUint16(d, p, o.usFirstCharIndex !== void 0 ? o.usFirstCharIndex : 0);
  p += 2;
  writeUint16(d, p, o.usLastCharIndex !== void 0 ? o.usLastCharIndex : 0);
  p += 2;
  writeInt16(d, p, o.sTypoAscender !== void 0 ? o.sTypoAscender : 0);
  p += 2;
  writeInt16(d, p, o.sTypoDescender !== void 0 ? o.sTypoDescender : 0);
  p += 2;
  writeInt16(d, p, o.sTypoLineGap !== void 0 ? o.sTypoLineGap : 0);
  p += 2;
  writeUint16(d, p, o.usWinAscent !== void 0 ? o.usWinAscent : 0);
  p += 2;
  writeUint16(d, p, o.usWinDescent !== void 0 ? o.usWinDescent : 0);
  p += 2;
  writeUint32(d, p, o.ulCodePageRange1 !== void 0 ? o.ulCodePageRange1 : 0);
  p += 4;
  writeUint32(d, p, o.ulCodePageRange2 !== void 0 ? o.ulCodePageRange2 : 0);
  p += 4;
  writeInt16(d, p, o.sxHeight !== void 0 ? o.sxHeight : 0);
  p += 2;
  writeInt16(d, p, o.sCapHeight !== void 0 ? o.sCapHeight : 0);
  p += 2;
  writeUint16(d, p, o.usDefaultChar !== void 0 ? o.usDefaultChar : 0);
  p += 2;
  writeUint16(d, p, o.usBreakChar !== void 0 ? o.usBreakChar : 0);
  p += 2;
  writeUint16(d, p, o.usMaxContext !== void 0 ? o.usMaxContext : 0);
  p += 2;
  return new table.Table("OS/2", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function parsePostTable(data, start) {
  const post = {};
  const p = new parse.Parser(data, start);
  post.version = p.parseVersion();
  post.italicAngle = p.parseFixed();
  post.underlinePosition = p.parseShort();
  post.underlineThickness = p.parseShort();
  post.isFixedPitch = p.parseULong();
  post.minMemType42 = p.parseULong();
  post.maxMemType42 = p.parseULong();
  post.minMemType1 = p.parseULong();
  post.maxMemType1 = p.parseULong();
  switch (post.version) {
    case 1:
      post.names = standardNames.slice();
      break;
    case 2:
      post.numberOfGlyphs = p.parseUShort();
      post.glyphNameIndex = new Array(post.numberOfGlyphs);
      for (let i = 0; i < post.numberOfGlyphs; i++) {
        post.glyphNameIndex[i] = p.parseUShort();
      }
      post.names = [];
      for (let i = 0; i < post.numberOfGlyphs; i++) {
        if (post.glyphNameIndex[i] >= standardNames.length) {
          const nameLength = p.parseChar();
          post.names.push(p.parseString(nameLength));
        }
      }
      break;
    case 2.5:
      post.numberOfGlyphs = p.parseUShort();
      post.offset = new Array(post.numberOfGlyphs);
      for (let i = 0; i < post.numberOfGlyphs; i++) {
        post.offset[i] = p.parseChar();
      }
      break;
  }
  return post;
}
function makePostTable() {
  const d = new Array(32);
  let p = 0;
  writeUint32(d, p, 196608);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeInt16(d, p, 0);
  p += 2;
  writeInt16(d, p, 0);
  p += 2;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  writeUint32(d, p, 0);
  p += 4;
  return new table.Table("post", [
    { name: "data", type: "LITERAL", value: d }
  ]);
}
function log2(v) {
  return Math.log(v) / Math.log(2) | 0;
}
function computeCheckSum(bytes) {
  let sum = 0;
  const len = bytes.length;
  for (let i = 0; i < len; i += 4) {
    sum += (bytes[i] << 24) + ((bytes[i + 1] || 0) << 16) + ((bytes[i + 2] || 0) << 8) + (bytes[i + 3] || 0);
  }
  sum %= 2 ** 32;
  return sum;
}
function metricsForChar(font, chars, notFoundMetrics) {
  for (let i = 0; i < chars.length; i += 1) {
    const glyphIndex = font.charToGlyphIndex(chars[i]);
    if (glyphIndex > 0) {
      const glyph = font.glyphs.get(glyphIndex);
      return glyph.getMetrics();
    }
  }
  return notFoundMetrics;
}
function fontToSfntTable(font) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  let advanceWidthMax = -Infinity;
  let advanceWidthSum = 0;
  let metricCount = 0;
  let minLeftSideBearing = Infinity;
  let maxLeftSideBearing = -Infinity;
  let minRightSideBearing = Infinity;
  let firstCharIndex;
  let lastCharIndex = 0;
  let ulUnicodeRange1 = 0;
  let ulUnicodeRange2 = 0;
  let ulUnicodeRange3 = 0;
  let ulUnicodeRange4 = 0;
  for (let i = 0; i < font.glyphs.length; i += 1) {
    const glyph = font.glyphs.get(i);
    const unicode = glyph.unicode | 0;
    if (typeof glyph.advanceWidth !== "number") {
      throw new Error(`Glyph ${glyph.name} (${i}): advanceWidth is not a number.`);
    }
    if (firstCharIndex > unicode || firstCharIndex === void 0) {
      if (unicode > 0) {
        firstCharIndex = unicode;
      }
    }
    if (lastCharIndex < unicode) {
      lastCharIndex = unicode;
    }
    const position = getUnicodeRange(unicode);
    if (position < 32) {
      ulUnicodeRange1 |= 1 << position;
    } else if (position < 64) {
      ulUnicodeRange2 |= 1 << position - 32;
    } else if (position < 96) {
      ulUnicodeRange3 |= 1 << position - 64;
    } else if (position < 123) {
      ulUnicodeRange4 |= 1 << position - 96;
    } else {
      throw new Error("Unicode ranges bits > 123 are reserved for internal usage");
    }
    if (glyph.name === ".notdef") continue;
    const metrics = glyph.getMetrics();
    const glyphXMin = glyph._xMin !== void 0 ? glyph._xMin : metrics.xMin;
    const glyphYMin = glyph._yMin !== void 0 ? glyph._yMin : metrics.yMin;
    const glyphXMax = glyph._xMax !== void 0 ? glyph._xMax : metrics.xMax;
    const glyphYMax = glyph._yMax !== void 0 ? glyph._yMax : metrics.yMax;
    const { leftSideBearing, rightSideBearing } = metrics;
    const { advanceWidth } = glyph;
    if (glyphXMin < xMin) xMin = glyphXMin;
    if (glyphYMin < yMin) yMin = glyphYMin;
    if (glyphXMax > xMax) xMax = glyphXMax;
    if (glyphYMax > yMax) yMax = glyphYMax;
    if (leftSideBearing < minLeftSideBearing) minLeftSideBearing = leftSideBearing;
    if (leftSideBearing > maxLeftSideBearing) maxLeftSideBearing = leftSideBearing;
    if (rightSideBearing < minRightSideBearing) minRightSideBearing = rightSideBearing;
    if (advanceWidth > advanceWidthMax) advanceWidthMax = advanceWidth;
    advanceWidthSum += advanceWidth;
    metricCount += 1;
  }
  const globals = {
    xMin,
    yMin,
    xMax,
    yMax,
    advanceWidthMax,
    advanceWidthAvg: advanceWidthSum / metricCount,
    minLeftSideBearing,
    maxLeftSideBearing,
    minRightSideBearing
  };
  globals.ascender = font.ascender;
  globals.descender = font.descender;
  const headOptions = {
    flags: 3,
    // 00000011 (baseline for font at y=0; left sidebearing point at x=0)
    unitsPerEm: font.unitsPerEm,
    xMin: globals.xMin,
    yMin: globals.yMin,
    xMax: globals.xMax,
    yMax: globals.yMax,
    lowestRecPPEM: 3,
    createdTimestamp: font.createdTimestamp
  };
  const isTrueType = font.outlinesFormat === "truetype";
  let glyfResult;
  if (isTrueType) {
    glyfResult = makeGlyfTable(font.glyphs);
    headOptions.indexToLocFormat = glyfResult.indexToLocFormat;
  }
  const headTable = makeHeadTable(headOptions);
  const hheaTable = makeHheaTable({
    ascender: globals.ascender,
    descender: globals.descender,
    advanceWidthMax: globals.advanceWidthMax,
    minLeftSideBearing: globals.minLeftSideBearing,
    minRightSideBearing: globals.minRightSideBearing,
    xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
    numberOfHMetrics: font.glyphs.length
  });
  let hintingMetrics = null;
  if (isTrueType && font.tables.maxp) {
    const m = font.tables.maxp;
    hintingMetrics = {
      maxZones: m.maxZones || 1,
      maxTwilightPoints: m.maxTwilightPoints || 0,
      maxStorage: m.maxStorage || 0,
      maxFunctionDefs: m.maxFunctionDefs || 0,
      maxInstructionDefs: m.maxInstructionDefs || 0,
      maxStackElements: m.maxStackElements || 0,
      maxSizeOfInstructions: Math.max(
        glyfResult.maxSizeOfInstructions || 0,
        m.maxSizeOfInstructions || 0,
        font.tables.fpgm ? font.tables.fpgm.length : 0,
        font.tables.prep ? font.tables.prep.length : 0
      )
    };
  }
  const maxpTable = isTrueType ? makeMaxpTableTrueType(
    font.glyphs.length,
    glyfResult.maxPoints,
    glyfResult.maxContours,
    glyfResult.maxCompositePoints,
    glyfResult.maxCompositeContours,
    glyfResult.maxComponentElements,
    glyfResult.maxComponentDepth,
    hintingMetrics
  ) : makeMaxpTable(font.glyphs.length);
  const os2Table = makeOS2Table({
    xAvgCharWidth: Math.round(globals.advanceWidthAvg),
    usFirstCharIndex: firstCharIndex,
    usLastCharIndex: lastCharIndex,
    ulUnicodeRange1,
    ulUnicodeRange2,
    ulUnicodeRange3,
    ulUnicodeRange4,
    // See http://typophile.com/node/13081 for more info on vertical metrics.
    // We get metrics for typical characters (such as "x" for xHeight).
    // We provide some fallback characters if characters are unavailable: their
    // ordering was chosen experimentally.
    sTypoAscender: globals.ascender,
    sTypoDescender: globals.descender,
    sTypoLineGap: 0,
    usWinAscent: globals.yMax,
    usWinDescent: Math.abs(globals.yMin),
    ulCodePageRange1: 1,
    // FIXME: hard-code Latin 1 support for now
    sxHeight: metricsForChar(font, "xyvw", { yMax: Math.round(globals.ascender / 2) }).yMax,
    sCapHeight: metricsForChar(font, "HIKLEFJMNTZBDPRAGOQSUVWXY", globals).yMax,
    usDefaultChar: font.hasChar(" ") ? 32 : 0,
    // Use space as the default character, if available.
    usBreakChar: font.hasChar(" ") ? 32 : 0,
    // Use space as the break character, if available.
    ...font.tables.os2
  });
  const hmtxTable = makeHmtxTable(font.glyphs);
  const cmapTable = makeCmapTable(font.glyphs);
  const englishFamilyName = font.getEnglishName("fontFamily");
  const englishStyleName = font.getEnglishName("fontSubfamily");
  const englishFullName = `${englishFamilyName} ${englishStyleName}`;
  let postScriptName = font.getEnglishName("postScriptName");
  if (!postScriptName) {
    postScriptName = `${englishFamilyName.replace(/\s/g, "")}-${englishStyleName}`;
  }
  const names = {};
  for (const n in font.names) {
    names[n] = font.names[n];
  }
  if (!names.uniqueID) {
    names.uniqueID = { en: `${font.getEnglishName("manufacturer")}:${englishFullName}` };
  }
  if (!names.postScriptName) {
    names.postScriptName = { en: postScriptName };
  }
  if (!names.preferredFamily) {
    names.preferredFamily = font.names.fontFamily;
  }
  if (!names.preferredSubfamily) {
    names.preferredSubfamily = font.names.fontSubfamily;
  }
  const languageTags = [];
  const nameTable = makeNameTable(names, languageTags);
  const ltagTable = languageTags.length > 0 ? makeLtagTable(languageTags) : void 0;
  const postTable = makePostTable();
  const metaTable = font.metas && Object.keys(font.metas).length > 0 ? makeMetaTable(font.metas) : void 0;
  const tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, hmtxTable];
  if (isTrueType) {
    tables.push(glyfResult.glyfTable, glyfResult.locaTable);
    if (font.tables.cvt) {
      const cvtData = [];
      for (let i = 0; i < font.tables.cvt.length; i++) {
        pushInt16(cvtData, font.tables.cvt[i]);
      }
      tables.push(new table.Table("cvt ", [{ name: "data", type: "LITERAL", value: cvtData }]));
    }
    if (font.tables.fpgm) {
      tables.push(new table.Table("fpgm", [{ name: "data", type: "LITERAL", value: font.tables.fpgm }]));
    }
    if (font.tables.prep) {
      tables.push(new table.Table("prep", [{ name: "data", type: "LITERAL", value: font.tables.prep }]));
    }
  } else {
    tables.push(makeCFFTable(font.glyphs, {
      version: font.getEnglishName("version"),
      fullName: englishFullName,
      familyName: englishFamilyName,
      weightName: englishStyleName,
      postScriptName,
      unitsPerEm: font.unitsPerEm,
      fontBBox: [0, globals.yMin, globals.ascender, globals.advanceWidthMax]
    }));
  }
  if (ltagTable) {
    tables.push(ltagTable);
  }
  if (font.tables.gsub) {
    tables.push(makeGsubTable(font.tables.gsub));
  }
  if (font.kerningPairs && Object.keys(font.kerningPairs).length > 0) {
    tables.push(makeGposTable(font.kerningPairs));
  }
  if (font.tables.cpal) {
    tables.push(makeCpalTable(font.tables.cpal));
  }
  if (font.tables.colr) {
    tables.push(makeColrTable(font.tables.colr));
  }
  if (metaTable) {
    tables.push(metaTable);
  }
  const encodedTables = [];
  for (let i = 0; i < tables.length; i += 1) {
    const t = tables[i];
    check.argument(t.tableName.length === 4, `Table name${t.tableName} is invalid.`);
    const bytes = t.encode();
    encodedTables.push({
      tag: t.tableName,
      bytes,
      checkSum: computeCheckSum(bytes),
      length: bytes.length
    });
  }
  encodedTables.sort((a, b) => {
    if (a.tag > b.tag) {
      return 1;
    }
    return -1;
  });
  const numTables = encodedTables.length;
  const highestPowerOf2 = 2 ** log2(numTables);
  const searchRange2 = 16 * highestPowerOf2;
  const entrySelector = log2(highestPowerOf2);
  const rangeShift = numTables * 16 - searchRange2;
  const headerSize = 12;
  const directorySize = numTables * 16;
  let dataOffset = headerSize + directorySize;
  while (dataOffset % 4 !== 0) {
    dataOffset += 1;
  }
  const tableOffsets = [];
  let totalSize = dataOffset;
  for (let i = 0; i < encodedTables.length; i += 1) {
    tableOffsets.push(totalSize);
    totalSize += encodedTables[i].length;
    while (totalSize % 4 !== 0) {
      totalSize += 1;
    }
  }
  const result = new Uint8Array(totalSize);
  const view = new DataView(result.buffer);
  if (isTrueType) {
    result[0] = 0;
    result[1] = 1;
    result[2] = 0;
    result[3] = 0;
  } else {
    result[0] = 79;
    result[1] = 84;
    result[2] = 84;
    result[3] = 79;
  }
  view.setUint16(4, numTables);
  view.setUint16(6, searchRange2);
  view.setUint16(8, entrySelector);
  view.setUint16(10, rangeShift);
  let headTableOffset = -1;
  for (let i = 0; i < numTables; i += 1) {
    const t = encodedTables[i];
    const recordOffset = headerSize + i * 16;
    for (let j = 0; j < 4; j += 1) {
      result[recordOffset + j] = t.tag.charCodeAt(j);
    }
    view.setUint32(recordOffset + 4, t.checkSum);
    view.setUint32(recordOffset + 8, tableOffsets[i]);
    view.setUint32(recordOffset + 12, t.length);
    result.set(t.bytes, tableOffsets[i]);
    if (t.tag === "head") {
      headTableOffset = tableOffsets[i];
    }
  }
  check.argument(headTableOffset >= 0, "Could not find head table with checkSum to adjust.");
  const fontCheckSum = computeCheckSumFromUint8Array(result);
  view.setUint32(headTableOffset + 8, 2981146554 - fontCheckSum >>> 0);
  return result;
}
function computeCheckSumFromUint8Array(bytes) {
  let sum = 0;
  const len = bytes.length;
  for (let i = 0; i < len; i += 4) {
    sum += (bytes[i] << 24) + ((bytes[i + 1] || 0) << 16) + ((bytes[i + 2] || 0) << 8) + (bytes[i + 3] || 0);
  }
  sum %= 2 ** 32;
  return sum;
}
function parseOpenTypeTableEntries(data, numTables) {
  const tableEntries = [];
  let p = 12;
  for (let i = 0; i < numTables; i += 1) {
    const tag = parse.getTag(data, p);
    const checksum = parse.getULong(data, p + 4);
    const offset = parse.getULong(data, p + 8);
    const length = parse.getULong(data, p + 12);
    tableEntries.push({
      tag,
      checksum,
      offset,
      length,
      compression: false
    });
    p += 16;
  }
  return tableEntries;
}
function readSfntTableDirectory(data) {
  const dir = {};
  if (!data || data.byteLength < 12) return dir;
  const sfntVersion = data.getUint32(0);
  if (sfntVersion !== 65536 && sfntVersion !== 1953658213 && sfntVersion !== 1330926671) return dir;
  const numTables = data.getUint16(4);
  if (numTables === 0 || 12 + numTables * 16 > data.byteLength) return dir;
  for (const entry of parseOpenTypeTableEntries(data, numTables)) {
    dir[entry.tag] = { offset: entry.offset, length: entry.length };
  }
  return dir;
}
function parseWOFFTableEntries(data, numTables) {
  const tableEntries = [];
  let p = 44;
  for (let i = 0; i < numTables; i += 1) {
    const tag = parse.getTag(data, p);
    const offset = parse.getULong(data, p + 4);
    const compLength = parse.getULong(data, p + 8);
    const origLength = parse.getULong(data, p + 12);
    let compression;
    if (compLength < origLength) {
      compression = "WOFF";
    } else {
      compression = false;
    }
    tableEntries.push({
      tag,
      offset,
      compression,
      compressedLength: compLength,
      length: origLength
    });
    p += 20;
  }
  return tableEntries;
}
function uncompressTable(data, tableEntry) {
  if (tableEntry.compression === "WOFF") {
    const inBuffer = new Uint8Array(data.buffer, tableEntry.offset + 2, tableEntry.compressedLength - 2);
    const outBuffer = inflateRaw(inBuffer);
    if (outBuffer.byteLength !== tableEntry.length) {
      throw new Error(`Decompression error: ${tableEntry.tag} decompressed length doesn't match recorded length`);
    }
    const view = new DataView(outBuffer.buffer, 0);
    return { data: view, offset: 0 };
  }
  return { data, offset: tableEntry.offset };
}
function parseBuffer(buffer, options = {}) {
  const skipTables = options.skipTables ? new Set(options.skipTables) : null;
  let indexToLocFormat;
  let ltagTable;
  const font = new Font({ empty: true });
  const data = new DataView(buffer, 0);
  let numTables;
  let tableEntries = [];
  const signature = parse.getTag(data, 0);
  if (signature === String.fromCharCode(0, 1, 0, 0) || signature === "true" || signature === "typ1") {
    font.outlinesFormat = "truetype";
    numTables = parse.getUShort(data, 4);
    tableEntries = parseOpenTypeTableEntries(data, numTables);
  } else if (signature === "OTTO") {
    font.outlinesFormat = "cff";
    numTables = parse.getUShort(data, 4);
    tableEntries = parseOpenTypeTableEntries(data, numTables);
  } else if (signature === "wOFF") {
    const flavor = parse.getTag(data, 4);
    if (flavor === String.fromCharCode(0, 1, 0, 0)) {
      font.outlinesFormat = "truetype";
    } else if (flavor === "OTTO") {
      font.outlinesFormat = "cff";
    } else {
      throw new Error(`Unsupported OpenType flavor ${signature}`);
    }
    numTables = parse.getUShort(data, 12);
    tableEntries = parseWOFFTableEntries(data, numTables);
  } else {
    throw new Error(`Unsupported OpenType signature ${signature}`);
  }
  let cffTableEntry;
  let glyfTableEntry;
  let gposTableEntry;
  let gsubTableEntry;
  let hmtxTableEntry;
  let kernTableEntry;
  let locaTableEntry;
  let nameTableEntry;
  let metaTableEntry;
  let p;
  for (let i = 0; i < numTables; i += 1) {
    const tableEntry = tableEntries[i];
    if (skipTables && skipTables.has(tableEntry.tag)) continue;
    let table2;
    switch (tableEntry.tag) {
      case "cmap":
        table2 = uncompressTable(data, tableEntry);
        font.tables.cmap = parseCmapTable(table2.data, table2.offset);
        font.encoding = new CmapEncoding(font.tables.cmap);
        break;
      case "cvt ":
        table2 = uncompressTable(data, tableEntry);
        p = new parse.Parser(table2.data, table2.offset);
        font.tables.cvt = p.parseShortList(tableEntry.length / 2);
        break;
      case "fpgm":
        table2 = uncompressTable(data, tableEntry);
        p = new parse.Parser(table2.data, table2.offset);
        font.tables.fpgm = p.parseByteList(tableEntry.length);
        break;
      case "head":
        table2 = uncompressTable(data, tableEntry);
        font.tables.head = parseHeadTable(table2.data, table2.offset);
        font.unitsPerEm = font.tables.head.unitsPerEm;
        indexToLocFormat = font.tables.head.indexToLocFormat;
        break;
      case "hhea":
        table2 = uncompressTable(data, tableEntry);
        font.tables.hhea = parseHheaTable(table2.data, table2.offset);
        font.ascender = font.tables.hhea.ascender;
        font.descender = font.tables.hhea.descender;
        font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
        break;
      case "hmtx":
        hmtxTableEntry = tableEntry;
        break;
      case "ltag":
        table2 = uncompressTable(data, tableEntry);
        ltagTable = parseLtagTable(table2.data, table2.offset);
        break;
      case "COLR":
        table2 = uncompressTable(data, tableEntry);
        font.tables.colr = parseColrTable(table2.data, table2.offset);
        break;
      case "CPAL":
        table2 = uncompressTable(data, tableEntry);
        font.tables.cpal = parseCpalTable(table2.data, table2.offset);
        break;
      case "maxp":
        table2 = uncompressTable(data, tableEntry);
        font.tables.maxp = parseMaxpTable(table2.data, table2.offset);
        font.numGlyphs = font.tables.maxp.numGlyphs;
        break;
      case "name":
        nameTableEntry = tableEntry;
        break;
      case "OS/2":
        table2 = uncompressTable(data, tableEntry);
        font.tables.os2 = parseOS2Table(table2.data, table2.offset);
        break;
      case "post":
        table2 = uncompressTable(data, tableEntry);
        font.tables.post = parsePostTable(table2.data, table2.offset);
        {
          const post = font.tables.post;
          let glyphNames;
          switch (post.version) {
            case 1:
              glyphNames = standardNames.slice();
              break;
            case 2:
              glyphNames = new Array(post.numberOfGlyphs);
              for (let j = 0; j < post.numberOfGlyphs; j++) {
                if (post.glyphNameIndex[j] < standardNames.length) {
                  glyphNames[j] = standardNames[post.glyphNameIndex[j]];
                } else {
                  glyphNames[j] = post.names[post.glyphNameIndex[j] - standardNames.length];
                }
              }
              break;
            case 2.5:
              glyphNames = new Array(post.numberOfGlyphs);
              for (let j = 0; j < post.numberOfGlyphs; j++) {
                glyphNames[j] = standardNames[j + post.glyphNameIndex[j]];
              }
              break;
            default:
              glyphNames = [];
              break;
          }
          font.glyphNames = { names: glyphNames };
        }
        break;
      case "prep":
        table2 = uncompressTable(data, tableEntry);
        p = new parse.Parser(table2.data, table2.offset);
        font.tables.prep = p.parseByteList(tableEntry.length);
        break;
      case "glyf":
        glyfTableEntry = tableEntry;
        break;
      case "loca":
        locaTableEntry = tableEntry;
        break;
      case "CFF ":
        cffTableEntry = tableEntry;
        break;
      case "kern":
        kernTableEntry = tableEntry;
        break;
      case "GPOS":
        gposTableEntry = tableEntry;
        break;
      case "GSUB":
        gsubTableEntry = tableEntry;
        break;
      case "meta":
        metaTableEntry = tableEntry;
        break;
    }
  }
  const nameTable = uncompressTable(data, nameTableEntry);
  font.tables.name = parseNameTable(nameTable.data, nameTable.offset, ltagTable);
  font.names = font.tables.name;
  if (glyfTableEntry && locaTableEntry) {
    const shortVersion = indexToLocFormat === 0;
    const locaTable = uncompressTable(data, locaTableEntry);
    const locaOffsets = parseLocaTable(locaTable.data, locaTable.offset, font.numGlyphs, shortVersion);
    const glyfTable = uncompressTable(data, glyfTableEntry);
    font.glyphs = parseGlyfTable(glyfTable.data, glyfTable.offset, locaOffsets, font);
  } else if (cffTableEntry) {
    const cffTable = uncompressTable(data, cffTableEntry);
    parseCFFTable(cffTable.data, cffTable.offset, font);
  } else {
    throw new Error("Font doesn't contain TrueType or CFF outlines.");
  }
  const hmtxTable = uncompressTable(data, hmtxTableEntry);
  parseHmtxTable(hmtxTable.data, hmtxTable.offset, font.numberOfHMetrics, font.numGlyphs, font.glyphs, hmtxTableEntry.length);
  addGlyphNames(font);
  if (kernTableEntry) {
    const kernTable = uncompressTable(data, kernTableEntry);
    font.kerningPairs = parseKernTable(kernTable.data, kernTable.offset);
  } else {
    font.kerningPairs = {};
  }
  if (gposTableEntry) {
    const gposTable = uncompressTable(data, gposTableEntry);
    font.tables.gpos = parseGposTable(gposTable.data, gposTable.offset);
    font.position.init();
  }
  if (gsubTableEntry) {
    const gsubTable = uncompressTable(data, gsubTableEntry);
    font.tables.gsub = parseGsubTable(gsubTable.data, gsubTable.offset);
  }
  if (metaTableEntry) {
    const metaTable = uncompressTable(data, metaTableEntry);
    font.tables.meta = parseMetaTable(metaTable.data, metaTable.offset);
    font.metas = font.tables.meta;
  }
  return font;
}
Font.prototype.toTables = function() {
  return fontToSfntTable(this);
};
Font.prototype.toArrayBuffer = function() {
  const bytes = this.toTables();
  return bytes.buffer;
};
var opentype = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  BoundingBox,
  Font,
  Glyph,
  Path,
  getPath,
  getUnicodeRange,
  makeCmapTable,
  makeColrTable,
  makeCpalTable,
  makeGlyfTable,
  makeGposTable,
  makeGsubTable,
  makeHeadTable,
  makeHheaTable,
  makeHmtxTable,
  makeLtagTable,
  makeMaxpTable,
  makeMaxpTableTrueType,
  makeMetaTable,
  makeNameTable,
  makeOS2Table,
  makePostTable,
  parse: parseBuffer,
  parseCFFTable,
  parseCmapTable,
  parseColrTable,
  parseCpalTable,
  parseGlyfTable,
  parseGposTable,
  parseGsubTable,
  parseHeadTable,
  parseHheaTable,
  parseHmtxTable,
  parseKernTable,
  parseLocaTable,
  parseLtagTable,
  parseMaxpTable,
  parseMetaTable,
  parseNameTable,
  parseOS2Table,
  parsePostTable,
  parseType1Font,
  readSfntTableDirectory
});
function getFontSize(fontOpentype2, heightActual, text) {
  const textArr = text.split("");
  const charMetricsFirst = fontOpentype2.charToGlyph(textArr[0]).getMetrics();
  let yMin = charMetricsFirst.yMin;
  let yMax = charMetricsFirst.yMax;
  for (let i = 1; i < textArr.length; i++) {
    const charMetrics = fontOpentype2.charToGlyph(textArr[i]).getMetrics();
    if (charMetrics.yMin < yMin) yMin = charMetrics.yMin;
    if (charMetrics.yMax > yMax) yMax = charMetrics.yMax;
  }
  const textHeight = (yMax - yMin) * (1 / fontOpentype2.unitsPerEm);
  if (!(textHeight > 0)) return null;
  return Math.round(heightActual / textHeight);
}
function calcWordFontSizePrecise(wordArr, fontOpentype2, nonLatin = false) {
  if (wordArr[0].chars && wordArr[0].chars.length > 0) {
    const charArr = wordArr.map((x) => x.chars).flat();
    const charArrFiltered = nonLatin ? charArr.filter((x) => x && x.bbox.bottom - x.bbox.top > 5) : charArr.filter((x) => x && /[A-Za-z0-9]/.test(x.text));
    const fontSizeCharArr = charArrFiltered.map((x) => getFontSize(fontOpentype2, x.bbox.bottom - x.bbox.top, x.text)).filter((size) => size !== null);
    const fontSizeCharMedian = quantile(fontSizeCharArr, 0.5);
    return fontSizeCharMedian;
  }
  const wordArrFiltered = nonLatin ? wordArr.filter((x) => x && x.bbox.bottom - x.bbox.top > 5) : wordArr.filter((x) => x && /[A-Za-z0-9]/.test(x.text));
  const fontSizeWordArr = wordArrFiltered.map((x) => getFontSize(fontOpentype2, x.bbox.bottom - x.bbox.top, x.text)).filter((size) => size !== null);
  const fontSizeWordMedian = quantile(fontSizeWordArr, 0.5);
  return fontSizeWordMedian;
}
function addLigatures(word, docFonts, settings) {
  if (word.style.smallCaps || word.styleRuns || true) return word.text.split("");
}
const missingGlyphs = {};
function calcWordCharMetrics(wordText, fontOpentype2, settings) {
  const wordTextArr = typeof wordText === "string" ? wordText.split("") : wordText;
  const advanceArr = [];
  const kerningArr = [];
  for (let i = 0; i < wordTextArr.length; i++) {
    const charI = wordTextArr[i];
    const charJ = wordTextArr[i + 1];
    const glyphI = fontOpentype2.charToGlyph(charI);
    const fontName = fontOpentype2.tables?.name?.postScriptName?.en || "unknown";
    if (!glyphI || glyphI.name === ".notdef") {
      if (!missingGlyphs[fontName]) missingGlyphs[fontName] = /* @__PURE__ */ new Set();
      if (!missingGlyphs[fontName].has(charI)) {
        missingGlyphs[fontName].add(charI);
        console.log(`Character ${charI} is not defined in font ${fontName}`);
      }
    }
    advanceArr.push(glyphI.advanceWidth);
    if (charJ) {
      {
        const glyphJ = fontOpentype2.charToGlyph(charJ);
        const kerningVal = fontOpentype2.getKerningValue(glyphI, glyphJ);
        kerningArr.push(kerningVal);
      }
    }
  }
  return { advanceArr, kerningArr };
}
function calcWordMetrics(word, docFonts, angle = 0, settings) {
  const fontI = docFonts.getWordFont(word);
  const fontOpentype2 = fontI.opentype;
  const fontSize = calcWordFontSize(word, docFonts);
  const charArr = addLigatures(word);
  const charArr2 = word.style.smallCaps ? charArr.map((x) => x.toUpperCase()) : charArr;
  const { advanceArr, kerningArr } = calcWordCharMetrics(charArr2, fontOpentype2);
  if (word.style.smallCaps) {
    for (let i = 0; i < charArr2.length; i++) {
      if (charArr2[i] !== charArr[i]) {
        advanceArr[i] *= fontI.smallCapsMult;
        if (kerningArr[i]) kerningArr[i] *= fontI.smallCapsMult;
      }
    }
  }
  const advanceTotal = advanceArr.reduce((a, b) => a + b, 0);
  const kerningTotal = kerningArr.reduce((a, b) => a + b, 0);
  const wordWidth1 = advanceTotal + kerningTotal;
  const wordLastGlyphMetrics = fontOpentype2.charToGlyph(charArr2.at(-1)).getMetrics();
  const wordFirstGlyphMetrics = fontOpentype2.charToGlyph(charArr2[0]).getMetrics();
  let wordLeftBearing = wordFirstGlyphMetrics.xMin || 0;
  let lastGlyphMax = wordLastGlyphMetrics.xMax || 0;
  if (word.style.smallCaps && charArr2[charArr2.length - 1] !== charArr[charArr2.length - 1]) lastGlyphMax *= fontI.smallCapsMult;
  let wordRightBearing = advanceArr[advanceArr.length - 1] - lastGlyphMax;
  if (word.style.smallCaps && charArr2[0] !== charArr[0]) wordLeftBearing *= fontI.smallCapsMult;
  if (word.style.smallCaps && charArr2[charArr2.length - 1] !== charArr[charArr2.length - 1]) wordRightBearing *= fontI.smallCapsMult;
  const wordWidth = word.visualCoords ? wordWidth1 - wordRightBearing - wordLeftBearing : wordWidth1;
  const wordWidthPx = wordWidth * (fontSize / fontOpentype2.unitsPerEm);
  const wordLeftBearingPx = wordLeftBearing * (fontSize / fontOpentype2.unitsPerEm);
  const wordRightBearingPx = wordRightBearing * (fontSize / fontOpentype2.unitsPerEm);
  const advanceArrPx = advanceArr.map((x) => x * (fontSize / fontOpentype2.unitsPerEm));
  const kerningArrPx = kerningArr.map((x) => x * (fontSize / fontOpentype2.unitsPerEm));
  let charSpacing = 0;
  if (charArr2.length > 1) {
    const cosAngle = Math.cos(angle * (Math.PI / 180));
    const actualWidth = (word.bbox.right - word.bbox.left) / cosAngle / 1;
    charSpacing = Math.round((actualWidth - wordWidthPx) / (charArr2.length - 1) * 1e6) / 1e6;
  }
  return {
    visualWidth: wordWidthPx,
    leftSideBearing: wordLeftBearingPx,
    rightSideBearing: wordRightBearingPx,
    advanceArr: advanceArrPx,
    kerningArr: kerningArrPx,
    charSpacing,
    font: fontI,
    fontSize,
    charArr
  };
}
const calcWordFontSize = (word, docFonts) => {
  const font = docFonts.getWordFont(word);
  const fontOpentype2 = font.opentype;
  if (word.style.sup || word.style.dropcap) {
    if (word.visualCoords) {
      const sizeMeasured = getFontSize(fontOpentype2, word.bbox.bottom - word.bbox.top, word.text);
      if (sizeMeasured) return sizeMeasured;
    }
    if (word.style.size) {
      return word.style.size;
    }
    return (word.bbox.bottom - word.bbox.top) * (fontOpentype2.unitsPerEm / (fontOpentype2.ascender - fontOpentype2.descender));
  }
  if (word.style.size) {
    return word.style.size;
  }
  const lineFontSize = calcLineFontSize(word.line, docFonts);
  if (lineFontSize) return lineFontSize;
  return 12;
};
const calcLineFontSize = (line, docFonts) => {
  const nonLatin = line.words[0]?.lang === "chi_sim";
  const font = docFonts.getWordFont(line.words[0]);
  if (!font) {
    const linePrev2 = getPrevLine(line);
    if (linePrev2) {
      return calcLineFontSize(linePrev2, docFonts);
    }
    return 15;
  }
  const fontOpentype2 = font.opentype;
  if (line.words.length <= 3 && line.words[0].chars && line.words[0].chars.length > 0 || nonLatin) {
    const fontSizeCalc = calcWordFontSizePrecise(line.words, fontOpentype2, nonLatin);
    if (fontSizeCalc && fontSizeCalc > 0) {
      return fontSizeCalc;
    }
  }
  const size1 = line.ascHeight ? getFontSize(fontOpentype2, line.ascHeight, "A") : null;
  const size2 = line.xHeight ? getFontSize(fontOpentype2, line.xHeight, "o") : null;
  if (size1 && size2) {
    let sizeFinal = Math.floor((size1 + size2) / 2);
    if (Math.max(size1, size2) / Math.min(size1, size2) > 1.2) {
      const linePrev2 = getPrevLine(line);
      if (linePrev2) {
        const sizeLast = calcLineFontSize(linePrev2, docFonts);
        if (sizeLast && (Math.max(size1, sizeLast) / Math.min(size1, sizeLast) <= 1.2 || Math.max(sizeLast, size2) / Math.min(sizeLast, size2) <= 1.2)) {
          if (Math.abs(sizeLast - size2) < Math.abs(sizeLast - size1)) {
            sizeFinal = Math.floor((sizeLast + size2) / 2);
          } else {
            sizeFinal = Math.floor((sizeLast + size1) / 2);
          }
        }
      }
    }
    return sizeFinal;
  }
  if (!size1 && size2) return size2;
  if (size1 && !size2) return size1;
  const linePrev = getPrevLine(line);
  if (linePrev) {
    return calcLineFontSize(linePrev, docFonts);
  }
  return 15;
};
async function convertPageHocr({
  ocrStr,
  n,
  pageDims = null,
  scribeMode = false
}) {
  let currentLang = "eng";
  const angleRisePage = [];
  const lineLeft = [];
  const lineTop = [];
  if (!pageDims) {
    const pageElement = ocrStr.match(/<div class=["']ocr_page["'][^>]+/i);
    if (pageElement != null) {
      const pageDimsMatch = pageElement[0].match(/bbox \d+ \d+ (\d+) (\d+)/i);
      if (pageDimsMatch != null) {
        pageDims = { height: parseInt(pageDimsMatch[2]), width: parseInt(pageDimsMatch[1]) };
      }
    }
  }
  if (!pageDims) throw new Error("Failed to parse page dimensions.");
  const pageObj = new ocr.OcrPage(n, pageDims);
  const charMode = !!/ocrx_cinfo/.test(ocrStr);
  let lineRegex = /<span class=["']ocr_line[\s\S]+?(?:<\/span>\s*){2}/ig;
  if (charMode) {
    lineRegex = /<span class=["']ocr_line[\s\S]+?(?:<\/span>\s*)(?:<\/em>\s*)?(?:<\/span>\s*){2}/ig;
  }
  const wordRegexCharLevel = /<span class=["']ocrx_word[\s\S]+?(?:<\/span>\s*)(?:<\/em>\s*)?(?:<\/span>\s*){1}/ig;
  const wordRegex = /<span class=["']ocrx_word[\s\S]+?(?:<\/span>\s*)/ig;
  const charRegex = /<span class=["']ocrx_cinfo["'] title='([^'"]+)["']>([^<]*)<\/span>/ig;
  ocrStr = ocrStr.replaceAll(/<\/?strong>/ig, "");
  ocrStr = ocrStr.replaceAll(/<\/?em>/ig, "");
  ocrStr = ocrStr.replace(/<html[^>]*>/i, "<html>");
  ocrStr = ocrStr.replace(/(class=')ocr_caption/ig, "$1ocr_line");
  ocrStr = ocrStr.replace(/(class=')ocr_textfloat/ig, "$1ocr_line");
  ocrStr = ocrStr.replace(/(class=')ocr_header/ig, "$1ocr_line");
  const lstmChoiceMode1 = !!/id='timestep1/.test(ocrStr);
  const lstmChoiceMode2 = !!/id='lstm_choices/.test(ocrStr);
  if (lstmChoiceMode1) {
    ocrStr = ocrStr.replace(/<span class='ocr_symbol'[\s\S]+?(?:<\/span>\s*){3}/ig, "");
  }
  if (lstmChoiceMode2) {
    ocrStr = ocrStr.replace(/<span class='ocrx_cinfo' id='lstm_choices[\s\S]+?(?:<\/span>\s*){2}/ig, "");
  }
  function convertLine(match) {
    const titleStrLine = match.match(/title=['"]([^'"]+)/)?.[1];
    if (!titleStrLine) return "";
    const linebox1 = [...titleStrLine.matchAll(/bbox(?:es)?(\s+[\d.-]+)(\s+[\d.-]+)?(\s+[\d.-]+)?(\s+[\d.-]+)?/g)][0].slice(1, 5).map((x) => parseInt(x));
    const linebox = {
      left: linebox1[0],
      top: linebox1[1],
      right: linebox1[2],
      bottom: linebox1[3]
    };
    const baselineMatch = [...titleStrLine.matchAll(/baseline(\s+[\d.-]+)(\s+[\d.-]+)/g)][0];
    if (!baselineMatch) return "";
    const baseline = baselineMatch.slice(1, 5).map((x) => parseFloat(x));
    if (linebox.right - linebox.left >= 200) {
      angleRisePage.push(baseline[0]);
      lineLeft.push(linebox.left);
      lineTop.push(linebox.top);
    }
    let lineAscHeightFinal = null;
    let lineXHeightFinal = null;
    if (scribeMode) {
      const lineAscHeightFinalStr = titleStrLine.match(/x_asc_height\s+([\d.-]+)/)?.[1];
      const lineXHeightFinalStr = titleStrLine.match(/x_x_height\s+([\d.-]+)/)?.[1];
      if (lineAscHeightFinalStr) lineAscHeightFinal = parseFloat(lineAscHeightFinalStr);
      if (lineXHeightFinalStr) lineXHeightFinal = parseFloat(lineXHeightFinalStr);
    }
    if (!lineAscHeightFinal && !lineXHeightFinal) {
      const lineAllHeightTessStr = parseFloat(titleStrLine.match(/x_size\s+([\d.-]+)/)?.[1] || "15");
      const lineAscHeightTessStr = parseFloat(titleStrLine.match(/x_ascenders\s+([\d.-]+)/)?.[1] || "0");
      const lineDescHeightTessStr = parseFloat(titleStrLine.match(/x_descenders\s+([\d.-]+)/)?.[1] || "0");
      lineAscHeightFinal = lineAllHeightTessStr - lineDescHeightTessStr;
      if (lineAscHeightTessStr > 0) {
        lineXHeightFinal = lineAllHeightTessStr - lineDescHeightTessStr - lineAscHeightTessStr;
      }
    }
    console.assert(lineAscHeightFinal || lineXHeightFinal, "Line height metrics missing.");
    const lineObj = new ocr.OcrLine(pageObj, linebox, baseline, lineAscHeightFinal, lineXHeightFinal);
    {
      lineObj.debug.raw = match;
    }
    function convertWordCharLevel(match2) {
      let text = "";
      const titleStrWord = match2.match(/title=['"]([^'"]+)/)?.[1];
      const confMatchStr = titleStrWord?.match(/(?:;|\s)x_wconf\s+(\d+)/)?.[1];
      let wordConf = 0;
      if (confMatchStr) {
        wordConf = parseInt(confMatchStr);
      }
      const italic = /<\/em>\s*<\/span>/.test(match2);
      const wordID = match2.match(/id=['"]([^'"]*)['"]/i)?.[1] || `word_${n + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
      const wordLangRaw = match2.match(/lang=['"]([^'"]*)['"]/i)?.[1];
      let fontName = match2.match(/^[^>]+?x_font\s*([^'";]+)/)?.[1];
      if (fontName) fontName = fontName.trim();
      const it = match2.matchAll(charRegex);
      const letterArr = [...it];
      const bboxes = letterArr.map((x) => x[1].match(/(\d+) (\d+) (\d+) (\d+)/).slice(1, 5).map((y) => parseInt(y)));
      let wordLang = wordLangRaw || currentLang;
      if (["chi_sim", "chi_tra"].includes(wordLang)) {
        const charArr = letterArr.map((x) => x[2]);
        const { han: hanChars, latin: latinChars } = getTextScript(charArr);
        if (hanChars === 0) {
          if (!["chi_sim", "chi_tra"].includes(currentLang)) {
            wordLang = currentLang;
          } else if (latinChars > 0) {
            wordLang = "eng";
          }
        }
      }
      const charObjArr = [];
      for (let j = 0; j < letterArr.length; j++) {
        let contentStrLetter = letterArr[j][2];
        contentStrLetter = unescapeXml(contentStrLetter);
        const bbox = {
          left: bboxes[j][0],
          top: bboxes[j][1],
          right: bboxes[j][2],
          bottom: bboxes[j][3]
        };
        if (wordLang === "chi_sim") {
          const wordObj2 = new ocr.OcrWord(lineObj, `${wordID}_${j}`, contentStrLetter, bbox);
          wordObj2.conf = wordConf;
          wordObj2.lang = wordLang;
          lineObj.words.push(wordObj2);
        } else {
          const charObj = new ocr.OcrChar(contentStrLetter, bbox);
          charObjArr.push(charObj);
          text += contentStrLetter;
        }
      }
      if (wordLang === "chi_sim") return "";
      text = text ?? "";
      text = text.trim();
      if (text === "") return "";
      const bboxesCore = letterArr.map((x) => x[1].match(/(\d+) (\d+) (\d+) (\d+)/)?.slice(1, 5).map((y) => parseInt(y)));
      const wordBoxCore = {
        left: Math.min(...bboxesCore.map((x) => x[0])),
        top: Math.min(...bboxesCore.map((x) => x[1])),
        right: Math.max(...bboxesCore.map((x) => x[2])),
        bottom: Math.max(...bboxesCore.map((x) => x[3]))
      };
      const wordObj = new ocr.OcrWord(lineObj, wordID, text, wordBoxCore);
      wordObj.lang = wordLang;
      wordObj.chars = charObjArr;
      {
        wordObj.debug.raw = match2;
      }
      if (italic) wordObj.style.italic = true;
      if (fontName) wordObj.style.font = fontName;
      wordObj.conf = wordConf;
      lineObj.words.push(wordObj);
      return "";
    }
    function convertWord(match2) {
      const wordID = match2.match(/id=['"]([^'"]*)['"]/i)?.[1] || `word_${n + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
      const wordSup = /<sup>/i.test(match2);
      const wordDropCap = /<span class=['"]ocr_dropcap['"]>/i.test(match2);
      let wordText;
      if (wordSup) {
        wordText = match2.replace(/\s*<sup>/i, "").replace(/<\/sup>\s*/i, "").match(/>([^>]*)</)?.[1];
      } else if (wordDropCap) {
        wordText = match2.replace(/\s*<span class=['"]ocr_dropcap['"]>/i, "").match(/>([^>]*)</)?.[1];
      } else {
        wordText = match2.match(/>([^>]*)</)?.[1];
      }
      if (!wordText) return "";
      wordText = unescapeXml(wordText);
      const titleStrWord = match2.match(/title=['"]([^'"]+)/)?.[1];
      const wordLang = match2.match(/lang=['"]([^'"]*)['"]/i)?.[1] || currentLang;
      if (!titleStrWord) {
        console.log(`Unable to process word, skipping: ${match2}`);
        return "";
      }
      const wordBox1 = [...titleStrWord.matchAll(/bbox(?:es)?(\s+[\d-.]+)(\s+[\d-.]+)?(\s+[\d-.]+)?(\s+[\d-.]+)?/g)][0].slice(1, 5).map((x) => parseFloat(x));
      const wordBox = {
        left: wordBox1[0],
        top: wordBox1[1],
        right: wordBox1[2],
        bottom: wordBox1[3]
      };
      let fontName = match2.match(/^[^>]+?x_font\s*([^'";]+)/)?.[1];
      if (fontName) fontName = fontName.trim();
      const styleStr = match2.match(/style=['"]([^'"]+)/)?.[1];
      const confMatch = titleStrWord.match(/(?:;|\s)x_wconf\s+(\d+)/)?.[1] || "0";
      const wordConf = parseInt(confMatch) || 0;
      const wordObj = new ocr.OcrWord(lineObj, wordID, wordText, wordBox);
      wordObj.lang = wordLang;
      if (scribeMode) {
        const wordFontSizeStr = titleStrWord.match(/(?:;|\s)x_fsize\s+(\d+)/)?.[1];
        if (wordFontSizeStr) {
          const wordFontSize = parseInt(wordFontSizeStr);
          if (wordFontSize) wordObj.style.size = wordFontSize;
        }
      }
      if (styleStr) {
        if (/italic/i.test(styleStr)) wordObj.style.italic = true;
        if (/bold/i.test(styleStr)) wordObj.style.bold = true;
        if (/small-caps/i.test(styleStr)) wordObj.style.smallCaps = true;
      }
      if (wordSup) wordObj.style.sup = true;
      if (fontName) wordObj.style.font = fontName;
      wordObj.conf = wordConf;
      lineObj.words.push(wordObj);
      return "";
    }
    if (charMode) {
      match = match.replaceAll(wordRegexCharLevel, convertWordCharLevel);
    } else {
      match = match.replaceAll(wordRegex, convertWord);
    }
    pageObj.lines.push(lineObj);
    return "";
  }
  const convertPar = (match) => {
    const parLang = match.match(/^.+?lang=['"]([^'"]*)['"]/i)?.[1];
    if (parLang) currentLang = parLang;
    match.replaceAll(lineRegex, convertLine);
    return "";
  };
  ocrStr = ocrStr.replaceAll(/<p class=["']ocr_par[\s\S]+?(?:<\/p>\s*)/ig, convertPar);
  ocrStr = ocrStr.replaceAll(lineRegex, convertLine);
  const warn = { char: charMode ? "" : "char_warning" };
  pass2(pageObj, 0);
  const langSet = pass3(pageObj);
  const dataTablePage = new LayoutDataTablePage(n);
  return {
    pageObj,
    dataTables: dataTablePage,
    warn,
    langSet
  };
}
async function convertPageStext({ ocrStr, n }) {
  const pageDimsMatch = ocrStr.match(/<page .+?width=['"]([\d.-]+)['"] height=['"]([\d.-]+)['"]/);
  if (!pageDimsMatch || !pageDimsMatch[1] || !pageDimsMatch[2]) throw new Error("Page dimensions not found in stext.");
  const pageDims = { height: parseInt(pageDimsMatch[2]), width: parseInt(pageDimsMatch[1]) };
  const pageObj = new ocr.OcrPage(n, pageDims);
  const angleRisePage = [];
  const langSet = /* @__PURE__ */ new Set();
  const fontSet = /* @__PURE__ */ new Set();
  function convertParStext(xmlPar) {
    const parLineArr = [];
    function convertLineStext(xmlLine) {
      xmlLine = xmlLine.replace(/<block[^>]*?>/i, "");
      const xmlLinePreChar = xmlLine.match(/^[\s\S]*?(?=<char)/)?.[0];
      if (!xmlLinePreChar) return;
      const dir = xmlLinePreChar.match(/dir=['"](\s*[\d.-]+)(\s*[\d.-]+)/)?.slice(1, 3).map((x) => parseFloat(x));
      let orientation = 0;
      if (dir && Math.abs(dir[0]) < 0.5 && dir[1] >= 0.5) {
        orientation = 1;
      } else if (dir && dir[0] <= -0.5 && Math.abs(dir[1]) < 0.5) {
        orientation = 2;
      } else if (dir && Math.abs(dir[0]) < 0.5 && dir[1] <= -0.5) {
        orientation = 3;
      }
      const xmlLineFormatting = xmlLinePreChar?.match(/<font[^>]+/)?.[0];
      const fontName = xmlLineFormatting?.match(/name=['"]([^'"]*)/)?.[1];
      const fontSizeStr = xmlLineFormatting?.match(/size=['"]([^'"]*)/)?.[1];
      console.assert(fontSizeStr, "Font size not found in stext.");
      const fontSizeLine = fontSizeStr ? parseFloat(fontSizeStr) : 10;
      const fontFamilyLine = fontName?.replace(/-.+/g, "") || "Default";
      const lineBoxArr = [...xmlLinePreChar.matchAll(/bbox(?:es)?=['"](\s*[\d.-]+)(\s*[\d.-]+)?(\s*[\d.-]+)?(\s*[\d.-]+)?/g)][0].slice(1, 5).map((x) => Math.max(parseFloat(x), 0));
      const wordStrArr = xmlLine.split(/(?:<char[^>]*?c=['"]\s+['"]\s*\/>)/ig);
      if (wordStrArr[wordStrArr.length - 1] && wordStrArr[wordStrArr.length - 1].trim() === "</font>") wordStrArr.pop();
      for (let i = wordStrArr.length - 1; i >= 0; i--) {
        if (wordStrArr[i].trim() === "") {
          wordStrArr.splice(i, 1);
        }
      }
      if (wordStrArr.length === 0) return;
      const bboxes = [];
      let baselineFirstDone = false;
      const baselineFirst = (
        /** @type {Array<Number>} */
        []
      );
      let baselineCurrent = 0;
      const textArr = [];
      let boldCurrent = false;
      let italicCurrent = false;
      let familyCurrent = "Default";
      let sizeCurrentRaw = 0;
      let sizeCurrent = 0;
      let superCurrent = false;
      let smallCapsCurrent;
      let smallCapsCurrentAlt;
      const boldArr = [];
      const italicArr = [];
      const underlineArr = [];
      const smallCapsArr = [];
      const smallCapsAltArr = [];
      const smallCapsAltTitleCaseArr = [];
      const fontFamilyArr = [];
      const fontSizeArr = [];
      const superArr = [];
      const wordCharOrFontArr = (
        /** @type {Array<Array<StextChar|StextFont>>} */
        []
      );
      for (let i = 0; i < wordStrArr.length; i++) {
        const stextCharRegex = /(<font[^>]+>\s*)|<char quad=['"](\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)(\s*[\d.-]+)[^>]*?x=['"]([\d.-]+)[^>]*?y=['"]([\d.-]+)['"]([^>]*?c=['"][^'"]+['"])\s*\/>/ig;
        const stextMatches = [...wordStrArr[i].matchAll(stextCharRegex)];
        wordCharOrFontArr[i] = [];
        for (let j = 0; j < stextMatches.length; j++) {
          const fontStr = stextMatches[j][1];
          const fontNameStrI = fontStr?.match(/name=['"]([^'"]*)/)?.[1];
          const fontSizeStrI = fontStr?.match(/size=['"]([^'"]*)/)?.[1];
          if (fontNameStrI !== void 0 && fontSizeStrI !== void 0) {
            if (i + 1 === wordStrArr.length && j + 1 === stextMatches.length) continue;
            wordCharOrFontArr[i][j] = {
              name: fontNameStrI,
              size: parseFloat(fontSizeStrI)
            };
            continue;
          }
          let quad;
          if (orientation === 1) {
            quad = {
              ul: { x: parseFloat(stextMatches[j][6]), y: parseFloat(stextMatches[j][7]) },
              ur: { x: parseFloat(stextMatches[j][2]), y: parseFloat(stextMatches[j][3]) },
              ll: { x: parseFloat(stextMatches[j][8]), y: parseFloat(stextMatches[j][9]) },
              lr: { x: parseFloat(stextMatches[j][4]), y: parseFloat(stextMatches[j][5]) }
            };
          } else if (orientation === 2) {
            quad = {
              ul: { x: parseFloat(stextMatches[j][8]), y: parseFloat(stextMatches[j][9]) },
              ur: { x: parseFloat(stextMatches[j][6]), y: parseFloat(stextMatches[j][7]) },
              ll: { x: parseFloat(stextMatches[j][4]), y: parseFloat(stextMatches[j][5]) },
              lr: { x: parseFloat(stextMatches[j][2]), y: parseFloat(stextMatches[j][3]) }
            };
          } else if (orientation === 3) {
            quad = {
              ul: { x: parseFloat(stextMatches[j][4]), y: parseFloat(stextMatches[j][5]) },
              ur: { x: parseFloat(stextMatches[j][8]), y: parseFloat(stextMatches[j][9]) },
              ll: { x: parseFloat(stextMatches[j][2]), y: parseFloat(stextMatches[j][3]) },
              lr: { x: parseFloat(stextMatches[j][6]), y: parseFloat(stextMatches[j][7]) }
            };
          } else {
            quad = {
              ul: { x: parseFloat(stextMatches[j][2]), y: parseFloat(stextMatches[j][3]) },
              ur: { x: parseFloat(stextMatches[j][4]), y: parseFloat(stextMatches[j][5]) },
              ll: { x: parseFloat(stextMatches[j][6]), y: parseFloat(stextMatches[j][7]) },
              lr: { x: parseFloat(stextMatches[j][8]), y: parseFloat(stextMatches[j][9]) }
            };
          }
          const flags = parseInt(stextMatches[j][12]?.match(/flags=['"]([^'"]*)/)?.[1]);
          const text = stextMatches[j][12]?.match(/c=['"]([^'"]*)/)?.[1];
          wordCharOrFontArr[i][j] = {
            quad,
            origin: { x: parseFloat(stextMatches[j][10]), y: parseFloat(stextMatches[j][11]) },
            flags,
            text
          };
        }
      }
      for (let i = 0; i < wordCharOrFontArr.length; i++) {
        let textWordArr = [];
        let bboxesWordArr = [];
        const underlineWordArr = [];
        let fontFamily = familyCurrent || fontFamilyLine || "Default";
        let fontSizeWord = sizeCurrent || fontSizeLine || 10;
        let smallCapsWord = smallCapsCurrent || false;
        let smallCapsWordAlt = smallCapsCurrentAlt || false;
        let smallCapsWordAltTitleCaseAdj = false;
        let boldWord = false;
        let italicWord = false;
        if (wordCharOrFontArr[i].length === 0) continue;
        let wordCharN = 0;
        for (let j = 0; j < wordCharOrFontArr[i].length; j++) {
          const charOrFont = wordCharOrFontArr[i][j];
          if ("name" in charOrFont) {
            const sizePrevRaw = sizeCurrentRaw;
            sizeCurrentRaw = charOrFont.size;
            const secondLetter = wordCharN > 0 && textWordArr.length === 1 && /[A-Z]/.test(textWordArr[0]);
            let baselineNextLetter;
            const possibleNextLetter1 = wordCharOrFontArr[i][j + 1];
            const possibleNextLetter2 = wordCharOrFontArr[i + 1]?.[0];
            const possibleNextLetter3 = wordCharOrFontArr[i + 1]?.[1];
            const possibleNextLetter4 = wordCharOrFontArr[i + 1]?.[2];
            if (possibleNextLetter1 && "origin" in possibleNextLetter1) {
              baselineNextLetter = possibleNextLetter1.origin.y;
            } else if (possibleNextLetter2 && "origin" in possibleNextLetter2) {
              baselineNextLetter = possibleNextLetter2.origin.y;
            } else if (possibleNextLetter3 && "origin" in possibleNextLetter3) {
              baselineNextLetter = possibleNextLetter3.origin.y;
            } else if (possibleNextLetter4 && "origin" in possibleNextLetter4) {
              baselineNextLetter = possibleNextLetter4.origin.y;
            }
            const fontSizeMin = Math.min(sizeCurrentRaw, sizePrevRaw);
            const baselineDelta = (baselineNextLetter - baselineCurrent) / fontSizeMin;
            const sizeDelta = (sizeCurrentRaw - sizePrevRaw) / fontSizeMin;
            if (secondLetter && sizeCurrentRaw < sizePrevRaw && sizePrevRaw > 0 && baselineNextLetter && Math.abs(baselineDelta) < 0.1) {
              smallCapsCurrentAlt = true;
              smallCapsWordAlt = true;
              smallCapsWordAltTitleCaseAdj = true;
            } else if (Number.isFinite(baselineDelta) && Number.isFinite(sizeDelta) && (baselineDelta < -0.25 && sizeDelta < -0.05 || baselineDelta > 0.25 && sizeDelta > 0.05)) {
              if (textWordArr.length > 0) {
                textArr.push(textWordArr);
                bboxes.push(bboxesWordArr);
                boldArr.push(boldWord);
                italicArr.push(italicWord);
                underlineArr.push(underlineWordArr.reduce((a, b) => Number(a) + Number(b), 0) / underlineWordArr.length > 0.5);
                fontFamilyArr.push(fontFamily);
                if (sizeDelta > 0) {
                  fontSizeArr.push(sizePrevRaw);
                } else {
                  fontSizeArr.push(fontSizeWord);
                }
                smallCapsArr.push(smallCapsWord);
                smallCapsAltArr.push(smallCapsWordAlt);
                smallCapsAltTitleCaseArr.push(smallCapsWordAltTitleCaseAdj);
                superArr.push(sizeDelta > 0);
                textWordArr = [];
                bboxesWordArr = [];
              }
              if (sizeDelta > 0) {
                if (!baselineFirstDone) baselineFirst.length = 0;
                familyCurrent = charOrFont.name || familyCurrent;
                sizeCurrent = sizeCurrentRaw || sizeCurrent;
                fontSizeWord = sizeCurrent;
                fontFamily = familyCurrent;
                superArr[superArr.length - 1] = true;
              }
              if (superArr.length > 0 && !superArr[superArr.length - 1] && baselineFirst.length > 0) {
                baselineFirstDone = true;
              }
              superCurrent = sizeDelta < 0;
            } else {
              sizeCurrent = sizeCurrentRaw || sizeCurrent;
              familyCurrent = charOrFont.name || familyCurrent;
              if (textWordArr.length === 0) {
                fontSizeWord = sizeCurrent;
                fontFamily = familyCurrent;
              }
              if (Number.isFinite(sizeDelta) && Math.abs(sizeDelta) > 0.05) {
                smallCapsCurrentAlt = false;
                if (textWordArr.length === 0) {
                  superCurrent = false;
                  smallCapsWordAlt = false;
                  smallCapsWordAltTitleCaseAdj = false;
                }
              }
            }
            smallCapsCurrentAlt = smallCapsCurrentAlt ?? smallCapsAltArr[smallCapsAltArr.length - 1];
            smallCapsCurrent = /(small\W?cap)|(sc$)|(caps$)/i.test(charOrFont.name);
            smallCapsWord = smallCapsCurrent;
            if (/italic/i.test(charOrFont.name) || /-\w*ital/i.test(charOrFont.name) || /-it$/i.test(charOrFont.name) || /oblique/i.test(charOrFont.name)) {
              italicCurrent = true;
            } else {
              italicCurrent = false;
            }
            if (/bold|black/i.test(charOrFont.name)) {
              boldCurrent = true;
            } else {
              boldCurrent = false;
            }
            continue;
          } else {
            baselineCurrent = charOrFont.origin.y;
          }
          if (wordCharN === 0 || wordCharN < 3 && /[A-Z\d]/i.test(charOrFont.text)) {
            boldWord = boldCurrent;
            italicWord = italicCurrent;
            wordCharN++;
          }
          let bbox;
          if (orientation === 1) {
            bbox = {
              left: Math.round(charOrFont.origin.y),
              top: Math.round(pageDims.width - Math.max(charOrFont.quad.ur.x, charOrFont.quad.lr.x)),
              right: Math.round(charOrFont.origin.y + (charOrFont.quad.lr.y - charOrFont.quad.ur.y)),
              bottom: Math.round(pageDims.width - Math.min(charOrFont.quad.ul.x, charOrFont.quad.ll.x))
            };
          } else if (orientation === 2) {
            bbox = {
              left: Math.round(pageDims.width - charOrFont.origin.x),
              top: Math.round(pageDims.height - Math.max(charOrFont.quad.ll.y, charOrFont.quad.lr.y)),
              right: Math.round(pageDims.width - (charOrFont.origin.x - (charOrFont.quad.ur.x - charOrFont.quad.ul.x))),
              bottom: Math.round(pageDims.height - Math.min(charOrFont.quad.ul.y, charOrFont.quad.ur.y))
            };
          } else if (orientation === 3) {
            bbox = {
              left: Math.round(pageDims.height - charOrFont.origin.y),
              top: Math.round(Math.min(charOrFont.quad.ul.x, charOrFont.quad.ll.x)),
              right: Math.round(pageDims.height - charOrFont.origin.y + (charOrFont.quad.lr.y - charOrFont.quad.ur.y)),
              bottom: Math.round(Math.max(charOrFont.quad.ur.x, charOrFont.quad.lr.x))
            };
          } else {
            bbox = {
              left: Math.round(charOrFont.origin.x),
              top: Math.round(Math.min(charOrFont.quad.ul.y, charOrFont.quad.ur.y)),
              right: Math.round(charOrFont.origin.x + (charOrFont.quad.ur.x - charOrFont.quad.ul.x)),
              bottom: Math.round(Math.max(charOrFont.quad.ll.y, charOrFont.quad.lr.y))
            };
          }
          if (!superCurrent) {
            if (baselineFirst.length === 0) {
              let originY;
              if (orientation === 1) {
                originY = pageDims.width - charOrFont.origin.x;
              } else if (orientation === 2) {
                originY = pageDims.height - charOrFont.origin.y;
              } else if (orientation === 3) {
                originY = charOrFont.origin.x;
              } else {
                originY = charOrFont.origin.y;
              }
              baselineFirst.push(bbox.left, originY);
            }
          }
          smallCapsCurrentAlt = smallCapsCurrentAlt ?? smallCapsAltArr[smallCapsAltArr.length - 1];
          textWordArr.push(charOrFont.text);
          underlineWordArr.push(charOrFont.flags === 2);
          bboxesWordArr.push(bbox);
        }
        if (textWordArr.length === 0) continue;
        const underlineWord = underlineWordArr.reduce((a, b) => Number(a) + Number(b), 0) / underlineWordArr.length > 0.5;
        underlineArr.push(underlineWord);
        textArr.push(textWordArr);
        bboxes.push(bboxesWordArr);
        boldArr.push(boldWord);
        italicArr.push(italicWord);
        fontFamilyArr.push(fontFamily);
        fontSizeArr.push(fontSizeWord);
        smallCapsAltArr.push(smallCapsWordAlt);
        smallCapsArr.push(smallCapsWord);
        smallCapsAltTitleCaseArr.push(smallCapsWordAltTitleCaseAdj);
        if (superCurrent && superArr[superArr.length - 1]) {
          superArr[superArr.length - 1] = false;
          superCurrent = false;
        }
        superArr.push(superCurrent);
        if (superCurrent) fontSizeArr[fontSizeArr.length - 1] = sizeCurrentRaw;
      }
      if (bboxes.length === 0) return;
      let baselineSlope = 0;
      if (dir && dir[0] !== void 0 && !Number.isNaN(dir[0]) && dir[1] !== void 0 && !Number.isNaN(dir[1])) {
        if (orientation === 1) {
          baselineSlope = -dir[0];
        } else if (orientation === 2) {
          baselineSlope = -dir[1];
        } else if (orientation === 3) {
          baselineSlope = dir[0];
        } else {
          baselineSlope = dir[1];
        }
      } else {
        console.log("Unable to parse slope.");
      }
      const lineBbox = {
        left: lineBoxArr[0],
        top: lineBoxArr[1],
        right: lineBoxArr[2],
        bottom: lineBoxArr[3]
      };
      let baselinePoint = baselineFirst[1] - lineBbox.bottom;
      baselinePoint = baselinePoint || 0;
      const baselineOut = [round6$1(baselineSlope), Math.round(baselinePoint)];
      const letterHeightOut = fontSizeLine * 0.6;
      const lineObj = new ocr.OcrLine(pageObj, lineBbox, baselineOut, letterHeightOut, null);
      lineObj.orientation = orientation;
      let lettersKept = 0;
      for (let i = 0; i < textArr.length; i++) {
        const wordText = unescapeXml(textArr[i].join(""));
        if (wordText.trim() === "") continue;
        const wordLang = calcLang(wordText);
        langSet.add(wordLang);
        const wordID = `word_${n + 1}_${pageObj.lines.length + 1}_${i + 1}`;
        const bboxesI = bboxes[i];
        const charObjArr = [];
        for (let j = 0; j < textArr[i].length; j++) {
          const letter = unescapeXml(textArr[i][j]);
          const bbox2 = bboxesI[j];
          if (wordLang === "chi_sim") {
            const wordObj2 = new ocr.OcrWord(lineObj, `${wordID}_${j}`, letter, bbox2);
            wordObj2.conf = 100;
            wordObj2.lang = wordLang;
            wordObj2.visualCoords = false;
            lineObj.words.push(wordObj2);
            lettersKept++;
          } else {
            const charObj = new ocr.OcrChar(letter, bbox2);
            charObjArr.push(charObj);
          }
        }
        if (wordLang === "chi_sim") continue;
        const bboxesILeft = Math.min(...bboxesI.map((x) => x.left));
        const bboxesIRight = Math.max(...bboxesI.map((x) => x.right));
        const bboxesITop = Math.min(...bboxesI.map((x) => x.top));
        const bboxesIBottom = Math.max(...bboxesI.map((x) => x.bottom));
        const bbox = {
          left: bboxesILeft,
          top: bboxesITop,
          right: bboxesIRight,
          bottom: bboxesIBottom
        };
        if (bbox.left < 0 && bbox.right < 0) continue;
        const wordObj = new ocr.OcrWord(lineObj, wordID, wordText, bbox);
        wordObj.style.size = fontSizeArr[i];
        wordObj.lang = wordLang;
        wordObj.chars = charObjArr;
        wordObj.visualCoords = false;
        wordObj.conf = 100;
        if (smallCapsAltArr[i] && !/[a-z]/.test(wordObj.text) && /[A-Z].?[A-Z]/.test(wordObj.text)) {
          wordObj.style.smallCaps = true;
          if (smallCapsAltTitleCaseArr[i]) {
            wordObj.chars.slice(1).forEach((x) => {
              x.text = x.text.toLowerCase();
            });
          } else {
            wordObj.chars.forEach((x) => {
              x.text = x.text.toLowerCase();
            });
          }
          wordObj.text = wordObj.chars.map((x) => x.text).join("");
        } else if (smallCapsArr[i]) {
          wordObj.style.smallCaps = true;
        }
        if (italicArr[i]) {
          wordObj.style.italic = true;
        }
        if (boldArr[i]) {
          wordObj.style.bold = true;
        }
        wordObj.style.font = fontFamilyArr[i];
        fontSet.add(cleanFamilyName(wordObj.style.font));
        wordObj.style.sup = superArr[i];
        wordObj.style.underline = underlineArr[i];
        lineObj.words.push(wordObj);
        lettersKept++;
      }
      if (lettersKept === 0) return;
      ocr.updateLineBbox(lineObj);
      pageObj.lines.push(lineObj);
      parLineArr.push(lineObj);
      return baselineSlope;
    }
    const lineStrArr = xmlPar.split(/<\/line>/);
    for (let i = 0; i < lineStrArr.length; i++) {
      const angle = convertLineStext(lineStrArr[i]);
      if (typeof angle === "number" && !Number.isNaN(angle) && Math.abs(angle) < 0.3) angleRisePage.push(angle);
    }
    if (parLineArr.length === 0) return;
    const parbox = calcBboxUnion(parLineArr.map((x) => x.bbox));
    const parObj = new ocr.OcrPar(pageObj, parbox);
    parLineArr.forEach((x) => {
      x.par = parObj;
    });
    parObj.lines = parLineArr;
    pageObj.pars.push(parObj);
  }
  const parStrArr = ocrStr.split(/<\/block>/);
  for (let i = 0; i < parStrArr.length; i++) {
    convertParStext(parStrArr[i]);
  }
  const angleRiseMedian = mean50(angleRisePage) || 0;
  const angleOut = Math.asin(angleRiseMedian) * (180 / Math.PI);
  pageObj.angle = angleOut;
  const dataTablePage = new LayoutDataTablePage(n);
  return {
    pageObj,
    dataTables: dataTablePage,
    langSet,
    fontSet
  };
}
const detectPolyOrientation = (poly) => {
  if (poly[0].X > poly[2].X && poly[0].Y < poly[2].Y) {
    return 1;
  }
  if (poly[0].X > poly[2].X && poly[0].Y > poly[2].Y) {
    return 2;
  }
  if (poly[0].X < poly[2].X && poly[1].X < poly[3].X && poly[0].Y > poly[2].Y) {
    return 3;
  }
  return 0;
};
async function convertDocTextract({ ocrStr, pageDims, pageNum }) {
  const blocks = (
    /** @type {TextractBlock[]} */
    []
  );
  try {
    if (typeof ocrStr === "string") {
      ocrStr = [ocrStr];
    }
    for (let i = 0; i < ocrStr.length; i++) {
      const textractData = JSON.parse(ocrStr[i]);
      if (!textractData || !Array.isArray(textractData.Blocks)) {
        console.warn(`Invalid Textract JSON data at index ${i}. Expected an array of blocks.`);
        continue;
      }
      for (const block of textractData.Blocks) {
        blocks.push(block);
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to parse Textract JSON.");
  }
  const pageBlocks = blocks.filter((block) => block.BlockType === "PAGE");
  if (pageNum !== void 0 && pageBlocks.length > 1) {
    console.warn("Multiple PAGE blocks found but pageNum is specified. Using pageNum for all pages.");
  }
  const relationshipMap = /* @__PURE__ */ new Map();
  blocks.forEach((block) => {
    if (block.Relationships) {
      block.Relationships.forEach((rel) => {
        if (rel.Type === "CHILD") {
          relationshipMap.set(block.Id, rel.Ids || []);
        }
      });
    }
  });
  const blockMap = /* @__PURE__ */ new Map();
  blocks.forEach((block) => {
    blockMap.set(block.Id, block);
  });
  const blocksByPage = /* @__PURE__ */ new Map();
  blocks.forEach((block) => {
    const n = block.Page || 1;
    let pageData = blocksByPage.get(n);
    if (!pageData) {
      pageData = { lines: [], layouts: [], tables: [] };
      blocksByPage.set(n, pageData);
    }
    if (block.BlockType === "LINE") {
      pageData.lines.push(block);
    } else if (block.BlockType === "TABLE") {
      pageData.tables.push(block);
    } else if (block.BlockType && block.BlockType.startsWith("LAYOUT_")) {
      pageData.layouts.push(block);
    }
  });
  const resArr = [];
  for (let i = 0; i < pageBlocks.length; i++) {
    const n = pageNum ?? i;
    const pageBlock = pageBlocks[i];
    const pageDimsN = pageDims[i];
    if (!pageDimsN) {
      throw new Error(`No page dimensions provided for page ${n + 1}.`);
    }
    const pagePoly = pageBlock.Geometry && pageBlock.Geometry.Polygon ? pageBlock.Geometry.Polygon : null;
    if (!pagePoly) throw new Error(`No page polygon data for page ${n + 1}.`);
    const pageOrientation = detectPolyOrientation(pagePoly);
    const pageObj = new ocr.OcrPage(n, pageDimsN);
    const pageData = blocksByPage.get(i + 1) || { lines: [], layouts: [], tables: [] };
    const lineBlocks = pageData.lines;
    const layoutBlocks = pageData.layouts;
    const tableBlocks = pageData.tables;
    if (lineBlocks.length === 0) {
      resArr.push({ pageObj, dataTables: new LayoutDataTablePage(n), langSet: /* @__PURE__ */ new Set() });
      continue;
    }
    const tablesPage = convertTableLayoutTextract(n, tableBlocks, pageDimsN, blockMap);
    const lineToLayoutMap = /* @__PURE__ */ new Map();
    layoutBlocks.forEach((layoutBlock) => {
      const childIds = relationshipMap.get(layoutBlock.Id) || [];
      childIds.forEach((childId) => {
        const childBlock = blockMap.get(childId);
        if (childBlock && childBlock.BlockType === "LINE") {
          lineToLayoutMap.set(childId, layoutBlock);
        }
      });
    });
    const lineObjMap = /* @__PURE__ */ new Map();
    lineBlocks.forEach((lineBlock, lineIndex) => {
      const lineObj = convertLineTextract(lineBlock, blockMap, relationshipMap, pageObj, n, lineIndex, pageDimsN, pageOrientation);
      if (lineObj) {
        pageObj.lines.push(lineObj);
        lineObjMap.set(lineBlock.Id, lineObj);
      }
    });
    pageObj.textSource = "textract";
    createParagraphsFromLayout(pageObj, layoutBlocks, relationshipMap, blockMap, lineObjMap);
    const lines2 = (
      /** @type {OcrLine[]} */
      []
    );
    pageObj.pars.forEach((par) => {
      lines2.push(...par.lines);
    });
    if (lines2.length !== pageObj.lines.length) {
      console.warn(`Warning: Mismatch in number of lines (${lines2.length}) and lines in paragraphs (${pageObj.lines.length}) on page ${n + 1}. Lines will not be reordered.`);
    } else {
      pageObj.lines = lines2;
    }
    const langSet = pass3(pageObj);
    resArr.push({ pageObj, dataTables: tablesPage, langSet });
  }
  return resArr;
}
function convertLineTextract(lineBlock, blockMap, relationshipMap, pageObj, pageNum, lineIndex, pageDims, pageOrientation) {
  if (!lineBlock.Text || !lineBlock.Geometry) return null;
  const bboxLine = convertBoundingBox(lineBlock.Geometry.BoundingBox, pageDims);
  const polyLine0 = convertPolygon(lineBlock.Geometry.Polygon, pageDims, pageOrientation);
  let polyLine = (
    /** @type {Polygon} */
    JSON.parse(JSON.stringify(polyLine0))
  );
  const baseline = [0, 0];
  const lineObj = new ocr.OcrLine(pageObj, bboxLine, baseline);
  const childIds = relationshipMap.get(lineBlock.Id) || [];
  const wordBlocks = (
    /** @type {TextractBlock[]} */
    childIds.map((wordId) => blockMap.get(wordId)).filter((block) => block && block.BlockType === "WORD")
  );
  const wordPolys = (
    /** @type {Map<string, Polygon>} */
    /* @__PURE__ */ new Map()
  );
  wordBlocks.forEach((wordBlock, wordIndex) => {
    const bboxWord = convertBoundingBox(wordBlock.Geometry.BoundingBox, pageDims);
    const id = `word_${pageNum + 1}_${lineIndex + 1}_${wordIndex + 1}`;
    wordPolys.set(id, convertPolygon(wordBlock.Geometry.Polygon, pageDims, pageOrientation));
    const wordObj = new ocr.OcrWord(lineObj, id, wordBlock.Text, bboxWord);
    wordObj.conf = wordBlock.Confidence || 100;
    lineObj.words.push(wordObj);
  });
  if (!wordBlocks.length || !lineObj.words.length) {
    console.warn(`Warning: Line with no words on page ${pageNum + 1}, line index ${lineIndex + 1}. Skipping line.`);
    return null;
  }
  const lineOrientation = (wordBlocks[0].Geometry.RotationAngle || 0) / 90;
  lineObj.orientation = pageOrientation - lineOrientation;
  if (lineObj.orientation < 0) {
    lineObj.orientation += 4;
  }
  if (lineObj.orientation === 1) {
    const lineBox = { ...lineObj.bbox };
    lineObj.bbox.left = lineBox.top;
    lineObj.bbox.top = pageDims.width - lineBox.right;
    lineObj.bbox.right = lineBox.bottom;
    lineObj.bbox.bottom = pageDims.width - lineBox.left;
    lineObj.words.forEach((word) => {
      const wordBox = { ...word.bbox };
      word.bbox.left = word.bbox.top;
      word.bbox.top = pageDims.width - wordBox.right;
      word.bbox.right = wordBox.bottom;
      word.bbox.bottom = pageDims.width - wordBox.left;
    });
    wordPolys.forEach((poly, id) => {
      wordPolys.set(id, {
        tl: { x: poly.tr.y, y: pageDims.width - poly.tr.x },
        tr: { x: poly.br.y, y: pageDims.width - poly.br.x },
        br: { x: poly.bl.y, y: pageDims.width - poly.bl.x },
        bl: { x: poly.tl.y, y: pageDims.width - poly.tl.x }
      });
    });
    polyLine = {
      tl: { x: polyLine0.tr.y, y: pageDims.width - polyLine0.tr.x },
      tr: { x: polyLine0.br.y, y: pageDims.width - polyLine0.br.x },
      br: { x: polyLine0.bl.y, y: pageDims.width - polyLine0.bl.x },
      bl: { x: polyLine0.tl.y, y: pageDims.width - polyLine0.tl.x }
    };
  } else if (lineObj.orientation === 2) {
    const lineBox = { ...lineObj.bbox };
    lineObj.bbox.left = pageDims.width - lineBox.right;
    lineObj.bbox.top = pageDims.height - lineBox.bottom;
    lineObj.bbox.right = pageDims.width - lineBox.left;
    lineObj.bbox.bottom = pageDims.height - lineBox.top;
    lineObj.words.forEach((word) => {
      const wordBox = { ...word.bbox };
      word.bbox.left = pageDims.width - wordBox.right;
      word.bbox.top = pageDims.height - wordBox.bottom;
      word.bbox.right = pageDims.width - wordBox.left;
      word.bbox.bottom = pageDims.height - wordBox.top;
    });
    wordPolys.forEach((poly, id) => {
      wordPolys.set(id, {
        tl: { x: pageDims.width - poly.br.x, y: pageDims.height - poly.br.y },
        tr: { x: pageDims.width - poly.bl.x, y: pageDims.height - poly.bl.y },
        br: { x: pageDims.width - poly.tl.x, y: pageDims.height - poly.tl.y },
        bl: { x: pageDims.width - poly.tr.x, y: pageDims.height - poly.tr.y }
      });
    });
    polyLine = {
      tl: { x: pageDims.width - polyLine0.br.x, y: pageDims.height - polyLine0.br.y },
      tr: { x: pageDims.width - polyLine0.bl.x, y: pageDims.height - polyLine0.bl.y },
      br: { x: pageDims.width - polyLine0.tl.x, y: pageDims.height - polyLine0.tl.y },
      bl: { x: pageDims.width - polyLine0.tr.x, y: pageDims.height - polyLine0.tr.y }
    };
  } else if (lineObj.orientation === 3) {
    const lineBox = { ...lineObj.bbox };
    lineObj.bbox.left = pageDims.height - lineBox.bottom;
    lineObj.bbox.top = lineBox.left;
    lineObj.bbox.right = pageDims.height - lineBox.top;
    lineObj.bbox.bottom = lineBox.right;
    lineObj.words.forEach((word) => {
      const wordBox = { ...word.bbox };
      word.bbox.left = pageDims.height - wordBox.bottom;
      word.bbox.top = wordBox.left;
      word.bbox.right = pageDims.height - wordBox.top;
      word.bbox.bottom = wordBox.right;
    });
    wordPolys.forEach((poly, id) => {
      wordPolys.set(id, {
        tl: { x: pageDims.height - poly.bl.y, y: poly.bl.x },
        tr: { x: pageDims.height - poly.tl.y, y: poly.tl.x },
        br: { x: pageDims.height - poly.tr.y, y: poly.tr.x },
        bl: { x: pageDims.height - poly.br.y, y: poly.br.x }
      });
    });
    polyLine = {
      tl: { x: pageDims.height - polyLine0.bl.y, y: polyLine0.bl.x },
      tr: { x: pageDims.height - polyLine0.tl.y, y: polyLine0.tl.x },
      br: { x: pageDims.height - polyLine0.tr.y, y: polyLine0.tr.x },
      bl: { x: pageDims.height - polyLine0.br.y, y: polyLine0.br.x }
    };
  }
  if (polyLine.br.x !== polyLine.bl.x) {
    lineObj.baseline[0] = (polyLine.br.y - polyLine.bl.y) / (polyLine.br.x - polyLine.bl.x);
  }
  splitUnicodeSuperscripts(lineObj, wordPolys);
  const descCharRegex = new RegExp(`[${descCharArr.join("")}]`);
  const ascCharRegex = new RegExp(`[${ascCharArr.join("")}]`);
  const xCharRegex = new RegExp(`[${xCharArr.join("")}]`);
  const nonDescWordsPoly = (
    /** @type {Polygon[]} */
    []
  );
  const xOnlyWords = (
    /** @type {OcrWord[]} */
    []
  );
  const xOnlyWordsPoly = (
    /** @type {Polygon[]} */
    []
  );
  const ascOnlyWords = (
    /** @type {OcrWord[]} */
    []
  );
  const ascOnlyWordsPoly = (
    /** @type {Polygon[]} */
    []
  );
  for (let i = 0; i < lineObj.words.length; i++) {
    const word = lineObj.words[i];
    const wordPoly = (
      /** @type {Polygon} */
      wordPolys.get(word.id)
    );
    if (descCharRegex.test(word.text)) ;
    if (!descCharRegex.test(word.text) && (xCharRegex.test(word.text) || ascCharRegex.test(word.text))) {
      nonDescWordsPoly.push(wordPoly);
    }
    if (xCharRegex.test(word.text) && !ascCharRegex.test(word.text) && !descCharRegex.test(word.text) && !/[fi]/.test(word.text)) {
      xOnlyWords.push(word);
      xOnlyWordsPoly.push(wordPoly);
    }
    if (ascCharRegex.test(word.text) && !descCharRegex.test(word.text)) {
      ascOnlyWords.push(word);
      ascOnlyWordsPoly.push(wordPoly);
    }
    if (descCharRegex.test(word.text) && !ascCharRegex.test(word.text)) ;
  }
  let xHeight = (
    /** @type {?number} */
    mean50(xOnlyWordsPoly.map((wordPoly) => (wordPoly.bl.y - wordPoly.tl.y + (wordPoly.br.y - wordPoly.tr.y)) / 2))
  );
  const ascHeight = mean50(ascOnlyWordsPoly.map((wordPoly) => (wordPoly.bl.y - wordPoly.tl.y + (wordPoly.br.y - wordPoly.tr.y)) / 2));
  if (xHeight && ascHeight && xHeight > ascHeight * 0.8) {
    if (ascOnlyWords.length > xOnlyWords.length) {
      xHeight = null;
    }
  }
  const nonDescBottomDeltaArr = nonDescWordsPoly.map((wordPoly) => {
    const wordBottomMid = Math.round((wordPoly.bl.y + wordPoly.br.y) / 2);
    const wordXMid = Math.round((wordPoly.bl.x + wordPoly.br.x) / 2);
    const wordXMidOffset = wordXMid - lineObj.bbox.left;
    const wordBottomExp = polyLine.bl.y + baseline[0] * wordXMidOffset;
    return wordBottomMid - wordBottomExp;
  });
  const nonDescBottomDelta = mean50(nonDescBottomDeltaArr);
  const lineHeight = (polyLine.br.y - polyLine.tr.y + (polyLine.bl.y - polyLine.tl.y)) / 2;
  if (Number.isFinite(nonDescBottomDelta) && nonDescBottomDelta < lineObj.bbox.bottom && nonDescBottomDelta < lineHeight / 2) {
    lineObj.baseline[1] = nonDescBottomDelta - (lineObj.bbox.bottom - polyLine.bl.y);
  } else {
    lineObj.baseline[1] = lineHeight * -1 / 3 - (lineObj.bbox.bottom - polyLine.bl.y);
  }
  if (xHeight && xHeight > 0) lineObj.xHeight = xHeight;
  if (ascHeight && ascHeight > 0) lineObj.ascHeight = ascHeight;
  return lineObj;
}
function convertBoundingBox(textractBbox, pageDims) {
  return {
    left: Math.round(textractBbox.Left * pageDims.width),
    top: Math.round(textractBbox.Top * pageDims.height),
    right: Math.round((textractBbox.Left + textractBbox.Width) * pageDims.width),
    bottom: Math.round((textractBbox.Top + textractBbox.Height) * pageDims.height)
  };
}
function convertPolygon(textractPolygon, pageDims, orientation) {
  let br = 2;
  let bl = 3;
  let tr = 1;
  let tl = 0;
  if (orientation === 1) {
    br = 1;
    bl = 2;
    tr = 0;
    tl = 3;
  } else if (orientation === 2) {
    br = 0;
    bl = 1;
    tr = 3;
    tl = 2;
  } else if (orientation === 3) {
    br = 3;
    bl = 0;
    tr = 2;
    tl = 1;
  }
  return {
    br: {
      x: Math.round(textractPolygon[br].X * pageDims.width),
      y: Math.round(textractPolygon[br].Y * pageDims.height)
    },
    bl: {
      x: Math.round(textractPolygon[bl].X * pageDims.width),
      y: Math.round(textractPolygon[bl].Y * pageDims.height)
    },
    tr: {
      x: Math.round(textractPolygon[tr].X * pageDims.width),
      y: Math.round(textractPolygon[tr].Y * pageDims.height)
    },
    tl: {
      x: Math.round(textractPolygon[tl].X * pageDims.width),
      y: Math.round(textractPolygon[tl].Y * pageDims.height)
    }
  };
}
function createParagraphsFromLayout(pageObj, layoutBlocks, relationshipMap, blockMap, lineObjMap) {
  layoutBlocks.forEach((layoutBlock) => {
    const childIds = relationshipMap.get(layoutBlock.Id) || [];
    const paragraphLines = [];
    childIds.forEach((childId) => {
      const childBlock = blockMap.get(childId);
      if (childBlock && childBlock.BlockType === "LINE") {
        const lineObj = lineObjMap.get(childId);
        if (lineObj) {
          paragraphLines.push(lineObj);
        }
      }
    });
    if (paragraphLines.length > 0) {
      const parBbox = calcBboxUnion(paragraphLines.map((line) => line.bbox));
      const parObj = new ocr.OcrPar(pageObj, parBbox);
      parObj.reason = layoutBlock.BlockType || "LAYOUT_UNKNOWN";
      paragraphLines.forEach((lineObj) => {
        lineObj.par = parObj;
      });
      parObj.lines = paragraphLines;
      pageObj.pars.push(parObj);
    }
  });
  const unassignedLines = pageObj.lines.filter((line) => !line.par);
  if (unassignedLines.length > 0) {
    const parBbox = calcBboxUnion(unassignedLines.map((line) => line.bbox));
    const parObj = new ocr.OcrPar(pageObj, parBbox);
    parObj.reason = "UNASSIGNED_LINES";
    unassignedLines.forEach((lineObj) => {
      lineObj.par = parObj;
    });
    parObj.lines = unassignedLines;
    pageObj.pars.push(parObj);
  }
}
function convertTableLayoutTextract(pageNum, tableBlocks, pageDims, blockMap) {
  const tablesPage = new LayoutDataTablePage(pageNum);
  const relationshipMap = /* @__PURE__ */ new Map();
  tableBlocks.forEach((block) => {
    if (block.Relationships) {
      block.Relationships.forEach((rel) => {
        if (rel.Type === "CHILD") {
          relationshipMap.set(block.Id, rel.Ids || []);
        }
      });
    }
  });
  for (const tableBlock of tableBlocks) {
    const table2 = new LayoutDataTable(tablesPage);
    table2.detectionMethod = "textract";
    const tableBbox = convertBoundingBox(tableBlock.Geometry.BoundingBox, pageDims);
    const cellIds = relationshipMap.get(tableBlock.Id) || [];
    const cellBlocks = cellIds.map((id) => blockMap.get(id)).filter((block) => block && block.BlockType === "CELL");
    if (cellBlocks.length > 0) {
      const cellsByRow = /* @__PURE__ */ new Map();
      cellBlocks.forEach((cell) => {
        const rowIndex = cell.RowIndex || 0;
        if (!cellsByRow.has(rowIndex)) {
          cellsByRow.set(rowIndex, []);
        }
        cellsByRow.get(rowIndex).push(cell);
      });
      const firstRowCells = cellsByRow.get(0) || cellsByRow.get(1) || [];
      firstRowCells.sort((a, b) => (a.ColumnIndex || 0) - (b.ColumnIndex || 0));
      firstRowCells.forEach((cell) => {
        const cellBbox = convertBoundingBox(cell.Geometry.BoundingBox, pageDims);
        const column = new LayoutDataColumn({
          left: cellBbox.left,
          top: tableBbox.top,
          right: cellBbox.right,
          bottom: tableBbox.bottom
        }, table2);
        table2.boxes.push(column);
      });
      const maxRow = Math.max(...cellBlocks.map((c) => c.RowIndex || 0));
      const startRow = cellsByRow.has(0) ? 0 : 1;
      table2.rowBounds = [];
      for (let r = startRow; r <= maxRow; r++) {
        const rowCells = cellsByRow.get(r) || [];
        let maxBottom = 0;
        for (const cell of rowCells) {
          const cellBbox = convertBoundingBox(cell.Geometry.BoundingBox, pageDims);
          if (cellBbox.bottom > maxBottom) maxBottom = cellBbox.bottom;
        }
        table2.rowBounds.push(maxBottom);
      }
    }
    if (table2.boxes.length > 0) {
      tablesPage.tables.push(table2);
    }
  }
  return tablesPage;
}
async function convertDocAzureDocIntel({ ocrStr, pageDims }) {
  let ocrData;
  try {
    ocrData = JSON.parse(ocrStr);
  } catch (error) {
    throw new Error("Failed to parse Azure Document Intelligence JSON data.");
  }
  if (!ocrData.analyzeResult || !ocrData.analyzeResult.pages || !ocrData.analyzeResult.pages[0]) {
    throw new Error("Invalid Azure Document Intelligence format: missing pages data.");
  }
  const analyzeResultPages = (
    /** @type {AzureDocIntelPage[]} */
    ocrData.analyzeResult.pages
  );
  const resArr = [];
  for (let n = 0; n < analyzeResultPages.length; n++) {
    const pageData = analyzeResultPages[n];
    const pageDimsN = pageDims[n];
    if (!pageData.width || !pageData.height) {
      throw new Error("Failed to parse page dimensions.");
    }
    const pageObj = new ocr.OcrPage(n, pageDimsN);
    pageObj.textSource = "azure_doc_intel";
    if (!pageData.words || pageData.words.length === 0) {
      const warn = { char: "char_error" };
      resArr.push({
        pageObj,
        charMetricsObj: {},
        dataTables: new LayoutDataTablePage(n),
        warn
      });
    }
    if (pageData.unit !== "pixel") {
      if (!pageDimsN || !pageDimsN.width || !pageDimsN.height) {
        throw new Error("Page dimensions must be provided for non-pixel units.");
      }
      const pageDimsMult = {
        width: pageDimsN.width / pageData.width,
        height: pageDimsN.height / pageData.height
      };
      pageData.lines.forEach((line) => {
        line.polygon = line.polygon.map((val, idx) => idx % 2 === 0 ? val * pageDimsMult.width : val * pageDimsMult.height);
      });
      pageData.words.forEach((word) => {
        word.polygon = word.polygon.map((val, idx) => idx % 2 === 0 ? val * pageDimsMult.width : val * pageDimsMult.height);
      });
    }
    for (let i = 0; i < pageData.lines.length; i++) {
      const lineWordsInput = (
        /** @type {AzureDocIntelWord[]} */
        []
      );
      for (let j = 0; j < pageData.lines[i].spans.length; j++) {
        const span = pageData.lines[i].spans[j];
        for (let k = 0; k < pageData.words.length; k++) {
          const wordSpan = pageData.words[k].span;
          if (wordSpan.offset >= span.offset && wordSpan.offset + wordSpan.length <= span.offset + span.length) {
            lineWordsInput.push(pageData.words[k]);
          }
        }
      }
      if (lineWordsInput.length === 0) continue;
      const allX = lineWordsInput.flatMap((w) => w.polygon.filter((_, idx) => idx % 2 === 0));
      const allY = lineWordsInput.flatMap((w) => w.polygon.filter((_, idx) => idx % 2 === 1));
      const lineBbox = {
        left: Math.min(...allX),
        top: Math.min(...allY),
        right: Math.max(...allX),
        bottom: Math.max(...allY)
      };
      const baseline = [0, 0];
      const lineObj = new ocr.OcrLine(pageObj, lineBbox, baseline);
      for (let j = 0; j < lineWordsInput.length; j++) {
        const wordData = lineWordsInput[j];
        if (!wordData.content || wordData.content.trim() === "") continue;
        const wordX = wordData.polygon.filter((_, idx) => idx % 2 === 0);
        const wordY = wordData.polygon.filter((_, idx) => idx % 2 === 1);
        const wordBbox = {
          left: Math.min(...wordX),
          top: Math.min(...wordY),
          right: Math.max(...wordX),
          bottom: Math.max(...wordY)
        };
        const wordId = `word_${n + 1}_${pageObj.lines.length + 1}_${j + 1}`;
        const wordObj = new ocr.OcrWord(lineObj, wordId, wordData.content, wordBbox);
        wordObj.conf = Math.round((wordData.confidence || 0) * 100);
        lineObj.words.push(wordObj);
      }
      if (lineObj.words.length > 0) {
        const linePolyRaw = pageData.lines[i].polygon;
        const polyLine = {
          tl: { x: linePolyRaw[0], y: linePolyRaw[1] },
          tr: { x: linePolyRaw[2], y: linePolyRaw[3] },
          br: { x: linePolyRaw[4], y: linePolyRaw[5] },
          bl: { x: linePolyRaw[6], y: linePolyRaw[7] }
        };
        if (polyLine.br.x !== polyLine.bl.x) {
          lineObj.baseline[0] = (polyLine.br.y - polyLine.bl.y) / (polyLine.br.x - polyLine.bl.x);
        }
        const lineHeight = (polyLine.br.y - polyLine.tr.y + (polyLine.bl.y - polyLine.tl.y)) / 2;
        lineObj.baseline[1] = lineHeight * -1 / 4 - (lineObj.bbox.bottom - polyLine.bl.y);
        const ascHeight = lineHeight * 3 / 5;
        if (ascHeight > 0) lineObj.ascHeight = ascHeight;
        pageObj.lines.push(lineObj);
      }
    }
    const pageAngle = pageData.angle || 0;
    pageObj.angle = pageAngle;
    const langSet = pass3(pageObj);
    resArr.push({ pageObj, dataTables: null, langSet });
  }
  const tablesByPage = convertTableLayoutAzure(ocrData.analyzeResult.tables, pageDims, analyzeResultPages);
  for (let n = 0; n < resArr.length; n++) {
    resArr[n].dataTables = tablesByPage.get(n) || new LayoutDataTablePage(n);
  }
  return resArr;
}
function convertTableLayoutAzure(tables, pageDims, pagesData) {
  const result = /* @__PURE__ */ new Map();
  if (!tables || tables.length === 0) return result;
  for (const tableData of tables) {
    const pageNumber = tableData.boundingRegions?.[0]?.pageNumber;
    if (!pageNumber) continue;
    const pageIdx = pageNumber - 1;
    if (!result.has(pageIdx)) {
      result.set(pageIdx, new LayoutDataTablePage(pageIdx));
    }
    const tablesPage = result.get(pageIdx);
    const table2 = new LayoutDataTable(tablesPage);
    table2.detectionMethod = "azure_doc_intel";
    const { rowCount } = tableData;
    const pageData = pagesData[pageIdx];
    const pageDimsN = pageDims[pageIdx];
    let multW = 1;
    let multH = 1;
    if (pageData && pageDimsN && pageData.unit !== "pixel") {
      multW = pageDimsN.width / pageData.width;
      multH = pageDimsN.height / pageData.height;
    }
    const cellsByRow = /* @__PURE__ */ new Map();
    for (const cell of tableData.cells) {
      const r = cell.rowIndex;
      if (!cellsByRow.has(r)) cellsByRow.set(r, []);
      cellsByRow.get(r).push(cell);
    }
    const firstRowCells = (cellsByRow.get(0) || []).sort((a, b) => a.columnIndex - b.columnIndex);
    let tableTop = Infinity;
    let tableBottom = -Infinity;
    for (const cell of tableData.cells) {
      const poly = cell.boundingRegions?.[0]?.polygon;
      if (!poly) continue;
      const yCoords = poly.filter((_, i) => i % 2 === 1).map((y) => y * multH);
      tableTop = Math.min(tableTop, ...yCoords);
      tableBottom = Math.max(tableBottom, ...yCoords);
    }
    for (const cell of firstRowCells) {
      const poly = cell.boundingRegions?.[0]?.polygon;
      if (!poly) continue;
      const left = poly[0] * multW;
      const right = poly[2] * multW;
      table2.boxes.push(new LayoutDataColumn({
        left: Math.round(left),
        top: Math.round(tableTop),
        right: Math.round(right),
        bottom: Math.round(tableBottom)
      }, table2));
    }
    table2.rowBounds = [];
    for (let r = 0; r < rowCount; r++) {
      const rowCells = cellsByRow.get(r) || [];
      let maxBottom = 0;
      for (const cell of rowCells) {
        const poly = cell.boundingRegions?.[0]?.polygon;
        if (!poly) continue;
        const bottom = Math.max(poly[5], poly[7]) * multH;
        if (bottom > maxBottom) maxBottom = bottom;
      }
      table2.rowBounds.push(Math.round(maxBottom));
    }
    if (table2.boxes.length > 0) {
      tablesPage.tables.push(table2);
    }
  }
  return result;
}
async function convertDocGoogleDocAI({ ocrStr, pageDims, pageNum }) {
  let ocrData;
  try {
    ocrData = JSON.parse(ocrStr);
  } catch (error) {
    throw new Error("Failed to parse Google Document AI JSON data.");
  }
  if (!ocrData.pages || ocrData.pages.length === 0) {
    throw new Error("Invalid Google Document AI format: missing pages data.");
  }
  const fullText = ocrData.text || "";
  const resArr = [];
  if (pageNum !== void 0 && ocrData.pages.length > 1) {
    console.warn("Multiple PAGE blocks found but pageNum is specified. Using pageNum for all pages.");
  }
  for (let i = 0; i < ocrData.pages.length; i++) {
    const n = pageNum ?? i;
    const pageData = ocrData.pages[i];
    const pageDimsN = pageDims[i];
    const pageWidth = pageData.dimension?.width;
    const pageHeight = pageData.dimension?.height;
    if (!pageWidth || !pageHeight) {
      throw new Error(`Failed to parse page dimensions for page ${n}.`);
    }
    const scaleX = pageDimsN ? pageDimsN.width / pageWidth : 1;
    const scaleY = pageDimsN ? pageDimsN.height / pageHeight : 1;
    const pageDimsOut = pageDimsN || { width: pageWidth, height: pageHeight };
    const pageObj = new ocr.OcrPage(n, pageDimsOut);
    pageObj.textSource = "google_doc_ai";
    const pageTokens = pageData.tokens;
    const pageLines = pageData.lines;
    if (!pageTokens || pageTokens.length === 0 || !pageLines || pageLines.length === 0) {
      resArr.push({
        pageObj,
        charMetricsObj: {},
        dataTables: new LayoutDataTablePage(n),
        warn: { char: "char_error" }
      });
      continue;
    }
    const lineSegments = pageLines.map((line) => {
      const seg = line.layout?.textAnchor?.textSegments?.[0];
      return {
        startIndex: parseInt(seg?.startIndex || "0", 10),
        endIndex: parseInt(seg?.endIndex || "0", 10),
        line
      };
    });
    const lineTextRanges = [];
    for (let j = 0; j < lineSegments.length; j++) {
      const lineSeg = lineSegments[j];
      const lineLayout = lineSeg.line.layout;
      const lineVertices = getScaledVertices(lineLayout.boundingPoly, pageWidth, pageHeight, scaleX, scaleY);
      const lineXs = lineVertices.map((v) => v.x);
      const lineYs = lineVertices.map((v) => v.y);
      const lineBbox = {
        left: Math.min(...lineXs),
        top: Math.min(...lineYs),
        right: Math.max(...lineXs),
        bottom: Math.max(...lineYs)
      };
      const linePoly = {
        tl: lineVertices[0],
        tr: lineVertices[1],
        br: lineVertices[2],
        bl: lineVertices[3]
      };
      const baseline = [0, 0];
      if (linePoly.br.x !== linePoly.bl.x) {
        baseline[0] = (linePoly.br.y - linePoly.bl.y) / (linePoly.br.x - linePoly.bl.x);
      }
      const lineObj = new ocr.OcrLine(pageObj, lineBbox, baseline);
      const lineTokens = [];
      for (let k = 0; k < pageTokens.length; k++) {
        const token = pageTokens[k];
        const tokenSeg = token.layout?.textAnchor?.textSegments?.[0];
        const tokenStart = parseInt(tokenSeg?.startIndex || "0", 10);
        const tokenEnd = parseInt(tokenSeg?.endIndex || "0", 10);
        if (tokenStart >= lineSeg.startIndex && tokenEnd <= lineSeg.endIndex) {
          lineTokens.push(token);
        }
      }
      if (lineTokens.length === 0) continue;
      for (let l = 0; l < lineTokens.length; l++) {
        const token = lineTokens[l];
        const tokenLayout = token.layout;
        const tokenSeg = tokenLayout?.textAnchor?.textSegments?.[0];
        const tokenStart = parseInt(tokenSeg?.startIndex || "0", 10);
        const tokenEnd = parseInt(tokenSeg?.endIndex || "0", 10);
        const wordText = fullText.substring(tokenStart, tokenEnd).trim();
        if (!wordText) continue;
        const tokenVertices = getScaledVertices(tokenLayout.boundingPoly, pageWidth, pageHeight, scaleX, scaleY);
        const xs = tokenVertices.map((v) => v.x);
        const ys = tokenVertices.map((v) => v.y);
        const wordBbox = {
          left: Math.min(...xs),
          top: Math.min(...ys),
          right: Math.max(...xs),
          bottom: Math.max(...ys)
        };
        const wordId = `word_${n + 1}_${pageObj.lines.length + 1}_${l + 1}`;
        const wordObj = new ocr.OcrWord(lineObj, wordId, wordText, wordBbox);
        wordObj.conf = Math.round((tokenLayout.confidence || 0) * 100);
        lineObj.words.push(wordObj);
      }
      if (lineObj.words.length > 0) {
        splitUnicodeSuperscripts(lineObj);
        const wordBboxes = lineObj.words.map((w) => w.bbox);
        lineObj.bbox = calcBboxUnion(wordBboxes);
        const lineHeight = (linePoly.br.y - linePoly.tr.y + (linePoly.bl.y - linePoly.tl.y)) / 2;
        lineObj.ascHeight = lineHeight * 3 / 4;
        lineObj.baseline[1] = lineHeight * -1 / 4 - (lineObj.bbox.bottom - linePoly.bl.y);
        lineTextRanges.push({ startIndex: lineSeg.startIndex, endIndex: lineSeg.endIndex });
        pageObj.lines.push(lineObj);
      }
    }
    const pageParagraphs = pageData.paragraphs;
    if (pageParagraphs && pageParagraphs.length > 0) {
      for (const pagePar of pageParagraphs) {
        const parSeg = pagePar.layout?.textAnchor?.textSegments?.[0];
        const parStart = parseInt(parSeg?.startIndex || "0", 10);
        const parEnd = parseInt(parSeg?.endIndex || "0", 10);
        const paragraphLines = [];
        for (let k = 0; k < pageObj.lines.length; k++) {
          const lr = lineTextRanges[k];
          if (lr.startIndex >= parStart && lr.endIndex <= parEnd) {
            paragraphLines.push(pageObj.lines[k]);
          }
        }
        if (paragraphLines.length > 0) {
          const parBbox = calcBboxUnion(paragraphLines.map((line) => line.bbox));
          const parObj = new ocr.OcrPar(pageObj, parBbox);
          paragraphLines.forEach((lineObj) => {
            lineObj.par = parObj;
          });
          parObj.lines = paragraphLines;
          pageObj.pars.push(parObj);
        }
      }
      const unassignedLines = pageObj.lines.filter((line) => !line.par);
      if (unassignedLines.length > 0) {
        const parBbox = calcBboxUnion(unassignedLines.map((line) => line.bbox));
        const parObj = new ocr.OcrPar(pageObj, parBbox);
        unassignedLines.forEach((lineObj) => {
          lineObj.par = parObj;
        });
        parObj.lines = unassignedLines;
        pageObj.pars.push(parObj);
        console.warn(`Page ${n}: ${unassignedLines.length} line(s) were added to fallback paragraph due to missing paragraph assignments.`);
      }
    }
    const langSet = pass3(pageObj);
    const dataTables = new LayoutDataTablePage(n);
    resArr.push({ pageObj, dataTables, langSet });
  }
  return resArr;
}
function getScaledVertices(boundingPoly, pageWidth, pageHeight, scaleX, scaleY) {
  if (boundingPoly.vertices && boundingPoly.vertices.length > 0 && boundingPoly.vertices.some((v) => v.x !== void 0 || v.y !== void 0)) {
    return boundingPoly.vertices.map((v) => ({
      x: (v.x || 0) * scaleX,
      y: (v.y || 0) * scaleY
    }));
  }
  if (boundingPoly.normalizedVertices && boundingPoly.normalizedVertices.length > 0) {
    return boundingPoly.normalizedVertices.map((v) => ({
      x: (v.x || 0) * pageWidth * scaleX,
      y: (v.y || 0) * pageHeight * scaleY
    }));
  }
  throw new Error("No vertices found in bounding poly.");
}
async function convertPageGoogleVision({ ocrStr, n, pageDims }) {
  const ocrJson = JSON.parse(ocrStr);
  let visionResult;
  if (ocrJson.fullTextAnnotation) {
    visionResult = ocrJson;
  } else if (ocrJson?.responses?.[0]?.fullTextAnnotation) {
    visionResult = ocrJson?.responses?.[0];
  } else {
    visionResult = ocrJson?.[0];
  }
  if (!visionResult || !visionResult.fullTextAnnotation) {
    throw new Error("Failed to parse Google Vision OCR data.");
  }
  const pageVision = (
    /** @type {GoogleVisionPage} */
    visionResult.fullTextAnnotation?.pages?.[0]
  );
  const pageWidth = pageVision.width;
  const pageHeight = pageVision.height;
  if (!pageWidth || !pageHeight) {
    throw new Error("Failed to parse page dimensions.");
  }
  const scaleX = pageDims ? pageDims.width / pageWidth : 1;
  const scaleY = pageDims ? pageDims.height / pageHeight : 1;
  const getVertices = (boundingBox) => {
    if (boundingBox.vertices) {
      return boundingBox.vertices.map((v) => ({
        x: (v.x || 0) * scaleX,
        y: (v.y || 0) * scaleY
      }));
    }
    if (boundingBox.normalizedVertices) {
      return boundingBox.normalizedVertices.map((v) => ({
        x: (v.x || 0) * pageWidth * scaleX,
        y: (v.y || 0) * pageHeight * scaleY
      }));
    }
    throw new Error("No vertices found in bounding box.");
  };
  const pageDimsOut = pageDims || { width: pageWidth, height: pageHeight };
  const pageObj = new ocr.OcrPage(n, pageDimsOut);
  if (!pageVision.blocks || pageVision.blocks.length === 0) {
    const warn = { char: "char_error" };
    return {
      pageObj,
      charMetricsObj: {},
      dataTables: new LayoutDataTablePage(n),
      warn
    };
  }
  const tablesPage = new LayoutDataTablePage(n);
  const angleRisePage = [];
  pageVision.blocks.forEach((block, blockIndex) => {
    if (!block.paragraphs) return;
    block.paragraphs.forEach((paragraph, paragraphIndex) => {
      const wordsVision = paragraph.words;
      if (!wordsVision || wordsVision.length === 0) return;
      const parVertices = getVertices(paragraph.boundingBox);
      const xsPar = parVertices.map((v) => v.x || 0);
      const ysPar = parVertices.map((v) => v.y || 0);
      const bboxPar = {
        left: Math.min(...xsPar),
        top: Math.min(...ysPar),
        right: Math.max(...xsPar),
        bottom: Math.max(...ysPar)
      };
      const parObj = new ocr.OcrPar(pageObj, bboxPar);
      parObj.reason = String(block.blockType || "TEXT");
      let lineObj = new ocr.OcrLine(pageObj, null, [0, 0]);
      let lineIndex = 0;
      wordsVision.forEach((word, wordIndex) => {
        if (!word.symbols || word.symbols.length === 0) return;
        const wordVertices = getVertices(word.boundingBox);
        const xs = wordVertices.map((v) => v.x || 0);
        const ys = wordVertices.map((v) => v.y || 0);
        const bboxWord = {
          left: Math.min(...xs),
          top: Math.min(...ys),
          right: Math.max(...xs),
          bottom: Math.max(...ys)
        };
        const id = `word_${n + 1}_${blockIndex + 1}_${paragraphIndex + 1}_${lineIndex + 1}_${wordIndex + 1}`;
        const wordText = word.symbols.map((symbol) => symbol.text || "").join("");
        let charObjs = (
          /** @type {?OcrChar[]} */
          null
        );
        const wordObj = new ocr.OcrWord(lineObj, id, wordText, bboxWord);
        wordObj.conf = (word.confidence || 0) * 100;
        wordObj.chars = charObjs;
        lineObj.words.push(wordObj);
        const hasLineBreak = word.symbols.some((symbol) => {
          const breakType = symbol.property?.detectedBreak?.type;
          return breakType === "LINE_BREAK" || breakType === "EOL_SURE_SPACE";
        });
        if (hasLineBreak || wordIndex === wordsVision.length - 1) {
          if (lineObj.words.length > 0) {
            const wordBboxes = lineObj.words.map((w) => w.bbox);
            lineObj.bbox = calcBboxUnion(wordBboxes);
            calculateTextMetrics(lineObj);
            pageObj.lines.push(lineObj);
            parObj.lines.push(lineObj);
            lineObj.par = parObj;
            lineIndex++;
          }
          if (wordIndex !== wordsVision.length - 1) {
            lineObj = new ocr.OcrLine(pageObj, null, [0, 0]);
          }
        }
      });
      if (parObj.lines.length > 0) {
        pageObj.pars.push(parObj);
      }
    });
  });
  pageObj.lines.forEach((line) => {
    const wordBoxArr = line.words.map((x) => x.bbox);
    line.bbox = calcBboxUnion(wordBoxArr);
  });
  const angleRiseMedian = mean50(angleRisePage) || 0;
  const angleOut = Math.asin(angleRiseMedian) * (180 / Math.PI);
  pageObj.angle = angleOut;
  pageObj.textSource = "google_vision";
  const langSet = pass3(pageObj);
  return { pageObj, dataTables: tablesPage, langSet };
}
function calculateTextMetrics(lineObj) {
  const wordHeights = lineObj.words.map((w) => w.bbox.bottom - w.bbox.top);
  if (wordHeights.length === 0) return;
  const sortedHeights = [...wordHeights].sort((a, b) => a - b);
  const medianHeight = sortedHeights[Math.floor(sortedHeights.length / 2)];
  lineObj.ascHeight = medianHeight * 2 / 3;
  lineObj.baseline[1] = medianHeight * -1 / 3;
}
function imageStrToBlob(imgStr) {
  const imgData = base64ToBytes(imgStr);
  const imgBlob = new Blob([imgData], { type: "application/octet-stream" });
  return imgBlob;
}
function base64ToBytes(base64) {
  const commaIndex = base64.slice(0, 100).indexOf(",");
  if (commaIndex > 0) {
    base64 = base64.slice(commaIndex + 1);
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function getPngDimensions(base64) {
  const bytes = base64ToBytes(base64.slice(0, 150).split(",")[1].slice(0, 96));
  const width = bytes[16] << 24 | bytes[17] << 16 | bytes[18] << 8 | bytes[19];
  const height = bytes[20] << 24 | bytes[21] << 16 | bytes[22] << 8 | bytes[23];
  return { width, height };
}
function getJpegDimensions(base64) {
  const bytes = base64ToBytes(base64.split(",")[1]);
  let i = 0;
  if (bytes[i] === 255 && bytes[i + 1] === 216) {
    i += 2;
  }
  while (i < bytes.length) {
    if (bytes[i] === 255) {
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(bytes[i + 1])) {
        const height = bytes[i + 5] << 8 | bytes[i + 6];
        const width = bytes[i + 7] << 8 | bytes[i + 8];
        return { width, height };
      }
      const segmentLength = bytes[i + 2] << 8 | bytes[i + 3];
      i += segmentLength + 2;
      continue;
    }
    i++;
  }
  throw new Error("Could not find dimensions in the JPEG image.");
}
const FILES = [
  // Symbol fonts precede the CJK fonts. Latin documents should not be allowed to fall back to CJK fonts for symbols.
  // Among other issues, the ellipsis is vertically centered in CJK fonts.
  { path: "../fonts/fallback/NotoSansSymbols-Regular.ttf", alias: "_scribe_fallback_symbols" },
  { path: "../fonts/fallback/NotoSansSymbols2-Regular.ttf", alias: "_scribe_fallback_symbols2" },
  { path: "../fonts/NotoSansSC-Regular.ttf", alias: "_scribe_fallback_sc" },
  { path: "../fonts/fallback/NotoSansKR-Regular.otf", alias: "_scribe_fallback_kr" },
  { path: "../fonts/fallback/NotoSansArabic-Regular.ttf", alias: "_scribe_fallback_arabic" },
  { path: "../fonts/fallback/NotoSansHebrew-Regular.ttf", alias: "_scribe_fallback_hebrew" },
  { path: "../fonts/fallback/NotoSansDevanagari-Regular.ttf", alias: "_scribe_fallback_devanagari" },
  { path: "../fonts/fallback/NotoSansBengali-Regular.ttf", alias: "_scribe_fallback_bengali" },
  { path: "../fonts/fallback/NotoSansTamil-Regular.ttf", alias: "_scribe_fallback_tamil" },
  { path: "../fonts/fallback/NotoSansTelugu-Regular.ttf", alias: "_scribe_fallback_telugu" },
  { path: "../fonts/fallback/NotoSansGujarati-Regular.ttf", alias: "_scribe_fallback_gujarati" },
  { path: "../fonts/fallback/NotoSansGurmukhi-Regular.ttf", alias: "_scribe_fallback_gurmukhi" },
  { path: "../fonts/fallback/NotoSansKannada-Regular.ttf", alias: "_scribe_fallback_kannada" },
  { path: "../fonts/fallback/NotoSansMalayalam-Regular.ttf", alias: "_scribe_fallback_malayalam" },
  { path: "../fonts/fallback/NotoSansThai-Regular.ttf", alias: "_scribe_fallback_thai" },
  { path: "../fonts/fallback/NotoSansLao-Regular.ttf", alias: "_scribe_fallback_lao" },
  { path: "../fonts/fallback/NotoSansKhmer-Regular.ttf", alias: "_scribe_fallback_khmer" },
  { path: "../fonts/fallback/NotoSansMyanmar-Regular.ttf", alias: "_scribe_fallback_myanmar" }
];
FILES.map((f) => `"${f.alias}"`).join(", ");
async function registerFallbackFonts(CanvasNode) {
  if (typeof process === "undefined") return;
  const { readFileSync } = await import("./__vite-browser-external-Dhvy_jtL.js");
  const { fileURLToPath } = await import("./__vite-browser-external-Dhvy_jtL.js");
  for (const { path, alias } of FILES) {
    try {
      const bytes = readFileSync(fileURLToPath(new URL(path, import.meta.url)));
      CanvasNode.GlobalFonts.register(bytes, alias);
    } catch (e) {
      console.warn(`[fallbackFonts] Failed to register ${alias} (${path}): ${e.message}`);
    }
  }
}
class ca {
  static CanvasNode;
  static _initPromise = null;
  /**
   * Load Node.js canvas module.
   * Must be called at least once before any canvas operations in Node.
   */
  static getCanvasNode = async () => {
    if (typeof process !== "undefined") {
      if (!ca._initPromise) {
        ca._initPromise = (async () => {
          ca.CanvasNode = await import("./scribe-canvas-stub-BBr6PUBI.js");
          globalThis.ImageData = ca.CanvasNode.ImageData;
          globalThis.DOMMatrix = ca.CanvasNode.DOMMatrix;
          await registerFallbackFonts(ca.CanvasNode);
          return ca.CanvasNode;
        })();
      }
      return ca._initPromise;
    }
    return void 0;
  };
  static getCanvasNodeSync = () => {
    if (!ca.CanvasNode) throw new Error("@scribe.js/canvas not initialized — call await ca.getCanvasNode() first");
    return ca.CanvasNode;
  };
  /**
   * Create a canvas. Sync — @scribe.js/canvas must already be loaded in Node.js.
   * @param {number} width
   * @param {number} height
   */
  static makeCanvas = (width, height) => {
    if (typeof process !== "undefined") {
      return ca.getCanvasNodeSync().createCanvas(width, height);
    }
    return new OffscreenCanvas(width, height);
  };
  /**
   * @param {number} width
   * @param {number} height
   */
  static createCanvas = async (width, height) => {
    if (typeof process !== "undefined") {
      if (!width || !height || width <= 0 || height <= 0) {
        throw new Error(`Invalid canvas size: ${width}x${height}`);
      }
      const CanvasNode = await ca.getCanvasNode();
      return CanvasNode.createCanvas(width, height);
    }
    return new OffscreenCanvas(width, height);
  };
  /**
   * Synchronously release a drawable's native resources.
   * @param {*} d
   */
  static closeDrawable = (d) => {
    if (!d) return;
    if (typeof d.dispose === "function") {
      d.dispose();
      return;
    }
    if (typeof d.close === "function") d.close();
  };
  /**
   * Decode raw image bytes (JPEG, PNG, etc.) into a drawable for `ctx.drawImage()`.
   * Browser: creates Blob + createImageBitmap.
   * Node: @scribe.js/canvas's loadImage which accepts a Buffer / Uint8Array.
   * @param {Uint8Array} data - Raw image bytes
   */
  static createImageBitmapFromData = async (data) => {
    if (typeof process !== "undefined") {
      const CanvasNode = ca.getCanvasNodeSync();
      return CanvasNode.loadImage(Buffer.from(data));
    }
    return createImageBitmap(new Blob([data]));
  };
  /**
   * Create a drawable from an ImageData object.
   * Browser: createImageBitmap(imageData).
   * Node: putImageData onto a fresh Canvas — @scribe.js/canvas drawImage
   * accepts Canvas directly so we can return the canvas itself.
   * @param {ImageData} imgData
   */
  static createImageBitmapFromImageData = async (imgData) => {
    const canvas = ca.makeCanvas(imgData.width, imgData.height);
    canvas.getContext("2d").putImageData(imgData, 0, 0);
    return typeof process !== "undefined" ? canvas : createImageBitmap(canvas);
  };
  /**
   * Create a drawable from a canvas (snapshot).
   * Browser: createImageBitmap(canvas).
   * Node: pass through — @scribe.js/canvas drawImage accepts Canvas directly.
   * @param {*} canvas
   */
  static createImageBitmapFromCanvas = async (canvas) => {
    if (typeof process !== "undefined") return canvas;
    return createImageBitmap(canvas);
  };
  /**
   * Handles various image formats, always returns something drawable.
   *
   * @param {string|*|Promise<string>|Promise<*>} img
   */
  static getImageBitmap = async (img) => {
    img = await img;
    if (img === void 0) throw new Error("Input is undefined");
    if (img === null) throw new Error("Input is null");
    if (typeof img === "string") {
      if (typeof process !== "undefined") {
        const CanvasNode = await ca.getCanvasNode();
        return CanvasNode.loadImage(Buffer.from(base64ToBytes(img)));
      }
      const imgBlob = imageStrToBlob(img);
      return createImageBitmap(imgBlob);
    }
    return img;
  };
  /**
   * Composite key `${fontFaceName}:${fontFaceStyle}:${fontFaceWeight}` →
   * `{ fontKey, fontFaceName }`.
   * @type {Map<string, {fontKey: *, fontFaceName: string}>|null}
   */
  static _registeredFonts = null;
  /**
   * Register a font from raw bytes. Callers must pass stable family names
   * for the same bytes (embedded: `_pdf_d${docId}_f${fontObjNum}` via
   * `pdfFontFamilyName`; substitutes: `_scribe_*`) to avoid re-registration.
   *
   * @param {FontContainerFont} fontObj
   */
  static registerFontObj = async (fontObj) => {
    if (typeof process !== "undefined") {
      const CanvasNode = await ca.getCanvasNode();
      if (!ca._registeredFonts) ca._registeredFonts = /* @__PURE__ */ new Map();
      const dedupKey = `${fontObj.fontFaceName}:${fontObj.fontFaceStyle}:${fontObj.fontFaceWeight}`;
      if (ca._registeredFonts.has(dedupKey)) return;
      const fontBuffer = typeof fontObj.src === "string" ? (await import("./__vite-browser-external-Dhvy_jtL.js")).readFileSync(fontObj.src) : Buffer.from(fontObj.src);
      const weight = fontObj.fontFaceWeight === "bold" ? 700 : 400;
      const fontKey = CanvasNode.GlobalFonts.register(fontBuffer, fontObj.fontFaceName, {
        style: fontObj.fontFaceStyle,
        weight
      });
      ca._registeredFonts.set(dedupKey, { fontKey, fontFaceName: fontObj.fontFaceName });
    }
  };
  /**
   * Unregister every font scoped to the given owning document id.
   * Matches the two docId-namespaced naming schemes the project uses: optimized fonts named
   * `<family> Opt d${docId}` and embedded PDF fonts prefixed `_pdf_d${docId}_`.
   * Process-global `_scribe_*` substitute aliases and other docs' fonts are left untouched.
   * @param {number} docId
   */
  static unregisterFontsForDoc = (docId) => {
    const optSuffix = ` Opt d${docId}`;
    const pdfPrefix = `_pdf_d${docId}_`;
    ca.unregisterFontsMatching((name) => name.endsWith(optSuffix) || name.startsWith(pdfPrefix));
  };
  /**
   * Bulk-unregister every font whose family name matches `predicate`.
   * `_scribe_*` substitute aliases are process-global; callers should
   * scope their predicate so those are not removed.
   * Prefer `unregisterFontsForDoc` for the common "release a doc's fonts" case.
   *
   * @param {(name: string) => boolean} predicate - receives the font family
   *   name, i.e. the `fontFaceName` portion of the composite dedup key.
   */
  static unregisterFontsMatching = (predicate) => {
    if (typeof process !== "undefined") {
      if (!ca._registeredFonts) return;
      const toRemove = [];
      for (const [dedupKey, value] of ca._registeredFonts.entries()) {
        if (predicate(value.fontFaceName)) toRemove.push(dedupKey);
      }
      if (toRemove.length === 0) return;
      const CanvasNode = ca.getCanvasNodeSync();
      const keys = [];
      for (const dedupKey of toRemove) {
        const v = ca._registeredFonts.get(dedupKey);
        if (v && v.fontKey) keys.push(v.fontKey);
        ca._registeredFonts.delete(dedupKey);
      }
      if (keys.length > 0) CanvasNode.GlobalFonts.removeBatch(keys);
      if (typeof CanvasNode.GlobalFonts.clearRetired === "function") {
        CanvasNode.GlobalFonts.clearRetired();
      }
    }
  };
}
async function loadOpentype(src, kerningPairs = null) {
  const font = typeof src === "string" ? opentype.parse(await fetch(src).then((r) => r.arrayBuffer())) : opentype.parse(src);
  font.tables.gsub = null;
  if (kerningPairs) font.kerningPairs = kerningPairs;
  return font;
}
const fontFaceObj = {};
function loadFontFace(fontFamily, fontStyle, fontWeight, src) {
  if (typeof FontFace === "undefined") {
    const fontBuffer = src instanceof ArrayBuffer ? new Uint8Array(src) : src;
    const loaded = ca.registerFontObj({
      fontFaceName: fontFamily,
      fontFaceStyle: fontStyle,
      fontFaceWeight: fontWeight,
      src: fontBuffer
    });
    return { loaded, status: "loaded" };
  }
  const src1 = typeof src === "string" ? `url(${src})` : src;
  const fontFace = new FontFace(fontFamily, src1, { style: fontStyle, weight: fontWeight });
  if (fontFace.status === "error") throw new Error(`FontFace failed to load: ${fontFamily} ${fontStyle} ${fontWeight}`);
  const fontSet = globalThis.document ? globalThis.document.fonts : globalThis.fonts;
  if (typeof fontFaceObj[fontFamily] === "undefined") {
    fontFaceObj[fontFamily] = {};
  }
  if (typeof fontFaceObj[fontFamily][fontStyle] === "undefined") {
    fontFaceObj[fontFamily][fontStyle] = {};
  }
  if (typeof fontFaceObj[fontFamily][fontStyle][fontWeight] !== "undefined") {
    fontSet.delete(fontFaceObj[fontFamily][fontStyle][fontWeight]);
  }
  fontFaceObj[fontFamily][fontStyle][fontWeight] = fontFace;
  fontFace.load();
  fontSet.add(fontFace);
  return fontFace;
}
function unregisterFontFacesMatching(predicate) {
  if (typeof FontFace === "undefined") return 0;
  const fontSet = globalThis.document ? globalThis.document.fonts : globalThis.fonts;
  if (!fontSet) return 0;
  let removed = 0;
  for (const family of Object.keys(fontFaceObj)) {
    if (!predicate(family)) continue;
    const styles = fontFaceObj[family];
    for (const style of Object.keys(styles)) {
      const weights = styles[style];
      for (const weight of Object.keys(weights)) {
        fontSet.delete(weights[weight]);
        removed++;
      }
    }
    delete fontFaceObj[family];
  }
  return removed;
}
function unregisterFontFacesForDoc(docId) {
  const optSuffix = ` Opt d${docId}`;
  const pdfPrefix = `_pdf_d${docId}_`;
  return unregisterFontFacesMatching((family) => family.endsWith(optSuffix) || family.startsWith(pdfPrefix));
}
function FontContainerFont(family, styleLookup, src, opt, opentypeObj, docId = 0) {
  let fontFaceName = family;
  if (opt) fontFaceName += ` Opt d${docId}`;
  this.family = family;
  this.style = styleLookup;
  this.opt = opt;
  this.src = src;
  this.opentype = opentypeObj;
  this.fontFaceName = fontFaceName;
  this.fontFaceStyle = ["italic", "boldItalic"].includes(this.style) ? "italic" : "normal";
  this.fontFaceWeight = ["bold", "boldItalic"].includes(this.style) ? "bold" : "normal";
  this.type = (() => {
    const category = determineSansSerif(this.family);
    if (category === "SansDefault") return "sans";
    if (category === "SymbolDefault") return "symbol";
    return "serif";
  })();
  this.smallCapsMult = 0.75;
  this.disable = false;
  if (typeof FontFace !== "undefined") {
    loadFontFace(this.fontFaceName, this.fontFaceStyle, this.fontFaceWeight, this.src);
    this.registered = Promise.resolve();
  } else {
    this.registered = ca.registerFontObj(this).catch((err) => {
      console.error(`Failed to register font ${this.fontFaceName}:`, err);
    });
  }
}
async function loadFontContainerFamily(family, src, opt = false, docId = 0) {
  const res = {
    normal: null,
    italic: null,
    bold: null,
    boldItalic: null
  };
  const loadType = async (styleLookup) => {
    const srcType = src[styleLookup];
    if (!srcType) return;
    const font = await loadOpentype(srcType);
    const fontContainer = new FontContainerFont(family, styleLookup, srcType, opt, font, docId);
    await fontContainer.registered;
    res[styleLookup] = fontContainer;
  };
  await Promise.allSettled([loadType("normal"), loadType("italic"), loadType("bold"), loadType("boldItalic")]);
  return res;
}
async function loadFontsFromSource(srcObj, opt = false, docId = 0) {
  const fontObjPromise = {};
  for (const [family, src] of Object.entries(srcObj)) {
    fontObjPromise[family] = loadFontContainerFamily(family, src, opt, docId);
  }
  const fontObj = {};
  for (const [key, value] of Object.entries(fontObjPromise)) {
    fontObj[key] = await value;
  }
  return fontObj;
}
class GlobalFonts {
  /** @type {?FontContainer} */
  static raw = null;
  /** @type {?FontContainer} */
  static export = null;
  static supp = {
    /** @type {?FontContainerFont} */
    chi_sim: null,
    /** @type {?FontContainerFont} */
    dingbats: null,
    /** @type {?FontContainerFont} */
    symbol: null
  };
  /**
   * Decide whether to use the optimized version of a font family.
   * Note that even when this function returns `true`, optimized versions of every style will not exist.
   * @param {string} family - Font family name.
   * @param {DocFonts} docFonts - Per-document font state.
   */
  static useOptFamily = (family, docFonts) => {
    const raw = GlobalFonts.raw?.[family]?.normal;
    if (!raw) return false;
    const opt = docFonts.opt?.[family]?.normal;
    if (opt && docFonts.state.forceOpt) {
      return true;
    }
    if (opt && docFonts.state.enableOpt) {
      const defaultFamily = raw.type === "sans" ? docFonts.state.sansDefaultName : docFonts.state.serifDefaultName;
      const rawMetricDefault = docFonts.rawMetrics?.[defaultFamily];
      const optMetricDefault = docFonts.optMetrics?.[defaultFamily];
      const rawMetric = docFonts.rawMetrics?.[family];
      const optMetric = docFonts.optMetrics?.[family];
      if (rawMetric && optMetric && optMetric < rawMetric && optMetricDefault < rawMetricDefault) {
        return true;
      }
    }
    return false;
  };
  /**
   * Gets a font object.  Unlike accessing the font containers directly,
   * this method allows for special values 'Default', 'SansDefault', and 'SerifDefault' to be used.
   *
   * @param {Partial<Style>} style
   * @param {DocFonts} docFonts - Per-document font state.
   * @param {string} [lang='eng']
   * @returns {FontContainerFont}
   */
  static getFont = (style, docFonts, lang = "eng") => {
    let family = style.font || docFonts.state.defaultFontName;
    const styleLookup = getStyleLookup(style);
    if (docFonts.doc?.[family]?.[styleLookup] && !docFonts.doc?.[family]?.[styleLookup]?.disable) {
      return docFonts.doc[family][styleLookup];
    }
    if (lang === "chi_sim") {
      if (!GlobalFonts.supp.chi_sim) throw new Error("chi_sim font does not exist.");
      return GlobalFonts.supp.chi_sim;
    }
    if (!GlobalFonts.raw) throw new Error("Raw fonts not yet initialized.");
    if (!GlobalFonts.raw?.[family]?.[styleLookup]) {
      if (/NimbusRom/i.test(family)) {
        family = "NimbusRoman";
      } else if (/Times/i.test(family)) {
        family = "NimbusRoman";
      } else if (/NimbusSan/i.test(family)) {
        family = "NimbusSans";
      } else if (/Helvetica/i.test(family)) {
        family = "NimbusSans";
      } else if (/Arial/i.test(family)) {
        family = "NimbusSans";
      } else if (/CenturySch/i.test(family)) {
        family = "Century";
      } else if (/Palatino/i.test(family)) {
        family = "Palatino";
      } else if (/Garamond/i.test(family)) {
        family = "Garamond";
      } else if (/CenturyGothic/i.test(family)) {
        family = "Gothic";
      } else if (/AvantGarde/i.test(family)) {
        family = "Gothic";
      } else if (/Carlito/i.test(family)) {
        family = "Carlito";
      } else if (/Calibri/i.test(family)) {
        family = "Carlito";
      } else if (/Courier|NimbusMono/i.test(family)) {
        family = "NimbusMono";
      }
    }
    if (!GlobalFonts.raw?.[family]?.[styleLookup]) {
      family = determineSansSerif(family);
    }
    if (family === "Default" || family === "SymbolDefault") family = docFonts.state.defaultFontName;
    if (family === "SerifDefault") family = docFonts.state.serifDefaultName;
    if (family === "SansDefault") family = docFonts.state.sansDefaultName;
    let fontRes = GlobalFonts.raw?.[family]?.[styleLookup];
    if (!fontRes) throw new Error(`Font container does not contain ${family} (${styleLookup}).`);
    const opt = docFonts.opt?.[family]?.[styleLookup];
    const useOpt = GlobalFonts.useOptFamily(family, docFonts);
    if (opt && useOpt) fontRes = opt;
    return fontRes;
  };
  /**
   * @param {OcrWord} word
   * @param {DocFonts} docFonts - Per-document font state.
   */
  static getWordFont = (word, docFonts) => GlobalFonts.getFont(word.style, docFonts, word.lang);
}
class DocFonts {
  /**
   * Owning document id, used to key this document's fonts/metrics/settings in the workers'
   * `Map<docId, DocFonts>`. `0` for the standalone facade instance.
   * @type {number}
   */
  id = 0;
  /**
   * Whether this document's fonts or settings have been pushed to the general workers.
   * @type {boolean}
   */
  inWorkers = false;
  /** @type {?FontContainer} */
  opt = null;
  /** @type {?Object<string, FontContainerFamilyUpload>} */
  doc = null;
  /** @type {?Awaited<ReturnType<import('../fontEval.js').evaluateFonts>>} */
  rawMetrics = null;
  /** @type {?Awaited<ReturnType<import('../fontEval.js').evaluateFonts>>} */
  optMetrics = null;
  /**
   * Settings and metrics saved/restored from intermediate .scribe files. Each document has its own.
   * @type {FontState}
   */
  state = {
    /** Optimized fonts will be used when believed to improve quality. */
    enableOpt: false,
    /** Optimized fonts will always be used when they exist, even if believed to reduce quality. */
    forceOpt: false,
    defaultFontName: "SerifDefault",
    serifDefaultName: "NimbusRoman",
    sansDefaultName: "NimbusSans",
    glyphSet: null,
    /** @type {Object.<string, CharMetricsFamily>} */
    charMetrics: {}
  };
  /**
   * @param {Partial<Style>} style
   * @param {string} [lang='eng']
   * @returns {FontContainerFont}
   */
  getFont(style, lang = "eng") {
    return GlobalFonts.getFont(style, this, lang);
  }
  /** @param {OcrWord} word */
  getWordFont(word) {
    return GlobalFonts.getFont(word.style, this, word.lang);
  }
  /** @param {string} family */
  useOptFamily(family) {
    return GlobalFonts.useOptFamily(family, this);
  }
  /**
   * Load fonts from an ArrayBuffer containing arbitrary font data.
   * Supports .ttf, .otf, and .woff formats.
   * This function should only be used for fonts we do not provide, such as user-uploaded fonts.
   * @param {ArrayBuffer} src
   */
  addFontFromFile = async (src) => {
    let fontObj;
    let fontData;
    try {
      fontObj = await loadOpentype(src);
      fontData = fontObj.toArrayBuffer();
    } catch (error) {
      console.error("Error loading font.");
      console.error(error);
      return;
    }
    const fontNameEmbedded = fontObj.names.postScriptName.en;
    let styleLookup = (
      /** @type {StyleLookup} */
      "normal"
    );
    if (fontNameEmbedded.match(/boldit|bdit/i)) {
      styleLookup = "boldItalic";
    } else if (fontNameEmbedded.match(/italic/i)) {
      styleLookup = "italic";
    } else if (fontNameEmbedded.match(/bold/i)) {
      styleLookup = "bold";
    }
    const fontName = fontNameEmbedded.replace(/[^+]+\+/g, "").replace(/\s/g, "_");
    if (!this.doc?.[fontName]?.[styleLookup]) {
      try {
        const fontContainer = new FontContainerFont(fontName, styleLookup, fontData, false, fontObj);
        await fontContainer.registered;
        if (!this.doc) {
          this.doc = {};
        }
        if (!this.doc[fontName]) {
          this.doc[fontName] = {};
        }
        this.doc[fontName][styleLookup] = fontContainer;
      } catch (error) {
        console.error(`Error loading font ${fontName} ${styleLookup}.`);
      }
    } else {
      console.warn(`Font ${fontName} ${styleLookup} already exists.`);
    }
  };
  /**
   * Reset this document's font state. Does not unload process-wide built-in fonts.
   */
  clear() {
    this.opt = null;
    this.rawMetrics = null;
    this.optMetrics = null;
    this.state.defaultFontName = "SerifDefault";
    this.state.serifDefaultName = "NimbusRoman";
    this.state.sansDefaultName = "NimbusSans";
    clearObjectProperties(this.state.charMetrics);
    ca.unregisterFontsForDoc(this.id);
    unregisterFontFacesForDoc(this.id);
  }
}
let activeDocFonts = new DocFonts();
const setActiveDocFonts = (docFonts) => {
  activeDocFonts = docFonts;
};
class FontCont {
  static get raw() {
    return GlobalFonts.raw;
  }
  static set raw(v) {
    GlobalFonts.raw = v;
  }
  static get export() {
    return GlobalFonts.export;
  }
  static set export(v) {
    GlobalFonts.export = v;
  }
  static get supp() {
    return GlobalFonts.supp;
  }
  static set supp(v) {
    GlobalFonts.supp = v;
  }
  static get opt() {
    return activeDocFonts.opt;
  }
  static set opt(v) {
    activeDocFonts.opt = v;
  }
  static get doc() {
    return activeDocFonts.doc;
  }
  static set doc(v) {
    activeDocFonts.doc = v;
  }
  static get rawMetrics() {
    return activeDocFonts.rawMetrics;
  }
  static set rawMetrics(v) {
    activeDocFonts.rawMetrics = v;
  }
  static get optMetrics() {
    return activeDocFonts.optMetrics;
  }
  static set optMetrics(v) {
    activeDocFonts.optMetrics = v;
  }
  static get state() {
    return activeDocFonts.state;
  }
  static set state(v) {
    activeDocFonts.state = v;
  }
  static getFont = (style, lang = "eng") => GlobalFonts.getFont(style, activeDocFonts, lang);
  static getWordFont = (word) => GlobalFonts.getFont(word.style, activeDocFonts, word.lang);
  static useOptFamily = (family) => GlobalFonts.useOptFamily(family, activeDocFonts);
  static addFontFromFile = (src) => activeDocFonts.addFontFromFile(src);
  static clear = () => activeDocFonts.clear();
  static terminate = () => {
    activeDocFonts.clear();
    GlobalFonts.raw = null;
    activeDocFonts.state.glyphSet = null;
  };
}
const FONT_FAMILY$2 = "Times New Roman";
const FONT_SIZE$2 = 14;
const CHAR_SPACING$2 = 0;
const WORD_SPACING$1 = 0;
const LINE_HEIGHT$2 = 14.4;
const MARGIN_VERTICAL$2 = 30;
const MARGIN_HORIZONTAL$2 = 20;
let fontOpentype = null;
const resolveFontOpentype = () => {
  if (!fontOpentype) {
    fontOpentype = GlobalFonts.getFont({ font: FONT_FAMILY$2 }, new DocFonts()).opentype;
  }
  return fontOpentype;
};
function getTextWidth$2(text, size, font) {
  const { advanceArr, kerningArr } = calcWordCharMetrics(text, font);
  const advanceTotal = advanceArr.reduce((a, b) => a + b, 0);
  const kerningTotal = kerningArr.reduce((a, b) => a + b, 0);
  const wordLastGlyphMetrics = font.charToGlyph(text.at(-1)).getMetrics();
  const wordFirstGlyphMetrics = font.charToGlyph(text[0]).getMetrics();
  const wordLeftBearing = wordFirstGlyphMetrics.xMin || 0;
  const lastGlyphMax = wordLastGlyphMetrics.xMax || 0;
  const wordRightBearing = advanceArr[advanceArr.length - 1] - lastGlyphMax;
  const wordWidth1 = advanceTotal + kerningTotal - wordLeftBearing - wordRightBearing;
  const wordWidth1Px = wordWidth1 * (size / font.unitsPerEm);
  const spacingTotalPx = (text.length - 1) * CHAR_SPACING$2;
  const wordWidth = wordWidth1Px + spacingTotalPx;
  return wordWidth;
}
function splitIntoWords(line) {
  const words = [];
  let currentWord = "";
  let isInWhitespace = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const charIsWhitespace = /\s/.test(char);
    if (charIsWhitespace !== isInWhitespace) {
      if (currentWord.length > 0) {
        words.push({ text: currentWord, isWhitespace: isInWhitespace });
        currentWord = "";
      }
      isInWhitespace = charIsWhitespace;
    }
    currentWord += char;
  }
  if (currentWord.length > 0) {
    words.push({ text: currentWord, isWhitespace: isInWhitespace });
  }
  return words;
}
async function convertPageText({ textStr, pageDims = null }) {
  let pageIndex = 0;
  const font = resolveFontOpentype();
  const ASCENDER_HEIGHT = font.ascender * (FONT_SIZE$2 / font.unitsPerEm);
  const DESCENDER_HEIGHT = font.descender * (FONT_SIZE$2 / font.unitsPerEm);
  const lines = textStr.split(/\r?\n/);
  if (!pageDims) {
    pageDims = { width: 612, height: 792 };
  }
  let pageObj = new ocr.OcrPage(pageIndex, pageDims);
  pageObj.textSource = "text";
  if (lines.length === 0 || lines.every((line) => line.trim() === "")) {
    const warn = { char: "char_error" };
    return {
      pageObj,
      charMetricsObj: {},
      dataTables: new LayoutDataTablePage(0),
      warn
    };
  }
  let tablesPage = new LayoutDataTablePage(0);
  const pagesOut = [{ pageObj, dataTables: tablesPage }];
  const availableWidth = pageDims.width - MARGIN_HORIZONTAL$2 * 2;
  let currentY = MARGIN_VERTICAL$2 + LINE_HEIGHT$2 / 2;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineText = lines[lineIndex];
    if (lineText.length === 0 || lineText.trim().length === 0) {
      currentY += LINE_HEIGHT$2;
      if (currentY + FONT_SIZE$2 > pageDims.height - MARGIN_VERTICAL$2) {
        pageIndex++;
        const newPage = new ocr.OcrPage(pageIndex, pageDims);
        newPage.textSource = "text";
        const newTables = new LayoutDataTablePage(0);
        pagesOut.push({ pageObj: newPage, dataTables: newTables });
        pageObj = newPage;
        tablesPage = newTables;
        currentY = MARGIN_VERTICAL$2 + LINE_HEIGHT$2 / 2;
      }
      continue;
    }
    const wordTokens = splitIntoWords(lineText);
    const parLines = [];
    let parRight = MARGIN_HORIZONTAL$2;
    for (let idx = 0; idx < wordTokens.length; ) {
      if (currentY + FONT_SIZE$2 > pageDims.height - MARGIN_VERTICAL$2) {
        if (parLines.length > 0) {
          const parBbox = {
            left: MARGIN_HORIZONTAL$2,
            top: parLines[0].bbox.top,
            right: parRight,
            bottom: parLines[parLines.length - 1].bbox.bottom
          };
          const parObj = new ocr.OcrPar(pageObj, parBbox);
          parObj.lines = parLines;
          for (const ln of parLines) ln.par = parObj;
          pageObj.pars.push(parObj);
          parLines.length = 0;
          parRight = MARGIN_HORIZONTAL$2;
        }
        pageIndex++;
        const newPage = new ocr.OcrPage(pageIndex, pageDims);
        newPage.textSource = "text";
        const newTables = new LayoutDataTablePage(0);
        pagesOut.push({ pageObj: newPage, dataTables: newTables });
        pageObj = newPage;
        tablesPage = newTables;
        currentY = MARGIN_VERTICAL$2 + LINE_HEIGHT$2 / 2;
      }
      const baseline = [0, DESCENDER_HEIGHT];
      const lineTop = Math.round(currentY - ASCENDER_HEIGHT);
      const lineBottom = Math.round(currentY + DESCENDER_HEIGHT);
      let currentX = MARGIN_HORIZONTAL$2;
      let widthSoFar = 0;
      const lineBbox = {
        left: MARGIN_HORIZONTAL$2,
        top: lineTop,
        right: MARGIN_HORIZONTAL$2,
        bottom: lineBottom
      };
      const lineObj = new ocr.OcrLine(
        pageObj,
        lineBbox,
        baseline,
        ASCENDER_HEIGHT,
        null
      );
      let lastConsumed = idx;
      for (let j = idx; j < wordTokens.length; j++) {
        const tok = wordTokens[j];
        let tokWidth = getTextWidth$2(tok.text, FONT_SIZE$2, font);
        if (tok.isWhitespace) tokWidth += WORD_SPACING$1;
        if (tok.isWhitespace) {
          if (lineObj.words.length === 0) {
            if (widthSoFar + tokWidth > availableWidth) break;
            currentX += tokWidth;
            widthSoFar += tokWidth;
            lastConsumed = j + 1;
          } else {
            currentX += tokWidth;
            widthSoFar += tokWidth;
            lastConsumed = j + 1;
          }
        } else {
          if (lineObj.words.length > 0 && widthSoFar + tokWidth > availableWidth) {
            break;
          }
          const wordBbox = {
            left: Math.round(currentX),
            top: lineTop,
            right: Math.round(currentX + tokWidth),
            bottom: lineBottom
          };
          const wordId = `word_${pageIndex + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
          const wordObj = new ocr.OcrWord(lineObj, wordId, tok.text, wordBbox);
          wordObj.conf = 100;
          wordObj.style.font = FONT_FAMILY$2;
          lineObj.words.push(wordObj);
          currentX += tokWidth;
          widthSoFar += tokWidth;
          lastConsumed = j + 1;
        }
      }
      if (lineObj.words.length === 0) {
        const nextTok = wordTokens[idx];
        if (nextTok && !nextTok.isWhitespace) {
          const tokWidth = getTextWidth$2(nextTok.text, FONT_SIZE$2, font);
          const wordBbox = {
            left: Math.round(currentX),
            top: lineTop,
            right: Math.round(currentX + tokWidth),
            bottom: lineBottom
          };
          const wordId = `word_${pageIndex + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
          const wordObj = new ocr.OcrWord(lineObj, wordId, nextTok.text, wordBbox);
          wordObj.conf = 100;
          wordObj.style.font = FONT_FAMILY$2;
          lineObj.words.push(wordObj);
          currentX += tokWidth;
          widthSoFar += tokWidth;
          lastConsumed = idx + 1;
        } else {
          break;
        }
      }
      if (lineObj.words.length > 0) {
        lineObj.bbox = {
          left: lineObj.words[0].bbox.left,
          top: lineTop,
          right: Math.round(currentX),
          bottom: lineBottom
        };
        pageObj.lines.push(lineObj);
        parLines.push(lineObj);
        parRight = Math.max(parRight, lineObj.bbox.right);
        currentY += LINE_HEIGHT$2;
        idx = lastConsumed;
      }
    }
    if (parLines.length > 0) {
      const parBbox = {
        left: MARGIN_HORIZONTAL$2,
        top: parLines[0].bbox.top,
        right: parRight,
        bottom: parLines[parLines.length - 1].bbox.bottom
      };
      const parObj = new ocr.OcrPar(pageObj, parBbox);
      parObj.lines = parLines;
      for (const ln of parLines) ln.par = parObj;
      pageObj.pars.push(parObj);
    }
  }
  pageObj.angle = 0;
  return pagesOut;
}
const FONT_FAMILY$1 = "Times New Roman";
const FONT_SIZE$1 = 14;
const CHAR_SPACING$1 = 0;
const WORD_SPACING = 0;
const LINE_HEIGHT$1 = 14.4;
const MARGIN_VERTICAL$1 = 30;
const MARGIN_HORIZONTAL$1 = 20;
const SENTENCE_ABBREVS = /* @__PURE__ */ new Set([
  // Titles
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "rev",
  "sr",
  "jr",
  // Common abbreviations
  "etc",
  "vs",
  "vol",
  "no",
  // Latin abbreviations (stored without periods)
  "eg",
  "ie",
  "al",
  "cf",
  // Page/section references
  "p",
  "pp",
  "pg",
  "sec",
  "ch",
  "art",
  "cl",
  "fig",
  "tab",
  "ex",
  // Country abbreviations (stored without periods for matching U.S., U.K., etc.)
  "us",
  "uk"
]);
function isSentenceEnding(word) {
  const trailingPuncMatch = word.match(/^(.+[.!?])(["')\]}>]*)$/);
  if (!trailingPuncMatch && !/[.!?]$/.test(word)) {
    return false;
  }
  const coreWord = trailingPuncMatch ? trailingPuncMatch[1] : word;
  if (/[!?]$/.test(coreWord)) return true;
  if (/\.{2,}$/.test(coreWord)) return false;
  if (/^[A-Z]\.$/.test(coreWord)) return false;
  if (/\d\.$/.test(coreWord)) return false;
  const base = coreWord.slice(0, -1).toLowerCase();
  if (SENTENCE_ABBREVS.has(base)) return false;
  const withoutPeriods = coreWord.replace(/\./g, "").toLowerCase();
  if (SENTENCE_ABBREVS.has(withoutPeriods)) return false;
  return true;
}
function getTextWidth$1(text, size, font) {
  const charMetrics = calcWordCharMetrics(text, font);
  const advanceTotal = charMetrics.advanceArr.reduce((a, b) => a + b, 0);
  const kerningTotal = charMetrics.kerningArr.reduce((a, b) => a + b, 0);
  const wordLastGlyphMetrics = font.charToGlyph(text.at(-1)).getMetrics();
  const wordFirstGlyphMetrics = font.charToGlyph(text[0]).getMetrics();
  const wordLeftBearing = wordFirstGlyphMetrics.xMin || 0;
  const lastGlyphMax = wordLastGlyphMetrics.xMax || 0;
  const wordRightBearing = charMetrics.advanceArr[charMetrics.advanceArr.length - 1] - lastGlyphMax;
  const wordWidth1 = advanceTotal + kerningTotal - wordLeftBearing - wordRightBearing;
  const wordWidth1Px = wordWidth1 * (size / font.unitsPerEm);
  const spacingTotalPx = (text.length - 1) * CHAR_SPACING$1;
  const wordWidth = wordWidth1Px + spacingTotalPx;
  return wordWidth;
}
function parseNumbering(numberingXml) {
  const abstractNums = /* @__PURE__ */ new Map();
  const numIdToAbstractNumId = /* @__PURE__ */ new Map();
  const styleToNumbering = /* @__PURE__ */ new Map();
  const abstractNumMatches = numberingXml.matchAll(/<w:abstractNum\s+w:abstractNumId="([^"]+)"[^>]*>(.*?)<\/w:abstractNum>/gs);
  for (const match of abstractNumMatches) {
    const abstractNumId = match[1];
    const content = match[2];
    const levels = /* @__PURE__ */ new Map();
    const levelMatches = content.matchAll(/<w:lvl\s+w:ilvl="(\d+)"[^>]*>(.*?)<\/w:lvl>/gs);
    for (const lvlMatch of levelMatches) {
      const ilvl = parseInt(lvlMatch[1], 10);
      const lvlContent = lvlMatch[2];
      const startMatch = lvlContent.match(/<w:start\s+w:val="(\d+)"/);
      const numFmtMatch = lvlContent.match(/<w:numFmt\s+w:val="([^"]+)"/);
      const lvlTextMatch = lvlContent.match(/<w:lvlText\s+w:val="([^"]*)"/);
      const pStyleMatch = lvlContent.match(/<w:pStyle\s+w:val="([^"]+)"/);
      levels.set(ilvl, {
        start: startMatch ? parseInt(startMatch[1], 10) : 1,
        numFmt: numFmtMatch ? numFmtMatch[1] : "decimal",
        lvlText: lvlTextMatch ? lvlTextMatch[1] : "",
        pStyle: pStyleMatch ? pStyleMatch[1] : null
      });
      if (pStyleMatch) {
        styleToNumbering.set(pStyleMatch[1], { numId: "", ilvl });
      }
    }
    abstractNums.set(abstractNumId, { levels });
  }
  const numMatches = numberingXml.matchAll(/<w:num\s+w:numId="([^"]+)"[^>]*>.*?<w:abstractNumId\s+w:val="([^"]+)".*?<\/w:num>/gs);
  for (const match of numMatches) {
    const numId = match[1];
    const abstractNumId = match[2];
    numIdToAbstractNumId.set(numId, abstractNumId);
    const abstractNum = abstractNums.get(abstractNumId);
    if (abstractNum) {
      for (const [ilvl, level] of abstractNum.levels) {
        if (level.pStyle && styleToNumbering.has(level.pStyle)) {
          styleToNumbering.set(level.pStyle, { numId, ilvl });
        }
      }
    }
  }
  return { abstractNums, numIdToAbstractNumId, styleToNumbering };
}
const toRoman = (num) => {
  const romanNumerals = [
    ["M", 1e3],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1]
  ];
  let result = "";
  for (const [letter, value] of romanNumerals) {
    while (num >= /** @type {number} */
    value) {
      result += letter;
      num -= /** @type {number} */
      value;
    }
  }
  return result;
};
function formatNumber(num, numFmt) {
  switch (numFmt) {
    case "decimal":
      return String(num);
    case "upperLetter":
      return String.fromCharCode(64 + (num - 1) % 26 + 1);
    case "lowerLetter":
      return String.fromCharCode(96 + (num - 1) % 26 + 1);
    case "upperRoman":
      return toRoman(num);
    case "lowerRoman":
      return toRoman(num).toLowerCase();
    case "bullet":
      return "•";
    default:
      return String(num);
  }
}
function generateMarker(numId, ilvl, numberingData, counters) {
  const abstractNumId = numberingData.numIdToAbstractNumId.get(numId);
  if (!abstractNumId) return void 0;
  const abstractNum = numberingData.abstractNums.get(abstractNumId);
  if (!abstractNum) return void 0;
  const level = abstractNum.levels.get(ilvl);
  if (!level || level.numFmt === "bullet") return void 0;
  const getStartValue = (i) => (abstractNum.levels.get(i)?.start ?? 1) - 1;
  if (!counters.has(numId)) {
    counters.set(numId, Array.from({ length: 10 }, (_, i) => getStartValue(i)));
  }
  const levelCounters = (
    /** @type {number[]} */
    counters.get(numId)
  );
  levelCounters[ilvl]++;
  for (let i = ilvl + 1; i < levelCounters.length; i++) {
    levelCounters[i] = getStartValue(i);
  }
  let result = level.lvlText;
  for (let i = 0; i <= ilvl; i++) {
    const lvl = abstractNum.levels.get(i);
    if (lvl) {
      result = result.replace(new RegExp(`%${i + 1}`, "g"), formatNumber(levelCounters[i], lvl.numFmt));
    }
  }
  result = result.replace(/%\d+/g, "").replace(/\.$/, "");
  return result || void 0;
}
function parseStyles(stylesXml) {
  const styles = /* @__PURE__ */ new Map();
  let defaultFontSize = null;
  const docDefaultsMatch = stylesXml.match(/<w:docDefaults>.*?<\/w:docDefaults>/s);
  if (docDefaultsMatch) {
    const defaultSzMatch = docDefaultsMatch[0].match(/<w:sz\s+w:val="(\d+)"/);
    if (defaultSzMatch) {
      defaultFontSize = parseInt(defaultSzMatch[1], 10) / 2;
    }
  }
  const styleMatches = stylesXml.matchAll(/<w:style\s+[^>]*w:styleId="([^"]+)"[^>]*>(.*?)<\/w:style>/gs);
  for (const styleMatch of styleMatches) {
    const styleId = styleMatch[1];
    const styleContent = styleMatch[2];
    const styleInfo = {
      fontSize: null,
      font: null,
      bold: false,
      italic: false,
      numId: null,
      ilvl: null
    };
    const szMatch = styleContent.match(/<w:sz\s+w:val="(\d+)"/);
    if (szMatch) {
      styleInfo.fontSize = parseInt(szMatch[1], 10) / 2;
    }
    const fontMatch = styleContent.match(/<w:rFonts\s+[^>]*w:ascii="([^"]+)"/);
    if (fontMatch) {
      styleInfo.font = unescapeXml(fontMatch[1]);
    }
    styleInfo.bold = /<w:b\s*\/>/.test(styleContent) || /<w:b\s+w:val="true"/.test(styleContent) || /<w:b\s+w:val="1"/.test(styleContent);
    styleInfo.italic = /<w:i\s*\/>/.test(styleContent) || /<w:i\s+w:val="true"/.test(styleContent) || /<w:i\s+w:val="1"/.test(styleContent);
    styles.set(styleId, styleInfo);
  }
  return { styles, defaultFontSize };
}
function parseRunElement(runXml) {
  const styles = {
    bold: /<w:b\s*\/>/.test(runXml) || /<w:b\s+w:val="true"/.test(runXml) || /<w:b\s+w:val="1"/.test(runXml),
    italic: /<w:i\s*\/>/.test(runXml) || /<w:i\s+w:val="true"/.test(runXml) || /<w:i\s+w:val="1"/.test(runXml),
    smallCaps: /<w:smallCaps\s*\/>/.test(runXml) || /<w:smallCaps\s+w:val="true"/.test(runXml) || /<w:smallCaps\s+w:val="1"/.test(runXml),
    underline: /<w:u\s+w:val="single"/.test(runXml) || /<w:u\s*\/>/.test(runXml) && !/<w:u\s+w:val="none"/.test(runXml),
    sup: /<w:vertAlign\s+w:val="superscript"/.test(runXml),
    font: null,
    fontSize: null
  };
  const fontMatch = runXml.match(/<w:rFonts\s+[^>]*w:ascii="([^"]+)"/);
  if (fontMatch) {
    styles.font = unescapeXml(fontMatch[1]);
  } else {
    const fontMatchHAnsi = runXml.match(/<w:rFonts\s+[^>]*w:hAnsi="([^"]+)"/);
    if (fontMatchHAnsi) {
      styles.font = unescapeXml(fontMatchHAnsi[1]);
    }
  }
  const szMatch = runXml.match(/<w:sz\s+w:val="(\d+)"/);
  if (szMatch) {
    styles.fontSize = parseInt(szMatch[1], 10) / 2;
  }
  const textMatches = runXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  let text = "";
  for (const match of textMatches) {
    text += unescapeXml(match[1]);
  }
  return { text, styles };
}
function parseFootnotes(footnotesXml) {
  const footnotes = /* @__PURE__ */ new Map();
  const footnoteMatches = footnotesXml.matchAll(/<w:footnote\s+[^>]*w:id="([^"]+)"[^>]*>(.*?)<\/w:footnote>/gs);
  for (const footnoteMatch of footnoteMatches) {
    const footnoteId = footnoteMatch[1];
    const footnoteContent = footnoteMatch[2];
    if (footnoteId === "-1" || footnoteId === "0") continue;
    const parMatch = footnoteContent.match(/<w:p([^>]*)>/);
    const parAttrs = parMatch ? parMatch[1] : "";
    const paraIdMatch = parAttrs.match(/w14:paraId="([^"]+)"/);
    const paraId = paraIdMatch ? paraIdMatch[1] : void 0;
    const runs = [];
    const runMatches = footnoteContent.matchAll(/<w:r[^>]*>(.*?)<\/w:r>/gs);
    for (const runMatch of runMatches) {
      const runContent = runMatch[1];
      if (/<w:footnoteRef\s*\/>/.test(runContent)) continue;
      const parsed = parseRunElement(runContent);
      if (parsed.text) {
        runs.push(parsed);
      }
    }
    if (runs.length > 0) {
      footnotes.set(footnoteId, { runs, paraId });
    }
  }
  return footnotes;
}
function parseParagraphs(docXml, footnotesMap = /* @__PURE__ */ new Map(), stylesMap = /* @__PURE__ */ new Map(), defaultFontSize = null, numberingData = null) {
  const paragraphs = [];
  const footnoteOrder = [];
  const numberingCounters = /* @__PURE__ */ new Map();
  const paragraphMatches = docXml.matchAll(/<w:p([^>]*)>(.*?)<\/w:p>/gs);
  for (const parMatch of paragraphMatches) {
    const parAttrs = parMatch[1];
    const parContent = parMatch[2];
    const paraIdMatch = parAttrs.match(/w14:paraId="([^"]+)"/);
    const paraId = paraIdMatch ? paraIdMatch[1] : void 0;
    const runs = [];
    const pStyleMatch = parContent.match(/<w:pStyle\s+w:val="([^"]+)"/);
    const styleId = pStyleMatch ? pStyleMatch[1] : null;
    let parType = "body";
    if (styleId) {
      const styleName = styleId.toLowerCase();
      if (styleName === "title" || styleName.startsWith("heading") || styleName.startsWith("toc")) {
        parType = "title";
      } else if (styleName.startsWith("quote") || styleName === "intensequote") {
        parType = "blockquote";
      }
    }
    const parStyle = styleId ? stylesMap.get(styleId) : null;
    let marker;
    if (numberingData && styleId) {
      const styleNum = numberingData.styleToNumbering.get(styleId);
      if (styleNum) {
        marker = generateMarker(styleNum.numId, styleNum.ilvl, numberingData, numberingCounters);
      }
    }
    const runMatches = parContent.matchAll(/<w:r[^>]*>(.*?)<\/w:r>/gs);
    for (const runMatch of runMatches) {
      const runContent = runMatch[1];
      const footnoteRefMatch = runContent.match(/<w:footnoteReference\s+[^>]*w:id="([^"]+)"/);
      if (footnoteRefMatch) {
        const footnoteId = footnoteRefMatch[1];
        if (!footnotesMap.has(footnoteId)) continue;
        if (!footnoteOrder.includes(footnoteId)) {
          footnoteOrder.push(footnoteId);
        }
        const footnoteIndex = footnoteOrder.indexOf(footnoteId) + 1;
        runs.push({
          text: String(footnoteIndex),
          styles: {
            bold: false,
            italic: false,
            smallCaps: false,
            underline: false,
            sup: true,
            font: null,
            fontSize: null
          },
          footnoteId
        });
        continue;
      }
      const parsed = parseRunElement(runContent);
      if (parsed.text) {
        if (parsed.styles.fontSize === null) {
          if (parStyle?.fontSize) {
            parsed.styles.fontSize = parStyle.fontSize;
          } else if (defaultFontSize !== null) {
            parsed.styles.fontSize = defaultFontSize;
          }
        }
        if (parsed.styles.font === null && parStyle?.font) {
          parsed.styles.font = parStyle.font;
        }
        runs.push(parsed);
      }
    }
    if (runs.length > 0) {
      paragraphs.push({
        runs,
        type: parType,
        paraId,
        marker,
        styleId
      });
    }
  }
  if (footnoteOrder.length > 0) {
    const footnoteTextStyle = stylesMap.get("FootnoteText");
    const footnoteFontSize = footnoteTextStyle?.fontSize ?? defaultFontSize;
    for (const footnoteId of footnoteOrder) {
      const footnoteData = footnotesMap.get(footnoteId);
      if (footnoteData) {
        const footnoteIndex = footnoteOrder.indexOf(footnoteId) + 1;
        const footnoteParagraphRuns = [];
        for (const run of footnoteData.runs) {
          const runWithSize = {
            text: run.text,
            styles: {
              ...run.styles,
              fontSize: run.styles.fontSize ?? footnoteFontSize
            }
          };
          footnoteParagraphRuns.push(runWithSize);
        }
        paragraphs.push({
          runs: footnoteParagraphRuns,
          type: "footnote",
          footnoteId,
          footnoteIndex,
          paraId: footnoteData.paraId,
          styleId: "FootnoteText"
        });
      }
    }
  }
  return paragraphs;
}
async function convertDocDocx({ docxData, pageDims = null, lineSplitMode = "width" }) {
  const zipModule = await import("./index-CnjPN9j9.js");
  const blob = new Blob([docxData]);
  const zipReader = new zipModule.ZipReader(new zipModule.BlobReader(blob));
  const entries = await zipReader.getEntries();
  const documentEntry = entries.find((entry) => entry.filename === "word/document.xml");
  if (!documentEntry) {
    throw new Error("No word/document.xml found in docx file");
  }
  const writer = new zipModule.BlobWriter();
  await documentEntry.getData(writer);
  const documentBlob = await writer.getData();
  const documentXml = await documentBlob.text();
  let footnotesXml = null;
  const footnotesEntry = entries.find((entry) => entry.filename === "word/footnotes.xml");
  if (footnotesEntry) {
    const footnotesWriter = new zipModule.BlobWriter();
    await footnotesEntry.getData(footnotesWriter);
    const footnotesBlob = await footnotesWriter.getData();
    footnotesXml = await footnotesBlob.text();
  }
  let stylesXml = null;
  const stylesEntry = entries.find((entry) => entry.filename === "word/styles.xml");
  if (stylesEntry) {
    const stylesWriter = new zipModule.BlobWriter();
    await stylesEntry.getData(stylesWriter);
    const stylesBlob = await stylesWriter.getData();
    stylesXml = await stylesBlob.text();
  }
  let numberingXml = null;
  const numberingEntry = entries.find((entry) => entry.filename === "word/numbering.xml");
  if (numberingEntry) {
    const numberingWriter = new zipModule.BlobWriter();
    await numberingEntry.getData(numberingWriter);
    const numberingBlob = await numberingWriter.getData();
    numberingXml = await numberingBlob.text();
  }
  await zipReader.close();
  const pagesOut = await convertDocumentXML({
    documentXml,
    footnotesXml,
    stylesXml,
    numberingXml,
    pageDims,
    lineSplitMode
  });
  return pagesOut;
}
const convertDocumentXML = async ({
  documentXml,
  footnotesXml = null,
  stylesXml = null,
  numberingXml = null,
  pageDims = null,
  lineSplitMode = "width"
}) => {
  const fontOpentype2 = (await FontCont.getFont({ font: FONT_FAMILY$1 })).opentype;
  const ASCENDER_HEIGHT = fontOpentype2.ascender * (FONT_SIZE$1 / fontOpentype2.unitsPerEm);
  const DESCENDER_HEIGHT = fontOpentype2.descender * (FONT_SIZE$1 / fontOpentype2.unitsPerEm);
  if (!pageDims) {
    pageDims = { width: 612, height: 792 };
  }
  const footnotesMap = footnotesXml ? parseFootnotes(footnotesXml) : /* @__PURE__ */ new Map();
  const parsedStyles = stylesXml ? parseStyles(stylesXml) : { styles: /* @__PURE__ */ new Map(), defaultFontSize: null };
  const numberingData = numberingXml ? parseNumbering(numberingXml) : null;
  const paragraphs = parseParagraphs(documentXml, footnotesMap, parsedStyles.styles, parsedStyles.defaultFontSize, numberingData);
  const pagesOut = [];
  let pageIndex = 0;
  let pageObj = new ocr.OcrPage(pageIndex, pageDims);
  pageObj.textSource = "docx";
  let tablesPage = new LayoutDataTablePage(0);
  pagesOut.push({ pageObj, dataTables: tablesPage });
  const availableWidth = pageDims.width - MARGIN_HORIZONTAL$1 * 2;
  let currentY = MARGIN_VERTICAL$1 + LINE_HEIGHT$1 / 2;
  const footnoteRefWords = /* @__PURE__ */ new Map();
  for (const paragraph of paragraphs) {
    if (currentY + FONT_SIZE$1 > pageDims.height - MARGIN_VERTICAL$1) {
      pageIndex++;
      const newPage = new ocr.OcrPage(pageIndex, pageDims);
      newPage.textSource = "docx";
      const newTables = new LayoutDataTablePage(pageIndex);
      pagesOut.push({ pageObj: newPage, dataTables: newTables });
      pageObj = newPage;
      tablesPage = newTables;
      currentY = MARGIN_VERTICAL$1 + LINE_HEIGHT$1 / 2;
    }
    const parLines = [];
    let parRight = MARGIN_HORIZONTAL$1;
    let runIndex = 0;
    let charIndexInRun = 0;
    const parRuns = paragraph.runs;
    const parType = paragraph.type;
    const parFootnoteId = paragraph.footnoteId;
    const parFootnoteIndex = paragraph.footnoteIndex;
    const parParaId = paragraph.paraId;
    const parMarker = paragraph.marker;
    const parStyleId = paragraph.styleId;
    while (runIndex < parRuns.length) {
      const baseline = [0, DESCENDER_HEIGHT];
      const lineTop = Math.round(currentY - ASCENDER_HEIGHT);
      const lineBottom = Math.round(currentY - DESCENDER_HEIGHT);
      const lineBbox = {
        left: MARGIN_HORIZONTAL$1,
        top: lineTop,
        right: MARGIN_HORIZONTAL$1,
        bottom: lineBottom
      };
      const lineObj = new ocr.OcrLine(
        pageObj,
        lineBbox,
        baseline,
        ASCENDER_HEIGHT,
        null
      );
      let currentX = MARGIN_HORIZONTAL$1;
      let lineComplete = false;
      let lastItemWasWhitespace = false;
      let pendingSentenceEnd = false;
      while (runIndex < parRuns.length && !lineComplete) {
        const run = parRuns[runIndex];
        const remainingText = run.text.substring(charIndexInRun);
        const words = remainingText.split(/(\s+)/);
        for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
          const word = words[wordIdx];
          if (word.length === 0) continue;
          const isWhitespace = /^\s+$/.test(word);
          if (isWhitespace) {
            if (lineSplitMode === "sentence" && pendingSentenceEnd) {
              lineComplete = true;
              break;
            }
            const runFontSize = run.styles.fontSize || FONT_SIZE$1;
            const spaceWidth = getTextWidth$1(" ", runFontSize, fontOpentype2) + WORD_SPACING;
            currentX += spaceWidth;
            charIndexInRun += word.length;
            lastItemWasWhitespace = true;
          } else {
            const runFontSize = run.styles.fontSize || FONT_SIZE$1;
            const lastWord = lineObj.words[lineObj.words.length - 1];
            const stylesMatch = lastWord && lastWord.style.sup === run.styles.sup && lastWord.style.size === run.styles.fontSize;
            const shouldAppend = lastWord && wordIdx === 0 && charIndexInRun === 0 && !lastItemWasWhitespace && stylesMatch;
            if (shouldAppend) {
              const combinedText = lastWord.text + word;
              const combinedWidth = getTextWidth$1(combinedText, runFontSize, fontOpentype2);
              if (lineSplitMode !== "sentence" && lastWord.bbox.left + combinedWidth > MARGIN_HORIZONTAL$1 + availableWidth) {
                lineComplete = true;
                break;
              }
              const tailStyle = lastWord.styleRuns && lastWord.styleRuns.length > 0 ? { ...lastWord.style, ...lastWord.styleRuns[lastWord.styleRuns.length - 1].style } : lastWord.style;
              if (tailStyle.bold !== run.styles.bold || tailStyle.italic !== run.styles.italic || tailStyle.smallCaps !== run.styles.smallCaps) {
                const delta = {};
                if (run.styles.bold !== lastWord.style.bold) delta.bold = run.styles.bold;
                if (run.styles.italic !== lastWord.style.italic) delta.italic = run.styles.italic;
                if (run.styles.smallCaps !== lastWord.style.smallCaps) delta.smallCaps = run.styles.smallCaps;
                lastWord.styleRuns = lastWord.styleRuns || [];
                lastWord.styleRuns.push({ i: lastWord.text.length, style: delta });
              }
              lastWord.text = combinedText;
              lastWord.bbox.right = Math.round(lastWord.bbox.left + combinedWidth);
              currentX = lastWord.bbox.right;
              charIndexInRun += word.length;
            } else {
              const supFontSizeRatio = 0.6;
              const effectiveFontSize = run.styles.sup ? runFontSize * supFontSizeRatio : runFontSize;
              const wordWidth = getTextWidth$1(word, effectiveFontSize, fontOpentype2);
              if (lineSplitMode !== "sentence" && lineObj.words.length > 0 && currentX + wordWidth > MARGIN_HORIZONTAL$1 + availableWidth) {
                lineComplete = true;
                break;
              }
              const wordAscenderHeight = fontOpentype2.ascender * (runFontSize / fontOpentype2.unitsPerEm);
              const wordDescenderHeight = fontOpentype2.descender * (runFontSize / fontOpentype2.unitsPerEm);
              let wordTop = Math.round(currentY - wordAscenderHeight);
              let wordBottom = Math.round(currentY - wordDescenderHeight);
              if (run.styles.sup) {
                const supHeight = wordAscenderHeight * supFontSizeRatio;
                const xHeight = wordAscenderHeight * 0.7;
                wordBottom = Math.round(currentY - xHeight);
                wordTop = Math.round(wordBottom - supHeight);
              }
              const wordBbox = {
                left: Math.round(currentX),
                top: wordTop,
                right: Math.round(currentX + wordWidth),
                bottom: wordBottom
              };
              const wordId = `word_${pageIndex + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
              const wordObj = new ocr.OcrWord(lineObj, wordId, word, wordBbox);
              wordObj.conf = 100;
              wordObj.style.font = run.styles.font || FONT_FAMILY$1;
              wordObj.style.bold = run.styles.bold;
              wordObj.style.italic = run.styles.italic;
              wordObj.style.smallCaps = run.styles.smallCaps;
              wordObj.style.underline = run.styles.underline;
              wordObj.style.sup = run.styles.sup;
              wordObj.style.size = run.styles.fontSize;
              wordObj.visualCoords = false;
              if (run.footnoteId) {
                footnoteRefWords.set(run.footnoteId, wordObj);
              }
              lineObj.words.push(wordObj);
              currentX += wordWidth;
              charIndexInRun += word.length;
              if (lineSplitMode === "sentence" && isSentenceEnding(word)) {
                pendingSentenceEnd = true;
              }
            }
            lastItemWasWhitespace = false;
          }
        }
        if (charIndexInRun >= run.text.length) {
          runIndex++;
          charIndexInRun = 0;
        }
        if (lineComplete) break;
      }
      if (lineObj.words.length > 0) {
        lineObj.bbox = {
          left: lineObj.words[0].bbox.left,
          top: lineTop,
          right: lineObj.words[lineObj.words.length - 1].bbox.right,
          bottom: lineBottom
        };
        pageObj.lines.push(lineObj);
        parLines.push(lineObj);
        parRight = Math.max(parRight, lineObj.bbox.right);
      }
      currentY += LINE_HEIGHT$1;
    }
    if (parLines.length > 0) {
      const parBbox = {
        left: MARGIN_HORIZONTAL$1,
        top: parLines[0].bbox.top,
        right: parRight,
        bottom: parLines[parLines.length - 1].bbox.bottom
      };
      const parObj = new ocr.OcrPar(pageObj, parBbox);
      if (parParaId) parObj.id = parParaId;
      parObj.lines = parLines;
      parObj.type = parType;
      if (parMarker) {
        parObj.marker = parMarker;
      } else if (parFootnoteIndex !== void 0) {
        parObj.marker = String(parFootnoteIndex);
      }
      if (parStyleId) parObj.debug.sourceStyle = parStyleId;
      for (const ln of parLines) ln.par = parObj;
      if (parFootnoteId) {
        const refWord = footnoteRefWords.get(parFootnoteId);
        if (refWord) {
          parObj.footnoteRefId = refWord.id;
          refWord.footnoteParId = parObj.id;
        }
      }
      pageObj.pars.push(parObj);
    }
  }
  return pagesOut;
};
const CODE_FONT_FAMILY = "Courier";
const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  shy: "­",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
  micro: "µ",
  para: "¶",
  sect: "§",
  middot: "·",
  bull: "•",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  times: "×",
  divide: "÷",
  plusmn: "±",
  minus: "−",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  cent: "¢",
  pound: "£",
  yen: "¥",
  euro: "€",
  dagger: "†",
  Dagger: "‡",
  permil: "‰"
};
const normalizeRefLabel = (label) => label.trim().replace(/\s+/g, " ").toLowerCase();
function parseInlineMd(text, style, refs) {
  const runs = [];
  let buf = "";
  const flush = () => {
    if (buf) runs.push({ text: buf, ...style });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "\n") {
      flush();
      runs.push({ ...style, text: "\n" });
      i++;
      continue;
    }
    if (char === "\\" && /[\\`*_{}[\]()#+\-.!>|~=&<]/.test(text[i + 1] || "")) {
      buf += text[i + 1];
      i += 2;
      continue;
    }
    if (char === "`") {
      let fence = 0;
      while (text[i + fence] === "`") fence++;
      let close = -1;
      for (let j = i + fence; j < text.length; ) {
        if (text[j] !== "`") {
          j++;
        } else {
          let run = 0;
          while (text[j + run] === "`") run++;
          if (run === fence) {
            close = j;
            break;
          }
          j += run;
        }
      }
      if (close === -1) {
        buf += "`".repeat(fence);
        i += fence;
        continue;
      }
      let code = text.slice(i + fence, close);
      if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ") && code.trim()) code = code.slice(1, -1);
      flush();
      runs.push({
        text: code,
        bold: style.bold,
        italic: style.italic,
        sup: style.sup,
        font: CODE_FONT_FAMILY,
        link: style.link
      });
      i = close + fence;
      continue;
    }
    if (char === "[" || char === "!" && text[i + 1] === "[") {
      const isImage = char === "!";
      const labelStart = isImage ? i + 1 : i;
      let depth = 0;
      let labelEnd = -1;
      for (let j = labelStart; j < text.length; j++) {
        if (text[j] === "\\") {
          j++;
        } else if (text[j] === "[") {
          depth++;
        } else if (text[j] === "]") {
          depth--;
          if (depth === 0) {
            labelEnd = j;
            break;
          }
        }
      }
      if (labelEnd === -1) {
        buf += char;
        i++;
        continue;
      }
      const label = text.slice(labelStart + 1, labelEnd);
      if (!isImage && label.startsWith("^") && refs.notes.has(label.slice(1))) {
        flush();
        runs.push({
          ...style,
          text: label.slice(1),
          sup: true,
          footnoteLabel: label.slice(1)
        });
        i = labelEnd + 1;
        continue;
      }
      const after = text.slice(labelEnd + 1);
      const destMatch = /^\(\s*(\S*?)(?:\s+"[^"]*")?\s*\)/.exec(after);
      let url = null;
      let consumed = 0;
      if (destMatch) {
        url = destMatch[1];
        consumed = destMatch[0].length;
      } else {
        const refMatch = /^\[([^\]]*)\]/.exec(after);
        const key = normalizeRefLabel(refMatch && refMatch[1] ? refMatch[1] : label);
        if (refs.links.has(key)) {
          url = /** @type {string} */
          refs.links.get(key);
          consumed = refMatch ? refMatch[0].length : 0;
        }
      }
      if (url === null) {
        buf += char;
        i++;
        continue;
      }
      flush();
      if (!isImage) {
        const link = /^(https?:|mailto:)/i.test(url) ? url : style.link;
        runs.push(...parseInlineMd(label, { ...style, link }, refs));
      }
      i = labelEnd + 1 + consumed;
      continue;
    }
    if (char === "<") {
      const autolink = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(text.slice(i));
      if (autolink) {
        flush();
        runs.push({ ...style, text: autolink[1].replace(/^mailto:/i, ""), link: autolink[1] });
        i += autolink[0].length;
        continue;
      }
      const comment = /^<!--[\s\S]*?-->/.exec(text.slice(i));
      if (comment) {
        i += comment[0].length;
        continue;
      }
      const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*)?\/?>/.exec(text.slice(i));
      if (tag) {
        const name = tag[2].toLowerCase();
        if (name === "br" && !tag[1]) {
          flush();
          runs.push({ ...style, text: "\n" });
          i += tag[0].length;
          continue;
        }
        const styleProp = {
          sup: "sup",
          b: "bold",
          strong: "bold",
          i: "italic",
          em: "italic"
        }[name];
        if ((styleProp || name === "a") && !tag[1]) {
          const close = new RegExp(`</${name}\\s*>`, "i").exec(text.slice(i + tag[0].length));
          if (close) {
            flush();
            const inner = text.slice(i + tag[0].length, i + tag[0].length + close.index);
            let link = style.link;
            if (name === "a") {
              const href = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag[3] || "");
              const dest = href ? href[1] || href[2] : "";
              if (/^(https?:|mailto:)/i.test(dest)) link = dest;
            }
            runs.push(...parseInlineMd(inner, {
              ...style,
              ...styleProp ? { [styleProp]: true } : {},
              link
            }, refs));
            i += tag[0].length + close.index + close[0].length;
            continue;
          }
        }
        i += tag[0].length;
        continue;
      }
    }
    if (char === "&") {
      const entity = /^&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z][a-zA-Z0-9]{1,31}));/.exec(text.slice(i));
      if (entity) {
        let decoded = null;
        if (entity[3]) {
          decoded = NAMED_ENTITIES[entity[3]] || null;
        } else {
          const code = entity[1] ? parseInt(entity[1], 10) : parseInt(entity[2], 16);
          decoded = code > 0 && code <= 1114111 && !(code >= 55296 && code <= 57343) ? String.fromCodePoint(code) : "�";
        }
        if (decoded !== null) {
          buf += decoded;
          i += entity[0].length;
          continue;
        }
      }
      buf += char;
      i++;
      continue;
    }
    if (char === "~" && text[i + 1] === "~" && text[i + 2] !== "~") {
      let close = -1;
      for (let j = i + 2; j < text.length - 1; j++) {
        if (text[j] === "\\") {
          j++;
        } else if (text[j] === "~" && text[j + 1] === "~") {
          close = j;
          break;
        }
      }
      if (close > i + 2) {
        flush();
        runs.push(...parseInlineMd(text.slice(i + 2, close), style, refs));
        i = close + 2;
        continue;
      }
    }
    if (char === "*" || char === "_") {
      let run = 0;
      while (text[i + run] === char) run++;
      const charBefore = text[i - 1] || "";
      const charAfter = text[i + run] || "";
      const canOpen = charAfter !== "" && !/\s/.test(charAfter) && (char === "*" || !/[\p{L}\p{N}]/u.test(charBefore));
      const use = Math.min(run, 3);
      let close = -1;
      if (canOpen) {
        for (let j = i + run; j < text.length; ) {
          if (text[j] === "\\") {
            j += 2;
          } else if (text[j] !== char) {
            j++;
          } else {
            let closeRun = 0;
            while (text[j + closeRun] === char) closeRun++;
            const closeBefore = text[j - 1] || "";
            const closeAfter = text[j + closeRun] || "";
            if (closeRun >= use && !/\s/.test(closeBefore) && (char === "*" || !/[\p{L}\p{N}]/u.test(closeAfter))) {
              close = j;
              break;
            }
            j += closeRun;
          }
        }
      }
      if (close === -1) {
        buf += char.repeat(run);
        i += run;
        continue;
      }
      flush();
      runs.push(...parseInlineMd(text.slice(i + use, close), {
        ...style,
        bold: style.bold || use >= 2,
        italic: style.italic || use === 1 || use === 3
      }, refs));
      i = close + use;
      continue;
    }
    buf += char;
    i++;
  }
  flush();
  return runs;
}
const endsHardBreak = (line) => / {2}$/.test(line) || /(?:^|[^\\])(?:\\\\)*\\$/.test(line);
const trimBlockLine = (line) => {
  let text = line.trim();
  if (/(?:^|[^\\])(?:\\\\)*\\$/.test(line)) text = text.slice(0, -1).trimEnd();
  return text;
};
function collectMdRefs(lines) {
  const refs = { links: /* @__PURE__ */ new Map(), notes: /* @__PURE__ */ new Set() };
  for (const raw of lines) {
    const stripped = raw.replace(/^ {0,3}(?:>[ \t]?)+/, "");
    const fnDef = /^ {0,3}\[\^([^\]\s]+)\]:/.exec(stripped);
    if (fnDef) {
      refs.notes.add(fnDef[1]);
      continue;
    }
    const refDef = /^ {0,3}\[((?:\\[\s\S]|[^\]\\])+)\]:[ \t]*<?([^\s<>]+)>?(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/.exec(stripped);
    if (refDef) {
      const key = normalizeRefLabel(refDef[1]);
      if (!refs.links.has(key)) refs.links.set(key, refDef[2]);
    }
  }
  return refs;
}
function parseMdBlocks(blockLines, refs, font) {
  const blocks = [];
  let openBlock = null;
  const listStack = [];
  const closeBlock = () => {
    if (!openBlock) return;
    const runs = parseInlineMd(openBlock.text, {
      bold: openBlock.bold,
      italic: false,
      sup: false,
      font,
      link: null
    }, refs);
    if (runs.length > 0) {
      blocks.push({
        kind: openBlock.kind,
        runs,
        headingLevel: openBlock.headingLevel,
        listDepth: openBlock.listDepth,
        marker: openBlock.marker,
        quoted: false,
        footnoteLabel: openBlock.footnoteLabel
      });
    }
    openBlock = null;
  };
  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      closeBlock();
      listStack.length = 0;
      const closeFence = new RegExp(`^ {0,3}${fenceMatch[1][0]}{${fenceMatch[1].length},}[ \\t]*$`);
      const runs = [];
      i++;
      for (; i < blockLines.length && !closeFence.test(blockLines[i]); i++) {
        if (runs.length > 0) {
          runs.push({
            text: "\n",
            bold: false,
            italic: false,
            sup: false,
            font: CODE_FONT_FAMILY,
            link: null
          });
        }
        runs.push({
          text: blockLines[i].replace(/\t/g, "    "),
          bold: false,
          italic: false,
          sup: false,
          font: CODE_FONT_FAMILY,
          link: null
        });
      }
      if (runs.length > 0) {
        blocks.push({
          kind: "code",
          runs,
          headingLevel: null,
          listDepth: null,
          marker: null,
          quoted: false
        });
      }
      continue;
    }
    if (!line.trim()) {
      closeBlock();
      continue;
    }
    const headingMatch = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*#*[ \t]*$/.exec(line);
    if (headingMatch) {
      closeBlock();
      listStack.length = 0;
      const level = headingMatch[1].length;
      const runs = parseInlineMd((headingMatch[2] || "").trim(), {
        bold: true,
        italic: false,
        sup: false,
        font,
        link: null
      }, refs);
      if (runs.length > 0) {
        blocks.push({
          kind: "heading",
          runs,
          headingLevel: level,
          listDepth: null,
          marker: null,
          quoted: false
        });
      }
      continue;
    }
    const setextMatch = openBlock && openBlock.kind === "paragraph" && openBlock.listDepth === null ? /^ {0,3}(=+|-+)[ \t]*$/.exec(line) : null;
    if (setextMatch) {
      openBlock.kind = "heading";
      openBlock.headingLevel = setextMatch[1][0] === "=" ? 1 : 2;
      openBlock.bold = true;
      closeBlock();
      continue;
    }
    if (/^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(line)) {
      closeBlock();
      listStack.length = 0;
      continue;
    }
    if (/^ {0,3}>/.test(line)) {
      closeBlock();
      listStack.length = 0;
      const quoteLines = [];
      let j = i;
      for (; j < blockLines.length; j++) {
        if (/^ {0,3}>/.test(blockLines[j])) {
          quoteLines.push(blockLines[j].replace(/^ {0,3}> ?/, ""));
        } else if (blockLines[j].trim() && !/^ {0,3}#{1,6}[ \t]/.test(blockLines[j]) && !/^ {0,3}(?:`{3,}|~{3,})/.test(blockLines[j]) && !/^([ \t]*)(?:[-*+]|\d{1,9}[.)])[ \t]/.test(blockLines[j]) && !/^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(blockLines[j]) && !/^ {0,3}(?:=+|-+)[ \t]*$/.test(blockLines[j]) && !/^ {0,3}\[(?:\^[^\]\s]+|(?:\\[\s\S]|[^\]\\])+)\]:/.test(blockLines[j])) {
          quoteLines.push(blockLines[j]);
        } else {
          break;
        }
      }
      for (const inner of parseMdBlocks(quoteLines, refs, font)) {
        inner.quoted = true;
        blocks.push(inner);
      }
      i = j - 1;
      continue;
    }
    if (!openBlock && listStack.length === 0 && /^(?: {4}|\t)/.test(line) && line.trim()) {
      const runs = [];
      let last = i;
      for (let j = i; j < blockLines.length; j++) {
        const codeMatch = /^(?: {4}|\t)([\s\S]*)$/.exec(blockLines[j]);
        if (codeMatch && blockLines[j].trim()) {
          if (runs.length > 0) {
            runs.push({
              text: "\n",
              bold: false,
              italic: false,
              sup: false,
              font: CODE_FONT_FAMILY,
              link: null
            });
          }
          runs.push({
            text: codeMatch[1].replace(/\t/g, "    "),
            bold: false,
            italic: false,
            sup: false,
            font: CODE_FONT_FAMILY,
            link: null
          });
          last = j;
        } else if (blockLines[j].trim()) {
          break;
        }
      }
      blocks.push({
        kind: "code",
        runs,
        headingLevel: null,
        listDepth: null,
        marker: null,
        quoted: false
      });
      i = last;
      continue;
    }
    const fnDefMatch = !openBlock ? /^ {0,3}\[\^([^\]\s]+)\]:[ \t]*(.*)$/.exec(line) : null;
    if (fnDefMatch) {
      listStack.length = 0;
      openBlock = {
        text: trimBlockLine(fnDefMatch[2]),
        kind: "footnote",
        headingLevel: null,
        listDepth: null,
        marker: null,
        bold: false,
        hardBreak: endsHardBreak(fnDefMatch[2]),
        footnoteLabel: fnDefMatch[1]
      };
      continue;
    }
    if (!openBlock && /^ {0,3}\[((?:\\[\s\S]|[^\]\\])+)\]:[ \t]*<?[^\s<>]+>?(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/.test(line)) {
      listStack.length = 0;
      continue;
    }
    const listMatch = /^([ \t]*)(?:([-*+])|(\d{1,9})([.)]))[ \t]+(.*)$/.exec(line);
    if (listMatch) {
      closeBlock();
      const indentCols = listMatch[1].replace(/\t/g, "    ").length;
      while (listStack.length > 0 && indentCols < listStack[listStack.length - 1]) listStack.pop();
      const depth = Math.min(listStack.length, 3);
      const marker = listMatch[2] || `${listMatch[3]}${listMatch[4]}`;
      listStack.length = depth;
      listStack.push(indentCols + marker.length + 1);
      let itemText = listMatch[5];
      let visibleMarker = listMatch[2] ? "•" : marker;
      const task = listMatch[2] ? /^\[([ xX])\][ \t]+/.exec(itemText) : null;
      if (task) {
        visibleMarker = task[1] === " " ? "☐" : "☑";
        itemText = itemText.slice(task[0].length);
      }
      openBlock = {
        text: trimBlockLine(itemText),
        kind: "paragraph",
        headingLevel: null,
        listDepth: depth,
        marker: visibleMarker,
        bold: false,
        hardBreak: endsHardBreak(itemText)
      };
      continue;
    }
    if (openBlock) {
      openBlock.text += (openBlock.hardBreak ? "\n" : " ") + trimBlockLine(line);
      openBlock.hardBreak = endsHardBreak(line);
    } else {
      listStack.length = 0;
      openBlock = {
        text: trimBlockLine(line),
        kind: "paragraph",
        headingLevel: null,
        listDepth: null,
        marker: null,
        bold: false,
        hardBreak: endsHardBreak(line)
      };
    }
  }
  closeBlock();
  return blocks;
}
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE = 14;
const CHAR_SPACING = 0;
const LINE_HEIGHT = 14.4;
const MARGIN_VERTICAL = 30;
const MARGIN_HORIZONTAL = 20;
const BLOCK_SPACING = LINE_HEIGHT / 2;
const LIST_INDENT = 24;
const QUOTE_INDENT = 24;
const HEADING_SIZES = [24, 20, 18, 16, 14, 14];
const fontFaces = /* @__PURE__ */ new Map();
const fontLookupDoc = new DocFonts();
const resolveFontFace = (style) => {
  const key = `${style.font}|${style.bold ? "b" : ""}${style.italic ? "i" : ""}`;
  let face = fontFaces.get(key);
  if (!face) {
    face = GlobalFonts.getFont(style, fontLookupDoc).opentype;
    fontFaces.set(key, face);
  }
  return face;
};
function getTextWidth(text, size, font) {
  const { advanceArr, kerningArr } = calcWordCharMetrics(text, font);
  const advanceTotal = advanceArr.reduce((a, b) => a + b, 0);
  const kerningTotal = kerningArr.reduce((a, b) => a + b, 0);
  const wordLastGlyphMetrics = font.charToGlyph(text.at(-1)).getMetrics();
  const wordFirstGlyphMetrics = font.charToGlyph(text[0]).getMetrics();
  const wordLeftBearing = wordFirstGlyphMetrics.xMin || 0;
  const lastGlyphMax = wordLastGlyphMetrics.xMax || 0;
  const wordRightBearing = advanceArr[advanceArr.length - 1] - lastGlyphMax;
  const wordWidth1 = advanceTotal + kerningTotal - wordLeftBearing - wordRightBearing;
  const wordWidth1Px = wordWidth1 * (size / font.unitsPerEm);
  const spacingTotalPx = (text.length - 1) * CHAR_SPACING;
  const wordWidth = wordWidth1Px + spacingTotalPx;
  return wordWidth;
}
async function convertDocMd({ mdStr, pageDims = null }) {
  if (!pageDims) pageDims = { width: 612, height: 792 };
  let lines = mdStr.split(/\r?\n/);
  if (lines.length > 2 && /^---[ \t]*$/.test(lines[0])) {
    let close = -1;
    let hasKey = false;
    for (let j = 1; j < lines.length; j++) {
      if (/^(?:---|\.\.\.)[ \t]*$/.test(lines[j])) {
        close = j;
        break;
      }
      if (/^[A-Za-z0-9_-]+:(?:[ \t]|$)/.test(lines[j])) hasKey = true;
    }
    if (close !== -1 && hasKey) lines = lines.slice(close + 1);
  }
  const blocks = parseMdBlocks(lines, collectMdRefs(lines), FONT_FAMILY).map((b) => {
    let type = "body";
    if (b.kind === "heading") type = "title";
    else if (b.kind === "footnote") type = "footnote";
    let sourceStyle = "Normal";
    if (b.kind === "code") sourceStyle = "HTMLPreformatted";
    else if (b.kind === "footnote") sourceStyle = "FootnoteText";
    else if (b.kind === "heading") sourceStyle = `Heading${b.headingLevel}`;
    else if (b.listDepth !== null) sourceStyle = "ListParagraph";
    let indent = 0;
    if (b.kind === "code") indent = LIST_INDENT;
    else if (b.listDepth !== null) indent = LIST_INDENT * (b.listDepth + 1);
    const block = {
      type,
      runs: b.runs,
      fontSize: b.headingLevel ? HEADING_SIZES[b.headingLevel - 1] : FONT_SIZE,
      indent,
      marker: (b.kind === "footnote" ? b.footnoteLabel : b.marker) ?? null,
      headingLevel: b.kind === "heading" ? b.headingLevel : null,
      sourceStyle,
      preserveBreaks: b.kind === "code",
      footnoteLabel: b.footnoteLabel
    };
    if (b.quoted && b.kind !== "code") {
      block.type = "blockquote";
      block.headingLevel = null;
      if (block.sourceStyle === "Normal" || /^Heading/.test(block.sourceStyle)) block.sourceStyle = "Quote";
      block.indent += QUOTE_INDENT;
    }
    return block;
  });
  const pagesOut = [];
  let pageIndex = 0;
  let pageObj = new ocr.OcrPage(pageIndex, pageDims);
  pageObj.textSource = "md";
  pagesOut.push({ pageObj, dataTables: new LayoutDataTablePage(pageIndex) });
  let currentY = MARGIN_VERTICAL + LINE_HEIGHT / 2;
  const fnPars = /* @__PURE__ */ new Map();
  const fnRefs = [];
  for (const block of blocks) {
    const bodyFace = resolveFontFace({ font: FONT_FAMILY });
    const ascHeight = bodyFace.ascender * (block.fontSize / bodyFace.unitsPerEm);
    const descHeight = bodyFace.descender * (block.fontSize / bodyFace.unitsPerEm);
    const lineHeight = LINE_HEIGHT * (block.fontSize / FONT_SIZE);
    const leftEdge = MARGIN_HORIZONTAL + block.indent;
    const rightEdge = pageDims.width - MARGIN_HORIZONTAL;
    const tokens = [];
    let space = "";
    for (const run of block.runs) {
      if (run.text === "\n") {
        tokens.push({
          text: "",
          space: "",
          lineBreak: true,
          run
        });
        space = "";
        continue;
      }
      for (const piece of run.text.split(/(\s+)/)) {
        if (!piece) continue;
        if (/^\s+$/.test(piece)) {
          space = piece;
        } else {
          tokens.push({
            text: piece,
            space,
            lineBreak: false,
            run
          });
          space = "";
        }
      }
    }
    const parLines = [];
    let parRight = leftEdge;
    let tokenIndex = 0;
    const flushPar = (page) => {
      if (parLines.length === 0) return;
      const parObj = new ocr.OcrPar(page, {
        left: leftEdge,
        top: parLines[0].bbox.top,
        right: parRight,
        bottom: parLines[parLines.length - 1].bbox.bottom
      });
      parObj.lines = parLines.slice();
      parObj.type = block.type;
      parObj.marker = block.marker;
      parObj.headingLevel = block.headingLevel;
      parObj.debug.sourceStyle = block.sourceStyle;
      for (const parLine of parObj.lines) parLine.par = parObj;
      page.pars.push(parObj);
      if (block.footnoteLabel && !fnPars.has(block.footnoteLabel)) fnPars.set(block.footnoteLabel, parObj);
      parLines.length = 0;
      parRight = leftEdge;
    };
    while (tokenIndex < tokens.length) {
      if (currentY + block.fontSize > pageDims.height - MARGIN_VERTICAL) {
        flushPar(pageObj);
        pageIndex++;
        pageObj = new ocr.OcrPage(pageIndex, pageDims);
        pageObj.textSource = "md";
        pagesOut.push({ pageObj, dataTables: new LayoutDataTablePage(pageIndex) });
        currentY = MARGIN_VERTICAL + LINE_HEIGHT / 2;
      }
      if (currentY - ascHeight < MARGIN_VERTICAL) currentY = MARGIN_VERTICAL + ascHeight;
      const lineTop = Math.round(currentY - ascHeight);
      const lineBottom = Math.round(currentY - descHeight);
      const lineObj = new ocr.OcrLine(pageObj, {
        left: leftEdge,
        top: lineTop,
        right: leftEdge,
        bottom: lineBottom
      }, [0, descHeight], ascHeight, null);
      let currentX = leftEdge;
      while (tokenIndex < tokens.length) {
        const token = tokens[tokenIndex];
        if (token.lineBreak) {
          tokenIndex++;
          break;
        }
        const face = resolveFontFace(token.run);
        const tokenWidth = getTextWidth(token.text, block.fontSize, face);
        const lastWord = lineObj.words[lineObj.words.length - 1];
        if (!token.space && lastWord) {
          const tailStyle = lastWord.styleRuns && lastWord.styleRuns.length > 0 ? { ...lastWord.style, ...lastWord.styleRuns[lastWord.styleRuns.length - 1].style } : lastWord.style;
          if (tailStyle.bold !== token.run.bold || tailStyle.italic !== token.run.italic || tailStyle.font !== token.run.font || !!tailStyle.sup !== !!token.run.sup) {
            lastWord.styleRuns = lastWord.styleRuns || [];
            const runStyle = { bold: token.run.bold, italic: token.run.italic, font: token.run.font };
            if (!!token.run.sup !== !!lastWord.style.sup) runStyle.sup = !!token.run.sup;
            lastWord.styleRuns.push({ i: lastWord.text.length, style: runStyle });
          }
          if (fnRefs.length > 0 && fnRefs[fnRefs.length - 1].word === lastWord) fnRefs.pop();
          lastWord.text += token.text;
          lastWord.bbox.right = Math.round(lastWord.bbox.right + tokenWidth);
          currentX = lastWord.bbox.right;
          tokenIndex++;
          continue;
        }
        const keepSpace = token.space && (lineObj.words.length > 0 || block.preserveBreaks);
        const spaceWidth = keepSpace ? getTextWidth(token.space, block.fontSize, face) : 0;
        if (lineObj.words.length > 0 && currentX + spaceWidth + tokenWidth > rightEdge) break;
        currentX += spaceWidth;
        const wordId = `word_${pageIndex + 1}_${pageObj.lines.length + 1}_${lineObj.words.length + 1}`;
        const wordObj = new ocr.OcrWord(lineObj, wordId, token.text, {
          left: Math.round(currentX),
          top: lineTop,
          right: Math.round(currentX + tokenWidth),
          bottom: lineBottom
        });
        wordObj.conf = 100;
        wordObj.style.font = token.run.font;
        wordObj.style.size = block.fontSize;
        wordObj.style.bold = token.run.bold;
        wordObj.style.italic = token.run.italic;
        if (token.run.sup) wordObj.style.sup = true;
        if (token.run.link) wordObj.style.link = token.run.link;
        wordObj.visualCoords = false;
        if (token.run.footnoteLabel && token.text === token.run.footnoteLabel) fnRefs.push({ word: wordObj, label: token.run.footnoteLabel });
        lineObj.words.push(wordObj);
        currentX += tokenWidth;
        tokenIndex++;
      }
      if (lineObj.words.length > 0) {
        lineObj.bbox = {
          left: lineObj.words[0].bbox.left,
          top: lineTop,
          right: lineObj.words[lineObj.words.length - 1].bbox.right,
          bottom: lineBottom
        };
        pageObj.lines.push(lineObj);
        parLines.push(lineObj);
        parRight = Math.max(parRight, lineObj.bbox.right);
      }
      currentY += lineHeight;
    }
    flushPar(pageObj);
    currentY += BLOCK_SPACING;
  }
  for (const ref of fnRefs) {
    const notePar = fnPars.get(ref.label);
    if (!notePar) continue;
    ref.word.footnoteParId = notePar.id;
    if (!notePar.footnoteRefId) notePar.footnoteRefId = ref.word.id;
  }
  return pagesOut;
}
const getDims = (img) => {
  if (!img._dims) {
    if (img.imageBitmap) {
      img._dims = { width: img.imageBitmap.width, height: img.imageBitmap.height };
    } else if (img.format === "jpeg") {
      img._dims = getJpegDimensions(img.src);
    } else {
      img._dims = getPngDimensions(img.src);
    }
  }
  return img._dims;
};
const requiresUndo = (img, props) => {
  if (!props) return false;
  if (img.rotated && props.rotated === false) return true;
  if (img.upscaled && props.upscaled === false) return true;
  if (img.colorMode === "color" && props.colorMode === "gray" || img.colorMode === "gray" && props.colorMode === "color") return true;
  return false;
};
const compatible = (img, props, significantRotation) => {
  if (!props) return true;
  if (props.rotated === false && img.rotated === true) {
    return false;
  }
  if (props.rotated === true && img.rotated === false) {
    if (significantRotation) {
      return false;
    }
  }
  if (props.upscaled === true && img.upscaled === false || props.upscaled === false && img.upscaled === true) return false;
  if (props.colorMode && props.colorMode !== img.colorMode && img.colorMode !== "native" && img.colorMode !== "native") return false;
  return true;
};
const imageUtils = {
  getDims,
  requiresUndo,
  compatible
};
async function drawWordActual(words, imageBinaryBit, angle) {
  if (!FontCont.raw) throw new Error("Fonts must be defined before running this function.");
  const lineFontSize = calcLineFontSize(words[0].line, FontCont);
  const fontI = FontCont.getWordFont(words[0]);
  const fontOpentypeI = fontI.opentype;
  const fontAscApprox = fontOpentypeI.charToGlyph("A").getMetrics().yMax * 1.1;
  const fontDescApprox = fontOpentypeI.charToGlyph("j").getMetrics().yMin * 1.1;
  const fontDesc = Math.round(fontDescApprox * (lineFontSize / 1e3));
  const fontAsc = Math.round(fontAscApprox * (lineFontSize / 1e3));
  const cosAngle = Math.cos(angle * (Math.PI / 180));
  const wordsBox = words.map((x) => x.bbox);
  const wordBoxUnion = {
    left: Math.min(...wordsBox.map((x) => x.left)),
    top: Math.min(...wordsBox.map((x) => x.top)),
    right: Math.max(...wordsBox.map((x) => x.right)),
    bottom: Math.max(...wordsBox.map((x) => x.bottom))
  };
  const lineObj = words[0].line;
  const linebox = words[0].line.bbox;
  const { baseline } = words[0].line;
  const imageRotated = angle !== 0;
  const angleAdjLine = imageRotated ? ocr.calcLineStartAngleAdj(lineObj) : { x: 0, y: 0 };
  const start = linebox.left + angleAdjLine.x + (wordBoxUnion.left - linebox.left) / cosAngle;
  const height = Math.round(fontAsc - fontDesc);
  const width = Math.round(wordBoxUnion.right - wordBoxUnion.left + 1);
  const cropY = linebox.bottom + baseline[1] - fontAsc - 1;
  const cropYAdj = cropY + angleAdjLine.y;
  const canvas = await ca.createCanvas(width, height);
  const ctx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    canvas.getContext("2d")
  );
  ctx.drawImage(imageBinaryBit, start - 1, cropYAdj, width, height, 0, 0, width, height);
  return {
    canvas,
    cropY,
    width,
    height
  };
}
const printWordOnCanvas = async ({
  ctx,
  charArr,
  left,
  bottom,
  advanceArr,
  font,
  size,
  smallCaps,
  fillStyle = "black"
}) => {
  ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${size}px ${font.fontFaceName}`;
  ctx.fillStyle = fillStyle;
  ctx.textBaseline = "alphabetic";
  let leftI = left;
  for (let i = 0; i < charArr.length; i++) {
    let charI = charArr[i];
    if (smallCaps) {
      if (charI === charI.toUpperCase()) {
        ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${size}px ${font.fontFaceName}`;
      } else {
        charI = charI.toUpperCase();
        ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${size * font.smallCapsMult}px ${font.fontFaceName}`;
      }
    }
    ctx.fillText(charI, leftI, bottom);
    leftI += advanceArr[i];
  }
};
const drawWordRender = async (ctx, word, offsetX = 0, cropY = 0, ctxView = null, imageRotated = false) => {
  if (!FontCont.raw) throw new Error("Fonts must be defined before running this function.");
  if (!ctx) throw new Error("Canvases must be defined before running this function.");
  const fontI = FontCont.getWordFont(word);
  let baselineY = word.line.bbox.bottom + word.line.baseline[1];
  const wordMetrics = calcWordMetrics(word, FontCont);
  const advanceArr = wordMetrics.advanceArr;
  const kerningArr = wordMetrics.kerningArr;
  const charSpacing = wordMetrics.charSpacing;
  const wordFontSize = wordMetrics.fontSize;
  if (word.style.sup) {
    const wordboxXMid = word.bbox.left + (word.bbox.right - word.bbox.left) / 2;
    const baselineYWord = word.line.bbox.bottom + word.line.baseline[1] + word.line.baseline[0] * (wordboxXMid - word.line.bbox.left);
    baselineY -= baselineYWord - word.bbox.bottom;
    if (!word.visualCoords) {
      const fontDesc = fontI.opentype.descender / fontI.opentype.unitsPerEm * wordMetrics.fontSize;
      baselineY += fontDesc;
    }
  } else if (!imageRotated) {
    const wordboxXMid = word.bbox.left + (word.bbox.right - word.bbox.left) / 2;
    baselineY = word.line.bbox.bottom + word.line.baseline[1] + word.line.baseline[0] * (wordboxXMid - word.line.bbox.left);
  }
  const y = baselineY - cropY;
  const advanceArrTotal = [];
  for (let i = 0; i < advanceArr.length; i++) {
    let leftI = 0;
    leftI += advanceArr[i] || 0;
    leftI += kerningArr[i] || 0;
    leftI += charSpacing || 0;
    advanceArrTotal.push(leftI);
  }
  let left = 1 + offsetX;
  if (word.visualCoords) left -= wordMetrics.leftSideBearing;
  await printWordOnCanvas({
    ctx,
    charArr: wordMetrics.charArr,
    left,
    bottom: y,
    advanceArr: advanceArrTotal,
    font: fontI,
    size: wordFontSize,
    smallCaps: word.style.smallCaps
  });
  if (ctxView) {
    await printWordOnCanvas({
      ctx: ctxView,
      charArr: wordMetrics.charArr,
      left,
      bottom: y,
      advanceArr: advanceArrTotal,
      font: fontI,
      size: wordFontSize,
      smallCaps: word.style.smallCaps,
      fillStyle: "red"
    });
  }
};
async function evalWords({
  wordsA,
  wordsB = [],
  binaryImage,
  angle,
  options = {}
}) {
  let anyChinese = false;
  wordsA.forEach((x) => {
    if (x.lang === "chi_sim") anyChinese = true;
  });
  wordsB.forEach((x) => {
    if (x.lang === "chi_sim") anyChinese = true;
  });
  if (wordsA[0].line.words[0].lang === "chi_sim") anyChinese = true;
  if (wordsB[0] && wordsB[0].line.words[0].lang === "chi_sim") anyChinese = true;
  if (anyChinese) return { metricA: 1, metricB: 0, debug: null };
  const binaryImageBit = await ca.getImageBitmap(binaryImage);
  if (!FontCont.raw) throw new Error("Fonts must be defined before running this function.");
  const view = options?.view === void 0 ? false : options?.view;
  options?.useABaseline === void 0 ? true : options?.useABaseline;
  const cosAngle = Math.cos(angle * -1 * (Math.PI / 180)) || 1;
  const linebox = wordsA[0].line.bbox;
  const baselineA = wordsA[0].line.baseline;
  const {
    canvas,
    cropY,
    width,
    height
  } = await drawWordActual([...wordsA, ...wordsB], binaryImageBit, angle);
  const ctx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    canvas.getContext("2d")
  );
  const imageDataActual = ctx.getImageData(0, 0, width, height).data;
  let canvasView0;
  let ctxView0;
  let canvasView1;
  let ctxView1;
  let canvasView2;
  let ctxView2;
  if (view) {
    canvasView0 = await ca.createCanvas(width, height);
    ctxView0 = /** @type {OffscreenCanvasRenderingContext2D} */
    canvasView0.getContext("2d");
    ctxView0.drawImage(canvas, 0, 0);
    canvasView1 = await ca.createCanvas(width, height);
    ctxView1 = /** @type {OffscreenCanvasRenderingContext2D} */
    canvasView1.getContext("2d");
    ctxView1.drawImage(canvas, 0, 0);
    if (wordsB.length > 0) {
      canvasView2 = await ca.createCanvas(width, height);
      ctxView2 = /** @type {OffscreenCanvasRenderingContext2D} */
      canvasView2.getContext("2d");
      ctxView2.drawImage(canvas, 0, 0);
    }
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  let x0 = wordsA[0].bbox.left;
  linebox.bottom + baselineA[1] + baselineA[0] * (wordsA[0].bbox.left - linebox.left);
  for (let i = 0; i < wordsA.length; i++) {
    const word = wordsA[i];
    const wordIBox = word.bbox;
    const offsetX = (wordIBox.left - x0) / cosAngle;
    await drawWordRender(ctx, word, offsetX, cropY, ctxView1, Boolean(angle));
  }
  const imageDataExpectedA = ctx.getImageData(0, 0, width, height).data;
  if (imageDataActual.length !== imageDataExpectedA.length) {
    console.log("Actual and expected images are different sizes");
    debugger;
  }
  let diffA = 0;
  let totalA = 0;
  let lastMatch = false;
  for (let i = 0; i < imageDataActual.length; i++) {
    if (imageDataActual[i] !== 255 || imageDataExpectedA[i] !== 255) {
      totalA += 1;
      if (imageDataActual[i] === 255 || imageDataExpectedA[i] === 255) {
        if (lastMatch) {
          diffA += 0.5;
        } else {
          diffA += 1;
        }
        lastMatch = false;
      } else {
        lastMatch = true;
      }
    }
  }
  const metricA = diffA / totalA;
  let metricB = 1;
  if (wordsB.length > 0) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < wordsB.length; i++) {
      const word = ocr.cloneWord(wordsB[i]);
      word.style = { ...wordsA[0].style };
      if (i === 0) {
        x0 = word.bbox.left;
      }
      const offsetX = (word.bbox.left - x0) / cosAngle;
      await drawWordRender(ctx, word, offsetX, cropY, ctxView2, Boolean(angle));
    }
    const imageDataExpectedB = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    let diffB = 0;
    let totalB = 0;
    let lastMatch2 = false;
    for (let i = 0; i < imageDataActual.length; i++) {
      if (imageDataActual[i] !== 255 || imageDataExpectedB[i] !== 255) {
        totalB += 1;
        if (imageDataActual[i] === 255 || imageDataExpectedB[i] === 255) {
          if (lastMatch2) {
            diffB += 0.5;
          } else {
            diffB += 1;
          }
          lastMatch2 = false;
        } else {
          lastMatch2 = true;
        }
      }
    }
    metricB = diffB / totalB;
  }
  let debugImg = null;
  if (view) {
    if (typeof process === "undefined") {
      let imageRaw;
      let imageA;
      let imageB;
      if (canvasView0) imageRaw = await canvasView0.convertToBlob();
      if (canvasView1) imageA = await canvasView1.convertToBlob();
      if (canvasView2) imageB = await canvasView2.convertToBlob();
      const dims = { width, height };
      debugImg = {
        context: "browser",
        imageRaw,
        imageA,
        imageB,
        dims,
        errorRawA: metricA,
        errorRawB: metricB,
        errorAdjA: null,
        errorAdjB: null
      };
    } else {
      let imageRaw;
      let imageA;
      let imageB;
      if (canvasView0) imageRaw = canvasView0.toDataURL("image/png");
      if (canvasView1) imageA = canvasView1.toDataURL("image/png");
      if (canvasView2) imageB = canvasView2.toDataURL("image/png");
      const dims = { width, height };
      debugImg = {
        context: "node",
        imageRaw,
        imageA,
        imageB,
        dims,
        errorRawA: metricA,
        errorRawB: metricB,
        errorAdjA: null,
        errorAdjB: null
      };
    }
  }
  if (typeof process !== "undefined") {
    ca.closeDrawable(canvas);
    ca.closeDrawable(canvasView0);
    ca.closeDrawable(canvasView1);
    ca.closeDrawable(canvasView2);
  }
  return { metricA, metricB, debug: debugImg };
}
async function penalizeWord(wordObjs) {
  const wordStr = wordObjs.map((x) => x.text).join("");
  let penalty = 0;
  if (/[^0-9]%/.test(wordStr)) penalty += 0.05;
  if (/ii/.test(wordStr)) penalty += 0.05;
  if (/^m$/.test(wordStr)) penalty += 0.05;
  if (/[a-z]\d[a-z]/i.test(wordStr)) penalty += 0.05;
  if (/^\]./.test(wordStr)) penalty += 0.05;
  if (wordObjs.length === 1 && /^[a-z][.,-]$/i.test(wordStr)) {
    const word = wordObjs[0];
    const wordTextArr = wordStr.split("");
    const wordFontSize = calcLineFontSize(word.line, FontCont);
    const fontI = FontCont.getWordFont(word);
    const fontOpentypeI = fontI.opentype;
    const glyphFirstMetrics = fontOpentypeI.charToGlyph(wordTextArr[0]).getMetrics();
    const widthFirst = (glyphFirstMetrics.xMax - glyphFirstMetrics.xMin) / fontOpentypeI.unitsPerEm * wordFontSize;
    const glyphSecondMetrics = fontOpentypeI.charToGlyph(wordTextArr[1]).getMetrics();
    const widthSecond = (glyphSecondMetrics.xMax - glyphSecondMetrics.xMin) / fontOpentypeI.unitsPerEm * wordFontSize;
    const widthTotal = widthFirst + widthSecond;
    const wordWidth = word.bbox.right - word.bbox.left;
    if (widthFirst >= wordWidth * 0.9 && widthTotal > wordWidth * 1.15) penalty += 0.05;
  }
  return penalty;
}
async function compareOCRPageImp({
  pageA,
  pageB,
  binaryImage,
  pageMetricsObj,
  options = {}
}) {
  let binaryImageBit = null;
  let imageUpscaled = false;
  let imageRotated = false;
  if (binaryImage) {
    binaryImageBit = binaryImage.imageBitmap || await ca.getImageBitmap(binaryImage.src);
    imageUpscaled = binaryImage.upscaled;
    imageRotated = binaryImage.rotated;
  }
  const mode = options?.mode === void 0 ? "stats" : options?.mode;
  const editConf = options?.editConf === void 0 ? false : options?.editConf;
  const useBboxB = options?.useBboxB === void 0 ? false : options?.useBboxB;
  const combinedA = options?.combinedA === void 0 ? false : options?.combinedA;
  const debugLabel = options?.debugLabel === void 0 ? "" : options?.debugLabel;
  const evalConflicts = options?.evalConflicts === void 0 ? true : options?.evalConflicts;
  const supplementComp = options?.supplementComp === void 0 ? false : options?.supplementComp;
  const tessWorker = options?.tessWorker === void 0 ? null : options?.tessWorker;
  const ignorePunct = options?.ignorePunct === void 0 ? false : options?.ignorePunct;
  const ignoreCap = options?.ignoreCap === void 0 ? false : options?.ignoreCap;
  const confThreshHigh = options?.confThreshHigh === void 0 ? 85 : options?.confThreshHigh;
  const confThreshMed = options?.confThreshMed === void 0 ? 75 : options?.confThreshMed;
  if (supplementComp && !tessWorker) console.log("`supplementComp` enabled, but no scheduler was provided. This step will be skipped.");
  if (typeof WorkerGlobalScope === "undefined") {
    pageA = structuredClone(pageA);
    pageB = structuredClone(pageB);
  }
  const imgAngle = imageRotated ? pageMetricsObj.angle || 0 : 0;
  if (imageUpscaled) {
    ocr.scalePage(pageA, 2);
    ocr.scalePage(pageB, 2);
  }
  const debugImg = [];
  const hocrAOverlap = {};
  const hocrBOverlap = {};
  const hocrBOverlapAWords = {};
  const hocrACorrect = {};
  const hocrBCorrect = {};
  ocr.getPageWords(pageA).forEach((x) => {
    x.compTruth = false;
    x.matchTruth = false;
  });
  const pageAInt = structuredClone(pageA);
  const confOrig = new Map(ocr.getPageWords(pageA).map((x) => [x.id, x.conf]));
  if (mode === "comb" && !combinedA) {
    ocr.getPageWords(pageAInt).forEach((x) => {
      x.conf = 0;
    });
  }
  const compText = (text) => {
    let t = ocr.replaceLigatures(text);
    if (ignorePunct) t = t.replace(/(^|\D)[\W_]($|\D)/g, "$1$2");
    if (ignoreCap) t = t.toLowerCase();
    return t;
  };
  for (let i = 0; i < pageAInt.lines.length; i++) {
    const lineA = pageAInt.lines[i];
    const lineBoxA = lineA.bbox;
    let lineWordsEditedNew = 0;
    let lineBReplace = null;
    for (let j = 0; j < pageB.lines.length; j++) {
      const lineB = pageB.lines[j];
      const lineBoxB = lineB.bbox;
      if (lineBoxA.top > lineBoxB.bottom) {
        continue;
      } else if (lineBoxB.top > lineBoxA.bottom) {
        continue;
      } else {
        let minWordB = 0;
        for (let k = 0; k < lineA.words.length; k++) {
          const wordA = lineA.words[k];
          if (ignorePunct && !wordA.text.replace(/[\W_]/g, "")) {
            wordA.compTruth = true;
            wordA.matchTruth = true;
            if (mode === "comb") wordA.conf = 100;
            hocrACorrect[wordA.id] = 1;
          }
          const wordBoxA = wordA.bbox;
          const wordBoxAHeight = wordBoxA.bottom - wordBoxA.top;
          const wordBoxACore = JSON.parse(JSON.stringify(wordBoxA));
          if (wordA.visualCoords) {
            wordBoxACore.top = wordBoxA.top + Math.round(wordBoxAHeight * 0.1);
            wordBoxACore.bottom = wordBoxA.bottom - Math.round(wordBoxAHeight * 0.1);
          } else {
            wordBoxACore.top = wordBoxA.top + Math.round(wordBoxAHeight * 0.25);
            wordBoxACore.bottom = wordBoxA.bottom - Math.round(wordBoxAHeight * 0.25);
          }
          for (let l = minWordB; l < lineB.words.length; l++) {
            const wordB = lineB.words[l];
            const wordBoxB = wordB.bbox;
            const wordBoxBHeight = wordBoxB.bottom - wordBoxB.top;
            const wordBoxBCore = JSON.parse(JSON.stringify(wordBoxB));
            if (wordB.visualCoords) {
              wordBoxBCore.top = wordBoxB.top + Math.round(wordBoxBHeight * 0.1);
              wordBoxBCore.bottom = wordBoxB.bottom - Math.round(wordBoxBHeight * 0.1);
            } else {
              wordBoxBCore.top = wordBoxB.top + Math.round(wordBoxBHeight * 0.25);
              wordBoxBCore.bottom = wordBoxB.bottom - Math.round(wordBoxBHeight * 0.25);
            }
            if (wordBoxACore.left > wordBoxBCore.right) {
              minWordB += 1;
              continue;
            } else if (wordBoxBCore.left > wordBoxACore.right) {
              continue;
            } else {
              if (wordBoxACore.top > wordBoxBCore.bottom || wordBoxBCore.top > wordBoxACore.bottom) {
                continue;
              }
              wordA.compTruth = true;
              const wordTextA = compText(wordA.text);
              const wordTextB = compText(wordB.text);
              hocrAOverlap[wordA.id] = 1;
              hocrBOverlap[wordB.id] = 1;
              if (!hocrBOverlapAWords[wordB.id]) hocrBOverlapAWords[wordB.id] = {};
              hocrBOverlapAWords[wordB.id][wordA.id] = 1;
              if (wordTextA === wordTextB) {
                wordA.compTruth = true;
                wordA.matchTruth = true;
                if (mode === "comb") wordA.conf = 100;
                hocrACorrect[wordA.id] = 1;
                hocrBCorrect[wordB.id] = 1;
                if (mode === "comb" && useBboxB) {
                  wordA.bbox = structuredClone(wordB.bbox);
                  wordA.visualCoords = true;
                  wordA.chars = structuredClone(wordB.chars);
                }
              } else if (mode === "comb") {
                wordA.conf = 0;
                wordA.matchTruth = false;
                const oneToOne = Math.abs(wordBoxB.left - wordBoxA.left) + Math.abs(wordBoxB.right - wordBoxA.right) < (wordBoxA.right - wordBoxA.left) * 0.1;
                const wordBNext = lineB.words[l + 1];
                const wordBNext2 = lineB.words[l + 2];
                const wordBNext3 = lineB.words[l + 3];
                let twoToOne = false;
                const wordsAArr = [];
                const wordsBArr = [];
                if (!oneToOne) {
                  if (wordBoxA.right < wordBoxB.right) {
                    const wordANext = lineA.words[k + 1];
                    if (wordANext) {
                      const wordBoxANext = wordANext.bbox;
                      if (Math.abs(wordBoxB.left - wordBoxA.left) + Math.abs(wordBoxB.right - wordBoxANext.right) < (wordBoxANext.right - wordBoxA.left) * 0.1) {
                        twoToOne = true;
                        wordsAArr.push(wordA);
                        wordsAArr.push(wordANext);
                        wordsBArr.push(wordB);
                        wordANext.conf = 0;
                        wordANext.compTruth = true;
                        wordANext.matchTruth = false;
                      }
                    }
                  } else {
                    if (wordBNext3) {
                      const wordBoxBNext3 = wordBNext3.bbox;
                      if (Math.abs(wordBoxB.left - wordBoxA.left) + Math.abs(wordBoxA.right - wordBoxBNext3.right) < (wordBoxBNext3.right - wordBoxA.left) * 0.1) {
                        twoToOne = true;
                        wordsAArr.push(wordA);
                        wordsBArr.push(wordB);
                        wordsBArr.push(wordBNext);
                        wordsBArr.push(wordBNext2);
                        wordsBArr.push(wordBNext3);
                      }
                    }
                    if (wordBNext2 && !twoToOne) {
                      const wordBoxBNext2 = wordBNext2.bbox;
                      if (Math.abs(wordBoxB.left - wordBoxA.left) + Math.abs(wordBoxA.right - wordBoxBNext2.right) < (wordBoxBNext2.right - wordBoxA.left) * 0.1) {
                        twoToOne = true;
                        wordsAArr.push(wordA);
                        wordsBArr.push(wordB);
                        wordsBArr.push(wordBNext);
                        wordsBArr.push(wordBNext2);
                      }
                    }
                    if (wordBNext && !twoToOne) {
                      const wordBoxBNext = wordBNext.bbox;
                      if (Math.abs(wordBoxB.left - wordBoxA.left) + Math.abs(wordBoxA.right - wordBoxBNext.right) < (wordBoxBNext.right - wordBoxA.left) * 0.1) {
                        twoToOne = true;
                        wordsAArr.push(wordA);
                        wordsBArr.push(wordB);
                        wordsBArr.push(wordBNext);
                      }
                    }
                  }
                }
                const rangeA = twoToOne ? wordsAArr : [wordA];
                let agreedA = false;
                if (combinedA) {
                  for (const x of rangeA) {
                    if (confOrig.get(x.id) === 100) {
                      x.conf = 80;
                      agreedA = true;
                    }
                  }
                }
                if (!oneToOne && !twoToOne) continue;
                let winner = "legacy";
                let hocrAError = 1;
                let hocrBError = 1;
                if (!agreedA) {
                  if (!evalConflicts) {
                    hocrBError = 0;
                  } else if (oneToOne) {
                    const wordAClone = ocr.cloneWord(wordA);
                    wordAClone.text = wordB.text;
                    if (wordB.style.smallCaps && !wordA.style.smallCaps) {
                      wordAClone.style.smallCaps = true;
                      wordAClone.style.size = calcWordFontSize(wordB, FontCont);
                    }
                    const evalRes = await evalWords({
                      wordsA: [wordA],
                      wordsB: [wordAClone],
                      binaryImage: binaryImageBit,
                      angle: imgAngle,
                      options: { view: Boolean(debugLabel) }
                    });
                    hocrAError = evalRes.metricA + await penalizeWord([wordA]);
                    hocrBError = evalRes.metricB + await penalizeWord([wordB]);
                    if (evalRes.debug) {
                      const debugObj = evalRes.debug;
                      debugObj.errorAdjA = hocrAError;
                      debugObj.errorAdjB = hocrBError;
                      debugImg.push(debugObj);
                    }
                  } else if (twoToOne) {
                    const wordsAText = wordsAArr.map((x) => x.text).join("");
                    const wordsBText = wordsBArr.map((x) => x.text).join("");
                    const evalRes = await evalWords({
                      wordsA: wordsAArr,
                      wordsB: wordsBArr,
                      binaryImage: binaryImageBit,
                      angle: imgAngle,
                      options: { view: Boolean(debugLabel) }
                    });
                    hocrAError = evalRes.metricA + (wordsAArr.length - 1) * 0.025 + await penalizeWord(wordsAArr);
                    hocrBError = evalRes.metricB + (wordsBArr.length - 1) * 0.025 + await penalizeWord(wordsBArr);
                    if (wordsAText === wordsBText) {
                      if (wordsAArr.map((x) => /[a-z]/i.test(x.text)).filter((x) => !x).length > 0 || wordsBArr.map((x) => /[a-z]/i.test(x.text)).filter((x) => !x).length > 0) {
                        hocrAError += (wordsAArr.length - 1) * 0.05;
                        hocrBError += (wordsBArr.length - 1) * 0.05;
                      }
                    }
                    if (evalRes.debug) {
                      const debugObj = evalRes.debug;
                      debugObj.errorAdjA = hocrAError;
                      debugObj.errorAdjB = hocrBError;
                      debugImg.push(debugObj);
                    }
                  }
                }
                if (hocrBError < hocrAError && hocrBError < 1) {
                  if (!["eg", "ie"].includes(wordA.text.replace(/\W/g, ""))) winner = "lstm";
                }
                const rangeB = oneToOne ? [wordB] : wordsBArr;
                const losers = winner === "lstm" ? rangeA : rangeB;
                const lostText = losers.map((x) => x.text).join(" ");
                let survivors = rangeA;
                if (winner === "lstm") {
                  if (oneToOne) {
                    lineWordsEditedNew += 1;
                    lineBReplace = lineB;
                    wordA.text = wordB.text;
                    wordA.chars = null;
                    if (wordB.style.smallCaps) wordA.style.smallCaps = true;
                  } else {
                    const wordsBArrRep = wordsBArr.map((x) => ocr.cloneWord(x));
                    lineWordsEditedNew += wordsBArrRep.length;
                    lineBReplace = lineB;
                    wordsBArrRep.forEach((x) => {
                      x.conf = 0;
                      x.chars = null;
                      x.compTruth = true;
                      x.matchTruth = false;
                      x.line = lineA;
                      x.id += "b";
                    });
                    lineA.words.splice(k, wordsAArr.length, ...wordsBArrRep);
                    k = k + wordsBArrRep.length - 1;
                    survivors = wordsBArrRep;
                  }
                }
                const lostConfs = losers.map((x) => winner === "lstm" ? confOrig.get(x.id) ?? 0 : x.conf);
                const alt = [...survivors[0].alt || [], {
                  source: (winner === "lstm" ? pageA.textSource : pageB.textSource) || void 0,
                  text: lostText,
                  conf: Math.round(lostConfs.reduce((a, b) => a + b, 0) / lostConfs.length),
                  span: survivors.length
                }];
                const rangeDropped = winner === "lstm" && !oneToOne ? rangeA : rangeB;
                for (const a of rangeDropped[0].alt || []) if (a.span === rangeDropped.length) alt.push({ ...a, span: survivors.length });
                const survivorsText = survivors.map((x) => x.text).join(" ");
                survivors[0].alt = alt.filter((a) => !(a.span === survivors.length && a.text === survivorsText)).sort((a, b) => b.conf - a.conf);
                if (winner === "lstm" && !oneToOne) break;
              }
            }
          }
        }
      }
    }
    if (lineBReplace && lineWordsEditedNew > lineA.words.length * 0.5) {
      lineA.ascHeight = lineBReplace.ascHeight;
      lineA.xHeight = lineBReplace.xHeight;
    }
  }
  if (supplementComp && tessWorker && evalConflicts) {
    for (let i = 0; i < pageAInt.lines.length; i++) {
      const line = pageAInt.lines[i];
      for (let j = 0; j < line.words.length; j++) {
        const word = line.words[j];
        if (!word.compTruth) {
          const res = await checkWords([word], binaryImageBit, imageRotated, pageMetricsObj, tessWorker, {
            ignorePunct,
            view: false
          });
          word.matchTruth = res.match;
          word.conf = word.matchTruth ? 100 : 0;
        }
      }
    }
  }
  if (mode === "comb") {
    if (imageUpscaled) ocr.scalePage(pageAInt, 0.5);
    return {
      page: pageAInt,
      metrics: null,
      debugImg
    };
  }
  const hocrBAll = {};
  ocr.getPageWords(pageB).forEach((x) => {
    hocrBAll[x.id] = 1;
  });
  const hocrAAll = {};
  ocr.getPageWords(pageAInt).forEach((x) => {
    hocrAAll[x.id] = 1;
  });
  if (ignorePunct) {
    const punctOnlyIDsA = ocr.getPageWords(pageA).filter((x) => !x.text.replace(/[\W_]/g, "")).map((x) => x.id);
    punctOnlyIDsA.forEach((x) => {
      delete hocrAAll[x];
      delete hocrAOverlap[x];
      delete hocrACorrect[x];
    });
    const punctOnlyIDsB = ocr.getPageWords(pageB).filter((x) => !x.text.replace(/[\W_]/g, "")).map((x) => x.id);
    punctOnlyIDsB.forEach((x) => {
      delete hocrBAll[x];
      delete hocrBOverlap[x];
      delete hocrBCorrect[x];
    });
  }
  const totalCountB = Object.keys(hocrBAll).length;
  const totalCountA = Object.keys(hocrAAll).length;
  const overlapCountB = Object.keys(hocrBOverlap).length;
  const overlapCountA = Object.keys(hocrAOverlap).length;
  const correctCount = Object.keys(hocrBCorrect).length;
  const incorrectCount = overlapCountB - correctCount;
  let correctCountLowConf = 0;
  let incorrectCountHighConf = 0;
  const overlappingWordsB = Object.keys(hocrBOverlap);
  for (let i = 0; i < overlappingWordsB.length; i++) {
    const wordBID = overlappingWordsB[i];
    const wordAIDs = Object.keys(hocrBOverlapAWords[wordBID]);
    let lowConfCount = 0;
    let highConfCount = 0;
    for (let j = 0; j < wordAIDs.length; j++) {
      const word = ocr.getPageWord(pageA, wordAIDs[j]);
      if (word.conf <= confThreshMed) {
        lowConfCount++;
      } else if (word.conf > confThreshHigh) {
        highConfCount++;
      }
    }
    const match = hocrBCorrect[wordBID];
    if (match && lowConfCount > 0) {
      correctCountLowConf++;
    } else if (!match && highConfCount > 0) {
      incorrectCountHighConf++;
    }
  }
  const metricsRet = {
    total: totalCountB,
    correct: correctCount,
    incorrect: incorrectCount,
    missed: totalCountB - overlapCountB,
    extra: totalCountA - overlapCountA,
    correctLowConf: correctCountLowConf,
    incorrectHighConf: incorrectCountHighConf
  };
  if (editConf) {
    ocr.getPageWords(pageAInt).forEach((x) => {
      x.conf = x.matchTruth ? 100 : 0;
    });
  }
  if (imageUpscaled) ocr.scalePage(pageAInt, 0.5);
  return {
    page: pageAInt,
    metrics: metricsRet,
    debugImg
  };
}
async function checkWords(wordsA, binaryImage, imageRotated, pageMetricsObj, tessWorker, options = {}) {
  options?.view === void 0 ? false : options?.view;
  const ignorePunct = options?.ignorePunct === void 0 ? false : options?.ignorePunct;
  const ignoreCap = options?.ignoreCap === void 0 ? false : options?.ignoreCap;
  const angle = imageRotated ? pageMetricsObj.angle || 0 : 0;
  const { canvas } = await drawWordActual(wordsA, binaryImage, angle);
  const extraConfig = {
    lstm: true,
    tessedit_pageseg_mode: "6"
    // "Single block"
  };
  const inputImage = typeof process === "undefined" ? await canvas.convertToBlob() : await canvas.toDataURL();
  const res = (await tessWorker.recognize(inputImage, extraConfig)).data;
  let wordTextA = wordsA.map((x) => x.text).join(" ");
  let wordTextB = res.text.trim();
  wordTextA = ocr.replaceLigatures(wordTextA);
  wordTextB = ocr.replaceLigatures(wordTextB);
  if (ignorePunct) {
    wordTextA = wordTextA.replace(/(^|\D)[\W_]($|\D)/g, "$1$2");
    wordTextB = wordTextB.replace(/(^|\D)[\W_]($|\D)/g, "$1$2");
  }
  if (ignoreCap) {
    wordTextA = wordTextA.toLowerCase();
    wordTextB = wordTextB.toLowerCase();
  }
  return { match: wordTextA === wordTextB };
}
async function evalPageBase({
  page,
  binaryImage,
  pageMetricsObj,
  func = null,
  view = false
}) {
  if (typeof WorkerGlobalScope === "undefined") {
    page = structuredClone(page);
  }
  const lines = "lines" in page ? page.lines : [page];
  const imgAngle = binaryImage.rotated ? pageMetricsObj.angle || 0 : 0;
  if (binaryImage.upscaled) {
    for (let i = 0; i < lines.length; i++) {
      ocr.scaleLine(lines[i], 2);
    }
  }
  const binaryImageBit = binaryImage.imageBitmap || await ca.getImageBitmap(binaryImage.src);
  if (!FontCont.raw) throw new Error("Fonts must be defined before running this function.");
  let metricTotal = 0;
  let wordsTotal = 0;
  const debugArr = [];
  for (let j = 0; j < lines.length; j++) {
    let ocrLineJ = lines[j];
    if (ocrLineJ.words[0].lang === "chi_sim") continue;
    if (func) {
      ocrLineJ = await func(lines[j]);
    }
    if (!ocrLineJ) continue;
    const evalRes = await evalWords({
      wordsA: ocrLineJ.words,
      binaryImage: binaryImageBit,
      angle: imgAngle,
      options: { view }
    });
    metricTotal += evalRes.metricA * ocrLineJ.words.length;
    wordsTotal += ocrLineJ.words.length;
    if (evalRes.debug) debugArr.push(evalRes.debug);
  }
  return { wordsTotal, metricTotal, debug: debugArr };
}
async function evalPageFont({
  page,
  binaryImage,
  pageMetricsObj,
  font,
  opt = false
}) {
  const enableOptSave = FontCont.state.enableOpt;
  const forceOptSave = FontCont.state.forceOpt;
  if (opt === true) {
    if (!FontCont.opt) throw new Error("Optimized fonts requested but not defined.");
    FontCont.state.forceOpt = true;
  } else if (opt === false) {
    if (!FontCont.raw) throw new Error("Raw fonts requested but not defined.");
    FontCont.state.enableOpt = false;
    FontCont.state.forceOpt = false;
  }
  const transformLineFont = (ocrLineJ) => {
    if (!FontCont.raw) throw new Error("Fonts must be defined before running this function.");
    if (!ocrLineJ.words[0]) {
      console.log("Line has 0 words, this should not happen.");
      return ocr.cloneLine(ocrLineJ);
    }
    const lineFontType = FontCont.getWordFont(ocrLineJ.words[0]).type;
    if (FontCont.raw[font].normal.type !== lineFontType) return null;
    const ocrLineJClone = ocr.cloneLine(ocrLineJ);
    ocrLineJClone.words.forEach((x) => {
      x.style.font = font;
    });
    return ocrLineJClone;
  };
  const res = await evalPageBase({
    page,
    binaryImage,
    pageMetricsObj,
    func: transformLineFont
  });
  FontCont.state.enableOpt = enableOptSave;
  FontCont.state.forceOpt = forceOptSave;
  return res;
}
const renderPageStaticImp = async ({
  page,
  image,
  angle = 0,
  displayMode = "proof",
  confThreshMed = 75,
  confThreshHigh = 85
}) => {
  const dims = image ? imageUtils.getDims(image) : page.dims;
  const canvas = await ca.createCanvas(dims.width, dims.height);
  const ctx = (
    /** @type {OffscreenCanvasRenderingContext2D} */
    /** @type {unknown} */
    canvas.getContext("2d")
  );
  if (image) {
    const imageBit = await ca.getImageBitmap(image.src);
    ctx.drawImage(imageBit, 0, 0);
  }
  angle = angle ?? 0;
  ctx.textBaseline = "alphabetic";
  const sinAngle = Math.sin(angle * (Math.PI / 180));
  const cosAngle = Math.cos(angle * (Math.PI / 180));
  for (const lineObj of page.lines) {
    const angleAdjLine = image?.rotated ? ocr.calcLineStartAngleAdj(lineObj) : { x: 0, y: 0 };
    const baselineY = lineObj.bbox.bottom + lineObj.baseline[1] + angleAdjLine.y;
    const lineLeftAdj = lineObj.bbox.left + angleAdjLine.x;
    const rotateText = !image?.rotated;
    if (rotateText) {
      ctx.setTransform(cosAngle, sinAngle, -sinAngle, cosAngle, lineLeftAdj, baselineY);
    } else {
      ctx.setTransform(1, 0, 0, 1, lineLeftAdj, baselineY);
    }
    for (const wordObj of lineObj.words) {
      if (!wordObj.text) continue;
      const { fill } = ocr.getWordFillOpacity(wordObj, displayMode, confThreshMed, confThreshHigh);
      ctx.fillStyle = fill;
      const angleAdjWord = wordObj.style.sup ? ocr.calcWordAngleAdj(wordObj) : { x: 0, y: 0 };
      const wordMetrics = calcWordMetrics(wordObj, FontCont);
      const advanceArr = wordMetrics.advanceArr;
      const kerningArr = wordMetrics.kerningArr;
      const charSpacing = wordMetrics.charSpacing;
      const wordFontSize = wordMetrics.fontSize;
      const leftSideBearing = wordMetrics.leftSideBearing;
      let ts = 0;
      if (wordObj.style.sup || wordObj.style.dropcap) {
        ts = lineObj.bbox.bottom + lineObj.baseline[1] + angleAdjLine.y - (wordObj.bbox.bottom + angleAdjLine.y + angleAdjWord.y);
        if (!wordObj.visualCoords) {
          const font2 = FontCont.getWordFont(wordObj);
          const fontDesc = font2.opentype.descender / font2.opentype.unitsPerEm * wordMetrics.fontSize;
          ts -= fontDesc;
        }
      } else {
        ts = 0;
      }
      const width = (wordObj.bbox.left - wordObj.line.bbox.left) / cosAngle;
      const visualLeft = width + angleAdjWord.x;
      const advanceArrTotal = [];
      for (let i = 0; i < advanceArr.length; i++) {
        let leftI2 = 0;
        leftI2 += advanceArr[i] || 0;
        leftI2 += kerningArr[i] || 0;
        leftI2 += charSpacing || 0;
        advanceArrTotal.push(leftI2);
      }
      const font = FontCont.getWordFont(wordObj);
      ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${wordFontSize}px ${font.fontFaceName}`;
      let leftI = wordObj.visualCoords ? visualLeft - leftSideBearing : visualLeft;
      for (let i = 0; i < wordMetrics.charArr.length; i++) {
        let charI = wordMetrics.charArr[i];
        if (wordObj.style.smallCaps) {
          if (charI === charI.toUpperCase()) {
            ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${wordFontSize}px ${font.fontFaceName}`;
          } else {
            charI = charI.toUpperCase();
            ctx.font = `${font.fontFaceStyle} ${font.fontFaceWeight} ${wordFontSize * font.smallCapsMult}px ${font.fontFaceName}`;
          }
        }
        ctx.fillText(charI, leftI, -ts);
        leftI += advanceArrTotal[i];
      }
    }
  }
  const img = typeof process === "undefined" ? await canvas.convertToBlob() : await canvas.toDataURL();
  return img;
};
function round6(x) {
  return Math.round(x * 1e6) / 1e6;
}
function transformGlyph(glyph, func, transX = false, transY = false) {
  const funcRound = (x) => Math.round(func(x));
  for (let j = 0; j < glyph.path.commands.length; j++) {
    const pointJ = glyph.path.commands[j];
    if (pointJ.type === "M" || pointJ.type === "L" || pointJ.type === "C" || pointJ.type === "Q") {
      if (transX) pointJ.x = funcRound(pointJ.x);
      if (transY) pointJ.y = funcRound(pointJ.y);
      if (pointJ.type === "C" || pointJ.type === "Q") {
        if (transX) pointJ.x1 = funcRound(pointJ.x1);
        if (transY) pointJ.y1 = funcRound(pointJ.y1);
        if (pointJ.type === "C") {
          if (transX) pointJ.x2 = funcRound(pointJ.x2);
          if (transY) pointJ.y2 = funcRound(pointJ.y2);
        }
      }
    }
  }
  if (transX) {
    const glyphMetrics = glyph.getMetrics();
    glyph.leftSideBearing = glyphMetrics.xMin;
    glyph.advanceWidth = funcRound(glyph.advanceWidth);
  }
}
const calculateKerningPairs = (font, charMetricsObj, xHeight, styleLookup) => {
  const fontKerningObj = {};
  const maxKern = Math.round(font.unitsPerEm * 0.1);
  const minKern = maxKern * -1;
  for (const [key, value] of Object.entries(charMetricsObj.kerning)) {
    if (key === "102,102" && ["italic", "boldItalic"].includes(styleLookup)) continue;
    const nameFirst = key.match(/\w+/)[0];
    const nameSecond = key.match(/\w+$/)[0];
    const charFirst = String.fromCharCode(parseInt(nameFirst));
    const charSecond = String.fromCharCode(parseInt(nameSecond));
    const indexFirst = font.charToGlyphIndex(charFirst);
    const indexSecond = font.charToGlyphIndex(charSecond);
    const glyphFirst = font.glyphs.glyphs[indexFirst];
    const glyphSecond = font.glyphs.glyphs[indexSecond];
    const metricsFirst = glyphFirst.getMetrics();
    const metricsSecond = glyphSecond.getMetrics();
    const fontKern1 = Math.round(value * xHeight);
    let spaceTarget = fontKern1;
    if (charMetricsObj.kerning2) {
      const value2 = charMetricsObj.kerning2[key];
      if (value2) {
        const fontKern2 = Math.round(value2 * xHeight);
        spaceTarget = Math.round((fontKern1 + fontKern2) / 2);
      }
    }
    const spaceCurrent = glyphFirst.advanceWidth - metricsFirst.xMax + metricsSecond.xMin;
    let fontKern = spaceTarget - spaceCurrent;
    if (["8220", "8216"].includes(nameFirst) || ["8221", "8217"].includes(nameSecond)) {
      fontKern = Math.min(Math.max(fontKern, minKern), maxKern * 2);
    } else if (["102,102", "102,105", "102,108"].includes(key)) {
      fontKern = Math.min(Math.max(fontKern, Math.round(minKern * 1.5)), maxKern);
    } else {
      fontKern = Math.min(Math.max(fontKern, minKern), maxKern);
    }
    fontKerningObj[`${indexFirst},${indexSecond}`] = fontKern;
  }
  return fontKerningObj;
};
async function optimizeFont({
  fontData,
  charMetricsObj,
  style,
  adjustAllLeftBearings = false,
  targetEmSize = null,
  transGlyphs = true
}) {
  const skipTables = ["GSUB", "GPOS", "OS/2", "cvt ", "fpgm", "prep", "COLR", "CPAL", "meta"];
  const workingFont = typeof fontData === "string" ? await opentype.parse(await fetch(fontData).then((r) => r.arrayBuffer()), { skipTables }) : await opentype.parse(fontData, { skipTables });
  workingFont.tables.gsub = null;
  if (targetEmSize && targetEmSize !== workingFont.unitsPerEm) {
    for (let i = 0; i < workingFont.glyphs.length; i++) {
      transformGlyph(workingFont.glyphs.get(i), (x) => x * (targetEmSize / workingFont.unitsPerEm), true, true);
    }
    workingFont.unitsPerEm = targetEmSize;
  }
  let oGlyph = workingFont.charToGlyph("o").getMetrics();
  let xHeight = oGlyph.yMax - oGlyph.yMin;
  const monoGlyphI = workingFont.charToGlyph("i");
  const monoGlyphM = workingFont.charToGlyph("m");
  const isMonospace = monoGlyphI?.advanceWidth > 0 && monoGlyphI.advanceWidth === monoGlyphM?.advanceWidth;
  const monoAdvanceWidth = isMonospace ? monoGlyphI.advanceWidth : 0;
  if (!transGlyphs && !isMonospace) {
    workingFont.kerningPairs = isMonospace ? {} : calculateKerningPairs(workingFont, charMetricsObj, xHeight, style);
    return { fontData: workingFont.toArrayBuffer(), kerningPairs: workingFont.kerningPairs };
  }
  oGlyph = workingFont.charToGlyph("o").getMetrics();
  xHeight = oGlyph.yMax - oGlyph.yMin;
  const heightCapsBelievable = charMetricsObj.obsCaps >= 10 && charMetricsObj.heightCaps >= 1.1 && charMetricsObj.heightCaps < 2;
  const fontAscHeight = workingFont.charToGlyph("A").getMetrics().yMax;
  const singleStemClassA = ["i", "l", "t", "I"];
  const singleStemClassB = ["f", "i", "j", "l", "t", "I", "J", "T"];
  for (const [key, value] of Object.entries(charMetricsObj.width)) {
    if (parseInt(key) < 33) {
      continue;
    }
    const charLit = String.fromCharCode(parseInt(key));
    if (["."].includes(charLit)) {
      continue;
    }
    const glyphI = workingFont.charToGlyph(charLit);
    if (glyphI.name === ".notdef" || glyphI.name === "NULL") continue;
    let glyphIMetrics = glyphI.getMetrics();
    const glyphIWidth = glyphIMetrics.xMax - glyphIMetrics.xMin;
    let scaleXFactor = value * xHeight / glyphIWidth;
    const glyphICenterPoint = charLit === "f" ? 0.35 : 0.5;
    const glyphICenter = Math.max(glyphIMetrics.xMin, 0) + Math.round(glyphIWidth * glyphICenterPoint);
    if (singleStemClassA.includes(charLit)) {
      scaleXFactor = Math.max(Math.min(scaleXFactor, 1.1), 0.9);
    } else if (["“", "”"].includes(charLit)) {
      scaleXFactor = Math.max(Math.min(scaleXFactor, 1.5), 0.7);
    } else {
      scaleXFactor = Math.max(Math.min(scaleXFactor, 1.3), 0.7);
    }
    const scaleH1 = (x) => Math.round((x - glyphICenter) * scaleXFactor) + glyphICenter;
    const scaleH2 = (x) => Math.round(x * scaleXFactor);
    if (singleStemClassB.includes(charLit) && style !== "italic") {
      transformGlyph(glyphI, scaleH1, true, false);
    } else {
      transformGlyph(glyphI, scaleH2, true, false);
    }
    glyphIMetrics = glyphI.getMetrics();
    glyphI.leftSideBearing = glyphIMetrics.xMin;
    let shiftX = 0;
    if ([";", ":", "‘", "’", "“", "”", '"'].includes(charLit) || adjustAllLeftBearings) {
      const leftBearingCorrect = 0;
      const leftBearingAct = glyphIMetrics.xMin;
      if (Number.isFinite(leftBearingCorrect) && leftBearingAct !== void 0) {
        shiftX = leftBearingCorrect - leftBearingAct;
        if (shiftX + glyphI.advanceWidth < workingFont.unitsPerEm * 0.05) {
          shiftX = 0;
        }
      }
    }
    if (shiftX !== 0) {
      const shiftH = (x) => x + shiftX;
      transformGlyph(glyphI, shiftH, true, false);
      glyphIMetrics = glyphI.getMetrics();
    }
    glyphI.leftSideBearing = glyphIMetrics.xMin;
  }
  if (isMonospace) {
    const ocrWidthValues = Object.values(charMetricsObj.width).filter((v) => v > 0);
    if (ocrWidthValues.length > 0) {
      const medianOcrWidth = quantile(ocrWidthValues, 0.5);
      const targetAdvance = Math.round(medianOcrWidth * xHeight);
      const originalMonoAdvance = monoAdvanceWidth;
      const uniformAdvance = Math.round(Math.max(Math.min(targetAdvance, originalMonoAdvance * 1.3), originalMonoAdvance * 0.7));
      for (let i = 0; i < workingFont.glyphs.length; i++) {
        const glyph = workingFont.glyphs.get(i);
        if (glyph.advanceWidth > 0) {
          glyph.advanceWidth = uniformAdvance;
        }
      }
    }
  }
  if (heightCapsBelievable) {
    const capsMult = xHeight * charMetricsObj.heightCaps / fontAscHeight;
    for (const key of [...Array(26).keys()].map((x) => x + 65)) {
      const charLit = String.fromCharCode(key);
      const glyphI = workingFont.charToGlyph(charLit);
      const scaleCaps = (x) => x * capsMult;
      transformGlyph(glyphI, scaleCaps, false, true);
    }
  }
  const upperAsc = ["A", "B", "D", "E", "F", "H", "I", "K", "L", "M", "N", "P", "R", "T", "U", "V", "W", "X", "Y", "Z"];
  const upperAscCodes = upperAsc.map((x) => String(x.charCodeAt(0)));
  const charHeightKeys = Object.keys(charMetricsObj.height);
  const heightAscArr = Object.values(charMetricsObj.height).filter((element, index) => upperAscCodes.includes(charHeightKeys[index]));
  if (heightAscArr.length >= 10) {
    const heightAscMedian0 = quantile(heightAscArr, 0.5);
    if (heightAscMedian0) {
      const charHeightA = round6(heightAscMedian0);
      const actJMult = Math.max(round6(charMetricsObj.height[74]) / charHeightA, 0);
      const fontJMetrics = workingFont.charToGlyph("J").getMetrics();
      const fontAMetrics2 = workingFont.charToGlyph("A").getMetrics();
      const fontJMult = Math.max((fontJMetrics.yMax - fontJMetrics.yMin) / (fontAMetrics2.yMax - fontAMetrics2.yMin), 1);
      const actFontJMult = actJMult / fontJMult;
      if (Math.abs(1 - actFontJMult) > 0.02) {
        const glyphI = workingFont.charToGlyph("J");
        const glyphIMetrics = glyphI.getMetrics();
        const yAdj = Math.round(glyphIMetrics.yMax - glyphIMetrics.yMax * actFontJMult);
        const transDescFunc = (x) => Math.round(x * actFontJMult + yAdj);
        transformGlyph(glyphI, transDescFunc, false, true);
      }
    }
  }
  const descAdjArr = ["g", "p", "q"];
  const fontAMetrics = workingFont.charToGlyph("a").getMetrics();
  const minA = fontAMetrics.yMin;
  for (let i = 0; i < descAdjArr.length; i++) {
    const charI = descAdjArr[i];
    const charICode = charI.charCodeAt(0);
    const actMult = Math.max(charMetricsObj.height[charICode] / charMetricsObj.height[97], 0);
    const metrics = workingFont.charToGlyph(charI).getMetrics();
    const fontMult = (metrics.yMax - metrics.yMin) / (fontAMetrics.yMax - fontAMetrics.yMin);
    const actFontMult = actMult / fontMult;
    const glyphHeight = metrics.yMax - metrics.yMin;
    const glyphLowerStemHeight = minA - metrics.yMin;
    const scaleYFactor = (actFontMult - 1) * (glyphHeight / glyphLowerStemHeight) + 1;
    if (Math.abs(actFontMult) > 1.02) {
      const glyphI = workingFont.charToGlyph(charI);
      for (let j = 0; j < glyphI.path.commands.length; j++) {
        const pointJ = glyphI.path.commands[j];
        if (pointJ.type === "M" || pointJ.type === "L" || pointJ.type === "C" || pointJ.type === "Q") {
          if (pointJ.y < minA) pointJ.y = Math.round((pointJ.y - minA) * scaleYFactor);
          if (pointJ.type === "C" || pointJ.type === "Q") {
            if (pointJ.y1 < minA) pointJ.y1 = Math.round((pointJ.y1 - minA) * scaleYFactor);
            if (pointJ.type === "C") {
              if (pointJ.y2 < minA) pointJ.y2 = Math.round((pointJ.y2 - minA) * scaleYFactor);
            }
          }
        }
      }
    }
  }
  workingFont.kerningPairs = isMonospace ? {} : calculateKerningPairs(workingFont, charMetricsObj, xHeight, style);
  workingFont.tables.name.postScriptName.en = `${workingFont.tables.name.postScriptName.en.replaceAll(/\s+/g, "")}-Opt`;
  return { fontData: workingFont.toArrayBuffer(), kerningPairs: workingFont.kerningPairs };
}
const OEM = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const PSM = {
  OSD_ONLY: "0",
  AUTO_OSD: "1",
  AUTO_ONLY: "2",
  AUTO: "3",
  SINGLE_COLUMN: "4",
  SINGLE_BLOCK_VERT_TEXT: "5",
  SINGLE_BLOCK: "6",
  SINGLE_LINE: "7",
  SINGLE_WORD: "8",
  CIRCLE_WORD: "9",
  SINGLE_CHAR: "10",
  SPARSE_TEXT: "11",
  SPARSE_TEXT_OSD: "12",
  RAW_LINE: "13"
};
const loadImage = async (image) => {
  if (typeof image === "string") return base64ToBytes(image);
  const data = image instanceof Blob ? await new Response(image).arrayBuffer() : image;
  return new Uint8Array(data);
};
class TessWorker {
  static #workerCounter = 0;
  static #jobCounter = 0;
  static PSM = PSM;
  static OEM = OEM;
  #id;
  #worker = null;
  #promises = {};
  #currentLangs;
  #currentOem;
  #currentConfig;
  #options;
  #logger;
  #errorHandler;
  #workerRes;
  constructor(langs = "eng", oem = OEM.LSTM_ONLY, _options = {}, config = {}) {
    const {
      logger,
      errorHandler,
      ...options
    } = {
      logger: () => {
      },
      ..._options
    };
    this.#id = `Worker-${TessWorker.#workerCounter}-${Math.random().toString(16).slice(3, 8)}`;
    this.#logger = logger;
    this.#errorHandler = errorHandler;
    this.#options = options;
    this.#currentLangs = typeof langs === "string" ? langs.split("+") : langs;
    this.#currentOem = oem;
    this.#currentConfig = config;
    TessWorker.#workerCounter += 1;
    this.#workerRes = this.#initWorker(langs, oem, config);
  }
  get id() {
    return this.#id;
  }
  get worker() {
    return this.#worker;
  }
  get ready() {
    return this.#workerRes;
  }
  static async create(langs = "eng", oem = OEM.LSTM_ONLY, options = {}, config = {}) {
    const instance = new TessWorker(langs, oem, options, config);
    await instance.ready;
    return instance;
  }
  async #initWorker(langs, oem, config) {
    let workerResReject;
    let workerResResolve;
    const workerRes = new Promise((resolve, reject) => {
      workerResResolve = resolve;
      workerResReject = reject;
    });
    const readyPromise = new Promise((resolve, reject) => {
      this.#promises["ready-ready"] = { resolve, reject, func: "ready" };
    });
    const workerError = (event) => {
      workerResReject(event.message);
    };
    if (typeof process === "undefined") {
      this.#worker = new Worker(new URL(
        /* @vite-ignore */
        "/build/assets/index-CISYwqcP.js",
        import.meta.url
      ), { type: "module" });
      this.#worker.onerror = workerError;
      this.#worker.onmessage = (event) => this.#messageHandler(event.data, workerResReject);
    } else {
      const { Worker: WorkerNode } = await import("./__vite-browser-external-Dhvy_jtL.js");
      this.#worker = new WorkerNode(new URL("/build/assets/index-DnZww9kt.js", import.meta.url));
      this.#worker.on("error", workerError);
      this.#worker.on("message", (data) => this.#messageHandler(data, workerResReject));
    }
    await readyPromise;
    try {
      await this.#loadInternal();
      await this.#loadLanguageInternal(langs);
      await this.#initializeInternal(langs, oem, config);
      workerResResolve(this);
    } catch (err) {
      workerResReject(err);
    }
    return workerRes;
  }
  #messageHandler(data, workerResReject) {
    const {
      jobId,
      status,
      action,
      data: responseData
    } = data;
    const promiseId = `${action}-${jobId}`;
    if (status === "resolve") {
      this.#promises[promiseId].resolve({ jobId, data: responseData });
      delete this.#promises[promiseId];
    } else if (status === "reject") {
      const pending = this.#promises[promiseId];
      delete this.#promises[promiseId];
      if (pending) pending.reject(responseData);
      if (action === "load") workerResReject(responseData);
      if (this.#errorHandler) {
        this.#errorHandler(responseData);
      } else if (!pending) {
        throw Error(responseData);
      }
    } else if (status === "progress") {
      this.#logger({ ...responseData, userJobId: jobId });
    }
  }
  #send(packet) {
    this.#worker.postMessage(packet);
  }
  #startJob(action, payload, jobId) {
    const id = jobId ?? `Job-${TessWorker.#jobCounter++}-${Math.random().toString(16).slice(3, 8)}`;
    return new Promise((resolve, reject) => {
      const promiseId = `${action}-${id}`;
      this.#promises[promiseId] = { resolve, reject };
      this.#send({
        workerId: this.#id,
        jobId: id,
        action,
        payload
      });
    });
  }
  #loadInternal(jobId) {
    return this.#startJob("load", {
      options: {
        vanillaEngine: this.#options.vanillaEngine,
        logging: this.#options.logging
      }
    }, jobId);
  }
  #loadLanguageInternal(langs, jobId) {
    return this.#startJob("loadLanguage", {
      langs,
      options: {
        langPath: this.#options.langPath,
        dataPath: this.#options.dataPath,
        cachePath: this.#options.cachePath,
        cacheMethod: this.#options.cacheMethod,
        gzip: this.#options.gzip,
        lstmOnly: [OEM.LSTM_ONLY, OEM.TESSERACT_LSTM_COMBINED].includes(this.#currentOem) && !this.#options.legacyLang
      }
    }, jobId);
  }
  #initializeInternal(langs, oem, config, jobId) {
    return this.#startJob("initialize", { langs, oem, config }, jobId);
  }
  reinitialize(langs = "eng", oem, config, jobId) {
    const _oem = oem || this.#currentOem;
    this.#currentOem = _oem;
    const _config = config || this.#currentConfig;
    this.#currentConfig = _config;
    const langsArr = typeof langs === "string" ? langs.split("+") : langs;
    const _langs = langsArr.filter((x) => !this.#currentLangs.includes(x));
    if (_langs.length > 0) {
      return this.#loadLanguageInternal(_langs, jobId).then(() => {
        this.#currentLangs.push(..._langs);
        return this.#initializeInternal(langs, _oem, _config, jobId);
      });
    }
    return this.#initializeInternal(langs, _oem, _config, jobId);
  }
  setParameters(params = {}, jobId) {
    return this.#startJob("setParameters", { params }, jobId);
  }
  /**
   * Reset what the engine accumulated from the pages it recognized.
   * Parameters, language and the loaded image are untouched.
   */
  resetState(jobId) {
    return this.#startJob("resetState", {}, jobId);
  }
  /**
   * @param {ImageLike} image
   * @param {Partial<RecognizeOptions>} opts
   * @param {Partial<OutputFormats>} output
   * @param {string} [jobId]
   * @returns {Promise<RecognizeResult>}
   */
  async recognize(image, opts = {}, output = {
    blocks: true,
    text: true
  }, jobId) {
    return this.#startJob("recognize", { image: await loadImage(image), options: opts, output }, jobId);
  }
  async terminate() {
    if (this.#worker !== null) {
      await this.#worker.terminate();
      this.#worker = null;
    }
  }
}
const parentPort = typeof process === "undefined" ? globalThis : (await import("./__vite-browser-external-Dhvy_jtL.js")).parentPort;
if (!parentPort) throw new Error("This file must be run in a worker");
const defaultConfigsVanilla = {
  tessedit_pageseg_mode: TessWorker.PSM.AUTO
};
const defaultConfigs = {
  tessedit_pageseg_mode: TessWorker.PSM.AUTO,
  // This is virtually always a false positive (usually "I").
  tessedit_char_blacklist: "|",
  // This option disables an undesirable behavior where Tesseract categorizes blobs *of any size* as noise,
  // simply because they are too rectangular.  This option should always be enabled outside of debugging purposes.
  textord_noise_area_ratio: "1",
  // Table detection appears to interfere with the layout analysis of some documents with multi-column layouts,
  // causing columns to be combined into a single line.  This should be investigated in more detail,
  // but disabling as it does not seem to improve results even when the input document is a table.
  textord_tabfind_find_tables: "0"
};
const largeCache = await (async () => {
  if (typeof process === "undefined") {
    const nav = globalThis.navigator;
    const mobile = nav?.userAgentData?.mobile === true || /Mobi|Android|iPhone|iPad/i.test(nav?.userAgent || "");
    return !mobile && (nav?.deviceMemory || 0) >= 8;
  }
  const os = await import("./__vite-browser-external-Dhvy_jtL.js");
  return os.totalmem() >= 8 * 1024 ** 3;
})();
if (largeCache) defaultConfigs.classify_static_cache_mb = "8";
const defaultInitConfigsVanilla = {};
const defaultInitConfigs = {
  // load_system_dawg: '0',
  load_freq_dawg: "0"
  // load_unambig_dawg: '0',
  // load_punc_dawg: '0',
  // load_number_dawg: '0',
  // load_bigram_dawg: '0',
};
let oemCurrent = 2;
let langArrCurrent = ["eng"];
let vanillaMode_ = false;
const tessOptions = typeof process === "undefined" ? {
  legacyLang: true,
  workerBlobURL: false
} : { legacyLang: true };
let worker;
let lastDocId = null;
const workerFonts = /* @__PURE__ */ new Map();
const getWorkerFonts = (docId) => {
  const key = docId ?? 0;
  let docFonts = workerFonts.get(key);
  if (!docFonts) {
    docFonts = new DocFonts();
    docFonts.id = key;
    workerFonts.set(key, docFonts);
  }
  return docFonts;
};
const fontDependentFuncs = /* @__PURE__ */ new Set([
  "compareOCRPageImp",
  "evalPageBase",
  "evalWords",
  "evalPageFont",
  "renderPageStaticImp",
  "convertDocDocx"
]);
const reinitialize = async ({
  langs,
  oem,
  vanillaMode,
  config,
  langPath
}) => {
  if (langPath !== void 0 && langPath !== null) tessOptions.langPath = langPath;
  const langArr = typeof langs === "string" ? langs.split("+") : langs;
  const changeLang = langs && JSON.stringify(langArr.sort()) !== JSON.stringify(langArrCurrent.sort());
  const changeOEM = oem !== null && oem !== void 0 && oem !== oemCurrent;
  const changeVanilla = vanillaMode !== null && vanillaMode !== void 0 && vanillaMode !== vanillaMode_;
  if (!changeLang && !changeOEM && !changeVanilla && worker) {
    if (config && Object.keys(config).length > 0) {
      await worker.setParameters(config);
    }
    return;
  }
  const langArrNext = changeLang ? langArr : langArrCurrent;
  const oemNext = changeOEM ? oem : oemCurrent;
  const vanillaNext = changeVanilla ? vanillaMode : vanillaMode_;
  const initConfigs = vanillaNext ? structuredClone(defaultInitConfigsVanilla) : structuredClone(defaultInitConfigs);
  const defaultConfigsI = vanillaNext ? defaultConfigsVanilla : defaultConfigs;
  for (const [key, value] of Object.entries(defaultConfigsI)) {
    initConfigs[key] = value;
  }
  if (config) {
    for (const [key, value] of Object.entries(config)) {
      initConfigs[key] = value;
    }
  }
  if (changeVanilla || !worker) {
    tessOptions.vanillaEngine = !!vanillaNext;
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    worker = await TessWorker.create(langArrNext, oemNext, tessOptions, initConfigs);
  } else {
    await worker.reinitialize(langArrNext, oemNext, initConfigs);
  }
  langArrCurrent = langArrNext;
  oemCurrent = oemNext;
  vanillaMode_ = vanillaNext;
};
const recognizeAndConvert = async ({
  image,
  options,
  output,
  n,
  pageDims,
  knownAngle = null,
  langs = null,
  vanillaMode = false,
  docId = null
}) => {
  if (langs) {
    await reinitialize({
      langs,
      oem: null,
      vanillaMode,
      config: {}
    });
  }
  if (!worker) throw new Error("Worker not initialized");
  if (docId !== lastDocId) {
    await worker.resetState();
    lastDocId = docId;
  }
  const startTime = performance.now();
  const res = await worker.recognize(image, options, output);
  const recognize2 = res.data;
  const angle = knownAngle === null || knownAngle === void 0 ? (recognize2.rotateRadians || 0) * (180 / Math.PI) * -1 : knownAngle;
  if (!recognize2.blocks) throw new Error("No OCR blocks returned from recognition.");
  const page = vanillaMode_ ? await convertPageBlocksVanilla({
    ocrBlocks: (
      /** @type {TessBlockVanilla[]} */
      recognize2.blocks
    ),
    n,
    pageDims,
    rotateAngle: angle,
    legacy: !!options.legacy,
    upscale: recognize2.upscale
  }) : await convertPageBlocks({
    ocrBlocks: (
      /** @type {TessBlock[]} */
      recognize2.blocks
    ),
    n,
    pageDims,
    rotateAngle: angle,
    upscale: recognize2.upscale
  });
  delete recognize2.blocks;
  return { recognize: recognize2, convert: { page }, recognitionTime: performance.now() - startTime };
};
const recognize = async ({ image, options, output }) => {
  if (!worker) throw new Error("Worker not initialized");
  const res1 = await worker.recognize(image, options, output);
  return res1.data;
};
async function loadFontsWorker({
  src,
  opt,
  docId,
  kind
}) {
  const fonts = await loadFontsFromSource(src, opt, docId);
  if (kind === "opt" || kind === void 0 && opt) {
    const docFonts = getWorkerFonts(docId);
    docFonts.opt = docFonts.opt ? Object.assign(docFonts.opt, fonts) : fonts;
  } else if (kind === "doc") {
    const docFonts = getWorkerFonts(docId);
    docFonts.doc = docFonts.doc ? Object.assign(docFonts.doc, fonts) : fonts;
  } else {
    GlobalFonts.raw = GlobalFonts.raw ? Object.assign(GlobalFonts.raw, fonts) : fonts;
  }
  return true;
}
async function updateFontContWorker({
  docId,
  rawMetrics,
  optMetrics,
  defaultFontName,
  sansDefaultName,
  serifDefaultName,
  enableOpt,
  forceOpt
}) {
  const docFonts = getWorkerFonts(docId);
  if (sansDefaultName) docFonts.state.sansDefaultName = sansDefaultName;
  if (serifDefaultName) docFonts.state.serifDefaultName = serifDefaultName;
  if (defaultFontName) docFonts.state.defaultFontName = defaultFontName;
  if (rawMetrics) docFonts.rawMetrics = rawMetrics;
  if (optMetrics) docFonts.optMetrics = optMetrics;
  if (enableOpt === true || enableOpt === false) docFonts.state.enableOpt = enableOpt;
  if (forceOpt === true || forceOpt === false) docFonts.state.forceOpt = forceOpt;
}
async function dropFontsWorker({ docId }) {
  const key = docId ?? 0;
  workerFonts.delete(key);
  ca.unregisterFontsMatching((name) => name.endsWith(` Opt d${key}`));
  unregisterFontFacesMatching((family) => family.endsWith(` Opt d${key}`));
  return true;
}
async function compareOCRPageImpWrap(args) {
  args.options.tessWorker = worker;
  return await compareOCRPageImp(args);
}
const handleMessage = async (data) => {
  const func = data[0];
  const args = data[1];
  const id = data[2];
  if (fontDependentFuncs.has(func)) setActiveDocFonts(workerFonts.get(args?.docId ?? 0) || new DocFonts());
  ({
    // Convert page functions
    convertPageAbbyy,
    convertPageAlto,
    convertPageHocr,
    convertPageStext,
    convertDocTextract,
    convertDocAzureDocIntel,
    convertDocGoogleDocAI,
    convertPageGoogleVision,
    convertPageBlocks,
    convertPageText,
    convertDocDocx,
    convertDocMd,
    // Optimize font functions
    optimizeFont,
    // OCR comparison/evaluation functions
    evalPageFont,
    evalPageBase,
    evalWords,
    compareOCRPageImp: compareOCRPageImpWrap,
    renderPageStaticImp,
    // Recognition
    reinitialize,
    recognize,
    recognizeAndConvert,
    // Change state of worker
    loadFontsWorker,
    updateFontContWorker,
    dropFontsWorker
  })[func](args).then((x) => parentPort.postMessage({ data: x, id, status: "resolve" })).catch((err) => parentPort.postMessage({ data: err, id, status: "reject" }));
};
if (typeof process === "undefined") {
  onmessage = (event) => handleMessage(event.data);
} else {
  parentPort.on("message", handleMessage);
}
parentPort.postMessage({ data: "ready", id: 0, status: "resolve" });
//# sourceMappingURL=generalWorker-CR8Y5lxA.js.map
