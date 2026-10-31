import { b0 as ArithmeticDecoder } from "./base14Substitution-CpDFdGXj.js";
function decodeJPX(data, reduceLevels = 0, applyInternalPalette = true) {
  const jpx = new JpxImage();
  try {
    jpx.parse(data, reduceLevels);
  } catch (_e) {
    console.warn("[decodeJPX] Failed to parse JPEG 2000 image data — skipping corrupt image.");
    return null;
  }
  if (!jpx.tiles) {
    console.warn("[decodeJPX] JPEG 2000 image produced no tiles — skipping corrupt image.");
    return null;
  }
  const width = jpx.width;
  const height = jpx.height;
  const components = jpx.componentsCount;
  const pixelData = new Uint8ClampedArray(width * height * components);
  for (let t = 0; t < jpx.tiles.length; t++) {
    const tile = jpx.tiles[t];
    const tileLeft = tile.left;
    const tileTop = tile.top;
    const tileWidth = tile.width;
    const tileItems = tile.items;
    const rowBytes = tileWidth * components;
    for (let y = 0; y < tile.height; y++) {
      const destRow = (tileTop + y) * width * components;
      const srcRow = y * rowBytes;
      for (let x = 0; x < rowBytes; x++) {
        pixelData[destRow + tileLeft * components + x] = tileItems[srcRow + x];
      }
    }
  }
  if (jpx.palette && applyInternalPalette) {
    const { columns, lut } = jpx.palette;
    const mapping = jpx.componentMapping || Array.from({ length: columns }, (_, c) => ({ cmp: 0, mtyp: 1, pcol: c }));
    const outChannels = mapping.length;
    const idxPrecision = jpx.componentsPrecision ? jpx.componentsPrecision[0] : 8;
    const idxShift = idxPrecision < 8 ? 8 - idxPrecision : 0;
    const pixelCount = width * height;
    const out = new Uint8ClampedArray(pixelCount * outChannels);
    for (let i = 0; i < pixelCount; i++) {
      for (let c = 0; c < outChannels; c++) {
        const m = mapping[c];
        const sample = pixelData[i * components + m.cmp];
        if (m.mtyp === 1) {
          const index = idxShift ? sample >> idxShift : sample;
          out[i * outChannels + c] = lut[index * columns + m.pcol];
        } else {
          out[i * outChannels + c] = sample;
        }
      }
    }
    return {
      width,
      height,
      components: outChannels,
      pixelData: out,
      precision: new Array(outChannels).fill(8)
    };
  }
  return {
    width,
    height,
    components,
    pixelData,
    precision: jpx.componentsPrecision
  };
}
function warn() {
}
function log2(x) {
  if (x <= 0) return 0;
  return Math.ceil(Math.log2(x));
}
function readUint16(data, offset) {
  return data[offset] << 8 | data[offset + 1];
}
function readUint32(data, offset) {
  return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
}
class JpxError extends Error {
  constructor(msg) {
    super(`JPX error: ${msg}`);
  }
}
const SubbandsGainLog2 = {
  LL: 0,
  LH: 1,
  HL: 1,
  HH: 2
};
class JpxImage {
  constructor() {
    this.failOnCorruptedImage = false;
  }
  parse(data, reduceLevels = 0) {
    const head = readUint16(data, 0);
    if (head === 65359) {
      this.parseCodestream(data, 0, data.length, reduceLevels);
      return;
    }
    let position = 0;
    const length = data.length;
    while (position < length) {
      let headerSize = 8;
      let lbox = readUint32(data, position);
      const tbox = readUint32(data, position + 4);
      position += headerSize;
      if (lbox === 1) {
        lbox = readUint32(data, position) * 4294967296 + readUint32(data, position + 4);
        position += 8;
        headerSize += 8;
      }
      if (lbox === 0) {
        lbox = length - position + headerSize;
      }
      if (lbox < headerSize) {
        throw new JpxError("Invalid box field size");
      }
      const dataLength = lbox - headerSize;
      let jumpDataLength = true;
      switch (tbox) {
        case 1785737832:
          jumpDataLength = false;
          break;
        case 1668246642: {
          const method = data[position];
          if (method === 1) {
            readUint32(data, position + 3);
          }
          break;
        }
        case 1885564018: {
          const NE = readUint16(data, position);
          const NPC = data[position + 2];
          const bitDepths = [];
          let pp = position + 3;
          for (let i = 0; i < NPC; i++) bitDepths.push((data[pp++] & 127) + 1);
          const lut = new Uint8Array(NE * NPC);
          for (let j = 0; j < NE; j++) {
            for (let i = 0; i < NPC; i++) {
              const depth = bitDepths[i];
              const byteLen = Math.ceil(depth / 8);
              let v = 0;
              for (let b = 0; b < byteLen; b++) v = v << 8 | data[pp++];
              lut[j * NPC + i] = depth >= 8 ? v >> depth - 8 : v << 8 - depth;
            }
          }
          this.palette = { columns: NPC, lut };
          break;
        }
        case 1668112752: {
          const mapping = [];
          for (let p = position; p + 4 <= position + dataLength; p += 4) {
            mapping.push({ cmp: readUint16(data, p), mtyp: data[p + 2], pcol: data[p + 3] });
          }
          this.componentMapping = mapping;
          break;
        }
        case 1785737827:
          this.parseCodestream(data, position, position + dataLength, reduceLevels);
          break;
        case 1783636e3:
          if (readUint32(data, position) !== 218793738) ;
          break;
      }
      if (jumpDataLength) {
        position += dataLength;
      }
    }
  }
  parseImageProperties(stream) {
    let newByte = stream.getByte();
    while (newByte >= 0) {
      const oldByte = newByte;
      newByte = stream.getByte();
      const code = oldByte << 8 | newByte;
      if (code === 65361) {
        stream.skip(4);
        const Xsiz = stream.getInt32() >>> 0;
        const Ysiz = stream.getInt32() >>> 0;
        const XOsiz = stream.getInt32() >>> 0;
        const YOsiz = stream.getInt32() >>> 0;
        stream.skip(16);
        const Csiz = stream.getUint16();
        this.width = Xsiz - XOsiz;
        this.height = Ysiz - YOsiz;
        this.componentsCount = Csiz;
        this.bitsPerComponent = 8;
        return;
      }
    }
    throw new JpxError("No size marker found in JPX stream");
  }
  parseCodestream(data, start, end, reduceLevels = 0) {
    const context = {};
    let doNotRecover = false;
    try {
      let position = start;
      while (position + 1 < end) {
        const code = readUint16(data, position);
        position += 2;
        let length = 0;
        let j;
        let sqcd;
        let spqcds;
        let spqcdSize;
        let scalarExpounded;
        let tile;
        switch (code) {
          case 65359:
            context.mainHeader = true;
            break;
          case 65497:
            break;
          case 65361: {
            length = readUint16(data, position);
            const siz = {};
            siz.Xsiz = readUint32(data, position + 4);
            siz.Ysiz = readUint32(data, position + 8);
            siz.XOsiz = readUint32(data, position + 12);
            siz.YOsiz = readUint32(data, position + 16);
            siz.XTsiz = readUint32(data, position + 20);
            siz.YTsiz = readUint32(data, position + 24);
            siz.XTOsiz = readUint32(data, position + 28);
            siz.YTOsiz = readUint32(data, position + 32);
            const componentsCount = readUint16(data, position + 36);
            siz.Csiz = componentsCount;
            const components = [];
            j = position + 38;
            for (let i = 0; i < componentsCount; i++) {
              const component = {
                precision: (data[j] & 127) + 1,
                isSigned: !!(data[j] & 128),
                XRsiz: data[j + 1],
                YRsiz: data[j + 2]
              };
              j += 3;
              calculateComponentDimensions(component, siz);
              components.push(component);
            }
            context.SIZ = siz;
            context.components = components;
            calculateTileGrids(context, components);
            context.QCC = [];
            context.COC = [];
            break;
          }
          case 65372: {
            length = readUint16(data, position);
            const qcd = {};
            j = position + 2;
            sqcd = data[j++];
            switch (sqcd & 31) {
              case 0:
                spqcdSize = 8;
                scalarExpounded = true;
                break;
              case 1:
                spqcdSize = 16;
                scalarExpounded = false;
                break;
              case 2:
                spqcdSize = 16;
                scalarExpounded = true;
                break;
              default:
                throw new Error(`Invalid SQcd value ${sqcd}`);
            }
            qcd.noQuantization = spqcdSize === 8;
            qcd.scalarExpounded = scalarExpounded;
            qcd.guardBits = sqcd >> 5;
            spqcds = [];
            while (j < length + position) {
              const spqcd = {};
              if (spqcdSize === 8) {
                spqcd.epsilon = data[j++] >> 3;
                spqcd.mu = 0;
              } else {
                spqcd.epsilon = data[j] >> 3;
                spqcd.mu = (data[j] & 7) << 8 | data[j + 1];
                j += 2;
              }
              spqcds.push(spqcd);
            }
            qcd.SPqcds = spqcds;
            if (context.mainHeader) {
              context.QCD = qcd;
            } else {
              context.currentTile.QCD = qcd;
              context.currentTile.QCC = [];
            }
            break;
          }
          case 65373: {
            length = readUint16(data, position);
            const qcc = {};
            j = position + 2;
            let cqcc;
            if (context.SIZ.Csiz < 257) {
              cqcc = data[j++];
            } else {
              cqcc = readUint16(data, j);
              j += 2;
            }
            sqcd = data[j++];
            switch (sqcd & 31) {
              case 0:
                spqcdSize = 8;
                scalarExpounded = true;
                break;
              case 1:
                spqcdSize = 16;
                scalarExpounded = false;
                break;
              case 2:
                spqcdSize = 16;
                scalarExpounded = true;
                break;
              default:
                throw new Error(`Invalid SQcd value ${sqcd}`);
            }
            qcc.noQuantization = spqcdSize === 8;
            qcc.scalarExpounded = scalarExpounded;
            qcc.guardBits = sqcd >> 5;
            spqcds = [];
            while (j < length + position) {
              const spqcd = {};
              if (spqcdSize === 8) {
                spqcd.epsilon = data[j++] >> 3;
                spqcd.mu = 0;
              } else {
                spqcd.epsilon = data[j] >> 3;
                spqcd.mu = (data[j] & 7) << 8 | data[j + 1];
                j += 2;
              }
              spqcds.push(spqcd);
            }
            qcc.SPqcds = spqcds;
            if (context.mainHeader) {
              context.QCC[cqcc] = qcc;
            } else {
              context.currentTile.QCC[cqcc] = qcc;
            }
            break;
          }
          case 65362: {
            length = readUint16(data, position);
            const cod = {};
            j = position + 2;
            const scod = data[j++];
            cod.entropyCoderWithCustomPrecincts = !!(scod & 1);
            cod.sopMarkerUsed = !!(scod & 2);
            cod.ephMarkerUsed = !!(scod & 4);
            cod.progressionOrder = data[j++];
            cod.layersCount = readUint16(data, j);
            j += 2;
            cod.multipleComponentTransform = data[j++];
            cod.decompositionLevelsCount = data[j++];
            cod.xcb = (data[j++] & 15) + 2;
            cod.ycb = (data[j++] & 15) + 2;
            const blockStyle = data[j++];
            cod.selectiveArithmeticCodingBypass = !!(blockStyle & 1);
            cod.resetContextProbabilities = !!(blockStyle & 2);
            cod.terminationOnEachCodingPass = !!(blockStyle & 4);
            cod.verticallyCausalContext = !!(blockStyle & 8);
            cod.predictableTermination = !!(blockStyle & 16);
            cod.segmentationSymbolUsed = !!(blockStyle & 32);
            cod.reversibleTransformation = data[j++];
            if (cod.entropyCoderWithCustomPrecincts) {
              const precinctsSizes = [];
              while (j < length + position) {
                const precinctsSize = data[j++];
                precinctsSizes.push({
                  PPx: precinctsSize & 15,
                  PPy: precinctsSize >> 4
                });
              }
              cod.precinctsSizes = precinctsSizes;
            }
            if (cod.selectiveArithmeticCodingBypass) {
              doNotRecover = true;
              warn("JPX: Unsupported COD option (selectiveArithmeticCodingBypass).");
            }
            if (context.mainHeader) {
              context.COD = cod;
            } else {
              context.currentTile.COD = cod;
              context.currentTile.COC = [];
            }
            break;
          }
          case 65424:
            length = readUint16(data, position);
            tile = {};
            tile.index = readUint16(data, position + 2);
            tile.length = readUint32(data, position + 4);
            tile.dataEnd = tile.length + position - 2;
            tile.partIndex = data[position + 8];
            tile.partsCount = data[position + 9];
            context.mainHeader = false;
            if (tile.partIndex === 0) {
              tile.COD = context.COD;
              tile.COC = context.COC.slice(0);
              tile.QCD = context.QCD;
              tile.QCC = context.QCC.slice(0);
            }
            context.currentTile = tile;
            break;
          case 65427:
            tile = context.currentTile;
            if (tile.partIndex === 0) {
              initializeTile(context, tile.index);
              buildPackets(context);
            }
            length = tile.dataEnd - position;
            parseTilePackets(context, data, position, length);
            break;
          case 65363:
            warn("JPX: Codestream code 0xFF53 (COC) is not implemented.");
          /* falls through */
          case 65365:
          // Tile-part lengths, main header (TLM)
          case 65367:
          // Packet length, main header (PLM)
          case 65368:
          // Packet length, tile-part header (PLT)
          case 65380:
            length = readUint16(data, position);
            break;
          default:
            throw new Error(`Unknown codestream code: ${code.toString(16)}`);
        }
        position += length;
      }
    } catch (e) {
      if (doNotRecover || this.failOnCorruptedImage) {
        throw new JpxError(e.message);
      } else {
        warn(`JPX: Trying to recover from: "${e.message}".`);
      }
    }
    let effectiveReduce = reduceLevels > 0 ? reduceLevels : 0;
    if (effectiveReduce > 0) {
      for (let t = 0; t < context.tiles.length; t++) {
        const tileComponents = context.tiles[t].components;
        for (let c = 0; c < tileComponents.length; c++) {
          const levels = tileComponents[c].codingStyleParameters.decompositionLevelsCount;
          if (levels < effectiveReduce) effectiveReduce = levels;
        }
      }
    }
    this.tiles = transformComponents(context, effectiveReduce);
    this.width = context.SIZ.Xsiz - context.SIZ.XOsiz;
    this.height = context.SIZ.Ysiz - context.SIZ.YOsiz;
    if (effectiveReduce > 0) {
      let w = 0;
      let h = 0;
      for (let t = 0; t < this.tiles.length; t++) {
        w = Math.max(w, this.tiles[t].left + this.tiles[t].width);
        h = Math.max(h, this.tiles[t].top + this.tiles[t].height);
      }
      this.width = w;
      this.height = h;
    }
    this.componentsCount = context.SIZ.Csiz;
    this.componentsPrecision = context.components ? context.components.map((c) => c.precision) : [];
  }
}
function calculateComponentDimensions(component, siz) {
  component.x0 = Math.ceil(siz.XOsiz / component.XRsiz);
  component.x1 = Math.ceil(siz.Xsiz / component.XRsiz);
  component.y0 = Math.ceil(siz.YOsiz / component.YRsiz);
  component.y1 = Math.ceil(siz.Ysiz / component.YRsiz);
  component.width = component.x1 - component.x0;
  component.height = component.y1 - component.y0;
}
function calculateTileGrids(context, components) {
  const siz = context.SIZ;
  const tiles = [];
  const numXtiles = Math.ceil((siz.Xsiz - siz.XTOsiz) / siz.XTsiz);
  const numYtiles = Math.ceil((siz.Ysiz - siz.YTOsiz) / siz.YTsiz);
  for (let q = 0; q < numYtiles; q++) {
    for (let p = 0; p < numXtiles; p++) {
      const tile = {};
      tile.tx0 = Math.max(siz.XTOsiz + p * siz.XTsiz, siz.XOsiz);
      tile.ty0 = Math.max(siz.YTOsiz + q * siz.YTsiz, siz.YOsiz);
      tile.tx1 = Math.min(siz.XTOsiz + (p + 1) * siz.XTsiz, siz.Xsiz);
      tile.ty1 = Math.min(siz.YTOsiz + (q + 1) * siz.YTsiz, siz.Ysiz);
      tile.width = tile.tx1 - tile.tx0;
      tile.height = tile.ty1 - tile.ty0;
      tile.components = [];
      tiles.push(tile);
    }
  }
  context.tiles = tiles;
  const componentsCount = siz.Csiz;
  for (let i = 0, ii = componentsCount; i < ii; i++) {
    const component = components[i];
    for (let j = 0, jj = tiles.length; j < jj; j++) {
      const tileComponent = {};
      const tile = tiles[j];
      tileComponent.tcx0 = Math.ceil(tile.tx0 / component.XRsiz);
      tileComponent.tcy0 = Math.ceil(tile.ty0 / component.YRsiz);
      tileComponent.tcx1 = Math.ceil(tile.tx1 / component.XRsiz);
      tileComponent.tcy1 = Math.ceil(tile.ty1 / component.YRsiz);
      tileComponent.width = tileComponent.tcx1 - tileComponent.tcx0;
      tileComponent.height = tileComponent.tcy1 - tileComponent.tcy0;
      tile.components[i] = tileComponent;
    }
  }
}
function getBlocksDimensions(context, component, r) {
  const codOrCoc = component.codingStyleParameters;
  const result = {};
  if (!codOrCoc.entropyCoderWithCustomPrecincts) {
    result.PPx = 15;
    result.PPy = 15;
  } else {
    result.PPx = codOrCoc.precinctsSizes[r].PPx;
    result.PPy = codOrCoc.precinctsSizes[r].PPy;
  }
  result.xcb_ = r > 0 ? Math.min(codOrCoc.xcb, result.PPx - 1) : Math.min(codOrCoc.xcb, result.PPx);
  result.ycb_ = r > 0 ? Math.min(codOrCoc.ycb, result.PPy - 1) : Math.min(codOrCoc.ycb, result.PPy);
  return result;
}
function buildPrecincts(context, resolution, dimensions) {
  const precinctWidth = 1 << dimensions.PPx;
  const precinctHeight = 1 << dimensions.PPy;
  const isZeroRes = resolution.resLevel === 0;
  const precinctWidthInSubband = 1 << dimensions.PPx + (isZeroRes ? 0 : -1);
  const precinctHeightInSubband = 1 << dimensions.PPy + (isZeroRes ? 0 : -1);
  const numprecinctswide = resolution.trx1 > resolution.trx0 ? Math.ceil(resolution.trx1 / precinctWidth) - Math.floor(resolution.trx0 / precinctWidth) : 0;
  const numprecinctshigh = resolution.try1 > resolution.try0 ? Math.ceil(resolution.try1 / precinctHeight) - Math.floor(resolution.try0 / precinctHeight) : 0;
  const numprecincts = numprecinctswide * numprecinctshigh;
  resolution.precinctParameters = {
    precinctWidth,
    precinctHeight,
    numprecinctswide,
    numprecinctshigh,
    numprecincts,
    precinctWidthInSubband,
    precinctHeightInSubband
  };
}
function buildCodeblocks(context, subband, dimensions) {
  const xcb_ = dimensions.xcb_;
  const ycb_ = dimensions.ycb_;
  const codeblockWidth = 1 << xcb_;
  const codeblockHeight = 1 << ycb_;
  const cbx0 = subband.tbx0 >> xcb_;
  const cby0 = subband.tby0 >> ycb_;
  const cbx1 = subband.tbx1 + codeblockWidth - 1 >> xcb_;
  const cby1 = subband.tby1 + codeblockHeight - 1 >> ycb_;
  const precinctParameters = subband.resolution.precinctParameters;
  const codeblocks = [];
  const precincts = [];
  for (let j = cby0; j < cby1; j++) {
    for (let i = cbx0; i < cbx1; i++) {
      const codeblock = {
        cbx: i,
        cby: j,
        tbx0: codeblockWidth * i,
        tby0: codeblockHeight * j,
        tbx1: codeblockWidth * (i + 1),
        tby1: codeblockHeight * (j + 1)
      };
      codeblock.tbx0_ = Math.max(subband.tbx0, codeblock.tbx0);
      codeblock.tby0_ = Math.max(subband.tby0, codeblock.tby0);
      codeblock.tbx1_ = Math.min(subband.tbx1, codeblock.tbx1);
      codeblock.tby1_ = Math.min(subband.tby1, codeblock.tby1);
      const pi = Math.floor(
        (codeblock.tbx0_ - subband.tbx0) / precinctParameters.precinctWidthInSubband
      );
      const pj = Math.floor(
        (codeblock.tby0_ - subband.tby0) / precinctParameters.precinctHeightInSubband
      );
      const precinctNumber = pi + pj * precinctParameters.numprecinctswide;
      codeblock.precinctNumber = precinctNumber;
      codeblock.subbandType = subband.type;
      codeblock.Lblock = 3;
      if (codeblock.tbx1_ <= codeblock.tbx0_ || codeblock.tby1_ <= codeblock.tby0_) {
        continue;
      }
      codeblocks.push(codeblock);
      let precinct = precincts[precinctNumber];
      if (precinct !== void 0) {
        if (i < precinct.cbxMin) {
          precinct.cbxMin = i;
        } else if (i > precinct.cbxMax) {
          precinct.cbxMax = i;
        }
        if (j < precinct.cbyMin) {
          precinct.cbxMin = j;
        } else if (j > precinct.cbyMax) {
          precinct.cbyMax = j;
        }
      } else {
        precinct = {
          cbxMin: i,
          cbyMin: j,
          cbxMax: i,
          cbyMax: j
        };
        precincts[precinctNumber] = precinct;
      }
      codeblock.precinct = precinct;
    }
  }
  subband.codeblockParameters = {
    codeblockWidth: xcb_,
    codeblockHeight: ycb_,
    numcodeblockwide: cbx1 - cbx0 + 1,
    numcodeblockhigh: cby1 - cby0 + 1
  };
  subband.codeblocks = codeblocks;
  subband.precincts = precincts;
}
function createPacket(resolution, precinctNumber, layerNumber) {
  const precinctCodeblocks = [];
  const subbands = resolution.subbands;
  for (let i = 0, ii = subbands.length; i < ii; i++) {
    const subband = subbands[i];
    const codeblocks = subband.codeblocks;
    for (let j = 0, jj = codeblocks.length; j < jj; j++) {
      const codeblock = codeblocks[j];
      if (codeblock.precinctNumber !== precinctNumber) {
        continue;
      }
      precinctCodeblocks.push(codeblock);
    }
  }
  return {
    layerNumber,
    codeblocks: precinctCodeblocks
  };
}
class LayerResolutionComponentPositionIterator {
  constructor(context) {
    const siz = context.SIZ;
    const tileIndex = context.currentTile.index;
    const tile = context.tiles[tileIndex];
    const layersCount = tile.codingStyleDefaultParameters.layersCount;
    const componentsCount = siz.Csiz;
    let maxDecompositionLevelsCount = 0;
    for (let q = 0; q < componentsCount; q++) {
      maxDecompositionLevelsCount = Math.max(
        maxDecompositionLevelsCount,
        tile.components[q].codingStyleParameters.decompositionLevelsCount
      );
    }
    this._tile = tile;
    this._layersCount = layersCount;
    this._componentsCount = componentsCount;
    this._maxDecompositionLevelsCount = maxDecompositionLevelsCount;
    this._l = 0;
    this._r = 0;
    this._i = 0;
    this._k = 0;
  }
  nextPacket() {
    const tile = this._tile;
    const layersCount = this._layersCount;
    const componentsCount = this._componentsCount;
    const maxDecompositionLevelsCount = this._maxDecompositionLevelsCount;
    for (; this._l < layersCount; this._l++) {
      for (; this._r <= maxDecompositionLevelsCount; this._r++) {
        for (; this._i < componentsCount; this._i++) {
          const component = tile.components[this._i];
          if (this._r > component.codingStyleParameters.decompositionLevelsCount) {
            continue;
          }
          const resolution = component.resolutions[this._r];
          const numprecincts = resolution.precinctParameters.numprecincts;
          for (; this._k < numprecincts; ) {
            const packet = createPacket(resolution, this._k, this._l);
            this._k++;
            return packet;
          }
          this._k = 0;
        }
        this._i = 0;
      }
      this._r = 0;
    }
    throw new JpxError("Out of packets");
  }
}
class ResolutionLayerComponentPositionIterator {
  constructor(context) {
    const siz = context.SIZ;
    const tileIndex = context.currentTile.index;
    const tile = context.tiles[tileIndex];
    const layersCount = tile.codingStyleDefaultParameters.layersCount;
    const componentsCount = siz.Csiz;
    let maxDecompositionLevelsCount = 0;
    for (let q = 0; q < componentsCount; q++) {
      maxDecompositionLevelsCount = Math.max(
        maxDecompositionLevelsCount,
        tile.components[q].codingStyleParameters.decompositionLevelsCount
      );
    }
    this._tile = tile;
    this._layersCount = layersCount;
    this._componentsCount = componentsCount;
    this._maxDecompositionLevelsCount = maxDecompositionLevelsCount;
    this._r = 0;
    this._l = 0;
    this._i = 0;
    this._k = 0;
  }
  nextPacket() {
    const tile = this._tile;
    const layersCount = this._layersCount;
    const componentsCount = this._componentsCount;
    const maxDecompositionLevelsCount = this._maxDecompositionLevelsCount;
    for (; this._r <= maxDecompositionLevelsCount; this._r++) {
      for (; this._l < layersCount; this._l++) {
        for (; this._i < componentsCount; this._i++) {
          const component = tile.components[this._i];
          if (this._r > component.codingStyleParameters.decompositionLevelsCount) {
            continue;
          }
          const resolution = component.resolutions[this._r];
          const numprecincts = resolution.precinctParameters.numprecincts;
          for (; this._k < numprecincts; ) {
            const packet = createPacket(resolution, this._k, this._l);
            this._k++;
            return packet;
          }
          this._k = 0;
        }
        this._i = 0;
      }
      this._l = 0;
    }
    throw new JpxError("Out of packets");
  }
}
class ResolutionPositionComponentLayerIterator {
  constructor(context) {
    const siz = context.SIZ;
    const tileIndex = context.currentTile.index;
    const tile = context.tiles[tileIndex];
    const layersCount = tile.codingStyleDefaultParameters.layersCount;
    const componentsCount = siz.Csiz;
    let maxDecompositionLevelsCount = 0;
    for (let c = 0; c < componentsCount; c++) {
      const component = tile.components[c];
      maxDecompositionLevelsCount = Math.max(
        maxDecompositionLevelsCount,
        component.codingStyleParameters.decompositionLevelsCount
      );
    }
    const maxNumPrecinctsInLevel = new Int32Array(maxDecompositionLevelsCount + 1);
    for (let r = 0; r <= maxDecompositionLevelsCount; ++r) {
      let maxNumPrecincts = 0;
      for (let c = 0; c < componentsCount; ++c) {
        const resolutions = tile.components[c].resolutions;
        if (r < resolutions.length) {
          maxNumPrecincts = Math.max(
            maxNumPrecincts,
            resolutions[r].precinctParameters.numprecincts
          );
        }
      }
      maxNumPrecinctsInLevel[r] = maxNumPrecincts;
    }
    this._tile = tile;
    this._layersCount = layersCount;
    this._componentsCount = componentsCount;
    this._maxDecompositionLevelsCount = maxDecompositionLevelsCount;
    this._maxNumPrecinctsInLevel = maxNumPrecinctsInLevel;
    this._l = 0;
    this._r = 0;
    this._c = 0;
    this._p = 0;
  }
  nextPacket() {
    const tile = this._tile;
    const layersCount = this._layersCount;
    const componentsCount = this._componentsCount;
    const maxDecompositionLevelsCount = this._maxDecompositionLevelsCount;
    const maxNumPrecinctsInLevel = this._maxNumPrecinctsInLevel;
    for (; this._r <= maxDecompositionLevelsCount; this._r++) {
      for (; this._p < maxNumPrecinctsInLevel[this._r]; this._p++) {
        for (; this._c < componentsCount; this._c++) {
          const component = tile.components[this._c];
          if (this._r > component.codingStyleParameters.decompositionLevelsCount) {
            continue;
          }
          const resolution = component.resolutions[this._r];
          const numprecincts = resolution.precinctParameters.numprecincts;
          if (this._p >= numprecincts) {
            continue;
          }
          for (; this._l < layersCount; ) {
            const packet = createPacket(resolution, this._p, this._l);
            this._l++;
            return packet;
          }
          this._l = 0;
        }
        this._c = 0;
      }
      this._p = 0;
    }
    throw new JpxError("Out of packets");
  }
}
class PositionComponentResolutionLayerIterator {
  constructor(context) {
    const siz = context.SIZ;
    const tileIndex = context.currentTile.index;
    const tile = context.tiles[tileIndex];
    const layersCount = tile.codingStyleDefaultParameters.layersCount;
    const componentsCount = siz.Csiz;
    const precinctsSizes = getPrecinctSizesInImageScale(tile);
    this._tile = tile;
    this._layersCount = layersCount;
    this._componentsCount = componentsCount;
    this._precinctsSizes = precinctsSizes;
    this._precinctsIterationSizes = precinctsSizes;
    this._l = 0;
    this._r = 0;
    this._c = 0;
    this._px = 0;
    this._py = 0;
  }
  nextPacket() {
    const tile = this._tile;
    const layersCount = this._layersCount;
    const componentsCount = this._componentsCount;
    const precinctsSizes = this._precinctsSizes;
    const precinctsIterationSizes = this._precinctsIterationSizes;
    for (; this._py < precinctsIterationSizes.maxNumHigh; this._py++) {
      for (; this._px < precinctsIterationSizes.maxNumWide; this._px++) {
        for (; this._c < componentsCount; this._c++) {
          const component = tile.components[this._c];
          const decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
          for (; this._r <= decompositionLevelsCount; this._r++) {
            const resolution = component.resolutions[this._r];
            const sizeInImageScale = precinctsSizes.components[this._c].resolutions[this._r];
            const k = getPrecinctIndexIfExist(
              this._px,
              this._py,
              sizeInImageScale,
              precinctsIterationSizes,
              resolution
            );
            if (k === null) {
              continue;
            }
            for (; this._l < layersCount; ) {
              const packet = createPacket(resolution, k, this._l);
              this._l++;
              return packet;
            }
            this._l = 0;
          }
          this._r = 0;
        }
        this._c = 0;
      }
      this._px = 0;
    }
    throw new JpxError("Out of packets");
  }
}
class ComponentPositionResolutionLayerIterator {
  constructor(context) {
    const siz = context.SIZ;
    const tileIndex = context.currentTile.index;
    const tile = context.tiles[tileIndex];
    const layersCount = tile.codingStyleDefaultParameters.layersCount;
    const componentsCount = siz.Csiz;
    const precinctsSizes = getPrecinctSizesInImageScale(tile);
    this._tile = tile;
    this._layersCount = layersCount;
    this._componentsCount = componentsCount;
    this._precinctsSizes = precinctsSizes;
    this._l = 0;
    this._r = 0;
    this._c = 0;
    this._px = 0;
    this._py = 0;
  }
  nextPacket() {
    const tile = this._tile;
    const layersCount = this._layersCount;
    const componentsCount = this._componentsCount;
    const precinctsSizes = this._precinctsSizes;
    for (; this._c < componentsCount; ++this._c) {
      const component = tile.components[this._c];
      const precinctsIterationSizes = precinctsSizes.components[this._c];
      const decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
      for (; this._py < precinctsIterationSizes.maxNumHigh; this._py++) {
        for (; this._px < precinctsIterationSizes.maxNumWide; this._px++) {
          for (; this._r <= decompositionLevelsCount; this._r++) {
            const resolution = component.resolutions[this._r];
            const sizeInImageScale = precinctsIterationSizes.resolutions[this._r];
            const k = getPrecinctIndexIfExist(
              this._px,
              this._py,
              sizeInImageScale,
              precinctsIterationSizes,
              resolution
            );
            if (k === null) {
              continue;
            }
            for (; this._l < layersCount; ) {
              const packet = createPacket(resolution, k, this._l);
              this._l++;
              return packet;
            }
            this._l = 0;
          }
          this._r = 0;
        }
        this._px = 0;
      }
      this._py = 0;
    }
    throw new JpxError("Out of packets");
  }
}
function getPrecinctIndexIfExist(pxIndex, pyIndex, sizeInImageScale, precinctIterationSizes, resolution) {
  const posX = pxIndex * precinctIterationSizes.minWidth;
  const posY = pyIndex * precinctIterationSizes.minHeight;
  if (posX % sizeInImageScale.width !== 0 || posY % sizeInImageScale.height !== 0) {
    return null;
  }
  const startPrecinctRowIndex = posY / sizeInImageScale.width * resolution.precinctParameters.numprecinctswide;
  return posX / sizeInImageScale.height + startPrecinctRowIndex;
}
function getPrecinctSizesInImageScale(tile) {
  const componentsCount = tile.components.length;
  let minWidth = Number.MAX_VALUE;
  let minHeight = Number.MAX_VALUE;
  let maxNumWide = 0;
  let maxNumHigh = 0;
  const sizePerComponent = new Array(componentsCount);
  for (let c = 0; c < componentsCount; c++) {
    const component = tile.components[c];
    const decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    const sizePerResolution = new Array(decompositionLevelsCount + 1);
    let minWidthCurrentComponent = Number.MAX_VALUE;
    let minHeightCurrentComponent = Number.MAX_VALUE;
    let maxNumWideCurrentComponent = 0;
    let maxNumHighCurrentComponent = 0;
    let scale = 1;
    for (let r = decompositionLevelsCount; r >= 0; --r) {
      const resolution = component.resolutions[r];
      const widthCurrentResolution = scale * resolution.precinctParameters.precinctWidth;
      const heightCurrentResolution = scale * resolution.precinctParameters.precinctHeight;
      minWidthCurrentComponent = Math.min(
        minWidthCurrentComponent,
        widthCurrentResolution
      );
      minHeightCurrentComponent = Math.min(
        minHeightCurrentComponent,
        heightCurrentResolution
      );
      maxNumWideCurrentComponent = Math.max(
        maxNumWideCurrentComponent,
        resolution.precinctParameters.numprecinctswide
      );
      maxNumHighCurrentComponent = Math.max(
        maxNumHighCurrentComponent,
        resolution.precinctParameters.numprecinctshigh
      );
      sizePerResolution[r] = {
        width: widthCurrentResolution,
        height: heightCurrentResolution
      };
      scale <<= 1;
    }
    minWidth = Math.min(minWidth, minWidthCurrentComponent);
    minHeight = Math.min(minHeight, minHeightCurrentComponent);
    maxNumWide = Math.max(maxNumWide, maxNumWideCurrentComponent);
    maxNumHigh = Math.max(maxNumHigh, maxNumHighCurrentComponent);
    sizePerComponent[c] = {
      resolutions: sizePerResolution,
      minWidth: minWidthCurrentComponent,
      minHeight: minHeightCurrentComponent,
      maxNumWide: maxNumWideCurrentComponent,
      maxNumHigh: maxNumHighCurrentComponent
    };
  }
  return {
    components: sizePerComponent,
    minWidth,
    minHeight,
    maxNumWide,
    maxNumHigh
  };
}
function buildPackets(context) {
  const siz = context.SIZ;
  const tileIndex = context.currentTile.index;
  const tile = context.tiles[tileIndex];
  const componentsCount = siz.Csiz;
  for (let c = 0; c < componentsCount; c++) {
    const component = tile.components[c];
    const decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    const resolutions = [];
    const subbands = [];
    for (let r = 0; r <= decompositionLevelsCount; r++) {
      const blocksDimensions = getBlocksDimensions(context, component, r);
      const resolution = {};
      const scale = 1 << decompositionLevelsCount - r;
      resolution.trx0 = Math.ceil(component.tcx0 / scale);
      resolution.try0 = Math.ceil(component.tcy0 / scale);
      resolution.trx1 = Math.ceil(component.tcx1 / scale);
      resolution.try1 = Math.ceil(component.tcy1 / scale);
      resolution.resLevel = r;
      buildPrecincts(context, resolution, blocksDimensions);
      resolutions.push(resolution);
      let subband;
      if (r === 0) {
        subband = {};
        subband.type = "LL";
        subband.tbx0 = Math.ceil(component.tcx0 / scale);
        subband.tby0 = Math.ceil(component.tcy0 / scale);
        subband.tbx1 = Math.ceil(component.tcx1 / scale);
        subband.tby1 = Math.ceil(component.tcy1 / scale);
        subband.resolution = resolution;
        buildCodeblocks(context, subband, blocksDimensions);
        subbands.push(subband);
        resolution.subbands = [subband];
      } else {
        const bscale = 1 << decompositionLevelsCount - r + 1;
        const resolutionSubbands = [];
        subband = {};
        subband.type = "HL";
        subband.tbx0 = Math.ceil(component.tcx0 / bscale - 0.5);
        subband.tby0 = Math.ceil(component.tcy0 / bscale);
        subband.tbx1 = Math.ceil(component.tcx1 / bscale - 0.5);
        subband.tby1 = Math.ceil(component.tcy1 / bscale);
        subband.resolution = resolution;
        buildCodeblocks(context, subband, blocksDimensions);
        subbands.push(subband);
        resolutionSubbands.push(subband);
        subband = {};
        subband.type = "LH";
        subband.tbx0 = Math.ceil(component.tcx0 / bscale);
        subband.tby0 = Math.ceil(component.tcy0 / bscale - 0.5);
        subband.tbx1 = Math.ceil(component.tcx1 / bscale);
        subband.tby1 = Math.ceil(component.tcy1 / bscale - 0.5);
        subband.resolution = resolution;
        buildCodeblocks(context, subband, blocksDimensions);
        subbands.push(subband);
        resolutionSubbands.push(subband);
        subband = {};
        subband.type = "HH";
        subband.tbx0 = Math.ceil(component.tcx0 / bscale - 0.5);
        subband.tby0 = Math.ceil(component.tcy0 / bscale - 0.5);
        subband.tbx1 = Math.ceil(component.tcx1 / bscale - 0.5);
        subband.tby1 = Math.ceil(component.tcy1 / bscale - 0.5);
        subband.resolution = resolution;
        buildCodeblocks(context, subband, blocksDimensions);
        subbands.push(subband);
        resolutionSubbands.push(subband);
        resolution.subbands = resolutionSubbands;
      }
    }
    component.resolutions = resolutions;
    component.subbands = subbands;
  }
  const progressionOrder = tile.codingStyleDefaultParameters.progressionOrder;
  switch (progressionOrder) {
    case 0:
      tile.packetsIterator = new LayerResolutionComponentPositionIterator(context);
      break;
    case 1:
      tile.packetsIterator = new ResolutionLayerComponentPositionIterator(context);
      break;
    case 2:
      tile.packetsIterator = new ResolutionPositionComponentLayerIterator(context);
      break;
    case 3:
      tile.packetsIterator = new PositionComponentResolutionLayerIterator(context);
      break;
    case 4:
      tile.packetsIterator = new ComponentPositionResolutionLayerIterator(context);
      break;
    default:
      throw new JpxError(`Unsupported progression order ${progressionOrder}`);
  }
}
function parseTilePackets(context, data, offset, dataLength) {
  let position = 0;
  let buffer;
  let bufferSize = 0;
  let skipNextBit = false;
  function readBits(count) {
    while (bufferSize < count) {
      const b = data[offset + position];
      position++;
      if (skipNextBit) {
        buffer = buffer << 7 | b;
        bufferSize += 7;
        skipNextBit = false;
      } else {
        buffer = buffer << 8 | b;
        bufferSize += 8;
      }
      if (b === 255) {
        skipNextBit = true;
      }
    }
    bufferSize -= count;
    return buffer >>> bufferSize & (1 << count) - 1;
  }
  function skipMarkerIfEqual(value) {
    if (data[offset + position - 1] === 255 && data[offset + position] === value) {
      skipBytes(1);
      return true;
    }
    if (data[offset + position] === 255 && data[offset + position + 1] === value) {
      skipBytes(2);
      return true;
    }
    return false;
  }
  function skipBytes(count) {
    position += count;
  }
  function alignToByte() {
    bufferSize = 0;
    if (skipNextBit) {
      position++;
      skipNextBit = false;
    }
  }
  function readCodingpasses() {
    if (readBits(1) === 0) {
      return 1;
    }
    if (readBits(1) === 0) {
      return 2;
    }
    let value = readBits(2);
    if (value < 3) {
      return value + 3;
    }
    value = readBits(5);
    if (value < 31) {
      return value + 6;
    }
    value = readBits(7);
    return value + 37;
  }
  const tileIndex = context.currentTile.index;
  const tile = context.tiles[tileIndex];
  const sopMarkerUsed = context.COD.sopMarkerUsed;
  const ephMarkerUsed = context.COD.ephMarkerUsed;
  const terminationOnEachCodingPass = context.COD.terminationOnEachCodingPass;
  const packetsIterator = tile.packetsIterator;
  while (position < dataLength) {
    alignToByte();
    if (sopMarkerUsed && skipMarkerIfEqual(145)) {
      skipBytes(4);
    }
    const packet = packetsIterator.nextPacket();
    if (!readBits(1)) {
      continue;
    }
    const layerNumber = packet.layerNumber;
    const queue = [];
    let codeblock;
    for (let i = 0, ii = packet.codeblocks.length; i < ii; i++) {
      codeblock = packet.codeblocks[i];
      let precinct = codeblock.precinct;
      const codeblockColumn = codeblock.cbx - precinct.cbxMin;
      const codeblockRow = codeblock.cby - precinct.cbyMin;
      let codeblockIncluded = false;
      let firstTimeInclusion = false;
      let valueReady;
      let zeroBitPlanesTree;
      if (codeblock.included !== void 0) {
        codeblockIncluded = !!readBits(1);
      } else {
        precinct = codeblock.precinct;
        let inclusionTree;
        if (precinct.inclusionTree !== void 0) {
          inclusionTree = precinct.inclusionTree;
        } else {
          const width = precinct.cbxMax - precinct.cbxMin + 1;
          const height = precinct.cbyMax - precinct.cbyMin + 1;
          inclusionTree = new InclusionTree(width, height, layerNumber);
          zeroBitPlanesTree = new TagTree(width, height);
          precinct.inclusionTree = inclusionTree;
          precinct.zeroBitPlanesTree = zeroBitPlanesTree;
        }
        if (inclusionTree.reset(codeblockColumn, codeblockRow, layerNumber)) {
          while (true) {
            if (readBits(1)) {
              valueReady = !inclusionTree.nextLevel();
              if (valueReady) {
                codeblock.included = true;
                codeblockIncluded = firstTimeInclusion = true;
                break;
              }
            } else {
              inclusionTree.incrementValue(layerNumber);
              break;
            }
          }
        }
      }
      if (!codeblockIncluded) {
        continue;
      }
      if (firstTimeInclusion) {
        zeroBitPlanesTree = precinct.zeroBitPlanesTree;
        zeroBitPlanesTree.reset(codeblockColumn, codeblockRow);
        while (true) {
          if (readBits(1)) {
            valueReady = !zeroBitPlanesTree.nextLevel();
            if (valueReady) {
              break;
            }
          } else {
            zeroBitPlanesTree.incrementValue();
          }
        }
        codeblock.zeroBitPlanes = zeroBitPlanesTree.value;
      }
      const codingpasses = readCodingpasses();
      while (readBits(1)) {
        codeblock.Lblock++;
      }
      let codedDataLength;
      let segmentLengths = null;
      if (terminationOnEachCodingPass) {
        segmentLengths = new Array(codingpasses);
        codedDataLength = 0;
        for (let s = 0; s < codingpasses; s++) {
          const segmentLength = readBits(codeblock.Lblock);
          segmentLengths[s] = segmentLength;
          codedDataLength += segmentLength;
        }
      } else {
        const codingpassesLog2 = log2(codingpasses);
        const bits = (codingpasses < 1 << codingpassesLog2 ? codingpassesLog2 - 1 : codingpassesLog2) + codeblock.Lblock;
        codedDataLength = readBits(bits);
      }
      queue.push({
        codeblock,
        codingpasses,
        dataLength: codedDataLength,
        segmentLengths
      });
    }
    alignToByte();
    if (ephMarkerUsed) {
      skipMarkerIfEqual(146);
    }
    while (queue.length > 0) {
      const packetItem = queue.shift();
      codeblock = packetItem.codeblock;
      if (codeblock.data === void 0) {
        codeblock.data = [];
      }
      codeblock.data.push({
        data,
        start: offset + position,
        end: offset + position + packetItem.dataLength,
        codingpasses: packetItem.codingpasses,
        segmentLengths: packetItem.segmentLengths
      });
      position += packetItem.dataLength;
    }
  }
  return position;
}
function copyCoefficients(coefficients, levelWidth, levelHeight, subband, delta, mb, reversible, segmentationSymbolUsed, terminationOnEachCodingPass, resetContextProbabilities, verticallyCausalContext, xParity, yParity) {
  const x0 = subband.tbx0;
  const y0 = subband.tby0;
  const width = subband.tbx1 - subband.tbx0;
  const codeblocks = subband.codeblocks;
  const right = subband.type.charAt(0) === "H" ? 1 - xParity : xParity;
  const bottom = (subband.type.charAt(1) === "H" ? 1 - yParity : yParity) * levelWidth;
  for (let i = 0, ii = codeblocks.length; i < ii; ++i) {
    const codeblock = codeblocks[i];
    const blockWidth = codeblock.tbx1_ - codeblock.tbx0_;
    const blockHeight = codeblock.tby1_ - codeblock.tby0_;
    if (blockWidth === 0 || blockHeight === 0) {
      continue;
    }
    if (codeblock.data === void 0) {
      continue;
    }
    const bitModel = new BitModel(
      blockWidth,
      blockHeight,
      codeblock.subbandType,
      codeblock.zeroBitPlanes,
      mb,
      verticallyCausalContext
    );
    let currentCodingpassType = 2;
    const data = codeblock.data;
    let totalLength = 0;
    let codingpasses = 0;
    for (let j = 0, jj = data.length; j < jj; j++) {
      const dataItem = data[j];
      totalLength += dataItem.end - dataItem.start;
      codingpasses += dataItem.codingpasses;
    }
    const encodedData = new Uint8Array(totalLength);
    let position = 0;
    for (let j = 0, jj = data.length; j < jj; j++) {
      const dataItem = data[j];
      const chunk = dataItem.data.subarray(dataItem.start, dataItem.end);
      encodedData.set(chunk, position);
      position += chunk.length;
    }
    const segments = [];
    if (terminationOnEachCodingPass) {
      let segStart = 0;
      for (let j = 0, jj = data.length; j < jj; j++) {
        const lengths = data[j].segmentLengths;
        for (let s = 0; s < lengths.length; s++) {
          segments.push({ start: segStart, end: segStart + lengths[s] });
          segStart += lengths[s];
        }
      }
    } else if (codingpasses > 0) {
      segments.push({ start: 0, end: totalLength });
      for (let p = 1; p < codingpasses; p++) {
        segments.push(null);
      }
    }
    let pass = 0;
    for (let s = 0; s < segments.length; s++) {
      if (segments[s]) {
        bitModel.setDecoder(
          new ArithmeticDecoder(encodedData, segments[s].start, segments[s].end)
        );
      }
      if (resetContextProbabilities && pass > 0) {
        bitModel.reset();
      }
      switch (currentCodingpassType) {
        case 0:
          bitModel.runSignificancePropagationPass();
          break;
        case 1:
          bitModel.runMagnitudeRefinementPass();
          break;
        case 2:
          bitModel.runCleanupPass();
          if (segmentationSymbolUsed) {
            bitModel.checkSegmentationSymbol();
          }
          break;
      }
      currentCodingpassType = (currentCodingpassType + 1) % 3;
      pass++;
    }
    let offset = codeblock.tbx0_ - x0 + (codeblock.tby0_ - y0) * width;
    const sign = bitModel.coefficentsSign;
    const magnitude = bitModel.coefficentsMagnitude;
    const bitsDecoded = bitModel.bitsDecoded;
    const magnitudeCorrection = reversible ? 0 : 0.5;
    let n;
    position = 0;
    const interleave = subband.type !== "LL";
    for (let j = 0; j < blockHeight; j++) {
      const row = offset / width | 0;
      const levelOffset = 2 * row * (levelWidth - width) + right + bottom;
      for (let k = 0; k < blockWidth; k++) {
        n = magnitude[position];
        if (n !== 0) {
          n = (n + magnitudeCorrection) * delta;
          if (sign[position] !== 0) {
            n = -n;
          }
          const nb = bitsDecoded[position];
          const pos = interleave ? levelOffset + (offset << 1) : offset;
          if (reversible && nb >= mb) {
            coefficients[pos] = n;
          } else {
            coefficients[pos] = n * (1 << mb - nb);
          }
        }
        offset++;
        position++;
      }
      offset += width - blockWidth;
    }
  }
}
function transformTile(context, tile, c, reduceLevels = 0) {
  const component = tile.components[c];
  const codingStyleParameters = component.codingStyleParameters;
  const quantizationParameters = component.quantizationParameters;
  const decompositionLevelsCount = codingStyleParameters.decompositionLevelsCount;
  const spqcds = quantizationParameters.SPqcds;
  const scalarExpounded = quantizationParameters.scalarExpounded;
  const guardBits = quantizationParameters.guardBits;
  const segmentationSymbolUsed = codingStyleParameters.segmentationSymbolUsed;
  const terminationOnEachCodingPass = codingStyleParameters.terminationOnEachCodingPass;
  const resetContextProbabilities = codingStyleParameters.resetContextProbabilities;
  const verticallyCausalContext = codingStyleParameters.verticallyCausalContext;
  const precision = context.components[c].precision;
  const reversible = codingStyleParameters.reversibleTransformation;
  const transform = reversible ? new ReversibleTransform() : new IrreversibleTransform();
  const subbandCoefficients = [];
  let b = 0;
  const keptLevels = decompositionLevelsCount - Math.min(reduceLevels, decompositionLevelsCount);
  for (let i = 0; i <= keptLevels; i++) {
    const resolution = component.resolutions[i];
    const width = resolution.trx1 - resolution.trx0;
    const height = resolution.try1 - resolution.try0;
    const coefficients = new Float32Array(width * height);
    const xParity = resolution.trx0 & 1;
    const yParity = resolution.try0 & 1;
    for (let j = 0, jj = resolution.subbands.length; j < jj; j++) {
      let mu;
      let epsilon;
      if (!scalarExpounded) {
        mu = spqcds[0].mu;
        epsilon = spqcds[0].epsilon + (i > 0 ? 1 - i : 0);
      } else {
        mu = spqcds[b].mu;
        epsilon = spqcds[b].epsilon;
        b++;
      }
      const subband = resolution.subbands[j];
      const gainLog2 = SubbandsGainLog2[subband.type];
      const delta = reversible ? 1 : 2 ** (precision + gainLog2 - epsilon) * (1 + mu / 2048);
      const mb = guardBits + epsilon - 1;
      copyCoefficients(
        coefficients,
        width,
        height,
        subband,
        delta,
        mb,
        reversible,
        segmentationSymbolUsed,
        terminationOnEachCodingPass,
        resetContextProbabilities,
        verticallyCausalContext,
        xParity,
        yParity
      );
    }
    subbandCoefficients.push({
      width,
      height,
      items: coefficients,
      u0: resolution.trx0,
      v0: resolution.try0
    });
  }
  const result = transform.calculate(subbandCoefficients);
  const topResolution = component.resolutions[keptLevels];
  return {
    left: topResolution.trx0,
    top: topResolution.try0,
    width: result.width,
    height: result.height,
    items: result.items
  };
}
function transformComponents(context, reduceLevels = 0) {
  const siz = context.SIZ;
  const components = context.components;
  const componentsCount = siz.Csiz;
  const resultImages = [];
  for (let i = 0, ii = context.tiles.length; i < ii; i++) {
    const tile = context.tiles[i];
    const transformedTiles = [];
    for (let c = 0; c < componentsCount; c++) {
      transformedTiles[c] = transformTile(context, tile, c, reduceLevels);
    }
    const tile0 = transformedTiles[0];
    const out = new Uint8ClampedArray(tile0.items.length * componentsCount);
    const result = {
      left: tile0.left,
      top: tile0.top,
      width: tile0.width,
      height: tile0.height,
      items: out
    };
    let shift;
    let offset;
    let pos = 0;
    let j;
    let jj;
    let y0;
    let y1;
    let y2;
    if (tile.codingStyleDefaultParameters.multipleComponentTransform) {
      const y0items = transformedTiles[0].items;
      const y1items = transformedTiles[1].items;
      const y2items = transformedTiles[2].items;
      shift = components[0].precision - 8;
      const component0 = tile.components[0];
      const alpha01 = componentsCount - 3;
      jj = y0items.length;
      if (shift < 0) {
        const leftShift = -shift;
        const halfRange = 1 << components[0].precision - 1;
        if (!component0.codingStyleParameters.reversibleTransformation) {
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + halfRange;
            y1 = y1items[j];
            y2 = y2items[j];
            out[pos++] = y0 + 1.402 * y2 << leftShift;
            out[pos++] = y0 - 0.34413 * y1 - 0.71414 * y2 << leftShift;
            out[pos++] = y0 + 1.772 * y1 << leftShift;
          }
        } else {
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + halfRange;
            y1 = y1items[j];
            y2 = y2items[j];
            const g = y0 - (y2 + y1 >> 2);
            out[pos++] = g + y2 << leftShift;
            out[pos++] = g << leftShift;
            out[pos++] = g + y1 << leftShift;
          }
        }
        for (let cExtra = 3; cExtra < componentsCount; cExtra++) {
          const ycItems = transformedTiles[cExtra].items;
          for (j = 0, pos = cExtra; j < jj; j++, pos += componentsCount) {
            out[pos] = ycItems[j] + halfRange << leftShift;
          }
        }
      } else {
        offset = (128 << shift) + 0.5;
        if (!component0.codingStyleParameters.reversibleTransformation) {
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + offset;
            y1 = y1items[j];
            y2 = y2items[j];
            out[pos++] = y0 + 1.402 * y2 >> shift;
            out[pos++] = y0 - 0.34413 * y1 - 0.71414 * y2 >> shift;
            out[pos++] = y0 + 1.772 * y1 >> shift;
          }
        } else {
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + offset;
            y1 = y1items[j];
            y2 = y2items[j];
            const g = y0 - (y2 + y1 >> 2);
            out[pos++] = g + y2 >> shift;
            out[pos++] = g >> shift;
            out[pos++] = g + y1 >> shift;
          }
        }
        for (let cExtra = 3; cExtra < componentsCount; cExtra++) {
          const ycItems = transformedTiles[cExtra].items;
          for (j = 0, pos = cExtra; j < jj; j++, pos += componentsCount) {
            out[pos] = ycItems[j] + offset >> shift;
          }
        }
      }
    } else {
      for (let c = 0; c < componentsCount; c++) {
        const items = transformedTiles[c].items;
        shift = components[c].precision - 8;
        if (shift < 0) {
          const leftShift = -shift;
          const halfRange = 1 << components[c].precision - 1;
          for (pos = c, j = 0, jj = items.length; j < jj; j++) {
            out[pos] = items[j] + halfRange << leftShift;
            pos += componentsCount;
          }
        } else {
          offset = (128 << shift) + 0.5;
          for (pos = c, j = 0, jj = items.length; j < jj; j++) {
            out[pos] = items[j] + offset >> shift;
            pos += componentsCount;
          }
        }
      }
    }
    resultImages.push(result);
  }
  return resultImages;
}
function initializeTile(context, tileIndex) {
  const siz = context.SIZ;
  const componentsCount = siz.Csiz;
  const tile = context.tiles[tileIndex];
  for (let c = 0; c < componentsCount; c++) {
    const component = tile.components[c];
    const qcdOrQcc = context.currentTile.QCC[c] !== void 0 ? context.currentTile.QCC[c] : context.currentTile.QCD;
    component.quantizationParameters = qcdOrQcc;
    const codOrCoc = context.currentTile.COC[c] !== void 0 ? context.currentTile.COC[c] : context.currentTile.COD;
    component.codingStyleParameters = codOrCoc;
  }
  tile.codingStyleDefaultParameters = context.currentTile.COD;
}
class TagTree {
  constructor(width, height) {
    const levelsLength = log2(Math.max(width, height)) + 1;
    this.levels = [];
    for (let i = 0; i < levelsLength; i++) {
      const level = {
        width,
        height,
        items: []
      };
      this.levels.push(level);
      width = Math.ceil(width / 2);
      height = Math.ceil(height / 2);
    }
  }
  reset(i, j) {
    let currentLevel = 0;
    let value = 0;
    let level;
    while (currentLevel < this.levels.length) {
      level = this.levels[currentLevel];
      const index = i + j * level.width;
      if (level.items[index] !== void 0) {
        value = level.items[index];
        break;
      }
      level.index = index;
      i >>= 1;
      j >>= 1;
      currentLevel++;
    }
    currentLevel--;
    level = this.levels[currentLevel];
    level.items[level.index] = value;
    this.currentLevel = currentLevel;
    delete this.value;
  }
  incrementValue() {
    const level = this.levels[this.currentLevel];
    level.items[level.index]++;
  }
  nextLevel() {
    let currentLevel = this.currentLevel;
    let level = this.levels[currentLevel];
    const value = level.items[level.index];
    currentLevel--;
    if (currentLevel < 0) {
      this.value = value;
      return false;
    }
    this.currentLevel = currentLevel;
    level = this.levels[currentLevel];
    level.items[level.index] = value;
    return true;
  }
}
class InclusionTree {
  constructor(width, height, defaultValue) {
    const levelsLength = log2(Math.max(width, height)) + 1;
    this.levels = [];
    for (let i = 0; i < levelsLength; i++) {
      const items = new Uint8Array(width * height);
      for (let j = 0, jj = items.length; j < jj; j++) {
        items[j] = defaultValue;
      }
      const level = {
        width,
        height,
        items
      };
      this.levels.push(level);
      width = Math.ceil(width / 2);
      height = Math.ceil(height / 2);
    }
  }
  reset(i, j, stopValue) {
    let currentLevel = 0;
    while (currentLevel < this.levels.length) {
      const level = this.levels[currentLevel];
      const index = i + j * level.width;
      level.index = index;
      const value = level.items[index];
      if (value === 255) {
        break;
      }
      if (value > stopValue) {
        this.currentLevel = currentLevel;
        this.propagateValues();
        return false;
      }
      i >>= 1;
      j >>= 1;
      currentLevel++;
    }
    this.currentLevel = currentLevel - 1;
    return true;
  }
  incrementValue(stopValue) {
    const level = this.levels[this.currentLevel];
    level.items[level.index] = stopValue + 1;
    this.propagateValues();
  }
  propagateValues() {
    let levelIndex = this.currentLevel;
    let level = this.levels[levelIndex];
    const currentValue = level.items[level.index];
    while (--levelIndex >= 0) {
      level = this.levels[levelIndex];
      level.items[level.index] = currentValue;
    }
  }
  nextLevel() {
    let currentLevel = this.currentLevel;
    let level = this.levels[currentLevel];
    const value = level.items[level.index];
    level.items[level.index] = 255;
    currentLevel--;
    if (currentLevel < 0) {
      return false;
    }
    this.currentLevel = currentLevel;
    level = this.levels[currentLevel];
    level.items[level.index] = value;
    return true;
  }
}
const UNIFORM_CONTEXT = 17;
const RUNLENGTH_CONTEXT = 18;
const LLAndLHContextsLabel = new Uint8Array([
  0,
  5,
  8,
  0,
  3,
  7,
  8,
  0,
  4,
  7,
  8,
  0,
  0,
  0,
  0,
  0,
  1,
  6,
  8,
  0,
  3,
  7,
  8,
  0,
  4,
  7,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  6,
  8,
  0,
  3,
  7,
  8,
  0,
  4,
  7,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  6,
  8,
  0,
  3,
  7,
  8,
  0,
  4,
  7,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  6,
  8,
  0,
  3,
  7,
  8,
  0,
  4,
  7,
  8
]);
const HLContextLabel = new Uint8Array([
  0,
  3,
  4,
  0,
  5,
  7,
  7,
  0,
  8,
  8,
  8,
  0,
  0,
  0,
  0,
  0,
  1,
  3,
  4,
  0,
  6,
  7,
  7,
  0,
  8,
  8,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  3,
  4,
  0,
  6,
  7,
  7,
  0,
  8,
  8,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  3,
  4,
  0,
  6,
  7,
  7,
  0,
  8,
  8,
  8,
  0,
  0,
  0,
  0,
  0,
  2,
  3,
  4,
  0,
  6,
  7,
  7,
  0,
  8,
  8,
  8
]);
const HHContextLabel = new Uint8Array([
  0,
  1,
  2,
  0,
  1,
  2,
  2,
  0,
  2,
  2,
  2,
  0,
  0,
  0,
  0,
  0,
  3,
  4,
  5,
  0,
  4,
  5,
  5,
  0,
  5,
  5,
  5,
  0,
  0,
  0,
  0,
  0,
  6,
  7,
  7,
  0,
  7,
  7,
  7,
  0,
  7,
  7,
  7,
  0,
  0,
  0,
  0,
  0,
  8,
  8,
  8,
  0,
  8,
  8,
  8,
  0,
  8,
  8,
  8,
  0,
  0,
  0,
  0,
  0,
  8,
  8,
  8,
  0,
  8,
  8,
  8,
  0,
  8,
  8,
  8
]);
class BitModel {
  constructor(width, height, subband, zeroBitPlanes, mb, verticallyCausalContext) {
    this.width = width;
    this.height = height;
    this.verticallyCausalContext = verticallyCausalContext;
    let contextLabelTable;
    if (subband === "HH") {
      contextLabelTable = HHContextLabel;
    } else if (subband === "HL") {
      contextLabelTable = HLContextLabel;
    } else {
      contextLabelTable = LLAndLHContextsLabel;
    }
    this.contextLabelTable = contextLabelTable;
    const coefficientCount = width * height;
    this.neighborsSignificance = new Uint8Array(coefficientCount);
    this.coefficentsSign = new Uint8Array(coefficientCount);
    let coefficentsMagnitude;
    if (mb > 14) {
      coefficentsMagnitude = new Uint32Array(coefficientCount);
    } else if (mb > 6) {
      coefficentsMagnitude = new Uint16Array(coefficientCount);
    } else {
      coefficentsMagnitude = new Uint8Array(coefficientCount);
    }
    this.coefficentsMagnitude = coefficentsMagnitude;
    this.processingFlags = new Uint8Array(coefficientCount);
    const bitsDecoded = new Uint8Array(coefficientCount);
    if (zeroBitPlanes !== 0) {
      for (let i = 0; i < coefficientCount; i++) {
        bitsDecoded[i] = zeroBitPlanes;
      }
    }
    this.bitsDecoded = bitsDecoded;
    this.reset();
  }
  setDecoder(decoder) {
    this.decoder = decoder;
  }
  reset() {
    this.contexts = new Int8Array(19);
    this.contexts[0] = 4 << 1 | 0;
    this.contexts[UNIFORM_CONTEXT] = 46 << 1 | 0;
    this.contexts[RUNLENGTH_CONTEXT] = 3 << 1 | 0;
  }
  setNeighborsSignificance(row, column, index) {
    const neighborsSignificance = this.neighborsSignificance;
    const width = this.width;
    const height = this.height;
    const left = column > 0;
    const right = column + 1 < width;
    let i;
    if (row > 0 && !(this.verticallyCausalContext && (row & 3) === 0)) {
      i = index - width;
      if (left) {
        neighborsSignificance[i - 1] += 16;
      }
      if (right) {
        neighborsSignificance[i + 1] += 16;
      }
      neighborsSignificance[i] += 4;
    }
    if (row + 1 < height) {
      i = index + width;
      if (left) {
        neighborsSignificance[i - 1] += 16;
      }
      if (right) {
        neighborsSignificance[i + 1] += 16;
      }
      neighborsSignificance[i] += 4;
    }
    if (left) {
      neighborsSignificance[index - 1] += 1;
    }
    if (right) {
      neighborsSignificance[index + 1] += 1;
    }
    neighborsSignificance[index] |= 128;
  }
  runSignificancePropagationPass() {
    const decoder = this.decoder;
    const width = this.width;
    const height = this.height;
    const coefficentsMagnitude = this.coefficentsMagnitude;
    const coefficentsSign = this.coefficentsSign;
    const neighborsSignificance = this.neighborsSignificance;
    const processingFlags = this.processingFlags;
    const contexts = this.contexts;
    const labels = this.contextLabelTable;
    const bitsDecoded = this.bitsDecoded;
    const processedInverseMask = -2;
    const processedMask = 1;
    const firstMagnitudeBitMask = 2;
    for (let i0 = 0; i0 < height; i0 += 4) {
      for (let j = 0; j < width; j++) {
        let index = i0 * width + j;
        for (let i1 = 0; i1 < 4; i1++, index += width) {
          const i = i0 + i1;
          if (i >= height) {
            break;
          }
          processingFlags[index] &= processedInverseMask;
          if (coefficentsMagnitude[index] || !neighborsSignificance[index]) {
            continue;
          }
          const contextLabel = labels[neighborsSignificance[index]];
          const decision = decoder.readBit(contexts, contextLabel);
          if (decision) {
            const sign = this.decodeSignBit(i, j, index);
            coefficentsSign[index] = sign;
            coefficentsMagnitude[index] = 1;
            this.setNeighborsSignificance(i, j, index);
            processingFlags[index] |= firstMagnitudeBitMask;
          }
          bitsDecoded[index]++;
          processingFlags[index] |= processedMask;
        }
      }
    }
  }
  decodeSignBit(row, column, index) {
    const width = this.width;
    const height = this.height;
    const coefficentsMagnitude = this.coefficentsMagnitude;
    const coefficentsSign = this.coefficentsSign;
    let contribution;
    let sign0;
    let sign1;
    let significance1;
    let contextLabel;
    let decoded;
    significance1 = column > 0 && coefficentsMagnitude[index - 1] !== 0;
    if (column + 1 < width && coefficentsMagnitude[index + 1] !== 0) {
      sign1 = coefficentsSign[index + 1];
      if (significance1) {
        sign0 = coefficentsSign[index - 1];
        contribution = 1 - sign1 - sign0;
      } else {
        contribution = 1 - sign1 - sign1;
      }
    } else if (significance1) {
      sign0 = coefficentsSign[index - 1];
      contribution = 1 - sign0 - sign0;
    } else {
      contribution = 0;
    }
    const horizontalContribution = 3 * contribution;
    const belowInScope = row + 1 < height && !(this.verticallyCausalContext && (row & 3) === 3);
    significance1 = row > 0 && coefficentsMagnitude[index - width] !== 0;
    if (belowInScope && coefficentsMagnitude[index + width] !== 0) {
      sign1 = coefficentsSign[index + width];
      if (significance1) {
        sign0 = coefficentsSign[index - width];
        contribution = 1 - sign1 - sign0 + horizontalContribution;
      } else {
        contribution = 1 - sign1 - sign1 + horizontalContribution;
      }
    } else if (significance1) {
      sign0 = coefficentsSign[index - width];
      contribution = 1 - sign0 - sign0 + horizontalContribution;
    } else {
      contribution = horizontalContribution;
    }
    if (contribution >= 0) {
      contextLabel = 9 + contribution;
      decoded = this.decoder.readBit(this.contexts, contextLabel);
    } else {
      contextLabel = 9 - contribution;
      decoded = this.decoder.readBit(this.contexts, contextLabel) ^ 1;
    }
    return decoded;
  }
  runMagnitudeRefinementPass() {
    const decoder = this.decoder;
    const width = this.width;
    const height = this.height;
    const coefficentsMagnitude = this.coefficentsMagnitude;
    const neighborsSignificance = this.neighborsSignificance;
    const contexts = this.contexts;
    const bitsDecoded = this.bitsDecoded;
    const processingFlags = this.processingFlags;
    const processedMask = 1;
    const firstMagnitudeBitMask = 2;
    const length = width * height;
    const width4 = width * 4;
    for (let index0 = 0, indexNext; index0 < length; index0 = indexNext) {
      indexNext = Math.min(length, index0 + width4);
      for (let j = 0; j < width; j++) {
        for (let index = index0 + j; index < indexNext; index += width) {
          if (!coefficentsMagnitude[index] || (processingFlags[index] & processedMask) !== 0) {
            continue;
          }
          let contextLabel = 16;
          if ((processingFlags[index] & firstMagnitudeBitMask) !== 0) {
            processingFlags[index] ^= firstMagnitudeBitMask;
            const significance = neighborsSignificance[index] & 127;
            contextLabel = significance === 0 ? 15 : 14;
          }
          const bit = decoder.readBit(contexts, contextLabel);
          coefficentsMagnitude[index] = coefficentsMagnitude[index] << 1 | bit;
          bitsDecoded[index]++;
          processingFlags[index] |= processedMask;
        }
      }
    }
  }
  runCleanupPass() {
    const decoder = this.decoder;
    const width = this.width;
    const height = this.height;
    const neighborsSignificance = this.neighborsSignificance;
    const coefficentsMagnitude = this.coefficentsMagnitude;
    const coefficentsSign = this.coefficentsSign;
    const contexts = this.contexts;
    const labels = this.contextLabelTable;
    const bitsDecoded = this.bitsDecoded;
    const processingFlags = this.processingFlags;
    const processedMask = 1;
    const firstMagnitudeBitMask = 2;
    const oneRowDown = width;
    const twoRowsDown = width * 2;
    const threeRowsDown = width * 3;
    let iNext;
    for (let i0 = 0; i0 < height; i0 = iNext) {
      iNext = Math.min(i0 + 4, height);
      const indexBase = i0 * width;
      const checkAllEmpty = i0 + 3 < height;
      for (let j = 0; j < width; j++) {
        const index0 = indexBase + j;
        const allEmpty = checkAllEmpty && processingFlags[index0] === 0 && processingFlags[index0 + oneRowDown] === 0 && processingFlags[index0 + twoRowsDown] === 0 && processingFlags[index0 + threeRowsDown] === 0 && neighborsSignificance[index0] === 0 && neighborsSignificance[index0 + oneRowDown] === 0 && neighborsSignificance[index0 + twoRowsDown] === 0 && neighborsSignificance[index0 + threeRowsDown] === 0;
        let i1 = 0;
        let index = index0;
        let i = i0;
        let sign;
        if (allEmpty) {
          const hasSignificantCoefficent = decoder.readBit(
            contexts,
            RUNLENGTH_CONTEXT
          );
          if (!hasSignificantCoefficent) {
            bitsDecoded[index0]++;
            bitsDecoded[index0 + oneRowDown]++;
            bitsDecoded[index0 + twoRowsDown]++;
            bitsDecoded[index0 + threeRowsDown]++;
            continue;
          }
          i1 = decoder.readBit(contexts, UNIFORM_CONTEXT) << 1 | decoder.readBit(contexts, UNIFORM_CONTEXT);
          if (i1 !== 0) {
            i = i0 + i1;
            index += i1 * width;
          }
          sign = this.decodeSignBit(i, j, index);
          coefficentsSign[index] = sign;
          coefficentsMagnitude[index] = 1;
          this.setNeighborsSignificance(i, j, index);
          processingFlags[index] |= firstMagnitudeBitMask;
          index = index0;
          for (let i2 = i0; i2 <= i; i2++, index += width) {
            bitsDecoded[index]++;
          }
          i1++;
        }
        for (i = i0 + i1; i < iNext; i++, index += width) {
          if (coefficentsMagnitude[index] || (processingFlags[index] & processedMask) !== 0) {
            continue;
          }
          const contextLabel = labels[neighborsSignificance[index]];
          const decision = decoder.readBit(contexts, contextLabel);
          if (decision === 1) {
            sign = this.decodeSignBit(i, j, index);
            coefficentsSign[index] = sign;
            coefficentsMagnitude[index] = 1;
            this.setNeighborsSignificance(i, j, index);
            processingFlags[index] |= firstMagnitudeBitMask;
          }
          bitsDecoded[index]++;
        }
      }
    }
  }
  checkSegmentationSymbol() {
    const decoder = this.decoder;
    const contexts = this.contexts;
    decoder.readBit(contexts, UNIFORM_CONTEXT);
    decoder.readBit(contexts, UNIFORM_CONTEXT);
    decoder.readBit(contexts, UNIFORM_CONTEXT);
    decoder.readBit(contexts, UNIFORM_CONTEXT);
  }
}
class Transform {
  calculate(subbands) {
    let ll = subbands[0];
    for (let i = 1, ii = subbands.length; i < ii; i++) {
      ll = this.iterate(ll, subbands[i]);
    }
    return ll;
  }
  extend(buffer, offset, size) {
    let i1 = offset - 1;
    let j1 = offset + 1;
    let i2 = offset + size - 2;
    let j2 = offset + size;
    buffer[i1--] = buffer[j1++];
    buffer[j2++] = buffer[i2--];
    buffer[i1--] = buffer[j1++];
    buffer[j2++] = buffer[i2--];
    buffer[i1--] = buffer[j1++];
    buffer[j2++] = buffer[i2--];
    buffer[i1] = buffer[j1];
    buffer[j2] = buffer[i2];
  }
  iterate(ll, hl_lh_hh) {
    const llWidth = ll.width;
    const llHeight = ll.height;
    let llItems = ll.items;
    const width = hl_lh_hh.width;
    const height = hl_lh_hh.height;
    const items = hl_lh_hh.items;
    const xParity = hl_lh_hh.u0 & 1;
    const yParity = hl_lh_hh.v0 & 1;
    let i;
    let j;
    let k;
    let l;
    let u;
    let v;
    for (k = 0, i = 0; i < llHeight; i++) {
      l = (2 * i + yParity) * width + xParity;
      for (j = 0; j < llWidth; j++, k++, l += 2) {
        items[l] = llItems[k];
      }
    }
    llItems = ll.items = null;
    const bufferPadding = 4;
    const rowBuffer = new Float32Array(width + 2 * bufferPadding);
    if (width === 1) {
      if (xParity !== 0) {
        for (v = 0, k = 0; v < height; v++, k += width) {
          items[k] *= 0.5;
        }
      }
    } else {
      for (v = 0, k = 0; v < height; v++, k += width) {
        rowBuffer.set(items.subarray(k, k + width), bufferPadding);
        this.extend(rowBuffer, bufferPadding, width);
        this.filter(rowBuffer, bufferPadding, width, xParity);
        items.set(
          rowBuffer.subarray(bufferPadding, bufferPadding + width),
          k
        );
      }
    }
    let numBuffers = 16;
    const colBuffers = [];
    for (i = 0; i < numBuffers; i++) {
      colBuffers.push(new Float32Array(height + 2 * bufferPadding));
    }
    let b;
    let currentBuffer = 0;
    const ll_ = bufferPadding + height;
    if (height === 1) {
      if (yParity !== 0) {
        for (u = 0; u < width; u++) {
          items[u] *= 0.5;
        }
      }
    } else {
      for (u = 0; u < width; u++) {
        if (currentBuffer === 0) {
          numBuffers = Math.min(width - u, numBuffers);
          for (k = u, l = bufferPadding; l < ll_; k += width, l++) {
            for (b = 0; b < numBuffers; b++) {
              colBuffers[b][l] = items[k + b];
            }
          }
          currentBuffer = numBuffers;
        }
        currentBuffer--;
        const buffer = colBuffers[currentBuffer];
        this.extend(buffer, bufferPadding, height);
        this.filter(buffer, bufferPadding, height, yParity);
        if (currentBuffer === 0) {
          k = u - numBuffers + 1;
          for (l = bufferPadding; l < ll_; k += width, l++) {
            for (b = 0; b < numBuffers; b++) {
              items[k + b] = colBuffers[b][l];
            }
          }
        }
      }
    }
    return {
      width,
      height,
      items
    };
  }
}
class IrreversibleTransform extends Transform {
  // i0Parity = parity of the first coefficient's reference-grid index.
  // An odd start shifts every lifting step.
  filter(x, offset, length, i0Parity) {
    offset |= 0;
    i0Parity &= 1;
    const i1Parity = i0Parity + length & 1;
    const m = length - i1Parity + i0Parity >> 1;
    const o = offset - i0Parity;
    let j;
    let n;
    let current;
    let next;
    const alpha = -1.586134342059924;
    const beta = -0.052980118572961;
    const gamma = 0.882911075530934;
    const delta = 0.443506852043971;
    const K = 1.230174104914001;
    const K_ = 1 / K;
    j = o - 3;
    for (n = m + 4; n--; j += 2) {
      x[j] *= K_;
    }
    j = o - 2;
    current = delta * x[j - 1];
    for (n = m + 3; n--; j += 2) {
      next = delta * x[j + 1];
      x[j] = K * x[j] - current - next;
      if (n--) {
        j += 2;
        current = delta * x[j + 1];
        x[j] = K * x[j] - current - next;
      } else {
        break;
      }
    }
    j = o - 1;
    current = gamma * x[j - 1];
    for (n = m + 2; n--; j += 2) {
      next = gamma * x[j + 1];
      x[j] -= current + next;
      if (n--) {
        j += 2;
        current = gamma * x[j + 1];
        x[j] -= current + next;
      } else {
        break;
      }
    }
    j = o;
    current = beta * x[j - 1];
    for (n = m + 1; n--; j += 2) {
      next = beta * x[j + 1];
      x[j] -= current + next;
      if (n--) {
        j += 2;
        current = beta * x[j + 1];
        x[j] -= current + next;
      } else {
        break;
      }
    }
    if (m !== 0) {
      j = o + 1;
      current = alpha * x[j - 1];
      for (n = m; n--; j += 2) {
        next = alpha * x[j + 1];
        x[j] -= current + next;
        if (n--) {
          j += 2;
          current = alpha * x[j + 1];
          x[j] -= current + next;
        } else {
          break;
        }
      }
    }
  }
}
class ReversibleTransform extends Transform {
  // i0Parity = parity of the first coefficient's reference-grid index.
  // An odd start shifts the lifting updates left by one.
  filter(x, offset, length, i0Parity) {
    offset |= 0;
    i0Parity &= 1;
    const i1Parity = i0Parity + length & 1;
    const m = length - i1Parity + i0Parity >> 1;
    let j;
    let n;
    for (j = offset - i0Parity, n = m + 1; n--; j += 2) {
      x[j] -= x[j - 1] + x[j + 1] + 2 >> 2;
    }
    for (j = offset + 1 - i0Parity, n = m; n--; j += 2) {
      x[j] += x[j - 1] + x[j + 1] >> 1;
    }
  }
}
export {
  decodeJPX
};
//# sourceMappingURL=decodeJPX-CqZ_Ue9s.js.map
