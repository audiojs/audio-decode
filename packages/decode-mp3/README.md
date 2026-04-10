# @audio/decode-mp3

Decode MP3 audio to PCM samples. Self-contained WASM bundle — no import map entries needed.

Wraps [mpg123-decoder](https://github.com/eshaz/wasm-audio-decoders/tree/main/src/mpg123-decoder).

```js
import decode, { decoder } from '@audio/decode-mp3'

// whole-file
let { channelData, sampleRate } = await decode(mp3buf)

// streaming
let dec = await decoder()
let a = dec.decode(chunk1)
let b = dec.decode(chunk2)
let c = dec.flush()
dec.free()
```

## License

[MIT](./LICENSE) · [ॐ](https://github.com/krishnized/license/)
