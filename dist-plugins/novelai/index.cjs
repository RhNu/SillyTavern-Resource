"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src-plugins/novelai/index.ts
var index_exports = {};
__export(index_exports, {
  exit: () => exit,
  info: () => info,
  init: () => init
});
module.exports = __toCommonJS(index_exports);

// node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/index.mjs
var import_module = require("module");
var require2 = (0, import_module.createRequire)("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = j - b[i2] << 5 | i2;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i2 = 1; i2 < a.length; ++i2) {
    if (a[i2] > m)
      m = a[i2];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i2 = 0; i2 < hcLen; ++i2) {
          clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i2 = 0; i2 < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i2++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i2++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i2 = sym - 257, b = fleb[i2];
          add = bits(dat, pos, (1 << b) - 1) + fl[i2];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i2 = 0; ; ) {
    var c = d[i2++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i2 + eb > d.length)
      return { s: r, r: slc(d, i2 - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i2++] & 63) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i2++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i2 = 0; i2 < dat.length; i2 += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i2, i2 + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i2 = 0; i2 < c; ++i2) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src-plugins/novelai/index.ts
var info = {
  id: "novelai",
  name: "NovelAI Bridge (Thin)",
  description: "\u8F7B\u91CF NovelAI text2image \u540E\u7AEF\u7AEF\u70B9 (\u4EC5 V4.5 / V5 \u6A21\u578B), \u4E0D\u4F9D\u8D56 nekoai-js, \u8BF7\u6C42\u534F\u8BAE\u53C2\u8003 novelai-bridge\u3002Token \u6765\u81EA\u73AF\u5883\u53D8\u91CF NOVELAI_TOKEN, \u4E5F\u53EF\u5728\u8BF7\u6C42\u4F53\u4E2D\u4F20\u5165 token \u8986\u76D6\u3002"
};
var PLUGIN_VERSION = "1.0.0";
var DEFAULT_TIMEOUT_MS = 12e4;
var NOVELAI_IMAGE_API_URL = "https://image.novelai.net/ai/generate-image";
var SUPPORTED_MODELS = /* @__PURE__ */ new Set([
  "nai-diffusion-4-5-full",
  "nai-diffusion-4-5-curated",
  "nai-diffusion-5-full",
  "nai-diffusion-5-curated"
]);
var MAX_IMAGE_PIXELS = 3145728;
var IMAGE_DIMENSION_MIN = 64;
var IMAGE_DIMENSION_MAX = 1600;
var IMAGE_DIMENSION_MULTIPLE = 64;
var SAMPLER_WHITELIST = /* @__PURE__ */ new Set([
  "k_euler",
  "k_euler_ancestral",
  "k_dpm_2",
  "k_dpm_2_ancestral",
  "k_dpmpp_2m",
  "k_dpmpp_2m_sde",
  "k_dpmpp_2s_ancestral",
  "k_dpmpp_sde",
  "ddim",
  "ddim_v3"
]);
var NOISE_SCHEDULE_MAP = {
  native: "karras",
  karras: "karras",
  exponential: "exponential",
  polyexponential: "polyexponential"
};
var QUALITY_TAGS = ", very aesthetic, masterpiece, no text";
var UC_PRESET_LIGHT = "nsfw, lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page";
var VARIETY_SIGMA_COEFFICIENT = 58;
var VARIETY_REFERENCE_PIXELS = 832 * 1216;
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
  statusCode;
};
function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function asFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function asBoolean(value) {
  return typeof value === "boolean" ? value : void 0;
}
function normalizeImageDimension(value) {
  const clamped = Math.min(Math.max(Math.floor(value), IMAGE_DIMENSION_MIN), IMAGE_DIMENSION_MAX);
  const snapped = Math.round(clamped / IMAGE_DIMENSION_MULTIPLE) * IMAGE_DIMENSION_MULTIPLE;
  return Math.min(Math.max(snapped, IMAGE_DIMENSION_MIN), IMAGE_DIMENSION_MAX);
}
function normalizeCanvasArea(width, height) {
  let w = width;
  let h = height;
  while (w * h > MAX_IMAGE_PIXELS) {
    if (w >= h && w > IMAGE_DIMENSION_MIN || h === IMAGE_DIMENSION_MIN) {
      w -= IMAGE_DIMENSION_MULTIPLE;
    } else {
      h -= IMAGE_DIMENSION_MULTIPLE;
    }
  }
  return { width: w, height: h };
}
function parseGenerateBody(raw) {
  const body = { ...raw };
  const prompt = asString(body.prompt);
  if (!prompt) {
    throw new HttpError(400, "\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 prompt");
  }
  body.prompt = prompt;
  const model = asString(body.model);
  if (model && !SUPPORTED_MODELS.has(model)) {
    throw new HttpError(
      400,
      `\u4E0D\u652F\u6301\u7684\u6A21\u578B "${model}": \u672C\u63D2\u4EF6\u4EC5\u652F\u6301 NovelAI V4.5 / V5 (${[...SUPPORTED_MODELS].join(", ")})`
    );
  }
  return body;
}
function sendError(res, error) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof NovelAiApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
}
var NovelAiApiError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
  statusCode;
};
function resolveToken(bodyToken) {
  const requestToken = asString(bodyToken);
  if (requestToken) {
    return requestToken;
  }
  return asString(process.env.NOVELAI_TOKEN);
}
function defaultSeed() {
  const seed = Date.now() % 1e10;
  return seed === 0 ? 1 : seed;
}
function buildRequestBody(body, resolvedSeed) {
  const prompt = asString(body.prompt) ?? "";
  const model = asString(body.model);
  const isV5 = model?.startsWith("nai-diffusion-5") ?? false;
  const sampler = asString(body.sampler);
  const scheduler = asString(body.scheduler);
  const steps = asFiniteNumber(body.steps);
  const scale = asFiniteNumber(body.scale);
  const width = asFiniteNumber(body.width);
  const height = asFiniteNumber(body.height);
  const nSamples = asFiniteNumber(body.n_samples);
  const varietyBoost = asBoolean(body.variety_boost) ?? false;
  const rawWidth = width !== void 0 && width > 0 ? Math.floor(width) : void 0;
  const rawHeight = height !== void 0 && height > 0 ? Math.floor(height) : void 0;
  let resolvedWidth = rawWidth !== void 0 ? normalizeImageDimension(rawWidth) : void 0;
  let resolvedHeight = rawHeight !== void 0 ? normalizeImageDimension(rawHeight) : void 0;
  if (resolvedWidth !== void 0 && resolvedHeight !== void 0) {
    const fitted = normalizeCanvasArea(resolvedWidth, resolvedHeight);
    resolvedWidth = fitted.width;
    resolvedHeight = fitted.height;
  }
  const negativePrompt = asString(body.negative_prompt) ?? UC_PRESET_LIGHT;
  let varietySigma;
  if (!isV5 && varietyBoost && resolvedWidth !== void 0 && resolvedHeight !== void 0) {
    const ratio = resolvedWidth * resolvedHeight / VARIETY_REFERENCE_PIXELS;
    varietySigma = VARIETY_SIGMA_COEFFICIENT * Math.sqrt(ratio);
  }
  const parameters = {
    params_version: isV5 ? 4 : 3,
    ...resolvedWidth !== void 0 ? { width: resolvedWidth } : {},
    ...resolvedHeight !== void 0 ? { height: resolvedHeight } : {},
    // steps/scale 范围与 novelai-bridge 的 normalize_base_fields 一致 (1~50 / 0~10)
    ...steps !== void 0 && steps >= 1 ? { steps: Math.min(Math.floor(steps), 50) } : {},
    ...scale !== void 0 && scale >= 0 ? { scale: Math.min(scale, 10) } : {},
    ...sampler && SAMPLER_WHITELIST.has(sampler) ? { sampler } : {},
    seed: resolvedSeed,
    n_samples: nSamples !== void 0 && nSamples > 0 ? Math.min(Math.floor(nSamples), 4) : 1,
    negative_prompt: negativePrompt,
    ucPreset: 1,
    qualityToggle: true,
    v4_prompt: {
      caption: {
        base_caption: `${prompt}${QUALITY_TAGS}`,
        char_captions: []
      },
      use_coords: false,
      use_order: true
    },
    v4_negative_prompt: {
      caption: {
        base_caption: negativePrompt,
        char_captions: []
      }
    },
    cfg_rescale: 0,
    noise_schedule: scheduler && NOISE_SCHEDULE_MAP[scheduler] ? NOISE_SCHEDULE_MAP[scheduler] : "karras",
    characterPrompts: [],
    legacy: false,
    legacy_v3_extend: false,
    deliberate_euler_ancestral_bug: false,
    prefer_brownian: true,
    auto_smea: false,
    add_original_image: true,
    inpaintImg2ImgStrength: 1,
    use_coords: false,
    ...varietySigma !== void 0 ? { skip_cfg_above_sigma: Number(varietySigma.toFixed(6)) } : {},
    ...isV5 ? {
      legacy_uc: false,
      tag_hint_transparent_background: false
    } : {}
  };
  return {
    action: "generate",
    input: prompt,
    ...model ? { model } : {},
    use_new_shared_trial: true,
    parameters
  };
}
var IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
function mimeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}
function mimeFromBytes(bytes) {
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
    return "image/webp";
  }
  return void 0;
}
function toBase64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}
function extractImages(payload) {
  try {
    const archive = unzipSync(payload);
    const entries = Object.entries(archive).filter(([name]) => IMAGE_EXTENSION_PATTERN.test(name));
    if (entries.length > 0) {
      return entries.map(([name, data]) => ({
        data: toBase64(data),
        mime: mimeFromName(name)
      }));
    }
  } catch {
  }
  const mime = mimeFromBytes(payload);
  return [
    {
      data: toBase64(payload),
      mime: mime ?? "image/png"
    }
  ];
}
async function readErrorText(response) {
  const text = await response.text();
  if (!text.trim()) {
    return `NovelAI API \u8BF7\u6C42\u5931\u8D25 (${response.status})`;
  }
  try {
    const payload = JSON.parse(text);
    const message = asString(payload.message);
    if (message) {
      return message;
    }
  } catch {
  }
  return text.trim();
}
async function handleGenerate(req, res) {
  try {
    const body = parseGenerateBody(req.body);
    const token = resolveToken(body.token);
    if (!token) {
      res.status(400).json({
        error: "\u672A\u914D\u7F6E NovelAI token: \u8BF7\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF NOVELAI_TOKEN, \u6216\u5728\u8BF7\u6C42\u4F53\u4E2D\u4F20\u5165 token"
      });
      return;
    }
    const rawSeed = asFiniteNumber(body.seed);
    const resolvedSeed = rawSeed !== void 0 && rawSeed > 0 ? Math.floor(rawSeed) : defaultSeed();
    const requestBody = buildRequestBody(body, resolvedSeed);
    let response;
    try {
      response = await fetch(NOVELAI_IMAGE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
      });
    } catch (error) {
      throw new NovelAiApiError(502, `\u65E0\u6CD5\u8FDE\u63A5 NovelAI API: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!response.ok) {
      throw new NovelAiApiError(response.status, await readErrorText(response));
    }
    const payload = new Uint8Array(await response.arrayBuffer());
    const images = extractImages(payload);
    if (images.length === 0) {
      throw new NovelAiApiError(502, "NovelAI API \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u56FE\u7247\u6570\u636E");
    }
    res.json({ images });
  } catch (error) {
    sendError(res, error);
  }
}
function handleProbe(_req, res) {
  res.json({ ok: true, plugin: info.id, version: PLUGIN_VERSION });
}
var init = async (router) => {
  router.get("/probe", handleProbe);
  router.post("/generate", handleGenerate);
};
var exit = async () => {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  exit,
  info,
  init
});
