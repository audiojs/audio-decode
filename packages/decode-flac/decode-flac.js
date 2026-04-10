// ../../node_modules/simple-yenc/dist/esm.js
var t = (t2, n = 4294967295, e2 = 79764919) => {
  const r = new Int32Array(256);
  let o, s, i, c = n;
  for (o = 0; o < 256; o++) {
    for (i = o << 24, s = 8; s > 0; --s) i = 2147483648 & i ? i << 1 ^ e2 : i << 1;
    r[o] = i;
  }
  for (o = 0; o < t2.length; o++) c = c << 8 ^ r[255 & (c >> 24 ^ t2[o])];
  return c;
};
var e = (n, e2 = t) => {
  const r = (t2) => new Uint8Array(t2.length / 2).map(((n2, e3) => parseInt(t2.substring(2 * e3, 2 * (e3 + 1)), 16))), o = (t2) => r(t2)[0], s = /* @__PURE__ */ new Map();
  [, 8364, , 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, , 381, , , 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, , 382, 376].forEach(((t2, n2) => s.set(t2, n2)));
  const i = new Uint8Array(n.length);
  let c, a, l, f = false, g = 0, h = 42, p = n.length > 13 && "dynEncode" === n.substring(0, 9), u = 0;
  p && (u = 11, a = o(n.substring(9, u)), a <= 1 && (u += 2, h = o(n.substring(11, u))), 1 === a && (u += 8, l = ((t2) => new DataView(r(t2).buffer).getInt32(0, true))(n.substring(13, u))));
  const d = 256 - h;
  for (let t2 = u; t2 < n.length; t2++) if (c = n.charCodeAt(t2), 61 !== c || f) {
    if (92 === c && t2 < n.length - 5 && p) {
      const e3 = n.charCodeAt(t2 + 1);
      117 !== e3 && 85 !== e3 || (c = parseInt(n.substring(t2 + 2, t2 + 6), 16), t2 += 5);
    }
    if (c > 255) {
      const t3 = s.get(c);
      t3 && (c = t3 + 127);
    }
    f && (f = false, c -= 64), i[g++] = c < h && c > 0 ? c + d : c - h;
  } else f = true;
  const m = i.subarray(0, g);
  if (p && 1 === a) {
    const t2 = e2(m);
    if (t2 !== l) {
      const n2 = "Decode failed crc32 validation";
      throw console.error("`simple-yenc`\n", n2 + "\n", "Expected: " + l + "; Got: " + t2 + "\n", "Visit https://github.com/eshaz/simple-yenc for more information"), Error(n2);
    }
  }
  return m;
};

// ../../node_modules/@wasm-audio-decoders/common/src/WASMAudioDecoderCommon.js
function WASMAudioDecoderCommon() {
  const uint8Array2 = Uint8Array;
  const float32Array = Float32Array;
  if (!WASMAudioDecoderCommon.modules) {
    Object.defineProperties(WASMAudioDecoderCommon, {
      modules: {
        value: /* @__PURE__ */ new WeakMap()
      },
      setModule: {
        value(Ref, module) {
          WASMAudioDecoderCommon.modules.set(Ref, Promise.resolve(module));
        }
      },
      getModule: {
        value(Ref, wasmString) {
          let module = WASMAudioDecoderCommon.modules.get(Ref);
          if (!module) {
            if (!wasmString) {
              wasmString = Ref.wasm;
              module = WASMAudioDecoderCommon.inflateDynEncodeString(
                wasmString
              ).then((data3) => WebAssembly.compile(data3));
            } else {
              module = WebAssembly.compile(e(wasmString));
            }
            WASMAudioDecoderCommon.modules.set(Ref, module);
          }
          return module;
        }
      },
      concatFloat32: {
        value(buffers, length2) {
          let ret = new float32Array(length2), i = 0, offset = 0;
          while (i < buffers.length) {
            ret.set(buffers[i], offset);
            offset += buffers[i++].length;
          }
          return ret;
        }
      },
      getDecodedAudio: {
        value: (errors, channelData, samplesDecoded, sampleRate2, bitDepth2) => ({
          errors,
          channelData,
          samplesDecoded,
          sampleRate: sampleRate2,
          bitDepth: bitDepth2
        })
      },
      getDecodedAudioMultiChannel: {
        value(errors, input, channelsDecoded, samplesDecoded, sampleRate2, bitDepth2) {
          let channelData = [], i, j;
          for (i = 0; i < channelsDecoded; i++) {
            const channel2 = [];
            for (j = 0; j < input.length; ) channel2.push(input[j++][i] || []);
            channelData.push(
              WASMAudioDecoderCommon.concatFloat32(channel2, samplesDecoded)
            );
          }
          return WASMAudioDecoderCommon.getDecodedAudio(
            errors,
            channelData,
            samplesDecoded,
            sampleRate2,
            bitDepth2
          );
        }
      },
      /*
       ******************
       * Compression Code
       ******************
       */
      inflateDynEncodeString: {
        value(source) {
          source = e(source);
          return new Promise((resolve) => {
            const puffString = String.raw`dynEncode012804c7886d()((()>+*§§)§,§§§§)§+§§§)§+.-()(*)-+)(.7*§)i¸¸,3§(i¸¸,3/G+.¡*(,(,3+)2å:-),§H(P*DI*H(P*@I++hH)H*r,hH(H(P*<J,i)^*<H,H(P*4U((I-H(H*i0J,^*DH+H-H*I+H,I*4)33H(H*H)^*DH(H+H)^*@H+i§H)i§3æ*).§K(iHI/+§H,iHn,§H+i(H+i(rCJ0I,H*I-+hH,,hH(H-V)(i)J.H.W)(i)c)(H,i)I,H-i*I-4)33i(I.*hH(V)(H+n5(H(i*I-i(I,i)I.+hH,i*J+iHn,hi(I-i*I,+hH,H/H-c)(H,iFn,hi(I,+hH,H0n5-H*V)(J(,hH/H(i)J(H(V)(J(i)c)(H)H(i)H,c)(3H*i*I*H,i)I,4(3(-H(H,W)(H-I-H,i*I,4)3(3(3H,H-I1H+I,H.i)H1V)(J.i(v5(33H.-H(H,i(c)(H,i*I,4)333)-§i*I*+§H*iHn,hi73H,H(i)8(H+J+H)P*(H*V)(J-r,§H)P*,H.i)H+H,i)V)(-H*i*I*H+i)I+H-H.I.H,H-i)I,4)333Ã+)-§iø7i(^*(iü7I,*h+hH+iDn,h*hilI+i)I,+hH+,hH+iô7H,c)(i)H+i´8W)(H,I,H+i*I+4)-+hH(H)8*J-i(p5.*h*h*hH-i')u,hH(P*(J+,hH(P*0J,H(P*,n50H+H,H-b((3H(P*0i)I.4)3H-i¨*n5*H-iÅ*s,hi73H-i)J+V)&+I,H(H+V)æ,8(I.H(H*8*J-i(p51H-i)J+i¸7V)(H(H+iø7V)(8(J/H(P*0J+s,hi73H+H,H.J,I.H(P*(m5(H.H(P*,s5.+hH,m5*H(P*(J.H+H.H+H/U((b((H(H(P*0i)J+^*0H,i)I,4(3(3H(H.^*03H-i¨*o5)33i(73(3(3-H,H+i)c)(H,i*I,H+i)I+4)33i)I-3H-3!2)0§K(i2J,L(H,H(^*(H,H*^*4H,i(^*0H,i(^*DH,j(_*<H,H)P*(^*,H,H+P*(^*8*h*h+hH,i)8(I3i§I**h*h*h*h*h*h*hH,i*8(6+(),03H,j(_*@i*I-H,P*<J.i,J(H,P*8J/s50H,H.i+J0^*<i¦I*H.H,P*4J1J.U(*H.U((J2i')o5/H.U()I.H,H(^*<H0H1U((H.i0J.i§i0i')o5/H/H.H2J*H(J.q50H,P*0J/H*I-H,P*(J0,hH,P*,H-q,hi)I-423+hH*m5+H/H0H(H1U((b((H/i)I/H(i)I(H*i)I*4(3(3H,H.^*<H,H-^*04*3iØ1U((5+i(I(i¨7i1^*(i$6iè1^*(i°7iè6^*(i¬7iÈ6^*(+hH(iÈ*n,hiÈ*I(+hH(i¨,n,hi¨,I(+hH(iØ,n,hiØ,I(+hH(iè,o,hH,i-H(i0c)(H(i*I(4)33iè1i1H,i-iÈ*8)Bi(I(+hH(ido,hH,i-H(i-c)(H(i*I(4)33iÈ6iè6H,i-iF8)BiØ1i)b((41-H,i-H(i/c)(H(i*I(4)3(3(-H,i-H(i1c)(H(i*I(4)3(3(-H,i-H(i0c)(H(i*I(4)3(3(3H,H/^*0H,H(^*<3i(I*4*3H,H,i¸)^*TH,H,iø-^*PH,H,iX^*LH,H,i(^*HH,i-8(I(H,i-8(I-i¥I*H,i,8(I.H(iErH-iEr5)H(i©*I1H-i)I0i(i;H.i,J(i(H(i(rCJ(J*H*i;sCI*i¨1I-H(I/+hH/,hH,i-H-V)(i)H,i+8(c)(H/i)I/H-i*I-H*i)I*4)-H(i)i¨1I/+hH(H*o,hH,i-H/V)(i)i(c)(H/i*I/H(i)I(4)33i¤I*H,iø-H,i¸)H,i-i;8)5+H0H1I2i(I-+hH-H2p,hH,H,iP8*J*i(p5-H*i7u,hH,i-H-i)H*c)(H-i)I-4*3i(I/i+I.i+I(*h*h*hH*i86*(*)3H-m,hi£I*403H-i)H,W)-I/i*I(4)3i3I.i/I(3H2H,H(8(H.J(H-J.p,hi¢I*4.3H,i-H-i)I*+hH(,hH*H/c)(H*i*I*H(i)I(4)-H.I-4+3(3(33H,W)1m,hiI*4,3H,iø-H,i¸)H,i-H18)J(,hi¡I*H(i(p5,H1H,V)ú-H,V)ø-o5,3H,i(H,iXH,i-H1i)H08)J(,hi I*H(i(p5,H0H,V)H,V)o5,3H,H,iPH,iH8+I*4+3(3(3H,i$6i¬78+I*3H*H3m5(3i)I-H*i(r5)3H)H,P*0^*(H+H,P*<^*(H*I-3H,i2L(H-33Á)+(i¨03b+(,(-(.(/(0(1(2(3(5(7(9(;(?(C(G(K(S([(c(k({(((«(Ë(ë((*)(iø03O)()()()(*(*(*(*(+(+(+(+(,(,(,(,(-(-(-(-(i¨13M8(9(:(((0(/(1(.(2(-(3(,(4(+(5(*(6()(7(T7*S7US0U `;
            WASMAudioDecoderCommon.getModule(WASMAudioDecoderCommon, puffString).then((wasm) => WebAssembly.instantiate(wasm, {})).then(({ exports }) => {
              const instanceExports = new Map(Object.entries(exports));
              const puff = instanceExports.get("puff");
              const memory = instanceExports.get("memory")["buffer"];
              const dataArray = new uint8Array2(memory);
              const heapView = new DataView(memory);
              let heapPos = instanceExports.get("__heap_base");
              const sourceLength = source.length;
              const sourceLengthPtr = heapPos;
              heapPos += 4;
              heapView.setInt32(sourceLengthPtr, sourceLength, true);
              const sourcePtr = heapPos;
              heapPos += sourceLength;
              dataArray.set(source, sourcePtr);
              const destLengthPtr = heapPos;
              heapPos += 4;
              heapView.setInt32(
                destLengthPtr,
                dataArray.byteLength - heapPos,
                true
              );
              puff(heapPos, destLengthPtr, sourcePtr, sourceLengthPtr);
              resolve(
                dataArray.slice(
                  heapPos,
                  heapPos + heapView.getInt32(destLengthPtr, true)
                )
              );
            });
          });
        }
      }
    });
  }
  Object.defineProperty(this, "wasm", {
    enumerable: true,
    get: () => this._wasm
  });
  this.getOutputChannels = (outputData, channelsDecoded, samplesDecoded) => {
    let output = [], i = 0;
    while (i < channelsDecoded)
      output.push(
        outputData.slice(
          i * samplesDecoded,
          i++ * samplesDecoded + samplesDecoded
        )
      );
    return output;
  };
  this.allocateTypedArray = (len, TypedArray, setPointer = true) => {
    const ptr = this._wasm.malloc(TypedArray.BYTES_PER_ELEMENT * len);
    if (setPointer) this._pointers.add(ptr);
    return {
      ptr,
      len,
      buf: new TypedArray(this._wasm.HEAP, ptr, len)
    };
  };
  this.free = () => {
    this._pointers.forEach((ptr) => {
      this._wasm.free(ptr);
    });
    this._pointers.clear();
  };
  this.codeToString = (ptr) => {
    const characters = [], heap = new Uint8Array(this._wasm.HEAP);
    for (let character = heap[ptr]; character !== 0; character = heap[++ptr])
      characters.push(character);
    return String.fromCharCode.apply(null, characters);
  };
  this.addError = (errors, message, frameLength2, frameNumber2, inputBytes, outputSamples) => {
    errors.push({
      message,
      frameLength: frameLength2,
      frameNumber: frameNumber2,
      inputBytes,
      outputSamples
    });
  };
  this.instantiate = (_EmscriptenWASM, _module) => {
    if (_module) WASMAudioDecoderCommon.setModule(_EmscriptenWASM, _module);
    this._wasm = new _EmscriptenWASM(WASMAudioDecoderCommon).instantiate();
    this._pointers = /* @__PURE__ */ new Set();
    return this._wasm.ready.then(() => this);
  };
}

// ../_build/empty-worker.js
var empty_worker_default = null;

// ../../node_modules/@wasm-audio-decoders/common/src/WASMAudioDecoderWorker.js
var getWorker = () => globalThis.Worker || empty_worker_default;
var WASMAudioDecoderWorker = class extends getWorker() {
  constructor(options, name, Decoder2, EmscriptenWASM2) {
    if (!WASMAudioDecoderCommon.modules) new WASMAudioDecoderCommon();
    let source = WASMAudioDecoderCommon.modules.get(Decoder2);
    if (!source) {
      let type = "text/javascript", isNode, webworkerSourceCode = `'use strict';(${((_Decoder, _WASMAudioDecoderCommon, _EmscriptenWASM) => {
        let decoder2, moduleResolve, modulePromise = new Promise((resolve) => {
          moduleResolve = resolve;
        });
        self.onmessage = ({ data: { id, command, data: data3 } }) => {
          let messagePromise = modulePromise, messagePayload = { id }, transferList;
          if (command === "init") {
            Object.defineProperties(_Decoder, {
              WASMAudioDecoderCommon: { value: _WASMAudioDecoderCommon },
              EmscriptenWASM: { value: _EmscriptenWASM },
              module: { value: data3.module },
              isWebWorker: { value: true }
            });
            decoder2 = new _Decoder(data3.options);
            moduleResolve();
          } else if (command === "free") {
            decoder2.free();
          } else if (command === "ready") {
            messagePromise = messagePromise.then(() => decoder2.ready);
          } else if (command === "reset") {
            messagePromise = messagePromise.then(() => decoder2.reset());
          } else {
            Object.assign(
              messagePayload,
              decoder2[command](
                // detach buffers
                Array.isArray(data3) ? data3.map((data4) => new Uint8Array(data4)) : new Uint8Array(data3)
              )
            );
            transferList = messagePayload.channelData ? messagePayload.channelData.map((channel2) => channel2.buffer) : [];
          }
          messagePromise.then(
            () => self.postMessage(messagePayload, transferList)
          );
        };
      }).toString()})(${Decoder2}, ${WASMAudioDecoderCommon}, ${EmscriptenWASM2})`;
      try {
        isNode = typeof process.versions.node !== "undefined";
      } catch {
      }
      source = isNode ? `data:${type};base64,${Buffer.from(webworkerSourceCode).toString(
        "base64"
      )}` : URL.createObjectURL(new Blob([webworkerSourceCode], { type }));
      WASMAudioDecoderCommon.modules.set(Decoder2, source);
    }
    super(source, { name });
    this._id = Number.MIN_SAFE_INTEGER;
    this._enqueuedOperations = /* @__PURE__ */ new Map();
    this.onmessage = ({ data: data3 }) => {
      const { id, ...rest } = data3;
      this._enqueuedOperations.get(id)(rest);
      this._enqueuedOperations.delete(id);
    };
    new EmscriptenWASM2(WASMAudioDecoderCommon).getModule().then((module) => {
      this.postToDecoder("init", { module, options });
    });
  }
  async postToDecoder(command, data3) {
    return new Promise((resolve) => {
      this.postMessage({
        command,
        id: this._id,
        data: data3
      });
      this._enqueuedOperations.set(this._id++, resolve);
    });
  }
  get ready() {
    return this.postToDecoder("ready");
  }
  async free() {
    await this.postToDecoder("free").finally(() => {
      this.terminate();
    });
  }
  async reset() {
    await this.postToDecoder("reset");
  }
};

// ../../node_modules/@wasm-audio-decoders/common/src/utilities.js
var assignNames = (Class, name) => {
  Object.defineProperty(Class, "name", { value: name });
};

// ../../node_modules/codec-parser/src/constants.js
var symbol = Symbol;
var mappingJoin = ", ";
var channelMappings = (() => {
  const front = "front";
  const side = "side";
  const rear = "rear";
  const left = "left";
  const center = "center";
  const right = "right";
  return ["", front + " ", side + " ", rear + " "].map(
    (x) => [
      [left, right],
      [left, right, center],
      [left, center, right],
      [center, left, right],
      [center]
    ].flatMap((y) => y.map((z) => x + z).join(mappingJoin))
  );
})();
var lfe = "LFE";
var monophonic = "monophonic (mono)";
var stereo = "stereo";
var surround = "surround";
var getChannelMapping = (channelCount, ...mappings) => `${[
  monophonic,
  stereo,
  `linear ${surround}`,
  "quadraphonic",
  `5.0 ${surround}`,
  `5.1 ${surround}`,
  `6.1 ${surround}`,
  `7.1 ${surround}`
][channelCount - 1]} (${mappings.join(mappingJoin)})`;
var vorbisOpusChannelMapping = [
  monophonic,
  getChannelMapping(2, channelMappings[0][0]),
  getChannelMapping(3, channelMappings[0][2]),
  getChannelMapping(4, channelMappings[1][0], channelMappings[3][0]),
  getChannelMapping(5, channelMappings[1][2], channelMappings[3][0]),
  getChannelMapping(6, channelMappings[1][2], channelMappings[3][0], lfe),
  getChannelMapping(7, channelMappings[1][2], channelMappings[2][0], channelMappings[3][4], lfe),
  getChannelMapping(8, channelMappings[1][2], channelMappings[2][0], channelMappings[3][0], lfe)
];
var rate192000 = 192e3;
var rate176400 = 176400;
var rate96000 = 96e3;
var rate88200 = 88200;
var rate64000 = 64e3;
var rate48000 = 48e3;
var rate44100 = 44100;
var rate32000 = 32e3;
var rate24000 = 24e3;
var rate22050 = 22050;
var rate16000 = 16e3;
var rate12000 = 12e3;
var rate11025 = 11025;
var rate8000 = 8e3;
var rate7350 = 7350;
var absoluteGranulePosition = "absoluteGranulePosition";
var bandwidth = "bandwidth";
var bitDepth = "bitDepth";
var bitrate = "bitrate";
var bitrateMaximum = bitrate + "Maximum";
var bitrateMinimum = bitrate + "Minimum";
var bitrateNominal = bitrate + "Nominal";
var buffer = "buffer";
var bufferFullness = buffer + "Fullness";
var codec = "codec";
var codecFrames = codec + "Frames";
var coupledStreamCount = "coupledStreamCount";
var crc = "crc";
var crc16 = crc + "16";
var crc32 = crc + "32";
var data = "data";
var description = "description";
var duration = "duration";
var emphasis = "emphasis";
var hasOpusPadding = "hasOpusPadding";
var header = "header";
var isContinuedPacket = "isContinuedPacket";
var isCopyrighted = "isCopyrighted";
var isFirstPage = "isFirstPage";
var isHome = "isHome";
var isLastPage = "isLastPage";
var isOriginal = "isOriginal";
var isPrivate = "isPrivate";
var isVbr = "isVbr";
var layer = "layer";
var length = "length";
var mode = "mode";
var modeExtension = mode + "Extension";
var mpeg = "mpeg";
var mpegVersion = mpeg + "Version";
var numberAACFrames = "numberAACFrames";
var outputGain = "outputGain";
var preSkip = "preSkip";
var profile = "profile";
var profileBits = symbol();
var protection = "protection";
var rawData = "rawData";
var segments = "segments";
var subarray = "subarray";
var version = "version";
var vorbis = "vorbis";
var vorbisComments = vorbis + "Comments";
var vorbisSetup = vorbis + "Setup";
var block = "block";
var blockingStrategy = block + "ingStrategy";
var blockingStrategyBits = symbol();
var blockSize = block + "Size";
var blocksize0 = block + "size0";
var blocksize1 = block + "size1";
var blockSizeBits = symbol();
var channel = "channel";
var channelMappingFamily = channel + "MappingFamily";
var channelMappingTable = channel + "MappingTable";
var channelMode = channel + "Mode";
var channelModeBits = symbol();
var channels = channel + "s";
var copyright = "copyright";
var copyrightId = copyright + "Id";
var copyrightIdStart = copyright + "IdStart";
var frame = "frame";
var frameCount = frame + "Count";
var frameLength = frame + "Length";
var Number2 = "Number";
var frameNumber = frame + Number2;
var framePadding = frame + "Padding";
var frameSize = frame + "Size";
var Rate = "Rate";
var inputSampleRate = "inputSample" + Rate;
var page = "page";
var pageChecksum = page + "Checksum";
var pageSegmentBytes = symbol();
var pageSegmentTable = page + "SegmentTable";
var pageSequenceNumber = page + "Sequence" + Number2;
var sample = "sample";
var sampleNumber = sample + Number2;
var sampleRate = sample + Rate;
var sampleRateBits = symbol();
var samples = sample + "s";
var stream = "stream";
var streamCount = stream + "Count";
var streamInfo = stream + "Info";
var streamSerialNumber = stream + "Serial" + Number2;
var streamStructureVersion = stream + "StructureVersion";
var total = "total";
var totalBytesOut = total + "BytesOut";
var totalDuration = total + "Duration";
var totalSamples = total + "Samples";
var readRawData = symbol();
var incrementRawData = symbol();
var mapCodecFrameStats = symbol();
var mapFrameStats = symbol();
var logWarning = symbol();
var logError2 = symbol();
var syncFrame = symbol();
var fixedLengthFrameSync = symbol();
var getHeader = symbol();
var setHeader = symbol();
var getFrame = symbol();
var parseFrame = symbol();
var parseOggPage = symbol();
var checkCodecUpdate = symbol();
var reset = symbol();
var enable = symbol();
var getHeaderFromUint8Array = symbol();
var checkFrameFooterCrc16 = symbol();
var uint8Array = Uint8Array;
var dataView = DataView;
var reserved = "reserved";
var bad = "bad";
var free = "free";
var none = "none";
var sixteenBitCRC = "16bit CRC";

// ../../node_modules/codec-parser/src/utilities.js
var getCrcTable = (crcTable, crcInitialValueFunction, crcFunction) => {
  for (let byte = 0; byte < crcTable[length]; byte++) {
    let crc2 = crcInitialValueFunction(byte);
    for (let bit = 8; bit > 0; bit--) crc2 = crcFunction(crc2);
    crcTable[byte] = crc2;
  }
  return crcTable;
};
var crc8Table = getCrcTable(
  new uint8Array(256),
  (b) => b,
  (crc2) => crc2 & 128 ? 7 ^ crc2 << 1 : crc2 << 1
);
var flacCrc16Table = [
  getCrcTable(
    new Uint16Array(256),
    (b) => b << 8,
    (crc2) => crc2 << 1 ^ (crc2 & 1 << 15 ? 32773 : 0)
  )
];
var crc32Table = [
  getCrcTable(
    new Uint32Array(256),
    (b) => b,
    (crc2) => crc2 >>> 1 ^ (crc2 & 1) * 3988292384
  )
];
for (let i = 0; i < 15; i++) {
  flacCrc16Table.push(new Uint16Array(256));
  crc32Table.push(new Uint32Array(256));
  for (let j = 0; j <= 255; j++) {
    flacCrc16Table[i + 1][j] = flacCrc16Table[0][flacCrc16Table[i][j] >>> 8] ^ flacCrc16Table[i][j] << 8;
    crc32Table[i + 1][j] = crc32Table[i][j] >>> 8 ^ crc32Table[0][crc32Table[i][j] & 255];
  }
}
var crc8 = (data3) => {
  let crc2 = 0;
  const dataLength = data3[length];
  for (let i = 0; i !== dataLength; i++) crc2 = crc8Table[crc2 ^ data3[i]];
  return crc2;
};
var flacCrc16 = (data3) => {
  const dataLength = data3[length];
  const crcChunkSize = dataLength - 16;
  let crc2 = 0;
  let i = 0;
  while (i <= crcChunkSize) {
    crc2 ^= data3[i++] << 8 | data3[i++];
    crc2 = flacCrc16Table[15][crc2 >> 8] ^ flacCrc16Table[14][crc2 & 255] ^ flacCrc16Table[13][data3[i++]] ^ flacCrc16Table[12][data3[i++]] ^ flacCrc16Table[11][data3[i++]] ^ flacCrc16Table[10][data3[i++]] ^ flacCrc16Table[9][data3[i++]] ^ flacCrc16Table[8][data3[i++]] ^ flacCrc16Table[7][data3[i++]] ^ flacCrc16Table[6][data3[i++]] ^ flacCrc16Table[5][data3[i++]] ^ flacCrc16Table[4][data3[i++]] ^ flacCrc16Table[3][data3[i++]] ^ flacCrc16Table[2][data3[i++]] ^ flacCrc16Table[1][data3[i++]] ^ flacCrc16Table[0][data3[i++]];
  }
  while (i !== dataLength)
    crc2 = (crc2 & 255) << 8 ^ flacCrc16Table[0][crc2 >> 8 ^ data3[i++]];
  return crc2;
};
var crc32Function = (data3) => {
  const dataLength = data3[length];
  const crcChunkSize = dataLength - 16;
  let crc2 = 0;
  let i = 0;
  while (i <= crcChunkSize)
    crc2 = crc32Table[15][(data3[i++] ^ crc2) & 255] ^ crc32Table[14][(data3[i++] ^ crc2 >>> 8) & 255] ^ crc32Table[13][(data3[i++] ^ crc2 >>> 16) & 255] ^ crc32Table[12][data3[i++] ^ crc2 >>> 24] ^ crc32Table[11][data3[i++]] ^ crc32Table[10][data3[i++]] ^ crc32Table[9][data3[i++]] ^ crc32Table[8][data3[i++]] ^ crc32Table[7][data3[i++]] ^ crc32Table[6][data3[i++]] ^ crc32Table[5][data3[i++]] ^ crc32Table[4][data3[i++]] ^ crc32Table[3][data3[i++]] ^ crc32Table[2][data3[i++]] ^ crc32Table[1][data3[i++]] ^ crc32Table[0][data3[i++]];
  while (i !== dataLength)
    crc2 = crc32Table[0][(crc2 ^ data3[i++]) & 255] ^ crc2 >>> 8;
  return crc2 ^ -1;
};
var concatBuffers = (...buffers) => {
  const buffer2 = new uint8Array(
    buffers.reduce((acc, buf) => acc + buf[length], 0)
  );
  buffers.reduce((offset, buf) => {
    buffer2.set(buf, offset);
    return offset + buf[length];
  }, 0);
  return buffer2;
};
var bytesToString = (bytes) => String.fromCharCode(...bytes);
var reverseTable = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
var reverse = (val) => reverseTable[val & 15] << 4 | reverseTable[val >> 4];
var BitReader = class {
  constructor(data3) {
    this._data = data3;
    this._pos = data3[length] * 8;
  }
  set position(position) {
    this._pos = position;
  }
  get position() {
    return this._pos;
  }
  read(bits) {
    const byte = Math.floor(this._pos / 8);
    const bit = this._pos % 8;
    this._pos -= bits;
    const window = (reverse(this._data[byte - 1]) << 8) + reverse(this._data[byte]);
    return window >> 7 - bit & 255;
  }
};
var readInt64le = (view, offset) => {
  try {
    return view.getBigInt64(offset, true);
  } catch {
    const sign = view.getUint8(offset + 7) & 128 ? -1 : 1;
    let firstPart = view.getUint32(offset, true);
    let secondPart = view.getUint32(offset + 4, true);
    if (sign === -1) {
      firstPart = ~firstPart + 1;
      secondPart = ~secondPart + 1;
    }
    if (secondPart > 1048575) {
      console.warn("This platform does not support BigInt");
    }
    return sign * (firstPart + secondPart * 2 ** 32);
  }
};

// ../../node_modules/codec-parser/src/codecs/HeaderCache.js
var HeaderCache = class {
  constructor(onCodecHeader, onCodecUpdate) {
    this._onCodecHeader = onCodecHeader;
    this._onCodecUpdate = onCodecUpdate;
    this[reset]();
  }
  [enable]() {
    this._isEnabled = true;
  }
  [reset]() {
    this._headerCache = /* @__PURE__ */ new Map();
    this._codecUpdateData = /* @__PURE__ */ new WeakMap();
    this._codecHeaderSent = false;
    this._codecShouldUpdate = false;
    this._bitrate = null;
    this._isEnabled = false;
  }
  [checkCodecUpdate](bitrate2, totalDuration2) {
    if (this._onCodecUpdate) {
      if (this._bitrate !== bitrate2) {
        this._bitrate = bitrate2;
        this._codecShouldUpdate = true;
      }
      const codecData = this._codecUpdateData.get(
        this._headerCache.get(this._currentHeader)
      );
      if (this._codecShouldUpdate && codecData) {
        this._onCodecUpdate(
          {
            bitrate: bitrate2,
            ...codecData
          },
          totalDuration2
        );
      }
      this._codecShouldUpdate = false;
    }
  }
  [getHeader](key) {
    const header2 = this._headerCache.get(key);
    if (header2) {
      this._updateCurrentHeader(key);
    }
    return header2;
  }
  [setHeader](key, header2, codecUpdateFields) {
    if (this._isEnabled) {
      if (!this._codecHeaderSent) {
        this._onCodecHeader({ ...header2 });
        this._codecHeaderSent = true;
      }
      this._updateCurrentHeader(key);
      this._headerCache.set(key, header2);
      this._codecUpdateData.set(header2, codecUpdateFields);
    }
  }
  _updateCurrentHeader(key) {
    if (this._onCodecUpdate && key !== this._currentHeader) {
      this._codecShouldUpdate = true;
      this._currentHeader = key;
    }
  }
};

// ../../node_modules/codec-parser/src/globals.js
var headerStore = /* @__PURE__ */ new WeakMap();
var frameStore = /* @__PURE__ */ new WeakMap();

// ../../node_modules/codec-parser/src/codecs/Parser.js
var Parser = class {
  constructor(codecParser, headerCache) {
    this._codecParser = codecParser;
    this._headerCache = headerCache;
  }
  *[syncFrame]() {
    let frameData;
    do {
      frameData = yield* this.Frame[getFrame](
        this._codecParser,
        this._headerCache,
        0
      );
      if (frameData) return frameData;
      this._codecParser[incrementRawData](1);
    } while (true);
  }
  /**
   * @description Searches for Frames within bytes containing a sequence of known codec frames.
   * @param {boolean} ignoreNextFrame Set to true to return frames even if the next frame may not exist at the expected location
   * @returns {Frame}
   */
  *[fixedLengthFrameSync](ignoreNextFrame) {
    let frameData = yield* this[syncFrame]();
    const frameLength2 = frameStore.get(frameData)[length];
    if (ignoreNextFrame || this._codecParser._flushing || // check if there is a frame right after this one
    (yield* this.Header[getHeader](
      this._codecParser,
      this._headerCache,
      frameLength2
    ))) {
      this._headerCache[enable]();
      this._codecParser[incrementRawData](frameLength2);
      this._codecParser[mapFrameStats](frameData);
      return frameData;
    }
    this._codecParser[logWarning](
      `Missing ${frame} at ${frameLength2} bytes from current position.`,
      `Dropping current ${frame} and trying again.`
    );
    this._headerCache[reset]();
    this._codecParser[incrementRawData](1);
  }
};

// ../../node_modules/codec-parser/src/containers/Frame.js
var Frame = class {
  constructor(headerValue, dataValue) {
    frameStore.set(this, { [header]: headerValue });
    this[data] = dataValue;
  }
};

// ../../node_modules/codec-parser/src/codecs/CodecFrame.js
var CodecFrame = class extends Frame {
  static *[getFrame](Header, Frame2, codecParser, headerCache, readOffset) {
    const headerValue = yield* Header[getHeader](
      codecParser,
      headerCache,
      readOffset
    );
    if (headerValue) {
      const frameLengthValue = headerStore.get(headerValue)[frameLength];
      const samplesValue = headerStore.get(headerValue)[samples];
      const frame2 = (yield* codecParser[readRawData](
        frameLengthValue,
        readOffset
      ))[subarray](0, frameLengthValue);
      return new Frame2(headerValue, frame2, samplesValue);
    } else {
      return null;
    }
  }
  constructor(headerValue, dataValue, samplesValue) {
    super(headerValue, dataValue);
    this[header] = headerValue;
    this[samples] = samplesValue;
    this[duration] = samplesValue / headerValue[sampleRate] * 1e3;
    this[frameNumber] = null;
    this[totalBytesOut] = null;
    this[totalSamples] = null;
    this[totalDuration] = null;
    frameStore.get(this)[length] = dataValue[length];
  }
};

// ../../node_modules/codec-parser/src/metadata/ID3v2.js
var unsynchronizationFlag = "unsynchronizationFlag";
var extendedHeaderFlag = "extendedHeaderFlag";
var experimentalFlag = "experimentalFlag";
var footerPresent = "footerPresent";
var ID3v2 = class _ID3v2 {
  static *getID3v2Header(codecParser, headerCache, readOffset) {
    const headerLength = 10;
    const header2 = {};
    let data3 = yield* codecParser[readRawData](3, readOffset);
    if (data3[0] !== 73 || data3[1] !== 68 || data3[2] !== 51) return null;
    data3 = yield* codecParser[readRawData](headerLength, readOffset);
    header2[version] = `id3v2.${data3[3]}.${data3[4]}`;
    if (data3[5] & 15) return null;
    header2[unsynchronizationFlag] = !!(data3[5] & 128);
    header2[extendedHeaderFlag] = !!(data3[5] & 64);
    header2[experimentalFlag] = !!(data3[5] & 32);
    header2[footerPresent] = !!(data3[5] & 16);
    if (data3[6] & 128 || data3[7] & 128 || data3[8] & 128 || data3[9] & 128)
      return null;
    const dataLength = data3[6] << 21 | data3[7] << 14 | data3[8] << 7 | data3[9];
    header2[length] = headerLength + dataLength;
    return new _ID3v2(header2);
  }
  constructor(header2) {
    this[version] = header2[version];
    this[unsynchronizationFlag] = header2[unsynchronizationFlag];
    this[extendedHeaderFlag] = header2[extendedHeaderFlag];
    this[experimentalFlag] = header2[experimentalFlag];
    this[footerPresent] = header2[footerPresent];
    this[length] = header2[length];
  }
};

// ../../node_modules/codec-parser/src/codecs/CodecHeader.js
var CodecHeader = class {
  /**
   * @private
   */
  constructor(header2) {
    headerStore.set(this, header2);
    this[bitDepth] = header2[bitDepth];
    this[bitrate] = null;
    this[channels] = header2[channels];
    this[channelMode] = header2[channelMode];
    this[sampleRate] = header2[sampleRate];
  }
};

// ../../node_modules/codec-parser/src/codecs/mpeg/MPEGHeader.js
var bitrateMatrix = {
  // bits | V1,L1 | V1,L2 | V1,L3 | V2,L1 | V2,L2 & L3
  0: [free, free, free, free, free],
  16: [32, 32, 32, 32, 8],
  // 0b00100000: [64,   48,  40,  48,  16,],
  // 0b00110000: [96,   56,  48,  56,  24,],
  // 0b01000000: [128,  64,  56,  64,  32,],
  // 0b01010000: [160,  80,  64,  80,  40,],
  // 0b01100000: [192,  96,  80,  96,  48,],
  // 0b01110000: [224, 112,  96, 112,  56,],
  // 0b10000000: [256, 128, 112, 128,  64,],
  // 0b10010000: [288, 160, 128, 144,  80,],
  // 0b10100000: [320, 192, 160, 160,  96,],
  // 0b10110000: [352, 224, 192, 176, 112,],
  // 0b11000000: [384, 256, 224, 192, 128,],
  // 0b11010000: [416, 320, 256, 224, 144,],
  // 0b11100000: [448, 384, 320, 256, 160,],
  240: [bad, bad, bad, bad, bad]
};
var calcBitrate = (idx, interval, intervalOffset) => 8 * ((idx + intervalOffset) % interval + interval) * (1 << (idx + intervalOffset) / interval) - 8 * interval * (interval / 8 | 0);
for (let i = 2; i < 15; i++)
  bitrateMatrix[i << 4] = [
    i * 32,
    //                V1,L1
    calcBitrate(i, 4, 0),
    //  V1,L2
    calcBitrate(i, 4, -1),
    // V1,L3
    calcBitrate(i, 8, 4),
    //  V2,L1
    calcBitrate(i, 8, 0)
    //  V2,L2 & L3
  ];
var v1Layer1 = 0;
var v1Layer2 = 1;
var v1Layer3 = 2;
var v2Layer1 = 3;
var v2Layer23 = 4;
var bands = "bands ";
var to31 = " to 31";
var layer12ModeExtensions = {
  0: bands + 4 + to31,
  16: bands + 8 + to31,
  32: bands + 12 + to31,
  48: bands + 16 + to31
};
var bitrateIndex = "bitrateIndex";
var v2 = "v2";
var v1 = "v1";
var intensityStereo = "Intensity stereo ";
var msStereo = ", MS stereo ";
var on = "on";
var off = "off";
var layer3ModeExtensions = {
  0: intensityStereo + off + msStereo + off,
  16: intensityStereo + on + msStereo + off,
  32: intensityStereo + off + msStereo + on,
  48: intensityStereo + on + msStereo + on
};
var layersValues = {
  0: { [description]: reserved },
  2: {
    [description]: "Layer III",
    [framePadding]: 1,
    [modeExtension]: layer3ModeExtensions,
    [v1]: {
      [bitrateIndex]: v1Layer3,
      [samples]: 1152
    },
    [v2]: {
      [bitrateIndex]: v2Layer23,
      [samples]: 576
    }
  },
  4: {
    [description]: "Layer II",
    [framePadding]: 1,
    [modeExtension]: layer12ModeExtensions,
    [samples]: 1152,
    [v1]: {
      [bitrateIndex]: v1Layer2
    },
    [v2]: {
      [bitrateIndex]: v2Layer23
    }
  },
  6: {
    [description]: "Layer I",
    [framePadding]: 4,
    [modeExtension]: layer12ModeExtensions,
    [samples]: 384,
    [v1]: {
      [bitrateIndex]: v1Layer1
    },
    [v2]: {
      [bitrateIndex]: v2Layer1
    }
  }
};
var mpegVersionDescription = "MPEG Version ";
var isoIec = "ISO/IEC ";
var mpegVersions = {
  0: {
    [description]: `${mpegVersionDescription}2.5 (later extension of MPEG 2)`,
    [layer]: v2,
    [sampleRate]: {
      0: rate11025,
      4: rate12000,
      8: rate8000,
      12: reserved
    }
  },
  8: { [description]: reserved },
  16: {
    [description]: `${mpegVersionDescription}2 (${isoIec}13818-3)`,
    [layer]: v2,
    [sampleRate]: {
      0: rate22050,
      4: rate24000,
      8: rate16000,
      12: reserved
    }
  },
  24: {
    [description]: `${mpegVersionDescription}1 (${isoIec}11172-3)`,
    [layer]: v1,
    [sampleRate]: {
      0: rate44100,
      4: rate48000,
      8: rate32000,
      12: reserved
    }
  },
  length
};
var protectionValues = {
  0: sixteenBitCRC,
  1: none
};
var emphasisValues = {
  0: none,
  1: "50/15 ms",
  2: reserved,
  3: "CCIT J.17"
};
var channelModes = {
  0: { [channels]: 2, [description]: stereo },
  64: { [channels]: 2, [description]: "joint " + stereo },
  128: { [channels]: 2, [description]: "dual channel" },
  192: { [channels]: 1, [description]: monophonic }
};
var MPEGHeader = class _MPEGHeader extends CodecHeader {
  static *[getHeader](codecParser, headerCache, readOffset) {
    const header2 = {};
    const id3v2Header = yield* ID3v2.getID3v2Header(
      codecParser,
      headerCache,
      readOffset
    );
    if (id3v2Header) {
      yield* codecParser[readRawData](id3v2Header[length], readOffset);
      codecParser[incrementRawData](id3v2Header[length]);
    }
    const data3 = yield* codecParser[readRawData](4, readOffset);
    const key = bytesToString(data3[subarray](0, 4));
    const cachedHeader = headerCache[getHeader](key);
    if (cachedHeader) return new _MPEGHeader(cachedHeader);
    if (data3[0] !== 255 || data3[1] < 224) return null;
    const mpegVersionValues2 = mpegVersions[data3[1] & 24];
    if (mpegVersionValues2[description] === reserved) return null;
    const layerBits = data3[1] & 6;
    if (layersValues[layerBits][description] === reserved) return null;
    const layerValues2 = {
      ...layersValues[layerBits],
      ...layersValues[layerBits][mpegVersionValues2[layer]]
    };
    header2[mpegVersion] = mpegVersionValues2[description];
    header2[layer] = layerValues2[description];
    header2[samples] = layerValues2[samples];
    header2[protection] = protectionValues[data3[1] & 1];
    header2[length] = 4;
    header2[bitrate] = bitrateMatrix[data3[2] & 240][layerValues2[bitrateIndex]];
    if (header2[bitrate] === bad) return null;
    header2[sampleRate] = mpegVersionValues2[sampleRate][data3[2] & 12];
    if (header2[sampleRate] === reserved) return null;
    header2[framePadding] = data3[2] & 2 && layerValues2[framePadding];
    header2[isPrivate] = !!(data3[2] & 1);
    header2[frameLength] = Math.floor(
      125 * header2[bitrate] * header2[samples] / header2[sampleRate] + header2[framePadding]
    );
    if (!header2[frameLength]) return null;
    const channelModeBits2 = data3[3] & 192;
    header2[channelMode] = channelModes[channelModeBits2][description];
    header2[channels] = channelModes[channelModeBits2][channels];
    header2[modeExtension] = layerValues2[modeExtension][data3[3] & 48];
    header2[isCopyrighted] = !!(data3[3] & 8);
    header2[isOriginal] = !!(data3[3] & 4);
    header2[emphasis] = emphasisValues[data3[3] & 3];
    if (header2[emphasis] === reserved) return null;
    header2[bitDepth] = 16;
    {
      const { length: length2, frameLength: frameLength2, samples: samples2, ...codecUpdateFields } = header2;
      headerCache[setHeader](key, header2, codecUpdateFields);
    }
    return new _MPEGHeader(header2);
  }
  /**
   * @private
   * Call MPEGHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    super(header2);
    this[bitrate] = header2[bitrate];
    this[emphasis] = header2[emphasis];
    this[framePadding] = header2[framePadding];
    this[isCopyrighted] = header2[isCopyrighted];
    this[isOriginal] = header2[isOriginal];
    this[isPrivate] = header2[isPrivate];
    this[layer] = header2[layer];
    this[modeExtension] = header2[modeExtension];
    this[mpegVersion] = header2[mpegVersion];
    this[protection] = header2[protection];
  }
};

// ../../node_modules/codec-parser/src/codecs/mpeg/MPEGFrame.js
var MPEGFrame = class _MPEGFrame extends CodecFrame {
  static *[getFrame](codecParser, headerCache, readOffset) {
    return yield* super[getFrame](
      MPEGHeader,
      _MPEGFrame,
      codecParser,
      headerCache,
      readOffset
    );
  }
  constructor(header2, frame2, samples2) {
    super(header2, frame2, samples2);
  }
};

// ../../node_modules/codec-parser/src/codecs/mpeg/MPEGParser.js
var MPEGParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = MPEGFrame;
    this.Header = MPEGHeader;
    onCodec(this[codec]);
  }
  get [codec]() {
    return mpeg;
  }
  *[parseFrame]() {
    return yield* this[fixedLengthFrameSync]();
  }
};

// ../../node_modules/codec-parser/src/codecs/aac/AACHeader.js
var mpegVersionValues = {
  0: "MPEG-4",
  8: "MPEG-2"
};
var layerValues = {
  0: "valid",
  2: bad,
  4: bad,
  6: bad
};
var protectionValues2 = {
  0: sixteenBitCRC,
  1: none
};
var profileValues = {
  0: "AAC Main",
  64: "AAC LC (Low Complexity)",
  128: "AAC SSR (Scalable Sample Rate)",
  192: "AAC LTP (Long Term Prediction)"
};
var sampleRates = {
  0: rate96000,
  4: rate88200,
  8: rate64000,
  12: rate48000,
  16: rate44100,
  20: rate32000,
  24: rate24000,
  28: rate22050,
  32: rate16000,
  36: rate12000,
  40: rate11025,
  44: rate8000,
  48: rate7350,
  52: reserved,
  56: reserved,
  60: "frequency is written explicitly"
};
var channelModeValues = {
  0: { [channels]: 0, [description]: "Defined in AOT Specific Config" },
  /*
  'monophonic (mono)'
  'stereo (left, right)'
  'linear surround (front center, front left, front right)'
  'quadraphonic (front center, front left, front right, rear center)'
  '5.0 surround (front center, front left, front right, rear left, rear right)'
  '5.1 surround (front center, front left, front right, rear left, rear right, LFE)'
  '7.1 surround (front center, front left, front right, side left, side right, rear left, rear right, LFE)'
  */
  64: { [channels]: 1, [description]: monophonic },
  128: { [channels]: 2, [description]: getChannelMapping(2, channelMappings[0][0]) },
  192: { [channels]: 3, [description]: getChannelMapping(3, channelMappings[1][3]) },
  256: { [channels]: 4, [description]: getChannelMapping(4, channelMappings[1][3], channelMappings[3][4]) },
  320: { [channels]: 5, [description]: getChannelMapping(5, channelMappings[1][3], channelMappings[3][0]) },
  384: { [channels]: 6, [description]: getChannelMapping(6, channelMappings[1][3], channelMappings[3][0], lfe) },
  448: { [channels]: 8, [description]: getChannelMapping(8, channelMappings[1][3], channelMappings[2][0], channelMappings[3][0], lfe) }
};
var AACHeader = class _AACHeader extends CodecHeader {
  static *[getHeader](codecParser, headerCache, readOffset) {
    const header2 = {};
    const data3 = yield* codecParser[readRawData](7, readOffset);
    const key = bytesToString([
      data3[0],
      data3[1],
      data3[2],
      data3[3] & 252 | data3[6] & 3
      // frame length, buffer fullness varies so don't cache it
    ]);
    const cachedHeader = headerCache[getHeader](key);
    if (!cachedHeader) {
      if (data3[0] !== 255 || data3[1] < 240) return null;
      header2[mpegVersion] = mpegVersionValues[data3[1] & 8];
      header2[layer] = layerValues[data3[1] & 6];
      if (header2[layer] === bad) return null;
      const protectionBit = data3[1] & 1;
      header2[protection] = protectionValues2[protectionBit];
      header2[length] = protectionBit ? 7 : 9;
      header2[profileBits] = data3[2] & 192;
      header2[sampleRateBits] = data3[2] & 60;
      const privateBit = data3[2] & 2;
      header2[profile] = profileValues[header2[profileBits]];
      header2[sampleRate] = sampleRates[header2[sampleRateBits]];
      if (header2[sampleRate] === reserved) return null;
      header2[isPrivate] = !!privateBit;
      header2[channelModeBits] = (data3[2] << 8 | data3[3]) & 448;
      header2[channelMode] = channelModeValues[header2[channelModeBits]][description];
      header2[channels] = channelModeValues[header2[channelModeBits]][channels];
      header2[isOriginal] = !!(data3[3] & 32);
      header2[isHome] = !!(data3[3] & 8);
      header2[copyrightId] = !!(data3[3] & 8);
      header2[copyrightIdStart] = !!(data3[3] & 4);
      header2[bitDepth] = 16;
      header2[samples] = 1024;
      header2[numberAACFrames] = data3[6] & 3;
      {
        const {
          length: length2,
          channelModeBits: channelModeBits2,
          profileBits: profileBits2,
          sampleRateBits: sampleRateBits2,
          frameLength: frameLength2,
          samples: samples2,
          numberAACFrames: numberAACFrames2,
          ...codecUpdateFields
        } = header2;
        headerCache[setHeader](key, header2, codecUpdateFields);
      }
    } else {
      Object.assign(header2, cachedHeader);
    }
    header2[frameLength] = (data3[3] << 11 | data3[4] << 3 | data3[5] >> 5) & 8191;
    if (!header2[frameLength]) return null;
    const bufferFullnessBits = (data3[5] << 6 | data3[6] >> 2) & 2047;
    header2[bufferFullness] = bufferFullnessBits === 2047 ? "VBR" : bufferFullnessBits;
    return new _AACHeader(header2);
  }
  /**
   * @private
   * Call AACHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    super(header2);
    this[copyrightId] = header2[copyrightId];
    this[copyrightIdStart] = header2[copyrightIdStart];
    this[bufferFullness] = header2[bufferFullness];
    this[isHome] = header2[isHome];
    this[isOriginal] = header2[isOriginal];
    this[isPrivate] = header2[isPrivate];
    this[layer] = header2[layer];
    this[length] = header2[length];
    this[mpegVersion] = header2[mpegVersion];
    this[numberAACFrames] = header2[numberAACFrames];
    this[profile] = header2[profile];
    this[protection] = header2[protection];
  }
  get audioSpecificConfig() {
    const header2 = headerStore.get(this);
    const audioSpecificConfig = header2[profileBits] + 64 << 5 | header2[sampleRateBits] << 5 | header2[channelModeBits] >> 3;
    const bytes = new uint8Array(2);
    new dataView(bytes[buffer]).setUint16(0, audioSpecificConfig, false);
    return bytes;
  }
};

// ../../node_modules/codec-parser/src/codecs/aac/AACFrame.js
var AACFrame = class _AACFrame extends CodecFrame {
  static *[getFrame](codecParser, headerCache, readOffset) {
    return yield* super[getFrame](
      AACHeader,
      _AACFrame,
      codecParser,
      headerCache,
      readOffset
    );
  }
  constructor(header2, frame2, samples2) {
    super(header2, frame2, samples2);
  }
};

// ../../node_modules/codec-parser/src/codecs/aac/AACParser.js
var AACParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = AACFrame;
    this.Header = AACHeader;
    onCodec(this[codec]);
  }
  get [codec]() {
    return "aac";
  }
  *[parseFrame]() {
    return yield* this[fixedLengthFrameSync]();
  }
};

// ../../node_modules/codec-parser/src/codecs/flac/FLACFrame.js
var FLACFrame = class _FLACFrame extends CodecFrame {
  static _getFrameFooterCrc16(data3) {
    return (data3[data3[length] - 2] << 8) + data3[data3[length] - 1];
  }
  // check frame footer crc
  // https://xiph.org/flac/format.html#frame_footer
  static [checkFrameFooterCrc16](data3) {
    const expectedCrc16 = _FLACFrame._getFrameFooterCrc16(data3);
    const actualCrc16 = flacCrc16(data3[subarray](0, -2));
    return expectedCrc16 === actualCrc16;
  }
  constructor(data3, header2, streamInfoValue) {
    header2[streamInfo] = streamInfoValue;
    header2[crc16] = _FLACFrame._getFrameFooterCrc16(data3);
    super(header2, data3, headerStore.get(header2)[samples]);
  }
};

// ../../node_modules/codec-parser/src/codecs/flac/FLACHeader.js
var getFromStreamInfo = "get from STREAMINFO metadata block";
var blockingStrategyValues = {
  0: "Fixed",
  1: "Variable"
};
var blockSizeValues = {
  0: reserved,
  16: 192
  // 0b00100000: 576,
  // 0b00110000: 1152,
  // 0b01000000: 2304,
  // 0b01010000: 4608,
  // 0b01100000: "8-bit (blocksize-1) from end of header",
  // 0b01110000: "16-bit (blocksize-1) from end of header",
  // 0b10000000: 256,
  // 0b10010000: 512,
  // 0b10100000: 1024,
  // 0b10110000: 2048,
  // 0b11000000: 4096,
  // 0b11010000: 8192,
  // 0b11100000: 16384,
  // 0b11110000: 32768,
};
for (let i = 2; i < 16; i++)
  blockSizeValues[i << 4] = i < 6 ? 576 * 2 ** (i - 2) : 2 ** i;
var sampleRateValues = {
  0: getFromStreamInfo,
  1: rate88200,
  2: rate176400,
  3: rate192000,
  4: rate8000,
  5: rate16000,
  6: rate22050,
  7: rate24000,
  8: rate32000,
  9: rate44100,
  10: rate48000,
  11: rate96000,
  // 0b00001100: "8-bit sample rate (in kHz) from end of header",
  // 0b00001101: "16-bit sample rate (in Hz) from end of header",
  // 0b00001110: "16-bit sample rate (in tens of Hz) from end of header",
  15: bad
};
var channelAssignments = {
  /*'
  'monophonic (mono)'
  'stereo (left, right)'
  'linear surround (left, right, center)'
  'quadraphonic (front left, front right, rear left, rear right)'
  '5.0 surround (front left, front right, front center, rear left, rear right)'
  '5.1 surround (front left, front right, front center, LFE, rear left, rear right)'
  '6.1 surround (front left, front right, front center, LFE, rear center, side left, side right)'
  '7.1 surround (front left, front right, front center, LFE, rear left, rear right, side left, side right)'
  */
  0: { [channels]: 1, [description]: monophonic },
  16: { [channels]: 2, [description]: getChannelMapping(2, channelMappings[0][0]) },
  32: { [channels]: 3, [description]: getChannelMapping(3, channelMappings[0][1]) },
  48: { [channels]: 4, [description]: getChannelMapping(4, channelMappings[1][0], channelMappings[3][0]) },
  64: { [channels]: 5, [description]: getChannelMapping(5, channelMappings[1][1], channelMappings[3][0]) },
  80: { [channels]: 6, [description]: getChannelMapping(6, channelMappings[1][1], lfe, channelMappings[3][0]) },
  96: { [channels]: 7, [description]: getChannelMapping(7, channelMappings[1][1], lfe, channelMappings[3][4], channelMappings[2][0]) },
  112: { [channels]: 8, [description]: getChannelMapping(8, channelMappings[1][1], lfe, channelMappings[3][0], channelMappings[2][0]) },
  128: { [channels]: 2, [description]: `${stereo} (left, diff)` },
  144: { [channels]: 2, [description]: `${stereo} (diff, right)` },
  160: { [channels]: 2, [description]: `${stereo} (avg, diff)` },
  176: reserved,
  192: reserved,
  208: reserved,
  224: reserved,
  240: reserved
};
var bitDepthValues = {
  0: getFromStreamInfo,
  2: 8,
  4: 12,
  6: reserved,
  8: 16,
  10: 20,
  12: 24,
  14: reserved
};
var FLACHeader = class _FLACHeader extends CodecHeader {
  // https://datatracker.ietf.org/doc/html/rfc3629#section-3
  //    Char. number range  |        UTF-8 octet sequence
  //    (hexadecimal)    |              (binary)
  // --------------------+---------------------------------------------
  // 0000 0000-0000 007F | 0xxxxxxx
  // 0000 0080-0000 07FF | 110xxxxx 10xxxxxx
  // 0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
  // 0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
  static _decodeUTF8Int(data3) {
    if (data3[0] > 254) {
      return null;
    }
    if (data3[0] < 128) return { value: data3[0], length: 1 };
    let length2 = 1;
    for (let zeroMask = 64; zeroMask & data3[0]; zeroMask >>= 1) length2++;
    let idx = length2 - 1, value = 0, shift = 0;
    for (; idx > 0; shift += 6, idx--) {
      if ((data3[idx] & 192) !== 128) {
        return null;
      }
      value |= (data3[idx] & 63) << shift;
    }
    value |= (data3[idx] & 127 >> length2) << shift;
    return { value, length: length2 };
  }
  static [getHeaderFromUint8Array](data3, headerCache) {
    const codecParserStub = {
      [readRawData]: function* () {
        return data3;
      }
    };
    return _FLACHeader[getHeader](codecParserStub, headerCache, 0).next().value;
  }
  static *[getHeader](codecParser, headerCache, readOffset) {
    let data3 = yield* codecParser[readRawData](6, readOffset);
    if (data3[0] !== 255 || !(data3[1] === 248 || data3[1] === 249)) {
      return null;
    }
    const header2 = {};
    const key = bytesToString(data3[subarray](0, 4));
    const cachedHeader = headerCache[getHeader](key);
    if (!cachedHeader) {
      header2[blockingStrategyBits] = data3[1] & 1;
      header2[blockingStrategy] = blockingStrategyValues[header2[blockingStrategyBits]];
      header2[blockSizeBits] = data3[2] & 240;
      header2[sampleRateBits] = data3[2] & 15;
      header2[blockSize] = blockSizeValues[header2[blockSizeBits]];
      if (header2[blockSize] === reserved) {
        return null;
      }
      header2[sampleRate] = sampleRateValues[header2[sampleRateBits]];
      if (header2[sampleRate] === bad) {
        return null;
      }
      if (data3[3] & 1) {
        return null;
      }
      const channelAssignment = channelAssignments[data3[3] & 240];
      if (channelAssignment === reserved) {
        return null;
      }
      header2[channels] = channelAssignment[channels];
      header2[channelMode] = channelAssignment[description];
      header2[bitDepth] = bitDepthValues[data3[3] & 14];
      if (header2[bitDepth] === reserved) {
        return null;
      }
    } else {
      Object.assign(header2, cachedHeader);
    }
    header2[length] = 5;
    data3 = yield* codecParser[readRawData](header2[length] + 8, readOffset);
    const decodedUtf8 = _FLACHeader._decodeUTF8Int(data3[subarray](4));
    if (!decodedUtf8) {
      return null;
    }
    if (header2[blockingStrategyBits]) {
      header2[sampleNumber] = decodedUtf8.value;
    } else {
      header2[frameNumber] = decodedUtf8.value;
    }
    header2[length] += decodedUtf8[length];
    if (header2[blockSizeBits] === 96) {
      if (data3[length] < header2[length])
        data3 = yield* codecParser[readRawData](header2[length], readOffset);
      header2[blockSize] = data3[header2[length] - 1] + 1;
      header2[length] += 1;
    } else if (header2[blockSizeBits] === 112) {
      if (data3[length] < header2[length])
        data3 = yield* codecParser[readRawData](header2[length], readOffset);
      header2[blockSize] = (data3[header2[length] - 1] << 8) + data3[header2[length]] + 1;
      header2[length] += 2;
    }
    header2[samples] = header2[blockSize];
    if (header2[sampleRateBits] === 12) {
      if (data3[length] < header2[length])
        data3 = yield* codecParser[readRawData](header2[length], readOffset);
      header2[sampleRate] = data3[header2[length] - 1] * 1e3;
      header2[length] += 1;
    } else if (header2[sampleRateBits] === 13) {
      if (data3[length] < header2[length])
        data3 = yield* codecParser[readRawData](header2[length], readOffset);
      header2[sampleRate] = (data3[header2[length] - 1] << 8) + data3[header2[length]];
      header2[length] += 2;
    } else if (header2[sampleRateBits] === 14) {
      if (data3[length] < header2[length])
        data3 = yield* codecParser[readRawData](header2[length], readOffset);
      header2[sampleRate] = ((data3[header2[length] - 1] << 8) + data3[header2[length]]) * 10;
      header2[length] += 2;
    }
    if (data3[length] < header2[length])
      data3 = yield* codecParser[readRawData](header2[length], readOffset);
    header2[crc] = data3[header2[length] - 1];
    if (header2[crc] !== crc8(data3[subarray](0, header2[length] - 1))) {
      return null;
    }
    {
      if (!cachedHeader) {
        const {
          blockingStrategyBits: blockingStrategyBits2,
          frameNumber: frameNumber2,
          sampleNumber: sampleNumber2,
          samples: samples2,
          sampleRateBits: sampleRateBits2,
          blockSizeBits: blockSizeBits2,
          crc: crc2,
          length: length2,
          ...codecUpdateFields
        } = header2;
        headerCache[setHeader](key, header2, codecUpdateFields);
      }
    }
    return new _FLACHeader(header2);
  }
  /**
   * @private
   * Call FLACHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    super(header2);
    this[crc16] = null;
    this[blockingStrategy] = header2[blockingStrategy];
    this[blockSize] = header2[blockSize];
    this[frameNumber] = header2[frameNumber];
    this[sampleNumber] = header2[sampleNumber];
    this[streamInfo] = null;
  }
};

// ../../node_modules/codec-parser/src/codecs/flac/FLACParser.js
var MIN_FLAC_FRAME_SIZE = 2;
var MAX_FLAC_FRAME_SIZE = 512 * 1024;
var FLACParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = FLACFrame;
    this.Header = FLACHeader;
    onCodec(this[codec]);
  }
  get [codec]() {
    return "flac";
  }
  *_getNextFrameSyncOffset(offset) {
    const data3 = yield* this._codecParser[readRawData](2, 0);
    const dataLength = data3[length] - 2;
    while (offset < dataLength) {
      const firstByte = data3[offset];
      if (firstByte === 255) {
        const secondByte = data3[offset + 1];
        if (secondByte === 248 || secondByte === 249) break;
        if (secondByte !== 255) offset++;
      }
      offset++;
    }
    return offset;
  }
  *[parseFrame]() {
    do {
      const header2 = yield* FLACHeader[getHeader](
        this._codecParser,
        this._headerCache,
        0
      );
      if (header2) {
        let nextHeaderOffset = headerStore.get(header2)[length] + MIN_FLAC_FRAME_SIZE;
        while (nextHeaderOffset <= MAX_FLAC_FRAME_SIZE) {
          if (this._codecParser._flushing || (yield* FLACHeader[getHeader](
            this._codecParser,
            this._headerCache,
            nextHeaderOffset
          ))) {
            let frameData = yield* this._codecParser[readRawData](nextHeaderOffset);
            if (!this._codecParser._flushing)
              frameData = frameData[subarray](0, nextHeaderOffset);
            if (FLACFrame[checkFrameFooterCrc16](frameData)) {
              const frame2 = new FLACFrame(frameData, header2);
              this._headerCache[enable]();
              this._codecParser[incrementRawData](nextHeaderOffset);
              this._codecParser[mapFrameStats](frame2);
              return frame2;
            }
          }
          nextHeaderOffset = yield* this._getNextFrameSyncOffset(
            nextHeaderOffset + 1
          );
        }
        this._codecParser[logWarning](
          `Unable to sync FLAC frame after searching ${nextHeaderOffset} bytes.`
        );
        this._codecParser[incrementRawData](nextHeaderOffset);
      } else {
        this._codecParser[incrementRawData](
          yield* this._getNextFrameSyncOffset(1)
        );
      }
    } while (true);
  }
  [parseOggPage](oggPage) {
    if (oggPage[pageSequenceNumber] === 0) {
      this._headerCache[enable]();
      this._streamInfo = oggPage[data][subarray](13);
    } else if (oggPage[pageSequenceNumber] === 1) {
    } else {
      oggPage[codecFrames] = frameStore.get(oggPage)[segments].map((segment) => {
        const header2 = FLACHeader[getHeaderFromUint8Array](
          segment,
          this._headerCache
        );
        if (header2) {
          return new FLACFrame(segment, header2, this._streamInfo);
        } else {
          this._codecParser[logWarning](
            "Failed to parse Ogg FLAC frame",
            "Skipping invalid FLAC frame"
          );
        }
      }).filter((frame2) => !!frame2);
    }
    return oggPage;
  }
};

// ../../node_modules/codec-parser/src/containers/ogg/OggPageHeader.js
var OggPageHeader = class _OggPageHeader {
  static *[getHeader](codecParser, headerCache, readOffset) {
    const header2 = {};
    let data3 = yield* codecParser[readRawData](28, readOffset);
    if (data3[0] !== 79 || // O
    data3[1] !== 103 || // g
    data3[2] !== 103 || // g
    data3[3] !== 83) {
      return null;
    }
    header2[streamStructureVersion] = data3[4];
    const zeros = data3[5] & 248;
    if (zeros) return null;
    header2[isLastPage] = !!(data3[5] & 4);
    header2[isFirstPage] = !!(data3[5] & 2);
    header2[isContinuedPacket] = !!(data3[5] & 1);
    const view = new dataView(uint8Array.from(data3[subarray](0, 28))[buffer]);
    header2[absoluteGranulePosition] = readInt64le(view, 6);
    header2[streamSerialNumber] = view.getInt32(14, true);
    header2[pageSequenceNumber] = view.getInt32(18, true);
    header2[pageChecksum] = view.getInt32(22, true);
    const pageSegmentTableLength = data3[26];
    header2[length] = pageSegmentTableLength + 27;
    data3 = yield* codecParser[readRawData](header2[length], readOffset);
    header2[frameLength] = 0;
    header2[pageSegmentTable] = [];
    header2[pageSegmentBytes] = uint8Array.from(
      data3[subarray](27, header2[length])
    );
    for (let i = 0, segmentLength = 0; i < pageSegmentTableLength; i++) {
      const segmentByte = header2[pageSegmentBytes][i];
      header2[frameLength] += segmentByte;
      segmentLength += segmentByte;
      if (segmentByte !== 255 || i === pageSegmentTableLength - 1) {
        header2[pageSegmentTable].push(segmentLength);
        segmentLength = 0;
      }
    }
    return new _OggPageHeader(header2);
  }
  /**
   * @private
   * Call OggPageHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    headerStore.set(this, header2);
    this[absoluteGranulePosition] = header2[absoluteGranulePosition];
    this[isContinuedPacket] = header2[isContinuedPacket];
    this[isFirstPage] = header2[isFirstPage];
    this[isLastPage] = header2[isLastPage];
    this[pageSegmentTable] = header2[pageSegmentTable];
    this[pageSequenceNumber] = header2[pageSequenceNumber];
    this[pageChecksum] = header2[pageChecksum];
    this[streamSerialNumber] = header2[streamSerialNumber];
  }
};

// ../../node_modules/codec-parser/src/containers/ogg/OggPage.js
var OggPage = class _OggPage extends Frame {
  static *[getFrame](codecParser, headerCache, readOffset) {
    const header2 = yield* OggPageHeader[getHeader](
      codecParser,
      headerCache,
      readOffset
    );
    if (header2) {
      const frameLengthValue = headerStore.get(header2)[frameLength];
      const headerLength = headerStore.get(header2)[length];
      const totalLength = headerLength + frameLengthValue;
      const rawDataValue = (yield* codecParser[readRawData](totalLength, 0))[subarray](0, totalLength);
      const frame2 = rawDataValue[subarray](headerLength, totalLength);
      return new _OggPage(header2, frame2, rawDataValue);
    } else {
      return null;
    }
  }
  constructor(header2, frame2, rawDataValue) {
    super(header2, frame2);
    frameStore.get(this)[length] = rawDataValue[length];
    this[codecFrames] = [];
    this[rawData] = rawDataValue;
    this[absoluteGranulePosition] = header2[absoluteGranulePosition];
    this[crc32] = header2[pageChecksum];
    this[duration] = 0;
    this[isContinuedPacket] = header2[isContinuedPacket];
    this[isFirstPage] = header2[isFirstPage];
    this[isLastPage] = header2[isLastPage];
    this[pageSequenceNumber] = header2[pageSequenceNumber];
    this[samples] = 0;
    this[streamSerialNumber] = header2[streamSerialNumber];
  }
};

// ../../node_modules/codec-parser/src/codecs/opus/OpusFrame.js
var OpusFrame = class extends CodecFrame {
  constructor(data3, header2, samples2) {
    super(header2, data3, samples2);
  }
};

// ../../node_modules/codec-parser/src/codecs/opus/OpusHeader.js
var channelMappingFamilies = {
  0: vorbisOpusChannelMapping.slice(0, 2),
  /*
  0: "monophonic (mono)"
  1: "stereo (left, right)"
  */
  1: vorbisOpusChannelMapping
  /*
  0: "monophonic (mono)"
  1: "stereo (left, right)"
  2: "linear surround (left, center, right)"
  3: "quadraphonic (front left, front right, rear left, rear right)"
  4: "5.0 surround (front left, front center, front right, rear left, rear right)"
  5: "5.1 surround (front left, front center, front right, rear left, rear right, LFE)"
  6: "6.1 surround (front left, front center, front right, side left, side right, rear center, LFE)"
  7: "7.1 surround (front left, front center, front right, side left, side right, rear left, rear right, LFE)"
  */
  // additional channel mappings are user defined
};
var silkOnly = "SILK-only";
var celtOnly = "CELT-only";
var hybrid = "Hybrid";
var narrowBand = "narrowband";
var mediumBand = "medium-band";
var wideBand = "wideband";
var superWideBand = "super-wideband";
var fullBand = "fullband";
var configTable = {
  0: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 10 },
  8: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 20 },
  16: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 40 },
  24: { [mode]: silkOnly, [bandwidth]: narrowBand, [frameSize]: 60 },
  32: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 10 },
  40: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 20 },
  48: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 40 },
  56: { [mode]: silkOnly, [bandwidth]: mediumBand, [frameSize]: 60 },
  64: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 10 },
  72: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 20 },
  80: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 40 },
  88: { [mode]: silkOnly, [bandwidth]: wideBand, [frameSize]: 60 },
  96: { [mode]: hybrid, [bandwidth]: superWideBand, [frameSize]: 10 },
  104: { [mode]: hybrid, [bandwidth]: superWideBand, [frameSize]: 20 },
  112: { [mode]: hybrid, [bandwidth]: fullBand, [frameSize]: 10 },
  120: { [mode]: hybrid, [bandwidth]: fullBand, [frameSize]: 20 },
  128: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 2.5 },
  136: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 5 },
  144: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 10 },
  152: { [mode]: celtOnly, [bandwidth]: narrowBand, [frameSize]: 20 },
  160: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 2.5 },
  168: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 5 },
  176: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 10 },
  184: { [mode]: celtOnly, [bandwidth]: wideBand, [frameSize]: 20 },
  192: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 2.5 },
  200: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 5 },
  208: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 10 },
  216: { [mode]: celtOnly, [bandwidth]: superWideBand, [frameSize]: 20 },
  224: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 2.5 },
  232: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 5 },
  240: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 10 },
  248: { [mode]: celtOnly, [bandwidth]: fullBand, [frameSize]: 20 }
};
var OpusHeader = class _OpusHeader extends CodecHeader {
  static [getHeaderFromUint8Array](dataValue, packetData, headerCache) {
    const header2 = {};
    header2[channels] = dataValue[9];
    header2[channelMappingFamily] = dataValue[18];
    header2[length] = header2[channelMappingFamily] !== 0 ? 21 + header2[channels] : 19;
    if (dataValue[length] < header2[length])
      throw new Error("Out of data while inside an Ogg Page");
    const packetMode = packetData[0] & 3;
    const packetLength = packetMode === 3 ? 2 : 1;
    const key = bytesToString(dataValue[subarray](0, header2[length])) + bytesToString(packetData[subarray](0, packetLength));
    const cachedHeader = headerCache[getHeader](key);
    if (cachedHeader) return new _OpusHeader(cachedHeader);
    if (key.substr(0, 8) !== "OpusHead") {
      return null;
    }
    if (dataValue[8] !== 1) return null;
    header2[data] = uint8Array.from(dataValue[subarray](0, header2[length]));
    const view = new dataView(header2[data][buffer]);
    header2[bitDepth] = 16;
    header2[preSkip] = view.getUint16(10, true);
    header2[inputSampleRate] = view.getUint32(12, true);
    header2[sampleRate] = rate48000;
    header2[outputGain] = view.getInt16(16, true);
    if (header2[channelMappingFamily] in channelMappingFamilies) {
      header2[channelMode] = channelMappingFamilies[header2[channelMappingFamily]][header2[channels] - 1];
      if (!header2[channelMode]) return null;
    }
    if (header2[channelMappingFamily] !== 0) {
      header2[streamCount] = dataValue[19];
      header2[coupledStreamCount] = dataValue[20];
      header2[channelMappingTable] = [
        ...dataValue[subarray](21, header2[channels] + 21)
      ];
    }
    const packetConfig = configTable[248 & packetData[0]];
    header2[mode] = packetConfig[mode];
    header2[bandwidth] = packetConfig[bandwidth];
    header2[frameSize] = packetConfig[frameSize];
    switch (packetMode) {
      case 0:
        header2[frameCount] = 1;
        break;
      case 1:
      // 1: 2 frames in the packet, each with equal compressed size
      case 2:
        header2[frameCount] = 2;
        break;
      case 3:
        header2[isVbr] = !!(128 & packetData[1]);
        header2[hasOpusPadding] = !!(64 & packetData[1]);
        header2[frameCount] = 63 & packetData[1];
        break;
      default:
        return null;
    }
    {
      const {
        length: length2,
        data: headerData,
        channelMappingFamily: channelMappingFamily2,
        ...codecUpdateFields
      } = header2;
      headerCache[setHeader](key, header2, codecUpdateFields);
    }
    return new _OpusHeader(header2);
  }
  /**
   * @private
   * Call OpusHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    super(header2);
    this[data] = header2[data];
    this[bandwidth] = header2[bandwidth];
    this[channelMappingFamily] = header2[channelMappingFamily];
    this[channelMappingTable] = header2[channelMappingTable];
    this[coupledStreamCount] = header2[coupledStreamCount];
    this[frameCount] = header2[frameCount];
    this[frameSize] = header2[frameSize];
    this[hasOpusPadding] = header2[hasOpusPadding];
    this[inputSampleRate] = header2[inputSampleRate];
    this[isVbr] = header2[isVbr];
    this[mode] = header2[mode];
    this[outputGain] = header2[outputGain];
    this[preSkip] = header2[preSkip];
    this[streamCount] = header2[streamCount];
  }
};

// ../../node_modules/codec-parser/src/codecs/opus/OpusParser.js
var OpusParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = OpusFrame;
    this.Header = OpusHeader;
    onCodec(this[codec]);
    this._identificationHeader = null;
    this._preSkipRemaining = null;
  }
  get [codec]() {
    return "opus";
  }
  /**
   * @todo implement continued page support
   */
  [parseOggPage](oggPage) {
    if (oggPage[pageSequenceNumber] === 0) {
      this._headerCache[enable]();
      this._identificationHeader = oggPage[data];
    } else if (oggPage[pageSequenceNumber] === 1) {
    } else {
      oggPage[codecFrames] = frameStore.get(oggPage)[segments].map((segment) => {
        const header2 = OpusHeader[getHeaderFromUint8Array](
          this._identificationHeader,
          segment,
          this._headerCache
        );
        if (header2) {
          if (this._preSkipRemaining === null)
            this._preSkipRemaining = header2[preSkip];
          let samples2 = header2[frameSize] * header2[frameCount] / 1e3 * header2[sampleRate];
          if (this._preSkipRemaining > 0) {
            this._preSkipRemaining -= samples2;
            samples2 = this._preSkipRemaining < 0 ? -this._preSkipRemaining : 0;
          }
          return new OpusFrame(segment, header2, samples2);
        }
        this._codecParser[logError2](
          "Failed to parse Ogg Opus Header",
          "Not a valid Ogg Opus file"
        );
      });
    }
    return oggPage;
  }
};

// ../../node_modules/codec-parser/src/codecs/vorbis/VorbisFrame.js
var VorbisFrame = class extends CodecFrame {
  constructor(data3, header2, samples2) {
    super(header2, data3, samples2);
  }
};

// ../../node_modules/codec-parser/src/codecs/vorbis/VorbisHeader.js
var blockSizes = {
  // 0b0110: 64,
  // 0b0111: 128,
  // 0b1000: 256,
  // 0b1001: 512,
  // 0b1010: 1024,
  // 0b1011: 2048,
  // 0b1100: 4096,
  // 0b1101: 8192
};
for (let i = 0; i < 8; i++) blockSizes[i + 6] = 2 ** (6 + i);
var VorbisHeader = class _VorbisHeader extends CodecHeader {
  static [getHeaderFromUint8Array](dataValue, headerCache, vorbisCommentsData, vorbisSetupData) {
    if (dataValue[length] < 30)
      throw new Error("Out of data while inside an Ogg Page");
    const key = bytesToString(dataValue[subarray](0, 30));
    const cachedHeader = headerCache[getHeader](key);
    if (cachedHeader) return new _VorbisHeader(cachedHeader);
    const header2 = { [length]: 30 };
    if (key.substr(0, 7) !== "vorbis") {
      return null;
    }
    header2[data] = uint8Array.from(dataValue[subarray](0, 30));
    const view = new dataView(header2[data][buffer]);
    header2[version] = view.getUint32(7, true);
    if (header2[version] !== 0) return null;
    header2[channels] = dataValue[11];
    header2[channelMode] = vorbisOpusChannelMapping[header2[channels] - 1] || "application defined";
    header2[sampleRate] = view.getUint32(12, true);
    header2[bitrateMaximum] = view.getInt32(16, true);
    header2[bitrateNominal] = view.getInt32(20, true);
    header2[bitrateMinimum] = view.getInt32(24, true);
    header2[blocksize1] = blockSizes[(dataValue[28] & 240) >> 4];
    header2[blocksize0] = blockSizes[dataValue[28] & 15];
    if (header2[blocksize0] > header2[blocksize1]) return null;
    if (dataValue[29] !== 1) return null;
    header2[bitDepth] = 32;
    header2[vorbisSetup] = vorbisSetupData;
    header2[vorbisComments] = vorbisCommentsData;
    {
      const {
        length: length2,
        data: data3,
        version: version2,
        vorbisSetup: vorbisSetup2,
        vorbisComments: vorbisComments2,
        ...codecUpdateFields
      } = header2;
      headerCache[setHeader](key, header2, codecUpdateFields);
    }
    return new _VorbisHeader(header2);
  }
  /**
   * @private
   * Call VorbisHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header2) {
    super(header2);
    this[bitrateMaximum] = header2[bitrateMaximum];
    this[bitrateMinimum] = header2[bitrateMinimum];
    this[bitrateNominal] = header2[bitrateNominal];
    this[blocksize0] = header2[blocksize0];
    this[blocksize1] = header2[blocksize1];
    this[data] = header2[data];
    this[vorbisComments] = header2[vorbisComments];
    this[vorbisSetup] = header2[vorbisSetup];
  }
};

// ../../node_modules/codec-parser/src/codecs/vorbis/VorbisParser.js
var VorbisParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = VorbisFrame;
    onCodec(this[codec]);
    this._identificationHeader = null;
    this._setupComplete = false;
    this._prevBlockSize = null;
  }
  get [codec]() {
    return vorbis;
  }
  [parseOggPage](oggPage) {
    oggPage[codecFrames] = [];
    for (const oggPageSegment of frameStore.get(oggPage)[segments]) {
      if (oggPageSegment[0] === 1) {
        this._headerCache[enable]();
        this._identificationHeader = oggPage[data];
        this._setupComplete = false;
      } else if (oggPageSegment[0] === 3) {
        this._vorbisComments = oggPageSegment;
      } else if (oggPageSegment[0] === 5) {
        this._vorbisSetup = oggPageSegment;
        this._mode = this._parseSetupHeader(oggPageSegment);
        this._setupComplete = true;
      } else if (this._setupComplete) {
        const header2 = VorbisHeader[getHeaderFromUint8Array](
          this._identificationHeader,
          this._headerCache,
          this._vorbisComments,
          this._vorbisSetup
        );
        if (header2) {
          oggPage[codecFrames].push(
            new VorbisFrame(
              oggPageSegment,
              header2,
              this._getSamples(oggPageSegment, header2)
            )
          );
        } else {
          this._codecParser[logError](
            "Failed to parse Ogg Vorbis Header",
            "Not a valid Ogg Vorbis file"
          );
        }
      }
    }
    return oggPage;
  }
  _getSamples(segment, header2) {
    const blockFlag = this._mode.blockFlags[segment[0] >> 1 & this._mode.mask];
    const currentBlockSize = blockFlag ? header2[blocksize1] : header2[blocksize0];
    const samplesValue = this._prevBlockSize === null ? 0 : (this._prevBlockSize + currentBlockSize) / 4;
    this._prevBlockSize = currentBlockSize;
    return samplesValue;
  }
  // https://gitlab.xiph.org/xiph/liboggz/-/blob/master/src/liboggz/oggz_auto.c#L911
  // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/vorbis_parser.c
  /*
   * This is the format of the mode data at the end of the packet for all
   * Vorbis Version 1 :
   *
   * [ 6:number_of_modes ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:framing(1) ]
   *
   * e.g.:
   *
   * MsB         LsB
   *              <-
   * 0 0 0 0 0 1 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1|0 0 0 0 0
   * 0 0 0 0|0|0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0|1|0 0 0 0 |
   * 0 0 0 0 0 0 0 0 V
   * 0 0 0|0 0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0|1 0 0 0 0 0
   *
   * The simplest way to approach this is to start at the end
   * and read backwards to determine the mode configuration.
   *
   * liboggz and ffmpeg both use this method.
   */
  _parseSetupHeader(setup) {
    const bitReader = new BitReader(setup);
    const mode2 = {
      count: 0,
      blockFlags: []
    };
    while ((bitReader.read(1) & 1) !== 1) {
    }
    let modeBits;
    while (mode2.count < 64 && bitReader.position > 0) {
      reverse(bitReader.read(8));
      let currentByte = 0;
      while (bitReader.read(8) === 0 && currentByte++ < 3) {
      }
      if (currentByte === 4) {
        modeBits = bitReader.read(7);
        mode2.blockFlags.unshift(modeBits & 1);
        bitReader.position += 6;
        mode2.count++;
      } else {
        if (((reverse(modeBits) & 126) >> 1) + 1 !== mode2.count) {
          this._codecParser[logWarning](
            "vorbis derived mode count did not match actual mode count"
          );
        }
        break;
      }
    }
    mode2.mask = (1 << Math.log2(mode2.count)) - 1;
    return mode2;
  }
};

// ../../node_modules/codec-parser/src/containers/ogg/OggParser.js
var OggStream = class {
  constructor(codecParser, headerCache, onCodec) {
    this._codecParser = codecParser;
    this._headerCache = headerCache;
    this._onCodec = onCodec;
    this._continuedPacket = new uint8Array();
    this._codec = null;
    this._isSupported = null;
    this._previousAbsoluteGranulePosition = null;
  }
  get [codec]() {
    return this._codec || "";
  }
  _updateCodec(codec2, Parser2) {
    if (this._codec !== codec2) {
      this._headerCache[reset]();
      this._parser = new Parser2(
        this._codecParser,
        this._headerCache,
        this._onCodec
      );
      this._codec = codec2;
    }
  }
  _checkCodecSupport({ data: data3 }) {
    const idString = bytesToString(data3[subarray](0, 8));
    switch (idString) {
      case "fishead\0":
        return false;
      // ignore ogg skeleton packets
      case "OpusHead":
        this._updateCodec("opus", OpusParser);
        return true;
      case (/^\x7fFLAC/.test(idString) && idString):
        this._updateCodec("flac", FLACParser);
        return true;
      case (/^\x01vorbis/.test(idString) && idString):
        this._updateCodec(vorbis, VorbisParser);
        return true;
      default:
        return false;
    }
  }
  _checkPageSequenceNumber(oggPage) {
    if (oggPage[pageSequenceNumber] !== this._pageSequenceNumber + 1 && this._pageSequenceNumber > 1 && oggPage[pageSequenceNumber] > 1) {
      this._codecParser[logWarning](
        "Unexpected gap in Ogg Page Sequence Number.",
        `Expected: ${this._pageSequenceNumber + 1}, Got: ${oggPage[pageSequenceNumber]}`
      );
    }
    this._pageSequenceNumber = oggPage[pageSequenceNumber];
  }
  _parsePage(oggPage) {
    if (this._isSupported === null) {
      this._pageSequenceNumber = oggPage[pageSequenceNumber];
      this._isSupported = this._checkCodecSupport(oggPage);
    }
    this._checkPageSequenceNumber(oggPage);
    const oggPageStore = frameStore.get(oggPage);
    const headerData = headerStore.get(oggPageStore[header]);
    let offset = 0;
    oggPageStore[segments] = headerData[pageSegmentTable].map(
      (segmentLength) => oggPage[data][subarray](offset, offset += segmentLength)
    );
    if (this._continuedPacket[length]) {
      oggPageStore[segments][0] = concatBuffers(
        this._continuedPacket,
        oggPageStore[segments][0]
      );
      this._continuedPacket = new uint8Array();
    }
    if (headerData[pageSegmentBytes][headerData[pageSegmentBytes][length] - 1] === 255) {
      this._continuedPacket = concatBuffers(
        this._continuedPacket,
        oggPageStore[segments].pop()
      );
    }
    if (this._previousAbsoluteGranulePosition !== null) {
      oggPage[samples] = Number(
        oggPage[absoluteGranulePosition] - this._previousAbsoluteGranulePosition
      );
    }
    this._previousAbsoluteGranulePosition = oggPage[absoluteGranulePosition];
    if (this._isSupported) {
      const frame2 = this._parser[parseOggPage](oggPage);
      this._codecParser[mapFrameStats](frame2);
      return frame2;
    } else {
      return oggPage;
    }
  }
};
var OggParser = class extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this._onCodec = onCodec;
    this.Frame = OggPage;
    this.Header = OggPageHeader;
    this._streams = /* @__PURE__ */ new Map();
    this._currentSerialNumber = null;
  }
  get [codec]() {
    const oggStream = this._streams.get(this._currentSerialNumber);
    return oggStream ? oggStream.codec : "";
  }
  *[parseFrame]() {
    const oggPage = yield* this[fixedLengthFrameSync](true);
    this._currentSerialNumber = oggPage[streamSerialNumber];
    let oggStream = this._streams.get(this._currentSerialNumber);
    if (!oggStream) {
      oggStream = new OggStream(
        this._codecParser,
        this._headerCache,
        this._onCodec
      );
      this._streams.set(this._currentSerialNumber, oggStream);
    }
    if (oggPage[isLastPage]) this._streams.delete(this._currentSerialNumber);
    return oggStream._parsePage(oggPage);
  }
};

// ../../node_modules/codec-parser/src/CodecParser.js
var noOp = () => {
};
var CodecParser = class {
  constructor(mimeType2, {
    onCodec,
    onCodecHeader,
    onCodecUpdate,
    enableLogging = false,
    enableFrameCRC32 = true
  } = {}) {
    this._inputMimeType = mimeType2;
    this._onCodec = onCodec || noOp;
    this._onCodecHeader = onCodecHeader || noOp;
    this._onCodecUpdate = onCodecUpdate;
    this._enableLogging = enableLogging;
    this._crc32 = enableFrameCRC32 ? crc32Function : noOp;
    this[reset]();
  }
  /**
   * @public
   * @returns The detected codec
   */
  get [codec]() {
    return this._parser ? this._parser[codec] : "";
  }
  [reset]() {
    this._headerCache = new HeaderCache(
      this._onCodecHeader,
      this._onCodecUpdate
    );
    this._generator = this._getGenerator();
    this._generator.next();
  }
  /**
   * @public
   * @description Generator function that yields any buffered CodecFrames and resets the CodecParser
   * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
   * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
   */
  *flush() {
    this._flushing = true;
    for (let i = this._generator.next(); i.value; i = this._generator.next()) {
      yield i.value;
    }
    this._flushing = false;
    this[reset]();
  }
  /**
   * @public
   * @description Generator function takes in a Uint8Array of data and returns a CodecFrame from the data for each iteration
   * @param {Uint8Array} chunk Next chunk of codec data to read
   * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
   * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
   */
  *parseChunk(chunk) {
    for (let i = this._generator.next(chunk); i.value; i = this._generator.next()) {
      yield i.value;
    }
  }
  /**
   * @public
   * @description Parses an entire file and returns all of the contained frames.
   * @param {Uint8Array} fileData Coded data to read
   * @returns {Array<CodecFrame|OggPage>} CodecFrames
   */
  parseAll(fileData) {
    return [...this.parseChunk(fileData), ...this.flush()];
  }
  /**
   * @private
   */
  *_getGenerator() {
    if (this._inputMimeType.match(/aac/)) {
      this._parser = new AACParser(this, this._headerCache, this._onCodec);
    } else if (this._inputMimeType.match(/mpeg/)) {
      this._parser = new MPEGParser(this, this._headerCache, this._onCodec);
    } else if (this._inputMimeType.match(/flac/)) {
      this._parser = new FLACParser(this, this._headerCache, this._onCodec);
    } else if (this._inputMimeType.match(/ogg/)) {
      this._parser = new OggParser(this, this._headerCache, this._onCodec);
    } else {
      throw new Error(`Unsupported Codec ${mimeType}`);
    }
    this._frameNumber = 0;
    this._currentReadPosition = 0;
    this._totalBytesIn = 0;
    this._totalBytesOut = 0;
    this._totalSamples = 0;
    this._sampleRate = void 0;
    this._rawData = new Uint8Array(0);
    while (true) {
      const frame2 = yield* this._parser[parseFrame]();
      if (frame2) yield frame2;
    }
  }
  /**
   * @protected
   * @param {number} minSize Minimum bytes to have present in buffer
   * @returns {Uint8Array} rawData
   */
  *[readRawData](minSize = 0, readOffset = 0) {
    let rawData2;
    while (this._rawData[length] <= minSize + readOffset) {
      rawData2 = yield;
      if (this._flushing) return this._rawData[subarray](readOffset);
      if (rawData2) {
        this._totalBytesIn += rawData2[length];
        this._rawData = concatBuffers(this._rawData, rawData2);
      }
    }
    return this._rawData[subarray](readOffset);
  }
  /**
   * @protected
   * @param {number} increment Bytes to increment codec data
   */
  [incrementRawData](increment) {
    this._currentReadPosition += increment;
    this._rawData = this._rawData[subarray](increment);
  }
  /**
   * @protected
   */
  [mapCodecFrameStats](frame2) {
    this._sampleRate = frame2[header][sampleRate];
    frame2[header][bitrate] = frame2[duration] > 0 ? Math.round(frame2[data][length] / frame2[duration]) * 8 : 0;
    frame2[frameNumber] = this._frameNumber++;
    frame2[totalBytesOut] = this._totalBytesOut;
    frame2[totalSamples] = this._totalSamples;
    frame2[totalDuration] = this._totalSamples / this._sampleRate * 1e3;
    frame2[crc32] = this._crc32(frame2[data]);
    this._headerCache[checkCodecUpdate](
      frame2[header][bitrate],
      frame2[totalDuration]
    );
    this._totalBytesOut += frame2[data][length];
    this._totalSamples += frame2[samples];
  }
  /**
   * @protected
   */
  [mapFrameStats](frame2) {
    if (frame2[codecFrames]) {
      if (frame2[isLastPage]) {
        let absoluteGranulePositionSamples = frame2[samples];
        frame2[codecFrames].forEach((codecFrame) => {
          const untrimmedCodecSamples = codecFrame[samples];
          if (absoluteGranulePositionSamples < untrimmedCodecSamples) {
            codecFrame[samples] = absoluteGranulePositionSamples > 0 ? absoluteGranulePositionSamples : 0;
            codecFrame[duration] = codecFrame[samples] / codecFrame[header][sampleRate] * 1e3;
          }
          absoluteGranulePositionSamples -= untrimmedCodecSamples;
          this[mapCodecFrameStats](codecFrame);
        });
      } else {
        frame2[samples] = 0;
        frame2[codecFrames].forEach((codecFrame) => {
          frame2[samples] += codecFrame[samples];
          this[mapCodecFrameStats](codecFrame);
        });
      }
      frame2[duration] = frame2[samples] / this._sampleRate * 1e3 || 0;
      frame2[totalSamples] = this._totalSamples;
      frame2[totalDuration] = this._totalSamples / this._sampleRate * 1e3 || 0;
      frame2[totalBytesOut] = this._totalBytesOut;
    } else {
      this[mapCodecFrameStats](frame2);
    }
  }
  /**
   * @private
   */
  _log(logger, messages) {
    if (this._enableLogging) {
      const stats = [
        `${codec}:         ${this[codec]}`,
        `inputMimeType: ${this._inputMimeType}`,
        `readPosition:  ${this._currentReadPosition}`,
        `totalBytesIn:  ${this._totalBytesIn}`,
        `${totalBytesOut}: ${this._totalBytesOut}`
      ];
      const width = Math.max(...stats.map((s) => s[length]));
      messages.push(
        `--stats--${"-".repeat(width - 9)}`,
        ...stats,
        "-".repeat(width)
      );
      logger(
        "codec-parser",
        messages.reduce((acc, message) => acc + "\n  " + message, "")
      );
    }
  }
  /**
   * @protected
   */
  [logWarning](...messages) {
    this._log(console.warn, messages);
  }
  /**
   * @protected
   */
  [logError2](...messages) {
    this._log(console.error, messages);
  }
};

// ../../node_modules/codec-parser/index.js
var codec_parser_default = CodecParser;
var codecFrames2 = codecFrames;
var data2 = data;
var isLastPage2 = isLastPage;
var totalSamples2 = totalSamples;

// ../../node_modules/@wasm-audio-decoders/flac/src/EmscriptenWasm.js
function EmscriptenWASM(WASMAudioDecoderCommon2) {
  var Module = Module;
  var out = (text) => console.log(text);
  var err = (text) => console.error(text);
  function ready() {
  }
  Module = {};
  function abort(what) {
    throw what;
  }
  var HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64, HEAP64, HEAPU64, wasmMemory;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    HEAPU8 = new Uint8Array(b);
    HEAPU16 = new Uint16Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAPF32 = new Float32Array(b);
    HEAPF64 = new Float64Array(b);
    HEAP64 = new BigInt64Array(b);
    HEAPU64 = new BigUint64Array(b);
  }
  var base64Decode = (b64) => {
    var b1, b2, i2 = 0, j = 0, bLength = b64.length;
    var output = new Uint8Array((bLength * 3 >> 2) - (b64[bLength - 2] == "=") - (b64[bLength - 1] == "="));
    for (; i2 < bLength; i2 += 4, j += 3) {
      b1 = base64ReverseLookup[b64.charCodeAt(i2 + 1)];
      b2 = base64ReverseLookup[b64.charCodeAt(i2 + 2)];
      output[j] = base64ReverseLookup[b64.charCodeAt(i2)] << 2 | b1 >> 4;
      output[j + 1] = b1 << 4 | b2 >> 2;
      output[j + 2] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i2 + 3)];
    }
    return output;
  };
  var __abort_js = () => abort("");
  var __emscripten_runtime_keepalive_clear = () => {
  };
  var timers = {};
  var callUserCallback = (func) => func();
  var _emscripten_get_now = () => performance.now();
  var __setitimer_js = (which, timeout_ms) => {
    if (timers[which]) {
      clearTimeout(timers[which].id);
      delete timers[which];
    }
    if (!timeout_ms) return 0;
    var id = setTimeout(() => {
      delete timers[which];
      callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
    }, timeout_ms);
    timers[which] = {
      id,
      timeout_ms
    };
    return 0;
  };
  var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    return false;
  };
  var _fd_close = (fd) => 52;
  var _fd_read = (fd, iov, iovcnt, pnum) => 52;
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    return 70;
  }
  var printCharBuffers = [null, [], []];
  var UTF8Decoder = new TextDecoder();
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    return UTF8Decoder.decode(heapOrArray.buffer ? heapOrArray.subarray(idx, endPtr) : new Uint8Array(heapOrArray.slice(idx, endPtr)));
  };
  var printChar = (stream2, curr) => {
    var buffer2 = printCharBuffers[stream2];
    if (curr === 0 || curr === 10) {
      (stream2 === 1 ? out : err)(UTF8ArrayToString(buffer2));
      buffer2.length = 0;
    } else {
      buffer2.push(curr);
    }
  };
  var _fd_write = (fd, iov, iovcnt, pnum) => {
    var num = 0;
    for (var i2 = 0; i2 < iovcnt; i2++) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      iov += 8;
      for (var j = 0; j < len; j++) {
        printChar(fd, HEAPU8[ptr + j]);
      }
      num += len;
    }
    HEAPU32[pnum >> 2] = num;
    return 0;
  };
  var _proc_exit = (code) => {
    throw `exit(${code})`;
  };
  for (var base64ReverseLookup = new Uint8Array(123), i = 25; i >= 0; --i) {
    base64ReverseLookup[48 + i] = 52 + i;
    base64ReverseLookup[65 + i] = i;
    base64ReverseLookup[97 + i] = 26 + i;
  }
  base64ReverseLookup[43] = 62;
  base64ReverseLookup[47] = 63;
  var wasmImports = {
    /** @export */
    "c": __abort_js,
    /** @export */
    "b": __emscripten_runtime_keepalive_clear,
    /** @export */
    "d": __setitimer_js,
    /** @export */
    "e": _emscripten_resize_heap,
    /** @export */
    "g": _fd_close,
    /** @export */
    "i": _fd_read,
    /** @export */
    "f": _fd_seek,
    /** @export */
    "h": _fd_write,
    /** @export */
    "a": _proc_exit
  };
  function assignWasmExports(wasmExports) {
    _free = wasmExports["l"];
    _malloc = wasmExports["m"];
    _create_decoder = wasmExports["n"];
    _destroy_decoder = wasmExports["o"];
    _decode_frame = wasmExports["p"];
    __emscripten_timeout = wasmExports["r"];
  }
  var _free, _malloc, _create_decoder, _destroy_decoder, _decode_frame, __emscripten_timeout;
  function initRuntime(wasmExports) {
    wasmExports["k"]();
  }
  if (!EmscriptenWASM.wasm) Object.defineProperty(EmscriptenWASM, "wasm", { get: () => String.raw`dynEncode01561175c7ec¥fÓÅ¬Ñ£kÁ@2ºÙì:rÛyë½ÙR9ßVNdü~= 
xW±b\°Û¼¥õä= ãjð$k¾¥OøÃ3tÚÇA0$|"ïô´
Îß|Ø~´¹ Î)@±nné|
=}¼¤ç,Ò·CÈzä^(ËÒ;È?¯¡Ô+ºÕÌ |mlýÒ*môÆ½BI[µçFã6L|x9ÂÇrustRI¼ë7Çzÿ ¡ ÄÃ¡Ì%=Mä$+N!.L÷«´ÕÒe äºÏo0|d@1»¼¼¼¼¼LáþË±Ýúâ "ÞMxh xéP4qÅ
.3/=MRóMÚ6Ræ©®w±î×ÃñÉÛ¯Ì¡Í@nê!'mù	Bu= 2ªâ\Ä1É:«R´êîö>¦k?§ÞCuw"µçQùä{)3/®^ê2ãÃPrç5®u8Ë<ÄaSêXÁ'¦ôE£äñ­'¨ 9v0ãKa= ¬ª/_Ør%A$ÕÞlÎýsÛ;d³ÎÌ=}äyAÞÛvjÑeaÜ»ÒHù)&*¢ÊJ¦ôñ	 fÉ¢n¢ë{©èm%ÞÛ¶*3.­rªîjäËç{&Ìqkéº'ä­yp9¸áÒÿ<ü¹·I\CpðI<EÈsçççdr_oÖ{5Í²é«Î¤à]³m-¬'EY(×!2[Ä!¹Ð= »ZA ×ÛWY3ö	í³Ùày!·§¶kð.y¨;ÖZ¾à<æLMÂäN±ºT0@´®¹{Í
¹ 8ÑeÍ"lÅ¾Í¾=M2T¬P6u:'m7~qT4öZuU	×÷½÷N/uHee&Hò5ñÕÆ´¹,eÄ¬öR¬dàFR7bÝ¸Á÷u*"2þ6¡yBÝmTÊ:*=Mt½Ü<¥Yî#&"S¸4õÇe¸½	auX67ó3øbòEHøDúºØtP´im2Wk_¯j>e¹pr#bCQ	o|G&9ró"ÛyLb¿C½ì3MØ õFØ#TjüÅgæºèÆ5¨UõÍ¢G¹m¨4&LäóFzÖ¥ÛÄF¨Ðm"_¡C¬»ÇÀê3t­ç4¾[£"=M¿ÿ7Z)IOR4Ô;2.j3Ü{9¬$0ÁGøTyaímE¯L(Ïä®#k«a3>§º.ocOÐ¹	þùDjotF.ÅRG7HÿifåS ËÒ.9°@½1åe	©}&æ-kM,u@í-ó.*Pßi}Lq¢_°çëÓ±¹s¬ KÍÓZøó:vÕ^×Ê²[5Òò1»çË½6ÐÜr;íEp?Ýbbb©ÊÂVñ:¬ÍÓÀÊ!{ä¢T«ÁS]·dßÑ*zQtLG^i9g9×³½ÞD*7>.¹0y9ÌnpÄ®ÎEIÿ|'ºA=}äÔ¯8DLµøA<'@zèß²ndj¯È»Âu³7EÄÊ°®B0"èÁðäôA©©-i1J''­øyJVÿÉ&æÀp()xBØzäs%¿L
î)øqÔÀÉã*Áú°hEJk©wáå2Ý¼E¿'+x)X6óÞ«ö=MmYì=}ºIÂ=Mgìb$öÇìbàÉ Ó9ûPÁ÷¾ÒÃëH®Õ?Ý5×Ã3ñ¨ä¢¯=M¡À?ì(-cÍ±ä1±/¸#áuQOíÉò1MÐÇ cõRRÙõA ¸/nfÏÄÆ2FUÖ·MGÈ<À= 267SõÑJÝbªV²â1¡ê.ûv(²2|w}ðWztGB­Ûhzh{ç*®5T7Á´éª &æÆïeÕÏ´ÜòÆN.;eÏ­°Ø¶dÖ«2á~*úì9ò*Od¤<±Â«cë#GÅÉ¹x·Øq4MÞ±9¾zi'Î4I´M»èà¼NRÔ2³¨ÖÊvD³B×/|.=MõG³3Á&ÔF	ý¡8WQåÏ5_pì¿Yöa1äÎI÷ ìQA@)E; e2ëBAôPAµIî$*ÖìÌë¸òÒsëÔÔÛáÃà¤¿Ô:ÑØ}%2|@òøDîÓT½5Nt=MkKÙm¼½WÑpJ"kÑ[ÁþÅµÔ/Ak*¹ÍDgîÅ¦R­ôÔP'Z kªºT4I?ªc}´éSOíOÿpA÷>ÁmÝLoLüÓS;M¡PT-MÀ&öÌüûC)¤ÕR:´ïìã)§*õÒ;y¥ÀÃC×p°Y:å2©kwÜåÑ/ñ®-Ï5F9ÅmvÓ´½_¼yîÖåtS£4^MÖ0GßZ,ëÚYMûÇTø½UH÷ZòóÖÑ$-uMd©ÆlwIîÌbMî)eÔ®.ØMìµÕQ£òÁYÅÌXE*».¬½9SH¯ÅRîññ]´ÍXE:ô	ªôcM,%´Ð1Ê¡É
Ý1ºDòVÓPtQL\*ãÕLIÝT0xülÂËvôx&T6Ñ7«³¾CÞ@ëõRb#\¿V4é%²Hªd@Â#,ø=} !´RÒtåCû¤¶]lix*ÒÑC;a«µÙP\Jã­ÔQ8
\&EÒ;³ý±+ÖtÕHA"j|¬$Ã)îÔ)Í.pÙ_&MT@¬¦sp1%8³1Ö_1éìKIµÒ«scno=}æ-ÏýáR2=}=}Ñr ODR<w­¯Ùa¨|È= ®é4I?¥Î¨¾~ÆMÁ½0=M­F	uÇûà*$¨= ¤I)òQ5xb]I½Âxy}}3òéÈa'Ê½Ç7h/óç$,ÏòëÄé3àq¿Ü3 Ø|÷¬oÔ8¦ÐtÞîÀðâÊ{á¬ÒTg¼èÅùø]½OÌ6ä÷ë·/åi¼µ}"×óýËïÄüéýé??úÅ(Êó¢óÑó¤ØüéðÔ+_	fBo§\wúw£{"ß|"nwò
Úrvl¥ÙÐÀ·à6Èoû=M%Gùl¦*4A	ÜeS§ø;Wßd¥¨Ý}/b¥7T\c¥¾éÂÜ}7FZc¥¾i®ÎææÞsxyw= ËÞ£lw-Òü¦®ä¤·¯â)ýL%L=Még1¢åWõOWaErhS¬CûH
¹ÌvÎÐæ:UÀ,þ³ÛóªkÔ¤Ì®Ø£%Õ
32>|Jìáþóñz³êïô8ö¤÷­ >eãnâ n¼ëÚú,³ýv#79µútWçl]Ä§{p¨¿¿6ìª°<Ò¡ûñc2#ª+3 û1c2CªÆ]ªPS×QÓLÃH²KtÜ¥Æ×%ý.x¾bºá¤6vþ6IÊ:ÈHüÃ.=}í-tUPVyEÈÈOæExÒ/C1n/=MÌJÃ´r§L^@¤¾³éE49²ÐG½Gé§ÉvpË­Ðl<îÆb-¾2¯Ilp,7BÅ;ÈÐÐoèmf¢@(@ìÍ
b|Ô5À=Mï÷w»B®Ô/ÇT	ËÌõïÇÀôE¸õ= ©zL)B Õú#üÙ¼ë¦¦¢EÚsÈ\tÙà=}8JD´Nîee¦gCYù9É?ÌëË-ïµ®9£÷Îµ=Mû[ù[õüßS¸ª	ÔÎ Ô!Á¬µ×@Ó#@ÊY+M´	ÐE\ÿ1wónDU!Á
&×Za×°ÙèÅêRlûÊi_2 _A´[­-ÃP;S_,­ø)äJúÝ=MårJºêª2ýô_Sª<GÎýînb	Ô°LØî^=MÜg{cD²SÔD+%Ñ@=}y¼@õ.öÄÏøÄ@°#IIðTA}ÆjòYäæXäõÖÏ<âµÛá#ñJ¼2ûº¹h:BîÎ£ßð)îÜrb=}ú¡ñ(= àïîßÖòæyè.wh
ÆB·ü{øÝ+ô>íf¤C<ü3
©ýîÌ8j)¤ò¸0<j),ýî4ø³XLÌNÉ4ï@³³f5Í*aòßaÑ¿âW#»:.ÈDk½~FdRjiWÁ!W»@» ÞÅsËIÕ9*Îü²ê0Hü½Å²ÎÐ:²Ê!ÔñaôVóÜ²b»ò«Ð	UJXËTu0Uen¿oÙ¸ÚU	÷êÉÿos¯Ë¬©äm­·QW	®$ÑTjEX5>ãûPÆþóAQ?Ù@@öeDGL	îäýÐ£58©üè·½Þ;ÎÕ!cÁb.^pj{ñ¸Ã¿B,·¨C³ýSüJ9¡<>[¥Grä@á$©Ø
!É5ð¥4¡-³(Q´fJh
è¦£
£a¬ÅCJAq,ýÐq:öÛK­wOd±'8©TMÁñ!£Ö´|B¢öûx5"¬è¤êj×ºØ y®}ða;ÄzEX»z	«º(w¹Óúù±Å¶ÁÐ¼|sAâÄ¼¢ì|Ñcoé3"îB»¢ìB¿±À¡ÔåÂ_¹ùõUÿæ®¼<Úh4Ö«W¼\"ñ:f9æFV;µßAä>þàíâeê±ñ£mÍ¯W>KIF8ØÊ8Lv7¥B³º%MTr5ek(OTÃòU¡D¥¾DWÕ!è=}$ ²MAØî@H!:4§¨Bq¯Q	ÐÞa4ÇïUí>Û©oYÖ2ÇÀµ_ l-CíCÁtýAPçdÈ_]äCù
pöF6PêÓ
ÁÎÜUÃTÖSÎ óhæóÎ®õ4d%a°1ËÅ@Ã$pøE7æ³T+h=MÆsaèlåBÍË©¾·yÇhÝÄS £ÚÊ"tÚeu,¾Ã¦ //üüBT°\ù	UhÍ6OEy/ÓÁ]0'C%«³ÚlÄòqËåþwe6MMK«xpOß+ÅNÕt ïÕ÷b¹Èÿ«~Â Ã¯Ñ¼Í»ÈÏ;ðz"QÏÅ=}ýwª=}´ÐP=M¾½«1²ð:*)ÕH¼\¡Ãn¤8çCÃÞ÷×ÈæInCÝtÐ8>_dòPBó U¼»r0b»ÐhÕû³UþIoU/sBõÜ·:J¹ñ\t!N'û×cçø=Mà8aãj vX=}á©7ù~«ÆjË¾Jf¸ÞA¼gM÷ìkÀÃPf¹7DÓ&Q¦¯¾õ÷Ó~
=M&4¥Q[0s&Ä[aba¢».¤AÊV7Â9Ñ:Û%»m°! ½¶o×Äø½cBÃ6¶YM&ªÌéF7ø,ïÚ_¯hzéFÈ5ýÁéWìú1êÃ-ÒÙ»õÊo<9RM¼mßuu]UÈr>g7J9¦£J&²HktÆÙø_~tèd+íkBKGÑfR;9µG
Z¥vøJ#ºRºÝ«?9$´ÿF´µ±ËèöjØÈ|~= ZÊ\W4 {Å{xÌ)j¬^)Ã7Á6du,5µ-05f¿ýØ¨ÐòJ=M^ex?ÅgSøãOLáàe·MTT\P1QbãT¬¾Å÷×ôÎ×Y0+LN
£ëåë%15X¿Yq&ª,LM$LÍ|w¡ìÚ¼è¹5³T¡Õù=MÕAEaÌÎÝø+aüóMë­g# a'Àhþf­C54Üx×l·q@ºÚp>Ö.Tf°vuÜ'¸á\±Fï}5?³¯-0.KHÁ@	Ì¶\¹TY<¥
ò­!Nkd\X·,tÆ¯	ÛáÙÌ§cÁu~Äá³"âJ!éxcöh ðGõüµGØ«(ß"¯<ì¢Ø5JI×4\¬æÃ¶qpÒ»y½ZRùÞVúý¼{¦E}¸f7/>ñÅã@ð¿<æË~è;{à#0iû7¢'Ühl	~~C=}¿Åý9%)ÂýKZÝâßÊòÈ ù²læB2olæ±­¿Å³èJHÔ l&4\dÆÅYE	[ïlUî&[= éùm¿·×8
[z&|,X\Ûk°A¥evðý;èÒ(XÁ7§óïAµYÀ/Ë+ÕLM2Ñ$ÓÉµU¿Q¡ýæYJ¹Ü¦PõéüUÕÚXXXXXÈµþï?¹fÓyª_&ÀÖþ§Z jb{× ½*©Þh6Vâ»Öo^]£áAM±QBÍDÓM{é uÑL/5Á--´Qº>@¹z¶ðç}üòÍ,j_ø}NÂ|= ô )3 kçÝ{þ}l³o®òk=}ªeVÀ°¹ñØo÷t©, ¬c¬	°º¼Ù	w_Ãp*¼dØ¸»ÛÁQö£²ê¡*%k7Ú4XÐaÎWÓc¯[öøf .8û'àZ¨WqvC±;JÃ¬ä1Ù%êÒE'f&³5ÿøs¨Ý±4éäfÀÂ×«(h®Y¶#%X+ºþ¤Èº!ùð,Eq+nù0] c÷VÓG	Öôþ®Û´Ç³#A&}ÏU÷5Ie=Mfs¢¥Kk(¥[%)NDí>IS¨ùmlÞoîÛôúÝÀqô¿l½±ÃÙÚÖÃoovþJ£òªá©Î¥-%+­E>"Ð~fà%*	£CóLK&/8w£Û	&*$/¸©á	©K/øtèé½ômîÇ(cþ=}LX9
ø÷I¦~&[þd#|Òv\ò¤ê#eGÝ³T8ÐIn(ÊÓkÏl¾ÇÕ\´ÓÃF¤uÇõÚMôÁûp¥KYal×s1Þqþ\ù$aÜgÑ¨782þé'W 8X UCÞ\ÛZäåØ'j@ºÎ2·)Eâz¡´Êvì;_]^ÜWn=Mâ"Üi·roÒö#qxçfï¹îßxÓMÚâ½Ù5g¬zÝ-@¦cTóüÖSK!¶[ÓÉG²	´ÓMgH¿Q@o#Ë´û,Þ©Uù¤¢ÒAâcÇ¼pÙ®emõW1ûbîÇ8\ a²îiFp!I}ÕTÕI%SÕÁ5QÅRCIÕGÑUTPë	LËbT<ï{@d4¼ÊÆÜ'%A§´QEm¾ÖA¬µDÜîé¶}êú´òÄGÆrPfeÜAvØ5?Ûj^]*íÎpãÝ2nÃ¹
ãçâ«7;S©ÞÐ1ïH&t½Àa[Ò-Ðÿ?ß7>+;é¶T²rÁç´ä=MsMÆêÌ~}[cÀÐ÷½®Åû¡laj>£xüg§nEÒl!4xwígv·P.'Oæ)Ê­Ø|©NvaJF_XÁ¿hàùËã´CéUSrÖÝQl7éi,Ô,»¼é9ëñÔ*W/P/¨= 
4SÂ¿^¬2Ò
w®õOÒú6â%ìÀ³îj¦óOÊV}#¶Ó3ËÅ=M  ÙiÄ×$ö	Ù*ç9xçJÁ¥{ÐµhC@¨õÜ"k è~In{ èº¶Fñ ÿåÜ(ïdÞå6Ër[»Æ~oýG
d_­CTþèu|«¡[u+]¦Öì!õÝ¼*Ù
ë6GÁoôÀ[ôô|zK\7AûO­Uoc¶-p0*ÆÃâõ¯ôÓÆßoV!¿BapÅæúÂQäZXø¢H­\"æ»Úû,j¬ @ÍÁÅ@)eN|/4¹hpÂ¸G#µí¼ðD¼?VKwÑDür\y¬ºëoâHnY¬V}bËJ÷>=}á£R^ £¦«ú¡Ü%ÛÐù Z¾±u'Ô¾A³«º=}t¬ß³¾þøØx0®Òô= ;Ä­Ðz<·pBëãp$öæÔbk!uÄy¬¶ä±®ÆzMo¿ÜcÍD*¹·	Cý>äpºZZ;ED¡u£æøq§Jÿ*ÏúÜ=}»,þdëX~pú}¹¶GiájÛ= ìb1·^t/ä÷ß;go¼Ö¢'°ý}ÉÎÇ#[MV2èëvçàiÄo0ûjÉ~,]@ª®Q:oô2C|ÁKýÏlî Ì¯
ÈW¢[\çþæ	{NÐ¢Ãíz°ê¾>!·2¢+"á[R«	²j©la±¡¹lÓÕaÍ&FáUÌ9SÇ2ëµÑgm÷r²×Nê°-aRùü_LVèãù!29+å)>
pÊCÓ>Hiá¼íP"ø@aÕ~Àvu¤7):Á@gâ³Aû$9Qbòç9T?[·xvÑüv°tæ@4A~åxE÷Z148aÉi²Z1e p+VåEÅEAFãYMû= ,èíhÆØ	y
©àEN¡~Ô_lÆ~T4ð= ò¦õ^Þ¢ÊQ¾óûbvrÌ3ë§ª=MÝÝóÑZ_ëd>×<OU#ÅpÞ"õ1¼Ö'¶Jx¶^wEPß¾´Â kU?^©ÏDªLÉsn ù¬qÓÛjÒªa·ÙöÊµV§û¯eÑ¬¸dºò°d½I[¦v­D²òüp×F¦?´ 4@.bÞRÐ.+M[\= CÕ¾)Ví8sroÒÔFÀ(»±¢ä¡!ñÀGjt_Ã¥¼û¢QÐâuÒ¸ô0Öû´¨<¼±(Å.Þ¦Á+#«õ1Ú»]ýrê)üê±»~åjMNrKEÉå]³ìöÈÊ8{æ¦îF~7=}oVOåâÓ:ÆTK=M%MÉKm%f6a=}·2+VAÑY¹^¤¶7OfÒx)ãj1%aBHeHßøJùýa¬}À§ÅO®=}!à.¢'g7
ðQ¿ïaãôuô<ß¤×ÖuÙ¿¥hÝND Ü:¦\qUÀÁÑO8²795kÚU­Ù¢HvÎëµnOlÕZÁ¤<F)KÜÄ'ë"n³Õ|!$
Àá±þÂÈ',zI}:­}:íI©\!$Ú¦Ægd«ÒMQ;ËÆOHò;QÑØoMj<HwnÓÖ²èål¤_sëøYïWG@øÞKeË¾932ÅæØÕº=MÊ É¶ÊJ_UÚþM/ÑÆZÏeÿi*vÁ§K{¸ÙPª[ã\OìmÂpJùþ¿?ª1í\T-c?uaîwÒ+ùgfë_ÀOþFðj¤® RôºD¾<²úÃ½Ý£Ýdïì£½£°uºÕ%V­ÏÒGÊ-ºz×0l>*?à4ÓÐ,<ÇkÕ¹²ÉNÍÔÔ²Ò58mÄîr?å £ûP @bb^Y(±ålèÅo-hÅv=MöÅkÁR
mXÂDmÃ.Ç°dÙKU³ = LÑëø"Ôuqã>Kä£´0°ÒîdË U ÖÎ4V»@]f¨i= "¨»Øk°Âß9B=}!î¤5ìgýë©Úz¥¦TáJC!êF;4cÄ\VJYy'@úÿ°kÏ·ª{üj¦»
GN$e:iª¬ÙÍõ´ÊÜ²ÓaU¹Èßgº-vm5o<"DRÏ·*ëÀêhx÷= ÎÕóØê§ ®:ìÓ ÄF±ôZË> = íbC¦[É¿sDÜ-bÆÿ©n¯¸Óµùñb¥Öó¥Ìj®8%7Oüýb]Tb'ë´Ê¡ÜbFÝ[µ"ÚÃÀrº:P¦Ùt §2ë áØÅ6Júì¦é¬
h¾e¬îNd+;ÊÆÃsc7ÍâöKc"F¼îCq´}Á éi:(Ì@£ý¯>©'ªjaÔüÏªxûtð×êÏ?yg¶[QñmI9ã)DÚP¹f=M|«§¬ªØ1$~á%1Ô¦aÎÃ¤ÜQ¯ª¯X­×>hº¿ZïeÖ	ÇäÙ÷rAÙ!B:m8$;±{ÅO\%E%5ÕV+	¾Ð°kLkN|	iqÞ]&ce6Æ= y|Ù«c¶«yºè= ¬é4k?VkÈWÉ0Çdd¼Z[®ÓëWÚGå¯ @
Î¦	ô:º5Î wãé2£¬+sÉ°F ñ !Mê¹kÁ®j/V¢§÷1¤ê+oY"&h&CkR'zØÔ LyYÜ|p$Ç©J«{ò °6ÊúÝ¤ï¥ ü²âE ôNl]DG¾â[³"èGäuïöýøD±_º³òm«x5­´/763X¼ñgèå÷tÁ»×¿»Ð¼-¯N§OG±6ºy+þß­c^iÄkY;vùGÔz»wõÁn»Ã¢ÌQ~~jÃÕÂ.øu´]Ðã	®ìGMm¡G@Ît¿¯u«ÊÈèòþ@¹ËdKÎd6õíì2®ü.$a"Ç>}?'JVfoL·,;×%Pj<'ñ7á´¨ïÇÂË9Êo±îçÐ»¨Ë¡jÕ¸ÎúF'²R¾G÷£K
Nv0¡0:°K.¸¥.Úl¥Ùñÿ®^!¨d«pÆ}Ï+KÌè¸éIÈ¥¯¯WÄk
´ÊUeFÝ=M÷=}@í^Í(4_ïìâgíäÛäæsy·äZeGØÚ?Ñy=}é¯W\ÁéïdÁ90ªæíeÀo¢õpÚoÁ?ÆF·DÌ0~tïtjLD2¼ÃuÝ@¾aÅîë³Ò
C¾áHôÃZERvæðÁ< #&!àZ-Ê'©þéöBæÝ÷/ÕdH¨4ØÖ|À¤§b¢*ÏFXº £$SýôªÿPÓ¤ 4é}$±ÂÅ4$Ü]Èô0l}Y_@7ÏßÏÈ­Ö6M¼à÷èiØX= Iï¼Ò£«¨ì0$°u¦ëì~³þnÓ¶©±ÄÁ¨1]ö¼]cCaF9¹jé>­ä~^X0û)cqJxÅãrDuÊÔ9J&²/¥Lç#ÖxvÒº[³¸
(¬«k´ë¯ÝÜÆwêÃïâÅW­6Ý©³ÖaþV+¸{.@íºXózHÁ6@{)íjÂHùSÀ
'G¤Dîë-Ñté²N$ÎRÌ¤oî4÷vëì~I¼_c@ÂÝk95 ø§PD MJ´ÎxÑQ©ÃfaÔv0buÞLQµT 4eûÌúÃÁéq=}g°ì¿tïhÝ}ýºûBp}Ë Úè·­ 2ù&{íï_ÄÆi»íï
ÝÿÙë, ¹Hï:á= SÀ©Ñ1JdëÛ*}\½ùÌ_ÆkÞ:ÉÙÂ>dÇyîÐ)dH4Åî2SY$ÑÛ{TÂðsThæÐäö«-5^Ã®SÈE ^gOlö_¹/·´YûO
û+Ä¿ë¨ðetêüu¼t~#dê¬¦ð)6|ðô}óÇUæ0³Ô|Òjá/äå^ªóéýo¢øZ&ÌÇl,¹Fùä>í5voÓT[2'ÄtXè>õ°ÊJæG<Ä¬moKijÍÑeº¦ïk;ûµÍªÁìÀ#ùº}OD.ÓaÓºC<ÿh¥³@c.6ÿõMSëà+Î£¦ÕÄÃÐÓ$ZÉréÈÜb}l	 ¼e5KHk]\IóaGAk£¼Í"û
ûÏ³oõS	ÃI1ÉUÁñRÌK¼)$H1%)ùøumÃó5T:{)¤äTû¿ùðU»0ÐY@ÔQ¥Æ0RLÅ;ç±æýb|E¸ù$ùî\Âµ1v¶kMè5 ñ7¦0µ?m»Ìlõu³_ôÎ]_ªÊV;²·ÒiÃ]-gk0Úkø¯øw®yä°zbØèXD¯!jÍw¹cà.zj}ëïVØb8W@z»+ó5(= àaôdQnGhÍ*haóû{¤E°þépêà¡ozôNSÜku¬¯xäX¿åR|4.³@¸{£+Í*ï©k÷\Å	b?¾!þ¨´>r$ðëfÙã­o>¼9É¾Px)e´h jETêÕ= O¬IE Tóê)RÍbÏIsHI·ï<q:íÖÏ719A!HúÇµàzwo·ä¶?«vs×BÃ|3´ÛÊ³B>!·EK±µíü8¹d¯ÁÓ.
¦xë¿ç ·çÐMLúDqæ't¦-C÷¬#É]¬§ÙÅÑB³R..6Øà]ÌÌjzÈQéâuò-nE@ªÍ@éà"D*ßz¹i.g®àiüªè_{Y¬t§¢Ò¦ø7bä{ôè¢ïï¬8ó¼¼¬ã´{®EÎæÀDH¨ïªù
Ñ/MËlqIÜv¡d¡!«¨®C@X*YF_NÏ.³Üpú432~7j²7ßhÂüZõúçûÌEú6¤|[í×4w[S
ªý£Cê~j®Mìj¢IW»¨ûsøÔ,óÝ#
¿ÄÜ ÌgrÏ¹=M}Ìßù´G&ì6ïÊ! C°|ÓKcîëÿ¶^£¦ÌZT.ÀE_ò^ô72Ð\öV<1¡
Ùc&£ØX#d#¾Ìbp/5Û{o5ô:¢¨Æ©sñ©ân= 5×rê_2ü)«¤9ìkkÝuáuÙõXÀ,ËÜwòJ¢­¨sÇ«þ«¯ó8þLúb°Ò±åjXYã2aÎ»6#'·4ËúFÔË0+ÙÐT!RF°OæçÝÞZ+ ( 7/öf÷{Ì2Ü®Ætuõè-÷é|"víÙ2v_#|ù3>.gXÏ:÷rÂøv?>¶IÄ3ªÍÔ®i"ÿ=}p2^0J4º(7QRÐ¼á]ÑeÄäSÊØ-ÉÛMpû9xªzõ22TécÇÿS*T¡ÈÄÉQÉÒÉ©Q©Qõ½ë%ÂÄUol44*TÌÀUaÈÔÉQIÒÁ©Q=M¨Qµºë%ÃÄUû
£CEúLõ52TIÒÑ©Q=M©Qµ¼ëÄÄUl43*TÄÀUÊ.¦9ïß]¿vô.CbjºcQÅ_Ì½xYýT¤7©e®KzâeËdFj¢YãÛ,ãZ9üró#v÷"7ï?ë]ÿÍJ"Px"ç±è$pÙ¢Êÿ=Mè-xò±Ì{òp¡Ddú%¼W[w®}»##GT·é lÐ9ÜoL´ÉºÒcäªHW ª¬=MÁïÁX^rø!pJ#Úe±Üúo;¹æ9= hûé×@YÊ©[B|Æ£®TejëZ<jµ°­° ýÖÛ£D;U5B¶,râ	_¬ï0°å E9ùÐåNÖ= îoÇV¶ÅÂ¯½w-ô@ É©Zª²ïd'l¢íLÁ÷âs¦oÅ×ô°/Ò lN_3¦%=M#ü1¶ÈH_aÛzkhÈUGMñ79µC÷ó÷¤[XìÎÞyÑ¬ÑÕÌ¿»jU5±Ãêdª©&¨Ù:ó£òÝ¤Ý%Ý.Ý¥ð/NfJÊa/5H¡ÊøÉÅD>ó(©÷èqª3l>æ5MA3h0=M=}*¤¤Ã=}ªñ©Iòð;ªó¨,ÆÃÿ¦Ýy_õ|eªÙ= 6]k?.gûÖNG?È
çpIjâB°
âÒ {WGË&þvÈ|Ô¶lo8Ö=  ÆQyºrK+%>aô³àÄ·°Wý@Û«©ëþÐaf:hÇòê(»ÚfÎ¸Ëe NüýÔG« [DqÍrVËèE$cóDG*é¹sAºSY¹²J:(¶Û1zÃC¥4[óËÚ¯¡"¬ÎàNQLÊoòÜÅ|mÖÒ!%ÿõ¾vyfN¢,¼Õøñ1«
=}9vo»ÞcÚ/oCM6ÿ>IãýõÒÇ2Cf
®ôÄ~oyþp$\±(æ5j
o¸#KVÖÙÃÛdjbIÀd¸ÖI­¦àÝu²èÐ#Ñ>BUý/Ft4Ù= À,«&KÔH?IH)N"ÓeÞsçMñ?ï//ÅÍÅUÀÃK¢,$§8=MH00z/¯ò®ä[gu<ÖWY\"DXÈzQÊ°ò§ZròÖrn^fvvWlîyÖ2÷VY\Èfs^^vvÖÖ_: Ô+KPK@?Ïs¡§Â+«)+³«)3 	A3ÌÉã½ÖýÚ'Ù&]«Â2uYÂ×uì¡D]=Mä®|'B¦?´ÃÇRÜKøw¼{òâixÓØßñü¥®ß¥Põ&oíQÚãé^½íK_ñ}¹Ì»¡LÅ3:~Lo}«.îþ²zÑÚÃ{WºçÀá°Ý½)ñf»û/ÍjÇCÂ±³FÕÁRnzÇlæy?Lðl4×ß$elºvÑ{­/Pý¡ÑÊYí5ýXmÂÅÅ­KÂ<4GÆÌôêêÄ(qx%È,éÛÃ@³âû!Àca?¡½Ñ÷Äï¡Ñîªk'ì¤.=}+_¿"Æº±e¢ÀBùcCp¾Øp>ú¤:và÷¯¿ãÆ»5¹1¢lÂ1Ã0øcÇ¤«}¦{,	é´ëwÓ¤,vÇp¶ìv9ÑÂý}£}Ì¸ÆW0ÓTsq>ÂÝ_Í¿¸5ûN7í"F¡üPÍÖ.ÒQ¦W:RÈ·s~ùø÷WD4VbhwaûéÃx(c*ÞÜo§lá¸ÃÐ¹ãìª¢B'UR17?cÙMuÁÙ*=M]Îñ}eÒ¦Û"C47IS)ÏNJÄFàUbÒýO×[òu#=}=MÕ(¸º¬qA¯_B4ä»Äå\<Lú=M=M»ÄÉÂ
]Üs.wô1eOsíËÄýH&s5
*-óLÝNb2¢OyrÐxÅ6¹Áãëù¡Ã?>Ï§?ø)ê=}/(¥ÓäzLtëäÇ=}zòL,ñÞ:?srãçùûZÏ\ø? ü@b«óO+e"+,+eøi=M»K¹Ðüõ²ÊXmbõÔ³Sr:-S&= ®Sb9Wmqaê7u¼P¬Ã³Svï)_«GõL6@½ûuÚSï©4é¨m±.Ér+¯Ã´ûÒjG¸^µ¦ç8c<¨RÚàó|wiE*®WA? ±ªB G©GMª²Äf2É3|øë8sGk­ûÎåàñdÇË-ÓxLúNÒ´í8«ÄGpk¥{ÇëôAyxÄ;þN©äàýòÈª3Fömg%þN)áà½ó´ªÒù¯¶µ½x?Jø8±¤CJø8Ä	¢²!YÐgGò)!òâþÎ'?l«äo,\÷K;éJ®4«ü¥iøz7}¬ú= ÛÅéFSe,íKC¯GQ¥7~ÑäO²8{h©ÀRUêðû4½þaã¦%4|OKVÊô'è&¯öáâ¤i0[~õPCRÏ±DÆfIIÌð= ç³Åy¢0IÌÈÝþùÚÊçïÍ_:éÖ\bñ*|yß\îåcç>)½©.Ã-Å}ÄTê, ±'´kóÌûA^
*6-H5HP>Qûí;à x¶<ãÌaÂìñ{]¯¸	Ý11½	1'i0gñQû<5½èòe§=M;~eoÂ_¶A ÞyCªÃX}Ì Xñr-÷ý«F©Ø)ZyFMZZUÆì6ÃØÉZUñ6Zm_Tç6hZí_Tß6©ZEgÒð6õ_twÎõö{Nà6]'¤«	Þ+àÐAgÜÔ»Óþòðò>jCGÒi½±.0¸qæLÌÏmk&D°_Ï½YH[{u_=}êRÊ4«H©WOÃ{]:=Mêjæ5ªH¸ÔIWOè=}XHA ôc½ê2cýëiæ¥Ïv:vÅÏvõ¦Hª4¦ÈvgÈóAD°å'.>7>ùk³[ >= &k¦>&»mÖ~0[0«
Z°0W0§]ððV£jÃC h=}±¸Ë!áÍ{jØT ·\ñÇÏkX>9ÀÂØÜ7b]xà=}+jÚéæ4»«çÀp@«¦@+bª#Â+/ªOlOñº SÆò1ûøîÏôêáó§½§láÌ§lÉ$öò¯b¯ø¬ò¯¢Û.£»¹/øºò0¶t©Þ{8º_O«¸'qºbZÙÎ¦Ý8xÚ­¯9¶Ý qù;'0ñ¹¤"]ÉÎS0Õ«»XÑ*9 $«õ1¥6d9Cæ Á·¢T4d´C*ì;&Öt´5}0a{ºßvµåQ"T ý&¢[émK´ogÅ\8Ïï«u+¾"éYq*! >º5ÿí;'ð Í² {LÏÙÒ¯y&Ôþ'y"]z]<Íð¢¼íô
"Sâ-èä§þ[è+Û n*_N:ºìÞ/pÄÝáñü(,éðsZÜép
§Xe®±îhøWÀc}w¹rÒçÉ»tÆâ¬ryäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëÇäëgàÒGÀãsÁGÈ	+ Ðµ Î®ßT.gÑí ´·ÖÌGèCC/\:a hæ%O?Ö:ýXH1 ´dÅÏvÿ:ÖRÜè=}YH¯{%[:-ëqæ%~qæ¥Ï|võ¨HÊÔ¯»4ªHº÷:ÿÖ÷:Ì´­gÈsçÝ;KNðãðôhä´¸Jþø­k³Wøþ[Àk³\>X&[àì¡à<Éiößø¡´õ6*	Ádm¡$tu"(ügÊ¦÷1@nÚÿ´ÖÞ+Z´Ú+¡¦d+c\Pd"ªÓm-vAé ðy¾ó¯Ñßà¸FEçðEÍ¦l1ÄöÜä®K{êúøL²¯âOX ¸¹ÂåCp×t/ÿäX¡[Á	¿jâ	@1þþ.GZJ¦é·ÏAîÁú»ª«Å×û,-ì'¨Á«+å×}È5¹µ+yöÏ£UDõTçPþhTT}Q¥BÃªKiÒ   8Ï±hQÜ1íIÇÕ,¹6o
9&¢]ãÊy¸_ÜQ o^lxÊÝ4 $81:wãþ¶83oÃîË$&q¿"çQ@L´0ÀÐ\àrÔþªªbÊ¾L¶ÒY xÄ&êBW"Iðêî8³ÓßYqViEg¼HñÅ±= pK=}2iu{ñ®¬i®8¬sÙìþh!DÀð\ÑÚgâ³Xõwâ6v$gcÝhÝæ6³Úgr»ØM7fÆNô|Îë6gØ-^°Øug^TØ¶£F\kØõfÒÜ6_¡FlÉUZ­ÕØ56T_SiR|M¥F~M¥F±2ÅÉUG¤KÃÑÝÞÏÆ*tÏPÿ;¡áaIÉ	ó¨±.=}TÖ©PÃûÛ¤?=Mêrûërû5ªÈ>êý:&SÜèýÊ«÷©PË{Ý¤?	 dó(½êrû dó(°÷©°Ê èýJ4JäèYýJ{Ý¤?èýÊvMênæåÏvÏv~Ïv±{ÍYHè½XHØèýYÈ­»ëoæ ô= èW§HÄh#*mÝíM@Ú¹2LSÜ=M}|Ù1iéüû/uT?NC6ê¢hòè_e*hB%ümÜtêt~¹Ø,:*¢ØUD>¢Â/@çG¬å*¾NÃJÿ= µ×2y;UÆ­I]yðÝ³+rwÿôéç9¼Úð{zRã¹lS¤ªNY¾/!6F°ÑÖ°©­N>üÐ46tâ1nø¨scwÜ§EâZW	[¸~Ð, 7óA;ør7æcÙE²J
½è[\¤+ÿªlà
z,ö¿½ÿQò²=MËxG\¸Ô_èGjí}¯ÁãÑr¾Ñ"Ü£Ä,MA¹­ÉèE.,,AÝ]X%*À>o
ÍrCû êì-ÐLáphL=}Ý	tæSA/CW/åb½µfÑÅ!ÔËRUeÃ÷öV©Ö;"
ü¢.%êNäÖô= f¹EÔ¦§%®ëIñaÛèÊ9	l¶æbAaëçò;hÖùÍKPÏr=}yl%a&Ë-7©dµÆNí×é/öø
·sÃËÖXð?9d-ÔäÔ´Tæ³õ»¤ÚØÂ"QmId
Ú(!HºÊ;É·Â:ôç¬Õ¸+Ù<0ÁºFuiÚÓÿ½XÆÑ$9(SI'Øeqß^£FH¬´ç­àewîzøÝä¶òÍlÑu¬£e)ð¬"æ¢ÜaA«<|í"ý¸ÐwW>wìí$¿Nì~D|l¢Mg9Ê¨H7áÂzs!CA²ö=Mª4Ë°ïãÖÚXHLÓ7yÊ²ã7«N0<ýözaî	yGåxàè¯ôk	C|Ðí5ý^úyÞ>û  NäT/¼uÅjì¼#pôQMø}9ìÅ->7Z¿îP§µÆJd¸KKw¬5G(ÿÞëVÓ®=MhíÕÌ9°s?BzìMÉ¤ªoòY¾9Íÿ¢%4 "ô¡¹(Tg=M¥g&«è=MÆ.s¤eÆÝ/±=}Ñ[]gPéÜ£í¢ª¿õwÃtÑbÐ,üu¡q%ø\Ëq æcéº{´à¿æüXý>öM[ÃÎ¬O{½aäÐvöjæaöÁås¨åñôêläñc±¦lªÂÈÔ7ÂÄÉÂµäãúyÂyDwMvB¸§ìÛH¢ ÔØÂsdDôg­Nqþ×ta4ãkÏrÈv1?Äs90ËM<+Ú#3p7f´9³[':ìI>|G&\ÎU= ]Ó10&8Ù9ÃBGâ#´9,Ã)âáºëgOk\¦5LÞ9ÄjHzÉA4ªæhÈ°Ý\ý©9È¡o+2ÞOøpGm,yÁ ®YúãçÙ8ûäköt¬åºrR×)h§$¤m;BeJTx&µÑÙÞî h+v¦s¹ãNcþ&ÞóJ §¯É¦
5y}NR&\#3äÇo³¡<1<]R¬©M$v¡¥ùØ<Üµø¢ >ZOr=}ÀÕâöÀßÆ}xs:'ìbøîpxàMÿ® G¥ªBøÞM{eýª´ß'ÚnûÍOâjÛo~½;l¡GU.ÎØÒY×ºç®«kÔnµüF_Z·rã¹+ptAÙ¾Û~FzþÔJ+nÓ/¼{©ç°àîòàU@¦x¨¶èè-
9^è*ß!ò¾Ô7ê4èèµ®I1üðµ3w±ÈÔ7ª1j·Gé×R§	§BÃ-ç<m\HaðµÎöçZOÛyØ·ðµÔ·âFv*Ç/ìã%ÂØÂ!÷ðµ¼Ô²°çñ/i&xÆOÎ®ö¡"2i¼_¥9ñEkùø£Q¡êÄ$ö PÆTË²ÚõÞU Âb=}5d7}øFõëiO¥683wRjT¦»ÉU|T¿^gÛU£ªÏÏU!ÎÅ^gÛUªòUjTÏ^gÛUÃªòU4u¥75ëÉÀòéõã zÓã³j)¡ÈÞT(j=Mþ~OêÕvk Ø¥{Îusç6©#Ý5=}Ú:|kH®7z/Üë¼-´Ûþõf(o,DÈÔZûe§Ä}òþ<Y¤Äw8±WaX WÖ,6ÖÌÄ}¢ÂgÇõJÒÆkoãð ÛqPZ8Æ²JºLj)ê7ç^ÕµU~¶ þÈRáÆ¦!æ;½Q¯È-!%ìµB½Oû¹O½gÒõ;iÈ	RºOKÔì5ìµÏì±w!EL	Ò@®ÄÏì%ì5E½OÙ¹O¢®:4
nÆkjUðx=MË7Ú}Áº±öûäs7$Å±è¢ ß
ÚØý$XÚè4Â±þðÈ1[o¯Ãb´ÿj2Ë$Õ0R½Â¹g9¨´PòèXâÖªårÉ4e'Ü~éé¶RÙÖ÷3Òb×È$tÒÙÂÍî·¿!nüê6âv±?½â)b³h6ÛaW"çR6Z«\ëv4­Ëá/Õ¸±®­®pªÄTø_Õñ%¬9ÓIµRãT m,øcYS:ì*V°= {yîå59ÙÏY°M8ùVAóìµWhòi1àú 
ðÛjmZA= ~[ÊVvè§ß"ó634áò'ìPâºªSò£l§½BÆÂ´=Mô-.0²9ó"ð¹JÜúYëÕ°UÇÔÐµtbß¥ºâzdAÚ'ì!»
jêW?ÉI|Ú~áý!nnáèÏ@u@^/é*C=}8¬+·µo¡ëûlíÕ+ªÛIÒ¨Ù÷ÞS
oÊÚÊõptéq N¢·P1S01$Ãæï¼eÚ§wA9-·*u,fåëº(nÌ8æÕî~âPñî6zÍ«¦e	1kM*{k¸g=},i~èø¶â7L/Ç qÄÂñ,Z8½Þ¥:Ý<ÚÀòQZú%|0ÏßV¦Ô i_ú»qµ ² ÝÇíÝ,l*àú= ÄC=}jµÚJzaö5ÎioûsOyµØxF'âJÊ]yÕyÞÚ¶B2À!LG¢Ðú¨ß&*Çúô¹âj-lKÿÅ(^Fsq5¢#~DÃ§RÅpmí)¡qªz4»+ìfýhbÛ²;âú¥zr¼iñwôZo¸ÝùM$!Iç¶ad-&vÏðÞ7úêËÖÎH­iÏzRÐÚËA$#+ê<¹-t:DÅÂ½]ozYwîóÐH¼Ëðñïç¬¹¬X«£ÃTµ6uAHÐ£ð£ËêIuI%ÕfÕ¡Ã¸õy5BÁiÃ»!JÓôÝÈ¡9ÂtTæøÂ÷8=}Ó ¤é:Üz(±û÷Kb¡ô0ÐúÌ®»¹)ñ­ÃOw%MêD¨]l<ÇÅRºêçGÞ°@<«øúÎ½q¸ÊÕp Ò.üÝ6P¡\ÞßIG}Mp/qÇÑ¿v,§<)Ø&êËFªè:ì\Ìr_N\ë¸ñb+ýàzÍÝ´'R¡ÌGÙ|ÏÆ¶
j¦sÏ0ìþjðW)°âmSúç'á8ºI.ÄhÐÌðÑëÕÔÿu$Cl±Â{}(L ÛûøN%=} ôÆáU¹êb×Ü·2]îý±m¯ñÃ;cí8·8FdßùuÝMlÅFdto}ìÒ!S!H
qiÎç0nw¡¥W¯XQ¯¸.vY½àPfÂðºêÐÔ»0ºMZ÷Çÿ0= £évGµ·F,Ý×·ñoG§v{H&xëh±ÚjEÔ¤à;66ÏÕ3óÍz;Ï§4ë¥;±Í$MàGêá&Ðëo!3WØ"^°Uµ´Ôù½,b#%q´@;lxb_mÅ¹Q¢óÐÊö´36ÁRp!
òòÉu-;Hq;§Ï©ÔVcWHT4\VdaZ¼¢·V'daÿx]d_rqhkzyÆÍÔÏÂÁ¸»¥ª©°³6=}D?RQHK.5,' #æíôïâáØÛþü÷
	$12+(UNGL9:C@=MûøåÞ×Üéêóð}vunglYZc= ­¦¯´¡¢Å¾·¼ÉÊÓÐßäÝÖëèñò ùúOTMF;8AB%30)*¿Ä½¶ËÈÑÒ§¬µ®£ otmf[Xabw|~¤¨«²±ÌÇÎÕÀÃº¹x{\W^epsjiÿöýìçîõàãÚÙ4/&-"!<7>ZY¶vVVXÐ1Ã1Ã1¼Ã1Ã1Ã¹13UÓ[whw\øÈ÷VHcè÷°÷Y0 e\ =M÷= À @÷÷Zà@þ¤6r¤AlDAü6i¦ÕF¬uFbå^!§Á­]cñ«e	= 9¨*yäùáI)©ß1Ó&Ñ,qâáSÞ%S'ÅN-WR%@q1I?yèBÈE DD´rÄäÄC¼¢Dª"
$Ø$CÂâî¤BÎbEbÞÐÖdY= ØVÎÅ=MÃ1Ã1#0Ã1ÃóRÏÜlÝßn5(	ûj(¬+ök·¼=MÄBÃÃV}0jä8ÆÁ¿Ã.ßCtq±³¿åCt51}6©I=Mv*T&)Ô1Ä=M³ÌÜmC
s9h
#äIÃg½Æ£¢³I´·[ì@ÇÛaÑÆ¦ÍAÒ-µFµcú\uô6ûÔ,ÍåÆY­ü,y*-Ì>Ã[Ü·
¤+_nþ&a3qÈÁ§Öà°[û¦²©ÀpºÐãÝp­Wg$8X8XÆoåÞaÉèåÝÈFáVR}9nVÇWNàuúYEÞaÁ|VqqÌ·ÇWÜézâS[¶e/zQ®¤²Vì¶ÇWî¸nþYäVV^öÂDÊ}^wfhXwÚÚ^wfhXwïwwf^ÚÚfXwwf^ÚÚESÞMEMõõ{U]xWxòÈâf¨²Éábmx$oÀIß\>ø#m¥~ù a= ÈårÌ"	ÞY8"h±Î9!dtÂäq¹î¹Z"ãkbà_Ynø%µ@ïdÀ6Þüp:ê,0ùÛéäÁ<ðDÐ÷åÄAûé!@8Øä0=}óHPöàúì5T 9Ýð Qüî=}´7ã Ñ;çàÐøÖÝDAJÖVlZV<|QÃ1Ã,ÃyÀ1Ã1ÃA3·Ü= ¦×ÄNbZs¶rÔØµbÒcvÒWL·k[}o2×¡.VUÙa¡R]ÕØ[Fs«F]ÄÙ¦^6¾XF\ªÎ^¶Î[4gFo$FW2Ý³m×W>÷§åpÅpµ§[ãõþ¼ª³¹öß= þ@þ)®S¾lø'Ã#Q¾'R(Òá4µ­ð>ß<vqóñ+ßo",¡ñ,<<©¡ô¸p°ëî¸",ÌÓ(Ì
sÌp,¾¸Õ¹!0E0¥0DRÁR=MDÕRÄ¡=Ml5åõ@ÄTøÑÞ5Ë9àó¬2ÙdÓArÊÇ!$Äþ))B@åJ½ßqS8GUøUç~ß%PK ÔUÇ÷=M|2K0_)q{êiðÐÕÐûÚeíÚZJ.>w;;1>;-þ»ª¡?ý¢ã8þíÈúÂ©,5ÿ9ðÇKî©©5ãeí*»@4ÎòDo} wËc\	úãx?ðÊÎNèú½ÙÐ¨+öºFí
2zuéEÜCºòoäè!£¨HÝ7¡H¹ÜjðïÕÛ[Iõo,#]<éOðE"­7å¯wð4¥m		=MJÓP+Â»¡õîc(?Ï¼ýó
·02Êóïô(ô)£+J·°üSñ$Ù:lÊ¢rî\¹éàyNc |Eé_VO5ßsù^VLjQrV¥çë.¸*7Ôi*à7Ú%N§:9{·ooäÕßò£ÝÞ+¯;xÜÞ=Måx@7w¸HHùæ²ãâ¥Ç×=M:Ó yÈ½mÏ>tÆVfVVÚ4i0r,ü#¹Ãä)ó9^wÚf^wÚf^wÚwÚf^wÚf^wÚf^wR5MPõ\|NðÃÉÄ:âÚ<p»ÓeûU¶ u@±îÛÍí6£}ÆWyÿ*ÿªÚÐ¬à ¥Óÿo»ùâ*
H¬ñÀ£¿[ÆW¥e|°²!Ùk¾¾uC^@0pvVr^v2ßà¾á"ÚîäÎÞ	HlQGjq%HAhm¸vüºo^Èdàå|.Zyèd4úÀ&aÓÜÓ_9·ô¾yRÚ°e-j§näCîì$Ì'D¯¹ÅBçë5¬) /}ªÆ$iKó_àù	Èp>Ùä¤ss:L]tFITUÐÃÅD=}RÚI4P»ÍÄaU2jt8ñËEá¡DciÍ7Nå÷ÆÂ÷9Ô
¿àù*¿à¦@^±r,1lÀÉ±Ãä.ºA.¿ å¾sýëû¿ûÃ?øË±Ãä.ºA.gñÂo¹÷M%I«Eµ |*p+XÙõërd ûÄÎ®Ç¯®æxànë°×å" rããÝmêQ!yçg.Þ2yðéÇ %ÏÂÓë ¬¢aòôú?Ã¹úÃëúÌæÈ¨°Snðts¼Lî¨O*ÔeñÆ2Ð2æøE ¨=};?KãÊÇ°6òGò»ð«ð0,¤tË,À}1fÇ$Ûõ(µ¼d*±AcïN(©ß©*N~C[Údôl(çJø)î_ó|çîî°Ù¥ !òã£}jªQiçbyMâ<ì¦J2è­*M@Ðs«×11ì«P1 ¿»±u¯nÆ\
[Lñ¦óu¿l¢|4*!]Ä®ÅnìY¨Õ¥où³46øèvv^¨aáóÛDD:¸¸ÇÀzIpÉZ³¬&9E_9ì¸¡ÉY/ûmimÿB~=}+ÙPhÎî×"~VÂîKDü:¢¸¼ÀiôéÏßj!½kQñ	!ç/.B2!ðO Ò%kÏ´Ó3¥"a²´:?Âaú[Ãs:2¬½Ìc ûÉ9Ã<l)rÔ¤ÕaÁnF¯Ó\Ù@ÿwVÀúX¨ãùØÀúû9b?:ÎíÀG¤X¸ i½°ü¯g+Å\ïC¨=M «Í?#W½*ïÈÏÙ{eôu§?©Ózgçí W²¦CÚª½«¨÷·s,¬¯ý³ãGW­ÞA£AOcla²jãü:|¸y»ë^ùä>·q
Û3Â1ÃBV}=Mi~²ÌpÍBÍaç÷óB1¿ý·ÏË/3ÝEKD[MdàÝ¢ÝNÙì¨.kÇ·ûe~ù«¶»¢Â"í¯ 7à[¬D[@èË+~cÊùÙo×>¦c±ÃìÀb¡Û¾û0;dþÙÄÍÆ~^mÀ¸ñÃ#¨évYÖx¾QF´Å.mAj¢³Òýû]DäÊ¹]:8WËµ]3ùEDöÍÛó¦ækÃøj}õô%gÒV¸¥}ü}R©!yNÇ:LMÜÒAÐ'Gî\¹-ü-R!¡N:[L(ZÒ ÔxÜþeH>ySGtÓ}4Ýj·¡àÐÕ3·Óoøí¹@ÁÍ¬Ðñ8MÞ¿7 ¾ë¤É= Z·óGÐÔìî¤¼²{Î¤ð¥¥ò-²ZKÂÖ$´µx¼èÉï$%_´ëlIh­Vù¡5ßv<t¢ÓÓ$ÄÍÖ$½íQ[Ç«0jÀÔ[ÔWTøG-~ÀSÛSíÚïR= IqD=MR­Ùw?¡HíiS3iS©ºéOgÜ7¬=}¹MÐ#U²2rä]êd3ÁSºO{¼Ç=}aM±Ðe1U2kä¹ ¤#ÕuT]Ë°UÃUmæ½T%SåU¯Æ¦PÿRé¨ù[åãÿ>_AnQ®8zõÇÎÍÆÊðn[*@vÓ|¨½ôÜ6ã$MÎð¼oÕ®s$Þ¤¨ÀÖ¬³4Ö
îId35ó£ÉAõwÝ½Éê|£WÎi·÷=MCÞ±úõ¯:O6?ÒnÎö±5Ö±ÑNÓ½çÑÓÝAµ}à7+' ¦IF¥Fõã5U¶/áßè¹ÓéUÓFÁèzÝiµ-RfR}Re9e&±¡Bd8Å:µïEÉ59UhRjë;ÍÖw3wS:éjQÞÕÆ2]>MBUÔg4m3~Vh¢Ù©f^#FÊXwí(ÛÂÅfIúr±/¤0?óBtTö®Cëe~qWo4Üá+N8wÏådÍNý8y¿ÔübWuZRdÏã8Nqøk¾]ñ·l?²v@\ÜûO² è;ÉVW¨Tñ×óçí÷çÙÛ'å7ßGWgýw÷	§·ÇTWNgHwJ<6§@·BÇ$×ç÷,&'072GªW¨g®w´¢ §·Çº×¸ç¾÷ÄÒÐ'Æ7ÌG×ç÷'{7yGWW]gcwaou§k·iÇÙéù	)}9wIYY[iey_qs©m¹gÉ¬Y¦i°y²¤©¹É¼Ù¶éÀùÂ	ÔÎ)È9ÊIRYPiFyL:8©>¹DÉ"Ù éù	*().94IïÙõéëùé	×Ý)ã9áIÿYiûyù=M©¹ÉþXhúxø¨¸ÈîØôèêøèÖÜ(â8àH#Ø!èø+)(/85HSXQhGxM;9¨?¸EÈ½Ø·èÁøÃÕÏ(É8ËH­X§h±x³¥¨¸ÈXXZhdx^pr¨l¸fÈØèø(|8vHªÅÅvÃ·ÄÏv¿ÄÆËÊv¸Ë¼¼»ÈÉVVVVTVTUTUU VVV¥æoVÚ::WÈîm]ì=}äeb»'ë¾¹Ýý×\yî!6îñg¸	î±Þs ÞYÞ½Y_l\2U×ÖÇ×_yÆÈhWs7<9X7\8k ¦\|2v²©£ïjúV` });
  var imports = {
    "a": wasmImports
  };
  this.setModule = (data3) => {
    WASMAudioDecoderCommon2.setModule(EmscriptenWASM, data3);
  };
  this.getModule = () => WASMAudioDecoderCommon2.getModule(EmscriptenWASM);
  this.instantiate = () => {
    this.getModule().then((wasm) => WebAssembly.instantiate(wasm, imports)).then((instance) => {
      const wasmExports = instance.exports;
      assignWasmExports(wasmExports);
      wasmMemory = wasmExports["j"];
      updateMemoryViews();
      initRuntime(wasmExports);
      ready();
    });
    this.ready = new Promise((resolve) => {
      ready = resolve;
    }).then(() => {
      this.HEAP = wasmMemory.buffer;
      this.malloc = _malloc;
      this.free = _free;
      this.create_decoder = _create_decoder;
      this.destroy_decoder = _destroy_decoder;
      this.decode_frame = _decode_frame;
    });
    return this;
  };
}

// ../../node_modules/@wasm-audio-decoders/flac/src/FLACDecoder.js
function Decoder() {
  this._init = () => {
    return new this._WASMAudioDecoderCommon().instantiate(this._EmscriptenWASM, this._module).then((common) => {
      this._common = common;
      this._inputBytes = 0;
      this._outputSamples = 0;
      this._frameNumber = 0;
      this._channels = this._common.allocateTypedArray(1, Uint32Array);
      this._sampleRate = this._common.allocateTypedArray(1, Uint32Array);
      this._bitsPerSample = this._common.allocateTypedArray(1, Uint32Array);
      this._samplesDecoded = this._common.allocateTypedArray(1, Uint32Array);
      this._outputBufferPtr = this._common.allocateTypedArray(1, Uint32Array);
      this._outputBufferLen = this._common.allocateTypedArray(1, Uint32Array);
      this._errorStringPtr = this._common.allocateTypedArray(1, Uint32Array);
      this._stateStringPtr = this._common.allocateTypedArray(1, Uint32Array);
      this._decoder = this._common.wasm.create_decoder(
        this._channels.ptr,
        this._sampleRate.ptr,
        this._bitsPerSample.ptr,
        this._samplesDecoded.ptr,
        this._outputBufferPtr.ptr,
        this._outputBufferLen.ptr,
        this._errorStringPtr.ptr,
        this._stateStringPtr.ptr
      );
    });
  };
  Object.defineProperty(this, "ready", {
    enumerable: true,
    get: () => this._ready
  });
  this.reset = () => {
    this.free();
    return this._init();
  };
  this.free = () => {
    this._common.wasm.destroy_decoder(this._decoder);
    this._common.free();
  };
  this._decode = (data3) => {
    if (!(data3 instanceof Uint8Array))
      throw Error(
        "Data to decode must be Uint8Array. Instead got " + typeof data3
      );
    const input = this._common.allocateTypedArray(
      data3.length,
      Uint8Array,
      false
    );
    input.buf.set(data3);
    this._common.wasm.decode_frame(this._decoder, input.ptr, input.len);
    let errorMessage = [], error;
    if (this._errorStringPtr.buf[0])
      errorMessage.push(
        "Error: " + this._common.codeToString(this._errorStringPtr.buf[0])
      );
    if (this._stateStringPtr.buf[0])
      errorMessage.push(
        "State: " + this._common.codeToString(this._stateStringPtr.buf[0])
      );
    if (errorMessage.length) {
      error = errorMessage.join("; ");
      console.error(
        "@wasm-audio-decoders/flac: \n	" + errorMessage.join("\n	")
      );
    }
    const output = new Float32Array(
      this._common.wasm.HEAP,
      this._outputBufferPtr.buf[0],
      this._outputBufferLen.buf[0]
    );
    const decoded = {
      error,
      outputBuffer: this._common.getOutputChannels(
        output,
        this._channels.buf[0],
        this._samplesDecoded.buf[0]
      ),
      samplesDecoded: this._samplesDecoded.buf[0]
    };
    this._common.wasm.free(this._outputBufferPtr.buf[0]);
    this._outputBufferLen.buf[0] = 0;
    this._samplesDecoded.buf[0] = 0;
    return decoded;
  };
  this.decodeFrames = (frames) => {
    let outputBuffers = [], errors = [], outputSamples = 0;
    for (let i = 0; i < frames.length; i++) {
      let offset = 0;
      const data3 = frames[i];
      while (offset < data3.length) {
        const chunk = data3.subarray(offset, offset + this._MAX_INPUT_SIZE);
        offset += chunk.length;
        const decoded = this._decode(chunk);
        outputBuffers.push(decoded.outputBuffer);
        outputSamples += decoded.samplesDecoded;
        if (decoded.error)
          this._common.addError(
            errors,
            decoded.error,
            data3.length,
            this._frameNumber,
            this._inputBytes,
            this._outputSamples
          );
        this._inputBytes += data3.length;
        this._outputSamples += decoded.samplesDecoded;
      }
      this._frameNumber++;
    }
    return this._WASMAudioDecoderCommon.getDecodedAudioMultiChannel(
      errors,
      outputBuffers,
      this._channels.buf[0],
      outputSamples,
      this._sampleRate.buf[0],
      this._bitsPerSample.buf[0]
    );
  };
  this._isWebWorker = Decoder.isWebWorker;
  this._WASMAudioDecoderCommon = Decoder.WASMAudioDecoderCommon || WASMAudioDecoderCommon;
  this._EmscriptenWASM = Decoder.EmscriptenWASM || EmscriptenWASM;
  this._module = Decoder.module;
  this._MAX_INPUT_SIZE = 65535 * 8;
  this._ready = this._init();
  return this;
}
var setDecoderClass = /* @__PURE__ */ Symbol();
var determineDecodeMethod = /* @__PURE__ */ Symbol();
var decodeFlac = /* @__PURE__ */ Symbol();
var decodeOggFlac = /* @__PURE__ */ Symbol();
var placeholderDecodeMethod = /* @__PURE__ */ Symbol();
var decodeMethod = /* @__PURE__ */ Symbol();
var init = /* @__PURE__ */ Symbol();
var totalSamplesDecoded = /* @__PURE__ */ Symbol();
var FLACDecoder = class {
  constructor() {
    this._onCodec = (codec2) => {
      if (codec2 !== "flac")
        throw new Error(
          "@wasm-audio-decoders/flac does not support this codec " + codec2
        );
    };
    new WASMAudioDecoderCommon();
    this[init]();
    this[setDecoderClass](Decoder);
  }
  [init]() {
    this[decodeMethod] = placeholderDecodeMethod;
    this[totalSamplesDecoded] = 0;
    this._codecParser = null;
  }
  [determineDecodeMethod](data3) {
    if (!this._codecParser && data3.length >= 4) {
      let codec2 = "audio/";
      if (data3[0] !== 79 || // O
      data3[1] !== 103 || // g
      data3[2] !== 103 || // g
      data3[3] !== 83) {
        codec2 += "flac";
        this[decodeMethod] = decodeFlac;
      } else {
        codec2 += "ogg";
        this[decodeMethod] = decodeOggFlac;
      }
      this._codecParser = new codec_parser_default(codec2, {
        onCodec: this._onCodec,
        enableFrameCRC32: false
      });
    }
  }
  [setDecoderClass](decoderClass) {
    if (this._decoder) {
      const oldDecoder = this._decoder;
      oldDecoder.ready.then(() => oldDecoder.free());
    }
    this._decoder = new decoderClass();
    this._ready = this._decoder.ready;
  }
  [decodeFlac](flacFrames) {
    return this._decoder.decodeFrames(flacFrames.map((f) => f[data2] || f));
  }
  [decodeOggFlac](oggPages) {
    const frames = oggPages.map((page2) => page2[codecFrames2].map((f) => f[data2])).flat();
    const decoded = this._decoder.decodeFrames(frames);
    const oggPage = oggPages[oggPages.length - 1];
    if (oggPage && oggPage[isLastPage2]) {
      const samplesToTrim = this[totalSamplesDecoded] - oggPage[totalSamples2];
      if (samplesToTrim > 0) {
        for (let i = 0; i < decoded.channelData.length; i++)
          decoded.channelData[i] = decoded.channelData[i].subarray(
            0,
            decoded.samplesDecoded - samplesToTrim
          );
        decoded.samplesDecoded -= samplesToTrim;
      }
    }
    this[totalSamplesDecoded] += decoded.samplesDecoded;
    return decoded;
  }
  [placeholderDecodeMethod]() {
    return WASMAudioDecoderCommon.getDecodedAudio([], [], 0, 0, 0);
  }
  get ready() {
    return this._ready;
  }
  async reset() {
    this[init]();
    return this._decoder.reset();
  }
  free() {
    this._decoder.free();
  }
  async decode(flacData) {
    if (this[decodeMethod] === placeholderDecodeMethod)
      this[determineDecodeMethod](flacData);
    return this[this[decodeMethod]]([
      ...this._codecParser.parseChunk(flacData)
    ]);
  }
  async flush() {
    const decoded = this[this[decodeMethod]]([...this._codecParser.flush()]);
    await this.reset();
    return decoded;
  }
  async decodeFile(flacData) {
    this[determineDecodeMethod](flacData);
    const decoded = this[this[decodeMethod]]([
      ...this._codecParser.parseAll(flacData)
    ]);
    await this.reset();
    return decoded;
  }
  async decodeFrames(flacFrames) {
    return this[decodeFlac](flacFrames);
  }
};

// ../../node_modules/@wasm-audio-decoders/flac/src/FLACDecoderWebWorker.js
var DecoderWorker = class extends WASMAudioDecoderWorker {
  constructor(options) {
    super(options, "flac-decoder", Decoder, EmscriptenWASM);
  }
  async decodeFrames(frames) {
    return this.postToDecoder("decodeFrames", frames);
  }
};
var FLACDecoderWebWorker = class extends FLACDecoder {
  constructor() {
    super();
    super[setDecoderClass](DecoderWorker);
  }
  async free() {
    await this._decoder.free();
  }
  terminate() {
    this._decoder.terminate();
  }
};

// ../../node_modules/@wasm-audio-decoders/flac/index.js
assignNames(FLACDecoder, "FLACDecoder");
assignNames(FLACDecoderWebWorker, "FLACDecoderWebWorker");

// src/decode-flac.src.js
var EMPTY = Object.freeze({ channelData: Object.freeze([]), sampleRate: 0 });
async function decode(src) {
  let buf = src instanceof Uint8Array ? src : new Uint8Array(src);
  let dec = await decoder();
  try {
    let a = await dec.decode(buf);
    let b = dec.flush ? await dec.flush() : null;
    return b?.channelData?.length ? merge(a, b) : a;
  } finally {
    dec.free();
  }
}
async function decoder() {
  let d = new FLACDecoder();
  await d.ready;
  return d;
}
function merge(a, b) {
  if (!b?.channelData?.length) return a;
  if (!a?.channelData?.length) return b;
  return {
    channelData: a.channelData.map((ch, i) => {
      let bc = b.channelData[i] || b.channelData[0];
      let m = new Float32Array(ch.length + bc.length);
      m.set(ch);
      m.set(bc, ch.length);
      return m;
    }),
    sampleRate: a.sampleRate
  };
}
export {
  decoder,
  decode as default
};
