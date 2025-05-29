var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/gifenc/dist/gifenc.js
var require_gifenc = __commonJS({
  "node_modules/gifenc/dist/gifenc.js"(exports) {
    var __defProp2 = Object.defineProperty;
    var __markAsModule = (target) => __defProp2(target, "__esModule", { value: true });
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    __markAsModule(exports);
    __export(exports, {
      GIFEncoder: () => GIFEncoder2,
      applyPalette: () => applyPalette2,
      default: () => src_default,
      nearestColor: () => nearestColor,
      nearestColorIndex: () => nearestColorIndex,
      nearestColorIndexWithDistance: () => nearestColorIndexWithDistance,
      prequantize: () => prequantize,
      quantize: () => quantize2,
      snapColorsToPalette: () => snapColorsToPalette
    });
    var constants_default = {
      signature: "GIF",
      version: "89a",
      trailer: 59,
      extensionIntroducer: 33,
      applicationExtensionLabel: 255,
      graphicControlExtensionLabel: 249,
      imageSeparator: 44,
      signatureSize: 3,
      versionSize: 3,
      globalColorTableFlagMask: 128,
      colorResolutionMask: 112,
      sortFlagMask: 8,
      globalColorTableSizeMask: 7,
      applicationIdentifierSize: 8,
      applicationAuthCodeSize: 3,
      disposalMethodMask: 28,
      userInputFlagMask: 2,
      transparentColorFlagMask: 1,
      localColorTableFlagMask: 128,
      interlaceFlagMask: 64,
      idSortFlagMask: 32,
      localColorTableSizeMask: 7
    };
    function createStream(initialCapacity = 256) {
      let cursor = 0;
      let contents = new Uint8Array(initialCapacity);
      return {
        get buffer() {
          return contents.buffer;
        },
        reset() {
          cursor = 0;
        },
        bytesView() {
          return contents.subarray(0, cursor);
        },
        bytes() {
          return contents.slice(0, cursor);
        },
        writeByte(byte) {
          expand(cursor + 1);
          contents[cursor] = byte;
          cursor++;
        },
        writeBytes(data, offset = 0, byteLength = data.length) {
          expand(cursor + byteLength);
          for (let i = 0; i < byteLength; i++) {
            contents[cursor++] = data[i + offset];
          }
        },
        writeBytesView(data, offset = 0, byteLength = data.byteLength) {
          expand(cursor + byteLength);
          contents.set(data.subarray(offset, offset + byteLength), cursor);
          cursor += byteLength;
        }
      };
      function expand(newCapacity) {
        var prevCapacity = contents.length;
        if (prevCapacity >= newCapacity)
          return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
          newCapacity = Math.max(newCapacity, 256);
        const oldContents = contents;
        contents = new Uint8Array(newCapacity);
        if (cursor > 0)
          contents.set(oldContents.subarray(0, cursor), 0);
      }
    }
    var BITS = 12;
    var DEFAULT_HSIZE = 5003;
    var MASKS = [
      0,
      1,
      3,
      7,
      15,
      31,
      63,
      127,
      255,
      511,
      1023,
      2047,
      4095,
      8191,
      16383,
      32767,
      65535
    ];
    function lzwEncode(width, height, pixels, colorDepth, outStream = createStream(512), accum = new Uint8Array(256), htab = new Int32Array(DEFAULT_HSIZE), codetab = new Int32Array(DEFAULT_HSIZE)) {
      const hsize = htab.length;
      const initCodeSize = Math.max(2, colorDepth);
      accum.fill(0);
      codetab.fill(0);
      htab.fill(-1);
      let cur_accum = 0;
      let cur_bits = 0;
      const init_bits = initCodeSize + 1;
      const g_init_bits = init_bits;
      let clear_flg = false;
      let n_bits = g_init_bits;
      let maxcode = (1 << n_bits) - 1;
      const ClearCode = 1 << init_bits - 1;
      const EOFCode = ClearCode + 1;
      let free_ent = ClearCode + 2;
      let a_count = 0;
      let ent = pixels[0];
      let hshift = 0;
      for (let fcode = hsize; fcode < 65536; fcode *= 2) {
        ++hshift;
      }
      hshift = 8 - hshift;
      outStream.writeByte(initCodeSize);
      output(ClearCode);
      const length = pixels.length;
      for (let idx = 1; idx < length; idx++) {
        next_block: {
          const c = pixels[idx];
          const fcode = (c << BITS) + ent;
          let i = c << hshift ^ ent;
          if (htab[i] === fcode) {
            ent = codetab[i];
            break next_block;
          }
          const disp = i === 0 ? 1 : hsize - i;
          while (htab[i] >= 0) {
            i -= disp;
            if (i < 0)
              i += hsize;
            if (htab[i] === fcode) {
              ent = codetab[i];
              break next_block;
            }
          }
          output(ent);
          ent = c;
          if (free_ent < 1 << BITS) {
            codetab[i] = free_ent++;
            htab[i] = fcode;
          } else {
            htab.fill(-1);
            free_ent = ClearCode + 2;
            clear_flg = true;
            output(ClearCode);
          }
        }
      }
      output(ent);
      output(EOFCode);
      outStream.writeByte(0);
      return outStream.bytesView();
      function output(code) {
        cur_accum &= MASKS[cur_bits];
        if (cur_bits > 0)
          cur_accum |= code << cur_bits;
        else
          cur_accum = code;
        cur_bits += n_bits;
        while (cur_bits >= 8) {
          accum[a_count++] = cur_accum & 255;
          if (a_count >= 254) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        if (free_ent > maxcode || clear_flg) {
          if (clear_flg) {
            n_bits = g_init_bits;
            maxcode = (1 << n_bits) - 1;
            clear_flg = false;
          } else {
            ++n_bits;
            maxcode = n_bits === BITS ? 1 << n_bits : (1 << n_bits) - 1;
          }
        }
        if (code == EOFCode) {
          while (cur_bits > 0) {
            accum[a_count++] = cur_accum & 255;
            if (a_count >= 254) {
              outStream.writeByte(a_count);
              outStream.writeBytesView(accum, 0, a_count);
              a_count = 0;
            }
            cur_accum >>= 8;
            cur_bits -= 8;
          }
          if (a_count > 0) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
        }
      }
    }
    var lzwEncode_default = lzwEncode;
    function rgb888_to_rgb565(r, g, b) {
      return r << 8 & 63488 | g << 2 & 992 | b >> 3;
    }
    function rgba8888_to_rgba4444(r, g, b, a) {
      return r >> 4 | g & 240 | (b & 240) << 4 | (a & 240) << 8;
    }
    function rgb888_to_rgb444(r, g, b) {
      return r >> 4 << 8 | g & 240 | b >> 4;
    }
    function clamp(value, min, max) {
      return value < min ? min : value > max ? max : value;
    }
    function sqr(value) {
      return value * value;
    }
    function find_nn(bins, idx, hasAlpha) {
      var nn = 0;
      var err = 1e100;
      const bin1 = bins[idx];
      const n1 = bin1.cnt;
      const wa = bin1.ac;
      const wr = bin1.rc;
      const wg = bin1.gc;
      const wb = bin1.bc;
      for (var i = bin1.fw; i != 0; i = bins[i].fw) {
        const bin = bins[i];
        const n2 = bin.cnt;
        const nerr2 = n1 * n2 / (n1 + n2);
        if (nerr2 >= err)
          continue;
        var nerr = 0;
        if (hasAlpha) {
          nerr += nerr2 * sqr(bin.ac - wa);
          if (nerr >= err)
            continue;
        }
        nerr += nerr2 * sqr(bin.rc - wr);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.gc - wg);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.bc - wb);
        if (nerr >= err)
          continue;
        err = nerr;
        nn = i;
      }
      bin1.err = err;
      bin1.nn = nn;
    }
    function create_bin() {
      return {
        ac: 0,
        rc: 0,
        gc: 0,
        bc: 0,
        cnt: 0,
        nn: 0,
        fw: 0,
        bk: 0,
        tm: 0,
        mtm: 0,
        err: 0
      };
    }
    function create_bin_list(data, format) {
      const bincount = format === "rgb444" ? 4096 : 65536;
      const bins = new Array(bincount);
      const size = data.length;
      if (format === "rgba4444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgba8888_to_rgba4444(r, g, b, a);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.ac += a;
          bin.cnt++;
        }
      } else if (format === "rgb444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb444(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      } else {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb565(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      }
      return bins;
    }
    function quantize2(rgba, maxColors, opts = {}) {
      const {
        format = "rgb565",
        clearAlpha = true,
        clearAlphaColor = 0,
        clearAlphaThreshold = 0,
        oneBitAlpha = false
      } = opts;
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      const data = new Uint32Array(rgba.buffer);
      let useSqrt = opts.useSqrt !== false;
      const hasAlpha = format === "rgba4444";
      const bins = create_bin_list(data, format);
      const bincount = bins.length;
      const bincountMinusOne = bincount - 1;
      const heap = new Uint32Array(bincount + 1);
      var maxbins = 0;
      for (var i = 0; i < bincount; ++i) {
        const bin = bins[i];
        if (bin != null) {
          var d = 1 / bin.cnt;
          if (hasAlpha)
            bin.ac *= d;
          bin.rc *= d;
          bin.gc *= d;
          bin.bc *= d;
          bins[maxbins++] = bin;
        }
      }
      if (sqr(maxColors) / maxbins < 0.022) {
        useSqrt = false;
      }
      var i = 0;
      for (; i < maxbins - 1; ++i) {
        bins[i].fw = i + 1;
        bins[i + 1].bk = i;
        if (useSqrt)
          bins[i].cnt = Math.sqrt(bins[i].cnt);
      }
      if (useSqrt)
        bins[i].cnt = Math.sqrt(bins[i].cnt);
      var h, l, l2;
      for (i = 0; i < maxbins; ++i) {
        find_nn(bins, i, false);
        var err = bins[i].err;
        for (l = ++heap[0]; l > 1; l = l2) {
          l2 = l >> 1;
          if (bins[h = heap[l2]].err <= err)
            break;
          heap[l] = h;
        }
        heap[l] = i;
      }
      var extbins = maxbins - maxColors;
      for (i = 0; i < extbins; ) {
        var tb;
        for (; ; ) {
          var b1 = heap[1];
          tb = bins[b1];
          if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm)
            break;
          if (tb.mtm == bincountMinusOne)
            b1 = heap[1] = heap[heap[0]--];
          else {
            find_nn(bins, b1, false);
            tb.tm = i;
          }
          var err = bins[b1].err;
          for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
            if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
              l2++;
            if (err <= bins[h = heap[l2]].err)
              break;
            heap[l] = h;
          }
          heap[l] = b1;
        }
        var nb = bins[tb.nn];
        var n1 = tb.cnt;
        var n2 = nb.cnt;
        var d = 1 / (n1 + n2);
        if (hasAlpha)
          tb.ac = d * (n1 * tb.ac + n2 * nb.ac);
        tb.rc = d * (n1 * tb.rc + n2 * nb.rc);
        tb.gc = d * (n1 * tb.gc + n2 * nb.gc);
        tb.bc = d * (n1 * tb.bc + n2 * nb.bc);
        tb.cnt += nb.cnt;
        tb.mtm = ++i;
        bins[nb.bk].fw = nb.fw;
        bins[nb.fw].bk = nb.bk;
        nb.mtm = bincountMinusOne;
      }
      let palette = [];
      var k = 0;
      for (i = 0; ; ++k) {
        let r = clamp(Math.round(bins[i].rc), 0, 255);
        let g = clamp(Math.round(bins[i].gc), 0, 255);
        let b = clamp(Math.round(bins[i].bc), 0, 255);
        let a = 255;
        if (hasAlpha) {
          a = clamp(Math.round(bins[i].ac), 0, 255);
          if (oneBitAlpha) {
            const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
            a = a <= threshold ? 0 : 255;
          }
          if (clearAlpha && a <= clearAlphaThreshold) {
            r = g = b = clearAlphaColor;
            a = 0;
          }
        }
        const color = hasAlpha ? [r, g, b, a] : [r, g, b];
        const exists = existsInPalette(palette, color);
        if (!exists)
          palette.push(color);
        if ((i = bins[i].fw) == 0)
          break;
      }
      return palette;
    }
    function existsInPalette(palette, color) {
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        let matchesRGB = p[0] === color[0] && p[1] === color[1] && p[2] === color[2];
        let matchesAlpha = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true;
        if (matchesRGB && matchesAlpha)
          return true;
      }
      return false;
    }
    function euclideanDistanceSquared(a, b) {
      var sum = 0;
      var n;
      for (n = 0; n < a.length; n++) {
        const dx = a[n] - b[n];
        sum += dx * dx;
      }
      return sum;
    }
    function roundStep(byte, step) {
      return step > 1 ? Math.round(byte / step) * step : byte;
    }
    function prequantize(rgba, { roundRGB = 5, roundAlpha = 10, oneBitAlpha = null } = {}) {
      const data = new Uint32Array(rgba.buffer);
      for (let i = 0; i < data.length; i++) {
        const color = data[i];
        let a = color >> 24 & 255;
        let b = color >> 16 & 255;
        let g = color >> 8 & 255;
        let r = color & 255;
        a = roundStep(a, roundAlpha);
        if (oneBitAlpha) {
          const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
          a = a <= threshold ? 0 : 255;
        }
        r = roundStep(r, roundRGB);
        g = roundStep(g, roundRGB);
        b = roundStep(b, roundRGB);
        data[i] = a << 24 | b << 16 | g << 8 | r << 0;
      }
    }
    function applyPalette2(rgba, palette, format = "rgb565") {
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (palette.length > 256) {
        throw new Error("applyPalette() only works with 256 colors or less");
      }
      const data = new Uint32Array(rgba.buffer);
      const length = data.length;
      const bincount = format === "rgb444" ? 4096 : 65536;
      const index = new Uint8Array(length);
      const cache = new Array(bincount);
      const hasAlpha = format === "rgba4444";
      if (format === "rgba4444") {
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgba8888_to_rgba4444(r, g, b, a);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
          index[i] = idx;
        }
      } else {
        const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgb888_to_key(r, g, b);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
          index[i] = idx;
        }
      }
      return index;
    }
    function nearestColorIndexRGBA(r, g, b, a, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const a2 = px2[3];
        let curdist = sqr2(a2 - a);
        if (curdist > mindist)
          continue;
        const r2 = px2[0];
        curdist += sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function nearestColorIndexRGB(r, g, b, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const r2 = px2[0];
        let curdist = sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function snapColorsToPalette(palette, knownColors, threshold = 5) {
      if (!palette.length || !knownColors.length)
        return;
      const paletteRGB = palette.map((p) => p.slice(0, 3));
      const thresholdSq = threshold * threshold;
      const dim = palette[0].length;
      for (let i = 0; i < knownColors.length; i++) {
        let color = knownColors[i];
        if (color.length < dim) {
          color = [color[0], color[1], color[2], 255];
        } else if (color.length > dim) {
          color = color.slice(0, 3);
        } else {
          color = color.slice();
        }
        const r = nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), euclideanDistanceSquared);
        const idx = r[0];
        const distanceSq = r[1];
        if (distanceSq > 0 && distanceSq <= thresholdSq) {
          palette[idx] = color;
        }
      }
    }
    function sqr2(a) {
      return a * a;
    }
    function nearestColorIndex(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return minDistIndex;
    }
    function nearestColorIndexWithDistance(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return [minDistIndex, minDist];
    }
    function nearestColor(colors, pixel, distanceFn = euclideanDistanceSquared) {
      return colors[nearestColorIndex(colors, pixel, distanceFn)];
    }
    function GIFEncoder2(opt = {}) {
      const { initialCapacity = 4096, auto = true } = opt;
      const stream = createStream(initialCapacity);
      const HSIZE = 5003;
      const accum = new Uint8Array(256);
      const htab = new Int32Array(HSIZE);
      const codetab = new Int32Array(HSIZE);
      let hasInit = false;
      return {
        reset() {
          stream.reset();
          hasInit = false;
        },
        finish() {
          stream.writeByte(constants_default.trailer);
        },
        bytes() {
          return stream.bytes();
        },
        bytesView() {
          return stream.bytesView();
        },
        get buffer() {
          return stream.buffer;
        },
        get stream() {
          return stream;
        },
        writeHeader,
        writeFrame(index, width, height, opts = {}) {
          const {
            transparent = false,
            transparentIndex = 0,
            delay = 0,
            palette = null,
            repeat = 0,
            colorDepth = 8,
            dispose = -1
          } = opts;
          let first = false;
          if (auto) {
            if (!hasInit) {
              first = true;
              writeHeader();
              hasInit = true;
            }
          } else {
            first = Boolean(opts.first);
          }
          width = Math.max(0, Math.floor(width));
          height = Math.max(0, Math.floor(height));
          if (first) {
            if (!palette) {
              throw new Error("First frame must include a { palette } option");
            }
            encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth);
            encodeColorTable(stream, palette);
            if (repeat >= 0) {
              encodeNetscapeExt(stream, repeat);
            }
          }
          const delayTime = Math.round(delay / 10);
          encodeGraphicControlExt(stream, dispose, delayTime, transparent, transparentIndex);
          const useLocalColorTable = Boolean(palette) && !first;
          encodeImageDescriptor(stream, width, height, useLocalColorTable ? palette : null);
          if (useLocalColorTable)
            encodeColorTable(stream, palette);
          encodePixels(stream, index, width, height, colorDepth, accum, htab, codetab);
        }
      };
      function writeHeader() {
        writeUTFBytes(stream, "GIF89a");
      }
    }
    function encodeGraphicControlExt(stream, dispose, delay, transparent, transparentIndex) {
      stream.writeByte(33);
      stream.writeByte(249);
      stream.writeByte(4);
      if (transparentIndex < 0) {
        transparentIndex = 0;
        transparent = false;
      }
      var transp, disp;
      if (!transparent) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }
      if (dispose >= 0) {
        disp = dispose & 7;
      }
      disp <<= 2;
      const userInput = 0;
      stream.writeByte(0 | disp | userInput | transp);
      writeUInt16(stream, delay);
      stream.writeByte(transparentIndex || 0);
      stream.writeByte(0);
    }
    function encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth = 8) {
      const globalColorTableFlag = 1;
      const sortFlag = 0;
      const globalColorTableSize = colorTableSize(palette.length) - 1;
      const fields = globalColorTableFlag << 7 | colorDepth - 1 << 4 | sortFlag << 3 | globalColorTableSize;
      const backgroundColorIndex = 0;
      const pixelAspectRatio = 0;
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      stream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio]);
    }
    function encodeNetscapeExt(stream, repeat) {
      stream.writeByte(33);
      stream.writeByte(255);
      stream.writeByte(11);
      writeUTFBytes(stream, "NETSCAPE2.0");
      stream.writeByte(3);
      stream.writeByte(1);
      writeUInt16(stream, repeat);
      stream.writeByte(0);
    }
    function encodeColorTable(stream, palette) {
      const colorTableLength = 1 << colorTableSize(palette.length);
      for (let i = 0; i < colorTableLength; i++) {
        let color = [0, 0, 0];
        if (i < palette.length) {
          color = palette[i];
        }
        stream.writeByte(color[0]);
        stream.writeByte(color[1]);
        stream.writeByte(color[2]);
      }
    }
    function encodeImageDescriptor(stream, width, height, localPalette) {
      stream.writeByte(44);
      writeUInt16(stream, 0);
      writeUInt16(stream, 0);
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      if (localPalette) {
        const interlace = 0;
        const sorted = 0;
        const palSize = colorTableSize(localPalette.length) - 1;
        stream.writeByte(128 | interlace | sorted | 0 | palSize);
      } else {
        stream.writeByte(0);
      }
    }
    function encodePixels(stream, index, width, height, colorDepth = 8, accum, htab, codetab) {
      lzwEncode_default(width, height, index, colorDepth, stream, accum, htab, codetab);
    }
    function writeUInt16(stream, short) {
      stream.writeByte(short & 255);
      stream.writeByte(short >> 8 & 255);
    }
    function writeUTFBytes(stream, text) {
      for (var i = 0; i < text.length; i++) {
        stream.writeByte(text.charCodeAt(i));
      }
    }
    function colorTableSize(length) {
      return Math.max(Math.ceil(Math.log2(length)), 1);
    }
    var src_default = GIFEncoder2;
  }
});

// src/lib/config.ts
var Config = class {
  constructor(id) {
    this.id = id;
    this.config = {};
    this.filename = `${id}.config.json`;
    this.filepath = `${tiled.extensionsPath}\\${this.filename}`;
    this.config = this.read();
    tiled.log(`[${this.id}->Config] Config loaded from ${this.filepath}`);
  }
  set(key, value) {
    this.config[key] = value;
    tiled.log(`[${this.id}->Config] Set config key "${key}" to "${value}"`);
    this.save();
    return value;
  }
  get(key) {
    return this.config[key];
  }
  save() {
    const file = new TextFile(this.filepath, TextFile.ReadWrite);
    file.truncate();
    file.write(JSON.stringify(this.config, null, 4));
    file.commit();
    tiled.log(`[${this.id}->Config] Config saved to ${this.filepath}`);
  }
  read() {
    try {
      const file = new TextFile(this.filepath, TextFile.ReadOnly);
      const content = file.readAll();
      file.close();
      return JSON.parse(content);
    } catch (e) {
      tiled.log(`[${this.id}->Config] No config file found at ${this.filepath}, creating a new one.`);
      this.save();
      return {};
    }
  }
};

// src/lib/utils.ts
function isTileMap(asset) {
  return asset.assetType === AssetType.TileMap;
}
function padStart(str, length, padChar = "0") {
  if (str.length >= length) return str;
  const padding = padChar.repeat(length - str.length);
  return padding + str;
}
function lastElement(arr) {
  if (arr.length === 0) return void 0;
  return arr[arr.length - 1];
}
function extractARGB(color) {
  return {
    a: color >>> 24 & 255,
    r: color >>> 16 & 255,
    g: color >>> 8 & 255,
    b: color & 255
  };
}
function md5(e) {
  function h(a2, b2) {
    var c2, d2, e2, f2, g;
    e2 = a2 & 2147483648;
    f2 = b2 & 2147483648;
    c2 = a2 & 1073741824;
    d2 = b2 & 1073741824;
    g = (a2 & 1073741823) + (b2 & 1073741823);
    return c2 & d2 ? g ^ 2147483648 ^ e2 ^ f2 : c2 | d2 ? g & 1073741824 ? g ^ 3221225472 ^ e2 ^ f2 : g ^ 1073741824 ^ e2 ^ f2 : g ^ e2 ^ f2;
  }
  function k(a2, b2, c2, d2, e2, f2, g) {
    a2 = h(a2, h(h(b2 & c2 | ~b2 & d2, e2), g));
    return h(a2 << f2 | a2 >>> 32 - f2, b2);
  }
  function l(a2, b2, c2, d2, e2, f2, g) {
    a2 = h(a2, h(h(b2 & d2 | c2 & ~d2, e2), g));
    return h(a2 << f2 | a2 >>> 32 - f2, b2);
  }
  function m(a2, b2, c2, d2, e2, f2, g) {
    a2 = h(a2, h(h(b2 ^ d2 ^ c2, e2), g));
    return h(a2 << f2 | a2 >>> 32 - f2, b2);
  }
  function n(a2, b2, c2, d2, e2, f2, g) {
    a2 = h(a2, h(h(d2 ^ (b2 | ~c2), e2), g));
    return h(a2 << f2 | a2 >>> 32 - f2, b2);
  }
  function p(a2) {
    var b2 = "", d2 = "", c2;
    for (c2 = 0; 3 >= c2; c2++) d2 = a2 >>> 8 * c2 & 255, d2 = "0" + d2.toString(16), b2 += d2.substr(d2.length - 2, 2);
    return b2;
  }
  var f = [], q, r, s, t, a, b, c, d;
  e = function(a2) {
    a2 = a2.replace(/\r\n/g, "\n");
    for (var b2 = "", d2 = 0; d2 < a2.length; d2++) {
      var c2 = a2.charCodeAt(d2);
      128 > c2 ? b2 += String.fromCharCode(c2) : (127 < c2 && 2048 > c2 ? b2 += String.fromCharCode(c2 >> 6 | 192) : (b2 += String.fromCharCode(c2 >> 12 | 224), b2 += String.fromCharCode(c2 >> 6 & 63 | 128)), b2 += String.fromCharCode(c2 & 63 | 128));
    }
    return b2;
  }(e);
  f = function(b2) {
    var a2, c2 = b2.length;
    a2 = c2 + 8;
    for (var d2 = 16 * ((a2 - a2 % 64) / 64 + 1), e2 = Array(d2 - 1), f2 = 0, g = 0; g < c2; ) a2 = (g - g % 4) / 4, f2 = g % 4 * 8, e2[a2] |= b2.charCodeAt(g) << f2, g++;
    a2 = (g - g % 4) / 4;
    e2[a2] |= 128 << g % 4 * 8;
    e2[d2 - 2] = c2 << 3;
    e2[d2 - 1] = c2 >>> 29;
    return e2;
  }(e);
  a = 1732584193;
  b = 4023233417;
  c = 2562383102;
  d = 271733878;
  for (let e2 = 0; e2 < f.length; e2 += 16) q = a, r = b, s = c, t = d, a = k(a, b, c, d, f[e2 + 0], 7, 3614090360), d = k(d, a, b, c, f[e2 + 1], 12, 3905402710), c = k(c, d, a, b, f[e2 + 2], 17, 606105819), b = k(b, c, d, a, f[e2 + 3], 22, 3250441966), a = k(a, b, c, d, f[e2 + 4], 7, 4118548399), d = k(d, a, b, c, f[e2 + 5], 12, 1200080426), c = k(c, d, a, b, f[e2 + 6], 17, 2821735955), b = k(b, c, d, a, f[e2 + 7], 22, 4249261313), a = k(a, b, c, d, f[e2 + 8], 7, 1770035416), d = k(d, a, b, c, f[e2 + 9], 12, 2336552879), c = k(c, d, a, b, f[e2 + 10], 17, 4294925233), b = k(b, c, d, a, f[e2 + 11], 22, 2304563134), a = k(a, b, c, d, f[e2 + 12], 7, 1804603682), d = k(d, a, b, c, f[e2 + 13], 12, 4254626195), c = k(c, d, a, b, f[e2 + 14], 17, 2792965006), b = k(b, c, d, a, f[e2 + 15], 22, 1236535329), a = l(a, b, c, d, f[e2 + 1], 5, 4129170786), d = l(d, a, b, c, f[e2 + 6], 9, 3225465664), c = l(c, d, a, b, f[e2 + 11], 14, 643717713), b = l(b, c, d, a, f[e2 + 0], 20, 3921069994), a = l(a, b, c, d, f[e2 + 5], 5, 3593408605), d = l(d, a, b, c, f[e2 + 10], 9, 38016083), c = l(c, d, a, b, f[e2 + 15], 14, 3634488961), b = l(b, c, d, a, f[e2 + 4], 20, 3889429448), a = l(a, b, c, d, f[e2 + 9], 5, 568446438), d = l(d, a, b, c, f[e2 + 14], 9, 3275163606), c = l(c, d, a, b, f[e2 + 3], 14, 4107603335), b = l(b, c, d, a, f[e2 + 8], 20, 1163531501), a = l(a, b, c, d, f[e2 + 13], 5, 2850285829), d = l(d, a, b, c, f[e2 + 2], 9, 4243563512), c = l(c, d, a, b, f[e2 + 7], 14, 1735328473), b = l(b, c, d, a, f[e2 + 12], 20, 2368359562), a = m(a, b, c, d, f[e2 + 5], 4, 4294588738), d = m(d, a, b, c, f[e2 + 8], 11, 2272392833), c = m(c, d, a, b, f[e2 + 11], 16, 1839030562), b = m(b, c, d, a, f[e2 + 14], 23, 4259657740), a = m(a, b, c, d, f[e2 + 1], 4, 2763975236), d = m(d, a, b, c, f[e2 + 4], 11, 1272893353), c = m(c, d, a, b, f[e2 + 7], 16, 4139469664), b = m(b, c, d, a, f[e2 + 10], 23, 3200236656), a = m(a, b, c, d, f[e2 + 13], 4, 681279174), d = m(d, a, b, c, f[e2 + 0], 11, 3936430074), c = m(c, d, a, b, f[e2 + 3], 16, 3572445317), b = m(b, c, d, a, f[e2 + 6], 23, 76029189), a = m(a, b, c, d, f[e2 + 9], 4, 3654602809), d = m(d, a, b, c, f[e2 + 12], 11, 3873151461), c = m(c, d, a, b, f[e2 + 15], 16, 530742520), b = m(b, c, d, a, f[e2 + 2], 23, 3299628645), a = n(a, b, c, d, f[e2 + 0], 6, 4096336452), d = n(d, a, b, c, f[e2 + 7], 10, 1126891415), c = n(c, d, a, b, f[e2 + 14], 15, 2878612391), b = n(b, c, d, a, f[e2 + 5], 21, 4237533241), a = n(a, b, c, d, f[e2 + 12], 6, 1700485571), d = n(d, a, b, c, f[e2 + 3], 10, 2399980690), c = n(c, d, a, b, f[e2 + 10], 15, 4293915773), b = n(b, c, d, a, f[e2 + 1], 21, 2240044497), a = n(a, b, c, d, f[e2 + 8], 6, 1873313359), d = n(d, a, b, c, f[e2 + 15], 10, 4264355552), c = n(c, d, a, b, f[e2 + 6], 15, 2734768916), b = n(b, c, d, a, f[e2 + 13], 21, 1309151649), a = n(a, b, c, d, f[e2 + 4], 6, 4149444226), d = n(d, a, b, c, f[e2 + 11], 10, 3174756917), c = n(c, d, a, b, f[e2 + 2], 15, 718787259), b = n(b, c, d, a, f[e2 + 9], 21, 3951481745), a = h(a, q), b = h(b, r), c = h(c, s), d = h(d, t);
  return (p(a) + p(b) + p(c) + p(d)).toLowerCase();
}

// src/tiled-timelapse.ts
var import_gifenc = __toESM(require_gifenc());
var config = new Config("tiled-timelapse");
if (!config.get("maps")) config.set("maps", {});
var getWorkingDirectory = () => {
  if (!config.get("working-directory")) {
    const dir = tiled.promptDirectory(`${tiled.extensionsPath}/tiled-timelapse`, "tiled-timelapse: Select directory for images");
    if (dir) {
      config.set("working-directory", dir);
      tiled.log(`[tiled-timelapse] Working directory set to: ${dir}`);
      return dir;
    } else {
      tiled.log("[tiled-timelapse] No directory selected, exiting.");
      return;
    }
  }
  return config.get("working-directory");
};
getWorkingDirectory();
tiled.assetSaved.connect((asset) => {
  var _a;
  const workingDirectory = getWorkingDirectory();
  if (!isTileMap(asset)) return;
  const mapFilename = ((_a = lastElement(asset.fileName.split("/"))) == null ? void 0 : _a.toString()) || "";
  const mapKey = mapFilename + md5(asset.fileName);
  const img = asset.toImage();
  let increment = config.get("increment") || 0;
  const exportFilename = `${mapFilename}-${padStart(increment.toString(), 4)}.png`;
  const exportFilepath = `${workingDirectory}\\${exportFilename}`;
  config.set("increment", ++increment);
  const succeeded = img.save(exportFilepath);
  const width = img.width;
  const height = img.height;
  let pixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = img.pixel(x, y);
      const { a, r, g, b } = extractARGB(pixel);
      pixels.push(r, g, b, a);
    }
  }
  const jsonPath = exportFilepath.replace(/\.png$/, ".json");
  const json = new TextFile(jsonPath, TextFile.WriteOnly);
  json.write(JSON.stringify({
    width,
    height,
    pixels
  }, null, 4));
  json.commit();
  const configMapEntry = config.get("maps")[mapKey] || config.set("maps", __spreadProps(__spreadValues({}, config.get("maps")), {
    [mapKey]: {
      workingDirectory,
      files: []
    }
  }))[mapKey];
  config.set("maps", __spreadProps(__spreadValues({}, config.get("maps")), {
    [mapKey]: __spreadProps(__spreadValues({}, configMapEntry), {
      files: [...configMapEntry.files, jsonPath]
    })
  }));
  tiled.log(`[tiled-timelapse] ${succeeded ? "Exported" : "Failed to export"} image for ${asset.fileName} to ${exportFilename} (increment: ${increment})`);
  tiled.log(`[tiled-timelapse] Working directory: ${workingDirectory}, increment: ${increment}, export filename: ${exportFilename}, asset file name: ${mapFilename}`);
});
var exportAction = tiled.registerAction("ExportTimelapseGif", (action) => {
  const savePath = tiled.promptSaveFile(getWorkingDirectory(), "GIF files (*.gif)", "tiled-timelapse: Export Timelapse GIF");
  if (!savePath) return tiled.log("[tiled-timelapse] No save path selected, exiting.");
  const dialog = new Dialog("Export Timelapse GIF");
  const frameDelayInput = dialog.addNumberInput("Frame Length");
  frameDelayInput.decimals = 0;
  frameDelayInput.minimum = 50;
  frameDelayInput.maximum = 2e3;
  frameDelayInput.value = 200;
  frameDelayInput.singleStep = 10;
  frameDelayInput.suffix = " ms";
  const colourDepthDropDownOptions = [
    "rgb4444 (low quality, transparency)",
    "rgb565 (medium quality, no transparency)",
    "rgb8888 (high quality, transparency)",
    "rgb888 (high quality, no transparency)"
  ];
  const colourDepthDropDown = dialog.addComboBox("Colours/Quality", colourDepthDropDownOptions);
  const maxColoursOptions = [
    128,
    256,
    512,
    1024
  ];
  const maxColoursDropDown = dialog.addComboBox("Max Colours", maxColoursOptions.map((c) => c.toString()));
  maxColoursDropDown.currentIndex = 2;
  dialog.addNewRow();
  dialog.addButton("Cancel").clicked.connect(() => {
    dialog.reject();
  });
  dialog.addButton("Export").clicked.connect(() => {
    dialog.accept();
  });
  dialog.accepted.connect(() => {
    tiled.log(`[tiled-timelapse] dialog accepted!`);
  });
  dialog.rejected.connect(() => {
    tiled.log(`[tiled-timelapse] dialog rejected!`);
  });
  dialog.finished.connect((result) => {
    var _a;
    tiled.log(`[tiled-timelapse] dialog finished with result: ${result} (${result === 0 ? "rejected" : "accepted"})`);
    tiled.log(`[tiled-timelapse] frame delay: ${frameDelayInput.value} ms`);
    tiled.log(`[tiled-timelapse] colour depth/quality: ${colourDepthDropDown.currentIndex} (${colourDepthDropDownOptions[colourDepthDropDown.currentIndex]})`);
    tiled.log(`[tiled-timelapse] max colours: ${maxColoursDropDown.currentIndex} (${maxColoursOptions[maxColoursDropDown.currentIndex]})`);
    if (result == 0) return;
    const activeAsset = tiled.activeAsset;
    if (!activeAsset || !isTileMap(activeAsset)) return tiled.alert("Active asset is not a TileMap.", "tiled-timelapse: Export Timelapse GIF");
    const configMapEntry = config.get("maps")[(((_a = lastElement(activeAsset.fileName.split("/"))) == null ? void 0 : _a.toString()) || "") + md5(activeAsset.fileName)] || null;
    if (!configMapEntry) return tiled.alert("No saved images found for this map. Please save the map first.", "tiled-timelapse: Export Timelapse GIF");
    if (!configMapEntry.files || configMapEntry.files.length === 0) return tiled.alert("No saved images found for this map. Please save the map first.", "tiled-timelapse: Export Timelapse GIF");
    if (!savePath) return tiled.alert("No save path selected.", "tiled-timelapse: Export Timelapse GIF");
    const files = configMapEntry.files;
    tiled.log(`[tiled-timelapse] Exporting GIF with ${files.length} images from ${configMapEntry.workingDirectory}`);
    const images = files.map((path) => {
      tiled.log(`[tiled-timelapse] Reading image data from ${path}`);
      const json = new TextFile(path, TextFile.ReadOnly);
      const content = json.readAll();
      json.close();
      const data = JSON.parse(content);
      if (!data || !data.pixels || !data.width || !data.height) {
        tiled.log(`[tiled-timelapse] Invalid JSON data in ${path}`);
        return null;
      }
      return {
        data: data.pixels,
        width: data.width,
        height: data.height
      };
    }).filter((img) => img !== null && img.data && img.width && img.height);
    const gif = new import_gifenc.GIFEncoder();
    for (const img of images) {
      tiled.log(`[tiled-timelapse] Processing image with dimensions ${img.width}x${img.height}`);
      if (!img) continue;
      const format = colourDepthDropDownOptions[colourDepthDropDown.currentIndex].split(" ")[0];
      const palette = (0, import_gifenc.quantize)(new Uint8Array(img.data), maxColoursOptions[maxColoursDropDown.currentIndex], { format });
      const index = (0, import_gifenc.applyPalette)(new Uint8Array(img.data), palette, format);
      gif.writeFrame(index, img.width, img.height, {
        palette,
        delay: frameDelayInput.value,
        repeat: 0
        // forever
      });
    }
    gif.finish();
    tiled.log(`[tiled-timelapse] GIF encoding finished, writing to ${savePath}`);
    const bytes = gif.bytes();
    const output = new BinaryFile(savePath, BinaryFile.WriteOnly);
    output.write(bytes.buffer);
    output.commit();
  });
  dialog.exec();
});
exportAction.text = "Export Timelapse GIF";
tiled.extendMenu("File", [{ action: `ExportTimelapseGif` }]);
