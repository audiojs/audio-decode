# aac-decode

Decode AAC/M4A audio to PCM float samples. FAAD2 compiled to WASM — works in Node.js and browsers, no native dependencies.

## Install

```
npm i @audio/aac-decode
```

## Usage

```js
import decode from '@audio/aac-decode'

// M4A or raw ADTS — auto-detected
let { channelData, sampleRate } = await decode(uint8array)
// channelData: Float32Array[] (one per channel)
// sampleRate: number
```

### Streaming

```js
import { decoder } from '@audio/aac-decode'

let dec = await decoder()
let { channelData, sampleRate } = dec.decode(chunk)
dec.free()
```

## API

### `decode(src: Uint8Array | ArrayBuffer): Promise<AudioData>`

Whole-file decode. Auto-detects M4A (MP4 container) vs raw ADTS.

### `decoder(): Promise<AACDecoder>`

Creates a decoder instance for manual control.

- **`dec.decode(data)`** — decode chunk, returns `{ channelData, sampleRate }`
- **`dec.flush()`** — flush remaining (returns empty for AAC)
- **`dec.free()`** — release WASM memory

### `AudioData`

```ts
{ channelData: Float32Array[], sampleRate: number }
```

## Formats

- M4A / MP4 with AAC audio
- Raw ADTS streams (.aac)
- LC, HE-AAC v1/v2 (SBR, PS)

## License

GPL-2.0 (FAAD2) — [krishnized](https://github.com/krishnized/license)
