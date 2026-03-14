# audio-decode [![test](https://github.com/audiojs/audio-decode/actions/workflows/test.js.yml/badge.svg)](https://github.com/audiojs/audio-decode/actions/workflows/test.js.yml)

Decode any audio format to raw samples in node or browser.<br>
No ffmpeg, no native bindings, no format-specific code.<br>

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
import decode from 'audio-decode';
```

Supported formats:
* `wav`
* `mp3`
* `ogg vorbis`
* `flac`
* `opus`
* `m4a`/`aac`
* [`qoa`](https://github.com/phoboslab/qoa).

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

Available codec keys: `mp3`, `flac`, `opus`, `oga`, `m4a`, `wav`, `qoa`.

M4A/AAC stream decoding uses the `m4a` key — there is no separate `aac` alias.

### Custom decoders

The `decoders` registry is extensible:

```js
import { decoders } from 'audio-decode';
decoders.myformat = async () => ({ decode: chunk => ..., free() {} });
```

## See also

* [wasm-audio-decoders](https://github.com/eshaz/wasm-audio-decoders) – compact & fast WASM audio decoders.
* [AudioDecoder](https://developer.mozilla.org/en-US/docs/Web/API/AudioDecoder) – native WebCodecs decoder API.
* [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) – built-in browser decoding method.
* [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) – full encoding/decoding library.

## License

[MIT](LICENSE)&nbsp;&nbsp;•&nbsp;&nbsp;<a href="https://github.com/krishnized/license/">🕉</a>
