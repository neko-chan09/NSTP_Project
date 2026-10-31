var arrayBufferToBase64 = (arrayBuffer) => {
  let base64 = "";
  const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const { byteLength } = bytes;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;
  let a;
  let b;
  let c;
  let d;
  let chunk;
  for (let i = 0; i < mainLength; i += 3) {
    chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += `${encodings[a] + encodings[b]}==`;
  } else if (byteRemainder === 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += `${encodings[a] + encodings[b] + encodings[c]}=`;
  }
  return base64;
};
const imageType = {
  COLOR: 0,
  GREY: 1,
  BINARY: 2
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
const defaultParams = {
  tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
  tessedit_char_whitelist: ""
};
const defaultOutput = {
  text: true,
  blocks: false,
  layoutBlocks: false,
  hocr: false,
  tsv: false,
  box: false,
  unlv: false,
  osd: false,
  imageColor: false,
  imageGrey: false,
  imageBinary: false,
  debug: false
};
const isURL = (string) => {
  const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
  const localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/;
  const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;
  if (typeof string !== "string") {
    return false;
  }
  const match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }
  const everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }
  if (localhostDomainRE.test(everythingAfterProtocol) || nonLocalhostDomainRE.test(everythingAfterProtocol)) {
    return true;
  }
  return false;
};
const relaxedSimd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 15, 1, 13, 0, 65, 1, 253, 15, 65, 2, 253, 15, 253, 128, 2, 11]));
const simd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
const cache = {
  readCache: async (...args) => {
    let readCacheImp;
    if (typeof process === "undefined") {
      readCacheImp = (await import("./cache-browser-C9gTHnQM.js")).readCache;
    } else {
      readCacheImp = (await import("./cache-node-xVj4SxFS.js")).readCache;
    }
    return readCacheImp(...args);
  },
  writeCache: async (...args) => {
    let writeCacheImp;
    if (typeof process === "undefined") {
      writeCacheImp = (await import("./cache-browser-C9gTHnQM.js")).writeCache;
    } else {
      writeCacheImp = (await import("./cache-node-xVj4SxFS.js")).writeCache;
    }
    return writeCacheImp(...args);
  },
  deleteCache: async (...args) => {
    let deleteCacheImp;
    if (typeof process === "undefined") {
      deleteCacheImp = (await import("./cache-browser-C9gTHnQM.js")).deleteCache;
    } else {
      deleteCacheImp = (await import("./cache-node-xVj4SxFS.js")).deleteCache;
    }
    return deleteCacheImp(...args);
  }
};
const setImage = (TessModule2, api2, image, angle = 0, upscale = false) => {
  const exif = parseInt(image.slice(0, 500).join(" ").match(/1 18 0 3 0 0 0 1 0 (\d)/)?.[1], 10) || 1;
  TessModule2.FS.writeFile("/input", image);
  const res = api2.SetImageFile(exif, angle, upscale);
  if (res === 1) throw Error("Error attempting to read image.");
};
async function gunzip(data) {
  const ds = new DecompressionStream("gzip");
  const blob = new Blob([data]);
  const decompressedStream = blob.stream().pipeThrough(ds);
  const decompressedBlob = await new Response(decompressedStream).blob();
  const arrayBuffer = await decompressedBlob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
const parentPort = typeof process === "undefined" ? globalThis : (await import("./__vite-browser-external-CvHwus-K.js")).parentPort;
if (!parentPort) throw new Error("This file must be run in a worker");
let TesseractCore = null;
let coreVariant = null;
const getCore = async (vanillaEngine, res) => {
  if (TesseractCore === null) {
    const statusText = "loading tesseract core";
    const simdSupport = await simd();
    const relaxedSimdSupport = await relaxedSimd();
    res.progress({ status: statusText, progress: 0 });
    if (vanillaEngine) {
      if (relaxedSimdSupport) {
        TesseractCore = (await import("./tesseract-core-relaxedsimd-CRPXY3LP.js")).default;
        coreVariant = "vanilla-relaxedsimd";
      } else if (simdSupport) {
        TesseractCore = (await import("./tesseract-core-simd-BHO5btJs.js")).default;
        coreVariant = "vanilla-simd";
      } else {
        throw Error("This runtime is not supported (WASM SIMD required).");
      }
    } else if (relaxedSimdSupport) {
      TesseractCore = (await import("./tesseract-core-relaxedsimd-Bpc0YjVN.js")).default;
      coreVariant = "relaxedsimd";
    } else if (simdSupport) {
      TesseractCore = (await import("./tesseract-core-simd-BhhAziBk.js")).default;
      coreVariant = "simd";
    } else {
      throw Error("This runtime is not supported (WASM SIMD required).");
    }
    res.progress({ status: statusText, progress: 1 });
  }
  return TesseractCore;
};
const deindent = (html) => {
  const lines = html.split("\n");
  if (lines[0].substring(0, 2) === "  ") {
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].substring(0, 2) === "  ") {
        lines[i] = lines[i].slice(2);
      }
    }
  }
  return lines.join("\n");
};
const dump = (TessModule2, api2, output, options) => {
  const enumToString = (value, prefix) => Object.keys(TessModule2).filter((e) => e.startsWith(`${prefix}_`) && TessModule2[e] === value).map((e) => e.slice(prefix.length + 1))[0];
  const getImage = (type) => {
    api2.WriteImage(type, "/image.png");
    const pngBuffer = TessModule2.FS.readFile("/image.png");
    const pngStr = `data:image/png;base64,${arrayBufferToBase64(pngBuffer.buffer)}`;
    TessModule2.FS.unlink("/image.png");
    return pngStr;
  };
  return {
    text: output.text ? api2.GetUTF8Text() : null,
    hocr: output.hocr ? deindent(api2.GetHOCRText()) : null,
    tsv: output.tsv ? api2.GetTSVText() : null,
    box: output.box ? api2.GetBoxText() : null,
    unlv: output.unlv ? api2.GetUNLVText() : null,
    osd: output.osd ? api2.GetOsdText() : null,
    imageColor: output.imageColor ? getImage(imageType.COLOR) : null,
    imageGrey: output.imageGrey ? getImage(imageType.GREY) : null,
    imageBinary: output.imageBinary ? getImage(imageType.BINARY) : null,
    confidence: !options.skipRecognition ? api2.MeanTextConf() : null,
    blocks: output.blocks && !options.skipRecognition ? JSON.parse(api2.GetJSONText(0)).blocks : null,
    psm: enumToString(api2.GetPageSegMode(), "PSM"),
    oem: enumToString(api2.oem(), "OEM"),
    version: api2.Version(),
    debug: output.debug ? TessModule2.FS.readFile("/debugInternal.txt", { encoding: "utf8", flags: "a+" }) : null,
    debugVis: output.debugVis ? TessModule2.FS.readFile("/debugVisInternal.txt", { encoding: "utf8", flags: "a+" }) : null
  };
};
let TessModule;
let api = null;
let latestJob;
let params = defaultParams;
const langEntries = /* @__PURE__ */ new Map();
const langFileBuffers = /* @__PURE__ */ new Map();
let loadLanguageOptionsWorker;
let dataFromCache = false;
const load = async ({ workerId, jobId, payload: { options: { vanillaEngine } } }, res) => {
  const statusText = "initializing tesseract";
  if (!TessModule) {
    const Core = await getCore(vanillaEngine, res);
    res.progress({ workerId, status: statusText, progress: 0 });
    Core({
      TesseractProgress(percent) {
        latestJob.progress({
          workerId,
          jobId,
          status: "recognizing text",
          progress: Math.max(0, (percent - 30) / 70)
        });
      }
    }).then((tessModule) => {
      TessModule = tessModule;
      res.progress({ workerId, status: statusText, progress: 1 });
      res.resolve({ loaded: true });
    });
  } else {
    res.resolve({ loaded: true });
  }
};
const loadLanguage = async ({
  workerId,
  payload: {
    langs,
    options: {
      langPath,
      dataPath,
      cachePath,
      cacheMethod,
      gzip = true,
      lstmOnly
    }
  }
}, res) => {
  loadLanguageOptionsWorker = {
    langPath,
    dataPath,
    cachePath,
    cacheMethod,
    gzip,
    lstmOnly
  };
  const statusText = "loading language traineddata";
  const langsArr = typeof langs === "string" ? langs.split("+") : langs;
  let progress = 0;
  const loadAndGunzipFile = async (_lang) => {
    const lang = typeof _lang === "string" ? _lang : _lang.code;
    langEntries.set(lang, _lang);
    const readCache = ["refresh", "none"].includes(cacheMethod) ? () => Promise.resolve() : cache.readCache;
    let data = null;
    let newData = false;
    try {
      const _data = await readCache(`${cachePath || "."}/${lang}.traineddata`);
      if (typeof _data !== "undefined") {
        data = _data;
        dataFromCache = true;
      } else {
        throw Error("Not found in cache");
      }
    } catch (e) {
      newData = true;
      if (typeof _lang === "string") {
        let path = null;
        const langPathDownload = langPath || (lstmOnly ? `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}/4.0.0_best_int` : `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}/4.0.0`);
        if (typeof process === "undefined" || isURL(langPathDownload) || langPathDownload.startsWith("moz-extension://") || langPathDownload.startsWith("chrome-extension://") || langPathDownload.startsWith("file://")) {
          path = langPathDownload.replace(/\/$/, "");
        }
        if (path !== null) {
          const fetchUrl = `${path}/${lang}.traineddata${gzip ? ".gz" : ""}`;
          const resp = await fetch(fetchUrl);
          if (!resp.ok) {
            throw Error(`Network error while fetching ${fetchUrl}. Response code: ${resp.status}`);
          }
          if (/^text\/html\b/i.test(resp.headers.get("content-type") || "")) {
            throw Error(`${fetchUrl} returned an HTML page, not language data`);
          }
          data = new Uint8Array(await resp.arrayBuffer());
        } else {
          data = await cache.readCache(`${langPathDownload}/${lang}.traineddata${gzip ? ".gz" : ""}`);
        }
      } else {
        data = _lang.data;
      }
    }
    progress += 0.5 / langsArr.length;
    if (res) res.progress({ workerId, status: statusText, progress });
    const isGzip = data[0] === 31 && data[1] === 139 || data[1] === 31 && data[0] === 139;
    if (isGzip) {
      data = await gunzip(data);
    }
    if (TessModule) {
      if (dataPath) {
        try {
          TessModule.FS.mkdir(dataPath);
        } catch (err) {
          if (res) res.reject(err.toString());
        }
      }
      const own = (typeof _lang === "string" || data !== _lang.data) && data.byteOffset === 0 && data.byteLength === data.buffer.byteLength;
      TessModule.FS.writeFile(`${dataPath || "."}/${lang}.traineddata`, data, { canOwn: own });
      if (own) langFileBuffers.set(lang, data.buffer);
    }
    if (newData && ["write", "refresh", void 0].includes(cacheMethod)) {
      try {
        await cache.writeCache(`${cachePath || "."}/${lang}.traineddata`, data);
      } catch (err) {
      }
    }
    progress += 0.5 / langsArr.length;
    if (Math.round(progress * 100) === 100) progress = 1;
    if (res) res.progress({ workerId, status: statusText, progress });
  };
  if (res) res.progress({ workerId, status: statusText, progress: 0 });
  try {
    await Promise.all(langsArr.map(loadAndGunzipFile));
    if (res) res.resolve(langs);
  } catch (err) {
    if (!res) throw err;
    res.reject(err.toString());
  }
};
const setParameters = async ({ payload: { params: _params } }, res) => {
  const initParamNames = [
    "ambigs_debug_level",
    "user_words_suffix",
    "user_patterns_suffix",
    "user_patterns_suffix",
    "load_system_dawg",
    "load_freq_dawg",
    "load_unambig_dawg",
    "load_punc_dawg",
    "load_number_dawg",
    "load_bigram_dawg",
    "tessedit_ocr_engine_mode",
    "tessedit_init_config_only",
    "language_model_ngram_on",
    "language_model_use_sigmoidal_certainty"
  ];
  const initParamStr = Object.keys(_params).filter((k) => initParamNames.includes(k)).join(", ");
  if (initParamStr.length > 0) console.log(`Attempted to set parameters that can only be set during initialization: ${initParamStr}`);
  Object.keys(_params).filter((k) => !k.startsWith("tessjs_")).forEach((key) => {
    api.SetVariable(key, _params[key]);
  });
  params = { ...params, ..._params };
  if (typeof res !== "undefined") {
    res.resolve(params);
  }
};
const initialize = async ({
  workerId,
  payload: { langs: _langs, oem, config }
}, res) => {
  const langs = typeof _langs === "string" ? _langs : _langs.map((l) => typeof l === "string" ? l : l.data).join("+");
  const statusText = "initializing api";
  try {
    res.progress({
      workerId,
      status: statusText,
      progress: 0
    });
    if (api !== null) {
      TessModule.dropGpu();
      api.End();
    }
    let configFile;
    let configStr;
    if (config && typeof config === "object" && Object.keys(config).length > 0) {
      configStr = JSON.stringify(config).replace(/,/g, "\n").replace(/:/g, " ").replace(/["'{}]/g, "");
    } else if (config && typeof config === "string") {
      configStr = config;
    }
    if (typeof configStr === "string") {
      configFile = "/config";
      TessModule.FS.writeFile(configFile, configStr);
    }
    const dataPath = loadLanguageOptionsWorker?.dataPath;
    const langsArr = langs.split("+");
    if (loadLanguageOptionsWorker) {
      const missing = langsArr.filter((lang) => {
        try {
          TessModule.FS.stat(`${dataPath || "."}/${lang}.traineddata`);
          return false;
        } catch {
          return true;
        }
      });
      if (missing.length > 0) {
        await loadLanguage({ workerId, payload: { langs: missing.map((lang) => langEntries.get(lang) ?? lang), options: loadLanguageOptionsWorker } });
      }
    }
    api = new TessModule.TessBaseAPI();
    let status = api.Init(null, langs, oem, configFile);
    if (status === -1) {
      if (["write", "refresh", void 0].includes(loadLanguageOptionsWorker.cacheMethod)) {
        const delCachePromise = langsArr.map((lang) => cache.deleteCache(`${loadLanguageOptionsWorker.cachePath || "."}/${lang}.traineddata`));
        await Promise.all(delCachePromise);
        const debugStr = TessModule.FS.readFile("/debugDev.txt", { encoding: "utf8", flags: "a+" });
        if (dataFromCache && /components are not present/.test(debugStr)) {
          await loadLanguage({ workerId, payload: { langs: langsArr.map((lang) => langEntries.get(lang) ?? lang), options: loadLanguageOptionsWorker } });
          status = api.Init(null, langs, oem, configFile);
          if (status === -1) {
            const delCachePromise2 = langsArr.map((lang) => cache.deleteCache(`${loadLanguageOptionsWorker.cachePath || "."}/${lang}.traineddata`));
            await Promise.all(delCachePromise2);
          }
        }
      }
    }
    if (status !== -1) {
      for (const lang of langEntries.keys()) {
        try {
          TessModule.FS.unlink(`${dataPath || "."}/${lang}.traineddata`);
        } catch {
        }
        const buffer = langFileBuffers.get(lang);
        if (!buffer) continue;
        langFileBuffers.delete(lang);
        try {
          if (typeof buffer.transfer === "function") {
            buffer.transfer(0);
          } else {
            structuredClone(buffer, { transfer: [buffer] });
          }
        } catch {
        }
      }
    }
    if (status === -1) {
      res.reject("initialization failed");
      return;
    }
    res.progress({
      workerId,
      status: statusText,
      progress: 1
    });
    res.resolve();
  } catch (err) {
    res.reject(err.toString());
  }
};
const processOutput = (output) => {
  const workingOutput = JSON.parse(JSON.stringify(defaultOutput));
  if (params.tessjs_create_box === "1") workingOutput.box = true;
  if (params.tessjs_create_hocr === "1") workingOutput.hocr = true;
  if (params.tessjs_create_osd === "1") workingOutput.osd = true;
  if (params.tessjs_create_tsv === "1") workingOutput.tsv = true;
  if (params.tessjs_create_unlv === "1") workingOutput.unlv = true;
  const nonRecOutputs = ["imageColor", "imageGrey", "imageBinary", "debug", "debugVis"];
  let recOutputCount = 0;
  for (const prop of Object.keys(output)) {
    workingOutput[prop] = output[prop];
  }
  for (const prop of Object.keys(workingOutput)) {
    if (workingOutput[prop]) {
      if (!nonRecOutputs.includes(prop)) {
        recOutputCount += 1;
      }
    }
  }
  const skipRecognition = recOutputCount === 0;
  return { workingOutput, skipRecognition };
};
const tessjsOptions = ["rectangle", "rotateAuto", "rotateRadians", "lstm", "legacy", "upscale", "gpu"];
const recognize = async ({
  payload: {
    image,
    options,
    output
  }
}, res) => {
  try {
    const lstm = options.lstm || false;
    const legacy = options.legacy || false;
    const upscale = options.upscale || false;
    const optionsTess = {};
    if (typeof options === "object" && Object.keys(options).length > 0) {
      for (const param of Object.keys(options)) {
        if (!param.startsWith("tessjs_") && !tessjsOptions.includes(param)) {
          optionsTess[param] = options[param];
        }
      }
    }
    if (output.debug) {
      optionsTess.debug_file = "/debugInternal.txt";
      TessModule.FS.writeFile("/debugInternal.txt", "");
    }
    if (output.debugVis) {
      optionsTess.vis_file = "/debugVisInternal.txt";
      optionsTess.textord_tabfind_show_blocks = "1";
      optionsTess.textord_tabfind_show_strokewidths = "1";
      optionsTess.textord_tabfind_show_initialtabs = "1";
      optionsTess.textord_tabfind_show_images = "1";
      optionsTess.textord_tabfind_show_reject_blobs = "1";
      optionsTess.textord_tabfind_show_finaltabs = "1";
      optionsTess.textord_tabfind_show_columns = "1";
      optionsTess.textord_tabfind_show_initial_partitions = "1";
      optionsTess.textord_show_tables = "1";
      optionsTess.textord_tabfind_show_partitions = "1";
      optionsTess.textord_tabfind_show_vlines_scrollview = "1";
      optionsTess.tessedit_dump_pageseg_images = "1";
      optionsTess.textord_debug_nontext = "1";
      optionsTess.textord_show_word_blobs = "1";
      TessModule.FS.writeFile("/debugVisInternal.txt", "");
    }
    if (Object.keys(optionsTess).length > 0) {
      api.SaveParameters();
      for (const prop of Object.keys(optionsTess)) {
        api.SetVariable(prop, optionsTess[prop]);
      }
    }
    const { workingOutput, skipRecognition } = processOutput(output);
    let rotateRadiansFinal;
    let findLinesMs = 0;
    let upscaleFinal = upscale;
    if (options.rotateAuto) {
      const psmInit = api.GetPageSegMode();
      let psmEdit = false;
      if (![PSM.AUTO, PSM.AUTO_ONLY, PSM.OSD].includes(String(psmInit))) {
        psmEdit = true;
        api.SetVariable("tessedit_pageseg_mode", String(PSM.AUTO));
      }
      setImage(TessModule, api, image, 0, upscale);
      const findLinesStart = performance.now();
      api.FindLines();
      findLinesMs = performance.now() - findLinesStart;
      const rotateRadiansCalc = api.GetGradient();
      const estimatedResolution = api.GetEstimatedResolution();
      upscaleFinal = estimatedResolution < 200 ? true : upscale;
      const upscaleEdit = upscaleFinal !== upscale;
      if (psmEdit) {
        api.SetVariable("tessedit_pageseg_mode", String(psmInit));
      }
      if (Math.abs(rotateRadiansCalc) >= 5e-3) {
        rotateRadiansFinal = rotateRadiansCalc;
        if (output.debugVis) TessModule.FS.writeFile("/debugVisInternal.txt", "");
        setImage(TessModule, api, image, rotateRadiansFinal, upscaleFinal);
      } else {
        if (psmEdit || upscaleEdit) {
          if (output.debugVis) TessModule.FS.writeFile("/debugVisInternal.txt", "");
          setImage(TessModule, api, image, 0, upscaleFinal);
        }
        rotateRadiansFinal = 0;
      }
    } else {
      rotateRadiansFinal = options.rotateRadians || 0;
      setImage(TessModule, api, image, rotateRadiansFinal, upscale);
    }
    const rec = options.rectangle;
    if (typeof rec === "object") {
      api.SetRectangle(rec.left, rec.top, rec.width, rec.height);
    }
    let coreTiming = null;
    let gpu = false;
    let gpuReason = null;
    if (!skipRecognition) {
      const page = await TessModule.recognizePage(api, legacy, lstm, options.gpu);
      gpu = page.gpu;
      gpuReason = page.reason;
      if (typeof api.GetRecognitionTimings === "function") coreTiming = JSON.parse(api.GetRecognitionTimings() || "null");
    }
    const dumpStart = performance.now();
    const result = dump(TessModule, api, workingOutput, { skipRecognition });
    const dumpMs = performance.now() - dumpStart;
    result.rotateRadians = rotateRadiansFinal;
    result.upscale = upscaleFinal;
    result.timing = {
      1: findLinesMs + (coreTiming ? coreTiming[1] : 0),
      2: coreTiming ? coreTiming[2] : null,
      3: coreTiming ? coreTiming[3] : null,
      4: (coreTiming ? coreTiming[4] : 0) + dumpMs
    };
    result.dev = {
      core: coreVariant,
      kernel: api.GetStringVariable("dotproduct"),
      gpu,
      gpuReason
    };
    if (output.debug) TessModule.FS.unlink("/debugInternal.txt");
    if (output.debugVis) TessModule.FS.unlink("/debugVisInternal.txt");
    if (Object.keys(optionsTess).length > 0) {
      api.RestoreParameters();
    }
    res.resolve(result);
  } catch (err) {
    res.reject(err.toString());
  }
};
const terminate = async (_, res) => {
  try {
    if (api !== null) {
      TessModule.dropGpu();
      api.End();
    }
    res.resolve({ terminated: true });
  } catch (err) {
    res.reject(err.toString());
  }
};
const resetState = async (_, res) => {
  try {
    if (api !== null) {
      api.ClearAdaptiveClassifier();
    }
    res.resolve();
  } catch (err) {
    res.reject(err.toString());
  }
};
const dispatchHandlers = (packet, send) => {
  const res = (status, data) => {
    const packetRes = {
      jobId: packet.jobId,
      workerId: packet.workerId,
      action: packet.action
    };
    send({
      ...packetRes,
      status,
      data
    });
  };
  res.resolve = res.bind(void 0, "resolve");
  res.reject = res.bind(void 0, "reject");
  res.progress = res.bind(void 0, "progress");
  latestJob = res;
  ({
    load,
    loadLanguage,
    initialize,
    setParameters,
    resetState,
    recognize,
    terminate
  })[packet.action](packet, res).catch((err) => res.reject(err.toString()));
};
if (typeof process === "undefined") {
  globalThis.addEventListener("message", ({ data }) => {
    dispatchHandlers(data, (obj) => postMessage(obj));
  });
} else {
  parentPort.on("message", (packet) => {
    dispatchHandlers(packet, (obj) => parentPort.postMessage(obj));
  });
}
parentPort.postMessage({
  data: "ready",
  jobId: "ready",
  status: "resolve",
  action: "ready"
});
//# sourceMappingURL=index-CISYwqcP.js.map
