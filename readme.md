# audio-decode [![test](https://github.com/audiojs/audio-decode/actions/workflows/test.js.yml/badge.svg)](https://github.com/audiojs/audio-decode/actions/workflows/test.js.yml)

Decode any audio format to raw samples.<br>
JS / WASM – no ffmpeg, no native bindings, works in both node and browser.<br>
Small API, minimal size, near-native performance, lazy-loading, chunked decoding.

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
import decode from 'audio-decode';

const { channelData, sampleRate } = await decode(anyAudioBuffer);
```

#### Supported formats:

| Format | Package | Engine |
|--------|---------|--------|
| MP3 | [mpg123-decoder](https://github.com/eshaz/wasm-audio-decoders/tree/main/src/mpg123-decoder) | WASM |
| WAV | [node-wav](https://www.npmjs.com/package/node-wav) | JS |
| OGG Vorbis | [@wasm-audio-decoders/ogg-vorbis](https://github.com/eshaz/wasm-audio-decoders) | WASM |
| FLAC | [@wasm-audio-decoders/flac](https://github.com/eshaz/wasm-audio-decoders) | WASM |
| Opus | [ogg-opus-decoder](https://github.com/eshaz/wasm-audio-decoders/tree/main/src/ogg-opus-decoder) | WASM |
| M4A / AAC | [@audio/aac-decode](https://github.com/audiojs/aac-decode) | WASM |
| QOA | [qoa-format](https://github.com/phoboslab/qoa) | JS |
| AIFF | [@audio/aiff-decode](https://github.com/audiojs/aiff-decode) | JS |
| CAF | [@audio/caf-decode](https://github.com/audiojs/caf-decode) | JS |
| WebM | [@audio/webm-decode](https://github.com/audiojs/webm-decode) | JS + WASM |
| AMR | [@audio/amr-decode](https://github.com/audiojs/amr-decode) | WASM |
| WMA | [@audio/wma-decode](https://github.com/audiojs/wma-decode) | WASM |

### Whole-file decode

Auto-detects format from content. Input can be _ArrayBuffer_, _Uint8Array_, or _Buffer_.

```js
import decode from 'audio-decode';

const { channelData, sampleRate } = await decode(anyAudioBuffer);
// format detected automatically — works with any supported codec
```

### Chunked decoding

For chunk-by-chunk decoding, specify the codec upfront:

```js
import { decoders } from 'audio-decode';
import audioType from 'audio-type';

// autodetect format
const format = audioType(firstChunk);        // 'mp3', 'flac', etc.
const decoder = await decoders[format]();

const a = await decoder.decode(chunk1);  // { channelData, sampleRate }
const b = await decoder.decode(chunk2);
const c = await decoder.decode();        // flush + free
```

Call `.free()` to release resources without flushing:

```js
decoder.free();
```

### Stream decoding

Decode a `ReadableStream` or async iterable:

```js
import { decodeStream } from 'audio-decode';

for await (const { channelData, sampleRate } of decodeStream(stream, 'mp3')) {
  // process each decoded chunk
}
```

Available codec keys: `mp3`, `flac`, `opus`, `oga`, `m4a`, `wav`, `qoa`, `aac`, `aiff`, `caf`, `webm`, `amr`, `wma`.

### Custom decoders

The `decoders` registry is extensible:

```js
import { decoders } from 'audio-decode';
decoders.myformat = async () => ({ decode: chunk => ..., free() {} });
```

## See also

* [audio-type](https://github.com/audiojs/audio-type) – detect audio format from buffer.
* [wasm-audio-decoders](https://github.com/eshaz/wasm-audio-decoders) – compact & fast WASM audio decoders.
* [AudioDecoder](https://developer.mozilla.org/en-US/docs/Web/API/AudioDecoder) – native WebCodecs decoder API.
* [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) – built-in browser decoding method.
* [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) – full encoding/decoding library.

## License

[MIT](LICENSE)

<a href="https://github.com/krishnized/license/">ॐ</a>
