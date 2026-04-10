// ../../node_modules/@thi.ng/errors/deferror.js
var defError = (prefix, suffix = (msg) => msg !== void 0 ? ": " + msg : "") => class extends Error {
  origMessage;
  constructor(msg) {
    super(prefix(msg) + suffix(msg));
    this.origMessage = msg !== void 0 ? String(msg) : "";
  }
};

// ../../node_modules/@thi.ng/errors/illegal-arguments.js
var IllegalArgumentError = defError(() => "illegal argument(s)");
var illegalArgs = (msg) => {
  throw new IllegalArgumentError(msg);
};

// ../../node_modules/@thi.ng/errors/illegal-state.js
var IllegalStateError = defError(() => "illegal state");
var illegalState = (msg) => {
  throw new IllegalStateError(msg);
};

// ../../node_modules/@thi.ng/bitstream/input.js
var U32 = 4294967296;
var BitInputStream = class {
  buffer;
  start;
  limit;
  pos;
  bitPos;
  bit;
  constructor(buffer, offset = 0, limit = buffer.length << 3) {
    this.buffer = buffer;
    this.start = offset;
    this.limit = limit;
    this.seek(offset);
  }
  *[Symbol.iterator]() {
    let j = this.start;
    let i = j >>> 3;
    let b = 7 - (j & 7);
    while (j < this.limit) {
      yield this.buffer[i] >>> b & 1;
      if (--b < 0) {
        i++;
        b = 7;
      }
      j++;
    }
  }
  get length() {
    return this.limit;
  }
  get position() {
    return this.bitPos;
  }
  seek(pos) {
    if (pos < this.start || pos >= this.limit) {
      illegalArgs(`seek pos out of bounds: ${pos}`);
    }
    this.pos = pos >>> 3;
    this.bit = 8 - (pos & 7);
    this.bitPos = pos;
    return this;
  }
  read(wordSize = 1, safe = true) {
    if (wordSize > 32) {
      return this.read(wordSize - 32, safe) * U32 + this.read(32, safe);
    } else if (wordSize > 8) {
      let out = 0;
      let n = wordSize & -8;
      let msb = wordSize - n;
      if (msb > 0) {
        out = this._read(msb, safe);
      }
      while (n > 0) {
        out = (out << 8 | this._read(8, safe)) >>> 0;
        n -= 8;
      }
      return out;
    } else {
      return this._read(wordSize, safe);
    }
  }
  readFields(fields, safe = true) {
    return fields.map((word) => this.read(word, safe));
  }
  readWords(n, wordSize = 8, safe = true) {
    let out = [];
    while (n-- > 0) {
      out.push(this.read(wordSize, safe));
    }
    return out;
  }
  readStruct(fields, safe = true) {
    return fields.reduce((acc, [id, word]) => {
      return acc[id] = this.read(word, safe), acc;
    }, {});
  }
  readBit(safe = true) {
    safe && this.checkLimit(1);
    this.bit--;
    this.bitPos++;
    let out = this.buffer[this.pos] >>> this.bit & 1;
    if (this.bit === 0) {
      this.pos++;
      this.bit = 8;
    }
    return out;
  }
  _read(wordSize, safe = true) {
    safe && this.checkLimit(wordSize);
    let l = this.bit - wordSize, out;
    if (l >= 0) {
      this.bit = l;
      out = this.buffer[this.pos] >>> l & (1 << wordSize) - 1;
      if (l === 0) {
        this.pos++;
        this.bit = 8;
      }
    } else {
      out = (this.buffer[this.pos++] & (1 << this.bit) - 1) << -l;
      this.bit = 8 + l;
      out = out | this.buffer[this.pos] >>> this.bit;
    }
    this.bitPos += wordSize;
    return out;
  }
  checkLimit(requested) {
    if (this.bitPos + requested > this.limit) {
      illegalState(`can't read past EOF`);
    }
  }
};

// ../../node_modules/qoa-format/lib/common.js
var QOA_MIN_FILESIZE = 16;
var QOA_SLICE_LEN = 20;
var QOA_SLICES_PER_FRAME = 256;
var QOA_FRAME_LEN = QOA_SLICES_PER_FRAME * QOA_SLICE_LEN;
var QOA_LMS_LEN = 4;
var QOA_MAGIC = 1903124838;
function qoa_clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function LMS(h, w) {
  const history = new Int16Array(h || 4);
  const weights = new Int16Array(w || 4);
  return { history, weights };
}
function qoa_lms_predict(weights, history) {
  return weights[0] * history[0] + weights[1] * history[1] + weights[2] * history[2] + weights[3] * history[3] >> 13;
}
function qoa_lms_update(weights, history, sample, residual) {
  let delta = residual >> 4;
  weights[0] += history[0] < 0 ? -delta : delta;
  weights[1] += history[1] < 0 ? -delta : delta;
  weights[2] += history[2] < 0 ? -delta : delta;
  weights[3] += history[3] < 0 ? -delta : delta;
  history[0] = history[1];
  history[1] = history[2];
  history[2] = history[3];
  history[3] = sample;
}
var qoa_round = (num) => Math.sign(num) * Math.round(Math.abs(num));
var qoa_scalefactor_tab = Array(16).fill().map((_, s) => qoa_round(Math.pow(s + 1, 2.75)));
var dqt = [0.75, -0.75, 2.5, -2.5, 4.5, -4.5, 7, -7];
var qoa_dequant_tab = qoa_scalefactor_tab.map((sf) => {
  return dqt.map((dq) => qoa_round(dq * sf));
});

// ../../node_modules/qoa-format/decode.js
function decodeHeader(stream) {
  const magic = stream.read(32);
  if (magic !== QOA_MAGIC) {
    throw new Error(`Not a QOA file; expected magic number 'qoaf'`);
  }
  const header = {
    samples: stream.read(32),
    channels: stream.read(8),
    sampleRate: stream.read(24)
  };
  stream.seek(64);
  return header;
}
function qoa_decode_frame(stream, audio, lmses, channelData, sampleOffset) {
  const channels = stream.read(8);
  const sampleRate = stream.read(24);
  const samples = stream.read(16);
  const frameSize = stream.read(16);
  const dataSize = Math.floor(frameSize - 8 - QOA_LMS_LEN * 4 * channels);
  const numSlices = Math.floor(dataSize / 8);
  const maxTotalSamples = numSlices * QOA_SLICE_LEN;
  if (channels != audio.channels || sampleRate != audio.sampleRate || samples * channels > maxTotalSamples) {
    throw new Error(`invalid frame header data`);
  }
  for (let c = 0; c < channels; c++) {
    const lms = lmses[c];
    for (let i = 0; i < QOA_LMS_LEN; i++) {
      let h = stream.read(16);
      lms.history[i] = h;
    }
    for (let i = 0; i < QOA_LMS_LEN; i++) {
      let w = stream.read(16);
      lms.weights[i] = w;
    }
  }
  for (let sample_index = 0; sample_index < samples; sample_index += QOA_SLICE_LEN) {
    for (let c = 0; c < channels; c++) {
      const scalefactor = stream.read(4);
      const table = qoa_dequant_tab[scalefactor];
      const slice_start = sample_index;
      const slice_end = Math.min(sample_index + QOA_SLICE_LEN, samples);
      const slice_count = slice_end - slice_start;
      const lms = lmses[c];
      const sampleData = channelData[c];
      let idx = sampleOffset + slice_start;
      const weights = lms.weights;
      const history = lms.history;
      let bitsRemaining = 60;
      for (let i = 0; i < slice_count; i++) {
        const predicted = qoa_lms_predict(weights, history);
        const quantized = stream.read(3);
        const dequantized = table[quantized];
        const reconstructed = qoa_clamp(predicted + dequantized, -32768, 32767);
        const sample = reconstructed < 0 ? reconstructed / 32768 : reconstructed / 32767;
        sampleData[idx++] = sample;
        qoa_lms_update(weights, history, reconstructed, dequantized);
        bitsRemaining -= 3;
      }
      if (bitsRemaining > 0) {
        stream.read(bitsRemaining);
      }
    }
  }
  return samples;
}
function decode(data) {
  if (data.byteLength < QOA_MIN_FILESIZE) {
    throw new Error(`QOA file size must be >= ${QOA_MIN_FILESIZE}`);
  }
  const stream = new BitInputStream(data);
  const audio = decodeHeader(stream);
  const channelData = [];
  const lmses = [];
  for (let c = 0; c < audio.channels; c++) {
    const d = new Float32Array(audio.samples);
    channelData.push(d);
    lmses.push(LMS());
  }
  let sampleIndex = 0;
  let frameLen = 0;
  do {
    frameLen = qoa_decode_frame(stream, audio, lmses, channelData, sampleIndex);
    sampleIndex += frameLen;
  } while (frameLen && sampleIndex < audio.samples);
  return {
    ...audio,
    channelData
  };
}

// src/decode-qoa.src.js
async function decode2(src) {
  let buf = src instanceof Uint8Array ? src : new Uint8Array(src);
  return decode(buf);
}
async function decoder() {
  return {
    decode: (chunk) => decode(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)),
    flush: () => ({ channelData: [], sampleRate: 0 }),
    free: () => {
    }
  };
}
export {
  decoder,
  decode2 as default
};
