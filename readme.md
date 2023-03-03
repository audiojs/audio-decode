# audio-decode [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Decode audio data from supported format to [AudioBuffer](https://github.com/audiojs/audio-buffer).

Supported formats: `wav`, `mp3`, `ogg/vorbis`, `flac`, `alac`, `aac`, `m4a`, `opus`.

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
import decodeAudio from 'audio-decode';
import buffer from 'audio-lena/mp3';

let audioBuffer = await decode(buffer);
```

## API

**`const audioBuffer = await decode(source)`**

`source` type can be: _ArrayBuffer_, _Uint8Array_ or _Buffer_.

To enable additional format, install it as a dependency `npm install --save flac.js` and require once `require('flac.js')`.

## License

[MIT](LICENSE) &copy; <a href="https://github.com/audiojs">audiojs</a> <p align=right><a href="https://github.com/krishnized/license/">🕉</a></p>

