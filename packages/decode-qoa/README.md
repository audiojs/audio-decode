# @audio/decode-qoa

Decode QOA (Quite OK Audio) to PCM samples. Self-contained bundle — no import map entries needed.

Wraps [qoa-format](https://github.com/nicokoenig/qoa-format).

```js
import decode, { decoder } from '@audio/decode-qoa'

// whole-file
let { channelData, sampleRate } = await decode(qoabuf)

// streaming (stateless — each chunk must be a complete QOA file)
let dec = await decoder()
let a = dec.decode(chunk)
dec.free()
```

## License

[MIT](./LICENSE) · [ॐ](https://github.com/krishnized/license/)
