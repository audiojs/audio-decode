# audio-decode [![Build Status](https://travis-ci.org/audiojs/audio-decode.svg?branch=master)](https://travis-ci.org/audiojs/audio-decode) [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges) [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/audio-decode.svg)](https://greenkeeper.io/)

Convert `mp3`/`wav` audio data to [AudioBuffer](https://github.com/audiojs/audio-buffer).

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
const decode = require('audio-decode');
const buffer = require('audio-lena/mp3');

//as a callback
decode(buffer, (err, audioBuffer) => {});

//as a promise
decode(buffer).then(audioBuffer => {}, err => {});
```

## API

**`let promise = decode(source, {context}?, (err, audioBuffer)=>{}?)`**

Decode `source`, based on `options` and fire `callback` when done, or resolve a promise if no callback passed. Source type can be: _ArrayBuffer_, _ArrayBufferView_, _Buffer_, _Blob_, _File_ or data-uri string.

`options` may include `context` property for web-audio-api context (browser-only). By default new [audio-context](https://npmjs.org/package/audio-context) is created.

## Supported formats

Browser version uses [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData) method, in node the [aurora](https://npmjs.org/package/av) is used.

Shipped by default:

* _wav_ via [wav-decoder](https://github.com/mohayonao/wav-decoder)
* _mp3_ via [aurora mp3](https://github.com/audiocogs/mp3.js)

To enable additional format, install it as a dependency `npm install --save flac.js` and require once `require('flac.js')`.

Additional formats available:

* _flac_ via [flac.js](https://github.com/audiocogs/flac.js)
* _alac_ via [alac.js](https://github.com/audiocogs/alac.js)
* _aac_ via [aac.js](https://github.com/audiocogs/aac.js)
* _ogg/vorbis_ via [vorbis.js](https://github.com/audiocogs/vorbis.js)
* _opus_ via [opus.js](https://github.com/audiocogs/opus.js)

```js
// Decode flac
let decode = require('audio-decode')
let flac = require('audio-lena/flac')
require('flac.js')

decode(flac).then(audioBuffer => {
	//buffer is ready here
})
```

## Credits

* [@mohayonao](https://github.com/mohayonao/) for [wav-decoder](https://github.com/mohayonao/wav-decoder).
* [@devongovett](https://github.com/devongovett) and [@jensnockert](https://github.com/jensnockert) for [aurora.js](https://github.com/audiocogs/aurora.js).
* [@jamen](https://github.com/jamen) as originator of this package.

## Related

* [context.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData) web-audio-api

## License

[MIT](LICENSE) &copy; <a href="https://github.com/audiojs">audiojs</a>.
