# @audio/decode-flac

Decode FLAC audio to PCM samples. Self-contained WASM bundle — no import map entries needed.

Wraps [@wasm-audio-decoders/flac](https://github.com/eshaz/wasm-audio-decoders).

```js
import decode, { decoder } from '@audio/decode-flac'

// whole-file
let { channelData, sampleRate } = await decode(flacbuf)

// streaming
let dec = await decoder()
let a = dec.decode(chunk1)
let b = dec.decode(chunk2)
let c = dec.flush()
dec.free()
```

## License

[MIT](./LICENSE) · [ॐ](https://github.com/krishnized/license/)
