"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src-plugins/nekoai/index.ts
var index_exports = {};
__export(index_exports, {
  exit: () => exit,
  info: () => info,
  init: () => init
});
module.exports = __toCommonJS(index_exports);

// node_modules/.pnpm/nekoai-js@1.3.0/node_modules/nekoai-js/dist/index.mjs
var __create2 = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __getProtoOf2 = Object.getPrototypeOf;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps2 = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames2(from))
      if (!__hasOwnProp2.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var require_process_nextick_args = __commonJS({
  "node_modules/process-nextick-args/index.js"(exports2, module2) {
    "use strict";
    if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
      module2.exports = { nextTick };
    } else {
      module2.exports = process;
    }
    function nextTick(fn, arg1, arg2, arg3) {
      if (typeof fn !== "function") {
        throw new TypeError('"callback" argument must be a function');
      }
      var len = arguments.length;
      var args, i;
      switch (len) {
        case 0:
        case 1:
          return process.nextTick(fn);
        case 2:
          return process.nextTick(function afterTickOne() {
            fn.call(null, arg1);
          });
        case 3:
          return process.nextTick(function afterTickTwo() {
            fn.call(null, arg1, arg2);
          });
        case 4:
          return process.nextTick(function afterTickThree() {
            fn.call(null, arg1, arg2, arg3);
          });
        default:
          args = new Array(len - 1);
          i = 0;
          while (i < args.length) {
            args[i++] = arguments[i];
          }
          return process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
      }
    }
  }
});
var require_isarray = __commonJS({
  "node_modules/isarray/index.js"(exports2, module2) {
    "use strict";
    var toString2 = {}.toString;
    module2.exports = Array.isArray || function(arr) {
      return toString2.call(arr) == "[object Array]";
    };
  }
});
var require_stream = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    "use strict";
    module2.exports = __require("stream");
  }
});
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports2, module2) {
    "use strict";
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});
var require_util = __commonJS({
  "node_modules/core-util-is/lib/util.js"(exports2) {
    "use strict";
    function isArray2(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString(arg) === "[object Array]";
    }
    exports2.isArray = isArray2;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports2.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports2.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports2.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports2.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports2.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports2.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports2.isUndefined = isUndefined;
    function isRegExp(re) {
      return objectToString(re) === "[object RegExp]";
    }
    exports2.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports2.isObject = isObject;
    function isDate(d) {
      return objectToString(d) === "[object Date]";
    }
    exports2.isDate = isDate;
    function isError(e) {
      return objectToString(e) === "[object Error]" || e instanceof Error;
    }
    exports2.isError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports2.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || // ES6 symbol
      typeof arg === "undefined";
    }
    exports2.isPrimitive = isPrimitive;
    exports2.isBuffer = __require("buffer").Buffer.isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  }
});
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports2, module2) {
    "use strict";
    if (typeof Object.create === "function") {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports2, module2) {
    "use strict";
    try {
      util = __require("util");
      if (typeof util.inherits !== "function") throw "";
      module2.exports = util.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});
var require_BufferList = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/BufferList.js"(exports2, module2) {
    "use strict";
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = require_safe_buffer().Buffer;
    var util = __require("util");
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module2.exports = (function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry;
        else this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;
        else this.head = this.head.next;
        --this.length;
        return ret;
      };
      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList.prototype.join = function join(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) {
          ret += s + p.data;
        }
        return ret;
      };
      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0) return Buffer2.alloc(0);
        var ret = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };
      return BufferList;
    })();
    if (util && util.inspect && util.inspect.custom) {
      module2.exports.prototype[util.inspect.custom] = function() {
        var obj = util.inspect({ length: this.length });
        return this.constructor.name + " " + obj;
      };
    }
  }
});
var require_destroy = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            pna.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            pna.nextTick(emitErrorNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, _this, err2);
          }
        } else if (cb) {
          cb(err2);
        }
      });
      return this;
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    module2.exports = {
      destroy,
      undestroy
    };
  }
});
var require_node = __commonJS({
  "node_modules/util-deprecate/node.js"(exports2, module2) {
    "use strict";
    module2.exports = __require("util").deprecate;
  }
});
var require_stream_writable = __commonJS({
  "node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    var Duplex;
    Writable.WritableState = WritableState;
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    util.inherits(Writable, Stream);
    function nop() {
    }
    function WritableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      var hwm = options.highWaterMark;
      var writableHwm = options.writableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0) this.highWaterMark = hwm;
      else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
      else this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer2() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function(object) {
        return object instanceof this;
      };
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
        return new Writable(options);
      }
      this._writableState = new WritableState(options, this);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit("error", new Error("Cannot pipe, not readable"));
    };
    function writeAfterEnd(stream, cb) {
      var er = new Error("write after end");
      stream.emit("error", er);
      pna.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      var er = false;
      if (chunk === null) {
        er = new TypeError("May not write null values to stream");
      } else if (typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      if (er) {
        stream.emit("error", er);
        pna.nextTick(cb, er);
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state.ended) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      var state = this._writableState;
      state.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret) state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev) stream._writev(chunk, state.onwrite);
      else stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        pna.nextTick(cb, er);
        pna.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er) onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state);
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          asyncWrite(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished) onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null) state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error("_write() is not implemented"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending) endWritable(this, state, cb);
    };
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          stream.emit("error", err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function") {
          state.pendingcb++;
          state.finalCalled = true;
          pna.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished) pna.nextTick(cb);
        else stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      get: function() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      this.end();
      cb(err);
    };
  }
});
var require_stream_duplex = __commonJS({
  "node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) {
        keys2.push(key);
      }
      return keys2;
    };
    module2.exports = Duplex;
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    util.inherits(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      if (options && options.readable === false) this.readable = false;
      if (options && options.writable === false) this.writable = false;
      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
      this.once("end", onend);
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended) return;
      pna.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
    Duplex.prototype._destroy = function(err, cb) {
      this.push(null);
      this.end();
      pna.nextTick(cb, err);
    };
  }
});
var require_string_decoder = __commonJS({
  "node_modules/string_decoder/lib/string_decoder.js"(exports2) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried) return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports2.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0) return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === void 0) return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      else if (byte >> 5 === 6) return 2;
      else if (byte >> 4 === 14) return 3;
      else if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self2, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;
          else self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self2, buf, p) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "\uFFFD";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "\uFFFD";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "\uFFFD";
          }
        }
      }
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== void 0) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + "\uFFFD";
      return r;
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }
});
var require_stream_readable = __commonJS({
  "node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Readable;
    var isArray2 = require_isarray();
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = __require("events").EventEmitter;
    var EElistenerCount = function(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var debugUtil = __require("util");
    var debug = void 0;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function() {
      };
    }
    var BufferList = require_BufferList();
    var destroyImpl = require_destroy();
    var StringDecoder;
    util.inherits(Readable, Stream);
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (isArray2(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      var hwm = options.highWaterMark;
      var readableHwm = options.readableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0) this.highWaterMark = hwm;
      else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
      else this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable)) return new Readable(options);
      this._readableState = new ReadableState(options, this);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      this.push(null);
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state, chunk);
        if (er) {
          stream.emit("error", er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted) stream.emit("error", new Error("stream.unshift() after end event"));
            else addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            stream.emit("error", new Error("stream.push() after EOF"));
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
              else maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
        }
      }
      return needMoreData(state);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit("data", chunk);
        stream.read(0);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) state.buffer.unshift(chunk);
        else state.buffer.push(chunk);
        if (state.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      return er;
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };
    var MAX_HWM = 8388608;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n !== n) {
        if (state.flowing && state.length) return state.buffer.head.data.length;
        else return state.length;
      }
      if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length) return n;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;
      if (n !== 0) state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0) endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0) state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading) n = howMuchToRead(nOrig, state);
      }
      var ret;
      if (n > 0) ret = fromList(n, state);
      else ret = null;
      if (ret === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }
      if (state.length === 0) {
        if (!state.ended) state.needReadable = true;
        if (nOrig !== n && state.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state) {
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      emitReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        if (state.sync) pna.nextTick(emitReadable_, stream);
        else emitReadable_(stream);
      }
    }
    function emitReadable_(stream) {
      debug("emit readable");
      stream.emit("readable");
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        pna.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
        else len = state.length;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n) {
      this.emit("error", new Error("_read() is not implemented"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) pna.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      var increasedAwaitDrain = false;
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        increasedAwaitDrain = false;
        var ret = dest.write(chunk);
        if (false === ret && !increasedAwaitDrain) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state.awaitDrain);
            state.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function() {
        var state = src._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = { hasUnpiped: false };
      if (state.pipesCount === 0) return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes) return this;
        if (!dest) dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++) {
          dests[i].emit("unpipe", this, { hasUnpiped: false });
        }
        return this;
      }
      var index = indexOf(state.pipes, dest);
      if (index === -1) return this;
      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      if (ev === "data") {
        if (this._readableState.flowing !== false) this.resume();
      } else if (ev === "readable") {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            pna.nextTick(nReadingNextTick, this);
          } else if (state.length) {
            emitReadable(this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = true;
        resume(this, state);
      }
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        pna.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      if (!state.reading) {
        debug("resume read 0");
        stream.read(0);
      }
      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading) stream.read(0);
    }
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) {
      }
    }
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder) chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = /* @__PURE__ */ (function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          })(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._readableState.highWaterMark;
      }
    });
    Readable._fromList = fromList;
    function fromList(n, state) {
      if (state.length === 0) return null;
      var ret;
      if (state.objectMode) ret = state.buffer.shift();
      else if (!n || n >= state.length) {
        if (state.decoder) ret = state.buffer.join("");
        else if (state.buffer.length === 1) ret = state.buffer.head.data;
        else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret = fromListPartial(n, state.buffer, state.decoder);
      }
      return ret;
    }
    function fromListPartial(n, list, hasStrings) {
      var ret;
      if (n < list.head.data.length) {
        ret = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        ret = list.shift();
      } else {
        ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
      }
      return ret;
    }
    function copyFromBufferString(n, list) {
      var p = list.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;
        else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }
    function copyFromBuffer(n, list) {
      var ret = Buffer2.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
      if (!state.endEmitted) {
        state.ended = true;
        pna.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }
  }
});
var require_stream_transform = __commonJS({
  "node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    "use strict";
    module2.exports = Transform;
    var Duplex = require_stream_duplex();
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb) {
        return this.emit("error", new Error("write callback called multiple times"));
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function") this._transform = options.transform;
        if (typeof options.flush === "function") this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function") {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      var _this2 = this;
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
        _this2.emit("close");
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length) throw new Error("Calling transform done when ws.length != 0");
      if (stream._transformState.transforming) throw new Error("Calling transform done when still transforming");
      return stream.push(null);
    }
  }
});
var require_stream_passthrough = __commonJS({
  "node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
    "use strict";
    module2.exports = PassThrough;
    var Transform = require_stream_transform();
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    util.inherits(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});
var require_readable = __commonJS({
  "node_modules/readable-stream/readable.js"(exports2, module2) {
    "use strict";
    var Stream = __require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream) {
      module2.exports = Stream;
      exports2 = module2.exports = Stream.Readable;
      exports2.Readable = Stream.Readable;
      exports2.Writable = Stream.Writable;
      exports2.Duplex = Stream.Duplex;
      exports2.Transform = Stream.Transform;
      exports2.PassThrough = Stream.PassThrough;
      exports2.Stream = Stream;
    } else {
      exports2 = module2.exports = require_stream_readable();
      exports2.Stream = Stream || exports2;
      exports2.Readable = exports2;
      exports2.Writable = require_stream_writable();
      exports2.Duplex = require_stream_duplex();
      exports2.Transform = require_stream_transform();
      exports2.PassThrough = require_stream_passthrough();
    }
  }
});
var require_support = __commonJS({
  "node_modules/jszip/lib/support.js"(exports2) {
    "use strict";
    exports2.base64 = true;
    exports2.array = true;
    exports2.string = true;
    exports2.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
    exports2.nodebuffer = typeof Buffer !== "undefined";
    exports2.uint8array = typeof Uint8Array !== "undefined";
    if (typeof ArrayBuffer === "undefined") {
      exports2.blob = false;
    } else {
      buffer = new ArrayBuffer(0);
      try {
        exports2.blob = new Blob([buffer], {
          type: "application/zip"
        }).size === 0;
      } catch (e) {
        try {
          Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          builder = new Builder();
          builder.append(buffer);
          exports2.blob = builder.getBlob("application/zip").size === 0;
        } catch (e2) {
          exports2.blob = false;
        }
      }
    }
    var buffer;
    var Builder;
    var builder;
    try {
      exports2.nodestream = !!require_readable().Readable;
    } catch (e) {
      exports2.nodestream = false;
    }
  }
});
var require_base64 = __commonJS({
  "node_modules/jszip/lib/base64.js"(exports2) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    exports2.encode = function(input) {
      var output = [];
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0, len = input.length, remainingBytes = len;
      var isArray2 = utils.getTypeOf(input) !== "string";
      while (i < input.length) {
        remainingBytes = len - i;
        if (!isArray2) {
          chr1 = input.charCodeAt(i++);
          chr2 = i < len ? input.charCodeAt(i++) : 0;
          chr3 = i < len ? input.charCodeAt(i++) : 0;
        } else {
          chr1 = input[i++];
          chr2 = i < len ? input[i++] : 0;
          chr3 = i < len ? input[i++] : 0;
        }
        enc1 = chr1 >> 2;
        enc2 = (chr1 & 3) << 4 | chr2 >> 4;
        enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
        enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
        output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
      }
      return output.join("");
    };
    exports2.decode = function(input) {
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0, resultIndex = 0;
      var dataUrlPrefix = "data:";
      if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
        throw new Error("Invalid base64 input, it looks like a data url.");
      }
      input = input.replace(/[^A-Za-z0-9+/=]/g, "");
      var totalLength = input.length * 3 / 4;
      if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (totalLength % 1 !== 0) {
        throw new Error("Invalid base64 input, bad content length.");
      }
      var output;
      if (support.uint8array) {
        output = new Uint8Array(totalLength | 0);
      } else {
        output = new Array(totalLength | 0);
      }
      while (i < input.length) {
        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));
        chr1 = enc1 << 2 | enc2 >> 4;
        chr2 = (enc2 & 15) << 4 | enc3 >> 2;
        chr3 = (enc3 & 3) << 6 | enc4;
        output[resultIndex++] = chr1;
        if (enc3 !== 64) {
          output[resultIndex++] = chr2;
        }
        if (enc4 !== 64) {
          output[resultIndex++] = chr3;
        }
      }
      return output;
    };
  }
});
var require_nodejsUtils = __commonJS({
  "node_modules/jszip/lib/nodejsUtils.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      /**
       * True if this is running in Nodejs, will be undefined in a browser.
       * In a browser, browserify won't include this file and the whole module
       * will be resolved an empty object.
       */
      isNode: typeof Buffer !== "undefined",
      /**
       * Create a new nodejs Buffer from an existing content.
       * @param {Object} data the data to pass to the constructor.
       * @param {String} encoding the encoding to use.
       * @return {Buffer} a new Buffer.
       */
      newBufferFrom: function(data, encoding) {
        if (Buffer.from && Buffer.from !== Uint8Array.from) {
          return Buffer.from(data, encoding);
        } else {
          if (typeof data === "number") {
            throw new Error('The "data" argument must not be a number');
          }
          return new Buffer(data, encoding);
        }
      },
      /**
       * Create a new nodejs Buffer with the specified size.
       * @param {Integer} size the size of the buffer.
       * @return {Buffer} a new Buffer.
       */
      allocBuffer: function(size) {
        if (Buffer.alloc) {
          return Buffer.alloc(size);
        } else {
          var buf = new Buffer(size);
          buf.fill(0);
          return buf;
        }
      },
      /**
       * Find out if an object is a Buffer.
       * @param {Object} b the object to test.
       * @return {Boolean} true if the object is a Buffer, false otherwise.
       */
      isBuffer: function(b) {
        return Buffer.isBuffer(b);
      },
      isStream: function(obj) {
        return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
      }
    };
  }
});
var require_lib = __commonJS({
  "node_modules/immediate/lib/index.js"(exports2, module2) {
    "use strict";
    var Mutation = global.MutationObserver || global.WebKitMutationObserver;
    var scheduleDrain;
    if (process.browser) {
      if (Mutation) {
        called = 0;
        observer = new Mutation(nextTick);
        element = global.document.createTextNode("");
        observer.observe(element, {
          characterData: true
        });
        scheduleDrain = function() {
          element.data = called = ++called % 2;
        };
      } else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
        channel = new global.MessageChannel();
        channel.port1.onmessage = nextTick;
        scheduleDrain = function() {
          channel.port2.postMessage(0);
        };
      } else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) {
        scheduleDrain = function() {
          var scriptEl = global.document.createElement("script");
          scriptEl.onreadystatechange = function() {
            nextTick();
            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
          };
          global.document.documentElement.appendChild(scriptEl);
        };
      } else {
        scheduleDrain = function() {
          setTimeout(nextTick, 0);
        };
      }
    } else {
      scheduleDrain = function() {
        process.nextTick(nextTick);
      };
    }
    var called;
    var observer;
    var element;
    var channel;
    var draining;
    var queue = [];
    function nextTick() {
      draining = true;
      var i, oldQueue;
      var len = queue.length;
      while (len) {
        oldQueue = queue;
        queue = [];
        i = -1;
        while (++i < len) {
          oldQueue[i]();
        }
        len = queue.length;
      }
      draining = false;
    }
    module2.exports = immediate;
    function immediate(task) {
      if (queue.push(task) === 1 && !draining) {
        scheduleDrain();
      }
    }
  }
});
var require_lib2 = __commonJS({
  "node_modules/lie/lib/index.js"(exports2, module2) {
    "use strict";
    var immediate = require_lib();
    function INTERNAL() {
    }
    var handlers = {};
    var REJECTED = ["REJECTED"];
    var FULFILLED = ["FULFILLED"];
    var PENDING = ["PENDING"];
    if (!process.browser) {
      UNHANDLED = ["UNHANDLED"];
    }
    var UNHANDLED;
    module2.exports = Promise2;
    function Promise2(resolver) {
      if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function");
      }
      this.state = PENDING;
      this.queue = [];
      this.outcome = void 0;
      if (!process.browser) {
        this.handled = UNHANDLED;
      }
      if (resolver !== INTERNAL) {
        safelyResolveThenable(this, resolver);
      }
    }
    Promise2.prototype.finally = function(callback) {
      if (typeof callback !== "function") {
        return this;
      }
      var p = this.constructor;
      return this.then(resolve2, reject2);
      function resolve2(value) {
        function yes() {
          return value;
        }
        return p.resolve(callback()).then(yes);
      }
      function reject2(reason) {
        function no() {
          throw reason;
        }
        return p.resolve(callback()).then(no);
      }
    };
    Promise2.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
    Promise2.prototype.then = function(onFulfilled, onRejected) {
      if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
        return this;
      }
      var promise = new this.constructor(INTERNAL);
      if (!process.browser) {
        if (this.handled === UNHANDLED) {
          this.handled = null;
        }
      }
      if (this.state !== PENDING) {
        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
        unwrap(promise, resolver, this.outcome);
      } else {
        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
      }
      return promise;
    };
    function QueueItem(promise, onFulfilled, onRejected) {
      this.promise = promise;
      if (typeof onFulfilled === "function") {
        this.onFulfilled = onFulfilled;
        this.callFulfilled = this.otherCallFulfilled;
      }
      if (typeof onRejected === "function") {
        this.onRejected = onRejected;
        this.callRejected = this.otherCallRejected;
      }
    }
    QueueItem.prototype.callFulfilled = function(value) {
      handlers.resolve(this.promise, value);
    };
    QueueItem.prototype.otherCallFulfilled = function(value) {
      unwrap(this.promise, this.onFulfilled, value);
    };
    QueueItem.prototype.callRejected = function(value) {
      handlers.reject(this.promise, value);
    };
    QueueItem.prototype.otherCallRejected = function(value) {
      unwrap(this.promise, this.onRejected, value);
    };
    function unwrap(promise, func, value) {
      immediate(function() {
        var returnValue;
        try {
          returnValue = func(value);
        } catch (e) {
          return handlers.reject(promise, e);
        }
        if (returnValue === promise) {
          handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
        } else {
          handlers.resolve(promise, returnValue);
        }
      });
    }
    handlers.resolve = function(self2, value) {
      var result = tryCatch(getThen, value);
      if (result.status === "error") {
        return handlers.reject(self2, result.value);
      }
      var thenable = result.value;
      if (thenable) {
        safelyResolveThenable(self2, thenable);
      } else {
        self2.state = FULFILLED;
        self2.outcome = value;
        var i = -1;
        var len = self2.queue.length;
        while (++i < len) {
          self2.queue[i].callFulfilled(value);
        }
      }
      return self2;
    };
    handlers.reject = function(self2, error) {
      self2.state = REJECTED;
      self2.outcome = error;
      if (!process.browser) {
        if (self2.handled === UNHANDLED) {
          immediate(function() {
            if (self2.handled === UNHANDLED) {
              process.emit("unhandledRejection", error, self2);
            }
          });
        }
      }
      var i = -1;
      var len = self2.queue.length;
      while (++i < len) {
        self2.queue[i].callRejected(error);
      }
      return self2;
    };
    function getThen(obj) {
      var then = obj && obj.then;
      if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
        return function appyThen() {
          then.apply(obj, arguments);
        };
      }
    }
    function safelyResolveThenable(self2, thenable) {
      var called = false;
      function onError(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.reject(self2, value);
      }
      function onSuccess(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.resolve(self2, value);
      }
      function tryToUnwrap() {
        thenable(onSuccess, onError);
      }
      var result = tryCatch(tryToUnwrap);
      if (result.status === "error") {
        onError(result.value);
      }
    }
    function tryCatch(func, value) {
      var out = {};
      try {
        out.value = func(value);
        out.status = "success";
      } catch (e) {
        out.status = "error";
        out.value = e;
      }
      return out;
    }
    Promise2.resolve = resolve;
    function resolve(value) {
      if (value instanceof this) {
        return value;
      }
      return handlers.resolve(new this(INTERNAL), value);
    }
    Promise2.reject = reject;
    function reject(reason) {
      var promise = new this(INTERNAL);
      return handlers.reject(promise, reason);
    }
    Promise2.all = all;
    function all(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var values = new Array(len);
      var resolved = 0;
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        allResolver(iterable[i], i);
      }
      return promise;
      function allResolver(value, i2) {
        self2.resolve(value).then(resolveFromAll, function(error) {
          if (!called) {
            called = true;
            handlers.reject(promise, error);
          }
        });
        function resolveFromAll(outValue) {
          values[i2] = outValue;
          if (++resolved === len && !called) {
            called = true;
            handlers.resolve(promise, values);
          }
        }
      }
    }
    Promise2.race = race;
    function race(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        resolver(iterable[i]);
      }
      return promise;
      function resolver(value) {
        self2.resolve(value).then(function(response) {
          if (!called) {
            called = true;
            handlers.resolve(promise, response);
          }
        }, function(error) {
          if (!called) {
            called = true;
            handlers.reject(promise, error);
          }
        });
      }
    }
  }
});
var require_external = __commonJS({
  "node_modules/jszip/lib/external.js"(exports2, module2) {
    "use strict";
    var ES6Promise = null;
    if (typeof Promise !== "undefined") {
      ES6Promise = Promise;
    } else {
      ES6Promise = require_lib2();
    }
    module2.exports = {
      Promise: ES6Promise
    };
  }
});
var require_setImmediate = __commonJS({
  "node_modules/setimmediate/setImmediate.js"(exports2) {
    "use strict";
    (function(global2, undefined2) {
      "use strict";
      if (global2.setImmediate) {
        return;
      }
      var nextHandle = 1;
      var tasksByHandle = {};
      var currentlyRunningATask = false;
      var doc = global2.document;
      var registerImmediate;
      function setImmediate2(callback) {
        if (typeof callback !== "function") {
          callback = new Function("" + callback);
        }
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
        }
        var task = { callback, args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
      }
      function clearImmediate(handle) {
        delete tasksByHandle[handle];
      }
      function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
          case 0:
            callback();
            break;
          case 1:
            callback(args[0]);
            break;
          case 2:
            callback(args[0], args[1]);
            break;
          case 3:
            callback(args[0], args[1], args[2]);
            break;
          default:
            callback.apply(undefined2, args);
            break;
        }
      }
      function runIfPresent(handle) {
        if (currentlyRunningATask) {
          setTimeout(runIfPresent, 0, handle);
        } else {
          var task = tasksByHandle[handle];
          if (task) {
            currentlyRunningATask = true;
            try {
              run(task);
            } finally {
              clearImmediate(handle);
              currentlyRunningATask = false;
            }
          }
        }
      }
      function installNextTickImplementation() {
        registerImmediate = function(handle) {
          process.nextTick(function() {
            runIfPresent(handle);
          });
        };
      }
      function canUsePostMessage() {
        if (global2.postMessage && !global2.importScripts) {
          var postMessageIsAsynchronous = true;
          var oldOnMessage = global2.onmessage;
          global2.onmessage = function() {
            postMessageIsAsynchronous = false;
          };
          global2.postMessage("", "*");
          global2.onmessage = oldOnMessage;
          return postMessageIsAsynchronous;
        }
      }
      function installPostMessageImplementation() {
        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
          if (event.source === global2 && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
          }
        };
        if (global2.addEventListener) {
          global2.addEventListener("message", onGlobalMessage, false);
        } else {
          global2.attachEvent("onmessage", onGlobalMessage);
        }
        registerImmediate = function(handle) {
          global2.postMessage(messagePrefix + handle, "*");
        };
      }
      function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
          var handle = event.data;
          runIfPresent(handle);
        };
        registerImmediate = function(handle) {
          channel.port2.postMessage(handle);
        };
      }
      function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
          var script = doc.createElement("script");
          script.onreadystatechange = function() {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
          };
          html.appendChild(script);
        };
      }
      function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
          setTimeout(runIfPresent, 0, handle);
        };
      }
      var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global2);
      attachTo = attachTo && attachTo.setTimeout ? attachTo : global2;
      if ({}.toString.call(global2.process) === "[object process]") {
        installNextTickImplementation();
      } else if (canUsePostMessage()) {
        installPostMessageImplementation();
      } else if (global2.MessageChannel) {
        installMessageChannelImplementation();
      } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        installReadyStateChangeImplementation();
      } else {
        installSetTimeoutImplementation();
      }
      attachTo.setImmediate = setImmediate2;
      attachTo.clearImmediate = clearImmediate;
    })(typeof self === "undefined" ? typeof global === "undefined" ? exports2 : global : self);
  }
});
var require_utils = __commonJS({
  "node_modules/jszip/lib/utils.js"(exports2) {
    "use strict";
    var support = require_support();
    var base64 = require_base64();
    var nodejsUtils = require_nodejsUtils();
    var external = require_external();
    require_setImmediate();
    function string2binary(str) {
      var result = null;
      if (support.uint8array) {
        result = new Uint8Array(str.length);
      } else {
        result = new Array(str.length);
      }
      return stringToArrayLike(str, result);
    }
    exports2.newBlob = function(part, type) {
      exports2.checkSupport("blob");
      try {
        return new Blob([part], {
          type
        });
      } catch (e) {
        try {
          var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          var builder = new Builder();
          builder.append(part);
          return builder.getBlob(type);
        } catch (e2) {
          throw new Error("Bug : can't construct the Blob.");
        }
      }
    };
    function identity(input) {
      return input;
    }
    function stringToArrayLike(str, array) {
      for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 255;
      }
      return array;
    }
    var arrayToStringHelper = {
      /**
       * Transform an array of int into a string, chunk by chunk.
       * See the performances notes on arrayLikeToString.
       * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
       * @param {String} type the type of the array.
       * @param {Integer} chunk the chunk size.
       * @return {String} the resulting string.
       * @throws Error if the chunk is too big for the stack.
       */
      stringifyByChunk: function(array, type, chunk) {
        var result = [], k = 0, len = array.length;
        if (len <= chunk) {
          return String.fromCharCode.apply(null, array);
        }
        while (k < len) {
          if (type === "array" || type === "nodebuffer") {
            result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
          } else {
            result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
          }
          k += chunk;
        }
        return result.join("");
      },
      /**
       * Call String.fromCharCode on every item in the array.
       * This is the naive implementation, which generate A LOT of intermediate string.
       * This should be used when everything else fail.
       * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
       * @return {String} the result.
       */
      stringifyByChar: function(array) {
        var resultStr = "";
        for (var i = 0; i < array.length; i++) {
          resultStr += String.fromCharCode(array[i]);
        }
        return resultStr;
      },
      applyCanBeUsed: {
        /**
         * true if the browser accepts to use String.fromCharCode on Uint8Array
         */
        uint8array: (function() {
          try {
            return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch (e) {
            return false;
          }
        })(),
        /**
         * true if the browser accepts to use String.fromCharCode on nodejs Buffer.
         */
        nodebuffer: (function() {
          try {
            return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
          } catch (e) {
            return false;
          }
        })()
      }
    };
    function arrayLikeToString(array) {
      var chunk = 65536, type = exports2.getTypeOf(array), canUseApply = true;
      if (type === "uint8array") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
      } else if (type === "nodebuffer") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
      }
      if (canUseApply) {
        while (chunk > 1) {
          try {
            return arrayToStringHelper.stringifyByChunk(array, type, chunk);
          } catch (e) {
            chunk = Math.floor(chunk / 2);
          }
        }
      }
      return arrayToStringHelper.stringifyByChar(array);
    }
    exports2.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
      for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
      }
      return arrayTo;
    }
    var transform = {};
    transform["string"] = {
      "string": identity,
      "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": function(input) {
        return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
      }
    };
    transform["array"] = {
      "string": arrayLikeToString,
      "array": identity,
      "arraybuffer": function(input) {
        return new Uint8Array(input).buffer;
      },
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["arraybuffer"] = {
      "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
      },
      "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
      },
      "arraybuffer": identity,
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(new Uint8Array(input));
      }
    };
    transform["uint8array"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return input.buffer;
      },
      "uint8array": identity,
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["nodebuffer"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": identity
    };
    exports2.transformTo = function(outputType, input) {
      if (!input) {
        input = "";
      }
      if (!outputType) {
        return input;
      }
      exports2.checkSupport(outputType);
      var inputType = exports2.getTypeOf(input);
      var result = transform[inputType][outputType](input);
      return result;
    };
    exports2.resolve = function(path) {
      var parts = path.split("/");
      var result = [];
      for (var index = 0; index < parts.length; index++) {
        var part = parts[index];
        if (part === "." || part === "" && index !== 0 && index !== parts.length - 1) {
          continue;
        } else if (part === "..") {
          result.pop();
        } else {
          result.push(part);
        }
      }
      return result.join("/");
    };
    exports2.getTypeOf = function(input) {
      if (typeof input === "string") {
        return "string";
      }
      if (Object.prototype.toString.call(input) === "[object Array]") {
        return "array";
      }
      if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
        return "nodebuffer";
      }
      if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
      }
      if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
      }
    };
    exports2.checkSupport = function(type) {
      var supported = support[type.toLowerCase()];
      if (!supported) {
        throw new Error(type + " is not supported by this platform");
      }
    };
    exports2.MAX_VALUE_16BITS = 65535;
    exports2.MAX_VALUE_32BITS = -1;
    exports2.pretty = function(str) {
      var res = "", code, i;
      for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
      }
      return res;
    };
    exports2.delay = function(callback, args, self2) {
      setImmediate(function() {
        callback.apply(self2 || null, args || []);
      });
    };
    exports2.inherits = function(ctor, superCtor) {
      var Obj = function() {
      };
      Obj.prototype = superCtor.prototype;
      ctor.prototype = new Obj();
    };
    exports2.extend = function() {
      var result = {}, i, attr;
      for (i = 0; i < arguments.length; i++) {
        for (attr in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") {
            result[attr] = arguments[i][attr];
          }
        }
      }
      return result;
    };
    exports2.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
      var promise = external.Promise.resolve(inputData).then(function(data) {
        var isBlob = support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1);
        if (isBlob && typeof FileReader !== "undefined") {
          return new external.Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
              resolve(e.target.result);
            };
            reader.onerror = function(e) {
              reject(e.target.error);
            };
            reader.readAsArrayBuffer(data);
          });
        } else {
          return data;
        }
      });
      return promise.then(function(data) {
        var dataType = exports2.getTypeOf(data);
        if (!dataType) {
          return external.Promise.reject(
            new Error("Can't read the data of '" + name + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?")
          );
        }
        if (dataType === "arraybuffer") {
          data = exports2.transformTo("uint8array", data);
        } else if (dataType === "string") {
          if (isBase64) {
            data = base64.decode(data);
          } else if (isBinary) {
            if (isOptimizedBinaryString !== true) {
              data = string2binary(data);
            }
          }
        }
        return data;
      });
    };
  }
});
var require_GenericWorker = __commonJS({
  "node_modules/jszip/lib/stream/GenericWorker.js"(exports2, module2) {
    "use strict";
    function GenericWorker(name) {
      this.name = name || "default";
      this.streamInfo = {};
      this.generatedError = null;
      this.extraStreamInfo = {};
      this.isPaused = true;
      this.isFinished = false;
      this.isLocked = false;
      this._listeners = {
        "data": [],
        "end": [],
        "error": []
      };
      this.previous = null;
    }
    GenericWorker.prototype = {
      /**
       * Push a chunk to the next workers.
       * @param {Object} chunk the chunk to push
       */
      push: function(chunk) {
        this.emit("data", chunk);
      },
      /**
       * End the stream.
       * @return {Boolean} true if this call ended the worker, false otherwise.
       */
      end: function() {
        if (this.isFinished) {
          return false;
        }
        this.flush();
        try {
          this.emit("end");
          this.cleanUp();
          this.isFinished = true;
        } catch (e) {
          this.emit("error", e);
        }
        return true;
      },
      /**
       * End the stream with an error.
       * @param {Error} e the error which caused the premature end.
       * @return {Boolean} true if this call ended the worker with an error, false otherwise.
       */
      error: function(e) {
        if (this.isFinished) {
          return false;
        }
        if (this.isPaused) {
          this.generatedError = e;
        } else {
          this.isFinished = true;
          this.emit("error", e);
          if (this.previous) {
            this.previous.error(e);
          }
          this.cleanUp();
        }
        return true;
      },
      /**
       * Add a callback on an event.
       * @param {String} name the name of the event (data, end, error)
       * @param {Function} listener the function to call when the event is triggered
       * @return {GenericWorker} the current object for chainability
       */
      on: function(name, listener) {
        this._listeners[name].push(listener);
        return this;
      },
      /**
       * Clean any references when a worker is ending.
       */
      cleanUp: function() {
        this.streamInfo = this.generatedError = this.extraStreamInfo = null;
        this._listeners = [];
      },
      /**
       * Trigger an event. This will call registered callback with the provided arg.
       * @param {String} name the name of the event (data, end, error)
       * @param {Object} arg the argument to call the callback with.
       */
      emit: function(name, arg) {
        if (this._listeners[name]) {
          for (var i = 0; i < this._listeners[name].length; i++) {
            this._listeners[name][i].call(this, arg);
          }
        }
      },
      /**
       * Chain a worker with an other.
       * @param {Worker} next the worker receiving events from the current one.
       * @return {worker} the next worker for chainability
       */
      pipe: function(next) {
        return next.registerPrevious(this);
      },
      /**
       * Same as `pipe` in the other direction.
       * Using an API with `pipe(next)` is very easy.
       * Implementing the API with the point of view of the next one registering
       * a source is easier, see the ZipFileWorker.
       * @param {Worker} previous the previous worker, sending events to this one
       * @return {Worker} the current worker for chainability
       */
      registerPrevious: function(previous) {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.streamInfo = previous.streamInfo;
        this.mergeStreamInfo();
        this.previous = previous;
        var self2 = this;
        previous.on("data", function(chunk) {
          self2.processChunk(chunk);
        });
        previous.on("end", function() {
          self2.end();
        });
        previous.on("error", function(e) {
          self2.error(e);
        });
        return this;
      },
      /**
       * Pause the stream so it doesn't send events anymore.
       * @return {Boolean} true if this call paused the worker, false otherwise.
       */
      pause: function() {
        if (this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = true;
        if (this.previous) {
          this.previous.pause();
        }
        return true;
      },
      /**
       * Resume a paused stream.
       * @return {Boolean} true if this call resumed the worker, false otherwise.
       */
      resume: function() {
        if (!this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = false;
        var withError = false;
        if (this.generatedError) {
          this.error(this.generatedError);
          withError = true;
        }
        if (this.previous) {
          this.previous.resume();
        }
        return !withError;
      },
      /**
       * Flush any remaining bytes as the stream is ending.
       */
      flush: function() {
      },
      /**
       * Process a chunk. This is usually the method overridden.
       * @param {Object} chunk the chunk to process.
       */
      processChunk: function(chunk) {
        this.push(chunk);
      },
      /**
       * Add a key/value to be added in the workers chain streamInfo once activated.
       * @param {String} key the key to use
       * @param {Object} value the associated value
       * @return {Worker} the current worker for chainability
       */
      withStreamInfo: function(key, value) {
        this.extraStreamInfo[key] = value;
        this.mergeStreamInfo();
        return this;
      },
      /**
       * Merge this worker's streamInfo into the chain's streamInfo.
       */
      mergeStreamInfo: function() {
        for (var key in this.extraStreamInfo) {
          if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) {
            continue;
          }
          this.streamInfo[key] = this.extraStreamInfo[key];
        }
      },
      /**
       * Lock the stream to prevent further updates on the workers chain.
       * After calling this method, all calls to pipe will fail.
       */
      lock: function() {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.isLocked = true;
        if (this.previous) {
          this.previous.lock();
        }
      },
      /**
       *
       * Pretty print the workers chain.
       */
      toString: function() {
        var me = "Worker " + this.name;
        if (this.previous) {
          return this.previous + " -> " + me;
        } else {
          return me;
        }
      }
    };
    module2.exports = GenericWorker;
  }
});
var require_utf8 = __commonJS({
  "node_modules/jszip/lib/utf8.js"(exports2) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var nodejsUtils = require_nodejsUtils();
    var GenericWorker = require_GenericWorker();
    var _utf8len = new Array(256);
    for (i = 0; i < 256; i++) {
      _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    var i;
    _utf8len[254] = _utf8len[254] = 1;
    var string2buf = function(str) {
      var buf, c, c2, m_pos, i2, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      if (support.uint8array) {
        buf = new Uint8Array(buf_len);
      } else {
        buf = new Array(buf_len);
      }
      for (i2 = 0, m_pos = 0; i2 < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i2++] = c;
        } else if (c < 2048) {
          buf[i2++] = 192 | c >>> 6;
          buf[i2++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i2++] = 224 | c >>> 12;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        } else {
          buf[i2++] = 240 | c >>> 18;
          buf[i2++] = 128 | c >>> 12 & 63;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        }
      }
      return buf;
    };
    var utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    var buf2string = function(buf) {
      var i2, out, c, c_len;
      var len = buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i2 = 0; i2 < len; ) {
        c = buf[i2++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i2 += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i2 < len) {
          c = c << 6 | buf[i2++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      if (utf16buf.length !== out) {
        if (utf16buf.subarray) {
          utf16buf = utf16buf.subarray(0, out);
        } else {
          utf16buf.length = out;
        }
      }
      return utils.applyFromCharCode(utf16buf);
    };
    exports2.utf8encode = function utf8encode(str) {
      if (support.nodebuffer) {
        return nodejsUtils.newBufferFrom(str, "utf-8");
      }
      return string2buf(str);
    };
    exports2.utf8decode = function utf8decode(buf) {
      if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
      }
      buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
      return buf2string(buf);
    };
    function Utf8DecodeWorker() {
      GenericWorker.call(this, "utf-8 decode");
      this.leftOver = null;
    }
    utils.inherits(Utf8DecodeWorker, GenericWorker);
    Utf8DecodeWorker.prototype.processChunk = function(chunk) {
      var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
      if (this.leftOver && this.leftOver.length) {
        if (support.uint8array) {
          var previousData = data;
          data = new Uint8Array(previousData.length + this.leftOver.length);
          data.set(this.leftOver, 0);
          data.set(previousData, this.leftOver.length);
        } else {
          data = this.leftOver.concat(data);
        }
        this.leftOver = null;
      }
      var nextBoundary = utf8border(data);
      var usableData = data;
      if (nextBoundary !== data.length) {
        if (support.uint8array) {
          usableData = data.subarray(0, nextBoundary);
          this.leftOver = data.subarray(nextBoundary, data.length);
        } else {
          usableData = data.slice(0, nextBoundary);
          this.leftOver = data.slice(nextBoundary, data.length);
        }
      }
      this.push({
        data: exports2.utf8decode(usableData),
        meta: chunk.meta
      });
    };
    Utf8DecodeWorker.prototype.flush = function() {
      if (this.leftOver && this.leftOver.length) {
        this.push({
          data: exports2.utf8decode(this.leftOver),
          meta: {}
        });
        this.leftOver = null;
      }
    };
    exports2.Utf8DecodeWorker = Utf8DecodeWorker;
    function Utf8EncodeWorker() {
      GenericWorker.call(this, "utf-8 encode");
    }
    utils.inherits(Utf8EncodeWorker, GenericWorker);
    Utf8EncodeWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: exports2.utf8encode(chunk.data),
        meta: chunk.meta
      });
    };
    exports2.Utf8EncodeWorker = Utf8EncodeWorker;
  }
});
var require_ConvertWorker = __commonJS({
  "node_modules/jszip/lib/stream/ConvertWorker.js"(exports2, module2) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    var utils = require_utils();
    function ConvertWorker(destType) {
      GenericWorker.call(this, "ConvertWorker to " + destType);
      this.destType = destType;
    }
    utils.inherits(ConvertWorker, GenericWorker);
    ConvertWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: utils.transformTo(this.destType, chunk.data),
        meta: chunk.meta
      });
    };
    module2.exports = ConvertWorker;
  }
});
var require_NodejsStreamOutputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js"(exports2, module2) {
    "use strict";
    var Readable = require_readable().Readable;
    var utils = require_utils();
    utils.inherits(NodejsStreamOutputAdapter, Readable);
    function NodejsStreamOutputAdapter(helper, options, updateCb) {
      Readable.call(this, options);
      this._helper = helper;
      var self2 = this;
      helper.on("data", function(data, meta) {
        if (!self2.push(data)) {
          self2._helper.pause();
        }
        if (updateCb) {
          updateCb(meta);
        }
      }).on("error", function(e) {
        self2.emit("error", e);
      }).on("end", function() {
        self2.push(null);
      });
    }
    NodejsStreamOutputAdapter.prototype._read = function() {
      this._helper.resume();
    };
    module2.exports = NodejsStreamOutputAdapter;
  }
});
var require_StreamHelper = __commonJS({
  "node_modules/jszip/lib/stream/StreamHelper.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var ConvertWorker = require_ConvertWorker();
    var GenericWorker = require_GenericWorker();
    var base64 = require_base64();
    var support = require_support();
    var external = require_external();
    var NodejsStreamOutputAdapter = null;
    if (support.nodestream) {
      try {
        NodejsStreamOutputAdapter = require_NodejsStreamOutputAdapter();
      } catch (e) {
      }
    }
    function transformZipOutput(type, content, mimeType) {
      switch (type) {
        case "blob":
          return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
        case "base64":
          return base64.encode(content);
        default:
          return utils.transformTo(type, content);
      }
    }
    function concat(type, dataArray) {
      var i, index = 0, res = null, totalLength = 0;
      for (i = 0; i < dataArray.length; i++) {
        totalLength += dataArray[i].length;
      }
      switch (type) {
        case "string":
          return dataArray.join("");
        case "array":
          return Array.prototype.concat.apply([], dataArray);
        case "uint8array":
          res = new Uint8Array(totalLength);
          for (i = 0; i < dataArray.length; i++) {
            res.set(dataArray[i], index);
            index += dataArray[i].length;
          }
          return res;
        case "nodebuffer":
          return Buffer.concat(dataArray);
        default:
          throw new Error("concat : unsupported type '" + type + "'");
      }
    }
    function accumulate(helper, updateCallback) {
      return new external.Promise(function(resolve, reject) {
        var dataArray = [];
        var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
        helper.on("data", function(data, meta) {
          dataArray.push(data);
          if (updateCallback) {
            updateCallback(meta);
          }
        }).on("error", function(err) {
          dataArray = [];
          reject(err);
        }).on("end", function() {
          try {
            var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
            resolve(result);
          } catch (e) {
            reject(e);
          }
          dataArray = [];
        }).resume();
      });
    }
    function StreamHelper(worker, outputType, mimeType) {
      var internalType = outputType;
      switch (outputType) {
        case "blob":
        case "arraybuffer":
          internalType = "uint8array";
          break;
        case "base64":
          internalType = "string";
          break;
      }
      try {
        this._internalType = internalType;
        this._outputType = outputType;
        this._mimeType = mimeType;
        utils.checkSupport(internalType);
        this._worker = worker.pipe(new ConvertWorker(internalType));
        worker.lock();
      } catch (e) {
        this._worker = new GenericWorker("error");
        this._worker.error(e);
      }
    }
    StreamHelper.prototype = {
      /**
       * Listen a StreamHelper, accumulate its content and concatenate it into a
       * complete block.
       * @param {Function} updateCb the update callback.
       * @return Promise the promise for the accumulation.
       */
      accumulate: function(updateCb) {
        return accumulate(this, updateCb);
      },
      /**
       * Add a listener on an event triggered on a stream.
       * @param {String} evt the name of the event
       * @param {Function} fn the listener
       * @return {StreamHelper} the current helper.
       */
      on: function(evt, fn) {
        var self2 = this;
        if (evt === "data") {
          this._worker.on(evt, function(chunk) {
            fn.call(self2, chunk.data, chunk.meta);
          });
        } else {
          this._worker.on(evt, function() {
            utils.delay(fn, arguments, self2);
          });
        }
        return this;
      },
      /**
       * Resume the flow of chunks.
       * @return {StreamHelper} the current helper.
       */
      resume: function() {
        utils.delay(this._worker.resume, [], this._worker);
        return this;
      },
      /**
       * Pause the flow of chunks.
       * @return {StreamHelper} the current helper.
       */
      pause: function() {
        this._worker.pause();
        return this;
      },
      /**
       * Return a nodejs stream for this helper.
       * @param {Function} updateCb the update callback.
       * @return {NodejsStreamOutputAdapter} the nodejs stream.
       */
      toNodejsStream: function(updateCb) {
        utils.checkSupport("nodestream");
        if (this._outputType !== "nodebuffer") {
          throw new Error(this._outputType + " is not supported by this method");
        }
        return new NodejsStreamOutputAdapter(this, {
          objectMode: this._outputType !== "nodebuffer"
        }, updateCb);
      }
    };
    module2.exports = StreamHelper;
  }
});
var require_defaults = __commonJS({
  "node_modules/jszip/lib/defaults.js"(exports2) {
    "use strict";
    exports2.base64 = false;
    exports2.binary = false;
    exports2.dir = false;
    exports2.createFolders = true;
    exports2.date = null;
    exports2.compression = null;
    exports2.compressionOptions = null;
    exports2.comment = null;
    exports2.unixPermissions = null;
    exports2.dosPermissions = null;
  }
});
var require_DataWorker = __commonJS({
  "node_modules/jszip/lib/stream/DataWorker.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var DEFAULT_BLOCK_SIZE = 16 * 1024;
    function DataWorker(dataP) {
      GenericWorker.call(this, "DataWorker");
      var self2 = this;
      this.dataIsReady = false;
      this.index = 0;
      this.max = 0;
      this.data = null;
      this.type = "";
      this._tickScheduled = false;
      dataP.then(function(data) {
        self2.dataIsReady = true;
        self2.data = data;
        self2.max = data && data.length || 0;
        self2.type = utils.getTypeOf(data);
        if (!self2.isPaused) {
          self2._tickAndRepeat();
        }
      }, function(e) {
        self2.error(e);
      });
    }
    utils.inherits(DataWorker, GenericWorker);
    DataWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this.data = null;
    };
    DataWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this._tickScheduled && this.dataIsReady) {
        this._tickScheduled = true;
        utils.delay(this._tickAndRepeat, [], this);
      }
      return true;
    };
    DataWorker.prototype._tickAndRepeat = function() {
      this._tickScheduled = false;
      if (this.isPaused || this.isFinished) {
        return;
      }
      this._tick();
      if (!this.isFinished) {
        utils.delay(this._tickAndRepeat, [], this);
        this._tickScheduled = true;
      }
    };
    DataWorker.prototype._tick = function() {
      if (this.isPaused || this.isFinished) {
        return false;
      }
      var size = DEFAULT_BLOCK_SIZE;
      var data = null, nextIndex = Math.min(this.max, this.index + size);
      if (this.index >= this.max) {
        return this.end();
      } else {
        switch (this.type) {
          case "string":
            data = this.data.substring(this.index, nextIndex);
            break;
          case "uint8array":
            data = this.data.subarray(this.index, nextIndex);
            break;
          case "array":
          case "nodebuffer":
            data = this.data.slice(this.index, nextIndex);
            break;
        }
        this.index = nextIndex;
        return this.push({
          data,
          meta: {
            percent: this.max ? this.index / this.max * 100 : 0
          }
        });
      }
    };
    module2.exports = DataWorker;
  }
});
var require_crc32 = __commonJS({
  "node_modules/jszip/lib/crc32.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    function makeTable2() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable2 = makeTable2();
    function crc322(crc, buf, len, pos) {
      var t = crcTable2, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    function crc32str(crc, str, len, pos) {
      var t = crcTable2, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
      }
      return crc ^ -1;
    }
    module2.exports = function crc32wrapper(input, crc) {
      if (typeof input === "undefined" || !input.length) {
        return 0;
      }
      var isArray2 = utils.getTypeOf(input) !== "string";
      if (isArray2) {
        return crc322(crc | 0, input, input.length, 0);
      } else {
        return crc32str(crc | 0, input, input.length, 0);
      }
    };
  }
});
var require_Crc32Probe = __commonJS({
  "node_modules/jszip/lib/stream/Crc32Probe.js"(exports2, module2) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    var crc322 = require_crc32();
    var utils = require_utils();
    function Crc32Probe() {
      GenericWorker.call(this, "Crc32Probe");
      this.withStreamInfo("crc32", 0);
    }
    utils.inherits(Crc32Probe, GenericWorker);
    Crc32Probe.prototype.processChunk = function(chunk) {
      this.streamInfo.crc32 = crc322(chunk.data, this.streamInfo.crc32 || 0);
      this.push(chunk);
    };
    module2.exports = Crc32Probe;
  }
});
var require_DataLengthProbe = __commonJS({
  "node_modules/jszip/lib/stream/DataLengthProbe.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    function DataLengthProbe(propName) {
      GenericWorker.call(this, "DataLengthProbe for " + propName);
      this.propName = propName;
      this.withStreamInfo(propName, 0);
    }
    utils.inherits(DataLengthProbe, GenericWorker);
    DataLengthProbe.prototype.processChunk = function(chunk) {
      if (chunk) {
        var length = this.streamInfo[this.propName] || 0;
        this.streamInfo[this.propName] = length + chunk.data.length;
      }
      GenericWorker.prototype.processChunk.call(this, chunk);
    };
    module2.exports = DataLengthProbe;
  }
});
var require_compressedObject = __commonJS({
  "node_modules/jszip/lib/compressedObject.js"(exports2, module2) {
    "use strict";
    var external = require_external();
    var DataWorker = require_DataWorker();
    var Crc32Probe = require_Crc32Probe();
    var DataLengthProbe = require_DataLengthProbe();
    function CompressedObject(compressedSize, uncompressedSize, crc322, compression, data) {
      this.compressedSize = compressedSize;
      this.uncompressedSize = uncompressedSize;
      this.crc32 = crc322;
      this.compression = compression;
      this.compressedContent = data;
    }
    CompressedObject.prototype = {
      /**
       * Create a worker to get the uncompressed content.
       * @return {GenericWorker} the worker.
       */
      getContentWorker: function() {
        var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
        var that = this;
        worker.on("end", function() {
          if (this.streamInfo["data_length"] !== that.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
          }
        });
        return worker;
      },
      /**
       * Create a worker to get the compressed content.
       * @return {GenericWorker} the worker.
       */
      getCompressedWorker: function() {
        return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
      }
    };
    CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
      return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
    };
    module2.exports = CompressedObject;
  }
});
var require_zipObject = __commonJS({
  "node_modules/jszip/lib/zipObject.js"(exports2, module2) {
    "use strict";
    var StreamHelper = require_StreamHelper();
    var DataWorker = require_DataWorker();
    var utf8 = require_utf8();
    var CompressedObject = require_compressedObject();
    var GenericWorker = require_GenericWorker();
    var ZipObject = function(name, data, options) {
      this.name = name;
      this.dir = options.dir;
      this.date = options.date;
      this.comment = options.comment;
      this.unixPermissions = options.unixPermissions;
      this.dosPermissions = options.dosPermissions;
      this._data = data;
      this._dataBinary = options.binary;
      this.options = {
        compression: options.compression,
        compressionOptions: options.compressionOptions
      };
    };
    ZipObject.prototype = {
      /**
       * Create an internal stream for the content of this object.
       * @param {String} type the type of each chunk.
       * @return StreamHelper the stream.
       */
      internalStream: function(type) {
        var result = null, outputType = "string";
        try {
          if (!type) {
            throw new Error("No output type specified.");
          }
          outputType = type.toLowerCase();
          var askUnicodeString = outputType === "string" || outputType === "text";
          if (outputType === "binarystring" || outputType === "text") {
            outputType = "string";
          }
          result = this._decompressWorker();
          var isUnicodeString = !this._dataBinary;
          if (isUnicodeString && !askUnicodeString) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          if (!isUnicodeString && askUnicodeString) {
            result = result.pipe(new utf8.Utf8DecodeWorker());
          }
        } catch (e) {
          result = new GenericWorker("error");
          result.error(e);
        }
        return new StreamHelper(result, outputType, "");
      },
      /**
       * Prepare the content in the asked type.
       * @param {String} type the type of the result.
       * @param {Function} onUpdate a function to call on each internal update.
       * @return Promise the promise of the result.
       */
      async: function(type, onUpdate) {
        return this.internalStream(type).accumulate(onUpdate);
      },
      /**
       * Prepare the content as a nodejs stream.
       * @param {String} type the type of each chunk.
       * @param {Function} onUpdate a function to call on each internal update.
       * @return Stream the stream.
       */
      nodeStream: function(type, onUpdate) {
        return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
      },
      /**
       * Return a worker for the compressed content.
       * @private
       * @param {Object} compression the compression object to use.
       * @param {Object} compressionOptions the options to use when compressing.
       * @return Worker the worker.
       */
      _compressWorker: function(compression, compressionOptions) {
        if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) {
          return this._data.getCompressedWorker();
        } else {
          var result = this._decompressWorker();
          if (!this._dataBinary) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
        }
      },
      /**
       * Return a worker for the decompressed content.
       * @private
       * @return Worker the worker.
       */
      _decompressWorker: function() {
        if (this._data instanceof CompressedObject) {
          return this._data.getContentWorker();
        } else if (this._data instanceof GenericWorker) {
          return this._data;
        } else {
          return new DataWorker(this._data);
        }
      }
    };
    var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
    var removedFn = function() {
      throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    };
    for (i = 0; i < removedMethods.length; i++) {
      ZipObject.prototype[removedMethods[i]] = removedFn;
    }
    var i;
    module2.exports = ZipObject;
  }
});
var require_common = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/utils/common.js"(exports2) {
    "use strict";
    var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
    function _has(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
    exports2.assign = function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        var source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (var p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }
      return obj;
    };
    exports2.shrinkBuf = function(buf, size) {
      if (buf.length === size) {
        return buf;
      }
      if (buf.subarray) {
        return buf.subarray(0, size);
      }
      buf.length = size;
      return buf;
    };
    var fnTyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        if (src.subarray && dest.subarray) {
          dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
          return;
        }
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src[src_offs + i];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        var i, l, len, pos, chunk, result;
        len = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          len += chunks[i].length;
        }
        result = new Uint8Array(len);
        pos = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          chunk = chunks[i];
          result.set(chunk, pos);
          pos += chunk.length;
        }
        return result;
      }
    };
    var fnUntyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src[src_offs + i];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        return [].concat.apply([], chunks);
      }
    };
    exports2.setTyped = function(on) {
      if (on) {
        exports2.Buf8 = Uint8Array;
        exports2.Buf16 = Uint16Array;
        exports2.Buf32 = Int32Array;
        exports2.assign(exports2, fnTyped);
      } else {
        exports2.Buf8 = Array;
        exports2.Buf16 = Array;
        exports2.Buf32 = Array;
        exports2.assign(exports2, fnUntyped);
      }
    };
    exports2.setTyped(TYPED_OK);
  }
});
var require_trees = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/trees.js"(exports2) {
    "use strict";
    var utils = require_common();
    var Z_FIXED2 = 4;
    var Z_BINARY2 = 0;
    var Z_TEXT2 = 1;
    var Z_UNKNOWN2 = 2;
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    var STORED_BLOCK2 = 0;
    var STATIC_TREES2 = 1;
    var DYN_TREES2 = 2;
    var MIN_MATCH2 = 3;
    var MAX_MATCH2 = 258;
    var LENGTH_CODES2 = 29;
    var LITERALS2 = 256;
    var L_CODES2 = LITERALS2 + 1 + LENGTH_CODES2;
    var D_CODES2 = 30;
    var BL_CODES2 = 19;
    var HEAP_SIZE = 2 * L_CODES2 + 1;
    var MAX_BITS2 = 15;
    var Buf_size2 = 16;
    var MAX_BL_BITS = 7;
    var END_BLOCK2 = 256;
    var REP_3_62 = 16;
    var REPZ_3_102 = 17;
    var REPZ_11_1382 = 18;
    var extra_lbits2 = (
      /* extra bits for each length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
    );
    var extra_dbits2 = (
      /* extra bits for each distance code */
      [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
    );
    var extra_blbits2 = (
      /* extra bits for each bit length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
    );
    var bl_order2 = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    var DIST_CODE_LEN2 = 512;
    var static_ltree2 = new Array((L_CODES2 + 2) * 2);
    zero(static_ltree2);
    var static_dtree2 = new Array(D_CODES2 * 2);
    zero(static_dtree2);
    var _dist_code2 = new Array(DIST_CODE_LEN2);
    zero(_dist_code2);
    var _length_code2 = new Array(MAX_MATCH2 - MIN_MATCH2 + 1);
    zero(_length_code2);
    var base_length2 = new Array(LENGTH_CODES2);
    zero(base_length2);
    var base_dist2 = new Array(D_CODES2);
    zero(base_dist2);
    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      this.extra_bits = extra_bits;
      this.extra_base = extra_base;
      this.elems = elems;
      this.max_length = max_length;
      this.has_stree = static_tree && static_tree.length;
    }
    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;
    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      this.max_code = 0;
      this.stat_desc = stat_desc;
    }
    function d_code2(dist) {
      return dist < 256 ? _dist_code2[dist] : _dist_code2[256 + (dist >>> 7)];
    }
    function put_short2(s, w) {
      s.pending_buf[s.pending++] = w & 255;
      s.pending_buf[s.pending++] = w >>> 8 & 255;
    }
    function send_bits2(s, value, length) {
      if (s.bi_valid > Buf_size2 - length) {
        s.bi_buf |= value << s.bi_valid & 65535;
        put_short2(s, s.bi_buf);
        s.bi_buf = value >> Buf_size2 - s.bi_valid;
        s.bi_valid += length - Buf_size2;
      } else {
        s.bi_buf |= value << s.bi_valid & 65535;
        s.bi_valid += length;
      }
    }
    function send_code2(s, c, tree) {
      send_bits2(
        s,
        tree[c * 2],
        tree[c * 2 + 1]
        /*.Len*/
      );
    }
    function bi_reverse2(code, len) {
      var res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    }
    function bi_flush(s) {
      if (s.bi_valid === 16) {
        put_short2(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;
      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 255;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    }
    function gen_bitlen2(s, desc) {
      var tree = desc.dyn_tree;
      var max_code = desc.max_code;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var extra = desc.stat_desc.extra_bits;
      var base = desc.stat_desc.extra_base;
      var max_length = desc.stat_desc.max_length;
      var h;
      var n, m;
      var bits;
      var xbits;
      var f;
      var overflow = 0;
      for (bits = 0; bits <= MAX_BITS2; bits++) {
        s.bl_count[bits] = 0;
      }
      tree[s.heap[s.heap_max] * 2 + 1] = 0;
      for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1] = bits;
        if (n > max_code) {
          continue;
        }
        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
          xbits = extra[n - base];
        }
        f = tree[n * 2];
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) {
          bits--;
        }
        s.bl_count[bits]--;
        s.bl_count[bits + 1] += 2;
        s.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > max_code) {
            continue;
          }
          if (tree[m * 2 + 1] !== bits) {
            s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n--;
        }
      }
    }
    function gen_codes2(tree, max_code, bl_count) {
      var next_code = new Array(MAX_BITS2 + 1);
      var code = 0;
      var bits;
      var n;
      for (bits = 1; bits <= MAX_BITS2; bits++) {
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
      }
      for (n = 0; n <= max_code; n++) {
        var len = tree[n * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n * 2] = bi_reverse2(next_code[len]++, len);
      }
    }
    function tr_static_init() {
      var n;
      var bits;
      var length;
      var code;
      var dist;
      var bl_count = new Array(MAX_BITS2 + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES2 - 1; code++) {
        base_length2[code] = length;
        for (n = 0; n < 1 << extra_lbits2[code]; n++) {
          _length_code2[length++] = code;
        }
      }
      _length_code2[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist2[code] = dist;
        for (n = 0; n < 1 << extra_dbits2[code]; n++) {
          _dist_code2[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES2; code++) {
        base_dist2[code] = dist << 7;
        for (n = 0; n < 1 << extra_dbits2[code] - 7; n++) {
          _dist_code2[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS2; bits++) {
        bl_count[bits] = 0;
      }
      n = 0;
      while (n <= 143) {
        static_ltree2[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree2[n * 2 + 1] = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree2[n * 2 + 1] = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree2[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      gen_codes2(static_ltree2, L_CODES2 + 1, bl_count);
      for (n = 0; n < D_CODES2; n++) {
        static_dtree2[n * 2 + 1] = 5;
        static_dtree2[n * 2] = bi_reverse2(n, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree2, extra_lbits2, LITERALS2 + 1, L_CODES2, MAX_BITS2);
      static_d_desc = new StaticTreeDesc(static_dtree2, extra_dbits2, 0, D_CODES2, MAX_BITS2);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits2, 0, BL_CODES2, MAX_BL_BITS);
    }
    function init_block2(s) {
      var n;
      for (n = 0; n < L_CODES2; n++) {
        s.dyn_ltree[n * 2] = 0;
      }
      for (n = 0; n < D_CODES2; n++) {
        s.dyn_dtree[n * 2] = 0;
      }
      for (n = 0; n < BL_CODES2; n++) {
        s.bl_tree[n * 2] = 0;
      }
      s.dyn_ltree[END_BLOCK2 * 2] = 1;
      s.opt_len = s.static_len = 0;
      s.last_lit = s.matches = 0;
    }
    function bi_windup2(s) {
      if (s.bi_valid > 8) {
        put_short2(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    }
    function copy_block(s, buf, len, header) {
      bi_windup2(s);
      if (header) {
        put_short2(s, len);
        put_short2(s, ~len);
      }
      utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
      s.pending += len;
    }
    function smaller2(tree, n, m, depth) {
      var _n2 = n * 2;
      var _m2 = m * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
    }
    function pqdownheap2(s, tree, k) {
      var v = s.heap[k];
      var j = k << 1;
      while (j <= s.heap_len) {
        if (j < s.heap_len && smaller2(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        if (smaller2(tree, v, s.heap[j], s.depth)) {
          break;
        }
        s.heap[k] = s.heap[j];
        k = j;
        j <<= 1;
      }
      s.heap[k] = v;
    }
    function compress_block2(s, ltree, dtree) {
      var dist;
      var lc;
      var lx = 0;
      var code;
      var extra;
      if (s.last_lit !== 0) {
        do {
          dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
          lc = s.pending_buf[s.l_buf + lx];
          lx++;
          if (dist === 0) {
            send_code2(s, lc, ltree);
          } else {
            code = _length_code2[lc];
            send_code2(s, code + LITERALS2 + 1, ltree);
            extra = extra_lbits2[code];
            if (extra !== 0) {
              lc -= base_length2[code];
              send_bits2(s, lc, extra);
            }
            dist--;
            code = d_code2(dist);
            send_code2(s, code, dtree);
            extra = extra_dbits2[code];
            if (extra !== 0) {
              dist -= base_dist2[code];
              send_bits2(s, dist, extra);
            }
          }
        } while (lx < s.last_lit);
      }
      send_code2(s, END_BLOCK2, ltree);
    }
    function build_tree2(s, desc) {
      var tree = desc.dyn_tree;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var elems = desc.stat_desc.elems;
      var n, m;
      var max_code = -1;
      var node;
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE;
      for (n = 0; n < elems; n++) {
        if (tree[n * 2] !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;
        } else {
          tree[n * 2 + 1] = 0;
        }
      }
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (has_stree) {
          s.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n = s.heap_len >> 1; n >= 1; n--) {
        pqdownheap2(s, tree, n);
      }
      node = elems;
      do {
        n = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[
          1
          /*SMALLEST*/
        ] = s.heap[s.heap_len--];
        pqdownheap2(
          s,
          tree,
          1
          /*SMALLEST*/
        );
        m = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[--s.heap_max] = n;
        s.heap[--s.heap_max] = m;
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;
        s.heap[
          1
          /*SMALLEST*/
        ] = node++;
        pqdownheap2(
          s,
          tree,
          1
          /*SMALLEST*/
        );
      } while (s.heap_len >= 2);
      s.heap[--s.heap_max] = s.heap[
        1
        /*SMALLEST*/
      ];
      gen_bitlen2(s, desc);
      gen_codes2(tree, max_code, s.bl_count);
    }
    function scan_tree2(s, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s.bl_tree[curlen * 2]++;
          }
          s.bl_tree[REP_3_62 * 2]++;
        } else if (count <= 10) {
          s.bl_tree[REPZ_3_102 * 2]++;
        } else {
          s.bl_tree[REPZ_11_1382 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function send_tree2(s, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code2(s, curlen, s.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code2(s, curlen, s.bl_tree);
            count--;
          }
          send_code2(s, REP_3_62, s.bl_tree);
          send_bits2(s, count - 3, 2);
        } else if (count <= 10) {
          send_code2(s, REPZ_3_102, s.bl_tree);
          send_bits2(s, count - 3, 3);
        } else {
          send_code2(s, REPZ_11_1382, s.bl_tree);
          send_bits2(s, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function build_bl_tree2(s) {
      var max_blindex;
      scan_tree2(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree2(s, s.dyn_dtree, s.d_desc.max_code);
      build_tree2(s, s.bl_desc);
      for (max_blindex = BL_CODES2 - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order2[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    }
    function send_all_trees2(s, lcodes, dcodes, blcodes) {
      var rank;
      send_bits2(s, lcodes - 257, 5);
      send_bits2(s, dcodes - 1, 5);
      send_bits2(s, blcodes - 4, 4);
      for (rank = 0; rank < blcodes; rank++) {
        send_bits2(s, s.bl_tree[bl_order2[rank] * 2 + 1], 3);
      }
      send_tree2(s, s.dyn_ltree, lcodes - 1);
      send_tree2(s, s.dyn_dtree, dcodes - 1);
    }
    function detect_data_type2(s) {
      var black_mask = 4093624447;
      var n;
      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
          return Z_BINARY2;
        }
      }
      if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT2;
      }
      for (n = 32; n < LITERALS2; n++) {
        if (s.dyn_ltree[n * 2] !== 0) {
          return Z_TEXT2;
        }
      }
      return Z_BINARY2;
    }
    var static_init_done = false;
    function _tr_init(s) {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
      s.bi_buf = 0;
      s.bi_valid = 0;
      init_block2(s);
    }
    function _tr_stored_block2(s, buf, stored_len, last) {
      send_bits2(s, (STORED_BLOCK2 << 1) + (last ? 1 : 0), 3);
      copy_block(s, buf, stored_len, true);
    }
    function _tr_align(s) {
      send_bits2(s, STATIC_TREES2 << 1, 3);
      send_code2(s, END_BLOCK2, static_ltree2);
      bi_flush(s);
    }
    function _tr_flush_block2(s, buf, stored_len, last) {
      var opt_lenb, static_lenb;
      var max_blindex = 0;
      if (s.level > 0) {
        if (s.strm.data_type === Z_UNKNOWN2) {
          s.strm.data_type = detect_data_type2(s);
        }
        build_tree2(s, s.l_desc);
        build_tree2(s, s.d_desc);
        max_blindex = build_bl_tree2(s);
        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block2(s, buf, stored_len, last);
      } else if (s.strategy === Z_FIXED2 || static_lenb === opt_lenb) {
        send_bits2(s, (STATIC_TREES2 << 1) + (last ? 1 : 0), 3);
        compress_block2(s, static_ltree2, static_dtree2);
      } else {
        send_bits2(s, (DYN_TREES2 << 1) + (last ? 1 : 0), 3);
        send_all_trees2(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block2(s, s.dyn_ltree, s.dyn_dtree);
      }
      init_block2(s);
      if (last) {
        bi_windup2(s);
      }
    }
    function _tr_tally2(s, dist, lc) {
      s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
      s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
      s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
      s.last_lit++;
      if (dist === 0) {
        s.dyn_ltree[lc * 2]++;
      } else {
        s.matches++;
        dist--;
        s.dyn_ltree[(_length_code2[lc] + LITERALS2 + 1) * 2]++;
        s.dyn_dtree[d_code2(dist) * 2]++;
      }
      return s.last_lit === s.lit_bufsize - 1;
    }
    exports2._tr_init = _tr_init;
    exports2._tr_stored_block = _tr_stored_block2;
    exports2._tr_flush_block = _tr_flush_block2;
    exports2._tr_tally = _tr_tally2;
    exports2._tr_align = _tr_align;
  }
});
var require_adler32 = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/adler32.js"(exports2, module2) {
    "use strict";
    function adler322(adler, buf, len, pos) {
      var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
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
    }
    module2.exports = adler322;
  }
});
var require_crc322 = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/crc32.js"(exports2, module2) {
    "use strict";
    function makeTable2() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable2 = makeTable2();
    function crc322(crc, buf, len, pos) {
      var t = crcTable2, end = pos + len;
      crc ^= -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    module2.exports = crc322;
  }
});
var require_messages = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/messages.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      2: "need dictionary",
      /* Z_NEED_DICT       2  */
      1: "stream end",
      /* Z_STREAM_END      1  */
      0: "",
      /* Z_OK              0  */
      "-1": "file error",
      /* Z_ERRNO         (-1) */
      "-2": "stream error",
      /* Z_STREAM_ERROR  (-2) */
      "-3": "data error",
      /* Z_DATA_ERROR    (-3) */
      "-4": "insufficient memory",
      /* Z_MEM_ERROR     (-4) */
      "-5": "buffer error",
      /* Z_BUF_ERROR     (-5) */
      "-6": "incompatible version"
      /* Z_VERSION_ERROR (-6) */
    };
  }
});
var require_deflate = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/deflate.js"(exports2) {
    "use strict";
    var utils = require_common();
    var trees = require_trees();
    var adler322 = require_adler32();
    var crc322 = require_crc322();
    var msg = require_messages();
    var Z_NO_FLUSH = 0;
    var Z_PARTIAL_FLUSH = 1;
    var Z_FULL_FLUSH = 3;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_BUF_ERROR = -5;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_FILTERED = 1;
    var Z_HUFFMAN_ONLY = 2;
    var Z_RLE = 3;
    var Z_FIXED2 = 4;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_UNKNOWN2 = 2;
    var Z_DEFLATED = 8;
    var MAX_MEM_LEVEL = 9;
    var MAX_WBITS = 15;
    var DEF_MEM_LEVEL = 8;
    var LENGTH_CODES2 = 29;
    var LITERALS2 = 256;
    var L_CODES2 = LITERALS2 + 1 + LENGTH_CODES2;
    var D_CODES2 = 30;
    var BL_CODES2 = 19;
    var HEAP_SIZE = 2 * L_CODES2 + 1;
    var MAX_BITS2 = 15;
    var MIN_MATCH2 = 3;
    var MAX_MATCH2 = 258;
    var MIN_LOOKAHEAD2 = MAX_MATCH2 + MIN_MATCH2 + 1;
    var PRESET_DICT = 32;
    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;
    var BS_NEED_MORE2 = 1;
    var BS_BLOCK_DONE2 = 2;
    var BS_FINISH_STARTED2 = 3;
    var BS_FINISH_DONE2 = 4;
    var OS_CODE = 3;
    function err(strm, errorCode) {
      strm.msg = msg[errorCode];
      return errorCode;
    }
    function rank(f) {
      return (f << 1) - (f > 4 ? 9 : 0);
    }
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    function flush_pending2(strm) {
      var s = strm.state;
      var len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    }
    function flush_block_only2(s, last) {
      trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending2(s.strm);
    }
    function put_byte(s, b) {
      s.pending_buf[s.pending++] = b;
    }
    function putShortMSB(s, b) {
      s.pending_buf[s.pending++] = b >>> 8 & 255;
      s.pending_buf[s.pending++] = b & 255;
    }
    function read_buf2(strm, buf, start, size) {
      var len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      utils.arraySet(buf, strm.input, strm.next_in, len, start);
      if (strm.state.wrap === 1) {
        strm.adler = adler322(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc322(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    }
    function longest_match2(s, cur_match) {
      var chain_length = s.max_chain_length;
      var scan = s.strstart;
      var match;
      var len;
      var best_len = s.prev_length;
      var nice_match = s.nice_match;
      var limit = s.strstart > s.w_size - MIN_LOOKAHEAD2 ? s.strstart - (s.w_size - MIN_LOOKAHEAD2) : 0;
      var _win = s.window;
      var wmask = s.w_mask;
      var prev = s.prev;
      var strend = s.strstart + MAX_MATCH2;
      var scan_end1 = _win[scan + best_len - 1];
      var scan_end = _win[scan + best_len];
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s.lookahead) {
        nice_match = s.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH2 - (strend - scan);
        scan = strend - MAX_MATCH2;
        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    }
    function fill_window2(s) {
      var _w_size = s.w_size;
      var p, n, m, more, str;
      do {
        more = s.window_size - s.lookahead - s.strstart;
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD2)) {
          utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          s.block_start -= _w_size;
          n = s.hash_size;
          p = n;
          do {
            m = s.head[--p];
            s.head[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          n = _w_size;
          p = n;
          do {
            m = s.prev[--p];
            s.prev[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }
        n = read_buf2(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;
        if (s.lookahead + s.insert >= MIN_MATCH2) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
          while (s.insert) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH2 - 1]) & s.hash_mask;
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH2) {
              break;
            }
          }
        }
      } while (s.lookahead < MIN_LOOKAHEAD2 && s.strm.avail_in !== 0);
    }
    function deflate_stored2(s, flush) {
      var max_block_size = 65535;
      if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
      }
      for (; ; ) {
        if (s.lookahead <= 1) {
          fill_window2(s);
          if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE2;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.strstart += s.lookahead;
        s.lookahead = 0;
        var max_start = s.block_start + max_block_size;
        if (s.strstart === 0 || s.strstart >= max_start) {
          s.lookahead = s.strstart - max_start;
          s.strstart = max_start;
          flush_block_only2(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        }
        if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD2) {
          flush_block_only2(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only2(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED2;
        }
        return BS_FINISH_DONE2;
      }
      if (s.strstart > s.block_start) {
        flush_block_only2(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE2;
        }
      }
      return BS_NEED_MORE2;
    }
    function deflate_fast2(s, flush) {
      var hash_head;
      var bflush;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD2) {
          fill_window2(s);
          if (s.lookahead < MIN_LOOKAHEAD2 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE2;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH2) {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH2 - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD2) {
          s.match_length = longest_match2(s, hash_head);
        }
        if (s.match_length >= MIN_MATCH2) {
          bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH2);
          s.lookahead -= s.match_length;
          if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH2) {
            s.match_length--;
            do {
              s.strstart++;
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH2 - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            } while (--s.match_length !== 0);
            s.strstart++;
          } else {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
          }
        } else {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only2(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        }
      }
      s.insert = s.strstart < MIN_MATCH2 - 1 ? s.strstart : MIN_MATCH2 - 1;
      if (flush === Z_FINISH) {
        flush_block_only2(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED2;
        }
        return BS_FINISH_DONE2;
      }
      if (s.last_lit) {
        flush_block_only2(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE2;
        }
      }
      return BS_BLOCK_DONE2;
    }
    function deflate_slow2(s, flush) {
      var hash_head;
      var bflush;
      var max_insert;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD2) {
          fill_window2(s);
          if (s.lookahead < MIN_LOOKAHEAD2 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE2;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH2) {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH2 - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH2 - 1;
        if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD2) {
          s.match_length = longest_match2(s, hash_head);
          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH2 && s.strstart - s.match_start > 4096)) {
            s.match_length = MIN_MATCH2 - 1;
          }
        }
        if (s.prev_length >= MIN_MATCH2 && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH2;
          bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH2);
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH2 - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH2 - 1;
          s.strstart++;
          if (bflush) {
            flush_block_only2(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE2;
            }
          }
        } else if (s.match_available) {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
          if (bflush) {
            flush_block_only2(s, false);
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        } else {
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      if (s.match_available) {
        bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH2 - 1 ? s.strstart : MIN_MATCH2 - 1;
      if (flush === Z_FINISH) {
        flush_block_only2(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED2;
        }
        return BS_FINISH_DONE2;
      }
      if (s.last_lit) {
        flush_block_only2(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE2;
        }
      }
      return BS_BLOCK_DONE2;
    }
    function deflate_rle(s, flush) {
      var bflush;
      var prev;
      var scan, strend;
      var _win = s.window;
      for (; ; ) {
        if (s.lookahead <= MAX_MATCH2) {
          fill_window2(s);
          if (s.lookahead <= MAX_MATCH2 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE2;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH2 && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH2;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s.match_length = MAX_MATCH2 - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
        }
        if (s.match_length >= MIN_MATCH2) {
          bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH2);
          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only2(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only2(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED2;
        }
        return BS_FINISH_DONE2;
      }
      if (s.last_lit) {
        flush_block_only2(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE2;
        }
      }
      return BS_BLOCK_DONE2;
    }
    function deflate_huff(s, flush) {
      var bflush;
      for (; ; ) {
        if (s.lookahead === 0) {
          fill_window2(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE2;
            }
            break;
          }
        }
        s.match_length = 0;
        bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          flush_block_only2(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE2;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only2(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED2;
        }
        return BS_FINISH_DONE2;
      }
      if (s.last_lit) {
        flush_block_only2(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE2;
        }
      }
      return BS_BLOCK_DONE2;
    }
    function Config2(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }
    var configuration_table2;
    configuration_table2 = [
      /*      good lazy nice chain */
      new Config2(0, 0, 0, 0, deflate_stored2),
      /* 0 store only */
      new Config2(4, 4, 8, 4, deflate_fast2),
      /* 1 max speed, no lazy matches */
      new Config2(4, 5, 16, 8, deflate_fast2),
      /* 2 */
      new Config2(4, 6, 32, 32, deflate_fast2),
      /* 3 */
      new Config2(4, 4, 16, 16, deflate_slow2),
      /* 4 lazy matches */
      new Config2(8, 16, 32, 32, deflate_slow2),
      /* 5 */
      new Config2(8, 16, 128, 128, deflate_slow2),
      /* 6 */
      new Config2(8, 32, 128, 256, deflate_slow2),
      /* 7 */
      new Config2(32, 128, 258, 1024, deflate_slow2),
      /* 8 */
      new Config2(32, 258, 258, 4096, deflate_slow2)
      /* 9 max compression */
    ];
    function lm_init(s) {
      s.window_size = 2 * s.w_size;
      zero(s.head);
      s.max_lazy_match = configuration_table2[s.level].max_lazy;
      s.good_match = configuration_table2[s.level].good_length;
      s.nice_match = configuration_table2[s.level].nice_length;
      s.max_chain_length = configuration_table2[s.level].max_chain;
      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH2 - 1;
      s.match_available = 0;
      s.ins_h = 0;
    }
    function DeflateState() {
      this.strm = null;
      this.status = 0;
      this.pending_buf = null;
      this.pending_buf_size = 0;
      this.pending_out = 0;
      this.pending = 0;
      this.wrap = 0;
      this.gzhead = null;
      this.gzindex = 0;
      this.method = Z_DEFLATED;
      this.last_flush = -1;
      this.w_size = 0;
      this.w_bits = 0;
      this.w_mask = 0;
      this.window = null;
      this.window_size = 0;
      this.prev = null;
      this.head = null;
      this.ins_h = 0;
      this.hash_size = 0;
      this.hash_bits = 0;
      this.hash_mask = 0;
      this.hash_shift = 0;
      this.block_start = 0;
      this.match_length = 0;
      this.prev_match = 0;
      this.match_available = 0;
      this.strstart = 0;
      this.match_start = 0;
      this.lookahead = 0;
      this.prev_length = 0;
      this.max_chain_length = 0;
      this.max_lazy_match = 0;
      this.level = 0;
      this.strategy = 0;
      this.good_match = 0;
      this.nice_match = 0;
      this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
      this.dyn_dtree = new utils.Buf16((2 * D_CODES2 + 1) * 2);
      this.bl_tree = new utils.Buf16((2 * BL_CODES2 + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      this.d_desc = null;
      this.bl_desc = null;
      this.bl_count = new utils.Buf16(MAX_BITS2 + 1);
      this.heap = new utils.Buf16(2 * L_CODES2 + 1);
      zero(this.heap);
      this.heap_len = 0;
      this.heap_max = 0;
      this.depth = new utils.Buf16(2 * L_CODES2 + 1);
      zero(this.depth);
      this.l_buf = 0;
      this.lit_bufsize = 0;
      this.last_lit = 0;
      this.d_buf = 0;
      this.opt_len = 0;
      this.static_len = 0;
      this.matches = 0;
      this.insert = 0;
      this.bi_buf = 0;
      this.bi_valid = 0;
    }
    function deflateResetKeep(strm) {
      var s;
      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN2;
      s = strm.state;
      s.pending = 0;
      s.pending_out = 0;
      if (s.wrap < 0) {
        s.wrap = -s.wrap;
      }
      s.status = s.wrap ? INIT_STATE : BUSY_STATE;
      strm.adler = s.wrap === 2 ? 0 : 1;
      s.last_flush = Z_NO_FLUSH;
      trees._tr_init(s);
      return Z_OK;
    }
    function deflateReset(strm) {
      var ret = deflateResetKeep(strm);
      if (ret === Z_OK) {
        lm_init(strm.state);
      }
      return ret;
    }
    function deflateSetHeader(strm, head) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      if (strm.state.wrap !== 2) {
        return Z_STREAM_ERROR;
      }
      strm.state.gzhead = head;
      return Z_OK;
    }
    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      var wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED2) {
        return err(strm, Z_STREAM_ERROR);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      var s = new DeflateState();
      strm.state = s;
      s.strm = strm;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH2 - 1) / MIN_MATCH2);
      s.window = new utils.Buf8(s.w_size * 2);
      s.head = new utils.Buf16(s.hash_size);
      s.prev = new utils.Buf16(s.w_size);
      s.lit_bufsize = 1 << memLevel + 6;
      s.pending_buf_size = s.lit_bufsize * 4;
      s.pending_buf = new utils.Buf8(s.pending_buf_size);
      s.d_buf = 1 * s.lit_bufsize;
      s.l_buf = (1 + 2) * s.lit_bufsize;
      s.level = level;
      s.strategy = strategy;
      s.method = method;
      return deflateReset(strm);
    }
    function deflateInit(strm, level) {
      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    }
    function deflate(strm, flush) {
      var old_flush, s;
      var beg, val;
      if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }
      s = strm.state;
      if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }
      s.strm = strm;
      old_flush = s.last_flush;
      s.last_flush = flush;
      if (s.status === INIT_STATE) {
        if (s.wrap === 2) {
          strm.adler = 0;
          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);
          if (!s.gzhead) {
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
          } else {
            put_byte(
              s,
              (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
            );
            put_byte(s, s.gzhead.time & 255);
            put_byte(s, s.gzhead.time >> 8 & 255);
            put_byte(s, s.gzhead.time >> 16 & 255);
            put_byte(s, s.gzhead.time >> 24 & 255);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, s.gzhead.os & 255);
            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 255);
              put_byte(s, s.gzhead.extra.length >> 8 & 255);
            }
            if (s.gzhead.hcrc) {
              strm.adler = crc322(strm.adler, s.pending_buf, s.pending, 0);
            }
            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        } else {
          var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
          var level_flags = -1;
          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= level_flags << 6;
          if (s.strstart !== 0) {
            header |= PRESET_DICT;
          }
          header += 31 - header % 31;
          s.status = BUSY_STATE;
          putShortMSB(s, header);
          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
          }
          strm.adler = 1;
        }
      }
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra) {
          beg = s.pending;
          while (s.gzindex < (s.gzhead.extra.length & 65535)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending2(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                break;
              }
            }
            put_byte(s, s.gzhead.extra[s.gzindex] & 255);
            s.gzindex++;
          }
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        } else {
          s.status = NAME_STATE;
        }
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name) {
          beg = s.pending;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending2(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        } else {
          s.status = COMMENT_STATE;
        }
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment) {
          beg = s.pending;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending2(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.status = HCRC_STATE;
          }
        } else {
          s.status = HCRC_STATE;
        }
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending2(strm);
          }
          if (s.pending + 2 <= s.pending_buf_size) {
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            strm.adler = 0;
            s.status = BUSY_STATE;
          }
        } else {
          s.status = BUSY_STATE;
        }
      }
      if (s.pending !== 0) {
        flush_pending2(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }
      if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
        var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table2[s.level].func(s, flush);
        if (bstate === BS_FINISH_STARTED2 || bstate === BS_FINISH_DONE2) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE2 || bstate === BS_FINISH_STARTED2) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
          }
          return Z_OK;
        }
        if (bstate === BS_BLOCK_DONE2) {
          if (flush === Z_PARTIAL_FLUSH) {
            trees._tr_align(s);
          } else if (flush !== Z_BLOCK) {
            trees._tr_stored_block(s, 0, 0, false);
            if (flush === Z_FULL_FLUSH) {
              zero(s.head);
              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending2(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        }
      }
      if (flush !== Z_FINISH) {
        return Z_OK;
      }
      if (s.wrap <= 0) {
        return Z_STREAM_END;
      }
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        put_byte(s, strm.adler >> 16 & 255);
        put_byte(s, strm.adler >> 24 & 255);
        put_byte(s, strm.total_in & 255);
        put_byte(s, strm.total_in >> 8 & 255);
        put_byte(s, strm.total_in >> 16 & 255);
        put_byte(s, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      flush_pending2(strm);
      if (s.wrap > 0) {
        s.wrap = -s.wrap;
      }
      return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    }
    function deflateEnd(strm) {
      var status;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      status = strm.state.status;
      if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    }
    function deflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var s;
      var str, n;
      var wrap;
      var avail;
      var next;
      var input;
      var tmpDict;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      s = strm.state;
      wrap = s.wrap;
      if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
        return Z_STREAM_ERROR;
      }
      if (wrap === 1) {
        strm.adler = adler322(strm.adler, dictionary, dictLength, 0);
      }
      s.wrap = 0;
      if (dictLength >= s.w_size) {
        if (wrap === 0) {
          zero(s.head);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        tmpDict = new utils.Buf8(s.w_size);
        utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      avail = strm.avail_in;
      next = strm.next_in;
      input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window2(s);
      while (s.lookahead >= MIN_MATCH2) {
        str = s.strstart;
        n = s.lookahead - (MIN_MATCH2 - 1);
        do {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH2 - 1]) & s.hash_mask;
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
        } while (--n);
        s.strstart = str;
        s.lookahead = MIN_MATCH2 - 1;
        fill_window2(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH2 - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK;
    }
    exports2.deflateInit = deflateInit;
    exports2.deflateInit2 = deflateInit2;
    exports2.deflateReset = deflateReset;
    exports2.deflateResetKeep = deflateResetKeep;
    exports2.deflateSetHeader = deflateSetHeader;
    exports2.deflate = deflate;
    exports2.deflateEnd = deflateEnd;
    exports2.deflateSetDictionary = deflateSetDictionary;
    exports2.deflateInfo = "pako deflate (from Nodeca project)";
  }
});
var require_strings = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/utils/strings.js"(exports2) {
    "use strict";
    var utils = require_common();
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, [0]);
    } catch (__) {
      STR_APPLY_OK = false;
    }
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    var _utf8len = new utils.Buf8(256);
    for (q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    var q;
    _utf8len[254] = _utf8len[254] = 1;
    exports2.string2buf = function(str) {
      var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      buf = new utils.Buf8(buf_len);
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i++] = c;
        } else if (c < 2048) {
          buf[i++] = 192 | c >>> 6;
          buf[i++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i++] = 224 | c >>> 12;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        } else {
          buf[i++] = 240 | c >>> 18;
          buf[i++] = 128 | c >>> 12 & 63;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        }
      }
      return buf;
    };
    function buf2binstring(buf, len) {
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
          return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
        }
      }
      var result = "";
      for (var i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    }
    exports2.buf2binstring = function(buf) {
      return buf2binstring(buf, buf.length);
    };
    exports2.binstring2buf = function(str) {
      var buf = new utils.Buf8(str.length);
      for (var i = 0, len = buf.length; i < len; i++) {
        buf[i] = str.charCodeAt(i);
      }
      return buf;
    };
    exports2.buf2string = function(buf, max) {
      var i, out, c, c_len;
      var len = max || buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i = 0; i < len; ) {
        c = buf[i++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    exports2.utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
  }
});
var require_zstream = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/zstream.js"(exports2, module2) {
    "use strict";
    function ZStream2() {
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
    module2.exports = ZStream2;
  }
});
var require_deflate2 = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/deflate.js"(exports2) {
    "use strict";
    var zlib_deflate = require_deflate();
    var utils = require_common();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream2 = require_zstream();
    var toString2 = Object.prototype.toString;
    var Z_NO_FLUSH = 0;
    var Z_FINISH = 4;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_SYNC_FLUSH = 2;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_DEFLATED = 8;
    function Deflate(options) {
      if (!(this instanceof Deflate)) return new Deflate(options);
      this.options = utils.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream2();
      this.strm.avail_out = 0;
      var status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy
      );
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }
      if (opt.dictionary) {
        var dict;
        if (typeof opt.dictionary === "string") {
          dict = strings.string2buf(opt.dictionary);
        } else if (toString2.call(opt.dictionary) === "[object ArrayBuffer]") {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }
        status = zlib_deflate.deflateSetDictionary(this.strm, dict);
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        this._dict_set = true;
      }
    }
    Deflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var status, _mode;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString2.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_deflate.deflate(strm, _mode);
        if (status !== Z_STREAM_END && status !== Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
          if (this.options.to === "string") {
            this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
          } else {
            this.onData(utils.shrinkBuf(strm.output, strm.next_out));
          }
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
      if (_mode === Z_FINISH) {
        status = zlib_deflate.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK;
      }
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Deflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function deflate(input, options) {
      var deflator = new Deflate(options);
      deflator.push(input, true);
      if (deflator.err) {
        throw deflator.msg || msg[deflator.err];
      }
      return deflator.result;
    }
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate(input, options);
    }
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate(input, options);
    }
    exports2.Deflate = Deflate;
    exports2.deflate = deflate;
    exports2.deflateRaw = deflateRaw;
    exports2.gzip = gzip;
  }
});
var require_inffast = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/inffast.js"(exports2, module2) {
    "use strict";
    var BAD2 = 30;
    var TYPE2 = 12;
    module2.exports = function inflate_fast2(strm, start) {
      var state;
      var _in;
      var last;
      var _out;
      var beg;
      var end;
      var dmax;
      var wsize;
      var whave;
      var wnext;
      var s_window;
      var hold;
      var bits;
      var lcode;
      var dcode;
      var lmask;
      var dmask;
      var here;
      var op;
      var len;
      var dist;
      var from;
      var from_source;
      var input, output;
      state = strm.state;
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
          dolen:
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
                dodist:
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
                        state.mode = BAD2;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD2;
                            break top;
                          }
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
                          if (len > 1) {
                            output[_out++] = from_source[from++];
                          }
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
                          if (len > 1) {
                            output[_out++] = output[from++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD2;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE2;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD2;
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
      return;
    };
  }
});
var require_inftrees = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/inftrees.js"(exports2, module2) {
    "use strict";
    var utils = require_common();
    var MAXBITS2 = 15;
    var ENOUGH_LENS2 = 852;
    var ENOUGH_DISTS2 = 592;
    var CODES2 = 0;
    var LENS2 = 1;
    var DISTS2 = 2;
    var lbase2 = [
      /* Length codes 257..285 base */
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
    ];
    var lext2 = [
      /* Length codes 257..285 extra */
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
    ];
    var dbase2 = [
      /* Distance codes 0..29 base */
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
    ];
    var dext2 = [
      /* Distance codes 0..29 extra */
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
    ];
    module2.exports = function inflate_table2(type, lens, lens_index, codes, table, table_index, work, opts) {
      var bits = opts.bits;
      var len = 0;
      var sym = 0;
      var min = 0, max = 0;
      var root = 0;
      var curr = 0;
      var drop = 0;
      var left = 0;
      var used = 0;
      var huff = 0;
      var incr;
      var fill;
      var low;
      var mask;
      var next;
      var base = null;
      var base_index = 0;
      var end;
      var count = new utils.Buf16(MAXBITS2 + 1);
      var offs = new utils.Buf16(MAXBITS2 + 1);
      var extra = null;
      var extra_index = 0;
      var here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS2; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS2; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS2; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES2 || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS2; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES2) {
        base = extra = work;
        end = 19;
      } else if (type === LENS2) {
        base = lbase2;
        base_index -= 257;
        extra = lext2;
        extra_index -= 257;
        end = 256;
      } else {
        base = dbase2;
        extra = dext2;
        end = -1;
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
      if (type === LENS2 && used > ENOUGH_LENS2 || type === DISTS2 && used > ENOUGH_DISTS2) {
        return 1;
      }
      for (; ; ) {
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS2 && used > ENOUGH_LENS2 || type === DISTS2 && used > ENOUGH_DISTS2) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
  }
});
var require_inflate = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/inflate.js"(exports2) {
    "use strict";
    var utils = require_common();
    var adler322 = require_adler32();
    var crc322 = require_crc322();
    var inflate_fast2 = require_inffast();
    var inflate_table2 = require_inftrees();
    var CODES2 = 0;
    var LENS2 = 1;
    var DISTS2 = 2;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_TREES = 6;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_NEED_DICT = 2;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_MEM_ERROR = -4;
    var Z_BUF_ERROR = -5;
    var Z_DEFLATED = 8;
    var HEAD2 = 1;
    var FLAGS2 = 2;
    var TIME2 = 3;
    var OS2 = 4;
    var EXLEN2 = 5;
    var EXTRA2 = 6;
    var NAME2 = 7;
    var COMMENT2 = 8;
    var HCRC2 = 9;
    var DICTID2 = 10;
    var DICT2 = 11;
    var TYPE2 = 12;
    var TYPEDO2 = 13;
    var STORED2 = 14;
    var COPY_2 = 15;
    var COPY2 = 16;
    var TABLE2 = 17;
    var LENLENS2 = 18;
    var CODELENS2 = 19;
    var LEN_2 = 20;
    var LEN2 = 21;
    var LENEXT2 = 22;
    var DIST2 = 23;
    var DISTEXT2 = 24;
    var MATCH2 = 25;
    var LIT2 = 26;
    var CHECK2 = 27;
    var LENGTH2 = 28;
    var DONE2 = 29;
    var BAD2 = 30;
    var MEM2 = 31;
    var SYNC2 = 32;
    var ENOUGH_LENS2 = 852;
    var ENOUGH_DISTS2 = 592;
    var MAX_WBITS = 15;
    var DEF_WBITS = MAX_WBITS;
    function zswap322(q) {
      return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    }
    function InflateState2() {
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
      this.lens = new utils.Buf16(320);
      this.work = new utils.Buf16(288);
      this.lendyn = null;
      this.distdyn = null;
      this.sane = 0;
      this.back = 0;
      this.was = 0;
    }
    function inflateResetKeep2(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD2;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS2);
      state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS2);
      state.sane = 1;
      state.back = -1;
      return Z_OK;
    }
    function inflateReset3(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep2(strm);
    }
    function inflateReset22(strm, windowBits) {
      var wrap;
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset3(strm);
    }
    function inflateInit22(strm, windowBits) {
      var ret;
      var state;
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      state = new InflateState2();
      strm.state = state;
      state.window = null;
      ret = inflateReset22(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null;
      }
      return ret;
    }
    function inflateInit(strm) {
      return inflateInit22(strm, DEF_WBITS);
    }
    var virgin2 = true;
    var lenfix2;
    var distfix2;
    function fixedtables2(state) {
      if (virgin2) {
        var sym;
        lenfix2 = new utils.Buf32(512);
        distfix2 = new utils.Buf32(32);
        sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inflate_table2(LENS2, state.lens, 0, 288, lenfix2, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inflate_table2(DISTS2, state.lens, 0, 32, distfix2, 0, state.work, { bits: 5 });
        virgin2 = false;
      }
      state.lencode = lenfix2;
      state.lenbits = 9;
      state.distcode = distfix2;
      state.distbits = 5;
    }
    function updatewindow2(strm, src, end, copy) {
      var dist;
      var state = strm.state;
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new utils.Buf8(state.wsize);
      }
      if (copy >= state.wsize) {
        utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        utils.arraySet(state.window, src, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy) {
          utils.arraySet(state.window, src, end - copy, copy, 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    }
    function inflate2(strm, flush) {
      var state;
      var input, output;
      var next;
      var put;
      var have, left;
      var hold;
      var bits;
      var _in, _out;
      var copy;
      var from;
      var from_source;
      var here = 0;
      var here_bits, here_op, here_val;
      var last_bits, last_op, last_val;
      var len;
      var ret;
      var hbuf = new utils.Buf8(4);
      var opts;
      var n;
      var order = (
        /* permutation of code lengths */
        [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
      );
      if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.mode === TYPE2) {
        state.mode = TYPEDO2;
      }
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
            case HEAD2:
              if (state.wrap === 0) {
                state.mode = TYPEDO2;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc322(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS2;
                break;
              }
              state.flags = 0;
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || /* check if zlib header allowed */
              (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD2;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD2;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              } else if (len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD2;
                break;
              }
              state.dmax = 1 << len;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID2 : TYPE2;
              hold = 0;
              bits = 0;
              break;
            case FLAGS2:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD2;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD2;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc322(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME2;
            /* falls through */
            case TIME2:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc322(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS2;
            /* falls through */
            case OS2:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc322(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN2;
            /* falls through */
            case EXLEN2:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc322(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA2;
            /* falls through */
            case EXTRA2:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Array(state.head.extra_len);
                    }
                    utils.arraySet(
                      state.head.extra,
                      input,
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      copy,
                      /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                      len
                    );
                  }
                  if (state.flags & 512) {
                    state.check = crc322(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME2;
            /* falls through */
            case NAME2:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc322(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT2;
            /* falls through */
            case COMMENT2:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc322(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC2;
            /* falls through */
            case HCRC2:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD2;
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
              state.mode = TYPE2;
              break;
            case DICTID2:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap322(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT2;
            /* falls through */
            case DICT2:
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
              state.mode = TYPE2;
            /* falls through */
            case TYPE2:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case TYPEDO2:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK2;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED2;
                  break;
                case 1:
                  fixedtables2(state);
                  state.mode = LEN_2;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE2;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD2;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED2:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD2;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_2;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case COPY_2:
              state.mode = COPY2;
            /* falls through */
            case COPY2:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                utils.arraySet(output, input, next, copy, put);
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE2;
              break;
            case TABLE2:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
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
                state.mode = BAD2;
                break;
              }
              state.have = 0;
              state.mode = LENLENS2;
            /* falls through */
            case LENLENS2:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret = inflate_table2(CODES2, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD2;
                break;
              }
              state.have = 0;
              state.mode = CODELENS2;
            /* falls through */
            case CODELENS2:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
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
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD2;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n = here_bits + 3;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
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
                      if (have === 0) {
                        break inf_leave;
                      }
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
                    state.mode = BAD2;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD2) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD2;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret = inflate_table2(LENS2, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD2;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret = inflate_table2(DISTS2, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret) {
                strm.msg = "invalid distances set";
                state.mode = BAD2;
                break;
              }
              state.mode = LEN_2;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case LEN_2:
              state.mode = LEN2;
            /* falls through */
            case LEN2:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inflate_fast2(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE2) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
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
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
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
                state.mode = LIT2;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE2;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD2;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT2;
            /* falls through */
            case LENEXT2:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
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
              state.mode = DIST2;
            /* falls through */
            case DIST2:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
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
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
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
                state.mode = BAD2;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT2;
            /* falls through */
            case DISTEXT2:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
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
                state.mode = BAD2;
                break;
              }
              state.mode = MATCH2;
            /* falls through */
            case MATCH2:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD2;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from = state.wsize - copy;
                } else {
                  from = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN2;
              }
              break;
            case LIT2:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN2;
              break;
            case CHECK2:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (_out) {
                  strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                  state.flags ? crc322(state.check, output, _out, put - _out) : adler322(state.check, output, _out, put - _out);
                }
                _out = left;
                if ((state.flags ? hold : zswap322(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD2;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH2;
            /* falls through */
            case LENGTH2:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD2;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE2;
            /* falls through */
            case DONE2:
              ret = Z_STREAM_END;
              break inf_leave;
            case BAD2:
              ret = Z_DATA_ERROR;
              break inf_leave;
            case MEM2:
              return Z_MEM_ERROR;
            case SYNC2:
            /* falls through */
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
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD2 && (state.mode < CHECK2 || flush !== Z_FINISH)) {
        if (updatewindow2(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM2;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc322(state.check, output, _out, strm.next_out - _out) : adler322(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE2 ? 128 : 0) + (state.mode === LEN_2 || state.mode === COPY_2 ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    }
    function inflateEnd2(strm) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      var state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    }
    function inflateGetHeader(strm, head) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR;
      }
      state.head = head;
      head.done = false;
      return Z_OK;
    }
    function inflateSetDictionary2(strm, dictionary) {
      var dictLength = dictionary.length;
      var state;
      var dictid;
      var ret;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT2) {
        return Z_STREAM_ERROR;
      }
      if (state.mode === DICT2) {
        dictid = 1;
        dictid = adler322(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      ret = updatewindow2(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM2;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      return Z_OK;
    }
    exports2.inflateReset = inflateReset3;
    exports2.inflateReset2 = inflateReset22;
    exports2.inflateResetKeep = inflateResetKeep2;
    exports2.inflateInit = inflateInit;
    exports2.inflateInit2 = inflateInit22;
    exports2.inflate = inflate2;
    exports2.inflateEnd = inflateEnd2;
    exports2.inflateGetHeader = inflateGetHeader;
    exports2.inflateSetDictionary = inflateSetDictionary2;
    exports2.inflateInfo = "pako inflate (from Nodeca project)";
  }
});
var require_constants = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      //Z_MEM_ERROR:     -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,
      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,
      /* The deflate compression method */
      Z_DEFLATED: 8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };
  }
});
var require_gzheader = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/zlib/gzheader.js"(exports2, module2) {
    "use strict";
    function GZheader() {
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
    module2.exports = GZheader;
  }
});
var require_inflate2 = __commonJS({
  "node_modules/jszip/node_modules/pako/lib/inflate.js"(exports2) {
    "use strict";
    var zlib_inflate = require_inflate();
    var utils = require_common();
    var strings = require_strings();
    var c = require_constants();
    var msg = require_messages();
    var ZStream2 = require_zstream();
    var GZheader = require_gzheader();
    var toString2 = Object.prototype.toString;
    function Inflate2(options) {
      if (!(this instanceof Inflate2)) return new Inflate2(options);
      this.options = utils.assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream2();
      this.strm.avail_out = 0;
      var status = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );
      if (status !== c.Z_OK) {
        throw new Error(msg[status]);
      }
      this.header = new GZheader();
      zlib_inflate.inflateGetHeader(this.strm, this.header);
      if (opt.dictionary) {
        if (typeof opt.dictionary === "string") {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString2.call(opt.dictionary) === "[object ArrayBuffer]") {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) {
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }
    Inflate2.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;
      var allowBufError = false;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.binstring2buf(data);
      } else if (toString2.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
        if (status === c.Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
        }
        if (status === c.Z_BUF_ERROR && allowBufError === true) {
          status = c.Z_OK;
          allowBufError = false;
        }
        if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              tail = strm.next_out - next_out_utf8;
              utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) {
                utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
              }
              this.onData(utf8str);
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        }
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
      if (status === c.Z_STREAM_END) {
        _mode = c.Z_FINISH;
      }
      if (_mode === c.Z_FINISH) {
        status = zlib_inflate.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === c.Z_OK;
      }
      if (_mode === c.Z_SYNC_FLUSH) {
        this.onEnd(c.Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Inflate2.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate2.prototype.onEnd = function(status) {
      if (status === c.Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function inflate2(input, options) {
      var inflator = new Inflate2(options);
      inflator.push(input, true);
      if (inflator.err) {
        throw inflator.msg || msg[inflator.err];
      }
      return inflator.result;
    }
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate2(input, options);
    }
    exports2.Inflate = Inflate2;
    exports2.inflate = inflate2;
    exports2.inflateRaw = inflateRaw;
    exports2.ungzip = inflate2;
  }
});
var require_pako = __commonJS({
  "node_modules/jszip/node_modules/pako/index.js"(exports2, module2) {
    "use strict";
    var assign = require_common().assign;
    var deflate = require_deflate2();
    var inflate2 = require_inflate2();
    var constants = require_constants();
    var pako = {};
    assign(pako, deflate, inflate2, constants);
    module2.exports = pako;
  }
});
var require_flate = __commonJS({
  "node_modules/jszip/lib/flate.js"(exports2) {
    "use strict";
    var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
    var pako = require_pako();
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
    exports2.magic = "\b\0";
    function FlateWorker(action, options) {
      GenericWorker.call(this, "FlateWorker/" + action);
      this._pako = null;
      this._pakoAction = action;
      this._pakoOptions = options;
      this.meta = {};
    }
    utils.inherits(FlateWorker, GenericWorker);
    FlateWorker.prototype.processChunk = function(chunk) {
      this.meta = chunk.meta;
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
    };
    FlateWorker.prototype.flush = function() {
      GenericWorker.prototype.flush.call(this);
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push([], true);
    };
    FlateWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this._pako = null;
    };
    FlateWorker.prototype._createPako = function() {
      this._pako = new pako[this._pakoAction]({
        raw: true,
        level: this._pakoOptions.level || -1
        // default compression
      });
      var self2 = this;
      this._pako.onData = function(data) {
        self2.push({
          data,
          meta: self2.meta
        });
      };
    };
    exports2.compressWorker = function(compressionOptions) {
      return new FlateWorker("Deflate", compressionOptions);
    };
    exports2.uncompressWorker = function() {
      return new FlateWorker("Inflate", {});
    };
  }
});
var require_compressions = __commonJS({
  "node_modules/jszip/lib/compressions.js"(exports2) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    exports2.STORE = {
      magic: "\0\0",
      compressWorker: function() {
        return new GenericWorker("STORE compression");
      },
      uncompressWorker: function() {
        return new GenericWorker("STORE decompression");
      }
    };
    exports2.DEFLATE = require_flate();
  }
});
var require_signature = __commonJS({
  "node_modules/jszip/lib/signature.js"(exports2) {
    "use strict";
    exports2.LOCAL_FILE_HEADER = "PK";
    exports2.CENTRAL_FILE_HEADER = "PK";
    exports2.CENTRAL_DIRECTORY_END = "PK";
    exports2.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
    exports2.ZIP64_CENTRAL_DIRECTORY_END = "PK";
    exports2.DATA_DESCRIPTOR = "PK\x07\b";
  }
});
var require_ZipFileWorker = __commonJS({
  "node_modules/jszip/lib/generate/ZipFileWorker.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var utf8 = require_utf8();
    var crc322 = require_crc32();
    var signature = require_signature();
    var decToHex = function(dec, bytes) {
      var hex = "", i;
      for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 255);
        dec = dec >>> 8;
      }
      return hex;
    };
    var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
      var result = unixPermissions;
      if (!unixPermissions) {
        result = isDir ? 16893 : 33204;
      }
      return (result & 65535) << 16;
    };
    var generateDosExternalFileAttr = function(dosPermissions) {
      return (dosPermissions || 0) & 63;
    };
    var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
      var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
      var dataInfo = {
        crc32: 0,
        compressedSize: 0,
        uncompressedSize: 0
      };
      if (!streamedContent || streamingEnded) {
        dataInfo.crc32 = streamInfo["crc32"];
        dataInfo.compressedSize = streamInfo["compressedSize"];
        dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
      }
      var bitflag = 0;
      if (streamedContent) {
        bitflag |= 8;
      }
      if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
        bitflag |= 2048;
      }
      var extFileAttr = 0;
      var versionMadeBy = 0;
      if (dir) {
        extFileAttr |= 16;
      }
      if (platform === "UNIX") {
        versionMadeBy = 798;
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
      } else {
        versionMadeBy = 20;
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
      }
      dosTime = date.getUTCHours();
      dosTime = dosTime << 6;
      dosTime = dosTime | date.getUTCMinutes();
      dosTime = dosTime << 5;
      dosTime = dosTime | date.getUTCSeconds() / 2;
      dosDate = date.getUTCFullYear() - 1980;
      dosDate = dosDate << 4;
      dosDate = dosDate | date.getUTCMonth() + 1;
      dosDate = dosDate << 5;
      dosDate = dosDate | date.getUTCDate();
      if (useUTF8ForFileName) {
        unicodePathExtraField = // Version
        decToHex(1, 1) + // NameCRC32
        decToHex(crc322(encodedFileName), 4) + // UnicodeName
        utfEncodedFileName;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "up" + // size
        decToHex(unicodePathExtraField.length, 2) + // content
        unicodePathExtraField;
      }
      if (useUTF8ForComment) {
        unicodeCommentExtraField = // Version
        decToHex(1, 1) + // CommentCRC32
        decToHex(crc322(encodedComment), 4) + // UnicodeName
        utfEncodedComment;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "uc" + // size
        decToHex(unicodeCommentExtraField.length, 2) + // content
        unicodeCommentExtraField;
      }
      var header = "";
      header += "\n\0";
      header += decToHex(bitflag, 2);
      header += compression.magic;
      header += decToHex(dosTime, 2);
      header += decToHex(dosDate, 2);
      header += decToHex(dataInfo.crc32, 4);
      header += decToHex(dataInfo.compressedSize, 4);
      header += decToHex(dataInfo.uncompressedSize, 4);
      header += decToHex(encodedFileName.length, 2);
      header += decToHex(extraFields.length, 2);
      var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
      var dirRecord = signature.CENTRAL_FILE_HEADER + // version made by (00: DOS)
      decToHex(versionMadeBy, 2) + // file header (common to file and central directory)
      header + // file comment length
      decToHex(encodedComment.length, 2) + // disk number start
      "\0\0\0\0" + // external file attributes
      decToHex(extFileAttr, 4) + // relative offset of local header
      decToHex(offset, 4) + // file name
      encodedFileName + // extra field
      extraFields + // file comment
      encodedComment;
      return {
        fileRecord,
        dirRecord
      };
    };
    var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
      var dirEnd = "";
      var encodedComment = utils.transformTo("string", encodeFileName(comment));
      dirEnd = signature.CENTRAL_DIRECTORY_END + // number of this disk
      "\0\0\0\0" + // total number of entries in the central directory on this disk
      decToHex(entriesCount, 2) + // total number of entries in the central directory
      decToHex(entriesCount, 2) + // size of the central directory   4 bytes
      decToHex(centralDirLength, 4) + // offset of start of central directory with respect to the starting disk number
      decToHex(localDirLength, 4) + // .ZIP file comment length
      decToHex(encodedComment.length, 2) + // .ZIP file comment
      encodedComment;
      return dirEnd;
    };
    var generateDataDescriptors = function(streamInfo) {
      var descriptor = "";
      descriptor = signature.DATA_DESCRIPTOR + // crc-32                          4 bytes
      decToHex(streamInfo["crc32"], 4) + // compressed size                 4 bytes
      decToHex(streamInfo["compressedSize"], 4) + // uncompressed size               4 bytes
      decToHex(streamInfo["uncompressedSize"], 4);
      return descriptor;
    };
    function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
      GenericWorker.call(this, "ZipFileWorker");
      this.bytesWritten = 0;
      this.zipComment = comment;
      this.zipPlatform = platform;
      this.encodeFileName = encodeFileName;
      this.streamFiles = streamFiles;
      this.accumulate = false;
      this.contentBuffer = [];
      this.dirRecords = [];
      this.currentSourceOffset = 0;
      this.entriesCount = 0;
      this.currentFile = null;
      this._sources = [];
    }
    utils.inherits(ZipFileWorker, GenericWorker);
    ZipFileWorker.prototype.push = function(chunk) {
      var currentFilePercent = chunk.meta.percent || 0;
      var entriesCount = this.entriesCount;
      var remainingFiles = this._sources.length;
      if (this.accumulate) {
        this.contentBuffer.push(chunk);
      } else {
        this.bytesWritten += chunk.data.length;
        GenericWorker.prototype.push.call(this, {
          data: chunk.data,
          meta: {
            currentFile: this.currentFile,
            percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
          }
        });
      }
    };
    ZipFileWorker.prototype.openedSource = function(streamInfo) {
      this.currentSourceOffset = this.bytesWritten;
      this.currentFile = streamInfo["file"].name;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      if (streamedContent) {
        var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
      } else {
        this.accumulate = true;
      }
    };
    ZipFileWorker.prototype.closedSource = function(streamInfo) {
      this.accumulate = false;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
      this.dirRecords.push(record.dirRecord);
      if (streamedContent) {
        this.push({
          data: generateDataDescriptors(streamInfo),
          meta: { percent: 100 }
        });
      } else {
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
        while (this.contentBuffer.length) {
          this.push(this.contentBuffer.shift());
        }
      }
      this.currentFile = null;
    };
    ZipFileWorker.prototype.flush = function() {
      var localDirLength = this.bytesWritten;
      for (var i = 0; i < this.dirRecords.length; i++) {
        this.push({
          data: this.dirRecords[i],
          meta: { percent: 100 }
        });
      }
      var centralDirLength = this.bytesWritten - localDirLength;
      var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
      this.push({
        data: dirEnd,
        meta: { percent: 100 }
      });
    };
    ZipFileWorker.prototype.prepareNextSource = function() {
      this.previous = this._sources.shift();
      this.openedSource(this.previous.streamInfo);
      if (this.isPaused) {
        this.previous.pause();
      } else {
        this.previous.resume();
      }
    };
    ZipFileWorker.prototype.registerPrevious = function(previous) {
      this._sources.push(previous);
      var self2 = this;
      previous.on("data", function(chunk) {
        self2.processChunk(chunk);
      });
      previous.on("end", function() {
        self2.closedSource(self2.previous.streamInfo);
        if (self2._sources.length) {
          self2.prepareNextSource();
        } else {
          self2.end();
        }
      });
      previous.on("error", function(e) {
        self2.error(e);
      });
      return this;
    };
    ZipFileWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this.previous && this._sources.length) {
        this.prepareNextSource();
        return true;
      }
      if (!this.previous && !this._sources.length && !this.generatedError) {
        this.end();
        return true;
      }
    };
    ZipFileWorker.prototype.error = function(e) {
      var sources = this._sources;
      if (!GenericWorker.prototype.error.call(this, e)) {
        return false;
      }
      for (var i = 0; i < sources.length; i++) {
        try {
          sources[i].error(e);
        } catch (e2) {
        }
      }
      return true;
    };
    ZipFileWorker.prototype.lock = function() {
      GenericWorker.prototype.lock.call(this);
      var sources = this._sources;
      for (var i = 0; i < sources.length; i++) {
        sources[i].lock();
      }
    };
    module2.exports = ZipFileWorker;
  }
});
var require_generate = __commonJS({
  "node_modules/jszip/lib/generate/index.js"(exports2) {
    "use strict";
    var compressions = require_compressions();
    var ZipFileWorker = require_ZipFileWorker();
    var getCompression2 = function(fileCompression, zipCompression) {
      var compressionName = fileCompression || zipCompression;
      var compression = compressions[compressionName];
      if (!compression) {
        throw new Error(compressionName + " is not a valid compression method !");
      }
      return compression;
    };
    exports2.generateWorker = function(zip, options, comment) {
      var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
      var entriesCount = 0;
      try {
        zip.forEach(function(relativePath, file) {
          entriesCount++;
          var compression = getCompression2(file.options.compression, options.compression);
          var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
          var dir = file.dir, date = file.date;
          file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
            name: relativePath,
            dir,
            date,
            comment: file.comment || "",
            unixPermissions: file.unixPermissions,
            dosPermissions: file.dosPermissions
          }).pipe(zipFileWorker);
        });
        zipFileWorker.entriesCount = entriesCount;
      } catch (e) {
        zipFileWorker.error(e);
      }
      return zipFileWorker;
    };
  }
});
var require_NodejsStreamInputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    function NodejsStreamInputAdapter(filename, stream) {
      GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
      this._upstreamEnded = false;
      this._bindStream(stream);
    }
    utils.inherits(NodejsStreamInputAdapter, GenericWorker);
    NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
      var self2 = this;
      this._stream = stream;
      stream.pause();
      stream.on("data", function(chunk) {
        self2.push({
          data: chunk,
          meta: {
            percent: 0
          }
        });
      }).on("error", function(e) {
        if (self2.isPaused) {
          this.generatedError = e;
        } else {
          self2.error(e);
        }
      }).on("end", function() {
        if (self2.isPaused) {
          self2._upstreamEnded = true;
        } else {
          self2.end();
        }
      });
    };
    NodejsStreamInputAdapter.prototype.pause = function() {
      if (!GenericWorker.prototype.pause.call(this)) {
        return false;
      }
      this._stream.pause();
      return true;
    };
    NodejsStreamInputAdapter.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (this._upstreamEnded) {
        this.end();
      } else {
        this._stream.resume();
      }
      return true;
    };
    module2.exports = NodejsStreamInputAdapter;
  }
});
var require_object = __commonJS({
  "node_modules/jszip/lib/object.js"(exports2, module2) {
    "use strict";
    var utf8 = require_utf8();
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var StreamHelper = require_StreamHelper();
    var defaults = require_defaults();
    var CompressedObject = require_compressedObject();
    var ZipObject = require_zipObject();
    var generate = require_generate();
    var nodejsUtils = require_nodejsUtils();
    var NodejsStreamInputAdapter = require_NodejsStreamInputAdapter();
    var fileAdd = function(name, data, originalOptions) {
      var dataType = utils.getTypeOf(data), parent;
      var o = utils.extend(originalOptions || {}, defaults);
      o.date = o.date || /* @__PURE__ */ new Date();
      if (o.compression !== null) {
        o.compression = o.compression.toUpperCase();
      }
      if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
      }
      if (o.unixPermissions && o.unixPermissions & 16384) {
        o.dir = true;
      }
      if (o.dosPermissions && o.dosPermissions & 16) {
        o.dir = true;
      }
      if (o.dir) {
        name = forceTrailingSlash(name);
      }
      if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
      }
      var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
      if (!originalOptions || typeof originalOptions.binary === "undefined") {
        o.binary = !isUnicodeString;
      }
      var isCompressedEmpty = data instanceof CompressedObject && data.uncompressedSize === 0;
      if (isCompressedEmpty || o.dir || !data || data.length === 0) {
        o.base64 = false;
        o.binary = true;
        data = "";
        o.compression = "STORE";
        dataType = "string";
      }
      var zipObjectContent = null;
      if (data instanceof CompressedObject || data instanceof GenericWorker) {
        zipObjectContent = data;
      } else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        zipObjectContent = new NodejsStreamInputAdapter(name, data);
      } else {
        zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
      }
      var object = new ZipObject(name, zipObjectContent, o);
      this.files[name] = object;
    };
    var parentFolder = function(path) {
      if (path.slice(-1) === "/") {
        path = path.substring(0, path.length - 1);
      }
      var lastSlash = path.lastIndexOf("/");
      return lastSlash > 0 ? path.substring(0, lastSlash) : "";
    };
    var forceTrailingSlash = function(path) {
      if (path.slice(-1) !== "/") {
        path += "/";
      }
      return path;
    };
    var folderAdd = function(name, createFolders) {
      createFolders = typeof createFolders !== "undefined" ? createFolders : defaults.createFolders;
      name = forceTrailingSlash(name);
      if (!this.files[name]) {
        fileAdd.call(this, name, null, {
          dir: true,
          createFolders
        });
      }
      return this.files[name];
    };
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    var out = {
      /**
       * @see loadAsync
       */
      load: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      /**
       * Call a callback function for each entry at this folder level.
       * @param {Function} cb the callback function:
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       */
      forEach: function(cb) {
        var filename, relativePath, file;
        for (filename in this.files) {
          file = this.files[filename];
          relativePath = filename.slice(this.root.length, filename.length);
          if (relativePath && filename.slice(0, this.root.length) === this.root) {
            cb(relativePath, file);
          }
        }
      },
      /**
       * Filter nested files/folders with the specified function.
       * @param {Function} search the predicate to use :
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       * @return {Array} An array of matching elements.
       */
      filter: function(search) {
        var result = [];
        this.forEach(function(relativePath, entry) {
          if (search(relativePath, entry)) {
            result.push(entry);
          }
        });
        return result;
      },
      /**
       * Add a file to the zip file, or search a file.
       * @param   {string|RegExp} name The name of the file to add (if data is defined),
       * the name of the file to find (if no data) or a regex to match files.
       * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
       * @param   {Object} o     File options
       * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
       * a file (when searching by string) or an array of files (when searching by regex).
       */
      file: function(name, data, o) {
        if (arguments.length === 1) {
          if (isRegExp(name)) {
            var regexp = name;
            return this.filter(function(relativePath, file) {
              return !file.dir && regexp.test(relativePath);
            });
          } else {
            var obj = this.files[this.root + name];
            if (obj && !obj.dir) {
              return obj;
            } else {
              return null;
            }
          }
        } else {
          name = this.root + name;
          fileAdd.call(this, name, data, o);
        }
        return this;
      },
      /**
       * Add a directory to the zip file, or search.
       * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
       * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
       */
      folder: function(arg) {
        if (!arg) {
          return this;
        }
        if (isRegExp(arg)) {
          return this.filter(function(relativePath, file) {
            return file.dir && arg.test(relativePath);
          });
        }
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);
        var ret = this.clone();
        ret.root = newFolder.name;
        return ret;
      },
      /**
       * Delete a file, or a directory and all sub-files, from the zip
       * @param {string} name the name of the file to delete
       * @return {JSZip} this JSZip object
       */
      remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
          if (name.slice(-1) !== "/") {
            name += "/";
          }
          file = this.files[name];
        }
        if (file && !file.dir) {
          delete this.files[name];
        } else {
          var kids = this.filter(function(relativePath, file2) {
            return file2.name.slice(0, name.length) === name;
          });
          for (var i = 0; i < kids.length; i++) {
            delete this.files[kids[i].name];
          }
        }
        return this;
      },
      /**
       * @deprecated This method has been removed in JSZip 3.0, please check the upgrade guide.
       */
      generate: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      /**
       * Generate the complete zip file as an internal stream.
       * @param {Object} options the options to generate the zip file :
       * - compression, "STORE" by default.
       * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
       * @return {StreamHelper} the streamed zip file.
       */
      generateInternalStream: function(options) {
        var worker, opts = {};
        try {
          opts = utils.extend(options || {}, {
            streamFiles: false,
            compression: "STORE",
            compressionOptions: null,
            type: "",
            platform: "DOS",
            comment: null,
            mimeType: "application/zip",
            encodeFileName: utf8.utf8encode
          });
          opts.type = opts.type.toLowerCase();
          opts.compression = opts.compression.toUpperCase();
          if (opts.type === "binarystring") {
            opts.type = "string";
          }
          if (!opts.type) {
            throw new Error("No output type specified.");
          }
          utils.checkSupport(opts.type);
          if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") {
            opts.platform = "UNIX";
          }
          if (opts.platform === "win32") {
            opts.platform = "DOS";
          }
          var comment = opts.comment || this.comment || "";
          worker = generate.generateWorker(this, opts, comment);
        } catch (e) {
          worker = new GenericWorker("error");
          worker.error(e);
        }
        return new StreamHelper(worker, opts.type || "string", opts.mimeType);
      },
      /**
       * Generate the complete zip file asynchronously.
       * @see generateInternalStream
       */
      generateAsync: function(options, onUpdate) {
        return this.generateInternalStream(options).accumulate(onUpdate);
      },
      /**
       * Generate the complete zip file asynchronously.
       * @see generateInternalStream
       */
      generateNodeStream: function(options, onUpdate) {
        options = options || {};
        if (!options.type) {
          options.type = "nodebuffer";
        }
        return this.generateInternalStream(options).toNodejsStream(onUpdate);
      }
    };
    module2.exports = out;
  }
});
var require_DataReader = __commonJS({
  "node_modules/jszip/lib/reader/DataReader.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    function DataReader2(data) {
      this.data = data;
      this.length = data.length;
      this.index = 0;
      this.zero = 0;
    }
    DataReader2.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specified index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex: function(newIndex) {
        if (this.length < this.zero + newIndex || newIndex < 0) {
          throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
        }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the data.
       */
      setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
      },
      /**
       * Skip the next n bytes.
       * @param {number} n the number of bytes to skip.
       * @throws {Error} if the new index is out of the data.
       */
      skip: function(n) {
        this.setIndex(this.index + n);
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt: function() {
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt: function(size) {
        var result = 0, i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
          result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
      },
      /**
       * Get the next string with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {string} the corresponding string.
       */
      readString: function(size) {
        return utils.transformTo("string", this.readData(size));
      },
      /**
       * Get raw data without conversion, <size> bytes.
       * @param {number} size the number of bytes to read.
       * @return {Object} the raw data, implementation specific.
       */
      readData: function() {
      },
      /**
       * Find the last occurrence of a zip signature (4 bytes).
       * @param {string} sig the signature to find.
       * @return {number} the index of the last occurrence, -1 if not found.
       */
      lastIndexOfSignature: function() {
      },
      /**
       * Read the signature (4 bytes) at the current position and compare it with sig.
       * @param {string} sig the expected signature
       * @return {boolean} true if the signature matches, false otherwise.
       */
      readAndCheckSignature: function() {
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate: function() {
        var dostime = this.readInt(4);
        return new Date(Date.UTC(
          (dostime >> 25 & 127) + 1980,
          // year
          (dostime >> 21 & 15) - 1,
          // month
          dostime >> 16 & 31,
          // day
          dostime >> 11 & 31,
          // hour
          dostime >> 5 & 63,
          // minute
          (dostime & 31) << 1
        ));
      }
    };
    module2.exports = DataReader2;
  }
});
var require_ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/ArrayReader.js"(exports2, module2) {
    "use strict";
    var DataReader2 = require_DataReader();
    var utils = require_utils();
    function ArrayReader(data) {
      DataReader2.call(this, data);
      for (var i = 0; i < this.data.length; i++) {
        data[i] = data[i] & 255;
      }
    }
    utils.inherits(ArrayReader, DataReader2);
    ArrayReader.prototype.byteAt = function(i) {
      return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
      for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
          return i - this.zero;
        }
      }
      return -1;
    };
    ArrayReader.prototype.readAndCheckSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
      return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return [];
      }
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = ArrayReader;
  }
});
var require_StringReader = __commonJS({
  "node_modules/jszip/lib/reader/StringReader.js"(exports2, module2) {
    "use strict";
    var DataReader2 = require_DataReader();
    var utils = require_utils();
    function StringReader(data) {
      DataReader2.call(this, data);
    }
    utils.inherits(StringReader, DataReader2);
    StringReader.prototype.byteAt = function(i) {
      return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function(sig) {
      return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readAndCheckSignature = function(sig) {
      var data = this.readData(4);
      return sig === data;
    };
    StringReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = StringReader;
  }
});
var require_Uint8ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/Uint8ArrayReader.js"(exports2, module2) {
    "use strict";
    var ArrayReader = require_ArrayReader();
    var utils = require_utils();
    function Uint8ArrayReader(data) {
      ArrayReader.call(this, data);
    }
    utils.inherits(Uint8ArrayReader, ArrayReader);
    Uint8ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return new Uint8Array(0);
      }
      var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = Uint8ArrayReader;
  }
});
var require_NodeBufferReader = __commonJS({
  "node_modules/jszip/lib/reader/NodeBufferReader.js"(exports2, module2) {
    "use strict";
    var Uint8ArrayReader = require_Uint8ArrayReader();
    var utils = require_utils();
    function NodeBufferReader(data) {
      Uint8ArrayReader.call(this, data);
    }
    utils.inherits(NodeBufferReader, Uint8ArrayReader);
    NodeBufferReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = NodeBufferReader;
  }
});
var require_readerFor = __commonJS({
  "node_modules/jszip/lib/reader/readerFor.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var ArrayReader = require_ArrayReader();
    var StringReader = require_StringReader();
    var NodeBufferReader = require_NodeBufferReader();
    var Uint8ArrayReader = require_Uint8ArrayReader();
    module2.exports = function(data) {
      var type = utils.getTypeOf(data);
      utils.checkSupport(type);
      if (type === "string" && !support.uint8array) {
        return new StringReader(data);
      }
      if (type === "nodebuffer") {
        return new NodeBufferReader(data);
      }
      if (support.uint8array) {
        return new Uint8ArrayReader(utils.transformTo("uint8array", data));
      }
      return new ArrayReader(utils.transformTo("array", data));
    };
  }
});
var require_zipEntry = __commonJS({
  "node_modules/jszip/lib/zipEntry.js"(exports2, module2) {
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils();
    var CompressedObject = require_compressedObject();
    var crc32fn = require_crc32();
    var utf8 = require_utf8();
    var compressions = require_compressions();
    var support = require_support();
    var MADE_BY_DOS = 0;
    var MADE_BY_UNIX = 3;
    var findCompression = function(compressionMethod) {
      for (var method in compressions) {
        if (!Object.prototype.hasOwnProperty.call(compressions, method)) {
          continue;
        }
        if (compressions[method].magic === compressionMethod) {
          return compressions[method];
        }
      }
      return null;
    };
    function ZipEntry(options, loadOptions) {
      this.options = options;
      this.loadOptions = loadOptions;
    }
    ZipEntry.prototype = {
      /**
       * say if the file is encrypted.
       * @return {boolean} true if the file is encrypted, false otherwise.
       */
      isEncrypted: function() {
        return (this.bitFlag & 1) === 1;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8: function() {
        return (this.bitFlag & 2048) === 2048;
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;
        reader.skip(22);
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2);
        this.fileName = reader.readData(this.fileNameLength);
        reader.skip(localExtraFieldsLength);
        if (this.compressedSize === -1 || this.uncompressedSize === -1) {
          throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
        }
        compression = findCompression(this.compressionMethod);
        if (compression === null) {
          throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
        }
        this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readCentralPart: function(reader) {
        this.versionMadeBy = reader.readInt(2);
        reader.skip(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        var fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);
        if (this.isEncrypted()) {
          throw new Error("Encrypted zip are not supported");
        }
        reader.skip(fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readData(this.fileCommentLength);
      },
      /**
       * Parse the external file attributes and get the unix/dos permissions.
       */
      processAttributes: function() {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;
        this.dir = this.externalFileAttributes & 16 ? true : false;
        if (madeBy === MADE_BY_DOS) {
          this.dosPermissions = this.externalFileAttributes & 63;
        }
        if (madeBy === MADE_BY_UNIX) {
          this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
        }
        if (!this.dir && this.fileNameStr.slice(-1) === "/") {
          this.dir = true;
        }
      },
      /**
       * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
       * @param {DataReader} reader the reader to use.
       */
      parseZIP64ExtraField: function() {
        if (!this.extraFields[1]) {
          return;
        }
        var extraReader = readerFor(this.extraFields[1].value);
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
          this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
          this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
          this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
          this.diskNumberStart = extraReader.readInt(4);
        }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readExtraFields: function(reader) {
        var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
        if (!this.extraFields) {
          this.extraFields = {};
        }
        while (reader.index + 4 < end) {
          extraFieldId = reader.readInt(2);
          extraFieldLength = reader.readInt(2);
          extraFieldValue = reader.readData(extraFieldLength);
          this.extraFields[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
        reader.setIndex(end);
      },
      /**
       * Apply an UTF8 transformation if needed.
       */
      handleUTF8: function() {
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) {
          this.fileNameStr = utf8.utf8decode(this.fileName);
          this.fileCommentStr = utf8.utf8decode(this.fileComment);
        } else {
          var upath = this.findExtraFieldUnicodePath();
          if (upath !== null) {
            this.fileNameStr = upath;
          } else {
            var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
            this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
          }
          var ucomment = this.findExtraFieldUnicodeComment();
          if (ucomment !== null) {
            this.fileCommentStr = ucomment;
          } else {
            var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
            this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
          }
        }
      },
      /**
       * Find the unicode path declared in the extra field, if any.
       * @return {String} the unicode path, null otherwise.
       */
      findExtraFieldUnicodePath: function() {
        var upathField = this.extraFields[28789];
        if (upathField) {
          var extraReader = readerFor(upathField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(upathField.length - 5));
        }
        return null;
      },
      /**
       * Find the unicode comment declared in the extra field, if any.
       * @return {String} the unicode comment, null otherwise.
       */
      findExtraFieldUnicodeComment: function() {
        var ucommentField = this.extraFields[25461];
        if (ucommentField) {
          var extraReader = readerFor(ucommentField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
        }
        return null;
      }
    };
    module2.exports = ZipEntry;
  }
});
var require_zipEntries = __commonJS({
  "node_modules/jszip/lib/zipEntries.js"(exports2, module2) {
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils();
    var sig = require_signature();
    var ZipEntry = require_zipEntry();
    var support = require_support();
    function ZipEntries(loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
    }
    ZipEntries.prototype = {
      /**
       * Check that the reader is on the specified signature.
       * @param {string} expectedSignature the expected signature.
       * @throws {Error} if it is an other signature.
       */
      checkSignature: function(expectedSignature) {
        if (!this.reader.readAndCheckSignature(expectedSignature)) {
          this.reader.index -= 4;
          var signature = this.reader.readString(4);
          throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
      },
      /**
       * Check if the given signature is at the given index.
       * @param {number} askedIndex the index to check.
       * @param {string} expectedSignature the signature to expect.
       * @return {boolean} true if the signature is here, false otherwise.
       */
      isSignature: function(askedIndex, expectedSignature) {
        var currentIndex = this.reader.index;
        this.reader.setIndex(askedIndex);
        var signature = this.reader.readString(4);
        var result = signature === expectedSignature;
        this.reader.setIndex(currentIndex);
        return result;
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);
        this.zipCommentLength = this.reader.readInt(2);
        var zipComment = this.reader.readData(this.zipCommentLength);
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        var decodeContent = utils.transformTo(decodeParamType, zipComment);
        this.zipComment = this.loadOptions.decodeFileName(decodeContent);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.reader.skip(4);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);
        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
        while (index < extraDataSize) {
          extraFieldId = this.reader.readInt(2);
          extraFieldLength = this.reader.readInt(4);
          extraFieldValue = this.reader.readData(extraFieldLength);
          this.zip64ExtensibleData[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
          throw new Error("Multi-volumes zip are not supported");
        }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
          file = this.files[i];
          this.reader.setIndex(file.localHeaderOffset);
          this.checkSignature(sig.LOCAL_FILE_HEADER);
          file.readLocalPart(this.reader);
          file.handleUTF8();
          file.processAttributes();
        }
      },
      /**
       * Read the central directory.
       */
      readCentralDir: function() {
        var file;
        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
          file = new ZipEntry({
            zip64: this.zip64
          }, this.loadOptions);
          file.readCentralPart(this.reader);
          this.files.push(file);
        }
        if (this.centralDirRecords !== this.files.length) {
          if (this.centralDirRecords !== 0 && this.files.length === 0) {
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          } else {
          }
        }
      },
      /**
       * Read the end of central directory.
       */
      readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset < 0) {
          var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
          if (isGarbage) {
            throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          } else {
            throw new Error("Corrupted zip: can't find end of central directory");
          }
        }
        this.reader.setIndex(offset);
        var endOfCentralDirOffset = offset;
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
          this.zip64 = true;
          offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          if (offset < 0) {
            throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
          }
          this.reader.setIndex(offset);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          this.readBlockZip64EndOfCentralLocator();
          if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
            this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            if (this.relativeOffsetEndOfZip64CentralDir < 0) {
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            }
          }
          this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
          this.readBlockZip64EndOfCentral();
        }
        var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
        if (this.zip64) {
          expectedEndOfCentralDirOffset += 20;
          expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
        }
        var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
        if (extraBytes > 0) {
          if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
          } else {
            this.reader.zero = extraBytes;
          }
        } else if (extraBytes < 0) {
          throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
        }
      },
      prepareReader: function(data) {
        this.reader = readerFor(data);
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
       */
      load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
      }
    };
    module2.exports = ZipEntries;
  }
});
var require_load = __commonJS({
  "node_modules/jszip/lib/load.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var external = require_external();
    var utf8 = require_utf8();
    var ZipEntries = require_zipEntries();
    var Crc32Probe = require_Crc32Probe();
    var nodejsUtils = require_nodejsUtils();
    function checkEntryCRC32(zipEntry) {
      return new external.Promise(function(resolve, reject) {
        var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
        worker.on("error", function(e) {
          reject(e);
        }).on("end", function() {
          if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
            reject(new Error("Corrupted zip : CRC32 mismatch"));
          } else {
            resolve();
          }
        }).resume();
      });
    }
    module2.exports = function(data, options) {
      var zip = this;
      options = utils.extend(options || {}, {
        base64: false,
        checkCRC32: false,
        optimizedBinaryString: false,
        createFolders: false,
        decodeFileName: utf8.utf8decode
      });
      if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
      }
      return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64).then(function(data2) {
        var zipEntries = new ZipEntries(options);
        zipEntries.load(data2);
        return zipEntries;
      }).then(function checkCRC32(zipEntries) {
        var promises = [external.Promise.resolve(zipEntries)];
        var files = zipEntries.files;
        if (options.checkCRC32) {
          for (var i = 0; i < files.length; i++) {
            promises.push(checkEntryCRC32(files[i]));
          }
        }
        return external.Promise.all(promises);
      }).then(function addFiles(results) {
        var zipEntries = results.shift();
        var files = zipEntries.files;
        for (var i = 0; i < files.length; i++) {
          var input = files[i];
          var unsafeName = input.fileNameStr;
          var safeName = utils.resolve(input.fileNameStr);
          zip.file(safeName, input.decompressed, {
            binary: true,
            optimizedBinaryString: true,
            date: input.date,
            dir: input.dir,
            comment: input.fileCommentStr.length ? input.fileCommentStr : null,
            unixPermissions: input.unixPermissions,
            dosPermissions: input.dosPermissions,
            createFolders: options.createFolders
          });
          if (!input.dir) {
            zip.file(safeName).unsafeOriginalName = unsafeName;
          }
        }
        if (zipEntries.zipComment.length) {
          zip.comment = zipEntries.zipComment;
        }
        return zip;
      });
    };
  }
});
var require_lib3 = __commonJS({
  "node_modules/jszip/lib/index.js"(exports2, module2) {
    "use strict";
    function JSZip2() {
      if (!(this instanceof JSZip2)) {
        return new JSZip2();
      }
      if (arguments.length) {
        throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
      }
      this.files = /* @__PURE__ */ Object.create(null);
      this.comment = null;
      this.root = "";
      this.clone = function() {
        var newObj = new JSZip2();
        for (var i in this) {
          if (typeof this[i] !== "function") {
            newObj[i] = this[i];
          }
        }
        return newObj;
      };
    }
    JSZip2.prototype = require_object();
    JSZip2.prototype.loadAsync = require_load();
    JSZip2.support = require_support();
    JSZip2.defaults = require_defaults();
    JSZip2.version = "3.10.1";
    JSZip2.loadAsync = function(content, options) {
      return new JSZip2().loadAsync(content, options);
    };
    JSZip2.external = require_external();
    module2.exports = JSZip2;
  }
});
var require_crc323 = __commonJS({
  "node_modules/crc-32/crc32.js"(exports2) {
    "use strict";
    var CRC32;
    (function(factory) {
      if (typeof DO_NOT_EXPORT_CRC === "undefined") {
        if ("object" === typeof exports2) {
          factory(exports2);
        } else if ("function" === typeof define && define.amd) {
          define(function() {
            var module2 = {};
            factory(module2);
            return module2;
          });
        } else {
          factory(CRC32 = {});
        }
      } else {
        factory(CRC32 = {});
      }
    })(function(CRC322) {
      CRC322.version = "0.3.0";
      function signed_crc_table() {
        var c = 0, table2 = new Array(256);
        for (var n = 0; n != 256; ++n) {
          c = n;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          table2[n] = c;
        }
        return typeof Int32Array !== "undefined" ? new Int32Array(table2) : table2;
      }
      var table = signed_crc_table();
      var use_buffer = typeof Buffer !== "undefined";
      function crc32_bstr(bstr) {
        if (bstr.length > 32768) {
          if (use_buffer) return crc32_buf_8(new Buffer(bstr));
        }
        var crc = -1, L = bstr.length - 1;
        for (var i = 0; i < L; ) {
          crc = table[(crc ^ bstr.charCodeAt(i++)) & 255] ^ crc >>> 8;
          crc = table[(crc ^ bstr.charCodeAt(i++)) & 255] ^ crc >>> 8;
        }
        if (i === L) crc = crc >>> 8 ^ table[(crc ^ bstr.charCodeAt(i)) & 255];
        return crc ^ -1;
      }
      function crc32_buf(buf) {
        if (buf.length > 1e4) return crc32_buf_8(buf);
        for (var crc = -1, i = 0, L = buf.length - 3; i < L; ) {
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
        }
        while (i < L + 3) crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
        return crc ^ -1;
      }
      function crc32_buf_8(buf) {
        for (var crc = -1, i = 0, L = buf.length - 7; i < L; ) {
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
          crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
        }
        while (i < L + 7) crc = crc >>> 8 ^ table[(crc ^ buf[i++]) & 255];
        return crc ^ -1;
      }
      function crc32_str(str) {
        for (var crc = -1, i = 0, L = str.length, c, d; i < L; ) {
          c = str.charCodeAt(i++);
          if (c < 128) {
            crc = crc >>> 8 ^ table[(crc ^ c) & 255];
          } else if (c < 2048) {
            crc = crc >>> 8 ^ table[(crc ^ (192 | c >> 6 & 31)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | c & 63)) & 255];
          } else if (c >= 55296 && c < 57344) {
            c = (c & 1023) + 64;
            d = str.charCodeAt(i++) & 1023;
            crc = crc >>> 8 ^ table[(crc ^ (240 | c >> 8 & 7)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | c >> 2 & 63)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | d >> 6 & 15 | c & 3)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | d & 63)) & 255];
          } else {
            crc = crc >>> 8 ^ table[(crc ^ (224 | c >> 12 & 15)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | c >> 6 & 63)) & 255];
            crc = crc >>> 8 ^ table[(crc ^ (128 | c & 63)) & 255];
          }
        }
        return crc ^ -1;
      }
      CRC322.table = table;
      CRC322.bstr = crc32_bstr;
      CRC322.buf = crc32_buf;
      CRC322.str = crc32_str;
    });
  }
});
var require_png_chunks_extract = __commonJS({
  "node_modules/png-chunks-extract/index.js"(exports2, module2) {
    "use strict";
    var crc322 = require_crc323();
    module2.exports = extractChunks2;
    var uint8 = new Uint8Array(4);
    var int32 = new Int32Array(uint8.buffer);
    var uint32 = new Uint32Array(uint8.buffer);
    function extractChunks2(data) {
      if (data[0] !== 137) throw new Error("Invalid .png file header");
      if (data[1] !== 80) throw new Error("Invalid .png file header");
      if (data[2] !== 78) throw new Error("Invalid .png file header");
      if (data[3] !== 71) throw new Error("Invalid .png file header");
      if (data[4] !== 13) throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      if (data[5] !== 10) throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      if (data[6] !== 26) throw new Error("Invalid .png file header");
      if (data[7] !== 10) throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      var ended = false;
      var chunks = [];
      var idx = 8;
      while (idx < data.length) {
        uint8[3] = data[idx++];
        uint8[2] = data[idx++];
        uint8[1] = data[idx++];
        uint8[0] = data[idx++];
        var length = uint32[0] + 4;
        var chunk = new Uint8Array(length);
        chunk[0] = data[idx++];
        chunk[1] = data[idx++];
        chunk[2] = data[idx++];
        chunk[3] = data[idx++];
        var name = String.fromCharCode(chunk[0]) + String.fromCharCode(chunk[1]) + String.fromCharCode(chunk[2]) + String.fromCharCode(chunk[3]);
        if (!chunks.length && name !== "IHDR") {
          throw new Error("IHDR header missing");
        }
        if (name === "IEND") {
          ended = true;
          chunks.push({
            name,
            data: new Uint8Array(0)
          });
          break;
        }
        for (var i = 4; i < length; i++) {
          chunk[i] = data[idx++];
        }
        uint8[3] = data[idx++];
        uint8[2] = data[idx++];
        uint8[1] = data[idx++];
        uint8[0] = data[idx++];
        var crcActual = int32[0];
        var crcExpect = crc322.buf(chunk);
        if (crcExpect !== crcActual) {
          throw new Error(
            "CRC values for " + name + " header do not match, PNG file is likely corrupted"
          );
        }
        var chunkData = new Uint8Array(chunk.buffer.slice(4));
        chunks.push({
          name,
          data: chunkData
        });
      }
      if (!ended) {
        throw new Error(".png file ended prematurely: no IEND header was found");
      }
      return chunks;
    }
  }
});
var require_encode = __commonJS({
  "node_modules/png-chunk-text/encode.js"(exports2, module2) {
    "use strict";
    module2.exports = encode;
    function encode(keyword, content) {
      keyword = String(keyword);
      content = String(content);
      if (!/^[\x00-\xFF]+$/.test(keyword) || !/^[\x00-\xFF]+$/.test(content)) {
        throw new Error("Only Latin-1 characters are permitted in PNG tEXt chunks. You might want to consider base64 encoding and/or zEXt compression");
      }
      if (keyword.length >= 80) {
        throw new Error('Keyword "' + keyword + '" is longer than the 79-character limit imposed by the PNG specification');
      }
      var totalSize = keyword.length + content.length + 1;
      var output = new Uint8Array(totalSize);
      var idx = 0;
      var code;
      for (var i = 0; i < keyword.length; i++) {
        if (!(code = keyword.charCodeAt(i))) {
          throw new Error("0x00 character is not permitted in tEXt keywords");
        }
        output[idx++] = code;
      }
      output[idx++] = 0;
      for (var j = 0; j < content.length; j++) {
        if (!(code = content.charCodeAt(j))) {
          throw new Error("0x00 character is not permitted in tEXt content");
        }
        output[idx++] = code;
      }
      return {
        name: "tEXt",
        data: output
      };
    }
  }
});
var require_decode = __commonJS({
  "node_modules/png-chunk-text/decode.js"(exports2, module2) {
    "use strict";
    module2.exports = decode4;
    function decode4(data) {
      if (data.data && data.name) {
        data = data.data;
      }
      var naming = true;
      var text = "";
      var name = "";
      for (var i = 0; i < data.length; i++) {
        var code = data[i];
        if (naming) {
          if (code) {
            name += String.fromCharCode(code);
          } else {
            naming = false;
          }
        } else {
          if (code) {
            text += String.fromCharCode(code);
          } else {
            throw new Error("Invalid NULL character found. 0x00 character is not permitted in tEXt content");
          }
        }
      }
      return {
        keyword: name,
        text
      };
    }
  }
});
var require_png_chunk_text = __commonJS({
  "node_modules/png-chunk-text/index.js"(exports2) {
    "use strict";
    exports2.encode = require_encode();
    exports2.decode = require_decode();
  }
});
var import_jszip = __toESM2(require_lib3());
var HEADERS = {
  "Content-Type": "application/json",
  Accept: "*/*",
  Origin: "https://novelai.net",
  Referer: "https://novelai.net",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0"
};
var V4_MODELS = /* @__PURE__ */ new Set([
  "nai-diffusion-4-full",
  "nai-diffusion-4-full-inpainting",
  "nai-diffusion-4-curated-preview",
  "nai-diffusion-4-curated-inpainting",
  "nai-diffusion-4-5-full",
  "nai-diffusion-4-5-full-inpainting",
  "nai-diffusion-4-5-curated",
  "nai-diffusion-4-5-curated-inpainting"
  /* V4_5_CUR_INP */
]);
function isV4Model(model) {
  return V4_MODELS.has(model);
}
var RESOLUTION_DIMENSIONS = {
  [
    "small_portrait"
    /* SMALL_PORTRAIT */
  ]: [512, 768],
  [
    "small_landscape"
    /* SMALL_LANDSCAPE */
  ]: [768, 512],
  [
    "small_square"
    /* SMALL_SQUARE */
  ]: [640, 640],
  [
    "normal_portrait"
    /* NORMAL_PORTRAIT */
  ]: [832, 1216],
  [
    "normal_landscape"
    /* NORMAL_LANDSCAPE */
  ]: [1216, 832],
  [
    "normal_square"
    /* NORMAL_SQUARE */
  ]: [1024, 1024],
  [
    "large_portrait"
    /* LARGE_PORTRAIT */
  ]: [1024, 1536],
  [
    "large_landscape"
    /* LARGE_LANDSCAPE */
  ]: [1536, 1024],
  [
    "large_square"
    /* LARGE_SQUARE */
  ]: [1472, 1472],
  [
    "wallpaper_portrait"
    /* WALLPAPER_PORTRAIT */
  ]: [1088, 1920],
  [
    "wallpaper_landscape"
    /* WALLPAPER_LANDSCAPE */
  ]: [1920, 1088]
};
var Sampler = /* @__PURE__ */ ((Sampler2) => {
  Sampler2["EULER"] = "k_euler";
  Sampler2["EULER_ANC"] = "k_euler_ancestral";
  Sampler2["DPM2S_ANC"] = "k_dpmpp_2s_ancestral";
  Sampler2["DPM2M"] = "k_dpmpp_2m";
  Sampler2["DPMSDE"] = "k_dpmpp_sde";
  Sampler2["DPM2MSDE"] = "k_dpmpp_2m_sde";
  Sampler2["DDIM"] = "ddim_v3";
  return Sampler2;
})(Sampler || {});
var Noise = /* @__PURE__ */ ((Noise2) => {
  Noise2["NATIVE"] = "native";
  Noise2["KARRAS"] = "karras";
  Noise2["EXPONENTIAL"] = "exponential";
  Noise2["POLYEXPONENTIAL"] = "polyexponential";
  return Noise2;
})(Noise || {});
function isNodeEnvironment() {
  return typeof window === "undefined";
}
var fsModule;
var pathModule;
async function getNodeFs() {
  if (fsModule !== void 0) return fsModule;
  if (!isNodeEnvironment()) return fsModule = null;
  try {
    fsModule = await import("fs");
  } catch {
    fsModule = null;
  }
  return fsModule;
}
async function getNodePath() {
  if (pathModule !== void 0) return pathModule;
  if (!isNodeEnvironment()) return pathModule = null;
  try {
    pathModule = await import("path");
  } catch {
    pathModule = null;
  }
  return pathModule;
}
async function loadNodeCanvas() {
  if (!isNodeEnvironment()) return null;
  try {
    const mod = await import("canvas");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}
function timestampString() {
  return (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace("T", "_").substring(0, 15);
}
function createFilename(prefix, extension = "png") {
  return `${prefix ? prefix + "_" : ""}${timestampString()}.${extension}`;
}
async function ensureDirectoryExists(dir) {
  const fs = await getNodeFs();
  if (fs && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
async function saveBinaryFile(data, filepath) {
  if (!isNodeEnvironment()) {
    throw new Error("Cannot save files directly in browser environment");
  }
  const fs = await getNodeFs();
  const path = await getNodePath();
  if (!fs || !path) {
    throw new Error("File system modules not available");
  }
  await ensureDirectoryExists(path.dirname(filepath));
  fs.writeFileSync(filepath, data);
}
var sharedTextEncoder = new TextEncoder();
var CHUNK_SIZE = 4096;
function utf8DecodeJs(bytes, inputOffset, byteLength) {
  let offset = inputOffset;
  const end = offset + byteLength;
  const units = [];
  let result = "";
  while (offset < end) {
    const byte1 = bytes[offset++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      const byte4 = bytes[offset++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= CHUNK_SIZE) {
      result += String.fromCharCode(...units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += String.fromCharCode(...units);
  }
  return result;
}
var sharedTextDecoder = new TextDecoder();
var TEXT_DECODER_THRESHOLD = 200;
function utf8DecodeTD(bytes, inputOffset, byteLength) {
  const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
  return sharedTextDecoder.decode(stringBytes);
}
function utf8Decode(bytes, inputOffset, byteLength) {
  if (byteLength > TEXT_DECODER_THRESHOLD) {
    return utf8DecodeTD(bytes, inputOffset, byteLength);
  } else {
    return utf8DecodeJs(bytes, inputOffset, byteLength);
  }
}
var ExtData = class {
  constructor(type, data) {
    __publicField(this, "type");
    __publicField(this, "data");
    this.type = type;
    this.data = data;
  }
};
var DecodeError = class _DecodeError extends Error {
  constructor(message) {
    super(message);
    const proto = Object.create(_DecodeError.prototype);
    Object.setPrototypeOf(this, proto);
    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: _DecodeError.name
    });
  }
};
var UINT32_MAX = 4294967295;
function setInt64(view, offset, value) {
  const high = Math.floor(value / 4294967296);
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
  const high = view.getInt32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
function getUint64(view, offset) {
  const high = view.getUint32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
var EXT_TIMESTAMP = -1;
var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
function encodeTimeSpecToTimestamp({ sec, nsec }) {
  if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
    if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
      const rv = new Uint8Array(4);
      const view = new DataView(rv.buffer);
      view.setUint32(0, sec);
      return rv;
    } else {
      const secHigh = sec / 4294967296;
      const secLow = sec & 4294967295;
      const rv = new Uint8Array(8);
      const view = new DataView(rv.buffer);
      view.setUint32(0, nsec << 2 | secHigh & 3);
      view.setUint32(4, secLow);
      return rv;
    }
  } else {
    const rv = new Uint8Array(12);
    const view = new DataView(rv.buffer);
    view.setUint32(0, nsec);
    setInt64(view, 4, sec);
    return rv;
  }
}
function encodeDateToTimeSpec(date) {
  const msec = date.getTime();
  const sec = Math.floor(msec / 1e3);
  const nsec = (msec - sec * 1e3) * 1e6;
  const nsecInSec = Math.floor(nsec / 1e9);
  return {
    sec: sec + nsecInSec,
    nsec: nsec - nsecInSec * 1e9
  };
}
function encodeTimestampExtension(object) {
  if (object instanceof Date) {
    const timeSpec = encodeDateToTimeSpec(object);
    return encodeTimeSpecToTimestamp(timeSpec);
  } else {
    return null;
  }
}
function decodeTimestampToTimeSpec(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  switch (data.byteLength) {
    case 4: {
      const sec = view.getUint32(0);
      const nsec = 0;
      return { sec, nsec };
    }
    case 8: {
      const nsec30AndSecHigh2 = view.getUint32(0);
      const secLow32 = view.getUint32(4);
      const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
      const nsec = nsec30AndSecHigh2 >>> 2;
      return { sec, nsec };
    }
    case 12: {
      const sec = getInt64(view, 4);
      const nsec = view.getUint32(0);
      return { sec, nsec };
    }
    default:
      throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
  }
}
function decodeTimestampExtension(data) {
  const timeSpec = decodeTimestampToTimeSpec(data);
  return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}
var timestampExtension = {
  type: EXT_TIMESTAMP,
  encode: encodeTimestampExtension,
  decode: decodeTimestampExtension
};
var _ExtensionCodec = class _ExtensionCodec2 {
  constructor() {
    __publicField(this, "__brand");
    __publicField(this, "builtInEncoders", []);
    __publicField(this, "builtInDecoders", []);
    __publicField(this, "encoders", []);
    __publicField(this, "decoders", []);
    this.register(timestampExtension);
  }
  register({ type, encode, decode: decode4 }) {
    if (type >= 0) {
      this.encoders[type] = encode;
      this.decoders[type] = decode4;
    } else {
      const index = -1 - type;
      this.builtInEncoders[index] = encode;
      this.builtInDecoders[index] = decode4;
    }
  }
  tryToEncode(object, context) {
    for (let i = 0; i < this.builtInEncoders.length; i++) {
      const encodeExt = this.builtInEncoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = -1 - i;
          return new ExtData(type, data);
        }
      }
    }
    for (let i = 0; i < this.encoders.length; i++) {
      const encodeExt = this.encoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = i;
          return new ExtData(type, data);
        }
      }
    }
    if (object instanceof ExtData) {
      return object;
    }
    return null;
  }
  decode(data, type, context) {
    const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
    if (decodeExt) {
      return decodeExt(data, type, context);
    } else {
      return new ExtData(type, data);
    }
  }
};
__publicField(_ExtensionCodec, "defaultCodec", new _ExtensionCodec());
var ExtensionCodec = _ExtensionCodec;
function isArrayBufferLike(buffer) {
  return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
}
function ensureUint8Array(buffer) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (isArrayBufferLike(buffer)) {
    return new Uint8Array(buffer);
  } else {
    return Uint8Array.from(buffer);
  }
}
function prettyByte(byte) {
  return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
}
var DEFAULT_MAX_KEY_LENGTH = 16;
var DEFAULT_MAX_LENGTH_PER_KEY = 16;
var CachedKeyDecoder = class {
  constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
    __publicField(this, "hit", 0);
    __publicField(this, "miss", 0);
    __publicField(this, "caches");
    __publicField(this, "maxKeyLength");
    __publicField(this, "maxLengthPerKey");
    this.maxKeyLength = maxKeyLength;
    this.maxLengthPerKey = maxLengthPerKey;
    this.caches = [];
    for (let i = 0; i < this.maxKeyLength; i++) {
      this.caches.push([]);
    }
  }
  canBeCached(byteLength) {
    return byteLength > 0 && byteLength <= this.maxKeyLength;
  }
  find(bytes, inputOffset, byteLength) {
    const records = this.caches[byteLength - 1];
    FIND_CHUNK: for (const record of records) {
      const recordBytes = record.bytes;
      for (let j = 0; j < byteLength; j++) {
        if (recordBytes[j] !== bytes[inputOffset + j]) {
          continue FIND_CHUNK;
        }
      }
      return record.str;
    }
    return null;
  }
  store(bytes, value) {
    const records = this.caches[bytes.length - 1];
    const record = { bytes, str: value };
    if (records.length >= this.maxLengthPerKey) {
      records[Math.random() * records.length | 0] = record;
    } else {
      records.push(record);
    }
  }
  decode(bytes, inputOffset, byteLength) {
    const cachedValue = this.find(bytes, inputOffset, byteLength);
    if (cachedValue != null) {
      this.hit++;
      return cachedValue;
    }
    this.miss++;
    const str = utf8DecodeJs(bytes, inputOffset, byteLength);
    const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
    this.store(slicedCopyOfBytes, str);
    return str;
  }
};
var STATE_ARRAY = "array";
var STATE_MAP_KEY = "map_key";
var STATE_MAP_VALUE = "map_value";
var mapKeyConverter = (key) => {
  if (typeof key === "string" || typeof key === "number") {
    return key;
  }
  throw new DecodeError("The type of key must be string or number but " + typeof key);
};
var StackPool = class {
  constructor() {
    __publicField(this, "stack", []);
    __publicField(this, "stackHeadPosition", -1);
  }
  get length() {
    return this.stackHeadPosition + 1;
  }
  top() {
    return this.stack[this.stackHeadPosition];
  }
  pushArrayState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_ARRAY;
    state.position = 0;
    state.size = size;
    state.array = new Array(size);
  }
  pushMapState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_MAP_KEY;
    state.readCount = 0;
    state.size = size;
    state.map = {};
  }
  getUninitializedStateFromPool() {
    this.stackHeadPosition++;
    if (this.stackHeadPosition === this.stack.length) {
      const partialState = {
        type: void 0,
        size: 0,
        array: void 0,
        position: 0,
        readCount: 0,
        map: void 0,
        key: null
      };
      this.stack.push(partialState);
    }
    return this.stack[this.stackHeadPosition];
  }
  release(state) {
    const topStackState = this.stack[this.stackHeadPosition];
    if (topStackState !== state) {
      throw new Error("Invalid stack state. Released state is not on top of the stack.");
    }
    if (state.type === STATE_ARRAY) {
      const partialState = state;
      partialState.size = 0;
      partialState.array = void 0;
      partialState.position = 0;
      partialState.type = void 0;
    }
    if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
      const partialState = state;
      partialState.size = 0;
      partialState.map = void 0;
      partialState.readCount = 0;
      partialState.type = void 0;
    }
    this.stackHeadPosition--;
  }
  reset() {
    this.stack.length = 0;
    this.stackHeadPosition = -1;
  }
};
var HEAD_BYTE_REQUIRED = -1;
var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
try {
  EMPTY_VIEW.getInt8(0);
} catch (e) {
  if (!(e instanceof RangeError)) {
    throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
  }
}
var MORE_DATA = new RangeError("Insufficient data");
var sharedCachedKeyDecoder = new CachedKeyDecoder();
var Decoder = class _Decoder {
  constructor(options) {
    __publicField(this, "extensionCodec");
    __publicField(this, "context");
    __publicField(this, "useBigInt64");
    __publicField(this, "rawStrings");
    __publicField(this, "maxStrLength");
    __publicField(this, "maxBinLength");
    __publicField(this, "maxArrayLength");
    __publicField(this, "maxMapLength");
    __publicField(this, "maxExtLength");
    __publicField(this, "keyDecoder");
    __publicField(this, "mapKeyConverter");
    __publicField(this, "totalPos", 0);
    __publicField(this, "pos", 0);
    __publicField(this, "view", EMPTY_VIEW);
    __publicField(this, "bytes", EMPTY_BYTES);
    __publicField(this, "headByte", HEAD_BYTE_REQUIRED);
    __publicField(this, "stack", new StackPool());
    __publicField(this, "entered", false);
    this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
    this.context = options?.context;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.rawStrings = options?.rawStrings ?? false;
    this.maxStrLength = options?.maxStrLength ?? UINT32_MAX;
    this.maxBinLength = options?.maxBinLength ?? UINT32_MAX;
    this.maxArrayLength = options?.maxArrayLength ?? UINT32_MAX;
    this.maxMapLength = options?.maxMapLength ?? UINT32_MAX;
    this.maxExtLength = options?.maxExtLength ?? UINT32_MAX;
    this.keyDecoder = options?.keyDecoder !== void 0 ? options.keyDecoder : sharedCachedKeyDecoder;
    this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
  }
  clone() {
    return new _Decoder({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      rawStrings: this.rawStrings,
      maxStrLength: this.maxStrLength,
      maxBinLength: this.maxBinLength,
      maxArrayLength: this.maxArrayLength,
      maxMapLength: this.maxMapLength,
      maxExtLength: this.maxExtLength,
      keyDecoder: this.keyDecoder
    });
  }
  reinitializeState() {
    this.totalPos = 0;
    this.headByte = HEAD_BYTE_REQUIRED;
    this.stack.reset();
  }
  setBuffer(buffer) {
    const bytes = ensureUint8Array(buffer);
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = 0;
  }
  appendBuffer(buffer) {
    if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
      this.setBuffer(buffer);
    } else {
      const remainingData = this.bytes.subarray(this.pos);
      const newData = ensureUint8Array(buffer);
      const newBuffer = new Uint8Array(remainingData.length + newData.length);
      newBuffer.set(remainingData);
      newBuffer.set(newData, remainingData.length);
      this.setBuffer(newBuffer);
    }
  }
  hasRemaining(size) {
    return this.view.byteLength - this.pos >= size;
  }
  createExtraByteError(posToShow) {
    const { view, pos } = this;
    return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
  }
  /**
   * @throws {@link DecodeError}
   * @throws {@link RangeError}
   */
  decode(buffer) {
    if (this.entered) {
      const instance = this.clone();
      return instance.decode(buffer);
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.setBuffer(buffer);
      const object = this.doDecodeSync();
      if (this.hasRemaining(1)) {
        throw this.createExtraByteError(this.pos);
      }
      return object;
    } finally {
      this.entered = false;
    }
  }
  *decodeMulti(buffer) {
    if (this.entered) {
      const instance = this.clone();
      yield* instance.decodeMulti(buffer);
      return;
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.setBuffer(buffer);
      while (this.hasRemaining(1)) {
        yield this.doDecodeSync();
      }
    } finally {
      this.entered = false;
    }
  }
  async decodeAsync(stream) {
    if (this.entered) {
      const instance = this.clone();
      return instance.decodeAsync(stream);
    }
    try {
      this.entered = true;
      let decoded = false;
      let object;
      for await (const buffer of stream) {
        if (decoded) {
          this.entered = false;
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        try {
          object = this.doDecodeSync();
          decoded = true;
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
      if (decoded) {
        if (this.hasRemaining(1)) {
          throw this.createExtraByteError(this.totalPos);
        }
        return object;
      }
      const { headByte, pos, totalPos } = this;
      throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
    } finally {
      this.entered = false;
    }
  }
  decodeArrayStream(stream) {
    return this.decodeMultiAsync(stream, true);
  }
  decodeStream(stream) {
    return this.decodeMultiAsync(stream, false);
  }
  async *decodeMultiAsync(stream, isArray2) {
    if (this.entered) {
      const instance = this.clone();
      yield* instance.decodeMultiAsync(stream, isArray2);
      return;
    }
    try {
      this.entered = true;
      let isArrayHeaderRequired = isArray2;
      let arrayItemsLeft = -1;
      for await (const buffer of stream) {
        if (isArray2 && arrayItemsLeft === 0) {
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        if (isArrayHeaderRequired) {
          arrayItemsLeft = this.readArraySize();
          isArrayHeaderRequired = false;
          this.complete();
        }
        try {
          while (true) {
            yield this.doDecodeSync();
            if (--arrayItemsLeft === 0) {
              break;
            }
          }
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
    } finally {
      this.entered = false;
    }
  }
  doDecodeSync() {
    DECODE: while (true) {
      const headByte = this.readHeadByte();
      let object;
      if (headByte >= 224) {
        object = headByte - 256;
      } else if (headByte < 192) {
        if (headByte < 128) {
          object = headByte;
        } else if (headByte < 144) {
          const size = headByte - 128;
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue DECODE;
          } else {
            object = {};
          }
        } else if (headByte < 160) {
          const size = headByte - 144;
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue DECODE;
          } else {
            object = [];
          }
        } else {
          const byteLength = headByte - 160;
          object = this.decodeString(byteLength, 0);
        }
      } else if (headByte === 192) {
        object = null;
      } else if (headByte === 194) {
        object = false;
      } else if (headByte === 195) {
        object = true;
      } else if (headByte === 202) {
        object = this.readF32();
      } else if (headByte === 203) {
        object = this.readF64();
      } else if (headByte === 204) {
        object = this.readU8();
      } else if (headByte === 205) {
        object = this.readU16();
      } else if (headByte === 206) {
        object = this.readU32();
      } else if (headByte === 207) {
        if (this.useBigInt64) {
          object = this.readU64AsBigInt();
        } else {
          object = this.readU64();
        }
      } else if (headByte === 208) {
        object = this.readI8();
      } else if (headByte === 209) {
        object = this.readI16();
      } else if (headByte === 210) {
        object = this.readI32();
      } else if (headByte === 211) {
        if (this.useBigInt64) {
          object = this.readI64AsBigInt();
        } else {
          object = this.readI64();
        }
      } else if (headByte === 217) {
        const byteLength = this.lookU8();
        object = this.decodeString(byteLength, 1);
      } else if (headByte === 218) {
        const byteLength = this.lookU16();
        object = this.decodeString(byteLength, 2);
      } else if (headByte === 219) {
        const byteLength = this.lookU32();
        object = this.decodeString(byteLength, 4);
      } else if (headByte === 220) {
        const size = this.readU16();
        if (size !== 0) {
          this.pushArrayState(size);
          this.complete();
          continue DECODE;
        } else {
          object = [];
        }
      } else if (headByte === 221) {
        const size = this.readU32();
        if (size !== 0) {
          this.pushArrayState(size);
          this.complete();
          continue DECODE;
        } else {
          object = [];
        }
      } else if (headByte === 222) {
        const size = this.readU16();
        if (size !== 0) {
          this.pushMapState(size);
          this.complete();
          continue DECODE;
        } else {
          object = {};
        }
      } else if (headByte === 223) {
        const size = this.readU32();
        if (size !== 0) {
          this.pushMapState(size);
          this.complete();
          continue DECODE;
        } else {
          object = {};
        }
      } else if (headByte === 196) {
        const size = this.lookU8();
        object = this.decodeBinary(size, 1);
      } else if (headByte === 197) {
        const size = this.lookU16();
        object = this.decodeBinary(size, 2);
      } else if (headByte === 198) {
        const size = this.lookU32();
        object = this.decodeBinary(size, 4);
      } else if (headByte === 212) {
        object = this.decodeExtension(1, 0);
      } else if (headByte === 213) {
        object = this.decodeExtension(2, 0);
      } else if (headByte === 214) {
        object = this.decodeExtension(4, 0);
      } else if (headByte === 215) {
        object = this.decodeExtension(8, 0);
      } else if (headByte === 216) {
        object = this.decodeExtension(16, 0);
      } else if (headByte === 199) {
        const size = this.lookU8();
        object = this.decodeExtension(size, 1);
      } else if (headByte === 200) {
        const size = this.lookU16();
        object = this.decodeExtension(size, 2);
      } else if (headByte === 201) {
        const size = this.lookU32();
        object = this.decodeExtension(size, 4);
      } else {
        throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
      }
      this.complete();
      const stack = this.stack;
      while (stack.length > 0) {
        const state = stack.top();
        if (state.type === STATE_ARRAY) {
          state.array[state.position] = object;
          state.position++;
          if (state.position === state.size) {
            object = state.array;
            stack.release(state);
          } else {
            continue DECODE;
          }
        } else if (state.type === STATE_MAP_KEY) {
          if (object === "__proto__") {
            throw new DecodeError("The key __proto__ is not allowed");
          }
          state.key = this.mapKeyConverter(object);
          state.type = STATE_MAP_VALUE;
          continue DECODE;
        } else {
          state.map[state.key] = object;
          state.readCount++;
          if (state.readCount === state.size) {
            object = state.map;
            stack.release(state);
          } else {
            state.key = null;
            state.type = STATE_MAP_KEY;
            continue DECODE;
          }
        }
      }
      return object;
    }
  }
  readHeadByte() {
    if (this.headByte === HEAD_BYTE_REQUIRED) {
      this.headByte = this.readU8();
    }
    return this.headByte;
  }
  complete() {
    this.headByte = HEAD_BYTE_REQUIRED;
  }
  readArraySize() {
    const headByte = this.readHeadByte();
    switch (headByte) {
      case 220:
        return this.readU16();
      case 221:
        return this.readU32();
      default: {
        if (headByte < 160) {
          return headByte - 144;
        } else {
          throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
        }
      }
    }
  }
  pushMapState(size) {
    if (size > this.maxMapLength) {
      throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
    }
    this.stack.pushMapState(size);
  }
  pushArrayState(size) {
    if (size > this.maxArrayLength) {
      throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
    }
    this.stack.pushArrayState(size);
  }
  decodeString(byteLength, headerOffset) {
    if (!this.rawStrings || this.stateIsMapKey()) {
      return this.decodeUtf8String(byteLength, headerOffset);
    }
    return this.decodeBinary(byteLength, headerOffset);
  }
  /**
   * @throws {@link RangeError}
   */
  decodeUtf8String(byteLength, headerOffset) {
    if (byteLength > this.maxStrLength) {
      throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
    }
    if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
      throw MORE_DATA;
    }
    const offset = this.pos + headerOffset;
    let object;
    if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
      object = this.keyDecoder.decode(this.bytes, offset, byteLength);
    } else {
      object = utf8Decode(this.bytes, offset, byteLength);
    }
    this.pos += headerOffset + byteLength;
    return object;
  }
  stateIsMapKey() {
    if (this.stack.length > 0) {
      const state = this.stack.top();
      return state.type === STATE_MAP_KEY;
    }
    return false;
  }
  /**
   * @throws {@link RangeError}
   */
  decodeBinary(byteLength, headOffset) {
    if (byteLength > this.maxBinLength) {
      throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
    }
    if (!this.hasRemaining(byteLength + headOffset)) {
      throw MORE_DATA;
    }
    const offset = this.pos + headOffset;
    const object = this.bytes.subarray(offset, offset + byteLength);
    this.pos += headOffset + byteLength;
    return object;
  }
  decodeExtension(size, headOffset) {
    if (size > this.maxExtLength) {
      throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
    }
    const extType = this.view.getInt8(this.pos + headOffset);
    const data = this.decodeBinary(
      size,
      headOffset + 1
      /* extType */
    );
    return this.extensionCodec.decode(data, extType, this.context);
  }
  lookU8() {
    return this.view.getUint8(this.pos);
  }
  lookU16() {
    return this.view.getUint16(this.pos);
  }
  lookU32() {
    return this.view.getUint32(this.pos);
  }
  readU8() {
    const value = this.view.getUint8(this.pos);
    this.pos++;
    return value;
  }
  readI8() {
    const value = this.view.getInt8(this.pos);
    this.pos++;
    return value;
  }
  readU16() {
    const value = this.view.getUint16(this.pos);
    this.pos += 2;
    return value;
  }
  readI16() {
    const value = this.view.getInt16(this.pos);
    this.pos += 2;
    return value;
  }
  readU32() {
    const value = this.view.getUint32(this.pos);
    this.pos += 4;
    return value;
  }
  readI32() {
    const value = this.view.getInt32(this.pos);
    this.pos += 4;
    return value;
  }
  readU64() {
    const value = getUint64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readI64() {
    const value = getInt64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readU64AsBigInt() {
    const value = this.view.getBigUint64(this.pos);
    this.pos += 8;
    return value;
  }
  readI64AsBigInt() {
    const value = this.view.getBigInt64(this.pos);
    this.pos += 8;
    return value;
  }
  readF32() {
    const value = this.view.getFloat32(this.pos);
    this.pos += 4;
    return value;
  }
  readF64() {
    const value = this.view.getFloat64(this.pos);
    this.pos += 8;
    return value;
  }
};
function decode(buffer, options) {
  const decoder = new Decoder(options);
  return decoder.decode(buffer);
}
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(array) {
  let binary = "";
  const chunkSize = 32768;
  for (let i = 0; i < array.length; i += chunkSize) {
    binary += String.fromCharCode(...array.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
async function parseImage(input) {
  return isNodeEnvironment() ? parseImageInNodeJs(input) : parseImageInBrowser(input);
}
async function parseImageInNodeJs(input) {
  if (typeof input === "string" || input instanceof Uint8Array) {
    const canvasModule = await loadNodeCanvas();
    if (!canvasModule) {
      throw new Error(
        "Canvas module not available. Please install it with: npm install canvas"
      );
    }
    const { createCanvas, loadImage } = canvasModule;
    const source = typeof input === "string" ? input : Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    try {
      const image = await loadImage(source);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      return { width: image.width, height: image.height, base64 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to load image: ${errorMessage}`);
    }
  } else if (input instanceof ArrayBuffer) {
    return parseImageInNodeJs(new Uint8Array(input));
  } else if (typeof input === "object" && input !== null) {
    if ("data" in input && input.data instanceof Uint8Array) {
      return parseImageInNodeJs(input.data);
    } else if ("url" in input && typeof input.url === "string") {
      return parseImageInNodeJs(input.url);
    }
  }
  throw new Error("Unsupported image input format in Node.js environment");
}
async function parseImageInBrowser(input) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas rendering context");
    }
    let imageElement = null;
    if (input instanceof HTMLImageElement) {
      imageElement = input;
    } else if (input instanceof HTMLCanvasElement) {
      return {
        width: input.width,
        height: input.height,
        base64: input.toDataURL("image/png").replace(/^data:image\/png;base64,/, "")
      };
    } else if (typeof input === "string") {
      if (input.startsWith("data:") || input.startsWith("blob:") || input.startsWith("http")) {
        imageElement = await loadImageElement(input);
      } else {
        throw new Error(
          "File paths are not supported in browser environment. Use a Blob, File, or Data URL instead."
        );
      }
    } else if (input instanceof Blob || input instanceof File) {
      const url = URL.createObjectURL(input);
      try {
        imageElement = await loadImageElement(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    } else if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
      const buffer = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
      return parseImageInBrowser(
        new Blob([buffer], { type: "image/png" })
      );
    } else if (typeof input === "object" && input !== null) {
      if ("data" in input && input.data instanceof Uint8Array) {
        return parseImageInBrowser(input.data);
      } else if ("url" in input && typeof input.url === "string") {
        return parseImageInBrowser(input.url);
      } else {
        throw new Error("Unsupported image input format");
      }
    } else {
      throw new Error("Unsupported image input format");
    }
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    return {
      width: imageElement.width,
      height: imageElement.height,
      base64: canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "")
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to parse image in browser: ${errorMessage}`);
  }
}
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${src.slice(0, 64)}`));
    img.src = src;
  });
}
var NovelAIApiError = class extends Error {
  constructor(status, statusText, apiMessage) {
    super(
      apiMessage ? `NovelAI API error ${status}: ${apiMessage}` : `NovelAI API error ${status} ${statusText}`
    );
    this.name = "NovelAIApiError";
    this.status = status;
    this.statusText = statusText;
  }
};
var SSEStream = class {
  constructor() {
    this.buffer = "";
    this.decoder = new TextDecoder();
  }
  *feed(chunk) {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    const rawEvents = this.buffer.split("\n\n");
    this.buffer = rawEvents.pop() || "";
    for (const raw of rawEvents) {
      const event = parseSSEEventText(raw);
      if (event) yield event;
    }
  }
  *flush() {
    const event = parseSSEEventText(this.buffer);
    this.buffer = "";
    if (event) yield event;
  }
};
function parseSSEEventText(raw) {
  if (!raw.trim()) return null;
  let eventName;
  let data = "";
  for (const line of raw.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex <= 0) continue;
    const field = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    if (field === "data") {
      data += value;
    } else if (field === "event") {
      eventName = value;
    }
  }
  if (!data) return null;
  return { event: eventName, data };
}
var StreamingMsgpackParser = class {
  constructor() {
    this.buffer = new Uint8Array(0);
    this.expectedMessageLength = null;
  }
  /**
   * Feed a chunk of data to the parser and yield any complete events
   */
  *feedChunk(chunk) {
    const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer);
    newBuffer.set(chunk, this.buffer.length);
    this.buffer = newBuffer;
    while (true) {
      if (this.expectedMessageLength === null) {
        if (this.buffer.length < 4) break;
        this.expectedMessageLength = new DataView(
          this.buffer.buffer,
          this.buffer.byteOffset,
          4
        ).getUint32(0, false);
        this.buffer = this.buffer.slice(4);
      }
      if (this.buffer.length < this.expectedMessageLength) break;
      const messageData = this.buffer.slice(0, this.expectedMessageLength);
      this.buffer = this.buffer.slice(this.expectedMessageLength);
      this.expectedMessageLength = null;
      const event = parseMsgpackMessage(messageData);
      if (event) yield event;
    }
  }
};
var StreamingSSEParser = class {
  constructor() {
    this.sse = new SSEStream();
  }
  *feedChunk(chunk) {
    for (const event of this.sse.feed(chunk)) {
      const parsed = parseEventJson(event.data);
      if (parsed) yield parsed;
    }
  }
  *flush() {
    for (const event of this.sse.flush()) {
      const parsed = parseEventJson(event.data);
      if (parsed) yield parsed;
    }
  }
};
function parseEventJson(data) {
  try {
    const obj = JSON.parse(data);
    if (obj && typeof obj === "object" && "event_type" in obj) {
      return createMsgpackEvent(obj);
    }
  } catch (error) {
    console.warn("Failed to parse SSE event data:", error);
  }
  return null;
}
function parseSSEEvents(sseData) {
  const parser = new StreamingSSEParser();
  return [...parser.feedChunk(sseData), ...parser.flush()];
}
function parseMsgpackEvents(msgpackData) {
  const parser = new StreamingMsgpackParser();
  return [...parser.feedChunk(msgpackData)];
}
function parseStreamEvents(streamData) {
  const head = new TextDecoder().decode(streamData.slice(0, 100));
  if (head.includes("event:") || head.includes("data:")) {
    return parseSSEEvents(streamData);
  }
  return parseMsgpackEvents(streamData);
}
function parseMsgpackMessage(messageData) {
  try {
    const obj = decode(messageData);
    if (typeof obj === "object" && obj !== null && "event_type" in obj) {
      return createMsgpackEvent(obj);
    }
  } catch {
    try {
      const obj = JSON.parse(new TextDecoder().decode(messageData));
      if (typeof obj === "object" && obj !== null && "event_type" in obj) {
        return createMsgpackEvent(obj);
      }
    } catch (jsonError) {
      console.warn("Failed to parse stream message:", jsonError);
    }
  }
  return null;
}
function createMsgpackEvent(obj) {
  let imageData;
  if (obj.image instanceof Uint8Array) {
    imageData = obj.image;
  } else if (typeof obj.image === "string") {
    try {
      imageData = base64ToUint8Array(obj.image);
    } catch (error) {
      console.warn("Failed to decode base64 image data:", error);
      imageData = new Uint8Array(0);
    }
  } else if (Array.isArray(obj.image)) {
    imageData = new Uint8Array(obj.image);
  } else {
    console.warn("Unknown image data format in stream event");
    imageData = new Uint8Array(0);
  }
  const extension = imageData.length >= 2 && imageData[0] === 255 && imageData[1] === 216 ? "jpg" : "png";
  const eventType = obj.event_type;
  const timestamp = timestampString();
  const filename = eventType === "final" ? `${timestamp}_final.${extension}` : `${timestamp}_step_${String(obj.step_ix || 0).padStart(2, "0")}.${extension}`;
  return new MsgpackEvent({
    event_type: eventType === "final" ? "final" : "intermediate",
    samp_ix: obj.samp_ix || 0,
    step_ix: obj.step_ix || 0,
    gen_id: String(obj.gen_id || ""),
    sigma: obj.sigma || 0,
    image: new Image2({ filename, data: imageData })
  });
}
function generateXCorrelationId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function prepHeaders(headers) {
  return {
    ...headers,
    "x-correlation-id": generateXCorrelationId(),
    "x-initiated-at": (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function handleResponse(response) {
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }
  const contentType = response.headers.get("Content-Type") || "";
  const isBinary = [
    "application/zip",
    "application/octet-stream",
    "application/msgpack",
    "application/x-zip-compressed",
    "application/binary"
  ].some((type) => contentType.includes(type));
  return {
    statusCode: response.status,
    statusText: response.statusText,
    headers,
    data: isBinary ? await response.arrayBuffer() : response.body
  };
}
async function apiErrorFromResponse(response) {
  let apiMessage;
  try {
    const text = await response.text();
    if (text) {
      try {
        const body = JSON.parse(text);
        apiMessage = body.message || body.error || text.slice(0, 300);
      } catch {
        apiMessage = text.slice(0, 300);
      }
    }
  } catch {
  }
  return new NovelAIApiError(response.status, response.statusText, apiMessage);
}
var DEFAULT_RETRY_CONFIG = {
  enabled: true,
  maxRetries: 3,
  baseDelay: 1e3,
  // 1 second
  maxDelay: 3e4,
  // 30 seconds
  retryStatusCodes: [429, 500, 502, 503, 504]
};
async function withRetry(fn, retryConfig) {
  const config = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig || {}
  };
  if (!config.enabled) {
    return fn();
  }
  let lastError = null;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const shouldRetry = shouldRetryRequest(error, config, attempt);
      if (!shouldRetry || attempt >= config.maxRetries) {
        throw error;
      }
      const delay = calculateRetryDelay(attempt, config);
      console.warn(
        `Request failed with error: ${lastError.message}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${config.maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error("Failed after retries");
}
function shouldRetryRequest(error, config, attempt) {
  if (attempt >= config.maxRetries) {
    return false;
  }
  if (error && error.status && config.retryStatusCodes.includes(error.status)) {
    return true;
  }
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }
  if (error.name === "AbortError") {
    return true;
  }
  return false;
}
function calculateRetryDelay(attempt, config) {
  const exponentialDelay = config.baseDelay * Math.pow(1.2, attempt);
  const jitter = Math.random() * 300;
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}
var MAX_PIXELS = 3047424;
function scaleDimensions(width, height, factor, maxPixels = MAX_PIXELS) {
  const clamped = Math.min(factor, Math.sqrt(maxPixels / (width * height)));
  return [
    Math.max(64, Math.floor(width * clamped / 64) * 64),
    Math.max(64, Math.floor(height * clamped / 64) * 64)
  ];
}
function prepareMetadataForApi(metadata) {
  const params = JSON.parse(JSON.stringify(metadata));
  delete params.model;
  delete params.action;
  delete params.prompt;
  delete params.resPreset;
  delete params.characterPrompts;
  if (params.inpaintImg2ImgStrength !== void 0) {
    params.inpaint_img2img_strength = params.inpaintImg2ImgStrength;
    delete params.inpaintImg2ImgStrength;
  }
  return {
    input: metadata.prompt,
    model: metadata.model,
    action: metadata.action,
    parameters: params
  };
}
function calculateCost(metadata, isOpus = false) {
  const steps = metadata.steps || 28;
  const n_samples = metadata.n_samples || 1;
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;
  const strength = metadata.action === "img2img" && metadata.strength ? metadata.strength : 1;
  let smeaFactor = 1;
  if (metadata.model && isV4Model(metadata.model)) {
    if (metadata.autoSmea) {
      smeaFactor = 1.2;
    }
  } else if (metadata.sm_dyn) {
    smeaFactor = 1.4;
  } else if (metadata.sm) {
    smeaFactor = 1.2;
  }
  const resolution = Math.max(width * height, 65536);
  let adjustedResolution = resolution;
  if (resolution > 832 * 1216 && resolution <= 1024 * 1024) {
    adjustedResolution = 832 * 1216;
  }
  let perSample = Math.ceil(
    2951823174884865e-21 * adjustedResolution + 5753298233447344e-22 * adjustedResolution * steps
  ) * smeaFactor;
  perSample = Math.max(Math.ceil(perSample * strength), 2);
  const opusDiscount = isOpus && steps <= 28 && adjustedResolution <= 1024 * 1024;
  let totalCost = perSample * (n_samples - (opusDiscount ? 1 : 0));
  if (metadata.director_reference_images?.length) {
    totalCost += 5;
  }
  return totalCost;
}
function deduplicateTags(prompt) {
  if (!prompt) return prompt;
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const tag of prompt.split(",")) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    if (trimmed.includes("::")) {
      deduped.push(trimmed);
      continue;
    }
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(trimmed);
    }
  }
  return deduped.join(", ");
}
var Z_FIXED = 4;
var Z_BINARY = 0;
var Z_TEXT = 1;
var Z_UNKNOWN = 2;
function zero$1(buf) {
  let len = buf.length;
  while (--len >= 0) buf[len] = 0;
}
var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES = 2;
var LENGTH_CODES = 29;
var LITERALS = 256;
var L_CODES = 286;
var D_CODES = 30;
var BL_CODES = 19;
var HEAP_SIZE$1 = 573;
var MAX_BITS = 15;
var Buf_size = 16;
var END_BLOCK = 256;
var REP_3_6 = 16;
var REPZ_3_10 = 17;
var REPZ_11_138 = 18;
var extra_lbits = new Uint8Array([
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
  0
]);
var extra_dbits = new Uint8Array([
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
  13
]);
var extra_blbits = new Uint8Array([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  2,
  3,
  7
]);
var bl_order = new Uint8Array([
  16,
  17,
  18,
  0,
  8,
  7,
  9,
  6,
  10,
  5,
  11,
  4,
  12,
  3,
  13,
  2,
  14,
  1,
  15
]);
var DIST_CODE_LEN = 512;
var static_ltree = new Array(288 * 2);
zero$1(static_ltree);
var static_dtree = new Array(D_CODES * 2);
zero$1(static_dtree);
var _dist_code = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
var _length_code = new Array(256);
zero$1(_length_code);
var base_length = new Array(LENGTH_CODES);
zero$1(base_length);
var base_dist = new Array(D_CODES);
zero$1(base_dist);
var d_code = (dist) => {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
var put_short = (s, w) => {
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
};
var send_bits = (s, value, length) => {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
};
var send_code = (s, c, tree) => {
  send_bits(s, tree[c * 2], tree[c * 2 + 1]);
};
var bi_reverse = (code, len) => {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};
var gen_bitlen = (s, desc) => {
  const tree = desc.dyn_tree;
  const max_code = desc.max_code;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const extra = desc.stat_desc.extra_bits;
  const base = desc.stat_desc.extra_base;
  const max_length = desc.stat_desc.max_length;
  let h;
  let n, m;
  let bits;
  let xbits;
  let f;
  let overflow = 0;
  for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;
  tree[s.heap[s.heap_max] * 2 + 1] = 0;
  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    if (n > max_code) continue;
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) xbits = extra[n - base];
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
  }
  if (overflow === 0) return;
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) bits--;
    s.bl_count[bits]--;
    s.bl_count[bits + 1] += 2;
    s.bl_count[max_length]--;
    overflow -= 2;
  } while (overflow > 0);
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) continue;
      if (tree[m * 2 + 1] !== bits) {
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
};
var gen_codes = (tree, max_code, bl_count) => {
  const next_code = new Array(16);
  let code = 0;
  let bits;
  let n;
  for (bits = 1; bits <= MAX_BITS; bits++) {
    code = code + bl_count[bits - 1] << 1;
    next_code[bits] = code;
  }
  for (n = 0; n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) continue;
    tree[n * 2] = bi_reverse(next_code[len]++, len);
  }
};
var init_block = (s) => {
  let n;
  for (n = 0; n < L_CODES; n++) s.dyn_ltree[n * 2] = 0;
  for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
  for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.sym_next = s.matches = 0;
};
var bi_windup = (s) => {
  if (s.bi_valid > 8) put_short(s, s.bi_buf);
  else if (s.bi_valid > 0) s.pending_buf[s.pending++] = s.bi_buf;
  s.bi_buf = 0;
  s.bi_valid = 0;
};
var smaller = (tree, n, m, depth) => {
  const _n2 = n * 2;
  const _m2 = m * 2;
  return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
};
var pqdownheap = (s, tree, k) => {
  const v = s.heap[k];
  let j = k << 1;
  while (j <= s.heap_len) {
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) j++;
    if (smaller(tree, v, s.heap[j], s.depth)) break;
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
};
var compress_block = (s, ltree, dtree) => {
  let dist;
  let lc;
  let sx = 0;
  let code;
  let extra;
  if (s.sym_next !== 0) do {
    dist = s.pending_buf[s.sym_buf + sx++] & 255;
    dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
    lc = s.pending_buf[s.sym_buf + sx++];
    if (dist === 0) send_code(s, lc, ltree);
    else {
      code = _length_code[lc];
      send_code(s, code + LITERALS + 1, ltree);
      extra = extra_lbits[code];
      if (extra !== 0) {
        lc -= base_length[code];
        send_bits(s, lc, extra);
      }
      dist--;
      code = d_code(dist);
      send_code(s, code, dtree);
      extra = extra_dbits[code];
      if (extra !== 0) {
        dist -= base_dist[code];
        send_bits(s, dist, extra);
      }
    }
  } while (sx < s.sym_next);
  send_code(s, END_BLOCK, ltree);
};
var build_tree = (s, desc) => {
  const tree = desc.dyn_tree;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems = desc.stat_desc.elems;
  let n, m;
  let max_code = -1;
  let node;
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;
  for (n = 0; n < elems; n++) if (tree[n * 2] !== 0) {
    s.heap[++s.heap_len] = max_code = n;
    s.depth[n] = 0;
  } else tree[n * 2 + 1] = 0;
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) s.static_len -= stree[node * 2 + 1];
  }
  desc.max_code = max_code;
  for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
  node = elems;
  do {
    n = s.heap[1];
    s.heap[1] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1);
    m = s.heap[1];
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[1] = node++;
    pqdownheap(s, tree, 1);
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1];
  gen_bitlen(s, desc);
  gen_codes(tree, max_code, s.bl_count);
};
var scan_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535;
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) continue;
    else if (count < min_count) s.bl_tree[curlen * 2] += count;
    else if (curlen !== 0) {
      if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) s.bl_tree[REPZ_3_10 * 2]++;
    else s.bl_tree[REPZ_11_138 * 2]++;
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var send_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) continue;
    else if (count < min_count) do
      send_code(s, curlen, s.bl_tree);
    while (--count !== 0);
    else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var build_bl_tree = (s) => {
  let max_blindex;
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  build_tree(s, s.bl_desc);
  for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  return max_blindex;
};
var send_all_trees = (s, lcodes, dcodes, blcodes) => {
  let rank;
  send_bits(s, lcodes - 257, 5);
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4);
  for (rank = 0; rank < blcodes; rank++) send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
  send_tree(s, s.dyn_ltree, lcodes - 1);
  send_tree(s, s.dyn_dtree, dcodes - 1);
};
var detect_data_type = (s) => {
  let block_mask = 4093624447;
  let n;
  for (n = 0; n <= 31; n++, block_mask >>>= 1) if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) return Z_BINARY;
  if (s.dyn_ltree[18] !== 0 || s.dyn_ltree[20] !== 0 || s.dyn_ltree[26] !== 0) return Z_TEXT;
  for (n = 32; n < LITERALS; n++) if (s.dyn_ltree[n * 2] !== 0) return Z_TEXT;
  return Z_BINARY;
};
var _tr_stored_block = (s, buf, stored_len, last) => {
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
  bi_windup(s);
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  if (stored_len) s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
  s.pending += stored_len;
};
var _tr_flush_block = (s, buf, stored_len, last) => {
  let opt_lenb, static_lenb;
  let max_blindex = 0;
  if (s.level > 0) {
    if (s.strm.data_type === Z_UNKNOWN) s.strm.data_type = detect_data_type(s);
    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);
    max_blindex = build_bl_tree(s);
    opt_lenb = s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
  } else opt_lenb = static_lenb = stored_len + 5;
  if (stored_len + 4 <= opt_lenb && buf !== -1) _tr_stored_block(s, buf, stored_len, last);
  else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  init_block(s);
  if (last) bi_windup(s);
};
var _tr_tally = (s, dist, lc) => {
  s.pending_buf[s.sym_buf + s.sym_next++] = dist;
  s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
  s.pending_buf[s.sym_buf + s.sym_next++] = lc;
  if (dist === 0) s.dyn_ltree[lc * 2]++;
  else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  return s.sym_next === s.sym_end;
};
var adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
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
var makeTable = () => {
  let c, table = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c;
  }
  return table;
};
var crcTable = new Uint32Array(makeTable());
var crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;
  crc ^= -1;
  for (let i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
  return crc ^ -1;
};
var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = 262;
var BS_NEED_MORE = 1;
var BS_BLOCK_DONE = 2;
var BS_FINISH_STARTED = 3;
var BS_FINISH_DONE = 4;
var slide_hash = (s) => {
  let n, m;
  let p;
  let wsize = s.w_size;
  n = s.hash_size;
  p = n;
  do {
    m = s.head[--p];
    s.head[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
  n = wsize;
  p = n;
  do {
    m = s.prev[--p];
    s.prev[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
};
var HASH = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
var INSERT_STRING = (s, str) => {
  let h;
  if (s.legacy_hash) h = s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
  else {
    const w = s.window;
    const value = w[str] | w[str + 1] << 8 | w[str + 2] << 16 | w[str + 3] << 24;
    h = s.ins_h = Math.imul(value, 66521) + 66521 >>> 16 & s.hash_mask;
  }
  const hash_head = s.prev[str & s.w_mask] = s.head[h];
  s.head[h] = str;
  return hash_head;
};
var flush_pending = (strm) => {
  const s = strm.state;
  let len = s.pending;
  if (len > strm.avail_out) len = strm.avail_out;
  if (len === 0) return;
  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) s.pending_out = 0;
};
var flush_block_only = (s, last) => {
  _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};
var read_buf = (strm, buf, start, size) => {
  let len = strm.avail_in;
  if (len > size) len = size;
  if (len === 0) return 0;
  strm.avail_in -= len;
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) strm.adler = adler32(strm.adler, buf, len, start);
  else if (strm.state.wrap === 2) strm.adler = crc32(strm.adler, buf, len, start);
  strm.next_in += len;
  strm.total_in += len;
  return len;
};
var longest_match = (s, cur_match) => {
  let chain_length = s.max_chain_length;
  let scan = s.strstart;
  let match;
  let len;
  let best_len = s.prev_length;
  let nice_match = s.nice_match;
  const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
  const _win = s.window;
  const wmask = s.w_mask;
  const prev = s.prev;
  const strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  if (s.prev_length >= s.good_match) chain_length >>= 2;
  if (nice_match > s.lookahead) nice_match = s.lookahead;
  do {
    match = cur_match;
    if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) continue;
    scan += 2;
    match++;
    do
      ;
    while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) break;
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
  if (best_len <= s.lookahead) return best_len;
  return s.lookahead;
};
var fill_window = (s) => {
  const _w_size = s.w_size;
  let n, more, str;
  do {
    more = s.window_size - s.lookahead - s.strstart;
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      s.block_start -= _w_size;
      if (s.insert > s.strstart) s.insert = s.strstart;
      slide_hash(s);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) break;
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    if (!s.legacy_hash) {
      if (s.lookahead + s.insert > MIN_MATCH) {
        str = s.strstart - s.insert;
        while (s.insert) {
          INSERT_STRING(s, str);
          str++;
          s.insert--;
          if (s.lookahead + s.insert <= MIN_MATCH) break;
        }
      }
    } else if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
      while (s.insert) {
        INSERT_STRING(s, str);
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) break;
      }
    }
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
};
var deflate_stored = (s, flush) => {
  let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
  let len, left, have, last = 0;
  let used = s.strm.avail_in;
  do {
    len = 65535;
    have = s.bi_valid + 42 >> 3;
    if (s.strm.avail_out < have) break;
    have = s.strm.avail_out - have;
    left = s.strstart - s.block_start;
    if (len > left + s.strm.avail_in) len = left + s.strm.avail_in;
    if (len > have) len = have;
    if (len < min_block && (len === 0 && flush !== 4 || flush === 0 || len !== left + s.strm.avail_in)) break;
    last = flush === 4 && len === left + s.strm.avail_in ? 1 : 0;
    _tr_stored_block(s, 0, 0, last);
    s.pending_buf[s.pending - 4] = len;
    s.pending_buf[s.pending - 3] = len >> 8;
    s.pending_buf[s.pending - 2] = ~len;
    s.pending_buf[s.pending - 1] = ~len >> 8;
    flush_pending(s.strm);
    if (left) {
      if (left > len) left = len;
      s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
      s.strm.next_out += left;
      s.strm.avail_out -= left;
      s.strm.total_out += left;
      s.block_start += left;
      len -= left;
    }
    if (len) {
      read_buf(s.strm, s.strm.output, s.strm.next_out, len);
      s.strm.next_out += len;
      s.strm.avail_out -= len;
      s.strm.total_out += len;
    }
  } while (last === 0);
  used -= s.strm.avail_in;
  if (used) {
    if (used >= s.w_size) {
      s.matches = 2;
      s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
      s.strstart = s.w_size;
      s.insert = s.strstart;
    } else {
      if (s.window_size - s.strstart <= used) {
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) s.matches++;
        if (s.insert > s.strstart) s.insert = s.strstart;
      }
      s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
      s.strstart += used;
      s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
    }
    s.block_start = s.strstart;
  }
  if (s.high_water < s.strstart) s.high_water = s.strstart;
  if (last) return BS_FINISH_DONE;
  if (flush !== 0 && flush !== 4 && s.strm.avail_in === 0 && s.strstart === s.block_start) return BS_BLOCK_DONE;
  have = s.window_size - s.strstart;
  if (s.strm.avail_in > have && s.block_start >= s.w_size) {
    s.block_start -= s.w_size;
    s.strstart -= s.w_size;
    s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
    if (s.matches < 2) s.matches++;
    have += s.w_size;
    if (s.insert > s.strstart) s.insert = s.strstart;
  }
  if (have > s.strm.avail_in) have = s.strm.avail_in;
  if (have) {
    read_buf(s.strm, s.window, s.strstart, have);
    s.strstart += have;
    s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
  }
  if (s.high_water < s.strstart) s.high_water = s.strstart;
  have = s.bi_valid + 42 >> 3;
  have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
  min_block = have > s.w_size ? s.w_size : have;
  left = s.strstart - s.block_start;
  if (left >= min_block || (left || flush === 4) && flush !== 0 && s.strm.avail_in === 0 && left <= have) {
    len = left > have ? have : left;
    last = flush === 4 && s.strm.avail_in === 0 && len === left ? 1 : 0;
    _tr_stored_block(s, s.block_start, len, last);
    s.block_start += len;
    flush_pending(s.strm);
  }
  return last ? BS_FINISH_STARTED : BS_NEED_MORE;
};
var deflate_fast = (s, flush) => {
  let hash_head;
  let bflush;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === 0) return BS_NEED_MORE;
      if (s.lookahead === 0) break;
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) hash_head = INSERT_STRING(s, s.strstart);
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) s.match_length = longest_match(s, hash_head);
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--;
        do {
          s.strstart++;
          hash_head = INSERT_STRING(s, s.strstart);
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        if (s.legacy_hash) {
          s.ins_h = s.window[s.strstart];
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
        }
      }
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) return BS_NEED_MORE;
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === 4) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) return BS_NEED_MORE;
  }
  return BS_BLOCK_DONE;
};
var deflate_slow = (s, flush) => {
  let hash_head;
  let bflush;
  let max_insert;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === 0) return BS_NEED_MORE;
      if (s.lookahead === 0) break;
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) hash_head = INSERT_STRING(s, s.strstart);
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === 1 || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) s.match_length = MIN_MATCH - 1;
    }
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do
        if (++s.strstart <= max_insert) hash_head = INSERT_STRING(s, s.strstart);
      while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) return BS_NEED_MORE;
      }
    } else if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush)
        flush_block_only(s, false);
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) return BS_NEED_MORE;
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  if (s.match_available) {
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === 4) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) return BS_NEED_MORE;
  }
  return BS_BLOCK_DONE;
};
var Config = class {
  constructor(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
};
var configuration_table = [
  new Config(0, 0, 0, 0, deflate_stored),
  new Config(4, 4, 8, 4, deflate_fast),
  new Config(4, 5, 16, 8, deflate_fast),
  new Config(4, 6, 32, 32, deflate_fast),
  new Config(4, 4, 16, 16, deflate_slow),
  new Config(8, 16, 32, 32, deflate_slow),
  new Config(8, 16, 128, 128, deflate_slow),
  new Config(8, 32, 128, 256, deflate_slow),
  new Config(32, 128, 258, 1024, deflate_slow),
  new Config(32, 258, 258, 4096, deflate_slow)
];
var lbase = new Uint16Array([
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
var lext = new Uint8Array([
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
  199,
  75
]);
var dbase = new Uint16Array([
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
var dext = new Uint8Array([
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
var defaultOptions = {
  chunkSize: 1024 * 64,
  windowBits: 15,
  raw: false,
  dictionary: /* @__PURE__ */ new Uint8Array(0)
};
var import_png_chunks_extract = __toESM2(require_png_chunks_extract());
var pngChunkText = __toESM2(require_png_chunk_text());
function objectAssign() {
  for (let i = 1; i < arguments.length; i++) {
    for (const property in arguments[i]) {
      arguments[0][property] = arguments[i][property];
    }
  }
  return arguments[0];
}
function padStart(string, length, character) {
  const padding = strRepeat(character, length - string.length);
  return padding + string;
}
function parseFloatRadix(string, radix) {
  return parseInt(string.replace(".", ""), radix) / Math.pow(radix, (string.split(".")[1] || "").length);
}
function strRepeat(string, num) {
  return new Array(num + 1).join(string);
}
var DEFAULT_MAX_DECOMPRESSED_SIZE = 128 * 1024 * 1024;
var AUTO_INITIAL_LENGTH = 128 * 1024;
var constants_default = {
  USE_FILE: true,
  USE_JFIF: true,
  USE_PNG_FILE: true,
  USE_EXIF: true,
  USE_IPTC: true,
  USE_XMP: true,
  USE_ICC: true,
  USE_MPF: true,
  USE_PHOTOSHOP: true,
  USE_THUMBNAIL: true,
  USE_TIFF: true,
  USE_JPEG: true,
  USE_PNG: true,
  USE_HEIC: true,
  USE_AVIF: true,
  USE_JXL: true,
  USE_WEBP: true,
  USE_GIF: true,
  USE_MAKER_NOTES: true
};
function getStringValue(value) {
  return value.map((charCode) => String.fromCharCode(charCode)).join("");
}
function getEncodedString(value) {
  if (value.length >= 8) {
    const encoding = getStringValue(value.slice(0, 8));
    if (encoding === "ASCII\0\0\0") {
      return getStringValue(value.slice(8));
    } else if (encoding === "JIS\0\0\0\0\0") {
      return "[JIS encoded text]";
    } else if (encoding === "UNICODE\0") {
      return "[Unicode encoded text]";
    } else if (encoding === "\0\0\0\0\0\0\0\0") {
      const text = getStringValue(value.slice(8));
      if (/[\x20-\x7e]/.test(text)) {
        return text;
      }
      return "[Undefined encoding]";
    }
  }
  return "Undefined";
}
function getCalculatedGpsValue(value) {
  return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
}
var LITTLE_ENDIAN = 18761;
var BIG_ENDIAN = 19789;
var byte_order_default = {
  BIG_ENDIAN,
  LITTLE_ENDIAN,
  getByteOrder
};
function getByteOrder(dataView, tiffHeaderOffset) {
  if (dataView.getUint16(tiffHeaderOffset) === LITTLE_ENDIAN) {
    return LITTLE_ENDIAN;
  } else if (dataView.getUint16(tiffHeaderOffset) === BIG_ENDIAN) {
    return BIG_ENDIAN;
  }
  throw new Error("Illegal byte order value. Faulty image.");
}
var APP_ID_OFFSET = 4;
var APP2_ICC_IDENTIFIER = "ICC_PROFILE\0";
var ICC_CHUNK_NUMBER_OFFSET = APP_ID_OFFSET + APP2_ICC_IDENTIFIER.length;
var ICC_TOTAL_CHUNKS_OFFSET = ICC_CHUNK_NUMBER_OFFSET + 1;
var PNG_CHUNK_LENGTH_SIZE = 4;
var PNG_CHUNK_TYPE_SIZE = 4;
var PNG_CHUNK_DATA_OFFSET = PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE;
var tag_names_common_default = {
  ApertureValue: (value) => Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2),
  ColorSpace(value) {
    if (value === 1) {
      return "sRGB";
    } else if (value === 65535) {
      return "Uncalibrated";
    }
    return "Unknown";
  },
  ComponentsConfiguration(value) {
    return value.map((character) => {
      if (character === 49) {
        return "Y";
      } else if (character === 50) {
        return "Cb";
      } else if (character === 51) {
        return "Cr";
      } else if (character === 52) {
        return "R";
      } else if (character === 53) {
        return "G";
      } else if (character === 54) {
        return "B";
      }
    }).join("");
  },
  Contrast(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Soft";
    } else if (value === 2) {
      return "Hard";
    }
    return "Unknown";
  },
  CustomRendered(value) {
    if (value === 0) {
      return "Normal process";
    } else if (value === 1) {
      return "Custom process";
    }
    return "Unknown";
  },
  ExposureMode(value) {
    if (value === 0) {
      return "Auto exposure";
    } else if (value === 1) {
      return "Manual exposure";
    } else if (value === 2) {
      return "Auto bracket";
    }
    return "Unknown";
  },
  ExposureProgram(value) {
    if (value === 0) {
      return "Undefined";
    } else if (value === 1) {
      return "Manual";
    } else if (value === 2) {
      return "Normal program";
    } else if (value === 3) {
      return "Aperture priority";
    } else if (value === 4) {
      return "Shutter priority";
    } else if (value === 5) {
      return "Creative program";
    } else if (value === 6) {
      return "Action program";
    } else if (value === 7) {
      return "Portrait mode";
    } else if (value === 8) {
      return "Landscape mode";
    } else if (value === 9) {
      return "Bulb";
    }
    return "Unknown";
  },
  ExposureTime(value) {
    if (value[0] / value[1] > 0.25) {
      const decimal = value[0] / value[1];
      if (Number.isInteger(decimal)) {
        return "" + decimal;
      }
      return decimal.toFixed(1);
    }
    if (value[0] !== 0) {
      return `1/${Math.round(value[1] / value[0])}`;
    }
    return `0/${value[1]}`;
  },
  FNumber: (value) => `f/${Number(value[0] / value[1]).toFixed(1)}`,
  FocalLength: (value) => value[0] / value[1] + " mm",
  FocalPlaneResolutionUnit(value) {
    if (value === 2) {
      return "inches";
    } else if (value === 3) {
      return "centimeters";
    } else if (value === 4) {
      return "millimeters";
    }
    return "Unknown";
  },
  LightSource: (value) => {
    if (value === 1) {
      return "Daylight";
    } else if (value === 2) {
      return "Fluorescent";
    } else if (value === 3) {
      return "Tungsten (incandescent light)";
    } else if (value === 4) {
      return "Flash";
    } else if (value === 9) {
      return "Fine weather";
    } else if (value === 10) {
      return "Cloudy weather";
    } else if (value === 11) {
      return "Shade";
    } else if (value === 12) {
      return "Daylight fluorescent (D 5700 \u2013 7100K)";
    } else if (value === 13) {
      return "Day white fluorescent (N 4600 \u2013 5400K)";
    } else if (value === 14) {
      return "Cool white fluorescent (W 3900 \u2013 4500K)";
    } else if (value === 15) {
      return "White fluorescent (WW 3200 \u2013 3700K)";
    } else if (value === 17) {
      return "Standard light A";
    } else if (value === 18) {
      return "Standard light B";
    } else if (value === 19) {
      return "Standard light C";
    } else if (value === 20) {
      return "D55";
    } else if (value === 21) {
      return "D65";
    } else if (value === 22) {
      return "D75";
    } else if (value === 23) {
      return "D50";
    } else if (value === 24) {
      return "ISO studio tungsten";
    } else if (value === 255) {
      return "Other light source";
    }
    return "Unknown";
  },
  MeteringMode(value) {
    if (value === 1) {
      return "Average";
    } else if (value === 2) {
      return "CenterWeightedAverage";
    } else if (value === 3) {
      return "Spot";
    } else if (value === 4) {
      return "MultiSpot";
    } else if (value === 5) {
      return "Pattern";
    } else if (value === 6) {
      return "Partial";
    } else if (value === 255) {
      return "Other";
    }
    return "Unknown";
  },
  ResolutionUnit(value) {
    if (value === 2) {
      return "inches";
    }
    if (value === 3) {
      return "centimeters";
    }
    return "Unknown";
  },
  Saturation(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Low saturation";
    } else if (value === 2) {
      return "High saturation";
    }
    return "Unknown";
  },
  FocalLengthIn35mmFilm(value) {
    if (value === 0) {
      return "Unknown";
    }
    return value + " mm";
  },
  SceneCaptureType(value) {
    if (value === 0) {
      return "Standard";
    } else if (value === 1) {
      return "Landscape";
    } else if (value === 2) {
      return "Portrait";
    } else if (value === 3) {
      return "Night scene";
    }
    return "Unknown";
  },
  Sharpness(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Soft";
    } else if (value === 2) {
      return "Hard";
    }
    return "Unknown";
  },
  ShutterSpeedValue(value) {
    const denominator = Math.pow(2, value[0] / value[1]);
    if (denominator <= 1) {
      return `${Math.round(1 / denominator)}`;
    }
    return `1/${Math.round(denominator)}`;
  },
  WhiteBalance(value) {
    if (value === 0) {
      return "Auto white balance";
    } else if (value === 1) {
      return "Manual white balance";
    }
    return "Unknown";
  },
  XResolution: (value) => "" + Math.round(value[0] / value[1]),
  YResolution: (value) => "" + Math.round(value[0] / value[1])
};
var tag_names_0th_ifd_default = {
  11: "ProcessingSoftware",
  254: {
    name: "SubfileType",
    description: (value) => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image",
      3: "Single page of multi-page reduced-resolution image",
      4: "Transparency mask",
      5: "Transparency mask of reduced-resolution image",
      6: "Transparency mask of multi-page image",
      7: "Transparency mask of reduced-resolution multi-page image",
      65537: "Alternate reduced-resolution image",
      4294967295: "Invalid"
    })[value] || "Unknown"
  },
  255: {
    name: "OldSubfileType",
    description: (value) => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image"
    })[value] || "Unknown"
  },
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  263: {
    name: "Thresholding",
    description: (value) => ({
      1: "No dithering or halftoning",
      2: "Ordered dither or halfton",
      3: "Randomized dither"
    })[value] || "Unknown"
  },
  264: "CellWidth",
  265: "CellLength",
  266: {
    name: "FillOrder",
    description: (value) => ({
      1: "Normal",
      2: "Reversed"
    })[value] || "Unknown"
  },
  269: "DocumentName",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: {
    name: "Orientation",
    description: (value) => {
      if (value === 1) {
        return "top-left";
      }
      if (value === 2) {
        return "top-right";
      }
      if (value === 3) {
        return "bottom-right";
      }
      if (value === 4) {
        return "bottom-left";
      }
      if (value === 5) {
        return "left-top";
      }
      if (value === 6) {
        return "right-top";
      }
      if (value === 7) {
        return "right-bottom";
      }
      if (value === 8) {
        return "left-bottom";
      }
      return "Undefined";
    }
  },
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  280: "MinSampleValue",
  281: "MaxSampleValue",
  282: {
    "name": "XResolution",
    "description": tag_names_common_default.XResolution
  },
  283: {
    "name": "YResolution",
    "description": tag_names_common_default.YResolution
  },
  284: "PlanarConfiguration",
  285: "PageName",
  286: {
    "name": "XPosition",
    "description": (value) => {
      return "" + Math.round(value[0] / value[1]);
    }
  },
  287: {
    "name": "YPosition",
    "description": (value) => {
      return "" + Math.round(value[0] / value[1]);
    }
  },
  290: {
    name: "GrayResponseUnit",
    description: (value) => ({
      1: "0.1",
      2: "0.001",
      3: "0.0001",
      4: "1e-05",
      5: "1e-06"
    })[value] || "Unknown"
  },
  296: {
    name: "ResolutionUnit",
    description: tag_names_common_default.ResolutionUnit
  },
  297: "PageNumber",
  301: "TransferFunction",
  305: "Software",
  306: "DateTime",
  315: "Artist",
  316: "HostComputer",
  317: "Predictor",
  318: {
    "name": "WhitePoint",
    "description": (values) => {
      return values.map((value) => `${value[0]}/${value[1]}`).join(", ");
    }
  },
  319: {
    "name": "PrimaryChromaticities",
    "description": (values) => {
      return values.map((value) => `${value[0]}/${value[1]}`).join(", ");
    }
  },
  321: "HalftoneHints",
  322: "TileWidth",
  323: "TileLength",
  330: "A100DataOffset",
  332: {
    name: "InkSet",
    description: (value) => ({
      1: "CMYK",
      2: "Not CMYK"
    })[value] || "Unknown"
  },
  337: "TargetPrinter",
  338: {
    name: "ExtraSamples",
    description: (value) => ({
      0: "Unspecified",
      1: "Associated Alpha",
      2: "Unassociated Alpha"
    })[value] || "Unknown"
  },
  339: {
    name: "SampleFormat",
    description: (value) => {
      const formats = {
        1: "Unsigned",
        2: "Signed",
        3: "Float",
        4: "Undefined",
        5: "Complex int",
        6: "Complex float"
      };
      if (!Array.isArray(value)) {
        return "Unknown";
      }
      return value.map((sample) => formats[sample] || "Unknown").join(", ");
    }
  },
  513: "JPEGInterchangeFormat",
  514: "JPEGInterchangeFormatLength",
  529: {
    "name": "YCbCrCoefficients",
    "description": (values) => {
      return values.map((value) => "" + value[0] / value[1]).join("/");
    }
  },
  530: "YCbCrSubSampling",
  531: {
    name: "YCbCrPositioning",
    description: (value) => {
      if (value === 1) {
        return "centered";
      }
      if (value === 2) {
        return "co-sited";
      }
      return "undefined " + value;
    }
  },
  532: {
    "name": "ReferenceBlackWhite",
    "description": (values) => {
      return values.map((value) => "" + value[0] / value[1]).join(", ");
    }
  },
  700: "ApplicationNotes",
  18246: "Rating",
  18249: "RatingPercent",
  33432: {
    name: "Copyright",
    description: (value) => value.join("; ")
  },
  33550: "PixelScale",
  33723: "IPTC-NAA",
  33920: "IntergraphMatrix",
  33922: "ModelTiePoint",
  34118: "SEMInfo",
  34264: "ModelTransform",
  34377: "PhotoshopSettings",
  34665: "Exif IFD Pointer",
  34675: "ICC_Profile",
  34735: "GeoTiffDirectory",
  34736: "GeoTiffDoubleParams",
  34737: "GeoTiffAsciiParams",
  34853: "GPS Info IFD Pointer",
  40091: {
    name: "XPTitle",
    description: decodeXPValue
  },
  40092: {
    name: "XPComment",
    description: decodeXPValue
  },
  40093: {
    name: "XPAuthor",
    description: decodeXPValue
  },
  40094: {
    name: "XPKeywords",
    description: decodeXPValue
  },
  40095: {
    name: "XPSubject",
    description: decodeXPValue
  },
  42112: "GDALMetadata",
  42113: "GDALNoData",
  50341: "PrintIM",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50723: "CameraCalibration1",
  50724: "CameraCalibration2",
  50725: "ReductionMatrix1",
  50726: "ReductionMatrix2",
  50727: "AnalogBalance",
  50728: "AsShotNeutral",
  50729: "AsShotWhiteXY",
  50730: "BaselineExposure",
  50731: "BaselineNoise",
  50732: "BaselineSharpness",
  50734: "LinearResponseLimit",
  50735: "CameraSerialNumber",
  50736: "DNGLensInfo",
  50739: "ShadowScale",
  50741: {
    name: "MakerNoteSafety",
    description: (value) => ({
      0: "Unsafe",
      1: "Safe"
    })[value] || "Unknown"
  },
  50778: {
    name: "CalibrationIlluminant1",
    description: tag_names_common_default["LightSource"]
  },
  50779: {
    name: "CalibrationIlluminant2",
    description: tag_names_common_default["LightSource"]
  },
  50781: "RawDataUniqueID",
  50827: "OriginalRawFileName",
  50828: "OriginalRawFileData",
  50831: "AsShotICCProfile",
  50832: "AsShotPreProfileMatrix",
  50833: "CurrentICCProfile",
  50834: "CurrentPreProfileMatrix",
  50879: "ColorimetricReference",
  50885: "SRawType",
  50898: "PanasonicTitle",
  50899: "PanasonicTitle2",
  50931: "CameraCalibrationSig",
  50932: "ProfileCalibrationSig",
  50933: "ProfileIFD",
  50934: "AsShotProfileName",
  50936: "ProfileName",
  50937: "ProfileHueSatMapDims",
  50938: "ProfileHueSatMapData1",
  50939: "ProfileHueSatMapData2",
  50940: "ProfileToneCurve",
  50941: {
    name: "ProfileEmbedPolicy",
    description: (value) => ({
      0: "Allow Copying",
      1: "Embed if Used",
      2: "Never Embed",
      3: "No Restrictions"
    })[value] || "Unknown"
  },
  50942: "ProfileCopyright",
  50964: "ForwardMatrix1",
  50965: "ForwardMatrix2",
  50966: "PreviewApplicationName",
  50967: "PreviewApplicationVersion",
  50968: "PreviewSettingsName",
  50969: "PreviewSettingsDigest",
  50970: {
    name: "PreviewColorSpace",
    description: (value) => ({
      1: "Gray Gamma 2.2",
      2: "sRGB",
      3: "Adobe RGB",
      4: "ProPhoto RGB"
    })[value] || "Unknown"
  },
  50971: "PreviewDateTime",
  50972: "RawImageDigest",
  50973: "OriginalRawFileDigest",
  50981: "ProfileLookTableDims",
  50982: "ProfileLookTableData",
  51043: "TimeCodes",
  51044: "FrameRate",
  51058: "TStop",
  51081: "ReelName",
  51089: "OriginalDefaultFinalSize",
  51090: "OriginalBestQualitySize",
  51091: "OriginalDefaultCropSize",
  51105: "CameraLabel",
  51107: {
    name: "ProfileHueSatMapEncoding",
    description: (value) => ({
      0: "Linear",
      1: "sRGB"
    })[value] || "Unknown"
  },
  51108: {
    name: "ProfileLookTableEncoding",
    description: (value) => ({
      0: "Linear",
      1: "sRGB"
    })[value] || "Unknown"
  },
  51109: "BaselineExposureOffset",
  51110: {
    name: "DefaultBlackRender",
    description: (value) => ({
      0: "Auto",
      1: "None"
    })[value] || "Unknown"
  },
  51111: "NewRawImageDigest",
  51112: "RawToPreviewGain"
};
function decodeXPValue(value) {
  const decodedValue = new TextDecoder("utf-16").decode(new Uint8Array(value));
  return decodedValue.replace(/\u0000+$/, "");
}
var tag_names_exif_ifd_default = {
  33434: {
    "name": "ExposureTime",
    "description": tag_names_common_default.ExposureTime
  },
  33437: {
    "name": "FNumber",
    "description": tag_names_common_default.FNumber
  },
  34850: {
    "name": "ExposureProgram",
    "description": tag_names_common_default.ExposureProgram
  },
  34852: "SpectralSensitivity",
  34855: "ISOSpeedRatings",
  34856: {
    "name": "OECF",
    "description": () => "[Raw OECF table data]"
  },
  34858: "TimeZoneOffset",
  34859: "SelfTimerMode",
  34864: {
    name: "SensitivityType",
    description: (value) => ({
      1: "Standard Output Sensitivity",
      2: "Recommended Exposure Index",
      3: "ISO Speed",
      4: "Standard Output Sensitivity and Recommended Exposure Index",
      5: "Standard Output Sensitivity and ISO Speed",
      6: "Recommended Exposure Index and ISO Speed",
      7: "Standard Output Sensitivity, Recommended Exposure Index and ISO Speed"
    })[value] || "Unknown"
  },
  34865: "StandardOutputSensitivity",
  34866: "RecommendedExposureIndex",
  34867: "ISOSpeed",
  34868: "ISOSpeedLatitudeyyy",
  34869: "ISOSpeedLatitudezzz",
  36864: {
    "name": "ExifVersion",
    "description": (value) => getStringValue(value)
  },
  36867: "DateTimeOriginal",
  36868: "DateTimeDigitized",
  36873: "GooglePlusUploadCode",
  36880: "OffsetTime",
  36881: "OffsetTimeOriginal",
  36882: "OffsetTimeDigitized",
  37121: {
    "name": "ComponentsConfiguration",
    "description": tag_names_common_default.ComponentsConfiguration
  },
  37122: "CompressedBitsPerPixel",
  37377: {
    "name": "ShutterSpeedValue",
    "description": tag_names_common_default.ShutterSpeedValue
  },
  37378: {
    "name": "ApertureValue",
    "description": tag_names_common_default.ApertureValue
  },
  37379: "BrightnessValue",
  37380: "ExposureBiasValue",
  37381: {
    "name": "MaxApertureValue",
    "description": (value) => {
      return Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2);
    }
  },
  37382: {
    "name": "SubjectDistance",
    "description": (value) => value[0] / value[1] + " m"
  },
  37383: {
    "name": "MeteringMode",
    "description": tag_names_common_default.MeteringMode
  },
  37384: {
    "name": "LightSource",
    description: tag_names_common_default.LightSource
  },
  37385: {
    "name": "Flash",
    "description": (value) => {
      if (value === 0) {
        return "Flash did not fire";
      } else if (value === 1) {
        return "Flash fired";
      } else if (value === 5) {
        return "Strobe return light not detected";
      } else if (value === 7) {
        return "Strobe return light detected";
      } else if (value === 9) {
        return "Flash fired, compulsory flash mode";
      } else if (value === 13) {
        return "Flash fired, compulsory flash mode, return light not detected";
      } else if (value === 15) {
        return "Flash fired, compulsory flash mode, return light detected";
      } else if (value === 16) {
        return "Flash did not fire, compulsory flash mode";
      } else if (value === 24) {
        return "Flash did not fire, auto mode";
      } else if (value === 25) {
        return "Flash fired, auto mode";
      } else if (value === 29) {
        return "Flash fired, auto mode, return light not detected";
      } else if (value === 31) {
        return "Flash fired, auto mode, return light detected";
      } else if (value === 32) {
        return "No flash function";
      } else if (value === 65) {
        return "Flash fired, red-eye reduction mode";
      } else if (value === 69) {
        return "Flash fired, red-eye reduction mode, return light not detected";
      } else if (value === 71) {
        return "Flash fired, red-eye reduction mode, return light detected";
      } else if (value === 73) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode";
      } else if (value === 77) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected";
      } else if (value === 79) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected";
      } else if (value === 89) {
        return "Flash fired, auto mode, red-eye reduction mode";
      } else if (value === 93) {
        return "Flash fired, auto mode, return light not detected, red-eye reduction mode";
      } else if (value === 95) {
        return "Flash fired, auto mode, return light detected, red-eye reduction mode";
      }
      return "Unknown";
    }
  },
  37386: {
    "name": "FocalLength",
    "description": tag_names_common_default.FocalLength
  },
  37393: "ImageNumber",
  37394: {
    name: "SecurityClassification",
    description: (value) => ({
      "C": "Confidential",
      "R": "Restricted",
      "S": "Secret",
      "T": "Top Secret",
      "U": "Unclassified"
    })[value] || "Unknown"
  },
  37395: "ImageHistory",
  37396: {
    "name": "SubjectArea",
    "description": (value) => {
      if (value.length === 2) {
        return `Location; X: ${value[0]}, Y: ${value[1]}`;
      } else if (value.length === 3) {
        return `Circle; X: ${value[0]}, Y: ${value[1]}, diameter: ${value[2]}`;
      } else if (value.length === 4) {
        return `Rectangle; X: ${value[0]}, Y: ${value[1]}, width: ${value[2]}, height: ${value[3]}`;
      }
      return "Unknown";
    }
  },
  37500: {
    "name": "MakerNote",
    "description": () => "[Raw maker note data]"
  },
  37510: {
    "name": "UserComment",
    "description": getEncodedString
  },
  37520: "SubSecTime",
  37521: "SubSecTimeOriginal",
  37522: "SubSecTimeDigitized",
  37724: "ImageSourceData",
  37888: {
    "name": "AmbientTemperature",
    "description": (value) => value[0] / value[1] + " \xB0C"
  },
  37889: {
    "name": "Humidity",
    "description": (value) => value[0] / value[1] + " %"
  },
  37890: {
    "name": "Pressure",
    "description": (value) => value[0] / value[1] + " hPa"
  },
  37891: {
    "name": "WaterDepth",
    "description": (value) => value[0] / value[1] + " m"
  },
  37892: {
    "name": "Acceleration",
    "description": (value) => value[0] / value[1] + " mGal"
  },
  37893: {
    "name": "CameraElevationAngle",
    "description": (value) => value[0] / value[1] + " \xB0"
  },
  40960: {
    "name": "FlashpixVersion",
    "description": (value) => value.map((charCode) => String.fromCharCode(charCode)).join("")
  },
  40961: {
    "name": "ColorSpace",
    "description": tag_names_common_default.ColorSpace
  },
  40962: "PixelXDimension",
  40963: "PixelYDimension",
  40964: "RelatedSoundFile",
  40965: "Interoperability IFD Pointer",
  41483: "FlashEnergy",
  41484: {
    "name": "SpatialFrequencyResponse",
    "description": () => "[Raw SFR table data]"
  },
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: {
    "name": "FocalPlaneResolutionUnit",
    "description": tag_names_common_default.FocalPlaneResolutionUnit
  },
  41492: {
    "name": "SubjectLocation",
    "description": ([x, y]) => `X: ${x}, Y: ${y}`
  },
  41493: "ExposureIndex",
  41495: {
    "name": "SensingMethod",
    "description": (value) => {
      if (value === 1) {
        return "Undefined";
      } else if (value === 2) {
        return "One-chip color area sensor";
      } else if (value === 3) {
        return "Two-chip color area sensor";
      } else if (value === 4) {
        return "Three-chip color area sensor";
      } else if (value === 5) {
        return "Color sequential area sensor";
      } else if (value === 7) {
        return "Trilinear sensor";
      } else if (value === 8) {
        return "Color sequential linear sensor";
      }
      return "Unknown";
    }
  },
  41728: {
    "name": "FileSource",
    "description": (value) => {
      if (value === 3) {
        return "DSC";
      }
      return "Unknown";
    }
  },
  41729: {
    "name": "SceneType",
    "description": (value) => {
      if (value === 1) {
        return "A directly photographed image";
      }
      return "Unknown";
    }
  },
  41730: {
    "name": "CFAPattern",
    "description": () => "[Raw CFA pattern table data]"
  },
  41985: {
    "name": "CustomRendered",
    "description": tag_names_common_default.CustomRendered
  },
  41986: {
    "name": "ExposureMode",
    "description": tag_names_common_default.ExposureMode
  },
  41987: {
    "name": "WhiteBalance",
    "description": tag_names_common_default.WhiteBalance
  },
  41988: {
    "name": "DigitalZoomRatio",
    "description": (value) => {
      if (value[0] === 0) {
        return "Digital zoom was not used";
      }
      return "" + value[0] / value[1];
    }
  },
  41989: {
    "name": "FocalLengthIn35mmFilm",
    // Sometimes called FocalLengthIn35mmFormat.
    "description": tag_names_common_default.FocalLengthIn35mmFilm
  },
  41990: {
    "name": "SceneCaptureType",
    "description": tag_names_common_default.SceneCaptureType
  },
  41991: {
    "name": "GainControl",
    "description": (value) => {
      if (value === 0) {
        return "None";
      } else if (value === 1) {
        return "Low gain up";
      } else if (value === 2) {
        return "High gain up";
      } else if (value === 3) {
        return "Low gain down";
      } else if (value === 4) {
        return "High gain down";
      }
      return "Unknown";
    }
  },
  41992: {
    "name": "Contrast",
    "description": tag_names_common_default.Contrast
  },
  41993: {
    "name": "Saturation",
    "description": tag_names_common_default.Saturation
  },
  41994: {
    "name": "Sharpness",
    "description": tag_names_common_default.Sharpness
  },
  41995: {
    "name": "DeviceSettingDescription",
    "description": () => "[Raw device settings table data]"
  },
  41996: {
    "name": "SubjectDistanceRange",
    "description": (value) => {
      if (value === 1) {
        return "Macro";
      } else if (value === 2) {
        return "Close view";
      } else if (value === 3) {
        return "Distant view";
      }
      return "Unknown";
    }
  },
  42016: "ImageUniqueID",
  42032: "CameraOwnerName",
  42033: "BodySerialNumber",
  42034: {
    "name": "LensSpecification",
    "description": (value) => {
      const focalLengthFrom = parseFloat((value[0][0] / value[0][1]).toFixed(5));
      const focalLengthTo = parseFloat((value[1][0] / value[1][1]).toFixed(5));
      const focalLengths = `${focalLengthFrom}-${focalLengthTo} mm`;
      if (value[3][1] === 0) {
        return `${focalLengths} f/?`;
      }
      const maxAperture = 1 / (value[2][1] / value[2][1] / (value[3][0] / value[3][1]));
      return `${focalLengths} f/${parseFloat(maxAperture.toFixed(5))}`;
    }
  },
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  42080: {
    name: "CompositeImage",
    description: (value) => ({
      1: "Not a Composite Image",
      2: "General Composite Image",
      3: "Composite Image Captured While Shooting"
    })[value] || "Unknown"
  },
  42081: "SourceImageNumberOfCompositeImage",
  42082: "SourceExposureTimesOfCompositeImage",
  42240: "Gamma",
  59932: "Padding",
  59933: "OffsetSchema",
  65e3: "OwnerName",
  65001: "SerialNumber",
  65002: "Lens",
  65100: "RawFile",
  65101: "Converter",
  65102: "WhiteBalance",
  65105: "Exposure",
  65106: "Shadows",
  65107: "Brightness",
  65108: "Contrast",
  65109: "Saturation",
  65110: "Sharpness",
  65111: "Smoothness",
  65112: "MoireFilter"
};
var tag_names_gps_ifd_default = {
  0: {
    "name": "GPSVersionID",
    "description": (value) => {
      if (value[0] === 2 && value[1] === 2 && value[2] === 0 && value[3] === 0) {
        return "Version 2.2";
      }
      return "Unknown";
    }
  },
  1: {
    "name": "GPSLatitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "N") {
        return "North latitude";
      } else if (ref === "S") {
        return "South latitude";
      }
      return "Unknown";
    }
  },
  2: {
    "name": "GPSLatitude",
    "description": getCalculatedGpsValue
  },
  3: {
    "name": "GPSLongitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "E") {
        return "East longitude";
      } else if (ref === "W") {
        return "West longitude";
      }
      return "Unknown";
    }
  },
  4: {
    "name": "GPSLongitude",
    "description": getCalculatedGpsValue
  },
  5: {
    "name": "GPSAltitudeRef",
    "description": (value) => {
      if (value === 0) {
        return "Sea level";
      } else if (value === 1) {
        return "Sea level reference (negative value)";
      }
      return "Unknown";
    }
  },
  6: {
    "name": "GPSAltitude",
    "description": (value) => {
      return value[0] / value[1] + " m";
    }
  },
  7: {
    "name": "GPSTimeStamp",
    "description": (values) => {
      return values.map(([numerator, denominator]) => {
        const num = numerator / denominator;
        if (/^\d(\.|$)/.test(`${num}`)) {
          return `0${num}`;
        }
        return num;
      }).join(":");
    }
  },
  8: "GPSSatellites",
  9: {
    "name": "GPSStatus",
    "description": (value) => {
      const status = value.join("");
      if (status === "A") {
        return "Measurement in progress";
      } else if (status === "V") {
        return "Measurement Interoperability";
      }
      return "Unknown";
    }
  },
  10: {
    "name": "GPSMeasureMode",
    "description": (value) => {
      const mode = value.join("");
      if (mode === "2") {
        return "2-dimensional measurement";
      } else if (mode === "3") {
        return "3-dimensional measurement";
      }
      return "Unknown";
    }
  },
  11: "GPSDOP",
  12: {
    "name": "GPSSpeedRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "K") {
        return "Kilometers per hour";
      } else if (ref === "M") {
        return "Miles per hour";
      } else if (ref === "N") {
        return "Knots";
      }
      return "Unknown";
    }
  },
  13: "GPSSpeed",
  14: {
    "name": "GPSTrackRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  15: "GPSTrack",
  16: {
    "name": "GPSImgDirectionRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: {
    "name": "GPSDestLatitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "N") {
        return "North latitude";
      } else if (ref === "S") {
        return "South latitude";
      }
      return "Unknown";
    }
  },
  20: {
    "name": "GPSDestLatitude",
    "description": (value) => {
      return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
    }
  },
  21: {
    "name": "GPSDestLongitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "E") {
        return "East longitude";
      } else if (ref === "W") {
        return "West longitude";
      }
      return "Unknown";
    }
  },
  22: {
    "name": "GPSDestLongitude",
    "description": (value) => {
      return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
    }
  },
  23: {
    "name": "GPSDestBearingRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  24: "GPSDestBearing",
  25: {
    "name": "GPSDestDistanceRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "K") {
        return "Kilometers";
      } else if (ref === "M") {
        return "Miles";
      } else if (ref === "N") {
        return "Knots";
      }
      return "Unknown";
    }
  },
  26: "GPSDestDistance",
  27: {
    "name": "GPSProcessingMethod",
    "description": getEncodedString
  },
  28: {
    "name": "GPSAreaInformation",
    "description": getEncodedString
  },
  29: "GPSDateStamp",
  30: {
    "name": "GPSDifferential",
    "description": (value) => {
      if (value === 0) {
        return "Measurement without differential correction";
      } else if (value === 1) {
        return "Differential correction applied";
      }
      return "Unknown";
    }
  },
  31: "GPSHPositioningError"
};
var tag_names_interoperability_ifd_default = {
  1: "InteroperabilityIndex",
  2: {
    name: "InteroperabilityVersion",
    description: (value) => getStringValue(value)
  },
  4096: "RelatedImageFileFormat",
  4097: "RelatedImageWidth",
  4098: "RelatedImageHeight"
};
var tag_names_mpf_ifd_default = {
  45056: {
    "name": "MPFVersion",
    "description": (value) => getStringValue(value)
  },
  45057: "NumberOfImages",
  45058: "MPEntry",
  45059: "ImageUIDList",
  45060: "TotalFrames"
};
var tag_names_canon_ifd_default = {
  1: {
    "name": "CameraSettings",
    "description": (value) => value
  },
  4: {
    "name": "ShotInfo",
    "description": (value) => value
  },
  149: "LensModel"
};
var tag_names_pentax_ifd_default = {
  0: {
    "name": "PentaxVersion",
    "description": (value) => value.join(".")
  },
  5: "PentaxModelID",
  555: "LevelInfo"
};
var tagNames0thExifIfds = objectAssign({}, tag_names_0th_ifd_default, tag_names_exif_ifd_default);
var IFD_TYPE_0TH = "0th";
var IFD_TYPE_1ST = "1st";
var IFD_TYPE_EXIF = "exif";
var IFD_TYPE_GPS = "gps";
var IFD_TYPE_INTEROPERABILITY = "interoperability";
var IFD_TYPE_MPF = "mpf";
var IFD_TYPE_CANON = "canon";
var IFD_TYPE_PENTAX = "pentax";
var tag_names_default = {
  [IFD_TYPE_0TH]: tagNames0thExifIfds,
  [IFD_TYPE_1ST]: tag_names_0th_ifd_default,
  [IFD_TYPE_EXIF]: tagNames0thExifIfds,
  [IFD_TYPE_GPS]: tag_names_gps_ifd_default,
  [IFD_TYPE_INTEROPERABILITY]: tag_names_interoperability_ifd_default,
  [IFD_TYPE_MPF]: constants_default.USE_MPF ? tag_names_mpf_ifd_default : {},
  [IFD_TYPE_CANON]: constants_default.USE_MAKER_NOTES ? tag_names_canon_ifd_default : {},
  [IFD_TYPE_PENTAX]: constants_default.USE_MAKER_NOTES ? tag_names_pentax_ifd_default : {}
};
var typeSizes = {
  1: 1,
  // BYTE
  2: 1,
  // ASCII
  3: 2,
  // SHORT
  4: 4,
  // LONG
  5: 8,
  // RATIONAL
  7: 1,
  // UNDEFINED
  9: 4,
  // SLONG
  10: 8,
  // SRATIONAL
  13: 4
  // IFD
};
var tagTypes = {
  "BYTE": 1,
  "ASCII": 2,
  "SHORT": 3,
  "LONG": 4,
  "RATIONAL": 5,
  "UNDEFINED": 7,
  "SLONG": 9,
  "SRATIONAL": 10,
  "IFD": 13
};
var types_default = {
  getAsciiValue,
  getByteAt,
  getAsciiAt,
  getShortAt,
  getLongAt,
  getRationalAt,
  getUndefinedAt,
  getSlongAt,
  getSrationalAt,
  getIfdPointerAt,
  typeSizes,
  tagTypes,
  getTypeSize
};
function getAsciiValue(charArray) {
  return charArray.map((charCode) => String.fromCharCode(charCode));
}
function getByteAt(dataView, offset) {
  return dataView.getUint8(offset);
}
function getAsciiAt(dataView, offset) {
  return dataView.getUint8(offset);
}
function getShortAt(dataView, offset, byteOrder) {
  return dataView.getUint16(offset, byteOrder === byte_order_default.LITTLE_ENDIAN);
}
function getLongAt(dataView, offset, byteOrder) {
  return dataView.getUint32(offset, byteOrder === byte_order_default.LITTLE_ENDIAN);
}
function getRationalAt(dataView, offset, byteOrder) {
  return [getLongAt(dataView, offset, byteOrder), getLongAt(dataView, offset + 4, byteOrder)];
}
function getUndefinedAt(dataView, offset) {
  return getByteAt(dataView, offset);
}
function getSlongAt(dataView, offset, byteOrder) {
  return dataView.getInt32(offset, byteOrder === byte_order_default.LITTLE_ENDIAN);
}
function getSrationalAt(dataView, offset, byteOrder) {
  return [getSlongAt(dataView, offset, byteOrder), getSlongAt(dataView, offset + 4, byteOrder)];
}
function getIfdPointerAt(dataView, offset, byteOrder) {
  return getLongAt(dataView, offset, byteOrder);
}
function getTypeSize(typeName) {
  if (tagTypes[typeName] === void 0) {
    throw new Error("No such type found.");
  }
  return typeSizes[tagTypes[typeName]];
}
function createNoopFilter() {
  return {
    isActive: false,
    shouldReturnGroup: alwaysTrue,
    shouldParseGroup: alwaysTrue,
    shouldReturnTag: alwaysTrue,
    shouldParseTag: alwaysTrue
  };
  function alwaysTrue() {
    return true;
  }
}
var NOOP_TAG_FILTER = createNoopFilter();
var getTagValueAt = {
  1: types_default.getByteAt,
  2: types_default.getAsciiAt,
  3: types_default.getShortAt,
  4: types_default.getLongAt,
  5: types_default.getRationalAt,
  7: types_default.getUndefinedAt,
  9: types_default.getSlongAt,
  10: types_default.getSrationalAt,
  13: types_default.getIfdPointerAt
};
var RATIOS = [0, 1, 12 / 10, 4 / 3, 3 / 2, 16 / 9, 5 / 4, 2];
var BYTES_8BIM_SIZE = 4;
var RESOURCE_ID_SIZE = 2;
var RESOURCE_NAME_MIN_SIZE = 2;
var RESOURCE_SIZE_SIZE = 4;
var RESOURCE_BLOCK_MIN_HEADER_SIZE = BYTES_8BIM_SIZE + RESOURCE_ID_SIZE + RESOURCE_NAME_MIN_SIZE + RESOURCE_SIZE_SIZE;
var PathRecordTypes = {
  CLOSED_SUBPATH_LENGTH: 0,
  CLOSED_SUBPATH_BEZIER_LINKED: 1,
  CLOSED_SUBPATH_BEZIER_UNLINKED: 2,
  OPEN_SUBPATH_LENGTH: 3,
  OPEN_SUBPATH_BEZIER_LINKED: 4,
  OPEN_SUBPATH_BEZIER_UNLINKED: 5,
  FILL_RULE: 6,
  CLIPBOARD: 7,
  INITIAL_FILL_RULE: 8
};
var PATH_RECORD_SIZE = 24;
var PATH_RECORD_TYPES = {
  [PathRecordTypes.CLOSED_SUBPATH_LENGTH]: {
    description: "Closed subpath length",
    path: (dataView, offset) => [types_default.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.CLOSED_SUBPATH_BEZIER_LINKED]: {
    description: "Closed subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes.CLOSED_SUBPATH_BEZIER_UNLINKED]: {
    description: "Closed subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes.OPEN_SUBPATH_LENGTH]: {
    description: "Open subpath length",
    path: (dataView, offset) => [types_default.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.OPEN_SUBPATH_BEZIER_LINKED]: {
    description: "Open subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes.OPEN_SUBPATH_BEZIER_UNLINKED]: {
    description: "Open subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes.FILL_RULE]: {
    description: "Path fill rule",
    path: () => []
  },
  [PathRecordTypes.INITIAL_FILL_RULE]: {
    description: "Initial fill rule",
    path: (dataView, offset) => [types_default.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.CLIPBOARD]: {
    description: "Clipboard",
    path: parseClipboard
  }
};
function parseBezierKnot(dataView, offset) {
  const PATH_POINT_SIZE = 8;
  const path = [];
  for (let i = 0; i < PATH_RECORD_SIZE; i += PATH_POINT_SIZE) {
    path.push(parsePathPoint(dataView, offset + i));
  }
  return path;
}
function parsePathPoint(dataView, offset) {
  const vertical = getFixedPointNumber(dataView, offset, 8);
  const horizontal = getFixedPointNumber(dataView, offset + 4, 8);
  return [horizontal, vertical];
}
function parseClipboard(dataView, offset) {
  return [
    [
      getFixedPointNumber(dataView, offset, 8),
      // Top
      getFixedPointNumber(dataView, offset + 4, 8),
      // Left
      getFixedPointNumber(dataView, offset + 8, 8),
      // Botton
      getFixedPointNumber(dataView, offset + 12, 8)
      // Right
    ],
    getFixedPointNumber(dataView, offset + 16, 8)
    // Resolution
  ];
}
function getFixedPointNumber(dataView, offset, binaryPoint) {
  const number = types_default.getLongAt(dataView, offset);
  const sign = number >>> 31 === 0 ? 1 : -1;
  const integer = (number & 2130706432) >>> 32 - binaryPoint;
  const fraction2 = number & parseInt(strRepeat("1", 32 - binaryPoint), 2);
  return sign * parseFloatRadix(integer.toString(2) + "." + padStart(fraction2.toString(2), 32 - binaryPoint, "0"), 2);
}
var SIGNATURE = "8BIM";
var SIGNATURE_SIZE = SIGNATURE.length;
var BYTE_ORDER_OFFSET = 8;
var PENTAX_IFD_OFFSET = BYTE_ORDER_OFFSET + 2;
function MetadataMissingError(message) {
  this.name = "MetadataMissingError";
  this.message = message || "No Exif data";
  this.stack = new Error().stack;
}
MetadataMissingError.prototype = new Error();
var Image2 = class {
  /**
   * Create a new Image instance
   *
   * @param options - Configuration options for the image
   * @param options.filename - The filename of the image
   * @param options.data - Raw binary data of the image
   */
  constructor(options) {
    this.filename = options.filename;
    this.data = options.data;
  }
  /**
   * Get the size of the image in bytes
   */
  get size() {
    return this.data.byteLength;
  }
  /**
   * Convert the image data to a base64 string
   *
   * @returns Base64 encoded image data
   */
  toBase64() {
    return uint8ArrayToBase64(this.data);
  }
  /**
   * Create a data URL for the image
   *
   * @returns Data URL for the image (suitable for browser use)
   */
  toDataURL() {
    const mimeType = this.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${this.toBase64()}`;
  }
  /**
   * Save the image to disk (Node.js environment only)
   *
   * @param outputPath - Path to save the image to. If a directory is provided,
   *                     the image is saved with its original filename in that directory.
   * @returns Promise that resolves to the full path of the saved file
   */
  async save(outputPath) {
    if (!isNodeEnvironment()) {
      throw new Error("save() is only available in Node.js environment");
    }
    try {
      const path = await getNodePath();
      if (!path) {
        throw new Error("Path module not available");
      }
      let fullPath;
      if (outputPath.endsWith("/") || !path.extname(outputPath)) {
        await ensureDirectoryExists(outputPath);
        fullPath = path.join(outputPath, this.filename);
      } else {
        await ensureDirectoryExists(path.dirname(outputPath));
        fullPath = outputPath;
      }
      await saveBinaryFile(this.data, fullPath);
      return fullPath;
    } catch (error) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }
  /**
   * Create a Blob from the image data (browser environment only)
   *
   * @returns Blob representing the image
   */
  toBlob() {
    if (typeof window === "undefined") {
      throw new Error("toBlob() is only available in browser environment");
    }
    const mimeType = this.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return new Blob([this.data], { type: mimeType });
  }
  /**
   * Create a File object from the image data (browser environment only)
   *
   * @returns File object representing the image
   */
  toFile() {
    if (typeof window === "undefined") {
      throw new Error("toFile() is only available in browser environment");
    }
    const mimeType = this.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return new File([this.data], this.filename, {
      type: mimeType
    });
  }
};
var MsgpackEvent = class {
  constructor(options) {
    this.event_type = options.event_type;
    this.samp_ix = options.samp_ix;
    this.step_ix = options.step_ix;
    this.gen_id = options.gen_id;
    this.sigma = options.sigma;
    this.image = options.image;
  }
  toString() {
    return `MsgpackEvent(event_type=${this.event_type}, step_ix=${this.step_ix}, gen_id=${this.gen_id})`;
  }
};
var BASE_MODEL = {
  [
    "nai-diffusion-3-inpainting"
    /* V3_INP */
  ]: "nai-diffusion-3",
  [
    "nai-diffusion-4-full-inpainting"
    /* V4_INP */
  ]: "nai-diffusion-4-full",
  [
    "nai-diffusion-4-curated-inpainting"
    /* V4_CUR_INP */
  ]: "nai-diffusion-4-curated-preview",
  [
    "nai-diffusion-4-5-full-inpainting"
    /* V4_5_INP */
  ]: "nai-diffusion-4-5-full",
  [
    "nai-diffusion-4-5-curated-inpainting"
    /* V4_5_CUR_INP */
  ]: "nai-diffusion-4-5-curated",
  [
    "nai-diffusion-furry-3-inpainting"
    /* FURRY_INP */
  ]: "nai-diffusion-furry-3"
  /* FURRY */
};
function baseModel(model) {
  return BASE_MODEL[model] ?? model;
}
var QUALITY_TAGS = {
  [
    "nai-diffusion-4-5-full"
    /* V4_5 */
  ]: "very aesthetic, masterpiece, no text",
  [
    "nai-diffusion-4-5-curated"
    /* V4_5_CUR */
  ]: "location, masterpiece, no text, -0.8::feet::, rating:general",
  [
    "nai-diffusion-4-full"
    /* V4 */
  ]: "no text, best quality, very aesthetic, absurdres",
  [
    "nai-diffusion-4-curated-preview"
    /* V4_CUR */
  ]: "rating:general, amazing quality, very aesthetic, absurdres",
  [
    "nai-diffusion-3"
    /* V3 */
  ]: "best quality, amazing quality, very aesthetic, absurdres",
  [
    "nai-diffusion-furry-3"
    /* FURRY */
  ]: "{best quality}, {amazing quality}"
};
var UC_PRESETS = {
  [
    "nai-diffusion-4-5-full"
    /* V4_5 */
  ]: [
    "nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page",
    "nsfw, lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page",
    "nsfw, {worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic",
    "nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy"
  ],
  [
    "nai-diffusion-4-5-curated"
    /* V4_5_CUR */
  ]: [
    "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page",
    "blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page",
    "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page"
  ],
  [
    "nai-diffusion-4-full"
    /* V4 */
  ]: [
    "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks",
    "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing"
  ],
  [
    "nai-diffusion-4-curated-preview"
    /* V4_CUR */
  ]: [
    "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts",
    "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature"
  ],
  [
    "nai-diffusion-3"
    /* V3 */
  ]: [
    "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
    "lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing",
    "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract], bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes"
  ],
  [
    "nai-diffusion-furry-3"
    /* FURRY */
  ]: [
    "{{worst quality}}, [displeasing], {unusual pupils}, guide lines, {{unfinished}}, {bad}, url, artist name, {{tall image}}, mosaic, {sketch page}, comic panel, impact (font), [dated], {logo}, ych, {what}, {where is your god now}, {distorted text}, repeated text, {floating head}, {1994}, {widescreen}, absolutely everyone, sequence, {compression artifacts}, hard translated, {cropped}, {commissioner name}, unknown text, high contrast",
    "{worst quality}, guide lines, unfinished, bad, url, tall image, widescreen, compression artifacts, unknown text"
  ]
};
var MetadataProcessor = class {
  /**
   * Process and validate metadata before sending to API
   *
   * @param metadata - User-provided metadata
   * @returns Processed metadata object
   */
  processMetadata(metadata) {
    const result = typeof structuredClone === "function" ? structuredClone(metadata) : JSON.parse(JSON.stringify(metadata));
    this.applyDefaultValues(result);
    this.handleResolution(result);
    this.handleUcPreset(result);
    this.handleQualityTags(result);
    result.prompt = result.prompt ? deduplicateTags(result.prompt) : "";
    result.negative_prompt = result.negative_prompt ? deduplicateTags(result.negative_prompt) : "";
    this.handleActionSpecificParameters(result);
    this.handleCharacterPrompts(result);
    this.handleUseCoords(result);
    this.handleStream(result);
    this.handleV4Prompt(result);
    this.handleV4NegativePrompt(result);
    this.handleModelSpecificSettings(result);
    this.handleSamplerSpecificSettings(result);
    this.handleInpaintImg2ImgStrength(result);
    return result;
  }
  /**
   * Apply default values to metadata
   */
  applyDefaultValues(metadata) {
    metadata.model = metadata.model ?? "nai-diffusion-4-5-full";
    metadata.action = metadata.action ?? "generate";
    metadata.resPreset = metadata.resPreset ?? "normal_portrait";
    metadata.ucPreset = metadata.ucPreset ?? 0;
    metadata.qualityToggle = metadata.qualityToggle ?? true;
    metadata.n_samples = metadata.n_samples ?? 1;
    metadata.steps = metadata.steps ?? 28;
    metadata.scale = metadata.scale ?? 6;
    metadata.dynamic_thresholding = metadata.dynamic_thresholding ?? false;
    metadata.seed = metadata.seed ?? Math.floor(Math.random() * 4294967288);
    metadata.sampler = metadata.sampler ?? "k_euler_ancestral";
    metadata.cfg_rescale = metadata.cfg_rescale ?? 0;
    metadata.noise_schedule = metadata.noise_schedule ?? "karras";
    metadata.controlnet_strength = metadata.controlnet_strength ?? 1;
    metadata.add_original_image = metadata.add_original_image ?? true;
    metadata.autoSmea = metadata.autoSmea ?? false;
    metadata.params_version = metadata.params_version ?? 3;
    metadata.prompt = metadata.prompt ?? "1girl, cute";
    metadata.negative_prompt = metadata.negative_prompt ?? "";
    metadata.characterPrompts = metadata.characterPrompts ?? [];
    metadata.skip_cfg_above_sigma = metadata.skip_cfg_above_sigma ?? null;
    metadata.legacy_uc = metadata.legacy_uc ?? false;
    metadata.legacy = metadata.legacy ?? false;
    metadata.legacy_v3_extend = metadata.legacy_v3_extend ?? false;
    this.applyDirectorReferenceDefaults(metadata);
    this.applyVibeTransferDefaults(metadata);
    metadata.stream = void 0;
  }
  /**
   * Apply defaults for director reference (character reference) fields.
   * When director reference images are present, the per-image arrays are
   * normalized to matching lengths and vibe transfer parameters are removed
   * (the two features are mutually exclusive). Without images, all director
   * reference parameters are dropped.
   */
  applyDirectorReferenceDefaults(metadata) {
    if (!metadata.director_reference_images?.length) {
      delete metadata.director_reference_descriptions;
      delete metadata.director_reference_images;
      delete metadata.director_reference_information_extracted;
      delete metadata.director_reference_strength_values;
      delete metadata.director_reference_secondary_strength_values;
      return;
    }
    delete metadata.reference_image_multiple;
    delete metadata.reference_information_extracted_multiple;
    delete metadata.reference_strength_multiple;
    delete metadata.normalize_reference_strength_multiple;
    const count = metadata.director_reference_images.length;
    const fit = (values, fill) => {
      const result = (values ?? []).slice(0, count);
      while (result.length < count) result.push(fill());
      return result;
    };
    metadata.director_reference_descriptions = fit(
      metadata.director_reference_descriptions,
      () => ({
        caption: { base_caption: "character", char_captions: [] },
        legacy_uc: false
      })
    );
    metadata.director_reference_information_extracted = fit(
      metadata.director_reference_information_extracted,
      () => 1
    );
    metadata.director_reference_strength_values = fit(
      metadata.director_reference_strength_values,
      () => 1
    );
    metadata.director_reference_secondary_strength_values = fit(
      metadata.director_reference_secondary_strength_values,
      () => 1
    );
  }
  /**
   * Apply defaults for vibe transfer fields (only when director references
   * are not in use)
   */
  applyVibeTransferDefaults(metadata) {
    if (metadata.director_reference_images?.length) return;
    metadata.normalize_reference_strength_multiple = metadata.normalize_reference_strength_multiple ?? true;
    if (metadata.reference_image_multiple?.length) {
      metadata.reference_strength_multiple = metadata.reference_strength_multiple ?? metadata.reference_image_multiple.map(() => 0.6);
    }
  }
  /**
   * V4 generate requests go through the streaming endpoint in msgpack format
   */
  handleStream(metadata) {
    if (isV4Model(metadata.model) && metadata.action === "generate") {
      metadata.stream = "msgpack";
    }
  }
  /**
   * Handle action-specific parameters (img2img and inpaint)
   */
  handleActionSpecificParameters(metadata) {
    if (metadata.action === "img2img" || metadata.action === "infill") {
      metadata.sm = false;
      metadata.sm_dyn = false;
      metadata.strength = metadata.strength || 0.3;
      metadata.noise = metadata.noise || 0;
      metadata.extra_noise_seed = metadata.extra_noise_seed || Math.floor(Math.random() * 4294967288);
    }
  }
  /**
   * Drop V3-only settings for V4+ models
   */
  handleModelSpecificSettings(metadata) {
    if (isV4Model(metadata.model)) {
      metadata.sm = void 0;
      metadata.sm_dyn = void 0;
    }
  }
  /**
   * Handle sampler-specific settings
   */
  handleSamplerSpecificSettings(metadata) {
    if (metadata.sampler === "k_euler_ancestral") {
      metadata.deliberate_euler_ancestral_bug = false;
      metadata.prefer_brownian = true;
    }
  }
  /**
   * Append model-specific quality tags to the prompt when qualityToggle is on
   */
  handleQualityTags(metadata) {
    if (!metadata.qualityToggle) return;
    const tags = QUALITY_TAGS[baseModel(metadata.model)];
    if (tags) {
      metadata.prompt = metadata.prompt ? `${metadata.prompt}, ${tags}` : tags;
    }
  }
  /**
   * Prepend the model-specific negative prompt preset selected by ucPreset
   */
  handleUcPreset(metadata) {
    const presets = UC_PRESETS[baseModel(metadata.model)];
    const uc = presets?.[metadata.ucPreset ?? 0];
    if (!uc) return;
    metadata.negative_prompt = metadata.negative_prompt ? `${uc}, ${metadata.negative_prompt}` : uc;
  }
  /**
   * Default inpaint img2img strength for V4.5 models. When below 1, the API
   * additionally expects an img2img sub-object with color correction.
   */
  handleInpaintImg2ImgStrength(metadata) {
    if (metadata.model === "nai-diffusion-4-5-full" || metadata.model === "nai-diffusion-4-5-full-inpainting") {
      metadata.inpaintImg2ImgStrength = metadata.inpaintImg2ImgStrength ?? metadata.strength ?? 1;
      if (metadata.inpaintImg2ImgStrength < 1) {
        metadata.img2img = {
          strength: metadata.inpaintImg2ImgStrength,
          color_correct: true
        };
      } else {
        delete metadata.img2img;
      }
    }
  }
  /**
   * Determine if coordinates should be used based on character prompt positions.
   * Must run after handleCharacterPrompts so center defaults are in place.
   */
  handleUseCoords(metadata) {
    metadata.use_coords = metadata.characterPrompts?.some(
      (cp) => cp.center.x !== 0.5 || cp.center.y !== 0.5
    ) ?? false;
  }
  /**
   * Set default values for character prompts and deduplicate tags
   */
  handleCharacterPrompts(metadata) {
    metadata.characterPrompts?.forEach((cp) => {
      cp.enabled = cp.enabled ?? true;
      cp.prompt = cp.prompt ? deduplicateTags(cp.prompt) : "1girl, cute";
      cp.uc = cp.uc ? deduplicateTags(cp.uc) : "lowres, aliasing";
      cp.center = {
        x: cp.center?.x ?? 0.5,
        y: cp.center?.y ?? 0.5
      };
    });
  }
  /**
   * Build the V4 prompt structure for V4/V4.5 models
   */
  handleV4Prompt(metadata) {
    if (metadata.v4_prompt || !isV4Model(metadata.model)) return;
    const charCaptions = [];
    metadata.characterPrompts?.forEach((cp) => {
      if (cp.enabled) {
        charCaptions.push({
          char_caption: cp.prompt,
          centers: [cp.center]
        });
      }
    });
    metadata.v4_prompt = {
      caption: {
        base_caption: metadata.prompt || "",
        char_captions: charCaptions
      },
      use_coords: metadata.use_coords || false,
      use_order: true
    };
  }
  /**
   * Build the V4 negative prompt structure for V4/V4.5 models
   */
  handleV4NegativePrompt(metadata) {
    if (metadata.v4_negative_prompt || !isV4Model(metadata.model)) return;
    const charCaptions = [];
    metadata.characterPrompts?.forEach((cp) => {
      if (cp.enabled && cp.uc) {
        charCaptions.push({
          char_caption: cp.uc,
          centers: [cp.center]
        });
      }
    });
    metadata.v4_negative_prompt = {
      caption: {
        base_caption: metadata.negative_prompt || "",
        char_captions: charCaptions
      },
      legacy_uc: metadata.legacy_uc || false
    };
  }
  /**
   * Resolve width/height from the resolution preset when not explicitly set.
   * Explicit dimensions are rounded up to the nearest multiple of 64 and the
   * total pixel count is validated against the allowed range.
   */
  handleResolution(metadata) {
    if (metadata.width == null || metadata.height == null) {
      const preset = metadata.resPreset ?? "normal_portrait";
      const [width, height] = RESOLUTION_DIMENSIONS[preset];
      metadata.width = width;
      metadata.height = height;
    } else {
      metadata.width = Math.ceil(metadata.width / 64) * 64;
      metadata.height = Math.ceil(metadata.height / 64) * 64;
    }
    const totalPixels = metadata.width * metadata.height;
    const minPixels = 64 * 64;
    const maxPixels = 3047424;
    if (totalPixels < minPixels || totalPixels > maxPixels) {
      throw new Error(
        `Total resolution must be between ${minPixels} and ${maxPixels} px, got ${metadata.width}x${metadata.height}=${totalPixels}.`
      );
    }
  }
};
var metadataProcessor = new MetadataProcessor();
var VIBE_CACHE_LIMIT = 100;
function isEncodableImage(base64) {
  return ["iVBOR", "/9j/", "UklGR", "R0lGO"].some(
    (magic) => base64.startsWith(magic)
  );
}
function redactPayload(payload) {
  const params = payload?.parameters;
  if (!params) return payload;
  const redact = (value) => typeof value === "string" ? `<base64: ${value.length} chars>` : value;
  const redacted = { ...params };
  for (const key of ["image", "mask"]) {
    if (redacted[key] !== void 0) redacted[key] = redact(redacted[key]);
  }
  for (const key of ["reference_image_multiple", "director_reference_images"]) {
    if (Array.isArray(redacted[key])) {
      redacted[key] = redacted[key].map(redact);
    }
  }
  return { ...payload, parameters: redacted };
}
var NovelAI = class {
  /**
   * Create a new NovelAI client
   *
   * @param options - Client configuration options
   * @param options.token - NovelAI access token
   * @param options.host - API host for image endpoints (default: Host.WEB)
   * @param options.textHost - API host for text endpoints (default: Host.TEXT)
   * @param options.timeout - Request timeout in milliseconds (default: 120000)
   * @param options.retry - Configuration for request retries (default: enabled with 3 retries)
   * @param options.verbose - Whether to log additional information (default: false)
   */
  constructor(options) {
    this.verbose = false;
    this.vibeCache = /* @__PURE__ */ new Map();
    this.token = options.token;
    this.host = options.host || "https://image.novelai.net";
    this.textHost = options.textHost || "https://text.novelai.net";
    this.timeout = options.timeout || 12e4;
    this.retryConfig = options.retry;
    this.verbose = options.verbose || false;
    this.headers = {
      ...HEADERS,
      Authorization: `Bearer ${this.token}`
    };
  }
  async generateImage(metadata, stream = false, isOpus = false, forceZip = false) {
    const resolved = await this.resolveImageInputs(metadata);
    const processedMetadata = metadataProcessor.processMetadata(resolved);
    if (this.verbose) {
      const cost = calculateCost(processedMetadata, isOpus);
      console.info(`Generating image... estimated Anlas cost: ${cost}`);
    }
    await this.encodeVibe(processedMetadata);
    const payload = prepareMetadataForApi(processedMetadata);
    const useEventStream = isV4Model(processedMetadata.model) && !forceZip;
    if (stream) {
      if (!useEventStream) {
        throw new Error(
          "Streaming is only supported for V4/V4.5 models without forceZip; V3 models return the final image only."
        );
      }
      const response = await withRetry(
        () => this.openStream(`${this.host}${"/ai/generate-image-stream"}`, payload),
        this.retryConfig
      );
      return this.parseEventStream(response, payload.action);
    }
    if (!useEventStream) {
      delete payload.parameters.stream;
    }
    return withRetry(async () => {
      try {
        if (useEventStream) {
          const response2 = await this.request(
            `${this.host}${"/ai/generate-image-stream"}`,
            payload
          );
          return await this.extractImagesFromMsgpack(response2);
        }
        const response = await this.request(
          `${this.host}${"/ai/generate-image"}`,
          payload
        );
        return await this.extractImagesFromZip(response);
      } catch (error) {
        throw this.handleRequestError(error);
      }
    }, this.retryConfig);
  }
  /**
   * Resolve all image-bearing metadata fields to raw base64 strings,
   * accepting any supported ImageInput format.
   */
  async resolveImageInputs(metadata) {
    const result = { ...metadata };
    result.image = await this.resolveToBase64(result.image);
    result.mask = await this.resolveToBase64(result.mask);
    if (result.reference_image_multiple) {
      result.reference_image_multiple = await Promise.all(
        result.reference_image_multiple.map(
          (img) => this.resolveToBase64(img)
        )
      );
    }
    if (result.director_reference_images) {
      result.director_reference_images = await Promise.all(
        result.director_reference_images.map(
          (img) => this.resolveToBase64(img)
        )
      );
    }
    return result;
  }
  /**
   * Convert an ImageInput to a raw base64 string.
   * Strings are treated as data URLs, remote URLs, file paths (Node.js, when
   * the file exists), or raw base64 (fallback) — in that order.
   */
  async resolveToBase64(input) {
    if (input == null) return void 0;
    if (typeof input === "string") {
      if (input.startsWith("data:")) {
        const comma = input.indexOf(",");
        return comma >= 0 ? input.slice(comma + 1) : input;
      }
      if (/^(https?|blob):/.test(input)) {
        return (await parseImage(input)).base64;
      }
      if (isNodeEnvironment()) {
        const fs = await getNodeFs();
        if (fs?.existsSync(input)) {
          return (await parseImage(input)).base64;
        }
      }
      return input;
    }
    return (await parseImage(input)).base64;
  }
  /**
   * Make a buffered request to the NovelAI API.
   * The timeout covers the time until the response is fully received.
   */
  async request(url, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const jsonPayload = JSON.stringify(payload);
    const headers = prepHeaders(this.headers);
    if (this.verbose) {
      console.debug(`[Request] ${url}`, JSON.stringify(redactPayload(payload)));
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: jsonPayload,
        signal: controller.signal
      });
      return await handleResponse(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Open a streaming request. The timeout covers time-to-headers only, so
   * long-running streams are not aborted mid-generation.
   */
  async openStream(url, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const jsonPayload = JSON.stringify(payload);
    const headers = prepHeaders(this.headers);
    if (this.verbose) {
      console.debug(`[Stream] ${url}`, JSON.stringify(redactPayload(payload)));
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: jsonPayload,
        signal: controller.signal
      });
      if (!response.ok) {
        throw await apiErrorFromResponse(response);
      }
      if (!response.body) {
        throw new Error("No response body available for streaming");
      }
      return response;
    } catch (error) {
      throw this.handleRequestError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Parse a streaming response body into MsgpackEvent objects
   */
  async *parseEventStream(response, action) {
    const parser = action === "infill" ? new StreamingSSEParser() : new StreamingMsgpackParser();
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield* parser.feedChunk(value);
      }
      if (parser instanceof StreamingSSEParser) {
        yield* parser.flush();
      }
    } finally {
      reader.releaseLock();
    }
  }
  /**
   * Extract images from ZIP response (V3 models)
   */
  async extractImagesFromZip(apiResponse) {
    const arrayBuffer = await this.getResponseBuffer(apiResponse);
    const zip = await import_jszip.default.loadAsync(arrayBuffer);
    const images = [];
    let index = 0;
    for (const filename of Object.keys(zip.files)) {
      const zipObj = zip.files[filename];
      if (!zipObj.dir) {
        const data = await zipObj.async("uint8array");
        images.push(
          new Image2({
            filename: `${timestampString()}_p${index}.png`,
            data
          })
        );
        index++;
      }
    }
    return images;
  }
  /**
   * Extract final images from a buffered event stream response (V4 models)
   */
  async extractImagesFromMsgpack(apiResponse) {
    const arrayBuffer = await this.getResponseBuffer(apiResponse);
    const events = parseStreamEvents(new Uint8Array(arrayBuffer));
    return events.filter(
      (event) => event.event_type === "final"
      /* FINAL */
    ).map((event) => event.image);
  }
  /**
   * Get response data as ArrayBuffer
   */
  async getResponseBuffer(apiResponse) {
    if (apiResponse.data instanceof ArrayBuffer) {
      return apiResponse.data;
    } else if (apiResponse.data) {
      return await new Response(apiResponse.data).arrayBuffer();
    }
    throw new Error("No data received from API");
  }
  /**
   * Convert AbortError into a friendly timeout message
   */
  handleRequestError(error) {
    if (error?.name === "AbortError") {
      return new Error(
        `Request timed out after ${this.timeout}ms. Consider setting a higher 'timeout' value when creating the NovelAI client.`
      );
    }
    return error;
  }
  /**
   * Use a Director tool with the specified request
   *
   * @param request - Director tool request
   * @returns Promise resolving to an Image object
   */
  async useDirectorTool(request) {
    return withRetry(async () => {
      try {
        const response = await this.request(
          `${this.host}${"/ai/augment-image"}`,
          request
        );
        if (!response.data) {
          throw new Error("Received empty response from the server.");
        }
        const arrayBuffer = await this.getResponseBuffer(response);
        const data = await this.unzipSingleImage(arrayBuffer);
        return new Image2({
          filename: createFilename(request.req_type),
          data
        });
      } catch (error) {
        throw this.handleRequestError(error);
      }
    }, this.retryConfig);
  }
  /**
   * Extract the first image from a single-image ZIP response, falling back
   * to the raw bytes when the response is not a ZIP.
   */
  async unzipSingleImage(arrayBuffer) {
    try {
      const zip = await import_jszip.default.loadAsync(arrayBuffer);
      const firstFile = Object.values(zip.files).find((f) => !f.dir);
      return firstFile ? await firstFile.async("uint8array") : new Uint8Array(arrayBuffer);
    } catch {
      return new Uint8Array(arrayBuffer);
    }
  }
  /**
   * Create a director tool request with common parameters
   */
  async createDirectorRequest(image, reqType, additionalParams = {}) {
    const parsedImage = await parseImage(image);
    return this.useDirectorTool({
      req_type: reqType,
      width: parsedImage.width,
      height: parsedImage.height,
      image: parsedImage.base64,
      ...additionalParams
    });
  }
  /**
   * Convert an image to line art
   */
  async lineArt(image) {
    return this.createDirectorRequest(
      image,
      "lineart"
      /* LINEART */
    );
  }
  /**
   * Convert an image to sketch
   */
  async sketch(image) {
    return this.createDirectorRequest(
      image,
      "sketch"
      /* SKETCH */
    );
  }
  /**
   * Remove the background from an image
   */
  async backgroundRemoval(image) {
    return this.createDirectorRequest(
      image,
      "bg-removal"
      /* BACKGROUND_REMOVAL */
    );
  }
  /**
   * Declutter an image (remove noise, distractions, etc.)
   */
  async declutter(image) {
    return this.createDirectorRequest(
      image,
      "declutter"
      /* DECLUTTER */
    );
  }
  /**
   * Colorize a sketch or line art
   *
   * @param image - Image input (path, Blob, File, URL, etc.)
   * @param prompt - Additional prompt to add to the request
   * @param defry - Defry value (0-5, default: 0)
   */
  async colorize(image, prompt = "", defry = 0) {
    return this.createDirectorRequest(image, "colorize", {
      prompt,
      defry
    });
  }
  /**
   * Change the emotion of a character in an image
   *
   * @param image - Image input (path, Blob, File, URL, etc.)
   * @param emotion - Target emotion to change to
   * @param prompt - Additional prompt to add to the request
   * @param emotionLevel - Strength of the emotion change (default: NORMAL)
   */
  async changeEmotion(image, emotion = "neutral", prompt = "", emotionLevel = 0) {
    return this.createDirectorRequest(image, "emotion", {
      prompt: `${emotion};;${prompt}`,
      defry: emotionLevel
    });
  }
  /**
   * Upscale an image using NovelAI's dedicated upscaler
   *
   * Note: this endpoint lives on api.novelai.net and requires an active
   * subscription; the upscaled image is returned as-is (no re-generation).
   *
   * @param image - Image input (path, Blob, File, URL, etc.)
   * @param scale - Upscale factor, 2 or 4 (default: 4)
   * @returns Promise resolving to the upscaled Image
   */
  async upscale(image, scale = 4) {
    const parsed = await parseImage(image);
    return withRetry(async () => {
      try {
        const response = await this.request(`${"https://api.novelai.net"}${"/ai/upscale"}`, {
          image: parsed.base64,
          width: parsed.width,
          height: parsed.height,
          scale
        });
        if (!response.data) {
          throw new Error("Received empty response from the server.");
        }
        const arrayBuffer = await this.getResponseBuffer(response);
        return new Image2({
          filename: createFilename("upscaled"),
          data: await this.unzipSingleImage(arrayBuffer)
        });
      } catch (error) {
        throw this.handleRequestError(error);
      }
    }, this.retryConfig);
  }
  /**
   * Enhance an image — img2img re-generation at a scaled-up resolution,
   * mirroring the web UI's Enhance feature. The target resolution is the
   * source size multiplied by upscaleFactor, clamped to the API's pixel budget.
   *
   * @param image - Image input (path, Blob, File, URL, etc.)
   * @param options - Enhance options plus any generation metadata
   *                  (upscaleFactor default 1.5, strength 0.5, noise 0)
   * @returns Promise resolving to an array of Image objects
   */
  async enhance(image, options = {}) {
    const { upscaleFactor = 1.5, strength = 0.5, noise = 0, ...rest } = options;
    const parsed = await parseImage(image);
    const [width, height] = scaleDimensions(
      parsed.width,
      parsed.height,
      upscaleFactor
    );
    return this.generateImage({
      ...rest,
      action: "img2img",
      image: parsed.base64,
      width,
      height,
      strength,
      noise
    });
  }
  /**
   * Get tag suggestions for a partial tag query
   *
   * @param prompt - The incomplete tag query
   * @param model - The image model to get suggestions for (default: V4.5)
   * @param lang - Query language, "en" or "jp" (default: "en")
   * @returns Promise resolving to an array of tag suggestions
   */
  async suggestTags(prompt, model = "nai-diffusion-4-5-full", lang) {
    const url = new URL(`${this.host}${"/ai/generate-image/suggest-tags"}`);
    url.searchParams.set("model", model);
    url.searchParams.set("prompt", prompt);
    if (lang) url.searchParams.set("lang", lang);
    const result = await withRetry(async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: prepHeaders(this.headers)
      });
      if (!response.ok) {
        throw await apiErrorFromResponse(response);
      }
      return response.json();
    }, this.retryConfig);
    const tags = result?.tags;
    return Array.isArray(tags) ? tags : [];
  }
  /**
   * Encode images to vibe tokens using the /encode-vibe endpoint.
   * Uses caching to avoid unnecessary API calls for previously processed images.
   */
  async encodeVibe(metadata) {
    if (!metadata.model || !isV4Model(metadata.model) || !metadata.reference_image_multiple?.length) {
      return;
    }
    const encoded = [];
    for (let i = 0; i < metadata.reference_image_multiple.length; i++) {
      const refImage = metadata.reference_image_multiple[i];
      if (!isEncodableImage(refImage)) {
        encoded.push(refImage);
        continue;
      }
      const refInfoExtracted = metadata.reference_information_extracted_multiple?.[i] ?? 1;
      const imageHash = await this.getImageHash(refImage);
      const cacheKey = `${imageHash}:${refInfoExtracted}:${metadata.model}`;
      let vibeToken = this.vibeCache.get(cacheKey);
      if (!vibeToken) {
        vibeToken = await this.fetchVibeToken(
          refImage,
          refInfoExtracted,
          metadata.model
        );
        if (this.vibeCache.size >= VIBE_CACHE_LIMIT) {
          this.vibeCache.delete(this.vibeCache.keys().next().value);
        }
        this.vibeCache.set(cacheKey, vibeToken);
      }
      encoded.push(vibeToken);
    }
    metadata.reference_image_multiple = encoded;
    metadata.reference_information_extracted_multiple = void 0;
  }
  /**
   * Fetch vibe token from the API
   */
  async fetchVibeToken(image, informationExtracted, model) {
    try {
      const response = await this.request(
        `${this.host}${"/ai/encode-vibe"}`,
        {
          image,
          information_extracted: informationExtracted,
          model
        }
      );
      const buffer = await this.getResponseBuffer(response);
      return uint8ArrayToBase64(new Uint8Array(buffer));
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }
  /**
   * SHA-256 hash of a base64 image, used as vibe cache key.
   * Uses Web Crypto, available in browsers and Node.js 18+.
   */
  async getImageHash(base64Image) {
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // ---- Text generation (OpenAI-compatible endpoints) ----
  /**
   * Generate a chat completion using NovelAI's text models
   *
   * @param messages - Chat messages, or a plain string treated as a single user message
   * @param options - Generation options (model, max_tokens, temperature, ...)
   * @returns Promise resolving to a ChatCompletion in OpenAI format
   */
  async chat(messages, options = {}) {
    const stream = await this.chatStream(messages, options);
    let id = "";
    let model = "";
    let created = 0;
    let role = "assistant";
    let content = "";
    let finishReason = null;
    let usage;
    for await (const chunk of stream) {
      id = id || chunk.id;
      model = model || chunk.model;
      created = created || chunk.created;
      const choice = chunk.choices?.[0];
      if (choice?.delta?.role) role = choice.delta.role;
      if (choice?.delta?.content) content += choice.delta.content;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      const chunkUsage = chunk.usage;
      if (chunkUsage) usage = chunkUsage;
    }
    return {
      id,
      object: "chat.completion",
      created,
      model,
      choices: [
        { index: 0, message: { role, content }, finish_reason: finishReason }
      ],
      usage
    };
  }
  /**
   * Generate a chat completion, streaming the response chunk by chunk
   *
   * @param messages - Chat messages, or a plain string treated as a single user message
   * @param options - Generation options (model, max_tokens, temperature, ...)
   * @returns AsyncGenerator of ChatCompletionChunk objects in OpenAI format
   */
  async chatStream(messages, options = {}) {
    const body = {
      ...options,
      model: options.model ?? "glm-4-6",
      messages: this.normalizeMessages(messages),
      stream: true
    };
    const response = await withRetry(
      () => this.openStream(`${this.textHost}${"/oa/v1/chat/completions"}`, body),
      this.retryConfig
    );
    return this.parseChatStream(response);
  }
  /**
   * Generate a raw text completion using NovelAI's text models
   *
   * @param prompt - The prompt to continue
   * @param options - Generation options (model, max_tokens, temperature, ...)
   * @returns Promise resolving to a Completion in OpenAI format
   */
  async completion(prompt, options = {}) {
    const body = {
      ...options,
      model: options.model ?? "glm-4-6",
      prompt,
      stream: false
    };
    return this.requestJson(`${this.textHost}${"/oa/v1/completions"}`, body);
  }
  /**
   * List available text generation models
   *
   * @returns Promise resolving to an array of model ids
   */
  async listTextModels() {
    const result = await withRetry(async () => {
      const response = await fetch(
        `${this.textHost}${"/oa/v1/models"}`,
        { method: "GET", headers: prepHeaders(this.headers) }
      );
      if (!response.ok) {
        throw await apiErrorFromResponse(response);
      }
      return response.json();
    }, this.retryConfig);
    const data = result?.data;
    return Array.isArray(data) ? data.map((m) => m.id) : [];
  }
  normalizeMessages(messages) {
    return typeof messages === "string" ? [{ role: "user", content: messages }] : messages;
  }
  /**
   * Parse an OpenAI-style SSE stream into completion chunks
   */
  async *parseChatStream(response) {
    const sse = new SSEStream();
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const event of sse.feed(value)) {
          if (event.data === "[DONE]") return;
          try {
            yield JSON.parse(event.data);
          } catch (error) {
            console.warn("Failed to parse chat stream chunk:", error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  /**
   * Make a JSON request with timeout, retry and error handling
   */
  async requestJson(url, payload) {
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      try {
        if (this.verbose) {
          console.debug(`[Request] ${url}`, JSON.stringify(payload));
        }
        const response = await fetch(url, {
          method: "POST",
          headers: prepHeaders(this.headers),
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (!response.ok) {
          throw await apiErrorFromResponse(response);
        }
        return await response.json();
      } catch (error) {
        throw this.handleRequestError(error);
      } finally {
        clearTimeout(timeoutId);
      }
    }, this.retryConfig);
  }
};

// src-plugins/nekoai/index.ts
var info = {
  id: "nekoai",
  name: "NekoAI Bridge",
  description: "\u901A\u8FC7 NekoAI-JS \u5C06 NovelAI text2image \u5C01\u88C5\u4E3A\u540E\u7AEF API \u7AEF\u70B9, \u4F9B\u9152\u9986\u524D\u7AEF\u811A\u672C\u8C03\u7528\u3002Token \u6765\u81EA\u73AF\u5883\u53D8\u91CF NOVELAI_TOKEN, \u4E5F\u53EF\u5728\u8BF7\u6C42\u4F53\u4E2D\u4F20\u5165 token \u8986\u76D6\u3002"
};
var PLUGIN_VERSION = "1.0.0";
var DEFAULT_TIMEOUT_MS = 12e4;
var SAMPLER_MAP = {
  k_euler: Sampler.EULER,
  k_euler_ancestral: Sampler.EULER_ANC,
  k_dpmpp_2m: Sampler.DPM2M,
  k_dpmpp_sde: Sampler.DPMSDE,
  k_dpmpp_2s_ancestral: Sampler.DPM2S_ANC,
  ddim: Sampler.DDIM,
  k_dpm_fast: void 0
};
var SCHEDULER_MAP = {
  native: Noise.NATIVE,
  karras: Noise.KARRAS,
  exponential: Noise.EXPONENTIAL,
  polyexponential: Noise.POLYEXPONENTIAL
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
function parseGenerateBody(raw) {
  const body = { ...raw };
  const prompt = asString(body.prompt);
  if (!prompt) {
    throw new HttpError(400, "\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 prompt");
  }
  body.prompt = prompt;
  return body;
}
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
  statusCode;
};
function sendError(res, error) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof NovelAIApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
}
function resolveToken(bodyToken) {
  const requestToken = asString(bodyToken);
  if (requestToken) {
    return requestToken;
  }
  return asString(process.env.NOVELAI_TOKEN);
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
    const client = new NovelAI({ token, timeout: DEFAULT_TIMEOUT_MS });
    const sampler = asString(body.sampler);
    const scheduler = asString(body.scheduler);
    const steps = asFiniteNumber(body.steps);
    const scale = asFiniteNumber(body.scale);
    const width = asFiniteNumber(body.width);
    const height = asFiniteNumber(body.height);
    const seed = asFiniteNumber(body.seed);
    const nSamples = asFiniteNumber(body.n_samples);
    const sm = asBoolean(body.sm);
    const smDyn = asBoolean(body.sm_dyn);
    const metadata = {
      prompt: body.prompt
    };
    const negativePrompt = asString(body.negative_prompt);
    if (negativePrompt) {
      metadata.negative_prompt = negativePrompt;
    }
    const model = asString(body.model);
    if (model) {
      metadata.model = model;
    }
    const mappedSampler = sampler ? SAMPLER_MAP[sampler] : void 0;
    if (mappedSampler) {
      metadata.sampler = mappedSampler;
    }
    if (scheduler && SCHEDULER_MAP[scheduler]) {
      metadata.noise_schedule = SCHEDULER_MAP[scheduler];
    }
    if (steps !== void 0 && steps > 0) {
      metadata.steps = Math.min(Math.floor(steps), 50);
    }
    if (scale !== void 0 && scale >= 0) {
      metadata.scale = scale;
    }
    if (width !== void 0 && width > 0) {
      metadata.width = Math.floor(width);
    }
    if (height !== void 0 && height > 0) {
      metadata.height = Math.floor(height);
    }
    if (seed !== void 0 && seed >= 0) {
      metadata.seed = Math.floor(seed);
    }
    if (nSamples !== void 0 && nSamples > 0) {
      metadata.n_samples = Math.min(Math.floor(nSamples), 8);
    }
    if (sm !== void 0) {
      metadata.sm = sm;
    }
    if (smDyn !== void 0) {
      metadata.sm_dyn = smDyn;
    }
    const images = await client.generateImage(metadata);
    res.json({
      images: images.map((image) => ({
        data: image.toBase64(),
        mime: "image/png"
      }))
    });
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
