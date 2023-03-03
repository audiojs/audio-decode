# audio-decode [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Decode audio data from supported format to [AudioBuffer](https://github.com/audiojs/audio-buffer).

Supported formats:

* [x] `wav`
* [x] `mp3`
* [x] `ogg vorbis`
* [x] `flac`
* [x] `opus`
* [ ] `alac`
* [ ] `aac`
* [ ] `m4a`

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
import decodeAudio from 'audio-decode';
import buffer from 'audio-lena/mp3';

let audioBuffer = await decode(buffer);
```

`buffer` type can be: _ArrayBuffer_, _Uint8Array_ or _Buffer_.

## Alternative

## License

[MIT](LICENSE)&nbsp;&nbsp;•&nbsp;&nbsp;<a href="https://github.com/krishnized/license/">🕉</a>

